-- ============================================================================
-- Migration 0048: Schéma complet PV Cartography + Designer Satellite
-- Date: 2025-11-24
-- Description: Tables complètes pour cartographie PV avec intégration Designer
-- ============================================================================

-- ============================================================================
-- TABLE 1: pv_plants (Centrales PV)
-- ============================================================================
CREATE TABLE IF NOT EXISTS pv_plants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plant_name TEXT NOT NULL,
  plant_type TEXT CHECK(plant_type IN ('rooftop', 'ground', 'carport', 'other')) DEFAULT 'rooftop',
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'France',
  latitude REAL,
  longitude REAL,
  total_power_kwp REAL,
  module_count INTEGER DEFAULT 0,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE 2: pv_zones (Zones au sein des centrales)
-- ============================================================================
CREATE TABLE IF NOT EXISTS pv_zones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plant_id INTEGER NOT NULL,
  zone_name TEXT NOT NULL DEFAULT 'Zone principale',
  zone_type TEXT CHECK(zone_type IN ('roof', 'ground', 'carport', 'other')) DEFAULT 'roof',
  zone_order INTEGER DEFAULT 1,
  
  -- Paramètres techniques
  azimuth INTEGER DEFAULT 180,
  tilt INTEGER DEFAULT 30,
  width_meters REAL DEFAULT 50,
  height_meters REAL DEFAULT 30,
  
  -- Géométrie zone
  outline_coordinates TEXT, -- JSON: [[lat,lng], [lat,lng], ...]
  area_sqm REAL,
  roof_area_sqm REAL,
  
  -- Image de fond (satellite)
  background_image_url TEXT,
  background_image_type TEXT DEFAULT 'satellite',
  
  -- Configuration strings
  string_count INTEGER,
  modules_per_string INTEGER,
  
  -- Liaison avec audits
  audit_token TEXT,
  audit_id INTEGER,
  sync_status TEXT DEFAULT 'manual' CHECK(sync_status IN ('manual', 'auto', 'synced', 'conflict')),
  sync_direction TEXT DEFAULT 'pv_to_audit' CHECK(sync_direction IN ('pv_to_audit', 'audit_to_pv', 'bidirectional')),
  last_sync_at DATETIME,
  
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (plant_id) REFERENCES pv_plants(id) ON DELETE CASCADE
);

-- ============================================================================
-- TABLE 3: pv_modules (Modules individuels)
-- ============================================================================
CREATE TABLE IF NOT EXISTS pv_modules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  zone_id INTEGER NOT NULL,
  
  -- Identification
  module_identifier TEXT NOT NULL,
  string_number INTEGER,
  position_in_string INTEGER,
  
  -- Position cartographique (mètres)
  pos_x_meters REAL NOT NULL,
  pos_y_meters REAL NOT NULL,
  rotation REAL DEFAULT 0, -- Angle rotation (degrés)
  
  -- Dimensions
  width_meters REAL DEFAULT 1.7,
  height_meters REAL DEFAULT 1.0,
  
  -- Caractéristiques électriques
  power_wp INTEGER DEFAULT 450,
  manufacturer TEXT,
  model TEXT,
  serial_number TEXT,
  
  -- État/défauts
  module_status TEXT DEFAULT 'pending' CHECK(module_status IN ('ok', 'warning', 'critical', 'pending', 'inequality', 'microcracks', 'dead', 'string_open', 'not_connected')),
  status_comment TEXT,
  defect_type TEXT,
  severity_level TEXT,
  
  -- Liaison avec EL
  el_module_id INTEGER,
  
  -- Métadonnées
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (zone_id) REFERENCES pv_zones(id) ON DELETE CASCADE
);

-- ============================================================================
-- TABLE 4: designer_layouts (Designs Designer Satellite)
-- ============================================================================
CREATE TABLE IF NOT EXISTS designer_layouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  modules_count INTEGER NOT NULL,
  modules_data TEXT NOT NULL,      -- JSON: [{lat, lng, status, rotation, width, height}]
  module_specs TEXT NOT NULL,      -- JSON: {width, height, spacing}
  map_center TEXT NOT NULL,        -- JSON: {lat, lng, zoom}
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES POUR PERFORMANCE
-- ============================================================================

-- pv_plants
CREATE INDEX IF NOT EXISTS idx_pv_plants_name ON pv_plants(plant_name);
CREATE INDEX IF NOT EXISTS idx_pv_plants_location ON pv_plants(city, postal_code);

-- pv_zones
CREATE INDEX IF NOT EXISTS idx_pv_zones_plant ON pv_zones(plant_id);
CREATE INDEX IF NOT EXISTS idx_pv_zones_audit_token ON pv_zones(audit_token);
CREATE INDEX IF NOT EXISTS idx_pv_zones_audit_id ON pv_zones(audit_id);
CREATE INDEX IF NOT EXISTS idx_pv_zones_sync_status ON pv_zones(sync_status);

-- pv_modules
CREATE INDEX IF NOT EXISTS idx_pv_modules_zone ON pv_modules(zone_id);
CREATE INDEX IF NOT EXISTS idx_pv_modules_identifier ON pv_modules(module_identifier);
CREATE INDEX IF NOT EXISTS idx_pv_modules_string ON pv_modules(string_number, position_in_string);
CREATE INDEX IF NOT EXISTS idx_pv_modules_status ON pv_modules(module_status);
CREATE INDEX IF NOT EXISTS idx_pv_modules_el_link ON pv_modules(el_module_id);

-- designer_layouts
CREATE INDEX IF NOT EXISTS idx_designer_layouts_created_at ON designer_layouts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_designer_layouts_count ON designer_layouts(modules_count);

-- ============================================================================
-- NOTES D'IMPLÉMENTATION
-- ============================================================================
-- 1. Schéma complet PV avec liaison audits
-- 2. Support Designer Satellite intégré
-- 3. Rotation modules 0-360° pour alignement carte
-- 4. Synchronisation bidirectionnelle EL ↔ PV
-- 5. Positions en mètres pour précision
-- 6. Statuts modules compatibles avec EL
-- ============================================================================
