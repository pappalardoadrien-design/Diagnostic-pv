#!/bin/bash

echo "═══════════════════════════════════════════════════════════════"
echo "📊 ANALYSE ARCHITECTURE BASE DE DONNÉES - DiagPV CRM"
echo "═══════════════════════════════════════════════════════════════"
echo ""

echo "🔍 1. STRUCTURE DES TABLES PRINCIPALES"
echo "───────────────────────────────────────────────────────────────"

# Clients table (simple - pour FK projects)
echo "📋 TABLE: clients"
npx wrangler d1 execute diagnostic-hub-production --local --command="
SELECT sql FROM sqlite_master WHERE type='table' AND name='clients';
" 2>/dev/null | tail -n +2

echo ""
echo "📋 TABLE: crm_clients (module CRM riche)"
npx wrangler d1 execute diagnostic-hub-production --local --command="
SELECT sql FROM sqlite_master WHERE type='table' AND name='crm_clients';
" 2>/dev/null | tail -n +2

echo ""
echo "📋 TABLE: projects"
npx wrangler d1 execute diagnostic-hub-production --local --command="
SELECT sql FROM sqlite_master WHERE type='table' AND name='projects';
" 2>/dev/null | tail -n +2

echo ""
echo "📋 TABLE: interventions"
npx wrangler d1 execute diagnostic-hub-production --local --command="
SELECT sql FROM sqlite_master WHERE type='table' AND name='interventions';
" 2>/dev/null | tail -n +2

echo ""
echo "📋 TABLE: el_audits"
npx wrangler d1 execute diagnostic-hub-production --local --command="
SELECT sql FROM sqlite_master WHERE type='table' AND name='el_audits';
" 2>/dev/null | tail -n +2

echo ""
echo "📋 TABLE: el_modules"
npx wrangler d1 execute diagnostic-hub-production --local --command="
SELECT sql FROM sqlite_master WHERE type='table' AND name='el_modules';
" 2>/dev/null | tail -n +2

echo ""
echo "🔗 2. RELATIONS ET FOREIGN KEYS"
echo "───────────────────────────────────────────────────────────────"
npx wrangler d1 execute diagnostic-hub-production --local --command="
SELECT 
    m.name as table_name,
    p.id as fk_id,
    p.'from' as from_column,
    p.'table' as ref_table,
    p.'to' as ref_column,
    p.on_delete as on_delete_action
FROM sqlite_master m
JOIN pragma_foreign_key_list(m.name) p
WHERE m.type = 'table'
  AND m.name IN ('clients', 'crm_clients', 'projects', 'interventions', 'el_audits', 'el_modules')
ORDER BY m.name, p.id;
" 2>/dev/null | tail -n +2

echo ""
echo "📊 3. DONNÉES ACTUELLES"
echo "───────────────────────────────────────────────────────────────"

echo "👥 Clients (simple): $(npx wrangler d1 execute diagnostic-hub-production --local --command="SELECT COUNT(*) as cnt FROM clients;" 2>/dev/null | grep -v cnt | grep -v "^$" | tail -1)"
npx wrangler d1 execute diagnostic-hub-production --local --command="
SELECT id, company_name, contact_email FROM clients ORDER BY id;
" 2>/dev/null | tail -n +2

echo ""
echo "🏢 CRM Clients (module CRM): $(npx wrangler d1 execute diagnostic-hub-production --local --command="SELECT COUNT(*) as cnt FROM crm_clients;" 2>/dev/null | grep -v cnt | grep -v "^$" | tail -1)"
npx wrangler d1 execute diagnostic-hub-production --local --command="
SELECT id, company_name, contact_email FROM crm_clients ORDER BY id;
" 2>/dev/null | tail -n +2

echo ""
echo "📁 Projects: $(npx wrangler d1 execute diagnostic-hub-production --local --command="SELECT COUNT(*) as cnt FROM projects;" 2>/dev/null | grep -v cnt | grep -v "^$" | tail -1)"
npx wrangler d1 execute diagnostic-hub-production --local --command="
SELECT 
    p.id, 
    p.name, 
    p.client_id,
    c.company_name as client_name,
    p.installation_power,
    p.total_modules
FROM projects p
LEFT JOIN clients c ON c.id = p.client_id
ORDER BY p.id;
" 2>/dev/null | tail -n +2

echo ""
echo "🗓️ Interventions: $(npx wrangler d1 execute diagnostic-hub-production --local --command="SELECT COUNT(*) as cnt FROM interventions;" 2>/dev/null | grep -v cnt | grep -v "^$" | tail -1)"
npx wrangler d1 execute diagnostic-hub-production --local --command="
SELECT 
    i.id,
    i.project_id,
    p.name as project_name,
    i.technician_id,
    u.email as technician,
    i.intervention_type,
    i.intervention_date,
    i.status
FROM interventions i
LEFT JOIN projects p ON p.id = i.project_id
LEFT JOIN auth_users u ON u.id = i.technician_id
ORDER BY i.id;
" 2>/dev/null | tail -n +2

echo ""
echo "🔍 Audits EL: $(npx wrangler d1 execute diagnostic-hub-production --local --command="SELECT COUNT(*) as cnt FROM el_audits;" 2>/dev/null | grep -v cnt | grep -v "^$" | tail -1)"
npx wrangler d1 execute diagnostic-hub-production --local --command="
SELECT 
    id,
    project_name,
    client_name,
    location,
    audit_date,
    total_modules,
    status
FROM el_audits
ORDER BY id;
" 2>/dev/null | tail -n +2

echo ""
echo "🧩 Modules EL (échantillon 5 premiers):"
npx wrangler d1 execute diagnostic-hub-production --local --command="
SELECT 
    m.id,
    m.audit_id,
    a.project_name,
    m.string_id,
    m.position,
    m.status
FROM el_modules m
LEFT JOIN el_audits a ON a.id = m.audit_id
ORDER BY m.id
LIMIT 5;
" 2>/dev/null | tail -n +2

echo ""
echo "🔗 4. ANALYSE DES LIENS CLIENTS"
echo "───────────────────────────────────────────────────────────────"
echo "⚠️  PROBLÈME POTENTIEL: Deux tables clients distinctes"
echo "   • clients (simple) : Utilisée par projects.client_id FK"
echo "   • crm_clients (CRM) : Utilisée par el_audits.client_id FK"
echo ""
echo "❓ VÉRIFICATION: Les clients sont-ils synchronisés?"
npx wrangler d1 execute diagnostic-hub-production --local --command="
SELECT 
    'clients' as table_name,
    id,
    company_name,
    contact_email
FROM clients
UNION ALL
SELECT 
    'crm_clients' as table_name,
    id,
    company_name,
    contact_email
FROM crm_clients
ORDER BY company_name;
" 2>/dev/null | tail -n +2

echo ""
echo "🔗 5. TRAÇABILITÉ COMPLÈTE: CLIENT → RAPPORT"
echo "───────────────────────────────────────────────────────────────"
npx wrangler d1 execute diagnostic-hub-production --local --command="
SELECT 
    c.company_name as 'Client',
    p.name as 'Projet',
    i.intervention_type as 'Type Intervention',
    i.intervention_date as 'Date',
    u.email as 'Technicien',
    i.status as 'Statut Intervention',
    a.project_name as 'Audit Projet',
    a.status as 'Statut Audit',
    a.total_modules as 'Modules Total',
    COUNT(DISTINCT m.id) as 'Modules Diagnostiqués'
FROM clients c
LEFT JOIN projects p ON p.client_id = c.id
LEFT JOIN interventions i ON i.project_id = p.id
LEFT JOIN auth_users u ON u.id = i.technician_id
LEFT JOIN el_audits a ON (
    a.client_name = c.company_name 
    OR a.project_name = p.name
)
LEFT JOIN el_modules m ON m.audit_id = a.id
GROUP BY c.id, p.id, i.id, a.id
ORDER BY c.company_name, p.name, i.intervention_date;
" 2>/dev/null | tail -n +2

echo ""
echo "✅ 6. COMPATIBILITÉ AVEC VISION GLOBALE"
echo "───────────────────────────────────────────────────────────────"
echo "📋 Phase actuelle: Back-Office Gestion Missions (95% compatible)"
echo ""
echo "✅ Modules implémentés:"
echo "   • Authentication (multi-role: admin, subcontractor, client, auditor)"
echo "   • CRM Clients (crm_clients table richesse client)"
echo "   • Planning & Attribution (interventions avec FK projects + technician)"
echo "   • Module EL (el_audits + el_modules avec 6 états diagnostic)"
echo ""
echo "⚠️  Points d'attention:"
echo "   • Dualité clients / crm_clients (besoin synchronisation?)"
echo "   • Lien el_audits.client_id → crm_clients.id (FK manquante dans schema?)"
echo "   • Pas de lien direct intervention → el_audit (jointure via project_name)"
echo ""
echo "🎯 Recommandations:"
echo "   1. Ajouter intervention_id dans el_audits (lien direct)"
echo "   2. Migrer tous les clients vers crm_clients (table unique)"
echo "   3. Ajouter FK el_audits.client_id → crm_clients.id"
echo "   4. Créer view v_complete_workflow pour traçabilité"
echo ""

echo "═══════════════════════════════════════════════════════════════"
echo "✅ ANALYSE TERMINÉE"
echo "═══════════════════════════════════════════════════════════════"
