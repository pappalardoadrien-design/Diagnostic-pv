-- MIGRATION 0060: CONSOLIDATE SCHEMA & INTERCONNECTION
-- Assure que la table de résultats consolidés est parfaitement alignée avec le Digital Twin

-- 1. Réinitialiser diagnosis_results pour garantir la structure
DROP TABLE IF EXISTS diagnosis_results;

CREATE TABLE diagnosis_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topology_id INTEGER NOT NULL,
    audit_token TEXT NOT NULL,
    
    -- Sources de données (Interconnexion Modules)
    status_el TEXT DEFAULT 'ok',
    status_iv TEXT DEFAULT 'ok',
    status_thermal TEXT DEFAULT 'ok',
    status_visual TEXT DEFAULT 'ok',
    status_ai TEXT DEFAULT 'pending',
    
    -- Diagnostic Final
    final_diagnosis TEXT,
    severity_score INTEGER DEFAULT 0,
    action_recommended TEXT,
    
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (topology_id) REFERENCES plant_topology(id) ON DELETE CASCADE
);

-- 2. Index pour la performance des synchronisations
CREATE INDEX IF NOT EXISTS idx_diagnosis_topology ON diagnosis_results(topology_id);
CREATE INDEX IF NOT EXISTS idx_diagnosis_token ON diagnosis_results(audit_token);

-- 3. Vue pour l'Inspector (Performance)
DROP VIEW IF EXISTS v_digital_twin_inspector;
CREATE VIEW v_digital_twin_inspector AS
SELECT 
    t.id as topology_id,
    t.module_identifier,
    t.string_number,
    t.position_in_string,
    t.geo_lat,
    t.geo_lon,
    dr.status_el,
    dr.status_iv,
    dr.status_visual,
    dr.status_thermal,
    dr.final_diagnosis
FROM plant_topology t
LEFT JOIN diagnosis_results dr ON t.id = dr.topology_id;
