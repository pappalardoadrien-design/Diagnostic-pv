# Module Thermographie

## 📋 Description
Module de diagnostic thermique par thermographie infrarouge (drone/sol) pour détection points chauds et défauts thermiques.

## 🎯 Fonctionnalités (À développer)
- Thermographie drone haute résolution
- Thermographie sol pour zones spécifiques
- Détection points chauds (Hot Spots)
- Cartographie thermique installation complète
- Analyse gradients température

## 🔧 Technologies
- **Normes**: DIN EN 62446-3 (thermographie IR)
- **Méthode**: Infrarouge (7,5-14 µm), drone DJI Mavic 3T
- **Détection**: Diodes bypass HS, corrosion connexions, MC4 défaillants, échauffements anormaux

## 📊 Statut
⏳ **À DÉVELOPPER** - Priorité #3

## 🚀 Intégration Plateforme Unifiée
**Phase planifiée**: Post-Module I-V
- Routes API: `/api/thermique/*`
- Base de données: Tables `thermal_measurements`, `thermal_hotspots`
- Stockage images: Cloudflare R2
- Liaison: `interventions` → `projects`

## 📁 Structure
```
thermique/
├── routes/       # Routes API (/api/thermique/*)
├── types/        # Types TypeScript (ThermalMeasurement, Hotspot)
├── utils/        # Traitement images IR, calculs ΔT
└── README.md     # Documentation
```

## 🔗 Routes Futures
- `POST /api/thermique/measurement/create` - Upload images IR
- `GET /api/thermique/hotspots/:projectId` - Points chauds détectés
- `POST /api/thermique/analyze` - Analyse automatique images
- `GET /api/thermique/report/:interventionId` - Rapport thermique

## 📝 Priorité Roadmap
**#3** - Développement post-I-V (Q2 2026 estimé)
