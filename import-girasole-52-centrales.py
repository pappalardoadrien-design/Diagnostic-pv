#!/usr/bin/env python3
"""
Import 52 centrales GIRASOLE depuis ANNEXE 1 Excel
- 39 centrales SOL (CONFORMITE uniquement)
- 13 centrales DOUBLE (CONFORMITE + TOITURE)
"""

import openpyxl
import json
import sys
from datetime import datetime

# Ouvrir Excel
print("📂 Ouverture ANNEXE 1...")
wb = openpyxl.load_workbook("/home/user/uploaded_files/ANNEXE 1 - Liste des installations a auditer_v4.xlsx", data_only=True)
ws = wb.active

# Préparer données
client_data = {
    "company_name": "GIRASOLE Energies",
    "siret": "",
    "main_contact_email": "contact@girasole-energies.fr",
    "main_contact_phone": "06 74 94 09 90",
    "address": "France",
    "city": "National",
    "postal_code": "",
    "country": "France",
    "notes": "Client GIRASOLE - Mission 52 audits conformité PV (39 SOL + 13 DOUBLE TOITURE) - Budget 66.885€ HT - Période Janvier-Mars 2025"
}

projects = []
audits_simple = []  # 39 SOL
audits_double = []  # 13 DOUBLE

print("\n🔍 Analyse Excel...")

# Parcourir lignes (skip headers lignes 1-2)
for i, row in enumerate(ws.iter_rows(min_row=3, values_only=True), start=3):
    if not row[0]:  # ID vide = fin données
        break
    
    # Colonnes audit
    audit_toiture = str(row[21]).upper() if row[21] else ""
    audit_hors_toiture = str(row[22]).upper() if row[22] else ""
    
    # Filtrer uniquement centrales avec audit DiagPV
    if audit_toiture != "X" and audit_hors_toiture != "X":
        continue
    
    # Déterminer type audit
    if audit_toiture == "X" and audit_hors_toiture == "X":
        audit_types = '["CONFORMITE", "TOITURE"]'
        audit_list = audits_double
    else:
        audit_types = '["CONFORMITE"]'
        audit_list = audits_simple
    
    # Extraire données
    project = {
        "id_referent": str(row[0]),
        "name": str(row[1]) if row[1] else f"Centrale {row[0]}",
        "installation_power": float(row[2]) if row[2] else 0,
        "site_address": str(row[6]) if row[6] else "",
        "postal_code": str(row[7]) if row[7] else "",
        "latitude": float(row[4]) if row[4] else None,
        "longitude": float(row[5]) if row[5] else None,
        "type_centrale": str(row[8]) if row[8] else "",
        "installateur": str(row[9]) if row[9] else "",
        "audit_types": audit_types,
        "notes": f"Type: {row[8] if row[8] else 'N/A'} | Installateur: {row[9] if row[9] else 'N/A'}"
    }
    
    projects.append(project)
    audit_list.append(project)

print(f"\n✅ Données extraites:")
print(f"   Total centrales avec audit: {len(projects)}")
print(f"   - SOL (CONFORMITE): {len(audits_simple)}")
print(f"   - DOUBLE (CONFORMITE + TOITURE): {len(audits_double)}")

# Générer SQL
sql_output = []

# 1. Client GIRASOLE
sql_output.append("-- ============================================")
sql_output.append("-- 1. CRÉATION CLIENT GIRASOLE")
sql_output.append("-- ============================================")
sql_output.append(f"""
INSERT INTO crm_clients (
  company_name, siret, main_contact_email, main_contact_phone,
  address, city, postal_code, country, notes, created_at, updated_at
) VALUES (
  '{client_data["company_name"]}',
  '{client_data["siret"]}',
  '{client_data["main_contact_email"]}',
  '{client_data["main_contact_phone"]}',
  '{client_data["address"]}',
  '{client_data["city"]}',
  '{client_data["postal_code"]}',
  '{client_data["country"]}',
  '{client_data["notes"]}',
  datetime('now'),
  datetime('now')
);
""")

# 2. Projects (52 centrales)
sql_output.append("\n-- ============================================")
sql_output.append("-- 2. CRÉATION 52 PROJECTS (CENTRALES)")
sql_output.append("-- ============================================")

for p in projects:
    notes_escaped = p['notes'].replace("'", "''")
    name_escaped = p['name'].replace("'", "''")
    address_escaped = p['site_address'].replace("'", "''")
    
    sql_output.append(f"""
-- Centrale: {p['name']} ({p['installation_power']} kWc)
INSERT INTO projects (
  client_id, name, site_address, installation_power,
  latitude, longitude, notes, audit_types, created_at, updated_at
) VALUES (
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  '{name_escaped}',
  '{address_escaped}',
  {p['installation_power']},
  {p['latitude'] if p['latitude'] else 'NULL'},
  {p['longitude'] if p['longitude'] else 'NULL'},
  '{notes_escaped}',
  '{p["audit_types"]}',
  datetime('now'),
  datetime('now')
);
""")

# 3. Audits (52 audits)
sql_output.append("\n-- ============================================")
sql_output.append("-- 3. CRÉATION 52 AUDITS")
sql_output.append("-- ============================================")

for p in projects:
    name_escaped = p['name'].replace("'", "''")
    audit_token = f"GIRASOLE-{p['id_referent']}-{datetime.now().strftime('%Y%m%d')}"
    
    sql_output.append(f"""
-- Audit: {p['name']}
INSERT INTO audits (
  audit_token, client_id, project_id, project_name, client_name,
  location, modules_enabled, status, created_at, updated_at
) VALUES (
  '{audit_token}',
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  (SELECT id FROM projects WHERE name = '{name_escaped}' AND client_id = (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies')),
  '{name_escaped}',
  'GIRASOLE Energies',
  '{p["site_address"].replace("'", "''")}',
  '["VISUAL"]',
  'pending',
  datetime('now'),
  datetime('now')
);
""")

# Sauvegarder SQL
sql_file = "/home/user/webapp/import-girasole-52-centrales.sql"
with open(sql_file, 'w', encoding='utf-8') as f:
    f.write('\n'.join(sql_output))

print(f"\n✅ Fichier SQL généré: {sql_file}")
print(f"\n📋 RÉSUMÉ:")
print(f"   1 Client : GIRASOLE Energies")
print(f"   52 Projects : Centrales PV")
print(f"   52 Audits : Tokens uniques générés")
print(f"\n🎯 TYPES AUDITS:")
print(f"   {len(audits_simple)} audits CONFORMITE (SOL)")
print(f"   {len(audits_double)} audits CONFORMITE + TOITURE (DOUBLE)")

# Générer JSON statistiques
stats = {
    "date_import": datetime.now().isoformat(),
    "client": client_data["company_name"],
    "total_centrales": len(projects),
    "audits_simple": len(audits_simple),
    "audits_double": len(audits_double),
    "centrales_simple": [p['name'] for p in audits_simple],
    "centrales_double": [p['name'] for p in audits_double]
}

stats_file = "/home/user/webapp/import-girasole-stats.json"
with open(stats_file, 'w', encoding='utf-8') as f:
    json.dump(stats, f, indent=2, ensure_ascii=False)

print(f"✅ Statistiques JSON: {stats_file}")

wb.close()
print("\n✨ Import preparation completed!")
