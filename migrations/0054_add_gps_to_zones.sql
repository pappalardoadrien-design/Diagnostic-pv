-- Migration 0054: Ajout colonnes GPS aux zones PV
-- Permet de stocker le centre GPS de chaque zone/string

-- Colonnes latitude/longitude pour le centre de la zone
ALTER TABLE pv_zones ADD COLUMN latitude REAL;
ALTER TABLE pv_zones ADD COLUMN longitude REAL;

-- Index pour recherche spatiale
CREATE INDEX IF NOT EXISTS idx_zones_gps ON pv_zones(latitude, longitude);
