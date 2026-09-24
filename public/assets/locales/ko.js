'use strict';

/**
 * PromptLens 文案包 · ko
 * ------------------------------------------------------------------
 * ⚠️ **这个文件是生成的，不要手改。**
 *    生成器：`node scripts/mk-locale.js ko`
 *    译文表：`scripts/i18n-src/ko/kb/*.json`
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
  "tag": "ko",
  "name": "한국어",
  "scenarios": [
    {
      "id": "writing",
      "name": "콘텐츠 작성",
      "icon": "✍️",
      "desc": "글, 카피, 스토리, 대본",
      "keywords": [
        "글",
        "써 줘",
        "글쓰기",
        "카피",
        "위챗 공식계정",
        "블로그",
        "즈후",
        "샤오홍슈",
        "원고",
        "소설",
        "이야기",
        "시나리오",
        "스크립트",
        "트윗",
        "위챗 모멘트",
        "수필",
        "보도",
        "광고성 기사",
        "제목"
      ]
    },
    {
      "id": "coding",
      "name": "코딩",
      "icon": "💻",
      "desc": "코드 작성, 버그 찾기, 리팩터링",
      "keywords": [
        "코드",
        "함수",
        "메서드",
        "bug",
        "오류",
        "예외",
        "리팩터링",
        "api",
        "인터페이스",
        "프로그램",
        "스크립트",
        "sql",
        "데이터베이스",
        "알고리즘",
        "프런트엔드",
        "백엔드",
        "python",
        "javascript",
        "java",
        "react",
        "vue",
        "golang",
        "배포",
        "단위 테스트",
        "성능 최적화"
      ]
    },
    {
      "id": "analysis",
      "name": "분석·리서치",
      "icon": "📊",
      "desc": "데이터, 조사, 판단",
      "keywords": [
        "분석",
        "데이터",
        "리포트",
        "추세",
        "통계",
        "비교",
        "조사",
        "인사이트",
        "연구",
        "평가",
        "산출",
        "귀인 분석",
        "예측",
        "업계",
        "시장",
        "경쟁사",
        "지표",
        "결론"
      ]
    },
    {
      "id": "marketing",
      "name": "마케팅",
      "icon": "📣",
      "desc": "홍보, 시딩, 캠페인",
      "keywords": [
        "마케팅",
        "프로모션",
        "시딩",
        "광고",
        "광고 집행",
        "캠페인",
        "자체 채널",
        "전환",
        "포스터",
        "slogan",
        "셀링 포인트",
        "라이브 커머스",
        "라이브 방송",
        "사용자 성장",
        "추천 확산",
        "캠페인 카피",
        "브랜드"
      ]
    },
    {
      "id": "learning",
      "name": "교육·설명",
      "icon": "🎓",
      "desc": "설명, 교양, 학습",
      "keywords": [
        "해설",
        "설명",
        "가르쳐 줘",
        "학습",
        "입문",
        "과학 교양",
        "강의",
        "노트",
        "요약",
        "쉬운 말",
        "예시",
        "무엇인가",
        "왜",
        "어떻게 이해",
        "정리",
        "핵심 포인트",
        "파인만"
      ]
    },
    {
      "id": "business",
      "name": "업무·사무",
      "icon": "📈",
      "desc": "기획안, 보고, 커뮤니케이션",
      "keywords": [
        "기획안",
        "보고",
        "ppt",
        "제안서",
        "계획",
        "회고",
        "이메일",
        "주간 보고",
        "월간 보고",
        "okr",
        "목표",
        "회의",
        "회의록",
        "업무 보고",
        "이력서",
        "면접",
        "프로세스",
        "규정",
        "비즈니스"
      ]
    },
    {
      "id": "creative",
      "name": "아이디어 발상",
      "icon": "💡",
      "desc": "아이디어, 네이밍, 브레인스토밍",
      "keywords": [
        "크리에이티브",
        "아이디어",
        "브레인스토밍",
        "이름 짓기",
        "네이밍",
        "작명",
        "이름",
        "태그라인",
        "슬로건",
        "기획",
        "영감",
        "콘셉트",
        "콘셉트 설계",
        "플레이 방식"
      ]
    },
    {
      "id": "general",
      "name": "일반 작업",
      "icon": "🧩",
      "desc": "그 밖의 모든 요청",
      "keywords": []
    },
    {
      "id": "image",
      "name": "이미지 생성",
      "icon": "🎨",
      "desc": "그림, 포스터, 삽화",
      "keywords": [
        "이미지",
        "이미지",
        "삽화",
        "그려",
        "그려",
        "그려",
        "그림 그려",
        "이미지 생성",
        "이미지 뽑기",
        "이미지 생성",
        "삽화",
        "배경화면",
        "프로필 사진",
        "logo",
        "아이콘",
        "드로잉",
        "회화",
        "렌더 이미지",
        "원화",
        "콘셉트 아트",
        "제품 사진",
        "상품 사진",
        "포스터",
        "커버 이미지",
        "애니 그림",
        "애니 그림",
        "사진 작품",
        "midjourney",
        "stable diffusion",
        "dall-e",
        "dalle",
        "텍스트 투 이미지",
        "이미지 투 이미지",
        "참조 이미지",
        "리터치",
        "스타일화",
        "시각 시안",
        "삽화풍",
        "손그림",
        "사이버펑크",
        "실사",
        "유화",
        "수묵",
        "필름 감성",
        "미니멀",
        "픽셀 아트",
        "로우 폴리",
        "구도",
        "심도",
        "보케",
        "클로즈업",
        "매크로",
        "부감",
        "앙각",
        "골든아워",
        "색조",
        "분위기",
        "질감",
        "광영",
        "조명 세팅",
        "배경 흐림"
      ]
    },
    {
      "id": "video",
      "name": "영상 생성",
      "icon": "🎬",
      "desc": "단편, 카메라 무빙, 스토리보드",
      "keywords": [
        "영상",
        "숏폼 영상",
        "단편 영상",
        "카메라 무빙",
        "카메라 무빙",
        "영상 생성",
        "스토리보드",
        "전환",
        "영상 스크립트",
        "멀티 샷",
        "샷 전환",
        "컷 전환",
        "연속 샷",
        "홍보 영상",
        "광고 영상",
        "단편 영화",
        "원 테이크",
        "영상 소재",
        "빈 샷",
        "mv",
        "sora",
        "runway",
        "클링",
        "지멍",
        "pika",
        "veo",
        "텍스트 투 비디오",
        "이미지 투 비디오",
        "촬영",
        "촬영",
        "촬영",
        "촬영",
        "타임랩스",
        "슬로모션",
        "슬로모션",
        "스톱모션",
        "걷는",
        "달리는",
        "날아가는",
        "흩날리는",
        "카메라 푸시인",
        "카메라 풀아웃",
        "카메라 팬",
        "카메라 트래킹",
        "내레이션",
        "사운드트랙",
        "효과음",
        "전환"
      ]
    }
  ],
  "questions": {
    "intent": {
      "id": "intent",
      "dim": "task",
      "title": "작업의 본질",
      "question": "이번에 AI에게 가장 크게 부탁하고 싶은 일은 무엇입니까?",
      "helper": "가장 가까운 것을 하나 고르십시오. 확신이 없어도 괜찮습니다. 이후 모든 단계에서 바꿀 수 있습니다.",
      "multi": false,
      "perScenario": {
        "writing": [
          {
            "id": "write.create",
            "label": "처음부터 한 편 쓰기",
            "hint": "창작 콘텐츠",
            "fragment": "목표는 처음부터 완성된 창작 콘텐츠 한 편을 만들어 내는 것입니다. 개요나 아이디어만 주면 안 됩니다."
          },
          {
            "id": "write.rewrite",
            "label": "고쳐 쓰기·다듬기",
            "hint": "뜻은 그대로, 표현은 더 좋게",
            "fragment": "원래 뜻과 정보 항목을 완전히 유지한 채 다시 쓰고 표현의 질을 높입니다. 제가 확인하지 않은 사실을 새로 넣지 마십시오."
          },
          {
            "id": "write.expand",
            "label": "늘려 쓰기·심화",
            "hint": "얇은 곳을 두껍게",
            "fragment": "기존 내용을 바탕으로 늘려 쓰면서 세부 사항과 사례, 논거를 보강하고 간략한 부분을 충분히 풀어냅니다. 처음부터 새로 쓰지 마십시오."
          },
          {
            "id": "write.shorten",
            "label": "줄이기·추리기",
            "hint": "절반을 덜어내면 더 잘 읽힙니다",
            "fragment": "분량을 압축하고 핵심 정보와 중요한 세부 사항은 남깁니다. 반복과 군더더기, 빈말은 삭제합니다."
          },
          {
            "id": "write.outline",
            "label": "구조·개요 짜기",
            "hint": "뼈대부터",
            "fragment": "구조 개요와 각 절의 요점만 만들어 주십시오. 완성된 글로 풀어 쓰지 마십시오."
          }
        ],
        "coding": [
          {
            "id": "code.build",
            "label": "처음부터 기능 구현",
            "hint": "실제로 돌아가는 코드",
            "fragment": "바로 실행할 수 있는 완전한 구현을 주십시오. 의사 코드나 일부만 보여 주는 조각은 안 됩니다."
          },
          {
            "id": "code.debug",
            "label": "오류 진단·수정",
            "hint": "진짜 원인 찾기",
            "fragment": "문제의 근본 원인을 찾아 수정안을 주고, 왜 오류가 나는지 설명해 주십시오. 고친 코드만 붙여 넣지 마십시오."
          },
          {
            "id": "code.refactor",
            "label": "리팩터링",
            "hint": "구조를 더 깔끔하게",
            "fragment": "외부 동작을 바꾸지 않은 채 리팩터링하고, 가독성과 유지보수성, 확장성을 개선합니다."
          },
          {
            "id": "code.review",
            "label": "코드 리뷰",
            "hint": "흠 잡기",
            "fragment": "엄격한 코드 리뷰의 관점에서 문제를 하나씩 짚고, 심각도 순으로 정렬하며, 각 항목마다 위험과 수정 제안을 밝혀 주십시오."
          },
          {
            "id": "code.explain",
            "label": "이 코드 설명",
            "hint": "이해가 안 됩니다",
            "fragment": "이 코드의 실행 흐름과 설계 의도를 설명하고, 오해하기 쉬운 부분을 중점적으로 짚어 주십시오."
          },
          {
            "id": "code.test",
            "label": "테스트 작성",
            "hint": "경계까지 커버",
            "fragment": "테스트 케이스를 작성하되 정상 경로와 경계 조건, 예외 입력을 반드시 포함해 주십시오."
          }
        ],
        "analysis": [
          {
            "id": "an.insight",
            "label": "데이터에서 인사이트 찾기",
            "hint": "데이터가 말하는 것",
            "fragment": "데이터에서 가치 있는 인사이트를 뽑아내고, 직관에 어긋나는 지점을 짚으며, 결론의 신뢰도와 한계를 설명해 주십시오."
          },
          {
            "id": "an.compare",
            "label": "여러 안 비교",
            "hint": "선택을 도와주십시오",
            "fragment": "각 안을 나란히 비교하고, 각각의 적용 조건과 대가, 위험을 분명히 밝힌 뒤 마지막에 추천과 이유를 제시해 주십시오."
          },
          {
            "id": "an.research",
            "label": "주제 조사",
            "hint": "상황 파악",
            "fragment": "이 주제를 체계적으로 정리하고, 현황과 주요 플레이어, 핵심 변수와 불확실성을 모두 다뤄 주십시오."
          },
          {
            "id": "an.diagnose",
            "label": "귀인 분석",
            "hint": "왜 이렇게 되는지",
            "fragment": "귀인 분석을 하고, 상관 요인과 실제 인과를 이끄는 요인을 구분하며, 판단 근거를 밝혀 주십시오."
          },
          {
            "id": "an.forecast",
            "label": "추세 판단",
            "hint": "앞으로 어떻게 될지",
            "fragment": "추세 판단과 추론 논리를 제시하고, 사실과 합리적 추론, 추측을 분명히 구분해 주십시오."
          }
        ],
        "marketing": [
          {
            "id": "mk.idea",
            "label": "크리에이티브 방향",
            "hint": "아이디어부터",
            "fragment": "서로 뚜렷이 다른 크리에이티브 방향을 여러 개 제시하고, 각 방향의 핵심 주장과 목표 집단, 기억에 남는 지점을 밝혀 주십시오."
          },
          {
            "id": "mk.copy",
            "label": "프로모션 카피",
            "hint": "바로 쓸 수 있게",
            "fragment": "바로 쓸 수 있는 프로모션 카피를 만들어 주십시오. 문체는 대상 플랫폼의 콘텐츠 톤에 맞추고, 자기만족식 표현은 피하십시오."
          },
          {
            "id": "mk.title",
            "label": "제목 다듬기",
            "hint": "클릭률 높이기",
            "fragment": "여러 개의 제목안을 만들되 서로 다른 감정 접근을 담고, 각 안이 맞는 대상과 위험을 표시해 주십시오."
          },
          {
            "id": "mk.persona",
            "label": "사용자 페르소나 분석",
            "hint": "누구에게 보여 줄지",
            "fragment": "목표 집단의 페르소나를 그려 주십시오. 실제 사용 상황과 핵심 고충, 결정을 망설이게 하는 요인, 정보를 얻는 습관을 포함합니다."
          },
          {
            "id": "mk.campaign",
            "label": "캠페인 기획",
            "hint": "완성된 기획안",
            "fragment": "실제로 실행할 수 있는 캠페인 기획안을 주십시오. 메커니즘 설계와 확산 경로, 전환 훅, 효과 측정 방식을 포함합니다."
          }
        ],
        "learning": [
          {
            "id": "ln.explain",
            "label": "개념 설명",
            "hint": "진짜로 이해하고 싶음",
            "fragment": "제가 진짜 이해할 때까지 이 개념을 설명해 주십시오. 직관에서 출발해 엄밀한 표현으로 넘어갑니다."
          },
          {
            "id": "ln.path",
            "label": "학습 경로 설계",
            "hint": "어떤 순서로 배울지",
            "fragment": "단계적으로 나아가는 학습 경로를 제시하고, 각 단계의 중점과 마일스톤, 흔한 함정을 표시해 주십시오."
          },
          {
            "id": "ln.note",
            "label": "노트로 정리",
            "hint": "복습하기 쉽게",
            "fragment": "복습하기 쉬운 노트 구조로 정리하고, 큰 흐름과 잘 잊는 핵심을 부각해 주십시오."
          },
          {
            "id": "ln.quiz",
            "label": "문제 내서 시험",
            "hint": "이해도 점검",
            "fragment": "제 이해도를 점검할 문제를 내 주십시오. 변별력이 있어야 하고, 마지막에 정답과 해설을 붙여 주십시오."
          },
          {
            "id": "ln.summary",
            "label": "자료 요약",
            "hint": "핵심 잡기",
            "fragment": "이 자료의 핵심을 추려내되 원저자의 논증 흐름은 유지하고, 당신의 평가를 섞지 마십시오."
          }
        ],
        "business": [
          {
            "id": "bz.proposal",
            "label": "제안서 작성",
            "hint": "결재를 통과해야",
            "fragment": "구조가 완전한 기획안을 만들어 주십시오. 논리적으로 의사결정자의 추궁을 견딜 수 있어야 하고, 가치와 대가, 실행 가능성을 분명히 밝혀야 합니다."
          },
          {
            "id": "bz.report",
            "label": "보고 자료 작성",
            "hint": "윗사람에게 보고",
            "fragment": "보고 상황에 맞게 내용을 구성하고, 결론을 앞에 두고 근거를 간추려 주십시오. 짧은 시간에 설명하기 쉽게 해 주십시오."
          },
          {
            "id": "bz.review",
            "label": "회고 정리",
            "hint": "잘한 점과 못한 점",
            "fragment": "회고를 하되 주관적 원인과 객관적 원인을 구분하고, 어떤 방식을 제도로 정착시킬 수 있는지 짚어 주십시오."
          },
          {
            "id": "bz.mail",
            "label": "커뮤니케이션 메일 작성",
            "hint": "할 말을 분명히",
            "fragment": "커뮤니케이션 내용을 초안으로 써 주십시오. 요구 사항과 배경, 다음 단계를 분명히 하고, 어조는 예의를 갖추되 입장은 분명하게 하십시오."
          },
          {
            "id": "bz.breakdown",
            "label": "목표 분해",
            "hint": "실행 가능하게",
            "fragment": "목표를 실행 가능한 작업으로 나누고, 우선순위와 의존 관계, 완료 기준을 분명히 해 주십시오."
          }
        ],
        "creative": [
          {
            "id": "cr.brainstorm",
            "label": "브레인스토밍",
            "hint": "많을수록 좋습니다",
            "fragment": "발산형 브레인스토밍을 해 주십시오. 우선 양이 중요하고, 아이디어끼리 뚜렷이 달라야 합니다. 같은 발상의 변형을 반복하지 마십시오."
          },
          {
            "id": "cr.naming",
            "label": "네이밍 / 슬로건",
            "hint": "입에 붙어야",
            "fragment": "여러 개의 네이밍안을 만들되 서로 다른 스타일 방향을 담고, 각 안의 의미와 어울리는 상황을 설명해 주십시오."
          },
          {
            "id": "cr.story",
            "label": "스토리 구상",
            "hint": "인물과 갈등",
            "fragment": "스토리 프레임을 세우고, 핵심 갈등과 인물의 동기, 감정 흐름을 분명히 해 주십시오."
          },
          {
            "id": "cr.concept",
            "label": "비주얼 콘셉트",
            "hint": "장면이 그려지는 묘사",
            "fragment": "장면이 떠오르는 콘셉트 묘사를 주십시오. 피사체와 분위기, 색감 경향, 핵심 시각 요소를 포함합니다."
          }
        ],
        "general": [
          {
            "id": "gn.organize",
            "label": "정보 정리",
            "hint": "어지러운 것을 명확하게",
            "fragment": "정보를 명확한 분류 구조로 다시 조직하고, 중복은 덜어내되 핵심 세부 사항은 남겨 주십시오."
          },
          {
            "id": "gn.generate",
            "label": "콘텐츠 생성",
            "hint": "완성본을 바로",
            "fragment": "바로 쓸 수 있는 완성본을 만들어 주십시오. 아이디어나 틀만 주지 마십시오."
          },
          {
            "id": "gn.judge",
            "label": "분석과 판단",
            "hint": "결론을",
            "fragment": "분명한 판단을 내리고, 결론을 뒷받침하는 핵심 이유와 전제 조건을 밝혀 주십시오."
          },
          {
            "id": "gn.solve",
            "label": "문제 해결",
            "hint": "어떻게 하면 해낼지",
            "fragment": "문제를 푸는 구체적인 경로를 제시하고, 핵심 병목과 대응 방법을 짚어 주십시오."
          },
          {
            "id": "gn.decide",
            "label": "의사결정 돕기",
            "hint": "어느 것을 골라야 할지",
            "fragment": "결정을 도와주십시오. 어느 쪽을 추천하는지 분명히 하고, 어떤 조건이 되면 선택을 바꿔야 하는지 설명해 주십시오."
          }
        ],
        "image": [
          {
            "id": "im.intent.poster",
            "label": "상업 포스터 / 광고 이미지",
            "hint": "시각적 중심과 여백이 필요",
            "fragment": "상업 포스터 용도. 화면에 분명한 시각적 중심이 있어야 하고, 구도 단계에서 제목 텍스트를 넣을 공간을 비워 둡니다"
          },
          {
            "id": "im.intent.social",
            "label": "소셜 미디어 이미지",
            "hint": "첫눈에 시선을 끌어야",
            "fragment": "소셜 미디어 용도. 피드에서 첫눈에 시선을 붙잡아야 합니다"
          },
          {
            "id": "im.intent.product",
            "label": "제품 전시 이미지",
            "hint": "제품을 예쁘게",
            "fragment": "제품 전시 용도. 제품의 외관과 소재, 디테일을 선명하게 보여 줘야 합니다"
          },
          {
            "id": "im.intent.character",
            "label": "인물 / 캐릭터",
            "hint": "이목구비 비율이 정확해야",
            "fragment": "인물 설정 용도. 이목구비가 선명하고 신체 비율이 정확하며 자세가 자연스러워야 합니다"
          },
          {
            "id": "im.intent.concept",
            "label": "콘셉트 탐색",
            "hint": "과감해도 됩니다",
            "fragment": "콘셉트 탐색용. 과감하게 시도해도 되고, 완전한 실사를 요구하지 않습니다"
          },
          {
            "id": "im.intent.art",
            "label": "삽화 / 예술 창작",
            "hint": "스타일화된 표현",
            "fragment": "예술 창작 용도. 스타일화된 표현과 개성 있는 시각 언어를 권장합니다"
          },
          {
            "id": "im.intent.scene",
            "label": "장면 / 세계관 설정",
            "hint": "환경 분위기 중심",
            "fragment": "장면 설정 용도. 환경 분위기와 공간의 층위, 세계관의 설득력이 핵심입니다"
          }
        ],
        "video": [
          {
            "id": "vd.intent.ad",
            "label": "광고 / 홍보 영상",
            "hint": "고급스러운 질감",
            "fragment": "광고 홍보 영상 용도. 화면에 상업용 수준의 질감과 명확한 정보 전달이 필요합니다"
          },
          {
            "id": "vd.intent.short",
            "label": "숏폼 / 소셜 미디어",
            "hint": "첫 3초에 잡아야",
            "fragment": "숏폼 용도. 시작 3초 안에 시선을 붙잡아야 하고 리듬이 촘촘해야 합니다"
          },
          {
            "id": "vd.intent.story",
            "label": "스토리 / 단편 영화",
            "hint": "감정과 서사",
            "fragment": "서사 단편 용도. 분명한 감정 흐름과 카메라 언어가 필요합니다"
          },
          {
            "id": "vd.intent.anim",
            "label": "애니메이션 / 2D",
            "hint": "애니 질감",
            "fragment": "애니메이션 스타일. 화면에 선명한 선과 일관된 작화 스타일이 필요합니다"
          },
          {
            "id": "vd.intent.product",
            "label": "제품 움직임 전시",
            "hint": "제품을 살아 있게",
            "fragment": "제품 움직임 전시 용도. 제품의 형태와 소재, 사용 장면을 온전히 보여 줘야 합니다"
          },
          {
            "id": "vd.intent.mood",
            "label": "분위기 / 빈 샷 소재",
            "hint": "피사체 없어도 됩니다",
            "fragment": "분위기 소재 용도. 환경의 움직임과 빛의 변화, 감정 조성이 핵심이며 인물 피사체는 필요하지 않습니다"
          }
        ]
      }
    },
    "role": {
      "id": "role",
      "dim": "role",
      "title": "역할",
      "question": "AI가 어떤 역할로 답하기를 원하십니까?",
      "helper": "역할이 판단 기준과 말투, 관심 지점을 정합니다. 답변 품질 차이를 가장 크게 벌리는 단계입니다.",
      "multi": false,
      "options": [
        {
          "id": "role.expert",
          "label": "분야 전문가",
          "hint": "실전 경험이 많은 베테랑",
          "fragment": "당신은 이 분야에서 10년 이상 현장 실무를 해 온 전문가입니다. 체계적인 판단력과 함께 실제로 실행할 수 있는 구체적인 행동을 제시합니다.",
          "followUps": [
            "role.stance"
          ]
        },
        {
          "id": "role.critic",
          "label": "엄격한 리뷰어",
          "hint": "흠만 잡고 치켜세우지 않음",
          "fragment": "당신은 엄격하기로 유명한 전문 리뷰어입니다. 당신의 임무는 저를 편하게 해 주는 것이 아니라 문제를 찾아내는 것입니다. 예의를 갖추기보다 날카로운 편이 낫습니다.",
          "followUps": [
            "role.stance"
          ]
        },
        {
          "id": "role.doer",
          "label": "실무 실행가",
          "hint": "해낼 수 있는지만 봄",
          "fragment": "당신은 실행을 중시하는 현장 실무자입니다. \"해낼 수 있는지, 구체적으로 어떻게 하는지, 대가는 무엇인지\"만 신경 쓰고 공허한 이론은 논하지 않습니다.",
          "followUps": [
            "role.stance"
          ]
        },
        {
          "id": "role.coach",
          "label": "인내심 있는 코치",
          "hint": "한 단계씩 이끌어 줌",
          "fragment": "당신은 인내심 있는 코치입니다. 복잡한 문제를 바로 시작할 수 있는 작은 단계로 나누고, 가장 실수하기 쉬운 지점을 미리 알려 줍니다.",
          "followUps": [
            "role.stance"
          ]
        },
        {
          "id": "role.researcher",
          "label": "중립적 연구자",
          "hint": "근거만 말하고 편들지 않음",
          "fragment": "당신은 중립적이고 객관적인 연구자입니다. 신뢰할 수 있는 근거만 가지고 말하며, 미리 입장을 정하지 않고, 근거가 부족한 곳에서는 \"여기는 불확실하다\"고 분명히 밝힙니다.",
          "followUps": [
            "role.stance"
          ]
        },
        {
          "id": "role.user",
          "label": "목표 사용자가 되어 보기",
          "hint": "상대의 처지에서 생각",
          "fragment": "목표 사용자의 실제 처지에 자신을 놓고 생각해 주십시오. 그들의 인식 수준과 진짜 걱정, 실제 사용 상황을 기준으로 하되, 방관자 시점에서 조언하지 마십시오.",
          "followUps": [
            "role.stance"
          ]
        },
        {
          "id": "role.beginner",
          "label": "갓 입문한 초보",
          "hint": "문외한의 시각으로 질문",
          "fragment": "갓 입문한 초보의 시각으로 반응해 주십시오. 모르는 용어가 나오면 멈춰서 묻고, 이해한 척하지 말고, 어떤 논리적 비약도 그냥 넘기지 마십시오.",
          "followUps": [
            "role.stance"
          ]
        }
      ]
    },
    "role.stance": {
      "id": "role.stance",
      "dim": "role",
      "title": "입장 성향",
      "question": "말할 때 어떤 입장을 취하기를 원하십니까?",
      "helper": "같은 역할이라도 말의 강도는 전혀 달라질 수 있습니다.",
      "multi": false,
      "options": [
        {
          "id": "stance.honest",
          "label": "듣기 싫은 말도 직설적으로",
          "hint": "찬물을 끼얹을 때는 끼얹음",
          "fragment": "제 생각에 문제가 있으면 바로 지적해 주십시오. 기분을 배려하느라 얼버무리지 마십시오."
        },
        {
          "id": "stance.balanced",
          "label": "객관적 중립",
          "hint": "장단점 모두 명확히",
          "fragment": "장점과 단점을 객관적으로 제시하고, 저를 맞춰 주려고 유리한 면을 부풀리지 마십시오."
        },
        {
          "id": "stance.supportive",
          "label": "건설적 지원",
          "hint": "인정한 뒤 개선",
          "fragment": "건설적인 방식으로 표현하고, 먼저 가능한 부분을 짚은 뒤 개선할 점을 설명해 주십시오."
        },
        {
          "id": "stance.challenge",
          "label": "먼저 문제 제기",
          "hint": "저에게 반박",
          "fragment": "제가 요청하지 않았더라도 제 전제를 먼저 반박하고, 제가 놓쳤을 수 있는 사각지대를 짚어 주십시오."
        }
      ]
    },
    "audience": {
      "id": "audience",
      "dim": "context",
      "title": "대상 독자",
      "question": "이 내용은 결국 누가 봅니까?",
      "helper": "같은 내용이라도 누구에게 보여 주느냐에 따라 쓰는 방식과 깊이가 완전히 달라집니다.",
      "multi": false,
      "options": [
        {
          "id": "aud.public",
          "label": "배경지식 없는 일반인",
          "hint": "기초가 전혀 없는 독자",
          "fragment": "대상은 관련 배경이 전혀 없는 일반인입니다. 전문 용어가 처음 나올 때마다 일상적인 말로 분명히 풀어 설명합니다.",
          "followUps": [
            "audience.term"
          ]
        },
        {
          "id": "aud.peer",
          "label": "동종 업계 / 전문가",
          "hint": "더 깊게 말해도 됩니다",
          "fragment": "대상은 같은 수준의 전문 배경을 가진 동종 업계 사람입니다. 전문 용어와 업계 관행을 그대로 써도 되고, 교양 수준의 설명은 필요하지 않습니다.",
          "followUps": [
            "audience.term"
          ]
        },
        {
          "id": "aud.decision",
          "label": "의사결정자 / 관리자",
          "hint": "결론과 대가만 신경 씀",
          "fragment": "대상은 결정을 내려야 하는 관리자입니다. 시간이 한정되어 있어 결론과 대가, 위험, 그리고 자기 결재가 필요한 항목을 가장 중요하게 봅니다.",
          "followUps": [
            "audience.term"
          ]
        },
        {
          "id": "aud.client",
          "label": "고객 / 발주처",
          "hint": "전문적이면서 이해하기 쉽게",
          "fragment": "대상은 고객 측입니다. 전문적이고 믿음직하게 보이면서도, 상대가 이해하는 데 부담을 느끼지 않게 해야 합니다.",
          "followUps": [
            "audience.term"
          ]
        },
        {
          "id": "aud.student",
          "label": "학생 / 초학자",
          "hint": "학습 속도를 배려",
          "fragment": "대상은 배우는 중인 사람입니다. 쉬운 것에서 어려운 것으로 나아가고, 예시와 대조가 있어야 하며, 개념을 한꺼번에 너무 많이 던지지 않습니다.",
          "followUps": [
            "audience.term"
          ]
        },
        {
          "id": "aud.self",
          "label": "나 자신",
          "hint": "내부 초안, 예의 차릴 필요 없음",
          "fragment": "이 내용은 제가 쓰는 업무 초안입니다. 예의를 위한 도입부는 필요 없고, 정보 밀도가 높을수록 좋습니다.",
          "followUps": [
            "audience.term"
          ]
        }
      ]
    },
    "audience.term": {
      "id": "audience.term",
      "dim": "context",
      "title": "전문 용어 처리",
      "question": "전문 용어가 나오면 어떻게 합니까?",
      "helper": "이 항목이 읽을 때 거리감이 느껴지는지를 좌우합니다.",
      "multi": false,
      "options": [
        {
          "id": "term.explain",
          "label": "처음 나올 때 설명",
          "hint": "한 문장으로",
          "fragment": "전문 용어가 처음 나올 때 한 문장으로 쉬운 설명을 붙이고, 그 뒤에는 그대로 써도 됩니다."
        },
        {
          "id": "term.direct",
          "label": "그대로 사용, 설명 없음",
          "hint": "상대가 알아들음",
          "fragment": "전문 용어를 그대로 써도 되고 추가 설명이 필요 없어 분량을 아낍니다."
        },
        {
          "id": "term.bilingual",
          "label": "한영 병기",
          "hint": "영어 원어를 함께 표기",
          "fragment": "핵심 용어는 한국어와 영어를 함께 쓰고, 처음 나올 때 영어 원어를 병기합니다."
        },
        {
          "id": "term.avoid",
          "label": "안 쓰는 게 낫습니다",
          "hint": "전부 쉬운 말로",
          "fragment": "전문 용어는 최대한 피하고, 도저히 대체할 수 없으면 생활 속 비유로 설명합니다."
        }
      ]
    },
    "format": {
      "id": "format",
      "dim": "format",
      "title": "출력 형태",
      "question": "최종적으로 무엇을 받기를 원하십니까?",
      "helper": "가장 자주 잊히지만 결과에 가장 큰 영향을 주는 단계입니다. 형태를 잘못 고르면 내용이 아무리 좋아도 쓸 수 없습니다.",
      "multi": false,
      "options": [
        {
          "id": "fmt.report",
          "label": "구조화된 리포트",
          "hint": "섹션 구분과 결론",
          "fragment": "구조화된 리포트 형태로 출력하고, Markdown 2단계 제목으로 섹션을 나누며 층위를 분명히 합니다.",
          "followUps": [
            "format.report.length",
            "format.report.structure"
          ]
        },
        {
          "id": "fmt.checklist",
          "label": "단계별 실행 체크리스트",
          "hint": "그대로 따라 하면 됩니다",
          "fragment": "번호가 붙은 단계 형태로 출력하고, 각 단계는 바로 실행할 수 있는 행동이어야 합니다.",
          "followUps": [
            "format.checklist.granularity"
          ]
        },
        {
          "id": "fmt.dialogue",
          "label": "대화하듯 사람 말로",
          "hint": "소제목과 목록 금지",
          "fragment": "마주 앉아 대화하듯 이어지는 자연스러운 문단으로 답하고, 소제목과 글머리 기호, 번호 목록을 쓰지 않습니다.",
          "followUps": [
            "format.dialogue.length"
          ]
        },
        {
          "id": "fmt.table",
          "label": "표로 비교",
          "hint": "차이가 한눈에",
          "fragment": "비교 결과를 Markdown 표 형태로 출력해 나란히 보기 쉽게 합니다.",
          "followUps": [
            "format.table.dimension"
          ]
        },
        {
          "id": "fmt.article",
          "label": "완성된 장문",
          "hint": "바로 발행 가능",
          "fragment": "구조가 완전한 완성 원고를 출력해, 제가 내용을 더 채우지 않아도 바로 발행할 수 있게 합니다.",
          "followUps": [
            "format.article.length",
            "format.article.structure"
          ]
        },
        {
          "id": "fmt.code",
          "label": "코드 + 설명",
          "hint": "바로 실행 가능",
          "fragment": "바로 실행할 수 있는 완전한 코드를 출력하고, 핵심 지점에 필요한 주석 설명을 붙입니다.",
          "followUps": [
            "format.code.language",
            "format.code.comments"
          ]
        },
        {
          "id": "fmt.outline",
          "label": "개요 / 마인드맵",
          "hint": "뼈대만",
          "fragment": "층위가 분명한 구조 개요만 출력하고, 중첩 목록으로 상하 관계를 표현하며, 완전한 문장으로 풀지 않습니다.",
          "followUps": [
            "format.outline.depth"
          ]
        },
        {
          "id": "fmt.message",
          "label": "이메일 / 메시지 본문",
          "hint": "바로 보낼 수 있게",
          "fragment": "바로 보낼 수 있는 완전한 메시지 본문을 출력하고, 알맞은 호칭과 맺음말을 포함합니다.",
          "followUps": [
            "format.message.tone"
          ]
        },
        {
          "id": "fmt.slides",
          "label": "슬라이드 개요",
          "hint": "한 장에 한 요점",
          "fragment": "슬라이드 장별로 내용을 구성하고, 각 장에 제목과 요점 3~5개를 넣되 요점은 최대한 짧게 합니다.",
          "followUps": [
            "format.slides.count"
          ]
        }
      ]
    },
    "format.report.length": {
      "id": "format.report.length",
      "dim": "format",
      "title": "리포트 분량",
      "question": "리포트는 대략 얼마나 길어야 합니까?",
      "multi": false,
      "options": [
        {
          "id": "rlen.short",
          "label": "간략 · 한 페이지 이내",
          "hint": "결론과 핵심 근거만",
          "fragment": "전체를 800자 이내로 하고, 결론과 가장 중요한 근거 두세 가지만 남깁니다."
        },
        {
          "id": "rlen.mid",
          "label": "표준 · 두세 페이지",
          "hint": "근거는 충실하되 군더더기 없이",
          "fragment": "전체 1200~1800자 정도로 하고, 근거는 충실하되 모든 문장에 정보가 담겨야 합니다."
        },
        {
          "id": "rlen.long",
          "label": "상세 · 다섯 페이지 이상",
          "hint": "배경, 추론, 위험 모두 포함",
          "fragment": "전체 2500자 이상으로 하고, 배경과 분석, 추론 과정, 위험과 제안을 모두 다룹니다."
        }
      ]
    },
    "format.report.structure": {
      "id": "format.report.structure",
      "dim": "format",
      "title": "리포트에 들어갈 것",
      "question": "리포트에 반드시 포함해야 할 부분은 무엇입니까?",
      "helper": "여러 개를 고를 수 있습니다.",
      "multi": true,
      "options": [
        {
          "id": "rstr.conclusion",
          "label": "결론 먼저",
          "hint": "시작부터 판단",
          "fragment": "시작에 결론 요약을 먼저 제시해, 독자가 3초 안에 핵심 판단을 알게 합니다."
        },
        {
          "id": "rstr.evidence",
          "label": "항목별 논증 + 근거",
          "hint": "모든 주장에 뒷받침",
          "fragment": "모든 논점에는 구체적인 근거와 데이터, 사례가 따라야 하며, 근거 없이 주장만 있는 것은 허용하지 않습니다."
        },
        {
          "id": "rstr.table",
          "label": "데이터 표",
          "hint": "데이터를 표에",
          "fragment": "핵심 데이터는 표로 제시하고, 표에는 분명한 머리글과 단위가 있어야 합니다."
        },
        {
          "id": "rstr.risk",
          "label": "위험과 반대 관점",
          "hint": "어디서 어긋날지도",
          "fragment": "위험과 반대 의견, 결론을 뒤집을 수 있는 조건을 별도 섹션에서 설명합니다."
        },
        {
          "id": "rstr.action",
          "label": "실행 목록",
          "hint": "끝에 다음 단계",
          "fragment": "끝에 실행 가능한 행동 목록을 제시하고, 각 항목에 담당 역할과 우선순위를 표시합니다."
        },
        {
          "id": "rstr.open",
          "label": "확인할 문제",
          "hint": "제가 결정해야 할 것",
          "fragment": "마지막에 제 확인이나 추가 정보가 필요한 질문을 나열하고, 제 대신 단정하지 마십시오."
        }
      ]
    },
    "format.checklist.granularity": {
      "id": "format.checklist.granularity",
      "dim": "format",
      "title": "단계 세분화 정도",
      "question": "단계를 얼마나 잘게 나눠야 합니까?",
      "multi": false,
      "options": [
        {
          "id": "cgran.coarse",
          "label": "굵게 · 3~5단계",
          "hint": "큰 줄기만",
          "fragment": "과정을 3~5개의 큰 단계로 나누고, 각 단계의 목표를 한 문장으로 설명합니다."
        },
        {
          "id": "cgran.medium",
          "label": "중간 · 단계마다 설명",
          "hint": "따라 할 수 있게",
          "fragment": "각 단계 아래에 \"무엇을, 어떻게, 끝나면 어떤 모습인지\" 세 가지를 덧붙입니다."
        },
        {
          "id": "cgran.fine",
          "label": "잘게 · 하나씩 체크",
          "hint": "생각 없이 따라 하게",
          "fragment": "각 단계를 바로 체크할 수 있는 최소 행동으로 나누고, 구체적인 도구와 파라미터, 표현을 포함합니다."
        }
      ]
    },
    "format.dialogue.length": {
      "id": "format.dialogue.length",
      "dim": "format",
      "title": "답변 길이",
      "question": "답변은 얼마나 길어야 합니까?",
      "multi": false,
      "options": [
        {
          "id": "dlen.short",
          "label": "몇 문장으로",
          "hint": "도입부 금지",
          "fragment": "답변 전체를 200자 이내로 하고, 핵심을 바로 말하며 도입부를 두지 않습니다."
        },
        {
          "id": "dlen.mid",
          "label": "한두 문단",
          "hint": "딱 맞게",
          "fragment": "한두 문단으로 설명하고, 길이는 300~500자로 합니다."
        },
        {
          "id": "dlen.long",
          "label": "풀어서",
          "hint": "몇 겹 더",
          "fragment": "몇 겹 더 풀어 써도 되지만 자연스러운 문단을 유지하고 목록으로 만들지 않습니다."
        }
      ]
    },
    "format.table.dimension": {
      "id": "format.table.dimension",
      "dim": "format",
      "title": "비교 기준",
      "question": "표에서 어떤 기준을 비교합니까?",
      "multi": true,
      "options": [
        {
          "id": "tdim.core",
          "label": "핵심 특징",
          "hint": "각각 무엇인지",
          "fragment": "표에 \"핵심 특징\" 열을 넣고 한 문장으로 요약합니다."
        },
        {
          "id": "tdim.pro",
          "label": "장점",
          "hint": "무엇이 좋은지",
          "fragment": "표에 \"장점\" 열을 넣습니다."
        },
        {
          "id": "tdim.con",
          "label": "한계 / 대가",
          "hint": "무엇이 부족한지",
          "fragment": "표에 \"한계 또는 대가\" 열을 넣고, 반드시 사실대로 쓰며 비워 두지 않습니다."
        },
        {
          "id": "tdim.scene",
          "label": "적용 상황",
          "hint": "언제 쓰는지",
          "fragment": "표에 \"적용 상황\" 열을 넣고, 어떤 조건에서 골라야 하는지 설명합니다."
        },
        {
          "id": "tdim.cost",
          "label": "비용 / 진입 장벽",
          "hint": "얼마가 드는지",
          "fragment": "표에 \"비용 또는 진입 장벽\" 열을 넣고, 시간과 금전, 학습 비용을 포함합니다."
        },
        {
          "id": "tdim.verdict",
          "label": "제 제안",
          "hint": "마지막 열에 결론",
          "fragment": "표의 마지막 열에 \"제안\"을 두고, 추천인지 아닌지 분명히 씁니다."
        }
      ]
    },
    "format.article.length": {
      "id": "format.article.length",
      "dim": "format",
      "title": "글 분량",
      "question": "글은 대략 얼마나 길어야 합니까?",
      "multi": false,
      "options": [
        {
          "id": "alen.short",
          "label": "단편 · 800자 정도",
          "hint": "한 가지 관점을 깊게",
          "fragment": "전체 800자 정도로, 하나의 핵심 관점을 중심으로 풀어갑니다."
        },
        {
          "id": "alen.mid",
          "label": "중편 · 1500~2000자",
          "hint": "일반적인 글 길이",
          "fragment": "전체 1500~2000자 정도로, 기승전결이 완전하게 있습니다."
        },
        {
          "id": "alen.long",
          "label": "장편 · 3000자 이상",
          "hint": "깊이 있는 내용",
          "fragment": "전체 3000자 이상으로, 단계적으로 심화되는 논증과 충분한 구체적 사례가 있어야 합니다."
        }
      ]
    },
    "format.article.structure": {
      "id": "format.article.structure",
      "dim": "format",
      "title": "글 구조",
      "question": "글은 어떤 구조를 씁니까?",
      "multi": false,
      "options": [
        {
          "id": "astr.hook",
          "label": "훅 → 전개 → 매듭",
          "hint": "확산에 적합",
          "fragment": "시작에서 구체적인 장면이나 상식을 뒤집는 사실, 날카로운 질문으로 독자를 붙잡고, 중간에서 논증을 펼치며, 끝에서 주제로 다시 모읍니다."
        },
        {
          "id": "astr.story",
          "label": "스토리라인 관통",
          "hint": "사례 하나로 엮기",
          "fragment": "완전한 스토리라인이나 사례 하나로 글 전체를 꿰고, 관점을 서사 안에 녹입니다. 논설문처럼 쓰지 마십시오."
        },
        {
          "id": "astr.list",
          "label": "병렬 항목",
          "hint": "정리가 명확",
          "fragment": "나란한 소절 구조로 글 전체를 짜고, 각 절이 독립적으로 성립해 독자가 건너뛰며 읽을 수 있게 합니다."
        },
        {
          "id": "astr.q",
          "label": "질문 주도",
          "hint": "계속 파고들기",
          "fragment": "연속된 질문으로 글을 밀고 나가고, 하나에 답하면 다음 질문이 나오게 해 단계적으로 심화되는 리듬을 만듭니다."
        }
      ]
    },
    "format.code.language": {
      "id": "format.code.language",
      "dim": "format",
      "title": "언어와 버전",
      "question": "어떤 언어 / 기술 스택을 씁니까?",
      "multi": false,
      "options": [
        {
          "id": "clang.unspecified",
          "label": "말하지 않았으니 AI가 선택",
          "hint": "가장 흔한 것을 고릅니다",
          "fragment": "기술 스택이 지정되지 않으면 가장 주류적이고 커뮤니티 지원이 좋은 방식을 고르고, 시작에 선택 이유를 밝혀 주십시오."
        },
        {
          "id": "clang.python",
          "label": "Python",
          "hint": "",
          "fragment": "Python으로 구현하고 PEP 8 스타일을 따르십시오."
        },
        {
          "id": "clang.js",
          "label": "JavaScript / TypeScript",
          "hint": "",
          "fragment": "JavaScript 또는 TypeScript로 구현하고 최신 ES 규범을 따르십시오."
        },
        {
          "id": "clang.other",
          "label": "기타 (제가 설명하겠습니다)",
          "hint": "",
          "fragment": ""
        }
      ]
    },
    "format.code.comments": {
      "id": "format.code.comments",
      "dim": "format",
      "title": "코드 설명 방식",
      "question": "코드를 어떻게 설명해 줘야 합니까?",
      "multi": false,
      "options": [
        {
          "id": "ccmt.inline",
          "label": "핵심에 주석",
          "hint": "코드만 봐도 이해",
          "fragment": "핵심 로직에 인라인 주석을 달되, \"이 줄이 무엇을 하는지\"가 아니라 \"왜 이렇게 쓰는지\"를 설명합니다."
        },
        {
          "id": "ccmt.after",
          "label": "코드 뒤에 설명",
          "hint": "따로 접근 방식",
          "fragment": "코드 뒤에 별도 문단으로 전체 접근 방식과 핵심 트레이드오프, 예상되는 함정을 설명합니다."
        },
        {
          "id": "ccmt.both",
          "label": "둘 다",
          "hint": "주석 + 설명",
          "fragment": "핵심에 인라인 주석을 달고, 코드 뒤에 전체 접근 방식 설명도 덧붙입니다."
        },
        {
          "id": "ccmt.none",
          "label": "코드만",
          "hint": "제가 직접 봅니다",
          "fragment": "코드만 출력하고 추가 설명은 하지 않습니다."
        }
      ]
    },
    "format.outline.depth": {
      "id": "format.outline.depth",
      "dim": "format",
      "title": "개요 층위",
      "question": "개요를 몇 단계까지 나눠야 합니까?",
      "multi": false,
      "options": [
        {
          "id": "odep.two",
          "label": "두 단계면 충분",
          "hint": "큰 절 + 요점",
          "fragment": "개요는 두 단계면 되고, 두 번째 단계는 완전한 문장이 아니라 짧은 구로 씁니다."
        },
        {
          "id": "odep.three",
          "label": "세 단계",
          "hint": "작은 항목까지",
          "fragment": "개요를 세 단계로 나누고, 세 번째 단계는 바로 쓰기 시작할 수 있을 만큼 구체적으로 합니다."
        },
        {
          "id": "odep.withNote",
          "label": "세 단계 + 각 절 내용",
          "hint": "작성 힌트 첨부",
          "fragment": "층위 개요 위에, 각 절마다 \"이 절에서 무엇을 말하고 어떤 자료를 쓰는지\"를 한 문장으로 덧붙입니다."
        }
      ]
    },
    "format.message.tone": {
      "id": "format.message.tone",
      "dim": "format",
      "title": "커뮤니케이션 목적",
      "question": "이 메시지의 목적은 무엇입니까?",
      "multi": false,
      "options": [
        {
          "id": "mtone.push",
          "label": "일을 밀어붙이기",
          "hint": "상대의 행동을 원함",
          "fragment": "목적은 일을 실제로 진척시키는 것이므로, 끝에 분명한 다음 단계와 일정 기대치를 반드시 제시합니다."
        },
        {
          "id": "mtone.explain",
          "label": "정보 공유",
          "hint": "상대가 알게",
          "fragment": "목적은 정보 공유이므로 배경과 현황, 영향을 명확히 하는 데 집중하고, 상대의 즉각적인 답은 필요하지 않습니다."
        },
        {
          "id": "mtone.negotiate",
          "label": "자원 확보 / 협상",
          "hint": "상대를 설득",
          "fragment": "목적은 지지 확보이므로 상대가 무엇을 얻는지 먼저 밝히고, 그다음 제 요구를 제기합니다."
        },
        {
          "id": "mtone.apologize",
          "label": "문제 설명 / 사과",
          "hint": "나쁜 소식 처리",
          "fragment": "목적은 부정적인 상황을 처리하는 것이므로 먼저 책임을 인정하고 현황을 설명한 뒤 보완안을 제시합니다. 변명하지 마십시오."
        }
      ]
    },
    "format.slides.count": {
      "id": "format.slides.count",
      "dim": "format",
      "title": "페이지 수",
      "question": "대략 몇 페이지가 필요합니까?",
      "multi": false,
      "options": [
        {
          "id": "scnt.short",
          "label": "5~8페이지",
          "hint": "짧은 보고",
          "fragment": "전체를 5~8페이지로 하고, 각 페이지에서 요점 하나만 다룹니다."
        },
        {
          "id": "scnt.mid",
          "label": "10~15페이지",
          "hint": "표준 제안서",
          "fragment": "전체 10~15페이지로, 배경과 기획안, 뒷받침, 결론이 완전하게 있어야 합니다."
        },
        {
          "id": "scnt.long",
          "label": "20페이지 이상",
          "hint": "완전한 제안서",
          "fragment": "전체 20페이지 이상으로, 상세한 논증 과정과 데이터 뒷받침, 부록을 포함해야 합니다."
        }
      ]
    },
    "tone": {
      "id": "tone",
      "dim": "style",
      "title": "어조",
      "question": "어떤 어조로 말하기를 원하십니까?",
      "helper": "어조는 이 글이 실제 사람이 말하는 것처럼 읽히는지를 정하며, \"AI 말투\"가 가장 몰려 있는 지점이기도 합니다.",
      "multi": false,
      "options": [
        {
          "id": "tone.pro",
          "label": "전문적이고 엄밀하게",
          "hint": "절제되고 정확하게",
          "fragment": "어조는 전문적이고 엄밀하며, 표현은 정확하고 절제되어 있습니다. 감정적인 표현과 과장된 수식을 피합니다."
        },
        {
          "id": "tone.warm",
          "label": "친근하고 자연스럽게",
          "hint": "친구와 대화하듯",
          "fragment": "어조는 친근하고 자연스러우며 친구끼리 대화하듯 합니다. 구어 표현과 적당한 감정은 괜찮습니다."
        },
        {
          "id": "tone.sharp",
          "label": "직설적이고 날카롭게",
          "hint": "돌려 말하지 않기",
          "fragment": "어조는 직설적이고 날카로우며, 본론부터 시작하고 겉치레 말은 하지 않으며, 판단할 때는 판단합니다."
        },
        {
          "id": "tone.humor",
          "label": "유머러스하고 가볍게",
          "hint": "한 번 웃을 수 있게",
          "fragment": "어조는 가볍고 유머러스하며 비유와 농담으로 이해 문턱을 낮춰도 됩니다. 다만 웃기려고 정보량을 희생하지는 마십시오."
        },
        {
          "id": "tone.calm",
          "label": "냉정하고 객관적으로",
          "hint": "감정을 배제",
          "fragment": "어조는 냉정하고 객관적이며, 사실과 추론만 진술하고 감정적 기울기를 드러내지 않습니다."
        },
        {
          "id": "tone.vivid",
          "label": "전달력 있게",
          "hint": "읽으면 장면이 그려지게",
          "fragment": "어조에 전달력이 있고 구체적인 장면과 디테일을 잘 써서, 독자가 묘사한 것을 \"볼 수 있게\" 합니다."
        }
      ]
    },
    "depth": {
      "id": "depth",
      "dim": "style",
      "title": "상세 수준",
      "question": "얼마나 자세히 설명하기를 원하십니까?",
      "helper": "얼마나 자세한지가 결과를 바로 쓸 수 있는지를 정합니다. 결론을 원한다면 논문을 쓰게 하지 마십시오.",
      "multi": false,
      "options": [
        {
          "id": "depth.min",
          "label": "아주 간단히",
          "hint": "결론만",
          "fragment": "결론과 최소한으로 필요한 설명만 주고, 논증 과정은 풀지 않습니다.",
          "followUps": [
            "depth.why"
          ]
        },
        {
          "id": "depth.light",
          "label": "간명하게",
          "hint": "결론 + 핵심 이유",
          "fragment": "결론과 함께 가장 중요한 이유 두세 가지만 붙이고 나머지 세부는 생략합니다.",
          "followUps": [
            "depth.why"
          ]
        },
        {
          "id": "depth.mid",
          "label": "적당히",
          "hint": "완전한 논증",
          "fragment": "완전한 논증 과정을 제시하고, 주장과 근거를 모두 분명히 밝힙니다.",
          "followUps": [
            "depth.why"
          ]
        },
        {
          "id": "depth.deep",
          "label": "깊이 있게",
          "hint": "추론, 경계, 반례 포함",
          "fragment": "깊이 있게 풀어내며, 도출 과정과 적용 경계, 반례, 불확실성 설명을 포함합니다.",
          "followUps": [
            "depth.why"
          ]
        }
      ]
    },
    "depth.why": {
      "id": "depth.why",
      "dim": "style",
      "title": "왜인지 설명할지",
      "question": "\"왜\"를 설명해야 합니까?",
      "multi": false,
      "options": [
        {
          "id": "why.no",
          "label": "아니요, 답만 주면 됩니다",
          "hint": "결과만 원함",
          "fragment": "도출 과정을 설명할 필요 없이 답을 바로 줍니다."
        },
        {
          "id": "why.key",
          "label": "핵심 단계만",
          "hint": "필요한 만큼만",
          "fragment": "가장 오해하기 쉽거나 가장 핵심적인 단계에서만 이유를 설명하고 나머지는 생략합니다."
        },
        {
          "id": "why.full",
          "label": "네, 철저히",
          "hint": "방법을 배우고 싶음",
          "fragment": "배경 원리와 추론 사슬을 철저히 설명해, 답만이 아니라 방법까지 알게 해 주십시오."
        }
      ]
    },
    "constraints": {
      "id": "constraints",
      "dim": "constraint",
      "title": "강제 제약",
      "question": "\"절대 하지 말 것\" 또는 \"반드시 지킬 것\"은 무엇입니까?",
      "helper": "여러 개를 고르거나 하나도 고르지 않아도 됩니다. AI가 옆으로 새는 것을 막는 가드레일입니다.",
      "multi": true,
      "optional": true,
      "options": [
        {
          "id": "con.nogreet",
          "label": "도입부와 인사말 금지",
          "hint": "\"좋은 질문이네요\" 금지",
          "fragment": "도입부와 인사말, 제 질문을 되풀이하는 말은 일절 하지 말고 곧바로 본문부터 시작합니다."
        },
        {
          "id": "con.norepeat",
          "label": "제 질문을 되풀이하지 않기",
          "hint": "바로 답하기",
          "fragment": "제 질문을 반복하거나 바꿔 쓰지 말고 곧바로 답으로 들어갑니다."
        },
        {
          "id": "con.nohallucinate",
          "label": "모르면 모른다고",
          "hint": "지어내지 않기",
          "fragment": "정보가 부족하거나 확신이 없으면 \"이 점은 확실하지 않습니다\"라고 분명히 밝히고, 데이터와 출처, 사실을 지어내는 것은 엄격히 금합니다."
        },
        {
          "id": "con.nodigress",
          "label": "주제를 벗어나지 않기",
          "hint": "딴소리 금지",
          "fragment": "주제와 무관한 내용으로 확장하지 말고, 제 요구 범위를 임의로 넓히지도 마십시오."
        },
        {
          "id": "con.nosummary",
          "label": "마무리 요약 금지",
          "hint": "다시 반복 금지",
          "fragment": "끝에 요약이나 주제 끌어올리기, 앞 내용 반복을 하지 말고 다 쓰면 끝냅니다."
        },
        {
          "id": "con.wordlimit",
          "label": "분량 엄수",
          "hint": "넘으면 실패",
          "fragment": "제가 제시한 분량을 엄격히 지키고, 넘거나 모자라면 둘 다 과업 미완수로 봅니다."
        },
        {
          "id": "con.source",
          "label": "사실에는 출처 표기",
          "hint": "아니면 불확실 표기",
          "fragment": "구체적인 수치와 시각, 인명, 연구 결론이 나오면 반드시 출처를 밝힙니다. 확인할 수 없는 것은 \"확인 필요\"라고 분명히 표시합니다."
        },
        {
          "id": "con.noemoji",
          "label": "이모지와 장식 기호 금지",
          "hint": "순수 텍스트",
          "fragment": "이모지나 장식용 기호를 쓰지 않습니다."
        },
        {
          "id": "con.noask",
          "label": "저에게 되묻지 않기",
          "hint": "알아서 판단",
          "fragment": "저에게 되묻거나 추가 정보를 요구하지 말고, 가진 정보로 가장 합리적인 가정을 한 뒤 무엇을 가정했는지 밝혀 주십시오.",
          "group": "ask"
        },
        {
          "id": "con.askfirst",
          "label": "정보가 부족하면 먼저 질문",
          "hint": "추측 금지",
          "fragment": "핵심 정보가 부족하면 꼭 필요한 질문 1~3개를 먼저 하고, 제 답을 기다린 뒤 시작하십시오. 추측으로 시작하지 마십시오.",
          "group": "ask"
        }
      ]
    },
    "antiAi": {
      "id": "antiAi",
      "dim": "constraint",
      "title": "AI 냄새 빼기",
      "question": "그 \"AI 말투\"를 빼 드릴까요?",
      "helper": "많은 사람이 가장 신경 쓰는 부분입니다. 체크하면 명확한 작성 금지 조항으로 반영됩니다.",
      "multi": true,
      "optional": true,
      "options": [
        {
          "id": "ai.cliche",
          "label": "상투적 표현 금지",
          "hint": "\"첫째 둘째 마지막으로\"\"주목할 만한 점은\"",
          "fragment": "다음 상투적 표현을 금지합니다. 첫째/둘째/마지막으로, 주목할 만한 점은, 요컨대, 이상을 종합하면, 오늘날 사회에서, …의 발전과 함께, 함께 살펴봅시다, 도움이 되었기를 바랍니다."
        },
        {
          "id": "ai.parallel",
          "label": "병렬 나열 금지",
          "hint": "세 문장씩 나열 금지",
          "fragment": "병렬 구문과 억지로 맞춘 대구 구조를 금지하고, 리듬감을 위해 짧은 문장을 쌓아 올리지 않습니다."
        },
        {
          "id": "ai.antithesis",
          "label": "대구 구문 금지",
          "hint": "\"A가 아니라 B\"",
          "fragment": "\"A가 아니라 B\"\"…라기보다는 …\" 같은 대구 구문을 금지합니다."
        },
        {
          "id": "ai.rhythm",
          "label": "문장 길이를 들쭉날쭉하게",
          "hint": "한 리듬으로 끝까지 가지 않기",
          "fragment": "문장 길이가 뚜렷하게 달라야 합니다. 짧은 문장, 심지어 불완전한 문장도 허용하며, 기계적으로 반듯한 리듬은 피합니다."
        },
        {
          "id": "ai.concrete",
          "label": "구체적인 명사와 동사 위주",
          "hint": "형용사는 적게",
          "fragment": "구체적인 명사와 동사를 쓰고 형용사와 부사, 추상적 총론은 줄입니다. 예시로 설명할 수 있으면 총론으로 뭉뚱그리지 마십시오."
        },
        {
          "id": "ai.colloquial",
          "label": "구어체와 조각문 허용",
          "hint": "사람이 쓴 것처럼",
          "fragment": "구어 표현과 삽입구, 생략문을 허용하며, 모든 문장이 완전하고 규범적일 필요는 없습니다."
        },
        {
          "id": "ai.noperpara",
          "label": "문단마다 요약하지 않기",
          "hint": "문장마다 매듭짓지 않기",
          "fragment": "문단마다 요약 문장으로 끝내지 말고 내용이 자연스럽게 이어지게 합니다."
        },
        {
          "id": "ai.hedge",
          "label": "모호한 한정 표현 줄이기",
          "hint": "\"어느 정도\"\"어떤 의미에서\"",
          "fragment": "\"어느 정도\"\"어떤 의미에서\"\"어떤 면에서는\" 같은 모호한 한정 표현의 사용을 줄입니다."
        },
        {
          "id": "ai.emotion",
          "label": "억지 주제 끌어올리기 금지",
          "hint": "주제를 높이지 않기",
          "fragment": "끝에서 주제를 끌어올리거나 감정을 고조시키지 말고, 멈춰야 할 곳에서 멈춥니다."
        },
        {
          "id": "ai.contrast",
          "label": "줄표 남용 줄이기",
          "hint": "—— 남용하지 않기",
          "fragment": "설명이나 전환을 위해 줄표를 남용하지 말고, 평범한 문장 구조로 바꿉니다."
        }
      ]
    },
    "examples": {
      "id": "examples",
      "dim": "example",
      "title": "예시 참고",
      "question": "먼저 예시를 들어야 합니까?",
      "helper": "예시를 주는 것이 가장 효과적인 기준 맞추기 수단이며, 주고받는 재작업을 크게 줄입니다.",
      "multi": false,
      "options": [
        {
          "id": "ex.good",
          "label": "좋은 예시 1~2개 먼저",
          "hint": "이 느낌대로",
          "fragment": "본 출력 전에 좋은 예시 1~2개를 먼저 제시해 \"좋음의 기준\"을 분명히 하고, 그 기준에 맞춰 내용을 만듭니다."
        },
        {
          "id": "ex.contrast",
          "label": "좋은 예와 나쁜 예 대조",
          "hint": "나쁜 예 하나",
          "fragment": "본 출력 전에 좋은 예시 하나와 나쁜 예시 하나를 제시하고, 나쁜 예시가 어디서 부족한지 설명합니다."
        },
        {
          "id": "ex.none",
          "label": "아니요, 바로",
          "hint": "시간 낭비 금지",
          "fragment": "예시는 필요 없고 최종 내용을 바로 출력합니다."
        }
      ]
    },
    "img.subject": {
      "id": "img.subject",
      "dim": "subject",
      "title": "피사체",
      "question": "화면에서 가장 중요한 것은 무엇입니까?",
      "helper": "피사체는 그림 전체의 닻입니다. 이것을 먼저 분명히 해야 스타일과 조명이 의미를 갖습니다.",
      "multi": false,
      "options": [
        {
          "id": "isub.person",
          "label": "인물",
          "hint": "인물, 캐릭터",
          "fragment": "화면의 주 피사체는 인물입니다",
          "followUps": [
            "img.subject.person"
          ]
        },
        {
          "id": "isub.animal",
          "label": "동물",
          "hint": "반려동물, 야생동물",
          "fragment": "화면의 주 피사체는 동물입니다",
          "followUps": [
            "img.subject.animal"
          ]
        },
        {
          "id": "isub.product",
          "label": "제품 / 정물",
          "hint": "상품, 사물",
          "fragment": "화면의 주 피사체는 제품 정물입니다",
          "followUps": [
            "img.subject.product"
          ]
        },
        {
          "id": "isub.scene",
          "label": "풍경 / 장면",
          "hint": "자연, 도시, 공간",
          "fragment": "화면의 주 피사체는 환경 장면이며, 두드러지는 인물은 없습니다"
        },
        {
          "id": "isub.arch",
          "label": "건축 / 공간",
          "hint": "실내, 외관",
          "fragment": "화면의 주 피사체는 건축 공간이며, 구조와 원근 관계가 드러나야 합니다"
        },
        {
          "id": "isub.food",
          "label": "음식",
          "hint": "요리, 음료",
          "fragment": "화면의 주 피사체는 음식이며, 색감과 먹음직스러운 질감을 부각해야 합니다"
        },
        {
          "id": "isub.vehicle",
          "label": "기계 / 탈것",
          "hint": "자동차, 메카, 우주선",
          "fragment": "화면의 주 피사체는 기계 탈것이며, 구조적 디테일과 금속 질감이 드러나야 합니다"
        },
        {
          "id": "isub.abstract",
          "label": "추상 개념",
          "hint": "감정, 개념의 시각화",
          "fragment": "화면의 주 피사체는 추상 개념의 시각화 표현이며, 구체적인 실사를 추구하지 않습니다"
        }
      ]
    },
    "img.subject.person": {
      "id": "img.subject.person",
      "dim": "subject",
      "title": "인물 느낌",
      "question": "이 인물의 느낌은 어느 쪽에 가깝습니까?",
      "multi": false,
      "options": [
        {
          "id": "iper.natural",
          "label": "자연스럽고 사실적인 인물",
          "hint": "실제로 찍은 것처럼",
          "fragment": "사실적이고 자연스러운 인물, 피부에 실제 같은 질감, 표정은 편안하고 꾸민 느낌 없음"
        },
        {
          "id": "iper.action",
          "label": "무언가를 하는 중",
          "hint": "동작과 이야기 느낌",
          "fragment": "인물이 무언가에 집중하고 있고, 스냅 사진 같은 순간감과 이야기가 담겨 있음"
        },
        {
          "id": "iper.fashion",
          "label": "패션 화보 질감",
          "hint": "스타일링과 긴장감",
          "fragment": "패션 잡지 화보 같은 질감, 스타일링에 설계감이 있고 자세에 긴장감이 있음"
        },
        {
          "id": "iper.anime",
          "label": "애니 / 2D 캐릭터",
          "hint": "비실사",
          "fragment": "2D 캐릭터 스타일, 선이 선명하고 배색이 밝음"
        },
        {
          "id": "iper.group",
          "label": "여러 인물",
          "hint": "두 명 이상",
          "fragment": "화면에 인물이 여러 명 있고, 서로의 위치 관계와 시선 교차를 잘 처리해야 함"
        }
      ]
    },
    "img.subject.animal": {
      "id": "img.subject.animal",
      "dim": "subject",
      "title": "동물 느낌",
      "question": "동물이 어떤 상태로 등장합니까?",
      "multi": false,
      "options": [
        {
          "id": "iani.cute",
          "label": "귀여운 반려동물",
          "hint": "만지고 싶게",
          "fragment": "귀여운 반려동물, 털이 부드럽고 풍성하며 눈빛이 살아 있음"
        },
        {
          "id": "iani.wild",
          "label": "야생동물 다큐멘터리",
          "hint": "자연스럽고 힘 있게",
          "fragment": "야생동물 다큐멘터리 느낌, 동물의 힘과 자연 환경을 드러냄"
        },
        {
          "id": "iani.humanized",
          "label": "의인화",
          "hint": "옷을 입고 사람처럼",
          "fragment": "의인화된 동물, 옷을 입거나 사람의 활동을 하며 유머러스함"
        },
        {
          "id": "iani.art",
          "label": "예술적 처리",
          "hint": "삽화 또는 스타일화",
          "fragment": "예술적으로 처리한 동물, 실사를 추구하지 않음"
        }
      ]
    },
    "img.subject.product": {
      "id": "img.subject.product",
      "dim": "subject",
      "title": "제품 표현 방식",
      "question": "제품을 어떻게 보여 줍니까?",
      "multi": false,
      "options": [
        {
          "id": "iprd.clean",
          "label": "단색 배경 상품 사진",
          "hint": "이커머스 대표 이미지",
          "fragment": "깨끗한 단색 배경, 제품은 중앙, 조명은 균일하고 불필요한 요소 없음"
        },
        {
          "id": "iprd.scene",
          "label": "상황형 제품 사진",
          "hint": "사용 장면에 배치",
          "fragment": "제품을 실제 사용 장면에 녹여, 환경으로 용도와 분위기를 암시함"
        },
        {
          "id": "iprd.detail",
          "label": "소재 클로즈업",
          "hint": "촉감과 공정 강조",
          "fragment": "근접 클로즈업으로 제품의 소재와 텍스처, 마감 디테일에 집중"
        },
        {
          "id": "iprd.concept",
          "label": "콘셉트 포스터",
          "hint": "창의적 설정",
          "fragment": "콘셉트형 제품 포스터, 창의적인 시각 설정으로 제품의 주장을 표현"
        }
      ]
    },
    "img.composition": {
      "id": "img.composition",
      "dim": "composition",
      "title": "샷 사이즈와 구도",
      "question": "카메라가 피사체에서 얼마나 떨어져 있고, 어떻게 프레이밍합니까?",
      "helper": "샷 사이즈가 정보량을 정합니다. 클로즈업은 디테일을, 전경은 관계를 말합니다.",
      "multi": false,
      "options": [
        {
          "id": "icomp.closeup",
          "label": "클로즈업",
          "hint": "일부만, 디테일 강조",
          "fragment": "클로즈업 구도, 피사체가 화면의 대부분을 차지함",
          "followUps": [
            "img.angle"
          ]
        },
        {
          "id": "icomp.medium",
          "label": "미디엄 샷",
          "hint": "가장 흔한 거리",
          "fragment": "미디엄 샷 구도, 피사체가 온전히 나오고 적당한 환경 정보가 남음",
          "followUps": [
            "img.angle"
          ]
        },
        {
          "id": "icomp.wide",
          "label": "전경 / 환경 인물",
          "hint": "인물은 작게, 배경은 크게",
          "fragment": "전경 구도, 환경이 주도하고 피사체는 장면에서 작은 비중만 차지함",
          "followUps": [
            "img.angle"
          ]
        },
        {
          "id": "icomp.macro",
          "label": "매크로",
          "hint": "최대한 붙여서",
          "fragment": "매크로 클로즈업, 아주 가까운 거리에서 표면 텍스처와 미세한 디테일을 보여 줌",
          "followUps": [
            "img.angle"
          ]
        },
        {
          "id": "icomp.centered",
          "label": "대칭 중앙",
          "hint": "안정적이고 정중함",
          "fragment": "대칭 중앙 구도, 좌우가 균형을 이루고 시각적 무게가 정중앙에 놓임",
          "followUps": [
            "img.angle"
          ]
        },
        {
          "id": "icomp.rule",
          "label": "삼분할",
          "hint": "자연스럽고 편안함",
          "fragment": "삼분할 구도, 피사체가 화면의 황금 분할점에 놓임",
          "followUps": [
            "img.angle"
          ]
        },
        {
          "id": "icomp.blank",
          "label": "넓은 여백",
          "hint": "텍스트 자리 확보",
          "fragment": "화면에 넓은 여백을 두고 피사체를 치우쳐 배치해, 텍스트 조판 공간을 확보함",
          "followUps": [
            "img.angle"
          ]
        }
      ]
    },
    "img.angle": {
      "id": "img.angle",
      "dim": "composition",
      "title": "촬영 시점",
      "question": "어떤 각도에서 봅니까?",
      "multi": false,
      "options": [
        {
          "id": "iang.eye",
          "label": "눈높이",
          "hint": "자연스러운 관찰 각도",
          "fragment": "눈높이 시점, 사람 눈높이에 가까움"
        },
        {
          "id": "iang.low",
          "label": "앙각",
          "hint": "커 보이고 위압감",
          "fragment": "낮은 각도의 앙각 촬영, 피사체가 크고 위압적으로 보임"
        },
        {
          "id": "iang.high",
          "label": "부감",
          "hint": "전체 조망, 왜소함",
          "fragment": "높은 각도의 부감 촬영, 전체 관계를 보여 줌"
        },
        {
          "id": "iang.dutch",
          "label": "기울어진 구도",
          "hint": "불안정, 역동성",
          "fragment": "기울어진 더치 앵글 구도로, 약간의 불안정감을 줌"
        },
        {
          "id": "iang.pov",
          "label": "1인칭 시점",
          "hint": "몰입감이 큼",
          "fragment": "1인칭 시점, 보는 사람이 직접 본 것처럼"
        },
        {
          "id": "iang.aerial",
          "label": "항공 촬영",
          "hint": "큰 장면",
          "fragment": "항공 부감 시점, 지형과 공간 배치를 강조"
        },
        {
          "id": "iang.over",
          "label": "오버 더 숄더 / 뒷모습",
          "hint": "전경으로 시선 유도",
          "fragment": "오버 더 숄더나 뒷모습 시점, 전경 인물로 시선을 화면 깊숙한 곳으로 유도"
        }
      ]
    },
    "img.lighting": {
      "id": "img.lighting",
      "dim": "lighting",
      "title": "조명",
      "question": "빛은 어떻게 들어옵니까?",
      "helper": "빛은 화면에서 가장 값비싼 요소입니다. 같은 구도라도 빛을 바꾸면 다른 이야기가 됩니다.",
      "multi": true,
      "options": [
        {
          "id": "ilt.soft",
          "label": "부드러운 자연광",
          "hint": "흐린 날, 창가",
          "fragment": "부드럽고 균일한 자연광, 그림자 전환이 완만함",
          "group": [
            "source",
            "quality"
          ]
        },
        {
          "id": "ilt.golden",
          "label": "골든아워의 따뜻한 빛",
          "hint": "일출과 일몰",
          "fragment": "골든아워의 낮은 각도 따뜻한 빛, 화면이 금빛 주황으로 물듦",
          "group": [
            "source",
            "time"
          ]
        },
        {
          "id": "ilt.blue",
          "label": "블루아워의 차가운 빛",
          "hint": "날이 막 저문 무렵",
          "fragment": "블루아워의 차가운 환경광, 전체적으로 청록과 파랑으로 기울음",
          "group": [
            "source",
            "time"
          ]
        },
        {
          "id": "ilt.rim",
          "label": "측면 역광 / 림 라이트",
          "hint": "피사체 윤곽을 그림",
          "fragment": "강한 측면 역광이 피사체 가장자리에 밝은 윤곽선을 그림"
        },
        {
          "id": "ilt.studio",
          "label": "스튜디오 조명",
          "hint": "깨끗하고 통제 가능",
          "fragment": "스튜디오 조명, 주광과 보조광의 층위가 분명하고 배경이 깨끗함",
          "group": "source"
        },
        {
          "id": "ilt.hard",
          "label": "하드 라이트 / 강한 그림자",
          "hint": "강한 대비",
          "fragment": "단단한 직사광, 그림자 가장자리가 날카롭고 명암 대비가 강함",
          "group": "quality"
        },
        {
          "id": "ilt.neon",
          "label": "네온 / 사이버 컬러 조명",
          "hint": "컬러 인공광",
          "fragment": "네온과 컬러 인공광원, 화면에 강한 색 반사가 있음",
          "group": "source"
        },
        {
          "id": "ilt.lowkey",
          "label": "로우키 조명",
          "hint": "대부분 어둡고 일부만 밝음",
          "fragment": "로우키 조명, 화면이 대부분 어둡고 일부만 밝게 빛남",
          "group": "key"
        },
        {
          "id": "ilt.highkey",
          "label": "하이키로 밝게",
          "hint": "맑고 깨끗함",
          "fragment": "하이키 조명, 화면이 밝고 맑으며 진한 그림자가 거의 없음",
          "group": "key"
        },
        {
          "id": "ilt.godray",
          "label": "볼류메트릭 라이트 / 틴들 현상",
          "hint": "눈에 보이는 빛줄기",
          "fragment": "볼류메트릭 라이트 효과, 공기 중에 선명한 빛줄기와 먼지 입자가 보임"
        }
      ]
    },
    "img.style": {
      "id": "img.style",
      "dim": "style",
      "title": "스타일 계열",
      "question": "어떤 시각 스타일을 원하십니까?",
      "helper": "최대 두 개까지. 화풍은 한 가지만 고를 수 있고, 분위기는 겹쳐도 됩니다(예: \"실사 사진 + 시네마틱\").",
      "multi": true,
      "maxPick": 2,
      "options": [
        {
          "id": "ist.photo",
          "label": "실사 사진",
          "hint": "진짜 찍은 사진처럼",
          "fragment": "실사 사진 스타일, 빛과 질감이 실제 물리에 부합함",
          "group": "medium"
        },
        {
          "id": "ist.cinema",
          "label": "시네마틱",
          "hint": "필름 색조, 높은 다이내믹",
          "fragment": "영화 화면 질감, 필름 색감, 높은 다이내믹 레인지"
        },
        {
          "id": "ist.jp",
          "label": "일본풍 청량",
          "hint": "맑고 낮은 대비",
          "fragment": "일본풍 청량 스타일, 밝고 대비가 낮으며 맑고 깨끗함"
        },
        {
          "id": "ist.ink",
          "label": "중국풍 수묵",
          "hint": "여백, 사의",
          "fragment": "중국 수묵 스타일, 여백과 사의를 중시하고 붓질에 호흡이 있음",
          "group": "medium"
        },
        {
          "id": "ist.3d",
          "label": "3D 렌더",
          "hint": "C4D / Blender 질감",
          "fragment": "3D 렌더 질감, 재질과 빛이 물리 기반 렌더링 규칙을 따름",
          "group": "medium"
        },
        {
          "id": "ist.cyber",
          "label": "사이버펑크",
          "hint": "네온, 비 오는 밤, 테크 감성",
          "fragment": "사이버펑크 스타일, 네온 광공해와 하이테크 로우라이프의 시각적 대비"
        },
        {
          "id": "ist.film",
          "label": "빈티지 필름",
          "hint": "그레인, 바랜 색",
          "fragment": "빈티지 필름 질감, 그레인이 뚜렷하고 색이 약간 바램"
        },
        {
          "id": "ist.flat",
          "label": "미니멀 플랫 삽화",
          "hint": "깨끗하고 벡터 느낌",
          "fragment": "미니멀 플랫 삽화 스타일, 기하학적 형태, 색면이 분명함",
          "group": "medium"
        },
        {
          "id": "ist.oil",
          "label": "유화 / 임파스토",
          "hint": "붓질이 뚜렷함",
          "fragment": "유화 임파스토 질감, 붓질이 또렷하게 보이고 색이 풍부하게 겹침",
          "group": "medium"
        },
        {
          "id": "ist.concept",
          "label": "콘셉트 아트",
          "hint": "설정화 질감",
          "fragment": "콘셉트 아트 스타일, 설계감과 상상력의 표현을 강조"
        },
        {
          "id": "ist.pixel",
          "label": "픽셀 아트",
          "hint": "레트로 게임",
          "fragment": "픽셀 아트 스타일, 색 블록이 분명하고 가장자리가 날카로움",
          "group": "medium"
        },
        {
          "id": "ist.vapor",
          "label": "베이퍼웨이브",
          "hint": "분홍·보라 그라데이션, 복고 테크",
          "fragment": "베이퍼웨이브 스타일, 분홍·보라 그라데이션 배색, 80년대 복고 테크 요소를 결합"
        }
      ]
    },
    "img.mood": {
      "id": "img.mood",
      "dim": "mood",
      "title": "정서와 분위기",
      "question": "이 그림은 어떤 감정을 전달해야 합니까?",
      "helper": "분위기는 관객이 \"무엇을 보는가\"가 아니라 \"무엇을 느끼는가\"를 정합니다.",
      "multi": false,
      "options": [
        {
          "id": "imd.calm",
          "label": "고요하고 편안함",
          "hint": "마음을 가라앉힘",
          "fragment": "전체 분위기가 고요하고 편안하며 흐름이 느림"
        },
        {
          "id": "imd.warm",
          "label": "따뜻하고 치유적",
          "hint": "안정감",
          "fragment": "분위기가 따뜻하고 치유적이며, 감싸인 듯한 안정감을 줌"
        },
        {
          "id": "imd.tense",
          "label": "긴장과 압박",
          "hint": "긴장감",
          "fragment": "분위기가 긴장되고 억눌려 있으며 불안한 긴장감이 있음"
        },
        {
          "id": "imd.lonely",
          "label": "고독과 소외",
          "hint": "텅 비고 고요함",
          "fragment": "분위기가 고독하고 소외되어, 피사체와 환경 사이에 뚜렷한 거리감이 있음"
        },
        {
          "id": "imd.mystery",
          "label": "신비와 미지",
          "hint": "뭔가 감춰진 듯",
          "fragment": "분위기가 신비롭고, 화면에 아직 드러나지 않은 정보가 숨어 있는 듯함"
        },
        {
          "id": "imd.energy",
          "label": "활기와 과시",
          "hint": "추진력",
          "fragment": "분위기가 활기와 에너지로 가득하고 역동성이 강함"
        },
        {
          "id": "imd.noble",
          "label": "고급스러운 절제",
          "hint": "명품 느낌",
          "fragment": "분위기가 고급스럽고 절제되어, 요소를 쌓지 않고 여백과 질감으로 말함"
        },
        {
          "id": "imd.retro",
          "label": "향수와 복고",
          "hint": "옛 시절의 온도",
          "fragment": "분위기가 향수와 복고로, 시대감과 기억의 온도를 지님"
        }
      ]
    },
    "img.palette": {
      "id": "img.palette",
      "dim": "color",
      "title": "색조",
      "question": "전체적인 색감 경향은 무엇입니까?",
      "helper": "기준 색은 하나여야 합니다. 그렇지 않으면 화면이 어지러워집니다.",
      "multi": false,
      "options": [
        {
          "id": "ipal.warm",
          "label": "난색",
          "hint": "주황·노랑·빨강",
          "fragment": "난색 위주로, 주황·노랑·빨강이 주 색상을 이룸"
        },
        {
          "id": "ipal.cool",
          "label": "한색",
          "hint": "청록과 파랑",
          "fragment": "한색 위주로, 청록과 파랑이 주 색상을 이룸"
        },
        {
          "id": "ipal.mono",
          "label": "저채도 / 단색",
          "hint": "절제되고 튀지 않음",
          "fragment": "저채도 배색으로 단색에 가까움"
        },
        {
          "id": "ipal.morandi",
          "label": "모란디 컬러",
          "hint": "고급스러운 회색",
          "fragment": "모란디 컬러, 회색 톤이 부드럽고 색끼리 서로 양보함"
        },
        {
          "id": "ipal.contrast",
          "label": "고채도 컬러 대비",
          "hint": "강렬함",
          "fragment": "고채도 컬러 대비 조합, 색 대비가 강함"
        },
        {
          "id": "ipal.bw",
          "label": "흑백",
          "hint": "명암만",
          "fragment": "흑백 톤, 명암 층위만으로 화면을 만듦"
        },
        {
          "id": "ipal.faded",
          "label": "복고 바랜 색",
          "hint": "옛 사진 느낌",
          "fragment": "복고 바랜 색조, 색이 시간에 씻긴 듯함"
        },
        {
          "id": "ipal.dual",
          "label": "난색·한색 이색 대비",
          "hint": "두 색상의 충돌",
          "fragment": "난색·한색 이색 대비, 화면이 두 색상 사이에서 긴장을 이룸"
        }
      ]
    },
    "img.ratio": {
      "id": "img.ratio",
      "dim": "composition",
      "title": "화면비",
      "question": "이 그림은 어디에 쓸 예정입니까?",
      "helper": "비율이 맞지 않으면 아무리 좋은 그림도 잘라야 합니다.",
      "multi": false,
      "options": [
        {
          "id": "irat.square",
          "label": "1:1 정사각형",
          "hint": "프로필 사진, 이커머스 대표 이미지",
          "fragment": "1:1 정사각형 화면비"
        },
        {
          "id": "irat.p34",
          "label": "3:4 세로",
          "hint": "샤오홍슈, 포스터",
          "fragment": "3:4 세로 화면비"
        },
        {
          "id": "irat.p916",
          "label": "9:16 세로",
          "hint": "휴대폰 배경화면, 숏폼 커버",
          "fragment": "9:16 세로 화면비"
        },
        {
          "id": "irat.l169",
          "label": "16:9 가로",
          "hint": "배경화면, PPT, 영상 커버",
          "fragment": "16:9 와이드 화면비"
        },
        {
          "id": "irat.p23",
          "label": "2:3 세로",
          "hint": "사진 작품",
          "fragment": "2:3 클래식 사진 세로 화면비"
        },
        {
          "id": "irat.cinema",
          "label": "21:9 와이드",
          "hint": "시네마틱",
          "fragment": "21:9 초광각 화면비, 영화 스크린 비율에 가까움"
        }
      ]
    },
    "img.quality": {
      "id": "img.quality",
      "dim": "quality",
      "title": "화질과 렌즈",
      "question": "어느 수준의 디테일과 렌즈 질감을 원하십니까?",
      "helper": "이 항목이 결과 이미지의 \"고급스러움\"을 정합니다.",
      "multi": true,
      "options": [
        {
          "id": "iql.detail",
          "label": "높은 디테일, 정교한 텍스처",
          "hint": "확대해도 견딤",
          "fragment": "매우 높은 디테일, 재질 텍스처가 또렷하게 구분되고 확대해서 봐도 견딤"
        },
        {
          "id": "iql.dof",
          "label": "얕은 심도, 배경 흐림",
          "hint": "피사체를 부각",
          "fragment": "얕은 심도 효과, 배경이 부드럽게 흐려져 피사체가 환경에서 분리되어 보임"
        },
        {
          "id": "iql.p85",
          "label": "85mm 인물 렌즈",
          "hint": "압축감, 얼굴형이 예쁘게",
          "fragment": "85mm 준망원 인물 렌즈 질감, 공간 압축이 자연스럽고 얼굴 비율이 편안함",
          "group": "lens"
        },
        {
          "id": "iql.w24",
          "label": "광각 렌즈의 긴장감",
          "hint": "공간감이 강함",
          "fragment": "24mm 광각 렌즈 질감, 원근이 과장되고 공간의 깊이감이 강함",
          "group": "lens"
        },
        {
          "id": "iql.motion",
          "label": "장노출 / 모션 블러",
          "hint": "시간의 흐름",
          "fragment": "장노출 효과, 움직이는 물체가 부드러운 잔상을 남김"
        },
        {
          "id": "iql.grain",
          "label": "필름 그레인",
          "hint": "질감 있고 불완전하게",
          "fragment": "뚜렷한 필름 그레인 질감, 화면이 완벽하게 깨끗하기를 추구하지 않음"
        },
        {
          "id": "iql.8k",
          "label": "8K 초고화질",
          "hint": "극한의 선명함",
          "fragment": "8K 초고화질, 디테일이 날카로움"
        },
        {
          "id": "iql.skin",
          "label": "실제 피부 질감",
          "hint": "플라스틱 느낌 금지",
          "fragment": "실제 피부 질감, 모공과 미세한 잡티를 남기고 과도한 보정을 하지 않음"
        }
      ]
    },
    "img.negative": {
      "id": "img.negative",
      "dim": "negative",
      "title": "네거티브 프롬프트",
      "question": "화면에 절대 나오면 안 되는 것은 무엇입니까?",
      "helper": "네거티브 프롬프트는 가장 손이 덜 가는 품질 향상 수단입니다. 하나도 고르지 않아도 됩니다.",
      "multi": true,
      "optional": true,
      "options": [
        {
          "id": "ineg.quality",
          "label": "저품질, 흐림, 노이즈",
          "hint": "low quality, blurry",
          "fragment": "low quality, blurry, noisy, jpeg artifacts"
        },
        {
          "id": "ineg.hands",
          "label": "뒤틀린 손, 여분의 사지",
          "hint": "bad hands",
          "fragment": "bad hands, extra fingers, extra limbs, deformed hands"
        },
        {
          "id": "ineg.face",
          "label": "일그러진 얼굴",
          "hint": "deformed face",
          "fragment": "distorted face, deformed face, asymmetric eyes"
        },
        {
          "id": "ineg.text",
          "label": "텍스트와 워터마크",
          "hint": "text, watermark",
          "fragment": "text, watermark, signature, logo"
        },
        {
          "id": "ineg.plastic",
          "label": "플라스틱 피부, 과도한 보정",
          "hint": "plastic skin",
          "fragment": "plastic skin, over-smoothed skin, waxy texture"
        },
        {
          "id": "ineg.hdr",
          "label": "과도하게 포화된 HDR 느낌",
          "hint": "over-saturated",
          "fragment": "over-saturated, excessive HDR, oversharpened"
        },
        {
          "id": "ineg.clutter",
          "label": "어지러운 구도, 요소 과다",
          "hint": "cluttered",
          "fragment": "cluttered composition, too many elements, busy background"
        },
        {
          "id": "ineg.faceavg",
          "label": "똑같은 인플루언서 얼굴",
          "hint": "generic AI face",
          "fragment": "generic AI face, same-face syndrome, instagram filter face"
        },
        {
          "id": "ineg.irrelevant",
          "label": "무관한 물체가 프레임에 들어옴",
          "hint": "random items",
          "fragment": "irrelevant objects, random items in frame"
        },
        {
          "id": "ineg.artifacts",
          "label": "뚜렷한 AI 생성 흔적",
          "hint": "AI artifacts",
          "fragment": "obvious AI artifacts, unnatural anatomy, uncanny valley"
        }
      ]
    },
    "vid.action": {
      "id": "vid.action",
      "dim": "action",
      "title": "피사체 동작",
      "question": "화면에서 무슨 일이 일어납니까?",
      "helper": "영상과 이미지의 가장 큰 차이는 \"변화가 있다\"는 점입니다. 변화를 먼저 분명히 하십시오.",
      "multi": false,
      "options": [
        {
          "id": "vact.still",
          "label": "피사체는 고정, 환경이 움직임",
          "hint": "바람, 물결, 빛의 변화",
          "fragment": "피사체는 거의 정지해 있고 바람과 물, 빛, 군중 같은 환경 요소가 움직임을 만듦"
        },
        {
          "id": "vact.single",
          "label": "하나의 연속 동작",
          "hint": "돌아서기, 손 들기, 걷기",
          "fragment": "피사체가 하나의 연속 동작을 완수하고, 동작 과정이 온전히 보임"
        },
        {
          "id": "vact.sequence",
          "label": "다단계 동작 시퀀스",
          "hint": "먼저… 그다음…",
          "fragment": "피사체가 여러 동작을 차례로 완수하고, 동작 사이에 분명한 선후 관계가 있음"
        },
        {
          "id": "vact.enter",
          "label": "화면 밖에서 들어옴",
          "hint": "걸어 들어와 멈춤",
          "fragment": "피사체가 화면 밖에서 들어와 화면 안에서 멈춤"
        },
        {
          "id": "vact.express",
          "label": "표정과 감정 변화",
          "hint": "클로즈업 위주",
          "fragment": "얼굴 표정의 미세한 변화와 감정의 흐름을 중점적으로 보여 줌"
        },
        {
          "id": "vact.interact",
          "label": "두 피사체의 상호 작용",
          "hint": "대화, 접촉",
          "fragment": "두 피사체 사이에 상호 작용이 일어나고, 동작이 서로 호응해야 함"
        }
      ]
    },
    "vid.shot": {
      "id": "vid.shot",
      "dim": "shot",
      "title": "샷 사이즈",
      "question": "어떤 샷 사이즈를 씁니까?",
      "helper": "여러 개를 고를 수 있고, 스토리보드의 각 샷에 순서대로 배분됩니다. 전체가 한 샷인지 여러 샷인지는 \"컷 구성\"이 정합니다.",
      "multi": true,
      "options": [
        {
          "id": "vsh.extreme",
          "label": "익스트림 와이드",
          "hint": "환경 제시",
          "fragment": "익스트림 와이드, 피사체가 넓은 환경에서 아주 작은 비중만 차지함"
        },
        {
          "id": "vsh.wide",
          "label": "전경",
          "hint": "피사체와 환경이 함께 중요",
          "fragment": "전경, 피사체가 온전히 들어오고 환경 정보가 충분히 남음"
        },
        {
          "id": "vsh.medium",
          "label": "미디엄 샷",
          "hint": "가장 흔히 씀",
          "fragment": "미디엄 샷, 인물의 허리 위까지 프레이밍"
        },
        {
          "id": "vsh.close",
          "label": "근경",
          "hint": "표정 중심",
          "fragment": "근경, 인물의 가슴 위까지 프레이밍해 얼굴 표정을 부각"
        },
        {
          "id": "vsh.cu",
          "label": "클로즈업",
          "hint": "부분 디테일",
          "fragment": "클로즈업 샷, 얼굴이나 핵심 디테일에 초점"
        },
        {
          "id": "vsh.macro",
          "label": "익스트림 클로즈업",
          "hint": "매크로",
          "fragment": "익스트림 클로즈업 매크로 샷, 육안으로 보기 어려운 디테일을 보여 줌"
        }
      ]
    },
    "vid.move": {
      "id": "vid.move",
      "dim": "move",
      "title": "카메라 무빙 방식",
      "question": "카메라는 어떻게 움직입니까?",
      "helper": "카메라 무빙은 영상의 \"말투\"입니다. 같은 화면이라도 고정 카메라와 오비트는 완전히 다른 결과를 냅니다. 여러 개를 고르면 스토리보드의 각 샷에 순서대로 배분되며(첫 번째는 샷 1에, 이런 식으로), 단일 샷 영상은 첫 번째만 씁니다.",
      "multi": true,
      "maxPick": 4,
      "options": [
        {
          "id": "vmv.static",
          "label": "고정 카메라",
          "hint": "차분하고 절제됨",
          "fragment": "고정 카메라, 카메라가 완전히 정지"
        },
        {
          "id": "vmv.push",
          "label": "천천히 푸시인",
          "hint": "점차 초점",
          "fragment": "카메라가 천천히 다가가며 피사체에 초점을 맞춤"
        },
        {
          "id": "vmv.pull",
          "label": "천천히 풀아웃",
          "hint": "환경을 드러냄",
          "fragment": "카메라가 천천히 물러나며 피사체가 있는 환경을 드러냄"
        },
        {
          "id": "vmv.pan",
          "label": "좌우 팬",
          "hint": "훑어보는 듯",
          "fragment": "카메라가 수평으로 팬하며 장면 전체를 훑는 듯함"
        },
        {
          "id": "vmv.track",
          "label": "횡이동 / 트래킹",
          "hint": "피사체를 따라감",
          "fragment": "카메라가 피사체와 같은 속도로 횡이동해 화면에서 피사체의 상대 위치를 유지"
        },
        {
          "id": "vmv.orbit",
          "label": "오비트",
          "hint": "피사체를 돌아감",
          "fragment": "카메라가 피사체를 중심으로 회전"
        },
        {
          "id": "vmv.crane",
          "label": "상승·하강 / 크레인",
          "hint": "수직 방향 변화",
          "fragment": "카메라가 수직으로 오르내리며 관찰 높이를 바꿈"
        },
        {
          "id": "vmv.handheld",
          "label": "핸드헬드 흔들림",
          "hint": "다큐멘터리 느낌",
          "fragment": "핸드헬드 촬영, 카메라가 자연스럽게 약간 흔들려 다큐멘터리 느낌을 줌"
        },
        {
          "id": "vmv.drone",
          "label": "드론 항공 촬영",
          "hint": "대범위 이동",
          "fragment": "드론 항공 시점, 카메라가 크게 이동하거나 장면 위를 비행"
        },
        {
          "id": "vmv.pov",
          "label": "1인칭 시점",
          "hint": "몰입감이 큼",
          "fragment": "1인칭 시점 이동, 보는 사람이 직접 움직이는 것처럼"
        }
      ]
    },
    "vid.style": {
      "id": "vid.style",
      "dim": "style",
      "title": "영상 스타일",
      "question": "전체 영상 스타일은 무엇입니까?",
      "multi": false,
      "options": [
        {
          "id": "vst.cinema",
          "label": "시네마틱",
          "hint": "필름, 층위감",
          "fragment": "영화급 영상 질감, 필름 색감, 풍부한 명암 층위"
        },
        {
          "id": "vst.doc",
          "label": "다큐멘터리 실사",
          "hint": "사실적, 꾸미지 않음",
          "fragment": "다큐멘터리 스타일, 빛과 화면이 사실적이고 자연스러우며 꾸미지 않음"
        },
        {
          "id": "vst.ad",
          "label": "광고 질감",
          "hint": "깨끗하고 고급스러움",
          "fragment": "고급 광고 영상 질감, 화면이 깨끗하고 빛이 정교함"
        },
        {
          "id": "vst.anime",
          "label": "애니메이션 / 2D",
          "hint": "작화 느낌",
          "fragment": "2D 애니메이션 스타일, 선이 선명하고 동작에 작화 느낌이 있음"
        },
        {
          "id": "vst.stop",
          "label": "스톱모션",
          "hint": "프레임별 질감",
          "fragment": "스톱모션 스타일, 한 프레임씩 찍은 듯한 약간의 끊김"
        },
        {
          "id": "vst.vhs",
          "label": "복고 VHS",
          "hint": "옛 비디오테이프",
          "fragment": "복고 비디오테이프 질감, 화면에 노이즈와 색 번짐, 약간의 떨림이 있음"
        },
        {
          "id": "vst.cyber",
          "label": "사이버펑크",
          "hint": "네온 미래",
          "fragment": "사이버펑크 영상 스타일, 네온 광원과 한색 도시 환경"
        }
      ]
    },
    "vid.cut": {
      "id": "vid.cut",
      "dim": "cut",
      "title": "컷 구성",
      "question": "전체를 어떻게 편집합니까?",
      "helper": "이것이 전체에 몇 개의 샷이 들어가는지를 정합니다. 한 샷이면 여러 샷 사이즈가 필요 없습니다.",
      "multi": false,
      "options": [
        {
          "id": "vcut.cut",
          "label": "스토리보드 편집",
          "hint": "여러 샷 전환",
          "fragment": "스토리보드 순서대로 편집해 이어 붙이고, 샷 사이 전환이 깔끔함"
        },
        {
          "id": "vcut.oner",
          "label": "원 테이크",
          "hint": "전체가 한 샷",
          "fragment": "원 테이크 롱 숏, 전체에 컷 지점이 없음"
        }
      ]
    },
    "vid.lighting": {
      "id": "vid.lighting",
      "dim": "lighting",
      "title": "조명",
      "question": "빛은 어떤 모습입니까?",
      "multi": true,
      "options": [
        {
          "id": "vlt.natural",
          "label": "자연 일광",
          "hint": "사실적",
          "fragment": "자연 일광, 빛이 사실적이고 꾸민 느낌이 없음",
          "group": "source"
        },
        {
          "id": "vlt.golden",
          "label": "골든아워",
          "hint": "일출·일몰의 따뜻한 빛",
          "fragment": "골든아워의 따뜻한 낮은 각도 빛",
          "group": "source"
        },
        {
          "id": "vlt.night",
          "label": "야경 네온",
          "hint": "인공 광원이 복잡함",
          "fragment": "밤 도시의 조명과 네온, 광원이 복잡하고 층위가 있음",
          "group": "source"
        },
        {
          "id": "vlt.studio",
          "label": "스튜디오 조명",
          "hint": "깨끗하고 통제 가능",
          "fragment": "스튜디오 조명, 빛이 깨끗하고 통제 가능",
          "group": "source"
        },
        {
          "id": "vlt.back",
          "label": "역광 실루엣",
          "hint": "윤곽만 보임",
          "fragment": "역광 촬영, 피사체가 실루엣이나 반실루엣으로 표현됨"
        },
        {
          "id": "vlt.overcast",
          "label": "흐린 날 부드러운 빛",
          "hint": "강한 그림자 없음",
          "fragment": "흐린 날의 부드러운 확산광, 강한 그림자가 거의 없음",
          "group": "source"
        }
      ]
    },
    "vid.duration": {
      "id": "vid.duration",
      "dim": "duration",
      "title": "길이와 리듬",
      "question": "영상은 얼마나 길고 리듬은 어떻습니까?",
      "helper": "길이가 몇 개의 샷을 담을 수 있는지를 정합니다. 3~5초에 네 개의 스토리보드를 밀어 넣으면 어느 샷도 제대로 보이지 않습니다.",
      "multi": false,
      "options": [
        {
          "id": "vdur.s5",
          "label": "3~5초 · 단일 샷",
          "hint": "한 샷으로 충분",
          "fragment": "길이 3~5초, 리듬은 느긋함",
          "seconds": 5,
          "maxShots": 1
        },
        {
          "id": "vdur.s10",
          "label": "5~10초 · 단일 샷",
          "hint": "동작이 온전히 펼쳐짐",
          "fragment": "길이 5~10초, 동작이 온전히 펼쳐지게 함",
          "seconds": 10,
          "maxShots": 1
        },
        {
          "id": "vdur.s15",
          "label": "10~15초 · 멀티 샷 가능",
          "hint": "편집 있음",
          "fragment": "길이 10~15초, 리듬에 추진력이 있음",
          "seconds": 15,
          "maxShots": 3
        },
        {
          "id": "vdur.long",
          "label": "15초 이상 · 스토리보드 필요",
          "hint": "스토리보드 먼저",
          "fragment": "길이 15초 이상, 리듬에 기복이 있음",
          "seconds": 20,
          "maxShots": 4
        }
      ]
    },
    "vid.audio": {
      "id": "vid.audio",
      "dim": "audio",
      "title": "사운드",
      "question": "사운드가 필요합니까? 어떤 사운드입니까?",
      "helper": "사용하는 도구가 오디오를 지원하지 않으면 \"사운드 없음\"을 고르면 됩니다.",
      "multi": true,
      "options": [
        {
          "id": "vaud.none",
          "label": "사운드 없음",
          "hint": "화면만",
          "fragment": "화면만 묘사하고 오디오는 필요 없음",
          "group": "*"
        },
        {
          "id": "vaud.ambient",
          "label": "환경음",
          "hint": "바람 소리, 빗소리, 거리",
          "fragment": "바람 소리나 물소리, 도시 배경음 같은 환경음을 함께"
        },
        {
          "id": "vaud.music",
          "label": "감정 음악",
          "hint": "리듬을 실어 줌",
          "fragment": "감정적인 배경 음악을 함께",
          "followUps": [
            "vid.bgm"
          ]
        },
        {
          "id": "vaud.voice",
          "label": "내레이션 / 대사",
          "hint": "사람 목소리 있음",
          "fragment": "사람 목소리 내레이션이나 대사를 포함"
        },
        {
          "id": "vaud.sfx",
          "label": "동작에 효과음",
          "hint": "동작에 힘을 실어 줌",
          "fragment": "핵심 동작에 효과음을 얹어 강조"
        }
      ]
    },
    "vid.bgm": {
      "id": "vid.bgm",
      "dim": "bgm",
      "title": "음악 유형",
      "question": "음악은 구체적으로 어떤 느낌입니까?",
      "helper": "악기와 속도를 분명히 써야 음악이 옆으로 새지 않습니다.",
      "multi": false,
      "options": [
        {
          "id": "vbgm.piano",
          "label": "느린 피아노",
          "hint": "깨끗하고 절제됨",
          "fragment": "느린 피아노 독주 위주, 음이 드문드문하고 여백이 많음"
        },
        {
          "id": "vbgm.cello",
          "label": "낮은 첼로",
          "hint": "묵직하고 이야기 느낌",
          "fragment": "낮은 첼로의 긴 음을 깔아, 감정이 묵직하고 이야기 느낌이 남"
        },
        {
          "id": "vbgm.ambient",
          "label": "앰비언트",
          "hint": "깔아 주고 튀지 않음",
          "fragment": "앰비언트 음악, 지속되는 패드를 깔아 화면을 방해하지 않음"
        },
        {
          "id": "vbgm.lofi",
          "label": "Lo-Fi 나른함",
          "hint": "느긋하고 생활감 있게",
          "fragment": "Lo-Fi 스타일, 약한 배경 노이즈와 나른한 드럼, 생활감이 짙음"
        },
        {
          "id": "vbgm.strings",
          "label": "현악 크레셴도",
          "hint": "절정으로 밀어 올림",
          "fragment": "현악이 약하게 시작해 점점 강해지며 중후반에 감정을 최고점으로 밀어 올림"
        },
        {
          "id": "vbgm.electronic",
          "label": "일렉트로닉 앰비언스",
          "hint": "차갑고 미래적",
          "fragment": "신시사이저 음색, 차갑고 미래적이며 리듬이 정연함"
        }
      ]
    },
    "vid.arc": {
      "id": "vid.arc",
      "dim": "arc",
      "title": "감정 흐름",
      "question": "이 영상에서 관객의 감정이 어떻게 흘러가기를 원하십니까?",
      "helper": "네 샷이 같은 감정이면 관객은 평평하게 느낍니다. 흐름을 정해야 각 샷의 분위기가 나아갑니다.",
      "multi": false,
      "options": [
        {
          "id": "varc.rise",
          "label": "정지에서 움직임으로",
          "hint": "천천히 고조되어 마지막에 밀어 올림",
          "fragment": "감정이 정지에서 움직임으로, 전반부는 절제하고 후반부는 밀어 올림",
          "arc": [
            "먼저 가라앉음",
            "천천히 고조됨",
            "밀어 올림",
            "분출"
          ]
        },
        {
          "id": "varc.warm",
          "label": "차가움에서 따뜻함으로",
          "hint": "소외에서 접근으로",
          "fragment": "감정이 차가움에서 따뜻함으로, 소외와 절제에서 점차 따뜻함으로 넘어감",
          "arc": [
            "소외되고 절제됨",
            "풀리기 시작",
            "점차 다가감",
            "따뜻함에 안착"
          ]
        },
        {
          "id": "varc.build",
          "label": "단계적 심화",
          "hint": "샷마다 더 팽팽해짐",
          "fragment": "감정이 단계적으로 심화되고, 샷마다 더 팽팽해짐",
          "arc": [
            "장면을 펼침",
            "본론으로 들어감",
            "긴장을 조임",
            "가라앉으며 마무리"
          ]
        },
        {
          "id": "varc.release",
          "label": "팽팽함에서 느슨함으로",
          "hint": "눌러 두다가 놓아 줌",
          "fragment": "감정이 팽팽함에서 느슨함으로, 전반부는 눌러 두고 후반부는 놓아 줌",
          "arc": [
            "감정을 눌러 둠",
            "팽팽한 대치",
            "풀리기 시작",
            "완전히 풀어짐"
          ]
        },
        {
          "id": "varc.flow",
          "label": "완만하게 흐름",
          "hint": "억지 기복 없음",
          "fragment": "감정이 완만하게 흐르고 강한 기복을 만들지 않음",
          "arc": [
            "가볍게 펼침",
            "천천히 흐름",
            "약간의 기복",
            "서서히 내려앉음"
          ]
        }
      ]
    },
    "vid.focus": {
      "id": "vid.focus",
      "dim": "focus",
      "title": "디테일 초점",
      "question": "카메라가 다가갈 때 가장 또렷하게 보여 주고 싶은 것은 무엇입니까?",
      "helper": "클로즈업과 근경에서 초점을 지정하지 않으면 모델이 알아서 고르는데, 대개 엉뚱한 곳을 고릅니다.",
      "multi": false,
      "options": [
        {
          "id": "vfoc.face",
          "label": "얼굴 표정",
          "fragment": "관객의 시선을 얼굴 표정으로 이끔"
        },
        {
          "id": "vfoc.eyes",
          "label": "눈빛과 시선",
          "fragment": "관객의 시선을 눈빛과 시선 방향으로 이끔"
        },
        {
          "id": "vfoc.hands",
          "label": "손동작",
          "fragment": "관객의 시선을 손동작으로 이끔"
        },
        {
          "id": "vfoc.prop",
          "label": "핵심 소품",
          "fragment": "관객의 시선을 핵심 소품의 재질과 디테일로 이끔"
        },
        {
          "id": "vfoc.env",
          "label": "환경 디테일",
          "fragment": "관객의 시선을 환경 디테일로 이끌어 배경의 질감을 선명하게 보이게 함"
        },
        {
          "id": "vfoc.light",
          "label": "빛의 변화",
          "fragment": "관객의 시선을 빛과 그림자의 변화로 이끔"
        }
      ]
    },
    "vid.detail": {
      "id": "vid.detail",
      "dim": "detail",
      "title": "화면 디테일",
      "question": "화면에 반드시 나와야 할 디테일은 무엇입니까?",
      "helper": "직접 쓴 구체적인 디테일이 앞에 오고, 한 항목이 한 샷에 배정됩니다. 더 구체적으로 쓰려면 \"직접 입력\"을 눌러 바로 적으십시오. 예: \"우산에 맺힌 빗방울, 물웅덩이에 비친 반영, 네온 간판\"처럼 쉼표로 구분하고, 샷 수만큼 적으면 됩니다.",
      "multi": true,
      "maxPick": 6,
      "optional": true,
      "options": [
        {
          "id": "vdet.outfit",
          "label": "피사체의 의상과 외모",
          "hint": "옷, 헤어스타일, 소지품",
          "fragment": "피사체의 의상과 외모 디테일이 선명하게 보임"
        },
        {
          "id": "vdet.face",
          "label": "얼굴과 표정",
          "hint": "표정의 변화",
          "fragment": "얼굴과 표정의 변화가 선명하게 보임"
        },
        {
          "id": "vdet.env",
          "label": "환경 질감",
          "hint": "벽면, 바닥, 거리 풍경",
          "fragment": "환경의 재질과 질감이 선명하게 보임"
        },
        {
          "id": "vdet.air",
          "label": "공기감",
          "hint": "물기, 먼지, 빛 얼룩",
          "fragment": "공기 중의 물기나 먼지, 빛 얼룩이 선명하게 보임"
        },
        {
          "id": "vdet.reflect",
          "label": "반사와 반영",
          "hint": "수면, 유리, 금속",
          "fragment": "바닥이나 물체 표면의 반사와 반영이 선명하게 보임"
        },
        {
          "id": "vdet.prop",
          "label": "핵심 소품",
          "hint": "우산, 컵, 휴대폰…",
          "fragment": "핵심 소품의 디테일이 선명하게 보임"
        },
        {
          "id": "vdet.crowd",
          "label": "군중과 차량 흐름",
          "hint": "배경의 움직임",
          "fragment": "배경에 천천히 움직이는 군중이나 차량 흐름이 있음"
        },
        {
          "id": "vdet.texture",
          "label": "표면 텍스처",
          "hint": "천, 나뭇결, 석재 무늬",
          "fragment": "물체 표면의 텍스처가 확대되어 표현됨"
        }
      ]
    },
    "vid.ratio": {
      "id": "vid.ratio",
      "dim": "shot",
      "title": "화면비",
      "question": "이 영상은 어디에 게시합니까?",
      "helper": "가로·세로를 잘못 고르면 플랫폼이 자동으로 잘라내 구도가 완전히 망가집니다.",
      "multi": false,
      "options": [
        {
          "id": "vrat.l169",
          "label": "16:9 가로",
          "hint": "빌리빌리, YouTube, 공식 사이트",
          "fragment": "16:9 와이드 화면비"
        },
        {
          "id": "vrat.p916",
          "label": "9:16 세로",
          "hint": "더우인, 샤오홍슈, Reels",
          "fragment": "9:16 세로 화면비, 휴대폰 전체 화면 시청에 맞춤"
        },
        {
          "id": "vrat.square",
          "label": "1:1 정사각형",
          "hint": "피드 광고",
          "fragment": "1:1 정사각형 화면비"
        },
        {
          "id": "vrat.cinema",
          "label": "21:9 와이드",
          "hint": "시네마틱 예고편",
          "fragment": "21:9 초광각 화면비, 영화 스크린 비율에 가까움"
        },
        {
          "id": "vrat.p45",
          "label": "4:5 세로",
          "hint": "Instagram 피드",
          "fragment": "4:5 세로 화면비"
        }
      ]
    },
    "vid.negative": {
      "id": "vid.negative",
      "dim": "negative",
      "title": "네거티브 프롬프트",
      "question": "절대 나타나면 안 되는 문제는 무엇입니까?",
      "helper": "영상 모델이 가장 자주 어긋나는 지점이 여기에 모여 있습니다. 최소 몇 개는 고르시길 권합니다.",
      "multi": true,
      "optional": true,
      "options": [
        {
          "id": "vneg.shake",
          "label": "화면 흔들림, 젤리 효과",
          "hint": "shaky footage",
          "fragment": "shaky footage, jello effect, rolling shutter"
        },
        {
          "id": "vneg.face",
          "label": "얼굴 / 사지 변형",
          "hint": "deformed",
          "fragment": "deformed face, distorted body, extra limbs"
        },
        {
          "id": "vneg.pop",
          "label": "물체가 갑자기 나타나거나 사라짐",
          "hint": "morphing",
          "fragment": "objects appearing or disappearing, morphing"
        },
        {
          "id": "vneg.motion",
          "label": "부자연스러운 움직임, 잔상",
          "hint": "ghosting",
          "fragment": "unnatural motion, motion blur artifacts, ghosting"
        },
        {
          "id": "vneg.flicker",
          "label": "화면 깜빡임, 프레임 건너뜀",
          "hint": "flickering",
          "fragment": "flickering, frame skipping, stuttering"
        },
        {
          "id": "vneg.text",
          "label": "텍스트와 워터마크",
          "hint": "text, watermark",
          "fragment": "text, watermark, subtitles"
        },
        {
          "id": "vneg.quality",
          "label": "저해상도, 흐림",
          "hint": "low resolution",
          "fragment": "low resolution, blurry, pixelated"
        },
        {
          "id": "vneg.chaos",
          "label": "여러 피사체의 동작이 뒤엉킴",
          "hint": "chaotic",
          "fragment": "chaotic action, multiple subjects moving inconsistently"
        }
      ]
    }
  },
  "sectionTitles": {
    "role": "역할 설정",
    "context": "배경과 대상",
    "task": "작업 목표",
    "requirement": "구체적 요구",
    "format": "출력 형식",
    "style": "어조와 상세도",
    "constraint": "제약 조건",
    "example": "예시 요구",
    "subject": "피사체",
    "composition": "구도와 렌즈",
    "lighting": "조명",
    "mood": "정서와 분위기",
    "color": "색조",
    "quality": "화질과 렌즈 질감",
    "negative": "네거티브 프롬프트",
    "action": "피사체 동작",
    "shot": "샷 사이즈",
    "focus": "디테일 초점",
    "move": "카메라 무빙 방식",
    "cut": "컷 구성",
    "arc": "감정 흐름",
    "detail": "화면 디테일",
    "duration": "길이와 리듬",
    "audio": "사운드"
  },
  "shotContent": {
    "vsh.extreme": "환경으로 화면을 가득 채우고, 피사체는 그 안의 작은 점 하나로만 등장합니다",
    "vsh.wide": "피사체가 온전히 들어오고, 환경이 화면의 대부분을 차지합니다",
    "vsh.medium": "허리 위까지 잡아, 피사체의 동작과 주변 환경이 동시에 보입니다",
    "vsh.close": "가슴 위까지 잡아, 배경이 흐려지기 시작합니다",
    "vsh.cu": "피사체의 한 부분만 남기고 나머지는 모두 흐려집니다",
    "vsh.macro": "아주 가까이 붙어, 질감이 화면 전체를 채웁니다"
  },
  "shotRole": {
    "vsh.extreme": "시간과 장소, 전체 분위기를 먼저 세우고, 인물은 환경 속 한 점일 뿐입니다",
    "vsh.wide": "피사체를 환경 안에 온전히 넣어 \"누가, 어디에\" 있는지 한눈에 보이게 합니다",
    "vsh.medium": "동작과 자세가 가장 또렷해, 서사의 주력 샷입니다",
    "vsh.close": "감정이 드러나기 시작해, 관객이 표정을 읽을 수 있습니다",
    "vsh.cu": "시선을 한 디테일에 고정해 질감을 확대합니다",
    "vsh.macro": "육안으로 구분하기 어려운 스케일까지 붙어 낯설음을 만듭니다"
  },
  "visualJoiner": {
    "image": ", ",
    "video": ". "
  },
  "visualEnd": {
    "image": "",
    "video": "."
  },
  "sectionExplain": {
    "role": "AI에게 \"당신은 누구의 입장에서 답하는가\"를 알려 주면, 그에 맞는 판단 기준과 말투로 자동 전환합니다. 같은 질문이라도 전문가의 시각과 초보자의 시각은 전혀 다른 답을 냅니다.",
    "context": "\"누구에게 보여 주는지, 어떤 상황에서 쓰는지\"를 분명히 밝혀야 AI가 어휘 수준과 예시 방식을 스스로 맞춥니다. 가장 자주 잊히지만 효과는 가장 큰 항목입니다.",
    "task": "AI가 바꿔 말하게 하지 말고 당신의 원래 표현을 그대로 남깁니다. 원문에는 당신의 어조와 진짜 의도가 담겨 있고, 한 번 바꿔 말할 때마다 조금씩 사라집니다.",
    "requirement": "\"당연하다고 여기는\" 세부 사항을 적어 두세요. 바로 당연하다고 느끼기 때문에 AI가 그 부분을 빠뜨립니다.",
    "format": "출력의 형태와 길이, 구조를 정합니다. \"결과를 쓸 수 없다\"는 문제의 대부분은 여기서 시작됩니다. 내용이 틀린 게 아니라 형태가 틀린 것입니다.",
    "style": "어조와 상세도는 글이 사람이 쓴 말처럼 읽히는지를 좌우합니다. 이 항목을 구체적으로 쓸수록 완성본의 \"AI 냄새\"가 옅어집니다.",
    "constraint": "경계를 분명히 그어 줍니다. 무엇을 원하지 않는지, 무엇은 반드시 지켜야 하는지. 제약은 요구보다 결과를 안정시킵니다. AI가 제멋대로 해석할 여지를 막아 주기 때문입니다.",
    "example": "예시를 주는 것이 가장 빠른 기준 맞추기입니다. 구체적인 예시 하나는 추상적인 설명 열 줄보다 많은 것을 전합니다.",
    "subject": "이미지 모델은 당신이 쓴 것만 그립니다. 피사체를 구체적으로 쓸수록 제멋대로 해석할(즉, 옆으로 새는) 여지가 줄어듭니다.",
    "composition": "샷 사이즈와 시점은 관객이 어디에 서서 보는지를 정합니다. \"무심코 찍은 한 장\"과 \"설계된 화면\"을 가르는 핵심입니다.",
    "lighting": "빛은 화면에서 가장 값비싼 요소입니다. 같은 구도라도 빛을 바꾸면 전혀 다른 이야기와 가격대가 됩니다.",
    "mood": "분위기는 \"보고 나서 무엇을 느끼는가\"에 답합니다. 내용만 쓰고 감정을 쓰지 않으면 결과물은 정확하지만 감동이 없습니다.",
    "color": "색은 가장 먼저 감지되고 가장 늦게 의식되는 요소입니다. 기준 색을 정해 두어야 그림 전체가 어지러워지지 않습니다.",
    "quality": "화질과 렌즈 묘사는 결과 이미지의 \"정교함\"을 결정하고, 싸구려 느낌을 벗어나는 가장 직접적인 수단입니다.",
    "negative": "네거티브 프롬프트는 가성비가 가장 좋은 단계입니다. \"원하지 않는 것\"을 한 줄 적는 편이 \"원하는 것\"을 계속 고치는 것보다 훨씬 빠릅니다.",
    "action": "영상과 이미지의 유일한 차이는 \"변화가 있다\"는 점입니다. 변화를 분명히 쓰면 모델이 무엇을 움직여야 하는지 압니다.",
    "shot": "샷 사이즈는 영상의 문법입니다. 한 가지 샷만 쓰면 단조롭고, 여러 샷을 쓰면 컷으로 이어 붙여야 합니다.",
    "focus": "카메라가 다가갈 때 무엇을 보여 줄지 밝히지 않으면 모델이 알아서 하나를 고르는데, 대개 중요하지 않은 곳을 고릅니다. 그래서 이 항목은 클로즈업·근경에만 적용되고, 원경에는 \"초점\"이라는 개념이 없습니다.",
    "move": "카메라 무빙은 영상의 \"말투\"입니다. 고정 카메라는 절제, 오비트는 강조, 핸드헬드는 다큐멘터리입니다.",
    "cut": "컷 구성은 영상의 \"골격\"입니다. 한 샷인지 여러 샷인지가 몇 개의 샷 사이즈를 설명해야 하는지를 바로 정합니다. 원 테이크는 컷 지점이 없어 동선과 카메라 무빙으로 정보를 다 전해야 하고, 스토리보드 편집은 서로 다른 샷 사이즈를 이어 붙여 정보 밀도를 높일 수 있습니다.",
    "arc": "감정 흐름은 스토리보드의 골격입니다. 네 개의 샷이 같은 감정이면 관객은 평평하게 느낍니다. 흐름을 정해 두면 각 샷이 전체에서 어느 구간을 맡는지 알게 됩니다.",
    "detail": "\"화면 디테일\"은 설명을 구체적으로 만드는 유일한 방법입니다. \"한 사람이 비를 맞으며 걷는다\"는 누구나 씁니다. 하지만 \"우산에 맺힌 빗방울, 물웅덩이에 비친 반영\"이라야 모델이 실제로 그릴 수 있습니다.",
    "duration": "길이는 모델이 무엇을 출력할지를 바로 정합니다. 15초를 넘는 영상은 반드시 스토리보드로 나눠야 합니다. 그렇지 않으면 앞뒤가 이어지지 않습니다.",
    "audio": "사운드는 시청 경험의 절반입니다. 도구가 오디오를 지원하지 않는다면 \"필요 없다\"고 분명히 밝혀 두면 화면에 음악이 억지로 붙는 것을 막을 수 있습니다."
  },
  "cues": {
    "textTask": "써 줘|써줘|써 주세요|작성|만들어 줘|만들어 주세요|정리해|요약해|분석해|설명해|번역해|다듬어|고쳐 줘|코드|스크립트|기획안|보고서|카피|개요|이메일|이름 지어|이름 좀|초안|기획",
    "visual": "입고|차림|앉아|서서|누워|엎드려|걷는|뛰는|날아|떠 있는|뒷모습|옆얼굴|한 손|클로즈업|근경|중경|원경|카메라|화면|배경은|광선|색조|분위기|심도|보케|질감|삽화|실사|사이버|애니|한 마리|한 장|한 폭|거리|밤거리|네온|반영|그림자|설산|호수|숲|사막|하늘|햇빛|달빛|조명|결이|텍스처|방 안|실내|건물|고층|옥상|바닥|잔디|해변|지하철|카페|서점|식탁|나뭇잎|황혼|새벽|저녁|일출|일몰|별이|은하수|안개|물웅덩이|발코니|창턱|골목",
    "motion": "걷는|달리는|날아가는|흩날리는|흐르는|돌아서는|뒤돌아|타임랩스|슬로모션|카메라 무빙|원 테이크|멀티 샷|샷 전환|컷 전환|촬영|카메라 (푸시|풀|팬|틸트|트래킹|상승|하강)"
  },
  "recommendRules": {
    "img.subject": [
      [
        "isub.person",
        "/인물|초상|인물화|남자|여자|여자아이|남자아이|소녀|소년|노인|아이|모델|청년|뒷모습|옆얼굴/i"
      ],
      [
        "isub.animal",
        "/고양이|강아지|새(?!로운|벽|해)|동물|반려동물|호랑이|사자|늑대|토끼|말(?!씀|하|투|꼬)|곰|판다|여우|고래|물고기|드래곤|나비|독수리|사슴/i"
      ],
      [
        "isub.food",
        "/음식|요리|밥|국수|커피|케이크|디저트|과일|식사|음료|술|차(?!량|이|별|원|트|종)/i"
      ],
      [
        "isub.product",
        "/제품|상품|병(?!원|실|사)|향수|시계|신발|가방|화장품|스킨케어|음료수|패키지|헤드폰|스마트폰/i"
      ],
      [
        "isub.vehicle",
        "/자동차|메카|우주선|로봇|오토바이|비행기|전차|군함|탈것/i"
      ],
      [
        "isub.arch",
        "/건축|인테리어|방(?!법|향|문|송|학|식|해|금)|거실|사무실|상점|교회|다리|고층 빌딩|공간 디자인/i"
      ],
      [
        "isub.scene",
        "/풍경|도시|산맥|등산|설산|산꼭대기|바다|숲|사막|눈이 내|눈밭|설원|하늘|거리 풍경|도심 거리|야경|일출|일몰|초원|호수|별이 빛나는|폭우|비가/i"
      ],
      [
        "isub.abstract",
        "/추상|개념|감정|고독|자유|시간|기억|꿈/i"
      ]
    ],
    "img.ratio": [
      [
        "irat.p916",
        "/9:16|세로|스마트폰 배경|숏폼 커버|tiktok|틱톡|도우인|샤오홍슈|위챗 모멘트/i"
      ],
      [
        "irat.l169",
        "/16:9|가로|배경화면|슬라이드|프레젠테이션|데스크톱|웹사이트|배너/i"
      ],
      [
        "irat.square",
        "/1:1|정사각형|아바타|프로필 사진|이커머스 상품 이미지|로고/i"
      ],
      [
        "irat.p34",
        "/3:4|포스터|샤오홍슈|커버/i"
      ]
    ],
    "vid.ratio": [
      [
        "vrat.p916",
        "/틱톡|도우인|샤오홍슈|reels|9:16|세로|스마트폰/i"
      ],
      [
        "vrat.l169",
        "/bilibili|비리비리|웹사이트|youtube|16:9|가로|홍보 영상/i"
      ],
      [
        "vrat.square",
        "/피드|광고|1:1|정사각형/i"
      ]
    ]
  },
  "signalLabels": {
    "text": [
      [
        "hasRole",
        "역할"
      ],
      [
        "hasAudience",
        "대상 독자"
      ],
      [
        "hasFormat",
        "출력 형식"
      ],
      [
        "hasTone",
        "어조"
      ],
      [
        "hasConstraint",
        "제약 조건"
      ],
      [
        "hasExample",
        "예시 참고"
      ],
      [
        "hasBackground",
        "배경 정보"
      ]
    ],
    "image": [
      [
        "hasSubject",
        "피사체 설명"
      ],
      [
        "hasComposition",
        "구도"
      ],
      [
        "hasLighting",
        "조명"
      ],
      [
        "hasStyle",
        "스타일"
      ],
      [
        "hasColor",
        "색상"
      ],
      [
        "hasRatio",
        "화면비"
      ],
      [
        "hasNegative",
        "네거티브 제약"
      ]
    ],
    "video": [
      [
        "hasSubject",
        "피사체 설명"
      ],
      [
        "hasAction",
        "동작"
      ],
      [
        "hasShot",
        "샷 사이즈"
      ],
      [
        "hasMove",
        "카메라 무빙"
      ],
      [
        "hasStyle",
        "영상 스타일"
      ],
      [
        "hasLighting",
        "조명"
      ],
      [
        "hasDuration",
        "길이"
      ],
      [
        "hasAudio",
        "사운드와 음악"
      ],
      [
        "hasNegative",
        "네거티브 제약"
      ]
    ]
  },
  "scoreItems": {
    "text": [
      {
        "key": "task",
        "label": "작업 명확성",
        "weight": 20,
        "hint": "무엇을 할지 분명히 밝혔는지"
      },
      {
        "key": "role",
        "label": "역할 설정",
        "weight": 12,
        "hint": "AI의 역할을 지정했는지"
      },
      {
        "key": "context",
        "label": "배경과 대상",
        "weight": 16,
        "hint": "맥락과 대상을 설명했는지"
      },
      {
        "key": "format",
        "label": "출력 사양",
        "weight": 16,
        "hint": "형식과 길이, 구조를 정했는지"
      },
      {
        "key": "style",
        "label": "어조와 깊이",
        "weight": 14,
        "hint": "어조와 상세 수준을 정했는지"
      },
      {
        "key": "constraint",
        "label": "제약 경계",
        "weight": 12,
        "hint": "하지 말아야 할 것을 분명히 했는지"
      },
      {
        "key": "example",
        "label": "예시 참고",
        "weight": 10,
        "hint": "기준이 될 예시를 제공했는지"
      }
    ],
    "image": [
      {
        "key": "subject",
        "label": "피사체 설명",
        "weight": 24,
        "hint": "무엇을 그리는지 분명히 했는지"
      },
      {
        "key": "composition",
        "label": "구도",
        "weight": 16,
        "hint": "샷 사이즈, 앵글과 화면비"
      },
      {
        "key": "lighting",
        "label": "조명과 분위기",
        "weight": 16,
        "hint": "빛의 방향과 질감"
      },
      {
        "key": "style",
        "label": "스타일 설정",
        "weight": 18,
        "hint": "시각 스타일이 분명한지"
      },
      {
        "key": "color",
        "label": "색조",
        "weight": 12,
        "hint": "전체적인 색감 경향"
      },
      {
        "key": "negative",
        "label": "네거티브 제약",
        "weight": 14,
        "hint": "어떤 문제를 배제했는지"
      }
    ],
    "video": [
      {
        "key": "subject",
        "label": "피사체와 동작",
        "weight": 22,
        "hint": "무엇을 그리는지, 무슨 일이 일어나는지"
      },
      {
        "key": "shot",
        "label": "샷 사이즈",
        "weight": 13,
        "hint": "어떤 샷 사이즈를 쓰는지"
      },
      {
        "key": "move",
        "label": "카메라 무빙 방식",
        "weight": 15,
        "hint": "카메라가 어떻게 움직이는지"
      },
      {
        "key": "style",
        "label": "영상 스타일",
        "weight": 16,
        "hint": "전체적인 영상 질감"
      },
      {
        "key": "lighting",
        "label": "조명",
        "weight": 12,
        "hint": "빛이 어떤지"
      },
      {
        "key": "audio",
        "label": "사운드와 음악",
        "weight": 10,
        "hint": "들리는 느낌이 어떤지"
      },
      {
        "key": "negative",
        "label": "네거티브 제약",
        "weight": 12,
        "hint": "어떤 문제를 배제했는지"
      }
    ]
  },
  "frameModeLabels": {
    "none": "지정 안 함",
    "text": "텍스트 투 이미지",
    "file": "파일에서 가져오기",
    "prev": "이전 스토리보드의 마지막 프레임 사용"
  },
  "extractPatterns": {
    "image": {
      "hasComposition": "구도|클로즈업|근경|중경|전경|원경|부감|앙각|눈높이|시점|앵글|삼분할|중앙 배치|여백|매크로|항공 촬영|대칭|프레이밍",
      "hasLighting": "빛|조명|역광|측광|소프트 라이트|하드 라이트|네온|황혼|골든아워|분위기|로우키|하이키",
      "hasStyle": "스타일|실사|삽화|애니|2d|3d|렌더|유화|수묵|사이버|필름|픽셀|사진|손그림|콘셉트 아트",
      "hasColor": "색조|색상|배색|난색|한색|흑백|채도|모란디|색감",
      "hasRatio": "\\d+\\s*:\\s*\\d+|정사각형|정방형|세로|가로|와이드|비율|화면비",
      "hasNegative": "없음|없이|금지|제외|빼고|피하|말 것|넣지 마|no "
    },
    "video": {
      "hasAction": "동작|돌아서|걷|달리|날아|손을 들|들어오|들어와|나가|변화|상호 작용|말하|웃|끄덕|바람|흐르",
      "hasShot": "샷|클로즈업|근경|중경|전경|원경|익스트림|카메라|프레이밍",
      "hasMove": "카메라 무빙|푸시인|푸시 인|풀아웃|풀 아웃|팬|틸트|트래킹|오비트|돌리|올라가|내려가|핸드헬드|항공|드론|고정 카메라|롱 테이크|원 테이크|줌",
      "hasStyle": "스타일|시네마틱|다큐|광고|애니|애니메이션|스톱모션|vhs|사이버|실사|질감",
      "hasLighting": "빛|조명|야경|일광|역광|네온|골든아워|노을",
      "hasDuration": "\\d+\\s*초|길이|얼마나|스토리보드|분량|몇 초",
      "hasAudio": "사운드트랙|배경 음악|bgm|환경음|효과음|내레이션|보이스오버|목소리|대사|음성|오디오 트랙|음소거|무음|음악|피아노|첼로|현악|빗소리",
      "hasNegative": "없음|없이|금지|제외|빼고|피하|말 것|넣지 마|no "
    },
    "text": {
      "hasRole": "당신은|너는|역할을 맡|맡아서|로서|으로서|인 척|페르소나|입장에서",
      "hasAudience": "초보자|전문가|독자|대상|청중|어린이|학생|관리자|사용자|고객|위한|대상으로|에게 보여|에게 설명|에게 읽",
      "hasFormat": "형식|테이블|표로|목록|리스트|불릿|markdown|개요|글자 수|자 이내|자 정도|구조|섹션|json|코드 블록|레이아웃|표 형식",
      "hasTone": "어조|말투|톤|문체|유머|격식|캐주얼|진지|전문적|친근|엄격|구어체|딱딱|부드러운 말",
      "hasConstraint": "하지 마|하지마|마세요|금지|피하|반드시|꼭|없이|제외|빼고|안 돼|안돼|필수",
      "hasExample": "예를 들어|예시|예컨대|예를 들면|샘플|참고|다음과 같|이런 식",
      "hasLength": "(\\d+)\\s*자|글자 수|분량|한 페이지|두 페이지|몇 페이지",
      "hasBackground": "배경|왜냐하면|때문에|현재|우리 회사|우리 팀|우리 제품|상황은|목적은|이건|이것은"
    }
  },
  "extractFlags": {
    "video": {
      "hasAudio": "i"
    }
  },
  "detailPatterns": {
    "visualSubject": "한 마리|한 명|한 사람|입고|차림|서서|앉아|누워|엎드려",
    "image": {
      "lighting": "부드러|하드|따뜻|차갑|역광|측광|자연광|스튜디오",
      "style": "스타일|질감|느낌$",
      "color": "난색|한색|채도|그레이 톤|흑백"
    },
    "video": {
      "shot": "샷|카메라",
      "move": "푸시|풀|팬|틸트|트래킹|오비트|항공|돌리",
      "style": "시네마틱|다큐|광고|애니|원 테이크",
      "lighting": "골든아워|야경|역광",
      "audio": "사운드트랙|배경 음악|bgm|환경음|효과음|내레이션|보이스오버|목소리|대사|피아노|첼로|현악|빗소리|오디오 트랙|음소거|무음"
    },
    "text": {
      "task": "도와줘|써 줘|써줘|작성|만들|분석|설계|정리|제시|알려|필요|생성",
      "role": "전문가|시니어|프로",
      "format": "테이블|목록|리스트|개요|json",
      "styleTone": "어조|말투|톤|문체|스타일|격식|구어|유머|엄격|쉬운 말|전문적|친근",
      "styleDepth": "심층|상세|자세|간략|요약|개요|고수준|간결|단계별|확장"
    }
  },
  "detailFlags": {
    "video": {
      "audio": "i"
    }
  }
};

  root.PromptLensLocales = root.PromptLensLocales || {};
  root.PromptLensLocales['ko'] = locale;
  if (typeof module !== 'undefined' && module.exports) module.exports = locale;
})(typeof globalThis !== 'undefined' ? globalThis : this);
