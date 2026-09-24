'use strict';

/**
 * 生成 samples/video-storyboard.md
 *
 * 用途：改动视频链路（问题、组装、分镜）之后跑一次，肉眼确认输出还像不像一份
 * 可执行的拍摄方案。自动化断言只能证明「字段都在」，证明不了「读起来对不对」——
 * 这一份就是给人读的。
 *
 *   node scripts/make-sample.js
 */

const fs = require('fs');
const path = require('path');
const K = require(path.join(__dirname, '..', 'public', 'assets', 'js', 'knowledge.js'));
const Engine = require(path.join(__dirname, '..', 'public', 'assets', 'js', 'engine.js'));

const ORIGINAL = '雨中漫步，主打情绪氛围感。一只撑伞的身影在雨夜街道上缓缓前行';

const session = Engine.createSession(ORIGINAL);
Engine.setScenario(session, 'video');

Object.assign(session.answers, {
  'intent': ['vd.intent.story'],
  'vid.action': ['vact.single'],
  'vid.shot': ['vsh.cu', 'vsh.medium', 'vsh.close', 'vsh.wide'],
  'vid.focus': ['vfoc.face'],
  'vid.move': ['vmv.push', 'vmv.orbit', 'vmv.track', 'vmv.pull'],
  // 「剪辑结构」现在是独立一题。这份样例要的是多镜头分镜方案，
  // 所以必须明确选「分镜剪辑」—— 不选的话成品头部会少掉【剪辑结构】那一行，
  // 样例就不是用户真实会拿到的样子了。
  'vid.cut': ['vcut.cut'],
  'vid.style': ['vst.cinema'],
  'vid.arc': ['varc.rise'],
  'vid.lighting': ['vlt.back', 'vlt.night'],
  'vid.duration': ['vdur.long'],
  'vid.detail': ['vdet.air', 'vdet.reflect'],
  'vid.audio': ['vaud.ambient', 'vaud.music'],
  'vid.bgm': ['vbgm.cello'],
  'vid.ratio': ['vrat.p916'],
  'vid.negative': ['vneg.shake', 'vneg.face', 'vneg.pop', 'vneg.flicker'],
});

// 选项 id 写错了不会报错，只会静默地从输出里消失（intent.mood 就这么漏过一次），
// 而这份样例是给人读的 —— 少了一块也未必看得出来。所以这里正面校验一遍。
const badIds = [];
Object.keys(session.answers).forEach((qid) => {
  const q = Engine.getQuestion(qid, 'video');
  if (!q) { badIds.push(qid + '（题不存在）'); return; }
  session.answers[qid].forEach((id) => {
    if (!q.options.some((o) => o.id === id)) badIds.push(qid + ' → ' + id);
  });
});
if (badIds.length) {
  console.error('样例里有不存在的选项 id：' + badIds.join(', '));
  process.exit(1);
}

// 自定义输入：helper 就是这么示范的 —— 用逗号写多个具体细节，一个分给一个镜头
session.customs['vid.detail'] = '伞面的雨珠、积水的倒影、霓虹招牌的光斑、被雨水打湿的衣角';

const result = Engine.finalize(session);

// 把用户的选择一并写进文件，方便对照「选了这些 → 得到那个」
const decisionLines = result.decisions.map((d) => {
  const q = K.QUESTIONS[d.qid];
  return '- **' + (q ? q.title : d.qid) + '**：' + d.labels.join('、');
});

const out = [
  '# 视频 Prompt 分镜方案（PromptLens 生成样例）',
  '',
  '> 原始输入：' + ORIGINAL,
  '',
  '## 我做了这些决定',
  '',
  decisionLines.join('\n'),
  '',
  '---',
  '',
  result.promptText,
  '',
  '---',
  '',
  '## 负面提示词',
  '',
  result.negativePrompt,
  '',
].join('\n');

const target = path.join(__dirname, '..', 'samples', 'video-storyboard.md');
fs.writeFileSync(target, out, 'utf8');

console.log('已写入 ' + target);
console.log('正文 ' + result.promptText.length + ' 字');
console.log('得分 ' + result.scoreBefore.total + ' → ' + result.scoreAfter.total);

/* ------------------------------------------------------------------ *
 * 再来一份「人工编辑过」的样例
 *
 * 用户在结果页可以把分镜表的顺序 / 时长 / 每一格的内容改掉（编辑分镜表）。
 * 这份样例就是给人读的对照：同一组选择，手工调整之后成品长什么样、
 * 哪些东西跟着重算了（总时长、时间码、头部首尾景别）。
 * ------------------------------------------------------------------ */

const plan = Engine.storyboardPlan(session);
if (!plan.available) {
  console.error('这份样例应当有分镜表可编辑，storyboardPlan 却说没有');
  process.exit(1);
}

// 演示四件事：把特写挪到最后、给它 8 秒、把它的内容换成用户自己写的一句话、
// 再删掉一镜。其余镜头保持自动计划的值 —— 手工编辑是「改哪一格算哪一格」，
// 不是整张重填。
//
// 为什么样例里要带上「删一镜」：镜头数一变，配乐「情绪走向」那一段的
// 前/中/结尾三段区间就要跟着重算（中段的阶段词只覆盖中间几镜）。
// 这份样例是给人读的，删一镜之后那一段会原样摆在眼前 ——
// 曾经就是这里写错了（中段一路写到片尾，和「结尾 N 秒」区间重叠），
// 光靠断言没看出来，肉眼读一遍才发现。
const edited = plan.shots.map((s) => ({
  shotId: s.shotId, moveId: s.moveId, seconds: s.seconds, cell: s.cell, focus: s.focus,
}));
const closeIdx = edited.findIndex((e) => e.shotId === 'vsh.cu');
const movedShot = edited.splice(closeIdx, 1)[0];
movedShot.seconds = 8;
movedShot.cell = '伞面上的雨珠一颗颗往下滚，一滴一滴都看得清';
edited.push(movedShot);

const dropIdx = edited.findIndex((e) => e.shotId === 'vsh.wide');
const droppedLabel = plan.shots.filter((s) => s.shotId === 'vsh.wide')[0].shotLabel;
edited.splice(dropIdx, 1);

// 首尾帧也是「人工编辑」的一部分 —— 引擎不自动排（那说的是用户手上哪张图，
// 凭空编一个文件路径等于替他做决定），只有在这里手填才会出现。
// 顺手把这一节的几种写法都摆一遍给人看：
//   文生图（带描述）/ 从文件导入（文件名 + 路径 + 备注）/
//   沿用上一镜的尾帧 / 文生图留空（回落这一镜的镜头内容）
edited[0].frameStart = { mode: 'text', text: '雨夜街道的空镜，霓虹招牌的倒影铺在积水里' };
edited[0].frameEnd = {
  mode: 'file', name: 'shot1-end.png', path: '/Users/你/素材/雨夜/shot1-end.png', note: '收在伞尖',
};
edited[1].frameStart = { mode: 'prev' };
edited[2].frameEnd = { mode: 'text' };

if (Engine.setStoryboardEdit(session, edited) !== true) {
  console.error('手工调整被引擎拒了 —— 样例脚本本身有问题');
  process.exit(1);
}
const after = Engine.finalize(session);
const reordered = plan.shots.map((s) => s.shotLabel).join(' → ');

const editedOut = [
  '# 视频 Prompt 分镜方案（人工编辑过分镜表 · 样例）',
  '',
  '> 原始输入：' + ORIGINAL,
  '',
  '## 我在「编辑分镜表」里改了什么',
  '',
  '- 顺序：把「' + plan.shots[closeIdx].shotLabel + '」从第 ' + (closeIdx + 1) + ' 镜挪到了最后一镜',
  '  （原顺序 ' + reordered + '）',
  '- 时长：这一镜从 ' + plan.shots[closeIdx].seconds + ' 秒改成 8 秒',
  '- 内容：这一镜的「镜头内容」换成自己写的一句「伞面上的雨珠一颗颗往下滚，一滴一滴都看得清」',
  '- 镜头数：删掉了「' + droppedLabel + '」那一镜（' + plan.n + ' 镜 → '
    + Engine.storyboardPlan(session).n + ' 镜，觉得后半段太拖）',
  '- 首尾帧：给第 1 镜定了首帧（文生图）和尾帧（从文件导入，记了文件名 / 路径 / 备注），',
  '  第 2 镜的首帧接着第 1 镜的尾帧，第 3 镜的尾帧写「文生图」但没描述',
  '  （留空就用这一镜自己的镜头内容）—— 所以成品里多出一节「首尾帧参考」',
  '',
  '下面这几处**不是**我手填的，是引擎按手改后的值重算的 ——',
  '总时长、每段的时间码、镜头数、头部「景别从…推进到…」的首尾景别、',
  '以及配乐「情绪走向」的前 / 中 / 结尾三段区间：',
  '',
  '---',
  '',
  after.promptText,
  '',
  '---',
  '',
  '## 负面提示词',
  '',
  after.negativePrompt,
  '',
].join('\n');

const editedTarget = path.join(__dirname, '..', 'samples', 'video-storyboard-edited.md');
fs.writeFileSync(editedTarget, editedOut, 'utf8');

console.log('已写入 ' + editedTarget);
console.log('  自动版 ' + plan.total + ' 秒 → 手改后 '
  + Engine.storyboardPlan(session).total + ' 秒');
