# 🔍 AUDIT COMPLET - Inventaire GitHub + Cloudflare + Code

**Date**: 2025-12-08 15:05 UTC  
**Objectif**: Identifier TOUT ce qui existe et ce qui est obsolète

---

## 📦 **1. REPOSITORIES GITHUB (5 projets trouvés)**

| Repository | Visibilité | Dernière MAJ | Status | Action |
|------------|------------|--------------|--------|--------|
| **Diagnostic-pv** | Public | 2025-12-08 | ✅ **ACTIF - PRINCIPAL** | ✅ **GARDER** |
| DiagPVv2 | Public | 2025-12-01 | ❓ Inconnu | ⚠️ **VÉRIFIER/ARCHIVER** |
| DiagnosticEL | Public | 2025-10-27 | ❓ Ancien | 🗑️ **ARCHIVER OU SUPPRIMER** |
| auditELPV | Public | 2025-10-24 | ❓ Ancien | 🗑️ **ARCHIVER OU SUPPRIMER** |
| diagpv-platform | Public | 2025-09-30 | ❓ Ancien | 🗑️ **ARCHIVER OU SUPPRIMER** |

### **📍 Repository ACTIF**
```
Nom: pappalardoadrien-design/Diagnostic-pv
URL: https://github.com/pappalardoadrien-design/Diagnostic-pv
Remote: origin (configuré)
Branches: main, feature/unified-platform
```

---

## 🌐 **2. PROJETS CLOUDFLARE PAGES**

### **Projet Actif (d'après le code)**
| Nom | Status | URL | Configuré dans |
|-----|--------|-----|----------------|
| **diagnostic-hub** | ✅ LIVE | https://diagnostic-hub.pages.dev | GitHub Actions, wrangler.jsonc |

### **Projet Mentionné (d'après Dashboard)**
| Nom | Status | URL | Notes |
|-----|--------|-----|-------|
| **diagnostic-pv** | ❓ À vérifier | https://diagnostic-pv.pages.dev | Visible dans Dashboard Cloudflare |

### **⚠️ INCOHÉRENCE DÉTECTÉE**
- Code déploie sur: `diagnostic-hub`
- Dashboard montre: `diagnostic-pv`
- **Question**: S'agit-il de 2 projets différents ou du même projet renommé ?

---

## 📝 **3. NOMS DE PROJETS DANS LE CODE (Incohérences)**

### **wrangler.jsonc**
```jsonc
"name": "diagnostic-hub"
"database_name": "diagnostic-hub-production"
"bucket_name": "diagpv-el-photos"
```

### **package.json**
```json
"name": "diagpv-audit"
"deploy:prod": "wrangler pages deploy dist --project-name diagpv-audit"
"dev:d1": "wrangler pages dev dist --d1=diagpv-audit-production --local"
```

### **.github/workflows/deploy.yml**
```yaml
command: pages deploy dist --project-name diagnostic-hub
BASE_URL: https://diagnostic-hub.pages.dev
```

### **README.md**
```markdown
Production: https://diagnostic-hub.pages.dev
```

### **meta_info**
```
cloudflare_project_name: "diagnostic-hub"
```

---

## 🎯 **4. INCOHÉRENCES DÉTECTÉES**

| Fichier | Nom Projet | Nom BDD | Notes |
|---------|------------|---------|-------|
| wrangler.jsonc | `diagnostic-hub` | `diagnostic-hub-production` | ✅ Cohérent |
| package.json | `diagpv-audit` | `diagpv-audit-production` | ❌ **INCOHÉRENT** |
| deploy.yml | `diagnostic-hub` | - | ✅ Cohérent |
| README.md | `diagnostic-hub` | - | ✅ Cohérent |
| meta_info | `diagnostic-hub` | - | ✅ Cohérent |

### **⚠️ PROBLÈME PRINCIPAL**
Le `package.json` utilise **des noms différents** (`diagpv-audit`) alors que tout le reste utilise `diagnostic-hub`.

---

## 🗑️ **5. ÉLÉMENTS OBSOLÈTES À NETTOYER**

### **A. Dans package.json**
```json
❌ "name": "diagpv-audit"              → Changer en "diagnostic-hub"
❌ "deploy:prod": "...diagpv-audit"    → Changer en "diagnostic-hub"
❌ "dev:d1": "...diagpv-audit-prod"    → Changer en "diagnostic-hub-production"
❌ "db:migrate:*": "diagpv-audit-..."  → Changer en "diagnostic-hub-production"
❌ "db:console:*": "diagpv-audit-..."  → Changer en "diagnostic-hub-production"
```

### **B. Sur GitHub**
```
⚠️ DiagPVv2              → Vérifier utilité / Archiver si obsolète
🗑️ DiagnosticEL          → Archiver ou Supprimer (remplacé par Diagnostic-pv)
🗑️ auditELPV             → Archiver ou Supprimer (ancien)
🗑️ diagpv-platform       → Archiver ou Supprimer (ancien)
```

### **C. Sur Cloudflare**
```
❓ diagnostic-pv         → Vérifier si doublon de diagnostic-hub
                           Si oui: Supprimer pour éviter confusion
```

### **D. Branches Git**
```
❓ feature/unified-platform → Vérifier si merger dans main ou supprimer
```

---

## ✅ **6. PLAN DE NETTOYAGE RECOMMANDÉ**

### **PRIORITÉ 1 : Uniformiser les noms dans le code (5 min)**

**Standardiser sur "diagnostic-hub"** (car déjà déployé et fonctionnel)

#### **Modifications à faire:**

**1. package.json**
```json
// AVANT
"name": "diagpv-audit",
"deploy:prod": "npm run build && wrangler pages deploy dist --project-name diagpv-audit",
"dev:d1": "wrangler pages dev dist --d1=diagpv-audit-production --local --ip 0.0.0.0 --port 3000",
"db:migrate:local": "wrangler d1 migrations apply diagpv-audit-production --local",
"db:migrate:prod": "wrangler d1 migrations apply diagpv-audit-production",
"db:seed": "wrangler d1 execute diagpv-audit-production --local --file=./seed.sql",
"db:console:local": "wrangler d1 execute diagpv-audit-production --local",
"db:console:prod": "wrangler d1 execute diagpv-audit-production"

// APRÈS
"name": "diagnostic-hub",
"deploy:prod": "npm run build && wrangler pages deploy dist --project-name diagnostic-hub",
"dev:d1": "wrangler pages dev dist --d1=diagnostic-hub-production --local --ip 0.0.0.0 --port 3000",
"db:migrate:local": "wrangler d1 migrations apply diagnostic-hub-production --local",
"db:migrate:prod": "wrangler d1 migrations apply diagnostic-hub-production",
"db:seed": "wrangler d1 execute diagnostic-hub-production --local --file=./seed.sql",
"db:console:local": "wrangler d1 execute diagnostic-hub-production --local",
"db:console:prod": "wrangler d1 execute diagnostic-hub-production"
```

---

### **PRIORITÉ 2 : Nettoyer GitHub (10 min)**

#### **Option A : Archiver les anciens repos**
```bash
# Pour chaque ancien repo:
gh repo archive pappalardoadrien-design/DiagnosticEL
gh repo archive pappalardoadrien-design/auditELPV
gh repo archive pappalardoadrien-design/diagpv-platform
```

#### **Option B : Supprimer définitivement**
```bash
# ⚠️ ATTENTION: Suppression définitive
gh repo delete pappalardoadrien-design/DiagnosticEL --confirm
gh repo delete pappalardoadrien-design/auditELPV --confirm
gh repo delete pappalardoadrien-design/diagpv-platform --confirm
```

#### **DiagPVv2 - À vérifier**
- Checker le contenu avant de décider
- Merger dans Diagnostic-pv si utile
- Sinon archiver

---

### **PRIORITÉ 3 : Nettoyer Cloudflare (5 min)**

**Sur Dashboard Cloudflare:**
1. Vérifier si "diagnostic-pv" est un projet séparé
2. Si oui et inutilisé: **Supprimer**
3. Garder uniquement "diagnostic-hub"

---

### **PRIORITÉ 4 : Nettoyer branches Git (2 min)**

```bash
# Vérifier feature/unified-platform
git diff main..feature/unified-platform

# Si merged ou obsolète:
git branch -D feature/unified-platform
git push origin --delete feature/unified-platform
```

---

## 🎯 **7. CONFIGURATION FINALE RECOMMANDÉE**

### **UN SEUL NOM PARTOUT: "diagnostic-hub"**

```
✅ GitHub Repo:           Diagnostic-pv (garder ce nom historique)
✅ Cloudflare Project:    diagnostic-hub
✅ wrangler.jsonc name:   diagnostic-hub
✅ package.json name:     diagnostic-hub
✅ Database D1:           diagnostic-hub-production
✅ KV Namespace:          diagnostic-hub-kv
✅ R2 Bucket:             diagpv-el-photos (OK, moins critique)
✅ meta_info:             diagnostic-hub
```

---

## 📋 **8. CHECKLIST VALIDATION**

Après nettoyage, vérifier:

- [ ] package.json utilise "diagnostic-hub" partout
- [ ] Tous les scripts npm fonctionnent
- [ ] CI/CD GitHub Actions fonctionne
- [ ] Déploiement Cloudflare OK
- [ ] Un seul projet Cloudflare Pages actif
- [ ] Anciens repos GitHub archivés/supprimés
- [ ] Branches Git obsolètes supprimées
- [ ] Documentation (README) à jour

---

## 🚨 **DÉCISIONS REQUISES DE L'UTILISATEUR**

1. **Nom final à garder?**
   - [ ] Option A: "diagnostic-hub" (recommandé - déjà déployé)
   - [ ] Option B: "diagnostic-pv" (nécessite migration)

2. **Anciens repos GitHub?**
   - [ ] Archiver (repos invisibles mais récupérables)
   - [ ] Supprimer définitivement (irréversible)

3. **DiagPVv2?**
   - [ ] Vérifier contenu d'abord
   - [ ] Merger dans Diagnostic-pv
   - [ ] Archiver/Supprimer

4. **Branch feature/unified-platform?**
   - [ ] Merger dans main
   - [ ] Supprimer si obsolète

---

**Prochaine étape**: Attendre validation utilisateur avant nettoyage
