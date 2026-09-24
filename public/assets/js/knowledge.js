'use strict';

/**
 * PromptLens 知识库
 * ------------------------------------------------------------------
 * 把「写 Prompt」这件事拆成一张可递归展开的决策树：
 *   用户每做一个选择 → 该选项自带 followUps 追问 → 追问进入下一轮
 * 直到所有分支收敛，再由 engine.js 组装成最终 Prompt。
 *
 * ==================================================================
 * 这个文件现在只放**两样东西**：
 *
 *   ① 结构骨架 —— 题目 id、选项 id、互斥组、dim、weight、流程顺序、
 *      拼接顺序、评分项的 key 与权重。
 *      这些**与语言无关**：换成日语，题目结构一个字都不该变。
 *
 *   ② 逻辑 —— 场景识别、线索提取、推荐、打分。
 *
 * 所有**文案**（场景名、题目、选项、fragment、章节标题、评分项 label，
 * 以及「认字用」的正则）都在 assets/locales/<tag>.js 里。
 * 加一个语种 = 复制一份文案包 + 在下面的 LOCALES 里登记，本文件不用动。
 *
 * 为什么正则也算文案：场景识别、线索提取、原始 Prompt 打分**都是认字的活儿**。
 * 日语用户输入日语，中文关键词表一条也匹配不上 —— 那些正则必须跟着语言走。
 * 它们出错的方式是「静默失效」（识别不出来、永远走兜底），所以
 * scripts/check-locale-parity.js 用行为对比盯着，不看源码文本。
 *
 * 选项字段说明（文案包里的）：
 *   label      按钮上显示的文字
 *   hint       按钮下方的一行小字（讲人话的解释）
 *   fragment   选中后注入最终 Prompt 的原文
 *   followUps  选中后需要继续追问的问题 id 列表
 *   scenarios  限定只在某些场景出现；留空表示全场景通用
 *   tags       用于把用户原始输入里的线索自动预选
 */

/* ================================================================== *
 * 〇、语种装载
 * ================================================================== */

/**
 * 支持的语种。
 *
 * ⚠️ **真相来源是 assets/js/i18n.js 的 LOCALES**（它还要喂语言切换器和
 * 后面的多语言路由），这里只是 Node 侧（测试脚本、构建期）拿不到 i18n.js
 * 时的兜底。两边各维护一份必然漂移 —— 所以优先读它。
 *
 * 只用来判「这个 tag 认不认识」。**能不能用**（文案包齐没齐）由 i18n.js
 * 的 `ready` 字段裁决，那件事不该有第二份实现。
 */
const FALLBACK_LOCALES = ['zh-Hans', 'zh-Hant', 'en', 'ja', 'ko', 'es'];
const DEFAULT_LOCALE = 'zh-Hans';

function supportedLocales() {
  const i18n = globalThis.PromptLensI18n;
  if (i18n && i18n.LOCALES && i18n.LOCALES.length) {
    return i18n.LOCALES.map((l) => (typeof l === 'string' ? l : l.tag));
  }
  return FALLBACK_LOCALES;
}

function resolveTag() {
  const want = globalThis.PromptLensActiveLocale;
  if (!want) return DEFAULT_LOCALE;
  if (supportedLocales().indexOf(want) === -1) {
    console.error('[PromptLens] 未知语种「' + want + '」，退回 ' + DEFAULT_LOCALE);
    return DEFAULT_LOCALE;
  }
  return want;
}

/**
 * 取文案包：先看注册表（浏览器里由页面先插 <script>），
 * 再退回 Node 的 require（测试脚本、构建期用）。
 *
 * 两条路都没有时**直接抛错，不退回中文**。
 * 理由：让日语用户看到中文界面，比白屏更难查 ——
 * 前者看起来「功能就是这样」，后者立刻有人来问。
 */
function resolveBundle(tag) {
  // 必须**每次重新读** globalThis，不能先取一份存着 ——
  // 文案包自己写的是 `globalThis.PromptLensLocales = globalThis.PromptLensLocales || {}`，
  // 如果这之前 globalThis 上还没有这个键，它会新建一个对象；
  // 而我们手里那份是「还没建时」拿到的空壳，永远等不到内容。
  // 表现就是：Node 里 require 明明成功了，却说「文案包没装载」。
  const reg = () => globalThis.PromptLensLocales || {};
  if (reg()[tag]) return reg()[tag];
  if (typeof require === 'function' && typeof module !== 'undefined') {
    try {
      require('../locales/' + tag + '.js');
    } catch (e) {
      throw new Error('[PromptLens] 文案包装载失败：' + tag + '\n  ' + e.message);
    }
    if (reg()[tag]) return reg()[tag];
  }
  throw new Error('[PromptLens] 文案包 ' + tag + ' 没装载。\n'
    + '  浏览器里必须在 knowledge.js **之前**引入 assets/locales/' + tag + '.js；\n'
    + '  新增语种要同时在 knowledge.js 的 LOCALES 里登记。');
}

const ACTIVE_LOCALE = resolveTag();
const L = resolveBundle(ACTIVE_LOCALE);

/** 装载过程中发现的问题（缺标签之类）。测试里断言它是空的。 */
const LOCALE_PROBLEMS = [];

/* ================================================================== *
 * 一、文案包还原（含预编译正则）
 * ================================================================== */

/** 把文案包里的正则源串还原成 RegExp；带 flags 的照带。 */
function re(source, flags) {
  return flags ? new RegExp(source, flags) : new RegExp(source);
}

/**
 * 预编译一整个「按 family 分组」的正则表。
 *
 * 表有两种形状，都要吃：
 *   { image: { hasLighting: '…' }, video: {…} }   —— 分组
 *   { visualSubject: '…', image: {…} }            —— 顶层直接是源串
 *
 * 必须**在装载时**编译好，不能每次调用现 new ——
 * extractSignals 是跟着用户输入跑的，每敲一个字都会调。
 */
function compileTable(table, flags) {
  const out = {};
  Object.keys(table || {}).forEach((fam) => {
    const v = table[fam];
    if (typeof v === 'string') { out[fam] = re(v, (flags || {})[fam]); return; }
    const ff = (flags || {})[fam] || {};
    out[fam] = {};
    Object.keys(v).forEach((k) => { out[fam][k] = re(v[k], ff[k]); });
  });
  return out;
}

const EXTRACT = compileTable(L.extractPatterns, L.extractFlags);
const DETAIL = compileTable(L.detailPatterns, L.detailFlags);

/** 场景识别的兜底线索 */
const CUES = {
  textTask: re(L.cues.textTask),
  visual: re(L.cues.visual),
  motion: re(L.cues.motion),
};

/* ---- 直接照搬的文案表 ---- */

const SCENARIOS = L.scenarios;
const QUESTIONS = L.questions;
const SECTION_TITLES = L.sectionTitles;
const SHOT_CONTENT = L.shotContent;
const SHOT_ROLE = L.shotRole;
const VISUAL_JOINER = L.visualJoiner;
const VISUAL_END = L.visualEnd;
const SECTION_EXPLAIN = L.sectionExplain;
const SIGNAL_LABELS = L.signalLabels;
const SCORE_ITEMS = L.scoreItems.text;
const SCORE_ITEMS_IMAGE = L.scoreItems.image;
const SCORE_ITEMS_VIDEO = L.scoreItems.video;

/**
 * 「原话里已经答了」的推荐规则。
 *
 * 归一化一次。三种写法都要能用：
 *   1. 正则字面量 —— zh-Hans 手写的那份就是这个；
 *   2. 字符串 `/源/旗标` —— **生成语种用这个**。文案包是 JSON.stringify 出来的，
 *      正则字面量过不去（`JSON.stringify(/re/)` 是 `{}`），所以生成语种把它写成
 *      「正则字面量的字符串形式」，这里再还原成真正的正则；
 *   3. 裸字符串 `源` —— 没有旗标的老写法，照样认。
 *
 * ⚠️ **既不是正则也不是字符串的值必须跳过，不能兜底成 `new RegExp(String(v))`。**
 *    这里以前就是那么写的，于是 `{}` 变成 `new RegExp("[object Object]")` ——
 *    那不是「匹配不到」，那是个**字符类**（o / b / j / e / c / t / 空格），
 *    几乎什么文本都命中，于是推荐标记**永远落在列表第一项**上：
 *    用户写「一只橘猫」却看到「推荐：人物」。不报错、不提示。
 *    所以这里宁可这条规则不生效（= 不显示推荐标记），也不要推荐错的东西。
 */
const RE_LITERAL = /^\/([\s\S]*)\/([gimsuy]*)$/;

function toRuleRe(v) {
  if (v instanceof RegExp) return v.source ? v : null;
  if (typeof v !== 'string') return null;
  const m = RE_LITERAL.exec(v);
  const src = m ? m[1] : v;
  if (!src) return null;
  return new RegExp(src, m ? m[2] : '');
}

const RECOMMEND_RULES = (() => {
  const src = L.recommendRules || {};
  const out = {};
  Object.keys(src).forEach((qid) => {
    const rules = [];
    (src[qid] || []).forEach((pair) => {
      const re = toRuleRe(pair && pair[1]);
      if (!re) {
        if (typeof console !== 'undefined' && console.warn) {
          console.warn('[PromptLens] 推荐规则既不是正则也不是字符串，已跳过：'
            + qid + ' → ' + (pair && pair[0]));
        }
        return;
      }
      rules.push([pair[0], re]);
    });
    out[qid] = rules;
  });
  return out;
})();

/* ================================================================== *
 * 二、流程编排（结构，与语言无关）
 * ================================================================== */

/** 场景归属的「家族」——决定用哪套问题流程、组装方式和评分标准 */
const SCENARIO_FAMILY = {
  writing: 'text',
  coding: 'text',
  analysis: 'text',
  marketing: 'text',
  learning: 'text',
  business: 'text',
  creative: 'text',
  general: 'text',
  image: 'image',
  video: 'video',
};

function familyOf(scenarioId) {
  return SCENARIO_FAMILY[scenarioId] || 'text';
}

/** 每套流程的问题顺序：core 先问，core 问完接 tail */
const FLOWS = {
  text: {
    core: ['intent', 'role', 'audience', 'format'],
    tail: ['tone', 'depth', 'constraints', 'antiAi', 'examples'],
  },
  image: {
    core: ['intent', 'img.subject', 'img.composition', 'img.lighting', 'img.style'],
    tail: ['img.mood', 'img.palette', 'img.ratio', 'img.quality', 'img.negative'],
  },
  video: {
    // vid.cut 排在 vid.shot **前面**，有两个理由：
    //   1. 结构决定先于取景决定 —— 先定「全片一个镜头还是多个」，
    //      再定「每个镜头怎么取景」，反过来用户会先答一堆用不上的景别。
    //   2. 一轮只出 2 道题（BATCH_SIZE=2），两题挨着才能同一轮出现 ——
    //      这样选了「一镜到底」时，景别题上那句动态提示（Engine.questionHint）
    //      当场就能看到。排在后面的话提示永远不会出现（那时景别早答完了）。
    core: ['intent', 'vid.action', 'vid.cut', 'vid.shot', 'vid.focus', 'vid.move', 'vid.style'],
    tail: ['vid.arc', 'vid.lighting', 'vid.duration', 'vid.detail', 'vid.audio', 'vid.ratio', 'vid.negative'],
  },
};

/** 文字类 Prompt 的段落顺序（输出成 Markdown 分节文档） */
const SECTION_ORDER = ['role', 'context', 'task', 'requirement', 'format', 'style', 'constraint', 'example'];

/**
 * 图片 / 视频类 Prompt 的拼接顺序。
 * 这类模型吃的是「逗号分隔的自然语言描述」，不是分节文档，
 * 所以按这个顺序拼成一段话，negative 单独输出。
 */
const VISUAL_ORDER = {
  image: ['task', 'subject', 'composition', 'lighting', 'mood', 'style', 'color', 'quality'],
  // cut 放在 action 之后、shot 之前：先交代「全片一个镜头还是多个」，
  // 再交代每个镜头怎么取景 —— 和问答的顺序一致（FLOWS.video.core）。
  video: ['task', 'action', 'cut', 'shot', 'focus', 'move', 'lighting', 'style', 'arc', 'duration', 'detail', 'audio', 'bgm'],
};

/**
 * 分镜的「首帧 / 尾帧」可以从哪来。
 *
 * 视频生成工具大多支持首尾帧控制：给一张图，模型就知道这一镜从哪儿开始、
 * 到哪儿结束。这张表就是那几个来源，以及它们各自能在哪个位置用。
 *
 *   none  未指定（默认）。成品里写「—」，等于明说这一镜不用管首尾帧。
 *   text  文生图。写一句话描述这一帧长什么样，交给文生图工具先生成。
 *         描述留空是合法的 —— 那这一帧长什么样就由这一镜的画面决定。
 *   file  从文件导入。用户手上已经有一张图了，记下文件名 / 路径 / 备注，
 *         成品里写清楚用哪个文件，他照着找就行。
 *   prev  沿用上一个分镜的尾帧 —— 上一镜停在哪儿，这一镜就从哪儿开始，
 *         两镜接得上。**只有首帧能用**：尾帧说的是「停在哪儿」，
 *         「接着上一镜的尾帧停下」讲不通。第一个分镜也没有这一项（前面没有分镜）。
 *
 * `slots` / `needPrev` 是**通用规则**，引擎和界面都照着它过滤，
 * 谁都不用去认 'prev' 这个 id —— 「哪些来源在哪儿合法」只该有一份实现。
 * label 在文案包里（`frameModeLabels`），这里只留骨架。
 */
const FRAME_MODES = [
  { id: 'none', slots: ['start', 'end'] },
  { id: 'text', slots: ['start', 'end'] },
  { id: 'file', slots: ['start', 'end'] },
  { id: 'prev', slots: ['start'], needPrev: true },
].map((m) => {
  const label = (L.frameModeLabels || {})[m.id];
  if (label === undefined) LOCALE_PROBLEMS.push('frameModeLabels 缺 ' + m.id);
  return Object.assign({}, m, { label: label || m.id });
});

// 拼接符同理：缺了它，图片/视频的成品会变成一坨没有分隔的字符串
['image', 'video'].forEach((fam) => {
  if (!VISUAL_JOINER || VISUAL_JOINER[fam] === undefined) {
    LOCALE_PROBLEMS.push('visualJoiner 缺 ' + fam);
  }
  // 句末符号允许是空串（图片就是），但**字段本身必须存在** ——
  // 漏登记的话引擎会当成「不补句末」，英文下看起来正常、中文下少了句号，
  // 而这是文案包写错，不是引擎的问题，所以在这里报出来。
  if (!VISUAL_END || VISUAL_END[fam] === undefined) {
    LOCALE_PROBLEMS.push('visualEnd 缺 ' + fam);
  }
});
if (LOCALE_PROBLEMS.length) {
  console.error('[PromptLens] 文案包 ' + ACTIVE_LOCALE + ' 有问题：\n  - '
    + LOCALE_PROBLEMS.join('\n  - '));
}

/* ================================================================== *
 * 三、场景识别
 * ================================================================== */

/**
 * 关键词表能覆盖「我要画一张图」这类明确诉求，但覆盖不了「一只戴着宇航头盔的
 * 橘猫，坐在月球表面」这种纯画面描述 —— 句子里一个工具名、一个任务动词都没有。
 * 所以这里额外判断一次：没有文字产出诉求、但充满可被画出来的细节，就归到视觉类。
 *
 * 三条线索正则都在文案包里：它们认的就是**用户输入的那个语种的字**。
 */

/** 返回 { image, video } 的加分，非视觉描述返回 null */
function visualBoost(text) {
  const lower = String(text || '');
  if (CUES.textTask.test(lower)) return null;   // 明确要文字产出，不抢
  if (!CUES.visual.test(lower)) return null;    // 没有任何画面细节
  return CUES.motion.test(lower)
    ? { image: 4, video: 10 }                   // 有动态 → 更像视频
    : { image: 9, video: 3 };                   // 静态画面 → 更像图片
}

function detectScenario(text) {
  const lower = String(text || '').toLowerCase();
  const scores = SCENARIOS.map((sc) => {
    let score = 0;
    let hits = 0;
    sc.keywords.forEach((kw) => {
      if (!kw) return;
      if (lower.includes(kw.toLowerCase())) {
        score += kw.length >= 3 ? 3 : 2;
        hits += 1;
      }
    });
    return { id: sc.id, name: sc.name, icon: sc.icon, desc: sc.desc, family: familyOf(sc.id), score, hits };
  });

  // 纯画面描述兜底：**关键词一个都没命中**时，靠视觉线索把图片 / 视频捞出来。
  //
  // 「一个都没命中」这个前提不能省 —— 省掉的话，兜底会去推翻本来已经判对的结论：
  // 静态画面给 image +9，而「短视频」这种明确信号只值 2 分（`视频` 两个字），
  // 于是「帮我做一段 30 秒的城市夜景短视频，多镜头切换」会被判成**图片**。
  // 后果不是「猜错一下」那么轻：用户被带进图片链路，
  // 「镜头景别」「运镜方式」「时长与节奏」这些视频题**永远不会出现**，
  // 而他明明说了要短视频。用户报的「没看见镜头景别的选项」就是这个。
  //
  // 所以兜底只在关键词完全没意见的时候才出手 —— 这也是它一直写在注释里的前提。
  const keywordMax = scores.reduce((m, s) => Math.max(m, s.score), 0);
  const boost = keywordMax > 0 ? null : visualBoost(text);
  if (boost) {
    scores.forEach((s) => {
      if (boost[s.id]) {
        s.score += boost[s.id];
        s.hits += 1;
      }
    });
  }

  // 同分时命中关键词更多的更具体，优先
  scores.sort((a, b) => (b.score - a.score) || (b.hits - a.hits));
  const best = scores[0];
  const matched = best.score > 0 ? best : scores.find((s) => s.id === 'general');
  return { matched, ranked: scores.filter((s) => s.score > 0).slice(0, 4) };
}

/**
 * 选项推荐
 * ------------------------------------------------------------------
 * 只覆盖「答案其实已经写在用户原话里」的那几个问题 —— 猜错的推荐比没有推荐更烦人。
 * 推荐只是给按钮加一个「推荐」标记，不会替用户选中，最终仍然由用户点。
 */
function recommendOption(qid, text) {
  const rules = RECOMMEND_RULES[qid];
  if (!rules) return null;
  const raw = String(text || '').toLowerCase();
  for (let i = 0; i < rules.length; i += 1) {
    if (rules[i][1].test(raw)) return rules[i][0];
  }
  return null;
}

/**
 * 从原始输入里提取线索，用于自动预选选项和打分。
 * 文字 / 图片 / 视频关注的东西完全不同，所以按 family 分开判断。
 *
 * 正则表来自文案包 —— 换成英语，这里认的就是英语的字。
 */
function extractSignals(text, family) {
  const raw = String(text || '');
  const fam = family || 'text';

  if (fam === 'image') {
    const P = EXTRACT.image;
    const signals = {
      hasSubject: raw.length >= 8,
      hasComposition: P.hasComposition.test(raw),
      hasLighting: P.hasLighting.test(raw),
      hasStyle: P.hasStyle.test(raw),
      hasColor: P.hasColor.test(raw),
      hasRatio: P.hasRatio.test(raw),
      hasNegative: P.hasNegative.test(raw),
      length: raw.length,
      family: 'image',
    };
    signals.matchedCount = Object.keys(signals)
      .filter((k) => k !== 'length' && k !== 'family' && signals[k] === true).length;
    return signals;
  }

  if (fam === 'video') {
    const P = EXTRACT.video;
    const signals = {
      hasSubject: raw.length >= 8,
      hasAction: P.hasAction.test(raw),
      hasShot: P.hasShot.test(raw),
      hasMove: P.hasMove.test(raw),
      hasStyle: P.hasStyle.test(raw),
      hasLighting: P.hasLighting.test(raw),
      hasDuration: P.hasDuration.test(raw),
      hasAudio: P.hasAudio.test(raw),
      hasNegative: P.hasNegative.test(raw),
      length: raw.length,
      family: 'video',
    };
    signals.matchedCount = Object.keys(signals)
      .filter((k) => k !== 'length' && k !== 'family' && signals[k] === true).length;
    return signals;
  }

  const P = EXTRACT.text;
  const signals = {
    hasRole: P.hasRole.test(raw),
    hasAudience: P.hasAudience.test(raw),
    hasFormat: P.hasFormat.test(raw),
    hasTone: P.hasTone.test(raw),
    hasConstraint: P.hasConstraint.test(raw),
    hasExample: P.hasExample.test(raw),
    hasLength: P.hasLength.test(raw),
    hasBackground: P.hasBackground.test(raw),
    length: raw.length,
    family: 'text',
  };
  const matched = Object.keys(signals)
    .filter((k) => k !== 'length' && k !== 'family' && signals[k] === true);
  signals.matchedCount = matched.length;
  return signals;
}

/* ================================================================== *
 * 四、原始 Prompt 质量评分
 * ================================================================== */

function scoreItemsFor(family) {
  if (family === 'image') return SCORE_ITEMS_IMAGE;
  if (family === 'video') return SCORE_ITEMS_VIDEO;
  return SCORE_ITEMS;
}

function scoreOriginalPrompt(text, signals, family) {
  const raw = String(text || '');
  const words = raw.length;
  const fam = family || (signals && signals.family) || 'text';
  const items = scoreItemsFor(fam);
  const detail = {};
  items.forEach((it) => { detail[it.key] = 0; });

  if (fam === 'image' || fam === 'video') {
    // 主体描述：长度 + 是否说了具体的东西
    if (words > 0) detail.subject += 7;
    if (words >= 10) detail.subject += 7;
    if (words >= 30) detail.subject += 5;
    if (DETAIL.visualSubject.test(raw)) detail.subject += 5;

    if (fam === 'image') {
      if (signals.hasComposition) detail.composition += 12;
      if (signals.hasRatio) detail.composition += 4;
      if (signals.hasLighting) detail.lighting += 12;
      if (DETAIL.image.lighting.test(raw)) detail.lighting += 4;
      if (signals.hasStyle) detail.style += 12;
      if (DETAIL.image.style.test(raw)) detail.style += 6;
      if (signals.hasColor) detail.color += 8;
      if (DETAIL.image.color.test(raw)) detail.color += 4;
      if (signals.hasNegative) detail.negative += 14;
    } else {
      if (signals.hasAction) detail.subject += 0; // 动作已计入主体
      if (signals.hasShot) detail.shot += 10;
      if (DETAIL.video.shot.test(raw)) detail.shot += 4;
      if (signals.hasMove) detail.move += 14;
      if (DETAIL.video.move.test(raw)) detail.move += 2;
      if (signals.hasStyle) detail.style += 12;
      if (DETAIL.video.style.test(raw)) detail.style += 6;
      if (signals.hasLighting) detail.lighting += 10;
      if (DETAIL.video.lighting.test(raw)) detail.lighting += 4;
      // 声音与配乐：说了配乐、环境音、旁白等任一，就算把「听感」交代了
      if (DETAIL.video.audio.test(raw)) detail.audio += 10;
      if (signals.hasNegative) detail.negative += 12;
    }
  } else {
    // 任务明确性：有一定长度且是祈使句/陈述需求
    if (words > 0) detail.task += 6;
    if (words >= 15) detail.task += 6;
    if (words >= 40) detail.task += 5;
    if (DETAIL.text.task.test(raw)) detail.task += 5;

    if (signals.hasRole) detail.role += 12;
    if (DETAIL.text.role.test(raw)) detail.role += 2;

    if (signals.hasBackground) detail.context += 9;
    if (signals.hasAudience) detail.context += 9;

    if (signals.hasFormat) detail.format += 10;
    if (signals.hasLength) detail.format += 6;
    if (DETAIL.text.format.test(raw)) detail.format += 4;

    if (signals.hasConstraint) detail.constraint += 12;

    // 语气与深度：说了调性（正式/口语/严谨…）或详略程度，都算「定了调子」
    if (signals.hasTone) detail.style += 8;
    if (DETAIL.text.styleTone.test(raw)) detail.style += 6;
    if (DETAIL.text.styleDepth.test(raw)) detail.style += 6;

    if (signals.hasExample) detail.example += 12;
  }

  let total = 0;
  const out = items.map((item) => {
    const value = Math.max(0, Math.min(item.weight, detail[item.key] || 0));
    total += value;
    return {
      key: item.key,
      label: item.label,
      hint: item.hint,
      weight: item.weight,
      value,
      ratio: value / item.weight,
    };
  });

  return { total: Math.round(total), items: out, family: fam };
}

/* ================================================================== *
 * 六、散句文案（t）
 * ================================================================== */

/**
 * 引擎和界面外壳里那些**成不了表**的句子，走这里翻译。
 *
 * 为什么不放进知识库文案包：
 *   知识库包是「结构化的题库」（题目 / 选项 / fragment / 评分项），
 *   而这里要的是 `'还有大约 {n} 个问题，全部答完就生成'` 这种
 *   带插值的散句、以及 `【核心主题】` 这种输出模板 —— 形状完全不同，
 *   混在一起会让「加一个拆解维度」这件事变难。
 *   所以它们住在 `assets/locales/ui.<tag>.js`（界面文案包）。
 *
 * ⚠️ **浏览器里必须委托给 i18n.js 的 t()，不要自己再查一遍表。**
 *   两份实现 = 迟早只有一份被修（复数规则、插值、空值处理）。
 *   i18n.js 比本文件先执行，所以这里拿得到它。
 *   拿不到时（Node 里的测试脚本、构建期）才走下面的兜底 ——
 *   兜底只做「查表 → 退回 key」和 `{name}` 插值，和 i18n.js 的行为一致。
 *
 * 查不到就**原样输出 key**：key 就是中文原文，所以简体用户看到的就是对的，
 * 而 ui.zh-Hans.js 可以是空的。这条是「以中文为 key」能成立的前提。
 */
let _uiTable = null;

function uiTable() {
  if (_uiTable) return _uiTable;
  const reg = () => globalThis.PromptLensUi || {};
  if (!reg()[ACTIVE_LOCALE] && typeof require === 'function' && typeof module !== 'undefined') {
    // 缺界面文案包不致命（散句会停在中文），所以这里吞掉异常；
    // 「包齐没齐」由 i18n.js 的 verify() 和 check-i18n-coverage.js 负责报。
    try { require('../locales/ui.' + ACTIVE_LOCALE + '.js'); } catch (e) { /* 见上 */ }
  }
  _uiTable = reg()[ACTIVE_LOCALE] || {};
  return _uiTable;
}

function t(key, vars) {
  const i18n = globalThis.PromptLensI18n;
  if (i18n && typeof i18n.t === 'function') return i18n.t(key, vars);
  let out = uiTable()[key];
  if (out === undefined) out = key;
  if (vars) {
    out = String(out).replace(/\{(\w+)\}/g, (m, k) => (
      vars[k] === undefined || vars[k] === null ? m : String(vars[k])
    ));
  }
  return String(out);
}

/* ================================================================== *
 * 导出
 * ================================================================== */

const Knowledge = {
  // 语种
  DEFAULT_LOCALE,
  supportedLocales,
  locale: ACTIVE_LOCALE,
  LOCALE_PROBLEMS,

  // 散句文案
  t,
  uiTable,

  SCENARIOS,
  QUESTIONS,
  FLOWS,
  SCENARIO_FAMILY,
  familyOf,
  SECTION_TITLES,
  SECTION_ORDER,
  VISUAL_ORDER,
  VISUAL_JOINER,
  VISUAL_END,
  SHOT_CONTENT,
  SHOT_ROLE,
  FRAME_MODES,
  SECTION_EXPLAIN,
  SIGNAL_LABELS,
  SCORE_ITEMS,
  SCORE_ITEMS_IMAGE,
  SCORE_ITEMS_VIDEO,
  scoreItemsFor,
  detectScenario,
  RECOMMEND_RULES,
  recommendOption,
  extractSignals,
  scoreOriginalPrompt,
};

// 用 globalThis 而不是 window：这样在 Node 里跑测试脚本时，demos.js 也能拿到知识库自动挂载
if (typeof globalThis !== 'undefined') {
  globalThis.PromptLensKnowledge = Knowledge;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Knowledge;
}
