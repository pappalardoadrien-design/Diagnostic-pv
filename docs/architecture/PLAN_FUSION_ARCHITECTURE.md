# 🏗️ PLAN FUSION ARCHITECTURE MONOLITHE - DiagPV Platform

**Date début** : 27 octobre 2025  
**Objectif** : Fusionner Module EL + HUB en une plateforme unifiée  
**Approche** : Points validables étape par étape

---

## 📊 Vue d'Ensemble

### État Actuel
- ✅ Module EL standalone : https://diagpv-audit.pages.dev (2685 lignes)
- ✅ HUB avec 6 modules UI : https://diagnostic-hub.pages.dev (6010 lignes)
- ✅ 2 bases D1 séparées : `diagpv-audit-production` + `diagnostic-hub-production`
- ✅ Données réelles : JALIBAT (242 modules), Les Forges (220 modules)

### État Cible
- 🎯 Plateforme unique : https://diagnostic-hub.pages.dev
- 🎯 Base D1 unifiée : `diagnostic-hub-production`
- 🎯 Module EL intégré : `/modules/el/*`
- 🎯 Prêt pour construction Courbes I-V, Visuels, Expertise

---

## 🚀 PHASE 1 : Préparation et Sécurisation (Session 1)

### ✅ POINT 1.1 : Backup Complet Production
**Durée** : 15 min  
**Validation** : Fichiers backup créés

**Actions** :
```bash
# Backup D1 Module EL
cd /home/user/webapp
npx wrangler d1 backup create diagpv-audit-production
npx wrangler d1 execute diagpv-audit-production --remote --command=".dump" > /tmp/el_backup.sql

# Backup D1 HUB
cd /home/user/diagnostic-hub
npx wrangler d1 backup create diagnostic-hub-production
npx wrangler d1 execute diagnostic-hub-production --remote --command=".dump" > /tmp/hub_backup.sql

# Vérifier présence données JALIBAT
grep "JALIBAT" /tmp/el_backup.sql
```

**Critères validation** :
- [ ] Backup D1 Module EL créé
- [ ] Backup D1 HUB créé
- [ ] Données JALIBAT présentes dans backup
- [ ] Données Les Forges présentes dans backup

---

### ✅ POINT 1.2 : Création Branche Git + Structure
**Durée** : 10 min  
**Validation** : Branche créée, structure dossiers OK

**Actions** :
```bash
cd /home/user/diagnostic-hub
git checkout -b feature/unified-platform
mkdir -p src/modules/electroluminescence
mkdir -p src/core/{clients,projects,users}
mkdir -p src/shared/{components,utils}
```

**Critères validation** :
- [ ] Branche `feature/unified-platform` créée
- [ ] Structure dossiers modules créée
- [ ] Git status clean

---

### ✅ POINT 1.3 : Export Données Production Module EL
**Durée** : 20 min  
**Validation** : Fichiers JSON avec données réelles créés

**Actions** :
```bash
# Export audits Module EL
cd /home/user/webapp
npx wrangler d1 execute diagpv-audit-production --remote \
  --command="SELECT * FROM audits" \
  --json > /tmp/export_audits.json

# Export modules JALIBAT
npx wrangler d1 execute diagpv-audit-production --remote \
  --command="SELECT * FROM modules WHERE audit_token='a4e19950-c73c-412c-be4d-699c9de1dde1'" \
  --json > /tmp/export_jalibat_modules.json

# Export modules Les Forges
npx wrangler d1 execute diagpv-audit-production --remote \
  --command="SELECT * FROM modules WHERE audit_token='76e6eb36-8b49-4255-99d3-55fc1adfc1c9'" \
  --json > /tmp/export_forges_modules.json

# Vérifier contenu
cat /tmp/export_jalibat_modules.json | jq '. | length'  # Doit afficher 242
cat /tmp/export_forges_modules.json | jq '. | length'   # Doit afficher 220
```

**Critères validation** :
- [ ] export_audits.json créé (4 audits)
- [ ] export_jalibat_modules.json créé (242 modules)
- [ ] export_forges_modules.json créé (220 modules)
- [ ] Statuts modules conservés (ok, dead, microcracks, inequality)

---

## 🏗️ PHASE 2 : Fusion Schéma D1 (Session 2)

### ✅ POINT 2.1 : Conception Schéma D1 Unifié
**Durée** : 30 min  
**Validation** : Fichier migration SQL créé

**Actions** :
```sql
-- diagnostic-hub/migrations/0005_merge_el_module.sql

-- Table projets (existe déjà dans HUB)
-- Pas de modification nécessaire

-- Ajouter champ module_type dans table audits existante
ALTER TABLE audits ADD COLUMN module_type TEXT DEFAULT 'other';
ALTER TABLE audits ADD COLUMN string_count INTEGER;
ALTER TABLE audits ADD COLUMN modules_per_string INTEGER;
ALTER TABLE audits ADD COLUMN total_modules INTEGER;
ALTER TABLE audits ADD COLUMN json_config TEXT;

-- Table modules EL (renommée pour éviter conflit avec HUB)
CREATE TABLE el_modules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  audit_id INTEGER NOT NULL,
  module_identifier TEXT NOT NULL,
  string_number INTEGER NOT NULL,
  position_in_string INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  comment TEXT,
  technician_id TEXT,
  physical_row INTEGER,
  physical_col INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (audit_id) REFERENCES audits(id),
  UNIQUE(audit_id, module_identifier)
);

CREATE INDEX idx_el_modules_audit ON el_modules(audit_id);
CREATE INDEX idx_el_modules_status ON el_modules(status);
CREATE INDEX idx_el_modules_string ON el_modules(string_number);

-- Table mesures PVserv
CREATE TABLE pvserv_measurements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  audit_id INTEGER NOT NULL,
  string_number INTEGER,
  module_number INTEGER,
  ff REAL,
  rds REAL,
  uf REAL,
  measurement_type TEXT,
  iv_curve_data TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (audit_id) REFERENCES audits(id)
);

CREATE INDEX idx_pvserv_audit ON pvserv_measurements(audit_id);

-- Table sessions collaboratives
CREATE TABLE collaborative_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  audit_id INTEGER NOT NULL,
  technician_id TEXT NOT NULL,
  last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT 1,
  FOREIGN KEY (audit_id) REFERENCES audits(id)
);

CREATE INDEX idx_sessions_audit ON collaborative_sessions(audit_id);
CREATE INDEX idx_sessions_active ON collaborative_sessions(is_active);
```

**Critères validation** :
- [ ] Fichier `migrations/0005_merge_el_module.sql` créé
- [ ] Schéma compatible avec données Module EL existantes
- [ ] Foreign keys vers `audits` configurées
- [ ] Index optimisés créés

---

### ✅ POINT 2.2 : Application Migration Locale
**Durée** : 15 min  
**Validation** : Migration appliquée en local sans erreur

**Actions** :
```bash
cd /home/user/diagnostic-hub

# Appliquer migration locale
npx wrangler d1 migrations apply diagnostic-hub-production --local

# Vérifier tables créées
npx wrangler d1 execute diagnostic-hub-production --local \
  --command="SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'el_%'"
```

**Critères validation** :
- [ ] Migration appliquée sans erreur
- [ ] Tables `el_modules`, `pvserv_measurements`, `collaborative_sessions` créées
- [ ] Index créés correctement

---

## 💾 PHASE 3 : Migration Données Production (Session 3)

### ✅ POINT 3.1 : Script Migration Données
**Durée** : 1h  
**Validation** : Script TypeScript créé et testé en local

**Actions** : Créer fichier `migrate-el-data.ts`

```typescript
// diagnostic-hub/migrate-el-data.ts
import { readFileSync } from 'fs'

interface OldAudit {
  id: number
  token: string
  project_name: string
  client_name: string
  location: string
  string_count: number
  modules_per_string: number
  total_modules: number
  status: string
  created_at: string
  json_config: string | null
}

interface OldModule {
  id: number
  audit_token: string
  module_id: string
  string_number: number
  position_in_string: number
  status: string
  comment: string | null
  physical_row: number | null
  physical_col: number | null
  created_at: string
}

// Charger exports JSON
const audits: OldAudit[] = JSON.parse(
  readFileSync('/tmp/export_audits.json', 'utf-8')
)[0].results

const jalibatModules: OldModule[] = JSON.parse(
  readFileSync('/tmp/export_jalibat_modules.json', 'utf-8')
)[0].results

const forgesModules: OldModule[] = JSON.parse(
  readFileSync('/tmp/export_forges_modules.json', 'utf-8')
)[0].results

// Générer SQL INSERT
console.log('-- Migration données Module EL vers HUB')
console.log('-- Généré le', new Date().toISOString())
console.log('')

// Map pour associer token -> nouveau audit_id
const tokenToAuditId: Record<string, number> = {}
let nextAuditId = 1000 // Commencer à 1000 pour éviter conflit

for (const audit of audits) {
  console.log(`-- Audit: ${audit.project_name}`)
  
  // 1. Créer projet si nécessaire
  console.log(`INSERT OR IGNORE INTO projects (name, site_address, module_count, created_at)`)
  console.log(`VALUES ('${audit.project_name}', '${audit.location}', ${audit.total_modules}, '${audit.created_at}');`)
  console.log('')
  
  // 2. Créer client si nécessaire
  console.log(`INSERT OR IGNORE INTO clients (name, created_at)`)
  console.log(`VALUES ('${audit.client_name}', '${audit.created_at}');`)
  console.log('')
  
  // 3. Créer audit dans nouvelle structure
  const projectId = `(SELECT id FROM projects WHERE name='${audit.project_name}' LIMIT 1)`
  
  console.log(`INSERT INTO audits (`)
  console.log(`  project_id, module_type, token, status,`)
  console.log(`  string_count, modules_per_string, total_modules,`)
  console.log(`  created_at, json_config`)
  console.log(`) VALUES (`)
  console.log(`  ${projectId}, 'el', '${audit.token}', '${audit.status}',`)
  console.log(`  ${audit.string_count}, ${audit.modules_per_string}, ${audit.total_modules},`)
  console.log(`  '${audit.created_at}', ${audit.json_config ? `'${audit.json_config}'` : 'NULL'}`)
  console.log(`);`)
  console.log('')
  
  tokenToAuditId[audit.token] = nextAuditId++
}

// 4. Migrer modules JALIBAT
console.log('-- Modules JALIBAT')
for (const module of jalibatModules) {
  const auditId = `(SELECT id FROM audits WHERE token='${module.audit_token}' LIMIT 1)`
  const comment = module.comment ? module.comment.replace(/'/g, "''") : null
  
  console.log(`INSERT INTO el_modules (`)
  console.log(`  audit_id, module_identifier, string_number, position_in_string,`)
  console.log(`  status, comment, physical_row, physical_col, created_at`)
  console.log(`) VALUES (`)
  console.log(`  ${auditId}, '${module.module_id}', ${module.string_number}, ${module.position_in_string},`)
  console.log(`  '${module.status}', ${comment ? `'${comment}'` : 'NULL'},`)
  console.log(`  ${module.physical_row || 'NULL'}, ${module.physical_col || 'NULL'}, '${module.created_at}'`)
  console.log(`);`)
}

console.log('')
console.log('-- Modules Les Forges')
for (const module of forgesModules) {
  const auditId = `(SELECT id FROM audits WHERE token='${module.audit_token}' LIMIT 1)`
  const comment = module.comment ? module.comment.replace(/'/g, "''") : null
  
  console.log(`INSERT INTO el_modules (`)
  console.log(`  audit_id, module_identifier, string_number, position_in_string,`)
  console.log(`  status, comment, physical_row, physical_col, created_at`)
  console.log(`) VALUES (`)
  console.log(`  ${auditId}, '${module.module_id}', ${module.string_number}, ${module.position_in_string},`)
  console.log(`  '${module.status}', ${comment ? `'${comment}'` : 'NULL'},`)
  console.log(`  ${module.physical_row || 'NULL'}, ${module.physical_col || 'NULL'}, '${module.created_at}'`)
  console.log(`);`)
}

console.log('')
console.log('-- Migration terminée')
console.log(`-- ${audits.length} audits migrés`)
console.log(`-- ${jalibatModules.length + forgesModules.length} modules migrés`)
```

**Exécuter** :
```bash
cd /home/user/diagnostic-hub
npx tsx migrate-el-data.ts > migrations/0006_import_el_data.sql
```

**Critères validation** :
- [ ] Script `migrate-el-data.ts` créé
- [ ] Fichier SQL généré `migrations/0006_import_el_data.sql`
- [ ] SQL contient INSERT pour 4 audits
- [ ] SQL contient INSERT pour 462 modules (242 JALIBAT + 220 Les Forges)
- [ ] Commentaires techniques préservés

---

### ✅ POINT 3.2 : Test Migration Locale
**Durée** : 30 min  
**Validation** : Données migrées en local, vérifications OK

**Actions** :
```bash
cd /home/user/diagnostic-hub

# Appliquer migration données en local
npx wrangler d1 execute diagnostic-hub-production --local \
  --file=migrations/0006_import_el_data.sql

# Vérifications
echo "=== Vérification audits ==="
npx wrangler d1 execute diagnostic-hub-production --local \
  --command="SELECT COUNT(*) as total FROM audits WHERE module_type='el'"

echo "=== Vérification modules JALIBAT ==="
npx wrangler d1 execute diagnostic-hub-production --local \
  --command="SELECT status, COUNT(*) as count FROM el_modules WHERE audit_id=(SELECT id FROM audits WHERE token='a4e19950-c73c-412c-be4d-699c9de1dde1') GROUP BY status"

echo "=== Vérification modules Les Forges ==="
npx wrangler d1 execute diagnostic-hub-production --local \
  --command="SELECT status, COUNT(*) as count FROM el_modules WHERE audit_id=(SELECT id FROM audits WHERE token='76e6eb36-8b49-4255-99d3-55fc1adfc1c9') GROUP BY status"
```

**Critères validation** :
- [ ] 4 audits type 'el' dans table audits
- [ ] JALIBAT: 58 OK, 2 microcracks, 182 dead
- [ ] Les Forges: 85 microcracks, 135 inequality
- [ ] Commentaires techniques présents

---

## 🔧 PHASE 4 : Restructuration Code Module EL (Session 4)

### ✅ POINT 4.1 : Copier Code Module EL
**Durée** : 20 min  
**Validation** : Code Module EL copié dans structure modulaire

**Actions** :
```bash
cd /home/user/diagnostic-hub

# Copier code source Module EL
cp /home/user/webapp/src/index.tsx src/modules/electroluminescence/routes-original.tsx

# Créer fichiers structure
touch src/modules/electroluminescence/routes.ts
touch src/modules/electroluminescence/types.ts
touch src/modules/electroluminescence/services.ts
```

**Critères validation** :
- [ ] Fichier `routes-original.tsx` copié (2685 lignes)
- [ ] Structure fichiers créée
- [ ] Code original préservé pour référence

---

### ✅ POINT 4.2 : Adapter Routes Module EL
**Durée** : 2h  
**Validation** : Routes adaptées au nouveau schéma D1

**Actions** : Modifier routes pour utiliser nouveau schéma

**Changements principaux** :
```typescript
// AVANT (Module EL standalone)
app.post('/api/audit/create', async (c) => {
  await env.DB.prepare(`
    INSERT INTO audits (token, project_name, client_name, ...)
  `).bind(...).run()
  
  await env.DB.prepare(`
    INSERT INTO modules (audit_token, module_id, ...)
  `).bind(...).run()
})

// APRÈS (Plateforme unifiée)
app.post('/api/el/audit/create', async (c) => {
  // 1. Récupérer project_id depuis request
  const { projectId } = await c.req.json()
  
  // 2. Créer audit avec lien projet
  const result = await env.DB.prepare(`
    INSERT INTO audits (
      project_id, module_type, token, 
      string_count, modules_per_string, total_modules,
      created_at, status
    ) VALUES (?, 'el', ?, ?, ?, ?, datetime('now'), 'created')
  `).bind(projectId, auditToken, ...).run()
  
  const auditId = result.meta.last_row_id
  
  // 3. Créer modules dans nouvelle table
  await env.DB.prepare(`
    INSERT INTO el_modules (
      audit_id, module_identifier, string_number, position_in_string,
      status, created_at
    ) VALUES (?, ?, ?, ?, 'pending', datetime('now'))
  `).bind(auditId, moduleId, ...).run()
})
```

**Mapping routes** :
- `GET /` → `GET /modules/el`
- `GET /audit/:token` → `GET /modules/el/audit/:token`
- `POST /api/audit/create` → `POST /api/el/audit/create`
- `GET /api/dashboard/audits` → `GET /api/el/audits`
- `POST /api/audit/:token/module/:id` → `POST /api/el/audit/:token/module/:id`

**Critères validation** :
- [ ] Routes préfixées par `/modules/el` ou `/api/el`
- [ ] Queries SQL utilisent `el_modules` au lieu de `modules`
- [ ] `audit_id` utilisé au lieu de `audit_token` dans queries
- [ ] Code compilable sans erreurs

---

### ✅ POINT 4.3 : Intégrer Routes dans Index Principal
**Durée** : 30 min  
**Validation** : Routes Module EL montées dans app principal

**Actions** :
```typescript
// diagnostic-hub/src/index.tsx

import { Hono } from 'hono'
import elRoutes from './modules/electroluminescence/routes'

const app = new Hono<{ Bindings: Bindings }>()

// Monter routes Module EL
app.route('/', elRoutes)

// Routes HUB existantes restent inchangées
app.get('/', (c) => { /* Dashboard HUB */ })
app.get('/modules', (c) => { /* Liste modules */ })
// ...

export default app
```

**Critères validation** :
- [ ] Import `elRoutes` fonctionnel
- [ ] Routes montées sans conflit
- [ ] Application compile sans erreur
- [ ] `npm run build` réussit

---

## 🧪 PHASE 5 : Tests Locaux (Session 5)

### ✅ POINT 5.1 : Build et Démarrage Local
**Durée** : 15 min  
**Validation** : Application démarre en local

**Actions** :
```bash
cd /home/user/diagnostic-hub

# Build
npm run build

# Démarrer avec PM2
fuser -k 3001/tcp 2>/dev/null || true
pm2 delete diagnostic-hub 2>/dev/null || true
pm2 start ecosystem.config.cjs --name diagnostic-hub

# Vérifier démarrage
sleep 3
curl http://localhost:3001/
```

**Critères validation** :
- [ ] Build réussit sans erreur
- [ ] Application démarre sur port 3001
- [ ] Page d'accueil accessible
- [ ] Pas d'erreurs dans logs PM2

---

### ✅ POINT 5.2 : Tests API Module EL Intégré
**Durée** : 30 min  
**Validation** : Toutes les routes Module EL fonctionnent

**Actions** :
```bash
# Test liste audits EL
curl http://localhost:3001/api/el/audits

# Test détails audit JALIBAT
curl "http://localhost:3001/api/el/audit/a4e19950-c73c-412c-be4d-699c9de1dde1"

# Test interface audit terrain
curl http://localhost:3001/modules/el/audit/a4e19950-c73c-412c-be4d-699c9de1dde1 | grep "JALIBAT"

# Test création audit
curl -X POST http://localhost:3001/api/el/audit/create \
  -H "Content-Type: application/json" \
  -d '{"projectId": 1, "projectName": "Test", "clientName": "Test Client", "location": "Test", "stringCount": 5, "modulesPerString": 20, "totalModules": 100}'
```

**Critères validation** :
- [ ] `/api/el/audits` retourne 4 audits dont JALIBAT et Les Forges
- [ ] Détails audit JALIBAT affichent 242 modules
- [ ] Interface terrain accessible avec données réelles
- [ ] Création audit fonctionne et retourne token

---

### ✅ POINT 5.3 : Tests Intégrité Données JALIBAT
**Durée** : 20 min  
**Validation** : Données JALIBAT intactes après migration

**Actions** :
```bash
cd /home/user/diagnostic-hub

# Compter modules par statut
npx wrangler d1 execute diagnostic-hub-production --local \
  --command="SELECT status, COUNT(*) FROM el_modules WHERE audit_id=(SELECT id FROM audits WHERE token='a4e19950-c73c-412c-be4d-699c9de1dde1') GROUP BY status"

# Vérifier présence commentaires
npx wrangler d1 execute diagnostic-hub-production --local \
  --command="SELECT COUNT(*) FROM el_modules WHERE audit_id=(SELECT id FROM audits WHERE token='a4e19950-c73c-412c-be4d-699c9de1dde1') AND comment IS NOT NULL"

# Comparer avec backup original
diff <(grep "JALIBAT" /tmp/el_backup.sql | wc -l) <(npx wrangler d1 execute diagnostic-hub-production --local --command="SELECT COUNT(*) FROM el_modules WHERE audit_id=(SELECT id FROM audits WHERE token='a4e19950-c73c-412c-be4d-699c9de1dde1')" | grep -oP '\d+')
```

**Critères validation** :
- [ ] 58 modules OK
- [ ] 2 modules microcracks
- [ ] 182 modules dead
- [ ] Commentaires techniques présents
- [ ] Total = 242 modules ✓

---

## 🚀 PHASE 6 : Migration Production (Session 6)

### ✅ POINT 6.1 : Application Migrations Production
**Durée** : 30 min  
**Validation** : Schéma production mis à jour

**Actions** :
```bash
cd /home/user/diagnostic-hub

# Appliquer migrations schéma
npx wrangler d1 migrations apply diagnostic-hub-production --remote

# Vérifier tables créées
npx wrangler d1 execute diagnostic-hub-production --remote \
  --command="SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'el_%'"
```

**Critères validation** :
- [ ] Migration 0005 appliquée sans erreur
- [ ] Tables `el_modules`, `pvserv_measurements` créées
- [ ] Colonnes ajoutées à `audits` (module_type, string_count, etc.)

---

### ✅ POINT 6.2 : Import Données Production
**Durée** : 45 min  
**Validation** : Données JALIBAT + Les Forges en production

**Actions** :
```bash
cd /home/user/diagnostic-hub

# Importer données
npx wrangler d1 execute diagnostic-hub-production --remote \
  --file=migrations/0006_import_el_data.sql

# Vérifications critiques
echo "=== Audits EL en production ==="
npx wrangler d1 execute diagnostic-hub-production --remote \
  --command="SELECT token, project_name, total_modules FROM audits WHERE module_type='el'"

echo "=== Modules JALIBAT ==="
npx wrangler d1 execute diagnostic-hub-production --remote \
  --command="SELECT status, COUNT(*) FROM el_modules WHERE audit_id=(SELECT id FROM audits WHERE token='a4e19950-c73c-412c-be4d-699c9de1dde1') GROUP BY status"

echo "=== Modules Les Forges ==="
npx wrangler d1 execute diagnostic-hub-production --remote \
  --command="SELECT status, COUNT(*) FROM el_modules WHERE audit_id=(SELECT id FROM audits WHERE token='76e6eb36-8b49-4255-99d3-55fc1adfc1c9') GROUP BY status"
```

**Critères validation** :
- [ ] 4 audits type 'el' importés
- [ ] JALIBAT : 58 OK + 2 microcracks + 182 dead = 242 ✓
- [ ] Les Forges : 85 microcracks + 135 inequality = 220 ✓
- [ ] Tous les tokens audits préservés

---

### ✅ POINT 6.3 : Déploiement Production
**Durée** : 20 min  
**Validation** : Plateforme unifiée déployée

**Actions** :
```bash
cd /home/user/diagnostic-hub

# Build final
npm run build

# Déployer
npx wrangler pages deploy dist --project-name diagnostic-hub --branch main

# Attendre propagation (30 sec)
sleep 30

# Tests production
curl https://diagnostic-hub.pages.dev/
curl https://diagnostic-hub.pages.dev/api/el/audits
curl "https://diagnostic-hub.pages.dev/api/el/audit/a4e19950-c73c-412c-be4d-699c9de1dde1"
```

**Critères validation** :
- [ ] Déploiement réussi
- [ ] Dashboard HUB accessible
- [ ] API Module EL fonctionnelle
- [ ] Audit JALIBAT accessible : `/modules/el/audit/a4e19950-...`

---

### ✅ POINT 6.4 : Tests Production Complets
**Durée** : 30 min  
**Validation** : Tous les workflows fonctionnent

**Actions** : Tester manuellement
1. Dashboard HUB : https://diagnostic-hub.pages.dev
2. Liste audits EL : https://diagnostic-hub.pages.dev/modules/el
3. Interface audit JALIBAT : https://diagnostic-hub.pages.dev/modules/el/audit/a4e19950-...
4. Modifier statut d'un module
5. Vérifier collaboration temps réel
6. Générer rapport PDF

**Critères validation** :
- [ ] Dashboard charge correctement
- [ ] 4 audits EL affichés (JALIBAT, Les Forges, 2 démos)
- [ ] Interface audit terrain fonctionne
- [ ] Modification modules fonctionne
- [ ] Collaboration temps réel OK
- [ ] Génération rapport PDF OK

---

## 🧹 PHASE 7 : Nettoyage et Documentation (Session 7)

### ✅ POINT 7.1 : Commit et Push
**Durée** : 15 min  
**Validation** : Code fusionné pushé sur GitHub

**Actions** :
```bash
cd /home/user/diagnostic-hub

# Ajouter tous les changements
git add -A

# Commit
git commit -m "feat: architecture monolithe unifiée - Module EL intégré

- Fusion Module EL dans plateforme HUB
- Schéma D1 unifié (el_modules, pvserv_measurements)
- Migration données production (JALIBAT 242 modules, Les Forges 220 modules)
- Routes adaptées: /modules/el/* et /api/el/*
- Tests complets validés
- Plateforme prête pour construction modules I-V, Visuels, Expertise"

# Push
git push origin feature/unified-platform
```

**Critères validation** :
- [ ] Commit créé avec message descriptif
- [ ] Push réussi vers GitHub
- [ ] Branche `feature/unified-platform` visible sur GitHub

---

### ✅ POINT 7.2 : Merge vers Main
**Durée** : 10 min  
**Validation** : Code fusionné dans main

**Actions** :
```bash
cd /home/user/diagnostic-hub
git checkout main
git merge feature/unified-platform
git push origin main
```

**Critères validation** :
- [ ] Merge sans conflit
- [ ] Main à jour avec fusion
- [ ] GitHub montre dernier commit fusion

---

### ✅ POINT 7.3 : Archiver Module EL Standalone
**Durée** : 10 min  
**Validation** : Ancien projet archivé proprement

**Actions** :
```bash
cd /home/user/webapp

# Tag version standalone
git tag v1.0.0-standalone-final
git push origin v1.0.0-standalone-final

# Ajouter README archivage
echo "# ⚠️ PROJET ARCHIVÉ

Ce projet a été fusionné dans la plateforme unifiée DiagPV.

**Nouvelle URL** : https://diagnostic-hub.pages.dev/modules/el

**Repository actif** : Voir branche main de ce repository

**Date archivage** : $(date +%Y-%m-%d)
" > ARCHIVED.md

git add ARCHIVED.md
git commit -m "docs: archivage projet standalone - fusionné dans HUB"
git push origin main
```

**Critères validation** :
- [ ] Tag v1.0.0-standalone-final créé
- [ ] ARCHIVED.md ajouté
- [ ] Commit et push effectués

---

### ✅ POINT 7.4 : Mise à Jour Documentation
**Durée** : 30 min  
**Validation** : README mis à jour avec nouvelle architecture

**Actions** : Mettre à jour `/home/user/diagnostic-hub/README.md`

**Contenu** :
- Architecture unifiée
- URLs modules : `/modules/el`, `/modules/iv`, etc.
- Instructions déploiement
- Guide migration données
- Roadmap modules suivants

**Critères validation** :
- [ ] README.md mis à jour
- [ ] Architecture documentée
- [ ] Commandes déploiement à jour

---

## 📊 État d'Avancement

### Résumé Points de Validation

**Phase 1 : Préparation** (3 points)
- [ ] 1.1 Backup complet
- [ ] 1.2 Structure git
- [ ] 1.3 Export données

**Phase 2 : Schéma D1** (2 points)
- [ ] 2.1 Conception schéma
- [ ] 2.2 Application locale

**Phase 3 : Migration Données** (2 points)
- [ ] 3.1 Script migration
- [ ] 3.2 Test local

**Phase 4 : Code Module EL** (3 points)
- [ ] 4.1 Copie code
- [ ] 4.2 Adaptation routes
- [ ] 4.3 Intégration index

**Phase 5 : Tests Locaux** (3 points)
- [ ] 5.1 Build local
- [ ] 5.2 Tests API
- [ ] 5.3 Intégrité JALIBAT

**Phase 6 : Production** (4 points)
- [ ] 6.1 Migrations prod
- [ ] 6.2 Import données
- [ ] 6.3 Déploiement
- [ ] 6.4 Tests complets

**Phase 7 : Nettoyage** (4 points)
- [ ] 7.1 Commit & push
- [ ] 7.2 Merge main
- [ ] 7.3 Archivage webapp
- [ ] 7.4 Documentation

**TOTAL : 21 points de validation**

---

## 🚦 Workflow Session

### À chaque session, tu dis :

**"Continue point X.Y"** → Je reprends exactement où on s'est arrêté

**Exemple** :
- Toi : "Continue point 2.1"
- Moi : Je crée le fichier migration SQL et te demande validation
- Toi : "Validé, continue"
- Moi : Je passe au point 2.2 automatiquement

### Quand je termine un point :

```
✅ POINT X.Y TERMINÉ

Résultat :
- Action 1 effectuée
- Action 2 effectuée

Validation requise :
- [ ] Critère 1
- [ ] Critère 2

👉 Tape "Validé" pour continuer au point X.Y+1
👉 Ou demande "Refaire point X.Y" si problème
```

---

## 🎯 Prochaine Session

**Commande pour reprendre** : "Continue point 1.1"

Je démarre immédiatement le backup production.

---

**Date création plan** : 27 octobre 2025  
**Dernière mise à jour** : 27 octobre 2025  
**Statut** : Prêt à démarrer ✅
