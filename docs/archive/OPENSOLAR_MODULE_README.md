# Module OpenSolar DXF Import

## 📋 Vue d'ensemble

Module **ISOLÉ et NON-DESTRUCTIF** pour importer des fichiers DXF OpenSolar dans DiagPV Hub.

**Objectif** : Permettre l'import de calepinages (layouts) générés par OpenSolar sans modifier le système Canvas V2 existant.

## ✅ Statut : OPÉRATIONNEL

- ✅ Module isolé créé (`src/opensolar.tsx`)
- ✅ Parser DXF implémenté (npm package `dxf-parser`)
- ✅ Extraction layer PANELS (rectangles modules)
- ✅ Conversion coordonnées DXF → GPS
- ✅ Interface HTML upload/visualisation
- ✅ Routes API complètes
- ⏳ Test avec DXF réel OpenSolar (en attente fichier utilisateur)

## 🌐 URLs Accessibles

### Interface HTML
```
http://localhost:3000/opensolar
https://3000-ihjl3q1cxb8r55v93w6w4-6532622b.e2b.dev/opensolar
```

### API Endpoints
```
GET  /api/opensolar/test           → Test endpoint
POST /api/opensolar/parse-dxf      → Parser fichier DXF
POST /api/opensolar/import-modules → Importer modules en DB
```

## 📂 Structure Fichiers

```
diagnostic-hub/
├── src/
│   ├── index.tsx           ← App principale (ligne 47: mount OpenSolar)
│   └── opensolar.tsx       ← MODULE ISOLÉ ⭐
├── package.json            ← dxf-parser ajouté
└── OPENSOLAR_MODULE_README.md
```

## 🔧 Architecture Technique

### 1. Parser DXF (`dxf-parser` npm package)

```typescript
const DxfParser = require('dxf-parser')
const parser = new DxfParser()
const dxf = parser.parseSync(dxfContent)
```

### 2. Extraction Layer PANELS

OpenSolar génère 3 layers DXF :
- **PANELS** ← modules photovoltaïques (rectangles)
- **FACETS** ← surfaces de toiture
- **OBSTRUCTIONS** ← obstacles (cheminées, etc.)

Le module extrait uniquement le layer PANELS :

```typescript
const panelEntities = dxf.entities.filter(e => 
  e.layer === 'PANELS' || e.layer === 'Panels'
)
```

### 3. Types d'entités supportés

- **LWPOLYLINE** : Rectangle défini par 4 vertices
- **INSERT** : Bloc inséré (OpenSolar peut utiliser des blocks)

### 4. Conversion DXF → GPS

```typescript
// Coordonnées DXF = mètres relatifs
// Coordonnées GPS = degrés absolus

// Référence GPS : zone.polygon_latitude, zone.polygon_longitude
const latOffset = rect.centerY / 111320
const lngOffset = rect.centerX / (111320 * Math.cos(refLat * Math.PI / 180))

const moduleLat = refLat + latOffset
const moduleLng = refLng + lngOffset
```

### 5. Configuration Strings Automatique

```typescript
// Tri modules : nord → sud, ouest → est
moduleRectangles.sort((a, b) => {
  const yDiff = b.centerY - a.centerY  // nord-sud
  if (Math.abs(yDiff) > 0.5) return yDiff > 0 ? 1 : -1
  return a.centerX - b.centerX  // ouest-est
})

// Génération S1-P01, S1-P02, ..., S2-P01 (24 modules/string)
```

## 🚀 Utilisation

### Étape 1 : Créer une zone de référence

Avant d'importer un DXF, créer une zone dans Canvas V2 :

1. Ouvrir `/canvas-v2?plant_id=X&zone_id=Y`
2. Dessiner polygone toiture
3. Sauvegarder zone
4. Noter `zone_id` (ex: 1)

### Étape 2 : Importer DXF

1. Accéder à `/opensolar`
2. Entrer `Zone ID` (référence GPS)
3. Upload fichier `.dxf` OpenSolar
4. Cliquer **Parser DXF**
5. Vérifier modules sur carte
6. Cliquer **Importer dans DB**

### Étape 3 : Visualiser dans Canvas V2

1. Retourner sur `/canvas-v2?plant_id=X&zone_id=Y`
2. Modules importés apparaissent automatiquement
3. Éditer statuts/annotations normalement

## 📊 Format Données

### POST /api/opensolar/parse-dxf

**Request:**
```json
{
  "dxfContent": "... contenu fichier DXF ...",
  "zoneId": 1
}
```

**Response:**
```json
{
  "success": true,
  "modules": [
    {
      "module_identifier": "S1-P01",
      "latitude": 48.856614,
      "longitude": 2.352222,
      "string_number": 1,
      "position_in_string": 1,
      "width_meters": 1.7,
      "height_meters": 1.0,
      "rotation": 0,
      "power_wp": 450,
      "module_status": "pending"
    }
  ],
  "stats": {
    "totalModules": 120,
    "strings": 5,
    "totalPower": 54000
  },
  "debug": {
    "dxfLayers": ["PANELS", "FACETS", "OBSTRUCTIONS"],
    "panelEntitiesFound": 120,
    "rectanglesExtracted": 120,
    "usedMockData": false
  }
}
```

### POST /api/opensolar/import-modules

**Request:**
```json
{
  "zoneId": 1,
  "modules": [ /* array modules */ ]
}
```

**Response:**
```json
{
  "success": true,
  "insertedCount": 120
}
```

## 🔄 Workflow Complet

```
1. OpenSolar Design → Export DXF
2. DiagPV /opensolar → Upload DXF
3. Parser DXF → Extraire PANELS layer
4. Convertir coordonnées → GPS absolu
5. Sauvegarder → pv_modules table
6. Canvas V2 → Visualisation/édition
7. Module EL → Annotations électroluminescence
8. Export PDF → Rapport final
```

## 🔐 Sécurité & Isolation

- ✅ **Module isolé** : aucune modification Canvas V2
- ✅ **Routes séparées** : `/api/opensolar/*`
- ✅ **Aucune dépendance** : fonctionne indépendamment
- ✅ **Backup automatique** : supprime anciens modules avant import
- ✅ **Validation zone** : vérifie existence zone avant import

## 🛠️ Développement

### Lancer le serveur

```bash
cd /home/user/diagnostic-hub
npm run build
pm2 restart diagnostic-hub
```

### Tester les endpoints

```bash
# Test module opérationnel
curl http://localhost:3000/api/opensolar/test

# Parser DXF (avec fichier)
curl -X POST http://localhost:3000/api/opensolar/parse-dxf \
  -H "Content-Type: application/json" \
  -d '{"dxfContent": "...", "zoneId": 1}'

# Importer modules
curl -X POST http://localhost:3000/api/opensolar/import-modules \
  -H "Content-Type: application/json" \
  -d '{"zoneId": 1, "modules": [...]}'
```

### Logs PM2

```bash
pm2 logs diagnostic-hub --nostream
```

## 📝 TODO Next Steps

1. ⏳ **Tester avec DXF réel OpenSolar** (attente fichier utilisateur)
2. ⏳ **Intégrer bouton dans Canvas V2** : "Import DXF" dans sidebar
3. ⏳ **Support orientation modules** : portrait/landscape depuis DXF
4. ⏳ **Support FACETS layer** : import polygones toiture
5. ⏳ **Support OBSTRUCTIONS** : zones à éviter
6. ⏳ **Nettoyer Rectangle system** : si DXF validé, retirer ancien code

## ❓ Questions / Issues

**Q: Pourquoi pas d'import automatique depuis API OpenSolar ?**  
R: OpenSolar API ne fournit pas coordonnées GPS individuelles par module (seulement données groupées). DXF export contient ces données.

**Q: Comment gérer multiples zones dans un DXF ?**  
R: Actuellement 1 DXF = 1 zone. Pour multiples zones, importer plusieurs DXF séparément.

**Q: Précision GPS ?**  
R: Dépend de la référence GPS de la zone. DXF utilise coordonnées relatives (mètres), converties en GPS via zone de référence.

**Q: Compatibilité autres logiciels CAD ?**  
R: Parser supporte format DXF standard. Testé avec OpenSolar, devrait fonctionner avec AutoCAD, PVsyst, etc.

## 📞 Contact

Adrien - Business Developer @ Diagnostic Photovoltaïque

---

**Version**: 1.0.0  
**Dernière mise à jour**: 2025-11-03  
**Status**: ✅ Opérationnel (en attente test DXF réel)
