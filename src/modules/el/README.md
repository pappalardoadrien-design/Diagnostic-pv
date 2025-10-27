# Module Électroluminescence (EL)

## 📋 Description
Module de diagnostic photovoltaïque par électroluminescence nocturne pour détection des défauts invisibles à l'œil nu.

## 🎯 Fonctionnalités
- Création d'audits EL avec configuration strings/modules
- Diagnostic module par module (OK, microcrack, dead, inequality)
- Génération rapports PDF normés
- Dashboard avec statistiques temps réel
- Gestion commentaires techniques par module

## 🔧 Technologies
- **Méthode**: Électroluminescence nocturne (IEC 62446-1)
- **Détection**: PID, LID, microfissures, diodes HS, modules morts
- **Analyse**: Distribution défauts, taux défaillance, cartographie strings

## 📊 Statut
✅ **EN PRODUCTION** - diagpv-audit.pages.dev
- 462 modules diagnostiqués (JALIBAT 242 + Les Forges 220)
- 4 audits complets réalisés

## 🚀 Intégration Plateforme Unifiée
**Phase actuelle**: Migration vers architecture monolithe
- Préservation 100% données existantes
- Routes API: `/api/el/*`
- Base de données: Tables `el_audits`, `el_modules`

## 📁 Structure
```
el/
├── routes/       # Routes API (/api/el/*)
├── types/        # Types TypeScript (Audit, Module)
├── utils/        # Fonctions utilitaires (stats, PDF)
└── README.md     # Documentation
```

## 🔗 Routes Principales
- `POST /api/el/audit/create` - Création audit
- `GET /api/el/dashboard/audits` - Liste audits + stats
- `POST /api/el/module/update` - Mise à jour diagnostic module
- `GET /api/el/audit/:token` - Détails audit complet
- `POST /api/el/report/generate` - Génération rapport PDF

## 📝 Priorité Roadmap
**#1** - Module prioritaire (déjà en production, migration en cours)
