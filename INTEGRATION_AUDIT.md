# 📊 INTÉGRATION AUDIT EL → DESIGNER LAYOUT

## 🎯 Objectif
Permettre au **Designer Layout** de charger automatiquement les données d'un audit existant (strings, modules, défauts) pour placement sur carte satellite.

## 📁 Structure du Projet

### Fichiers Version Production (INTACTE)
```
src/index.tsx                    ← Version prod actuelle (rectangles orientés)
vite.config.ts                   ← Build version prod
ecosystem.config.cjs             ← PM2 config prod (port 3000)
dist/                            ← Build prod
```

### Fichiers Version Test Audit (PARALLÈLE)
```
src/index-with-audit.tsx         ← Version avec intégration audit
vite.config.audit.ts             ← Build version audit test
dist-audit/                      ← Build audit (séparé)
```

## 🔧 Commandes NPM

### Version Production (actuelle, stable)
```bash
npm run build              # Build version prod
npm run preview            # Test local prod
pm2 start ecosystem.config.cjs   # Démarrer prod (port 3000)
```

### Version Audit Test (développement)
```bash
npm run build:audit        # Build version avec audit
npm run preview:audit      # Test local audit (port 3002)
```

## 📊 Fonctionnalités Version Audit

### 1. **Sélecteur de Source**
```
┌────────────────────────────────────────┐
│ Source données : [v]                   │
│   ○ Configuration Manuelle (défaut)    │
│   ○ Charger depuis Audit EL            │
└────────────────────────────────────────┘
```

### 2. **Mode MANUEL** (comme avant)
- Configuration strings/modules/BJ manuelle
- Placement avec IDs génériques (S1-1, S2-3, etc.)
- Couleurs par défaut

### 3. **Mode AUDIT** (nouveau)
- Chargement depuis `localStorage.getItem('diagpv_audit_session')`
- IDs réels depuis audit (ex: JALIBAT → 242 modules)
- Couleurs selon statuts défauts (vert=OK, rouge=défaut)
- Support strings variables (S1=26 modules, S2-S10=24 modules)

## 🧪 Comment Tester

### Étape 1 : Build Version Audit
```bash
cd /home/user/diagnostic-hub
npm run build:audit
```

### Étape 2 : Vérifier le Build
```bash
ls -lh dist-audit/_worker.mjs
# Devrait afficher ~350 KB
```

### Étape 3 : Tester avec Wrangler
```bash
# Terminal 1 : Version PROD (port 3000)
pm2 start ecosystem.config.cjs

# Terminal 2 : Version AUDIT TEST (port 3002)
npx wrangler pages dev dist-audit --ip 0.0.0.0 --port 3002
```

### Étape 4 : Accéder aux Versions
- **Production** : http://localhost:3000 (ou URL sandbox)
- **Audit Test** : http://localhost:3002

## 📋 Tests à Réaliser

### Test 1 : Mode Manuel (doit fonctionner comme avant)
1. Ouvrir version audit test (port 3002)
2. Garder "Configuration Manuelle" sélectionnée
3. Configurer : 10 strings × 24 modules
4. Dessiner rectangle orientable
5. Placer modules
6. ✅ Vérifier : 240 modules placés avec IDs S1-1, S2-3, etc.

### Test 2 : Mode Audit (nouvelle fonctionnalité)
1. Aller sur le module Audit EL (version prod)
2. Créer/ouvrir audit JALIBAT (10 strings, 242 modules)
3. Revenir sur Designer (version audit test - port 3002)
4. Sélectionner "Charger depuis Audit EL"
5. ✅ Vérifier affichage résumé :
   - Projet : JALIBAT
   - Strings : 10
   - Modules : 242
6. Dessiner rectangle orientable
7. Placer modules
8. ✅ Vérifier :
   - 242 modules placés (pas 240)
   - IDs réels depuis audit
   - Couleurs selon défauts

## 🔀 Fusion des Versions

### Quand Version Audit Validée
```bash
# Sauvegarder prod actuelle
cp src/index.tsx src/index_backup_$(date +%Y%m%d_%H%M%S).tsx

# Remplacer par version audit
cp src/index-with-audit.tsx src/index.tsx

# Build et test
npm run build
pm2 restart all

# Test complet
curl http://localhost:3000
```

### Si Problème Détecté
```bash
# Restaurer version prod
git checkout src/index.tsx

# Rebuild
npm run build
pm2 restart all
```

## 📝 Structure Données Audit Attendue

```javascript
// LocalStorage key: 'diagpv_audit_session'
{
  "project": {
    "name": "JALIBAT",
    "address": "...",
    "installationDate": "..."
  },
  "strings": [
    {
      "stringNumber": 1,
      "name": "STRING 1",
      "modulesCount": 26,  // Variable !
      "modules": [
        {
          "id": "S1-1",
          "position": 1,
          "status": "ok",        // "ok" | "defect" | "warning"
          "defects": []          // Array de défauts
        },
        { "id": "S1-2", "position": 2, "status": "defect", "defects": ["microfissure"] }
        // ... 26 modules pour S1
      ]
    },
    {
      "stringNumber": 2,
      "modulesCount": 24,  // String 2-10 ont 24 modules
      "modules": [ /* ... */ ]
    }
    // ... strings 3-10
  ],
  "totalModules": 242  // Calculé automatiquement
}
```

## ⚠️ Points d'Attention

1. **Ne PAS déployer version audit** tant qu'elle n'est pas validée
2. **Version prod reste intacte** sur port 3000
3. **Tester mode Manuel d'abord** pour vérifier non-régression
4. **Vérifier couleurs** selon statuts modules
5. **Support strings variables** (S1=26, autres=24)

## 🎨 Système de Couleurs

### Mode Manuel
- 🔵 Bleu : Module par défaut
- 🔴 Rouge : Défaut (si marqué manuellement)

### Mode Audit
- 🟢 Vert (`#10b981`) : Module conforme (`status: "ok"`)
- 🔴 Rouge (`#ef4444`) : Module défectueux (`status: "defect"` ou `defects.length > 0`)
- 🔵 Bleu (`#3b82f6`) : Statut inconnu

## 📞 Support

Si problème lors des tests :
1. Vérifier logs : `tail -f /tmp/audit-test.log`
2. Vérifier PM2 : `pm2 logs diagnostic-hub`
3. Restaurer version prod si nécessaire (voir section Fusion)

---

**Statut actuel** : ✅ Version prod stable sur port 3000  
**Version audit** : 🧪 Prête pour tests sur port 3002  
**Build** : ✅ OK (350.62 kB, gzip: 66.47 kB)
