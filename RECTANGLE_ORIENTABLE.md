# 🔄 Rectangle Orientable - Guide Technique

## 🎯 Problème Résolu

**AVANT :**
- Rectangle Leaflet.draw = aligné axes uniquement (Nord-Sud / Est-Ouest)
- Impossible d'orienter selon angle réel de la toiture
- Modules affichés comme markers simples (A1, A2, etc.)

**APRÈS :**
- Rectangle personnalisé avec rotation complète 0-360°
- Handle de rotation central pour ajuster l'angle
- Modules rendus comme rectangles PV orientés
- Calepinage respecte l'orientation du rectangle

---

## 🏗️ Architecture Technique

### Fichiers Modifiés/Créés

1. **`/home/user/diagnostic-hub/src/rotatable-rectangle.js`** (NOUVEAU)
   - Classe `RotatableRectangle` pour gérer rectangles orientables
   - Calculs trigonométriques pour rotation
   - Génération grille modules orientée

2. **`/home/user/diagnostic-hub/public/static/rotatable-rectangle.js`** (COPIE)
   - Fichier statique servi via Cloudflare Workers
   - Chargé dans `<head>` du module EL

3. **`/home/user/diagnostic-hub/src/index.tsx`** (MODIFIÉ)
   - Intégration système rectangle orientable
   - Nouvelles fonctions rendu modules comme rectangles PV
   - Variables globales : `currentRotatableRectangle`, `moduleRectangles`

---

## 📐 Classe RotatableRectangle

### Constructeur
```javascript
new RotatableRectangle(map, bounds, angle = 0)
```

**Paramètres :**
- `map` : Instance Leaflet map
- `bounds` : L.LatLngBounds du rectangle
- `angle` : Angle initial en degrés (0° = Est, 90° = Nord)

### Méthodes Principales

#### `calculateRotatedCorners()`
Calcule les 4 coins du rectangle après rotation autour du centre.

**Algorithme :**
1. Obtenir centre du rectangle
2. Pour chaque coin : convertir lat/lng → mètres
3. Appliquer rotation 2D : `[x', y'] = [x·cos(θ) - y·sin(θ), x·sin(θ) + y·cos(θ)]`
4. Reconvertir mètres → lat/lng

#### `getOrientedModuleGrid(moduleLength, moduleWidth, spacing)`
Génère grille de positions modules orientée selon angle du rectangle.

**Retour :**
```javascript
[
  { lat, lng, angle, length, width },
  { lat, lng, angle, length, width },
  ...
]
```

#### `createRotationHandle(center)`
Crée marker central draggable pour rotation interactive.

**Comportement :**
- Drag handle → calcule angle entre centre et position handle
- Met à jour `this.angle` en temps réel
- Redessine rectangle avec nouveau angle

---

## 🔧 Intégration dans index.tsx

### Variables Globales Ajoutées

```typescript
let currentRotatableRectangle = null; // Rectangle orientable actuel
let moduleRectangles = []; // Liste modules rendus comme rectangles
```

### Fonction `onDrawCreated()` - MODIFIÉ

**Nouveau comportement pour type === 'rectangle' :**

```typescript
if (type === 'rectangle' && window.RotatableRectangle) {
    const bounds = layer.getBounds();
    const rotatableRect = new window.RotatableRectangle(map, bounds, 0);
    currentRotatableRectangle = rotatableRect;
    
    // Métadonnées
    rotatableRect.layer.options.isRotatable = true;
    rotatableRect.layer.options.rotation = 0;
    
    // Ajouter au groupe
    rotatableRect.addTo(drawnItems, map);
}
```

### Fonction `placeModulesInZone()` - MODIFIÉ

**Détection rectangle orientable :**

```typescript
if (layer.options.isRotatable && currentRotatableRectangle) {
    // Système orienté
    const modules = currentRotatableRectangle.getOrientedModuleGrid(
        layoutData.config.moduleLength,
        layoutData.config.moduleWidth,
        layoutData.config.spacing
    );
    
    clearModuleRectangles();
    layoutData.modules = [];
    
    modules.forEach((module, index) => {
        addOrientedModuleRectangle(module.lat, module.lng, module.angle, ...);
    });
} else {
    // Ancien système non-orienté
    // ... code existant
}
```

### Nouvelles Fonctions

#### `clearModuleRectangles()`
Efface tous les rectangles modules de la carte.

#### `addOrientedModuleRectangle(lat, lng, angle, length, width, index)`
Crée un module comme polygon rectangle orienté + label centré.

**Rendu :**
- Rectangle PV avec 4 coins calculés selon angle
- Couleur : `#60a5fa` (bleu clair)
- Label centré avec ID module (A1, A2, ...)
- Popup avec informations (puissance, angle, dimensions)

---

## 🎨 Style Modules PV

**Rectangles PV :**
```css
.module-pv-rectangle {
    color: #3b82f6;
    weight: 2;
    fillColor: #60a5fa;
    fillOpacity: 0.4;
}
```

**Labels :**
```css
.module-label {
    background: rgba(255,255,255,0.9);
    padding: 2px 4px;
    border-radius: 3px;
    font-size: 10px;
    font-weight: bold;
    border: 1px solid #3b82f6;
}
```

---

## 🚀 Utilisation Utilisateur

### Workflow Complet

1. **Rechercher Adresse**
   - Entrer adresse dans champ recherche
   - Carte zoom automatique niveau 19 (satellite haute résolution)

2. **Dessiner Rectangle**
   - Cliquer icône rectangle (barre outils Leaflet.draw)
   - Tracer rectangle sur toiture visible

3. **Orienter Rectangle**
   - **NOUVEAU** : Drag le point bleu central
   - Rectangle pivote en temps réel
   - Aligner avec angle réel du bâtiment

4. **Placer Modules**
   - Cliquer "Placer Modules" dans popup zone
   - Confirmation affiche : nombre modules + angle rotation
   - Modules apparaissent comme rectangles PV orientés

5. **Audit Modules**
   - Cliquer sur chaque rectangle PV
   - Définir statut : OK, Defect EL, Thermo, I-V, Critical
   - Sélection multiple possible

---

## 🧮 Formules Mathématiques

### Rotation Point 2D

```
Entrée : (x, y), centre (cx, cy), angle θ (radians)

x_rel = x - cx
y_rel = y - cy

x_rot = x_rel · cos(θ) - y_rel · sin(θ)
y_rot = x_rel · sin(θ) + y_rel · cos(θ)

Sortie : (cx + x_rot, cy + y_rot)
```

### Conversion Mètres ↔ Degrés GPS

```
1 degré latitude ≈ 111 320 mètres (constant)
1 degré longitude ≈ 111 320 · cos(latitude) mètres (varie selon latitude)

Δlat = Δy_mètres / 111 320
Δlng = Δx_mètres / (111 320 · cos(lat))
```

### Calcul Angle Handle Rotation

```
dy = (handleLat - centerLat) · 111 320
dx = (handleLng - centerLng) · 111 320 · cos(centerLat)

angle = atan2(dy, dx) · 180/π
```

---

## 🔐 Sécurité Données

**Conservation 100% données existantes :**
- Système backup 4 niveaux maintenu
- LocalStorage `diagpv_audit_session` préservé
- Structure JSON compatible
- Nouveau champ `angle` optionnel dans modules

**Compatibilité descendante :**
```javascript
// Ancien format (toujours supporté)
{ id: "A1", lat: 44.xxx, lng: 0.xxx, hasDefect: false }

// Nouveau format (rectangles orientés)
{ id: "A1", lat: 44.xxx, lng: 0.xxx, angle: 45, hasDefect: false }
```

---

## 🐛 Debug & Logs

### Vérifier Rectangle Orientable Créé

```javascript
// Console navigateur
console.log(currentRotatableRectangle);
// RotatableRectangle { map: {...}, bounds: {...}, angle: 45, ... }
```

### Vérifier Modules Générés

```javascript
console.log(layoutData.modules);
// [{ id: "A1", lat: 44.xxx, lng: 0.xxx, angle: 45 }, ...]
```

### Vérifier Rectangles Rendus

```javascript
console.log(moduleRectangles.length);
// 48 (si 24 modules → 24 rectangles + 24 labels = 48 layers)
```

---

## 📦 Déploiement

### Build Production

```bash
cd /home/user/diagnostic-hub
npm run build
```

**Fichiers générés :**
- `dist/_worker.mjs` : Backend Hono
- `dist/static/rotatable-rectangle.js` : Script rectangle orientable

### Deploy Cloudflare Pages

```bash
npx wrangler pages deploy dist --project-name diagpv-hub
```

**URL Production :**
`https://diagpv-hub.pages.dev`

---

## ✅ Tests Validation

### Test 1 : Création Rectangle
- [ ] Rectangle dessiné apparaît
- [ ] Handle rotation bleu visible au centre
- [ ] Notification "Rectangle Orientable" affichée

### Test 2 : Rotation
- [ ] Drag handle → rectangle pivote
- [ ] Angle mis à jour en temps réel
- [ ] Popup zone affiche angle

### Test 3 : Placement Modules
- [ ] "Placer Modules" génère grille orientée
- [ ] Modules = rectangles bleus (pas markers)
- [ ] Labels A1, A2... centrés sur modules
- [ ] Confirmation affiche angle

### Test 4 : Audit
- [ ] Clic module → popup informations
- [ ] Statut audit modifiable
- [ ] Données sauvegardées

---

## 🔄 Prochaines Évolutions

1. **Rotation Multi-Zones**
   - Support plusieurs rectangles orientables simultanés
   - Gestion zones avec angles différents

2. **Snap Angle**
   - Magnétisation angles 0°, 45°, 90° pendant rotation
   - Aide alignement précis

3. **Export Report**
   - Screenshot satellite avec modules orientés
   - PDF avec plan calepinage

4. **Import Cadastre**
   - Chargement contours parcelles cadastrales
   - Conversion automatique en rectangles orientables

---

## 📞 Support

**Contact :** Adrien - Diagnostic Photovoltaïque
**Email :** [adrien@diagpv.fr]
**GitHub :** [https://github.com/username/diagnostic-hub]

---

**Version :** 2.1.0 - Rectangle Orientable
**Date :** 2025-10-22
**Statut :** ✅ Production Ready
