-- Schema do banco de dados (SQLite / compatível com Postgres na maior parte)
-- Plataforma multi-tenant: cada consultor tem sua página, conteúdo, assinatura e leads.

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- Usuários (consultores e admins). Senha SEMPRE com hash (bcrypt).
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  role          TEXT    NOT NULL DEFAULT 'consultant', -- 'consultant' | 'admin'
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Perfil de cada consultor + estado de assinatura.
CREATE TABLE IF NOT EXISTS consultants (
  id                       INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id                  INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  slug                     TEXT    NOT NULL UNIQUE,
  display_name             TEXT    NOT NULL,
  plan                     TEXT    NOT NULL DEFAULT 'pro',
  subscription_status      TEXT    NOT NULL DEFAULT 'none', -- 'none' | 'trial' | 'active' | 'past_due' | 'cancelled' | 'blocked'
  subscription_id          TEXT,                            -- id no provedor de pagamento
  customer_id              TEXT,                            -- id do cliente no provedor
  current_period_end       TEXT,                            -- fim do ciclo atual (ISO)
  trial_ends_at            TEXT,
  blocked_reason           TEXT,
  blocked_at               TEXT,
  active_until             TEXT,
  created_at               TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at               TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Conteúdo personalizado da página de cada consultor (JSON).
CREATE TABLE IF NOT EXISTS consultant_content (
  consultant_id INTEGER PRIMARY KEY REFERENCES consultants(id) ON DELETE CASCADE,
  content       TEXT NOT NULL DEFAULT '{}',
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Leads recebidos pelos formulários das páginas públicas.
CREATE TABLE IF NOT EXISTS leads (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  consultant_id INTEGER NOT NULL REFERENCES consultants(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  whatsapp      TEXT,
  email         TEXT,
  message       TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Auditoria simples do painel admin.
CREATE TABLE IF NOT EXISTS admin_actions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id      INTEGER,
  action        TEXT NOT NULL,
  consultant_id INTEGER,
  detail        TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Metadados da plataforma (chaves, etc.).
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT
);
