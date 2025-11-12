-- ============================================================================
-- MIGRATION 0016: Module Controles Visuels - Checklist IEC 62446-1
-- ============================================================================
-- Conforme norme IEC 62446-1 pour inspections visuelles terrain
-- Categories: Mecanique, Electrique, Documentation, Securite

-- Table principale inspections visuelles
CREATE TABLE IF NOT EXISTS visual_inspections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inspection_token TEXT UNIQUE NOT NULL,
  project_name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  location TEXT NOT NULL,
  inspection_date DATE NOT NULL,
  inspector_name TEXT,
  inspector_id INTEGER,
  
  -- Configuration installation
  system_power_kwp REAL,
  module_count INTEGER,
  inverter_count INTEGER,
  installation_year INTEGER,
  
  -- Etat global
  overall_status TEXT DEFAULT 'pending',
  conformity_level TEXT DEFAULT 'pending',
  critical_issues_count INTEGER DEFAULT 0,
  
  -- Metadonnees
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME
);

-- Table items checklist IEC
CREATE TABLE IF NOT EXISTS visual_inspection_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inspection_id INTEGER NOT NULL,
  inspection_token TEXT NOT NULL,
  
  -- Classification IEC
  category TEXT NOT NULL,
  subcategory TEXT,
  item_code TEXT NOT NULL,
  item_description TEXT NOT NULL,
  
  -- Evaluation
  status TEXT DEFAULT 'pending',
  conformity TEXT DEFAULT 'pending',
  severity TEXT DEFAULT 'info',
  
  -- Observations
  observation TEXT,
  recommendation TEXT,
  
  -- Photos
  photo_url TEXT,
  photo_count INTEGER DEFAULT 0,
  
  -- Metadonnees
  checked_at DATETIME,
  checked_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (inspection_id) REFERENCES visual_inspections(id) ON DELETE CASCADE
);

-- Table defauts mecaniques identifies
CREATE TABLE IF NOT EXISTS visual_defects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inspection_id INTEGER NOT NULL,
  inspection_token TEXT NOT NULL,
  item_id INTEGER,
  
  -- Localisation
  defect_location TEXT NOT NULL,
  module_identifier TEXT,
  string_number INTEGER,
  equipment_type TEXT NOT NULL,
  
  -- Classification defaut
  defect_type TEXT NOT NULL,
  defect_category TEXT NOT NULL,
  severity TEXT NOT NULL,
  urgency TEXT DEFAULT 'medium',
  
  -- Description
  description TEXT NOT NULL,
  potential_impact TEXT,
  recommended_action TEXT,
  
  -- Conformite
  norm_reference TEXT,
  norm_violation BOOLEAN DEFAULT 0,
  
  -- Photos
  image_url TEXT,
  image_count INTEGER DEFAULT 0,
  
  -- Metadonnees
  detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  detected_by TEXT,
  resolved BOOLEAN DEFAULT 0,
  resolved_at DATETIME,
  
  FOREIGN KEY (inspection_id) REFERENCES visual_inspections(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES visual_inspection_items(id)
);

-- Table photos inspection
CREATE TABLE IF NOT EXISTS visual_inspection_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inspection_id INTEGER NOT NULL,
  inspection_token TEXT NOT NULL,
  item_id INTEGER,
  defect_id INTEGER,
  
  -- Fichier
  photo_url TEXT NOT NULL,
  photo_type TEXT NOT NULL,
  caption TEXT,
  
  -- Metadonnees
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  uploaded_by TEXT,
  file_size INTEGER,
  
  FOREIGN KEY (inspection_id) REFERENCES visual_inspections(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES visual_inspection_items(id),
  FOREIGN KEY (defect_id) REFERENCES visual_defects(id)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_visual_items_token ON visual_inspection_items(inspection_token);
CREATE INDEX IF NOT EXISTS idx_visual_items_category ON visual_inspection_items(category);
CREATE INDEX IF NOT EXISTS idx_visual_items_status ON visual_inspection_items(status);
CREATE INDEX IF NOT EXISTS idx_visual_defects_token ON visual_defects(inspection_token);
CREATE INDEX IF NOT EXISTS idx_visual_defects_severity ON visual_defects(severity);
CREATE INDEX IF NOT EXISTS idx_visual_defects_string ON visual_defects(string_number);
CREATE INDEX IF NOT EXISTS idx_visual_photos_token ON visual_inspection_photos(inspection_token);
