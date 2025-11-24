#!/bin/bash
# Script de backup automatique - DiagPV Platform
# Créé le: 24 Novembre 2025
# Objectif: Protéger contre toute perte de code

set -e

# Configuration
BACKUP_DIR="backups"
AIDRIVE_DIR="/mnt/aidrive/snapshots"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
PROJECT_NAME="diagpv-webapp"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔒 BACKUP AUTOMATIQUE DIAGPV${NC}"
echo "================================"
echo "Date: $(date)"
echo ""

# 1. Créer dossier backups local
mkdir -p "$BACKUP_DIR"
echo -e "${YELLOW}📁 Dossier backups: $BACKUP_DIR${NC}"

# 2. Backup local (rapide)
echo -e "${YELLOW}📦 Création backup local...${NC}"
tar -czf "$BACKUP_DIR/${PROJECT_NAME}-${TIMESTAMP}.tar.gz" \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='dist' \
    --exclude='.wrangler' \
    --exclude='backups' \
    src/ public/ migrations/ package.json wrangler.jsonc tsconfig.json

BACKUP_SIZE=$(du -h "$BACKUP_DIR/${PROJECT_NAME}-${TIMESTAMP}.tar.gz" | cut -f1)
echo -e "${GREEN}✅ Backup local créé: ${BACKUP_SIZE}${NC}"

# 3. Backup AI Drive (si disponible)
if [ -d "/mnt/aidrive" ]; then
    echo -e "${YELLOW}☁️  Copie vers AI Drive...${NC}"
    mkdir -p "$AIDRIVE_DIR"
    cp "$BACKUP_DIR/${PROJECT_NAME}-${TIMESTAMP}.tar.gz" "$AIDRIVE_DIR/" 2>/dev/null || {
        echo -e "${RED}⚠️  AI Drive inaccessible (lent). Backup local OK.${NC}"
    }
    echo -e "${GREEN}✅ Backup AI Drive créé${NC}"
else
    echo -e "${YELLOW}ℹ️  AI Drive non monté. Backup local uniquement.${NC}"
fi

# 4. Nettoyer vieux backups (garder 7 derniers)
echo -e "${YELLOW}🧹 Nettoyage vieux backups...${NC}"
cd "$BACKUP_DIR"
ls -t ${PROJECT_NAME}-*.tar.gz | tail -n +8 | xargs -r rm
BACKUP_COUNT=$(ls -1 ${PROJECT_NAME}-*.tar.gz 2>/dev/null | wc -l)
echo -e "${GREEN}✅ ${BACKUP_COUNT} backups conservés${NC}"

# 5. Résumé
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ BACKUP TERMINÉ${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "Fichier: ${PROJECT_NAME}-${TIMESTAMP}.tar.gz"
echo "Taille: ${BACKUP_SIZE}"
echo "Localisation:"
echo "  - Local: $BACKUP_DIR/"
[ -d "/mnt/aidrive" ] && echo "  - AI Drive: $AIDRIVE_DIR/"
echo ""
echo "Restauration:"
echo "  tar -xzf backups/${PROJECT_NAME}-${TIMESTAMP}.tar.gz"
echo ""
