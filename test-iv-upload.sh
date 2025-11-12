#!/bin/bash
# Script de test Module IV - Upload fichiers PVServ

echo "=========================================="
echo "TEST MODULE IV - UPLOAD FICHIERS PVSERV"
echo "=========================================="
echo ""

# Test 1: TXT File
echo "📄 Test 1: Upload fichier TXT (pvserve.txt)"
echo "-------------------------------------------"
curl -X POST http://localhost:3000/api/iv-curves/upload \
  -F "file=@test-data/pvserve.txt" \
  -H "Accept: application/json" \
  | jq '.' 2>/dev/null || echo "ERREUR: Parsing JSON failed"

echo ""
echo ""

# Test 2: Excel File
echo "📊 Test 2: Upload fichier Excel (pvServe-Dark-IV-Cuves-Macro-V5.1.xlsm)"
echo "-----------------------------------------------------------------------"
curl -X POST http://localhost:3000/api/iv-curves/upload \
  -F "file=@test-data/pvServe-Dark-IV-Cuves-Macro-V5.1.xlsm" \
  -H "Accept: application/json" \
  | jq '.' 2>/dev/null || echo "ERREUR: Parsing JSON failed"

echo ""
echo ""

# Test 3: Liste courbes
echo "📋 Test 3: Liste des courbes uploadées"
echo "---------------------------------------"
curl -s http://localhost:3000/api/iv-curves | jq '.' 2>/dev/null || echo "ERREUR: Parsing JSON failed"

echo ""
echo ""
echo "=========================================="
echo "TESTS TERMINÉS"
echo "=========================================="
