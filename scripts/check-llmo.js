'use strict';

/**
 * LLMO 自检：**模型读到的那个版本，和用户读到的那个版本，是不是同一个**。
 *
 * 为什么要有这一份，`browser-check.js` 管不了：
 *   那边跑的是浏览器，看的是**渲染后**的页面。而 AI 爬虫**不跑 JS**、
 *   也不看渲染结果 —— 它读的是 HTML 原文，以及 llms.txt 这类纯文本入口。
 *   两边的差别正好是 LLMO 出问题的全部空间：
 *   页面好看、断言全绿、而模型拿到的是另一套说法。
 *
 * 这一份专门守四件事：
 *   ① llms.txt / llms-full.txt 每个语种都有，格式合法，链接都能落地；
 *   ② **定义句在正文 / meta description / JSON-LD 三处逐字一致** ——
 *      三处不一致时模型读到三个说法，而页面上一个字都看不出来；
 *   ③ HowTo 的四步与页面上看得见的四步逐条一致（同 FAQPage 一条纪律）；
 *   ④ robots.txt 的 AI 爬虫名单没有漏人，且没有和 noindex 打架。
 *
 * 还有一条是**防陈旧**：把 llms.txt 重新派生一遍再逐字节比对。
 *   `mk-llms.js` 是从已烘好的 HTML 派生的，所以落地页一改、
 *   没重跑它，磁盘上就是上一版内容 —— 不报错、不崩，只是模型读到旧说法。
 *   重新派生比对是唯一能发现这件事的办法。
 *
 * 用法：
 *   node scripts/check-llmo.js
 */

const fs = require('fs');
const path = require('path');
const MK = require('./mk-llms.js');

const ROOT = path.join(__dirname, '..');
/* 同 mk-llms.js：变异测试跑在临时副本上。 */
const PUBLIC = process.env.PL_PUBLIC_DIR || path.join(ROOT, 'public');

let pass = 0;
let fail = 0;
const check = (name, ok, detail) => {
  if (ok) pass += 1; else fail += 1;
  console.log((ok ? '  ✓ ' : '  ✗ ') + name + (detail ? '  —— ' + detail : ''));
};
const head = (t) => console.log('\n' + t);

/* ------------------------------------------------------------------ *
 * 取字工具
 * ------------------------------------------------------------------ */

const flat = (s) => String(s == null ? '' : s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const one = (html, re) => { const m = html.match(re); return m ? flat(m[1]) : null; };
const all = (html, re) => {
  const out = [];
  const r = new RegExp(re.source, re.flags.indexOf('g') === -1 ? re.flags + 'g' : re.flags);
  let m;
  while ((m = r.exec(html)) !== null) out.push(flat(m[1]));
  return out;
};

/**
 * 常见 AI 爬虫名单 —— **这是检查自己的期望**，不是从别处抄来的。
 *
 * 名单放在检查里而不是从 robots.txt 读，才有意义：
 * 从文件读的话，「漏了一个」永远查不出来（读到的就是漏完的那份）。
 * 这正是 `check-locale-parity.js` 那条教训的反面用法 ——
 * 那边基线只能证明「没变」，这边期望必须独立于被检查对象。
 *
 * 加新爬虫时：先在 robots.txt 里补，再在这里补。
 * 顺序反了会红，这正是想要的 —— 红一次好过漏一个。
 */
const AI_BOTS = [
  'OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'Perplexity-User',
  'Claude-User', 'DuckAssistBot', 'MistralAI-User',
  'GPTBot', 'ClaudeBot', 'anthropic-ai', 'Claude-Web',
  'Google-Extended', 'Applebot-Extended', 'CCBot', 'Bytespider',
  'meta-externalagent', 'Amazonbot', 'cohere-ai', 'YouBot', 'Diffbot', 'Timpibot',
];

/* ------------------------------------------------------------------ *
 * 一、每个语种的 llms.txt / llms-full.txt
 * ------------------------------------------------------------------ */

const locs = MK.locales();
const pages = locs.map((l) => {
  const file = l.dir ? path.join(PUBLIC, l.dir, 'index.html') : path.join(PUBLIC, 'index.html');
  const txt = l.dir ? path.join(PUBLIC, l.dir, 'llms.txt') : path.join(PUBLIC, 'llms.txt');
  const full = l.dir ? path.join(PUBLIC, l.dir, 'llms-full.txt') : path.join(PUBLIC, 'llms-full.txt');
  return { loc: l, file, txtPath: txt, fullPath: full, html: fs.readFileSync(file, 'utf8') };
});

/** tag → 该语种页面的 canonical。跨语种链接的比对基准。 */
const canonOf = {};
pages.forEach((p) => {
  canonOf[p.loc.tag] = one(p.html, /<link rel="canonical" href="([^"]*)"/);
});

head('一、llms.txt / llms-full.txt 的覆盖与格式');
check('语种表是从根页切换器读出来的（不在这里重抄）', locs.length >= 2,
  locs.map((l) => l.tag).join(', '));
locs.forEach((l) => {
  const p = pages.find((x) => x.loc.tag === l.tag);
  check('[' + l.tag + '] llms.txt 存在', fs.existsSync(p.txtPath));
  check('[' + l.tag + '] llms-full.txt 存在', fs.existsSync(p.fullPath));
});

pages.forEach((p) => {
  const tag = p.loc.tag;
  if (!fs.existsSync(p.txtPath)) return;
  const txt = fs.readFileSync(p.txtPath, 'utf8');
  const lines = txt.split('\n');
  check('[' + tag + '] llms.txt 第一行是 H1', /^# \S/.test(lines[0]), JSON.stringify(lines[0]));
  check('[' + tag + '] H1 就是站名（不是那句修辞标题）',
    lines[0] === '# ' + one(p.html, /<meta property="og:site_name" content="([^"]*)"/),
    lines[0]);
  check('[' + tag + '] H1 后面紧跟一句 blockquote 摘要',
    /^> \S/.test(lines[2] || ''), JSON.stringify(lines[2]));

  /* 摘要必须**就是**那句定义。写成另一句话的话，llms.txt 和落地页
     在模型眼里就是两个说法 —— 而这一份是专门给模型看的。 */
  const def = one(p.html, /<meta name="description" content="([^"]*)"/);
  check('[' + tag + '] 摘要与页面的定义句逐字一致',
    (lines[2] || '').replace(/^> /, '') === def,
    'llms.txt ' + JSON.stringify(String(lines[2]).slice(0, 30)));

  /* 每个分节都得在。少一节就是「模型看不见那部分内容」，
     而 llms.txt 看上去完全正常。 */
  const secTitles = all(p.html, /<section class="land-section" id="[^"]+">[\s\S]*?<h2[^>]*>([\s\S]*?)<\/h2>/);
  const missing = secTitles.filter((t) => txt.indexOf('## ' + t) === -1);
  check('[' + tag + '] llms.txt 列出了全部 ' + secTitles.length + ' 个分节',
    missing.length === 0, missing.length ? '缺 ' + missing.join(' / ') : '');

  /* 链接必须能落地。这里要分两类看，**不能一句「都指向本语种」了事**：
       带锚点的  —— 必须指向本语种那一页。指向别处的话，模型会以为
                    这一节在另一种语言里，而那种语言的内容它读不到。
       不带锚点的 —— 合法情况有两种：其他语种的首页（llms.txt 里有
                    「其他语言」一节），和本语种的 llms-full.txt。
     第一版写成「全部必须等于 canonical」，于是这六条全红 ——
     红的是断言，不是数据。 */
  const links = [];
  const lre = /\]\(([^)]+)\)/g;
  let m;
  while ((m = lre.exec(txt)) !== null) links.push(m[1]);
  check('[' + tag + '] llms.txt 里的链接都是绝对地址',
    links.length > 0 && links.every((u) => /^https?:\/\//.test(u)),
    links.filter((u) => !/^https?:\/\//.test(u)).join(' '));

  const canon = canonOf[tag];
  const origin = String(canon).match(/^https?:\/\/[^/]+/)[0];
  const offOrigin = links.filter((u) => u.indexOf(origin) !== 0);
  check('[' + tag + '] llms.txt 里的链接都在同一个域名下',
    offOrigin.length === 0, offOrigin.join(' '));

  const anchored = links.filter((u) => u.indexOf('#') !== -1);
  const badAnchorPath = anchored.filter((u) => u.split('#')[0] !== canon);
  check('[' + tag + '] 带锚点的链接都指向本语种页面',
    badAnchorPath.length === 0, badAnchorPath.join(' '));

  const anchors = anchored.map((u) => u.split('#')[1]).filter(Boolean);
  const badAnchor = anchors.filter((id) => p.html.indexOf('id="' + id + '"') === -1);
  check('[' + tag + '] llms.txt 里的锚点在页面里都存在（' + anchors.length + ' 个）',
    badAnchor.length === 0, badAnchor.map((x) => '#' + x).join(' '));

  const bare = links.filter((u) => u.indexOf('#') === -1);
  const canonList = locs.map((l) => canonOf[l.tag]);
  const badBare = bare.filter((u) => canonList.indexOf(u) === -1 && !/llms-full\.txt$/.test(u));
  check('[' + tag + '] 不带锚点的链接只指向各语种首页或 llms-full.txt',
    badBare.length === 0, badBare.join(' '));

  /* 其他语言也要列出来 —— 模型据此知道有六份内容，而不是只有这一份。 */
  const others = locs.filter((l) => l.tag !== tag);
  check('[' + tag + '] llms.txt 列出了其余 ' + others.length + ' 个语种',
    others.every((l) => txt.indexOf(canonOf[l.tag]) !== -1),
    others.map((l) => l.name).join(' '));
});

/* ------------------------------------------------------------------ *
 * 二、llms-full.txt 的完整性
 * ------------------------------------------------------------------ */

head('二、llms-full.txt：整页正文的 Markdown 镜像');
pages.forEach((p) => {
  const tag = p.loc.tag;
  if (!fs.existsSync(p.fullPath)) return;
  const md = fs.readFileSync(p.fullPath, 'utf8');
  /* 残留标签意味着转换器漏了一种结构 —— 模型会读到一段没解析的 HTML。 */
  const tagLeft = md.match(/<[a-zA-Z/][^>\n]*>/g) || [];
  check('[' + tag + '] llms-full.txt 里没有残留的 HTML 标签',
    tagLeft.length === 0, tagLeft.slice(0, 3).join(' '));

  const def = one(p.html, /<meta name="description" content="([^"]*)"/);
  check('[' + tag + '] llms-full.txt 含那句定义（逐字）', md.indexOf(def) !== -1);

  const secTitles = all(p.html, /<section class="land-section" id="[^"]+">[\s\S]*?<h2[^>]*>([\s\S]*?)<\/h2>/);
  const missSec = secTitles.filter((t) => md.indexOf(t) === -1);
  check('[' + tag + '] llms-full.txt 含全部分节标题', missSec.length === 0, missSec.join(' / '));

  const faq = all(p.html, /<dt>([\s\S]*?)<\/dt>/);
  const missFaq = faq.filter((q) => md.indexOf(q) === -1);
  check('[' + tag + '] llms-full.txt 含全部 ' + faq.length + ' 条 FAQ 问句',
    missFaq.length === 0, missFaq.join(' / '));

  /* 表格必须真的转成了 Markdown 表格。压成一行的话内容还在，
     但「三行三列」这个结构没了 —— 而那正是把卡片换成表格的理由。 */
  const heads = all(p.html, /<thead>[\s\S]*?<th scope="col">([\s\S]*?)<\/th>/);
  check('[' + tag + '] llms-full.txt 把场景表转成了 Markdown 表格',
    heads.length > 0 && heads.every((h) => md.indexOf('| ' + h) !== -1)
    && /\|\s*---/.test(md),
    heads.join(' / '));

  const steps = all(p.html, /<h3 class="step-title">([\s\S]*?)<\/h3>/);
  const missStep = steps.filter((s) => md.indexOf(s) === -1);
  check('[' + tag + '] llms-full.txt 含全部 ' + steps.length + ' 个步骤标题',
    missStep.length === 0, missStep.join(' / '));
});

/* ------------------------------------------------------------------ *
 * 三、定义句三处一致
 * ------------------------------------------------------------------ */

head('三、定义句：正文 / meta description / JSON-LD 三处逐字一致');
pages.forEach((p) => {
  const tag = p.loc.tag;
  const body = one(p.html, /<p class="hero-def">([\s\S]*?)<\/p>/);
  const meta = one(p.html, /<meta name="description" content="([^"]*)"/);
  const ld = one(p.html, /"description": "([^"]*)"[\s\S]{0,400}?"featureList"/);
  check('[' + tag + '] 正文里有定义句（.hero-def）', !!body,
    body ? '' : '找不到 .hero-def');
  check('[' + tag + '] 正文 = meta description', !!body && body === meta,
    '正文 ' + JSON.stringify(String(body).slice(0, 24)) + ' / meta ' + JSON.stringify(String(meta).slice(0, 24)));
  check('[' + tag + '] 正文 = JSON-LD 的 SoftwareApplication.description',
    !!body && body === ld,
    '正文 ' + JSON.stringify(String(body).slice(0, 24)) + ' / ld ' + JSON.stringify(String(ld).slice(0, 24)));
  /* 定义句必须**自足**：主语写全、不靠上下文。
     以「它」「这个」开头的句子摘出去就站不住，而模型正是按句子引用的。 */
  check('[' + tag + '] 定义句以站名开头（不靠上下文）',
    !!body && body.indexOf(one(p.html, /<meta property="og:site_name" content="([^"]*)"/)) === 0,
    JSON.stringify(String(body).slice(0, 20)));
});

/* ------------------------------------------------------------------ *
 * 四、HowTo 与可见四步一致
 * ------------------------------------------------------------------ */

head('四、HowTo 结构化数据与页面上看得见的四步逐条一致');
pages.forEach((p) => {
  const tag = p.loc.tag;
  const block = (p.html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/) || [])[1];
  let graph = [];
  try { graph = (JSON.parse(block) || {})['@graph'] || []; } catch (e) { /* 下面会红 */ }
  const howto = graph.filter((n) => n['@type'] === 'HowTo')[0];
  const visible = all(p.html, /<h3 class="step-title">([\s\S]*?)<\/h3>/);
  check('[' + tag + '] JSON-LD 里有 HowTo', !!howto);
  if (!howto) return;
  const names = (howto.step || []).map((s) => String(s.name || '').trim());
  check('[' + tag + '] HowTo 的步骤数与可见步骤数一致（' + visible.length + '）',
    names.length === visible.length, '标记 ' + names.length + ' 条');
  check('[' + tag + '] HowTo 的步骤与可见步骤逐条一致',
    names.length === visible.length && names.every((n, i) => n === visible[i]),
    '标记 ' + names.join('/') + ' vs 页面 ' + visible.join('/'));
  check('[' + tag + '] HowTo 有 @id 与 inLanguage',
    !!howto['@id'] && !!howto.inLanguage, howto['@id'] + ' / ' + howto.inLanguage);
});

/* ------------------------------------------------------------------ *
 * 五、robots.txt 的 AI 爬虫
 * ------------------------------------------------------------------ */

head('五、robots.txt：AI 爬虫逐条列明，且不和 noindex 打架');
const robots = fs.readFileSync(path.join(PUBLIC, 'robots.txt'), 'utf8');
const missingBots = AI_BOTS.filter((b) => !new RegExp('^User-agent:\\s*' + b + '\\s*$', 'im').test(robots));
check('robots.txt 点名了全部 ' + AI_BOTS.length + ' 个常见 AI 爬虫',
  missingBots.length === 0, missingBots.length ? '漏 ' + missingBots.join(', ') : '');

/* 每个爬虫后面必须紧跟 Allow: /。
   只写 User-agent 不写规则的话，那一组是空的 —— 有的解析器会把它
   并进上一个组，结果**继承上一组的规则**，那就不是「允许」了。 */
const botBlocks = robots.split(/^User-agent:/m).slice(1);
const noAllow = botBlocks
  .map((b) => ({ ua: b.split('\n')[0].trim(), body: b }))
  .filter((x) => AI_BOTS.indexOf(x.ua) !== -1 && !/^\s*Allow:\s*\/\s*$/m.test(x.body));
check('每个 AI 爬虫都显式写了 Allow: /', noAllow.length === 0,
  noAllow.map((x) => x.ua).join(', '));

/* Disallow /login 或 /app.html 会和页面上的 noindex 打架：
   爬虫读不到 noindex，那两个地址反而可能以「无标题无摘要」进结果。 */
check('robots.txt 没有 Disallow /login（会和 noindex 打架）',
  !/^\s*Disallow:\s*\/login/m.test(robots));
check('robots.txt 没有 Disallow /app.html（会和 noindex 打架）',
  !/^\s*Disallow:\s*\/app\.html/m.test(robots));
check('robots.txt 仍然挡着 /api/', /^\s*Disallow:\s*\/api\//m.test(robots));
check('robots.txt 仍然指向 sitemap', /^Sitemap:\s*\S+/m.test(robots));

/* ------------------------------------------------------------------ *
 * 六、防陈旧
 * ------------------------------------------------------------------ */

head('六、llms.txt / llms-full.txt 是不是最新的（重新派生再逐字节比对）');
const built = MK.build();
let stale = 0;
built.forEach((r) => {
  r.files.forEach((f) => {
    const cur = fs.existsSync(f.path) ? fs.readFileSync(f.path, 'utf8') : null;
    if (cur !== f.body) {
      stale += 1;
      console.log('  ✗ ' + path.relative(ROOT, f.path).replace(/\\/g, '/')
        + (cur === null ? ' 不存在' : ' 与重新派生的结果不一致'));
    }
  });
});
check('全部 ' + built.reduce((n, r) => n + r.files.length, 0) + ' 份 llms 文件都与落地页同步',
  stale === 0, stale ? stale + ' 份陈旧，跑 node scripts/mk-llms.js' : '');
if (stale) fail += stale;

/* ------------------------------------------------------------------ */

console.log('\n' + '='.repeat(72));
if (fail) {
  console.log('✗ ' + fail + ' 条不过 / 共 ' + (pass + fail) + ' 条');
  process.exit(1);
}
console.log('全部通过 ✓  （' + pass + ' 条断言）');
