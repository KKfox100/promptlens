'use strict';

/**
 * PromptLens 工作台
 * ------------------------------------------------------------------
 * 三个阶段：输入需求 → 多轮拆解选择 → 生成结果
 * 右侧面板实时展示评分、已确定的决定，以及正在成型的 Prompt。
 */

(function () {
  const K = window.PromptLensKnowledge;
  const Engine = window.PromptLensEngine;
  const API = window.PromptLensAPI;
  // 示例图渲染器。加载失败也不该让整个工作台挂掉，所以这里允许它是 undefined。
  const Scene = window.PromptLensScene;

  /**
   * 散句文案。
   *
   * 显式取一次，而不是靠 knowledge.js 挂在全局的那个 `t`（它确实能用 ——
   * knowledge.js 没包 IIFE，函数声明会挂到全局）。不显式取的原因只有一个：
   * 那样一来 knowledge.js 哪天被包进 IIFE，这里会整体 ReferenceError，
   * 而且报的位置在第一个 t() 调用处，离真正的原因几百行远。
   *
   * ⚠️ 这个名字在本文件里**不许再被局部变量占用**。
   * 遮一次，那个函数里所有 t('…') 全变成「不是函数」（engine.js 踩过）。
   */
  const t = (window.PromptLensI18n && window.PromptLensI18n.t) || K.t || ((key) => key);

  /**
   * 引号也要跟着语种走：中文「」、英文 “”、日语「」。
   * 硬编码 `'「' + x + '」'` 的话，英文界面上会冒出两个中文书名号 ——
   * 这是「没接线的中文」里最隐蔽的一类：**字都被翻对了，标点没翻**。
   *
   * 简体下查不到译文，原样返回 key，输出逐字不变。
   */
  const quote = (s) => t('「{name}」', { name: s });

  const SAMPLES = {
    text: t('帮我写一篇关于远程办公的公众号文章，要给公司同事看的'),
    image: t('一只戴着宇航头盔的橘猫，坐在月球表面'),
    video: t('一个人走在雨夜的城市街头，霓虹灯的倒影落在积水里'),
  };

  const USAGE = {
    text: t('把上面这段完整贴进任意大模型的对话框即可。如果第一次结果还不满意，不用重写 Prompt —— 直接告诉它「第 3 条改一下」，比重新描述一遍高效得多。'),
    image: t('把「最终 Prompt」整段贴进 Midjourney / SD / Flux / 即梦 等绘图工具即可。负面提示词要填到工具对应的 negative prompt 栏；Midjourney 没有这一栏，改成在末尾追加 <code>--no 低质量, 模糊, 水印</code> 这种写法。'),
    video: t('把「最终 Prompt」整段贴进可灵 / Runway / 即梦 等视频生成工具即可。视频模型对时长很敏感：超过 15 秒的片子建议先按分镜表逐个镜头生成，再剪辑拼接，一次成片很容易前后不连贯。'),
  };

  /* 「粘到你的 AI」那一排入口 —— 点一下 = 成品进剪贴板 + 新标签打开该站。
     ------------------------------------------------------------------
     ⚠️ 这份清单**会过期**，不是常量。加工具之前先确认站点还活着：
        · Sora —— OpenAI 已于 2026-03 关停，sora.chatgpt.com 现在直接
          ECONNREFUSED。落地页场景表原来写着它，本轮一并拿掉了。
        · Stable Diffusion —— Stability AI 已转企业市场、DreamStudio 下线，
          消费端没有「打开就能贴」的网页版（本地跑 ComfyUI / Automatic1111
          的人直接贴进自己的界面），所以不给它入口。
     名称走 t()：豆包 / 即梦 / 可灵 在各语种有**既定译法**，照抄落地页
     「适用工具」列 —— Doubao / Jimeng·即夢·지멍 / Kling·可霊·클링。
     ⚠️ 徽标 mono **故意不走 t()，而且必须是拉丁字母**：
     en / es / ko 三个语种的界面上一个汉字都不许有（有断言把守），
     徽标写「豆」「即」「可」会当场把那三个语种判红。
     mono 只是视觉锚点，允许跨语种固定。K 同时出现在 Kimi（文字）和
     可灵（视频）上，但两者永远不会同屏（按 family 过滤），不冲突。 */
  const TOOLS = {
    text: [
      { name: 'ChatGPT', mono: 'GPT', url: 'https://chatgpt.com/' },
      { name: 'Claude', mono: 'C', url: 'https://claude.ai/new' },
      { name: 'DeepSeek', mono: 'DS', url: 'https://chat.deepseek.com/' },
      { name: '豆包', mono: 'D', url: 'https://www.doubao.com/chat/' },
      { name: 'Kimi', mono: 'K', url: 'https://www.kimi.com/' },
    ],
    image: [
      { name: 'Midjourney', mono: 'MJ', url: 'https://www.midjourney.com/' },
      { name: 'Flux', mono: 'F', url: 'https://playground.bfl.ai/image/generate' },
      { name: '即梦', mono: 'J', url: 'https://jimeng.jianying.com/ai-tool/home' },
    ],
    video: [
      { name: '可灵', mono: 'K', url: 'https://klingai.com/' },
      { name: 'Runway', mono: 'R', url: 'https://app.runwayml.com/' },
      { name: '即梦', mono: 'J', url: 'https://jimeng.jianying.com/ai-tool/home' },
    ],
  };

  const LOCAL = window.PromptLensAPI.isLocalMode;
  /* 登出去哪儿：登录页，不是公开落地页。
     落地页是给搜索引擎和第一次来的人看的；已经用过的人登出后要的是「再登进来」，
     把他丢回落地页还得再点一次「开始使用」，多一步没有收益。
     file:// 下没有路由重写，只能直接开 login.html。 */
  const HOME_URL = LOCAL ? 'login.html' : '/login';

  /* ---- 免注册模式 ----
     用**显式开关** `?guest=1` 判定，不是「没有会话就当游客」。

     为什么必须显式：会话过期时如果静默降级成游客，用户会以为自己还在用账号，
     而保存已经悄悄停了 —— 这是这个项目里反复出现的静默失效。
     显式开关下，会话过期仍然照旧跳登录页，是**响的**。 */
  const GUEST = /[?&]guest=1(&|$)/.test(location.search);

  /* 免注册 → 登录的交接暂存。
     用 sessionStorage 而不是 localStorage：它只活在**当前标签页**，
     关掉就没了 —— 所以「退出即清空」这条承诺仍然成立，
     不会因为多了交接功能而漏出一个持久化的口子。 */
  const GUEST_HANDOFF_KEY = 'promptlens.guest.handoff.v1';

  const state = {
    user: null,
    guest: false,
    scenarioId: 'general',
    scenarioAuto: true,
    session: null,
    batch: [],
    draft: {},
    snapshots: [],
    projects: [],
    activeProjectId: null,
    result: null,
    savedProjectId: null,
    detecting: null,
    decisionSig: '',
  };

  // 窄屏抽屉的关闭函数，bindEvents 里装配，其它地方可以直接调用
  let closeDrawers = () => {};

  /* ================================================================ *
   * DOM
   * ================================================================ */

  const $ = (id) => document.getElementById(id);

  const el = {
    envBadge: $('envBadge'),
    userAvatar: $('userAvatar'),
    userName: $('userName'),
    userBtn: $('userBtn'),
    userDropdown: $('userDropdown'),
    ddName: $('ddName'),
    ddMeta: $('ddMeta'),
    exportBtn: $('exportBtn'),
    logoutBtn: $('logoutBtn'),
    newBtn: $('newBtn'),
    historyToggle: $('historyToggle'),
    previewToggle: $('previewToggle'),

    historyList: $('historyList'),
    historyCount: $('historyCount'),
    storageNote: $('storageNote'),
    guestLoginBtn: $('guestLoginBtn'),
    guestNotice: $('guestNotice'),
    guestNoticeLogin: $('guestNoticeLogin'),

    stageInput: $('stageInput'),
    stageRounds: $('stageRounds'),
    stageResult: $('stageResult'),
    mainScroll: $('mainScroll'),
    barInput: $('barInput'),
    barRounds: $('barRounds'),
    barResult: $('barResult'),
    toolStrip: $('toolStrip'),

    rawPrompt: $('rawPrompt'),
    charCount: $('charCount'),
    scenarioGrid: $('scenarioGrid'),
    scenarioHint: $('scenarioHint'),
    analyzeStrip: $('analyzeStrip'),
    sampleRow: document.querySelector('.sample-row'),
    startBtn: $('startBtn'),

    roundBadge: $('roundBadge'),
    roundNote: $('roundNote'),
    scenarioSwitchBtn: $('scenarioSwitchBtn'),
    progressFill: $('progressFill'),
    questionsHost: $('questionsHost'),
    backBtn: $('backBtn'),
    nextBtn: $('nextBtn'),
    actionHint: $('actionHint'),

    resultSummary: $('resultSummary'),
    improveGrid: $('improveGrid'),
    finalTitle: $('finalTitle'),
    promptNotice: $('promptNotice'),
    finalWrap: $('finalWrap'),
    promptExpand: $('promptExpand'),
    finalPrompt: $('finalPrompt'),
    finalMeta: $('finalMeta'),
    editBoardBtn: $('editBoardBtn'),
    negativeSection: $('negativeSection'),
    negativePrompt: $('negativePrompt'),
    copyNegativeBtn: $('copyNegativeBtn'),
    usageNote: $('usageNote'),
    toolRow: $('toolRow'),
    restartBtn: $('restartBtn'),
    reviseBtn: $('reviseBtn'),
    downloadBtn: $('downloadBtn'),
    copyBtn: $('copyBtn'),
    decisionTable: $('decisionTable'),
    whyList: $('whyList'),

    previewRound: $('previewRound'),
    scoreBefore: $('scoreBefore'),
    scoreAfter: $('scoreAfter'),
    decisionList: $('decisionList'),
    livePreview: $('livePreview'),

    toastWrap: $('toastWrap'),
    modalHost: $('modalHost'),
  };

  /* ================================================================ *
   * 小工具
   * ================================================================ */

  function toast(message, kind) {
    const node = document.createElement('div');
    node.className = 'toast' + (kind ? ' ' + kind : '');
    node.textContent = message;
    el.toastWrap.appendChild(node);
    setTimeout(() => {
      node.style.transition = 'opacity .3s, transform .3s';
      node.style.opacity = '0';
      node.style.transform = 'translateY(8px)';
      setTimeout(() => node.remove(), 320);
    }, 2600);
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * 结果区展示用：把引擎产出的 Markdown 轻量渲染成 HTML。
   *
   * 只认我们自己会生成的三种结构 —— `## 小节` / `### 子标题` / `| 表格 |`，
   * 外加头部那几行 `【核心主题】…`。这不是通用 Markdown 解析器：
   * 通用解析器要么引依赖（这个项目零依赖），要么为了兼容各种边角语法留一堆口子。
   *
   * 关键点：**显示层怎么美化都不影响粘贴**。
   * 「复制 Prompt」和「下载 .md」读的都是 state.result.promptText 的原文，
   * 所以这里渲染成表格、标题，用户复制到的仍然是干净的 Markdown。
   */
  function renderRichPrompt(text) {
    const lines = String(text || '').split('\n');
    const out = [];
    let table = null;

    const flushTable = () => {
      if (!table) return;
      out.push('<table class="prompt-table"><thead><tr>'
        + table.head.map((c) => '<th>' + escapeHtml(c) + '</th>').join('')
        + '</tr></thead><tbody>'
        + table.rows.map((r) => '<tr>'
          + r.map((c) => '<td>' + escapeHtml(c) + '</td>').join('') + '</tr>').join('')
        + '</tbody></table>');
      table = null;
    };

    lines.forEach((line) => {
      const raw = line.trim();

      // 表格行：`| a | b |`，紧跟的分隔行（|---|---|）丢掉
      if (/^\|/.test(raw)) {
        const cells = raw.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
        if (cells.length && cells.every((c) => /^:?-{2,}:?$/.test(c))) return;
        if (!table) table = { head: cells, rows: [] };
        else table.rows.push(cells);
        return;
      }
      flushTable();

      if (!raw) { out.push('<div class="p-gap"></div>'); return; }
      if (/^##\s+/.test(raw)) {
        out.push('<h4 class="p-h2">' + escapeHtml(raw.replace(/^##\s+/, '')) + '</h4>');
        return;
      }
      if (/^###\s+/.test(raw)) {
        out.push('<h5 class="p-h3">' + escapeHtml(raw.replace(/^###\s+/, '')) + '</h5>');
        return;
      }
      // 头部的【核心主题】… 这类行，左边标签右边内容，比一坨文字好扫
      const meta = raw.match(/^【(.+?)】\s*(.*)$/);
      if (meta) {
        out.push('<div class="p-meta"><span class="p-key">' + escapeHtml(meta[1]) + '</span>'
          + '<span class="p-val">' + escapeHtml(meta[2]) + '</span></div>');
        return;
      }
      out.push('<p class="p-line">' + escapeHtml(raw) + '</p>');
    });
    flushTable();
    return out.join('');
  }

  /**
   * 把一段文本按「是不是结构化 Markdown」决定用富文本还是纯文本渲染。
   *
   * 只对「有 ## 小节或真的表格」的输出开富文本 —— 目前就是视频分镜方案。
   * 文字类的输出是 `# 角色设定` 这种单层标题的文档，用户经常要看着字面标记
   * 直接整段粘进对话框，保持原样比渲染成标题更贴合用法。
   */
  function paintPrompt(target, text) {
    if (!target) return;
    const src = String(text || '');
    const rich = /^##\s+\S/m.test(src) || /^\|.*\|\s*$/m.test(src);
    target.classList.toggle('is-rich', rich);
    if (rich) target.innerHTML = renderRichPrompt(src);
    else target.textContent = src;
  }

  /**
   * 结果区的内容比可视高度长时，给一道渐隐 + 一个「展开全部」按钮。
   *
   * 为什么需要：分镜方案有 1300+ 字符，而结果框固定 460px ——
   * 不做提示的话，用户翻到「核心主题」那几行就以为到底了，只会说「没看见分镜表」。
   *
   * 必须在渲染完成之后再量：内容高度是渲染之后才知道的，
   * 而且每次都要先复位（展开状态下量出来永远不溢出）。
   */
  function promptRestLabel() {
    // 说清楚「下面还有哪几节」，比单写「展开全部」有用得多
    const rest = Array.from(el.finalPrompt.querySelectorAll('.p-h2'))
      .map((h) => h.textContent.trim()).filter(Boolean);
    return rest.length
      ? t('展开全部 · 下面还有「{list}」', { list: rest.join(t('」「')) })
      : t('展开全部 ↓');
  }

  function syncPromptOverflow() {
    if (!el.finalWrap || !el.finalPrompt) return;
    el.finalPrompt.classList.remove('is-open');
    el.finalWrap.classList.remove('is-open');
    const over = el.finalPrompt.scrollHeight - el.finalPrompt.clientHeight;
    const hasMore = over > 8;
    el.finalWrap.classList.toggle('has-more', hasMore);
    el.promptExpand.classList.toggle('hidden', !hasMore);
    el.promptExpand.dataset.label = hasMore ? promptRestLabel() : '';
    el.promptExpand.textContent = el.promptExpand.dataset.label;
  }

  function togglePromptExpanded() {
    const open = !el.finalPrompt.classList.contains('is-open');
    el.finalPrompt.classList.toggle('is-open', open);
    el.finalWrap.classList.toggle('is-open', open);
    el.promptExpand.textContent = open ? t('收起 ↑') : (el.promptExpand.dataset.label || t('展开全部 ↓'));
  }

  /**
   * 把「为什么没生成分镜表」写到结果区。
   * 引擎只负责判断和措辞，界面只负责渲染 —— 规则不在这里分叉。
   */
  function renderPromptNotice(result) {
    const notice = result && result.storyboardNotice;
    if (!notice) {
      el.promptNotice.classList.add('hidden');
      el.promptNotice.textContent = '';
      return;
    }
    el.promptNotice.textContent = notice.text;
    el.promptNotice.classList.toggle('is-warn', notice.level === 'warn');
    el.promptNotice.classList.remove('hidden');
  }

  function formatTime(ts) {
    const d = new Date(ts);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    const pad = (n) => String(n).padStart(2, '0');
    if (sameDay) return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }

  /* ================================================================ *
   * 弹窗
   * ================================================================ */

  function openModal(opts) {
    closeModal();
    const mask = document.createElement('div');
    mask.className = 'modal-mask';
    mask.innerHTML = `
      <div class="modal">
        <h3>${escapeHtml(opts.title)}</h3>
        ${opts.desc ? `<p>${escapeHtml(opts.desc)}</p>` : ''}
        <div class="modal-body"></div>
        <div class="modal-actions"></div>
      </div>`;
    el.modalHost.appendChild(mask);
    // 分镜表编辑器要放下每镜一行「景别 / 运镜 / 时长」加一段文本，
    // 400px 宽会挤成一条竖线，所以允许调用方要一个宽版。
    if (opts.wide) mask.querySelector('.modal').classList.add('modal-lg');
    mask.addEventListener('click', (e) => { if (e.target === mask) closeModal(); });

    const body = mask.querySelector('.modal-body');
    const actions = mask.querySelector('.modal-actions');
    if (typeof opts.body === 'string') body.innerHTML = opts.body;
    else if (opts.body) body.appendChild(opts.body);

    (opts.actions || []).forEach((a) => {
      const btn = document.createElement('button');
      btn.className = 'btn' + (a.kind ? ' btn-' + a.kind : '');
      btn.textContent = a.label;
      btn.addEventListener('click', () => a.onClick && a.onClick(mask));
      actions.appendChild(btn);
    });
    return mask;
  }

  function closeModal() {
    el.modalHost.innerHTML = '';
  }

  /* ================================================================ *
   * 阶段切换
   * ================================================================ */

  function showStage(name) {
    el.stageInput.classList.toggle('hidden', name !== 'input');
    el.stageRounds.classList.toggle('hidden', name !== 'rounds');
    el.stageResult.classList.toggle('hidden', name !== 'result');

    // 输入页一露出来，场景 UI 就必须和 state 对齐 —— 挂在唯一入口上，
    // 免得以后新增一条「回到输入页」的路径时又忘了同步（那正是这次踩的坑）。
    if (name === 'input') syncScenarioUI();

    // 底栏按钮随阶段切换
    el.barInput.classList.toggle('hidden', name !== 'input');
    el.barRounds.classList.toggle('hidden', name !== 'rounds');
    el.barResult.classList.toggle('hidden', name !== 'result');
    // 「粘到你的 AI」只在结果阶段出现 —— 它复制的是成品，没成品时是个死按钮。
    el.toolStrip.classList.toggle('hidden', name !== 'result');

    el.mainScroll.scrollTop = 0;
  }

  /* ================================================================ *
   * 账号
   * ================================================================ */

  async function boot() {
    let user = null;
    try {
      const res = await API.me();
      user = res.user || null;
    } catch (err) {
      /* 服务端连不上。**游客模式一个字节都不落盘，本来就不需要服务端**，
         所以照常放行；不是游客就还按老规矩跳登录页 ——
         让连不上服务端的人「用起来」，他会以为自己在被保存。 */
      if (!GUEST) {
        location.href = HOME_URL;
        return;
      }
    }

    /* 没有会话、又不是游客 → 跳登录页（老行为，保持不变）。 */
    if (!user && !GUEST) {
      location.href = HOME_URL;
      return;
    }

    state.user = user;
    state.guest = !user;

    if (state.guest) {
      applyGuestUI();
    } else {
      el.userName.textContent = user.displayName;
      el.userAvatar.textContent = user.displayName.slice(0, 1).toUpperCase();
      el.ddName.textContent = user.displayName;
      el.ddMeta.textContent = '@' + user.username;
      el.storageNote.textContent = API.isLocalMode
        ? t('当前以本地文件方式打开，账号与记录保存在这台电脑的浏览器里。启动 Node 服务后可切换为服务端存储。')
        : t('账号与记录保存在服务端的本地数据文件中。');
      if (API.isLocalMode) el.envBadge.classList.remove('hidden');
    }

    // 初始状态（空输入 + 自动识别）下它输出的提示语和 app.html 里的默认文案一致
    syncScenarioUI();
    bindEvents();

    if (state.guest) {
      /* 游客没有历史可读 —— 连请求都不发。
         守卫放在客户端而不是靠服务端拒绝：服务端一旦被绕过（或换了实现），
         这里会**静默地**开始存东西，而用户还以为是免注册模式。 */
      renderHistory();
    } else {
      await loadProjects();
      // 免注册时做了一半、然后去登录了：把那份进度接回来（只接一次）
      const handoff = takeGuestHandoff();
      if (handoff) restoreHandoff(handoff);
    }

    updatePreview();
  }

  /**
   * 游客模式的界面。
   *
   * 核心要求是**看得见**：如果「不保存」只体现在「侧栏一直是空的」，
   * 用户不会把它归因到模式上 —— 他会以为自己还没做完，或者记录丢了。
   * 所以顶栏要有标识、侧栏要写明原因、结果出来时还要再说一次。
   */
  function applyGuestUI() {
    el.userName.textContent = t('未登录');
    el.userAvatar.textContent = '·';
    el.ddName.textContent = t('免注册模式');
    el.ddMeta.textContent = t('这次的内容不会保存');

    el.envBadge.textContent = t('免注册模式 · 不保存记录');
    el.envBadge.classList.remove('hidden');

    el.storageNote.textContent = t('免注册模式下不会保存任何记录，离开页面即清空。登录后才会存进你的账号。');

    // 游客没有记录可导出
    el.exportBtn.classList.add('hidden');
    // 「退出登录」对游客没有意义，换成「退出并清空」
    el.logoutBtn.textContent = t('退出并清空');
    if (el.guestLoginBtn) el.guestLoginBtn.classList.remove('hidden');
  }

  /**
   * 免注册 → 登录。先把当前进度暂存，再跳登录页。
   *
   * 为什么值得做：用户很可能已经答完 7 轮才决定注册。
   * 不带过去的话他得从头再做一遍 —— 这一步流失掉的人比想象中多。
   */
  function guestLogin() {
    stashGuestHandoff();
    location.href = HOME_URL;
  }

  /** 把游客当前的进度存进 sessionStorage（只活在本标签页）。 */
  function stashGuestHandoff() {
    if (!state.guest || !state.session) return;
    try {
      window.sessionStorage.setItem(GUEST_HANDOFF_KEY, JSON.stringify({
        v: 1,
        savedAt: Date.now(),
        scenarioId: state.scenarioId,
        scenarioAuto: state.scenarioAuto,
        decisionSig: state.decisionSig,
        session: state.session,
        batch: state.batch,
        draft: state.draft,
        snapshots: state.snapshots,
        result: state.result,
      }));
    } catch (err) {
      /* 存不下（隐私模式 / 配额满）也不能挡住跳转 ——
         大不了登录后重做一遍，比卡在按钮上强。 */
    }
  }

  /**
   * 取回交接数据，**取完立刻删**。
   *
   * 为什么必须立刻删：留着的话，下次再开 app.html 会把旧进度又倒回来一遍，
   * 用户会以为「我明明重新开始了，怎么又回来了」—— 而且这个 bug 只在
   * 「用过一次免注册并且登录过」之后才出现，很难复现。
   */
  function takeGuestHandoff() {
    let raw = null;
    try {
      raw = window.sessionStorage.getItem(GUEST_HANDOFF_KEY);
      window.sessionStorage.removeItem(GUEST_HANDOFF_KEY);
    } catch (err) {
      return null;
    }
    if (!raw) return null;
    try {
      const data = JSON.parse(raw);
      if (!data || data.v !== 1 || !data.session) return null;
      return data;
    } catch (err) {
      return null;
    }
  }

  /** 把交接回来的进度还原到界面上（各阶段照 startFlow / finishFlow 的走法）。 */
  function restoreHandoff(data) {
    state.session = data.session;
    state.batch = data.batch || [];
    state.draft = data.draft || {};
    state.snapshots = data.snapshots || [];
    state.result = data.result || null;
    state.savedProjectId = null;
    state.activeProjectId = null;

    el.rawPrompt.value = state.session.originalPrompt || '';
    onPromptInput();                       // 字数 / 识别条 / 自动场景，一次刷齐
    state.scenarioId = data.scenarioId || state.scenarioId;
    state.scenarioAuto = data.scenarioAuto !== false;
    state.decisionSig = data.decisionSig || '';
    syncScenarioUI();

    if (state.result) {
      renderResult(state.result);
      showStage('result');
      syncPromptOverflow();
      revealPrompt();
    } else if (state.batch.length) {
      renderBatch(state.batch);
      showStage('rounds');
    } else {
      showStage('input');
    }

    /* 交接过来的这份**还没存过**，得当场说清楚，
       否则用户会以为它已经在账号里了。 */
    toast(t('已把免注册时做的选择带过来了，这次会存进你的账号'));
  }

  function bindEvents() {
    el.userBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      el.userDropdown.classList.toggle('open');
    });
    document.addEventListener('click', () => el.userDropdown.classList.remove('open'));

    el.logoutBtn.addEventListener('click', async () => {
      if (state.guest) {
        /* 游客没有会话可注销 —— 这个按钮对他的作用是「把这次的内容丢掉」，
           所以文案也换成了「退出并清空」。清完回落地页。 */
        resetFlow();
        location.href = LOCAL ? 'index.html' : '/';
        return;
      }
      await API.logout();
      location.href = HOME_URL;
    });

    if (el.guestLoginBtn) el.guestLoginBtn.addEventListener('click', guestLogin);
    if (el.guestNoticeLogin) el.guestNoticeLogin.addEventListener('click', guestLogin);

    el.exportBtn.addEventListener('click', exportAll);
    el.newBtn.addEventListener('click', () => {
      resetFlow();
      toast(t('可以开始新的拆解了'));
    });

    el.rawPrompt.addEventListener('input', onPromptInput);

    // 示例入口：直接填入并锁定对应场景
    if (el.sampleRow) {
      el.sampleRow.querySelectorAll('[data-sample]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const kind = btn.dataset.sample;
          el.rawPrompt.value = SAMPLES[kind] || SAMPLES.text;
          state.scenarioAuto = false;
          state.scenarioId = kind === 'image' || kind === 'video'
            ? kind
            : K.detectScenario(el.rawPrompt.value).matched.id;
          syncScenarioUI();
          onPromptInput();
          el.rawPrompt.focus();
        });
      });
    }

    el.startBtn.addEventListener('click', startFlow);
    if (el.scenarioSwitchBtn) el.scenarioSwitchBtn.addEventListener('click', openScenarioPicker);
    el.copyNegativeBtn.addEventListener('click', copyNegative);

    // ---- 窄屏抽屉：顶栏两个按钮把侧栏 / 预览面板拉出来 ----
    const shell = document.querySelector('.app-shell');
    const sidebar = document.querySelector('.sidebar');
    const preview = document.querySelector('.preview');
    if (shell && sidebar && preview) {
      const backdrop = document.createElement('div');
      backdrop.className = 'drawer-backdrop';
      shell.appendChild(backdrop);

      const closeDrawersLocal = () => {
        sidebar.classList.remove('open');
        preview.classList.remove('open');
        backdrop.classList.remove('show');
      };
      closeDrawers = closeDrawersLocal;
      const toggleDrawer = (node) => {
        const willOpen = !node.classList.contains('open');
        closeDrawersLocal();
        if (willOpen) {
          node.classList.add('open');
          backdrop.classList.add('show');
        }
      };

      if (el.historyToggle) el.historyToggle.addEventListener('click', () => toggleDrawer(sidebar));
      if (el.previewToggle) el.previewToggle.addEventListener('click', () => toggleDrawer(preview));
      backdrop.addEventListener('click', closeDrawersLocal);
      closeDrawersLocal();
    }

    el.nextBtn.addEventListener('click', onNext);
    el.backBtn.addEventListener('click', onBack);

    el.copyBtn.addEventListener('click', copyPrompt);
    el.downloadBtn.addEventListener('click', downloadPrompt);
    if (el.promptExpand) el.promptExpand.addEventListener('click', togglePromptExpanded);
    el.restartBtn.addEventListener('click', () => {
      resetFlow();
      toast(t('已经清空，重新开始吧'));
    });
    el.reviseBtn.addEventListener('click', openRevision);
    if (el.editBoardBtn) el.editBoardBtn.addEventListener('click', openBoardEditor);

    // 溢出是「内容高度 vs 可视高度」的比值，视口一变（转屏、拉窗口、
    // 窄屏抽屉开合）就可能从溢出变成不溢出，所以要重算。
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (state.result && !el.stageResult.classList.contains('hidden')) syncPromptOverflow();
      }, 120);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (!el.stageRounds.classList.contains('hidden')) onNext();
      }
    });
  }

  /* ================================================================ *
   * 场景选择
   * ================================================================ */

  function renderScenarioGrid() {
    el.scenarioGrid.innerHTML = '';
    // 场景用「目录编号」而不是表情符号：表情符号是这套视觉里最卡通的一环，
    // 而编号 + 名称 + 一行说明正好是杂志目录的样子。sc.icon 仍留在知识库里，
    // 别处（如历史记录）还可能用到，这里只是不渲染它。
    K.SCENARIOS.forEach((sc, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'scenario-btn' + (sc.id === state.scenarioId ? ' active' : '');
      btn.dataset.id = sc.id;
      btn.innerHTML = `
        <span class="s-num">${String(i + 1).padStart(2, '0')}</span>
        <span class="s-name">${escapeHtml(sc.name)}</span>
        <span class="s-desc">${escapeHtml(sc.desc)}</span>`;
      btn.addEventListener('click', () => {
        state.scenarioId = sc.id;
        state.scenarioAuto = false;
        syncScenarioUI();
        updateAnalyzeStrip();
      });
      el.scenarioGrid.appendChild(btn);
    });
  }

  /**
   * 把输入页的场景 UI（网格高亮 + 提示语）对齐到当前 state。
   *
   * 为什么必须有这么个函数：`state.scenarioId` 会被「问答中途换场景」「载入历史
   * 记录」这些**不经过输入页**的路径改掉，而输入页的网格只是上次渲染留下的 DOM。
   * 不回写的话，用户换完场景再点「← 重新输入」，看到的是**换之前**那个高亮 ——
   * 界面和状态各说各话，全程不报错，又是「静默失效」那一类。
   *
   * 所以凡是「把输入页露出来」的地方都得走一次，统一挂在 showStage 上。
   */
  function syncScenarioUI() {
    const text = el.rawPrompt.value.trim();
    let detectedScore = 0;
    if (state.scenarioAuto && text) {
      // 自动模式下识别结果就是唯一事实：网格高亮和提示语都从它来，
      // 免得出现「高亮 A、提示语说 B」这种自相矛盾。
      const detected = K.detectScenario(text);
      state.scenarioId = detected.matched.id;
      detectedScore = detected.matched.score;
    }
    renderScenarioGrid();

    const sc = K.SCENARIOS.find((s) => s.id === state.scenarioId);
    if (!state.scenarioAuto) {
      el.scenarioHint.textContent = sc
        ? t('已手动指定为「{name}」，接下来的问题会围绕它展开。', { name: sc.name })
        : '';
    } else if (!text) {
      el.scenarioHint.textContent = t('系统会先自动判断，你随时可以改。');
    } else {
      el.scenarioHint.textContent = detectedScore > 0
        ? t('系统判断这是「{name}」类任务，你可以随时改。', { name: sc.name })
        : t('没能判断出具体类型，先用通用模式，你可以随时改。');
    }
  }

  function onPromptInput() {
    const text = el.rawPrompt.value;
    el.charCount.textContent = text.length;

    clearTimeout(state.detecting);
    state.detecting = setTimeout(() => {
      // 手动指定过场景就不动它（用户说了算）；自动模式下 syncScenarioUI
      // 会重新识别，并把网格高亮和提示语一起同步过去。
      if (state.scenarioAuto) syncScenarioUI();
      updateAnalyzeStrip();
    }, 350);
  }

  function updateAnalyzeStrip() {
    const text = el.rawPrompt.value.trim();
    const family = K.familyOf(state.scenarioId);
    if (!text) {
      el.analyzeStrip.classList.add('hidden');
      if (!state.session) {
        el.scoreBefore.textContent = '—';
        el.scoreAfter.textContent = '—';
      }
      return;
    }
    const signals = K.extractSignals(text, family);
    const score = K.scoreOriginalPrompt(text, signals, family);

    // 还没开始拆解时，右侧面板先给出原始输入的预估分
    if (!state.session) {
      el.scoreBefore.textContent = score.total;
      el.scoreAfter.textContent = '—';
    }

    const found = [];
    const missing = [];

    // 不同 family 关注的维度完全不同，标签表也跟着换
    const map = K.SIGNAL_LABELS[family] || K.SIGNAL_LABELS.text;
    map.forEach(([key, label]) => {
      if (signals[key]) found.push(label);
      else missing.push(label);
    });

    el.analyzeStrip.classList.remove('hidden');
    el.analyzeStrip.innerHTML = `
      <span class="chip chip-primary">${t('当前 {n} 分', { n: score.total })}</span>
      <span>${t('已经说清楚：{list}', { list: found.length ? escapeHtml(found.join(t('、'))) : t('还不太明确') })}</span>
      <span class="muted">·</span>
      <span>${t('待补上：{list}', { list: missing.length ? escapeHtml(missing.slice(0, 3).join(t('、'))) : t('基本齐全') })}</span>`;
  }

  /* ================================================================ *
   * 流程控制
   * ================================================================ */

  function resetFlow() {
    state.session = null;
    state.batch = [];
    state.draft = {};
    state.snapshots = [];
    state.result = null;
    state.savedProjectId = null;
    state.activeProjectId = null;
    el.rawPrompt.value = '';
    el.charCount.textContent = '0';
    el.analyzeStrip.classList.add('hidden');
    // 上一轮的分镜提示 / 展开状态不能带到下一轮
    el.finalTitle.textContent = t('最终 Prompt');
    renderPromptNotice(null);
    el.finalPrompt.classList.remove('is-open');
    el.finalWrap.classList.remove('is-open', 'has-more');
    el.promptExpand.classList.add('hidden');
    // 上一轮的分镜表编辑按钮也不能带到下一轮（此刻 session 已清空，只能直接藏）
    if (el.editBoardBtn) el.editBoardBtn.classList.add('hidden');
    // 「这次没保存」的提示属于上一份结果，重新开始时必须收掉
    if (el.guestNotice) el.guestNotice.classList.add('hidden');
    state.scenarioAuto = true;
    state.scenarioId = 'general';
    // 网格高亮和提示语交给 showStage('input') → syncScenarioUI 统一处理，
    // 别在这儿再渲染一遍（两份实现迟早各说各话）。
    showStage('input');
    updatePreview();
    renderHistory();
  }

  function startFlow() {
    const text = el.rawPrompt.value.trim();
    if (!text) {
      toast(t('先写下你的需求，哪怕一句话也行'));
      el.rawPrompt.focus();
      return;
    }

    // 输入后立刻点按钮时，防抖的自动识别可能还没跑完，这里同步补一次
    if (state.scenarioAuto) {
      state.scenarioId = K.detectScenario(text).matched.id;
    }

    state.session = Engine.createSession(text);
    // 尊重用户手动指定的场景：同步刷新 family / 信号 / 起始评分标准
    Engine.setScenario(state.session, state.scenarioId);

    state.draft = {};
    state.snapshots = [];
    state.savedProjectId = null;

    const batch = Engine.nextRound(state.session);
    renderBatch(batch);
    showStage('rounds');
    updatePreview();
  }

  /**
   * 换一个场景（问答阶段用）。
   *
   * 为什么需要：场景是**自动判断**的，判错不报错，只是「后面问的题不对」——
   * 用户想拍短视频，却因为原话被识别成图片，永远等不到「镜头景别」这道题，
   * 而他没法判断是系统问错了还是自己本来就该答这些。
   * 输入阶段的提示写着「系统会先自动判断，你随时可以改」，但进入问答阶段后
   * 场景网格所在的整个 section 都被隐藏了 —— 那句话当时是句空头承诺。
   *
   * 换场景 = 换一整套问题，所以是**整轮重来**（重置规则见 `Engine.setScenario`）。
   * 这里不自己清字段，一律回引擎裁决：漏一个字段的症状是「换完还留着旧状态」，
   * 而且不报错。弹窗里也把「会重新问一遍」写明，不让用户以为已答的能保住。
   */
  function restartWithScenario(scenarioId, name) {
    if (!state.session) return;
    // 用户**明确指定**了场景，这个选择必须黏住：
    // 输入阶段的场景网格点一下会同时置 `scenarioAuto = false`，这里也得置，
    // 否则「换完场景 → 回输入页 → 再点开始拆解」会被 startFlow 里的
    // `if (state.scenarioAuto) 重新识别` 覆盖回去 —— 用户明明改过了，却像没改一样。
    // `state.scenarioId` 也要跟着走：它决定输入页网格高亮哪一个。
    state.scenarioId = scenarioId;
    state.scenarioAuto = false;
    Engine.setScenario(state.session, scenarioId, { restart: true });
    state.draft = {};
    state.snapshots = [];
    state.result = null;
    const batch = Engine.nextRound(state.session);
    renderBatch(batch);
    showStage('rounds');
    updatePreview();
    toast(t('已换成「{name}」，重新开始问', { name: name }));
  }

  function openScenarioPicker() {
    if (!state.session) return;
    const current = state.session.scenarioId;
    const mask = openModal({
      title: t('换一个场景？'),
      desc: t('识别错了就换一条链路。换完之后会重新问一遍，已经答过的会清掉。'),
      actions: [],
    });
    const body = mask.querySelector('.modal-body');
    const wrap = document.createElement('div');
    wrap.className = 'options';
    wrap.style.maxHeight = '52vh';
    wrap.style.overflowY = 'auto';

    // 先选、再确认。换场景会丢掉已答的内容，不该点一下就执行。
    let picked = null;
    const save = document.createElement('button');
    save.className = 'btn btn-primary';
    save.textContent = t('换成这个，重新问一遍');
    save.disabled = true;

    K.SCENARIOS.forEach((sc, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'option-btn radio' + (sc.id === current ? ' selected' : '');
      btn.dataset.sc = sc.id;
      btn.innerHTML = `<span class="mark"></span><span class="body">
          <span class="o-label">${String(i + 1).padStart(2, '0')} · ${escapeHtml(sc.name)}</span>
          <span class="o-hint">${escapeHtml(sc.desc)}${sc.id === current ? t('（当前）') : ''}</span>
        </span>`;
      btn.addEventListener('click', () => {
        picked = sc.id;
        wrap.querySelectorAll('.option-btn').forEach((b) => {
          b.classList.toggle('selected', b.dataset.sc === picked);
        });
        save.disabled = false;
      });
      wrap.appendChild(btn);
    });
    body.appendChild(wrap);

    const actions = mask.querySelector('.modal-actions');
    actions.innerHTML = '';
    const close = document.createElement('button');
    close.className = 'btn';
    close.textContent = t('关闭');
    close.addEventListener('click', closeModal);
    actions.appendChild(close);
    save.addEventListener('click', () => {
      if (!picked) return;
      const sc = K.SCENARIOS.find((s) => s.id === picked);
      closeModal();
      restartWithScenario(picked, sc ? sc.name : picked);
    });
    actions.appendChild(save);
  }

  function pushSnapshot() {
    state.snapshots.push({
      session: clone(state.session),
      batch: state.batch,
      draft: clone(state.draft),
    });
  }

  function onNext() {
    const unanswered = state.batch.filter((q) => {
      const d = state.draft[q.id];
      if (!d) return true;
      const hasSelection = (d.selected || []).length > 0;
      const hasCustom = String(d.custom || '').trim().length > 0;
      if (hasCustom) return false;
      return !hasSelection;
    });

    if (unanswered.length) {
      toast(t('还有 {n} 个问题没做选择', { n: unanswered.length }));
      const first = document.querySelector(`[data-qid="${unanswered[0].id}"]`);
      if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // 选了自定义但没写内容
    const emptyCustom = state.batch.find((q) => {
      const d = state.draft[q.id] || {};
      return (d.selected || []).indexOf('__custom__') !== -1 && !String(d.custom || '').trim();
    });
    if (emptyCustom) {
      toast(t('选了「我自己补充」，记得把内容写进去'));
      const node = document.querySelector(`[data-qid="${emptyCustom.id}"] .custom-input-wrap textarea`);
      if (node) node.focus();
      return;
    }

    pushSnapshot();
    const nextBatch = Engine.submitRound(state.session, state.draft);
    state.draft = {};

    if (!nextBatch.length) {
      finishFlow();
    } else {
      renderBatch(nextBatch);
      updatePreview();
    }
  }

  function onBack() {
    const snap = state.snapshots.pop();
    if (!snap) {
      showStage('input');
      updatePreview();
      return;
    }
    state.session = snap.session;
    state.draft = snap.draft;
    renderBatch(snap.batch);
    updatePreview();
  }

  /**
   * 把结果区滚到「最终 Prompt」。
   *
   * 为什么只对分镜方案做：中间栏（#mainScroll）自己是滚动容器，结果页上方还压着
   * 标题 + 7 张评分卡（约 470px）。分镜方案有 1300+ 字符，不主动滚一下，
   * 用户看到的只有「最终 Prompt」的头几行 —— 分镜表永远在折叠线以下，
   * 于是反馈「没看见分镜表和可执行拍摄方案」。
   *
   * 用即时滚动而不是平滑滚动：这是页面切换，平滑滚动会让「生成完了」这个
   * 瞬间的落点变得不确定（截图和断言也会拍到半路）。
   */
  function revealPrompt() {
    if (!state.result || !state.result.storyboard) return;
    const section = el.finalTitle.closest('.panel-section') || el.finalPrompt;
    if (section && section.scrollIntoView) section.scrollIntoView({ block: 'start' });
  }

  function finishFlow() {
    state.result = Engine.finalize(state.session);
    renderResult(state.result);
    showStage('result');
    syncPromptOverflow();   // 必须等结果区可见之后再量
    revealPrompt();
    updatePreview();
    saveProject();
  }

  /* ================================================================ *
   * 渲染：轮次问答
   * ================================================================ */

  function renderBatch(batch) {
    state.batch = batch;

    const prog = Engine.progress(state.session);
    el.roundBadge.textContent = t('第 {n} 轮', { n: state.session.round });
    el.roundNote.textContent = prog.pending > 0
      ? t('还有大约 {n} 个问题，全部答完就生成', { n: prog.pending })
      : t('这是最后一轮');
    // 把「现在走的是哪条链路」明写出来 —— 识别错了要当场看得见，而不是
    // 答到一半发现题目全不对。按钮文案里带上场景名，点之前就知道会换成什么。
    // 不带图标：表情符号和这套版式不搭，而且场景名本身已经说清楚了。
    if (el.scenarioSwitchBtn) {
      el.scenarioSwitchBtn.textContent = t('场景：{name} · 换一个',
        { name: state.session.scenarioName });
    }
    el.progressFill.style.width = Math.round(prog.ratio * 100) + '%';
    el.previewRound.textContent = t('第 {n} 轮', { n: state.session.round });

    el.questionsHost.innerHTML = '';
    batch.forEach((q) => {
      el.questionsHost.appendChild(renderQuestion(q));
    });

    el.backBtn.textContent = state.snapshots.length ? t('← 改上一轮') : t('← 重新输入');
    el.actionHint.textContent = t('Ctrl / ⌘ + Enter 也可以继续');

    // 恢复本批已保存的草稿
    batch.forEach((q) => {
      if (!state.draft[q.id]) state.draft[q.id] = { selected: [], custom: '' };
      syncQuestionUI(q.id);
    });
  }

  /** 多选题的规则提示：把「上限」和「同组互斥」提前讲清楚，
   *  否则用户点了新选项、旧选项自己掉下去，会觉得是 bug。 */
  function multiNote(q) {
    if (!q.multi) return '';
    const parts = [];
    if (q.maxPick) parts.push(t('最多选 {n} 个', { n: q.maxPick }));
    else parts.push(t('可多选'));
    const hasGroup = q.options.some((o) => o.group);
    if (hasGroup) parts.push(t('同类只能选一个'));
    return ' <span class="q-multi-note">· ' + parts.join(t('，')) + '</span>';
  }

  /**
   * 选项的「未选 → 选了」对照示例。
   * 术语是普通人用 Prompt 最大的门槛，光写「浅景深」「三分法」他们只能猜，
   * 所以每个选项旁边都放一对示例：左边是没提这一条时模型默认给的，
   * 右边是选了之后的样子。场景类画图，文本类给同一段内容的两种写法。
   */
  function renderDemo(q, opt, beforeSvg) {
    if (!opt.demo) return '';

    if (q.demoKind === 'scene') {
      if (!Scene) return '';
      let after = '';
      try {
        after = Scene.withDemo(q.demoBase, opt.demo);
      } catch (e) {
        return '';
      }
      return `<span class="o-demo is-scene">
        <span class="d-frame"><span class="d-tag">${t('默认')}</span>${beforeSvg}</span>
        <span class="d-arrow">→</span>
        <span class="d-frame is-after"><span class="d-tag on">${t('选了')}</span>${after}</span>
      </span>`;
    }

    return `<span class="o-demo is-text">
      <span class="d-line is-before"><b>${t('默认')}</b>${escapeHtml(q.demoBefore || '')}</span>
      <span class="d-line is-after"><b>${t('选了')}</b>${escapeHtml(opt.demo)}</span>
    </span>`;
  }

  /**
   * 题干下面那句**动态**提示（见 Engine.questionHint）。
   *
   * 单独一个节点、不并进 helper：helper 是题目自带的静态说明，
   * 而这句取决于**别的题**答了什么。syncQuestionUI 只切 .selected 类、
   * 不重绘题目块，所以必须有一个能就地更新的节点，否则切换选项时它会变成陈旧的。
   */
  function syncHint(block, qid) {
    const host = block.querySelector('.q-hint');
    if (!host) return;
    let text = '';
    if (state.session) {
      try { text = Engine.questionHint(state.session, qid, state.draft) || ''; } catch (e) { text = ''; }
    }
    host.textContent = text;
    host.classList.toggle('hidden', !text);
  }

  /**
   * 刷新**所有**已渲染题块的动态提示。
   *
   * 不能只刷被点的那一块：提示的触发条件是「另一道题选了什么」——
   * 用户在「剪辑结构」里点「一镜到底」，要变的是**景别题**上的那句话。
   */
  function syncHints() {
    document.querySelectorAll('.q-block').forEach((b) => syncHint(b, b.dataset.qid));
  }

  function renderQuestion(q) {
    const block = document.createElement('div');
    block.className = 'q-block';
    block.dataset.qid = q.id;

    const head = document.createElement('div');
    head.className = 'q-head';
    head.innerHTML = `
      <div class="q-title">${escapeHtml(q.title)}${multiNote(q)}</div>
      <div class="q-text">${escapeHtml(q.question)}</div>
      ${q.helper ? `<div class="q-helper">${escapeHtml(q.helper)}</div>` : ''}
      <div class="q-hint hidden"></div>`;
    block.appendChild(head);
    syncHint(block, q.id);

    const wrap = document.createElement('div');
    wrap.className = 'options' + (q.options.length > 5 ? ' cols-2' : '');

    // 用户的原话里往往已经藏着答案（写了「橘猫」，主体显然就是动物）。
    // 这里只是给对应按钮加个「推荐」标记，不替用户选中。
    const source = state.session ? state.session.originalPrompt : el.rawPrompt.value;
    const rec = K.recommendOption ? K.recommendOption(q.id, source) : null;

    // 「未选」的底图对同一题的每个选项都一样，渲染一次复用即可 ——
    // 风格题有 12 个选项，重复渲染会白白多出二十几万个字符。
    let beforeSvg = '';
    if (q.demoKind === 'scene' && Scene) {
      try {
        beforeSvg = Scene.withDemo(q.demoBase, {});
      } catch (e) {
        beforeSvg = '';
      }
    }

    q.options.forEach((opt) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'option-btn'
        + (q.multi ? '' : ' radio')
        + (opt.custom ? ' is-custom' : '')
        + (opt.skip ? ' is-skip' : '')
        + (rec === opt.id ? ' is-recommended' : '');
      btn.dataset.opt = opt.id;
      btn.innerHTML = `
        <span class="mark"></span>
        <span class="body">
          <span class="o-label">${escapeHtml(opt.label)}${rec === opt.id ? t(' <span class="o-badge">推荐</span>') : ''}</span>
          ${opt.hint ? `<span class="o-hint">${escapeHtml(opt.hint)}</span>` : ''}
          ${renderDemo(q, opt, beforeSvg)}
        </span>`;
      btn.addEventListener('click', () => onOptionClick(q, opt));
      wrap.appendChild(btn);
    });

    block.appendChild(wrap);

    const custom = document.createElement('div');
    custom.className = 'custom-input-wrap';
    custom.innerHTML = t(`<textarea class="textarea" rows="3"
      placeholder="用你自己的话说说这部分的要求，会原样写进最终 Prompt"></textarea>`);
    const ta = custom.querySelector('textarea');
    ta.addEventListener('input', () => {
      state.draft[q.id].custom = ta.value;
      updatePreview();
    });
    block.appendChild(custom);

    return block;
  }

  function onOptionClick(q, opt) {
    const draft = state.draft[q.id] || { selected: [], custom: '' };
    // 上限与互斥规则统一由引擎裁决，界面这里只负责渲染结果
    draft.selected = Engine.toggleOption(q, draft.selected, opt.id);
    if (draft.selected.indexOf('__skip__') !== -1) draft.custom = '';
    state.draft[q.id] = draft;
    syncQuestionUI(q.id);
    // 提示依赖别的题的答案，所以这一下要刷全部题块 —— 刚点的是「剪辑结构」，
    // 要变的是「镜头景别」上那句话。只刷自己那块等于永远不更新。
    syncHints();
    updatePreview();
  }

  function syncQuestionUI(qid) {
    const block = document.querySelector(`[data-qid="${qid}"]`);
    if (!block) return;
    const draft = state.draft[qid] || { selected: [], custom: '' };

    block.querySelectorAll('.option-btn').forEach((btn) => {
      btn.classList.toggle('selected', (draft.selected || []).indexOf(btn.dataset.opt) !== -1);
    });

    const customWrap = block.querySelector('.custom-input-wrap');
    const customOn = (draft.selected || []).indexOf('__custom__') !== -1;
    customWrap.classList.toggle('show', customOn);
    if (customOn) {
      const ta = customWrap.querySelector('textarea');
      if (ta.value !== (draft.custom || '')) ta.value = draft.custom || '';
    }
  }

  /* ================================================================ *
   * 渲染：结果
   * ================================================================ */

  /** family 的中文说法，用在文案里 */
  function familyNoun(family) {
    if (family === 'image') return t('画面描述');
    if (family === 'video') return t('视频描述');
    return 'Prompt';
  }

  /**
   * 负面提示词只有图片 / 视频才有（文字类模型不吃这个）。
   * 结果页和历史记录都会用到，所以单独抽出来。
   */
  function renderNegative(result) {
    if (!el.negativeSection) return;
    const text = String((result && result.negativePrompt) || '').trim();
    const show = result && result.family !== 'text' && !!text;
    el.negativeSection.classList.toggle('hidden', !show);
    if (show) el.negativePrompt.textContent = text;
    else el.negativePrompt.textContent = '';
  }

  /** 「怎么用」的说明按 family 换 */
  function renderUsage(family) {
    if (!el.usageNote) return;
    el.usageNote.innerHTML = USAGE[family] || USAGE.text;
  }

  /**
   * 「粘到你的 AI」：按 family 换一组入口。
   * 点一下 = 把成品放进剪贴板 + 新标签打开该站，用户到那边直接 Ctrl+V。
   * 不用 URL 预填（?q=）：成品动辄上千字，会撞 URL 长度上限，
   * 而且各家支持程度不一，可能开出一张报错页 —— 剪贴板这条路永远有效。
   */
  function renderToolStrip(family) {
    if (!el.toolRow) return;
    const list = TOOLS[family] || TOOLS.text;
    el.toolRow.innerHTML = '';
    list.forEach((tool) => {
      const a = document.createElement('a');
      a.className = 'tool-link';
      a.href = tool.url;
      a.target = '_blank';
      /* rel 里 noopener 是必须的：不写的话对端页面能通过 window.opener
         反向操作本页。noreferrer 顺带不把我们的地址带给它。 */
      a.rel = 'noopener noreferrer';
      a.setAttribute('data-tool', tool.name);

      const mono = document.createElement('span');
      mono.className = 'tool-mono';
      mono.textContent = tool.mono;

      const name = document.createElement('span');
      name.className = 'tool-name';
      name.textContent = t(tool.name);

      a.appendChild(mono);
      a.appendChild(name);

      /* 不 preventDefault：让浏览器照常开新标签，复制在后台并行做。
         用户切过去按 Ctrl+V 时剪贴板里已经有了。
         复制失败也不拦跳转 —— 跳过去是主目的，剪贴板只是顺手。 */
      a.addEventListener('click', () => {
        const text = state.result ? state.result.promptText : '';
        if (text) copyText(text, t('已复制到剪贴板，去粘贴给 AI 吧'));
      });

      el.toolRow.appendChild(a);
    });
  }

  function renderResult(result) {
    const s = result;
    el.resultSummary.textContent =
      t('经过 {rounds} 轮拆解，你一共做了 {answers} 个决定，{family}的完整度从 {before} 分提升到 {after} 分。', {
        rounds: s.rounds,
        answers: s.answerCount,
        family: familyNoun(s.family),
        before: s.scoreBefore.total,
        after: s.scoreAfter.total,
      });

    el.improveGrid.innerHTML = '';
    if (!s.improvements.length) {
      el.improveGrid.innerHTML = t('<div class="improve-item"><div class="i-label">你的原始描述已经相当完整</div></div>');
    } else {
      s.improvements.forEach((item) => {
        const node = document.createElement('div');
        node.className = 'improve-item';
        node.innerHTML = `
          <div class="i-label">${escapeHtml(item.label)}</div>
          <div class="i-bar"><div class="i-fill" style="width:${Math.round((item.to / item.weight) * 100)}%"></div></div>
          <div class="i-delta">${t('{from} → {to} 分', { from: item.from, to: item.to })}</div>`;
        el.improveGrid.appendChild(node);
      });
    }

    paintPrompt(el.finalPrompt, s.promptText);
    el.finalMeta.textContent = t('{chars} 字符 · {blocks} 个板块',
      { chars: s.promptText.length, blocks: s.decisions.length });
    // 分镜方案要在标题上就说明白，否则用户以为这只是一段普通 Prompt
    el.finalTitle.textContent = s.storyboard ? t('最终 Prompt · 分镜方案') : t('最终 Prompt');
    renderPromptNotice(s);
    // 这里**不能**量溢出：此时 stageResult 还是 display:none，量出来是 0。
    // 测量必须在 showStage('result') 之后做，见 finishFlow。

    renderNegative(s);
    renderUsage(s.family);
    renderToolStrip(s.family);

    const rows = s.decisions.map((d) => `
      <tr>
        <td>${escapeHtml(d.title)}</td>
        <td>${escapeHtml(d.labels.join(t('、')))}</td>
      </tr>`).join('');
    el.decisionTable.innerHTML = `
      <thead><tr><th style="width:110px">${t('环节')}</th><th>${t('你的选择')}</th></tr></thead>
      <tbody>${rows || t('<tr><td colspan="2">没有记录</td></tr>')}</tbody>`;

    renderWhy(s.usedSections);

    // 有分镜表才给「编辑分镜表」按钮
    syncBoardBtn();
  }

  function renderWhy(usedSections) {
    const list = (usedSections || []).filter((dim) => K.SECTION_EXPLAIN[dim]);
    if (!list.length) {
      el.whyList.innerHTML = '';
      return;
    }
    el.whyList.innerHTML = list.map((dim) => `
      <div class="decision-item">
        <div class="d-title">${escapeHtml(K.SECTION_TITLES[dim])}</div>
        <div class="d-val" style="font-weight:400;color:var(--text-2);font-size:12.5px">${escapeHtml(K.SECTION_EXPLAIN[dim])}</div>
      </div>`).join('');
  }

  async function copyText(text, okMsg) {
    if (!text) return false;
    try {
      await navigator.clipboard.writeText(text);
      toast(okMsg, 'success');
      return true;
    } catch (err) {
      // 非 https / file:// 下 navigator.clipboard 不可用，退回 execCommand
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        toast(okMsg, 'success');
        return true;
      } catch (e2) {
        toast(t('复制失败，请手动选中复制'));
        return false;
      } finally {
        ta.remove();
      }
    }
  }

  async function copyPrompt() {
    const text = state.result ? state.result.promptText : '';
    if (!text) return;
    await copyText(text, t('已复制到剪贴板，去粘贴给 AI 吧'));
  }

  async function copyNegative() {
    const text = state.result ? state.result.negativePrompt : '';
    if (!text) {
      toast(t('这次没有负面提示词'));
      return;
    }
    await copyText(text, t('负面提示词已复制'));
  }

  function downloadPrompt() {
    if (!state.result) return;
    const title = state.session.originalPrompt.slice(0, 24).replace(/[\r\n]+/g, ' ');
    let content = t('# PromptLens 优化结果\n\n> 原始需求：{original}\n\n> 完整度：{before} → {after}\n\n---\n\n', {
      original: state.session.originalPrompt,
      before: state.result.scoreBefore.total,
      after: state.result.scoreAfter.total,
    }) + state.result.promptText + '\n';
    if (state.result.family !== 'text' && state.result.negativePrompt) {
      content += t('\n## 负面提示词（Negative Prompt）\n\n') + state.result.negativePrompt + '\n';
    }
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-${title || 'result'}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast(t('已下载 Markdown 文件'));
  }

  /* ================================================================ *
   * 修改某个选择
   * ================================================================ */

  function openRevision() {
    if (!state.session) return;

    const renderList = (mask) => {
      // 追问链断掉的旧答案不会进 Prompt，但答案本身留着 ——
      // 列表里必须标出来，否则用户会以为它还在起作用。
      const active = Engine.activeQids(state.session);
      const items = Object.keys(state.session.answers).map((qid) => {
        const q = Engine.getQuestion(qid, state.session.scenarioId);
        if (!q) return null;
        const selected = state.session.answers[qid] || [];
        const labels = [];
        selected.forEach((id) => {
          const opt = q.options.find((o) => o.id === id);
          if (!opt) return;
          labels.push(opt.skip ? t('（已跳过）') : opt.custom ? t('（自定义）') : opt.label);
        });
        if (state.session.customs[qid]) labels.push(t('自定义：') + state.session.customs[qid]);
        return {
          qid,
          title: q.title,
          value: labels.join(t('、')) || t('（未选择）'),
          inactive: !active[qid],
        };
      }).filter(Boolean);

      mask.querySelector('.modal h3').textContent = t('改哪一处？');
      mask.querySelector('.modal p').textContent = t('点任意一行重新选择，右侧预览会立刻跟着变。');
      const body = mask.querySelector('.modal-body');
      body.innerHTML = '';
      const list = document.createElement('div');
      list.className = 'decision-list';
      list.style.maxHeight = '46vh';
      list.style.overflowY = 'auto';
      items.forEach((item) => {
        const row = document.createElement('button');
        row.type = 'button';
        row.className = 'option-btn';
        row.style.padding = '9px 11px';
        row.innerHTML = `<span class="body">
            <span class="o-label" style="font-size:13.5px">${escapeHtml(item.title)}`
          + (item.inactive ? t('<span class="tag-inactive">当前未生效</span>') : '')
          + `</span>
            <span class="o-hint">${escapeHtml(item.value)}`
          + (item.inactive ? t(' · 把上一处改回原来那条，这一项会自动恢复') : '')
          + `</span>
          </span>`;
        row.addEventListener('click', () => renderEdit(mask, item.qid));
        list.appendChild(row);
      });
      body.appendChild(list);

      const actions = mask.querySelector('.modal-actions');
      actions.innerHTML = '';
      const close = document.createElement('button');
      close.className = 'btn';
      close.textContent = t('关闭');
      close.addEventListener('click', closeModal);
      actions.appendChild(close);
    };

    const renderEdit = (mask, qid) => {
      const q = Engine.getQuestion(qid, state.session.scenarioId);
      if (!q) return;

      mask.querySelector('.modal h3').textContent = q.title;
      mask.querySelector('.modal p').textContent = q.question;
      const body = mask.querySelector('.modal-body');
      body.innerHTML = '';

      const selected = (state.session.answers[qid] || []).slice();
      const customText = state.session.customs[qid] || '';
      const draft = { selected: selected, custom: customText };

      const wrap = document.createElement('div');
      wrap.className = 'options';
      wrap.style.maxHeight = '46vh';
      wrap.style.overflowY = 'auto';

      q.options.forEach((opt) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'option-btn' + (q.multi ? '' : ' radio') + (opt.custom ? ' is-custom' : '') + (opt.skip ? ' is-skip' : '');
        btn.dataset.opt = opt.id;
        btn.innerHTML = `<span class="mark"></span><span class="body">
            <span class="o-label" style="font-size:13.5px">${escapeHtml(opt.label)}</span>
            ${opt.hint ? `<span class="o-hint">${escapeHtml(opt.hint)}</span>` : ''}
          </span>`;
        btn.addEventListener('click', () => {
          draft.selected = Engine.toggleOption(q, draft.selected, opt.id);
          if (draft.selected.indexOf('__skip__') !== -1) draft.custom = '';
          wrap.querySelectorAll('.option-btn').forEach((b) => {
            b.classList.toggle('selected', draft.selected.indexOf(b.dataset.opt) !== -1);
          });
          customWrap.classList.toggle('show', draft.selected.indexOf('__custom__') !== -1);
        });
        if (draft.selected.indexOf(opt.id) !== -1) btn.classList.add('selected');
        wrap.appendChild(btn);
      });

      const customWrap = document.createElement('div');
      customWrap.className = 'custom-input-wrap' + (draft.selected.indexOf('__custom__') !== -1 ? ' show' : '');
      customWrap.innerHTML = t('<textarea class="textarea" rows="3" placeholder="用你自己的话写，会原样进入 Prompt"></textarea>');
      const ta = customWrap.querySelector('textarea');
      ta.value = customText;
      ta.addEventListener('input', () => { draft.custom = ta.value; });
      wrap.appendChild(customWrap);

      body.appendChild(wrap);

      const actions = mask.querySelector('.modal-actions');
      actions.innerHTML = '';
      const back = document.createElement('button');
      back.className = 'btn btn-ghost';
      back.textContent = t('← 返回列表');
      back.addEventListener('click', () => renderList(mask));
      actions.appendChild(back);

      const save = document.createElement('button');
      save.className = 'btn btn-primary';
      save.textContent = t('保存修改');
      save.addEventListener('click', async () => {
        const effective = draft.selected.filter((id) => id !== '__skip__' && id !== '__custom__');
        if (!effective.length && !draft.custom.trim() && draft.selected.indexOf('__skip__') === -1) {
          toast(t('请至少选一项，或者选「跳过」'));
          return;
        }
        state.session.answers[qid] = draft.selected;
        if (draft.custom.trim()) state.session.customs[qid] = draft.custom.trim();
        else delete state.session.customs[qid];

        closeModal();
        state.result = Engine.finalize(state.session);
        renderResult(state.result);
        // 改完选择，正文长度会变，溢出状态必须重新量。
        // 结果区此刻是可见的，所以这里能量 —— renderResult 里量不了（见那里的注释）。
        syncPromptOverflow();
        updatePreview();
        await saveProject();
        toast(t('已更新，Prompt 重新生成了'), 'success');
      });
      actions.appendChild(save);
    };

    const mask = openModal({ title: t('改哪一处？'), desc: t('点任意一行重新选择。'), actions: [] });
    renderList(mask);
  }

  /* ================================================================ *
   * 编辑分镜表
   * ================================================================ */

  /**
   * 结果区那个分镜按钮的显隐与文案，全部由 Engine.storyboardEntry 裁决。
   *
   * 三种状态：
   *   已有分镜表   → 「编辑分镜表」
   *   还没有       → 「生成分镜表」（引擎先排一整版完整的草稿，绕开「一镜到底」/单景别的限制）
   *   排不出来     → 不放按钮（点了只能得到问号），改由提示告诉他怎么改
   *
   * 以前只做第一种，于是「一镜到底」或只选一个景别的人**永远没有入口**，
   * 明明想要分镜却只能拿到一段连续描述。
   */
  function syncBoardBtn() {
    if (!el.editBoardBtn) return;
    let entry = { mode: 'none' };
    if (state.session) {
      try { entry = Engine.storyboardEntry(state.session); } catch (e) { entry = { mode: 'none' }; }
    }
    const show = entry.mode !== 'none';
    el.editBoardBtn.classList.toggle('hidden', !show);
    if (show) {
      el.editBoardBtn.textContent = entry.label;
      el.editBoardBtn.title = entry.mode === 'create'
        ? t('按你的答案排一张分镜表，顺序 / 时长 / 内容都能改')
        : t('改分镜表的顺序 / 每镜时长 / 每镜内容');
    }
  }

  /** 改完分镜表之后，结果区 / 预览 / 存档都要跟着刷新 —— 三处刷新只有这一份 */
  async function refreshAfterBoardEdit(msg) {
    state.result = Engine.finalize(state.session);
    renderResult(state.result);
    // renderResult 里量不了溢出（结果区那时可能不可见），这里补一次
    syncPromptOverflow();
    updatePreview();
    await saveProject();
    toast(msg, 'success');
  }

  /**
   * 让用户自己改分镜表的顺序 / 每镜时长 / 每镜内容。
   *
   * 为什么要做：分镜表是「生成之前最后一道人工关」。引擎按平均分秒数、
   * 按用户勾选景别的顺序排镜头，但真正拍过片子的人心里有自己的节奏
   * （哪一镜该多停两秒、先给全景还是先给特写、这一格想写什么）。
   * 前面二十道题都在问「你要什么」，走到这里必须把笔交回去 ——
   * 否则「每个决定都由用户做」就只是句口号。
   *
   * 界面不自己算任何东西：总时长、时间码、可选景别、时长上下限、
   * 哪些景别算「近处」，全部来自 Engine.storyboardPlan。
   * 这里只负责渲染和收集，规则一律回引擎裁决（这个项目已经栽过好几次
   * 「两份实现迟早对不上」：白名单式构造、dimOf、VISUAL_ORDER）。
   */
  function openBoardEditor() {
    if (!state.session) return;
    // seed: true —— 用户可能正是从「生成分镜表」进来的，那种情况下
    // 普通 plan 是 available:false（「一镜到底」拦着 / 只选了一个景别）。
    // 他已经明确要了分镜表，这里就必须给他一张能改的草稿。
    const plan = Engine.storyboardPlan(state.session, { seed: true });
    if (!plan.available) {
      // 走到这里只有两种可能：时长题没答（不知道该给每镜多少秒），
      // 或者一个景别都没选。注意「只选了一个景别」**不**是拦路的理由 ——
      // 那种情况种子会自动补到最少两镜，给一张能直接存的完整表。
      toast(t('还没法排分镜表 —— 先在「拍摄手法」里定好时长，并至少选一个景别'));
      return;
    }
    // 「生成」和「编辑」是两件事：前者还没有表，后者是在改已有的一版。
    // 文案要分开，否则用户会以为自己在改一份并不存在的东西。
    const creating = !state.result || !state.result.storyboard;

    // 草稿是深拷贝出来的：中途关掉弹窗不能留下半截改动。
    // 顺序 = 数组顺序，重排就是挪数组元素，时间码由引擎在渲染时按位置重算。
    let draft = plan.shots.map((s) => ({
      shotId: s.shotId, moveId: s.moveId, seconds: s.seconds, cell: s.cell, focus: s.focus,
      frameStart: s.frameStart || null, frameEnd: s.frameEnd || null,
    }));
    let manual = plan.fromManual;

    const mask = openModal({
      title: creating ? t('生成分镜表') : t('编辑分镜表'),
      desc: creating
        ? t('已经按你的答案排好一整版：顺序、时长、每一格的内容都能改，也能加减镜头。改完点「保存调整」，最终 Prompt 会换成这张分镜表。')
        : t('顺序、时长、每一格的内容都能改。改完点「保存调整」，最终 Prompt 会按你排的版本重新生成。'),
      wide: true,
      actions: [],
    });

    const body = mask.querySelector('.modal-body');
    body.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'board-editor';
    body.appendChild(wrap);

    const timecode = (sec) => {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      // 补零位数和引擎里那份保持一致 —— 编辑器里显示 00:15、成品里写成 0:15
      // 会让人怀疑「是不是两回事」。
      return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    };

    /** 时长按位置累加 —— 和引擎渲染时用的是同一套算法，界面上显示的就是最终写进 Prompt 的 */
    const starts = () => {
      // 累加器，**不能叫 t** —— 那是文案函数的别名，遮住之后这个函数里
      // 任何 t('…') 都会「不是函数」。现在里面没用到，但下次加一句就中招。
      let acc = 0;
      return draft.map((d) => { const s = acc; acc += d.seconds; return s; });
    };

    /** 相邻两镜同一个景别 → 看起来像「没切过」。只提示，不拦着 —— 先给工具，再教方法 */
    const dupAt = (i) => i > 0 && draft[i].shotId === draft[i - 1].shotId;

    /**
     * 位置一变就检查一次「沿用上个分镜的尾帧」还成不成立。
     *
     * 原本排在第 2 镜、首帧接着上一镜的那一条，被 ↑ 到第 1 镜之后前面就没有分镜了。
     * 规则只有一份实现（引擎的 dropDanglingPrev，它同时负责兜历史数据），
     * 界面只负责**把结果说出来** —— 悄悄清掉用户选的东西，他会以为自己的选择丢了，
     * 或者更糟：根本没发现，成品里那一行不见了。
     */
    const fixPrev = () => {
      const dropped = Engine.dropDanglingPrev(draft);
      if (dropped.length) {
        toast(t('镜头 {shots} 前面没有分镜了，首帧的「沿用上个分镜的尾帧」已取消',
          { shots: dropped.join(t('、')) }));
      }
    };

    /**
     * 重画整张表，然后把第 idx 张卡滚进视野。
     * 加减镜头 / 换景别都要重画（焦点开关、取景指令按钮、撞景别提示都跟着变），
     * 重画之后如果不滚一下，刚加的那一镜可能落在折叠线以下 —— 用户会以为没加上。
     */
    const renderAndReveal = (idx) => {
      render();
      const card = wrap.querySelectorAll('.board-card')[idx];
      if (card && card.scrollIntoView) card.scrollIntoView({ block: 'nearest' });
    };

    /**
     * 在 idx 位置插一镜；默认值（哪个景别 / 多长 / 内容）由引擎给。
     *
     * `neighborIdx` 是「照哪一镜的样子来」—— 必须是**用户点的那一张卡**，
     * 不是插入点后面那张：他点 ＋ 的时候想的是「给我一镜和这张差不多的」，
     * 而不是「和下一镜差不多的」。
     */
    const insertShotAt = (idx, neighborIdx) => {
      if (draft.length >= plan.shotMax) {
        toast(t('一张表最多排 {n} 个镜头', { n: plan.shotMax }));
        return;
      }
      const nb = draft[Math.max(0, Math.min(neighborIdx, draft.length - 1))];
      const nw = Engine.storyboardNewShot(state.session, draft.map((d) => d.shotId), nb);
      if (!nw) {
        toast(t('没有可用的景别，没法加镜头'));
        return;
      }
      draft.splice(idx, 0, nw);
      // 插一镜只会让后面的镜头上移一位，本来不会产生失效的 prev ——
      // 但这条规则将来可能变（比如加个「插到最前面」），顺手收敛一次更稳
      fixPrev();
      renderAndReveal(idx);
    };

    /**
     * 底部汇总。只写总时长、镜头数和区间 ——
     * 「相邻同景别」的提示放在出问题的那张卡上（见下），放在这里会被列表滚出视野，
     * 用户改了第 2 镜的景别、提示却藏在最底下，等于没提示。
     */
    const renderFoot = () => {
      const foot = wrap.querySelector('.board-foot');
      if (!foot) return;
      const total = draft.reduce((a, d) => a + d.seconds, 0);
      foot.innerHTML = t('<span>共 <b>{total}</b> 秒 · <b>{n}</b> 个镜头（可排 {min}–{max} 个）</span>', {
        total: total, n: draft.length, min: plan.shotMin, max: plan.shotMax,
      });

      // 手工加出来的镜头数可能超过时长题估算的上限。不拦着（用户自己在填秒数），
      // 但要说一句 —— 否则他看到「6 个镜头 / 20 秒」会以为系统算错了。
      if (draft.length > plan.autoN) {
        const more = document.createElement('span');
        more.className = 'board-note-line';
        more.textContent = t('比自动计划多 {more} 个镜头（时长题按 {auto} 个估算，每镜大约 {sec} 秒）。', {
          more: draft.length - plan.autoN,
          auto: plan.autoN,
          sec: Math.max(1, Math.round(total / draft.length)),
        });
        foot.appendChild(more);
      }
    };

    /**
     * 只刷新「跟位置 / 时长有关」的文字：卡片头的时间码 + 底部汇总。
     *
     * 改时长走这条路而不是整表重画 —— 重画会替换掉按钮，
     * 而 `change` 事件是在点「保存调整」的 mousedown 之后才触发的：
     * 按钮被换掉，那一下 click 就落空了（用户填了 8 秒却什么都没保存）。
     */
    const syncTimes = () => {
      const start = starts();
      Array.from(wrap.querySelectorAll('.board-card')).forEach((card, i) => {
        const timeEl = card.querySelector('.bc-time');
        if (timeEl && draft[i]) timeEl.textContent = timecode(start[i]) + ' – ' + timecode(start[i] + draft[i].seconds);
      });
      renderFoot();
    };

    const render = () => {
      const start = starts();
      wrap.innerHTML = '';

      // ---- 顶部说明：怎么加减镜头、改哪几道题会让这份调整作废 ----
      const note = document.createElement('div');
      note.className = 'board-note';
      // 这里不写「现在多少秒 / 现在几镜」：改时长只刷新底部汇总、不重画这张说明，
      // 写死了就会变成一个跟不上变化的数字。实时数字只放在下面汇总里，只此一处。
      //
      // 作废之后的结果有两种，必须分开说（`plan.resetToAuto` 由引擎给）：
      // 有自动版 → 回到自动排的版本；没有（「一镜到底」/ 时长只装得下 1 镜）
      // → 表整个消失、成品退回单镜头描述。第二种情况还写「回到自动排的版本」，
      // 就是在许一个引擎兑现不了的承诺。
      // ⚠️ 这里原来有个 `(t) =>` 的箭头参数，和文案函数同名 —— 局部一遮，
      // 里面再想用 t('…') 就不是函数了。改名成 x，顺手把这个坑填掉。
      note.innerHTML = t('镜头可以加减（{min}–{max} 个）：每张卡右上角的 ＋ 在它后面插一镜，✕ 删掉这一镜。'
        + '每镜时长填 {secMin}–{secMax} 秒之间的整数，全片总时长由每一镜加起来（见下方汇总）。'
        + '如果回去改 {titles}，{tail}', {
        min: plan.shotMin,
        max: plan.shotMax,
        secMin: plan.secMin,
        secMax: plan.secMax,
        titles: plan.resetByTitles.map((x) => quote(escapeHtml(x))).join(t('、')),
        tail: plan.resetToAuto
          ? t('这张表会回到自动排的版本。')
          : t('这张表会作废、成品退回单镜头描述（这种组合下引擎不会自动排分镜表，'
            + '结果区会重新出现「生成分镜表」按钮，点一下就能再来一张）。'),
      });
      wrap.appendChild(note);

      // ---- 和答案冲突时要说清楚（目前只有「一镜到底」）----
      // 不说的话，用户会在成品里发现「我选的怎么没生效」，
      // 或者更糟：根本没发现成品已经和他的答案矛盾了。
      if (plan.conflicts && plan.conflicts.length) {
        const clash = document.createElement('div');
        clash.className = 'board-warn board-conflict';
        clash.textContent = t('你选了「{list}」，它说的是「全片没有剪辑点」，和一张多镜头分镜表冲突。'
          + '这张表会按分镜排，成品里不会再写「一镜到底」。想要真正的一镜到底，就别保存这张表。',
          { list: plan.conflicts.join(t('」「')) });
        wrap.appendChild(clash);
      }

      // ---- 每一镜一张卡 ----
      const list = document.createElement('div');
      list.className = 'board-list';
      wrap.appendChild(list);

      draft.forEach((d, i) => {
        const card = document.createElement('div');
        card.className = 'board-card';
        card.dataset.i = String(i);
        card.dataset.shot = d.shotId;

        const head = document.createElement('div');
        head.className = 'bc-head';
        head.innerHTML = '<span class="bc-no">' + t('镜头 {n}', { n: i + 1 }) + '</span>'
          + '<span class="bc-time">' + timecode(start[i]) + ' – ' + timecode(start[i] + d.seconds) + '</span>';

        const tools = document.createElement('span');
        tools.className = 'bc-tools';
        [
          ['up', '↑', t('上移'), i === 0, ''],
          ['down', '↓', t('下移'), i === draft.length - 1, ''],
          ['add', t('＋'), t('在这一镜后面插一镜'), draft.length >= plan.shotMax, ''],
          ['del', '✕', t('删掉这一镜'), draft.length <= plan.shotMin,
            t('至少要留 {n} 个镜头 —— 只剩一镜就不是分镜了', { n: plan.shotMin })],
        ].forEach(([act, glyph, title, disabled, disabledWhy]) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'bc-icon' + (act === 'del' ? ' is-del' : '');
          b.dataset.act = act;
          b.textContent = glyph;
          b.title = disabled && disabledWhy ? disabledWhy : title;
          b.disabled = disabled;
          b.addEventListener('click', () => {
            if (act === 'add') { insertShotAt(i + 1, i); return; }
            if (act === 'del') {
              if (draft.length <= plan.shotMin) {
                toast(t('至少要留 {n} 个镜头 —— 只剩一镜就不是分镜了', { n: plan.shotMin }));
                return;
              }
              draft.splice(i, 1);
              // 删掉第 1 镜之后，原来的第 2 镜会带着「首帧沿用上一个分镜的尾帧」
              // 变成第 1 镜 —— 那条接法就不成立了，先收敛再重画
              fixPrev();
              renderAndReveal(Math.min(i, draft.length - 1));
              return;
            }
            const j = act === 'up' ? i - 1 : i + 1;
            if (j < 0 || j >= draft.length) return;
            const tmp = draft[i];
            draft[i] = draft[j];
            draft[j] = tmp;
            // 上下移动同理：首帧的「沿用上一个分镜的尾帧」是**位置语义**，
            // 跟着镜头一起挪，挪到第一位就失效
            fixPrev();
            renderAndReveal(j);
          });
          tools.appendChild(b);
        });
        head.appendChild(tools);
        card.appendChild(head);

        // ---- 景别 / 运镜 / 时长 ----
        const row = document.createElement('div');
        row.className = 'bc-row';

        const selectOf = (field, choices, emptyLabel) => {
          const sel = document.createElement('select');
          sel.className = 'select';
          sel.dataset.f = field;
          if (emptyLabel) {
            const o = document.createElement('option');
            o.value = '';
            o.textContent = emptyLabel;
            sel.appendChild(o);
          }
          choices.forEach((c) => {
            const o = document.createElement('option');
            o.value = c.id;
            o.textContent = c.label;
            sel.appendChild(o);
          });
          sel.value = d[field] || '';
          sel.addEventListener('change', () => {
            d[field] = sel.value;
            // 景别一换，这一镜「算不算近处」就变了，焦点开关、取景指令按钮、
            // 以及「和上一镜撞了景别」的提示都要重画；时长 / 运镜的改动只影响文字，
            // 不重画（重画会把焦点从下拉框上抢走）。
            if (field !== 'shotId') return;
            renderAndReveal(i);
          });
          return sel;
        };

        const fieldWrap = (labelText, node, hint) => {
          const f = document.createElement('label');
          f.className = 'bc-field';
          const cap = document.createElement('span');
          cap.className = 'bc-cap';
          cap.textContent = labelText;
          f.appendChild(cap);
          f.appendChild(node);
          if (hint) {
            const h = document.createElement('span');
            h.className = 'bc-hint';
            h.textContent = hint;
            f.appendChild(h);
          }
          return f;
        };

        row.appendChild(fieldWrap(t('景别'), selectOf('shotId', plan.shotChoices)));
        // 占位项的标签不能也叫「固定机位」—— 空值在引擎里本来就渲染成固定机位
        // （`renderStoryboard` 三处都是 `p.move ? p.move.label : '固定机位'`），
        // 但下拉里出现两个一模一样的「固定机位」，用户分不清自己选的是哪一个。
        row.appendChild(fieldWrap(t('运镜'), selectOf('moveId', plan.moveChoices, t('不指定（固定机位）'))));

        const sec = document.createElement('input');
        sec.className = 'input';
        sec.type = 'number';
        sec.dataset.f = 'seconds';
        sec.min = String(plan.secMin);
        sec.max = String(plan.secMax);
        sec.step = '1';
        sec.value = String(d.seconds);
        const commitSec = () => {
          // 越界不报错，直接夹住 —— 和引擎的 sanitizeEntries 同一套规则，
          // 界面上显示什么，最终就写进 Prompt 什么。
          const raw = Math.round(Number(sec.value));
          const safe = !isFinite(raw) ? d.seconds
            : Math.min(plan.secMax, Math.max(plan.secMin, raw));
          d.seconds = safe;
          if (String(safe) !== sec.value) sec.value = String(safe);
          // 只刷新文字，不整表重画 —— 见 syncTimes 的注释
          syncTimes();
        };
        sec.addEventListener('change', commitSec);
        sec.addEventListener('blur', commitSec);
        row.appendChild(fieldWrap(t('时长（秒）'), sec));
        card.appendChild(row);

        // 和上一镜撞了同一个景别 —— 提示就放在这张卡上，改了立刻看得见。
        // 只提示不拦：也许他就是要两个中景接在一起（那也是一种剪法）。
        if (dupAt(i)) {
          const warn = document.createElement('div');
          warn.className = 'board-warn';
          warn.textContent = t('和镜头 {n} 是同一个景别，连着两镜看起来像没切过 —— '
            + '如果不是有意的，换个景别试试。', { n: i });
          card.appendChild(warn);
        }

        // ---- 镜头内容 ----
        const cellWrap = document.createElement('label');
        cellWrap.className = 'bc-cell';
        cellWrap.innerHTML = '<span class="bc-cap">' + t('镜头内容')
          + ' <span class="tiny muted">' + t('写「拍什么」，不是「特写是什么」') + '</span></span>';
        const ta = document.createElement('textarea');
        ta.className = 'textarea';
        ta.dataset.f = 'cell';
        ta.rows = 2;
        ta.maxLength = plan.cellMax;
        ta.value = d.cell;
        // 新加的一镜是带着取景指令来的，不是空的。写清楚「留空会用什么」，
        // 用户才敢删掉这行字去写自己的。
        ta.placeholder = t('这一镜拍什么？留空就用「{shot}」的取景指令', {
          shot: (plan.shotChoices.find((c) => c.id === d.shotId) || {}).label || t('这个景别'),
        });
        ta.addEventListener('input', () => { d.cell = ta.value; });
        cellWrap.appendChild(ta);
        card.appendChild(cellWrap);

        // ---- 底部：取景指令按钮 + 焦点开关 ----
        const foot = document.createElement('div');
        foot.className = 'bc-foot';

        const framing = plan.framingById[d.shotId] || '';
        if (framing) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'btn btn-sm btn-ghost';
          btn.dataset.act = 'framing';
          btn.textContent = t('恢复这个景别的取景指令');
          btn.addEventListener('click', () => {
            d.cell = framing;
            ta.value = framing;
          });
          foot.appendChild(btn);
        }

        if (plan.focusChosen && plan.closeShotIds.indexOf(d.shotId) !== -1) {
          const f = document.createElement('label');
          f.className = 'bc-focus';
          const cb = document.createElement('input');
          cb.type = 'checkbox';
          cb.dataset.f = 'focus';
          cb.checked = !!d.focus;
          cb.addEventListener('change', () => { d.focus = cb.checked; });
          f.appendChild(cb);
          f.appendChild(document.createTextNode(t('让观众看清细节焦点')));
          foot.appendChild(f);
        } else if (d.focus) {
          // 从近景换成全景之后，原来勾上的焦点就不成立了 ——
          // 引擎也会丢掉它（全景里让人看清表情是自相矛盾的），这里同步显示出来，
          // 免得用户以为「我明明勾了」。
          const gone = document.createElement('span');
          gone.className = 'bc-hint';
          gone.textContent = t('这个景别用不上「细节焦点」，已自动取消');
          foot.appendChild(gone);
          d.focus = false;
        }

        card.appendChild(foot);

        // ---- 首尾帧（可选）----
        // 单独一块放在卡片最下面，不插进「镜头内容」和底部按钮中间：
        // 首尾帧说的是「这一镜用哪张图开始 / 结束」，和「这一镜拍什么」是两件事，
        // 混在一行里读起来会打架。而且它是可选的，一整块不填也不碍事。
        const frames = document.createElement('div');
        frames.className = 'bc-frames';

        const framesCap = document.createElement('div');
        framesCap.className = 'bc-frames-cap';
        framesCap.innerHTML = '<span class="bc-cap">' + t('首尾帧（可选）') + '</span>'
          + '<span class="bc-hint">'
          + t('给这一镜指定用哪张图开始、停在哪张图，视频工具的首尾帧控制就有着落了')
          + '</span>';
        frames.appendChild(framesCap);

        /**
         * 一个首帧 / 尾帧控件：一个来源下拉 + 跟着来源变的明细。
         * @param which 'start' | 'end'
         */
        const frameField = (which, capText) => {
          const field = which === 'start' ? 'frameStart' : 'frameEnd';
          const box = document.createElement('div');
          box.className = 'bc-frame';

          // 能选哪几种来源由引擎给（plan.frameModes）：`slots` 说它能不能用在
          // 首帧 / 尾帧，`needPrev` 说它需要前面还有一镜。界面只做这两条通用过滤，
          // 不去认「prev」这个 id —— 认了就等于把业务判断在界面里抄了一份。
          const modes = plan.frameModes.filter((m) =>
            m.slots.indexOf(which) !== -1 && (!m.needPrev || i > 0));

          const head = document.createElement('div');
          head.className = 'bc-frame-head';
          const cap = document.createElement('span');
          cap.className = 'bc-cap';
          cap.textContent = capText;
          head.appendChild(cap);

          const sel = document.createElement('select');
          sel.className = 'select';
          sel.dataset.f = 'frame.' + which;
          modes.forEach((m) => {
            const o = document.createElement('option');
            o.value = m.id;
            o.textContent = m.label;
            sel.appendChild(o);
          });
          sel.value = (d[field] && d[field].mode) || 'none';
          sel.addEventListener('change', () => {
            const next = sel.value;
            const prev = d[field] || {};
            // 切走再切回来不该丢掉已经填好的内容，所以换个 mode 就把旧字段带过去。
            // draft 是工作副本；真正落盘时引擎会把用不上的字段清干净
            // （文生图不该带着文件路径跑进成品）。
            d[field] = next === 'none' ? null : {
              mode: next,
              text: prev.text || '',
              path: prev.path || '',
              name: prev.name || '',
              note: prev.note || '',
            };
            // 显示哪些明细跟着来源变，所以得重画这一张卡 —— 和换景别走同一条路
            renderAndReveal(i);
          });
          head.appendChild(sel);
          box.appendChild(head);

          const detail = document.createElement('div');
          detail.className = 'bc-frame-body';
          const cur = d[field];

          if (cur && cur.mode === 'text') {
            const ta = document.createElement('input');
            ta.className = 'input';
            ta.dataset.f = 'frame.' + which + '.text';
            ta.maxLength = plan.cellMax;
            ta.value = cur.text;
            // 留空不是「没填」—— 这一帧长什么样，本来就由这一镜的画面决定。
            // 引擎渲染时就是按这句话回落的，所以占位文案要和它说的一致。
            ta.placeholder = t('这一帧长什么样？留空就用这一镜的镜头内容');
            ta.addEventListener('input', () => { cur.text = ta.value; });
            detail.appendChild(ta);
          } else if (cur && cur.mode === 'file') {
            const mkInput = (key, placeholder, max) => {
              const el = document.createElement('input');
              el.className = 'input';
              el.dataset.f = 'frame.' + which + '.' + key;
              el.maxLength = max;
              el.value = cur[key] || '';
              el.placeholder = placeholder;
              el.addEventListener('input', () => { cur[key] = el.value; });
              return el;
            };
            const nameInput = mkInput('name', t('文件名'), plan.cellMax);
            const pathInput = mkInput('path', t('文件路径（网页拿不到真实路径，粘一下）'), plan.pathMax);
            const noteInput = mkInput('note', t('备注（可选，比如「收在伞尖」）'), plan.cellMax);

            const picker = document.createElement('input');
            picker.type = 'file';
            picker.accept = 'image/*';
            picker.className = 'bc-file-input';
            const pickBtn = document.createElement('button');
            pickBtn.type = 'button';
            pickBtn.className = 'btn btn-sm btn-ghost';
            pickBtn.dataset.f = 'frame.' + which + '.pick';
            pickBtn.textContent = t('选择文件…');
            pickBtn.addEventListener('click', () => picker.click());
            picker.addEventListener('change', () => {
              const f = picker.files && picker.files[0];
              // 先清空 value，否则连着选同一个文件不会再触发 change
              picker.value = '';
              if (!f) return;
              cur.name = f.name;
              // 浏览器出于安全**不给**网页真实路径（`file.path` 只有 Electron
              // 这类宿主才有）。拿不到就留空让用户自己粘 ——
              // 编一个假路径比空着更糟：他会照着去找一个不存在的文件。
              if (f.path) cur.path = f.path;
              nameInput.value = cur.name;
              pathInput.value = cur.path || '';
            });

            const nameRow = document.createElement('div');
            nameRow.className = 'bc-frame-filerow';
            nameRow.appendChild(nameInput);
            nameRow.appendChild(pickBtn);
            nameRow.appendChild(picker);
            detail.appendChild(nameRow);
            detail.appendChild(pathInput);
            detail.appendChild(noteInput);
          }
          box.appendChild(detail);
          return box;
        };

        frames.appendChild(frameField('start', t('首帧')));
        frames.appendChild(frameField('end', t('尾帧')));

        // 首帧接着上一镜，可上一镜没指定尾帧 —— 那条接法仍然成立
        // （上一镜生成结果的最后一帧就是它的尾帧），只是用户控制不了那一帧长什么样。
        // 提示，不拦着：他可能就是要「上一镜生成成什么样，这一镜就从那儿开始」。
        // 成品里也会写一句同样的话，两处说的是同一件事。
        if (i > 0 && d.frameStart && d.frameStart.mode === 'prev' && !draft[i - 1].frameEnd) {
          const warn = document.createElement('div');
          warn.className = 'board-warn';
          warn.textContent = t('镜头 {n} 没有指定尾帧，那它的「尾帧」就是它生成结果的最后一帧 —— '
            + '这一镜接得上，但那一帧长什么样你控制不了。想让衔接更可控，给镜头 {n} 也定一个尾帧。',
            { n: i });
          frames.appendChild(warn);
        }

        card.appendChild(frames);
        list.appendChild(card);
      });

      // ---- 在末尾再加一镜 ----
      // 每张卡上的 ＋ 是「插在它后面」，这里的是「加到最后」。
      // 两种诉求都要有：想补一个收尾镜头时，滚到底比找最后一张卡顺手。
      const addEnd = document.createElement('button');
      addEnd.type = 'button';
      addEnd.className = 'btn board-add';
      addEnd.dataset.act = 'add-end';
      addEnd.textContent = t('＋ 添加一个镜头');
      addEnd.disabled = draft.length >= plan.shotMax;
      if (addEnd.disabled) addEnd.title = t('一张表最多排 {n} 个镜头', { n: plan.shotMax });
      addEnd.addEventListener('click', () => insertShotAt(draft.length, draft.length - 1));
      wrap.appendChild(addEnd);

      // ---- 底部汇总 ----
      const foot = document.createElement('div');
      foot.className = 'board-foot';
      wrap.appendChild(foot);
      renderFoot();

      // ---- 按钮 ----
      const actions = mask.querySelector('.modal-actions');
      actions.innerHTML = '';

      const back = document.createElement('button');
      back.className = 'btn btn-ghost';
      back.textContent = t('← 返回');
      back.addEventListener('click', () => {
        closeModal();
        openRevision();
      });
      actions.appendChild(back);

      const reset = document.createElement('button');
      reset.className = 'btn';
      reset.dataset.act = 'reset';
      reset.textContent = t('恢复自动生成');
      // 本来就没手工改过，这个按钮等于什么都不做 —— 灰掉比点了没反应好
      reset.disabled = !manual;
      reset.title = manual ? t('丢掉你的调整，回到引擎自动排的版本') : t('当前就是自动排的版本');
      reset.addEventListener('click', async () => {
        Engine.clearStoryboardEdit(state.session);
        manual = false;
        const fresh = Engine.storyboardPlan(state.session);
        draft = fresh.shots.map((s) => ({
          shotId: s.shotId, moveId: s.moveId, seconds: s.seconds, cell: s.cell, focus: s.focus,
          frameStart: s.frameStart || null, frameEnd: s.frameEnd || null,
        }));
        await refreshAfterBoardEdit(t('已恢复成自动排的版本'));
        render();
      });
      actions.appendChild(reset);

      const save = document.createElement('button');
      save.className = 'btn btn-primary';
      save.dataset.act = 'save';
      save.textContent = t('保存调整');
      save.addEventListener('click', async () => {
        if (!Engine.setStoryboardEdit(state.session, draft)) {
          // 提示必须指向一个**真的能点的**东西：create 路径下 manual 还是 false，
          // 「恢复自动生成」是灰的，让它去点等于把人晾在原地。
          toast(manual
            ? t('这张表的数据对不上，没法保存 —— 请点「恢复自动生成」重来')
            : t('这张表的数据对不上，没法保存 —— 请关掉弹窗，重新点一次「生成分镜表」'));
          return;
        }
        manual = true;
        closeModal();
        await refreshAfterBoardEdit(t('分镜表已更新，Prompt 重新生成了'));
      });
      actions.appendChild(save);
    };

    render();
  }

  /* ================================================================ *
   * 实时预览
   * ================================================================ */

  function mergedSession() {
    if (!state.session) return null;
    const s = Object.assign({}, state.session, {
      answers: Object.assign({}, state.session.answers),
      customs: Object.assign({}, state.session.customs),
    });
    Object.keys(state.draft).forEach((qid) => {
      const d = state.draft[qid] || {};
      const selected = d.selected || [];
      const custom = String(d.custom || '').trim();
      if (!selected.length && !custom) {
        delete s.answers[qid];
        delete s.customs[qid];
        return;
      }
      s.answers[qid] = selected;
      if (custom) s.customs[qid] = custom;
      else delete s.customs[qid];
    });
    return s;
  }

  function updatePreview() {
    if (!state.session) {
      el.scoreBefore.textContent = '—';
      el.scoreAfter.textContent = '—';
      el.previewRound.textContent = t('未开始');
      state.decisionSig = '';
      el.decisionList.innerHTML = t('<div class="placeholder-note" style="padding:14px 6px">还没有做出任何选择。</div>');
      el.livePreview.textContent = t('（随着你的选择，这里会实时拼出最终 Prompt）');
      return;
    }

    const merged = mergedSession();
    const view = Engine.finalize(merged);

    el.scoreBefore.textContent = state.session.scoreBefore.total;
    el.scoreAfter.textContent = view.scoreAfter.total;

    if (!view.decisions.length) {
      const empty = t('<div class="placeholder-note" style="padding:14px 6px">还没有做出任何选择。</div>');
      if (state.decisionSig !== empty) {
        state.decisionSig = empty;
        el.decisionList.innerHTML = empty;
      }
    } else {
      const html = view.decisions.map((d) => `
        <div class="decision-item">
          <div class="d-title">${escapeHtml(d.title)}</div>
          <div class="d-val">${escapeHtml(d.labels.join(t('、')))}</div>
        </div>`).join('');
      // 内容没变就不重绘，避免动画反复播放
      if (state.decisionSig !== html) {
        state.decisionSig = html;
        el.decisionList.innerHTML = html;
      }
    }

    el.livePreview.textContent = view.promptText || t('（随着你的选择，这里会实时拼出最终 Prompt）');
  }

  /* ================================================================ *
   * 历史记录
   * ================================================================ */

  async function loadProjects() {
    try {
      const res = await API.listProjects();
      state.projects = res.projects || [];
    } catch (err) {
      state.projects = [];
    }
    renderHistory();
  }

  function renderHistory() {
    /* 游客：整块换成「这里为什么是空的」。
       只留一个空列表的话，用户会以为是没做完、或者记录丢了 ——
       必须写明这是**模式**决定的，并给出出口。 */
    if (state.guest) {
      el.historyCount.textContent = '—';
      el.historyList.innerHTML = t('<div class="sidebar-empty">免注册模式不保存记录。<br>这次做的选择在离开页面后会被清空。<br>登录之后才会存进你的账号。</div>');
      return;
    }

    el.historyCount.textContent = state.projects.length;
    if (!state.projects.length) {
      el.historyList.innerHTML = t('<div class="sidebar-empty">还没有保存过 Prompt。<br>完成一次拆解后会自动存进这里。</div>');
      return;
    }

    el.historyList.innerHTML = '';
    state.projects.forEach((p) => {
      const item = document.createElement('div');
      item.className = 'history-item' + (p.id === state.activeProjectId ? ' active' : '');
      // 这里原来给 chip 加了个 family emoji（🎨/🎬）。去掉的理由：scenarioName 本身
      // 就写着「图片生成」「视频生成」，图标一个字的信息都没多给；而 emoji 在不同平台
      // 渲染不一致（Windows 是文字符号、macOS 是彩色），和这套克制的纸墨色板打架。
      item.innerHTML = `
        <div class="h-title">${escapeHtml(p.title)}</div>
        <div class="h-meta">
          <span class="chip tiny">${escapeHtml(p.scenarioName || t('通用'))}</span>
          <span>${p.scoreBefore}→${p.scoreAfter}</span>
          <span>${formatTime(p.updatedAt)}</span>
        </div>
        <button class="h-del" title="${t('删除')}">✕</button>`;

      item.addEventListener('click', (e) => {
        if (e.target.classList.contains('h-del')) return;
        loadProject(p.id);
      });

      item.querySelector('.h-del').addEventListener('click', (e) => {
        e.stopPropagation();
        confirmDelete(p);
      });

      el.historyList.appendChild(item);
    });
  }

  async function loadProject(id) {
    try {
      // 列表接口只返回摘要，完整数据要单独取
      const res = await API.getProject(id);
      const p = res.project;
      if (!p) return;
      state.activeProjectId = id;
      state.savedProjectId = id;

      // 用存档重建一个只读的会话视图
      const restored = Engine.createSession(p.originalPrompt);
      // setScenario 会把 family / 信号 / 起始评分一并刷新，比手动赋值可靠
      Engine.setScenario(restored, p.scenarioId || restored.scenarioId);
      if (p.family === 'image' || p.family === 'video') {
        restored.family = p.family;
        restored.signals = K.extractSignals(p.originalPrompt, p.family);
        restored.scoreBefore = K.scoreOriginalPrompt(p.originalPrompt, restored.signals, p.family);
      }
      restored.answers = p.answers || {};
      restored.customs = {};
      // 从决策清单里还原用户的自定义输入
      (p.decisions || []).forEach((d) => {
        const hit = (d.labels || []).find((l) => l.indexOf(t('自定义：')) === 0);
        if (hit) restored.customs[d.qid] = hit.slice(4);
      });
      // 手工调整过的分镜表也要一起还回来，否则「载入记录 → 编辑分镜表」
      // 会看到引擎自动排的版本，用户以为自己改的东西丢了。
      // 数据对不上（签名变了 / 条数不对）时引擎会自己回落自动计划，这里不用兜底。
      if (p.storyboardEdit && typeof p.storyboardEdit === 'object') {
        restored.storyboardEdit = p.storyboardEdit;
      }
      state.session = restored;
      state.draft = {};
      state.batch = [];
      state.snapshots = [];
      const restoredHasBoard = /^## 分镜表$/m.test(p.finalPrompt || '');
      state.result = {
        family: restored.family,
        promptText: p.finalPrompt,
        negativePrompt: p.negativePrompt || '',
        decisions: p.decisions || [],
        scoreBefore: { total: p.scoreBefore, items: [] },
        scoreAfter: { total: p.scoreAfter, items: [] },
        improvements: [],
        rounds: 0,
        answerCount: (p.decisions || []).reduce((n, d) => n + (d.labels || []).length, 0),
        // 「是不是分镜」从正文就能看出来 —— 有 `## 分镜表` 就是。
        storyboard: restoredHasBoard,
        // 「为什么没生成分镜表」要**重算**，不能写死 null。
        // 这里曾经假设「记录里没存 session，所以算不出来」—— 其实答案都在 p.answers 里，
        // 会话刚在上面还原过。写死 null 的后果是：用户从记录里打开自己那一版，
        // 只看到一段连续描述，既不知道为什么没有分镜表，也不知道怎么才能拿到。
        storyboardNotice: restoredHasBoard ? null : Engine.storyboardNotice(restored),
      };

      el.resultSummary.textContent = t('这是 {time} 保存的记录，{family}的完整度 {before} → {after} 分。', {
        time: formatTime(p.createdAt),
        family: familyNoun(restored.family),
        before: p.scoreBefore,
        after: p.scoreAfter,
      });
      el.improveGrid.innerHTML = '';
      paintPrompt(el.finalPrompt, p.finalPrompt);
      el.finalMeta.textContent = t('{chars} 字符', { chars: p.finalPrompt.length });
      el.finalTitle.textContent = state.result.storyboard ? t('最终 Prompt · 分镜方案') : t('最终 Prompt');
      renderPromptNotice(state.result);
      renderNegative(state.result);
      renderUsage(restored.family);
      renderToolStrip(restored.family);
      el.decisionTable.innerHTML = `
        <thead><tr><th style="width:110px">环节</th><th>你的选择</th></tr></thead>
        <tbody>${(p.decisions || []).map((d) => `
          <tr><td>${escapeHtml(d.title)}</td><td>${escapeHtml((d.labels || []).join(t('、')))}</td></tr>`).join('')
          || t('<tr><td colspan="2">没有记录</td></tr>')}</tbody>`;

      // 按当前 family 的板块顺序排列「为什么这样写」
      const dims = [];
      (p.decisions || []).forEach((d) => { if (d.dim && dims.indexOf(d.dim) === -1) dims.push(d.dim); });
      const baseOrder = restored.family === 'text'
        ? K.SECTION_ORDER
        : (K.VISUAL_ORDER[restored.family] || []).concat(['negative']);
      renderWhy(baseOrder.filter((dim) => dims.indexOf(dim) !== -1));

      showStage('result');
      syncPromptOverflow();   // 同 finishFlow：等结果区可见之后再量
      syncBoardBtn();         // 存档里也有分镜表的话，同样允许继续编辑
      revealPrompt();
      updatePreview();
      renderHistory();
      closeDrawers(); // 窄屏下点完记录就把抽屉收起来，直接看结果
      toast(t('已载入历史记录'));
    } catch (err) {
      toast(err.message || t('载入失败'));
    }
  }

  function confirmDelete(p) {
    openModal({
      title: t('删除这条记录？'),
      desc: t('「{title}」将被永久删除，无法恢复。', { title: p.title }),
      actions: [
        { label: t('取消'), onClick: closeModal },
        {
          label: t('删除'),
          kind: 'danger',
          onClick: async () => {
            try {
              await API.deleteProject(p.id);
              state.projects = state.projects.filter((x) => x.id !== p.id);
              if (state.activeProjectId === p.id) {
                state.activeProjectId = null;
                resetFlow();
              }
              renderHistory();
              closeModal();
              toast(t('已删除'));
            } catch (err) {
              toast(err.message || t('删除失败'));
            }
          },
        },
      ],
    });
  }

  async function saveProject() {
    if (!state.session || !state.result) return;

    if (state.guest) {
      /* 不落盘 —— 但**不能静默**。
         用户刚做完好几轮选择，如果只是「没保存」而界面什么都不说，
         他会默认它存下了，等下次回来发现没有才意识到 ——
         这正是这个项目里反复出现的静默失效。所以当场、可见地说明。 */
      if (el.guestNotice) el.guestNotice.classList.remove('hidden');
      return;
    }

    const title = state.session.originalPrompt.replace(/[\r\n]+/g, ' ').slice(0, 40) || t('未命名 Prompt');
    const payload = {
      title,
      scenarioId: state.session.scenarioId,
      scenarioName: state.session.scenarioName,
      family: state.session.family || 'text',
      originalPrompt: state.session.originalPrompt,
      finalPrompt: state.result.promptText,
      negativePrompt: state.result.negativePrompt || '',
      answers: state.session.answers,
      decisions: state.result.decisions,
      scoreBefore: state.result.scoreBefore.total,
      scoreAfter: state.result.scoreAfter.total,
      // 手工调整过的分镜表要单独存一份：finalPrompt 里只有渲染结果，
      // 用户再打开记录就没法接着改了。没改过就是 undefined，服务端落成空。
      storyboardEdit: state.session.storyboardEdit || null,
    };

    try {
      if (state.savedProjectId) {
        await API.updateProject(state.savedProjectId, {
          title,
          finalPrompt: payload.finalPrompt,
          negativePrompt: payload.negativePrompt,
          answers: payload.answers,
          decisions: payload.decisions,
          scoreAfter: payload.scoreAfter,
          storyboardEdit: payload.storyboardEdit,
        });
      } else {
        const res = await API.createProject(payload);
        state.savedProjectId = res.project.id;
        state.activeProjectId = res.project.id;
      }
      await loadProjects();
    } catch (err) {
      toast(t('自动保存失败：{msg}', { msg: err.message || t('未知错误') }));
    }
  }

  async function exportAll() {
    try {
      const res = await API.listProjects();
      const list = res.projects || [];
      if (!list.length) return toast(t('还没有记录可以导出'));
      const blob = new Blob([JSON.stringify(list, null, 2)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'promptlens-records.json';
      a.click();
      URL.revokeObjectURL(url);
      toast(t('已导出 {n} 条记录', { n: list.length }));
    } catch (err) {
      toast(t('导出失败'));
    }
  }

  /* ================================================================ *
   * 启动
   * ================================================================ */

  boot();
})();
