# 🔋 DiagPV - Plateforme Unifiée de Diagnostic Photovoltaïque

**Expertise indépendante depuis 2012 | Plus de 500 interventions**

---

## 📊 Vue d'Ensemble

**DiagPV** est une plateforme web complète de gestion d'audits photovoltaïques développée pour **Diagnostic Photovoltaïque**, intégrant :

- **CRM Clients & Sites** avec configuration PV détaillée
- **Planning & Attribution** interventions sous-traitants
- **Module Électroluminescence (EL)** - Diagnostic défauts modules
- **Module Courbes I-V** - Mesures référence & sombres
- **Module Inspections Visuelles** - Checklist terrain
- **Module Tests d'Isolement** - Conformité électrique
- **Génération PDF** - Ordres de mission & rapports techniques

---

## 🚀 URLs Déployées

- **Production**: https://3000-ihjl3q1cxb8r55v93w6w4-6532622b.e2b.dev
- **API Base**: `/api/*`
- **Modules**: `/api/el`, `/api/iv`, `/api/visual`, `/api/isolation`, `/api/modules`

---

## 🏗️ Architecture Technique

### **Stack Technologique**
- **Framework**: Hono (TypeScript) - Lightweight edge framework
- **Runtime**: Cloudflare Workers/Pages
- **Database**: Cloudflare D1 (SQLite distribué)
- **Frontend**: HTML/CSS/JavaScript (TailwindCSS, FontAwesome)
- **Process Manager**: PM2 (développement sandbox)
- **Version Control**: Git

### **Structure Projet**
```
webapp/
├── src/
│   ├── index.tsx                    # Application principale (routes)
│   ├── modules/
│   │   ├── auth/                    # Authentification & permissions
│   │   ├── crm/                     # CRM Clients & Contacts
│   │   ├── planning/                # Planning interventions
│   │   ├── el/                      # Module Électroluminescence
│   │   ├── iv/                      # Module Courbes I-V
│   │   ├── visual/                  # Module Inspections Visuelles
│   │   ├── isolation/               # Module Tests d'Isolement
│   │   └── unified-modules-routes/  # API unifiée modules
│   ├── pages/                       # Pages UI (SSR)
│   │   ├── crm-*.ts                 # Pages CRM (8 pages)
│   │   ├── planning-*.ts            # Pages Planning (4 pages)
│   │   └── ...
│   └── pvserv-parser.js             # Parser fichiers PVserv
├── migrations/                      # Migrations SQL D1
│   ├── 0001_*.sql ... 0029_*.sql
├── public/                          # Assets statiques
│   └── static/
├── wrangler.jsonc                   # Configuration Cloudflare
├── package.json                     # Dépendances npm
├── ecosystem.config.cjs             # Configuration PM2
└── README.md                        # Cette documentation
```

---

## 📦 Modules Fonctionnels

### **1. CRM - Gestion Clients & Sites** ✅

**Pages UI**:
- `/crm/clients` - Liste clients (stats, filtres, recherche)
- `/crm/clients/create` - Créer client
- `/crm/clients/detail?id=X` - Détail client (3 onglets: Sites, Interventions, Audits)
- `/crm/clients/edit?id=X` - Modifier client
- `/crm/projects` - Liste sites PV
- `/crm/projects/create` - Créer site **avec config PV détaillée**
- `/crm/projects/detail?id=X` - Détail site
- `/crm/projects/edit?id=X` - Modifier site **avec config PV**

**API Routes**:
```
GET    /api/crm/clients              Liste clients
GET    /api/crm/clients/:id          Détail client
POST   /api/crm/clients              Créer client
PUT    /api/crm/clients/:id          Modifier client
DELETE /api/crm/clients/:id          Supprimer client

GET    /api/crm/projects             Liste sites
GET    /api/crm/projects/:id         Détail site
GET    /api/crm/clients/:id/projects Sites d'un client
POST   /api/crm/projects             Créer site (avec config PV)
PUT    /api/crm/projects/:id         Modifier site
DELETE /api/crm/projects/:id         Supprimer site
```

**Configuration PV Site** (stockée en JSON):
```json
{
  "mode": "advanced",
  "strings": [
    {"mpptNumber": 1, "moduleCount": 20},
    {"mpptNumber": 2, "moduleCount": 18}
  ]
}
```

**Base de Données**:
- Table `crm_clients`: Clients (raison sociale, SIRET, contacts)
- Table `projects`: Sites PV (puissance, modules, config PV JSON, adresse GPS)

---

### **2. Planning & Attribution** ✅

**Pages UI**:
- `/planning` - Dashboard interventions (stats, liste)
- `/planning/create` - Créer intervention
- `/planning/detail?id=X` - Détail intervention + **Bouton Ordre de Mission**
- `/planning/calendar` - Vue calendrier mensuel

**API Routes**:
```
GET    /api/planning/interventions                  Liste interventions (filtres)
GET    /api/planning/interventions/:id              Détail intervention
POST   /api/planning/interventions                  Créer intervention
PUT    /api/planning/interventions/:id              Modifier intervention
DELETE /api/planning/interventions/:id              Supprimer intervention

POST   /api/planning/assign                         Assigner technicien
GET    /api/planning/technicians/available?date=X   Techniciens disponibles
GET    /api/planning/dashboard                      Stats dashboard
GET    /api/planning/calendar?month=YYYY-MM         Vue calendrier
GET    /api/planning/conflicts                      Conflits planning

🆕 GET /api/planning/interventions/:id/ordre-mission  PDF Ordre de Mission
```

**Ordre de Mission PDF**:
- Informations client complètes
- Configuration site PV (modules, onduleurs, BJ, strings)
- Détails intervention (type, date, technicien)
- Espace signatures (client + technicien)
- Format professionnel avec logo DiagPV

---

### **3. Module Électroluminescence (EL)** ✅

**API Routes**:
```
POST   /api/el/audit/create                          Créer audit EL
🆕 POST /api/el/audits/create-from-intervention       Créer audit depuis intervention
                                                       → Hérite config PV site
                                                       → Génère modules auto
GET    /api/el/audit/:token                          Détail audit
PUT    /api/el/audit/:token                          Modifier audit
DELETE /api/el/audit/:token                          Supprimer audit
GET    /api/el/audit/:token/report                   Rapport PDF audit EL

POST   /api/el/audit/:token/module                   Diagnostiquer module
POST   /api/el/audit/:token/bulk-update              Diagnostic en masse
GET    /api/el/dashboard/audits                      Liste audits (stats)
```

**Workflow Automatisé**:
1. Intervention créée depuis Planning (type=el, site associé)
2. Bouton "Créer audit EL" → charge config PV du site
3. Génère automatiquement `el_modules` selon strings configuration
4. Module_identifier format: "S{mppt}-{position}" (ex: "S1-15")

**Base de Données**:
- Table `el_audits`: Audits (token, client, site, config JSON)
- Table `el_modules`: Modules diagnostiqués (identifier, défaut, sévérité, image)

---

### **4. Module Courbes I-V** ✅ 🆕

**API Routes**:
```
GET    /api/iv/measurements/:token                   Liste mesures I-V audit
POST   /api/iv/measurements/:token                   Import CSV (auto-liaison)
                                                       → Génère module_identifier
                                                       → Vérifie liaison el_modules
GET    /api/iv/measurements/:token/module/:id        Mesures module spécifique
DELETE /api/iv/measurements/:token                   Supprimer mesures
GET    /api/iv/report/:token                         Rapport PDF courbes I-V
```

**Types de Mesures**:
- **Référence (lumière)**: Isc, Voc, Pmax, Impp, Vmpp, FF, Rs, Rsh
- **Sombre (dark)**: Rs, Rsh, courbe I-V sombre

**Import Automatisé**:
```javascript
// Lors import CSV PVserv ou I-V:
// 1. Génère module_identifier = "S" + string_number + "-" + module_number
// 2. Vérifie existence dans el_modules
// 3. Retourne stats liaison: linked_to_el_modules, unlinked
```

**Base de Données**:
- Table `iv_measurements`: Mesures I-V (identifier, type, paramètres, courbes JSON)

---

### **5. Module Inspections Visuelles** ✅ 🆕

**API Routes**:
```
GET    /api/visual/inspections/:token               Liste inspections
POST   /api/visual/inspections/:token               Créer inspection
GET    /api/visual/report/:token                    Rapport PDF inspections
```

**Données Capturées**:
- Type inspection (general, structural, electrical, mechanical)
- Observations texte
- Photos (URLs JSON array)
- Défauts détectés
- Sévérité (low, medium, high, critical)

**Base de Données**:
- Table `visual_inspections`: Inspections (type, observations, photos JSON, severity)

---

### **6. Module Tests d'Isolement** ✅ 🆕

**API Routes**:
```
GET    /api/isolation/tests/:token                  Liste tests isolement
POST   /api/isolation/tests/:token                  Créer test
GET    /api/isolation/report/:token                 Rapport PDF tests
```

**Données Capturées**:
- Type test (DC, AC, Earth)
- Tension test (V)
- Résistance mesurée (MΩ)
- Pass/Fail (conformité)
- Conditions (température, humidité)

**Base de Données**:
- Table `isolation_tests`: Tests (type, voltage, resistance, pass, conditions)

---

### **7. API Unifiée Modules** ✅

**Routes**:
```
GET /api/modules/:identifier               Module complet (EL + I-V + PVserv)
GET /api/modules/audit/:token              Tous modules audit (summary)
```

**Exemple Response** (GET /api/modules/S1-15):
```json
{
  "success": true,
  "module": {
    "identifier": "S1-15",
    "string_number": 1,
    "position_in_string": 15,
    "el": {
      "defect_type": "pid",
      "severity": 3,
      "image_url": "...",
      "comment": "PID détecté"
    },
    "iv_reference": {
      "isc": 9.45,
      "voc": 45.2,
      "pmax": 325.8,
      "fill_factor": 0.78
    },
    "iv_dark": {
      "rs": 0.42,
      "rsh": 1200
    },
    "pvserv": {
      "fill_factor": 0.78,
      "rds": 0.35,
      "uf": 0.92
    }
  }
}
```

**Views Database**:
- `v_module_complete`: JOIN EL + I-V ref + I-V dark + PVserv
- `v_module_performance_summary`: Health score global (0-100)

---

## 🔄 Workflow Automatisé Complet

```
1. CRM - Créer Client
   └─ Raison sociale, SIRET, contacts

2. CRM - Créer Site PV
   ├─ Puissance, modules, onduleurs
   ├─ Configuration PV détaillée:
   │  ├─ Nombre onduleurs, marque
   │  ├─ Boîtes de jonction (BJ)
   │  └─ Strings par MPPT: [S1: 20 modules, S2: 18 modules, ...]
   └─ Format JSON stocké: {"mode": "advanced", "strings": [...]}

3. Planning - Créer Intervention
   ├─ Type: el, iv, visual, isolation
   ├─ Date, durée
   ├─ Associé au site (project_id)
   └─ Assigner technicien (optionnel)

4. Planning - Générer Ordre de Mission PDF
   └─ PDF complet: client + site + config PV + technicien + signatures

5. Intervention - Créer Audit EL
   ├─ Bouton "Créer audit EL" (si type=el)
   ├─ API: POST /api/el/audits/create-from-intervention
   ├─ Hérite automatiquement:
   │  ├─ Config PV site → configuration_json audit
   │  ├─ Onduleurs, BJ → inverter_count, junction_boxes
   │  └─ Strings → génère el_modules automatiquement
   └─ Génère 120 modules (par ex): S1-1, S1-2, ..., S10-12

6. Audit EL - Diagnostiquer Modules
   ├─ Interface collaborative temps réel
   ├─ Défauts: none, pid, microcrack, dead_module, string_open, etc.
   ├─ Sévérité: 0-5
   └─ Photos + commentaires

7. Import Données PVserv
   ├─ API: POST /api/audit/:token/save-measurements
   ├─ Génère auto module_identifier = "S{string}-{module}"
   ├─ Vérifie liaison avec el_modules
   └─ Stats: "✅ 115/120 mesures liées aux modules EL"

8. Import Courbes I-V
   ├─ API: POST /api/iv/measurements/:token
   ├─ Type: reference ou dark
   ├─ Génère auto module_identifier
   └─ Liaison automatique avec el_modules

9. Consultation Data Unifiée
   ├─ API: GET /api/modules/S1-15
   └─ Retourne: EL + I-V référence + I-V sombre + PVserv

10. Génération Rapports PDF
    ├─ Rapport EL: /api/el/audit/:token/report
    ├─ Rapport I-V: /api/iv/report/:token
    ├─ Rapport Visuels: /api/visual/report/:token
    └─ Rapport Isolation: /api/isolation/report/:token
```

---

## 🗄️ Base de Données - Tables Principales

### **CRM**
- `crm_clients`: Clients (company_name, siret, contacts, adresse)
- `projects`: Sites PV (puissance, modules, **config PV JSON**, adresse GPS)

### **Planning**
- `interventions`: Interventions (project_id, client_id, type, date, technicien)

### **Module EL**
- `el_audits`: Audits EL (token, client, site, config JSON, intervention_id)
- `el_modules`: Modules diagnostiqués (**module_identifier**, défaut, sévérité)

### **Module I-V**
- `iv_measurements`: Mesures I-V (**module_identifier**, type, Isc, Voc, Pmax, courbes JSON)

### **Module PVserv**
- `pvserv_measurements`: Mesures PVserv (**module_identifier**, FF, RDS, UF, courbes JSON)

### **Modules Visuels & Isolation**
- `visual_inspections`: Inspections (type, observations, photos JSON, severity)
- `isolation_tests`: Tests (type, voltage, resistance, pass/fail, conditions)

### **Authentification**
- `auth_users`: Utilisateurs (email, role, password_hash)
- `auth_user_assignments`: Assignations interventions

---

## 🔐 Authentification & Rôles

**Rôles Disponibles**:
- `admin`: Accès complet plateforme
- `subcontractor`: Sous-traitant (interventions assignées)
- `client`: Client (consultation rapports uniquement)
- `auditor`: Auditeur (création audits, diagnostics)

**Pages Admin**:
- `/admin/users` - Gestion utilisateurs
- `/admin/assignments` - Attribution permissions

**Note**: Authentification **actuellement désactivée** en développement (AUTH_ENABLED=false).

---

## 🛠️ Commandes Développement

### **Installation**
```bash
cd /home/user/webapp
npm install
```

### **Développement Local**
```bash
# Build
npm run build

# Démarrer avec PM2 (daemon)
pm2 start ecosystem.config.cjs

# Vérifier status
pm2 list
pm2 logs diagnostic-hub --nostream

# Tester
curl http://localhost:3000
```

### **Migrations Database**
```bash
# Appliquer migrations locales
npm run db:migrate:local

# Appliquer migrations production
npm run db:migrate:prod

# Seed data
npm run db:seed

# Reset database
npm run db:reset
```

### **Déploiement Cloudflare Pages**
```bash
# Setup API key (une seule fois)
setup_cloudflare_api_key

# Vérifier auth
npx wrangler whoami

# Build
npm run build

# Deploy
npm run deploy

# Custom domain
npx wrangler pages domain add example.com --project-name webapp
```

### **Git**
```bash
# Status
git status

# Commit
git add .
git commit -m "Description changements"

# Push GitHub
setup_github_environment  # Une seule fois
git push origin main
```

---

## 📊 Scripts Package.json

```json
{
  "scripts": {
    "dev": "vite",
    "dev:sandbox": "wrangler pages dev dist --ip 0.0.0.0 --port 3000",
    "build": "vite build",
    "deploy": "npm run build && wrangler pages deploy dist",
    "deploy:prod": "npm run build && wrangler pages deploy dist --project-name webapp",
    
    "db:migrate:local": "wrangler d1 migrations apply webapp-production --local",
    "db:migrate:prod": "wrangler d1 migrations apply webapp-production",
    "db:seed": "wrangler d1 execute webapp-production --local --file=./seed.sql",
    "db:reset": "rm -rf .wrangler/state/v3/d1 && npm run db:migrate:local && npm run db:seed",
    
    "clean-port": "fuser -k 3000/tcp 2>/dev/null || true",
    "test": "curl http://localhost:3000"
  }
}
```

---

## 🎯 Prochaines Améliorations (Roadmap)

### **Phase 3 - Fonctionnalités Avancées**
- [ ] Pages UI Module I-V (liste, import CSV, détail module)
- [ ] Pages UI Module Visuels (formulaire checklist, galerie photos)
- [ ] Pages UI Module Isolation (formulaire tests, dashboard conformité)
- [ ] Graphiques courbes I-V (Chart.js ou Canvas)
- [ ] Upload images EL modules (Cloudflare R2)
- [ ] Génération rapports PDF enrichis (graphiques, photos annotées)

### **Phase 4 - Optimisations**
- [ ] Cache API (Cloudflare KV)
- [ ] Pagination résultats (API + UI)
- [ ] Recherche full-text (clients, sites, audits)
- [ ] Notifications email (SendGrid/Resend)
- [ ] Export Excel/CSV (audits, mesures)
- [ ] Historique modifications (audit trail)

### **Phase 5 - Modules Supplémentaires**
- [ ] Module Thermographie
- [ ] Module Post-Sinistre (expertise judiciaire)
- [ ] Module Commissioning
- [ ] Module Repowering & Optimisation

---

## 📞 Support & Contact

**Diagnostic Photovoltaïque**  
3 rue d'Apollo, 31240 L'Union  
📧 contact@diagpv.fr  
☎ 05.81.10.16.59  
🌐 www.diagnosticphotovoltaique.fr  
RCS 792972309

**Contact Développeur**:  
Adrien PAPPALARDO - Business Developer  
📧 info@diagnosticphotovoltaique.fr  
📱 06 07 29 22 12

---

## 📝 Changelog

### **v2.0.0 - 2025-11-17** 🎉
- ✅ Phase 1C: Automatisation workflow CRM → Planning → Audits
- ✅ Phase 1D: Ordres de Mission PDF
- ✅ Phase 2A: Module I-V complet (API + rapports)
- ✅ Phase 2B: Module Inspections Visuelles (API)
- ✅ Phase 2C: Module Tests d'Isolement (API)
- ✅ Héritage config PV site → audit EL
- ✅ Génération auto modules EL selon config strings
- ✅ Import PVserv/I-V avec auto-liaison module_identifier
- ✅ API unifiée modules (EL + I-V + PVserv)
- ✅ Configuration PV formulaire édition site

### **v1.0.0 - 2024-11-06**
- ✅ Module Électroluminescence opérationnel
- ✅ CRM Clients & Sites (8 pages)
- ✅ Planning & Attribution (4 pages)
- ✅ Authentification multi-rôles
- ✅ Déploiement Cloudflare Pages

---

## ⚖️ Licence & Confidentialité

**Propriété intellectuelle**: Diagnostic Photovoltaïque  
**Confidentialité**: Méthodologie propriétaire protégée  
**Usage**: Réservé exclusivement aux activités DiagPV

❌ **Interdictions**:
- Divulgation méthodologie sans NDA
- Partage données clients
- Reproduction code source
- Usage commercial tiers

---

**Développé avec ❤️ pour Diagnostic Photovoltaïque**  
*Excellence technique depuis 2012 | Plus de 500 interventions*
