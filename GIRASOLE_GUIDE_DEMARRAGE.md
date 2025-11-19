# 🚀 GIRASOLE - Guide de Démarrage Rapide

## 📋 Étape par Étape : Configuration Mission GIRASOLE

---

## ✅ **Étape 1 : Créer le Client GIRASOLE dans le CRM**

### **URL** : 
```
https://b5ff45a5.diagnostic-hub.pages.dev/crm/clients/create
```

### **Informations à saisir** :
```
Raison Sociale : GIRASOLE Energies
SIRET : [à compléter]
Type : Client
Email : contact@girasole-energies.fr
Téléphone : [à compléter]
Adresse : [à compléter]
```

### **Action** :
1. Ouvre l'URL ci-dessus
2. Remplis le formulaire
3. Clique "Créer Client"
4. **Note l'ID client** (ex: 123)

---

## 🏗️ **Étape 2 : Créer les 52 Sites PV (Centrales)**

### **Option A : Création Manuelle** (une par une)

**URL** : 
```
https://b5ff45a5.diagnostic-hub.pages.dev/crm/projects/create
```

**Pour chaque centrale** :
```
Client : GIRASOLE Energies (sélectionner dans la liste)
Nom : Centrale Solaire [Ville] [Numéro]
Type : SOL ou TOITURE
Puissance Installée : [X] kWc
Nombre Modules : [X]
Ville : [Nom ville]
Code Postal : [XXXXX]
Adresse : [Adresse complète]
GPS Latitude : [X.XXXX]
GPS Longitude : [X.XXXX]
```

**Exemple 1 - Centrale SOL** :
```
Nom : Centrale Solaire Narbonne 1
Type : SOL
Puissance : 250 kWc
Modules : 680
Ville : Narbonne
Code Postal : 11100
```

**Exemple 2 - Centrale TOITURE** :
```
Nom : Centrale Toiture Perpignan 1
Type : TOITURE
Puissance : 150 kWc
Modules : 420
Ville : Perpignan
Code Postal : 66000
```

**Actions** :
1. Répéter 52 fois (39 SOL + 13 TOITURE)
2. Sauvegarder chaque site
3. Noter les IDs générés

---

### **Option B : Import CSV** (recommandé - À VENIR)

**Format CSV attendu** :
```csv
nom_centrale,type,ville,code_postal,puissance_kwc,nombre_modules,latitude,longitude,date_intervention
Centrale Solaire Narbonne 1,SOL,Narbonne,11100,250,680,43.1839,3.0033,2025-01-15
Centrale Solaire Narbonne 2,SOL,Narbonne,11100,300,820,43.1850,3.0050,2025-01-16
Centrale Toiture Perpignan 1,TOITURE,Perpignan,66000,150,420,42.6986,2.8954,2025-01-20
...
```

**API** : `POST /api/planning/import-girasole-csv` (en développement)

---

## 📅 **Étape 3 : Créer les Interventions**

### **Option A : Création Manuelle**

**URL** : 
```
https://b5ff45a5.diagnostic-hub.pages.dev/planning/create
```

**Pour chaque centrale** :
```
Type : audit_qualite (ou visual_girasole)
Client : GIRASOLE Energies
Site : [Sélectionner la centrale]
Date Intervention : 2025-01-15
Durée Estimée : 4 heures
Technicien : [Assigner si connu]
Description : Audit conformité GIRASOLE
```

**Actions** :
1. Créer 1 intervention par centrale (52 interventions)
2. Répartir sur période janvier-mars 2025
3. Noter les IDs interventions

---

### **Option B : Création Automatique via Script** (À VENIR)

**API** : `POST /api/planning/batch-create-interventions`

```json
{
  "client_id": 123,
  "project_ids": [1, 2, 3, ...52],
  "intervention_type": "audit_qualite",
  "start_date": "2025-01-15",
  "end_date": "2025-03-31"
}
```

---

## 🔍 **Étape 4 : Créer les Audits depuis Interventions**

### **Pour chaque intervention** :

1. **Ouvre** : `/planning/detail?id={intervention_id}`
2. **Clique** : "Créer audit visuel"
3. **Système génère** :
   - `audit_token` unique (UUID)
   - Audit master dans table `audits`
   - Liaison `intervention_id` → `audit_token`

**Répéter 52 fois** (automatisation possible à l'avenir)

---

## 🎯 **Étape 5 : Accéder au Dashboard GIRASOLE**

### **URL** : 
```
https://b5ff45a5.diagnostic-hub.pages.dev/girasole/dashboard
```

### **Fonctionnalités** :

✅ **Vue d'ensemble** :
- 52 centrales listées
- Statut de chaque centrale (Non démarrée / En cours / Complétée)
- Barre progression par centrale
- Stats globales : complétées, en cours, non démarrées

✅ **Filtres** :
- Type : SOL (39) / TOITURE (13) / Tous
- Statut : Complétée / En cours / Non démarrée / Tous
- Recherche : Nom centrale, ville

✅ **Actions par centrale** :
- Bouton "Checklist" → Ouvre checklist terrain (conformité ou toiture)
- Bouton "PDF" → Génère rapport PDF (si checklist complétée)

---

## 📋 **Étape 6 : Remplir Checklists Terrain**

### **Workflow Technicien** :

1. **Dashboard GIRASOLE** → Clic "Checklist" sur une centrale

2. **Centrale SOL** → Redirigé vers :
   ```
   /audit/{token}/visual/girasole/conformite
   ```
   - 12 sections (Identification → Sécurité Incendie)
   - 80+ items de contrôle NF C 15-100 + UTE C 15-712

3. **Centrale TOITURE** → Redirigé vers :
   ```
   /audit/{token}/visual/girasole/toiture
   ```
   - 7 sections (Démontage → Contrôle BE)
   - DTU 40.35 + ETN avec consignes sécurité

4. **Pour chaque item** :
   - ✓ Conforme / ✗ Non conforme / S.O.
   - Commentaire (optionnel)
   - Photos (illimitées)
   - GPS automatique

5. **Brouillon auto-save** : localStorage toutes les 5s

6. **Soumission** : Clic "Soumettre Audit"
   - Données envoyées vers `visual_inspections`
   - Photos envoyées vers `photos`
   - Brouillon supprimé

---

## 📊 **Étape 7 : Générer Rapports PDF**

### **Option A : Rapport Individuel**

**Depuis Dashboard GIRASOLE** :
- Clic bouton "PDF" sur une centrale complétée
- URL : `/api/visual/report/{audit_token}`
- PDF généré et téléchargé

### **Option B : Batch 52 Rapports** (À VENIR)

**API** : `POST /api/visual/batch-reports`

```json
{
  "client_id": 123,
  "audit_tokens": ["token1", "token2", ...52]
}
```

**Résultat** :
- 52 PDF générés
- ZIP téléchargeable
- Nomenclature : `GIRASOLE_{nom_centrale}_rapport.pdf`

### **Option C : Rapport Synthèse Général** (À VENIR)

**API** : `GET /api/visual/synthesis-report/client/{client_id}`

**Contenu** :
- Résumé 52 centrales
- Stats globales conformité
- Liste non-conformités prioritaires
- Recommandations générales
- 1 PDF unique pour toute la mission

---

## 📤 **Étape 8 : Export Excel ANNEXE 2** (À VENIR)

### **Depuis Dashboard GIRASOLE** :
- Clic bouton "Export Excel"
- API : `GET /api/visual/export-annexe2-batch`

### **Format** :
- 47 colonnes par centrale
- Conformément au cahier des charges GIRASOLE
- 1 fichier Excel avec 52 onglets (ou 1 onglet avec 52 lignes)

---

## 🔄 **Workflow Complet Résumé**

```
1. CRM → Créer client "GIRASOLE Energies"
   ↓
2. CRM → Créer 52 sites PV (39 SOL + 13 TOITURE)
   ↓
3. Planning → Créer 52 interventions (1 par site)
   ↓
4. Planning → Créer 52 audits (depuis interventions)
   ↓
5. Dashboard GIRASOLE → Vue d'ensemble mission
   ↓
6. Terrain → Remplir checklists (photos + conformité)
   ↓
7. Dashboard → Générer 52 rapports PDF
   ↓
8. Dashboard → Export Excel ANNEXE 2
   ↓
9. ✅ Mission GIRASOLE terminée
```

---

## 🚀 **URLs Principales**

| Page | URL |
|------|-----|
| **Dashboard GIRASOLE** | `/girasole/dashboard` |
| **Créer Client** | `/crm/clients/create` |
| **Créer Site** | `/crm/projects/create` |
| **Créer Intervention** | `/planning/create` |
| **Checklist Conformité** | `/audit/{token}/visual/girasole/conformite` |
| **Checklist Toiture** | `/audit/{token}/visual/girasole/toiture` |
| **Rapport PDF** | `/api/visual/report/{token}` |

---

## ⚠️ **Fonctionnalités En Développement**

| Fonctionnalité | Statut | Priorité |
|----------------|--------|----------|
| Import CSV planificateur | 🔨 À faire | HAUTE |
| Batch création interventions | 🔨 À faire | HAUTE |
| Batch génération 52 PDF | 🔨 À faire | HAUTE |
| Export Excel ANNEXE 2 | 🔨 À faire | HAUTE |
| Rapport synthèse général | 🔨 À faire | MOYENNE |
| Dashboard marges client | 🔨 À faire | MOYENNE |

---

## 💡 **Conseils Productivité**

### **Pour gagner du temps** :

1. **Créer 1 site modèle** → dupliquer et modifier (fonctionnalité CRM à ajouter)

2. **Utiliser Import CSV** quand disponible (évite 52 saisies manuelles)

3. **Assigner techniciens dès la création** interventions (planification optimisée)

4. **Tester workflow sur 2-3 centrales** avant de déployer sur les 52

5. **Former techniciens** sur mode offline-first (brouillons localStorage)

---

## 🆘 **Support & Questions**

**Dashboard bloqué ?**
- Vérifie que client GIRASOLE existe : `/crm/clients`
- Vérifie que sites ont `client_id` correct

**Checklist ne charge pas ?**
- Vérifie que `audit_token` existe dans table `audits`
- Console navigateur (F12) → erreurs API

**Photos ne s'uploadent pas ?**
- Vérifie permissions caméra navigateur
- Taille max photo : ~1 MB base64

**Rapport PDF vide ?**
- Vérifie que checklist a été soumise (données dans `visual_inspections`)

---

**🎉 Prêt à démarrer la mission GIRASOLE ! 52 centrales, c'est parti ! 🚀**
