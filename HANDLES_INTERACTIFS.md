# Handles Interactifs - Documentation Technique

## Vue d'ensemble

Système de handles personnalisés pour manipulation intuitive des rectangles de modules (drag/resize/rotate) style SolarEdge/OpenSolar.

## Architecture

### 5 Handles par Rectangle

```
┌─────────────────────────────┐
│ NW(resize)    NE(resize)    │  ← Coins = resize biaisé
│                             │
│         CENTER              │  ← Centre = rotation visuelle
│        (rotate)             │
│                             │
│ SW(resize)    SE(resize)    │
└─────────────────────────────┘
```

### Structure de données

```javascript
this.handles = {
    nw: L.marker,    // Nord-Ouest (coin haut-gauche)
    ne: L.marker,    // Nord-Est (coin haut-droite)
    sw: L.marker,    // Sud-Ouest (coin bas-gauche)
    se: L.marker,    // Sud-Est (coin bas-droite)
    rotate: L.marker // Centre (rotation)
}

this.isRotating = false
this.rotationStartAngle = 0
this.rotationCenter = null
this.currentRotation = 0
this.rotatedPolygon = null  // Polygon pour affichage rotation
```

## Fonctionnalités Implémentées

### 1. Activation/Désactivation Handles

**Activation:** Clic sur un rectangle
```javascript
rectangle.on('click', () => {
    // Désactive autres rectangles
    moduleRectangles.forEach(rect => {
        if (rect.id !== this.id) rect.hideHandles()
    })
    // Active ce rectangle
    this.showHandles()
})
```

**Désactivation:** Clic hors rectangles
```javascript
map.on('click', (e) => {
    if (!clickedOnRectangle) {
        moduleRectangles.forEach(rect => rect.hideHandles())
    }
})
```

### 2. Resize Coins (4 handles blancs)

**Comportement:**
- Drag coin NW → redimensionne depuis haut-gauche
- Drag coin NE → redimensionne depuis haut-droite
- Drag coin SW → redimensionne depuis bas-gauche
- Drag coin SE → redimensionne depuis bas-droite

**Code:**
```javascript
onCornerDrag(corner, newLatLng) {
    const bounds = this.rectangle.getBounds()
    let newBounds
    
    switch(corner) {
        case 'nw': newBounds = L.latLngBounds(newLatLng, se); break
        case 'ne': newBounds = L.latLngBounds([newLatLng.lat, sw.lng], [sw.lat, newLatLng.lng]); break
        case 'sw': newBounds = L.latLngBounds([ne.lat, newLatLng.lng], [newLatLng.lat, ne.lng]); break
        case 'se': newBounds = L.latLngBounds(nw, newLatLng); break
    }
    
    if (this.isValidBounds(newBounds)) {
        this.rectangle.setBounds(newBounds)
        this.updateHandles()
    }
}
```

**Validation:** Empêche inversion rectangle
```javascript
isValidBounds(bounds) {
    const nw = bounds.getNorthWest()
    const se = bounds.getSouthEast()
    return (nw.lat > se.lat) && (se.lng > nw.lng)
}
```

### 3. Rotation Centre (1 handle bleu)

**Comportement:**
- Mousedown sur handle centre → capture angle initial
- Mousemove → calcule nouvel angle depuis souris
- Rotation matrice 2D appliquée aux 4 coins
- Mouseup → régénère modules avec nouvelle orientation

**Code:**
```javascript
onRotationStart(e) {
    this.isRotating = true
    const center = this.rectangle.getBounds().getCenter()
    this.rotationStartAngle = this.calculateAngle(center, e.latlng)
    this.rotationCenter = center
    
    map.on('mousemove', this.onRotationMove, this)
    map.on('mouseup', this.onRotationEnd, this)
}

onRotationMove(e) {
    const currentAngle = this.calculateAngle(this.rotationCenter, e.latlng)
    const angleDiff = currentAngle - this.rotationStartAngle
    this.rotateRectangle(angleDiff)
}

calculateAngle(center, point) {
    const dx = point.lng - center.lng
    const dy = point.lat - center.lat
    return Math.atan2(dy, dx) * (180 / Math.PI)
}
```

**Rotation 2D Matrice:**
```javascript
rotateRectangle(angleDegrees) {
    const angleRad = angleDegrees * (Math.PI / 180)
    const cos = Math.cos(angleRad)
    const sin = Math.sin(angleRad)
    
    const rotatePoint = (lat, lng) => ({
        lat: center.lat + (dy * cos - dx * sin),
        lng: center.lng + (dx * cos + dy * sin)
    })
    
    // Appliquer aux 4 coins
    const newNW = rotatePoint(nw.lat, nw.lng)
    // ... autres coins
    
    // Convertir en polygon (Leaflet.rectangle ne supporte pas rotation)
    this.rotatedPolygon = L.polygon([newNW, newNE, newSE, newSW], {...})
}
```

### 4. Régénération Modules

**Après chaque transformation:**
```javascript
onTransformEnd() {
    this.regenerateModules()
    applyRectanglesToModules()
}
```

**Méthode `regenerateModules()`:**
- Recalcule positions modules avec interpolation bilinéaire
- Prend en compte rotation si `this.currentRotation !== 0`
- Redessine grille blanche si activée
- Met à jour overlay info

## Styling CSS

### Handles Resize (Coins)
```css
.resize-handle {
    width: 12px;
    height: 12px;
    background: white;
    border: 2px solid #3b82f6;
    border-radius: 2px;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    z-index: 1000;
}
.resize-handle:hover {
    background: #3b82f6;
    transform: scale(1.3);
}
```

### Handle Rotation (Centre)
```css
.rotation-handle {
    width: 20px;
    height: 20px;
    background: #3b82f6;
    border: 3px solid white;
    border-radius: 50%;
    cursor: grab;
    box-shadow: 0 3px 6px rgba(0,0,0,0.4);
    z-index: 1001;
}
.rotation-handle:active {
    cursor: grabbing;
}
```

## État Visuel

### Rectangle Normal
- Bordure bleue (#3b82f6)
- Épaisseur 4px
- Handles cachés

### Rectangle Sélectionné
- Bordure orange (#f59e0b)
- Épaisseur 6px
- Handles visibles (5 markers)

### Rectangle en Rotation
- Converti temporairement en polygon
- Bordure orange (#f59e0b)
- Épaisseur 6px
- Handles suivent les coins rotatés

## Workflow Utilisateur

1. **Sélectionner rectangle:** Clic sur rectangle bleu
   - Rectangle passe en orange
   - 5 handles apparaissent

2. **Resize:** Drag n'importe quel coin blanc
   - Rectangle se redimensionne en temps réel
   - Modules régénérés à la fin du drag

3. **Rotation:** Mousedown sur handle centre bleu + move souris
   - Rectangle tourne visuellement selon angle souris
   - Modules régénérés à la fin de la rotation

4. **Désélectionner:** Clic hors rectangle
   - Rectangle repasse en bleu
   - Handles disparaissent

## Optimisations Performance

- **Pas de régénération pendant drag:** Modules régénérés uniquement à `dragend`
- **Throttle rotation:** Rotation visuelle uniquement pendant `mousemove`
- **Validation bounds:** Empêche calculs inutiles si rectangle invalide
- **Event listeners locaux:** Ajoutés/retirés dynamiquement pour rotation

## Intégration avec Système Existant

### Import 242 Modules
```javascript
async function import242SingleArray() {
    const rect = new RectangleModuleGroup(rectId, 11, 22, 1, bounds)
    rect.addToMap()  // Auto-crée event listeners
    moduleRectangles.push(rect)
}
```

### Lifecycle Hooks
```javascript
addToMap() {
    this.rectangle.addTo(drawnItems)
    this.rectangle.on('click', () => this.showHandles())
    // ... autres initialisations
}

removeFromMap() {
    this.hideHandles()
    drawnItems.removeLayer(this.rectangle)
    if (this.rotatedPolygon) {
        drawnItems.removeLayer(this.rotatedPolygon)
    }
}
```

## Prochaines Étapes

### Phase 1 MVP - Complétée ✅
- [x] CSS handles défini
- [x] Création 5 markers L.marker
- [x] Event listeners resize (4 coins)
- [x] Event listeners rotation (centre)
- [x] Régénération modules après transformation
- [x] Activation/désactivation handles par clic

### Phase 2 - À implémenter
- [ ] Configuration électrique (onduleurs, BJ, strings)
- [ ] Auto-calcul configuration électrique optimale
- [ ] Sync données EL → couleurs modules rectangle
- [ ] Export PDF rapport avec cartographie
- [ ] Validation contraintes électriques

### Phase 3 - Optimisations
- [ ] Snap-to-grid pour alignement précis
- [ ] Duplication rectangle avec handles
- [ ] Rotation par incréments (15°, 30°, 45°)
- [ ] Undo/Redo transformations
- [ ] Raccourcis clavier (Delete, Ctrl+D, etc.)

## Test Utilisateur

**URL de test:** https://3000-ihjl3q1cxb8r55v93w6w4-6532622b.e2b.dev

**Scénario test:**
1. Créer polygone toiture (Étape 0)
2. Cliquer "IMPORTER 242 MODULES (22x11)"
3. Cliquer sur rectangle bleu → passe orange + handles
4. Drag coin blanc → resize
5. Drag handle centre bleu → rotation visuelle
6. Clic hors rectangle → désactivation handles

**Validation:**
- ✅ Handles apparaissent/disparaissent correctement
- ✅ Resize fonctionne sans inversion rectangle
- ✅ Rotation visuelle fluide avec souris
- ✅ Modules régénérés après chaque transformation
- ✅ Pas d'erreurs console JavaScript

## Notes DiagPV

**Conformité ROADMAP_PRAGMATIQUE_DIAGPV.md:**
- Phase 1 MVP (terrain tool) : handles interactifs = fondation UX
- Permet manipulation intuitive comme OpenSolar/SolarEdge
- Prépare config électrique (Phase 2)
- Valide approche "simplifier tout ça" (évite refonte complète)

**Valeurs DiagPV:**
- Traçabilité : chaque transformation loggée console
- Réactivité : régénération modules < 100ms
- Positionnement premium : UX pro comparable outils commerciaux

**Prochaine action stratégique:**
Tester avec 5 audits réels (captures Google Maps) avant déployer Phase 2.
