# Module Courbes I-V

## 📋 Description
Module de traçage et analyse des courbes Intensité-Tension (I-V) pour évaluation performance électrique des modules PV.

## 🎯 Fonctionnalités (À développer)
- Mesure Isc, Voc, Pmax, FF (Fill Factor)
- Traçage courbes I-V sombres et de référence
- Détection écarts performance vs STC
- Analyse mismatch strings
- Comparaison courbes constructeur vs terrain

## 🔧 Technologies
- **Normes**: IEC 60904-1 (mesures I-V), IEC 60891 (corrections STC)
- **Équipement**: Traceur I-V portable
- **Analyse**: Rendement, pertes résistives, défauts cellules

## 📊 Statut
⏳ **À DÉVELOPPER** - Priorité #2 après Module EL

## 🚀 Intégration Plateforme Unifiée
**Phase planifiée**: Post-migration Module EL
- Routes API: `/api/iv/*`
- Base de données: Tables `iv_measurements`, `iv_string_analysis`
- Liaison: `interventions` → `projects` → `clients`

## 📁 Structure
```
iv/
├── routes/       # Routes API (/api/iv/*)
├── types/        # Types TypeScript (IVMeasurement, IVCurve)
├── utils/        # Calculs STC, analyse courbes
└── README.md     # Documentation
```

## 🔗 Routes Futures
- `POST /api/iv/measurement/create` - Enregistrement mesure
- `GET /api/iv/string/:stringId` - Analyse complète string
- `POST /api/iv/compare` - Comparaison vs datasheet
- `GET /api/iv/report/:interventionId` - Rapport I-V

## 📝 Priorité Roadmap
**#2** - Développement post-EL (Q1 2026 estimé)
