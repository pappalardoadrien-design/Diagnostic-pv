-- ============================================================================
-- Migration 0009 : Unification pv_modules + el_modules (Interconnexion complète)
-- ============================================================================
-- Objectif : Permettre workflow complet Calepinage → Audit EL → Annotations
-- Les modules créés dans Canvas V2 doivent recevoir annotations EL
-- Auteur : DiagPV Assistant
-- Date : 2025-11-03
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1: AJOUTER COLONNES ÉLECTROLUMINESCENCE dans pv_modules
-- ============================================================================

-- Photos et analyse EL
ALTER TABLE pv_modules ADD COLUMN el_photo_url TEXT;
ALTER TABLE pv_modules ADD COLUMN el_analysis_date DATETIME;
ALTER TABLE pv_modules ADD COLUMN el_defect_type TEXT; -- 'none', 'microcrack', 'dead_module', 'luminescence_inequality', 'string_open', 'not_connected'
ALTER TABLE pv_modules ADD COLUMN el_severity_level INTEGER DEFAULT 0; -- 0=none, 1=low, 2=medium, 3=high, 4=critical
ALTER TABLE pv_modules ADD COLUMN el_notes TEXT;
ALTER TABLE pv_modules ADD COLUMN el_technician_id INTEGER REFERENCES users(id);

-- Thermographie (Module futur)
ALTER TABLE pv_modules ADD COLUMN ir_photo_url TEXT;
ALTER TABLE pv_modules ADD COLUMN ir_hotspot_temp REAL;
ALTER TABLE pv_modules ADD COLUMN ir_analysis_date DATETIME;

-- Courbes IV (Module futur)
ALTER TABLE pv_modules ADD COLUMN iv_curve_data TEXT; -- JSON
ALTER TABLE pv_modules ADD COLUMN iv_isc REAL;
ALTER TABLE pv_modules ADD COLUMN iv_voc REAL;
ALTER TABLE pv_modules ADD COLUMN iv_pmax REAL;
ALTER TABLE pv_modules ADD COLUMN iv_fill_factor REAL;
ALTER TABLE pv_modules ADD COLUMN iv_analysis_date DATETIME;

-- Timestamp mise à jour
ALTER TABLE pv_modules ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;

-- ============================================================================
-- ÉTAPE 2: TRIGGER pour mettre à jour updated_at
-- ============================================================================

CREATE TRIGGER IF NOT EXISTS update_pv_modules_timestamp 
AFTER UPDATE ON pv_modules
BEGIN
  UPDATE pv_modules SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- ============================================================================
-- ÉTAPE 3: INDEX pour performances recherches EL
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_pv_modules_el_defect ON pv_modules(el_defect_type);
CREATE INDEX IF NOT EXISTS idx_pv_modules_el_severity ON pv_modules(el_severity_level);
CREATE INDEX IF NOT EXISTS idx_pv_modules_status ON pv_modules(module_status);
CREATE INDEX IF NOT EXISTS idx_pv_modules_el_tech ON pv_modules(el_technician_id);

-- ============================================================================
-- ÉTAPE 4: VUE unifiée pour audits (Stats globales)
-- ============================================================================

CREATE VIEW IF NOT EXISTS v_pv_modules_audit_stats AS
SELECT 
  z.id AS zone_id,
  z.zone_name,
  z.plant_id,
  COUNT(m.id) AS total_modules,
  
  -- Stats statut global
  SUM(CASE WHEN m.module_status = 'ok' THEN 1 ELSE 0 END) AS status_ok,
  SUM(CASE WHEN m.module_status = 'warning' THEN 1 ELSE 0 END) AS status_warning,
  SUM(CASE WHEN m.module_status = 'critical' THEN 1 ELSE 0 END) AS status_critical,
  SUM(CASE WHEN m.module_status = 'pending' THEN 1 ELSE 0 END) AS status_pending,
  
  -- Stats EL
  SUM(CASE WHEN m.el_defect_type = 'none' THEN 1 ELSE 0 END) AS el_ok,
  SUM(CASE WHEN m.el_defect_type = 'microcrack' THEN 1 ELSE 0 END) AS el_microcrack,
  SUM(CASE WHEN m.el_defect_type = 'dead_module' THEN 1 ELSE 0 END) AS el_dead,
  SUM(CASE WHEN m.el_defect_type = 'luminescence_inequality' THEN 1 ELSE 0 END) AS el_inequality,
  SUM(CASE WHEN m.el_defect_type = 'string_open' THEN 1 ELSE 0 END) AS el_string_open,
  SUM(CASE WHEN m.el_defect_type = 'not_connected' THEN 1 ELSE 0 END) AS el_not_connected,
  SUM(CASE WHEN m.el_severity_level >= 3 THEN 1 ELSE 0 END) AS el_critical_count,
  
  -- Taux complétion EL
  CAST(COUNT(CASE WHEN m.el_defect_type IS NOT NULL THEN 1 END) AS REAL) * 100.0 / COUNT(m.id) AS el_completion_rate,
  
  -- Puissance
  SUM(m.power_wp) / 1000.0 AS total_power_kwp,
  
  -- Dates
  MAX(m.el_analysis_date) AS last_el_analysis,
  MAX(m.updated_at) AS last_update
  
FROM pv_zones z
LEFT JOIN pv_modules m ON z.id = m.zone_id
GROUP BY z.id;

-- ============================================================================
-- ÉTAPE 5: FONCTION HELPER pour migration données el_modules → pv_modules
-- ============================================================================
-- Note: Cette migration doit être exécutée manuellement si nécessaire
-- pour transférer les données existantes de el_modules vers pv_modules
-- Script manuel disponible dans la documentation

-- ============================================================================
-- FIN MIGRATION 0009
-- ============================================================================
