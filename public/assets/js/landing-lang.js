'use strict';

/**
 * 落地页的语言自适应 —— 检测系统语言，把用户带到**他自己那一种**页面。
 *
 * 这是落地页唯一的一个脚本。落地页其余部分（包括页脚那六个语言链接、
 * 页头那个 `<details>` 菜单）都是**烘死的静态标记**，不依赖本文件：
 * 本文件挂了、被拦了、被关了 JS，页面照样读得完、语言照样换得了。
 * 这一点是刻意的 —— 落地页是全站唯一可索引的页面，不能把可用性押在 JS 上。
 *
 * ------------------------------------------------------------------
 * 四条豁免（每一条都对应一个真会发生的坏结果）
 * ------------------------------------------------------------------
 *
 * ① **只在 x-default 那一页跳**（当前就是根页 `/`）。
 *    `/ja/` 这种地址是用户的**明确选择** —— 别人分享给他、或他从搜索结果点进来。
 *    在那里再按系统语言跳一次，等于「我点开的链接不是我要的页面」，
 *    而且会把分享出去的深链接搞乱。
 *    判据不是写死「路径等于 /」，而是**这一页的 canonical 是不是等于
 *    hreflang="x-default" 那条** —— 从生成器已经烘好的数据里读，
 *    改语种策略时它自动跟着走，不会和 hreflang 打架。
 *
 * ② **爬虫豁免**。Googlebot 会执行 JS。不豁免的话它抓 `/` 会被跳到 `/en/`，
 *    于是 `/` 变成一个「重定向页」，中文版首页的排名丢掉 ——
 *    而这件事在浏览器里**完全看不出来**。
 *    宁可漏判（少跳一次）也不能误判（把爬虫跳走），所以判据取宽。
 *
 * ③ **用户显式选过语种就不再覆盖**。没有这条会有**来回弹**：
 *    日本用户打开 `/` → 被跳到 `/ja/` → 点页脚「简体中文」→ 回到 `/`
 *    → 脚本又按系统语言把他弹回 `/ja/`。他永远看不到中文版。
 *    所以：点切换器链接时把选择存下来，存过就**只认存的那一个**。
 *
 * ④ **认不出、或认出来就是当前这一页，就什么都不做**。默认永远是「留在原地」，
 *    所有不确定都往「不跳」的方向倒。
 *
 * ------------------------------------------------------------------
 * 语种表从 DOM 读，不另抄一份
 * ------------------------------------------------------------------
 *
 * 页脚 `.lang-switch` 里那六个 `<a hreflang="…">` 就是语种清单，
 * 生成器烘出来的、已经和 `i18n.js` 对过账。这里**再抄一张表**就等于
 * 多了一个必然漂移的副本（加第七个语种时漏改一处，只有那一个语种的用户会中招）。
 * 所以：tag 从 `hreflang` 读，名字从链接文字读，地址从 `href` 读 —— 全是现成的。
 */

(function (root) {
  'use strict';

  const STORE_KEY = 'promptlens.locale';
  const DEFAULT_TAG = 'zh-Hans';

  /**
   * 爬虫判据。**故意取宽**：误判成爬虫的后果是「少跳一次」（用户自己点一下就好），
   * 漏判的后果是「搜索引擎把首页当成重定向页」（没人会发现）。
   *
   * ⚠️ 不要往里加 `headless` —— 本项目的实机校验就是跑在无头 Chrome 上的，
   * 加了之后「系统语言是日语时会跳」这条断言再也测不出来。
   */
  const BOT_RE = /\b(bot|crawler|crawling|spider|slurp|fetcher|validator|lighthouse)\b|googlebot|bingbot|yandex|baiduspider|duckduckbot|petalbot|applebot|facebookexternalhit|twitterbot|linkedinbot|slackbot|telegrambot|discordbot|whatsapp|pinterest|bytespider|gptbot|claudebot|perplexitybot|ahrefs|semrush|mj12bot|dotbot|sogou|360spider/i;

  /**
   * 浏览器语言 → 我们支持的 tag。
   *
   * 和 `i18n.js` 的 `matchTag` **必须同义**，否则会出现
   * 「工作台判定成繁体、落地页判定成简体」这种最难查的分裂。
   * 有一条断言拿同一批探针把两边跑一遍逐条比对（见 `check-landing.js`）。
   *
   * 规则：精确 → 逐级去掉子标签 → 中文单独判（tw/hk/mo/hant 是繁体，其余简体）
   * → 主语言。
   */
  function tagFor(browserTag, available) {
    const list = available || [];
    const raw = String(browserTag || '').toLowerCase().replace(/_/g, '-');
    if (!raw) return null;

    const exact = list.find((t) => t.toLowerCase() === raw);
    if (exact) return exact;

    const parts = raw.split('-');
    for (let n = parts.length - 1; n >= 1; n -= 1) {
      const p = parts.slice(0, n).join('-');
      const hit = list.find((t) => t.toLowerCase() === p);
      if (hit) return hit;
    }

    if (parts[0] === 'zh') {
      const hant = list.find((t) => /^zh-hant$/i.test(t));
      const hans = list.find((t) => /^zh-hans$/i.test(t));
      const isHant = /^(tw|hk|mo|hant)$/.test(parts[1] || '') || parts.indexOf('hant') !== -1;
      return (isHant ? hant : hans) || hans || hant || null;
    }

    const base = list.find((t) => t.toLowerCase() === parts[0]);
    return base || null;
  }

  /* ---------------------------------------------------------------- *
   * 从 DOM 读现状
   * ---------------------------------------------------------------- */

  function readAvailable(doc) {
    const out = [];
    const links = doc.querySelectorAll('.lang-switch a[hreflang]');
    for (let i = 0; i < links.length; i += 1) {
      const a = links[i];
      const tag = a.getAttribute('hreflang');
      if (tag && !out.some((x) => x.tag === tag)) {
        out.push({ tag: tag, href: a.getAttribute('href'), name: (a.textContent || '').trim() });
      }
    }
    return out;
  }

  function readCur(doc, available) {
    const act = doc.querySelector('.lang-switch a.lang-link.active[hreflang]');
    if (act) return act.getAttribute('hreflang');
    /* 没有 active 标记时退回 `<html lang>`：生成器烘的是 zh-CN / zh-Hant / en / ja / ko / es，
       它和 tag 不是一回事（zh-CN ↔ zh-Hans），所以过一遍 tagFor。 */
    const tags = available.map((x) => x.tag);
    return tagFor(doc.documentElement.getAttribute('lang'), tags) || DEFAULT_TAG;
  }

  /**
   * 这一页是不是 **x-default** 那一页（也就是「没有指明语种」的入口页）。
   *
   * 不写死「路径是不是 /」：路径规则是生成器的事，
   * 而 canonical 和 hreflang 都是生成器烘出来的、已经被断言钉住的数据。
   * 从它们推，改语种策略时这里自动跟着走。
   */
  function isXDefault(doc) {
    const can = doc.querySelector('link[rel="canonical"]');
    const xd = doc.querySelector('link[rel="alternate"][hreflang="x-default"]');
    if (!can || !xd) return false;
    const a = can.getAttribute('href');
    const b = xd.getAttribute('href');
    return !!a && !!b && a === b;
  }

  /* ---------------------------------------------------------------- *
   * 检测链：URL 参数 → 存下来的偏好 → 系统语言
   * ---------------------------------------------------------------- */

  function readUrlTag(loc, tags) {
    try {
      const q = String(loc.search || '').replace(/^\?/, '');
      if (!q) return null;
      const hit = q.split('&')
        .map((kv) => kv.split('='))
        .filter((kv) => kv[0] === 'lang' || kv[0] === 'locale')[0];
      if (!hit) return null;
      const v = decodeURIComponent(hit[1] || '');
      return tags.indexOf(v) !== -1 ? v : tagFor(v, tags);
    } catch (e) { return null; }
  }

  function readStoredTag() {
    try {
      const v = root.localStorage && root.localStorage.getItem(STORE_KEY);
      return v || null;
    } catch (e) {
      /* 隐私模式 / file:// 下可能直接抛。抛了就当作没存过 ——
         没有它，用户点「简体中文」会被弹回日语；但那是**可用性**问题，
         不能让一个存储异常把整页带崩。 */
      return null;
    }
  }

  function readBrowserTag(tags) {
    try {
      const nav = root.navigator || {};
      const list = nav.languages && nav.languages.length ? nav.languages : [nav.language];
      for (let i = 0; i < list.length; i += 1) {
        const hit = tagFor(list[i], tags);
        if (hit) return hit;
      }
    } catch (e) { /* 忽略 */ }
    return null;
  }

  function isBot(ua) {
    return BOT_RE.test(String(ua || ''));
  }

  /**
   * 纯函数：给一组环境输入，返回**该不该跳、跳到哪个 tag**。
   *
   * 单独抽出来是为了能被直接测 —— 跳转这件事在浏览器里只发生一次、
   * 还带着导航副作用，靠端到端去覆盖四种豁免成本太高，
   * 而纯函数可以拿十几组输入把每条分支都钉住。
   *
   * 返回 `{ tag: <tag|null>, why: <原因> }`。`why` 是给断言和排错看的。
   */
  function decide(env) {
    const tags = env.available || [];
    if (!env.isXDefault) return { tag: null, why: 'not-x-default' };
    if (env.isBot) return { tag: null, why: 'bot' };
    if (!tags.length) return { tag: null, why: 'no-list' };

    /* 显式偏好优先于系统语言 —— 这是防「来回弹」的那一条。
       URL 参数最优先：它是这一次点击的明确意图。 */
    const want = env.urlTag || env.storedTag || env.browserTag || null;
    if (!want) return { tag: null, why: 'undetected' };
    if (tags.indexOf(want) === -1) return { tag: null, why: 'unsupported' };
    if (want === env.cur) return { tag: null, why: 'same' };
    return { tag: want, why: env.urlTag ? 'url' : (env.storedTag ? 'stored' : 'browser') };
  }

  /* ---------------------------------------------------------------- *
   * 页面上的两件小事
   * ---------------------------------------------------------------- */

  /**
   * `file://` 下把目录地址补成 `index.html`。
   *
   * 为什么需要：`href="en/"` 在 HTTP 下由服务端补 `index.html`，
   * 但在 `file://` 下浏览器**给的是目录列表**，不是页面 ——
   * 本地直接双击打开落地页时，点「English」会看到一串文件名。
   * 本项目明确要求 `file://` 直接打开也能用，所以这里补一层归一化：
   * 只改导航用的地址，HTML 里写的仍然是 `en/`（canonical 那种干净地址）。
   *
   * 纯函数，可以直接单测（见 check-landing.js）。
   */
  function fileIndex(href) {
    const h = String(href || '');
    if (!/\/$/.test(h)) return h;
    return h + 'index.html';
  }

  /** 把用户的选择存下来 —— 没有这一步就会有「点了简体中文被弹回日语」的死循环。 */
  function remember(tag) {
    try { root.localStorage.setItem(STORE_KEY, tag); } catch (e) { /* 存不了也照跳 */ }
  }

  /**
   * 点页脚/页头任何一个语言链接 = 一次明确选择，存下来。
   *
   * 用捕获阶段：`<details>` 里的链接也一样能拦到，而且不依赖
   * 那些链接有没有被别的监听器处理过。
   * 顺便在 `file://` 下把目录地址补成 `index.html`（见 fileIndex）。
   */
  function wireClicks(doc, loc) {
    const isFile = String((loc || root.location || {}).protocol || '') === 'file:';
    doc.addEventListener('click', (e) => {
      let el = e.target;
      while (el && el !== doc) {
        if (el.getAttribute && el.getAttribute('hreflang')
          && el.classList && el.classList.contains('lang-link')) {
          remember(el.getAttribute('hreflang'));
          if (isFile) {
            const raw = el.getAttribute('href') || '';
            const fixed = fileIndex(raw);
            if (fixed !== raw) { e.preventDefault(); (loc || root.location).href = fixed; }
          }
          return;
        }
        el = el.parentNode;
      }
    }, true);
  }

  /** 点开菜单后点外面要能收起来；点了里面的链接也收起来。 */
  function wireMenu(doc) {
    doc.addEventListener('click', (e) => {
      const open = doc.querySelectorAll('details.lang-menu[open]');
      for (let i = 0; i < open.length; i += 1) {
        if (!open[i].contains(e.target)) open[i].removeAttribute('open');
      }
    });
    doc.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      const open = doc.querySelectorAll('details.lang-menu[open]');
      for (let i = 0; i < open.length; i += 1) open[i].removeAttribute('open');
    });
  }

  /* ---------------------------------------------------------------- *
   * 执行
   * ---------------------------------------------------------------- */

  function run(doc, loc) {
    const d = doc || root.document;
    if (!d) return { tag: null, why: 'no-document' };
    const l = loc || root.location;

    const available = readAvailable(d);
    const cur = readCur(d, available);
    const tags = available.map((x) => x.tag);

    const verdict = decide({
      available: tags,
      cur: cur,
      isXDefault: isXDefault(d),
      isBot: isBot((root.navigator || {}).userAgent),
      urlTag: readUrlTag(l, tags),
      storedTag: readStoredTag(),
      browserTag: readBrowserTag(tags),
    });

    wireClicks(d, l);
    wireMenu(d);

    if (!verdict.tag) return verdict;

    const hit = available.find((x) => x.tag === verdict.tag);
    if (!hit || !hit.href) return { tag: null, why: 'no-href' };

    /* 带上锚点：`/#scenes` 跳到 `/ja/` 时应该落在 `/ja/#scenes`。
       `location.hash` 本身就是带 `#` 的。 */
    const isFile = String(l.protocol || '') === 'file:';
    l.replace((isFile ? fileIndex(hit.href) : hit.href) + (l.hash || ''));
    return verdict;
  }

  const api = {
    STORE_KEY: STORE_KEY,
    DEFAULT_TAG: DEFAULT_TAG,
    BOT_RE: BOT_RE,
    tagFor: tagFor,
    decide: decide,
    isBot: isBot,
    isXDefault: isXDefault,
    readAvailable: readAvailable,
    readCur: readCur,
    readUrlTag: readUrlTag,
    readStoredTag: readStoredTag,
    readBrowserTag: readBrowserTag,
    remember: remember,
    fileIndex: fileIndex,
    run: run,
  };

  root.PromptLensLandingLang = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;

  /* 在浏览器里自动跑一次。`defer` 保证 DOM 已经解析完，所以不用等事件。
     在 Node 里被 require 时（校验脚本要拿它跑纯函数）**不跑**，
     否则它会去碰一个不存在的 document。 */
  if (root.document && root.location) {
    try { run(root.document, root.location); } catch (e) {
      /* 跳转失败绝不能让页面白屏。留在原地永远是安全的兜底。 */
      if (root.console && root.console.warn) root.console.warn('[lang] 检测失败，留在原地', e);
    }
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
