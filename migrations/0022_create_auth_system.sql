-- Migration 0022: Système d'authentification
-- Phase 6: Multi-utilisateurs & Permissions
-- Date: 2025-11-16
-- Description: Tables pour gestion utilisateurs, sessions, permissions audit

-- ============================================================
-- ATTENTION: En production, table "users" existe déjà (techniciens EL)
-- Pour éviter conflit, on crée "auth_users" pour l'authentification
-- ============================================================

-- ============================================================
-- Table: auth_users
-- Utilisateurs système avec authentification
-- Rôles: admin, subcontractor, client, auditor
-- ============================================================
CREATE TABLE IF NOT EXISTS auth_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  company TEXT,
  role TEXT NOT NULL CHECK(role IN ('admin', 'subcontractor', 'client', 'auditor')),
  is_active BOOLEAN DEFAULT 1,
  must_change_password BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth_users(email);
CREATE INDEX IF NOT EXISTS idx_auth_users_role ON auth_users(role);
CREATE INDEX IF NOT EXISTS idx_auth_users_active ON auth_users(is_active);

-- ============================================================
-- Table: sessions
-- Sessions utilisateur (backed par KV pour fast lookup)
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- ============================================================
-- Table: audit_assignments
-- Permissions granulaires: qui peut accéder à quel audit
-- NOTE: audit_token n'a PAS de FOREIGN KEY car table el_audits 
--       peut ne pas exister (migrations 0002-0021 manquantes)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  audit_token TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  can_view BOOLEAN DEFAULT 1,
  can_edit BOOLEAN DEFAULT 0,
  can_delete BOOLEAN DEFAULT 0,
  allowed_modules TEXT,  -- JSON: ["el", "iv", "visual"] or NULL pour tous
  assigned_by INTEGER NOT NULL,
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'revoked', 'expired')),
  expires_at DATETIME,
  notes TEXT,
  -- FOREIGN KEY (audit_token) REFERENCES el_audits(audit_token) ON DELETE CASCADE,  -- Désactivé: table el_audits peut ne pas exister
  FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES auth_users(id),
  UNIQUE(audit_token, user_id)
);

CREATE INDEX IF NOT EXISTS idx_assignments_audit ON audit_assignments(audit_token);
CREATE INDEX IF NOT EXISTS idx_assignments_user ON audit_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON audit_assignments(status);

-- ============================================================
-- Table: activity_logs
-- Traçabilité des actions utilisateurs
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,  -- login, logout, view_audit, edit_defect, generate_report, etc.
  resource_type TEXT,    -- audit, defect, report, user, etc.
  resource_id TEXT,
  details TEXT,          -- JSON avec détails supplémentaires
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_logs_created ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_logs_resource ON activity_logs(resource_type, resource_id);

-- ============================================================
-- Compte admin initial
-- Email: a.pappalardo@diagnosticphotovoltaique.fr
-- Password: DiagPV2025!Temp (MUST CHANGE après premier login)
-- Hash bcrypt (10 rounds): $2b$10$rKzN5Y3vHZ8xQ7LmN9qXPOK3fH2jX8vZ1wY4pT6mR5qW7nL3kJ9uK
-- ============================================================
INSERT OR IGNORE INTO auth_users (email, password_hash, full_name, company, role, must_change_password) 
VALUES (
  'a.pappalardo@diagnosticphotovoltaique.fr',
  '$2b$10$rKzN5Y3vHZ8xQ7LmN9qXPOK3fH2jX8vZ1wY4pT6mR5qW7nL3kJ9uK',
  'Adrien PAPPALARDO',
  'Diagnostic Photovoltaïque',
  'admin',
  1
);

-- ============================================================
-- Log de création du système
-- ============================================================
INSERT INTO activity_logs (user_id, action, resource_type, details) 
VALUES (
  1,
  'system_init',
  'auth_system',
  '{"message": "Système auth créé - Migration 0022", "version": "1.0.0", "features": ["multi_role", "granular_permissions", "activity_tracking"]}'
);
