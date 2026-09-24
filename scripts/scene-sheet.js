'use strict';

/**
 * 示例图对照表
 * ------------------------------------------------------------------
 * 把渲染器产出的所有示例图铺成一张对照表并截图。
 * 参数化绘图最容易「代码没报错但图看不出差别」，所以必须用眼睛验收一次。
 *
 * 用法：node scripts/scene-sheet.js [输出文件名]
 */

const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const Scene = require(path.join(__dirname, '..', 'public', 'assets', 'js', 'scene.js'));

const OUT = process.argv[2] || 'scene-sheet.png';
const ONLY = process.env.SHEET_ONLY || '';      // 只看某一组（标题关键字）
const ITEM = process.env.SHEET_ITEM || '';      // 只看某一个选项（标题关键字）
const COLS = Number(process.env.SHEET_COLS || 5); // 大图模式传 2-3
/* ⚠️ 默认 0 = 「让 Chrome 自己挑一个空闲端口」，不再写死一个。
   写死端口的坑：上一次跑崩（node 被强杀，finally 跑不到）会留下没退干净的
   浏览器继续占着它；下一次启动的浏览器抢不到，而连接**照样成功** ——
   连到的是那台残留实例，它停在哪一页就量哪一页，报出来的错全指向无关的地方。
   要固定端口就设 CDP_PORT。 */
const PORT = process.env.CDP_PORT ? Number(process.env.CDP_PORT) : 0;
const CHROME = process.env.CHROME_PATH
  || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SHOT_DIR = path.join(__dirname, '..', 'screenshots');
const USER_DIR = path.join(os.tmpdir(), 'pl-sheet-' + Date.now());

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

/* 每一组：题目 / 未选时的基础场景 / 各选项的改动 */
const GROUPS = [
  {
    title: '光线（img.lighting）',
    base: { lightDir: 'front', lightSoft: 0.55, contrast: 0.4 },
    items: [
      ['柔和自然光', { lightDir: 'side', lightSoft: 1, contrast: 0.25 }],
      ['黄金时刻暖光', { lightDir: 'sideR', lightSoft: 0.5, contrast: 0.6, lightTemp: 'warm' }],
      ['蓝调时刻冷光', { lightSoft: 0.85, lightTemp: 'cool', key: 'low' }],
      ['侧逆光 / 轮廓光', { lightDir: 'back', rim: 1 }],
      ['影棚布光', { studio: true, lightDir: 'side', lightSoft: 0.3, contrast: 0.72 }],
      ['硬光 / 强阴影', { lightDir: 'side', lightSoft: 0, contrast: 1 }],
      ['霓虹 / 赛博彩光', { palette: 'neon', glow: 1, key: 'low' }],
      ['暗调照明', { key: 'low', contrast: 0.7 }],
      ['高调明亮', { key: 'high', contrast: 0.25 }],
      ['体积光 / 丁达尔', { lightDir: 'sideR', rays: 1, lightSoft: 0.4 }],
    ],
  },
  {
    title: '景别与视角（img.composition / img.angle）',
    base: { shot: 'medium', angle: 'eye' },
    items: [
      ['大远景', { shot: 'extreme' }],
      ['全景', { shot: 'wide' }],
      ['中景', { shot: 'medium' }],
      ['近景', { shot: 'close' }],
      ['特写', { shot: 'cu' }],
      ['极特写', { shot: 'macro' }],
      ['平视', { angle: 'eye' }],
      ['仰视', { angle: 'low' }],
      ['俯视', { angle: 'high' }],
      ['倾斜构图', { angle: 'dutch' }],
      ['航拍俯瞰', { angle: 'aerial' }],
      ['过肩视角', { angle: 'over' }],
    ],
  },
  {
    title: '画幅比例（img.ratio / vid.ratio）',
    base: {},
    items: [
      ['1:1 方图', { ratio: '1:1' }],
      ['3:4 竖图', { ratio: '3:4' }],
      ['9:16 竖屏', { ratio: '9:16' }],
      ['16:9 横屏', { ratio: '16:9' }],
      ['21:9 宽幅', { ratio: '21:9' }],
      ['2:3 竖幅', { ratio: '2:3' }],
    ],
  },
  {
    title: '色彩基调（img.palette）',
    base: {},
    items: [
      ['暖色调', { palette: 'warm' }],
      ['冷色调', { palette: 'cool' }],
      ['低饱和 / 单色', { palette: 'mono' }],
      ['莫兰迪色系', { palette: 'morandi' }],
      ['高饱和撞色', { palette: 'contrast' }],
      ['黑白', { palette: 'bw' }],
      ['复古褪色', { palette: 'faded' }],
    ],
  },
  {
    title: '风格流派（img.style）',
    base: {},
    items: [
      ['写实摄影', { style: 'photo' }],
      ['电影感', { style: 'cinema' }],
      ['日系清新', { style: 'jp' }],
      ['国风水墨', { style: 'ink' }],
      ['3D 渲染', { style: '3d' }],
      ['赛博朋克', { style: 'cyber' }],
      ['复古胶片', { style: 'film' }],
      ['极简扁平插画', { style: 'flat' }],
      ['油画 / 厚涂', { style: 'oil' }],
      ['概念艺术', { style: 'concept' }],
      ['像素风', { style: 'pixel' }],
      ['蒸汽波', { style: 'vapor' }],
    ],
  },
  {
    title: '画质与镜头（img.quality）',
    base: {},
    items: [
      ['高细节', {}],
      ['浅景深、背景虚化', { dof: 0.95 }],
      ['85mm 人像镜头', { shot: 'close', dof: 0.5 }],
      ['广角镜头张力', { shot: 'wide', angle: 'low' }],
      ['长曝光 / 运动模糊', { move: 'track', dof: 0.3 }],
      ['胶片颗粒', { grain: 0.4 }],
      ['8K 超高清', { contrast: 0.65 }],
      ['真实皮肤质感', { shot: 'cu', dof: 0.35 }],
    ],
  },
  {
    title: '运镜方式（vid.move）',
    base: {},
    items: [
      ['固定机位', { move: 'static' }],
      ['推近', { move: 'push' }],
      ['拉远', { move: 'pull' }],
      ['横移', { move: 'track' }],
      ['摇镜', { move: 'pan' }],
      ['升降', { move: 'crane' }],
      ['环绕', { move: 'orbit' }],
      ['手持', { move: 'handheld' }],
    ],
  },
  {
    title: '影像风格（vid.style）',
    base: {},
    items: [
      ['电影感', { style: 'cinema' }],
      ['纪实', { style: 'documentary' }],
      ['广告质感', { style: 'ad' }],
      ['动漫', { style: 'anime' }],
      ['定格动画', { style: 'stopmotion' }],
      ['VHS 复古', { style: 'vhs' }],
    ],
  },
];

/* ------------------------------------------------------------------ */

function buildHtml() {
  const list = ONLY ? GROUPS.filter((g) => g.title.indexOf(ONLY) !== -1) : GROUPS;
  const groups = list.map((g) => {
    const items = ITEM ? g.items.filter(([label]) => label.indexOf(ITEM) !== -1) : g.items;
    const cells = items.map(([label, demo]) => {
      const before = Scene.withDemo(g.base, {});
      const after = Scene.withDemo(g.base, demo);
      return `<figure class="cell">
        <figcaption>${label}</figcaption>
        <div class="pair">
          <div class="shot before">${before}<span class="tag">未选</span></div>
          <div class="arrow">→</div>
          <div class="shot after">${after}<span class="tag on">选了</span></div>
        </div>
      </figure>`;
    }).join('');
    return `<section><h2>${g.title}</h2><div class="grid">${cells}</div></section>`;
  }).join('');

  return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8">
<title>示例图对照表</title>
<style>
  body { margin:0; padding:26px 30px 60px; background:#f6f7fb;
         font-family:"PingFang SC","Microsoft YaHei",system-ui,sans-serif; color:#1c1f26; }
  h1 { font-size:19px; margin:0 0 4px; }
  .sub { color:#6b7280; font-size:12.5px; margin-bottom:22px; }
  h2 { font-size:14px; margin:30px 0 12px; padding-bottom:7px;
       border-bottom:1px solid #e3e6ee; color:#374151; }
  .grid { display:grid; grid-template-columns:repeat(${COLS},1fr); gap:12px; }
  .cell { margin:0; background:#fff; border:1px solid #e3e6ee; border-radius:10px; padding:8px; }
  figcaption { font-size:11.5px; font-weight:600; margin-bottom:6px; color:#374151;
               white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .pair { display:flex; align-items:center; gap:5px; }
  .shot { position:relative; flex:1; aspect-ratio:3/2; border-radius:6px; overflow:hidden;
          background:#e9ecf3; outline:1px solid #dfe3ec; }
  .shot svg { display:block; width:100%; height:100%; }
  .arrow { color:#9aa3b2; font-size:12px; flex:0 0 auto; }
  .tag { position:absolute; left:3px; bottom:3px; font-size:9px; padding:1px 4px;
         border-radius:4px; background:rgba(0,0,0,.55); color:#fff; }
  .tag.on { background:#5b53e0; }
</style></head><body>
<h1>示例图对照表</h1>
<div class="sub">每一对都是同一个场景：左边是「没选这个维度」，右边是「选了这个选项」。检查差异是否一眼可见。</div>
${groups}
</body></html>`;
}

/* ------------------------------------------------------------------ */

class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.events = [];
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      } else if (msg.method) {
        this.events.push(msg);
      }
    });
  }

  send(method, params) {
    this.id += 1;
    const id = this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params: params || {} }));
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error('CDP 超时: ' + method));
        }
      }, 30000);
    });
  }
}

async function main() {
  if (!fs.existsSync(SHOT_DIR)) fs.mkdirSync(SHOT_DIR, { recursive: true });
  const htmlPath = path.join(os.tmpdir(), 'pl-scene-sheet.html');
  fs.writeFileSync(htmlPath, buildHtml(), 'utf8');

  const chrome = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--hide-scrollbars', '--window-size=1500,1200',
    '--remote-debugging-port=' + PORT,
    '--user-data-dir=' + USER_DIR,
    'about:blank',
  ], { stdio: 'ignore' });

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
      } catch (e) { /* 继续等 */ }
      await sleep(250);
    }
    if (!targets || !targets.length) throw new Error('无法连接到 Chrome 调试端口 ' + debugPort);

    const page = targets.find((t) => t.type === 'page');
    ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((res, rej) => {
      ws.addEventListener('open', res);
      ws.addEventListener('error', rej);
    });

    const cdp = new CDP(ws);
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Page.navigate', { url: 'file:///' + htmlPath.replace(/\\/g, '/') });

    for (let i = 0; i < 60; i += 1) {
      await sleep(120);
      if (cdp.events.some((e) => e.method === 'Page.loadEventFired')) break;
    }
    await sleep(900); // 等 SVG 滤镜渲染完

    const m = await cdp.send('Page.getLayoutMetrics');
    const size = m.cssContentSize || m.contentSize;
    const res = await cdp.send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: true,
      clip: { x: 0, y: 0, width: Math.min(size.width, 1500), height: size.height, scale: 1 },
    });
    const outFile = path.join(SHOT_DIR, OUT);
    fs.writeFileSync(outFile, Buffer.from(res.data, 'base64'));

    // 顺便统计一下每个 SVG 的渲染尺寸，确认没有出现 0 高度
    const stats = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const svgs = Array.from(document.querySelectorAll('.shot svg'));
        const zero = svgs.filter(s => s.getBoundingClientRect().height < 10).length;
        return { total: svgs.length, zero: zero, cells: document.querySelectorAll('.cell').length };
      })()`,
      returnByValue: true,
    });
    console.log('对照图已生成：' + outFile);
    console.log('缩略图 ' + stats.result.value.total + ' 个，单元格 '
      + stats.result.value.cells + ' 个，未渲染 ' + stats.result.value.zero + ' 个');
    /* ⚠️ 这里**不能**先 ws.close()：关浏览器要靠 finally 里的
       closeBrowser(ws, ...) 往这条连接上发 Browser.close。连接一断，那条命令
       就发不出去，只能退回按 PID 杀 —— 而 Windows 上 spawn 出来的 chrome.exe
       是个拉完真进程就退的启动器，那个 PID 早死了，结果整棵进程树都留下来
       （实测每次跑留 12~16 个进程）。连接会在浏览器退出时自然断开。 */
  } finally {
    await closeBrowser(ws, chrome);
    try { fs.rmSync(USER_DIR, { recursive: true, force: true }); } catch (e) { /* ignore */ }
    try { fs.unlinkSync(htmlPath); } catch (e) { /* ignore */ }
  }
}

main().catch((e) => {
  console.error('出错：' + e.message);
  process.exit(1);
});
