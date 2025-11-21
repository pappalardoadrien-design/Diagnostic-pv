-- Migration pour ajouter le support des plans de calepinage physiques
-- Permet de stocker la disposition réelle des modules sur le toit

-- Table des layouts de calepinage (disposition physique des centrales)
CREATE TABLE IF NOT EXISTS calepinage_layouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT UNIQUE NOT NULL,  -- Ex: 'JALIBAT-2025-001'
  layout_name TEXT NOT NULL,
  layout_data TEXT NOT NULL,  -- JSON contenant la configuration complète
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table des positions physiques des modules
CREATE TABLE IF NOT EXISTS module_positions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL,
  module_identifier TEXT NOT NULL,  -- Ex: 'S1-1', 'S2-24'
  x_position REAL NOT NULL,  -- Position X en pixels ou %
  y_position REAL NOT NULL,  -- Position Y en pixels ou %
  rotation REAL DEFAULT 0,   -- Rotation en degrés
  width REAL DEFAULT 100,    -- Largeur du module
  height REAL DEFAULT 40,    -- Hauteur du module
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES calepinage_layouts(project_id),
  UNIQUE(project_id, module_identifier)
);

-- Table des câbles entre modules/strings
CREATE TABLE IF NOT EXISTS calepinage_cables (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL,
  from_module TEXT NOT NULL,  -- Ex: 'S1-26'
  to_module TEXT NOT NULL,    -- Ex: 'S2-1'
  cable_points TEXT,          -- JSON array de points intermédiaires [{x, y}, ...]
  cable_color TEXT DEFAULT '#dc2626',  -- Couleur du câble (rouge par défaut)
  arrow_type TEXT DEFAULT 'end',       -- 'start', 'end', 'both', 'none'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES calepinage_layouts(project_id)
);

-- Table des zones de câblage (rectangles rouges)
CREATE TABLE IF NOT EXISTS calepinage_zones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL,
  zone_name TEXT,
  string_numbers TEXT NOT NULL,  -- JSON array [2, 3, 4]
  border_color TEXT DEFAULT '#dc2626',
  border_width INTEGER DEFAULT 3,
  background_color TEXT DEFAULT 'transparent',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES calepinage_layouts(project_id)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_layouts_project ON calepinage_layouts(project_id);
CREATE INDEX IF NOT EXISTS idx_positions_project ON module_positions(project_id);
CREATE INDEX IF NOT EXISTS idx_positions_module ON module_positions(module_identifier);
CREATE INDEX IF NOT EXISTS idx_cables_project ON calepinage_cables(project_id);
CREATE INDEX IF NOT EXISTS idx_zones_project ON calepinage_zones(project_id);
