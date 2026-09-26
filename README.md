# PromptLens

> 不懂 Prompt，也能写出高质量提示词。

很多人不是「不会用 AI」，而是**不知道该怎么跟 AI 说**。PromptLens 把这件事拆成一轮轮
小问题：你只管选（要什么风格、给谁看、多长、要不要例子……），它把选择拼成一份
结构完整、可以直接粘给 AI 的提示词，并给出一个「改前 / 改后」的对照。

支持**文字 / 图片 / 视频**三类需求，界面有**六种语言**（简体中文、繁體中文、English、日本語、한국어、Español）。

---

## 核心理念：把每一个决定权交回用户

这是产品最要紧的一条，也是所有设计取舍的源头：

> **自动化只做「提示」，不替用户做「选择」。**

系统可以推荐（比如在某个选项上标一个「推荐」），但**不会替你勾上**。你答过的每一道题，
最终都会出现在那份提示词里 —— 如果某道题的答案没有采用，界面必须**说清楚为什么**。

这条同时是「消除 AI 味」的实现方式：一份由你自己逐项决定出来的提示词，
不会长成那种四平八稳、什么都沾一点、什么都不像的机器腔。

---

## 快速开始

不需要安装任何东西，不需要构建步骤：

```bash
node server.js
# → http://127.0.0.1:5178
```

打开后是公开落地页。**主按钮是「免注册试用」** —— 不用注册就能走完整条链路，
但免注册模式**不保存任何记录**：不写库、不进历史，关掉页面即清空。
想留存记录再登录/注册（登录时会把免注册期间已经做过的选择**带过去**）。
数据落在 `data/db.json`，该目录不会进版本库。

> 为什么闸门是**显式的**（`?guest=1`）而不是「没会话就静默降级」：
> 静默降级的话，一个**过期的会话**也会悄悄变成不保存，而用户还以为自己在账号里 ——
> 那正是这个项目里最高频的一类 bug。同理，免注册→登录的交接暂存在
> `sessionStorage`（只活当前标签页）而不是 `localStorage`，这样「退出即清空」
> 这条承诺不会因为多了交接功能而漏出一个持久化的口子。

### 只想看看界面

`public/` 是**没有构建步骤**的静态站点，资源全部用相对路径 ——
直接双击 `public/index.html` 用 `file://` 打开也能用（只是没有账号与历史记录，
这两样需要后端）。

---

## 目录结构

```
public/                     静态站点（无构建、无框架）
  index.html                公开落地页（简体中文）
  en/ ja/ ko/ es/ zh-Hant/  另外五个语种的落地页
  login.html  app.html      登录页 / 工作台
  assets/
    css/main.css            全部样式，一套「纸墨」体系
    js/
      knowledge.js          **结构骨架**：题目、选项、维度、权重、流程顺序
      engine.js             引擎：多轮拆解、评分、拼装最终提示词
      workspace.js          工作台界面
      i18n.js               语言切换
      landing-lang.js       落地页语种识别与跳转
    locales/*.js            **全部给人看的字**（六种语言）
  llms.txt  llms-full.txt   给大模型读的站点摘要
  robots.txt  sitemap.xml

server.js                   本地后端（Node 原生 http/fs/crypto）
worker/                     线上后端（Cloudflare Workers）
  index.js                  fetch 处理器：API + 静态资源
  schema.sql                D1（SQLite）表结构
wrangler.toml               部署配置

scripts/                    自校验与生成器（见下）
samples/                    示例素材
.impeccable.md              设计上下文：为谁做、该给人什么感觉
```

---

## 技术选择（以及为什么）

**零第三方依赖。** 后端只用 Node 原生的 `http` / `fs` / `crypto`；前端没有框架、
没有打包器；连生成分享图、解析 PNG 这类脚本也自己写。理由不是「炫技」，是：
这个项目的每一处取舍都需要能被人读懂、能被人改，而依赖会让「为什么是这样」
藏进别人的代码里。

**没有构建步骤。** `public/` 里的东西就是浏览器拿到的东西。改一行 CSS，
刷新就能看见，不存在「源码改了但产物没更新」这类假故障。

**结构与文案分开。** `knowledge.js` 放骨架（题目 id、选项、维度、权重、流程顺序），
`assets/locales/<tag>.js` 放所有给人看的字**和认字用的正则**。
语种包是**生成物**（`scripts/mk-locale.js` 等），手改等于没改。

**视觉走「纸墨」体系**（完整规则见 `.impeccable.md` 与 `assets/css/main.css` 顶部）：
圆角 2~6px、阴影只给浮层、朱红 `#b33a26` 是全站唯一的填充色、
正文用系统字族而衬线只给标题。**类名是冻结的 —— 只许换皮，不许改名。**

---

## 自校验

这个项目里，「我改对了」不靠眼睛看，靠一套能证伪的检查。
（详细的方法论写在 `scripts/` 各文件顶部的注释里。）

```bash
node scripts/test-engine.js          # 引擎：126 条
node scripts/check-landing.js        # 落地页静态：263 条
node scripts/check-llmo.js           # 给大模型读的摘要：170 条
node scripts/check-locale-parity.js  # 六语种行为一致性
node scripts/check-locale-corpus.js  # 六语种语料自检

node server.js &                     # 下面这些需要服务在跑
node scripts/browser-check.js        # 界面：573 条（含手机/iPad/极窄屏/免注册模式/顶栏预算）
node scripts/browser-check-file.js   # file:// 数据层：16 条
node scripts/check-landing-live.js   # 落地页实机：637 条（六语种 × 六种宽度）
node scripts/check-api.js            # 接口契约：50 条（打 Node 后端）
```

### 接口契约：两份实现靠它对齐

`server.js`（本地）与 `worker/index.js`（线上）是**同一套接口的两个实现**。
两边分叉的症状是「本地好好的、线上不对」—— 而两边各自的测试都不会红，
因为它们各测各的。

`check-api.js` 只认**接口契约**（响应信封、状态码、字段形状、Cookie 属性、
静态路由规则），不认文案；打哪个后端由 `BASE` 决定：

```bash
BASE=http://127.0.0.1:8787  node scripts/check-api.js   # 本地 Worker
NODE_TLS_REJECT_UNAUTHORIZED=0 \
  BASE=https://127.0.0.1:8790 node scripts/check-api.js # https 实例
```

**两个协议都要跑。** `Secure` 那条断言是**跟着协议变**的：https 下必须带、
http 下必须没有 —— 各只覆盖一边。想造 https 环境：
`npx wrangler dev --local-protocol https --port 8790`。

⚠️ 它会往库里写一个 `apitest…` 账号（记录会删，账号留着）。**别拿它打线上。**

**变异测试** —— 故意把源码改坏，确认断言真的会红：

```bash
node scripts/check-mutation-anchors.js   # 先做 5 秒静态预检（锚点还在不在）
node scripts/mutation-check.js           # 引擎：48 条
node scripts/mutation-check-ui.js        # 界面：32 条（约 2 小时，需先停掉 5178）

# 只跑一段（1 起的序号，含首含尾）—— 改完一小块时不必等全套
MUT_FROM=31 MUT_TO=32 PORT=5179 node scripts/mutation-check-ui.js
```

⚠️ 用 `PORT=5179` 绕开 5178 上那个**不是自己起的**服务，比去杀它安全
（脚本自己拉起服务并把 `BASE` 传给子进程；`PORT` 是它自己的服务端口，
不是 `browser-check.js` 的 `BASE` —— 两者别类推）。

`check-mutation-anchors.js` 值得单独说：变异脚本最容易失败的方式不是「没抓到」，
而是「锚点找不到」—— 报错只说「命中 0 次」，而一轮要跑两小时。
它先静态确认每条锚点在目标文件里**恰好命中一次**，把两小时的往返压到 5 秒。

---

## 部署到 Cloudflare Workers

线上后端是 `worker/index.js`，静态资源交给 Workers 的静态资源绑定，
数据用 D1（SQLite）。**接口与 `server.js` 逐条对齐**（响应信封、状态码、
落盘前的白名单构造、密码算法、静态资源的 `/login` 重写与 301 规则）。

```bash
# 1. 装部署工具（运行时仍然是零依赖，这只是 devDependency）
npm install

# 2. 登录（会打开浏览器授权）
npx wrangler login

# 3. 建库：把输出里的 database_id 填进 wrangler.toml
npx wrangler d1 create promptlens

# 4. 建表
npx wrangler d1 execute promptlens --remote --file=worker/schema.sql

# 5. 部署
npx wrangler deploy
```

部署后是 `https://promptlens.<你的账号>.workers.dev`。

### 本地调试 Worker

```bash
npx wrangler dev
```

它会用本地的 D1 与静态资源模拟，不连 Cloudflare、不花钱。
第一次要先建本地表：

```bash
npx wrangler d1 execute promptlens --local --file=worker/schema.sql
```

---

## 改动前请先读

1. **`.gitattributes` 关掉了换行符自动转换，别改回去。**
   `scripts/browser-check.js` 是纯 CRLF，而它和 `mutation-check-ui.js` 里的
   多行锚点按各自文件的行尾拼。行尾被 git 转换过之后，锚点会「命中 0 次」，
   而报错只说锚点找不到，看着像内容写错了。
2. **`server.js` 与 `worker/index.js` 是同一套接口的两个实现。**
   改了一边要问一句「另一边要不要跟着改」—— 两边分叉的症状是
   「本地好好的、线上不对」，而两边各自的测试都不会红。
3. **改样式前先读 `.impeccable.md`。** 类名冻结、朱红是唯一填充色、
   圆角 2~6px —— 这些不是审美偏好，是让六种语言、四种屏幕都能看的前提。
4. **新加一个字段时，落盘白名单要一起改。** 那是白名单式构造，
   忘了登记的症状是「界面上改得好好的，保存后重新载入就没了」——
   数据在浏览器里是对的，只是没落盘。
5. **响应式断点是「有理由的」，不是随手挑的。** 顶栏的预算分两层，
   而下面那一层的 980 之所以是 980，是因为 `.icon-toggle { display: inline-flex }`
   就挂在 `@media (max-width: 980px)` 上 —— **顶栏在 980px 以下会多出
   「记录」「预览」两个按钮**。预算只写到 720 的话，721~980（iPad 竖屏 768）
   整段没人管：实测西语在 768 上溢出 119px，而所有断言都是绿的 ——
   溢出被 `.app-shell { overflow: hidden }` 裁掉了，判据量的是
   `documentElement`，那个数**恒等于 0**。
   改顶栏之前先读 `main.css` 里那两节的注释。
6. **同一个控件挂两处时，两处都要有断言。** 语言切换器在窄屏顶栏放不下，
   所以在账号菜单里也挂了一份（`#langSlot` / `#langSlotMenu`，两个 id 不能重名，
   `mountSwitcher` 调两次）。顶栏那份窄屏是 `display: none` ——
   忘了第二次挂载，手机用户就**再也换不了语种**，页面不崩不报错。
7. **藏一整栏之前，先看这一栏里还有什么。** 登录页左栏 `.auth-brand`
   在 ≤980 是 `display: none`，藏的是**品牌宣传语** —— 可
   「← 返回首页」和 logo 也挂在里面（`login.html` 第 28 / 67 行），
   于是所有手机上的登录页都没有回首页的入口。实测 390 上 `.auth-back` 数量为 0。
   **装饰可以藏，导航不行。** 修法是新增 `.auth-back-narrow` 挂在表单区顶部、
   只在 ≤980 显示（与第 6 条同一招），并且**两个方向各一条断言**：
   窄屏那份在、宽屏那份不多。
