'use strict';

/**
 * 生成社交分享图与触摸图标。
 *
 * 为什么要有这一步：
 *   og:image 和 apple-touch-icon 都必须是**位图**（PNG/JPG）——
 *   Twitter/X 不认 SVG，iOS 的 apple-touch-icon 也不认。
 *   而 OG 图缺失的直接后果是：分享到微信/微博/X 时卡片是一块空白，
 *   点击率比有图的低一大截，这属于「SEO 做了但没做完」。
 *
 * 为什么用浏览器渲染而不是引图形库：
 *   项目约定零第三方依赖。这个脚本复用已有的 CDP 客户端 + 系统 Chrome，
 *   把一张 HTML 当成模板渲染出来截图 —— 不装任何东西，而且以后改文案
 *   直接改下面的模板就行，不用去动图片。
 *
 * 用法：node scripts/make-og.js
 * 产出：public/assets/og-cover.png（1200×630）、public/assets/apple-touch-icon.png（180×180）
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { launch, sleep } = require('C:/Users/jack/.workbuddy-ai/skills/cdp-browser-e2e/templates/cdp-client.js');

const OUT_DIR = path.join(__dirname, '..', 'public', 'assets');
/* 调试端口交给 Chrome 自己挑（见 cdp-client.js 里 port 的注释）。
   原来这里固定一个端口，上一次跑崩留下的浏览器会一直占着它 ——
   下一次启动的浏览器抢不到，而连接照样成功，于是量到的是**别人**那一页。
   要固定端口就设环境变量 CDP_PORT，模板会读。 */
const TMP = path.join(os.tmpdir(), 'pl-og-' + Date.now() + '.html');

/* 色板与 main.css 的 :root 保持一致。这里抄一份是没办法的事：
   og 图是独立页面，不引主样式表（引了会把整站的布局规则也带进来）。 */
const PAPER = '#fbf8f3';
const INK = '#1b1a17';
const INK2 = '#55514a';
const INK3 = '#665f56';
const PRIMARY = '#b33a26';
const PRIMARY_LINE = '#e0c4ba';
const RULE = '#e5ded0';

const SERIF = 'Georgia, "Songti SC", SimSun, serif';
const SANS = '-apple-system, "Segoe UI", "Microsoft YaHei", "PingFang SC", sans-serif';
const MONO = 'Consolas, "SFMono-Regular", "Courier New", monospace';

const chip = (t) => `<span class="chip">${t}</span>`;

const COVER = `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px; overflow: hidden;
    background: ${PAPER}; color: ${INK}; font-family: ${SANS};
    display: flex; flex-direction: column;
    padding: 0 84px 60px;
    border-top: 10px solid ${INK};
  }
  .brand { display: flex; align-items: center; gap: 13px; padding: 40px 0 0; }
  .mark { position: relative; width: 40px; height: 40px; border-radius: 4px; background: ${INK}; }
  .mark::before { content: ""; position: absolute; inset: 9px; border: 2px solid ${PRIMARY}; border-radius: 50%; }
  .mark::after { content: ""; position: absolute; top: 6px; right: 6px; width: 6px; height: 6px; border-radius: 50%; background: ${PRIMARY}; }
  .brand-name { font-family: ${SERIF}; font-size: 25px; letter-spacing: -.01em; }
  .kicker { font-family: ${MONO}; font-size: 16px; letter-spacing: .18em; color: ${INK3}; margin-left: 6px; }
  h1 {
    font-family: ${SERIF}; font-weight: 400; font-size: 66px; line-height: 1.26;
    letter-spacing: -.02em; margin: 54px 0 0;
  }
  h1 em { font-style: normal; color: ${PRIMARY}; border-bottom: 5px solid ${PRIMARY_LINE}; padding-bottom: 3px; }
  .chips { display: flex; gap: 13px; margin-top: 46px; }
  .chip {
    font-family: ${MONO}; font-size: 19px; color: ${INK2};
    border: 1px solid ${RULE}; background: #fffdf8;
    padding: 11px 20px; border-radius: 3px;
  }
  .foot {
    margin-top: auto; padding-top: 22px; border-top: 2px solid ${INK};
    font-family: ${MONO}; font-size: 17px; letter-spacing: .06em; color: ${INK3};
    display: flex; justify-content: space-between;
  }
  .foot b { font-weight: 400; color: ${PRIMARY}; }
</style></head>
<body>
  <div class="brand">
    <span class="mark"></span>
    <span class="brand-name">PromptLens</span>
    <span class="kicker">提示词打磨台</span>
  </div>
  <h1>你不是不会写 Prompt，<br>只是没人陪你<em>把它拆开</em>。</h1>
  <div class="chips">
    ${chip('角色')}${chip('受众')}${chip('篇幅')}${chip('语气')}${chip('结构')}${chip('约束')}
  </div>
  <div class="foot">
    <span>把每一个决定权交回用户</span>
    <b>文字 · 图片 · 视频</b>
  </div>
</body></html>`;

const ICON = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
  * { margin: 0; padding: 0; }
  body { width: 180px; height: 180px; background: ${INK}; position: relative; }
  .ring { position: absolute; inset: 42px; border: 9px solid ${PRIMARY}; border-radius: 50%; }
  .dot { position: absolute; top: 33px; right: 33px; width: 19px; height: 19px; border-radius: 50%; background: ${PRIMARY}; }
</style></head><body><span class="ring"></span><span class="dot"></span></body></html>`;

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const cdp = await launch({ width: 1200, height: 630 });
  try {
    /* 用 setDeviceMetricsOverride 把视口**钉死**在目标尺寸上，而不是靠窗口大小。
       窗口大小 ≠ 视口大小（还有地址栏和边框），靠窗口会得到 1200×580 这种尺寸。
       也别用 setMobile()：它写死了 deviceScaleFactor:2，截图会变成 2400×1260。
       社交平台按尺寸判断卡片类型，差一点就退回小图卡片。 */
    const viewport = (w, h) => cdp.send('Emulation.setDeviceMetricsOverride',
      { width: w, height: h, deviceScaleFactor: 1, mobile: false });

    await viewport(1200, 630);
    fs.writeFileSync(TMP, COVER, 'utf-8');
    await cdp.goto('file:///' + TMP.replace(/\\/g, '/'));
    await sleep(500);
    const p1 = path.join(OUT_DIR, 'og-cover.png');
    await cdp.shot(p1);
    console.log('· ' + path.relative(process.cwd(), p1) + '  1200×630  ' + fs.statSync(p1).size + ' B');

    await viewport(180, 180);
    fs.writeFileSync(TMP, ICON, 'utf-8');
    await cdp.goto('file:///' + TMP.replace(/\\/g, '/'));
    await sleep(400);
    const p2 = path.join(OUT_DIR, 'apple-touch-icon.png');
    await cdp.shot(p2);
    console.log('· ' + path.relative(process.cwd(), p2) + '  180×180  ' + fs.statSync(p2).size + ' B');
  } finally {
    await cdp.close();
    try { fs.unlinkSync(TMP); } catch (e) { /* 临时文件删不掉不影响结果 */ }
  }
})().catch((err) => {
  console.error('生成失败：' + err.message);
  process.exit(1);
});
