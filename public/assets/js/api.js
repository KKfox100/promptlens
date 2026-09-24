'use strict';

/**
 * 数据访问层
 * ------------------------------------------------------------------
 * 默认走服务端 API（Node + 本地 JSON 存储）。
 * 如果页面是以 file:// 直接打开（没有后端），自动降级为浏览器本地存储，
 * 保证在任何环境下都能完整体验。
 */

(function (root) {
  const IS_HTTP = /^https?:$/.test(root.location.protocol);

  /**
   * 报错文案。这些字符串会一路冒到界面上（`toast(err.message)`），
   * 所以它们是**界面文案**，不是日志 —— 要跟着语种走。
   * 查不到就原样返回 key（key 就是中文原文），简体下输出逐字不变。
   */
  const t = (root.PromptLensI18n && root.PromptLensI18n.t) || ((key) => key);

  /* ================================================================ *
   * A. 服务端模式
   * ================================================================ */

  async function request(path, options) {
    const opts = Object.assign({ method: 'GET', credentials: 'same-origin', headers: {} }, options || {});
    if (opts.body !== undefined && typeof opts.body !== 'string') {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(opts.body);
    }
    let res;
    try {
      res = await fetch(path, opts);
    } catch (err) {
      throw new Error(t('无法连接到服务端，请确认服务已启动'));
    }
    let payload = null;
    try {
      payload = await res.json();
    } catch (err) {
      throw new Error(t('服务端返回了无法解析的内容'));
    }
    if (!res.ok || !payload || payload.ok === false) {
      const msg = (payload && payload.error) || t('请求失败（{status}）', { status: res.status });
      const e = new Error(msg);
      e.status = res.status;
      throw e;
    }
    return payload.data;
  }

  const RemoteBackend = {
    mode: 'remote',
    register: (body) => request('/api/auth/register', { method: 'POST', body }),
    login: (body) => request('/api/auth/login', { method: 'POST', body }),
    logout: () => request('/api/auth/logout', { method: 'POST' }),
    me: () => request('/api/auth/me'),
    listProjects: () => request('/api/projects'),
    getProject: (id) => request('/api/projects/' + id),
    createProject: (body) => request('/api/projects', { method: 'POST', body }),
    updateProject: (id, body) => request('/api/projects/' + id, { method: 'PUT', body }),
    deleteProject: (id) => request('/api/projects/' + id, { method: 'DELETE' }),
  };

  /* ================================================================ *
   * B. 本地降级模式（file:// 打开时）
   * ================================================================ */

  const LS_KEY = 'promptlens.local.v1';

  function lsRead() {
    try {
      const raw = root.localStorage.getItem(LS_KEY);
      if (!raw) return { users: [], current: null, projects: [] };
      const parsed = JSON.parse(raw);
      return {
        users: parsed.users || [],
        current: parsed.current || null,
        projects: parsed.projects || [],
      };
    } catch (err) {
      return { users: [], current: null, projects: [] };
    }
  }

  function lsWrite(db) {
    root.localStorage.setItem(LS_KEY, JSON.stringify(db));
  }

  async function sha256(text) {
    if (root.crypto && root.crypto.subtle && root.isSecureContext) {
      const buf = await root.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
      return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
    }
    // file:// 下 SubtleCrypto 不可用，退化为简单摘要（仅本地演示）
    let h = 5381;
    for (let i = 0; i < text.length; i += 1) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
    return 'local_' + (h >>> 0).toString(16);
  }

  function uid(prefix) {
    return prefix + '_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  }

  const USERNAME_RE = /^[A-Za-z0-9_\u4e00-\u9fa5]{2,20}$/;

  const LocalBackend = {
    mode: 'local',

    async register(body) {
      const username = String(body.username || '').trim();
      const password = String(body.password || '');
      if (!USERNAME_RE.test(username)) throw new Error(t('用户名需为 2-20 位中文、字母、数字或下划线'));
      if (password.length < 6) throw new Error(t('密码长度至少 6 位'));

      const db = lsRead();
      if (db.users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
        throw new Error(t('该用户名已被注册'));
      }
      const user = {
        id: uid('u'),
        username,
        displayName: String(body.displayName || username).trim() || username,
        pass: await sha256(username + '::' + password),
        createdAt: Date.now(),
      };
      db.users.push(user);
      db.current = user.id;
      lsWrite(db);
      return { user: { id: user.id, username: user.username, displayName: user.displayName, createdAt: user.createdAt } };
    },

    async login(body) {
      const username = String(body.username || '').trim();
      const password = String(body.password || '');
      const db = lsRead();
      const user = db.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
      if (!user) throw new Error(t('用户名或密码不正确'));
      const pass = await sha256(user.username + '::' + password);
      if (pass !== user.pass) throw new Error(t('用户名或密码不正确'));
      db.current = user.id;
      lsWrite(db);
      return { user: { id: user.id, username: user.username, displayName: user.displayName, createdAt: user.createdAt } };
    },

    async logout() {
      const db = lsRead();
      db.current = null;
      lsWrite(db);
      return null;
    },

    async me() {
      const db = lsRead();
      const user = db.users.find((u) => u.id === db.current);
      if (!user) return { user: null };
      return { user: { id: user.id, username: user.username, displayName: user.displayName, createdAt: user.createdAt } };
    },

    async listProjects() {
      const db = lsRead();
      return {
        projects: db.projects
          .filter((p) => p.userId === db.current)
          .sort((a, b) => b.updatedAt - a.updatedAt),
      };
    },

    async getProject(id) {
      const db = lsRead();
      const project = db.projects.find((p) => p.id === id && p.userId === db.current);
      if (!project) throw new Error(t('记录不存在'));
      return { project };
    },

    async createProject(body) {
      const db = lsRead();
      if (!db.current) throw new Error(t('未登录'));
      const now = Date.now();
      const project = Object.assign({}, body, {
        id: uid('p'),
        userId: db.current,
        createdAt: now,
        updatedAt: now,
      });
      db.projects.push(project);
      lsWrite(db);
      return { project };
    },

    async updateProject(id, body) {
      const db = lsRead();
      const project = db.projects.find((p) => p.id === id && p.userId === db.current);
      if (!project) throw new Error(t('记录不存在'));
      Object.assign(project, body, { updatedAt: Date.now() });
      lsWrite(db);
      return { project };
    },

    async deleteProject(id) {
      const db = lsRead();
      db.projects = db.projects.filter((p) => !(p.id === id && p.userId === db.current));
      lsWrite(db);
      return { id };
    },
  };

  /* ================================================================ *
   * 选择实现
   * ================================================================ */

  const API = IS_HTTP ? RemoteBackend : LocalBackend;
  API.isLocalMode = !IS_HTTP;

  root.PromptLensAPI = API;
})(window);
