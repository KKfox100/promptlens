'use strict';

/**
 * UI 侧的变异测试：故意把源码改坏，确认 browser-check.js 里对应的断言**真的会红**。
 *
 * 为什么需要它：
 *   scripts/mutation-check.js 只驱动 test-engine.js（纯 Node 那部分）。
 *   而这一轮改的东西几乎全在 CSS 和 HTML 里 —— 塌陷网格的补边层、dvh、
 *   触摸目标、结构化数据、落地页的排版节奏……这些没有一条能靠引擎测试守住。
 *   断言写了不等于有用：一条永远为真的断言，比没有断言更危险，
 *   因为它会让人以为这块被覆盖了。
 *
 * 做法：改坏 → 跑断言 → 看**指定的那一条**有没有报错 → 还原。
 * 只看「有没有变红」是不够的，必须看到**预期的那一条**变红 ——
 * 否则可能是碰巧让别的断言先崩了。
 *
 * ⚠️ 只改副本，不改 live tree。
 *   早先这脚本是直接改 public/ 下的真文件的。有一次它在前台跑到超时被 SIGTERM 杀掉，
 *   `finally` 根本没执行 —— 结果 main.css 的 `height: 100dvh` 那行、
 *   app.html 的 `noindex` 都留在改坏的状态里，而当时没人知道。
 *   （`finally` 挡得住异常，挡不住信号，更挡不住 SIGKILL。）
 *   现在改成：把 public/ 复制到临时目录，在副本上改，另起一个服务指向副本。
 *   杀进程最多留下一个临时目录，源码永远是干净的。
 *
 * 用法：**先停掉 5178 上的服务**（两个进程共用 data/db.json 会互相覆盖），
 * 然后 node scripts/mutation-check-ui.js —— 它会自己起一个服务、跑完再关掉。
 */

const fs = require('fs');
const os = require('os');
const net = require('net');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..');
const PUBLIC_SRC = path.join(ROOT, 'public');
const SERVER = path.join(ROOT, 'server.js');
const PORT = Number(process.env.PORT || 5178);

/* 副本里文件的路径 = 真文件路径去掉 `public/` 前缀。
   `file` 一律写成相对 ROOT 的路径，写日志时看得清楚。 */
const CSS = 'public/assets/css/main.css';
const LANDING = 'public/index.html';
const APP = 'public/app.html';
const WORKSPACE = 'public/assets/js/workspace.js';

const MUTATIONS = [
  {
    name: '落地页场景表去掉收口线（这一段直接撞到下一节）',
    file: CSS,
    from: '.scene-table-wrap {\n  overflow-x: auto;\n  border-bottom: 1px solid var(--rule);',
    to: '.scene-table-wrap {\n  overflow-x: auto;',
    expect: /\.scene-table-wrap 有收口线/,
  },
  {
    name: '.app-shell 高度退回 100vh（手机上底部操作栏会被推出屏幕）',
    file: CSS,
    from: '  height: 100vh;\n  height: 100dvh;',
    to: '  height: 100vh;',
    expect: /dvh 而不是 vh/,
  },
  {
    name: '触摸设备上按钮不再撑到 44px（手机和 iPad 一起过小）',
    file: CSS,
    from: '  .btn { min-height: 44px; }',
    to: '  .btn { min-height: 0; }',
    expect: /可点控件都 ≥44px/,
  },
  {
    name: '历史条目删除按钮退回「靠 hover 显形」（触摸设备上删不掉记录）',
    file: CSS,
    from: '  .history-item .h-del { opacity: 1; }',
    to: '  .history-item .h-del { opacity: 0; }',
    expect: /删除按钮在触摸设备上常驻可见/,
  },
  {
    name: '结构化数据里偷改一条问答（标记与页面内容不符＝作弊）',
    file: LANDING,
    from: '"name": "视频的分镜表能自己改吗？"',
    to: '"name": "视频分镜表能改吗？"',
    expect: /FAQ 结构化数据与页面问答逐条一致/,
  },
  {
    name: '工作台去掉 noindex（让爬虫收录一个必然打不开的页面）',
    file: APP,
    from: '<meta name="robots" content="noindex,nofollow">',
    to: '<meta name="robots" content="index,follow">',
    expect: /工作台声明 noindex/,
  },
  {
    name: '落地页 FAQ 去掉收口线（这一段直接撞到 CTA 横幅上）',
    file: CSS,
    from: '.faq-list {\n  margin: 0;\n  border-bottom: 1px solid var(--rule);\n}',
    to: '.faq-list {\n  margin: 0;\n}',
    expect: /\.faq-list 有收口线/,
  },
  {
    name: '场景表漏掉一个 data-label（窄屏竖排时那一格没有列名）',
    file: LANDING,
    from: '<td class="scene-tools" data-label="适用工具">可直接用于 ChatGPT',
    to: '<td class="scene-tools">可直接用于 ChatGPT',
    expect: /每个数据格都有 data-label/,
  },
  {
    name: '「适用工具」列的选择器退回 .scene-tools（被 .scene-table tbody td 盖掉字号和颜色）',
    file: CSS,
    from: '.scene-table tbody .scene-tools {',
    to: '.scene-tools {',
    expect: /「适用工具」列字号是 --fs-micro/,
  },

  /* 多语言那节的守门。它是「反向断言」——不是去查某个元素对不对，
     而是扫**整页**看还剩没剩中文，所以很容易写成一条永远为真的断言
     （白名单写错、哨兵没生效、扫错节点…都会让它恒绿）。
     这条变异就是证明它不是恒绿的：把一句界面文案退回硬编码中文，
     它必须在**问答页**那一格红出来。 */
  {
    name: '界面文案忘了接线（散句退回硬编码中文）',
    file: WORKSPACE,
    from: "el.roundBadge.textContent = t('第 {n} 轮', { n: state.session.round });",
    to: "el.roundBadge.textContent = '第 ' + state.session.round + ' 轮';",

    expect: /\[问答页\] 界面上没有「没接线的中文」/,
  },

  /* 「粘到你的 AI」工具条：这一排入口有 6 种静默失效的形态，
     每一种都要有一条变异把它弄红 —— 否则那些断言等于没写。 */
  {
    name: '结果页忘了渲染工具条（那一排入口永远是空的）',
    file: WORKSPACE,
    from: '    renderToolStrip(s.family);',
    to: '    /* renderToolStrip(s.family); */',
    expect: /工具条在页面上且不是空的/,
  },
  {
    name: '工具条入口丢了 href（点下去不知道去哪）',
    file: WORKSPACE,
    from: '      a.href = tool.url;',
    to: "      a.href = '';",
    expect: /每个入口都是 https 直链/,
  },
  {
    name: '工具条不再按 family 过滤（三类场景给同一组入口）',
    file: WORKSPACE,
    from: '    const list = TOOLS[family] || TOOLS.text;',
    to: '    const list = TOOLS.text;',
    expect: /三类场景的入口不是同一组/,
  },
  {
    name: '工具名没走 t()（en/ko/es 上直接显示中文）',
    file: WORKSPACE,
    from: '      name.textContent = t(tool.name);',
    to: '      name.textContent = tool.name;',
    expect: /界面上没有中文/,
  },
  {
    name: '工具徽标写成汉字（en/es/ko 界面上会多出汉字）',
    file: WORKSPACE,
    from: '      mono.textContent = tool.mono;',
    to: "      mono.textContent = '豆';",
    expect: /徽标不含汉字/,
  },
  {
    name: '工具条入口少了 noopener（对端页面能反向操作本页）',
    file: WORKSPACE,
    from: "      a.rel = 'noopener noreferrer';",
    to: "      a.rel = '';",
    expect: /新标签打开且带 noopener/,
  },
  {
    name: '工具条点了不复制（跳转正常，剪贴板是空的）',
    file: WORKSPACE,
    from: "        if (text) copyText(text, t('已复制到剪贴板，去粘贴给 AI 吧'));",
    to: '        /* 忘了复制 */',
    expect: /点一下会把成品复制进剪贴板/,
  },

  /* 下面两条守的是「工具条**看得见**」这件事。
     起因：用户报「没有看到工具条」，而当时那一整组结构断言全绿 ——
     它渲染了、href 也对，只是被 460px 高的 prompt 框推出了首屏。
     所以这两条模拟的正是「渲染得好好的，但用户看不见」这个失效：
     把工具条挪出固定底栏、让它跟着内容滚，一个落在末尾、一个落在开头。 */
  {
    name: '工具条跟着内容滚、落在结果区最末尾（首屏看不见）',
    file: WORKSPACE,
    from: "    el.toolRow.innerHTML = '';",
    to: "    el.toolRow.innerHTML = '';\n"
      + "    document.getElementById('stageResult').appendChild(document.getElementById('toolStrip'));",
    expect: /工具条在首屏里/,
  },
  {
    name: '工具条跟着内容滚、落在结果区最开头（滚到底就掉出视野）',
    file: WORKSPACE,
    from: "    el.toolRow.innerHTML = '';",
    to: "    el.toolRow.innerHTML = '';\n"
      + "    const st = document.getElementById('stageResult');\n"
      + "    st.insertBefore(document.getElementById('toolStrip'), st.firstChild);",
    expect: /滚到底部工具条仍在视野里/,
  },

  /* 下面三条守的是「触摸目标挂在正确的门控上」。
     起因：触摸目标原来挂在 `@media (max-width: 720px)` 里，
     于是 768 的 iPad、1194 的 iPad Pro 一条都拿不到 ——
     而 390 的手机全绿。**同一个缺陷，窄屏那一轮量不出来**，
     所以 [11.6] 特意换了一个比 720 宽的**触摸**视口。
     第一条变异就是把那个缺陷原样放回去。 */
  {
    name: '触摸目标退回宽度断点（iPad 又一条都拿不到）',
    file: CSS,
    from: '@media (hover: none), (pointer: coarse) {',
    to: '@media (max-width: 720px) {',
    expect: /iPad 落地页可点控件都 ≥44px/,
  },
  {
    name: '落地页 logo 不再撑到 44px（宽触摸设备上又变回 30px）',
    file: CSS,
    from: '  .logo { min-height: 44px; }\n',
    to: '',
    expect: /iPad 落地页可点控件都 ≥44px/,
  },
  /* 第三条不测产品，测**测试本身**：
     把语言菜单按钮的 class 去掉，探针就再也量不到它 ——
     如果「（前置）量到了 logo / 导航 / 语言菜单」那条断言是摆设，
     它会照样绿，而「都达标」也照样绿（名单里一个都不匹配 = tooSmall 为空）。
     这条变异红了，才说明那条前置断言真的在守着探针的盲区。
     ⚠️ .lang-menu-btn 是 <details> 的 <summary> ——
     'a, button, input, select' 一个都不匹配它，是最容易漏的一个。 */
  {
    name: '落地页语言菜单按钮丢掉 class（探针就量不到它了）',
    file: LANDING,
    from: 'class="lang-menu-btn"',
    to: 'class="x-lang-menu-btn"',
    expect: /iPad 落地页量到了 logo/,
  },
  /* 320px 那一格的守卫：页头三件套（343.6px，且都不收缩）放不下，
     就会把整页撑宽 24px。撤掉语言菜单是那一档的解。 */
  {
    name: '320px 页头三件套不撤（logo 的字留着 → 撑宽整页）',
    file: CSS,
    from: '  .logo > span:not(.logo-mark) { display: none; }\n',
    to: '',
    expect: /320px 落地页无横向溢出/,
  },
  /* ---------------- 免注册模式：两条位置断言，各配一条变异 ----------------
     免注册最要命的失效不是「不保存」没实现，而是**用户不知道它不保存**。
     所以 [15] 里那两个时刻量的是两件不同的事：
       · 刚进结果区 → 一次性解释（.guest-notice）必须在视口里
       · 滚到底     → 持续标识（顶栏 #envBadge）必须在视口里
     一个变异打不红两条，所以这里给每条各来一个。 */
  {
    name: '「这次没保存」的提示被挪到结果区最末尾（首屏看不见）',
    file: WORKSPACE,
    from: "      if (el.guestNotice) el.guestNotice.classList.remove('hidden');",
    to: "      if (el.guestNotice) {\n"
      + "        el.guestNotice.classList.remove('hidden');\n"
      + "        document.getElementById('stageResult').appendChild(el.guestNotice);\n"
      + "      }",
    expect: /刚进结果区时「这次没保存」的提示在视口里/,
  },
  /* 顶栏跟着内容一起滚 —— 改法是把滚动从内层 .main-scroll 挪到文档上
     （去掉 .app-shell 的 height:100vh 和 overflow:hidden），
     这是「整页滚动」重构里最常见的一步。
     ⚠️ 这一条能抓到，靠的是测试**把所有能滚的都滚到底**：
     只写 mainScroll.scrollTop 的话，这句在改完之后变成空操作，
     页面纹丝不动、标识当然还在视口里 —— 断言会变成永远为真的摆设。
     这个变异同时就是「滚三个地方」那句注释的证明。 */
  {
    name: '顶栏跟着内容一起滚（免注册标识滚出视野）',
    file: CSS,
    from: '.app-shell {\n  height: 100vh;\n  height: 100dvh;\n  display: flex;\n  flex-direction: column;\n  overflow: hidden;\n}',
    to: '.app-shell {\n  display: flex;\n  flex-direction: column;\n}',
    expect: /滚到底之后顶栏的免注册标识仍在视口内/,
  },

  /* ⚠️ 这里原来有一条「≤390px 页头不收边距」的变异，09-24 删了 ——
     它**抓不到**：把 main.css 里那一档删掉，485 条断言一条都不红。
     删不红的变异留着，等于给自己一个「这块有测试守着」的错觉。 */
];

/* ------------------------------------------------------------------ *
 * 副本 + 临时服务
 * ------------------------------------------------------------------ */

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'pl-ui-mut-'));
const SHADOW_PUBLIC = path.join(TMP, 'public');
let server = null;
let cleaned = false;

/** 'public/a/b.css' → 副本里的 'a/b.css' */
const shadowPath = (fileRelToRoot) => path.join(SHADOW_PUBLIC, fileRelToRoot.slice('public/'.length));

function cleanup() {
  if (cleaned) return;
  cleaned = true;
  if (server) { try { server.kill(); } catch (e) { /* 已经没了 */ } }
  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* 尽力而为 */ }
}

// finally 挡得住异常，挡不住信号 —— 这四条都得挂上
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(sig, () => { cleanup(); process.exit(130); });
}
process.on('exit', cleanup);
process.on('uncaughtException', (e) => { console.error(e); cleanup(); process.exit(1); });

/** 5178 上有没有别人在听。两个进程共用一个 data/db.json 会互相覆盖。 */
function portBusy(port) {
  return new Promise((resolve) => {
    const s = net.createConnection({ host: '127.0.0.1', port });
    s.setTimeout(400);
    s.on('connect', () => { s.destroy(); resolve(true); });
    s.on('error', () => resolve(false));
    s.on('timeout', () => { s.destroy(); resolve(false); });
  });
}

function waitForServer(port, ms) {
  const deadline = Date.now() + ms;
  return new Promise((resolve) => {
    const tick = () => {
      const s = net.createConnection({ host: '127.0.0.1', port });
      s.on('connect', () => { s.destroy(); resolve(true); });
      s.on('error', () => {
        s.destroy();
        if (Date.now() > deadline) resolve(false); else setTimeout(tick, 150);
      });
    };
    tick();
  });
}

/* 跑一轮 browser-check.js，把 stdout + stderr 原样收回来。
 *
 * ⚠️ 这里**故意用异步 spawn，不用 spawnSync**。两个理由：
 *  1. 实测 spawnSync 在某些受限环境里直接 `EBUSY`（沙箱不允许同步等子进程）。
 *     而失败时 `r.stdout` 是 `undefined` —— 拼出来是空串，下游把它读成
 *     「这一轮没有任何 ✗ 行」，于是**每一条变异都判成漏网**，
 *     打印「0 条被捕获，24 条漏网」。那句话看着像「断言全线失效」，
 *     其实是子进程根本没跑起来。**工具的静默失效比产品的更难发现** ——
 *     它披着「测试结果」的皮。
 *  2. 一轮四分钟，同步阻塞会把这四分钟里所有别的活儿（含超时判断）一起卡住。
 *
 * 所以：spawn 报错、或一行输出都没有，都**抛异常**，绝不返回空串。
 */
function runBrowserCheck() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(__dirname, 'browser-check.js')], {
      cwd: ROOT,
      env: Object.assign({}, process.env, { BASE: 'http://127.0.0.1:' + PORT }),
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '';
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try { child.kill(); } catch (e) { /* ignore */ }
      reject(new Error('browser-check.js 超过 15 分钟没跑完，已杀掉'));
    }, 15 * 60 * 1000);
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { out += d; });
    child.on('error', (e) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(new Error('拉不起 browser-check.js：' + e.code + ' ' + e.message
        + '\n  子进程起不来时输出是空的，不显式报出来的话，'
        + '下游会把它误判成「这一轮一条 ✗ 都没有」→ 每条变异都算漏网。'));
    });
    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (!out.trim()) {
        reject(new Error('browser-check.js 一行输出都没有（退出码 ' + code + '）'
          + '\n  这**不能**当成「一条都没抓到」——那会把工具故障说成断言失效。'));
        return;
      }
      resolve(out);
    });
  });
}

(async () => {
  if (await portBusy(PORT)) {
    console.error('✗ ' + PORT + ' 端口上已经有一个服务在跑。');
    console.error('  这个脚本会自己起服务，而两个进程共用 data/db.json 会互相覆盖，');
    console.error('  所以请先把它停掉（netstat -ano | grep :' + PORT + ' 找 PID）。');
    cleanup();
    process.exit(1);
  }

  // 复制一份 public/ 出来。CSS / JS / HTML / 几张 PNG，几十 KB 而已。
  fs.cpSync(PUBLIC_SRC, SHADOW_PUBLIC, { recursive: true });
  console.log('副本：' + SHADOW_PUBLIC);

  server = spawn(process.execPath, [SERVER], {
    cwd: ROOT,
    env: Object.assign({}, process.env, {
      PORT: String(PORT),
      PL_PUBLIC_DIR: SHADOW_PUBLIC,
    }),
    stdio: 'ignore',
  });
  if (!(await waitForServer(PORT, 8000))) {
    console.error('✗ 临时服务起不来');
    cleanup();
    process.exit(1);
  }
  console.log('临时服务：http://127.0.0.1:' + PORT + '（指向副本）\n');

  /* 起手先确认每个锚点都在。锚点不在的话，这条变异根本改不动东西，
     而它还会「通过」—— 那是自欺。早先这里只打印「跳过」，
     结果把「源码被上一次运行改坏没还原」误读成了「重构挪了锚点」。 */
  /* 支持只跑一段：MUT_FROM / MUT_TO 都是 1 起的序号，含首含尾。
     改完一小块时不必等全套（24 条约 54 分钟）。 */
  const from = Number(process.env.MUT_FROM || 1);
  const to = Number(process.env.MUT_TO || MUTATIONS.length);
  const TODO = MUTATIONS.slice(from - 1, to);
  if (TODO.length !== MUTATIONS.length) {
    console.log('⚠️ 只跑第 ' + from + '~' + to + ' 条（共 ' + TODO.length
      + ' / ' + MUTATIONS.length + ' 条）—— 这不是全套结果。\n');
  }

  const missing = TODO.filter((m) => {
    const f = shadowPath(m.file);
    return !fs.existsSync(f) || !fs.readFileSync(f, 'utf-8').includes(m.from);
  });
  if (missing.length) {
    console.error('✗ 有 ' + missing.length + ' 个锚点在副本里找不到，先别跑：');
    missing.forEach((m) => console.error('  · ' + m.name + '  ← ' + m.file));
    console.error('  锚点找不到 = 这条变异改不动任何东西，但输出还是绿的。');
    console.error('  要么是真重构过（去更新 from），要么是源码被上一次运行改坏没还原。');
    cleanup();
    process.exit(1);
  }

  let caught = 0;
  const missed = [];

  for (const m of TODO) {
    const target = shadowPath(m.file);
    const original = fs.readFileSync(target, 'utf-8');
    if (original.indexOf(m.from) === -1) {
      // 上一轮如果没还原干净（改坏写在副本里，这里就是兜底）
      console.log('· 跳过（锚点没找到）：' + m.name);
      missed.push(m.name + '（锚点失效）');
      continue;
    }

    let out;
    try {
      fs.writeFileSync(target, original.replace(m.from, m.to), 'utf-8');
      out = await runBrowserCheck();
    } finally {
      fs.writeFileSync(target, original, 'utf-8');   // 改的是副本，但照样还原
    }

    const failures = out.split('\n').filter((l) => l.indexOf('✗') !== -1);
    const hit = failures.some((l) => m.expect.test(l));

    if (hit) {
      caught += 1;
      console.log('✓ 被捕获：' + m.name);
    } else {
      missed.push(m.name);
      console.log('✗ 没被捕获：' + m.name);
      console.log('    实际报错行：' + (failures.length ? failures.join(' | ') : '（一条都没有）'));
    }
  }

  console.log('\n' + '='.repeat(60));
  if (missed.length === 0) {
    console.log('全部 ' + caught + ' 条变异都被捕获 ✓');
  } else {
    console.log(caught + ' 条被捕获，' + missed.length + ' 条漏网：');
    missed.forEach((n) => console.log('  · ' + n));
    process.exitCode = 1;
  }
  cleanup();
})();
