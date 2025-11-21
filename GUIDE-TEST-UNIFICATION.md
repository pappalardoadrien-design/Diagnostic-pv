# 🧪 GUIDE DE TEST - UNIFICATION CRM-PLANNING-AUDITS

## ✅ Validation du système unifié

Ce guide vous permet de **tester et valider** que l'unification CRM-Planning-Audits fonctionne correctement.

---

## 📊 État actuel du système

### URLs de production
- **Dashboard principal** : https://diagnostic-hub.pages.dev/
- **Dashboard audits** : https://diagnostic-hub.pages.dev/api/dashboard/audits
- **Vue CRM unifiée** : https://diagnostic-hub.pages.dev/api/crm-unified
- **GitHub** : https://github.com/pappalardoadrien-design/Diagnostic-pv

### Audits de test disponibles

| Audit Token | Projet | Modules | Calepinage |
|-------------|--------|---------|------------|
| `0e74eb29-69d7-4923-8675-32dbb8e926d1` | **JALIBAT** (242 modules) | EL | ✅ [Éditeur](https://diagnostic-hub.pages.dev/api/calepinage/editor/0e74eb29-69d7-4923-8675-32dbb8e926d1?module_type=el) |
| `c6343d13-2311-4a8f-909a-adf02e52d9ad` | **TEST UNIFICATION 2025** (100 modules) | EL | ✅ [Éditeur](https://diagnostic-hub.pages.dev/api/calepinage/editor/c6343d13-2311-4a8f-909a-adf02e52d9ad?module_type=el) |

---

## 🧪 TEST 1 : Dashboard unifié

### ✅ Ce qui doit être visible

1. **Ouvrir** : https://diagnostic-hub.pages.dev/

2. **Vérifier** :
   - ✅ Redirection automatique vers `/api/dashboard/audits`
   - ✅ Liste de TOUS les audits (JALIBAT, LES FORGES, TEST UNIFICATION 2025, etc.)
   - ✅ Pour chaque audit :
     - **Projet / Client / Site** : Nom du projet, client, localisation
     - **Modules** : Nombre de modules (242, 100, etc.)
     - **Modules Activés** : Badges (EL, IV, VISUAL, etc.)
     - **Actions** : Boutons Rapport EL, Calepinage, Courbes I-V

3. **Statistiques globales** :
   - Audits Total
   - Modules Total
   - Complétés
   - En Cours

4. **Bouton "Vue CRM Unifiée"** : Doit être visible en haut

---

## 🧪 TEST 2 : Création d'audit unifié

### Option A : Via API (RECOMMANDÉ pour test)

```bash
curl -X POST "https://diagnostic-hub.pages.dev/api/el/audit/create" \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "TEST VOTRE NOM",
    "clientName": "Client Test",
    "location": "Toulouse, France",
    "configuration": {
      "mode": "simple",
      "stringCount": 3,
      "modulesPerString": 15,
      "totalModules": 45
    }
  }'
```

**Résultat attendu** :
```json
{
  "success": true,
  "auditToken": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "auditUrl": "/audit/...",
  "totalModules": 45,
  "configuration": "simple",
  "message": "Audit créé avec succès"
}
```

### Option B : Via script Bash interactif

```bash
cd /home/user/webapp
./create-audit-advanced.sh
```

Suivre les instructions à l'écran.

---

## 🧪 TEST 3 : Vérification unification tables

### 1. Vérifier table `audits` (unifiée)

```bash
wrangler d1 execute diagnostic-hub-production --remote \
  --command="SELECT audit_token, project_name, client_name, modules_enabled FROM audits ORDER BY created_at DESC LIMIT 5"
```

**Ce qui doit être visible** :
- ✅ Colonne `modules_enabled` : `["EL"]` ou `["EL","IV"]`
- ✅ Derniers audits créés apparaissent

### 2. Vérifier table `el_audits` (données EL)

```bash
wrangler d1 execute diagnostic-hub-production --remote \
  --command="SELECT audit_token, audit_id, total_modules, string_count FROM el_audits ORDER BY created_at DESC LIMIT 5"
```

**Ce qui doit être visible** :
- ✅ Colonne `audit_id` : Référence vers `audits.id`
- ✅ Même `audit_token` que dans table `audits`

### 3. Vérifier liaison entre tables

```bash
wrangler d1 execute diagnostic-hub-production --remote \
  --command="SELECT a.audit_token, a.project_name, el.total_modules, el.string_count FROM audits a LEFT JOIN el_audits el ON a.audit_token = el.audit_token LIMIT 5"
```

**Ce qui doit être visible** :
- ✅ Données des 2 tables jointes
- ✅ Correspondance `audit_token` entre `audits` et `el_audits`

---

## 🧪 TEST 4 : Calepinage universel

### Test avec JALIBAT (242 modules)

1. **Ouvrir** : https://diagnostic-hub.pages.dev/api/calepinage/editor/0e74eb29-69d7-4923-8675-32dbb8e926d1?module_type=el

2. **Vérifier** :
   - ✅ Affichage de 242 modules (sidebar gauche)
   - ✅ Modules organisés par string (S1 à S10)
   - ✅ Canvas avec modules positionnés automatiquement
   - ✅ Flèches rouges de câblage
   - ✅ Zones rectangulaires rouges de groupement
   - ✅ Outils : Sélection, Déplacer, Flèche, Zone
   - ✅ Boutons : Save, Load, Export JSON, Clear All

### Test avec TEST UNIFICATION 2025 (100 modules)

1. **Ouvrir** : https://diagnostic-hub.pages.dev/api/calepinage/editor/c6343d13-2311-4a8f-909a-adf02e52d9ad?module_type=el

2. **Vérifier** :
   - ✅ Affichage de 100 modules
   - ✅ Modules organisés en 5 strings (S1 à S5)
   - ✅ Layout automatique généré

---

## 🧪 TEST 5 : Cross-module compatibility

### Même audit_token pour tous les modules

**Token de test** : `c6343d13-2311-4a8f-909a-adf02e52d9ad`

#### Calepinage EL
```
https://diagnostic-hub.pages.dev/api/calepinage/editor/c6343d13-2311-4a8f-909a-adf02e52d9ad?module_type=el
```
✅ Doit afficher les 100 modules EL

#### Rapport EL
```
https://diagnostic-hub.pages.dev/api/el/reports/complete/c6343d13-2311-4a8f-909a-adf02e52d9ad
```
✅ Doit afficher le rapport EL complet

#### Courbes I-V (si activé)
```
https://diagnostic-hub.pages.dev/api/iv/reports/report/c6343d13-2311-4a8f-909a-adf02e52d9ad
```
⚠️ Peut retourner 404 si module I-V non activé (normal)

---

## 🧪 TEST 6 : Workflow CRM complet (à venir)

### 1️⃣ Créer client CRM

```bash
curl -X POST "https://diagnostic-hub.pages.dev/api/crm/clients" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "TotalEnergies Test",
    "client_type": "industrial",
    "city": "Paris",
    "main_contact_name": "Jean Dupont",
    "main_contact_email": "j.dupont@test.fr",
    "status": "active"
  }'
```

### 2️⃣ Créer projet PV

```bash
curl -X POST "https://diagnostic-hub.pages.dev/api/crm/projects" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": 1,
    "name": "Centrale PV Test 2025",
    "site_address": "123 Rue Test, 31000 Toulouse",
    "installation_power": 80.0,
    "total_modules": 242,
    "string_count": 10,
    "modules_per_string": 24
  }'
```

### 3️⃣ Créer intervention

```bash
curl -X POST "https://diagnostic-hub.pages.dev/api/planning/interventions" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": 1,
    "intervention_type": "AUDIT_EL",
    "intervention_date": "2025-11-25",
    "status": "scheduled"
  }'
```

### 4️⃣ Créer audit depuis intervention

```bash
curl -X POST "https://diagnostic-hub.pages.dev/api/audits/create-multi-modules" \
  -H "Content-Type: application/json" \
  -d '{
    "intervention_id": 1,
    "modules": ["EL", "IV"]
  }'
```

**Résultat attendu** :
- ✅ Audit créé avec `client_id`, `project_id`, `intervention_id` remplis
- ✅ Configuration PV héritée du projet
- ✅ Modules EL + I-V activés

---

## 📋 Checklist de validation

### ✅ Dashboard
- [ ] Dashboard accessible
- [ ] Liste de tous les audits visible
- [ ] Données CRM affichées (client, site)
- [ ] Modules activés visibles
- [ ] Liens vers Calepinage fonctionnels
- [ ] Liens vers Rapports fonctionnels

### ✅ Création d'audit
- [ ] API `/api/el/audit/create` fonctionne
- [ ] Audit créé dans table `audits`
- [ ] Audit créé dans table `el_audits`
- [ ] `audit_id` correctement lié entre tables
- [ ] `audit_token` identique dans les 2 tables

### ✅ Calepinage
- [ ] Éditeur accessible pour tous les audits
- [ ] Modules affichés correctement
- [ ] Layout auto-généré
- [ ] Flèches rouges visibles
- [ ] Zones rectangulaires visibles
- [ ] Outils fonctionnels (Sélection, Déplacer, Flèche, Zone)

### ✅ Cross-module
- [ ] Même `audit_token` pour EL, I-V, Visual
- [ ] Calepinage fonctionne pour tous les modules
- [ ] Rapports accessibles avec même token

### ✅ Base de données
- [ ] Table `audits` contient tous les audits
- [ ] Table `el_audits` liée à `audits`
- [ ] `audit_id` correctement référencé
- [ ] Requêtes JOIN fonctionnent

---

## 🐛 Dépannage

### Problème : Erreur 500 sur page CRM unifiée

**Cause** : Tables CRM vides (pas de clients/projets)

**Solution** : Créer des données de test :
```bash
wrangler d1 execute diagnostic-hub-production --remote \
  --command="INSERT INTO crm_clients (company_name, client_type, status) VALUES ('Test Client', 'industrial', 'active')"
```

### Problème : Calepinage vide

**Cause** : Modules EL non générés

**Solution** : Vérifier génération modules :
```bash
wrangler d1 execute diagnostic-hub-production --remote \
  --command="SELECT COUNT(*) as module_count FROM el_modules WHERE audit_token = 'VOTRE_TOKEN'"
```

### Problème : Dashboard ne liste pas l'audit

**Cause** : Audit non créé dans table `audits`

**Solution** : Vérifier présence :
```bash
wrangler d1 execute diagnostic-hub-production --remote \
  --command="SELECT * FROM audits WHERE audit_token = 'VOTRE_TOKEN'"
```

---

## 📞 Support

- **Documentation** : `/home/user/webapp/UNIFICATION-CRM-AUDITS.md`
- **Guide création audits** : `/home/user/webapp/AUDIT-CREATION-GUIDE.md`
- **GitHub** : https://github.com/pappalardoadrien-design/Diagnostic-pv

---

**Date** : 2025-11-21  
**Version** : v4.1.0 - Unification CRM-Planning-Audits  
**Commit** : `5a19a58`
