# Module Expertise Post-Sinistre

## 📋 Description
Module d'expertise judiciaire et assurance pour analyse post-incendie, tempête, grêle, foudre, défaillance électrique.

## 🎯 Fonctionnalités (À développer)
- Constat sinistre (incendie, tempête, grêle, foudre)
- Analyse causes techniques défaillance
- Estimation pertes production (kWh/an, €/an)
- Documentation photographique complète
- Rapport expertise judiciaire/assurance

## 🔧 Technologies
- **Normes**: IEC 61215/61730 (sécurité modules), NF C 15-100
- **Analyse**: Causes racines, traçabilité défauts, chronologie événements
- **Expertise**: Indépendance totale, neutralité DiagPV

## 📊 Statut
⏳ **À DÉVELOPPER** - Priorité #6 (sur demande marché)

## 🚀 Intégration Plateforme Unifiée
**Phase planifiée**: Développement spécialisé post-modules techniques
- Routes API: `/api/expertise/*`
- Base de données: Tables `post_incident_expertise`, `incident_evidence`
- Stockage documents: Cloudflare R2 (photos, rapports PDF)
- Liaison: `interventions` → `projects` → `clients`

## 📁 Structure
```
expertise/
├── routes/       # Routes API (/api/expertise/*)
├── types/        # Types TypeScript (Expertise, Incident, Evidence)
├── utils/        # Calculs pertes, génération rapports judiciaires
└── README.md     # Documentation
```

## 🔗 Routes Futures
- `POST /api/expertise/incident/create` - Déclaration sinistre
- `POST /api/expertise/evidence/add` - Ajout preuve (photo/document)
- `GET /api/expertise/analysis/:incidentId` - Analyse causes
- `POST /api/expertise/report/generate` - Rapport expertise judiciaire
- `GET /api/expertise/losses/:incidentId` - Estimation pertes financières

## 📝 Priorité Roadmap
**#6** - Développement sur demande marché (2027 estimé)
