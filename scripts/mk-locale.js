'use strict';

/**
 * 语种文案包生成器
 * ==================================================================
 * 输入：`zh-Hans.js` 的**结构** + 一张「中文原文 → 译文」表
 * 输出：`public/assets/locales/<tag>.js`
 *
 * 为什么是「生成」而不是「照着抄一份改」：
 *
 *   文案包里有 1469 条中文，外加一堆**不能翻**的东西 —— 题目 id、`dim`、
 *   `group`、`multi` 开关、认字用的正则、正则的 flags。手抄一份的话，
 *   抄错一个 id 或漏一个 `multi: true` 都不会报错，只会让那个语种的
 *   多选规则、互斥关系、场景识别悄悄变形 —— 正是本项目最高频的失效类型。
 *
 *   生成器把这件事反过来：**结构只能来自 zh-Hans**，译文表里根本没有
 *   可以改结构的余地。再加一道 `skeleton()` 自检，生成前后骨架必须逐字节相同。
 *
 * 用法：
 *   node scripts/mk-locale.js en             生成（还缺译文就报错退出，不写文件）
 *   node scripts/mk-locale.js en --list      列出还缺哪些（按分节分组，人读）
 *   node scripts/mk-locale.js en --todo      把缺的串导成 _todo.json（按遍历顺序）
 *
 * 译文表放在 `scripts/i18n-src/<tag>/kb/*.json`，一个目录里可以有很多片
 * （按分节切），**目录里所有 .json 合并成一张表** —— 这样翻译可以分很多轮做，
 * 每轮加一片，不用改已经写好的部分。
 *
 * 键就是中文原文（和界面文案同一套约定）：查不到就说明没译，
 * 而不是回退成中文 —— 回退会让「漏译」变成看不见的事。
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const LOCALES_DIR = path.join(ROOT, 'public', 'assets', 'locales');
const SRC_FILE = path.join(LOCALES_DIR, 'zh-Hans.js');
const SRC_TAG = 'zh-Hans';

/** 判定「这条串是不是要翻」用的类，和 browser-check 第 12 节保持同一口径 */
const CJK = /[\u3000-\u303f\u4e00-\u9fff\uff01-\uff60]/;

/* ------------------------------------------------------------------ *
 * 读译文表
 * ------------------------------------------------------------------ */

/**
 * 读译文表。
 *
 * 分片文件是**扁平**的 `{ 中文原文: 译文 }`，唯一例外是保留键 `__byPath__`：
 *
 *   { "__byPath__": { "L.visualJoiner.video": ". " },
 *     "。": "。", ... }
 *
 * 为什么需要它：同一个中文串在不同位置可能要两种译法。
 * 真实例子 —— `。` 既是 `visualJoiner.video`（连接两句话 → 英文是 `'. '`），
 * 又是 `visualEnd.video`（句末符号 → 英文是 `'.'`）。扁平表里一个 key
 * 只能有一个值，两条必有一条译错，而且**不报错**。
 * 所以留一条按路径覆盖的通道，但只给这种真正冲突的少数条目用。
 *
 * ⚠️ 分片放在 `<tag>/kb/` 下面，**不是** `<tag>/` 下面。
 *    `<tag>/` 这一层是「一个语种」的目录，里面按文案包的**种类**再分：
 *      kb/     知识库（本文件）
 *      ui/     界面散句（mk-ui-locale.js）
 *      demos/  文本对照示例（mk-demos-locale.js）
 *    三类混在一个目录里的话，这个 `readdirSync` 会把界面译文也当成知识库译文，
 *    于是「一条中文两个译法」的冲突检测天天误报，而真正的冲突淹在里面。
 */
function loadMap(tag) {
  const dir = path.join(__dirname, 'i18n-src', tag, 'kb');
  if (!fs.existsSync(dir)) return { map: {}, byPath: {}, files: [] };
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json') && f[0] !== '_').sort();
  const map = {};
  const byPath = {};
  const dup = [];
  files.forEach((f) => {
    const chunk = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    Object.keys(chunk).forEach((k) => {
      if (k === '__byPath__') {
        Object.keys(chunk[k]).forEach((p) => {
          if (byPath[p] !== undefined && byPath[p] !== chunk[k][p]) {
            dup.push({ key: p, a: byPath[p], b: chunk[k][p], file: f });
          }
          byPath[p] = chunk[k][p];
        });
        return;
      }
      // 同一句在两个分片里各译一遍是允许的（分片之间难免重叠），
      // 但**译得不一样**必须报出来 —— 那种情况下谁生效取决于文件名顺序，
      // 属于「同一个输入两个输出」，最难查。
      if (map[k] !== undefined && map[k] !== chunk[k]) dup.push({ key: k, a: map[k], b: chunk[k], file: f });
      map[k] = chunk[k];
    });
  });
  return { map, byPath, files, dup };
}

/* ------------------------------------------------------------------ *
 * 结构自检：把「要翻的串」都抹成一个占位符，比骨架
 * ------------------------------------------------------------------ */

/**
 * 结构自检：src 和 out **按同一条路径一起下探**（lockstep），边走边验。
 *
 * 验四件事，全部必须与 zh-Hans 相同：
 *   1. 键集合（少一个 `multi` 或 `group` 就是规则变形）
 *   2. 数组长度（少一个选项）
 *   3. 值的类型
 *   4. **不含中文的串**（id / dim / group / flags / 纯符号）一个字都不许动
 *
 * 含中文的位置才抹成占位符 —— 那才是译文表有权改的地方。
 *
 * 为什么不能「各走各的、把结果 JSON 化再比字符串」（上一版的写法）：
 *   译文里常常没有中文（`简体中文` → `English`）。单独走 out 时那个位置
 *   不会被打成占位符，于是两边骨架永远不同 —— 这道自检会**假红**，
 *   而假红的自检比没有自检更糟：它会被当成噪音关掉。
 *   一起下探就没有这个问题：抹不抹只看 src。
 *
 * `skip` 是 `__byPath__` 里出现过的路径，加上 `L.tag` —— 那些位置是**故意**
 * 按语种改的（正则 flags：中文只需要给 `hasAudio` 加 `i`，英文每个都要加；
 * tag 就是语种本身），结构本来就该不一样。
 */
function shape(src, out, pathStr, skip, problems) {
  if (skip && skip.has(pathStr)) return '\u0002';
  if (src === null || out === null) {
    if (src !== out) problems.push(pathStr + '：' + JSON.stringify(src) + ' → ' + JSON.stringify(out));
    return src;
  }
  const st = typeof src;
  const ot = typeof out;
  if (st !== ot) { problems.push(pathStr + '：类型 ' + st + ' → ' + ot); return '\u0003'; }
  if (st === 'string') {
    if (CJK.test(src)) return '\u0001';
    if (src !== out) problems.push(pathStr + '：' + JSON.stringify(src) + ' → ' + JSON.stringify(out));
    return src;
  }
  if (st === 'number' || st === 'boolean') {
    if (src !== out) problems.push(pathStr + '：' + JSON.stringify(src) + ' → ' + JSON.stringify(out));
    return src;
  }
  if (Array.isArray(src)) {
    if (!Array.isArray(out)) { problems.push(pathStr + '：数组 → 非数组'); return '\u0003'; }
    if (src.length !== out.length) { problems.push(pathStr + '：长度 ' + src.length + ' → ' + out.length); return '\u0003'; }
    return src.map((x, i) => shape(x, out[i], pathStr + '[' + i + ']', skip, problems));
  }
  if (st === 'object') {
    const sk = Object.keys(src).sort();
    const ok = Object.keys(out).sort();
    if (sk.join('|') !== ok.join('|')) {
      problems.push(pathStr + '：键不同（' + sk.join(',') + ' ↔ ' + ok.join(',') + '）');
      return '\u0003';
    }
    const o = {};
    sk.forEach((k) => { o[k] = shape(src[k], out[k], pathStr + '.' + k, skip, problems); });
    return o;
  }
  return src;
}

/* ------------------------------------------------------------------ *
 * 重建：结构照抄 zh-Hans，只把中文串换掉
 * ------------------------------------------------------------------ */

function rebuild(v, pathStr, ctx) {
  // 按路径覆盖优先，**且对任意类型生效** —— 不只是字符串。
  // 真实用例：正则的 flags。中文的 extractFlags 只有 `video.hasAudio: 'i'`，
  // 英文每个 pattern 都要 `i`（extractSignals 是拿**原始大小写**的文本去 test 的，
  // 不区分大小写的话，句首大写的 "Wearing a red dress" 一条都匹配不上）。
  // 那种「整个子树按语种换一份」的改动，逐条给字符串写译文是表达不出来的。
  if (Object.prototype.hasOwnProperty.call(ctx.byPath, pathStr)) return ctx.byPath[pathStr];
  if (typeof v === 'string') {
    // 不含中文的一律原样 —— id / dim / group / flags / 纯符号连接符都是这类。
    // 于是「结构」和「文案」的分界线不靠人工登记，而是靠「有没有中文」，
    // 新增字段忘了登记也不会被翻错。
    if (!CJK.test(v)) return v;
    // 按路径覆盖优先（同一句中文在不同位置要两种译法时用，见 loadMap）
    const scoped = ctx.byPath[pathStr];
    if (scoped !== undefined) return scoped;
    const hit = ctx.map[v];
    if (hit === undefined) {
      ctx.missing.push({ path: pathStr, text: v });
      return v;
    }
    return hit;
  }
  if (Array.isArray(v)) return v.map((x, i) => rebuild(x, pathStr + '[' + i + ']', ctx));

  /* ⚠️ 正则必须**在这里拦下**，不能让它掉进下面的「对象」分支。
     正则的 typeof 是 'object'，而 Object.keys(/re/) 是 []，
     于是 rebuild 返回 {}，再被 JSON.stringify 固化成 {} —— 生成包里的正则
     就没了。更糟的是结构自检比的是「空对象 ↔ 空对象」，两边都是空，
     所以**一声不吭**：表现是推荐标记永远落在列表第一项上（详见 knowledge.js）。
     真正的原因是这条路径没有 __byPath__ 覆盖，所以报错要直接指出该补哪儿。 */
  if (v instanceof RegExp) {
    // 覆盖是按**路径精确匹配**的，而且在外层就命中（先查 byPath 再下探），
    // 所以建议补的是**这一节**（L.recommendRules），不是这一个叶子。
    const section = pathStr.split('[')[0].split('.').slice(0, 2).join('.');
    throw new Error(
      pathStr + ' 是正则，但没有 __byPath__ 覆盖。\n'
      + '  JSON.stringify(/re/) 会变成 {}，这条规则会静默失效（推荐标记落到第一项）。\n'
      + '  请在 scripts/i18n-src/<语种>/kb/*.json 的 __byPath__ 里补一整节：\n'
      + '    "' + section + '": { … 该语种自己的正则（写成 "/源/旗标" 字符串）… }');
  }

  if (v && typeof v === 'object') {
    const o = {};
    Object.keys(v).forEach((k) => { o[k] = rebuild(v[k], pathStr + '.' + k, ctx); });
    return o;
  }
  return v;
}

/** 按顶层分节统计，`--list` 时用来看「还剩哪几块」 */
function groupBySection(missing) {
  const g = new Map();
  missing.forEach((m) => {
    // 路径长这样：L.questions.intent.label / L.scenarios[3].keywords[2]
    const seg = m.path.replace(/^L\./, '').split('[')[0].split('.');
    const key = seg[0] === 'questions' ? 'questions.' + seg[1] : seg[0];
    if (!g.has(key)) g.set(key, []);
    g.get(key).push(m);
  });
  return g;
}

/* ------------------------------------------------------------------ *
 * 输出成 JS 源码
 * ------------------------------------------------------------------ */

function render(locale, tag) {
  return `'use strict';

/**
 * PromptLens 文案包 · ${tag}
 * ------------------------------------------------------------------
 * ⚠️ **这个文件是生成的，不要手改。**
 *    生成器：\`node scripts/mk-locale.js ${tag}\`
 *    译文表：\`scripts/i18n-src/${tag}/kb/*.json\`
 *
 * 结构（题目 id / dim / 互斥组 / multi 开关 / 认字正则 / flags）全部照抄
 * \`zh-Hans.js\`，生成前后会用结构自检比对 —— 手改这里会被下一次生成覆盖，
 * 而且很容易把某个 \`multi: true\` 改没，那种错不报错、只是规则变形。
 *
 * 文案包必须整体包 IIFE：它和 knowledge.js 都是普通脚本，
 * 顶层 const 共用同一个全局词法作用域，裸写会 SyntaxError 且整页 JS 全挂。
 */

(function (root) {
  const locale = ${JSON.stringify(locale, null, 2)};

  root.PromptLensLocales = root.PromptLensLocales || {};
  root.PromptLensLocales['${tag}'] = locale;
  if (typeof module !== 'undefined' && module.exports) module.exports = locale;
})(typeof globalThis !== 'undefined' ? globalThis : this);
`;
}

/* ------------------------------------------------------------------ */

function main() {
  const tag = process.argv[2];
  const mode = process.argv[3] || '';
  if (!tag || tag === SRC_TAG) {
    console.error('用法：node scripts/mk-locale.js <tag> [--list|--todo]');
    console.error('  <tag> 是目标语种，比如 en / ja / ko / es / zh-Hant');
    process.exit(2);
  }

  const SRC = require(SRC_FILE);
  const { map, byPath, files, dup } = loadMap(tag);

  if (dup && dup.length) {
    console.error('✗ 有 ' + dup.length + ' 条译文在分片之间**不一致**：');
    dup.slice(0, 10).forEach((d) => {
      console.error('  · ' + JSON.stringify(d.key));
      console.error('      ' + JSON.stringify(d.a) + '   ←→   ' + JSON.stringify(d.b) + '（' + d.file + '）');
    });
    console.error('  同一条输入两个输出，谁生效取决于文件名顺序 —— 必须改到一致。');
    process.exit(1);
  }

  const ctx = { map, byPath, missing: [] };
  const out = rebuild(SRC, 'L', ctx);
  out.tag = tag;   // tag 是 ASCII，rebuild 不会动它，这里显式覆盖

  const groups = groupBySection(ctx.missing);

  if (mode === '--list' || mode === '--todo') {
    const uniq = Array.from(new Set(ctx.missing.map((m) => m.text)));
    console.log('译文分片：' + (files.length ? files.join(', ') : '（还没有）'));
    console.log('还缺 ' + uniq.length + ' 条（去重后，共 ' + ctx.missing.length + ' 处引用）\n');
    Array.from(groups.entries()).sort((a, b) => b[1].length - a[1].length).forEach(([k, v]) => {
      console.log('  ' + k.padEnd(22) + v.length + ' 条');
    });
    if (mode === '--todo') {
      // 按分节拆成多个文件，而不是一个大 JSON。
      // 理由：翻译是**一轮做不完**的活，拆开之后每轮只读自己要做的那一块
      // （`_todo/questions.img.json` 就是「这一轮要译的 306 条」），
      // 不用把 1469 条全塞进上下文再挑。
      const dir = path.join(__dirname, 'i18n-src', tag, 'kb', '_todo');
      fs.mkdirSync(dir, { recursive: true });
      fs.readdirSync(dir).forEach((f) => fs.unlinkSync(path.join(dir, f)));
      let files2 = 0;
      Array.from(groups.entries()).forEach(([k, v]) => {
        const uniq = Array.from(new Set(v.map((m) => m.text)));
        fs.writeFileSync(path.join(dir, k + '.json'), JSON.stringify(uniq, null, 2) + '\n');
        files2 += 1;
      });
      console.log('\n已写出 scripts/i18n-src/' + tag + '/kb/_todo/（' + files2 + ' 个分节文件）');
      console.log('译完的文件放到上一级目录（scripts/i18n-src/' + tag + '/kb/）就会被合并 ——');
      console.log('`_` 开头的文件/目录一律忽略，所以待译清单不会自己被当成译文表。');
    } else {
      console.log('\n逐条：');
      ctx.missing.slice(0, 40).forEach((m) => console.log('  ' + m.path + '  ' + JSON.stringify(m.text)));
      if (ctx.missing.length > 40) console.log('  …还有 ' + (ctx.missing.length - 40) + ' 条（用 --todo 导出全部）');
    }
    return;
  }

  if (ctx.missing.length) {
    const uniq = Array.from(new Set(ctx.missing.map((m) => m.text)));
    console.error('✗ 还缺 ' + uniq.length + ' 条译文（去重后），**不写文件** ——');
    console.error('  半个语种的文案包比没有更糟：用户会看到中英混排。');
    Array.from(groups.entries()).sort((a, b) => b[1].length - a[1].length).forEach(([k, v]) => {
      console.error('    ' + k.padEnd(22) + v.length + ' 条');
    });
    console.error('  跑 `--todo` 导出待译清单，译完放进 scripts/i18n-src/' + tag + '/kb/ 再跑一次。');
    process.exit(1);
  }

  // 结构自检：两边按同一条路径下探，键 / 数组长度 / 类型 / 不含中文的串
  // 都必须与 zh-Hans 完全一致。这一条挡的是**生成器自己的 bug**，也挡
  // 「译文表越权改结构」—— 结构不可能来自译文表，真出现了就是这里有洞。
  const skip = new Set(Object.keys(byPath));
  skip.add('L.tag');   // tag 就是语种本身，本来就不该一样
  const problems = [];
  shape(SRC, out, 'L', skip, problems);
  if (problems.length) {
    console.error('✗ 结构自检不通过：生成前后结构不一致，**不写文件**。');
    console.error('  结构只该来自 zh-Hans.js，译文表没有改结构的能力。');
    problems.slice(0, 12).forEach((p) => console.error('  · ' + p));
    if (problems.length > 12) console.error('  …还有 ' + (problems.length - 12) + ' 处');
    process.exit(1);
  }

  const target = path.join(LOCALES_DIR, tag + '.js');
  const body = render(out, tag);
  fs.writeFileSync(target, body);
  console.log('✓ 已生成 public/assets/locales/' + tag + '.js');
  console.log('  译文分片：' + files.length + ' 个，共 ' + Object.keys(map).length + ' 条');
  console.log('  结构自检通过（键 / 长度 / 类型 / 不含中文的串均等同 zh-Hans）');
  console.log('  下一步：把 i18n.js 的 LOCALES 里 ' + tag + ' 的 ready 改成 true，');
  console.log('          再跑 `node scripts/check-locale-parity.js --locale ' + tag + '`。');
}

main();
