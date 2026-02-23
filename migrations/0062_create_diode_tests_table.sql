-- Migration 0062: Module Test Diodes Bypass
-- Tests de diodes bypass par thermographie et/ou courbe I-V
-- Lié aux audits via audit_token et plant_id (= projects.id)
-- Date: 2026-02-23

-- ============================================================================
-- TABLE PRINCIPALE - SESSIONS DE TEST DIODES
-- ============================================================================
CREATE TABLE IF NOT EXISTS diode_test_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  -- Liens
  audit_token TEXT,                -- FK → el_audits.audit_token (si lié à un audit EL)
  plant_id INTEGER,                -- FK → projects.id (centrale PV)
  project_id INTEGER,              -- FK → projects.id (alias cohérent)
  -- Métadonnées session
  session_token TEXT UNIQUE,       -- Token unique "DIO-{timestamp}-{random}"
  technician_name TEXT,
  test_date DATE,
  method TEXT DEFAULT 'thermal',   -- 'thermal', 'iv_curve', 'combined'
  equipment TEXT,                   -- Matériel utilisé (ex: "Mavic 3T + PVServ")
  ambient_temperature REAL,        -- °C
  irradiance REAL,                 -- W/m²
  -- Résultats globaux
  total_diodes_tested INTEGER DEFAULT 0,
  diodes_ok INTEGER DEFAULT 0,
  diodes_defective INTEGER DEFAULT 0,
  diodes_suspect INTEGER DEFAULT 0,
  conformity_rate REAL,            -- % diodes OK
  -- Statut
  status TEXT DEFAULT 'in_progress', -- 'in_progress', 'completed', 'validated'
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_diode_sessions_audit_token ON diode_test_sessions(audit_token);
CREATE INDEX IF NOT EXISTS idx_diode_sessions_plant_id ON diode_test_sessions(plant_id);
CREATE INDEX IF NOT EXISTS idx_diode_sessions_session_token ON diode_test_sessions(session_token);

-- ============================================================================
-- TABLE DÉTAIL - RÉSULTATS PAR DIODE
-- ============================================================================
CREATE TABLE IF NOT EXISTS diode_test_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,     -- FK → diode_test_sessions.id
  -- Identification module
  string_number INTEGER,
  module_number INTEGER,
  module_identifier TEXT,          -- Ex: "S1-M12"
  diode_position TEXT,             -- 'D1', 'D2', 'D3' (position dans le module)
  -- Mesures thermiques
  temperature_diode REAL,          -- °C température mesurée sur la diode
  delta_t REAL,                    -- °C écart avec module voisin
  thermal_image_url TEXT,          -- URL image IR
  -- Mesures électriques (IV)
  forward_voltage REAL,            -- V tension directe
  reverse_current REAL,            -- mA courant inverse
  -- Résultat
  status TEXT DEFAULT 'ok',        -- 'ok', 'defective', 'suspect', 'not_tested'
  defect_type TEXT,                -- 'short_circuit', 'open_circuit', 'high_resistance', 'thermal_runaway'
  severity TEXT DEFAULT 'minor',   -- 'critical', 'major', 'minor'
  -- Observations
  observation TEXT,
  photo_url TEXT,                  -- Photo visible du module
  recommendation TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_diode_results_session ON diode_test_results(session_id);
CREATE INDEX IF NOT EXISTS idx_diode_results_status ON diode_test_results(status);
CREATE INDEX IF NOT EXISTS idx_diode_results_module ON diode_test_results(module_identifier);
