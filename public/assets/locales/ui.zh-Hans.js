'use strict';

/**
 * PromptLens 界面文案包 —— 简体中文（zh-Hans）
 * ==================================================================
 * 这个文件**故意几乎是空的**，不是漏了。
 *
 * 界面文案以**中文原文为 key**（见 assets/js/i18n.js 顶部的说明）：
 * 查不到就原样输出，所以简体用户不需要一份「中文翻中文」的字典 ——
 * 页面 HTML 里写的中文本身就是正确的简体文案。
 *
 * 那这里还放什么？只放**不适合拿中文当 key** 的那几类：
 *   · 纯符号 / 单位（' 分' 这种，拿它当 key 太脆）；
 *   · 同一句中文在不同位置要译成不同词的（语境歧义）；
 *   · 中文里压根不存在、别的语种才需要的说法（如复数形式）。
 *
 * ⚠️ 这里的每一条都必须**同时**出现在其它语种的包和 i18n.js 的说明里，
 * 否则就是「简体有、英语没有」—— 那条会静默回退成中文。
 * 漏翻由 scripts/check-i18n-coverage.js 的伪语种扫描兜住。
 *
 * 壳必须照抄（见 topics/i18n.md）：和 knowledge.js 都是普通脚本，
 * 顶层 const 共用同一个全局词法作用域，裸写会撞车、整页 JS 全挂。
 */

(function (root) {

const UI = {
  /* ---- 单位与符号（中文当 key 太脆） ---- */
  'unit.score': '分',

  /* ---- 语境歧义：同一句中文在不同位置要分开译 ---- */
  // 顶栏那个是「打开我的记录」，侧栏标题那个是「记录列表」，
  // 英语里前者 "History"、后者 "My prompts" 更自然。
  // 目前两处都还是中文当 key，等英语包真的翻了再决定要不要拆 ——
  // 提前拆会凭空多出一堆没人看的 key。
};

const locale = {
  tag: 'zh-Hans',
  name: '简体中文',
  ui: UI,
};

root.PromptLensUi = root.PromptLensUi || {};
root.PromptLensUi['zh-Hans'] = locale.ui;

if (typeof module !== 'undefined' && module.exports) module.exports = locale;

})(typeof globalThis !== 'undefined' ? globalThis : this);
