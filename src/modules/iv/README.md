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
✅ **OPÉRATIONNEL** - Intégré avec `shared_configurations`

## 🚀 Intégration Plateforme Unifiée
✅ **COMPLÉTÉ** - Interconnexion dynamique avec système unifié
- Routes API: `/api/iv/*` (7 endpoints)
- Base de données: Tables `iv_measurements` + `shared_configurations`
- Liaison: `audits` → `shared_configurations` → `iv_measurements`
- **Nouveau**: Initialisation automatique depuis `shared_configurations`

## 📁 Structure
```
iv/
├── routes/       # Routes API (/api/iv/*)
├── types/        # Types TypeScript (IVMeasurement, IVCurve)
├── utils/        # Calculs STC, analyse courbes
└── README.md     # Documentation
```

## 🔗 Routes Disponibles
✅ **PRODUCTION**
- `POST /api/iv/initialize/:token` - ✨ **NOUVEAU** Initialiser mesures depuis shared_config
- `POST /api/iv/measurements/:token` - Import mesures CSV (référence/sombre)
- `GET /api/iv/measurements/:token` - Liste mesures I-V d'un audit
- `GET /api/iv/measurements/:token/module/:identifier` - Mesure d'un module spécifique
- `DELETE /api/iv/measurements/:token` - Supprimer mesures
- `GET /api/iv/report/:token` - ✅ Rapport PDF (modifié pour shared_config)

## 📝 Interconnexion Dynamique
✅ **Architecture Unifiée 2025-12-03**
- Lit configuration depuis `shared_configurations` (strings, modules)
- Synchronisé avec modules EL, PV Carto, Visual, Isolation
- Support configs non uniformes (ex: 1 string de 24 + 10 strings de 26)
