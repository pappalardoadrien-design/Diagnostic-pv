# 🧪 TEST: Import 242 Modules (1 Array Unique)

**Date:** 2025-11-06  
**Fonctionnalité:** Bouton violet "IMPORTER 242 MODULES (1 ARRAY)" pour centrales monoblock 100kWc  
**Commit:** `480c8c3`

---

## 🎯 Objectif

Tester l'import automatique de **242 modules** en **1 seul rectangle** (22 cols × 11 rows) avec positionnement centré automatique et échelle adaptative 92%.

**Différence vs JALIBAT:**
- JALIBAT = 10 rectangles distincts (grille 5×2)
- Cette fonction = 1 array rectangulaire unique (monoblock)

---

## 📋 Prérequis

1. Service actif : https://3000-ihjl3q1cxb8r55v93w6w4-6532622b.e2b.dev
2. Accès PVCarto Editor V2 (n'importe quelle zone avec polygone toiture)
3. Navigateur avec dev console (F12)

---

## 🔧 Procédure de Test

### Étape 1 : Préparer Zone de Test

**URL test recommandée:** Zone 14 de JALIBAT (déjà configurée)
```
https://3000-ihjl3q1cxb8r55v93w6w4-6532622b.e2b.dev/pv/plant/6/zone/14/editor/v2
```

**Ou créer nouvelle zone:**
1. Aller sur `/pv/plants` → "CENTRALES ACTIVES"
2. Choisir centrale test ou créer nouvelle
3. Créer zone avec polygone toiture

### Étape 2 : Dessiner Polygone Toiture

1. Clic sur **"DESSINER TOITURE"** (bouton orange)
2. Tracer polygone rectangulaire sur satellite
3. Double-clic pour terminer
4. Console doit afficher:
   ```
   ✅ Polygone toiture créé: X points
   📏 Dimensions approximatives: XXm × XXm
   ```

### Étape 3 : Import 242 Modules

1. Repérer bouton **violet** : "IMPORTER 242 MODULES (1 ARRAY)"
2. Clic sur le bouton
3. Confirmer dialogue : "Importer 242 modules (22 cols × 11 rows) en 1 rectangle ?"

**Logs console attendus:**
```
🚀 Import 242 modules (1 array) démarré...
📐 Configuration: 22 colonnes × 11 rangées = 242 modules
📏 Toiture: XXm × XXm
📏 Array nécessaire: 37.4m × 12.4m
📊 Scale factor: 0.XXX (XX%)
✅ Rectangle créé: 22×11 = 242 modules
```

### Étape 4 : Vérifications Visuelles

**Alert attendue:**
```
✅ IMPORT 242 MODULES TERMINÉ

📦 1 rectangle créé:
   • 22 colonnes × 11 rangées
   • Orientation LANDSCAPE (1.7m × 1.13m)

📊 Total: 242 modules
📏 Dimensions: XXm × XXm
📏 Échelle: XX%

🎯 PROCHAINE ÉTAPE:
Ajustez visuellement le rectangle pour
correspondre à la photo satellite !

→ Voir panneau 'ALIGNEMENT VISUEL' à gauche
```

**Sur la carte:**
- ✅ 1 rectangle orange visible centré sur toiture
- ✅ Grille 22×11 modules visible (si checkbox activée)
- ✅ Labels modules affichés
- ✅ Panneau orange "ALIGNEMENT VISUEL" affiché à gauche

### Étape 5 : Test Ajustement Manuel

**Test DRAG (déplacement):**
1. Clic LONG sur rectangle
2. Glisser vers nouvelle position
3. Rectangle doit se déplacer fluide

**Test RESIZE (redimensionnement):**
1. Clic sur coin du rectangle
2. Glisser pour agrandir/rétrécir
3. Grille doit s'adapter dynamiquement

**Test ROTATION:**
1. Clic sur handle de rotation (cercle)
2. Glisser pour pivoter
3. Console: `🔄 Rectangle X rotation: XXX°`

### Étape 6 : Vérifications Finales

**Liste rectangles:**
- Panneau "RECTANGLES CRÉÉS" visible
- 1 carte rectangle affichée
- Info: "String 1 | 22×11 = 242 mods"
- Boutons: Dupliquer / ↻ / 🗑️

**Compteur modules:**
- Sidebar doit afficher: "242 MODULES"
- Info détaillée: "1 rectangle(s)"

---

## ✅ Critères de Succès

| Critère | Attendu | ✓ |
|---------|---------|---|
| Bouton visible | Bouton violet "IMPORTER 242 MODULES (1 ARRAY)" | |
| Import réussi | Alert confirmation avec dimensions | |
| Rectangle créé | 1 rectangle 22×11 centré sur toiture | |
| Échelle correcte | Scale factor entre 50-100% selon taille toiture | |
| Panneau aide | Panneau orange "ALIGNEMENT VISUEL" affiché | |
| Drag fonctionne | Rectangle déplaçable au clic long | |
| Resize fonctionne | Rectangle redimensionnable aux coins | |
| Rotation fonctionne | Rectangle pivotable avec handle | |
| Logs console | Aucune erreur JavaScript | |
| Total modules | 242 modules affichés dans sidebar | |

---

## 🐛 Bugs Potentiels à Surveiller

1. **Erreur "Aucun polygone toiture"** → Vérifier que polygone existe
2. **Rectangle hors de la carte** → Vérifier calcul centrage GPS
3. **Échelle trop petite/grande** → Vérifier scale factor 92%
4. **Transform non chargé** → Vérifier Leaflet Transform disponible
5. **Modules non générés** → Vérifier classe RectangleModuleGroup
6. **Console errors JS** → Vérifier syntaxe template literals

---

## 📊 Comparaison JALIBAT vs 242 Single

| Aspect | JALIBAT (10 rects) | 242 Single (1 rect) |
|--------|-------------------|---------------------|
| Nombre rectangles | 10 | 1 |
| Configuration | 5×2 grid complexe | 22×11 monoblock |
| Modules | 242 (26+24×9) | 242 (22×11) |
| Orientation | Mixte | LANDSCAPE |
| Dimensions | ~85m × 4m | ~37m × 12m |
| Use case | Multi-strings | Monoblock |
| Ajustement | 10 rectangles séparés | 1 seul rectangle |

---

## 📸 Screenshots Attendus

**AVANT import:**
- Carte Leaflet avec polygone toiture vide
- Boutons "IMPORTER TOUT JALIBAT" et "IMPORTER 242 MODULES (1 ARRAY)"

**APRÈS import:**
- Rectangle 22×11 orange centré sur toiture
- Grille modules visible
- Panneau "ALIGNEMENT VISUEL" ouvert
- Compteur "242 MODULES" dans sidebar

**APRÈS ajustement:**
- Rectangle positionné/redimensionné/pivoté pour fit satellite
- Modules alignés avec image satellite visible

---

## 🚀 Prochaines Étapes Après Test Réussi

1. ✅ Valider alignement visuel sur screenshot utilisateur (41.77m × 22.42m)
2. Créer fonction import avec GPS coordinates réelles du bâtiment
3. Intégrer données JALIBAT (si même centrale) pour statuts EL
4. Ajouter presets de configurations courantes (100kWc, 250kWc, etc.)
5. Implémenter sauvegarde configuration en base D1

---

## 📝 Notes de Test

**Date test:** ___________  
**Testeur:** ___________  
**Résultat:** ⬜ RÉUSSI | ⬜ ÉCHEC | ⬜ PARTIEL

**Observations:**
- 
- 
- 

**Bugs identifiés:**
- 
- 
- 
