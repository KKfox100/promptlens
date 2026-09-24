'use strict';

/**
 * 设计 QA 工具：把界面上的关键组件单独放大拍下来，并量出几个「肉眼看不准」的几何量。
 *
 * 为什么要有它：
 *   整体截图缩到 1080px 宽之后，细节全是糊的 —— 判断「这条边框到底断没断」
 *   「这个字号是不是太小」只能靠猜。这个脚本把组件按 1.4~4 倍单独截出来，
 *   同时把坐标量出来打印，避免用肉眼读缩略图得出错误结论。
 *
 * 它实际抓到过的问题（留个记录，说明这类工具不是摆设）：
 *   1. .scenario-grid / .improve-grid 是「容器只画上/左边、单元格各自画右/下」的
 *      塌陷表格。末行填不满时右下角**一条边框都没有**：量出来容器右边缘 975px、
 *      末行只到 652px，中间 322px 全裸 —— 看起来像表格被切掉一角。
 *      修法是给容器加 ::after 补边，并在 browser-check.js 里加了断言钉住。
 *   2. .final-prompt 原来用等宽字体。Windows 上等宽字族没有中文字形，中文回落到
 *      宋体，13px 下又细又旧，而且 `#` 走等宽、正文走宋体，混排一眼就不齐。
 *
 * 用法：
 *   node scripts/ui-zoom.js                     # 默认巡检（登录 → 输入 → 问答 → 结果）
 *   node scripts/ui-zoom.js .btn .panel-title   # 只放大指定的选择器（每个阶段都试一遍）
 *   SCALE=3 node scripts/ui-zoom.js .logo       # 统一指定放大倍数
 *
 * 输出：screenshots/qa/*.png，几何与字号信息直接打在终端。
 * 依赖本地服务已启动（默认 http://127.0.0.1:5178，可用 BASE 覆盖）。
 */

const fs = require('fs');
const path = require('path');
const { launch, sleep } = require('C:/Users/jack/.workbuddy-ai/skills/cdp-browser-e2e/templates/cdp-client.js');

const BASE = process.env.BASE || 'http://127.0.0.1:5178';
const OUT = path.join(__dirname, '..', 'screenshots', 'qa');
/* 调试端口交给 Chrome 自己挑（见 cdp-client.js 里 port 的注释）。
   原来这里固定一个端口，上一次跑崩留下的浏览器会一直占着它 ——
   下一次启动的浏览器抢不到，而连接照样成功，于是量到的是**别人**那一页。
   要固定端口就设环境变量 CDP_PORT，模板会读。 */

/** 命令行里以 . 或 # 开头的参数当成选择器；给了就只拍这些 */
const CUSTOM = process.argv.slice(2).filter((a) => a.startsWith('.') || a.startsWith('#'));
const FORCE_SCALE = Number(process.env.SCALE || 0) || null;

/** 默认巡检：每个阶段拍哪几个组件、各放大几倍 */
const TOUR = {
  landing: [['.logo', 4], ['.hero-title', 1], ['.hero-actions', 1.4], ['.step-list', 1],
    ['.contrast-grid', 1.4], ['.scene-table-wrap', 1.4], ['.faq-list', 1], ['.cta-band', 1.4],
    /* 页头语言菜单是本轮新加的组件，而且是个**浮层** ——
       浮层的问题（被 sticky 页头裁掉、被别的层盖住、阴影没生效）只有放大看才发现得了。 */
    ['.lang-menu', 4], ['.site-foot', 2]],
  login: [['.logo', 4], ['.auth-brand', 1], ['.auth-form, form', 1.4]],
  input: [['.scenario-grid', 1.6], ['.scenario-btn.active', 3], ['.score-card', 2]],
  rounds: [['.q-block', 1.5], ['.option-btn', 2], ['.round-head', 2]],
  result: [['.result-hero', 1.6], ['.improve-grid', 1.4], ['.final-prompt', 1.4],
    /* 「粘到你的 AI」那一排入口：徽标块的对齐、hover 之前的状态、
       以及和上面 `.prompt-expand` 的间距，都只有放大看才看得清。 */
    ['.tool-strip', 1.6], ['.decision-item', 1.8]],
};

/**
 * 截取某个选择器的放大图（clip 用页面坐标，scale 用来放大）。
 *
 * ⚠️ **取景前必须先把元素滚进视野。**
 *   这个应用是 `height:100dvh` + 内部滚动容器（`#mainScroll`），
 *   **文档本身不滚** —— `window.scrollY` 恒为 0，元素在「内部容器里」滚出去之后，
 *   它的 `getBoundingClientRect()` 仍然算得出坐标，但那个坐标落在可视区之外。
 *   `captureBeyondViewport` 只能拍到**文档**里超出视口的部分，
 *   拍不到被内层滚动容器裁掉的部分 —— 结果是**一张空白图，而且不报错**。
 *   实测：`.tool-strip` 702 字节、`.decision-item` 899 字节，两张全白，
 *   而两处的元素都真实存在（browser-check 有断言把守）。
 *   **空白截图是「静默地给出错误证据」，比没有截图更糟。**
 */
async function zoomShot(cdp, selector, name, scale) {
  // 先滚进视野（block:'center' 让上下都留出余量），再量坐标
  await cdp.eval(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (el && el.getBoundingClientRect().width) el.scrollIntoView({ block: 'center' });
    return true;
  })()`);
  await sleep(260);

  const rect = await cdp.eval(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (!r.width) return null;                    // 藏在 display:none 的 stage 里
    return { x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width, h: r.height };
  })()`);
  if (!rect) { console.log('  · 跳过 ' + selector + '（不存在或不可见）'); return; }
  const pad = 6;
  const file = path.join(OUT, 'z-' + name + '.png');
  written.add(path.basename(file));
  await cdp.shot(file, {
    captureBeyondViewport: true,
    clip: {
      x: Math.max(0, rect.x - pad),
      y: Math.max(0, rect.y - pad),
      width: rect.w + pad * 2,
      height: rect.h + pad * 2,
      scale: FORCE_SCALE || scale || 2,
    },
  });
  console.log('  · ' + path.basename(file) + '  ' + Math.round(rect.w) + '×' + Math.round(rect.h));
}

/**
 * 本次运行真的写出来的文件名。
 *
 * 为什么需要它：这个目录是「给人看」的，而看图的人不会去核对时间戳。
 * 文件名的生成规则换过一次（早期保留连字符，现在是去掉所有非字母数字），
 * 于是 `z-q-block.png` 和 `z-qblock.png` 并存 —— 前者是改名前的旧图。
 * **有人打开旧的那张，看到的就是修复前的渲染，而且他不会有任何察觉。**
 * 这属于「静默地给出错误证据」，比没有截图更糟。
 * 所以每次跑完把没写过的 z-*.png 清掉；跑挂了就留着上一批，不清。
 */
const written = new Set();

function pruneStaleShots() {
  let removed = 0;
  for (const f of fs.readdirSync(OUT)) {
    if (!/^z-.*\.png$/.test(f) || written.has(f)) continue;
    fs.unlinkSync(path.join(OUT, f));
    removed += 1;
    console.log('  · 清掉陈旧截图 ' + f);
  }
  if (removed) console.log('（以上 ' + removed + ' 张不是本次生成的，已删除）');
}

/** 到了某个阶段就把它该拍的拍掉 */
async function tourStage(cdp, stage) {
  console.log('\n[' + stage + ']');
  if (CUSTOM.length) {
    for (const sel of CUSTOM) {
      await zoomShot(cdp, sel, stage + sel.replace(/[^a-zA-Z0-9]/g, ''), null);
    }
    return;
  }
  for (const [sel, scale] of TOUR[stage]) {
    await zoomShot(cdp, sel, sel.replace(/[^a-zA-Z0-9]/g, ''), scale);
  }
}

/**
 * 塌陷网格的几何：容器右边缘 vs 末行最右单元格。
 * 两者之差就是「裸着的那一块」有多宽 —— 大于 0 就必须有补边层。
 *
 * ⚠️ 这里**故意没有** `.scene-table-wrap`：落地页的场景那节已经从
 * 「gap:0 的塌陷网格」换成了真表格，塌陷网格那一类缺陷（末行右下角
 * 没有收口线）在它身上根本不会出现，放进来看只会得到一行恒为 0 的噪音。
 * 它现在由 `browser-check.js` 的表格探针 + `.scene-table-wrap 有收口线`
 * 那条变异守着。**别为了「看起来覆盖全」把它加回来。**
 */
const GRID_GEO = `(() => {
  const out = [];
  document.querySelectorAll('.scenario-grid, .improve-grid').forEach(grid => {
    const g = grid.getBoundingClientRect();
    if (!g.width) return;
    const cells = Array.from(grid.children).map(c => c.getBoundingClientRect());
    if (!cells.length) return;
    const lastTop = Math.max.apply(null, cells.map(c => c.top));
    const lastRow = cells.filter(c => Math.abs(c.top - lastTop) < 2);
    const a = getComputedStyle(grid, '::after');
    out.push({
      sel: grid.classList[0],
      cols: getComputedStyle(grid).gridTemplateColumns,
      rows: new Set(cells.map(c => Math.round(c.top))).size,
      lastRowCells: lastRow.length,
      gridRight: +g.right.toFixed(1),
      lastRowRight: +Math.max.apply(null, lastRow.map(c => c.right)).toFixed(1),
      nakedWidth: +(g.right - Math.max.apply(null, lastRow.map(c => c.right))).toFixed(1),
      patch: a.borderRightWidth + ' / ' + a.borderBottomWidth,
    });
  });
  return out;
})()`;

/** 关键文字的字号与字族 —— 用来发现「中文回落到宋体」这类看不见的问题 */
const FONT_PROBE = `(() => {
  const pick = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const cs = getComputedStyle(el);
    return cs.fontFamily.split(',')[0] + '  ' + cs.fontSize;
  };
  return {
    '最终 Prompt 正文': pick('.final-prompt'),
    '选项标题': pick('.option-btn .o-label'),
    '维度标签（应等宽小字）': pick('.q-title'),
    '问题本身（应衬线大字，≥17px 宋体才站得住）': pick('.q-text'),
    '面板小标签': pick('.panel-label'),
    '评分数字': pick('.score-card .sc-value'),
  };
})()`;

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const cdp = await launch({ width: 1440, height: 940 });

  /* 把语种钉死成简体，别继承跑图这台机器的浏览器语言。
     落地页现在会按系统语言自动跳转，不钉的话在英文环境的机器上
     打开 `/index.html` 会被带到 `/en/`，于是拍出来的「落地页组件图」
     全是英文版的 —— 而看图的人不会知道，只会觉得「怎么变英文了」。
     用 localStorage 而不是 URL 参数：和 browser-check.js 保持同一套做法。 */
  await cdp.send('Page.enable');
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
    source: 'try { localStorage.setItem("promptlens.locale", "zh-Hans"); } catch (e) {}',
  });

  try {
    /* ---------- 公开落地页（先看，它是陌生人看到的第一屏） ---------- */
    await cdp.goto(BASE + '/index.html');
    await sleep(400);
    await tourStage(cdp, 'landing');

    /* ---------- 登录页 ---------- */
    await cdp.goto(BASE + '/login');
    await sleep(400);
    await tourStage(cdp, 'login');

    const username = 'qa' + Date.now().toString(36);
    await cdp.eval(`(() => {
      document.querySelector('.tab[data-tab="register"]').click();
      document.getElementById('username').value = ${JSON.stringify(username)};
      document.getElementById('password').value = 'test123456';
      document.getElementById('displayName').value = '测试用户';
      document.getElementById('authForm').dispatchEvent(new Event('submit', {cancelable:true, bubbles:true}));
      return true;
    })()`);
    for (let i = 0; i < 40; i += 1) {
      await sleep(200);
      if ((await cdp.eval('location.pathname')).indexOf('app.html') !== -1) break;
    }
    await sleep(800);

    /* ---------- 输入页 ---------- */
    await tourStage(cdp, 'input');
    console.log('\n=== 塌陷网格几何（nakedWidth > 0 就必须有补边层）===');
    console.log(JSON.stringify(await cdp.eval(GRID_GEO), null, 2));

    await cdp.eval(`(() => {
      const ta = document.getElementById('rawPrompt');
      ta.value = '帮我写一篇关于远程办公的公众号文章，要给公司同事看的';
      ta.dispatchEvent(new Event('input', {bubbles:true}));
      return true;
    })()`);
    await sleep(500);
    // 名字要和 TOUR 那条自动推导出来的一致（`.score-card` → `scorecard`），
    // 否则同一个元素会以两个文件名各存一份，看图的人不知道哪张是新的。
    await zoomShot(cdp, '.score-card', 'scorecard', 2);

    /* ---------- 问答页 ---------- */
    await cdp.eval('document.getElementById("startBtn").click()');
    await sleep(600);
    await tourStage(cdp, 'rounds');

    /* ---------- 一路选到底 ---------- */
    for (let i = 0; i < 14; i += 1) {
      const done = await cdp.eval(
        '!document.getElementById("stageResult").classList.contains("hidden")');
      if (done) break;
      await cdp.eval(`(() => {
        document.querySelectorAll('.q-block').forEach(b => {
          const opts = b.querySelectorAll('.option-btn:not(.is-skip):not(.is-custom)');
          if (opts.length && !b.querySelector('.option-btn.selected')) opts[0].click();
        });
        const nb = document.getElementById('nextBtn');
        if (nb && !nb.disabled) nb.click();
        return true;
      })()`);
      await sleep(420);
    }
    const reached = await cdp.eval(
      '!document.getElementById("stageResult").classList.contains("hidden")');
    if (!reached) console.log('\n! 没能走到结果页，后面几张会跳过');

    /* ---------- 结果页 ---------- */
    await tourStage(cdp, 'result');
    console.log('\n=== 塌陷网格几何（结果页的评分卡）===');
    console.log(JSON.stringify(await cdp.eval(GRID_GEO), null, 2));
    console.log('\n=== 关键文字的字族 / 字号 ===');
    console.log(JSON.stringify(await cdp.eval(FONT_PROBE), null, 2));

    pruneStaleShots();
    console.log('\n完成，输出目录：' + OUT);
  } finally {
    cdp.close();
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
