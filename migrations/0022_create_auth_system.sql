-- ============================================================================
-- Migration 0022 : Système d'authentification & gestion accès sous-traitants
-- ============================================================================
-- Créé le : 2025-11-16
-- Objectif : Protéger l'accès à la plateforme avec utilisateurs et permissions
-- Architecture : Support 20+ sous-traitants avec isolation complète des données

-- ============================================================================
-- TABLE : users
-- Description : Utilisateurs de la plateforme (admins, sous-traitants, clients)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Identification
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  company TEXT,  -- "Diagnostic Photovoltaïque", "pvControl", "MBJ Lab", etc.
  phone TEXT,
  
  -- Rôle et permissions
  role TEXT NOT NULL CHECK(role IN ('admin', 'subcontractor', 'client', 'auditor')),
  -- admin: Adrien, Fabien (accès total)
  -- subcontractor: pvControl, MBJ Lab (voit uniquement audits assignés)
  -- client: Clients finaux (lecture seule, leurs audits uniquement)
  -- auditor: Futurs employés DiagPV (comme subcontractor mais interne)
  
  -- État
  is_active BOOLEAN DEFAULT 1,
  email_verified BOOLEAN DEFAULT 0,
  
  -- Métadonnées
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,  -- Admin qui a créé l'utilisateur
  last_login_at DATETIME,
  last_login_ip TEXT,
  
  -- Notes admin
  notes TEXT,  -- Ex: "Sous-traitant EL + Thermal, tarif négocié 2024"
  
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_users_company ON users(company);

-- ============================================================================
-- TABLE : sessions
-- Description : Sessions actives des utilisateurs connectés
-- ============================================================================
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  
  -- Token de session
  session_token TEXT UNIQUE NOT NULL,  -- UUID v4
  
  -- Expiration
  expires_at DATETIME NOT NULL,  -- 24h pour admin, 8h pour autres
  
  -- Métadonnées connexion
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_activity_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_address TEXT,
  user_agent TEXT,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_token ON sessions(session_token);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- ============================================================================
-- TABLE : audit_assignments
-- Description : CLÉ DU SYSTÈME - Qui a accès à quel audit
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Liaison
  audit_token TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  
  -- Permissions (granulaires)
  can_view BOOLEAN DEFAULT 1,
  can_edit BOOLEAN DEFAULT 0,
  can_delete BOOLEAN DEFAULT 0,
  can_generate_report BOOLEAN DEFAULT 1,
  
  -- Modules accessibles (NULL = tous les modules autorisés)
  allowed_modules TEXT,  -- JSON: ["el", "iv", "thermal"] ou NULL
  -- Si NULL: sous-traitant voit tous les modules de l'audit
  -- Si ["el"]: sous-traitant voit UNIQUEMENT module EL
  
  -- Métadonnées assignment
  assigned_by INTEGER NOT NULL,  -- Admin qui a assigné
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,  -- NULL = jamais, sinon date auto-révocation
  
  -- Workflow
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'revoked', 'expired')),
  notified BOOLEAN DEFAULT 0,  -- Email envoyé ?
  notified_at DATETIME,
  completed BOOLEAN DEFAULT 0,
  completed_at DATETIME,
  completion_notes TEXT,  -- Note du sous-traitant à la fin
  
  FOREIGN KEY (audit_token) REFERENCES el_audits(audit_token) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id),
  
  UNIQUE(audit_token, user_id)
);

CREATE INDEX idx_assignments_user ON audit_assignments(user_id);
CREATE INDEX idx_assignments_audit ON audit_assignments(audit_token);
CREATE INDEX idx_assignments_status ON audit_assignments(status);
CREATE INDEX idx_assignments_expires ON audit_assignments(expires_at);

-- ============================================================================
-- TABLE : activity_logs
-- Description : Audit trail - Qui a fait quoi, quand (sécurité + debug)
-- ============================================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Qui
  user_id INTEGER NOT NULL,
  user_email TEXT NOT NULL,  -- Snapshot au moment de l'action
  user_role TEXT NOT NULL,
  
  -- Quoi
  action TEXT NOT NULL,  -- "login", "create_audit", "assign_audit", "view_report", etc.
  entity_type TEXT,  -- "audit", "user", "report", etc.
  entity_id TEXT,  -- audit_token, user_id, etc.
  
  -- Détails
  details TEXT,  -- JSON avec infos supplémentaires
  
  -- Métadonnées
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_activity_user ON activity_logs(user_id);
CREATE INDEX idx_activity_action ON activity_logs(action);
CREATE INDEX idx_activity_created ON activity_logs(created_at);
CREATE INDEX idx_activity_entity ON activity_logs(entity_type, entity_id);

-- ============================================================================
-- TABLE : password_reset_tokens
-- Description : Tokens pour réinitialisation mot de passe
-- ============================================================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  used BOOLEAN DEFAULT 0,
  used_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_reset_token ON password_reset_tokens(token);
CREATE INDEX idx_reset_user ON password_reset_tokens(user_id);

-- ============================================================================
-- INSERTION COMPTE ADMIN INITIAL
-- ============================================================================
-- Email: a.pappalardo@diagnosticphotovoltaique.fr
-- Password temporaire: DiagPV2025!Temp (HASH bcrypt ci-dessous)
-- À CHANGER IMMÉDIATEMENT APRÈS PREMIÈRE CONNEXION

-- Note: Le hash ci-dessous est bcrypt de "DiagPV2025!Temp" avec 10 rounds
-- Généré avec: bcrypt.hash("DiagPV2025!Temp", 10)
INSERT OR IGNORE INTO users (
  email, 
  password_hash, 
  full_name, 
  company, 
  phone,
  role, 
  is_active,
  email_verified,
  notes
) VALUES (
  'a.pappalardo@diagnosticphotovoltaique.fr',
  '$2b$10$rKzN5Y3vHZ8xQ7LmN9qXPOK3fH2jX8vZ1wY4pT6mR5qW7nL3kJ9uK',  -- DiagPV2025!Temp
  'Adrien PAPPALARDO',
  'Diagnostic Photovoltaïque',
  '06 07 29 22 12',
  'admin',
  1,
  1,
  'Compte admin principal - Business Developer - Créé lors migration 0022'
);

-- ============================================================================
-- TRIGGERS : Nettoyage automatique sessions expirées
-- ============================================================================
-- Note: SQLite ne supporte pas les EVENTS, le nettoyage sera fait via CRON ou au login

-- ============================================================================
-- VUES UTILES POUR REQUÊTES FRÉQUENTES
-- ============================================================================

-- Vue: Utilisateurs actifs avec statistiques
CREATE VIEW IF NOT EXISTS v_users_with_stats AS
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.company,
  u.role,
  u.is_active,
  u.created_at,
  u.last_login_at,
  COUNT(DISTINCT aa.audit_token) as assigned_audits_count,
  SUM(CASE WHEN aa.status = 'completed' THEN 1 ELSE 0 END) as completed_audits_count
FROM users u
LEFT JOIN audit_assignments aa ON u.id = aa.user_id AND aa.status != 'revoked'
GROUP BY u.id;

-- Vue: Assignments actifs avec infos utilisateur et audit
CREATE VIEW IF NOT EXISTS v_active_assignments AS
SELECT 
  aa.id,
  aa.audit_token,
  aa.user_id,
  u.email as user_email,
  u.full_name as user_name,
  u.company as user_company,
  u.role as user_role,
  ea.project_name as audit_project,
  ea.client_name as audit_client,
  aa.allowed_modules,
  aa.assigned_at,
  aa.expires_at,
  aa.status,
  aa.completed
FROM audit_assignments aa
INNER JOIN users u ON aa.user_id = u.id
INNER JOIN el_audits ea ON aa.audit_token = ea.audit_token
WHERE aa.status = 'active'
  AND (aa.expires_at IS NULL OR aa.expires_at > datetime('now'));

-- ============================================================================
-- FIN MIGRATION 0022
-- ============================================================================
