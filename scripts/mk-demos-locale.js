'use strict';

/**
 * 文本对照示例的文案包生成器
 * ==================================================================
 * 输入：`demos.js` 里的 `TEXT`（题目 id → { before, opts }）+ 一张同形状的译文表
 * 输出：`public/assets/locales/demos.<tag>.js`
 *
 * 这里的 key 是**题目 / 选项 id**（与语种无关），和界面文案那套「拿中文当 key」
 * 是两套规矩，理由不同：这批数据本来就是结构化的，id 才是它的身份。
 * 好处是源码改了中文示例，这里不会「失联」；代价是**没有中文原文可查**，
 * 所以译文必须逐条对着 id 给，结构由生成器卡死。
 *
 * 为什么必须卡结构：
 *   示例是「同一个场景、只改这一条参数」的对照。少一条 `before`、
 *   或者某个选项 id 拼错了，界面上就是**那一格空着** ——
 *   对照实验缺了一半，比整块不显示更糟：用户会以为自己看错了。
 *
 * 用法：
 *   node scripts/mk-demos-locale.js en
 *   node scripts/mk-demos-locale.js en --list
 *   node scripts/mk-demos-locale.js en --todo
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const LOCALES_DIR = path.join(ROOT, 'public', 'assets', 'locales');
const SRC_FILE = path.join(ROOT, 'public', 'assets', 'js', 'demos.js');

/* ------------------------------------------------------------------ */

function loadTable(tag) {
  const dir = path.join(__dirname, 'i18n-src', tag, 'demos');
  if (!fs.existsSync(dir)) return { table: {}, files: [] };
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json') && f[0] !== '_').sort();
  const table = {};
  files.forEach((f) => {
    const chunk = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    Object.keys(chunk).forEach((qid) => {
      if (table[qid] && JSON.stringify(table[qid]) !== JSON.stringify(chunk[qid])) {
        console.error('✗ 题目 ' + qid + ' 在两个分片里不一致（' + f + '）');
        process.exit(1);
      }
      table[qid] = chunk[qid];
    });
  });
  return { table, files };
}

/**
 * 结构对账：译文表的 qid / 选项 id 集合必须和 `demos.js` 的 TEXT **完全一致**。
 * 返回问题清单（每条都能直接指出是哪个 id）。
 */
function diff(TEXT, table) {
  const problems = [];
  Object.keys(TEXT).forEach((qid) => {
    const src = TEXT[qid];
    const tr = table[qid];
    if (!tr) { problems.push('缺题目 ' + qid); return; }
    if (!!src.before !== !!tr.before) {
      problems.push(qid + '：before ' + (src.before ? '缺' : '多余'));
    }
    const a = Object.keys(src.opts || {}).sort();
    const b = Object.keys(tr.opts || {}).sort();
    a.filter((x) => b.indexOf(x) === -1).forEach((x) => problems.push(qid + '：缺选项 ' + x));
    b.filter((x) => a.indexOf(x) === -1).forEach((x) => problems.push(qid + '：选项 ' + x + ' 不存在'));
  });
  Object.keys(table).forEach((qid) => {
    if (!TEXT[qid]) problems.push('题目 ' + qid + ' 不存在');
  });
  return problems;
}

function render(pack, tag) {
  return `'use strict';

/**
 * PromptLens 文本对照示例 · ${tag}
 * ------------------------------------------------------------------
 * ⚠️ **这个文件是生成的，不要手改。**
 *    生成器：\`node scripts/mk-demos-locale.js ${tag}\`
 *    译文表：\`scripts/i18n-src/${tag}/demos/*.json\`
 *
 * 结构是 \`{ 题目id: { before, opts: { 选项id: 文本 } } }\`，
 * 题目 / 选项 id 与语种无关（和界面文案那套「中文当 key」不同）。
 * 生成时会和 demos.js 的 TEXT 逐 id 对账，少一条就不写文件 ——
 * 对照示例缺一半，比整块不显示更容易让人以为是自己看错了。
 *
 * 壳必须照抄：和 knowledge.js 都是普通脚本，顶层 const 共用同一个全局
 * 词法作用域，裸写会 SyntaxError 且整页 JS 全挂。
 */

(function (root) {

const PACK = ${JSON.stringify(pack, null, 2)};

root.PromptLensDemosText = root.PromptLensDemosText || {};
root.PromptLensDemosText['${tag}'] = PACK;

if (typeof module !== 'undefined' && module.exports) module.exports = PACK;

})(typeof globalThis !== 'undefined' ? globalThis : this);
`;
}

/* ------------------------------------------------------------------ */

function main() {
  const tag = process.argv[2];
  const mode = process.argv[3] || '';
  if (!tag || tag === 'zh-Hans') {
    console.error('用法：node scripts/mk-demos-locale.js <tag> [--list|--todo]');
    console.error('  zh-Hans 用 demos.js 里内置的那份，不需要生成。');
    process.exit(2);
  }

  globalThis.window = globalThis;
  const Demos = require(SRC_FILE);
  const TEXT = Demos.TEXT;
  const { table, files } = loadTable(tag);

  if (mode === '--list' || mode === '--todo') {
    const problems = diff(TEXT, table);
    const total = Object.keys(TEXT).reduce((n, q) => n + (TEXT[q].before ? 1 : 0) + Object.keys(TEXT[q].opts || {}).length, 0);
    console.log('译文分片：' + (files.length ? files.join(', ') : '（还没有）'));
    console.log('对照示例共 ' + Object.keys(TEXT).length + ' 题 / ' + total + ' 条文本，还缺 ' + problems.length + ' 条\n');
    problems.forEach((p) => console.log('  ' + p));
    if (mode === '--todo') {
      const dir = path.join(__dirname, 'i18n-src', tag, 'demos', '_todo');
      fs.mkdirSync(dir, { recursive: true });
      fs.readdirSync(dir).forEach((f) => fs.unlinkSync(path.join(dir, f)));
      fs.writeFileSync(path.join(dir, 'demos.json'), JSON.stringify(TEXT, null, 2) + '\n');
      console.log('\n已写出 scripts/i18n-src/' + tag + '/demos/_todo/demos.json');
      console.log('（形状和 demos.js 的 TEXT 一样，把每个字符串换成译文即可 —— id 一个都别动）');
    }
    return;
  }

  const problems = diff(TEXT, table);
  if (problems.length) {
    console.error('✗ 有 ' + problems.length + ' 处对不上，**不写文件**：');
    problems.slice(0, 20).forEach((p) => console.error('    ' + p));
    if (problems.length > 20) console.error('    …还有 ' + (problems.length - 20) + ' 处');
    console.error('  跑 `--todo` 导出模板，按 id 逐条填。');
    process.exit(1);
  }

  // 按 demos.js 的顺序写出去，方便和源码对读
  const pack = {};
  Object.keys(TEXT).forEach((qid) => {
    const tr = table[qid];
    const one = { before: tr.before };
    one.opts = {};
    Object.keys(TEXT[qid].opts || {}).forEach((oid) => { one.opts[oid] = tr.opts[oid]; });
    pack[qid] = one;
  });

  fs.writeFileSync(path.join(LOCALES_DIR, 'demos.' + tag + '.js'), render(pack, tag));
  console.log('✓ 已生成 public/assets/locales/demos.' + tag + '.js');
  console.log('  ' + Object.keys(pack).length + ' 题 / '
    + Object.keys(pack).reduce((n, q) => n + 1 + Object.keys(pack[q].opts).length, 0) + ' 条文本');
}

main();
