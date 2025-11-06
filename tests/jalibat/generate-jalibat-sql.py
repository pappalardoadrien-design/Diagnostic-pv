#!/usr/bin/env python3
"""
Génère le script SQL d'import JALIBAT avec 242 modules
"""

# Configuration défauts réalistes JALIBAT
DEFECTS = {
    1: [(3, 'microcrack', 2, 'Microfissure détectée'), (8, 'pid', 2, 'PID détecté'), (15, 'hot_spot', 3, 'Point chaud'), (22, 'diode_failure', 3, 'Diode HS')],
    2: [(5, 'cell_failure', 2, 'Cellule morte'), (12, 'microcrack', 2, 'Microfissure'), (18, 'shading', 1, 'Ombrage')],
    3: [(7, 'pid', 2, 'PID progressif'), (14, 'hot_spot', 2, 'Point chaud boîte'), (20, 'string_mismatch', 2, 'Mismatch')],
    4: [(10, 'microcrack', 2, 'Microfissures multiples'), (19, 'cell_failure', 2, 'Cellule inactive')],
    5: [(4, 'hot_spot', 3, 'Point chaud sévère'), (13, 'pid', 3, 'PID avancé'), (21, 'diode_failure', 3, 'Diode court-circuit')],
    6: [(6, 'microcrack', 2, 'Microfissure angle'), (16, 'hot_spot', 2, 'Échauffement local')],
    7: [(9, 'cell_failure', 2, 'Cellule défaillante'), (17, 'pid', 2, 'Début PID')],
    8: [(11, 'hot_spot', 2, 'Point chaud connecteur'), (23, 'microcrack', 2, 'Microfissure bus-bar')],
    9: [(2, 'diode_failure', 3, 'Diode HS - Remplacement'), (14, 'pid', 3, 'PID sévère'), (20, 'cell_failure', 3, 'Cellule morte')],
    10: [(8, 'hot_spot', 2, 'Échauffement anormal'), (15, 'microcrack', 2, 'Fissure centrale')]
}

MODULES_PER_STRING = [25, 25, 25, 24, 24, 24, 24, 24, 24, 24]  # Total = 242

sql = """-- ============================================================================
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
"""

for string_num in range(1, 11):
    sql += f"\n-- String {string_num} ({MODULES_PER_STRING[string_num-1]} modules)\n"
    
    defects_for_string = {pos: (defect, sev, comment) for pos, defect, sev, comment in DEFECTS.get(string_num, [])}
    
    for pos in range(1, MODULES_PER_STRING[string_num-1] + 1):
        module_id = f"S{string_num}-P{pos:02d}"
        
        if pos in defects_for_string:
            defect, severity, comment = defects_for_string[pos]
            comment_sql = f"'{comment}'" if comment else "NULL"
        else:
            defect = 'none'
            severity = 0
            comment_sql = "NULL"
        
        sql += f"""INSERT INTO el_modules (el_audit_id, audit_token, module_identifier, string_number, position_in_string, defect_type, severity_level, comment, physical_row, physical_col)
VALUES ((SELECT id FROM el_audits WHERE audit_token = 'jalibat-a4e19950-8b5e-4f3a-9c2d-1e6f7a8b9c0d'), 'jalibat-a4e19950-8b5e-4f3a-9c2d-1e6f7a8b9c0d', '{module_id}', {string_num}, {pos}, '{defect}', {severity}, {comment_sql}, {pos}, {string_num});
"""

sql += """
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
  (SELECT id FROM pv_plants WHERE plant_name = 'JALIBAT' ORDER BY id DESC LIMIT 1)
);
"""

print(sql)
