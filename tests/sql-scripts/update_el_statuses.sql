-- Update module_status based on el_defect_type to simulate real EL audit
-- This will test the synchronization between EL and Carto modules

-- String 1 (zone 14) - Add some test defects
UPDATE pv_modules SET 
    module_status = 'microcracks', 
    el_defect_type = 'microcrack',
    el_severity_level = 2,
    el_notes = 'Microfissures détectées - impact modéré',
    el_analysis_date = datetime('now')
WHERE zone_id = 14 AND position_in_string = 5;

UPDATE pv_modules SET 
    module_status = 'dead', 
    el_defect_type = 'cell_failure',
    el_severity_level = 4,
    el_notes = 'Module mort - cellules défaillantes',
    el_analysis_date = datetime('now')
WHERE zone_id = 14 AND position_in_string = 12;

UPDATE pv_modules SET 
    module_status = 'ok', 
    el_defect_type = 'none',
    el_severity_level = 0,
    el_notes = 'Module conforme - aucun défaut',
    el_analysis_date = datetime('now')
WHERE zone_id = 14 AND position_in_string IN (1, 2, 3, 4, 6, 7, 8, 9, 10, 11);

-- String 2 (zone 15) - Update based on existing defect types
UPDATE pv_modules SET 
    module_status = 'dead',
    el_severity_level = 4,
    el_notes = 'Défaillance cellule critique',
    el_analysis_date = datetime('now')
WHERE zone_id = 15 AND el_defect_type = 'cell_failure';

UPDATE pv_modules SET 
    module_status = 'microcracks',
    el_severity_level = 2,
    el_notes = 'Microfissures observées',
    el_analysis_date = datetime('now')
WHERE zone_id = 15 AND el_defect_type = 'microcrack';

UPDATE pv_modules SET 
    module_status = 'ok',
    el_severity_level = 0,
    el_notes = 'Audit EL - Conforme',
    el_analysis_date = datetime('now')
WHERE zone_id = 15 AND el_defect_type = 'none';

-- String 3 (zone 16) - Hot spot and PID
UPDATE pv_modules SET 
    module_status = 'inequality',
    el_severity_level = 3,
    el_notes = 'Point chaud détecté - surveillance requise',
    el_analysis_date = datetime('now')
WHERE zone_id = 16 AND el_defect_type = 'hot_spot';

UPDATE pv_modules SET 
    module_status = 'inequality',
    el_severity_level = 3,
    el_notes = 'PID détecté - dégradation induite',
    el_analysis_date = datetime('now')
WHERE zone_id = 16 AND el_defect_type = 'pid';

UPDATE pv_modules SET 
    module_status = 'ok',
    el_severity_level = 0,
    el_notes = 'Audit EL - Conforme',
    el_analysis_date = datetime('now')
WHERE zone_id = 16 AND el_defect_type = 'none';

-- String 4-10 - Similar updates for other strings
UPDATE pv_modules SET 
    module_status = CASE el_defect_type
        WHEN 'cell_failure' THEN 'dead'
        WHEN 'microcrack' THEN 'microcracks'
        WHEN 'hot_spot' THEN 'inequality'
        WHEN 'pid' THEN 'inequality'
        ELSE 'ok'
    END,
    el_severity_level = CASE el_defect_type
        WHEN 'cell_failure' THEN 4
        WHEN 'microcrack' THEN 2
        WHEN 'hot_spot' THEN 3
        WHEN 'pid' THEN 3
        ELSE 0
    END,
    el_notes = CASE el_defect_type
        WHEN 'cell_failure' THEN 'Défaillance cellule critique'
        WHEN 'microcrack' THEN 'Microfissures détectées'
        WHEN 'hot_spot' THEN 'Point chaud - thermographie'
        WHEN 'pid' THEN 'PID - dégradation induite'
        ELSE 'Audit EL - Conforme'
    END,
    el_analysis_date = datetime('now')
WHERE zone_id BETWEEN 17 AND 23;
