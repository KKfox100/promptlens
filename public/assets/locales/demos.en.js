'use strict';

/**
 * PromptLens 文本对照示例 · en
 * ------------------------------------------------------------------
 * ⚠️ **这个文件是生成的，不要手改。**
 *    生成器：`node scripts/mk-demos-locale.js en`
 *    译文表：`scripts/i18n-src/en/demos/*.json`
 *
 * 结构是 `{ 题目id: { before, opts: { 选项id: 文本 } } }`，
 * 题目 / 选项 id 与语种无关（和界面文案那套「中文当 key」不同）。
 * 生成时会和 demos.js 的 TEXT 逐 id 对账，少一条就不写文件 ——
 * 对照示例缺一半，比整块不显示更容易让人以为是自己看错了。
 *
 * 壳必须照抄：和 knowledge.js 都是普通脚本，顶层 const 共用同一个全局
 * 词法作用域，裸写会 SyntaxError 且整页 JS 全挂。
 */

(function (root) {

const PACK = {
  "role": {
    "before": "AI customer service is a major direction for enterprise service upgrades, and it needs to be assessed across technology, cost, and experience all at once.",
    "opts": {
      "role.expert": "Start with three hard numbers: daily ticket volume, first-contact resolution rate, and labor cost share. Below 500 tickets a day, switching to AI rarely pays off.",
      "role.critic": "The premise doesn't hold. You're treating it as a cost-cutting tool, but what it really eats is customer trust, and nobody is counting that.",
      "role.doer": "It works, but in two steps: let AI absorb the 60% of routine questions first, with humans taking only complex tickets. You'll see numbers in two weeks.",
      "role.coach": "Hold off on replacing the system. Export last month's tickets and I'll walk you through which questions never needed a human in the first place.",
      "role.researcher": "The existing findings disagree: one report claims 30% savings, but the sample is mostly large enterprises. Whether it transfers to smaller operations is unclear.",
      "role.user": "Last time I contacted support I went around the bot three times and got nowhere, then queued for a human anyway. If you switch, don't make me do that again.",
      "role.beginner": "I don't know much about this. If we switch to AI support, can it actually understand what customers ask right off the bat?"
    }
  },
  "role.stance": {
    "before": "Short-form video is indeed an important channel for traffic growth right now, and increasing investment in it is a direction worth considering.",
    "opts": {
      "stance.honest": "Going all-in on short-form video is risky: if the platform changes its rules, your acquisition cost can double overnight.",
      "stance.balanced": "Going all-in gets you fast growth and cheap experimentation. The price is that the traffic belongs to the platform and you have very little leverage.",
      "stance.supportive": "Betting on short-form video is the right call, and growth really is fast. To make it steadier, hold back 20% of the budget for channels you own.",
      "stance.challenge": "You said all-in. Have you worked out what your fallback is if the platform changes its recommendation algorithm?"
    }
  },
  "audience": {
    "before": "The design of this feature followed user-centered principles, improving overall usage efficiency by optimizing the interaction path.",
    "opts": {
      "aud.public": "Put simply: two fewer taps. What used to take three menu levels now takes one.",
      "aud.peer": "We flattened the three-level navigation, cut two context switches, and first-screen conversion went up 11%.",
      "aud.decision": "Bottom line: this change lifts checkout conversion by 11% for two person-months of work. What needs your call is whether to push the next release.",
      "aud.client": "After the change, customers take two fewer steps from seeing a product to ordering. That's roughly one extra point of conversion for you.",
      "aud.student": "Start with a question: how many taps are you willing to make to buy a coffee? Our change drives that number as low as it goes.",
      "aud.self": "Flat navigation → two fewer taps → conversion +11%. TODO: add tracking, verify the gradual rollout."
    }
  },
  "audience.term": {
    "before": "The system adopts a retrieval-augmented generation architecture, combining vectorized recall with a reranking module, with the LLM finally organizing the answer.",
    "opts": {
      "term.explain": "The system uses RAG (look things up first, then answer). It pulls relevant passages from a vector database (a store that files information by meaning).",
      "term.direct": "The system uses RAG retrieval-augmented generation, drawing on a vector database to recall relevant passages.",
      "term.bilingual": "The system uses RAG (Retrieval-Augmented Generation), drawing on a vector database (Vector Database) to recall passages.",
      "term.avoid": "The system digs the most relevant passages out of its document store first, then answers from those instead of making things up from memory."
    }
  },
  "format": {
    "before": "Cooking at home and ordering delivery each have advantages and disadvantages, and the choice should be made according to your personal situation. Cooking at home is healthier and cheaper, while delivery saves time.",
    "opts": {
      "fmt.report": "## Conclusion\nCooking wins on long-term cost; delivery wins on time.\n\n## Cost comparison\n…\n\n## Recommendation\n…",
      "fmt.checklist": "1. Work out what an hour of your time is worth\n2. Total up a week of delivery receipts\n3. Compare that against ingredient costs for the same dishes\n4. Treat weekdays and weekends separately",
      "fmt.dialogue": "It's not that agonizing. If you free up an hour a day, then whether that hour is worth the price difference is your answer.",
      "fmt.table": "| Dimension | Cooking at home | Delivery |\n| --- | --- | --- |\n| Cost per meal | $15 | $35 |\n| Time | 50 min | 5 min |",
      "fmt.article": "A complete, publish-ready article of about 1,500 words with a real beginning and a real ending.",
      "fmt.code": "Runnable code, for example computing the break-even point for cooking at home from ingredient prices and time spent.",
      "fmt.outline": "1. Cost\n   1. Ingredients\n   2. Time\n2. Health\n   1. Oil and salt\n   2. Control over ingredients\n3. Conclusion",
      "fmt.message": "A message you can send your roommate as-is, with a greeting, the point, and a sign-off.",
      "fmt.slides": "Slide 1 | The problem: why the delivery bill keeps climbing\n- Monthly spend\n- Time cost\n\nSlide 2 | The plan: delivery on weekdays, cooking on weekends"
    }
  },
  "format.report.length": {
    "before": "By default AI writes 800-1,200 words with no clear emphasis. You finish reading and can't tell which sentence was the conclusion.",
    "opts": {
      "rlen.short": "About 700 words: the conclusion plus the two strongest pieces of evidence, readable in one page.",
      "rlen.mid": "About 1,500 words: conclusion, three lines of evidence, one section on risk. Two or three pages.",
      "rlen.long": "About 2,800 words: background, reasoning, data, risks, and recommendations, all covered."
    }
  },
  "format.report.structure": {
    "before": "## Analysis\nBody text only. No conclusion, no risks, no next steps.",
    "opts": {
      "rstr.conclusion": "## Conclusion first\n(State the verdict in the opening paragraph)\n\n## Analysis\n…",
      "rstr.evidence": "Point 1: … (data: 1,200 tickets sampled in 2024)\nPoint 2: … (case: Company A)",
      "rstr.table": "| Option | Cost | Timeline |\n| --- | --- | --- |\n| A | $120k | 3 months |",
      "rstr.risk": "## Risks and the counterargument\nIf the platform's rules change, the conclusion above no longer holds.",
      "rstr.action": "## Next steps\n1. This week: export the data (Ops)\n2. Next week: run the rollout (Eng)",
      "rstr.open": "## To confirm\n- What's the budget ceiling?\n- Is a delayed launch acceptable?"
    }
  },
  "format.checklist.granularity": {
    "before": "1. Get the materials ready\n2. Do the operation\n3. Complete the check",
    "opts": {
      "cgran.coarse": "1. Collect the last 30 days of tickets\n2. Group the high-frequency questions\n3. Configure automated replies\n4. Roll out gradually and watch",
      "cgran.medium": "1. Collect the last 30 days of tickets\n   What: export every ticket\n   How: Admin → Data → Export CSV\n   Done when: you have a CSV file",
      "cgran.fine": "1. Log in to the support console (use the admin account)\n2. Click \"Data\" → \"Tickets\" and set the range to \"Last 30 days\"\n3. Click \"Export\", format CSV, encoding UTF-8\n4. Open the file and sort by the \"Issue description\" column"
    }
  },
  "format.dialogue.length": {
    "before": "By default AI writes 600+ words and can't resist breaking them into bullet points.",
    "opts": {
      "dlen.short": "Yes, but only for standard products. Not for custom work.",
      "dlen.mid": "Yes, but it depends on the category. AI handles standard parts fine, with first-contact resolution around 70%. Custom orders are all about details, and when AI gets them wrong it costs more human time, not less.",
      "dlen.long": "Yes, but you have to break it down by category. … (three or four layers deep, in natural paragraphs throughout, never cut into a list)"
    }
  },
  "format.table.dimension": {
    "before": "| Option |\n| --- |\n| AI support |\n| Human support |",
    "opts": {
      "tdim.core": "| Option | Key trait |\n| --- | --- |\n| AI support | 24/7 instant replies |",
      "tdim.pro": "| Option | Strength |\n| --- | --- |\n| AI support | Low cost, no queueing |",
      "tdim.con": "| Option | Limitation |\n| --- | --- |\n| AI support | Unreliable on complex questions |",
      "tdim.scene": "| Option | Best for |\n| --- | --- |\n| AI support | High-frequency standard questions |",
      "tdim.cost": "| Option | Cost / effort |\n| --- | --- |\n| AI support | About 2 person-months to start |",
      "tdim.verdict": "| Option | Recommendation |\n| --- | --- |\n| AI support | Start with a gradual rollout |"
    }
  },
  "format.article.length": {
    "before": "By default AI writes around 1,000 words. Neither long nor short, with nothing chosen and nothing left out.",
    "opts": {
      "alen.short": "About 800 words, one single point, read in one sitting.",
      "alen.mid": "About 1,800 words with a real opening, a middle that develops, and an ending. A complete arc.",
      "alen.long": "3,000+ words, building layer by layer, every point backed by a concrete case."
    }
  },
  "format.article.structure": {
    "before": "By default AI writes the standard thesis-points-restated-thesis essay.",
    "opts": {
      "astr.hook": "Opening: \"Last week I deleted the 47th app on my phone.\"\nMiddle: why I deleted it, and what happened afterwards\nEnding: back to \"how many apps do we actually need\"",
      "astr.story": "The whole piece follows one specific person: he switched support systems three times and hit a different trap each time. The argument stays inside the story.",
      "astr.list": "1. The cost problem\n2. The experience problem\n3. The data problem\nThree standalone sections, so readers can jump around.",
      "astr.q": "Why is support getting harder to reach? → Because costs were squeezed to the limit. → So where did the savings go? → …"
    }
  },
  "format.code.language": {
    "before": "By default AI picks whatever is most mainstream, and it varies from run to run.",
    "opts": {
      "clang.unspecified": "I'll go with Python: the broadest ecosystem and the best community support. The reason is…",
      "clang.python": "Implemented in Python 3.11, following PEP 8.",
      "clang.js": "Implemented in TypeScript 5, following modern ES conventions.",
      "clang.other": "Implemented in whatever stack you specify."
    }
  },
  "format.code.comments": {
    "before": "By default AI either comments every single line or writes nothing at all.",
    "opts": {
      "ccmt.inline": "if cache.get(k):  # cache hit, return early so we don't hit the downstream API again",
      "ccmt.after": "(code)\n\nOverall approach: check the cache first, fall back to the origin on a miss, and deduplicate during the origin fetch.",
      "ccmt.both": "Key comments inline, plus a short explanation of the overall approach after the code.",
      "ccmt.none": "Just the code block, not a single word of explanation."
    }
  },
  "format.outline.depth": {
    "before": "1. Cost\n2. Experience\n3. Conclusion",
    "opts": {
      "odep.two": "1. Cost\n   - Ingredients\n   - Time\n2. Health",
      "odep.three": "1. Cost\n   - Ingredients\n      - Price comparison for fresh produce\n      - Spoilage rate\n   - Time\n      - Prep time",
      "odep.withNote": "1. Cost\n   (this section asks \"is home cooking really cheaper\", using one month of receipts as the material)\n   - Ingredients…"
    }
  },
  "format.message.tone": {
    "before": "By default AI writes \"Hello, regarding this matter…\" and ends without asking for anything in particular.",
    "opts": {
      "mtone.push": "…so I'd like your confirmation by this Friday, which lets me line up the next step.",
      "mtone.explain": "…that's the current status. The impact is limited to A and B, nothing is needed from you right now, and I'll keep you posted on any change.",
      "mtone.negotiate": "…if you can spare one more person this round, you get the result two weeks earlier and I don't have to cut the testing phase.",
      "mtone.apologize": "…this one is on us. We planned the schedule badly. The fix: a usable version this week, the rest next week."
    }
  },
  "format.slides.count": {
    "before": "By default AI gives you around 10 slides.",
    "opts": {
      "scnt.short": "5-8 slides, one point each, good for a 10-minute talk.",
      "scnt.mid": "10-15 slides, covering background, the proposal, supporting data, and the conclusion.",
      "scnt.long": "20+ slides, with detailed reasoning, data, and an appendix."
    }
  },
  "tone": {
    "before": "This article will conduct a systematic analysis of the proposal from the three dimensions of cost, efficiency, and experience, with a view to providing a reference for decision-making.",
    "opts": {
      "tone.pro": "Across cost, efficiency, and experience, the proposal is feasible under current conditions, though the implementation timeline deserves attention.",
      "tone.warm": "This isn't as complicated as it looks. Let's look at three things and you'll have a clear picture.",
      "tone.sharp": "It saves 30% of the cost but takes two months longer. Whether that's worth it depends on whether you're short on money or short on time.",
      "tone.humor": "This proposal is like one-size-fits-all clothing: anyone can put it on, and it fits nobody well.",
      "tone.calm": "The proposal cuts cost by about 30% and adds about 2 months to the timeline. Both figures are quantifiable.",
      "tone.vivid": "Picture it: at month's end the bill is a third smaller, but your calendar has two full months of waiting added to it."
    }
  },
  "depth": {
    "before": "By default AI gives you a medium-length discussion with the conclusion and the reasoning jumbled together.",
    "opts": {
      "depth.min": "It can be done, but it doesn't pay off.",
      "depth.light": "It can be done. Two things to watch: the timeline stretches by two months, and first-contact resolution dips before it recovers.",
      "depth.mid": "It can be done, for three reasons: the cost structure…, the team's current state…, and industry precedent…. The third deserves the most attention.",
      "depth.deep": "It can be done, but only under narrow conditions. The reasoning: …; the boundary: 500+ tickets a day; a counterexample: Company B adopted it at 200 tickets a day and it cost them more; the unknown: long-term retention data is missing."
    }
  },
  "depth.why": {
    "before": "By default AI does explain, but it usually explains what something is rather than why.",
    "opts": {
      "why.no": "Let AI absorb the routine cases first, with humans taking only complex tickets.",
      "why.key": "Let AI absorb the routine cases and have humans take only complex tickets, because the metric that matters is first-contact resolution, not total volume handled.",
      "why.full": "Start with why the split works this way: the cost in support isn't the reply, it's the context switch. Every ticket means rereading the history, and that alone eats 40% of total hours. Handing standard questions to AI cuts most of that 40% away, so…"
    }
  },
  "constraints": {
    "before": "That's a great question! Let's look at it from a few angles… (ending) In summary, I hope this has been helpful to you.",
    "opts": {
      "con.nogreet": "Starts straight into the body. No \"that's a great question\".",
      "con.norepeat": "Doesn't restate your question. The first sentence is the answer.",
      "con.nohallucinate": "The industry was worth about $1.2 trillion in 2024 (I'm not certain of this figure, please verify).",
      "con.nodigress": "Answers only what you asked, without wandering into \"while we're here, let's talk about owned-channel marketing\".",
      "con.nosummary": "Stops after the last point. No \"in summary\".",
      "con.wordlimit": "Exactly 800 words. 799 or 801 both count as a miss.",
      "con.source": "Conversion up 11% (source: internal A/B test, 2026-03, n = 4,200).",
      "con.noemoji": "No decorative symbols like ✨🚀💡.",
      "con.noask": "I'm assuming 500 tickets a day. If your actual volume differs, the conclusion changes.",
      "con.askfirst": "Two things to confirm before I start: roughly how many tickets a day, and how many people handle them right now?"
    }
  },
  "antiAi": {
    "before": "First, we need to clarify the goal. Second, we must analyze the current state. Finally, it is worth noting that execution is what matters. In conclusion, I hope the above has been helpful to you.",
    "opts": {
      "ai.cliche": "No \"first / second / finally\", no \"it is worth noting\", no \"in conclusion\".",
      "ai.parallel": "No triads, meaning three parallel clauses in a row.",
      "ai.antithesis": "No \"not A, but B\" constructions.",
      "ai.rhythm": "Do the math first. Once you have, you'll see the expensive part isn't the food, it's the fifty minutes you spend at the stove.",
      "ai.concrete": "A delivery meal is $35. Cooking it yourself is $15. The $20 difference buys you 45 minutes.",
      "ai.colloquial": "Honestly, I used to do the same. Then I ran the numbers and stopped bothering to order.",
      "ai.noperpara": "Paragraphs no longer end on a summary sentence. The content just carries forward.",
      "ai.hedge": "No hedging like \"to some extent\" or \"in a sense\".",
      "ai.emotion": "The ending doesn't inflate into \"this isn't just cooking, it's a way of life\".",
      "ai.contrast": "No more dashes used for asides and reversals."
    }
  },
  "examples": {
    "before": "AI hands you the finished thing, and you have no idea whether it understood you correctly.",
    "opts": {
      "ex.good": "Here's an example I think is well written: \"…\". What makes it good: …. I'll write to this standard below.",
      "ex.contrast": "Good: \"A delivery meal is $35; cooking it yourself is $15.\"\nBad: \"In summary, I hope this helps.\"\nThe difference: all boilerplate, not one piece of concrete information.",
      "ex.none": "Skip the examples and give me the finished thing."
    }
  }
};

root.PromptLensDemosText = root.PromptLensDemosText || {};
root.PromptLensDemosText['en'] = PACK;

if (typeof module !== 'undefined' && module.exports) module.exports = PACK;

})(typeof globalThis !== 'undefined' ? globalThis : this);
