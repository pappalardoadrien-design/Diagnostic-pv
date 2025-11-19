# 🔋 INTÉGRATION GIRASOLE - Audits Qualité Conformité

## 📊 Vue d'Ensemble

**GIRASOLE = Client avec 52 centrales photovoltaïques**
- **Type prestation** : Audits visuels conformité (NF C 15-100 + UTE C 15-712)
- **Périmètre** : 39 centrales SOL + 13 centrales TOITURE
- **Période** : Janvier-Mars 2025 (41 jours)
- **Budget** : 66,885€ HT | Marge : ~14,430€ (21.6%)

---

## 🏗️ Architecture Intégration

### ✅ **INTÉGRATION LÉGÈRE - Module VISUAL Étendu**

**Approche choisie** : Extension du module VISUAL existant (pas de nouveau module)

```
Module VISUAL (Inspections Visuelles)
  ├─> Types existants : general, structural, electrical, mechanical
  └─> Types GIRASOLE ajoutés :
       ├─> conformite_nfc15100  (Conformité NF C 15-100 + UTE C 15-712)
       ├─> toiture_dtu4035      (Toiture DTU 40.35 + ETN)
       └─> bureau_etudes        (Checklist BE - À créer si nécessaire)
```

**Avantages** :
- ✅ Aucune modification architecture globale
- ✅ Réutilise 100% infrastructure existante (CRM, Planning, Photos, PWA)
- ✅ Workflow terrain identique au Mobile Field Mode
- ✅ Compatible avec futurs gros clients (scalable)

---

## 📋 Checklists Implémentées

### **1. Checklist Conformité (39 centrales SOL)**

**Route** : `/audit/:token/visual/girasole/conformite`

**Structure** : 12 sections
1. Identification Centrale
2. Autocontrôle Installateur
3. Cheminements Câbles DC
4. Connexions & Raccordements
5. Tranchées AC (Shelter→PDL)
6. Onduleurs & BT
7. Boîtes de Jonction
8. Modules Photovoltaïques
9. Structure Support
10. Sécurité & Signalisation
11. Monitoring & Supervision
12. Observations Générales

**Features** :
- ✅ 12 sections progressives avec barre de progression
- ✅ Boutons conformité : Conforme / Non conforme / S.O
- ✅ Commentaires par item
- ✅ Photos Camera API natives par item
- ✅ Sauvegarde brouillon automatique (localStorage)
- ✅ Géolocalisation GPS
- ✅ Soumission API `/api/visual/inspections/:token`

---

### **2. Checklist Toiture (13 centrales TOITURE)**

**Route** : `/audit/:token/visual/girasole/toiture`

**Structure** : 7 sections DTU 40.35
1. Démontage Panneaux (Min 25)
2. Montage & Serrage Structure Intégration (SI)
3. Montage & Serrage Panneaux
4. Fixations Cheminements DC
5. Raccordements Connecteurs
6. Étanchéité Toiture
7. Remontage & Vérifications Finales

**Sécurité** :
- ⛔ **INTERDIT marcher sur panneaux** (warning affiché)
- ✅ Échafaudages/nacelles obligatoires
- ✅ Harnais si pente >10%
- ✅ Démontage minimum 25 panneaux (validation champ requis)

---

### **3. Checklist BE (Bureau d'Études)** ⏳

**Status** : À créer si nécessaire

**Route prévue** : `/audit/:token/visual/girasole/be`

**Contenu typique** :
- Plans conformité
- Schémas électriques
- DOE (Dossier Ouvrages Exécutés)
- Notes calculs structures
- Conformité réglementaire

---

## 🗄️ Base de Données

### **Table visual_inspections étendue**

**Colonnes ajoutées (Migration 0035)** :
```sql
ALTER TABLE visual_inspections ADD COLUMN conformite TEXT;
  -- Valeurs: 'conforme', 'non_conforme', 'so'
  
ALTER TABLE visual_inspections ADD COLUMN prescriptions_girasole TEXT;
  -- Prescriptions spécifiques GIRASOLE
  
ALTER TABLE visual_inspections ADD COLUMN bonnes_pratiques TEXT;
  -- Bonnes pratiques respectées ou non
  
ALTER TABLE visual_inspections ADD COLUMN audit_category TEXT DEFAULT 'general';
  -- Valeurs: general, conformite_nfc15100, toiture_dtu4035, bureau_etudes
  
ALTER TABLE visual_inspections ADD COLUMN checklist_section TEXT;
  -- Référence section checklist (ex: "3. Cheminements Câbles DC")
  
ALTER TABLE visual_inspections ADD COLUMN item_order INTEGER DEFAULT 0;
  -- Ordre item dans checklist (pour tri)
```

**Index créés** :
- `idx_visual_conformite` sur `conformite`
- `idx_visual_audit_category` sur `audit_category`
- `idx_visual_checklist_section` sur `checklist_section`

---

## 🔄 Workflow Complet

### **Pour un client comme GIRASOLE (52 centrales)**

```
1. CRM → Créer client "GIRASOLE Energies"
   └─> 52 sites (39 SOL + 13 TOITURE)
        └─> Configuration PV par site

2. Planning → Créer 52 interventions
   ├─> Type: audit_qualite ou visual_girasole
   ├─> Attribution sous-traitants par base (Lyon, Millau, Orthez, Toulouse)
   └─> Dates planifiées (Janvier-Mars 2025)

3. Créer 52 audits depuis interventions
   ├─> API: POST /api/audits/create-multi-modules
   └─> audit_token UUID généré par centrale

4. Technicien terrain ouvre checklist
   ├─> SOL: /audit/:token/visual/girasole/conformite
   └─> TOITURE: /audit/:token/visual/girasole/toiture

5. Remplissage checklist mobile
   ├─> Boutons conformité Conforme/Non conforme/S.O
   ├─> Photos Camera API natives
   ├─> Commentaires par item
   ├─> Sauvegarde brouillon automatique
   └─> Soumission → API /api/visual/inspections/:token

6. Données stockées dans visual_inspections
   ├─> audit_category = 'conformite_nfc15100' ou 'toiture_dtu4035'
   ├─> conformite = 'conforme', 'non_conforme', 'so'
   └─> Photos liées via table photos

7. Génération livrables GIRASOLE
   ├─> ANNEXE 2 Excel (47 colonnes) - À implémenter
   ├─> 52 rapports PDF individuels - À implémenter
   └─> Rapport synthèse général - À implémenter
```

---

## 📱 Mobile Terrain Mode Compatible

**Les checklists GIRASOLE réutilisent le Mobile Terrain Mode PWA** :

✅ **Features intégrées** :
- Camera API capture photos natives
- Géolocalisation GPS automatique
- Service Worker offline-first
- localStorage sauvegarde brouillon
- Upload photos API `/api/photos/upload`
- Manifest PWA installable
- Mode standalone iOS/Android

**Workflow photos** :
1. Technicien clique "Ajouter photo" sur item checklist
2. Camera native s'ouvre (capture='environment')
3. Photo capturée → Conversion base64
4. Upload immédiat API `/api/photos/upload`
5. Photo liée à `audit_token` + `module_type='CONFORMITE_GIRASOLE'` ou `'TOITURE_GIRASOLE'`
6. Preview photo visible dans checklist
7. Sauvegarde brouillon localStorage
8. Soumission finale → Toutes photos + données → `visual_inspections`

---

## 🚀 URLs Production

### **Checklists GIRASOLE**
- **Conformité SOL** : https://f2c42545.diagnostic-hub.pages.dev/audit/:token/visual/girasole/conformite
- **Toiture** : https://f2c42545.diagnostic-hub.pages.dev/audit/:token/visual/girasole/toiture

### **APIs**
- **Submit inspection** : `POST /api/visual/inspections/:token`
- **List inspections** : `GET /api/visual/inspections/:token`
- **Upload photo** : `POST /api/photos/upload`
- **List photos** : `GET /api/photos/:token`

### **Exemple Audit Test**
- Token : `c89d4e71-ec84-4a48-b87d-6368853092c5`
- Conformité : https://f2c42545.diagnostic-hub.pages.dev/audit/c89d4e71-ec84-4a48-b87d-6368853092c5/visual/girasole/conformite
- Toiture : https://f2c42545.diagnostic-hub.pages.dev/audit/c89d4e71-ec84-4a48-b87d-6368853092c5/visual/girasole/toiture

---

## 📊 Données Stockées

### **Format visual_inspections pour GIRASOLE**

**Exemple entrée Conformité** :
```json
{
  "audit_token": "c89d4e71-ec84-4a48-b87d-6368853092c5",
  "inspection_type": "conformite_nfc15100",
  "audit_category": "conformite_nfc15100",
  "checklist_section": "3. Cheminements Câbles DC",
  "item_order": 301,
  "location_description": "Fixations câbles conformes",
  "defect_found": false,
  "conformite": "conforme",
  "notes": "Fixations colliers inox tous les 50cm",
  "photo_url": "[12, 15, 18]",
  "inspection_date": "2025-01-15",
  "created_at": "2025-01-15 14:32:00"
}
```

**Exemple entrée Toiture** :
```json
{
  "audit_token": "a1234567-89ab-cdef-0123-456789abcdef",
  "inspection_type": "toiture_dtu4035",
  "audit_category": "toiture_dtu4035",
  "checklist_section": "2. Montage & Serrage Structure Intégration (SI)",
  "item_order": 201,
  "location_description": "Fixation SI conforme DTU 40.35",
  "defect_found": true,
  "conformite": "non_conforme",
  "notes": "Serrage insuffisant rail nord - À reprendre",
  "photo_url": "[24, 25]",
  "inspection_date": "2025-01-20",
  "created_at": "2025-01-20 10:15:00"
}
```

---

## 🛠️ Fonctionnalités À Implémenter

### **Priorité HAUTE** 🔴

1. **Export ANNEXE 2 Excel (47 colonnes)**
   - Route : `GET /api/visual/export-annexe2/:token`
   - Format : Excel conforme template GIRASOLE
   - Mapping : visual_inspections → colonnes ANNEXE 2

2. **Génération Rapports PDF Individuels**
   - Route : `POST /api/visual/batch-reports`
   - Format : PDF branded DiagPV avec photos
   - 1 rapport par audit (52 rapports pour GIRASOLE)

3. **Rapport Synthèse Général**
   - Route : `GET /api/visual/synthesis-report/client/:clientId`
   - Agrégation : Tous audits du client
   - Stats : Taux conformité, constats majeurs, recommandations

### **Priorité MOYENNE** 🟡

4. **Import Planificateur GIRASOLE CSV**
   - Route : `POST /api/planning/import-girasole-csv`
   - Import : 52 interventions depuis CSV planificateur
   - Colonnes : date, sous-traitant, centrale, budget, marge

5. **Dashboard Marges Client**
   - Page : `/planning/client/:id/marges`
   - Vue : Marges par intervention, budget total, marge globale
   - Graphiques : Évolution marges par base, par type

6. **Checklist BE (Bureau d'Études)**
   - Page : `/audit/:token/visual/girasole/be`
   - Sections : Plans, schémas, DOE, notes calculs
   - Format : Identique aux 2 autres checklists

---

## 📝 Guide Utilisation Terrain

### **Pour Technicien Sous-Traitant**

**1. Prérequis** :
- Tablette/téléphone avec Chrome ou Safari
- Connexion internet (3G/4G minimum)
- Camera fonctionnelle

**2. Accès Checklist** :
- Ouvrir URL reçue par email/SMS
- Format : `https://f2c42545.diagnostic-hub.pages.dev/audit/TOKEN/visual/girasole/conformite`
- Checklist s'ouvre automatiquement

**3. Remplissage** :
- Remplir 12 sections séquentiellement (SOL) ou 7 sections (TOITURE)
- Par item : Cliquer Conforme / Non conforme / S.O
- Ajouter commentaire si nécessaire
- Ajouter photos (bouton "Ajouter photo")
- Progression visible en haut (X/12 sections)

**4. Photos** :
- Camera native s'ouvre
- Prendre photo → Preview immédiate
- Photo uploadée automatiquement
- Visible dans checklist

**5. Sauvegarde** :
- Brouillon auto-sauvegardé toutes les 10 secondes
- Bouton "Sauvegarder brouillon" manuel disponible
- Rechargement page → Brouillon restauré automatiquement

**6. Soumission** :
- Vérifier progression 12/12 ou 7/7
- Cliquer "Soumettre audit complet"
- Confirmation demandée
- Données envoyées au serveur
- Brouillon supprimé

**7. Hors ligne** :
- Checklist fonctionne offline (Service Worker)
- Photos stockées localStorage
- Sync automatique au retour connexion

---

## 🎯 Résultats Intégration

### ✅ **Ce qui est OPÉRATIONNEL**

- [x] Extension table `visual_inspections` (migration 0035)
- [x] Checklist Conformité NF C 15-100 (12 sections)
- [x] Checklist Toiture DTU 40.35 (7 sections)
- [x] Routes Hono `/audit/:token/visual/girasole/*`
- [x] Workflow photos Camera API intégré
- [x] Sauvegarde brouillon localStorage
- [x] Soumission API `/api/visual/inspections/:token`
- [x] Déployé production : https://f2c42545.diagnostic-hub.pages.dev

### ⏳ **Ce qui reste À FAIRE**

- [ ] Export ANNEXE 2 Excel (47 colonnes)
- [ ] Génération 52 rapports PDF individuels
- [ ] Rapport synthèse général client
- [ ] Import planificateur GIRASOLE CSV
- [ ] Dashboard marges par client
- [ ] Checklist BE (si nécessaire)

---

## 📞 Contact & Support

**Diagnostic Photovoltaïque**  
3 rue d'Apollo, 31240 L'Union  
📧 contact@diagpv.fr  
☎ 05.81.10.16.59  
🌐 www.diagnosticphotovoltaique.fr  

**Adrien PAPPALARDO** - Business Developer  
📧 info@diagnosticphotovoltaique.fr  
📱 06 07 29 22 12

---

**Développé avec ❤️ pour Diagnostic Photovoltaïque**  
*Excellence technique depuis 2012 | Plus de 500 interventions*
