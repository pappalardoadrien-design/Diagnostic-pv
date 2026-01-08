# 📸 GUIDE RAPIDE - PHOTOS CONTRÔLES VISUELS TERRAIN

**Version** : 1.0  
**Date** : 12 novembre 2025  
**Pour** : Techniciens DiagPV terrain

---

## 🎯 OBJECTIF

Standardiser le nommage des photos prises lors des contrôles visuels IEC 62446-1 pour faciliter l'intégration dans les rapports et assurer la traçabilité.

---

## 📋 RÈGLES SIMPLES

### 1️⃣ RÉCUPÉRER LE TOKEN INSPECTION

**Où le trouver ?**
- En haut de l'écran de l'interface checklist
- Format : `VIS-1762961953742-GCS31P`
- C'est l'identifiant unique de votre inspection

### 2️⃣ FORMAT DE NOMMAGE

```
{TOKEN}_{CATEGORIE}_{DESCRIPTION}_{NUMERO}.jpg
```

**Exemple** :
```
VIS-1762961953742-GCS31P_M02_CORROSION_01.jpg
```

### 3️⃣ CATÉGORIES PHOTOS

| Type Photo | Préfixe | Exemple |
|------------|---------|---------|
| **Item checklist** | Code item (M01, E05, D03...) | `VIS-XXX_M02_CORROSION_01.jpg` |
| **Défaut module** | `DEFECT_MODULE` | `VIS-XXX_DEFECT_MODULE_S01_POS12_01.jpg` |
| **Défaut équipement** | `DEFECT_{TYPE}` | `VIS-XXX_DEFECT_MC4_CORROSION_01.jpg` |
| **Contexte site** | `CONTEXT` | `VIS-XXX_CONTEXT_VUE_GENERALE_01.jpg` |

---

## 📖 EXEMPLES CONCRETS TERRAIN

### 🔧 MECHANICAL (Items M01-M13)

**Item M02 : Corrosion cadre aluminium**
```
VIS-1762961953742-GCS31P_M02_CORROSION_01.jpg
VIS-1762961953742-GCS31P_M02_CORROSION_02.jpg
```

**Item M05 : Fixation modules défectueuse**
```
VIS-1762961953742-GCS31P_M05_FIXATION_DEFAUT_01.jpg
```

**Item M10 : Câble détérioré**
```
VIS-1762961953742-GCS31P_M10_CABLE_DETERIORE_01.jpg
```

### ⚡ ELECTRICAL (Items E01-E12)

**Item E05 : Boîte jonction défectueuse**
```
VIS-1762961953742-GCS31P_E05_BOITE_JONCTION_01.jpg
```

**Item E08 : Câblage non conforme**
```
VIS-1762961953742-GCS31P_E08_CABLAGE_DEFAUT_01.jpg
```

**Item E11 : MC4 corrodé**
```
VIS-1762961953742-GCS31P_E11_MC4_CORROSION_01.jpg
```

### 📄 DOCUMENTATION (Items D01-D06)

**Item D03 : Label manquant**
```
VIS-1762961953742-GCS31P_D03_LABEL_MANQUANT_01.jpg
```

**Item D05 : Schéma non conforme**
```
VIS-1762961953742-GCS31P_D05_SCHEMA_NON_CONFORME_01.jpg
```

### ⚠️ SAFETY (Items S01-S05)

**Item S02 : Mise à la terre défectueuse**
```
VIS-1762961953742-GCS31P_S02_TERRE_DEFAUT_01.jpg
```

**Item S04 : Risque incendie**
```
VIS-1762961953742-GCS31P_S04_RISQUE_INCENDIE_01.jpg
```

### 🏠 CONTEXTE SITE

**Vue générale installation**
```
VIS-1762961953742-GCS31P_CONTEXT_VUE_GENERALE_01.jpg
VIS-1762961953742-GCS31P_CONTEXT_VUE_GENERALE_02.jpg
```

**Conditions météo**
```
VIS-1762961953742-GCS31P_CONTEXT_METEO_01.jpg
```

**Accès site**
```
VIS-1762961953742-GCS31P_CONTEXT_ACCES_SITE_01.jpg
```

### 🔍 DÉFAUTS SPÉCIFIQUES MODULES

**Module string 1 position 12 - Microfissure**
```
VIS-1762961953742-GCS31P_DEFECT_MODULE_S01_POS12_MICROFISSURE_01.jpg
```

**Module string 3 position 8 - Délamination**
```
VIS-1762961953742-GCS31P_DEFECT_MODULE_S03_POS08_DELAMINATION_01.jpg
```

---

## 🚀 WORKFLOW TERRAIN

### Pendant l'Inspection

1. **Ouvrir interface checklist** : `/static/visual-inspection?token=VIS-XXX`
2. **Noter le token** (ou copier-coller sur papier)
3. **Parcourir checklist item par item**
4. **Pour chaque non-conformité** :
   - Prendre photo(s)
   - Noter mentalement : `{TOKEN}_{ITEM}_{DEFAUT}_{NUMERO}`
   - Ou noter sur fiche papier pour renommage ultérieur

### Après l'Inspection (Sur site ou bureau)

1. **Transférer photos smartphone → PC/tablette**
2. **Renommer toutes les photos** selon convention
3. **Créer dossier** : `INSPECTION_{TOKEN}`
4. **Y placer toutes les photos renommées**
5. **Compresser en ZIP** : `INSPECTION_{TOKEN}.zip`
6. **Envoyer via** :
   - Swisstransfer (jusqu'à 50 GB gratuit, 30 jours)
   - WeTransfer (jusqu'à 2 GB gratuit, 7 jours)
   - Drive partagé (Google Drive, Dropbox, OneDrive)

---

## 📱 APPS RECOMMANDÉES RENOMMAGE

### Android
- **"Batch Rename & Organize"** (gratuit)
- **"File Manager+"** (gratuit)
- **"Total Commander"** (gratuit)

### iOS
- **"Shortcuts"** (app native Apple - gratuit)
- **"Documents by Readdle"** (gratuit)
- **"File Manager & Browser"** (gratuit)

### PC/Mac
- **Windows** : "Bulk Rename Utility" (gratuit)
- **Mac** : "Name Changer" (gratuit)
- **Linux** : `rename` command-line tool

---

## ✅ CHECKLIST AVANT ENVOI

Avant d'envoyer le ZIP, vérifier :

- [ ] Toutes les photos sont renommées selon convention
- [ ] Pas d'espaces dans les noms (utiliser `_`)
- [ ] Pas d'accents ou caractères spéciaux
- [ ] Token correct (vérifié dans interface)
- [ ] Numéro séquence correct (01, 02, 03...)
- [ ] Toutes photos dans même dossier `INSPECTION_{TOKEN}`
- [ ] Dossier compressé en `.zip`
- [ ] Lien de transfert envoyé à : `contact@diagpv.fr`

---

## ❌ ERREURS FRÉQUENTES À ÉVITER

### ❌ Mauvais nommage

```
❌ photo1.jpg
❌ IMG_20251112_143022.jpg
❌ modules corrodés.jpg
❌ VIS-1762961953742-GCS31P M02 corrosion 01.jpg  (espaces)
❌ VIS-1762961953742-GCS31P-M02-CORROSION-01.jpg  (tirets au lieu de underscores)
```

### ✅ Bon nommage

```
✅ VIS-1762961953742-GCS31P_M02_CORROSION_01.jpg
✅ VIS-1762961953742-GCS31P_E05_BOITE_JONCTION_01.jpg
✅ VIS-1762961953742-GCS31P_CONTEXT_VUE_GENERALE_01.jpg
✅ VIS-1762961953742-GCS31P_DEFECT_MODULE_S01_POS12_01.jpg
```

---

## 🆘 BESOIN D'AIDE ?

**Contact Back-Office DiagPV** :
- 📧 Email : `contact@diagpv.fr`
- 📱 Téléphone : `05.81.10.16.59`
- 💬 Slack : Canal `#support-terrain`

**Questions fréquentes** :
- **J'ai oublié de noter le token** → Il est dans l'URL de la page checklist
- **J'ai trop de photos** → Compresser en plusieurs ZIP si besoin
- **Lien de transfert expiré** → Renvoyer nouveau lien, on télécharge sous 24h
- **Erreur dans nommage après envoi** → Pas grave, on peut corriger côté back-office

---

## 📊 RÉCAPITULATIF CODES ITEMS

### 🔧 MECHANICAL (M01-M13)
- M01 : Intégrité mécanique modules
- M02 : État cadre aluminium
- M03 : Verre/encapsulant
- M04 : Diodes bypass/câblage interne
- M05 : Fixation modules/écartement
- M06 : Structure support (rails, cadres)
- M07 : Corrosion structure
- M08 : Ancrage structure/étanchéité
- M09 : Câbles PV (protection UV, fixation)
- M10 : Gaines/protection mécanique
- M11 : Connecteurs MC4 (verrouillage, étanchéité)
- M12 : Passages câbles (presse-étoupes)
- M13 : Propreté/encrassement modules

### ⚡ ELECTRICAL (E01-E12)
- E01 : Boîtes jonction DC (étanchéité, accès)
- E02 : Connexions électriques internes BJ
- E03 : Câblage DC (section, polarités)
- E04 : Protection surintensités DC (fusibles, disjoncteurs)
- E05 : Dispositifs coupure DC (sectionneur)
- E06 : Onduleurs (fixation, ventilation, affichage)
- E07 : Câblage AC (repérage, protection)
- E08 : Protection surintensités AC (disjoncteurs)
- E09 : Interrupteur différentiel (Type A ou B)
- E10 : Mise à la terre (continuité, résistance)
- E11 : Parafoudre DC/AC (état, voyants)
- E12 : Monitoring (communication, affichage)

### 📄 DOCUMENTATION (D01-D06)
- D01 : Labels sécurité (tension DC, pompiers)
- D02 : Schéma unifilaire (présent, à jour)
- D03 : Étiquetage câbles/protections
- D04 : Consignes exploitation
- D05 : Attestations conformité (Consuel, C15-100)
- D06 : Carnet de vie installation

### ⚠️ SAFETY (S01-S05)
- S01 : Accès installations (garde-corps, échelles)
- S02 : Risque électrique (distances sécurité)
- S03 : Risque incendie (proximité matériaux combustibles)
- S04 : Signalétique sécurité (visible, lisible)
- S05 : Moyens extinction incendie (accessibles)

---

**Guide créé** : 12 novembre 2025  
**Dernière révision** : 12 novembre 2025  
**Version** : 1.0  
**Auteur** : DiagPV - Diagnostic Photovoltaïque

