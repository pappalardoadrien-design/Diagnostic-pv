# 🔒 RÈGLES ABSOLUES DE PROTECTION DU CODE

## 📅 Date : 24 Novembre 2025

## ⚠️ CONTEXTE

Le module **PV CARTOGRAPHY** (592 lignes, développé sur plusieurs jours) a été perdu puis récupéré après 3h de recherche. **Ceci ne doit JAMAIS se reproduire.**

---

## ❌ **INTERDIT ABSOLU**

### 1. Supprimer du code sans accord explicite
- **JAMAIS** supprimer de fichiers
- **JAMAIS** commenter du code "inutilisé"
- **JAMAIS** "nettoyer" sans validation

### 2. Refactoriser sans demander
- **JAMAIS** restructurer modules existants
- **JAMAIS** renommer fichiers/dossiers
- **JAMAIS** changer architecture

### 3. Remplacer des fonctionnalités
- **JAMAIS** remplacer code qui fonctionne
- **JAMAIS** "améliorer" sans accord
- **JAMAIS** modifier routes API

### 4. Migrations/Schémas DB
- **JAMAIS** DROP tables en production
- **JAMAIS** modifier schéma sans backup
- **JAMAIS** supprimer colonnes

---

## ✅ **PROCESSUS OBLIGATOIRE**

### AVANT toute modification :

#### 1. DEMANDER CONFIRMATION
```
"Je vois du code [X]. Il semble [Y].
Options :
  A) Le garder tel quel
  B) Le modifier (détails...)
  C) Le supprimer
  
Quelle option choisis-tu ?"
```

#### 2. CRÉER BACKUP
```bash
# Backup fichier
cp src/module.ts src/module.ts.backup-$(date +%Y%m%d)

# Backup dossier
cp -r src/modules/old/ src/modules/old.backup-$(date +%Y%m%d)/
```

#### 3. GIT COMMIT AVANT
```bash
git add .
git commit -m "checkpoint: Avant modification [description]"
```

#### 4. DOCUMENTER
Créer `CHANGES.md` :
```markdown
## [Date] - Modification [Module]

**CE QUI EXISTAIT** :
- Fichier X (Y lignes)
- Fonctionnalité Z

**CE QUI CHANGE** :
- Raison : ...
- Impact : ...

**ROLLBACK** :
- Commande : git revert [hash]
- Fichiers backup : [chemins]
```

---

## 🛡️ **PROTECTION AUTOMATIQUE**

### 1. Backup automatique avant build
```json
// package.json
{
  "scripts": {
    "prebuild": "npm run backup",
    "backup": "tar -czf backups/backup-$(date +%Y%m%d-%H%M%S).tar.gz src/ public/ migrations/",
    "build": "vite build"
  }
}
```

### 2. Git hooks
```bash
# .git/hooks/pre-commit
#!/bin/bash
# Vérifier suppressions importantes
git diff --cached --name-status | grep '^D' | grep -E '\.(ts|tsx|html|sql)$' && {
  echo "⚠️  ATTENTION: Fichiers supprimés détectés"
  echo "Confirmer la suppression ? (y/N)"
  read -r response
  [[ "$response" != "y" ]] && exit 1
}
```

### 3. Snapshot quotidien
```bash
# Cron job (à configurer)
0 2 * * * cd /home/user/webapp && tar -czf /mnt/aidrive/snapshots/webapp-$(date +%Y%m%d).tar.gz .
```

---

## 📦 **STRUCTURE BACKUPS**

```
/home/user/webapp/
├── backups/                    # Backups automatiques
│   ├── 2025-11-24-083000.tar.gz
│   └── 2025-11-24-140000.tar.gz
├── .backup/                    # Backups manuels
│   ├── pv-module-before-refactor/
│   └── api-routes-before-unification/
└── DELETED_CODE/              # Code supprimé (archive)
    ├── 2025-11-24-old-auth.ts
    └── 2025-11-20-legacy-reports.tsx
```

---

## 🚨 **ALERTES OBLIGATOIRES**

### Avant toute action destructive :

#### Suppression fichier
```
🚨 SUPPRESSION DÉTECTÉE
Fichier: src/modules/pv/routes.ts (450 lignes)
Dernière modif: 2025-11-15

CONFIRMER SUPPRESSION ? (y/N)
> _
```

#### Refactoring
```
🔄 REFACTORING DÉTECTÉ
Module: src/modules/el/
Fichiers affectés: 12
Lignes totales: 4,580

APPROUVES-TU CE REFACTORING ? (y/N)
> _
```

#### Migration DB
```
⚠️  MIGRATION DESTRUCTIVE
Action: DROP TABLE pv_plants
Impact: Perte données 4 centrales, 242 modules

CONTINUER ? (y/N)
> _
```

---

## 📝 **CHECKLIST AVANT MODIFICATIONS**

Avant **TOUTE** modification de code existant :

- [ ] J'ai demandé confirmation à Adrien
- [ ] J'ai créé un backup du fichier/dossier
- [ ] J'ai fait un git commit "checkpoint"
- [ ] J'ai documenté les changements dans CHANGES.md
- [ ] Je connais la commande de rollback
- [ ] J'ai vérifié qu'aucune fonctionnalité n'est perdue

**SI UNE SEULE CASE N'EST PAS COCHÉE → STOP**

---

## 🔄 **ROLLBACK RAPIDE**

### Restaurer fichier supprimé
```bash
# Depuis Git
git checkout HEAD~1 -- src/fichier-supprimé.ts

# Depuis backup
cp .backup/fichier-supprimé.ts src/
```

### Annuler dernier commit
```bash
git revert HEAD
# OU
git reset --hard HEAD~1  # ⚠️ Destructif
```

### Restaurer depuis backup tar
```bash
tar -xzf backups/backup-20251124.tar.gz -C /tmp/restore/
cp -r /tmp/restore/src/ ./src/
```

---

## 📞 **EN CAS DE PERTE**

### Actions immédiates :

1. **STOP tout développement**
2. **Chercher dans** :
   - Git history : `git log --all --grep="[mot-clé]"`
   - Backups : `ls -lah backups/`
   - AI Drive : `/mnt/aidrive/`
   - Cloudflare déploiements : `wrangler pages deployment list`
   - Autres projets Pages : `wrangler pages project list`

3. **Documenter la perte** :
   - Quoi ? (fichier, module, fonction)
   - Quand ? (dernier vu)
   - Où ? (dernier commit connu)

4. **Récupération** :
   - Déploiements Cloudflare (`curl https://[deploy-id].pages.dev/`)
   - Git reflog : `git reflog`
   - Fichiers `.backup/`

---

## 🎯 **ENGAGEMENT**

**Je m'engage à :**
1. ✅ **JAMAIS supprimer** sans accord explicite
2. ✅ **TOUJOURS demander** avant modifications
3. ✅ **CRÉER backups** systématiquement
4. ✅ **DOCUMENTER** tous les changements
5. ✅ **PROTÉGER** le code existant comme un trésor

**Adrien, tu as ma parole : plus AUCUNE perte de code désormais ! 🔒**

---

**Signature** : Claude Code Assistant  
**Date** : 24 Novembre 2025  
**Commit** : À venir
