#!/bin/bash

echo "═══════════════════════════════════════════════════════════════"
echo "📊 VÉRIFICATION ÉTAT BASE DE DONNÉES"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Check if database is corrupted
if [ ! -f ".wrangler/state/v3/d1/miniflare-D1DatabaseObject/72be68d4c5c54854 9ead3bbcc131d199.sqlite" ]; then
    echo "⚠️  Base de données locale introuvable ou corrompue"
    echo "🔄 Recréation de la base de données..."
    rm -rf .wrangler/state/v3/d1
    npx wrangler d1 migrations apply diagnostic-hub-production --local 2>&1 | tail -20
fi

echo ""
echo "📋 1. CLIENTS (simple table)"
echo "─────────────────────────────────────────────────────────────"
npx wrangler d1 execute diagnostic-hub-production --local --command="
SELECT id, name as company_name, contact_email FROM clients ORDER BY id;
" 2>&1 | grep -A 100 "results" | head -50

echo ""
echo "📋 2. CRM_CLIENTS (module CRM)"
echo "─────────────────────────────────────────────────────────────"
npx wrangler d1 execute diagnostic-hub-production --local --command="
SELECT id, company_name, main_contact_email as contact_email FROM crm_clients ORDER BY id;
" 2>&1 | grep -A 100 "results" | head -50

echo ""
echo "📋 3. PROJECTS"
echo "─────────────────────────────────────────────────────────────"
npx wrangler d1 execute diagnostic-hub-production --local --command="
SELECT p.id, p.name, p.client_id, c.name as client_name 
FROM projects p 
LEFT JOIN clients c ON c.id = p.client_id 
ORDER BY p.id;
" 2>&1 | grep -A 100 "results" | head -50

echo ""
echo "📋 4. INTERVENTIONS (non assignées)"
echo "─────────────────────────────────────────────────────────────"
npx wrangler d1 execute diagnostic-hub-production --local --command="
SELECT COUNT(*) as total, 
       SUM(CASE WHEN technician_id IS NULL THEN 1 ELSE 0 END) as unassigned
FROM interventions;
" 2>&1 | grep -A 50 "results" | head -30

echo ""
echo "📋 5. AUDITS EL"
echo "─────────────────────────────────────────────────────────────"
npx wrangler d1 execute diagnostic-hub-production --local --command="
SELECT id, project_name, client_name, intervention_id, status 
FROM el_audits 
ORDER BY id;
" 2>&1 | grep -A 100 "results" | head -50

echo ""
echo "═══════════════════════════════════════════════════════════════"
