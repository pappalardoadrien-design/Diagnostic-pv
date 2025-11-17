#!/bin/bash

echo "═══════════════════════════════════════════════════════════════"
echo "🔍 VÉRIFICATION COHÉRENCE & INTERCONNEXION COMPLÈTE"
echo "═══════════════════════════════════════════════════════════════"
echo ""

echo "📊 1. VÉRIFICATION STRUCTURE DATABASE"
echo "─────────────────────────────────────────────────────────────"

# Check all tables exist
echo "Tables principales:"
npx wrangler d1 execute diagnostic-hub-production --local --command="
SELECT name FROM sqlite_master WHERE type='table' 
AND name IN ('auth_users', 'crm_clients', 'projects', 'interventions', 'el_audits', 'el_modules')
ORDER BY name;
" 2>&1 | grep -A 20 "results" | grep "name" | head -10

echo ""
echo "📋 2. VÉRIFICATION LIENS CRM → PROJECTS"
echo "─────────────────────────────────────────────────────────────"

# Check CRM clients link to projects
npx wrangler d1 execute diagnostic-hub-production --local --command="
SELECT 
  cc.id as client_id,
  cc.company_name,
  COUNT(DISTINCT p.id) as projects_count
FROM crm_clients cc
LEFT JOIN projects p ON p.client_id = cc.id
GROUP BY cc.id
ORDER BY cc.company_name;
" 2>&1 | grep -A 30 "results" | head -25

echo ""
echo "📋 3. VÉRIFICATION LIENS PROJECTS → INTERVENTIONS"
echo "─────────────────────────────────────────────────────────────"

# Check projects link to interventions
npx wrangler d1 execute diagnostic-hub-production --local --command="
SELECT 
  p.id as project_id,
  p.name as project_name,
  COUNT(DISTINCT i.id) as interventions_count,
  GROUP_CONCAT(DISTINCT i.intervention_type) as types
FROM projects p
LEFT JOIN interventions i ON i.project_id = p.id
GROUP BY p.id
ORDER BY p.name;
" 2>&1 | grep -A 40 "results" | head -35

echo ""
echo "📋 4. VÉRIFICATION LIENS INTERVENTIONS → AUDITS EL"
echo "─────────────────────────────────────────────────────────────"

# Check interventions link to el_audits
npx wrangler d1 execute diagnostic-hub-production --local --command="
SELECT 
  i.id as intervention_id,
  i.intervention_type,
  p.name as project_name,
  a.id as audit_id,
  a.status as audit_status,
  a.total_modules
FROM interventions i
LEFT JOIN projects p ON p.id = i.project_id
LEFT JOIN el_audits a ON a.intervention_id = i.id
WHERE i.intervention_type = 'el_audit'
ORDER BY i.id;
" 2>&1 | grep -A 50 "results" | head -40

echo ""
echo "📋 5. VÉRIFICATION AUDITS EL → MODULES"
echo "─────────────────────────────────────────────────────────────"

# Check el_audits link to el_modules
npx wrangler d1 execute diagnostic-hub-production --local --command="
SELECT 
  a.id as audit_id,
  a.project_name,
  a.total_modules as expected_modules,
  COUNT(DISTINCT m.id) as diagnosed_modules,
  ROUND(COUNT(DISTINCT m.id) * 100.0 / a.total_modules, 2) as completion_pct
FROM el_audits a
LEFT JOIN el_modules m ON m.el_audit_id = a.id
GROUP BY a.id
ORDER BY a.id;
" 2>&1 | grep -A 50 "results" | head -40

echo ""
echo "📋 6. TRAÇABILITÉ COMPLÈTE (VIEW v_complete_workflow)"
echo "─────────────────────────────────────────────────────────────"

# Test complete workflow view
npx wrangler d1 execute diagnostic-hub-production --local --command="
SELECT 
  company_name as 'Client',
  project_name as 'Projet',
  intervention_type as 'Type',
  intervention_status as 'Statut Int.',
  audit_status as 'Statut Audit',
  modules_diagnosed as 'Modules',
  CASE 
    WHEN intervention_id IS NOT NULL AND audit_id IS NOT NULL THEN '✅ COMPLET'
    WHEN intervention_id IS NOT NULL THEN '⚠️ SANS AUDIT'
    ELSE '❌ SANS INTERVENTION'
  END as 'Interconnexion'
FROM v_complete_workflow
WHERE project_name IS NOT NULL
LIMIT 10;
" 2>&1 | grep -A 100 "results" | head -80

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✅ VÉRIFICATION TERMINÉE"
echo "═══════════════════════════════════════════════════════════════"
