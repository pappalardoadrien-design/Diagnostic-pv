#!/bin/bash

# 🧪 Script de test automatique - Système Calepinage
# Usage: ./test-calepinage.sh [BASE_URL]
# Exemple: ./test-calepinage.sh http://localhost:3000
# Exemple: ./test-calepinage.sh https://diagpv-hub.pages.dev

set -e

# Configuration
BASE_URL="${1:-http://localhost:3000}"
PROJECT_ID="TEST-AUTO-$(date +%s)"
MODULE_TYPE="el"

echo "🧪 === TEST SYSTÈME CALEPINAGE ==="
echo "📍 URL: $BASE_URL"
echo "🔑 Project ID: $PROJECT_ID"
echo ""

# Fonction utilitaire
check_response() {
  local response="$1"
  local expected="$2"
  local test_name="$3"
  
  if echo "$response" | grep -q "$expected"; then
    echo "✅ $test_name: PASS"
    return 0
  else
    echo "❌ $test_name: FAIL"
    echo "   Response: $response"
    return 1
  fi
}

# Test 1: API Health Check
echo "🔍 Test 1: API Health Check"
response=$(curl -s "$BASE_URL/api/calepinage/layouts")
check_response "$response" "success" "GET /api/calepinage/layouts"
echo ""

# Test 2: Liste vide initialement
echo "🔍 Test 2: Liste layouts (devrait être vide ou contenir layouts existants)"
response=$(curl -s "$BASE_URL/api/calepinage/layouts")
check_response "$response" '"total"' "Response contient total"
echo ""

# Test 3: Créer un layout
echo "🔍 Test 3: Créer un nouveau layout"
response=$(curl -s -X POST "$BASE_URL/api/calepinage/layouts" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "'"$PROJECT_ID"'",
    "moduleType": "'"$MODULE_TYPE"'",
    "layoutName": "Test Auto Layout",
    "layout": {
      "viewBox": {"width": 2400, "height": 1200, "gridSize": 20},
      "modules": [
        {"identifier": "S1-1", "x": 100, "y": 100, "width": 60, "height": 35},
        {"identifier": "S1-2", "x": 170, "y": 100, "width": 60, "height": 35}
      ],
      "arrows": [
        {"id": "arrow-1", "stringNumber": 1, "startX": 100, "startY": 80, "endX": 230, "endY": 80, "label": "S1"}
      ],
      "zones": [
        {"id": "zone-1", "name": "Zone Test", "x": 80, "y": 60, "width": 200, "height": 140}
      ]
    }
  }')
check_response "$response" "Layout créé" "POST créer layout"
echo ""

# Test 4: Récupérer le layout créé
echo "🔍 Test 4: Récupérer le layout créé"
response=$(curl -s "$BASE_URL/api/calepinage/layouts/$PROJECT_ID")
check_response "$response" "Test Auto Layout" "GET layout spécifique"
check_response "$response" "S1-1" "Layout contient modules"
check_response "$response" "arrow-1" "Layout contient flèches"
check_response "$response" "Zone Test" "Layout contient zones"
echo ""

# Test 5: Vérifier que l'éditeur se charge
echo "🔍 Test 5: Éditeur HTML se charge"
response=$(curl -s "$BASE_URL/api/calepinage/editor/$PROJECT_ID?module_type=$MODULE_TYPE")
check_response "$response" "Éditeur de Calepinage" "Éditeur HTML"
check_response "$response" "canvas" "Canvas présent"
check_response "$response" "tool-btn" "Boutons outils présents"
echo ""

# Test 6: Vérifier que le viewer génère du SVG
echo "🔍 Test 6: Viewer SVG génère contenu"
response=$(curl -s "$BASE_URL/api/calepinage/viewer/$PROJECT_ID?module_type=$MODULE_TYPE")
check_response "$response" "<svg" "SVG généré"
check_response "$response" "S1-1" "Modules dans SVG"
check_response "$response" "arrow" "Flèches dans SVG"
check_response "$response" "Zone Test" "Zones dans SVG"
echo ""

# Test 7: Mettre à jour le layout
echo "🔍 Test 7: Mettre à jour layout existant"
response=$(curl -s -X POST "$BASE_URL/api/calepinage/layouts" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "'"$PROJECT_ID"'",
    "moduleType": "'"$MODULE_TYPE"'",
    "layoutName": "Test Auto Layout UPDATED",
    "layout": {
      "viewBox": {"width": 2400, "height": 1200, "gridSize": 20},
      "modules": [
        {"identifier": "S1-1", "x": 200, "y": 200, "width": 60, "height": 35}
      ],
      "arrows": [],
      "zones": []
    }
  }')
check_response "$response" "Layout mis à jour" "POST update layout"
echo ""

# Test 8: Vérifier la mise à jour
echo "🔍 Test 8: Vérifier mise à jour appliquée"
response=$(curl -s "$BASE_URL/api/calepinage/layouts/$PROJECT_ID")
check_response "$response" "UPDATED" "Nom mis à jour"
echo ""

# Test 9: Supprimer le layout
echo "🔍 Test 9: Supprimer layout test"
response=$(curl -s -X DELETE "$BASE_URL/api/calepinage/layouts/$PROJECT_ID")
check_response "$response" "Layout supprimé" "DELETE layout"
echo ""

# Test 10: Vérifier suppression
echo "🔍 Test 10: Vérifier layout supprimé"
response=$(curl -s "$BASE_URL/api/calepinage/layouts/$PROJECT_ID")
check_response "$response" "Layout non trouvé" "GET layout supprimé"
echo ""

# Test 11: Viewer sans layout (404 friendly)
echo "🔍 Test 11: Viewer affiche message si pas de layout"
response=$(curl -s "$BASE_URL/api/calepinage/viewer/PROJECT-INEXISTANT?module_type=el")
check_response "$response" "Aucun plan de calepinage" "Message erreur friendly"
echo ""

# Résumé
echo ""
echo "🎉 === RÉSUMÉ DES TESTS ==="
echo "✅ Tous les tests sont passés avec succès !"
echo ""
echo "📊 Tests effectués:"
echo "   1. ✅ API Health Check"
echo "   2. ✅ Liste layouts"
echo "   3. ✅ Créer layout"
echo "   4. ✅ Récupérer layout"
echo "   5. ✅ Éditeur HTML"
echo "   6. ✅ Viewer SVG"
echo "   7. ✅ Update layout"
echo "   8. ✅ Vérifier update"
echo "   9. ✅ Delete layout"
echo "  10. ✅ Vérifier delete"
echo "  11. ✅ Viewer sans layout"
echo ""
echo "🚀 Le système calepinage est fonctionnel à 100% !"
