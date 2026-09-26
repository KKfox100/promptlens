'use strict';

/**
 * 整页截图：把页面**完整**拍下来（不是只拍一屏）。
 *
 * 为什么要有它：
 *   一屏截图只能看到首屏。落地页一共 6 个分节，而 .contrast-grid / .scene-table-wrap /
 *   .faq-list / .cta-band / .site-foot 全在首屏之外 —— 只拍一屏等于没看过它们。
 *   而这些正是「容器画底线还是 :last-child 画底线」「两列掉一列时竖线贴边」
 *   这类只在特定宽度才暴露的问题的高发区。
 *
 * 做法：先量出文档真实高度，再把视口设成那么高，然后截一张。
 *   不用 captureBeyondViewport：它在带 position:sticky 的页面上会把吸顶元素
 *   画在奇怪的位置，而且裁剪尺寸还得自己算。把视口调高最省事也最准。
 *
 * 用法：node scripts/page-shots.js             # 默认三个宽度
 *       WIDTHS=1440,700 node scripts/page-shots.js
 */

const fs = require('fs');
const path = require('path');
const { launch, sleep } = require('C:/Users/jack/.workbuddy-ai/skills/cdp-browser-e2e/templates/cdp-client.js');
const { quietMotion } = require('./lib/quiet-motion');

const BASE = process.env.BASE || 'http://127.0.0.1:5178';
const OUT = path.join(__dirname, '..', 'screenshots', 'qa');
/* 调试端口交给 Chrome 自己挑（见 cdp-client.js 里 port 的注释）。
   原来这里固定一个端口，上一次跑崩留下的浏览器会一直占着它 ——
   下一次启动的浏览器抢不到，而连接照样成功，于是量到的是**别人**那一页。
   要固定端口就设环境变量 CDP_PORT，模板会读。 */
const WIDTHS = (process.env.WIDTHS || '1440,700,390').split(',').map(Number);
const PAGES = (process.env.PAGES || '/').split(',');

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const cdp = await launch({ width: 1440, height: 900 });
  try {
    /* 同 check-landing-live.js：截图工具看到的是「最终态」而不是动画中间态。
       整页截图会把视口拉成整页高，不压平的话最后一个分节可能半透明。
       ⚠️ 放在 try **里面**：放外面的话它一旦抛异常，下面的 .catch 会直接
       process.exit(1)，finally 里的 cdp.close() 就不执行了 —— 留下一只孤儿浏览器。 */
    await quietMotion(cdp);

    for (const p of PAGES) {
      for (const w of WIDTHS) {
        // 先给一个正常高度，让页面按真实宽度布局
        await cdp.send('Emulation.setDeviceMetricsOverride',
          { width: w, height: 900, deviceScaleFactor: 1, mobile: w < 560 });
        await cdp.goto(BASE + p);
        await sleep(450);

        const h = await cdp.eval('document.documentElement.scrollHeight');
        // 再把它拉到整页那么高，重排一次后截图
        await cdp.send('Emulation.setDeviceMetricsOverride',
          { width: w, height: h, deviceScaleFactor: 1, mobile: w < 560 });
        await sleep(350);

        const name = 'full-' + (p === '/' ? 'landing' : p.replace(/[^a-z0-9]/gi, '')) + '-' + w + '.png';
        const file = path.join(OUT, name);
        await cdp.shot(file);
        console.log('· ' + name + '  ' + w + '×' + h);
      }
    }
  } finally {
    await cdp.close();
  }
})().catch((e) => { console.error('失败：' + e.message); process.exit(1); });
