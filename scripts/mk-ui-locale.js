'use strict';

/**
 * 界面文案包生成器
 * ==================================================================
 * 输入：`scripts/i18n-src/_ui-keys.json`（界面到底问了哪些 key，浏览器出的）
 *      + `public/assets/locales/ui.zh-Hans.js`（ASCII key 的权威清单）
 *      + `scripts/i18n-src/<tag>/ui/*.json`（一张「中文原文 → 译文」表）
 * 输出：`public/assets/locales/ui.<tag>.js`
 *
 * 为什么界面文案也要「生成」而不是手写一份：
 *   界面文案是**以中文原文为 key** 的（见 assets/js/i18n.js）。手写一份
 *   `ui.en.js` 时，key 是照着源码抄的 —— 抄错一个标点，那条就永远查不到，
 *   界面**静默回退成中文**，而且没有任何东西会报错。生成器把这件事反过来：
 *   key 只能来自「运行时真的问过的那份清单」，人只提供译文，碰不到 key。
 *
 * 清单为什么必须是**运行时**的（见 browser-check.js 第 12 节）：
 *   HTML 上 `data-i18n`（不写值）的 key 是元素的文字，静态扫描看不见；
 *   JS 里的 key 有拼出来的、有写在模板字符串里的，正则扫容易多也容易漏。
 *
 * 用法：
 *   node scripts/mk-ui-locale.js en           生成（缺译文就报错退出，不写文件）
 *   node scripts/mk-ui-locale.js en --list    列出还缺哪些
 *   node scripts/mk-ui-locale.js en --todo    把缺的导成 _todo/（按来源文件分组）
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const LOCALES_DIR = path.join(ROOT, 'public', 'assets', 'locales');
const KEYS_FILE = path.join(__dirname, 'i18n-src', '_ui-keys.json');
const SRC_FILE = path.join(LOCALES_DIR, 'ui.zh-Hans.js');
const SRC_TAG = 'zh-Hans';

const CJK = /[\u3000-\u303f\u4e00-\u9fff\uff01-\uff60]/;

/* ------------------------------------------------------------------ */

/**
 * 要翻的 key = 三份来源的**并集**：
 *
 *   ① 运行时清单 `_ui-keys.json`（浏览器跑六个界面跑出来的）
 *      —— 覆盖 HTML 上的 `data-i18n`（不写值时 key 是元素的文字，静态看不见）
 *      和任何拼出来的 key。
 *   ② 静态扫描 `public/*.html` 与 `public/assets/js/*.js` 里的 `t('…')` 字面量
 *      —— 覆盖**运行时没走到的分支**。
 *      真实例子：`t('<div class="improve-item"><div class="i-label">你的原始描述已经相当完整</div></div>')`
 *      只在「原始描述已经够完整」时才渲染，正常流程永远走不到 ——
 *      只靠 ①，这一条就永远停在中文，而所有检查都是绿的。
 *   ③ `ui.zh-Hans.js` 里**不含中文**的那些 key（`unit.score` 这种）
 *      —— 它们没法拿中文当 key，只能由 zh-Hans 包显式登记。
 *
 * 为什么 ① 和 ② 都要、而不是二选一：
 *   只有 ② → HTML 的 `data-i18n` 全漏；只有 ① → 没走到的分支全漏。
 *   两份并起来才是完整的，而且两份**各自都能被证伪**：
 *   ① 少了，说明有分支没扫到（补扫描流程）；② 少了，说明 key 不是字面量（要单独登记）。
 */
function requiredKeys() {
  if (!fs.existsSync(KEYS_FILE)) {
    console.error('✗ 找不到 ' + path.relative(ROOT, KEYS_FILE) + '。');
    console.error('  这份清单由浏览器跑出来（scripts/browser-check.js 第 12 节）——');
    console.error('  先跑一遍 `node scripts/browser-check.js`，别手写一份。');
    process.exit(2);
  }
  const dump = JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8'));
  const runtime = (dump.keys || []).filter((k) => CJK.test(k));
  const literal = scanLiterals();
  const zh = require(SRC_FILE);
  const ascii = Object.keys(zh.ui || {}).filter((k) => !CJK.test(k));

  const all = new Set();
  runtime.forEach((k) => all.add(k));
  literal.forEach((k) => all.add(k));
  ascii.forEach((k) => all.add(k));

  // 把「谁发现的」记下来，报错时能说清楚是哪种漏法
  const src = {};
  runtime.forEach((k) => { src[k] = 'runtime'; });
  literal.forEach((k) => { if (src[k] !== 'runtime') src[k] = 'literal'; });
  ascii.forEach((k) => { if (!src[k]) src[k] = 'zh-Hans'; });

  return { keys: Array.from(all).sort(), src, runtime, literal };
}

/* ------------------------------------------------------------------ *
 * 静态扫描：把 `t('…')` 的字面量取出来
 * ------------------------------------------------------------------ */

/** 跳过空白后读一个字面量；不是字面量（变量、模板插值）就返回 null */
function readLiteral(s, i) {
  while (i < s.length && /\s/.test(s[i])) i += 1;
  const q = s[i];
  if (q !== "'" && q !== '"' && q !== '`') return null;
  let out = '';
  i += 1;
  while (i < s.length) {
    const c = s[i];
    if (c === '\\') {
      const n = s[i + 1];
      out += n === 'n' ? '\n' : n === 't' ? '\t' : n === 'r' ? '\r' : n;
      i += 2;
      continue;
    }
    if (c === q) return out;
    // 带 ${} 的模板不是静态 key —— 那种 key 只能靠运行时清单
    if (q === '`' && c === '$' && s[i + 1] === '{') return null;
    if (q !== '`' && c === '\n') return null;   // 单引号字符串跨行 = 扫描器跑偏了
    out += c;
    i += 1;
  }
  return null;
}

function scanLiterals() {
  const out = new Set();
  const targets = [];
  const pub = path.join(ROOT, 'public');
  fs.readdirSync(pub).filter((f) => f.endsWith('.html'))
    .forEach((f) => targets.push(path.join(pub, f)));
  const jsDir = path.join(pub, 'assets', 'js');
  fs.readdirSync(jsDir).filter((f) => f.endsWith('.js'))
    .forEach((f) => targets.push(path.join(jsDir, f)));

  targets.forEach((file) => {
    const src = fs.readFileSync(file, 'utf8');
    /* 前面不能是标识符字符或 `.` —— 否则 `K.t(` / `foo_t(` 也会被算进来。
       ⚠️ 大小写都要认：`login.html` 用的是 `var T = I18n.t;` 这个**别名**，
       14 处 `T('…')` 全是界面文案。只认小写 t 的话这些 key 一条都进不来，
       而它们恰好又都在「跑一遍流程也走不到」的分支上 ——
       切到注册标签的标题、空表单提交的错误提示、处理中的转圈文案 ——
       第 12 节（运行时清单）同样扫不到。两头都漏 = 登录页整页停在中文。
       全仓确认过：只有 login.html 用这个别名（14 处），不会误伤。 */
    const re = /(^|[^\w$.])[tT]\(/g;
    let m;
    while ((m = re.exec(src))) {
      const lit = readLiteral(src, m.index + m[0].length);
      if (lit && CJK.test(lit)) out.add(lit);
    }
  });
  return out;
}

function loadMap(tag) {
  const dir = path.join(__dirname, 'i18n-src', tag, 'ui');
  if (!fs.existsSync(dir)) return { map: {}, files: [], dup: [] };
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json') && f[0] !== '_').sort();
  const map = {};
  const dup = [];
  files.forEach((f) => {
    const chunk = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    Object.keys(chunk).forEach((k) => {
      if (k === '__byPath__') return;   // 界面文案是扁平表，没有按路径覆盖的需要
      if (map[k] !== undefined && map[k] !== chunk[k]) {
        dup.push({ key: k, a: map[k], b: chunk[k], file: f });
      }
      map[k] = chunk[k];
    });
  });
  return { map, files, dup };
}

function render(ui, tag) {
  return `'use strict';

/**
 * PromptLens 界面文案包 · ${tag}
 * ------------------------------------------------------------------
 * ⚠️ **这个文件是生成的，不要手改。**
 *    生成器：\`node scripts/mk-ui-locale.js ${tag}\`
 *    译文表：\`scripts/i18n-src/${tag}/ui/*.json\`
 *    key 清单：\`scripts/i18n-src/_ui-keys.json\`（浏览器跑出来的）
 *
 * key 就是中文原文。查不到会**原样输出 key** —— 对简体来说这是对的
 * （HTML 里写的中文本身就是文案），对别的语种来说就是「漏翻，界面上一句中文」。
 * 所以生成器宁可缺一条就整个不写文件，也不肯写出半份。
 *
 * 壳必须照抄：和 knowledge.js 都是普通脚本，顶层 const 共用同一个全局
 * 词法作用域，裸写会 SyntaxError 且整页 JS 全挂。
 */

(function (root) {

const UI = ${JSON.stringify(ui, null, 2)};

const locale = {
  tag: '${tag}',
  name: ${JSON.stringify(tag)},
  ui: UI,
};

root.PromptLensUi = root.PromptLensUi || {};
root.PromptLensUi['${tag}'] = locale.ui;

if (typeof module !== 'undefined' && module.exports) module.exports = locale;

})(typeof globalThis !== 'undefined' ? globalThis : this);
`;
}

/* ------------------------------------------------------------------ */

function main() {
  const tag = process.argv[2];
  const mode = process.argv[3] || '';
  if (!tag || tag === SRC_TAG) {
    console.error('用法：node scripts/mk-ui-locale.js <tag> [--list|--todo]');
    process.exit(2);
  }

  const { keys: need, src: keySrc, runtime, literal } = requiredKeys();
  const { map, files, dup } = loadMap(tag);

  if (dup.length) {
    console.error('✗ 有 ' + dup.length + ' 条译文在分片之间**不一致**：');
    dup.slice(0, 10).forEach((d) => {
      console.error('  · ' + JSON.stringify(d.key));
      console.error('      ' + JSON.stringify(d.a) + '   ←→   ' + JSON.stringify(d.b) + '（' + d.file + '）');
    });
    process.exit(1);
  }

  const missing = need.filter((k) => map[k] === undefined);
  // 译文表里有、但界面从来没问过的 key。
  // 几乎总是一个**危险信号**：源码里的中文被改了，译文却还挂在那儿 ——
  // 那条译文永远不会生效，界面静默回退成中文。列出来让人去核对。
  //
  // ⚠️ 但只有**运行时清单在位**时这个判断才成立。
  //    运行时清单是空的（浏览器那一步没跑、或者跑挂了）时，
  //    HTML 上那批 `data-i18n` 的 key 一个都不在 need 里 ——
  //    于是它们全部被报成「过期」，四十多条噪音，真正过期的那条淹在里面。
  //    所以清单为空时**明说判断不了**，不要给一份看起来很像结论的清单。
  const canJudgeStale = runtime.length > 0;
  const stale = canJudgeStale
    ? Object.keys(map).filter((k) => need.indexOf(k) === -1)
    : [];

  if (mode === '--list' || mode === '--todo') {
    console.log('译文分片：' + (files.length ? files.join(', ') : '（还没有）'));
    console.log('界面 key 共 ' + need.length + ' 条'
      + '（运行时 ' + runtime.length + ' + 静态字面量 ' + literal.size + '，去重后）');
    console.log('还缺 ' + missing.length + ' 条\n');
    missing.forEach((k) => console.log('  [' + keySrc[k] + '] ' + JSON.stringify(k)));
    if (stale.length) {
      console.log('\n⚠️ 译文表里有 ' + stale.length + ' 条界面从来没问过（多半是源码改了中文）：');
      stale.slice(0, 20).forEach((k) => console.log('  ' + JSON.stringify(k) + ' → ' + JSON.stringify(map[k])));
    }
    if (mode === '--todo') {
      const dir = path.join(__dirname, 'i18n-src', tag, 'ui', '_todo');
      fs.mkdirSync(dir, { recursive: true });
      fs.readdirSync(dir).forEach((f) => fs.unlinkSync(path.join(dir, f)));
      fs.writeFileSync(path.join(dir, 'ui.json'), JSON.stringify(missing, null, 2) + '\n');
      console.log('\n已写出 scripts/i18n-src/' + tag + '/ui/_todo/ui.json（' + missing.length + ' 条）');
    }
    return;
  }

  if (missing.length) {
    console.error('✗ 还缺 ' + missing.length + ' 条界面译文，**不写文件** ——');
    console.error('  界面文案漏一条就是一句话停在中文，比知识库漏一条显眼得多。');
    missing.slice(0, 15).forEach((k) => console.error('    ' + JSON.stringify(k)));
    if (missing.length > 15) console.error('    …还有 ' + (missing.length - 15) + ' 条');
    console.error('  跑 `--todo` 导出清单，译完放进 scripts/i18n-src/' + tag + '/ui/ 再跑一次。');
    process.exit(1);
  }

  // 只把**界面真的会问的** key 写进去。多余的译文一律不写 ——
  // 写进去就成了「第二份真相」，源码改中文时它会继续挂在那儿骗人。
  const ui = {};
  need.forEach((k) => { ui[k] = map[k]; });

  fs.writeFileSync(path.join(LOCALES_DIR, 'ui.' + tag + '.js'), render(ui, tag));
  console.log('✓ 已生成 public/assets/locales/ui.' + tag + '.js');
  console.log('  界面 key ' + need.length + ' 条，译文分片 ' + files.length + ' 个');
  if (stale.length) {
    console.log('  ⚠️ 有 ' + stale.length + ' 条译文没被采用（界面没问过）—— 核对一下是不是源码改了中文：');
    stale.slice(0, 10).forEach((k) => console.log('      ' + JSON.stringify(k)));
  }
}

main();
