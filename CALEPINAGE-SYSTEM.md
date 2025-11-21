# 🗺️ Système de Calepinage Physique - Documentation Technique

## Vue d'ensemble

Le système de calepinage physique permet de représenter la **disposition réelle** des modules photovoltaïques sur la toiture avec :
- Layout physique exact selon configuration terrain
- États EL dynamiques (couleurs selon défauts)
- Flèches de câblage entre strings
- Zones de câblage (rectangles rouges)
- Intégration complète avec le module EL

---

## 📐 Architecture

### 1. Tables D1

#### `calepinage_layouts`
Stocke les configurations de disposition physique par projet.

```sql
CREATE TABLE calepinage_layouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT UNIQUE NOT NULL,  -- Ex: 'JALIBAT-2025-001'
  layout_name TEXT NOT NULL,
  layout_data TEXT NOT NULL,  -- JSON configuration complète
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

#### `module_positions`
Positions physiques exactes de chaque module.

```sql
CREATE TABLE module_positions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL,
  module_identifier TEXT NOT NULL,  -- Ex: 'S1-1', 'S2-24'
  x_position REAL NOT NULL,
  y_position REAL NOT NULL,
  rotation REAL DEFAULT 0,
  width REAL DEFAULT 100,
  height REAL DEFAULT 40,
  UNIQUE(project_id, module_identifier)
)
```

#### `calepinage_cables`
Connexions entre strings avec flèches.

```sql
CREATE TABLE calepinage_cables (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL,
  from_module TEXT NOT NULL,  -- Ex: 'S1-26'
  to_module TEXT NOT NULL,    -- Ex: 'S2-1'
  cable_points TEXT,          -- JSON array [{x, y}, ...]
  cable_color TEXT DEFAULT '#dc2626',
  arrow_type TEXT DEFAULT 'end'
)
```

#### `calepinage_zones`
Zones de câblage (rectangles rouges groupant strings).

```sql
CREATE TABLE calepinage_zones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL,
  zone_name TEXT,
  string_numbers TEXT NOT NULL,  -- JSON [2, 3, 4]
  border_color TEXT DEFAULT '#dc2626',
  border_width INTEGER DEFAULT 3
)
```

---

## 🔧 Configuration TypeScript

### Types principaux

```typescript
// /src/modules/el/types/calepinage.ts

type ModulePosition = {
  identifier: string      // 'S1-1', 'S2-24'
  x: number              // Position X (pixels)
  y: number              // Position Y (pixels)
  rotation?: number      // Rotation en degrés
  width?: number         // Largeur (100 par défaut)
  height?: number        // Hauteur (40 par défaut)
}

type CableConnection = {
  from: string           // 'S1-26' (module source)
  to: string             // 'S2-1' (module destination)
  points?: {x: number, y: number}[]
  color?: string
  arrowType?: 'start' | 'end' | 'both' | 'none'
}

type CablingZone = {
  name?: string
  strings: number[]      // [2, 3, 4]
  borderColor?: string
  borderWidth?: number
}

type PhysicalLayout = {
  projectId: string
  layoutName: string
  modules: ModulePosition[]
  cables: CableConnection[]
  zones?: CablingZone[]
  wiring: StringWiring[]
  viewBox?: { width: number; height: number; gridSize?: number }
}
```

### Configuration JALIBAT (exemple)

```typescript
// /src/modules/el/routes/calepinage-physical.ts

const JALIBAT_LAYOUT: PhysicalLayout = {
  projectId: 'JALIBAT-2025-001',
  layoutName: 'JALIBAT - Configuration Toiture Réelle',
  
  viewBox: {
    width: 2400,
    height: 1200,
    gridSize: 20
  },
  
  wiring: [
    { stringNumber: 1, direction: 'left-to-right', moduleCount: 26 },
    { stringNumber: 2, direction: 'left-to-right', moduleCount: 24 },
    { stringNumber: 3, direction: 'right-to-left', moduleCount: 24 },
    // ... configuration complète
  ],
  
  modules: generateJalibatModulePositions(),
  
  cables: [
    { from: 'S1-26', to: 'S2-1', arrowType: 'end', color: '#dc2626' },
    { from: 'S2-24', to: 'S3-24', arrowType: 'end', color: '#dc2626' },
    // ... connexions complètes
  ],
  
  zones: [
    { name: 'Zone 1', strings: [1], borderColor: '#dc2626' },
    { name: 'Zone 2', strings: [2, 3, 4], borderColor: '#dc2626' },
    // ... zones complètes
  ]
}
```

---

## 🛣️ Routes API

### 1. Plan Physique Réel
**GET** `/api/el/calepinage-physical/:auditToken`

Affiche le plan physique avec disposition réelle.

**Fonctionnalités:**
- Layout physique exact selon configuration
- Couleurs dynamiques depuis audit EL
- Flèches de câblage rouges
- Rectangles de zones
- Légende complète
- Export PDF/Print-friendly

**Exemple:**
```
https://3000-xxx.e2b.dev/api/el/calepinage-physical/JALIBAT-2025-001
```

### 2. Plan Grille Simplifié
**GET** `/api/el/calepinage-grid/:auditToken`

Vue grille organisée par string (existant).

### 3. Éditeur Interactif
**GET** `/api/el/calepinage-editor/:auditToken`

Éditeur visuel pour configurer directions et flèches (existant).

---

## 🎨 Rendu Visuel

### Couleurs des modules (selon audit EL)

```css
.module-ok {
  background: #d4f4dd;  /* Vert clair */
  border: #4ade80;
}

.module-microfissures {
  background: #fed7aa;  /* Orange clair */
  border: #fb923c;
}

.module-impact-cellulaire {
  background: #fecaca;  /* Rose clair */
  border: #f87171;
}

.module-autre-defaut {
  background: #fef3c7;  /* Jaune clair */
  border: #fbbf24;
}
```

### SVG Markers (flèches)

```svg
<marker
  id="arrow-1"
  markerWidth="10"
  markerHeight="10"
  refX="9"
  refY="3"
  orient="auto"
>
  <path d="M0,0 L0,6 L9,3 z" fill="#dc2626" />
</marker>
```

### Zones de câblage (rectangles rouges)

```svg
<rect
  x="50"
  y="200"
  width="1600"
  height="200"
  fill="transparent"
  stroke="#dc2626"
  stroke-width="3"
  stroke-dasharray="10,5"
  rx="8"
/>
```

---

## 🔄 Intégration avec Rapport Complet

Le plan physique est intégré dans le rapport complet EL via deux boutons :

```html
<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
  <!-- Plan Physique Réel -->
  <a href="/api/el/calepinage-physical/${auditToken}">
    🗺️ Plan Physique Réel
  </a>
  
  <!-- Plan Grille Simplifié -->
  <a href="/api/el/calepinage-grid/${auditToken}">
    📄 Plan Grille Simplifié
  </a>
</div>
```

---

## 📊 Flux de données

```
┌─────────────────────────────────────────────────────────────┐
│                  Audit EL (el_modules)                       │
│  - module_identifier: 'S1-1'                                 │
│  - defect_type: 'microfissures'                              │
│  - severity_level: 2                                         │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│            Configuration Layout (TypeScript)                 │
│  - JALIBAT_LAYOUT.modules[]                                  │
│  - Position physique (x, y)                                  │
│  - Câbles et zones                                           │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Fonction getModuleStates()                      │
│  - Récupère états EL depuis DB                               │
│  - Map: identifier → {status, defectType, severity}          │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│            LayoutWithModuleStates (merge)                    │
│  - Layout physique + États EL dynamiques                     │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              renderPhysicalPlan()                            │
│  - Génère SVG avec modules, câbles, zones                    │
│  - Applique couleurs selon états                             │
│  - Ajoute flèches et rectangles                              │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  HTML/SVG Final                              │
│  - Plan physique complet                                     │
│  - Légende                                                   │
│  - Boutons actions                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Vérification de compatibilité

### Tests effectués (2025-11-21)

| Route | Statut | Note |
|-------|--------|------|
| `/api/el/calepinage-physical/:token` | ✅ OK | Plan physique réel |
| `/api/el/calepinage-grid/:token` | ✅ OK | Plan grille |
| `/api/el/calepinage-editor/:token` | ✅ OK | Éditeur interactif |
| `/api/el/reports/complete/:token` | ✅ OK | Rapport avec intégration |
| `/api/el/audit/:token` | ✅ OK | API modules (242 modules) |
| `/api/el/photos/:token` | ✅ OK | Gestion photos |

**Résultat:** ✅ **Toutes les fonctionnalités du module EL restent compatibles**

---

## 🚀 Ajouter une nouvelle centrale

### Étape 1 : Définir la configuration

Éditer `/src/modules/el/routes/calepinage-physical.ts` :

```typescript
const NOUVELLE_CENTRALE_LAYOUT: PhysicalLayout = {
  projectId: 'NOUVEAU-PROJET-001',
  layoutName: 'Nouvelle Centrale',
  
  viewBox: { width: 2000, height: 1000 },
  
  wiring: [
    { stringNumber: 1, direction: 'left-to-right', moduleCount: 20 },
    // ... configuration complète
  ],
  
  modules: generateNouvellePositions(),
  cables: [...],
  zones: [...]
}
```

### Étape 2 : Fonction de génération de positions

```typescript
function generateNouvellePositions(): ModulePosition[] {
  const positions: ModulePosition[] = []
  const moduleWidth = 60
  const moduleHeight = 35
  
  // String 1
  for (let i = 1; i <= 20; i++) {
    positions.push({
      identifier: `S1-${i}`,
      x: 100 + (i - 1) * moduleWidth,
      y: 100,
      width: moduleWidth,
      height: moduleHeight
    })
  }
  
  return positions
}
```

### Étape 3 : Ajouter switch dans la route

```typescript
app.get('/:auditToken', async (c) => {
  const { auditToken } = c.req.param()
  
  // Déterminer la configuration selon le projet
  let layout: PhysicalLayout
  
  if (auditToken.startsWith('JALIBAT')) {
    layout = JALIBAT_LAYOUT
  } else if (auditToken.startsWith('NOUVEAU')) {
    layout = NOUVELLE_CENTRALE_LAYOUT
  } else {
    // Layout par défaut
    layout = DEFAULT_LAYOUT
  }
  
  // ... reste du code
})
```

---

## 📝 Bonnes pratiques

### 1. Nommage des modules
- Format standard : `S{string}-{position}`
- Exemple : `S1-1`, `S2-24`, `S10-12`

### 2. Positions physiques
- Utiliser un système de coordonnées cohérent
- Commencer à (0,0) en haut à gauche
- Maintenir des espacements constants

### 3. Câblage
- Toujours définir les connexions dans l'ordre logique
- Utiliser `arrowType: 'end'` pour la direction
- Couleur standard : `#dc2626` (rouge DiagPV)

### 4. Zones
- Grouper les strings logiquement connectées
- Nommer les zones de manière descriptive
- Utiliser des bordures pointillées pour visibilité

### 5. ViewBox SVG
- Ajuster selon le nombre de modules
- Prévoir marge de 50-100px de chaque côté
- Ratio 16:9 ou 2:1 recommandé

---

## 🔮 Évolutions futures

### Phase 1 (Actuel) ✅
- ✅ Configuration TypeScript statique
- ✅ Rendu SVG dynamique
- ✅ Intégration rapport complet
- ✅ États EL en temps réel

### Phase 2 (À venir)
- ⏳ Éditeur visuel drag-and-drop
- ⏳ Sauvegarde en base D1
- ⏳ Import/Export JSON
- ⏳ API configuration dynamique

### Phase 3 (Vision)
- 🔮 Import depuis CAD (AutoCAD, etc.)
- 🔮 Génération automatique depuis photos drone
- 🔮 Module réutilisable pour courbes I-V, thermographie
- 🔮 Export vers logiciels CAO

---

## 📞 Support

**Fichiers sources principaux :**
- `/src/modules/el/routes/calepinage-physical.ts` - Route principale
- `/src/modules/el/types/calepinage.ts` - Types TypeScript
- `/src/modules/el/routes/report-complete.ts` - Intégration rapport
- `/migrations/0002_add_calepinage_layouts.sql` - Schéma D1

**Documentation connexe :**
- `CALEPINAGE-CONFIG.md` - Configuration manuelle (ancien système)
- `README.md` - Vue d'ensemble projet

**Contact :**
- Adrien PAPPALARDO - Business Developer
- 📱 06 07 29 22 12
- 📧 info@diagnosticphotovoltaique.fr

---

*Dernière mise à jour : 2025-11-21*
*Version : 1.0.0*
*Statut : ✅ Production Ready*
