#!/usr/bin/env python3
"""
Génère le script SQL JALIBAT CORRECT avec structure exacte:
String 1: 26 modules
Strings 2-10: 24 modules chacun
Total: 242 modules
"""

# Configuration basée sur la cartographie réelle
MODULES_PER_STRING = [26, 24, 24, 24, 24, 24, 24, 24, 24, 24]  # Total = 242

# Défauts visibles sur la cartographie (cases roses/rouges)
DEFECTS = {
    1: [(8, 'pid', 2), (15, 'hot_spot', 3), (23, 'microcrack', 2)],
    2: [(3, 'cell_failure', 2), (5, 'microcrack', 2)],
    3: [(13, 'hot_spot', 2), (24, 'pid', 2)],
    4: [(6, 'microcrack', 2), (23, 'cell_failure', 2)],
    5: [(3, 'pid', 3), (20, 'hot_spot', 2)],
    6: [(4, 'cell_failure', 2), (16, 'microcrack', 2)],
    7: [(8, 'hot_spot', 2), (19, 'pid', 2)],
    8: [(3, 'microcrack', 2), (9, 'cell_failure', 2), (14, 'hot_spot', 2), (21, 'pid', 2)],
    9: [(12, 'cell_failure', 2)],
    10: [(8, 'hot_spot', 2), (15, 'microcrack', 2)]
}

sql = """-- JALIBAT CORRECT: String 1 = 26 modules, Strings 2-10 = 24 modules

"""

for string_num in range(1, 11):
    sql += f"-- String {string_num} ({MODULES_PER_STRING[string_num-1]} modules)\n"
    
    defects_for_string = {pos: (defect, sev) for pos, defect, sev in DEFECTS.get(string_num, [])}
    
    for pos in range(1, MODULES_PER_STRING[string_num-1] + 1):
        module_id = f"S{string_num}-P{pos:02d}"
        
        if pos in defects_for_string:
            defect, severity = defects_for_string[pos]
            comment = f"Défaut détecté en EL"
        else:
            defect = 'none'
            severity = 0
            comment = "NULL"
        
        comment_sql = f"'{comment}'" if comment != "NULL" else "NULL"
        
        sql += f"""INSERT INTO el_modules (el_audit_id, audit_token, module_identifier, string_number, position_in_string, defect_type, severity_level, comment, physical_row, physical_col)
VALUES ((SELECT id FROM el_audits WHERE audit_token = 'jalibat-a4e19950-8b5e-4f3a-9c2d-1e6f7a8b9c0d'), 'jalibat-a4e19950-8b5e-4f3a-9c2d-1e6f7a8b9c0d', '{module_id}', {string_num}, {pos}, '{defect}', {severity}, {comment_sql}, {pos}, {string_num});
"""

print(sql)
