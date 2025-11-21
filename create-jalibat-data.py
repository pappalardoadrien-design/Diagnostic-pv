#!/usr/bin/env python3
"""
Script pour générer les données JALIBAT
Configuration: 1 string de 26 modules + 9 strings de 24 modules = 242 modules
"""

import sys

# Configuration JALIBAT
AUDIT_TOKEN = "JALIBAT-2025-001"
PROJECT_NAME = "JALIBAT - Centrale Photovoltaïque"
CLIENT_NAME = "Client JALIBAT"

# Configuration strings
STRING_CONFIG = [
    (1, 26),  # String 1: 26 modules
    (2, 24),  # String 2: 24 modules
    (3, 24),  # String 3: 24 modules
    (4, 24),  # String 4: 24 modules
    (5, 24),  # String 5: 24 modules
    (6, 24),  # String 6: 24 modules
    (7, 24),  # String 7: 24 modules
    (8, 24),  # String 8: 24 modules
    (9, 24),  # String 9: 24 modules
    (10, 24), # String 10: 24 modules
]

# Défauts basés sur l'image fournie
# Format: (string_number, position, defect_type, severity)
DEFECTS = [
    (2, 2, 'microfissures', 2),      # String 2, position 2
    (5, 2, 'pid', 3),                 # String 5, position 2
    (7, 1, 'hotspot', 4),             # String 7, position 1
    (7, 3, 'cell_broken', 3),         # String 7, position 3
    (10, 3, 'junction_box', 2),       # String 10, position 3
]

def generate_sql():
    """Génère le SQL complet pour JALIBAT"""
    
    sql_lines = []
    
    # Header
    sql_lines.append("-- ============================================================================")
    sql_lines.append("-- JALIBAT - Données Audit EL")
    sql_lines.append(f"-- Configuration: 1x26 + 9x24 = 242 modules")
    sql_lines.append(f"-- Token: {AUDIT_TOKEN}")
    sql_lines.append("-- ============================================================================\n")
    
    # Delete existing data
    sql_lines.append(f"DELETE FROM el_modules WHERE audit_token = '{AUDIT_TOKEN}';")
    sql_lines.append(f"DELETE FROM el_audits WHERE audit_token = '{AUDIT_TOKEN}';")
    sql_lines.append(f"DELETE FROM audits WHERE audit_token = '{AUDIT_TOKEN}';\n")
    
    # Create audit
    sql_lines.append("-- Audit principal")
    sql_lines.append(f"INSERT INTO audits (audit_token, project_name, client_name, audit_date, modules_enabled, created_at) VALUES")
    sql_lines.append(f"  ('{AUDIT_TOKEN}', '{PROJECT_NAME}', '{CLIENT_NAME}', '2025-01-21', '[\"EL\"]', datetime('now'));\n")
    
    # Create EL audit
    total_modules = sum(count for _, count in STRING_CONFIG)
    string_count = len(STRING_CONFIG)
    modules_per_string = 24  # Mode (most common value)
    
    sql_lines.append("-- Audit EL")
    sql_lines.append(f"INSERT INTO el_audits (audit_token, project_name, client_name, string_count, modules_per_string, total_modules, status, created_at) VALUES")
    sql_lines.append(f"  ('{AUDIT_TOKEN}', '{PROJECT_NAME}', '{CLIENT_NAME}', {string_count}, {modules_per_string}, {total_modules}, 'completed', datetime('now'));\n")
    
    # Get el_audit_id
    sql_lines.append("-- Modules EL")
    
    # Build defects lookup
    defects_map = {(s, p): (dt, sev) for s, p, dt, sev in DEFECTS}
    
    # Generate modules for each string
    insert_values = []
    for string_num, module_count in STRING_CONFIG:
        for pos in range(1, module_count + 1):
            module_id = f"S{string_num}-{pos}"
            
            # Check if this module has a defect
            if (string_num, pos) in defects_map:
                defect_type, severity = defects_map[(string_num, pos)]
            else:
                defect_type, severity = 'none', 0
            
            insert_values.append(
                f"  ((SELECT id FROM el_audits WHERE audit_token = '{AUDIT_TOKEN}'), '{AUDIT_TOKEN}', "
                f"'{module_id}', {string_num}, {pos}, '{defect_type}', {severity})"
            )
    
    # Write INSERT statement
    sql_lines.append("INSERT INTO el_modules (el_audit_id, audit_token, module_identifier, string_number, position_in_string, defect_type, severity_level) VALUES")
    sql_lines.append(",\n".join(insert_values) + ";\n")
    
    # Verification query
    sql_lines.append("-- Vérification")
    sql_lines.append(f"SELECT ")
    sql_lines.append(f"  'JALIBAT créé avec succès!' as message,")
    sql_lines.append(f"  (SELECT COUNT(*) FROM el_modules WHERE audit_token = '{AUDIT_TOKEN}') as total_modules,")
    sql_lines.append(f"  (SELECT COUNT(*) FROM el_modules WHERE audit_token = '{AUDIT_TOKEN}' AND defect_type != 'none') as defects,")
    sql_lines.append(f"  (SELECT COUNT(DISTINCT string_number) FROM el_modules WHERE audit_token = '{AUDIT_TOKEN}') as strings;")
    
    return "\n".join(sql_lines)

if __name__ == "__main__":
    sql = generate_sql()
    
    # Write to file
    output_file = "/home/user/webapp/jalibat-data.sql"
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(sql)
    
    print(f"✅ SQL généré : {output_file}")
    print(f"📊 Total modules : {sum(count for _, count in STRING_CONFIG)}")
    print(f"⚠️  Total défauts : {len(DEFECTS)}")
    print(f"\n🚀 Exécuter avec :")
    print(f"   cd /home/user/webapp && npx wrangler d1 execute diagnostic-hub-production --local --file=jalibat-data.sql")
