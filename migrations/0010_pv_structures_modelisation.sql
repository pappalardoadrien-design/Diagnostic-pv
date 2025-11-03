-- ============================================================================
-- MIGRATION 0010: PV STRUCTURES - Modélisation bâtiments/ombrières/champs
-- ============================================================================
-- Date: 2025-11-03
-- Objectif: Permettre modélisation réaliste structures avant placement modules
-- Cas d'usage: Dessiner bâtiments, ombrières parking, champs au sol
-- ============================================================================

-- ============================================================================
-- TABLE: pv_structures (Structures physiques de la centrale)
-- ============================================================================
CREATE TABLE IF NOT EXISTS pv_structures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  zone_id INTEGER NOT NULL,
  
  -- Identification
  structure_type TEXT NOT NULL CHECK(structure_type IN ('building', 'carport', 'ground', 'technical', 'other')),
  structure_name TEXT NOT NULL,
  structure_order INTEGER DEFAULT 1,
  
  -- Géométrie (Leaflet GeoJSON)
  geometry TEXT NOT NULL, -- JSON: {"type":"Polygon","coordinates":[[[lat,lng]...]]}
  area_sqm REAL DEFAULT 0,
  
  -- Affichage visuel
  fill_color TEXT DEFAULT '#e5e7eb',
  stroke_color TEXT DEFAULT '#9ca3af',
  opacity REAL DEFAULT 0.3,
  
  -- Métadonnées
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (zone_id) REFERENCES pv_zones(id) ON DELETE CASCADE
);

-- ============================================================================
-- INDEX pour performances
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_pv_structures_zone ON pv_structures(zone_id);
CREATE INDEX IF NOT EXISTS idx_pv_structures_type ON pv_structures(structure_type);
CREATE INDEX IF NOT EXISTS idx_pv_structures_order ON pv_structures(zone_id, structure_order);

-- ============================================================================
-- TRIGGER pour mettre à jour updated_at
-- ============================================================================
CREATE TRIGGER IF NOT EXISTS update_pv_structures_timestamp 
AFTER UPDATE ON pv_structures
BEGIN
  UPDATE pv_structures SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- ============================================================================
-- VUE statistiques structures par zone
-- ============================================================================
CREATE VIEW IF NOT EXISTS v_pv_structures_stats AS
SELECT 
  z.id AS zone_id,
  z.zone_name,
  z.plant_id,
  COUNT(s.id) AS total_structures,
  
  -- Stats par type
  SUM(CASE WHEN s.structure_type = 'building' THEN 1 ELSE 0 END) AS count_buildings,
  SUM(CASE WHEN s.structure_type = 'carport' THEN 1 ELSE 0 END) AS count_carports,
  SUM(CASE WHEN s.structure_type = 'ground' THEN 1 ELSE 0 END) AS count_ground,
  SUM(CASE WHEN s.structure_type = 'technical' THEN 1 ELSE 0 END) AS count_technical,
  
  -- Surfaces totales
  SUM(s.area_sqm) AS total_area_sqm,
  SUM(CASE WHEN s.structure_type = 'building' THEN s.area_sqm ELSE 0 END) AS building_area_sqm,
  SUM(CASE WHEN s.structure_type = 'carport' THEN s.area_sqm ELSE 0 END) AS carport_area_sqm,
  SUM(CASE WHEN s.structure_type = 'ground' THEN s.area_sqm ELSE 0 END) AS ground_area_sqm,
  
  -- Dates
  MAX(s.updated_at) AS last_update
  
FROM pv_zones z
LEFT JOIN pv_structures s ON z.id = s.zone_id
GROUP BY z.id;

-- ============================================================================
-- DONNÉES DE TEST (optionnel)
-- ============================================================================

-- INSERT INTO pv_structures (zone_id, structure_type, structure_name, geometry, area_sqm, fill_color)
-- VALUES (
--   3, 
--   'building', 
--   'Bâtiment A',
--   '{"type":"Polygon","coordinates":[[[43.6568,1.4765],[43.6566,1.4767],[43.6568,1.4769],[43.6569,1.4767]]]}',
--   250.5,
--   '#d1d5db'
-- );

-- ============================================================================
-- FIN MIGRATION 0010
-- ============================================================================
