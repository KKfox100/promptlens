'use strict';

/**
 * 变异锚点的**静态**预检：不跑浏览器、不跑测试，只确认每条 `from` 在目标文件里
 * **恰好命中一次**。
 *
 * 为什么要有这个脚本：`mutation-check-ui.js` 一轮 40 分钟，而它最容易失败的方式
 * 不是「变异没被抓到」，而是「锚点找不到」—— 报错只写「命中 0 次」，
 * 你得等 40 分钟才知道，然后回去逐字对齐。
 * 锚点失配是**必然**会发生的：任何一次给源码接 i18n、挪一节、改一行注释，
 * 都可能让某条 `from` 变成 0 次命中或 2 次命中（09-22 那轮一次性过期 5 条）。
 *
 * 判据（三条，缺一不可）：
 *   1. 目标文件存在；
 *   2. `from` 命中 **1** 次 —— 0 次是「锚点过期」，≥2 次是「改错地方的风险」
 *      （`Edit`/`replace` 只会改第一处，你以为在测 A，其实改的是 B）；
 *   3. `from !== to` —— 否则这条变异什么都没改，测试当然还是绿的，
 *      于是这条变异**永远通过**（比失败更危险）。
 *
 * ⚠️ 这个脚本只查「锚点还在不在」，**不查「变异会不会被抓到」**。
 * 后者只有真跑一遍才知道，见 `topics/testing.md`。
 *
 * 用法：
 *   node scripts/check-mutation-anchors.js            # 两个变异脚本都查
 *   node scripts/check-mutation-anchors.js ui         # 只查界面那套
 *   node scripts/check-mutation-anchors.js engine     # 只查引擎那套
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');

/* 两个变异脚本的「文件常量」不一样，各自的 file 也按各自的基准解析：
     · mutation-check-ui.js  —— file 是相对 ROOT 的路径（public/...），
       因为它在 public/ 的**镜像副本**上改；
     · mutation-check.js     —— file 是相对 js 目录 / locales 目录 / public 的，
       因为它在 js 目录的副本上改（PUB() 帮忙拼成「相对 js 目录」的形式）。
   所以下面给每个脚本一套「按顺序试这些前缀」的解析链。 */
const TARGETS = [
  {
    key: 'ui',
    script: 'scripts/mutation-check-ui.js',
    bases: ['.'],
  },
  {
    key: 'engine',
    script: 'scripts/mutation-check.js',
    bases: ['public/assets/js', 'public/assets', 'public', '.'],
  },
];

/** 从变异脚本里把 MUTATIONS 数组字面量抠出来求值。
 *  两个脚本的数组都以行首 `];` 收尾，所以按这个标记截，比配括号稳
 *  （数组里既有字符串里的 `[`，也有正则里的 `[`）。 */
function loadMutations(scriptPath, bases) {
  const text = fs.readFileSync(scriptPath, 'utf8');
  const start = text.indexOf('const MUTATIONS = [');
  if (start < 0) throw new Error('没找到 MUTATIONS 数组：' + scriptPath);
  const end = text.indexOf('\n];', start);
  if (end < 0) throw new Error('没找到数组结束标记 `\\n];`：' + scriptPath);
  const literal = text.slice(start + 'const MUTATIONS = '.length, end + 2);

  /* 把脚本里的文件常量喂进沙箱，数组字面量才能求值。
     多余的名字无害，所以两套常量一起给。 */
  const sandbox = {
    CSS: 'public/assets/css/main.css',
    LANDING: 'public/index.html',
    APP: 'public/app.html',
    WORKSPACE: 'public/assets/js/workspace.js',
    KNOWLEDGE: 'knowledge.js',
    ENGINE: 'engine.js',
    SERVER: 'server.js',
    LOCALE: path.join('..', 'locales', 'zh-Hans.js'),
    PUB: (...p) => path.join('..', 'public', ...p),
    path,
  };
  return { list: vm.runInNewContext(literal, sandbox, { filename: scriptPath }), bases };
}

/** 把 file 解析成一个真实存在的路径（按 bases 顺序试）。 */
function resolveFile(file, bases) {
  for (const b of bases) {
    const p = path.join(ROOT, b, file);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function countOccurrences(haystack, needle) {
  if (!needle) return 0;
  let n = 0;
  let i = haystack.indexOf(needle);
  while (i !== -1) {
    n++;
    i = haystack.indexOf(needle, i + 1);
  }
  return n;
}

let bad = 0;
let total = 0;
const only = process.argv[2];

for (const t of TARGETS) {
  if (only && only !== t.key) continue;
  const scriptPath = path.join(ROOT, t.script);
  const { list } = loadMutations(scriptPath, t.bases);
  console.log('\n── ' + t.key + '：' + t.script + '（' + list.length + ' 条）');
  console.log('─'.repeat(72));

  /* 目标文件的内容只读一次，缓存住 —— 几十条变异往往落在同一两个文件上。 */
  const cache = new Map();

  list.forEach((m, i) => {
    total++;
    const label = String(i + 1).padStart(2) + '. ' + m.name;
    const p = resolveFile(m.file, t.bases);
    if (!p) {
      bad++;
      console.log('  ✗ ' + label);
      console.log('      → 目标文件不存在：' + m.file + '（试过 ' + t.bases.join(' / ') + '）');
      return;
    }
    if (m.from === m.to) {
      bad++;
      console.log('  ✗ ' + label);
      console.log('      → from 与 to 相同，这条变异什么都没改（它会永远"通过"）');
      return;
    }
    if (!cache.has(p)) cache.set(p, fs.readFileSync(p, 'utf8'));
    const src = cache.get(p);
    const n = countOccurrences(src, m.from);
    if (n === 1) {
      console.log('  ✓ ' + label);
    } else {
      bad++;
      console.log('  ✗ ' + label);
      console.log('      → ' + m.file + ' 里 `from` 命中 ' + n + ' 次'
        + (n === 0 ? '（锚点过期，多半是那一行被改过 / 被 i18n 抽走过）'
                   : '（≥2 次：replace 只改第一处，你以为在测 A，可能改的是 B）'));
    }
  });
}

console.log('\n' + '─'.repeat(72));
if (bad === 0) {
  console.log('锚点全部唯一命中 ✓ （共 ' + total + ' 条）');
  console.log('⚠️ 这只说明「改得动」。变异**会不会被断言抓到**，只有真跑一遍才知道。');
  process.exit(0);
} else {
  console.log(bad + ' 条锚点有问题（共 ' + total + ' 条）');
  process.exit(1);
}
