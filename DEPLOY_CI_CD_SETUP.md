# 🚀 Configuration CI/CD - Déploiement 100% Cloud (0 Local)

## ✅ OBJECTIF

**Build + Deploy automatique vers Cloudflare Pages** via GitHub Actions  
→ **AUCUN `npm run build` local requis**

---

## 📋 PRÉREQUIS (5 minutes)

### **1️⃣ Obtenir ton Cloudflare API Token**

1. Va sur **https://dash.cloudflare.com/profile/api-tokens**
2. Clique **"Create Token"**
3. Utilise le template **"Edit Cloudflare Workers"**
4. **OU** crée un token custom avec ces permissions :
   - `Account` → `Cloudflare Pages` → `Edit`
   - `Zone` → `Workers Scripts` → `Edit` (optionnel)
5. Clique **"Continue to summary"** → **"Create Token"**
6. **COPIE LE TOKEN** (il ne sera affiché qu'une fois)

---

### **2️⃣ Obtenir ton Cloudflare Account ID**

1. Va sur **https://dash.cloudflare.com**
2. Sélectionne ton compte
3. L'**Account ID** est visible dans l'URL ou dans la sidebar droite
4. Format : `1234567890abcdef1234567890abcdef`

---

## ⚙️ CONFIGURATION GITHUB SECRETS (2 minutes)

### **Étape 1 : Aller dans GitHub**

1. Va sur **https://github.com/ton-username/Diagnostic-pv**
2. Clique **Settings** (en haut à droite)
3. Dans la sidebar gauche → **Secrets and variables** → **Actions**

### **Étape 2 : Ajouter les secrets**

Clique **"New repository secret"** et ajoute :

#### **Secret 1 : CLOUDFLARE_API_TOKEN**
```
Name: CLOUDFLARE_API_TOKEN
Value: [COLLE TON API TOKEN ICI]
```

#### **Secret 2 : CLOUDFLARE_ACCOUNT_ID**
```
Name: CLOUDFLARE_ACCOUNT_ID
Value: [COLLE TON ACCOUNT ID ICI]
```

Clique **"Add secret"** pour chaque.

---

## 🚀 DÉPLOIEMENT AUTOMATIQUE

### **Méthode 1 : Push sur `main` (automatique)**

```bash
# Dans le Sandbox E2B (ou n'importe où avec Git)
cd /home/user/webapp
git add .
git commit -m "Deploy via CI/CD"
git push origin main
```

→ **GitHub Actions build + deploy automatiquement**  
→ **Accessible sur https://diagnostic-hub.pages.dev après ~3 minutes**

---

### **Méthode 2 : Déclenchement manuel**

1. Va sur **https://github.com/ton-username/Diagnostic-pv/actions**
2. Clique sur le workflow **"Build & Deploy to Cloudflare Pages"**
3. Clique **"Run workflow"** → **"Run workflow"**

---

## 📊 VÉRIFIER LE DÉPLOIEMENT

### **1. Logs GitHub Actions**
```
https://github.com/ton-username/Diagnostic-pv/actions
```

### **2. Cloudflare Dashboard**
```
https://dash.cloudflare.com → Pages → diagnostic-hub
```

### **3. Production URL**
```
https://diagnostic-hub.pages.dev
```

---

## 🎯 URLS ACTIVES APRÈS DÉPLOIEMENT

| Page | URL |
|------|-----|
| **Dashboard** | `https://diagnostic-hub.pages.dev/` |
| **CRM** | `https://diagnostic-hub.pages.dev/crm` |
| **Module Thermographie** | `https://diagnostic-hub.pages.dev/audit/thermique/abc123` |
| **Fin d'Audit** | `https://diagnostic-hub.pages.dev/audit/abc123/complete` |
| **Rapport PDF Print** | `https://diagnostic-hub.pages.dev/rapport/print/abc123` |
| **Planning** | `https://diagnostic-hub.pages.dev/planning` |
| **Analytics** | `https://diagnostic-hub.pages.dev/analytics` |

---

## ⚡ AVANTAGES CI/CD

✅ **0 installation locale** (build sur GitHub Actions)  
✅ **Deploy auto sur `git push`**  
✅ **Logs centralisés** (GitHub Actions)  
✅ **Rollback facile** (Cloudflare Pages gardent historique)  
✅ **Tests E2E auto** (avant deploy si configuré)  

---

## 🛠️ COMMANDES UTILES

### **Forcer un redéploiement**
```bash
git commit --allow-empty -m "Trigger deploy"
git push origin main
```

### **Vérifier le statut**
```bash
# Via wrangler (optionnel)
npx wrangler pages deployment list --project-name diagnostic-hub
```

---

## 🚨 TROUBLESHOOTING

### **Erreur : "Unauthorized" dans GitHub Actions**
→ Vérifie que `CLOUDFLARE_API_TOKEN` est bien configuré dans GitHub Secrets

### **Erreur : "Project not found"**
→ Vérifie que le projet `diagnostic-hub` existe sur Cloudflare Pages  
→ Ou crée-le via `npx wrangler pages project create diagnostic-hub`

### **Build timeout (>15 min)**
→ Le workflow est configuré pour 15 min max  
→ Si build trop long, contacte GitHub Support pour augmenter limite

---

## ✅ VALIDATION FINALE

Après deploy, teste ces URLs :

```bash
curl https://diagnostic-hub.pages.dev/api/crm/clients
curl https://diagnostic-hub.pages.dev/api/thermique/stats/abc123
```

---

## 📞 SUPPORT

- **GitHub Actions Logs** : https://github.com/ton-username/Diagnostic-pv/actions
- **Cloudflare Logs** : https://dash.cloudflare.com → Pages → diagnostic-hub → Deployments
- **Wrangler CLI** : `npx wrangler pages --help`

---

**🎉 Fin de configuration - Déploiements 100% cloud activés !**
