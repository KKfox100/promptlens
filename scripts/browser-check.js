'use strict';

/**
 * 用系统 Chrome + CDP 做真实浏览器端到端验证（零依赖，使用 Node 内置 WebSocket）
 * 覆盖：注册 → 登录态 → 文字/图片/视频三条链路的多轮选择 → 生成结果
 *       → 保存历史 → 读取历史 → 修改选择 → 窄屏抽屉 → 登出
 */

const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

// 第 12 节（多语言守门）要拿知识库和对照示例当「允许出现的中文」清单。
// 这一节之前用不到它们，所以放在这里是本节自己的依赖。
const JS_DIR = path.join(__dirname, '..', 'public', 'assets', 'js');
const KNOWLEDGE = require(path.join(JS_DIR, 'knowledge.js'));
const DEMOS = require(path.join(JS_DIR, 'demos.js'));

const BASE = process.env.BASE || 'http://127.0.0.1:5178';
/* ⚠️ 默认 0 = 「让 Chrome 自己挑一个空闲端口」，不再固定 9333。
 *
 * 固定端口的坑：上一次跑崩（node 被强杀，finally 跑不到）会留下没退干净的
 * Chrome 继续占着这个端口。下一次启动的 Chrome 抢不到端口，而下面的连接
 * **照样成功** —— 连到的是那台残留浏览器，它停在哪一页就量哪一页。
 * 09-23 就是这么把 [0] 节量成了登录页，报出 28 条「落地页缺 canonical /
 * 场景表不见了 / 定义句对不上」这类完全无关的失败，而真正的原因一个字都没提。
 *
 * 端口由 Chrome 分配之后，两台浏览器不可能互相污染。
 * 想固定端口（比如从外面 attach 进来调试）就显式设 CDP_PORT。
 */
const PORT = process.env.CDP_PORT ? Number(process.env.CDP_PORT) : 0;
const CHROME = process.env.CHROME_PATH
  || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const USER_DIR = path.join(os.tmpdir(), 'pl-cdp-profile-' + Date.now());
const SHOT_DIR = path.join(__dirname, '..', 'screenshots');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * 关掉这台 Chrome。
 *
 * ⚠️ 别指望 spawn 出来的那个 PID。实测：Windows 上 chrome.exe 常常是个
 * **启动器** —— 它把真正的浏览器进程拉起来之后自己就退了（exitCode 立刻
 * 变 0）。后果有两层：
 *   ① 任何「exitCode !== null 就跳过」的守卫会让收尾整个变成空操作；
 *   ② 就算不跳过，taskkill /PID <那个已死的 pid> /T /F 也找不到任何东西，
 *      真正的浏览器带着十几个子进程继续活着（实测残留 12 个），
 *      还占着调试端口和临时目录。
 * 另外 taskkill 的 COMMANDLINE 过滤器在中文 Windows 上直接不支持
 * （实测报「无法识别的筛选器」），所以「按 --user-data-dir 认人」也走不通。
 *
 * 有效的办法是让浏览器自己关自己：CDP 的 Browser.close。实测 12 个进程 → 0，
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
 * 探测页面上「场景类对照示例」的渲染情况（图片 / 视频链路共用）。
 * 只统计真的带示例图的题目块，逐个选项要求「默认 + 选了」两张图都在，
 * 并顺手量一下画幅题里图形的真实宽高比。
 */
const SCENE_DEMO_PROBE = `(() => {
  const out = { blocks: 0, opts: 0, optsWithPair: 0, svgTotal: 0, svgEmpty: 0, ratioFrames: [] };
  document.querySelectorAll('.q-block').forEach(b => {
    const pairs = b.querySelectorAll('.o-demo.is-scene');
    if (!pairs.length) return;
    out.blocks += 1;
    b.querySelectorAll('.option-btn:not(.is-skip):not(.is-custom)').forEach(btn => {
      out.opts += 1;
      const p = btn.querySelector('.o-demo.is-scene');
      if (p && p.querySelectorAll('.d-frame svg').length === 2) out.optsWithPair += 1;
    });
    pairs.forEach(p => p.querySelectorAll('.d-frame svg').forEach(s => {
      out.svgTotal += 1;
      if (s.getBoundingClientRect().height < 8) out.svgEmpty += 1;
    }));
  });
  const ratioBlock = document.querySelector('.q-block[data-qid="img.ratio"], .q-block[data-qid="vid.ratio"]');
  if (ratioBlock) {
    ratioBlock.querySelectorAll('.option-btn').forEach(btn => {
      const svg = btn.querySelector('.o-demo.is-scene .d-frame.is-after svg');
      if (svg) {
        const vb = svg.getAttribute('viewBox').split(' ').map(Number);
        out.ratioFrames.push(+(vb[2] / vb[3]).toFixed(2));
      }
    });
  }
  return out;
})()`;

/**
 * 「塌陷网格」的补边层还在不在。
 * ------------------------------------------------------------------
 * 场景目录（10 个 ÷ 4 列）和评分卡（7 张 ÷ 3 列）都是「容器只画上/左两条边、
 * 单元格各自画右/下」的塌陷表格。末行填不满时，右下角那几格**一条边框都没有**，
 * 看起来就像表格被切掉一角（量过：容器右边缘 975px，末行只到 652px）。
 * 修法是给容器加一个 ::after 把右、下两条边补齐。
 *
 * 这条断言守的就是那个补边层。少了它不会报错，只是变丑 —— 属于最容易
 * 被后来的人顺手删掉、且删了没人发现的那一类，所以要有断言钉住。
 * 先量出「开口有多宽」：有开口才要求补边层在位，末行本来就满的不强求。
 *
 * ⚠️ 落地页场景那节**已经不在这份名单里**了。它原本是 .scene-cards
 * （3 张卡，720~980px 掉成两列，末行只剩 1 张就会开口），2026-09-22 为了 LLMO
 * 改成了一张真 <table> —— 表格的对齐由浏览器保证，这一类 bug 从根上不存在。
 * 所以这里删掉它。同时 mutation-check-ui.js 里对着 .scene-cards::after 的那条
 * 变异也**必须一起换掉**，否则它会变成「永远抓不到」，而变异套件只会报
 * 「未捕获」，不会告诉你原因。删掉一条守卫的同时要换上新守卫，不能只是删。
 */
const COLLAPSED_GRID_PROBE = `(() => {
  const out = [];
  document.querySelectorAll('.scenario-grid, .improve-grid').forEach(g => {
    const gr = g.getBoundingClientRect();
    if (!gr.width) return;                      // 藏在 display:none 的 stage 里，跳过
    const cells = Array.from(g.children).map(c => c.getBoundingClientRect());
    if (!cells.length) return;
    const a = getComputedStyle(g, '::after');
    const lastTop = Math.max.apply(null, cells.map(c => c.top));
    const lastRow = cells.filter(c => Math.abs(c.top - lastTop) < 2);
    out.push({
      sel: g.classList[0],
      n: cells.length,
      openRight: +(gr.right - Math.max.apply(null, lastRow.map(c => c.right))).toFixed(1),
      overlayRight: a.borderRightWidth,
      overlayBottom: a.borderBottomWidth,
      pointer: a.pointerEvents,
    });
  });
  return out;
})()`;

/**
 * 落地页的「编辑排版节奏」。
 *
 * 下面三条都是**量出来的**，肉眼读缩略图看不出来；而且都属于
 * 「删了不报错、只是变丑」那一类 —— 最容易被后来的人顺手改掉，
 * 所以必须钉住。
 *
 * ① 四个内容块都要有收口线。四种画法各不相同（容器自己的 border-bottom、
 *    `::after` 补边层、末格的下边框），所以统一问「这个块的底边到底有没有线」：
 *    取「自己的 border-bottom」和「::after 的 border-bottom」里大的那个。
 *    `.faq-list` 原本就是 0px —— 那一段没有结束感，直接撞到 CTA 横幅上。
 * ② 「适用工具」那一列要是「小字 + 三级墨色」，压得住同区块的通用规则。
 *    它被通用选择器盖掉过一次：当年是 `.scene-card p`（(0,1,1) > (0,1,0)），
 *    渲染成 13px `--ink-2`，页面不崩、不报错，只是不是你要的那个。
 *    换成表格之后同样的坑还在（`.scene-table tbody td` 是 (0,1,2)），
 *    所以这条断言留着，只是换了选择器。
 * ③ 表格的行分隔线横贯整行 —— 这是换成真表格的收益：卡片时代要靠
 *    `min-height` + `margin-top: auto` 把三张卡凑到同一高度，线才会齐
 *    （量过 1696.4 / 1696.4 / 1714）；表格不需要凑。
 */
const LANDING_RHYTHM_PROBE = `(() => {
  const px = (v) => parseFloat(v) || 0;
  const blocks = ['.step-list', '.contrast-grid', '.scene-table-wrap', '.faq-list'];
  const rules = blocks.map(sel => {
    const el = document.querySelector(sel);
    if (!el) return { sel, found: false };
    return {
      sel, found: true,
      own: px(getComputedStyle(el).borderBottomWidth),
      overlay: px(getComputedStyle(el, '::after').borderBottomWidth),
    };
  });

  /* 「适用工具」那一列的计算样式。只量字号和颜色 ——
     不再量「各行 top 是否齐平」：在表格里纵向对齐由浏览器保证，
     再去量 top 只会量到「行高本来就不同」这件本来就对的事，属于假断言。
     也**不再要求等宽字族**：等宽字族（SFMono / Consolas）没有中文字形，
     中文会回落宋体，和旁边正文混排一眼就不齐。
     旧卡片版本用的正是 --mono，那是个隐藏的排版缺陷，换成表格时一并去掉。 */
  const tools = Array.from(document.querySelectorAll('.scene-table .scene-tools')).map(el => {
    const s = getComputedStyle(el);
    return { size: s.fontSize, color: s.color };
  });

  /* 表格的行分隔线。每个单元格自己带 border-top，一行里的三个格子都带，
     所以线天然横贯整行 —— 不需要像卡片那样把高度凑齐。 */
  const rowRules = Array.from(document.querySelectorAll('.scene-table tbody tr')).map(tr => {
    const c = tr.querySelector('th, td');
    return c ? px(getComputedStyle(c).borderTopWidth) : 0;
  });

  // 把 token 在页面里真的解析成 rgb，才能和计算出来的颜色直接比
  const swatch = document.createElement('span');
  swatch.style.color = 'var(--ink-3)';
  document.body.appendChild(swatch);
  const ink3 = getComputedStyle(swatch).color;
  swatch.remove();
  const micro = getComputedStyle(document.documentElement)
    .getPropertyValue('--fs-micro').trim();

  return JSON.stringify({ rules, tools, rowRules, ink3, micro });
})()`;

/** 把一次塌陷网格探测落成断言。 */
function assertClosedGrids(check, grids) {
  check('（前置）页面上确实有塌陷网格要验', grids.length > 0, '找到 ' + grids.length + ' 个');
  grids.forEach((g) => {
    if (g.openRight > 1) {
      check(`${g.sel}：末行填不满（空出 ${g.openRight}px），右下角补边层在位`,
        g.overlayRight === '1px' && g.overlayBottom === '1px',
        'right=' + g.overlayRight + ' bottom=' + g.overlayBottom);
      check(`${g.sel}：补边层不吃点击`, g.pointer === 'none', g.pointer);
    } else {
      check(`${g.sel}：末行是满的（${g.n} 格），不需要补边`, true);
    }
  });
}

/**
 * 「粘到你的 AI」工具条探针。
 * 一次取回全部入口的属性 —— 断言都在 Node 侧做，浏览器里只负责读数。
 */
const TOOL_STRIP_PROBE = `(() => {
  const row = document.getElementById('toolRow');
  if (!row) return { present: false, items: [] };
  const links = Array.from(row.querySelectorAll('a.tool-link'));
  return {
    present: true,
    items: links.map((a) => {
      const badge = a.querySelector('.tool-mono');
      const name = a.querySelector('.tool-name');
      return {
        href: a.getAttribute('href') || '',
        target: a.getAttribute('target') || '',
        rel: a.getAttribute('rel') || '',
        badge: badge ? badge.textContent : '',
        name: name ? name.textContent : '',
      };
    }),
  };
})()`;

/**
 * 点一下工具条的第一个入口，看有没有「已复制」的反馈。
 * 用合成事件：不受信任的 click 不会触发 <a> 的默认跳转，所以不会真的开新标签。
 * 先清空 toastWrap，避免把上一次操作留下的 toast 当成自己的。
 */
const TOOL_CLICK_PROBE = `(() => {
  const row = document.getElementById('toolRow');
  const a = row && row.querySelector('a.tool-link');
  if (!a) return { ok: false, why: '工具条里没有入口' };
  const wrap = document.getElementById('toastWrap');
  if (wrap) wrap.innerHTML = '';
  a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
  return { ok: true };
})()`;

/** 三条链路各跑一次，攒下来给最后那条「不是同一组」用 */
const TOOL_STRIPS = {};

/**
 * 把一次工具条探测落成断言。
 *
 * 为什么不写死「文字组必须是 5 个」：
 *   数量来自 workspace.js 的 TOOLS，工具清单**会过期**（Sora 就是这么没的）。
 *   写死数量的断言，加一个工具就要改测试，改着改着就没人改了。
 *   这里只断言**结构性**的东西：有入口、是 https 直链、有徽标有名字、
 *   新标签打开且带 noopener、徽标是拉丁字母。
 *   「三类场景不一样」由跨链路的集合比较来保证（见 assertToolStripFamilies）。
 */
async function assertToolStrip(check, cdp, family, label) {
  const s = await cdp.eval(TOOL_STRIP_PROBE);
  check(label + '：工具条在页面上且不是空的',
    s.present && s.items.length > 0,
    s.present ? s.items.length + ' 个入口' : '（页面上没有 #toolRow）');
  if (!s.present || !s.items.length) return;

  /* ⚠️ 「渲染成功」和「用户看得见」是两件事。
     这两条是补上去的：用户报「没有看到工具条」，而当时上面那几条断言**全绿** ——
     工具条确实渲染了 5 个入口、href 也全对，只是 top:1031px 落在 844px 视口之外，
     滚到底它又跑到屏幕上方（top:-727px）。所有「结构对不对」的检查对此完全免疫。
     所以这里量的是**位置**，不是存在 —— 而位置恰恰是用户唯一能感知的那件事。 */
  const vis = await cdp.eval(`(() => {
    const el = document.getElementById('toolStrip');
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { top: Math.round(b.top), bottom: Math.round(b.bottom), vh: window.innerHeight };
  })()`);
  check(label + '：工具条在首屏里（不用滚动就看得见）',
    !!vis && vis.top < vis.vh && vis.bottom > 0,
    vis ? 'top=' + vis.top + ' bottom=' + vis.bottom + ' 视口高=' + vis.vh : '量不到');

  /* 再滚到底确认它**不跟内容走**（它住在固定底栏里）。
     跟着内容滚的实现会在这里掉出视口 —— 那正是上一版的表现。
     量完必须复位 scrollTop，否则后面那些断言和截图全落在页面底部。 */
  await cdp.eval('document.getElementById("mainScroll").scrollTop = 99999');
  await sleep(320);
  const vis2 = await cdp.eval(`(() => {
    const b = document.getElementById('toolStrip').getBoundingClientRect();
    return { top: Math.round(b.top), bottom: Math.round(b.bottom), vh: window.innerHeight };
  })()`);
  check(label + '：滚到底部工具条仍在视野里（住在固定底栏，不跟内容走）',
    vis2.top < vis2.vh && vis2.bottom > 0,
    'top=' + vis2.top + ' bottom=' + vis2.bottom + ' 视口高=' + vis2.vh);
  await cdp.eval('document.getElementById("mainScroll").scrollTop = 0');
  await sleep(200);

  TOOL_STRIPS[family] = s.items.map((it) => it.name);

  const badHref = s.items.filter((it) => !/^https:\/\//.test(it.href));
  check(label + '：每个入口都是 https 直链',
    badHref.length === 0,
    badHref.map((it) => it.name + '=' + JSON.stringify(it.href)).join(' / ') || 'ok');

  const noBadge = s.items.filter((it) => !it.badge.trim());
  const noName = s.items.filter((it) => !it.name.trim());
  check(label + '：每个入口都有徽标和名字',
    noBadge.length === 0 && noName.length === 0,
    '缺徽标 ' + noBadge.length + ' 个 / 缺名字 ' + noName.length + ' 个');

  /* 徽标**故意不走 t()**（见 workspace.js 那段注释），所以必须自己保证是拉丁字母：
     en / es / ko 界面上一个汉字都不许有，徽标写「豆」「即」「可」会当场判红。 */
  const hanBadge = s.items.filter((it) => /[\u4e00-\u9fff]/.test(it.badge));
  check(label + '：徽标不含汉字（en/es/ko 界面上不许出现）',
    hanBadge.length === 0,
    hanBadge.map((it) => it.badge).join(' / ') || 'ok');

  const badOpen = s.items.filter((it) => it.target !== '_blank' || it.rel.indexOf('noopener') === -1);
  check(label + '：新标签打开且带 noopener',
    badOpen.length === 0,
    badOpen.map((it) => it.name + ' target=' + it.target + ' rel=' + JSON.stringify(it.rel)).join(' / ') || 'ok');

  /* 点一下到底有没有把成品放进剪贴板 —— 这个功能唯一的「实际效果」。
     用合成事件，不会真的开新标签（见 TOOL_CLICK_PROBE 的注释）。
     ⚠️ 量完必须清空 toastWrap，否则这条残留的 toast 会让
        「点『复制』负面提示词有反馈」那条**变绿** —— 那等于把别人的断言弄假了。 */
  const clicked = await cdp.eval(TOOL_CLICK_PROBE);
  await sleep(600);
  const toasts = await cdp.eval(
    'Array.from(document.querySelectorAll("#toastWrap .toast")).map((t) => t.textContent)');
  check(label + '：点一下会把成品复制进剪贴板（有反馈）',
    clicked.ok && toasts.some((x) => x.indexOf('剪贴板') !== -1),
    clicked.ok ? JSON.stringify(toasts) : clicked.why);
  await cdp.eval('document.getElementById("toastWrap").innerHTML = ""');
}

/** 三条链路跑完之后：三组入口不能是同一组，否则 family 过滤等于没有 */
function assertToolStripFamilies(check) {
  const fams = ['text', 'image', 'video'];
  const missing = fams.filter((f) => !TOOL_STRIPS[f]);
  check('（前置）三条链路的工具条都量到了', missing.length === 0, '缺 ' + missing.join('/'));

  const sig = (f) => (TOOL_STRIPS[f] || []).join('|');
  const all = fams.map(sig);
  check('三类场景的入口不是同一组（family 过滤真的生效）',
    all[0] !== all[1] && all[1] !== all[2] && all[0] !== all[2],
    fams.map((f) => f + '=' + sig(f)).join('  '));
}

/**
 * 公开落地页的 SEO 体检。
 *
 * 为什么要断言「结构化数据里的问答」和「页面上看得见的问答」逐条对齐：
 *   标记与内容不符属于**作弊**，不是「优化不到位」。写 JSON-LD 的时候
 *   顺手改一句文案、忘了同步另一边，是很自然会发生的事，而它在浏览器里
 *   完全看不出来 —— 只有对比两边才知道。这条断言就是那个对比。
 */
const SEO_PROBE = `(() => {
  const q = (s) => document.querySelector(s);
  const meta = (sel, attr) => {
    const e = q(sel);
    return e ? (e.getAttribute(attr || 'content') || '') : null;
  };
  const ld = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
    .map(s => { try { return JSON.parse(s.textContent); } catch (e) { return { __err: e.message }; } });
  const graph = [];
  ld.forEach(d => { if (d['@graph']) graph.push.apply(graph, d['@graph']); else graph.push(d); });
  const faqNode = graph.filter(n => n['@type'] === 'FAQPage')[0] || null;
  const app = graph.filter(n => n['@type'] === 'SoftwareApplication')[0] || null;
  const main = q('main');
  return {
    title: document.title,
    lang: document.documentElement.lang,
    h1Count: document.querySelectorAll('h1').length,
    h2Count: document.querySelectorAll('h2').length,
    h1Text: q('h1') ? q('h1').innerText.replace(/\\s+/g, '') : '',
    textLen: main ? main.innerText.replace(/\\s+/g, '').length : 0,
    desc: meta('meta[name="description"]'),
    canonical: q('link[rel="canonical"]') ? q('link[rel="canonical"]').getAttribute('href') : null,
    robots: meta('meta[name="robots"]'),
    ogTitle: meta('meta[property="og:title"]'),
    ogImage: meta('meta[property="og:image"]'),
    ogImageAlt: meta('meta[property="og:image:alt"]'),
    twCard: meta('meta[name="twitter:card"]'),
    themeColor: meta('meta[name="theme-color"]'),
    ldTypes: graph.map(n => n['@type']).sort(),
    ldErrors: ld.filter(d => d.__err).map(d => d.__err),
    appCategory: app ? app.applicationCategory : null,
    faqVisible: Array.from(document.querySelectorAll('.faq-list dt')).map(e => e.textContent.trim()),
    faqLd: faqNode ? faqNode.mainEntity.map(e => e.name.trim()) : [],
    faqAnswerEmpty: faqNode
      ? faqNode.mainEntity.filter(e => !e.acceptedAnswer || !e.acceptedAnswer.text).length
      : -1,
    toLogin: Array.from(document.querySelectorAll('a[href="login.html"]')).length,

    /* LLMO：那句定义必须同时出现在正文、meta description、JSON-LD 三处，
       且逐字相同。三处不一致时模型读到的是三个说法，而且页面上看不出来。 */
    heroDef: q('.hero-def') ? q('.hero-def').innerText.trim() : null,
    appDesc: app ? app.description : null,

    /* HowTo 的四步必须与页面上看得见的四步逐条一致（同 FAQPage 一条纪律）。 */
    hasHowto: !!graph.filter(n => n['@type'] === 'HowTo')[0],
    howtoSteps: (graph.filter(n => n['@type'] === 'HowTo')[0] || { step: [] })
      .step.map(s => (s.name || '').trim()),
    stepVisible: Array.from(document.querySelectorAll('.step-list .step-title'))
      .map(e => e.textContent.trim()),

    /* 场景对照表。data-label 是窄屏竖排时的列名来源 ——
       漏一个，手机上就是一堆没有标签的值。 */
    tableHeads: Array.from(document.querySelectorAll('.scene-table thead th')).map(e => e.textContent.trim()),
    tableRowHeads: Array.from(document.querySelectorAll('.scene-table tbody th')).map(e => e.textContent.trim()),
    tableDataCells: document.querySelectorAll('.scene-table tbody td').length,
    tableLabeled: Array.from(document.querySelectorAll('.scene-table tbody td'))
      .filter(e => (e.getAttribute('data-label') || '').length > 0).length,
  };
})()`;

/**
 * 手机端（H5）体检。
 *
 * 量的是桌面调试看不出来的那几件事：
 *   overflow     —— 横向溢出（窄屏最容易出的问题，而且一出就是整页能左右拖）
 *   hoverNone    —— (hover: none) 到底有没有匹配上。CDP 只开 mobile:true
 *                   **不会**让它匹配，必须另外开触摸模拟，否则这一整块样式
 *                   在测试里等于没跑，断言会假绿。
 *   tooSmall     —— 高度不足 44px 的可点控件
 *   formFont     —— 表单字号，<16px 会让 iOS 聚焦时把整页放大
 *   shellH       —— .app-shell 的实际高度，和 window.innerHeight 比，
 *                   用来确认 dvh 生效（用 100vh 的话在真机上会高出一截）
 */
const MOBILE_PROBE = `(() => {
  const de = document.documentElement;
  const targets = [];
  /* ⚠️ 这份名单是「用户用手指点的东西」的清单。漏掉一个选择器的后果
     不是报错，是那条断言**永远为真**（假绿）—— 所以每加一个可点控件
     都要回来补一笔，并且用下面的 named 计数把它钉住。
     09-23 补的这四个原来一个都不在名单里，于是「落地页可点控件都
     ≥44px」这条断言只量到了 .btn，而真正小的那几个（logo 30px、
     导航 24px、页脚语言 20px）它根本看不见 —— 断言是绿的，缺陷是真的。
     ⚠️ .lang-menu-btn 是 <details> 的 <summary>：
     'a, button, input, select' 一个都不匹配它，是这份名单里最容易漏的一个。 */
  /* ⚠️ 名单里**故意排除**的一个：#switchLink（登录页「还没有账号？注册」）。
     它夹在一句话中间，属于正文里的行内链接 —— 那一类不抬到 44px
     （见 main.css 触摸那一节的说明）。是排除，不是漏掉。
     ⚠️ 反过来，.user-btn / .auth-back / .auth-guest a 原来是**漏**的：
     账号按钮装着导出与退出，后两个是登录页仅有的两个「去哪儿」控件
     （「先免注册试用一下」还是免注册的唯一出口），原来只有 16~17px 高，
     而名单里一个 .auth-* 都没有 —— 登录页那一条断言等于没写。 */
  const TARGET_SEL = '.btn, .tab, .icon-toggle, .option-btn, .scenario-btn, .bc-icon,'
    + ' .history-item .h-del, .lang-select, .tool-link,'
    + ' .logo, .site-nav a, .lang-link, .lang-menu-btn,'
    + ' .user-btn, .auth-back, .auth-back-narrow, .auth-guest a';
  document.querySelectorAll(TARGET_SEL)
    .forEach(el => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;                 // 隐藏的不算
      const cls = (el.className || '').toString().trim().split(/\s+/)[0] || '';
      targets.push({ sel: el.tagName.toLowerCase() + (cls ? '.' + cls : ''), h: +r.height.toFixed(1) });
    });
  /* 逐个点名计数：在断言「这批控件都达标」之前，先证明**确实量到了它们**。
     没有这一步的话，选择器写错 = 一个都不匹配 = tooSmall 为空 = 断言绿。 */
  const count = (sel) => Array.from(document.querySelectorAll(sel)).filter(el => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }).length;
  const form = document.querySelector('.input, .textarea');
  const shell = document.querySelector('.app-shell');
  const del = document.querySelector('.history-item .h-del');
  return {
    /* ⚠️ 基准必须是 clientWidth，**不是** window.innerWidth。
       mobile:true 的模拟视口下 innerWidth 会跟着内容一起涨（实测上限 1280），
       于是 scrollWidth - innerWidth 在「内容宽 320~1280」这一段恒等于 0 ——
       320px 视口里一个需要 332px 的页头，它照样报「不溢出」（09-23 实测）。
       clientWidth 钉死在请求的宽度上，才是能证伪的基准。 */
    /* ⚠️ 这个数在**工作台上恒等于 0**，不是因为它不溢出，而是因为
       .app-shell{overflow:hidden} 在祖先上把溢出裁掉了 —— 拿它判工作台
       等于没判（09-26 实测：顶栏真实溢出 246px，这里照样报 0）。
       工作台要看 shellOverflow / topbar.overflow 这两条。
       ⚠️ 同一个错的另一件外衣：判据的基准不能是被测对象能影响的值。
       这里更进一步 —— 基准不能是**被裁剪的祖先**。 */
    overflow: de.scrollWidth - de.clientWidth,
    /* anti-slop：用户看得见的元素里，有没有谁的计算色是纯黑。
       纯黑不是「设计选择」，是「没人给它定色」的形状 —— 典型就是 <button>
       不写 color，落到 UA 的 ButtonText。工作台上 .scenario-btn 原来正是这样，
       被 .s-num / .s-name / .s-desc 三条子规则盖着看不出来（09-26 修）。
       ⚠️ 文档根 <html> 的计算 color 是 CSS 初始值 rgb(0,0,0)，而可见文字
       都由 <body> 定的色继承下来 —— 它自己不画字，是个惰性值，必须排除，
       否则这条断言永远是红的。
       ⚠️ 名字里用 split(' ') 而不是正则 —— 这段代码住在 MOBILE_PROBE 这个
       模板字面量里，正则里的反斜杠会被**再吃一层**（\s 变成 s）。 */
    pureBlack: (() => {
      const SKIP = { HTML: 1, HEAD: 1, META: 1, TITLE: 1, LINK: 1, STYLE: 1, SCRIPT: 1, BASE: 1, NOSCRIPT: 1, TEMPLATE: 1 };
      const bad = [];
      for (const el of document.querySelectorAll('*')) {
        if (SKIP[el.tagName]) continue;
        if (!el.getClientRects().length) continue;
        const cs = getComputedStyle(el);
        const who = el.tagName.toLowerCase() + '.' + (el.className || '').toString().trim().split(' ')[0];
        if (cs.color === 'rgb(0, 0, 0)') bad.push('color ' + who);
        if (cs.backgroundColor === 'rgb(0, 0, 0)') bad.push('bg ' + who);
      }
      return bad;
    })(),
    shellOverflow: shell ? shell.scrollWidth - shell.clientWidth : null,
    /* 顶栏的预算。need = 各项宽度和（**不含** flex:1 的占位块）+ 间距 + 内边距，
       所以 need > client 就是放不下；overflow 是它作为滚动容器的真实溢出。
       为什么不含占位块：它会把余量吃掉，于是 need 永远等于视口宽，看不出松紧。 */
    topbar: (() => {
      const bar = document.querySelector('.topbar');
      if (!bar) return null;
      const cs = getComputedStyle(bar);
      const gap = parseFloat(cs.columnGap) || 0;
      const padL = parseFloat(cs.paddingLeft), padR = parseFloat(cs.paddingRight);
      const kids = Array.from(bar.children).filter((el) => {
        const r = el.getBoundingClientRect();
        const k = getComputedStyle(el);
        return !el.classList.contains('hidden') && k.display !== 'none' && r.width > 0;
      });
      const solid = kids.filter((el) => !el.classList.contains('topbar-spacer'));
      const need = solid.reduce((s, el) => s + el.getBoundingClientRect().width, 0)
        + gap * Math.max(0, kids.length - 1) + padL + padR;
      return {
        client: bar.clientWidth,
        scroll: bar.scrollWidth,
        overflow: bar.scrollWidth - bar.clientWidth,
        need: Math.round(need * 10) / 10,
        slack: Math.round((bar.clientWidth - need) * 10) / 10,
        controls: solid.length,
      };
    })(),
    hoverNone: matchMedia('(hover: none)').matches,
    coarse: matchMedia('(pointer: coarse)').matches,
    targets: targets.length,
    /* 每个控件各量到几个。断言「都达标」之前先断言「量到了」——
       否则选择器写错时 tooSmall 是空的，断言照样绿。 */
    named: {
      logo: count('.logo'),
      navLink: count('.site-nav a'),
      langLink: count('.lang-link'),
      langMenuBtn: count('.lang-menu-btn'),
      langSelect: count('.lang-select'),
      tab: count('.tab'),
      userBtn: count('.user-btn'),
      authBack: count('.auth-back'),
      authBackNarrow: count('.auth-back-narrow'),
      authGuest: count('.auth-guest a'),
    },
    tooSmall: targets.filter(t => t.h < 44),
    formFont: form ? getComputedStyle(form).fontSize : null,
    shellH: shell ? +shell.getBoundingClientRect().height.toFixed(1) : null,
    innerH: window.innerHeight,
    /* 声明里到底写的是哪个单位。
       为什么要单独看声明：CDP 的设备模拟把「布局视口」和「可视视口」设成一样大，
       于是 100vh 和 100dvh 在模拟环境里算出同一个高度 —— 只比几何的话，
       把 dvh 改回 vh 这条断言照样绿。真机上两者才会分叉（地址栏收放）。
       模拟不了真机，就退一步钉住声明本身。 */
    shellHeightDecl: (() => {
      try {
        for (const sheet of document.styleSheets) {
          for (const rule of sheet.cssRules) {
            if (rule.selectorText === '.app-shell') {
              return rule.style.getPropertyValue('height') || null;
            }
          }
        }
      } catch (e) { return 'ERR:' + e.message; }
      return null;
    })(),
    delOpacity: del ? getComputedStyle(del).opacity : null,
    navHidden: (() => { const n = document.querySelector('.site-nav'); return n ? getComputedStyle(n).display : null; })(),
  };
})()`;

/** 读 PNG 头里的宽高（字节 16~23 是 IHDR 的 width/height，大端 uint32）。 */
function pngSize(file) {
  const buf = fs.readFileSync(file);
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

/**
 * 在页面里**按小节标题**取表，而不是全量扫 `.prompt-table`。
 * 实现见 scripts/table-probe.js（browser-check-file.js 共用同一份）。
 */
const { TABLE_AFTER_HELPER } = require('./table-probe');

/** 把一次探测结果落成断言。 */
function assertSceneDemos(check, probe) {
  check('场景题每个选项都有一对「默认 → 选了」示例图',
    probe.blocks > 0 && probe.optsWithPair === probe.opts,
    probe.blocks + ' 个题，' + probe.optsWithPair + ' / ' + probe.opts + ' 个选项');
  check('示例图真的渲染出来了（没有空框）',
    probe.svgTotal > 0 && probe.svgEmpty === 0,
    '共 ' + probe.svgTotal + ' 张，空白 ' + probe.svgEmpty + ' 张');
  if (probe.ratioFrames.length) {
    check('画幅示例保留了各自的真实比例',
      new Set(probe.ratioFrames).size === probe.ratioFrames.length,
      probe.ratioFrames.join(' / '));
  }
}

/* ------------------------------------------------------------------ *
 * 多语言守门：把界面文案表换成「哨兵表」，再扫 DOM 里还剩哪些中文
 * ------------------------------------------------------------------ *
 * 原理：`t()` 查不到就原样返回 key，所以「哪一串走了 t()、哪一串是写死的」
 * 在正常情况下**看不出来** —— 简体下两种写法渲染结果一模一样。
 * 把文案表换成「一律返回哨兵」的表之后，走了 t() 的文案全变成哨兵，
 * DOM 里剩下的中文就一定是没接线的。
 *
 * 知识库文案（题目 / 选项 / fragment）、对照示例、用户自己的输入是**内容**，
 * 不走 t()，所以要先从扫描结果里剥掉 —— 否则满屏都是「漏」，等于没扫。
 * 剥完还剩中文，那才是真的漏。
 *
 * 为什么值得单开一节：漏一条不报错、不崩，只是某个语种的界面上突然冒出一句
 * 中文。这正是本项目最高频的失效类型（见 topics/silent-failure.md），
 * 而它恰好是「跑一遍断言」抓不到的那一类 —— 断言看的是它认识的字。
 */
const PSEUDO_UI_SOURCE = `(() => {
  // 哨兵不是无脑返回 '@@'，而是**把 key 里的中文段换成 '@@'，标记原样留着**。
  // 理由：有几处 t() 的 key 本身带 HTML（textarea 的 placeholder、表格占位行…）。
  // 整串换成 '@@' 的话那些结构就没了 —— 页面会当场崩
  // （renderQuestion 里 querySelector('textarea') 拿到 null），
  // 而且崩的位置和「漏翻」毫无关系，排查会跑偏。
  // ⚠️ 这里必须替换**整个 CJK 类**（汉字 + 中文标点 + 全角形式），
  // 不能只替汉字。只替汉字的话，紧挨着汉字的标点会被吞进「中文段」，
  // 而**孤立**的标点（「（…）」的右括号、「导出全部记录（JSON）」的左括号）
  // 会原样留下 —— 探针于是把「@@JSON）」这种残渣报成漏翻。
  // 那几条全是假警报，却和真漏翻混在一起，一眼分不出来。
  // 整类都替掉之后，探针就可以放心地用**同一个类**去判断「还剩没剩中文」：
  // 剩下的每一个中文标点都只可能来自内容（白名单会剥掉）或硬编码。
  const CJK_ANY = /[\\u3000-\\u303f\\u4e00-\\u9fff\\uff01-\\uff60]+/g;
  const SENTINEL = '@@';
  const pseudo = (key) => String(key).replace(CJK_ANY, SENTINEL);
  // 顺便把「界面到底问了哪些 key」记下来。
  // 这是**唯一**一份可信的界面文案清单：HTML 上的 data-i18n 取的是元素的文字、
  // JS 里的 key 可能是拼出来的，静态扫描两头都会漏。而 t() 只要被调用就经过这里。
  // 于是「要翻哪些界面文案」不再靠人去 grep，而是跑一遍流程自然长出来。
  const seen = Object.create(null);
  const table = new Proxy({}, {
    get: (o, k) => {
      if (typeof k !== 'string') return undefined;
      seen[k] = (seen[k] || 0) + 1;
      return pseudo(k);
    },
  });
  const reg = {};
  // 必须**同时**给 get 和 set：文案包是 'use strict' 的，
  // 只给 get 的话 \`root.PromptLensUi['zh-Hans'] = …\` 会直接抛 TypeError，
  // 整份文案包挂掉 —— 那样扫出来的「漏」全是假的。
  Object.defineProperty(reg, 'zh-Hans', { get: () => table, set: () => {}, configurable: true });
  window.PromptLensUi = reg;
  window.__PL_PSEUDO_UI__ = true;
  window.__PL_UI_KEYS__ = seen;
})()`;

/**
 * 知识库与对照示例里所有**会渲染出来**的字，收成一张「允许出现」清单。
 *
 * ⚠️ 这里的键名必须和 `knowledge.js` 的**导出名**一致（大写下划线）——
 * 写成小写的话整个 `walk` 什么都没收到，清单是空的，于是每一条知识库文案
 * 都被报成「漏翻」。这个错误的表现是「23 处漏翻，全是题目和场景名」。
 */
function buildContentAllowList(K, Demos) {
  const out = new Set();
  const add = (v) => {
    if (!v) return;
    out.add(v);
    // ⚠️ 还要放一份**空白压平**的版本。
    // 知识库里存的是带 \n 的原文（对照示例就是三段），而探针读 DOM 时
    // 自己先把空白压成了空格 —— 两个形式对不上，那条文案就永远剥不掉，
    // 每次都报成「漏翻」。这个坑的表现是「原文和剥完剩的一模一样」，
    // 说明白名单压根没命中。
    const flat = v.replace(/\s+/g, ' ').trim();
    if (flat) out.add(flat);
  };
  const walk = (v) => {
    if (typeof v === 'string') { add(v); return; }
    if (Array.isArray(v)) { v.forEach(walk); return; }
    if (v && typeof v === 'object') Object.keys(v).forEach((k) => walk(v[k]));
  };
  ['SCENARIOS', 'QUESTIONS', 'SECTION_TITLES', 'SHOT_CONTENT', 'SHOT_ROLE',
    'SECTION_EXPLAIN', 'SIGNAL_LABELS', 'FRAME_MODES', 'VISUAL_JOINER'].forEach((k) => walk(K[k]));
  walk(K.SCORE_ITEMS);
  walk(K.SCORE_ITEMS_IMAGE);
  walk(K.SCORE_ITEMS_VIDEO);
  walk(Demos && Demos.TEXT);
  return Array.from(out);
}

/**
 * 扫描探针。允许清单当参数传进去 —— 它有一千多条，
 * 写死在模板里既难读又容易和知识库脱节。
 */
const LEAK_PROBE = (allow) => `(() => {
  const ALLOW = ${JSON.stringify(allow)};
  // 判定用的类和哨兵用的是**同一个类**（见 PSEUDO_UI_SOURCE 的注释）：
  // 界面文案里的中文（含标点）已经被哨兵整段换掉了，
  // 所以这里剩下的任何一个中文标点都是可疑的，不只是汉字。
  const CJK = /[\\u3000-\\u303f\\u4e00-\\u9fff\\uff01-\\uff60]/;
  const CJK_RUN = /[\\u3000-\\u303f\\u4e00-\\u9fff\\uff01-\\uff60]+/;
  /* 语言切换器整块跳过。
     里面每一条都是**该语种自己的名字**（简体中文 / English / 日本語…），
     这是对的 —— 语言选择器就该用母语写自己的名字，否则用户认不出自己的语言。
     所以它不是「没接线的中文」，它就是中文本身。
     注意是**按元素跳过**，不是把「简体中文」塞进白名单：
     塞白名单的话，这四个字出现在别处也会被当成合法，那就把真漏的挡掉了。 */
  const SKIP_SEL = '.lang-select-wrap, .lang-switch';
  const skipNode = (el) => !!(el && el.closest && el.closest(SKIP_SEL));
  // 长的先剥：先剥短串会把长串切碎，剩下的碎渣看起来像「新漏的」
  const sorted = ALLOW.slice().sort((a, b) => b.length - a.length);
  const strip = (s) => {
    let out = String(s);
    sorted.forEach((k) => { if (out.indexOf(k) !== -1) out = out.split(k).join('\\u0000'); });
    return out;
  };
  const found = new Map();
  // 「漏在哪个元素上」比「漏了哪几个字」有用得多 —— 有定位就能直接去改那一行，
  // 没有定位就得靠搜中文，而中文在源码里到处都是。
  const locator = (el) => {
    if (!el || el.nodeType !== 1) return '';
    const cls = typeof el.className === 'string' ? el.className.trim() : '';
    return '<' + el.tagName.toLowerCase() + (el.id ? '#' + el.id : '')
      + (cls ? '.' + cls.split(/\\s+/).join('.') : '') + '>';
  };
  const note = (where, text, el) => {
    const raw = String(text || '').replace(/\\s+/g, ' ').trim();
    if (!raw || !CJK.test(raw)) return;
    const rest = strip(raw);
    if (!CJK.test(rest)) return;
    const m = rest.match(CJK_RUN);
    const hit = m ? m[0] : rest.slice(0, 30);
    const key = where + ' :: ' + hit;
    // \`rest\` 也带回去：只看 hit 分不清「真漏了一句」和「白名单剥完剩的标点残渣」，
    // 而这两者的修法完全不同。
    if (!found.has(key)) found.set(key, {
      where: where, hit: hit, sample: raw.slice(0, 90), rest: rest.slice(0, 90), at: locator(el),
    });
  };
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n = walker.nextNode();
  while (n) {
    const p = n.parentNode;
    if (p && !/^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA)$/.test(p.tagName) && !skipNode(p)) {
      note('文本', n.nodeValue, p);
    }
    n = walker.nextNode();
  }
  document.querySelectorAll('*').forEach((el) => {
    if (skipNode(el)) return;
    ['placeholder', 'title', 'aria-label', 'alt'].forEach((a) => {
      const v = el.getAttribute && el.getAttribute(a);
      if (v) note('@' + a, v, el);
    });
  });
  return Array.from(found.values()).slice(0, 40);
})()`;
/**
 * 「译文没接上」探针：找**整块等于中文 key** 的文本。
 *
 * LEAK_PROBE 靠「中日韩字符」判断，对 ja / zh-Hant **用不了** ——
 * 它们的界面上本来就该有汉字，拿汉字当判据只会满屏假警报。
 * 但这两个语种仍然会出同一种故障：
 * `t('我的记录')` 在文案包里查不到（新加的 key 忘了重新生成文案包），
 * 于是 t() **原样返回中文 key**，屏幕上就出现一句简体中文。
 *
 * 这个探针不看字符种类，只看**字符串是不是恰好等于某个中文 key** ——
 * 那才是「这个 key 没译」的直接证据，和语种无关。
 *
 * 观察名单由调用方给（生成器落盘的 `scripts/i18n-src/_ui-keys.json`），
 * 且只传「译文与 key 不同」的那些：译文本来就等于 key 的
 * （繁中的「，」这类标点）传进来全是假警报。
 */
const MISS_PROBE = (keys) => `(() => {
  const KEYS = ${JSON.stringify(keys)};
  if (!KEYS.length) return [];
  const WANT = Object.create(null);
  KEYS.forEach((k) => { WANT[k] = true; });
  // 语言切换器整块跳过 —— 理由同 LEAK_PROBE：
  // 里面每一条都是**该语种自己的名字**，「简体中文」出现在那里是对的。
  const SKIP_SEL = '.lang-select-wrap, .lang-switch';
  const skipNode = (el) => !!(el && el.closest && el.closest(SKIP_SEL));
  const found = new Map();
  const locator = (el) => {
    if (!el || el.nodeType !== 1) return '';
    const cls = typeof el.className === 'string' ? el.className.trim() : '';
    return '<' + el.tagName.toLowerCase() + (el.id ? '#' + el.id : '')
      + (cls ? '.' + cls.split(/\\s+/).join('.') : '') + '>';
  };
  const note = (where, text, el) => {
    const raw = String(text || '').replace(/\\s+/g, ' ').trim();
    if (!raw || !WANT[raw]) return;
    const k = where + ' :: ' + raw;
    if (!found.has(k)) found.set(k, { where: where, hit: raw, at: locator(el) });
  };
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n = walker.nextNode();
  while (n) {
    const p = n.parentNode;
    if (p && !/^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA)$/.test(p.tagName) && !skipNode(p)) {
      note('文本', n.nodeValue, p);
    }
    n = walker.nextNode();
  }
  document.querySelectorAll('*').forEach((el) => {
    if (skipNode(el)) return;
    ['placeholder', 'title', 'aria-label', 'alt'].forEach((a) => {
      const v = el.getAttribute && el.getAttribute(a);
      if (v) note('@' + a, v, el);
    });
  });
  return Array.from(found.values()).slice(0, 40);
})()`;

/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */

async function fetchJSON(url) {
  const res = await fetch(url);
  return res.json();
}

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

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error('页面异常: ' + (res.exceptionDetails.exception
        ? res.exceptionDetails.exception.description
        : res.exceptionDetails.text));
    }
    return res.result.value;
  }

  async goto(url) {
    this.events = [];
    await this.send('Page.navigate', { url });
    const start = Date.now();
    while (Date.now() - start < 15000) {
      if (this.events.some((e) => e.method === 'Page.loadEventFired')) return;
      await sleep(60);
    }
    throw new Error('页面加载超时: ' + url);
  }

  async shot(file, full) {
    const params = { format: 'png', captureBeyondViewport: !!full };
    if (full) {
      const m = await this.send('Page.getLayoutMetrics');
      const size = m.cssContentSize || m.contentSize;
      params.clip = { x: 0, y: 0, width: Math.min(size.width, 1440), height: size.height, scale: 1 };
    }
    const res = await this.send('Page.captureScreenshot', params);
    fs.writeFileSync(file, Buffer.from(res.data, 'base64'));
  }
}

/* ------------------------------------------------------------------ */

async function main() {
  if (!fs.existsSync(SHOT_DIR)) fs.mkdirSync(SHOT_DIR, { recursive: true });

  /**
   * 起飞前先把「要注入浏览器的那两段源码」编译一遍。
   *
   * 它们写在**模板字符串**里，出错的姿势只有两种，而且都不报在出错的那一行：
   *   ① 想写转义换行，直接敲了真换行 → 注入的字符串没闭合；
   *   ② 注释里写了反引号 → 模板字符串当场被闭合，后面全成了顶层代码。
   * 两种都是 `SyntaxError`，但报的位置在**本文件**里，
   * 而真正的后果是：哨兵表没装上 → 「界面没有漏翻中文」六条全红。
   * 于是人会去查界面，而界面一点问题都没有。
   *
   * `new Function` 在这里就是「按浏览器的方式编译一遍」，零成本。
   * 踩过两次，所以钉在起飞前。
   */
  [['PSEUDO_UI_SOURCE', PSEUDO_UI_SOURCE], ['LEAK_PROBE', LEAK_PROBE([])],
    ['MISS_PROBE', MISS_PROBE([])]].forEach(([name, code]) => {
    try { new Function(code); } catch (e) {
      console.error('✗ ' + name + ' 注入的源码编译不过：' + e.message);
      console.error('  它写在模板字符串里 —— 多半是真换行没转义，或者注释里用了反引号。');
      process.exit(2);
    }
  });

  const chrome = spawn(CHROME, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--hide-scrollbars',
    '--window-size=1440,940',
    '--remote-debugging-port=' + PORT,
    '--user-data-dir=' + USER_DIR,
    'about:blank',
  ], { stdio: 'ignore' });

  const failures = [];
  const check = (label, cond, extra) => {
    if (cond) {
      console.log('  ✓ ' + label);
    } else {
      console.log('  ✗ ' + label + (extra ? '  → ' + extra : ''));
      failures.push(label);
    }
  };

  /* ws 要提到 try 外面：finally 里关浏览器得靠它（见 closeBrowser 的注释） */
  let ws = null;
  /* 导航后「等样式生效」失败了几次。收尾那条前置断言读它 ——
     它必须在 try 外面：const cdp 在 try 里，收尾的 check 在 try 外。 */
  let cssTimeouts = 0;

  try {
    /* 等调试端口就绪。
     *
     * ⚠️ 就绪信号必须是「**自己那台** Chrome 写下了 DevToolsActivePort」，
     * 不能是「这个端口能连上」—— 端口被残留进程占着时后者**也成立**，
     * 于是整套断言跑在别人的浏览器上，报出来的错全指向无关的地方。
     *
     * USER_DIR 每次都是新的时间戳目录，所以这个文件只可能是我们 spawn 的
     * 那台写的；端口传 0 时它还顺便告诉我们 Chrome 挑了哪个端口。
     */
    let debugPort = PORT;
    if (!debugPort) {
      const portFile = path.join(USER_DIR, 'DevToolsActivePort');
      for (let i = 0; i < 60; i += 1) {
        try {
          const line = fs.readFileSync(portFile, 'utf8').split('\n')[0].trim();
          if (line) { debugPort = Number(line); break; }
        } catch (e) { /* 还没写出来 */ }
        await sleep(250);
      }
      if (!debugPort) {
        throw new Error('自己的 Chrome 没写出 ' + portFile + ' —— 调试端口没起来');
      }
    }

    let targets = null;
    for (let i = 0; i < 40; i += 1) {
      try {
        targets = await fetchJSON(`http://127.0.0.1:${debugPort}/json/list`);
        if (targets && targets.length) break;
      } catch (e) { /* 继续等 */ }
      await sleep(250);
    }
    if (!targets || !targets.length) throw new Error('无法连接到 Chrome 调试端口');

    const page = targets.find((t) => t.type === 'page');
    ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((res, rej) => {
      ws.addEventListener('open', res);
      ws.addEventListener('error', rej);
    });

    const cdp = new CDP(ws);
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    /* ------------------------------------------------------------------ *
     * 「等样式真的生效」再量 —— 不要用固定 sleep 赌它。
     *
     * 为什么：`goto()` 只等 `load` 事件，之后全靠 sleep(500/900) 假定 CSS 已经
     * 生效。机器一忙这个假定就不成立，而症状**极具误导性** ——
     * 量到的是「未生效的计算样式」，看着像代码坏了：
     *   · `.faq-list` 的 `border-bottom: 1px solid var(--rule)` 读到 0px
     *     （自定义属性还没解析出来 → 整条声明在计算值阶段失效 → 回落到初始值 0）；
     *   · `.h-del` 读到 opacity 0（基础规则生效了，`@media (hover: none)` 那块还没）。
     * 两次连跑各红一条**不同**的断言，单跑却 8/8 全稳 —— 典型的时序假红。
     *
     * 哨兵**故意就用坏掉的那件东西本身**：`:root` 的 `--rule` 解析出来非空，
     * 才说明 main.css 真的生效了。这比「等一个固定毫秒数」可证伪得多。
     *
     * 顺带把过渡/动画关掉：断言量的是**最终值**，
     * `.h-del` 上挂着 `transition: opacity 120ms`，读在过渡中间就会得到 0。
     * 套件里没有任何一条断言依赖过渡或动画（已 grep 确认），关掉只会更确定。
     * ------------------------------------------------------------------ */
    const settle = async (timeoutMs) => {
      const deadline = Date.now() + (timeoutMs || 8000);
      let ok = false;
      while (Date.now() < deadline) {
        ok = await cdp.eval(`(() => {
          if (document.readyState !== 'complete') return false;
          const v = getComputedStyle(document.documentElement).getPropertyValue('--rule');
          return !!v && v.trim().length > 0;
        })()`).catch(() => false);
        if (ok) break;
        await sleep(50);
      }
      if (!ok) cssTimeouts++;
      await cdp.eval(`(() => {
        if (!document.getElementById('pl-settle')) {
          const s = document.createElement('style');
          s.id = 'pl-settle';
          s.textContent = '*{transition:none !important;animation:none !important}';
          (document.head || document.documentElement).appendChild(s);
        }
        return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r(true))));
      })()`).catch(() => {});
      return ok;
    };
    /* 每处导航后自动 settle —— 一处改动覆盖全部调用点，比逐个补 sleep 可靠。 */
    const rawGoto = cdp.goto.bind(cdp);
    cdp.goto = async (url) => { await rawGoto(url); await settle(); };
    await cdp.send('Log.enable');

    /**
     * 把语种**钉死成简体**，不靠跑测试这台机器的浏览器语言。
     *
     * 语种判定顺序是 URL 参数 → localStorage → navigator.language → 默认。
     * 前面三条都在，就意味着「这个测试跑出什么结果」取决于跑它的浏览器装了什么语言：
     * 一旦有第二个语种的文案包 ready，英文系统的 Chrome 会让 TAG 变成 `en`，
     * 于是本文件里**每一处中文文本匹配**（`.scenario-btn` 找「视频生成」之类）
     * 全部落空，几百条断言一起红，而真正的错因只有一句「浏览器语言不是中文」。
     *
     * 所以这里在**任何一次导航之前**把 localStorage 写好。走 localStorage 而不是
     * `?lang=` 是有意的：URL 参数那条路留给第 14 节（真的要在英文下跑一遍）。
     */
    await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
      source: 'try { localStorage.setItem("promptlens.locale", "zh-Hans"); } catch (e) {}',
    });

    /* ---------------- 0. 公开落地页与 SEO ---------------- */
    console.log('\n[0] 公开落地页与 SEO');
    await cdp.goto(BASE + '/');
    await sleep(500);

    const seo = await cdp.eval(SEO_PROBE);

    check('落地页标题带品牌', seo.title.indexOf('PromptLens') !== -1, seo.title);
    check('落地页有且只有一个 h1', seo.h1Count === 1, 'h1=' + seo.h1Count);
    check('落地页有分节标题（h2）', seo.h2Count >= 4, 'h2=' + seo.h2Count);
    // 爬虫看到的就是这些字。字数太少说明它还是个空壳页面。
    check('落地页有真实可索引的正文（≥1200 字）', seo.textLen >= 1200, seo.textLen + ' 字');
    check('落地页有指向登录页的入口', seo.toLogin >= 1, seo.toLogin + ' 个');
    check('lang 声明为 zh-CN', seo.lang === 'zh-CN', seo.lang);

    check('有 meta description 且长度合适（50~160）',
      !!seo.desc && seo.desc.length >= 50 && seo.desc.length <= 160,
      seo.desc ? seo.desc.length + ' 字' : '缺失');
    check('有 canonical', !!seo.canonical, seo.canonical);
    check('robots 允许收录', !!seo.robots && seo.robots.indexOf('index') === 0, seo.robots);
    check('有 og:title / og:image / twitter:card',
      !!seo.ogTitle && !!seo.ogImage && !!seo.twCard,
      [seo.ogTitle, seo.ogImage, seo.twCard].join(' | '));
    check('og:image 有 alt（无障碍与降级都要）', !!seo.ogImageAlt);
    check('有 theme-color（手机地址栏配色）', !!seo.themeColor, seo.themeColor);

    check('结构化数据能解析（无语法错误）', seo.ldErrors.length === 0, seo.ldErrors.join('; '));
    check('结构化数据含 WebSite + SoftwareApplication + FAQPage + HowTo',
      ['FAQPage', 'SoftwareApplication', 'WebSite', 'HowTo'].every((t) => seo.ldTypes.indexOf(t) !== -1),
      seo.ldTypes.join(', '));
    check('SoftwareApplication 声明了分类', !!seo.appCategory, seo.appCategory);

    // 结构化数据必须和页面上的文字一致 —— 不一致属于作弊，不是优化。
    check('（前置）页面上确实有常见问题', seo.faqVisible.length >= 4, seo.faqVisible.length + ' 条');
    check('FAQ 结构化数据与页面问答逐条一致',
      seo.faqLd.length === seo.faqVisible.length
      && seo.faqLd.every((t, i) => t === seo.faqVisible[i]),
      '标记 ' + seo.faqLd.length + ' 条 vs 页面 ' + seo.faqVisible.length + ' 条');
    check('FAQ 每条都有答案正文', seo.faqAnswerEmpty === 0, seo.faqAnswerEmpty + ' 条缺答案');

    /* ---- LLMO：定义句三处一致 ----
       模型的引用单元是**句子**，所以最要紧的是「有没有一句能被单独摘走、
       还站得住的话」。这句定义同时是正文、meta description、JSON-LD 的
       SoftwareApplication.description —— 三处不一致的话，模型读到三个说法，
       而页面上一个字都看不出来。 */
    check('（前置）正文里有定义句（.hero-def）', !!seo.heroDef,
      JSON.stringify(String(seo.heroDef || '').slice(0, 40)));
    check('定义句：正文与 meta description 逐字一致',
      !!seo.heroDef && seo.heroDef === seo.desc,
      '正文 ' + JSON.stringify(String(seo.heroDef || '').slice(0, 24))
      + ' / meta ' + JSON.stringify(String(seo.desc || '').slice(0, 24)));
    check('定义句：正文与 JSON-LD 的 SoftwareApplication.description 逐字一致',
      !!seo.heroDef && seo.heroDef === seo.appDesc,
      '正文 ' + JSON.stringify(String(seo.heroDef || '').slice(0, 24))
      + ' / ld ' + JSON.stringify(String(seo.appDesc || '').slice(0, 24)));

    /* ---- LLMO：HowTo 与可见的四步逐条一致 ---- */
    check('结构化数据里有 HowTo', seo.hasHowto);
    check('HowTo 的四步与页面上看得见的四步逐条一致',
      seo.howtoSteps.length > 0
      && seo.howtoSteps.length === seo.stepVisible.length
      && seo.howtoSteps.every((t, i) => t === seo.stepVisible[i]),
      '标记 ' + seo.howtoSteps.join('/') + ' vs 页面 ' + seo.stepVisible.join('/'));

    /* ---- LLMO：场景对照表 ---- */
    check('场景对照表有三列', seo.tableHeads.length === 3, seo.tableHeads.join(' | '));
    check('场景对照表有三行（三类场景）', seo.tableRowHeads.length === 3,
      seo.tableRowHeads.join(' | '));
    check('场景对照表每个数据格都有 data-label（窄屏竖排靠它出列名）',
      seo.tableDataCells > 0 && seo.tableLabeled === seo.tableDataCells,
      seo.tableLabeled + '/' + seo.tableDataCells + ' 格有列名');

    /* 落地页**故意没有** assertClosedGrids。
       它原来唯一的塌陷网格是 .scene-cards（三张卡），2026-09-22 为了 LLMO
       换成了一张真 <table> —— 表格的对齐由浏览器保证，这一页现在没有塌陷网格，
       硬要断言只会撞上「（前置）页面上确实有塌陷网格要验」那条反空洞前置。
       场景那节现在由上面这几条守着：表格三列 / 三行 / 每格 data-label、
       .scene-table-wrap 的收口线、「适用工具」列的计算样式，外加一条界面变异。
       ⚠️ 别再为了「看起来覆盖全」把 assertClosedGrids 加回这一页。 */
    await cdp.shot(path.join(SHOT_DIR, '00-landing.png'));

    /* 落地页的排版节奏：收口线 / 工具行对齐 / 工具行的计算样式。
       这三条是设计 QA 那一轮量出来的，肉眼读缩略图看不出来 —— 详见探针上的注释。 */
    const rhythm = JSON.parse(await cdp.eval(LANDING_RHYTHM_PROBE));

    check('（前置）四个内容块都在页面上',
      rhythm.rules.length === 4 && rhythm.rules.every((r) => r.found),
      rhythm.rules.map((r) => r.sel + (r.found ? '' : '(缺)')).join(' '));

    rhythm.rules.forEach((r) => {
      const w = Math.max(r.own, r.overlay);
      check(`${r.sel} 有收口线（否则这一段没有结束感）`, w >= 1,
        'border-bottom=' + w + 'px（自身 ' + r.own + ' / ::after ' + r.overlay + '）');
    });

    check('（前置）场景表确实量到了「适用工具」列', rhythm.tools.length >= 3,
      rhythm.tools.length + ' 格');
    check('「适用工具」列字号是 --fs-micro（没被 .scene-table tbody td 盖掉）',
      rhythm.tools.every((t) => t.size === rhythm.micro),
      '实际 ' + rhythm.tools.map((t) => t.size).join('/') + '，token ' + rhythm.micro);
    check('「适用工具」列颜色是 --ink-3（没被 .scene-table tbody td 盖掉）',
      rhythm.tools.every((t) => t.color === rhythm.ink3),
      '实际 ' + (rhythm.tools[0] || {}).color + '，token ' + rhythm.ink3);
    check('场景表的行分隔线横贯整行（表格自带，不用像卡片那样凑高度）',
      rhythm.rowRules.length >= 3 && rhythm.rowRules.every((w) => w >= 1),
      rhythm.rowRules.join('/'));

    /* 这里原来有一块「700px 宽下再量一次塌陷网格」：落地页的 .scene-cards
       在 600~800px 会掉成两列、末行只剩一张，右下角真的开口，所以必须挑
       那个宽度量（1440px 下开口 0px，断言会走「不需要补边」那条分支，绿得没意义）。
       卡片换成真表格之后这一页没有塌陷网格了，整块删掉。

       ⚠️ 「必须在会塌的宽度上量」这条纪律本身**仍然有效**，只是对象换了：
       工作台页的 .scenario-grid（10 格）和结果页的 .improve-grid（7 格）
       才是现在会塌的两个。它们各自在自己的小节里量（[2] 工作台 / [5] 结果页）。
       哪天要在窄屏量它们，把这段搬过去 —— **不要在这里重新加回来**，
       这一页已经没有可量的东西了。 */

    /* robots.txt / sitemap.xml 是文件不是接口，直接取原文来验 */
    const robotsTxt = await (await fetch(BASE + '/robots.txt')).text();
    const sitemapXml = await (await fetch(BASE + '/sitemap.xml')).text();
    const origin = new URL(seo.canonical).origin;

    check('robots.txt 可访问且允许抓取',
      /User-agent:\s*\*/i.test(robotsTxt) && /Allow:\s*\//i.test(robotsTxt));
    check('robots.txt 挡住了接口路径', /Disallow:\s*\/api\//i.test(robotsTxt));
    check('robots.txt 指向 sitemap', /Sitemap:\s*\S+/i.test(robotsTxt));
    check('sitemap.xml 是合法 urlset', /<urlset[\s\S]*<\/urlset>/i.test(sitemapXml));
    check('sitemap.xml 里至少有一条 URL', (sitemapXml.match(/<loc>/g) || []).length >= 1);

    /* 域名只该有一个来源。改了一处漏了另一处，分享出去的卡片就会指向空气 ——
       这种错在页面上完全看不出来，只有把几处拿出来对才知道。 */
    check('sitemap / robots 里的域名与 canonical 同源',
      sitemapXml.indexOf(origin) !== -1 && robotsTxt.indexOf(origin) !== -1,
      'canonical 源 = ' + origin);

    // og:image 必须是真实存在、且尺寸正确的位图（不是 SVG、不是 404）
    const ogPath = path.join(__dirname, '..', 'public',
      new URL(seo.ogImage).pathname.replace(/^\//, ''));
    let ogSize = null;
    try { ogSize = pngSize(ogPath); } catch (e) { /* 读不到就是缺失 */ }
    check('og:image 指向真实文件且为 1200×630',
      !!ogSize && ogSize.w === 1200 && ogSize.h === 630,
      ogSize ? ogSize.w + '×' + ogSize.h : '读不到 ' + ogPath);

    /* 登录页和工作台都不该进索引。
       用 HTTP 取**原始 HTML** 来判断，而不是开浏览器读 DOM：
       爬虫看到的就是原始 HTML；而浏览器里未登录访问 /app.html 会立刻被 JS 跳去 /login ——
       读 DOM 就会读到登录页的 meta，于是把 app.html 的 noindex 删掉也照样绿。
       （这条断言一开始正是那么写的，是 mutation-check-ui 把它揪出来的。）
       顺带验一下取到的确实是那两个页面，别拿一个 404 页面当证据。 */
    const loginHtml = await (await fetch(BASE + '/login')).text();
    const appHtml = await (await fetch(BASE + '/app.html')).text();
    check('（前置）取到的确实是登录页与工作台的 HTML',
      /auth-form-wrap/.test(loginHtml) && /app-shell/.test(appHtml),
      'login=' + loginHtml.length + 'B app=' + appHtml.length + 'B');
    check('登录页声明 noindex', /<meta\s+name="robots"[^>]*noindex/i.test(loginHtml));
    check('工作台声明 noindex', /<meta\s+name="robots"[^>]*noindex/i.test(appHtml));

    /* ---------------- 1. 登录页 ---------------- */
    console.log('\n[1] 登录页');
    /* 走干净地址 /login 而不是 /login.html —— 顺便把服务端那条重写规则也测了。
       重写要是坏了，这里会 404，断言会以「品牌区渲染」失败的形式报出来。 */
    await cdp.goto(BASE + '/login');
    await sleep(400);

    check('页面标题正确', (await cdp.eval('document.title')).indexOf('PromptLens') !== -1);
    check('品牌区渲染', await cdp.eval('!!document.querySelector(".auth-headline")'));
    check('登录/注册切换可用',
      await cdp.eval('document.querySelectorAll(".tab").length === 2'));
    await cdp.shot(path.join(SHOT_DIR, '01-login.png'));

    // 注册
    const username = 'e2e' + Date.now().toString(36);
    await cdp.eval(`(() => {
      document.querySelector('.tab[data-tab="register"]').click();
      document.getElementById('username').value = ${JSON.stringify(username)};
      document.getElementById('password').value = 'test123456';
      document.getElementById('displayName').value = '测试用户';
      document.getElementById('authForm').dispatchEvent(new Event('submit', {cancelable:true, bubbles:true}));
      return true;
    })()`);

    let entered = false;
    for (let i = 0; i < 40; i += 1) {
      await sleep(200);
      const url = await cdp.eval('location.pathname');
      if (url.indexOf('app.html') !== -1) { entered = true; break; }
    }
    check('注册后自动进入工作台', entered, await cdp.eval('location.href'));

    /* ---------------- 2. 工作台 ---------------- */
    console.log('\n[2] 工作台');
    await sleep(700);
    check('用户名已显示', (await cdp.eval('document.getElementById("userName").textContent')) === '测试用户');
    check('场景卡片已渲染（含图片/视频）',
      (await cdp.eval('document.querySelectorAll(".scenario-btn").length')) === 10,
      '数量=' + await cdp.eval('document.querySelectorAll(".scenario-btn").length'));
    check('示例入口有 3 个',
      (await cdp.eval('document.querySelectorAll(".sample-row [data-sample]").length')) === 3);
    assertClosedGrids(check, await cdp.eval(COLLAPSED_GRID_PROBE));
    await cdp.shot(path.join(SHOT_DIR, '02-workspace.png'));

    /* ---------------- 3. 输入需求 ---------------- */
    console.log('\n[3] 输入需求与自动识别');
    await cdp.eval(`(() => {
      const ta = document.getElementById('rawPrompt');
      ta.value = '帮我写一篇关于远程办公的公众号文章，要给公司同事看的';
      ta.dispatchEvent(new Event('input', {bubbles:true}));
      return true;
    })()`);
    await sleep(600);

    const activeScenario = await cdp.eval('document.querySelector(".scenario-btn.active .s-name").textContent');
    check('自动识别为「内容写作」', activeScenario === '内容写作', activeScenario);
    check('分析条显示得分', await cdp.eval('!document.getElementById("analyzeStrip").classList.contains("hidden")'));
    const beforeScore = await cdp.eval('document.getElementById("scoreBefore").textContent');
    check('右侧显示原始得分', Number(beforeScore) > 0, beforeScore);
    check('负面提示词区默认隐藏',
      await cdp.eval('document.getElementById("negativeSection").classList.contains("hidden")'));
    await cdp.shot(path.join(SHOT_DIR, '03-analyze.png'));

    /* ---------------- 4. 多轮拆解 ---------------- */
    console.log('\n[4] 多轮拆解与选择');
    await cdp.eval('document.getElementById("startBtn").click()');
    await sleep(400);
    check('进入问答阶段', !(await cdp.eval('document.getElementById("stageRounds").classList.contains("hidden")')));

    let round = 0;
    let seenRounds = [];
    let totalOptions = 0;
    while (round < 15) {
      const done = await cdp.eval('!document.getElementById("stageResult").classList.contains("hidden")');
      if (done) break;

      const info = await cdp.eval(`(() => {
        const badge = document.getElementById('roundBadge').textContent;
        const blocks = document.querySelectorAll('.q-block');
        return { badge: badge, blocks: blocks.length };
      })()`);
      if (!info.blocks) break;
      round += 1;
      seenRounds.push(info.badge);

      // 每轮：每题选第一个有效选项（多选题再多选一个）
      const picked = await cdp.eval(`(() => {
        let count = 0;
        document.querySelectorAll('.q-block').forEach(b => {
          const opts = Array.from(b.querySelectorAll('.option-btn'))
            .filter(x => !x.classList.contains('is-skip') && !x.classList.contains('is-custom'));
          if (!opts.length) return;
          opts[0].click(); count++;
          const isMulti = b.querySelector('.q-multi-note');
          if (isMulti && opts[1]) { opts[1].click(); count++; }
        });
        return count;
      })()`);
      totalOptions += picked;

      if (round === 2) await cdp.shot(path.join(SHOT_DIR, '04-rounds.png'));

      // 检查预览是否实时更新
      if (round === 1) {
        await sleep(200);
        const live = await cdp.eval('document.getElementById("livePreview").textContent');
        check('右侧实时拼出 Prompt', live.indexOf('# 角色设定') !== -1 || live.indexOf('# 任务目标') !== -1);
        const decisions = await cdp.eval('document.querySelectorAll("#decisionList .decision-item").length');
        check('决策清单实时更新', decisions >= 2, '数量=' + decisions);

        // 文字类选项的对照示例：每个选项都要有「默认 → 选了」两行，而且两行不能是同一句话
        const demoInfo = await cdp.eval(`(() => {
          const out = { blocks: 0, opts: 0, optsWithDemo: 0, bothLines: 0, sameText: 0, sample: '' };
          document.querySelectorAll('.q-block').forEach(b => {
            if (!b.querySelector('.o-demo.is-text')) return;
            out.blocks += 1;
            b.querySelectorAll('.option-btn:not(.is-skip):not(.is-custom)').forEach(btn => {
              out.opts += 1;
              if (btn.querySelector('.o-demo.is-text')) out.optsWithDemo += 1;
            });
            b.querySelectorAll('.o-demo.is-text').forEach(d => {
              const before = d.querySelector('.d-line.is-before');
              const after = d.querySelector('.d-line.is-after');
              if (!before || !after) return;
              out.bothLines += 1;
              const bt = before.textContent.replace('默认', '').trim();
              const at = after.textContent.replace('选了', '').trim();
              if (bt === at) out.sameText += 1;
              if (!out.sample) out.sample = bt.slice(0, 22) + '  →  ' + at.slice(0, 22);
            });
          });
          return out;
        })()`);
        check('文字题每个选项都带「默认 → 选了」对照',
          demoInfo.blocks > 0 && demoInfo.optsWithDemo === demoInfo.opts,
          demoInfo.optsWithDemo + ' / ' + demoInfo.opts + ' 个选项');
        check('对照的两行都渲染出来了', demoInfo.bothLines > 0, '对数=' + demoInfo.bothLines);
        check('对照的两行内容确实不同', demoInfo.sameText === 0, demoInfo.sample);
        await cdp.shot(path.join(SHOT_DIR, '04b-text-demos.png'));
      }

      await cdp.eval('document.getElementById("nextBtn").click()');
      await sleep(260);
    }

    check('完成了多轮拆解', round >= 5, '轮数=' + round + ' ' + seenRounds.join(','));
    check('每轮都有可选按钮', totalOptions >= round * 2, '总选择次数=' + totalOptions);

    /* ---------------- 5. 结果页（文字） ---------------- */
    console.log('\n[5] 结果页 · 文字');
    await sleep(600);
    check('进入结果阶段', !(await cdp.eval('document.getElementById("stageResult").classList.contains("hidden")')));

    const finalText = await cdp.eval('document.getElementById("finalPrompt").textContent');
    check('生成了最终 Prompt', finalText.length > 200, '长度=' + finalText.length);
    check('保留了原始需求原话', finalText.indexOf('远程办公') !== -1);
    check('包含角色设定板块', finalText.indexOf('# 角色设定') !== -1);
    check('包含约束条件板块', finalText.indexOf('# 约束条件') !== -1);
    check('文字类不显示负面提示词区',
      await cdp.eval('document.getElementById("negativeSection").classList.contains("hidden")'));
    check('「怎么用」说明为文字版',
      (await cdp.eval('document.getElementById("usageNote").textContent')).indexOf('对话框') !== -1);
    await assertToolStrip(check, cdp, 'text', '文字');

    const afterScore = await cdp.eval('document.getElementById("scoreAfter").textContent');
    check('得分显著提升', Number(afterScore) > Number(beforeScore), beforeScore + ' → ' + afterScore);

    check('决策表有内容', (await cdp.eval('document.querySelectorAll("#decisionTable tbody tr").length')) >= 5);
    check('「为什么这样写」已渲染', (await cdp.eval('document.querySelectorAll("#whyList .decision-item").length')) >= 3);
    assertClosedGrids(check, await cdp.eval(COLLAPSED_GRID_PROBE));
    await cdp.shot(path.join(SHOT_DIR, '05-result.png'));
    await cdp.eval('document.getElementById("mainScroll").scrollTop = 99999');
    await sleep(400);
    await cdp.shot(path.join(SHOT_DIR, '05-result-bottom.png'));

    /* ---------------- 6. 图片生成链路 ---------------- */
    console.log('\n[6] 图片生成链路');
    await cdp.eval('document.getElementById("newBtn").click()');
    await sleep(300);
    await cdp.eval('document.querySelector(\'.sample-row [data-sample="image"]\').click()');
    await sleep(500);

    check('示例按钮填入图片描述',
      (await cdp.eval('document.getElementById("rawPrompt").value')).indexOf('橘猫') !== -1);
    check('场景锁定为「图片生成」',
      (await cdp.eval('document.querySelector(".scenario-btn.active .s-name").textContent')) === '图片生成');
    check('分析条按图片维度给建议',
      (await cdp.eval('document.getElementById("analyzeStrip").textContent')).indexOf('主体描述') !== -1,
      await cdp.eval('document.getElementById("analyzeStrip").textContent'));

    await cdp.eval('document.getElementById("startBtn").click()');
    await sleep(400);

    // 用户已经写了「橘猫」，主体那题应当把「动物」标成推荐
    const recInfo = await cdp.eval(`(() => {
      const btn = document.querySelector('.q-block[data-qid="img.subject"] .option-btn.is-recommended');
      return btn ? btn.textContent.replace(/\\s+/g, ' ').trim() : '';
    })()`);
    check('按用户原话标出推荐项', recInfo.indexOf('动物') !== -1, recInfo || '（没有推荐项）');
    check('推荐项默认不被选中',
      await cdp.eval('document.querySelectorAll(".q-block[data-qid=\\"img.subject\\"] .option-btn.is-recommended.selected").length === 0'));

    let imgRound = 0;
    let imgTitles = [];
    let sceneDemoChecked = false;
    while (imgRound < 15) {
      const done = await cdp.eval('!document.getElementById("stageResult").classList.contains("hidden")');
      if (done) break;
      const titles = await cdp.eval('Array.from(document.querySelectorAll(".q-block .q-title")).map(e => e.textContent)');
      if (!titles.length) break;
      imgRound += 1;
      imgTitles = imgTitles.concat(titles);

      // 顺路验证多选题的两个约束（上限 + 同类互斥），用真实点击而不是直接改状态
      const ruleCheck = await cdp.eval(`(() => {
        const out = {};
        const findIn = (block, label) => Array.from(block.querySelectorAll('.option-btn'))
          .find(x => x.textContent.indexOf(label) !== -1);
        const labelsOf = (block) => Array.from(block.querySelectorAll('.option-btn.selected'))
          .map(x => (x.querySelector('.o-label').textContent || '').replace('推荐', '').trim());

        const styleBlock = document.querySelector('.q-block[data-qid="img.style"]');
        if (styleBlock) {
          const opts = Array.from(styleBlock.querySelectorAll('.option-btn'))
            .filter(x => !x.classList.contains('is-skip') && !x.classList.contains('is-custom'));
          opts[0].click(); opts[1].click(); opts[2].click();
          out.maxKept = styleBlock.querySelectorAll('.option-btn.selected').length;
          const note = styleBlock.querySelector('.q-multi-note');
          out.note = note ? note.textContent : '';
          // 先清空再单独验证互斥，否则会被 maxPick 的顶替效果掩盖
          Array.from(styleBlock.querySelectorAll('.option-btn.selected')).forEach(x => x.click());
          findIn(styleBlock, '写实摄影').click();
          out.afterPhoto = labelsOf(styleBlock);
          findIn(styleBlock, '像素风').click();
          out.afterPixel = labelsOf(styleBlock);
        }

        const lightBlock = document.querySelector('.q-block[data-qid="img.lighting"]');
        if (lightBlock) {
          findIn(lightBlock, '柔和自然光').click();
          out.beforeNeon = labelsOf(lightBlock);
          findIn(lightBlock, '霓虹').click();
          out.afterNeon = labelsOf(lightBlock);
        }
        return out;
      })()`);

      if (ruleCheck.maxKept !== undefined) {
        await cdp.shot(path.join(SHOT_DIR, '10b-multi-rules.png'));
        check('「最多选 2 个」真的生效', ruleCheck.maxKept === 2, '实际选中=' + ruleCheck.maxKept);
        check('多选题标题写明上限与互斥',
          ruleCheck.note.indexOf('最多选 2 个') !== -1 && ruleCheck.note.indexOf('同类只能选一个') !== -1,
          ruleCheck.note);
        check('同类画法互斥（写实摄影被像素风挤掉）',
          ruleCheck.afterPhoto.join('') === '写实摄影'
          && ruleCheck.afterPixel.join('') === '像素风',
          ruleCheck.afterPhoto.join(' / ') + '  →  ' + ruleCheck.afterPixel.join(' / '));
      }
      if (ruleCheck.beforeNeon) {
        check('光线同类互斥（自然光被霓虹挤掉）',
          ruleCheck.afterNeon.length === 1 && ruleCheck.afterNeon.join('').indexOf('霓虹') !== -1,
          ruleCheck.beforeNeon.join(' / ') + '  →  ' + ruleCheck.afterNeon.join(' / '));
      }

      // 场景类选项的对照示例：每个选项旁边都该有一对「默认 → 选了」的图，而且真的画出来了。
      // 不能写死轮次 —— 第 1 轮是「任务意图 + 主体」，两题都没有示例图。
      // 也不能只等「已经出现示例图的块」，否则示例图整体挂掉时会被静默跳过；
      // 所以等已知的术语题（构图 / 光线）上场，再断言，并要求确实有块带示例图。
      const sceneReady = await cdp.eval(
        '!!document.querySelector(\'.q-block[data-qid="img.composition"], .q-block[data-qid="img.lighting"]\')');
      if (sceneReady && !sceneDemoChecked) {
        sceneDemoChecked = true;
        assertSceneDemos(check, await cdp.eval(SCENE_DEMO_PROBE));
        await cdp.shot(path.join(SHOT_DIR, '10c-scene-demos.png'));
      }

      // 其余题目各选一个推进流程（已有选择的跳过，别把上面的验证结果覆盖掉）
      await cdp.eval(`(() => {
        document.querySelectorAll('.q-block').forEach(b => {
          if (b.querySelector('.option-btn.selected')) return;
          const o = b.querySelector('.option-btn:not(.is-skip):not(.is-custom)');
          if (o) o.click();
        });
        return true;
      })()`);
      if (imgRound === 1) await cdp.shot(path.join(SHOT_DIR, '10-image-rounds.png'));
      await cdp.eval('document.getElementById("nextBtn").click()');
      await sleep(260);
    }

    check('图片链路完成多轮拆解', imgRound >= 5, '轮数=' + imgRound);
    check('图片链路确实走到了带对照示例的题目（否则上面的示例断言等于没跑）', sceneDemoChecked);
    check('问到了图片专属维度（构图/光线/风格）',
      imgTitles.some((t) => /景别|构图|视角|光线|风格|色彩|画幅|画质/.test(t)),
      imgTitles.join(' / '));
    check('没有混入文字类维度',
      !imgTitles.some((t) => /角色身份|目标受众|输出形态|去 AI 味/.test(t)));

    await sleep(600);
    const imgPrompt = await cdp.eval('document.getElementById("finalPrompt").textContent');
    check('生成了图片 Prompt', imgPrompt.length > 60, '长度=' + imgPrompt.length);
    check('图片 Prompt 保留原话', imgPrompt.indexOf('橘猫') !== -1);
    check('图片 Prompt 不含 Markdown 分节', imgPrompt.indexOf('# ') === -1);
    check('图片 Prompt 是逗号分隔的连续描述',
      imgPrompt.indexOf('，') !== -1 && imgPrompt.split('\n').length <= 2,
      '行数=' + imgPrompt.split('\n').length);

    check('负面提示词区已显示',
      !(await cdp.eval('document.getElementById("negativeSection").classList.contains("hidden")')));
    const imgNeg = await cdp.eval('document.getElementById("negativePrompt").textContent');
    check('负面提示词是英文标签', /[a-z]/.test(imgNeg) && imgNeg.indexOf(',') !== -1, imgNeg.slice(0, 60));
    check('「怎么用」说明为图片版',
      (await cdp.eval('document.getElementById("usageNote").textContent')).indexOf('negative prompt') !== -1);
    await assertToolStrip(check, cdp, 'image', '图片');

    const imgScore = await cdp.eval('document.getElementById("scoreAfter").textContent');
    check('图片 Prompt 得分提升', Number(imgScore) > Number(await cdp.eval('document.getElementById("scoreBefore").textContent')),
      await cdp.eval('document.getElementById("scoreBefore").textContent') + ' → ' + imgScore);
    await cdp.shot(path.join(SHOT_DIR, '11-image-result.png'));

    // 复制负面提示词不能报错
    await cdp.eval('document.getElementById("copyNegativeBtn").click()');
    await sleep(300);
    check('点「复制」负面提示词有反馈',
      (await cdp.eval('document.querySelectorAll("#toastWrap .toast").length')) >= 1);

    /* ---------------- 7. 视频生成链路 ---------------- */
    console.log('\n[7] 视频生成链路');
    await cdp.eval('document.getElementById("newBtn").click()');
    await sleep(300);
    await cdp.eval('document.querySelector(\'.sample-row [data-sample="video"]\').click()');
    await sleep(500);

    check('场景锁定为「视频生成」',
      (await cdp.eval('document.querySelector(".scenario-btn.active .s-name").textContent')) === '视频生成');

    await cdp.eval('document.getElementById("startBtn").click()');
    await sleep(400);

    let vidRound = 0;
    let vidTitles = [];
    let vidDemoChecked = false;
    while (vidRound < 15) {
      const done = await cdp.eval('!document.getElementById("stageResult").classList.contains("hidden")');
      if (done) break;
      const titles = await cdp.eval('Array.from(document.querySelectorAll(".q-block .q-title")).map(e => e.textContent)');
      if (!titles.length) break;
      vidRound += 1;
      vidTitles = vidTitles.concat(titles);

      // 视频链路同样要有对照示例图（景别 / 运镜这类术语最需要）。
      // 同样不能写死轮次：第 1 轮是「任务意图 + 主体动作」，两题都没有示例图。
      const vidSceneReady = await cdp.eval(
        '!!document.querySelector(\'.q-block[data-qid="vid.shot"], .q-block[data-qid="vid.move"]\')');
      if (vidSceneReady && !vidDemoChecked) {
        vidDemoChecked = true;
        assertSceneDemos(check, await cdp.eval(SCENE_DEMO_PROBE));
        await cdp.shot(path.join(SHOT_DIR, '12b-video-demos.png'));
      }

      await cdp.eval(`(() => {
        document.querySelectorAll('.q-block').forEach(b => {
          const opts = Array.from(b.querySelectorAll('.option-btn'))
            .filter(x => !x.classList.contains('is-skip') && !x.classList.contains('is-custom'));
          if (opts.length) opts[0].click();
        });
        return true;
      })()`);
      if (vidRound === 1) await cdp.shot(path.join(SHOT_DIR, '12-video-rounds.png'));
      await cdp.eval('document.getElementById("nextBtn").click()');
      await sleep(260);
    }

    check('视频链路完成多轮拆解', vidRound >= 5, '轮数=' + vidRound);
    check('视频链路确实走到了带对照示例的题目（否则上面的示例断言等于没跑）', vidDemoChecked);
    check('问到了视频专属维度（景别/运镜/时长）',
      vidTitles.some((t) => /景别|运镜|镜头|时长|声音/.test(t)),
      vidTitles.join(' / '));

    await sleep(600);
    const vidPrompt = await cdp.eval('document.getElementById("finalPrompt").textContent');
    check('生成了视频 Prompt', vidPrompt.length > 60, '长度=' + vidPrompt.length);
    check('视频 Prompt 保留原话', vidPrompt.indexOf('雨夜') !== -1);
    // 这一轮每题都点第一个选项 → 时长落在「3-5 秒 · 单镜头」、景别只有一个，
    // 所以这里应当是连续描述形态。分镜表另有一条专门链路验证（见 7.5）。
    check('单镜头视频不含 Markdown 分节', vidPrompt.indexOf('# ') === -1);
    check('单镜头视频用句号连接的描述式写法', vidPrompt.indexOf('。') !== -1);
    check('视频也有负面提示词',
      !(await cdp.eval('document.getElementById("negativeSection").classList.contains("hidden")')));
    /* 判据用「分镜表」而不是某个工具名：原来这里查的是 'Sora'，
       Sora 一关停这条就永远红 —— 断言跟着第三方产品走，产品一死就变成噪音。
       「分镜表」是本站自己的功能词，只在视频版说明里出现。 */
    check('「怎么用」说明为视频版',
      (await cdp.eval('document.getElementById("usageNote").textContent')).indexOf('分镜表') !== -1);
    await assertToolStrip(check, cdp, 'video', '视频');
    assertToolStripFamilies(check);

    // 单镜头视频必须告诉用户「分镜表怎么才能拿到」——
    // 用户选了景别却拿到一段描述时，没有这句只会以为功能坏了。
    //
    // 这一轮每题都点第一个选项 → 「剪辑结构」落在「分镜剪辑」（要多个镜头），
    // 但景别只有一个、时长又是「3-5 秒 · 单镜头」—— 两条答案自己打架，
    // 所以这里必须是 warn，而且**两个卡点都要点到**：
    // 只写「再多选一个景别」的话，用户照做之后还是拿不到表（时长那条还卡着），
    // 他会以为是自己没改对，或者认定功能坏了。
    const vidNotice = await cdp.eval(`(() => {
      const n = document.getElementById('promptNotice');
      return {
        hidden: n.classList.contains('hidden'),
        warn: n.classList.contains('is-warn'),
        text: n.textContent.trim(),
        title: document.getElementById('finalTitle').textContent.trim(),
      };
    })()`);
    check('单镜头视频给了「分镜表怎么拿」的说明，而且两个卡点一次说全',
      !vidNotice.hidden && vidNotice.warn
      && vidNotice.text.indexOf('分镜剪辑') !== -1
      && vidNotice.text.indexOf('再多选一个景别') !== -1
      && vidNotice.text.indexOf('时长与节奏') !== -1,
      vidNotice.text);
    check('单镜头视频标题不带「分镜方案」',
      vidNotice.title === '最终 Prompt', vidNotice.title);
    await cdp.shot(path.join(SHOT_DIR, '13-video-result.png'));

    /* ---------------- 7.4b 手敲的短视频需求必须走到「镜头景别」 ---------------- */
    // 用户的原话：「没看见镜头景别的选项」。
    //
    // 根因不在景别题本身 —— 它一直好好地在那儿，选项一个不少。
    // 根因在**场景识别**：「帮我做一段 30 秒的城市夜景短视频，多镜头切换」
    // 被判成了**图片**（视觉兜底给的 image +9 压过了「视频」那 2 分）。
    // 用户于是被带进图片链路，「镜头景别」「运镜方式」「时长与节奏」一个都不会出现。
    //
    // 这类错的症状是「后面问的题不对」，不报错、不告警，光看引擎单测也看不出 ——
    // 所以必须在真实浏览器里，从「手敲一句话」一路钉到「那道题真的上场了」。
    console.log('\n[7.4b] 手敲的短视频需求要走到「镜头景别」');
    await cdp.eval('document.getElementById("newBtn").click()');
    await sleep(300);
    await cdp.eval(`(() => {
      const ta = document.getElementById('rawPrompt');
      ta.value = '帮我做一段 30 秒的城市夜景短视频，多镜头切换';
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    })()`);
    await sleep(600);   // 场景识别是防抖的，不等就取到旧值
    const guessed = await cdp.eval(`(() => {
      const btn = Array.from(document.querySelectorAll('.scenario-btn'))
        .find(b => b.classList.contains('active'));
      return btn ? btn.textContent.trim() : '(没选中任何场景)';
    })()`);
    check('手敲的短视频需求被识别成「视频生成」（不是图片、不是通用任务）',
      guessed.indexOf('视频') !== -1, '识别为 ' + guessed);

    await cdp.eval('document.getElementById("startBtn").click()');
    await sleep(400);
    // 景别在第 2 轮，但**别写死轮次** —— 跟着轮次走，题目上场了再断言。
    let shotSeen = false;
    let shotProbe = null;
    for (let sr = 0; sr < 8; sr += 1) {
      if (await cdp.eval('!document.getElementById("stageResult").classList.contains("hidden")')) break;
      const blocks = await cdp.eval('document.querySelectorAll(".q-block").length');
      if (!blocks) break;
      shotProbe = await cdp.eval(`(() => {
        const bl = document.querySelector('.q-block[data-qid="vid.shot"]');
        if (!bl) return null;
        const opts = Array.from(bl.querySelectorAll('.option-btn:not(.is-skip):not(.is-custom)'));
        return {
          title: bl.querySelector('.q-title').textContent.trim(),
          count: opts.length,
          visible: opts.filter(o => getComputedStyle(o).display !== 'none'
            && o.getBoundingClientRect().height > 0).length,
          labels: opts.map(o => (o.querySelector('.o-label') || {}).textContent || '').join('/'),
        };
      })()`);
      if (shotProbe) { shotSeen = true; break; }
      await cdp.eval(`(() => {
        document.querySelectorAll('.q-block').forEach(bl => {
          const o = bl.querySelector('.option-btn:not(.is-skip):not(.is-custom)');
          if (o) o.click();
        });
        return true;
      })()`);
      await sleep(150);
      await cdp.eval('document.getElementById("nextBtn").click()');
      await sleep(300);
    }
    // 先确认「这段断言真的跑过」—— 功能整体挂掉时，下面的断言会被静默跳过。
    check('（前置）走视频链路时「镜头景别」这一题确实上场了',
      shotSeen, shotSeen ? '' : '走了 8 轮都没见到 vid.shot');
    check('「镜头景别」的选项都在、都可见，标题也对得上用户说的那个词',
      !!shotProbe && shotProbe.title.indexOf('镜头景别') === 0
      && shotProbe.count >= 4 && shotProbe.visible === shotProbe.count
      && shotProbe.labels.indexOf('特写') !== -1,
      shotProbe ? '「' + shotProbe.title + '」' + shotProbe.count + ' 个 / 可见 '
        + shotProbe.visible + ' 个：' + shotProbe.labels : '(没见到这道题)');

    /* ---------------- 7.4c 问答阶段能换场景 ---------------- */
    // 输入阶段的提示写着「系统会先自动判断，你随时可以改」，但进入问答阶段后
    // 场景网格所在的整个 section 都被隐藏了 —— 那句话当时是句空头承诺。
    // 这条验的就是「随时可以改」真的兑现了：判错不用从头再来。
    console.log('\n[7.4c] 问答阶段换场景');
    const swBefore = await cdp.eval(`(() => {
      const b = document.getElementById('scenarioSwitchBtn');
      return {
        exists: !!b,
        visible: !!b && b.offsetParent !== null,
        label: b ? b.textContent.trim() : '',
        qids: Array.from(document.querySelectorAll('.q-block')).map(x => x.dataset.qid),
        badge: document.getElementById('roundBadge').textContent.trim(),
      };
    })()`);
    check('问答阶段有「换场景」入口，并且写清了当前走的是哪条链路',
      swBefore.exists && swBefore.visible && swBefore.label.indexOf('视频生成') !== -1,
      swBefore.label || '(按钮不存在)');
    check('（前置）换之前确实在视频链路上、而且已经答过至少一轮',
      swBefore.qids.some((q) => q.indexOf('vid.') === 0) && swBefore.badge !== '第 1 轮',
      swBefore.badge + ' / ' + swBefore.qids.join(','));

    await cdp.eval('document.getElementById("scenarioSwitchBtn").click()');
    await sleep(350);
    const picker = await cdp.eval(`(() => {
      const btns = Array.from(document.querySelectorAll('.modal .option-btn'));
      const save = Array.from(document.querySelectorAll('.modal-actions button'))
        .find(b => b.textContent.indexOf('换成这个') !== -1);
      return {
        n: btns.length,
        labels: btns.map(b => b.querySelector('.o-label').textContent.trim()).join(' | '),
        markedCurrent: btns.filter(b => b.querySelector('.o-hint').textContent.indexOf('（当前）') !== -1).length,
        saveDisabled: save ? save.disabled : null,
      };
    })()`);
    check('换场景弹窗列出了全部场景，并标出当前是哪一个',
      picker.n >= 8 && picker.markedCurrent === 1, picker.n + ' 个：' + picker.labels);
    check('还没选之前「换成这个」是禁用的（换场景会丢答案，不该点一下就执行）',
      picker.saveDisabled === true, 'disabled=' + picker.saveDisabled);

    await cdp.eval(`(() => {
      Array.from(document.querySelectorAll('.modal .option-btn'))
        .find(b => b.dataset.sc === 'image').click();
      return true;
    })()`);
    await sleep(200);
    const afterPick = await cdp.eval(`(() => {
      const save = Array.from(document.querySelectorAll('.modal-actions button'))
        .find(b => b.textContent.indexOf('换成这个') !== -1);
      return {
        disabled: save.disabled,
        selected: document.querySelectorAll('.modal .option-btn.selected').length,
      };
    })()`);
    check('选了新场景之后确认按钮才可点，而且只选中一个',
      afterPick.disabled === false && afterPick.selected === 1,
      'disabled=' + afterPick.disabled + ' 选中=' + afterPick.selected);

    await cdp.eval(`(() => {
      Array.from(document.querySelectorAll('.modal-actions button'))
        .find(b => b.textContent.indexOf('换成这个') !== -1).click();
      return true;
    })()`);
    await sleep(700);
    const swAfter = await cdp.eval(`(() => ({
      qids: Array.from(document.querySelectorAll('.q-block')).map(x => x.dataset.qid),
      badge: document.getElementById('roundBadge').textContent.trim(),
      label: document.getElementById('scenarioSwitchBtn').textContent.trim(),
      modalGone: document.querySelectorAll('.modal').length === 0,
    }))()`);
    check('换完之后整轮重来：题目全换成图片链路的，轮次回到第 1 轮',
      swAfter.qids.length > 0
      && swAfter.qids.every((q) => q === 'intent' || q.indexOf('img.') === 0)
      && swAfter.badge === '第 1 轮',
      swAfter.badge + ' / ' + swAfter.qids.join(','));
    check('按钮上的场景名跟着变了，弹窗也关掉了',
      swAfter.label.indexOf('图片生成') !== -1 && swAfter.modalGone, swAfter.label);
    await cdp.shot(path.join(SHOT_DIR, '13e-scenario-switch.png'));

    // 「换完场景 → 回输入页 → 再点开始拆解」不能又按原话重新识别一遍，
    // 把用户明确改过的场景覆盖回去。这个坑是这次改动**自己引入的**：
    // 输入页的场景网格点一下会同时置 `scenarioAuto = false`，中途换场景那条路
    // 一开始忘了置，于是用户改过的选择在「开始拆解」时被静默丢掉 ——
    // 而原话（短视频…）恰好会被识别成视频，正好是「改了个寂寞」。
    await cdp.eval('document.getElementById("backBtn").click()');   // 快照已清空 → 回输入页
    await sleep(500);
    const backState = await cdp.eval(`(() => {
      const btn = Array.from(document.querySelectorAll('.scenario-btn'))
        .find(b => b.classList.contains('active'));
      return {
        onInput: !document.getElementById('stageInput').classList.contains('hidden'),
        active: btn ? btn.dataset.id : '(没高亮任何场景)',
        text: document.getElementById('rawPrompt').value.trim(),
      };
    })()`);
    check('回输入页时，网格高亮的是用户刚换的那个场景',
      backState.onInput && backState.active === 'image', '高亮=' + backState.active);
    check('（前置）原话还在（换场景不该把用户写的东西弄丢）',
      backState.text.indexOf('短视频') !== -1, backState.text);

    await cdp.eval('document.getElementById("startBtn").click()');
    await sleep(700);
    const reStart = await cdp.eval(`(() => ({
      qids: Array.from(document.querySelectorAll('.q-block')).map(x => x.dataset.qid),
      label: document.getElementById('scenarioSwitchBtn').textContent.trim(),
    }))()`);
    check('再点「开始拆解」时不会按原话重新识别、把用户的选择覆盖回去',
      reStart.qids.length > 0
      && reStart.qids.every((q) => q === 'intent' || q.indexOf('img.') === 0)
      && reStart.label.indexOf('图片生成') !== -1,
      reStart.qids.join(',') + ' / ' + reStart.label);

    /* ---------------- 7.5 视频分镜链路（多镜头 → 分镜表） ---------------- */
    console.log('\n[7.5] 视频分镜链路');
    await cdp.eval('document.getElementById("newBtn").click()');
    await sleep(300);
    await cdp.eval('document.querySelector(\'.sample-row [data-sample="video"]\').click()');
    await sleep(500);
    await cdp.eval('document.getElementById("startBtn").click()');
    await sleep(400);

    // 故意构造一个「4 个景别 + 4 种运镜 + 15 秒以上 + 情绪配乐」的组合，
    // 逼引擎走分镜分支 —— 上面的视频用例每题只点第一个选项，永远碰不到这条路径。
    let sbRound = 0;
    while (sbRound < 15) {
      const sbDone = await cdp.eval('!document.getElementById("stageResult").classList.contains("hidden")');
      if (sbDone) break;
      const sbBlocks = await cdp.eval('document.querySelectorAll(".q-block").length');
      if (!sbBlocks) break;
      sbRound += 1;
      await cdp.eval(`(() => {
        const want = {
          'vid.shot': ['特写', '中景', '近景', '全景'],
          'vid.focus': ['面部表情'],
          'vid.move': ['缓慢推近', '环绕运镜', '横向移动', '缓缓拉远'],
          'vid.arc': ['由静到动'],
          'vid.duration': ['15 秒以上'],
          'vid.detail': ['反光与倒影'],
          'vid.lighting': ['夜景霓虹'],
          'vid.audio': ['情绪配乐'],
          'vid.bgm': ['低沉大提琴'],
        };
        document.querySelectorAll('.q-block').forEach(b => {
          const opts = Array.from(b.querySelectorAll('.option-btn'))
            .filter(x => !x.classList.contains('is-skip') && !x.classList.contains('is-custom'));
          const labels = want[b.dataset.qid];
          const targets = labels
            ? labels.map(lb => opts.find(x => x.textContent.indexOf(lb) !== -1)).filter(Boolean)
            : opts.slice(0, 1);
          targets.forEach(o => { if (!o.classList.contains('selected')) o.click(); });
        });
        return true;
      })()`);
      await cdp.eval('document.getElementById("nextBtn").click()');
      await sleep(260);
    }

    await sleep(600);
    // 分镜方案会被渲染成真正的 HTML 表格（不是一坨竖线），所以这里直接验 DOM 结构 ——
    // 比在 textContent 里找「| 镜头 1 |」更能说明「用户真的看到了一张表」。
    const sbDom = await cdp.eval(`(() => {
      const box = document.getElementById('finalPrompt');
      ${TABLE_AFTER_HELPER}
      // 只取「分镜表」那一张。成品里还有一张「首尾帧参考」，行形状一模一样，
      // 全量扫会把两张表的行混在一起数（镜头数直接翻倍）。
      const tb = tableAfter('分镜表');
      const rows = tb ? Array.from(tb.querySelectorAll('tbody tr')) : [];
      const heads = tb ? Array.from(tb.querySelectorAll('thead th')) : [];
      const firstCells = rows.length
        ? Array.from(rows[0].querySelectorAll('td')).map(td => td.textContent.trim())
        : [];
      return {
        rich: box.classList.contains('is-rich'),
        hasBoard: !!tb,
        tables: box.querySelectorAll('.prompt-table').length,
        rows: rows.length,
        heads: heads.map(th => th.textContent.trim()),
        firstCells,
        h2: Array.from(box.querySelectorAll('.p-h2')).map(h => h.textContent.trim()),
        keys: Array.from(box.querySelectorAll('.p-key')).map(k => k.textContent.trim()),
        // 「氛围」是逐段描述里的普通行，渲染成 .p-line
        moods: Array.from(box.querySelectorAll('.p-line'))
          .map(p => p.textContent.trim()).filter(t => t.indexOf('氛围：') === 0),
        // 「镜头内容」是分镜表每行的最后一格
        contentCells: rows.map(tr => {
          const tds = tr.querySelectorAll('td');
          return tds.length ? tds[tds.length - 1].textContent.trim() : '';
        }),
        text: box.textContent,
        timecode: /00:00 - \\d\\d:\\d\\d/.test(box.textContent),
      };
    })()`);

    check('多镜头视频生成了分镜表', sbDom.hasBoard, '分镜表在不在=' + sbDom.hasBoard);
    check('分镜表渲染成了真正的表格（不是一堆竖线）',
      sbDom.rich && sbDom.rows >= 2 && sbDom.heads.length === 5,
      sbDom.rows + ' 行 / 表头 ' + sbDom.heads.join('·'));
    check('表头是 镜头编号 / 景别 / 运镜方式 / 时长 / 镜头内容',
      sbDom.heads.join(',') === '镜头编号,景别,运镜方式,时长,镜头内容', sbDom.heads.join(' / '));
    check('第一行带景别 / 运镜 / 秒数',
      sbDom.firstCells.length === 5
      && ['特写', '缓慢推近', '秒'].every((k) => sbDom.firstCells.join(' ').indexOf(k) !== -1),
      sbDom.firstCells.join(' | '));
    // 「镜头内容」是给生成工具看的，写成「特写是什么」等于没说拍什么
    check('「镜头内容」列写的是取景指令，不是景别定义',
      sbDom.contentCells.length === 4
      && sbDom.contentCells.every((c) => c && !/是叙事的常用景别|让观众无法移开视线|微距呈现/.test(c)),
      sbDom.contentCells.join(' / '));
    check('每镜氛围各不相同（情绪真的在推进）',
      sbDom.moods.length === 4 && new Set(sbDom.moods).size === 4,
      sbDom.moods.map((m) => m.replace('氛围：', '').split('；')[0]).join(' → '));
    check('头部有情绪走向与画面细节',
      sbDom.keys.indexOf('情绪走向') !== -1 && sbDom.keys.indexOf('画面细节') !== -1,
      sbDom.keys.join(' / '));
    check('有逐段画面描述与时间码',
      sbDom.h2.indexOf('逐段画面描述') !== -1 && sbDom.timecode);
    check('有背景音乐建议', sbDom.h2.indexOf('背景音乐建议') !== -1);
    check('头部信息渲染成了「标签 + 内容」两列',
      sbDom.keys.indexOf('核心主题') !== -1 && sbDom.keys.indexOf('画面规格') !== -1,
      sbDom.keys.join(' / '));
    // 图片 / 视频的第一题（intent）dim 是 task，曾经被组装逻辑整块跳过，
    // 七个用途选项答了等于没答。这条守的就是「第一题真的进了成品」。
    check('第一题选的「用途」进了成品头部',
      sbDom.keys.indexOf('用途') !== -1,
      sbDom.keys.join(' / '));
    check('分镜里用上了用户选的景别',
      sbDom.text.indexOf('特写') !== -1 && sbDom.text.indexOf('全景') !== -1);
    check('每镜标了作用，且随位置变化（开场 → 收尾）',
      sbDom.text.indexOf('作用：开场') !== -1 && sbDom.text.indexOf('作用：收尾') !== -1,
      (sbDom.text.match(/作用：(开场|推进|收尾)/g) || []).join(' / '));

    // 结果区必须让用户「看得见」分镜方案：标题点名 + 溢出时有展开入口。
    // 结果框固定 460px，而分镜方案 1300+ 字符 —— 用户翻到头部那几行就以为到底了，
    // 只会说「没看见分镜表」。这两条断言守的就是这件事。
    const sbReveal = await cdp.eval(`(() => {
      const btn = document.getElementById('promptExpand');
      const box = document.getElementById('finalPrompt');
      return {
        title: document.getElementById('finalTitle').textContent.trim(),
        hasMore: document.getElementById('finalWrap').classList.contains('has-more'),
        expandHidden: btn.classList.contains('hidden'),
        label: btn.textContent.trim(),
        hiddenPx: box.scrollHeight - box.clientHeight,
      };
    })()`);
    check('标题点名「分镜方案」',
      sbReveal.title.indexOf('分镜方案') !== -1, sbReveal.title);

    // 中间栏自己是滚动容器，上方还压着标题 + 7 张评分卡。
    // 生成分镜方案时不主动滚一下，用户看到的只有头几行 ——
    // 这就是「没看见分镜表」的直接原因，所以必须验「真的滚到了、表格真的在视野里」。
    const sbScroll = await cdp.eval(`(() => {
      const sc = document.getElementById('mainScroll');
      const box = document.getElementById('finalPrompt');
      ${TABLE_AFTER_HELPER}
      // 要验的是「用户真的看见分镜表了」，所以取的是分镜表那张，
      // 不是随便哪一张表（「首尾帧参考」也在下面，位置更靠下）。
      const tbl = tableAfter('分镜表');
      const sr = sc.getBoundingClientRect();
      const br = box.getBoundingClientRect();
      const tr = tbl ? tbl.getBoundingClientRect() : null;
      return {
        scrollTop: Math.round(sc.scrollTop),
        boxTopRel: Math.round(br.top - sr.top),
        scrollerH: Math.round(sr.height),
        hasTable: !!tbl,
        tableInView: tr ? (tr.top < sr.bottom && tr.bottom > sr.top) : false,
      };
    })()`);
    check('生成了分镜方案时自动滚到成品（表格落在可视区内）',
      sbScroll.hasTable && sbScroll.scrollTop > 0 && sbScroll.tableInView
      && sbScroll.boxTopRel >= 0 && sbScroll.boxTopRel < 200,
      'scrollTop=' + sbScroll.scrollTop + ' 成品距顶=' + sbScroll.boxTopRel
        + 'px 可视高=' + sbScroll.scrollerH + 'px');
    check('内容溢出时有展开入口，并说清下面还有哪几节',
      !sbReveal.expandHidden && sbReveal.hasMore && sbReveal.hiddenPx > 0
      && sbReveal.label.indexOf('分镜表') !== -1,
      sbReveal.label + '（藏了 ' + sbReveal.hiddenPx + 'px）');

    const sbOpened = await cdp.eval(`(() => {
      const btn = document.getElementById('promptExpand');
      const box = document.getElementById('finalPrompt');
      btn.click();
      const r = {
        open: box.classList.contains('is-open'),
        hiddenPx: box.scrollHeight - box.clientHeight,
        label: btn.textContent.trim(),
      };
      btn.click();   // 收起，别影响后面的截图
      return r;
    })()`);
    check('点展开后内容全部可见，按钮变成「收起」',
      sbOpened.open && sbOpened.hiddenPx === 0 && sbOpened.label.indexOf('收起') !== -1,
      sbOpened.label);

    await cdp.shot(path.join(SHOT_DIR, '13b-video-storyboard.png'));
    // 分镜表在折叠区下方，滚下去再拍一张 —— 留个「表格真的长这样」的视觉证据
    await cdp.eval('document.getElementById("finalPrompt").scrollTop = 190');
    await sleep(200);
    await cdp.shot(path.join(SHOT_DIR, '13c-video-storyboard-table.png'));
    await cdp.eval('document.getElementById("finalPrompt").scrollTop = 0');

    // 显示层渲染成表格之后，导出出去的必须仍是干净的 Markdown 原文。
    // 这是本次改动最容易被后来的人破坏的地方（比如顺手把复制改成读 DOM），所以要真验。
    // 剪贴板在 headless 下读不稳定，改成拦下载：Blob 里的内容就是用户真正拿到的东西，
    // 而「复制」和「下载」读的是同一个 state.result.promptText。
    const exported = await cdp.eval(`(async () => {
      const origCreate = URL.createObjectURL;
      const origClick = HTMLAnchorElement.prototype.click;
      let blob = null;
      URL.createObjectURL = function (b) { blob = b; return origCreate.call(URL, b); };
      HTMLAnchorElement.prototype.click = function () {};   // 别真的触发下载
      try {
        document.getElementById('downloadBtn').click();
      } finally {
        URL.createObjectURL = origCreate;
        HTMLAnchorElement.prototype.click = origClick;
      }
      return blob ? await blob.text() : '';
    })()`);
    check('导出拿到的是 Markdown 原文，不是渲染后的表格',
      exported.indexOf('## 分镜表') !== -1 && exported.indexOf('| 镜头 1 |') !== -1,
      exported ? '长度=' + exported.length : '（没抓到导出内容）');

    /* ---------------- 7.6 追问链断掉之后，旧答案必须失效 ---------------- */
    // 真实用户路径：先答了「情绪配乐 → 配乐类型」，再回头把「声音」改成
    // 「不需要声音」。「改上一处」不会清空追问链上的旧答案（清空了用户就
    // 没法改回来），所以引擎必须在装配时把它判成不生效 —— 否则成品里会出现
    // 「说了不要声音，却写着低沉大提琴」这种自相矛盾。
    console.log('\n[7.6] 追问链断掉之后');

    const readReviseList = () => cdp.eval(`(() => {
      return Array.from(document.querySelectorAll('.modal-body .option-btn')).map(b => {
        const lab = b.querySelector('.o-label');
        return {
          title: lab ? lab.textContent.trim() : '',
          inactive: !!b.querySelector('.tag-inactive'),
        };
      });
    })()`);

    // 先展开成品。改完之后必须回到折叠态 —— syncPromptOverflow 会清掉 is-open，
    // 所以这一步同时证明「改完选择真的重新量过溢出」。
    await cdp.eval('document.getElementById("promptExpand").click()');
    await sleep(250);
    check('改之前先把成品展开（后面的断言要有意义，这一步必须成立）',
      await cdp.eval('document.getElementById("finalPrompt").classList.contains("is-open")'));

    await cdp.eval('document.getElementById("reviseBtn").click()');
    await sleep(450);
    const listBefore = await readReviseList();
    check('改上一处列出了「配乐类型」这一行',
      listBefore.some((r) => r.title.indexOf('配乐类型') !== -1),
      listBefore.map((r) => r.title).join(' / '));
    check('追问链还活着时，没有任何一行被标成不生效',
      listBefore.length > 0 && listBefore.every((r) => !r.inactive));

    // 进入「声音」那一行，改成「不需要声音」
    await cdp.eval(`(() => {
      const row = Array.from(document.querySelectorAll('.modal-body .option-btn'))
        .find(b => b.querySelector('.o-label').textContent.trim() === '声音');
      row.click();
      return true;
    })()`);
    await sleep(320);
    await cdp.eval(`(() => {
      const opt = Array.from(document.querySelectorAll('.modal-body .option-btn'))
        .find(b => b.textContent.indexOf('不需要声音') !== -1);
      opt.click();
      return true;
    })()`);
    await sleep(220);
    await cdp.eval(`(() => {
      const save = Array.from(document.querySelectorAll('.modal-actions button'))
        .find(b => b.textContent.indexOf('保存修改') !== -1);
      save.click();
      return true;
    })()`);
    await sleep(800);

    const afterStale = await cdp.eval(`(() => {
      const box = document.getElementById('finalPrompt');
      return {
        text: box.textContent,
        stillOpen: box.classList.contains('is-open'),
        hasMore: document.getElementById('finalWrap').classList.contains('has-more'),
        hiddenPx: box.scrollHeight - box.clientHeight,
      };
    })()`);
    check('声音改成「不需要声音」后，成品里的配乐整块消失',
      afterStale.text.indexOf('大提琴') === -1 && afterStale.text.indexOf('背景音乐建议') === -1,
      afterStale.text.indexOf('大提琴') === -1 ? '大提琴已消失' : '还留着大提琴');
    check('「不需要音频」这句自己进了成品',
      afterStale.text.indexOf('不需要音频') !== -1);
    check('改完选择后回到折叠态（说明溢出状态被重新量过）',
      !afterStale.stillOpen);
    check('改完选择后，展开入口的有无和实际溢出对得上',
      afterStale.hasMore === (afterStale.hiddenPx > 8),
      'has-more=' + afterStale.hasMore + ' 溢出=' + afterStale.hiddenPx + 'px');

    await cdp.eval('document.getElementById("reviseBtn").click()');
    await sleep(450);
    const listAfter = await readReviseList();
    const bgmRow = listAfter.filter((r) => r.title.indexOf('配乐类型') !== -1)[0] || {};
    const audioRow = listAfter.filter((r) => r.title === '声音')[0] || {};
    check('「配乐类型」那一行被标成「当前未生效」', !!bgmRow.inactive,
      JSON.stringify(bgmRow));
    check('「声音」那一行本身仍然生效', !audioRow.inactive, JSON.stringify(audioRow));
    check('失效标记只出现在该出现的地方',
      await cdp.eval('document.querySelectorAll(".tag-inactive").length') === 1);
    await cdp.shot(path.join(SHOT_DIR, '13d-stale-answer.png'));

    // 再把声音改回「情绪配乐」。列表里写着「把上一处改回原来那条，这一项会自动恢复」——
    // 这句话必须是真的：配乐类型不用重新答一遍，就该自己回来。
    await cdp.eval(`(() => {
      const row = Array.from(document.querySelectorAll('.modal-body .option-btn'))
        .find(b => b.querySelector('.o-label').textContent.trim() === '声音');
      row.click();
      return true;
    })()`);
    await sleep(320);
    await cdp.eval(`(() => {
      const opt = Array.from(document.querySelectorAll('.modal-body .option-btn'))
        .find(b => b.textContent.indexOf('情绪配乐') !== -1);
      opt.click();
      return true;
    })()`);
    await sleep(220);
    await cdp.eval(`(() => {
      const save = Array.from(document.querySelectorAll('.modal-actions button'))
        .find(b => b.textContent.indexOf('保存修改') !== -1);
      save.click();
      return true;
    })()`);
    await sleep(800);

    const restored = await cdp.eval('document.getElementById("finalPrompt").textContent');
    check('把声音改回「情绪配乐」，配乐不用重答就自己回来了',
      restored.indexOf('大提琴') !== -1 && restored.indexOf('背景音乐建议') !== -1,
      restored.indexOf('大提琴') !== -1 ? '配乐已恢复' : '配乐没回来');

    await cdp.eval('document.getElementById("reviseBtn").click()');
    await sleep(450);
    const listRestored = await readReviseList();
    check('恢复之后「配乐类型」的失效标记也撤掉了',
      listRestored.length > 0 && listRestored.every((r) => !r.inactive),
      listRestored.filter((r) => r.inactive).map((r) => r.title).join(' / ') || '（没有失效行）');
    await cdp.eval('document.getElementById("modalHost").innerHTML = ""');

    /* ---------------- 7.7 编辑分镜表 ---------------- */
    console.log('\n[7.7] 编辑分镜表（顺序 / 时长 / 内容）');

    // 结果区里的分镜表 —— 用户改完之后要拿它做对照。
    // 注意：富文本渲染会把 `### ` 和 `【】` 剥掉（见 renderRichPrompt），
    // 所以这里只能按「剥掉之后的样子」去匹配。
    //
    // **只取「分镜表」那一张表**：成品里还有一张「首尾帧参考」，
    // 行形状一模一样（都以「镜头 N」开头）。全量扫 `.prompt-table tbody tr`
    // 会把两张表的行混在一起数 —— 镜头数直接翻倍，而且报错方向完全指错地方。
    // 定位统一走 TABLE_AFTER_HELPER（按小节标题找，不按下标猜）。
    const readTable = () => cdp.eval(`(() => {
      const box = document.getElementById('finalPrompt');
      ${TABLE_AFTER_HELPER}
      const tb = tableAfter('分镜表');
      const rows = tb ? Array.from(tb.querySelectorAll('tbody tr')).map(tr => {
        const t = Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim());
        return { shot: t[1], move: t[2], sec: Number((t[3] || '').replace(' 秒', '')), cell: t[4] };
      }) : [];
      const m = box.textContent.match(/共 (\\d+) 秒，(\\d+) 个镜头/);
      return {
        rows,
        total: m ? Number(m[1]) : -1,
        codes: box.textContent.match(/镜头 \\d+（\\d\\d:\\d\\d - \\d\\d:\\d\\d）/g) || [],
        text: box.textContent,
      };
    })()`);

    // 编辑器里的每一张卡
    const readCards = () => cdp.eval(`(() => {
      return Array.from(document.querySelectorAll('.board-editor .board-card')).map(c => {
        const sel = c.querySelector('select[data-f="shotId"]');
        return {
          shotId: sel.value,
          shotLabel: sel.selectedOptions[0].textContent.trim(),
          moveId: c.querySelector('select[data-f="moveId"]').value,
          moveLabel: c.querySelector('select[data-f="moveId"]').selectedOptions[0].textContent.trim(),
          sec: Number(c.querySelector('input[data-f="seconds"]').value),
          cell: c.querySelector('textarea[data-f="cell"]').value,
          time: c.querySelector('.bc-time').textContent.trim(),
          hasFocusBox: !!c.querySelector('input[data-f="focus"]'),
        };
      });
    })()`);

    const readBoardFoot = () => cdp.eval(`(() => {
      const f = document.querySelector('.board-editor .board-foot');
      return { text: f ? f.textContent.trim() : '' };
    })()`);

    // 成品里配乐「情绪走向」那一段。textContent 没有换行，
    // 所以按「从『情绪走向：前 』切到句号」来取，别用行首正则。
    // （正文里还有一行『情绪走向由静到动：…』，但那句里没有『情绪走向：前 』。）
    const readBgm = () => cdp.eval(`(() => {
      const t = document.getElementById('finalPrompt').textContent;
      const i = t.indexOf('情绪走向：前 ');
      if (i === -1) return null;
      const seg = t.slice(i, t.indexOf('。', i) + 1);
      const first = /前 (\\d+) 秒/.exec(seg);
      const last = /结尾 (\\d+) 秒/.exec(seg);
      const mid = /中段（(\\d+):(\\d+) - (\\d+):(\\d+)）/.exec(seg);
      const toSec = (m, a) => Number(m[a]) * 60 + Number(m[a + 1]);
      return {
        seg,
        firstSec: first ? Number(first[1]) : null,
        midStart: mid ? toSec(mid, 1) : null,
        midEnd: mid ? toSec(mid, 3) : null,
        lastSec: last ? Number(last[1]) : null,
      };
    })()`);

    /**
     * 配乐三段（前 / 中 / 结尾）必须首尾相接、互不重叠。
     * 曾经中段一路写到片尾，于是和紧接着的「结尾 N 秒」区间重叠；
     * 两镜时更是会写出「中段（00:05 - 00:05）」这种零长度区间。
     */
    function bgmProblems(bgm, table, n) {
      if (!bgm) return ['输出里没有配乐「情绪走向」那一段'];
      const bad = [];
      if (bgm.firstSec !== table.rows[0].sec) {
        bad.push('前段 ' + bgm.firstSec + ' 秒 ≠ 第 1 镜 ' + table.rows[0].sec + ' 秒');
      }
      if (bgm.lastSec !== table.rows[n - 1].sec) {
        bad.push('结尾 ' + bgm.lastSec + ' 秒 ≠ 最后一镜 ' + table.rows[n - 1].sec + ' 秒');
      }
      if (n > 2) {
        if (bgm.midStart !== bgm.firstSec) {
          bad.push('中段起点 ' + bgm.midStart + ' ≠ 第 1 镜结束 ' + bgm.firstSec);
        }
        if (bgm.midEnd !== table.total - bgm.lastSec) {
          bad.push('中段终点 ' + bgm.midEnd + ' ≠ 最后一镜起点 '
            + (table.total - bgm.lastSec) + '（写到片尾就和结尾重叠了）');
        }
        if (!(bgm.midEnd > bgm.midStart)) {
          bad.push('中段是零长度区间 ' + bgm.midStart + '→' + bgm.midEnd);
        }
      } else if (bgm.midStart !== null) {
        bad.push('两镜时不该有中段');
      }
      return bad;
    }

    const tableBefore = await readTable();
    check('有分镜表时，「编辑分镜表」按钮出现',
      !(await cdp.eval('document.getElementById("editBoardBtn").classList.contains("hidden")')));
    check('（前置）结果区确实有一张分镜表', tableBefore.rows.length >= 2, '行数=' + tableBefore.rows.length);

    await cdp.eval('document.getElementById("editBoardBtn").click()');
    await sleep(400);
    check('点开后出现分镜表编辑器', await cdp.eval('!!document.querySelector(".board-editor")'));

    const cards0 = await readCards();
    check('每镜一张卡，卡数和分镜表行数一致',
      cards0.length === tableBefore.rows.length,
      '卡=' + cards0.length + ' 表=' + tableBefore.rows.length);
    check('卡片顺序与成品里的分镜表逐行一致',
      cards0.map((c) => c.shotLabel).join(',') === tableBefore.rows.map((r) => r.shot).join(','),
      cards0.map((c) => c.shotLabel).join(' / '));
    check('每张卡都带景别 / 运镜 / 时长 / 内容',
      cards0.every((c) => c.shotLabel && c.moveLabel && c.sec > 0 && c.cell),
      JSON.stringify(cards0[0]));

    // 下拉里不许有两项**同名**。
    // 「运镜」的占位项曾经也叫「固定机位」，和真实的 `vmv.static` 撞在一起 ——
    // 两项长得一模一样，用户分不清自己选的是哪一个（功能上等价，但看不出来）。
    // 这是一条通用规则：任何 select 出现重复标签，都是「看不清自己在选什么」。
    const DUP_PROBE = `(() => {
      const out = [];
      document.querySelectorAll('.board-editor .board-card select').forEach(s => {
        const seen = {};
        Array.from(s.options).forEach(o => {
          const t = o.textContent.trim();
          if (seen[t]) out.push((s.dataset.f || '?') + '：「' + t + '」出现两次');
          seen[t] = true;
        });
      });
      return out;
    })()`;
    const dupLabels = await cdp.eval(DUP_PROBE);
    check('编辑器里每个下拉都没有重名选项（用户能分清自己选的是哪个）',
      dupLabels.length === 0, dupLabels.join(' / '));
    // 阳性对照：同一个探测式，塞一个重名进去必须报出来。
    // 少了这一条，上面那句在探测式写坏时会静默通过（空数组永远「没有重名」）。
    const dupTwin = await cdp.eval(`(() => {
      const sel = document.querySelector('.board-editor .board-card select[data-f="moveId"]');
      const o = document.createElement('option');
      o.textContent = Array.from(sel.options)[0].textContent;
      sel.appendChild(o);
      const found = ${DUP_PROBE};
      sel.removeChild(o);
      return found;
    })()`);
    check('（阳性对照）塞一个重名选项进去，上面那个探测式确实会报出来',
      dupTwin.length === 1, '探测结果=' + JSON.stringify(dupTwin));
    check('时长输入框的上下限来自引擎（1–60）',
      await cdp.eval(`(() => {
        const i = document.querySelector('.board-card input[data-f="seconds"]');
        return i.min === '1' && i.max === '60';
      })()`));
    check('近处镜头显示「细节焦点」开关，全景不显示',
      cards0.filter((c) => c.hasFocusBox).every((c) => ['特写', '近景'].indexOf(c.shotLabel) !== -1)
      && cards0.filter((c) => ['特写', '近景'].indexOf(c.shotLabel) !== -1).length
        === cards0.filter((c) => c.hasFocusBox).length,
      cards0.map((c) => c.shotLabel + '=' + c.hasFocusBox).join(' '));
    check('编辑器里写明了「改哪几道题会让这份调整作废」',
      await cdp.eval(`document.querySelector('.board-note').textContent.indexOf('景别') !== -1`));
    // 作废之后的结果分两种，说明必须说准是哪一种。
    // 这一节是普通的多镜头组合（有自动版），所以应当是「回到自动排的版本」。
    const noteAuto = await cdp.eval(`document.querySelector('.board-note').textContent`);
    check('（有自动版时）说明写的是「回到自动排的版本」',
      noteAuto.indexOf('回到自动排的版本') !== -1 && noteAuto.indexOf('作废、成品退回') === -1,
      noteAuto.slice(-90));
    const foot0 = await readBoardFoot();
    check('底部汇总的总时长和分镜表一致',
      foot0.text.indexOf('共 ' + tableBefore.total + ' 秒') !== -1, foot0.text);
    await cdp.shot(path.join(SHOT_DIR, '14a-board-editor.png'));

    // ---- 换顺序：把第 2 张卡往上挪 ----
    await cdp.eval(`document.querySelectorAll('.board-card')[1].querySelector('[data-act="up"]').click()`);
    await sleep(220);
    const cards1 = await readCards();
    check('点 ↑ 之后第 1、2 镜互换了位置',
      cards1[0].shotLabel === cards0[1].shotLabel && cards1[1].shotLabel === cards0[0].shotLabel,
      cards1.map((c) => c.shotLabel).join(' → '));

    // ---- 改时长：第 1 镜改成 8 秒 ----
    const NEW_SEC = 8;
    await cdp.eval(`(() => {
      const i = document.querySelectorAll('.board-card')[0].querySelector('input[data-f="seconds"]');
      i.value = '${NEW_SEC}';
      i.dispatchEvent(new Event('change'));
      return true;
    })()`);
    await sleep(220);
    const cards2 = await readCards();
    const expectTotal = cards1.reduce((a, c) => a + c.sec, 0) - cards1[0].sec + NEW_SEC;
    const foot2 = await readBoardFoot();
    check('改完时长，卡片上的时间码跟着走',
      cards2[0].time.indexOf('00:00 –') === 0 && cards2[0].time.indexOf('00:08') !== -1,
      cards2[0].time);
    check('改完时长，底部总时长立刻重算',
      foot2.text.indexOf('共 ' + expectTotal + ' 秒') !== -1, foot2.text);

    // ---- 越界：填 999，应当被夹到 60 而不是报错或照单全收 ----
    await cdp.eval(`(() => {
      const i = document.querySelectorAll('.board-card')[0].querySelector('input[data-f="seconds"]');
      i.value = '999';
      i.dispatchEvent(new Event('change'));
      return true;
    })()`);
    await sleep(220);
    check('填 999 秒被夹到 60 秒，输入框里显示的就是生效值',
      (await readCards())[0].sec === 60,
      String((await readCards())[0].sec));

    // ---- 相邻两镜同景别：要给提示，但不能拦着 ----
    const dupTarget = cards1.filter((c) => c.shotId !== cards1[0].shotId)[0];
    await cdp.eval(`(() => {
      const s = document.querySelectorAll('.board-card')[1].querySelector('select[data-f="shotId"]');
      s.value = '${cards1[0].shotId}';
      s.dispatchEvent(new Event('change'));
      return true;
    })()`);
    await sleep(250);
    const dupWarn = await cdp.eval(`(() => {
      const cards = Array.from(document.querySelectorAll('.board-card'));
      const w = cards[1].querySelector('.board-warn');
      return {
        inSecondCard: !!w,
        text: w ? w.textContent.trim() : '',
        anywhere: document.querySelectorAll('.board-warn').length,
      };
    })()`);
    check('相邻两镜同景别时给出提示，并点名是哪一镜',
      dupWarn.text.indexOf('镜头 1') !== -1, dupWarn.text || '（没有提示）');
    check('提示挂在出问题的那张卡上（不是藏在列表最底下看不见）',
      dupWarn.inSecondCard, '全页提示数=' + dupWarn.anywhere);
    check('提示只是提示：改动照样留着，没有被拦掉',
      (await readCards())[1].shotId === cards1[0].shotId);
    await cdp.shot(path.join(SHOT_DIR, '14b-board-duplicate.png'));

    // 换回一个不同的景别，提示应当消失
    await cdp.eval(`(() => {
      const s = document.querySelectorAll('.board-card')[1].querySelector('select[data-f="shotId"]');
      s.value = '${dupTarget.shotId}';
      s.dispatchEvent(new Event('change'));
      return true;
    })()`);
    await sleep(250);
    check('换回不同景别之后提示消失',
      await cdp.eval('document.querySelectorAll(".board-warn").length === 0'));

    // ---- 改内容 ----
    const MARKER = 'E2E 手写的镜头内容';
    await cdp.eval(`(() => {
      const t = document.querySelectorAll('.board-card')[0].querySelector('textarea[data-f="cell"]');
      t.value = '${MARKER}';
      t.dispatchEvent(new Event('input'));
      return true;
    })()`);
    await sleep(150);
    check('手写的内容留在输入框里（没有被重绘冲掉）',
      (await readCards())[0].cell === MARKER);

    // ---- 改时长之后不离开输入框，直接点「保存调整」（真实鼠标）----
    // 这条专门盯 mousedown → blur → change → click 的顺序：如果提交时长时整表重画，
    // 「保存调整」按钮会在 mousedown 之后被换成另一个节点，这一下 click 就落空了 ——
    // 用户填了 11 秒却什么都没保存，而界面上一点异常都看不出来。
    await cdp.eval(`(() => {
      const i = document.querySelectorAll('.board-card')[1].querySelector('input[data-f="seconds"]');
      i.focus();
      i.select();
      return true;
    })()`);
    await cdp.send('Input.insertText', { text: '11' });
    await sleep(120);
    const saveXY = await cdp.eval(`(() => {
      const b = Array.from(document.querySelectorAll('.modal-actions button'))
        .find(x => x.textContent.indexOf('保存调整') !== -1);
      const r = b.getBoundingClientRect();
      return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
    })()`);
    await cdp.send('Input.dispatchMouseEvent', {
      type: 'mousePressed', x: saveXY.x, y: saveXY.y, button: 'left', clickCount: 1,
    });
    await cdp.send('Input.dispatchMouseEvent', {
      type: 'mouseReleased', x: saveXY.x, y: saveXY.y, button: 'left', clickCount: 1,
    });
    await sleep(900);
    check('保存后弹窗关闭', await cdp.eval('!document.querySelector(".board-editor")'));

    const tableAfter = await readTable();
    check('分镜表按用户排的顺序渲染（不再是自动顺序）',
      tableAfter.rows.map((r) => r.shot).join(',')
        !== tableBefore.rows.map((r) => r.shot).join(','),
      tableAfter.rows.map((r) => r.shot).join(' → '));
    check('用户填的 60 秒真的进了成品',
      tableAfter.rows[0].sec === 60, '第 1 镜=' + tableAfter.rows[0].sec + ' 秒');
    check('光标还在时长框里就点保存，这一下也存上了（按钮没被重画挤掉）',
      tableAfter.rows[1].sec === 11, '第 2 镜=' + tableAfter.rows[1].sec + ' 秒');
    check('用户手写的镜头内容原样进了成品',
      tableAfter.text.indexOf(MARKER) !== -1);
    const afterSum = tableAfter.rows.reduce((a, r) => a + r.sec, 0);
    check('【时长与结构】按手改后的秒数重算，和表格逐行加起来一致',
      tableAfter.total === afterSum, '头部=' + tableAfter.total + ' 表格=' + afterSum);
    check('时间码跟着新时长重排（首镜仍是 00:00 起）',
      tableAfter.codes.length === tableAfter.rows.length
      && /00:00 - 01:00/.test(tableAfter.codes[0]),
      tableAfter.codes[0]);

    // ---- 再打开一次：手工版本要还在 ----
    await cdp.eval('document.getElementById("editBoardBtn").click()');
    await sleep(400);
    const cardsReopen = await readCards();
    check('重新打开编辑器，手工排的顺序还在（不是又变回自动版）',
      cardsReopen.map((c) => c.shotLabel).join(',') === tableAfter.rows.map((r) => r.shot).join(','),
      cardsReopen.map((c) => c.shotLabel).join(' → '));
    check('重新打开时「恢复自动生成」是可点的（说明引擎认这份手工调整）',
      !(await cdp.eval(`Array.from(document.querySelectorAll('.modal-actions button'))
        .find(b => b.textContent.indexOf('恢复自动生成') !== -1).disabled`)));

    // ---- 恢复自动生成 ----
    await cdp.eval(`Array.from(document.querySelectorAll('.modal-actions button'))
      .find(b => b.textContent.indexOf('恢复自动生成') !== -1).click()`);
    await sleep(900);
    const cardsReset = await readCards();
    check('点「恢复自动生成」后，顺序和时长都回到自动版',
      cardsReset.map((c) => c.shotLabel).join(',') === cards0.map((c) => c.shotLabel).join(',')
      && cardsReset.map((c) => c.sec).join(',') === cards0.map((c) => c.sec).join(','),
      cardsReset.map((c) => c.shotLabel + '/' + c.sec + 's').join(' '));
    const tableReset = await readTable();
    check('结果区也跟着回到自动版（时间码 / 总时长都还原）',
      tableReset.total === tableBefore.total
      && tableReset.text.indexOf(MARKER) === -1,
      '头部=' + tableReset.total);
    check('恢复之后「恢复自动生成」按钮自己灰掉（没什么可恢复的了）',
      await cdp.eval(`Array.from(document.querySelectorAll('.modal-actions button'))
        .find(b => b.textContent.indexOf('恢复自动生成') !== -1).disabled`));

    // ---- 最后再存一份手工版本，用来验持久化 ----
    await cdp.eval(`(() => {
      const c = document.querySelectorAll('.board-card')[3];
      const t = c.querySelector('textarea[data-f="cell"]');
      t.value = '${MARKER}';
      t.dispatchEvent(new Event('input'));
      const i = c.querySelector('input[data-f="seconds"]');
      i.value = '7';
      i.dispatchEvent(new Event('change'));
      return true;
    })()`);
    await sleep(250);
    await cdp.eval(`Array.from(document.querySelectorAll('.modal-actions button'))
      .find(b => b.textContent.indexOf('保存调整') !== -1).click()`);
    await sleep(1000);

    // ---- 持久化：直接问服务端要这条记录 ----
    // 注意服务端的响应是 {ok:true, data:{...}}（见 server.js 的 ok()），
    // 而这里用的是裸 fetch，拿不到 api.js 那层解包。
    const persisted = await cdp.eval(`(async () => {
      const list = await (await fetch('/api/projects')).json();
      const newest = (((list || {}).data || {}).projects || [])[0];
      if (!newest) return { none: true, shots: [], prompt: '', raw: JSON.stringify(list).slice(0, 120) };
      const full = await (await fetch('/api/projects/' + newest.id)).json();
      const p = ((full || {}).data || {}).project || {};
      return {
        none: false,
        hasEdit: !!p.storyboardEdit,
        shots: ((p.storyboardEdit || {}).shots || []).map(s => ({ shotId: s.shotId, seconds: s.seconds })),
        prompt: p.finalPrompt || '',
      };
    })()`);
    check('手工调整被存进了服务端（storyboardEdit）',
      !persisted.none && persisted.hasEdit, JSON.stringify(persisted).slice(0, 160));
    check('存下来的每镜时长就是用户填的值',
      persisted.shots.length === tableBefore.rows.length
      && persisted.shots[3].seconds === 7,
      JSON.stringify(persisted.shots));
    check('存下来的最终 Prompt 里带着手写内容',
      persisted.prompt.indexOf(MARKER) !== -1);

    // ---- 加减镜头 ----
    // 镜头数原本由「选了几个景别」独家决定。现在用户能自己加减 ——
    // 这是「每个决定都由用户做」在分镜表上的最后一块。
    await cdp.eval('document.getElementById("editBoardBtn").click()');
    await sleep(450);

    const tools = await cdp.eval(`(() => {
      const cards = Array.from(document.querySelectorAll('.board-card'));
      const first = cards[0];
      return {
        count: cards.length,
        hasAdd: !!first.querySelector('[data-act="add"]'),
        hasDel: !!first.querySelector('[data-act="del"]'),
        delDisabled: first.querySelector('[data-act="del"]').disabled,
        addEnd: !!document.querySelector('[data-act="add-end"]'),
        note: document.querySelector('.board-note').textContent,
      };
    })()`);
    check('每张卡都有「插一镜」和「删掉这一镜」两个按钮', tools.hasAdd && tools.hasDel);
    check('（前置）镜头数在下限之上，所以「删除」可点', tools.count === 4 && !tools.delDisabled,
      '镜数=' + tools.count + ' 删除禁用=' + tools.delDisabled);
    check('列表底部有「＋ 添加一个镜头」', tools.addEnd);
    check('说明里写清了镜头数的可排范围', tools.note.indexOf('2–12') !== -1,
      tools.note.slice(0, 60));

    const beforeAdd = await readCards();
    // 在第 2 张卡（下标 1）上点 ＋ —— 新卡应当落在**它后面**，也就是下标 2。
    // 这里把下标写成常量，别在断言里现算：算错了会「断言通过但测的不是那件事」。
    const ADD_AT = 1;
    const NEW_IDX = ADD_AT + 1;
    await cdp.eval(`document.querySelectorAll('.board-card')[${ADD_AT}].querySelector('[data-act="add"]').click()`);
    await sleep(320);
    const afterAdd = await readCards();
    const usedBefore = beforeAdd.map((c) => c.shotId);
    check('点 ＋ 之后多了一镜，位置就在那一镜后面（前后几镜都不动）',
      afterAdd.length === beforeAdd.length + 1
      && afterAdd.slice(0, NEW_IDX).map((c) => c.shotId).join(',') === usedBefore.slice(0, NEW_IDX).join(',')
      && afterAdd.slice(NEW_IDX + 1).map((c) => c.shotId).join(',') === usedBefore.slice(NEW_IDX).join(','),
      afterAdd.map((c) => c.shotLabel).join(' → '));
    check('新镜头默认挑一个还没用过的景别（不会一插进去就撞「相邻同景别」）',
      usedBefore.indexOf(afterAdd[NEW_IDX].shotId) === -1, afterAdd[NEW_IDX].shotLabel);
    check('新镜头的「镜头内容」不是空的（不能加一个空格子进来）',
      !!afterAdd[NEW_IDX].cell, afterAdd[NEW_IDX].cell);
    check('新镜头沿用「点它的那一镜」的运镜和时长（总时长才好预估）',
      afterAdd[NEW_IDX].moveId === beforeAdd[ADD_AT].moveId
      && afterAdd[NEW_IDX].sec === beforeAdd[ADD_AT].sec,
      '新=' + afterAdd[NEW_IDX].moveLabel + '/' + afterAdd[NEW_IDX].sec + ' 秒'
      + '，被点的那一镜=' + beforeAdd[ADD_AT].moveLabel + '/' + beforeAdd[ADD_AT].sec + ' 秒');
    const foot5 = await readBoardFoot();
    check('加一镜之后，底部汇总的镜头数跟着涨',
      foot5.text.indexOf('5 个镜头') !== -1, foot5.text);
    check('超过时长题估算的 4 个时，给一句说明而不是默默不管',
      await cdp.eval('!!document.querySelector(".board-note-line")'));
    await cdp.shot(path.join(SHOT_DIR, '14d-board-add-del.png'));

    // 删掉刚加的那一镜，顺序要回到原样
    await cdp.eval(`document.querySelectorAll('.board-card')[${NEW_IDX}].querySelector('[data-act="del"]').click()`);
    await sleep(320);
    const afterDel = await readCards();
    check('点 ✕ 之后那一镜没了，剩下的顺序回到原样',
      afterDel.length === beforeAdd.length
      && afterDel.map((c) => c.shotId).join(',') === usedBefore.join(','),
      afterDel.map((c) => c.shotLabel).join(' → '));

    // 末尾再加一镜，保存 —— 验证加出来的镜头真的进了成品
    await cdp.eval(`document.querySelector('[data-act="add-end"]').click()`);
    await sleep(320);
    const afterEnd = await readCards();
    check('「＋ 添加一个镜头」加在最后，前面几镜不动',
      afterEnd.length === 5
      && afterEnd.slice(0, 4).map((c) => c.shotId).join(',') === usedBefore.join(','),
      afterEnd.map((c) => c.shotLabel).join(' → '));

    await cdp.eval(`Array.from(document.querySelectorAll('.modal-actions button'))
      .find(b => b.textContent.indexOf('保存调整') !== -1).click()`);
    await sleep(900);
    const table5 = await readTable();
    check('加出来的第 5 镜进了成品', table5.rows.length === 5, '行数=' + table5.rows.length);
    check('5 镜的总时长 / 时间码仍然自洽',
      table5.total === table5.rows.reduce((a, r) => a + r.sec, 0) && table5.codes.length === 5,
      '头部=' + table5.total + ' 表格=' + table5.rows.reduce((a, r) => a + r.sec, 0));

    // 镜头数变了，配乐「情绪走向」的前 / 中 / 结尾三段区间必须跟着重算。
    // 中段要止于最后一镜的起点 —— 写到片尾就会和紧接着的「结尾 N 秒」重叠。
    const bgm5 = await readBgm();
    const bgm5Bad = bgmProblems(bgm5, table5, 5);
    check('5 镜时配乐三段区间首尾相接、互不重叠', bgm5Bad.length === 0,
      bgm5Bad.length ? bgm5Bad.join('; ') : bgm5.seg);

    // ---- 一路删到下限：不能删到只剩一镜（那就不叫分镜了） ----
    await cdp.eval('document.getElementById("editBoardBtn").click()');
    await sleep(450);
    for (let k = 0; k < 3; k += 1) {
      await cdp.eval(`document.querySelectorAll('.board-card')[0].querySelector('[data-act="del"]').click()`);
      await sleep(280);
    }
    const atMin = await readCards();
    check('可以一路删到只剩 2 镜', atMin.length === 2, '镜数=' + atMin.length);
    check('删到下限之后「删除」自己灰掉，并说清为什么',
      await cdp.eval(`(() => {
        const b = document.querySelectorAll('.board-card')[0].querySelector('[data-act="del"]');
        return b.disabled && b.title.indexOf('只剩一镜就不是分镜') !== -1;
      })()`));
    await cdp.eval(`Array.from(document.querySelectorAll('.modal-actions button'))
      .find(b => b.textContent.indexOf('保存调整') !== -1).click()`);
    await sleep(900);
    const table2 = await readTable();
    check('两镜的分镜表照样渲染得出来（这是加删镜头之后的边界情况）',
      table2.rows.length === 2 && table2.codes.length === 2
      && table2.total === table2.rows.reduce((a, r) => a + r.sec, 0),
      '行数=' + table2.rows.length + ' 头部=' + table2.total);

    // 两镜是加删镜头功能带出来的新边界：中间没有镜头，
    // 配乐那一段必须整段去掉中段，否则会写出零长度的「中段（00:05 - 00:05）」。
    const bgm2 = await readBgm();
    const bgm2Bad = bgmProblems(bgm2, table2, 2);
    check('两镜时配乐不再硬写中段（零长度区间）', bgm2Bad.length === 0,
      bgm2Bad.length ? bgm2Bad.join('; ') : bgm2.seg);

    // 从这里往后，手工版就是这份两镜的表了 —— 后面的断言按这个基准比
    const manualRows = table2.rows.length;
    const manualTotal = table2.total;
    check('（前置）两镜里确实有一镜是手工写的（后面几条断言要有意义）',
      table2.text.indexOf(MARKER) !== -1);

    // ---- 返回按钮回到「改哪一处」列表 ----
    await cdp.eval('document.getElementById("editBoardBtn").click()');
    await sleep(400);
    await cdp.eval(`Array.from(document.querySelectorAll('.modal-actions button'))
      .find(b => b.textContent.indexOf('返回') !== -1).click()`);
    await sleep(400);
    check('点「← 返回」回到「改哪一处」列表，而不是关掉弹窗',
      (await cdp.eval('document.querySelector(".modal h3").textContent')) === '改哪一处？');

    // ---- 改「情绪走向」不该把手工排的分镜表冲掉 ----
    // 这条盯的是签名的范围：只有「答案装进 entry 里」的题才该作废手工调整。
    // 情绪走向是渲染时现取的，把它算进签名就等于「调一下情绪，排好的镜头顺序全没了」。
    // 此刻「改哪一处」列表已经开着，直接进去改。
    await cdp.eval(`(() => {
      const row = Array.from(document.querySelectorAll('.modal-body .option-btn'))
        .find(b => b.querySelector('.o-label').textContent.trim() === '情绪走向');
      row.click();
      return true;
    })()`);
    await sleep(350);
    const arcPicked = await cdp.eval(`(() => {
      const target = Array.from(document.querySelectorAll('.modal-body .option-btn'))
        .filter(b => !b.classList.contains('is-skip') && !b.classList.contains('is-custom'))
        .find(o => o.textContent.indexOf('由紧到松') !== -1);
      if (!target) return '';
      target.click();
      return target.querySelector('.o-label').textContent.trim();
    })()`);
    await sleep(250);
    await cdp.eval(`Array.from(document.querySelectorAll('.modal-actions button'))
      .find(b => b.textContent.indexOf('保存修改') !== -1).click()`);
    await sleep(900);
    const afterArc = await readTable();
    check('（前置）确实把情绪走向改成了「由紧到松」', arcPicked === '由紧到松', arcPicked || '没找到这个选项');
    check('改情绪走向之后，手工排的分镜表没被冲掉（镜数 / 总时长 / 手写内容都在）',
      afterArc.rows.length === manualRows
      && afterArc.total === manualTotal
      && afterArc.text.indexOf(MARKER) !== -1,
      '镜数=' + afterArc.rows.length + '（手工版 ' + manualRows + '）');
    check('新的情绪走向照样进了成品', afterArc.text.indexOf('由紧到松') !== -1);
    check('换完情绪走向，分镜表还是「编辑分镜表」按钮在管（按钮没消失）',
      !(await cdp.eval('document.getElementById("editBoardBtn").classList.contains("hidden")')));

    await cdp.eval('document.getElementById("modalHost").innerHTML = ""');
    await sleep(200);

    /* ---------------- 7.7b 首尾帧 ---------------- */
    //
    // 编号带个 b 是故意的：这一节要接着 [7.7] 那份手工表往下做 ——
    // 它已经是一张 2 镜的手工表，正好用来试「把第 2 镜挪到第 1 位之后 prev 失效」。
    // 挪到 [7.8] 后面就不行了，那里已经换成另一份会话。编号跟着位置走，
    // 不为好看去重排后面所有小节（那会把一堆交叉引用的编号改错）。
    console.log('\n[7.7b] 分镜的首尾帧（文生图 / 从文件导入 / 沿用上一镜）');

    const FRAME_TEXT = '开场那一帧：雨夜街道的霓虹倒影';
    const FRAME_NOTE = '收在伞尖';
    const FRAME_NAME = 'shot1-end.png';
    const FRAME_PATH = '/Users/jack/素材/shot1-end.png';

    // 结果区里「首尾帧参考」那一节。它和分镜表**行形状一模一样**（都以「镜头 N」开头），
    // 所以定位方式是「标题后面紧跟的那张表」，不按下标猜 —— 按下标猜的话，
    // 以后在它前面再插一节，这里会静默地读到别的表上去。
    const readFrames = () => cdp.eval(`(() => {
      const box = document.getElementById('finalPrompt');
      ${TABLE_AFTER_HELPER}
      const tb = tableAfter('首尾帧参考');
      return {
        has: !!tb,
        head: tb ? Array.from(tb.querySelectorAll('thead th')).map(x => x.textContent.trim()) : [],
        rows: tb ? Array.from(tb.querySelectorAll('tbody tr')).map(tr => {
          const t = Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim());
          return { no: t[0], start: t[1], end: t[2] };
        }) : [],
        note: Array.from(box.querySelectorAll('.p-line')).map(x => x.textContent.trim())
          .filter(x => x.indexOf('说明：') === 0).join(' | '),
      };
    })()`);

    /** 每张卡上的首帧 / 尾帧控件 */
    const readFrameCtrls = () => cdp.eval(`(() => {
      return Array.from(document.querySelectorAll('.board-editor .board-card')).map(c => {
        const s = c.querySelector('select[data-f="frame.start"]');
        const e = c.querySelector('select[data-f="frame.end"]');
        const warn = c.querySelector('.bc-frames .board-warn');
        return {
          start: s ? s.value : null,
          startOpts: s ? Array.from(s.options).map(o => o.value) : [],
          end: e ? e.value : null,
          endOpts: e ? Array.from(e.options).map(o => o.value) : [],
          fields: Array.from(c.querySelectorAll('.bc-frame-body [data-f]')).map(x => x.dataset.f),
          warn: warn ? warn.textContent.trim() : '',
        };
      });
    })()`);

    /** 换一个来源（会重画这一张卡） */
    const pickFrame = (cardIdx, which, mode) => cdp.eval(`(() => {
      const s = document.querySelectorAll('.board-card')[${cardIdx}]
        .querySelector('select[data-f="frame.${which}"]');
      if (!s) return false;
      s.value = '${mode}';
      s.dispatchEvent(new Event('change'));
      return true;
    })()`);

    /** 填一个明细输入框（只改 draft，不重画） */
    const fillFrame = (cardIdx, field, value) => cdp.eval(`(() => {
      const i = document.querySelectorAll('.board-card')[${cardIdx}]
        .querySelector('[data-f="frame.${field}"]');
      if (!i) return false;
      i.value = ${JSON.stringify(value)};
      i.dispatchEvent(new Event('input'));
      return true;
    })()`);

    const saveBoard = async () => {
      await cdp.eval(`Array.from(document.querySelectorAll('.modal-actions button'))
        .find(b => b.textContent.indexOf('保存调整') !== -1).click()`);
      await sleep(900);
    };

    // ---- 1) 默认全是「未指定」，而且第 1 镜不该有「沿用上个分镜的尾帧」 ----
    check('（前置）还没指定首尾帧时，成品里没有「首尾帧参考」这一节',
      !(await readFrames()).has);
    await cdp.eval('document.getElementById("editBoardBtn").click()');
    await sleep(450);
    const ctrls0 = await readFrameCtrls();
    check('每张卡都有首帧 / 尾帧两个来源下拉，默认都是「未指定」',
      ctrls0.length >= 2 && ctrls0.every((c) => c.start === 'none' && c.end === 'none'),
      JSON.stringify(ctrls0.map((c) => c.start + '/' + c.end)));
    check('第 1 镜的首帧下拉里**没有**「沿用上个分镜的尾帧」（它前面没有分镜）',
      ctrls0[0].startOpts.indexOf('prev') === -1 && ctrls0[1].startOpts.indexOf('prev') !== -1,
      '第1镜=' + ctrls0[0].startOpts.join(',') + ' 第2镜=' + ctrls0[1].startOpts.join(','));
    check('尾帧下拉里没有「沿用上个分镜的尾帧」（尾帧说的是「停在哪儿」）',
      ctrls0.every((c) => c.endOpts.indexOf('prev') === -1)
      // 光「没有 prev」是会白过的 —— 下拉要是空的，这条也成立。
      // 所以再要求尾帧那三个来源**确实在**（正面孪生断言）。
      && ctrls0.every((c) => c.endOpts.indexOf('none') !== -1
        && c.endOpts.indexOf('text') !== -1 && c.endOpts.indexOf('file') !== -1),
      JSON.stringify(ctrls0.map((c) => c.endOpts)));
    check('「未指定」时不给任何明细输入框（不占版面）',
      ctrls0.every((c) => c.fields.length === 0),
      JSON.stringify(ctrls0.map((c) => c.fields)));

    // ---- 2) 三种来源都填一遍，看它们怎么进成品 ----
    await pickFrame(0, 'start', 'text');
    await sleep(300);
    await fillFrame(0, 'start.text', FRAME_TEXT);
    await pickFrame(0, 'end', 'file');
    await sleep(300);
    const fileFields = (await readFrameCtrls())[0].fields;
    check('选「从文件导入」之后出现文件名 / 路径 / 备注三个输入框',
      fileFields.indexOf('frame.end.name') !== -1 && fileFields.indexOf('frame.end.path') !== -1
      && fileFields.indexOf('frame.end.note') !== -1,
      JSON.stringify(fileFields));
    check('「从文件导入」还带一个「选择文件…」按钮（省得手打文件名）',
      await cdp.eval(`!!document.querySelector('.board-card [data-f="frame.end.pick"]')`));
    await fillFrame(0, 'end.name', FRAME_NAME);
    await fillFrame(0, 'end.path', FRAME_PATH);
    await fillFrame(0, 'end.note', FRAME_NOTE);
    await pickFrame(1, 'start', 'prev');
    await sleep(300);

    // 上一镜（镜头 1）已经指定了尾帧，所以不该出现「上一镜没指定尾帧」那句提示
    const ctrls2 = await readFrameCtrls();
    check('上一镜有尾帧时，「沿用上一镜」不报任何提示',
      ctrls2[1].start === 'prev' && ctrls2[1].warn === '',
      '值=' + ctrls2[1].start + ' 提示=' + ctrls2[1].warn);

    await saveBoard();
    const frames2 = await readFrames();
    check('指定之后成品里出现「首尾帧参考」表，表头是 镜头编号 / 首帧 / 尾帧',
      frames2.has && frames2.head.join(',') === '镜头编号,首帧,尾帧',
      JSON.stringify(frames2.head));
    check('首帧「文生图」写成了「文生图：<描述>」',
      (frames2.rows[0] || {}).start === '文生图：' + FRAME_TEXT,
      JSON.stringify((frames2.rows[0] || {}).start));
    check('尾帧「从文件导入」把文件名 / 路径 / 备注都写全了',
      (frames2.rows[0] || {}).end === '从文件导入：' + FRAME_NAME + '（' + FRAME_PATH + '）｜' + FRAME_NOTE,
      JSON.stringify((frames2.rows[0] || {}).end));
    check('首帧「沿用上个分镜的尾帧」写明了是哪一镜（不是干巴巴一句「上一镜」）',
      (frames2.rows[1] || {}).start === '沿用镜头 1 的尾帧',
      JSON.stringify((frames2.rows[1] || {}).start));
    check('没指定的那一格写「—」',
      (frames2.rows[1] || {}).end === '—', JSON.stringify((frames2.rows[1] || {}).end));
    check('上一镜有尾帧时不写那句说明（说了反而是噪音）',
      frames2.note === '', frames2.note || '（没有说明）');

    // ---- 3) 首尾帧要活过服务端往返（server.js 的白名单漏一个字段就没了）----
    const frameSaved = await cdp.eval(`(async () => {
      const list = await (await fetch('/api/projects')).json();
      const newest = (((list || {}).data || {}).projects || [])[0];
      if (!newest) return { none: true };
      const full = await (await fetch('/api/projects/' + newest.id)).json();
      const p = ((full || {}).data || {}).project || {};
      const s = ((p.storyboardEdit || {}).shots || []);
      return {
        none: false,
        start0: s[0] && s[0].frameStart,
        end0: s[0] && s[0].frameEnd,
        start1: s[1] && s[1].frameStart,
      };
    })()`);
    check('首尾帧活过了服务端往返（落盘白名单登记了 frameStart / frameEnd）',
      !frameSaved.none
      && (frameSaved.start0 || {}).mode === 'text'
      && (frameSaved.end0 || {}).name === FRAME_NAME
      && (frameSaved.end0 || {}).path === FRAME_PATH
      && (frameSaved.end0 || {}).note === FRAME_NOTE
      && (frameSaved.start1 || {}).mode === 'prev',
      JSON.stringify(frameSaved));

    // ---- 4) 上一镜没指定尾帧 → 编辑器提示 + 成品里写一句说明 ----
    await cdp.eval('document.getElementById("editBoardBtn").click()');
    await sleep(450);
    await pickFrame(0, 'end', 'none');
    await sleep(300);
    const warnCtrl = (await readFrameCtrls())[1].warn;
    check('上一镜改成「未指定尾帧」之后，这一镜的卡片上出现提示（并说清为什么还能接得上）',
      warnCtrl.indexOf('最后一帧') !== -1 && warnCtrl.indexOf('镜头 1') !== -1, warnCtrl || '（没提示）');
    await saveBoard();
    const frames3 = await readFrames();
    check('成品里也写一句说明，点名是哪一镜（不然「沿用镜头 1 的尾帧」和镜头 1 那格的「—」摆在一起没人解释）',
      frames3.note.indexOf('镜头 2') !== -1 && frames3.note.indexOf('最后一帧') !== -1,
      frames3.note || '（没有说明）');
    check('说明里不该把镜头 1 也扯进来（它没有「沿用上一镜」这回事）',
      frames3.note.indexOf('镜头 1 的首帧') === -1, frames3.note);

    // ---- 5) 文生图留空 → 回落这一镜的镜头内容 ----
    await cdp.eval('document.getElementById("editBoardBtn").click()');
    await sleep(450);
    const cell1 = await cdp.eval(`document.querySelectorAll('.board-card')[1]
      .querySelector('textarea[data-f="cell"]').value`);
    await pickFrame(1, 'end', 'text');
    await sleep(300);
    await saveBoard();
    const frames4 = await readFrames();
    check('文生图留空时回落这一镜的镜头内容（不留一个空荡荡的「文生图：」）',
      (frames4.rows[1] || {}).end === '文生图：' + cell1,
      JSON.stringify((frames4.rows[1] || {}).end) + ' 期望 文生图：' + cell1);

    // ---- 6) 把第 2 镜挪到第 1 位 → prev 失效，要收敛掉并说出来 ----
    await cdp.eval('document.getElementById("editBoardBtn").click()');
    await sleep(450);
    await cdp.eval('document.querySelectorAll(".board-card")[1].querySelector(\'[data-act="up"]\').click()');
    await sleep(400);
    const afterUp = await readFrameCtrls();
    const toastText = await cdp.eval('document.getElementById("toastWrap").textContent');
    check('挪到第一位之后，那条「沿用上个分镜的尾帧」被取消（第 1 镜没有上一个分镜）',
      afterUp[0].startOpts.indexOf('prev') === -1 && afterUp.every((c) => c.start !== 'prev'),
      JSON.stringify(afterUp.map((c) => c.start)));
    check('而且**说出来**了 —— 悄悄清掉用户的选择，他会以为自己的选择丢了',
      toastText.indexOf('沿用上个分镜的尾帧') !== -1 && toastText.indexOf('镜头 1') !== -1,
      toastText || '（没有提示）');
    await cdp.shot(path.join(SHOT_DIR, '14g-board-frames.png'));
    await saveBoard();
    const frames5 = await readFrames();
    check('保存之后成品里不再有那条失效的 prev（存下来的那一份也是干净的）',
      !frames5.rows.some((r) => (r.start || '').indexOf('沿用镜头') === 0),
      JSON.stringify(frames5.rows.map((r) => r.start)));

    // 收尾：把首尾帧清干净，免得给后面 [8] 的历史记录断言塞进一张额外的表。
    // 注意挪过位置，哪一格上还留着东西要按**当前位置**看：
    // 换过位之后，剩下的两条是「第 1 镜的尾帧」和「第 2 镜的首帧」。
    await cdp.eval('document.getElementById("editBoardBtn").click()');
    await sleep(450);
    await pickFrame(0, 'end', 'none');
    await sleep(250);
    await pickFrame(1, 'start', 'none');
    await sleep(250);
    await saveBoard();
    check('（清理）首尾帧清空之后，这一节整个消失',
      !(await readFrames()).has);

    /* ---------------- 7.8 没有分镜表时的入口（「生成分镜表」） ---------------- */
    // 用户的原话：「我试着运行，但没看见分镜表」。
    // 他选的是 3 个景别 + 10-15 秒（都能多镜头），但同时选了「一镜到底」——
    // 而一镜到底说的是「全片没有剪辑点」，引擎于是回退成一段连续描述；
    // 更糟的是当时连入口都没有：按钮只在「已经有分镜表」时才出现，
    // 所以他既拿不到分镜表，也不知道为什么。
    console.log('\n[7.8] 没有分镜表时的「生成分镜表」入口');
    // 先记下记录条数：这一节会多存一条，跑完要删掉、回到这个数
    const historyBaseline = await cdp.eval('document.querySelectorAll(".history-item").length');
    await cdp.eval('document.getElementById("newBtn").click()');
    await sleep(300);
    await cdp.eval('document.querySelector(\'.sample-row [data-sample="video"]\').click()');
    await sleep(500);
    await cdp.eval('document.getElementById("startBtn").click()');
    await sleep(400);

    let onerRound = 0;
    let hintSeen = '';
    while (onerRound < 15) {
      const onerDone = await cdp.eval('!document.getElementById("stageResult").classList.contains("hidden")');
      if (onerDone) break;
      const onerBlocks = await cdp.eval('document.querySelectorAll(".q-block").length');
      if (!onerBlocks) break;
      onerRound += 1;
      await cdp.eval(`(() => {
        // 「一镜到底」现在归「剪辑结构」，影像风格那一题留给「赛博朋克」——
        // 这两个组合以前**根本选不出来**（同一道单选题，点了一个挤掉另一个）。
        // 所以这一节同时也在验：分家之后它们能共存。
        const want = {
          'vid.shot': ['全景', '近景', '极特写'],
          'vid.cut': ['一镜到底'],
          'vid.style': ['赛博朋克'],
          'vid.duration': ['10-15 秒'],
        };
        document.querySelectorAll('.q-block').forEach(b => {
          const opts = Array.from(b.querySelectorAll('.option-btn'))
            .filter(x => !x.classList.contains('is-skip') && !x.classList.contains('is-custom'));
          const labels = want[b.dataset.qid];
          const targets = labels
            ? labels.map(lb => opts.find(x => x.textContent.indexOf(lb) !== -1)).filter(Boolean)
            : opts.slice(0, 1);
          targets.forEach(o => { if (!o.classList.contains('selected')) o.click(); });
        });
        return true;
      })()`);
      // 点了「一镜到底」之后，**同一轮**里的景别题上应当当场出现那句动态提示。
      // 这两题挨着排在 core 里就是为了这个 —— 一轮只出 2 道题（BATCH_SIZE=2）。
      const h = await cdp.eval(`(() => {
        const s = document.querySelector('[data-qid="vid.shot"] .q-hint');
        const c = document.querySelector('[data-qid="vid.cut"]');
        return (s && c && !s.classList.contains('hidden')) ? s.textContent.trim() : '';
      })()`);
      if (h) hintSeen = h;
      await cdp.eval('document.getElementById("nextBtn").click()');
      await sleep(260);
    }
    await sleep(700);

    check('选了「一镜到底」时，同一轮的景别题当场出现提示（不是等到结果区才知道）',
      hintSeen.indexOf('一镜到底') !== -1 && hintSeen.indexOf('景别') !== -1, hintSeen);

    const onerState = await cdp.eval(`(() => {
      ${TABLE_AFTER_HELPER}
      const b = document.getElementById('editBoardBtn');
      const n = document.getElementById('promptNotice');
      return {
        hasBoard: !!tableAfter('分镜表'),
        btnHidden: b.classList.contains('hidden'),
        btnLabel: b.textContent.trim(),
        notice: n.classList.contains('hidden') ? '' : n.textContent.trim(),
      };
    })()`);
    check('（前置）「一镜到底」+ 3 个景别确实没有分镜表（复现用户看到的情况）',
      !onerState.hasBoard, '有分镜表=' + onerState.hasBoard);
    check('没有分镜表时也给了入口，文案是「生成分镜表」',
      !onerState.btnHidden && onerState.btnLabel === '生成分镜表',
      'hidden=' + onerState.btnHidden + ' label=' + onerState.btnLabel);
    check('提示点明了「一镜到底」是原因，并告诉用户点那个按钮',
      onerState.notice.indexOf('一镜到底') !== -1 && onerState.notice.indexOf('生成分镜表') !== -1,
      onerState.notice);

    await cdp.eval('document.getElementById("editBoardBtn").click()');
    await sleep(450);
    const createModal = await cdp.eval(`(() => {
      const t = document.querySelector('.modal h3');
      const c = document.querySelector('.board-conflict');
      return {
        title: t ? t.textContent.trim() : '',
        conflict: c ? c.textContent.trim() : '',
        cards: document.querySelectorAll('.board-editor .board-card').length,
        note: (document.querySelector('.board-note') || {}).textContent || '',
      };
    })()`);
    check('点开后标题是「生成分镜表」（不是在编辑一份并不存在的表）',
      createModal.title === '生成分镜表', createModal.title);
    check('编辑器里说清了和「一镜到底」的冲突',
      createModal.conflict.indexOf('一镜到底') !== -1 && createModal.conflict.indexOf('没有剪辑点') !== -1,
      createModal.conflict);
    check('按用户选的 3 个景别排了 3 张卡', createModal.cards === 3, '卡数=' + createModal.cards);
    // 「一镜到底」下没有自动版可回落，所以作废那句必须照实说 ——
    // 写「回到自动排的版本」就是在许一个引擎兑现不了的承诺（表其实会整个消失）。
    check('（没有自动版时）说明照实说「这张表会作废」，不写「回到自动排的版本」',
      createModal.note.indexOf('作废') !== -1 && createModal.note.indexOf('回到自动排的版本') === -1,
      createModal.note.slice(-90));
    await cdp.shot(path.join(SHOT_DIR, '14e-board-create.png'));

    // 保存 —— 这一步以前会静默失败：setStoryboardEdit 内部按「自动计划」判断能不能排，
    // 而「一镜到底」下自动计划是 false，于是按钮点了没反应、什么都不会发生。
    await cdp.eval(`Array.from(document.querySelectorAll('.modal-actions button'))
      .find(b => b.textContent.indexOf('保存调整') !== -1).click()`);
    await sleep(900);
    const onerTable = await readTable();
    check('保存之后成品真的换成了分镜表（这一步以前静默失败）',
      onerTable.rows.length === 3, '行数=' + onerTable.rows.length);

    // 成品不许自相矛盾：一边说「全片没有剪辑点」，一边排三个镜头。
    //
    // 断言要扫**整个头部**，不能只看【摄影语言】：「一镜到底」以前混在影像风格里，
    // 所以只在那一行出现；拆题之后它归【剪辑结构】，一个「把一镜到底原样写进
    // 【剪辑结构】」的实现会**照样通过**旧断言（表里 3 行、头部写着「全片没有剪辑点」）。
    //
    // 头部每行渲染成 `.p-meta`（`.p-key` 是标签、`.p-val` 是内容），所以这里直接读
    // 语义结构，不再按 textContent 切片 —— 切片既怕标题重名，也怕中间夹着别的行
    // （【摄影语言】和【细节焦点】之间就夹着【剪辑说明】，切到细节焦点会把说明里
    // 那句话圈进来，断言假失败）。
    //
    // 但**【剪辑说明】这一行本身必须豁免** —— 它的职责就是把冲突讲明白，
    // 里面当然会引用「全片没有剪辑点」这四个字。
    const onerHead = await cdp.eval(`(() => {
      const metas = Array.from(document.querySelectorAll('#finalPrompt .p-meta')).map(el => ({
        key: (el.querySelector('.p-key') || {}).textContent || '',
        val: (el.querySelector('.p-val') || {}).textContent || '',
      }));
      const pick = (k) => (metas.filter(m => m.key === k)[0] || {}).val || '';
      return {
        style: pick('摄影语言'),
        note: pick('剪辑说明'),
        cut: pick('剪辑结构'),
        claiming: metas.filter(m => m.key !== '剪辑说明' && m.val.indexOf('没有剪辑点') !== -1)
          .map(m => '【' + m.key + '】' + m.val),
      };
    })()`);
    check('【摄影语言】里保住了用户选的影像风格（拆题没有把风格一起弄丢）',
      onerHead.style.indexOf('赛博朋克') !== -1, onerHead.style);
    check('头部除【剪辑说明】外，没有任何一行还在声称「全片没有剪辑点」',
      onerHead.claiming.length === 0, onerHead.claiming.join(' | '));
    check('摘掉的那一条有【剪辑说明】交代（不无声丢弃用户的答案）',
      onerHead.note.indexOf('一镜到底') !== -1 && onerHead.note.indexOf('没有剪辑点') !== -1,
      onerHead.note);
    check('「一镜到底」下【剪辑结构】和【剪辑说明】不会同时出现（两者互斥）',
      onerHead.cut === '' && onerHead.note !== '', 'cut=' + onerHead.cut + ' note=' + onerHead.note);
    check('生成之后按钮变成「编辑分镜表」',
      (await cdp.eval('document.getElementById("editBoardBtn").textContent.trim()')) === '编辑分镜表');

    // 这一段会多存一条记录。删掉它，免得后面 [8]「点开最新一条」点到这一条
    // （它没有 [7.7] 手工排的那一版，会把 [8] 的断言带偏）。
    await cdp.eval('document.querySelector(".history-item.active .h-del").click()');
    await sleep(350);
    await cdp.eval(`Array.from(document.querySelectorAll('.modal-actions button'))
      .find(b => b.textContent.trim() === '删除').click()`);
    await sleep(700);
    check('（清理）[7.8] 自己那条记录已删除，后面 [8] 仍会点到 [7.7] 的那一条',
      (await cdp.eval('document.querySelectorAll(".history-item").length')) === historyBaseline,
      '当前=' + (await cdp.eval('document.querySelectorAll(".history-item").length'))
        + ' 之前=' + historyBaseline);

    /* ---------------- 7.9 只选一个景别也能一键排表 ---------------- */
    console.log('\n[7.9] 只选一个景别：种子自动补到最少两镜');
    // 这一条钉的是「点了按钮却走不下去」的死胡同：
    // 分镜表的下限是 2 镜，种子要是只排 1 镜，用户点开 → 点「保存调整」→
    // 只会拿到「这张表的数据对不上，没法保存」，而 create 路径下
    // 「恢复自动生成」还是灰的 —— 他连退路都没有。
    // 用户的原话是「点开之后应该 AI 自动生成，然后由人来编辑修改」：
    // 他要的是**一版完整的草稿**，不是让他自己搭的半成品。
    const historyBaseline2 = await cdp.eval('document.querySelectorAll(".history-item").length');
    await cdp.eval('document.getElementById("newBtn").click()');
    await sleep(300);
    await cdp.eval('document.querySelector(\'.sample-row [data-sample="video"]\').click()');
    await sleep(500);
    await cdp.eval('document.getElementById("startBtn").click()');
    await sleep(400);

    let oneRound = 0;
    while (oneRound < 15) {
      const oneDone = await cdp.eval('!document.getElementById("stageResult").classList.contains("hidden")');
      if (oneDone) break;
      const oneBlocks = await cdp.eval('document.querySelectorAll(".q-block").length');
      if (!oneBlocks) break;
      oneRound += 1;
      await cdp.eval(`(() => {
        // 只点一个景别（「特写」，DOM 顺序上排在「极特写」之前），时长给到最长。
        // 其余题目各取第一个选项 —— 「剪辑结构」的第一项是「分镜剪辑」（要多个镜头），
        // 所以这里测的是纯粹的「只选一个景别」：唯一的卡点就是景别数，
        // 不会掺进「一镜到底」那条。
        const want = { 'vid.shot': ['特写'], 'vid.duration': ['15 秒以上'] };
        document.querySelectorAll('.q-block').forEach(b => {
          const opts = Array.from(b.querySelectorAll('.option-btn'))
            .filter(x => !x.classList.contains('is-skip') && !x.classList.contains('is-custom'));
          const labels = want[b.dataset.qid];
          const targets = labels
            ? labels.map(lb => opts.find(x => x.textContent.indexOf(lb) !== -1)).filter(Boolean)
            : opts.slice(0, 1);
          targets.forEach(o => { if (!o.classList.contains('selected')) o.click(); });
        });
        return true;
      })()`);
      await cdp.eval('document.getElementById("nextBtn").click()');
      await sleep(260);
    }
    await sleep(700);

    const oneState = await cdp.eval(`(() => {
      ${TABLE_AFTER_HELPER}
      const b = document.getElementById('editBoardBtn');
      return {
        hasBoard: !!tableAfter('分镜表'),
        btnHidden: b.classList.contains('hidden'),
        btnLabel: b.textContent.trim(),
      };
    })()`);
    check('（前置）只选一个景别时确实没有自动分镜表',
      !oneState.hasBoard, '有分镜表=' + oneState.hasBoard);
    check('只选一个景别也给了「生成分镜表」入口',
      !oneState.btnHidden && oneState.btnLabel === '生成分镜表',
      'hidden=' + oneState.btnHidden + ' label=' + oneState.btnLabel);

    await cdp.eval('document.getElementById("editBoardBtn").click()');
    await sleep(450);
    const oneModal = await cdp.eval(`(() => ({
      cards: document.querySelectorAll('.board-editor .board-card').length,
      shots: Array.from(document.querySelectorAll('.board-card select[data-f="shotId"]')).map(s => s.value),
      emptyCells: Array.from(document.querySelectorAll('.board-card textarea'))
        .filter(t => !t.value.trim()).length,
      dups: document.querySelectorAll('.board-editor .board-warn').length,
      note: (document.querySelector('.board-note') || {}).textContent || '',
    }))()`);
    check('种子里已经是 2 张卡（不是只给 1 镜的半成品）',
      oneModal.cards === 2, '卡数=' + oneModal.cards);
    check('补出来的那一镜不是照抄用户选的景别（不会一上来就撞「相邻同景别」）',
      oneModal.dups === 0 && oneModal.shots[0] !== oneModal.shots[1],
      '景别=' + oneModal.shots.join('/') + ' 警告=' + oneModal.dups);
    check('补出来的那一镜「内容」不留空',
      oneModal.emptyCells === 0, '空格子=' + oneModal.emptyCells);
    // 这一条和 [7.8] 走的是**同一个分支，但不是同一个原因**：
    // 那边是「一镜到底」拦住了自动计划，这边是「只选了一个景别」（自动计划 n<2）。
    // 两种情况都没有自动版可回落，所以说明都得照实说。
    check('（只选一个景别、同样没有自动版）说明也照实说「作废」',
      oneModal.note.indexOf('作废') !== -1 && oneModal.note.indexOf('回到自动排的版本') === -1,
      oneModal.note.slice(-90));
    await cdp.shot(path.join(SHOT_DIR, '14f-board-seed-pad.png'));

    await cdp.eval(`Array.from(document.querySelectorAll('.modal-actions button'))
      .find(b => b.textContent.indexOf('保存调整') !== -1).click()`);
    await sleep(900);
    const oneTable = await readTable();
    check('种子生成的表**一按保存就成表**（不再掉进「数据对不上」的死胡同）',
      oneTable.rows.length === 2, '行数=' + oneTable.rows.length);
    check('保存后按钮变成「编辑分镜表」',
      (await cdp.eval('document.getElementById("editBoardBtn").textContent.trim()')) === '编辑分镜表');

    // 同 [7.8]：这一段也会多存一条记录，删掉它免得 [8] 点到这一条
    await cdp.eval('document.querySelector(".history-item.active .h-del").click()');
    await sleep(350);
    await cdp.eval(`Array.from(document.querySelectorAll('.modal-actions button'))
      .find(b => b.textContent.trim() === '删除').click()`);
    await sleep(700);
    check('（清理）[7.9] 自己那条记录已删除',
      (await cdp.eval('document.querySelectorAll(".history-item").length')) === historyBaseline2,
      '当前=' + (await cdp.eval('document.querySelectorAll(".history-item").length'))
        + ' 之前=' + historyBaseline2);

    /* ---------------- 8. 历史记录 ---------------- */
    console.log('\n[8] 历史记录');
    await sleep(900);
    const historyCount = await cdp.eval('document.querySelectorAll(".history-item").length');
    check('四条记录都已保存', historyCount >= 4, '数量=' + historyCount);

    // 刷新后仍然存在
    await cdp.goto(BASE + '/app.html');
    await sleep(900);
    const afterReload = await cdp.eval('document.querySelectorAll(".history-item").length');
    check('刷新后记录仍在（服务端持久化）', afterReload >= 4, '数量=' + afterReload);

    // 点开最新一条（分镜视频）—— 多行 Markdown 表格要能完整穿过服务端往返
    await cdp.eval('document.querySelector(".history-item").click()');
    await sleep(700);
    const loaded = await cdp.eval('document.getElementById("finalPrompt").textContent');
    check('可以载入历史记录', loaded.length > 60, '长度=' + loaded.length);
    const loadedDom = await cdp.eval(`(() => {
      const box = document.getElementById('finalPrompt');
      ${TABLE_AFTER_HELPER}
      const tb = tableAfter('分镜表');
      return {
        rich: box.classList.contains('is-rich'),
        rows: tb ? tb.querySelectorAll('tbody tr').length : 0,
        h2: Array.from(box.querySelectorAll('.p-h2')).map(h => h.textContent.trim()),
      };
    })()`);
    check('历史记录完整还原了分镜表（并且也渲染成表格）',
      loadedDom.rich && loadedDom.rows >= 2
      && loadedDom.h2.indexOf('分镜表') !== -1
      && loadedDom.h2.indexOf('逐段画面描述') !== -1
      && loadedDom.h2.indexOf('背景音乐建议') !== -1,
      '表格行=' + loadedDom.rows + ' 小节=' + loadedDom.h2.join('/'));
    check('历史记录还原了负面提示词',
      !(await cdp.eval('document.getElementById("negativeSection").classList.contains("hidden")')));
    /* 同上：判据不用工具名（工具清单会过期），用「分镜表」。 */
    check('历史记录还原了对应 family 的用法说明',
      (await cdp.eval('document.getElementById("usageNote").textContent')).indexOf('分镜表') !== -1);
    check('历史记录还原了「为什么这样写」',
      (await cdp.eval('document.querySelectorAll("#whyList .decision-item").length')) >= 3);
    await cdp.shot(path.join(SHOT_DIR, '14-history.png'));

    // 载入记录之后，「编辑分镜表」必须还在，而且打开看到的是用户手工排的那一版。
    // 少了这一段，storyboardEdit 存了没还原也发现不了 —— 用户会以为自己的调整丢了。
    check('载入历史记录后，仍然可以继续编辑分镜表',
      !(await cdp.eval('document.getElementById("editBoardBtn").classList.contains("hidden")')));
    await cdp.eval('document.getElementById("editBoardBtn").click()');
    await sleep(450);
    const histCards = await readCards();
    // 不按下标找 —— 上面加减过镜头，手工那一镜在哪一位会变。
    // 要找的是「手工排的那一版还在不在」，不是「它排第几」。
    const markedCards = histCards.filter((c) => c.cell === MARKER);
    check('载入记录后打开编辑器，看到的是手工排的那一版（不是自动版）',
      histCards.length === loadedDom.rows && markedCards.length === 1,
      '卡数=' + histCards.length + ' 表行=' + loadedDom.rows
      + ' 手写镜=' + markedCards.length);
    check('载入记录后「恢复自动生成」可点（说明引擎认这份手工调整）',
      !(await cdp.eval(`Array.from(document.querySelectorAll('.modal-actions button'))
        .find(b => b.textContent.indexOf('恢复自动生成') !== -1).disabled`)));
    await cdp.shot(path.join(SHOT_DIR, '14c-board-from-history.png'));
    await cdp.eval('document.getElementById("modalHost").innerHTML = ""');
    await sleep(200);

    // 载入「没有分镜表」的记录时，「为什么没有」必须一起还原。
    // 这里曾经写死 storyboardNotice: null（以为记录里没存 session 就算不出来，
    // 其实答案都在 answers 里）。后果正是用户报的那件事：
    // 打开自己那一版只看到一段连续描述，既不知道为什么没有分镜表、也不知道怎么才能拿到。
    // 不按下标找 —— 记录顺序会随前面几节存了多少条而变，找的是「有没有这样一条」。
    let noticeOnLoad = '';
    let foundNoBoard = false;
    const histTotal = await cdp.eval('document.querySelectorAll(".history-item").length');
    for (let hi = 0; hi < histTotal; hi += 1) {
      await cdp.eval(`document.querySelectorAll(".history-item")[${hi}].click()`);
      await sleep(650);
      const probe = await cdp.eval(`(() => {
        ${TABLE_AFTER_HELPER}
        const n = document.getElementById('promptNotice');
        return {
          hasBoard: !!tableAfter('分镜表'),
          notice: n.classList.contains('hidden') ? '' : n.textContent.trim(),
        };
      })()`);
      if (!probe.hasBoard) { noticeOnLoad = probe.notice; foundNoBoard = true; break; }
    }
    check('（前置）历史里确实有一条「没有分镜表」的记录', foundNoBoard);
    check('载入没有分镜表的记录时，「为什么没有分镜表」也一起还原（不是一片空白）',
      noticeOnLoad.length > 10 && noticeOnLoad.indexOf('分镜') !== -1, noticeOnLoad);

    /* ---------------- 9. 修改某个选择 ---------------- */
    console.log('\n[9] 修改已做的选择');
    await cdp.eval('document.getElementById("reviseBtn").click()');
    await sleep(400);
    check('打开修改弹窗', await cdp.eval('!!document.querySelector(".modal-mask")'));
    await cdp.eval('document.querySelector(".modal-body .option-btn").click()');
    await sleep(300);
    const editOptions = await cdp.eval('document.querySelectorAll(".modal-body .option-btn").length');
    check('可以进入单项重新选择', editOptions >= 3, '选项数=' + editOptions);
    await cdp.shot(path.join(SHOT_DIR, '15-revise.png'));
    await cdp.eval('document.getElementById("modalHost").innerHTML = ""');

    /* ---------------- 10. 无控制台报错 ---------------- */
    console.log('\n[10] 控制台检查');
    const errs = cdp.events
      .filter((e) => e.method === 'Log.entryAdded' && e.params.entry.level === 'error')
      .map((e) => e.params.entry.text);
    check('没有控制台错误', errs.length === 0, errs.slice(0, 3).join(' | '));

    /* ---------------- 11. 窄屏布局与抽屉 ---------------- */
    console.log('\n[11] 窄屏布局与抽屉');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 390, height: 844, deviceScaleFactor: 2, mobile: true,
    });
    await cdp.goto(BASE + '/app.html');
    await sleep(900);
    check('窄屏无横向溢出',
      await cdp.eval('document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1'),
      await cdp.eval('document.documentElement.scrollWidth + " vs " + document.documentElement.clientWidth'));
    check('窄屏默认隐藏右侧预览面板',
      await cdp.eval('getComputedStyle(document.querySelector(".preview")).display === "none"'));
    check('窄屏隐藏侧栏',
      await cdp.eval('getComputedStyle(document.querySelector(".sidebar")).display === "none"'));
    check('窄屏显示两个抽屉开关',
      await cdp.eval('getComputedStyle(document.getElementById("previewToggle")).display !== "none"')
      && await cdp.eval('getComputedStyle(document.getElementById("historyToggle")).display !== "none"'));

    await cdp.eval('document.getElementById("historyToggle").click()');
    await sleep(350);
    check('「记录」按钮拉出侧栏',
      await cdp.eval('getComputedStyle(document.querySelector(".sidebar")).display !== "none"'));
    check('抽屉有遮罩',
      await cdp.eval('!!document.querySelector(".drawer-backdrop.show")'));
    await cdp.shot(path.join(SHOT_DIR, '16-mobile-drawer.png'));

    await cdp.eval('document.querySelector(".drawer-backdrop").click()');
    await sleep(300);
    check('点遮罩收起抽屉',
      await cdp.eval('getComputedStyle(document.querySelector(".sidebar")).display === "none"'));

    await cdp.eval('document.getElementById("previewToggle").click()');
    await sleep(350);
    check('「预览」按钮拉出预览面板',
      await cdp.eval('getComputedStyle(document.querySelector(".preview")).display !== "none"'));
    await cdp.eval('document.querySelector(".drawer-backdrop").click()');
    await sleep(250);

    await cdp.eval(`(() => {
      const ta = document.getElementById('rawPrompt');
      ta.value = '帮我想几个奶茶店的名字，要年轻一点的感觉';
      ta.dispatchEvent(new Event('input', {bubbles:true}));
      document.getElementById('startBtn').click();
      return true;
    })()`);
    await sleep(600);
    await cdp.eval(`(() => {
      document.querySelectorAll('.q-block').forEach(b => {
        const o = b.querySelector('.option-btn:not(.is-skip):not(.is-custom)');
        if (o) o.click();
      });
      return true;
    })()`);
    await sleep(300);
    await cdp.shot(path.join(SHOT_DIR, '17-mobile-rounds.png'));
    check('窄屏问答正常渲染',
      (await cdp.eval('document.querySelectorAll(".q-block").length')) >= 1);

    // 窄屏下的场景对照示例：两个 SVG 并排，在 390px 宽度上最容易被挤扁或顶出屏幕。
    // 上面那段跑的是文字场景，根本没渲染过示例图，所以这里单独跑一遍图片链路。
    await cdp.eval('document.getElementById("newBtn").click()');
    await sleep(300);
    await cdp.eval('document.querySelector(\'.sample-row [data-sample="image"]\').click()');
    await sleep(500);
    await cdp.eval('document.getElementById("startBtn").click()');
    await sleep(500);

    let mSceneChecked = false;
    for (let r = 0; r < 8 && !mSceneChecked; r += 1) {
      const mReady = await cdp.eval(
        '!!document.querySelector(\'.q-block[data-qid="img.composition"], .q-block[data-qid="img.lighting"]\')');
      if (mReady) {
        mSceneChecked = true;
        const m = await cdp.eval(`(() => {
          const out = { pairs: 0, tiny: 0, minW: 9999, minH: 9999, spill: 0 };
          out.overflow = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
          document.querySelectorAll('.o-demo.is-scene').forEach(p => {
            out.pairs += 1;
            const btn = p.closest('.option-btn');
            const br = btn ? btn.getBoundingClientRect() : null;
            p.querySelectorAll('.d-frame').forEach(f => {
              const r = f.getBoundingClientRect();
              if (r.width < out.minW) out.minW = Math.round(r.width);
              if (r.height < out.minH) out.minH = Math.round(r.height);
              if (r.width < 40 || r.height < 20) out.tiny += 1;
              // 示例图不能画出它所在按钮的边界
              if (br && r.right > br.right + 1) out.spill += 1;
            });
          });
          if (out.minW === 9999) out.minW = 0;
          if (out.minH === 9999) out.minH = 0;
          return out;
        })()`);
        check('窄屏也渲染出了场景对照示例', m.pairs > 0, '对数=' + m.pairs);
        check('窄屏示例图没被挤成小点', m.tiny === 0,
          '最小 ' + m.minW + '×' + m.minH + '，异常 ' + m.tiny + ' 个');
        check('窄屏示例图没有溢出选项按钮', m.spill === 0, '溢出 ' + m.spill + ' 个');
        check('窄屏加了示例图后仍无横向溢出', !m.overflow);
        await cdp.shot(path.join(SHOT_DIR, '18-mobile-scene-demos.png'));
      }

      await cdp.eval(`(() => {
        document.querySelectorAll('.q-block').forEach(b => {
          const o = b.querySelector('.option-btn:not(.is-skip):not(.is-custom)');
          if (o) o.click();
        });
        return true;
      })()`);
      await cdp.eval('document.getElementById("nextBtn").click()');
      await sleep(280);
    }
    check('窄屏场景示例断言确实跑过（否则等于没验证）', mSceneChecked);

    await cdp.send('Emulation.clearDeviceMetricsOverride');
    await cdp.goto(BASE + '/app.html');
    await sleep(700);

    /* ---------------- 11.5 手机端（H5） ---------------- */
    console.log('\n[11.5] 手机端（H5）');
    /* 光设 mobile:true 是**不够**的：(hover: none) / (pointer: coarse) 由
       「有没有触摸输入」决定，不设触摸模拟的话这两条 media query 根本不匹配 ——
       下面那一整块移动端样式在测试里就等于没跑，而断言照样全绿（假绿）。
       所以这里显式开触摸模拟，并且把匹配结果本身也断言一次。 */
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    const setPhone = (w, h) => cdp.send('Emulation.setDeviceMetricsOverride',
      { width: w, height: h, deviceScaleFactor: 2, mobile: true });

    /* 顶栏的可达性。手机上顶栏放不下时可以横滑（见 main.css 的「窄屏顶栏」），
       但**必须划得到头** —— 所以量的是「最后一个控件（账号）的右缘有没有落进
       顶栏可视盒里」，而不是 scrollWidth 的大小。
       ⚠️ 两个时刻各量一次：① 刚进入 ② 把顶栏滚到最右。
       只量① 会把「能横滑」误判成「够不着」；只量② 会把「一进来就看不见」
       误判成没问题。两条合起来才是「用户真的够得着」。 */
    const topbarReach = () => cdp.eval(`(() => {
      const bar = document.querySelector('.topbar');
      if (!bar) return null;
      const box = bar.getBoundingClientRect();
      const padR = parseFloat(getComputedStyle(bar).paddingRight);
      const kids = Array.from(bar.children).filter((el) => {
        const k = getComputedStyle(el);
        return !el.classList.contains('hidden') && k.display !== 'none';
      });
      const last = kids[kids.length - 1];
      const r = last.getBoundingClientRect();
      const r0 = kids[0].getBoundingClientRect();
      return {
        last: last.id || String(last.className).split(' ')[0],
        first: kids[0].id || String(kids[0].className).split(' ')[0],
        lastRight: Math.round(r.right), boxRight: Math.round(box.right),
        padR: Math.round(padR),
        firstLeft: Math.round(r0.left), boxLeft: Math.round(box.left),
        overflow: bar.scrollWidth - bar.clientWidth,
        lastFullyVisible: r.right <= box.right - padR + 1.5,
        firstVisible: r0.left >= box.left - 1,
      };
    })()`);
    const topbarScrollEnd = () => cdp.eval(`(() => {
      const bar = document.querySelector('.topbar');
      if (bar) bar.scrollLeft = 99999;
      return bar ? bar.scrollLeft : -1;
    })()`);

    await setPhone(390, 844);

    // ---- 落地页 ----
    await cdp.goto(BASE + '/');
    await sleep(500);
    let m = await cdp.eval(MOBILE_PROBE);
    check('（前置）触摸模拟生效，(hover: none) 已匹配', m.hoverNone === true, 'coarse=' + m.coarse);
    check('落地页窄屏无横向溢出', m.overflow <= 1, m.overflow + 'px');
    check('落地页窄屏隐藏顶部导航（改由页脚承载）', m.navHidden === 'none', m.navHidden);
    check('（前置）落地页确实量到了可点控件', m.targets >= 3, m.targets + ' 个');
    check('落地页窄屏可点控件都 ≥44px',
      m.tooSmall.length === 0,
      m.tooSmall.length ? JSON.stringify(m.tooSmall) : m.targets + ' 个全部达标');
    await cdp.shot(path.join(SHOT_DIR, '20-mobile-landing.png'));

    // ---- 工作台（此时还是登录态，先量它） ----
    await cdp.goto(BASE + '/app.html');
    await sleep(900);
    m = await cdp.eval(MOBILE_PROBE);
    /* ⚠️ 这一条原来量的是 m.overflow（documentElement 的溢出），而它在工作台上
       **恒等于 0** —— .app-shell{overflow:hidden} 把溢出裁掉了，所以顶栏真实
       溢出 246px 的时候它照样是绿的（09-26 实测）。改成逐元素量。 */
    check('工作台窄屏无横向溢出（逐元素量 .app-shell，不是 documentElement）',
      m.shellOverflow !== null && m.shellOverflow <= 1, 'shell 溢出 ' + m.shellOverflow + 'px');
    check('（前置）工作台顶栏确实量到了控件（名单漏了就永远绿）',
      !!m.topbar && m.topbar.controls >= 5,
      m.topbar && m.topbar.controls + ' 个');
    /* 顶栏在手机上必须**放得下**（390 是主流宽度）。
       它原来放不下：六语种实测需要 zh-Hans 645 / es 823，而只有 390，
       多出来的部分被 .app-shell 裁掉 —— 语言切换器和账号菜单够不着。 */
    check('390px 工作台顶栏不需要横滑（收过尺寸之后放得下）',
      !!m.topbar && m.topbar.overflow === 0,
      m.topbar && ('需要 ' + m.topbar.need + ' / 有 ' + m.topbar.client
        + '，溢出 ' + m.topbar.overflow + 'px'));
    check('390px 工作台顶栏还有余量（不是「碰巧够」）',
      !!m.topbar && m.topbar.slack >= 20, m.topbar && ('余 ' + m.topbar.slack + 'px'));
    /* anti-slop（taste-skill Pre-Flight）：没有元素的计算色是纯黑。
       纯黑在这里不是审美偏好，是**故障信号** —— 它只会在「没人给这个元素
       定色」时出现。.scenario-btn 原来就是（<button> 的 UA 默认色），
       被三条子规则盖着看不见；但只要有人往按钮里直接放一个裸文本节点，
       全站唯一的纯黑就冒出来了。 */
    check('工作台没有元素的计算色是纯黑（纯黑 = 没人给它定色）',
      m.pureBlack.length === 0, m.pureBlack.slice(0, 3).join('; '));
    // 用 100vh 的话，手机上这个高度会比看得见的区域高 —— 底部操作栏被推出屏幕。
    check('.app-shell 高度贴合可视区（dvh 生效）',
      m.shellH !== null && Math.abs(m.shellH - m.innerH) <= 1,
      'shell=' + m.shellH + ' vs innerH=' + m.innerH);
    check('.app-shell 的高度声明用的是 dvh 而不是 vh',
      typeof m.shellHeightDecl === 'string' && m.shellHeightDecl.indexOf('dvh') !== -1,
      m.shellHeightDecl);
    check('（前置）工作台确实量到了可点控件', m.targets >= 3, m.targets + ' 个');
    check('工作台窄屏可点控件都 ≥44px',
      m.tooSmall.length === 0,
      m.tooSmall.length ? JSON.stringify(m.tooSmall) : m.targets + ' 个全部达标');
    // 删除按钮原来只靠 hover 显形，触摸屏上永远等不到 —— 手机上等于删不掉记录
    check('历史条目的删除按钮在触摸设备上常驻可见',
      m.delOpacity === null || parseFloat(m.delOpacity) >= 1,
      'opacity=' + m.delOpacity);

    /* ---- 登录页 ----
       必须先把登录态清掉，否则 /login 会立刻跳回工作台，
       下面那条「表单字号」就量到了工作台的 textarea —— 断言照样绿，
       但它验的根本不是登录页（假绿，比不验更糟）。
       所以先登出，量完再登回来：第 12 节的登出流程还需要一个有效会话。 */
    await cdp.eval(`fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }).then(r => r.ok)`);
    await cdp.goto(BASE + '/login');
    await sleep(500);
    check('（前置）登出后确实停在登录页',
      await cdp.eval('!!document.querySelector(".auth-form-wrap")'),
      await cdp.eval('location.pathname'));
    m = await cdp.eval(MOBILE_PROBE);
    check('登录页窄屏无横向溢出', m.overflow <= 1, m.overflow + 'px');
    /* 登录页原来**没有**这条断言：可点控件名单里一个 .auth-* 都没有，
       于是「← 返回首页」（16px）和「先免注册试用一下」（17px）从来没被量过 ——
       而后者是落到这一页又不想注册的人**唯一**的出口。 */
    /* ⚠️ 390 上登录页**只渲染右栏** —— 左栏 `.auth-brand` 在 ≤980 是
       `display:none`（见 main.css），所以「← 返回首页」和页头 logo 在这里
       量不到（实测 authBack: 0，不是选择器写错了）。
       左栏那份是给桌面端的（[11.6] 的 1024 上量得到）；窄屏这份
       `.auth-back-narrow` 才是手机上的唯一入口，见下面那条断言。 */
    check('（前置）登录页量到了免注册出口与窄屏返回入口（左栏在 390 上是隐藏的）',
      m.named.authGuest >= 1 && m.named.authBackNarrow >= 1, JSON.stringify(m.named));
    /* 左栏要藏的是**品牌宣传语**，回首页是**导航**，不该跟着一起消失。
       忘了挂窄屏这份 = 手机用户从登录页回不到首页 —— 页面不崩、不报错，
       只是那个出口没了（静默失效的典型形状）。 */
    check('登录页窄屏有回首页的入口（左栏那份藏了，这条是唯一入口）',
      m.named.authBackNarrow >= 1, 'authBackNarrow=' + m.named.authBackNarrow);
    check('登录页窄屏可点控件都 ≥44px',
      m.tooSmall.length === 0,
      m.tooSmall.length ? JSON.stringify(m.tooSmall) : m.targets + ' 个全部达标');
    // <16px 会让 iOS 在聚焦瞬间把整页放大，而且不会自己缩回去
    check('登录页表单字号 ≥16px（防 iOS 聚焦放大）',
      m.formFont !== null && parseFloat(m.formFont) >= 16, m.formFont);
    await cdp.shot(path.join(SHOT_DIR, '21-mobile-login.png'));

    await cdp.eval(`fetch('/api/auth/login', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: ${JSON.stringify(username)}, password: 'test123456' })
    }).then(r => r.ok)`);

    // 更小的机型（iPhone SE 一档）：两个大按钮并排最容易在这里挤爆
    await setPhone(360, 640);
    await cdp.goto(BASE + '/');
    await sleep(500);
    m = await cdp.eval(MOBILE_PROBE);
    check('360px 窄机上落地页也无横向溢出', m.overflow <= 1, m.overflow + 'px');
    await cdp.shot(path.join(SHOT_DIR, '22-mobile-360.png'));

    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: false });
    await cdp.send('Emulation.clearDeviceMetricsOverride');
    await cdp.goto(BASE + '/app.html');
    await sleep(700);
    check('（前置）手机端流程走完后登录态还在（第 12 节要用）',
      await cdp.eval('!!document.getElementById("userBtn")'),
      await cdp.eval('location.pathname'));

    /* ---------------- 11.6 宽屏触摸设备（iPad） ----------------
       ⚠️ 这一节存在的唯一理由：上面 [11.5] 用的视口是 390 / 360，
       而触摸目标那套规则**曾经**挂在 `@media (max-width: 720px)` 上 ——
       于是 768 的 iPad、1194 的 iPad Pro 一条都拿不到，而 390 的
       手机全绿。**同一个缺陷，窄屏那一轮量不出来，必须换一个比 720
       宽的视口再量一遍。** 这是「断言要量对设备」：属性量对了，
       但量在了错误的设备上，等于没量。
       下面的 1024×768 必须同时满足两个条件：**触摸设备** + **宽于 720**。
       少了触摸模拟，(hover: none) 不匹配，整节会变成「那套样式压根
       没跑」的假绿 —— 所以「(hover: none) 匹配上了」本身也是一条断言。 */
    console.log('\n[11.6] 宽屏触摸设备（iPad）');
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    /* ⚠️ 登录页只有在**登出态**才看得到（登录态下 /login 会被立刻弹回工作台）。
       但后面 [12] 节要用登录态 —— [11.5] 末尾刚断言过「登录态还在」。
       所以这里**不能调 /api/auth/logout**：它会在服务端 destroySession，
       那个 token 就永久失效了，事后写回 cookie 也救不回来。
       09-23 就踩了这个：整节 [12] 跑在一张登录页上，报出来的却是
       「哨兵文案表没生效」+「Cannot set properties of null」——
       指向完全不相干的地方，看着像 i18n 坏了。
       正确做法：只在**浏览器侧**把 cookie 摘掉，服务端会话原封不动 ——
       量完把同一个 token 写回去，状态与进来时逐字节相同。 */
    await cdp.send('Network.enable');
    const jar = await cdp.send('Network.getCookies', { urls: [BASE + '/'] });
    const sess = (jar.cookies || []).find((c) => c.name === 'pl_session') || null;
    check('（前置）量登录页之前拿到了会话 cookie（量完要原样写回）', !!sess, sess ? '有' : '没有');
    if (sess) await cdp.send('Network.deleteCookies', { name: 'pl_session', url: BASE + '/' });
    await cdp.send('Emulation.setDeviceMetricsOverride',
      { width: 1024, height: 768, deviceScaleFactor: 2, mobile: true });

    // ---- 落地页 ----
    await cdp.goto(BASE + '/');
    await sleep(600);
    m = await cdp.eval(MOBILE_PROBE);
    check('（前置）宽屏触摸设备上 (hover: none) 仍然匹配', m.hoverNone === true, 'coarse=' + m.coarse);
    check('（前置）iPad 落地页量到了 logo / 导航 / 语言菜单 / 页脚语言链接',
      m.named.logo >= 1 && m.named.navLink >= 4 && m.named.langMenuBtn >= 1 && m.named.langLink >= 1,
      JSON.stringify(m.named));
    check('iPad 落地页可点控件都 ≥44px（触摸目标不挂在宽度断点上）',
      m.tooSmall.length === 0,
      m.tooSmall.length ? JSON.stringify(m.tooSmall) : m.targets + ' 个全部达标');
    check('iPad 落地页无横向溢出', m.overflow <= 1, m.overflow + 'px');

    // ---- 登录页 ----
    await cdp.goto(BASE + '/login');
    await sleep(800);
    m = await cdp.eval(MOBILE_PROBE);
    check('（前置）iPad 登录页量到了语言选择器与登录/注册标签',
      m.named.langSelect >= 1 && m.named.tab >= 2, JSON.stringify(m.named));
    /* 守的是**另一个方向**：窄屏那份是兜底，宽屏不该同时露两份。
       少了这条，把 .auth-back-narrow 的 `display: none` 默认值删掉
       不会有任何断言变红 —— 而桌面端会冒出两个「← 返回首页」。 */
    check('iPad 登录页只露一份回首页入口（左栏那份，窄屏那份藏着）',
      m.named.authBack >= 1 && m.named.authBackNarrow === 0,
      'authBack=' + m.named.authBack + ' authBackNarrow=' + m.named.authBackNarrow);
    check('iPad 登录页可点控件都 ≥44px（语言选择器 30→44、标签 38→44）',
      m.tooSmall.length === 0,
      m.tooSmall.length ? JSON.stringify(m.tooSmall) : m.targets + ' 个全部达标');
    check('iPad 表单字号 ≥16px（防 iOS 聚焦放大 —— iPad 同样会放大）',
      m.formFont !== null && parseFloat(m.formFont) >= 16, m.formFont);

    /* 把会话原样写回 —— [12] 节依赖登录态。写回后立刻回读验一次：
       只调 setCookie 不看结果的话，cookie 被拒了也不知道，
       症状和上面那次一样（[12] 节跑在登录页上）。 */
    if (sess) {
      const back = { name: sess.name, value: sess.value, url: BASE + '/' };
      if (typeof sess.sameSite === 'string') back.sameSite = sess.sameSite;
      if (sess.httpOnly) back.httpOnly = true;
      await cdp.send('Network.setCookie', back);
      const again = await cdp.send('Network.getCookies', { urls: [BASE + '/'] });
      check('（前置）会话 cookie 已原样写回（[12] 节要用登录态）',
        (again.cookies || []).some((c) => c.name === 'pl_session' && c.value === sess.value),
        (again.cookies || []).map((c) => c.name).join(','));
    }

    /* ---------------- 11.7 极窄屏（320px） ----------------
       ⚠️ 320 是响应式设计的常规下限，也是分屏、老机型会落到的宽度。
       原来体检只到 360 —— 而页头三件套（logo 136.6 + 语言菜单 79 + CTA 84）
       加两个 12px 间距一共 343.6px，**这三个数不随视口变**（都不收缩），
       所以 360 只是「刚好够」（余 16.4px），320 直接撑出去 24px、整页能左右拖。
       换句话说：**体检的宽度集合本身也会成为盲区** —— 只测 360 及以上，
       这一格永远看不见。 */
    console.log('\n[11.7] 极窄屏（320px）');
    await cdp.send('Emulation.setDeviceMetricsOverride',
      { width: 320, height: 568, deviceScaleFactor: 2, mobile: true });

    await cdp.goto(BASE + '/');
    await sleep(600);
    m = await cdp.eval(MOBILE_PROBE);
    check('（前置）320px 上 (hover: none) 仍匹配', m.hoverNone === true, 'coarse=' + m.coarse);
    check('320px 落地页无横向溢出（页头三件套放不下就会撑宽整页）',
      m.overflow <= 1, m.overflow + 'px');
    check('320px 落地页可点控件都 ≥44px',
      m.tooSmall.length === 0,
      m.tooSmall.length ? JSON.stringify(m.tooSmall) : m.targets + ' 个全部达标');

    /* 工作台（[11.6] 刚把会话写回，这里是登录态）。 */
    await cdp.goto(BASE + '/app.html');
    await sleep(900);
    m = await cdp.eval(MOBILE_PROBE);
    check('320px 工作台无横向溢出（逐元素量 .app-shell）',
      m.shellOverflow !== null && m.shellOverflow <= 1, 'shell 溢出 ' + m.shellOverflow + 'px');
    check('320px 工作台可点控件都 ≥44px',
      m.tooSmall.length === 0,
      m.tooSmall.length ? JSON.stringify(m.tooSmall) : m.targets + ' 个全部达标');

    /* 页头宽度是**按语种变**的：三件套里语言菜单和 CTA 都是译过来的，
       英语最宽（CTA「Get started」97.9px，中文「开始使用」84px）——
       实测末项右缘 ja 313.6 / zh 343.6 / **en 347.1**。
       而这一整轮套件跑的是**中文**：中文那几档守不住英语，所以英语要单独量一遍。
       375 是 iPhone SE 2/3、12/13 mini 的真实宽度，属于必测；
       365 不是真机宽度，是**余量下限**探针，专门把「碰巧够」变成「有余量」。
       ⚠️ 这两条量的是「**有没有溢出**」，**不是**「离右缘还剩多少余量」。
       09-24 删掉 main.css 里 ≤390 那一档时才看清：英语在 365 上不收边距也只是
       末项右缘 347.1（多吃 2px 右内边距），并不溢出 ——
       所以别把这两条当成「≤390 那一档」的配对断言，那一档已经删了。 */
    await cdp.send('Emulation.setDeviceMetricsOverride',
      { width: 375, height: 667, deviceScaleFactor: 2, mobile: true });
    await cdp.goto(BASE + '/en/');
    await sleep(600);
    const enLang = await cdp.eval('document.documentElement.lang');
    check('（前置）英语落地页确实是 en（量到中文页这条就白测了）', enLang === 'en', enLang);
    m = await cdp.eval(MOBILE_PROBE);
    check('英语落地页 375px（iPhone SE 2/3 的真实宽度）无横向溢出',
      m.overflow <= 1, m.overflow + 'px');

    await cdp.send('Emulation.setDeviceMetricsOverride',
      { width: 365, height: 667, deviceScaleFactor: 2, mobile: true });
    await cdp.goto(BASE + '/en/');
    await sleep(600);
    m = await cdp.eval(MOBILE_PROBE);
    check('英语落地页 365px 无横向溢出（页头三件套的余量下限）',
      m.overflow <= 1, m.overflow + 'px');

    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: false });
    await cdp.send('Emulation.clearDeviceMetricsOverride');

    /* ---------------- 12. 多语言：还有没有「没接线的中文」 ---------------- */
    console.log('\n[12] 多语言：界面里还有没有「没接线的中文」');

    /* 允许出现的中文 = 知识库 + 对照示例 + **测试自己输入的内容**。
       最后一项最容易漏：测试把中文写进输入框，那句话会一路进到成品里，
       不放进白名单就会被当成「界面漏翻」—— 假警报比不报还糟。 */
    const LEAK_ALLOW = buildContentAllowList(KNOWLEDGE, DEMOS).concat([
      '帮我写一篇关于远程办公的公众号文章，要给公司同事看的',
      '一只戴着宇航头盔的橘猫，坐在月球表面',
      '一个人走在雨夜的城市街头，霓虹灯的倒影落在积水里',
      '测试用户',
      // 头像那个首字母圆圈只渲染一个「测」字 —— 也是用户自己的数据
      '测',
    ]);

    const pseudoHook = await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: PSEUDO_UI_SOURCE });
    await cdp.goto(BASE + '/app.html');
    await sleep(700);
    check('（前置）哨兵文案表已生效（界面文案全变成哨兵）',
      await cdp.eval('window.__PL_PSEUDO_UI__ === true && !!document.querySelector(".app-shell")'),
      await cdp.eval('String(window.__PL_PSEUDO_UI__)'));

    const scanLeaks = async (stage) => {
      const leaks = await cdp.eval(LEAK_PROBE(LEAK_ALLOW));
      check('[' + stage + '] 界面上没有「没接线的中文」', leaks.length === 0,
        leaks.length ? leaks.length + ' 处（明细见上）' : '');
      if (leaks.length) {
        leaks.forEach((x) => {
          // 残渣里的 \u0000 是白名单剥掉的痕迹，打成 ␀ 才看得出剥到哪儿了
          const rest = String(x.rest || '').split('\u0000').join('␀');
          console.log('      · ' + x.where + (x.at ? ' ' + x.at : '') + ' 「' + x.hit + '」'
            + '   ← 原文：' + x.sample
            + '   ｜剥完剩：' + rest);
        });
      }
      return leaks;
    };

    /* ---------------- 12.0 登录页也要扫 ----------------
       ⚠️ 登录页是**唯一一个不跑 app.html 那套脚本**的页面，而它上面有 24 个
       data-i18n 和 14 处 T('…')（它自己起的别名，见下面的静态扫描那一节）。
       不扫它的后果不是「少几条」，是**整页**：登录页从来就没进过
       _ui-keys.json，于是生成器眼里它「不存在」，五个语种的 ui.*.js 里
       一条登录页文案都没有 —— 英文站上点「Log in / Sign up」跳过去的
       是一整页中文，而且所有检查都是绿的。**这是最标准的静默失效。**

       为什么不能直接 goto('/login')：登录态下 login.html 里的 API.me()
       一成功就把人弹回工作台，哨兵表再灵也量不到它。所以照 [11.6] 那套来 ——
       只在**浏览器侧**摘掉 cookie，服务端会话原封不动，量完把同一个 token
       写回去。（09-23 踩过：那次调了 /api/auth/logout，token 永久失效，
       整节 [12] 跑在登录页上，报出来的是「哨兵文案表没生效」，指向完全
       不相干的地方。） */
    /* ⚠️ 界面 key 要**跨文档累加**：__PL_UI_KEYS__ 是每个文档各一份的
       （addScriptToEvaluateOnNewDocument 每次导航都重跑，seen 是新对象）。
       登录页和 app.html 是两个文档，读完必须自己合并，否则导航一走就丢。 */
    const uiKeysMerged = Object.create(null);
    const collectKeys = async () => {
      const raw = await cdp.eval('JSON.stringify(window.__PL_UI_KEYS__ || {})');
      const obj = JSON.parse(raw);
      let n = 0;
      Object.keys(obj).forEach((k) => { uiKeysMerged[k] = (uiKeysMerged[k] || 0) + obj[k]; n += 1; });
      return n;
    };

    await cdp.send('Network.enable');
    const ljJar = await cdp.send('Network.getCookies', { urls: [BASE + '/'] });
    const ljSess = (ljJar.cookies || []).find((c) => c.name === 'pl_session') || null;
    check('（前置）扫登录页之前拿到了会话 cookie（量完要原样写回）', !!ljSess, ljSess ? '有' : '没有');
    if (ljSess) await cdp.send('Network.deleteCookies', { name: 'pl_session', url: BASE + '/' });

    await cdp.goto(BASE + '/login');
    await sleep(700);
    check('（前置）登录页上哨兵文案表已生效（这一节要是跑在工作台上就全白测了）',
      await cdp.eval('window.__PL_PSEUDO_UI__ === true && !!document.querySelector(".auth-shell")'),
      await cdp.eval('location.pathname + " " + document.title'));
    await scanLeaks('登录页');

    /* 登录页有**两个状态**，只扫一个等于只扫一半：切到注册标签会换掉
       标题、说明、提交按钮，还有底部那句「已经有账号了？去登录」。
       ⚠️ 后面这两句是**拼出来**的（`T(question + '{link}')`），
       静态扫描看不见 —— 不切标签它们就永远进不了清单，
       于是英文用户一切到注册标签就看到两句中文。 */
    /* ⚠️ 选择器里的引号必须用**模板字符串**包，不能写成单引号串里的 \" ——
       JS 解析字符串字面量时会把 \" 变成 "，发到页面上就成了
       `querySelector(".tab[data-tab="register"]")`，直接 SyntaxError。
       症状是「页面异常: missing ) after argument list」，而且整节从这里断掉。 */
    await cdp.eval(`document.querySelector('.tab[data-tab="register"]').click()`);
    await sleep(250);
    await scanLeaks('登录页·注册');
    const loginKeyCount = await collectKeys();
    /* 这条守的是「扫了等于没扫」：清单是空的、或者导航之后才去读，
       都会让登录页的 key 一条都进不来，而别的断言照样全绿。 */
    check('（前置）登录页真的贡献了界面 key（不然扫了等于没扫）',
      loginKeyCount >= 20, loginKeyCount + ' 条');

    /* 会话原样写回，并**回读验一次** —— 只调 setCookie 不看结果的话，
       cookie 被拒了也不知道，后面几节会莫名其妙地跑在未登录态上。 */
    if (ljSess) {
      const ljBack = { name: ljSess.name, value: ljSess.value, url: BASE + '/' };
      if (typeof ljSess.sameSite === 'string') ljBack.sameSite = ljSess.sameSite;
      if (ljSess.httpOnly) ljBack.httpOnly = true;
      await cdp.send('Network.setCookie', ljBack);
      const ljAgain = await cdp.send('Network.getCookies', { urls: [BASE + '/'] });
      check('（前置）会话 cookie 已原样写回（下面的界面都靠登录态）',
        (ljAgain.cookies || []).some((c) => c.name === 'pl_session' && c.value === ljSess.value),
        (ljAgain.cookies || []).map((c) => c.name).join(','));
    }

    await cdp.goto(BASE + '/app.html');
    await sleep(700);
    check('（前置）扫完登录页回到了工作台（登录态还在）',
      await cdp.eval('!!document.querySelector(".app-shell")'),
      await cdp.eval('location.pathname'));

    // 输入页：顶栏、场景网格、分析条、按钮
    await scanLeaks('输入页');

    // 文字链路：输入 → 多轮 → 结果
    await cdp.eval(`(() => {
      const ta = document.getElementById('rawPrompt');
      ta.value = '帮我写一篇关于远程办公的公众号文章，要给公司同事看的';
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    })()`);
    await sleep(500);
    await cdp.eval('document.getElementById("startBtn").click()');
    await sleep(400);

    let lkRound = 0;
    while (lkRound < 15) {
      const done = await cdp.eval('!document.getElementById("stageResult").classList.contains("hidden")');
      if (done) break;
      const blocks = await cdp.eval('document.querySelectorAll(".q-block").length');
      if (!blocks) break;
      lkRound += 1;
      if (lkRound === 1) await scanLeaks('问答页');
      await cdp.eval(`(() => {
        document.querySelectorAll('.q-block').forEach(b => {
          const opts = Array.from(b.querySelectorAll('.option-btn'))
            .filter(x => !x.classList.contains('is-skip') && !x.classList.contains('is-custom'));
          if (!opts.length) return;
          opts[0].click();
          const isMulti = b.querySelector('.q-multi-note');
          if (isMulti && opts[1]) opts[1].click();
        });
        return true;
      })()`);
      await cdp.eval('document.getElementById("nextBtn").click()');
      await sleep(240);
    }
    check('（前置）多语言这一节也走完了文字链路', lkRound >= 5, '轮数=' + lkRound);
    if (lkRound === 0) {
      // 走不起来的时候要说清楚卡在哪 —— 否则「0 轮」这条断言只会让人去猜
      console.log('      诊断：' + await cdp.eval(`JSON.stringify({
        stage: ['stageInput', 'stageRounds', 'stageResult'].filter((i) => {
          const e = document.getElementById(i);
          return e && !e.classList.contains('hidden');
        }),
        typed: document.getElementById('rawPrompt').value.length,
        startDisabled: document.getElementById('startBtn').disabled,
        toast: document.getElementById('toastWrap').textContent,
        err: String(window.__PL_LAST_ERROR__ || ''),
      })`));
      console.log('      页面异常：' + JSON.stringify(cdp.events
        .filter((e) => e.method === 'Runtime.exceptionThrown')
        .map((e) => (e.params.exceptionDetails.exception || {}).description || '')
        .slice(-3)));
    }
    await sleep(500);
    await scanLeaks('结果页·文字');

    // 分镜链路：多镜头视频 → 分镜表 → 打开编辑器
    // 编辑器是**动态拼出来**的一整块界面（下拉、按钮、提示、占位符），
    // 写死中文的机会最多，不扫它等于没扫。
    await cdp.eval(`(() => {
      const btn = Array.from(document.querySelectorAll('.scenario-btn'))
        .find(b => b.textContent.indexOf('视频生成') !== -1);
      if (btn) btn.click();
      return !!btn;
    })()`);
    await sleep(300);
    await cdp.eval(`(() => {
      const ta = document.getElementById('rawPrompt');
      ta.value = '一个人走在雨夜的城市街头，霓虹灯的倒影落在积水里';
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    })()`);
    await sleep(500);
    await cdp.eval('document.getElementById("startBtn").click()');
    await sleep(400);

    let lkVidRound = 0;
    while (lkVidRound < 15) {
      const done = await cdp.eval('!document.getElementById("stageResult").classList.contains("hidden")');
      if (done) break;
      const blocks = await cdp.eval('document.querySelectorAll(".q-block").length');
      if (!blocks) break;
      lkVidRound += 1;
      // 景别题上勾 4 个（要凑出多镜头分镜表）、时长题上勾第一个
      await cdp.eval(`(() => {
        document.querySelectorAll('.q-block').forEach(b => {
          const opts = Array.from(b.querySelectorAll('.option-btn'))
            .filter(x => !x.classList.contains('is-skip') && !x.classList.contains('is-custom'));
          if (!opts.length) return;
          const qid = b.dataset.qid || '';
          const want = qid === 'vid.shot' ? Math.min(4, opts.length) : 1;
          for (let i = 0; i < want; i += 1) opts[i].click();
        });
        return true;
      })()`);
      await cdp.eval('document.getElementById("nextBtn").click()');
      await sleep(240);
    }
    await sleep(500);
    await scanLeaks('结果页·分镜方案');

    const lkBoardBtn = await cdp.eval(`(() => {
      const b = document.getElementById('editBoardBtn');
      if (!b || b.classList.contains('hidden')) return '';
      b.click();
      return b.textContent;
    })()`);
    if (lkBoardBtn) {
      await sleep(500);
      await scanLeaks('分镜表编辑器');
    }
    check('（前置）多语言这一节打开过分镜表编辑器', !!lkBoardBtn, lkBoardBtn);

    await cdp.eval('document.getElementById("userBtn").click()');
    await sleep(200);
    await scanLeaks('账号菜单');

    /* 把「界面到底问了哪些 key」落盘，给翻译用。
       ------------------------------------------------------------------
       为什么由**浏览器**来出这份清单，而不是静态扫源码：
         · HTML 上的 `data-i18n`（不写值）取的是**元素的文字**，静态扫描
           要么得解析 HTML、要么只能看见空属性；
         · JS 里的 key 有一部分是拼出来的（`t('第 {n} 轮', …)`），
           还有一部分在模板字符串里，正则扫容易多扫也容易漏扫。
       而 `t()` 只要被调用就一定经过哨兵表 —— 跑一遍六个界面，
       清单自然是全的。**它是运行时的事实，不是源码的猜测。**
       唯一的前提是六个界面都要走到（上面的 scanLeaks 已经保证）。 */
    await collectKeys();                      // 把 app.html 这一份并进来
    const allKeys = Object.keys(uiKeysMerged).sort();
    const cjkKeys = allKeys.filter((k) => /[\u3000-\u303f\u4e00-\u9fff\uff01-\uff60]/.test(k));
    const outFile = path.join(__dirname, 'i18n-src', '_ui-keys.json');
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, JSON.stringify({
      note: '由 scripts/browser-check.js 第 12 节生成，别手改。界面文案以中文原文为 key，'
        + '所以这里只列含中文的那些 —— 不含中文的是 ASCII key（如 unit.score），另有维护。',
      keys: cjkKeys,
    }, null, 2) + '\n');
    check('（前置）界面 key 清单已落盘且不是空的', cjkKeys.length >= 100,
      cjkKeys.length + ' 条（共 ' + allKeys.length + ' 个 key）');
    console.log('      → scripts/i18n-src/_ui-keys.json');

    // 用户自己输入的话**不该**进 key 清单。进了就说明有人在拿用户内容当 key ——
    // 那种情况下，只要译文表里恰好有这一条，用户打进去的原话就会被改写成译文。
    // ⚠️ 探针挂了的时候 key 清单是空的，「没有可疑 key」会**假绿** —— 所以先看探针活没活。
    if (cjkKeys.length < 100) {
      console.log('      ⚠️ 哨兵探针没跑起来，下面两条没法判断（看上一条的失败）');
    } else {
      /* ⚠️ 这里**不能**用「输入框里那几句话出现了就是泄漏」来判 ——
         它们本来就是界面文案，见 workspace.js 的 SAMPLES：
             text:  t('帮我写一篇关于远程办公的公众号文章，要给公司同事看的')
             image: t('一只戴着宇航头盔的橘猫，坐在月球表面')
             video: t('一个人走在雨夜的城市街头，霓虹灯的倒影落在积水里')
         示例文案必须跟着语种换，否则英语用户点「试试」看到的是一句中文。
         所以这里反过来断言：**它们必须在清单里**。少了就是没接线。 */
      const SAMPLES = [
        '帮我写一篇关于远程办公的公众号文章，要给公司同事看的',
        '一只戴着宇航头盔的橘猫，坐在月球表面',
        '一个人走在雨夜的城市街头，霓虹灯的倒影落在积水里',
      ];
      const absent = SAMPLES.filter((k) => cjkKeys.indexOf(k) === -1);
      check('（前置）三条示例文案都在界面 key 清单里（换语种要跟着换）', absent.length === 0,
        absent.length ? absent.map((k) => JSON.stringify(k)).join(' / ') : '');
    }

    /* 哨兵表用完就撤 —— 它是**第 12 节专用**的。
       ⚠️ 不撤的话，下面这一节里 zh-Hans 那一轮拿到的 `PromptLensUi['zh-Hans']`
       仍然是那个 Proxy（哨兵表的 `set` 陷阱会把真包吞掉），
       于是「屏幕上是这个语种自己的字」这条断言对 zh-Hans 恒为 0 命中。
       更糟的是它会掩盖一个真实事实：**这一节要装的是真包**。
       `Page.removeScriptToEvaluateOnNewDocument` 之后，新开的文档才不再注入。 */
    if (pseudoHook && pseudoHook.identifier) {
      await cdp.send('Page.removeScriptToEvaluateOnNewDocument', { identifier: pseudoHook.identifier });
    }
    /* 注意：**这里不能断言**「哨兵已经没了」—— 当前这份文档是撤之前加载的，
       `__PL_PSEUDO_UI__` 还是 true。真正的判据放在下面：
       基准快照（zh-Hans）必须是真中文、且不含 `@@`。 */

    /* ---------------- 13. 其他语种：装的是**真的**文案包 ---------------- */
    console.log('\n[13] 各语种界面（真文案包，每种跑一遍完整链路）');

    /* 这一节和第 12 节是**两件事**，缺一不可：
     *
     *   第 12 节用**哨兵表**顶掉中文，证明「每一句都接了线」——
     *   它的本事是让「接了线但译文是中文」和「压根没接线」显出区别。
     *   但哨兵表会把**任何** key 都变成 `@@`，所以它照不出这几类问题：
     *     · 某个语种的文案包根本没装上（injectSync 拼错路径、404）
     *     · 装上了但知识库和界面来自**两个语种**（一半日文一半中文）
     *     · PromptLensActiveLocale 没发布，knowledge.js 默默退回 zh-Hans
     *   这几类的共同表现就是「用户看到中文」，而第 12 节全绿。
     *
     * ⚠️ 而「界面上一个汉字都不该有」这条**只对 en / es / ko 成立**。
     *   ja 和 zh-Hant 的界面上本来就该有汉字 —— 拿汉字当判据，
     *   这两个语种会满屏假警报，而假警报比没有警报更糟：
     *   它会被当成噪音关掉，真漏翻混在里面就再也看不见了。
     *   所以这里分成两把尺子：
     *     · en / es / ko：中日韩字符**一个都不许有**（空白名单的 LEAK_PROBE）
     *     · ja / zh-Hant：换一把**不看字符种类**的尺子 ——
     *       找「整块等于中文 key」的文本（MISS_PROBE），
     *       那才是「这个 key 没译」的直接证据
     *   两把尺子之外，所有语种（含 zh-Hans 自己）都验同一组**共有的**事实：
     *     <html lang> / 活动语种 / 两份包都装上 /
     *     屏幕上确实是这个语种自己的字（拿它自己包里的值去页面里找）/
     *     输入页文案与 zh-Hans 那一版不同 / 知识库节标题与 zh-Hans 不同 /
     *     对照示例真的挂载 / 成品 Prompt 用的是这个语种的节标题
     *
     * ⚠️ 前提是**换成干净账号**。前面十几节留下的历史记录是中文的
     *    （标题、场景名都是当时输入的内容），而历史记录是**用户数据** ——
     *    用户数据本来就不该被翻译，出现在这里不是漏翻。
     *    不换账号的话，这一节会稳定地报几处「中文」，全是自己的历史记录，
     *    真漏翻混在里面根本看不出来。
     */
    /* ⚠️ 光清 localStorage **不够** —— 会话是 cookie（pl_session）。
       不清 cookie 的话 /login 会被立刻跳回工作台，
       下面那句 querySelector('.tab[data-tab="register"]') 拿到 null，
       报出来的是「Cannot read properties of null (reading 'click')」，
       和「漏翻」八竿子打不着，排查会往错的方向跑。
       所以先正经登出（服务端会 Set-Cookie 把它清掉），再断言登录页真的到了。 */
    await cdp.eval('try { localStorage.clear(); } catch (e) {}');
    await cdp.eval('fetch("/api/auth/logout", { method: "POST" }).then(() => true)');
    await sleep(300);
    await cdp.goto(BASE + '/login');
    await sleep(400);
    check('（前置）这一节确实退出了登录（/login 没被跳回工作台）',
      (await cdp.eval('location.pathname')).indexOf('login') !== -1,
      await cdp.eval('location.pathname'));
    check('（前置）登录页有「注册」标签（否则注册不出干净账号）',
      await cdp.eval('!!document.querySelector(\'.tab[data-tab="register"]\')'),
      await cdp.eval('location.href'));

    const altUser = 'i18n' + Date.now().toString(36);
    await cdp.eval(`(() => {
      document.querySelector('.tab[data-tab="register"]').click();
      document.getElementById('username').value = ${JSON.stringify(altUser)};
      document.getElementById('password').value = 'test123456';
      document.getElementById('displayName').value = 'I18n Tester';
      document.getElementById('authForm').dispatchEvent(new Event('submit', {cancelable:true, bubbles:true}));
      return true;
    })()`);
    let altEntered = false;
    for (let i = 0; i < 40; i += 1) {
      await sleep(200);
      if ((await cdp.eval('location.pathname')).indexOf('app.html') !== -1) { altEntered = true; break; }
    }
    check('（前置）这一节用的是干净账号（历史里没有别的语种的记录）', altEntered,
      await cdp.eval('location.href'));

    /* 语种清单**从 i18n.js 读**，不在这里抄一份 ——
       抄了就会和源码脱节，而脱节的表现是「加了语种但没人验」。 */
    const I18N_SRC = require(path.join(JS_DIR, 'i18n.js'));
    const LOCALES_DIR = path.join(__dirname, '..', 'public', 'assets', 'locales');
    const CASES = I18N_SRC.LOCALES.filter((l) => l.ready);
    const BASE_TAG = 'zh-Hans';
    /* 界面上**本来就该有汉字**的语种 —— 对它们不能用「没有汉字」那把尺子。 */
    const HAN_UI = [BASE_TAG, 'zh-Hant', 'ja'];
    check('（前置）除了简体中文还有别的语种可选（否则这一节等于没跑）',
      CASES.filter((l) => l.tag !== BASE_TAG).length >= 1,
      CASES.map((l) => l.tag).join(','));

    /* 「译文没接上」的观察名单：中文 key 清单来自第 12 节落盘的那份，
       再剔掉「译文本来就等于 key」的（繁中的「，」这类），剩下的才是
       「出现了就说明 t() 查表没查到」的那些。 */
    const UI_KEYS_FILE = path.join(__dirname, 'i18n-src', '_ui-keys.json');
    const UI_KEYS = fs.existsSync(UI_KEYS_FILE)
      ? (JSON.parse(fs.readFileSync(UI_KEYS_FILE, 'utf8')).keys || []) : [];
    check('（前置）界面 key 清单可用（第 12 节落盘的）', UI_KEYS.length >= 100,
      UI_KEYS.length + ' 条');
    const watchKeys = (tag) => {
      const p = path.join(LOCALES_DIR, 'ui.' + tag + '.js');
      if (!fs.existsSync(p)) return [];
      const key = require.resolve(p);
      delete require.cache[key];
      const mod = require(p);
      /* ⚠️ 界面包的 `module.exports` 是**整包**（`{ tag, ui }`），译文在 `.ui` 里。
           直接拿 `mod[k]` 查会恒为 undefined → 观察名单恒为空 →
           下面那条「没接线」的断言**看起来跑了其实一条都没查**。
           所以兼容两种形状，并且调用方要断言名单不是空的。 */
      const pack = (mod && mod.ui) || mod || {};
      return UI_KEYS.filter((k) => {
        const v = pack[k];
        return typeof v === 'string' && v !== k;
      });
    };

    /* 每种语种自己写一句「该语种的真话」进去 ——
       输入框里的字是**用户内容**，不参与翻译，但引擎要靠它认出场景。
       用中文句子去跑日文链路的话，会掉进 general，后面那些题根本不会出现。 */
    const SAMPLE_TEXT = {
      'zh-Hans': '帮我写一篇关于远程办公利弊的公众号文章，要给公司同事看的，语气口语一点，大约 800 字。',
      'zh-Hant': '幫我寫一篇關於遠距工作優缺點的部落格文章，要給公司同事看的，語氣口語一點，大約 800 字。',
      en: 'Write a blog post about the pros and cons of remote work for my team. Keep it conversational and around 800 words.',
      ja: 'リモートワークのメリットとデメリットについて、チーム向けのブログ記事を書いてください。口語的に、800 字程度で。',
      ko: '재택근무의 장단점에 대해 팀에 공유할 블로그 글을 써 주세요. 구어체로, 800자 정도로요.',
      es: 'Escribe un artículo de blog sobre las ventajas y desventajas del teletrabajo para mi equipo. Con un tono coloquial y unas 800 palabras.',
    };

    /* ⚠️ 每换一个语种就要把历史记录清空。
       历史记录的标题就是**用户输入的原话**（上一种语言的句子），
       而它是用户数据、不该被翻译 —— 但它会出现在侧栏上。
       不清的话，en / es / ko 那几轮会稳定地扫到「zh-Hant 的历史记录标题」，
       报成漏翻，而真漏翻混在里面就看不出来了。
       （这正是「换干净账号」那条注释说的同一件事，只是现在要重复六遍。） */
    const wipeProjects = async () => {
      const n = await cdp.eval(`(async () => {
        const r = await fetch('/api/projects', { credentials: 'same-origin' });
        const j = await r.json();
        /* ⚠️ 服务端的信封是 \`{ ok, data }\`，列表在 \`data.projects\` 里，
           不在顶层 \`projects\`。写成 \`j.projects\` 的话 list 恒为空数组 ——
           不报错、静默什么也没删，然后下一轮扫出一堆「漏翻」，
           而它们全是上一种语言的历史记录。 */
        const list = (j && j.data && j.data.projects) || [];
        for (const p of list) {
          await fetch('/api/projects/' + p.id, { method: 'DELETE', credentials: 'same-origin' });
        }
        return list.length;
      })()`);
      return n;
    };

    /* 每个语种 --font / --serif 里**必须出现**的字族。
       注意 serif 也要分开查：ja 的正文换成 Yu Gothic 了、
       标题却还可能是 SimSun（中文明体）—— 只查一个等于漏一半。 */
    const WANT_STACK = {
      'zh-Hans': { font: /PingFang SC|Microsoft YaHei/, serif: /Songti SC|SimSun/ },
      'zh-Hant': { font: /PingFang TC|Microsoft JhengHei/, serif: /Songti TC|PMingLiU/ },
      ja: { font: /Hiragino Sans|Yu Gothic/, serif: /Hiragino Mincho|Yu Mincho/ },
      ko: { font: /Apple SD Gothic Neo|Malgun Gothic/,
        serif: /Noto Serif KR|Nanum Myeongjo|Batang/ },
      en: { font: /-apple-system|Segoe UI/, serif: /Georgia/ },
      es: { font: /-apple-system|Segoe UI/, serif: /Georgia/ },
    };

    /* 一次「进页面就把能读的都读下来」的快照。
       `uiVals` 是这个语种界面包里的**全部值** —— 拿它去页面里找，
       找到了就证明「屏幕上确实是这个语种自己的字」，而不是中文兜底、
       也不是另一个语种串了进来。这一步不看字符种类，所以 ja / zh-Hant 同样适用。 */
    const snapshot = async (tag) => {
      await cdp.goto(BASE + '/app.html?lang=' + tag);
      await sleep(900);
      return JSON.parse(await cdp.eval(`JSON.stringify({
        lang: document.documentElement.lang,
        tag: window.PromptLensActiveLocale,
        kb: !!(window.PromptLensLocales || {})[${JSON.stringify(tag)}],
        ui: !!(window.PromptLensUi || {})[${JSON.stringify(tag)}],
        body: String(document.body.innerText || '').replace(/\\s+/g, ' ').trim(),
        attrs: (function () {
          /* 可见文本之外还要收**属性上的文案**（placeholder / title / aria-label）。
             不收的话，「屏幕上出现的是这个语种自己的字」这条只剩十来个文本节点可查，
             命中数贴着阈值，改一处界面就会假红。
             ⚠️ 只收这几个属性，**不能**收 innerHTML —— 那里面含着整份文案包的
             <script> 源码，等于拿答案对答案，这条断言就废了。 */
          const out = [];
          document.querySelectorAll('*').forEach((el) => {
            ['placeholder', 'title', 'aria-label', 'alt'].forEach((a) => {
              const v = el.getAttribute && el.getAttribute(a);
              if (v) out.push(v);
            });
          });
          return out.join(' \\u0001 ');
        })(),
        docTitle: document.title,
        /* 字族按语种覆盖了没有。量 :root 上这两个变量的**计算值** ——
           它们来自 main.css 的 :root:lang(ja) / :lang(ko) / :lang(zh-Hant)，
           只有 <html lang> 写对了才生效。
           （平台字族那一层由 check-landing-live.js 量，两件事不重复。） */
        font: (function () {
          const cs = getComputedStyle(document.documentElement);
          return {
            font: cs.getPropertyValue('--font').replace(/\s+/g, ' ').trim(),
            serif: cs.getPropertyValue('--serif').replace(/\s+/g, ' ').trim(),
          };
        })(),
        uiVals: Object.keys((window.PromptLensUi || {})[${JSON.stringify(tag)}] || {})
          .map((k) => window.PromptLensUi[${JSON.stringify(tag)}][k]),
        titles: (function () {
          const S = (window.PromptLensKnowledge || {}).SECTION_TITLES || {};
          return Object.keys(S).map((k) => S[k]);
        })(),
        /* 知识库里**会渲染出来**的那些字（场景名、节标题、景别说明、评分项…）。
           为什么要连着界面包的值一起用：
           zh-Hans 的界面包是**故意几乎空的**（t() 查不到就返回 key，而 key 就是中文），
           只拿界面包的值去页面里找，zh-Hans 会 0 命中 —— 而那并不是故障。
           知识库包六种语种都是满的，拿它当第二把尺子，这条断言就对所有语种成立。 */
        kbVals: (function () {
          const K = window.PromptLensKnowledge || {};
          const out = [];
          const walk = (v) => {
            if (typeof v === 'string') { out.push(v); return; }
            if (Array.isArray(v)) { v.forEach(walk); return; }
            if (v && typeof v === 'object') Object.keys(v).forEach((k) => walk(v[k]));
          };
          ['SCENARIOS', 'SECTION_TITLES', 'SHOT_CONTENT', 'SHOT_ROLE',
            'SIGNAL_LABELS', 'FRAME_MODES'].forEach((k) => walk(K[k]));
          return out.slice(0, 400);
        })(),
      })`));
    };

    const baseSnap = await snapshot(BASE_TAG);
    const baseVisible = baseSnap.body + ' \u0001 ' + baseSnap.attrs + ' \u0001 ' + baseSnap.docTitle;
    check('（前置）拿到了 zh-Hans 的基准快照（后面的「换没换」都跟它比）',
      baseSnap.body.length > 200 && baseSnap.titles.length >= 8,
      baseSnap.body.length + ' 字符 / ' + baseSnap.titles.length + ' 个节标题');

    const problems = [];
    let baseDemoSample = '';
    for (let ci = 0; ci < CASES.length; ci += 1) {
      const tag = CASES[ci].tag;
      const isBase = tag === BASE_TAG;
      const hanOk = HAN_UI.indexOf(tag) !== -1;
      console.log('  ── ' + tag + ' ' + '─'.repeat(Math.max(0, 46 - tag.length)));

      /* 先把上一种语言留下的历史记录清掉，再进页面 —— 见 wipeProjects 的注释。 */
      const wiped = await wipeProjects();
      if (wiped) console.log('      （清掉上一种语言留下的 ' + wiped + ' 条历史记录）');

      const snap = await snapshot(tag);
      check('[' + tag + '] <html lang> 与活动语种都对',
        snap.lang === CASES[ci].htmlLang && snap.tag === tag,
        JSON.stringify({ lang: snap.lang, want: CASES[ci].htmlLang, tag: snap.tag }));
      check('[' + tag + '] 知识库与界面**两份**文案包都装上了', snap.kb && snap.ui,
        JSON.stringify({ kb: snap.kb, ui: snap.ui }));

      /* 字体栈：不按语种覆盖的话，日文的汉字会用**简体中文**字形渲染
         （--font 里第一个有汉字的字族是 PingFang SC / Microsoft YaHei），
         「直」「骨」「今」中日不同形，日本人一眼看出不对。
         这条查「选择器有没有咬上」；平台字族由 check-landing-live.js 查。 */
      const wantStack = WANT_STACK[tag];
      check('[' + tag + '] 正文字族按语种覆盖了（:lang 咬上了）',
        wantStack.font.test(snap.font.font), snap.font.font.slice(0, 72));
      check('[' + tag + '] 标题字族按语种覆盖了',
        wantStack.serif.test(snap.font.serif), snap.font.serif.slice(0, 72));

      /* 屏幕上必须是**这个语种自己的字**。
         判据不是「没有中文」，而是「它自己包里的值真的出现在页面上」——
         后者对六种语种一视同仁，而且如果包没装上 / 装串了，命中数会是 0。 */
      const visible = snap.body + ' \u0001 ' + snap.attrs + ' \u0001 ' + snap.docTitle;
      const shown = snap.uiVals.concat(snap.kbVals).filter((v) => typeof v === 'string'
        && v.length >= 2 && visible.indexOf(v) !== -1);
      check('[' + tag + '] 屏幕上出现的是这个语种自己的字（不是中文兜底、也没串语种）',
        shown.length >= 3, shown.length + ' 条命中');

      if (!isBase) {
        check('[' + tag + '] 输入页文案真的换了（不等于 zh-Hans 那一版）',
          visible !== baseVisible, snap.body.slice(0, 60));
        check('[' + tag + '] 知识库节标题真的换了（不是拿 zh-Hans 顶的）',
          snap.titles.join('|') !== baseSnap.titles.join('|'),
          snap.titles.slice(0, 3).join(' / '));
      }

      /* 第一把尺子：不该有汉字的语种，一个都不许有。 */
      const scanLeak = async (stage) => {
        const leaks = await cdp.eval(LEAK_PROBE([]));
        check('[' + tag + '·' + stage + '] 界面上没有中文', leaks.length === 0,
          leaks.length ? leaks.length + ' 处' : '');
        leaks.forEach((x) => {
          problems.push(tag + '·' + stage + ' 漏翻 ' + x.where + (x.at ? ' ' + x.at : '')
            + ' 「' + x.hit + '」   ← 原文：' + x.sample);
        });
      };
      /* 第二把尺子：所有语种都能用的「整块等于中文 key」扫描。 */
      const watch = watchKeys(tag);
      const scanMiss = async (stage) => {
        if (!watch.length) return;
        const miss = await cdp.eval(MISS_PROBE(watch));
        check('[' + tag + '·' + stage + '] 没有「查不到就原样返回中文 key」的界面文案',
          miss.length === 0, miss.length ? miss.length + ' 处' : '');
        miss.forEach((x) => {
          problems.push(tag + '·' + stage + ' 没接线 ' + x.where + (x.at ? ' ' + x.at : '')
            + ' 「' + x.hit + '」');
        });
      };
      if (isBase) {
        /* zh-Hans 自己不用跑这两把尺子：第 12 节的哨兵表就是为它准备的，
           而且它的「译文」本来就是中文，跑「没有中文」等于自己骂自己。
           但也不能就这么放过 —— 得断言它**确实回到了中文**，
           否则「哨兵表撤掉了」这件事本身没人验（撤失败的话，
           基准快照会是一堆 @@，后面所有「和 zh-Hans 不同」都会假绿）。 */
        check('（前置）zh-Hans 那一版拿到的是真中文，不是哨兵残留',
          /[\u4e00-\u9fff]/.test(snap.body) && snap.body.indexOf('@@') === -1,
          snap.body.slice(0, 50));
      } else {
        check('[' + tag + '] 「没接线」观察名单不是空的（否则上面那条断言等于没跑）',
          watch.length >= 50, watch.length + ' 条');
        if (!hanOk) await scanLeak('输入页');
        await scanMiss('输入页');
      }

      /* 走一遍文字链路：输入 → 多轮问答 → 结果。 */
      await cdp.eval(`(() => {
        const ta = document.getElementById('rawPrompt');
        ta.value = ${JSON.stringify(SAMPLE_TEXT[tag] || SAMPLE_TEXT.en)};
        ta.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      })()`);
      await sleep(400);
      await cdp.eval('document.getElementById("startBtn").click()');
      await sleep(400);

      let round = 0;
      /* 一路记着「这个语种下到底有没有见过文字对照示例」。
         ⚠️ 只靠上面的探针是不够的：示例**整块不挂载**时
         （demos 包没装上 / textSpecFor 返回 null）界面上干干净净，
         探针一条都找不到，于是「用户根本看不到示例」这件事全绿。
         这和「翻译漏了一半」是两种故障，得分别守。 */
      let demoSeen = 0;
      let demoSample = '';
      const countDemos = async () => {
        const got = JSON.parse(await cdp.eval(`JSON.stringify({
          n: document.querySelectorAll('.o-demo.is-text').length,
          s: (document.querySelector('.o-demo.is-text .d-line.is-after') || {}).textContent || '',
        })`));
        if (got.n) { demoSeen += got.n; if (!demoSample) demoSample = got.s.trim(); }
      };
      while (round < 12) {
        const done = await cdp.eval('!document.getElementById("stageResult").classList.contains("hidden")');
        if (done) break;
        const blocks = await cdp.eval('document.querySelectorAll(".q-block").length');
        if (!blocks) break;
        round += 1;
        if (round === 1 && !isBase) {
          if (!hanOk) await scanLeak('问答页');
          await scanMiss('问答页');
        }
        await countDemos();
        await cdp.eval(`(() => {
          document.querySelectorAll('.q-block').forEach((b) => {
            const opts = Array.from(b.querySelectorAll('.option-btn'))
              .filter((x) => !x.classList.contains('is-skip') && !x.classList.contains('is-custom'));
            if (!opts.length) return;
            opts[0].click();
            const isMulti = b.querySelector('.q-multi-note');
            if (isMulti && opts[1]) opts[1].click();
          });
          return true;
        })()`);
        await cdp.eval('document.getElementById("nextBtn").click()');
        await sleep(240);
      }
      check('[' + tag + '] 这一遍真的走完了文字链路（否则下面的成品断言等于没跑）',
        round >= 4, '轮数=' + round);
      check('[' + tag + '] 文字对照示例真的挂载了（不是整块不展示）', demoSeen > 0,
        demoSeen + ' 处');
      await sleep(500);
      if (!isBase) {
        if (!hanOk) await scanLeak('结果页');
        await scanMiss('结果页');
      }

      /* 再看一眼**成品**：界面上没中文不等于成品里没中文 ——
         成品的字是引擎拼出来的，节标题、评分项、用法说明都来自文案包。 */
      const prompt = await cdp.eval('String((document.getElementById("finalPrompt") || {}).textContent || "")');
      check('[' + tag + '] 成品 Prompt 不是空的', prompt.length > 200, prompt.length + ' 字符');
      const hitTitles = snap.titles.filter((t) => t && prompt.indexOf(t) !== -1);
      check('[' + tag + '] 成品里的节标题用的是这个语种的（至少 4 个）',
        hitTitles.length >= 4, hitTitles.length + ' / ' + snap.titles.length
          + '：' + hitTitles.slice(0, 3).join(' / '));
      if (!isBase) {
        check('[' + tag + '] 成品里的节标题不是 zh-Hans 那一版',
          snap.titles.join('|') !== baseSnap.titles.join('|')
            && hitTitles.every((t) => baseSnap.titles.indexOf(t) === -1),
          hitTitles.filter((t) => baseSnap.titles.indexOf(t) !== -1).slice(0, 3).join(' / '));
      }
      /* 对照示例的正文也得是这个语种的。 */
      if (isBase) baseDemoSample = demoSample;
      if (demoSample) {
        if (!hanOk) {
          check('[' + tag + '] 对照示例的正文里没有汉字',
            !/[\u4e00-\u9fff]/.test(demoSample), demoSample.slice(0, 50));
        }
        if (!isBase) {
          /* 「不是中文」对 ja / zh-Hant 不成立，所以比的是**和 zh-Hans 那一版不同**。
             zh-Hans 那一版在基准轮里记下来了；没记到就跳过（不装作验过）。 */
          if (baseDemoSample) {
            check('[' + tag + '] 对照示例真的换成了这个语种（不等于 zh-Hans 那一版）',
              demoSample !== baseDemoSample, demoSample.slice(0, 50));
          } else {
            check('（说明）基准轮没采到对照示例，这一条跳过', false,
              'zh-Hans 那一轮没走到带示例的题 —— 上面「示例真的挂载了」应该已经红了');
          }
        }
      }
    }

    check('（汇总）所有语种都没出现「漏翻 / 没接线」', problems.length === 0,
      problems.length ? problems.length + ' 处' : '');
    problems.slice(0, 20).forEach((p) => console.log('      · ' + p));


    /* ---------------- 14. 登出 ---------------- */
    console.log('\n[14] 登出');
    await cdp.eval('document.getElementById("logoutBtn").click()');
    let loggedOut = false;
    for (let i = 0; i < 30; i += 1) {
      await sleep(200);
      if ((await cdp.eval('location.pathname')).indexOf('login') !== -1) { loggedOut = true; break; }
    }
    check('登出后回到登录页', loggedOut);

    /* ---------------- 15. 免注册模式 ---------------- */
    console.log('\n[15] 免注册模式');

    /* 「不保存」要用两条**互相独立**的证据钉住：
       ① 客户端：整个流程里没有向 /api/projects 发过请求；
       ② 服务端：data/db.json 里的记录条数一条没变。
       只查①会漏掉「从别的接口写进去」；只查②说不清是「没写」还是「写失败了」。 */
    const DB_FILE = path.join(__dirname, '..', 'data', 'db.json');
    const countProjects = () => {
      try { return (JSON.parse(fs.readFileSync(DB_FILE, 'utf8')).projects || []).length; }
      catch (e) { return -1; }
    };
    const projectsBefore = countProjects();
    /* ⚠️ 读不到 data/db.json 时 countProjects() 返回 -1，而下面那条断言会拿它去比，
       报出来是「-1 → 1450」—— 看着像「产品偷偷写盘了」，其实是探针没读到文件
       （两个服务共用 data/db.json 时实测撞上过一次）。
       读失败必须自己有一条前置断言，不能让它披着产品缺陷的皮。 */
    check('（前置）读到了服务端的记录条数（读不到下面那条就是瞎的）',
      projectsBefore >= 0, 'projects=' + projectsBefore);

    await cdp.send('Network.enable');
    await cdp.goto(BASE + '/app.html?guest=1');

    let stayedInApp = false;
    for (let i = 0; i < 25; i += 1) {
      await sleep(200);
      if ((await cdp.eval('location.pathname')).indexOf('login') !== -1) break;
      if (await cdp.eval('!!document.getElementById("guestLoginBtn") && !document.getElementById("guestLoginBtn").classList.contains("hidden")')) {
        stayedInApp = true;
        break;
      }
    }
    check('未登录 + ?guest=1 → 留在工作台（没有被跳去登录页）', stayedInApp,
      await cdp.eval('location.href'));

    /* 标识必须**看得见**。结构对、样式对、但落在视口外，用户就是看不见 ——
       第 10 次静默失效正是这个形状（工具条渲染全对，top:1031px 在 844px 视口外）。
       所以这里量位置，不只量 innerHTML。 */
    const badge = await cdp.eval(`(() => {
      const b = document.getElementById('envBadge');
      if (!b) return null;
      const cs = getComputedStyle(b);
      const r = b.getBoundingClientRect();
      return {
        text: b.textContent.trim(),
        title: b.title,
        display: cs.display, visibility: cs.visibility, opacity: cs.opacity,
        top: Math.round(r.top), bottom: Math.round(r.bottom),
        width: Math.round(r.width), height: Math.round(r.height),
        right: Math.round(r.right), vh: window.innerHeight, vw: window.innerWidth,
      };
    })()`);
    /* 徽章现在放的是**短标**（原来那句整话会把 56px 的顶栏压成 7 行竖排）。
       完整说明挂在 title 上，正文里另外三个地方也都写着。 */
    check('顶栏出现免注册标识（短标）', !!badge && /不保存/.test(badge.text), badge && badge.text);
    check('短标上挂着完整说明（title 里是「免注册模式 · 不保存记录」）',
      !!badge && /免注册模式/.test(badge.title || '') && /不保存记录/.test(badge.title || ''),
      badge && badge.title);
    /* ⚠️ 「徽章没有被压成竖排」这条断言**故意不放在这里**：
       桌面视口下顶栏宽裕，把 flex:0 0 auto / white-space:nowrap 删掉徽章也不会
       折行 —— 放在这里它就是一条永远为真的摆设（删掉那条规则一条断言都不红）。
       它挪到了下面 300px + 西语那一格：只有那里顶栏真的不够用，徽章才会被挤，
       那条断言才**能**红。 */
    check('标识真的被画出来了（不是 display:none / 透明）',
      !!badge && badge.display !== 'none' && badge.visibility !== 'hidden' && Number(badge.opacity) > 0,
      badge && (badge.display + ' / ' + badge.visibility + ' / ' + badge.opacity));
    check('标识落在首屏内（在视口里，不是滚出去的那种）',
      !!badge && badge.top >= 0 && badge.bottom <= badge.vh && badge.right <= badge.vw,
      badge && ('top=' + badge.top + ' bottom=' + badge.bottom + ' vh=' + badge.vh
        + ' right=' + badge.right + ' vw=' + badge.vw));

    /* ---- 窄屏顶栏的语种预算 ----
       顶栏「需要多宽」是**随语种变的**（落地页页头就死在这一点上：中文够、英语超）。
       收尺寸之前实测 @390 需要 zh-Hans 645 / ja 685 / ko 697 / en 752 / **es 823**，
       而只有 390 —— 不带徽章也有 600，也就是说**免注册之前就差了 210px**。
       所以修完必须**按最宽的语种**验一遍，只验中文等于没验。 */
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    /* ⚠️ **三个宽度都要量**，而且不是随手挑的：
       · 390  手机主流宽度，也是余量最紧的一格；
       · 768  iPad 竖屏。980 以下顶栏会**多出「记录」「预览」两个按钮**
              （`.icon-toggle` 就挂在 `@media (max-width: 980px)` 里），
              所以预算最容易只写到 720 —— 那样 721~980 整段没人管。
              09-26 我自己先踩了这个：全套断言绿着，768 的西语顶栏溢出 119px。
       · 1024 iPad 横屏 / 小笔记本，回到「桌面配置」（少那两个按钮）。
       「体检的宽度集合本身会成为盲区」这条已经记在 topics/testing.md 里，
       所以这里宁可多量两格。 */
    const TB_WIDTHS = [390, 768, 1024];
    const TB_TAGS = ['zh-Hans', 'zh-Hant', 'en', 'ja', 'ko', 'es'];
    for (const tbTag of TB_TAGS) {
      await cdp.goto(BASE + '/app.html?guest=1&lang=' + tbTag);
      await sleep(650);
      for (const tbW of TB_WIDTHS) {
        await cdp.send('Emulation.setDeviceMetricsOverride',
          { width: tbW, height: tbW === 390 ? 844 : 1024, deviceScaleFactor: 2, mobile: true });
        await sleep(260);
        m = await cdp.eval(MOBILE_PROBE);
        check('（前置）' + tbTag + ' @' + tbW + ' 顶栏量到了控件',
          !!m.topbar && m.topbar.controls >= 5, m.topbar && m.topbar.controls + ' 个');
        check(tbTag + ' 在 ' + tbW + 'px 上顶栏放得下（不需要横滑）',
          !!m.topbar && m.topbar.overflow === 0,
          m.topbar && ('需要 ' + m.topbar.need + ' / 有 ' + m.topbar.client
            + '，溢出 ' + m.topbar.overflow + 'px'));
        /* 余量只在 390 这一格量 —— 三个宽度里它最紧（实测 es 余 66px、
           768 余 67px、1024 余 355px）。三格都量只是把同一条断言抄三遍。 */
        if (tbW === 390) {
          check(tbTag + ' 在 390px 上顶栏还有余量（不是「碰巧够」）',
            !!m.topbar && m.topbar.slack >= 12, m.topbar && ('余 ' + m.topbar.slack + 'px'));
        }
      }
    }
    await cdp.send('Emulation.setDeviceMetricsOverride',
      { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await cdp.goto(BASE + '/app.html?guest=1&lang=es');
    await sleep(650);
    await cdp.shot(path.join(SHOT_DIR, '23-mobile-topbar-es.png'));

    /* ---- 300px：**余量下限**探针 ----
       300 不是真机宽度（真机下限是 320）。它的作用是**保证顶栏真的溢出** ——
       只有真的溢出，下面那条「滚到底够得着」才不是恒真。
       （320 + 西语实测只溢出几像素，太薄，抓不住「把 overflow-x 删掉」这种变异。）
       和落地页那条 365px 的余量下限探针是同一个道理。 */
    await cdp.send('Emulation.setDeviceMetricsOverride',
      { width: 300, height: 844, deviceScaleFactor: 2, mobile: true });
    await cdp.goto(BASE + '/app.html?guest=1&lang=es');
    await sleep(650);
    m = await cdp.eval(MOBILE_PROBE);
    check('（前置）300px 西语顶栏确实溢出了（不溢出这条就测不到东西）',
      !!m.topbar && m.topbar.overflow > 0, m.topbar && (m.topbar.overflow + 'px'));
    /* 徽章不许折行。只有这一格（300px + 最宽的语种）顶栏才真的不够用 ——
       把 .env-badge 的 flex:0 0 auto / white-space:nowrap 删掉，它就会被挤成
       两三行、高度翻倍，这里才会红。 */
    const badgeTight = await cdp.eval(`(() => {
      const b = document.getElementById('envBadge');
      if (!b) return null;
      const r = b.getBoundingClientRect();
      return { h: Math.round(r.height), w: Math.round(r.width), text: b.textContent.trim() };
    })()`);
    check('300px + 西语下徽章也没被压成竖排（高度不超过一行）',
      !!badgeTight && badgeTight.h <= 32,
      badgeTight && ('高 ' + badgeTight.h + 'px 宽 ' + badgeTight.w + 'px 「' + badgeTight.text + '」'));

    /* 语言切换器在窄屏被搬进了账号菜单。⚠️ 这是最容易**静默**丢掉的功能：
       顶栏那份在窄屏是 display:none，菜单里那份要是没挂上（id 写错、
       忘了第二次 mountSwitcher），手机用户就**再也换不了语种** ——
       页面不崩、不报错，只是那个功能没了。 */
    const langInMenu = await cdp.eval(`(() => {
      const sel = document.querySelector('#langSlotMenu .lang-select');
      const top = document.getElementById('langSlot');
      return {
        inMenu: !!sel,
        options: sel ? sel.options.length : 0,
        topHidden: top ? getComputedStyle(top).display : 'missing',
      };
    })()`);
    check('窄屏账号菜单里有语言切换器（顶栏那份藏了，这份就是唯一入口）',
      !!langInMenu && langInMenu.inMenu && langInMenu.options >= 2,
      langInMenu && (langInMenu.options + ' 个语种'));
    check('窄屏顶栏那份语言切换器确实藏起来了（不是两份都露着）',
      !!langInMenu && langInMenu.topHidden === 'none', langInMenu && langInMenu.topHidden);
    const tbFirst = await topbarReach();
    check('300px 上品牌（第一个控件）仍在视口里',
      !!tbFirst && tbFirst.firstVisible, tbFirst && (tbFirst.first + ' left=' + tbFirst.firstLeft));
    await topbarScrollEnd();
    await sleep(150);
    const tbLast = await topbarReach();
    check('300px 上把顶栏滚到底，账号入口完整可见（够得着，不是被裁掉）',
      !!tbLast && tbLast.lastFullyVisible,
      tbLast && (tbLast.last + ' 右缘 ' + tbLast.lastRight
        + '，允许到 ' + (tbLast.boxRight - tbLast.padR)));
    await cdp.shot(path.join(SHOT_DIR, '24-mobile-topbar-300-es.png'));

    /* ---- H5 上「Prompt 得分」必须看得见 ----
       用户报的第二个缺陷：「H5 里没看见 prompt 得分」。复现下来是这样：
       980px 以下右侧预览栏被收成抽屉（`.preview { display: none }`），
       而**分数只存在于那个抽屉里** —— 结果区一张分数卡都没有，只有一句
       「完整度从 11 分提升到 93 分」。也就是说整个问答过程里用户都看不见
       分数，除非他自己发现顶栏那个「预览」按钮。实测：结果区
       `#stageResult` 里 `#scoreAfter / .score-row / .score-card` 一个都没有。

       修法：把「当前得分」镜像进顶栏那个按钮里的徽标（`#previewScore`）。
       徽标挂在 `#previewToggle` 里，所以 980px 以上它跟着那个按钮一起
       消失（桌面端右侧栏本来就有两张得分卡，不重复）。

       ⚠️ 这里**分两个时刻**量（刚进入 / 把主区滚到底）—— 只量一次的话，
       「徽标跟着内容滚走了」这种坏法完全测不出来。而结构断言
       （innerHTML 里有没有那个 span）对「在不在屏幕里」是完全免疫的，
       这一条已经栽过一次（09-23 那次的工具条）。 */
    await cdp.send('Emulation.setDeviceMetricsOverride',
      { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await cdp.goto(BASE + '/app.html?guest=1');
    await sleep(700);

    /* 源码里写在模板字符串里，所以 `\\s` 要写成 `\\\\s`（先过模板字符串那一层）。
       这不是笔误 —— 直接写 `\s` 的话，注入进去的字符串里就只剩一个 `s`，
       正则变成 /s+/，什么都匹配不上，而且不报错。 */
    const BADGE_PROBE = `(() => {
      const wrap = document.getElementById('previewScore');
      const val = document.getElementById('previewScoreValue');
      const btn = document.getElementById('previewToggle');
      const side = document.getElementById('scoreAfter');
      if (!wrap || !val || !btn) return null;
      const r = wrap.getBoundingClientRect();
      const de = document.documentElement;
      return {
        shown: wrap.offsetParent !== null,
        text: wrap.textContent.replace(/\\s+/g, ' ').trim(),
        value: val.textContent.trim(),
        side: side ? side.textContent.trim() : null,
        top: Math.round(r.top), bottom: Math.round(r.bottom), right: Math.round(r.right),
        inView: wrap.offsetParent !== null && r.bottom > 0 && r.top < window.innerHeight
          && r.right <= de.clientWidth,
        vh: window.innerHeight,
      };
    })()`;

    const badgeIdle = await cdp.eval(BADGE_PROBE);
    check('（前置）顶栏量到了得分徽标（选择器写错这条就永远是绿的）',
      !!badgeIdle, badgeIdle ? badgeIdle.text : '没找到 #previewScore');
    check('390px 上顶栏就有得分徽标，且在视口内（H5 报「看不见得分」的就是这一条）',
      !!badgeIdle && badgeIdle.shown && badgeIdle.inView,
      badgeIdle && ('显示=' + badgeIdle.shown + ' 位置 ' + badgeIdle.top + '~' + badgeIdle.bottom
        + ' 右缘 ' + badgeIdle.right + ' / 视口高 ' + badgeIdle.vh));
    check('还没开始拆解时徽标是「—」，不拿原始输入的预估分充数',
      !!badgeIdle && badgeIdle.value === '—', badgeIdle && badgeIdle.value);

    await cdp.eval(`(() => {
      const ta = document.getElementById('rawPrompt');
      ta.value = '帮我写一封给客户的道歉邮件';
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      document.getElementById('startBtn').click();
      return true;
    })()`);
    await sleep(800);
    const badgeRound = await cdp.eval(BADGE_PROBE);
    const asNum = (s) => (/^\d+$/.test(String(s)) ? Number(s) : NaN);
    check('开题之后徽标立刻有分数（不是一直挂着「—」）',
      !!badgeRound && asNum(badgeRound.value) > 0, badgeRound && badgeRound.value);
    check('徽标和侧栏「当前得分」是同一个数（两处各写各的迟早会岔）',
      !!badgeRound && badgeRound.value === badgeRound.side,
      badgeRound && ('徽标 ' + badgeRound.value + ' / 侧栏 ' + badgeRound.side));

    await cdp.eval(`(() => {
      const blocks = Array.from(document.querySelectorAll('#questionsHost .q-block'));
      blocks.forEach((b) => {
        const o = b.querySelector('.option-btn:not(.is-skip):not(.is-custom)');
        if (o) o.click();
      });
      return blocks.length;
    })()`);
    await sleep(350);
    await cdp.eval('document.getElementById("nextBtn").click()');
    await sleep(800);
    const badgeAnswered = await cdp.eval(BADGE_PROBE);
    check('答一轮之后徽标上的分数跟着涨（不是只在开题那一刻刷一次）',
      !!badgeAnswered && asNum(badgeAnswered.value) > asNum(badgeRound && badgeRound.value),
      badgeRound && badgeAnswered && (badgeRound.value + ' → ' + badgeAnswered.value));

    await cdp.eval(`(() => {
      const sc = document.getElementById('mainScroll');
      if (sc) sc.scrollTop = sc.scrollHeight;
      else window.scrollTo(0, document.body.scrollHeight);
      return true;
    })()`);
    await sleep(400);
    const badgeScrolled = await cdp.eval(BADGE_PROBE);
    check('把主区滚到底之后徽标还在视口里（顶栏不跟着内容滚走）',
      !!badgeScrolled && badgeScrolled.shown && badgeScrolled.inView,
      badgeScrolled && ('位置 ' + badgeScrolled.top + '~' + badgeScrolled.bottom
        + ' / 视口高 ' + badgeScrolled.vh));

    /* 徽标挂在「预览」按钮里，点它就是开抽屉 —— 它不该是个点不动的死标签。 */
    await cdp.eval('document.getElementById("previewToggle").click()');
    await sleep(500);
    const badgeDrawer = await cdp.eval(`(() => {
      const pv = document.querySelector('.preview');
      const side = document.getElementById('scoreAfter');
      if (!pv || !side) return null;
      const r = side.getBoundingClientRect();
      return {
        open: pv.classList.contains('open'),
        display: getComputedStyle(pv).display,
        shown: side.offsetParent !== null,
        inView: side.offsetParent !== null && r.bottom > 0 && r.top < window.innerHeight,
        top: Math.round(r.top), bottom: Math.round(r.bottom),
      };
    })()`);
    check('点顶栏徽标（同一个按钮）能拉出预览抽屉',
      !!badgeDrawer && badgeDrawer.open && badgeDrawer.display === 'flex',
      badgeDrawer && badgeDrawer.display);
    check('抽屉里「当前得分」在视口内（点开就看得见，不用再滚一次）',
      !!badgeDrawer && badgeDrawer.shown && badgeDrawer.inView,
      badgeDrawer && ('位置 ' + badgeDrawer.top + '~' + badgeDrawer.bottom));
    await cdp.shot(path.join(SHOT_DIR, '25-mobile-score-badge.png'));

    /* 桌面端不许重复：右侧栏本来就有「原始 Prompt / 当前得分」两张卡。 */
    await cdp.send('Emulation.setDeviceMetricsOverride',
      { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    await sleep(450);
    const badgeDesk = await cdp.eval(`(() => {
      const btn = document.getElementById('previewToggle');
      const wrap = document.getElementById('previewScore');
      const side = document.getElementById('scoreAfter');
      if (!btn || !wrap || !side) return null;
      return {
        btnDisplay: getComputedStyle(btn).display,
        badgeShown: wrap.offsetParent !== null,
        sideShown: side.offsetParent !== null,
      };
    })()`);
    check('桌面宽度下徽标不显示，而侧栏得分卡在（不重复显示同一个数）',
      !!badgeDesk && !badgeDesk.badgeShown && badgeDesk.sideShown,
      badgeDesk && ('按钮 ' + badgeDesk.btnDisplay + ' / 徽标 ' + badgeDesk.badgeShown
        + ' / 侧栏 ' + badgeDesk.sideShown));

    /* ---- 全程选「拿不准」：分数原地不动，结果区也不许说假话 ----
       这是用户报的第一个缺陷的**界面侧**那一半。引擎那边由 test-engine.js
       的四之十守着（「一题不答 / 全选拿不准时分数不许动」），这里守的是
       **用户实际看到的那两样东西**：
         · 侧栏「原始 Prompt / 当前得分」两个数必须一样；
         · 结果区那句话 —— 原来会写「完整度从 11 分提升到 11 分」，
           下面还列一句「你的原始描述已经相当完整」，两句都是假的。
       界面侧的假话引擎侧测不出来（分数是对的，话是错的），所以必须单独守。 */
    await cdp.goto(BASE + '/app.html?guest=1');
    await sleep(700);
    await cdp.eval(`(() => {
      const ta = document.getElementById('rawPrompt');
      ta.value = '帮我写一封给客户的道歉邮件';
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      document.getElementById('startBtn').click();
      return true;
    })()`);
    await sleep(500);

    let skipRound = 0;
    while (skipRound < 15) {
      if (await cdp.eval('!document.getElementById("stageResult").classList.contains("hidden")')) break;
      if (!(await cdp.eval('document.querySelectorAll(".q-block").length'))) break;
      skipRound += 1;
      await cdp.eval(`(() => {
        document.querySelectorAll('.q-block').forEach((b) => {
          const s = b.querySelector('.option-btn.is-skip');
          if (s) s.click();
        });
        return true;
      })()`);
      await cdp.eval('document.getElementById("nextBtn").click()');
      await sleep(280);
    }
    check('（前置）全程选「拿不准」也能走到结果区（一题都不选就走不到，这条就测不到东西）',
      skipRound >= 5, '轮数=' + skipRound);

    const skipView = await cdp.eval(`(() => {
      const sum = document.getElementById('resultSummary');
      const grid = document.getElementById('improveGrid');
      const before = document.getElementById('scoreBefore');
      const after = document.getElementById('scoreAfter');
      const finalText = document.getElementById('finalPrompt');
      return {
        summary: sum ? sum.textContent.replace(/\\s+/g, ' ').trim() : null,
        gridHidden: grid ? grid.classList.contains('hidden') : null,
        gridShown: grid ? grid.offsetParent !== null : null,
        before: before ? before.textContent.trim() : null,
        after: after ? after.textContent.trim() : null,
        keepsOriginal: finalText ? finalText.textContent.indexOf('道歉邮件') !== -1 : null,
      };
    })()`);
    check('全程选「拿不准」时侧栏两个分数一样（分数没替不存在的内容背书）',
      !!skipView && skipView.before === skipView.after,
      skipView && (skipView.before + ' → ' + skipView.after));
    check('结果区不写「完整度从 X 分提升到 Y 分」这句假话',
      !!skipView && !/提升到/.test(skipView.summary || ''), skipView && skipView.summary);
    check('结果区说的是「还没有做出任何选择」',
      !!skipView && /还没有做出任何选择/.test(skipView.summary || ''),
      skipView && skipView.summary);
    check('没做选择时「补齐项」整块收起来（空网格看着像坏了）',
      !!skipView && skipView.gridHidden === true && skipView.gridShown === false,
      skipView && ('hidden=' + skipView.gridHidden + ' / 显示=' + skipView.gridShown));
    check('用户的原话仍在最终 Prompt 里（分数不动不等于成品空了）',
      !!skipView && skipView.keepsOriginal === true, skipView && String(skipView.keepsOriginal));

    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: false });
    await cdp.send('Emulation.clearDeviceMetricsOverride');
    await cdp.goto(BASE + '/app.html?guest=1');
    await sleep(800);

    const guestSide = await cdp.eval(`(() => {
      const list = document.getElementById('historyList');
      const count = document.getElementById('historyCount');
      const note = document.getElementById('storageNote');
      return {
        list: list.textContent.replace(/\\s+/g, ' ').trim(),
        count: count.textContent.trim(),
        note: note.textContent.replace(/\\s+/g, ' ').trim(),
      };
    })()`);
    check('侧栏写明「不保存记录」而不是「还没有记录」',
      /不保存记录/.test(guestSide.list) && !/还没有保存过/.test(guestSide.list), guestSide.list);
    /* 计数显示 0 会被读成「一条都没有，攒着就有了」—— 那等于在承诺会攒。
       游客的计数得是个**不可能**的值，才不会被误读。 */
    check('记录计数不是 0（0 会被读成「攒着就有了」）', guestSide.count === '—', guestSide.count);
    check('侧栏说明写明离开即清空', /清空/.test(guestSide.note), guestSide.note);

    /* ---- 走完一次完整流程 ---- */
    await cdp.eval(`(() => {
      const ta = document.getElementById('rawPrompt');
      ta.value = '帮我写一篇关于远程办公的公众号文章，要给公司同事看的';
      ta.dispatchEvent(new Event('input', { bubbles: true }));
    })()`);
    await sleep(250);
    await cdp.eval('document.getElementById("startBtn").click()');
    await sleep(400);

    let guestRound = 0;
    while (guestRound < 15) {
      if (await cdp.eval('!document.getElementById("stageResult").classList.contains("hidden")')) break;
      if (!(await cdp.eval('document.querySelectorAll(".q-block").length'))) break;
      guestRound += 1;
      await cdp.eval(`(() => {
        document.querySelectorAll('.q-block').forEach(b => {
          const opts = Array.from(b.querySelectorAll('.option-btn'))
            .filter(x => !x.classList.contains('is-skip') && !x.classList.contains('is-custom'));
          if (opts.length) opts[0].click();
        });
      })()`);
      await cdp.eval('document.getElementById("nextBtn").click()');
      await sleep(260);
    }
    check('游客也能走完整个拆解流程', guestRound >= 5, '轮数=' + guestRound);
    await sleep(500);
    const guestPrompt = await cdp.eval('document.getElementById("finalPrompt").textContent');
    check('游客拿到了最终 Prompt', guestPrompt.length > 200, '长度=' + guestPrompt.length);

    /* ---- 结果区必须当场说明「这次没保存」 ---- */
    const notice = await cdp.eval(`(() => {
      const n = document.getElementById('guestNotice');
      if (!n) return null;
      const cs = getComputedStyle(n);
      const r = n.getBoundingClientRect();
      return {
        hidden: n.classList.contains('hidden'),
        text: n.textContent.replace(/\\s+/g, ' ').trim(),
        display: cs.display, visibility: cs.visibility, opacity: cs.opacity,
      };
    })()`);
    check('结果区出现「这次没有保存」的提示', !!notice && !notice.hidden, notice && notice.text);
    check('提示文案说清了原因和出口',
      !!notice && /没有保存/.test(notice.text) && /登录/.test(notice.text), notice && notice.text);

    /* 位置分两个时刻量 —— 但**两个时刻量的不是同一个东西**。
       ------------------------------------------------------------------
       一开始这里两个时刻都量 .guest-notice，第二条跑出来 top=-1536。
       那不是缺陷，是**断言写错了**：提示块在结果区顶部，滚到底被推走是
       正常行为，一条提示不该跟着人走到底。硬要它粘住，反而会盖住内容。
       真正的设计分工是：
         · .guest-notice   = **一次性解释**（为什么这次没保存 + 出口）
                             → 只在「刚进结果区」那一刻必须看得见
         · 顶栏 #envBadge  = **持续标识**（我一直在免注册模式）
                             → 无论滚到哪都必须看得见
       所以第二个时刻量的是**标识**，不是提示。两个时刻守两条不同的承诺，
       各配一条变异（见 mutation-check-ui.js）。

       ⚠️ 滚的时候要把**所有能滚的**都滚到底。只写 mainScroll.scrollTop
       的话，一旦有人把滚动从内层 div 挪到文档上（.app-shell 不再 overflow:hidden），
       那句就变成空操作，页面纹丝不动、标识当然还在视口里 ——
       **断言会变成永远为真的摆设**。滚三个地方，布局怎么改都真的到底了。 */
    const scrollToBottom = () => cdp.eval(`(() => {
      const m = document.getElementById('mainScroll');
      if (m) m.scrollTop = 99999;
      document.documentElement.scrollTop = 99999;
      document.body.scrollTop = 99999;
      window.scrollTo(0, 99999);
      return true;
    })()`);
    const noticePos = () => cdp.eval(`(() => {
      const n = document.getElementById('guestNotice');
      const r = n.getBoundingClientRect();
      return { top: Math.round(r.top), bottom: Math.round(r.bottom), vh: window.innerHeight };
    })()`);
    const badgePos = () => cdp.eval(`(() => {
      const b = document.getElementById('envBadge');
      if (!b) return null;
      const cs = getComputedStyle(b);
      const r = b.getBoundingClientRect();
      return {
        hidden: b.classList.contains('hidden'),
        display: cs.display, visibility: cs.visibility,
        top: Math.round(r.top), bottom: Math.round(r.bottom), vh: window.innerHeight,
      };
    })()`);
    await cdp.eval('document.getElementById("mainScroll").scrollTop = 0');
    await cdp.eval('window.scrollTo(0, 0)');
    await sleep(150);
    const n1 = await noticePos();
    await cdp.shot(path.join(SHOT_DIR, '15-guest-result.png'));
    await scrollToBottom();
    await sleep(150);
    const b2 = await badgePos();
    check('刚进结果区时「这次没保存」的提示在视口里',
      n1.top >= 0 && n1.top < n1.vh, 'top=' + n1.top + ' vh=' + n1.vh);
    /* ⚠️ 判「在视口里」之前先判「它是不是被画出来了」——
       隐藏元素的 getBoundingClientRect() 全 0，而 0 恰好满足
       「top >= 0 且 bottom <= vh」，不先判这一条，整条断言在
       「标识压根没显示」的时候反而更绿。 */
    check('滚到底之后顶栏的免注册标识仍在视口内（持续标识不随内容滚走）',
      !!b2 && !b2.hidden && b2.display !== 'none' && b2.visibility !== 'hidden'
        && b2.top >= 0 && b2.bottom <= b2.vh,
      b2 && ('hidden=' + b2.hidden + ' top=' + b2.top + ' bottom=' + b2.bottom + ' vh=' + b2.vh));

    /* ---- 「不保存」的两条独立证据 ---- */
    const writeReqs = cdp.events
      .filter((e) => e.method === 'Network.requestWillBeSent')
      .map((e) => e.params && e.params.request)
      .filter((r) => r && r.url.indexOf('/api/projects') !== -1)
      .map((r) => r.method + ' ' + r.url.replace(BASE, ''));
    check('整个游客流程没有向 /api/projects 发过任何请求', writeReqs.length === 0, writeReqs.join(' | '));

    const projectsAfter = countProjects();
    check('服务端记录条数一条没变（真的没落盘）',
      projectsAfter === projectsBefore, projectsBefore + ' → ' + projectsAfter);

    /* ---- 交接：只有点登录才写、只被消费一次 ---- */
    const handoffEarly = await cdp.eval(
      'window.sessionStorage.getItem("promptlens.guest.handoff.v1")');
    check('走流程时不会提前写交接（只有点登录才写）', handoffEarly === null, String(handoffEarly));

    await cdp.eval('document.getElementById("guestNoticeLogin").click()');
    await sleep(200);
    const handoffRaw = await cdp.eval(
      'window.sessionStorage.getItem("promptlens.guest.handoff.v1")');
    let handoff = null;
    try { handoff = JSON.parse(handoffRaw); } catch (e) { /* 保持 null */ }
    check('点「登录以保存」写出了交接数据', !!handoff && handoff.v === 1,
      String(handoffRaw).slice(0, 70));
    check('交接里带着已经答过的内容',
      !!handoff && !!handoff.session && !!handoff.session.answers
        && Object.keys(handoff.session.answers).length > 0,
      handoff && JSON.stringify(Object.keys(handoff.session.answers || {})).slice(0, 70));

    let atLogin = false;
    for (let i = 0; i < 30; i += 1) {
      await sleep(200);
      if ((await cdp.eval('location.pathname')).indexOf('login') !== -1) { atLogin = true; break; }
    }
    check('点「登录以保存」跳到了登录页', atLogin, await cdp.eval('location.href'));

    /* ---- 注册 → 回工作台 → 交接必须被接住、并且只接一次 ---- */
    const guestUser = 'guest2' + Date.now().toString(36);
    await cdp.eval(`(() => {
      document.querySelector('.tab[data-tab="register"]').click();
      document.getElementById('username').value = ${JSON.stringify(guestUser)};
      document.getElementById('password').value = 'test123456';
      document.getElementById('displayName').value = '游客转正';
      document.getElementById('authForm').dispatchEvent(new Event('submit', {cancelable:true, bubbles:true}));
      return true;
    })()`);

    let backInApp = false;
    for (let i = 0; i < 40; i += 1) {
      await sleep(200);
      if ((await cdp.eval('location.pathname')).indexOf('app.html') !== -1) { backInApp = true; break; }
    }
    check('游客注册后回到工作台', backInApp, await cdp.eval('location.href'));
    await sleep(700);

    /* 交接被消费掉之后必须**立刻删**。留着的话下次再开 app.html 会把旧进度
       又倒回来一遍，用户会以为「我明明重新开始了，怎么又回来了」——
       而这个 bug 只在「用过一次免注册并且登录过」之后才出现，很难复现。 */
    const handoffLeft = await cdp.eval(
      'window.sessionStorage.getItem("promptlens.guest.handoff.v1")');
    check('交接被消费后立刻清掉（不会留着下次又倒回来）', handoffLeft === null, String(handoffLeft));

    const restoredPrompt = await cdp.eval('document.getElementById("finalPrompt").textContent');
    check('注册后直接看到免注册时做出来的那份结果（进度没白做）',
      restoredPrompt.length > 200 && restoredPrompt === guestPrompt,
      '长度=' + restoredPrompt.length + ' 与游客时一致=' + (restoredPrompt === guestPrompt));
    check('回工作台后不再是游客（标识已收起）',
      await cdp.eval('document.getElementById("envBadge").classList.contains("hidden")'));
    check('回工作台后侧栏恢复成「我的记录」',
      (await cdp.eval('document.getElementById("historyCount").textContent')).trim() !== '—',
      await cdp.eval('document.getElementById("historyCount").textContent'));

    /* ⚠️ 这里**不能**先 ws.close()：关浏览器要靠 finally 里的
       closeBrowser(ws, ...) 往这条连接上发 Browser.close。连接一断，那条命令
       就发不出去，只能退回按 PID 杀 —— 而 Windows 上 spawn 出来的 chrome.exe
       是个拉完真进程就退的启动器，那个 PID 早死了，结果整棵进程树都留下来
       （实测每次跑留 12~16 个进程）。连接会在浏览器退出时自然断开。 */
  } catch (err) {
    console.error('\n运行出错：' + err.message);
    failures.push('运行异常: ' + err.message);
  } finally {
    /* ⚠️ 收尾必须真的收掉**整棵**进程树，不能只 kill 主进程 ——
     * 渲染 / GPU / crashpad 那些子进程会留下来继续占着调试端口和临时目录。
     * 而且 node 自己被强杀时这个 finally 根本跑不到。
     * 端口改成 Chrome 自选之后，残留进程已经不会再让下一次跑错页面了，
     * 这里仍然收拾干净，免得越攒越多（实测每跑一次会留 12 个进程）。
     */
    await closeBrowser(ws, chrome);
    try { fs.rmSync(USER_DIR, { recursive: true, force: true }); } catch (e) { /* ignore */ }
  }

  /* 这条守的是「上面的断言有没有量得太早」。
     它绿 = 每一次导航都等到了样式生效；红 = 至少有一次在没生效的页面上量了，
     那种情况下其它断言的红绿都不作数（可能是假红，也可能是假绿）。 */
  check('（前置）每次导航都等到了样式生效（没有一次是「量得太早」）',
    cssTimeouts === 0, cssTimeouts + ' 次超时');
  console.log('\n' + '='.repeat(60));
  if (failures.length) {
    console.log('失败 ' + failures.length + ' 项：');
    failures.forEach((f) => console.log('  - ' + f));
    process.exit(1);
  }
  console.log('全部通过 ✓  截图已保存到 screenshots/');
  process.exit(0);
}

main();
