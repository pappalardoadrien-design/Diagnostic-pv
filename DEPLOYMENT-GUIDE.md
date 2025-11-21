# 🚀 Guide de Déploiement - DiagPV Hub

## 📋 Prérequis

✅ Compte Cloudflare avec Pages activé  
✅ Wrangler CLI installé (`npm install -g wrangler`)  
✅ Token API Cloudflare configuré  
✅ Base de données D1 créée

---

## 🔐 Étape 1 : Configuration Cloudflare

### 1.1 Créer le projet Pages

```bash
cd /home/user/webapp

# Se connecter à Cloudflare
npx wrangler login

# Créer le projet (si première fois)
npx wrangler pages project create diagpv-hub \
  --production-branch main \
  --compatibility-date 2024-01-01
```

### 1.2 Créer la base de données D1

```bash
# Créer la base production
npx wrangler d1 create diagpv-production

# Copier le database_id affiché dans wrangler.jsonc
# Exemple : database_id = "abc123..."
```

**Éditer `wrangler.jsonc`** :
```jsonc
{
  "name": "diagpv-hub",
  "compatibility_date": "2024-01-01",
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "diagpv-production",
      "database_id": "VOTRE_DATABASE_ID_ICI"  // ⚠️ Remplacer
    }
  ]
}
```

### 1.3 Appliquer les migrations

```bash
# Appliquer TOUTES les migrations dans l'ordre
npx wrangler d1 migrations apply diagpv-production

# Vérifier que toutes les tables existent
npx wrangler d1 execute diagpv-production \
  --command="SELECT name FROM sqlite_master WHERE type='table'"
```

**Tables attendues** :
- `audits`, `modules`, `el_modules`, `iv_curves`
- `calepinage_layouts`, `module_positions`, `calepinage_cables`, `calepinage_zones`
- Etc. (voir toutes les migrations)

---

## 🔨 Étape 2 : Build et déploiement

### 2.1 Build local

```bash
cd /home/user/webapp

# Installer dépendances (si pas déjà fait)
npm install

# Build production
npm run build

# Vérifier que dist/ contient _worker.js
ls -lh dist/
```

### 2.2 Déployer sur Cloudflare Pages

```bash
# Premier déploiement
npx wrangler pages deploy dist --project-name diagpv-hub

# Vous obtenez 2 URLs :
# - Production : https://diagpv-hub.pages.dev
# - Branch : https://main.diagpv-hub.pages.dev
```

### 2.3 Configurer variables d'environnement (optionnel)

```bash
# Ajouter des secrets si nécessaire
npx wrangler pages secret put API_KEY --project-name diagpv-hub

# Variables non-secrètes via dashboard Cloudflare Pages
# Settings → Environment Variables
```

---

## 🧪 Étape 3 : Tests post-déploiement

### 3.1 Vérifier l'API

```bash
# Remplacer par votre URL de production
export PROD_URL="https://diagpv-hub.pages.dev"

# Test API layouts
curl "$PROD_URL/api/calepinage/layouts"

# Devrait retourner : {"success":true,"layouts":[],"total":0}
```

### 3.2 Tester l'éditeur

Ouvrir dans navigateur :
```
https://diagpv-hub.pages.dev/api/calepinage/editor/TEST-001?module_type=el
```

Vérifier :
- ✅ Page se charge
- ✅ Sidebar avec outils visible
- ✅ Canvas avec grille
- ✅ Pas d'erreurs console

### 3.3 Créer un layout de test via API

```bash
curl -X POST "$PROD_URL/api/calepinage/layouts" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "TEST-001",
    "moduleType": "el",
    "layoutName": "Test Layout",
    "layout": {
      "viewBox": {"width": 2400, "height": 1200, "gridSize": 20},
      "modules": [
        {"identifier": "S1-1", "x": 100, "y": 100, "width": 60, "height": 35}
      ],
      "arrows": [],
      "zones": []
    }
  }'

# Devrait retourner : {"success":true,"layoutId":1,"message":"Layout créé"}
```

### 3.4 Vérifier le viewer

```bash
curl "$PROD_URL/api/calepinage/viewer/TEST-001?module_type=el"

# Devrait retourner du SVG commençant par :
# <?xml version="1.0" encoding="UTF-8"?>
# <svg xmlns="http://www.w3.org/2000/svg" ...
```

---

## 🔄 Étape 4 : Déploiements futurs

### Workflow standard

```bash
# 1. Développer localement
cd /home/user/webapp
npm run build
pm2 restart diagnostic-hub

# 2. Tester en sandbox
curl http://localhost:3000/api/calepinage/layouts

# 3. Commit git
git add .
git commit -m "feat: nouvelle fonctionnalité"

# 4. Déployer en production
npm run build
npx wrangler pages deploy dist --project-name diagpv-hub
```

### Déploiement automatique via GitHub (optionnel)

1. Pusher code sur GitHub
2. Connecter repo dans Cloudflare Pages Dashboard
3. Configurer build :
   - **Build command** : `npm run build`
   - **Build output directory** : `dist`
   - **Root directory** : `/`

4. Déploiement auto à chaque push sur `main`

---

## 🗄️ Étape 5 : Gestion base de données

### Backups réguliers

```bash
# Exporter data (via API custom ou wrangler)
npx wrangler d1 execute diagpv-production \
  --command="SELECT * FROM calepinage_layouts" \
  --json > backup-layouts-$(date +%Y%m%d).json
```

### Rollback migration (si problème)

```bash
# Lister migrations appliquées
npx wrangler d1 migrations list diagpv-production

# Rollback pas supporté directement par wrangler
# Solution : Supprimer table et réappliquer migrations précédentes
```

### Ajouter nouvelle migration

```bash
# Créer fichier dans migrations/
# Ex: migrations/0004_add_new_feature.sql

# Appliquer
npx wrangler d1 migrations apply diagpv-production
```

---

## 📊 Étape 6 : Monitoring

### Logs Cloudflare

Dashboard → Pages → diagpv-hub → Functions → Real-time logs

### Métriques importantes

- **Requêtes/jour** : Voir usage API
- **Erreurs 5xx** : Bugs backend
- **Latence P95** : Performance
- **Bandwidth** : Trafic réseau

### Alertes (optionnel)

Configurer notifications par email si :
- Taux erreur > 5%
- Latence > 2 secondes
- Downtime détecté

---

## 🐛 Dépannage

### Problème : "D1_ERROR: no such table"

**Cause** : Migrations non appliquées

**Solution** :
```bash
npx wrangler d1 migrations apply diagpv-production
```

### Problème : "CORS error" dans browser

**Cause** : CORS pas configuré pour domaine

**Solution** : Vérifier `src/index.tsx` ligne 50 :
```typescript
app.use('/api/*', cors({
  origin: ['http://localhost:3000', 'https://*.pages.dev', 'https://diagpv-hub.pages.dev'],
  credentials: true
}))
```

### Problème : Build échoue

**Cause** : Dépendances manquantes ou erreur TypeScript

**Solution** :
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Problème : Layout pas trouvé après sauvegarde

**Cause** : Mauvais `projectId` ou `module_type`

**Solution** :
```bash
# Lister tous les layouts
curl https://diagpv-hub.pages.dev/api/calepinage/layouts

# Vérifier projectId exact
```

---

## 🎯 Checklist finale

Avant de considérer le déploiement comme complet :

- [ ] Cloudflare Pages project créé
- [ ] Base D1 créée et migrations appliquées
- [ ] Build production réussi (`dist/_worker.js` existe)
- [ ] Premier déploiement effectué
- [ ] URL production accessible (https://diagpv-hub.pages.dev)
- [ ] API layouts fonctionne (GET /api/calepinage/layouts)
- [ ] Éditeur s'affiche correctement
- [ ] Layout de test créé et sauvé
- [ ] Viewer génère SVG correct
- [ ] Rapports EL contiennent liens éditeur/viewer
- [ ] Logs Cloudflare accessibles
- [ ] Domaine custom configuré (optionnel)

---

## 📞 Support

**En cas de problème** :
1. Vérifier logs Cloudflare Pages
2. Tester en local d'abord (pm2 + curl)
3. Comparer avec sandbox fonctionnel
4. Consulter documentation :
   - `CALEPINAGE-GUIDE-UTILISATEUR.md`
   - `CALEPINAGE-SYSTEM.md`
   - `CALEPINAGE-IMPLEMENTATION-SUMMARY.md`

**Contact** :  
Adrien PAPPALARDO  
Email : adrien@diagnosticphotovoltaique.fr  
Tél : 06 07 29 22 12

---

**Dernière mise à jour** : 2025-01-21  
**Version DiagPV** : 4.0.0  
**Module Calepinage** : 1.0.0
