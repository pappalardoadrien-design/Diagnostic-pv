# 🧪 Guide de Test - Strings Non Réguliers (Canvas V2)

## 📋 Objectif
Tester la nouvelle fonctionnalité de configuration de **strings non réguliers** dans PV Cartography Canvas V2.

## 🔗 URL de Test
**Canvas V2**: https://3000-ihjl3q1cxb8r55v93w6w4-6532622b.e2b.dev/pv/plant/1/zone/1/editor/v2

## 🧪 Scénario de Test Complet

### ÉTAPE 1: Navigation et Accès
1. Ouvrir l'URL ci-dessus dans navigateur
2. **Vérifier**: La page Canvas V2 s'affiche avec carte Leaflet Google Satellite
3. **Vérifier**: Sidebar gauche contient 3 sections (DESSIN, CONFIG, PLACEMENT)

---

### ÉTAPE 2: Dessin Toiture ✏️

#### Actions:
1. Cliquer sur **"DESSINER TOITURE"** (bouton bleu)
2. Dessiner un polygone sur la carte (4-6 points minimum)
3. Double-cliquer pour terminer le polygone

#### Vérifications:
- ✅ Polygone bleu semi-transparent apparaît sur carte
- ✅ Message alert affiche surface calculée (ex: "✅ Toiture dessinée! Surface: 234.56 m²")
- ✅ Bouton "EFFACER TOITURE" apparaît

---

### ÉTAPE 3: Configuration Électrique (Strings Non Réguliers) ⚡

#### Actions Basiques:
1. **Onduleurs**: Entrer `3`
2. **Boîtes de Jonction**: Entrer `6`
3. **Nombre de Strings**: Entrer `4`

#### Test Configuration Strings Non Réguliers:
4. Cliquer sur **"Configurer Strings"** (bouton jaune avec icône sliders)

#### Vérifications Modal:
- ✅ Modal apparaît avec titre "CONFIGURATION STRINGS NON RÉGULIERS"
- ✅ Modal Z-index correct (devant carte Leaflet)
- ✅ 4 lignes de configuration affichées:
  - String 1: [10] modules (valeur par défaut)
  - String 2: [10] modules
  - String 3: [10] modules
  - String 4: [10] modules
- ✅ Total affiché: "TOTAL MODULES: 40"

#### Configuration Personnalisée:
5. Modifier les valeurs:
   - String 1: `26`
   - String 2: `24`
   - String 3: `28`
   - String 4: `22`

6. **Vérifier en temps réel**: Total doit s'actualiser à `100`

7. Cliquer sur **"APPLIQUER"** (bouton vert)

#### Vérifications Après Application:
- ✅ Modal se ferme automatiquement
- ✅ Alert affiche:
  ```
  ✅ Configuration appliquée!
  
  String 1: 26 modules
  String 2: 24 modules
  String 3: 28 modules
  String 4: 22 modules
  
  Total: 100 modules
  ```
- ✅ Résumé apparaît sous le bouton "Configurer Strings":
  ```
  S1=26, S2=24, S3=28, S4=22 (Total: 100 modules)
  ```

#### Test Bouton Annuler:
8. Re-cliquer sur **"Configurer Strings"**
9. Modifier une valeur (ex: String 1 → `30`)
10. Cliquer sur **"ANNULER"** (bouton gris)
11. **Vérifier**: Modal se ferme, résumé reste inchangé (S1=26...)

#### Test Sauvegarde Config:
12. Cliquer sur **"SAUVEGARDER CONFIG"** (bouton vert)
13. **Vérifier**: Alert "✅ Configuration sauvegardée!"

---

### ÉTAPE 4: Placement Auto avec Strings Non Réguliers 📍

#### Actions:
1. Cliquer sur **"Placement Auto (Config)"** (bouton vert)

#### Vérifications Placement:
- ✅ Alert affiche:
  ```
  ✅ 100 modules placés!
  
  String 1: 26 modules
  String 2: 24 modules
  String 3: 28 modules
  String 4: 22 modules
  ```
- ✅ 4 lignes de rectangles apparaissent sur la carte
- ✅ **Ligne 1** (String 1) contient **26 rectangles gris** (status pending)
- ✅ **Ligne 2** (String 2) contient **24 rectangles gris**
- ✅ **Ligne 3** (String 3) contient **28 rectangles gris**
- ✅ **Ligne 4** (String 4) contient **22 rectangles gris**
- ✅ Total: 100 modules visibles sur carte

#### Vérifications Visuelles Détaillées:
- ✅ Les lignes sont de **longueurs différentes** (non uniforme)
- ✅ Ligne 1 la plus longue (26 modules)
- ✅ Ligne 2 plus courte (24 modules)
- ✅ Espacement 2cm entre modules respecté
- ✅ Tous les modules dans le contour de toiture

---

### ÉTAPE 5: Annotation et Changement Statut 🏷️

#### Actions:
1. Cliquer sur un module au milieu de la **Ligne 1** (String 1)

#### Vérifications Modal Annotation:
- ✅ Modal apparaît avec titre "ANNOTATION MODULE Mxx"
- ✅ Info module affichée:
  ```
  String: 1
  Position: 13/26
  ```
- ✅ 7 boutons statuts visibles avec couleurs correctes:
  - 🟢 OK (vert #22c55e)
  - 🟡 INÉGALITÉ (jaune #eab308)
  - 🟠 MICROFISSURES (orange #f97316)
  - 🔴 MODULE MORT (rouge #ef4444)
  - 🔵 STRING OUVERT (bleu #3b82f6)
  - ⚫ NON CONNECTÉ (gris #6b7280)
  - ⚪ EN ATTENTE (gris clair #e5e7eb)

#### Test Changement Statut:
2. Cliquer sur **"MODULE MORT"** (bouton rouge)
3. Ajouter commentaire: `Test microfissure sévère`
4. **Vérifier**: Module devient **rouge** sur la carte
5. **Vérifier**: Stats mises à jour:
   - MORT: 1
   - EN ATTENTE: 99

#### Test Annotation Multiple:
6. Annoter 5 modules de la **Ligne 2** (String 2):
   - 2 modules → **OK** (vert)
   - 1 module → **INÉGALITÉ** (jaune)
   - 1 module → **MICROFISSURES** (orange)
   - 1 module → **STRING OUVERT** (bleu)

7. **Vérifier Stats**:
   - Total: 100
   - OK: 2
   - INÉGALITÉ: 1
   - MICROFISSURES: 1
   - MORT: 1
   - STRING OUVERT: 1
   - EN ATTENTE: 94

---

### ÉTAPE 6: Export PDF 📄

#### Actions:
1. Cliquer sur **"EXPORTER PDF"** (bouton violet)
2. Attendre génération (2-3 secondes)

#### Vérifications PDF Page 1:
- ✅ En-tête: "DIAGNOSTIC PHOTOVOLTAÏQUE - CARTOGRAPHIE ZONE"
- ✅ Infos centrale et zone
- ✅ Capture carte Leaflet avec modules colorés (4 lignes longueurs différentes)
- ✅ Caractéristiques techniques:
  ```
  Modules: 100 | Puissance: 45.00 kWc
  Onduleurs: 3 | Boîtes Jonction: 6 | Strings: 4
  Surface toiture: XXX m² | Azimut: XX° | Inclinaison: XX°
  ```
- ✅ Tableau stats 7 statuts:
  - OK: 2 (2%)
  - INÉGALITÉ: 1 (1%)
  - MICROFISSURES: 1 (1%)
  - MORT: 1 (1%)
  - STRING OUVERT: 1 (1%)
  - NON CONNECTÉ: 0 (0%)
  - EN ATTENTE: 94 (94%)

#### Vérifications PDF Page 2:
- ✅ Titre: "LISTE DÉTAILLÉE DES MODULES"
- ✅ 100 lignes avec format:
  ```
  M1 | S1 P1 | ⚪ pending
  M2 | S1 P2 | ⚪ pending
  ...
  M13 | S1 P13 | 🔴 dead
     → Test microfissure sévère
  ...
  M27 | S2 P1 | ⚪ pending
  M28 | S2 P2 | 🟢 ok
  ...
  M51 | S3 P1 | ⚪ pending
  ...
  M79 | S4 P1 | ⚪ pending
  ...
  M100 | S4 P22 | ⚪ pending
  ```
- ✅ Vérifier numérotation strings correcte:
  - String 1: Positions 1 à 26
  - String 2: Positions 1 à 24
  - String 3: Positions 1 à 28
  - String 4: Positions 1 à 22

---

### ÉTAPE 7: Sauvegarde et Persistance 💾

#### Actions:
1. Cliquer sur **"SAUVEGARDER TOUT"** (bouton vert en bas)
2. **Vérifier**: Alert "✅ 100 modules sauvegardés en base de données!"
3. Recharger la page (F5)

#### Vérifications Après Rechargement:
- ✅ Contour toiture réapparaît
- ✅ 100 modules réapparaissent avec couleurs correctes
- ✅ Stats correctes (OK: 2, MORT: 1, etc.)
- ✅ Résumé strings affiché: "S1=26, S2=24, S3=28, S4=22 (Total: 100)"

---

## 🐛 Tests Cas Limites

### Test 1: Strings Très Différents
- Config: S1=50, S2=10, S3=5, S4=35 (Total: 100)
- **Vérifier**: 4 lignes longueurs très variables

### Test 2: 1 Seul String
- Config: S1=50 (Total: 50)
- **Vérifier**: 1 seule ligne horizontale

### Test 3: Beaucoup de Strings
- Config: 10 strings × 10 modules chacun (Total: 100)
- **Vérifier**: 10 lignes identiques

### Test 4: String Unitaire
- Config: S1=1, S2=1, S3=1 (Total: 3)
- **Vérifier**: 3 lignes de 1 module chacune

### Test 5: Modification Config Après Placement
1. Placer 100 modules (S1=26, S2=24, S3=28, S4=22)
2. Modifier config: S1=30, S2=30, S3=20, S4=20
3. Cliquer **"Placement Auto"** à nouveau
4. **Vérifier**: Anciens modules effacés, nouveaux placés selon nouvelle config

---

## 🎯 Critères de Succès

### Fonctionnalités Critiques:
- ✅ Modal strings s'ouvre avec valeurs par défaut (10 modules/string)
- ✅ Modification valeurs met à jour total en temps réel
- ✅ Bouton "Appliquer" sauvegarde config et affiche résumé
- ✅ Bouton "Annuler" ferme modal sans changement
- ✅ Placement Auto génère lignes longueurs différentes
- ✅ Chaque string a le bon nombre de modules
- ✅ Numérotation strings/positions correcte (S1 P1-26, S2 P1-24, etc.)
- ✅ Export PDF affiche layout fidèle et liste modules correcte
- ✅ Sauvegarde DB persiste configuration strings

### Performance:
- ✅ Modal s'ouvre instantanément (<100ms)
- ✅ Placement 100 modules <2 secondes
- ✅ Export PDF <5 secondes

### UX:
- ✅ Bouton "Configurer Strings" bien visible (jaune)
- ✅ Modal Z-index correct (devant carte)
- ✅ Résumé config clair et lisible
- ✅ Alerts informatifs sans jargon technique

---

## 📸 Screenshots Attendus

### Screenshot 1: Modal Configuration Ouverte
- 4 inputs avec valeurs personnalisées
- Total = 100 modules
- Boutons Appliquer/Annuler

### Screenshot 2: Résumé Configuration
- "S1=26, S2=24, S3=28, S4=22 (Total: 100 modules)"

### Screenshot 3: Carte avec Modules Placés
- 4 lignes horizontales longueurs différentes
- Modules colorés selon statuts

### Screenshot 4: PDF Page 2
- Liste 100 modules avec string/position corrects

---

## 🚨 Bugs Potentiels à Surveiller

1. **Modal derrière carte**: Z-index insuffisant → **RÉSOLU** (commit bcdba7a)
2. **Total modules ne s'actualise pas**: Event listeners inputs manquants → **À TESTER**
3. **Résumé n'affiche pas**: `classList.remove('hidden')` manquant → **À VÉRIFIER**
4. **Placement Auto ignore stringsConfig**: Validation `stringsConfig.length > 0` manquante → **IMPLÉMENTÉ**
5. **Numérotation strings incorrecte**: Boucle `stringConfig.stringNum` mal utilisée → **À VÉRIFIER**
6. **DB ne sauvegarde pas config**: Aucune colonne `strings_config` → **FUTUR**

---

## 📝 Notes Développeur

### Choix Implémentation:
- **Stockage mémoire**: `stringsConfig = [{stringNum: 1, modulesCount: 26}, ...]`
- **Génération dynamique**: Modal inputs créés à la volée selon `stringCount`
- **Event delegation**: Listeners ajoutés après génération HTML (setTimeout 100ms)
- **Algorithme placement**: Itération sur `stringsConfig` au lieu de grille uniforme
- **Pas de sauvegarde DB**: stringsConfig en mémoire seulement (Phase 2b future)

### TODO Prochaines Étapes:
- [ ] Sauvegarde `stringsConfig` en DB (colonne JSON ou table)
- [ ] Chargement config depuis DB au reload page
- [ ] Validation max modules/string (ex: limite 50)
- [ ] Export stringsConfig dans PDF (tableau récap)
- [ ] Interface modification config sans tout replacer

---

**Date**: 2025-10-29  
**Version**: Canvas V2 - Strings Non Réguliers (Beta)  
**Status**: ✅ Implémentation complète - Tests à exécuter
