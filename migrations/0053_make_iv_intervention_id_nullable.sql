-- Migration: 0053 - Rendre intervention_id nullable dans iv_measurements
-- Date: 2025-12-04
-- Description: Permet de lier les mesures I-V directement aux audits sans intervention obligatoire

-- ==========================================
-- ÉTAPE 1 : Supprimer TOUTES les VIEWs (15 VIEWs)
-- ==========================================

DROP VIEW IF EXISTS v_subcontractor_stats;
DROP VIEW IF EXISTS v_pv_zones_stats;
DROP VIEW IF EXISTS v_pv_structures_stats;
DROP VIEW IF EXISTS v_pv_modules_audit_stats;
DROP VIEW IF EXISTS v_module_performance_summary;
DROP VIEW IF EXISTS v_module_complete;
DROP VIEW IF EXISTS v_missions_actives;
DROP VIEW IF EXISTS v_labels_stats_globales;
DROP VIEW IF EXISTS v_inverter_summary;
DROP VIEW IF EXISTS v_electrical_validation;
DROP VIEW IF EXISTS v_el_photos_stats;
DROP VIEW IF EXISTS v_el_audit_statistics;
DROP VIEW IF EXISTS v_diagnostiqueurs_labellises;
DROP VIEW IF EXISTS v_complete_workflow;
DROP VIEW IF EXISTS v_centrales_labellisees;

-- ==========================================
-- ÉTAPE 2 : Modifier iv_measurements (intervention_id nullable)
-- ==========================================

CREATE TABLE iv_measurements_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    intervention_id INTEGER,  -- NULLABLE maintenant
    string_number INTEGER,
    module_number INTEGER,
    measurement_type TEXT NOT NULL CHECK (measurement_type IN ('reference', 'dark')),
    isc REAL,
    voc REAL,
    pmax REAL,
    impp REAL,
    vmpp REAL,
    fill_factor REAL,
    irradiance REAL,
    temperature_module REAL,
    temperature_ambient REAL,
    iv_curve_data TEXT,
    pmax_stc_corrected REAL,
    deviation_from_datasheet REAL,
    rs REAL,
    rsh REAL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    module_identifier TEXT,
    audit_token TEXT,
    audit_id INTEGER,
    FOREIGN KEY (intervention_id) REFERENCES interventions(id) ON DELETE SET NULL,
    FOREIGN KEY (audit_id) REFERENCES audits(id) ON DELETE CASCADE
);

INSERT INTO iv_measurements_new 
SELECT * FROM iv_measurements;

DROP TABLE iv_measurements;
ALTER TABLE iv_measurements_new RENAME TO iv_measurements;

CREATE INDEX idx_iv_measurements_token ON iv_measurements(audit_token);
CREATE INDEX idx_iv_measurements_audit_id ON iv_measurements(audit_id);
CREATE INDEX idx_iv_measurements_module_identifier ON iv_measurements(module_identifier);
CREATE INDEX idx_iv_intervention ON iv_measurements(intervention_id);
CREATE INDEX idx_iv_type ON iv_measurements(measurement_type);

-- ==========================================
-- ÉTAPE 3 : Recréer TOUTES les VIEWs
-- ==========================================

-- Vue 1/15
CREATE VIEW v_module_complete AS
SELECT 
    em.id as el_module_id,
    em.module_identifier,
    em.string_number,
    em.position_in_string,
    em.audit_token,
    em.el_audit_id,
    em.defect_type as el_defect_type,
    em.severity_level as el_severity,
    em.comment as el_comment,
    em.image_url as el_image_url,
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
    iv_dark.rs as iv_dark_rs,
    iv_dark.rsh as iv_dark_rsh,
    iv_dark.iv_curve_data as iv_dark_curve,
    pv.ff as pvserv_ff,
    pv.rds as pvserv_rds,
    pv.uf as pvserv_uf,
    pv.iv_curve_data as pvserv_curve,
    ea.project_name,
    ea.client_name,
    ea.location,
    ea.intervention_id,
    em.created_at as el_created_at,
    iv_ref.created_at as iv_ref_created_at,
    iv_dark.created_at as iv_dark_created_at,
    pv.created_at as pvserv_created_at
FROM el_modules em
LEFT JOIN el_audits ea ON em.el_audit_id = ea.id
LEFT JOIN iv_measurements iv_ref ON em.module_identifier = iv_ref.module_identifier AND iv_ref.measurement_type = 'reference'
LEFT JOIN iv_measurements iv_dark ON em.module_identifier = iv_dark.module_identifier AND iv_dark.measurement_type = 'dark'
LEFT JOIN pvserv_measurements pv ON em.module_identifier = pv.module_identifier AND em.audit_token = pv.audit_token
ORDER BY em.string_number, em.position_in_string;

-- Vue 2/15
CREATE VIEW v_module_performance_summary AS
SELECT 
    module_identifier,
    string_number,
    position_in_string,
    el_defect_type,
    el_severity,
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
    iv_ref_rs as series_resistance,
    iv_ref_rsh as shunt_resistance,
    iv_dark_rs as dark_series_resistance,
    iv_dark_rsh as dark_shunt_resistance,
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

-- Vue 3/15
CREATE VIEW v_el_audit_statistics AS
SELECT 
  ea.id AS audit_id,
  ea.audit_token,
  ea.project_name,
  ea.client_name,
  ea.total_modules,
  ea.completion_rate,
  ea.status,
  COUNT(em.id) AS modules_diagnosed,
  SUM(CASE WHEN em.defect_type = 'none' THEN 1 ELSE 0 END) AS modules_ok,
  SUM(CASE WHEN em.defect_type = 'microcrack' THEN 1 ELSE 0 END) AS modules_microcrack,
  SUM(CASE WHEN em.defect_type = 'dead_module' THEN 1 ELSE 0 END) AS modules_dead,
  SUM(CASE WHEN em.defect_type = 'luminescence_inequality' THEN 1 ELSE 0 END) AS modules_inequality,
  SUM(CASE WHEN em.severity_level >= 2 THEN 1 ELSE 0 END) AS modules_critical,
  ea.created_at,
  ea.updated_at
FROM el_audits ea
LEFT JOIN el_modules em ON ea.id = em.el_audit_id
GROUP BY ea.id;

-- Vue 4/15
CREATE VIEW v_el_photos_stats AS
SELECT 
  audit_token,
  COUNT(*) as total_photos,
  COUNT(DISTINCT el_module_id) as modules_with_photos,
  COUNT(CASE WHEN photo_type = 'defect' THEN 1 END) as defect_photos,
  COUNT(CASE WHEN severity_level >= 3 THEN 1 END) as critical_photos,
  SUM(file_size) as total_storage_bytes,
  MAX(created_at) as last_upload
FROM el_photos
GROUP BY audit_token;

-- Vue 5/15
CREATE VIEW v_pv_zones_stats AS
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

-- Vue 6/15
CREATE VIEW v_pv_modules_audit_stats AS
SELECT 
  z.id AS zone_id,
  z.zone_name,
  z.plant_id,
  COUNT(m.id) AS total_modules,
  SUM(CASE WHEN m.module_status = 'ok' THEN 1 ELSE 0 END) AS status_ok,
  SUM(CASE WHEN m.module_status = 'warning' THEN 1 ELSE 0 END) AS status_warning,
  SUM(CASE WHEN m.module_status = 'critical' THEN 1 ELSE 0 END) AS status_critical,
  SUM(CASE WHEN m.module_status = 'pending' THEN 1 ELSE 0 END) AS status_pending,
  SUM(CASE WHEN m.el_defect_type = 'none' THEN 1 ELSE 0 END) AS el_ok,
  SUM(CASE WHEN m.el_defect_type = 'microcrack' THEN 1 ELSE 0 END) AS el_microcrack,
  SUM(CASE WHEN m.el_defect_type = 'dead_module' THEN 1 ELSE 0 END) AS el_dead,
  SUM(CASE WHEN m.el_defect_type = 'luminescence_inequality' THEN 1 ELSE 0 END) AS el_inequality,
  SUM(CASE WHEN m.el_defect_type = 'string_open' THEN 1 ELSE 0 END) AS el_string_open,
  SUM(CASE WHEN m.el_defect_type = 'not_connected' THEN 1 ELSE 0 END) AS el_not_connected,
  SUM(CASE WHEN m.el_severity_level >= 3 THEN 1 ELSE 0 END) AS el_critical_count,
  CAST(COUNT(CASE WHEN m.el_defect_type IS NOT NULL THEN 1 END) AS REAL) * 100.0 / COUNT(m.id) AS el_completion_rate,
  SUM(m.power_wp) / 1000.0 AS total_power_kwp,
  MAX(m.el_analysis_date) AS last_el_analysis,
  MAX(m.updated_at) AS last_update
FROM pv_zones z
LEFT JOIN pv_modules m ON z.id = m.zone_id
GROUP BY z.id;

-- Vue 7/15
CREATE VIEW v_pv_structures_stats AS
SELECT 
  z.id AS zone_id,
  z.zone_name,
  z.plant_id,
  COUNT(s.id) AS total_structures,
  SUM(CASE WHEN s.structure_type = 'building' THEN 1 ELSE 0 END) AS count_buildings,
  SUM(CASE WHEN s.structure_type = 'carport' THEN 1 ELSE 0 END) AS count_carports,
  SUM(CASE WHEN s.structure_type = 'ground' THEN 1 ELSE 0 END) AS count_ground,
  SUM(CASE WHEN s.structure_type = 'technical' THEN 1 ELSE 0 END) AS count_technical,
  SUM(s.area_sqm) AS total_area_sqm,
  SUM(CASE WHEN s.structure_type = 'building' THEN s.area_sqm ELSE 0 END) AS building_area_sqm,
  SUM(CASE WHEN s.structure_type = 'carport' THEN s.area_sqm ELSE 0 END) AS carport_area_sqm,
  SUM(CASE WHEN s.structure_type = 'ground' THEN s.area_sqm ELSE 0 END) AS ground_area_sqm,
  MAX(s.updated_at) AS last_update
FROM pv_zones z
LEFT JOIN pv_structures s ON z.id = s.zone_id
GROUP BY z.id;

-- Vue 8/15
CREATE VIEW v_inverter_summary AS
SELECT 
    i.id AS inverter_id,
    i.zone_id,
    i.inverter_name,
    i.inverter_model,
    i.rated_power_kw,
    i.mppt_count,
    COUNT(DISTINCT sa.string_number) AS assigned_strings,
    COUNT(m.id) AS module_count,
    SUM(m.power_wp) / 1000.0 AS total_power_kwp,
    ROUND(SUM(m.power_wp) / 1000.0 / i.rated_power_kw * 100, 1) AS load_percent
FROM pv_inverters i
LEFT JOIN pv_string_assignments sa ON i.id = sa.inverter_id
LEFT JOIN pv_modules m ON sa.string_number = m.string_number AND m.zone_id = i.zone_id
GROUP BY i.id;

-- Vue 9/15
CREATE VIEW v_electrical_validation AS
SELECT 
    z.id AS zone_id,
    z.zone_name,
    z.string_count AS expected_strings,
    COUNT(DISTINCT sa.string_number) AS assigned_strings,
    z.string_count - COUNT(DISTINCT sa.string_number) AS unassigned_strings,
    COUNT(DISTINCT i.id) AS inverter_count,
    SUM(i.rated_power_kw) AS total_inverter_power_kw,
    SUM(m.power_wp) / 1000.0 AS total_module_power_kwp,
    CASE 
        WHEN COUNT(DISTINCT sa.string_number) < z.string_count THEN 'WARNING: Strings non attribués'
        WHEN SUM(m.power_wp) / 1000.0 > SUM(i.rated_power_kw) * 1.2 THEN 'WARNING: Surdimensionnement onduleurs'
        ELSE 'OK'
    END AS validation_status
FROM pv_zones z
LEFT JOIN pv_inverters i ON z.id = i.zone_id
LEFT JOIN pv_string_assignments sa ON i.id = sa.inverter_id
LEFT JOIN pv_modules m ON sa.string_number = m.string_number AND m.zone_id = z.id
GROUP BY z.id;

-- Vue 10/15
CREATE VIEW v_subcontractor_stats AS
SELECT 
  s.id,
  s.company_name,
  s.contact_name,
  s.status,
  s.rating,
  COUNT(sm.id) as total_missions,
  COUNT(CASE WHEN sm.status = 'completed' THEN 1 END) as completed_missions,
  COUNT(CASE WHEN sm.status = 'failed' THEN 1 END) as failed_missions,
  ROUND(AVG(sm.quality_rating), 2) as avg_quality,
  ROUND(AVG(sm.report_delay_days), 1) as avg_delay_days,
  SUM(sm.total_cost) as total_revenue,
  MAX(sm.mission_date) as last_mission_date,
  COUNT(CASE WHEN sm.mission_date >= date('now', '-30 days') THEN 1 END) as missions_last_30_days
FROM subcontractors s
LEFT JOIN subcontractor_missions sm ON s.id = sm.subcontractor_id
GROUP BY s.id;

-- Vue 11/15
CREATE VIEW v_complete_workflow AS
SELECT 
  cc.id as client_id,
  cc.company_name,
  cc.siret,
  cc.main_contact_name,
  cc.main_contact_email,
  cc.main_contact_phone,
  cc.status as client_status,
  p.id as project_id,
  p.name as project_name,
  p.site_address,
  p.installation_power,
  p.total_modules as project_total_modules,
  i.id as intervention_id,
  i.intervention_type,
  i.intervention_date,
  i.duration_hours,
  i.status as intervention_status,
  u.id as technician_id,
  u.email as technician_email,
  a.id as audit_id,
  a.audit_token,
  a.status as audit_status,
  a.total_modules as audit_total_modules,
  a.completion_rate,
  COUNT(DISTINCT m.id) as modules_diagnosed,
  SUM(CASE WHEN m.defect_type = 'ok' THEN 1 ELSE 0 END) as modules_ok,
  SUM(CASE WHEN m.defect_type = 'microfissure' THEN 1 ELSE 0 END) as modules_microfissure,
  SUM(CASE WHEN m.defect_type = 'dead' THEN 1 ELSE 0 END) as modules_dead,
  SUM(CASE WHEN m.defect_type = 'string_open' THEN 1 ELSE 0 END) as modules_string_open,
  SUM(CASE WHEN m.defect_type = 'not_connected' THEN 1 ELSE 0 END) as modules_not_connected,
  SUM(CASE WHEN m.defect_type = 'inequality' THEN 1 ELSE 0 END) as modules_inequality
FROM crm_clients cc
LEFT JOIN projects p ON p.client_id = cc.id
LEFT JOIN interventions i ON i.project_id = p.id
LEFT JOIN auth_users u ON u.id = i.technician_id
LEFT JOIN el_audits a ON a.intervention_id = i.id
LEFT JOIN el_modules m ON m.el_audit_id = a.id
GROUP BY cc.id, p.id, i.id, a.id;

-- Vue 12/15
CREATE VIEW v_centrales_labellisees AS
SELECT 
  lc.id as label_id,
  lc.numero_label,
  lc.niveau,
  lc.taux_conformite,
  lc.score_global,
  lc.date_delivrance,
  lc.date_expiration,
  lc.statut as statut_label,
  lc.public,
  p.id as project_id,
  p.name as centrale_nom,
  p.address as centrale_adresse,
  p.city as centrale_ville,
  p.postal_code as centrale_cp,
  p.capacity_kwc as puissance_kwc,
  p.client_id,
  c.name as client_nom,
  julianday(lc.date_expiration) - julianday('now') as jours_avant_expiration,
  CASE 
    WHEN julianday(lc.date_expiration) < julianday('now') THEN 'expire'
    WHEN julianday(lc.date_expiration) - julianday('now') <= 60 THEN 'expire_bientot'
    ELSE 'actif'
  END as alerte_expiration
FROM labels_centrales lc
INNER JOIN projects p ON lc.project_id = p.id
LEFT JOIN clients c ON p.client_id = c.id
WHERE lc.statut = 'actif'
ORDER BY lc.niveau DESC, lc.date_expiration ASC;

-- Vue 13/15
CREATE VIEW v_diagnostiqueurs_labellises AS
SELECT 
  ld.id as label_id,
  ld.numero_label,
  ld.niveau,
  ld.date_delivrance,
  ld.date_expiration,
  ld.statut as statut_label,
  d.id as diagnostiqueur_id,
  d.nom,
  d.prenom,
  d.email,
  d.telephone,
  d.specialites,
  d.zones_intervention,
  d.nombre_audits_realises,
  d.note_moyenne,
  julianday(ld.date_expiration) - julianday('now') as jours_avant_expiration,
  CASE 
    WHEN julianday(ld.date_expiration) < julianday('now') THEN 'expire'
    WHEN julianday(ld.date_expiration) - julianday('now') <= 30 THEN 'expire_bientot'
    ELSE 'actif'
  END as alerte_expiration
FROM labels_diagnostiqueurs ld
INNER JOIN diagnostiqueurs d ON ld.diagnostiqueur_id = d.id
WHERE ld.statut = 'actif'
ORDER BY ld.date_expiration ASC;

-- Vue 14/15
CREATE VIEW v_labels_stats_globales AS
SELECT 
  (SELECT COUNT(*) FROM labels_diagnostiqueurs WHERE statut = 'actif') as diag_actifs,
  (SELECT COUNT(*) FROM labels_diagnostiqueurs WHERE statut = 'suspendu') as diag_suspendus,
  (SELECT COUNT(*) FROM labels_diagnostiqueurs WHERE statut = 'expire') as diag_expires,
  (SELECT COUNT(*) FROM labels_diagnostiqueurs WHERE niveau = 'junior') as diag_junior,
  (SELECT COUNT(*) FROM labels_diagnostiqueurs WHERE niveau = 'confirme') as diag_confirme,
  (SELECT COUNT(*) FROM labels_diagnostiqueurs WHERE niveau = 'expert') as diag_expert,
  (SELECT COUNT(*) FROM labels_diagnostiqueurs WHERE niveau = 'formateur') as diag_formateur,
  (SELECT COUNT(*) FROM labels_centrales WHERE statut = 'actif') as centrales_actives,
  (SELECT COUNT(*) FROM labels_centrales WHERE statut = 'expire') as centrales_expirees,
  (SELECT COUNT(*) FROM labels_centrales WHERE niveau = 'bronze') as centrales_bronze,
  (SELECT COUNT(*) FROM labels_centrales WHERE niveau = 'argent') as centrales_argent,
  (SELECT COUNT(*) FROM labels_centrales WHERE niveau = 'or') as centrales_or,
  (SELECT COUNT(*) FROM labels_centrales WHERE niveau = 'platine') as centrales_platine,
  (SELECT AVG(taux_conformite) FROM labels_centrales WHERE statut = 'actif') as taux_conformite_moyen,
  (SELECT COUNT(*) FROM labels_reclamations WHERE statut = 'en_attente') as reclamations_en_attente,
  (SELECT COUNT(*) FROM labels_reclamations WHERE gravite = 'critique') as reclamations_critiques;

-- Vue 15/15
CREATE VIEW v_missions_actives AS
SELECT 
  m.*,
  p.name as project_name,
  p.client_id,
  d.nom as diagnostiqueur_nom,
  d.prenom as diagnostiqueur_prenom,
  d.email as diagnostiqueur_email,
  d.telephone as diagnostiqueur_telephone,
  (SELECT COUNT(*) FROM missions_propositions WHERE mission_id = m.id AND statut = 'proposee') as propositions_en_attente
FROM missions m
LEFT JOIN projects p ON m.project_id = p.id
LEFT JOIN diagnostiqueurs d ON m.diagnostiqueur_affecte_id = d.id
WHERE m.statut NOT IN ('terminee', 'validee', 'annulee')
ORDER BY 
  CASE m.priorite
    WHEN 'urgente' THEN 1
    WHEN 'haute' THEN 2
    WHEN 'normale' THEN 3
    WHEN 'basse' THEN 4
  END,
  m.date_souhaitee ASC;

-- ==========================================
-- FIN DE LA MIGRATION
-- ==========================================
