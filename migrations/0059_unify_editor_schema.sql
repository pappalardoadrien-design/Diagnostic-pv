-- MIGRATION 0059: UNIFY EDITOR SCHEMA (V2 + SATELLITE)
-- Assure que la table plant_topology a bien les colonnes pour l'éditeur unifié
-- Cette migration corrige/étend la table si elle a été créée par une ancienne version de 0030

DROP TABLE IF EXISTS plant_topology;

CREATE TABLE plant_topology (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    zone_id INTEGER NOT NULL,
    
    -- Identité Unique
    module_identifier TEXT NOT NULL, -- Ex: S1-12
    barcode TEXT,
    
    -- Logique Électrique (Schématique)
    string_number INTEGER,
    position_in_string INTEGER,
    inverter_id INTEGER,
    
    -- VUE 1: SATELLITE / RÉEL (Designer)
    geo_lat REAL,
    geo_lon REAL,
    geo_rotation REAL DEFAULT 0,
    
    -- VUE 2: SCHÉMATIQUE / CANVAS (Editor V2)
    schematic_x REAL,
    schematic_y REAL,
    schematic_rotation REAL DEFAULT 0,
    
    -- État & Données
    width_meters REAL DEFAULT 1.7,
    height_meters REAL DEFAULT 1.0,
    manufacturer TEXT,
    model TEXT,
    serial_number TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (zone_id) REFERENCES pv_zones(id)
);

CREATE INDEX IF NOT EXISTS idx_topology_project ON plant_topology(project_id);
CREATE INDEX IF NOT EXISTS idx_topology_zone ON plant_topology(zone_id);
CREATE INDEX IF NOT EXISTS idx_topology_identifier ON plant_topology(project_id, module_identifier);
