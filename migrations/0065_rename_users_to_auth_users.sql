-- Migration 0065: Rename users → auth_users
-- Raison: Le code auth + planning référence auth_users, la table existe sous le nom users
-- SQLite ne supporte pas ALTER TABLE RENAME, on recrée

CREATE TABLE IF NOT EXISTS auth_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  full_name TEXT,
  company TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'technician' CHECK(role IN ('admin', 'subcontractor', 'client', 'auditor', 'technician')),
  is_active BOOLEAN DEFAULT 1,
  email_verified BOOLEAN DEFAULT 0,
  must_change_password BOOLEAN DEFAULT 0,
  certification_level TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  last_login_at DATETIME,
  last_login_ip TEXT,
  notes TEXT
);

-- Copier données existantes de users vers auth_users
INSERT OR IGNORE INTO auth_users (id, email, full_name, company, phone, role, is_active, created_at, password_hash, email_verified, notes, created_by, last_login_at, last_login_ip)
  SELECT id, email, full_name, company, phone,
    CASE WHEN role IN ('admin','subcontractor','client','auditor','technician') THEN role ELSE 'technician' END,
    is_active, created_at,
    password_hash, email_verified, notes, created_by, last_login_at, last_login_ip
  FROM users;

-- Index auth_users
CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth_users(email);
CREATE INDEX IF NOT EXISTS idx_auth_users_role ON auth_users(role);
CREATE INDEX IF NOT EXISTS idx_auth_users_active ON auth_users(is_active);
CREATE INDEX IF NOT EXISTS idx_auth_users_company ON auth_users(company);
