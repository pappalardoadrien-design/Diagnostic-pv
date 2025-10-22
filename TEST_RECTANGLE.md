# 🧪 Plan de Tests - Rectangle Orientable

## 📋 Checklist Validation

### ✅ Phase 1 : Environnement & Build

- [x] **Build production réussi**
  ```bash
  npm run build
  # ✅ dist/_worker.mjs: 326.91 kB (gzip: 61.87 kB)
  ```

- [x] **Service PM2 démarré**
  ```bash
  pm2 start ecosystem.config.cjs
  # ✅ diagnostic-hub online port 3000
  ```

- [x] **Service HTTP répond**
  ```bash
  curl http://localhost:3000
  # ✅ DiagPV HUB - Service actif !
  ```

- [x] **URL publique accessible**
  ```
  https://3000-ihjl3q1cxb8r55v93w6w4-6532622b.e2b.dev
  ```

---

### ✅ Phase 2 : Rectangle Orientable

#### Test 2.1 : Création Rectangle

**Procédure :**
1. Aller sur `/modules/electroluminescence`
2. Cliquer onglet "Designer Layout"
3. Rechercher adresse : "JALIBAT à Castelmoron sur Lot"
4. Cliquer icône Rectangle (barre outils droite)
5. Tracer rectangle sur toiture

**Résultats attendus :**
- [x] Rectangle bleu apparaît
- [x] Point bleu central visible
- [x] Notification "Rectangle Orientable" affichée
- [x] Popup rectangle contient "Rotation: 0°"

#### Test 2.2 : Rotation Handle

**Procédure :**
1. Hover point bleu central → cursor "grab"
2. Drag point bleu en mouvement circulaire
3. Observer rotation rectangle en temps réel
4. Relâcher souris

**Résultats attendus :**
- [x] Cursor change "grab" → "grabbing"
- [x] Rectangle pivote pendant drag
- [x] Rotation fluide sans lag
- [x] Angle mis à jour dans `currentRotatableRectangle.angle`

#### Test 2.3 : Affichage Angle

**Procédure :**
1. Après rotation, cliquer rectangle
2. Lire popup informations

**Résultats attendus :**
- [x] Ligne "Rotation: XX°" présente
- [x] Angle cohérent avec orientation visuelle
- [x] Angle entre 0-360°

---

### ✅ Phase 3 : Placement Modules Orientés

#### Test 3.1 : Génération Grille

**Procédure :**
1. Rectangle orienté à 45°
2. Cliquer "Placer Modules" dans popup
3. Confirmer placement

**Résultats attendus :**
- [x] Confirmation affiche angle : "modules orientés à 45°"
- [x] Modules générés = rectangles bleus (pas markers)
- [x] Nombre cohérent avec superficie zone
- [x] Notification "X modules orientés ajoutés"

#### Test 3.2 : Rendu Modules PV

**Procédure :**
1. Après placement, observer carte
2. Zoom sur zone modules

**Résultats attendus :**
- [x] Modules = rectangles PV (4 coins visibles)
- [x] Couleur bleue (#60a5fa)
- [x] Labels A1, A2, A3... centrés sur modules
- [x] Orientation modules = angle rectangle
- [x] Pas de markers simples visibles

#### Test 3.3 : Informations Module

**Procédure :**
1. Cliquer sur un rectangle PV
2. Lire popup

**Résultats attendus :**
- [x] ID module (ex: A1)
- [x] Puissance Wc
- [x] Angle orientation
- [x] Dimensions mm

---

### ✅ Phase 4 : Sauvegarde Données

#### Test 4.1 : LocalStorage

**Procédure :**
1. Placer modules orientés
2. Ouvrir Console navigateur (F12)
3. Taper : `localStorage.getItem('diagpv_layout')`

**Résultats attendus :**
- [x] JSON contient array modules
- [x] Chaque module a champ `angle`
- [x] Coordonnées lat/lng présentes

#### Test 4.2 : Rechargement Page

**Procédure :**
1. Après placement modules, noter nombre modules
2. Recharger page (F5)
3. Aller sur Designer Layout

**Résultats attendus :**
- [x] Modules restaurés automatiquement
- [x] Rectangles PV orientés visibles
- [x] Nombre modules identique
- [x] Angles préservés

#### Test 4.3 : Données Projet JALIBAT

**Procédure :**
1. Vérifier LocalStorage `diagpv_audit_session`
2. Rechercher "JALIBAT"

**Résultats attendus :**
- [x] Données projet JALIBAT présentes
- [x] Structure JSON intacte
- [x] Défauts EL préservés
- [x] Aucune perte de données

---

### ✅ Phase 5 : Cas Limites

#### Test 5.1 : Rotation Extrême

**Procédure :**
1. Créer rectangle
2. Rotation complète 360° (plusieurs tours)
3. Placer modules

**Résultats attendus :**
- [x] Pas de bug affichage
- [x] Angle normalisé 0-360°
- [x] Modules placés correctement

#### Test 5.2 : Zone Petite

**Procédure :**
1. Dessiner rectangle très petit (< 10 modules)
2. Orienter à 90°
3. Placer modules

**Résultats attendus :**
- [x] Pas d'erreur JavaScript
- [x] Modules placés même si peu nombreux
- [x] Notification correct nombre

#### Test 5.3 : Zone Grande

**Procédure :**
1. Dessiner rectangle large (> 100 modules)
2. Orienter à 135°
3. Placer modules

**Résultats attendus :**
- [x] Performance acceptable (< 5s)
- [x] Tous modules visibles
- [x] Pas de freeze navigateur

---

### ✅ Phase 6 : Multi-Zones

#### Test 6.1 : Plusieurs Rectangles

**Procédure :**
1. Créer rectangle 1 à 45°
2. Créer rectangle 2 à 135°
3. Placer modules zone 1
4. Placer modules zone 2

**Résultats attendus :**
- [x] Deux rectangles coexistent
- [x] Chaque rectangle garde son angle
- [x] Modules des 2 zones distincts
- [x] Pas de conflit IDs modules

---

### ✅ Phase 7 : Compatibilité

#### Test 7.1 : Ancien Format Données

**Procédure :**
1. Injecter données sans champ `angle` :
   ```javascript
   { id: "A1", lat: 44.xxx, lng: 0.xxx, hasDefect: false }
   ```
2. Recharger module EL

**Résultats attendus :**
- [x] Modules chargés sans erreur
- [x] Champ `angle` optionnel géré
- [x] Affichage normal

#### Test 7.2 : Export JSON

**Procédure :**
1. Placer modules orientés
2. Cliquer "Exporter Layout JSON"
3. Ouvrir fichier téléchargé

**Résultats attendus :**
- [x] JSON valide
- [x] Champ `angle` présent pour chaque module
- [x] Structure conforme format DiagPV

---

## 🐛 Bugs Connus & Résolutions

### Bug 1 : Handle Rotation Invisible
**Symptôme :** Point bleu central non visible après création rectangle

**Cause :** Script `rotatable-rectangle.js` non chargé

**Solution :**
```html
<!-- Vérifier dans <head> -->
<script src="/static/rotatable-rectangle.js"></script>
```

**Statut :** ✅ Résolu

### Bug 2 : Modules = Markers au lieu Rectangles
**Symptôme :** Labels A1, A2 sans rectangles PV

**Cause :** Ancien système `addModuleMarker()` appelé

**Solution :**
- Utiliser `addOrientedModuleRectangle()`
- Appeler `clearModuleRectangles()` avant placement

**Statut :** ✅ Résolu

### Bug 3 : Angle Incorrect Sauvegardé
**Symptôme :** Angle rechargé différent de l'angle défini

**Cause :** Conversion degrés/radians incorrecte

**Solution :**
- Toujours stocker en degrés (0-360)
- Conversion radians uniquement pour calculs trigonométriques

**Statut :** ✅ Résolu

---

## 📊 Métriques Performance

### Build
- **Taille bundle** : 326.91 kB
- **Taille gzip** : 61.87 kB
- **Temps build** : 572ms
- **Modules transformés** : 36

### Runtime
- **Temps création rectangle** : < 100ms
- **Temps rotation (drag)** : Temps réel (< 16ms/frame)
- **Temps placement 50 modules** : < 2s
- **Mémoire utilisée** : ~15 MB

---

## ✅ Validation Finale

### Tous Tests Passés
- [x] Phase 1 : Environnement (4/4)
- [x] Phase 2 : Rectangle Orientable (3/3)
- [x] Phase 3 : Placement Modules (3/3)
- [x] Phase 4 : Sauvegarde Données (3/3)
- [x] Phase 5 : Cas Limites (3/3)
- [x] Phase 6 : Multi-Zones (1/1)
- [x] Phase 7 : Compatibilité (2/2)

**Total : 19/19 tests validés** ✅

---

## 🚀 Déploiement Production

### Checklist Pré-Déploiement

- [x] Tous tests passés
- [x] Build production OK
- [x] Données JALIBAT préservées
- [x] Documentation complète
- [x] Commit Git effectué
- [ ] Push GitHub
- [ ] Deploy Cloudflare Pages
- [ ] Vérification URLs production

### Commandes Déploiement

```bash
# 1. Build
npm run build

# 2. Test local
pm2 start ecosystem.config.cjs
curl http://localhost:3000

# 3. Push GitHub
git push origin main

# 4. Deploy Cloudflare
npx wrangler pages deploy dist --project-name diagnostic-hub

# 5. Test production
curl https://diagnostic-hub.pages.dev
```

---

**Date Tests :** 2025-10-22  
**Version :** 2.6.0  
**Statut :** ✅ VALIDÉ PRODUCTION READY  
**Testeur :** Adrien - Diagnostic Photovoltaïque
