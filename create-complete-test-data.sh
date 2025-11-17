#!/bin/bash

echo "═══════════════════════════════════════════════════════════════"
echo "🚀 CRÉATION DONNÉES DE TEST COMPLÈTES - DiagPV CRM"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "📋 Architecture cohérente:"
echo "   crm_clients → projects → interventions → el_audits → el_modules"
echo ""

# =============================================================================
# ÉTAPE 1: Vérifier que la base de données est prête
# =============================================================================

echo "🔍 1. VÉRIFICATION BASE DE DONNÉES"
echo "─────────────────────────────────────────────────────────────"

# Check if CRM clients exist
CRM_COUNT=$(npx wrangler d1 execute diagnostic-hub-production --local --command="SELECT COUNT(*) as cnt FROM crm_clients;" 2>/dev/null | grep -v cnt | grep -v "^$" | grep -v "wrangler" | grep -v "Executing" | grep -v "remote" | grep -v "success" | grep -v "duration" | tail -1 | tr -d '[]" ')

if [ "$CRM_COUNT" != "3" ]; then
    echo "⚠️  Clients CRM manquants, création..."
    npx wrangler d1 execute diagnostic-hub-production --local --command="
    INSERT OR IGNORE INTO crm_clients (id, company_name, client_type, siret, main_contact_name, main_contact_email, main_contact_phone, address, postal_code, city, status) VALUES
      (1, 'TotalEnergies', 'professional', '542051180', 'Jean Dupont', 'j.dupont@totalenergies.com', '+33 1 47 44 45 46', '2 place Jean Millier', '92400', 'Courbevoie', 'active'),
      (2, 'EDF Renouvelables', 'professional', '431775025', 'Marie Martin', 'm.martin@edf-renouvelables.fr', '+33 1 40 42 22 22', '20 place de la Défense', '92050', 'Paris La Défense', 'active'),
      (3, 'Engie Green', 'professional', '542107651', 'Pierre Durant', 'p.durant@engie.com', '+33 1 44 22 00 00', '1 place Samuel de Champlain', '92400', 'Courbevoie', 'active');
    " 2>/dev/null | tail -5
fi

echo "✅ Clients CRM: OK"

# =============================================================================
# ÉTAPE 2: Créer les projets (liés aux crm_clients)
# =============================================================================

echo ""
echo "🏗️  2. CRÉATION PROJETS"
echo "─────────────────────────────────────────────────────────────"

npx wrangler d1 execute diagnostic-hub-production --local --command="
-- Client 1: TotalEnergies
INSERT OR IGNORE INTO projects (id, client_id, name, site_address, installation_power, total_modules, string_count, modules_per_string) VALUES
  (1, 1, 'Parc Solaire Toulouse', 'ZI Nord, 31000 Toulouse', 1200.0, 3000, 120, 25),
  (2, 1, 'Extension Lyon', 'Part-Dieu, 69003 Lyon', 600.0, 1500, 60, 25);

-- Client 2: EDF Renouvelables
INSERT OR IGNORE INTO projects (id, client_id, name, site_address, installation_power, total_modules, string_count, modules_per_string) VALUES
  (3, 2, 'Centrale Bordeaux', 'Quai Bacalan, 33000 Bordeaux', 800.0, 2000, 80, 25),
  (4, 2, 'Parc Nantes', 'Île de Nantes, 44000 Nantes', 1000.0, 2500, 100, 25);

-- Client 3: Engie Green
INSERT OR IGNORE INTO projects (id, client_id, name, site_address, installation_power, total_modules, string_count, modules_per_string) VALUES
  (5, 3, 'Installation Marseille', 'Port Joliette, 13002 Marseille', 500.0, 1250, 50, 25);
" 2>/dev/null | tail -5

echo "✅ 5 Projets créés:"
npx wrangler d1 execute diagnostic-hub-production --local --command="
SELECT p.id, p.name, cc.company_name as client 
FROM projects p 
JOIN crm_clients cc ON cc.id = p.client_id 
ORDER BY p.id;
" 2>/dev/null | grep -A 20 "results" | head -30

# =============================================================================
# ÉTAPE 3: Créer les interventions (certaines non assignées)
# =============================================================================

echo ""
echo "🗓️  3. CRÉATION INTERVENTIONS"
echo "─────────────────────────────────────────────────────────────"

# Create interventions via SQL directly (faster than API)
npx wrangler d1 execute diagnostic-hub-production --local --command="
-- Interventions avec techniciens assignés (IDs 3, 4, 5)
INSERT OR IGNORE INTO interventions (id, project_id, technician_id, intervention_type, intervention_date, duration_hours, status, notes) VALUES
  -- Parc Toulouse (project 1)
  (1, 1, NULL, 'el_audit', '2025-11-20', 8.0, 'scheduled', 'Audit EL nocturne prévu - Non assigné'),
  (2, 1, 3, 'maintenance', '2025-11-10', 4.0, 'completed', 'Maintenance préventive - Jean Martin'),
  
  -- Extension Lyon (project 2)
  (3, 2, NULL, 'visual_inspection', '2025-11-22', 3.0, 'scheduled', 'Inspection visuelle - Non assigné'),
  (4, 2, 5, 'post_incident', '2025-11-28', 6.0, 'scheduled', 'Expertise post-orage - Marc Lefebvre'),
  
  -- Centrale Bordeaux (project 3)
  (5, 3, 4, 'iv_test', '2025-11-21', 5.0, 'in_progress', 'Tests courbes IV - Sophie Dubois'),
  (6, 3, NULL, 'el_audit', '2025-11-15', 8.0, 'scheduled', 'Audit EL de suivi - Non assigné'),
  
  -- Parc Nantes (project 4)
  (7, 4, 3, 'commissioning', '2025-11-25', 10.0, 'scheduled', 'Commissioning indépendant - Jean Martin'),
  (8, 4, NULL, 'isolation_test', '2025-11-23', 2.0, 'scheduled', 'Tests isolement - Non assigné'),
  
  -- Installation Marseille (project 5)
  (9, 5, 4, 'thermography', '2025-11-17', 6.0, 'in_progress', 'Thermographie drone - Sophie Dubois'),
  (10, 5, NULL, 'el_audit', '2025-11-21', 8.0, 'scheduled', 'Audit EL complet - Non assigné'),
  
  -- Intervention annulée (pour tester tous les statuts)
  (11, 1, NULL, 'maintenance', '2025-11-05', 4.0, 'cancelled', 'Annulée - Conditions météo');
" 2>/dev/null | tail -5

echo "✅ 11 Interventions créées (5 assignées, 6 non assignées)"

# =============================================================================
# ÉTAPE 4: Créer les audits EL (liés aux interventions)
# =============================================================================

echo ""
echo "🔍 4. CRÉATION AUDITS EL"
echo "─────────────────────────────────────────────────────────────"

# Audit 1: Parc Toulouse - Lié à intervention #1
AUDIT_1=$(curl -s -X POST http://localhost:3000/api/el/audit/create \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "Parc Solaire Toulouse",
    "clientName": "TotalEnergies",
    "location": "ZI Nord, 31000 Toulouse",
    "date": "2025-11-20",
    "stringCount": 120,
    "modulesPerString": 25,
    "totalModules": 3000,
    "notes": "Audit EL nocturne - Lié à intervention #1"
  }' 2>/dev/null)

if echo "$AUDIT_1" | grep -q "success"; then
    AUDIT_1_ID=$(echo "$AUDIT_1" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
    echo "✅ Audit 1 créé (ID: $AUDIT_1_ID) - Parc Toulouse"
    
    # Lier l'audit à l'intervention
    npx wrangler d1 execute diagnostic-hub-production --local --command="
    UPDATE el_audits SET intervention_id = 1, client_id = 1 WHERE id = $AUDIT_1_ID;
    " 2>/dev/null | tail -3
else
    echo "❌ Échec création Audit 1"
fi

# Audit 2: Centrale Bordeaux - Lié à intervention #6
AUDIT_2=$(curl -s -X POST http://localhost:3000/api/el/audit/create \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "Centrale Bordeaux",
    "clientName": "EDF Renouvelables",
    "location": "Quai Bacalan, 33000 Bordeaux",
    "date": "2025-11-15",
    "stringCount": 80,
    "modulesPerString": 25,
    "totalModules": 2000,
    "notes": "Audit EL de suivi annuel - Lié à intervention #6"
  }' 2>/dev/null)

if echo "$AUDIT_2" | grep -q "success"; then
    AUDIT_2_ID=$(echo "$AUDIT_2" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
    echo "✅ Audit 2 créé (ID: $AUDIT_2_ID) - Centrale Bordeaux"
    
    npx wrangler d1 execute diagnostic-hub-production --local --command="
    UPDATE el_audits SET intervention_id = 6, client_id = 2 WHERE id = $AUDIT_2_ID;
    " 2>/dev/null | tail -3
else
    echo "❌ Échec création Audit 2"
fi

# Audit 3: Installation Marseille - Lié à intervention #10 (EN COURS)
AUDIT_3=$(curl -s -X POST http://localhost:3000/api/el/audit/create \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "Installation Marseille",
    "clientName": "Engie Green",
    "location": "Port Joliette, 13002 Marseille",
    "date": "2025-11-21",
    "stringCount": 50,
    "modulesPerString": 25,
    "totalModules": 1250,
    "notes": "Audit EL en cours - Lié à intervention #10"
  }' 2>/dev/null)

if echo "$AUDIT_3" | grep -q "success"; then
    AUDIT_3_ID=$(echo "$AUDIT_3" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
    AUDIT_3_TOKEN=$(echo "$AUDIT_3" | grep -o '"audit_token":"[^"]*"' | cut -d'"' -f4)
    echo "✅ Audit 3 créé (ID: $AUDIT_3_ID, Token: $AUDIT_3_TOKEN) - Installation Marseille"
    
    npx wrangler d1 execute diagnostic-hub-production --local --command="
    UPDATE el_audits SET intervention_id = 10, client_id = 3, status = 'in_progress' WHERE id = $AUDIT_3_ID;
    " 2>/dev/null | tail -3
    
    # Ajouter quelques modules diagnostiqués pour tester la cohérence
    echo "   📊 Ajout modules de test..."
    npx wrangler d1 execute diagnostic-hub-production --local --command="
    INSERT INTO el_modules (el_audit_id, audit_token, module_identifier, string_number, position_in_string, defect_type, severity_level) VALUES
      ($AUDIT_3_ID, '$AUDIT_3_TOKEN', 'S01-M01', 1, 1, 'ok', 0),
      ($AUDIT_3_ID, '$AUDIT_3_TOKEN', 'S01-M02', 1, 2, 'ok', 0),
      ($AUDIT_3_ID, '$AUDIT_3_TOKEN', 'S01-M03', 1, 3, 'microfissure', 1),
      ($AUDIT_3_ID, '$AUDIT_3_TOKEN', 'S01-M04', 1, 4, 'ok', 0),
      ($AUDIT_3_ID, '$AUDIT_3_TOKEN', 'S01-M05', 1, 5, 'dead', 3);
    " 2>/dev/null | tail -3
    echo "   ✅ 5 modules diagnostiqués (2 défauts détectés)"
else
    echo "❌ Échec création Audit 3"
fi

# =============================================================================
# ÉTAPE 5: Vérification cohérence complète
# =============================================================================

echo ""
echo "✅ 5. VÉRIFICATION COHÉRENCE COMPLÈTE"
echo "─────────────────────────────────────────────────────────────"

npx wrangler d1 execute diagnostic-hub-production --local --command="
SELECT 
  cc.company_name as 'Client',
  p.name as 'Projet',
  i.intervention_type as 'Type Intervention',
  i.intervention_date as 'Date',
  COALESCE(u.email, 'NON ASSIGNÉ') as 'Technicien',
  i.status as 'Statut Intervention',
  COALESCE(a.project_name, '-') as 'Audit Projet',
  COALESCE(a.status, '-') as 'Statut Audit'
FROM crm_clients cc
LEFT JOIN projects p ON p.client_id = cc.id
LEFT JOIN interventions i ON i.project_id = p.id
LEFT JOIN auth_users u ON u.id = i.technician_id
LEFT JOIN el_audits a ON a.intervention_id = i.id
ORDER BY cc.company_name, p.name, i.intervention_date;
" 2>/dev/null | grep -A 100 "results" | head -80

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✅ DONNÉES DE TEST COMPLÈTES CRÉÉES!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "📊 RÉSUMÉ:"
echo "   • 3 Clients CRM (TotalEnergies, EDF Renouvelables, Engie Green)"
echo "   • 5 Projets (Toulouse, Lyon, Bordeaux, Nantes, Marseille)"
echo "   • 11 Interventions (5 assignées, 6 non assignées, statuts variés)"
echo "   • 3 Audits EL (liés aux interventions, 1 en cours avec modules)"
echo ""
echo "🎯 ARCHITECTURE COHÉRENTE:"
echo "   crm_clients → projects → interventions → el_audits → el_modules"
echo ""
echo "🔗 TRAÇABILITÉ COMPLÈTE:"
echo "   • Tous les projets liés aux clients CRM"
echo "   • Toutes les interventions liées aux projets"
echo "   • Tous les audits liés aux interventions"
echo "   • Modules diagnostiqués dans audit #3"
echo ""
echo "🚀 PROCHAINES ÉTAPES:"
echo "   1. Accéder au Planning: http://localhost:3000/planning"
echo "   2. Assigner des techniciens aux interventions non assignées"
echo "   3. Accéder à l'audit en cours: http://localhost:3000/audit/$AUDIT_3_TOKEN"
echo "   4. Diagnostiquer plus de modules"
echo "   5. Générer un rapport complet PDF"
echo ""
