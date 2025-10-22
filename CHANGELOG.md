# 📋 CHANGELOG - Diagnostic Photovoltaïque HUB

## [2.6.0] - 2025-10-22 🔄 Rectangle Orientable

### ✨ Nouvelles Fonctionnalités Majeures

#### 🎯 Rectangle Orientable SolarEdge-Style
**Problème résolu :** Impossibilité d'orienter les rectangles selon l'angle réel des toitures visibles sur imagerie satellite.

**Solution implémentée :**
- ✅ Rectangle personnalisé avec rotation 0-360°
- ✅ Handle de rotation central (point bleu draggable)
- ✅ Calculs trigonométriques 2D pour rotation précise
- ✅ Grille modules orientée automatiquement selon angle rectangle
- ✅ Rendu modules comme rectangles PV au lieu de markers simples

**Fichiers créés :**
- `src/rotatable-rectangle.js` : Classe `RotatableRectangle` complète
- `public/static/rotatable-rectangle.js` : Script statique Cloudflare Workers
- `RECTANGLE_ORIENTABLE.md` : Documentation technique complète

**Modifications :**
- `src/index.tsx` :
  - Nouvelles variables globales : `currentRotatableRectangle`, `moduleRectangles`
  - Fonction `onDrawCreated()` : Détection + conversion rectangle → orientable
  - Fonction `placeModulesInZone()` : Système grille orientée vs standard
  - Nouvelles fonctions : `clearModuleRectangles()`, `addOrientedModuleRectangle()`
  - Fonction `selectZoneForModules()` : Affichage angle rotation dans popup

#### 🎨 Rendu Modules PV Orientés
**Avant :** Modules = markers simples avec labels A1, A2, A3...
**Après :** Modules = rectangles PV bleus orientés + labels centrés

**Style modules :**
```css
Rectangle PV : #60a5fa (bleu clair), fillOpacity 0.4
Label : Blanc rgba(255,255,255,0.9), bordure bleue
```

**Informations popup :**
- ID module (A1, A2, ...)
- Puissance (Wc)
- Angle orientation (°)
- Dimensions (mm)

#### 📐 Formules Mathématiques Implémentées

**Rotation point 2D :**
```
x' = x·cos(θ) - y·sin(θ)
y' = x·sin(θ) + y·cos(θ)
```

**Conversion mètres ↔ GPS :**
```
1° latitude ≈ 111 320 m
1° longitude ≈ 111 320 · cos(lat) m
```

**Calcul angle handle :**
```
angle = atan2(dy, dx) · 180/π
```

### 🔐 Conservation Données

✅ **100% données existantes préservées**
- Système backup 4 niveaux maintenu
- LocalStorage `diagpv_audit_session` intact
- Projet JALIBAT Castelmoron sur Lot conservé
- Structure JSON rétro-compatible

**Nouveau champ optionnel :**
```javascript
// Ancien format (toujours supporté)
{ id: "A1", lat: 44.xxx, lng: 0.xxx, hasDefect: false }

// Nouveau format (avec orientation)
{ id: "A1", lat: 44.xxx, lng: 0.xxx, angle: 45, hasDefect: false }
```

### 🚀 Workflow Utilisateur Amélioré

1. **Recherche adresse** → Zoom satellite niveau 19
2. **Dessiner rectangle** → Outil Leaflet.draw
3. **🆕 Orienter rectangle** → Drag handle bleu central
4. **Placer modules** → Grille orientée automatique
5. **Audit modules** → Clic rectangles PV orientés

### 🧪 Tests Validation

- [x] Rectangle créé avec handle rotation visible
- [x] Drag handle → rotation temps réel
- [x] Angle affiché dans popup zone
- [x] Modules générés = rectangles orientés
- [x] Labels A1, A2... centrés
- [x] Données sauvegardées avec angle
- [x] Build production réussi (326.91 kB)
- [x] Service PM2 opérationnel port 3000

### 📦 Déploiement

**Build :**
```bash
npm run build
# dist/_worker.mjs : 326.91 kB (gzip: 61.87 kB)
```

**Service :**
```bash
pm2 start ecosystem.config.cjs
curl http://localhost:3000
# ✅ DiagPV HUB - Service actif !
```

**URL Sandbox :**
https://3000-ihjl3q1cxb8r55v93w6w4-6532622b.e2b.dev

### 🐛 Corrections

- ✅ Template literals → Concaténation strings (build errors)
- ✅ Polygon tool désactivé → Rectangle uniquement
- ✅ Address search Nominatim API fixed
- ✅ Modules markers → Rectangles PV orientés

### 📝 Documentation

**Fichiers ajoutés :**
- `RECTANGLE_ORIENTABLE.md` : Guide technique complet (8.7 kB)
- `CHANGELOG.md` : Ce fichier
- `src/index_backup_before_rotation.tsx` : Backup sécurité

**README mis à jour :**
- Section Rectangle Orientable ajoutée
- Version 2.6.0 documentée
- Statut déploiement actualisé

---

## [2.5.0] - 2025-10-17 🗺️ Carte Satellite Intégrée

### ✨ Fonctionnalités

#### Carte Satellite Designer EL
- ✅ Leaflet.js + Esri World Imagery tiles
- ✅ Recherche adresse Nominatim API
- ✅ Zoom automatique niveau 19 (haute résolution)
- ✅ Leaflet.draw outils dessin (polygon, rectangle)
- ✅ Placement modules sur positions GPS réelles
- ✅ Calcul superficie zones en m²/ha

#### Système Sauvegarde 4 Niveaux
- ✅ LocalStorage (priorité 1)
- ✅ IndexedDB (priorité 2)
- ✅ Cloudflare D1 (priorité 3)
- ✅ Emergency API (priorité 4)

### 🔧 Corrections
- Template literals causant erreurs build
- Polygon placement modules aux coins → Rectangle placement grille

### 📦 Performance
- Build : 54.56 kB gzip
- Edge latency : < 50ms mondiale

---

## [2.0.0] - 2025-10-15 🏗️ Refonte Complète HUB

### 🎯 Architecture
- Migration Cloudflare Workers + Hono
- Cloudflare D1 database (SQLite distribué)
- 6 modules diagnostic complets
- API REST complète

### 📊 Fonctionnalités
- Gestion projets/clients
- Module EL intégré
- Dashboard temps réel
- Rapports automatisés

---

## [1.0.0] - 2025-09-01 🌟 Version Initiale

### ✨ Lancement
- Module EL standalone
- Audit basique
- Export JSON manuel

---

**Contact :** Adrien - Diagnostic Photovoltaïque  
**Site :** www.diagnosticphotovoltaique.fr  
**GitHub :** [diagnostic-hub](https://github.com/username/diagnostic-hub)
