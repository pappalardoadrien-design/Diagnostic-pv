# Architecture Modulaire DiagPV

## 📋 Vue d'ensemble
Architecture monolithe modulaire pour la plateforme unifiée de diagnostic photovoltaïque DiagPV.

## 🏗️ Structure
```
src/modules/
├── el/               # ✅ Module Électroluminescence (EN PRODUCTION)
│   ├── routes/       # Routes API /api/el/*
│   ├── types/        # Types TypeScript
│   ├── utils/        # Fonctions utilitaires
│   └── README.md     # Documentation module
│
├── iv/               # ⏳ Module Courbes I-V (Priorité #2)
│   ├── routes/       # Routes API /api/iv/*
│   ├── types/        # Types TypeScript
│   ├── utils/        # Calculs STC, analyse courbes
│   └── README.md     # Documentation module
│
├── thermique/        # ⏳ Module Thermographie (Priorité #3)
│   ├── routes/       # Routes API /api/thermique/*
│   ├── types/        # Types TypeScript
│   ├── utils/        # Traitement images IR
│   └── README.md     # Documentation module
│
├── isolation/        # ⏳ Module Isolation (Priorité #4)
│   ├── routes/       # Routes API /api/isolation/*
│   ├── types/        # Types TypeScript
│   ├── utils/        # Calculs résistance
│   └── README.md     # Documentation module
│
├── visuels/          # ⏳ Module Contrôles Visuels (Priorité #5)
│   ├── routes/       # Routes API /api/visuels/*
│   ├── types/        # Types TypeScript
│   ├── utils/        # Upload photos, géolocalisation
│   └── README.md     # Documentation module
│
└── expertise/        # ⏳ Module Expertise Post-Sinistre (Priorité #6)
    ├── routes/       # Routes API /api/expertise/*
    ├── types/        # Types TypeScript
    ├── utils/        # Calculs pertes, rapports judiciaires
    └── README.md     # Documentation module
```

## 🎯 Roadmap des 6 Modules DiagPV

| # | Module | Status | Priorité | Estimation |
|---|--------|--------|----------|------------|
| 1 | **Électroluminescence** | ✅ EN PROD | #1 | Migration en cours |
| 2 | **Courbes I-V** | ⏳ À développer | #2 | Q1 2026 |
| 3 | **Thermographie** | ⏳ À développer | #3 | Q2 2026 |
| 4 | **Isolation** | ⏳ À développer | #4 | Q3 2026 |
| 5 | **Contrôles Visuels** | ⏳ À développer | #5 | Q4 2026 |
| 6 | **Expertise Post-Sinistre** | ⏳ À développer | #6 | 2027 |

## 🔧 Principes Architecture

### Modularité
- Chaque module = dossier indépendant avec routes/types/utils
- Séparation claire des responsabilités
- Réutilisation code commun via `src/shared/`

### Uniformité
- Pattern de routes: `/api/{module}/*`
- Conventions nommage cohérentes
- Structure identique pour tous les modules

### Scalabilité
- Ajout nouveaux modules sans impact existants
- Base de données unifiée (Cloudflare D1)
- Déploiement unique (Cloudflare Pages)

### Intégration
- Tous modules liés via `projects` → `clients`
- Table centrale `interventions` pour tracking
- Dashboard HUB unifié pour navigation

## 📊 Données Centralisées

**Base D1 Unifiée**: `diagnostic-hub-production`

**Tables Core**:
- `users` - Techniciens certifiés
- `clients` - Clients DiagPV
- `projects` - Installations PV
- `interventions` - Missions techniques

**Tables Modules** (par module):
- `el_audits`, `el_modules` - Électroluminescence
- `iv_measurements` - Courbes I-V
- `thermal_measurements` - Thermographie
- `isolation_tests` - Isolation
- `visual_inspections` - Contrôles visuels
- `post_incident_expertise` - Expertise sinistre

## 🚀 Phase Actuelle : Migration Module EL

**Objectif**: Intégrer Module EL standalone dans architecture unifiée

**Actions**:
1. ✅ Backup complet données production (JALIBAT 242 + Les Forges 220)
2. ✅ Création structure git + dossiers modules
3. ⏳ Export données production
4. ⏳ Conception schéma D1 unifié
5. ⏳ Migration code Module EL
6. ⏳ Tests + déploiement production

**Préservation 100% données existantes garantie**

## 📝 Documentation

Chaque module contient:
- `README.md` - Description, fonctionnalités, roadmap
- `routes/` - Documentation routes API
- `types/` - Interfaces TypeScript
- `utils/` - Fonctions techniques

## 🔗 Ressources

- **Plateforme HUB**: https://diagnostic-hub.pages.dev
- **Module EL actuel**: https://diagpv-audit.pages.dev
- **GitHub**: https://github.com/OWNER/diagnostic-hub
- **Branch fusion**: `feature/unified-platform`

---

**Architecture conçue pour croissance progressive et excellence technique DiagPV** 🚀
