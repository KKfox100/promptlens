'use strict';

/**
 * 在成品区里**按小节标题**取表，而不是全量扫 `.prompt-table`。
 *
 * 为什么必须这样取：
 *   成品里有两张**行形状一模一样**的表 —— 「分镜表」和「首尾帧参考」，
 *   每行都以「镜头 N」开头。全量扫 `.prompt-table tbody tr` 会把两张表的行
 *   混在一起数：镜头数直接翻倍，而且报错方向完全指错地方
 *   （明明是表格定位错了，报的却是「镜头数应为 4，实际 8」）。
 *
 *   这个坑在加「首尾帧参考」那一节时真踩过一次。以后再加行形状相似的表格小节，
 *   凡是「数某张表的行」的地方都必须走这里，否则同一类 bug 会再犯一次。
 *
 * 用法：把 TABLE_AFTER_HELPER 拼进 cdp.eval 的字符串里，再调用 `tableAfter('分镜表')`。
 * 取的是「该 h2 后面紧跟的那张表」；标题不存在、或后面不是表，就返回 null。
 * 不按下标猜 —— 按下标猜的话，以后在它前面再插一节，这里会静默地读到别的表上去。
 */
const TABLE_AFTER_HELPER = `
  const tableAfter = (heading) => {
    const nodes = Array.from(document.getElementById('finalPrompt')
      .querySelectorAll('.p-h2, .prompt-table'));
    const hi = nodes.findIndex(x => x.classList.contains('p-h2')
      && x.textContent.trim() === heading);
    return (hi !== -1 && nodes[hi + 1] && nodes[hi + 1].classList.contains('prompt-table'))
      ? nodes[hi + 1] : null;
  };
`;

module.exports = { TABLE_AFTER_HELPER };
