-- ============================================================================
-- MIGRATION 0005: PV CARTOGRAPHY MODULE
-- Date: 2025-10-27
-- Description: Création module cartographie PV parallèle (non-destructif)
-- ============================================================================

-- ============================================================================
-- TABLE: pv_plants (Centrales PV)
-- ============================================================================
CREATE TABLE IF NOT EXISTS pv_plants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Identification
  plant_name TEXT NOT NULL,
  plant_type TEXT DEFAULT 'rooftop' CHECK(plant_type IN ('rooftop', 'ground', 'carport')),
  
  -- Localisation
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'France',
  latitude REAL,
  longitude REAL,
  
  -- Caractéristiques techniques
  total_power_kwp REAL DEFAULT 0,
  module_count INTEGER DEFAULT 0,
  
  -- Métadonnées
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE: pv_zones (Zones: toitures, secteurs sol, ombrières)
-- ============================================================================
CREATE TABLE IF NOT EXISTS pv_zones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plant_id INTEGER NOT NULL,
  
  -- Identification
  zone_name TEXT NOT NULL,
  zone_type TEXT DEFAULT 'roof' CHECK(zone_type IN ('roof', 'ground', 'carport')),
  zone_order INTEGER DEFAULT 1,
  
  -- Orientation & Inclinaison
  azimuth INTEGER DEFAULT 180 CHECK(azimuth >= 0 AND azimuth <= 360),
  tilt INTEGER DEFAULT 30 CHECK(tilt >= 0 AND tilt <= 90),
  
  -- Géométrie zone (coordonnées métriques locales)
  outline_coordinates TEXT, -- JSON: [[x,y],[x,y],...]
  area_sqm REAL DEFAULT 0,
  
  -- Métadonnées
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (plant_id) REFERENCES pv_plants(id) ON DELETE CASCADE
);

-- ============================================================================
-- TABLE: pv_modules (Modules positionnés avec coordonnées métriques)
-- ============================================================================
CREATE TABLE IF NOT EXISTS pv_modules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  zone_id INTEGER NOT NULL,
  
  -- Identification module
  module_identifier TEXT NOT NULL,
  string_number INTEGER NOT NULL,
  position_in_string INTEGER NOT NULL,
  
  -- Position métrique (origine = coin zone)
  pos_x_meters REAL NOT NULL,
  pos_y_meters REAL NOT NULL,
  
  -- Dimensions & Orientation
  width_meters REAL DEFAULT 1.7,
  height_meters REAL DEFAULT 1.0,
  rotation INTEGER DEFAULT 0 CHECK(rotation IN (0, 90, 180, 270)),
  
  -- Coordonnées GPS (optionnel si disponibles)
  latitude REAL,
  longitude REAL,
  
  -- Caractéristiques techniques
  power_wp INTEGER DEFAULT 450,
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  
  -- Métadonnées
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (zone_id) REFERENCES pv_zones(id) ON DELETE CASCADE,
  UNIQUE(zone_id, module_identifier)
);

-- ============================================================================
-- INDEX pour performances
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_pv_zones_plant ON pv_zones(plant_id);
CREATE INDEX IF NOT EXISTS idx_pv_zones_order ON pv_zones(plant_id, zone_order);
CREATE INDEX IF NOT EXISTS idx_pv_modules_zone ON pv_modules(zone_id);
CREATE INDEX IF NOT EXISTS idx_pv_modules_string ON pv_modules(zone_id, string_number);
CREATE INDEX IF NOT EXISTS idx_pv_modules_position ON pv_modules(zone_id, string_number, position_in_string);

-- ============================================================================
-- LIAISON OPTIONNELLE avec audits EL existants (non-destructif)
-- ============================================================================
-- Ajouter colonnes de liaison dans el_audits SANS modifier la structure existante
-- Ces colonnes permettront de lier un audit EL à une centrale PV si nécessaire

-- Vérifier si les colonnes existent déjà avant de les ajouter
-- Cloudflare D1 ne supporte pas "ADD COLUMN IF NOT EXISTS", donc on utilise une approche différente

-- Note: Ces ALTER TABLE seront ignorées si les colonnes existent déjà (erreur silencieuse)
-- Cela permet de réexécuter la migration sans problème

-- ALTER TABLE el_audits ADD COLUMN pv_plant_id INTEGER REFERENCES pv_plants(id);
-- ALTER TABLE el_audits ADD COLUMN pv_zone_id INTEGER REFERENCES pv_zones(id);

-- Pour l'instant, on ne modifie PAS el_audits pour garantir non-régression
-- La liaison sera ajoutée plus tard si nécessaire

-- ============================================================================
-- DONNÉES DE TEST (optionnel - commenté par défaut)
-- ============================================================================

-- INSERT INTO pv_plants (plant_name, plant_type, address, city, postal_code, latitude, longitude)
-- VALUES ('Centrale Test', 'rooftop', '123 Rue du Soleil', 'Marseille', '13000', 43.2965, 5.3698);

-- INSERT INTO pv_zones (plant_id, zone_name, zone_type, azimuth, tilt, outline_coordinates, area_sqm)
-- VALUES (
--   1, 
--   'Toiture Sud', 
--   'roof', 
--   180, 
--   30, 
--   '[[0,0],[20,0],[20,15],[0,15]]',
--   300
-- );

-- ============================================================================
-- FIN MIGRATION 0005
-- ============================================================================
