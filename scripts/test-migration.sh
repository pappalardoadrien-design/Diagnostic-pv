#!/bin/bash
# Script de test complet de la migration de données
# Point 3.2 - Test Migration Locale + Vérifications

set -e

DB_NAME="diagnostic-hub-production"
DB_FLAG="--local"

echo "🧪 ==== TESTS MIGRATION DONNÉES DIAGPV ===="
echo "📅 $(date)"
echo ""

# Test 1: Comptages globaux
echo "📊 TEST 1 - COMPTAGES GLOBAUX"
echo "----------------------------"
wrangler d1 execute $DB_NAME $DB_FLAG --command="
SELECT 
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM clients) as total_clients,
  (SELECT COUNT(*) FROM projects) as total_projects,
  (SELECT COUNT(*) FROM interventions) as total_interventions,
  (SELECT COUNT(*) FROM el_audits) as total_el_audits,
  (SELECT COUNT(*) FROM el_modules) as total_el_modules
;"
echo ""

# Test 2: Intégrité Foreign Keys
echo "🔗 TEST 2 - INTÉGRITÉ FOREIGN KEYS"
echo "---------------------------------"
wrangler d1 execute $DB_NAME $DB_FLAG --command="
-- Vérifier que tous les el_audits ont une intervention valide
SELECT 
  COUNT(*) as audits_with_valid_intervention
FROM el_audits ea
JOIN interventions i ON ea.intervention_id = i.id;

-- Vérifier que tous les el_modules ont un audit valide
SELECT 
  COUNT(*) as modules_with_valid_audit
FROM el_modules em
JOIN el_audits ea ON em.el_audit_id = ea.id;
"
echo ""

# Test 3: Distribution des statuts transformés
echo "📈 TEST 3 - DISTRIBUTION DEFECT_TYPE + SEVERITY"
echo "-----------------------------------------------"
wrangler d1 execute $DB_NAME $DB_FLAG --command="
SELECT 
  defect_type,
  severity_level,
  COUNT(*) as count
FROM el_modules
GROUP BY defect_type, severity_level
ORDER BY severity_level DESC, count DESC;
"
echo ""

# Test 4: Statistiques JALIBAT (audit #1)
echo "🏭 TEST 4 - STATISTIQUES JALIBAT (242 modules)"
echo "----------------------------------------------"
wrangler d1 execute $DB_NAME $DB_FLAG --command="
SELECT * FROM v_el_audit_statistics 
WHERE project_name LIKE '%JALIBAT%';
"
echo ""

# Test 5: Statistiques Les Forges (audit #2)
echo "🏭 TEST 5 - STATISTIQUES LES FORGES (220 modules)"
echo "-------------------------------------------------"
wrangler d1 execute $DB_NAME $DB_FLAG --command="
SELECT * FROM v_el_audit_statistics 
WHERE project_name LIKE '%Forges%';
"
echo ""

# Test 6: Tokens audit préservés
echo "🔑 TEST 6 - TOKENS AUDIT PRÉSERVÉS"
echo "----------------------------------"
wrangler d1 execute $DB_NAME $DB_FLAG --command="
SELECT 
  id,
  audit_token,
  project_name,
  total_modules
FROM el_audits
ORDER BY id;
"
echo ""

# Test 7: Vue Dashboard Overview
echo "📊 TEST 7 - VUE DASHBOARD OVERVIEW"
echo "----------------------------------"
wrangler d1 execute $DB_NAME $DB_FLAG --command="
SELECT * FROM v_dashboard_overview;
"
echo ""

# Test 8: Test query par token (URL compatibility)
echo "🔗 TEST 8 - QUERY PAR TOKEN (URL COMPATIBILITY)"
echo "-----------------------------------------------"
echo "Token JALIBAT: a4e19950-c73c-412c-be4d-699c9de1dde1"
wrangler d1 execute $DB_NAME $DB_FLAG --command="
SELECT 
  ea.id,
  ea.audit_token,
  ea.project_name,
  ea.total_modules,
  ea.completion_rate
FROM el_audits ea
WHERE ea.audit_token = 'a4e19950-c73c-412c-be4d-699c9de1dde1';
"
echo ""

# Test 9: Modules position_in_string + string_number
echo "📍 TEST 9 - MODULES POSITION + STRING"
echo "-------------------------------------"
wrangler d1 execute $DB_NAME $DB_FLAG --command="
SELECT 
  audit_token,
  string_number,
  position_in_string,
  module_identifier,
  defect_type,
  severity_level
FROM el_modules
WHERE audit_token = 'a4e19950-c73c-412c-be4d-699c9de1dde1'
ORDER BY string_number, position_in_string
LIMIT 10;
"
echo ""

# Test 10: Trigger completion_rate automatique
echo "⚙️ TEST 10 - TRIGGER COMPLETION_RATE"
echo "------------------------------------"
wrangler d1 execute $DB_NAME $DB_FLAG --command="
SELECT 
  audit_token,
  total_modules,
  modules_completed,
  completion_rate
FROM el_audits
ORDER BY id;
"
echo ""

# Test 11: Clients et projects
echo "👥 TEST 11 - CLIENTS ET PROJECTS"
echo "--------------------------------"
wrangler d1 execute $DB_NAME $DB_FLAG --command="
SELECT 
  c.id as client_id,
  c.name as client_name,
  p.id as project_id,
  p.name as project_name,
  p.total_modules,
  p.project_type
FROM clients c
JOIN projects p ON c.id = p.client_id
ORDER BY c.id, p.id;
"
echo ""

# Test 12: Interventions liées
echo "🔧 TEST 12 - INTERVENTIONS LIÉES"
echo "--------------------------------"
wrangler d1 execute $DB_NAME $DB_FLAG --command="
SELECT 
  i.id,
  i.intervention_type,
  p.name as project_name,
  u.name as technician_name,
  i.intervention_date
FROM interventions i
JOIN projects p ON i.project_id = p.id
LEFT JOIN users u ON i.technician_id = u.id
ORDER BY i.id;
"
echo ""

# Résumé final
echo "✅ ==== RÉSUMÉ TESTS MIGRATION ===="
echo ""
echo "Total tests exécutés: 12"
echo "Expected results:"
echo "  - 1 user, 2 clients, 2 projects, 2 interventions"
echo "  - 2 el_audits, 462 el_modules"
echo "  - JALIBAT: 242 modules"
echo "  - Les Forges: 220 modules"
echo "  - Distribution: 58 none + 87 microcrack + 182 dead + 135 inequality"
echo ""
echo "📅 Tests terminés: $(date)"
