-- ============================================================================
-- FIX: Restaurer String 1 JALIBAT (26 modules manquants)
-- ============================================================================
-- Problème : String 1 absente de pv_modules (0 modules) alors que el_modules en contient 26
-- Cause : Migration précédente a supprimé zone "String 1" et ses modules
-- Solution : Réimporter String 1 depuis el_modules vers zone JALIBAT unique
-- ============================================================================

-- ÉTAPE 1: Vérifier zone JALIBAT unique
SELECT 
    'AVANT RESTAURATION:' as phase,
    z.id as zone_id, 
    z.zone_name,
    z.string_count,
    COUNT(m.id) as modules_actuels,
    GROUP_CONCAT(DISTINCT m.string_number ORDER BY m.string_number) as strings_presents
FROM pv_zones z
LEFT JOIN pv_modules m ON z.id = m.zone_id
WHERE z.plant_id IN (SELECT id FROM pv_plants WHERE plant_name='JALIBAT')
GROUP BY z.id;

-- ÉTAPE 2: Copier String 1 depuis el_modules vers pv_modules
INSERT INTO pv_modules (
    zone_id,
    module_identifier,
    string_number,
    position_in_string,
    pos_x_meters,
    pos_y_meters,
    power_wp,
    module_status,
    el_defect_type,
    el_severity_level,
    el_notes,
    el_analysis_date,
    notes,
    created_at,
    updated_at
)
SELECT 
    (SELECT id FROM pv_zones WHERE plant_id = (SELECT id FROM pv_plants WHERE plant_name='JALIBAT') LIMIT 1) as zone_id,
    el.module_identifier,
    el.string_number,
    el.position_in_string,
    el.physical_col * 2.0 as pos_x_meters,  -- Espacement 2m horizontal
    el.physical_row * 1.0 as pos_y_meters,  -- Espacement 1m vertical
    450 as power_wp,  -- Puissance par défaut (à ajuster selon module réel)
    el.defect_type as module_status,  -- Utiliser defect_type comme status
    el.defect_type as el_defect_type,
    el.severity_level as el_severity_level,
    el.comment as el_notes,
    datetime('now') as el_analysis_date,
    'Restauré depuis audit EL (String 1 manquante)' as notes,
    datetime('now') as created_at,
    datetime('now') as updated_at
FROM el_modules el
WHERE el.audit_token = 'jalibat-a4e19950-8b5e-4f3a-9c2d-1e6f7a8b9c0d'
  AND el.string_number = 1
  AND NOT EXISTS (
    SELECT 1 FROM pv_modules pm 
    WHERE pm.module_identifier = el.module_identifier 
      AND pm.zone_id = (SELECT id FROM pv_zones WHERE plant_id = (SELECT id FROM pv_plants WHERE plant_name='JALIBAT') LIMIT 1)
  );

-- ÉTAPE 3: Mettre à jour compteurs zone
UPDATE pv_zones
SET module_count = (
    SELECT COUNT(*) FROM pv_modules WHERE zone_id = pv_zones.id
),
total_power_kwp = (
    SELECT SUM(power_wp) / 1000.0 FROM pv_modules WHERE zone_id = pv_zones.id
),
updated_at = datetime('now')
WHERE plant_id IN (SELECT id FROM pv_plants WHERE plant_name='JALIBAT');

-- ÉTAPE 4: Mettre à jour compteurs centrale
UPDATE pv_plants
SET module_count = (
    SELECT COUNT(*) FROM pv_modules m
    JOIN pv_zones z ON m.zone_id = z.id
    WHERE z.plant_id = pv_plants.id
),
total_power_kwp = (
    SELECT SUM(m.power_wp) / 1000.0 FROM pv_modules m
    JOIN pv_zones z ON m.zone_id = z.id
    WHERE z.plant_id = pv_plants.id
),
updated_at = datetime('now')
WHERE plant_name = 'JALIBAT';

-- ÉTAPE 5: Vérification finale
SELECT 
    'APRÈS RESTAURATION:' as phase,
    z.id as zone_id, 
    z.zone_name,
    z.string_count,
    z.module_count as modules_zone,
    COUNT(m.id) as modules_actuels,
    GROUP_CONCAT(DISTINCT m.string_number ORDER BY m.string_number) as strings_presents,
    z.total_power_kwp
FROM pv_zones z
LEFT JOIN pv_modules m ON z.id = m.zone_id
WHERE z.plant_id IN (SELECT id FROM pv_plants WHERE plant_name='JALIBAT')
GROUP BY z.id;

-- ÉTAPE 6: Distribution par string (doit montrer String 1 avec 26 modules)
SELECT 
    'DISTRIBUTION FINALE PAR STRING:' as phase,
    string_number, 
    COUNT(*) as module_count,
    SUM(power_wp) / 1000.0 as total_power_kwp
FROM pv_modules 
WHERE zone_id IN (
    SELECT id FROM pv_zones 
    WHERE plant_id IN (SELECT id FROM pv_plants WHERE plant_name='JALIBAT')
)
GROUP BY string_number 
ORDER BY string_number;
