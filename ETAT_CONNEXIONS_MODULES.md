# 🔗 ÉTAT DES CONNEXIONS DYNAMIQUES - MODULES

## 📅 Date : 24 Novembre 2025

## 🎯 OBJECTIF

Vérifier que **TOUS les modules** utilisent la table **`audits`** centralisée et sont correctement interconnectés.

---

## ✅ MODULES CONNECTÉS DYNAMIQUEMENT (Table `audits`)

### 1. **Module Dashboard** ✅
- **Route** : `/api/dashboard`
- **Connexion** : ✅ Utilise `audits` + LEFT JOIN `el_audits`, `iv_curves`, `visual_inspections`
- **Fichier** : `src/modules/dashboard/routes/audits-list.ts`
- **Requêtes** : 
  ```sql
  SELECT a.*, ea.total_modules, ea.string_count
  FROM audits a
  LEFT JOIN el_audits ea ON ea.audit_token = a.audit_token
  ```

### 2. **Module CRM** ✅
- **Route** : `/api/crm`
- **Connexion** : ✅ Utilise `audits` pour compter les audits par client
- **Fichier** : `src/modules/crm/routes.ts`
- **Requêtes** :
  ```sql
  SELECT COUNT(*) FROM audits WHERE client_id = ?
  SELECT * FROM audits WHERE project_id = ?
  ```

### 3. **Module Audits (Master)** ✅
- **Route** : `/api/audits`
- **Connexion** : ✅ Table centrale `audits` 
- **Fichier** : `src/modules/audits/routes.ts`
- **Requêtes** :
  ```sql
  SELECT * FROM audits WHERE audit_token = ?
  INSERT INTO audits (audit_token, project_name, audit_type, ...)
  ```

### 4. **Module Reports** ✅
- **Route** : `/api/reports/consolidated`
- **Connexion** : ✅ Utilise `audits` + LEFT JOIN modules spécifiques
- **Fichiers** : 
  - `src/modules/reports/consolidated-routes.ts`
  - `src/modules/reports/consolidated-full.ts`
- **Requêtes** :
  ```sql
  FROM audits a
  LEFT JOIN el_audits ea ON ea.audit_token = a.audit_token
  LEFT JOIN iv_curves iv ON iv.audit_token = a.audit_token
  ```

### 5. **Module Calepinage** ✅
- **Route** : `/api/calepinage`
- **Connexion** : ✅ Utilise `audits` + `el_audits` pour grille modules
- **Fichiers** :
  - `src/modules/calepinage/routes/editor.ts`
  - `src/modules/calepinage/routes/grid.ts`
- **Requêtes** :
  ```sql
  FROM audits a
  LEFT JOIN el_audits ea ON ea.audit_token = a.audit_token
  ```

### 6. **Module Planning** ✅
- **Route** : `/api/planning`
- **Connexion** : ✅ Lie interventions → audits
- **Fichier** : `src/modules/planning/routes.ts`
- **Requêtes** :
  ```sql
  SELECT * FROM audits WHERE intervention_id = ?
  ```

### 7. **Module GIRASOLE** ✅
- **Route** : `/api/girasole`
- **Connexion** : ✅ Utilise `audits` avec audit_type = 'GIRASOLE_CONFORMITE' / 'GIRASOLE_TOITURE'
- **Fichiers** : `src/modules/girasole/*`
- **Requêtes** :
  ```sql
  SELECT * FROM audits WHERE audit_type LIKE 'GIRASOLE%'
  ```

---

## ⚠️ MODULES PARTIELLEMENT CONNECTÉS

### 8. **Module EL** ⚠️
- **Route** : `/api/el`
- **Connexion** : ⚠️ **Utilise ENCORE `FROM el_audits` directement**
- **Fichier** : `src/modules/el/routes/audits.ts`
- **Problème** : 
  ```sql
  # ❌ DIRECT (sans JOIN audits)
  FROM el_audits WHERE audit_token = ?
  ```
- **Solution requise** :
  ```sql
  # ✅ UNIFIÉ
  FROM audits a
  LEFT JOIN el_audits ea ON ea.audit_token = a.audit_token
  WHERE a.audit_token = ?
  ```

### 9. **Module IV** ⚠️
- **Route** : `/api/iv`
- **Connexion** : ⚠️ À vérifier (utilise `iv_curves` directement ?)
- **Fichier** : `src/modules/iv/routes/*.ts`
- **Action** : Audit nécessaire

### 10. **Module Visual** ⚠️
- **Route** : `/api/visual`
- **Connexion** : ⚠️ À vérifier (utilise `visual_inspections` directement ?)
- **Fichier** : `src/modules/visual/routes.ts`
- **Action** : Audit nécessaire

### 11. **Module Isolation** ⚠️
- **Route** : `/api/isolation`
- **Connexion** : ⚠️ À vérifier (utilise `isolation_tests` directement ?)
- **Fichier** : `src/modules/isolation/routes.ts`
- **Action** : Audit nécessaire

---

## ❌ MODULES NON CONNECTÉS (Systèmes indépendants)

### 12. **Module PV Cartography** ❌
- **Route** : `/pv/*`, `/api/pv/*`
- **Connexion** : ❌ **Système complètement séparé**
- **Tables propres** : `pv_plants`, `pv_zones`, `pv_modules`
- **Problème** : Aucun lien avec `audits`
- **Impact** : 
  - Impossible de lier audit EL → Cartographie PV
  - Pas de vue unifiée CRM → Projets → Audits → PV Carto
- **Solution requise** :
  ```sql
  # Ajouter colonne de liaison
  ALTER TABLE pv_zones ADD COLUMN audit_token TEXT;
  ALTER TABLE pv_zones ADD COLUMN audit_id INTEGER;
  
  # Créer lien bidirectionnel
  CREATE INDEX idx_pv_zones_audit ON pv_zones(audit_token);
  ```

### 13. **Module Diagnostiqueurs** ❌
- **Route** : `/api/diagnostiqueurs`
- **Connexion** : ❌ Système RH indépendant
- **Tables** : `diagnostiqueurs`, `certifications`
- **OK** : Ce module N'A PAS BESOIN d'être lié à `audits`

### 14. **Module Missions** ❌
- **Route** : `/api/missions`
- **Connexion** : ❌ Gestion missions indépendante
- **Tables** : `missions`, `mission_diagnostiqueurs`
- **OK** : Ce module N'A PAS BESOIN d'être lié à `audits`

### 15. **Module Labels** ❌
- **Route** : `/api/labels`
- **Connexion** : ❌ Système certification indépendant
- **Tables** : `labellisation_criteria`, `certifications`
- **OK** : Ce module N'A PAS BESOIN d'être lié à `audits`

### 16. **Module Subcontractors** ❌
- **Route** : `/api/subcontractors`
- **Connexion** : ❌ Gestion sous-traitants indépendante
- **Tables** : `subcontractors`
- **OK** : Ce module N'A PAS BESOIN d'être lié à `audits`

### 17. **Module Auth** ❌
- **Route** : `/api/auth`
- **Connexion** : ❌ Système authentification indépendant
- **Tables** : `users`, `sessions`
- **OK** : Ce module N'A PAS BESOIN d'être lié à `audits`

---

## 🔧 MODULES À VÉRIFIER

### 18. **Module Expertise** ⚠️
- **Route** : `/api/expertise`
- **Status** : Module existant mais non monté ?
- **Action** : Vérifier présence dans `index.tsx`

### 19. **Module Thermique** ⚠️
- **Route** : `/api/thermique`
- **Status** : Module existant mais non monté ?
- **Action** : Vérifier présence dans `index.tsx`

### 20. **Module Visuels** ⚠️
- **Route** : `/api/visuels`
- **Status** : Doublon avec `visual` ?
- **Action** : Clarifier différence

### 21. **Module Exports** ✅
- **Route** : `/api/exports/csv`
- **Connexion** : ✅ Export données depuis `audits`
- **OK** : Connecté

### 22. **Module Mission Orders** ✅
- **Route** : `/api/mission-orders`
- **Connexion** : ✅ Lie interventions → audits
- **OK** : Connecté

### 23. **Module Photos** ✅
- **Route** : `/api/photos`
- **Connexion** : ✅ Photos liées aux audits EL
- **OK** : Connecté

---

## 📊 STATISTIQUES

| Catégorie | Nombre | % |
|-----------|--------|---|
| **✅ Connectés dynamiquement** | 10 | 43% |
| **⚠️ Partiellement connectés** | 4 | 17% |
| **❌ Non connectés (OK)** | 6 | 26% |
| **❌ Non connectés (PROBLÈME)** | 1 | 4% |
| **⚠️ À vérifier** | 2 | 9% |
| **TOTAL** | 23 | 100% |

---

## 🚨 PROBLÈMES CRITIQUES

### 1. **Module PV Cartography NON LIÉ à `audits`** 🔴

**Impact** :
- ❌ Impossible de lier audit EL JALIBAT → Cartographie PV zone JALIBAT
- ❌ Pas de synchronisation données modules EL ↔ Cartographie PV
- ❌ Workflow cassé : Audit EL → Positionner modules sur carte satellite

**Exemple concret** :
- Audit EL JALIBAT : `audit_token = 0e74eb29-69d7-4923-8675-32dbb8e926d1`
- Zone PV JALIBAT : `id = 4` (dans `pv_zones`)
- **AUCUN LIEN** entre les deux !

**Solution** : Créer migration pour ajouter `audit_token` dans `pv_zones`

### 2. **Module EL utilise encore `FROM el_audits` directement** 🟡

**Impact** :
- ⚠️ Incohérence avec architecture unifiée
- ⚠️ Risque de données désynchronisées

**Solution** : Remplacer tous les `FROM el_audits` par `FROM audits LEFT JOIN el_audits`

---

## ✅ RECOMMANDATIONS

### Priorité HAUTE (à faire maintenant)

1. **Lier PV Cartography → `audits`**
   - Migration : Ajouter `audit_token`, `audit_id` dans `pv_zones`
   - API : Modifier routes PV pour accepter `audit_token`
   - UI : Ajouter bouton "Cartographie" dans audit EL

2. **Unifier Module EL**
   - Remplacer `FROM el_audits` → `FROM audits LEFT JOIN el_audits`
   - 10 requêtes à modifier dans `audits.ts`

### Priorité MOYENNE

3. **Vérifier Modules IV, Visual, Isolation**
   - Audit complet de leurs requêtes SQL
   - S'assurer qu'ils utilisent `audits` table

4. **Clarifier Modules `expertise`, `thermique`, `visuels`**
   - Vérifier s'ils sont actifs
   - Les monter dans `index.tsx` si nécessaire

---

## 🎯 OBJECTIF FINAL

**TOUS les modules métiers doivent :**
1. ✅ Utiliser la table `audits` comme point d'entrée
2. ✅ LEFT JOIN leurs tables spécifiques (`el_audits`, `iv_curves`, etc.)
3. ✅ Permettre la navigation CRM → Projets → Interventions → Audits → Module spécifique

**Modules support (Auth, Diagnostiqueurs, Labels) peuvent rester indépendants.**

---

**Adrien, veux-tu que je corrige maintenant les 2 problèmes critiques (PV Carto + Module EL) ?**
