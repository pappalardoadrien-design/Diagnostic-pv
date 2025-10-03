-- Schema initial DiagPV Audit EL
-- Base de données pour audits électroluminescence photovoltaïques

-- Table des audits principaux
CREATE TABLE IF NOT EXISTS audits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT UNIQUE NOT NULL,
  project_name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  location TEXT NOT NULL,
  string_count INTEGER NOT NULL,
  modules_per_string INTEGER NOT NULL,
  total_modules INTEGER NOT NULL,
  plan_file TEXT,
  status TEXT DEFAULT 'created',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table des modules individuels
CREATE TABLE IF NOT EXISTS modules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  audit_token TEXT NOT NULL,
  module_id TEXT NOT NULL,
  string_number INTEGER NOT NULL,
  position_in_string INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  comment TEXT,
  technician_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (audit_token) REFERENCES audits(token),
  UNIQUE(audit_token, module_id)
);

-- Table des mesures électriques PVserv
CREATE TABLE IF NOT EXISTS pvserv_measurements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  audit_token TEXT NOT NULL,
  string_number INTEGER,
  module_number INTEGER,
  ff REAL,
  rds REAL,
  uf REAL,
  measurement_type TEXT, -- 'bright' ou 'dark'
  iv_curve_data TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (audit_token) REFERENCES audits(token)
);

-- Table des sessions collaboratives
CREATE TABLE IF NOT EXISTS collaborative_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  audit_token TEXT NOT NULL,
  technician_id TEXT NOT NULL,
  last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT 1,
  FOREIGN KEY (audit_token) REFERENCES audits(token)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_modules_audit_token ON modules(audit_token);
CREATE INDEX IF NOT EXISTS idx_modules_string ON modules(string_number);
CREATE INDEX IF NOT EXISTS idx_modules_status ON modules(status);
CREATE INDEX IF NOT EXISTS idx_audits_token ON audits(token);
CREATE INDEX IF NOT EXISTS idx_audits_created ON audits(created_at);
CREATE INDEX IF NOT EXISTS idx_pvserv_audit ON pvserv_measurements(audit_token);
CREATE INDEX IF NOT EXISTS idx_sessions_audit ON collaborative_sessions(audit_token);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON collaborative_sessions(is_active);