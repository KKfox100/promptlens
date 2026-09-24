'use strict';

/**
 * 接口冒烟 / 一致性检查：把同一串请求打到指定的后端，逐条断言。
 *
 * 为什么要有它：`server.js`（本地，Node）和 `worker/index.js`（线上，Workers）
 * 是**同一套接口的两个实现**。两边分叉的症状是「本地好好的、线上不对」——
 * 而两边各自的测试都不会红，因为它们各测各的。
 *
 * 用法（同一份脚本打两个后端，对比着看）：
 *
 *   node server.js &                                  # Node 版
 *   node scripts/check-api.js                         # 默认打 5178
 *
 *   npx wrangler dev --port 8787 &                    # Worker 版
 *   BASE=http://127.0.0.1:8787 node scripts/check-api.js
 *
 * 断言只认**接口契约**（响应信封、状态码、字段形状、Cookie 属性、静态路由规则），
 * 不认具体文案 —— 文案是产品的事，改了不该让这个脚本红。
 *
 * ⚠️ 它会往库里写数据（一个随机用户名的账号 + 一条记录，最后删掉记录）。
 * 本地库本来就是测试数据；**别拿它打线上**（那个账号会真的留在线上库里）。
 */

const BASE = process.env.BASE || 'http://127.0.0.1:5178';
/** 打的是 https 还是 http —— 决定会话 Cookie **该不该**带 Secure。 */
const IS_HTTPS = new URL(BASE).protocol === 'https:';

let pass = 0;
const failures = [];

function check(label, cond, extra) {
  if (cond) {
    pass += 1;
    console.log('  ✓ ' + label);
  } else {
    failures.push(label);
    console.log('  ✗ ' + label + (extra === undefined ? '' : '  → ' + extra));
  }
}

/** 极简 cookie jar：只需要记住 pl_session 这一条。 */
const jar = { pl_session: null };

function cookieFrom(res) {
  const raw = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  const line = raw.find((c) => c.startsWith('pl_session=')) || '';
  const m = line.match(/^pl_session=([^;]*)/);
  return { line, value: m ? m[1] : null };
}

async function req(path, opts) {
  const headers = Object.assign({}, (opts && opts.headers) || {});
  if (jar.pl_session) headers.Cookie = 'pl_session=' + jar.pl_session;
  let body;
  if (opts && opts.json !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.json);
  }
  const res = await fetch(BASE + path, {
    method: (opts && opts.method) || 'GET',
    headers,
    body,
    redirect: 'manual',
  });
  const setCookie = cookieFrom(res);
  if (setCookie.value !== null) jar.pl_session = setCookie.value || null;
  let data = null;
  const text = await res.text();
  try { data = JSON.parse(text); } catch (e) { data = null; }
  return { status: res.status, data, text, headers: res.headers, setCookie: setCookie.line };
}

(async () => {
  const uname = 'apitest' + Math.random().toString(36).slice(2, 10);
  console.log('\n后端：' + BASE + '   账号：' + uname + '\n');

  /* ---- 账号：入参校验 ---- */
  console.log('[1] 注册入参校验');
  let r = await req('/api/auth/register', { method: 'POST', json: { username: 'a', password: '123456' } });
  check('用户名太短 → 400', r.status === 400 && r.data && r.data.ok === false, r.status);
  r = await req('/api/auth/register', { method: 'POST', json: { username: uname, password: '123' } });
  check('密码太短 → 400', r.status === 400 && r.data && r.data.ok === false, r.status);
  r = await req('/api/auth/register', { method: 'POST', json: { username: 'bad name!', password: '123456' } });
  check('用户名带非法字符 → 400', r.status === 400, r.status);

  /* ---- 账号：正常注册 ---- */
  console.log('\n[2] 注册成功与会话 Cookie');
  r = await req('/api/auth/register', { method: 'POST', json: { username: uname, password: 'probe12345' } });
  check('注册 → 200 ok:true', r.status === 200 && r.data && r.data.ok === true, r.status);
  check('返回 user.id 形如 u_xxx', r.data && r.data.data && /^u_/.test(r.data.data.user.id),
    r.data && r.data.data && r.data.data.user.id);
  check('返回体里**没有** salt / passwordHash', r.text.indexOf('salt') === -1
    && r.text.indexOf('passwordHash') === -1 && r.text.indexOf('password_hash') === -1);
  check('Set-Cookie 带 HttpOnly', /HttpOnly/i.test(r.setCookie), r.setCookie);
  check('Set-Cookie 带 SameSite=Lax', /SameSite=Lax/i.test(r.setCookie), r.setCookie);
  check('Set-Cookie 带 Max-Age', /Max-Age=\d+/.test(r.setCookie), r.setCookie);
  /* `Secure` 必须**跟着请求协议走**，而且两个方向都得断言 ——
     只测一边等于没测：本地是 http、线上是 https，各只会走到一边。
       · https 下**必须**有：否则会话 Cookie 会明文附到 http 请求上；
       · http 下**必须**没有：否则浏览器直接拒绝存它，症状是
         「登录接口返回 200、之后一直显示未登录」，而且**不报任何错**。
     注意：Node 的 fetch 配手动 Cookie 头**绕过了**浏览器的 cookie 策略，
     所以这个 bug 在脚本里本来不会自己暴露 —— 必须显式断言。 */
  check(IS_HTTPS
    ? 'Set-Cookie 带 Secure（https 下必须有）'
    : 'Set-Cookie 不带 Secure（http 下必须没有）',
  IS_HTTPS ? /;\s*Secure/i.test(r.setCookie) : !/;\s*Secure/i.test(r.setCookie), r.setCookie);

  r = await req('/api/auth/me');
  check('带 Cookie 探测会话 → 拿到同一个用户',
    r.status === 200 && r.data && r.data.data.user && r.data.data.user.username === uname,
    JSON.stringify(r.data));

  /* ---- 重名 ---- */
  console.log('\n[3] 重名与大小写');
  const saved = jar.pl_session;
  jar.pl_session = null;
  r = await req('/api/auth/register', { method: 'POST', json: { username: uname, password: 'probe12345' } });
  check('同名再注册 → 409', r.status === 409, r.status);
  r = await req('/api/auth/register', {
    method: 'POST', json: { username: uname.toUpperCase(), password: 'probe12345' },
  });
  check('只改大小写也算重名 → 409', r.status === 409, r.status);

  /* ---- 登录 ---- */
  console.log('\n[4] 登录');
  r = await req('/api/auth/login', { method: 'POST', json: { username: uname, password: 'wrongpass' } });
  check('密码错 → 401', r.status === 401, r.status);
  r = await req('/api/auth/login', { method: 'POST', json: { username: uname, password: 'probe12345' } });
  check('密码对 → 200', r.status === 200 && r.data && r.data.ok === true, r.status);
  check('登录也发会话 Cookie', /pl_session=[0-9a-f]{64}/.test(r.setCookie), r.setCookie);

  /* ---- 未登录访问受保护接口 ---- */
  console.log('\n[5] 未登录');
  jar.pl_session = null;
  r = await req('/api/projects');
  check('未登录读列表 → 401', r.status === 401, r.status);
  r = await req('/api/projects', { method: 'POST', json: { title: 'x' } });
  check('未登录写记录 → 401', r.status === 401, r.status);
  r = await req('/api/auth/me');
  check('未登录探测会话 → 200 + user:null（不是 401）',
    r.status === 200 && r.data && r.data.data.user === null, r.status);

  /* ---- 登录回来，跑记录 ---- */
  console.log('\n[6] 作品记录');
  jar.pl_session = saved;
  r = await req('/api/projects', { method: 'POST', json: {
    title: 'T'.repeat(200),            // 超长，应被截到 80
    scenarioName: '通用任务',
    family: 'video',
    originalPrompt: '原始需求',
    finalPrompt: '最终提示词',
    answers: { q1: 'a1' },
    decisions: [{ k: 1 }],
    scoreBefore: 40,
    scoreAfter: 88,
    storyboardEdit: {
      signature: 'sig',
      shots: [{ shotId: 's1', moveId: 'm1', seconds: 3, cell: '内容', focus: true }],
    },
  } });
  check('新建记录 → 200', r.status === 200 && r.data && r.data.ok === true, r.status);
  const project = r.data && r.data.data && r.data.data.project;
  check('project.id 形如 p_xxx', !!(project && /^p_/.test(project.id)), project && project.id);
  check('超长 title 被截到 80', !!(project && project.title.length === 80), project && project.title.length);
  check('family 原样保留 video', !!(project && project.family === 'video'), project && project.family);
  check('answers 原样存下', !!(project && project.answers && project.answers.q1 === 'a1'));
  check('storyboardEdit 的 shots 存下且带 focus',
    !!(project && project.storyboardEdit && project.storyboardEdit.shots
      && project.storyboardEdit.shots[0].focus === true));
  check('createdAt / updatedAt 都有', !!(project && project.createdAt && project.updatedAt));

  const pid = project.id;

  r = await req('/api/projects');
  const list = r.data && r.data.data && r.data.data.projects;
  check('列表返回 1 条', Array.isArray(list) && list.length === 1, list && list.length);
  check('列表是**摘要**：不含 answers / decisions',
    !!(list && list[0] && list[0].answers === undefined && list[0].decisions === undefined));
  check('摘要含 id / title / scoreAfter',
    !!(list && list[0] && list[0].id && list[0].title && list[0].scoreAfter === 88));

  r = await req('/api/projects/' + pid);
  check('读单条 → 含 answers（完整对象）',
    r.status === 200 && r.data.data.project.answers.q1 === 'a1', r.status);

  r = await req('/api/projects/' + pid, { method: 'PUT', json: { title: '改过的标题', scoreAfter: 91 } });
  check('改标题 → 200 且生效',
    r.status === 200 && r.data.data.project.title === '改过的标题', r.status);
  check('改后 updatedAt ≥ createdAt',
    r.data.data.project.updatedAt >= r.data.data.project.createdAt);

  r = await req('/api/projects/p_notmine', { method: 'GET' });
  check('读别人的/不存在的记录 → 404', r.status === 404, r.status);

  r = await req('/api/projects/' + pid, { method: 'DELETE' });
  check('删记录 → 200', r.status === 200 && r.data.ok === true, r.status);
  r = await req('/api/projects/' + pid);
  check('删完再读 → 404', r.status === 404, r.status);

  /* ---- 路由兜底 ---- */
  console.log('\n[7] 路由兜底');
  r = await req('/api/nope');
  check('不存在的接口 → 404 + ok:false', r.status === 404 && r.data && r.data.ok === false, r.status);

  /* ---- 登出 ---- */
  console.log('\n[8] 登出');
  r = await req('/api/auth/logout', { method: 'POST' });
  check('登出 → 200 且清 Cookie', r.status === 200 && /Max-Age=0/.test(r.setCookie), r.setCookie);
  jar.pl_session = saved;              // 拿旧 token 再试一次
  r = await req('/api/auth/me');
  check('旧会话 token 已失效（登出是真的注销，不是只清浏览器）',
    r.status === 200 && r.data.data.user === null, JSON.stringify(r.data));
  jar.pl_session = null;

  /* ---- 静态资源与路由规则 ---- */
  console.log('\n[9] 静态资源');
  r = await req('/');
  check('GET / → 200 text/html', r.status === 200 && /text\/html/.test(r.headers.get('content-type') || ''),
    r.status + ' ' + r.headers.get('content-type'));
  check('落地页正文里有品牌名', r.text.indexOf('PromptLens') !== -1);
  check('静态资源带 Cache-Control: no-cache',
    (r.headers.get('cache-control') || '').indexOf('no-cache') !== -1,
    r.headers.get('cache-control'));

  r = await req('/login');
  check('GET /login → 200（重写成 login.html，不是 404）', r.status === 200, r.status);
  r = await req('/login/');
  check('GET /login/ → 200', r.status === 200, r.status);

  r = await req('/en');
  check('GET /en（缺结尾斜杠）→ 301', r.status === 301, r.status);
  check('301 的 Location 是 /en/', r.headers.get('location') === '/en/', r.headers.get('location'));
  r = await req('/en/');
  check('GET /en/ → 200（目录 index 生效）', r.status === 200, r.status);
  check('/en/ 是英文页', r.text.indexOf('lang="en"') !== -1);

  r = await req('/assets/css/main.css');
  check('GET main.css → 200 text/css',
    r.status === 200 && /text\/css/.test(r.headers.get('content-type') || ''), r.status);

  r = await req('/definitely-not-here');
  check('不存在的页面 → 404', r.status === 404, r.status);

  r = await req('/api/auth/me', { method: 'POST' });
  check('用错方法打已知接口 → 不是 200', r.status !== 200, r.status);

  /* ---- 汇总 ---- */
  console.log('\n' + '='.repeat(56));
  if (failures.length) {
    console.log('失败 ' + failures.length + ' 项（共 ' + (pass + failures.length) + ' 项）：');
    failures.forEach((f) => console.log('  - ' + f));
    process.exit(1);
  }
  console.log('全部通过 ✓ （' + pass + ' 项）');
})().catch((err) => {
  console.error('\n脚本异常：', err && err.message);
  process.exit(1);
});
