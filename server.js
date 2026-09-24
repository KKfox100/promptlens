'use strict';

/**
 * PromptLens 服务端
 * 零第三方依赖：Node 原生 http + fs + crypto
 * 提供静态资源托管、账号体系、Prompt 项目历史存储
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.PORT || 5178);
const HOST = process.env.HOST || '127.0.0.1';
const ROOT = __dirname;
/* 静态目录可以被环境变量顶掉，`data/` 不行 —— 这是给 mutation-check-ui.js 用的：
   它把 public/ 复制一份到临时目录、在副本上改坏，再起一个服务指向副本。
   这样**脚本被中途杀掉也伤不到真正的源码**（以前是直接改 live tree，
   被 SIGTERM 打断过一次，main.css 的 dvh 和 app.html 的 noindex 都没还原回来）。
   数据文件必须共用：浏览器套件要登录态，换一份空的库整个套件就跑不起来。 */
const PUBLIC_DIR = process.env.PL_PUBLIC_DIR
  ? path.resolve(process.env.PL_PUBLIC_DIR)
  : path.join(ROOT, 'public');
const DATA_DIR = path.join(ROOT, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const SESSION_TTL = 1000 * 60 * 60 * 24 * 14; // 14 天

/* ------------------------------------------------------------------ *
 * 数据层：单文件 JSON 存储（内存缓存 + 防抖落盘）
 * ------------------------------------------------------------------ */

const EMPTY_DB = () => ({ users: [], sessions: [], projects: [] });
let db = EMPTY_DB();
let writeTimer = null;

function ensureData() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(DB_FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      db = {
        users: Array.isArray(parsed.users) ? parsed.users : [],
        sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
        projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      };
    } catch (err) {
      console.error('[db] 数据文件损坏，已重置:', err.message);
      db = EMPTY_DB();
      flush();
    }
  } else {
    db = EMPTY_DB();
    flush();
  }
}

function flush() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error('[db] 写入失败:', err.message);
  }
}

function persist() {
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = setTimeout(() => {
    writeTimer = null;
    flush();
  }, 120);
}

/* ------------------------------------------------------------------ *
 * 密码与会话
 * ------------------------------------------------------------------ */

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function verifyPassword(password, salt, expectedHex) {
  const expected = Buffer.from(expectedHex, 'hex');
  const actual = crypto.scryptSync(password, salt, 64);
  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
}

function newId(prefix) {
  return prefix + '_' + crypto.randomBytes(9).toString('hex');
}

function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const session = { token, userId, createdAt: Date.now(), expiresAt: Date.now() + SESSION_TTL };
  db.sessions = db.sessions.filter((s) => s.expiresAt > Date.now());
  db.sessions.push(session);
  persist();
  return session;
}

function destroySession(token) {
  const before = db.sessions.length;
  db.sessions = db.sessions.filter((s) => s.token !== token);
  if (db.sessions.length !== before) persist();
}

/* ------------------------------------------------------------------ *
 * HTTP 工具
 * ------------------------------------------------------------------ */

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
};

function sendJSON(res, status, payload, extraHeaders) {
  const body = JSON.stringify(payload);
  res.writeHead(status, Object.assign({
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
  }, extraHeaders || {}));
  res.end(body);
}

function ok(res, data, extraHeaders) {
  sendJSON(res, 200, { ok: true, data: data === undefined ? null : data }, extraHeaders);
}

function fail(res, status, message) {
  sendJSON(res, status, { ok: false, error: message });
}

function readBody(req, limit = 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error('请求体过大'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(new Error('请求体不是合法 JSON'));
      }
    });
    req.on('error', reject);
  });
}

function parseCookies(req) {
  const header = req.headers.cookie || '';
  const out = {};
  header.split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx === -1) return;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(val);
  });
  return out;
}

function cookieHeader(token, maxAgeSeconds) {
  const bits = [
    `pl_session=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSeconds}`,
  ];
  return bits.join('; ');
}

function currentUser(req) {
  const token = parseCookies(req).pl_session;
  if (!token) return null;
  const session = db.sessions.find((s) => s.token === token);
  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    destroySession(token);
    return null;
  }
  const user = db.users.find((u) => u.id === session.userId);
  return user || null;
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName || user.username,
    createdAt: user.createdAt,
  };
}

/* ------------------------------------------------------------------ *
 * 业务校验
 * ------------------------------------------------------------------ */

const USERNAME_RE = /^[A-Za-z0-9_\u4e00-\u9fa5]{2,20}$/;

function validateCredentials(body) {
  const username = String(body.username || '').trim();
  const password = String(body.password || '');
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
 * 服务端既没有位置信息（它只看一条条 entry 的形状），也没有知识库。
 *
 * 这里唯一多知道的一件事是「哪些 mode 是合法字符串」，那是个封闭枚举，
 * 不是知识库。认不出来的当「没指定」，一个脏值不该让整张分镜表存不下去。
 */
function normalizeStoryboardFrame(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const mode = String(raw.mode || '');
  if (mode !== 'text' && mode !== 'file' && mode !== 'prev') return null;
  // 截长度时留出余量（引擎那边卡得更紧）—— 服务端只保证「写进磁盘的东西不会撑爆」，
  // 具体截到多少是引擎的业务判断，两边写同一个数字迟早会对不上。
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
 * 不在这里做业务校验（景别 id 存不存在、时长越没越界）—— 那是引擎
 * sanitizeEntries 的职责，服务端没有知识库、复制一份规则必然对不上。
 * 这里只保证「写进磁盘的东西至少是个 {signature, shots[]}」，
 * 免得一份乱七八糟的 JSON 把载入记录打崩。
 *
 * 注意这是**白名单式**构造：entry 上加了新字段而这里忘了登记，
 * 症状是「编辑器里改得好好的，保存之后重新载入就没了」——
 * 数据在浏览器里是对的，只是没落盘。加字段时两边都要改。
 */
function normalizeStoryboardEdit(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  if (typeof raw.signature !== 'string' || !raw.signature) return null;
  if (!Array.isArray(raw.shots) || !raw.shots.length || raw.shots.length > 60) return null;
  return {
    signature: raw.signature.slice(0, 600),
    // 只截长度，不「修」值：seconds 不是数的时候要原样留给引擎去拒（NaN → 整份作废），
    // 这里要是好心补成 0，引擎会把它夹成 1 秒 —— 用户会看到一张莫名其妙秒数的表。
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
 * 静态资源
 * ------------------------------------------------------------------ */

function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel === '/' || rel === '') rel = '/index.html';
  /* 登录页对外用干净地址 /login（/ 让给了公开落地页）。
     只认这一个映射：/login.html 本身也能直接打开，不用重定向，
     这样 file:// 下双击 login.html 和线上访问 /login 是同一条路径，行为不会分叉。 */
  if (rel === '/login' || rel === '/login/') rel = '/login.html';

  const target = path.resolve(PUBLIC_DIR, '.' + rel);
  if (!target.startsWith(PUBLIC_DIR)) {
    return fail(res, 403, '禁止访问');
  }

  fs.stat(target, (err, stat) => {
    if (err) return notFound(res);

    /* 目录 → 目录下的 index.html。
       每语种的落地页就是 public/<tag>/index.html，缺了这一步，
       /en/ /ja/ /ko/ /es/ /zh-Hant/ 本地一律 404 ——
       而文件明明躺在那里，最难查。 */
    if (stat.isDirectory()) {
      /* 没有结尾斜杠就 301 补上。
         否则 /en 和 /en/ 是两个地址同一页，而 canonical 只写了带斜杠的那个，
         属于自己给自己制造的重复内容 —— 搜索引擎会挑一个收录，另一个算重复。 */
      if (!rel.endsWith('/')) {
        res.writeHead(301, { Location: rel + '/', 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end();
      }
      return sendFile(res, path.join(target, 'index.html'));
    }
    if (!stat.isFile()) return notFound(res);
    sendFile(res, target);
  });
}

function notFound(res) {
  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end('<h1>404</h1><p>页面不存在</p>');
}

function sendFile(res, file) {
  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) return notFound(res);
    const ext = path.extname(file).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';
    const headers = {
      'Content-Type': type,
      'Content-Length': stat.size,
      // 一律 no-cache：这个项目还在密集迭代，JS / CSS 用 max-age 缓存过之后，
      // 会出现「代码明明改了、页面上还是旧样子」的假故障 —— 排查成本远高于省下的那点流量。
      // 这里也没做条件请求（没有 ETag / Last-Modified），所以 no-cache 就是每次都重新读盘，
      // 本地静态文件很小，代价可以忽略。
      'Cache-Control': 'no-cache',
    };
    res.writeHead(200, headers);
    fs.createReadStream(file).pipe(res);
  });
}

/* ------------------------------------------------------------------ *
 * API 路由
 * ------------------------------------------------------------------ */

async function handleApi(req, res, pathname) {
  const method = req.method.toUpperCase();

  /* ---- 账号 ---- */

  if (pathname === '/api/auth/register' && method === 'POST') {
    const body = await readBody(req);
    const checked = validateCredentials(body);
    if (checked.error) return fail(res, 400, checked.error);

    const exists = db.users.some(
      (u) => u.username.toLowerCase() === checked.username.toLowerCase()
    );
    if (exists) return fail(res, 409, '该用户名已被注册');

    const salt = crypto.randomBytes(16).toString('hex');
    const user = {
      id: newId('u'),
      username: checked.username,
      displayName: String(body.displayName || checked.username).trim().slice(0, 30) || checked.username,
      salt,
      passwordHash: hashPassword(checked.password, salt),
      createdAt: Date.now(),
    };
    db.users.push(user);
    persist();

    const session = createSession(user.id);
    return ok(res, { user: publicUser(user) }, {
      'Set-Cookie': cookieHeader(session.token, Math.floor(SESSION_TTL / 1000)),
    });
  }

  if (pathname === '/api/auth/login' && method === 'POST') {
    const body = await readBody(req);
    const username = String(body.username || '').trim();
    const password = String(body.password || '');
    if (!username || !password) return fail(res, 400, '请输入用户名和密码');

    const user = db.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
    if (!user || !verifyPassword(password, user.salt, user.passwordHash)) {
      return fail(res, 401, '用户名或密码不正确');
    }

    const session = createSession(user.id);
    return ok(res, { user: publicUser(user) }, {
      'Set-Cookie': cookieHeader(session.token, Math.floor(SESSION_TTL / 1000)),
    });
  }

  if (pathname === '/api/auth/logout' && method === 'POST') {
    const token = parseCookies(req).pl_session;
    if (token) destroySession(token);
    return ok(res, null, { 'Set-Cookie': cookieHeader('', 0) });
  }

  if (pathname === '/api/auth/me' && method === 'GET') {
    // 这是一个「探测当前会话」的接口，未登录属于正常状态，
    // 返回 200 + user:null，避免浏览器控制台出现红色报错。
    const user = currentUser(req);
    return ok(res, { user: user ? publicUser(user) : null });
  }

  /* ---- 以下接口均需登录 ---- */

  const user = currentUser(req);
  if (!user) return fail(res, 401, '登录已过期，请重新登录');

  if (pathname === '/api/projects' && method === 'GET') {
    const list = db.projects
      .filter((p) => p.userId === user.id)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map((p) => ({
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
      }));
    return ok(res, { projects: list });
  }

  if (pathname === '/api/projects' && method === 'POST') {
    const body = await readBody(req);
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
      // 用户手工调过的分镜表（顺序 / 时长 / 每一格的内容）。
      // 只认 {signature, shots:[…]} 这个形状，脏数据一律落空 —— 引擎那边还有一道
      // sanitizeEntries 兜底，但没道理把一份明显不对的东西写进磁盘。
      storyboardEdit: normalizeStoryboardEdit(body.storyboardEdit),
      scoreBefore: Number(body.scoreBefore) || 0,
      scoreAfter: Number(body.scoreAfter) || 0,
      createdAt: now,
      updatedAt: now,
    };
    db.projects.push(project);
    persist();
    return ok(res, { project });
  }

  const projectMatch = pathname.match(/^\/api\/projects\/([A-Za-z0-9_]+)$/);
  if (projectMatch) {
    const id = projectMatch[1];
    const project = db.projects.find((p) => p.id === id && p.userId === user.id);
    if (!project) return fail(res, 404, '记录不存在');

    if (method === 'GET') return ok(res, { project });

    if (method === 'PUT') {
      const body = await readBody(req);
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
      persist();
      return ok(res, { project });
    }

    if (method === 'DELETE') {
      db.projects = db.projects.filter((p) => !(p.id === id && p.userId === user.id));
      persist();
      return ok(res, { id });
    }
  }

  return fail(res, 404, '接口不存在');
}

/* ------------------------------------------------------------------ *
 * 启动
 * ------------------------------------------------------------------ */

const server = http.createServer((req, res) => {
  const parsed = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsed.pathname;

  if (pathname.startsWith('/api/')) {
    handleApi(req, res, pathname).catch((err) => {
      console.error('[api]', pathname, err);
      if (!res.headersSent) fail(res, 500, err.message || '服务端异常');
    });
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return fail(res, 405, '方法不允许');
  }
  serveStatic(req, res, pathname);
});

ensureData();

server.listen(PORT, HOST, () => {
  console.log('');
  console.log('  PromptLens 已启动');
  console.log(`  地址：http://${HOST}:${PORT}`);
  console.log(`  数据：${DB_FILE}`);
  console.log('');
});

process.on('SIGINT', () => {
  flush();
  console.log('\n数据已保存，服务已停止。');
  process.exit(0);
});
