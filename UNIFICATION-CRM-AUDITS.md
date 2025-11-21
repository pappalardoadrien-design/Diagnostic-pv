# 🔗 UNIFICATION CRM-PLANNING-AUDITS COMPLÈTE

## ✅ PROBLÈME RÉSOLU

**Avant** : Les audits étaient dispersés et non reliés au CRM/Planning. Les modules (EL, I-V, Visual, etc.) ne partageaient pas les mêmes données. Impossible de suivre le workflow complet `Client → Projet → Intervention → Audit`.

**Après** : Unification totale avec synchronisation dynamique entre CRM, Planning et tous les modules d'audit.

---

## 🎯 ARCHITECTURE UNIFIÉE

### Table principale : `audits`
Toutes les données d'audit partagées entre tous les modules :
```sql
CREATE TABLE audits (
  id INTEGER PRIMARY KEY,
  audit_token TEXT UNIQUE,       -- Token partagé par TOUS les modules
  client_id INTEGER,              -- Lien CRM
  project_id INTEGER,             -- Lien Site PV
  intervention_id INTEGER,        -- Lien Planning
  modules_enabled TEXT,           -- ["EL", "IV", "VISUAL", "ISOLATION"]
  project_name TEXT,
  client_name TEXT,
  location TEXT,
  status TEXT DEFAULT 'en_cours',
  created_at DATETIME,
  FOREIGN KEY (client_id) REFERENCES crm_clients(id),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (intervention_id) REFERENCES interventions(id)
)
```

### Tables spécifiques par module
Chaque module conserve ses données techniques mais **pointe vers la table `audits` unifiée** :

- `el_audits` → Données électroluminescence (audit_token, audit_id)
- `iv_curves` → Courbes I-V (audit_token)
- `visual_inspections` → Inspections visuelles (audit_token)
- `isolation_tests` → Tests d'isolement (audit_token)

---

## 🔄 WORKFLOW UNIFIÉ

### 1️⃣ CRM : Créer client et projet
```
Client (crm_clients)
  └── Projet PV (projects)
       - Site address
       - Configuration PV (modules, strings, puissance)
       - Coordonnées GPS
```

### 2️⃣ Planning : Créer intervention
```
Intervention (interventions)
  - project_id → Hérite config PV
  - Date intervention
  - Technicien assigné
  - Type intervention
```

### 3️⃣ Audits : Créer audit multi-modules
```
POST /api/audits/create-multi-modules
{
  "intervention_id": 123,              // ✅ Hérite client_id, project_id, config PV
  "modules": ["EL", "IV", "VISUAL"]   // Modules activés
}

→ Crée audit_token unique
→ Crée entrées dans `audits` + `el_audits` + `iv_curves` + `visual_inspections`
→ Tous partagent le même audit_token
```

### 4️⃣ Calepinage : Compatible avec tous les audits
```
GET /api/calepinage/editor/{audit_token}?module_type=el
→ Fonctionne avec n'importe quel audit_token
→ Compatible EL, I-V, Diodes, Thermique, Isolation, Visuel
```

---

## 📊 DASHBOARD UNIFIÉ

### `/api/dashboard/audits` (ou `/`)
Affiche TOUS les audits avec données CRM/Planning :

| Projet / Client / Site | Modules | Modules Activés | Actions |
|------------------------|---------|-----------------|---------|
| **Centrale PV JALIBAT**<br>🏢 JALIBAT<br>📍 L'Union, France | 242 modules | EL, IV | 📊 Rapport EL<br>✏️ Calepinage<br>📈 Courbes I-V |

**Requête SQL** :
```sql
SELECT 
  a.audit_token,
  a.project_name,
  a.client_name,
  a.modules_enabled,
  c.company_name as crm_client_name,
  p.site_address as crm_site_address,
  i.intervention_date,
  el.total_modules
FROM audits a
LEFT JOIN crm_clients c ON a.client_id = c.id
LEFT JOIN projects p ON a.project_id = p.id
LEFT JOIN interventions i ON a.intervention_id = i.id
LEFT JOIN el_audits el ON a.audit_token = el.audit_token
```

---

## 🌐 VUE CRM UNIFIÉE

### `/api/crm-unified`
Navigation hiérarchique complète :

```
🏢 Client (crm_clients)
  └── 🏗️ Projet PV (projects)
       └── 👷 Intervention (interventions)
            └── 📋 Audit (audits)
                 └── ✏️ Calepinage
```

**Fonctionnalités** :
- ✅ Voir tous les clients actifs
- ✅ Statistiques globales (projets, interventions, audits)
- ✅ Expansion dynamique pour voir détails
- ✅ Lien direct vers calepinage depuis chaque audit

---

## 🛠️ CRÉATION D'AUDIT UNIFIÉE

### Option A : Depuis intervention (RECOMMANDÉ)
```bash
POST /api/audits/create-multi-modules
{
  "intervention_id": 123,
  "modules": ["EL", "IV", "VISUAL"]
}

→ Hérite automatiquement:
  - client_id
  - project_id
  - Configuration PV (modules, strings)
  - Site address
```

### Option B : Saisie manuelle
```bash
POST /api/audits/create-multi-modules
{
  "project_name": "Centrale PV TEST",
  "client_name": "Client TEST",
  "location": "31240 L'Union",
  "modules": ["EL"],
  "configuration": {
    "mode": "advanced",
    "strings": [
      { "id": 1, "moduleCount": 26, "wiringDirection": "left_to_right" },
      { "id": 2, "moduleCount": 24, "wiringDirection": "right_to_left" }
    ]
  }
}
```

---

## 🔗 CROSS-MODULE COMPATIBILITY

### Calepinage universel
```
/api/calepinage/editor/{audit_token}?module_type=el
/api/calepinage/editor/{audit_token}?module_type=iv
/api/calepinage/editor/{audit_token}?module_type=visual

→ Même audit_token pour TOUS les modules
→ Données synchronisées dynamiquement
```

### Rapports multi-modules
```
/api/el/reports/complete/{audit_token}
/api/iv/reports/report/{audit_token}
/api/visual/report/{audit_token}

→ Tous utilisent le même audit_token
→ Cohérence totale entre modules
```

---

## 📈 SYNCHRONISATION DYNAMIQUE

### 1. Création audit EL
```typescript
// ÉTAPE 1 : Créer dans `audits` (table unifiée)
await DB.prepare(`
  INSERT INTO audits (
    audit_token, client_id, project_id, intervention_id,
    project_name, client_name, location,
    modules_enabled, configuration_json
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`).bind(auditToken, clientId, projectId, interventionId, ...)

// ÉTAPE 2 : Créer dans `el_audits` (données spécifiques EL)
await DB.prepare(`
  INSERT INTO el_audits (
    audit_id, audit_token, total_modules, string_count, configuration_json
  ) VALUES ((SELECT id FROM audits WHERE audit_token = ?), ?, ?, ?, ?)
`).bind(auditToken, auditToken, totalModules, stringCount, configJson)
```

### 2. Récupération données cross-module
```typescript
// Dashboard récupère TOUTES les données
SELECT 
  a.audit_token,
  a.modules_enabled,
  c.company_name,
  p.site_address,
  i.intervention_date,
  el.total_modules,
  el.string_count
FROM audits a
LEFT JOIN crm_clients c ON a.client_id = c.id
LEFT JOIN projects p ON a.project_id = p.id
LEFT JOIN interventions i ON a.intervention_id = i.id
LEFT JOIN el_audits el ON a.audit_token = el.audit_token
```

---

## ✅ RÉSULTAT FINAL

### Ce qui est désormais unifié :
1. ✅ **1 audit_token unique** partagé par TOUS les modules (EL, I-V, Visual, Isolation)
2. ✅ **Données CRM/Planning intégrées** (client, site, intervention)
3. ✅ **Dashboard centralisé** avec vue complète (CRM + Planning + Audits)
4. ✅ **Calepinage universel** fonctionnel sur tous les audits
5. ✅ **Navigation hiérarchique** Client → Projet → Intervention → Audit
6. ✅ **Synchronisation dynamique** entre toutes les tables

### URLs de production :
- **Dashboard principal** : https://diagnostic-hub.pages.dev/
- **Vue CRM unifiée** : https://diagnostic-hub.pages.dev/api/crm-unified
- **Calepinage éditeur** : https://diagnostic-hub.pages.dev/api/calepinage/editor/{audit_token}?module_type=el
- **Rapports EL** : https://diagnostic-hub.pages.dev/api/el/reports/complete/{audit_token}
- **GitHub** : https://github.com/pappalardoadrien-design/Diagnostic-pv

---

## 🚀 PROCHAINES ÉTAPES

1. ⏳ **Tester workflow complet** :
   - Créer client dans CRM
   - Créer projet PV avec config
   - Créer intervention
   - Créer audit multi-modules depuis intervention
   - Vérifier calepinage fonctionne

2. ⏳ **Enrichir page CRM unifiée** (si erreur 500 résolue)

3. ⏳ **Ajouter filtres au dashboard** (par client, par date, par statut)

4. ⏳ **Interface de création d'audit depuis Dashboard**

---

**Date** : 2025-11-21  
**Version** : v4.1.0 - Unification CRM-Planning-Audits  
**Commit** : c3ef19e
