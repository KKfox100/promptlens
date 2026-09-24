'use strict';

/**
 * llms.txt / llms-full.txt 生成器
 * ==================================================================
 * 输出（每个语种两份）：
 *   public/llms.txt            + public/<tag>/llms.txt
 *   public/llms-full.txt       + public/<tag>/llms-full.txt
 *
 * llms.txt       —— 策划过的站点地图：H1 + 一句定义 + 分节链接 + 其他语言。
 * llms-full.txt  —— 整页正文的 Markdown 镜像，模型不用解析 HTML 就能读全文。
 *
 * ------------------------------------------------------------------
 * 为什么**全部从已烘好的 HTML 派生**，而不是另写一份文案
 * ------------------------------------------------------------------
 * 另写一份的话，它就是「第二个真相源」：落地页改了措辞，这里不会跟着变，
 * 而且**不会报错**。模型读到的和用户看到的从此各说各话，
 * 而这种错没有任何肉眼可查的迹象 —— 只有把两边拿出来对才知道。
 *
 * 派生还带来一个额外好处：这份文件的语种覆盖、语言名、节标题、
 * 定义句、FAQ 问句，全部跟着落地页走。加一个语种只需要重新跑一遍，
 * 不需要在这里补一张表（补表就又是一次「抄漏了不报错」的机会）。
 *
 * ⚠️ 因此它必须在 `mk-landing.js --all` **之后**跑。顺序反了不会报错，
 * 只会生成上一版的内容 —— 所以 `check-llmo.js` 会重新派生一遍再逐字节比对，
 * 陈旧会被当成失败。
 *
 * 用法：
 *   node scripts/mk-llms.js            生成全部
 *   node scripts/mk-llms.js --check    只比对不写盘（给断言用）
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
/* 变异测试跑在临时副本上，用 PL_PUBLIC_DIR 把根指过去。
   没有这个开关的话，对着落地页做的变异会「改坏了却全绿」——
   因为检查脚本读的还是真文件。 */
const PUBLIC = process.env.PL_PUBLIC_DIR || path.join(ROOT, 'public');
const ROOT_PAGE = path.join(PUBLIC, 'index.html');

/* ------------------------------------------------------------------ *
 * 从 HTML 里取值的小工具
 * ------------------------------------------------------------------ */

/** 去掉标签、把空白折成单空格 —— 取「一句话」用 */
const flat = (s) => String(s == null ? '' : s)
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const one = (html, re) => {
  const m = html.match(re);
  return m ? flat(m[1]) : null;
};

const all = (html, re) => {
  const out = [];
  let m;
  const r = new RegExp(re.source, re.flags.indexOf('g') === -1 ? re.flags + 'g' : re.flags);
  while ((m = r.exec(html)) !== null) out.push(flat(m[1]));
  return out;
};

/**
 * 语种表**从根页的切换器里读**，不在这里重抄一张。
 *
 * 重抄的后果和别处一样：加了语种只改了一处，另一处不报错、只是少一个语种。
 * 切换器是**真链接**（`href="zh-Hant/"` 这种相对路径），
 * 所以从它出发能直接推出每个语种页面在磁盘上的位置。
 */
function locales() {
  const root = fs.readFileSync(ROOT_PAGE, 'utf8');
  const sw = (root.match(/<nav class="lang-switch"[\s\S]*?<\/nav>/) || [''])[0];
  const out = [];
  const re = /<a class="lang-link[^"]*" href="([^"]*)" hreflang="([^"]*)"[^>]*>([^<]*)<\/a>/g;
  let m;
  while ((m = re.exec(sw)) !== null) {
    const href = m[1];
    out.push({
      tag: m[2],
      href,
      name: m[3].trim(),
      dir: href.replace(/^\.\//, '').replace(/\/$/, ''),
    });
  }
  return out;
}

const pageOf = (loc) => (loc.dir ? path.join(PUBLIC, loc.dir, 'index.html') : ROOT_PAGE);
const fileOf = (loc, name) => (loc.dir ? path.join(PUBLIC, loc.dir, name) : path.join(PUBLIC, name));

/* ------------------------------------------------------------------ *
 * HTML → Markdown
 * ------------------------------------------------------------------ */

const SKIP = new Set(['script', 'style', 'nav', 'footer', 'header', 'details', 'noscript', 'svg']);
/* 纯装饰、而且会和别处重复的元素：
   .step-num 就是列表序号（「01」），Markdown 的列表已经有序号了；
   .skip-link 是「跳到正文」的无障碍跳板。 */
const DECOR = /(^|\s)(step-num|skip-link|logo-mark)(\s|$)/;

function tokenize(html) {
  const toks = [];
  const re = /<!--[\s\S]*?-->|<\/?([a-zA-Z][\w-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>|[^<]+/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const t = m[0];
    if (t.slice(0, 4) === '<!--') continue;
    if (t[0] === '<') {
      const close = t[1] === '/';
      const name = (m[1] || '').toLowerCase();
      toks.push({ type: close ? 'close' : 'open', name, attrs: m[2] || '' });
    } else {
      toks.push({ type: 'text', text: t });
    }
  }
  return toks;
}

function tableToMd(tbl) {
  const rows = [];
  const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
  let m;
  while ((m = trRe.exec(tbl)) !== null) {
    const cells = [];
    const cellRe = /<(th|td)[^>]*>([\s\S]*?)<\/\1>/g;
    let c;
    while ((c = cellRe.exec(m[1])) !== null) cells.push(flat(c[2]).replace(/\|/g, '\\|'));
    if (cells.length) rows.push(cells);
  }
  if (!rows.length) return '';
  const head = rows[0];
  const body = rows.slice(1);
  const line = (cs) => '| ' + cs.join(' | ') + ' |';
  return [line(head), '| ' + head.map(() => '---').join(' | ') + ' |']
    .concat(body.map(line)).join('\n');
}

function toMarkdown(html, baseUrl) {
  /* 表格先整块摘出来换成占位符，最后再放回去。
     ⚠️ 这一步必须用占位符，不能在原地直接换成 Markdown ——
     下面处理文本节点时会把连续空白折成一个空格，
     而 Markdown 表格的换行**正是它的结构**，折完就变成一整行
     （第一次跑出来就是那样：三行数据粘成一条 500 字的线，看着像乱码）。
     和 mk-landing.js 的 dig() 是同一个套路。 */
  const tables = [];
  let s = String(html)
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<table[\s\S]*?<\/table>/gi, (t) => {
      tables.push(tableToMd(t));
      return '\u0000T' + (tables.length - 1) + '\u0000';
    });

  const toks = tokenize(s);
  let buf = '';
  const stack = [];
  let skip = 0;
  let olDepth = 0;
  /* 最近一次输出的标题层级。FAQ 的问句要挂在「常见问题」**下面一级**，
     写死成 ### 就会和节标题同级 —— 读起来像又开了一节，
     而不是这一节里的一问一答。 */
  let lastHead = 1;

  const push = (x) => { buf += x; };
  /* 只补「还不够」的那几个换行。写成「一律 push(n 个换行」的话，
     连续两个块级元素之间会攒出 4 个换行，靠最后那条 \n{3,} 兜底虽然也对，
     但列表项之间会多出空行（Markdown 会把它当成 loose list，渲染出 <p>）。 */
  const nl = (n) => {
    const want = n || 1;
    let have = 0;
    for (let k = buf.length - 1; k >= 0 && buf[k] === '\n'; k -= 1) have += 1;
    if (have < want) push('\n'.repeat(want - have));
  };

  for (let i = 0; i < toks.length; i += 1) {
    const t = toks[i];
    if (t.type === 'text') {
      if (skip) continue;
      const txt = t.text.replace(/\s+/g, ' ');
      if (!txt.trim()) {
        /* 纯空白：只在两侧都需要时才补一个空格。
           `<a>…</a>` 换行 `<a>…</a>` 之间就是这种 —— 丢掉它，
           两个链接会粘成 `][`，Markdown 解析不出来（实测过）。 */
        if (buf && !/\s$/.test(buf)) push(' ');
        continue;
      }
      /* 前导空白必须去掉：块级标签后面的文本节点是以「换行 + 缩进」开头的，
         而块级标签已经补过换行了。不去掉就会出现 `##  标题`（两个空格）
         和 `，  只是`（<br> 补的那个空格 + 前导空格，凑成两个）。 */
      push(/\s$/.test(buf) ? txt.replace(/^\s+/, '') : txt);
      continue;
    }
    const attrs = t.attrs || '';
    const cls = (attrs.match(/class="([^"]*)"/) || [])[1] || '';

    if (t.type === 'open') {
      if (SKIP.has(t.name) || DECOR.test(cls)) { skip += 1; stack.push(t.name); continue; }
      stack.push(t.name);
      if (skip) continue;

      if (/^h[1-6]$/.test(t.name)) {
        /* 标题**整体降一级**：这份文件自己的 H1 是站名（# PromptLens），
           页面里的 h1 若原样输出就会变成第二个 H1，很多解析器只认第一个。
           降一级之后是 # 站名 / ## 分节 / ### 步骤，三层结构清楚。 */

        lastHead = Number(t.name[1]) + 1;
        nl(2);
        push('#'.repeat(lastHead) + ' ');
      } else if (t.name === 'p') nl(2);
      /* <br> 一律当空格。它出现在标题里时（本页的 h1 就有一个），
         换成换行会把标题**截断成两行**，第二行成了正文 —— 第一次跑就是这样。
         Markdown 的标题里本来也放不下换行。 */
      else if (t.name === 'br') push(' ');
      else if (t.name === 'ol') { olDepth += 1; nl(2); }
      else if (t.name === 'ul') nl(2);
      else if (t.name === 'dl') nl(2);
      /* 问答对用「### 问题」+ 空行 + 答案，不用 dt/dd 的 `: ` 记法 ——
         那是 Pandoc 扩展，模型不一定认；而 ### 让每个问答成为可独立切块的一节。 */
      else if (t.name === 'dt') { nl(2); push('#'.repeat(lastHead + 1) + ' '); }
      else if (t.name === 'dd') nl(2);
      else if (t.name === 'blockquote') { nl(2); push('> '); }
      else if (t.name === 'li') {
        /* li 里如果带标题，就不打项目符号 —— 那种 li 是「一节」，
           打上 `- ` 会变成「- \n### 标题」这种断头行。
           实测：四步流程的每个 li 里都是一个 h3，按标题渲染读起来清楚得多。 */
        let hasHead = false;
        for (let j = i + 1; j < toks.length; j += 1) {
          if (toks[j].type === 'close' && toks[j].name === 'li') break;
          if (toks[j].type === 'open' && /^h[1-6]$/.test(toks[j].name)) { hasHead = true; break; }
        }
        if (hasHead) nl(2);
        else { nl(1); push(olDepth ? '1. ' : '- '); }
      } else if (t.name === 'em' || t.name === 'i') push('*');
      else if (t.name === 'strong' || t.name === 'b') push('**');
      else if (t.name === 'a') {
        /* 链接必须**绝对化**。生成页里的链接是相对的（`../login.html`），
           直接照抄的话，模型在 /en/llms-full.txt 这个位置上解析
           `login.html` 会得到 /en/login.html —— 而登录页在根目录，那是 404。
           绝对化用页面自己的 canonical 做基准，所以每个语种都对。 */
        let href = (attrs.match(/href="([^"]*)"/) || [])[1] || '';
        if (href && baseUrl) { try { href = new URL(href, baseUrl).href; } catch (e) { /* 保持原样 */ } }
        stack[stack.length - 1] = 'a\u0000' + href;
        push('[');
      }
      continue;
    }

    /* close */
    const open = stack.pop();
    if (skip) { skip -= 1; continue; }
    if (/^h[1-6]$/.test(t.name)) nl(2);
    else if (t.name === 'p') nl(2);
    else if (t.name === 'ol') { olDepth -= 1; nl(2); }
    else if (t.name === 'ul') nl(2);
    else if (t.name === 'dl') nl(2);
    else if (t.name === 'em' || t.name === 'i') push('*');
    else if (t.name === 'strong' || t.name === 'b') push('**');
    else if (t.name === 'a') {
      const href = String(open || '').split('\u0000')[1] || '';
      push('](' + href + ')');
    }
  }

  /* 占位符放回。表格前后各留一个空行，让它成为独立块。 */
  let md = buf.replace(/\u0000T(\d+)\u0000/g, (m, n) => '\n\n' + tables[Number(n)] + '\n\n');

  return md
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')   // 块首的空格也要去掉：块级标签后的文本节点以空白开头
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+|\s+$/g, '') + '\n';
}

/* ------------------------------------------------------------------ *
 * 派生一份 llms.txt
 * ------------------------------------------------------------------ */

function readPage(loc) {
  const html = fs.readFileSync(pageOf(loc), 'utf8');
  const canonical = (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1] || '';
  const main = (html.match(/<main id="main">([\s\S]*?)<\/main>/) || [])[1] || '';
  const sections = [];
  const secRe = /<section class="land-section" id="([^"]+)">([\s\S]*?)<\/section>/g;
  let m;
  while ((m = secRe.exec(main)) !== null) {
    const lede = (m[2].match(/<p class="land-lede">([\s\S]*?)<\/p>/) || [])[1];
    sections.push({
      id: m[1],
      title: one(m[2], /<h2[^>]*>([\s\S]*?)<\/h2>/),
      lede: lede ? flat(lede) : null,
    });
  }
  const sw = (html.match(/<nav class="lang-switch"[\s\S]*?<\/nav>/) || [''])[0];
  return {
    tag: loc.tag,
    dir: loc.dir,
    name: loc.name,
    canonical,
    siteName: one(html, /<meta property="og:site_name" content="([^"]*)"/) || 'PromptLens',
    definition: one(html, /<meta name="description" content="([^"]*)"/),
    langLabel: (sw.match(/aria-label="([^"]*)"/) || [])[1] || 'Language',
    sections,
    faq: all(html, /<dt>([\s\S]*?)<\/dt>/),
    steps: all(html, /<h3 class="step-title">([\s\S]*?)<\/h3>/),
    main,
  };
}

function buildLlmsTxt(page, pages) {
  const base = page.canonical;
  const L = [];
  L.push('# ' + page.siteName);
  L.push('');
  L.push('> ' + page.definition);
  L.push('');
  page.sections.forEach((s) => {
    L.push('## ' + s.title);
    L.push('- [' + s.title + '](' + base + '#' + s.id + ')' + (s.lede ? ': ' + s.lede : ''));
    if (s.id === 'faq' && page.faq.length) {
      page.faq.forEach((q) => L.push('- ' + q));
    }
    L.push('');
  });
  /* 其他语言。标题用页脚切换器的 aria-label —— 那个词已经在文案包里翻好了，
     在这里另写一句「其他语言」就等于又开一个真相源。 */
  const others = pages.filter((p) => p.tag !== page.tag);
  if (others.length) {
    L.push('## ' + page.langLabel);
    others.forEach((p) => L.push('- [' + p.name + '](' + p.canonical + ')'));
    L.push('');
  }
  L.push('## llms-full.txt');
  L.push('- [llms-full.txt](' + base + 'llms-full.txt)');
  L.push('');
  return L.join('\n');
}

function buildLlmsFull(page) {
  /* 链接以**本页自己的 canonical** 为基准绝对化 —— 用站点根地址的话，
     /en/ 这一页的 `../login.html` 会被解析成 /login.html（碰巧对），
     但 `#how` 会变成根页的锚点（错，应该指向 /en/#how）。
     用 canonical 做基准，每个语种都对。 */
  const md = toMarkdown(page.main, page.canonical);
  return '# ' + page.siteName + '\n\n> ' + page.definition + '\n\n' + md;
}

/* ------------------------------------------------------------------ *
 * 主流程
 * ------------------------------------------------------------------ */

function build() {
  const locs = locales();
  const pages = locs.map(readPage);
  return pages.map((p) => ({
    tag: p.tag,
    files: [
      { path: fileOf(locs.find((l) => l.tag === p.tag), 'llms.txt'), body: buildLlmsTxt(p, pages) },
      { path: fileOf(locs.find((l) => l.tag === p.tag), 'llms-full.txt'), body: buildLlmsFull(p) },
    ],
  }));
}

function main() {
  const checkOnly = process.argv.indexOf('--check') !== -1;
  const built = build();
  let stale = 0;
  let n = 0;
  built.forEach((r) => {
    r.files.forEach((f) => {
      n += 1;
      const cur = fs.existsSync(f.path) ? fs.readFileSync(f.path, 'utf8') : null;
      if (cur === f.body) return;
      if (checkOnly) {
        console.error('✗ ' + path.relative(ROOT, f.path).replace(/\\/g, '/')
          + (cur === null ? ' 不存在' : ' 与重新派生的结果不一致（陈旧）'));
        stale += 1;
        return;
      }
      fs.writeFileSync(f.path, f.body);
      console.log('✓ ' + path.relative(ROOT, f.path).replace(/\\/g, '/')
        + '  ' + Buffer.byteLength(f.body, 'utf8') + ' B');
    });
  });
  if (checkOnly) {
    if (stale) { console.error(stale + ' 份过期'); process.exit(1); }
    console.log('全部 ' + n + ' 份都是最新的 ✓');
    return;
  }
  console.log('共写出 ' + n + ' 份 ✓');
}

if (require.main === module) main();

module.exports = { build, toMarkdown, locales };
