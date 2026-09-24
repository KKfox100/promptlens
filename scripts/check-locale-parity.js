'use strict';

/**
 * 跨语种 / 重构前后的**行为对比**。
 *
 * 为什么不用「文本抽取 + 逐字比对」来证明重构无损：
 *   那要先写一个能正确处理注释、字符串、正则字面量的 JS 扫描器 ——
 *   扫描器本身就会出错，而它出错的方式是「悄悄少抽一条」。
 *   行为对比不需要理解源码：同一批输入进去，结果逐字段一样，就是一样。
 *
 * 用法：
 *   node scripts/check-locale-parity.js --save   # 把当前结果存成基线
 *   node scripts/check-locale-parity.js          # 和基线比，不一致就退出码 1
 *   node scripts/check-locale-parity.js --locale en   # 指定语种
 *
 * 语种一致性也走这里：`--locale` 换一个语种跑同一批输入，
 * 「中文输入 → 文字场景」这类判断在每个语种下都必须成立（只是关键词不同）。
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SNAP = path.join(__dirname, '.snap', 'behavior.json');

const args = process.argv.slice(2);
const SAVE = args.indexOf('--save') !== -1;
const li = args.indexOf('--locale');
const LOCALE = li === -1 ? null : args[li + 1];

/* ------------------------------------------------------------------ *
 * 语种装载：先装 locale 包，再 require 知识库
 * ------------------------------------------------------------------ */

function loadKnowledge(localeTag) {
  const dir = path.join(ROOT, 'public', 'assets', 'locales');
  // 清掉 require 缓存，让每次换语种都重新装载
  Object.keys(require.cache).forEach((k) => { delete require.cache[k]; });
  globalThis.window = globalThis;
  globalThis.PromptLensLocales = {};
  globalThis.PromptLensActiveLocale = localeTag || undefined;
  if (localeTag && fs.existsSync(path.join(dir, localeTag + '.js'))) {
    require(path.join(dir, localeTag + '.js'));
  }
  return require(path.join(ROOT, 'public', 'assets', 'js', 'knowledge.js'));
}

/* ------------------------------------------------------------------ *
 * 同域装载检查：文案包少包一层 IIFE，Node 端全绿、浏览器里整页全挂
 * ------------------------------------------------------------------ *
 * 浏览器里文案包和 knowledge.js 是**同一个全局词法作用域**里的两个普通脚本。
 * 文案包裸写 `const CUES` 会和 knowledge.js 的 `const CUES` 撞车，
 * 报 `SyntaxError: Identifier 'CUES' has already been declared` ——
 * 于是**整页 JS 全挂**：工作台场景卡片一张都渲染不出来，登录页也进不去。
 *
 * 而 Node 的 `require` 给每个文件独立的模块作用域，**照不出来**：
 * test-engine / browser-check 的 Node 侧全绿，只有真浏览器会炸。
 *
 * `vm.runInThisContext` 就是「当普通脚本执行」的语义 ——
 * 已验：两次调用里同名顶层 const 会报 Identifier has already been declared。
 * 所以这里把所有文案包依次当脚本跑，最后跑一次 knowledge.js：
 * 谁没包 IIFE，就会在这里撞出来。
 *
 * 一次跑全部语种，所以将来加语种**自动**受检，不用改这里。
 */
function checkSameScope() {
  const vm = require('vm');
  const dir = path.join(ROOT, 'public', 'assets', 'locales');
  const bundles = fs.readdirSync(dir).filter((f) => /\.js$/.test(f)).sort();
  const run = (file) => vm.runInThisContext(fs.readFileSync(file, 'utf-8'), { filename: file });

  try {
    bundles.forEach((f) => run(path.join(dir, f)));
    run(path.join(ROOT, 'public', 'assets', 'js', 'knowledge.js'));
  } catch (e) {
    console.error('✗ 同域装载失败：' + e.message);
    console.error('');
    console.error('  文案包必须整体包一层 IIFE，只往外挂 PromptLensLocales：');
    console.error('    (function (root) { ...数据...');
    console.error('      root.PromptLensLocales[tag] = locale;');
    console.error('    })(typeof globalThis !== \'undefined\' ? globalThis : this);');
    console.error('');
    console.error('  不包的话，它的顶层 const 会和 knowledge.js 的撞车，');
    console.error('  浏览器里整页 JS 全挂 —— 而 Node 侧所有套件照样全绿。');
    process.exit(1);
  }
  return bundles.length;
}


/* ------------------------------------------------------------------ *
 * 输入语料：覆盖三条 family 的识别、线索提取、推荐、打分
 * ------------------------------------------------------------------ */

const CORPUS = [
  // 文字类
  '帮我写一篇关于远程办公的公众号文章，要给公司同事看的，2000 字左右',
  '写个周报，我这周做了三件事，语气正式一点，用表格',
  '你是资深产品经理，帮我分析一下这个功能该不该做，给出结论',
  '把这段话翻译成英文，不要改变原意，保持口语',
  '帮我总结这份会议纪要，列出待办事项，分点，每条不超过 20 字',
  '起个名字，要三个字的，有点古风，不要太俗',
  '解释一下什么是向量数据库，讲给完全不懂技术的人听',
  '写一封邮件，跟客户道歉，因为我们延期交付了，语气要诚恳',
  // 图片类
  '一只戴着宇航头盔的橘猫，坐在月球表面，背景是地球，写实风格',
  '画一张海报，赛博朋克风格的城市夜景，霓虹灯，雨后的街道，电影感',
  '生成一张产品图，香水瓶放在大理石台面上，柔光，极简，9:16 竖屏',
  '油画风格的山谷，黄金时刻，暖色调，宽幅',
  '给我画个头像，二次元，女孩，蓝色头发，微距特写',
  // 视频类
  '拍一段 15 秒的短视频，一个人走在雨夜的街道上，镜头跟着他，慢动作',
  '生成一段视频：无人机飞过雪山，日出，环绕运镜，配大提琴配乐',
  '做一个 30 秒的宣传片，多镜头，先远景再特写，一镜到底也行',
  '延时摄影，城市车流，夜景，需要背景音乐，不要人声',
  '拍个产品广告片，产品旋转，影棚光，5 秒',
  // 边界 / 兜底
  '你好',
  '',
  '随便写点什么',
  '猫',
  '一段很长的描述'.repeat(20),
];

/* ------------------------------------------------------------------ *
 * 结构指纹：**与语言无关**的那一半
 * ------------------------------------------------------------------ *
 * 语料采样有个大洞：detectScenario / extractSignals / scoreOriginalPrompt
 * 这三个函数**根本不碰 QUESTIONS**。而 QUESTIONS 是最大的一块数据
 * （51 道题、上千条 fragment），光靠行为采样是覆盖不到的。
 *
 * 所以这里单独取一份「骨架」指纹：题目 id、dim、互斥组、多选规则、
 * 选项 id 与顺序、每个选项**带了哪些字段**、流程顺序、评分项 key 与权重。
 * 这些跨语种必须**一模一样** —— 换了语言，题目结构不该跟着变。
 *
 * 只比「有没有」不比「写的什么」：fragment 的内容各语种不同，
 * 但「这道题的选项居然没有 fragment」是漏翻，必须抓出来。
 * 这也正是 test-engine.js 跨语种断言要用的东西。
 */
const TEXTY = ['label', 'hint', 'fragment', 'tags', 'desc', 'name'];

function structureOf(K) {
  const qs = Object.keys(K.QUESTIONS).map((qid) => {
    const q = K.QUESTIONS[qid];
    const opts = (q.options || []).map((o) => {
      const present = TEXTY.filter((k) => o[k] !== undefined).map((k) => k[0]).join('');
      const per = o.perScenario ? Object.keys(o.perScenario).sort().join('|') : '';
      const bits = [
        o.id,
        'g=' + JSON.stringify(o.group === undefined ? null : o.group),
        'w=' + (o.weight === undefined ? '-' : o.weight),
        'f=' + present,
        per ? 'per=' + per : '',
        o.followUps ? 'fu=' + o.followUps.join('|') : '',
        o.scenarios ? 'sc=' + o.scenarios.join('|') : '',
        o.demoKind ? 'dk=' + o.demoKind : '',
      ].filter(Boolean);
      return bits.join(',');
    });
    return [
      qid,
      'dim=' + (q.dim || '-'),
      'multi=' + (q.multi ? 1 : 0),
      'max=' + (q.maxPick === undefined ? '-' : q.maxPick),
      'type=' + (q.type || '-'),
      q.scenarios ? 'sc=' + q.scenarios.join('|') : '',
      'opts=' + opts.join(' ; '),
    ].filter(Boolean).join(' ');
  });

  // 其余语言相关的表：只取 key（和权重），不取文案
  const keysOf = (o) => Object.keys(o).join(',');
  const weights = (arr) => arr.map((i) => i.key + ':' + i.weight).join(',');

  return {
    questions: qs.join('\n'),
    scenarios: K.SCENARIOS.map((s) => s.id).join(','),
    sectionTitles: keysOf(K.SECTION_TITLES),
    shotContent: keysOf(K.SHOT_CONTENT),
    shotRole: keysOf(K.SHOT_ROLE),
    sectionExplain: keysOf(K.SECTION_EXPLAIN),
    /* 推荐规则只取**题目 id + 规则指向的选项 id**，不取正则本身 ——
       正则各语种本来就该不一样（那是翻译），取了就永远对不上。
       但 id 与条数跨语种必须一致：少一条、指错选项、整节丢了，都算结构变形。
       为什么这一节以前不在指纹里：它的值是**正则字面量**，生成语种被
       `JSON.stringify` 抹成 `{}` 之后，指纹两边都是空对象，比了等于没比。
       现在生成语种走 `__byPath__` 写字符串，指纹才真的有东西可比。 */
    recommendRules: Object.keys(K.RECOMMEND_RULES || {}).map(
      (q) => q + ':' + (K.RECOMMEND_RULES[q] || []).map((p) => p[0]).join('|')).join(' ; '),
    signalLabels: Object.keys(K.SIGNAL_LABELS).map(
      (f) => f + ':' + K.SIGNAL_LABELS[f].map((x) => x[0]).join('|')).join(' ; '),
    scoreItems: weights(K.SCORE_ITEMS) + ' / ' + weights(K.SCORE_ITEMS_IMAGE)
      + ' / ' + weights(K.SCORE_ITEMS_VIDEO),
    frameModes: K.FRAME_MODES.map(
      (m) => m.id + ':' + (m.slots || []).join('+') + (m.needPrev ? ':prev' : '')).join(','),
    flows: JSON.stringify(K.FLOWS),
    sectionOrder: K.SECTION_ORDER.join(','),
    visualOrder: JSON.stringify(K.VISUAL_ORDER),
    visualJoinerKeys: Object.keys(K.VISUAL_JOINER).join(','),
  };
}

/* ------------------------------------------------------------------ *
 * 正则大小写探针
 * ------------------------------------------------------------------ *
 * 中文语料全是小写英文单词，`/no /` 和 `/no /i` 在它上面**表现完全一样** ——
 * 也就是说「flags 抄错了」这件事，上面那批语料根本照不出来。
 * 这三条探针专门打大小写：每条都直接对三个 family 各跑一次 extractSignals，
 * 绕开场景识别，保证一定落在要测的分支上。
 * 期望：加没加 `i` 会让 hasNegative / hasAudio 翻转。
 */
const CASE_PROBES = [
  // hasNegative 在 extractSignals 里**区分大小写**（源文件就是 `/…|no /`，没有 i）。
  // 这条期望 0；谁给它加了 i，就变 1。
  'NO watermark, 一只戴着宇航头盔的橘猫，坐在月球表面',
  // hasAudio 带 /i。**必须用小写 bgm** —— 写 `BGM` 的话加不加 i 都命中，
  // 这条探针就白设了（一条看着在验、其实验不到东西的断言）。
  'bgm please, 一只戴着宇航头盔的橘猫，坐在月球表面',
  'bgm 用钢琴，拍一段 15 秒的短视频，一个人走在雨夜的街道上',
];

function probeSignals(K) {
  const out = [];
  for (const text of CASE_PROBES) {
    for (const fam of ['text', 'image', 'video']) {
      const s = K.extractSignals(text, fam);
      const flags = ['hasNegative', 'hasAudio', 'hasStyle', 'hasRatio', 'hasDuration']
        .map((k) => k + '=' + (s[k] === undefined ? '-' : (s[k] ? 1 : 0))).join(',');
      out.push(fam + ' | ' + flags);
    }
  }
  return out.join('\n');
}

/* ------------------------------------------------------------------ *
 * 采样：把每个函数的输出序列化
 * ------------------------------------------------------------------ */

function sample(K) {
  const out = { cases: [], structure: structureOf(K), probes: probeSignals(K) };
  for (const text of CORPUS) {
    const det = K.detectScenario(text);
    const fam = K.familyOf(det.matched.id);
    const signals = K.extractSignals(text, fam);
    const score = K.scoreOriginalPrompt(text, signals, fam);
    const rec = {};
    ['img.subject', 'img.ratio', 'vid.ratio'].forEach((q) => {
      rec[q] = K.recommendOption(q, text);
    });
    out.cases.push({
      text: text.slice(0, 40),
      // 只比 id 和分数 —— name / desc 是文案，各语种本来就该不一样
      matched: det.matched.id,
      ranked: det.ranked.map((r) => r.id + ':' + r.score).join(','),
      family: fam,
      signals,
      scoreTotal: score.total,
      scoreValues: score.items.map((i) => i.key + '=' + i.value).join(','),
      rec,
    });
  }
  return out;
}

/** 结构指纹的行级 diff，只报前几条，够定位就行 */
function diffStructure(a, b) {
  const A = String(a).split('\n'), B = String(b).split('\n');
  const out = [];
  const n = Math.max(A.length, B.length);
  for (let i = 0; i < n && out.length < 6; i += 1) {
    if (A[i] !== B[i]) out.push('    第 ' + (i + 1) + ' 行\n      基线 ' + A[i] + '\n      现在 ' + B[i]);
  }
  if (out.length === 6) out.push('    …（还有更多，只列前 6 条）');
  return out.join('\n');
}

/* ------------------------------------------------------------------ *
 * 主流程
 * ------------------------------------------------------------------ */

const BUNDLE_COUNT = checkSameScope();
const K = loadKnowledge(LOCALE);
const now = sample(K);

if (SAVE) {
  fs.mkdirSync(path.dirname(SNAP), { recursive: true });
  fs.writeFileSync(SNAP, JSON.stringify(now, null, 1), 'utf-8');
  console.log('基线已存：' + SNAP);
  console.log('  语料 ' + CORPUS.length + ' 条，语种 ' + (LOCALE || '(默认)'));
  const dist = {};
  now.cases.forEach((c) => { dist[c.matched] = (dist[c.matched] || 0) + 1; });
  console.log('  识别分布：' + JSON.stringify(dist));
  console.log('  结构指纹：' + now.structure.questions.split('\n').length + ' 道题 / '
    + Object.keys(now.structure).length + ' 张表');
  process.exit(0);
}

if (!fs.existsSync(SNAP)) {
  console.error('没有基线，先跑一次 --save');
  process.exit(1);
}
const before = JSON.parse(fs.readFileSync(SNAP, 'utf-8'));

/* 换语种时**不能**比 cases —— 中文语料在英文关键词表下本来就该识别不出来。
   那种「本语种自己的语料」一致性由 test-engine.js 的跨语种断言负责。
   但**结构指纹必须一模一样**：换了语言，题目结构不该跟着变。
   这是新语种最容易出的错（漏翻一道题、抄漏一个选项），而且现在就能验。 */
if (LOCALE) {
  const dist = {};
  now.cases.forEach((c) => { dist[c.matched] = (dist[c.matched] || 0) + 1; });
  console.log('[' + LOCALE + '] 语料 ' + CORPUS.length + ' 条（中文语料，仅供对照）');
  console.log('  识别分布：' + JSON.stringify(dist));
  console.log('  期望：中文语料在这个语种下大多落到 general —— 落到别的才是问题。');
  let badStruct = 0;
  Object.keys(before.structure).forEach((k) => {
    if (JSON.stringify(before.structure[k]) !== JSON.stringify(now.structure[k])) {
      badStruct += 1;
      console.error('✗ 结构指纹对不上：' + k);
      console.error(diffStructure(before.structure[k], now.structure[k]));
    }
  });
  if (badStruct) {
    console.error('\n结构有 ' + badStruct + ' 张表对不上（跨语种必须完全一致）');
    process.exitCode = 1;
  } else {
    console.log('  结构指纹和基线完全一致 ✓');
  }
  process.exit(process.exitCode || 0);
}

let bad = 0;

// ---- 1. 结构指纹 ----
Object.keys(before.structure).forEach((k) => {
  if (JSON.stringify(before.structure[k]) !== JSON.stringify(now.structure[k])) {
    bad += 1;
    console.error('✗ 结构指纹对不上：' + k);
    console.error(diffStructure(before.structure[k], now.structure[k]));
  }
});

// ---- 2. 正则大小写探针 ----
if (before.probes !== now.probes) {
  bad += 1;
  console.error('✗ 正则探针（大小写）对不上');
  console.error(diffStructure(before.probes, now.probes));
}

// ---- 3. 行为采样 ----
if (before.cases.length !== now.cases.length) {
  console.error('语料条数变了：基线 ' + before.cases.length + '，现在 ' + now.cases.length);
  process.exit(1);
}
before.cases.forEach((b, i) => {
  const n = now.cases[i];
  const diffs = [];
  if (b.matched !== n.matched) diffs.push('场景 ' + b.matched + ' → ' + n.matched);
  if (b.ranked !== n.ranked) diffs.push('排名 ' + b.ranked + ' → ' + n.ranked);
  if (b.family !== n.family) diffs.push('family ' + b.family + ' → ' + n.family);
  if (JSON.stringify(b.signals) !== JSON.stringify(n.signals)) diffs.push('线索不同');
  if (b.scoreTotal !== n.scoreTotal) diffs.push('总分 ' + b.scoreTotal + ' → ' + n.scoreTotal);
  if (b.scoreValues !== n.scoreValues) diffs.push('分项 ' + b.scoreValues + ' → ' + n.scoreValues);
  if (JSON.stringify(b.rec) !== JSON.stringify(n.rec)) diffs.push('推荐不同');
  if (diffs.length) {
    bad += 1;
    console.error('✗ [' + i + '] ' + JSON.stringify(b.text));
    diffs.forEach((d) => console.error('    ' + d));
  }
});

if (bad === 0) {
  console.log('行为完全一致 ✓  （' + before.cases.length + ' 条语料 + '
    + Object.keys(before.structure).length + ' 张表的结构指纹 + '
    + CASE_PROBES.length * 3 + ' 条正则探针 + '
    + BUNDLE_COUNT + ' 份文案包同域装载）');
} else {
  console.error('\n' + bad + ' 处对不上');
  process.exitCode = 1;
}
