# 🎯 Test Alignement Visuel PVCarto - Module JALIBAT

**Date:** 2025-11-06  
**Version:** Phase 1 + Amélioration cohérence visuelle

---

## 🔗 URL Test

**Module PVCarto JALIBAT (Zone String 1):**
https://3000-ihjl3q1cxb8r55v93w6w4-6532622b.e2b.dev/pv/plant/6/zone/14/editor/v2

---

## 🎯 Objectif Test

Vérifier que le plan de la centrale (grille modules) peut être **aligné visuellement** avec la photo satellite pour correspondre exactement à la réalité terrain.

---

## 📋 Procédure Test

### **Étape 1: Accéder Module PVCarto**

1. Ouvrir URL: https://3000-ihjl3q1cxb8r55v93w6w4-6532622b.e2b.dev/pv/plant/6/zone/14/editor/v2
2. **Étape 1: TOITURE**
   - Cliquer "DESSINER TOITURE"
   - Tracer polygone jaune autour de la centrale sur satellite
   - Vérifier surface calculée (~6758 m²)

### **Étape 2: Importer JALIBAT**

3. **Section RECTANGLE MODULES**
   - Cliquer bouton bleu: **"IMPORTER TOUT JALIBAT (10 STRINGS)"**
   - Attendre chargement (10 rectangles créés)
   - Lire alert: 242 modules, échelle %, instructions

### **Étape 3: Panneau Aide Affiché**

4. **Panneau orange "🎯 ALIGNEMENT VISUEL"** apparaît automatiquement
   - Instructions visuelles:
     - 📍 DÉPLACER: Clic LONG + Glisser
     - ↔️ REDIMENSIONNER: Poignées jaunes
     - 🔄 ROTATION: Bouton ↻ liste rectangles
   - Bouton "Masquer" disponible

### **Étape 4: Ajustement Visuel**

5. **Ajuster rectangles pour correspondre à la photo satellite:**

   **Option A: Déplacer rectangle**
   - Clic LONG (maintenir 1-2s) sur rectangle
   - Glisser vers nouvelle position
   - Relâcher

   **Option B: Redimensionner**
   - Cliquer poignées jaunes (coins ou bords)
   - Glisser pour ajuster taille
   - Vérifier cohérence visuelle avec satellite

   **Option C: Rotation**
   - Défiler panneau gauche jusqu'à "RECTANGLES CRÉÉS"
   - Cliquer bouton ↻ à droite du rectangle
   - Rotation par pas de 15° (ajustable)

### **Étape 5: Validation**

6. **Vérifier cohérence visuelle:**
   - Rectangles modules correspondent à bâtiments/structures
   - Orientation cohérente (portrait/paysage)
   - Espacement réaliste entre strings
   - Aucun module hors toiture

7. **Sauvegarder:**
   - Bouton vert "ENREGISTRER TOUT" (header)
   - Vérifie GPS modules calculés

---

## ✅ Critères Succès

| Critère | Objectif | Validation |
|---------|----------|------------|
| Import JALIBAT | 10 rectangles, 242 modules | ✅ Alert détaillée |
| Panneau aide | Apparition automatique | ✅ Orange, instructions claires |
| Déplacement | Clic LONG + Glisser | ✅ Rectangle se déplace |
| Redimensionnement | Poignées jaunes | ✅ Taille ajustable |
| Rotation | Bouton ↻ liste | ✅ Rotation fonctionnelle |
| Cohérence visuelle | Plan = Satellite | ✅ **Alignement précis** |

---

## 🐛 Bugs Potentiels à Tester

1. **Clic LONG ne fonctionne pas:**
   - Essayer clic normal puis glisser immédiatement
   - Vérifier console navigateur (F12) erreurs

2. **Poignées jaunes invisibles:**
   - Cliquer rectangle pour le sélectionner d'abord
   - Zoom map suffisant (minimum zoom 18)

3. **Rotation pas visible:**
   - Vérifier si leaflet-path-transform chargé
   - Console: `TypeError: rectangle.transform is undefined`

4. **Rectangles hors toiture:**
   - Marge 4% appliquée automatiquement
   - Ajuster manuellement si nécessaire

---

## 📊 Métriques Attendues

**Console logs après import:**
```
📊 Dimensions toiture: XX.Xm × XX.Xm
📊 Dimensions nécessaires: XX.Xm × XX.Xm
📊 Scale factor appliqué: 0.XXX (XX.X%)
📐 Configuration JALIBAT: 10 rectangles (String 1=26, Strings 2-10=24)
✅ Rectangle 1 créé: String 1 (2×13) - Position: X=0.0m Y=0.0m
...
✅ Rectangle 10 créé: String 10 (2×12) - Position: X=XX.Xm Y=XX.Xm
```

**Alert affichée:**
```
✅ IMPORT GLOBAL JALIBAT TERMINÉ

📦 10 rectangles créés (grille 5×2):
   • String 1: 2×13 = 26 modules
   • Strings 2-10: 2×12 = 24 modules

📊 Total: 242 modules
✅ Statuts EL: XX/242
📏 Échelle: XX.X% (taille réelle)

🎯 PROCHAINE ÉTAPE:
Ajustez visuellement les rectangles pour
correspondre à la photo satellite !

→ Voir panneau 'ALIGNEMENT VISUEL' à gauche
```

---

## 🎥 Capture Écran Attendue

**Avant ajustement:**
- Rectangles génériques positionnés grille 5×2
- Alignement approximatif
- Panneau orange "ALIGNEMENT VISUEL" visible

**Après ajustement:**
- Rectangles superposés EXACTEMENT sur bâtiments satellite
- Orientation correcte (portrait/paysage)
- Cohérence visuelle parfaite

---

## 💡 Améliorations Apportées

1. **Scale factor adaptatif:** 92% toiture (au lieu de 95%)
2. **Marge réduite:** 4% bord (au lieu de 7.5%)
3. **Feedback échelle:** Alert affiche % exact
4. **Panneau aide:** Instructions visuelles automatiques
5. **Console logs:** Dimensions + scale détaillés

---

## 🚀 Prochaines Évolutions (Si Besoin)

**Si alignement encore difficile:**
1. Mode "Calibrage GPS" - Placer 2 points référence
2. Import photo plan DXF avec échelle
3. Grille magnétique (snap to grid)
4. Rotation fine (1° au lieu de 15°)

**Si GPS modules nécessaires:**
1. Calculer GPS à partir de pos_x/pos_y + point ancrage
2. Sauvegarder GPS modules en base
3. Utiliser GPS réels au prochain chargement

---

**Testeur:** Adrien  
**Feedback attendu:** Screenshot avant/après + bugs éventuels  
**Contact:** Retour direct conversation
