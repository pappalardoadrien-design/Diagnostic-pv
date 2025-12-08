-- MIGRATION 0030: AI-READY STRUCTURE & DIGITAL TWIN (VERSION UNIFIÉE 1+3)
-- Objectif : Unifier "Editor V2" (Schématique) et "Designer" (Satellite) dans une seule table

-- 1. TABLE CENTRALE : DIGITAL TWIN (Topologie Unifiée)
-- Remplace 'pv_modules', 'el_modules' (partiellement) et 'calepinage_layouts'
CREATE TABLE IF NOT EXISTS plant_topology (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    zone_id INTEGER NOT NULL,
    
    -- Identité Unique du Module
    module_identifier TEXT NOT NULL, -- Ex: S1-12
    barcode TEXT,
    
    -- Logique Électrique (Vient de l'Audit EL/Schematic)
    string_number INTEGER,
    position_in_string INTEGER,
    inverter_id INTEGER,
    
    -- VUE 1: SATELLITE / RÉEL (Designer - Leaflet)
    geo_lat REAL,          -- Latitude GPS
    geo_lon REAL,          -- Longitude GPS
    geo_rotation REAL DEFAULT 0, -- Orientation réelle par rapport au Nord
    
    -- VUE 2: SCHÉMATIQUE / CANVAS (Editor V2)
    schematic_x REAL,      -- Position X sur le canvas infini
    schematic_y REAL,      -- Position Y sur le canvas infini
    schematic_rotation REAL DEFAULT 0, -- Rotation orthogonale (0, 90, 180, 270)
    
    -- État & Données
    width_meters REAL DEFAULT 1.7,  -- Dimensions physiques
    height_meters REAL DEFAULT 1.0,
    manufacturer TEXT,
    model TEXT,
    serial_number TEXT,
    
    -- Liens
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (zone_id) REFERENCES pv_zones(id)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_topology_project ON plant_topology(project_id);
CREATE INDEX IF NOT EXISTS idx_topology_zone ON plant_topology(zone_id);
CREATE INDEX IF NOT EXISTS idx_topology_identifier ON plant_topology(project_id, module_identifier);

-- 2. TABLE PHOTOS ENRICHIE (AI-READY)
CREATE TABLE IF NOT EXISTS media_assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    audit_token TEXT NOT NULL,
    topology_id INTEGER, -- Lien vers le module unique
    
    -- Stockage Cloudflare R2
    r2_key TEXT NOT NULL,
    r2_url TEXT NOT NULL,
    original_filename TEXT,
    mime_type TEXT,
    file_size INTEGER,
    
    -- Classification IA
    asset_type TEXT NOT NULL, -- 'el_image', 'rgb_image', 'ir_image', 'drone_ortho'
    capture_angle TEXT, -- 'nadir', 'oblique', 'ground'
    spectrum TEXT, -- 'visible', 'infrared', 'electroluminescence'
    
    -- Statut IA
    ai_status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'verified'
    ai_confidence REAL,
    ai_metadata JSON, -- Bounding boxes, segmentation masks
    
    -- Métadonnées Capture
    captured_at DATETIME,
    gps_lat REAL,
    gps_lon REAL,
    gps_alt REAL,
    device_model TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (topology_id) REFERENCES plant_topology(id)
);

-- 3. TABLE DIAGNOSTIC INTELLIGENT (Consolidé)
CREATE TABLE IF NOT EXISTS diagnosis_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topology_id INTEGER NOT NULL,
    audit_token TEXT NOT NULL,
    
    -- Sources de données (Raw Status)
    status_el TEXT,      -- Défaut EL (Ex: 'microcracks')
    status_iv TEXT,      -- Défaut IV (Ex: 'voc_mismatch')
    status_thermal TEXT, -- Défaut IR (Ex: 'hotspot')
    status_visual TEXT,  -- Défaut Visuel (Ex: 'breakage')
    status_ai TEXT,      -- Détection IA
    
    -- Diagnostic Final (Moteur de Corrélation)
    final_diagnosis TEXT, -- Ex: 'PID_CONFIRMED'
    severity_score INTEGER, -- 1 (OK) à 5 (Danger Critique)
    action_recommended TEXT, -- 'clean', 'check_diode', 'replace'
    
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (topology_id) REFERENCES plant_topology(id)
);

-- 4. QUEUE ASYNCHRONE IA
CREATE TABLE IF NOT EXISTS ai_processing_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    media_id INTEGER NOT NULL,
    priority INTEGER DEFAULT 1,
    status TEXT DEFAULT 'queued',
    attempts INTEGER DEFAULT 0,
    last_error TEXT,
    processed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (media_id) REFERENCES media_assets(id)
);

