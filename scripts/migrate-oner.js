'use strict';

/**
 * 一次性数据迁移：「一镜到底」从「影像风格」搬到「剪辑结构」。
 *
 * 背景：`vst.oner`（一镜到底）原来住在「影像风格」那道**单选题**里，于是
 * 「电影感 / 赛博朋克 + 一镜到底」根本选不出来（点了一个挤掉另一个），
 * 而且它的 fragment 讲的是「全片有没有剪辑点」，和影像风格正交。
 * 现在它归独立的 `vid.cut`（选项 id 变成 `vcut.oner`）。
 *
 * 已经存进 data/db.json 的旧记录不会自己搬家 —— `answers` 里那个 `vst.oner`
 * 在新知识库里**不存在**，normalizeSelection 会把它悄悄丢掉：
 * 用户从记录里打开自己那一版，会发现「一镜到底」凭空消失，
 * 但成品正文里那句「全片没有剪辑点」还留着。这正是本项目最怕的静默失效。
 *
 * 所以这里做两件事：
 *   1. `answers` 里 `vid.style: ['vst.oner']` → `vid.cut: ['vcut.oner']`
 *      （保住用户的意图，这样「改上一处」和 storyboardNotice 都还认得它）
 *   2. 用当前引擎重算 finalPrompt / negativePrompt / decisions / 两个分数
 *      （不重算的话，正文会停在「一边说没有剪辑点、一边列 2-3 个镜头切换」
 *        那个自相矛盾的老版本上）
 *
 * 用法：
 *   node scripts/migrate-oner.js           # 预演：只报告会改什么，不写盘
 *   node scripts/migrate-oner.js --write   # 真正写盘（先备份 db.json）
 *
 * 幂等：跑第二遍会报告「没有需要迁移的记录」。
 */

const fs = require('fs');
const path = require('path');
const Engine = require(path.join(__dirname, '..', 'public', 'assets', 'js', 'engine.js'));

const DB = path.join(__dirname, '..', 'data', 'db.json');
const WRITE = process.argv.indexOf('--write') !== -1;

/** 旧选项 → 新归属。加新条目时记得同步 test-engine 的四之八。 */
const MOVED = [
  { fromQid: 'vid.style', fromId: 'vst.oner', toQid: 'vid.cut', toId: 'vcut.oner' },
];

/**
 * 按 workspace.js 载入记录的路径把 session 还原出来。
 *
 * 为什么不能只塞 answers：`finalize` 还要读 customs（用户在某一题里手写的
 * 自定义内容）和 storyboardEdit（手工排过的分镜表）。少了它们，
 * 重算出来的成品会比用户当初存下来的那份**少东西** ——
 * 迁移把用户的内容弄丢，比不迁移还糟。
 */
function sessionFromProject(p) {
  const session = Engine.createSession(p.originalPrompt || '');
  Engine.setScenario(session, p.scenarioId || session.scenarioId);
  session.answers = Object.assign({}, p.answers || {});
  session.customs = {};
  (p.decisions || []).forEach((d) => {
    const hit = (d.labels || []).find((l) => l.indexOf('自定义：') === 0);
    if (hit) session.customs[d.qid] = hit.slice(4);
  });
  if (p.storyboardEdit && typeof p.storyboardEdit === 'object') {
    session.storyboardEdit = p.storyboardEdit;
  }
  return session;
}

/** 迁移一条记录的 answers；没动过就返回 null。 */
function migrateAnswers(answers) {
  let changed = false;
  const out = {};
  Object.keys(answers || {}).forEach((qid) => { out[qid] = answers[qid].slice(); });

  MOVED.forEach((m) => {
    const list = out[m.fromQid];
    if (!list || list.indexOf(m.fromId) === -1) return;
    changed = true;
    out[m.fromQid] = list.filter((id) => id !== m.fromId);
    if (!out[m.fromQid].length) delete out[m.fromQid];
    const dest = out[m.toQid] || [];
    if (dest.indexOf(m.toId) === -1) dest.push(m.toId);
    out[m.toQid] = dest;
  });

  return changed ? out : null;
}

/** 成品正文里还有没有「一边排多镜、一边说没有剪辑点」的自相矛盾。 */
function contradiction(text) {
  const heads = String(text || '').split('\n').filter((l) => /^【/.test(l));
  return heads.filter((l) => /没有剪辑点/.test(l) && !/^【剪辑说明】/.test(l));
}

/** answers 里有没有不存在的选项 id —— 迁移之后不该再有。 */
function badOptionIds(session) {
  const bad = [];
  Object.keys(session.answers).forEach((qid) => {
    const q = Engine.getQuestion(qid, session.scenarioId);
    if (!q) { bad.push(qid + '（题不存在）'); return; }
    session.answers[qid].forEach((id) => {
      if (id === '__skip__') return;
      if (!q.options.some((o) => o.id === id)) bad.push(qid + ' → ' + id);
    });
  });
  return bad;
}

/* ------------------------------------------------------------------ */

const db = JSON.parse(fs.readFileSync(DB, 'utf8'));
const projects = db.projects || [];

const hits = [];
projects.forEach((p) => {
  const next = migrateAnswers(p.answers);
  if (next) hits.push({ p, next });
});

console.log('扫描 ' + projects.length + ' 条记录，需要迁移 ' + hits.length + ' 条'
  + (WRITE ? '' : '（预演，未写盘）'));

if (!hits.length) {
  console.log('没有需要迁移的记录 —— 要么已经迁过，要么本来就没有旧数据。');
  process.exit(0);
}

let failed = 0;
hits.forEach(({ p, next }) => {
  console.log('\n--- ' + p.id + '  ' + (p.title || ''));
  console.log('  旧 answers.vid.style: ' + JSON.stringify(p.answers['vid.style']));
  console.log('  新 answers.vid.cut  : ' + JSON.stringify(next['vid.cut']));

  const session = sessionFromProject(p);
  session.answers = next;

  const bad = badOptionIds(session);
  if (bad.length) {
    failed += 1;
    console.log('  ✗ 迁移后仍有无效选项 id：' + bad.join(', ') + '（跳过这条）');
    return;
  }

  const out = Engine.finalize(session);
  const badLines = contradiction(out.promptText);
  if (badLines.length) {
    failed += 1;
    console.log('  ✗ 重算后仍然自相矛盾：' + badLines[0] + '（跳过这条）');
    return;
  }

  const board = /^## 分镜表$/m.test(out.promptText);
  console.log('  重算：' + out.promptText.length + ' 字，完整度 '
    + out.scoreBefore.total + ' → ' + out.scoreAfter.total
    + (board ? '，有分镜表' : '，无分镜表（一镜到底 → 连续描述）'));

  if (!WRITE) return;

  p.answers = next;
  p.finalPrompt = out.promptText;
  p.negativePrompt = out.negativePrompt;
  p.decisions = out.decisions;
  p.scoreBefore = out.scoreBefore.total;
  p.scoreAfter = out.scoreAfter.total;
  p.updatedAt = Date.now();
});

if (failed) {
  console.error('\n有 ' + failed + ' 条没迁成，整体中止，db.json 未改动。');
  process.exit(1);
}

if (!WRITE) {
  console.log('\n预演结束。加 --write 才会真正写盘（会先备份）。');
  process.exit(0);
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backup = DB + '.bak-' + stamp;
fs.copyFileSync(DB, backup);
fs.writeFileSync(DB, JSON.stringify(db), 'utf8');
console.log('\n已迁移 ' + hits.length + ' 条。');
console.log('备份：' + backup);
