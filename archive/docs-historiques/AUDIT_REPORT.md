# RAPPORT D'AUDIT COMPLET — Diagnostic PV Hub

**Date :** 2026-03-05  
**Auditeur :** Atlas (AI Copilote)  
**Projet :** diagnostic-hub  
**Stack :** Hono + TypeScript + Cloudflare Workers + D1 SQLite + Vite  
**Statut PM2 :** ✅ Online (PID 40061, 8j uptime)

---

## 1. SYNTHÈSE EXÉCUTIVE

| Indicateur | Valeur |
|---|---|
| **Fichiers source** | 121 modules TS/TSX + 63 migrations SQL |
| **Routes API** | 20 modules backend (14 622 lignes routes) |
| **Pages frontend** | 35 pages HTML/TSX |
| **Tables DB (réelles)** | 45 tables SQLite |
| **Bugs bloquants** | **7 HIGH** |
| **Bugs importants** | **5 MEDIUM** |
| **Améliorations** | 8 LOW |
| **Conformité globale** | **~55%** (nombreux schémas désynchronisés) |

### Verdict

> **Le hub fonctionne partiellement.** Les modules récents (PVServ Dark, Audit Qualité, Diode Tests, Rapport Unifié) sont opérationnels. Cependant, **5 modules majeurs sont cassés** à cause d'un **désalignement schéma DB réel vs. code** — les migrations n'ont pas été toutes appliquées à la DB locale.

---

## 2. INVENTAIRE COMPLET

### 2.1 Architecture Modules

```
src/
├── index.tsx                          # Router principal (203 lignes, 20 API routes + 35 pages)
├── modules/
│   ├── admin/                         # Diagnostic système + administration
│   ├── audit-qualite/                 # ✅ Audit qualité terrain (NF C 15-100 / DTU 40.35)
│   ├── audits/                        # Gestion audits (création, listing)
│   ├── auth/                          # Authentification (JWT, rate-limiter)
│   ├── crm/                           # ❌ CRM Clients/Projets (erreur serveur)
│   ├── custom-report/                 # Rapports personnalisés
│   ├── designer/                      # Éditeur PV cartographie
│   ├── diode-tests/                   # ✅ Tests diodes bypass
│   ├── el/                            # ❌ Électroluminescence (404, routes non montées)
│   ├── girasole/                      # ❌ GIRASOLE (colonne audit_types manquante)
│   ├── interconnect/                  # Sync PV ↔ EL
│   ├── isolation/                     # ❌ Tests isolation (schéma DB incompatible)
│   ├── iv-curves/                     # ❌ Courbes I-V classiques (table iv_curves manquante)
│   │   ├── pvserv-dark-routes.ts      # ✅ PVServ Dark IV (fonctionnel)
│   │   └── parsers/                   # Parsers TXT/Excel/Dark
│   ├── picsellia-integration/         # Intégration IA Picsellia
│   ├── planning/                      # ❌ Planning (404 sur /api/planning/missions)
│   ├── pv/                            # ✅ PV Plants (partiellement fonctionnel)
│   ├── thermique/                     # ⚠️ Thermique (404 sur GET /measurements)
│   ├── unified-report/               # ✅ Rapport unifié (fonctionne avec PVServ Dark + Audit Qualité)
│   ├── unified/                       # Installations unifiées
│   └── visual-inspection/             # ❌ Inspection visuelle (erreur récupération liste)
├── pages/                             # 35 pages frontend (HTML/TSX)
└── styles.css                         # CSS global
```

### 2.2 Tables DB — État Réel

| Table | Lignes | État |
|---|---:|---|
| pvserv_import_sessions | 2 | ✅ Fonctionnel |
| pvserv_dark_curves | ~22 | ✅ Fonctionnel |
| pvserv_dark_measurements | ~600 | ✅ Fonctionnel |
| diode_test_sessions | 2 | ✅ Fonctionnel |
| diode_test_results | ~3 | ✅ Fonctionnel |
| ordres_mission_qualite | 1 | ✅ Fonctionnel |
| aq_checklist_items | 36 | ✅ Fonctionnel |
| unified_reports | 4 | ✅ Fonctionnel |
| pv_plants | 1 | ✅ Fonctionnel |
| crm_clients | 1 | ⚠️ API erreur |
| projects | 1 | ⚠️ Colonne audit_types manquante |
| el_audits | 0 | ⚠️ Colonnes manquantes (plant_id, audit_date) |
| **iv_curves** | **TABLE MANQUANTE** | ❌ **CRITIQUE** |
| isolation_tests | 0 | ❌ Schéma ancien (sans test_date, plant_id...) |
| visual_inspections | 0 | ❌ Schéma ancien (sans inspection_token, plant_id) |
| thermal_measurements | 0 | ⚠️ Vide, schéma non vérifié |
| pv_cartography_audit_links | 0 | ⚠️ Schéma différent (plant_id au lieu de pv_plant_id) |

---

## 3. AUDIT FONCTION PAR FONCTION

### 3.1 Aggregator (unified-report/aggregator.ts)

| Fonction | État | Issue | Priorité |
|---|---|---|---|
| `aggregateUnifiedReportData()` | ✅ Fonctionne | 10 modules en parallèle, enrichissement CRM, calculs synthèse | — |
| `aggregateELModule()` | ⚠️ Code OK, DB KO | Query `pv_cartography_audit_links` utilise `pv_plant_id` → DB a `plant_id`. el_audits manque `audit_date`, `plant_id` | HIGH |
| `aggregateIVModule()` | ❌ Cassé | Table `iv_curves` **n'existe pas** dans la DB locale. Jointure `pv_cartography_audit_links` même problème | HIGH |
| `aggregateVisualModule()` | ❌ Cassé | DB `visual_inspections` a schéma ancien sans `inspection_token`, `plant_id`, `project_name` | HIGH |
| `aggregateIsolationModule()` | ❌ Cassé | DB `isolation_tests` a schéma ancien sans `test_date`, `plant_id`, `is_conform`, `dc_positive_to_earth`... | HIGH |
| `aggregateThermalModule()` | ⚠️ Logique complexe | Double fallback (jointure interventions → direct audit_token). Même problème `pv_cartography_audit_links` | MED |
| `aggregatePhotosModule()` | ⚠️ Dépend EL | Même jointure `pv_cartography_audit_links` cassée | MED |
| `aggregateAuditQualiteModule()` | ✅ Fonctionne | Requêtes correctes, tables existent, données test OK | — |
| `aggregateDiodeTestModule()` | ✅ Fonctionne | Sessions et résultats OK | — |
| `aggregatePVServDarkModule()` | ✅ Fonctionne | Auto-discovery 3 niveaux (token, audit, plantId), stats, anomalies | — |
| `getAuditNotes()` | ⚠️ | Table `el_audit_notes` n'est pas dans la DB (migration 0051 jamais appliquée ?) | LOW |
| `generateRecommendations()` | ✅ | 6 types de recommandations, logique correcte | — |
| `calculateOverallConformity()` | ✅ | Pondérations : EL=25, Visual=20, Isolation=15, IV=10, AuditQual=15, Diodes=5, PVServDark=10 | — |
| `requiresUrgentAction()` | ✅ | 6 conditions d'urgence vérifiées | — |

### 3.2 Routes API — Tests Fonctionnels

| Endpoint | HTTP | Résultat | Erreur |
|---|---|---|---|
| `GET /crm/dashboard` | 200 | ✅ Page HTML | — |
| `GET /iv-curves` | 200 | ✅ Page HTML | — |
| `GET /pvserv-dark` | 200 | ✅ Page HTML | — |
| `GET /visual` | 200 | ✅ Page HTML | — |
| `GET /isolation` | 200 | ✅ Page HTML | — |
| `GET /thermal` | 200 | ✅ Page HTML | — |
| `GET /tools` | 200 | ✅ Page HTML | — |
| `GET /api/pvserv/sessions` | 200 | ✅ 2 sessions | — |
| `GET /api/pv/plants` | 200 | ✅ 1 plant | — |
| `GET /api/audit-qualite/missions` | 200 | ✅ 1 mission | — |
| `GET /api/diode-tests/sessions` | 200 | ✅ 2 sessions | — |
| `GET /api/report/unified/preview?plantId=999` | 200 | ✅ pvserv_dark + audit_qualite disponibles | — |
| `GET /api/diagnostic/interconnect` | 200 | ✅ KPIs, 0 liens PV↔EL | — |
| `GET /api/iv-curves/curves` | 500 | ❌ | `Erreur serveur` (table iv_curves manquante) |
| `GET /api/visual/inspections` | 500 | ❌ | `Erreur récupération liste` (schéma incompatible) |
| `GET /api/isolation/tests` | 500 | ❌ | `no such column: test_date` |
| `GET /api/thermique/measurements` | 404 | ❌ | Route GET /measurements non définie |
| `GET /api/el/audits` | 404 | ❌ | Routes montées sous `/api/el`, path `/audits` manquant |
| `GET /api/crm/clients` | 500 | ❌ | `Erreur serveur` |
| `GET /api/planning/missions` | 404 | ❌ | Route inexistante |
| `GET /api/girasole/projects` | 500 | ❌ | `no such column: p.audit_types` |

### 3.3 Parsers PVServ

| Parser | État | Notes |
|---|---|---|
| `pvserv-dark-parser.ts` | ✅ | Discrimination Uf>100=string/≤100=diode. Seuils anomalies (FF, Rds). 437 lignes, bien structuré |
| `pvserv-txt-parser.ts` | ✅ | Parser legacy courbes I-V classiques. 175 lignes |
| `pvserv-excel-parser.ts` | ⚠️ | Utilise `xlsx` (dépendance 782KB). Non testé car table iv_curves absente |
| `parsers/index.ts` | ⚠️ | Utilise `Buffer.isBuffer()` — **incompatible Cloudflare Workers** en production sans `nodejs_compat` |

---

## 4. ARCHITECTURE & DATA-FLOW

### 4.1 Flux End-to-End

```
Frontend (Pages HTML/TSX)
    │
    ▼
Hono Router (src/index.tsx)
    │
    ├──► API Routes (/api/*)  ──► D1 Database (SQLite)
    │                                  │
    │    ┌───────────────────────────┘
    │    │
    │    ├── pvserv_import_sessions ──► pvserv_dark_curves ──► pvserv_dark_measurements
    │    ├── diode_test_sessions ──► diode_test_results
    │    ├── ordres_mission_qualite ──► aq_checklist_items (sol/toiture)
    │    ├── el_audits ──► el_modules (⚠️ vide)
    │    ├── iv_curves ──► iv_measurements (❌ table manquante)
    │    ├── visual_inspections (❌ schéma ancien)
    │    ├── isolation_tests (❌ schéma ancien)
    │    └── thermal_measurements (⚠️ vide)
    │
    └──► Rapport Unifié
           ├── aggregateUnifiedReportData() → Promise.all([10 modules])
           ├── generateReportHTML() → HTML A4 imprimable
           └── INSERT unified_reports (FK constraint sur pv_plants.id)
```

### 4.2 Points de Blocage Identifiés

1. **Table `iv_curves` inexistante** — Migration 0015 jamais exécutée sur la DB locale
2. **Schéma `isolation_tests` ancien** — Migration 0017 a fait DROP/CREATE, mais la DB a l'ancien schéma (probablement la table initiale de migration 0001 ou une version antérieure)
3. **Schéma `visual_inspections` ancien** — Même problème, migrations 0016/0018 non appliquées
4. **`projects.audit_types` manquant** — Migration 0023 (ALTER TABLE) non appliquée
5. **`el_audits` sans `plant_id`/`audit_date`** — Colonnes attendues par le code mais absentes du schéma réel
6. **`pv_cartography_audit_links.pv_plant_id` vs `plant_id`** — Le code aggregator utilise `pcal.pv_plant_id`, la DB a `plant_id` et `audit_token` (au lieu de `el_audit_token`)

### 4.3 Cause Racine

> **Les migrations SQL n'ont pas été appliquées séquentiellement.** La DB locale contient un schéma issu d'un ancien seed/import partiel, tandis que le code attend les schémas des migrations 0015-0063. Certaines tables ont été créées par une migration initiale (0001) puis reconstituées dans des migrations ultérieures (0015, 0016, 0017) avec un schéma complètement différent — mais les DROP/CREATE n'ont jamais été exécutés.

---

## 5. AUDIT CONFIG & ENVIRONNEMENT

| Fichier | État | Notes |
|---|---|---|
| `wrangler.jsonc` | ✅ | D1 + KV + R2 configurés. compatibility_date 2025-10-27, nodejs_compat activé |
| `package.json` | ✅ | Hono 4.9.9, Vite 6.3.5, Wrangler 4.4.0. Scripts dev/build/deploy corrects |
| `vite.config.ts` | ✅ | @hono/vite-build/cloudflare-pages + tailwindcss + devServer |
| `tsconfig.json` | ✅ | ESNext, JSX react-jsx, hono/jsx. Manque `@cloudflare/workers-types` dans types[] |
| `ecosystem.config.cjs` | ✅ | PM2 avec wrangler pages dev --d1 --local, port 3000 |
| `.gitignore` | ✅ | node_modules, .wrangler, dist, etc. |
| `seed.sql` | ⚠️ | Non vérifié (peut contribuer au problème de schéma) |

### Dépendances Risquées

| Package | Risque | Détail |
|---|---|---|
| `xlsx` (0.18.5) | ⚠️ HIGH | 782KB, utilise `Buffer`/`fs` — incompatible CF Workers en production. `nodejs_compat` mitigue partiellement |
| `dxf-parser` (1.1.2) | ⚠️ MED | Parser DXF pour import plans. Vérifier compatibilité Workers |
| `leaflet-path-transform` | LOW | Dépendance frontend, pas de risque backend |

---

## 6. PROBLÈMES DÉTECTÉS — PRIORISÉS

### 🔴 HIGH (Bloquants — Correction ≤ 1 semaine)

| # | Problème | Cause | Solution | Effort |
|---|---|---|---|---|
| H1 | **Table `iv_curves` inexistante** | Migration 0015 non appliquée | `db:migrate:local` ou `db:reset` complet | 30min |
| H2 | **`isolation_tests` schéma ancien** | Migration 0017 non appliquée (DROP+CREATE) | `db:reset` pour recréer toutes les tables | 30min |
| H3 | **`visual_inspections` schéma ancien** | Migrations 0016/0018 non appliquées | Inclus dans db:reset | 30min |
| H4 | **`projects.audit_types` manquant** | Migration 0023 (ALTER) non appliquée | Inclus dans db:reset | 15min |
| H5 | **`el_audits` colonnes manquantes** | `plant_id`, `audit_date` attendus par code mais absents | Ajouter ALTER TABLE migration OU aligner le code | 1h |
| H6 | **`pv_cartography_audit_links` colonnes incorrectes** | Code utilise `pv_plant_id`, DB a `plant_id`. Code utilise `el_audit_token`, DB a `audit_token` | Aligner code OU migration ALTER | 1h |
| H7 | **API CRM /api/crm/clients erreur 500** | Probablement colonnes manquantes dans `crm_clients` ou jointure cassée | Vérifier routes CRM + schéma | 1h |

### 🟡 MEDIUM (Importants — Correction ≤ 2 semaines)

| # | Problème | Cause | Solution | Effort |
|---|---|---|---|---|
| M1 | **Routes EL /api/el/audits retourne 404** | Routes montées sous `/api/el` mais structure interne peut avoir un path mismatch | Vérifier el/routes/audits.ts path prefix | 30min |
| M2 | **GET /api/thermique/measurements → 404** | Route GET list non définie dans thermique/routes.ts | Ajouter endpoint GET /measurements | 30min |
| M3 | **GET /api/planning/missions → 404** | Path mismatch entre index.tsx et planning/routes.ts | Vérifier planning/routes.ts path | 30min |
| M4 | **Table `el_audit_notes` absente** | Migration 0051 non appliquée | Inclus dans db:reset | 15min |
| M5 | **GIRASOLE /api/girasole/projects → erreur `audit_types`** | projects table manque colonne | Résolu par H4 (db:reset) | 0min |

### 🟢 LOW (Améliorations — Sprint suivant)

| # | Problème | Solution | Effort |
|---|---|---|---|
| L1 | `Buffer.isBuffer()` dans parsers/index.ts | Incompatible CF Workers sans nodejs_compat. Remplacer par `instanceof File` check | 30min |
| L2 | Pas de tests automatisés | Ajouter vitest + tests unitaires pour parsers + aggregators | 4h |
| L3 | Error handling générique | Les erreurs 500 renvoient des messages vagues. Ajouter logging structuré | 2h |
| L4 | Pas de pagination sur listes API | Audit qualité OK, mais CRM/plants/audits manquent `offset`/`limit` standard | 2h |
| L5 | Template HTML rapport > 1000 lignes | Splitter en composants réutilisables | 3h |
| L6 | Pas de validation input middleware | Ajouter Zod ou hono/validator sur routes POST critiques | 3h |
| L7 | `xlsx` package risque CF Workers | Migrer vers `xlsx-parse-json` plus léger ou parser custom | 2h |
| L8 | Migrations numérotation incohérente | Sauts : 0013→0015, 0023→0027, 0027→0049. Renommer séquentiellement | 1h |

---

## 7. PLAN D'ACTION PRIORISÉ

### Phase 1 — Correction DB (Urgence : immédiat, ~2h)

```bash
# Option A : Reset complet (recommandé pour dev local)
cd /home/user/diagnostic-hub
rm -rf .wrangler/state/v3/d1
npm run db:migrate:local
npm run db:seed

# Puis vérifier :
npm run build
pm2 restart diagnostic-hub
curl http://localhost:3000/api/iv-curves/curves
curl http://localhost:3000/api/isolation/tests
curl http://localhost:3000/api/visual/inspections
```

> **⚠️ ATTENTION** : Un `db:reset` supprimera les données de test existantes (2 sessions PVServ, 2 sessions diodes, 1 mission audit qualité, 4 rapports unifiés, 1 plant test). **Sauvegarder avant si nécessaire.**

### Phase 2 — Alignement Code ↔ DB (1-2h)

1. **Corriger `pv_cartography_audit_links`** — Le code aggregator.ts utilise `pcal.pv_plant_id` et `pcal.el_audit_token`, mais la DB réelle a `plant_id` et `audit_token`. Soit :
   - (a) Modifier le code pour utiliser les noms réels
   - (b) S'assurer que la migration 0013 crée les bonnes colonnes

2. **Ajouter colonnes manquantes à `el_audits`** — Le code attend `plant_id` et `audit_date` qui n'existent pas. Créer migration :
```sql
ALTER TABLE el_audits ADD COLUMN plant_id INTEGER;
ALTER TABLE el_audits ADD COLUMN audit_date DATE;
```

3. **Vérifier routes EL/Planning/Thermique** — Path mismatch entre index.tsx et les sous-routes.

### Phase 3 — Stabilisation API (1 jour)

- Corriger toutes les routes 404/500 identifiées
- Ajouter try/catch manquants
- Tester chaque endpoint avec données réelles
- Re-seed avec données de test représentatives

### Phase 4 — Tests & Qualité (2-3 jours)

- Ajouter vitest pour parsers (pvserv-dark, pvserv-txt, benning)
- Ajouter tests intégration pour aggregators
- Implémenter validation Zod sur routes POST
- Logging structuré (remplacer console.error par logging métier)

---

## 8. MODULES FONCTIONNELS — RÉSUMÉ

| Module | Routes | DB | Aggregator | Template | Page |
|---|---|---|---|---|---|
| PVServ Dark IV | ✅ 7 endpoints | ✅ 3 tables | ✅ Auto-discovery | ✅ Section HTML | ✅ /pvserv-dark |
| Audit Qualité | ✅ ~20 endpoints | ✅ 7 tables | ✅ Sol+Toiture | ✅ Section HTML | ✅ /audit-qualite/:id |
| Diode Tests | ✅ 10 endpoints | ✅ 2 tables | ✅ Sessions+Results | ✅ Section HTML | ⚠️ Via /tools |
| Rapport Unifié | ✅ 5 endpoints | ✅ 1 table | ✅ 10 modules parallel | ✅ A4 imprimable | ✅ /rapports |
| PV Plants | ✅ CRUD | ✅ 5 tables | — | — | ✅ /pv/plants |
| **EL** | ❌ 404 | ⚠️ Vide | ⚠️ Jointure KO | ✅ | ✅ |
| **IV Curves** | ❌ 500 | ❌ Table manquante | ⚠️ Jointure KO | ✅ | ✅ |
| **Visual** | ❌ 500 | ❌ Schéma ancien | ⚠️ Schéma KO | ✅ | ✅ |
| **Isolation** | ❌ 500 | ❌ Schéma ancien | ⚠️ Schéma KO | ✅ | ✅ |
| **Thermique** | ❌ 404 | ⚠️ Vide | ⚠️ Jointure KO | ✅ | ✅ |

---

## 9. RECOMMANDATIONS STRATÉGIQUES

### Court terme (cette semaine)
1. **`db:reset` complet** — Résout H1-H4, M4, M5 d'un coup (~30min)
2. **Aligner aggregator.ts** sur les noms de colonnes réels de `pv_cartography_audit_links`
3. **Ajouter migration pour `el_audits`** (plant_id, audit_date)
4. **Re-seed avec données de test** couvrant tous les modules

### Moyen terme (2 semaines)
5. **Script de vérification automatique** : endpoint `/api/diagnostic/schema-check` qui compare les colonnes attendues vs. réelles
6. **Tests unitaires** pour les 3 parsers PVServ
7. **Documentation API** (Swagger/OpenAPI auto-generé)

### Long terme (1 mois)
8. **Migration manager** : vérification automatique au démarrage que toutes les migrations sont appliquées
9. **Monitoring** : alertes si un module retourne systématiquement des erreurs
10. **Performance** : les requêtes N+1 dans `chart-data` et `strings`/`diodes` (boucle for + query par courbe) peuvent être optimisées en batch

---

## 10. CHECKLIST DE VÉRIFICATION

- [ ] `db:reset` exécuté avec succès
- [ ] Table `iv_curves` existe et a le bon schéma (0015)
- [ ] Table `isolation_tests` a le schéma 0017 (test_date, plant_id, dc_positive_to_earth...)
- [ ] Table `visual_inspections` a inspection_token, plant_id (0016/0018)
- [ ] `projects.audit_types` existe (0023)
- [ ] `el_audits` a plant_id et audit_date
- [ ] `pv_cartography_audit_links` colonnes alignées avec le code
- [ ] `GET /api/iv-curves/curves` → 200
- [ ] `GET /api/isolation/tests` → 200
- [ ] `GET /api/visual/inspections` → 200
- [ ] `GET /api/el/audits` → 200
- [ ] `GET /api/crm/clients` → 200
- [ ] `GET /api/girasole/projects` → 200
- [ ] `GET /api/thermique/measurements` → 200
- [ ] `GET /api/planning/missions` → 200
- [ ] Rapport unifié avec plantId=999 → tous modules détectés
- [ ] Build Vite sans erreurs
- [ ] Données de test re-insérées (PVServ, diodes, audit qualité)

---

*Rapport généré automatiquement par Atlas — Audit Diagnostic PV Hub v1.0*  
*Prochaine revue recommandée : après application du plan Phase 1*
