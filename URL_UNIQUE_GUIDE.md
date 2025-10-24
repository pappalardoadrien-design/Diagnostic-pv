# 🌐 Guide URL Unique Production - Hub Diagnostic Photovoltaïque

## ✅ URL Production Unique

### **URL PRINCIPALE (À UTILISER)**
```
https://diagnostic-hub.pages.dev
```

**Cette URL unique remplace toutes les anciennes URLs suivantes :**
- ❌ `diagnostic-hub.pappalardoadrien.workers.dev` (Worker obsolète)
- ❌ `diagpv-test.pages.dev` (projet supprimé)
- ❌ `diagpv-platform.pages.dev` (projet supprimé)
- ❌ `diagpv-el-audit.pages.dev` (projet supprimé)
- ❌ Autres projets temporaires (tous supprimés)

---

## 🗺️ Structure URL Simplifiée

### **Pages Principales**
| Page | URL | Description |
|------|-----|-------------|
| 🏠 **Accueil Hub** | `https://diagnostic-hub.pages.dev/` | Dashboard principal |
| 📂 **Gestion Projets** | `https://diagnostic-hub.pages.dev/projects` | Liste tous projets |
| ➕ **Nouveau Projet** | `https://diagnostic-hub.pages.dev/projects/new` | Création projet |
| 👥 **Clients** | `https://diagnostic-hub.pages.dev/clients` | Base clients |
| 📋 **Liste Modules** | `https://diagnostic-hub.pages.dev/modules` | Tous modules dispo |

### **Modules Diagnostiques**
| Module | URL | Norme IEC |
|--------|-----|-----------|
| 🌙 **Électroluminescence** | `https://diagnostic-hub.pages.dev/modules/electroluminescence` | IEC 62446-1 |
| 🌡️ **Thermographie** | `https://diagnostic-hub.pages.dev/modules/thermography` | IEC 62446-3 |
| ⚡ **Courbes I-V** | `https://diagnostic-hub.pages.dev/modules/iv-curves` | IEC 60904-1 |
| 🔌 **Tests Isolement** | `https://diagnostic-hub.pages.dev/modules/isolation` | IEC 60364-6 |

### **API Endpoints**
| Endpoint | Méthode | Usage |
|----------|---------|-------|
| `/api/projects` | GET | Liste projets |
| `/api/projects/:id` | GET | Détails projet |
| `/api/projects/:id/report` | GET | Générer rapport HTML |
| `/api/sync-projects` | POST | Synchronisation locale→cloud |

---

## 🔧 Configuration Infrastructure

### **Cloudflare Pages Projects Actifs**
```bash
✅ diagnostic-hub          # Application principale (Hub)
✅ diagpv-audit           # Iframe module EL (intégré)
```

**Projets supprimés (nettoyage effectué) :**
```bash
❌ diagpv-test            # Supprimé
❌ diagpv-platform        # Supprimé
❌ diagpv-el-audit        # Supprimé
❌ project-c5dbecd8       # Supprimé
❌ project-5cdce233       # Supprimé
❌ project-55eabfeb       # Supprimé
❌ diagpv                 # Supprimé
```

### **Base de Données D1**
```jsonc
{
  "binding": "DB",
  "database_name": "diagnostic-hub-production",
  "database_id": "72be68d4-c5c5-4854-9ead-3bbcc131d199"
}
```

---

## 🚀 Tests Fonctionnels

### **Test Rapide URLs Principales**
```bash
# Test Hub principal
curl -I https://diagnostic-hub.pages.dev/

# Test page modules
curl -I https://diagnostic-hub.pages.dev/modules

# Test module EL
curl -I https://diagnostic-hub.pages.dev/modules/electroluminescence

# Test API projets
curl https://diagnostic-hub.pages.dev/api/projects
```

**Résultats attendus :** HTTP 200 OK sur toutes les routes

### **Vérification Boutons Header (Module EL)**
Les boutons suivants doivent fonctionner dans `https://diagnostic-hub.pages.dev/modules/electroluminescence` :

```html
<!-- Bouton retour Modules -->
<a href="/modules" class="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded-lg">
    <i class="fas fa-th mr-1"></i>Modules
</a>

<!-- Bouton retour Dashboard -->
<a href="/" class="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded-lg">
    <i class="fas fa-home mr-1"></i>Dashboard
</a>
```

**Si boutons ne fonctionnent pas :**
1. Ouvrir Console Développeur (F12)
2. Vérifier erreurs JavaScript
3. Tester en navigation privée (exclure cache/extensions)
4. Vérifier propriété CSS `pointer-events` non désactivée

---

## 🎯 Utilisation Quotidienne

### **Workflow Recommandé**

1. **Accès quotidien** : Bookmark `https://diagnostic-hub.pages.dev/`
2. **Création projet** :
   - Accueil → "Nouveau Projet"
   - Ou direct : `https://diagnostic-hub.pages.dev/projects/new`

3. **Lancement module EL** :
   - Depuis projet : clic bouton "Module EL"
   - Ou direct : `https://diagnostic-hub.pages.dev/modules/electroluminescence?project=8&name=JALIBAT`

4. **Génération rapport** :
   - Bouton "Rapport" dans fiche projet (projets synchronisés uniquement)
   - Téléchargement automatique HTML professionnel

---

## 🔐 Sécurité & Maintenance

### **Backup Automatique GitHub**
```bash
Repository : pappalardoadrien-design/Diagnostic-pv
Branch     : main
Auto-push  : Activé
```

### **Déploiements Cloudflare**
```bash
# Dernière version déployée
Deployment ID : b03f09bd
Date          : 2025-10-24
Version       : v3.4.0 (URL Unique)
```

### **Commandes Utiles**
```bash
# Vérifier projets Cloudflare actifs
npx wrangler pages project list

# Voir déploiements récents
npx wrangler pages deployment list

# Rollback si problème
npx wrangler pages deployment rollback <deployment-id>
```

---

## 📞 Support & Dépannage

### **Problème : Boutons header ne fonctionnent pas**
**Solution :**
1. Vider cache navigateur (Ctrl+Shift+R sur Chrome)
2. Tester navigation privée
3. Vérifier Console (F12) → onglet Console
4. Si erreur persistante : créer issue GitHub avec screenshot console

### **Problème : Ancienne URL Worker toujours active**
**Solution :** L'URL Worker (`diagnostic-hub.pappalardoadrien.workers.dev`) n'est **plus active**. Les déploiements Workers listés sont des artefacts historiques sans impact. Utiliser uniquement l'URL Pages.

### **Problème : Projet pas dans module EL**
**Solution :** Vérifier que projet est chargé avec paramètres URL :
```
https://diagnostic-hub.pages.dev/modules/electroluminescence?project=8&name=JALIBAT
```

### **Besoin Domaine Personnalisé ?**
Si vous souhaitez utiliser un domaine comme `hub.diagnosticphotovoltaique.fr` :
```bash
# Ajouter domaine custom
npx wrangler pages domain add hub.diagnosticphotovoltaique.fr \
  --project-name diagnostic-hub

# Configurer DNS (chez registrar domaine)
CNAME hub.diagnosticphotovoltaique.fr → diagnostic-hub.pages.dev
```

---

## 📊 Métriques Infrastructure

### **Performance Cloudflare Pages**
- ⚡ Déploiement global edge (300+ datacenters)
- 🚀 Latence < 50ms (Europe)
- 📦 Bundle size : ~2.5MB (gzip compressed)
- 🔄 Cache CDN automatique assets statiques

### **Limites Cloudflare (Plan Free)**
- ✅ 500 déploiements/mois
- ✅ Trafic illimité
- ✅ D1 : 100k lectures/jour
- ✅ D1 : 5GB stockage

---

## ✅ Checklist Migration Complète

- [x] 7 projets Cloudflare obsolètes supprimés
- [x] Worker deployment confirmé obsolète
- [x] URL unique `diagnostic-hub.pages.dev` active
- [x] README mis à jour avec nouvelle structure
- [x] Tests fonctionnels toutes routes OK
- [x] API endpoints opérationnels
- [x] GitHub synchronisé (commit 477f2e4)
- [x] Documentation utilisateur créée
- [ ] ⏳ Confirmation utilisateur boutons header (en attente)
- [ ] ⏳ Domaine personnalisé (optionnel)

---

**Date création guide :** 2025-10-24  
**Version application :** v3.4.0  
**Dernière mise à jour :** Simplification infrastructure URL unique  
**Contact :** Adrien Pappalardo - Business Developer Diagnostic Photovoltaïque
