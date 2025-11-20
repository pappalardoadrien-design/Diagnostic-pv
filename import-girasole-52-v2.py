#!/usr/bin/env python3
"""
Import 52 centrales GIRASOLE dans la table projects existante
Version 2 - Utilise table projects avec audit_types
Date: 2025-11-20
"""

import openpyxl
from datetime import datetime
import json

# Charger l'Excel ANNEXE 1
wb = openpyxl.load_workbook('ANNEXE 1 - Liste des 86 centrales GIRASOLE.xlsx')
ws = wb.active

# Lire toutes les lignes (skip header)
rows = list(ws.iter_rows(min_row=2, values_only=True))

print(f"📊 ANNEXE 1 : {len(rows)} lignes lues")

# Client ID fixe (nous allons créer le client GIRASOLE directement dans le SQL)
CLIENT_ID_GIRASOLE = 1

# Collecteurs
projects_sql = []
audits_simple = []
audits_double = []

# Traiter chaque ligne
for idx, row in enumerate(rows, start=1):
    # Colonnes Excel (0-indexed)
    # 0: N° ligne
    # 1: Nom centrale
    # 2: Adresse
    # 3-20: Autres infos
    # 21: Audit en toiture (X ou vide)
    # 22: Audit hors toiture (X ou vide)
    
    nom_centrale = str(row[1]).strip() if row[1] else f"Centrale {idx}"
    adresse = str(row[2]).strip() if row[2] else "Adresse inconnue"
    id_referent = str(row[0]).strip() if row[0] else str(idx)
    
    # Vérifier si audit requis
    audit_toiture = str(row[21]).upper().strip() if row[21] else ""
    audit_hors_toiture = str(row[22]).upper().strip() if row[22] else ""
    
    # Skip centrales sans audit
    if audit_toiture != "X" and audit_hors_toiture != "X":
        continue
    
    # Déterminer audit_types
    if audit_toiture == "X" and audit_hors_toiture == "X":
        audit_types_json = '["CONFORMITE", "TOITURE"]'
        audit_list = audits_double
    else:
        audit_types_json = '["CONFORMITE"]'
        audit_list = audits_simple
    
    audit_list.append(nom_centrale)
    
    # Échapper les apostrophes pour SQL
    nom_escaped = nom_centrale.replace("'", "''")
    adresse_escaped = adresse.replace("'", "''")
    id_referent_escaped = id_referent.replace("'", "''")
    
    # SQL INSERT pour project
    projects_sql.append(f"""
INSERT INTO projects (
  client_id, name, site_address, is_girasole, id_referent, audit_types,
  installation_power, created_at, updated_at
) VALUES (
  {CLIENT_ID_GIRASOLE},
  '{nom_escaped}',
  '{adresse_escaped}',
  1,
  '{id_referent_escaped}',
  '{audit_types_json}',
  NULL,
  datetime('now'),
  datetime('now')
);""")

# Générer le fichier SQL complet
output_sql = []

# 1. Créer le client GIRASOLE
output_sql.append("""
-- ============================================================================
-- Import GIRASOLE 52 Centrales (v2)
-- Date: 2025-11-20
-- Utilise table projects existante avec colonnes audit_types, is_girasole
-- ============================================================================

-- 1. Créer client GIRASOLE Energies
INSERT OR IGNORE INTO clients (
  id, name, email, phone, address, notes, created_at
) VALUES (
  1,
  'GIRASOLE Energies',
  'contact@girasole-energies.fr',
  '+33 X XX XX XX XX',
  'Adresse GIRASOLE',
  'Mission Janvier-Mars 2025 - 52 centrales PV - Budget 66.885€ HT',
  datetime('now')
);
""")

# 2. Ajouter tous les projects
output_sql.extend(projects_sql)

# Écrire le fichier SQL
with open('import-girasole-52-v2.sql', 'w', encoding='utf-8') as f:
    f.write('\n'.join(output_sql))

# Statistiques
stats = {
    "date_import": datetime.now().isoformat(),
    "client": "GIRASOLE Energies",
    "total_centrales": len(projects_sql),
    "audits_simple": len(audits_simple),
    "audits_double": len(audits_double),
    "centrales_simple": audits_simple[:10],  # Premiers 10
    "centrales_double": audits_double
}

with open('import-girasole-stats-v2.json', 'w', encoding='utf-8') as f:
    json.dump(stats, f, indent=2, ensure_ascii=False)

print(f"\n✅ GÉNÉRATION TERMINÉE")
print(f"📄 Fichier SQL : import-girasole-52-v2.sql")
print(f"📊 Stats JSON : import-girasole-stats-v2.json")
print(f"\n📈 RÉSUMÉ :")
print(f"  • Total centrales : {len(projects_sql)}")
print(f"  • Audits SOL (CONFORMITE) : {len(audits_simple)}")
print(f"  • Audits DOUBLE (CONFORMITE + TOITURE) : {len(audits_double)}")
print(f"\n🚀 PROCHAINE ÉTAPE :")
print(f"  npx wrangler d1 execute diagnostic-hub-production --local --file=import-girasole-52-v2.sql")
