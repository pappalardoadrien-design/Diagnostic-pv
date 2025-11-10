-- ============================================================================
-- FIX: Restaurer String 1 JALIBAT (26 modules manquants) - VERSION SIMPLIFIÉE
-- ============================================================================

-- ÉTAPE 1: Vérifier distribution actuelle
SELECT 
    'AVANT RESTAURATION:' as phase,
    string_number, 
    COUNT(*) as module_count
FROM pv_modules 
WHERE zone_id = 24  -- Zone JALIBAT unique
GROUP BY string_number 
ORDER BY string_number;

-- ÉTAPE 2: Copier String 1 depuis el_modules (26 modules)
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
    24 as zone_id,  -- Zone JALIBAT
    el.module_identifier,
    el.string_number,
    el.position_in_string,
    el.physical_col * 2.0 as pos_x_meters,
    el.physical_row * 1.0 as pos_y_meters,
    450 as power_wp,
    'pending' as module_status,  -- Valeur par défaut (sera mise à jour via UI)
    el.defect_type as el_defect_type,
    el.severity_level as el_severity_level,
    el.comment as el_notes,
    datetime('now') as el_analysis_date,
    'Restauré depuis audit EL - String 1 manquante' as notes,
    datetime('now') as created_at,
    datetime('now') as updated_at
FROM el_modules el
WHERE el.audit_token = 'jalibat-a4e19950-8b5e-4f3a-9c2d-1e6f7a8b9c0d'
  AND el.string_number = 1
  AND NOT EXISTS (
    SELECT 1 FROM pv_modules pm 
    WHERE pm.module_identifier = el.module_identifier 
      AND pm.zone_id = 24
  );

-- ÉTAPE 3: Vérification distribution après restauration
SELECT 
    'APRÈS RESTAURATION:' as phase,
    string_number, 
    COUNT(*) as module_count,
    SUM(power_wp) / 1000.0 as total_power_kwp
FROM pv_modules 
WHERE zone_id = 24
GROUP BY string_number 
ORDER BY string_number;

-- ÉTAPE 4: Mettre à jour compteurs zone
UPDATE pv_zones
SET module_count = (SELECT COUNT(*) FROM pv_modules WHERE zone_id = 24),
    total_power_kwp = (SELECT SUM(power_wp) / 1000.0 FROM pv_modules WHERE zone_id = 24),
    updated_at = datetime('now')
WHERE id = 24;

-- ÉTAPE 5: Mettre à jour compteurs centrale
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

-- ÉTAPE 6: Vérification finale complète
SELECT 
    'STATISTIQUES FINALES:' as phase,
    p.plant_name,
    p.module_count as plant_module_count,
    p.total_power_kwp as plant_power_kwp,
    z.zone_name,
    z.module_count as zone_module_count,
    (SELECT COUNT(DISTINCT string_number) FROM pv_modules WHERE zone_id = z.id) as string_count_actual
FROM pv_plants p
JOIN pv_zones z ON p.id = z.plant_id
WHERE p.plant_name = 'JALIBAT';
