'use strict';

/**
 * 落地页生成器
 * ==================================================================
 * 输入：`public/index.html`（简体源页）+ 一张「中文原文 → 译文」表
 * 输出：`public/index.html`（补上 hreflang / 切换器）+
 *       `public/<tag>/index.html`（每种语种一份静态页）
 *
 * 为什么落地页要**烘成静态页**，不能像工作台那样运行时换文案：
 *
 *   落地页是**唯一**给搜索引擎看的一页（`/login` 和 `/app.html` 都是 noindex）。
 *   运行时换文案意味着爬虫拿到的 HTML 里只有一种语言，
 *   其他语种的页面在搜索结果里根本不存在 —— 「每语言独立 URL」就白做了。
 *   所以这里跟工作台走**相反**的路：预先烘好六份，切换器是**真链接**。
 *
 * 为什么是「生成」而不是手抄五份：
 *
 *   和文案包同一个理由。手抄五份的话，改了源页的某一段，
 *   另外五份不会跟着变，而且**不会报错** —— 只会慢慢各说各话。
 *   更实际的是：落地页里有 canonical / og:url / og:locale / hreflang /
 *   资源相对路径（多一层目录要加 `../`），抄漏任何一个都是静默故障，
 *   表现是「页面能打开但 SEO 全错」，肉眼看不出来。
 *
 * 结构只能来自 `public/index.html`。译文表里根本没有可以改结构的余地。
 *
 * 用法：
 *   node scripts/mk-landing.js <tag>           生成该语种的静态页（缺译文就报错退出）
 *   node scripts/mk-landing.js <tag> --list    列出还缺哪些（人读）
 *   node scripts/mk-landing.js <tag> --todo    导出待译模板到 <tag>/landing/_todo/
 *   node scripts/mk-landing.js --all           生成全部语种 + 根页的 hreflang / 切换器 + sitemap
 *   node scripts/mk-landing.js --root          只更新根页（hreflang / 切换器）和 sitemap
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const SRC_FILE = path.join(PUBLIC, 'index.html');
const SITE = 'https://promptlens.example.com';

/** 判定「这条串要不要翻」，和别处保持同一口径 */
const CJK = /[\u3000-\u303f\u4e00-\u9fff\uff01-\uff60]/;

/**
 * 语种表。
 *
 * `dir` 是落地的**目录名**（`''` = 根，就是简体本身）。
 * `htmlLang` / `ogLocale` 和 `i18n.js` 的 LOCALES 是两套东西，别混：
 * 那边管运行时的 `<html lang>`，这边还多一个 og:locale（下划线写法）。
 */
const LOCALES = [
  { tag: 'zh-Hans', dir: '', htmlLang: 'zh-CN', ogLocale: 'zh_CN' },
  { tag: 'zh-Hant', dir: 'zh-Hant', htmlLang: 'zh-Hant', ogLocale: 'zh_TW' },
  { tag: 'en', dir: 'en', htmlLang: 'en', ogLocale: 'en_US' },
  { tag: 'ja', dir: 'ja', htmlLang: 'ja', ogLocale: 'ja_JP' },
  { tag: 'ko', dir: 'ko', htmlLang: 'ko', ogLocale: 'ko_KR' },
  { tag: 'es', dir: 'es', htmlLang: 'es', ogLocale: 'es_ES' },
];

/**
 * 切换器上显示的语种名（「日本語」「한국어」…）**从 i18n.js 取**，这里不重抄。
 *
 * 重抄的后果是静默的：两份「日本語」只改了其中一份，
 * 切换器上就显示旧名字，而**没有任何地方会报错** —— 和文案包同一个道理。
 * i18n.js 是语种表的唯一权威（运行时的 html lang、下拉框也都读它）。
 */
const I18N = require(path.join(PUBLIC, 'assets', 'js', 'i18n.js'));
const NAME_OF = Object.create(null);
I18N.LOCALES.forEach((l) => { NAME_OF[l.tag] = l.name; });

/* 两张表必须对得上，**双向**查：
   单向只查「我这边有没有名字」，查不出「i18n.js 多了一个 ready 的语种」——
   那意味着线上多了一个能选、却没有任何落地页的语种。 */
{
  const noName = LOCALES.filter((l) => !NAME_OF[l.tag]).map((l) => l.tag);
  if (noName.length) {
    console.error('✗ mk-landing 的语种在 i18n.js 里没有名字：' + noName.join(', '));
    process.exit(1);
  }
  const noPage = I18N.LOCALES
    .filter((l) => l.ready && !LOCALES.some((x) => x.tag === l.tag))
    .map((l) => l.tag);
  if (noPage.length) {
    console.error('✗ i18n.js 里已经 ready 但这里没有落地页的语种：' + noPage.join(', '));
    process.exit(1);
  }
}

const urlOf = (tag) => {
  const l = LOCALES.find((x) => x.tag === tag);
  return SITE + '/' + (l.dir ? l.dir + '/' : '');
};

/**
 * **相对**地址 —— 只给页面上**看得见、点得动**的链接用。
 *
 * 为什么必须相对：`urlOf` 出来的是 `https://promptlens.example.com/en/`，
 * 而 example.com 是 RFC 2606 保留域名，**永远解析不到**（ENOTFOUND）。
 * 于是本地打开首页时，页脚那六个语言链接点了全是「无法访问此网站」——
 * 页面看着像「只有简体中文」，其实切换器一直在，只是每一条都是死的。
 * 这是「本地能跑」和「用户能用」之间的裂缝：绝对地址在线上是对的，在本地是空气。
 *
 * 相对地址两边都对：`file://` 直接打开能用，走服务能用，上线也能用。
 * `hreflang` / `canonical` / `og:url` 仍然保持绝对 ——
 * 那是**给爬虫读的元数据**，规范要求绝对地址，而且它不可点。
 */
function relHrefOf(fromTag, toTag) {
  if (fromTag === toTag) return './';
  const from = LOCALES.find((x) => x.tag === fromTag);
  const to = LOCALES.find((x) => x.tag === toTag);
  return (from.dir ? '../' : '') + (to.dir ? to.dir + '/' : '');
}

/* ------------------------------------------------------------------ *
 * 生成器自己管的那三块
 * ------------------------------------------------------------------ */

const MARK = {
  href: /<!-- hreflang:start -->[\s\S]*?<!-- hreflang:end -->/,
  sw: /<!-- lang-switch:start -->[\s\S]*?<!-- lang-switch:end -->/,
  menu: /<!-- lang-menu:start -->[\s\S]*?<!-- lang-menu:end -->/,
  boot: /<!-- lang-boot:start -->[\s\S]*?<!-- lang-boot:end -->/,
};

/**
 * 把生成器自己插进去的几块**先摘掉**，再算「要翻哪些串」。
 *
 * 为什么必须摘：切换器上写的是各语种的**自称**（简体中文 / 日本語 / 한국어…），
 * 它们本来就该在六份页面上长得一模一样。不摘的话 required() 会把
 * 「简体中文」也算成一条待译串，于是
 *   ① --todo 导出的模板里混进这些自称，译者很可能真的去「翻译」它们
 *      （把「日本語」译成「Japanese」—— 那是错的，切换器要用自称）；
 *   ② render() 走到那一句时查不到译文，直接 missing.push → 拒绝写文件，
 *      而报出来的错是「缺 简体中文」，看着像译文表少了一条，其实是自己人打自己人。
 *
 * 摘掉之后 render() 会在最后用 spliceBlock 重新拼上，结果一样，但不再互相干扰。
 */
function stripManaged(src) {
  return String(src)
    .replace(MARK.href, '')
    .replace(MARK.sw, '')
    .replace(MARK.menu, '')
    .replace(MARK.boot, '');
}

/* ------------------------------------------------------------------ *
 * 从源页里抽出「要翻的那些串」
 * ------------------------------------------------------------------ */

/**
 * 注释和 `<script>` 先整块**挖出来换成占位符**。
 *
 * 为什么必须先挖：注释里既有 `>` 也有 `<`，直接跑 `>文本<` 会把注释切碎；
 * 而 JSON-LD 那一大块是 JSON，得按 JSON 走（见下面 translateLd），
 * 混进文本节点里会被当成一句「文本」。
 */
function dig(src) {
  const comments = [];
  const scripts = [];
  let s = String(src);
  s = s.replace(/<!--[\s\S]*?-->/g, (m) => { comments.push(m); return '\u0000C' + (comments.length - 1) + '\u0000'; });
  s = s.replace(/<script\b[\s\S]*?<\/script>/gi, (m) => { scripts.push(m); return '\u0000S' + (scripts.length - 1) + '\u0000'; });
  return { s, comments, scripts };
}

const textRuns = (s) => {
  const out = [];
  s.replace(/>([^<]*)</g, (m, raw) => {
    const core = raw.replace(/\s+/g, ' ').trim();
    if (core && CJK.test(core) && out.indexOf(core) === -1) out.push(core);
    return m;
  });
  return out;
};

const attrRuns = (s) => {
  const out = [];
  s.replace(/([\w:-]+)="([^"]*)"/g, (m, k, v) => {
    if (CJK.test(v) && out.indexOf(v) === -1) out.push(v);
    return m;
  });
  return out;
};

function ldBlocks(scripts) {
  return scripts.filter((b) => /application\/ld\+json/.test(b));
}

const ldRuns = (scripts) => {
  const out = [];
  const walk = (v) => {
    if (typeof v === 'string') { if (CJK.test(v) && out.indexOf(v) === -1) out.push(v); return; }
    if (Array.isArray(v)) { v.forEach(walk); return; }
    if (v && typeof v === 'object') Object.keys(v).forEach((k) => walk(v[k]));
  };
  ldBlocks(scripts).forEach((b) => {
    const json = b.replace(/^[\s\S]*?<script\b[^>]*>/i, '').replace(/<\/script>\s*$/i, '');
    try { walk(JSON.parse(json)); } catch (e) { /* 抽不出来就让生成时报错 */ }
  });
  return out;
};

/* ------------------------------------------------------------------ *
 * 译文表
 * ------------------------------------------------------------------ */

const landingDir = (tag) => path.join(__dirname, 'i18n-src', tag, 'landing');

function loadTable(tag) {
  const dir = landingDir(tag);
  if (!fs.existsSync(dir)) return { text: {}, attr: {}, ld: {}, files: [] };
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json') && f[0] !== '_').sort();
  const out = { text: {}, attr: {}, ld: {}, files };
  files.forEach((f) => {
    const chunk = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    ['text', 'attr', 'ld'].forEach((kind) => {
      const part = chunk[kind] || {};
      Object.keys(part).forEach((k) => {
        if (out[kind][k] !== undefined && out[kind][k] !== part[k]) {
          console.error('✗ ' + kind + '「' + k + '」在两个分片里译得不一样（' + f + '）');
          process.exit(1);
        }
        out[kind][k] = part[k];
      });
    });
  });
  return out;
}

const normStr = (v) => String(v).replace(/\s+/g, '');

/**
 * 「和 text 里某一条是同一句话」的键 → 对应的 text 键。
 *
 * 同一句话出现在两个地方，就会在译文表里变成两条 key，译者译两遍，
 * 两遍就可能不一样 —— 而且**浏览器里看不出来**。两类来源：
 *
 *   ld   —— 结构化数据的问答必须和看得见的文字逐字一致，
 *           否则算「标记与内容不符」（源页自己的注释里就写着这句）。
 *           但可见文本在 HTML 里跨行，折叠空白之后句尾多一个空格，
 *           于是「同一句话」成了两条不同的 key。
 *           量过：JSON-LD 共 20 条，7 条与可见文本逐字相同（本来就是同一条 key）、
 *           5 条只差空白、8 条 ld 独有。那 5 条是这里的派生对象。
 *
 *   attr —— title 既是 text 节点，又是 og:title / twitter:title 的 content。
 *           两处译得不一样，浏览器标签页和社交卡片就是两个标题。
 *
 * 派生 = 生成时直接沿用 text 的译文，译者不用填；填了会校验是否一致。
 */
function derivedFromText(req, kind) {
  const byNorm = Object.create(null);
  req.text.forEach((k) => { byNorm[normStr(k)] = k; });
  const map = Object.create(null);
  req[kind].forEach((k) => { const t = byNorm[normStr(k)]; if (t) map[k] = t; });
  return map;
}

/** 源页里所有该翻的串 —— 用来做「漏一条就拒绝写」的对账 */
function required(SRC) {
  const { s, scripts } = dig(stripManaged(SRC));
  return { text: textRuns(s), attr: attrRuns(s), ld: ldRuns(scripts) };
}

function diff(req, table) {
  const problems = [];
  ['text', 'attr', 'ld'].forEach((kind) => {
    const derived = derivedFromText(req, kind);
    req[kind].forEach((k) => {
      // 与可见文本同句的那些**不用单独填**，等 text 那条有译文即可。
      if (derived[k]) {
        if (typeof table.text[derived[k]] !== 'string') {
          problems.push(kind + '：缺 ' + JSON.stringify(k.slice(0, 60))
            + '（它与可见文本同句，等 text 那条）');
        }
        return;
      }
      if (typeof table[kind][k] !== 'string') problems.push(kind + '：缺 ' + JSON.stringify(k.slice(0, 60)));
    });
    Object.keys(table[kind]).forEach((k) => {
      // 派生条目：填不填都行，填了会在 render() 里校验和 text 是否一致
      if (derived[k]) return;
      if (req[kind].indexOf(k) === -1) problems.push(kind + '：多了一条源页里没有的 ' + JSON.stringify(k.slice(0, 60)));
    });
  });
  return problems;
}

/* ------------------------------------------------------------------ *
 * 术语表
 * ------------------------------------------------------------------ */

/**
 * 单个小写英文词一律**不收**。
 *
 * 原因：本站把「认字用的关键词」和「给人看的字」放在同一份 zh-Hans 源包里 ——
 * SCENARIOS[].keywords 就是一组小写匹配词（里面有 sora / runway / 可灵 / 即梦）。
 * 抽成扁平译文表之后，就再也分不出哪一条来自关键词表了。
 * 而小写单词恰好能区分：正文里不会出现光秃秃一个小写词 ——
 * 要么是多词短语、要么首字母大写（专有名词）、要么是中日韩文。
 *
 * 不收它们没有损失（video / image / shot 这种谁都会译），
 * 收进来反而**有害**：把 jimeng 当成「即梦」的正式译法抄进正文，
 * 而正文里的正确写法是 Jimeng（ui 包里就是这么写的）。
 */
const BARE_LOWER = /^[a-z][a-z0-9]*$/;

/** 术语候选里不要标点和空白 —— 带标点的键多半是整句，不是词 */
const TERM_PUNCT = /[、，。！？：；「」（）·|【】—\-\/\s]/;

/**
 * 落地页用到的领域词，在**已有译文**里是怎么译的。
 *
 * 术语的唯一权威是已经翻好的 kb / ui / demos 三份包，不是译者的直觉。
 * 落地页若自己另起一套词（比如「分镜表」翻成 shot sheet、
 * 工作台里却是 storyboard），用户从落地页点进工作台就会看到两个说法 ——
 * 不报错，只是显得业余，而且**没有任何检查会抓到**。
 *
 * 词表不手写：取「已有包里长度 2~8、且确实出现在落地页原文里」的键。
 * 这样词表自动跟着落地页内容走：源页把「运镜」改成「镜头运动」，
 * 词表下一次就跟着变，不会留着一份没人维护的手抄清单。
 */
function glossary(tag) {
  const base = path.join(__dirname, 'i18n-src', tag);
  const pairs = Object.create(null);
  ['kb', 'ui', 'demos'].forEach((kind) => {
    const d = path.join(base, kind);
    if (!fs.existsSync(d)) return;
    fs.readdirSync(d).filter((f) => f.endsWith('.json')).forEach((f) => {
      const o = JSON.parse(fs.readFileSync(path.join(d, f), 'utf8'));
      Object.keys(o).forEach((k) => {
        if (typeof o[k] === 'string' && o[k] && pairs[k] === undefined) pairs[k] = o[k];
      });
    });
  });
  const req = required(fs.readFileSync(SRC_FILE, 'utf8'));
  const hay = req.text.concat(req.attr, req.ld).join('\u0001');
  return Object.keys(pairs)
    .filter((k) => k.length >= 2 && k.length <= 8 && !TERM_PUNCT.test(k) && hay.indexOf(k) !== -1)
    .filter((k) => !BARE_LOWER.test(pairs[k]))
    .sort((a, b) => (b.length - a.length) || (a < b ? -1 : 1))
    .map((k) => [k, pairs[k]]);
}

/* ------------------------------------------------------------------ *
 * 渲染
 * ------------------------------------------------------------------ */

/**
 * 多一层目录，所有相对引用都要退一级。漏一个就是 404（或静默指向根页）。
 *
 * ⚠️ `./` 必须**一起**排除，不能只排 `../`。
 * 语言菜单里「当前语种」那一项就是 `href="./"`；只排 `../` 的话
 * 它会被改写成 `.././`，而从 `/en/` 出发 `.././` 解析到的是**根目录**——
 * 于是英文页上的「English」指向了中文首页。
 * 表现是「点自己反而跳走了」，而且只有当前语种那一项坏，六个里坏一个。
 */
function rebase(html) {
  return html
    .replace(/(\b(?:href|src)=")(?!https?:|data:|#|\/|\.\.?\/)/g, '$1../');
}

function hreflangBlock() {
  const lines = LOCALES.map((l) => '  <link rel="alternate" hreflang="' + l.tag + '" href="' + urlOf(l.tag) + '">');
  lines.push('  <link rel="alternate" hreflang="x-default" href="' + urlOf('zh-Hans') + '">');
  return '<!-- hreflang:start -->\n' + lines.join('\n') + '\n<!-- hreflang:end -->';
}

/**
 * 「语言」这个词从 ui 包里取，不在这里手抄一张表。
 *
 * 原来这里是一张硬编码的 `{'zh-Hans':'语言','en':'Language',…}`，
 * 而同一个词在 `locales/ui.<tag>.js` 里已经有一条了（`mountSwitcher` 用 `t('语言')`）。
 * 两处各写一份 = 加语种时必然漏一处，而且漏了只有读屏用户能发现（aria-label 是中文）。
 */
const LABEL_CACHE = Object.create(null);
function labelOf(tag) {
  if (!LABEL_CACHE[tag]) {
    const pack = require(path.join(PUBLIC, 'assets', 'locales', 'ui.' + tag + '.js'));
    LABEL_CACHE[tag] = (pack.ui || pack)['语言'] || '语言';
  }
  return LABEL_CACHE[tag];
}

function switcherBlock(tag) {
  const links = LOCALES.map((l) => {
    const cls = 'lang-link' + (l.tag === tag ? ' active' : '');
    const cur = l.tag === tag ? ' aria-current="true"' : '';
    return '      <a class="' + cls + '" href="' + relHrefOf(tag, l.tag) + '" hreflang="' + l.tag + '"' + cur + '>' + NAME_OF[l.tag] + '</a>';
  }).join('\n');
  return '<!-- lang-switch:start -->\n'
    + '    <nav class="lang-switch" aria-label="' + labelOf(tag) + '">\n' + links + '\n    </nav>\n'
    + '<!-- lang-switch:end -->';
}

/**
 * 页头的语言菜单：`<details>` 折叠，**不需要 JS**。
 *
 * 为什么不是页脚那六个链接直接搬上来 —— 量过，放不下：
 * 页头版心 1080px 且 `.site-head-in` 不换行，西语四个导航项就占 487.9px。
 * 为什么不是 `<select>` —— 原生下拉按**最宽选项**定宽，六个自称里
 * 「繁體中文」≈ 85px；而 390px 屏幕上页头只剩 **91.5px** 空余（最挤的 en），
 * 余 6px 属于「碰巧够」，风一吹就翻车。
 * `<details>` 收起时只有**当前语种**一个词（≈70px），展开才是完整列表，
 * 而且它是原生元素：没有 JS 也能开合，里面的链接爬虫照样看得见。
 */
function langMenuBlock(tag) {
  const items = LOCALES.map((l) => {
    const cls = 'lang-link' + (l.tag === tag ? ' active' : '');
    const cur = l.tag === tag ? ' aria-current="true"' : '';
    return '        <li><a class="' + cls + '" href="' + relHrefOf(tag, l.tag) + '" hreflang="'
      + l.tag + '"' + cur + '>' + NAME_OF[l.tag] + '</a></li>';
  }).join('\n');
  return '<!-- lang-menu:start -->\n'
    + '    <details class="lang-menu">\n'
    + '      <summary class="lang-menu-btn" aria-label="' + labelOf(tag) + '">'
    + NAME_OF[tag] + '</summary>\n'
    + '      <ul class="lang-menu-list">\n' + items + '\n      </ul>\n'
    + '    </details>\n'
    + '<!-- lang-menu:end -->';
}

/** 语言检测脚本。`defer`，所以它不会挡住首屏；没有它页面照样能读、能点。 */
function langBootBlock() {
  return '<!-- lang-boot:start -->\n'
    + '<script src="assets/js/landing-lang.js" defer></script>\n'
    + '<!-- lang-boot:end -->';
}

/**
 * 切换器插在**页脚**，不插页头。
 *
 * 量过的理由：页头版心固定 1080px（--land-w）且 .site-head-in 不换行，
 * 而西语的四个导航项本身就比中文长得多（Cómo funciona / Por qué es distinto /
 * Casos compatibles / Preguntas frecuentes ≈ 330px），
 * 加上六个语言项（≈325px）、logo 和按钮，总宽超过 1000px ——
 * 1024 的笔记本上会直接挤出去或压扁导航。
 * 页脚是块级容器，.lang-switch 自带 flex-wrap: wrap，任何宽度都不会溢出。
 *
 * （页头另有一个**收起态只占一个词**的 `<details>` 菜单，见 langMenuBlock；
 *   它和这里这六个链接不是一回事，两个都要有：
 *   页脚这六个是爬虫和「没有 JS 也能用」的兜底，页头那个是给人看的入口。）
 */
const SW_ANCHOR = /<p class="foot-note">[\s\S]*?<\/p>/;
/** 页头菜单插在「开始使用」按钮**之前**，紧挨着它。 */
const MENU_ANCHOR = /<a class="btn btn-primary site-cta"[^>]*>/;
/** 检测脚本插在 `</body>` 之前。 */
const BOOT_ANCHOR = /<\/body>/;

/**
 * **等长掩码**：把注释和 script 里的每个字符换成 \u0001，长度一个不差。
 *
 * 为什么必须掩码 —— 这一条是真踩过的：
 * 源页顶部的说明注释里**逐字写着**「1. 本文件 <link rel="canonical">」。
 * 直接拿锚点正则去源页里找，命中的是注释里那一句，
 * 于是整块 hreflang 被插进注释**内部**：爬虫一个字符都读不到，
 * 而文件看上去完全正常、--root 还打印「✓ 已更新」。
 * 这就是「静默失效」的典型样子，只有 diff 出来才看得见。
 *
 * 掩码和 dig() 的区别：dig 用占位符替换（长度会变，位置对不上），
 * 这里要的是**位置一一对应**，所以只能等长替换。
 */
function mask(src) {
  const s = String(src);
  const a = s.split('');
  const re = /<!--[\s\S]*?-->|<script\b[\s\S]*?<\/script>/gi;
  let m;
  while ((m = re.exec(s)) !== null) {
    for (let i = m.index; i < m.index + m[0].length; i += 1) a[i] = '\u0001';
  }
  return a.join('');
}

/**
 * 自检：插进去的那一块必须落在**注释外面**。
 *
 * 判据很直接：把注释挖掉之后这一块还在，才算活着。
 * 探针本身不是注释（link rel 那一行 / class=lang-switch 那一处），
 * 所以它活着就一定能在掩码里找到；被注释包住就必然找不到。
 */
function assertLive(html, probe, what) {
  if (html.indexOf(probe) === -1) return;
  if (mask(html).indexOf(probe) === -1) {
    throw new Error('自检失败：' + what + ' 落在注释里，整块是死的（文件看上去却完全正常）');
  }
}

/**
 * 自检：这一块**只许出现一次**。
 *
 * 重复插入是最难发现的一类：页面照常打开、切换器照常能用，
 * 只是页脚多了第二排一模一样的链接，而生成器每次都打印「✓ 已更新」。
 * 根因是「判重」和「找锚点」用了同一个（掩码后的）串，见 spliceBlock。
 */
function assertSingle(html, marker, what) {
  const n = html.split(marker).length - 1;
  if (n !== 1) throw new Error('自检失败：' + what + ' 出现了 ' + n + ' 次（应为 1 次）');
}

/**
 * 把 hreflang / 切换器**按标记替换**，没有标记就插到锚点后面。
 *
 * 用标记而不是「找 canonical 那一行」：
 * 后者在源页改了 head 顺序之后会插到奇怪的地方，而且**不报错**。
 * 标记法还有一个好处：这一整块是幂等的，重复跑不会越插越多。
 */
function spliceBlock(html, re, block, anchorRe, anchorAfter) {
  /* ⚠️ 判「已经插过了没有」必须用**原文**，不能用掩码后的串 ——
     hreflang / 切换器的标记本身就是注释（<!-- lang-switch:start -->），
     掩码会把它们一起涂掉，于是这里恒判「没插过」，**每跑一次就多插一块**。
     这个 bug 真的发生过：连跑两遍，页脚就出现了两个切换器，
     而两次都打印「✓ 已更新」。
     而找**锚点**必须用掩码后的串（见 mask 的注释）—— 两件事要的正好相反。 */
  if (re.test(html)) {
    // 用全局版替换：既就地更新，又顺手把历史遗留的重复块收敛掉
    return html.replace(new RegExp(re.source, re.flags + 'g'), block.replace(/\$/g, '$$$$'));
  }
  const m = mask(html).match(anchorRe);
  if (!m) throw new Error('找不到插入锚点：' + anchorRe);
  const at = m.index + (anchorAfter ? m[0].length : 0);
  return html.slice(0, at) + '\n' + block + html.slice(at);
}

function render(tag) {
  const loc = LOCALES.find((l) => l.tag === tag);
  if (!loc) throw new Error('未知语种：' + tag);
  const SRC = fs.readFileSync(SRC_FILE, 'utf8');
  const table = loadTable(tag);
  const req = required(SRC);
  const problems = diff(req, table);
  if (problems.length) return { problems, html: null, table };

  const { s, comments, scripts } = dig(stripManaged(SRC));
  const missing = [];

  /* 派生条目：可见文本赢。
     但要是译者自己填了那条、又填得和可见文本不一样，**报错**而不是悄悄覆盖 ——
     覆盖虽然结果正确，却把他这份不一致吞掉了，下次还会再犯。 */
  const conflicts = [];
  const eff = {};
  ['attr', 'ld'].forEach((kind) => {
    const derived = derivedFromText(req, kind);
    eff[kind] = Object.assign({}, table[kind]);
    Object.keys(derived).forEach((k) => {
      const own = table[kind][k];
      const tv = table.text[derived[k]];
      if (typeof own === 'string' && own !== '' && typeof tv === 'string' && own !== tv) {
        conflicts.push(kind + '：' + JSON.stringify(k.slice(0, 40))
          + ' 与页面上同一句译得不一样（应逐字相同）');
      }
      if (typeof tv === 'string') eff[kind][k] = tv;
    });
  });
  if (conflicts.length) return { problems: conflicts, html: null, table };

  // 1) 文本节点。⚠️ 前后的空白**原样留着** ——
  //    行内元素之间的空白是有意义的（英文/西文靠它分词），
  //    抹掉的话 `</b>\n  and\n  <em>` 会粘成 `and<em>`。
  let out = s.replace(/>([^<]*)</g, (m, raw) => {
    const core = raw.replace(/\s+/g, ' ').trim();
    if (!core || !CJK.test(core)) return m;
    const tr = table.text[core];
    if (typeof tr !== 'string') { missing.push(core); return m; }
    const lead = raw.match(/^\s*/)[0];
    const tail = raw.match(/\s*$/)[0];
    return '>' + lead + tr + tail + '<';
  });

  // 2) 属性值（meta content / aria-label / alt…）
  out = out.replace(/([\w:-]+)="([^"]*)"/g, (m, k, v) => {
    if (!CJK.test(v)) return m;
    const tr = eff.attr[v];
    if (typeof tr !== 'string') { missing.push(v); return m; }
    return k + '="' + tr + '"';
  });

  // 3) JSON-LD：按 JSON 走，别当文本
  scripts.forEach((blk, i) => {
    if (!/application\/ld\+json/.test(blk)) return;
    const head = blk.match(/<script\b[^>]*>/i)[0];
    const body = blk.replace(/^[\s\S]*?<script\b[^>]*>/i, '').replace(/<\/script>\s*$/i, '');
    let parsed;
    try { parsed = JSON.parse(body); } catch (e) { missing.push('JSON-LD 解析失败：' + e.message); return; }
    const walk = (v) => {
      if (typeof v === 'string') {
        if (!CJK.test(v)) return v;
        const tr = eff.ld[v];
        if (typeof tr !== 'string') { missing.push(v); return v; }
        return tr;
      }
      if (Array.isArray(v)) return v.map(walk);
      if (v && typeof v === 'object') { const o = {}; Object.keys(v).forEach((k) => { o[k] = walk(v[k]); }); return o; }
      return v;
    };
    /* 结构化数据里的**地址和语种**也要跟着换。
       忘了换的后果：/es/ 这一页的 JSON-LD 会指着 https://…/ 说
       「本站是 zh-CN」—— 搜索引擎读到的就是这句话，而页面上一个字都看不出来，
       只有把 JSON-LD 抠出来看才发现。
       这三样都要换：url / @id（指向本语种地址）与 inLanguage。
       og:image 不换 —— 那是全站共用的一张图。 */
    const fixLd = (v) => {
      if (typeof v === 'string') {
        if (v === 'zh-CN') return loc.htmlLang;
        if (v.indexOf(SITE) === 0) {
          const rest = v.slice(SITE.length);
          return rest[0] === '/' ? urlOf(tag) + rest.slice(1) : v;
        }
        return v;
      }
      if (Array.isArray(v)) return v.map(fixLd);
      if (v && typeof v === 'object') {
        const o = {};
        Object.keys(v).forEach((k) => { o[k] = fixLd(v[k]); });
        return o;
      }
      return v;
    };
    scripts[i] = head + '\n' + JSON.stringify(fixLd(walk(parsed)), null, 2) + '\n</script>';
  });

  if (missing.length) return { problems: missing.map((x) => '缺 ' + JSON.stringify(x.slice(0, 60))), html: null, table };

  // 4) 还原脚本。**注释不还原** —— 见下面注释里的理由。
  out = out.replace(/\u0000S(\d+)\u0000/g, (m, n) => scripts[Number(n)]);
  /* 源页的注释是给**源页**看的开发说明（「上线前必做…本文件 <link rel="canonical">…」）。
     放进生成页有三个问题：
       ① 它说「本文件」，而生成页根本不该手改 —— 指错了文件；
       ② 它是中文，会出现在西语页的源码里；
       ③ 更实际的是它挡住一条更强的断言：
          en / es / ko 的**整个文件**不该出现中日韩字（不只是可见文字）。
     留着注释的话，那条断言永远为假，只能退回到「只查可见文字」——
     而可见文字查不出「注释里塞了中文」这种问题。
     换一条 ASCII 横幅，既说清了「别手改、该改哪」，又不带一个中文字。 */
  out = out.replace(/\u0000C(\d+)\u0000/g, '');
  out = out.replace(/\n{3,}/g, '\n\n');
  out = out.replace(/(<html lang="[^"]*">\n)/,
    '$1<!-- generated by scripts/mk-landing.js — do not edit this file by hand. '
    + 'Edit public/index.html (copy) + scripts/i18n-src/' + tag + '/landing/01-landing.json (translation), '
    + 'then re-run: node scripts/mk-landing.js --all -->\n');

  // 5) 每语种的头（lang / canonical / og:url / og:locale）
  out = out.replace(/<html lang="[^"]*">/, '<html lang="' + loc.htmlLang + '">');
  out = out.replace(/(<link rel="canonical" href=")[^"]*(")/, '$1' + urlOf(tag) + '$2');
  out = out.replace(/(<meta property="og:url" content=")[^"]*(")/, '$1' + urlOf(tag) + '$2');
  out = out.replace(/(<meta property="og:locale" content=")[^"]*(")/, '$1' + loc.ogLocale + '$2');

  // 6) hreflang 与切换器
  out = spliceBlock(out, MARK.href, hreflangBlock(), /<link rel="canonical"[^>]*>/);
  out = spliceBlock(out, MARK.menu, langMenuBlock(tag), MENU_ANCHOR, false);
  out = spliceBlock(out, MARK.sw, switcherBlock(tag), SW_ANCHOR, true);
  out = spliceBlock(out, MARK.boot, langBootBlock(), BOOT_ANCHOR, false);

  // 7) 多一层目录 → 相对路径退一级
  if (loc.dir) {
    out = rebase(out);
    // logo 回**本语种**首页，不是根页。
    // 不退这一处的话，英文用户点 logo 会掉进中文页（rebase 会把它变成 ../index.html）。
    out = out.replace(/(<a class="logo" href=")[^"]*(")/, '$1index.html$2');
  }

  assertLive(out, '<link rel="alternate" hreflang=', tag + ' 的 hreflang');
  assertLive(out, 'class="lang-switch"', tag + ' 的切换器');
  assertLive(out, 'class="lang-menu"', tag + ' 的页头语言菜单');
  assertSingle(out, '<!-- hreflang:start -->', tag + ' 的 hreflang 块');
  assertSingle(out, '<!-- lang-switch:start -->', tag + ' 的切换器块');
  assertSingle(out, '<!-- lang-menu:start -->', tag + ' 的页头语言菜单块');
  /* 语言检测脚本整块都是注释 + `<script>`，掩码会把它整个涂掉，
     所以这里**只能**用 assertSingle 查「有没有、是不是只有一块」——
     assertLive 那条路对它是恒假的，写了等于没写。 */
  assertSingle(out, '<!-- lang-boot:start -->', tag + ' 的语言检测脚本块');
  if (out.indexOf('generated by scripts/mk-landing.js') === -1) {
    throw new Error('自检失败：' + tag + ' 少了「本文件是生成的」横幅');
  }
  return { problems: [], html: out, table };
}

/* ------------------------------------------------------------------ *
 * 根页与 sitemap
 * ------------------------------------------------------------------ */

/** 根页 = 简体源页 + hreflang + 切换器。**幂等**：重复跑不会越插越多。 */
function writeRoot() {
  const SRC = fs.readFileSync(SRC_FILE, 'utf8');
  let out = SRC;
  out = spliceBlock(out, MARK.href, hreflangBlock(), /<link rel="canonical"[^>]*>/);
  out = spliceBlock(out, MARK.menu, langMenuBlock('zh-Hans'), MENU_ANCHOR, false);
  out = spliceBlock(out, MARK.sw, switcherBlock('zh-Hans'), SW_ANCHOR, true);
  out = spliceBlock(out, MARK.boot, langBootBlock(), BOOT_ANCHOR, false);
  assertLive(out, '<link rel="alternate" hreflang=', '根页的 hreflang');
  assertLive(out, 'class="lang-switch"', '根页的切换器');
  assertLive(out, 'class="lang-menu"', '根页的页头语言菜单');
  assertSingle(out, '<!-- hreflang:start -->', '根页的 hreflang 块');
  assertSingle(out, '<!-- lang-switch:start -->', '根页的切换器块');
  assertSingle(out, '<!-- lang-menu:start -->', '根页的页头语言菜单块');
  assertSingle(out, '<!-- lang-boot:start -->', '根页的语言检测脚本块');
  if (out !== SRC) fs.writeFileSync(SRC_FILE, out);
  return out !== SRC;
}

function writeSitemap() {
  const today = new Date().toISOString().slice(0, 10);
  const alts = LOCALES.map((l) => '    <xhtml:link rel="alternate" hreflang="' + l.tag + '" href="' + urlOf(l.tag) + '"/>');
  alts.push('    <xhtml:link rel="alternate" hreflang="x-default" href="' + urlOf('zh-Hans') + '"/>');
  const urls = LOCALES.map((l) => [
    '  <url>',
    '    <loc>' + urlOf(l.tag) + '</loc>',
  ].concat(alts).concat([
    '    <lastmod>' + today + '</lastmod>',
    '    <changefreq>weekly</changefreq>',
    '    <priority>' + (l.tag === 'zh-Hans' ? '1.0' : '0.8') + '</priority>',
    '  </url>',
  ]).join('\n')).join('\n');
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<!--\n'
    + '  站点地图。落地页每种语种一条 URL —— 它们**不是**同一页的翻译视图，\n'
    + '  而是六份静态页（爬虫拿到的 HTML 本身就带对应语种的文案）。\n'
    + '  每条都列出全语种的 xhtml:link 互指，这样六个语种在搜索引擎眼里是一个簇。\n'
    + '  ⚠️ 这个文件是 `scripts/mk-landing.js` 生成的，不要手改。\n'
    + '  上线前把 loc 里的域名换掉（见 index.html 顶部注释）。\n'
    + '-->\n'
    + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n'
    + '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
    + urls + '\n</urlset>\n';
  fs.writeFileSync(path.join(PUBLIC, 'sitemap.xml'), xml);
}

/* ------------------------------------------------------------------ *
 * 命令行
 * ------------------------------------------------------------------ */

function main() {
  const args = process.argv.slice(2);
  const all = args.indexOf('--all') !== -1;
  const rootOnly = args.indexOf('--root') !== -1;
  const mode = args.indexOf('--todo') !== -1 ? '--todo' : (args.indexOf('--list') !== -1 ? '--list' : '');
  const tag = args.filter((a) => a[0] !== '-')[0];

  if (rootOnly || all) {
    const changed = writeRoot();
    writeSitemap();
    console.log('✓ 根页 ' + (changed ? '已更新（hreflang / 切换器）' : '本来就是最新的'));
    console.log('✓ 已生成 public/sitemap.xml（' + LOCALES.length + ' 条 URL）');
    if (!all) return;
  }

  if (!tag) {
    if (all) { /* --all 走下面全部语种 */ }
    else {
      console.error('用法：node scripts/mk-landing.js <tag> [--list|--todo]');
      console.error('      node scripts/mk-landing.js --root     只更新根页和 sitemap');
      console.error('      node scripts/mk-landing.js --all      全部语种 + 根页 + sitemap');
      process.exit(2);
    }
  }

  const tags = tag ? [tag] : LOCALES.map((l) => l.tag);

  if (mode) {
    tags.forEach((t) => {
      const SRC = fs.readFileSync(SRC_FILE, 'utf8');
      const req = required(SRC);
      const table = loadTable(t);
      const problems = diff(req, table);
      console.log('── ' + t + ' ' + '─'.repeat(Math.max(0, 50 - t.length)));
      console.log('  待译：文本 ' + req.text.length + ' 条 / 属性 ' + req.attr.length
        + ' 条 / JSON-LD ' + req.ld.length + ' 条，还缺 ' + problems.length + ' 条');
      problems.slice(0, 20).forEach((p) => console.log('    ' + p));
      if (problems.length > 20) console.log('    …还有 ' + (problems.length - 20) + ' 条');
      if (mode === '--todo') {
        const dir = path.join(landingDir(t), '_todo');
        fs.mkdirSync(dir, { recursive: true });
        fs.readdirSync(dir).forEach((f) => fs.unlinkSync(path.join(dir, f)));
        const tpl = { text: {}, attr: {}, ld: {} };
        req.text.forEach((k) => { tpl.text[k] = ''; });
        // 派生条目**不导出** —— 导出只会诱使译者把同一句话译第二遍，
        // 而两遍译得不一样就是「标记与内容不符」/「标签页与社交卡片标题不一致」。
        const nDer = { attr: 0, ld: 0 };
        ['attr', 'ld'].forEach((kind) => {
          const derived = derivedFromText(req, kind);
          req[kind].forEach((k) => {
            if (derived[k]) { nDer[kind] += 1; return; }
            tpl[kind][k] = '';
          });
        });
        fs.writeFileSync(path.join(dir, '01-landing.json'), JSON.stringify(tpl, null, 2) + '\n');
        console.log('  已写出 scripts/i18n-src/' + t + '/landing/_todo/01-landing.json');
        if (nDer.attr || nDer.ld) {
          console.log('  （' + (nDer.ld ? 'JSON-LD ' + nDer.ld + ' 条' : '')
            + (nDer.attr && nDer.ld ? '、' : '')
            + (nDer.attr ? '属性 ' + nDer.attr + ' 条' : '')
            + '与页面可见文本是同一句，已省略 —— 生成时自动沿用 text 的译文，保证两边逐字一致）');
        }
        const gl = glossary(t);
        if (gl.length) {
          const md = ['# 术语表 · ' + t, '',
            '落地页里出现的领域词，在**已有译文**（kb / ui / demos）里是怎么译的。',
            '',
            '这些词必须沿用同一译法 —— 落地页和工作台说法不一致，用户一眼看得出来，',
            '但没有任何检查会报错。**拿不准的词先在这里查，别自己造。**',
            '',
            '只列**容易译错**的词。单个小写英文词（video / image / shot 这类）不在表里：',
            '源包里「认字用的关键词」和「给人看的字」是混在一起的，关键词表里就写着',
            'sora / runway / jimeng / kling 这种小写匹配词。**正文里别照抄那种写法**，',
            '工具名要按正文惯例首字母大写（Sora / Runway / Jimeng / Kling）。',
            '',
            '| 中文 | 已有译法 |',
            '| --- | --- |',
          ].concat(gl.map((p) => '| ' + p[0] + ' | ' + p[1] + ' |')).join('\n') + '\n';
          fs.writeFileSync(path.join(dir, 'GLOSSARY.md'), md);
          console.log('  已写出 GLOSSARY.md（' + gl.length + ' 条术语，全部取自已有译文）');
        }
        console.log('  （把每个空串填上译文即可 —— key 一个都别动）');
      }
    });
    return;
  }

  let failed = 0;
  tags.forEach((t) => {
    const loc = LOCALES.find((l) => l.tag === t);
    if (!loc) { console.error('✗ 未知语种：' + t); failed += 1; return; }
    if (t === 'zh-Hans') { console.log('· zh-Hans：源页就是它自己，不需要生成'); return; }
    const r = render(t);
    if (r.problems.length) {
      console.error('✗ ' + t + ' 有 ' + r.problems.length + ' 处对不上，**不写文件**：');
      r.problems.slice(0, 20).forEach((p) => console.error('    ' + p));
      failed += 1;
      return;
    }
    const dir = path.join(PUBLIC, loc.dir);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), r.html);
    const kb = Buffer.byteLength(r.html, 'utf8');
    // 可见字数：把标签和脚本去掉再数，不然会被 16KB 的骨架骗过去
    const visible = r.html
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ').trim();
    console.log('✓ public/' + loc.dir + '/index.html  ' + kb + ' B，可见正文 '
      + visible.length + ' 字符');
    if (visible.length < 1200) {
      console.error('  ⚠️ 可见正文少于 1200 字符 —— 内容太薄，搜索引擎会当成低质页。');
      failed += 1;
    }
  });

  if (failed) process.exit(1);
  console.log('全部完成 ✓');
}

main();
