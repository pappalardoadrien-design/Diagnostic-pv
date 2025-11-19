-- Migration 0037: Rendre intervention_id nullable dans visual_inspections
-- Raison: Audits GIRASOLE créés directement sans intervention préalable

-- SQLite ne supporte pas ALTER COLUMN, donc:
-- 1. Créer table temporaire
-- 2. Copier données
-- 3. Drop ancienne table
-- 4. Renommer temp → visual_inspections

CREATE TABLE visual_inspections_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  intervention_id INTEGER NULL,  -- ⚠️ Maintenant NULL autorisé
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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  audit_token TEXT,
  audit_id INTEGER,
  inspection_date DATE DEFAULT CURRENT_DATE,
  conformite TEXT CHECK(conformite IN ('conforme', 'non_conforme', 'so', NULL)),
  prescriptions_girasole TEXT,
  bonnes_pratiques TEXT,
  audit_category TEXT DEFAULT 'general',
  checklist_section TEXT,
  item_order INTEGER DEFAULT 0,
  FOREIGN KEY (intervention_id) REFERENCES interventions(id) ON DELETE CASCADE,
  FOREIGN KEY (audit_token) REFERENCES audits(audit_token) ON DELETE CASCADE
);

-- Copier données existantes (si existent)
INSERT INTO visual_inspections_new 
SELECT * FROM visual_inspections;

-- Supprimer ancienne table
DROP TABLE visual_inspections;

-- Renommer nouvelle table
ALTER TABLE visual_inspections_new RENAME TO visual_inspections;

-- Recréer indexes
CREATE INDEX IF NOT EXISTS idx_visual_audit_token ON visual_inspections(audit_token);
CREATE INDEX IF NOT EXISTS idx_visual_intervention ON visual_inspections(intervention_id);
CREATE INDEX IF NOT EXISTS idx_visual_audit_category ON visual_inspections(audit_category);
CREATE INDEX IF NOT EXISTS idx_visual_item_order ON visual_inspections(item_order);
