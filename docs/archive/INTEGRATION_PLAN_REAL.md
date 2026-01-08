# 🔗 Plan d'Intégration Modulaire - DiagPV Hub

**Date**: 2025-11-03  
**Objectif**: Connecter Canvas V2 ↔ Module EL via table unique `pv_modules`

---

## ✅ Ce qui a été fait

### 1. **Architecture Base de Données Unifiée** ✅
- Migration 0009 appliquée : colonnes EL ajoutées à `pv_modules`
- Table unique hub central : `pv_modules` contient TOUT
- Colonnes : `el_defect_type`, `el_severity_level`, `el_photo_url`, `el_notes`, `el_technician_id`

### 2. **Navigation Inter-Modules** ✅
- Bouton "AUDIT EL" ajouté dans Canvas V2 header
- Placeholder fonctionnel (alert temporaire)

### 3. **Documentation Complète** ✅
- `ARCHITECTURE_ANALYSIS.md` (9.4 KB) - Audit complet système
- `REFACTORING_PLAN.md` (6.9 KB) - Plan technique détaillé
- `INTEGRATION_PLAN_REAL.md` (ce fichier) - Plan d'action réel

---

## 🎯 Objectif Final

**Workflow Cible** :
```
1. CANVAS V2 - CALEPINAGE
   ↓
   Utilisateur place modules manuellement (drag & drop)
   ou utilise Rectangle System (SolarEdge style)
   ✅ Modules créés dans pv_modules
   ✅ module_status = 'pending' (défaut)

2. AUDIT EL NOCTURNE (bouton "AUDIT EL")
   ↓
   Technicien prend photos électroluminescence
   Annote défauts : microcrack, dead_module, etc.
   ✅ pv_modules.el_defect_type mis à jour
   ✅ pv_modules.el_severity_level = 0-4
   ✅ pv_modules.module_status auto-calculé :
      - 'critical' si severity >= 3
      - 'warning' si severity 1-2
      - 'ok' si severity = 0

3. RETOUR CANVAS V2 (bouton "Retour Calepinage")
   ↓
   Modules affichés avec couleurs selon module_status :
   - Rouge = critical
   - Orange = warning
   - Vert = ok
   - Gris = pending

4. EXPORT PDF IEC 62446-1
   ↓
   - Carte calepinage avec modules colorés
   - Photos EL intégrées
   - Tableaux défauts par string
   - Préconisations hiérarchisées
```

---

## 🚀 Actions Prioritaires (Dans l'ordre)

### 🔴 PRIORITÉ 1 : Refactoriser Module EL (5-8h)

**Fichier** : `src/modules/el/routes/modules.ts`

**Changements SQL** :
```typescript
// ❌ AVANT
UPDATE el_modules 
SET defect_type = ?, severity_level = ?, comment = ?
WHERE audit_token = ? AND module_identifier = ?

// ✅ APRÈS
UPDATE pv_modules 
SET el_defect_type = ?, 
    el_severity_level = ?, 
    el_notes = ?,
    el_analysis_date = datetime('now'),
    module_status = CASE 
        WHEN ? >= 3 THEN 'critical'
        WHEN ? >= 1 THEN 'warning'
        ELSE 'ok'
    END,
    updated_at = datetime('now')
WHERE zone_id = ? AND module_identifier = ?
```

**Mapping Colonnes** :
| Ancien (el_modules) | Nouveau (pv_modules) |
|---------------------|----------------------|
| `defect_type` | `el_defect_type` |
| `severity_level` | `el_severity_level` |
| `comment` | `el_notes` |
| `image_url` | `el_photo_url` |
| `technician_id` | `el_technician_id` |
| `audit_token` | `zone_id` (changement clé) |

**Bénéfice** :
- ✅ Canvas V2 voit immédiatement les annotations EL
- ✅ module_status synchronisé automatiquement
- ✅ Impossible de désynchroniser

### 🟡 PRIORITÉ 2 : Créer Route Module EL avec zone_id (2-3h)

**Nouvelle route** : `/el/zone/:zoneId`

**Interface Module EL** :
- Charger modules depuis `pv_modules WHERE zone_id = ?`
- Grille modules avec photos EL
- Annotations défauts (dropdown + severity slider)
- Sauvegarder dans `pv_modules` (colonnes `el_*`)
- Bouton "Retour Calepinage" → `/canvas-v2?zone_id=X`

**Code Canvas V2** :
```javascript
// Remplacer alert temporaire par vraie navigation
document.getElementById('elAuditBtn').addEventListener('click', () => {
    window.location.href = '/el/zone/' + currentZoneId
})
```

### 🟡 PRIORITÉ 3 : Tester Workflow Complet (1-2h)

**Tests** :
1. Canvas V2 : Créer zone + placer 10 modules
2. Cliquer "AUDIT EL"
3. Module EL : Annoter 5 modules (2 critical, 3 warning)
4. Retour Canvas V2
5. Vérifier couleurs modules (2 rouges, 3 oranges, 5 gris)
6. Export PDF : vérifier annotations présentes

### 🟢 PRIORITÉ 4 : Nettoyer Code Obsolète (1h)

**À supprimer si tout fonctionne** :
- Table `el_modules` (obsolète)
- Table `el_audits` (peut-être obsolète, à vérifier usage)
- Routes `/api/el/audit/:token/*` (remplacer par `/api/el/zone/:zoneId/*`)

---

## 📊 Table `pv_modules` - Hub Central

**Colonnes Actuelles** (après Migration 0009) :

### CARTOGRAPHIE (Canvas V2)
- `id`, `zone_id`
- `module_identifier` (S1-P01, S1-P02, ...)
- `latitude`, `longitude` (GPS absolu)
- `pos_x_meters`, `pos_y_meters` (GPS relatif)
- `string_number`, `position_in_string`
- `width_meters`, `height_meters`, `rotation`
- `power_wp`, `brand`, `model`, `serial_number`

### STATUT GLOBAL (Partagé)
- `module_status` (ok, warning, critical, pending)
- `status_comment`

### ÉLECTROLUMINESCENCE (Module EL)
- `el_defect_type` (none, microcrack, dead_module, luminescence_inequality, string_open, not_connected)
- `el_severity_level` (0-4)
- `el_photo_url`
- `el_notes`
- `el_technician_id`
- `el_analysis_date`

### THERMOGRAPHIE (Futur Module IR)
- `ir_photo_url`
- `ir_hotspot_temp`
- `ir_analysis_date`

### COURBES IV (Futur Module IV)
- `iv_curve_data` (JSON)
- `iv_isc`, `iv_voc`, `iv_pmax`, `iv_fill_factor`
- `iv_analysis_date`

### MÉTADONNÉES
- `notes`, `created_at`, `updated_at`

---

## 🔄 Logique Synchronisation module_status

**Règle automatique** (dans Module EL) :

```sql
UPDATE pv_modules 
SET 
    el_defect_type = ?,
    el_severity_level = ?,
    module_status = CASE 
        WHEN ? >= 3 THEN 'critical'  -- Défaut critique (module mort, etc.)
        WHEN ? >= 1 THEN 'warning'   -- Défaut moyen (microfissure, etc.)
        ELSE 'ok'                     -- Aucun défaut
    END
WHERE zone_id = ? AND module_identifier = ?
```

**Couleurs Canvas V2** :
```javascript
const STATUS_COLORS = {
    'ok': '#10b981',      // Vert
    'warning': '#f59e0b', // Orange
    'critical': '#ef4444', // Rouge
    'pending': '#6b7280'  // Gris
}
```

---

## 📁 Fichiers à Modifier

### 🔴 Backend
1. **`src/modules/el/routes/modules.ts`** (303 lignes)
   - Remplacer toutes queries `el_modules` → `pv_modules`
   - Mapper colonnes `defect_type` → `el_defect_type`, etc.
   - Utiliser `zone_id` au lieu de `audit_token`
   - Ajouter calcul automatique `module_status`

2. **`src/modules/el/routes/audits.ts`**
   - Adapter si nécessaire (vérifier usage `el_audits`)

3. **`src/modules/el/index.ts`**
   - Ajouter route `/zone/:zoneId`

### 🟡 Frontend
4. **`src/index.tsx`** (Canvas V2)
   - ✅ Bouton "AUDIT EL" ajouté (ligne 3442)
   - ⏳ Remplacer alert par vraie navigation

5. **Interface Module EL** (à localiser ou créer)
   - Charger modules depuis `pv_modules`
   - Sauvegarder annotations dans colonnes `el_*`
   - Bouton "Retour Calepinage"

---

## 🧪 Tests de Validation

### Test 1 : Workflow Calepinage → EL → Retour
```bash
1. Créer zone + placer 10 modules (Canvas V2)
2. Vérifier pv_modules : 10 lignes, module_status='pending'
3. Cliquer "AUDIT EL"
4. Annoter 3 modules (1 dead, 2 microcrack)
5. Vérifier pv_modules : 
   - el_defect_type mis à jour
   - module_status : 1 'critical', 2 'warning'
6. Retour Canvas V2
7. Vérifier couleurs : 1 rouge, 2 orange, 7 gris
```

### Test 2 : API Endpoints
```bash
# Avant refactoring (ne fonctionne plus)
POST /api/el/audit/:token/module/:moduleId

# Après refactoring (nouveau)
POST /api/el/zone/:zoneId/module/:moduleId
Body: {
  module_identifier: "S1-P05",
  el_defect_type: "microcrack",
  el_severity_level: 2,
  el_notes: "Microfissure détectée coin sup gauche",
  el_photo_url: "https://..."
}

# Vérifier pv_modules
SELECT * FROM pv_modules WHERE module_identifier = 'S1-P05'
-- Résultat attendu:
-- el_defect_type = 'microcrack'
-- el_severity_level = 2
-- module_status = 'warning'
```

### Test 3 : Stats Dashboard
```bash
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN module_status = 'ok' THEN 1 ELSE 0 END) as ok,
  SUM(CASE WHEN module_status = 'warning' THEN 1 ELSE 0 END) as warning,
  SUM(CASE WHEN module_status = 'critical' THEN 1 ELSE 0 END) as critical,
  SUM(CASE WHEN el_defect_type IS NOT NULL THEN 1 ELSE 0 END) as analyzed
FROM pv_modules
WHERE zone_id = 1
```

---

## ⏱️ Estimation Totale

| Tâche | Durée |
|-------|-------|
| Refactoring Module EL (Backend) | 5-8h |
| Route Module EL avec zone_id (Frontend) | 2-3h |
| Tests workflow complet | 1-2h |
| Nettoyage code obsolète | 1h |
| **TOTAL** | **9-14h** |

---

## ✅ Critères de Réussite

- [ ] Module EL lit/écrit uniquement dans `pv_modules`
- [ ] Colonnes `el_*` utilisées correctement
- [ ] `module_status` synchronisé automatiquement
- [ ] Bouton "AUDIT EL" dans Canvas V2 fonctionne
- [ ] Bouton "Retour Calepinage" dans EL fonctionne
- [ ] Annotations EL visibles immédiatement dans Canvas V2
- [ ] Couleurs modules correctes (rouge/orange/vert/gris)
- [ ] Export PDF inclut annotations EL
- [ ] Table `el_modules` supprimée (obsolète)
- [ ] Workflow fluide sans rupture

---

## 🎯 Prochaine Action Immédiate

**Modifier `src/modules/el/routes/modules.ts`** :
- Remplacer toutes queries `el_modules` → `pv_modules`
- Mapper colonnes ancien → nouveau
- Utiliser `zone_id` au lieu de `audit_token`
- Ajouter calcul automatique `module_status`

**Temps estimé** : 5-8h développement + tests

---

**🔧 Prêt à commencer le refactoring Module EL ?**
