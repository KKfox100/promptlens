'use strict';

/**
 * 语种自检：**这个语种的关键词表，认不认这个语种自己的输入**。
 *
 * 为什么 `check-locale-parity.js` 管不了这件事：
 *   那边比的是「结构指纹」—— 键、数组长度、正则的条数。它能证明
 *   「英文包里 hasStyle 这条正则还在」，证明不了「它换成了英文的词」。
 *   正则换成 `风格|写实|插画…` 却漏了 `style|realistic|illustration`，
 *   结构指纹一模一样，全绿。
 *
 * 而这类错的表现是：英文用户一开口，场景识别全落到 general ——
 * 他会被带进文字链路，图片 / 视频的那些题**永远不会出现**，
 * 于是他只会说「怎么没有镜头景别」。跟中文那次「短视频被判成图片」是同一个坑。
 *
 * 所以这里必须用**真的句子**去打：每句话都写明它该落到哪个场景。
 *
 * 用法：
 *   node scripts/check-locale-corpus.js              # 所有已有文案包的语种
 *   node scripts/check-locale-corpus.js en ja        # 只看这几个
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const LOCALES_DIR = path.join(ROOT, 'public', 'assets', 'locales');

/* ------------------------------------------------------------------ *
 * 语料：`[期望的场景 id, 句子]`
 * ------------------------------------------------------------------ *
 * 期望的是**场景 id**，不是 family —— family 太粗了。
 * 比如 `coding` 的 family 也是 text，只比 family 的话，
 * 「编程请求被判成通用写作」这种错照样漏过去。
 *
 * 每句话都要是**真人会打出来的样子**：带标点、带口语、混着别的信息。
 * 只写关键词（"code"）的话，它连 `lower.includes()` 那种最笨的实现都能过。
 *
 * ⚠️ 语料要**避开已知的产品缺陷**，别把别人的锅算到 i18n 头上。
 *    现成的一例：「做一张产品海报」会被判成 marketing（海报是营销关键词，值 2 分），
 *    因为 `detectScenario` 的视觉兜底前提是「关键词一个都没命中」，
 *    一个 2 分的关键词就把 9 分的画面加分压掉了。中文英文**一模一样**，
 *    属于既有的启发式问题，不是译文问题 —— 所以这里用「产品图」而不是「产品海报」。
 *    详见 .workbuddy-ai/memory/topics/i18n.md。
 */
const SCENARIOS = {
  'zh-Hans': [
    ['coding', '帮我写一个 JavaScript 函数把数组去重，并解释时间复杂度。'],
    ['coding', '这段代码报错了，帮我看看哪里有问题。'],
    ['image', '画一只坐在雨夜霓虹街道上的猫，特写，电影感，浅景深，9:16 竖屏。'],
    ['image', '做一张产品图，纯色背景，柔和自然光，1:1 方图。'],
    ['video', '拍一段 10 秒的视频：主角从画面外走进咖啡馆，中景，缓慢推近。'],
    ['video', '做一段 30 秒的城市夜景短视频，多镜头切换，要环境音。'],
    ['writing', '写一篇关于远程办公利弊的公众号文章，语气口语一点，控制在 1500 字。'],
    ['marketing', '给一个咖啡品牌做推广策划，包含机制设计和效果衡量方式。'],
  ],
  'zh-Hant': [
    ['coding', '幫我寫一個 JavaScript 函式把陣列去重，並解釋時間複雜度。'],
    ['coding', '這段程式碼報錯了，幫我看看哪裡有問題。'],
    ['image', '畫一隻坐在雨夜霓虹街道上的貓，特寫，電影感，淺景深，9:16 直式。'],
    ['image', '做一張產品圖，純色背景，柔和自然光，1:1 方形。'],
    ['video', '拍一段 10 秒的影片：主角從畫面外走進咖啡廳，中景，緩慢推近。'],
    ['video', '做一段 30 秒的城市夜景短片，多鏡頭切換，要環境音。'],
    ['writing', '寫一篇關於遠距工作優缺點的部落格文章，語氣口語一點，控制在 1500 字。'],
    ['marketing', '幫一個咖啡品牌做推廣企劃，包含機制設計和成效衡量方式。'],
  ],
  en: [
    ['coding', 'Write a JavaScript function that removes duplicates from an array, and explain the time complexity.'],
    ['coding', 'This code throws an error — help me find where the problem is.'],
    ['image', 'Draw a cat sitting on a neon-lit street at night. Close-up, cinematic, shallow depth of field, 9:16 vertical.'],
    ['image', 'Make a product image, solid background, soft natural light, 1:1 square.'],
    ['video', 'Make a 10 second video: the subject walks in from off-screen, medium shot, slow push in.'],
    ['video', 'A 30 second short video of a city at night, multiple shots, with ambient sound.'],
    ['writing', 'Write a blog post about the pros and cons of remote work. Keep it conversational and around 1500 words.'],
    ['marketing', 'Give me a campaign plan for a coffee brand, including the mechanic and how we measure results.'],
  ],
  ja: [
    ['coding', '配列の重複を削除する JavaScript 関数を書いて、計算量も説明してください。'],
    ['coding', 'このコードがエラーになります。どこが問題か見てください。'],
    ['image', '雨の夜のネオン街に座る猫を描いて。クローズアップ、シネマティック、浅い被写界深度、9:16 縦。'],
    ['image', '商品の画像を作って。単色の背景、柔らかい自然光、1:1 正方形。'],
    ['video', '10 秒の動画を作って：被写体が画面外から入ってきて、ミディアムショット、ゆっくりプッシュイン。'],
    ['video', '30 秒の夜の街のショート動画。複数のカット、環境音つき。'],
    ['writing', 'リモートワークのメリットとデメリットについてブログ記事を書いて。口語的に、1500 字程度で。'],
    ['marketing', 'コーヒーブランドの販促キャンペーンを企画して。仕組みと効果測定の方法も含めて。'],
  ],
  ko: [
    ['coding', '배열의 중복을 제거하는 JavaScript 함수를 작성하고 시간 복잡도도 설명해 주세요.'],
    ['coding', '이 코드에서 오류가 납니다. 어디가 문제인지 봐 주세요.'],
    ['image', '비 오는 밤 네온 거리에 앉은 고양이를 그려 주세요. 클로즈업, 시네마틱, 얕은 심도, 9:16 세로.'],
    ['image', '제품 이미지를 만들어 주세요. 단색 배경, 부드러운 자연광, 1:1 정사각형.'],
    ['video', '10초 영상을 만들어 주세요: 피사체가 화면 밖에서 들어오고, 미디엄 샷, 천천히 푸시인.'],
    ['video', '30초 밤거리 숏폼 영상. 여러 컷, 환경음 포함.'],
    ['writing', '재택근무의 장단점에 대한 블로그 글을 써 주세요. 구어체로, 1500자 정도로.'],
    ['marketing', '커피 브랜드 프로모션 기획안을 만들어 주세요. 메커니즘과 효과 측정 방법도 포함해서.'],
  ],
  es: [
    ['coding', 'Escribe una función de JavaScript que elimine los duplicados de un array y explica la complejidad temporal.'],
    ['coding', 'Este código da error. Ayúdame a ver dónde está el problema.'],
    ['image', 'Dibuja un gato sentado en una calle con neones de noche. Primer plano, cinematográfico, poca profundidad de campo, 9:16 vertical.'],
    ['image', 'Haz una imagen de producto, fondo de color sólido, luz natural suave, 1:1 cuadrado.'],
    ['video', 'Haz un vídeo de 10 segundos: el sujeto entra desde fuera de cuadro, plano medio, acercamiento lento.'],
    ['video', 'Un vídeo corto de 30 segundos de una ciudad de noche, varios planos, con sonido ambiente.'],
    ['writing', 'Escribe un artículo de blog sobre las ventajas y desventajas del teletrabajo. Con un tono coloquial y unas 1500 palabras.'],
    ['marketing', 'Dame un plan de campaña para una marca de café, con la mecánica y cómo medimos los resultados.'],
  ],
};

/* ------------------------------------------------------------------ *
 * 线索提取语料：`[family, 句子, 期望命中的信号]`
 * ------------------------------------------------------------------ *
 * 场景判对只是进门。进去之后，引擎靠 `extractSignals` 判断
 * 「用户是不是已经把某个维度说清楚了」—— 说清楚了就不再问那一题。
 * 认不出来的后果是「明明说了还要再问一遍」，用户会觉得很蠢。
 */
const SIGNALS = {
  'zh-Hans': [
    ['image', '特写，电影感，浅景深，9:16 竖屏，不要出现文字', ['composition', 'ratio', 'negative']],
    ['video', '中景，缓慢推近，黄金时刻暖光，带环境音', ['shot', 'move', 'lighting', 'audio']],
    ['text', '语气口语一点，控制在 1500 字以内，不要用专业术语', ['tone', 'length', 'constraint']],
  ],
  'zh-Hant': [
    ['image', '特寫，淺景深，9:16 直式，不要出現文字', ['composition', 'ratio', 'negative']],
    ['video', '中景，緩慢推近，黃金時刻暖光，帶環境音', ['shot', 'move', 'lighting', 'audio']],
    ['text', '語氣口語一點，控制在 1500 字以內，不要用專業術語', ['tone', 'length', 'constraint']],
  ],
  en: [
    ['image', 'Close-up, shallow depth of field, 9:16 vertical, no text', ['composition', 'ratio', 'negative']],
    ['video', 'Medium shot, slow push in, golden hour light, with ambient sound', ['shot', 'move', 'lighting', 'audio']],
    ['text', 'Keep it conversational and around 800 words. Avoid jargon.', ['tone', 'length', 'constraint']],
  ],
  ja: [
    ['image', 'クローズアップ、浅い被写界深度、9:16 縦、文字なし', ['composition', 'ratio', 'negative']],
    ['video', 'ミディアムショット、ゆっくりプッシュイン、ゴールデンアワー、環境音', ['shot', 'move', 'lighting', 'audio']],
    ['text', '口語的に、1500 文字以内で、専門用語は使わないでください', ['tone', 'length', 'constraint']],
  ],
  ko: [
    ['image', '클로즈업, 얕은 심도, 9:16 세로, 텍스트 없음', ['composition', 'ratio', 'negative']],
    ['video', '미디엄 샷, 천천히 푸시인, 골든아워, 환경음', ['shot', 'move', 'lighting', 'audio']],
    ['text', '구어체로, 1500자 이내로, 전문 용어는 쓰지 마세요', ['tone', 'length', 'constraint']],
  ],
  es: [
    ['image', 'Primer plano, poca profundidad de campo, 9:16 vertical, sin texto', ['composition', 'ratio', 'negative']],
    ['video', 'Plano medio, acercamiento lento, luz de hora dorada, con sonido ambiente', ['shot', 'move', 'lighting', 'audio']],
    ['text', 'Con un tono coloquial y unas 800 palabras. Evita la jerga.', ['tone', 'length', 'constraint']],
  ],
};

/** 信号名 → `extractSignals` 返回的字段名 */
const SIGNAL_FIELD = {
  composition: 'hasComposition', lighting: 'hasLighting', style: 'hasStyle',
  color: 'hasColor', ratio: 'hasRatio', negative: 'hasNegative',
  shot: 'hasShot', move: 'hasMove', action: 'hasAction',
  duration: 'hasDuration', audio: 'hasAudio',
  role: 'hasRole', audience: 'hasAudience', format: 'hasFormat',
  tone: 'hasTone', constraint: 'hasConstraint', example: 'hasExample',
  length: 'hasLength', background: 'hasBackground',
};

/* ------------------------------------------------------------------ *
 * 推荐预选语料：`[题目 id, 一句真话, 期望被推荐的选项 id]`
 * ------------------------------------------------------------------ *
 * 为什么必须单独打一遍：
 *   工作台会给「原话里已经藏着答案」的选项加一个**推荐标记**（不替用户选中）。
 *   那些规则是 `recommendRules`，**和上面两套是两码事**：
 *     · 场景识别读 `scenarios[].keywords`
 *     · 线索提取读 `extractPatterns`
 *     · 推荐预选读 `recommendRules`  ← 只有这里在管
 *   而 `recommendRules` 的值是**正则字面量**，`JSON.stringify(/re/)` 是 `{}`，
 *   生成语种曾经整个丢掉它，于是 `new RegExp("[object Object]")` ——
 *   那是个字符类（o/b/j/e/c/t/空格），几乎什么文本都命中，
 *   推荐标记**永远落在列表第一项**：用户写「一只橘猫」却看到「推荐：人物」。
 *   场景识别、线索提取、结构指纹、界面快照**四条都看不见这个**，因为它不报错、
 *   不白屏、结构也没变。只有「拿真话打一遍、看它选中谁」能看见。
 *
 * 句子要用**真人会打的样子**：带别的信息、带口语，别把关键词原样抄进去 ——
 * 抄关键词的话，连 `includes()` 那种最笨的实现都能过。
 */
const RECOMMEND = {
  'zh-Hans': [
    ['img.subject', '一只橘猫蜷在窗台上晒太阳', 'isub.animal'],
    ['img.subject', '一位年轻女人的正面肖像，柔和光', 'isub.person'],
    ['img.subject', '一碗热腾腾的牛肉面，俯拍', 'isub.food'],
    ['img.subject', '一瓶香水放在大理石台面上', 'isub.product'],
    ['img.subject', '一辆复古摩托车停在雨里', 'isub.vehicle'],
    ['img.subject', '一间北欧风格的客厅，落地窗', 'isub.arch'],
    ['img.subject', '雪山脚下的湖泊，日出时分', 'isub.scene'],
    ['img.subject', '用抽象的形状表达孤独这种情绪', 'isub.abstract'],
    ['img.ratio', '做成手机壁纸', 'irat.p916'],
    ['img.ratio', '放在官网首页的横幅', 'irat.l169'],
    ['img.ratio', '电商主图，白底', 'irat.square'],
    ['img.ratio', '做成一张海报', 'irat.p34'],
    ['vid.ratio', '发抖音的竖屏短视频', 'vrat.p916'],
    ['vid.ratio', '放在官网的宣传片', 'vrat.l169'],
    ['vid.ratio', '投信息流广告', 'vrat.square'],
  ],
  'zh-Hant': [
    ['img.subject', '一隻橘貓蜷在窗台上曬太陽', 'isub.animal'],
    ['img.subject', '一位年輕女性的正面肖像，柔光', 'isub.person'],
    ['img.subject', '一碗熱騰騰的牛肉麵，俯拍', 'isub.food'],
    ['img.subject', '一瓶香水放在大理石檯面上', 'isub.product'],
    ['img.subject', '一輛復古機車停在雨裡', 'isub.vehicle'],
    ['img.subject', '一間北歐風格的客廳，落地窗', 'isub.arch'],
    ['img.subject', '雪山腳下的湖泊，日出時分', 'isub.scene'],
    ['img.subject', '用抽象形狀表達孤獨這種情緒', 'isub.abstract'],
    ['img.ratio', '做成手機桌布', 'irat.p916'],
    ['img.ratio', '放在官網首頁的橫幅', 'irat.l169'],
    ['img.ratio', '電商主圖，白底', 'irat.square'],
    ['img.ratio', '做成一張海報', 'irat.p34'],
    ['vid.ratio', '發抖音的直式短影音', 'vrat.p916'],
    ['vid.ratio', '放在官網的宣傳片', 'vrat.l169'],
    ['vid.ratio', '投資訊流廣告', 'vrat.square'],
  ],
  en: [
    ['img.subject', 'a ginger cat curled up on a windowsill in the sun', 'isub.animal'],
    ['img.subject', 'a portrait of a young woman, soft light', 'isub.person'],
    ['img.subject', 'a bowl of hot beef noodle soup, shot from above', 'isub.food'],
    ['img.subject', 'a perfume bottle on a marble counter', 'isub.product'],
    ['img.subject', 'a vintage motorcycle parked in the rain', 'isub.vehicle'],
    ['img.subject', 'a scandinavian living room with floor-to-ceiling windows', 'isub.arch'],
    ['img.subject', 'a lake at the foot of a snowy mountain at sunrise', 'isub.scene'],
    ['img.subject', 'abstract shapes expressing loneliness', 'isub.abstract'],
    ['img.ratio', 'make it a phone wallpaper', 'irat.p916'],
    ['img.ratio', 'a banner for the website homepage', 'irat.l169'],
    ['img.ratio', 'an e-commerce product image on a white background', 'irat.square'],
    ['img.ratio', 'turn it into a poster', 'irat.p34'],
    ['vid.ratio', 'a vertical short video for douyin', 'vrat.p916'],
    ['vid.ratio', 'a promo video for the website', 'vrat.l169'],
    ['vid.ratio', 'an ad for the feed', 'vrat.square'],
  ],
  ja: [
    ['img.subject', '窓辺で丸くなる茶トラの猫', 'isub.animal'],
    ['img.subject', '若い女性の正面の肖像、柔らかい光', 'isub.person'],
    ['img.subject', '熱々の牛肉麺を真上から', 'isub.food'],
    ['img.subject', '大理石の上に置かれた香水のボトル', 'isub.product'],
    ['img.subject', '雨の中に停まったヴィンテージのバイク', 'isub.vehicle'],
    ['img.subject', '北欧風のリビング、大きな窓', 'isub.arch'],
    ['img.subject', '日の出の雪山のふもとの湖', 'isub.scene'],
    ['img.subject', '抽象的な形で孤独を表現する', 'isub.abstract'],
    ['img.ratio', 'スマホの壁紙にする', 'irat.p916'],
    ['img.ratio', '公式サイトのバナーにする', 'irat.l169'],
    ['img.ratio', '白背景のEC商品画像', 'irat.square'],
    ['img.ratio', 'ポスターにする', 'irat.p34'],
    ['vid.ratio', 'tiktok 用の縦動画', 'vrat.p916'],
    ['vid.ratio', '公式サイト用のプロモ映像', 'vrat.l169'],
    ['vid.ratio', 'タイムライン用の広告', 'vrat.square'],
  ],
  ko: [
    ['img.subject', '창가에서 몸을 둥글게 말고 자는 고양이', 'isub.animal'],
    ['img.subject', '젊은 여성의 정면 초상, 부드러운 빛', 'isub.person'],
    ['img.subject', '김이 나는 소고기 국수를 위에서 내려다본', 'isub.food'],
    ['img.subject', '대리석 위에 놓인 향수 병', 'isub.product'],
    ['img.subject', '비 오는 날 세워둔 빈티지 오토바이', 'isub.vehicle'],
    ['img.subject', '북유럽풍 거실, 큰 창', 'isub.arch'],
    ['img.subject', '일출 무렵 설산 아래의 호수', 'isub.scene'],
    ['img.subject', '추상적인 형태로 고독을 표현', 'isub.abstract'],
    ['img.ratio', '스마트폰 배경화면으로 만들기', 'irat.p916'],
    ['img.ratio', '웹사이트 배너로 만들기', 'irat.l169'],
    ['img.ratio', '흰 배경의 이커머스 상품 이미지', 'irat.square'],
    ['img.ratio', '포스터로 만들기', 'irat.p34'],
    ['vid.ratio', '틱톡용 세로 영상', 'vrat.p916'],
    ['vid.ratio', '웹사이트용 홍보 영상', 'vrat.l169'],
    ['vid.ratio', '피드용 광고', 'vrat.square'],
  ],
  es: [
    ['img.subject', 'un gato naranja acurrucado en la ventana al sol', 'isub.animal'],
    ['img.subject', 'un retrato frontal de una mujer joven, luz suave', 'isub.person'],
    ['img.subject', 'un tazón de sopa de fideos con carne, visto desde arriba', 'isub.food'],
    ['img.subject', 'una botella de perfume sobre una encimera de mármol', 'isub.product'],
    ['img.subject', 'una moto vintage aparcada bajo la lluvia', 'isub.vehicle'],
    ['img.subject', 'una sala de estar de estilo nórdico con ventanales', 'isub.arch'],
    ['img.subject', 'un lago al pie de una montaña nevada al amanecer', 'isub.scene'],
    ['img.subject', 'formas abstractas que expresan soledad', 'isub.abstract'],
    ['img.ratio', 'hazlo fondo de pantalla del móvil', 'irat.p916'],
    ['img.ratio', 'un banner para la web', 'irat.l169'],
    ['img.ratio', 'una imagen de producto de e-commerce sobre fondo blanco', 'irat.square'],
    ['img.ratio', 'conviértelo en un póster', 'irat.p34'],
    ['vid.ratio', 'un video vertical para tiktok', 'vrat.p916'],
    ['vid.ratio', 'un video promocional para la web', 'vrat.l169'],
    ['vid.ratio', 'un anuncio para el feed', 'vrat.square'],
  ],
};

/* ------------------------------------------------------------------ */

function loadKnowledge(tag) {
  Object.keys(require.cache).forEach((k) => { delete require.cache[k]; });
  globalThis.window = globalThis;
  globalThis.PromptLensLocales = {};
  globalThis.PromptLensActiveLocale = tag;
  require(path.join(LOCALES_DIR, tag + '.js'));
  return require(path.join(ROOT, 'public', 'assets', 'js', 'knowledge.js'));
}

function main() {
  const want = process.argv.slice(2);
  const all = Object.keys(SCENARIOS);
  const tags = want.length ? want : all;

  let failed = 0;
  let checked = 0;

  tags.forEach((tag) => {
    if (!SCENARIOS[tag] || !RECOMMEND[tag]) {
      console.error('✗ ' + tag + ' 语料不全 —— 加了语种就必须把三份都补上');
      console.error('  （SCENARIOS 场景识别 / SIGNALS 线索提取 / RECOMMEND 推荐预选），');
      console.error('  否则这个语种的关键词表认不认自己的输入，没有任何东西在看着。');
      failed += 1;
      return;
    }
    if (!fs.existsSync(path.join(LOCALES_DIR, tag + '.js'))) {
      console.log('· ' + tag + '：还没有文案包，跳过');
      return;
    }

    checked += 1;
    const K = loadKnowledge(tag);
    console.log('── ' + tag + ' ' + '─'.repeat(Math.max(0, 54 - tag.length)));

    let bad = 0;
    SCENARIOS[tag].forEach(([expectId, text]) => {
      const r = K.detectScenario(text);
      const ok = r.matched.id === expectId;
      if (!ok) bad += 1;
      console.log((ok ? '  ✓' : '  ✗') + ' ' + expectId.padEnd(10) + ' → '
        + r.matched.id.padEnd(12) + '（' + r.matched.family + '，' + r.matched.score + ' 分）');
      if (!ok) console.log('      ' + text);
    });
    console.log('  场景识别 ' + (SCENARIOS[tag].length - bad) + '/' + SCENARIOS[tag].length);

    let sigBad = 0;
    SIGNALS[tag].forEach(([fam, text, expect]) => {
      const got = K.extractSignals(text, fam);
      const miss = expect.filter((d) => !got[SIGNAL_FIELD[d]]);
      if (miss.length) sigBad += 1;
      console.log((miss.length ? '  ✗' : '  ✓') + ' [' + fam + '] 线索 '
        + (expect.length - miss.length) + '/' + expect.length
        + (miss.length ? '  缺：' + miss.join(',') : ''));
      if (miss.length) console.log('      ' + text);
    });
    console.log('  线索提取 ' + (SIGNALS[tag].length - sigBad) + '/' + SIGNALS[tag].length);

    /* ---- 推荐预选：拿真话打一遍，看它选中谁 ---- */
    let recBad = 0;
    RECOMMEND[tag].forEach(([qid, text, expectId]) => {
      const got = K.recommendOption(qid, text);
      const ok = got === expectId;
      if (!ok) recBad += 1;
      console.log((ok ? '  ✓' : '  ✗') + ' [' + qid + '] '
        + (ok ? expectId : String(got) + '（应为 ' + expectId + '）'));
      if (!ok) console.log('      ' + text);
    });
    console.log('  推荐预选 ' + (RECOMMEND[tag].length - recBad) + '/' + RECOMMEND[tag].length);

    if (bad || sigBad || recBad) failed += 1;
  });

  console.log('');
  if (failed) {
    console.error('✗ ' + failed + ' 个语种的自检没过。');
    process.exit(1);
  }
  console.log('全部通过 ✓ （' + checked + ' 个语种）');
}

main();
