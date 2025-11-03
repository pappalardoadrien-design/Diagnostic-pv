# 🔧 Plan Refactoring Module EL → pv_modules

**Date**: 2025-11-03  
**Objectif**: Interconnecter Module EL avec Canvas V2 via table unique `pv_modules`

---

## 📊 État Actuel

### ❌ Problème
Le Module EL utilise une table séparée `el_modules` qui crée une désynchronisation :

```
Canvas V2 (Calepinage)          Module EL (Annotations)
       ↓                                  ↓
  pv_modules                         el_modules
  - module_identifier                - module_identifier
  - module_status                    - defect_type
  - latitude, longitude              - severity_level
  - ...                              - image_url
                                     - comment
```

**Conséquence** :
- Module annoté dans EL n'apparaît pas mis à jour dans Canvas V2
- Données dupliquées, désynchronisation possible
- Workflow cassé

### ✅ Solution
Utiliser **UNE SEULE TABLE** `pv_modules` avec colonnes unifiées :

```
pv_modules (TABLE UNIQUE)
├── CART

OGRAPHIE
│   ├── module_identifier, latitude, longitude
│   └── string_number, position_in_string
├── STATUT GLOBAL
│   ├── module_status (ok, warning, critical, pending)
│   └── status_comment
└── ÉLECTROLUMINESCENCE ⭐
    ├── el_defect_type (none, microcrack, dead_module, ...)
    ├── el_severity_level (0-4)
    ├── el_photo_url
    ├── el_notes
    ├── el_technician_id
    └── el_analysis_date
```

---

## 🔄 Changements Requis

### 1. **Modifications Queries SQL**

#### Avant (el_modules) ❌
```typescript
await env.DB.prepare(`
  UPDATE el_modules 
  SET defect_type = ?, 
      severity_level = ?, 
      comment = ?
  WHERE audit_token = ? AND module_identifier = ?
`).bind(...)
```

#### Après (pv_modules) ✅
```typescript
await env.DB.prepare(`
  UPDATE pv_modules 
  SET el_defect_type = ?, 
      el_severity_level = ?, 
      el_notes = ?,
      el_analysis_date = datetime('now'),
      updated_at = datetime('now')
  WHERE zone_id = ? AND module_identifier = ?
`).bind(...)
```

### 2. **Mapping Colonnes**

| Ancien (el_modules) | Nouveau (pv_modules) |
|---------------------|----------------------|
| `defect_type` | `el_defect_type` |
| `severity_level` | `el_severity_level` |
| `comment` | `el_notes` |
| `image_url` | `el_photo_url` |
| `technician_id` | `el_technician_id` |
| `audit_token` | Remplacé par `zone_id` |
| `el_audit_id` | Supprimé (inutile) |

### 3. **Changement Clé de Jointure**

#### Avant (audit_token) ❌
```sql
WHERE audit_token = ?
```

#### Après (zone_id) ✅
```sql
WHERE zone_id = ?
```

**Justification** :
- `zone_id` = lien direct avec pv_zones (toiture)
- Plus besoin de `el_audits` comme intermédiaire
- Workflow simplifié : Plant → Zone → Modules

---

## 📁 Fichiers à Modifier

### 🔴 Priorité 1 : Routes API

#### `src/modules/el/routes/modules.ts` (303 lignes)
**Modifications** :
- [ ] Ligne 80-94 : `UPDATE el_modules` → `UPDATE pv_modules`
- [ ] Ligne 150-167 : `INSERT INTO el_modules` → `INSERT INTO pv_modules`
- [ ] Ligne 213-252 : `UPDATE el_modules` (bulk) → `UPDATE pv_modules`
- [ ] Toutes queries : `audit_token` → `zone_id`
- [ ] Colonnes : `defect_type` → `el_defect_type`, `severity_level` → `el_severity_level`, etc.

#### `src/modules/el/routes/audits.ts`
**À analyser** : Gestion audits, créer/récupérer/mettre à jour

#### `src/modules/el/routes/dashboard.ts`
**À analyser** : Stats, vues agrégées

### 🟡 Priorité 2 : Interface Frontend

#### `src/index.tsx` (ligne ~6511+)
**À chercher** : Interface EL si intégrée dans index.tsx

### 🟢 Priorité 3 : Types TypeScript

#### `src/modules/el/types/index.ts`
**Modifications** :
- [ ] Mettre à jour interfaces Request/Response
- [ ] Ajouter `zone_id` remplaçant `audit_token`

---

## 🚀 Plan d'Exécution

### Phase 1 : Préparation (COMPLÉTÉ ✅)
1. ✅ Migration 0009 appliquée (colonnes `el_*` ajoutées)
2. ✅ Analyse architecture complète
3. ✅ Documentation plan refactoring

### Phase 2 : Refactoring Backend (EN COURS)
1. ⏳ Modifier `modules.ts` (queries SQL)
2. ⏳ Modifier `audits.ts` (si nécessaire)
3. ⏳ Modifier `dashboard.ts` (stats)
4. ⏳ Tester endpoints API (Postman/curl)

### Phase 3 : Refactoring Frontend
1. ⏳ Identifier interfaces EL dans index.tsx
2. ⏳ Modifier appels API (`audit_token` → `zone_id`)
3. ⏳ Tester workflow UI complet

### Phase 4 : Migration Données
1. ⏳ Script migration `el_modules` → `pv_modules`
2. ⏳ Backup avant migration
3. ⏳ Exécution migration
4. ⏳ Validation données

### Phase 5 : Nettoyage
1. ⏳ Supprimer table `el_modules` (obsolète)
2. ⏳ Supprimer routes/queries obsolètes
3. ⏳ Mettre à jour documentation

---

## 🧪 Tests Requis

### Test 1 : Workflow Complet
```
1. Canvas V2 : Créer zone + modules
2. Module EL : Annoter modules (defect_type, severity)
3. Canvas V2 : Vérifier modules colorés selon annotations
4. Export PDF : Vérifier annotations présentes
```

### Test 2 : API Endpoints
```
POST /api/el/audit/:zoneId/module/:moduleId
  Body: { status: "microcrack", comment: "Test", technicianId: 1 }
  ✅ pv_modules.el_defect_type = "microcrack"
  ✅ pv_modules.el_severity_level = 2
  ✅ pv_modules.el_notes = "Test"
```

### Test 3 : Stats Dashboard
```
GET /api/el/dashboard/zone/:zoneId
  ✅ Retourne stats depuis v_pv_modules_audit_stats
  ✅ el_microcrack, el_dead, el_inequality
  ✅ el_completion_rate
```

---

## ⚠️ Risques & Mitigation

### Risque 1 : Données Existantes Perdues
**Mitigation** :
- Backup DB avant refactoring
- Script migration `el_modules` → `pv_modules`
- Tests validation post-migration

### Risque 2 : Frontend Cassé
**Mitigation** :
- Tests endpoints API avant modification frontend
- Déploiement progressif (backend → frontend)
- Rollback plan (git revert)

### Risque 3 : Performance Dégradée
**Mitigation** :
- Index déjà créés (migration 0009)
- Vues pré-calculées (v_pv_modules_audit_stats)
- Monitoring performance

---

## 📊 Impact Estimé

### Backend (API)
- **Fichiers modifiés** : 3-4
- **Lignes changées** : ~150-200
- **Durée** : 2-3h

### Frontend (UI)
- **Fichiers modifiés** : 1-2
- **Lignes changées** : ~50-100
- **Durée** : 1-2h

### Migration Données
- **Script SQL** : 1
- **Tests** : 1h
- **Durée** : 30min

### Tests & Validation
- **Durée** : 1-2h

**TOTAL ESTIMÉ : 5-8h développement**

---

## ✅ Critères de Réussite

- [ ] Module EL lit/écrit uniquement dans `pv_modules`
- [ ] Colonnes `el_*` utilisées correctement
- [ ] `zone_id` remplace `audit_token` partout
- [ ] Workflow Canvas V2 → EL → Canvas V2 fluide
- [ ] Annotations EL visibles immédiatement dans Canvas V2
- [ ] Stats dashboard fonctionnelles
- [ ] Export PDF inclut annotations EL
- [ ] Table `el_modules` supprimée (obsolète)
- [ ] Tests end-to-end passent

---

## 🎯 Prochaine Action Immédiate

**Modifier `src/modules/el/routes/modules.ts`** :
1. Remplacer toutes requêtes `el_modules` → `pv_modules`
2. Mapper colonnes ancien → nouveau
3. Utiliser `zone_id` au lieu de `audit_token`
4. Tester endpoints avec curl

**Commencer maintenant ?** 🚀
