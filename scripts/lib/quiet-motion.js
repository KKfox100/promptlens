'use strict';

/**
 * 量之前先把**进场动效**压掉。
 *
 * 为什么需要：落地页的分节挂了 `.reveal`（滚动驱动的进场，见 main.css 的
 * 「进场」一节）。它的 `opacity` 和 `transform` **随滚动位置变** ——
 * 直接去量，量到的是动画中间态：元素可能只有 0.69 的不透明度、
 * 或者被 `translateY(8px)` 挪了 8px。而症状是「某个断言莫名其妙红了」，
 * 指向完全不相干的地方，看着像代码坏了。
 *
 * 这不是新问题 —— `browser-check.js` 里早就有一个 `settle()` 干同样的事
 * （它注入 `*{transition:none !important;animation:none !important}`）。
 * 区别是 settle 还顺带等「样式真的生效了」，而这三个脚本只做截图/量尺寸，
 * 所以这里只需要**压掉动效**这一半。
 *
 * ⚠️ 用 `Page.addScriptToEvaluateOnNewDocument` 而不是每次导航后注入：
 *    后者要挂在每一个 goto 上，漏一个就漏一处。挂在文档创建时是**全局**的。
 * ⚠️ 调用前 `Page.enable` 必须先开（cdp-client 的 launch 里已经开了，
 *    这里再开一次是幂等的）。
 */

const CSS = '*,*::before,*::after{animation:none !important;transition:none !important}';

const SOURCE = `(() => {
  var put = function () {
    var root = document.head || document.documentElement;
    if (!root) return false;
    if (document.getElementById('pl-quiet-motion')) return true;
    var s = document.createElement('style');
    s.id = 'pl-quiet-motion';
    s.textContent = ${JSON.stringify(CSS)};
    root.appendChild(s);
    return true;
  };
  /* 文档刚创建时 <head> 可能还不存在，退到 documentElement；
     两个都没有就等下一个时机。不这么兜的话，脚本会静默地什么都不做 ——
     那比不注入更糟：断言照样跑，只是量的全是动画中间态。 */
  if (!put()) {
    document.addEventListener('readystatechange', put);
    addEventListener('DOMContentLoaded', put);
  }
})();`;

async function quietMotion(cdp) {
  await cdp.send('Page.enable');
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: SOURCE });
}

module.exports = { quietMotion, SOURCE, CSS };
