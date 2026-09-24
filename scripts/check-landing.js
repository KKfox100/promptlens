'use strict';

/**
 * 落地页检查
 * ==================================================================
 * 落地页是**六份静态页**（每语种烘一份），不是一份页面的六个翻译视图。
 * 这就带来一批「页面能打开但 SEO 全错」的静默故障：
 *   canonical 忘了改 → 六份页在搜索引擎眼里是同一页，五份被丢弃；
 *   og:locale 忘了改 → 分享卡片显示错语种；
 *   hreflang 少一条   → 那个语种进不了语种簇；
 *   相对路径少一层    → 资源 404，但页面「看起来还行」（样式全丢也算还行吗？）；
 *   JSON-LD 和可见文字不一致 → 判「标记与内容不符」，是作弊项。
 * 这些**肉眼都看不出来**，所以必须一条条量。
 *
 * 用法：node scripts/check-landing.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const SITE = 'https://promptlens.example.com';

/** 与生成器同一张表。**不从这里 import** —— 检查脚本要是复用了生成器的常量，
 *  生成器把地址写错时检查也会跟着错，等于没查。 */
const LOCALES = [
  { tag: 'zh-Hans', dir: '', htmlLang: 'zh-CN', ogLocale: 'zh_CN' },
  { tag: 'zh-Hant', dir: 'zh-Hant', htmlLang: 'zh-Hant', ogLocale: 'zh_TW' },
  { tag: 'en', dir: 'en', htmlLang: 'en', ogLocale: 'en_US' },
  { tag: 'ja', dir: 'ja', htmlLang: 'ja', ogLocale: 'ja_JP' },
  { tag: 'ko', dir: 'ko', htmlLang: 'ko', ogLocale: 'ko_KR' },
  { tag: 'es', dir: 'es', htmlLang: 'es', ogLocale: 'es_ES' },
];

const urlOf = (tag) => SITE + '/' + (LOCALES.find((l) => l.tag === tag).dir
  ? LOCALES.find((l) => l.tag === tag).dir + '/' : '');

/** 各语种的**自称**，同样照抄一份，不 import。
 *  切换器上写错成「Japanese」这类，只有靠这张表才查得出来。 */
const ENDONYM = {
  'zh-Hans': '简体中文', 'zh-Hant': '繁體中文', en: 'English',
  ja: '日本語', ko: '한국어', es: 'Español',
};

const CJK = /[\u3000-\u303f\u4e00-\u9fff\uff01-\uff60]/;
const KANA = /[\u3040-\u309f\u30a0-\u30ff]/;
const HANGUL = /[\uac00-\ud7af]/;
const FULLWIDTH = /[\uff01-\uff60\u3000-\u303f]/;

let pass = 0;
const fails = [];
function check(name, ok, extra) {
  if (ok) { pass += 1; console.log('  ✓ ' + name + (extra ? '  ' + extra : '')); }
  else { fails.push(name); console.log('  ✗ ' + name + (extra ? '  ' + extra : '')); }
}

const read = (p) => fs.readFileSync(p, 'utf8');

/**
 * 摘掉生成器自己管的两块语言标记。
 *
 * 为什么是**两块**：页脚 `.lang-switch` 和页头 `<details class="lang-menu">`
 * 里写的都是各语种的**自称**（简体中文 / 日本語 / 한국어…），它们本来就该在
 * 六份页面上长得一模一样。不摘掉的话，西语页会因为「简体中文」这四个汉字
 * 被判成「混进了中日韩字」—— 报的是漏翻，其实一个字都没漏。
 */
const stripLangBlocks = (s) => s
  .replace(/<!-- lang-switch:start -->[\s\S]*?<!-- lang-switch:end -->/g, '')
  .replace(/<!-- lang-menu:start -->[\s\S]*?<!-- lang-menu:end -->/g, '');
const norm = (s) => String(s).replace(/\s+/g, '');

/** 页面上的可见文字（去掉标签、脚本、样式、注释） */
function visible(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

const attr = (html, re) => { const m = html.match(re); return m ? m[1] : null; };

/* ================================================================== */
console.log('落地页检查\n');

const pages = {};

LOCALES.forEach((loc) => {
  const file = path.join(PUBLIC, loc.dir, 'index.html');
  const label = loc.tag;
  console.log('── ' + label + ' ' + '─'.repeat(Math.max(0, 52 - label.length)));

  if (!fs.existsSync(file)) { check(label + ' 页面存在', false, file); return; }
  const html = read(file);
  pages[loc.tag] = { html, file, loc };

  /* ---- 头 ---- */
  check('html lang = ' + loc.htmlLang,
    attr(html, /<html lang="([^"]*)"/) === loc.htmlLang,
    attr(html, /<html lang="([^"]*)"/));

  const canonical = attr(html, /<link rel="canonical" href="([^"]*)"/);
  check('canonical 指向自己', canonical === urlOf(loc.tag), canonical);

  check('og:url 指向自己',
    attr(html, /<meta property="og:url" content="([^"]*)"/) === urlOf(loc.tag),
    attr(html, /<meta property="og:url" content="([^"]*)"/));

  check('og:locale = ' + loc.ogLocale,
    attr(html, /<meta property="og:locale" content="([^"]*)"/) === loc.ogLocale,
    attr(html, /<meta property="og:locale" content="([^"]*)"/));

  /* ---- hreflang ---- */
  const altLinks = [...html.matchAll(/<link rel="alternate" hreflang="([^"]*)" href="([^"]*)">/g)];
  const want = LOCALES.map((l) => [l.tag, urlOf(l.tag)]).concat([['x-default', urlOf('zh-Hans')]]);
  const got = altLinks.map((m) => [m[1], m[2]]);
  check('hreflang 共 ' + want.length + ' 条（6 语种 + x-default）',
    got.length === want.length, '实际 ' + got.length);
  const wrongHreflang = want.filter((w) => !got.some((g) => g[0] === w[0] && g[1] === w[1]));
  check('每条 hreflang 的语种与地址都对得上',
    wrongHreflang.length === 0,
    wrongHreflang.map((w) => w[0] + '→' + w[1]).join(', '));

  /* ---- 块只许一份 ---- */
  const nHref = html.split('<!-- hreflang:start -->').length - 1;
  const nSw = html.split('<!-- lang-switch:start -->').length - 1;
  const nMenu = html.split('<!-- lang-menu:start -->').length - 1;
  const nBoot = html.split('<!-- lang-boot:start -->').length - 1;
  check('hreflang 块恰好一份', nHref === 1, '实际 ' + nHref);
  check('页脚切换器块恰好一份', nSw === 1, '实际 ' + nSw);
  check('页头语言菜单块恰好一份', nMenu === 1, '实际 ' + nMenu);
  check('语言检测脚本块恰好一份', nBoot === 1, '实际 ' + nBoot);

  /* ---- 语言标记：页脚切换器 + 页头菜单 ----
     两块的链接都要逐条落到**对应语种那一份静态文件**上。
     ⚠️ 链接现在是**相对**地址（绝对地址在本地打不开，见生成器里的说明），
     所以要把 href 按页面所在目录解析回文件路径再比，
     不能再拿 urlOf(tag) 直接比字符串 —— 那样六条会全报错。 */
  const pageDir = path.dirname(file);
  const toFile = (href) => {
    let t = path.resolve(pageDir, href);
    if (!path.extname(t)) t = path.join(t, 'index.html');
    return t;
  };
  const fileOf = (tag) => path.join(PUBLIC, LOCALES.find((l) => l.tag === tag).dir, 'index.html');

  const checkLangBlock = (name, re) => {
    const m = html.match(re);
    if (!m) { check(name + '存在', false); return; }
    const links = [...m[1].matchAll(/<a class="(lang-link[^"]*)" href="([^"]*)" hreflang="([^"]*)"[^>]*>([^<]*)<\/a>/g)];
    check(name + '有 6 个真链接', links.length === 6, '实际 ' + links.length);
    const bad = LOCALES.filter((l) => !links.some((x) => x[3] === l.tag && toFile(x[2]) === fileOf(l.tag)));
    check(name + '每个链接指向对应语种那一份静态页',
      bad.length === 0, bad.map((l) => l.tag).join(', '));
    const actives = links.filter((x) => /active/.test(x[1]));
    check(name + '恰好一个 active，且是自己',
      actives.length === 1 && actives[0][3] === loc.tag,
      actives.length + ' 个' + (actives.length === 1 ? '，指向 ' + actives[0][3] : ''));
    /* 切换器上必须是各语种的**自称**。「日本語」被译成「Japanese」是典型的错译：
       日语用户在自己的系统里认的是「日本語」。 */
    const got = links.map((x) => x[4]).join('|');
    const want = LOCALES.map((l) => ENDONYM[l.tag]).join('|');
    check(name + '用的是各语种的自称', got === want, got);
    const badHl = links.filter((x) => x[3] !== (LOCALES.find((l) => ENDONYM[l.tag] === x[4]) || {}).tag);
    check(name + '文字与 hreflang 一一对应', badHl.length === 0, badHl.map((x) => x[4]).join(', '));
  };

  checkLangBlock('页脚切换器', /<!-- lang-switch:start -->([\s\S]*?)<!-- lang-switch:end -->/);
  checkLangBlock('页头语言菜单', /<!-- lang-menu:start -->([\s\S]*?)<!-- lang-menu:end -->/);

  /* ---- 页头菜单的收起态 ---- */
  const menu = html.match(/<!-- lang-menu:start -->([\s\S]*?)<!-- lang-menu:end -->/);
  if (menu) {
    const sum = menu[1].match(/<summary[^>]*>([^<]*)<\/summary>/);
    check('页头菜单收起时显示的是当前语种',
      !!sum && sum[1] === ENDONYM[loc.tag], sum ? sum[1] : '(没有 summary)');
    check('页头菜单用的是原生 <details>（没有 JS 也能开合）',
      /<details class="lang-menu">/.test(menu[1]));
  }

  /* ---- 语言检测脚本 ---- */
  check('引用了 landing-lang.js',
    /<script src="(?:\.\.\/)*assets\/js\/landing-lang\.js" defer><\/script>/.test(html));
  check('landing-lang.js 真的存在',
    fs.existsSync(path.join(PUBLIC, 'assets', 'js', 'landing-lang.js')));

  /* ---- **谁能自动跳转**：只有 x-default 那一页 ----
     这条是整套自动跳转里最要紧的一条断言。
     `/ja/` 这种地址是用户的明确选择（别人分享给他、或从搜索结果点进来），
     在那里再按系统语言跳一次就等于「我点开的链接不是我要的页面」。
     判据取 canonical === hreflang="x-default" 的 href —— 从烘好的数据里读。 */
  const can = attr(html, /<link rel="canonical" href="([^"]*)"/);
  const xd = attr(html, /<link rel="alternate" hreflang="x-default" href="([^"]*)"/);
  const isRoot = !!can && can === xd;
  check('「这一页允许自动跳转」的判定与语种一致（只有 x-default 那一页为真）',
    isRoot === (loc.tag === 'zh-Hans'), isRoot ? '允许' : '不允许');

  /* ---- 相对路径都能落到真实文件 ---- */
  const dir = path.dirname(file);
  const refs = [...html.matchAll(/\b(?:href|src)="([^"]+)"/g)].map((m) => m[1])
    .filter((h) => !/^(https?:|data:|#|mailto:|tel:)/.test(h));
  const broken = refs.filter((h) => !fs.existsSync(path.resolve(dir, h.split('#')[0].split('?')[0])));
  check('相对引用的资源/页面都存在（' + refs.length + ' 条）',
    broken.length === 0, broken.slice(0, 4).join(', '));

  /* ---- 可见正文够厚 ---- */
  const vis = visible(html);
  check('可见正文 ≥ 1200 字符', vis.length >= 1200, vis.length + ' 字符');

  /* ---- 仍然是可收录的 ---- */
  check('robots 仍是 index（不是 noindex）',
    /<meta name="robots" content="index/.test(html));

  /* ---- 是生成物，不是手抄的 ----
     根页（zh-Hans）是**源页**，由 writeRoot 就地改，不是生成出来的，
     所以它不该有那条横幅 —— 要求它有就等于要求源页自称是生成物。 */
  if (loc.dir) {
    check('带「本文件是生成的」横幅',
      html.indexOf('generated by scripts/mk-landing.js') !== -1);
  }

  /* ---- 语种专属：正文里不许有别的文字系统 ---- */
  const noSw = stripLangBlocks(html);
  const bodyOnly = noSw.replace(/<script[\s\S]*?<\/script>/gi, '');
  if (loc.tag === 'en' || loc.tag === 'es' || loc.tag === 'ko') {
    const cjk = [...new Set(bodyOnly.match(new RegExp(CJK.source, 'g')) || [])];
    check('切换器之外没有任何中日韩字', cjk.length === 0, cjk.slice(0, 12).join(''));
    const fw = [...new Set(bodyOnly.match(new RegExp(FULLWIDTH.source, 'g')) || [])];
    check('没有任何全角标点', fw.length === 0, fw.slice(0, 12).join(''));
  }
  if (loc.tag === 'ja') {
    check('正文里有假名（不是只换了汉字的假日语）', KANA.test(visible(noSw)));
  }
  if (loc.tag === 'ko') {
    check('正文里有谚文', HANGUL.test(visible(noSw)));
    check('正文里没有汉字（韩文里不该混 Hanja）',
      !/[\u4e00-\u9fff]/.test(visible(noSw)),
      [...new Set(visible(noSw).match(/[\u4e00-\u9fff]/g) || [])].slice(0, 10).join(''));
  }
  if (loc.tag === 'zh-Hant') {
    /* 台灣用語，不是简繁转换。这些词是大陆写法，台湾分别写
       影片 / 圖片 / 使用者 / 登入 / 資料 / 支援 / 軟體 / 預設 / 螢幕 / 品質 /
       最佳化 / 範例 / 資訊 / 網路 / 專案 / 解析度 / 帳號 / 記錄。 */
    const MAINLAND = ['视频', '图片', '用户', '登录', '数据', '支持', '软件', '默认', '屏幕',
      '质量', '优化', '示例', '信息', '网络', '项目', '分辨率', '账号', '记录', '视频', '文档'];
    const hit = MAINLAND.filter((w) => vis.indexOf(w) !== -1);
    check('正文里没有大陆用词（台灣用語，不是简繁转换）', hit.length === 0, hit.join('、'));
  }

  /* ---- JSON-LD ---- */
  const ldBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  check('JSON-LD 恰好一段', ldBlocks.length === 1, '实际 ' + ldBlocks.length);
  if (ldBlocks.length === 1) {
    let ld = null;
    try { ld = JSON.parse(ldBlocks[0][1]); } catch (e) { check('JSON-LD 是合法 JSON', false, e.message); }
    if (ld) {
      check('JSON-LD 是合法 JSON', true);
      const flat = [];
      (function walk(v) {
        if (typeof v === 'string') { flat.push(v); return; }
        if (Array.isArray(v)) { v.forEach(walk); return; }
        if (v && typeof v === 'object') Object.keys(v).forEach((k) => walk(v[k]));
      })(ld);
      const ldUrls = flat.filter((v) => v.indexOf('https://promptlens.example.com') === 0);
      const badUrl = ldUrls.filter((u) => u.indexOf(urlOf(loc.tag)) !== 0);
      check('JSON-LD 里的 url / @id 都指向本语种地址',
        badUrl.length === 0, badUrl.slice(0, 3).join(', '));
      const langs = flat.filter((v) => v === 'zh-CN' || v === loc.htmlLang);
      check('JSON-LD 的 inLanguage 是本语种',
        langs.length === 0 || langs.every((v) => v === loc.htmlLang),
        langs.join(', '));

      /* 最关键的一条：结构化数据里的问答必须和页面上看得见的文字**逐字一致**。
         不一致 = 「标记与内容不符」，是作弊项，而浏览器里完全看不出来。 */
      const dd = [...html.matchAll(/<dd>([\s\S]*?)<\/dd>/g)].map((m) => norm(visible(m[1])));
      const answers = [];
      (function walk2(v) {
        if (Array.isArray(v)) { v.forEach(walk2); return; }
        if (v && typeof v === 'object') {
          if (v['@type'] === 'Answer' && typeof v.text === 'string') answers.push(norm(v.text));
          Object.keys(v).forEach((k) => walk2(v[k]));
        }
      })(ld);
      const mismatch = answers.filter((a) => dd.indexOf(a) === -1);
      check('JSON-LD 的 ' + answers.length + ' 条问答与页面上看得见的文字逐字一致',
        answers.length > 0 && mismatch.length === 0,
        mismatch.length ? mismatch[0].slice(0, 40) + '…' : '');
    }
  }

  /* ---- og:title 与 title 一致（生成器会把它们绑在一起） ---- */
  const t = attr(html, /<title>([\s\S]*?)<\/title>/);
  check('og:title 与 title 完全一致',
    t !== null && attr(html, /<meta property="og:title" content="([^"]*)"/) === t,
    t);
  if (loc.tag === 'en' || loc.tag === 'es') {
    check('title ≤ 65 字符', t !== null && t.length <= 65, t ? t.length + ' 字符' : '');
  }
  const desc = attr(html, /<meta name="description" content="([^"]*)"/);
  /* 下限按字种分：一个汉字装的信息量约等于两个拉丁字母，
     拿 100 去卡中文，等于要求中文描述比英文长一倍。 */
  const descMin = /^(en|es)$/.test(loc.tag) ? 100 : 55;
  /* 上限也按字种分，但原因是另一个（LLMO 那轮才出现）：
     meta description 现在**同时**是那句「自足定义句」的载体 ——
     正文 .hero-def / meta / JSON-LD 的 SoftwareApplication.description
     三处必须逐字一致（见 check-llmo.js）。而一句能单独摘出去还站得住的
     定义，要一次说清六件事：产品名、它把什么变成什么、拆的是哪几个维度、
     「每个决定由你来做」这条主张、覆盖哪三类场景、产出是什么。
     中文用 100 字就装得下，拉丁字母要 200~225 个字符。

     代价是明说的：搜索引擎的摘要一般在 155~160 字符处截断，en/es 的
     搜索结果摘要会被截掉尾巴。这是**故意换的** —— 摘要被截断只是少看半句，
     而定义句残缺则整句都引用不了（模型拿到「… Every decision is yours.」
     这种没有主语的残句，只能丢掉）。别为了摘要好看把这句话砍短，
     那会把 check-llmo.js 守的那条不变量拆掉。
     上限留到 240 是有意的：够装下现在这句话，也仍然拦得住失控的长描述。 */
  const descMax = /^(en|es)$/.test(loc.tag) ? 240 : 175;
  check('meta description 长度合理（' + descMin + '~' + descMax + '）',
    desc !== null && desc.length >= descMin && desc.length <= descMax,
    desc ? desc.length + ' 字符' : '');
  console.log('');
});

/* ================================================================== */
console.log('── 跨语种 ' + '─'.repeat(45));
const base = pages['zh-Hans'];
if (base) {
  const baseVis = visible(base.html);
  LOCALES.filter((l) => l.tag !== 'zh-Hans').forEach((l) => {
    const p = pages[l.tag];
    if (!p) return;
    const v = visible(p.html);
    check('[' + l.tag + '] 正文与简体版不同（确实翻译过）', v !== baseVis);
  });
}

/* ---- 语种判定：两份实现必须逐条同义 ----
   `landing-lang.js`（落地页的检测脚本）和 `i18n.js`（工作台）各有一份
   「浏览器语言 → tag」的判定。两份不同义就会出现最难查的分裂：
   工作台判成繁体、落地页判成简体，用户在同一次访问里被两个地方分别判定。
   所以拿同一批探针把两边跑一遍，**逐条比**。 */
console.log('');
console.log('── 语言判定与自动跳转 ' + '─'.repeat(30));
const LL = require(path.join(PUBLIC, 'assets', 'js', 'landing-lang.js'));
const I18N = require(path.join(PUBLIC, 'assets', 'js', 'i18n.js'));
const TAGS = LOCALES.map((l) => l.tag);
const PROBES = ['zh', 'zh-CN', 'zh-SG', 'zh-TW', 'zh-HK', 'zh-MO', 'zh-Hant',
  'zh-Hant-TW', 'zh-Hans', 'en', 'en-US', 'en-GB', 'ja', 'ja-JP', 'ko', 'ko-KR',
  'es', 'es-ES', 'es-419', 'fr', 'de', 'pt-BR', '', 'ZH-TW'];
const mism = PROBES.filter((p) => LL.tagFor(p, TAGS) !== I18N.matchTag(p));
check('landing-lang.js 与 i18n.js 的语种判定逐条同义（' + PROBES.length + ' 个探针）',
  mism.length === 0,
  mism.map((p) => p + '→' + LL.tagFor(p, TAGS) + '/' + I18N.matchTag(p)).join(', '));

/* ---- 自动跳转的四条豁免：纯函数直接测 ----
   跳转在浏览器里只发生一次、还带导航副作用，靠端到端覆盖每条分支成本太高。
   把决策抽成纯函数之后，十几组输入就能把每条分支钉死 —— 而且**不用起服务**。 */
const ENV = {
  available: TAGS, cur: 'zh-Hans', isXDefault: true,
  isBot: false, urlTag: null, storedTag: null, browserTag: null,
};
const dec = (over) => LL.decide(Object.assign({}, ENV, over));

/**
 * 按**真实的**输入形态测：给一串 `navigator.languages`（原始值，可能带地区码），
 * 先过 tagFor 映射，再进 decide —— 和页面上的链路一模一样。
 *
 * 直接往 decide 里塞 'zh-TW' 是错的：decide 收的是**映射后**的 tag，
 * 塞原始值会得到 'unsupported'。第一版就是这么写错的，四条报红 ——
 * 报红的不是代码，是我的测试搞错了 decide 的契约。
 */
const fromBrowser = (langs, over) => {
  let mapped = null;
  for (let i = 0; i < langs.length; i += 1) {
    const hit = LL.tagFor(langs[i], TAGS);
    if (hit) { mapped = hit; break; }
  }
  return LL.decide(Object.assign({}, ENV, { browserTag: mapped }, over));
};

const CASES = [
  ['根页 + 系统日语 → 跳日语', { browser: ['ja'] }, 'ja'],
  ['根页 + 系统日语（ja-JP）→ 跳日语', { browser: ['ja-JP'] }, 'ja'],
  ['根页 + 系统简体中文 → 不跳（本来就是这一页）', { browser: ['zh-CN'] }, null],
  ['根页 + 系统法语 → 不跳（我们没这个语种）', { browser: ['fr-FR'] }, null],
  ['根页 + 首选法语、次选日语 → 跳日语（顺位往下找）', { browser: ['fr-FR', 'ja'] }, 'ja'],
  ['根页 + 系统语言读不到 → 不跳', { browser: [] }, null],
  ['根页 + 系统繁体（台湾）→ 跳繁体', { browser: ['zh-TW'] }, 'zh-Hant'],
  ['根页 + 系统繁体（zh-Hant-TW）→ 跳繁体', { browser: ['zh-Hant-TW'] }, 'zh-Hant'],
  ['根页 + 系统繁体（香港）→ 跳繁体', { browser: ['zh-HK'] }, 'zh-Hant'],
  ['根页 + 系统简体（新加坡）→ 不跳', { browser: ['zh-SG'] }, null],
  ['根页 + 系统韩语（ko-KR）→ 跳韩语', { browser: ['ko-KR'] }, 'ko'],
  ['根页 + 系统西语（es-419）→ 跳西语', { browser: ['es-419'] }, 'es'],
  /* ① 只在 x-default 跳 —— `/ja/` 是用户的明确选择，不能再按系统语言改他的主意 */
  ['/ja/ 页 + 系统中文 → **不跳**（不是 x-default）',
    { cur: 'ja', isXDefault: false, browser: ['zh-CN'] }, null],
  ['/en/ 页 + 系统日语 → **不跳**（不是 x-default）',
    { cur: 'en', isXDefault: false, browser: ['ja'] }, null],
  /* ② 爬虫豁免 —— 不豁免的话 Googlebot 抓 `/` 会被跳走，中文版首页排名丢掉 */
  ['根页 + Googlebot + 系统日语 → **不跳**', { isBot: true, browser: ['ja'] }, null],
  ['根页 + 普通浏览器 + 系统日语 → 跳（确认爬虫豁免没有把所有人都挡住）',
    { isBot: false, browser: ['ja'] }, 'ja'],
  /* ③ 存过偏好就不覆盖 —— 没有这条会有「点简体中文被弹回日语」的死循环 */
  ['根页 + 存过简体中文 + 系统日语 → **不跳**（防来回弹）',
    { storedTag: 'zh-Hans', browser: ['ja'] }, null],
  ['根页 + 存过英语 + 系统日语 → 跳英语（存的偏好优先于系统语言）',
    { storedTag: 'en', browser: ['ja'] }, 'en'],
  /* ④ URL 参数是这一次点击的明确意图，最优先 */
  ['根页 + ?lang=ja + 存过英语 → 跳日语（URL 最优先）',
    { urlTag: 'ja', storedTag: 'en', browser: ['ko'] }, 'ja'],
  ['根页 + ?lang=ja 且系统也是日语 → 跳日语', { urlTag: 'ja', browser: ['ja'] }, 'ja'],
  /* 认不出的 tag 一律不跳 */
  ['根页 + ?lang=fr（不支持的语种）→ 不跳', { urlTag: 'fr' }, null],
  ['根页 + 存了个已经不支持的 tag → 不跳', { storedTag: 'de' }, null],
];
CASES.forEach(([name, over, want]) => {
  const got = fromBrowser(over.browser || [], over);
  check(name, got.tag === want, '得到 ' + got.tag + ' / ' + got.why + '，应为 ' + want);
});
check('跳转原因可分辨（便于排错，不是只有 null）',
  dec({ browserTag: 'ja' }).why === 'browser'
  && dec({ storedTag: 'en', browserTag: 'ja' }).why === 'stored'
  && dec({ urlTag: 'ja', browserTag: 'ko' }).why === 'url'
  && dec({ isBot: true, browserTag: 'ja' }).why === 'bot'
  && dec({ cur: 'ja', isXDefault: false, browserTag: 'zh-CN' }).why === 'not-x-default');

/* ---- 爬虫判据：别把普通浏览器当爬虫，也别漏掉主流爬虫 ---- */
const BOTS = ['Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
  'Mozilla/5.0 (compatible; YandexBot/3.0)', 'Mozilla/5.0 (compatible; Baiduspider/2.0)',
  'Mozilla/5.0 (compatible; Applebot/0.1)', 'Mozilla/5.0 (compatible; DuckDuckBot/1.0)',
  'Mozilla/5.0 (compatible; PetalBot; +https://webmaster.petalsearch.com/site/petalbot)',
  'Mozilla/5.0 (compatible; Sogou web spider/4.0)', 'GPTBot/1.0', 'ClaudeBot/1.0',
  'Mozilla/5.0 (compatible; PerplexityBot/1.0)', 'facebookexternalhit/1.1',
  'Mozilla/5.0 (compatible; Bytespider)', 'Slackbot-LinkExpanding 1.0'];
const HUMANS = [
  /* ⚠️ 无头 Chrome 必须在「人类」这一侧 —— 本项目的实机校验就跑在它上面，
     把它算成爬虫的话，「系统语言是日语时会跳」这条断言再也测不出来。 */
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/140.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36',
];
const missed = BOTS.filter((u) => !LL.isBot(u));
check('主流爬虫都被认出来（' + BOTS.length + ' 个）', missed.length === 0,
  missed.map((u) => u.slice(0, 40)).join(' | '));
const falsePos = HUMANS.filter((u) => LL.isBot(u));
check('普通浏览器（含无头 Chrome）都没被当成爬虫（' + HUMANS.length + ' 个）',
  falsePos.length === 0, falsePos.map((u) => u.slice(0, 40)).join(' | '));

/* ---- file:// 下的目录归一化 ----
   `href="en/"` 在 HTTP 下由服务端补 index.html，在 `file://` 下浏览器给的是
   **目录列表** —— 本地双击打开落地页时点「English」会看到一串文件名。
   本项目要求 file:// 直接打开也能用，所以这一层必须存在且正确。 */
const FILE_CASES = [
  ['./', './index.html'],
  ['en/', 'en/index.html'],
  ['../', '../index.html'],
  ['../ja/', '../ja/index.html'],
  ['zh-Hant/', 'zh-Hant/index.html'],
  /* 已经带文件名的原样返回 —— 加两次会变成 index.html/index.html */
  ['index.html', 'index.html'],
  ['../login.html', '../login.html'],
  ['', ''],
];
const fileBad = FILE_CASES.filter(([a, b]) => LL.fileIndex(a) !== b);
check('file:// 下目录地址补成 index.html（' + FILE_CASES.length + ' 个用例）',
  fileBad.length === 0,
  fileBad.map(([a, b]) => a + '→' + LL.fileIndex(a) + '（应为 ' + b + '）').join(', '));

/* ---- sitemap ---- */
console.log('');
console.log('── sitemap.xml ' + '─'.repeat(40));
const smFile = path.join(PUBLIC, 'sitemap.xml');
if (!fs.existsSync(smFile)) { check('sitemap.xml 存在', false); }
else {
  const sm = read(smFile);
  check('声明了 xhtml 命名空间（xhtml:link 才合法）',
    sm.indexOf('xmlns:xhtml="http://www.w3.org/1999/xhtml"') !== -1);
  const locs = [...sm.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
  check('恰好 ' + LOCALES.length + ' 条 URL', locs.length === LOCALES.length, '实际 ' + locs.length);
  const badLoc = LOCALES.filter((l) => locs.indexOf(urlOf(l.tag)) === -1);
  check('六个语种的地址都在', badLoc.length === 0, badLoc.map((l) => l.tag).join(', '));
  /* 每条 URL 都要带齐 7 条 xhtml:link，否则「语种簇」是断的 */
  const blocks = sm.split('<url>').slice(1);
  const badBlock = blocks.filter((b) => (b.match(/xhtml:link/g) || []).length !== LOCALES.length + 1);
  check('每条 URL 都带齐 ' + (LOCALES.length + 1) + ' 条 xhtml:link 互指',
    blocks.length === LOCALES.length && badBlock.length === 0,
    badBlock.length + ' 条不全');
}

/* ================================================================== */
console.log('');
if (fails.length) {
  console.log('✗ ' + fails.length + ' 项不通过（共 ' + (pass + fails.length) + ' 项）：');
  fails.forEach((f) => console.log('    ' + f));
  process.exit(1);
}
console.log('全部通过 ✓ （' + pass + ' 项）');
