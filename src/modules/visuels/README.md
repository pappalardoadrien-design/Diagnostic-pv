# Module Contrôles Visuels

## 📋 Description
Module d'inspection visuelle normée pour détection défauts mécaniques et conformité installation.

## 🎯 Fonctionnalités (À développer)
- Checklist inspection IEC 62446-1
- Photos géolocalisées défauts
- Contrôle fixations, câblages, protections
- Détection corrosion, fissures verre, délamination
- Vérification conformité étiquetage/signalétique

## 🔧 Technologies
- **Normes**: IEC 62446-1 (contrôle visuel), NF C 15-100
- **Détection**: Corrosion cadres, MC4 défaillants, verre brisé, délamination, salissures, ombrage
- **Documentation**: Photos HD, géolocalisation, annotations

## 📊 Statut
⏳ **À DÉVELOPPER** - Priorité #5

## 🚀 Intégration Plateforme Unifiée
**Phase planifiée**: Développement modules complémentaires
- Routes API: `/api/visuels/*`
- Base de données: Tables `visual_inspections`, `visual_defects`
- Stockage photos: Cloudflare R2
- Liaison: `interventions` → `projects`

## 📁 Structure
```
visuels/
├── routes/       # Routes API (/api/visuels/*)
├── types/        # Types TypeScript (Inspection, Defect)
├── utils/        # Upload photos, géolocalisation
└── README.md     # Documentation
```

## 🔗 Routes Futures
- `POST /api/visuels/inspection/create` - Création inspection
- `POST /api/visuels/defect/add` - Ajout défaut + photo
- `GET /api/visuels/checklist/:projectId` - Checklist complète
- `GET /api/visuels/report/:interventionId` - Rapport visuel

## 📝 Priorité Roadmap
**#5** - Développement post-Isolation (Q4 2026 estimé)
