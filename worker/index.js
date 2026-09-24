/* PromptLens · Cloudflare Workers 版后端
 * ====================================================================
 * 这个文件和 `server.js` 是**同一套接口的两个运行时实现**：
 *   · `server.js`      —— 本地开发 / 自校验用。Node 原生 http + fs，数据落在
 *                         `data/db.json`（单文件 JSON，内存缓存 + 防抖落盘）。
 *   · `worker/index.js` —— 线上部署用。fetch 处理器 + 静态资源绑定 + D1。
 *
 * 为什么是「两个实现」而不是「抽一层公共代码」：
 *   1. `server.js` 上有两条**读源码**的断言 —— `test-engine.js` 会检查
 *      「entry 字段必须都登记进落盘白名单」，`mutation-check-ui.js` 有一条变异
 *      直接改 `server.js` 里那段白名单。把这段代码抽走，这两条会一起失效，
 *      而它们正是「落盘会不会静默丢字段」唯一的证据。
 *   2. 两边的**存储形态本来就不同**（单文件 JSON ↔ 关系表），
 *      硬抽出来的「公共层」会变成一层只服务于抽象的胶水。
 *
 * 所以这里**逐条对齐** server.js 的行为，包括：
 *   · 响应信封 `{ok:true,data}` / `{ok:false,error}`
 *   · 状态码（400 / 401 / 404 / 405 / 409 / 500）
 *   · 落盘前的**白名单式构造**与截断长度（见 normalizeStoryboardEdit）
 *   · 密码 scrypt + 逐字节定时安全比较、会话 14 天
 *   · 静态资源的 `/login` 重写、目录 index、缺斜杠 301、`no-cache`
 *
 * ⚠️ 改这里的任何一条行为，都要问一句「server.js 那边要不要跟着改」——
 * 两边分叉的症状是「本地好好的，线上不对」，而两边各自的测试都不会红。
 */

import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';

/* ------------------------------------------------------------------ *
 * 常量（与 server.js 保持一致）
 * ------------------------------------------------------------------ */

const SESSION_TTL = 1000 * 60 * 60 * 24 * 14; // 14 天
const USERNAME_RE = /^[A-Za-z0-9_\u4e00-\u9fa5]{2,20}$/;
const BODY_LIMIT = 1024 * 1024; // 1MB，与 server.js 的 readBody 默认值一致

/* ------------------------------------------------------------------ *
 * 密码与会话
 * ------------------------------------------------------------------ */

/* ⚠️ 这里的算法必须和 server.js 逐字一致，否则本地注册的账号在线上登不上。
   scrypt 是 Node 专有 API —— 它在 Workers 上可用，但依赖 `nodejs_compat`
   （兼容日期 >= 2026-08-04 时默认开启，见 wrangler.toml 的 compatibility_date）。 */
function hashPassword(password, salt) {
  return scryptSync(password, salt, 64).toString('hex');
}

function verifyPassword(password, salt, expectedHex) {
  const expected = Buffer.from(expectedHex, 'hex');
  const actual = scryptSync(password, salt, 64);
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

function newId(prefix) {
  return prefix + '_' + randomBytes(9).toString('hex');
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.display_name || user.username,
    createdAt: user.created_at,
  };
}

/* ------------------------------------------------------------------ *
 * HTTP 小工具
 * ------------------------------------------------------------------ */

function jsonResponse(status, payload, extraHeaders) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: Object.assign({
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    }, extraHeaders || {}),
  });
}

const ok = (data, extraHeaders) =>
  jsonResponse(200, { ok: true, data: data === undefined ? null : data }, extraHeaders);

const fail = (status, message) => jsonResponse(status, { ok: false, error: message });

function parseCookies(request) {
  const header = request.headers.get('cookie') || '';
  const out = {};
  header.split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx === -1) return;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) {
      try { out[key] = decodeURIComponent(val); } catch (e) { out[key] = val; }
    }
  });
  return out;
}

/* `Secure` 只在 https 下加。
   server.js 不加是因为本地跑 http，加了浏览器直接丢掉这个 cookie。
   线上必须加 —— 但**不能无条件加**：`wrangler dev` 默认是 http://localhost，
   无条件加会让本地调试时「登录成功却一直是未登录」，而且完全不报错。
   判据用请求 URL 的协议，不用 `env`（部署在 workers.dev 与自定义域下都成立）。 */
function cookieHeader(token, maxAgeSeconds, secure) {
  const bits = [
    `pl_session=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (secure) bits.push('Secure');
  return bits.join('; ');
}

/* ------------------------------------------------------------------ *
 * 业务校验（与 server.js 同源，改一处要改两处）
 * ------------------------------------------------------------------ */

function validateCredentials(body) {
  const username = String((body && body.username) || '').trim();
  const password = String((body && body.password) || '');
  if (!USERNAME_RE.test(username)) {
    return { error: '用户名需为 2-20 位中文、字母、数字或下划线' };
  }
  if (password.length < 6 || password.length > 64) {
    return { error: '密码长度需在 6-64 位之间' };
  }
  return { username, password };
}

/**
 * 分镜的首帧 / 尾帧。**只做形状检查**，语义全部留给引擎的 sanitizeFrame ——
 * 「prev 在第一个分镜上不成立」这类规则会因为用户挪动镜头而变化，
 * 服务端既没有位置信息，也没有知识库。
 */
function normalizeStoryboardFrame(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const mode = String(raw.mode || '');
  if (mode !== 'text' && mode !== 'file' && mode !== 'prev') return null;
  const clip = (v, n) => String(v == null ? '' : v).slice(0, n);
  return {
    mode,
    text: clip(raw.text, 400),
    path: clip(raw.path, 600),
    name: clip(raw.name, 400),
    note: clip(raw.note, 400),
  };
}

/**
 * 用户手工调整过的分镜表，落盘前只做形状检查。
 *
 * ⚠️ 这是**白名单式**构造：entry 上加了新字段而这里忘了登记，
 * 症状是「编辑器里改得好好的，保存之后重新载入就没了」——
 * 数据在浏览器里是对的，只是没落盘。加字段时 server.js 和这里都要改。
 */
function normalizeStoryboardEdit(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  if (typeof raw.signature !== 'string' || !raw.signature) return null;
  if (!Array.isArray(raw.shots) || !raw.shots.length || raw.shots.length > 60) return null;
  return {
    signature: raw.signature.slice(0, 600),
    // 只截长度，不「修」值：seconds 不是数的时候要原样留给引擎去拒。
    shots: raw.shots.slice(0, 60).map((s) => ({
      shotId: String((s && s.shotId) || '').slice(0, 80),
      moveId: String((s && s.moveId) || '').slice(0, 80),
      seconds: s && s.seconds,
      cell: String((s && s.cell) == null ? '' : s.cell).slice(0, 400),
      focus: !!(s && s.focus),
      frameStart: normalizeStoryboardFrame(s && s.frameStart),
      frameEnd: normalizeStoryboardFrame(s && s.frameEnd),
    })),
  };
}

/* ------------------------------------------------------------------ *
 * 数据层（D1）
 * ------------------------------------------------------------------ */

/* 会话是**懒清理**的：每次建新会话顺手把过期的删掉。
   server.js 也是这个策略（createSession 里先 filter 一遍）。
   D1 没有定时任务，而 Cloudflare 的 Cron Triggers 需要另外配 ——
   懒清理的好处是「有没有清理」不依赖外部调度，代价只是表会暂时留着过期行。 */
async function createSession(env, userId) {
  const now = Date.now();
  await env.DB.prepare('DELETE FROM sessions WHERE expires_at <= ?').bind(now).run();
  const token = randomBytes(32).toString('hex');
  await env.DB.prepare(
    'INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)'
  ).bind(token, userId, now, now + SESSION_TTL).run();
  return { token, userId, createdAt: now, expiresAt: now + SESSION_TTL };
}

async function destroySession(env, token) {
  if (!token) return;
  await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
}

async function currentUser(env, request) {
  const token = parseCookies(request).pl_session;
  if (!token) return null;
  const session = await env.DB.prepare(
    'SELECT token, user_id, expires_at FROM sessions WHERE token = ?'
  ).bind(token).first();
  if (!session) return null;
  if (session.expires_at < Date.now()) {
    await destroySession(env, token);
    return null;
  }
  const user = await env.DB.prepare(
    'SELECT id, username, display_name, salt, password_hash, created_at FROM users WHERE id = ?'
  ).bind(session.user_id).first();
  return user || null;
}

/** 项目在库里存成一行 JSON（`data`），和 server.js 的 `db.projects[]` 一一对应。
 *  列只多存了 user_id / created_at / updated_at 三个**要用来排序和过滤**的字段 ——
 *  每次列表都去 parse 一遍 JSON 再排序，在几十条以内没问题，
 *  但排序字段放进列里能让 `ORDER BY` 走索引，且分页时不用全表 parse。 */
function projectFromRow(row) {
  try {
    return JSON.parse(row.data);
  } catch (e) {
    return null;
  }
}

function projectSummary(p) {
  return {
    id: p.id,
    title: p.title,
    scenarioName: p.scenarioName,
    family: p.family || 'text',
    originalPrompt: p.originalPrompt,
    finalPrompt: p.finalPrompt,
    scoreBefore: p.scoreBefore,
    scoreAfter: p.scoreAfter,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

/* ------------------------------------------------------------------ *
 * API 路由
 * ------------------------------------------------------------------ */

async function readBody(request) {
  const len = Number(request.headers.get('content-length') || 0);
  if (len > BODY_LIMIT) throw new Error('请求体过大');
  const raw = await request.text();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new Error('请求体不是合法 JSON');
  }
}

async function handleApi(request, env, url) {
  const pathname = url.pathname;
  const method = request.method.toUpperCase();
  // https 下才加 Secure（见 cookieHeader 的注释）
  const secure = url.protocol === 'https:';

  /* ---- 账号 ---- */

  if (pathname === '/api/auth/register' && method === 'POST') {
    const body = await readBody(request);
    const checked = validateCredentials(body);
    if (checked.error) return fail(400, checked.error);

    const exists = await env.DB.prepare(
      'SELECT id FROM users WHERE lower(username) = lower(?)'
    ).bind(checked.username).first();
    if (exists) return fail(409, '该用户名已被注册');

    const salt = randomBytes(16).toString('hex');
    const user = {
      id: newId('u'),
      username: checked.username,
      display_name: String(body.displayName || checked.username).trim().slice(0, 30)
        || checked.username,
      salt,
      password_hash: hashPassword(checked.password, salt),
      created_at: Date.now(),
    };
    await env.DB.prepare(
      'INSERT INTO users (id, username, display_name, salt, password_hash, created_at)'
      + ' VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(
      user.id, user.username, user.display_name, user.salt, user.password_hash, user.created_at
    ).run();

    const session = await createSession(env, user.id);
    return ok({ user: publicUser(user) }, {
      'Set-Cookie': cookieHeader(session.token, Math.floor(SESSION_TTL / 1000), secure),
    });
  }

  if (pathname === '/api/auth/login' && method === 'POST') {
    const body = await readBody(request);
    const username = String((body && body.username) || '').trim();
    const password = String((body && body.password) || '');
    if (!username || !password) return fail(400, '请输入用户名和密码');

    const user = await env.DB.prepare(
      'SELECT id, username, display_name, salt, password_hash, created_at FROM users'
      + ' WHERE lower(username) = lower(?)'
    ).bind(username).first();
    if (!user || !verifyPassword(password, user.salt, user.password_hash)) {
      return fail(401, '用户名或密码不正确');
    }

    const session = await createSession(env, user.id);
    return ok({ user: publicUser(user) }, {
      'Set-Cookie': cookieHeader(session.token, Math.floor(SESSION_TTL / 1000), secure),
    });
  }

  if (pathname === '/api/auth/logout' && method === 'POST') {
    const token = parseCookies(request).pl_session;
    if (token) await destroySession(env, token);
    return ok(null, { 'Set-Cookie': cookieHeader('', 0, secure) });
  }

  if (pathname === '/api/auth/me' && method === 'GET') {
    // 「探测当前会话」的接口，未登录属于正常状态，返回 200 + user:null，
    // 避免浏览器控制台出现红色报错。
    const user = await currentUser(env, request);
    return ok({ user: user ? publicUser(user) : null });
  }

  /* ---- 以下接口均需登录 ---- */

  const user = await currentUser(env, request);
  if (!user) return fail(401, '登录已过期，请重新登录');

  if (pathname === '/api/projects' && method === 'GET') {
    const rows = await env.DB.prepare(
      'SELECT data FROM projects WHERE user_id = ? ORDER BY updated_at DESC'
    ).bind(user.id).all();
    const list = (rows.results || [])
      .map(projectFromRow)
      .filter(Boolean)
      .map(projectSummary);
    return ok({ projects: list });
  }

  if (pathname === '/api/projects' && method === 'POST') {
    const body = await readBody(request);
    const now = Date.now();
    const project = {
      id: newId('p'),
      userId: user.id,
      title: String(body.title || '未命名 Prompt').slice(0, 80),
      scenarioId: body.scenarioId || 'general',
      scenarioName: body.scenarioName || '通用任务',
      family: body.family === 'image' || body.family === 'video' ? body.family : 'text',
      originalPrompt: String(body.originalPrompt || '').slice(0, 8000),
      finalPrompt: String(body.finalPrompt || '').slice(0, 20000),
      negativePrompt: String(body.negativePrompt || '').slice(0, 4000),
      answers: body.answers && typeof body.answers === 'object' ? body.answers : {},
      decisions: Array.isArray(body.decisions) ? body.decisions.slice(0, 200) : [],
      storyboardEdit: normalizeStoryboardEdit(body.storyboardEdit),
      scoreBefore: Number(body.scoreBefore) || 0,
      scoreAfter: Number(body.scoreAfter) || 0,
      createdAt: now,
      updatedAt: now,
    };
    await env.DB.prepare(
      'INSERT INTO projects (id, user_id, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(project.id, user.id, JSON.stringify(project), now, now).run();
    return ok({ project });
  }

  const projectMatch = pathname.match(/^\/api\/projects\/([A-Za-z0-9_]+)$/);
  if (projectMatch) {
    const id = projectMatch[1];
    const row = await env.DB.prepare(
      'SELECT data FROM projects WHERE id = ? AND user_id = ?'
    ).bind(id, user.id).first();
    const project = row ? projectFromRow(row) : null;
    if (!project) return fail(404, '记录不存在');

    if (method === 'GET') return ok({ project });

    if (method === 'PUT') {
      const body = await readBody(request);
      if (body.title !== undefined) project.title = String(body.title).slice(0, 80);
      if (body.finalPrompt !== undefined) project.finalPrompt = String(body.finalPrompt).slice(0, 20000);
      if (body.negativePrompt !== undefined) project.negativePrompt = String(body.negativePrompt).slice(0, 4000);
      if (body.answers !== undefined) project.answers = body.answers;
      if (body.decisions !== undefined && Array.isArray(body.decisions)) {
        project.decisions = body.decisions.slice(0, 200);
      }
      if (body.storyboardEdit !== undefined) {
        project.storyboardEdit = normalizeStoryboardEdit(body.storyboardEdit);
      }
      if (body.scoreAfter !== undefined) project.scoreAfter = Number(body.scoreAfter) || 0;
      project.updatedAt = Date.now();
      await env.DB.prepare(
        'UPDATE projects SET data = ?, updated_at = ? WHERE id = ? AND user_id = ?'
      ).bind(JSON.stringify(project), project.updatedAt, id, user.id).run();
      return ok({ project });
    }

    if (method === 'DELETE') {
      await env.DB.prepare('DELETE FROM projects WHERE id = ? AND user_id = ?')
        .bind(id, user.id).run();
      return ok({ id });
    }
  }

  return fail(404, '接口不存在');
}

/* ------------------------------------------------------------------ *
 * 静态资源
 * ------------------------------------------------------------------ */

const MIME_HINT = /\.([A-Za-z0-9]+)$/;

/* 和 server.js 的 sendFile 一样一律 no-cache。
   理由也照抄：这个项目没有构建步骤，文件名里没有内容哈希 ——
   用 max-age 缓存过之后会出现「代码明明改了、页面上还是旧样子」的假故障，
   而排查成本远高于省下的那点流量。
   ⚠️ 想改成「HTML no-cache、静态资源长缓存」的话，得先有内容哈希，
   否则就是给自己埋一个「用户看到的还是上一版」的坑。 */
function withNoCache(res) {
  const headers = new Headers(res.headers);
  headers.set('Cache-Control', 'no-cache');
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

function notFoundHtml() {
  return new Response('<h1>404</h1><p>页面不存在</p>', {
    status: 404,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function redirect301(location) {
  return new Response(null, {
    status: 301,
    headers: { Location: location, 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

async function fetchAsset(env, request, pathname) {
  const assetUrl = new URL(request.url);
  assetUrl.pathname = pathname;
  return env.ASSETS.fetch(new Request(assetUrl.toString(), {
    method: request.method === 'HEAD' ? 'HEAD' : 'GET',
    headers: request.headers,
  }));
}

async function serveStatic(request, env, url) {
  let rel = decodeURIComponent(url.pathname);
  if (rel === '/' || rel === '') rel = '/index.html';
  /* 登录页对外用干净地址 /login（/ 让给了公开落地页）。
     只认这一个映射：/login.html 本身也能直接打开，不用重定向，
     这样 file:// 下双击 login.html 和线上访问 /login 是同一条路径，行为不会分叉。 */
  if (rel === '/login' || rel === '/login/') rel = '/login.html';

  /* 目录 → 目录下的 index.html。
     静态资源绑定没有「这是不是一个目录」的概念（没有 fs.stat），
     所以用**探一下 `<path>/index.html` 在不在**代替。
     每语种的落地页就是 public/<tag>/index.html，缺了这一步
     /en/ /ja/ /ko/ /es/ /zh-Hant/ 会一律 404 —— 而文件明明躺在那里，最难查。 */
  if (!MIME_HINT.test(rel)) {
    const dir = rel.endsWith('/') ? rel : rel + '/';
    const probe = await fetchAsset(env, request, dir + 'index.html');
    if (probe.ok) {
      /* 没有结尾斜杠就 301 补上。
         否则 /en 和 /en/ 是两个地址同一页，而 canonical 只写了带斜杠的那个，
         属于自己给自己制造的重复内容 —— 搜索引擎会挑一个收录，另一个算重复。 */
      if (!rel.endsWith('/')) return redirect301(rel + '/');
      return withNoCache(probe);
    }
  }

  const res = await fetchAsset(env, request, rel);
  if (res.status === 404) return notFoundHtml();
  return withNoCache(res);
}

/* ------------------------------------------------------------------ *
 * 入口
 * ------------------------------------------------------------------ */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/')) {
      try {
        return await handleApi(request, env, url);
      } catch (err) {
        console.error('[api]', url.pathname, err && err.stack ? err.stack : err);
        return fail(500, (err && err.message) || '服务端异常');
      }
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return fail(405, '方法不允许');
    }

    return serveStatic(request, env, url);
  },
};
