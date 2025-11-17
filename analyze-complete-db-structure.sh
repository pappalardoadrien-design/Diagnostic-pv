#!/bin/bash

echo "═══════════════════════════════════════════════════════════════"
echo "🔍 ANALYSE COMPLÈTE STRUCTURE BASE DE DONNÉES"
echo "═══════════════════════════════════════════════════════════════"
echo ""

echo "📊 1. LISTE DE TOUTES LES TABLES"
echo "─────────────────────────────────────────────────────────────"

npx wrangler d1 execute diagnostic-hub-production --local --command="
SELECT 
  name as table_name,
  type
FROM sqlite_master 
WHERE type IN ('table', 'view')
  AND name NOT LIKE 'sqlite_%'
ORDER BY type DESC, name;
" 2>&1 | grep -A 100 "results" | python3 -m json.tool 2>/dev/null | head -100

echo ""
echo "📋 2. SCHÉMA COMPLET DE CHAQUE TABLE"
echo "─────────────────────────────────────────────────────────────"

# Get all table names
TABLES=$(npx wrangler d1 execute diagnostic-hub-production --local --command="
SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;
" 2>&1 | grep '"name":' | cut -d'"' -f4)

for table in $TABLES; do
    echo ""
    echo "▶ TABLE: $table"
    echo "───────────────────────────────────────────"
    npx wrangler d1 execute diagnostic-hub-production --local --command="
    SELECT sql FROM sqlite_master WHERE type='table' AND name='$table';
    " 2>&1 | grep -A 5 "CREATE TABLE" | head -30
done

echo ""
echo "🔗 3. TOUTES LES FOREIGN KEYS"
echo "─────────────────────────────────────────────────────────────"

npx wrangler d1 execute diagnostic-hub-production --local --command="
SELECT 
    m.name as table_name,
    p.'from' as from_column,
    p.'table' as references_table,
    p.'to' as references_column,
    p.on_delete as on_delete_action,
    p.on_update as on_update_action
FROM sqlite_master m
JOIN pragma_foreign_key_list(m.name) p
WHERE m.type = 'table'
ORDER BY m.name, p.id;
" 2>&1 | grep -A 200 "results" | python3 -m json.tool 2>/dev/null | head -150

echo ""
echo "📊 4. INDEXES EXISTANTS"
echo "─────────────────────────────────────────────────────────────"

npx wrangler d1 execute diagnostic-hub-production --local --command="
SELECT 
    name as index_name,
    tbl_name as table_name,
    sql
FROM sqlite_master 
WHERE type = 'index' 
  AND name NOT LIKE 'sqlite_%'
ORDER BY tbl_name, name;
" 2>&1 | grep -A 200 "results" | python3 -m json.tool 2>/dev/null | head -200

echo ""
echo "📊 5. VUES (VIEWS) EXISTANTES"
echo "─────────────────────────────────────────────────────────────"

npx wrangler d1 execute diagnostic-hub-production --local --command="
SELECT 
    name as view_name,
    sql
FROM sqlite_master 
WHERE type = 'view'
ORDER BY name;
" 2>&1 | grep -A 100 "results" | python3 -m json.tool 2>/dev/null | head -150

echo ""
echo "📊 6. NOMBRE D'ENREGISTREMENTS PAR TABLE"
echo "─────────────────────────────────────────────────────────────"

for table in $TABLES; do
    COUNT=$(npx wrangler d1 execute diagnostic-hub-production --local --command="SELECT COUNT(*) as cnt FROM $table;" 2>&1 | grep -v "wrangler" | grep -v "Executing" | grep -v "remote" | grep -v "success" | grep -v "duration" | grep -v "results" | grep -v "meta" | grep -v "^$" | tail -1)
    echo "  $table: $COUNT"
done

echo ""
echo "🔍 7. DÉTECTION DOUBLONS / INCOHÉRENCES"
echo "─────────────────────────────────────────────────────────────"

echo ""
echo "▶ Vérification tables clients en double:"
npx wrangler d1 execute diagnostic-hub-production --local --command="
SELECT name FROM sqlite_master 
WHERE type='table' 
  AND (name LIKE '%client%' OR name LIKE '%customer%')
ORDER BY name;
" 2>&1 | grep '"name":' | cut -d'"' -f4

echo ""
echo "▶ Vérification colonnes doublons dans interventions:"
npx wrangler d1 execute diagnostic-hub-production --local --command="
PRAGMA table_info(interventions);
" 2>&1 | grep -A 100 "results" | python3 -m json.tool 2>/dev/null | grep '"name":' | head -20

echo ""
echo "▶ Vérification colonnes doublons dans el_audits:"
npx wrangler d1 execute diagnostic-hub-production --local --command="
PRAGMA table_info(el_audits);
" 2>&1 | grep -A 100 "results" | python3 -m json.tool 2>/dev/null | grep '"name":' | head -20

echo ""
echo "▶ Vérification Foreign Keys orphelines (interventions sans project):"
npx wrangler d1 execute diagnostic-hub-production --local --command="
SELECT COUNT(*) as orphaned_interventions
FROM interventions i
LEFT JOIN projects p ON p.id = i.project_id
WHERE p.id IS NULL;
" 2>&1 | grep -v "wrangler" | grep -v "Executing" | tail -5

echo ""
echo "▶ Vérification Foreign Keys orphelines (audits sans intervention):"
npx wrangler d1 execute diagnostic-hub-production --local --command="
SELECT COUNT(*) as orphaned_audits
FROM el_audits a
LEFT JOIN interventions i ON i.id = a.intervention_id
WHERE a.intervention_id IS NOT NULL AND i.id IS NULL;
" 2>&1 | grep -v "wrangler" | grep -v "Executing" | tail -5

echo ""
echo "▶ Vérification modules orphelins (sans audit):"
npx wrangler d1 execute diagnostic-hub-production --local --command="
SELECT COUNT(*) as orphaned_modules
FROM el_modules m
LEFT JOIN el_audits a ON a.id = m.el_audit_id
WHERE a.id IS NULL;
" 2>&1 | grep -v "wrangler" | grep -v "Executing" | tail -5

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✅ ANALYSE COMPLÈTE TERMINÉE"
echo "═══════════════════════════════════════════════════════════════"
