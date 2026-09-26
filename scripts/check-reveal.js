'use strict';

/**
 * 分节进场层检查（CSS `animation-timeline: view()`，见 main.css）
 * ==================================================================
 * 落地页的分节标题挂了一层零 JS 的滚动进场：淡入 + 8px 上移。
 * 这层有个**看不见的失效形状**：它不报错、不崩、结构全对，
 * 只是内容「半透明地交出去」——
 *   ① `animation-range` 用百分比时是**相对视口**算的，视口一高（截图工具、
 *      爬虫把视口拉成整页高）动画就拖长，最后一个分节停在 opacity 0.66；
 *   ② `@supports` 一旦不成立、或选择器写错，动画整个不生效 ——
 *      页面看着「正常」（内容都在），但其实那层根本没挂上；
 *   ③ `prefers-reduced-motion: reduce` 的用户必须**直接看到内容**，
 *      而不是看一段他们明确要求关掉的动画。
 * 这三条都只能靠**真的去量**发现。
 *
 * ⚠️ 这个脚本**故意不挂** quiet-motion（scripts/lib/quiet-motion.js）：
 *    量测对象就是这层动画本身，压平了等于什么都没量。
 *    别的脚本压平它是为了看到「最终态」，这里恰恰要看中间态。
 *
 * 用法：node scripts/check-reveal.js
 */

const { launch, sleep } = require('C:/Users/jack/.workbuddy-ai/skills/cdp-browser-e2e/templates/cdp-client.js');

const BASE = process.env.BASE || 'http://127.0.0.1:5178';
const URL_ = BASE + '/';

let pass = 0;
const fails = [];
function check(name, ok, extra) {
  if (ok) { pass += 1; console.log('  ✓ ' + name + (extra ? '  ' + extra : '')); }
  else { fails.push(name); console.log('  ✗ ' + name + (extra ? '  ' + extra : '')); }
}

/** 取一次快照：每个 .reveal 的透明度与位置，加上前置事实。 */
const SNAP = `JSON.stringify((() => {
  const els = [...document.querySelectorAll('.reveal')];
  const first = els[0] || null;
  return {
    supported: CSS.supports('animation-timeline: view()'),
    /* 前置：动画**确实挂上了**。没有这条的话，「动画没生效」会伪装成
       「所有元素 opacity 都是 1」—— 看着像全绿。 */
    animName: first ? getComputedStyle(first).animationName : '(没有 .reveal)',
    count: els.length,
    items: els.map((el) => ({
      cls: (typeof el.className === 'string' ? el.className : '').replace('reveal', '').trim(),
      op: +(+getComputedStyle(el).opacity).toFixed(3),
      top: Math.round(el.getBoundingClientRect().top),
    })),
    heroReveal: !!document.querySelector('.hero .reveal'),
    innerH: window.innerHeight,
    docH: document.documentElement.scrollHeight,
  };
})())`;

const round = (n) => Math.round(n * 1000) / 1000;
const below = (s) => s.items.filter((x) => x.op < 1);
const fmt = (s) => s.items.filter((x) => x.op < 1)
  .map((x) => x.cls + '=' + x.op).join(' ') || '（全部可见）';

(async () => {
  const cdp = await launch({ width: 1440, height: 900 });
  try {
    /* 钉住语种，别让落地页的自动跳转把这一轮带到别的语种上 */
    await cdp.send('Page.enable');
    await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
      source: 'try { localStorage.setItem("promptlens.locale", "zh-Hans"); } catch (e) {}',
    });

    await cdp.goto(URL_);
    await sleep(300);
    const at0 = JSON.parse(await cdp.eval(SNAP));

    console.log('── 前置 ' + '─'.repeat(46));
    check('这台浏览器支持 animation-timeline: view()', at0.supported,
      at0.supported ? '' : '不支持的话下面每条都是白查（Firefox 至今不支持）');
    check('页面上挂着 .reveal（至少 8 处）', at0.count >= 8, '实际 ' + at0.count);
    check('（前置）进场动画确实生效了（animation-name = pl-rise）',
      at0.animName === 'pl-rise', at0.animName);
    if (!at0.supported || at0.count < 8 || at0.animName !== 'pl-rise') {
      console.log('\n✗ 前置不成立，后面的量测都不作数');
      process.exit(1);
    }

    console.log('\n── 刚进入页面（scroll 0） ' + '─'.repeat(30));
    /* ① 首屏不该挂进场：它本来就在视口里，进场动画对它是纯风险
       （算错一点就把用户最先看到的东西藏起来）。 */
    check('首屏（.hero）里没有 .reveal', !at0.heroReveal);
    /* ② 层确实在起作用：页面底部的分节此刻应当还没进场。 */
    const last = at0.items[at0.items.length - 1];
    check('页面最后一个分节此刻还没进场（说明这层不是空转）',
      last.op < 1, last.cls + '=' + last.op);
    check('此刻至少 3 个分节处在未进场/进场中',
      below(at0).length >= 3, below(at0).length + ' 个：' + fmt(at0));
    console.log('  · 视口 ' + at0.innerH + 'px，文档 ' + at0.docH + 'px');

    console.log('\n── 逐个滚到位 ' + '─'.repeat(40));
    const notSettled = [];
    for (let i = 0; i < at0.count; i += 1) {
      await cdp.eval('(() => { const e = document.querySelectorAll(".reveal")[' + i
        + ']; e.scrollIntoView({ block: "center" }); return true; })()');
      await sleep(60);
      const s = JSON.parse(await cdp.eval(SNAP));
      if (s.items[i].op !== 1) notSettled.push(s.items[i].cls + '=' + s.items[i].op);
    }
    check('每个分节滚到位后都完全可见（opacity 正好是 1）',
      notSettled.length === 0, notSettled.join(' '));

    console.log('\n── 把视口拉成整页高（截图工具 / 爬虫展开视口） ' + '─'.repeat(8));
    /* 这一条是**这层最要命的失效形状**：`animation-range` 用百分比时
       相对「元素高 + 视口高」算，视口一高动画就拖长，最后一个分节停在中途。
       改判据前实测过：`entry 0% cover 20%` 时 `.cta-title` 停在 0.659。 */
    await cdp.send('Emulation.setDeviceMetricsOverride',
      { width: 1440, height: at0.docH, deviceScaleFactor: 1, mobile: false });
    await sleep(300);
    const full = JSON.parse(await cdp.eval(SNAP));
    check('整页视口下所有分节都完全可见（否则截图/爬虫拿到的是半透明内容）',
      below(full).length === 0, fmt(full));

    console.log('\n── prefers-reduced-motion: reduce ' + '─'.repeat(22));
    await cdp.send('Emulation.setDeviceMetricsOverride',
      { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await cdp.send('Emulation.setEmulatedMedia',
      { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await cdp.goto(URL_);
    await sleep(300);
    const rm = JSON.parse(await cdp.eval(SNAP));
    check('要求减少动效时，动画整个不挂（animation-name 不是 pl-rise）',
      rm.animName !== 'pl-rise', rm.animName);
    check('要求减少动效时，一进页面内容就全部可见（不看动画）',
      below(rm).length === 0, fmt(rm));
    check('要求减少动效时 .reveal 仍在（只是不播动画，元素没被藏起来）',
      rm.count === at0.count, rm.count + ' / ' + at0.count);

    console.log('');
    if (fails.length) {
      console.log('✗ ' + fails.length + ' 项不通过（共 ' + (pass + fails.length) + ' 项）：');
      fails.forEach((f) => console.log('    ' + f));
      process.exit(1);
    }
    console.log('全部通过 ✓ （' + pass + ' 项）');
  } finally {
    await cdp.close();
  }
})().catch((e) => { console.error('失败：' + e.message); process.exit(1); });
