'use strict';

/**
 * 变异测试：故意把源码改坏，确认 test-engine.js 真的会失败。
 *
 * 为什么需要单独跑一遍：断言写得再漂亮，只要它永远为真就等于没有，
 * 而且会给人虚假的安全感（「183 条断言全绿」听起来很稳，实际可能一条都没在测）。
 * 这个脚本把每个「本该被抓到」的改坏点写进源码，跑一遍测试，
 * 要求它以非 0 退出、并且**失败信息里出现指定的关键字**（确认是对的那条断言在报错，
 * 而不是碰巧被别的断言拦下）。
 *
 * 改坏的是**临时副本**，不是真源码。早先是直接改真文件、跑完再还原的，
 * 那样有两个坑：和别的测试并行跑时对方会读到改坏的代码、报出并不存在的错；
 * 跑到一半被杀掉则源码停在坏状态，之后所有测试都在测坏代码。现在副本方案
 * 让真源码一个字节都不会被动，也就不需要任何锁或还原逻辑。
 * 做法是：把 public/assets/js 整个拷到临时目录（外加 server.js 一份，
 * 因为有一条断言读它的源码），在副本上改，
 * 再用 PL_JS_DIR / PL_SERVER_FILE 环境变量让 test-engine.js 从副本加载
 * （engine.js 用 require('./knowledge.js') 找兄弟文件，所以整个目录一起拷过去就行）。
 *
 * 加新不变量时，顺手往 MUTATIONS 里加一条 —— 这是这套测试的可信度来源。
 *
 * 用法：node scripts/mutation-check.js
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'public', 'assets', 'js');
const LOCALES_DIR = path.join(ROOT, 'public', 'assets', 'locales');

// 在副本上做变异，所以「改哪个文件」写成相对 js 目录的文件名
const KNOWLEDGE = 'knowledge.js';
const ENGINE = 'engine.js';
// server.js 不在 js 目录里，但 test-engine.js 里有一条**读源码**的断言
// （entry 字段必须都登记进落盘白名单），它同样得能被改坏 ——
// 见文件末尾 copyFileSync(SERVER_SRC, ...) 和 PL_SERVER_FILE。
const SERVER = 'server.js';
const SERVER_SRC = path.join(ROOT, 'server.js');

// 文案包在 js 的**兄弟目录**里（../locales/）。变异点落在**数据**上时改这里：
// 场景关键词、fragment、章节标题、评分项 label…… 这些现在都在文案包里。
// 路径写成相对 js 目录的形式，path.join 会自己归一化到副本里的 locales/。
const LOCALE = path.join('..', 'locales', 'zh-Hans.js');

/* LLMO 那批断言读的是 public/ 下的**文件**（落地页 / robots.txt / llms*.txt），
   不是 js 目录。所以变异点用 PUB() 写成「相对 js 目录」的形式，
   拼出来正好落在镜像的那份 public/ 上。 */
const PUB = (...p) => path.join('..', 'public', ...p);

/* 一条变异跑哪个检查脚本。默认 test-engine.js（引擎那批），
   标了 run: 'llmo' 的跑 check-llmo.js。 */
const RUNNERS = { engine: 'test-engine.js', llmo: 'check-llmo.js' };

/**
 * 每个变异点：
 *   file   —— 改哪个文件
 *   from   —— 必须**唯一出现**的原文（出现 0 次或多次都直接报错，
 *             避免「改是改了，但改的不是我以为的那一处」这种假变异）
 *   to     —— 替换成什么
 *   expect —— 测试失败信息里必须出现的关键字，用来确认是对的那条断言在报错
 */
const MUTATIONS = [
  {
    name: '把 intent 的维度从图片组装顺序里拿掉（还原「答了第一题等于没答」的原始 bug）',
    file: KNOWLEDGE,
    from: "  image: ['task', 'subject', 'composition', 'lighting', 'mood', 'style', 'color', 'quality'],",
    to: "  image: ['subject', 'composition', 'lighting', 'mood', 'style', 'color', 'quality'],",
    expect: 'intent',
  },
  {
    name: '把「情绪配乐 → 配乐类型」这条追问链剪断',
    file: LOCALE,
    from: "fragment: '配合情绪化的背景音乐', followUps: ['vid.bgm'] }",
    to: "fragment: '配合情绪化的背景音乐' }",
    expect: 'vid.bgm',
  },
  {
    name: '让「不需要声音」也把配乐类型带上（还原「说了不要声音却写出慢板钢琴」）',
    file: LOCALE,
    from: "fragment: '只描述画面，不需要音频', group: '*' }",
    to: "fragment: '只描述画面，不需要音频', group: '*', followUps: ['vid.bgm'] }",
    expect: '不需要声音',
  },
  {
    name: '焦点不再按景别过滤（全景里也要观众看清面部表情）',
    file: ENGINE,
    from: "      if (dim === 'focus' && !closeOnly) return;\n",
    to: '',
    expect: '焦点',
  },
  {
    name: '评分不再理会「答案是否还在流程上」',
    file: ENGINE,
    from: "      if (!active[qid]) return;\n      const dim = dimOf(qid, family);",
    to: '      const dim = dimOf(qid, family);',
    expect: '残留的追问答案还在加分',
  },
  {
    name: '手工调过的分镜表不再参与渲染（用户改了半天，输出还是自动那一版）',
    file: ENGINE,
    from: '    if (manual) return renderStoryboard(session, sections, manual, inp);',
    to: '    if (false) return renderStoryboard(session, sections, manual, inp);',
    expect: '手工调整没有完整生效',
  },
  {
    name: '手工条目不再做数值夹取（填 999 秒就真按 999 秒渲染）',
    file: ENGINE,
    from: '      const safe = Math.min(STORYBOARD_SEC_MAX, Math.max(STORYBOARD_SEC_MIN, secs));',
    to: '      const safe = secs;',
    expect: '999 秒应夹到 60',
  },
  {
    name: '手工条目的条数不再校验（1 镜 / 13 镜 / 空表都照单全收）',
    file: ENGINE,
    from: '    if (list.length < STORYBOARD_SHOT_MIN || list.length > STORYBOARD_SHOT_MAX) return null;',
    to: '',
    expect: '本该被拒',
  },
  {
    name: '编辑分镜表时只给「用户选过的景别」（换成没选过的景别就拿不到名字）',
    file: ENGINE,
    from: '      shotChoices: allOptionsOf(session, \'vid.shot\'),',
    to: '      shotChoices: pickedOptions(session, \'vid.shot\'),',
    expect: '覆盖全部',
  },
  {
    name: '把「情绪走向」也算进分镜表的签名（回头调一下情绪，排好的镜头顺序全没了）',
    file: ENGINE,
    from: "  const STORYBOARD_INPUTS = ['vid.shot', 'vid.move', 'vid.duration', 'vid.detail', 'vid.cut'];",
    to: "  const STORYBOARD_INPUTS = ['vid.shot', 'vid.move', 'vid.duration', 'vid.detail', 'vid.cut', 'vid.arc'];",
    expect: '误伤',
  },
  {
    name: '新加一镜永远用同一个景别（不挑没用过的，一加就撞上「相邻同景别」）',
    file: ENGINE,
    from: "    const pick = choices.find((c) => used.indexOf(c.id) === -1)\n      || choices[used.length % choices.length];",
    to: '    const pick = choices[0];',
    expect: '却重复用了',
  },
  {
    name: '配乐中段一路写到片尾（和紧接着的「结尾 N 秒」时间区间重叠）',
    file: ENGINE,
    from: "to: timecode(last.start) })",
    to: "to: timecode(last.end) })",
    expect: '重叠',
  },
  {
    name: '两镜时也硬写一段中段（写出「中段 00:05 - 00:05」这种零长度区间）',
    file: ENGINE,
    from: '      if (n > 2) {',
    to: '      if (n >= 2) {',
    expect: '零长度',
  },
  {
    name: '「生成分镜表」的入口退回「只有自动计划可用时才给」（一镜到底的人又没入口了）',
    file: ENGINE,
    from: '    const seed = storyboardPlan(session, { seed: true });\n    if (seed.available) {',
    to: '    const seed = storyboardPlan(session);\n    if (seed.available) {',
    expect: '生成分镜表',
  },
  {
    name: '保存分镜表时仍按自动计划判断（用户排完点保存，静默失败）',
    file: ENGINE,
    from: '    if (!storyboardSeed(inp).ok) return false;',
    to: '    if (!autoStoryboardPlan(inp).ok) return false;',
    expect: '静默失败',
  },
  {
    // 老锚点是 renderStoryboard 里那句 `.filter(o => o.id !== 'vst.oner')`。
    // 拆题之后那句 filter 已经删了（一镜到底根本不会进 inp.styles），
    // 但**要守的不变量没变**：头部不许声称「全片没有剪辑点」，同时表里排着 3 行。
    // 现在的等价变异是把 onerDropped 写死成 false —— 那样【剪辑结构】行会
    // 原样写上「一镜到底的长镜头，全片没有剪辑点」，成品自己打自己。
    name: '分镜表头部不再摘掉「一镜到底」（成品一边说没剪辑点、一边排三个镜头）',
    file: ENGINE,
    from: '    const onerDropped = pickedOner(inp);',
    to: '    const onerDropped = false;',
    expect: '全片没有剪辑点',
  },
  {
    name: 'storyboardPlan 只看自动计划、不认手工版（成品里有分镜表，按钮却写「生成分镜表」）',
    file: ENGINE,
    from: '    if (!manual && !auto.ok) return { available: false };',
    to: '    if (!auto.ok) return { available: false };',
    expect: '却说不可用',
  },
  {
    // 「生成分镜表」的种子不再补镜 → 只选一个景别时排出 1 镜，
    // 而 1 镜存不下去（sanitizeEntries 卡着），用户点了按钮就走进死胡同。
    // 注意症状出现在**入口**：种子 ok:false，按钮干脆不出现。
    name: '「生成分镜表」的种子不再补到最少两镜（只选一个景别的人排不出表，也没有入口）',
    file: ENGINE,
    from: '    while (shots.length < STORYBOARD_SHOT_MIN && shots.length < total && pool.length) {',
    to: '    while (false) {',
    expect: '也该给「生成分镜表」入口',
  },
  {
    name: '补镜时照抄用户已选的那个景别（排出一张相邻两镜同景别的表）',
    file: ENGINE,
    from: '      const pick = pool.find((c) => used.indexOf(c.id) === -1) || pool[used.length % pool.length];',
    to: '      const pick = inp.shots[0];',
    expect: '应当是用户没选过的景别',
  },
  {
    // 编辑器里那句「改这四道题会让这张表作废」后面接什么，取决于 resetToAuto。
    // 一律说 true，就会在「一镜到底」下许一个兑现不了的承诺（表其实是整个消失）。
    name: 'resetToAuto 一律说 true（「一镜到底」下表会整个消失，界面却说「回到自动排的版本」）',
    file: ENGINE,
    from: '      resetToAuto: autoStoryboardPlan(inp).ok,',
    to: '      resetToAuto: true,',
    expect: 'resetToAuto 应当是 false',
  },
  {
    // 「一镜到底」的判断退回旧归属（读 inp.styles）。
    // 拆题之后 vid.style 里根本没有 vcut.oner，于是这条判定**永远为假** ——
    // 一镜到底的人会拿到一张多镜头分镜表，成品自相矛盾。
    name: '一镜到底的判定退回读影像风格（永远为假，一镜到底也能排出分镜表）',
    file: ENGINE,
    from: "    return (inp.cuts || []).some((x) => x.id === 'vcut.oner');",
    to: "    return (inp.styles || []).some((x) => x.id === 'vcut.oner');",
    expect: '自动计划不该给分镜表',
  },
  {
    // vid.cut 决定「有几个镜头」，改了它手工表必须作废。
    // 它不往 entry 里存任何字段，所以最容易被漏掉 ——
    // 症状是「答案说 1 镜、表里好几行」。
    name: 'STORYBOARD_INPUTS 漏掉 vid.cut（改成「一镜到底」之后表还留着好几行）',
    file: ENGINE,
    from: "  const STORYBOARD_INPUTS = ['vid.shot', 'vid.move', 'vid.duration', 'vid.detail', 'vid.cut'];",
    to: "  const STORYBOARD_INPUTS = ['vid.shot', 'vid.move', 'vid.duration', 'vid.detail'];",
    expect: '手工表还生效',
  },
  {
    // 动态提示只读 session.answers、不读本轮草稿。
    // 「剪辑结构」和「镜头景别」在同一轮（BATCH_SIZE=2），用户点「一镜到底」时
    // 它还没提交 —— 只读 answers 的话这句提示**永远不会出现**。
    name: '景别题的动态提示不认本轮草稿（一镜到底和景别同轮，提示永远不出现）',
    file: ENGINE,
    from: "    const raw = Array.isArray(draftSel) ? draftSel : (session.answers['vid.cut'] || []);",
    to: "    const raw = session.answers['vid.cut'] || [];",
    expect: '还在草稿里',
  },
  {
    // 时长题的片段重新越权声称镜头数 —— 这正是用户最初报的那个矛盾的另一半：
    // 「全片没有剪辑点」和「包含 2-3 个镜头切换」同时出现在一段连续描述里。
    //
    // expect 用的是**先跑到的**那条断言：知识库完整性里的「剪辑结构只由「剪辑结构」题
    // 声称」（它扫 fragment，直接指出是哪道题越权了）。四之八第 3 条也会失败，
    // 但它在文件里靠后，跑不到 —— 那条留着当成品层的第二道防线。
    name: '时长题的片段重新声称镜头数（连续描述里一边说没剪辑点、一边说 2-3 个镜头）',
    file: LOCALE,
    from: "fragment: '时长 10-15 秒，节奏有推进'",
    to: "fragment: '时长 10-15 秒，包含 2-3 个镜头切换'",
    expect: '非「剪辑结构」题声称了镜头数',
  },
  {
    // 上一条证明「扫 options」，这一条证明「扫 perScenario」那一半不是死代码。
    // 「短视频」被写成「多个镜头切换」是很像样的笔误（把「短」当成了「快剪」），
    // 而且它真的会拼出矛盾：用户选「一镜到底」+ 短视频用途 → 同一段里两句打架。
    // expect 带上具体的 qid → 选项 id，确认抓到的就是这一处，不是碰巧命中别的。
    name: 'perScenario 的选项声称镜头数（「短视频」被写成「多个镜头切换」）',
    file: LOCALE,
    from: "fragment: '短视频用途，开头三秒必须抓住注意力，节奏紧凑' }",
    to: "fragment: '短视频用途，开头三秒必须抓住注意力，节奏紧凑，包含多个镜头切换' }",
    expect: 'intent → vd.intent.short',
  },
  {
    // 「分镜剪辑」明确要多个镜头，挡在分镜表前面的两个卡点（景别不够 / 时长装不下）
    // 是**独立的**。只提景别的话，用户照做之后还是拿不到表 ——
    // 他会以为是自己没改对，或者认定功能坏了。这是本条分支的第一版真错过的 bug。
    name: '「分镜剪辑」的说明只提景别、不提时长（把用户支到错的地方去改）',
    file: ENGINE,
    from: "      else if (maxShots < 2) todo.push(t('把「时长与节奏」改成 10 秒以上'));",
    to: "      else if (false) todo.push(t('把「时长与节奏」改成 10 秒以上'));",
    expect: '分镜剪辑 + 1 景别 + 3-5 秒 的措辞里没提',
  },
  {
    // ---- 以下是首尾帧那一批 ----
    //
    // 落盘白名单少登记一个字段。这是**静默丢数据**：编辑器里改得好好的、
    // 浏览器里怎么看都对，只有真的存一次再读一次才发现字段没了 ——
    // 不报错、不告警。所以宁可让一条读 server.js 源码的断言提前拦住它。
    name: 'server.js 的落盘白名单漏掉 frameStart（首帧存一次再读回来就没了，全程不报错）',
    file: SERVER,
    from: '      frameStart: normalizeStoryboardFrame(s && s.frameStart),\n',
    to: '',
    expect: '没登记进 server.js 的落盘白名单',
  },
  {
    name: '「沿用上个分镜的尾帧」不再检查位置（第 1 镜也照写，可它前面没有分镜）',
    file: ENGINE,
    from: '    if (mode.needPrev && i < 1) return null;',
    to: '    if (false && i < 1) return null;',
    expect: '第 1 镜的 prev 该被规范化成「未指定」',
  },
  {
    name: '文生图留空时不再回落这一镜的镜头内容（成品里留下一个空荡荡的「文生图：」）',
    file: ENGINE,
    from: "    if (frame.mode === 'text') return t('文生图：') + (frame.text || cell || t('按这一镜的画面'));",
    to: "    if (frame.mode === 'text') return t('文生图：') + (frame.text || '');",
    expect: '文生图留空时应当回落这一镜的镜头内容',
  },
  {
    // entry → 渲染用的 plan 这个 map 少带一个字段。踩过一次：
    // 数据全对，只是成品里那一整节不出现，看起来像「功能没做」。
    name: 'renderStoryboard 的 map 没把首尾帧带过来（编辑器里改得好好的，成品里那一节根本不出现）',
    file: ENGINE,
    from: '        focus: e.focus ? inp.focus : null,\n'
      + '        // 首尾帧不是位置派生的，得从 entry 里带过来 —— 这个 map 少写一个字段，\n'
      + '        // 症状就是「编辑器里改得好好的，成品里那一节根本不出现」。\n'
      + '        frameStart: e.frameStart || null,\n',
    to: '        focus: e.focus ? inp.focus : null,\n',
    expect: '首帧的文生图没写出来',
  },
  {
    name: 'storyboardPlan 的 shots 不带首尾帧（编辑器里的草稿一上来就把它们丢了）',
    file: ENGINE,
    from: '          frameStart: e.frameStart || null,\n'
      + '          frameEnd: e.frameEnd || null,\n'
      + '          shotLabel: shot.label,',
    to: '          shotLabel: shot.label,',
    expect: 'plan.shots 没带首尾帧字段',
  },
  {
    name: '「首尾帧参考」不管有没有指定都出现（给一张全是「—」的表）',
    file: ENGINE,
    from: '    if (plan.some((p) => p.frameStart || p.frameEnd)) {',
    to: '    if (true) {',
    expect: '没人指定首尾帧时不该出现这一节',
  },
  {
    name: '「从文件导入」但什么都没填也留着（成品里写出「从文件导入：」后面空一片）',
    file: ENGINE,
    from: "      if (!path && !name) return null;\n",
    to: '',
    expect: '脏的首尾帧本该当「未指定」',
  },
  {
    name: '「沿用上一个分镜的尾帧」不写明是哪一镜（四个镜头四条一模一样的「沿用上一镜的尾帧」）',
    file: ENGINE,
    from: "    if (frame.mode === 'prev') return t('沿用镜头 {n} 的尾帧', { n: prevIndex });",
    to: "    if (frame.mode === 'prev') return t('沿用上一个分镜的尾帧');",
    expect: '没写成「沿用镜头 1 的尾帧」',
  },
  {
    name: '上一镜没指定尾帧时不再说明（成品里「沿用镜头 1 的尾帧」和镜头 1 尾帧的「—」摆在一起，没人解释）',
    file: ENGINE,
    from: "        && p.frameStart && p.frameStart.mode === 'prev' && !plan[i - 1].frameEnd);",
    to: "        && p.frameStart && p.frameStart.mode === 'prev' && false);",
    expect: '一句说明都没有',
  },
  {
    name: '「首尾帧参考」也输出 `### 镜头 N（时间码）` 标题'
      + '（boardCodes「只有逐段描述有这种标题」的前提被打破，时间码会重复计数）',
    file: ENGINE,
    from: "      lines.push('## ' + t('首尾帧参考'));\n",
    to: "      lines.push('## 首尾帧参考');\n      lines.push('### 镜头 1（00:00 - 00:01）');\n",
    expect: '也输出了',
  },
  {
    name: '视觉兜底不再看「关键词有没有命中」（明确的视频需求被判成图片，'
      + '用户接着看不到「镜头景别」这些题）',
    file: KNOWLEDGE,
    from: "  const keywordMax = scores.reduce((m, s) => Math.max(m, s.score), 0);\n"
      + "  const boost = keywordMax > 0 ? null : visualBoost(text);",
    to: "  const boost = visualBoost(text);",
    expect: '被判成了别的链路',
  },
  {
    name: '视觉兜底不再认「街头 / 夜景 / 咖啡馆」这类场景词'
      + '（纯画面描述退化成「通用任务」，掉进文字链路）',
    file: LOCALE,
    // 文案包里这条是**字符串**（JSON 化过），不是正则字面量 ——
    // 所以结尾是 `小巷"` 而不是 `小巷/;`。锚点跟着数据走，别照抄旧写法。
    from: '|一只|一张|一幅|街头|街道|街上|夜景|霓虹|倒影|影子|雪山|湖泊|森林|沙漠'
      + '|天空|阳光|月光|灯光|纹路|纹理|房间|室内|建筑|高楼|屋顶|地板|草地|沙滩'
      + '|地铁|咖啡馆|书店|餐桌|树叶|黄昏|清晨|傍晚|日出|日落|星空|银河|雾气|积水'
      + '|阳台|窗台|小巷"',
    to: '|一只|一张|一幅"',
    expect: '退化了',
  },
  {
    name: '换场景时不清旧答案（旧 family 的答案留在会话里，变成「断掉的旧答案」）',
    file: ENGINE,
    from: "    if (opts && opts.restart) {\n"
      + "      session.answers = {};\n"
      + "      session.customs = {};\n",
    to: "    if (opts && opts.restart) {\n",
    expect: '旧答案没清掉',
  },
  {
    name: '换场景时不把队列拨回新 family 的 core（换完接着问旧链路的题）',
    file: ENGINE,
    from: "      const core = (K.FLOWS[session.family] || K.FLOWS.text).core;\n"
      + "      session.queue = core.slice();\n",
    to: "      const core = (K.FLOWS[session.family] || K.FLOWS.text).core;\n",
    expect: '队列没换成新 family 的 core',
  },
  {
    name: '只换 family 时不重建队列（用户手选了视频，会话却一路问图片的题 —— '
      + '「镜头景别」永远不会出现）',
    file: ENGINE,
    from: 'if (familyChanged || (opts && opts.restart)) {',
    to: 'if (opts && opts.restart) {',
    expect: '只换 family 时队列没重建',
  },
  {
    // 这条对着 09-22 修掉的真 bug：生成语种的正则被 JSON.stringify 抹成 {}，
    // 运行时兜底成 new RegExp("[object Object]") —— 那是个**字符类**
    // （o / b / j / e / c / t / 空格），几乎什么文本都命中，
    // 于是推荐标记**永远落在列表第一项**上。这里直接模拟那个效果。
    name: '推荐预选永远返回第一条规则（还原「正则被抹成 {} 后变成字符类」的效果）',
    file: KNOWLEDGE,
    from: '    if (rules[i][1].test(raw)) return rules[i][0];',
    to: '    if (i === 0 || rules[i][1].test(raw)) return rules[i][0];',
    expect: '推荐错误',
  },

  /* ================= LLMO 那一批 =================
     守的是「模型读到的版本」和「用户读到的版本」是同一个。
     这批的变异点落在 public/ 下的文件上，所以 run: 'llmo'
     —— 跑的是 check-llmo.js，不是 test-engine.js。 */
  {
    // 三处不一致是最典型的形状：页面上看不出任何异常，
    // 只有把三处拿出来对才知道模型读到的是另一个说法。
    name: 'LLMO：meta description 被改字（定义句三处不再逐字一致）',
    file: PUB('index.html'),
    run: 'llmo',
    from: 'content="PromptLens 把「写 Prompt」变成一步步做选择：',
    to: 'content="PromptLens 帮你把「写 Prompt」变成一步步做选择：',
    expect: '正文 = meta description',
  },
  {
    // HowTo 是「标记与内容不符」那一类：改一个步骤名，
    // 页面上四步还是四步，只是结构化数据说了另一件事。
    name: 'LLMO：HowTo 偷改一个步骤名（标记与可见步骤不符）',
    file: PUB('index.html'),
    run: 'llmo',
    from: '"name": "拆解",',
    to: '"name": "拆开",',
    expect: 'HowTo 的步骤与可见步骤逐条一致',
  },
  {
    name: 'LLMO：robots.txt 漏掉一个 AI 爬虫（名单有洞，而文件看着完整）',
    file: PUB('robots.txt'),
    run: 'llmo',
    from: 'User-agent: GPTBot\nAllow: /\n\n',
    to: '',
    expect: '点名了全部 21 个常见 AI 爬虫',
  },
  {
    name: 'LLMO：llms.txt 的锚点指向一个不存在的节（模型点了落地就 404）',
    file: PUB('llms.txt'),
    run: 'llmo',
    from: '/#how)',
    to: '/#how-nope)',
    expect: '锚点在页面里都存在',
  },
  {
    // 陈旧：改了落地页却没重跑 mk-llms.js。
    // 不报错、不崩，只是模型读到的是上一版内容 ——
    // 只有「重新派生再比对」能发现。
    name: 'LLMO：改了落地页却没重跑 mk-llms（llms-full.txt 停在上一版）',
    file: PUB('index.html'),
    run: 'llmo',
    from: '<p>把一句模糊的需求，',
    to: '<p>把一句含糊的需求，',
    expect: '与落地页同步',
  },
  {
    name: 'LLMO：llms-full.txt 里混进 HTML 标签（模型读到一段没解析的标记）',
    file: PUB('llms-full.txt'),
    run: 'llmo',
    from: '# PromptLens',
    to: '<h1>PromptLens</h1>',
    expect: '没有残留的 HTML 标签',
  },
];

let bad = 0;

// 把整个 js 目录拷到临时目录，之后所有读写都发生在副本里。
//
// 副本里要**照原样摆出 assets/ 的层级**，不能把所有 .js 平铺在一个目录里：
// knowledge.js 现在会 `require('../locales/<tag>.js')` 取文案包，
// 平铺之后那个相对路径就指到临时目录外面去了。
// 后果不是「测试报错」那么好看 —— 是加载知识库当场炸掉，
// 于是 41 条变异**每一条**都显示「改坏了、测试失败了」，
// 看上去全被抓住，其实一条都没验到。变异测试最怕的就是这种形状。
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'pl-mut-'));
const TMP_JS = path.join(TMP, 'js');
const TMP_LOCALES = path.join(TMP, 'locales');

function cleanup() {
  try {
    fs.rmSync(TMP, { recursive: true, force: true });
  } catch (e) {
    /* 临时目录删不掉不影响结论 */
  }
}
process.on('exit', cleanup);
['SIGINT', 'SIGTERM', 'SIGHUP'].forEach((sig) => {
  process.on(sig, () => {
    cleanup();
    process.exit(1);
  });
});

fs.mkdirSync(TMP_JS, { recursive: true });
fs.mkdirSync(TMP_LOCALES, { recursive: true });
fs.readdirSync(SRC_DIR).forEach((f) => {
  fs.copyFileSync(path.join(SRC_DIR, f), path.join(TMP_JS, f));
});
// 文案包一起拷，且必须落在 js 的**兄弟目录**里 —— knowledge.js 靠 ../locales/ 找它
fs.readdirSync(LOCALES_DIR).forEach((f) => {
  fs.copyFileSync(path.join(LOCALES_DIR, f), path.join(TMP_LOCALES, f));
});
// server.js 也拷一份：test-engine.js 的「落盘白名单」那条断言读它
fs.copyFileSync(SERVER_SRC, path.join(TMP, 'server.js'));

/* public/ 的相关部分也镜像一份，给 LLMO 那批变异用（PL_PUBLIC_DIR 指过来）。
   只拷检查真正读的那几个文件，不整目录拷 —— assets/ 有几百 KB 的 CSS，
   拷进来只会让每条变异都慢一点。
   语种目录**不写死**：凡是有 index.html 的子目录都算，加语种时不用改这里。 */
const TMP_PUBLIC = path.join(TMP, 'public');
const PUBLIC_SRC = path.join(ROOT, 'public');
/* 根目录必须有全四份 —— 少一份就说明结构变了，宁可当场炸，
   也不要镜像出一份缺文件的副本让 LLMO 那批变异「全绿」。 */
const LLMO_FILES = ['index.html', 'robots.txt', 'llms.txt', 'llms-full.txt'];
fs.mkdirSync(TMP_PUBLIC, { recursive: true });
LLMO_FILES.forEach((f) => {
  if (!fs.existsSync(path.join(PUBLIC_SRC, f))) {
    throw new Error('public/' + f + ' 不见了 —— LLMO 变异没有可改的目标');
  }
  fs.copyFileSync(path.join(PUBLIC_SRC, f), path.join(TMP_PUBLIC, f));
});
/* 语种目录里**没有** robots.txt（那是整站一份，只在根目录），
   所以这里按「源目录有什么就拷什么」来，不假设四份齐全。 */
fs.readdirSync(PUBLIC_SRC).forEach((d) => {
  const src = path.join(PUBLIC_SRC, d);
  if (!fs.statSync(src).isDirectory()) return;
  if (!fs.existsSync(path.join(src, 'index.html'))) return;
  const dst = path.join(TMP_PUBLIC, d);
  fs.mkdirSync(dst, { recursive: true });
  LLMO_FILES.forEach((f) => {
    if (!fs.existsSync(path.join(src, f))) return;
    fs.copyFileSync(path.join(src, f), path.join(dst, f));
  });
});

console.log('（在临时副本上做变异，真源码不动：' + TMP + '）\n');

MUTATIONS.forEach((m, i) => {
  const tag = `[${i + 1}/${MUTATIONS.length}] ` + m.name;
  // server.js 不在 js 目录里（test-engine 那条落盘白名单断言读它），单独定位
  const target = m.file === SERVER
    ? path.join(TMP, 'server.js')
    : path.join(TMP_JS, m.file);
  const original = fs.readFileSync(target, 'utf8');
  const hits = original.split(m.from).length - 1;

  if (hits !== 1) {
    bad += 1;
    console.log('  ✗ ' + tag);
    console.log('      变异点不唯一（命中 ' + hits + ' 次）—— 这条变异本身是坏的，不算数');
    return;
  }

  let out = '';
  let failedAsExpected = false;
  try {
    fs.writeFileSync(target, original.replace(m.from, m.to));
    execFileSync(process.execPath, [path.join(__dirname, RUNNERS[m.run || 'engine'])], {
      cwd: ROOT,
      stdio: 'pipe',
      env: Object.assign({}, process.env, {
        PL_JS_DIR: TMP_JS,
        PL_SERVER_FILE: path.join(TMP, 'server.js'),
        /* 指到镜像的那份 public/。不指过去的话，LLMO 那几条变异会
           「改坏了却全绿」—— 检查脚本读的还是真文件。 */
        PL_PUBLIC_DIR: TMP_PUBLIC,
      }),
    });
  } catch (err) {
    failedAsExpected = true;
    out = String((err.stdout || '') + (err.stderr || ''));
  } finally {
    fs.writeFileSync(target, original);
  }

  if (!failedAsExpected) {
    bad += 1;
    console.log('  ✗ ' + tag);
    console.log('      改坏了代码，测试却照样全绿 —— 说明没有断言在守这件事');
    return;
  }
  if (out.indexOf(m.expect) === -1) {
    bad += 1;
    console.log('  ✗ ' + tag);
    console.log('      测试确实失败了，但失败信息里没有「' + m.expect + '」—— 报错的不是这条断言');
    const line = out.split('\n').filter((l) => l.indexOf('!!') === 0)[0] || '(没找到失败行)';
    console.log('      实际报错：' + line.slice(0, 140));
    return;
  }
  console.log('  ✓ ' + tag);
});

console.log('\n' + '='.repeat(72));
if (bad) {
  console.log(`${bad} 条变异没有被正确捕获 ✗`);
  process.exit(1);
}
console.log('全部 ' + MUTATIONS.length + ' 条变异都被捕获 ✓');
