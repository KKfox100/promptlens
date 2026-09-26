'use strict';

/**
 * PromptLens 引擎
 * ------------------------------------------------------------------
 * 职责：
 *   1. 解析用户原始输入，识别场景、提取线索、给原始 Prompt 打分
 *   2. 以「队列 + 分批」的方式驱动多轮拆解，选择项自带 followUps 会插队追问
 *   3. 把用户的所有选择组装成结构化的最终 Prompt
 *   4. 计算优化后的质量分，并生成「你做了哪些决定」的清单
 */

(function (root) {
  const K = root.PromptLensKnowledge
    || (typeof require === 'function' ? require('./knowledge.js') : null);
  if (!K) throw new Error('engine.js 需要先加载 knowledge.js');

  /**
   * 散句文案。`K.t` 内部是**调用时**才去查表的（浏览器里委托给 i18n.js，
   * Node 里读 ui.<tag>.js），所以这里取一次别名是安全的 ——
   * 不会把「还没装载的文案包」的查表结果钉死。
   */
  const t = K.t;

  /**
   * 输出里的连接符也要跟着语种走。
   *
   * 中文用全角「，；、。」，英 / 西语用「, ; , .」，日语用「、；、。」——
   * 这些符号是**句子的语法**，不是装饰，所以它们和 fragment 一样属于文案。
   * 用标点本身当 key，和「以中文原文为 key」是同一条规矩。
   * 取不到时原样返回，所以简体（空表）的输出一个字符都不会变。
   */
  const J = {
    comma: () => t('，'),
    semi: () => t('；'),
    list: () => t('、'),
  };

  /** 每轮呈现几个问题 */
  const BATCH_SIZE = 2;

  /**
   * 「我自己补充 / 跳过」是引擎注入的伪选项，不是知识库数据，
   * 所以文案写在这里而不是文案包里。用 getter 是为了**渲染那一刻**才查表 ——
   * 这两个对象在模块装载时就建好了，那时文案包可能还没就位。
   */
  const CUSTOM_OPTION = {
    id: '__custom__',
    get label() { return t('我自己补充'); },
    get hint() { return t('用我自己的话写'); },
    custom: true,
  };
  const SKIP_OPTION = {
    id: '__skip__',
    get label() { return t('拿不准，跳过这题'); },
    get hint() { return t('不选也没关系'); },
    skip: true,
  };
  const SKIP_OPTION_OPTIONAL = {
    id: '__skip__',
    get label() { return t('这些都不需要'); },
    get hint() { return t('跳过也没关系'); },
    skip: true,
  };

  /* ---------------------------------------------------------------- *
   * 取题：统一选项结构，过滤场景，追加「自定义 / 跳过」
   * ---------------------------------------------------------------- */

  function getQuestion(qid, scenarioId) {
    const raw = K.QUESTIONS[qid];
    if (!raw) return null;

    let list = [];
    if (raw.perScenario) {
      list = raw.perScenario[scenarioId] || raw.perScenario.general || [];
    } else if (raw.options) {
      list = raw.options.filter((opt) => {
        if (!opt.scenarios || !opt.scenarios.length) return true;
        return opt.scenarios.indexOf(scenarioId) !== -1;
      });
    }
    if (!list.length) return null;

    const options = list.map((opt) => ({
      id: opt.id,
      label: opt.label,
      hint: opt.hint || '',
      fragment: opt.fragment || '',
      followUps: opt.followUps || [],
      // group：同一组内的选项天然互斥（不能同时是「柔和自然光」和「硬光」）
      group: opt.group || '',
      // demo：「没选 / 选了」的对照示例（图片是一组渲染参数，文字是一段示例文案）。
      // 这里是白名单式构造，字段忘了带过来界面就会静默地什么都不显示。
      demo: opt.demo || null,
      // 分镜用：这条时长对应多少秒、最多装几个镜头。
      // 同样是白名单式构造 —— 忘了带过来分镜表就永远生不出来（已经栽过一次）。
      seconds: opt.seconds || 0,
      maxShots: opt.maxShots || 0,
      // 情绪走向用：每一镜处在情绪的哪个阶段（「先静下来 / 慢慢起势 / 推上去 / 释放」）。
      // 同属白名单式构造 —— 忘了带过来，四个镜头的氛围就会退化成同一句光线描述。
      arc: opt.arc || null,
      skip: false,
      custom: false,
    }));

    options.push(raw.optional ? Object.assign({}, SKIP_OPTION_OPTIONAL) : Object.assign({}, SKIP_OPTION));
    options.push(Object.assign({}, CUSTOM_OPTION));

    return {
      id: qid,
      dim: raw.dim,
      title: raw.title,
      question: raw.question,
      helper: raw.helper || '',
      multi: !!raw.multi,
      optional: !!raw.optional,
      maxPick: raw.maxPick || 0,
      // 对照示例：demoKind 决定用图还是用文字，demoBase / demoBefore 是「没选这一条」时的样子
      demoKind: raw.demoKind || '',
      demoBase: raw.demoBase || null,
      demoBefore: raw.demoBefore || '',
      options,
    };
  }

  /* ---------------------------------------------------------------- *
   * 选择规则
   * ---------------------------------------------------------------- *
   * 多选题有两个必须守住的约束，否则用户能拼出自相矛盾的 Prompt：
   *   1) maxPick —— 「风格最多选 2 个」这种承诺要真的兑现；
   *   2) group   —— 同组选项天然互斥，不能同时是「柔和自然光」和「硬光」。
   * 两个约束都收敛在这里，问答界面和「改上一处」弹窗共用同一套逻辑。
   */

  const PSEUDO_IDS = ['__skip__', '__custom__'];

  /**
   * 取一个选项的互斥组。
   * - `group: 'lens'`         → 只和同组选项互斥
   * - `group: ['a', 'b']`     → 任一命中即互斥（一个选项可以同时属于多个互斥维度）
   * - `group: '*'`            → 「全不选」型选项（如「不需要声音」），和任何其它选项都互斥
   */
  function groupsOf(opt) {
    if (!opt || !opt.group) return [];
    return Array.isArray(opt.group) ? opt.group : [opt.group];
  }

  /** 两个选项是否互斥 */
  function conflict(a, b) {
    const ga = groupsOf(a);
    const gb = groupsOf(b);
    if (ga.indexOf('*') !== -1 || gb.indexOf('*') !== -1) return true;
    return ga.some((g) => gb.indexOf(g) !== -1);
  }

  /** 一次点击后的新选中结果（纯函数，不改入参） */
  function toggleOption(q, selected, optId) {
    const list = (selected || []).slice();
    const opt = (q.options || []).find((o) => o.id === optId);
    if (!opt) return list;

    const idx = list.indexOf(optId);

    // 跳过 / 自定义都是「整题互斥」的，点了就替换掉其它所有选择
    if (opt.skip || opt.custom) {
      return idx !== -1 ? [] : [optId];
    }

    if (!q.multi) {
      return idx !== -1 ? [] : [optId];
    }

    if (idx !== -1) {
      list.splice(idx, 1);
      return list;
    }

    // 新选中一项：先把「伪选项」和所有互斥的旧选择挤掉
    const next = list.filter((id) => {
      if (PSEUDO_IDS.indexOf(id) !== -1) return false;
      const other = (q.options || []).find((o) => o.id === id);
      if (!other) return true;
      return !conflict(opt, other);
    });

    // 再检查数量上限：超了就顶掉最早选的那个，保证这次点击一定生效
    const max = q.maxPick || 0;
    if (max) {
      const real = next.filter((id) => PSEUDO_IDS.indexOf(id) === -1);
      while (real.length >= max) {
        const dropped = real.shift();
        next.splice(next.indexOf(dropped), 1);
      }
    }

    next.push(optId);
    return next;
  }

  /**
   * 把一组已选 id 收敛成合法状态。
   * 用于装配前兜底：历史记录、导入数据、旧版本存档都可能带着矛盾的选择。
   */
  function normalizeSelection(q, selected) {
    if (!q) return (selected || []).slice();
    const out = [];

    (selected || []).forEach((id) => {
      const opt = (q.options || []).find((o) => o.id === id);
      if (!opt) return;

      // 伪选项一旦出现，其它选择全部作废
      if (opt.skip || opt.custom) {
        out.length = 0;
        out.push(id);
        return;
      }
      if (out.some((x) => PSEUDO_IDS.indexOf(x) !== -1)) return;

      // 与已保留的选项冲突则丢掉后来的
      const clash = out.some((keepId) => {
        const keep = (q.options || []).find((o) => o.id === keepId);
        return keep && conflict(opt, keep);
      });
      if (clash) return;

      out.push(id);
    });

    const max = q.maxPick || 0;
    if (max) {
      const real = out.filter((id) => PSEUDO_IDS.indexOf(id) === -1);
      if (real.length > max) {
        const keep = {};
        real.slice(0, max).forEach((id) => { keep[id] = true; });
        return out.filter((id) => PSEUDO_IDS.indexOf(id) !== -1 || keep[id]);
      }
    }
    return out;
  }

  /* ---------------------------------------------------------------- *
   * 会话
   * ---------------------------------------------------------------- */

  function createSession(originalPrompt) {
    const text = String(originalPrompt || '');
    const detected = K.detectScenario(text);
    const scenarioId = detected.matched.id;
    const family = K.familyOf(scenarioId);
    const signals = K.extractSignals(text, family);
    const core = K.FLOWS[family].core;

    return {
      originalPrompt: text,
      scenarioId,
      scenarioName: detected.matched.name,
      scenarioIcon: detected.matched.icon,
      family,
      candidates: detected.ranked,
      signals,
      scoreBefore: K.scoreOriginalPrompt(text, signals, family),
      queue: core.slice(),
      seen: core.reduce((acc, id) => { acc[id] = true; return acc; }, {}),
      tailAdded: false,
      answers: {},
      customs: {},
      round: 0,
      totalRounds: 0,
      current: [],
      done: false,
    };
  }

  /**
   * 用户手动改场景时，同步刷新 family、信号与评分标准。
   *
   * `opts.restart` 用于**已经开始问答之后**换场景 —— 换场景等于换一整套问题：
   *
   * - 旧答案的 qid 和**选项 id** 都属于旧 family（`intent` 就是 perScenario 的，
   *   各场景选项 id 完全不同）。留着不会报错，只会在 `activeQids` 里变成
   *   「断掉的旧答案」，悄悄影响得分和成品 —— 正是这个项目最怕的那类失效。
   * - 分镜表同理：它是按旧 family 的景别 / 运镜排出来的，换到文字链路后毫无意义。
   *
   * 所以整轮重来：清空答案、把队列拨回新 family 的 core、清掉分镜表。
   * 这几件事**必须由引擎裁决** —— 界面自己抄一遍 `createSession` 迟早会漏字段
   * （漏一个的症状就是「换完场景之后某个状态还留着」，而且不报错）。
   *
   * 但**重建队列不是 restart 的专利**：只要 family 变了就必须重建。
   * `createSession` 按「原话识别出来的 family」铺队列，紧接着界面又用用户手选的
   * 场景调一次本函数 —— 两者不一致时，会话会自称视频、却一路问图片的题，
   * 用户永远等不到「镜头景别」。这条路径上没有 `restart`，只有 family 的变化。
   *
   * 注意别顺手把 `answers` 也一起清了：`restoreSession` 是带着历史答案走这条路的，
   * 清了就等于毁掉用户记录。要不要清，由调用方用 `opts.restart` 明确表达。
   */
  function setScenario(session, scenarioId, opts) {
    const sc = K.SCENARIOS.find((s) => s.id === scenarioId);
    if (!sc) return session;
    // 换 family 就必须重建队列：queue 里存的是旧 family 的 qid，留着会得到
    // 最别扭的一种状态 —— 会话自称「视频生成」，问出来的却是图片的题，
    // 用户手选了视频却一路等不到「镜头景别」。
    const prevFamily = session.family;
    session.scenarioId = sc.id;
    session.scenarioName = sc.name;
    session.scenarioIcon = sc.icon;
    session.family = K.familyOf(sc.id);
    session.signals = K.extractSignals(session.originalPrompt, session.family);
    session.scoreBefore = K.scoreOriginalPrompt(session.originalPrompt, session.signals, session.family);

    const familyChanged = session.family !== prevFamily;
    if (familyChanged || (opts && opts.restart)) {
      const core = (K.FLOWS[session.family] || K.FLOWS.text).core;
      session.queue = core.slice();
      session.seen = core.reduce((acc, id) => { acc[id] = true; return acc; }, {});
      session.tailAdded = false;
    }

    // 只换 family 时不动 answers/customs：restoreSession 会带着历史答案走这条路，
    // 清掉就等于毁掉用户的记录。真正「从头再来」由 opts.restart 表达。
    if (opts && opts.restart) {
      session.answers = {};
      session.customs = {};
      session.round = 0;
      session.totalRounds = 0;
      session.current = [];
      session.done = false;
      delete session.storyboardEdit;
    }
    return session;
  }

  /** 取下一批问题 */
  function nextRound(session) {
    if (session.done) return [];

    const batch = [];
    while (batch.length < BATCH_SIZE && session.queue.length) {
      const qid = session.queue.shift();
      const q = getQuestion(qid, session.scenarioId);
      if (q) batch.push(q);
    }

    if (batch.length === 0) {
      if (!session.tailAdded) {
        session.tailAdded = true;
        const tail = (K.FLOWS[session.family] || K.FLOWS.text).tail;
        session.queue = tail.filter((id) => getQuestion(id, session.scenarioId));
        return nextRound(session);
      }
      session.done = true;
      session.current = [];
      return [];
    }

    session.round += 1;
    session.current = batch.map((q) => q.id);
    return batch;
  }

  /**
   * 提交一批答案并推进
   * @param {object} session
   * @param {object} answers { [qid]: { selected: string[], custom?: string } }
   */
  function submitRound(session, answers) {
    const incoming = [];
    let customOnly = 0;

    session.current.forEach((qid) => {
      const ans = answers[qid];
      if (!ans) return;

      const selected = Array.isArray(ans.selected) ? ans.selected.slice() : [];
      const customText = String(ans.custom || '').trim();

      session.answers[qid] = selected;
      if (customText) {
        session.customs[qid] = customText;
        customOnly += 1;
      }

      const q = getQuestion(qid, session.scenarioId);
      if (!q) return;

      selected.forEach((optId) => {
        const opt = q.options.find((o) => o.id === optId);
        if (!opt || !opt.followUps || !opt.followUps.length) return;
        opt.followUps.forEach((fid) => {
          if (session.seen[fid]) return;
          if (!getQuestion(fid, session.scenarioId)) return;
          session.seen[fid] = true;
          incoming.push(fid);
        });
      });
    });

    if (incoming.length) {
      session.queue = incoming.concat(session.queue);
    }

    session.current = [];
    session.customOnlyCount = (session.customOnlyCount || 0) + customOnly;
    session.totalRounds = session.round;

    return nextRound(session);
  }

  /* ---------------------------------------------------------------- *
   * 组装最终 Prompt
   * ---------------------------------------------------------------- */

  /**
   * 这次装配里，哪些题「还在流程上」。
   *
   * 为什么需要：有一批题只作为追问出现（vid.bgm、format.article.length、
   * img.subject.person、role.stance … 共 21 道）。用户先答了追问、再回头把父题
   * 换成另一条分支时，那条追问答案就成了孤儿 —— 它所属的分支已经不在流程上了，
   * 可它的 fragment 照样会被拼进 Prompt。于是出现「声音选了『不需要声音』，
   * 成品里却写着慢板钢琴」这种自相矛盾。
   *
   * 判法：从 FLOWS 出发，沿着「当前已选选项的 followUps」正向走一遍，
   * 走得到的题才算在流程上。这样连带链条（A → B → C）也自动处理：
   * A 不在了，B 就走不到，C 自然也不在。
   *
   * 注意这里**只判「生效与否」，不删答案**。答案留在 session.answers 里，
   * 用户把父题改回原来那条分支，这一项就自动恢复生效 —— 不用重新答一遍。
   * 界面据此在「改上一处」列表里把不生效的行标出来。
   */
  function activeQids(session) {
    const flow = K.FLOWS[session.family] || K.FLOWS.text;
    const active = {};
    const seen = {};
    const queue = (flow.core || []).concat(flow.tail || []);

    while (queue.length) {
      const qid = queue.shift();
      if (seen[qid]) continue;
      seen[qid] = true;
      const q = getQuestion(qid, session.scenarioId);
      if (!q) continue;
      active[qid] = true;
      normalizeSelection(q, session.answers[qid]).forEach((optId) => {
        const opt = q.options.find((o) => o.id === optId);
        if (!opt) return;
        (opt.followUps || []).forEach((f) => queue.push(f));
      });
    }
    return active;
  }

  function collectFragments(session) {
    const sections = {};
    const decisions = [];
    const active = activeQids(session);

    Object.keys(session.answers).forEach((qid) => {
      const q = getQuestion(qid, session.scenarioId);
      if (!q) return;
      // 追问链已经断掉的旧答案不参与装配。答案本身留着（见 activeQids 的说明），
      // 所以这里不是「删掉用户的选择」，而是「不拿一条已经失效的选择去拼 Prompt」。
      if (!active[qid]) return;
      // 兜底收敛：历史记录 / 旧存档里可能带着互斥或超量的选择
      const selected = normalizeSelection(q, session.answers[qid]);
      const labels = [];
      const texts = [];

      selected.forEach((optId) => {
        const opt = q.options.find((o) => o.id === optId);
        if (!opt || opt.skip) return;
        if (opt.custom) return;
        if (opt.fragment) texts.push(opt.fragment);
        labels.push(opt.label);
      });

      const customText = session.customs[qid];
      if (customText) {
        texts.push(customText);
        labels.push(t('自定义：') + customText);
      }

      if (labels.length) {
        decisions.push({
          qid,
          dim: q.dim,
          title: q.title,
          question: q.question,
          labels,
          custom: !!customText,
        });
      }

      if (texts.length) {
        if (!sections[q.dim]) sections[q.dim] = [];
        sections[q.dim] = sections[q.dim].concat(texts);
      }
    });

    return { sections, decisions };
  }

  const CONSTRAINT_DIMS = ['constraint'];

  function buildPromptText(session, sections) {
    const lines = [];
    const original = String(session.originalPrompt || '').trim();

    K.SECTION_ORDER.forEach((dim) => {
      const texts = (sections[dim] || []).slice();

      // 任务段始终以用户的原话开头 —— 保证最终 Prompt 里保留的是「你想说的」，
      // 而不是被模型改写过的版本。
      if (dim === 'task') {
        if (original) texts.unshift(original);
        if (!texts.length) return;
      } else if (!texts.length) {
        return;
      }

      lines.push('# ' + K.SECTION_TITLES[dim]);
      lines.push('');

      if (CONSTRAINT_DIMS.indexOf(dim) !== -1) {
        texts.forEach((t) => lines.push('- ' + t));
        lines.push('');
      } else {
        texts.forEach((t) => {
          lines.push(t);
          lines.push('');
        });
      }
    });

    return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  /**
   * 图片 / 视频类 Prompt 的组装方式。
   * 这类模型吃的是「一段连贯的自然语言描述」，不是分节文档 ——
   * 分节反而会稀释权重，所以拼成一段话，负面词单独输出。
   */
  function buildVisualPrompt(session, sections, order, joiner, endPunct) {
    const parts = [];
    const original = String(session.originalPrompt || '').trim().replace(/[。，,；;、\s]+$/, '');
    if (original) parts.push(original);

    // 「细节焦点」只对近处景别成立 —— 全景里让观众看清面部表情是自相矛盾的。
    // 分镜那条路径本来就按景别过滤，连续描述这条必须用同一条规则，
    // 否则同一个选择在多镜头和单镜头下会有两种行为。
    // 用 every 而不是 some：单镜头场景下列出多个景别时，焦点归谁说不清楚，宁可不要。
    const shots = pickedOptions(session, 'vid.shot');
    const closeOnly = shots.length > 0 && shots.every((s) => FOCUS_SHOTS[s.id]);

    (order || []).forEach((dim) => {
      if (dim === 'negative') return;
      if (dim === 'focus' && !closeOnly) return;
      // 注意这里**不能**跳过 task。图片 / 视频的第一题（intent）dim 就是 task，
      // 它的片段写的是「商业海报用途，构图要预留标题文字的空间」这类实打实的要求，
      // 跳掉等于用户答了第一题却对成品毫无影响 —— 界面完全看不出来。
      // 原话已经在上面单独放在开头，sections.task 里只有 intent 的片段，不会重复。
      (sections[dim] || []).forEach((t) => {
        const clean = String(t).trim().replace(/[。；;]+$/, '');
        if (clean) parts.push(clean);
      });
    });

    // 连接符和句末符号都来自文案包 —— **不许把「，」「。」写进逻辑里**。
    // 英文的连接符是 ', '、句末是 '.'，写死全角的话两条判断都不命中：
    // 压重压不掉（用户自定义文本里带个逗号就拼出「a, , b」），
    // 句末判断为假（英文的单镜头视频描述结尾没有句号）。而且都不报错。
    const sep = joiner || t('，');
    // 压重拿**分隔符本身**去压：分隔符可能出现在片段末尾（用户自定义文本里就会有），
    // 直接 join 会拼出两个连着的分隔符。
    const text = parts.join(sep).split(sep + sep).join(sep);
    const end = endPunct || '';
    if (!end) return text;
    return text.slice(-end.length) === end ? text : text + end;
  }

  function buildNegativePrompt(sections) {
    const seen = {};
    return (sections.negative || [])
      .map((t) => String(t).trim())
      .filter((t) => {
        if (!t || seen[t]) return false;
        seen[t] = true;
        return true;
      })
      .join(', ');
  }

  /** 取某题被选中的选项对象（已过一遍互斥 / 上限收敛，脏数据也拦得住） */
  function pickedOptions(session, qid) {
    const q = getQuestion(qid, session.scenarioId);
    if (!q) return [];
    // 追问链断掉的旧答案同样不能在这里被读到 —— 分镜表是直接按 qid 取选项的，
    // 不在这里拦一道，collectFragments 里的过滤就会被绕过去。
    if (!activeQids(session)[qid]) return [];
    return normalizeSelection(q, session.answers[qid])
      .map((id) => q.options.find((o) => o.id === id))
      .filter((o) => o && !o.skip && !o.custom && o.fragment);
  }

  /** 秒数补零成 mm:ss，分镜表的时间码要用 */
  function timecode(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  /**
   * 从用户原话里挑一句最能代表画面的短语。
   *
   * 为什么要挑：分镜的每一镜都可能被**单独拿去生成**（超过 15 秒的片子，
   * 我们的用法说明就是让用户逐镜生成再拼接），所以每一镜的画面描述必须自带主体，
   * 不能只靠开头那一句【核心主题】。
   *
   * 挑法：按句切分后取最长的那一句。短句多半是情绪或修饰（「主打氛围感」），
   * 长句才装得下「谁、在哪、在做什么」。
   *
   * 长度上限是为了防一种情况：用户写了一整段没有句号，那一整段会在每一镜里重复，
   * 四镜下来凭空多出一两千字。所以优先挑「装得下又不撑爆」的句子，全都太长才截断。
   */
  const SCENE_PHRASE_MAX = 48;

  function scenePhrase(original) {
    const clauses = String(original || '')
      .split(/[。！？!?；;\n]+/)
      .map((s) => s.trim().replace(/^[，,、\s]+|[，,、\s]+$/g, ''))
      .filter((s) => s.length >= 4);
    if (!clauses.length) return '';
    const fits = clauses.filter((s) => s.length <= SCENE_PHRASE_MAX);
    if (fits.length) return fits.slice().sort((a, b) => b.length - a.length)[0];
    const longest = clauses.slice().sort((a, b) => b.length - a.length)[0];
    return longest.slice(0, SCENE_PHRASE_MAX) + '…';
  }

  /**
   * 第 index 镜处在情绪走向的哪个阶段。
   *
   * 开场取第 1 段、收尾取最后 1 段、中间按比例取 ——
   * 这样镜头数从 3 变 4 时，中间那几镜不会总是取到同一段。
   */
  function arcStage(arc, index, total) {
    if (!arc || !arc.length) return '';
    if (total <= 1 || index === 1) return arc[0];
    if (index === total) return arc[arc.length - 1];
    const mid = arc.slice(1, -1);
    if (!mid.length) return arc[0];
    const span = Math.max(1, total - 3);
    const pos = Math.min(mid.length - 1, Math.round(((index - 2) / span) * (mid.length - 1)));
    return mid[pos];
  }

  /**
   * 「画面细节」拆成两份：
   *   - list：头部清单用的短词（选项用 label，自定义用原文）
   *   - assignable：分配给镜头的顺序 —— **自定义写的排前面**
   *
   * 为什么自定义优先：选项给的是「元素类别」（反光与倒影），
   * 自定义写的是「这条片子特有的东西」（伞面的雨珠）。
   * 镜头位有限时显然该先安排后者 —— 用户自己动手写的那几条，才是他真正在意的。
   * 自定义文本按逗号 / 顿号 / 分号拆开，helper 里就是这么示范的。
   */
  function detailPlan(session) {
    const options = pickedOptions(session, 'vid.detail');
    const custom = String(session.customs['vid.detail'] || '')
      .split(/[、,，;；\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    return {
      list: custom.concat(options.map((o) => o.label)),
      assignable: custom.concat(options.map((o) => o.fragment)),
    };
  }

  /** 只有近处镜头才谈得上「焦点」——全景里让观众看清面部表情是自相矛盾的 */
  const FOCUS_SHOTS = { 'vsh.close': true, 'vsh.cu': true, 'vsh.macro': true };

  /**
   * 这一镜在片子里「负责什么」。
   * 位置决定作用（开场 / 推进 / 收尾），景别决定理由 ——
   * 两句都来自用户自己的选择，不是引擎编的剧情。
   */
  function shotRole(shot, index, total) {
    const label = shot.label || '';
    const why = (K.SHOT_ROLE || {})[shot.id] || '';
    if (index === 1) return t('开场 —— 用{shot}切入，{why}', { shot: label, why: why });
    if (index === total) return t('收尾 —— 用{shot}收束，{why}', { shot: label, why: why });
    return t('推进 —— 用{shot}承接，{why}', { shot: label, why: why });
  }

  /* ---------------- 分镜表：计划与渲染分两层 ---------------- *
   *
   * 分镜表的「可编辑最小单位」是一条 entry：
   *   { shotId, moveId, seconds, cell, focus, frameStart, frameEnd }
   *
   * `frameStart` / `frameEnd` 是这一镜的「首帧 / 尾帧从哪来」（见 K.FRAME_MODES），
   * 没指定时是 null。它们是**位置敏感**的：`frameStart` 可以是「沿用上一个分镜的尾帧」，
   * 而这个说法在第一个分镜上不成立 —— 所以上下移动镜头之后必须重新收敛一次
   * （见 dropDanglingPrev）。这类字段不能只靠「存的时候校验一遍」，
   * 因为它会因为别人挪了位置而变得非法。
   *
   * 为什么把「镜头内容」压成一格文本（cell）而不是留着 detail / content 两个字段：
   * 用户看到的、想改的就是表格里的那一格。拆成两半之后，他改完这一格，
   * 引擎还得反推是哪一半变了 —— 不如让这一格就是一个字符串。
   *
   * 位置相关的字段（第几镜、起止时间码、情绪阶段）**不在** entry 里：
   * 它们由 renderStoryboard 按位置派生。重排顺序之后时间码和情绪推进要跟着位置走，
   * 而不是跟着某一镜原来的位置走。
   *
   * 自动计划和手工调整走的是**同一条**渲染路径。分成两条的话，
   * 手工那条迟早会漏掉后来加的功能（时间码、情绪阶段、BGM 走向……）。
   */

  const STORYBOARD_SEC_MIN = 1;
  const STORYBOARD_SEC_MAX = 60;
  const STORYBOARD_CELL_MAX = 200;
  /**
   * 首尾帧「从文件导入」时记下的路径长度上限。
   * 比镜头内容长得多（Windows 上一条路径轻松上百字符），所以单独一个上限；
   * 文件名和备注跟镜头内容是一个量级，共用 STORYBOARD_CELL_MAX。
   */
  const STORYBOARD_PATH_MAX = 300;

  /**
   * 手工加减镜头的上下限。
   *
   * 下限 2 而不是 1：只剩一镜就不叫分镜了 —— 那是「一段连续描述」，
   * 引擎本来就会把它渲染成连续描述而不是表格。让用户在编辑器里删到 1，
   * 结果只会是「表没了」，不如在还差一步的时候就拦住并说明原因。
   *
   * 上限 12：时长题给的 `maxShots` 只是引擎按秒数估的「大概能装几个」，
   * 用户手工排的时候不该被它卡住（他自己在填每一镜的秒数）。
   * 但也不能没有上限 —— 几十行的分镜表没人执行得下去，
   * 每镜一两秒的「分镜」也早就不是分镜了。
   */
  const STORYBOARD_SHOT_MIN = 2;
  const STORYBOARD_SHOT_MAX = 12;

  /**
   * 决定分镜表**内容本身**的那几道题 —— 也就是答案最终是「装进 entry 里」的题。
   *
   * 用户手工调整过之后，只要这几道题没变，手工调整就继续生效；
   * 一旦变了就整份作废、重新自动生成 —— 否则会拿一张和当前选择对不上的表糊弄用户
   * （景别从 4 个改成 2 个，表里还留着 4 行）。
   *
   * 判断标准只有一条：**这道题的答案是不是通过 entry 进入输出的**。
   *   - `vid.shot`      → 有几个镜头、哪几个（entries 的 shotId）
   *   - `vid.move`      → 每镜的运镜（entries 的 moveId）
   *   - `vid.duration`  → 总秒数 + 镜头上限（entries 的条数与 seconds）
   *   - `vid.detail`    → 每镜「镜头内容」的前半段（entries 的 cell）
   *   - `vid.cut`       → **全片有几个镜头**（一镜到底直接否决整张表）
   * 这几道一变，手工表里存的值就和用户的新选择矛盾了，只能作废。
   *
   * `vid.cut` 是最容易漏的一个：它不往 entry 里存任何字段，却决定了
   * entries 该不该存在。漏掉它的症状正是这个项目最怕的那类 ——
   * 用户回头把「剪辑结构」改成「一镜到底」，成品里还留着 3 行的分镜表，
   * 答案说 1 镜、表里 3 镜，而界面上什么都不说。
   *
   * 反过来，**不走 entry、由渲染时现取的**那些题绝不能放进来：
   *   - `vid.arc`   → 只决定每镜的「情绪阶段」，按位置现算
   *   - `vid.focus` → 只决定头部【细节焦点】和逐镜的焦点片段
   *   - `vid.style` → 只决定头部【摄影语言】
   *   - 光线 / 画幅 / 配乐 / 负面……同理
   * 把它们算进签名，就等于「用户回头调一下情绪走向，辛苦排的镜头顺序和时长全没了」——
   * 而这些题的新答案本来就能正常进输出，作废纯属误伤。
   * （注意 `vid.style` 和 `vid.cut` 的区别：前者只影响头部的措辞，
   *   后者决定整张表成不成立 —— 长得很像，判定结果相反。）
   */
  const STORYBOARD_INPUTS = ['vid.shot', 'vid.move', 'vid.duration', 'vid.detail', 'vid.cut'];

  function storyboardSignature(session) {
    const parts = STORYBOARD_INPUTS.map((qid) => {
      const q = getQuestion(qid, session.scenarioId);
      const sel = q ? normalizeSelection(q, session.answers[qid]) : [];
      return qid + '=' + sel.join(',');
    });
    parts.push('custom=' + String((session.customs || {})['vid.detail'] || ''));
    return parts.join('|');
  }

  /** 某道题的全部可选项，只留界面要渲染的两个字段 */
  function allOptionsOf(session, qid) {
    const q = getQuestion(qid, session.scenarioId);
    return ((q && q.options) || [])
      .filter((o) => !o.skip && !o.custom && o.fragment)
      .map((o) => ({ id: o.id, label: o.label }));
  }

  /** 分镜表要用到的所有选择，一次取齐（顺带给出 id → 选项的查表） */
  function storyboardInputs(session) {
    const lookupOf = (qid) => {
      const q = getQuestion(qid, session.scenarioId);
      const map = {};
      ((q && q.options) || []).forEach((o) => { map[o.id] = o; });
      return map;
    };
    return {
      shots: pickedOptions(session, 'vid.shot'),
      moves: pickedOptions(session, 'vid.move'),
      // 剪辑结构：全片一个镜头还是多个镜头。它决定分镜表成不成立。
      cuts: pickedOptions(session, 'vid.cut'),
      durs: pickedOptions(session, 'vid.duration'),
      styles: pickedOptions(session, 'vid.style'),
      ratios: pickedOptions(session, 'vid.ratio'),
      bgms: pickedOptions(session, 'vid.bgm'),
      arcs: pickedOptions(session, 'vid.arc'),
      focus: pickedOptions(session, 'vid.focus')[0] || null,
      detail: detailPlan(session),
      // 手工编辑可以把景别换成「他原本没选的那个」，所以查表必须覆盖全部选项。
      // 只在已选列表里找的话，换过景别的镜头会拿不到 label。
      shotById: lookupOf('vid.shot'),
      moveById: lookupOf('vid.move'),
      // 全部景别选项（不含跳过 / 自定义），按知识库顺序。
      // 「生成分镜表」时如果用户只选了一个景别，要靠它把表补到最少两镜。
      shotAll: allOptionsOf(session, 'vid.shot'),
    };
  }

  /**
   * 自动分镜计划。
   *
   * 什么时候才有：镜头数 ≥ 2。而镜头数完全由用户决定 ——
   * 他选了几个景别，就是想看几个镜头；时长题只负责给出总秒数与上限。
   * 所以「3-5 秒」这种单镜头时长下不会硬塞分镜表，仍然输出一段连续描述。
   * 另外「剪辑结构 = 一镜到底」是明确的单镜头诉求，塞分镜表等于自相矛盾。
   *
   * 注意这里**只看 `vid.cut`，不看 `vid.style`**。一镜到底曾经住在影像风格里，
   * 于是「选了电影感」和「选了一镜到底」在这个判断里是同一件事；
   * 现在影像风格纯讲质感，一镜到底归剪辑结构，两者互不干扰。
   */
  /**
   * 按给定的镜头列表和总时长排一张分镜计划。
   * 时长先平均，余数补给最后一个镜头 —— 收尾多停一会儿比平均分更稳。
   *
   * 镜头列表是显式传进来的（而不是直接用 `inp.shots`）：「生成分镜表」那条路
   * 会在用户只选了一个景别时补到最少两镜，补出来的景别不在 `inp.shots` 里。
   */
  function planEntries(inp, shots, total) {
    const n = shots.length;
    const base = Math.floor(total / n);
    const rest = total - base * n;
    const entries = [];
    for (let i = 0; i < n; i += 1) {
      const shot = shots[i];
      // 用户给的细节按顺序分配：第 1 条给镜头 1，以此类推；细节不够时靠后的镜头就没有
      const detailText = inp.detail.assignable[i] || '';
      entries.push({
        shotId: shot.id,
        // 运镜按顺序分配给各个镜头；用户只选了 1 个就全片沿用
        moveId: inp.moves.length ? inp.moves[i % inp.moves.length].id : '',
        seconds: base + (i === n - 1 ? rest : 0),
        // 「镜头内容」= 用户给的细节 + 该景别的取景指令。
        // 这一格写的是「拍什么」，不是「特写是什么」—— 后者对生成工具等于没说。
        cell: [detailText, (K.SHOT_CONTENT || {})[shot.id] || ''].filter(Boolean).join(J.semi()),
        // 焦点只给近处镜头，而且只在它还没有具体细节时 ——
        // 「伞面的雨珠」和「把注意力引到面部表情上」同时出现会互相打架，
        // 更具体的那个说了算。用户选的焦点不会丢：它写在头部的【细节焦点】里。
        focus: !!(FOCUS_SHOTS[shot.id] && !detailText && inp.focus),
        // 首尾帧**不自动排**：它们说的是「我手上有哪张图」，是用户自己的素材，
        // 引擎凭空编一个文件路径或者一句画面描述等于替他做了决定。
        // 默认「未指定」，成品里那一整节就不出现。
        frameStart: null,
        frameEnd: null,
      });
    }
    return entries;
  }

  /** 用户是不是把「剪辑结构」选成了「一镜到底」 */
  function pickedOner(inp) {
    return (inp.cuts || []).some((x) => x.id === 'vcut.oner');
  }

  /**
   * 「一镜到底」这个选项在**当前语种**下叫什么。
   *
   * 冲突提示里要引用用户自己看到的那句话 —— 写死中文的话，英文用户会读到
   * 一段英文里夹着四个汉字，而且不知道指的是哪个选项。
   */
  function onerLabel(inp) {
    const hit = (inp.cuts || []).find((x) => x.id === 'vcut.oner');
    return (hit && hit.label) || t('一镜到底');
  }

  /** 同上，但入参是**已经挑出来的选项**（storyboardNotice 手里就是它） */
  function onerLabelOf(cuts) {
    const hit = (cuts || []).find((o) => o.id === 'vcut.oner');
    return (hit && hit.label) || t('一镜到底');
  }

  function autoStoryboardPlan(inp, opts) {
    const o = opts || {};
    // 一镜到底没有剪辑点，和分镜表天然冲突。
    // 但用户**明确点了「生成分镜表」**时不受这条限制（`allowOner`）——
    // 分镜表是他自己要的，按他的动作走；头部也不再声称「一镜到底」，
    // 免得成品一边写着「全片没有剪辑点」一边排着三个镜头。
    if (!o.allowOner && pickedOner(inp)) return { ok: false };

    const dur = inp.durs[0] || null;
    const total = dur && dur.seconds ? dur.seconds : 0;
    const maxShots = dur && dur.maxShots ? dur.maxShots : 1;
    const n = Math.min(inp.shots.length, maxShots);
    if (!total || n < 2) return { ok: false };

    return { ok: true, n, total, maxShots, entries: planEntries(inp, inp.shots.slice(0, n), total) };
  }

  /**
   * 用户明确点了「生成分镜表」时的种子计划。
   *
   * 分工是「系统自动生成一版 → 人来改」，不是「给个半成品让用户自己搭」。
   * 所以和自动计划有三点不同：
   *   1. 「一镜到底」拦不住他（那是引擎替用户判断该不该给分镜表，而这里是他自己要的）；
   *   2. 只选了一个景别也照排，并且**补到最少两镜** —— 分镜表至少要 2 镜，
   *      给一张 1 镜的表等于让他点了保存却得到「数据对不上」，白忙一场；
   *   3. 上限同时受时长约束（每镜至少 1 秒），免得排出 0 秒的镜头。
   *
   * 但**时长题仍然必须答过**：没答就不知道该给每镜多少秒，
   * 凭空编一个总时长等于替用户做了决定。这种情况下按钮不出现，
   * 改用提示告诉他怎么改（见 storyboardNotice）。
   */
  function storyboardSeed(inp) {
    const conflicts = pickedOner(inp) ? [onerLabel(inp)] : [];
    const auto = autoStoryboardPlan(inp, { allowOner: true });
    if (auto.ok) {
      return {
        ok: true, entries: auto.entries, conflicts,
        n: auto.n, total: auto.total, maxShots: auto.maxShots,
      };
    }

    const dur = inp.durs[0] || null;
    const total = dur && dur.seconds ? dur.seconds : 0;
    if (!total || !inp.shots.length) return { ok: false, conflicts };

    const maxShots = dur.maxShots || 1;
    const want = Math.min(inp.shots.length, Math.max(maxShots, STORYBOARD_SHOT_MIN), total);
    const shots = inp.shots.slice(0, want);
    const used = shots.map((s) => s.id);
    // 补镜优先挑「他没选过的景别」，和编辑器里「＋」的默认逻辑保持一致 ——
    // 补出来的这一镜不该一上来就撞上「相邻同景别」的提示。
    const pool = inp.shotAll || [];
    while (shots.length < STORYBOARD_SHOT_MIN && shots.length < total && pool.length) {
      const pick = pool.find((c) => used.indexOf(c.id) === -1) || pool[used.length % pool.length];
      used.push(pick.id);
      shots.push(pick);
    }
    if (shots.length < STORYBOARD_SHOT_MIN) return { ok: false, conflicts };

    return { ok: true, entries: planEntries(inp, shots, total), conflicts, n: shots.length, total, maxShots };
  }

  /* ---------------- 首帧 / 尾帧 ---------------- */

  /** 首尾帧的合法来源（表在知识库，引擎不另抄一份 id） */
  const FRAME_MODE_BY_ID = {};
  (K.FRAME_MODES || []).forEach((m) => { FRAME_MODE_BY_ID[m.id] = m; });

  /**
   * 把一条「首帧 / 尾帧」收敛成能落盘、能渲染的形状。认不出来的一律当没指定。
   *
   * 为什么要收敛而不是直接信：这条数据从三个地方来 —— 编辑器、历史记录、
   * 导入的 JSON。后两个是不可信的（用户改过 localStorage、拿旧版本导出过）。
   * 一个下拉框的脏值不该作废整张分镜表，和 `moveId` 的处理方式一致。
   *
   * 两条位置相关的规则：
   *   · `slots` —— 这个来源能不能出现在首帧 / 尾帧。目前只有「沿用上个分镜的尾帧」
   *     限首帧：它描述的是「从哪儿接上」，而尾帧是「停在哪儿」，语义不成立。
   *   · `needPrev` —— 它需要前面还有一镜。**这条会因为用户挪动镜头而失效**，
   *     所以不能只在保存时校验一遍（见 dropDanglingPrev）。
   *
   * @param which 'start' | 'end'
   * @param i     这一镜在表里的位置（0 起）
   */
  function sanitizeFrame(raw, which, i) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const mode = FRAME_MODE_BY_ID[String(raw.mode || '')];
    if (!mode) return null;
    if ((mode.slots || []).indexOf(which) === -1) return null;
    if (mode.needPrev && i < 1) return null;

    const text = String(raw.text == null ? '' : raw.text).replace(/\s+/g, ' ').trim().slice(0, STORYBOARD_CELL_MAX);
    const name = String(raw.name == null ? '' : raw.name).replace(/\s+/g, ' ').trim().slice(0, STORYBOARD_CELL_MAX);
    const note = String(raw.note == null ? '' : raw.note).replace(/\s+/g, ' ').trim().slice(0, STORYBOARD_CELL_MAX);
    // 路径不能折叠空白 —— 路径里的空格是有意义的，replace(/\s+/g,' ') 会把
    // 「/Users/我 的素材/首帧.png」改成别的目录。只 trim 两端。
    const path = String(raw.path == null ? '' : raw.path).trim().slice(0, STORYBOARD_PATH_MAX);

    if (mode.id === 'text') {
      // 描述留空是**合法**的：用户说了「这一帧用文生图」，只是没单独描述它长什么样 ——
      // 那它长什么样本来就由这一镜的画面决定。渲染时回落到这一镜的镜头内容。
      return { mode: 'text', text, path: '', name: '', note: '' };
    }
    if (mode.id === 'file') {
      // 文件名和路径都空着 = 什么都没记，等于没指定。留着会渲染出
      // 「从文件导入：」后面空一片 —— 比不写这一行还糟。
      if (!path && !name) return null;
      return { mode: 'file', text: '', path, name, note };
    }
    if (mode.id === 'prev') {
      // 只有「沿用上一个分镜的尾帧」这一句，没有别的字段
      return { mode: 'prev', text: '', path: '', name: '', note: '' };
    }
    // 'none'：没指定。用 null 表示「这里没有决定」，而不是一个 mode:'none' 的对象 ——
    // 否则「有没有指定首帧」这个判断要写成 frame.mode !== 'none'，
    // 而每个漏写这一步的地方都会把「未指定」当成「指定了」。
    return null;
  }

  /**
   * 位置一变，「沿用上个分镜的尾帧」就可能失效 ——
   * 原本排在第 2 镜的那一条被 ↑ 到第 1 镜，它前面就没有分镜了。
   *
   * 规则只有一份（就是上面那个 sanitizeFrame），这个函数是给界面用的入口：
   * 上下移动 / 删除镜头之后调它，把结果说出来。**悄悄清掉用户选的东西是最糟的**——
   * 他会以为自己的选择丢了，或者更糟：根本没发现，成品里那一行不见了。
   *
   * @returns 被清掉的那些镜头编号（1 起，方便直接写进提示语）
   */
  function dropDanglingPrev(entries) {
    const dropped = [];
    (entries || []).forEach((e, i) => {
      if (!e || !e.frameStart) return;
      const was = e.frameStart;
      e.frameStart = sanitizeFrame(was, 'start', i);
      if (!e.frameStart && was.mode === 'prev') dropped.push(i + 1);
    });
    return dropped;
  }

  /**
   * 首尾帧在成品里怎么写。
   *
   * 文生图留空时回落这一镜的「镜头内容」—— 不回落的话成品里会留下一个
   * 空荡荡的「文生图：」，读的人只能猜这一帧要画什么。
   */
  function frameCellText(frame, cell, prevIndex) {
    if (!frame) return '—';
    if (frame.mode === 'prev') return t('沿用镜头 {n} 的尾帧', { n: prevIndex });
    if (frame.mode === 'text') return t('文生图：') + (frame.text || cell || t('按这一镜的画面'));
    const head = frame.name || frame.path;
    const tail = frame.name && frame.path ? '（' + frame.path + '）' : '';
    return t('从文件导入：') + head + tail + (frame.note ? '｜' + frame.note : '');
  }

  /**
   * 手工条目的兜底收敛。历史记录 / 导入的 JSON / 手改过的数据都可能带着脏东西，
   * 一条脏数据就能把整张表拼坏、甚至把结果页打崩。
   *
   * **不校验「条数等于自动计划的条数」** —— 加减镜头是用户的正当操作，
   * 条数由用户决定。只校验条数落在 `[STORYBOARD_SHOT_MIN, STORYBOARD_SHOT_MAX]`。
   *
   * 结构性错误（不是数组、条数越界、景别 id 不存在、时长不是数）→ 整份作废、
   * 回落自动计划：宁可丢掉手工调整，也不能拿一张对不上的表糊弄用户。
   * 数值越界（时长 0 或 999）→ 夹到合法区间而不是作废，免得用户整张表白调。
   * 夹取之后界面会用引擎存下来的值重绘，用户看到的就是生效的值，不会静默不一致。
   */
  function sanitizeEntries(session, list) {
    if (!Array.isArray(list)) return null;
    if (list.length < STORYBOARD_SHOT_MIN || list.length > STORYBOARD_SHOT_MAX) return null;

    const shotIds = {};
    ((getQuestion('vid.shot', session.scenarioId) || {}).options || [])
      .forEach((o) => { shotIds[o.id] = true; });
    const moveIds = {};
    ((getQuestion('vid.move', session.scenarioId) || {}).options || [])
      .forEach((o) => { moveIds[o.id] = true; });

    const out = [];
    for (let i = 0; i < list.length; i += 1) {
      const raw = list[i];
      if (!raw || typeof raw !== 'object') return null;
      if (!shotIds[raw.shotId]) return null;

      const secs = Math.round(Number(raw.seconds));
      if (!isFinite(secs)) return null;
      const safe = Math.min(STORYBOARD_SEC_MAX, Math.max(STORYBOARD_SEC_MIN, secs));

      const cell = String(raw.cell == null ? '' : raw.cell)
        .replace(/\s+/g, ' ').trim().slice(0, STORYBOARD_CELL_MAX);

      out.push({
        shotId: raw.shotId,
        // 运镜 id 不认就当没选（固定机位），不因为一个下拉框的值作废整张表
        moveId: raw.moveId && moveIds[raw.moveId] ? raw.moveId : '',
        seconds: safe,
        // 格子清空是允许的，但空着的那一镜对生成工具等于没说拍什么，
        // 所以回落到这个景别的取景指令。
        cell: cell || ((K.SHOT_CONTENT || {})[raw.shotId] || ''),
        // 焦点只对近处镜头成立：全景里让观众看清面部表情是自相矛盾的
        focus: !!raw.focus && !!FOCUS_SHOTS[raw.shotId],
        // 首尾帧同样「认不出来就当没指定」。注意 `i` 要传进去 ——
        // 「沿用上个分镜的尾帧」在第一个分镜上不成立，而删掉第 1 镜之后
        // 原来的第 2 镜就会带着这条数据变成第 1 镜。
        frameStart: sanitizeFrame(raw.frameStart, 'start', i),
        frameEnd: sanitizeFrame(raw.frameEnd, 'end', i),
      });
    }
    return out;
  }

  /**
   * 用户手工调整过的分镜条目。两道闸门缺一不可：
   *   1. 签名一致 —— 决定分镜**内容**的那几道题（`STORYBOARD_INPUTS`）没被改过；
   *   2. 条目本身合法 —— 条数在 `[STORYBOARD_SHOT_MIN, STORYBOARD_SHOT_MAX]` 之间、
   *      景别 id 存在、时长是数（见 `sanitizeEntries`）。
   *
   * 注意这里**不比对条数和自动计划是否一致**：加减镜头是用户的正当操作，
   * 镜头数不再由「选了几个景别」独家决定 —— 那只决定**起点**。
   *
   * 不满足就返回 null、回落自动计划。界面上的「恢复自动生成」走的就是这条路。
   */
  function usableStoryboardEdit(session) {
    const edit = session.storyboardEdit;
    if (!edit || typeof edit !== 'object') return null;
    if (edit.signature !== storyboardSignature(session)) return null;
    return sanitizeEntries(session, edit.shots);
  }

  /**
   * 把计划渲染成「分镜表 + 逐段画面描述 + 背景音乐建议」。
   * entries 可能来自自动计划，也可能来自用户手工调整 —— 渲染逻辑只有这一份。
   *
   * **要求 `entries.length >= 2`**：下面用到 `plan[1]`（BGM 的中段起点）和 `plan[n-1]`。
   * 两个来源都保证了这一点：`autoStoryboardPlan` 在 n < 2 时直接 `ok:false`，
   * 手工条目被 `sanitizeEntries` 卡在 `[STORYBOARD_SHOT_MIN, STORYBOARD_SHOT_MAX]`。
   * 这里再兜一道 —— 万一以后有人把下限放开，症状会是结果页直接崩，不值得赌。
   */
  function renderStoryboard(session, sections, entries, inp) {
    if (!entries || entries.length < 2) return null;
    const n = entries.length;
    const total = entries.reduce((a, e) => a + e.seconds, 0);
    const arc = inp.arcs.length ? inp.arcs[0].arc : null;
    const shotOf = (id) => inp.shotById[id] || { id, label: id };

    // 位置相关的字段在这里派生：重排顺序之后，时间码和情绪推进必须跟着位置走
    // 时间游标。**不能叫 `t`** —— 那是散句文案函数的别名，
    // 局部变量一遮，整个函数里的 t('…') 全变成「不是函数」（踩过一次）。
    let cursor = 0;
    const plan = entries.map((e, i) => {
      const item = {
        index: i + 1,
        shot: shotOf(e.shotId),
        move: e.moveId ? (inp.moveById[e.moveId] || null) : null,
        seconds: e.seconds,
        start: cursor,
        end: cursor + e.seconds,
        cell: e.cell,
        // 情绪走向按位置取一段，四个镜头的氛围才不会一模一样
        stage: arcStage(arc, i + 1, n),
        focus: e.focus ? inp.focus : null,
        // 首尾帧不是位置派生的，得从 entry 里带过来 —— 这个 map 少写一个字段，
        // 症状就是「编辑器里改得好好的，成品里那一节根本不出现」。
        frameStart: e.frameStart || null,
        frameEnd: e.frameEnd || null,
      };
      cursor += e.seconds;
      return item;
    });

    const actionText = (sections.action || []).join(J.comma());
    const lightText = (sections.lighting || []).join(J.comma());
    // 影像风格现在只管质感 ——「一镜到底」已经搬去「剪辑结构」题，不会再混进来，
    // 所以这里不需要再 filter 掉谁（那个 filter 本身就是「归属错了」的症状）。
    const styleText = inp.styles.map((o) => o.fragment).join(J.comma());
    const original = String(session.originalPrompt || '').trim().replace(/[。，,；;、\s]+$/, '');
    const taskText = (sections.task || []).join(J.comma());
    // 剪辑结构这一行有点特殊：它讲的是「全片几个镜头」，而分镜表本身就是多个镜头。
    //   · 用户选「分镜剪辑」→ 照写。和他的选择一致，也解释了下面为什么排了多行。
    //   · 用户选「一镜到底」→ 他明确点了「生成分镜表」，以他的动作为准排多镜，
    //     但**不能**再声称「全片没有剪辑点」，改成【剪辑说明】把冲突讲明白。
    // 两种结果都会落下一行，所以这条答案永远不会无声消失。
    const cutText = (sections.cut || []).join(J.comma());
    const onerDropped = pickedOner(inp);

    const lines = [];
    if (original) lines.push(t('【核心主题】') + original);
    // 用途（intent）单独一行：它回答的是「这条片子拿来干嘛、给谁看」，
    // 和「核心主题」（用户的原话）不是一回事，混进同一行会互相稀释。
    // 不写这一行，用户答的第一题就等于白答 —— 动画质感、不要人物主体
    // 这类信息全在这一题里。
    if (taskText) lines.push(t('【用途】') + taskText);
    if (inp.ratios.length) lines.push(t('【画面规格】') + inp.ratios.map((o) => o.fragment).join(J.comma()));
    // 情绪走向写成分阶段的一条线，下面每个镜头各取一段
    if (arc) lines.push(t('【情绪走向】') + inp.arcs[0].label + t('：') + arc.join(' → '));
    // 主体动作是全片共用的，提到头部写一次 ——
    // 放进每个镜头的「画面」里会逐字重复四遍，读起来像凑字数
    if (actionText) lines.push(t('【主体动作】') + actionText);
    const visual = [];
    if (lightText) visual.push(lightText);
    if (styleText) visual.push(styleText);
    if (visual.length) lines.push(t('【摄影语言】') + visual.join(J.semi()));
    // 摘掉的那一条要说明白 —— 用户答过的题不能无声消失，
    // 否则他会以为「我选了怎么没生效」，或者根本没发现成品已经和答案矛盾了。
    if (onerDropped) {
      lines.push(t('【剪辑说明】这张分镜表按 {n} 个镜头排，与「{oner}（全片没有剪辑点）」冲突，所以没有采用「{oner}」。',
        { n: n, oner: onerLabel(inp) }));
    } else if (cutText) {
      lines.push(t('【剪辑结构】') + cutText);
    }
    // 焦点是全局设定，写在头部 —— 这样即使每个近景镜都分到了更具体的细节、
    // 逐镜描述里用不上它，用户选的这一项也不会凭空消失。
    if (inp.focus) lines.push(t('【细节焦点】') + inp.focus.fragment);
    // 细节在分镜表里按顺序分给了各个镜头，这里再给一份完整清单：
    // 用户是逐镜生成再拼接的，有清单才好核对有没有漏。
    // 清单用短词（label / 自定义原文），不用选项的长句 —— 混在一起会读成病句。
    if (inp.detail.list.length) lines.push(t('【画面细节】') + inp.detail.list.join(J.list()));
    // 首尾是同一个景别时不能写「从「中景」推进到「中景」」—— 加减镜头之后
    // 这种情况很常见（在结尾补一镜、或者删到只剩两镜），读起来像病句。
    const firstLabel = plan[0].shot.label;
    const lastLabel = plan[n - 1].shot.label;
    lines.push(t('【时长与结构】共 {total} 秒，{n} 个镜头，', { total: total, n: n })
      + (firstLabel === lastLabel
        ? t('全片以「{shot}」为主，节奏层层递进', { shot: firstLabel })
        : t('景别从「{from}」推进到「{to}」，节奏层层递进', { from: firstLabel, to: lastLabel })));

    // 分镜表
    lines.push('');
    lines.push('## ' + t('分镜表'));
    lines.push('');
    lines.push('| ' + t('镜头编号') + ' | ' + t('景别') + ' | ' + t('运镜方式')
      + ' | ' + t('时长') + ' | ' + t('镜头内容') + ' |');
    lines.push('| --- | --- | --- | --- | --- |');
    plan.forEach((p) => {
      lines.push('| ' + t('镜头 {n}', { n: p.index }) + ' | ' + p.shot.label + ' | '
        + (p.move ? p.move.label : t('固定机位')) + ' | ' + t('{n} 秒', { n: p.seconds }) + ' | '
        + p.cell + ' |');
    });

    // 首尾帧参考：紧跟在分镜表后面，因为这两张表是**同一把尺子量出来的** ——
    // 都以「镜头 N」为行，挨着放才能一行一行对着看（拿哪张图当首帧 / 尾帧）。
    // 放在逐段画面描述后面也行，但那中间隔了一大段散文，对着看要来回翻。
    //
    // 全都没指定时整节不出现：给一张全是「—」的表，除了占版面还会让人
    // 以为「这里是不是漏了什么」。
    if (plan.some((p) => p.frameStart || p.frameEnd)) {
      lines.push('');
      lines.push('## ' + t('首尾帧参考'));
      lines.push('');
      lines.push('| ' + t('镜头编号') + ' | ' + t('首帧') + ' | ' + t('尾帧') + ' |');
      lines.push('| --- | --- | --- |');
      plan.forEach((p) => {
        lines.push('| ' + t('镜头 {n}', { n: p.index }) + ' | '
          + frameCellText(p.frameStart, p.cell, p.index - 1)
          + ' | ' + frameCellText(p.frameEnd, p.cell, p.index - 1) + ' |');
      });

      // 「沿用镜头 N 的尾帧」而镜头 N 自己没指定尾帧 —— 这不是错，那条接法仍然成立
      // （镜头 N 生成结果的最后一帧就是它的尾帧），但用户控制不了那一帧长什么样。
      // 不说的话，他会在表里看到「沿用镜头 1 的尾帧」和镜头 1 尾帧那一格的「—」，
      // 只能自己猜这两个对不上是不是系统算错了。
      const loose = plan.filter((p, i) => i > 0
        && p.frameStart && p.frameStart.mode === 'prev' && !plan[i - 1].frameEnd);
      if (loose.length) {
        lines.push('');
        lines.push(t('说明：镜头 {shots} 的首帧沿用了上一个分镜的尾帧，而上一个分镜没有指定尾帧 —— '
          + '那就以它生成结果的最后一帧为准。想让衔接更可控，'
          + '可以给上一个分镜也定一个尾帧。', { shots: loose.map((p) => p.index).join(J.list()) }));
      }
    }

    // 逐段画面描述
    lines.push('');
    lines.push('## ' + t('逐段画面描述'));
    const scene = scenePhrase(session.originalPrompt);
    plan.forEach((p) => {
      lines.push('');
      lines.push('### ' + t('镜头 {n}', { n: p.index })
        + t('（{from} - {to}）', { from: timecode(p.start), to: timecode(p.end) })
        + p.shot.label + ' · ' + (p.move ? p.move.label : t('固定机位')));
      lines.push(t('作用：') + shotRole(p.shot, p.index, plan.length) + t('。'));
      // 主体放在最前面：这一镜单独拿去生成时，模型才知道拍的是什么
      const seg = [];
      if (scene) seg.push(scene);
      if (p.cell) seg.push(p.cell);
      if (p.focus) seg.push(p.focus.fragment);
      if (p.move) seg.push(p.move.fragment);
      lines.push(t('画面：') + seg.join(J.semi()) + t('。'));
      // 氛围 = 这一镜的情绪阶段 + 光线。
      // 情绪阶段按位置变化，四镜的氛围才不会退化成同一句复制四遍；
      // 影像风格是全片统一的，写进【摄影语言】就够了，这里不重复。
      const mood = [];
      if (p.stage) mood.push(p.stage);
      if (lightText) mood.push(lightText);
      if (mood.length) lines.push(t('氛围：') + mood.join(J.semi()) + t('。'));
    });

    // 背景音乐建议
    const audioText = (sections.audio || []).join(J.comma());
    if (inp.bgms.length) {
      const bgm = inp.bgms[0];
      const first = plan[0];
      const last = plan[n - 1];
      lines.push('');
      lines.push('## ' + t('背景音乐建议'));
      // 曲风只写用户选中的配乐片段。原来这里还挂着一句写死的
      // 「叠加真实环境音采样，补全视听一体感」：用户勾的是「旁白 / 对白」时，
      // 那句话等于替他做了决定，而他自己勾的声音诉求反倒整段没有落脚的地方。
      lines.push(t('曲风：') + bgm.fragment + t('。'));
      if (audioText) lines.push(t('声音：') + audioText + t('。'));

      // 情绪走向按「前段（第 1 镜）/ 中段（中间几镜）/ 结尾（最后一镜）」分段，
      // 三段的区间必须**首尾相接、互不重叠**。
      // 中段要止于最后一镜的起点（last.start），不能写到片尾（last.end）——
      // 否则「中段（00:05 - 00:20）」和紧接着的「结尾 5 秒（00:15 - 00:20）」
      // 时间区间重叠，而且中段还声称覆盖了「释放」那一段，却只列出中间几镜的阶段词，
      // 读起来像系统把时间算错了。
      // 只剩两镜时中间根本没有镜头：中段整段去掉（前段直接接结尾），
      // 硬写会得到「中段（00:05 - 00:05）」这种零长度区间。
      const parts = [t('前 {n} 秒', { n: first.seconds })
        + (first.stage ? t('（{stage}）', { stage: first.stage }) : '')
        + t('以环境音铺底、音乐极轻，把观众先带进场景')];
      if (n > 2) {
        // 中段情绪直接引用各镜的阶段词，BGM 的情绪走向才和画面走向对得上
        const midStages = plan.slice(1, -1).map((p) => p.stage).filter(Boolean);
        parts.push(t('中段（{from} - {to}）', { from: timecode(plan[1].start), to: timecode(last.start) })
          + bgm.label + t('进入，')
          + (midStages.length ? t('情绪') + midStages.join(J.list()) : t('把情绪推起来')));
        parts.push(t('结尾 {n} 秒', { n: last.seconds })
          + (last.stage ? t('（{stage}）', { stage: last.stage }) : '')
          + t('随画面一起渐渐减弱收尾（Fade Out）'));
      } else {
        // 两镜：配乐直接落在最后一镜上，进得去也收得回来
        parts.push(t('结尾 {n} 秒', { n: last.seconds })
          + (last.stage ? t('（{stage}）', { stage: last.stage }) : '')
          + bgm.label + t('进入，随画面一起渐渐减弱收尾（Fade Out）'));
      }
      lines.push(t('情绪走向：') + parts.join(J.semi()) + t('。'));
    } else if (audioText) {
      lines.push('');
      lines.push('## ' + t('听觉配合'));
      lines.push(audioText + t('。'));
    }

    return lines.join('\n');
  }

  /**
   * 多镜头视频的「分镜表 + 逐段描述」。
   * 返回 null 表示「这次不该用分镜表」，由调用方走连续描述。
   */
  function buildVideoStoryboard(session, sections) {
    const inp = storyboardInputs(session);
    // 手工调整过的优先，但只在「决定分镜内容的那几道题没被改过」时有效。
    // **先看手工版再判自动计划**：用户明确生成过分镜表时「一镜到底」拦不住它，
    // 反过来先判自动计划会让存下来的分镜表渲染不出来（记录打开是空的）。
    const manual = usableStoryboardEdit(session);
    if (manual) return renderStoryboard(session, sections, manual, inp);
    const auto = autoStoryboardPlan(inp);
    if (!auto.ok) return null;
    return renderStoryboard(session, sections, auto.entries, inp);
  }

  /* ---------------- 分镜表的人工编辑 ---------------- */

  /**
   * 给「编辑分镜表」界面用的当前计划。
   *
   * 界面不自己读知识库、不自己算总时长、不自己写死时长的上下限 ——
   * 那些都是引擎的事。两份实现迟早会对不上，这个项目已经栽过好几次
   * （白名单式构造、dimOf、VISUAL_ORDER）。
   */
  function storyboardPlan(session, opts) {
    const o = opts || {};
    const inp = storyboardInputs(session);
    // 手工版优先，而且**它自己就足以让这张表成立**。
    // 用户明确生成过分镜表时「一镜到底」拦不住它（自动计划是 false），
    // 这里如果还要求自动计划 ok，会出现「成品里明明排着分镜表，
    // 按钮却写着『生成分镜表』」——界面和成品各说各话。
    const manual = usableStoryboardEdit(session);
    // seed 模式：用户明确点了「生成分镜表」，所以不受「一镜到底」限制，
    // 只选了一个景别也照排 —— 而且会补到最少两镜，直接给一张**存得下去**的完整表
    // （见 storyboardSeed）。用户拿到的是成品草稿，不是半成品。
    const auto = o.seed ? storyboardSeed(inp) : autoStoryboardPlan(inp);
    if (!manual && !auto.ok) return { available: false };

    const entries = manual || auto.entries;

    return {
      available: true,
      fromManual: !!manual,
      // 排这张表时和用户的哪些答案冲突了（目前只有「一镜到底」）。
      // 界面据此在编辑器里给一句说明 —— 引擎不替用户改答案，但要告诉他冲突在哪。
      conflicts: auto.conflicts || [],
      // n 是「这次真正会渲染几镜」。手工加减过之后它和自动计划的条数可能不一样，
      // 界面关心的就是这个数。
      n: entries.length,
      // 自动计划本来排了几镜（＝用户选了几个景别，受时长题上限约束）。
      // 界面上「你排了 6 个，时长题按 4 个估算」这句话要用它。
      // 自动计划不成立（只有手工版）时退回手工版的条数 —— 那样就没有
      // 「比自动计划多几个」可说了，界面那句说明自然不出现。
      autoN: auto.ok ? auto.n : entries.length,
      maxShots: auto.ok ? auto.maxShots : 0,
      autoTotal: auto.ok ? auto.total : 0,
      total: entries.reduce((a, e) => a + e.seconds, 0),
      // 时长允许的范围由引擎给，界面照着设 min/max，不自己写死
      secMin: STORYBOARD_SEC_MIN,
      secMax: STORYBOARD_SEC_MAX,
      cellMax: STORYBOARD_CELL_MAX,
      // 能排几镜也由引擎给 —— 上下限是引擎的业务判断，界面不写死数字
      shotMin: STORYBOARD_SHOT_MIN,
      shotMax: STORYBOARD_SHOT_MAX,
      // 没选「细节焦点」时，焦点这一栏就没意义，界面不必显示
      focusChosen: !!inp.focus,
      // 首尾帧能选哪几种来源。`slots` 说它能用在首帧还是尾帧，`needPrev` 说它
      // 需要前面还有一镜 —— 界面照着这两条**通用规则**过滤下拉项，
      // 不用去认「prev」这个 id（认了就等于把业务判断抄进了界面）。
      frameModes: (K.FRAME_MODES || []).map((m) => ({
        id: m.id, label: m.label, slots: (m.slots || []).slice(), needPrev: !!m.needPrev,
      })),
      pathMax: STORYBOARD_PATH_MAX,
      // 可选的景别 / 运镜也由引擎给，界面不要自己去翻知识库
      shotChoices: allOptionsOf(session, 'vid.shot'),
      moveChoices: allOptionsOf(session, 'vid.move'),
      // 哪些景别算「近处」—— 决定界面上要不要给这一镜显示「强调焦点」开关。
      // 这条规则只该有一份实现（FOCUS_SHOTS），所以由引擎告诉界面。
      closeShotIds: Object.keys(FOCUS_SHOTS),
      // 每个景别自带的取景指令原文。界面上「恢复这个景别的取景指令」要用它，
      // 而「镜头内容 = 细节 + 取景指令」这条拼法在 sanitizeEntries 里也有一份 ——
      // 界面不许自己去翻 K.SHOT_CONTENT，否则两份实现迟早对不上。
      framingById: Object.assign({}, K.SHOT_CONTENT || {}),
      // 改这几道题会让手工调整作废（签名变了），界面要把这件事说清楚
      resetByTitles: STORYBOARD_INPUTS
        .map((qid) => (K.QUESTIONS[qid] || {}).title)
        .filter(Boolean),
      // 作废之后**能不能回落到自动版** —— 界面那句「这张表会回到自动排的版本」
      // 必须说准，因为引擎兑现不了这个承诺的情况真实存在：
      // 「一镜到底」（或时长只装得下 1 镜）时非 seed 的自动计划是 false，
      // 回落的结果是「表整个消失、成品退回单镜头描述」，不是「回到自动排的版本」。
      // 这种组合下只能说实话：表会作废，结果区会重新出现「生成分镜表」按钮。
      resetToAuto: autoStoryboardPlan(inp).ok,
      shots: entries.map((e) => {
        const shot = inp.shotById[e.shotId] || { label: e.shotId };
        const move = e.moveId ? inp.moveById[e.moveId] : null;
        return {
          shotId: e.shotId,
          moveId: e.moveId,
          seconds: e.seconds,
          cell: e.cell,
          focus: e.focus,
          // 首尾帧要跟着草稿走 —— 少了这两行，用户改完首帧点保存，
          // 编辑器里看着好好的，保存下去就没了（界面和成品各说各话）。
          frameStart: e.frameStart || null,
          frameEnd: e.frameEnd || null,
          shotLabel: shot.label,
          moveLabel: move ? move.label : t('固定机位'),
          // 焦点只对近处景别成立，界面据此决定要不要给这一镜显示焦点开关
          isClose: !!FOCUS_SHOTS[e.shotId],
        };
      }),
    };
  }

  /**
   * 结果区那个分镜按钮该长什么样 —— 由引擎说了算，界面不自己判断。
   *
   *   { mode: 'edit',   label: '编辑分镜表' }  已经有分镜表，点开改
   *   { mode: 'create', label: '生成分镜表' }  还没有，点开让引擎排一版完整的草稿
   *   { mode: 'none' }                        排不出来，别放按钮（点了只能得到问号）
   *
   * 为什么要「生成」这条路：分镜表原本完全由答案推导，于是
   * 「一镜到底」或者只选一个景别的人**永远拿不到分镜表，也没有入口**——
   * 他明明想要分镜，却只能看到一段连续描述。分镜表是不是他想要的，
   * 该由他说了算，而不是被一道题堵死。
   */
  function storyboardEntry(session) {
    if (!session || (session.family || 'text') !== 'video') return { mode: 'none' };
    if (storyboardPlan(session).available) return { mode: 'edit', label: t('编辑分镜表') };
    const seed = storyboardPlan(session, { seed: true });
    if (seed.available) {
      return { mode: 'create', label: t('生成分镜表'), conflicts: seed.conflicts || [] };
    }
    return { mode: 'none' };
  }

  /**
   * 存下用户手工调整过的分镜表。
   * 返回 false 表示这份数据根本没法用（条数越界 / 景别 id 不存在 / 时长不是数），
   * 由界面提示用户，而不是悄悄把他的调整丢掉。
   */
  function setStoryboardEdit(session, shots) {
    const inp = storyboardInputs(session);
    // 用 seed 判断能不能排，不能用自动计划 ——
    // 用户明确点「生成分镜表」时自动计划本来是 false（「一镜到底」拦着），
    // 这里再按它卡一道，编辑完点「保存调整」会静默失败：按钮点了没反应。
    if (!storyboardSeed(inp).ok) return false;
    const clean = sanitizeEntries(session, shots);
    if (!clean) return false;
    session.storyboardEdit = { signature: storyboardSignature(session), shots: clean };
    return true;
  }

  /**
   * 新加一镜的默认值。
   *
   * 为什么这条规则放在引擎而不是界面：「新镜头默认用哪个景别」是个业务判断
   * （优先挑还没用过的那个，这样一插进去不会立刻撞上「相邻同景别」的提示），
   * 而且它和自动计划用的是同一份 `shotChoices` / `SHOT_CONTENT`。
   * 放在界面里，两处迟早会对不上 —— 这个项目已经栽过好几次了。
   *
   * @param usedShotIds 当前表里已经用到的景别 id
   * @param neighbor    相邻那一镜（新镜头沿用它的运镜和时长，总时长才好预估）
   */
  function storyboardNewShot(session, usedShotIds, neighbor) {
    const choices = allOptionsOf(session, 'vid.shot');
    if (!choices.length) return null;

    const used = usedShotIds || [];
    // 优先挑没用过的；全用过了就按已有条数轮一个，避免永远只加同一个景别
    const pick = choices.find((c) => used.indexOf(c.id) === -1)
      || choices[used.length % choices.length];

    const nb = neighbor || {};
    const nbSecs = Math.round(Number(nb.seconds));
    const secs = isFinite(nbSecs) && nbSecs > 0 ? nbSecs : 5;

    return {
      shotId: pick.id,
      moveId: nb.moveId || '',
      seconds: Math.min(STORYBOARD_SEC_MAX, Math.max(STORYBOARD_SEC_MIN, secs)),
      // 新镜头不能是空格子 —— 留空对生成工具等于没说拍什么。
      // 先给这个景别的取景指令，用户想写就覆盖掉。
      cell: (K.SHOT_CONTENT || {})[pick.id] || '',
      focus: false,
      // 首尾帧**不沿用邻居**：运镜和时长是「这一镜怎么拍」，跟着上一镜走很合理；
      // 首尾帧是「这一镜用哪张图」，照抄邻居的文件路径等于替用户填了一个错的素材。
      frameStart: null,
      frameEnd: null,
    };
  }

  /** 丢掉手工调整，回到自动生成 */
  function clearStoryboardEdit(session) {
    delete session.storyboardEdit;
    return true;
  }

  function usedSectionsOf(session, sections, family) {
    const order = family === 'text' ? K.SECTION_ORDER : (K.VISUAL_ORDER[family] || []);
    const used = order.filter((dim) => {
      if (dim === 'task') return !!(sections.task && sections.task.length) || !!session.originalPrompt;
      return !!(sections[dim] && sections[dim].length);
    });
    if (family !== 'text' && sections.negative && sections.negative.length) used.push('negative');
    return used;
  }

  /* ---------------------------------------------------------------- *
   * 评分
   * ---------------------------------------------------------------- */

  const DIM_FROM_QID = {
    intent: 'task',
    role: 'role',
    'role.stance': 'role',
    audience: 'context',
    'audience.term': 'context',
    constraints: 'constraint',
    antiAi: 'constraint',
    examples: 'example',
  };

  const DIM_FROM_QID_IMAGE = {
    intent: 'style',
    'img.subject': 'subject',
    'img.subject.person': 'subject',
    'img.subject.animal': 'subject',
    'img.subject.product': 'subject',
    'img.composition': 'composition',
    'img.angle': 'composition',
    'img.ratio': 'composition',
    'img.lighting': 'lighting',
    'img.style': 'style',
    'img.mood': 'style',
    'img.quality': 'style',
    'img.palette': 'color',
    'img.negative': 'negative',
  };

  const DIM_FROM_QID_VIDEO = {
    intent: 'subject',
    'vid.action': 'subject',
    'vid.detail': 'subject',
    'vid.shot': 'shot',
    'vid.focus': 'shot',
    'vid.ratio': 'shot',
    'vid.move': 'move',
    'vid.style': 'style',
    // 「剪辑结构」算进「影像风格」这个评分维度。
    // 它自己是一个独立维度（dim: 'cut'，组装时单独成段），但**评分上不另开一项** ——
    // 那样要重配 SCORE_ITEMS_VIDEO 的 7 项权重（合计必须仍是 100），
    // 用户看到的分卡也会多一行。评分维度和组装维度本来就是两件事：
    // 组装用 q.dim（collectFragments），评分用 dimOf（scoreFinalPrompt）。
    'vid.cut': 'style',
    'vid.arc': 'style',
    'vid.duration': 'style',
    'vid.lighting': 'lighting',
    'vid.audio': 'audio',
    'vid.bgm': 'audio',
    'vid.negative': 'negative',
  };

  function dimOf(qid, family) {
    const fam = family || 'text';
    if (fam === 'image') return DIM_FROM_QID_IMAGE[qid] || null;
    if (fam === 'video') return DIM_FROM_QID_VIDEO[qid] || null;
    if (DIM_FROM_QID[qid]) return DIM_FROM_QID[qid];
    if (qid.indexOf('format') === 0) return 'format';
    if (qid === 'tone' || qid === 'depth' || qid === 'depth.why') return 'style';
    return null;
  }

  /**
   * 成品完整度评分。
   *
   * 两条铁律，各堵一个已经踩过的坑：
   *
   * 1) **只有真的往 Prompt 里写了字，才算「答了」。**
   *    判据必须和 collectFragments 完全一致 —— 选中项带 fragment，或者有自定义文本。
   *    只点了「拿不准，跳过这题 / 这些都不需要」时，一个字都没写进去，
   *    那时候加分就是分数在替一段不存在的内容背书。
   *    （踩过：全程选「拿不准」，原文一字未改，分数却从 11 涨到 60。）
   *    注意原来是两档（有选择 0.94 / 答了没选 0.6），而「答了没选」这一档
   *    **只可能由伪选项到达** —— 真选项一选就非空。也就是说那一档从上线起
   *    就只在给「拿不准」发分，所以这里直接收成一档。
   *
   * 2) **每个维度以「原文在该维度的得分」为下限。**
   *    成品里原封不动地带着用户的原文（buildPromptText 把它放在任务段、
   *    buildVisualPrompt 把它放在开头），所以任何一个维度的完整度都不可能
   *    比原文更低。于是「什么都没改」时分数必须原样返回，而不是掉到 0 ——
   *    掉到 0 和涨上去一样，都是分数在说一件没发生过的事。
   */
  function scoreFinalPrompt(session) {
    const family = session.family || 'text';
    // 每个维度：这一轮到底有没有往 Prompt 里写字
    const state = {};
    // 追问链已经断掉的旧答案不能算分：它压根没进 Prompt，
    // 却让「完整度」显示成 94 分 —— 那就是分数在替一段不存在的内容背书。
    const active = activeQids(session);
    Object.keys(session.answers).forEach((qid) => {
      if (!active[qid]) return;
      const dim = dimOf(qid, family);
      if (!dim) return;
      const q = getQuestion(qid, session.scenarioId);
      if (!q) return;
      // 用和 collectFragments 同一套收敛规则，保证「算分的」和「进正文的」
      // 是同一批选择 —— 两处各推一遍，迟早会推岔。
      const picked = normalizeSelection(q, session.answers[qid]);
      const wrote = !!session.customs[qid] || picked.some((id) => {
        const opt = (q.options || []).find((o) => o.id === id);
        return !!(opt && opt.fragment);
      });
      if (!wrote) return;
      state[dim] = true;
    });

    const before = session.scoreBefore;
    const beforeValue = (key) => {
      if (!before || !before.items) return 0;
      const hit = before.items.find((b) => b.key === key);
      return hit ? hit.value : 0;
    };

    let total = 0;
    const items = K.scoreItemsFor(family).map((item) => {
      const written = state[item.key] ? Math.round(item.weight * 0.94) : 0;
      const value = Math.max(written, beforeValue(item.key));
      total += value;
      return {
        key: item.key,
        label: item.label,
        hint: item.hint,
        weight: item.weight,
        value,
        ratio: item.weight ? value / item.weight : 0,
      };
    });

    const styleTouched = !!state.style;

    return { total: Math.round(total), items, styleTouched, family };
  }

  function buildImprovements(before, after) {
    const out = [];
    after.items.forEach((item) => {
      const prev = before.items.find((b) => b.key === item.key);
      const prevRatio = prev ? prev.ratio : 0;
      if (item.ratio > prevRatio + 0.05) {
        out.push({
          key: item.key,
          label: item.label,
          from: prev ? prev.value : 0,
          to: item.value,
          weight: item.weight,
        });
      }
    });
    return out;
  }

  /* ---------------------------------------------------------------- *
   * 完成
   * ---------------------------------------------------------------- */

  /**
   * 没生成分镜表时，给一句「为什么 + 怎么改」。
   *
   * 为什么需要：用户选了 4 个景别却拿到一段连续描述，只会以为功能坏了 ——
   * 而真正的原因往往只是时长题把镜头数卡到了 1。这条提示把那层因果关系讲出来。
   *
   * 注意它**只解释、不替用户改**：改不改、怎么改仍然由他决定。
   * 返回 null 表示「没什么可说的」（非视频，或本来就是分镜）。
   */
  function storyboardNotice(session) {
    if (!session || (session.family || 'text') !== 'video') return null;
    const shots = pickedOptions(session, 'vid.shot');
    const durs = pickedOptions(session, 'vid.duration');
    const cuts = pickedOptions(session, 'vid.cut');

    // 「生成分镜表」按钮真的在的时候才提它 —— 没答时长题时按钮不出现，
    // 提示里写「点那个按钮」等于让用户到处找一个不存在的按钮。
    //
    // 措辞注意：这条路是**引擎先排好一整版、用户在上面改**，不是「你自己排一张」。
    // 之前写的是「自己排一版」，和实际行为（自动生成完整草稿）对不上。
    const btnHint = storyboardEntry(session).mode === 'create'
      ? t('也可以直接点结果区右上角的「生成分镜表」—— 引擎会按你的答案排好一整版，你在上面改。')
      : '';

    // 剪辑结构的两条，是一对镜像，必须分开说：
    //   「一镜到底」= 全片只有一个镜头 → 多镜头分镜表不成立；
    //   「分镜剪辑」= 至少两个镜头     → 只给一个景别就排不出表。
    // 两者都没有自动分镜表，但**用户该去改的地方完全不同** ——
    // 合成一句「想要分镜表就…」的话，他会去改错的那道题。
    if (cuts.some((o) => o.id === 'vcut.oner')) {
      return {
        level: 'warn',
        text: t('你选了「{oner}」—— 全片没有剪辑点，所以这里给的是单镜头描述。', { oner: onerLabelOf(cuts) })
          + (btnHint || t('想要分镜表，把「剪辑结构」改成「分镜剪辑」。')),
      };
    }

    const manyShots = shots.length >= 2;
    // 没答时长题时 maxShots 兜底为 1 —— 注意下面不能再假设 durs[0] 存在，
    // 否则「选了多个景别 + 跳过时长题」会直接把结果页打崩。
    const noDuration = !durs.length;
    const maxShots = noDuration ? 1 : (durs[0].maxShots || 1);

    // 「分镜剪辑」= 用户明确要多个镜头。挡在分镜表前面的卡点是**独立的两条**：
    //   1. 景别不够（少于 2 个）→ 排不出两镜；
    //   2. 时长装不下（比如「3-5 秒 · 单镜头」）→ 同样排不出两镜。
    // 必须**一次说全**：只提一条的话，用户照做之后还是拿不到表，
    // 只会以为自己没改对，或者干脆认定功能坏了。
    // （这条第一版就漏了时长那条 —— 对着「3-5 秒 · 单镜头」写「再多选一个景别
    //   就能排了」，等于把他支到错的地方去。）
    if (cuts.some((o) => o.id === 'vcut.cut')) {
      const todo = [];
      if (!manyShots) todo.push(shots.length ? t('再多选一个景别') : t('先选上景别'));
      if (noDuration) todo.push(t('定一下时长'));
      else if (maxShots < 2) todo.push(t('把「时长与节奏」改成 10 秒以上'));
      if (todo.length) {
        return {
          level: 'warn',
          text: t('你选了「分镜剪辑」，但分镜表至少要两个镜头 —— {todo}就能排了。',
            { todo: todo.join(J.list()) }) + btnHint,
        };
      }
    }

    // 下面两条是给**没答「剪辑结构」**的会话兜底的：
    // 老记录里没有这一题（它是后加的），载入之后 storyboardNotice 会重算，
    // 走的就是这里。所以这两条不能删，否则打开老记录会一片空白。
    if (manyShots && noDuration) {
      return {
        level: 'warn',
        text: t('你选了 {n} 个景别，但还没定时长，所以这里给的是单镜头描述。想要分镜表，把「时长与节奏」选成 10 秒以上。',
          { n: shots.length }),
      };
    }
    if (manyShots && maxShots < 2) {
      return {
        level: 'warn',
        text: t('你选了 {n} 个景别，但时长是「{dur}」，只装得下 1 个镜头，所以这里给的是单镜头描述。',
          { n: shots.length, dur: durs[0].label })
          + (btnHint || t('想要分镜表，把「时长与节奏」改成 10 秒以上。')),
      };
    }
    // 单镜头本身没问题，只是顺带说一句分镜表怎么来 —— 很多人不知道这个能力存在
    return {
      level: 'info',
      text: t('想要「分镜表 + 逐段画面描述」的方案？在「镜头景别」里选 2 个以上景别，再把「时长与节奏」设为 10 秒以上。')
        + btnHint,
    };
  }

  /**
   * 某道题在**当前答案下**的额外提示，显示在题干的 helper 下面。
   *
   * 为什么不写死成题目的 helper 字段：这条提示取决于**别的题**答了什么，是动态的。
   * 目前只有一条 ——
   *   「剪辑结构 = 一镜到底」→ 景别题提示「这里选的那一个就是全片的景别」。
   *
   * 一镜到底意味着全片只有一个镜头，此时「选几个景别」这个问题本身就变形了。
   * 不提示的话，用户会照惯性选三四个，然后在结果区读到
   * 「你选了「一镜到底」……」，才发现自己多选了 —— 而他当时并不知道这两题有关系。
   *
   * `pending` 是**本轮还没提交**的选择（`{qid: {selected: []}}`，就是 submitRound 吃的那个
   * 结构）。必须传，因为一轮出 2 道题、答完才提交：用户在「剪辑结构」里点了
   * 「一镜到底」的那一刻，答案还在 draft 里，不在 `session.answers` 里。
   * 只读 answers 的话，同一轮里的景别题看不到这句提示 —— 而这两题**正好同一轮**
   * （core 里挨着排，见 knowledge.js 的 FLOWS.video），于是提示永远不会出现。
   *
   * 注意这是**提示，不是约束**：引擎不替用户删答案，也不拦着他多选。
   * 和「相邻两镜同景别」的警告同一个态度 —— 先给工具，再教方法。
   * （所以它也没有出现在 toggleOption / normalizeSelection 里：那两处管的是
   *   「哪些组合不合法」，这里管的是「哪些组合值得想一想」。）
   */
  function questionHint(session, qid, pending) {
    if (!session || qid !== 'vid.shot') return '';
    const q = getQuestion('vid.cut', session.scenarioId);
    if (!q) return '';
    const draftSel = pending && pending['vid.cut'] ? pending['vid.cut'].selected : null;
    // 草稿优先：它代表用户此刻屏幕上的选择。draft 为空数组时（他刚取消勾选）
    // 也要以草稿为准，不能退回 answers —— 那会显示一句已经过时的提示。
    const raw = Array.isArray(draftSel) ? draftSel : (session.answers['vid.cut'] || []);
    const sel = normalizeSelection(q, raw);
    if (sel.indexOf('vcut.oner') === -1) return '';
    return t('你选了「一镜到底」—— 全片只有一个镜头，这里选的那一个就是全片的景别。');
  }

  function finalize(session) {
    const { sections, decisions } = collectFragments(session);
    const family = session.family || 'text';

    let promptText;
    let negativePrompt = '';
    let storyboardUsed = false;

    if (family === 'text') {
      promptText = buildPromptText(session, sections);
    } else {
      // 视频分两种形态：单镜头吃一段连续描述，多镜头需要「分镜表 + 逐段描述」。
      // 走哪种完全由用户选的景别数与时长决定，不是引擎替他挑。
      const storyboard = family === 'video' ? buildVideoStoryboard(session, sections) : null;
      storyboardUsed = !!storyboard;
      promptText = storyboard || buildVisualPrompt(
        session,
        sections,
        K.VISUAL_ORDER[family],
        K.VISUAL_JOINER[family],
        K.VISUAL_END[family]
      );
      negativePrompt = buildNegativePrompt(sections);
    }

    const scoreAfter = scoreFinalPrompt(session);
    const improvements = buildImprovements(session.scoreBefore, scoreAfter);

    return {
      family,
      promptText,
      negativePrompt,
      decisions,
      usedSections: usedSectionsOf(session, sections, family),
      scoreBefore: session.scoreBefore,
      scoreAfter,
      improvements,
      scenarioId: session.scenarioId,
      scenarioName: session.scenarioName,
      rounds: session.totalRounds,
      answerCount: decisions.reduce((n, d) => n + d.labels.length, 0),
      // 界面据此决定标题写「最终 Prompt」还是「最终 Prompt · 分镜方案」，
      // 以及要不要显示那条「为什么没有分镜表」的说明
      storyboard: storyboardUsed,
      storyboardNotice: storyboardUsed ? null : storyboardNotice(session),
    };
  }

  /** 进度：已答问题数 / 预估总数 */
  function progress(session) {
    const answeredCount = Object.keys(session.answers).length;
    const pending = session.queue.length + session.current.length;
    const estimate = answeredCount + pending;
    return {
      round: session.round,
      answered: answeredCount,
      pending,
      estimate,
      ratio: estimate > 0 ? Math.min(1, answeredCount / estimate) : 0,
    };
  }

  /* ---------------------------------------------------------------- *
   * 导出
   * ---------------------------------------------------------------- */

  const Engine = {
    BATCH_SIZE,
    getQuestion,
    toggleOption,
    normalizeSelection,
    createSession,
    setScenario,
    nextRound,
    submitRound,
    finalize,
    buildVideoStoryboard,
    progress,
    scoreFinalPrompt,
    // 暴露出去是给测试用的：测试要能验证「每一道可达题的 dim 都落在真实评分维度里」，
    // 否则只能复制一份映射逻辑，那份副本迟早和这里对不上。
    dimOf,
    // 界面要用它把「追问链已断、当前不生效」的行标出来；
    // 测试要用它验证「哪些题在流程上」这条判断只有一份实现。
    activeQids,
    // 分镜表的人工编辑：界面只负责渲染，计划、总时长、上下限、可选项全部由引擎给
    storyboardPlan,
    setStoryboardEdit,
    clearStoryboardEdit,
    // 新加一镜的默认值（默认哪个景别 / 沿用谁的运镜和时长）也只该有一份实现
    storyboardNewShot,
    // 上下移动 / 删除镜头之后，界面要用它收敛「沿用上个分镜的尾帧」——
    // 「prev 在第一个分镜上不成立」这条规则只该有一份实现（sanitizeFrame）
    dropDanglingPrev,
    // 「结果区那个按钮该显示什么」由引擎裁决：编辑 / 生成 / 不放按钮
    storyboardEntry,
    // 「为什么没生成分镜表」也要能单独取 —— 从历史记录载入时要重算一遍，
    // 否则用户打开存档只看到一段连续描述，完全不知道为什么
    storyboardNotice,
    questionHint,
  };

  root.PromptLensEngine = Engine;
  if (typeof module !== 'undefined' && module.exports) module.exports = Engine;
})(typeof window !== 'undefined' ? window : globalThis);
