'use strict';

/**
 * PromptLens i18n 运行时
 * ==================================================================
 * 职责：判定当前语种 → 装载对应文案包 → 把页面上的文案换掉 → 提供 t()。
 *
 * ------------------------------------------------------------------
 * 设计要点（每条都有理由，改之前先读完）
 * ------------------------------------------------------------------
 *
 * ① **以中文原文为 key**，不另起一套 key 名。
 *    `t('我的记录')` 而不是 `t('history.title')`。
 *
 *    理由：这个项目是中文优先，中文原文本身就是最好读的 key；
 *    翻译者看到的就是要翻的那句话，不用来回对照一份 key 表。
 *    副产品是 `ui.zh-Hans.js` 几乎是空的 —— 查不到就原样输出，
 *    简体天然就是对的，不需要维护一份「中文翻中文」的字典。
 *
 *    代价：改了中文原文却没改翻译 → 静默回退成中文。
 *    这条由 `scripts/check-i18n-coverage.js` 的**伪语种扫描**兜住
 *    （把所有译文换成哨兵，再扫 DOM 里还剩哪些中文），
 *    所以「漏翻」不会静默，别因为「看起来能跑」就不去管它。
 *
 *    少数不适合拿中文当 key 的（纯符号、需要按语境分开译的），
 *    用 ASCII key，例如 `t('unit.score')`。两种 key 走同一张表。
 *
 * ② 文案包用 **document.write 同步注入**，不用 fetch。
 *
 *    必须同步：knowledge.js 是「装载时就去注册表里拿文案」的，
 *    异步注入会让它在文案还没到的时候就开始跑。
 *    必须不用 fetch：`file://` 下 fetch 会被同源策略挡掉，
 *    而双击打开 HTML 也要能用（见 MEMORY 里的「零依赖 / 相对路径」约定）。
 *
 *    document.write 在这里是**正当用法**：只在解析期调用一次，
 *    写的还是同源相对路径的普通脚本。解析期之外调用会走异步兜底。
 *
 * ③ 页面 HTML 里保留中文原文（`data-i18n` 只是标记），
 *    所以：禁用 JS / 爬虫 / 简体用户 看到的都是正确内容。
 *    这也是落地页**不进这套运行时**的原因 —— 它要的是按语种烘好的静态 HTML。
 */

(function (root) {

/* ================================================================== *
 * 语种清单（唯一的真相来源）
 * ================================================================== */

/**
 * 加一个语种要动的地方：
 *   1. `public/assets/locales/<tag>.js`（知识库文案）；
 *   2. `public/assets/locales/ui.<tag>.js`（界面文案）；
 *   3. 这里加一条，并把 `ready` 打开。
 * 顺序就是切换器里的顺序。
 *
 * `htmlLang` 是写进 <html lang> 的值，和 tag 不一定相同 ——
 * `zh-Hans` 的规范 BCP-47 写法是 `zh-CN`，简体用户和爬虫都认这个。
 *
 * ⚠️ `ready` 这个字段不是装饰，是**防止切换器把人带进坏页面**的：
 * 切换器只列 ready 的语种，语言判定也只认 ready 的语种。
 * 少了它，翻译还没做的语种会出现在下拉里，用户一点 → 文案包 404 →
 * knowledge.js 拿不到数据 → 工作台整片炸。
 * 「列出来的必须能用」比「把规划中的都列出来」重要得多。
 */
const LOCALES = [
  { tag: 'zh-Hans', name: '简体中文', htmlLang: 'zh-CN', ready: true },
  { tag: 'zh-Hant', name: '繁體中文', htmlLang: 'zh-Hant', ready: true },
  { tag: 'en', name: 'English', htmlLang: 'en', ready: true },
  { tag: 'ja', name: '日本語', htmlLang: 'ja', ready: true },
  { tag: 'ko', name: '한국어', htmlLang: 'ko', ready: true },
  { tag: 'es', name: 'Español', htmlLang: 'es', ready: true },
];

const DEFAULT_TAG = 'zh-Hans';
const STORE_KEY = 'promptlens.locale';

const TAG_SET = {};
LOCALES.forEach((l) => { TAG_SET[l.tag] = l; });

function metaOf(tag) {
  return TAG_SET[tag] || TAG_SET[DEFAULT_TAG];
}

/** 这个语种**能不能用**（文案包齐了没有）—— 和「认不认识这个 tag」是两回事 */
function isReady(tag) {
  return !!(TAG_SET[tag] && TAG_SET[tag].ready);
}

/** 切换器里要列出来的 */
function readyLocales() {
  return LOCALES.filter((l) => l.ready);
}

/* ================================================================== *
 * 资源路径：从 i18n.js 自己的 src 反推 assets/ 目录
 * ================================================================== */

/**
 * 不能用 `assets/...` 写死：将来落地页会有 `/en/index.html` 这种更深的路由，
 * 写死就指到 `/en/assets/...` 去了。
 * 从自己的 src 反推，`../assets/js/i18n.js` 也能正确解析成 `../assets`。
 *
 * 顺便从自己的 `data-needs` 属性读出「这页要哪几份文案包」：
 *   不写     → 两份都装（工作台：既要界面文案，也要知识库文案）
 *   "ui"     → 只装界面文案（登录页：用不到 62KB 的知识库）
 * 让页面自己声明，比在运行时里猜「这页像不像需要知识库」可靠。
 */
const SELF = (function () {
  try {
    if (root.document && root.document.currentScript) return root.document.currentScript;
    const all = root.document.getElementsByTagName('script');
    return all[all.length - 1];
  } catch (e) { return null; }
})();

const ASSETS = (function () {
  let src = '';
  try {
    src = (SELF && SELF.getAttribute && SELF.getAttribute('src')) || '';
  } catch (e) { /* 非浏览器环境 */ }
  src = src.replace(/[?#].*$/, '').replace(/\/js\/i18n\.js$/, '');
  return src || 'assets';
})();

const NEEDS = (function () {
  try {
    const raw = (SELF && SELF.getAttribute && SELF.getAttribute('data-needs')) || '';
    return raw.trim() || 'all';
  } catch (e) { return 'all'; }
})();

/* ================================================================== *
 * 语种判定：URL 参数 → localStorage → navigator.language → 默认
 * ================================================================== */

/**
 * 浏览器语言 → 我们支持的 tag。
 *
 * `zh-TW` / `zh-HK` / `zh-MO` / `zh-Hant` 是繁体，其余中文一律简体。
 * 只返回 **ready** 的 tag：繁体包还没做时，台湾用户拿到简体，
 * 也好过被带进一个打不开的页面。等 zh-Hant 的包齐了、ready 打开，这里自动生效。
 */
function matchTag(raw) {
  const l = String(raw || '').toLowerCase().replace(/_/g, '-');
  if (!l) return null;
  if (l.indexOf('zh') === 0) {
    const t = /^zh-(tw|hk|mo|hant)/.test(l) ? 'zh-Hant' : 'zh-Hans';
    return isReady(t) ? t : null;
  }
  const base = l.split('-')[0];
  return isReady(base) ? base : null;
}

function readUrlTag() {
  try {
    const q = String(root.location.search || '').replace(/^\?/, '');
    if (!q) return null;
    const hit = q.split('&').map((kv) => kv.split('='))
      .filter((kv) => kv[0] === 'lang' || kv[0] === 'locale')[0];
    if (!hit) return null;
    const v = decodeURIComponent(hit[1] || '');
    return isReady(v) ? v : matchTag(v);
  } catch (e) { return null; }
}

function readStoredTag() {
  try {
    const v = root.localStorage && root.localStorage.getItem(STORE_KEY);
    return isReady(v) ? v : null;
  } catch (e) {
    // 隐私模式 / file:// 下 localStorage 可能直接抛，别让它把整页带崩
    return null;
  }
}

function readBrowserTag() {
  try {
    const nav = root.navigator || {};
    const list = nav.languages && nav.languages.length ? nav.languages : [nav.language];
    for (let i = 0; i < list.length; i += 1) {
      const hit = matchTag(list[i]);
      if (hit) return hit;
    }
  } catch (e) { /* 忽略 */ }
  return null;
}

function detectTag() {
  return readUrlTag() || readStoredTag() || readBrowserTag() || DEFAULT_TAG;
}

const TAG = detectTag();

/**
 * 把判定结果**发布到全局** —— 这是 i18n.js 和 knowledge.js 之间唯一的契约。
 *
 * knowledge.js 在装载时读 `PromptLensActiveLocale` 决定去取哪份知识库文案，
 * 它比本文件晚执行，所以这里只要在 body 里设上就行。
 *
 * 漏了这行的表现是：i18n.js 判出了 `en`，`<html lang>` 也变成了 `en`，
 * 切换器也显示 English —— 但 knowledge.js 一无所知，默默退回 zh-Hans，
 * 于是题目、选项、fragment 全是中文。**界面一半英文一半中文**，
 * 而且两边的代码单独看都没错。
 */
root.PromptLensActiveLocale = TAG;

/* ================================================================== *
 * 文案表
 * ================================================================== */

/**
 * 界面文案表：key（中文原文或 ASCII key）→ 译文。
 *
 * ⚠️ **必须懒取，不能在装载时读一次就存着**。
 * 文案包是本文件用 `document.write` 插进去的，那些 `<script>` 要等
 * **本文件跑完之后**才执行 —— 装载期读只会读到空表。
 *
 * 这个错的表现很阴：简体**看起来完全正常**（t() 本来就该退回中文），
 * 但 `t('unit.score')` 会把 'unit.score' 这串字面量画到界面上，
 * 而且**任何语种都翻不出来**（表永远是空的）。
 * 所以这里第一次拿到就缓存，拿不到就不缓存、下次再试。
 */
let _ui = null;

function uiTable() {
  if (_ui) return _ui;
  const reg = root.PromptLensUi || {};
  const pack = reg[TAG];
  if (!pack) return {};
  _ui = pack;
  return _ui;
}

/* ================================================================== *
 * t()：取值 + 插值 + 复数
 * ================================================================== */

/**
 * 把 `{name}` 换成 vars.name。
 * 插值放在译文里而不是拼字符串，是因为语序各语种不同 ——
 * `'第 ' + n + ' 轮'` 这种拼法翻不了（日语是「第{n}ラウンド」，
 * 英语可能是「Round {n}」，西语「Ronda {n}」）。
 */
function fill(text, vars) {
  return String(text).replace(/\{(\w+)\}/g, (m, k) => (
    vars[k] === undefined || vars[k] === null ? m : String(vars[k])
  ));
}

/**
 * 复数：译文可以写成 `{ one: '1 question', other: '{n} questions' }`。
 * 中文没有复数，所以 zh-Hans 的包基本用不上 ——
 * 但只要有一个语种需要，机制就得先在。
 */
function pickPlural(value, vars) {
  const n = vars ? Number(vars.n) : NaN;
  if (n === 1 && value.one !== undefined) return value.one;
  return value.other !== undefined ? value.other : value.one;
}

/**
 * 取文案。
 * 查不到就**原样输出 key** —— 这条是「以中文为 key」能成立的前提：
 * 简体用户永远不会看到 `history.title` 这种东西，看到的还是中文原文。
 */
function t(key, vars) {
  let out = uiTable()[key];
  if (out === undefined) out = key;
  if (out && typeof out === 'object') out = pickPlural(out, vars);
  return vars ? fill(out, vars) : String(out);
}

/* ================================================================== *
 * DOM 替换
 * ================================================================== */

/**
 * 原文要留底，否则第二次 apply（用户切换语种、或界面动态重渲染）时
 * 会拿**已经翻过的文本**去当 key，越翻越乱。
 * 存在 WeakMap 里而不是塞进 DOM 属性 —— 不污染 HTML，也不会被
 * 「数属性」之类的断言误伤。
 */
const origText = new WeakMap();
const origAttr = new WeakMap();
const origHtml = new WeakMap();

/** 连续空白（含源码里的换行缩进）压成一个空格 —— 缩进不该成为 key 的一部分 */
function normWs(s) {
  return String(s).replace(/\s+/g, ' ').trim();
}

function each(list, fn) {
  for (let i = 0; i < list.length; i += 1) fn(list[i]);
}

function applyAttrs(el) {
  const spec = el.getAttribute('data-i18n-attr');
  if (!spec) return;
  let store = origAttr.get(el);
  if (!store) { store = {}; origAttr.set(el, store); }
  spec.split(',').forEach((raw) => {
    const name = raw.trim();
    if (!name) return;
    if (store[name] === undefined) {
      const cur = el.getAttribute(name);
      if (cur === null) return;
      store[name] = cur;
    }
    el.setAttribute(name, t(store[name]));
  });
}

function applyText(el) {
  if (el.hasAttribute('data-i18n-html')) return;   // 交给 applyHtml，别两套都跑
  if (origText.get(el) === undefined) {
    // `data-i18n=""`（空值）表示「拿我自己的文字当 key」——
    // 这是绝大多数情况，所以 HTML 里写一个光秃秃的 data-i18n 就行。
    // 写了具体值时，那个值就是 key（给「同一句中文在不同语境要分开译」用）。
    const explicit = el.getAttribute('data-i18n');
    origText.set(el, explicit || normWs(el.textContent));
  }
  const next = t(origText.get(el));
  if (el.textContent !== next) el.textContent = next;
}

/**
 * `data-i18n-html`：元素里**带标记**的整句（`<br>` 断行、`<em>` 着重…）。
 *
 * key 取 innerHTML 而不是 textContent —— 断行位置和着重号是这句话的一部分，
 * 丢了标记译者就不知道哪儿该断行、哪个词该重读。
 * 译文也可以带自己的标记，语序由译者决定（这正是它存在的理由：
 * 按词拆成好几个 key 的话，语序一变就拼不成句子了）。
 *
 * 安全性：译文只来自我们自己的文案包，不经过任何用户输入。
 */
function applyHtml(el) {
  let rec = origHtml.get(el);
  if (!rec) { rec = { key: normWs(el.innerHTML), last: null }; origHtml.set(el, rec); }
  const next = t(rec.key);
  if (rec.last === next) return;      // 幂等：同一个值不重复写
  el.innerHTML = next;
  rec.last = next;
}

/**
 * 把 scope（默认整页）里所有标记过的节点换掉。
 * 幂等：可以反复调（切换语种、局部重渲染之后再调一次）。
 *
 * 界面里**动态生成**的节点，要么在生成时就调 t()，
 * 要么给个 data-i18n 标记然后调 `I18n.apply(container)`。
 */
function apply(scope) {
  const host = scope || root.document;
  if (!host || !host.querySelectorAll) return;
  each(host.querySelectorAll('[data-i18n]'), applyText);
  each(host.querySelectorAll('[data-i18n-html]'), applyHtml);
  each(host.querySelectorAll('[data-i18n-attr]'), applyAttrs);

  // <html lang> 要跟着走：读屏、翻译提示、爬虫都读它
  const html = root.document && root.document.documentElement;
  if (html && !scope) html.setAttribute('lang', metaOf(TAG).htmlLang);
}

/* ================================================================== *
 * 装载
 * ================================================================== */

function bundleUrl(kind, tag) {
  return ASSETS + '/locales/' + (kind === 'ui' ? 'ui.' : kind === 'demos' ? 'demos.' : '') + tag + '.js';
}

/**
 * 解析期用：同步注入。knowledge.js 紧接着就要读注册表，等不了异步。
 * 返回 false 表示「已经过了解析期」，调用方要改走 boot() 的异步路径。
 *
 * 三份文案包的分工：
 *   `<tag>.js`        知识库（题目 / 选项 / fragment / 认字用的正则）
 *   `ui.<tag>.js`     界面散句（含引擎的输出模板）
 *   `demos.<tag>.js`  文本对照示例（整段样例文字）
 *
 * ⚠️ `demos.<tag>.js` **只在非简体时注入**：简体用 demos.js 里内置的那份，
 * 简体再放一份就是第二份真相，改了这边忘了那边。缺这个文件时
 * demos.js 会**整块不展示**文本示例（而不是退回中文），所以 404 不是灾难，
 * 但会留下一条 console 报错 —— 这是故意的，别把它当噪音。
 */
function injectSync(tag) {
  const doc = root.document;
  if (!doc || doc.readyState !== 'loading') return false;
  if (NEEDS !== 'ui') {
    doc.write('<script src="' + bundleUrl('kb', tag) + '"><\/script>');
    if (tag !== DEFAULT_TAG) doc.write('<script src="' + bundleUrl('demos', tag) + '"><\/script>');
  }
  doc.write('<script src="' + bundleUrl('ui', tag) + '"><\/script>');
  return true;
}

function loadScript(src) {
  return new Promise((resolve) => {
    const s = root.document.createElement('script');
    s.src = src;
    // 装不上不 reject —— 少一个文案包不该把整页卡死，
    // 但会留下 console.error（见 verify），别让它静默
    s.onload = () => resolve(true);
    s.onerror = () => { console.error('[PromptLens] 文案包装载失败：' + src); resolve(false); };
    root.document.head.appendChild(s);
  });
}

/** 解析期之后才拿到语种时走这条：异步补装，然后必须重载页面（见 setTag） */
function injectAsync(tag) {
  const jobs = [];
  if (NEEDS !== 'ui') {
    jobs.push(loadScript(bundleUrl('kb', tag)));
    if (tag !== DEFAULT_TAG) jobs.push(loadScript(bundleUrl('demos', tag)));
  }
  jobs.push(loadScript(bundleUrl('ui', tag)));
  return Promise.all(jobs);
}

/** 注册表里该有的东西在不在。缺了要**报出来**，不能静默退回中文。 */
function verify() {
  const problems = [];
  const kb = root.PromptLensLocales || {};
  const ui = root.PromptLensUi || {};
  if (NEEDS !== 'ui' && !kb[TAG]) {
    problems.push('知识库文案包 ' + bundleUrl('kb', TAG) + ' 没装上');
  }
  if (!ui[TAG]) {
    problems.push('界面文案包 ' + bundleUrl('ui', TAG) + ' 没装上（界面会整片停在中文）');
  }
  if (problems.length) {
    console.error('[PromptLens] 语种 ' + TAG + ' 有问题：\n  - ' + problems.join('\n  - '));
  }
  // 文本对照示例缺了**不报错**（那是内容，缺了整块不展示，界面仍然是完整的），
  // 但要留一条 warn —— 否则「英语用户看不到示例」这件事没人会发现。
  if (NEEDS !== 'ui' && TAG !== DEFAULT_TAG
      && !(root.PromptLensDemosText || {})[TAG]) {
    console.warn('[PromptLens] 语种 ' + TAG + ' 还没有文本对照示例（'
      + bundleUrl('demos', TAG) + '），这一块会整块不展示。');
  }
  return problems;
}

/* ================================================================== *
 * 切换
 * ================================================================== */

/**
 * 切换语种 = 存下来 + **整页重载**。
 *
 * 不做「原地换文案」：知识库文案是在 knowledge.js 装载时绑定进去的
 * （题目、选项、fragment、评分项…），运行期换不干净，
 * 换一半的状态比不换更难查（用户会看到中英混排的 Prompt）。
 * 重载一次几百毫秒，换来的是「任何时刻都只有一个语种」。
 */
function setTag(tag) {
  if (!isReady(tag)) return;
  try { root.localStorage.setItem(STORE_KEY, tag); } catch (e) { /* 存不了也照跳 */ }
  const url = new URL(root.location.href);
  if (tag === DEFAULT_TAG) url.searchParams.delete('lang');
  else url.searchParams.set('lang', tag);
  root.location.replace(url.toString());
}

/* ================================================================== *
 * 语言切换器
 * ================================================================== */

/**
 * 两种形态，由页面决定：
 *
 *   'links'  —— 落地页用。指向**各语种自己的静态页**（`/en/`、`/ja/`…）。
 *               落地页要能被爬虫按语种索引，所以它不进运行时，
 *               切换器必须是真链接，不是 JS 换文案。
 *   'select' —— 工作台 / 登录页用。这两页在登录后面、noindex，
 *               没有按语种烘 HTML 的必要，客户端换一下就行。
 *
 * `links` 模式需要调用方给出各语种的 href（`hrefOf(tag)`），
 * 因为路径规则是路由的事，不是 i18n 的事。
 */
function mountSwitcher(host, opts) {
  const o = opts || {};
  const mode = o.mode || 'select';
  if (!host) return null;

  // 只有**一个**语种可用时干脆不放控件 —— 一个只有一个选项的下拉
  // 既没用又占地方，还会让用户以为切换坏了。
  // 等第二个语种的文案包齐了，切换器自己就出来了。
  const list = readyLocales();
  if (list.length < 2) return null;

  if (mode === 'links') {
    const nav = root.document.createElement('nav');
    nav.className = 'lang-switch';
    nav.setAttribute('aria-label', t('语言'));
    list.forEach((l) => {
      const a = root.document.createElement('a');
      a.className = 'lang-link' + (l.tag === TAG ? ' active' : '');
      a.href = o.hrefOf ? o.hrefOf(l.tag) : '?lang=' + l.tag;
      a.textContent = l.name;
      if (l.tag === TAG) a.setAttribute('aria-current', 'true');
      nav.appendChild(a);
    });
    host.appendChild(nav);
    return nav;
  }

  const wrap = root.document.createElement('label');
  wrap.className = 'lang-select-wrap';
  const sel = root.document.createElement('select');
  sel.className = 'lang-select';
  sel.setAttribute('aria-label', t('语言'));
  list.forEach((l) => {
    const opt = root.document.createElement('option');
    opt.value = l.tag;
    opt.textContent = l.name;
    if (l.tag === TAG) opt.selected = true;
    sel.appendChild(opt);
  });
  sel.addEventListener('change', () => setTag(sel.value));
  wrap.appendChild(sel);
  host.appendChild(wrap);
  return sel;
}

/* ================================================================== *
 * 导出
 * ================================================================== */

const I18n = {
  LOCALES,
  DEFAULT_TAG,
  tag: TAG,
  meta: metaOf(TAG),
  assets: ASSETS,
  needs: NEEDS,
  t,
  apply,
  mountSwitcher,
  setTag,
  detectTag,
  matchTag,
  readyLocales,
  isReady,
  injectAsync,
  verify,
  /** 供测试/调试：当前表里有多少条 */
  size: () => Object.keys(uiTable()).length,
  /** 供测试/调试：换一张表（浏览器里用不到，测试里省事） */
  _setUi: (obj) => { _ui = obj || {}; },
};

// 装载：解析期同步注入；已经过了解析期就异步补装（调用方负责之后重载）
if (!injectSync(TAG) && root.document) {
  // 走到这里说明 i18n.js 是被动态插进来的，静态脚本已经跑完了 ——
  // 这种页面结构本身就不对（knowledge.js 会在文案到位前启动）。
  // 只在浏览器里报：Node 侧（测试脚本、构建期）没有 document，那是正常的。
  console.error('[PromptLens] i18n.js 必须在解析期、且在 knowledge.js 之前加载');
}

root.PromptLensI18n = I18n;
if (typeof module !== 'undefined' && module.exports) module.exports = I18n;

})(typeof globalThis !== 'undefined' ? globalThis : this);
