'use strict';

/**
 * PromptLens 文案包 · zh-Hant
 * ------------------------------------------------------------------
 * ⚠️ **这个文件是生成的，不要手改。**
 *    生成器：`node scripts/mk-locale.js zh-Hant`
 *    译文表：`scripts/i18n-src/zh-Hant/kb/*.json`
 *
 * 结构（题目 id / dim / 互斥组 / multi 开关 / 认字正则 / flags）全部照抄
 * `zh-Hans.js`，生成前后会用结构自检比对 —— 手改这里会被下一次生成覆盖，
 * 而且很容易把某个 `multi: true` 改没，那种错不报错、只是规则变形。
 *
 * 文案包必须整体包 IIFE：它和 knowledge.js 都是普通脚本，
 * 顶层 const 共用同一个全局词法作用域，裸写会 SyntaxError 且整页 JS 全挂。
 */

(function (root) {
  const locale = {
  "tag": "zh-Hant",
  "name": "繁體中文",
  "scenarios": [
    {
      "id": "writing",
      "name": "內容寫作",
      "icon": "✍️",
      "desc": "文章、文案、故事、腳本",
      "keywords": [
        "文章",
        "寫一",
        "寫作",
        "文案",
        "公眾號",
        "部落格",
        "知乎",
        "小紅書",
        "稿",
        "小說",
        "故事",
        "劇本",
        "腳本",
        "推文",
        "朋友圈",
        "散文",
        "報導",
        "軟文",
        "標題"
      ]
    },
    {
      "id": "coding",
      "name": "程式設計開發",
      "icon": "💻",
      "desc": "寫程式碼、查 bug、重構",
      "keywords": [
        "程式碼",
        "函式",
        "方法",
        "bug",
        "報錯",
        "異常",
        "重構",
        "api",
        "介面",
        "程式",
        "腳本",
        "sql",
        "資料庫",
        "演算法",
        "前端",
        "後端",
        "python",
        "javascript",
        "java",
        "react",
        "vue",
        "golang",
        "部署",
        "單元測試",
        "效能最佳化"
      ]
    },
    {
      "id": "analysis",
      "name": "分析研究",
      "icon": "📊",
      "desc": "資料、調研、判斷",
      "keywords": [
        "分析",
        "資料",
        "報表",
        "趨勢",
        "統計",
        "對比",
        "調研",
        "洞察",
        "研究",
        "評估",
        "測算",
        "歸因",
        "預測",
        "行業",
        "市場",
        "競品",
        "指標",
        "結論"
      ]
    },
    {
      "id": "marketing",
      "name": "行銷營運",
      "icon": "📣",
      "desc": "推廣、種草、活動",
      "keywords": [
        "行銷",
        "推廣",
        "種草",
        "廣告",
        "投放",
        "活動",
        "私域",
        "轉換",
        "海報",
        "slogan",
        "賣點",
        "帶貨",
        "直播",
        "使用者成長",
        "裂變",
        "文案企劃",
        "品牌"
      ]
    },
    {
      "id": "learning",
      "name": "教學講解",
      "icon": "🎓",
      "desc": "講解、科普、學習",
      "keywords": [
        "講解",
        "解釋",
        "教我",
        "學習",
        "入門",
        "科普",
        "課程",
        "筆記",
        "總結",
        "通俗",
        "舉例說明",
        "是什麼",
        "為什麼",
        "怎麼理解",
        "梳理",
        "知識點",
        "費曼"
      ]
    },
    {
      "id": "business",
      "name": "職場辦公",
      "icon": "📈",
      "desc": "方案、彙報、溝通",
      "keywords": [
        "方案",
        "彙報",
        "ppt",
        "提案",
        "計劃",
        "復盤",
        "郵件",
        "週報",
        "月報",
        "okr",
        "目標",
        "會議",
        "紀要",
        "述職",
        "履歷",
        "面試",
        "流程",
        "制度",
        "商務"
      ]
    },
    {
      "id": "creative",
      "name": "創意構思",
      "icon": "💡",
      "desc": "點子、命名、腦暴",
      "keywords": [
        "創意",
        "點子",
        "頭腦風暴",
        "取名",
        "命名",
        "起名",
        "名字",
        "標語",
        "口號",
        "企劃",
        "靈感",
        "構思",
        "方案設計",
        "玩法"
      ]
    },
    {
      "id": "general",
      "name": "通用任務",
      "icon": "🧩",
      "desc": "其他各種需求",
      "keywords": []
    },
    {
      "id": "image",
      "name": "圖片生成",
      "icon": "🎨",
      "desc": "繪圖、海報、插畫",
      "keywords": [
        "圖片",
        "影像",
        "插畫",
        "畫一張",
        "畫個",
        "畫一幅",
        "畫一張圖",
        "生成圖",
        "出圖",
        "生圖",
        "配圖",
        "桌布",
        "頭像",
        "logo",
        "圖示",
        "繪圖",
        "繪畫",
        "渲染圖",
        "原畫",
        "概念圖",
        "產品圖",
        "商品圖",
        "海報圖",
        "封面圖",
        "二次元圖",
        "動漫圖",
        "攝影作品",
        "midjourney",
        "stable diffusion",
        "dall-e",
        "dalle",
        "文生圖",
        "圖生圖",
        "墊圖",
        "修圖",
        "風格化",
        "視覺稿",
        "插畫風",
        "手繪",
        "賽博朋克",
        "寫實",
        "油畫",
        "水墨",
        "膠片感",
        "極簡",
        "像素風",
        "低多邊形",
        "構圖",
        "景深",
        "虛化",
        "特寫",
        "微距",
        "俯拍",
        "仰拍",
        "黃金時刻",
        "色調",
        "氛圍感",
        "質感",
        "光影",
        "打光",
        "背景虛化"
      ]
    },
    {
      "id": "video",
      "name": "影片生成",
      "icon": "🎬",
      "desc": "短片、運鏡、分鏡",
      "keywords": [
        "影片",
        "短影音",
        "短片",
        "運鏡",
        "鏡頭運動",
        "影片生成",
        "分鏡",
        "轉場",
        "影片腳本",
        "多鏡頭",
        "鏡頭切換",
        "切換鏡頭",
        "連續鏡頭",
        "宣傳片",
        "廣告片",
        "微電影",
        "一鏡到底",
        "影片素材",
        "空鏡",
        "mv",
        "sora",
        "runway",
        "可靈",
        "即夢",
        "pika",
        "veo",
        "文生影片",
        "圖生影片",
        "拍一段",
        "拍個",
        "拍一條",
        "拍攝",
        "延時攝影",
        "慢動作",
        "升格",
        "定格動畫",
        "走在",
        "奔跑",
        "飛過",
        "飄落",
        "鏡頭推",
        "鏡頭拉",
        "鏡頭搖",
        "鏡頭跟",
        "旁白",
        "配樂",
        "音效",
        "轉場"
      ]
    }
  ],
  "questions": {
    "intent": {
      "id": "intent",
      "dim": "task",
      "title": "任務本質",
      "question": "這次你主要想讓 AI 幫你做哪一件事？",
      "helper": "選一個最接近的。拿不準也沒關係，後面每一輪都可以改。",
      "multi": false,
      "perScenario": {
        "writing": [
          {
            "id": "write.create",
            "label": "從零寫一篇",
            "hint": "給我原創內容",
            "fragment": "目標是從零產出一篇完整的原創內容，不要只是給提綱或思路。"
          },
          {
            "id": "write.rewrite",
            "label": "改寫潤色",
            "hint": "意思不變，表達變好",
            "fragment": "在完整保留原意與資訊點的前提下重寫，提升表達品質，不要新增未經我確認的事實。"
          },
          {
            "id": "write.expand",
            "label": "擴寫深化",
            "hint": "把薄的地方寫厚",
            "fragment": "在現有內容基礎上做擴寫，補充細節、案例與論證，把簡略處寫透，不要另起爐灶。"
          },
          {
            "id": "write.shorten",
            "label": "精簡提煉",
            "hint": "砍掉一半還更好讀",
            "fragment": "壓縮篇幅，保留核心資訊與關鍵細節，刪除重複、鋪墊和空話。"
          },
          {
            "id": "write.outline",
            "label": "搭結構大綱",
            "hint": "先要骨架",
            "fragment": "只需要產出結構大綱與每節要點，不要展開成文。"
          }
        ],
        "coding": [
          {
            "id": "code.build",
            "label": "從零實作功能",
            "hint": "給我能跑的程式碼",
            "fragment": "請給出可以直接執行的完整實作，而不是虛擬碼或片段示意。"
          },
          {
            "id": "code.debug",
            "label": "排查修復報錯",
            "hint": "幫我找到問題",
            "fragment": "請定位問題根因並給出修復方案，說明為什麼會出錯，而不只是貼出改好的程式碼。"
          },
          {
            "id": "code.refactor",
            "label": "重構最佳化",
            "hint": "結構更清爽",
            "fragment": "在保持對外行為不變的前提下重構，改善可讀性、可維護性與擴充性。"
          },
          {
            "id": "code.review",
            "label": "程式碼審查",
            "hint": "挑毛病",
            "fragment": "請以嚴格程式碼審查的視角逐條指出問題，按嚴重程度排序，每條都要說明風險與修改建議。"
          },
          {
            "id": "code.explain",
            "label": "解釋這段程式碼",
            "hint": "我看不懂",
            "fragment": "請解釋這段程式碼的執行流程與設計意圖，重點講清楚容易誤解的地方。"
          },
          {
            "id": "code.test",
            "label": "寫測試案例",
            "hint": "覆蓋邊界",
            "fragment": "請編寫測試案例，必須覆蓋正常路徑、邊界條件與異常輸入。"
          }
        ],
        "analysis": [
          {
            "id": "an.insight",
            "label": "從資料裡找洞察",
            "hint": "資料說明什麼",
            "fragment": "請從資料中提煉有價值的洞察，指出反直覺之處，並說明結論的可靠程度與侷限。"
          },
          {
            "id": "an.compare",
            "label": "多方案對比",
            "hint": "幫我做選擇",
            "fragment": "請對各個方案做橫向對比，明確各自的適用條件、代價與風險，最後給出推薦及理由。"
          },
          {
            "id": "an.research",
            "label": "調研一個話題",
            "hint": "把情況摸清",
            "fragment": "請對該話題做系統性梳理，覆蓋現狀、主要玩家、關鍵變數與不確定性。"
          },
          {
            "id": "an.diagnose",
            "label": "歸因分析",
            "hint": "為什麼會這樣",
            "fragment": "請做歸因分析，區分相關性因素與真正的因果驅動因素，並說明判斷依據。"
          },
          {
            "id": "an.forecast",
            "label": "趨勢判斷",
            "hint": "接下來會怎樣",
            "fragment": "請給出趨勢判斷與推演邏輯，明確區分事實、合理推斷與猜測。"
          }
        ],
        "marketing": [
          {
            "id": "mk.idea",
            "label": "出創意方向",
            "hint": "先要想法",
            "fragment": "請給出多個差異化的創意方向，每個方向說明核心主張、目標人群與記憶點。"
          },
          {
            "id": "mk.copy",
            "label": "寫推廣文案",
            "hint": "要能直接用",
            "fragment": "請產出可直接使用的推廣文案，語言要貼合目標平台的內容調性，避免自嗨式表達。"
          },
          {
            "id": "mk.title",
            "label": "打磨標題",
            "hint": "提高點擊率",
            "fragment": "請產出多個標題方案，覆蓋不同情緒切入點，並標註每個方案適合的人群與風險。"
          },
          {
            "id": "mk.persona",
            "label": "使用者畫像分析",
            "hint": "搞清楚給誰看",
            "fragment": "請刻畫目標人群畫像，包含真實使用場景、核心痛點、決策顧慮與資訊獲取習慣。"
          },
          {
            "id": "mk.campaign",
            "label": "活動企劃",
            "hint": "完整方案",
            "fragment": "請給出可落地的活動企劃方案，包含機制設計、傳播路徑、轉換鉤子與成效衡量方式。"
          }
        ],
        "learning": [
          {
            "id": "ln.explain",
            "label": "講懂一個概念",
            "hint": "我要真正理解",
            "fragment": "請把這個概念講到我真正理解為止，從直覺出發，再過渡到嚴謹表述。"
          },
          {
            "id": "ln.path",
            "label": "規劃學習路徑",
            "hint": "我該按什麼順序學",
            "fragment": "請給出循序漸進的學習路徑，標明每個階段的重點、里程碑與常見誤區。"
          },
          {
            "id": "ln.note",
            "label": "整理成筆記",
            "hint": "方便複習",
            "fragment": "請整理成便於複習的筆記結構，突出主幹邏輯與易忘的關鍵點。"
          },
          {
            "id": "ln.quiz",
            "label": "出題考我",
            "hint": "檢驗掌握程度",
            "fragment": "請出題檢驗我的掌握程度，題目要有區分度，並在最後給出答案與解析。"
          },
          {
            "id": "ln.summary",
            "label": "總結一份材料",
            "hint": "抓重點",
            "fragment": "請提煉這份材料的核心內容，保留原作者的論證脈絡，不要摻入你自己的評價。"
          }
        ],
        "business": [
          {
            "id": "bz.proposal",
            "label": "寫方案提案",
            "hint": "要能通過審核",
            "fragment": "請產出結構完整的方案，邏輯上能經得起決策者的追問，重點講清楚價值、代價與可行性。"
          },
          {
            "id": "bz.report",
            "label": "做彙報材料",
            "hint": "講給上級聽",
            "fragment": "請按彙報場景組織內容，結論前置，論據精煉，方便我在有限時間裡講清楚。"
          },
          {
            "id": "bz.review",
            "label": "復盤總結",
            "hint": "找到得失",
            "fragment": "請做復盤，區分主觀原因與客觀原因，指出哪些做法可以沉澱成機制。"
          },
          {
            "id": "bz.mail",
            "label": "寫溝通郵件",
            "hint": "把話說清楚",
            "fragment": "請起草溝通內容，把訴求、背景與下一步動作講清楚，語氣得體但立場明確。"
          },
          {
            "id": "bz.breakdown",
            "label": "拆解目標",
            "hint": "變成可執行",
            "fragment": "請把目標拆解成可執行的任務，明確優先順序、依賴關係與驗收標準。"
          }
        ],
        "creative": [
          {
            "id": "cr.brainstorm",
            "label": "頭腦風暴",
            "hint": "越多越好",
            "fragment": "請做發散式頭腦風暴，先要數量，想法之間要有明顯差異，不要在同一思路上反覆變體。"
          },
          {
            "id": "cr.naming",
            "label": "命名 / 起口號",
            "hint": "要朗朗上口",
            "fragment": "請產出多個命名方案，覆蓋不同風格取向，說明每個方案的含義與適用場景。"
          },
          {
            "id": "cr.story",
            "label": "故事構思",
            "hint": "人物與衝突",
            "fragment": "請構建故事框架，明確核心衝突、人物動機與情緒走向。"
          },
          {
            "id": "cr.concept",
            "label": "視覺概念",
            "hint": "畫面感描述",
            "fragment": "請給出有畫面感的概念描述，包含主體、氛圍、色彩傾向與關鍵視覺元素。"
          }
        ],
        "general": [
          {
            "id": "gn.organize",
            "label": "整理資訊",
            "hint": "把雜亂變清楚",
            "fragment": "請把資訊重新組織成清晰的分類結構，去掉冗餘，保留關鍵細節。"
          },
          {
            "id": "gn.generate",
            "label": "生成內容",
            "hint": "直接給我成品",
            "fragment": "請直接產出可用的成品內容，不要只給思路或框架。"
          },
          {
            "id": "gn.judge",
            "label": "分析判斷",
            "hint": "給我結論",
            "fragment": "請給出明確判斷，並說明支撐結論的關鍵理由與前提條件。"
          },
          {
            "id": "gn.solve",
            "label": "解決問題",
            "hint": "怎麼才能做成",
            "fragment": "請給出解決問題的具體路徑，指出關鍵卡點與應對辦法。"
          },
          {
            "id": "gn.decide",
            "label": "幫做決策",
            "hint": "我該選哪個",
            "fragment": "請幫我做決策，明確推薦哪一項，並說明在什麼條件下應該改變這個選擇。"
          }
        ],
        "image": [
          {
            "id": "im.intent.poster",
            "label": "商業海報 / 廣告圖",
            "hint": "要有視覺重心和留白",
            "fragment": "商業海報用途，畫面需要有明確的視覺重心，並在構圖時預留放標題文字的空間"
          },
          {
            "id": "im.intent.social",
            "label": "社交媒體配圖",
            "hint": "第一眼要抓人",
            "fragment": "社交媒體配圖用途，需要在資訊流裡第一眼就抓住注意力"
          },
          {
            "id": "im.intent.product",
            "label": "產品展示圖",
            "hint": "把產品拍好看",
            "fragment": "產品展示用途，需要清晰呈現產品的外觀、材質與細節"
          },
          {
            "id": "im.intent.character",
            "label": "人物 / 角色形象",
            "hint": "五官比例要準",
            "fragment": "人物形象設定用途，五官清晰、人體比例準確、姿態自然"
          },
          {
            "id": "im.intent.concept",
            "label": "概念探索 / 靈感圖",
            "hint": "可以大膽一些",
            "fragment": "用於概念探索，可以大膽嘗試，不要求完全寫實"
          },
          {
            "id": "im.intent.art",
            "label": "插畫 / 藝術創作",
            "hint": "風格化表達",
            "fragment": "藝術創作用途，鼓勵風格化表達與個人化的視覺語言"
          },
          {
            "id": "im.intent.scene",
            "label": "場景 / 世界觀設定",
            "hint": "環境氛圍為主",
            "fragment": "場景設定用途，重點在於環境氛圍、空間層次與世界觀的可信度"
          }
        ],
        "video": [
          {
            "id": "vd.intent.ad",
            "label": "廣告 / 宣傳片",
            "hint": "質感要高級",
            "fragment": "廣告宣傳片用途，畫面需要有商業級的質感與清晰的資訊傳達"
          },
          {
            "id": "vd.intent.short",
            "label": "短影音 / 社交媒體",
            "hint": "前 3 秒要抓人",
            "fragment": "短影音用途，開頭三秒必須抓住注意力，節奏緊湊"
          },
          {
            "id": "vd.intent.story",
            "label": "故事 / 微電影片段",
            "hint": "有情緒和敘事",
            "fragment": "敘事片段用途，需要有明確的情緒走向與鏡頭語言"
          },
          {
            "id": "vd.intent.anim",
            "label": "動畫 / 二次元",
            "hint": "動漫質感",
            "fragment": "動畫風格，畫面需要有清晰的線條與統一的作畫風格"
          },
          {
            "id": "vd.intent.product",
            "label": "產品動態展示",
            "hint": "把產品拍活",
            "fragment": "產品動態展示用途，需要完整呈現產品的形態、材質與使用場景"
          },
          {
            "id": "vd.intent.mood",
            "label": "氛圍 / 空鏡素材",
            "hint": "沒有主體也行",
            "fragment": "氛圍素材用途，重點是環境動態、光影變化與情緒營造，不需要人物主體"
          }
        ]
      }
    },
    "role": {
      "id": "role",
      "dim": "role",
      "title": "角色身份",
      "question": "你希望 AI 以什麼身份來回答你？",
      "helper": "身份決定了它的判斷標準、說話方式和關注重點。這是最能拉開回答品質的一步。",
      "multi": false,
      "options": [
        {
          "id": "role.expert",
          "label": "領域資深專家",
          "hint": "有實戰經驗的老手",
          "fragment": "你是一位在該領域有十年以上一線實戰經驗的資深專家，既有體系化的判斷力，也能給出可落地的具體動作。",
          "followUps": [
            "role.stance"
          ]
        },
        {
          "id": "role.critic",
          "label": "嚴格的審稿人",
          "hint": "專挑毛病，不恭維",
          "fragment": "你是一位以嚴苛著稱的專業審稿人。你的職責是找出問題而不是讓我舒服，寧可尖銳也不要客套。",
          "followUps": [
            "role.stance"
          ]
        },
        {
          "id": "role.doer",
          "label": "務實的執行者",
          "hint": "只關心能不能做成",
          "fragment": "你是一位注重落地的一線執行者，只關心「能不能做成、具體怎麼做、代價是什麼」，不討論空泛的道理。",
          "followUps": [
            "role.stance"
          ]
        },
        {
          "id": "role.coach",
          "label": "耐心的教練",
          "hint": "一步步帶我做",
          "fragment": "你是一位有耐心的教練，擅長把複雜問題拆成能立刻上手的小步驟，並在最容易踩雷的地方提前提醒我。",
          "followUps": [
            "role.stance"
          ]
        },
        {
          "id": "role.researcher",
          "label": "中立的研究者",
          "hint": "只講證據，不站隊",
          "fragment": "你是一位中立客觀的研究者，只依據可靠證據說話，不預設立場，遇到證據不足的地方會明確說「這裡不確定」。",
          "followUps": [
            "role.stance"
          ]
        },
        {
          "id": "role.user",
          "label": "代入目標使用者本人",
          "hint": "站在對方處境裡想",
          "fragment": "請你代入目標使用者的真實處境來思考：他們的認知水準、真實顧慮和實際使用場景，而不是從一個旁觀者的角度給建議。",
          "followUps": [
            "role.stance"
          ]
        },
        {
          "id": "role.beginner",
          "label": "剛入行的新手",
          "hint": "用外行視角提問",
          "fragment": "請以剛入行的新手視角來回應：遇到不懂的術語就停下來問，不要假裝聽懂，也不要放過任何邏輯跳躍。",
          "followUps": [
            "role.stance"
          ]
        }
      ]
    },
    "role.stance": {
      "id": "role.stance",
      "dim": "role",
      "title": "立場傾向",
      "question": "你希望它說話時的立場是？",
      "helper": "同一個身份，說話的分寸可以完全不同。",
      "multi": false,
      "options": [
        {
          "id": "stance.honest",
          "label": "直說不好聽的",
          "hint": "該潑冷水就潑",
          "fragment": "如果我的想法有問題，請直接指出來，不要為了照顧情緒而含糊其辭。"
        },
        {
          "id": "stance.balanced",
          "label": "客觀中立",
          "hint": "利弊都說清",
          "fragment": "請客觀呈現利弊兩面，不要為了迎合我而放大有利的一面。"
        },
        {
          "id": "stance.supportive",
          "label": "建設性支援",
          "hint": "先肯定再改進",
          "fragment": "請以建設性的方式表達，先指出可行之處，再說明可以改進的地方。"
        },
        {
          "id": "stance.challenge",
          "label": "主動質疑",
          "hint": "反駁我",
          "fragment": "請主動挑戰我的前提假設，指出我可能忽略的盲區，即使我並沒有請你這麼做。"
        }
      ]
    },
    "audience": {
      "id": "audience",
      "dim": "context",
      "title": "目標受眾",
      "question": "這份內容最終是給誰看的？",
      "helper": "同樣的內容，給不同的人看，寫法和深度完全不同。",
      "multi": false,
      "options": [
        {
          "id": "aud.public",
          "label": "完全不懂的普通人",
          "hint": "零基礎讀者",
          "fragment": "受眾是完全沒有相關背景的普通人，任何專業術語第一次出現時都要用日常語言解釋清楚。",
          "followUps": [
            "audience.term"
          ]
        },
        {
          "id": "aud.peer",
          "label": "同行 / 專業人士",
          "hint": "可以講深一點",
          "fragment": "受眾是具備同等專業背景的同行，可以直接使用專業術語與行業慣例，不需要科普式鋪墊。",
          "followUps": [
            "audience.term"
          ]
        },
        {
          "id": "aud.decision",
          "label": "決策者 / 管理者",
          "hint": "只關心結論和代價",
          "fragment": "受眾是需要做決定的管理者，他們時間有限，最關心結論、代價、風險與需要他拍板的事項。",
          "followUps": [
            "audience.term"
          ]
        },
        {
          "id": "aud.client",
          "label": "客戶 / 甲方",
          "hint": "要專業也要好懂",
          "fragment": "受眾是客戶方，既要顯得專業可信，又要避免讓對方產生理解負擔。",
          "followUps": [
            "audience.term"
          ]
        },
        {
          "id": "aud.student",
          "label": "學生 / 初學者",
          "hint": "要照顧學習節奏",
          "fragment": "受眾是正在學習的人，需要由淺入深、有例子、有對照，避免一次性丟擲過多概念。",
          "followUps": [
            "audience.term"
          ]
        },
        {
          "id": "aud.self",
          "label": "就是我自己",
          "hint": "內部草稿，不用客套",
          "fragment": "這份內容是給我自己用的工作草稿，不需要任何禮節性鋪墊，資訊密度越高越好。",
          "followUps": [
            "audience.term"
          ]
        }
      ]
    },
    "audience.term": {
      "id": "audience.term",
      "dim": "context",
      "title": "術語怎麼處理",
      "question": "遇到專業術語時怎麼辦？",
      "helper": "這一條決定了讀起來會不會有距離感。",
      "multi": false,
      "options": [
        {
          "id": "term.explain",
          "label": "第一次出現就解釋",
          "hint": "用一句話說清",
          "fragment": "專業術語第一次出現時，用一句話給出通俗解釋，之後可以放心使用。"
        },
        {
          "id": "term.direct",
          "label": "直接用，不用解釋",
          "hint": "對方看得懂",
          "fragment": "可以直接使用專業術語，不需要額外解釋，節省篇幅。"
        },
        {
          "id": "term.bilingual",
          "label": "中英對照",
          "hint": "附上英文原文",
          "fragment": "關鍵術語採用中英對照寫法，首次出現時附上英文原文。"
        },
        {
          "id": "term.avoid",
          "label": "能不用就不用",
          "hint": "全部換成大白話",
          "fragment": "儘量避免使用專業術語，如果實在無法替代，就用生活化的比喻來講。"
        }
      ]
    },
    "format": {
      "id": "format",
      "dim": "format",
      "title": "輸出形態",
      "question": "你希望最後拿到的東西長什麼樣？",
      "helper": "這是最容易被忽略、但對結果影響最大的一步。選錯了形態，內容再好也不好用。",
      "multi": false,
      "options": [
        {
          "id": "fmt.report",
          "label": "結構化報告",
          "hint": "分章節、有結論",
          "fragment": "以結構化報告的形式輸出，使用 Markdown 二級標題分節，層級清晰。",
          "followUps": [
            "format.report.length",
            "format.report.structure"
          ]
        },
        {
          "id": "fmt.checklist",
          "label": "分步操作清單",
          "hint": "照著做就行",
          "fragment": "以編號步驟的形式輸出，每一步都是可以直接執行的動作。",
          "followUps": [
            "format.checklist.granularity"
          ]
        },
        {
          "id": "fmt.dialogue",
          "label": "像聊天一樣說人話",
          "hint": "不要小標題和列表",
          "fragment": "用連貫的自然段落回答，就像面對面聊天一樣，不要使用小標題、專案符號或編號列表。",
          "followUps": [
            "format.dialogue.length"
          ]
        },
        {
          "id": "fmt.table",
          "label": "表格對比",
          "hint": "一眼看清差異",
          "fragment": "以 Markdown 表格形式輸出對比結果，便於橫向比較。",
          "followUps": [
            "format.table.dimension"
          ]
        },
        {
          "id": "fmt.article",
          "label": "完整長文",
          "hint": "能直接發布",
          "fragment": "輸出一篇結構完整的成稿，可以直接拿去發布，不需要我再補充內容。",
          "followUps": [
            "format.article.length",
            "format.article.structure"
          ]
        },
        {
          "id": "fmt.code",
          "label": "程式碼 + 說明",
          "hint": "能直接跑",
          "fragment": "輸出可直接執行的完整程式碼，並在關鍵位置附上必要的註解說明。",
          "followUps": [
            "format.code.language",
            "format.code.comments"
          ]
        },
        {
          "id": "fmt.outline",
          "label": "大綱 / 思維導圖",
          "hint": "只要骨架",
          "fragment": "只輸出層級分明的結構大綱，用巢狀列表表達從屬關係，不要展開成完整句子。",
          "followUps": [
            "format.outline.depth"
          ]
        },
        {
          "id": "fmt.message",
          "label": "郵件 / 訊息體",
          "hint": "可以直接發出去",
          "fragment": "輸出可直接傳送的完整訊息體，包含合適的稱呼與結尾。",
          "followUps": [
            "format.message.tone"
          ]
        },
        {
          "id": "fmt.slides",
          "label": "投影片大綱",
          "hint": "一頁一個要點",
          "fragment": "按投影片逐頁組織內容，每頁給出標題與 3-5 個要點，要點儘量短。",
          "followUps": [
            "format.slides.count"
          ]
        }
      ]
    },
    "format.report.length": {
      "id": "format.report.length",
      "dim": "format",
      "title": "報告篇幅",
      "question": "報告大概要多長？",
      "multi": false,
      "options": [
        {
          "id": "rlen.short",
          "label": "精簡 · 一頁以內",
          "hint": "只留結論和關鍵論據",
          "fragment": "全文控制在 800 字以內，只保留結論與最關鍵的兩三條論據。"
        },
        {
          "id": "rlen.mid",
          "label": "標準 · 兩三頁",
          "hint": "論據完整但不囉嗦",
          "fragment": "全文約 1200-1800 字，論據完整但每一句都要有資訊量。"
        },
        {
          "id": "rlen.long",
          "label": "詳盡 · 五頁以上",
          "hint": "背景、推演、風險全覆蓋",
          "fragment": "全文不少於 2500 字，需要覆蓋背景、分析、推演過程、風險與建議。"
        }
      ]
    },
    "format.report.structure": {
      "id": "format.report.structure",
      "dim": "format",
      "title": "報告裡要有什麼",
      "question": "報告裡必須包含哪些部分？",
      "helper": "可以多選。",
      "multi": true,
      "options": [
        {
          "id": "rstr.conclusion",
          "label": "結論先行",
          "hint": "開頭就給判斷",
          "fragment": "開頭先給出一段結論摘要，讓讀者三秒內知道核心判斷。"
        },
        {
          "id": "rstr.evidence",
          "label": "分點論述 + 證據",
          "hint": "每個觀點都有支撐",
          "fragment": "每個論點都必須跟隨具體證據、資料或案例支撐，不允許只有觀點沒有依據。"
        },
        {
          "id": "rstr.table",
          "label": "資料表格",
          "hint": "把資料放表格裡",
          "fragment": "關鍵資料用表格呈現，表格要有明確的表頭與單位。"
        },
        {
          "id": "rstr.risk",
          "label": "風險與反方視角",
          "hint": "也說說哪裡會翻車",
          "fragment": "專門用一節說明風險、反方觀點和可能推翻結論的條件。"
        },
        {
          "id": "rstr.action",
          "label": "行動清單",
          "hint": "結尾給下一步",
          "fragment": "結尾給出可執行的行動清單，每條標明負責人角色與優先順序。"
        },
        {
          "id": "rstr.open",
          "label": "待確認問題",
          "hint": "列出還需要我拍板的",
          "fragment": "最後列出仍需我確認或補充資訊的問題，不要替我臆斷。"
        }
      ]
    },
    "format.checklist.granularity": {
      "id": "format.checklist.granularity",
      "dim": "format",
      "title": "步驟粒度",
      "question": "步驟要拆到多細？",
      "multi": false,
      "options": [
        {
          "id": "cgran.coarse",
          "label": "粗粒度 · 3-5 步",
          "hint": "抓主幹",
          "fragment": "把流程拆成 3-5 個大步驟，每步用一句話說明目標。"
        },
        {
          "id": "cgran.medium",
          "label": "中粒度 · 每步帶說明",
          "hint": "能照著做",
          "fragment": "每個步驟下面補充「做什麼、怎麼做、做完是什麼樣」三個要素。"
        },
        {
          "id": "cgran.fine",
          "label": "細粒度 · 逐條可勾選",
          "hint": "細到不用思考",
          "fragment": "把每個步驟拆成可直接勾選的原子動作，包含具體的工具、參數或話術。"
        }
      ]
    },
    "format.dialogue.length": {
      "id": "format.dialogue.length",
      "dim": "format",
      "title": "回答長度",
      "question": "你希望回答多長？",
      "multi": false,
      "options": [
        {
          "id": "dlen.short",
          "label": "幾句話說完",
          "hint": "別鋪墊",
          "fragment": "整段回答控制在 200 字以內，直接說重點，不要任何鋪墊。"
        },
        {
          "id": "dlen.mid",
          "label": "一兩段",
          "hint": "剛好講透",
          "fragment": "用一到兩段話說清楚，長度在 300-500 字之間。"
        },
        {
          "id": "dlen.long",
          "label": "展開聊",
          "hint": "多說幾層",
          "fragment": "可以展開多聊幾層，但保持自然段落，不要變成列表。"
        }
      ]
    },
    "format.table.dimension": {
      "id": "format.table.dimension",
      "dim": "format",
      "title": "對比維度",
      "question": "表格裡要比哪些維度？",
      "multi": true,
      "options": [
        {
          "id": "tdim.core",
          "label": "核心特點",
          "hint": "各自是什麼",
          "fragment": "表格需包含「核心特點」列，用一句話概括。"
        },
        {
          "id": "tdim.pro",
          "label": "優勢",
          "hint": "好在哪",
          "fragment": "表格需包含「優勢」列。"
        },
        {
          "id": "tdim.con",
          "label": "侷限 / 代價",
          "hint": "差在哪",
          "fragment": "表格需包含「侷限或代價」列，必須寫實，不要空著。"
        },
        {
          "id": "tdim.scene",
          "label": "適用場景",
          "hint": "什麼時候用它",
          "fragment": "表格需包含「適用場景」列，說明什麼條件下該選它。"
        },
        {
          "id": "tdim.cost",
          "label": "成本 / 門檻",
          "hint": "要花多少代價",
          "fragment": "表格需包含「成本或門檻」列，包含時間、金錢與學習成本。"
        },
        {
          "id": "tdim.verdict",
          "label": "我的建議",
          "hint": "最後一列給結論",
          "fragment": "表格最後一列給出「建議」，明確寫出推薦或不推薦。"
        }
      ]
    },
    "format.article.length": {
      "id": "format.article.length",
      "dim": "format",
      "title": "文章篇幅",
      "question": "文章大概要寫多長？",
      "multi": false,
      "options": [
        {
          "id": "alen.short",
          "label": "短篇 · 800 字左右",
          "hint": "一個觀點講透",
          "fragment": "全文約 800 字，圍繞一個核心觀點展開。"
        },
        {
          "id": "alen.mid",
          "label": "中篇 · 1500-2000 字",
          "hint": "常規推文長度",
          "fragment": "全文約 1500-2000 字，有完整起承轉合。"
        },
        {
          "id": "alen.long",
          "label": "長篇 · 3000 字以上",
          "hint": "深度內容",
          "fragment": "全文不少於 3000 字，需要有層層遞進的論證與足夠的具體案例。"
        }
      ]
    },
    "format.article.structure": {
      "id": "format.article.structure",
      "dim": "format",
      "title": "文章結構",
      "question": "文章用什麼結構？",
      "multi": false,
      "options": [
        {
          "id": "astr.hook",
          "label": "鉤子開頭 → 展開 → 收束",
          "hint": "適合傳播",
          "fragment": "開頭用一個具體的場景、反常識的事實或尖銳的問題抓住讀者，中段展開論證，結尾收束回主題。"
        },
        {
          "id": "astr.story",
          "label": "故事線貫穿",
          "hint": "用一個案例串起來",
          "fragment": "用一條完整的故事線或案例貫穿全文，把觀點融進敘事裡，不要寫成論說文。"
        },
        {
          "id": "astr.list",
          "label": "分點並列",
          "hint": "條理清楚",
          "fragment": "用並列的小節結構組織全文，每一節獨立成立，讀者可以跳讀。"
        },
        {
          "id": "astr.q",
          "label": "問題驅動",
          "hint": "一路追問",
          "fragment": "用連續的問題推進全文，每回答一個問題就引出下一個，形成層層遞進的節奏。"
        }
      ]
    },
    "format.code.language": {
      "id": "format.code.language",
      "dim": "format",
      "title": "語言與版本",
      "question": "用什麼語言 / 技術棧？",
      "multi": false,
      "options": [
        {
          "id": "clang.unspecified",
          "label": "你沒說，讓 AI 選",
          "hint": "它會選最常見的",
          "fragment": "技術棧未指定時，請選擇最主流、社群支援最好的方案，並在開頭說明你的選擇理由。"
        },
        {
          "id": "clang.python",
          "label": "Python",
          "hint": "",
          "fragment": "請使用 Python 實作，遵循 PEP 8 風格。"
        },
        {
          "id": "clang.js",
          "label": "JavaScript / TypeScript",
          "hint": "",
          "fragment": "請使用 JavaScript 或 TypeScript 實作，遵循現代 ES 規範。"
        },
        {
          "id": "clang.other",
          "label": "其他（我會說明）",
          "hint": "",
          "fragment": ""
        }
      ]
    },
    "format.code.comments": {
      "id": "format.code.comments",
      "dim": "format",
      "title": "程式碼說明方式",
      "question": "程式碼要怎麼講給我聽？",
      "multi": false,
      "options": [
        {
          "id": "ccmt.inline",
          "label": "關鍵處寫註解",
          "hint": "看程式碼就懂",
          "fragment": "在關鍵邏輯處寫行內註解，解釋「為什麼這麼寫」而不是「這行在幹什麼」。"
        },
        {
          "id": "ccmt.after",
          "label": "程式碼後附說明",
          "hint": "單獨講思路",
          "fragment": "程式碼之後單獨用一段文字說明整體思路、關鍵取捨與可能的坑。"
        },
        {
          "id": "ccmt.both",
          "label": "兩個都要",
          "hint": "註解 + 說明",
          "fragment": "既要在關鍵處寫行內註解，也要在程式碼之後補充整體思路說明。"
        },
        {
          "id": "ccmt.none",
          "label": "只要程式碼",
          "hint": "我自己看",
          "fragment": "只輸出程式碼，不需要額外說明。"
        }
      ]
    },
    "format.outline.depth": {
      "id": "format.outline.depth",
      "dim": "format",
      "title": "大綱層級",
      "question": "大綱要拆到第幾層？",
      "multi": false,
      "options": [
        {
          "id": "odep.two",
          "label": "兩層就夠",
          "hint": "大節 + 要點",
          "fragment": "大綱拆到兩層即可，第二層用短語而非完整句子。"
        },
        {
          "id": "odep.three",
          "label": "三層",
          "hint": "細到小點",
          "fragment": "大綱拆到三層，第三層要具體到可以直接動筆的程度。"
        },
        {
          "id": "odep.withNote",
          "label": "三層 + 每節寫什麼",
          "hint": "附上寫作提示",
          "fragment": "在層級大綱的基礎上，為每一節附上一句話說明「這一節要講什麼、用什麼材料」。"
        }
      ]
    },
    "format.message.tone": {
      "id": "format.message.tone",
      "dim": "format",
      "title": "溝通姿態",
      "question": "這封訊息的溝通姿態是？",
      "multi": false,
      "options": [
        {
          "id": "mtone.push",
          "label": "推進事情",
          "hint": "要對方行動",
          "fragment": "溝通目的是推動事情落地，結尾必須給出明確的下一步與時間預期。"
        },
        {
          "id": "mtone.explain",
          "label": "同步資訊",
          "hint": "讓對方知道",
          "fragment": "溝通目的是同步資訊，重點是把背景、現狀和影響講清楚，不需要對方立刻回應。"
        },
        {
          "id": "mtone.negotiate",
          "label": "爭取資源 / 協商",
          "hint": "要說服對方",
          "fragment": "溝通目的是爭取支援，需要先講清對方能獲得什麼，再提我的訴求。"
        },
        {
          "id": "mtone.apologize",
          "label": "說明問題 / 道歉",
          "hint": "處理壞訊息",
          "fragment": "溝通目的是處理負面情況，要先承擔責任、說明現狀，再給補救方案，不要辯解。"
        }
      ]
    },
    "format.slides.count": {
      "id": "format.slides.count",
      "dim": "format",
      "title": "頁數",
      "question": "大概需要多少頁？",
      "multi": false,
      "options": [
        {
          "id": "scnt.short",
          "label": "5-8 頁",
          "hint": "簡短彙報",
          "fragment": "整體控制在 5-8 頁，每頁只講一個要點。"
        },
        {
          "id": "scnt.mid",
          "label": "10-15 頁",
          "hint": "標準提案",
          "fragment": "整體 10-15 頁，需要有完整的背景、方案、支撐與結論。"
        },
        {
          "id": "scnt.long",
          "label": "20 頁以上",
          "hint": "完整方案",
          "fragment": "整體 20 頁以上，需要包含詳細的論證過程、資料支撐與附錄。"
        }
      ]
    },
    "tone": {
      "id": "tone",
      "dim": "style",
      "title": "語氣風格",
      "question": "你希望它用什麼語氣跟你說話？",
      "helper": "語氣決定了這段內容讀起來像不像一個真人在說話，也是「AI 腔」最集中的地方。",
      "multi": false,
      "options": [
        {
          "id": "tone.pro",
          "label": "專業嚴謹",
          "hint": "克制、準確",
          "fragment": "語氣專業嚴謹，用詞準確克制，避免情緒化表達和誇張形容。"
        },
        {
          "id": "tone.warm",
          "label": "親切自然",
          "hint": "像朋友聊天",
          "fragment": "語氣親切自然，像朋友之間聊天，可以有口語表達和適度的情緒。"
        },
        {
          "id": "tone.sharp",
          "label": "直接犀利",
          "hint": "不繞彎子",
          "fragment": "語氣直接犀利，開門見山，不說場面話，該下判斷就下判斷。"
        },
        {
          "id": "tone.humor",
          "label": "幽默輕鬆",
          "hint": "能笑一下",
          "fragment": "語氣輕鬆幽默，可以用比喻和玩笑來降低理解門檻，但不要為了搞笑犧牲資訊量。"
        },
        {
          "id": "tone.calm",
          "label": "冷靜客觀",
          "hint": "不帶感情色彩",
          "fragment": "語氣冷靜客觀，只陳述事實與推理，不表達情緒傾向。"
        },
        {
          "id": "tone.vivid",
          "label": "有感染力",
          "hint": "讀起來有畫面",
          "fragment": "語氣有感染力，善用具體的畫面和細節，讓讀者能「看見」你描述的東西。"
        }
      ]
    },
    "depth": {
      "id": "depth",
      "dim": "style",
      "title": "詳細程度",
      "question": "你希望它講得多細？",
      "helper": "講多細決定了結果能不能直接拿去用 —— 要結論就別讓它寫論文。",
      "multi": false,
      "options": [
        {
          "id": "depth.min",
          "label": "極簡",
          "hint": "只要結論",
          "fragment": "只給結論和最少必要的說明，不要展開論證過程。",
          "followUps": [
            "depth.why"
          ]
        },
        {
          "id": "depth.light",
          "label": "簡明",
          "hint": "結論 + 關鍵理由",
          "fragment": "給出結論並附上最關鍵的兩三條理由，其餘細節省略。",
          "followUps": [
            "depth.why"
          ]
        },
        {
          "id": "depth.mid",
          "label": "適中",
          "hint": "完整論述",
          "fragment": "給出完整的論述過程，觀點和依據都要交代清楚。",
          "followUps": [
            "depth.why"
          ]
        },
        {
          "id": "depth.deep",
          "label": "深入",
          "hint": "含推演、邊界與反例",
          "fragment": "深入展開，包含推導過程、適用邊界、反例與不確定性說明。",
          "followUps": [
            "depth.why"
          ]
        }
      ]
    },
    "depth.why": {
      "id": "depth.why",
      "dim": "style",
      "title": "要不要講為什麼",
      "question": "需要解釋「為什麼」嗎？",
      "multi": false,
      "options": [
        {
          "id": "why.no",
          "label": "不用，給答案就行",
          "hint": "我只要結果",
          "fragment": "不需要解釋推導過程，直接給答案。"
        },
        {
          "id": "why.key",
          "label": "只講關鍵那一步",
          "hint": "點到為止",
          "fragment": "只在最容易被誤解或最關鍵的那一步解釋原因，其餘略過。"
        },
        {
          "id": "why.full",
          "label": "要，講透",
          "hint": "我想學方法",
          "fragment": "需要把背後的原理和推理鏈條講透，讓我不僅知道答案，還知道方法。"
        }
      ]
    },
    "constraints": {
      "id": "constraints",
      "dim": "constraint",
      "title": "硬性約束",
      "question": "有哪些「絕對不要」或「必須做到」？",
      "helper": "可以多選，也可以一個都不選。這些是防止 AI 跑偏的護欄。",
      "multi": true,
      "optional": true,
      "options": [
        {
          "id": "con.nogreet",
          "label": "不要開場白和客套",
          "hint": "別說「這是個好問題」",
          "fragment": "不要任何開場白、客套話或對我問題的複述，直接從正文開始。"
        },
        {
          "id": "con.norepeat",
          "label": "不要複述我的問題",
          "hint": "直接回答",
          "fragment": "不要重複或改寫我的提問，直接進入回答。"
        },
        {
          "id": "con.nohallucinate",
          "label": "不確定就說不確定",
          "hint": "別編",
          "fragment": "如果資訊不足或你不確定，請直接說明「這一點我不確定」，嚴禁編造資料、來源或事實。"
        },
        {
          "id": "con.nodigress",
          "label": "不要跑題延伸",
          "hint": "別扯別的",
          "fragment": "不要延伸到與主題無關的內容，也不要主動擴充我的需求範圍。"
        },
        {
          "id": "con.nosummary",
          "label": "不要結尾總結",
          "hint": "別再來一遍",
          "fragment": "不要在結尾做總結、昇華或重複前文，寫完就結束。"
        },
        {
          "id": "con.wordlimit",
          "label": "嚴格遵守字數",
          "hint": "超了就是沒做到",
          "fragment": "嚴格遵守我給出的字數要求，超出或不足都算沒有完成任務。"
        },
        {
          "id": "con.source",
          "label": "涉及事實要標來源",
          "hint": "或標明不確定",
          "fragment": "涉及具體資料、時間、人名或研究結論時，必須標註來源；無法確認的，明確標記為「待核實」。"
        },
        {
          "id": "con.noemoji",
          "label": "不要 emoji 和花哨符號",
          "hint": "純文字",
          "fragment": "不要使用 emoji 或裝飾性符號。"
        },
        {
          "id": "con.noask",
          "label": "不要反問我",
          "hint": "自己判斷",
          "fragment": "不要向我反問或要求補充資訊，請基於現有資訊做出最合理的假設，並說明你假設了什麼。",
          "group": "ask"
        },
        {
          "id": "con.askfirst",
          "label": "資訊不夠就先問我",
          "hint": "別瞎猜",
          "fragment": "如果關鍵資訊不足，先向我提出最必要的 1-3 個問題，等我回答後再動手，不要憑猜測開工。",
          "group": "ask"
        }
      ]
    },
    "antiAi": {
      "id": "antiAi",
      "dim": "constraint",
      "title": "去 AI 味",
      "question": "要不要幫你去掉那股「AI 腔」？",
      "helper": "這是很多人最在意的部分。勾選後會被寫成明確的寫作禁令。",
      "multi": true,
      "optional": true,
      "options": [
        {
          "id": "ai.cliche",
          "label": "停用套話",
          "hint": "「首先其次最後」「值得注意的是」",
          "fragment": "禁止使用以下套話：首先/其次/最後、值得注意的是、總而言之、綜上所述、在當今社會、隨著…的發展、讓我們一起、希望對你有幫助。"
        },
        {
          "id": "ai.parallel",
          "label": "禁止排比堆砌",
          "hint": "別三句一排",
          "fragment": "禁止使用排比句式和刻意工整的對仗結構，不要為了節奏感堆砌短句。"
        },
        {
          "id": "ai.antithesis",
          "label": "禁止對偶句式",
          "hint": "「不是A，而是B」",
          "fragment": "禁止使用「不是 A，而是 B」「與其說…不如說…」這類對偶句式。"
        },
        {
          "id": "ai.rhythm",
          "label": "句長要錯落",
          "hint": "別一個節奏到底",
          "fragment": "句子長短要有明顯變化，允許出現短句甚至不完整句，避免機械工整的節奏。"
        },
        {
          "id": "ai.concrete",
          "label": "多用具體名詞和動詞",
          "hint": "少形容詞",
          "fragment": "多用具體的名詞和動詞，少用形容詞、副詞和抽象概括；能用例子說清的，就不要用概括。"
        },
        {
          "id": "ai.colloquial",
          "label": "允許口語和碎句",
          "hint": "像人寫的",
          "fragment": "允許使用口語表達、插入語和省略句，不必每句都完整規範。"
        },
        {
          "id": "ai.noperpara",
          "label": "不要每段都總結",
          "hint": "別句句收口",
          "fragment": "不要每一段都以總結句收尾，讓內容自然推進。"
        },
        {
          "id": "ai.hedge",
          "label": "少用模糊限定詞",
          "hint": "「一定程度上」「某種程度上」",
          "fragment": "減少「一定程度上」「某種程度上」「在某種意義上」這類模糊限定詞的使用。"
        },
        {
          "id": "ai.emotion",
          "label": "不要強行昇華",
          "hint": "別拔高主題",
          "fragment": "不要在結尾拔高主題或進行情緒昇華，該停就停。"
        },
        {
          "id": "ai.contrast",
          "label": "少用破折號連線",
          "hint": "——別濫用",
          "fragment": "不要濫用破折號來做解釋或轉折，改用正常的句子結構。"
        }
      ]
    },
    "examples": {
      "id": "examples",
      "dim": "example",
      "title": "範例參考",
      "question": "需要它先給例子嗎？",
      "helper": "給例子是最有效的「對齊」手段，能大幅減少來回返工。",
      "multi": false,
      "options": [
        {
          "id": "ex.good",
          "label": "先給 1-2 個正面範例",
          "hint": "照著這個感覺來",
          "fragment": "在正式輸出前，先給出 1-2 個正面範例，明確「好的標準是什麼」，再按這個標準產出內容。"
        },
        {
          "id": "ex.contrast",
          "label": "正反對比範例",
          "hint": "一個反面教材",
          "fragment": "在正式輸出前，先給出一個正面範例和一個反面範例，並說明反面範例差在哪裡。"
        },
        {
          "id": "ex.none",
          "label": "不用，直接來",
          "hint": "別浪費時間",
          "fragment": "不需要範例，直接輸出最終內容。"
        }
      ]
    },
    "img.subject": {
      "id": "img.subject",
      "dim": "subject",
      "title": "畫面主體",
      "question": "畫面裡最主要的東西是什麼？",
      "helper": "主體是整張圖的錨點。先說清楚它，後面那些風格、光線才有意義。",
      "multi": false,
      "options": [
        {
          "id": "isub.person",
          "label": "人物",
          "hint": "人像、角色",
          "fragment": "畫面主體是人物",
          "followUps": [
            "img.subject.person"
          ]
        },
        {
          "id": "isub.animal",
          "label": "動物",
          "hint": "寵物、野生動物",
          "fragment": "畫面主體是動物",
          "followUps": [
            "img.subject.animal"
          ]
        },
        {
          "id": "isub.product",
          "label": "產品 / 靜物",
          "hint": "商品、物件",
          "fragment": "畫面主體是產品靜物",
          "followUps": [
            "img.subject.product"
          ]
        },
        {
          "id": "isub.scene",
          "label": "風景 / 場景",
          "hint": "自然、城市、空間",
          "fragment": "畫面主體是環境場景，沒有突出的人物"
        },
        {
          "id": "isub.arch",
          "label": "建築 / 空間",
          "hint": "室內、外觀",
          "fragment": "畫面主體是建築空間，需要體現結構與透視關係"
        },
        {
          "id": "isub.food",
          "label": "食物",
          "hint": "菜品、飲品",
          "fragment": "畫面主體是食物，需要突出色澤與誘人的質感"
        },
        {
          "id": "isub.vehicle",
          "label": "機械 / 載具",
          "hint": "車、機甲、飛船",
          "fragment": "畫面主體是機械載具，需要體現結構細節與金屬質感"
        },
        {
          "id": "isub.abstract",
          "label": "抽象概念",
          "hint": "情緒、概念視覺化",
          "fragment": "畫面主體是抽象概念的視覺化表達，不追求具象寫實"
        }
      ]
    },
    "img.subject.person": {
      "id": "img.subject.person",
      "dim": "subject",
      "title": "人物感覺",
      "question": "這個人物的感覺更接近哪一種？",
      "multi": false,
      "options": [
        {
          "id": "iper.natural",
          "label": "自然寫實的人像",
          "hint": "像真實拍出來的",
          "fragment": "寫實自然的人物形象，皮膚有真實紋理，表情放鬆不造作"
        },
        {
          "id": "iper.action",
          "label": "正在做某件事",
          "hint": "有動作、有故事感",
          "fragment": "人物正在專注地做某件事，帶有抓拍的瞬間感與故事性"
        },
        {
          "id": "iper.fashion",
          "label": "時尚大片質感",
          "hint": "有造型和張力",
          "fragment": "時尚雜誌大片質感，造型有設計感，姿態有張力"
        },
        {
          "id": "iper.anime",
          "label": "動漫 / 二次元角色",
          "hint": "非寫實",
          "fragment": "二次元角色風格，線條清晰，配色明亮"
        },
        {
          "id": "iper.group",
          "label": "多人群像",
          "hint": "兩個人以上",
          "fragment": "畫面中有多個人物，需要處理好彼此的位置關係與視線互動"
        }
      ]
    },
    "img.subject.animal": {
      "id": "img.subject.animal",
      "dim": "subject",
      "title": "動物感覺",
      "question": "動物以什麼狀態出現？",
      "multi": false,
      "options": [
        {
          "id": "iani.cute",
          "label": "可愛萌寵",
          "hint": "想讓人想摸",
          "fragment": "可愛的寵物形象，毛髮柔軟蓬鬆，眼神有神"
        },
        {
          "id": "iani.wild",
          "label": "野生動物紀實",
          "hint": "自然、有力量",
          "fragment": "野生動物紀實感，體現動物的力量與自然環境"
        },
        {
          "id": "iani.humanized",
          "label": "擬人化",
          "hint": "穿衣服、做人事",
          "fragment": "擬人化的動物形象，穿著衣物或從事人類活動，帶幽默感"
        },
        {
          "id": "iani.art",
          "label": "藝術化處理",
          "hint": "插畫或風格化",
          "fragment": "經過藝術化處理的動物形象，不追求寫實"
        }
      ]
    },
    "img.subject.product": {
      "id": "img.subject.product",
      "dim": "subject",
      "title": "產品呈現方式",
      "question": "產品怎麼展示？",
      "multi": false,
      "options": [
        {
          "id": "iprd.clean",
          "label": "純色背景商品圖",
          "hint": "電商主圖",
          "fragment": "純淨單色背景，產品居中，光線均勻，沒有多餘元素"
        },
        {
          "id": "iprd.scene",
          "label": "場景化產品圖",
          "hint": "放進使用場景裡",
          "fragment": "產品融入真實使用場景，透過環境暗示它的用途與調性"
        },
        {
          "id": "iprd.detail",
          "label": "材質特寫",
          "hint": "強調手感與工藝",
          "fragment": "近距離特寫，重點呈現產品的材質、紋理與做工細節"
        },
        {
          "id": "iprd.concept",
          "label": "概念化海報",
          "hint": "有創意設定",
          "fragment": "概念化的產品海報，用有創意的視覺設定表達產品主張"
        }
      ]
    },
    "img.composition": {
      "id": "img.composition",
      "dim": "composition",
      "title": "景別與構圖",
      "question": "鏡頭離主體多遠？怎麼取景？",
      "helper": "景別決定了資訊量 —— 特寫講細節，全景講關係。",
      "multi": false,
      "options": [
        {
          "id": "icomp.closeup",
          "label": "特寫",
          "hint": "只拍區域性，強調細節",
          "fragment": "特寫構圖，主體佔據畫面大部分面積",
          "followUps": [
            "img.angle"
          ]
        },
        {
          "id": "icomp.medium",
          "label": "中景",
          "hint": "最常用的距離",
          "fragment": "中景構圖，主體完整呈現並保留適度的環境資訊",
          "followUps": [
            "img.angle"
          ]
        },
        {
          "id": "icomp.wide",
          "label": "全景 / 環境人像",
          "hint": "人小景大",
          "fragment": "全景構圖，環境佔主導，主體在場景中只佔較小比例",
          "followUps": [
            "img.angle"
          ]
        },
        {
          "id": "icomp.macro",
          "label": "微距",
          "hint": "貼到最近拍",
          "fragment": "微距特寫，極近距離呈現表面紋理與微小細節",
          "followUps": [
            "img.angle"
          ]
        },
        {
          "id": "icomp.centered",
          "label": "對稱居中",
          "hint": "穩定、莊重",
          "fragment": "對稱居中構圖，畫面左右平衡，視覺重心落在正中",
          "followUps": [
            "img.angle"
          ]
        },
        {
          "id": "icomp.rule",
          "label": "三分法",
          "hint": "自然、舒服",
          "fragment": "三分法構圖，主體位於畫面的黃金分割點上",
          "followUps": [
            "img.angle"
          ]
        },
        {
          "id": "icomp.blank",
          "label": "大面積留白",
          "hint": "給文字留位置",
          "fragment": "畫面大面積留白，主體偏置，為文字排版預留空間",
          "followUps": [
            "img.angle"
          ]
        }
      ]
    },
    "img.angle": {
      "id": "img.angle",
      "dim": "composition",
      "title": "拍攝視角",
      "question": "從什麼角度去看？",
      "multi": false,
      "options": [
        {
          "id": "iang.eye",
          "label": "平視",
          "hint": "自然的觀察角度",
          "fragment": "平視視角，接近人眼高度"
        },
        {
          "id": "iang.low",
          "label": "仰視",
          "hint": "顯高、有氣勢",
          "fragment": "低角度仰拍，主體顯得高大有壓迫感"
        },
        {
          "id": "iang.high",
          "label": "俯視",
          "hint": "全域性、渺小感",
          "fragment": "高角度俯拍，呈現全域性關係"
        },
        {
          "id": "iang.dutch",
          "label": "傾斜構圖",
          "hint": "不安、動感",
          "fragment": "傾斜的荷蘭角構圖，帶來輕微的不穩定感"
        },
        {
          "id": "iang.pov",
          "label": "第一人稱視角",
          "hint": "代入感強",
          "fragment": "第一人稱視角，像觀看者親眼所見"
        },
        {
          "id": "iang.aerial",
          "label": "航拍俯瞰",
          "hint": "大場景",
          "fragment": "航拍俯瞰視角，強調地形與空間格局"
        },
        {
          "id": "iang.over",
          "label": "過肩 / 背身",
          "hint": "用前景引導視線",
          "fragment": "過肩或背身視角，用前景人物引導視線看向畫面深處"
        }
      ]
    },
    "img.lighting": {
      "id": "img.lighting",
      "dim": "lighting",
      "title": "光線",
      "question": "光是怎麼打的？",
      "helper": "光是畫面裡最貴的東西。同一張構圖，換一種光就是另一個故事。",
      "multi": true,
      "options": [
        {
          "id": "ilt.soft",
          "label": "柔和自然光",
          "hint": "陰天、窗邊",
          "fragment": "柔和均勻的自然光，陰影過渡平緩",
          "group": [
            "source",
            "quality"
          ]
        },
        {
          "id": "ilt.golden",
          "label": "黃金時刻暖光",
          "hint": "日出日落",
          "fragment": "黃金時刻的低角度暖光，畫面泛著金橙色",
          "group": [
            "source",
            "time"
          ]
        },
        {
          "id": "ilt.blue",
          "label": "藍調時刻冷光",
          "hint": "天剛黑的那一會兒",
          "fragment": "藍調時刻的冷色環境光，整體偏青藍",
          "group": [
            "source",
            "time"
          ]
        },
        {
          "id": "ilt.rim",
          "label": "側逆光 / 輪廓光",
          "hint": "勾出主體邊緣",
          "fragment": "強烈的側逆光，在主體邊緣勾出明亮的輪廓線"
        },
        {
          "id": "ilt.studio",
          "label": "影棚布光",
          "hint": "乾淨可控",
          "fragment": "影棚布光，主光與輔光層次分明，背景乾淨",
          "group": "source"
        },
        {
          "id": "ilt.hard",
          "label": "硬光 / 強陰影",
          "hint": "對比強烈",
          "fragment": "硬質直射光，陰影邊緣銳利，明暗對比強烈",
          "group": "quality"
        },
        {
          "id": "ilt.neon",
          "label": "霓虹 / 賽博彩光",
          "hint": "彩色人造光",
          "fragment": "霓虹燈與彩色人造光源，畫面有強烈的色彩反射",
          "group": "source"
        },
        {
          "id": "ilt.lowkey",
          "label": "暗調照明",
          "hint": "大面積黑，只亮區域性",
          "fragment": "低調照明，畫面以暗部為主，只有區域性被點亮",
          "group": "key"
        },
        {
          "id": "ilt.highkey",
          "label": "高調明亮",
          "hint": "通透、乾淨",
          "fragment": "高調照明，畫面明亮通透，幾乎沒有濃重陰影",
          "group": "key"
        },
        {
          "id": "ilt.godray",
          "label": "體積光 / 丁達爾",
          "hint": "看得見的光束",
          "fragment": "體積光效果，空氣中可見清晰的光束與塵埃顆粒"
        }
      ]
    },
    "img.style": {
      "id": "img.style",
      "dim": "style",
      "title": "風格流派",
      "question": "你想要哪種視覺風格？",
      "helper": "最多選兩個。畫法只能選一種，氛圍感可以疊加（比如「寫實攝影 + 電影感」）。",
      "multi": true,
      "maxPick": 2,
      "options": [
        {
          "id": "ist.photo",
          "label": "寫實攝影",
          "hint": "像真拍的照片",
          "fragment": "寫實攝影風格，光影與質感符合真實物理",
          "group": "medium"
        },
        {
          "id": "ist.cinema",
          "label": "電影感",
          "hint": "膠片色調、高動態",
          "fragment": "電影畫面質感，膠片色彩，高動態範圍"
        },
        {
          "id": "ist.jp",
          "label": "日系清新",
          "hint": "通透、低對比",
          "fragment": "日系清新風格，高亮度低對比，通透乾淨"
        },
        {
          "id": "ist.ink",
          "label": "國風水墨",
          "hint": "留白、寫意",
          "fragment": "中國水墨風格，講究留白與寫意，筆觸有呼吸感",
          "group": "medium"
        },
        {
          "id": "ist.3d",
          "label": "3D 渲染",
          "hint": "C4D / Blender 質感",
          "fragment": "三維渲染質感，材質與光線符合物理渲染規律",
          "group": "medium"
        },
        {
          "id": "ist.cyber",
          "label": "賽博朋克",
          "hint": "霓虹、雨夜、科技感",
          "fragment": "賽博朋克風格，霓虹光汙染與高科技低生活的視覺反差"
        },
        {
          "id": "ist.film",
          "label": "復古膠片",
          "hint": "顆粒、褪色",
          "fragment": "復古膠片質感，明顯顆粒，色彩略微褪色"
        },
        {
          "id": "ist.flat",
          "label": "極簡扁平插畫",
          "hint": "乾淨、向量感",
          "fragment": "極簡扁平插畫風格，幾何化造型，色彩塊面分明",
          "group": "medium"
        },
        {
          "id": "ist.oil",
          "label": "油畫 / 厚塗",
          "hint": "筆觸明顯",
          "fragment": "油畫厚塗質感，筆觸清晰可辨，顏色層疊豐富",
          "group": "medium"
        },
        {
          "id": "ist.concept",
          "label": "概念藝術",
          "hint": "設定圖質感",
          "fragment": "概念藝術風格，強調設計感與想像力的表達"
        },
        {
          "id": "ist.pixel",
          "label": "像素風",
          "hint": "復古遊戲",
          "fragment": "像素藝術風格，色塊明確，邊緣銳利",
          "group": "medium"
        },
        {
          "id": "ist.vapor",
          "label": "蒸汽波",
          "hint": "粉紫漸變、懷舊科技",
          "fragment": "蒸汽波風格，粉紫漸變配色，融合八十年代懷舊科技元素"
        }
      ]
    },
    "img.mood": {
      "id": "img.mood",
      "dim": "mood",
      "title": "情緒氛圍",
      "question": "這張圖要傳遞什麼情緒？",
      "helper": "氛圍決定了觀眾「感覺到什麼」，而不只是「看到什麼」。",
      "multi": false,
      "options": [
        {
          "id": "imd.calm",
          "label": "寧靜放鬆",
          "hint": "讓人平靜下來",
          "fragment": "整體氛圍寧靜放鬆，節奏舒緩"
        },
        {
          "id": "imd.warm",
          "label": "溫暖治癒",
          "hint": "有安全感",
          "fragment": "氛圍溫暖治癒，讓人感到被包裹的安全感"
        },
        {
          "id": "imd.tense",
          "label": "緊張壓迫",
          "hint": "有張力",
          "fragment": "氛圍緊張壓抑，帶有不安的張力"
        },
        {
          "id": "imd.lonely",
          "label": "孤獨疏離",
          "hint": "空曠、安靜",
          "fragment": "氛圍孤獨疏離，主體與環境之間存在明顯的距離感"
        },
        {
          "id": "imd.mystery",
          "label": "神秘未知",
          "hint": "好像藏著什麼",
          "fragment": "氛圍神秘，畫面中似乎隱藏著尚未揭示的資訊"
        },
        {
          "id": "imd.energy",
          "label": "活力張揚",
          "hint": "有衝勁",
          "fragment": "氛圍充滿活力與能量，動感強烈"
        },
        {
          "id": "imd.noble",
          "label": "高級克制",
          "hint": "奢侈品感",
          "fragment": "氛圍高級克制，用留白與質感說話，不靠元素堆砌"
        },
        {
          "id": "imd.retro",
          "label": "懷舊復古",
          "hint": "舊時光的溫度",
          "fragment": "氛圍懷舊復古，帶有年代感與記憶的溫度"
        }
      ]
    },
    "img.palette": {
      "id": "img.palette",
      "dim": "color",
      "title": "色彩基調",
      "question": "整體色彩傾向是什麼？",
      "helper": "基調只能有一個，不然畫面會花。",
      "multi": false,
      "options": [
        {
          "id": "ipal.warm",
          "label": "暖色調",
          "hint": "橙黃紅",
          "fragment": "以暖色為主，橙黃紅構成主色相"
        },
        {
          "id": "ipal.cool",
          "label": "冷色調",
          "hint": "青藍",
          "fragment": "以冷色為主，青藍色構成主色相"
        },
        {
          "id": "ipal.mono",
          "label": "低飽和 / 單色",
          "hint": "克制不張揚",
          "fragment": "低飽和度配色，接近單色調"
        },
        {
          "id": "ipal.morandi",
          "label": "莫蘭迪色系",
          "hint": "高級灰",
          "fragment": "莫蘭迪色系，灰調柔和，色彩之間互相謙讓"
        },
        {
          "id": "ipal.contrast",
          "label": "高飽和撞色",
          "hint": "強烈",
          "fragment": "高飽和度撞色搭配，色彩對比強烈"
        },
        {
          "id": "ipal.bw",
          "label": "黑白",
          "hint": "只有明暗",
          "fragment": "黑白影調，只靠明暗層次塑造畫面"
        },
        {
          "id": "ipal.faded",
          "label": "復古褪色",
          "hint": "舊照片感",
          "fragment": "復古褪色色調，色彩像被時間洗過"
        },
        {
          "id": "ipal.dual",
          "label": "冷暖雙色對比",
          "hint": "兩種色相對撞",
          "fragment": "冷暖雙色對比，畫面在兩種色相之間形成張力"
        }
      ]
    },
    "img.ratio": {
      "id": "img.ratio",
      "dim": "composition",
      "title": "畫幅比例",
      "question": "這張圖準備用在哪裡？",
      "helper": "比例不對，再好的圖也得裁。",
      "multi": false,
      "options": [
        {
          "id": "irat.square",
          "label": "1:1 方形",
          "hint": "頭像、電商主圖",
          "fragment": "1:1 正方形畫幅"
        },
        {
          "id": "irat.p34",
          "label": "3:4 直式",
          "hint": "小紅書、海報",
          "fragment": "3:4 直幅畫幅"
        },
        {
          "id": "irat.p916",
          "label": "9:16 直式",
          "hint": "手機桌布、短影音封面",
          "fragment": "9:16 直式畫幅"
        },
        {
          "id": "irat.l169",
          "label": "16:9 橫式",
          "hint": "桌布、PPT、影片封面",
          "fragment": "16:9 橫幅畫幅"
        },
        {
          "id": "irat.p23",
          "label": "2:3 直幅",
          "hint": "攝影作品",
          "fragment": "2:3 經典攝影直幅畫幅"
        },
        {
          "id": "irat.cinema",
          "label": "21:9 寬幅",
          "hint": "電影感",
          "fragment": "21:9 超寬畫幅，接近電影銀幕比例"
        }
      ]
    },
    "img.quality": {
      "id": "img.quality",
      "dim": "quality",
      "title": "畫質與鏡頭",
      "question": "要什麼級別的細節和鏡頭質感？",
      "helper": "這一塊決定成圖「貴不貴」。",
      "multi": true,
      "options": [
        {
          "id": "iql.detail",
          "label": "高細節、精細紋理",
          "hint": "經得起放大",
          "fragment": "極高細節，材質紋理清晰可辨，經得起放大觀看"
        },
        {
          "id": "iql.dof",
          "label": "淺景深、背景虛化",
          "hint": "把主體托出來",
          "fragment": "淺景深效果，背景柔和虛化，主體從環境中剝離出來"
        },
        {
          "id": "iql.p85",
          "label": "85mm 人像鏡頭",
          "hint": "壓縮感、臉型好看",
          "fragment": "85mm 中長焦人像鏡頭質感，空間壓縮自然，人臉比例舒服",
          "group": "lens"
        },
        {
          "id": "iql.w24",
          "label": "廣角鏡頭張力",
          "hint": "空間感強",
          "fragment": "24mm 廣角鏡頭質感，透視誇張，空間縱深感強",
          "group": "lens"
        },
        {
          "id": "iql.motion",
          "label": "長曝光 / 運動模糊",
          "hint": "時間流動感",
          "fragment": "長曝光效果，運動的物體留下柔和的拖影"
        },
        {
          "id": "iql.grain",
          "label": "膠片顆粒",
          "hint": "有質感、不完美",
          "fragment": "明顯的膠片顆粒質感，畫面不追求絕對乾淨"
        },
        {
          "id": "iql.8k",
          "label": "8K 超高畫質",
          "hint": "極致清晰",
          "fragment": "8K 超高畫質畫質，細節銳利"
        },
        {
          "id": "iql.skin",
          "label": "真實皮膚質感",
          "hint": "不要塑膠感",
          "fragment": "真實的皮膚質感，保留毛孔與細微瑕疵，不做過度磨皮"
        }
      ]
    },
    "img.negative": {
      "id": "img.negative",
      "dim": "negative",
      "title": "負面提示詞",
      "question": "有哪些東西絕對不要出現在畫面裡？",
      "helper": "負面提示詞是最省力的提效手段。一個都不選也可以。",
      "multi": true,
      "optional": true,
      "options": [
        {
          "id": "ineg.quality",
          "label": "低品質、模糊、噪點",
          "hint": "low quality, blurry",
          "fragment": "low quality, blurry, noisy, jpeg artifacts"
        },
        {
          "id": "ineg.hands",
          "label": "手指變形、多餘肢體",
          "hint": "bad hands",
          "fragment": "bad hands, extra fingers, extra limbs, deformed hands"
        },
        {
          "id": "ineg.face",
          "label": "面部扭曲",
          "hint": "deformed face",
          "fragment": "distorted face, deformed face, asymmetric eyes"
        },
        {
          "id": "ineg.text",
          "label": "文字與水印",
          "hint": "text, watermark",
          "fragment": "text, watermark, signature, logo"
        },
        {
          "id": "ineg.plastic",
          "label": "塑膠感皮膚、過度磨皮",
          "hint": "plastic skin",
          "fragment": "plastic skin, over-smoothed skin, waxy texture"
        },
        {
          "id": "ineg.hdr",
          "label": "過度飽和的 HDR 感",
          "hint": "over-saturated",
          "fragment": "over-saturated, excessive HDR, oversharpened"
        },
        {
          "id": "ineg.clutter",
          "label": "構圖雜亂、元素過多",
          "hint": "cluttered",
          "fragment": "cluttered composition, too many elements, busy background"
        },
        {
          "id": "ineg.faceavg",
          "label": "千篇一律的網紅臉",
          "hint": "generic AI face",
          "fragment": "generic AI face, same-face syndrome, instagram filter face"
        },
        {
          "id": "ineg.irrelevant",
          "label": "不相關的物體入鏡",
          "hint": "random items",
          "fragment": "irrelevant objects, random items in frame"
        },
        {
          "id": "ineg.artifacts",
          "label": "明顯的 AI 生成痕跡",
          "hint": "AI artifacts",
          "fragment": "obvious AI artifacts, unnatural anatomy, uncanny valley"
        }
      ]
    },
    "vid.action": {
      "id": "vid.action",
      "dim": "action",
      "title": "主體動作",
      "question": "畫面裡會發生什麼？",
      "helper": "影片和圖片最大的區別就是「有變化」。先把變化說清楚。",
      "multi": false,
      "options": [
        {
          "id": "vact.still",
          "label": "主體不動，環境在動",
          "hint": "風吹、水波、光影變化",
          "fragment": "主體基本保持靜止，由環境元素產生動態，比如風、水、光影或人群"
        },
        {
          "id": "vact.single",
          "label": "一個連續動作",
          "hint": "轉身、抬手、走動",
          "fragment": "主體完成一個連續的動作，動作過程完整可見"
        },
        {
          "id": "vact.sequence",
          "label": "多階段動作序列",
          "hint": "先…然後…",
          "fragment": "主體依次完成多個動作，動作之間有明確的先後關係"
        },
        {
          "id": "vact.enter",
          "label": "從畫面外進入",
          "hint": "走進來再停下",
          "fragment": "主體從畫面外進入畫面，並在畫面中停下"
        },
        {
          "id": "vact.express",
          "label": "表情與情緒變化",
          "hint": "以特寫為主",
          "fragment": "重點呈現面部表情的細微變化與情緒的流動"
        },
        {
          "id": "vact.interact",
          "label": "兩個主體的互動",
          "hint": "對話、接觸",
          "fragment": "兩個主體之間發生互動，動作需要互相呼應"
        }
      ]
    },
    "vid.shot": {
      "id": "vid.shot",
      "dim": "shot",
      "title": "鏡頭景別",
      "question": "用哪些景別？",
      "helper": "可以多選，會按順序分配給分鏡裡的各個鏡頭。全片是一個鏡頭還是多個鏡頭，由「剪輯結構」決定。",
      "multi": true,
      "options": [
        {
          "id": "vsh.extreme",
          "label": "大遠景",
          "hint": "交代環境",
          "fragment": "大遠景，主體在廣闊環境中只佔很小比例"
        },
        {
          "id": "vsh.wide",
          "label": "全景",
          "hint": "主體與環境並重",
          "fragment": "全景，主體完整入畫並保留充分的環境資訊"
        },
        {
          "id": "vsh.medium",
          "label": "中景",
          "hint": "最常用",
          "fragment": "中景，取景到人物腰部以上"
        },
        {
          "id": "vsh.close",
          "label": "近景",
          "hint": "表情為主",
          "fragment": "近景，取景到人物胸部以上，突出面部表情"
        },
        {
          "id": "vsh.cu",
          "label": "特寫",
          "hint": "區域性細節",
          "fragment": "特寫鏡頭，聚焦於面部或關鍵細節"
        },
        {
          "id": "vsh.macro",
          "label": "大特寫",
          "hint": "微距",
          "fragment": "大特寫微距鏡頭，呈現肉眼難以看清的細節"
        }
      ]
    },
    "vid.move": {
      "id": "vid.move",
      "dim": "move",
      "title": "運鏡方式",
      "question": "鏡頭怎麼運動？",
      "helper": "運鏡是影片的「語氣」。同一個畫面，固定機位和環繞運鏡完全是兩回事。選了多個時，會按順序分配給分鏡裡的各個鏡頭（第 1 個給鏡頭 1，以此類推）；單鏡頭影片只用第一個。",
      "multi": true,
      "maxPick": 4,
      "options": [
        {
          "id": "vmv.static",
          "label": "固定機位",
          "hint": "沉穩、克制",
          "fragment": "固定機位，鏡頭完全靜止"
        },
        {
          "id": "vmv.push",
          "label": "緩慢推近",
          "hint": "逐漸聚焦",
          "fragment": "鏡頭緩慢推近，逐漸聚焦到主體上"
        },
        {
          "id": "vmv.pull",
          "label": "緩緩拉遠",
          "hint": "揭示環境",
          "fragment": "鏡頭緩緩拉遠，逐漸揭示主體所處的環境"
        },
        {
          "id": "vmv.pan",
          "label": "左右搖鏡",
          "hint": "像在掃視",
          "fragment": "鏡頭水平搖動，像在掃視整個場景"
        },
        {
          "id": "vmv.track",
          "label": "橫向移動 / 跟拍",
          "hint": "跟著主體走",
          "fragment": "鏡頭與主體同速橫向移動，保持主體在畫面中的相對位置"
        },
        {
          "id": "vmv.orbit",
          "label": "環繞運鏡",
          "hint": "繞著主體轉",
          "fragment": "鏡頭圍繞主體做環繞運動"
        },
        {
          "id": "vmv.crane",
          "label": "升降 / 搖臂",
          "hint": "垂直方向變化",
          "fragment": "鏡頭垂直升降，改變觀察高度"
        },
        {
          "id": "vmv.handheld",
          "label": "手持晃動",
          "hint": "紀實感",
          "fragment": "手持拍攝，鏡頭有自然的輕微晃動，帶來紀實感"
        },
        {
          "id": "vmv.drone",
          "label": "無人機航拍",
          "hint": "大範圍移動",
          "fragment": "無人機航拍視角，鏡頭大範圍移動或飛越場景"
        },
        {
          "id": "vmv.pov",
          "label": "第一人稱視角",
          "hint": "代入感強",
          "fragment": "第一人稱視角運動，像觀看者自己在移動"
        }
      ]
    },
    "vid.style": {
      "id": "vid.style",
      "dim": "style",
      "title": "影像風格",
      "question": "整體影像風格是什麼？",
      "multi": false,
      "options": [
        {
          "id": "vst.cinema",
          "label": "電影感",
          "hint": "膠片、層次感",
          "fragment": "電影級影像質感，膠片色彩，豐富的明暗層次"
        },
        {
          "id": "vst.doc",
          "label": "紀錄片寫實",
          "hint": "真實、不修飾",
          "fragment": "紀錄片風格，光線與畫面真實自然，不做修飾"
        },
        {
          "id": "vst.ad",
          "label": "廣告質感",
          "hint": "乾淨、高級",
          "fragment": "高級廣告片質感，畫面乾淨，光影精緻"
        },
        {
          "id": "vst.anime",
          "label": "動漫 / 二次元",
          "hint": "作畫感",
          "fragment": "二維動畫風格，線條清晰，動作有作畫感"
        },
        {
          "id": "vst.stop",
          "label": "定格動畫",
          "hint": "逐影格質感",
          "fragment": "定格動畫風格，帶有逐影格拍攝的輕微不連貫感"
        },
        {
          "id": "vst.vhs",
          "label": "復古 VHS",
          "hint": "舊錄影帶",
          "fragment": "復古錄影帶質感，畫面有噪點、色彩溢位與輕微抖動"
        },
        {
          "id": "vst.cyber",
          "label": "賽博朋克",
          "hint": "霓虹未來",
          "fragment": "賽博朋克影像風格，霓虹光源與冷色調城市環境"
        }
      ]
    },
    "vid.cut": {
      "id": "vid.cut",
      "dim": "cut",
      "title": "剪輯結構",
      "question": "全片怎麼剪？",
      "helper": "這決定全片有幾個鏡頭 —— 一個鏡頭就不需要多個景別。",
      "multi": false,
      "options": [
        {
          "id": "vcut.cut",
          "label": "分鏡剪輯",
          "hint": "多個鏡頭切換",
          "fragment": "按分鏡順序剪輯組接，鏡頭之間切換乾淨利落"
        },
        {
          "id": "vcut.oner",
          "label": "一鏡到底",
          "hint": "全片一個鏡頭",
          "fragment": "一鏡到底的長鏡頭，全片沒有剪輯點"
        }
      ]
    },
    "vid.lighting": {
      "id": "vid.lighting",
      "dim": "lighting",
      "title": "光線",
      "question": "光是什麼樣的？",
      "multi": true,
      "options": [
        {
          "id": "vlt.natural",
          "label": "自然日光",
          "hint": "真實",
          "fragment": "自然日光，光線真實不做作",
          "group": "source"
        },
        {
          "id": "vlt.golden",
          "label": "黃金時刻",
          "hint": "日出日落的暖光",
          "fragment": "黃金時刻的暖調低角度光",
          "group": "source"
        },
        {
          "id": "vlt.night",
          "label": "夜景霓虹",
          "hint": "人造光源複雜",
          "fragment": "夜間城市燈光與霓虹，光源複雜有層次",
          "group": "source"
        },
        {
          "id": "vlt.studio",
          "label": "影棚布光",
          "hint": "乾淨可控",
          "fragment": "影棚布光，光線乾淨可控",
          "group": "source"
        },
        {
          "id": "vlt.back",
          "label": "逆光剪影",
          "hint": "只看得見輪廓",
          "fragment": "逆光拍攝，主體呈現剪影或半剪影效果"
        },
        {
          "id": "vlt.overcast",
          "label": "陰天柔光",
          "hint": "沒有硬陰影",
          "fragment": "陰天的柔和散射光，幾乎沒有硬陰影",
          "group": "source"
        }
      ]
    },
    "vid.duration": {
      "id": "vid.duration",
      "dim": "duration",
      "title": "時長與節奏",
      "question": "片子多長？節奏如何？",
      "helper": "時長決定了能裝下幾個鏡頭 —— 3-5 秒塞四個分鏡，每個鏡頭都來不及看清。",
      "multi": false,
      "options": [
        {
          "id": "vdur.s5",
          "label": "3-5 秒 · 單鏡頭",
          "hint": "一個鏡頭搞定",
          "fragment": "時長 3-5 秒，節奏舒緩",
          "seconds": 5,
          "maxShots": 1
        },
        {
          "id": "vdur.s10",
          "label": "5-10 秒 · 單鏡頭",
          "hint": "動作完整展開",
          "fragment": "時長 5-10 秒，讓動作完整展開",
          "seconds": 10,
          "maxShots": 1
        },
        {
          "id": "vdur.s15",
          "label": "10-15 秒 · 可多鏡頭",
          "hint": "有剪輯",
          "fragment": "時長 10-15 秒，節奏有推進",
          "seconds": 15,
          "maxShots": 3
        },
        {
          "id": "vdur.long",
          "label": "15 秒以上 · 需要分鏡",
          "hint": "先給分鏡表",
          "fragment": "時長 15 秒以上，節奏有起伏",
          "seconds": 20,
          "maxShots": 4
        }
      ]
    },
    "vid.audio": {
      "id": "vid.audio",
      "dim": "audio",
      "title": "聲音",
      "question": "要不要聲音？要什麼聲音？",
      "helper": "如果你的工具不支援音訊，選「不需要聲音」即可。",
      "multi": true,
      "options": [
        {
          "id": "vaud.none",
          "label": "不需要聲音",
          "hint": "只做畫面",
          "fragment": "只描述畫面，不需要音訊",
          "group": "*"
        },
        {
          "id": "vaud.ambient",
          "label": "環境音",
          "hint": "風聲、雨聲、街道",
          "fragment": "配合環境音，如風聲、水聲或城市背景音"
        },
        {
          "id": "vaud.music",
          "label": "情緒配樂",
          "hint": "帶節奏",
          "fragment": "配合情緒化的背景音樂",
          "followUps": [
            "vid.bgm"
          ]
        },
        {
          "id": "vaud.voice",
          "label": "旁白 / 對白",
          "hint": "有人聲",
          "fragment": "包含人聲旁白或對白"
        },
        {
          "id": "vaud.sfx",
          "label": "音效強調動作",
          "hint": "給動作加點",
          "fragment": "在關鍵動作處配合音效加以強調"
        }
      ]
    },
    "vid.bgm": {
      "id": "vid.bgm",
      "dim": "bgm",
      "title": "配樂類型",
      "question": "配樂具體是什麼感覺？",
      "helper": "寫清楚樂器與速度，配樂才不會跑偏。",
      "multi": false,
      "options": [
        {
          "id": "vbgm.piano",
          "label": "慢板鋼琴",
          "hint": "乾淨、克制",
          "fragment": "以慢板鋼琴獨奏為主，音符稀疏，留白多"
        },
        {
          "id": "vbgm.cello",
          "label": "低沉大提琴",
          "hint": "厚重、有故事感",
          "fragment": "以低沉的大提琴長音鋪底，情緒厚重而有故事感"
        },
        {
          "id": "vbgm.ambient",
          "label": "氛圍 Ambient",
          "hint": "鋪底、不搶戲",
          "fragment": "氛圍音樂（Ambient），用持續的音墊鋪底，不搶畫面"
        },
        {
          "id": "vbgm.lofi",
          "label": "Lo-Fi 慵懶",
          "hint": "鬆弛、生活感",
          "fragment": "Lo-Fi 風格，帶輕微底噪與慵懶的鼓點，生活氣息濃"
        },
        {
          "id": "vbgm.strings",
          "label": "弦樂漸強",
          "hint": "推向高潮",
          "fragment": "弦樂由弱漸強，在中後段把情緒推到最高點"
        },
        {
          "id": "vbgm.electronic",
          "label": "電子氛圍",
          "hint": "冷、未來感",
          "fragment": "電子合成器音色，冷調、有未來感，節奏規整"
        }
      ]
    },
    "vid.arc": {
      "id": "vid.arc",
      "dim": "arc",
      "title": "情緒走向",
      "question": "這條片子想讓觀眾的情緒怎麼走？",
      "helper": "四個鏡頭一個情緒，觀眾會覺得平。定一條走向，每個鏡頭的氛圍才有推進。",
      "multi": false,
      "options": [
        {
          "id": "varc.rise",
          "label": "由靜到動",
          "hint": "慢慢起勢，最後推上去",
          "fragment": "情緒由靜到動，前半段克制、後半段推起來",
          "arc": [
            "先靜下來",
            "慢慢起勢",
            "推上去",
            "釋放"
          ]
        },
        {
          "id": "varc.warm",
          "label": "由冷到暖",
          "hint": "從疏離到靠近",
          "fragment": "情緒由冷到暖，從疏離克制逐漸過渡到溫暖",
          "arc": [
            "疏離克制",
            "開始鬆動",
            "逐漸靠近",
            "落在溫暖裡"
          ]
        },
        {
          "id": "varc.build",
          "label": "層層遞進",
          "hint": "一鏡比一鏡更緊",
          "fragment": "情緒層層遞進，一鏡比一鏡更緊",
          "arc": [
            "鋪開場景",
            "進入正題",
            "收緊張力",
            "沉下來收尾"
          ]
        },
        {
          "id": "varc.release",
          "label": "由緊到鬆",
          "hint": "壓著，然後放開",
          "fragment": "情緒由緊到鬆，前半段壓著，後半段放開",
          "arc": [
            "壓著情緒",
            "僵持不下",
            "開始鬆動",
            "徹底舒展"
          ]
        },
        {
          "id": "varc.flow",
          "label": "平緩流淌",
          "hint": "不刻意起伏",
          "fragment": "情緒平緩流淌，不做強烈起伏",
          "arc": [
            "輕輕鋪開",
            "緩緩流動",
            "微微起伏",
            "慢慢落下"
          ]
        }
      ]
    },
    "vid.focus": {
      "id": "vid.focus",
      "dim": "focus",
      "title": "細節焦點",
      "question": "鏡頭推近時，最想讓人看清什麼？",
      "helper": "特寫和近景如果不指定焦點，模型會自己挑一個，常常挑錯地方。",
      "multi": false,
      "options": [
        {
          "id": "vfoc.face",
          "label": "面部表情",
          "fragment": "把觀眾的注意力引到面部表情上"
        },
        {
          "id": "vfoc.eyes",
          "label": "眼神與視線",
          "fragment": "把觀眾的注意力引到眼神和視線的方向上"
        },
        {
          "id": "vfoc.hands",
          "label": "手部動作",
          "fragment": "把觀眾的注意力引到手部動作上"
        },
        {
          "id": "vfoc.prop",
          "label": "關鍵道具",
          "fragment": "把觀眾的注意力引到關鍵道具的材質與細節上"
        },
        {
          "id": "vfoc.env",
          "label": "環境細節",
          "fragment": "把觀眾的注意力引到環境細節上，讓背景裡的質感清晰可見"
        },
        {
          "id": "vfoc.light",
          "label": "光影變化",
          "fragment": "把觀眾的注意力引到光影的變化上"
        }
      ]
    },
    "vid.detail": {
      "id": "vid.detail",
      "dim": "detail",
      "title": "畫面細節",
      "question": "畫面裡必須出現哪些細節？",
      "helper": "你寫的具體細節會排在前面，一條分給一個鏡頭。想更具體，點「我自己補充」直接寫，例如「傘面的雨珠、積水的倒影、霓虹招牌」—— 用逗號隔開，有幾個鏡頭就寫幾條。",
      "multi": true,
      "maxPick": 6,
      "optional": true,
      "options": [
        {
          "id": "vdet.outfit",
          "label": "主體的穿著外觀",
          "hint": "衣服、髮型、隨身物",
          "fragment": "主體的穿著與外觀細節清晰可見"
        },
        {
          "id": "vdet.face",
          "label": "面部與神態",
          "hint": "表情的變化",
          "fragment": "面部與神態的變化清晰可見"
        },
        {
          "id": "vdet.env",
          "label": "環境質感",
          "hint": "牆面、地面、街景",
          "fragment": "環境的材質與質感清晰可見"
        },
        {
          "id": "vdet.air",
          "label": "空氣感",
          "hint": "水汽、塵埃、光斑",
          "fragment": "空氣裡的水汽、塵埃或光斑清晰可見"
        },
        {
          "id": "vdet.reflect",
          "label": "反光與倒影",
          "hint": "水面、玻璃、金屬",
          "fragment": "地面或物體表面的反光與倒影清晰可見"
        },
        {
          "id": "vdet.prop",
          "label": "關鍵道具",
          "hint": "傘、杯、手機…",
          "fragment": "關鍵道具的細節清晰可見"
        },
        {
          "id": "vdet.crowd",
          "label": "人群與車流",
          "hint": "背景裡的活動",
          "fragment": "背景裡有緩慢移動的人群或車流"
        },
        {
          "id": "vdet.texture",
          "label": "表面紋理",
          "hint": "布料、木紋、石紋",
          "fragment": "物體表面的紋理被放大呈現"
        }
      ]
    },
    "vid.ratio": {
      "id": "vid.ratio",
      "dim": "shot",
      "title": "畫幅比例",
      "question": "這段影片投放在哪裡？",
      "helper": "直式或橫式選錯，平台會自動裁切，構圖就全廢了。",
      "multi": false,
      "options": [
        {
          "id": "vrat.l169",
          "label": "16:9 橫式",
          "hint": "B站、YouTube、官網",
          "fragment": "16:9 橫幅畫幅"
        },
        {
          "id": "vrat.p916",
          "label": "9:16 直式",
          "hint": "抖音、小紅書、Reels",
          "fragment": "9:16 直式畫幅，適配手機全屏觀看"
        },
        {
          "id": "vrat.square",
          "label": "1:1 方形",
          "hint": "資訊流廣告",
          "fragment": "1:1 正方形畫幅"
        },
        {
          "id": "vrat.cinema",
          "label": "21:9 寬幅",
          "hint": "電影感預告",
          "fragment": "21:9 超寬畫幅，接近電影銀幕比例"
        },
        {
          "id": "vrat.p45",
          "label": "4:5 直幅",
          "hint": "Instagram 資訊流",
          "fragment": "4:5 直幅畫幅"
        }
      ]
    },
    "vid.negative": {
      "id": "vid.negative",
      "dim": "negative",
      "title": "負面提示詞",
      "question": "有哪些問題絕對不能出現？",
      "helper": "影片模型最容易翻車的地方都在這裡，建議至少選幾項。",
      "multi": true,
      "optional": true,
      "options": [
        {
          "id": "vneg.shake",
          "label": "畫面抖動、果凍效應",
          "hint": "shaky footage",
          "fragment": "shaky footage, jello effect, rolling shutter"
        },
        {
          "id": "vneg.face",
          "label": "人臉 / 肢體變形",
          "hint": "deformed",
          "fragment": "deformed face, distorted body, extra limbs"
        },
        {
          "id": "vneg.pop",
          "label": "物體突然出現或消失",
          "hint": "morphing",
          "fragment": "objects appearing or disappearing, morphing"
        },
        {
          "id": "vneg.motion",
          "label": "運動不自然、拖影",
          "hint": "ghosting",
          "fragment": "unnatural motion, motion blur artifacts, ghosting"
        },
        {
          "id": "vneg.flicker",
          "label": "畫面閃爍、跳影格",
          "hint": "flickering",
          "fragment": "flickering, frame skipping, stuttering"
        },
        {
          "id": "vneg.text",
          "label": "文字與水印",
          "hint": "text, watermark",
          "fragment": "text, watermark, subtitles"
        },
        {
          "id": "vneg.quality",
          "label": "低解析度、模糊",
          "hint": "low resolution",
          "fragment": "low resolution, blurry, pixelated"
        },
        {
          "id": "vneg.chaos",
          "label": "多個主體動作混亂",
          "hint": "chaotic",
          "fragment": "chaotic action, multiple subjects moving inconsistently"
        }
      ]
    }
  },
  "sectionTitles": {
    "role": "角色設定",
    "context": "背景與受眾",
    "task": "任務目標",
    "requirement": "具體要求",
    "format": "輸出格式",
    "style": "語氣與詳略",
    "constraint": "約束條件",
    "example": "範例要求",
    "subject": "畫面主體",
    "composition": "構圖與鏡頭",
    "lighting": "光線",
    "mood": "情緒氛圍",
    "color": "色彩基調",
    "quality": "畫質與鏡頭質感",
    "negative": "負面提示詞",
    "action": "主體動作",
    "shot": "鏡頭景別",
    "focus": "細節焦點",
    "move": "運鏡方式",
    "cut": "剪輯結構",
    "arc": "情緒走向",
    "detail": "畫面細節",
    "duration": "時長與節奏",
    "audio": "聲音"
  },
  "shotContent": {
    "vsh.extreme": "用環境佔滿畫面，主體只作為一個小點出現在其中",
    "vsh.wide": "主體完整入畫，環境佔據畫面的大半",
    "vsh.medium": "取景到腰部以上，主體動作與周圍環境同時可見",
    "vsh.close": "取景到胸部以上，背景開始虛化",
    "vsh.cu": "只留主體的一處細節，其餘全部虛化",
    "vsh.macro": "貼近到極近，讓紋理佔滿整個畫面"
  },
  "shotRole": {
    "vsh.extreme": "先把時間、地點與整體氣氛立住，人物只是環境裡的一個點",
    "vsh.wide": "把主體完整放進環境裡，讓人一眼看清「誰、在哪」",
    "vsh.medium": "動作與姿態最清楚，是敘事的主力鏡頭",
    "vsh.close": "情緒開始顯影，觀眾能讀到表情",
    "vsh.cu": "把注意力釘在一個細節上，放大質感",
    "vsh.macro": "貼近到肉眼難辨的尺度，製造陌生感"
  },
  "visualJoiner": {
    "image": "，",
    "video": "。"
  },
  "visualEnd": {
    "image": "",
    "video": "。"
  },
  "sectionExplain": {
    "role": "告訴 AI「你以誰的身份來回答」，它會自動切換到對應的判斷標準和表達習慣。同一個問題，專家視角和新手視角給出的答案完全不同。",
    "context": "交代清楚「給誰看、在什麼情況下用」，AI 才會自動調整用詞深度和舉例方式。這是最容易被忽略、但回報最高的一塊。",
    "task": "保留你的原話，而不是讓 AI 轉述。原話裡有你的語氣和真實意圖，轉述一次就丟一分。",
    "requirement": "把「你覺得理所當然」的細節寫出來 —— 正是因為你覺得理所當然，AI 才會漏掉它。",
    "format": "規定輸出的形態、長度和結構。絕大多數「結果不能用」的問題，根源都在這裡：不是內容不對，是形態不對。",
    "style": "語氣和詳略決定讀起來像不像人話。這一塊寫得越具體，最後成品的「AI 味」越淡。",
    "constraint": "明確劃出邊界：不要什麼、必須做到什麼。約束比要求更能提升穩定性，因為它堵住了 AI 自由發揮的空間。",
    "example": "給例子是最快的對齊方式。一個具體樣例傳達的資訊，往往比十句抽象描述都多。",
    "subject": "繪圖模型只會畫你寫出來的東西。主體寫得越具體，它自由發揮（也就是跑偏）的空間就越小。",
    "composition": "景別和視角決定了觀眾站在哪裡看。這是區分「隨手一張圖」和「有設計的畫面」的關鍵。",
    "lighting": "光線是畫面裡最貴的東西。同一個構圖換一種光，就是完全不同的故事和價格感。",
    "mood": "氛圍回答的是「看完感覺到什麼」。只描述內容不描述情緒，出來的圖往往正確但沒有感染力。",
    "color": "色彩是最先被感知、最後被注意到的元素。定好基調，整張圖才不會花。",
    "quality": "畫質與鏡頭描述決定了成圖的「精緻度」，也是讓圖片擺脫廉價感最直接的手段。",
    "negative": "負面提示詞是價效比最高的一步：寫一句「不要什麼」，比反覆調整「要什麼」快得多。",
    "action": "影片和圖片的唯一區別就是「有變化」。把變化描述清楚，模型才知道該讓什麼動起來。",
    "shot": "景別是影片的語法。單一景別會顯得單調，多個景別則意味著畫面需要剪輯銜接。",
    "focus": "推近的鏡頭如果不說清看什麼，模型會自己挑一個 —— 而且常常挑到不重要的地方。所以這一項只對特寫 / 近景生效，遠景裡沒有「焦點」這回事。",
    "move": "運鏡是影片的「語氣」：固定機位是克制，環繞是強調，手持是紀實。",
    "cut": "剪輯結構是影片的「骨架」：一個鏡頭還是多個鏡頭，直接決定了你需要交代幾個景別。一鏡到底沒有剪輯點，靠走位和運鏡把資訊交代完；分鏡剪輯則可以把不同景別接起來，資訊密度更高。",
    "arc": "情緒走向是分鏡的骨架。四個鏡頭同一個情緒，觀眾只會覺得平；定一條走向，每個鏡頭才知道自己在整條片子裡負責哪一段。",
    "detail": "「畫面細節」是把描述變具體的唯一辦法。「一個人在雨中走」誰都能寫，但「傘面的雨珠、積水的倒影」才是模型真正能畫出來的東西。",
    "duration": "時長直接決定模型輸出什麼。超過 15 秒的片子必須拆成分鏡，否則會前後不連貫。",
    "audio": "聲音佔觀看體驗的一半。如果工具不支援音訊，明確說「不需要」可以避免畫面被強行配樂。"
  },
  "cues": {
    "textTask": "幫我寫|寫一篇|寫個|寫一段|寫一份|寫一個|生成一篇|幫我想|想幾個|取個名|取名|起名|命名|總結|分析|解釋|講解|翻譯|潤色|改寫|程式碼|腳本|方案|報告|文案|企劃|提綱|大綱|回信|郵件",
    "visual": "戴著|穿著|坐在|站在|躺在|趴在|走在|奔跑|飛過|懸停|背影|側臉|一隻手|特寫|近景|中景|遠景|鏡頭|畫面|背景是|光線|色調|氛圍|景深|虛化|質感|插畫|寫實|賽博|動漫|一隻|一張|一幅|街頭|街道|街上|夜景|霓虹|倒影|影子|雪山|湖泊|森林|沙漠|天空|陽光|月光|燈光|紋路|紋理|房間|室內|建築|高樓|屋頂|地板|草地|沙灘|地鐵|咖啡館|書店|餐桌|樹葉|黃昏|清晨|傍晚|日出|日落|星空|銀河|霧氣|積水|陽台|窗台|小巷",
    "motion": "走在|奔跑|飛過|飄落|流動|轉身|回頭|延時|慢動作|升格|運鏡|一鏡到底|多鏡頭|鏡頭切換|切換鏡頭|拍一段|拍個|拍一條|拍攝|鏡頭(推|拉|搖|移|跟|升|降)"
  },
  "recommendRules": {
    "img.subject": [
      [
        "isub.person",
        "/人像|肖像|人物|男人|女人|女孩|男孩|少女|少年|老人|孩子|模特兒|青年|背影|側臉/"
      ],
      [
        "isub.animal",
        "/貓|狗|鳥|動物|寵物|老虎|獅子|狼|兔子|馬|熊|貓熊|狐狸|鯨|魚|龍|蝴蝶|鷹|鹿/"
      ],
      [
        "isub.food",
        "/食物|美食|菜|飯|麵|咖啡|蛋糕|甜點|水果|餐|飲|酒|茶/"
      ],
      [
        "isub.product",
        "/產品|商品|瓶子|香水|手錶|鞋|包包|化妝品|保養品|飲料|包裝|耳機|手機/"
      ],
      [
        "isub.vehicle",
        "/車|機甲|太空船|機器人|摩托|飛機|坦克|戰艦|載具/"
      ],
      [
        "isub.arch",
        "/建築|室內|房間|客廳|辦公室|店鋪|教堂|橋|高樓|空間設計/"
      ],
      [
        "isub.scene",
        "/風景|城市|山|海|森林|沙漠|雪|天空|街道|夜景|日出|日落|草原|湖|星空|雨/"
      ],
      [
        "isub.abstract",
        "/抽象|概念|情緒|孤獨|自由|時間|記憶|夢境/"
      ]
    ],
    "img.ratio": [
      [
        "irat.p916",
        "/9:16|直式|手機桌布|短影音封面|抖音|小紅書|朋友圈/"
      ],
      [
        "irat.l169",
        "/16:9|橫式|桌布|簡報|影片封面|桌面|官網|banner/"
      ],
      [
        "irat.square",
        "/1:1|方形|頭像|電商主圖|logo/"
      ],
      [
        "irat.p34",
        "/3:4|海報|小紅書|封面/"
      ]
    ],
    "vid.ratio": [
      [
        "vrat.p916",
        "/抖音|小紅書|reels|直式|手機/"
      ],
      [
        "vrat.l169",
        "/b站|官網|youtube|橫式|宣傳片/"
      ],
      [
        "vrat.square",
        "/資訊流|廣告|方形/"
      ]
    ]
  },
  "signalLabels": {
    "text": [
      [
        "hasRole",
        "角色身份"
      ],
      [
        "hasAudience",
        "目標受眾"
      ],
      [
        "hasFormat",
        "輸出格式"
      ],
      [
        "hasTone",
        "語氣風格"
      ],
      [
        "hasConstraint",
        "約束條件"
      ],
      [
        "hasExample",
        "範例參考"
      ],
      [
        "hasBackground",
        "背景資訊"
      ]
    ],
    "image": [
      [
        "hasSubject",
        "主體描述"
      ],
      [
        "hasComposition",
        "構圖與視角"
      ],
      [
        "hasLighting",
        "光線"
      ],
      [
        "hasStyle",
        "風格"
      ],
      [
        "hasColor",
        "色彩"
      ],
      [
        "hasRatio",
        "畫幅比例"
      ],
      [
        "hasNegative",
        "負面約束"
      ]
    ],
    "video": [
      [
        "hasSubject",
        "主體描述"
      ],
      [
        "hasAction",
        "動作"
      ],
      [
        "hasShot",
        "鏡頭景別"
      ],
      [
        "hasMove",
        "運鏡"
      ],
      [
        "hasStyle",
        "影像風格"
      ],
      [
        "hasLighting",
        "光線"
      ],
      [
        "hasDuration",
        "時長"
      ],
      [
        "hasAudio",
        "聲音與配樂"
      ],
      [
        "hasNegative",
        "負面約束"
      ]
    ]
  },
  "scoreItems": {
    "text": [
      {
        "key": "task",
        "label": "任務明確性",
        "weight": 20,
        "hint": "是否說清了要做什麼"
      },
      {
        "key": "role",
        "label": "角色設定",
        "weight": 12,
        "hint": "是否指定了 AI 的身份"
      },
      {
        "key": "context",
        "label": "背景與受眾",
        "weight": 16,
        "hint": "是否交代了來龍去脈和給誰看"
      },
      {
        "key": "format",
        "label": "輸出規格",
        "weight": 16,
        "hint": "是否規定了形態、長度與結構"
      },
      {
        "key": "style",
        "label": "語氣與深度",
        "weight": 14,
        "hint": "是否定了調性和詳略程度"
      },
      {
        "key": "constraint",
        "label": "約束邊界",
        "weight": 12,
        "hint": "是否劃清了不做什麼"
      },
      {
        "key": "example",
        "label": "範例參考",
        "weight": 10,
        "hint": "是否提供了對齊樣例"
      }
    ],
    "image": [
      {
        "key": "subject",
        "label": "主體描述",
        "weight": 24,
        "hint": "是否說清了畫的是什麼"
      },
      {
        "key": "composition",
        "label": "構圖與視角",
        "weight": 16,
        "hint": "景別、角度與畫幅"
      },
      {
        "key": "lighting",
        "label": "光線氛圍",
        "weight": 16,
        "hint": "光的方向與質感"
      },
      {
        "key": "style",
        "label": "風格定位",
        "weight": 18,
        "hint": "視覺風格是否明確"
      },
      {
        "key": "color",
        "label": "色彩基調",
        "weight": 12,
        "hint": "整體色彩傾向"
      },
      {
        "key": "negative",
        "label": "負面約束",
        "weight": 14,
        "hint": "排除了哪些問題"
      }
    ],
    "video": [
      {
        "key": "subject",
        "label": "主體與動作",
        "weight": 22,
        "hint": "畫的是什麼、發生了什麼"
      },
      {
        "key": "shot",
        "label": "鏡頭景別",
        "weight": 13,
        "hint": "用哪些景別"
      },
      {
        "key": "move",
        "label": "運鏡方式",
        "weight": 15,
        "hint": "鏡頭怎麼動"
      },
      {
        "key": "style",
        "label": "影像風格",
        "weight": 16,
        "hint": "整體影像質感"
      },
      {
        "key": "lighting",
        "label": "光線",
        "weight": 12,
        "hint": "光是什麼樣的"
      },
      {
        "key": "audio",
        "label": "聲音與配樂",
        "weight": 10,
        "hint": "聽感上是什麼樣"
      },
      {
        "key": "negative",
        "label": "負面約束",
        "weight": 12,
        "hint": "排除了哪些問題"
      }
    ]
  },
  "frameModeLabels": {
    "none": "未指定",
    "text": "文生圖",
    "file": "從檔案匯入",
    "prev": "沿用上個分鏡的尾影格"
  },
  "extractPatterns": {
    "image": {
      "hasComposition": "景別|特寫|近景|中景|全景|遠景|俯拍|仰拍|平視|視角|構圖|三分|居中|留白|微距|航拍|對稱",
      "hasLighting": "光|照明|逆光|側光|柔光|硬光|霓虹|黃昏|黃金時刻|氛圍|暗調|高調",
      "hasStyle": "風格|寫實|插畫|動漫|二次元|3d|渲染|油畫|水墨|賽博|膠片|像素|攝影|手繪|概念圖",
      "hasColor": "色|色調|配色|冷色|暖色|黑白|飽和度|莫蘭迪",
      "hasRatio": "\\d+\\s*:\\s*\\d+|方形|直式|橫式|寬幅|比例|畫幅",
      "hasNegative": "不要|避免|禁止|排除|別出現|no "
    },
    "video": {
      "hasAction": "動作|轉身|走動|走|跑|飛|抬手|進入|離開|變化|互動|說話|笑|點頭|風吹|流動",
      "hasShot": "景別|特寫|近景|中景|全景|遠景|大遠景|鏡頭",
      "hasMove": "運鏡|推近|拉遠|搖鏡|橫移|跟拍|環繞|升降|手持|航拍|固定機位|長鏡頭|一鏡到底",
      "hasStyle": "風格|電影|紀錄|廣告|動漫|動畫|定格|vhs|賽博|寫實|質感",
      "hasLighting": "光|照明|夜景|日光|逆光|霓虹|黃金時刻",
      "hasDuration": "\\d+\\s*秒|時長|多長|秒|分鐘|分鏡",
      "hasAudio": "配樂|背景音樂|BGM|環境音|音效|旁白|人聲|畫外音|音軌|靜音|無聲",
      "hasNegative": "不要|避免|禁止|排除|別出現|no "
    },
    "text": {
      "hasRole": "你是|扮演|作為一位|作為一名|充當|以.{1,8}的身份",
      "hasAudience": "給[^，。；、\\s]{0,8}(看|聽|讀|用)|受眾|讀者|面向|寫給|講給|說給",
      "hasFormat": "格式|表格|列表|分點|markdown|大綱|字數|字以內|字左右|結構|分章節|json|程式碼塊|排版",
      "hasTone": "語氣|風格|口吻|幽默|正式|輕鬆|嚴肅|專業|親切|嚴謹",
      "hasConstraint": "不要|禁止|避免|必須|務必|不能|嚴禁|切記",
      "hasExample": "例如|舉例|比如|範例|示例|樣例|參考如下|類似於",
      "hasLength": "(\\d+)\\s*字|字數|篇幅|一頁|兩頁|多少頁",
      "hasBackground": "背景|因為|由於|目前|我們(公司|團隊|產品)|場景是|情況是|目的是|這是給"
    }
  },
  "extractFlags": {
    "video": {
      "hasAudio": "i"
    }
  },
  "detailPatterns": {
    "visualSubject": "一隻|一個|一位|一名|一隻|穿著|戴著|站在|坐在|躺在",
    "image": {
      "lighting": "柔|硬|暖|冷|逆光|側光|自然光|影棚",
      "style": "風格|質感|感$",
      "color": "冷暖|飽和|灰調|黑白"
    },
    "video": {
      "shot": "鏡頭",
      "move": "推|拉|搖|移|跟|環繞|航拍",
      "style": "電影|紀錄|廣告|動漫|一鏡到底",
      "lighting": "黃金時刻|夜景|逆光",
      "audio": "配樂|背景音樂|BGM|環境音|音效|旁白|人聲|畫外音|鋼琴|大提琴|弦樂|雨聲|音軌|靜音|無聲"
    },
    "text": {
      "task": "幫我|請|我要|我想|需要|生成|寫|做|分析|設計|整理|給出",
      "role": "專家|資深|專業",
      "format": "表格|列表|分點|大綱|json",
      "styleTone": "語氣|口吻|調性|風格|正式|口語|幽默|嚴謹|通俗|專業|親切",
      "styleDepth": "深入|詳細|詳盡|簡略|簡要|展開|概述|點到為止|精簡|逐條"
    }
  },
  "detailFlags": {
    "video": {
      "audio": "i"
    }
  }
};

  root.PromptLensLocales = root.PromptLensLocales || {};
  root.PromptLensLocales['zh-Hant'] = locale;
  if (typeof module !== 'undefined' && module.exports) module.exports = locale;
})(typeof globalThis !== 'undefined' ? globalThis : this);
