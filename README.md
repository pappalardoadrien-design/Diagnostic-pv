# Diagnostic Hub - Plateforme DiagPV

## Vue d'ensemble

**Diagnostic Hub** est la plateforme unifiee de **Diagnostic Photovoltaique** (www.diagnosticphotovoltaique.fr).
Architecture monolithe modulaire centralisant tous les outils d'audit, CRM, planning et business development.

- **Production** : https://diagnostic-hub.pages.dev
- **GitHub** : https://github.com/pappalardoadrien-design/Diagnostic-pv
- **Database** : diagnostic-hub-production (D1 ID: 72be68d4-c5c5-4854-9ead-3bbcc131d199)
- **R2 Storage** : diagpv-photos

## Tech Stack

| Composant | Technologie |
|-----------|-------------|
| Backend | Hono TypeScript + Cloudflare Workers |
| Frontend | Vanilla JS + Tailwind CSS v4 (CDN) |
| Build | Vite 6.3 + @hono/vite-cloudflare-pages |
| Database | Cloudflare D1 SQLite |
| Storage | Cloudflare R2 + KV |
| PWA | Service Worker offline-first |

## Modules actifs (14/03/2026)

### Modules operationnels

| Module | API Prefix | Page Frontend | Statut |
|--------|-----------|---------------|--------|
| Dashboard CRM | `/api/crm` | `/crm/dashboard` | Production |
| CRM Clients | `/api/crm/clients` | `/crm/clients` | Production |
| CRM Projets | `/api/crm/projects` | `/crm/projects` | Production |
| Pipeline Kanban | `/api/crm/pipeline` | `/crm/pipeline` | Production |
| Planning | `/api/planning` | `/planning` | Production |
| Audits | `/api/audits` | `/audits/create` | Production |
| EL (Electroluminescence) | `/api/el` | `/audit/:token` | Production |
| Visual Inspection | `/api/visual` | `/visual` | Production |
| Isolation Tests | `/api/isolation` | `/isolation` | Production |
| Thermographie | `/api/thermique` | `/thermal` | Production |
| Courbes I-V | `/api/iv-curves` | `/iv-curves` | Production |
| PV Cartographie | `/api/pv/plants` | `/pv/plants` | Production |
| Audit Qualite Terrain | `/api/audit-qualite` | `/audit-qualite` | Production |
| Diode Tests | `/api/diode-tests` | — | Production |
| PVServ Dark | `/api/pvserv` | `/pvserv-dark` | Production |
| Rapports Unifies | `/api/report/unified` | `/rapports` | Production |
| Interconnexion | `/api/interconnect` | — | Production |
| Picsellia Integration | `/api/picsellia` | — | Production |
| Repowering | `/api/repowering` | `/repowering` | Production |
| AMO | `/api/amo` | `/amo` | Production |
| Acquisitions/Cessions | `/api/acquisitions` | `/acquisitions` | Production |
| Formations PV | `/api/formations` | `/formations` | Production |
| Auth | `/api/auth` | `/login` | Production |
| Admin | `/admin` | `/tools` | Production |

### Donnees production

| Metrique | Valeur |
|----------|--------|
| CRM Clients | 7 |
| PV Plants | 7 |
| EL Audits | 16 (14 lies a plants, 2 non lies) |
| PV Cartography Links | 63 |
| Defauts critiques | 184 |
| Visual Inspections | 40 |
| Isolation Tests | 3 |

## API Endpoints — Reference rapide

### CRM & Pipeline
```
GET  /api/crm/clients                  — Liste clients
GET  /api/crm/projects                 — Liste projets
GET  /api/crm/dashboard/summary        — KPIs dashboard
GET  /api/crm/pipeline/opportunities   — Pipeline deals
GET  /api/crm/pipeline/kpis            — KPIs pipeline
```

### Planning
```
GET  /api/planning/interventions       — Liste interventions
GET  /api/planning/dashboard           — Dashboard + stats
```

### Audits & Modules techniques
```
GET  /api/audits                       — Liste audits
GET  /api/el/dashboard/audits          — Dashboard EL
GET  /api/visual/inspections           — Inspections visuelles
GET  /api/isolation/tests              — Tests isolation
GET  /api/iv-curves                    — Courbes I-V
GET  /api/thermique/measurements/:tok  — Mesures thermiques
GET  /api/diode-tests/sessions         — Sessions diodes
GET  /api/pvserv/sessions              — Sessions PVServ
```

### PV Plants & Cartographie
```
GET  /api/pv/plants                    — Liste centrales
GET  /api/pv/plants/:id/zones          — Zones par centrale
```

### Audit Qualite Terrain
```
GET  /api/audit-qualite/missions       — Missions AQ
GET  /api/audit-qualite/templates      — Templates checklist
GET  /api/audit-qualite/templates/sol  — Checklist SOL
GET  /api/audit-qualite/templates/toiture — Checklist TOITURE
```

### Interconnexion & Rapports
```
GET  /api/interconnect/status          — Etat liaisons audit/plant
POST /api/interconnect/auto-link       — Auto-liaison audits/plants
GET  /api/report/unified/preview       — Apercu rapport unifie (?plantId=X)
```

### Business Development
```
GET  /api/repowering/missions          — Missions repowering
GET  /api/repowering/kpis              — KPIs repowering
GET  /api/amo/missions                 — Missions AMO
GET  /api/amo/kpis                     — KPIs AMO
GET  /api/acquisitions/deals           — Deals acquisition/cession
GET  /api/acquisitions/kpis            — KPIs acquisitions
POST /api/acquisitions/deals           — Creer deal
PUT  /api/acquisitions/deals/:id       — Modifier deal
PUT  /api/acquisitions/deals/:id/phase — Changer phase deal
```

### Formations
```
GET  /api/formations/sessions          — Sessions formation
POST /api/formations/sessions          — Creer session
GET  /api/formations/sessions/:id      — Detail session
PUT  /api/formations/sessions/:id      — Modifier session
POST /api/formations/sessions/:id/participants — Ajouter participant
GET  /api/formations/organismes        — Organismes partenaires
POST /api/formations/organismes        — Ajouter organisme
GET  /api/formations/kpis              — KPIs formations
```

### Health & Auth
```
GET  /api/diagnostic/health            — Sante systeme
POST /api/auth/login                   — Connexion
GET  /api/auth/me                      — Utilisateur courant
```

## Pages frontend

| URL | Description |
|-----|-------------|
| `/` | Redirection login |
| `/login` | Page connexion |
| `/crm/dashboard` | Dashboard CRM unifie |
| `/crm/clients` | Gestion clients |
| `/crm/projects` | Gestion projets |
| `/crm/pipeline` | Pipeline Kanban |
| `/planning` | Planning interventions |
| `/audits/create` | Creation audit |
| `/audit/:token` | Interface audit terrain |
| `/visual` | Inspection visuelle |
| `/isolation` | Tests isolation |
| `/thermal` | Thermographie |
| `/iv-curves` | Courbes I-V |
| `/pvserv-dark` | Import PVServ Dark |
| `/pv/plants` | Centrales PV |
| `/pv/plant/:id` | Detail centrale |
| `/audit-qualite` | Audit qualite terrain |
| `/rapports` | Rapports unifies |
| `/repowering` | Missions repowering (20-50k EUR) |
| `/amo` | AMO (10-30k EUR) |
| `/acquisitions` | Deals acquisition/cession (2-5% commission) |
| `/formations` | Formations PV (sessions, organismes, Qualiopi) |
| `/tools` | Outils admin |

## Developpement local

```bash
npm install
npm run build
pm2 start ecosystem.config.cjs

# Tests
curl http://localhost:3000/api/diagnostic/health

# Database
npm run db:migrate:local
npm run db:seed
npm run db:reset
```

## Deploiement

```bash
npm run build
npx wrangler pages deploy dist --project-name diagnostic-hub
```

## Dernier audit (14/03/2026)

- API endpoints : **31/31 OK** (0 erreurs 500)
- Pages frontend : **21/21 OK**
- Interconnexion : **14/16 audits lies** (2 sans plant : VIGNAUX, LES FORGES)
- Commit : `6c4e90f` — feat: integration Acquisitions + Formations

## Prochaines etapes recommandees

1. **Peupler Pipeline CRM** — Ajouter les 70 sources leads dans le Kanban
2. **Integration Picsellia AI** — Detection auto defauts EL/thermique
3. **Portail sous-traitants** — Onboarding diagnostiqueurs labellises
4. **Landing page publique** — Vitrine DiagPV pour leads inbound
5. **Creer plants VIGNAUX + LES FORGES** — Lier les 2 audits restants

---

**Diagnostic Photovoltaique** — L'expertise photovoltaique independante depuis 2012.
Adrien PAPPALARDO | contact@diagpv.fr | 3 rue Apollo, 31240 L'Union
