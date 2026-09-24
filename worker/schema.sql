-- PromptLens · D1（SQLite）表结构
-- ====================================================================
-- 与 `server.js` 里的单文件 JSON 存储一一对应：
--   db.users[]    → users 表
--   db.sessions[] → sessions 表
--   db.projects[] → projects 表（整条记录存成 JSON，见下面 projects.data 的注释）
--
-- 应用方式（本地）：
--   npx wrangler d1 execute promptlens --local --file=worker/schema.sql
-- 应用方式（线上）：
--   npx wrangler d1 execute promptlens --remote --file=worker/schema.sql
--
-- 全部用 IF NOT EXISTS，重复执行是安全的（和这个项目其它生成器一个要求：
-- 能重跑、且重跑不会改坏已有数据）。

-- ---- 账号 ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  username      TEXT NOT NULL,
  display_name  TEXT,
  salt          TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    INTEGER NOT NULL
);

-- 用户名**不区分大小写**唯一。
-- server.js 是每次注册时 `some(u => u.username.toLowerCase() === ...)` 线性扫一遍，
-- 关系库里换成唯一索引 —— 它同时解决了「两个人同时注册同一个名字」的竞态，
-- 而 server.js 那版挡不住（两个请求都能通过检查再各自 push）。
CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower ON users (lower(username));

-- ---- 会话 ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

-- 过期会话是**懒清理**的（每次建新会话顺手删过期的，见 worker/index.js）。
-- 这个索引让那次 DELETE 不用全表扫。
CREATE INDEX IF NOT EXISTS sessions_expires ON sessions (expires_at);

-- ---- 作品记录 ------------------------------------------------------
-- 整条记录存成 JSON（data），而不是拆成二十个列。
-- 理由：字段会随引擎演进（answers / decisions / storyboardEdit 的形状都改过），
-- 拆列意味着每加一个字段就要写一次迁移，而服务端本来就只做「形状检查」，
-- 不做业务校验 —— 列化买不到任何约束，只买到维护成本。
-- user_id / created_at / updated_at 单独成列，是因为**要用它们过滤和排序**，
-- 放进 JSON 里就得每次全表 parse 再排。
CREATE TABLE IF NOT EXISTS projects (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  data       TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- 列表接口是 `WHERE user_id = ? ORDER BY updated_at DESC`，走这条索引。
CREATE INDEX IF NOT EXISTS projects_user_updated ON projects (user_id, updated_at DESC);
