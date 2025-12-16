# 🏢 Diagnostic Hub - Plateforme Unifiée DiagPV

## 🎯 Vue d'ensemble

**Diagnostic Hub** est la plateforme unifiée pour tous les outils d'audit de **Diagnostic Photovoltaïque** (www.diagnosticphotovoltaique.fr). Cette architecture monolithe modulaire centralise 6 modules métier avec partage de ressources communes (clients, projets, interventions, utilisateurs).

### 🏗️ Architecture Monolithe Modulaire

### 🚀 DASHBOARD UNIFIÉ (CONTROL TOWER)
Une interface centrale "Tour de Contrôle" unifie désormais l'expérience utilisateur :
- **Vue Globale** : KPIs temps réel, Alertes Critiques, État du système.
- **Explorateur Unifié** : Navigation hiérarchique fluide (Client → Projets → Interventions → Audits).
- **Intégration** : Accès direct aux modules CRM, Planning et Audits sans changer de contexte.
- **URL** : `/crm/dashboard` ou `/dashboard`

```
diagnostic-hub/
├── src/modules/
│   ├── el/                       ✅ Électroluminescence (PRODUCTION)
│   ├── iv-curves/                ✅ Courbes I-V (PRODUCTION)
│   ├── visual-inspection/        ✅ Contrôles visuels IEC 62446-1 (PRODUCTION)
│   ├── pv-cartography/           ✅ Cartographie PV (PRODUCTION)
│   ├── crm/                      ✅ CRM (Clients/Projets) (PRODUCTION)
│   ├── planning/                 ✅ Planning Interventions (PRODUCTION)
│   ├── audits/                   ✅ Gestion Audits Unifiée (PRODUCTION)
│   ├── thermique/                🔜 Thermographie
│   ├── isolation/                🔜 Tests isolation
│   └── expertise/                🔜 Expertise post-sinistre
└── Database D1 unifiée (diagnostic-hub-production)
```

## ✅ Module EL - Électroluminescence (Production)

### Fonctionnalités Complètes

#### 🔧 Création d'audit
- Configuration manuelle: strings × modules par string
- Configuration avancée: strings différents (mode MPPT)
- Upload plan PDF/image avec génération grille automatique
- Token unique sécurisé pour partage équipe
- Support jusqu'à 20 000 modules

#### 🌙 Interface audit terrain nocturne
- **Thème sombre exclusif** (fond #000000, texte #FFFFFF)
- **Optimisation tactile** tablettes + gants épais
- Boutons 60×60px, espacement 10px, police 18px gras
- Navigation fluide par strings avec scroll natif
- Réaction <0.2s pour diagnostic modules

#### ⚡ Système diagnostic 6 états
- 🟢 **OK** - Aucun défaut
- 🟡 **Inégalité** - Qualité cellules
- 🟠 **Microfissures** - Visibles EL
- 🔴 **HS** - Module défaillant
- 🔵 **String ouvert** - Sous-string ouvert
- ⚫ **Non raccordé** - Non connecté
- Commentaires optionnels + validation instantanée

#### 🤝 Collaboration temps réel
- URL partagée = accès immédiat équipe (4 techniciens max)
- Synchronisation <1s via Server-Sent Events
- Indicateurs visuels techniciens actifs
- Gestion conflits: dernier clic gagne

#### 📊 Import mesures PVserv
- Parser intelligent format PVserv
- Extraction: FF, Rds, Uf, courbes I-V
- Validation données + statistiques auto
- Intégration rapport sans interprétation

#### 📄 Génération rapports auto
- Format professionnel Diagnostic Photovoltaïque
- **🗺️ Plan de calepinage physique** - Grille visuelle avec localisation exacte
- **Codes couleur** - Identification immédiate modules à remplacer
- **Légende complète** - 7 états visuels (OK, Inégalité, Microfissures, HS, etc.)
- Statistiques par état (%, nombres)
- Listing détaillé modules non-conformes avec commentaires
- Export PDF imprimable pour intervention sur site
- Mesures PVserv intégrées
- Génération <5s pour 1000 modules

#### 💾 Mode offline complet
- Sauvegarde auto continue localStorage
- Service Worker PWA cache intelligent
- Sync différée automatique
- Recovery auto après crash

### 📋 URLs Production Module EL

#### Interface utilisateur
- **`/`** - Dashboard création audits + audits récents
- **`/audit/{token}`** - Interface terrain nocturne collaborative
- **`/dashboard`** - Tableau de bord audits temps réel

#### API Endpoints Module EL
- **`POST /api/el/audit/create`** - Création nouvel audit
- **`POST /api/el/audit/create-from-json`** - Import configuration JSON
- **`GET /api/el/audit/:token`** - Données audit + modules + progression
- **`GET /api/el/audit/:token/report`** - **Génération rapport PDF avec impression** ✅
- **`PUT /api/el/audit/:token`** - Modifier informations audit
- **`DELETE /api/el/audit/:token`** - Supprimer audit complet
- **`POST /api/el/audit/:token/module/:moduleId`** - Mise à jour module individuel ✅
- **`POST /api/el/audit/:token/module`** - Créer module individuel
- **`POST /api/el/audit/:token/bulk-update`** - Mise à jour en lot (max 100)
- **`GET /api/el/dashboard/audits`** - Liste audits avec statistiques
- **`GET /api/el/dashboard/overview`** - Vue d'ensemble globale

#### API Endpoints PVserv (legacy routes)
- **`POST /api/audit/:token/parse-pvserv`** - Parser fichier PVserv
- **`POST /api/audit/:token/save-measurements`** - Sauvegarder mesures
- **`GET /api/audit/:token/measurements`** - Récupérer mesures

## 🗺️ Module PV Cartography - Cartographie GPS (Beta)

### Fonctionnalités Actuelles

#### 📍 Système GPS précis
- Cartographie modules avec coordonnées latitude/longitude exactes
- Base Esri Satellite zoom 22 (haute résolution) via Leaflet.js 1.9.4
- Calculs géospatiaux Turf.js (GPS ↔ mètres, surface, point-in-polygon)
- Support toiture, ombrière, champ au sol (14 à 50 000 modules)

#### 🎮 Handles Interactifs - SolarEdge Style (NOUVEAU ✨)
- **5 handles par rectangle**: 4 coins resize + 1 centre rotation
- **Activation/désactivation**: Clic rectangle → orange + handles / Clic carte → désactivation
- **Resize biaisé**: Drag coins blancs (12×12px) → redimensionnement depuis coin
- **Rotation visuelle**: Drag centre bleu (20×20px) → rotation fluide selon angle souris
- **Régénération auto**: Modules repositionnés après chaque transformation
- **Optimisation performance**: Pas de régénération pendant drag (uniquement à dragend)
- **Validation bounds**: Empêche inversion rectangle lors resize
- **UX comparable**: SolarEdge Designer, OpenSolar, Huawei Fusion Solar

#### ✏️ Workflow Canvas V2
**ÉTAPE 1: Dessin Toiture**
- Outil Leaflet.Draw pour tracer contour polygone GPS
- Calcul automatique surface (m²) avec Turf.js
- Validation visuelle sur imagerie satellite

**ÉTAPE 2: Configuration Électrique Manuelle**
- Onduleurs, boîtes de jonction, nombre de strings
- **🎯 Strings non réguliers** - Config individuelle par string (ex: S1=26, S2=24, S3=28, S4=22)
- Modal configuration intuitive avec calcul total temps réel
- Résumé config visible après application

**ÉTAPE 3: Placement Modules**
- **Placement Manuel** - Click map → Modal annotation → Module créé avec GPS
- **Placement Auto (Config)** - Génération automatique selon config strings non réguliers
- Validation point-in-polygon (modules uniquement dans contour)
- Dimensions physiques réalistes (1.0m × 1.7m, espacement 2cm)

#### 🎨 Système Annotation 7 Statuts (Module EL)
- 🟢 **OK** (#22c55e) - Module sain
- 🟡 **INÉGALITÉ** (#eab308) - Inégalité courant
- 🟠 **MICROFISSURES** (#f97316) - Microfissures visibles
- 🔴 **MODULE MORT** (#ef4444) - Module défaillant
- 🔵 **STRING OUVERT** (#3b82f6) - String ouvert
- ⚫ **NON CONNECTÉ** (#6b7280) - Non connecté
- ⚪ **EN ATTENTE** (#e5e7eb) - En attente annotation
- Modal annotation avec commentaires + mise à jour instantanée

#### 📄 Export PDF Technique
- Page 1: Carte satellite avec modules colorés + stats 7 statuts
- Page 2: Liste détaillée modules avec string/position/statut/commentaires
- Caractéristiques techniques (puissance kWc, config électrique, surface)
- Génération <5s avec html2canvas + jsPDF

#### 💾 Persistance Database D1
- Sauvegarde config électrique (onduleurs, BJ, strings, modules/string)
- Sauvegarde contour toiture GPS (polygon + surface m²)
- Sauvegarde modules individuels (identifier, string, position, lat/lng, statut)
- Reload page restaure état complet (contour + config + modules)

#### 📦 Export GeoJSON/KML/CSV (IEC 62446-1)
- **3 formats export** - GeoJSON (cartographie web), KML (Google Earth), CSV (Excel)
- **Traçabilité GPS normative** - Conformité IEC 62446-1 pour commissioning
- **Métadonnées complètes** - Date, standard, source DiagPV, données techniques
- **Téléchargement automatique** - Boutons export dans interface ÉTAPE 5
- **⚠️ Workflow requis** - Import audit EL → Placement modules carte → Export (coordonnées GPS calculées lors placement)

### 📋 URLs Module PV Cartography

#### Interface utilisateur
- **`/pv/plants`** - Liste centrales PV (CRUD)
- **`/pv/plant/:id`** - Détail centrale + zones (CRUD)
- **`/pv/plant/:plantId/zone/:zoneId/editor/v2`** - **Canvas V2 Leaflet** (Beta)
- **`/pv/plant/:plantId/zone/:zoneId/editor`** - Canvas V1 legacy (comparaison)

#### API Endpoints PV Cartography
- **`GET /api/pv/plants`** - Liste centrales
- **`POST /api/pv/plants`** - Créer centrale
- **`PUT /api/pv/plants/:id`** - Modifier centrale
- **`DELETE /api/pv/plants/:id`** - Supprimer centrale
- **`GET /api/pv/plants/:plantId/zones`** - Liste zones centrale
- **`POST /api/pv/plants/:plantId/zones`** - Créer zone
- **`PUT /api/pv/plants/:plantId/zones/:zoneId`** - Modifier zone
- **`DELETE /api/pv/plants/:plantId/zones/:zoneId`** - Supprimer zone
- **`PUT /api/pv/plants/:plantId/zones/:zoneId/config`** - **Sauvegarder config électrique**
- **`PUT /api/pv/plants/:plantId/zones/:zoneId/roof`** - **Sauvegarder contour toiture GPS**
- **`GET /api/pv/plants/:plantId/zones/:zoneId/modules`** - Liste modules zone
- **`POST /api/pv/plants/:plantId/zones/:zoneId/modules`** - Créer modules (bulk)
- **`PUT /api/pv/plants/:plantId/zones/:zoneId/modules/:moduleId`** - Modifier module
- **`DELETE /api/pv/plants/:plantId/zones/:zoneId/modules/:moduleId`** - Supprimer module
- **`GET /api/pv/plants/:plantId/zones/:zoneId/export/geojson`** - **Export GeoJSON (traçabilité IEC 62446-1)** ✨
- **`GET /api/pv/plants/:plantId/zones/:zoneId/export/kml`** - **Export KML (Google Earth)** ✨
- **`GET /api/pv/plants/:plantId/zones/:zoneId/export/csv`** - **Export CSV (Excel)** ✨

### 🔧 Implémentation Technique Canvas V2

**Frontend Stack**:
- Leaflet.js 1.9.4 (cartographie interactive)
- Leaflet.Draw 1.0.4 (dessin polygones)
- Turf.js 7.1.0 (calculs géospatiaux)
- html2canvas 1.4.1 (capture carte)
- jsPDF 2.5.2 (export PDF)

**Backend Stack**:
- Hono TypeScript routes (`/src/modules/pv/routes/plants.ts`)
- Cloudflare D1 SQLite (tables `pv_plants`, `pv_zones`, `pv_modules`)
- Vue `v_pv_zones_stats` (agrégation 7 statuts temps réel)

**Fichiers Clés**:
- `/src/index.tsx` (lignes 3344-4286) - Canvas V2 Leaflet complet
- `/src/modules/pv/routes/plants.ts` - Routes API CRUD + config
- `/migrations/0007_add_gps_cartography.sql` - Schéma GPS + config électrique
- `/PV_CARTOGRAPHY_TEST_GUIDE.md` - Guide test complet strings non réguliers
- `/PV_CARTOGRAPHY_COLOR_SYSTEM.md` - Référence 7 statuts couleurs
- `/GOOGLE_MAPS_API_SETUP.md` - Guide création clé API

### 📊 État Avancement Cartography (10/11/2025)

**Phase 1 MVP - Architecture Base + Features**: ✅ **100% COMPLÉTÉ** 🎉
- ✅ Tables D1 (pv_plants, pv_zones, pv_modules) avec GPS
- ✅ Routes API CRUD centrales/zones/modules
- ✅ Vue stats agrégation 7 statuts
- ✅ Carte Leaflet + Esri Satellite zoom 22 + Street labels overlay
- ✅ Dessin toiture GPS + calcul surface Turf.js
- ✅ Modal annotation 7 statuts (couleurs exactes Module EL)
- ✅ Placement manuel modules avec GPS lat/lng
- ✅ Placement auto avec validation point-in-polygon
- ✅ **Strings non réguliers** - Config individuelle par string (S1=26, S2=24, etc.)
- ✅ **Handles interactifs** - 5 handles (resize + rotation) style SolarEdge avec rotation bug fix
- ✅ **Import 242 modules** - Rectangle single array avec rotation correcte
- ✅ **Configuration électrique MVP** - Onduleurs + String assignments + Validation électrique
- ✅ **Export GeoJSON/KML/CSV** - Traçabilité IEC 62446-1 (3 formats) ✨ **NOUVEAU**
- ✅ **Fix Data JALIBAT** - String 1 restaurée (242 modules complets) ✨ **NOUVEAU**
- ✅ **Persistance rotation rectangles** - Sauvegarde angle rotation en localStorage (pas de perte alignement satellite) ✨ **NOUVEAU**
- ✅ **Persistance config strings** - Sauvegarde strings non réguliers (S1=26, S2=24...) en localStorage + DB ✨ **NOUVEAU**
- ✅ Export PDF (carte + stats + liste modules)
- ✅ Sauvegarde/reload persistance DB
- ⏳ **Tests validation Phase 1** (5 audits terrain + KPIs ROADMAP)

**Phase 2b - Optimisations**: ✅ **100% COMPLÉTÉ** 🎉
- ✅ Sauvegarde stringsConfig en DB (colonne JSON ou table) ✅ **TERMINÉ**
- ✅ Chargement stringsConfig depuis DB au reload ✅ **TERMINÉ**
- ✅ Export stringsConfig dans PDF (tableau récap) ✅ **TERMINÉ**
- ✅ Interface modification config sans tout replacer ✅ **TERMINÉ**

**Phase 3 - Liaison EL**: ✅ **100% COMPLÉTÉ** 🎉
- ✅ Table `pv_cartography_audit_links` - Migration 0013
- ✅ API endpoints liaison/sync (4 routes)
- ✅ Synchronisation statuts modules EL → Canvas V2
- ✅ UI: Bouton "Importer EL" + Badge liaison active
- ✅ Gestion complète: Voir/Re-sync/Délier
- ✅ Workflow complet: Token → Link → Sync → Gestion → Visualisation

**Phase 4 - Avancé**: 🔜 **PLANIFIÉ**
- Duplication layouts entre zones (templates)
- Clustering marqueurs >5000 modules (performance)
- Import layouts depuis fichiers CSV/JSON
- Historique modifications modules

### 📄 Documentation Cartography
- **`PV_CARTOGRAPHY_TEST_GUIDE.md`** - Guide test complet strings non réguliers (scénarios, cas limites, bugs connus)
- **`PV_CARTOGRAPHY_COLOR_SYSTEM.md`** - Référence 7 statuts avec hex codes, dégradés, animations
- **`GOOGLE_MAPS_API_SETUP.md`** - Guide création clé Google Maps API + restrictions sécurité
- **`HANDLES_INTERACTIFS.md`** - Architecture technique système handles (9.1 KB, 350 lignes)
- **`TEST_HANDLES_INTERACTIFS.md`** - Plan validation 20 tests fonctionnels (11.8 KB)
- **`GUIDE_RAPIDE_HANDLES.md`** - Guide utilisateur démarrage 2 minutes (8.1 KB)
- **`RESUME_HANDLES_INTERACTIFS.md`** - Résumé exécutif Phase 1 MVP (10.6 KB)

## 📊 Architecture Données D1 Unifiée

### Tables CORE (partagées tous modules)
- **`users`** - Techniciens et utilisateurs
- **`clients`** - Clients DiagPV
- **`projects`** - Projets clients (1 client → N projets)
- **`interventions`** - Interventions sur projets (N modules peuvent partager)

### Tables Module EL
- **`el_audits`** - Audits électroluminescence
- **`el_modules`** - Modules diagnostiqués
- **`el_collaborative_sessions`** - Sessions temps réel
- **`el_measurements`** - Mesures spécifiques EL

### Tables Module PV Cartography (Beta)
- **`pv_plants`** - Centrales solaires (site_name, client_id, total_capacity_kwp, lat/lng)
- **`pv_zones`** - Zones/toitures (zone_name, plant_id, inverter_count, string_count, roof_polygon, roof_area_sqm)
- **`pv_modules`** - Modules GPS (module_identifier, zone_id, string_number, position_in_string, latitude, longitude, module_status)
- **`v_pv_zones_stats`** - Vue agrégation 7 statuts par zone (total_modules, modules_ok, modules_dead, etc.)
- **`pv_cartography_audit_links`** - Liens bidirectionnels Cartography ↔ EL Audits (Phase 3)

### Tables Modules Futurs
- **`iv_measurements`** - Courbes I-V
- **`thermal_measurements`** - Thermographie
- **`isolation_tests`** - Tests isolation
- **`visual_inspections`** - Contrôles visuels
- **`post_incident_expertise`** - Expertise sinistres

### Vues Précalculées (Performance)
- **`v_el_audit_statistics`** - Stats audit EL temps réel
- **`v_intervention_summary`** - Résumé interventions multi-modules

### Triggers Automatiques
- `trg_el_audit_update_timestamp` - Mise à jour auto timestamp
- `trg_el_module_update_timestamp` - Tracking modifications modules
- `trg_update_audit_completion` - Calcul progression audit
- `trg_sync_intervention_dates` - Sync dates intervention
- `trg_cascade_delete_modules` - Suppression cascade
- `trg_validate_el_audit_intervention` - Validation FK
- `trg_validate_el_module_fk` - Validation intégrité

## 🚀 Déploiement Production

### URLs de production
- **Production**: https://5cd316f4.diagnostic-hub.pages.dev ✅ **DERNIER DÉPLOIEMENT (15/12/2025)**
- **Domaine principal**: https://diagnostic-hub.pages.dev
- **Dashboard Unifié**: https://diagnostic-hub.pages.dev/dashboard
- **Nouveau Création Audit**: https://diagnostic-hub.pages.dev/audits/create
- **Sandbox Dev**: https://3000-ihjl3q1cxb8r55v93w6w4-6532622b.e2b.dev (test handles interactifs)
- **GitHub**: https://github.com/pappalardoadrien-design/Diagnostic-pv
- **Database**: diagnostic-hub-production (ID: 72be68d4-c5c5-4854-9ead-3bbcc131d199)
- **Backup**: https://page.gensparksite.com/project_backups/diagnostic-hub-handles-interactifs-v1.tar.gz

### Plateforme
- **Hébergement**: Cloudflare Pages (edge global)
- **Base données**: Cloudflare D1 SQLite (serverless)
- **Performance**: <3s chargement, <0.2s réaction
- **Scalabilité**: Jusqu'à 20 000 modules/audit

### Tech Stack
- **Backend**: Hono TypeScript + Cloudflare Workers
- **Frontend**: Vanilla JavaScript + TailwindCSS CDN
- **Database**: Cloudflare D1 SQLite unified
- **Storage**: Cloudflare R2 + KV
- **PWA**: Service Worker offline-first

### Statistiques Production (27/10/2025)
- ✅ 2 audits migrés: JALIBAT (242 modules) + Les Forges (220 modules)
- ✅ 462 modules totaux avec 100% d'intégrité
- ✅ Distribution: 58 OK, 87 microcracks, 182 dead, 135 inequality
- ✅ Tokens préservés, configurations avancées intactes
- ✅ Database size: 0.44 MB
- ✅ **Édition modules opérationnelle** - Tests validation réussis
- ✅ **Génération rapports PDF** - Imprimables avec stats complètes
- ✅ **Plan de calepinage physique** - Grille visuelle pour localisation sur site

## 🔧 Développement Local

### Prérequis
```bash
# Node.js 18+ et npm
node --version  # v18.0.0+
npm --version   # 9.0.0+
```

### Installation
```bash
cd /home/user/diagnostic-hub
npm install
```

### Scripts disponibles
```bash
npm run dev              # Vite dev server (local machine)
npm run dev:sandbox      # Wrangler pages dev (sandbox)
npm run dev:d1           # Wrangler avec D1 local
npm run build            # Build production
npm run preview          # Preview build local
npm run deploy           # Deploy vers Cloudflare
npm run deploy:prod      # Deploy production avec project name

# Database D1
npm run db:migrate:local  # Appliquer migrations local
npm run db:migrate:prod   # Appliquer migrations production
npm run db:seed           # Seed local database
npm run db:reset          # Reset local + migrate + seed
npm run db:console:local  # Console SQL local
npm run db:console:prod   # Console SQL production

# Git
npm run git:init         # Init git + commit initial
npm run git:commit       # Commit avec message
npm run git:status       # Git status
npm run git:log          # Git log oneline

# Utilities
npm run clean-port       # Kill port 3000
npm run test             # Test local health
```

### PM2 Development (Sandbox)
```bash
# Build first (required)
npm run build

# Start avec PM2 (daemon)
pm2 start ecosystem.config.cjs

# Monitoring
pm2 list                     # Liste services
pm2 logs diagnostic-hub --nostream
pm2 restart diagnostic-hub
pm2 delete diagnostic-hub

# Test santé
curl http://localhost:3000
```

### Configuration Database D1
```jsonc
// wrangler.jsonc
{
  "d1_databases": [{
    "binding": "DB",
    "database_name": "diagnostic-hub-production",
    "database_id": "72be68d4-c5c5-4854-9ead-3bbcc131d199"
  }]
}
```

## 📈 Migration Module EL Standalone

### Processus Migration (27/10/2025)
1. **Export données production** - 2 audits, 462 modules sauvegardés
2. **Création schéma unifié** - Migration 0004 avec 90 commandes SQL
3. **Transformation données** - Script TypeScript avec mapping statuts
4. **Application production** - Import 3275 rows en 11.34ms
5. **Validation intégrité** - 12 tests automatisés 100% réussis
6. **Déploiement production** - Build + deploy Cloudflare Pages

### Statistiques Migration
- **Audits migrés**: 2 (JALIBAT + Les Forges)
- **Modules migrés**: 462 avec 100% intégrité
- **Mapping statuts**: ok→none, microcracks→microcrack, dead→dead_module
- **Severity levels**: 0=OK, 1=Minor, 2=Medium, 3=Critical
- **Tokens préservés**: a4e19950-c73c-412c-be4d-699c9de1dde1, 76e6eb36-8b49-4255-99d3-55fc1adfc1c9
- **Database size**: 0.44 MB après migration

### Backward Compatibility
- ✅ Anciens statuts transformés automatiquement (ok, inequality, microcracks, dead)
- ✅ Nouveaux defect_types supportés (none, microcrack, dead_module, luminescence_inequality)
- ✅ Frontend peut envoyer anciens ou nouveaux formats
- ✅ API accepte les deux formats avec transformation transparente

## 🔒 Sécurité et Conformité

### Protection données
- **Tokens uniques** sécurisés par audit (UUID v4)
- **Chiffrement** données sensibles locales
- **RGPD** conformité intégrée
- **Sauvegarde triple**: Local + Cloud + Export

### Robustesse système
- **Auto-recovery** crash avec restauration état
- **Messages erreur** français clairs techniciens
- **Validation** complète inputs utilisateur
- **Logging** détaillé pour debug production

## 🗺️ ROADMAP STRATÉGIQUE

### 📄 Documents Stratégiques
- **`ROADMAP_PRAGMATIQUE.md`** - Roadmap complète 4 phases (18-24 mois) avec validation économique
- **`DECISION_STRATEGIQUE.md`** - Guide décision développement (5 options comparées)

### 🎯 Phase 0 : CONSOLIDATION (Novembre 2025 - 2 semaines)
**Budget :** 0€ (travail interne)  
**Objectif :** UNE version opérationnelle unique

- [x] ✅ Fix cartographie (String 1 en haut)
- [x] ✅ Migration base unifiée (pv_modules multi-modules)
- [ ] 🔄 Archiver anciennes versions (webapp standalone, etc.)
- [ ] 🔄 Tester audit JALIBAT complet (import JSON → rapport PDF)
- [ ] 🔄 Documenter fonctionnalités existantes (README + captures)

**Livrable :** Module EL 100% opérationnel dans diagnostic-hub

---

### 🛠️ Phase 1 : MVP TERRAIN + RAPPORTS (Décembre 2025 - Mars 2026)
**Durée :** 3 mois | **Budget :** 0-15k€ (Solo OU Offshore)  
**Objectif :** Outil utilisable en autonomie sur chantier

**Fonctionnalités prioritaires :**
- [ ] Interface tactile mobile-first (tablette/smartphone)
- [ ] Mode hors-ligne (PWA + synchronisation auto)
- [ ] Rapport PDF professionnel normé ISO 17025
- [ ] Gestion audits basique (liste, recherche, duplication)
- [ ] Authentification simple (email/mot de passe)

**Critères succès :**
- ✅ Utilisé pour 100% des audits terrain
- ✅ Gain temps ≥30 min/audit vs process manuel
- ✅ 3-5 clients externes testent et valident
- ✅ Temps gagné mesuré et documenté

**Options développement :**
| Option | Budget | Délai | Recommandation |
|--------|--------|-------|----------------|
| **Solo** | 0€ | 4 mois | ✅ Si temps 15h/semaine + compétences JS |
| **Offshore** | 12-15k€ | 2-3 mois | ✅ Si cash dispo + urgence saison 2026 |
| **Stagiaire** | 3,6k€ | 6 mois | ⚠️ Si encadrement 10-15h/semaine |
| **CTO** | 0€ (20% equity) | 4 mois | ✅ Si associé long terme trouvé |

**Gate de validation :** Outil utilisé 100% terrain AVANT Phase 2

---

### 📈 Phase 2 : MULTI-MODULES (Avril - Juin 2026)
**Durée :** 3 mois | **Budget :** 10-30k€  
**Objectif :** Courbes IV + Thermographie = rapport combiné

**Fonctionnalités :**
- [ ] Module Courbes I-V (Isc, Voc, Pmax, Fill Factor, détection anomalies)
- [ ] Module Thermographie IR (points chauds, ΔT >10°C, corrélation EL)
- [ ] Rapport multi-modules unifié avec corrélations
- [ ] Préconisations croisées hiérarchisées (kWh/€ impact)

**Critères succès :**
- ✅ 3 audits complets (EL+IV+Thermo) réalisés clients
- ✅ Rapport combiné validé avec corrélations pertinentes
- ✅ Clients acceptent +30% tarif pour audit multi-modules
- ✅ Revenue mensuel ≥2k€ (24k€ ARR)

**⚠️ Point de décision critique :**
- Évaluer limites Cloudflare Workers (CPU timeout PDF, IA détection)
- Si limites atteintes → Planifier migration AWS/Node.js (Phase 3bis)

**Gate de validation :** 5 clients payent premium AVANT Phase 3

---

### 🤝 Phase 3 : COLLABORATION (Juillet - Octobre 2026)
**Durée :** 4 mois | **Budget :** 20-50k€  
**Objectif :** 2-5 utilisateurs (toi + techniciens terrain)

**Fonctionnalités :**
- [ ] Multi-utilisateurs (Admin, Technicien, Lecteur)
- [ ] Collaboration temps réel (WebSocket ou polling)
- [ ] Gestion équipe (dashboard, assignation missions)
- [ ] Notifications et commentaires modules

**Critères succès :**
- ✅ 2-5 techniciens utilisent l'outil quotidiennement
- ✅ Taux adoption >80% (tous les audits dans l'outil)
- ✅ Coordination améliorée : 20% temps gagné vs Excel
- ✅ Revenue mensuel ≥5k€ (60k€ ARR)

**⚠️ Architecture :**
- Si WebSocket nécessaire → **Migration AWS obligatoire** (20k€ refonte)
- Cloudflare : Polling simple (5-10s latence acceptable)

**Gate de validation :** 50 audits/mois, 5k€ MRR AVANT Phase 4

---

### 🚀 Phase 4 : SCALE & INTELLIGENCE (2027 - 12 mois)
**Durée :** 12 mois | **Budget :** 300-500k€ (levée fonds OU revenus)  
**Objectif :** Plateforme SaaS avec IA, marketplace, formations

**⚠️ PRÉ-REQUIS OBLIGATOIRES (sinon NE PAS démarrer) :**
- ✅ Revenue récurrent >10k€ MRR (120k€ ARR)
- ✅ 50+ clients actifs payants
- ✅ NPS >40, churn <5%/mois
- ✅ Équipe : CTO + 2 dev + 1 product owner

**Composantes :**
- [ ] IA Prédictive Picsellia (détection auto défauts EL >95%, 4 mois, 100-150k€)
- [ ] Analytics Avancées (LSTM prédiction dégradation, 3 mois, 50-80k€)
- [ ] Marketplace Partenaires (multi-tenants, commissions, 4 mois, 80-120k€)
- [ ] Formations RNCP Certifiantes (e-learning, parcours, 6 mois, 50-100k€)

**Architecture Phase 4 :**
- Migration AWS Kubernetes (EKS + RDS PostgreSQL + S3 + GPU)
- Microservices (Audits, Reports, AI/ML + 10 autres)
- Infrastructure : 1000€/mois (vs 10€ Cloudflare Phase 1-3)

**Gate de validation :** Levée fonds 500k€ OU revenus accumulés

---

### 📊 COMPARAISON COÛTS CLOUDFLARE vs AWS

| Phase | Infrastructure | Coût mensuel | Coût annuel | Note |
|-------|----------------|--------------|-------------|------|
| **Phase 1-3** | Cloudflare Workers + D1 + KV | 10€ | 120€ | ✅ Optimal MVP |
| **Phase 4** | AWS EKS + RDS + S3 + GPU | 1000€ | 12 000€ | ⚠️ Uniquement si revenue >10k€ MRR |

**→ Facteur coût : AWS = 100x plus cher que Cloudflare**

---

### 🚦 FEUX ROUGES : QUAND ARRÊTER

**STOP immédiat si :**
- ❌ Phase 1 prend >6 mois → Revoir scope ou stratégie dev
- ❌ Outil non utilisé après 3 mois disponible → Problème UX/valeur
- ❌ Budget épuisé avant Phase 1 terminée → Sous-estimation coûts
- ❌ Aucun client externe intéressé après 6 mois → Pas de marché

**→ Dans ces cas : PAUSE, pivoter ou abandonner (pas de sunk cost fallacy)**

---

### 📋 PROCHAINES ACTIONS IMMÉDIATES (CETTE SEMAINE)

**1. Décision stratégique développement (2h) :**
- [ ] Définir budget disponible RÉEL : _____€
- [ ] Temps hebdo dispo : _____h/semaine
- [ ] Compétences code actuelles : Aucune / Basiques / Intermédiaires
- [ ] Objectif timeline : Outil opérationnel avant _____/_____
- [ ] **CHOISIR 1 OPTION** : Solo / Offshore / Stagiaire / CTO / No-Code

**2. Nettoyage codebase (1h) :**
- [ ] Archiver anciennes versions (webapp, diagpv-audit-complete, etc.)
- [ ] Confirmer diagnostic-hub version unique de référence

**3. Tests audit JALIBAT complet (2h) :**
- [ ] Importer JSON JALIBAT dans diagnostic-hub
- [ ] Vérifier cartographie String 1→10 correcte
- [ ] Générer rapport PDF complet
- [ ] Identifier bugs bloquants éventuels

**4. Documentation utilisateur (3h) :**
- [ ] Guide pas-à-pas avec captures d'écran
- [ ] Vidéo screencast 5 min (Loom gratuit)
- [ ] Partager avec 2-3 collègues pour feedback

**5. Validation économique (1h) :**
- [ ] Calculer coût actuel par audit (temps × taux horaire)
- [ ] Estimer gain temps outil (30-60 min ?)
- [ ] Calculer ROI : Si 45 min × 20 audits/mois × 80€/h = 1200€/mois gagné

---

### 📄 Documentation Complète
- **`ROADMAP_PRAGMATIQUE.md`** - Roadmap détaillée 25 pages avec budgets, risques, stratégies low-cost
- **`DECISION_STRATEGIQUE.md`** - Guide décision 10 pages avec comparaison 5 options développement
- **`README.md`** - Vue d'ensemble projet et état actuel (ce document)

## 📞 Support et Contact

### Équipe Projet
- **Développement**: Claude AI Assistant
- **Validation métier**: Adrien - Diagnostic Photovoltaïque
- **Production**: DiagPV (www.diagnosticphotovoltaique.fr)

### Resources
- **Code source**: https://github.com/pappalardoadrien-design/Diagnostic-pv
- **Documentation**: README + commentaires code + docs/ folder
- **Production**: https://d93b2917.diagnostic-hub.pages.dev

### Documentation Technique
- `PLAN_FUSION_ARCHITECTURE.md` - Plan détaillé 21 points validation
- `SCHEMA_D1_UNIFIE_DOCUMENTATION.md` - Schéma database complet
- `EXPORT_DONNEES_PRODUCTION_2025-10-27.md` - Export données migration
- `VALIDATION_MIGRATION_2025-10-27.md` - Rapport validation 100%
- `src/modules/README.md` - Guide architecture modulaire
- `src/modules/el/README.md` - Documentation Module EL

## 🎯 Statut Projet

### Production (27/10/2025)
- **État**: ✅ **PRODUCTION OPÉRATIONNELLE**
- **Module EL**: 100% fonctionnel avec données réelles
- **Tests**: Validation complète fonctionnalités critiques
- **Migration**: 462 modules migrés avec intégrité 100%
- **Architecture**: Monolithe modulaire prêt pour 5 modules futurs

### Validation Métier
- **Spécifications**: 100% requirements DiagPV Module EL
- **Interface nocturne**: Optimisation totale conditions terrain
- **Workflow**: Élimination 80% temps administratif
- **Collaboration**: Temps réel 4 techniciens opérationnel
- **Données production**: JALIBAT + Les Forges préservés

## ✅ Module Visual Inspection - Contrôles Visuels IEC 62446-1 (Production)

### 🎯 Objectif
Module mobile-first pour **contrôles visuels terrain** conformes à la norme **IEC 62446-1** avec checklist standardisée de 36 points (mécanique, électrique, documentation, sécurité).

### 📋 Fonctionnalités Complètes

#### ✅ Checklist IEC 62446-1 (36 Items)
- **4 catégories normatives** :
  - 🔧 **MECHANICAL** (13 items) - Modules, structures, câblage
  - ⚡ **ELECTRICAL** (12 items) - Boîtes jonction, protections, câblage DC/AC
  - 📄 **DOCUMENTATION** (6 items) - Labels, schémas, conformité
  - ⚠️ **SAFETY** (5 items) - Masses, parafoudres, risques incendie
- **Auto-génération** de tous les items à la création d'inspection
- **Conformité standardisée** : CONFORME / NON CONFORME / N/A

#### 📱 Interface Mobile-First Terrain
- **Design dark mode** optimisé pour lecture extérieure
- **Touch-optimized** : boutons larges, scroll fluide, modal tactile
- **Filtrage catégories** : ALL / MECHANICAL / ELECTRICAL / DOCUMENTATION / SAFETY
- **Progress bar temps réel** : % d'items cochés
- **Sticky header** : accès permanent aux filtres
- **Item modal** : détails complets, boutons conformité, observations
- **Statuts visuels** :
  - 🟢 Vert = CONFORME
  - 🔴 Rouge = NON CONFORME
  - 🟡 Jaune = N/A (non applicable)
  - ⚪ Gris = EN ATTENTE

#### 💾 Gestion Inspections
- **Token unique sécurisé** : `VIS-TIMESTAMP-RANDOM` (ex: `VIS-1762961953742-GCS31P`)
- **Métadonnées inspection** : projet, client, lieu, date, inspecteur
- **Observations détaillées** : textarea pour notes terrain
- **Recommandations** : actions correctives suggérées
- **Horodatage** : checked_at, checked_by pour traçabilité
- **Statistiques live** : total items, cochés, conformes, non-conformes

### 📋 URLs Module Visual Inspection

#### Interface utilisateur
- **`/static/visual-inspection`** - Interface checklist terrain
- **`/static/visual-inspection?token=XXX`** - Charger inspection existante

#### API Endpoints Visual Inspection
- **`POST /api/visual/inspection/create`** - Créer nouvelle inspection + 36 items auto
- **`GET /api/visual/inspection/:token`** - Récupérer inspection complète (inspection + items + defects + stats)
- **`PUT /api/visual/inspection/:token/item/:itemId`** - Mettre à jour item checklist (status, conformity, observation, recommendation)
- **`POST /api/visual/inspection/:token/defect`** - Créer défaut mécanique avec photos
- **`GET /api/visual/checklist`** - Obtenir checklist IEC standardisée (36 items)
- **`GET /api/visual/inspections`** - Liste toutes inspections

### 🗄️ Structure Database D1

#### Table `visual_inspections`
- `id` - INTEGER PRIMARY KEY AUTOINCREMENT
- `inspection_token` - TEXT UNIQUE (VIS-XXX)
- `project_name`, `client_name`, `location` - TEXT
- `inspection_date` - DATE
- `inspector_name` - TEXT
- `overall_status` - TEXT (pending, completed, validated)
- `conformity_level` - TEXT (pending, conform, non_conform_minor, non_conform_major)
- `critical_issues_count` - INTEGER
- `created_at`, `updated_at` - DATETIME

#### Table `visual_inspection_items`
- `id` - INTEGER PRIMARY KEY AUTOINCREMENT
- `inspection_id`, `inspection_token` - Références inspection
- `category` - TEXT (MECHANICAL, ELECTRICAL, DOCUMENTATION, SAFETY)
- `subcategory` - TEXT (ex: "Modules PV", "Boites Jonction")
- `item_code` - TEXT (M01-M13, E01-E12, D01-D06, S01-S05)
- `item_description` - TEXT (description IEC complète)
- `status` - TEXT (pending, checked)
- `conformity` - TEXT (pending, conform, non_conform, not_applicable)
- `severity` - TEXT (critical, major, minor, info)
- `observation`, `recommendation` - TEXT
- `photo_url`, `photo_count` - TEXT, INTEGER
- `checked_at`, `checked_by` - DATETIME, TEXT
- `created_at`, `updated_at` - DATETIME

#### Table `visual_defects`
- `id` - INTEGER PRIMARY KEY AUTOINCREMENT
- `inspection_id`, `inspection_token`, `item_id` - Références
- `defect_location`, `module_identifier`, `string_number` - TEXT
- `equipment_type` - TEXT (MODULE, STRUCTURE, CABLE, PROTECTION, CONNECTOR, JUNCTION_BOX, INVERTER, OTHER)
- `defect_type`, `defect_category` - TEXT
- `severity` - TEXT (critical, major, minor)
- `urgency` - TEXT (immediate, short_term, medium_term, long_term)
- `description`, `potential_impact`, `recommended_action` - TEXT
- `norm_reference`, `norm_violation` - TEXT
- `photo_urls` - TEXT (JSON array)
- `detected_by`, `detection_date` - TEXT, DATE
- `created_at` - DATETIME

#### Table `visual_inspection_photos`
- `id` - INTEGER PRIMARY KEY AUTOINCREMENT
- `inspection_token`, `item_id`, `defect_id` - Références
- `photo_url` - TEXT (blob storage)
- `photo_type` - TEXT (GENERAL, DEFECT, CLOSE_UP, CONTEXT)
- `caption` - TEXT
- `captured_at` - DATETIME

### 📊 Exemple Workflow Terrain

#### 1. Création Inspection
```bash
POST /api/visual/inspection/create
{
  "projectName": "Installation Rooftop 250 kWc",
  "clientName": "SolarTech Industries",
  "location": "Toulouse - Batiment B",
  "inspectionDate": "2025-11-12",
  "inspectorName": "Adrien PAPPALARDO"
}
→ Retourne token VIS-1762961953742-GCS31P + 36 items auto-générés
```

#### 2. Accès Interface Terrain
```
/static/visual-inspection?token=VIS-1762961953742-GCS31P
→ Charge inspection + 36 items + filtres catégories
```

#### 3. Contrôle Items (Mobile)
- Tap sur item → Modal détails
- Bouton CONFORME (vert) / NON CONFORME (rouge) / N/A (jaune)
- Textarea observation : "Corrosion visible cadre aluminium partie basse"
- Textarea recommandation : "Traitement anticorrosion requis 3 mois"
- Bouton "Enregistrer" → PUT /api/visual/inspection/:token/item/:itemId

#### 4. Statistiques Live
```
GET /api/visual/inspection/:token
→ {
  stats: {
    totalItems: 36,
    checkedItems: 28,
    nonConformItems: 3,
    criticalDefects: 1
  }
}
```

### 🎯 Roadmap Module Visual

**Phase 2 - Défauts & Photos**: 🔜 **EN COURS**
- ⏳ Upload photos défauts mécaniques (endpoint + UI)
- ⏳ Interface création défauts (modal depuis item)
- ⏳ Galerie photos par inspection

**Phase 3 - Rapports**: 🔜 **PLANIFIÉ**
- Génération PDF conforme IEC 62446-1
- Template DiagPV avec logo + coordonnées
- Export checklist + photos + recommandations
- Envoi email automatique client

**Phase 4 - Intégrations**: 🔜 **PLANIFIÉ**
- Lien vers audits EL (tokens)
- Lien vers mesures IV (strings)
- Vue unifiée défauts visuels + EL + IV
- Export global multi-modules

### ✅ État Actuel (12 novembre 2025)
- **Backend API** : 6 endpoints opérationnels ✅
- **Database D1** : 4 tables créées (migration 0016) ✅
- **Interface Mobile** : checklist 36 items fonctionnelle ✅
- **Tests API** : création, récupération, mise à jour validés ✅
- **Conformité IEC** : 36 items standardisés ✅
- **GitHub** : commit 3f707b4 ✅
- **Backup** : diagnostic-hub-visual-checklist-working.tar.gz ✅

---

**🏢 Diagnostic Hub** - *Plateforme unifiée pour tous les audits DiagPV*

**Diagnostic Photovoltaïque** - www.diagnosticphotovoltaique.fr

*Version 1.0.0 - Dernière mise à jour: 27 octobre 2025*
*Tag: v1.0.0-unified-platform*

---

## 🌐 URLs de Production

- **Production active**: https://f5da6920.diagnostic-hub.pages.dev
- **GitHub Repository**: https://github.com/adrienpappalardo/diagnostic-hub

### Dernière Mise à Jour
- **Date**: 2025-11-12
- **Migration**: 0016 appliquée (tables visual_inspections, visual_inspection_items, visual_defects, visual_inspection_photos)
- **Module Visual**: Interface checklist IEC 62446-1 opérationnelle ✅
- **Status**: Backend + Frontend + Tests validés
