#!/bin/bash
# ==================================================================
# SCRIPT CRÉATION AUDIT - Configuration Avancée Strings Inégaux
# ==================================================================
# Usage: ./create-audit-advanced.sh
# Crée un audit EL avec configuration personnalisée

set -e

API_URL="${API_URL:-https://diagnostic-hub.pages.dev/api/el/audit/create}"

echo "🔋 CRÉATION AUDIT EL - Configuration Avancée"
echo "=============================================="
echo ""

# Demander les infos projet
read -p "📝 Nom du projet : " PROJECT_NAME
read -p "👤 Nom du client : " CLIENT_NAME
read -p "📍 Localisation : " LOCATION
read -p "🔢 Nombre de strings : " STRING_COUNT

echo ""
echo "📊 Configuration des strings :"
echo ""

# Construire le JSON strings
STRINGS_JSON="["
for ((i=1; i<=STRING_COUNT; i++)); do
  read -p "  String $i - Nombre de modules : " MODULE_COUNT
  
  if [ $i -gt 1 ]; then
    STRINGS_JSON+=","
  fi
  
  STRINGS_JSON+="{\"mpptNumber\":$i,\"moduleCount\":$MODULE_COUNT,\"physicalRow\":$i,\"physicalCol\":0}"
done
STRINGS_JSON+="]"

# Calculer total modules
TOTAL_MODULES=$(echo $STRINGS_JSON | jq '[.[] | .moduleCount] | add')

echo ""
echo "✅ Configuration :"
echo "  - Projet : $PROJECT_NAME"
echo "  - Client : $CLIENT_NAME"
echo "  - Strings : $STRING_COUNT"
echo "  - Total modules : $TOTAL_MODULES"
echo ""

read -p "🚀 Créer cet audit ? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Création annulée"
  exit 1
fi

# Créer le JSON payload
PAYLOAD=$(cat <<EOF
{
  "projectName": "$PROJECT_NAME",
  "clientName": "$CLIENT_NAME",
  "location": "$LOCATION",
  "configuration": {
    "mode": "advanced",
    "totalModules": $TOTAL_MODULES,
    "stringCount": $STRING_COUNT,
    "strings": $STRINGS_JSON
  }
}
EOF
)

echo ""
echo "📡 Envoi requête API..."
echo ""

# Envoyer la requête
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

# Vérifier la réponse
SUCCESS=$(echo $RESPONSE | jq -r '.success // false')

if [ "$SUCCESS" = "true" ]; then
  TOKEN=$(echo $RESPONSE | jq -r '.auditToken')
  
  echo "✅ AUDIT CRÉÉ AVEC SUCCÈS !"
  echo ""
  echo "📋 Token : $TOKEN"
  echo ""
  echo "🔗 URLs disponibles :"
  echo "  📊 Dashboard : https://diagnostic-hub.pages.dev/api/dashboard/audits"
  echo "  ✏️  Éditeur : https://diagnostic-hub.pages.dev/api/calepinage/editor/$TOKEN?module_type=el"
  echo "  🗺️  Viewer : https://diagnostic-hub.pages.dev/api/calepinage/viewer/$TOKEN?module_type=el"
  echo "  📄 Rapport : https://diagnostic-hub.pages.dev/api/el/reports/complete/$TOKEN"
  echo ""
else
  echo "❌ ERREUR lors de la création :"
  echo $RESPONSE | jq '.'
  exit 1
fi
