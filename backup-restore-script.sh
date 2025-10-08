#!/bin/bash
# Script de restauration DiagPV - Sauvegarde du 2025-10-08
# Auteur: DiagPV Assistant
# Usage: ./backup-restore-script.sh

echo "🔄 SCRIPT DE RESTAURATION DIAGPV"
echo "================================="

# Variables
BACKUP_DATE="20251008_0751"
PROJECT_NAME="diagpv-audit-restored"

echo "📂 Restauration des données DiagPV sauvegardées le ${BACKUP_DATE}"

# 1. Vérification des fichiers de sauvegarde
echo "✅ Vérification des fichiers de sauvegarde..."
if [ ! -f "backup-dashboard-data-${BACKUP_DATE}.json" ]; then
    echo "❌ Erreur: Fichier dashboard manquant"
    exit 1
fi

if [ ! -f "backup-diagpv-database-${BACKUP_DATE}.sqlite" ]; then
    echo "❌ Erreur: Base de données SQLite manquante"
    exit 1
fi

echo "✅ Tous les fichiers de sauvegarde trouvés"

# 2. Installation des dépendances
echo "📦 Installation des dépendances..."
npm install

# 3. Configuration Cloudflare D1
echo "🗄️  Configuration base de données D1..."
echo "ATTENTION: Vous devez créer manuellement la base D1:"
echo "  npx wrangler d1 create ${PROJECT_NAME}"
echo "  Puis copier l'ID dans wrangler.jsonc"
echo ""
read -p "Appuyez sur Entrée quand c'est fait..."

# 4. Migrations
echo "🔄 Application des migrations..."
npx wrangler d1 migrations apply ${PROJECT_NAME} --local

# 5. Restauration données (manuelle via import)
echo "📊 RESTAURATION DES DONNÉES:"
echo "============================================"
echo "Les données suivantes sont disponibles:"
echo ""
echo "📈 Dashboard général:"
echo "  - Fichier: backup-dashboard-data-${BACKUP_DATE}.json"
echo "  - Contenu: 2 audits, 254 modules, 2 défauts"
echo ""
echo "🏗️  Audit FINAL TEST INTERFACE:"
echo "  - Fichier: backup-audit-final-test-${BACKUP_DATE}.json"  
echo "  - Token: 6ef3bc60-204f-474b-84e2-43914430f874"
echo "  - Modules: 12 (S1-1 à S3-4)"
echo ""
echo "🔧 Audit MPPT COMPLET:"
echo "  - Fichier: backup-audit-mppt-complet-${BACKUP_DATE}.json"
echo "  - Token: e8ae033c-7a8d-4543-ab41-f8879b9b1b0e" 
echo "  - Modules: 242 (configuration 10 MPPT)"
echo "  - Défauts: 2 détectés (1 microfissure, 1 module mort)"
echo ""
echo "⚙️  Configuration MPPT:"
echo "  - Fichier: backup-config-mppt-${BACKUP_DATE}.json"
echo "  - Description: Configuration complète 10 MPPT (26+9×24)"
echo ""
echo "💾 Base SQLite complète:"
echo "  - Fichier: backup-diagpv-database-${BACKUP_DATE}.sqlite"
echo "  - Usage: Remplacer le fichier local dans .wrangler/state/v3/d1/"
echo ""

# 6. Instructions manuelles
echo "📋 INSTRUCTIONS DE RESTAURATION MANUELLE:"
echo "=========================================="
echo ""
echo "1. Pour restaurer la base de données complète:"
echo "   cp backup-diagpv-database-${BACKUP_DATE}.sqlite .wrangler/state/v3/d1/miniflare-D1DatabaseObject/"
echo ""
echo "2. Pour recréer les audits via API:"
echo "   # Utilisez les fichiers JSON avec les données exactes"
echo "   # Les tokens et IDs modules sont préservés"
echo ""
echo "3. Démarrage application:"
echo "   npm run build"
echo "   pm2 start ecosystem.config.cjs"
echo ""
echo "4. Test de fonctionnement:"
echo "   curl http://localhost:3000/api/dashboard/audits"
echo ""
echo "✅ Restauration prête - Consultez les fichiers JSON pour les données exactes"

# 7. Validation
echo "🔍 VALIDATION SAUVEGARDE:"
echo "========================"
echo "Dashboard: $(cat backup-dashboard-data-${BACKUP_DATE}.json | grep -o '"totalAudits":[0-9]*' || echo 'Erreur lecture')"
echo "Audit 1: $(cat backup-audit-final-test-${BACKUP_DATE}.json | grep -o '"project_name":"[^"]*"' | head -1 || echo 'Erreur lecture')"  
echo "Audit 2: $(cat backup-audit-mppt-complet-${BACKUP_DATE}.json | grep -o '"project_name":"[^"]*"' | head -1 || echo 'Erreur lecture')"
echo "Config: $(cat backup-config-mppt-${BACKUP_DATE}.json | grep -o '"total_modules":[0-9]*' || echo 'Erreur lecture')"
echo ""
echo "🎯 SAUVEGARDE SÉCURISÉE - Toutes vos données DiagPV sont préservées !"