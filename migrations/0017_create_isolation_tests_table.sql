-- Migration 0017: Module Isolation - Tests d'isolement
-- Date: 2025-11-12
-- Description: Table pour enregistrer les tests d'isolement DC/AC conformes IEC 62446

-- Drop old table structure (from Phase 1)
DROP TABLE IF EXISTS isolation_tests;
DROP TABLE IF EXISTS isolation_measurements_history;

-- Table principale tests isolement
CREATE TABLE IF NOT EXISTS isolation_tests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_token TEXT UNIQUE NOT NULL,
  
  -- Liaison audit/centrale
  plant_id INTEGER,
  zone_id INTEGER,
  audit_el_token TEXT,
  
  -- Informations test
  test_date DATE NOT NULL,
  test_type TEXT NOT NULL, -- 'COMMISSIONING', 'MAINTENANCE', 'POST_INTERVENTION', 'POST_SINISTRE'
  operator_name TEXT,
  equipment_used TEXT, -- Ex: 'Benning IT 130'
  
  -- Mesures isolement (en MegaOhms)
  dc_positive_to_earth REAL, -- DC+ vers Terre (MΩ)
  dc_negative_to_earth REAL, -- DC- vers Terre (MΩ)
  dc_positive_to_negative REAL, -- DC+ vers DC- (MΩ)
  ac_to_earth REAL, -- AC vers Terre (MΩ)
  
  -- Conditions mesure
  temperature_celsius REAL, -- Température ambiante (optionnel)
  humidity_percent REAL, -- Humidité relative (optionnel)
  weather_conditions TEXT, -- Conditions météo (optionnel)
  
  -- Conformité IEC 62446
  is_conform BOOLEAN NOT NULL DEFAULT 0, -- 1 si toutes mesures >1 MΩ
  threshold_mohm REAL NOT NULL DEFAULT 1.0, -- Seuil conformité (1 MΩ par défaut)
  
  -- Observations
  notes TEXT,
  non_conformity_details TEXT, -- Détails si non-conforme
  corrective_actions TEXT, -- Actions correctives si nécessaire
  
  -- Import Excel
  imported_from_file TEXT, -- Nom fichier Excel Benning
  raw_data_json TEXT, -- Données brutes Excel (JSON)
  
  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_isolation_plant_id ON isolation_tests(plant_id);
CREATE INDEX IF NOT EXISTS idx_isolation_zone_id ON isolation_tests(zone_id);
CREATE INDEX IF NOT EXISTS idx_isolation_audit_token ON isolation_tests(audit_el_token);
CREATE INDEX IF NOT EXISTS idx_isolation_test_date ON isolation_tests(test_date DESC);
CREATE INDEX IF NOT EXISTS idx_isolation_test_type ON isolation_tests(test_type);
CREATE INDEX IF NOT EXISTS idx_isolation_conform ON isolation_tests(is_conform);

-- Table historique mesures (pour graphiques évolution)
CREATE TABLE IF NOT EXISTS isolation_measurements_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_id INTEGER NOT NULL,
  test_token TEXT NOT NULL,
  
  -- Type mesure
  measurement_type TEXT NOT NULL, -- 'DC_POS_EARTH', 'DC_NEG_EARTH', 'DC_POS_NEG', 'AC_EARTH'
  measurement_value REAL NOT NULL, -- Valeur en MΩ
  is_conform BOOLEAN NOT NULL,
  
  -- Timestamp
  measured_at DATETIME NOT NULL,
  
  FOREIGN KEY (test_id) REFERENCES isolation_tests(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_measurements_test_id ON isolation_measurements_history(test_id);
CREATE INDEX IF NOT EXISTS idx_measurements_type ON isolation_measurements_history(measurement_type);
CREATE INDEX IF NOT EXISTS idx_measurements_date ON isolation_measurements_history(measured_at DESC);
