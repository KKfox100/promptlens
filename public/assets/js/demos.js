'use strict';

/**
 * PromptLens 选项示例库
 * ------------------------------------------------------------------
 * 「浅景深」「三分法」「莫兰迪色系」这些词，对做设计的人是常识，
 * 对其他人就是天书。用户看不懂术语，就只能凭感觉点，点完又觉得结果不对。
 *
 * 所以每个选项都要带一组「没选 / 选了」的对照：
 *   场景类选项（光线、构图、风格…）→ 画同一个场景，只改这一个参数，看图就懂
 *   文本类选项（语气、篇幅、去 AI 味…）→ 同一段内容，改这一条之后写出来变成什么样
 *
 * 数据分两半：
 *   base / before  是「不加这一条时，模型默认会怎样」
 *   opts[选项id]   是「加了这一条之后变成什么样」
 *
 * 这里只放数据，渲染由 workspace.js 负责，图片由 scene.js 负责。
 */

(function (root) {
  /* ================================================================ *
   * 一、场景类：demo 是一组渲染参数
   * ================================================================ */

  const SCENE = {
    /* ---- 图片 · 景别与构图 ---- */
    'img.composition': {
      // 未选时是「模型自己给的取景」：一个不远不近的镜头、略低于人眼
      base: { shot: 'default', angle: 'default' },
      opts: {
        'icomp.closeup': { shot: 'close' },
        'icomp.medium': { shot: 'medium' },
        'icomp.wide': { shot: 'wide' },
        'icomp.macro': { shot: 'macro' },
        'icomp.centered': { posX: 0.5, guides: 'symmetry' },
        'icomp.rule': { posX: 0.66, guides: 'rule' },
        'icomp.blank': { shot: 'wide', posX: 0.74, guides: 'blank' },
      },
    },

    /* ---- 图片 · 拍摄视角 ---- */
    'img.angle': {
      base: { angle: 'default' },
      opts: {
        'iang.eye': { angle: 'eye' },
        'iang.low': { angle: 'low' },
        'iang.high': { angle: 'high' },
        'iang.dutch': { angle: 'dutch' },
        'iang.pov': { angle: 'pov' },
        'iang.aerial': { angle: 'aerial' },
        'iang.over': { angle: 'over' },
      },
    },

    /* ---- 图片 · 光线 ---- */
    'img.lighting': {
      base: { lightDir: 'front', lightSoft: 0.55, contrast: 0.5 },
      opts: {
        'ilt.soft': { lightDir: 'side', lightSoft: 1, contrast: 0.28 },
        'ilt.golden': { lightDir: 'sideR', lightSoft: 0.5, contrast: 0.6, lightTemp: 'warm' },
        'ilt.blue': { lightSoft: 0.85, lightTemp: 'cool', key: 'low' },
        'ilt.rim': { lightDir: 'back', rim: 1 },
        'ilt.studio': { studio: true, lightDir: 'side', lightSoft: 0.3, contrast: 0.72 },
        'ilt.hard': { lightDir: 'side', lightSoft: 0, contrast: 1 },
        'ilt.neon': { palette: 'neon', glow: 1, key: 'low' },
        'ilt.lowkey': { key: 'low', contrast: 0.7 },
        'ilt.highkey': { key: 'high', contrast: 0.25 },
        'ilt.godray': { lightDir: 'sideR', rays: 1, lightSoft: 0.4 },
      },
    },

    /* ---- 图片 · 风格流派 ---- */
    'img.style': {
      base: {},
      opts: {
        'ist.photo': { style: 'photo' },
        'ist.cinema': { style: 'cinema' },
        'ist.jp': { style: 'jp' },
        'ist.ink': { style: 'ink' },
        'ist.3d': { style: '3d' },
        'ist.cyber': { style: 'cyber' },
        'ist.film': { style: 'film' },
        'ist.flat': { style: 'flat' },
        'ist.oil': { style: 'oil' },
        'ist.concept': { style: 'concept' },
        'ist.pixel': { style: 'pixel' },
        'ist.vapor': { style: 'vapor' },
      },
    },

    /* ---- 图片 · 情绪氛围 ---- */
    'img.mood': {
      base: { lightDir: 'front', lightSoft: 0.55, contrast: 0.5 },
      opts: {
        'imd.calm': { lightSoft: 0.95, contrast: 0.28, palette: 'morandi' },
        'imd.warm': { lightTemp: 'warm', palette: 'warm', lightSoft: 0.85 },
        'imd.tense': { lightSoft: 0.08, contrast: 1.1, key: 'low', palette: 'contrast' },
        'imd.lonely': { shot: 'wide', palette: 'cool', key: 'low', contrast: 0.35 },
        'imd.mystery': { key: 'low', contrast: 0.85, palette: 'cool', dof: 0.7 },
        'imd.energy': { palette: 'contrast', angle: 'dutch', contrast: 0.9 },
        'imd.noble': { palette: 'morandi', shot: 'close', dof: 0.78, lightSoft: 0.9 },
        'imd.retro': { palette: 'faded', grain: 0.32, lightTemp: 'warm' },
      },
    },

    /* ---- 图片 · 色彩基调 ---- */
    'img.palette': {
      base: { palette: 'natural' },
      opts: {
        'ipal.warm': { palette: 'warm' },
        'ipal.cool': { palette: 'cool' },
        'ipal.mono': { palette: 'mono' },
        'ipal.morandi': { palette: 'morandi' },
        'ipal.contrast': { palette: 'contrast' },
        'ipal.bw': { palette: 'bw' },
        'ipal.faded': { palette: 'faded' },
        'ipal.dual': { palette: 'dual' },
      },
    },

    /* ---- 图片 · 画幅比例 ---- */
    'img.ratio': {
      // fit: 'meet' 让画框保持真实形状 —— 否则 1:1 和 21:9 都会被拉满同一个框，
      // 反而看不出「画幅变了」这件事本身
      base: { ratio: '3:2', fit: 'meet' },
      opts: {
        'irat.square': { ratio: '1:1', fit: 'meet' },
        'irat.p34': { ratio: '3:4', fit: 'meet' },
        'irat.p916': { ratio: '9:16', fit: 'meet' },
        'irat.l169': { ratio: '16:9', fit: 'meet' },
        'irat.p23': { ratio: '2:3', fit: 'meet' },
        'irat.cinema': { ratio: '21:9', fit: 'meet' },
      },
    },

    /* ---- 图片 · 画质与镜头 ---- */
    'img.quality': {
      base: {},
      opts: {
        'iql.detail': { detail: 1, dof: 0.04 },
        'iql.dof': { dof: 0.95 },
        'iql.p85': { shot: 'close', dof: 0.6, angle: 'eye' },
        'iql.w24': { shot: 'wide', angle: 'low' },
        'iql.motion': { smear: 1, dof: 0.2 },
        'iql.grain': { grain: 0.45 },
        'iql.8k': { dof: 0.02, contrast: 0.72 },
        'iql.skin': { shot: 'cu', dof: 0.5, angle: 'eye' },
      },
    },

    /* ---- 视频 · 镜头景别 ---- */
    'vid.shot': {
      base: { shot: 'default' },
      opts: {
        'vsh.extreme': { shot: 'extreme' },
        'vsh.wide': { shot: 'wide' },
        'vsh.medium': { shot: 'medium' },
        'vsh.close': { shot: 'close' },
        'vsh.cu': { shot: 'cu' },
        'vsh.macro': { shot: 'macro' },
      },
    },

    /* ---- 视频 · 运镜方式 ---- */
    'vid.move': {
      base: {},
      opts: {
        'vmv.static': { move: 'static' },
        'vmv.push': { move: 'push' },
        'vmv.pull': { move: 'pull' },
        'vmv.pan': { move: 'pan' },
        'vmv.track': { move: 'track' },
        'vmv.orbit': { move: 'orbit' },
        'vmv.crane': { move: 'crane' },
        'vmv.handheld': { move: 'handheld' },
        'vmv.drone': { move: 'drone' },
        'vmv.pov': { move: 'pov' },
      },
    },

    /* ---- 视频 · 光线 ---- */
    'vid.lighting': {
      base: { lightDir: 'front', lightSoft: 0.55, contrast: 0.5 },
      opts: {
        'vlt.natural': { lightDir: 'side', lightSoft: 0.55, contrast: 0.55 },
        'vlt.golden': { lightDir: 'sideR', lightSoft: 0.5, lightTemp: 'warm', contrast: 0.6 },
        'vlt.night': { palette: 'neon', glow: 1, key: 'low' },
        'vlt.studio': { studio: true, lightDir: 'side', lightSoft: 0.3, contrast: 0.72 },
        'vlt.back': { lightDir: 'back', rim: 1 },
        'vlt.overcast': { lightSoft: 1, contrast: 0.26 },
      },
    },

    /* ---- 视频 · 影像风格 ---- */
    'vid.style': {
      base: {},
      opts: {
        'vst.cinema': { style: 'cinema' },
        'vst.doc': { style: 'documentary' },
        'vst.ad': { style: 'ad' },
        'vst.anime': { style: 'anime' },
        'vst.stop': { style: 'stopmotion' },
        'vst.vhs': { style: 'vhs' },
        'vst.cyber': { style: 'cyber' },
        // 「vst.oner」原来在这里，配的是 { move: 'track', style: 'cinema' }。
        // 它已经搬到「剪辑结构」题（vid.cut），而那一题**故意不给对照示例**：
        // 剪辑结构是时间维度的差别，单帧对照图表达不了它；照搬这张
        // 「轨道运镜 + 电影感」的图，只会把刚拆掉的「一镜到底 = 电影感」
        // 重新种回去。详见 test-engine 的 NO_DEMO_OK。
      },
    },

    /* ---- 视频 · 画幅比例 ---- */
    'vid.ratio': {
      base: { ratio: '3:2', fit: 'meet' },
      opts: {
        'vrat.l169': { ratio: '16:9', fit: 'meet' },
        'vrat.p916': { ratio: '9:16', fit: 'meet' },
        'vrat.square': { ratio: '1:1', fit: 'meet' },
        'vrat.cinema': { ratio: '21:9', fit: 'meet' },
        'vrat.p45': { ratio: '4:5', fit: 'meet' },
      },
    },
  };

  /* ================================================================ *
   * 二、文本类：demo 是一段「选完之后写出来的样子」
   * ================================================================ */

  const TEXT = {
    role: {
      before: 'AI 客服是当前企业服务升级的重要方向，需要从技术、成本、体验等多个维度综合评估。',
      opts: {
        'role.expert': '先看三个硬指标：日均工单量、首次解决率、人工成本占比。低于 500 单/天，换 AI 基本不划算。',
        'role.critic': '这个方案的前提就站不住：你把它当降本工具，但它真正吃掉的是客户信任，这笔账没人算。',
        'role.doer': '能干，但要分两步：先让 AI 兜住六成常见问题，人工只接复杂工单，两周就能看出数据。',
        'role.coach': '先别急着换系统。你把最近一个月的工单导出来，我带你看看哪些问题其实根本不用人回。',
        'role.researcher': '现有结论并不一致：有报告称可降本 30%，但样本多来自头部企业，中小规模能否迁移存疑。',
        'role.user': '我上次找客服，绕了三圈机器人还是没解决，最后还是排队等人工。要换的话，别再让我经历一次。',
        'role.beginner': '我不太懂这块。如果换成 AI 客服，客户一上来问的问题，它真的能听懂吗？',
      },
    },

    'role.stance': {
      before: '短视频确实是当前流量增长的重要渠道，加大投入是一个值得考虑的方向。',
      opts: {
        'stance.honest': '全押短视频风险很大：平台规则一变，你的获客成本第二天就能翻倍。',
        'stance.balanced': '全押短视频的好处是起量快、试错便宜；代价是流量归平台，议价权很弱。',
        'stance.supportive': '押注短视频这个判断是对的，起量确实快。想更稳的话，可以留两成预算做私域承接。',
        'stance.challenge': '你说「全押」，那有没有算过：如果平台改了推荐机制，你的退路是什么？',
      },
    },

    audience: {
      before: '该功能的设计遵循了以用户为中心的原则，通过优化交互路径提升了整体使用效率。',
      opts: {
        'aud.public': '说白了，就是让你少点两下。以前要翻三层菜单，现在点一下就到了。',
        'aud.peer': '我们把三级导航压平了，少两次上下文切换，首屏转化提升 11%。',
        'aud.decision': '结论：这次改动能把下单转化提 11%，投入 2 人月。需要你拍板的是要不要顺延下个版本。',
        'aud.client': '调整之后，用户从看到商品到下单少了两步，相当于给您的成交率加了一个百分点。',
        'aud.student': '先想一个问题：你买一杯咖啡，愿意点几次屏幕？我们的改动就是把这个次数降到最低。',
        'aud.self': '三级导航压平 → 少两次点击 → 转化 +11%。待办：补埋点、验灰度。',
      },
    },

    'audience.term': {
      // 默认不是「不解释」，而是「术语堆着用、还夹带英文缩写」—— 这样「直接用」才有对照
      before: '系统采用检索增强生成架构，结合向量化召回与重排序模块，最终由 LLM 完成答案组织。',
      opts: {
        'term.explain': '系统用的是 RAG（先查资料再回答），会从向量数据库（按语义存资料的库）里找出相关片段。',
        'term.direct': '系统通过 RAG 检索增强生成，结合向量数据库召回相关知识片段。',
        'term.bilingual': '系统通过 RAG（Retrieval-Augmented Generation）检索增强生成，结合向量数据库（Vector Database）召回片段。',
        'term.avoid': '系统会先去资料库里翻出最相关的那几段，再照着它们回答你，而不是凭记忆瞎编。',
      },
    },

    format: {
      before: '自己做饭和点外卖各有优劣，需要根据个人情况选择。自己做饭更健康省钱，点外卖更省时间。',
      opts: {
        'fmt.report': '## 结论\n自己做饭胜在长期成本，点外卖胜在时间。\n\n## 成本对比\n…\n\n## 建议\n…',
        'fmt.checklist': '1. 算清你每小时的时间值多少钱\n2. 把一周外卖账单加总\n3. 对比同等菜品的食材成本\n4. 分开处理工作日和周末',
        'fmt.dialogue': '这事其实没那么纠结。你要是一天能省出一小时，那这一小时值不值那几十块差价，就是答案。',
        'fmt.table': '| 维度 | 自己做饭 | 点外卖 |\n| --- | --- | --- |\n| 单餐成本 | 15 元 | 35 元 |\n| 耗时 | 50 分钟 | 5 分钟 |',
        'fmt.article': '一篇约 1500 字、有开头有结尾、可以直接发布的完整文章。',
        'fmt.code': '一段可直接运行的代码，比如按食材价格和耗时算出「自己做饭的盈亏平衡点」。',
        'fmt.outline': '一、成本\n   1. 食材\n   2. 时间\n二、健康\n   1. 油盐\n   2. 食材可控性\n三、结论',
        'fmt.message': '一封可以直接发给室友的消息，包含称呼、结论和结尾。',
        'fmt.slides': '第 1 页｜问题：外卖账单为什么越来越高\n· 月均支出\n· 时间成本\n\n第 2 页｜方案：工作日外卖 + 周末自炊',
      },
    },

    'format.report.length': {
      before: 'AI 默认写 800-1200 字，重点不突出，读完不知道结论是哪句。',
      opts: {
        'rlen.short': '约 700 字：结论 + 两条最关键论据，一页看完。',
        'rlen.mid': '约 1500 字：结论、三条论据、一节风险，两三页。',
        'rlen.long': '约 2800 字：背景、推演过程、数据、风险与建议全覆盖。',
      },
    },

    'format.report.structure': {
      before: '## 分析\n只有正文，没有结论、没有风险、也没有下一步。',
      opts: {
        'rstr.conclusion': '## 结论先行\n（开头一段就把判断说清楚）\n\n## 分析\n…',
        'rstr.evidence': '观点一：…（数据：2024 年抽样 1,200 单）\n观点二：…（案例：A 公司）',
        'rstr.table': '| 方案 | 成本 | 周期 |\n| --- | --- | --- |\n| A | 12 万 | 3 个月 |',
        'rstr.risk': '## 风险与反方视角\n如果平台规则变化，上述结论不成立。',
        'rstr.action': '## 下一步\n1. 本周：导出数据（运营）\n2. 下周：跑灰度（研发）',
        'rstr.open': '## 待确认\n· 预算上限是多少？\n· 是否允许延期上线？',
      },
    },

    'format.checklist.granularity': {
      before: '1. 准备好资料\n2. 开始操作\n3. 完成检查',
      opts: {
        'cgran.coarse': '1. 收集近 30 天工单\n2. 归类高频问题\n3. 配置自动回复\n4. 灰度上线观察',
        'cgran.medium': '1. 收集近 30 天工单\n   做什么：导出全部工单\n   怎么做：后台 → 数据 → 导出 CSV\n   做完：得到一个 CSV 文件',
        'cgran.fine': '1. 登录客服后台（账号用管理员）\n2. 点「数据」→「工单」，时间选「近 30 天」\n3. 点「导出」，格式 CSV，编码 UTF-8\n4. 打开文件，按「问题描述」列排序',
      },
    },

    'format.dialogue.length': {
      before: 'AI 默认写 600 字以上，而且忍不住分点。',
      opts: {
        'dlen.short': '能，但只适合标准品。定制件不行。',
        'dlen.mid': '能，但要看品类。标准件走 AI 没问题，一次解决率能到七成；定制件客户问的都是细节，AI 答不准，反而更耗人。',
        'dlen.long': '能，但要分品类看。…（展开三四层，全程保持自然段落，不切成列表）',
      },
    },

    'format.table.dimension': {
      before: '| 方案 |\n| --- |\n| AI 客服 |\n| 人工客服 |',
      opts: {
        'tdim.core': '| 方案 | 核心特点 |\n| --- | --- |\n| AI 客服 | 7×24 秒回 |',
        'tdim.pro': '| 方案 | 优势 |\n| --- | --- |\n| AI 客服 | 成本低、不排队 |',
        'tdim.con': '| 方案 | 局限 |\n| --- | --- |\n| AI 客服 | 复杂问题答不准 |',
        'tdim.scene': '| 方案 | 适用场景 |\n| --- | --- |\n| AI 客服 | 高频标准问题 |',
        'tdim.cost': '| 方案 | 成本 / 门槛 |\n| --- | --- |\n| AI 客服 | 首次接入约 2 人月 |',
        'tdim.verdict': '| 方案 | 建议 |\n| --- | --- |\n| AI 客服 | 建议先灰度 |',
      },
    },

    'format.article.length': {
      before: 'AI 默认写 1000 字左右，不长不短，没有取舍。',
      opts: {
        'alen.short': '约 800 字，只讲一个观点，一口气读完。',
        'alen.mid': '约 1800 字，有开头、展开和结尾，起承转合完整。',
        'alen.long': '3000 字以上，层层递进，每个论点都配具体案例。',
      },
    },

    'format.article.structure': {
      before: 'AI 默认写成「总—分—总」的论说文。',
      opts: {
        'astr.hook': '开头：「上周我删掉了手机里第 47 个 App。」\n中段：为什么删、删完之后发生了什么\n结尾：回到「我们到底需要几个 App」',
        'astr.story': '全文跟着一个具体的人走：他换过三次客服系统，每次都踩了不同的坑。观点藏在故事里。',
        'astr.list': '一、成本问题\n二、体验问题\n三、数据问题\n三节各自独立，读者可以跳着看。',
        'astr.q': '为什么客服越来越难找？→ 因为成本被压到极限。→ 那省下来的钱去哪了？→ …',
      },
    },

    'format.code.language': {
      before: 'AI 默认自己挑一个最主流的方案，不固定。',
      opts: {
        'clang.unspecified': '我选 Python：生态最全、社区支持最好。理由是…',
        'clang.python': '用 Python 3.11 实现，遵循 PEP 8。',
        'clang.js': '用 TypeScript 5 实现，遵循现代 ES 规范。',
        'clang.other': '按你说明的技术栈实现。',
      },
    },

    'format.code.comments': {
      before: 'AI 默认要么每行都写注释，要么一句都不写。',
      opts: {
        'ccmt.inline': 'if cache.get(k):  # 命中缓存直接返回，避免重复打下游接口',
        'ccmt.after': '（代码）\n\n整体思路：先查缓存，未命中再回源，回源时做一次去重。',
        'ccmt.both': '代码里有关键注释，代码之后还有一段整体思路说明。',
        'ccmt.none': '只有代码块，没有一句说明。',
      },
    },

    'format.outline.depth': {
      before: '一、成本\n二、体验\n三、结论',
      opts: {
        'odep.two': '一、成本\n   · 食材\n   · 时间\n二、健康',
        'odep.three': '一、成本\n   · 食材\n      - 生鲜价格对比\n      - 损耗率\n   · 时间\n      - 备菜耗时',
        'odep.withNote': '一、成本\n   （这一节讲「自己做饭真的更便宜吗」，用一个月账单做材料）\n   · 食材…',
      },
    },

    'format.message.tone': {
      before: 'AI 默认写成「您好，关于此事…」，结尾没有明确诉求。',
      opts: {
        'mtone.push': '…所以想请您在本周五前确认，我这边好安排下一步。',
        'mtone.explain': '…目前进度如上，影响范围是 A 和 B，暂时不需要您做任何动作，有变化我随时同步。',
        'mtone.negotiate': '…如果这次能多给一个人力，您能提前两周拿到结果，我这边也不用砍掉测试环节。',
        'mtone.apologize': '…这件事是我们排期没做好，责任在我们。补救方案：本周先出一版可用版本，下周补齐。',
      },
    },

    'format.slides.count': {
      before: 'AI 默认给 10 页左右。',
      opts: {
        'scnt.short': '5-8 页，每页一个要点，适合 10 分钟汇报。',
        'scnt.mid': '10-15 页，含背景、方案、支撑数据与结论。',
        'scnt.long': '20 页以上，含详细论证、数据与附录。',
      },
    },

    tone: {
      before: '本文将从成本、效率与体验三个维度，对该方案进行系统分析，以期为决策提供参考。',
      opts: {
        'tone.pro': '从成本、效率与体验三个维度看，该方案在当前条件下具备可行性，但需关注实施周期。',
        'tone.warm': '这事儿其实没那么复杂，咱们从三个地方看看，你心里就有数了。',
        'tone.sharp': '能省三成成本，但要多花两个月。划不划算，取决于你缺的是钱还是时间。',
        'tone.humor': '这方案像一件「均码」衣服：谁都能穿，但谁穿都不太合身。',
        'tone.calm': '该方案成本下降约 30%，实施周期增加约 2 个月，两者均为可量化指标。',
        'tone.vivid': '想象一下：月底结账，账单少了三分之一，但你的日历上多出整整两个月的等待。',
      },
    },

    depth: {
      before: 'AI 默认给一段中等长度的论述，结论和理由混在一起。',
      opts: {
        'depth.min': '能做，但不划算。',
        'depth.light': '能做。但要注意两点：实施周期拉长两个月，首次解决率会先降后升。',
        'depth.mid': '能做。理由有三：成本结构…、团队现状…、行业案例…。其中第三点最需要留意。',
        'depth.deep': '能做，但成立条件很窄。推导过程：…；适用边界：日均工单 > 500；反例：B 公司在 200 单/天时接入，反而更贵；不确定：长期留存数据缺失。',
      },
    },

    'depth.why': {
      before: 'AI 默认会解释，但常常解释的是「是什么」，而不是「为什么」。',
      opts: {
        'why.no': '先上 AI 兜底，人工只接复杂工单。',
        'why.key': '先上 AI 兜底、人工只接复杂工单 —— 因为关键指标是首次解决率，不是处理总量。',
        'why.full': '先说为什么这么切：客服的成本不在「回复」，而在「上下文切换」。每次接单都要重读一遍历史，这段开销占了总工时的四成。把标准问题交给 AI，等于把这四成砍掉大半，所以…',
      },
    },

    constraints: {
      before: '这是一个很好的问题！让我们从几个方面来看…（结尾）综上所述，希望对你有所帮助。',
      opts: {
        'con.nogreet': '直接从正文开始，没有「这是一个很好的问题」。',
        'con.norepeat': '不重复你的提问，第一句就是答案。',
        'con.nohallucinate': '2024 年该行业规模约 1.2 万亿（此数据我不确定，建议核实）。',
        'con.nodigress': '只回答你问的，不延伸出「顺便说说私域运营」。',
        'con.nosummary': '写完最后一点就结束，没有「综上所述」。',
        'con.wordlimit': '严格 800 字，799 或 801 都算没做到。',
        'con.source': '转化率提升 11%（来源：内部 A/B 测试，2026-03，样本 4,200）。',
        'con.noemoji': '没有 ✨🚀💡 这类装饰符号。',
        'con.noask': '我先按「日均 500 单」假设，如果你的实际量级不同，结论会变。',
        'con.askfirst': '动手前先确认两件事：你们日均工单量大概多少？现在几个人在接？',
      },
    },

    antiAi: {
      before: '首先，我们需要明确目标。其次，要分析现状。最后，值得注意的是，落地才是关键。总而言之，希望以上内容对您有所帮助。',
      opts: {
        'ai.cliche': '没有「首先/其次/最后」「值得注意的是」「总而言之」。',
        'ai.parallel': '没有三句一排的排比。',
        'ai.antithesis': '没有「不是 A，而是 B」这类对偶句。',
        'ai.rhythm': '先算账。算完你会发现，贵的不是菜，是你站在灶台前的那五十分钟。',
        'ai.concrete': '一顿外卖 35 块，自己做 15 块。差的那 20 块，买的是你 45 分钟。',
        'ai.colloquial': '说实话我也这么干过。后来算了笔账，就懒得点了。',
        'ai.noperpara': '每段不再以总结句收尾，内容自然往下走。',
        'ai.hedge': '没有「一定程度上」「某种程度上」这类限定词。',
        'ai.emotion': '结尾没有拔高到「这不仅是做饭，更是一种生活态度」。',
        'ai.contrast': '不再用破折号做解释和转折。',
      },
    },

    examples: {
      before: 'AI 直接给你成品，你不确定它到底理解对没有。',
      opts: {
        'ex.good': '先看一个我认为写得好的例子：「…」。好在这里：…。下面按这个标准写。',
        'ex.contrast': '正面：「一顿外卖 35 块，自己做 15 块。」\n反面：「综上所述，希望对你有所帮助。」\n差在：全是套话，没有一句具体信息。',
        'ex.none': '跳过示例，直接给成品。',
      },
    },
  };

  /* ================================================================ *
   * 三、合并进知识库
   * ================================================================ */

  /**
   * 把示例挂到题目和选项上。
   * 挂不上的（题目 id 写错、选项已删）不静默吞掉 —— 测试脚本靠这个发现数据漂移。
   */
  /**
   * 当前语种下有没有一份**已翻译**的文本示例。
   *
   * 文本示例是整段样例文字（「AI 客服是当前企业服务升级的重要方向…」），
   * 不是界面标签 —— 换个语种必须整段换掉，翻一半比不翻更难看。
   * 所以规则是：**没有译文就不展示这一块**，而不是把中文样例摆给英语用户看。
   *
   * 译文放在 `assets/locales/demos.<tag>.js`，结构是
   *   `{ 题目id: { before: '…', opts: { 选项id: '…' } } }`
   * key 是题目 / 选项 id（与语种无关），所以不存在「改了中文原文就失联」的问题 ——
   * 这和界面文案用中文当 key 是两套规矩，理由不同：这里的数据本来就是结构化的。
   *
   * 场景类示例不受影响：它是一组 SVG 渲染参数，与语言无关，照常展示。
   */
  function textSpecFor(qid) {
    const tag = root.PromptLensActiveLocale || 'zh-Hans';
    if (tag === 'zh-Hans') return TEXT[qid] || null;
    const pack = (root.PromptLensDemosText || {})[tag];
    return (pack && pack[qid]) || null;
  }

  function apply(K) {
    const missed = [];

    Object.keys(SCENE).forEach((qid) => {
      const q = K.QUESTIONS[qid];
      if (!q) { missed.push('题目 ' + qid); return; }
      const spec = SCENE[qid];
      q.demoKind = 'scene';
      q.demoBase = spec.base || {};
      const ids = {};
      (q.options || []).forEach((o) => { ids[o.id] = true; });
      Object.keys(spec.opts || {}).forEach((oid) => {
        if (!ids[oid]) { missed.push('选项 ' + oid); return; }
        q.options.forEach((o) => { if (o.id === oid) o.demo = spec.opts[oid]; });
      });
    });

    Object.keys(TEXT).forEach((qid) => {
      const q = K.QUESTIONS[qid];
      if (!q) { missed.push('题目 ' + qid); return; }
      const spec = textSpecFor(qid);
      // 这个语种还没有译文 → 整块不挂载。**不是**「漏了」，所以不记进 missed。
      if (!spec) return;
      q.demoKind = 'text';
      q.demoBefore = spec.before || '';
      const ids = {};
      (q.options || []).forEach((o) => { ids[o.id] = true; });
      Object.keys(spec.opts || {}).forEach((oid) => {
        if (!ids[oid]) { missed.push('选项 ' + oid); return; }
        q.options.forEach((o) => { if (o.id === oid) o.demo = spec.opts[oid]; });
      });
    });

    return missed;
  }

  const Demos = { SCENE, TEXT, apply, textSpecFor };
  root.PromptLensDemos = Demos;
  if (typeof module !== 'undefined' && module.exports) module.exports = Demos;

  // 知识库已经在全局上就直接挂载，省得每个调用方都记得调一次 apply。
  // 挂不上的条目记在 PromptLensDemoMissed 里，测试脚本靠它发现数据漂移。
  if (root.PromptLensKnowledge) {
    root.PromptLensDemoMissed = apply(root.PromptLensKnowledge);
  }
})(typeof window !== 'undefined' ? window : globalThis);
