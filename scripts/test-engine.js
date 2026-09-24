'use strict';

/**
 * 引擎自测
 * 1) 知识库完整性：流程里引用的问题必须存在，问题的 dim 必须能落进最终 Prompt
 * 2) 三个 family（文字 / 图片 / 视频）各跑一条完整多轮流程，检查死循环、空结果、得分提升
 */

const fs = require('fs');
const path = require('path');

/**
 * 前端源码目录。默认就是产品实际加载的那一份。
 *
 * 变异测试（mutation-check.js）会把它指向一份**临时副本**，在那上面改坏代码。
 * 为什么非要绕这一下：以前变异测试是直接改写真源码、跑完再还原的，
 * 结果有两个坑 ——
 *   1) 和别的测试并行跑时，对方读到的是「改坏的那一版」，会报出一堆并不存在的错
 *      （我自己就踩过：并行跑这个脚本，看到「存在 3 个问题」，白查了半天）；
 *   2) 跑到一半被杀掉（超时、Ctrl-C），源码就停在改坏的状态，
 *      之后所有测试都在测一份坏代码，而且看起来还挺绿。
 * 改成读副本之后，这两个坑从根上没有了：真源码一个字节都不会被动。
 */
const JS_DIR = process.env.PL_JS_DIR || path.join(__dirname, '..', 'public', 'assets', 'js');

/**
 * server.js 的位置。默认就是产品实际跑的那一份。
 *
 * 变异测试同样会把它指向临时副本 —— 四之九第 11 条（落盘白名单）是**读源码**的断言，
 * 它也得能被改坏。一条读源码、又不受变异检验的断言，本身就是「永远为真」的那种，
 * 而它守的恰好是最容易静默失效的东西（落盘时丢字段），更没理由让它无人看管。
 */
const SERVER_FILE = process.env.PL_SERVER_FILE || path.join(__dirname, '..', 'server.js');

const K = require(path.join(JS_DIR, 'knowledge.js'));
const Engine = require(path.join(JS_DIR, 'engine.js'));

// 每个 family 的「代表场景 id」。
// 注意它**不等于 family 名**：text 家族的场景 id 是 general。
// setScenario(s, 'text') 会找不到场景、静默什么都不做，测试于是留在
// createSession 自动识别的场景里 —— 碰巧蒙对就一直看不出来。
const SCENARIO_ID = { text: 'general', image: 'image', video: 'video' };

let failed = 0;
function fail(msg) {
  console.error('!! ' + msg);
  failed += 1;
}

/**
 * 取出某个 `## 小节` 的内容（一直截到下一个 `## ` 为止），没有这一节时返回 ''。
 *
 * **必须截断**：成品里有两张行形状一样的表 —— 分镜表和首尾帧参考，
 * 都以 `| 镜头 N | ... |` 开头。不截断的话「扫所有镜头行」会把两张表混在一起数，
 * 镜头数直接翻倍。这不是假想：变异测试抓出来的就是这么一条 ——
 * 一个本该只影响「首尾帧」节的变异，报出来的却是「镜头数应为 4，实际 8」。
 *
 * 放在文件最前面：四之二、四之六、四之九都要用，谁都不该自己再抄一份
 * 「split('\n') + 正则过滤」—— 那正是上面那个 bug 的来源。
 */
function markdownSection(text, heading) {
  const i = text.indexOf(heading);
  if (i === -1) return '';
  const rest = text.slice(i);
  const next = rest.indexOf('\n## ', 1);
  return next === -1 ? rest : rest.slice(0, next);
}

/** 把分镜表的镜头行拆成结构化数据，断言里反复要用 */
function boardRows(text) {
  return markdownSection(text, '## 分镜表').split('\n')
    .filter((l) => /^\| 镜头 \d+ \|/.test(l)).map((l) => {
      const c = l.split('|').map((x) => x.trim());
      return { no: c[1], shot: c[2], move: c[3], sec: Number((c[4] || '').replace(' 秒', '')), cell: c[5] };
    });
}
function boardCodes(text) {
  // 同样要按小节切开，理由和 boardRows 一样：这是「数一遍成品里有几段」的聚合，
  // 全篇扫的话，哪天别的小节也用了 `### 镜头 N（时间码）` 这种标题就会翻倍。
  // 规则统一成一句可机械检查的话：**凡是聚合成品内容的 helper，都必须走 markdownSection**。
  return (markdownSection(text, '## 逐段画面描述')
    .match(/### 镜头 \d+（\d\d:\d\d - \d\d:\d\d）/g) || [])
    .map((h) => h.match(/(\d\d:\d\d) - (\d\d:\d\d)/).slice(1, 3));
}
function boardTotalLine(text) {
  return (text.split('\n').filter((l) => /^【时长与结构】/.test(l))[0] || '');
}

/* ================================================================ *
 * 一、知识库完整性
 * ================================================================ */

console.log('='.repeat(72));
console.log('一、知识库完整性');

// 1. 流程与追问里引用的 qid 必须都能取到
const referenced = new Set();
Object.keys(K.FLOWS).forEach((fam) => {
  (K.FLOWS[fam].core || []).forEach((id) => referenced.add(id));
  (K.FLOWS[fam].tail || []).forEach((id) => referenced.add(id));
});
Object.keys(K.QUESTIONS).forEach((qid) => {
  const q = K.QUESTIONS[qid];
  // followUps 里存的是问题 id
  (q.options || []).forEach((o) => (o.followUps || []).forEach((id) => referenced.add(id)));
  // perScenario 里存的是选项对象，问题 id 要从各自定义处扫
});
// perScenario 的选项自身也可以带 followUps
Object.keys(K.QUESTIONS).forEach((qid) => {
  const per = K.QUESTIONS[qid].perScenario;
  if (!per) return;
  Object.keys(per).forEach((sc) => {
    (per[sc] || []).forEach((o) => {
      if (o && typeof o === 'object') (o.followUps || []).forEach((id) => referenced.add(id));
    });
  });
});

const missingQids = [...referenced].filter((id) => !K.QUESTIONS[id]);
if (missingQids.length) fail('流程引用了不存在的问题：' + missingQids.join(', '));
else console.log(`  ✓ 引用的 ${referenced.size} 个问题全部有定义`);

// 2. 每个问题的 dim 必须能被所属 family 的拼接顺序消费，否则选了也白选
const familyOrder = {
  text: K.SECTION_ORDER,
  image: K.VISUAL_ORDER.image,
  video: K.VISUAL_ORDER.video,
};
const dimProblems = [];
Object.keys(K.QUESTIONS).forEach((qid) => {
  const q = K.QUESTIONS[qid];
  if (!q.dim) return;
  // 找出这个 qid 可能出现在哪些 family 里
  const fams = Object.keys(K.FLOWS).filter((fam) => {
    const inFlow = (K.FLOWS[fam].core || []).concat(K.FLOWS[fam].tail || []).indexOf(qid) !== -1;
    return inFlow || qid.indexOf('img.') === 0 && fam === 'image' || qid.indexOf('vid.') === 0 && fam === 'video';
  });
  fams.forEach((fam) => {
    if (q.dim === 'negative') return; // 负面提示词单独输出，不进正文
    if (familyOrder[fam].indexOf(q.dim) === -1) {
      dimProblems.push(`${qid} (dim=${q.dim}) 不在 ${fam} 的拼接顺序里`);
    }
  });
});
if (dimProblems.length) fail('维度无法落进最终 Prompt：\n     ' + dimProblems.join('\n     '));
else console.log('  ✓ 所有问题的 dim 都能落进对应 family 的 Prompt');

// 3. 每个 family 至少要有核心问题和收尾问题
Object.keys(K.FLOWS).forEach((fam) => {
  const f = K.FLOWS[fam];
  if (!f.core || !f.core.length) fail(`${fam} 缺少 core 流程`);
  if (!f.tail || !f.tail.length) fail(`${fam} 缺少 tail 流程`);
});
if (!failed) console.log('  ✓ 三个 family 的流程定义齐全');

// 4. 每个场景都要能映射到 family
const badScenario = K.SCENARIOS.filter((sc) => !K.familyOf(sc.id)).map((sc) => sc.id);
if (badScenario.length) fail('场景没有归属 family：' + badScenario.join(', '));
else console.log(`  ✓ ${K.SCENARIOS.length} 个场景都有归属 family`);

// 5. 选项推荐：用户原话里已经写明的信息，要被用来标记推荐项
const recCases = [
  ['一只戴着宇航头盔的橘猫，坐在月球表面', 'img.subject', 'isub.animal'],
  ['赛博朋克风格的城市夜景，霓虹灯，下雨', 'img.subject', 'isub.scene'],
  ['给我的香水拍一张电商主图', 'img.subject', 'isub.product'],
  ['一位少女站在窗前', 'img.subject', 'isub.person'],
  ['一张竖屏的手机壁纸', 'img.ratio', 'irat.p916'],
];
recCases.forEach(([text, qid, expect]) => {
  const got = K.recommendOption(qid, text);
  if (got !== expect) fail(`推荐错误：${qid} + 「${text}」→ ${got}，期望 ${expect}`);
});
if (!failed) console.log('  ✓ 推荐项按原话命中');

// 文字类诉求不该给出图片推荐
if (K.recommendOption('img.subject', '帮我写一篇关于远程办公的文章') !== null) {
  fail('文字诉求不该命中图片主体推荐');
} else {
  console.log('  ✓ 无信号时不乱推荐');
}

// 推荐规则里引用的选项 id 必须真实存在，否则标记永远显示不出来
const badRecIds = [];
Object.keys(K.RECOMMEND_RULES).forEach((qid) => {
  const q = K.QUESTIONS[qid];
  if (!q) { badRecIds.push(qid + '（问题不存在）'); return; }
  K.RECOMMEND_RULES[qid].forEach(([optId]) => {
    if (!q.options.some((o) => o.id === optId)) badRecIds.push(qid + ' → ' + optId);
  });
});
if (badRecIds.length) fail('推荐规则引用了不存在的选项：' + badRecIds.join(', '));
else console.log('  ✓ 推荐规则引用的选项都存在');

// 6. 互斥组必须成对存在 —— 只给一条打 group 是没用的
const loneGroups = [];
Object.keys(K.QUESTIONS).forEach((qid) => {
  const q = K.QUESTIONS[qid];
  // intent 这类问题用的是 perScenario，没有顶层 options
  if (!q.options) return;
  const counts = {};
  q.options.forEach((o) => {
    const gs = !o.group ? [] : (Array.isArray(o.group) ? o.group : [o.group]);
    gs.forEach((g) => { counts[g] = (counts[g] || 0) + 1; });
  });
  Object.keys(counts).forEach((g) => {
    if (g === '*') return;                 // 「全不选」型只需要一个
    if (counts[g] < 2) loneGroups.push(qid + ' → ' + g);
  });
});
if (loneGroups.length) fail('互斥组里只有一条选项，等于没约束：' + loneGroups.join(', '));
else console.log('  ✓ 互斥组都是成对的');

// 7. 画幅比例由专门的问题独占 —— 风格类片段不能也声称比例，否则「电影感 + 1:1 方图」
//    会拼出「宽银幕构图…1:1 正方形画幅」这种自相矛盾的描述
const ASPECT_WORDS = /宽银幕|横幅画幅|竖幅画幅|竖屏画幅|正方形画幅|超宽画幅|横幅构图|竖幅构图/;
const aspectClash = [];
Object.keys(K.QUESTIONS).forEach((qid) => {
  if (qid === 'img.ratio' || qid === 'vid.ratio') return;
  const q = K.QUESTIONS[qid];
  (q.options || []).forEach((o) => {
    if (o.fragment && ASPECT_WORDS.test(o.fragment)) aspectClash.push(qid + ' → ' + o.id);
  });
});
if (aspectClash.length) fail('非画幅题声称了画幅，会和画幅比例题打架：' + aspectClash.join(', '));
else console.log('  ✓ 画幅比例只由专门的问题声称');

// 8. 「剪辑结构」（全片一个镜头还是多个 / 有没有剪辑点）由「剪辑结构」题独占。
//    别的题的片段不许声称镜头数 —— 这正是用户最初报的那个 bug 的根因：
//    时长题的片段写着「包含 2-3 个镜头切换」，用户却选了「一镜到底」，
//    于是同一段连续描述里既有「全片没有剪辑点」、又有「2-3 个镜头切换」。
//
//    这条和上面那条画幅检查是同一个套路，但**必须在源头拦**：
//    四之八第 3 条断言是在**装配结果**上找矛盾，能抓到症状、说不清根因；
//    这一条直接把「哪道题的哪个选项越权了」指出来。
//    两条都留着 —— 一条管根因、一条管成品（后者对任何来源的镜头数都有效）。
//
//    只查 `fragment`，不查 `label` / `hint`：时长选项的 label（「10-15 秒 · 可多镜头」）
//    和 `maxShots` 是**容量上限**，不进 Prompt，不构成矛盾。
const CUT_CLAIM_WORDS = /剪辑|镜头切换|一镜到底|个镜头|单镜头|多镜头/;
const cutClaimClash = [];
const scanCutClaims = (qid, list) => {
  (list || []).forEach((o) => {
    if (o.fragment && CUT_CLAIM_WORDS.test(o.fragment)) {
      cutClaimClash.push(qid + ' → ' + o.id + '（' + o.fragment + '）');
    }
  });
};
Object.keys(K.QUESTIONS).forEach((qid) => {
  if (qid === 'vid.cut') return;
  const q = K.QUESTIONS[qid];
  scanCutClaims(qid, q.options);
  // intent 这类题用的是 perScenario（画幅那条没扫这里，这里顺手扫掉）
  if (q.perScenario) Object.keys(q.perScenario).forEach((k) => scanCutClaims(qid, q.perScenario[k]));
});
if (cutClaimClash.length) {
  fail('非「剪辑结构」题声称了镜头数 / 剪辑点，会和「剪辑结构」打架：'
    + cutClaimClash.join(', '));
} else console.log('  ✓ 剪辑结构只由「剪辑结构」题声称');

/* ================================================================ *
 * 二、示例数据（选项的「默认 → 选了」对照）
 * ================================================================ */

console.log('\n' + '='.repeat(72));
console.log('二、选项示例');

const Demos = require(path.join(JS_DIR, 'demos.js'));
const Scene = require(path.join(JS_DIR, 'scene.js'));

// 1. 示例数据必须全部挂得上：题目 id 或选项 id 写错都会在这里暴露
const missed = Demos.apply(K);
if (missed.length) fail('示例数据挂不上，说明 id 已经对不上了：' + missed.join(', '));
else console.log('  ✓ 示例数据全部挂载成功');

// 2. 每个带选项的题都必须有示例，且 demoKind 合法
const NO_DEMO_OK = new Set([
  'img.subject', 'img.subject.person', 'img.subject.animal', 'img.subject.product',
  'img.negative', 'vid.negative', 'vid.action', 'vid.duration', 'vid.audio', 'vid.bgm',
  'vid.arc', 'vid.focus', 'vid.detail',
  // 「剪辑结构」故意不给对照示例：它是时间维度的差别（帧与帧之间怎么接），
  // 单帧对照图表达不了它。它原来的示例是 { move: 'track', style: 'cinema' }，
  // 照搬过来只会把刚拆掉的「一镜到底 = 电影感」重新种回去 —— 那正是这次要修的。
  'vid.cut',
]);
const missingKind = [];
Object.keys(K.QUESTIONS).forEach((qid) => {
  const q = K.QUESTIONS[qid];
  if (!q.options || NO_DEMO_OK.has(qid)) return;
  if (q.demoKind !== 'scene' && q.demoKind !== 'text') missingKind.push(qid);
});
if (missingKind.length) fail('这些题没有对照示例：' + missingKind.join(', '));
else console.log('  ✓ 除纯名词题外，每个题都有对照示例');

// 3. 有 demoKind 的题，选项必须带上 demo，否则界面上会出现空白的对照区
const optWithoutDemo = [];
Object.keys(K.QUESTIONS).forEach((qid) => {
  const q = K.QUESTIONS[qid];
  if (!q.demoKind) return;
  (q.options || []).forEach((o) => {
    if (!o.demo) optWithoutDemo.push(qid + ' → ' + o.id);
  });
});
if (optWithoutDemo.length) fail('这些选项缺示例：' + optWithoutDemo.join(', '));
else console.log('  ✓ 有示例的题，每个选项都带上了示例');

// 4. 场景类示例必须能渲染出合法的 SVG。
//    参数化绘图最容易「代码不报错但图画不出来」，所以逐个渲染一遍。
const sceneProblems = [];
Object.keys(K.QUESTIONS).forEach((qid) => {
  const q = K.QUESTIONS[qid];
  if (q.demoKind !== 'scene') return;
  const check = (params, tag) => {
    const svg = Scene.render(Object.assign({}, Scene.BASE, q.demoBase || {}, params || {}));
    if (!/^<svg[\s\S]*<\/svg>$/.test(svg)) sceneProblems.push(tag + ' 没渲染出完整 SVG');
    else if (/undefined|NaN/.test(svg)) sceneProblems.push(tag + ' 里出现了 undefined / NaN');
  };
  check({}, qid + ' 的默认图');
  (q.options || []).forEach((o) => check(o.demo, qid + ' → ' + o.id));
});
if (sceneProblems.length) fail('场景示例渲染有问题：' + sceneProblems.join('; '));
else console.log('  ✓ 场景示例全部渲染出合法 SVG');

// 5. 「默认 → 选了」必须真的不一样。
//    这是整个功能的立身之本 —— 如果两张图一样，用户等于什么都没看到。
const identical = [];
Object.keys(K.QUESTIONS).forEach((qid) => {
  const q = K.QUESTIONS[qid];
  if (q.demoKind !== 'scene') return;
  const base = Scene.withDemo(q.demoBase, {});
  (q.options || []).forEach((o) => {
    if (Scene.withDemo(q.demoBase, o.demo) === base) identical.push(qid + ' → ' + o.id);
  });
});
if (identical.length) fail('这些选项的「默认」和「选了」画出来一模一样：' + identical.join(', '));
else console.log('  ✓ 每个场景选项的对照图都有可见差异');

// 6. 文本类示例不能空，而且「默认」和「选了」不能是同一句话
const textProblems = [];
Object.keys(K.QUESTIONS).forEach((qid) => {
  const q = K.QUESTIONS[qid];
  if (q.demoKind !== 'text') return;
  if (!q.demoBefore) textProblems.push(qid + ' 缺「默认」文案');
  (q.options || []).forEach((o) => {
    if (!o.demo) return;
    if (String(o.demo).trim() === String(q.demoBefore || '').trim()) {
      textProblems.push(qid + ' → ' + o.id + ' 的「选了」和「默认」是同一句');
    }
  });
});
if (textProblems.length) fail('文本示例有问题：' + textProblems.join(', '));
else console.log('  ✓ 文本示例都有实际差异');

// 7. 引擎是「白名单式」构造题目对象的：字段没被显式带过来就会静默丢失，
//    界面上表现为示例区一片空白，不报错也不崩溃。所以这里正面对着过一遍。
const dropped = [];
Object.keys(K.QUESTIONS).forEach((qid) => {
  const raw = K.QUESTIONS[qid];
  if (!raw.options || !raw.demoKind) return;
  const q = Engine.getQuestion(qid, 'general');
  if (!q) return;
  // 知识库里没写 demoBase / demoBefore 时是 undefined，引擎会归一成 null / ''，
  // 所以比较前先拉平，否则会把「本来就是空的」误判成「被丢掉了」
  const nil = (v) => (v === undefined || v === null ? null : v);
  if (q.demoKind !== raw.demoKind) dropped.push(qid + '.demoKind');
  if (nil(q.demoBase) !== nil(raw.demoBase)) dropped.push(qid + '.demoBase');
  if ((q.demoBefore || '') !== (raw.demoBefore || '')) dropped.push(qid + '.demoBefore');
  raw.options.forEach((o) => {
    if (!o.demo) return;
    const got = q.options.filter((x) => x.id === o.id)[0];
    if (!got || !got.demo) dropped.push(qid + ' → ' + o.id + '.demo');
  });
});
if (dropped.length) fail('引擎没有把示例字段传给界面：' + dropped.slice(0, 8).join(', '));
else console.log('  ✓ 示例字段一路传到了界面层');

// 8. 题目必须真的能被走到，否则精心做的示例等于白做（数据漂移的另一种形态）。
//    可达 = 直接写在 FLOWS 里，或由某个可达题的选项通过 followUps 带进来。
const reachable = new Set();
Object.keys(K.FLOWS).forEach((f) => {
  ['core', 'tail'].forEach((k) => (K.FLOWS[f][k] || []).forEach((q) => reachable.add(q)));
  return null;
});
// followUps 是传导的：可达题的追问题也应当可达，所以要跑到不再增长为止
let grew = true;
let guard = 0;
while (grew && guard < 20) {
  guard += 1;
  grew = false;
  Object.keys(K.QUESTIONS).forEach((qid) => {
    if (!reachable.has(qid)) return;
    (K.QUESTIONS[qid].options || []).forEach((o) => {
      (o.followUps || []).forEach((fu) => {
        if (!reachable.has(fu)) { reachable.add(fu); grew = true; }
      });
    });
  });
}
const ghostRefs = [];
Object.keys(K.FLOWS).forEach((f) => {
  ['core', 'tail'].forEach((k) => (K.FLOWS[f][k] || []).forEach((q) => {
    if (!K.QUESTIONS[q]) ghostRefs.push(f + '.' + k + ' → ' + q);
  }));
});
const orphans = Object.keys(K.QUESTIONS).filter((q) => !reachable.has(q));
if (ghostRefs.length) fail('流程引用了不存在的题目：' + ghostRefs.join(', '));
else if (orphans.length) fail('这些题目永远走不到（示例白做了）：' + orphans.join(', '));
else console.log('  ✓ ' + Object.keys(K.QUESTIONS).length + ' 个题目全部可达，无死题');

// 9. 白名单和实际情况必须互相印证。
//    NO_DEMO_OK 声称「这些题不需要示例」，那它们就不该被挂上示例 ——
//    否则会出现「白名单说不需要、代码里却挂了」的自相矛盾，后面的人无从判断照哪个办。
const wlProblems = [];
Object.keys(K.QUESTIONS).forEach((qid) => {
  const q = K.QUESTIONS[qid];
  const listed = NO_DEMO_OK.has(qid);
  const hasDemo = !!q.demoKind || (q.options || []).some((o) => o.demo);
  if (listed && hasDemo) wlProblems.push(qid + ' 在白名单里却有示例');
  if (!listed && q.options && !q.demoKind) wlProblems.push(qid + ' 不在白名单里却没示例');
});
// 白名单里的题目必须真的存在，否则等于给了一个永远用不上的豁免
const ghostWL = Array.from(NO_DEMO_OK).filter((qid) => !K.QUESTIONS[qid]);
if (ghostWL.length) wlProblems.push('白名单引用了不存在的题：' + ghostWL.join(', '));
if (wlProblems.length) fail('示例白名单与实际挂载不一致：' + wlProblems.join('; '));
else console.log('  ✓ 示例白名单与实际挂载互相印证');

// 10. 白名单式构造的通用防线：知识库写在选项上、引擎要用到的业务字段，
//     归一化之后必须还在。这类「字段被静默丢掉」的 bug 已经栽过两次
//     （demoKind 一次、seconds/maxShots 一次），每次都表现为「功能整个不生效但不报错」。
const PASSTHROUGH_FIELDS = ['demo', 'group', 'seconds', 'maxShots', 'arc'];
const fieldDropped = [];
Object.keys(K.QUESTIONS).forEach((qid) => {
  const raw = K.QUESTIONS[qid];
  if (!raw.options) return;
  const q = Engine.getQuestion(qid, 'general');
  if (!q) return;
  raw.options.forEach((o) => {
    const got = q.options.filter((x) => x.id === o.id)[0];
    if (!got) { fieldDropped.push(qid + ' → ' + o.id + ' 整个选项丢了'); return; }
    PASSTHROUGH_FIELDS.forEach((f) => {
      if (o[f] === undefined || o[f] === null) return;
      const rawVal = o[f];
      const gotVal = got[f];
      if (typeof rawVal === 'number' || typeof rawVal === 'string') {
        if (gotVal !== rawVal) fieldDropped.push(qid + ' → ' + o.id + '.' + f);
      } else if (!gotVal) {
        fieldDropped.push(qid + ' → ' + o.id + '.' + f);
      }
    });
  });
});
if (fieldDropped.length) {
  fail('知识库写在选项上的字段被引擎丢掉了：' + fieldDropped.slice(0, 8).join(', '));
} else console.log('  ✓ 选项上的业务字段都活着穿过了归一化（' + PASSTHROUGH_FIELDS.join('/') + '）');

/* ================================================================ *
 * 三、选择规则（数量上限 + 互斥）
 * ================================================================ */

console.log('\n' + '='.repeat(72));
console.log('三、选择规则');

const imgStyle = Engine.getQuestion('img.style', 'image');

// 数量上限：连点 4 个风格，只应留下 2 个
let sel = [];
['ist.photo', 'ist.cinema', 'ist.jp', 'ist.film'].forEach((id) => {
  sel = Engine.toggleOption(imgStyle, sel, id);
});
if (sel.length !== 2) fail(`maxPick 没生效：连选 4 个风格留下 ${sel.length} 个（期望 2）`);
else console.log('  ✓ maxPick 生效：风格最多留 ' + sel.length + ' 个');

// 同组互斥：写实摄影与像素风不能共存
sel = Engine.toggleOption(imgStyle, [], 'ist.photo');
sel = Engine.toggleOption(imgStyle, sel, 'ist.pixel');
if (sel.indexOf('ist.photo') !== -1) fail('互斥没生效：写实摄影与像素风同时存在');
else console.log('  ✓ 同组互斥：选像素风后，写实摄影被挤掉');

// 跨组可叠加：写实摄影 + 电影感
sel = Engine.toggleOption(imgStyle, [], 'ist.photo');
sel = Engine.toggleOption(imgStyle, sel, 'ist.cinema');
if (sel.length !== 2) fail('跨组叠加失败：写实摄影 + 电影感应当可以共存');
else console.log('  ✓ 跨组可叠加：写实摄影 + 电影感');

// 「全不选」型：不需要声音
const vidAudio = Engine.getQuestion('vid.audio', 'video');
sel = Engine.toggleOption(vidAudio, [], 'vaud.ambient');
sel = Engine.toggleOption(vidAudio, sel, 'vaud.music');
if (sel.length !== 2) fail('环境音 + 配乐应当可以共存');
sel = Engine.toggleOption(vidAudio, sel, 'vaud.none');
if (sel.length !== 1 || sel[0] !== 'vaud.none') fail('「不需要声音」应当清空其它声音选项');
else console.log('  ✓ 「全不选」型选项：不需要声音 → 清空其它');
sel = Engine.toggleOption(vidAudio, sel, 'vaud.voice');
if (sel.indexOf('vaud.none') !== -1) fail('选了声音后「不需要声音」应当被取消');
else console.log('  ✓ 反向也生效：选了声音，「不需要声音」被取消');

// 文字类的矛盾选项：不要反问我 / 信息不够就先问我
const cons = Engine.getQuestion('constraints', 'general');
sel = Engine.toggleOption(cons, [], 'con.noask');
sel = Engine.toggleOption(cons, sel, 'con.askfirst');
if (sel.indexOf('con.noask') !== -1) fail('「不要反问我」与「信息不够就先问我」应当互斥');
else console.log('  ✓ 文字类里的矛盾选项也被拦住');

// 单选：点选 / 再点取消
const single = Engine.getQuestion('img.ratio', 'image');
sel = Engine.toggleOption(single, [], 'irat.square');
if (sel.length !== 1) fail('单选第一次点击应当选中');
sel = Engine.toggleOption(single, sel, 'irat.square');
if (sel.length !== 0) fail('单选再点一次应当取消');
else console.log('  ✓ 单选可点选、可取消');

// 跳过：清空其它选择
sel = Engine.toggleOption(cons, ['con.nogreet', 'con.norepeat'], '__skip__');
if (sel.length !== 1 || sel[0] !== '__skip__') fail('选「跳过」应当清空其它选择');
else console.log('  ✓ 「跳过」清空其它选择');

// 兜底收敛：矛盾/超量的历史数据喂进去也要能救回来
const dirty = ['ist.photo', 'ist.pixel', 'ist.ink', 'ist.cinema', 'ist.film'];
const cleaned = Engine.normalizeSelection(imgStyle, dirty);
if (cleaned.length !== 2) fail(`normalizeSelection 没收敛超量选择：${cleaned.length} 个`);
const cleanedGroups = cleaned.map((id) => {
  const o = imgStyle.options.find((x) => x.id === id);
  return o ? o.group : '';
});
if (cleanedGroups.filter((g) => g === 'medium').length > 1) {
  fail('normalizeSelection 没拦住同组互斥');
} else {
  console.log(`  ✓ 脏数据兜底收敛：${dirty.length} 个 → ${cleaned.length} 个（${cleaned.join(', ')}）`);
}

/* ================================================================ *
 * 四、完整流程
 * ================================================================ */

const CASES = [
  { text: '帮我写一篇关于远程办公的公众号文章，要给公司同事看的', family: 'text' },
  { text: '写个 python 脚本把 excel 里的数据去重', family: 'text' },
  { text: '讲解一下什么是区块链', family: 'text' },
  { text: '一只戴着宇航头盔的橘猫，坐在月球表面', family: 'image' },
  { text: '赛博朋克风格的城市夜景，霓虹灯，下雨', family: 'image' },
  { text: '帮我画一张咖啡店开业海报，要复古', family: 'image' },
  { text: '一个人走在雨夜的城市街头，霓虹灯的倒影落在积水里', family: 'video' },
  { text: '拍一段 15 秒的护肤品广告，要有质感', family: 'video' },
  { text: '用 Sora 生成一段海边日出的延时摄影', family: 'video' },
];

CASES.forEach(({ text, family }) => {
  console.log('\n' + '='.repeat(72));
  console.log('输入：' + text);
  console.log('期望 family：' + family);

  const s = Engine.createSession(text);
  console.log(`识别场景：${s.scenarioIcon} ${s.scenarioName}  family=${s.family}  原始得分：${s.scoreBefore.total}`);

  if (s.family !== family) fail(`family 识别错误：期望 ${family}，实际 ${s.family}`);

  let guard = 0;
  let batch = Engine.nextRound(s);
  let roundCount = 0;

  while (batch.length && guard < 40) {
    guard += 1;
    roundCount += 1;
    console.log(`\n--- 第 ${s.round} 轮（${batch.length} 题）---`);
    const answers = {};
    batch.forEach((q) => {
      console.log(`  [${q.title}] ${q.question}`);
      // 模拟真实点击：多选连点前两个有效选项，由引擎裁决上限与互斥
      const usable = q.options.filter((o) => !o.skip && !o.custom);
      const picks = q.multi ? usable.slice(0, 2) : usable.slice(0, 1);
      let chosen = [];
      picks.forEach((o) => { chosen = Engine.toggleOption(q, chosen, o.id); });
      answers[q.id] = { selected: chosen };
    });
    batch = Engine.submitRound(s, answers);
  }

  if (guard >= 40) {
    fail('疑似死循环');
    return;
  }
  if (roundCount < 3) fail(`轮数过少（${roundCount} 轮），多轮拆解没生效`);

  const result = Engine.finalize(s);
  console.log('\n总轮数：' + result.rounds + '  决定数：' + result.answerCount);
  console.log(`得分：${result.scoreBefore.total} → ${result.scoreAfter.total}`);
  console.log('补齐项：' + result.improvements.map((i) => i.label).join('、'));

  if (!result.promptText || result.promptText.length < 40) fail('生成的 Prompt 过短');
  if (result.scoreAfter.total <= result.scoreBefore.total) fail('得分没有提升');
  if (!result.decisions.length) fail('没有生成决策清单');
  if (result.family !== family) fail('finalize 返回的 family 不对');

  // 原始输入必须原样保留在最终 Prompt 里
  if (result.promptText.indexOf(text) === -1) fail('最终 Prompt 丢失了用户的原始输入');

  if (family === 'text') {
    if (result.negativePrompt) fail('文字类不应产生负面提示词');
    if (result.promptText.indexOf('# ') === -1) fail('文字类 Prompt 应当是分节 Markdown 文档');
  } else {
    if (!result.negativePrompt) fail(`${family} 类必须产出负面提示词`);
    if (result.promptText.indexOf('# ') !== -1) fail(`${family} 类不应输出 Markdown 分节`);
  }

  console.log('\n---------- 生成的 Prompt ----------');
  console.log(result.promptText);
  if (result.negativePrompt) {
    console.log('---------- 负面提示词 ----------');
    console.log(result.negativePrompt);
  }
});

/* ================================================================ *
 * 四之二、视频分镜表
 * ================================================================ */

console.log('\n' + '='.repeat(72));
console.log('四之二、视频分镜表（多镜头才生成）');

/** 造一个视频 session：场景强制切到 video，然后灌入指定答案 */
function videoSession(answers, customs) {
  const s = Engine.createSession('雨中漫步，主打情绪氛围感。一只撑伞的身影在雨夜街道上缓缓前行');
  Engine.setScenario(s, 'video');
  Object.assign(s.answers, answers);
  if (customs) Object.assign(s.customs, customs);
  return s;
}

function videoCase(answers, customs) {
  return Engine.finalize(videoSession(answers, customs));
}

const FOUR_SHOTS = ['vsh.cu', 'vsh.medium', 'vsh.close', 'vsh.wide'];
const FOUR_MOVES = ['vmv.push', 'vmv.orbit', 'vmv.track', 'vmv.pull'];

const board = videoCase({
  'vid.action': ['vact.single'],
  'vid.shot': FOUR_SHOTS,
  'vid.move': FOUR_MOVES,
  'vid.style': ['vst.cinema'],
  'vid.lighting': ['vlt.back', 'vlt.night'],
  'vid.duration': ['vdur.long'],
  'vid.audio': ['vaud.ambient', 'vaud.music'],
  'vid.bgm': ['vbgm.cello'],
  'vid.ratio': ['vrat.p916'],
  'vid.arc': ['varc.rise'],
  'vid.focus': ['vfoc.face'],
  'vid.detail': ['vdet.reflect', 'vdet.prop'],
}, {
  // 自定义输入里用逗号写多个细节 —— helper 就是这么示范的，引擎必须按标点拆开
  'vid.detail': '伞面的雨珠、积水的倒影',
});

const boardProblems = [];
if (board.promptText.indexOf('## 分镜表') === -1) boardProblems.push('没有分镜表');
if (board.promptText.indexOf('## 逐段画面描述') === -1) boardProblems.push('没有逐段画面描述');
if (board.promptText.indexOf('## 背景音乐建议') === -1) boardProblems.push('没有背景音乐建议');
if (board.promptText.indexOf('雨中漫步') === -1) boardProblems.push('丢了用户原话');
if (board.promptText.indexOf('9:16') === -1) boardProblems.push('丢了画幅');
if (board.promptText.indexOf('大提琴') === -1) boardProblems.push('配乐没写具体乐器');

// 分镜表里的镜头行（表头那行是「| 镜头 |」，用「| 镜头 数字」精确匹配）。
// **必须只扫「## 分镜表」这一节**：成品里还有一张「首尾帧参考」，
// 行形状一模一样，混在一起数镜头数会翻倍（boardRows 里有详细说明）。
const shotRows = boardRows(board.promptText);
if (shotRows.length !== FOUR_SHOTS.length) {
  boardProblems.push('镜头数应为 ' + FOUR_SHOTS.length + '，实际 ' + shotRows.length);
}

// 时长必须加得起来，而且等于时长题给的秒数
const totalSecs = shotRows.reduce((a, r) => a + r.sec, 0);
if (totalSecs !== 20) boardProblems.push('分镜时长合计应为 20 秒，实际 ' + totalSecs);

// 时间码必须从 00:00 开始、首尾相接，不能有空洞或重叠
const codes = boardCodes(board.promptText);
if (!codes.length) boardProblems.push('没有时间码');
else {
  if (codes[0][0] !== '00:00') boardProblems.push('时间码没从 00:00 开始');
  for (let i = 1; i < codes.length; i += 1) {
    if (codes[i][0] !== codes[i - 1][1]) {
      boardProblems.push('第 ' + (i + 1) + ' 段时间码与上一段接不上（' + codes[i][0] + '）');
    }
  }
}

// 景别要按用户选的顺序落到分镜表里，不能被引擎重排
FOUR_SHOTS.forEach((id, i) => {
  const label = K.QUESTIONS['vid.shot'].options.filter((o) => o.id === id)[0].label;
  if ((shotRows[i] || {}).shot !== label) {
    boardProblems.push('镜头 ' + (i + 1) + ' 的景别不是「' + label + '」');
  }
});

if (boardProblems.length) fail('分镜表有问题：' + boardProblems.join('; '));
else console.log('  ✓ 多镜头视频生成了分镜表 + 逐段描述 + BGM，时长与时间码自洽');

// 运镜比镜头少时应当循环使用，而不是留空
const cycle = videoCase({ 'vid.shot': FOUR_SHOTS, 'vid.move': ['vmv.push', 'vmv.pull'], 'vid.duration': ['vdur.long'] });
const moveCells = boardRows(cycle.promptText).map((r) => r.move);
if (moveCells.length !== 4 || moveCells.some((c) => !c)) {
  fail('运镜少于镜头数时没有循环补齐：' + moveCells.join(' / '));
} else console.log('  ✓ 运镜不够时按顺序循环分配（' + moveCells.join(' → ') + '）');

// 时长题给的镜头上限必须真的生效：s15 最多 3 个镜头
const capped = videoCase({ 'vid.shot': FOUR_SHOTS, 'vid.move': FOUR_MOVES, 'vid.duration': ['vdur.s15'] });
const cappedShots = boardRows(capped.promptText).length;
if (cappedShots !== 3) fail('「10-15 秒」应当只装 3 个镜头，实际 ' + cappedShots);
else console.log('  ✓ 时长上限生效：10-15 秒 + 4 个景别 → 只排 3 个镜头');

/* ---------------- 分镜表要像一份「拍摄方案」，而不是术语说明 ---------------- */

// 表头必须和范例一致
const boardHead = board.promptText.split('\n').filter((l) => /^\| 镜头编号 \|/.test(l))[0] || '';
if (boardHead !== '| 镜头编号 | 景别 | 运镜方式 | 时长 | 镜头内容 |') {
  fail('分镜表表头与范例不一致：' + (boardHead || '（没找到表头）'));
} else console.log('  ✓ 分镜表表头与范例一致（镜头编号 / 景别 / 运镜方式 / 时长 / 镜头内容）');

// 「镜头内容」列要写「这一镜拍什么」，不能写成「特写是什么」。
// 两种写法在数据层长得几乎一样，但对生成工具是「有用」和「等于没说」的区别。
const DEFINITION_WORDS = /是叙事的常用景别|让观众无法移开视线|营造陌生化的观看体验|微距呈现|面部表情与情绪成为这一镜的重点/;
const boardCells = boardRows(board.promptText).map((r) => r.cell);
if (boardCells.length !== FOUR_SHOTS.length) {
  fail('取不到「镜头内容」列，拿到 ' + boardCells.length + ' 行');
} else if (boardCells.some((c) => !c)) {
  fail('有镜头的「镜头内容」是空的');
} else if (boardCells.some((c) => DEFINITION_WORDS.test(c))) {
  fail('「镜头内容」列写成了景别定义，而不是这一镜拍什么：' + boardCells.join(' / '));
} else console.log('  ✓ 「镜头内容」列是取景指令，不是术语定义');

// 细节要按顺序分配给各个镜头 —— 自定义写的排前面（那才是用户真正在意的东西），
// 选项类的「元素类别」排后面
const EXPECT_DETAILS = ['伞面的雨珠', '积水的倒影', '反光与倒影', '关键道具'];
const detailWrong = [];
EXPECT_DETAILS.forEach((d, i) => {
  if ((boardCells[i] || '').indexOf(d) === -1) detailWrong.push('镜头 ' + (i + 1) + ' 缺「' + d + '」');
});
if (detailWrong.length) fail('细节没有按顺序分配到各镜：' + detailWrong.join('; '));
else console.log('  ✓ 细节按顺序分配给各镜（' + EXPECT_DETAILS.join(' → ') + '）');

// 头部清单必须把用户给的每一条都列出来 —— 漏掉的细节等于用户白写了。
// 清单要用短词，不能把选项的长句混进来（会读成病句）。
const detailHead = board.promptText.split('\n').filter((l) => /^【画面细节】/.test(l))[0] || '';
if (!detailHead) fail('头部没有列出【画面细节】清单');
else {
  const headMiss = ['伞面的雨珠', '积水的倒影', '反光与倒影', '关键道具']
    .filter((d) => detailHead.indexOf(d) === -1);
  if (headMiss.length) fail('【画面细节】清单漏了：' + headMiss.join('、'));
  else if (/清晰可见/.test(detailHead)) fail('【画面细节】清单混进了选项的长句：' + detailHead);
  else console.log('  ✓ 头部清单列全了每条细节，且用的是短词');
}

// 焦点和细节不能打架：「伞面的雨珠」和「把注意力引到面部表情上」同时出现，
// 模型不知道该看哪里。规则是「更具体的说了算」——
// 分到具体细节的近景镜不再叠加焦点，但用户选的焦点不能因此消失，它要在头部。
const CLOSE_IDS = { 'vsh.close': 1, 'vsh.cu': 1, 'vsh.macro': 1 };
const picLines = board.promptText.split('\n').filter((l) => /^画面：/.test(l));
const focusInShots = picLines.map((l) => l.indexOf('面部表情') !== -1);
if (focusInShots.some(Boolean)) {
  fail('分到具体细节的镜头不该再叠加焦点（会互相打架）：'
    + focusInShots.map((v, i) => '镜头 ' + (i + 1) + '=' + v).join(' '));
} else if (board.promptText.indexOf('【细节焦点】') === -1) {
  fail('逐镜没用上焦点时，用户选的焦点在结果里彻底消失了（头部也没写）');
} else {
  console.log('  ✓ 细节与焦点不打架：具体细节优先，焦点保留在头部');
}

// 反过来：没有具体细节时，焦点必须落在近处镜头上 —— 全景里让人看清面部表情是自相矛盾的
const noDetail = videoCase({
  'vid.shot': FOUR_SHOTS, 'vid.move': FOUR_MOVES, 'vid.duration': ['vdur.long'],
  'vid.focus': ['vfoc.face'],
});
const ndLines = noDetail.promptText.split('\n').filter((l) => /^画面：/.test(l));
const ndWrong = [];
FOUR_SHOTS.forEach((id, i) => {
  const has = (ndLines[i] || '').indexOf('面部表情') !== -1;
  if (has !== !!CLOSE_IDS[id]) ndWrong.push('镜头 ' + (i + 1) + '（' + id + '）有焦点=' + has);
});
if (ndWrong.length) fail('没有具体细节时，焦点该只落在特写 / 近景上：' + ndWrong.join('; '));
else console.log('  ✓ 没有具体细节时，焦点只落在近处镜头（中景 / 全景没有）');

// 单镜头走的是「连续描述」那条路径，规则必须和分镜一致。
// 两条路径行为不一致是最难查的那种 bug —— 用户只会觉得「有时灵有时不灵」。
const singleWide = videoCase({
  'vid.shot': ['vsh.wide'], 'vid.move': ['vmv.static'],
  'vid.duration': ['vdur.s5'], 'vid.focus': ['vfoc.face'],
});
if (singleWide.promptText.indexOf('面部表情') !== -1) {
  fail('单镜头 + 全景时，焦点不该出现在连续描述里（和分镜路径规则不一致）');
} else console.log('  ✓ 单镜头 + 全景：焦点被过滤，与分镜路径同一条规则');

const singleCu = videoCase({
  'vid.shot': ['vsh.cu'], 'vid.move': ['vmv.push'],
  'vid.duration': ['vdur.s5'], 'vid.focus': ['vfoc.face'],
});
if (singleCu.promptText.indexOf('面部表情') === -1) {
  fail('单镜头 + 特写时，焦点必须出现在连续描述里（被误过滤了）');
} else console.log('  ✓ 单镜头 + 特写：焦点保留');

// 每镜的「氛围」必须随情绪走向变化 —— 四镜同一句等于没写情绪推进
const moodLines = board.promptText.split('\n').filter((l) => /^氛围：/.test(l));
let moodChecked = false;
if (board.promptText.indexOf('【情绪走向】') === -1) {
  fail('头部没有【情绪走向】');
} else if (moodLines.length !== FOUR_SHOTS.length) {
  fail('氛围行数应为 ' + FOUR_SHOTS.length + '，实际 ' + moodLines.length);
} else if (new Set(moodLines).size !== moodLines.length) {
  fail('氛围行有重复，情绪没有随镜头推进：' + moodLines.join(' / '));
} else {
  moodChecked = true;
  console.log('  ✓ 四镜的氛围各不相同（'
    + moodLines.map((l) => l.slice(3).split('；')[0]).join(' → ') + '）');
}

// 没答「情绪走向」时不能崩、也不能写出空氛围 —— 只是退化成同一句光线描述
const noArc = videoCase({
  'vid.shot': FOUR_SHOTS, 'vid.move': FOUR_MOVES,
  'vid.duration': ['vdur.long'], 'vid.lighting': ['vlt.back'],
});
const noArcMoods = noArc.promptText.split('\n').filter((l) => /^氛围：/.test(l));
if (noArcMoods.length !== FOUR_SHOTS.length || noArcMoods.some((l) => l === '氛围：。' || l === '氛围：')) {
  fail('没答情绪走向时氛围行写坏了：' + noArcMoods.join(' / '));
} else console.log('  ✓ 没答情绪走向时氛围退化为光线，不会写空');

// 上面那条「四镜氛围各不相同」必须真的跑过，否则等于没验证
if (!moodChecked) fail('「四镜氛围各不相同」这条断言没跑过（上面的分支被跳过了）');

// 单镜头 / 一镜到底 / 没选时长，都必须退回连续描述 —— 不能硬塞分镜表
const NOT_BOARD = [
  ['3-5 秒单镜头', { 'vid.shot': ['vsh.medium'], 'vid.move': ['vmv.push'], 'vid.duration': ['vdur.s5'] }],
  ['一镜到底', { 'vid.shot': FOUR_SHOTS, 'vid.move': ['vmv.orbit'], 'vid.duration': ['vdur.long'], 'vid.cut': ['vcut.oner'] }],
  ['只选了一个景别', { 'vid.shot': ['vsh.medium'], 'vid.move': ['vmv.push'], 'vid.duration': ['vdur.long'] }],
  ['没选时长', { 'vid.shot': FOUR_SHOTS, 'vid.move': ['vmv.push'] }],
];
const wronglyBoard = NOT_BOARD.filter(([, ans]) => videoCase(ans).promptText.indexOf('## 分镜表') !== -1)
  .map(([tag]) => tag);
if (wronglyBoard.length) fail('这些情况不该出分镜表，却出了：' + wronglyBoard.join(', '));
else console.log('  ✓ 单镜头 / 一镜到底 / 没选时长 都正确退回了连续描述');

// 没选「情绪配乐」就不该有 BGM 段
const noMusic = videoCase({ 'vid.shot': FOUR_SHOTS, 'vid.move': FOUR_MOVES, 'vid.duration': ['vdur.long'] });
if (noMusic.promptText.indexOf('## 背景音乐建议') !== -1) fail('没选情绪配乐却生成了 BGM 建议');
else console.log('  ✓ 没选情绪配乐时不生成 BGM 建议');

// 选了环境音但没配乐 → 用「听觉配合」兜住，别把音频诉求丢了
const ambientOnly = videoCase({ 'vid.shot': FOUR_SHOTS, 'vid.move': FOUR_MOVES, 'vid.duration': ['vdur.long'], 'vid.audio': ['vaud.ambient'] });
if (ambientOnly.promptText.indexOf('## 听觉配合') === -1 || ambientOnly.promptText.indexOf('环境音') === -1) {
  fail('只选环境音时，音频诉求没有落进结果');
} else console.log('  ✓ 只选环境音时用「听觉配合」段落兜住');

// 逐段描述必须能「单独使用」：每一镜都要自带主体，不能只靠开头的【核心主题】。
// 这条直接对应产品的用法说明 —— 超过 15 秒的片子，用户是逐镜生成再拼接的。
const SCENE_PHRASE = '一只撑伞的身影在雨夜街道上缓缓前行';
const pictureLines = board.promptText.split('\n').filter((l) => /^画面：/.test(l));
const standalone = [];
pictureLines.forEach((l, i) => {
  if (l.indexOf(SCENE_PHRASE) === -1) standalone.push('镜头 ' + (i + 1));
});
if (pictureLines.length !== FOUR_SHOTS.length) {
  fail('逐段描述的段数不对：' + pictureLines.length);
} else if (standalone.length) {
  fail('这些镜头的画面描述没有自带主体，单独拿去生成会不知道拍什么：' + standalone.join(', '));
} else {
  console.log('  ✓ 每镜的画面描述都自带主体（' + pictureLines.length + ' 段都能单独用）');
}

// 「作用」行要随位置变化：第一镜是开场、最后一镜是收尾、中间是推进
const roleLines = board.promptText.split('\n').filter((l) => /^作用：/.test(l));
const roleWrong = [];
if (roleLines.length !== FOUR_SHOTS.length) roleWrong.push('作用行数=' + roleLines.length);
else {
  if (roleLines[0].indexOf('开场') === -1) roleWrong.push('第 1 镜不是开场');
  if (roleLines[roleLines.length - 1].indexOf('收尾') === -1) roleWrong.push('最后一镜不是收尾');
  roleLines.slice(1, -1).forEach((l, i) => {
    if (l.indexOf('推进') === -1) roleWrong.push('第 ' + (i + 2) + ' 镜不是推进');
  });
  // 作用不能是同一句话复制粘贴 —— 那说明位置没被用上
  if (new Set(roleLines).size !== roleLines.length) roleWrong.push('作用行有重复');
}
if (roleWrong.length) fail('镜头作用有问题：' + roleWrong.join('; '));
else console.log('  ✓ 每镜都标了作用，且开场 / 推进 / 收尾随位置变化');

// 用户写一整段没有句号时，那一整段会在每一镜里重复 —— 长度必须被兜住
const runOn = '一只戴着宇航头盔的橘猫坐在月球表面'.repeat(30);
const runOnSession = Engine.createSession(runOn);
Engine.setScenario(runOnSession, 'video');
Object.assign(runOnSession.answers, {
  'vid.shot': FOUR_SHOTS, 'vid.move': FOUR_MOVES, 'vid.duration': ['vdur.long'],
});
const runOnOut = Engine.finalize(runOnSession).promptText;
const runOnPics = runOnOut.split('\n').filter((l) => /^画面：/.test(l));
const overLong = runOnPics.filter((l) => l.length > 140);
if (overLong.length) {
  fail('原话是一整段长句时，画面描述被撑爆了（最长 ' + Math.max(...runOnPics.map((l) => l.length)) + ' 字）');
} else {
  console.log('  ✓ 原话没有句号时长度被兜住（画面最长 ' + Math.max(...runOnPics.map((l) => l.length)) + ' 字）');
}

/* ---------------- 分镜有没有生成，结果区必须解释得清 ---------------- */

// 用户选了 4 个景别却拿到一段连续描述，只会以为功能坏了。
// 真正的原因往往只是时长题把镜头数卡到了 1 —— 引擎要把这层因果关系讲出来，
// 但只解释、不替他改。界面只负责渲染，规则不分叉。
const noticeCases = [
  ['一镜到底', { 'vid.shot': FOUR_SHOTS, 'vid.duration': ['vdur.long'], 'vid.cut': ['vcut.oner'] }, 'warn', '一镜到底'],
  ['4 景别 + 3-5 秒', { 'vid.shot': FOUR_SHOTS, 'vid.duration': ['vdur.s5'] }, 'warn', '只装得下 1 个镜头'],
  ['4 景别 + 15 秒以上', { 'vid.shot': FOUR_SHOTS, 'vid.duration': ['vdur.long'] }, null, ''],
  // 没答时长题 + 多个景别：这里曾经直接抛异常把结果页打崩（durs[0] 不存在）
  ['4 景别 + 没答时长', { 'vid.shot': FOUR_SHOTS }, 'warn', '还没定时长'],
  ['单镜头', { 'vid.shot': ['vsh.cu'], 'vid.duration': ['vdur.s5'] }, 'info', '2 个以上景别'],

  // 「分镜剪辑」= 用户明确要多个镜头 → 挡在分镜表前面的两个卡点是独立的：
  // 景别不够、时长装不下。必须**一次说全**，否则用户照做之后还是拿不到表，
  // 只会以为是自己没改对。第一条就是漏了时长那条的反例 ——
  // 对着「3-5 秒 · 单镜头」只写「再多选一个景别就能排了」，等于把人支到错的地方。
  ['分镜剪辑 + 1 景别 + 3-5 秒', { 'vid.shot': ['vsh.cu'], 'vid.duration': ['vdur.s5'], 'vid.cut': ['vcut.cut'] },
    'warn', ['再多选一个景别', '时长与节奏']],
  ['分镜剪辑 + 2 景别 + 3-5 秒', { 'vid.shot': ['vsh.cu', 'vsh.wide'], 'vid.duration': ['vdur.s5'], 'vid.cut': ['vcut.cut'] },
    'warn', '时长与节奏'],
  ['分镜剪辑 + 2 景别 + 没答时长', { 'vid.shot': ['vsh.cu', 'vsh.wide'], 'vid.cut': ['vcut.cut'] },
    'warn', '定一下时长'],
  // 两个卡点都齐了就不该再多嘴（说明只在真的排不出表时出现）
  ['分镜剪辑 + 4 景别 + 15 秒以上', { 'vid.shot': FOUR_SHOTS, 'vid.duration': ['vdur.long'], 'vid.cut': ['vcut.cut'] }, null, ''],
];
const noticeBad = [];
noticeCases.forEach(([name, answers, level, keyword]) => {
  const n = videoCase(answers).storyboardNotice;
  if (level === null) {
    if (n) noticeBad.push(name + ' 本来就是分镜，不该有说明，却给了：' + n.text);
    return;
  }
  if (!n) { noticeBad.push(name + ' 没给说明'); return; }
  if (n.level !== level) noticeBad.push(name + ' 级别应为 ' + level + '，实际 ' + n.level);
  // keyword 可以是字符串，也可以是数组（一条说明要同时点到好几件事时用数组）
  [].concat(keyword || []).forEach((kw) => {
    if (kw && n.text.indexOf(kw) === -1) noticeBad.push(name + ' 的措辞里没提「' + kw + '」');
  });
});
if (noticeBad.length) fail('分镜说明有问题：' + noticeBad.join('; '));
else console.log('  ✓ 没生成分镜时都给了「为什么 + 怎么改」，本来就是分镜时不多嘴');

// storyboard 标志必须和实际输出一致 —— 界面靠它决定标题写不写「分镜方案」
const flagBad = [];
[
  ['多镜头', { 'vid.shot': FOUR_SHOTS, 'vid.move': FOUR_MOVES, 'vid.duration': ['vdur.long'] }, true],
  ['单镜头', { 'vid.shot': ['vsh.cu'], 'vid.duration': ['vdur.s5'] }, false],
  ['一镜到底', { 'vid.shot': FOUR_SHOTS, 'vid.duration': ['vdur.long'], 'vid.cut': ['vcut.oner'] }, false],
].forEach(([name, answers, want]) => {
  const r = videoCase(answers);
  if (r.storyboard !== want) flagBad.push(name + ' 的 storyboard 应为 ' + want + '，实际 ' + r.storyboard);
  if (r.storyboard !== /^## 分镜表$/m.test(r.promptText)) {
    flagBad.push(name + ' 的 storyboard 标志和正文对不上');
  }
});
if (flagBad.length) fail('storyboard 标志有问题：' + flagBad.join('; '));
else console.log('  ✓ storyboard 标志与实际输出一致（界面据此切换标题）');

// 非视频链路不该出现分镜说明
['text', 'image'].forEach((fam) => {
  const s = Engine.createSession('测试输入');
  Engine.setScenario(s, SCENARIO_ID[fam]);
  const r = Engine.finalize(s);
  if (r.storyboardNotice) fail('[' + fam + '] 不该有分镜说明，却给了：' + r.storyboardNotice.text);
  if (r.storyboard) fail('[' + fam + '] 不该被标成 storyboard');
});
console.log('  ✓ 文字 / 图片链路不掺和分镜说明');

/* ================================================================ *
 * 四之三、评分维度必须接得住每一道题
 * ================================================================ *
 * 这一节存在的理由：dimOf 把 qid 映射成评分维度，但映射结果只在
 * scoreFinalPrompt 里按 key 去 scoreItemsFor(family) 里查。
 * 一旦某个 qid 映射到一个「表里没有的 key」，用户答了那道题分数纹丝不动 ——
 * 而且全程不报错。这个坑已经踩过两次（tone/depth→style、vid.audio→audio），
 * 所以这里做成通用不变量：不是修那 5 道题，而是让任何一道新题都对不上时立刻炸。
 */

console.log('\n' + '='.repeat(72));
console.log('四之三、评分维度一致性');

// 1. 三张表的权重必须各自加得起来 100
['SCORE_ITEMS', 'SCORE_ITEMS_IMAGE', 'SCORE_ITEMS_VIDEO'].forEach((name) => {
  const items = K[name];
  const sum = items.reduce((a, it) => a + it.weight, 0);
  if (sum !== 100) fail(`${name} 权重合计应为 100，实际 ${sum}`);
  else console.log(`  ✓ ${name} 权重合计 100（${items.length} 项）`);
});

// 2. 每个 family 里，从 FLOWS 出发沿 followUps 能走到的题，dimOf 必须落在真实维度上。
//    只沿「属于本 family 的场景」的 perScenario 分支走，避免把别家的追问题算进来。
function reachableIn(fam) {
  const seen = new Set();
  const queue = [];
  ['core', 'tail'].forEach((k) => (K.FLOWS[fam][k] || []).forEach((q) => queue.push(q)));
  let guard = 0;
  while (queue.length && guard < 2000) {
    guard += 1;
    const qid = queue.shift();
    if (seen.has(qid)) continue;
    const q = K.QUESTIONS[qid];
    if (!q) continue;
    seen.add(qid);
    (q.options || []).forEach((o) => (o.followUps || []).forEach((f) => queue.push(f)));
    const per = q.perScenario;
    if (per) {
      Object.keys(per).forEach((sc) => {
        const scFam = K.familyOf ? K.familyOf(sc) : fam;
        if (scFam && scFam !== fam) return;
        (per[sc] || []).forEach((o) => {
          if (o && typeof o === 'object') (o.followUps || []).forEach((f) => queue.push(f));
        });
      });
    }
  }
  return seen;
}

// 每个 family 对应的「代表场景」—— perScenario 的题在不同场景下选项不一样，
// 读选项必须走 getQuestion，直接读 K.QUESTIONS 会拿到不属于这个场景的选项。
// （SCENARIO_ID 定义在文件顶部，四之二之前就要用。）

/**
 * 为每道可达题算一条「从流程根走到它」的路径，返回路上要选上的那些选项。
 *
 * 为什么需要：有 21 道题只作为追问出现（vid.bgm、format.article.length、
 * img.subject.person、role.stance …）。单答这些题时，它们的父题没被选中，
 * 追问链本来就是断的 —— 片段不进输出是设计，不是 bug。
 * 要验证「选了就该进输出」，必须先把父题也选上。
 *
 * 用法：Object.assign(session.answers, pathTo(fam, qid)) 再补上目标题本身。
 */
function pathTo(fam, target) {
  const sc = SCENARIO_ID[fam];
  const flow = K.FLOWS[fam];
  const prev = {};
  const seen = {};
  const queue = (flow.core || []).concat(flow.tail || []);
  queue.forEach((q) => { seen[q] = true; });

  let guard = 0;
  while (queue.length && guard < 2000) {
    guard += 1;
    const qid = queue.shift();
    const q = Engine.getQuestion(qid, sc);
    if (!q) continue;
    (q.options || []).forEach((opt) => {
      (opt.followUps || []).forEach((f) => {
        if (seen[f]) return;
        seen[f] = true;
        prev[f] = { parent: qid, optId: opt.id };
        queue.push(f);
      });
    });
  }

  // 回溯：把「走到目标题」这条链上的父选项都挑出来
  const picks = {};
  let cur = target;
  let hops = 0;
  while (prev[cur] && hops < 30) {
    hops += 1;
    picks[prev[cur].parent] = [prev[cur].optId];
    cur = prev[cur].parent;
  }
  return picks;
}

['text', 'image', 'video'].forEach((fam) => {
  const keys = new Set(K.scoreItemsFor(fam).map((it) => it.key));
  const problems = [];
  let checked = 0;
  reachableIn(fam).forEach((qid) => {
    checked += 1;
    const dim = Engine.dimOf(qid, fam);
    if (!dim) { problems.push(qid + ' → 没有维度'); return; }
    if (!keys.has(dim)) problems.push(qid + ' → ' + dim + '（评分表里没有）');
  });
  if (problems.length) {
    fail(`[${fam}] 这些题答了也不加分：` + problems.join('; '));
  } else {
    console.log(`  ✓ [${fam}] ${checked} 道可达题全部映射到真实评分维度`);
  }
  if (checked === 0) fail(`[${fam}] 一道可达题都没扫到，说明扫描逻辑本身坏了`);
});

// 3. 反向也要成立：评分表里的每一项，都至少有一道题能把它填上。
//    否则会出现「表里有 14 分，但永远拿不到」的空头分。
['text', 'image', 'video'].forEach((fam) => {
  const used = new Set();
  reachableIn(fam).forEach((qid) => {
    const dim = Engine.dimOf(qid, fam);
    if (dim) used.add(dim);
  });
  const dead = K.scoreItemsFor(fam).filter((it) => !used.has(it.key)).map((it) => it.key);
  if (dead.length) fail(`[${fam}] 这些评分维度没有任何题能填上（空头分）：` + dead.join(', '));
  else console.log(`  ✓ [${fam}] 每个评分维度都有题负责`);
});

// 4. 静态映射对了还不够 —— 还得确认 scoreFinalPrompt 真的去读了那个维度。
//    做法：从零分起「只答这一题」，得分必须 > 0。
//    注意不能反过来做「全答了再去掉一题」：同维度的兄弟题会把空缺兜住
//    （text 的 role 与 role.stance 都映射到 role），那样测出来的是假阳性。
//
//    追问型的题要先选上父题（pathTo）：父题没选，这题就不在流程上，
//    引擎不读它的答案 —— 那是设计，不是「答了不加分」。
['text', 'image', 'video'].forEach((fam) => {
  const zero = [];
  let checked = 0;
  reachableIn(fam).forEach((qid) => {
    const q = Engine.getQuestion(qid, SCENARIO_ID[fam]);
    if (!q || !q.options || !q.options.length) return;
    const first = q.options.filter((o) => !o.skip && !o.custom && o.fragment)[0];
    if (!first) return;
    checked += 1;
    const s = Engine.createSession('测试输入');
    Engine.setScenario(s, SCENARIO_ID[fam]);
    Object.assign(s.answers, pathTo(fam, qid));
    s.answers[qid] = [first.id];
    if (Engine.scoreFinalPrompt(s).total === 0) zero.push(qid);
  });
  if (!checked) fail(`[${fam}] 一道题都没测到，说明扫描逻辑本身坏了`);
  else if (zero.length) fail(`[${fam}] 这些题答了分数纹丝不动（只答它仍得 0 分）：` + zero.join(', '));
  else console.log(`  ✓ [${fam}] ${checked} 道题单独答都能推动得分`);
});

/* ================================================================ *
 * 四之四、选了就必须进得了输出
 * ================================================================ *
 * 这一节存在的理由：「答了不加分」和「选了不进输出」是同一类静默失效 ——
 * 界面上一路点下来一切正常，成品里却少了一整块，全程不报错。
 * 图片 / 视频的第一题（intent）就是这么被吞掉的：它的 dim 是 task，
 * 而组装连续描述时把 task 整块跳过了，七个用途选项答了等于没答。
 * 所以这里做成通用不变量，而不是去修那 13 个选项。
 */

console.log('\n' + '='.repeat(72));
console.log('四之四、选了就必须进得了输出');

/**
 * 少数题的片段要「配上上下文」才成立，单答它时按设计不输出。
 * 这里给它补上上下文，然后**照常要求片段进输出** ——
 * 不是豁免，而是把「这题在什么条件下才生效」也一起钉死。
 */
const NEEDS_CONTEXT = {
  // 焦点只对近处景别成立：全景里让观众看清面部表情是自相矛盾的。
  // 单答这一题时一个景别都没选，焦点按设计被过滤掉。
  'vid.focus': { 'vid.shot': ['vsh.cu'] },
};

const lost = [];
let optionChecked = 0;
['text', 'image', 'video'].forEach((fam) => {
  reachableIn(fam).forEach((qid) => {
    const q = Engine.getQuestion(qid, SCENARIO_ID[fam]);
    if (!q || !q.options || !q.options.length) return;
    // 追问型的题要先把父题选上，否则它压根不在流程上（那是设计，见四之五）
    const pre = Object.assign({}, pathTo(fam, qid), NEEDS_CONTEXT[qid] || {});

    q.options.forEach((opt) => {
      if (!opt.fragment || opt.skip || opt.custom) return;
      optionChecked += 1;
      const s = Engine.createSession('一只撑伞的身影在雨夜街道上缓缓前行');
      Engine.setScenario(s, SCENARIO_ID[fam]);
      Object.assign(s.answers, pre);
      s.answers[qid] = [opt.id];
      const r = Engine.finalize(s);
      const hay = (r.promptText || '') + '\n' + (r.negativePrompt || '');
      // 片段可能被拼进一句话里，所以只取前 8 个字符做存在性判断
      if (hay.indexOf(String(opt.fragment).slice(0, 8)) === -1) {
        lost.push('[' + fam + '] ' + qid + ' → ' + opt.id
          + '「' + String(opt.fragment).slice(0, 14) + '…」');
      }
    });
  });
});
if (!optionChecked) fail('一个选项都没试到，说明扫描逻辑本身坏了');
else if (lost.length) {
  fail('这些选项选了却进不了输出（' + lost.length + '/' + optionChecked + '）：'
    + lost.slice(0, 8).join('; '));
} else console.log('  ✓ ' + optionChecked + ' 个选项逐个试过，片段都进了输出');

// 分镜是另一条组装路径（buildVideoStoryboard），它自己按 qid 取选项、
// 自己拼表，上面那条断言覆盖不到，必须单独过一遍。
// 判据放宽一档：片段 / label / 明确的替代物，三者有其一就算有交代。
// 分镜表里景别是用 label 表达的（写「近景」而不是「近景，取景到人物胸部以上」），
// 那是刻意的替代 —— 片段和取景指令几乎是同一句话，两句都写会读成重复。
const SB_SUBSTITUTE_OK = {
  // 时长题的片段「时长 10-15 秒，包含 2-3 个镜头切换」被【时长与结构】
  // 里的精确秒数 + 镜头数替代（共 15 秒，3 个镜头）。精确值比区间更有用。
  'vid.duration': /^【时长与结构】共 \d+ 秒，\d+ 个镜头/m,
};

const sbAnswers = {};
reachableIn('video').forEach((qid) => {
  const q = Engine.getQuestion(qid, 'video');
  if (!q || !q.options || !q.options.length) return;
  const ids = q.options.filter((o) => !o.skip && !o.custom && o.fragment).slice(0, 1).map((o) => o.id);
  if (ids.length) sbAnswers[qid] = ids;
});
// 强制走到分镜分支（多景别 + 15 秒），并且让「情绪配乐 → 配乐类型」
// 这条追问链是活的，否则 vid.bgm 会被正确地判为不生效。
Object.assign(sbAnswers, {
  'vid.shot': ['vsh.close', 'vsh.wide', 'vsh.medium'],
  'vid.duration': ['vdur.s15'],
  'vid.audio': ['vaud.music'],
  'vid.bgm': ['vbgm.piano'],
});

const sbSession = Engine.createSession('雨中漫步，主打情绪氛围感。一只撑伞的身影在雨夜街道上缓缓前行');
Engine.setScenario(sbSession, 'video');
Object.assign(sbSession.answers, sbAnswers);
const sbResult = Engine.finalize(sbSession);
const sbHay = sbResult.promptText + '\n' + sbResult.negativePrompt;

const sbLost = [];
let sbChecked = 0;
Object.keys(sbAnswers).forEach((qid) => {
  const q = Engine.getQuestion(qid, 'video');
  if (!q) return;
  sbAnswers[qid].forEach((id) => {
    const o = q.options.find((x) => x.id === id);
    if (!o || !o.fragment) return;
    sbChecked += 1;
    const byFragment = sbHay.indexOf(String(o.fragment).slice(0, 8)) !== -1;
    const byLabel = !!o.label && sbHay.indexOf(o.label) !== -1;
    const byAlt = !!(SB_SUBSTITUTE_OK[qid] && SB_SUBSTITUTE_OK[qid].test(sbHay));
    if (!byFragment && !byLabel && !byAlt) {
      sbLost.push(qid + ' → ' + id + '「' + String(o.fragment).slice(0, 14) + '…」');
    }
  });
});
if (!sbResult.storyboard) {
  fail('分镜分支没被触发，这一节等于没测（前置条件写错了）');
} else if (sbLost.length) {
  fail('分镜分支里这些选项没进输出：' + sbLost.join('; '));
} else {
  console.log('  ✓ 分镜分支里 ' + sbChecked + ' 个选项都有交代（片段 / label / 精确值）');
}

// 上面这条断言必须真的扫到了东西，否则「分镜分支」四个字就是空的
if (!sbChecked) fail('分镜分支一个选项都没扫到，说明前置条件本身坏了');

// 变异测试：故意把 intent 的片段从组装里拿掉，上面那条断言必须报错。
// 不会失败的断言等于没有，而且会给人虚假的安全感。
const mutatedLost = (function () {
  const s = Engine.createSession('一只撑伞的身影在雨夜街道上缓缓前行');
  Engine.setScenario(s, 'image');
  s.answers.intent = ['im.intent.poster'];
  const r = Engine.finalize(s);
  const hay = r.promptText + '\n' + r.negativePrompt;
  return hay.indexOf('商业海报用途') === -1;
})();
if (mutatedLost) {
  fail('变异测试失败：intent 的片段没进输出 —— 四之四的断言本该抓到它');
} else {
  console.log('  ✓ 变异测试：intent 片段确实在输出里（拿掉就会被抓到）');
}

/* ================================================================ *
 * 四之五、追问链断掉的旧答案不许再生效
 * ================================================================ *
 * 这一节存在的理由：有 21 道题只作为追问出现。用户先答了追问、再回头把父题
 * 换成另一条分支时，那条追问答案就成了孤儿 —— 可它的片段照样会被拼进 Prompt。
 * 典型症状：声音选了「不需要声音」，成品里却写着「慢板钢琴」。
 * 「改上一处」不会清空追问链上的旧答案（清空了用户就没法改回来），
 * 所以这个判断必须由引擎在装配时做。
 */

console.log('\n' + '='.repeat(72));
console.log('四之五、追问链断掉的旧答案不许再生效');

/** 造一个视频 session */
function vCase(answers) {
  const s = Engine.createSession('一只撑伞的身影在雨夜街道上缓缓前行');
  Engine.setScenario(s, 'video');
  Object.assign(s.answers, answers);
  return Engine.finalize(s);
}

const staleBad = [];

// 1) 反向守卫：追问链还活着，答案就必须照常生效。
//    没有这一条，把 activeQids 写成「永远返回空」也能让下面的断言全过。
const stillActive = vCase({ 'vid.audio': ['vaud.music'], 'vid.bgm': ['vbgm.piano'] });
if (stillActive.promptText.indexOf('慢板钢琴') === -1) {
  staleBad.push('追问链还活着，配乐却没进输出（这条要是挂了，说明不是修好了，是整块不生效）');
}

// 2) 父题改分支 → 旧追问答案失效
const staleBgm = vCase({ 'vid.audio': ['vaud.none'], 'vid.bgm': ['vbgm.piano'] });
if (staleBgm.promptText.indexOf('慢板钢琴') !== -1) {
  staleBad.push('声音选了「不需要声音」，成品里却还有慢板钢琴');
}
if (staleBgm.promptText.indexOf('不需要音频') === -1) {
  staleBad.push('选了「不需要声音」，「只描述画面，不需要音频」这句没进输出');
}
if (staleBgm.promptText.indexOf('## 背景音乐建议') !== -1) {
  staleBad.push('声音选了「不需要声音」，却还是生成了背景音乐建议段');
}

// 3) 同一类问题在文字链路上也要拦住：格式从「文章」改成「代码」，
//    残留的「全文约 1500 字」不能再进 Prompt（否则代码要求 1500 字，自相矛盾）
function tCase(answers) {
  const s = Engine.createSession('帮我写一份季度复盘');
  Engine.setScenario(s, 'general');
  Object.assign(s.answers, answers);
  return Engine.finalize(s);
}
const articleKept = tCase({ format: ['fmt.article'], 'format.article.length': ['alen.mid'] });
if (articleKept.promptText.indexOf('1500') === -1) {
  staleBad.push('格式还是「文章」时，篇幅要求没进输出（反向守卫失败）');
}
const articleStale = tCase({ format: ['fmt.code'], 'format.article.length': ['alen.mid'] });
if (articleStale.promptText.indexOf('1500') !== -1) {
  staleBad.push('格式已改成「代码」，残留的文章篇幅「1500 字」还在输出里');
}

if (staleBad.length) fail('追问链失效判断有问题：' + staleBad.join('; '));
else console.log('  ✓ 父题换分支后旧追问答案不再生效；父题换回来它照常生效');

// 4) 分数必须跟着同一条规则走：不进 Prompt 的答案不许再加分，
//    否则「完整度 93 分」是在替一段不在 Prompt 里的内容背书。
//
//    正常流程里这一点看不出来：能答到追问，就说明父题一定选了，
//    而父题和追问共用同一个评分维度（format 与 format.article.length 都算 format），
//    父题已经把这一维点亮了。所以这里必须造一份脏数据 ——
//    导入 / 旧存档完全可能是这个形状：父题跳过了，追问却留着答案。
const dirtyStale = Engine.createSession('帮我写一份季度复盘');
Engine.setScenario(dirtyStale, SCENARIO_ID.text);
Object.assign(dirtyStale.answers, {
  format: ['__skip__'],
  'format.article.length': ['alen.mid'],
});
const dirtyLive = Engine.createSession('帮我写一份季度复盘');
Engine.setScenario(dirtyLive, SCENARIO_ID.text);
Object.assign(dirtyLive.answers, {
  format: ['fmt.article'],
  'format.article.length': ['alen.mid'],
});
const sStale = Engine.scoreFinalPrompt(dirtyStale).total;
const sLive = Engine.scoreFinalPrompt(dirtyLive).total;
if (sStale >= sLive) {
  fail('残留的追问答案还在加分：失效态 ' + sStale + ' 分 >= 生效态 ' + sLive + ' 分');
} else {
  console.log('  ✓ 不生效的答案不再加分（' + sStale + ' < ' + sLive + '）');
}

// 5) 界面要知道哪些行不生效，才能标出来。这条判断只能有一份实现 ——
//    引擎的 activeQids 就是那份，界面直接调它，不自己再推一遍流程。
const mapSession = Engine.createSession('一只撑伞的身影在雨夜街道上缓缓前行');
Engine.setScenario(mapSession, 'video');
Object.assign(mapSession.answers, { 'vid.audio': ['vaud.none'], 'vid.bgm': ['vbgm.piano'] });
const activeMap = Engine.activeQids(mapSession);
const mapBad = [];
if (activeMap['vid.bgm']) mapBad.push('vid.bgm 已经断了，activeQids 却说它还在');
if (!activeMap['vid.audio']) mapBad.push('vid.audio 明明选着，activeQids 却说它失效了');
if (mapBad.length) fail('activeQids 的结论不对：' + mapBad.join('; '));
else console.log('  ✓ activeQids 的结论和装配结果一致（界面据此标「当前未生效」）');

/* ================================================================ *
 * 四之六、分镜表的人工编辑
 * ================================================================ */

console.log('\n' + '='.repeat(72));
console.log('四之六、分镜表的人工编辑（顺序 / 时长 / 内容）');

/**
 * 拆出配乐「情绪走向」那一行的三段区间。
 * 没有中段时 midStart / midEnd 为 null（两镜的正常形态）。
 */
function bgmSegments(text) {
  const line = (text.split('\n').filter((l) => /^情绪走向：前 /.test(l))[0] || '');
  if (!line) return null;
  const toSec = (m, i) => Number(m[i]) * 60 + Number(m[i + 1]);
  const first = /前 (\d+) 秒/.exec(line);
  const last = /结尾 (\d+) 秒/.exec(line);
  const mid = /中段（(\d+):(\d+) - (\d+):(\d+)）/.exec(line);
  return {
    line,
    firstSec: first ? Number(first[1]) : null,
    midStart: mid ? toSec(mid, 1) : null,
    midEnd: mid ? toSec(mid, 3) : null,
    lastSec: last ? Number(last[1]) : null,
  };
}

const BASE_ANSWERS = {
  'vid.shot': FOUR_SHOTS,
  'vid.move': FOUR_MOVES,
  'vid.duration': ['vdur.long'],
};

// ---- 1) 有没有分镜表，由引擎说了算；界面只是照着显示/隐藏按钮 ----
const noBoard = [
  ['单镜头（3-5 秒）', { 'vid.shot': ['vsh.cu'], 'vid.move': ['vmv.push'], 'vid.duration': ['vdur.s5'] }],
  ['一镜到底', { 'vid.shot': FOUR_SHOTS, 'vid.move': FOUR_MOVES, 'vid.duration': ['vdur.long'], 'vid.cut': ['vcut.oner'] }],
];
const availWrong = noBoard.filter(([, a]) => Engine.storyboardPlan(videoSession(a)).available);
if (availWrong.length) {
  fail('这些情况不该给「编辑分镜表」按钮，storyboardPlan 却说 available：'
    + availWrong.map(([n]) => n).join('、'));
} else console.log('  ✓ 单镜头 / 一镜到底时 storyboardPlan.available=false（按钮不该出现）');

const editSession = videoSession(BASE_ANSWERS);
const plan0 = Engine.storyboardPlan(editSession);
if (!plan0.available) fail('多镜头视频应当有分镜表可编辑');
else if (plan0.n !== 4 || plan0.total !== 20) {
  fail('自动计划应当是 4 镜 20 秒，实际 ' + plan0.n + ' 镜 ' + plan0.total + ' 秒');
} else if (plan0.fromManual) fail('没人改过，fromManual 却是 true');
else console.log('  ✓ 自动计划：4 个镜头 / 共 20 秒，fromManual=false');

// ---- 2) 可选项必须覆盖「全部景别」，不只是用户选中的那几个 ----
//     手工编辑可以把某一镜换成他原本没选的景别，只在已选列表里找就会拿不到 label。
const allShotOpts = K.QUESTIONS['vid.shot'].options.filter((o) => !o.skip && !o.custom && o.fragment);
const allMoveOpts = K.QUESTIONS['vid.move'].options.filter((o) => !o.skip && !o.custom && o.fragment);
if (plan0.shotChoices.length !== allShotOpts.length) {
  fail('shotChoices 只有 ' + plan0.shotChoices.length + ' 项，应当覆盖全部 '
    + allShotOpts.length + ' 个景别（手工编辑可以换成没选过的景别）');
} else if (plan0.moveChoices.length !== allMoveOpts.length) {
  fail('moveChoices 只有 ' + plan0.moveChoices.length + ' 项，应当覆盖全部 ' + allMoveOpts.length + ' 个运镜');
} else if (!plan0.shotChoices.every((c) => plan0.framingById[c.id])) {
  fail('有景别取不到 framingById，界面上「恢复取景指令」会点成空');
} else if (!plan0.secMin || plan0.secMax <= plan0.secMin) {
  fail('时长上下限没给对：' + plan0.secMin + '–' + plan0.secMax);
} else if (plan0.shotMin !== 2 || plan0.shotMax < plan0.autoN) {
  fail('镜头数的上下限没给对：' + plan0.shotMin + '–' + plan0.shotMax
    + '（自动计划 ' + plan0.autoN + ' 镜应当落在区间里）');
} else if (!plan0.resetByTitles.length) {
  fail('resetByTitles 是空的 —— 界面上就没法说清「改哪几道题会让手工调整作废」');
} else {
  console.log('  ✓ 可选景别 ' + plan0.shotChoices.length + ' 项 / 运镜 ' + plan0.moveChoices.length
    + ' 项全覆盖，时长 ' + plan0.secMin + '–' + plan0.secMax + ' 秒、镜头数 '
    + plan0.shotMin + '–' + plan0.shotMax + ' 个，重置规则已给出');
}

// ---- 3) 重排 + 改时长 + 改内容，三件事要一起生效 ----
//     这是用户提的核心诉求：分镜表的顺序、时长、每一格的内容都要能人为改。
const moved = [
  { shotId: 'vsh.medium', moveId: 'vmv.orbit', seconds: 5, cell: '中景的取景指令', focus: false },
  { shotId: 'vsh.close', moveId: 'vmv.track', seconds: 5, cell: '近景的取景指令', focus: false },
  { shotId: 'vsh.wide', moveId: 'vmv.pull', seconds: 5, cell: '全景的取景指令', focus: false },
  { shotId: 'vsh.cu', moveId: 'vmv.push', seconds: 8, cell: '伞面上的雨珠一颗颗往下滚', focus: false },
];
if (Engine.setStoryboardEdit(editSession, moved) !== true) {
  fail('合法的手工调整被 setStoryboardEdit 拒了');
} else {
  const out = Engine.finalize(editSession).promptText;
  const rows = boardRows(out);
  const codes = boardCodes(out);
  const total = boardTotalLine(out);
  const problems = [];
  if (rows.length !== 4) problems.push('镜头数变成 ' + rows.length);
  // 顺序：用户把特写挪到了最后
  if ((rows[3] || {}).shot !== '特写') problems.push('最后一镜应当是特写，实际 ' + (rows[3] || {}).shot);
  if ((rows[0] || {}).shot !== '中景') problems.push('第一镜应当是中景，实际 ' + (rows[0] || {}).shot);
  // 时长
  if ((rows[3] || {}).sec !== 8) problems.push('最后一镜应当是 8 秒，实际 ' + (rows[3] || {}).sec);
  if (total.indexOf('共 23 秒') === -1) problems.push('总时长没按手改值重算：' + total);
  if (total.indexOf('4 个镜头') === -1) problems.push('镜头数没写对：' + total);
  // 内容
  if ((rows[3] || {}).cell !== '伞面上的雨珠一颗颗往下滚') problems.push('手写的镜头内容没进表');
  // 时间码必须按新顺序重新推导，不能沿用自动计划那一份
  if (codes.length !== 4) problems.push('时间码数量不对：' + codes.length);
  else if (codes[3][0] !== '00:15' || codes[3][1] !== '00:23') {
    problems.push('末段时间码没跟着时长走：' + codes[3].join(' - '));
  }
  // 景别从「中景」推进到「特写」—— 头部的这句也要跟着重排后的首尾走
  if (total.indexOf('景别从「中景」推进到「特写」') === -1) {
    problems.push('头部没跟着重排后的首尾镜头改：' + total);
  }
  if (problems.length) fail('手工调整没有完整生效：' + problems.join('; '));
  else console.log('  ✓ 重排 / 改时长 / 改内容三件事一起生效，总时长与时间码按新顺序重算');
}

// ---- 4) 结构性问题一律作废，不许「凑合着渲染」 ----
//     注意「条数」现在只校验**范围**（2–12），不校验「等于自动计划的条数」——
//     加减镜头是用户的正当操作。
const tooMany = Array.from({ length: 13 }, (_, i) => Object.assign({}, moved[i % 4], { seconds: 1 }));
const badEdits = [
  ['只剩 1 镜（低于下限）', moved.slice(0, 1)],
  ['13 镜（超过上限）', tooMany],
  ['空数组', []],
  ['景别 id 不存在', moved.map((m, i) => (i ? m : Object.assign({}, m, { shotId: 'vsh.nope' })))],
  ['时长不是数', moved.map((m, i) => (i ? m : Object.assign({}, m, { seconds: '五秒' })))],
  ['混进了 null', moved.map((m, i) => (i ? m : null))],
  ['根本不是数组', { shots: moved }],
];
const badAccepted = [];
badEdits.forEach(([name, draft]) => {
  const s = videoSession(BASE_ANSWERS);
  if (Engine.setStoryboardEdit(s, draft) !== false) badAccepted.push(name);
  else if (s.storyboardEdit) badAccepted.push(name + '（拒绝了却还是写进了 session）');
});
if (badAccepted.length) fail('这些脏数据本该被拒：' + badAccepted.join('、'));
else console.log('  ✓ 7 种结构性脏数据全部被拒（含条数越界，且不会污染 session）');

// ---- 4b) 加减镜头：条数由用户决定，不再等于「选了几个景别」 ----
//     这是「每个决定都由用户做」在分镜表上的最后一块 ——
//     前面几版只能改顺序 / 时长 / 内容，镜头数还是引擎算的。
const growSession = videoSession(BASE_ANSWERS);
const baseEntries = Engine.storyboardPlan(growSession).shots.map((s) => ({
  shotId: s.shotId, moveId: s.moveId, seconds: s.seconds, cell: s.cell, focus: s.focus,
}));

// 删掉第 2 镜 → 3 镜
const shrunk = baseEntries.slice(0, 1).concat(baseEntries.slice(2));
if (Engine.setStoryboardEdit(growSession, shrunk) !== true) {
  fail('删掉一镜被 setStoryboardEdit 拒了（镜头数不该被自动计划锁死）');
} else {
  const plan = Engine.storyboardPlan(growSession);
  const rows = boardRows(Engine.finalize(growSession).promptText);
  const total = boardTotalLine(Engine.finalize(growSession).promptText);
  const problems = [];
  if (plan.n !== 3) problems.push('storyboardPlan.n 应为 3，实际 ' + plan.n);
  if (plan.autoN !== 4) problems.push('autoN 应仍是 4（自动计划本来排了 4 镜）');
  if (rows.length !== 3) problems.push('渲染出 ' + rows.length + ' 行');
  if (rows.map((r) => r.shot).join(',') === '特写,中景,近景,全景') problems.push('删掉的那一镜还在表里');
  if (rows[1].shot !== '近景') problems.push('删完之后第 2 镜应当是近景，实际 ' + rows[1].shot);
  // 删掉一镜之后总时长必须跟着减，时间码要重排（不能留个洞）
  if (total.indexOf('共 15 秒') === -1) problems.push('总时长没跟着减：' + total);
  if (total.indexOf('3 个镜头') === -1) problems.push('镜头数没写对：' + total);
  const codes = boardCodes(Engine.finalize(growSession).promptText);
  if (codes.length !== 3 || codes[2][1] !== '00:15') {
    problems.push('时间码没重排：' + codes.map((c) => c.join('-')).join(' '));
  }
  if (problems.length) fail('删镜头没有完整生效：' + problems.join('; '));
  else console.log('  ✓ 删掉一镜：表格少一行、总时长跟着减、时间码重排不留洞');
}

// 加两镜 → 6 镜（同时验证默认值：优先挑没用过的景别、不能是空格子）
const grownSession = videoSession(BASE_ANSWERS);
const grown = baseEntries.slice();
let addProblems = [];
for (let k = 0; k < 2; k += 1) {
  const nw = Engine.storyboardNewShot(grownSession, grown.map((e) => e.shotId), grown[grown.length - 1]);
  if (!nw) { addProblems.push('storyboardNewShot 返回了 null'); break; }
  if (grown.some((e) => e.shotId === nw.shotId)) {
    // 还有没用过的景别时，不该重复
    const free = Engine.storyboardPlan(grownSession).shotChoices
      .filter((c) => !grown.some((e) => e.shotId === c.id));
    if (free.length) addProblems.push('还有没用过的景别「' + free[0].label + '」，却重复用了「' + nw.shotId + '」');
  }
  if (!nw.cell) addProblems.push('新镜头是空格子');
  if (!(nw.seconds >= 1 && nw.seconds <= 60)) addProblems.push('新镜头秒数越界：' + nw.seconds);
  grown.push(nw);
}
if (!addProblems.length && Engine.setStoryboardEdit(grownSession, grown) !== true) {
  addProblems.push('加到 6 镜被 setStoryboardEdit 拒了');
}
if (!addProblems.length) {
  const plan = Engine.storyboardPlan(grownSession);
  const rows = boardRows(Engine.finalize(grownSession).promptText);
  if (plan.n !== 6) addProblems.push('storyboardPlan.n 应为 6，实际 ' + plan.n);
  if (rows.length !== 6) addProblems.push('渲染出 ' + rows.length + ' 行');
  if (rows.some((r) => !r.cell)) addProblems.push('有镜头的「镜头内容」是空的');
  const head = boardTotalLine(Engine.finalize(grownSession).promptText);
  const sum = rows.reduce((a, r) => a + r.sec, 0);
  if (head.indexOf('共 ' + sum + ' 秒') === -1) addProblems.push('总时长没重算：' + head);
  // 超过时长题估算的镜头上限（maxShots=4）也要能存下来 —— 用户自己填秒数，不该被卡住
  if (plan.maxShots >= 6) addProblems.push('（前置）这组答案的 maxShots 应当小于 6，实际 ' + plan.maxShots);
}
if (addProblems.length) fail('加镜头没有完整生效：' + addProblems.join('; '));
else console.log('  ✓ 加两镜到 6 个（超过时长题估的 4 个上限）：默认挑没用过的景别、内容不留空');

// 首尾同景别时，头部那句不能写成「从「中景」推进到「中景」」
const twinSession = videoSession(BASE_ANSWERS);
Engine.setStoryboardEdit(twinSession, [
  { shotId: 'vsh.wide', moveId: 'vmv.pull', seconds: 5, cell: '', focus: false },
  { shotId: 'vsh.medium', moveId: 'vmv.track', seconds: 5, cell: '', focus: false },
  { shotId: 'vsh.wide', moveId: 'vmv.push', seconds: 5, cell: '', focus: false },
]);
const twinHead = boardTotalLine(Engine.finalize(twinSession).promptText);
if (twinHead.indexOf('推进到') !== -1) {
  fail('首尾同景别时头部写出了病句：' + twinHead);
} else if (twinHead.indexOf('全片以「全景」为主') === -1) {
  fail('首尾同景别时头部没说清主景别：' + twinHead);
} else console.log('  ✓ 首尾同景别时头部改说「全片以「全景」为主」，不写病句');

// ---- 5) 数值越界是「夹住」而不是「作废」—— 用户不该因为填了 999 就白改一整张表 ----
const clampSession = videoSession(BASE_ANSWERS);
Engine.setStoryboardEdit(clampSession, moved.map((m, i) => Object.assign({}, m, {
  seconds: [0, 999, 5, 5][i],
  // 顺手塞一个不存在的运镜 id：应当退化成「固定机位」，而不是把整张表作废
  moveId: i === 2 ? 'vmv.nope' : m.moveId,
})));
const clampRows = boardRows(Engine.finalize(clampSession).promptText);
const clampProblems = [];
if (clampRows[0].sec !== 1) clampProblems.push('0 秒应夹到 1，实际 ' + clampRows[0].sec);
if (clampRows[1].sec !== 60) clampProblems.push('999 秒应夹到 60，实际 ' + clampRows[1].sec);
if (clampRows[2].move !== '固定机位') clampProblems.push('无效运镜应退成固定机位，实际 ' + clampRows[2].move);
// 界面上会拿引擎存下来的值重绘，所以「存下来的值」和「渲染出来的值」必须一致
if (Engine.storyboardPlan(clampSession).shots[1].seconds !== 60) {
  clampProblems.push('storyboardPlan 给的秒数和渲染出来的对不上（界面会显示成另一个值）');
}
const clampTotal = boardTotalLine(Engine.finalize(clampSession).promptText);
if (clampTotal.indexOf('共 ' + clampRows.reduce((a, r) => a + r.sec, 0) + ' 秒') === -1) {
  clampProblems.push('夹取之后总时长没重算：' + clampTotal);
}
if (clampProblems.length) fail('越界处理不对：' + clampProblems.join('; '));
else console.log('  ✓ 时长越界被夹到 1–60 秒、无效运镜退成固定机位，且界面值与输出值一致');

// ---- 6) 空掉的「镜头内容」要回落到取景指令 ----
//     留一格空白，生成工具就不知道这一镜拍什么 —— 这是「静默失效」最容易钻进来的地方。
const blankSession = videoSession(BASE_ANSWERS);
Engine.setStoryboardEdit(blankSession, moved.map((m) => Object.assign({}, m, { cell: '' })));
const blankRows = boardRows(Engine.finalize(blankSession).promptText);
if (blankRows.some((r) => !r.cell)) fail('有镜头的「镜头内容」是空的（清空后没有回落到取景指令）');
else if (blankRows[3].cell !== plan0.framingById['vsh.cu']) {
  fail('回落的内容不是该景别的取景指令：' + blankRows[3].cell);
} else console.log('  ✓ 「镜头内容」清空后回落到该景别的取景指令，不留空格子');

// ---- 7) 换成全景之后，勾着的「细节焦点」必须自己掉下去 ----
//     全景里让观众看清面部表情是自相矛盾的 —— 这条规则和自动计划共用 FOCUS_SHOTS。
const focusSession = videoSession(Object.assign({}, BASE_ANSWERS, { 'vid.focus': ['vfoc.face'] }));
Engine.setStoryboardEdit(focusSession, [
  { shotId: 'vsh.cu', moveId: 'vmv.push', seconds: 5, cell: '', focus: true },
  { shotId: 'vsh.wide', moveId: 'vmv.pull', seconds: 5, cell: '', focus: true },
  { shotId: 'vsh.close', moveId: 'vmv.track', seconds: 5, cell: '', focus: true },
  { shotId: 'vsh.medium', moveId: 'vmv.orbit', seconds: 5, cell: '', focus: true },
]);
const focusOut = Engine.finalize(focusSession).promptText;
const focusPic = focusOut.split('\n').filter((l) => /^画面：/.test(l));
if (focusPic.length !== 4) fail('取不到逐镜画面描述：' + focusPic.length);
else {
  const wrong = [];
  // 全景那一镜不许出现焦点；近处镜头（特写 / 近景）应当有
  if (focusPic[1].indexOf('面部表情') !== -1) wrong.push('全景镜不该有焦点');
  if (focusPic[0].indexOf('面部表情') === -1) wrong.push('特写镜应当有焦点');
  if (focusPic[2].indexOf('面部表情') === -1) wrong.push('近景镜应当有焦点');
  if (wrong.length) fail('手工编辑后的焦点规则和自动计划不一致：' + wrong.join('; '));
  else console.log('  ✓ 手工改景别后焦点规则照样生效：全景掉焦点，近处镜头保留');
}

// ---- 8) 改「决定分镜的那几道题」会让手工调整作废（这是界面上写明的重置规则） ----
const resetSession = videoSession(BASE_ANSWERS);
Engine.setStoryboardEdit(resetSession, moved);
if (!Engine.storyboardPlan(resetSession).fromManual) fail('刚存完手工调整，fromManual 却是 false');
else {
  // 加一个景别：签名变了，手工那张表就对不上了（镜头数受时长题上限约束，可能仍是 4）
  resetSession.answers['vid.shot'] = FOUR_SHOTS.concat(['vsh.macro']);
  const after = Engine.storyboardPlan(resetSession);
  if (after.fromManual) fail('改了景别，手工调整还生效（会渲染出一张对不上的表）');
  else {
    const rows = boardRows(Engine.finalize(resetSession).promptText);
    if (rows.length !== after.n) fail('渲染出的镜头数和 storyboardPlan 对不上');
    else if (rows[3].sec === 8 || rows[0].shot === '中景') {
      fail('手工调整应当已作废，但输出里还留着它排的顺序 / 时长');
    } else console.log('  ✓ 改了「景别」之后手工调整作废、回落自动计划（界面已写明这条规则）');
  }
}

// ---- 8b) 反过来：不走 entry 的题改了**不能**作废手工调整 ----
//     判断标准是「这道题的答案是不是通过 entry 进输出的」。
//     情绪走向 / 细节焦点 / 影像风格都是渲染时现取的，把它们算进签名就等于
//     「用户回头调一下情绪走向，辛苦排的镜头顺序和时长全没了」—— 纯属误伤。
const arcSession = videoSession(Object.assign({}, BASE_ANSWERS, {
  'vid.arc': ['varc.rise'],
  'vid.focus': ['vfoc.face'],
  'vid.style': ['vst.cinema'],
}));
Engine.setStoryboardEdit(arcSession, moved);
arcSession.answers['vid.arc'] = ['varc.release'];   // 由静到动 → 由紧到松
arcSession.answers['vid.focus'] = ['vfoc.hands'];   // 面部表情 → 手部动作
arcSession.answers['vid.style'] = ['vst.anime'];    // 电影感 → 动漫 / 二次元
const arcPlan = Engine.storyboardPlan(arcSession);
const arcOut = Engine.finalize(arcSession).promptText;
const arcRows = boardRows(arcOut);
const arcProblems = [];
if (!arcPlan.fromManual) arcProblems.push('手工调整被误伤作废了');
if (arcRows[3].sec !== 8) arcProblems.push('手改的时长丢了');
if (arcRows[3].cell !== '伞面上的雨珠一颗颗往下滚') arcProblems.push('手写的镜头内容丢了');
if (arcRows[0].shot !== '中景') arcProblems.push('手工排的顺序丢了');
// 同时新答案必须照样进输出 —— 不作废的前提就是「它自己能到得了」
if (arcOut.indexOf('由紧到松') === -1) arcProblems.push('新的情绪走向没进输出');
if (arcOut.indexOf('手部动作') === -1) arcProblems.push('新的细节焦点没进输出');
if (arcOut.indexOf('二维动画风格') === -1) arcProblems.push('新的影像风格没进输出');
if (arcProblems.length) {
  fail('回头改情绪走向 / 细节焦点 / 影像风格，把手工调整误伤了：' + arcProblems.join('; '));
} else console.log('  ✓ 改情绪走向 / 细节焦点 / 影像风格不作废手工调整，新答案照样进输出');

// ---- 8c) 界面上「改这几道题会让调整作废」的清单，不许写多也不许写少 ----
//     写多了 → 用户不敢动别的题；写少了 → 用户以为调整还在，实际已经回自动版。
const resetNames = plan0.resetByTitles;
// 走 entry 的题 → 必须在清单里；渲染时现取的题 → 必须不在。
// vid.cut 是最容易漏的一个：它不往 entry 里存任何字段，却决定 entries 该不该存在。
// 漏掉它 = 用户把「剪辑结构」改成「一镜到底」，成品里还留着 3 行的分镜表。
const mustHave = ['vid.shot', 'vid.move', 'vid.duration', 'vid.detail', 'vid.cut']
  .map((q) => K.QUESTIONS[q].title);
// vid.style 和 vid.cut 长得很像、判定结果却相反：前者只影响头部措辞，后者决定整张表成不成立。
// 所以这两条要一起钉住，免得以后有人「顺手」把 vid.cut 也挪出清单。
const mustNotHave = ['vid.arc', 'vid.focus', 'vid.style']
  .map((q) => K.QUESTIONS[q].title);
const resetBad = [];
mustHave.forEach((t) => { if (resetNames.indexOf(t) === -1) resetBad.push('少了「' + t + '」'); });
mustNotHave.forEach((t) => { if (resetNames.indexOf(t) !== -1) resetBad.push('多了「' + t + '」'); });
if (resetBad.length) {
  fail('界面上的「作废清单」和实际规则对不上：' + resetBad.join('、')
    + '（实际清单：' + resetNames.join('、') + '）');
} else console.log('  ✓ 「作废清单」恰好是 ' + mustHave.length + ' 道走 entry 的题（'
  + resetNames.join('、') + '）');

// ---- 9) 恢复自动生成 ----
const clearSession = videoSession(BASE_ANSWERS);
Engine.setStoryboardEdit(clearSession, moved);
Engine.clearStoryboardEdit(clearSession);
const cleared = Engine.storyboardPlan(clearSession);
const backRows = boardRows(Engine.finalize(clearSession).promptText);
if (cleared.fromManual) fail('clearStoryboardEdit 之后 fromManual 还是 true');
else if (cleared.total !== 20) fail('恢复自动生成后总时长应当是 20，实际 ' + cleared.total);
else {
  // 和「一次都没改过」的自动计划逐格比对 —— 这才证明手工排的顺序和时长真的丢掉了
  const backBad = [];
  plan0.shots.forEach((s, i) => {
    const r = backRows[i] || {};
    if (r.shot !== s.shotLabel) backBad.push('镜头 ' + (i + 1) + ' 景别 ' + r.shot + '≠' + s.shotLabel);
    if (r.sec !== s.seconds) backBad.push('镜头 ' + (i + 1) + ' 时长 ' + r.sec + '≠' + s.seconds);
  });
  if (backBad.length) fail('恢复自动生成后没回到自动计划：' + backBad.join('; '));
  else console.log('  ✓ clearStoryboardEdit 之后回到自动计划（顺序 / 时长都还原）');
}

// ---- 10) 界面上显示的值 = 最终写进 Prompt 的值 ----
//     这两份要是对不上，用户会看到「我明明填的 8 秒，生成出来是 5 秒」，
//     而且完全找不到原因。storyboardPlan 是界面唯一的取值来源，必须和渲染一致。
const viewSession = videoSession(BASE_ANSWERS);
Engine.setStoryboardEdit(viewSession, moved);
const view = Engine.storyboardPlan(viewSession);
const viewRows = boardRows(Engine.finalize(viewSession).promptText);
const viewBad = [];
view.shots.forEach((s, i) => {
  const r = viewRows[i] || {};
  if (r.shot !== s.shotLabel) viewBad.push('镜头 ' + (i + 1) + ' 景别：界面「' + s.shotLabel + '」vs 输出「' + r.shot + '」');
  if (r.move !== s.moveLabel) viewBad.push('镜头 ' + (i + 1) + ' 运镜：界面「' + s.moveLabel + '」vs 输出「' + r.move + '」');
  if (r.sec !== s.seconds) viewBad.push('镜头 ' + (i + 1) + ' 时长：界面 ' + s.seconds + ' vs 输出 ' + r.sec);
  if (r.cell !== s.cell) viewBad.push('镜头 ' + (i + 1) + ' 内容对不上');
});
if (viewBad.length) fail('界面看到的值和最终 Prompt 对不上：' + viewBad.join('; '));
else console.log('  ✓ storyboardPlan 给的每一格都和最终 Prompt 逐格一致（界面不自己算）');

// ---- 11) 配乐「情绪走向」的三段区间必须首尾相接，不许重叠 ----
//     原来的实现把中段一直写到片尾（last.end），于是
//     「中段（00:05 - 00:20）」和紧接着的「结尾 5 秒（00:15 - 00:20）」区间重叠，
//     而且中段还声称覆盖了「释放」那一段、却只列出中间几镜的阶段词 ——
//     读起来像系统把时间算错了。
//     只剩两镜（加删镜头之后的下限）时中间没有镜头，中段必须整段消失，
//     硬写会得到「中段（00:05 - 00:05）」这种零长度区间。
const BGM_ANSWERS = Object.assign({}, BASE_ANSWERS, {
  'vid.audio': ['vaud.ambient', 'vaud.music'],
  'vid.bgm': ['vbgm.cello'],
  'vid.arc': ['varc.rise'],
});

[[4, '自动 4 镜'], [3, '删到 3 镜'], [2, '删到 2 镜（下限）']].forEach(([n, name]) => {
  const s = videoSession(BGM_ANSWERS);
  if (n < 4) Engine.setStoryboardEdit(s, Engine.storyboardPlan(s).shots.slice(0, n));
  const text = Engine.finalize(s).promptText;
  const seg = bgmSegments(text);
  if (!seg) {
    fail(name + '：输出里没有配乐「情绪走向」那一行');
    return;
  }
  const rows = boardRows(text);
  const total = rows.reduce((a, r) => a + r.sec, 0);
  const bad = [];
  if (rows.length !== n) bad.push('镜头数是 ' + rows.length + '，不是 ' + n);
  if (seg.firstSec !== rows[0].sec) {
    bad.push('前段写 ' + seg.firstSec + ' 秒，第 1 镜其实是 ' + rows[0].sec + ' 秒');
  }
  if (seg.lastSec !== rows[n - 1].sec) {
    bad.push('结尾写 ' + seg.lastSec + ' 秒，最后一镜其实是 ' + rows[n - 1].sec + ' 秒');
  }
  if (seg.line.indexOf('大提琴') === -1) bad.push('没写用户选的配乐类型');
  if (n > 2) {
    const lastStart = total - seg.lastSec;
    if (seg.midStart !== seg.firstSec) {
      bad.push('中段起点 ' + seg.midStart + ' 秒，应等于第 1 镜结束（' + seg.firstSec + ' 秒）');
    }
    if (seg.midEnd !== lastStart) {
      bad.push('中段终点 ' + seg.midEnd + ' 秒，应等于最后一镜起点（' + lastStart + ' 秒）——'
        + '写到片尾（' + total + ' 秒）就会和结尾那段重叠');
    }
    if (!(seg.midEnd > seg.midStart)) {
      bad.push('中段是个零长度区间（' + seg.midStart + ' → ' + seg.midEnd + '）');
    }
    // 中段的阶段词只该覆盖中间几镜（n-2 个），不能把结尾那一段也算进来
    const midPart = /中段（[^）]*）[^；]*?情绪([^；]*)/.exec(seg.line);
    const stages = midPart ? midPart[1].split('、').filter(Boolean) : [];
    if (stages.length !== n - 2) {
      bad.push('中段列了 ' + stages.length + ' 个情绪阶段，中间只有 ' + (n - 2) + ' 镜');
    }
  } else if (seg.midStart !== null) {
    bad.push('两镜时不该有中段（会写出零长度区间）');
  }
  if (bad.length) fail(name + ' 的配乐情绪走向不对：' + bad.join('; '));
  else console.log('  ✓ ' + name + '：配乐三段区间首尾相接、不重叠（'
    + (n > 2 ? '前 ' + seg.firstSec + 's → 中段 ' + seg.midStart + '-' + seg.midEnd + 's → ' : '前 ' + seg.firstSec + 's → ')
    + '结尾 ' + seg.lastSec + 's）');
});

/* ================================================================ *
 * 四之七、分镜表的入口（编辑 / 生成）
 *
 * 背景：分镜表原本完全由答案推导，于是「一镜到底」或者只选一个景别的人
 * 永远拿不到分镜表、也没有任何入口 —— 他明明想要分镜，却只看到一段连续描述，
 * 只能得出「没看见分镜表」这个结论。入口该不该给，由 storyboardEntry 裁决。
 * ================================================================ */

console.log('\n' + '='.repeat(72));
console.log('四之七、分镜表的入口（编辑 / 生成 / 不放按钮）');

// ---- 1) 已经有分镜表 → 「编辑分镜表」 ----
const editEntry = Engine.storyboardEntry(videoSession(BASE_ANSWERS));
if (editEntry.mode !== 'edit') {
  fail('已有分镜表时 storyboardEntry 应当给 edit，实际 ' + editEntry.mode);
} else console.log('  ✓ 已有分镜表时给「' + editEntry.label + '」');

// ---- 2) 非视频 family 不给按钮 ----
const offFamily = ['text', 'image'].filter((fam) => {
  const s = Engine.createSession('随便写点什么');
  Engine.setScenario(s, SCENARIO_ID[fam]);
  return Engine.storyboardEntry(s).mode !== 'none';
});
if (offFamily.length) fail('这些 family 不该出现分镜按钮：' + offFamily.join('、'));
else console.log('  ✓ 文字 / 图片链路不给分镜按钮');

// ---- 3) 用户真实踩到的那个组合：「一镜到底」+ 3 个景别 + 15 秒以上 ----
//     一镜到底说的是「全片没有剪辑点」，和分镜表冲突，所以自动计划不给分镜表。
//     但用户明确想要分镜表 —— 入口必须给他。
const ONER_ANSWERS = {
  'intent': ['vd.intent.mood'],
  'vid.action': ['vact.single'],
  'vid.shot': ['vsh.wide', 'vsh.close', 'vsh.macro'],
  'vid.focus': ['vfoc.light'],
  'vid.move': ['vmv.push', 'vmv.pan', 'vmv.orbit', 'vmv.pov'],
  'vid.cut': ['vcut.oner'],
  'vid.arc': ['varc.warm'],
  'vid.lighting': ['vlt.overcast'],
  'vid.duration': ['vdur.s15'],
  'vid.detail': ['vdet.env', 'vdet.reflect', 'vdet.crowd'],
  'vid.audio': ['vaud.ambient', 'vaud.sfx'],
  'vid.ratio': ['vrat.cinema'],
};
const onerSession = videoSession(ONER_ANSWERS);
const onerEntry = Engine.storyboardEntry(onerSession);
const onerPlan = Engine.storyboardPlan(onerSession);
if (onerPlan.available) fail('「一镜到底」下自动计划不该给分镜表');
else if (onerEntry.mode !== 'create') {
  fail('「一镜到底」+ 3 个景别 + 15 秒，应当给「生成分镜表」入口，实际 ' + onerEntry.mode);
} else if (!(onerEntry.conflicts || []).length) {
  fail('这个入口应当说明和「一镜到底」冲突');
} else console.log('  ✓ 「一镜到底」下自动计划不给分镜表，但仍然给「' + onerEntry.label + '」入口（并说明冲突）');

// ---- 4) 种子计划按用户的答案排，不是凭空造 ----
const seed = Engine.storyboardPlan(onerSession, { seed: true });
if (!seed.available) fail('种子计划应当可用');
else if (seed.n !== 3 || seed.total !== 15) {
  fail('种子应当是 3 镜 15 秒，实际 ' + seed.n + ' 镜 ' + seed.total + ' 秒');
} else if (seed.shots.map((s) => s.shotLabel).join(',') !== '全景,近景,极特写') {
  fail('种子应当按用户选的景别顺序排，实际 ' + seed.shots.map((s) => s.shotLabel).join(','));
} else if (seed.shots.some((s) => !s.cell)) fail('种子每一镜都要有「镜头内容」');
else console.log('  ✓ 种子计划按用户选的景别 / 运镜 / 总时长排（3 镜 15 秒，每格都有内容）');

// ---- 5) 保存种子必须成功，而且成品真的换成分镜表 ----
//     这里曾经是坏的：setStoryboardEdit 内部按「自动计划」判断能不能排，
//     而「一镜到底」下自动计划是 false —— 用户排完点保存会静默失败。
const onerShots = seed.shots.map((s) => ({
  shotId: s.shotId, moveId: s.moveId, seconds: s.seconds, cell: s.cell, focus: s.focus,
}));
if (Engine.setStoryboardEdit(onerSession, onerShots) !== true) {
  fail('用户明确生成的分镜表存不下来（保存会静默失败）');
} else {
  const onerOut = Engine.finalize(onerSession);
  if (!onerOut.storyboard) fail('存下分镜表之后，成品却不是分镜方案');
  else console.log('  ✓ 「一镜到底」下生成的分镜表能存下来，成品也换成了分镜表');

  // ---- 6) 成品不许自相矛盾：一边说没有剪辑点，一边排三个镜头 ----
  //     用户原来那份成品的原文里，「一镜到底的长镜头，全片没有剪辑点」
  //     和「时长 10-15 秒，包含 2-3 个镜头切换」是同时出现的。
  //
  //     断言要扫**整个头部**，不能只看【摄影语言】那一行：
  //     「一镜到底」以前混在影像风格里，所以只在那一行出现；
  //     现在它归「剪辑结构」，会落到【剪辑结构】行上 ——
  //     只查【摄影语言】的话，一个「把一镜到底原样写进【剪辑结构】」的
  //     实现会**照样通过**（表里 3 行、头部写着「全片没有剪辑点」）。
  //
  //     但**【剪辑说明】这一行本身必须豁免** —— 它的职责就是把冲突讲明白，
  //     里面当然会引用「全片没有剪辑点」这四个字。不豁免的话，
  //     一句正确的说明会被当成矛盾（这条断言第一版就是这么写错的）。
  const headLines = onerOut.promptText.split('\n').filter((l) => /^【/.test(l));
  const claiming = headLines.filter((l) => /没有剪辑点/.test(l) && !/^【剪辑说明】/.test(l));
  const noteLine = headLines.filter((l) => /^【剪辑说明】/.test(l))[0] || '';
  if (claiming.length) {
    fail('成品一边排着 3 个镜头、一边在 ' + claiming[0].slice(0, 6)
      + ' 里说「全片没有剪辑点」：' + claiming[0]);
  } else if (!noteLine) {
    fail('摘掉了用户的「一镜到底」却没说明（不能无声丢弃答案）');
  } else if (!/一镜到底/.test(noteLine)) {
    fail('【剪辑说明】应当点名是哪一条被摘掉了');
  } else console.log('  ✓ 成品不再自相矛盾：头部不再声称「全片没有剪辑点」，另用【剪辑说明】讲清楚');
}

// ---- 5b) 存下之后，storyboardPlan 必须说「可用」 ----
//     这里也曾经是坏的：storyboardPlan 先看自动计划，而「一镜到底」下它是 false，
//     于是成品里明明排着分镜表，结果区的按钮却写着「生成分镜表」—— 界面和成品各说各话。
const afterSavePlan = Engine.storyboardPlan(onerSession);
if (!afterSavePlan.available) {
  fail('存下分镜表之后 storyboardPlan 却说不可用（按钮会退回「生成分镜表」）');
} else if (afterSavePlan.n !== 3 || !afterSavePlan.fromManual) {
  fail('存下之后应当是 3 镜的手工版，实际 ' + afterSavePlan.n + ' 镜 fromManual=' + afterSavePlan.fromManual);
} else if (Engine.storyboardEntry(onerSession).mode !== 'edit') {
  fail('存下之后按钮应当变成「编辑分镜表」，实际 ' + Engine.storyboardEntry(onerSession).mode);
} else console.log('  ✓ 存下之后 storyboardPlan 可用、按钮变成「编辑分镜表」（界面和成品不会各说各话）');

// ---- 7) 没答时长题 → 不给按钮（不能凭空编一个总时长） ----
const noDurSession = videoSession({ 'vid.shot': ['vsh.cu', 'vsh.wide'], 'vid.move': ['vmv.push'] });
if (Engine.storyboardEntry(noDurSession).mode !== 'none') {
  fail('没答时长题时不该给分镜按钮 —— 没法知道每镜多少秒');
} else console.log('  ✓ 没答时长题时不给按钮（不凭空编总时长），改用提示告诉他怎么改');

// ---- 8) 只选一个景别 + 长时长 → 种子补到最少两镜，而且**存得下去** ----
//
// 这一条钉的是「点了按钮却无路可走」这类死胡同：
// 分镜表的下限是 2 镜（sanitizeEntries 卡着），种子要是只排 1 镜，
// 用户点「生成分镜表」→ 看到一张表 → 点「保存调整」→ 只会得到
// 「这张表的数据对不上，没法保存」，连「恢复自动生成」都是灰的。
// 所以种子必须**一上来就是一张完整的、能直接存的表**，用户只负责改。
const oneShotSession = videoSession({ 'vid.shot': ['vsh.cu'], 'vid.move': ['vmv.push'], 'vid.duration': ['vdur.long'] });
const oneEntry = Engine.storyboardEntry(oneShotSession);
const oneSeed = Engine.storyboardPlan(oneShotSession, { seed: true });
if (oneEntry.mode !== 'create') fail('只选一个景别时也该给「生成分镜表」入口，实际 ' + oneEntry.mode);
else if (!oneSeed.available || oneSeed.n !== 2) {
  fail('一个景别的种子应当补到最少 2 镜（1 镜存不下去），实际 ' + oneSeed.n);
} else {
  const padded = oneSeed.shots.map((s) => s.shotId);
  const emptyCell = oneSeed.shots.filter((s) => !s.cell).length;
  if (padded.indexOf('vsh.cu') === -1) fail('补镜不该把用户选的那个景别挤掉，实际 ' + padded.join('/'));
  else if (padded[1] === 'vsh.cu') fail('补出来的那一镜应当是用户没选过的景别，实际 ' + padded.join('/'));
  else if (emptyCell) fail('种子补出来的镜头「内容」是空的（' + emptyCell + ' 格）');
  else if (!Engine.setStoryboardEdit(oneShotSession, oneSeed.shots.map((s) => ({
    shotId: s.shotId, moveId: s.moveId, seconds: s.seconds, cell: s.cell,
  })))) {
    fail('种子生成的表存不下去 —— 用户点了「生成分镜表」就走进死胡同了');
  } else {
    const rows = boardRows(Engine.finalize(oneShotSession).promptText);
    if (rows.length !== 2) fail('存下种子表之后成品应当有 2 行，实际 ' + rows.length);
    else console.log('  ✓ 只选一个景别：种子自动补到 2 镜（补的是他没选过的景别），一按保存就成表');
  }
}

// ---- 9) 提示文案只在按钮真的在的时候才提按钮 ----
//     注意要用**还没生成过分镜表**的会话：上面那个已经存了手工版，
//     storyboardEntry 会返回 edit，提示里自然不会再提「生成分镜表」。
const hintWith = Engine.storyboardNotice(videoSession(ONER_ANSWERS));
const hintWithout = Engine.storyboardNotice(noDurSession);
if (!hintWith || hintWith.text.indexOf('生成分镜表') === -1) {
  fail('按钮在的时候，提示里应当告诉用户可以点「生成分镜表」');
} else if (!hintWithout || hintWithout.text.indexOf('生成分镜表') !== -1) {
  fail('按钮不在的时候，提示里不该提「生成分镜表」（用户会去找一个不存在的按钮）');
} else console.log('  ✓ 提示只在按钮真的在的时候才提它');

// ---- 10) 作废之后能不能回落到自动版 —— 界面那句承诺必须和引擎实际做的一致 ----
//
// 「一镜到底」下用户照样能生成分镜表（走种子），但那张表一旦因为改了景别而作废，
// 引擎**没有自动版可回落** —— 表会整个消失、成品退回单镜头描述。
// 编辑器里如果一律写「这张表会回到自动排的版本」，就是在许一个引擎兑现不了的承诺。
// `resetToAuto` 就是给那句话用的，所以光断言字段还不够：必须确认引擎**实际**
// 也是这么做的，否则字段只是又一份和现实对不上的实现。
const resetAuto = Engine.storyboardPlan(videoSession(BASE_ANSWERS)).resetToAuto;
const resetNoAuto = Engine.storyboardPlan(videoSession(ONER_ANSWERS), { seed: true }).resetToAuto;
if (resetAuto !== true) fail('普通多镜头组合下 resetToAuto 应当是 true（作废后回落到自动版）');
else if (resetNoAuto !== false) fail('「一镜到底」下 resetToAuto 应当是 false（没有自动版可回落）');
else {
  const onerInvalid = videoSession(ONER_ANSWERS);
  const onerNow = Engine.storyboardPlan(onerInvalid, { seed: true });
  Engine.setStoryboardEdit(onerInvalid, onerNow.shots.map((s) => ({
    shotId: s.shotId, moveId: s.moveId, seconds: s.seconds, cell: s.cell,
  })));
  const savedHasBoard = Engine.finalize(onerInvalid).promptText.indexOf('## 分镜表') !== -1;
  // 改「景别」——签名变了，手工版作废
  onerInvalid.answers['vid.shot'] = ['vsh.wide', 'vsh.close'];
  const afterInvalid = Engine.finalize(onerInvalid).promptText.indexOf('## 分镜表') !== -1;
  if (!savedHasBoard) fail('（前置）「一镜到底」下存下来的种子表应当渲染成分镜表');
  else if (afterInvalid) fail('改景别之后表还在 —— 那 resetToAuto=false 这句话就是错的');
  else if (Engine.storyboardEntry(onerInvalid).mode !== 'create') {
    fail('表作废之后应当重新给出「生成分镜表」入口（否则用户找不回来）');
  } else console.log('  ✓ 作废后确实没有自动版可回落：表消失、成品退回单镜头描述，但入口还在'
    + '（所以界面照实说，不许写「回到自动排的版本」）');
}

/* ================================================================ *
 * 四之八、「剪辑结构」和「影像风格」分家
 *
 * 背景：「一镜到底」原来住在**影像风格**那道**单选题**里，而它讲的是剪辑结构。
 * 于是影像风格和剪辑结构这两个本来正交的决定被做成了互斥 ——
 * 「赛博朋克 + 一镜到底」这种完全正常的组合**根本选不出来**：
 * 点了一镜到底，赛博朋克就被挤掉。这不是「拦不住冲突」，
 * 是「不该冲突的东西被做成了互斥」。
 *
 * 顺带还留下两个后遗症，这一节一起钉住：
 *   · 【摄影语言】里混进了一句剪辑的话，渲染分镜表时还得专门 filter 掉；
 *   · 时长题的片段声称「包含 2-3 个镜头切换」，和「全片没有剪辑点」在同一段里打架。
 * ================================================================ */

console.log('\n' + '='.repeat(72));
console.log('四之八、剪辑结构与影像风格分家');

// ---- 1) 影像风格是纯风格题：里面不该再有剪辑结构的选项 ----
const styleOpts = K.QUESTIONS['vid.style'].options.map((o) => o.id);
const cutOpts = K.QUESTIONS['vid.cut'].options.map((o) => o.id);
if (styleOpts.indexOf('vst.oner') !== -1) {
  fail('「一镜到底」又回到影像风格里了 —— 它是剪辑结构，会和风格互相挤掉');
} else if (cutOpts.indexOf('vcut.oner') === -1) {
  fail('「剪辑结构」题里没有「一镜到底」—— 用户没地方表达这个诉求了');
} else if (K.QUESTIONS['vid.cut'].multi) {
  fail('「剪辑结构」应当是单选：全片要么一个镜头、要么多个，不能同时是两者');
} else console.log('  ✓ 影像风格只剩纯风格，一镜到底归「剪辑结构」（单选）');

// ---- 2) 本次要修的那个 bug：风格 + 一镜到底 必须能共存 ----
//
// 断言要打在**装配结果**上，不能只断言选项 id 不在同一题里 ——
// 那样「两个 dim 都映射到 style」之类的实现错误照样能通过。
const comboSession = videoSession({
  'vid.style': ['vst.cyber'],
  'vid.cut': ['vcut.oner'],
  'vid.shot': FOUR_SHOTS,
  'vid.move': ['vmv.push'],
  'vid.duration': ['vdur.long'],
});
const comboOut = Engine.finalize(comboSession).promptText;
const hasStyle = comboOut.indexOf('赛博朋克') !== -1;
const hasOner = comboOut.indexOf('没有剪辑点') !== -1;
if (!hasStyle) fail('选了「赛博朋克 + 一镜到底」，成品里却没有赛博朋克（风格被挤掉了）');
else if (!hasOner) fail('选了「赛博朋克 + 一镜到底」，成品里却没有一镜到底');
else console.log('  ✓ 「赛博朋克 + 一镜到底」现在可以共存（以前单选互斥，根本选不出来）');

// ---- 3) 成品不许自相矛盾：连续描述那条路也不能一边说没剪辑点、一边说 2-3 个镜头 ----
//
// 这是用户最初报的那个 bug 的**另一半**。当时只修了分镜表那条路
// （【摄影语言】filter 掉一镜到底），连续描述这条路漏了 ——
// 时长题的片段「包含 2-3 个镜头切换」和「全片没有剪辑点」会同时出现。
// 根因是时长题的片段越权声称了「有几个镜头」，而那已经是剪辑结构的职责。
//
// 根因现在由知识库完整性那条「剪辑结构只由「剪辑结构」题声称」直接拦在源头。
// 这一条留着当**成品层的第二道防线**：它断言的是装配结果，所以对
// 「镜头数从别的地方冒出来」也有效（比如引擎代码里硬拼了一句）。两条不重复。
const cutClash = [];
['vdur.s5', 'vdur.s10', 'vdur.s15', 'vdur.long'].forEach((durId) => {
  const out = videoCase({
    'vid.style': ['vst.cinema'], 'vid.cut': ['vcut.oner'],
    'vid.shot': FOUR_SHOTS, 'vid.move': ['vmv.push'], 'vid.duration': [durId],
  }).promptText;
  // 只有「一镜到底 + 没排成分镜表」时才是纯连续描述；排了表的话由【剪辑说明】交代
  if (out.indexOf('## 分镜表') !== -1) return;
  if (/没有剪辑点/.test(out) && /个镜头切换|单镜头完成|在单镜头内/.test(out)) {
    cutClash.push(durId);
  }
});
if (cutClash.length) {
  fail('连续描述里同时出现了「全片没有剪辑点」和「几个镜头切换」：' + cutClash.join('、'));
} else console.log('  ✓ 时长题不再越权声称镜头数：连续描述里不会一边说没剪辑点、一边说 2-3 个镜头');

// ---- 4) vid.cut 改了要作废手工表；vid.style 改了不能作废（两道题长得很像，判定相反）----
const cutReset = videoSession(BASE_ANSWERS);
const cutSeed = Engine.storyboardPlan(cutReset, { seed: true });
Engine.setStoryboardEdit(cutReset, cutSeed.shots.map((s) => ({
  shotId: s.shotId, moveId: s.moveId, seconds: s.seconds, cell: s.cell,
})));
if (!Engine.storyboardPlan(cutReset).fromManual) {
  fail('（前置）存完手工表之后 fromManual 应当是 true');
} else {
  cutReset.answers['vid.cut'] = ['vcut.oner'];   // 改成「一镜到底」
  const afterCut = Engine.storyboardPlan(cutReset);
  if (afterCut.fromManual) fail('把「剪辑结构」改成「一镜到底」之后手工表还生效（答案说 1 镜、表里好几行）');
  else {
    const styleReset = videoSession(BASE_ANSWERS);
    const styleSeed = Engine.storyboardPlan(styleReset, { seed: true });
    Engine.setStoryboardEdit(styleReset, styleSeed.shots.map((s) => ({
      shotId: s.shotId, moveId: s.moveId, seconds: s.seconds, cell: s.cell,
    })));
    styleReset.answers['vid.style'] = ['vst.anime'];   // 只换风格
    if (!Engine.storyboardPlan(styleReset).fromManual) {
      fail('只换了影像风格，手工表却被作废了（误伤）');
    } else console.log('  ✓ 改「剪辑结构」作废手工表，改「影像风格」不作废（两者只差一个字，判定相反）');
  }
}

// ---- 4b) 反向：从「一镜到底」改回「分镜剪辑」，自动版回来接管 ----
//
// #4 测的是「改成一镜到底 → 表作废，且**没有**自动版可回落」（resetToAuto=false）。
// 反方向是另一种状态：手工表同样作废，但这次**有**自动版接住 ——
// 用户不该突然失去分镜表，按钮也不该退回「生成分镜表」。
//
// 这是新状态机里唯一没被覆盖的一次转移：resetToAuto 的 true 分支
// 配一张「种子出身」的手工表。不测的话，「改回分镜剪辑之后表整个消失」
// 这种退化可以一路绿灯通过（只要 #4 那条还绿着）。
const backSession = videoSession(BASE_ANSWERS);
backSession.answers['vid.cut'] = ['vcut.oner'];        // 先在一镜到底下拿一张种子表
const backSeed = Engine.storyboardPlan(backSession, { seed: true });
Engine.setStoryboardEdit(backSession, backSeed.shots.map((s) => ({
  shotId: s.shotId, moveId: s.moveId, seconds: s.seconds, cell: s.cell,
})));
const backBefore = Engine.storyboardPlan(backSession);
if (!backBefore.fromManual || backBefore.resetToAuto !== false) {
  fail('（前置）一镜到底下的种子表应当是手工版、且没有自动版可回落，实际 fromManual='
    + backBefore.fromManual + ' resetToAuto=' + backBefore.resetToAuto);
} else {
  backSession.answers['vid.cut'] = ['vcut.cut'];       // 改回「分镜剪辑」
  const backAfter = Engine.storyboardPlan(backSession);
  const backBoard = /^## 分镜表$/m.test(Engine.finalize(backSession).promptText);
  const backEntry = Engine.storyboardEntry(backSession).mode;
  if (backAfter.fromManual) {
    fail('改回「分镜剪辑」之后手工表还生效（签名变了却没收走）');
  } else if (!backAfter.resetToAuto) {
    fail('改回「分镜剪辑」之后 resetToAuto 是 false —— 明明有自动版可以接住');
  } else if (!backBoard) {
    fail('改回「分镜剪辑」之后成品里没有分镜表了（自动版没接住，用户白丢一张表）');
  } else if (backEntry !== 'edit') {
    fail('改回「分镜剪辑」之后按钮不该退回「生成分镜表」，实际 ' + backEntry);
  } else console.log('  ✓ 从「一镜到底」改回「分镜剪辑」：手工表作废，自动版接住'
    + '（成品仍有分镜表、按钮仍是「编辑分镜表」）');
}

// ---- 5) 景别题上的动态提示（A+）----
//
// 一镜到底意味着全片只有一个镜头，此时「选几个景别」这个问题本身就变形了。
// 提示是**提示**、不是约束：引擎不替用户删答案。
const hintOn = Engine.questionHint(
  videoSession({ 'vid.cut': ['vcut.oner'] }), 'vid.shot', null
);
const hintOff = Engine.questionHint(
  videoSession({ 'vid.cut': ['vcut.cut'] }), 'vid.shot', null
);
const hintOtherQ = Engine.questionHint(videoSession({ 'vid.cut': ['vcut.oner'] }), 'vid.move', null);
// 本轮还没提交时，答案在 draft 里 —— 只读 answers 的话这句提示永远不会出现
// （vid.cut 和 vid.shot 在同一轮，用户点「一镜到底」时它还没提交）。
const hintDraft = Engine.questionHint(
  videoSession({}), 'vid.shot', { 'vid.cut': { selected: ['vcut.oner'] } }
);
// 草稿里取消了勾选 → 提示要立刻消失，不能退回 answers 里那条已经过时的
const hintDraftCleared = Engine.questionHint(
  videoSession({ 'vid.cut': ['vcut.oner'] }), 'vid.shot', { 'vid.cut': { selected: [] } }
);
if (hintOn.indexOf('一镜到底') === -1) fail('选了「一镜到底」，景别题上却没有提示');
else if (hintOff) fail('选的是「分镜剪辑」，景别题上不该有那句提示（会误导）');
else if (hintOtherQ) fail('这句提示只该出现在景别题上，不该出现在别的题上');
else if (hintDraft.indexOf('一镜到底') === -1) {
  fail('「一镜到底」还在草稿里（本轮未提交）时，提示就该出现 —— 否则永远看不到');
} else if (hintDraftCleared) {
  fail('草稿里已经取消了「一镜到底」，提示却还在（拿的是过时的 answers）');
} else console.log('  ✓ 景别题的动态提示：认草稿、认取消、只出现在该出现的题上（是提示不是约束）');

/* ================================================================ *
 * 四之九、分镜的首尾帧
 * ================================================================ */

console.log('\n' + '='.repeat(72));
console.log('四之九、分镜的首尾帧（文生图 / 从文件导入 / 沿用上一镜）');

/**
 * 拆出「首尾帧参考」那一节。
 *
 * 要能区分「这一节是空的」和「这一节根本没出现」—— 后者本身就是一条要断言的行为
 * （没人指定首尾帧时整节不该出现），返回 '' 会被当成「有节但没行」。
 * 所以调用方一律先看 frameSection 是不是 ''。
 */
function frameSection(text) {
  return markdownSection(text, '## 首尾帧参考');
}
function frameRows(text) {
  return frameSection(text).split('\n')
    .filter((l) => /^\| 镜头 \d+ \|/.test(l))
    .map((l) => {
      const c = l.split('|').map((x) => x.trim());
      return { no: c[1], start: c[2], end: c[3] };
    });
}
function frameNoteLine(text) {
  return frameSection(text).split('\n').filter((l) => /^说明：/.test(l))[0] || '';
}

/** 把一份计划拷成可编辑草稿 —— 编辑器里做的就是这一步 */
function draftOf(session) {
  return Engine.storyboardPlan(session).shots.map((s) => ({
    shotId: s.shotId, moveId: s.moveId, seconds: s.seconds, cell: s.cell, focus: s.focus,
    frameStart: s.frameStart || null, frameEnd: s.frameEnd || null,
  }));
}

// ---- 1) 来源表：四种来源，prev 只能用在首帧 ----
const frameModeIds = (K.FRAME_MODES || []).map((m) => m.id);
if (frameModeIds.length !== 4) {
  fail('FRAME_MODES 应当有 4 种来源，实际 ' + frameModeIds.length + ' 种：' + frameModeIds.join(','));
} else if (new Set(frameModeIds).size !== frameModeIds.length) {
  fail('FRAME_MODES 的 id 有重复：' + frameModeIds.join(','));
} else if (!(K.FRAME_MODES || []).every((m) => m.label && m.slots && m.slots.length)) {
  fail('FRAME_MODES 每一项都要有 label 和 slots（界面靠这两条通用规则过滤下拉项）');
} else {
  const prevMode = K.FRAME_MODES.filter((m) => m.id === 'prev')[0] || {};
  if ((prevMode.slots || []).indexOf('end') !== -1) {
    fail('「沿用上个分镜的尾帧」不该能用在尾帧上（尾帧说的是「停在哪儿」，接着上一镜停讲不通）');
  } else if (!prevMode.needPrev) {
    fail('「沿用上个分镜的尾帧」应当声明 needPrev —— 第 1 个分镜没有这一项');
  } else console.log('  ✓ 四种来源（' + frameModeIds.join(' / ') + '），prev 限首帧且要求前面还有一镜');
}

// ---- 2) 引擎要把来源表和默认值交给界面 ----
const framePlan = Engine.storyboardPlan(videoSession(BASE_ANSWERS));
if (!framePlan.frameModes || framePlan.frameModes.length !== frameModeIds.length) {
  fail('storyboardPlan 没把来源表给界面 —— 界面会自己去抄一份，两份迟早对不上');
} else if (!framePlan.frameModes.every((m) => m.slots && typeof m.needPrev === 'boolean')) {
  fail('frameModes 少了 slots / needPrev，界面没法做通用过滤（只能去认 prev 这个 id）');
} else if (!(framePlan.pathMax > 0)) {
  fail('pathMax 没给，界面上「文件路径」输入框没有长度上限');
} else if (!framePlan.shots.every((s) => 'frameStart' in s && 'frameEnd' in s)) {
  fail('plan.shots 没带首尾帧字段 —— 编辑器里改完保存下去就没了');
} else if (framePlan.shots.some((s) => s.frameStart || s.frameEnd)) {
  fail('首尾帧不该自动排：那是用户自己的素材，引擎凭空编一个文件路径等于替他做决定');
} else console.log('  ✓ 来源表 / 路径上限 / 每镜的首尾帧都给了界面，自动计划默认全是「未指定」');

// ---- 3) 三种来源都要能进成品，而且写清楚 ----
const fsText = videoSession(BASE_ANSWERS);
const fdText = draftOf(fsText);
fdText[0].frameStart = { mode: 'text', text: '雨夜街道，霓虹倒影在积水上' };
fdText[0].frameEnd = { mode: 'file', name: 'shot1-end.png', path: '/Users/jack/素材/shot1-end.png', note: '收在伞尖' };
fdText[1].frameStart = { mode: 'prev' };
fdText[2].frameStart = { mode: 'text' };              // 描述留空 → 回落这一镜的镜头内容
fdText[3].frameEnd = { mode: 'file', name: 'end.png' }; // 只有文件名，没有路径
if (Engine.setStoryboardEdit(fsText, fdText) !== true) {
  fail('带首尾帧的合法分镜表被拒了');
} else {
  const out = Engine.finalize(fsText).promptText;
  const rows = frameRows(out);
  const problems = [];
  if (rows.length !== 4) problems.push('首尾帧表应当有 4 行，实际 ' + rows.length);
  if ((rows[0] || {}).start !== '文生图：雨夜街道，霓虹倒影在积水上') {
    problems.push('首帧的文生图没写出来：' + (rows[0] || {}).start);
  }
  if ((rows[0] || {}).end !== '从文件导入：shot1-end.png（/Users/jack/素材/shot1-end.png）｜收在伞尖') {
    problems.push('尾帧的文件名 / 路径 / 备注没写全：' + (rows[0] || {}).end);
  }
  if ((rows[1] || {}).start !== '沿用镜头 1 的尾帧') {
    problems.push('prev 没写成「沿用镜头 1 的尾帧」：' + (rows[1] || {}).start);
  }
  if ((rows[1] || {}).end !== '—') problems.push('没指定的尾帧应当写「—」：' + (rows[1] || {}).end);
  if (((rows[2] || {}).start || '').indexOf('取景到胸部以上') === -1) {
    problems.push('文生图留空时应当回落这一镜的镜头内容：' + (rows[2] || {}).start);
  }
  if ((rows[3] || {}).end !== '从文件导入：end.png') {
    problems.push('只有文件名、没有路径时不该多写一对空括号：' + (rows[3] || {}).end);
  }
  const frameHead = frameSection(out).split('\n').filter((l) => /^\| 镜头编号 \|/.test(l))[0] || '';
  if (frameHead.replace(/\s/g, '') !== '|镜头编号|首帧|尾帧|') problems.push('表头不对：' + frameHead);
  if (problems.length) fail('首尾帧没有正确进成品：' + problems.join('; '));
  else console.log('  ✓ 文生图 / 从文件导入（文件名+路径+备注）/ 沿用上一镜，三种来源都进了「首尾帧参考」表');
}

// ---- 4) 没人指定 → 整节不出现 ----
//     一张全是「—」的表，除了占版面还会让人以为「这里是不是漏了什么」。
if (Engine.finalize(videoSession(BASE_ANSWERS)).promptText.indexOf('## 首尾帧参考') !== -1) {
  fail('没人指定首尾帧时不该出现这一节（全是「—」的表只会让人以为漏了什么）');
} else if (Engine.finalize(fsText).promptText.indexOf('## 首尾帧参考') === -1) {
  fail('（前置）上面那份指定了首尾帧的表反而没有这一节 —— 这一段断言等于没测');
} else console.log('  ✓ 没人指定时整节不出现；有人指定时才出现（两条都验了，不是单向通过）');

// ---- 5) prev 是位置语义，而且第 1 镜上没有 ----
//     「沿用上一个分镜的尾帧」说的是「紧挨着我的前一个镜头」，
//     不是「原来排在我前面的那个镜头」。重排之后它要跟着位置走。
const fsPrev = videoSession(BASE_ANSWERS);
const fdPrev = draftOf(fsPrev);
fdPrev[0].frameStart = { mode: 'prev' };   // 第 1 镜：不成立 → 规范化掉
fdPrev[2].frameStart = { mode: 'prev' };   // 第 3 镜：沿用镜头 2 的尾帧
if (Engine.setStoryboardEdit(fsPrev, fdPrev) !== true) {
  fail('带 prev 的合法表被拒了（一个不成立的位置不该作废整张表）');
} else {
  const rows = frameRows(Engine.finalize(fsPrev).promptText);
  const problems = [];
  if ((rows[0] || {}).start !== '—') {
    problems.push('第 1 镜的 prev 该被规范化成「未指定」，实际 ' + (rows[0] || {}).start);
  }
  if ((rows[2] || {}).start !== '沿用镜头 2 的尾帧') {
    problems.push('第 3 镜应当写「沿用镜头 2 的尾帧」，实际 ' + (rows[2] || {}).start);
  }
  // 存下来的那一份也必须是干净的，不能只在渲染时挡一下 ——
  // 否则历史记录里存着一条永远不生效的 prev，用户打开记录会以为它还生效。
  const savedPrev = (fsPrev.storyboardEdit.shots[0] || {}).frameStart;
  if (savedPrev !== null) problems.push('第 1 镜的 prev 没被规范化掉，存下来的是 ' + JSON.stringify(savedPrev));
  if (problems.length) fail('prev 的位置规则没生效：' + problems.join('; '));
  else console.log('  ✓ prev 是位置语义（第 3 镜沿用镜头 2），第 1 镜上的 prev 在**存盘前**就被规范化掉');
}

// ---- 6) 挪位置之后要能收敛（界面靠它把结果说出来）----
const fdMove = draftOf(videoSession(BASE_ANSWERS));
fdMove[1].frameStart = { mode: 'prev' };
const movedDropped = Engine.dropDanglingPrev([fdMove[1], fdMove[0]]);   // 把第 2 镜挪到第 1 位
if (movedDropped.join(',') !== '1') {
  fail('挪到第一位之后应当报出「镜头 1 的 prev 被清掉」，实际 ' + JSON.stringify(movedDropped));
} else if (fdMove[1].frameStart !== null) {
  fail('dropDanglingPrev 报了编号却没真的把那条 prev 清掉');
} else {
  const fdKeep = draftOf(videoSession(BASE_ANSWERS));
  fdKeep[1].frameStart = { mode: 'prev' };
  if (Engine.dropDanglingPrev(fdKeep).length) {
    fail('第 2 镜上的 prev 是合法的，不该被清掉（收敛逻辑把位置判断反了）');
  } else console.log('  ✓ 挪到第一位时 prev 被清掉并报出镜头号；留在第二位时不动它');
}

// ---- 7) 脏数据一律当「未指定」，但不许作废整张表 ----
//     这条数据从编辑器、历史记录、导入的 JSON 三处来，后两处不可信。
//     一个下拉框的脏值让用户整张表白调，是不成比例的惩罚。
const frameDirtyCases = [
  ['mode 不认识', 'start', { mode: 'hologram' }],
  ['prev 出现在尾帧', 'end', { mode: 'prev' }],
  ['根本不是对象', 'start', '文生图'],
  ['是数组', 'start', [{ mode: 'text' }]],
  ['file 但什么都没填', 'start', { mode: 'file', name: '', path: '' }],
  ['file 但只有空白', 'start', { mode: 'file', name: '   ', path: '  ' }],
];
const frameDirtyBad = [];
frameDirtyCases.forEach(([name, which, value]) => {
  const s = videoSession(BASE_ANSWERS);
  const d = draftOf(s);
  d[0][which === 'start' ? 'frameStart' : 'frameEnd'] = value;
  if (Engine.setStoryboardEdit(s, d) !== true) {
    frameDirtyBad.push(name + '（把整张表作废了）');
    return;
  }
  const rows = frameRows(Engine.finalize(s).promptText);
  // 整节不出现（全被丢掉了）或这一格是「—」，都算正确
  const clean = !frameSection(Engine.finalize(s).promptText)
    || ((rows[0] || {}).start === '—' && (rows[0] || {}).end === '—');
  if (!clean) frameDirtyBad.push(name + '（渲染成了「' + (rows[0] || {}).start + '」/「' + (rows[0] || {}).end + '」）');
});
if (frameDirtyBad.length) fail('脏的首尾帧本该当「未指定」，却：' + frameDirtyBad.join('、'));
else console.log('  ✓ ' + frameDirtyCases.length + ' 种脏数据（含尾帧上的 prev、空文件名）一律当「未指定」，不作废整张表');

// ---- 7b) 超长路径要截断，不能原样塞进磁盘和成品 ----
const fsLong = videoSession(BASE_ANSWERS);
const fdLong = draftOf(fsLong);
fdLong[0].frameEnd = { mode: 'file', name: 'x.png', path: '/' + 'a'.repeat(500) + '.png' };
Engine.setStoryboardEdit(fsLong, fdLong);
const savedPathLen = ((fsLong.storyboardEdit.shots[0] || {}).frameEnd || {}).path.length;
if (savedPathLen !== framePlan.pathMax) {
  fail('超长文件路径应当截到 pathMax（' + framePlan.pathMax + '），实际 ' + savedPathLen);
} else console.log('  ✓ 超长文件路径截到 ' + framePlan.pathMax + ' 字符');

// ---- 8) 「沿用上一镜的尾帧」而上一镜没指定尾帧 —— 要说明白，不能让人自己猜 ----
const fsNote = videoSession(BASE_ANSWERS);
const fdNote = draftOf(fsNote);
fdNote[0].frameEnd = { mode: 'text', text: '收在伞尖' };
fdNote[1].frameStart = { mode: 'prev' };   // 上一镜（镜头 1）有尾帧 → 不该有说明
fdNote[3].frameStart = { mode: 'prev' };   // 上一镜（镜头 3）没尾帧 → 该有说明
Engine.setStoryboardEdit(fsNote, fdNote);
const noteLine = frameNoteLine(Engine.finalize(fsNote).promptText);
if (!noteLine) {
  fail('「沿用上一镜的尾帧」而上一镜没指定尾帧时，成品里一句说明都没有（用户只能自己猜）');
} else if (noteLine.indexOf('镜头 4') === -1) {
  fail('说明里没点名是哪一镜：' + noteLine);
} else if (noteLine.indexOf('镜头 2') !== -1) {
  fail('镜头 1 明明指定了尾帧，说明却把镜头 2 也算进去了：' + noteLine);
} else console.log('  ✓ 上一镜没指定尾帧时给一句说明，且只点名真的没指定的那几镜');

// ---- 9) 首尾帧不参与「作废签名」 ----
//     首尾帧存在 entry 里，签名只看 STORYBOARD_INPUTS 那 5 道题。
//     哪天有人把「和分镜有关的东西」一股脑塞进签名，这条会先失败。
const fsSig = videoSession(BASE_ANSWERS);
const fdSig = draftOf(fsSig);
fdSig[0].frameStart = { mode: 'text', text: '开场那一帧' };
Engine.setStoryboardEdit(fsSig, fdSig);
fsSig.answers['vid.style'] = ['vst.cyber'];
if (Engine.finalize(fsSig).promptText.indexOf('## 首尾帧参考') === -1) {
  fail('改「影像风格」把用户排好的首尾帧一起作废了（首尾帧存在 entry 里，不该被签名牵连）');
} else console.log('  ✓ 改「影像风格」不影响已排好的首尾帧（签名只管那 5 道走 entry 的题）');

// ---- 10) JSON 往返之后要原样还在（历史记录 / 导入 JSON 走的就是这条路）----
const fsRound = videoSession(BASE_ANSWERS);
fsRound.storyboardEdit = JSON.parse(JSON.stringify(fsText.storyboardEdit));
const roundRows = frameRows(Engine.finalize(fsRound).promptText);
if (roundRows.length !== 4 || ((roundRows[0] || {}).end || '').indexOf('shot1-end.png') === -1) {
  fail('首尾帧经过 JSON 往返之后丢了：' + JSON.stringify(roundRows[0]));
} else console.log('  ✓ 首尾帧能原样经过 JSON 往返（存进记录 / 导出再导入都靠它）');

// ---- 11) server.js 的落盘白名单必须登记了 entry 上的每一个字段 ----
//
// 这一条守的是**静默丢数据**：server.js 的 normalizeStoryboardEdit 是白名单式构造，
// entry 上加了字段却忘了登记，症状是「编辑器里改得好好的，保存之后重新载入就没了」——
// 不报错、不告警，数据只是在落盘那一步蒸发了。浏览器里怎么看都是对的，
// 只有真的存一次再读一次才看得出来。这是这个项目最怕的那类 bug，
// 所以宁可用一条**读源码**的断言提前拦住，而不是等 e2e 去撞。
//
// 读的是 PL_SERVER_FILE（变异测试会把它指向临时副本，好让这条断言也受变异检验）。
const serverSrc = fs.readFileSync(SERVER_FILE, 'utf8');
const whiteMatch = /shots: raw\.shots\.slice\(0, 60\)\.map\(\(s\) => \(\{([\s\S]*?)\}\)\),/.exec(serverSrc);
const whiteKeys = whiteMatch
  ? (whiteMatch[1].match(/^\s+([A-Za-z_$][\w$]*):/gm) || []).map((l) => l.trim().replace(':', ''))
  : null;
// entry 的字段清单直接从「真的存一次」拿 —— 手抄一份就失去了这条断言的意义。
const entryKeysSession = videoSession(BASE_ANSWERS);
Engine.setStoryboardEdit(entryKeysSession, draftOf(entryKeysSession));
const entryKeys = Object.keys(((entryKeysSession.storyboardEdit || {}).shots || [])[0] || {});
if (!entryKeys.length) fail('拿不到 entry 的字段清单（setStoryboardEdit 没存下来），这条断言等于没跑');
if (!whiteKeys) {
  fail('解析不出 server.js 的落盘白名单（normalizeStoryboardEdit 的形状变了）—— '
    + '这条不变量要跟着改，别让它悄悄失效');
} else {
  const notSaved = entryKeys.filter((k) => whiteKeys.indexOf(k) === -1);
  if (notSaved.length) {
    fail('这些 entry 字段没登记进 server.js 的落盘白名单，存一次再读回来就没了：' + notSaved.join('、'));
  } else console.log('  ✓ entry 上的 ' + entryKeys.length + ' 个字段（' + entryKeys.join(' / ')
    + '）在 server.js 的白名单里都有，落盘不会静默丢字段');

// ---- 12) 断言 boardCodes 依赖的那个前提本身 ----
//
// boardCodes 是按小节切开数 `### 镜头 N（时间码）` 的。这个前提要是破了
// （比如别的小节也开始输出同样的标题），它会重新退化成「全篇扫」，
// 而且**不会报错** —— 只是时间码条数悄悄翻倍，报错方向还指错地方。
//
// 换句话说：上一段那种「把 helper 改成按小节切开」的加固，本身没有测试守着 ——
// 谁把它改回去都不会有断言失败。所以这里直接断言**它依赖的假设**，
// 破了就指名道姓说是哪一节越界了。
//
// 必须跑在**四节齐全**的输出上（分镜表 / 首尾帧参考 / 逐段画面描述 / 背景音乐建议）。
// 只跑「分镜表 + 逐段描述」那种两节输出是不够的：最可能撞车的「首尾帧参考」
// 恰恰不在里面，不变量就等于没覆盖到它。所以下面先自己验一遍它真的上场了。
//
// 配乐那两节要「父题 + 追问题」一起给才生效：vid.bgm 是 vaud.music 的追问，
// 只写 vid.bgm 的话 activeQids 里没有它，pickedOptions 会返回空 ——
// 输出里静悄悄地少一节，这条不变量也就少查一节。
const codeSession = videoSession(Object.assign({}, BASE_ANSWERS, {
  'vid.audio': ['vaud.music'],
  'vid.bgm': ['vbgm.ambient'],
}));
const codeEntries = draftOf(codeSession);
codeEntries[1].frameEnd = { mode: 'text', text: '雨珠在伞面上滚落' };
codeEntries[2].frameStart = { mode: 'prev' };
Engine.setStoryboardEdit(codeSession, codeEntries);
const codeOut = Engine.finalize(codeSession).promptText;
const codeSections = codeOut.split(/\n(?=## )/).slice(1);   // 第 0 段是分镜表之前的头部
const codeHeads = codeSections.map((s) => s.split('\n')[0].trim());
const strayCodeSections = codeSections
  .filter((s) => !/^## 逐段画面描述/.test(s))
  .filter((s) => /### 镜头 \d+（/.test(s))
  .map((s) => s.split('\n')[0].trim());
const WANT_CODE_SECTIONS = ['## 首尾帧参考', '## 背景音乐建议'];
const missingCodeSections = WANT_CODE_SECTIONS.filter((h) => codeHeads.indexOf(h) === -1);
if (missingCodeSections.length) {
  fail('这条不变量没跑到这些小节上：' + missingCodeSections.join('、')
    + '（只看到 ' + codeHeads.length + ' 节：' + codeHeads.join(' / ') + '）—— '
    + '没覆盖到最容易撞车的那几节，等于没跑');
} else if (strayCodeSections.length) {
  fail('这些小节也输出了 `### 镜头 N（时间码）` 标题：' + strayCodeSections.join('、')
    + ' —— boardCodes 按小节切开才有意义，否则时间码会重复计数');
} else console.log('  ✓ `### 镜头 N（时间码）` 只出现在「逐段画面描述」一节（在 '
  + codeHeads.length + ' 节上查过：' + codeHeads.join(' / ') + '）');
}

/* ================================================================ *
 * 五、边界
 * ================================================================ */

console.log('\n' + '='.repeat(72));
console.log('五、边界情况');

const empty = Engine.createSession('');
console.log('空输入得分：' + empty.scoreBefore.total);
let g2 = 0;
let b2 = Engine.nextRound(empty);
while (b2.length && g2 < 40) {
  g2 += 1;
  const a = {};
  b2.forEach((q) => { a[q.id] = { selected: [q.options[0].id] }; });
  b2 = Engine.submitRound(empty, a);
}
console.log('空输入最终得分：' + Engine.finalize(empty).scoreAfter.total);
if (g2 >= 40) fail('空输入疑似死循环');

// 手动改场景：从文字切到图片，评分标准和流程都要跟着换
const manual = Engine.createSession('随便写点东西');
const beforeFamily = manual.family;
Engine.setScenario(manual, 'image');
if (manual.family !== 'image') fail('setScenario 没有切换 family');
if (manual.family === beforeFamily && beforeFamily === 'image') fail('setScenario 起点就有问题');
console.log(`手动切场景：${beforeFamily} → ${manual.family}  ✓`);

// ---- 问答开始之后换场景（restart）：必须整轮重来，不能留下旧 family 的任何痕迹 ----
//
// 场景是自动判断的，判错不报错，只是「后面问的题不对」—— 用户想拍短视频却
// 被识别成图片，就永远等不到「镜头景别」。所以问答阶段必须能改（界面上那个
// 「场景：… · 换一个」按钮）。换场景 = 换一整套问题，残留任何一个字段都会
// 变成「断掉的旧答案」，而且全程不报错 —— 正是这个项目最怕的失效。
const swSession = videoSession(BASE_ANSWERS);
// 让轮次真的往前走一轮 —— 后面要断言「换场景后轮次归零」，round 本来就是 0 的话
// 那条断言等于没跑。视频链路第 1 批是 intent + vid.action，都不参与分镜签名。
const swBatch = Engine.nextRound(swSession);
if (swBatch.length) {
  const a = {};
  swBatch.forEach((q) => { a[q.id] = { selected: [q.options[0].id] }; });
  Engine.submitRound(swSession, a);
}
const swAnswered = Object.keys(swSession.answers).length;
// 分镜表从一份**同答案的干净会话**取，不要指望「跑过几轮之后这张表还成立」：
// 视频链路第 2 批就有 vid.cut，而它的第一项是「一镜到底」——选中它分镜表直接不成立。
// 存不下来就当场报错，免得后面「分镜表被清掉」的断言变成在测空气。
if (Engine.setStoryboardEdit(swSession, draftOf(videoSession(BASE_ANSWERS))) !== true) {
  fail('（前置）没能给 swSession 存下一张分镜表，后面「分镜表被清掉」的断言等于没跑');
}

const swProblems = [];
if (swAnswered < 2) swProblems.push('前置：换之前压根没答上题（答了 ' + swAnswered + ' 个）');
Engine.setScenario(swSession, 'image', { restart: true });
if (swSession.family !== 'image') swProblems.push('family 没换：' + swSession.family);
if (Object.keys(swSession.answers).length) {
  swProblems.push('旧答案没清掉：' + Object.keys(swSession.answers).join(','));
}
if (Object.keys(swSession.customs).length) swProblems.push('旧的自定义内容没清掉');
if (swSession.round !== 0) swProblems.push('轮次没归零：' + swSession.round);
if (swSession.tailAdded) swProblems.push('tailAdded 没复位（会跳过 tail 那一批题）');
if (swSession.done) swProblems.push('done 没复位（换完直接算答完了）');
if ('storyboardEdit' in swSession) swProblems.push('旧 family 的分镜表还留着');
const wantQueue = (K.FLOWS[swSession.family] || {}).core || [];
if (swSession.queue.join(',') !== wantQueue.join(',')) {
  swProblems.push('队列没换成新 family 的 core：' + swSession.queue.join(','));
}
// 换完之后必须真的能问出新 family 的题，而且不是旧 family 的
const swNew = Engine.nextRound(swSession);
const swIds = swNew.map((q) => q.id);
if (!swIds.length) swProblems.push('换完场景问不出题来');
// 换到图片链路之后，问出来的只能是 intent + img.*，绝不能还有 vid.*
const swStale = swIds.filter((id) => id !== 'intent' && id.indexOf('img.') !== 0);
if (swStale.length) swProblems.push('问出来的还是旧链路的题：' + swStale.join(','));
if (swProblems.length) fail('换场景没有整轮重来：' + swProblems.join('; '));
else console.log('  ✓ 问答开始后换场景会整轮重来（答案 / 轮次 / 队列 / 分镜表全清，'
  + '问出来的是新链路的题：' + swIds.join(' / ') + '）');

// ---- 只换 family、不带 restart：队列照样必须重建 ----
//
// 这是界面「开始拆解」的真实顺序：
//   createSession(原话)          → 队列按【自动识别】的 family 铺
//   setScenario(用户手选的场景)   → 只改 family
//   nextRound()
// 两者不一致时（用户明明点了「视频生成」，原话却被识别成图片），若队列不重建，
// 会话会自称视频、却一路问图片的题 —— 用户手选了视频，却永远等不到「镜头景别」。
// 这条路径上没有 restart，只有 family 的变化，所以队列重建不能挂在 restart 上。
const pickSession = Engine.createSession('帮我写一份季度总结报告，语气正式一点，给老板看');
const autoFamily = pickSession.family;
const autoQueue = pickSession.queue.slice();
const pickProblems = [];
if (autoFamily === 'video') pickProblems.push('前置：原话被判成了视频，构造不出「手选与自动不一致」');
Engine.setScenario(pickSession, 'video');
if (pickSession.family !== 'video') pickProblems.push('family 没换：' + pickSession.family);
if (pickSession.queue.join(',') === autoQueue.join(',')) {
  pickProblems.push('队列没跟着 family 重建，还是 ' + autoFamily + ' 的：' + pickSession.queue.join(','));
}
const wantVideoCore = (K.FLOWS.video || {}).core || [];
if (pickSession.queue.join(',') !== wantVideoCore.join(',')) {
  pickProblems.push('队列不是视频链路的 core：' + pickSession.queue.join(','));
}
// 真的能问到视频链路独有的题 —— 「镜头景别」正是用户说没看见的那道
const pickedBatch = Engine.nextRound(pickSession);
const pickIds = pickedBatch.map((q) => q.id);
if (!pickIds.length) pickProblems.push('换完问不出题来');
const pickStale = pickIds.filter((id) => id !== 'intent' && id.indexOf('vid.') !== 0);
if (pickStale.length) pickProblems.push('问出来的还是旧链路的题：' + pickStale.join(','));
if (pickProblems.length) fail('只换 family 时队列没重建：' + pickProblems.join('; '));
else console.log('  ✓ 只换 family（不带 restart）也会重建队列，问出来的是新链路的题：'
  + pickIds.join(' / '));

// 反过来：只换 family 时【不能】清答案。restoreSession 会带着历史答案走这条路，
// 清了就等于毁掉用户的记录。要不要清，由调用方用 opts.restart 明确表达。
const keepSession = videoSession(BASE_ANSWERS);
Engine.nextRound(keepSession);
const keepAnswered = Object.keys(keepSession.answers).length;
Engine.setScenario(keepSession, 'image');
if (Object.keys(keepSession.answers).length !== keepAnswered) {
  fail('只换 family 时把答案清掉了（restoreSession 走的就是这条路，等于毁记录）');
} else console.log('  ✓ 只换 family 时不动 answers（保留 ' + keepAnswered + ' 个，清不清由 opts.restart 决定）');

// 极长输入
const longText = '请帮我写一份报告。'.repeat(300);
const longSession = Engine.createSession(longText);
let g3 = 0;
let b3 = Engine.nextRound(longSession);
while (b3.length && g3 < 40) {
  g3 += 1;
  const a = {};
  b3.forEach((q) => { a[q.id] = { selected: [q.options[0].id] }; });
  b3 = Engine.submitRound(longSession, a);
}
console.log('超长输入（' + longText.length + ' 字）跑完，得分 ' + Engine.finalize(longSession).scoreAfter.total);
if (g3 >= 40) fail('超长输入疑似死循环');

/* ================================================================ *
 * 六、场景识别
 * ================================================================ */

console.log('\n' + '='.repeat(72));
console.log('六、场景识别（原话 → 进哪条链路）');

// 这一节是**补的** —— 场景识别此前一条断言都没有，所以「明确的视频需求被判成图片」
// 这种错能一路走到用户面前：他被带进图片链路，「镜头景别」「运镜方式」「时长与节奏」
// 永远不会出现，而他明明说了要短视频。用户报的「没看见镜头景别的选项」就是这个。
//
// 判错的症状特别隐蔽：不报错、不告警，只是**后面问的题不对**。
// 用户很难判断是「系统问错了」还是「我本来就该答这些」，于是只能放弃。
const DETECT = (text) => K.detectScenario(text).matched.id;

const DETECT_VIDEO = [
  '帮我做一段 30 秒的城市夜景短视频，多镜头切换',
  '拍一段视频：雨夜街头，一个人撑着伞慢慢走远',
  '帮我生成一段 15 秒的竖屏短视频，要有运镜和分镜',
  '多镜头切换的城市夜景，霓虹灯倒影',
  '一个人走在雨夜的城市街头，霓虹灯的倒影落在积水里',
  // 这一条专门守「兜底只在关键词没意见时才出手」：
  // 它有视频关键词（短视频）、有画面词（雪山 / 湖泊），但**没有任何动态词**，
  // 所以 MOTION_CUE 救不了它 —— 一旦兜底能推翻关键词结论，
  // 它就会被 image +9 抢走（video 只有 2 分 + 静态兜底 3 分）。
  '帮我做一段短视频，画面是雪山脚下的湖泊',
];
const DETECT_VISUAL = [
  '雨夜的街头，霓虹灯倒影落在积水里',
  '雨夜街头，一个人撑着伞慢慢走远',
  '黄昏的沙漠，沙丘的纹路一直延伸到天边',
  '一只橘猫趴在窗台上晒太阳',
  '雪山脚下的湖泊，倒影里有一座木屋',
  '森林里起雾了，光线从树叶缝里漏下来',
];
// 这几条同时含「画面词」和「任务词」。兜底一旦不看关键词就加分，
// 它们会全部被 image +9 抢走 —— 所以它们同时守着兜底的那个前提。
const DETECT_TASK = [
  ['writing', '帮我写一篇关于远程办公的公众号文章，要给公司同事看的'],
  ['writing', '帮我写一篇关于老式咖啡馆的文章，要有画面感'],
  ['coding', '用 Python 写一个快速排序'],
  ['analysis', '帮我分析一下这个城市的房价走势'],
  ['learning', '给我讲一下相对论，通俗一点'],
  ['general', '你好'],
];

const wrongVideo = DETECT_VIDEO.filter((t) => DETECT(t) !== 'video')
  .map((t) => JSON.stringify(t) + ' → ' + DETECT(t));
if (wrongVideo.length) {
  fail('这些明确的视频需求被判成了别的链路（用户接着看不到「镜头景别」这些题）：\n     '
    + wrongVideo.join('\n     '));
} else console.log('  ✓ ' + DETECT_VIDEO.length + ' 条明确的视频需求都进了视频链路');

const wrongVisual = DETECT_VISUAL.filter((t) => DETECT(t) !== 'image')
  .map((t) => JSON.stringify(t) + ' → ' + DETECT(t));
if (wrongVisual.length) {
  fail('这些纯画面描述退化了（没有任务动词，应当被兜底捞成图片，而不是掉进「通用任务」）：\n     '
    + wrongVisual.join('\n     '));
} else console.log('  ✓ ' + DETECT_VISUAL.length + ' 条纯画面描述都被兜底捞成了图片');

const wrongTask = DETECT_TASK.filter(([want, t]) => DETECT(t) !== want)
  .map(([want, t]) => JSON.stringify(t) + ' → ' + DETECT(t) + '（应为 ' + want + '）');
if (wrongTask.length) {
  fail('这些文字任务被视觉兜底抢走了（兜底必须在关键词一个都没命中时才出手）：\n     '
    + wrongTask.join('\n     '));
} else console.log('  ✓ ' + DETECT_TASK.length + ' 条文字任务没被视觉兜底抢走'
  + '（含「城市」「咖啡馆」这种画面词，光看画面词会判错）');

console.log('\n' + '='.repeat(72));
console.log(failed === 0 ? '全部通过 ✓' : `存在 ${failed} 个问题 ✗`);
process.exit(failed === 0 ? 0 : 1);
