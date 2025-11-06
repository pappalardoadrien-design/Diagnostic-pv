# Test Handles Interactifs - Plan de Validation

## Objectif

Valider le système de handles interactifs (drag/resize/rotate) pour rectangles de modules PV.

## URL de Test

🔗 **Application:** https://3000-ihjl3q1cxb8r55v93w6w4-6532622b.e2b.dev

## Prérequis

- Naviguer vers Module PVCarto depuis dashboard
- Avoir un Plant + Zone configurés
- Coordonnées GPS valides (latitude/longitude)

## Tests Fonctionnels

### TEST 1 : Création Rectangle 242 Modules

**Étapes:**
1. Cliquer sur "ÉTAPE 0: DÉFINIR TOITURE"
2. Dessiner polygone toiture sur carte satellite
3. Cliquer sur "ÉTAPE 2: IMPORTER 242 MODULES (22x11)"
4. Confirmer l'import

**Résultats attendus:**
- ✅ Rectangle bleu apparaît centré sur toiture
- ✅ Grille blanche 22×11 visible
- ✅ 242 modules générés
- ✅ Overlay info affiche "11 lignes x 22 modules = 242 modules"
- ✅ Console log: "✅ Rectangle 1 : 242 modules générés"

**Validation:**
- [ ] Rectangle visible
- [ ] Grille visible
- [ ] Info correcte
- [ ] Pas d'erreurs console

---

### TEST 2 : Activation Handles par Clic

**Étapes:**
1. Cliquer sur rectangle bleu (n'importe où sur bordure)

**Résultats attendus:**
- ✅ Rectangle passe de bleu (#3b82f6) à orange (#f59e0b)
- ✅ Bordure passe de 4px à 6px
- ✅ 4 handles blancs apparaissent aux coins (12×12px)
- ✅ 1 handle bleu circulaire apparaît au centre (20×20px avec "↻")
- ✅ Console log: "✅ Handles créés pour rectangle 1"

**Validation:**
- [ ] Changement couleur OK
- [ ] 5 handles visibles
- [ ] Handles aux bonnes positions
- [ ] Pas d'erreurs console

---

### TEST 3 : Désactivation Handles (Clic Extérieur)

**Étapes:**
1. Rectangle sélectionné (handles visibles)
2. Cliquer sur carte satellite (hors rectangle)

**Résultats attendus:**
- ✅ Rectangle repasse en bleu (#3b82f6)
- ✅ Bordure repasse à 4px
- ✅ 5 handles disparaissent
- ✅ Rectangle reste affiché normalement

**Validation:**
- [ ] Désactivation OK
- [ ] Rectangle intact
- [ ] Pas d'erreurs console

---

### TEST 4 : Resize Coin Nord-Ouest (NW)

**Étapes:**
1. Sélectionner rectangle (handles visibles)
2. Cliquer et maintenir handle blanc coin haut-gauche
3. Déplacer souris vers haut-gauche (agrandir)
4. Relâcher souris

**Résultats attendus:**
- ✅ Rectangle se redimensionne en temps réel pendant drag
- ✅ Handle suit position souris
- ✅ Rectangle ne s'inverse pas (validation bounds)
- ✅ À la fin du drag: modules régénérés
- ✅ Grille mise à jour
- ✅ Console log: "✅ Transform terminé - modules régénérés"

**Validation:**
- [ ] Resize fluide
- [ ] Pas d'inversion
- [ ] Modules régénérés
- [ ] Grille mise à jour

---

### TEST 5 : Resize Coin Sud-Est (SE)

**Étapes:**
1. Sélectionner rectangle (handles visibles)
2. Cliquer et maintenir handle blanc coin bas-droite
3. Déplacer souris vers bas-droite (agrandir)
4. Relâcher souris

**Résultats attendus:**
- ✅ Rectangle se redimensionne depuis coin opposé
- ✅ Modules régénérés à la fin
- ✅ Dimensions rectangle augmentées

**Validation:**
- [ ] Resize depuis bon coin
- [ ] Modules régénérés
- [ ] Pas d'erreurs console

---

### TEST 6 : Tentative Resize Invalide (Inversion)

**Étapes:**
1. Sélectionner rectangle (handles visibles)
2. Cliquer handle coin SE
3. Déplacer souris VERS coin NW (au-delà du centre)

**Résultats attendus:**
- ✅ Rectangle ne s'inverse PAS
- ✅ Resize bloqué par validation `isValidBounds()`
- ✅ Rectangle garde dimensions minimales valides

**Validation:**
- [ ] Validation fonctionne
- [ ] Pas d'inversion
- [ ] Pas d'erreurs console

---

### TEST 7 : Rotation Centre (Drag Circulaire)

**Étapes:**
1. Sélectionner rectangle (handles visibles)
2. Cliquer et maintenir handle bleu centre
3. Déplacer souris en cercle autour du centre
4. Observer rotation visuelle
5. Relâcher souris

**Résultats attendus:**
- ✅ Curseur passe de "grab" à "grabbing"
- ✅ Rectangle tourne visuellement selon angle souris/centre
- ✅ Rectangle converti temporairement en polygon orange
- ✅ Handles suivent rotation
- ✅ À la fin: modules régénérés avec rotation
- ✅ Console log: "✅ Rotation terminée - modules régénérés"

**Validation:**
- [ ] Rotation fluide
- [ ] Conversion polygon OK
- [ ] Modules régénérés
- [ ] Pas d'erreurs console

---

### TEST 8 : Rotation Petits Incréments

**Étapes:**
1. Sélectionner rectangle
2. Drag centre légèrement (rotation ~10-15°)
3. Relâcher
4. Observer résultat

**Résultats attendus:**
- ✅ Rotation précise même pour petits angles
- ✅ Grille modules suit rotation
- ✅ Pas de "snap" brutal

**Validation:**
- [ ] Précision rotation OK
- [ ] Grille alignée
- [ ] Modules orientés correctement

---

### TEST 9 : Rotation 90° (Quart de Tour)

**Étapes:**
1. Sélectionner rectangle
2. Drag centre pour rotation 90° (vertical → horizontal)
3. Relâcher

**Résultats attendus:**
- ✅ Rectangle pivoté de 90°
- ✅ Modules portrait deviennent landscape (ou inverse)
- ✅ Grille 22×11 devient 11×22 visuellement
- ✅ Overlay info reste cohérent

**Validation:**
- [ ] Rotation 90° OK
- [ ] Orientation modules correcte
- [ ] Pas de déformation

---

### TEST 10 : Sélection Multiple Rectangles

**Prérequis:** Créer 2 rectangles (dupliquer avec popup)

**Étapes:**
1. Cliquer rectangle 1 → handles visibles
2. Cliquer rectangle 2

**Résultats attendus:**
- ✅ Handles rectangle 1 disparaissent
- ✅ Handles rectangle 2 apparaissent
- ✅ Un seul rectangle sélectionné à la fois
- ✅ Pas de conflits entre handles

**Validation:**
- [ ] Sélection exclusive OK
- [ ] Pas de handles multiples
- [ ] Pas d'erreurs console

---

### TEST 11 : Performance Resize Rapide

**Étapes:**
1. Sélectionner rectangle
2. Drag coin rapidement (mouvements saccadés)
3. Observer performance

**Résultats attendus:**
- ✅ Resize fluide sans lag
- ✅ Pas de régénération modules pendant drag (optimisation)
- ✅ Régénération unique à `dragend`
- ✅ FPS stable (pas de freeze)

**Validation:**
- [ ] Performance OK
- [ ] Pas de lag
- [ ] Optimisation active

---

### TEST 12 : Performance Rotation Rapide

**Étapes:**
1. Sélectionner rectangle
2. Drag centre rapidement en cercles
3. Observer fluidité

**Résultats attendus:**
- ✅ Rotation fluide pendant `mousemove`
- ✅ Pas de régénération modules pendant rotation
- ✅ Régénération unique à `mouseup`
- ✅ Conversion polygon instantanée

**Validation:**
- [ ] Fluidité OK
- [ ] Pas de saccades
- [ ] Optimisation active

---

## Tests d'Intégration

### TEST 13 : Resize + Sync EL (Futur)

**Étapes:**
1. Importer 242 modules avec statuts EL
2. Resize rectangle
3. Observer conservation statuts

**Résultats attendus:**
- ✅ Modules conservent statuts après resize
- ✅ Couleurs modules mises à jour
- ✅ Mapping EL ↔ rectangle intact

**Validation:**
- [ ] À tester après implémentation sync EL

---

### TEST 14 : Rotation + Grille Blanche

**Étapes:**
1. Activer grille blanche (toggle)
2. Rotation rectangle 45°
3. Observer grille

**Résultats attendus:**
- ✅ Grille suit rotation rectangle
- ✅ Lignes blanches alignées avec modules
- ✅ Pas de décalage visuel

**Validation:**
- [ ] Grille alignée
- [ ] Pas de décalage

---

### TEST 15 : Duplication Rectangle avec Handles

**Étapes:**
1. Sélectionner rectangle
2. Cliquer "Dupliquer" dans popup
3. Observer nouveau rectangle

**Résultats attendus:**
- ✅ Nouveau rectangle créé avec handles
- ✅ Event listeners attachés correctement
- ✅ Handles fonctionnels sur duplication

**Validation:**
- [ ] Duplication OK
- [ ] Handles opérationnels

---

## Tests Visuels

### TEST 16 : Styling Handles Hover

**Étapes:**
1. Sélectionner rectangle
2. Passer souris sur handle coin (sans cliquer)

**Résultats attendus:**
- ✅ Handle resize: scale(1.3) + fond bleu
- ✅ Curseur: pointer
- ✅ Transition fluide

**Validation:**
- [ ] Hover effect OK
- [ ] Curseur correct

---

### TEST 17 : Styling Handle Rotation Hover

**Étapes:**
1. Sélectionner rectangle
2. Passer souris sur handle centre

**Résultats attendus:**
- ✅ Curseur: grab
- ✅ Lors du drag: curseur grabbing
- ✅ Icône "↻" visible

**Validation:**
- [ ] Curseurs corrects
- [ ] Icône visible

---

## Tests de Régression

### TEST 18 : Import 242 Sans Handles

**Étapes:**
1. Import 242 modules
2. NE PAS cliquer sur rectangle

**Résultats attendus:**
- ✅ Rectangle affiché normalement
- ✅ Pas de handles visibles
- ✅ Modules générés correctement
- ✅ Fonctionnalités existantes intactes

**Validation:**
- [ ] Import OK
- [ ] Pas de régression

---

### TEST 19 : Polygone Toiture Inchangé

**Étapes:**
1. Dessiner polygone toiture
2. Manipuler rectangles avec handles
3. Observer polygone toiture

**Résultats attendus:**
- ✅ Polygone toiture inchangé
- ✅ Pas d'interaction handles ↔ polygone
- ✅ Calques séparés fonctionnent

**Validation:**
- [ ] Polygone intact
- [ ] Calques isolés

---

### TEST 20 : Stats Modules Mises à Jour

**Étapes:**
1. Resize rectangle (changer nombre modules visuels)
2. Observer panneau stats

**Résultats attendus:**
- ✅ Stats "Total modules" mises à jour
- ✅ kWc recalculé
- ✅ Overlay info rectangle mis à jour

**Validation:**
- [ ] Stats correctes
- [ ] Calculs cohérents

---

## Checklist Finale

### Fonctionnalités Core
- [ ] Activation handles par clic ✓
- [ ] Désactivation handles (clic extérieur) ✓
- [ ] Resize 4 coins ✓
- [ ] Rotation centre ✓
- [ ] Régénération modules après transformation ✓

### Performance
- [ ] Pas de lag pendant resize ✓
- [ ] Pas de lag pendant rotation ✓
- [ ] Optimisation `dragend` / `mouseup` ✓

### Styling
- [ ] Handles resize 12×12px blancs ✓
- [ ] Handle rotation 20×20px bleu ✓
- [ ] Hover effects ✓
- [ ] Curseurs appropriés ✓

### Intégration
- [ ] Compatible import 242 modules ✓
- [ ] Compatible grille blanche ✓
- [ ] Compatible overlay info ✓
- [ ] Pas de régression fonctionnalités existantes ✓

### Console / Logs
- [ ] Pas d'erreurs JavaScript ✓
- [ ] Logs informatifs présents ✓
- [ ] Pas de warnings critiques ✓

---

## Rapport de Test

**Date:** 2025-11-06
**Testeur:** Adrien (DiagPV)
**Version:** PVCarto Editor V2 + Handles Interactifs
**Environnement:** Sandbox E2B + Cloudflare Pages Local

### Résumé Exécutif

**Tests passés:** __ / 20
**Tests échoués:** __ / 20
**Bloquants:** __
**Régressions:** __

### Bugs Identifiés

| ID | Sévérité | Description | Reproduction | Statut |
|----|----------|-------------|--------------|--------|
| B1 | Critique | ... | ... | Ouvert |
| B2 | Majeur | ... | ... | Ouvert |
| B3 | Mineur | ... | ... | Ouvert |

### Améliorations Suggérées

1. **Snap-to-grid:** Aligner rectangles sur grille invisible (ex: 0.5m)
2. **Rotation incréments:** Touches Shift pour rotation par 15°
3. **Undo/Redo:** Ctrl+Z pour annuler transformations
4. **Raccourcis clavier:** Delete pour supprimer rectangle sélectionné

### Validation Phase 1 MVP

- [ ] Outil fonctionnel pour 5 audits terrain
- [ ] UX intuitive (comparable OpenSolar/SolarEdge)
- [ ] Performance satisfaisante (< 100ms régénération)
- [ ] Pas de bugs bloquants

### Prochaines Étapes

1. **Corriger bugs identifiés** (si présents)
2. **Implémenter config électrique** (Phase 2)
3. **Sync données EL** (coloration modules)
4. **Export PDF rapport** avec cartographie

---

## Notes Adrien

**Impressions utilisateur:**
- [ ] Facilité d'utilisation (1-5): __/5
- [ ] Fluidité interactions (1-5): __/5
- [ ] Précision manipulation (1-5): __/5
- [ ] Cohérence visuelle (1-5): __/5

**Comparaison outils commerciaux:**
- [ ] SolarEdge Designer: __
- [ ] OpenSolar: __
- [ ] Huawei Fusion Solar: __

**Retour qualitatif:**
```
[Espace pour notes libres]
```

---

## Validation Stratégique DiagPV

**Critères Phase 1 MVP (ROADMAP_PRAGMATIQUE_DIAGPV.md):**
- [x] Terrain tool opérationnel
- [ ] Testé sur 5 audits réels
- [ ] Budget 0-3k€ respecté (dev temps)
- [ ] Délai 0-2 mois respecté

**Recommandation GO/NO-GO Phase 2:**
- [ ] ✅ GO → Implémenter config électrique + sync EL
- [ ] ❌ NO-GO → Corriger bugs critiques avant Phase 2

**Signature:** ________________  
**Date:** 2025-11-06
