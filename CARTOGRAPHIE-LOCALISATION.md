# 🗺️ CARTOGRAPHIE - OÙ LA TROUVER ?

## ✅ **RÉPONSE : La cartographie est INTÉGRÉE dans le MODULE CALEPINAGE**

La cartographie n'est **pas un module séparé**, c'est le **système de calepinage EL** qui affiche visuellement les modules avec code couleur selon leur état.

---

## 📍 **ACCÈS À LA CARTOGRAPHIE**

### **1️⃣ Depuis le Dashboard Principal**

**URL Dashboard** : https://diagnostic-hub.pages.dev/

Dans la liste des audits, chaque audit EL a un bouton **"✏️ Calepinage"** qui ouvre la cartographie interactive.

### **2️⃣ URLs Directes**

#### **Cartographie JALIBAT (242 modules)**
```
https://diagnostic-hub.pages.dev/api/calepinage/editor/0e74eb29-69d7-4923-8675-32dbb8e926d1?module_type=el
```

#### **Cartographie TEST (100 modules)**
```
https://diagnostic-hub.pages.dev/api/calepinage/editor/c6343d13-2311-4a8f-909a-adf02e52d9ad?module_type=el
```

#### **Format Générique**
```
https://diagnostic-hub.pages.dev/api/calepinage/editor/{AUDIT_TOKEN}?module_type=el
```

---

## 🎨 **FONCTIONNALITÉS CARTOGRAPHIE**

### **Affichage Modules**
- **Couleurs selon sévérité** :
  - 🟢 **Vert** : Aucun défaut (none)
  - 🟡 **Jaune** : Défaut mineur (severity 1)
  - 🟠 **Orange** : Défaut modéré (severity 2)
  - 🔴 **Rouge** : Défaut sévère (severity 3+)
  - ⚪ **Gris** : Module non diagnostiqué (pending)

### **Organisation Visuelle**
- **Par string** : Modules groupés par string (S1, S2, S3...)
- **Position physique** : Reflète l'implantation réelle sur toiture
- **Flèches rouges** : Indiquent le sens de câblage
- **Rectangles rouges** : Délimitent les zones de câblage

### **Interactivité**
- **Clic sur module** : Affiche détails (ID, défaut, sévérité)
- **Édition en temps réel** : Modification statut depuis la cartographie
- **Zoom/déplacement** : Navigation fluide sur grandes installations

---

## 📊 **CARTOGRAPHIE DANS LES RAPPORTS**

La cartographie est également **intégrée dans les rapports PDF EL** :

```
https://diagnostic-hub.pages.dev/api/el/reports/complete/{AUDIT_TOKEN}
```

**Contenu rapport avec cartographie :**
- 📸 Vue cartographie centrale (modules colorés par sévérité)
- 📊 Statistiques défauts par type
- 🖼️ Top 10 photos critiques (embedded base64)
- 📈 Répartition visuelle des défauts
- ⚠️ Recommandations hiérarchisées

---

## 🗂️ **ARCHITECTURE BASE DE DONNÉES**

Les données de la cartographie proviennent de :

### **Tables Utilisées**
```sql
-- Table unifiée (tous audits)
audits (audit_token, project_name, client_name, modules_enabled)

-- Données EL spécifiques
el_audits (audit_token, total_modules, string_count)

-- Modules individuels avec positions physiques
el_modules (
  module_identifier,  -- Ex: S1-1, S2-5
  string_number,      -- Numéro de string
  position_in_string, -- Position dans la string
  physical_row,       -- Ligne physique sur toiture
  physical_col,       -- Colonne physique
  defect_type,        -- Type défaut (none, microcrack, dead_module...)
  severity_level      -- Sévérité (0-4)
)
```

### **Tables Cartographie PV (Réservées Future)**
```sql
-- Tables existantes mais non utilisées actuellement
pv_plants              -- Centrales PV
pv_modules             -- Modules physiques
pv_zones               -- Zones géographiques
pv_structures          -- Structures support
pv_cartography_audit_links  -- Liens audits-cartographie
```

---

## 🔗 **ROUTES API CARTOGRAPHIE**

| Route | Description | Statut |
|-------|-------------|--------|
| `GET /api/calepinage/editor/:token?module_type=el` | Éditeur interactif cartographie | ✅ HTTP 200 |
| `GET /api/calepinage/viewer/:token?module_type=el` | Vue SVG statique | ✅ HTTP 200 |
| `GET /api/calepinage/physical/:token` | Plan physique JALIBAT | ✅ HTTP 200 |
| `GET /api/calepinage/grid/:token` | Vue grille conforme toiture | ✅ HTTP 200 |
| `POST /api/calepinage/editor/:token/save` | Sauvegarder config câblage | ✅ Opérationnel |

---

## ✅ **TESTS VALIDÉS**

```bash
# Dashboard (liste audits avec boutons cartographie)
curl -I https://diagnostic-hub.pages.dev/api/dashboard/audits
# → HTTP 200 ✅

# Cartographie JALIBAT
curl -I https://diagnostic-hub.pages.dev/api/calepinage/editor/0e74eb29-69d7-4923-8675-32dbb8e926d1?module_type=el
# → HTTP 200 ✅

# Cartographie TEST
curl -I https://diagnostic-hub.pages.dev/api/calepinage/editor/c6343d13-2311-4a8f-909a-adf02e52d9ad?module_type=el
# → HTTP 200 ✅
```

---

## 🎯 **CONCLUSION**

**La cartographie N'A PAS DISPARU** ! Elle est **pleinement fonctionnelle** sous le nom **"Calepinage"**.

**Accès rapide** :
1. Aller sur https://diagnostic-hub.pages.dev/
2. Cliquer sur **"✏️ Calepinage"** pour n'importe quel audit EL
3. La cartographie s'ouvre avec modules colorés par sévérité

**Architecture unifiée** : Toutes les pages (Dashboard, CRM, Rapports, Calepinage) utilisent maintenant la table `audits` unifiée.

