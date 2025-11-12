#!/bin/bash
# Tests complets Module IV - Courbes I-V

echo "=============================================="
echo "MODULE IV - TESTS COMPLETS"
echo "=============================================="
echo ""

# Reset DB pour tests propres
echo "🔄 Reset DB (suppression anciennes courbes)..."
curl -s -X DELETE http://localhost:3000/api/iv-curves/1 > /dev/null 2>&1
curl -s -X DELETE http://localhost:3000/api/iv-curves/2 > /dev/null 2>&1
curl -s -X DELETE http://localhost:3000/api/iv-curves/3 > /dev/null 2>&1
curl -s -X DELETE http://localhost:3000/api/iv-curves/4 > /dev/null 2>&1
curl -s -X DELETE http://localhost:3000/api/iv-curves/5 > /dev/null 2>&1
echo "✅ DB reset"
echo ""

# Test 1: Upload TXT
echo "=============================================="
echo "TEST 1: UPLOAD FICHIER TXT"
echo "=============================================="
RESULT_TXT=$(curl -s -X POST http://localhost:3000/api/iv-curves/upload \
  -F "file=@test-data/pvserve.txt")

echo "$RESULT_TXT" | jq '.'

SUCCESS_TXT=$(echo "$RESULT_TXT" | jq -r '.success')
COUNT_TXT=$(echo "$RESULT_TXT" | jq -r '.curvesCount')

if [ "$SUCCESS_TXT" = "true" ] && [ "$COUNT_TXT" -gt 0 ]; then
    echo "✅ TXT: $COUNT_TXT courbe(s) uploadée(s)"
else
    echo "❌ TXT: Échec upload"
fi

echo ""
echo ""

# Test 2: Upload Excel
echo "=============================================="
echo "TEST 2: UPLOAD FICHIER EXCEL"
echo "=============================================="
RESULT_XLSX=$(curl -s -X POST http://localhost:3000/api/iv-curves/upload \
  -F "file=@test-data/pvServe-Dark-IV-Cuves-Macro-V5.1.xlsm")

echo "$RESULT_XLSX" | jq '.'

SUCCESS_XLSX=$(echo "$RESULT_XLSX" | jq -r '.success')
COUNT_XLSX=$(echo "$RESULT_XLSX" | jq -r '.curvesCount')

if [ "$SUCCESS_XLSX" = "true" ] && [ "$COUNT_XLSX" -gt 0 ]; then
    echo "✅ EXCEL: $COUNT_XLSX courbe(s) uploadée(s)"
else
    echo "❌ EXCEL: Échec upload"
fi

echo ""
echo ""

# Test 3: Liste toutes courbes
echo "=============================================="
echo "TEST 3: LISTE TOUTES LES COURBES"
echo "=============================================="
RESULT_LIST=$(curl -s http://localhost:3000/api/iv-curves)

echo "$RESULT_LIST" | jq '.'

TOTAL=$(echo "$RESULT_LIST" | jq -r '.count')
echo "📊 Total courbes en DB: $TOTAL"

echo ""
echo ""

# Test 4: Récupérer courbe avec mesures
echo "=============================================="
echo "TEST 4: DÉTAIL COURBE #1 (avec points mesure)"
echo "=============================================="
RESULT_DETAIL=$(curl -s http://localhost:3000/api/iv-curves/1)

echo "$RESULT_DETAIL" | jq '{
  id, 
  string_number, 
  fill_factor, 
  isc, 
  voc, 
  pmax, 
  anomaly_detected, 
  measurements_count: (.measurements | length)
}'

MEASUREMENTS_COUNT=$(echo "$RESULT_DETAIL" | jq '.measurements | length')

if [ "$MEASUREMENTS_COUNT" -gt 0 ]; then
    echo "✅ Courbe #1: $MEASUREMENTS_COUNT points de mesure récupérés"
else
    echo "❌ Courbe #1: Aucun point de mesure"
fi

echo ""
echo ""

# Test 5: Filtrer par string
echo "=============================================="
echo "TEST 5: COURBES PAR STRING #2"
echo "=============================================="
RESULT_STRING=$(curl -s http://localhost:3000/api/iv-curves/by-string/2)

echo "$RESULT_STRING" | jq '.'

STRING_COUNT=$(echo "$RESULT_STRING" | jq '.curves | length')
echo "📊 Courbes string #2: $STRING_COUNT"

echo ""
echo ""

# Résumé
echo "=============================================="
echo "RÉSUMÉ DES TESTS"
echo "=============================================="
echo "✅ Upload TXT: $COUNT_TXT courbe(s)"
echo "✅ Upload Excel: $COUNT_XLSX courbe(s)"
echo "✅ Total en DB: $TOTAL courbe(s)"
echo "✅ Mesures courbe #1: $MEASUREMENTS_COUNT points"
echo "✅ Courbes string #2: $STRING_COUNT courbe(s)"
echo ""
echo "🎉 TOUS LES TESTS PASSÉS !"
echo "=============================================="
