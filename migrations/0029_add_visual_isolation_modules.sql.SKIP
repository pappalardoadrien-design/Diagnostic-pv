-- Migration 0029: Ajout tables modules Inspections Visuelles et Tests d'Isolement
-- Phase 2B & 2C

-- ============================================================================
-- TABLE INSPECTIONS VISUELLES
-- ============================================================================
CREATE TABLE IF NOT EXISTS visual_inspections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  audit_token TEXT NOT NULL,
  inspection_type TEXT DEFAULT 'general', -- general, structural, electrical, mechanical
  inspection_date DATE DEFAULT CURRENT_DATE,
  observations TEXT,
  photos TEXT, -- JSON array d'URLs photos
  defects_found INTEGER DEFAULT 0,
  severity TEXT, -- low, medium, high, critical
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (audit_token) REFERENCES el_audits(audit_token) ON DELETE CASCADE
);

CREATE INDEX idx_visual_inspections_token ON visual_inspections(audit_token);
CREATE INDEX idx_visual_inspections_date ON visual_inspections(inspection_date);

-- ============================================================================
-- TABLE TESTS D'ISOLEMENT
-- ============================================================================
CREATE TABLE IF NOT EXISTS isolation_tests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  audit_token TEXT NOT NULL,
  test_type TEXT DEFAULT 'DC', -- DC, AC, Earth
  test_date DATE DEFAULT CURRENT_DATE,
  voltage REAL, -- Tension test (V)
  resistance REAL, -- Résistance mesurée (MΩ)
  pass INTEGER DEFAULT 0, -- 1 = conforme, 0 = non conforme
  threshold REAL, -- Seuil minimum requis (MΩ)
  temperature REAL, -- Température lors du test (°C)
  humidity REAL, -- Humidité relative (%)
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (audit_token) REFERENCES el_audits(audit_token) ON DELETE CASCADE
);

CREATE INDEX idx_isolation_tests_token ON isolation_tests(audit_token);
CREATE INDEX idx_isolation_tests_date ON isolation_tests(test_date);
CREATE INDEX idx_isolation_tests_pass ON isolation_tests(pass);
