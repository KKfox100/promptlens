'use strict';

/**
 * PromptLens 文案包 · en
 * ------------------------------------------------------------------
 * ⚠️ **这个文件是生成的，不要手改。**
 *    生成器：`node scripts/mk-locale.js en`
 *    译文表：`scripts/i18n-src/en/kb/*.json`
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
  "tag": "en",
  "name": "English",
  "scenarios": [
    {
      "id": "writing",
      "name": "Content writing",
      "icon": "✍️",
      "desc": "Articles, copy, stories, scripts",
      "keywords": [
        "article",
        "write a",
        "writing",
        "copywriting",
        "wechat article",
        "blog",
        "zhihu",
        "xiaohongshu",
        "draft",
        "novel",
        "story",
        "screenplay",
        "script",
        "tweet",
        "wechat moments",
        "essay",
        "news report",
        "advertorial",
        "headline"
      ]
    },
    {
      "id": "coding",
      "name": "Coding",
      "icon": "💻",
      "desc": "Writing code, debugging, refactoring",
      "keywords": [
        "code",
        "function",
        "method",
        "bug",
        "error",
        "exception",
        "refactor",
        "api",
        "endpoint",
        "program",
        "script",
        "sql",
        "database",
        "algorithm",
        "frontend",
        "backend",
        "python",
        "javascript",
        "java",
        "react",
        "vue",
        "golang",
        "deploy",
        "unit test",
        "performance optimization"
      ]
    },
    {
      "id": "analysis",
      "name": "Analysis & research",
      "icon": "📊",
      "desc": "Data, research, judgement",
      "keywords": [
        "analy",
        "data",
        "dashboard",
        "trend",
        "statistics",
        "compare",
        "survey",
        "insight",
        "research",
        "evaluate",
        "estimate",
        "attribution",
        "forecast",
        "industry",
        "market",
        "competitor",
        "metric",
        "conclusion"
      ]
    },
    {
      "id": "marketing",
      "name": "Marketing",
      "icon": "📣",
      "desc": "Promotion, seeding, campaigns",
      "keywords": [
        "marketing",
        "promote",
        "seeding",
        "advertising",
        "media buy",
        "campaign",
        "private domain",
        "conversion",
        "poster",
        "slogan",
        "selling point",
        "live commerce",
        "livestream",
        "user growth",
        "referral",
        "campaign copy",
        "brand"
      ]
    },
    {
      "id": "learning",
      "name": "Teaching",
      "icon": "🎓",
      "desc": "Explaining, learning, plain language",
      "keywords": [
        "explain",
        "explain",
        "teach me",
        "learn",
        "beginner",
        "popular science",
        "course",
        "notes",
        "summarize",
        "plain language",
        "give an example",
        "what is",
        "why",
        "how to understand",
        "walk through",
        "key points",
        "feynman"
      ]
    },
    {
      "id": "business",
      "name": "Workplace",
      "icon": "📈",
      "desc": "Proposals, reports, communication",
      "keywords": [
        "proposal",
        "report to",
        "ppt",
        "proposal",
        "planning",
        "retrospective",
        "email",
        "weekly report",
        "monthly report",
        "okr",
        "goal",
        "meeting",
        "meeting notes",
        "performance review",
        "resume",
        "interview",
        "process",
        "policy",
        "business"
      ]
    },
    {
      "id": "creative",
      "name": "Ideation",
      "icon": "💡",
      "desc": "Ideas, naming, brainstorming",
      "keywords": [
        "creative",
        "idea",
        "brainstorm",
        "naming",
        "naming",
        "name ideas",
        "name",
        "tagline",
        "slogan",
        "ideation",
        "inspiration",
        "concept",
        "concept design",
        "gameplay"
      ]
    },
    {
      "id": "general",
      "name": "General",
      "icon": "🧩",
      "desc": "Anything else",
      "keywords": []
    },
    {
      "id": "image",
      "name": "Image generation",
      "icon": "🎨",
      "desc": "Illustrations, posters, art",
      "keywords": [
        "image",
        "image",
        "illustration",
        "draw a",
        "draw a",
        "paint a",
        "draw an image",
        "generate an image",
        "generate an image",
        "text to image",
        "illustration for",
        "wallpaper",
        "avatar",
        "logo",
        "icon",
        "drawing",
        "painting",
        "render",
        "concept art",
        "concept art",
        "product shot",
        "product photo",
        "poster",
        "cover image",
        "anime art",
        "anime art",
        "photograph",
        "midjourney",
        "stable diffusion",
        "dall-e",
        "dalle",
        "Text to image",
        "Image to image",
        "image reference",
        "retouch",
        "stylized",
        "visual mockup",
        "illustration style",
        "hand drawn",
        "cyberpunk",
        "photorealistic",
        "oil painting",
        "ink wash",
        "film look",
        "Minimal",
        "pixel art",
        "low poly",
        "composition",
        "depth of field",
        "bokeh",
        "Close-up",
        "macro",
        "top-down",
        "low angle",
        "golden hour",
        "color tone",
        "atmosphere",
        "texture",
        "lighting",
        "lighting setup",
        "blurred background"
      ]
    },
    {
      "id": "video",
      "name": "Video generation",
      "icon": "🎬",
      "desc": "Short films, camera moves, storyboards",
      "keywords": [
        "video",
        "short video",
        "short film",
        "camera movement",
        "camera movement",
        "Video generation",
        "storyboard",
        "transition",
        "video script",
        "multiple shots",
        "shot change",
        "cut between shots",
        "continuous shot",
        "promo video",
        "ad film",
        "short film",
        "one take",
        "video footage",
        "b-roll",
        "mv",
        "sora",
        "runway",
        "kling",
        "jimeng",
        "pika",
        "veo",
        "text to video",
        "image to video",
        "shoot a",
        "shoot a",
        "shoot a",
        "filming",
        "timelapse",
        "slow motion",
        "slow motion",
        "stop motion",
        "walking",
        "running",
        "flying over",
        "falling",
        "push in",
        "pull out",
        "camera pan",
        "tracking shot",
        "voiceover",
        "soundtrack",
        "sound effect",
        "transition"
      ]
    }
  ],
  "questions": {
    "intent": {
      "id": "intent",
      "dim": "task",
      "title": "The core ask",
      "question": "What is the one thing you want the AI to do for you?",
      "helper": "Pick the closest one. If you are unsure, that is fine — you can change it in any later round.",
      "multi": false,
      "perScenario": {
        "writing": [
          {
            "id": "write.create",
            "label": "Write from scratch",
            "hint": "Original content",
            "fragment": "The goal is a complete piece of original content produced from scratch, not just an outline or a set of ideas."
          },
          {
            "id": "write.rewrite",
            "label": "Rewrite and polish",
            "hint": "Same meaning, better wording",
            "fragment": "Rewrite while fully preserving the original meaning and every information point, raising the quality of the writing. Do not introduce facts I have not confirmed."
          },
          {
            "id": "write.expand",
            "label": "Expand and deepen",
            "hint": "Flesh out the thin parts",
            "fragment": "Expand on the existing content: add detail, examples and argument, and develop the sketchy parts properly. Do not start over from scratch."
          },
          {
            "id": "write.shorten",
            "label": "Tighten and distill",
            "hint": "Cut half, read better",
            "fragment": "Compress the length, keep the core message and the key details, and delete repetition, padding and filler."
          },
          {
            "id": "write.outline",
            "label": "Build the outline",
            "hint": "Skeleton first",
            "fragment": "Produce only the structural outline and the key points of each section. Do not write it out in full."
          }
        ],
        "coding": [
          {
            "id": "code.build",
            "label": "Implement from scratch",
            "hint": "Code I can actually run",
            "fragment": "Give me a complete implementation I can run directly — not pseudocode, not an illustrative fragment."
          },
          {
            "id": "code.debug",
            "label": "Diagnose and fix",
            "hint": "Find the real problem",
            "fragment": "Locate the root cause and give me a fix, explaining why it breaks — not just the corrected code."
          },
          {
            "id": "code.refactor",
            "label": "Refactor",
            "hint": "Cleaner structure",
            "fragment": "Refactor without changing external behaviour, improving readability, maintainability and extensibility."
          },
          {
            "id": "code.review",
            "label": "Code review",
            "hint": "Find the flaws",
            "fragment": "Review this strictly and list the problems one by one, ordered by severity, each with its risk and a suggested change."
          },
          {
            "id": "code.explain",
            "label": "Explain this code",
            "hint": "I do not follow it",
            "fragment": "Explain how this code runs and why it was designed this way, focusing on the parts that are easy to misread."
          },
          {
            "id": "code.test",
            "label": "Write tests",
            "hint": "Cover the edges",
            "fragment": "Write test cases that cover the happy path, the boundary conditions and invalid input."
          }
        ],
        "analysis": [
          {
            "id": "an.insight",
            "label": "Find insights in data",
            "hint": "What the data says",
            "fragment": "Draw out the insights that matter, point out anything counter-intuitive, and state how reliable the conclusions are and where they stop holding."
          },
          {
            "id": "an.compare",
            "label": "Compare options",
            "hint": "Help me choose",
            "fragment": "Compare the options side by side, spell out when each one applies and what it costs, then finish with a recommendation and the reasoning behind it."
          },
          {
            "id": "an.research",
            "label": "Research a topic",
            "hint": "Get the full picture",
            "fragment": "Give me a systematic overview of the topic: the current state, the main players, the key variables and what is still uncertain."
          },
          {
            "id": "an.diagnose",
            "label": "Causal analysis",
            "hint": "Why is this happening",
            "fragment": "Run a causal analysis that separates correlated factors from the ones actually driving the outcome, and explain how you can tell them apart."
          },
          {
            "id": "an.forecast",
            "label": "Read the trend",
            "hint": "What happens next",
            "fragment": "Give me a read on where this is heading and the reasoning behind it, clearly separating fact, reasonable inference and guesswork."
          }
        ],
        "marketing": [
          {
            "id": "mk.idea",
            "label": "Creative directions",
            "hint": "Ideas first",
            "fragment": "Give me several distinct creative directions; for each one state the core claim, the audience, and the hook that makes it stick."
          },
          {
            "id": "mk.copy",
            "label": "Promo copy",
            "hint": "Ready to publish",
            "fragment": "Produce promo copy I can use as-is, written to fit the tone of the target platform and free of self-congratulatory filler."
          },
          {
            "id": "mk.title",
            "label": "Sharpen the headline",
            "hint": "Raise the click rate",
            "fragment": "Give me several headline options that come at it from different emotional angles, and note who each one suits and what it risks."
          },
          {
            "id": "mk.persona",
            "label": "Audience profile",
            "hint": "Know who it is for",
            "fragment": "Build a profile of the target audience: the real situations they are in, their core pain points, what holds them back from deciding, and where they get their information."
          },
          {
            "id": "mk.campaign",
            "label": "Campaign plan",
            "hint": "A complete plan",
            "fragment": "Give me a campaign plan that can actually be run: the mechanic, the path it spreads along, the conversion hook, and how the result gets measured."
          }
        ],
        "learning": [
          {
            "id": "ln.explain",
            "label": "Explain a concept",
            "hint": "I want to really get it",
            "fragment": "Explain this concept until I genuinely understand it — start from intuition, then move to the rigorous version."
          },
          {
            "id": "ln.path",
            "label": "Plan a learning path",
            "hint": "What order should I learn in",
            "fragment": "Give me a step-by-step learning path, marking the focus, the milestones and the usual traps at each stage."
          },
          {
            "id": "ln.note",
            "label": "Turn it into notes",
            "hint": "Easy to review",
            "fragment": "Organize this into a note structure that is easy to review, foregrounding the main line of reasoning and the points that are easy to forget."
          },
          {
            "id": "ln.quiz",
            "label": "Quiz me",
            "hint": "Test what I know",
            "fragment": "Set questions that genuinely test my understanding, with enough range to separate real knowledge from guessing, and give the answers and explanations at the end."
          },
          {
            "id": "ln.summary",
            "label": "Summarize a document",
            "hint": "Get to the point",
            "fragment": "Distil the core of this material, keeping the author's own line of argument. Do not mix in your own evaluation."
          }
        ],
        "business": [
          {
            "id": "bz.proposal",
            "label": "Write a proposal",
            "hint": "It has to get approved",
            "fragment": "Produce a properly structured proposal whose logic survives a decision-maker's follow-up questions, with the value, the cost and the feasibility all made clear."
          },
          {
            "id": "bz.report",
            "label": "Prepare a briefing",
            "hint": "Present it upward",
            "fragment": "Organize this for a reporting setting: conclusion first, evidence trimmed, so I can get it across in limited time."
          },
          {
            "id": "bz.review",
            "label": "Retrospective",
            "hint": "What worked, what did not",
            "fragment": "Run a retrospective that separates what was within our control from what was not, and point out which practices are worth turning into a process."
          },
          {
            "id": "bz.mail",
            "label": "Draft a message",
            "hint": "Say it clearly",
            "fragment": "Draft the message so that the ask, the background and the next step are all clear, in a tone that is appropriate but takes a clear position."
          },
          {
            "id": "bz.breakdown",
            "label": "Break down the goal",
            "hint": "Make it actionable",
            "fragment": "Break the goal into executable tasks with clear priorities, dependencies and acceptance criteria."
          }
        ],
        "creative": [
          {
            "id": "cr.brainstorm",
            "label": "brainstorm",
            "hint": "The more the better",
            "fragment": "Brainstorm divergently — quantity first, and the ideas should differ clearly from one another rather than being variations on a single thought."
          },
          {
            "id": "cr.naming",
            "label": "Naming / taglines",
            "hint": "Something that rolls off the tongue",
            "fragment": "Give me several naming options across different stylistic directions, explaining what each one means and where it fits."
          },
          {
            "id": "cr.story",
            "label": "Story outline",
            "hint": "Characters and conflict",
            "fragment": "Build a story framework with a clear central conflict, character motivation and emotional arc."
          },
          {
            "id": "cr.concept",
            "label": "Visual concept",
            "hint": "Describe the image",
            "fragment": "Give me a concept description with real visual presence: subject, mood, color direction and the key visual elements."
          }
        ],
        "general": [
          {
            "id": "gn.organize",
            "label": "Organize information",
            "hint": "Make the mess readable",
            "fragment": "Reorganize this into a clear structure of categories, cutting redundancy while keeping the key details."
          },
          {
            "id": "gn.generate",
            "label": "Generate content",
            "hint": "Just give me the result",
            "fragment": "Produce finished, usable content directly — not just ideas or a framework."
          },
          {
            "id": "gn.judge",
            "label": "Analyse and judge",
            "hint": "Give me a conclusion",
            "fragment": "Give me a clear judgement, and state the key reasons behind it and the conditions it depends on."
          },
          {
            "id": "gn.solve",
            "label": "Solve a problem",
            "hint": "How do we make this work",
            "fragment": "Give me a concrete path to solving this, naming the bottlenecks and how to get past them."
          },
          {
            "id": "gn.decide",
            "label": "Make a decision",
            "hint": "Which one should I pick",
            "fragment": "Help me decide: name the option you recommend, and say what would have to change for a different choice to become the right one."
          }
        ],
        "image": [
          {
            "id": "im.intent.poster",
            "label": "Poster / ad image",
            "hint": "Needs a focal point and breathing room",
            "fragment": "Commercial poster use: the frame needs a clear focal point, and the composition must leave space for headline text"
          },
          {
            "id": "im.intent.social",
            "label": "Social media image",
            "hint": "Has to stop the scroll",
            "fragment": "Social media use: it has to catch the eye at first glance inside a feed"
          },
          {
            "id": "im.intent.product",
            "label": "Product shot",
            "hint": "Make the product look good",
            "fragment": "Product showcase use: the appearance, material and details need to read clearly"
          },
          {
            "id": "im.intent.character",
            "label": "Portrait / character",
            "hint": "Accurate proportions",
            "fragment": "Character design use: clear facial features, accurate body proportions, natural pose"
          },
          {
            "id": "im.intent.concept",
            "label": "Concept exploration",
            "hint": "Feel free to be bold",
            "fragment": "For concept exploration — feel free to push it, it does not need to be fully realistic"
          },
          {
            "id": "im.intent.art",
            "label": "Illustration / artwork",
            "hint": "Stylized expression",
            "fragment": "Artistic use: stylized expression and a personal visual language are encouraged"
          },
          {
            "id": "im.intent.scene",
            "label": "Scene / worldbuilding",
            "hint": "The environment leads",
            "fragment": "Scene design use: the emphasis is on atmosphere, depth in the space, and a world that feels believable"
          }
        ],
        "video": [
          {
            "id": "vd.intent.ad",
            "label": "Ad / promo film",
            "hint": "Premium feel",
            "fragment": "Advertising use: the footage needs a commercial-grade feel and a clear message"
          },
          {
            "id": "vd.intent.short",
            "label": "Short video / social",
            "hint": "Hook them in the first 3 seconds",
            "fragment": "Short video use: the first three seconds must grab attention, and the pace has to stay tight"
          },
          {
            "id": "vd.intent.story",
            "label": "Story / short film",
            "hint": "Emotion and narrative",
            "fragment": "Narrative use: a clear emotional arc and deliberate camera language"
          },
          {
            "id": "vd.intent.anim",
            "label": "Animation / anime",
            "hint": "Anime look",
            "fragment": "Animated style: clean linework and a consistent drawing style"
          },
          {
            "id": "vd.intent.product",
            "label": "Product in motion",
            "hint": "Bring the product to life",
            "fragment": "Product showcase use: the form, the material and the context of use all need to be presented"
          },
          {
            "id": "vd.intent.mood",
            "label": "Mood / b-roll",
            "hint": "No subject needed",
            "fragment": "Atmosphere footage use: the focus is movement in the environment, shifting light and mood — no human subject required"
          }
        ]
      }
    },
    "role": {
      "id": "role",
      "dim": "role",
      "title": "Role",
      "question": "Who should the AI be when it answers you?",
      "helper": "The role sets its standards, its way of speaking and what it pays attention to. This is the single step that moves answer quality the most.",
      "multi": false,
      "options": [
        {
          "id": "role.expert",
          "label": "Seasoned domain expert",
          "hint": "Someone who has done the work",
          "fragment": "You are a senior expert with more than ten years of hands-on experience in this field. You combine systematic judgement with concrete, actionable steps.",
          "followUps": [
            "role.stance"
          ]
        },
        {
          "id": "role.critic",
          "label": "Strict reviewer",
          "hint": "Finds the flaws, no flattery",
          "fragment": "You are a notoriously demanding professional reviewer. Your job is to find problems, not to make me comfortable — better sharp than polite.",
          "followUps": [
            "role.stance"
          ]
        },
        {
          "id": "role.doer",
          "label": "Pragmatic operator",
          "hint": "Only cares whether it works",
          "fragment": "You are a hands-on operator who cares about one thing: whether it can be done, exactly how, and at what cost. You do not deal in abstractions.",
          "followUps": [
            "role.stance"
          ]
        },
        {
          "id": "role.coach",
          "label": "Patient coach",
          "hint": "Walks me through it",
          "fragment": "You are a patient coach. You break complex problems into steps I can act on right away, and you warn me in advance about the places people usually trip.",
          "followUps": [
            "role.stance"
          ]
        },
        {
          "id": "role.researcher",
          "label": "Neutral researcher",
          "hint": "Evidence only, no side-taking",
          "fragment": "You are a neutral, objective researcher. You speak only from reliable evidence, hold no prior position, and where the evidence is thin you say plainly that it is uncertain.",
          "followUps": [
            "role.stance"
          ]
        },
        {
          "id": "role.user",
          "label": "Be the target user",
          "hint": "Think from their position",
          "fragment": "Think from inside the real situation of the target user: what they know, what actually worries them, how they would really use this — rather than giving advice from the sidelines.",
          "followUps": [
            "role.stance"
          ]
        },
        {
          "id": "role.beginner",
          "label": "Total beginner",
          "hint": "Ask like an outsider",
          "fragment": "Respond as someone new to this: stop and ask whenever a term is unfamiliar, never pretend to understand, and never let a leap in logic pass.",
          "followUps": [
            "role.stance"
          ]
        }
      ]
    },
    "role.stance": {
      "id": "role.stance",
      "dim": "role",
      "title": "Stance",
      "question": "What stance should it take?",
      "helper": "The same role can be delivered with a completely different touch.",
      "multi": false,
      "options": [
        {
          "id": "stance.honest",
          "label": "Say the hard thing",
          "hint": "Pour cold water if it is needed",
          "fragment": "If my idea has a problem, say so directly. Do not soften it just to spare my feelings."
        },
        {
          "id": "stance.balanced",
          "label": "Neutral",
          "hint": "Both sides, plainly",
          "fragment": "Present both the pros and the cons objectively. Do not inflate the upside to please me."
        },
        {
          "id": "stance.supportive",
          "label": "Constructive",
          "hint": "Affirm, then improve",
          "fragment": "Express it constructively: say what works first, then what could be better."
        },
        {
          "id": "stance.challenge",
          "label": "Push back",
          "hint": "Challenge me",
          "fragment": "Challenge my assumptions on your own initiative and point out the blind spots I may have missed, even though I did not ask you to."
        }
      ]
    },
    "audience": {
      "id": "audience",
      "dim": "context",
      "title": "Audience",
      "question": "Who is this ultimately for?",
      "helper": "The same content, written for different people, needs a different approach and a different depth.",
      "multi": false,
      "options": [
        {
          "id": "aud.public",
          "label": "Complete beginners",
          "hint": "No background at all",
          "fragment": "The audience has no relevant background. Every technical term must be explained in everyday language the first time it appears.",
          "followUps": [
            "audience.term"
          ]
        },
        {
          "id": "aud.peer",
          "label": "Peers / professionals",
          "hint": "Go deep",
          "fragment": "The audience are peers with the same professional background. Use technical terms and industry conventions directly, with no explainer preamble.",
          "followUps": [
            "audience.term"
          ]
        },
        {
          "id": "aud.decision",
          "label": "Decision-makers",
          "hint": "Conclusions and costs",
          "fragment": "The audience are managers who have to decide. Their time is short, and what matters to them is the conclusion, the cost, the risk and what needs their sign-off.",
          "followUps": [
            "audience.term"
          ]
        },
        {
          "id": "aud.client",
          "label": "Clients",
          "hint": "Professional but easy to follow",
          "fragment": "The audience is the client. It has to come across as professional and credible without making them work to understand it.",
          "followUps": [
            "audience.term"
          ]
        },
        {
          "id": "aud.student",
          "label": "Students / beginners",
          "hint": "Mind the learning curve",
          "fragment": "The audience is learning. Go from shallow to deep, use examples and contrasts, and do not throw too many concepts at them at once.",
          "followUps": [
            "audience.term"
          ]
        },
        {
          "id": "aud.self",
          "label": "Just me",
          "hint": "Internal draft, skip the pleasantries",
          "fragment": "This is a working draft for myself. No courtesy padding is needed — the higher the information density, the better.",
          "followUps": [
            "audience.term"
          ]
        }
      ]
    },
    "audience.term": {
      "id": "audience.term",
      "dim": "context",
      "title": "Technical terms",
      "question": "What should happen when a technical term comes up?",
      "helper": "This is what decides whether it reads as distant or not.",
      "multi": false,
      "options": [
        {
          "id": "term.explain",
          "label": "Explain on first use",
          "hint": "One plain sentence",
          "fragment": "When a technical term first appears, give a one-sentence plain explanation. After that it can be used freely."
        },
        {
          "id": "term.direct",
          "label": "Use them directly",
          "hint": "The reader knows them",
          "fragment": "Technical terms can be used directly with no extra explanation, which saves space."
        },
        {
          "id": "term.bilingual",
          "label": "Term plus plain gloss",
          "hint": "Gloss it in plain words",
          "fragment": "For key terms, give the term followed by a short plain-language gloss the first time it appears."
        },
        {
          "id": "term.avoid",
          "label": "Avoid them",
          "hint": "Plain words throughout",
          "fragment": "Avoid technical terms wherever possible. Where one cannot be replaced, explain it with an everyday analogy."
        }
      ]
    },
    "format": {
      "id": "format",
      "dim": "format",
      "title": "Output form",
      "question": "What should the finished thing look like?",
      "helper": "This is the most easily overlooked step and the one that affects the result most. Pick the wrong form and even good content ends up unusable.",
      "multi": false,
      "options": [
        {
          "id": "fmt.report",
          "label": "Structured report",
          "hint": "Sections and a conclusion",
          "fragment": "Output a structured report, divided into sections with Markdown level-2 headings and a clear hierarchy.",
          "followUps": [
            "format.report.length",
            "format.report.structure"
          ]
        },
        {
          "id": "fmt.checklist",
          "label": "Step-by-step checklist",
          "hint": "Just follow it",
          "fragment": "Output numbered steps, each one an action that can be carried out directly.",
          "followUps": [
            "format.checklist.granularity"
          ]
        },
        {
          "id": "fmt.dialogue",
          "label": "Plain talk, like a conversation",
          "hint": "No subheadings or lists",
          "fragment": "Answer in flowing natural paragraphs, the way you would talk face to face. Do not use subheadings, bullet points or numbered lists.",
          "followUps": [
            "format.dialogue.length"
          ]
        },
        {
          "id": "fmt.table",
          "label": "Comparison table",
          "hint": "See the differences at a glance",
          "fragment": "Present the comparison as a Markdown table so the options can be read side by side.",
          "followUps": [
            "format.table.dimension"
          ]
        },
        {
          "id": "fmt.article",
          "label": "Full-length article",
          "hint": "Ready to publish",
          "fragment": "Output a complete, structured piece that can be published as-is, with nothing left for me to fill in.",
          "followUps": [
            "format.article.length",
            "format.article.structure"
          ]
        },
        {
          "id": "fmt.code",
          "label": "Code + explanation",
          "hint": "It has to run",
          "fragment": "Output complete, runnable code with the necessary comments at the key points.",
          "followUps": [
            "format.code.language",
            "format.code.comments"
          ]
        },
        {
          "id": "fmt.outline",
          "label": "Outline / mind map",
          "hint": "Skeleton only",
          "fragment": "Output only a clearly tiered outline, using nested lists for the relationships. Do not expand anything into full sentences.",
          "followUps": [
            "format.outline.depth"
          ]
        },
        {
          "id": "fmt.message",
          "label": "Email / message",
          "hint": "Ready to send",
          "fragment": "Output a complete message body that can be sent as-is, with an appropriate greeting and sign-off.",
          "followUps": [
            "format.message.tone"
          ]
        },
        {
          "id": "fmt.slides",
          "label": "Slide outline",
          "hint": "One point per slide",
          "fragment": "Organize the content slide by slide, with a title and three to five short points on each.",
          "followUps": [
            "format.slides.count"
          ]
        }
      ]
    },
    "format.report.length": {
      "id": "format.report.length",
      "dim": "format",
      "title": "Report length",
      "question": "Roughly how long should the report be?",
      "multi": false,
      "options": [
        {
          "id": "rlen.short",
          "label": "Short · under a page",
          "hint": "Conclusion and key evidence only",
          "fragment": "Keep the whole thing under 800 words, with only the conclusion and the two or three pieces of evidence that matter most."
        },
        {
          "id": "rlen.mid",
          "label": "Standard · two to three pages",
          "hint": "Complete evidence, no padding",
          "fragment": "Around 1200-1800 words, with complete evidence where every sentence carries information."
        },
        {
          "id": "rlen.long",
          "label": "Detailed · five pages or more",
          "hint": "Background, reasoning and risk, all covered",
          "fragment": "At least 2500 words, covering the background, the analysis, the reasoning, the risks and the recommendations."
        }
      ]
    },
    "format.report.structure": {
      "id": "format.report.structure",
      "dim": "format",
      "title": "What the report must contain",
      "question": "Which parts must the report include?",
      "helper": "You can pick more than one.",
      "multi": true,
      "options": [
        {
          "id": "rstr.conclusion",
          "label": "Conclusion first",
          "hint": "Verdict up front",
          "fragment": "Open with a short summary of the conclusion, so the reader knows the core judgement within three seconds."
        },
        {
          "id": "rstr.evidence",
          "label": "Points with evidence",
          "hint": "Every claim backed",
          "fragment": "Every claim must be followed by specific evidence, data or an example. No claim without support."
        },
        {
          "id": "rstr.table",
          "label": "Data tables",
          "hint": "Put the numbers in a table",
          "fragment": "Present the key figures in tables, with clear headers and units."
        },
        {
          "id": "rstr.risk",
          "label": "Risks and the other side",
          "hint": "Say where it could go wrong",
          "fragment": "Give risks, opposing views and the conditions that would overturn the conclusion their own dedicated section."
        },
        {
          "id": "rstr.action",
          "label": "Action list",
          "hint": "End with next steps",
          "fragment": "End with an actionable list, each item marked with the role responsible and its priority."
        },
        {
          "id": "rstr.open",
          "label": "Open questions",
          "hint": "List what still needs my call",
          "fragment": "Finish with the questions that still need my confirmation or more information. Do not assume an answer on my behalf."
        }
      ]
    },
    "format.checklist.granularity": {
      "id": "format.checklist.granularity",
      "dim": "format",
      "title": "Step granularity",
      "question": "How finely should the steps be broken down?",
      "multi": false,
      "options": [
        {
          "id": "cgran.coarse",
          "label": "Coarse · 3-5 steps",
          "hint": "The main trunk",
          "fragment": "Break the process into three to five major steps, each described by a single sentence stating its goal."
        },
        {
          "id": "cgran.medium",
          "label": "Medium · each step explained",
          "hint": "Enough to follow",
          "fragment": "Under each step, add three things: what to do, how to do it, and what it looks like when it is done."
        },
        {
          "id": "cgran.fine",
          "label": "Fine · tick-off items",
          "hint": "Detailed enough to need no thought",
          "fragment": "Break each step into atomic actions that can be ticked off directly, including the specific tools, settings or wording."
        }
      ]
    },
    "format.dialogue.length": {
      "id": "format.dialogue.length",
      "dim": "format",
      "title": "Answer length",
      "question": "How long should the answer be?",
      "multi": false,
      "options": [
        {
          "id": "dlen.short",
          "label": "A few sentences",
          "hint": "No wind-up",
          "fragment": "Keep the whole answer under 200 words. Get straight to the point with no preamble."
        },
        {
          "id": "dlen.mid",
          "label": "One or two paragraphs",
          "hint": "Just enough to land it",
          "fragment": "Say it in one or two paragraphs, somewhere between 300 and 500 words."
        },
        {
          "id": "dlen.long",
          "label": "Open it up",
          "hint": "A few layers deeper",
          "fragment": "Feel free to go a few layers deeper, but keep it in natural paragraphs rather than turning it into a list."
        }
      ]
    },
    "format.table.dimension": {
      "id": "format.table.dimension",
      "dim": "format",
      "title": "Comparison dimensions",
      "question": "Which dimensions should the table compare?",
      "multi": true,
      "options": [
        {
          "id": "tdim.core",
          "label": "Core traits",
          "hint": "What each one is",
          "fragment": "The table must include a Core traits column, summarised in one sentence."
        },
        {
          "id": "tdim.pro",
          "label": "Strengths",
          "hint": "Where it wins",
          "fragment": "The table must include a Strengths column."
        },
        {
          "id": "tdim.con",
          "label": "Limits / cost",
          "hint": "Where it falls short",
          "fragment": "The table must include a Limits or cost column. Be honest in it — do not leave it blank."
        },
        {
          "id": "tdim.scene",
          "label": "When to use it",
          "hint": "When it fits",
          "fragment": "The table must include a When to use it column, stating the conditions under which it is the right choice."
        },
        {
          "id": "tdim.cost",
          "label": "Cost / barrier",
          "hint": "What it takes",
          "fragment": "The table must include a Cost or barrier column covering time, money and learning effort."
        },
        {
          "id": "tdim.verdict",
          "label": "My recommendation",
          "hint": "Verdict in the last column",
          "fragment": "The final column gives a Recommendation, stating plainly whether it is advised or not."
        }
      ]
    },
    "format.article.length": {
      "id": "format.article.length",
      "dim": "format",
      "title": "Article length",
      "question": "Roughly how long should the article be?",
      "multi": false,
      "options": [
        {
          "id": "alen.short",
          "label": "Short · around 800 words",
          "hint": "One idea, fully developed",
          "fragment": "About 800 words, built around a single core idea."
        },
        {
          "id": "alen.mid",
          "label": "Medium · 1500-2000 words",
          "hint": "Standard article length",
          "fragment": "About 1500-2000 words, with a complete arc: setup, development, turn and resolution."
        },
        {
          "id": "alen.long",
          "label": "Long · 3000 words or more",
          "hint": "Deep content",
          "fragment": "At least 3000 words, with an argument that builds layer by layer and plenty of concrete examples."
        }
      ]
    },
    "format.article.structure": {
      "id": "format.article.structure",
      "dim": "format",
      "title": "Article structure",
      "question": "What structure should the article use?",
      "multi": false,
      "options": [
        {
          "id": "astr.hook",
          "label": "Hook → develop → land",
          "hint": "Built to spread",
          "fragment": "Open with a concrete scene, a counter-intuitive fact or a sharp question to catch the reader. Develop the argument in the middle, then bring it back to the theme at the end."
        },
        {
          "id": "astr.story",
          "label": "One story throughout",
          "hint": "Threaded through a single case",
          "fragment": "Carry the whole piece on one story or case, folding the ideas into the narrative instead of writing a treatise."
        },
        {
          "id": "astr.list",
          "label": "Parallel sections",
          "hint": "Clearly organised",
          "fragment": "Organize the piece into parallel sections, each standing on its own so a reader can skip around."
        },
        {
          "id": "astr.q",
          "label": "Question-driven",
          "hint": "Keep asking",
          "fragment": "Drive the piece with a run of questions: each answer raises the next, building a step-by-step rhythm."
        }
      ]
    },
    "format.code.language": {
      "id": "format.code.language",
      "dim": "format",
      "title": "Language / stack",
      "question": "Which language or stack?",
      "multi": false,
      "options": [
        {
          "id": "clang.unspecified",
          "label": "You did not say — let the AI pick",
          "hint": "It will pick the most common one",
          "fragment": "When the stack is not specified, choose the most mainstream option with the best community support, and explain your choice at the start."
        },
        {
          "id": "clang.python",
          "label": "Python",
          "hint": "",
          "fragment": "Implement this in Python, following PEP 8."
        },
        {
          "id": "clang.js",
          "label": "JavaScript / TypeScript",
          "hint": "",
          "fragment": "Implement this in JavaScript or TypeScript, following modern ES conventions."
        },
        {
          "id": "clang.other",
          "label": "Other (I will specify)",
          "hint": "",
          "fragment": ""
        }
      ]
    },
    "format.code.comments": {
      "id": "format.code.comments",
      "dim": "format",
      "title": "How the code is explained",
      "question": "How should the code be explained to you?",
      "multi": false,
      "options": [
        {
          "id": "ccmt.inline",
          "label": "Comments at the key points",
          "hint": "The code should speak for itself",
          "fragment": "Add inline comments at the key logic explaining why it is written this way, not what the line does."
        },
        {
          "id": "ccmt.after",
          "label": "Explanation after the code",
          "hint": "Talk through the approach",
          "fragment": "After the code, add a separate passage explaining the overall approach, the key trade-offs and the likely pitfalls."
        },
        {
          "id": "ccmt.both",
          "label": "Both",
          "hint": "Comments and explanation",
          "fragment": "Add inline comments at the key points, and a passage after the code explaining the overall approach."
        },
        {
          "id": "ccmt.none",
          "label": "Code only",
          "hint": "I will read it myself",
          "fragment": "Output only the code, with no extra explanation."
        }
      ]
    },
    "format.outline.depth": {
      "id": "format.outline.depth",
      "dim": "format",
      "title": "Outline depth",
      "question": "How many levels should the outline go to?",
      "multi": false,
      "options": [
        {
          "id": "odep.two",
          "label": "Two levels is enough",
          "hint": "Sections + points",
          "fragment": "Two levels is enough; the second level should be phrases rather than full sentences."
        },
        {
          "id": "odep.three",
          "label": "Three levels",
          "hint": "Down to the sub-points",
          "fragment": "Three levels, with the third specific enough to start writing from directly."
        },
        {
          "id": "odep.withNote",
          "label": "Three levels + what each section covers",
          "hint": "With writing notes",
          "fragment": "On top of the tiered outline, add one sentence per section saying what it covers and what material it draws on."
        }
      ]
    },
    "format.message.tone": {
      "id": "format.message.tone",
      "dim": "format",
      "title": "What the message is for",
      "question": "What is this message trying to do?",
      "multi": false,
      "options": [
        {
          "id": "mtone.push",
          "label": "Move things forward",
          "hint": "Get them to act",
          "fragment": "The purpose is to get something done. The ending must give a clear next step and a time expectation."
        },
        {
          "id": "mtone.explain",
          "label": "Share information",
          "hint": "Keep them informed",
          "fragment": "The purpose is to share information. The focus is on making the background, the current state and the impact clear. No immediate reply is needed."
        },
        {
          "id": "mtone.negotiate",
          "label": "Ask for resources / negotiate",
          "hint": "Persuade them",
          "fragment": "The purpose is to win support. Explain what they get out of it first, then make the ask."
        },
        {
          "id": "mtone.apologize",
          "label": "Explain a problem / apologise",
          "hint": "Handle bad news",
          "fragment": "The purpose is to handle a bad situation. Take responsibility first, explain where things stand, then offer a remedy. Do not make excuses."
        }
      ]
    },
    "format.slides.count": {
      "id": "format.slides.count",
      "dim": "format",
      "title": "Page count",
      "question": "Roughly how many pages?",
      "multi": false,
      "options": [
        {
          "id": "scnt.short",
          "label": "5-8 pages",
          "hint": "Short briefing",
          "fragment": "Keep it to five to eight pages, with one point per page."
        },
        {
          "id": "scnt.mid",
          "label": "10-15 pages",
          "hint": "Standard proposal",
          "fragment": "Ten to fifteen pages, with a complete background, proposal, supporting material and conclusion."
        },
        {
          "id": "scnt.long",
          "label": "20+ pages",
          "hint": "Full proposal",
          "fragment": "Twenty pages or more, including the detailed argument, the supporting data and an appendix."
        }
      ]
    },
    "tone": {
      "id": "tone",
      "dim": "style",
      "title": "Tone",
      "question": "What tone should it use with you?",
      "helper": "Tone decides whether this reads like a person talking — and it is where AI-speak concentrates most.",
      "multi": false,
      "options": [
        {
          "id": "tone.pro",
          "label": "Professional and precise",
          "hint": "Measured and exact",
          "fragment": "Professional and precise in tone, with exact and restrained wording. Avoid emotional language and exaggeration."
        },
        {
          "id": "tone.warm",
          "label": "Warm and natural",
          "hint": "Like talking to a friend",
          "fragment": "Warm and natural, the way friends talk. Colloquial phrasing and a degree of emotion are fine."
        },
        {
          "id": "tone.sharp",
          "label": "Blunt and sharp",
          "hint": "No beating around the bush",
          "fragment": "Blunt and sharp. Get to the point, skip the pleasantries, and make the call where a call is needed."
        },
        {
          "id": "tone.humor",
          "label": "Light and funny",
          "hint": "Worth a smile",
          "fragment": "Light and humorous. Analogies and jokes are welcome to lower the barrier, but never sacrifice substance for the laugh."
        },
        {
          "id": "tone.calm",
          "label": "Cool and objective",
          "hint": "No emotional colouring",
          "fragment": "Cool and objective. State facts and reasoning only, with no emotional slant."
        },
        {
          "id": "tone.vivid",
          "label": "Evocative",
          "hint": "Make them see it",
          "fragment": "Write evocatively, using concrete images and detail so the reader can see what you describe."
        }
      ]
    },
    "depth": {
      "id": "depth",
      "dim": "style",
      "title": "Level of detail",
      "question": "How deep should it go?",
      "helper": "Depth decides whether the result is usable as-is — if you want a conclusion, do not ask for a dissertation.",
      "multi": false,
      "options": [
        {
          "id": "depth.min",
          "label": "Minimal",
          "hint": "Just the conclusion",
          "fragment": "Give only the conclusion and the minimum necessary explanation. Do not lay out the reasoning.",
          "followUps": [
            "depth.why"
          ]
        },
        {
          "id": "depth.light",
          "label": "Concise",
          "hint": "Conclusion + key reasons",
          "fragment": "Give the conclusion with the two or three reasons that matter most. Omit the rest.",
          "followUps": [
            "depth.why"
          ]
        },
        {
          "id": "depth.mid",
          "label": "Moderate",
          "hint": "Full argument",
          "fragment": "Lay out the complete argument, with both the claims and the evidence behind them.",
          "followUps": [
            "depth.why"
          ]
        },
        {
          "id": "depth.deep",
          "label": "In depth",
          "hint": "Reasoning, limits, counterexamples",
          "fragment": "Go deep: the derivation, where it stops applying, counterexamples, and what remains uncertain.",
          "followUps": [
            "depth.why"
          ]
        }
      ]
    },
    "depth.why": {
      "id": "depth.why",
      "dim": "style",
      "title": "Explain the why?",
      "question": "Should it explain why?",
      "multi": false,
      "options": [
        {
          "id": "why.no",
          "label": "No, just the answer",
          "hint": "I only want the result",
          "fragment": "No need to explain the reasoning. Give the answer directly."
        },
        {
          "id": "why.key",
          "label": "Only the crucial step",
          "hint": "Just enough",
          "fragment": "Explain the reason only at the step that matters most or is easiest to misread. Skip the rest."
        },
        {
          "id": "why.full",
          "label": "Yes, thoroughly",
          "hint": "I want the method",
          "fragment": "Explain the underlying principle and the full chain of reasoning, so that I come away with the method and not just the answer."
        }
      ]
    },
    "constraints": {
      "id": "constraints",
      "dim": "constraint",
      "title": "Hard constraints",
      "question": "What must never happen, and what must always hold?",
      "helper": "Pick as many as you like, or none at all. These are the guardrails that keep the AI on track.",
      "multi": true,
      "optional": true,
      "options": [
        {
          "id": "con.nogreet",
          "label": "No preamble or pleasantries",
          "hint": "Skip the \"great question\"",
          "fragment": "No preamble, no pleasantries, no restating my question. Start straight in."
        },
        {
          "id": "con.norepeat",
          "label": "Do not restate my question",
          "hint": "Just answer it",
          "fragment": "Do not repeat or rephrase my question. Go straight to the answer."
        },
        {
          "id": "con.nohallucinate",
          "label": "Say when you are unsure",
          "hint": "Do not make things up",
          "fragment": "If there is not enough information, or you are unsure, say plainly that you are unsure. Never invent data, sources or facts."
        },
        {
          "id": "con.nodigress",
          "label": "Stay on topic",
          "hint": "Do not wander",
          "fragment": "Do not drift into unrelated material, and do not expand the scope of what I asked for."
        },
        {
          "id": "con.nosummary",
          "label": "No closing summary",
          "hint": "Do not say it all again",
          "fragment": "Do not summarise, elevate or repeat things at the end. When it is written, stop."
        },
        {
          "id": "con.wordlimit",
          "label": "Follow the word count strictly",
          "hint": "Over is a fail",
          "fragment": "Follow the word count I gave exactly. Going over or under both count as not completing the task."
        },
        {
          "id": "con.source",
          "label": "Cite sources for facts",
          "hint": "Or mark them uncertain",
          "fragment": "Whenever specific figures, dates, names or research findings are involved, cite the source. Where you cannot confirm something, mark it clearly as unverified."
        },
        {
          "id": "con.noemoji",
          "label": "No emoji or decoration",
          "hint": "Plain text",
          "fragment": "Do not use emoji or decorative symbols."
        },
        {
          "id": "con.noask",
          "label": "Do not ask me back",
          "hint": "Use your judgement",
          "fragment": "Do not ask me questions or request more information. Make the most reasonable assumption you can from what you have, and state what you assumed.",
          "group": "ask"
        },
        {
          "id": "con.askfirst",
          "label": "Ask me first if it is thin",
          "hint": "Do not guess",
          "fragment": "If key information is missing, ask me the one to three questions that matter most, and wait for my answer before starting. Do not begin on guesswork.",
          "group": "ask"
        }
      ]
    },
    "antiAi": {
      "id": "antiAi",
      "dim": "constraint",
      "title": "Strip the AI voice",
      "question": "Want the AI-speak stripped out?",
      "helper": "This is the part most people care about. Whatever you tick becomes an explicit writing ban.",
      "multi": true,
      "optional": true,
      "options": [
        {
          "id": "ai.cliche",
          "label": "Ban the stock phrases",
          "hint": "\"It is important to note\" and friends",
          "fragment": "Do not use the following stock phrases: \"It is important to note\", \"In today's fast-paced world\", \"When it comes to\", \"Moreover\" or \"Furthermore\" as a paragraph opener, \"In conclusion\", \"Let's dive in\", \"I hope this helps\"."
        },
        {
          "id": "ai.parallel",
          "label": "No stacked triads",
          "hint": "Do not line up three of everything",
          "fragment": "Do not use rhetorical triads or deliberately symmetrical structures, and do not pile up short sentences for the sake of rhythm."
        },
        {
          "id": "ai.antithesis",
          "label": "No antithesis",
          "hint": "\"Not just X, but Y\"",
          "fragment": "Do not use antithesis constructions such as \"not just X, but Y\" or \"it is not X, it is Y\"."
        },
        {
          "id": "ai.rhythm",
          "label": "Vary the sentence length",
          "hint": "Break the metronome",
          "fragment": "Sentence length should vary noticeably. Short and even incomplete sentences are allowed. Avoid a mechanically even rhythm."
        },
        {
          "id": "ai.concrete",
          "label": "Concrete nouns and verbs",
          "hint": "Fewer adjectives",
          "fragment": "Favour concrete nouns and verbs over adjectives, adverbs and abstractions. Where an example can make it clear, do not generalise."
        },
        {
          "id": "ai.colloquial",
          "label": "Allow speech and fragments",
          "hint": "Like a person wrote it",
          "fragment": "Colloquial phrasing, asides and elliptical sentences are all allowed. Not every sentence needs to be complete and correct."
        },
        {
          "id": "ai.noperpara",
          "label": "Do not summarise every paragraph",
          "hint": "Do not tie off every sentence",
          "fragment": "Do not end every paragraph on a summary sentence. Let the content move forward on its own."
        },
        {
          "id": "ai.hedge",
          "label": "Fewer hedges",
          "hint": "\"To some extent\", \"in a sense\"",
          "fragment": "Use fewer hedges such as \"to some extent\", \"in a sense\" or \"arguably\"."
        },
        {
          "id": "ai.emotion",
          "label": "No forced uplift",
          "hint": "Do not inflate the theme",
          "fragment": "Do not inflate the theme or reach for an emotional crescendo at the end. Stop where it should stop."
        },
        {
          "id": "ai.contrast",
          "label": "Go easy on em dashes",
          "hint": "— do not lean on them",
          "fragment": "Do not overuse em dashes for asides or turns of thought. Use ordinary sentence structure instead."
        }
      ]
    },
    "examples": {
      "id": "examples",
      "dim": "example",
      "title": "Examples",
      "question": "Should it show an example first?",
      "helper": "An example is the most effective way to align — it cuts a great deal of back-and-forth.",
      "multi": false,
      "options": [
        {
          "id": "ex.good",
          "label": "Show one or two good examples first",
          "hint": "Then match that feel",
          "fragment": "Before the real output, show one or two good examples that make clear what good looks like, then produce the content to that standard."
        },
        {
          "id": "ex.contrast",
          "label": "Show good and bad side by side",
          "hint": "One cautionary example",
          "fragment": "Before the real output, give one good example and one bad one, and explain what is wrong with the bad one."
        },
        {
          "id": "ex.none",
          "label": "No, just go",
          "hint": "Do not waste time",
          "fragment": "No examples needed. Output the final content directly."
        }
      ]
    },
    "img.subject": {
      "id": "img.subject",
      "dim": "subject",
      "title": "Subject",
      "question": "What is the main thing in the picture?",
      "helper": "The subject is the anchor of the whole image. Nail it down first; only then do style and lighting mean anything.",
      "multi": false,
      "options": [
        {
          "id": "isub.person",
          "label": "Person",
          "hint": "Portraits, characters",
          "fragment": "the main subject is a person",
          "followUps": [
            "img.subject.person"
          ]
        },
        {
          "id": "isub.animal",
          "label": "Animal",
          "hint": "Pets, wildlife",
          "fragment": "the main subject is an animal",
          "followUps": [
            "img.subject.animal"
          ]
        },
        {
          "id": "isub.product",
          "label": "Product / still life",
          "hint": "Goods, objects",
          "fragment": "the main subject is a product still life",
          "followUps": [
            "img.subject.product"
          ]
        },
        {
          "id": "isub.scene",
          "label": "Landscape / scene",
          "hint": "Nature, city, space",
          "fragment": "the main subject is an environment or scene, with no prominent person in it"
        },
        {
          "id": "isub.arch",
          "label": "Architecture / space",
          "hint": "Interiors, exteriors",
          "fragment": "the main subject is architectural space, and the structure and perspective need to read clearly"
        },
        {
          "id": "isub.food",
          "label": "Food",
          "hint": "Dishes, drinks",
          "fragment": "the main subject is food, and its colour and appetising texture need to come through"
        },
        {
          "id": "isub.vehicle",
          "label": "Machine / vehicle",
          "hint": "Cars, mecha, spacecraft",
          "fragment": "the main subject is a machine or vehicle, and its structural detail and metallic surfaces need to show"
        },
        {
          "id": "isub.abstract",
          "label": "Abstract concept",
          "hint": "Emotions, ideas made visual",
          "fragment": "the main subject is a visualisation of an abstract concept, not a literal depiction"
        }
      ]
    },
    "img.subject.person": {
      "id": "img.subject.person",
      "dim": "subject",
      "title": "Portrait feel",
      "question": "Which of these is closest to how the person should come across?",
      "multi": false,
      "options": [
        {
          "id": "iper.natural",
          "label": "Natural, realistic portrait",
          "hint": "Looks like it was really photographed",
          "fragment": "a realistic, natural person with true skin texture and a relaxed, unposed expression"
        },
        {
          "id": "iper.action",
          "label": "Caught mid-action",
          "hint": "Movement, a sense of story",
          "fragment": "the person is absorbed in doing something, with the candid immediacy of a snapshot"
        },
        {
          "id": "iper.fashion",
          "label": "Fashion editorial",
          "hint": "Styled, with tension",
          "fragment": "fashion-magazine editorial quality, deliberately styled, posed with tension"
        },
        {
          "id": "iper.anime",
          "label": "Anime / 2D character",
          "hint": "Non-realistic",
          "fragment": "an anime character style with clean linework and a bright palette"
        },
        {
          "id": "iper.group",
          "label": "Group portrait",
          "hint": "Two or more people",
          "fragment": "several people in the frame, with their positions and eyelines carefully related to one another"
        }
      ]
    },
    "img.subject.animal": {
      "id": "img.subject.animal",
      "dim": "subject",
      "title": "Animal feel",
      "question": "In what state should the animal appear?",
      "multi": false,
      "options": [
        {
          "id": "iani.cute",
          "label": "Adorable pet",
          "hint": "Makes you want to reach out",
          "fragment": "an adorable pet with soft, fluffy fur and bright, lively eyes"
        },
        {
          "id": "iani.wild",
          "label": "Wildlife documentary",
          "hint": "Natural, powerful",
          "fragment": "a wildlife-documentary look that conveys the animal's power and its natural habitat"
        },
        {
          "id": "iani.humanized",
          "label": "Anthropomorphic",
          "hint": "Wears clothes, acts human",
          "fragment": "an anthropomorphic animal wearing clothes or doing human things, with a sense of humour"
        },
        {
          "id": "iani.art",
          "label": "Artistic treatment",
          "hint": "Illustrated or stylised",
          "fragment": "an artistically treated animal, not aiming for realism"
        }
      ]
    },
    "img.subject.product": {
      "id": "img.subject.product",
      "dim": "subject",
      "title": "Product presentation",
      "question": "How should the product be shown?",
      "multi": false,
      "options": [
        {
          "id": "iprd.clean",
          "label": "Solid-background product shot",
          "hint": "E-commerce hero image",
          "fragment": "a clean single-colour background, the product centred, even lighting, nothing else in frame"
        },
        {
          "id": "iprd.scene",
          "label": "Lifestyle product shot",
          "hint": "Placed in a real setting",
          "fragment": "the product set into a real situation, with the surroundings hinting at what it is for and how it should feel"
        },
        {
          "id": "iprd.detail",
          "label": "Material close-up",
          "hint": "Emphasise feel and craft",
          "fragment": "a tight close-up focused on the product's material, texture and build quality"
        },
        {
          "id": "iprd.concept",
          "label": "Conceptual poster",
          "hint": "A creative conceit",
          "fragment": "a conceptual product poster that expresses the product's idea through a creative visual conceit"
        }
      ]
    },
    "img.composition": {
      "id": "img.composition",
      "dim": "composition",
      "title": "Shot size & framing",
      "question": "How far is the camera from the subject, and how is it framed?",
      "helper": "Shot size decides how much information you get — close-ups are about detail, wide shots about relationships.",
      "multi": false,
      "options": [
        {
          "id": "icomp.closeup",
          "label": "Close-up",
          "hint": "Part of it only, detail first",
          "fragment": "a close-up framing with the subject filling most of the frame",
          "followUps": [
            "img.angle"
          ]
        },
        {
          "id": "icomp.medium",
          "label": "Medium shot",
          "hint": "The everyday distance",
          "fragment": "a medium framing that shows the subject whole while keeping a moderate amount of surroundings",
          "followUps": [
            "img.angle"
          ]
        },
        {
          "id": "icomp.wide",
          "label": "Wide / environmental portrait",
          "hint": "Small figure, big scene",
          "fragment": "a wide framing where the environment dominates and the subject takes up only a small part of the scene",
          "followUps": [
            "img.angle"
          ]
        },
        {
          "id": "icomp.macro",
          "label": "macro",
          "hint": "Right up against it",
          "fragment": "a macro close-up at extreme range, revealing surface texture and minute detail",
          "followUps": [
            "img.angle"
          ]
        },
        {
          "id": "icomp.centered",
          "label": "Symmetrical and centred",
          "hint": "Stable, formal",
          "fragment": "a symmetrical, centred composition, balanced left and right, with the visual weight dead centre",
          "followUps": [
            "img.angle"
          ]
        },
        {
          "id": "icomp.rule",
          "label": "Rule of thirds",
          "hint": "Natural, easy",
          "fragment": "a rule-of-thirds composition with the subject sitting on a golden-section point",
          "followUps": [
            "img.angle"
          ]
        },
        {
          "id": "icomp.blank",
          "label": "Generous negative space",
          "hint": "Room for type",
          "fragment": "large areas of negative space with the subject off-centre, leaving room to set text",
          "followUps": [
            "img.angle"
          ]
        }
      ]
    },
    "img.angle": {
      "id": "img.angle",
      "dim": "composition",
      "title": "Camera angle",
      "question": "From what angle do we look at it?",
      "multi": false,
      "options": [
        {
          "id": "iang.eye",
          "label": "Eye level",
          "hint": "The natural viewing angle",
          "fragment": "an eye-level view, close to human height"
        },
        {
          "id": "iang.low",
          "label": "Low angle",
          "hint": "Tall, imposing",
          "fragment": "a low angle shot from below, making the subject look tall and imposing"
        },
        {
          "id": "iang.high",
          "label": "High angle",
          "hint": "Everything visible, feeling small",
          "fragment": "a high angle shot from above that shows how everything relates"
        },
        {
          "id": "iang.dutch",
          "label": "Dutch angle",
          "hint": "Uneasy, kinetic",
          "fragment": "a tilted Dutch-angle composition that adds a slight sense of instability"
        },
        {
          "id": "iang.pov",
          "label": "First-person view",
          "hint": "Strong sense of being there",
          "fragment": "a first-person viewpoint, as if seen through the viewer's own eyes"
        },
        {
          "id": "iang.aerial",
          "label": "Aerial",
          "hint": "Big landscape",
          "fragment": "an aerial overhead view that emphasises terrain and spatial layout"
        },
        {
          "id": "iang.over",
          "label": "Over-the-shoulder / from behind",
          "hint": "Foreground leads the eye",
          "fragment": "an over-the-shoulder or from-behind view that uses a foreground figure to lead the eye into the depth of the frame"
        }
      ]
    },
    "img.lighting": {
      "id": "img.lighting",
      "dim": "lighting",
      "title": "Lighting",
      "question": "How is the light set?",
      "helper": "Light is the most expensive thing in a picture. Same composition, different light, a different story.",
      "multi": true,
      "options": [
        {
          "id": "ilt.soft",
          "label": "Soft natural light",
          "hint": "Overcast, by a window",
          "fragment": "soft, even natural light with gentle shadow transitions",
          "group": [
            "source",
            "quality"
          ]
        },
        {
          "id": "ilt.golden",
          "label": "Golden-hour warmth",
          "hint": "Sunrise, sunset",
          "fragment": "low golden-hour light, the frame washed in gold and orange",
          "group": [
            "source",
            "time"
          ]
        },
        {
          "id": "ilt.blue",
          "label": "Blue-hour cool",
          "hint": "Just after sundown",
          "fragment": "cool blue-hour ambient light, the whole frame tending cyan-blue",
          "group": [
            "source",
            "time"
          ]
        },
        {
          "id": "ilt.rim",
          "label": "Side backlight / rim light",
          "hint": "Traces the subject's edge",
          "fragment": "strong side backlight drawing a bright rim along the subject's edge"
        },
        {
          "id": "ilt.studio",
          "label": "Studio lighting",
          "hint": "Clean and controllable",
          "fragment": "studio lighting with a clear key-and-fill hierarchy against a clean background",
          "group": "source"
        },
        {
          "id": "ilt.hard",
          "label": "Hard light / deep shadow",
          "hint": "Strong contrast",
          "fragment": "hard direct light with sharp shadow edges and strong light-dark contrast",
          "group": "quality"
        },
        {
          "id": "ilt.neon",
          "label": "Neon / cyber colour",
          "hint": "Coloured artificial light",
          "fragment": "neon and coloured artificial sources throwing strong colour reflections across the frame",
          "group": "source"
        },
        {
          "id": "ilt.lowkey",
          "label": "Low-key lighting",
          "hint": "Mostly dark, one area lit",
          "fragment": "low-key lighting, the frame mostly in shadow with only a local area lit",
          "group": "key"
        },
        {
          "id": "ilt.highkey",
          "label": "High-key and bright",
          "hint": "Airy and clean",
          "fragment": "high-key lighting, bright and airy with almost no heavy shadow",
          "group": "key"
        },
        {
          "id": "ilt.godray",
          "label": "Volumetric light / god rays",
          "hint": "Visible beams",
          "fragment": "a volumetric light effect with visible beams and dust motes hanging in the air"
        }
      ]
    },
    "img.style": {
      "id": "img.style",
      "dim": "style",
      "title": "Style",
      "question": "Which visual style do you want?",
      "helper": "Two at most. You can only pick one rendering style, but a mood can be layered on top — photographic realism plus a cinematic feel, say.",
      "multi": true,
      "maxPick": 2,
      "options": [
        {
          "id": "ist.photo",
          "label": "Photographic realism",
          "hint": "Looks like a real photograph",
          "fragment": "a photographic-realism style where light and material behave the way they really do",
          "group": "medium"
        },
        {
          "id": "ist.cinema",
          "label": "Cinematic",
          "hint": "Film colour, high dynamic range",
          "fragment": "a cinematic look with film-stock colour and high dynamic range"
        },
        {
          "id": "ist.jp",
          "label": "Japanese light and airy",
          "hint": "Airy, low contrast",
          "fragment": "a light Japanese style: high brightness, low contrast, clean and airy"
        },
        {
          "id": "ist.ink",
          "label": "Chinese ink wash",
          "hint": "Negative space, expressive",
          "fragment": "a Chinese ink-wash style that values empty space and expressive suggestion, with brushwork that breathes",
          "group": "medium"
        },
        {
          "id": "ist.3d",
          "label": "3D render",
          "hint": "C4D / Blender look",
          "fragment": "a 3D render where materials and light follow physically based rendering",
          "group": "medium"
        },
        {
          "id": "ist.cyber",
          "label": "cyberpunk",
          "hint": "Neon, rainy night, tech",
          "fragment": "a cyberpunk style: neon light pollution set against the visual contrast of high tech and low life"
        },
        {
          "id": "ist.film",
          "label": "Vintage film",
          "hint": "Grain, faded colour",
          "fragment": "a vintage film look with visible grain and slightly faded colour"
        },
        {
          "id": "ist.flat",
          "label": "Minimal flat illustration",
          "hint": "Clean, vector-like",
          "fragment": "a minimal flat illustration style with geometric shapes and clearly separated blocks of colour",
          "group": "medium"
        },
        {
          "id": "ist.oil",
          "label": "Oil painting / impasto",
          "hint": "Visible brushwork",
          "fragment": "oil paint laid on thickly, brushstrokes clearly readable, colour layered richly",
          "group": "medium"
        },
        {
          "id": "ist.concept",
          "label": "Concept art",
          "hint": "Production-art look",
          "fragment": "a concept-art style that emphasises design sensibility and imagination"
        },
        {
          "id": "ist.pixel",
          "label": "pixel art",
          "hint": "Retro game",
          "fragment": "a pixel-art style with distinct colour blocks and hard edges",
          "group": "medium"
        },
        {
          "id": "ist.vapor",
          "label": "Vaporwave",
          "hint": "Pink-purple gradients, retro tech",
          "fragment": "a vaporwave style with pink-and-purple gradients and nostalgic 1980s tech imagery"
        }
      ]
    },
    "img.mood": {
      "id": "img.mood",
      "dim": "mood",
      "title": "Mood",
      "question": "What feeling should this image carry?",
      "helper": "Mood decides what the audience feels, not merely what it sees.",
      "multi": false,
      "options": [
        {
          "id": "imd.calm",
          "label": "Calm and relaxed",
          "hint": "Settles you down",
          "fragment": "an overall mood of calm and relaxation, unhurried"
        },
        {
          "id": "imd.warm",
          "label": "Warm and comforting",
          "hint": "A sense of safety",
          "fragment": "a warm, comforting mood that feels like being held"
        },
        {
          "id": "imd.tense",
          "label": "Tense and oppressive",
          "hint": "Charged",
          "fragment": "a tense, oppressive mood with an uneasy charge"
        },
        {
          "id": "imd.lonely",
          "label": "Lonely and detached",
          "hint": "Empty and quiet",
          "fragment": "a lonely, detached mood with a clear distance between the subject and its surroundings"
        },
        {
          "id": "imd.mystery",
          "label": "Mysterious and unknown",
          "hint": "As if something is hidden",
          "fragment": "a mysterious mood, as though the frame holds something not yet revealed"
        },
        {
          "id": "imd.energy",
          "label": "Vivid and energetic",
          "hint": "Driven",
          "fragment": "a mood full of energy and drive, strongly kinetic"
        },
        {
          "id": "imd.noble",
          "label": "Refined and restrained",
          "hint": "Luxury feel",
          "fragment": "a refined, restrained mood that speaks through empty space and material quality rather than piling on elements"
        },
        {
          "id": "imd.retro",
          "label": "Nostalgic",
          "hint": "The warmth of old days",
          "fragment": "a nostalgic mood carrying a sense of era and the warmth of memory"
        }
      ]
    },
    "img.palette": {
      "id": "img.palette",
      "dim": "color",
      "title": "Color",
      "question": "What is the overall colour bias?",
      "helper": "Pick one. Two key colours and the frame turns muddy.",
      "multi": false,
      "options": [
        {
          "id": "ipal.warm",
          "label": "Warm",
          "hint": "Orange, yellow, red",
          "fragment": "warm-led, with orange, yellow and red as the dominant hues"
        },
        {
          "id": "ipal.cool",
          "label": "Cool",
          "hint": "Cyan and blue",
          "fragment": "cool-led, with cyan and blue as the dominant hues"
        },
        {
          "id": "ipal.mono",
          "label": "Desaturated / monochrome",
          "hint": "Restrained",
          "fragment": "a low-saturation palette, close to monochrome"
        },
        {
          "id": "ipal.morandi",
          "label": "Morandi palette",
          "hint": "Sophisticated greys",
          "fragment": "a Morandi palette: soft greyed tones in which the colours defer to one another"
        },
        {
          "id": "ipal.contrast",
          "label": "High-saturation clash",
          "hint": "Bold",
          "fragment": "high-saturation clashing colours with strong contrast"
        },
        {
          "id": "ipal.bw",
          "label": "Black and white",
          "hint": "Light and dark only",
          "fragment": "a black-and-white tonality that shapes the image purely through light and dark"
        },
        {
          "id": "ipal.faded",
          "label": "Faded vintage",
          "hint": "Like an old photograph",
          "fragment": "a faded vintage tonality, as though time had washed the colour out"
        },
        {
          "id": "ipal.dual",
          "label": "Warm-cool duotone",
          "hint": "Two hues in tension",
          "fragment": "a warm-cool duotone, the frame held in tension between two hues"
        }
      ]
    },
    "img.ratio": {
      "id": "img.ratio",
      "dim": "composition",
      "title": "Aspect ratio",
      "question": "Where will this image be used?",
      "helper": "Get the ratio wrong and even a great image ends up cropped.",
      "multi": false,
      "options": [
        {
          "id": "irat.square",
          "label": "1:1 square",
          "hint": "Avatars, e-commerce hero",
          "fragment": "1:1 square frame"
        },
        {
          "id": "irat.p34",
          "label": "3:4 portrait",
          "hint": "Xiaohongshu, posters",
          "fragment": "3:4 portrait frame"
        },
        {
          "id": "irat.p916",
          "label": "9:16 vertical",
          "hint": "Phone wallpaper, short-video cover",
          "fragment": "9:16 vertical frame"
        },
        {
          "id": "irat.l169",
          "label": "16:9 landscape",
          "hint": "Wallpapers, slides, video covers",
          "fragment": "16:9 widescreen frame"
        },
        {
          "id": "irat.p23",
          "label": "2:3 portrait",
          "hint": "photograph",
          "fragment": "the classic 2:3 photographic portrait frame"
        },
        {
          "id": "irat.cinema",
          "label": "21:9 ultra-wide",
          "hint": "Cinematic",
          "fragment": "a 21:9 ultra-wide frame, close to cinema screen proportions"
        }
      ]
    },
    "img.quality": {
      "id": "img.quality",
      "dim": "quality",
      "title": "Quality & lens",
      "question": "What level of detail and lens character do you want?",
      "helper": "This is the part that decides whether an image looks expensive.",
      "multi": true,
      "options": [
        {
          "id": "iql.detail",
          "label": "High detail, fine texture",
          "hint": "Holds up when magnified",
          "fragment": "extremely high detail, with materials and texture still clearly readable when magnified"
        },
        {
          "id": "iql.dof",
          "label": "Shallow depth of field",
          "hint": "Lifts the subject out",
          "fragment": "a shallow depth of field with the background softly blurred, lifting the subject clear of its surroundings"
        },
        {
          "id": "iql.p85",
          "label": "85mm portrait lens",
          "hint": "Compression, flattering faces",
          "fragment": "the character of an 85mm short-telephoto portrait lens: natural compression and flattering facial proportions",
          "group": "lens"
        },
        {
          "id": "iql.w24",
          "label": "Wide-angle tension",
          "hint": "Strong sense of space",
          "fragment": "the character of a 24mm wide lens: exaggerated perspective and deep spatial recession",
          "group": "lens"
        },
        {
          "id": "iql.motion",
          "label": "Long exposure / motion blur",
          "hint": "Time made visible",
          "fragment": "a long-exposure effect in which moving objects leave soft trails"
        },
        {
          "id": "iql.grain",
          "label": "Film grain",
          "hint": "Textured, imperfect",
          "fragment": "noticeable film grain, with no attempt to be spotless"
        },
        {
          "id": "iql.8k",
          "label": "8K ultra HD",
          "hint": "Maximum clarity",
          "fragment": "8K ultra-high-definition quality with razor-sharp detail"
        },
        {
          "id": "iql.skin",
          "label": "Real skin texture",
          "hint": "No plastic look",
          "fragment": "real skin texture with pores and small imperfections intact, no over-smoothing"
        }
      ]
    },
    "img.negative": {
      "id": "img.negative",
      "dim": "negative",
      "title": "Negative prompt",
      "question": "What must never appear in the image?",
      "helper": "A negative prompt is the cheapest way to raise quality. You can also skip it entirely.",
      "multi": true,
      "optional": true,
      "options": [
        {
          "id": "ineg.quality",
          "label": "low quality, blurry, noisy",
          "hint": "low quality, blurry",
          "fragment": "low quality, blurry, noisy, jpeg artifacts"
        },
        {
          "id": "ineg.hands",
          "label": "deformed hands, extra limbs",
          "hint": "bad hands",
          "fragment": "bad hands, extra fingers, extra limbs, deformed hands"
        },
        {
          "id": "ineg.face",
          "label": "distorted face",
          "hint": "deformed face",
          "fragment": "distorted face, deformed face, asymmetric eyes"
        },
        {
          "id": "ineg.text",
          "label": "text and watermarks",
          "hint": "text, watermark",
          "fragment": "text, watermark, signature, logo"
        },
        {
          "id": "ineg.plastic",
          "label": "plastic skin, over-smoothing",
          "hint": "plastic skin",
          "fragment": "plastic skin, over-smoothed skin, waxy texture"
        },
        {
          "id": "ineg.hdr",
          "label": "over-saturated HDR look",
          "hint": "over-saturated",
          "fragment": "over-saturated, excessive HDR, oversharpened"
        },
        {
          "id": "ineg.clutter",
          "label": "cluttered composition, too many elements",
          "hint": "cluttered",
          "fragment": "cluttered composition, too many elements, busy background"
        },
        {
          "id": "ineg.faceavg",
          "label": "generic influencer faces",
          "hint": "generic AI face",
          "fragment": "generic AI face, same-face syndrome, instagram filter face"
        },
        {
          "id": "ineg.irrelevant",
          "label": "irrelevant objects in frame",
          "hint": "random items",
          "fragment": "irrelevant objects, random items in frame"
        },
        {
          "id": "ineg.artifacts",
          "label": "obvious AI generation artefacts",
          "hint": "AI artifacts",
          "fragment": "obvious AI artifacts, unnatural anatomy, uncanny valley"
        }
      ]
    },
    "vid.action": {
      "id": "vid.action",
      "dim": "action",
      "title": "Action",
      "question": "What happens in the shot?",
      "helper": "The one thing video has that a still does not is change. Describe the change first.",
      "multi": false,
      "options": [
        {
          "id": "vact.still",
          "label": "Subject still, surroundings moving",
          "hint": "Wind, ripples, shifting light",
          "fragment": "the subject stays essentially still while the environment supplies the motion — wind, water, shifting light or a crowd"
        },
        {
          "id": "vact.single",
          "label": "One continuous action",
          "hint": "Turning, raising a hand, walking",
          "fragment": "the subject performs one continuous action, with the whole movement staying visible"
        },
        {
          "id": "vact.sequence",
          "label": "Multi-stage action sequence",
          "hint": "First… then…",
          "fragment": "the subject performs several actions in turn, with a clear before-and-after order"
        },
        {
          "id": "vact.enter",
          "label": "Enters from off-screen",
          "hint": "Walks in, then stops",
          "fragment": "the subject enters the frame from off-screen and comes to a stop inside it"
        },
        {
          "id": "vact.express",
          "label": "Expression and emotional shift",
          "hint": "Mostly close-ups",
          "fragment": "the focus is on subtle shifts of facial expression and the drift of emotion"
        },
        {
          "id": "vact.interact",
          "label": "Interaction between two subjects",
          "hint": "Dialogue, contact",
          "fragment": "two subjects interact, and their movements need to answer each other"
        }
      ]
    },
    "vid.shot": {
      "id": "vid.shot",
      "dim": "shot",
      "title": "Shot size",
      "question": "Which shot sizes?",
      "helper": "Multiple choice. They are handed to the shots in order. Whether the piece is one shot or several is decided by the cut structure.",
      "multi": true,
      "options": [
        {
          "id": "vsh.extreme",
          "label": "Extreme wide",
          "hint": "Establishes the setting",
          "fragment": "an extreme wide shot, with the subject occupying only a small part of a vast environment"
        },
        {
          "id": "vsh.wide",
          "label": "Wide",
          "hint": "Subject and setting matter equally",
          "fragment": "a wide shot with the subject fully in frame and plenty of surrounding context"
        },
        {
          "id": "vsh.medium",
          "label": "Medium shot",
          "hint": "The workhorse",
          "fragment": "a medium shot, framed from the waist up"
        },
        {
          "id": "vsh.close",
          "label": "Close shot",
          "hint": "Expression first",
          "fragment": "a close shot, framed from the chest up, bringing out the facial expression"
        },
        {
          "id": "vsh.cu",
          "label": "Close-up",
          "hint": "Detail only",
          "fragment": "a close-up shot focused on the face or a key detail"
        },
        {
          "id": "vsh.macro",
          "label": "Extreme close-up",
          "hint": "macro",
          "fragment": "an extreme close-up macro shot revealing detail the naked eye can barely make out"
        }
      ]
    },
    "vid.move": {
      "id": "vid.move",
      "dim": "move",
      "title": "Camera movement",
      "question": "How does the camera move?",
      "helper": "Camera movement is a video's tone of voice. Same shot, but a locked-off camera and an orbiting one are two different things. If you pick several, they are handed to the shots in order — the first goes to shot 1, and so on. A single-shot video only uses the first.",
      "multi": true,
      "maxPick": 4,
      "options": [
        {
          "id": "vmv.static",
          "label": "Locked-off",
          "hint": "Steady and restrained",
          "fragment": "a locked-off camera, completely still"
        },
        {
          "id": "vmv.push",
          "label": "Slow push in",
          "hint": "Draws the eye in",
          "fragment": "the camera pushes in slowly, settling its focus on the subject"
        },
        {
          "id": "vmv.pull",
          "label": "Slow pull out",
          "hint": "Reveals the setting",
          "fragment": "the camera pulls back slowly, gradually revealing the subject's surroundings"
        },
        {
          "id": "vmv.pan",
          "label": "Pan",
          "hint": "As if scanning across",
          "fragment": "the camera pans horizontally, as if scanning across the whole scene"
        },
        {
          "id": "vmv.track",
          "label": "Lateral move / tracking",
          "hint": "Travels with the subject",
          "fragment": "the camera moves laterally at the subject's speed, holding the subject in the same place in frame"
        },
        {
          "id": "vmv.orbit",
          "label": "Orbit",
          "hint": "Circles the subject",
          "fragment": "the camera orbits around the subject"
        },
        {
          "id": "vmv.crane",
          "label": "Crane up / down",
          "hint": "Changes height",
          "fragment": "the camera rises or falls vertically, changing the viewing height"
        },
        {
          "id": "vmv.handheld",
          "label": "Handheld",
          "hint": "Documentary feel",
          "fragment": "handheld shooting with a natural, slight shake that gives it a documentary feel"
        },
        {
          "id": "vmv.drone",
          "label": "Drone aerial",
          "hint": "Covers a lot of ground",
          "fragment": "a drone aerial viewpoint, the camera travelling widely or flying over the scene"
        },
        {
          "id": "vmv.pov",
          "label": "First-person view",
          "hint": "Strong sense of being there",
          "fragment": "first-person camera movement, as if the viewer were the one moving"
        }
      ]
    },
    "vid.style": {
      "id": "vid.style",
      "dim": "style",
      "title": "Look",
      "question": "What is the overall look?",
      "multi": false,
      "options": [
        {
          "id": "vst.cinema",
          "label": "Cinematic",
          "hint": "Film, tonal depth",
          "fragment": "cinematic image quality with film-stock colour and a rich tonal range"
        },
        {
          "id": "vst.doc",
          "label": "Documentary realism",
          "hint": "Real, unpolished",
          "fragment": "a documentary style with natural, unadorned light and imagery"
        },
        {
          "id": "vst.ad",
          "label": "Commercial polish",
          "hint": "Clean and premium",
          "fragment": "a high-end commercial look: clean imagery, refined lighting"
        },
        {
          "id": "vst.anime",
          "label": "Anime / 2D",
          "hint": "Hand-drawn feel",
          "fragment": "a 2D animation style with clean linework and hand-drawn motion"
        },
        {
          "id": "vst.stop",
          "label": "stop motion",
          "hint": "Stop-motion",
          "fragment": "a stop-motion style with the slight jerkiness of frame-by-frame shooting"
        },
        {
          "id": "vst.vhs",
          "label": "Retro VHS",
          "hint": "Old videotape",
          "fragment": "a retro videotape look with noise, colour bleed and a slight wobble"
        },
        {
          "id": "vst.cyber",
          "label": "cyberpunk",
          "hint": "Neon future",
          "fragment": "a cyberpunk look with neon sources against a cool-toned city"
        }
      ]
    },
    "vid.cut": {
      "id": "vid.cut",
      "dim": "cut",
      "title": "Cut structure",
      "question": "How is the piece cut?",
      "helper": "This decides how many shots the piece has — with a single shot you do not need several shot sizes.",
      "multi": false,
      "options": [
        {
          "id": "vcut.cut",
          "label": "Cut into shots",
          "hint": "Several shots, cut together",
          "fragment": "cut together in storyboard order, with clean, decisive transitions between shots"
        },
        {
          "id": "vcut.oner",
          "label": "one take",
          "hint": "One shot throughout",
          "fragment": "a single continuous take with no cuts anywhere"
        }
      ]
    },
    "vid.lighting": {
      "id": "vid.lighting",
      "dim": "lighting",
      "title": "Lighting",
      "question": "What is the light like?",
      "multi": true,
      "options": [
        {
          "id": "vlt.natural",
          "label": "Natural daylight",
          "hint": "True to life",
          "fragment": "natural daylight, true and unforced",
          "group": "source"
        },
        {
          "id": "vlt.golden",
          "label": "golden hour",
          "hint": "Sunrise / sunset warmth",
          "fragment": "Warm, low golden-hour light",
          "group": "source"
        },
        {
          "id": "vlt.night",
          "label": "Night neon",
          "hint": "Complex artificial sources",
          "fragment": "city lights and neon at night, with layered, complex sources",
          "group": "source"
        },
        {
          "id": "vlt.studio",
          "label": "Studio lighting",
          "hint": "Clean and controllable",
          "fragment": "studio lighting, clean and controllable",
          "group": "source"
        },
        {
          "id": "vlt.back",
          "label": "Backlit silhouette",
          "hint": "Only the outline reads",
          "fragment": "shot against the light, so the subject reads as a silhouette or half-silhouette"
        },
        {
          "id": "vlt.overcast",
          "label": "Overcast soft light",
          "hint": "No hard shadows",
          "fragment": "soft diffused light under an overcast sky, with almost no hard shadow",
          "group": "source"
        }
      ]
    },
    "vid.duration": {
      "id": "vid.duration",
      "dim": "duration",
      "title": "Duration & pacing",
      "question": "How long is it, and what is the pace?",
      "helper": "Duration decides how many shots will fit — cram four into three to five seconds and none of them registers.",
      "multi": false,
      "options": [
        {
          "id": "vdur.s5",
          "label": "3-5s · single shot",
          "hint": "One shot does it",
          "fragment": "three to five seconds long, with an unhurried pace",
          "seconds": 5,
          "maxShots": 1
        },
        {
          "id": "vdur.s10",
          "label": "5-10s · single shot",
          "hint": "The action plays out fully",
          "fragment": "five to ten seconds, letting the action play out fully",
          "seconds": 10,
          "maxShots": 1
        },
        {
          "id": "vdur.s15",
          "label": "10-15s · multiple shots",
          "hint": "With cuts",
          "fragment": "ten to fifteen seconds, with a pace that builds",
          "seconds": 15,
          "maxShots": 3
        },
        {
          "id": "vdur.long",
          "label": "15s+ · needs a storyboard",
          "hint": "Give me the storyboard first",
          "fragment": "over fifteen seconds, with a pace that rises and falls",
          "seconds": 20,
          "maxShots": 4
        }
      ]
    },
    "vid.audio": {
      "id": "vid.audio",
      "dim": "audio",
      "title": "Audio",
      "question": "Do you want sound, and what kind?",
      "helper": "If your tool does not support audio, just pick no sound.",
      "multi": true,
      "options": [
        {
          "id": "vaud.none",
          "label": "No sound",
          "hint": "Picture only",
          "fragment": "describe the picture only, no audio needed",
          "group": "*"
        },
        {
          "id": "vaud.ambient",
          "label": "Ambient sound",
          "hint": "Wind, rain, street",
          "fragment": "with ambient sound — wind, water or city background"
        },
        {
          "id": "vaud.music",
          "label": "Emotional score",
          "hint": "Carries the pace",
          "fragment": "with an emotional background score",
          "followUps": [
            "vid.bgm"
          ]
        },
        {
          "id": "vaud.voice",
          "label": "Voice-over / dialogue",
          "hint": "Has voices",
          "fragment": "including voice-over or dialogue"
        },
        {
          "id": "vaud.sfx",
          "label": "Sound effects on the action",
          "hint": "Punch up the action",
          "fragment": "with sound effects underlining the key actions"
        }
      ]
    },
    "vid.bgm": {
      "id": "vid.bgm",
      "dim": "bgm",
      "title": "Music style",
      "question": "What should the music actually feel like?",
      "helper": "Name the instruments and the tempo and the score will not drift off course.",
      "multi": false,
      "options": [
        {
          "id": "vbgm.piano",
          "label": "Slow piano",
          "hint": "Clean, restrained",
          "fragment": "mostly slow solo piano, sparse notes and plenty of space between them"
        },
        {
          "id": "vbgm.cello",
          "label": "Deep cello",
          "hint": "Heavy, with a sense of story",
          "fragment": "sustained low cello underneath, giving it weight and a sense of story"
        },
        {
          "id": "vbgm.ambient",
          "label": "Ambient",
          "hint": "Underneath, never intrusive",
          "fragment": "ambient music, a continuous pad underneath that never competes with the picture"
        },
        {
          "id": "vbgm.lofi",
          "label": "Lazy lo-fi",
          "hint": "Relaxed, lived-in",
          "fragment": "a lo-fi style with light background hiss and lazy drums, full of everyday texture"
        },
        {
          "id": "vbgm.strings",
          "label": "Swelling strings",
          "hint": "Drives to a peak",
          "fragment": "strings swelling up from quiet, pushing the emotion to its peak in the middle-to-late section"
        },
        {
          "id": "vbgm.electronic",
          "label": "Electronic ambience",
          "hint": "Cold and futuristic",
          "fragment": "synthesizer tones, cool and futuristic, on a steady beat"
        }
      ]
    },
    "vid.arc": {
      "id": "vid.arc",
      "dim": "arc",
      "title": "Emotional arc",
      "question": "How should the viewer's emotion travel through the piece?",
      "helper": "Four shots at one emotional level feel flat. Set a direction and every shot's mood has somewhere to go.",
      "multi": false,
      "options": [
        {
          "id": "varc.rise",
          "label": "From still to moving",
          "hint": "Builds slowly, lands hard",
          "fragment": "the emotion moves from still to moving: restrained in the first half, driving in the second",
          "arc": [
            "Settles first",
            "Gradually builds",
            "Drives up",
            "Releases"
          ]
        },
        {
          "id": "varc.warm",
          "label": "From cold to warm",
          "hint": "From distant to close",
          "fragment": "the emotion moves from cold to warm, shifting from distant and restrained into warmth",
          "arc": [
            "Distant and restrained",
            "Begins to loosen",
            "Draws closer",
            "Lands in warmth"
          ]
        },
        {
          "id": "varc.build",
          "label": "Step by step",
          "hint": "Tighter with every shot",
          "fragment": "the emotion builds step by step, each shot tighter than the last",
          "arc": [
            "Opens out the scene",
            "Gets to the point",
            "Tightens",
            "Settles to a close"
          ]
        },
        {
          "id": "varc.release",
          "label": "From tight to loose",
          "hint": "Held, then released",
          "fragment": "the emotion moves from tight to loose: held down in the first half, released in the second",
          "arc": [
            "Holding it in",
            "Deadlocked",
            "Begins to loosen",
            "Fully open"
          ]
        },
        {
          "id": "varc.flow",
          "label": "Flowing gently",
          "hint": "No forced ups and downs",
          "fragment": "the emotion flows gently, with no strong rises or falls",
          "arc": [
            "Eases in",
            "Drifts along",
            "A gentle rise and fall",
            "Settles down"
          ]
        }
      ]
    },
    "vid.focus": {
      "id": "vid.focus",
      "dim": "focus",
      "title": "Detail focus",
      "question": "As the camera moves in, what matters most to see clearly?",
      "helper": "Leave the focus unset on a close-up or close shot and the model picks one itself — often the wrong thing.",
      "multi": false,
      "options": [
        {
          "id": "vfoc.face",
          "label": "Facial expression",
          "fragment": "draw the viewer's attention to the facial expression"
        },
        {
          "id": "vfoc.eyes",
          "label": "Eyes and gaze",
          "fragment": "draw the viewer's attention to the eyes and the direction of the gaze"
        },
        {
          "id": "vfoc.hands",
          "label": "Hand movement",
          "fragment": "draw the viewer's attention to the movement of the hands"
        },
        {
          "id": "vfoc.prop",
          "label": "Key prop",
          "fragment": "draw the viewer's attention to the material and detail of the key prop"
        },
        {
          "id": "vfoc.env",
          "label": "Environmental detail",
          "fragment": "draw the viewer's attention to the details of the setting, keeping the background texture sharp"
        },
        {
          "id": "vfoc.light",
          "label": "Shifts of light",
          "fragment": "draw the viewer's attention to the shifting of light and shadow"
        }
      ]
    },
    "vid.detail": {
      "id": "vid.detail",
      "dim": "detail",
      "title": "Visual details",
      "question": "Which details must appear in the frame?",
      "helper": "Details you write yourself come first, one per shot. To be more specific, choose write my own and type them straight in — raindrops on the umbrella, reflections in the puddles, the neon sign — separated by commas, one for each shot.",
      "multi": true,
      "maxPick": 6,
      "optional": true,
      "options": [
        {
          "id": "vdet.outfit",
          "label": "The subject's clothing and look",
          "hint": "Clothes, hair, what they carry",
          "fragment": "the subject's clothing and appearance are clearly visible"
        },
        {
          "id": "vdet.face",
          "label": "Face and expression",
          "hint": "Shifts in expression",
          "fragment": "shifts in the face and its expression are clearly visible"
        },
        {
          "id": "vdet.env",
          "label": "Environmental texture",
          "hint": "Walls, ground, street",
          "fragment": "the materials and textures of the setting are clearly visible"
        },
        {
          "id": "vdet.air",
          "label": "Sense of air",
          "hint": "Moisture, dust, flares",
          "fragment": "moisture, dust or light flares in the air are clearly visible"
        },
        {
          "id": "vdet.reflect",
          "label": "Reflections",
          "hint": "Water, glass, metal",
          "fragment": "reflections on the ground or on object surfaces are clearly visible"
        },
        {
          "id": "vdet.prop",
          "label": "Key prop",
          "hint": "Umbrella, cup, phone…",
          "fragment": "the details of the key prop are clearly visible"
        },
        {
          "id": "vdet.crowd",
          "label": "Crowds and traffic",
          "hint": "Background activity",
          "fragment": "slow-moving crowds or traffic in the background"
        },
        {
          "id": "vdet.texture",
          "label": "Surface texture",
          "hint": "Fabric, wood grain, stone",
          "fragment": "the texture of object surfaces is magnified"
        }
      ]
    },
    "vid.ratio": {
      "id": "vid.ratio",
      "dim": "shot",
      "title": "Aspect ratio",
      "question": "Where will this video be shown?",
      "helper": "Pick the wrong orientation and the platform crops it for you — the framing is gone.",
      "multi": false,
      "options": [
        {
          "id": "vrat.l169",
          "label": "16:9 landscape",
          "hint": "Bilibili, YouTube, website",
          "fragment": "16:9 widescreen frame"
        },
        {
          "id": "vrat.p916",
          "label": "9:16 vertical",
          "hint": "Douyin, Xiaohongshu, Reels",
          "fragment": "a 9:16 vertical frame, made for full-screen viewing on a phone"
        },
        {
          "id": "vrat.square",
          "label": "1:1 square",
          "hint": "Feed ads",
          "fragment": "1:1 square frame"
        },
        {
          "id": "vrat.cinema",
          "label": "21:9 ultra-wide",
          "hint": "Cinematic trailer",
          "fragment": "a 21:9 ultra-wide frame, close to cinema screen proportions"
        },
        {
          "id": "vrat.p45",
          "label": "4:5 portrait",
          "hint": "Instagram feed",
          "fragment": "4:5 portrait frame"
        }
      ]
    },
    "vid.negative": {
      "id": "vid.negative",
      "dim": "negative",
      "title": "Negative prompt",
      "question": "Which problems must never appear?",
      "helper": "These are where video models most often go wrong. Pick at least a few.",
      "multi": true,
      "optional": true,
      "options": [
        {
          "id": "vneg.shake",
          "label": "camera shake, jelly effect",
          "hint": "shaky footage",
          "fragment": "shaky footage, jello effect, rolling shutter"
        },
        {
          "id": "vneg.face",
          "label": "warped faces or limbs",
          "hint": "deformed",
          "fragment": "deformed face, distorted body, extra limbs"
        },
        {
          "id": "vneg.pop",
          "label": "objects appearing or vanishing out of nowhere",
          "hint": "morphing",
          "fragment": "objects appearing or disappearing, morphing"
        },
        {
          "id": "vneg.motion",
          "label": "unnatural motion, smearing",
          "hint": "ghosting",
          "fragment": "unnatural motion, motion blur artifacts, ghosting"
        },
        {
          "id": "vneg.flicker",
          "label": "flickering, dropped frames",
          "hint": "flickering",
          "fragment": "flickering, frame skipping, stuttering"
        },
        {
          "id": "vneg.text",
          "label": "text and watermarks",
          "hint": "text, watermark",
          "fragment": "text, watermark, subtitles"
        },
        {
          "id": "vneg.quality",
          "label": "low resolution, blurry",
          "hint": "low resolution",
          "fragment": "low resolution, blurry, pixelated"
        },
        {
          "id": "vneg.chaos",
          "label": "chaotic action across multiple subjects",
          "hint": "chaotic",
          "fragment": "chaotic action, multiple subjects moving inconsistently"
        }
      ]
    }
  },
  "sectionTitles": {
    "role": "Role",
    "context": "Context",
    "task": "Task",
    "requirement": "Requirements",
    "format": "Format",
    "style": "Tone & depth",
    "constraint": "Constraints",
    "example": "Examples",
    "subject": "Subject",
    "composition": "Composition & lens",
    "lighting": "Lighting",
    "mood": "Mood",
    "color": "Color",
    "quality": "Quality & texture",
    "negative": "Negative prompt",
    "action": "Action",
    "shot": "Shot size",
    "focus": "Detail focus",
    "move": "Camera movement",
    "cut": "Cut structure",
    "arc": "Emotional arc",
    "detail": "Visual details",
    "duration": "Duration & pacing",
    "audio": "Audio"
  },
  "shotContent": {
    "vsh.extreme": "Fill the frame with the environment; the subject is one small point inside it",
    "vsh.wide": "Subject fully in frame, the environment takes most of the shot",
    "vsh.medium": "Frame from the waist up; action and surroundings both visible",
    "vsh.close": "Frame from the chest up; the background starts to blur",
    "vsh.cu": "Keep one detail of the subject only; blur everything else",
    "vsh.macro": "Move in extremely close so texture fills the whole frame"
  },
  "shotRole": {
    "vsh.extreme": "Establish time, place and overall mood first; the person is just one point in the environment",
    "vsh.wide": "Put the subject fully into the environment so who and where read at a glance",
    "vsh.medium": "Action and posture read most clearly — the workhorse shot of the story",
    "vsh.close": "Emotion starts to surface; the audience can read the expression",
    "vsh.cu": "Pin attention onto one detail and amplify its texture",
    "vsh.macro": "Move to a scale the naked eye cannot resolve, creating a sense of the unfamiliar"
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
    "role": "Tells the AI whose shoes it is standing in. It then switches to that role's standards and habits of speech. The same question gets a completely different answer from an expert than from a beginner.",
    "context": "Say who it is for and where it gets used, and the AI adjusts its vocabulary and its examples on its own. This is the most overlooked block, and the one that pays off most.",
    "task": "Your own words, not the AI's paraphrase. Your phrasing carries your tone and your real intent — every paraphrase loses a little of both.",
    "requirement": "Write down the details you take for granted. Precisely because they feel obvious to you, they are the ones the AI drops.",
    "format": "Pin down the shape, length and structure of the output. Most unusable results trace back here — the content was fine, the form was wrong.",
    "style": "Tone and level of detail decide whether it reads like a person wrote it. The more specific this block is, the less the result smells of AI.",
    "constraint": "Draw the boundary: what you do not want, what must always hold. Constraints buy more reliability than requests do, because they close off the room the AI would otherwise improvise in.",
    "example": "An example is the fastest way to align. One concrete sample usually carries more than ten abstract sentences.",
    "subject": "An image model only draws what you write. The more specific the subject, the less room it has to improvise — which is to say, to wander off.",
    "composition": "Shot size and angle decide where the viewer stands. This is what separates a casual snapshot from a composed image.",
    "lighting": "Light is the most expensive thing in a frame. Change the light on the same composition and you get a different story — and a different price tag.",
    "mood": "Mood answers what the viewer feels afterwards. Describe only the content and the image comes out correct but flat.",
    "color": "Color is perceived first and noticed last. Fix the palette and the whole image stops looking messy.",
    "quality": "Quality and lens wording decide how refined the result looks — the most direct way to stop an image feeling cheap.",
    "negative": "The negative prompt is the best value step: saying what you do not want is far faster than re-tuning what you do.",
    "action": "The only difference between video and a still is change. Describe the change and the model knows what to move.",
    "shot": "Shot size is the grammar of video. One size reads as monotonous; several mean the shots have to be cut together.",
    "focus": "If a close shot does not say what to look at, the model picks something itself — usually the wrong thing. So this only applies to close-ups and near shots; a wide shot has no focus point.",
    "move": "Camera movement is the tone of voice of video: a locked-off shot is restraint, an orbit is emphasis, handheld is documentary.",
    "cut": "Cut structure is the skeleton: one shot or many decides how many shot sizes you need to cover. A single take has no cut points, so blocking and camera movement have to carry the information; a storyboard cut can join different shot sizes and pack more in.",
    "arc": "The emotional arc is the skeleton of a storyboard. Four shots at one emotion read as flat; set an arc and each shot knows which part of the whole it carries.",
    "detail": "Visual details are the only way to make a description concrete. Anyone can write a person walking in the rain; raindrops on the umbrella and reflections in the puddle are what the model can actually draw.",
    "duration": "Duration decides what the model can output. Anything past 15 seconds has to be broken into shots, or it will drift.",
    "audio": "Sound is half the experience. If your tool has no audio, saying you do not need it keeps the visuals from being scored anyway."
  },
  "cues": {
    "textTask": "write|draft|summarize|summarise|analy|explain|translate|polish|rewrite|code|script|plan|report|copy|outline|email|brainstorm|come up with|name it|write me|generate an article|word count",
    "visual": "wearing|dressed in|sitting|standing|lying|leaning|walking|running|flying over|hovering|from behind|profile|close-up|close up|medium shot|wide shot|camera|frame|background is|lighting|color tone|colour tone|atmosphere|depth of field|bokeh|texture|illustration|photorealistic|cyberpunk|anime|a cat|a dog|a woman|a man|street|city street|night scene|neon|reflection|shadow|snow mountain|lake|forest|desert|sky|sunlight|moonlight|neon light|room|indoor|building|skyscraper|rooftop|floor|grass|beach|subway|cafe|bookstore|dining table|leaves|dusk|dawn|evening|sunrise|sunset|starry sky|galaxy|mist|puddle|balcony|windowsill|alley",
    "motion": "walking|running|flying over|falling|flowing|turning|looking back|timelapse|time-lapse|slow motion|slow-mo|camera move|camera movement|one take|multiple shots|shot change|cut between shots|shoot a|filming|camera (push|pull|pan|tilt|track|rise|fall)"
  },
  "recommendRules": {
    "img.subject": [
      [
        "isub.person",
        "/portrait|person|people|\\bman\\b|\\bwoman\\b|girl|boy|young girl|young boy|elderly|\\bchild\\b|model|youth|from behind|back view|side profile/i"
      ],
      [
        "isub.animal",
        "/\\bcat\\b|\\bcats\\b|kitten|\\bdog\\b|\\bdogs\\b|puppy|bird|animal|pet|tiger|lion|wolf|rabbit|horse|bear|panda|fox|whale|fish|dragon|butterfly|eagle|deer/i"
      ],
      [
        "isub.food",
        "/food|dish|cuisine|meal|noodle|\\brice\\b|coffee|cake|dessert|fruit|drink|\\bwine\\b|\\btea\\b/i"
      ],
      [
        "isub.product",
        "/product|bottle|perfume|\\bwatch\\b|shoe|sneaker|bag|cosmetic|skincare|beverage|packaging|headphone|phone/i"
      ],
      [
        "isub.vehicle",
        "/\\bcar\\b|\\bcars\\b|mecha|spaceship|robot|motorcycle|aircraft|\\bplane\\b|tank|warship|vehicle|truck|\\btrain\\b/i"
      ],
      [
        "isub.arch",
        "/architecture|interior|room|living room|office|store|church|bridge|skyscraper|space design/i"
      ],
      [
        "isub.scene",
        "/landscape|city|mountain|\\bsea\\b|forest|desert|snow|sky|street|night view|sunrise|sunset|grassland|lake|starry|\\brain\\b/i"
      ],
      [
        "isub.abstract",
        "/abstract|concept|emotion|loneliness|freedom|\\btime\\b|memory|dream/i"
      ]
    ],
    "img.ratio": [
      [
        "irat.p916",
        "/9:16|vertical|phone wallpaper|short video cover|douyin|tiktok|xiaohongshu|rednote|wechat moments/i"
      ],
      [
        "irat.l169",
        "/16:9|landscape|wallpaper|slide|deck|video cover|desktop|website|banner/i"
      ],
      [
        "irat.square",
        "/1:1|square|avatar|e-commerce|logo/i"
      ],
      [
        "irat.p34",
        "/3:4|poster|xiaohongshu|rednote|\\bcover\\b/i"
      ]
    ],
    "vid.ratio": [
      [
        "vrat.p916",
        "/9:16|douyin|tiktok|xiaohongshu|rednote|reels|vertical|phone/i"
      ],
      [
        "vrat.l169",
        "/16:9|bilibili|website|youtube|landscape|promo video/i"
      ],
      [
        "vrat.square",
        "/1:1|square|feed|\\bads?\\b|advert/i"
      ]
    ]
  },
  "signalLabels": {
    "text": [
      [
        "hasRole",
        "Role"
      ],
      [
        "hasAudience",
        "Audience"
      ],
      [
        "hasFormat",
        "Format"
      ],
      [
        "hasTone",
        "Tone"
      ],
      [
        "hasConstraint",
        "Constraints"
      ],
      [
        "hasExample",
        "Examples"
      ],
      [
        "hasBackground",
        "Context"
      ]
    ],
    "image": [
      [
        "hasSubject",
        "Subject"
      ],
      [
        "hasComposition",
        "Composition"
      ],
      [
        "hasLighting",
        "Lighting"
      ],
      [
        "hasStyle",
        "Style"
      ],
      [
        "hasColor",
        "Color"
      ],
      [
        "hasRatio",
        "Aspect ratio"
      ],
      [
        "hasNegative",
        "Negative constraints"
      ]
    ],
    "video": [
      [
        "hasSubject",
        "Subject"
      ],
      [
        "hasAction",
        "Action"
      ],
      [
        "hasShot",
        "Shot size"
      ],
      [
        "hasMove",
        "camera movement"
      ],
      [
        "hasStyle",
        "Look"
      ],
      [
        "hasLighting",
        "Lighting"
      ],
      [
        "hasDuration",
        "Duration"
      ],
      [
        "hasAudio",
        "Audio"
      ],
      [
        "hasNegative",
        "Negative constraints"
      ]
    ]
  },
  "scoreItems": {
    "text": [
      {
        "key": "task",
        "label": "Task clarity",
        "weight": 20,
        "hint": "Whether it says what to do"
      },
      {
        "key": "role",
        "label": "Role",
        "weight": 12,
        "hint": "Whether an AI role is specified"
      },
      {
        "key": "context",
        "label": "Context",
        "weight": 16,
        "hint": "Whether the background and the audience are stated"
      },
      {
        "key": "format",
        "label": "Output spec",
        "weight": 16,
        "hint": "Whether format, length and structure are set"
      },
      {
        "key": "style",
        "label": "Tone & depth",
        "weight": 14,
        "hint": "Whether tone and level of detail are set"
      },
      {
        "key": "constraint",
        "label": "Constraints",
        "weight": 12,
        "hint": "Whether it rules out what not to do"
      },
      {
        "key": "example",
        "label": "Examples",
        "weight": 10,
        "hint": "Whether a reference example is given"
      }
    ],
    "image": [
      {
        "key": "subject",
        "label": "Subject",
        "weight": 24,
        "hint": "Whether it says what is being drawn"
      },
      {
        "key": "composition",
        "label": "Composition",
        "weight": 16,
        "hint": "Shot size, angle and aspect ratio"
      },
      {
        "key": "lighting",
        "label": "Lighting",
        "weight": 16,
        "hint": "Direction and quality of the light"
      },
      {
        "key": "style",
        "label": "Style",
        "weight": 18,
        "hint": "Whether the visual style is clear"
      },
      {
        "key": "color",
        "label": "Color",
        "weight": 12,
        "hint": "Overall color tendency"
      },
      {
        "key": "negative",
        "label": "Negative constraints",
        "weight": 14,
        "hint": "What problems are ruled out"
      }
    ],
    "video": [
      {
        "key": "subject",
        "label": "Subject & action",
        "weight": 22,
        "hint": "What is drawn and what happens"
      },
      {
        "key": "shot",
        "label": "Shot size",
        "weight": 13,
        "hint": "Which shot sizes are used"
      },
      {
        "key": "move",
        "label": "Camera movement",
        "weight": 15,
        "hint": "How the camera moves"
      },
      {
        "key": "style",
        "label": "Look",
        "weight": 16,
        "hint": "Overall image texture"
      },
      {
        "key": "lighting",
        "label": "Lighting",
        "weight": 12,
        "hint": "What the light is like"
      },
      {
        "key": "audio",
        "label": "Audio",
        "weight": 10,
        "hint": "What it sounds like"
      },
      {
        "key": "negative",
        "label": "Negative constraints",
        "weight": 12,
        "hint": "What problems are ruled out"
      }
    ]
  },
  "frameModeLabels": {
    "none": "Not set",
    "text": "Text to image",
    "file": "From file",
    "prev": "Continue from previous shot"
  },
  "extractPatterns": {
    "image": {
      "hasComposition": "wide shot|medium shot|close-up|close up|extreme close|top-down|low angle|high angle|eye level|point of view|composition|rule of thirds|centered|centred|negative space|macro|aerial|symmetr",
      "hasLighting": "light|lighting|backlit|back-lit|side light|soft light|hard light|neon|dusk|golden hour|ambient|dark tone|high key|low key",
      "hasStyle": "style|photoreal|illustration|anime|manga|3d|render|oil painting|ink wash|cyberpunk|film look|pixel|photo|hand drawn|concept art|watercolor|watercolour|flat design",
      "hasColor": "color|colour|palette|warm tone|cool tone|black and white|monochrome|saturation|saturated|muted|sepia",
      "hasRatio": "\\d+\\s*:\\s*\\d+|aspect ratio|square|portrait orientation|landscape orientation|vertical|horizontal|full frame",
      "hasNegative": "no |avoid|without|exclude|do not|don't|do n't|not |negative prompt"
    },
    "video": {
      "hasAction": "action|turn|walk|walking|run|running|fly|flying|raise|enter|leave|change|interact|talk|smile|nod|wind|flow|move|moving|dance|jump|reach",
      "hasShot": "shot|close-up|close up|medium shot|wide shot|establishing|extreme|angle|framing",
      "hasMove": "camera move|camera movement|push in|pull out|pan left|pan right|camera pan|tilt|track|tracking|orbit|dolly|handheld|aerial|drone|locked off|static camera|long take|one take|zoom",
      "hasStyle": "style|cinematic|documentary|commercial|anime|animation|stop motion|vhs|cyberpunk|realistic|texture|film look",
      "hasLighting": "light|lighting|night|daylight|backlit|back-lit|neon|golden hour|sunset",
      "hasDuration": "\\d+\\s*(s|sec|secs|second|seconds)\\b|duration|how long|minutes|storyboard|one shot|single shot",
      "hasAudio": "soundtrack|background music|bgm|ambient sound|sound effect|sfx|voiceover|voice-over|narration|dialogue|audio track|mute|silent|no audio|music",
      "hasNegative": "no |avoid|without|exclude|do not|don't|do n't|not |negative prompt"
    },
    "text": {
      "hasRole": "you are (a|an|the)|act as|acting as|play the role|pretend to be|role of|as an expert|as a senior",
      "hasAudience": "for (beginners|experts|children|students|managers|readers|users|my team)|audience|readers|aimed at|targeted at|written for|speaking to|explain to|non-technical",
      "hasFormat": "format|table|bullet|list|markdown|outline|word limit|\\d+\\s*words|structure|sections|json|code block|numbered|checklist|headings",
      "hasTone": "tone|style|voice|humor|humour|formal|casual|relaxed|serious|professional|friendly|rigorous|conversational",
      "hasConstraint": "do not|don't|do n't|avoid|must|never|required|make sure|without",
      "hasExample": "for example|for instance|e\\.g\\.|such as|example|sample|reference",
      "hasLength": "(\\d+)\\s*(words|characters|chars|pages?)|word count|length|one page|two pages|how many pages",
      "hasBackground": "background|because|since|currently|we (are|have)|our (company|team|product)|the context is|the situation is|the goal is|this is for"
    }
  },
  "extractFlags": {
    "image": {
      "hasComposition": "i",
      "hasLighting": "i",
      "hasStyle": "i",
      "hasColor": "i",
      "hasRatio": "i",
      "hasNegative": "i"
    },
    "video": {
      "hasAction": "i",
      "hasShot": "i",
      "hasMove": "i",
      "hasStyle": "i",
      "hasLighting": "i",
      "hasDuration": "i",
      "hasAudio": "i",
      "hasNegative": "i"
    },
    "text": {
      "hasRole": "i",
      "hasAudience": "i",
      "hasFormat": "i",
      "hasTone": "i",
      "hasConstraint": "i",
      "hasExample": "i",
      "hasLength": "i",
      "hasBackground": "i"
    }
  },
  "detailPatterns": {
    "visualSubject": "wearing|dressed in|standing|sitting|lying|leaning|holding|posing|portrait|a photo of|an image of|a picture of|a scene of|close-up of|shot of",
    "image": {
      "lighting": "soft|hard|warm|cool|backlit|back-lit|side lit|natural light|studio light",
      "style": "style|texture|look$",
      "color": "warm|cool|saturat|muted|monochrome|black and white"
    },
    "video": {
      "shot": "shot",
      "move": "push in|pull out|pan left|pan right|camera pan|panning|tilt|track|orbit|aerial|dolly|zoom",
      "style": "cinematic|documentar|commercial|anime|one take|film look",
      "lighting": "golden hour|night|backlit|back-lit",
      "audio": "soundtrack|background music|bgm|ambient sound|sound effect|sfx|voiceover|voice-over|narration|piano|cello|strings|rain sound|audio track|mute|silent"
    },
    "text": {
      "task": "write|please|i want|i need|i'd like|generate|create|analyze|analyse|design|organize|organise|give me|make",
      "role": "expert|senior|professional|specialist",
      "format": "table|list|bullet|outline|json",
      "styleTone": "tone|voice|style|formal|casual|humor|humour|rigorous|plain|professional|friendly",
      "styleDepth": "in depth|in-depth|detailed|brief|overview|high level|concise|step by step|expand"
    }
  },
  "detailFlags": {
    "visualSubject": "i",
    "image": {
      "lighting": "i",
      "style": "i",
      "color": "i"
    },
    "video": {
      "shot": "i",
      "move": "i",
      "style": "i",
      "lighting": "i",
      "audio": "i"
    },
    "text": {
      "task": "i",
      "role": "i",
      "format": "i",
      "styleTone": "i",
      "styleDepth": "i"
    }
  }
};

  root.PromptLensLocales = root.PromptLensLocales || {};
  root.PromptLensLocales['en'] = locale;
  if (typeof module !== 'undefined' && module.exports) module.exports = locale;
})(typeof globalThis !== 'undefined' ? globalThis : this);
