'use strict';

/**
 * 验证「不启动服务、直接双击 login.html 打开」时的本地降级模式是否可用。
 * 这条路径用于用户没有 Node 环境的场景。
 */

const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

/* ⚠️ 默认 0 = 「让 Chrome 自己挑一个空闲端口」，不再写死一个。
   写死端口的坑：上一次跑崩（node 被强杀，finally 跑不到）会留下没退干净的
   浏览器继续占着它；下一次启动的浏览器抢不到，而连接**照样成功** ——
   连到的是那台残留实例，它停在哪一页就量哪一页，报出来的错全指向无关的地方。
   要固定端口就设 CDP_PORT。 */
const PORT = process.env.CDP_PORT ? Number(process.env.CDP_PORT) : 0;
const CHROME = process.env.CHROME_PATH
  || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DIR = path.join(os.tmpdir(), 'pl-file-profile-' + Date.now());
const LOGIN = 'file:///' + path.resolve(__dirname, '..', 'public', 'login.html').replace(/\\/g, '/');
const APP = 'file:///' + path.resolve(__dirname, '..', 'public', 'app.html').replace(/\\/g, '/');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 这个端口上已经有人在监听了吗？ */
function portInUse(port) {
  return new Promise((resolve) => {
    const net = require('net');
    const srv = net.createServer();
    srv.once('error', (err) => resolve(err.code === 'EADDRINUSE'));
    srv.once('listening', () => srv.close(() => resolve(false)));
    srv.listen(port, '127.0.0.1');
  });
}

/**
 * 关掉这台浏览器。
 *
 * ⚠️ 别指望 spawn 出来的那个 PID：Windows 上 chrome.exe 常常是个**启动器**，
 * 它把真正的浏览器进程拉起来之后自己就退了（exitCode 立刻变 0）。于是
 *   ① 「exitCode !== null 就跳过」的守卫会让收尾整个变成空操作；
 *   ② taskkill /PID <那个已死的 pid> /T /F 也找不到任何东西，真正的浏览器
 *      带着十几个子进程继续活着（实测残留 12 个），还占着调试端口和临时目录。
 * 而且 taskkill 的 COMMANDLINE 过滤器在中文 Windows 上不支持，没法按
 * --user-data-dir 认人。
 *
 * 有效的是让浏览器自己关自己：CDP 的 Browser.close。实测 12 个进程 → 0，
 * 跨平台，不需要 PID。ws 是浏览器级连接，所以这个命令直接可用。
 * 连不上时才退回按 PID 杀 —— POSIX 上这一条本来就是对的。
 */
async function closeBrowser(ws, child) {
  if (ws) {
    try {
      await new Promise((resolve) => {
        /* ⚠️ id 必须是**数字**。CDP 会静默忽略字符串 id —— 命令不执行、也不报错，
           连回包都没有（实测：'pl-close' 石沉大海，987654321 立刻生效）。
           一个不生效又不报错的关浏览器命令，比没有更糟：它会让人以为收尾做了。 */
        const id = 987654321;
        const done = () => { clearTimeout(timer); resolve(); };
        const timer = setTimeout(done, 5000);
        const onMsg = (ev) => {
          try { if (JSON.parse(ev.data).id === id) done(); } catch (e) { /* 不是回包 */ }
        };
        ws.addEventListener('message', onMsg);
        try { ws.send(JSON.stringify({ id, method: 'Browser.close' })); } catch (e) { done(); }
      });
    } catch (e) { /* 下面还有兜底 */ }
  }
  try { if (child && child.pid && child.exitCode === null) child.kill(); } catch (e) { /* 已经没了 */ }
  await sleep(600);   // 等文件句柄松开，接着的 rmSync 才不会半路失败
}

/**
 * 拿到这台浏览器**真正**在监听的调试端口。
 *
 * ⚠️ 就绪信号不能用「端口能连上」—— 端口被残留进程占着时那个条件也成立，
 * 于是你会连上**别人**的浏览器。传 0 时 Chrome 自己挑一个空闲端口并写进
 * user-data-dir 里的 DevToolsActivePort；那个目录每次都是新的时间戳目录，
 * 所以这个文件只可能是我们 spawn 的这台写的 —— 它等于一张收据。
 */
async function resolveDebugPort(port, userDir, proc) {
  if (port) {
    if (await portInUse(port)) {
      throw new Error('调试端口 ' + port + ' 已被占用 —— 多半是上一次跑崩留下的浏览器没退干净。');
    }
    return port;
  }
  const portFile = path.join(userDir, 'DevToolsActivePort');
  for (let i = 0; i < 80; i += 1) {
    try {
      const line = fs.readFileSync(portFile, 'utf8').split('\n')[0].trim();
      if (line) return Number(line);
    } catch (err) { /* 还没写出来 */ }
    /* ⚠️ 这里**不能**「进程一退出就报错」。
       Windows 上 Chrome 启动时会把活交给另一个进程，被 spawn 的那一个
       很快就 exit 0 —— 实测：**222ms 退出，而端口文件 507ms 才写出来**。
       那个判据必然抢在端口文件之前触发，报「浏览器进程提前退出」，
       而浏览器其实好好的。`browser-check.js` 里同一段没有这一行，
       所以它一直好着 —— 三个脚本挂两个、好一个，差别就在这一行。
       进程退出只是**提示**，判据只有端口文件。 */
    await sleep(250);
  }
  throw new Error('浏览器没写出 ' + portFile + ' —— 调试端口没起来'
    + (proc.exitCode !== null ? '（被 spawn 的进程已退出 exit ' + proc.exitCode + '，这只说明它把活交出去了）' : ''));
}

// 成品里有两张行形状一样的表（分镜表 / 首尾帧参考），必须按小节标题取，
// 不能全量扫 `.prompt-table`。实现与 browser-check.js 共用同一份。
const { TABLE_AFTER_HELPER } = require('./table-probe');

async function main() {
  const chrome = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--window-size=1440,940', '--remote-debugging-port=' + PORT,
    '--user-data-dir=' + USER_DIR, 'about:blank',
  ], { stdio: 'ignore' });

  const failures = [];
  const check = (label, cond, extra) => {
    console.log((cond ? '  ✓ ' : '  ✗ ') + label + (cond || !extra ? '' : '  → ' + extra));
    if (!cond) failures.push(label);
  };

  /* ws 要提到 try 外面：finally 里关浏览器得靠它（见 closeBrowser 的注释） */
  let ws = null;

  try {
    // 先确认「自己那台」的调试端口起来了（见 resolveDebugPort 的注释）
    const debugPort = await resolveDebugPort(PORT, USER_DIR, chrome);

    let targets = null;
    for (let i = 0; i < 40; i += 1) {
      try {
        const res = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
        targets = await res.json();
        if (targets && targets.length) break;
      } catch (e) { /* 等 */ }
      await sleep(250);
    }
    if (!targets || !targets.length) throw new Error('无法连接到 Chrome 调试端口 ' + debugPort);
    ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
    await new Promise((res, rej) => {
      ws.addEventListener('open', res);
      ws.addEventListener('error', rej);
    });

    let id = 0;
    const pending = new Map();
    ws.addEventListener('message', (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id && pending.has(m.id)) {
        const p = pending.get(m.id);
        pending.delete(m.id);
        if (m.error) p.reject(new Error(m.error.message)); else p.resolve(m.result);
      }
    });
    const send = (method, params) => new Promise((resolve, reject) => {
      id += 1;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params: params || {} }));
      setTimeout(() => { if (pending.has(id)) { pending.delete(id); reject(new Error('超时 ' + method)); } }, 20000);
    });
    const evaluate = async (expr) => {
      const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception || {}).description);
      return r.result.value;
    };
    const goto = async (url) => {
      await send('Page.navigate', { url });
      await sleep(1400);
    };

    await send('Page.enable');
    await send('Runtime.enable');

    console.log('\n[文件模式] ' + LOGIN);
    await goto(LOGIN);
    check('页面已加载', (await evaluate('document.title')).indexOf('PromptLens') !== -1);
    check('检测到本地降级模式', await evaluate('window.PromptLensAPI.isLocalMode === true'));

    const user = 'file' + Date.now().toString(36);
    await evaluate(`(() => {
      document.querySelector('.tab[data-tab="register"]').click();
      document.getElementById('username').value = ${JSON.stringify(user)};
      document.getElementById('password').value = 'test123456';
      document.getElementById('authForm').dispatchEvent(new Event('submit', {cancelable:true, bubbles:true}));
      return true;
    })()`);
    await sleep(1500);
    check('注册后跳转到 app.html', (await evaluate('location.pathname')).indexOf('app.html') !== -1);

    await sleep(800);
    check('本地模式登录态可用', (await evaluate('document.getElementById("userName").textContent')) !== '加载中');
    check('显示本地模式提示', !(await evaluate('document.getElementById("envBadge").classList.contains("hidden")')));

    await evaluate(`(() => {
      const ta = document.getElementById('rawPrompt');
      ta.value = '帮我写一篇关于远程办公的公众号文章，要给公司同事看的';
      ta.dispatchEvent(new Event('input', {bubbles:true}));
      document.getElementById('startBtn').click();
      return true;
    })()`);
    await sleep(500);
    check('可以开始拆解', (await evaluate('document.querySelectorAll(".q-block").length')) >= 2);

    let rounds = 0;
    while (rounds < 15) {
      if (await evaluate('!document.getElementById("stageResult").classList.contains("hidden")')) break;
      const blocks = await evaluate('document.querySelectorAll(".q-block").length');
      if (!blocks) break;
      rounds += 1;
      await evaluate(`(() => {
        document.querySelectorAll('.q-block').forEach(b => {
          const o = b.querySelector('.option-btn:not(.is-skip):not(.is-custom)');
          if (o) o.click();
        });
        return true;
      })()`);
      await sleep(150);
      await evaluate('document.getElementById("nextBtn").click()');
      await sleep(250);
    }
    check('完成多轮并生成结果', rounds >= 5 && (await evaluate('document.getElementById("finalPrompt").textContent')).length > 200,
      '轮数=' + rounds);

    await sleep(700);
    check('记录写入浏览器本地存储',
      (await evaluate('document.querySelectorAll(".history-item").length')) >= 1);

    /* ---------------- 本地模式下的分镜表人工编辑 ----------------
     * 服务端那条链路有白名单，本地这条是 Object.assign —— 两条实现不一样，
     * 所以「编辑分镜表」在 file:// 下必须单独验一遍，不能靠服务端那条覆盖。 */
    console.log('\n[文件模式] 分镜表人工编辑');

    await evaluate('document.getElementById("newBtn").click()');
    await sleep(300);
    await evaluate(`document.querySelector('.sample-row [data-sample="video"]').click()`);
    await sleep(500);
    await evaluate('document.getElementById("startBtn").click()');
    await sleep(400);

    let vRounds = 0;
    while (vRounds < 15) {
      if (await evaluate('!document.getElementById("stageResult").classList.contains("hidden")')) break;
      const blocks = await evaluate('document.querySelectorAll(".q-block").length');
      if (!blocks) break;
      vRounds += 1;
      await evaluate(`(() => {
        const want = { 'vid.shot': ['特写', '中景', '近景', '全景'], 'vid.duration': ['15 秒以上'] };
        document.querySelectorAll('.q-block').forEach(b => {
          const opts = Array.from(b.querySelectorAll('.option-btn'))
            .filter(x => !x.classList.contains('is-skip') && !x.classList.contains('is-custom'));
          const labels = want[b.dataset.qid];
          const targets = labels
            ? labels.map(l => opts.find(x => x.textContent.indexOf(l) !== -1)).filter(Boolean)
            : opts.slice(0, 1);
          targets.forEach(o => { if (!o.classList.contains('selected')) o.click(); });
        });
        return true;
      })()`);
      await sleep(160);
      await evaluate('document.getElementById("nextBtn").click()');
      await sleep(260);
    }

    check('（本地模式）视频链路生成了分镜表',
      await evaluate(`(() => { ${TABLE_AFTER_HELPER} return !!tableAfter('分镜表'); })()`));

    await evaluate('document.getElementById("editBoardBtn").click()');
    await sleep(450);
    check('（本地模式）分镜表编辑器能打开',
      await evaluate('document.querySelectorAll(".board-card").length >= 2'));

    await evaluate(`(() => {
      const i = document.querySelectorAll('.board-card')[0].querySelector('input[data-f="seconds"]');
      i.value = '9';
      i.dispatchEvent(new Event('change'));
      return true;
    })()`);
    await sleep(220);
    await evaluate(`Array.from(document.querySelectorAll('.modal-actions button'))
      .find(b => b.textContent.indexOf('保存调整') !== -1).click()`);
    await sleep(900);

    check('（本地模式）手改的时长进了成品',
      (await evaluate(`(() => {
        ${TABLE_AFTER_HELPER}
        const tb = tableAfter('分镜表');
        const td = tb ? tb.querySelector('tbody tr td:nth-child(4)') : null;
        return td ? td.textContent.trim() : '';
      })()`)) === '9 秒');

    // 再加一镜：镜头数变了也要能穿过本地存储往返
    await evaluate('document.getElementById("editBoardBtn").click()');
    await sleep(450);
    const cardsBefore = await evaluate('document.querySelectorAll(".board-card").length');
    await evaluate('document.querySelector("[data-act=\'add-end\']").click()');
    await sleep(320);
    check('（本地模式）能加一镜',
      (await evaluate('document.querySelectorAll(".board-card").length')) === cardsBefore + 1);
    await evaluate(`Array.from(document.querySelectorAll('.modal-actions button'))
      .find(b => b.textContent.indexOf('保存调整') !== -1).click()`);
    await sleep(900);
    check('（本地模式）加出来的那一镜进了成品',
      (await evaluate(`(() => {
        ${TABLE_AFTER_HELPER}
        const tb = tableAfter('分镜表');
        return tb ? tb.querySelectorAll('tbody tr').length : 0;
      })()`)) === cardsBefore + 1);

    // 刷新一次，再从记录里载入 —— 本地存储里的 storyboardEdit 必须能还回来
    await goto(APP);
    await sleep(1100);
    await evaluate('document.querySelector(".history-item").click()');
    await sleep(800);
    await evaluate('document.getElementById("editBoardBtn").click()');
    await sleep(450);
    check('（本地模式）刷新后从记录里打开编辑器，手改的时长还在',
      (await evaluate(`(() => {
        const c = document.querySelectorAll('.board-card')[0];
        return c ? Number(c.querySelector('input[data-f="seconds"]').value) : -1;
      })()`)) === 9);
    check('（本地模式）刷新后镜头数也还是改过的那个数',
      (await evaluate('document.querySelectorAll(".board-card").length')) === cardsBefore + 1);

    /* ⚠️ 这里**不能**先 ws.close()：关浏览器要靠 finally 里的
       closeBrowser(ws, ...) 往这条连接上发 Browser.close。连接一断，那条命令
       就发不出去，只能退回按 PID 杀 —— 而 Windows 上 spawn 出来的 chrome.exe
       是个拉完真进程就退的启动器，那个 PID 早死了，结果整棵进程树都留下来
       （实测每次跑留 12~16 个进程）。连接会在浏览器退出时自然断开。 */
  } catch (err) {
    console.error('\n运行出错：' + err.message);
    failures.push(err.message);
  } finally {
    await closeBrowser(ws, chrome);
    try { fs.rmSync(USER_DIR, { recursive: true, force: true }); } catch (e) { /* ignore */ }
  }

  console.log('\n' + '='.repeat(56));
  if (failures.length) {
    console.log('失败 ' + failures.length + ' 项');
    process.exit(1);
  }
  console.log('文件模式全部通过 ✓');
  process.exit(0);
}

main();
