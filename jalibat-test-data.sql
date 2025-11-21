-- Créer audit JALIBAT
INSERT OR REPLACE INTO audits (
  id, audit_token, project_name, client_name, 
  audit_date, modules_enabled, created_at
) VALUES (
  1000, 'JALIBAT-TEST-001', 'JALIBAT - Centrale Photovoltaïque', 'Client JALIBAT',
  '2025-01-21', '["EL"]', datetime('now')
);

-- Créer audit EL JALIBAT
INSERT OR REPLACE INTO el_audits (
  id, audit_token, project_name, client_name, status, created_at
) VALUES (
  1000, 'JALIBAT-TEST-001', 'JALIBAT - Centrale Photovoltaïque', 'Client JALIBAT',
  'completed', datetime('now')
);

-- STRING 1: 26 modules (positions 1-26)
INSERT OR REPLACE INTO el_modules (el_audit_id, audit_token, module_identifier, string_number, position_in_string, defect_type, severity_level) 
SELECT 1000, 'JALIBAT-TEST-001', 'S1-' || pos, 1, pos, 'none', 0
FROM (
  WITH RECURSIVE positions(pos) AS (
    SELECT 1
    UNION ALL
    SELECT pos + 1 FROM positions WHERE pos < 26
  )
  SELECT pos FROM positions
);

-- STRING 2: 24 modules (positions 1-24)
INSERT OR REPLACE INTO el_modules (el_audit_id, audit_token, module_identifier, string_number, position_in_string, defect_type, severity_level) 
SELECT 1000, 'JALIBAT-TEST-001', 'S2-' || pos, 2, pos, 'none', 0
FROM (
  WITH RECURSIVE positions(pos) AS (
    SELECT 1
    UNION ALL
    SELECT pos + 1 FROM positions WHERE pos < 24
  )
  SELECT pos FROM positions
);

-- STRING 3: 24 modules
INSERT OR REPLACE INTO el_modules (el_audit_id, audit_token, module_identifier, string_number, position_in_string, defect_type, severity_level) 
SELECT 1000, 'JALIBAT-TEST-001', 'S3-' || pos, 3, pos, 'none', 0
FROM (
  WITH RECURSIVE positions(pos) AS (
    SELECT 1
    UNION ALL
    SELECT pos + 1 FROM positions WHERE pos < 24
  )
  SELECT pos FROM positions
);

-- STRING 4: 24 modules
INSERT OR REPLACE INTO el_modules (el_audit_id, audit_token, module_identifier, string_number, position_in_string, defect_type, severity_level) 
SELECT 1000, 'JALIBAT-TEST-001', 'S4-' || pos, 4, pos, 'none', 0
FROM (
  WITH RECURSIVE positions(pos) AS (
    SELECT 1
    UNION ALL
    SELECT pos + 1 FROM positions WHERE pos < 24
  )
  SELECT pos FROM positions
);

-- STRING 5: 24 modules
INSERT OR REPLACE INTO el_modules (el_audit_id, audit_token, module_identifier, string_number, position_in_string, defect_type, severity_level) 
SELECT 1000, 'JALIBAT-TEST-001', 'S5-' || pos, 5, pos, 'none', 0
FROM (
  WITH RECURSIVE positions(pos) AS (
    SELECT 1
    UNION ALL
    SELECT pos + 1 FROM positions WHERE pos < 24
  )
  SELECT pos FROM positions
);

-- STRING 6: 24 modules
INSERT OR REPLACE INTO el_modules (el_audit_id, audit_token, module_identifier, string_number, position_in_string, defect_type, severity_level) 
SELECT 1000, 'JALIBAT-TEST-001', 'S6-' || pos, 6, pos, 'none', 0
FROM (
  WITH RECURSIVE positions(pos) AS (
    SELECT 1
    UNION ALL
    SELECT pos + 1 FROM positions WHERE pos < 24
  )
  SELECT pos FROM positions
);

-- STRING 7: 24 modules
INSERT OR REPLACE INTO el_modules (el_audit_id, audit_token, module_identifier, string_number, position_in_string, defect_type, severity_level) 
SELECT 1000, 'JALIBAT-TEST-001', 'S7-' || pos, 7, pos, 'none', 0
FROM (
  WITH RECURSIVE positions(pos) AS (
    SELECT 1
    UNION ALL
    SELECT pos + 1 FROM positions WHERE pos < 24
  )
  SELECT pos FROM positions
);

-- STRING 8: 24 modules
INSERT OR REPLACE INTO el_modules (el_audit_id, audit_token, module_identifier, string_number, position_in_string, defect_type, severity_level) 
SELECT 1000, 'JALIBAT-TEST-001', 'S8-' || pos, 8, pos, 'none', 0
FROM (
  WITH RECURSIVE positions(pos) AS (
    SELECT 1
    UNION ALL
    SELECT pos + 1 FROM positions WHERE pos < 24
  )
  SELECT pos FROM positions
);

-- STRING 9: 24 modules
INSERT OR REPLACE INTO el_modules (el_audit_id, audit_token, module_identifier, string_number, position_in_string, defect_type, severity_level) 
SELECT 1000, 'JALIBAT-TEST-001', 'S9-' || pos, 9, pos, 'none', 0
FROM (
  WITH RECURSIVE positions(pos) AS (
    SELECT 1
    UNION ALL
    SELECT pos + 1 FROM positions WHERE pos < 24
  )
  SELECT pos FROM positions
);

-- STRING 10: 24 modules
INSERT OR REPLACE INTO el_modules (el_audit_id, audit_token, module_identifier, string_number, position_in_string, defect_type, severity_level) 
SELECT 1000, 'JALIBAT-TEST-001', 'S10-' || pos, 10, pos, 'none', 0
FROM (
  WITH RECURSIVE positions(pos) AS (
    SELECT 1
    UNION ALL
    SELECT pos + 1 FROM positions WHERE pos < 24
  )
  SELECT pos FROM positions
);

-- Ajouter quelques défauts basés sur l'image fournie
-- String 2, module 2
UPDATE el_modules SET defect_type = 'microfissures', severity_level = 2 
WHERE audit_token = 'JALIBAT-TEST-001' AND module_identifier = 'S2-2';

-- String 5, module 2
UPDATE el_modules SET defect_type = 'pid', severity_level = 3 
WHERE audit_token = 'JALIBAT-TEST-001' AND module_identifier = 'S5-2';

-- String 7, module 1
UPDATE el_modules SET defect_type = 'hotspot', severity_level = 4 
WHERE audit_token = 'JALIBAT-TEST-001' AND module_identifier = 'S7-1';

-- String 7, module 3
UPDATE el_modules SET defect_type = 'cell_broken', severity_level = 3 
WHERE audit_token = 'JALIBAT-TEST-001' AND module_identifier = 'S7-3';

-- String 10, module 3
UPDATE el_modules SET defect_type = 'junction_box', severity_level = 2 
WHERE audit_token = 'JALIBAT-TEST-001' AND module_identifier = 'S10-3';

SELECT 
  'JALIBAT data created!' as message,
  (SELECT COUNT(*) FROM el_modules WHERE audit_token = 'JALIBAT-TEST-001') as total_modules,
  (SELECT COUNT(*) FROM el_modules WHERE audit_token = 'JALIBAT-TEST-001' AND defect_type != 'none') as defects;
