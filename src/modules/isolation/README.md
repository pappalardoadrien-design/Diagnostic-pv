# Module Isolation

## 📋 Description
Module de test d'isolement électrique pour vérification sécurité et conformité NF C 15-100.

## 🎯 Fonctionnalités (À développer)
- Test isolement DC (500V / 1000V)
- Mesure résistance isolement (MΩ)
- Vérification continuité terre
- Tests conformité NF C 15-100 / UTE C 15-712-1
- Détection défauts isolement câblage

## 🔧 Technologies
- **Normes**: NF C 15-100, UTE C 15-712-1, IEC 62446-1
- **Équipement**: Mégohmmètre Fluke 1508
- **Seuils**: R_iso ≥ 1 MΩ (minimum réglementaire)

## 📊 Statut
⏳ **À DÉVELOPPER** - Priorité #4

## 🚀 Intégration Plateforme Unifiée
**Phase planifiée**: Développement parallèle modules techniques
- Routes API: `/api/isolation/*`
- Base de données: Tables `isolation_tests`, `isolation_defects`
- Liaison: `interventions` → `projects`

## 📁 Structure
```
isolation/
├── routes/       # Routes API (/api/isolation/*)
├── types/        # Types TypeScript (IsolationTest, IsolationDefect)
├── utils/        # Calculs résistance, validation seuils
└── README.md     # Documentation
```

## 🔗 Routes Futures
- `POST /api/isolation/test/create` - Enregistrement test
- `GET /api/isolation/results/:projectId` - Résultats tests
- `POST /api/isolation/validate` - Validation conformité
- `GET /api/isolation/report/:interventionId` - Rapport isolement

## 📝 Priorité Roadmap
**#4** - Développement post-Thermique (Q3 2026 estimé)
