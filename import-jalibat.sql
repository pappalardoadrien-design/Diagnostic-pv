-- ============================================================================
-- IMPORT AUDIT JALIBAT - 242 modules (10 strings)
-- ============================================================================

-- 1. Créer l'audit EL JALIBAT
INSERT INTO el_audits (
  audit_token,
  project_name,
  client_name,
  location,
  string_count,
  modules_per_string,
  total_modules,
  status,
  configuration_json
) VALUES (
  'jalibat-a4e19950-8b5e-4f3a-9c2d-1e6f7a8b9c0d',
  'JALIBAT',
  'JALIBAT',
  'Site JALIBAT',
  10,
  24,
  242,
  'in_progress',
  '{"mode":"real_audit","stringCount":10,"modulesPerString":24,"totalModules":242}'
);

-- 2. Créer les 242 modules EL
-- String 1 (25 modules)
INSERT INTO el_modules (el_audit_id, audit_token, module_identifier, string_number, position_in_string, defect_type, severity_level, comment, physical_row, physical_col)
SELECT 
  (SELECT id FROM el_audits WHERE audit_token = 'jalibat-a4e19950-8b5e-4f3a-9c2d-1e6f7a8b9c0d'),
  'jalibat-a4e19950-8b5e-4f3a-9c2d-1e6f7a8b9c0d',
  'S1-P' || printf('%02d', value),
  1,
  value,
  CASE 
    WHEN value = 3 THEN 'microcrack'
    WHEN value = 8 THEN 'pid'
    WHEN value = 15 THEN 'hot_spot'
    WHEN value = 22 THEN 'diode_failure'
    ELSE 'none'
  END,
  CASE 
    WHEN value IN (3, 8) THEN 2
    WHEN value IN (15, 22) THEN 3
    ELSE 0
  END,
  CASE 
    WHEN value = 3 THEN 'Microfissure détectée'
    WHEN value = 8 THEN 'PID détecté - Baisse luminescence'
    WHEN value = 15 THEN 'Point chaud - Température élevée'
    WHEN value = 22 THEN 'Diode by-pass HS'
    ELSE NULL
  END,
  value,
  1
FROM generate_series(1, 25) AS value;

-- String 2 (25 modules)
INSERT INTO el_modules (el_audit_id, audit_token, module_identifier, string_number, position_in_string, defect_type, severity_level, comment, physical_row, physical_col)
SELECT 
  (SELECT id FROM el_audits WHERE audit_token = 'jalibat-a4e19950-8b5e-4f3a-9c2d-1e6f7a8b9c0d'),
  'jalibat-a4e19950-8b5e-4f3a-9c2d-1e6f7a8b9c0d',
  'S2-P' || printf('%02d', value),
  2,
  value,
  CASE 
    WHEN value = 5 THEN 'cell_failure'
    WHEN value = 12 THEN 'microcrack'
    WHEN value = 18 THEN 'shading'
    ELSE 'none'
  END,
  CASE 
    WHEN value IN (5, 12) THEN 2
    WHEN value = 18 THEN 1
    ELSE 0
  END,
  CASE 
    WHEN value = 5 THEN 'Cellule morte'
    WHEN value = 12 THEN 'Microfissure'
    WHEN value = 18 THEN 'Ombrage détecté'
    ELSE NULL
  END,
  value,
  2
FROM generate_series(1, 25) AS value;

-- String 3 (25 modules)
INSERT INTO el_modules (el_audit_id, audit_token, module_identifier, string_number, position_in_string, defect_type, severity_level, comment, physical_row, physical_col)
SELECT 
  (SELECT id FROM el_audits WHERE audit_token = 'jalibat-a4e19950-8b5e-4f3a-9c2d-1e6f7a8b9c0d'),
  'jalibat-a4e19950-8b5e-4f3a-9c2d-1e6f7a8b9c0d',
  'S3-P' || printf('%02d', value),
  3,
  value,
  CASE 
    WHEN value = 7 THEN 'pid'
    WHEN value = 14 THEN 'hot_spot'
    WHEN value = 20 THEN 'string_mismatch'
    ELSE 'none'
  END,
  CASE 
    WHEN value IN (7, 14, 20) THEN 2
    ELSE 0
  END,
  CASE 
    WHEN value = 7 THEN 'PID progressif'
    WHEN value = 14 THEN 'Point chaud boîte jonction'
    WHEN value = 20 THEN 'Mismatch détecté'
    ELSE NULL
  END,
  value,
  3
FROM generate_series(1, 25) AS value;

-- String 4 (24 modules)
INSERT INTO el_modules (el_audit_id, audit_token, module_identifier, string_number, position_in_string, defect_type, severity_level, comment, physical_row, physical_col)
SELECT 
  (SELECT id FROM el_audits WHERE audit_token = 'jalibat-a4e19950-8b5e-4f3a-9c2d-1e6f7a8b9c0d'),
  'jalibat-a4e19950-8b5e-4f3a-9c2d-1e6f7a8b9c0d',
  'S4-P' || printf('%02d', value),
  4,
  value,
  CASE 
    WHEN value = 10 THEN 'microcrack'
    WHEN value = 19 THEN 'cell_failure'
    ELSE 'none'
  END,
  CASE 
    WHEN value IN (10, 19) THEN 2
    ELSE 0
  END,
  CASE 
    WHEN value = 10 THEN 'Microfissures multiples'
    WHEN value = 19 THEN 'Cellule inactive'
    ELSE NULL
  END,
  value,
  4
FROM generate_series(1, 24) AS value;

-- String 5 (24 modules)
INSERT INTO el_modules (el_audit_id, audit_token, module_identifier, string_number, position_in_string, defect_type, severity_level, comment, physical_row, physical_col)
SELECT 
  (SELECT id FROM el_audits WHERE audit_token = 'jalibat-a4e19950-8b5e-4f3a-9c2d-1e6f7a8b9c0d'),
  'jalibat-a4e19950-8b5e-4f3a-9c2d-1e6f7a8b9c0d',
  'S5-P' || printf('%02d', value),
  5,
  value,
  CASE 
    WHEN value = 4 THEN 'hot_spot'
    WHEN value = 13 THEN 'pid'
    WHEN value = 21 THEN 'diode_failure'
    ELSE 'none'
  END,
  CASE 
    WHEN value IN (4, 13, 21) THEN 3
    ELSE 0
  END,
  CASE 
    WHEN value = 4 THEN 'Point chaud sévère'
    WHEN value = 13 THEN 'PID avancé'
    WHEN value = 21 THEN 'Diode court-circuit'
    ELSE NULL
  END,
  value,
  5
FROM generate_series(1, 24) AS value;

-- String 6 (24 modules)
INSERT INTO el_modules (el_audit_id, audit_token, module_identifier, string_number, position_in_string, defect_type, severity_level, comment, physical_row, physical_col)
SELECT 
  (SELECT id FROM el_audits WHERE audit_token = 'jalibat-a4e19950-8b5e-4f3a-9c2d-1e6f7a8b9c0d'),
  'jalibat-a4e19950-8b5e-4f3a-9c2d-1e6f7a8b9c0d',
  'S6-P' || printf('%02d', value),
  6,
  value,
  CASE 
    WHEN value = 6 THEN 'microcrack'
    WHEN value = 16 THEN 'hot_spot'
    ELSE 'none'
  END,
  CASE 
    WHEN value IN (6, 16) THEN 2
    ELSE 0
  END,
  CASE 
    WHEN value = 6 THEN 'Microfissure angle'
    WHEN value = 16 THEN 'Échauffement local'
    ELSE NULL
  END,
  value,
  6
FROM generate_series(1, 24) AS value;

-- String 7 (24 modules)
INSERT INTO el_modules (el_audit_id, audit_token, module_identifier, string_number, position_in_string, defect_type, severity_level, comment, physical_row, physical_col)
SELECT 
  (SELECT id FROM el_audits WHERE audit_token = 'jalibat-a4e19950-8b5e-4f3a-9c2d-1e6f7a8b9c0d'),
  'jalibat-a4e19950-8b5e-4f3a-9c2d-1e6f7a8b9c0d',
  'S7-P' || printf('%02d', value),
  7,
  value,
  CASE 
    WHEN value = 9 THEN 'cell_failure'
    WHEN value = 17 THEN 'pid'
    ELSE 'none'
  END,
  CASE 
    WHEN value IN (9, 17) THEN 2
    ELSE 0
  END,
  CASE 
    WHEN value = 9 THEN 'Cellule défaillante'
    WHEN value = 17 THEN 'Début PID'
    ELSE NULL
  END,
  value,
  7
FROM generate_series(1, 24) AS value;

-- String 8 (24 modules)
INSERT INTO el_modules (el_audit_id, audit_token, module_identifier, string_number, position_in_string, defect_type, severity_level, comment, physical_row, physical_col)
SELECT 
  (SELECT id FROM el_audits WHERE audit_token = 'jalibat-a4e19950-8b5e-4f3a-9c2d-1e6f7a8b9c0d'),
  'jalibat-a4e19950-8b5e-4f3a-9c2d-1e6f7a8b9c0d',
  'S8-P' || printf('%02d', value),
  8,
  value,
  CASE 
    WHEN value = 11 THEN 'hot_spot'
    WHEN value = 23 THEN 'microcrack'
    ELSE 'none'
  END,
  CASE 
    WHEN value IN (11, 23) THEN 2
    ELSE 0
  END,
  CASE 
    WHEN value = 11 THEN 'Point chaud connecteur'
    WHEN value = 23 THEN 'Microfissure bus-bar'
    ELSE NULL
  END,
  value,
  8
FROM generate_series(1, 24) AS value;

-- String 9 (24 modules)
INSERT INTO el_modules (el_audit_id, audit_token, module_identifier, string_number, position_in_string, defect_type, severity_level, comment, physical_row, physical_col)
SELECT 
  (SELECT id FROM el_audits WHERE audit_token = 'jalibat-a4e19950-8b5e-4f3a-9c2d-1e6f7a8b9c0d'),
  'jalibat-a4e19950-8b5e-4f3a-9c2d-1e6f7a8b9c0d',
  'S9-P' || printf('%02d', value),
  9,
  value,
  CASE 
    WHEN value = 2 THEN 'diode_failure'
    WHEN value = 14 THEN 'pid'
    WHEN value = 20 THEN 'cell_failure'
    ELSE 'none'
  END,
  CASE 
    WHEN value IN (2, 14, 20) THEN 3
    ELSE 0
  END,
  CASE 
    WHEN value = 2 THEN 'Diode HS - Remplacement requis'
    WHEN value = 14 THEN 'PID sévère'
    WHEN value = 20 THEN 'Cellule morte zone active'
    ELSE NULL
  END,
  value,
  9
FROM generate_series(1, 24) AS value;

-- String 10 (24 modules)
INSERT INTO el_modules (el_audit_id, audit_token, module_identifier, string_number, position_in_string, defect_type, severity_level, comment, physical_row, physical_col)
SELECT 
  (SELECT id FROM el_audits WHERE audit_token = 'jalibat-a4e19950-8b5e-4f3a-9c2d-1e6f7a8b9c0d'),
  'jalibat-a4e19950-8b5e-4f3a-9c2d-1e6f7a8b9c0d',
  'S10-P' || printf('%02d', value),
  10,
  value,
  CASE 
    WHEN value = 8 THEN 'hot_spot'
    WHEN value = 15 THEN 'microcrack'
    ELSE 'none'
  END,
  CASE 
    WHEN value IN (8, 15) THEN 2
    ELSE 0
  END,
  CASE 
    WHEN value = 8 THEN 'Échauffement anormal'
    WHEN value = 15 THEN 'Fissure centrale'
    ELSE NULL
  END,
  value,
  10
FROM generate_series(1, 24) AS value;

-- 3. Créer centrale PV JALIBAT
INSERT INTO pv_plants (
  plant_name,
  plant_type,
  address,
  city,
  postal_code,
  country,
  latitude,
  longitude,
  total_power_kwp,
  module_count,
  notes
) VALUES (
  'JALIBAT',
  'rooftop',
  'Site JALIBAT',
  'À définir',
  NULL,
  'France',
  43.6567,
  1.4767,
  109.08,
  242,
  'Centrale issue audit EL JALIBAT - 242 modules (10 strings)'
);

-- 4. Lier audit JALIBAT à centrale PV
INSERT INTO el_audit_plants (
  el_audit_id,
  audit_token,
  plant_id
) VALUES (
  (SELECT id FROM el_audits WHERE audit_token = 'jalibat-a4e19950-8b5e-4f3a-9c2d-1e6f7a8b9c0d'),
  'jalibat-a4e19950-8b5e-4f3a-9c2d-1e6f7a8b9c0d',
  (SELECT id FROM pv_plants WHERE plant_name = 'JALIBAT')
);
