'use strict';

/**
 * 数据库审计（**只读**，绝不写盘）
 *
 * 为什么要单独有个工具：端到端脚本每跑一次就注册一个新账号
 * （`browser-check.js` 里是 `'e2e' + Date.now().toString(36)`），
 * 跑了几十遍之后 `data/db.json` 里就积了一堆测试账号和记录。
 * 清理是**不可逆**的，所以第一步永远是「先看清楚有哪些、各属于谁、什么时候建的」，
 * 让人过目之后再动手 —— 这个脚本只做第一步。
 *
 * 用法：
 *   node scripts/db-audit.js              # 打印人类可读的报告
 *   node scripts/db-audit.js --json       # 额外打印一份机器可读的清单（给后续删除用）
 *   node scripts/db-audit.js --db <路径>   # 审计别的库
 *
 * **它不会删任何东西。** 想删的话是另一件事，需要人明确确认（见 memory 里的约定）。
 */

const fs = require('fs');
const path = require('path');

const DB_FILE = (() => {
  const i = process.argv.indexOf('--db');
  if (i !== -1 && process.argv[i + 1]) return path.resolve(process.argv[i + 1]);
  return path.join(__dirname, '..', 'data', 'db.json');
})();
const AS_JSON = process.argv.includes('--json');

/**
 * 测试账号的前缀。匹配规则是「以此开头」，所以 `probe` 已经覆盖 `probe2` / `probe3`
 * 这类加后缀的账号，不必逐个列 —— 列了反而让人以为它们是特例。
 *
 * `e2e` 是端到端脚本自己注册的（`browser-check.js`）。
 * 其余三个是**排查问题时手工开的账号** —— 当时为了复现某个现象临时注册，
 * 用完没清。它们和 e2e 一样是测试数据，但前缀不同，容易漏，
 * 所以在这里显式列出来，而不是靠一个 `e2e` 前缀去猜。
 *
 * 加新前缀的时机：以后再开临时账号时，顺手加进来 —— 漏掉的话它会一直躺在库里，
 * 而这份报告看起来「已经清干净了」。
 */
const TEST_PREFIXES = ['e2e', 'probe', 'proof', 'btn'];

function classify(username) {
  const u = String(username || '');
  const hit = TEST_PREFIXES.find((p) => u.indexOf(p) === 0);
  return hit ? { kind: 'test', prefix: hit } : { kind: 'keep', prefix: null };
}

function fmtTime(ms) {
  if (!ms) return '(无时间)';
  const d = new Date(ms);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} `
    + `${p(d.getHours())}:${p(d.getMinutes())}`;
}

function main() {
  if (!fs.existsSync(DB_FILE)) {
    console.error('找不到数据库：' + DB_FILE);
    process.exit(1);
  }
  const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  const users = db.users || [];
  const projects = db.projects || [];
  const sessions = db.sessions || [];

  // ---- 账号分类 ----
  const byId = new Map(users.map((u) => [u.id, u]));
  const testUsers = users.filter((u) => classify(u.username).kind === 'test');
  const keepUsers = users.filter((u) => classify(u.username).kind === 'keep');
  const testIds = new Set(testUsers.map((u) => u.id));

  // ---- 记录归属 ----
  const testProjects = projects.filter((p) => testIds.has(p.userId));
  const keepProjects = projects.filter((p) => !testIds.has(p.userId));
  // 孤儿：userId 在 users 里找不到。可能是手工改库改坏了，也可能删账号时漏删了记录。
  const orphans = projects.filter((p) => !byId.has(p.userId));
  const testSessions = sessions.filter((s) => testIds.has(s.userId));
  const orphanSessions = sessions.filter((s) => !byId.has(s.userId));

  const times = projects
    .map((p) => p.createdAt || p.updatedAt)
    .filter((t) => typeof t === 'number');
  const span = times.length
    ? `${fmtTime(Math.min(...times))} ~ ${fmtTime(Math.max(...times))}`
    : '(无法判断)';

  console.log('库文件：' + DB_FILE);
  console.log('大小：' + (fs.statSync(DB_FILE).size / 1024 / 1024).toFixed(2) + ' MB');
  console.log('');
  console.log('总览：' + users.length + ' 个账号 / ' + projects.length + ' 条记录 / '
    + sessions.length + ' 个登录态');
  console.log('记录时间跨度：' + span);
  console.log('');
  console.log('--- 保留 ---');
  keepUsers.forEach((u) => {
    const n = projects.filter((p) => p.userId === u.id).length;
    console.log(`  ${u.username}（${u.displayName}） · ${n} 条记录 · 建于 ${fmtTime(u.createdAt)}`);
  });
  console.log('');
  console.log('--- 疑似测试数据 ---');
  const byPrefix = {};
  testUsers.forEach((u) => {
    const k = classify(u.username).prefix;
    byPrefix[k] = (byPrefix[k] || 0) + 1;
  });
  Object.entries(byPrefix).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    const n = testProjects.filter((p) => {
      const u = byId.get(p.userId);
      return u && classify(u.username).prefix === k;
    }).length;
    console.log(`  ${k}* : ${v} 个账号 · ${n} 条记录`);
  });
  console.log(`  合计：${testUsers.length} 个账号 / ${testProjects.length} 条记录 / `
    + `${testSessions.length} 个登录态`);
  console.log('');
  console.log('--- 需要单独判断的 ---');
  if (orphans.length) {
    console.log(`  ⚠ 孤儿记录（userId 找不到对应账号）：${orphans.length} 条`);
    orphans.slice(0, 5).forEach((p) => console.log(`      ${p.id}  userId=${p.userId}`));
    if (orphans.length > 5) console.log(`      …… 另有 ${orphans.length - 5} 条`);
    console.log('      这些不该由前缀规则决定去留 —— 先查清楚是谁的。');
  } else {
    console.log('  孤儿记录：无');
  }
  if (orphanSessions.length) {
    console.log(`  ⚠ 孤儿登录态：${orphanSessions.length} 个（账号已不在，token 还留着）`);
  } else {
    console.log('  孤儿登录态：无');
  }
  console.log('');
  // 同目录的备份也值得看一眼：里面往往存着**同一批测试数据**，
  // 只清主库的话，备份里那份还在（而且它才是「删错了」时的救命稻草，别顺手删）。
  const dir = path.dirname(DB_FILE);
  const base = path.basename(DB_FILE);
  const baks = fs.readdirSync(dir).filter((f) => f.indexOf(base + '.bak-') === 0);
  if (baks.length) {
    console.log('--- 同目录备份（清主库时别动它们）---');
    baks.forEach((f) => {
      const kb = fs.statSync(path.join(dir, f)).size / 1024 / 1024;
      console.log(`  ${f} · ${kb.toFixed(2)} MB`);
    });
    console.log('  它们含同一批测试数据；但也是删错时的回退点，清理时不要一起删。');
    console.log('');
  }
  console.log('**本工具只读，没有改动任何文件。** 清理需要另行确认。');

  if (AS_JSON) {
    const manifest = {
      db: DB_FILE,
      generatedAt: new Date().toISOString(),
      // 只列 id，不列内容 —— 清单是给人过目用的，不需要把用户数据再抄一份出来。
      remove: {
        userIds: testUsers.map((u) => u.id),
        usernames: testUsers.map((u) => u.username),
        projectIds: testProjects.map((p) => p.id),
        sessionTokens: testSessions.map((s) => s.token),
      },
      keep: {
        userIds: keepUsers.map((u) => u.id),
        usernames: keepUsers.map((u) => u.username),
        projectIds: keepProjects.map((p) => p.id),
      },
      needsReview: {
        orphanProjectIds: orphans.map((p) => p.id),
        orphanSessionTokens: orphanSessions.map((s) => s.token),
      },
    };
    console.log('');
    console.log('--- JSON 清单 ---');
    console.log(JSON.stringify(manifest, null, 2));
  }
}

main();
