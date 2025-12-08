# DIAGNOSTIC COHÉRENCE MODULES - 2025-12-08

## 🔍 ANALYSE COMPLÈTE

### ✅ Modules liés à `audit_token` (COHÉRENTS)

| Module | Table(s) | Clé | Statut |
|--------|----------|-----|--------|
| **EL - Électroluminescence** | `el_audits`, `el_modules` | `audit_token` | ✅ 100% |
| **I-V - Courbes I-V** | `iv_measurements` | `audit_token` | ✅ 100% |
| **Visual - Inspections** | `visual_inspections` | `audit_token` | ✅ 100% |
| **Isolation - Tests** | `isolation_tests` | `audit_token` | ✅ 100% |
| **Thermique - IR** | `thermal_measurements` | `audit_token` | ✅ 100% |
| **Photos** | `photos` | `audit_token` | ✅ 100% |
| **Calepinage - Éditeur** | `calepinage_layouts` | `project_id` (= `audit_token`) | ✅ 100% |
| **Shared Config** | `shared_configurations` | `audit_token` | ✅ 100% |

### ⚠️ Modules SÉPARÉS (Architecture différente)

| Module | Table(s) | Clé | Raison |
|--------|----------|-----|--------|
| **PV Carto** | `pv_plants`, `pv_zones`, `pv_modules` | `plant_id` | ⚠️ Système SÉPARÉ pour cartographie globale |
| **Designer Satellite** | `designer_layouts` | `project_id` (pas audit) | ⚠️ Outil INDÉPENDANT Google Maps |

### 🎯 CONCLUSION

#### Architecture CORRECTE mais à clarifier :

1. **Modules Audit** (liés à `audit_token`) :
   - ✅ EL, I-V, Visual, Isolation, Thermique
   - ✅ Tous utilisent `audit_token` comme clé unique
   - ✅ Interconnexions dynamiques via `shared_configurations`

2. **Modules Cartographie** (architecture séparée) :
   - **PV Carto** : Base de données GLOBALE de centrales PV
     - Utilisé pour : cataloguer centrales, zones, modules
     - **Indépendant des audits** (un audit peut analyser UNE centrale)
   - **Designer Satellite** : Outil conception cartographie Google Maps
     - Utilisé pour : planifier layouts avant construction
     - **Indépendant des audits** (outil de pre-audit)

### 🔧 RECOMMANDATIONS

#### Option A : Tout lier à `audit_token` (COMPLEXE)
```sql
-- Ajouter audit_token à pv_plants
ALTER TABLE pv_plants ADD COLUMN audit_token TEXT;
ALTER TABLE designer_layouts ADD COLUMN audit_token TEXT;

-- Problème : Une centrale peut avoir plusieurs audits dans le temps
-- → Relation 1-to-many complexe
```

#### Option B : Garder architecture actuelle (RECOMMANDÉ) ✅
```
Workflow naturel :
1. Designer Satellite → Planifier layout (AVANT audit)
2. PV Carto → Cataloguer centrale existante
3. Audit Multi-Modules → Analyser avec EL/IV/Visual/Isolation
4. Calepinage → Éditer cartographie spécifique audit
```

### 📋 PROBLÈMES RÉELS À CORRIGER

#### 1. Page `/audits/create` - Mode CONFIG AVANCÉE manquant ❌
```javascript
// Problème : Bouton "CONFIG AVANCÉE" non géré dans JavaScript
document.getElementById('btn-mode-advanced').addEventListener('click', () => {
  // CODE MANQUANT !
})
```

#### 2. Page `/audits/create` - Aucune intervention ❌
```javascript
// Problème : Si 0 interventions → page bloquée
// Solution : Activer automatiquement mode MANUEL si aucune intervention
```

#### 3. Modules Carto/Designer pas accessibles depuis audits ⚠️
```
Problème : Utilisateur ne comprend pas comment accéder PV Carto depuis audit
Solution : Ajouter liens clairs dans interface audit
```

### ✅ PLAN D'ACTION IMMÉDIAT

1. ✅ Corriger `audits-create.tsx` :
   - Restaurer mode CONFIG AVANCÉE complet
   - Gérer 0 interventions (mode manuel par défaut)
   - Améliorer UX boutons mode

2. ⏳ Clarifier navigation modules :
   - Ajouter bouton "📍 Cartographie Centrale" dans page audit
   - Lier PV Carto quand centrale connue
   - Expliquer différence Calepinage (audit) vs PV Carto (global)

3. ⏳ Documentation utilisateur :
   - Expliquer workflow complet
   - Designer → PV Carto → Audit → Calepinage

---

**Architecture VALIDÉE : Modules cohérents avec audit_token ✅**  
**Modules Carto/Designer : Architecture séparée INTENTIONNELLE ✅**  
**Problème réel : Page création audit incomplète ❌**
