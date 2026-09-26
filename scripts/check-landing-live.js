'use strict';

/**
 * 落地页实机检查（要起服务）
 * ==================================================================
 * `check-landing.js` 查的是**静态 HTML**：canonical / hreflang / JSON-LD 这些
 * 在源码里就能判。但有两件事只有把页面真的渲染出来才量得到：
 *
 *   ① **横向溢出**。语言切换器放在页脚而不是页头，就是因为页头版心固定 1080px
 *      且 .site-head-in 不换行 —— 西语的四个导航项加六个语言项会挤出去。
 *      页脚靠 flex-wrap 兜住，但「兜住了没有」是布局问题，源码里看不出来。
 *      六种语言 × 四种宽度 = 24 种组合，肉眼看不过来，必须量。
 *   ② **切换器真的点得动**。真链接是落地页的关键（爬虫不跑 JS），
 *      但 href 写对了不等于点得动 —— 可能被 sticky 页头之类的元素盖住。
 *
 * ⚠️ 切换器的 href 指向**生产域名**（现在是 RFC 2606 的 example.com，故意不可达）。
 *    所以这里**不点**它 —— 点了会跳进「无法访问此网站」。
 *    改测两件更本质的事：
 *      · 链接的**路径**对不对（换成当前 BASE 走一遍，看落到的是不是那个语种）；
 *      · 链接**点不点得动**（用 elementFromPoint 看它上面有没有别的东西盖着）。
 *    域名那部分由 check-landing.js 静态查（六条 href 与 canonical 同源同前缀）。
 *
 * 用法：node scripts/check-landing-live.js
 * 依赖本地服务已启动（默认 http://127.0.0.1:5178，可用 BASE 覆盖）。
 * ⚠️ 换端口要设 **BASE**，不是 PORT —— 这里的 PORT 是 CDP 端口（见下）。
 *    之前这行注释写的是 5179，和下面的默认值对不上，照注释写会整轮跑在连接错误页上。
 */

const path = require('path');
const { launch, sleep } = require('C:/Users/jack/.workbuddy-ai/skills/cdp-browser-e2e/templates/cdp-client.js');
const { quietMotion } = require('./lib/quiet-motion');

const BASE = process.env.BASE || 'http://127.0.0.1:5178';
/* 调试端口交给 Chrome 自己挑（见 cdp-client.js 里 port 的注释）。
   原来这里固定一个端口，上一次跑崩留下的浏览器会一直占着它 ——
   下一次启动的浏览器抢不到，而连接照样成功，于是量到的是**别人**那一页。
   要固定端口就设环境变量 CDP_PORT，模板会读。 */

/** 与生成器同一张表（有意重抄，理由见 check-landing.js） */
const LOCALES = [
  { tag: 'zh-Hans', dir: '', htmlLang: 'zh-CN' },
  { tag: 'zh-Hant', dir: 'zh-Hant', htmlLang: 'zh-Hant' },
  { tag: 'en', dir: 'en', htmlLang: 'en' },
  { tag: 'ja', dir: 'ja', htmlLang: 'ja' },
  { tag: 'ko', dir: 'ko', htmlLang: 'ko' },
  { tag: 'es', dir: 'es', htmlLang: 'es' },
];

/** 各语种的自称。页头菜单收起时显示的就是它，写错成「Japanese」这类要能查出来。 */
const ENDONYM = {
  'zh-Hans': '简体中文', 'zh-Hant': '繁體中文', en: 'English',
  ja: '日本語', ko: '한국어', es: 'Español',
};

/*
 * 每个语种正文/标题应当由哪一类字族渲染。
 *
 * 为什么必须查：--font 里第一个有汉字的字族是 PingFang SC / Microsoft YaHei，
 * 两个都是**简体中文**字体。不按语种覆盖的话，日文页面的汉字是用中文字形渲染的 ——
 * 「直」「骨」「今」「画」中日不同形，日本人一眼看出来。
 * 实测过：覆盖前 ja 的 .hero-lede 是 Microsoft YaHei(135)、标题是 SimSun。
 *
 * want 命中「本语种的字族」，avoid 命中「不属于本语种的字族」。
 * 两个都要查：只查 want 的话，一个既含日文字族又含中文字族的兜底链会蒙混过关。
 * 名字里带上本地化写法（微軟正黑體 / 맑은 고딕）——
 * Chrome 在本地化系统上会报本地名，只写拉丁名会漏。
 */
const CJK_FONT = /YaHei|PingFang|SimSun|Songti|JhengHei|MingLiU|正黑|細明|新細明|Hiragino|ヒラギノ|Yu Gothic|Yu Mincho|游ゴシック|游明朝|Meiryo|メイリオ|Malgun|맑은|Gulim|굴림|Batang|바탕|Noto (Sans|Serif) (JP|KR|SC|TC)|Source Han/;

const FONT_RULES = {
  'zh-Hans': {
    want: /YaHei|雅黑|PingFang SC|SimSun|宋体|Songti SC|Noto Sans SC|Source Han Sans SC/,
    avoid: null,
  },
  'zh-Hant': {
    want: /JhengHei|正黑|PingFang TC|Songti TC|MingLiU|細明|Noto Sans TC|Source Han Sans TC/,
    avoid: /YaHei|雅黑|PingFang SC|SimSun|宋体|Songti SC/,
  },
  ja: {
    want: /Hiragino|ヒラギノ|Yu Gothic|游ゴシック|Yu Mincho|游明朝|Meiryo|メイリオ|Noto (Sans|Serif) JP|Source Han (Sans|Serif) JP/,
    avoid: /YaHei|雅黑|PingFang SC|SimSun|宋体|Songti SC/,
  },
  ko: {
    want: /Gothic Neo|Malgun|맑은|Gulim|굴림|Dotum|돋움|Batang|바탕|Noto (Sans|Serif) KR|Source Han (Sans|Serif) KR/,
    avoid: /YaHei|PingFang SC|SimSun|Songti SC|Hiragino|Yu Gothic|Meiryo/,
  },
  en: { want: /./, avoid: CJK_FONT },
  es: { want: /./, avoid: CJK_FONT },
};

/** 六种宽度：桌面版心 / 版心之下 / 导航隐藏那一档 / 小手机 / 极窄屏 */
/* 360 是必测的：它是最窄的主流安卓宽度，也是切换器最紧的一档 ——
   实测最后一项离容器右缘只剩 3.3px（430 剩 73、390 剩 33、375 剩 18）。

   ⚠️ 320 原来**没测**，理由写的是「会翻成两行（flex-wrap 兜住了，不溢出）」。
   那句话只对**页脚**那个切换器成立（它确实是 flex-wrap）。
   **页头是另一套东西**：`.site-head-in` 是 `flex-wrap: nowrap`，三个子元素
   （logo / 语言菜单 / CTA）都不收缩 —— 实测总宽 343.6px，320 上撑出去 24px，
   整页能左右拖。2026-09-24 补上这一格，六个语种一次覆盖。 */
const WIDTHS = [1440, 980, 720, 390, 360, 320];

let pass = 0;
const fails = [];
function check(name, ok, extra) {
  if (ok) { pass += 1; }
  else { fails.push(name + (extra ? '  ' + extra : '')); console.log('  ✗ ' + name + '  ' + (extra || '')); }
}

/* ================================================================== *
 * 控制浏览器的「系统语言」与「存下来的偏好」
 * ================================================================== */

/**
 * 改 `navigator.language` / `navigator.languages`。
 *
 * ⚠️ 不能用 `Emulation.setLocaleOverride` —— 实测它**改不动** `navigator.language`
 * （它只管日期、数字、排序这些 Intl 行为）。我一开始就试的那条路，
 * 三次覆盖读回来都是 `zh-CN`，看着像「覆盖成功了」其实一次都没生效。
 *
 * 也不能靠机器默认值：这台机器上无头 Chrome 默认就是 `zh-CN`，
 * 恰好等于根页语种，于是「不跳」是对的 —— 但那是**运气**。
 * 换一台英语环境的机器，打开 `/` 会被跳到 `/en/`，
 * 于是 zh-Hans 那一整轮断言全红，而报错会指向「切换器」之类完全不相干的地方。
 * 所以：语言必须**显式钉住**，不能继承环境。
 */
let LANG_HOOK = null;
async function setBrowserLang(cdp, langs) {
  if (LANG_HOOK) {
    await cdp.send('Page.removeScriptToEvaluateOnNewDocument', { identifier: LANG_HOOK });
    LANG_HOOK = null;
  }
  const src = 'try{'
    + 'Object.defineProperty(navigator,"language",{get:function(){return '
    + JSON.stringify(langs[0] || '') + ';},configurable:true});'
    + 'Object.defineProperty(navigator,"languages",{get:function(){return '
    + JSON.stringify(langs) + ';},configurable:true});'
    + '}catch(e){}';
  const r = await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: src });
  LANG_HOOK = r.identifier;
}

/** 清掉存下来的偏好 —— 不清的话上一条用例会把下一条的跳转压掉。 */
async function clearPref(cdp) {
  await cdp.eval('(() => { try { localStorage.removeItem("promptlens.locale"); } catch (e) {} return true; })()');
}

/** 存一个偏好，模拟「用户之前明确选过这个语种」。 */
async function setPref(cdp, tag) {
  await cdp.eval('(() => { try { localStorage.setItem("promptlens.locale", '
    + JSON.stringify(tag) + '); } catch (e) {} return true; })()');
}

/**
 * 打开一个地址，等它可能发生的跳转落定，然后报出**最终**落在哪。
 * 跳转是 `location.replace`，`goto` 返回时它可能还没发生，所以要等一下再读。
 */
async function openAndSettle(cdp, url, ms) {
  await cdp.goto(url);
  for (let i = 0; i < 12; i += 1) {
    await sleep(ms || 120);
    const p = await cdp.eval('location.pathname');
    const ready = await cdp.eval('document.readyState');
    if (ready === 'complete' && i >= 2) return p;
  }
  return cdp.eval('location.pathname');
}

(async () => {
  const cdp = await launch({ width: 1440, height: 900 });

  /* 落地页分节现在挂了一层 CSS 进场（`animation-timeline: view()`，见 main.css）。
     量计算样式 / 拍图之前先把它压平 —— 否则量到的是**动画中间态**：
     09-26 实测滚到位的那一刻 `.cta-title` 的 opacity 可能停在 0.69，
     报出来像「文案没显示」，其实是探针自己来早了。
     和 browser-check.js 的 settle() 是同一件事，共用 scripts/lib/quiet-motion.js。 */
  await quietMotion(cdp);
  try {
    /* setBrowserLang 用 Page.addScriptToEvaluateOnNewDocument，这个域要先开。 */
    await cdp.send('Page.enable');

    for (const loc of LOCALES) {
      const url = BASE + '/' + (loc.dir ? loc.dir + '/' : '');
      console.log('── ' + loc.tag + ' ' + '─'.repeat(Math.max(0, 50 - loc.tag.length)));

      /* 钉住系统语言 = 本页语种，清掉偏好。
         不钉的话，这一轮测什么取决于跑在谁的机器上（见 setBrowserLang 的说明）。 */
      await setBrowserLang(cdp, [loc.htmlLang]);
      await cdp.goto(BASE + '/');
      await clearPref(cdp);

      for (const w of WIDTHS) {
        await cdp.send('Emulation.setDeviceMetricsOverride',
          { width: w, height: 900, deviceScaleFactor: 1, mobile: w < 560 });
        await cdp.goto(url);
        await sleep(260);

        const m = JSON.parse(await cdp.eval(`JSON.stringify((() => {
          const de = document.documentElement;
          /* ⚠️ 页脚那六个链接必须**限定在 .lang-switch 里**再数。
             页头那个 <details> 菜单用的也是 .lang-link，全局 querySelectorAll
             会数到 12 条，「6 个链接」「末项余」「占几行」全比错 ——
             而且报错信息看起来只是数字不对，很容易被当成断言的锅。 */
          const nav = document.querySelector('.lang-switch');
          const links = nav ? [...nav.querySelectorAll('a.lang-link')] : [];
          const r = nav ? nav.getBoundingClientRect() : null;
          const active = nav ? nav.querySelector('a.lang-link.active') : null;
          const h1 = document.querySelector('.hero-title');
          const heroSec = document.querySelector('.hero');
          const actSec = document.querySelector('.hero-actions');
          const hrefs = links.map((a) => a.getAttribute('href'));
          /* 页头的语言菜单 */
          const menu = document.querySelector('details.lang-menu');
          const mBtn = menu ? menu.querySelector('summary') : null;
          const mRect = mBtn ? mBtn.getBoundingClientRect() : null;
          const mItems = menu ? [...menu.querySelectorAll('a.lang-link')] : [];
          const mAct = menu ? menu.querySelector('a.lang-link.active') : null;
          return {
            lang: de.lang,
            scrollW: de.scrollWidth,
            clientW: de.clientWidth,
            innerW: window.innerWidth,
            swVisible: !!r && r.width > 0 && r.height > 0,
            swRight: r ? Math.round(r.right) : -1,
            swBottom: r ? Math.round(r.bottom + window.scrollY) : -1,
            /* 下面这三个是**打出来给人看的量**，不是断言。别把它们升成断言：
               「末项超出容器」这个量**恒为假** —— flex 项默认 flex-shrink:1，
               装不下时它们自己就缩了（实测 nowrap + 插第 7 项，末项余 = 0px，
               永远「没超出」）。恒真的断言比没有断言更糟，因为它看着像有保护。
               所以这里只报数：末项余多少 px、占几行。 */
            swLastRight: links.length
              ? Math.round(Math.max.apply(null, links.map((x) => x.getBoundingClientRect().right))) : -1,
            swBoxRight: r ? Math.round(r.right) : -1,
            swRows: new Set(links.map((x) => Math.round(x.getBoundingClientRect().top))).size,
            /* 真正会坏、且坏了很要命的那个不变量：**当前语种看得出和别的项不一样**。
               有人重排页脚时把「.lang-link.active」那条规则删了/盖了，页面照常渲染、
               链接照常能点，只是用户再也看不出自己在哪个语种上。
               判据是计算样式（颜色或下划线任一不同），不是 class 在不在。 */
            activeDistinct: (() => {
              const act = links.find((a) => a.classList.contains('active'));
              const oth = links.find((a) => a !== act);
              if (!act || !oth) return false;
              const g = (el) => {
                const cs = getComputedStyle(el);
                return cs.color + '|' + cs.borderBottomColor + '|' + cs.borderBottomWidth;
              };
              return g(act) !== g(oth);
            })(),
            swLinks: hrefs.length,
            /* href 现在是**相对**地址（绝对地址指向 example.com，本地打不开），
               所以 new URL 必须给 base —— 不给会直接抛 Invalid URL。 */
            activePath: active ? new URL(active.getAttribute('href'), location.href).pathname : null,
            origins: [...new Set(hrefs.map((h) => new URL(h, location.href).origin))],
            menuVisible: !!mRect && mRect.width > 0 && mRect.height > 0,
            /* 只在失败时才用到：把量到的尺寸带出来，好分辨是「元素不在」
               还是「布局还没落定就被量了」。纯诊断，不参与判据。 */
            menuBox: mRect ? (Math.round(mRect.width) + '×' + Math.round(mRect.height)) : '没有这个元素',
            menuInside: !!mRect && mRect.left >= -1 && mRect.right <= de.clientWidth + 1,
            menuText: mBtn ? (mBtn.textContent || '').trim() : '',
            menuClosed: menu ? !menu.hasAttribute('open') : false,
            menuItems: mItems.length,
            menuActivePath: mAct ? new URL(mAct.getAttribute('href'), location.href).pathname : null,
            h1: h1 ? h1.innerText.replace(/\\s+/g, ' ').trim().slice(0, 40) : '',
            docH: de.scrollHeight,
            /* ---- anti-slop 体检（taste-skill Pre-Flight 的机械化部分）----
               ① 纯黑：只看**用户看得见**的元素（有可见盒子、且不在 <head> 里）。
                  文档根 <html> 的计算 color 是 CSS 初始值 rgb(0,0,0)，
                  而所有可见文字都由 <body> 定的色继承下来 —— 它自己不画字，
                  是个惰性值，算进去这条就永远是红的。
                  真正的信号是「某个可见元素没人给它定色」，
                  典型形状就是 <button> 不写 color，落到 UA 的 ButtonText。 */
            pureBlack: (() => {
              const SKIP = { HTML: 1, HEAD: 1, META: 1, TITLE: 1, LINK: 1, STYLE: 1, SCRIPT: 1, BASE: 1, NOSCRIPT: 1, TEMPLATE: 1 };
              const bad = [];
              for (const el of document.querySelectorAll('*')) {
                if (SKIP[el.tagName]) continue;
                if (!el.getClientRects().length) continue;
                const cs = getComputedStyle(el);
                const who = el.tagName.toLowerCase() + '.' + (typeof el.className === 'string' ? el.className : '');
                if (cs.color === 'rgb(0, 0, 0)') bad.push('color ' + who);
                if (cs.backgroundColor === 'rgb(0, 0, 0)') bad.push('bg ' + who);
              }
              return bad;
            })(),
            /* ② 首屏在初始视口内。量**整节**而不是只量 CTA ——
               规则原话是「hero must fit the initial viewport」。 */
            heroBottom: heroSec ? Math.round(heroSec.getBoundingClientRect().bottom) : -1,
            actBottom: actSec ? Math.round(actSec.getBoundingClientRect().bottom) : -1,
            titleLines: (() => {
              const t = document.querySelector('.hero-title');
              if (!t) return -1;
              const lh = parseFloat(getComputedStyle(t).lineHeight);
              return lh ? Math.round(t.getBoundingClientRect().height / lh) : -1;
            })(),
            innerH: window.innerHeight,
            /* 页脚三个链接之间的水平间距。原来它们靠两个中点分隔，
               改成 margin 之后**那条规则一旦被删就全挤在一起** ——
               中点那条断言管不到（它只管「有没有两个中点」）。
               只比同一行上的相邻两个（换行之后 left 会回到行首，差值是负的）。 */
            footGaps: (() => {
              const as = [...document.querySelectorAll('.foot-links a')];
              const gaps = [];
              for (let i = 1; i < as.length; i += 1) {
                const a = as[i - 1].getBoundingClientRect();
                const b = as[i].getBoundingClientRect();
                if (Math.abs(a.top - b.top) < 2) gaps.push(Math.round(b.left - a.right));
              }
              return gaps;
            })(),
          };
        })())`));

        const at = '[' + loc.tag + ' @' + w + ']';
        /* 横向溢出：允许 1px 的舍入误差 */
        check(at + ' 没有横向溢出', m.scrollW <= m.clientW + 1, m.scrollW + ' > ' + m.clientW);
        check(at + ' 语言切换器可见', m.swVisible);
        check(at + ' 切换器没有伸出视口右边缘', m.swRight <= m.innerW + 1,
          m.swRight + ' > ' + m.innerW);
        check(at + ' 切换器有 6 个链接', m.swLinks === 6, String(m.swLinks));
        check(at + ' 切换器的 active 指向自己',
          m.activePath === '/' + (loc.dir ? loc.dir + '/' : ''),
          m.activePath);
        check(at + ' 六个链接同源（没有一条写错域名）', m.origins.length === 1, m.origins.join(' '));
        check(at + ' html lang 正确', m.lang === loc.htmlLang, m.lang);
        check(at + ' 主标题渲染出来了', m.h1.length >= 8, m.h1);
        check(at + ' 切换器落在页面范围内', m.swBottom > 0 && m.swBottom <= m.docH,
          m.swBottom + ' / ' + m.docH);
        check(at + ' 当前语种那一项看得出和别的项不一样（否则用户不知道自己在哪）',
          m.activeDistinct);
        /* ---- anti-slop：配色与首屏（taste-skill Pre-Flight）---- */
        check(at + ' 没有元素的计算色是纯黑（纯黑 = 没人给它定色，落了 UA 默认值）',
          m.pureBlack.length === 0, m.pureBlack.slice(0, 3).join('; '));
        check(at + ' 首屏整节落在初始视口内（不用滚就能看完）',
          m.heroBottom > 0 && m.heroBottom <= m.innerH,
          m.heroBottom + ' vs 视口 ' + m.innerH);
        check(at + ' 首屏 CTA 落在初始视口内（按钮不用滚就点得到）',
          m.actBottom > 0 && m.actBottom <= m.innerH,
          m.actBottom + ' vs 视口 ' + m.innerH);
        /* 阈值 8px：没有那条 CSS 时相邻链接之间只剩 HTML 里的一个空格
           （实测约 4px），有那条规则时是 18px 左右 —— 8 干净地分开两种情况。
           窄屏上三个链接会折行，同一行只剩一个链接，这条就自然放过。 */
        /* ⚠️ 只在 1440 上量。窄屏上这三个链接会折行，而**行内元素跨行时
           getBoundingClientRect 返回的是各片段的外接矩形** —— 实测 es@320
           量出一个 -182 的「间距」（两个链接的盒子跨行交叠了）。
           那不是缺陷，是判据选错了时刻。1440 下三个链接同一行，量得干净（20.5px）。 */
        if (w >= 1440) {
          check(at + ' 页脚相邻链接之间有间距（≥8px，不是挤在一起）',
            m.footGaps.every((g) => g >= 8),
            '实测 ' + JSON.stringify(m.footGaps));
        }
        /* ⚠️ 规则原文是「标题 ≤ 2 行」，这里只守「别失控」，而且是**故意的**：
           中文标题本来就是两个分句（源码里写死的 <br>），译文（en/ko/es）
           第二分句在 17em 的量度下必然折行。而 17em ≈ 每行 55~65 个拉丁字符，
           正是舒服的阅读量度；把 max-width 放宽到能容下第二分句（实测要 ~880px）
           会让每行到 85+ 字符 —— 那是**拿排版换行数**，更糟。
           ⚠️ 只在 1440 上量。规则说的是**桌面首屏**的排版纪律；320px 下
           这个句子必然折到 5 行，在那里数行数是噪音（一条永远要放宽的断言）。
           上限 3 是实测值（zh/ja 2 行，en/ko/es 3 行），任何回归都会红。 */
        if (w >= 1440) {
          check(at + ' 首屏标题不超过 3 行（防译文失控变长）',
            m.titleLines > 0 && m.titleLines <= 3, m.titleLines + ' 行');
        }
        /* ---- 页头语言菜单：这是「不用滚到页脚也能换语言」的那个入口 ---- */
        check(at + ' 页头语言菜单可见（不滚到页脚也能换语言）', m.menuVisible, '实测 ' + m.menuBox);
        check(at + ' 页头语言菜单没伸出视口', m.menuInside);
        check(at + ' 页头菜单收起时显示的是当前语种',
          m.menuText === ENDONYM[loc.tag], m.menuText);
        check(at + ' 页头菜单默认收起', m.menuClosed);
        check(at + ' 页头菜单里有 6 条真链接', m.menuItems === 6, String(m.menuItems));
        check(at + ' 页头菜单的 active 指向自己',
          m.menuActivePath === '/' + (loc.dir ? loc.dir + '/' : ''), m.menuActivePath);
        console.log('  · @' + String(w).padEnd(5) + ' 高 ' + String(m.docH).padStart(5)
          + 'px  切换器右缘 ' + String(m.swRight).padStart(5) + 'px'
          + '  末项余 ' + String(m.swBoxRight - m.swLastRight).padStart(3) + 'px'
          + '  ' + m.swRows + ' 行  页头菜单「' + m.menuText + '」');
      }

      /* ---- 字族：正文与标题必须由本语种的字族渲染 ----
         量法用 CSS.getPlatformFontsForNode，浏览器自己报的**实际**字族。
         不用 getComputedStyle：它只会把 font-family 那串候选名单原样返回，
         你写什么它报什么，证明不了任何事。 */
      await cdp.send('DOM.enable');
      await cdp.send('CSS.enable');
      const doc = await cdp.send('DOM.getDocument', { depth: 1 });
      const rules = FONT_RULES[loc.tag];
      /* ⚠️ 原来探的是 `.hero-lede`。09-26 首屏重排把它删了
         （与 .hero-def 重复，见 mk-landing 的注释），这里换成
         `.hero-def` —— 同样是 h1 正下方的正文段，同一个字族。 */
      for (const sel of ['.hero-def', '.hero-title']) {
        const node = await cdp.send('DOM.querySelector',
          { nodeId: doc.root.nodeId, selector: sel });
        if (!node.nodeId) { check('[' + loc.tag + '] ' + sel + ' 找得到', false); continue; }
        const pf = await cdp.send('CSS.getPlatformFontsForNode', { nodeId: node.nodeId });
        const fams = (pf.fonts || []).map((x) => x.familyName).join(', ');
        check('[' + loc.tag + '] ' + sel + ' 由本语种字族渲染',
          rules.want.test(fams), fams);
        if (rules.avoid) {
          check('[' + loc.tag + '] ' + sel + ' 没有掉到别的语种的字族上',
            !rules.avoid.test(fams), fams);
        }
      }

      /* ---- 切换器点得动吗 ----
         滚到页脚，逐个链接取中心点，看那个坐标上最顶层的元素是不是它自己。
         被 sticky 页头盖住、被别的层压住，都是这样查出来的 —— href 全对但点不动。 */
      await cdp.send('Emulation.setDeviceMetricsOverride',
        { width: 390, height: 700, deviceScaleFactor: 1, mobile: true });
      await cdp.goto(url);
      await sleep(260);
      const clickable = JSON.parse(await cdp.eval(`JSON.stringify((() => {
        const sw = document.querySelector('.lang-switch');
        if (!sw) return { total: 0, ok: 0, bad: [] };
        sw.scrollIntoView({ block: 'center' });
        const bad = [];
        const links = [...sw.querySelectorAll('.lang-link')];
        links.forEach((a) => {
          const r = a.getBoundingClientRect();
          const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
          if (!hit || (hit !== a && !a.contains(hit))) {
            bad.push(a.textContent.trim() + '→被 ' + (hit ? hit.className || hit.tagName : 'null') + ' 盖住');
          }
        });
        return { total: links.length, ok: links.length - bad.length, bad };
      })())`));
      check('[' + loc.tag + '] 切换器 6 个链接都点得动（没被别的层盖住）',
        clickable.total === 6 && clickable.ok === 6,
        clickable.bad.join('; '));

      /* ---- 链接的路径对不对 ----
         换成当前 BASE 走一遍。这一步查的是「点了会到哪个语种」，
         而目标页的 html lang 又会回头证明「到了以后确实是那个语种」。 */
      const target = LOCALES.find((l) => l.tag !== loc.tag && l.dir);
      /* 按 hreflang 找，**不要**按 href 里的路径片段找：
         href 现在是相对地址，根页上指向日语的是 `ja/`，不含 `/ja/`，
         用 `href*="/ja/"` 在根页上恒找不到（而报出来的是「找得到指向 ja 的链接」失败，
         看着像链接丢了，其实是选择器写死了绝对路径的形态）。 */
      const tPath = await cdp.eval(`(() => {
        const a = document.querySelector('.lang-switch a.lang-link[hreflang="${target.tag}"]');
        return a ? new URL(a.getAttribute('href'), location.href).pathname : null;
      })()`);
      check('[' + loc.tag + '] 找得到指向 ' + target.tag + ' 的链接', tPath !== null, tPath);
      if (tPath) {
        await cdp.goto(BASE + tPath);
        await sleep(300);
        const after = JSON.parse(await cdp.eval(
          'JSON.stringify({ lang: document.documentElement.lang, p: location.pathname })'));
        check('[' + loc.tag + '] 顺着切换器走一步，落到的正是 ' + target.tag + ' 的页面',
          after.lang === target.htmlLang && after.p === tPath,
          after.lang + ' @ ' + after.p);
      }
      console.log('');
    }

    /* ================================================================ *
     * 自动跳转：四条豁免逐条在真浏览器里验一遍
     * ================================================================ *
     *
     * 上面那些纯函数断言（`check-landing.js` 里那 22 条）证明的是**决策**对；
     * 这一节证明**接线**对 —— 决策对了但没接上 `location.replace`、
     * 或者接反了、或者在错误的页面上触发了，纯函数一条都查不出来。
     */
    console.log('── 自动跳转 ' + '─'.repeat(46));

    /** 系统语言 → 打开某地址 → 最终落在哪。 */
    const land = async (langs, path, opts) => {
      const o = opts || {};
      await setBrowserLang(cdp, langs);
      /* 每次都从根页起手清偏好：localStorage 是按 origin 存的，在哪个页面清都一样。 */
      await cdp.goto(BASE + '/');
      await clearPref(cdp);
      if (o.pref) await setPref(cdp, o.pref);
      if (o.ua) {
        await cdp.send('Network.setUserAgentOverride', { userAgent: o.ua });
      } else {
        await cdp.send('Network.setUserAgentOverride', { userAgent: '' });
      }
      const landed = await openAndSettle(cdp, BASE + path);
      return landed;
    };

    const J = ['ja-JP', 'ja'];
    const ZHS = ['zh-CN', 'zh'];

    /* ① 系统语言是日语 → 打开根页应当落到 /ja/ */
    let got = await land(J, '/');
    check('系统语言=日语，打开 / 会跳到 /ja/', got === '/ja/', got);

    /* 系统语言已经是简体 → 不该跳（不然等于自己跳自己，白闪一下） */
    got = await land(ZHS, '/');
    check('系统语言=简体中文，打开 / 留在原地', got === '/', got);

    /* 我们没有这个语种 → 留在原地，不能乱跳 */
    got = await land(['fr-FR', 'fr'], '/');
    check('系统语言=法语（我们没这个语种），打开 / 留在原地', got === '/', got);

    /* ② 只在 x-default 跳：已经写明语种的地址是用户的明确选择 */
    got = await land(ZHS, '/ja/');
    check('系统语言=简体中文，打开 /ja/ **不跳**（那是用户的明确选择）', got === '/ja/', got);
    got = await land(J, '/en/');
    check('系统语言=日语，打开 /en/ **不跳**', got === '/en/', got);
    got = await land(ZHS, '/en/');
    check('系统语言=简体中文，打开 /en/ **不跳**', got === '/en/', got);

    /* ③ 爬虫豁免 —— 不豁免的话 Googlebot 抓 / 会被跳走，中文版首页排名丢掉 */
    const GOOGLEBOT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
    got = await land(J, '/', { ua: GOOGLEBOT });
    check('Googlebot 抓 / **不跳**（否则首页会变成重定向页）', got === '/', got);
    got = await land(J, '/', { ua: 'Mozilla/5.0 (compatible; bingbot/2.0)' });
    check('bingbot 抓 / **不跳**', got === '/', got);
    /* 反向：确认豁免没有把所有人都挡住 —— 同一台浏览器换个 UA 就该跳 */
    got = await land(J, '/');
    check('换回普通浏览器 UA，同一地址就**会**跳（确认爬虫豁免没有一刀切）',
      got === '/ja/', got);

    /* ④ 存过偏好就不覆盖 —— 防「点简体中文被弹回日语」的死循环 */
    got = await land(J, '/', { pref: 'zh-Hans' });
    check('存过「简体中文」+ 系统日语 → 打开 / **不跳**（否则用户永远看不到中文版）',
      got === '/', got);
    got = await land(J, '/', { pref: 'en' });
    check('存过「English」+ 系统日语 → 打开 / 跳到 /en/（存的偏好优先于系统语言）',
      got === '/en/', got);

    /* URL 参数是这一次点击的明确意图，最优先 */
    got = await land(['ko-KR'], '/?lang=ja');
    check('?lang=ja 打开 / → 跳到 /ja/（URL 参数最优先）', got === '/ja/', got);
    got = await land(J, '/?lang=zh-Hans');
    check('?lang=zh-Hans + 系统日语 → 留在 /（URL 参数压过系统语言）', got === '/', got);

    /* 锚点要带过去，否则 /#faq 分享出去会落在页面顶部 */
    got = await openAndSettle(cdp, BASE + '/?lang=ja#faq');
    const hash = await cdp.eval('location.hash');
    check('跳转时把锚点带过去了（/#faq → /ja/#faq）',
      got === '/ja/' && hash === '#faq', got + ' ' + hash);

    /* ⑥ `file://` 直接打开也要能用（本项目的硬约定）。
       目录地址在 file:// 下浏览器给的是**目录列表**而不是页面，
       所以跳转目标必须是 `ja/index.html`，不能是 `ja/`。 */
    const FILE_ROOT = 'file:///' + path.join(__dirname, '..', 'public', 'index.html')
      .replace(/\\/g, '/');
    await setBrowserLang(cdp, J);
    const fileLanded = await openAndSettle(cdp, FILE_ROOT);
    check('file:// 下打开落地页，系统日语跳到 ja/index.html（而不是目录列表）',
      /\/ja\/index\.html$/.test(fileLanded), fileLanded);
    await setBrowserLang(cdp, ZHS);
    const fileStay = await openAndSettle(cdp, FILE_ROOT);
    check('file:// 下系统语言是简体则留在原地', /\/public\/index\.html$/.test(fileStay), fileStay);

    /* ⑤ 页头菜单在真浏览器里能开、能点、能走 */
    await setBrowserLang(cdp, ZHS);
    await cdp.goto(BASE + '/');
    await clearPref(cdp);
    const menuProbe = JSON.parse(await cdp.eval(`JSON.stringify((() => {
      const menu = document.querySelector('details.lang-menu');
      if (!menu) return { ok: false };
      menu.querySelector('summary').click();
      const open = menu.hasAttribute('open');
      const items = [...menu.querySelectorAll('a.lang-link')];
      const bad = [];
      items.forEach((a) => {
        const r = a.getBoundingClientRect();
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        if (!hit || (hit !== a && !a.contains(hit))) bad.push((a.textContent || '').trim());
      });
      return { ok: true, open: open, n: items.length, bad: bad };
    })())`));
    check('页头菜单点得开（原生 <details>，不需要 JS）', menuProbe.ok && menuProbe.open);
    check('页头菜单展开后有 6 条链接', menuProbe.n === 6, String(menuProbe.n));
    check('页头菜单展开后 6 条链接都点得动（没被别的层盖住）',
      menuProbe.bad.length === 0, menuProbe.bad.join(', '));

    /* 点菜单里的「日本語」应当真的走到日语页，并且把选择存下来 */
    const hop = await cdp.eval(`(() => {
      const a = document.querySelector('details.lang-menu a.lang-link[hreflang="ja"]');
      if (!a) return null;
      return new URL(a.getAttribute('href'), location.href).pathname;
    })()`);
    check('页头菜单里指向日语的链接解析出 /ja/', hop === '/ja/', hop);
    if (hop) {
      await cdp.goto(BASE + hop);
      await sleep(300);
      const after = JSON.parse(await cdp.eval(
        'JSON.stringify({ lang: document.documentElement.lang, p: location.pathname })'));
      check('从页头菜单走到日语页，落到的正是 /ja/ 且 html lang = ja',
        after.lang === 'ja' && after.p === '/ja/', after.lang + ' @ ' + after.p);
    }
    console.log('');
  } finally {
    /* 语言钩子用完要撤：它对之后**每一个**文档都生效，
       留着会把后续任何导航的 navigator.language 都改掉。 */
    if (LANG_HOOK) {
      await cdp.send('Page.removeScriptToEvaluateOnNewDocument', { identifier: LANG_HOOK }).catch(() => {});
      LANG_HOOK = null;
    }
    await cdp.close();
  }

  if (fails.length) {
    console.log('✗ ' + fails.length + ' 项不通过（共 ' + (pass + fails.length) + ' 项）：');
    fails.forEach((f) => console.log('    ' + f));
    process.exit(1);
  }
  console.log('全部通过 ✓ （' + pass + ' 项）');
})().catch((e) => { console.error('失败：' + e.message); process.exit(1); });
