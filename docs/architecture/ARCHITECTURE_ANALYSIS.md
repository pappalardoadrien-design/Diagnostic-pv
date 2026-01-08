# 🏗️ Analyse Architecture DiagPV Hub - État Complet

**Date**: 2025-11-03  
**Objectif**: Audit complet architecture modulaire + interconnexions

---

## 📊 Architecture Base de Données

### ✅ Tables Principales (Schéma Unifié)

#### 1. **CORE** (Hiérarchie projet)
```
clients
  └─ projects
       └─ interventions
            ├─ el_audits (Module EL)
            ├─ iv_measurements (Module IV)
            ├─ thermal_measurements (Module IR)
            ├─ isolation_tests (Module Isolation)
            ├─ visual_inspections (Module Visuel)
            └─ post_incident_expertise (Module Expertise)
```

#### 2. **PV CARTOGRAPHY** (Hiérarchie installation)
```
pv_plants (Centrales PV)
  └─ pv_zones (Zones/Toitures)
       └─ pv_modules (Modules avec GPS + EL + IR + IV)
```

### 🔗 Interconnexions Entre Modules

#### Table `pv_modules` - **HUB CENTRAL** ⭐

Cette table unique unifie TOUS les modules :

```sql
pv_modules
├── CARTOGRAPHIE (Canvas V2)
│   ├── module_identifier (S1-P01, S1-P02, ...)
│   ├── latitude, longitude (GPS absolu)
│   ├── pos_x_meters, pos_y_meters (GPS relatif)
│   ├── string_number, position_in_string
│   ├── width_meters, height_meters, rotation
│   └── power_wp
│
├── STATUT GLOBAL
│   ├── module_status (ok, warning, critical, pending)
│   └── status_comment
│
├── ÉLECTROLUMINESCENCE (Module EL) ✅
│   ├── el_photo_url
│   ├── el_defect_type (none, microcrack, dead_module, ...)
│   ├── el_severity_level (0-4)
│   ├── el_notes
│   ├── el_technician_id
│   └── el_analysis_date
│
├── THERMOGRAPHIE (Module futur)
│   ├── ir_photo_url
│   ├── ir_hotspot_temp
│   └── ir_analysis_date
│
└── COURBES IV (Module futur)
    ├── iv_curve_data (JSON)
    ├── iv_isc, iv_voc, iv_pmax
    ├── iv_fill_factor
    └── iv_analysis_date
```

**🎯 AVANTAGE MAJEUR** :
- **1 seul module = 1 seule ligne** dans `pv_modules`
- **Toutes les annotations** (EL, IR, IV) dans la même ligne
- **Cohérence garantie** : impossible de désynchroniser
- **Workflow fluide** : Calepinage → EL → IR → IV → Export PDF

---

## 🔄 Workflow Complet (Interconnecté)

### Phase 1 : **CALEPINAGE** (Canvas V2)
```
1. Créer centrale PV (pv_plants)
2. Créer zone toiture (pv_zones)
3. Option A: Placement manuel modules
   Option B: Import DXF OpenSolar
4. Sauvegarder dans pv_modules
   ✅ module_identifier, latitude, longitude créés
   ✅ module_status = 'pending' (défaut)
```

### Phase 2 : **AUDIT EL NOCTURNE** (Module EL)
```
5. Ouvrir zone depuis Canvas V2
6. Prendre photos électroluminescence
7. Annoter chaque module :
   - el_defect_type = 'microcrack' | 'dead_module' | ...
   - el_severity_level = 0-4
   - el_photo_url = URL photo
   - el_notes = commentaires
8. Sauvegarder annotations
   ✅ Même ligne pv_modules mise à jour
   ✅ module_status auto-calculé (critical si severity >= 3)
```

### Phase 3 : **THERMOGRAPHIE** (Module futur)
```
9. Ouvrir zone depuis Canvas V2
10. Prendre photos IR (drone/sol)
11. Annoter points chauds :
    - ir_photo_url
    - ir_hotspot_temp
12. Sauvegarder
    ✅ Même ligne pv_modules mise à jour
```

### Phase 4 : **COURBES IV** (Module futur)
```
13. Mesurer courbes I-V par string
14. Associer modules :
    - iv_curve_data (JSON)
    - iv_isc, iv_voc, iv_pmax
15. Sauvegarder
    ✅ Même ligne pv_modules mise à jour
```

### Phase 5 : **EXPORT PDF FINAL**
```
16. Générer rapport IEC 62446-1
    ✅ Toutes données dans pv_modules
    ✅ Carte calepinage avec modules colorés
    ✅ Photos EL, IR intégrées
    ✅ Graphes courbes IV
    ✅ Préconisations hiérarchisées
```

---

## 📁 Structure Modules Actuels

### ✅ Module Cartographie PV (Canvas V2)
- **Routes**: `/canvas-v2?plant_id=X&zone_id=Y`
- **Fichier**: `src/index.tsx` (lignes 400-6511)
- **Fonctionnalités**:
  - Leaflet map + Google Satellite
  - Placement modules (drag & drop)
  - Polygone toiture GPS
  - Configuration strings
  - Import DXF OpenSolar ✅ NOUVEAU
  - Sauvegarde pv_modules

**🔗 Connexions**:
- Lit/écrit `pv_modules` (latitude, longitude, module_identifier)
- Utilise `module_status` pour couleurs (ok=vert, critical=rouge)

### ✅ Module Électroluminescence (EL)
- **Routes**: `/api/el/*`
- **Fichier**: `src/modules/el/index.ts`
- **Fonctionnalités**:
  - Grille modules
  - Upload photos EL
  - Annotations défauts
  - Sévérité (0-4)
  - Export rapport

**🔗 Connexions**:
- ⚠️ **PROBLÈME ACTUEL**: Utilise `el_modules` (table séparée)
- ✅ **SOLUTION**: Doit lire/écrire `pv_modules` directement
- Colonnes à utiliser: `el_defect_type`, `el_severity_level`, `el_photo_url`, `el_notes`

### ✅ Module OpenSolar DXF Import
- **Routes**: `/opensolar`, `/api/opensolar/*`
- **Fichier**: `src/opensolar.tsx`
- **Fonctionnalités**:
  - Upload DXF OpenSolar
  - Parser layer PANELS
  - Conversion DXF → GPS
  - Visualisation Leaflet
  - Import bulk pv_modules

**🔗 Connexions**:
- Écrit directement dans `pv_modules`
- Génère `module_identifier` (S1-P01, S1-P02, ...)
- Crée `latitude`, `longitude` depuis zone référence

---

## ❌ Problèmes Identifiés

### 🔴 CRITIQUE : Module EL désynchronisé

**Problème**:
```sql
-- ❌ Module EL utilise table séparée
el_modules (el_audit_id, module_identifier, defect_type, severity_level, ...)
  vs
pv_modules (zone_id, module_identifier, el_defect_type, el_severity_level, ...)
```

**Impact**:
- Annotations EL ne remontent pas dans Canvas V2
- Module peut être annoté EL mais apparaître "pending" dans Canvas
- Désynchronisation données

**Solution**:
1. ✅ Migration 0009 appliquée (colonnes EL ajoutées)
2. ⏳ Modifier Module EL pour lire/écrire `pv_modules` directement
3. ⏳ Migrer données existantes `el_modules` → `pv_modules`
4. ⏳ Supprimer table `el_modules` (obsolète)

### 🟡 MOYEN : Navigation inter-modules manquante

**Problème**:
- Pas de boutons "Audit EL" depuis Canvas V2
- Pas de retour Canvas V2 depuis Module EL
- Utilisateur doit changer URL manuellement

**Solution**:
```html
<!-- Dans Canvas V2 -->
<button onclick="window.location='/el?zone_id=' + currentZoneId">
  <i class="fas fa-bolt"></i> Audit EL
</button>

<!-- Dans Module EL -->
<button onclick="window.location='/canvas-v2?zone_id=' + currentZoneId">
  <i class="fas fa-map"></i> Retour Calepinage
</button>
```

### 🟡 MOYEN : Code obsolète (Rectangle System)

**Problème**:
- `RectangleModuleGroup` (lignes 3780-3970) obsolète si DXF import validé
- `createModuleRectangle()` (lignes 4954-4998) inutilisé si DXF uniquement

**Solution**:
- Garder Rectangle system comme fallback (pas de DXF disponible)
- Documenter choix : DXF (recommandé) vs Manuel (fallback)

### 🟢 FAIBLE : Routes mortes

**Problème**:
- Anciennes routes `/api/audit/:token/*` (PVserv parser)
- Utilisées ? À vérifier

**Solution**:
- Audit usage (logs, grep code)
- Supprimer si unused
- Ou documenter comme legacy

---

## ✅ Actions Prioritaires

### 🔴 Priorité 1 : Réparer interconnexion EL ↔ Calepinage

**Tâches**:
1. ✅ Migration 0009 appliquée (colonnes EL dans pv_modules)
2. ⏳ Modifier Module EL :
   - Remplacer queries `el_modules` → `pv_modules`
   - Utiliser colonnes `el_*` au lieu de `defect_type`, `severity_level`
   - Join par `module_identifier` + `zone_id`
3. ⏳ Migrer données existantes (script SQL migration)
4. ⏳ Tester workflow : Canvas V2 → Audit EL → Retour Canvas V2

### 🟡 Priorité 2 : Navigation cohérente

**Tâches**:
1. Ajouter boutons inter-modules :
   - Canvas V2 → EL
   - EL → Canvas V2
   - Canvas V2 → OpenSolar DXF
2. Créer menu navigation global (sidebar)
3. Breadcrumbs : Plant > Zone > Module

### 🟡 Priorité 3 : Nettoyage code

**Tâches**:
1. Audit usage Rectangle system
2. Documenter choix DXF vs Manuel
3. Supprimer routes mortes
4. Commenter sections obsolètes

### 🟢 Priorité 4 : Documentation

**Tâches**:
1. Diagramme architecture (Mermaid)
2. Guide interconnexions modules
3. Roadmap modules futurs (IR, IV)

---

## 📋 Roadmap Initiale vs État Actuel

### ✅ Phase 1 : Foundation (COMPLÉTÉ)
- [x] Base de données unifiée
- [x] Architecture modulaire
- [x] Module EL standalone
- [x] Module Cartographie PV

### 🔄 Phase 2 : Interconnexions (EN COURS)
- [x] Table `pv_modules` unifiée
- [x] Colonnes EL ajoutées
- [x] Import DXF OpenSolar
- [ ] **Module EL utilise pv_modules** ⏳
- [ ] Navigation inter-modules ⏳

### ⏳ Phase 3 : Modules Futurs (PLANIFIÉ)
- [ ] Module Thermographie (IR)
- [ ] Module Courbes IV
- [ ] Module Rapports Finaux PDF

### ⏳ Phase 4 : Production (PLANIFIÉ)
- [ ] Tests end-to-end
- [ ] Déploiement Cloudflare Pages
- [ ] Formation utilisateurs

---

## 🎯 Conclusion

### ✅ Points Forts
- Architecture modulaire bien définie
- Table `pv_modules` hub central intelligent
- Migrations propres et versionnées
- OpenSolar DXF import fonctionnel
- Canvas V2 calepinage opérationnel

### ⚠️ Points Faibles
- Module EL désynchronisé (priorité absolue)
- Pas de navigation inter-modules
- Code obsolète non nettoyé

### 🚀 Prochaines Étapes Immédiates

1. **Réparer Module EL** (2-3h)
   - Modifier queries pour utiliser `pv_modules`
   - Migrer données existantes
   - Tester workflow complet

2. **Ajouter navigation** (1h)
   - Boutons inter-modules
   - Breadcrumbs

3. **Intégrer OpenSolar dans Canvas V2** (1h)
   - Bouton "Import DXF"
   - Modal upload

4. **Documenter architecture finale** (1h)
   - Diagrammes
   - Guide utilisateur

**Total estimé : 5-6h développement**

---

**🎯 Objectif Final** : Workflow fluide et cohérent  
**Calepinage → Audit EL → Annotations → Export PDF IEC 62446-1**

_Sans rupture, sans désynchronisation, sans perte de données._
