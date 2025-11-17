-- Migration 0028: Unifier les identifiants modules entre EL, I-V et PVserv
-- Ajoute module_identifier aux tables I-V et PVserv pour liaison directe avec el_modules

-- ============================================================================
-- 1. Ajouter colonne module_identifier à iv_measurements
-- ============================================================================
ALTER TABLE iv_measurements ADD COLUMN module_identifier TEXT;

-- Générer module_identifier depuis string_number et module_number existants
-- Format: "S{string}-{module}" (ex: "S1-15")
UPDATE iv_measurements 
SET module_identifier = 'S' || string_number || '-' || module_number
WHERE string_number IS NOT NULL AND module_number IS NOT NULL;

-- Créer index pour performances
CREATE INDEX IF NOT EXISTS idx_iv_measurements_module_identifier 
ON iv_measurements(module_identifier);

-- ============================================================================
-- 2. Ajouter colonne module_identifier à pvserv_measurements
-- ============================================================================
ALTER TABLE pvserv_measurements ADD COLUMN module_identifier TEXT;

-- Générer module_identifier depuis string_number et module_number existants
UPDATE pvserv_measurements 
SET module_identifier = 'S' || string_number || '-' || module_number
WHERE string_number IS NOT NULL AND module_number IS NOT NULL;

-- Créer index pour performances
CREATE INDEX IF NOT EXISTS idx_pvserv_measurements_module_identifier 
ON pvserv_measurements(module_identifier);

-- ============================================================================
-- 3. Créer vue unifiée v_module_complete
-- Vue combinant données EL + I-V + PVserv par module
-- ============================================================================
DROP VIEW IF EXISTS v_module_complete;

CREATE VIEW v_module_complete AS
SELECT 
    -- Identifiants
    em.id as el_module_id,
    em.module_identifier,
    em.string_number,
    em.position_in_string,
    em.audit_token,
    em.el_audit_id,
    
    -- Données EL (Électroluminescence)
    em.defect_type as el_defect_type,
    em.severity_level as el_severity,
    em.comment as el_comment,
    em.image_url as el_image_url,
    
    -- Données I-V Référence (Lumière)
    iv_ref.isc as iv_ref_isc,
    iv_ref.voc as iv_ref_voc,
    iv_ref.pmax as iv_ref_pmax,
    iv_ref.impp as iv_ref_impp,
    iv_ref.vmpp as iv_ref_vmpp,
    iv_ref.fill_factor as iv_ref_ff,
    iv_ref.rs as iv_ref_rs,
    iv_ref.rsh as iv_ref_rsh,
    iv_ref.iv_curve_data as iv_ref_curve,
    iv_ref.pmax_stc_corrected as iv_ref_pmax_stc,
    iv_ref.deviation_from_datasheet as iv_ref_deviation,
    
    -- Données I-V Sombre (Dark Curve)
    iv_dark.rs as iv_dark_rs,
    iv_dark.rsh as iv_dark_rsh,
    iv_dark.iv_curve_data as iv_dark_curve,
    
    -- Données PVserv
    pv.ff as pvserv_ff,
    pv.rds as pvserv_rds,
    pv.uf as pvserv_uf,
    pv.iv_curve_data as pvserv_curve,
    
    -- Métadonnées audit
    ea.project_name,
    ea.client_name,
    ea.location,
    ea.intervention_id,
    
    -- Timestamps
    em.created_at as el_created_at,
    iv_ref.created_at as iv_ref_created_at,
    iv_dark.created_at as iv_dark_created_at,
    pv.created_at as pvserv_created_at

FROM el_modules em

-- JOIN audit EL pour métadonnées
LEFT JOIN el_audits ea ON em.el_audit_id = ea.id

-- JOIN I-V référence (mesures en lumière)
LEFT JOIN iv_measurements iv_ref ON 
    em.module_identifier = iv_ref.module_identifier 
    AND iv_ref.measurement_type = 'reference'

-- JOIN I-V sombre (dark curves)
LEFT JOIN iv_measurements iv_dark ON 
    em.module_identifier = iv_dark.module_identifier 
    AND iv_dark.measurement_type = 'dark'

-- JOIN PVserv
LEFT JOIN pvserv_measurements pv ON 
    em.module_identifier = pv.module_identifier 
    AND em.audit_token = pv.audit_token

ORDER BY em.string_number, em.position_in_string;

-- ============================================================================
-- 4. Créer vue statistiques par module
-- Résumé performance globale de chaque module (EL + I-V combinés)
-- ============================================================================
DROP VIEW IF EXISTS v_module_performance_summary;

CREATE VIEW v_module_performance_summary AS
SELECT 
    module_identifier,
    string_number,
    position_in_string,
    
    -- Statut EL
    el_defect_type,
    el_severity,
    
    -- Performance I-V (% de déviation)
    CASE 
        WHEN iv_ref_deviation IS NOT NULL THEN 
            CASE 
                WHEN ABS(iv_ref_deviation) > 10 THEN 'Critique'
                WHEN ABS(iv_ref_deviation) > 5 THEN 'Dégradé'
                ELSE 'OK'
            END
        ELSE 'Non mesuré'
    END as iv_performance_status,
    
    iv_ref_pmax as pmax_measured,
    iv_ref_pmax_stc as pmax_stc,
    iv_ref_deviation as deviation_percent,
    
    -- Résistances (indicateurs qualité)
    iv_ref_rs as series_resistance,
    iv_ref_rsh as shunt_resistance,
    iv_dark_rs as dark_series_resistance,
    iv_dark_rsh as dark_shunt_resistance,
    
    -- Score global (0-100)
    -- Combinaison EL severity + I-V deviation
    CASE 
        WHEN el_defect_type = 'pending' THEN NULL
        WHEN el_defect_type = 'dead' THEN 0
        WHEN el_severity >= 4 AND ABS(COALESCE(iv_ref_deviation, 0)) > 10 THEN 25
        WHEN el_severity >= 3 AND ABS(COALESCE(iv_ref_deviation, 0)) > 5 THEN 50
        WHEN el_severity >= 2 OR ABS(COALESCE(iv_ref_deviation, 0)) > 3 THEN 75
        ELSE 90
    END as global_health_score,
    
    project_name,
    client_name

FROM v_module_complete;

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================
-- module_identifier: Clé de liaison unifiée "S{string}-{module}" (ex: "S1-15")
-- v_module_complete: Vue complète avec TOUTES les données d'un module
-- v_module_performance_summary: Vue résumé avec score santé global
-- 
-- USAGE:
-- SELECT * FROM v_module_complete WHERE module_identifier = 'S1-15';
-- SELECT * FROM v_module_performance_summary WHERE global_health_score < 50;
