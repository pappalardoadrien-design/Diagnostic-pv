#!/bin/bash
# =============================================================================
# DiagPV Hub - Script de Test API Complet
# =============================================================================
# Usage: ./tests/api-health-check.sh [local|prod]
# Default: prod (https://diagnostic-hub.pages.dev)
# =============================================================================

set -e

# Configuration
if [ "$1" == "local" ]; then
    BASE_URL="http://localhost:3000"
    echo "=== MODE LOCAL: $BASE_URL ==="
else
    BASE_URL="https://diagnostic-hub.pages.dev"
    echo "=== MODE PRODUCTION: $BASE_URL ==="
fi

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Compteurs
TOTAL=0
PASSED=0
FAILED=0

# Fonction de test
test_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_status=$3
    local description=$4
    local data=$5
    
    TOTAL=$((TOTAL + 1))
    
    if [ "$method" == "GET" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint" 2>/dev/null || echo "000")
    else
        response=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$data" "$BASE_URL$endpoint" 2>/dev/null || echo "000")
    fi
    
    if [ "$response" == "$expected_status" ]; then
        echo -e "${GREEN}[PASS]${NC} $method $endpoint -> $response ($description)"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}[FAIL]${NC} $method $endpoint -> $response (expected: $expected_status) - $description"
        FAILED=$((FAILED + 1))
    fi
}

# Fonction test JSON response
test_json_endpoint() {
    local endpoint=$1
    local key=$2
    local description=$3
    
    TOTAL=$((TOTAL + 1))
    
    response=$(curl -s "$BASE_URL$endpoint" 2>/dev/null)
    
    if echo "$response" | grep -q "\"$key\""; then
        echo -e "${GREEN}[PASS]${NC} GET $endpoint -> contains '$key' ($description)"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}[FAIL]${NC} GET $endpoint -> missing '$key' - $description"
        FAILED=$((FAILED + 1))
    fi
}

echo ""
echo "=============================================="
echo "  DiagPV Hub - API Health Check"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "=============================================="
echo ""

# =============================================================================
# SECTION 1: Pages principales (GET - expect 200)
# =============================================================================
echo -e "${BLUE}--- PAGES PRINCIPALES ---${NC}"
test_endpoint "GET" "/" "302" "Redirect to dashboard"
test_endpoint "GET" "/dashboard" "200" "Dashboard audits EL"
test_endpoint "GET" "/crm/dashboard" "200" "CRM Dashboard"
test_endpoint "GET" "/crm/clients" "200" "CRM Clients list"
test_endpoint "GET" "/crm/clients/create" "200" "CRM Client create form"
test_endpoint "GET" "/crm/projects" "200" "CRM Projects list"
test_endpoint "GET" "/crm/projects/create" "200" "CRM Project create form"
test_endpoint "GET" "/planning" "200" "Planning dashboard"
test_endpoint "GET" "/planning/create" "200" "Planning create form"
test_endpoint "GET" "/girasole/dashboard" "200" "GIRASOLE dashboard"
test_endpoint "GET" "/audits/create" "200" "Audits create wizard"
test_endpoint "GET" "/pv/plants" "200" "PV Plants list"
test_endpoint "GET" "/tools" "200" "Legacy tools page"
test_endpoint "GET" "/el" "302" "EL redirect to audits/create"
test_endpoint "GET" "/login" "200" "Login page"

# =============================================================================
# SECTION 2: API CRM
# =============================================================================
echo ""
echo -e "${BLUE}--- API CRM ---${NC}"
test_json_endpoint "/api/crm/dashboard/unified/summary" "success" "CRM unified summary"
test_json_endpoint "/api/crm/clients" "total" "CRM clients list"
test_json_endpoint "/api/crm/projects" "projects" "CRM projects list"

# =============================================================================
# SECTION 3: API Planning
# =============================================================================
echo ""
echo -e "${BLUE}--- API PLANNING ---${NC}"
test_json_endpoint "/api/planning/interventions" "success" "Planning interventions"

# =============================================================================
# SECTION 4: API GIRASOLE
# =============================================================================
echo ""
echo -e "${BLUE}--- API GIRASOLE ---${NC}"
test_json_endpoint "/api/girasole/stats" "success" "GIRASOLE stats"
test_json_endpoint "/api/girasole/projects" "success" "GIRASOLE projects"
test_json_endpoint "/api/girasole/checklist/CONFORMITE" "success" "GIRASOLE checklist CONFORMITE"
test_json_endpoint "/api/girasole/checklist/TOITURE" "success" "GIRASOLE checklist TOITURE"

# =============================================================================
# SECTION 5: API Audits EL
# =============================================================================
echo ""
echo -e "${BLUE}--- API AUDITS EL ---${NC}"
test_json_endpoint "/api/el/dashboard/audits" "success" "EL dashboard audits"
test_json_endpoint "/api/el/dashboard/overview" "success" "EL dashboard overview"

# =============================================================================
# SECTION 6: API Visual Inspection
# =============================================================================
echo ""
echo -e "${BLUE}--- API VISUAL INSPECTION ---${NC}"
test_json_endpoint "/api/visual/checklist" "items" "Visual checklist IEC 62446-1"

# =============================================================================
# SECTION 7: API PV Cartography
# =============================================================================
echo ""
echo -e "${BLUE}--- API PV CARTOGRAPHY ---${NC}"
test_json_endpoint "/api/pv/plants" "plants" "PV plants list"

# =============================================================================
# SECTION 8: Redirects et routes spéciales
# =============================================================================
echo ""
echo -e "${BLUE}--- REDIRECTS & SPECIAL ROUTES ---${NC}"
test_endpoint "GET" "/pv/plant/1/designer" "302" "Designer redirect (no zone)"
test_endpoint "GET" "/favicon.svg" "200" "Favicon SVG"
test_endpoint "GET" "/favicon.ico" "301" "Favicon ICO redirect"

# =============================================================================
# SECTION 9: Static files
# =============================================================================
echo ""
echo -e "${BLUE}--- STATIC FILES ---${NC}"
test_endpoint "GET" "/static/diagpv-styles.css" "200" "DiagPV CSS"
test_endpoint "GET" "/static/diagpv-dashboard.js" "200" "Dashboard JS"
test_endpoint "GET" "/static/diagpv-audit.js" "200" "Audit JS"

# =============================================================================
# RÉSUMÉ
# =============================================================================
echo ""
echo "=============================================="
echo "  RÉSUMÉ DES TESTS"
echo "=============================================="
echo -e "Total:  $TOTAL tests"
echo -e "Passés: ${GREEN}$PASSED${NC}"
echo -e "Échoués: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}=== TOUS LES TESTS PASSENT ===${NC}"
    exit 0
else
    echo -e "${RED}=== $FAILED TEST(S) EN ÉCHEC ===${NC}"
    exit 1
fi
