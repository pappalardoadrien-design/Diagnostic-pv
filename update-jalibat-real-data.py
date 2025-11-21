#!/usr/bin/env python3
"""
Script pour mettre à jour les modules JALIBAT avec les données réelles de l'audit EL
Basé sur l'image du plan de toiture avec états réels des modules
"""

# Configuration des strings et leurs modules avec états réels
STRING_DATA = {
    1: [  # 26 modules
        ('OK', 1), ('OK', 1), ('OK', 1), ('OK', 1), ('OK', 1), ('OK', 1),
        ('microfissures', 2), ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3),
        ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3),
        ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3),
        ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3),
        ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('OK', 1)
    ],
    2: [  # 24 modules
        ('OK', 1), ('impact_cellulaire', 3), ('microfissures', 2), ('impact_cellulaire', 3),
        ('impact_cellulaire', 3), ('OK', 1), ('impact_cellulaire', 3), ('impact_cellulaire', 3),
        ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3),
        ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3),
        ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3),
        ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('OK', 1), ('impact_cellulaire', 3)
    ],
    3: [  # 24 modules
        ('impact_cellulaire', 3), ('microfissures', 2), ('microfissures', 2), ('microfissures', 2),
        ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3),
        ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3),
        ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3),
        ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3),
        ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3)
    ],
    4: [  # 24 modules
        ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3),
        ('OK', 1), ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3),
        ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3),
        ('OK', 1), ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3),
        ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3),
        ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3)
    ],
    5: [  # 24 modules
        ('impact_cellulaire', 3), ('microfissures', 2), ('microfissures', 2), ('impact_cellulaire', 3),
        ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3),
        ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3),
        ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3),
        ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3),
        ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3)
    ],
    6: [  # 24 modules
        ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3),
        ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3),
        ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3),
        ('OK', 1), ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3),
        ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3),
        ('OK', 1), ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3)
    ],
    7: [  # 24 modules
        ('impact_cellulaire', 3), ('microfissures', 2), ('microfissures', 2), ('impact_cellulaire', 3),
        ('impact_cellulaire', 3), ('OK', 1), ('OK', 1), ('impact_cellulaire', 3),
        ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3),
        ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3),
        ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3),
        ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3)
    ],
    8: [  # 24 modules
        ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3),
        ('impact_cellulaire', 3), ('OK', 1), ('impact_cellulaire', 3), ('impact_cellulaire', 3),
        ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('OK', 1),
        ('impact_cellulaire', 3), ('OK', 1), ('impact_cellulaire', 3), ('impact_cellulaire', 3),
        ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3),
        ('OK', 1), ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3)
    ],
    9: [  # 24 modules
        ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('OK', 1),
        ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3),
        ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3),
        ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3),
        ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3),
        ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3)
    ],
    10: [  # 24 modules
        ('impact_cellulaire', 3), ('OK', 1), ('impact_cellulaire', 3), ('impact_cellulaire', 3),
        ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3),
        ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3),
        ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3),
        ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3),
        ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3), ('impact_cellulaire', 3)
    ]
}

def generate_update_statements():
    """Génère les statements SQL UPDATE pour mettre à jour les modules"""
    updates = []
    
    for string_num, modules in STRING_DATA.items():
        for position, (defect_type, severity) in enumerate(modules, start=1):
            module_id = f"S{string_num}-{position}"
            
            # Si OK, pas de défaut
            if defect_type == 'OK':
                defect_type_sql = 'none'
                severity_sql = 0
            else:
                defect_type_sql = defect_type
                severity_sql = severity
            
            update = f"""UPDATE el_modules 
SET defect_type = '{defect_type_sql}',
    severity_level = {severity_sql},
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = '{module_id}' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');"""
            
            updates.append(update)
    
    return updates

def main():
    """Génère le fichier SQL avec tous les updates"""
    updates = generate_update_statements()
    
    sql_content = """-- Mise à jour des modules JALIBAT avec données réelles de l'audit EL
-- Généré automatiquement depuis l'image du plan de toiture
-- Date: 2025-01-21

BEGIN TRANSACTION;

"""
    
    sql_content += "\n".join(updates)
    
    sql_content += """

COMMIT;

-- Vérification des mises à jour
SELECT 
    'Modules mis à jour' as message,
    COUNT(*) as total,
    SUM(CASE WHEN defect_type != 'none' THEN 1 ELSE 0 END) as modules_avec_defauts,
    SUM(CASE WHEN defect_type = 'impact_cellulaire' THEN 1 ELSE 0 END) as impact_cellulaire,
    SUM(CASE WHEN defect_type = 'microfissures' THEN 1 ELSE 0 END) as microfissures,
    SUM(CASE WHEN defect_type = 'none' THEN 1 ELSE 0 END) as ok
FROM el_modules
WHERE el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
"""
    
    # Écrire le fichier SQL
    output_file = '/home/user/webapp/update-jalibat-real-data.sql'
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(sql_content)
    
    print(f"✅ Fichier SQL généré : {output_file}")
    print(f"📊 Statistiques :")
    
    # Compter les défauts
    total = sum(len(modules) for modules in STRING_DATA.values())
    impact = sum(1 for modules in STRING_DATA.values() for defect, _ in modules if defect == 'impact_cellulaire')
    micro = sum(1 for modules in STRING_DATA.values() for defect, _ in modules if defect == 'microfissures')
    ok = sum(1 for modules in STRING_DATA.values() for defect, _ in modules if defect == 'OK')
    
    print(f"  - Total modules : {total}")
    print(f"  - OK (vert) : {ok}")
    print(f"  - Impact cellulaire (rose) : {impact}")
    print(f"  - Microfissures (orange) : {micro}")
    print(f"  - Modules avec défauts : {impact + micro}")

if __name__ == '__main__':
    main()
