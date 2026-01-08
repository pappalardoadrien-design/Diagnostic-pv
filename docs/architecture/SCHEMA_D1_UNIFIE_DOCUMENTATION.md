# Documentation Schéma D1 Unifié DiagPV

**Version**: 2.0.0  
**Date**: 2025-10-27  
**Migration**: 0002_unified_schema.sql  
**Architecture**: Monolithe modulaire scalable

---

## 📋 VUE D'ENSEMBLE

### Objectif
Schéma D1 unifié pour la plateforme DiagPV supportant **6 modules diagnostics** :
1. ✅ **Électroluminescence (EL)** - En production
2. ⏳ **Courbes I-V** - Q1 2026
3. ⏳ **Thermographie** - Q2 2026
4. ⏳ **Isolation** - Q3 2026
5. ⏳ **Contrôles Visuels** - Q4 2026
6. ⏳ **Expertise Post-Sinistre** - 2027

### Principes Architecture
- **Tables CORE communes** : users, clients, projects, interventions
- **Tables MODULE spécifiques** : el_*, iv_*, thermal_*, isolation_*, visual_*, post_incident_*
- **Liaison hiérarchique** : clients → projects → interventions → mesures modules
- **Compatibilité ascendante** : audit_token préservé pour URLs existantes
- **Scalabilité** : Ajout nouveaux modules sans impact existants

---

## 🏗️ STRUCTURE TABLES

### 📊 Tables Core (4 tables)

#### 1. `users` - Techniciens certifiés DiagPV
```sql
id, email, name, role, certification_level, phone, is_active,
created_at, updated_at
```

**Colonnes clés** :
- `role` : 'admin', 'technician', 'viewer'
- `certification_level` : 'N1', 'N2', 'N3'

**Relations** :
- → interventions (technicien assigné)
- → el_modules (technicien diagnostic)

#### 2. `clients` - Clients installations PV
```sql
id, name, contact_email, contact_phone, address, siret, notes,
created_at, updated_at
```

**Relations** :
- → projects (client possède N projets)

#### 3. `projects` - Installations photovoltaïques
```sql
id, client_id, name, site_address, installation_power, 
inverter_model, module_model, installation_date, commissioning_date,
string_count, modules_per_string, total_modules,
latitude, longitude, notes, created_at, updated_at
```

**Colonnes clés** :
- `installation_power` : Puissance installée (kWc)
- `string_count` × `modules_per_string` = `total_modules`
- `latitude`, `longitude` : Coordonnées GPS site

**Relations** :
- → interventions (projet a N interventions)

#### 4. `interventions` - Missions techniques
```sql
id, project_id, technician_id, intervention_type, intervention_date,
duration_hours, status, weather_conditions, temperature_ambient, 
irradiance, notes, report_url, created_at, updated_at
```

**Colonnes clés** :
- `intervention_type` : 'el', 'iv', 'thermique', 'isolation', 'visuels', 'expertise'
- `status` : 'scheduled', 'in_progress', 'completed', 'cancelled'
- `irradiance` : W/m² (conditions mesure)

**Relations** :
- → el_audits, iv_measurements, thermal_measurements, etc. (intervention génère mesures)

---

### ⚡ Module EL - Électroluminescence (3 tables)

#### 1. `el_audits` - Audits EL
```sql
id, intervention_id, audit_token, project_name, client_name, location,
string_count, modules_per_string, total_modules, configuration_json,
plan_file_url, status, completion_rate, created_at, updated_at
```

**Migration depuis anciennes données** :
- Ancienne table `audits` → `el_audits`
- `audit_token` préservé pour compatibilité URLs
- `intervention_id` nullable (sera rempli après liaison projects)

**Colonnes calculées** :
- `completion_rate` : % modules diagnostiqués (trigger automatique)

**Statuts** :
- 'created', 'in_progress', 'completed', 'archived'

#### 2. `el_modules` - Modules EL diagnostiqués
```sql
id, el_audit_id, audit_token, module_identifier, string_number, 
position_in_string, defect_type, severity_level, comment, technician_id,
physical_row, physical_col, image_url, created_at, updated_at
```

**Migration depuis anciennes données** :
- Ancienne table `modules` → `el_modules`
- Mapping statuts :
  - `"ok"` → `defect_type = "none"` + `severity_level = 0`
  - `"microcracks"` → `defect_type = "microcrack"` + `severity_level = 2`
  - `"dead"` → `defect_type = "dead_module"` + `severity_level = 3`
  - `"inequality"` → `defect_type = "luminescence_inequality"` + `severity_level = 1`

**Types défauts** :
- 'none', 'microcrack', 'dead_module', 'luminescence_inequality', 'pid', 'diode_failure'

**Niveaux sévérité** :
- 0 = OK
- 1 = Mineur (inequality)
- 2 = Moyen (microcrack)
- 3 = Critique (dead_module)

#### 3. `el_collaborative_sessions` - Sessions temps réel
```sql
id, audit_token, technician_id, last_activity, is_active, cursor_position,
created_at
```

**Usage** : Multi-techniciens simultanés sur même audit

---

### 📈 Module I-V - Courbes Intensité-Tension (1 table)

#### `iv_measurements` - Mesures I-V
```sql
id, intervention_id, string_number, module_number, measurement_type,
isc, voc, pmax, impp, vmpp, fill_factor,
irradiance, temperature_module, temperature_ambient,
iv_curve_data, pmax_stc_corrected, deviation_from_datasheet,
rs, rsh, notes, created_at
```

**Paramètres électriques** :
- `isc` : Courant court-circuit (A)
- `voc` : Tension circuit ouvert (V)
- `pmax` : Puissance maximale (W)
- `fill_factor` : Facteur de forme (%)

**Analyse STC** :
- `pmax_stc_corrected` : Pmax corrigée conditions standard (W)
- `deviation_from_datasheet` : Écart vs constructeur (%)

**Types mesures** :
- 'bright' : Sous irradiance
- 'dark' : Courbe sombre

---

### 🌡️ Module Thermographie (1 table)

#### `thermal_measurements` - Mesures thermiques
```sql
id, intervention_id, measurement_method, temperature_max, temperature_min,
temperature_avg, delta_t_max, string_number, module_number,
gps_latitude, gps_longitude, thermal_image_url, thermal_map_url,
visible_image_url, defect_type, severity_level, notes, created_at
```

**Méthodes** :
- 'drone' : Thermographie drone
- 'handheld' : Caméra thermique portable

**Paramètres thermiques** :
- `delta_t_max` : Écart max vs température moyenne (°C)
- `temperature_max` : Température maximale détectée (°C)

**Types défauts** :
- 'hotspot', 'bypass_diode_failure', 'connection_issue', 'soiling', 'none'

---

### 🔌 Module Isolation (1 table)

#### `isolation_tests` - Tests isolement électrique
```sql
id, intervention_id, test_type, test_voltage, resistance_value,
pass_threshold, test_result, string_number, measurement_point,
compliance_standard, notes, created_at
```

**Types tests** :
- 'dc_isolation' : Isolement DC
- 'ground_continuity' : Continuité terre
- 'polarity' : Polarité

**Points mesure** :
- 'positive_to_ground', 'negative_to_ground', 'positive_to_negative'

**Normes** :
- 'NF C 15-100', 'UTE C 15-712-1', 'IEC 62446-1'

**Résultats** :
- 'pass' : Conforme (≥ 1 MΩ)
- 'fail' : Non conforme
- 'warning' : Limite

---

### 👁️ Module Contrôles Visuels (1 table)

#### `visual_inspections` - Inspections visuelles
```sql
id, intervention_id, inspection_type, string_number, module_number,
location_description, defect_found, defect_type, severity_level,
photo_url, gps_latitude, gps_longitude, corrective_action_required,
corrective_action_description, notes, created_at
```

**Types inspection** :
- 'modules', 'structure', 'cabling', 'inverter', 'protections'

**Types défauts** :
- 'corrosion', 'glass_breakage', 'delamination', 'soiling', 'shading', 
  'loose_connection', 'missing_label'

---

### 🔥 Module Expertise Post-Sinistre (1 table)

#### `post_incident_expertise` - Expertises sinistres
```sql
id, intervention_id, incident_date, incident_type, root_cause,
contributing_factors, affected_modules_count, affected_strings_count,
estimated_power_loss_kw, estimated_production_loss_kwh_year,
estimated_financial_loss_eur, incident_photos_urls, insurance_report_url,
expert_report_url, safety_hazard, immediate_actions_required,
repair_recommendations, prevention_recommendations, notes, created_at
```

**Types sinistres** :
- 'fire', 'storm', 'hail', 'lightning', 'electrical_failure', 'water_damage'

**Analyse pertes** :
- `estimated_power_loss_kw` : Perte puissance (kWc)
- `estimated_production_loss_kwh_year` : Perte production annuelle (kWh/an)
- `estimated_financial_loss_eur` : Perte financière (€)

---

## 🔗 RELATIONS TABLES

### Hiérarchie principale
```
clients (1)
  └── projects (N)
        └── interventions (N)
              ├── el_audits (1)
              │     └── el_modules (N)
              ├── iv_measurements (N)
              ├── thermal_measurements (N)
              ├── isolation_tests (N)
              ├── visual_inspections (N)
              └── post_incident_expertise (1)
```

### Clés étrangères
- `projects.client_id` → `clients.id` (CASCADE)
- `interventions.project_id` → `projects.id` (CASCADE)
- `interventions.technician_id` → `users.id`
- `el_audits.intervention_id` → `interventions.id` (SET NULL)
- `el_modules.el_audit_id` → `el_audits.id` (CASCADE)
- `el_modules.technician_id` → `users.id`
- `iv_measurements.intervention_id` → `interventions.id` (CASCADE)
- `thermal_measurements.intervention_id` → `interventions.id` (CASCADE)
- `isolation_tests.intervention_id` → `interventions.id` (CASCADE)
- `visual_inspections.intervention_id` → `interventions.id` (CASCADE)
- `post_incident_expertise.intervention_id` → `interventions.id` (CASCADE)

---

## 📊 INDEX PERFORMANCE

### Index tables CORE (8 index)
- `idx_users_email`, `idx_users_role`
- `idx_clients_name`
- `idx_projects_client`
- `idx_interventions_project`, `idx_interventions_technician`, 
  `idx_interventions_type`, `idx_interventions_date`

### Index Module EL (10 index)
- `idx_el_audits_token`, `idx_el_audits_intervention`, `idx_el_audits_status`, `idx_el_audits_created`
- `idx_el_modules_audit_id`, `idx_el_modules_audit_token`, `idx_el_modules_string`, 
  `idx_el_modules_defect`, `idx_el_modules_severity`
- `idx_el_sessions_audit`, `idx_el_sessions_active`

### Index autres modules (10 index)
- I-V : `idx_iv_intervention`, `idx_iv_string`
- Thermique : `idx_thermal_intervention`, `idx_thermal_defect`, `idx_thermal_severity`
- Isolation : `idx_isolation_intervention`, `idx_isolation_result`
- Visuels : `idx_visual_intervention`, `idx_visual_defect_found`, `idx_visual_severity`
- Expertise : `idx_expertise_intervention`, `idx_expertise_incident_type`, `idx_expertise_incident_date`

**Total** : 28 index pour requêtes optimisées

---

## ⚙️ TRIGGERS AUTOMATIQUES

### Mise à jour timestamps (6 triggers)
- `update_users_timestamp`
- `update_clients_timestamp`
- `update_projects_timestamp`
- `update_interventions_timestamp`
- `update_el_audits_timestamp`
- `update_el_modules_timestamp`

### Calculs automatiques (1 trigger)
- `update_el_audit_completion_rate` : Recalcule % modules diagnostiqués après chaque MAJ module

---

## 📈 VUES PRÉCALCULÉES

### 1. `v_el_audit_statistics` - Stats Module EL par audit
```sql
SELECT audit_id, audit_token, project_name, client_name, total_modules,
       completion_rate, modules_diagnosed, modules_ok, modules_microcrack,
       modules_dead, modules_inequality, modules_critical, ...
```

**Usage** : Dashboard Module EL, liste audits avec statistiques temps réel

### 2. `v_dashboard_overview` - Dashboard global tous modules
```sql
SELECT project_id, project_name, client_name, installation_power, 
       total_modules, total_interventions, interventions_el, interventions_iv,
       interventions_thermique, interventions_isolation, interventions_visuels,
       interventions_expertise, last_intervention_date, ...
```

**Usage** : Page d'accueil HUB, vue projet cross-modules

---

## 🔄 MIGRATION DONNÉES EXISTANTES

### Étape 1 : Créer clients/projets fictifs
```sql
-- Extraire clients uniques depuis el_audits
INSERT INTO clients (name, contact_email)
SELECT DISTINCT client_name, NULL
FROM el_audits;

-- Créer projets depuis audits
INSERT INTO projects (client_id, name, site_address, string_count, 
                     modules_per_string, total_modules)
SELECT c.id, ea.project_name, ea.location, ea.string_count,
       ea.modules_per_string, ea.total_modules
FROM el_audits ea
JOIN clients c ON c.name = ea.client_name;
```

### Étape 2 : Créer interventions fictives
```sql
-- Une intervention EL par audit existant
INSERT INTO interventions (project_id, technician_id, intervention_type,
                          intervention_date, status)
SELECT p.id, 1, 'el', ea.created_at, 'completed'
FROM el_audits ea
JOIN projects p ON p.name = ea.project_name;
```

### Étape 3 : Lier audits aux interventions
```sql
UPDATE el_audits
SET intervention_id = (
  SELECT i.id 
  FROM interventions i 
  JOIN projects p ON i.project_id = p.id
  WHERE p.name = el_audits.project_name 
  AND i.intervention_type = 'el'
  LIMIT 1
);
```

### Étape 4 : Migrer modules avec transformation statuts
```sql
-- Transformer statuts et calculer severity_level
UPDATE el_modules
SET 
  defect_type = CASE 
    WHEN defect_type = 'ok' THEN 'none'
    WHEN defect_type = 'microcracks' THEN 'microcrack'
    WHEN defect_type = 'dead' THEN 'dead_module'
    WHEN defect_type = 'inequality' THEN 'luminescence_inequality'
    ELSE defect_type
  END,
  severity_level = CASE 
    WHEN defect_type = 'ok' THEN 0
    WHEN defect_type = 'inequality' THEN 1
    WHEN defect_type = 'microcracks' THEN 2
    WHEN defect_type = 'dead' THEN 3
    ELSE 0
  END;
```

---

## 🚀 ROUTES API FUTURES

### Routes Module EL (compatibilité + nouvelles)
```
GET  /api/el/dashboard/audits          # Liste audits avec stats
GET  /api/el/audit/:token               # Détails audit
POST /api/el/audit/create               # Créer audit
POST /api/el/module/update              # Mettre à jour diagnostic module
GET  /api/el/report/:token              # Générer rapport PDF
```

### Routes Core (nouvelles)
```
GET  /api/clients                       # Liste clients
GET  /api/clients/:id/projects          # Projets client
GET  /api/projects/:id                  # Détails projet
GET  /api/projects/:id/interventions    # Interventions projet
GET  /api/interventions/:id             # Détails intervention
```

### Routes modules futurs
```
# Module I-V
POST /api/iv/measurement/create
GET  /api/iv/string/:stringId

# Module Thermique
POST /api/thermique/measurement/create
GET  /api/thermique/hotspots/:projectId

# Module Isolation
POST /api/isolation/test/create
GET  /api/isolation/results/:projectId

# Module Visuels
POST /api/visuels/inspection/create
GET  /api/visuels/checklist/:projectId

# Module Expertise
POST /api/expertise/incident/create
GET  /api/expertise/analysis/:incidentId
```

---

## ✅ AVANTAGES SCHÉMA UNIFIÉ

### 1. Cohérence données
- ✅ Source unique vérité (clients, projects, interventions)
- ✅ Garantie intégrité référentielle (foreign keys)
- ✅ Pas de duplication données

### 2. Scalabilité
- ✅ Ajout nouveaux modules sans impact existants
- ✅ Requêtes cross-modules performantes (index optimisés)
- ✅ Évolution schéma progressive (migrations)

### 3. Maintenance simplifiée
- ✅ Une seule base D1 à gérer
- ✅ Triggers automatiques cohérence
- ✅ Vues précalculées dashboards

### 4. Expérience utilisateur
- ✅ Navigation fluide entre modules
- ✅ Vision projet complète (tous diagnostics)
- ✅ Historique interventions centralisé

---

## 📝 PROCHAINES ÉTAPES

### Phase actuelle : Point 2.2
- Application migration locale `--local`
- Tests intégrité schéma
- Validation structure

### Phase suivante : Point 3.1-3.2
- Script migration données TypeScript
- Import données production (462 modules)
- Validation 100% données migrées

---

**Documentation générée lors du Point 2.1 - Conception Schéma D1 Unifié**  
**Schéma prêt pour application locale et tests**
