-- Migration 0034: Rendre intervention_id nullable dans visual_inspections
-- Car les audits peuvent être créés sans intervention

-- Malheureusement SQLite ne supporte pas ALTER COLUMN pour changer NULL/NOT NULL
-- On doit recréer la table

-- Sauvegarder données existantes
CREATE TABLE visual_inspections_backup AS SELECT * FROM visual_inspections;

-- Supprimer ancienne table
DROP TABLE visual_inspections;

-- Recréer table avec intervention_id nullable
CREATE TABLE visual_inspections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  intervention_id INTEGER,  -- NULLABLE maintenant
  audit_token TEXT,
  audit_id INTEGER,
  inspection_type TEXT NOT NULL,
  string_number INTEGER,
  module_number INTEGER,
  location_description TEXT,
  defect_found BOOLEAN DEFAULT 0,
  defect_type TEXT,
  severity_level INTEGER,
  photo_url TEXT,
  gps_latitude REAL,
  gps_longitude REAL,
  corrective_action_required BOOLEAN DEFAULT 0,
  corrective_action_description TEXT,
  notes TEXT,
  inspection_date DATE DEFAULT CURRENT_DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  plant_id INTEGER,
  
  FOREIGN KEY (audit_token) REFERENCES audits(audit_token) ON DELETE CASCADE
);

-- Restaurer données
INSERT INTO visual_inspections SELECT * FROM visual_inspections_backup;

-- Supprimer backup
DROP TABLE visual_inspections_backup;

-- Recréer index
CREATE INDEX idx_visual_inspections_token ON visual_inspections(audit_token);
CREATE INDEX idx_visual_inspections_date ON visual_inspections(inspection_date);
