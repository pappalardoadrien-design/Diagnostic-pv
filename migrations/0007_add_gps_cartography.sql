-- ============================================================================
-- Migration 0007 : Ajout Coordonnées GPS pour Cartographie Professionnelle
-- ============================================================================
-- Objectif : Représentation fidèle centrales PV avec coordonnées GPS réelles
-- Auteur : DiagPV Assistant
-- Date : 2025-01-29

-- ============================================================================
-- 1. CENTRALES PV — GPS déjà présent ✅
-- ============================================================================
-- latitude, longitude déjà présentes dans pv_plants

-- ============================================================================
-- 2. ZONES TOITURE — Configuration Électrique
-- ============================================================================

-- Configuration électrique zone
ALTER TABLE pv_zones ADD COLUMN inverter_count INTEGER DEFAULT 0;
ALTER TABLE pv_zones ADD COLUMN junction_box_count INTEGER DEFAULT 0; -- BJ (boîtes de jonction)
ALTER TABLE pv_zones ADD COLUMN string_count INTEGER DEFAULT 0;
ALTER TABLE pv_zones ADD COLUMN modules_per_string INTEGER DEFAULT 0;

-- Contour toiture GPS (alias de outline_coordinates pour clarté)
-- outline_coordinates déjà présent, on ajoute roof_polygon comme alias
ALTER TABLE pv_zones ADD COLUMN roof_polygon TEXT; -- JSON: [[lat,lng], [lat,lng], ...]

-- Surface toiture (utilise area_sqm existant, on ajoute alias)
ALTER TABLE pv_zones ADD COLUMN roof_area_sqm REAL;

-- ============================================================================
-- 3. MODULES — GPS déjà présent ✅
-- ============================================================================
-- latitude, longitude déjà présentes dans pv_modules

-- ============================================================================
-- 4. INDEX PERFORMANCE (Requêtes géographiques)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_plants_gps ON pv_plants(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_modules_gps ON pv_modules(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_zones_plant ON pv_zones(plant_id);

-- ============================================================================
-- 5. VUES UTILES (Stats rapides)
-- ============================================================================

-- Vue stats zones (agrégation rapide)
CREATE VIEW IF NOT EXISTS v_pv_zones_stats AS
SELECT 
  z.id AS zone_id,
  z.zone_name,
  z.plant_id,
  z.roof_area_sqm,
  z.inverter_count,
  z.junction_box_count,
  z.string_count,
  z.modules_per_string,
  COUNT(m.id) AS total_modules,
  SUM(CASE WHEN m.module_status = 'ok' THEN 1 ELSE 0 END) AS modules_ok,
  SUM(CASE WHEN m.module_status = 'dead' THEN 1 ELSE 0 END) AS modules_dead,
  SUM(CASE WHEN m.module_status = 'microcracks' THEN 1 ELSE 0 END) AS modules_microcracks,
  SUM(CASE WHEN m.module_status = 'inequality' THEN 1 ELSE 0 END) AS modules_inequality,
  SUM(CASE WHEN m.module_status = 'string_open' THEN 1 ELSE 0 END) AS modules_string_open,
  SUM(CASE WHEN m.module_status = 'not_connected' THEN 1 ELSE 0 END) AS modules_not_connected,
  SUM(CASE WHEN m.module_status = 'pending' THEN 1 ELSE 0 END) AS modules_pending,
  SUM(m.power_wp) / 1000.0 AS total_power_kwp
FROM pv_zones z
LEFT JOIN pv_modules m ON z.id = m.zone_id
GROUP BY z.id;

-- ============================================================================
-- FIN MIGRATION 0007
-- ============================================================================
