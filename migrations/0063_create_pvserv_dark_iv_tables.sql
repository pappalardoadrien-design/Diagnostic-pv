-- Migration 0063: Module Courbes Sombres PVServ - Dark IV + Diodes Bypass
-- Import automatisé depuis fichier .txt carte SD PVServ
-- Discrimination automatique : Uf > 100V = string, Uf <= 100V = diode bypass
-- Date: 2026-02-25

-- ============================================================================
-- TABLE SESSIONS D'IMPORT PVServ
-- ============================================================================
CREATE TABLE IF NOT EXISTS pvserv_import_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  -- Liens
  session_token TEXT UNIQUE NOT NULL,     -- Token unique "PVS-{timestamp}-{random}"
  project_id INTEGER,                      -- FK → projects.id
  audit_token TEXT,                         -- FK → el_audits.audit_token
  -- Métadonnées fichier
  source_filename TEXT,                    -- Nom du fichier .txt importé
  device_name TEXT,                         -- Ex: "LAB/HP 31500/Mod 6298"
  serial_number TEXT,                       -- Ex: "23.44.1286"
  -- Compteurs
  total_blocks INTEGER DEFAULT 0,
  string_count INTEGER DEFAULT 0,
  diode_count INTEGER DEFAULT 0,
  -- Stats strings
  avg_ff_strings REAL,
  avg_rds_strings REAL,
  avg_uf_strings REAL,
  -- Stats diodes
  avg_ff_diodes REAL,
  avg_rds_diodes REAL,
  avg_uf_diodes REAL,
  -- Anomalies
  anomaly_count INTEGER DEFAULT 0,
  critical_count INTEGER DEFAULT 0,
  warning_count INTEGER DEFAULT 0,
  -- Métadonnées session
  technician_name TEXT,
  import_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  status TEXT DEFAULT 'imported',  -- 'imported', 'analyzed', 'validated'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pvserv_sessions_token ON pvserv_import_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_pvserv_sessions_project ON pvserv_import_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_pvserv_sessions_audit ON pvserv_import_sessions(audit_token);

-- ============================================================================
-- TABLE COURBES SOMBRES (Dark IV) - Niveau STRING + DIODE
-- ============================================================================
CREATE TABLE IF NOT EXISTS pvserv_dark_curves (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,             -- FK → pvserv_import_sessions.id
  -- Identification
  measurement_number INTEGER NOT NULL,     -- Nr. X du fichier PVServ
  curve_type TEXT NOT NULL,                -- 'string' ou 'diode'
  curve_mode TEXT DEFAULT 'bright',        -- 'bright' ou 'dark'
  -- Paramètres mesurés
  fill_factor REAL NOT NULL,               -- FF (0-1)
  rds REAL NOT NULL,                       -- Résistance dynamique série (Ohm)
  uf INTEGER NOT NULL,                     -- Tension forward (V)
  v_max REAL,                              -- Tension max mesurée
  i_max REAL,                              -- Courant max mesuré (abs)
  -- Anomalie détectée
  anomaly_detected INTEGER DEFAULT 0,      -- 0/1
  anomaly_type TEXT,                        -- 'low_ff', 'high_rds', etc.
  anomaly_severity TEXT DEFAULT 'ok',      -- 'ok', 'warning', 'critical'
  anomaly_message TEXT,
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (session_id) REFERENCES pvserv_import_sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_pvserv_curves_session ON pvserv_dark_curves(session_id);
CREATE INDEX IF NOT EXISTS idx_pvserv_curves_type ON pvserv_dark_curves(curve_type);
CREATE INDEX IF NOT EXISTS idx_pvserv_curves_anomaly ON pvserv_dark_curves(anomaly_detected);

-- ============================================================================
-- TABLE POINTS DE MESURE (U, I) pour chaque courbe
-- ============================================================================
CREATE TABLE IF NOT EXISTS pvserv_dark_measurements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  curve_id INTEGER NOT NULL,               -- FK → pvserv_dark_curves.id
  point_order INTEGER NOT NULL,            -- Ordre du point (1, 2, 3...)
  voltage REAL NOT NULL,                   -- U en Volts
  current REAL NOT NULL,                   -- I en Ampères
  power REAL,                              -- P = U × I (W) calculé
  
  FOREIGN KEY (curve_id) REFERENCES pvserv_dark_curves(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_pvserv_measurements_curve ON pvserv_dark_measurements(curve_id);
