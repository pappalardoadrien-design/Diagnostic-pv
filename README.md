# HUB DIAGNOSTIC PHOTOVOLTAÏQUE

## Résumé Exécutif
**Suite complète d'outils professionnels pour diagnostics photovoltaïques conformes aux normes IEC 62446-1, IEC 60904-1, DIN EN 62446-3, NFC 15-100.**

Système unifié développé par **Diagnostic Photovoltaïque** pour audits terrain, commissioning indépendant et expertise post-sinistre avec traçabilité normative complète.

## URLs Production
- **🎯 HUB PRINCIPAL**: https://1393212e.diagnostic-hub.pages.dev
- **📂 Gestion Projets**: https://1393212e.diagnostic-hub.pages.dev/page-projects
- **➕ Nouveau Projet**: https://1393212e.diagnostic-hub.pages.dev/page-new-project
- **🛰️ Module EL + Carte Satellite**: https://1393212e.diagnostic-hub.pages.dev/page-module-el
- **🌡️ Module Thermographie**: ⏳ En développement professionnel
- **⚡ Module Courbes I-V**: ⏳ En développement professionnel  
- **🔌 Module Tests Isolement**: ⏳ En développement professionnel
- **👁️ Module Contrôles Visuels**: ⏳ En développement professionnel
- **🔍 Module Expertise Post-Sinistre**: ⏳ En développement professionnel
- **📡 API Projets**: https://1393212e.diagnostic-hub.pages.dev/api/projects
- **📊 Stats Temps Réel**: https://1393212e.diagnostic-hub.pages.dev/api/dashboard/stats
- **👥 API Clients**: https://1393212e.diagnostic-hub.pages.dev/api/clients
- **👤 API Utilisateurs**: https://1393212e.diagnostic-hub.pages.dev/api/users

## 6 Modules Opérationnels

### 1. **Électroluminescence** ✅ INTÉGRATION DYNAMIQUE + 🔄 RECTANGLE ORIENTABLE
- **Route**: `/modules/electroluminescence` (DiagPV Audit intégré dans HUB)
- **Interface**: Iframe intégré avec dashboard temps réel + synchronisation bidirectionnelle
- **Normes**: IEC 62446-1, IEC 61215
- **🆕 NOUVEAU : Rectangle Orientable SolarEdge-Style**:
  - **Rotation 0-360°** : Handle central pour orienter rectangle selon angle toiture
  - **Calepinage orienté** : Grille modules respecte l'angle du rectangle
  - **Rendu rectangles PV** : Modules affichés comme vrais panneaux orientés (plus de markers)
  - **Calculs trigonométriques** : Placement modules avec précision GPS
  - **Designer satellite** : Recherche adresse + carte haute résolution Esri
- **🧪 INTÉGRATION AUDIT → DESIGNER (en développement parallèle)**:
  - **Fichier séparé** : `src/index-with-audit.tsx` (version prod intacte)
  - **Mode hybride** : Configuration manuelle OU chargement depuis audit
  - **IDs modules réels** : Modules avec vrais IDs (S1-1, S2-3, etc.) depuis audit
  - **Statut défauts** : Rectangles colorés (vert=OK, rouge=défaut)
  - **Support strings variables** : JALIBAT = 10 strings (S1=26 modules, S2-S10=24)
  - **Documentation** : Voir [INTEGRATION_AUDIT.md](./INTEGRATION_AUDIT.md) pour tests
  - **Status** : 🧪 Prêt pour validation - non déployé en production
- **Fonctionnalités Intégrées**: 
  - Dashboard temps réel (modules/défauts/progression/conformité)
  - Communication cross-origin avec module DiagPV existant
  - Sauvegarde automatique base HUB (interventions + mesures EL)
  - Notifications push automatiques lors détection défauts
  - Export données JSON compatible autres modules HUB
  - Synchronisation bidirectionnelle données audit ↔ HUB
  - **📐 Voir détails techniques** : [RECTANGLE_ORIENTABLE.md](./RECTANGLE_ORIENTABLE.md)

### 2. **Thermographie** ✅ OPÉRATIONNEL
- **Route**: `/modules/thermography`
- **Normes**: DIN EN 62446-3
- **Interface**: Cartographie thermique temps réel, grille 10x10 modules
- **Modes**: Drone/Sol/Détaillé
- **Mesures**: Tmax, Tmin, Tmoy, ΔT avec seuils programmables
- **Fonctionnalités**: Détection automatique points chauds, corrélation météo
- **Actions**: Export données, planification repassage, envoi client

### 3. **Courbes I-V** ✅ OPÉRATIONNEL
- **Route**: `/modules/iv-curves`
- **Normes**: IEC 60904-1, IEC 60891  
- **Interface**: Graphiques Chart.js temps réel, paramètres électriques live
- **Types**: Courbes sombres, référence, STC corrigées
- **Paramètres**: Isc, Voc, Imp, Vmp, Pmax, Fill Factor affichage temps réel
- **Analyse**: Comparaison vs courbes constructeur avec % écart
- **Actions**: Sauvegarde, rapport PDF, string suivant

### 4. **Tests Isolement** ✅ OPÉRATIONNEL  
- **Route**: `/modules/isolation`
- **Normes**: NFC 15-100
- **Interface**: Mesures temps réel, progression test, historique
- **Tests**: DC/AC isolement, continuité avec tensions 500V/1000V
- **Conformité**: Validation automatique seuils NFC 15-100 (> 1MΩ)
- **Conditions**: Température/humidité enregistrées
- **Actions**: Certificat NFC, rapport PDF, planification recontrôle

### 5. **Contrôles Visuels** ✅ OPÉRATIONNEL
- **Route**: `/modules/visual` 
- **Normes**: IEC 62446-1
- **Interface**: Checklist interactive, galerie photos, synthèse défauts
- **Catégories**: Mécanique, électrique, sécurité, environnemental
- **Criticité**: Classification automatique Mineur/Majeur/Critique
- **Actions**: Capture photos annotées, plan d'actions, suivi planifié
- **Documentation**: Photos géolocalisées avec estimation coûts

### 6. **Expertise Post-Sinistre** ✅ OPÉRATIONNEL
- **Route**: `/modules/expertise`
- **Interface**: Déclaration sinistre, évaluation dommages, conclusions expert
- **Types**: Grêle, incendie, tempête, foudre, vol/vandalisme
- **Évaluation**: Calculs automatiques pertes (kWh/an, €/an)
- **Analyses**: Intégration multi-modules (EL + thermographie + I-V + visuel)
- **Judiciaire**: Rapport contradictoire, envoi assurance, planification réparation

## Architecture Technique

### Data Models (D1 SQLite)
```sql
-- 12 Tables principales --
users                    // Équipe DiagPV (admin, technician, manager)
clients                  // Base clients 
projects                 // Installations PV
interventions            // Missions terrain
modules                  // Configuration physique
el_measurements          // Mesures électroluminescence  
thermal_measurements     // Données thermographie
iv_measurements          // Courbes I-V
isolation_tests          // Tests isolement
visual_inspections       // Contrôles visuels
post_incident_expertise  // Expertises sinistre
reports                  // Rapports générés
```

### Services Cloudflare
- **Cloudflare D1**: Base données globale (SQLite distribuée)
- **Cloudflare Pages**: Hébergement edge avec Workers
- **Cloudflare Workers**: API backend serverless
- **Edge Computing**: Latence < 50ms mondial

### Stack Technique
- **Backend**: Hono TypeScript + Cloudflare Workers
- **Frontend**: Vanilla JS + TailwindCSS + FontAwesome
- **Base de données**: Cloudflare D1 (SQLite)
- **Déploiement**: Wrangler CLI + Cloudflare Pages
- **APIs**: REST + JSON, CORS enabled
- **Sécurité**: Edge SSL/TLS, tokens sécurisés

## Guide Utilisateur

### 1. **Accès Initial**
- Navigation : `diagnostic-hub.pages.dev`
- Interface : 6 modules diagnostic accessibles
- Responsive : Optimisé tablet/mobile terrain

### 2. **Gestion Équipe**
- **Utilisateurs** : Admin/Manager/Technicien
- **Certifications** : N1/N2/N3 (IEC 62446-1)
- **Affectations** : Missions par technicien

### 3. **Projets/Clients**
- **Clients** : SIRET, contacts, historique
- **Installations** : Puissance, matériel, géolocalisation
- **Modules** : Configuration physique (rangée/colonne)

### 4. **Interventions Terrain**
- **Planification** : Calendrier interventions
- **Conditions** : Météo, irradiance, température
- **Types** : Audit N1/N2/N3, commissioning, expertise

### 5. **Rapports Professionnels**
- **Génération** : Automatisée post-mesures
- **Normes** : Templates conformes IEC/NFC/DIN
- **Export** : PDF professionnel DiagPV
- **Livraison** : < 5 jours (standard DiagPV)

## Déploiement & Configuration

### Environnement Local
```bash
# Installation
cd /home/user/diagnostic-hub
npm install
npm run db:migrate:local
npm run db:seed

# Développement  
pm2 start ecosystem.config.cjs  # Port 3000
curl http://localhost:3000/api/users

# APIs disponibles
/api/users          // Équipe DiagPV
/api/clients        // Base clients
/api/projects       // Installations (GET + POST)
/api/projects/sync  // 🆕 Synchronisation LocalStorage → D1
/api/interventions  // Missions
/api/modules        // Configuration physique
```

### Production Cloudflare
```bash
# Authentification
setup_cloudflare_api_key

# Base données
wrangler d1 create diagnostic-hub-production
wrangler d1 migrations apply diagnostic-hub-production --remote

# Déploiement
npm run build
wrangler pages deploy dist --project-name diagnostic-hub
```

### Sécurité & Accès
- **API CORS** : Activé pour développement
- **D1 Bindings** : Base production sécurisée
- **Edge Workers** : Isolation runtime complète
- **SSL/TLS** : Cloudflare SSL automatique

## Statut Déploiement
- **Statut**: ✅ PRODUCTION CLOUDFLARE PAGES - Déploiement Réussi
- **HUB Principal**: ✅ https://1393212e.diagnostic-hub.pages.dev
- **Plateforme**: Cloudflare Pages (Edge Network Global)
- **Build System**: Vite + @hono/vite-cloudflare-pages plugin
- **Gestion Projets**: ✅ Création/Consultation projets fonctionnelle
- **🆕 Interface Synchronisation**: ✅ Boutons sync + notifications + feedback visuel
- **🆕 Auto-Sync**: ✅ Synchronisation automatique à 100% progression audit
- **Synchronisation Données**: ✅ Endpoint POST /api/projects/sync + UI complète
- **Module EL + Rectangle Orientable**: ✅ Designer satellite + rectangles rotatifs + modules PV orientés
- **Rectangle Orientable**: ✅ Rotation 0-360° + handle drag + grille orientée + rendu rectangles PV
- **Fonctionnalités Carte**: ✅ Géolocalisation GPS + recherche adresse + positionnement réel + imagerie Esri
- **Conservation Données**: ✅ 100% données audit existantes préservées (JALIBAT, LES FORGES, ARKOUA-BONNAUD-DEMO)
- **Page Projects**: ✅ Affichage hybride D1 (vert ✅) + LocalStorage (orange 🔶)
- **Système Notifications**: ✅ Toast animées + feedback temps réel
- **Modules 2-6**: ⏳ Temporairement désactivés (en développement professionnel)
- **API Fonctionnelle**: ✅ 8/8 routes testées et validées (GET/POST projets, stats, clients, users)
- **Dernière MAJ**: 2025-10-23 (Déploiement Cloudflare Pages + Configuration Vite ESM)
- **Version**: 3.0.0 (Production Cloudflare Pages + Build Optimisé)
- **Performance**: < 50ms edge latency mondiale, 259 kB worker bundle
- **Backup System**: ✅ LocalStorage + IndexedDB + Cloudflare D1 + Emergency API + Auto-Sync + UI Complete
- **GitHub Repository**: ✅ https://github.com/pappalardoadrien-design/Diagnostic-pv.git (Commit 078cf98)

## Prochaines Actions Recommandées

### ✅ **TERMINÉ - Interface Synchronisation** (v2.8.0)
- ✅ Bouton "Synchroniser Tout" dans page projects
- ✅ Boutons individuels par projet non synchronisé
- ✅ Système de notifications toast animées
- ✅ Auto-sync automatique quand audit = 100%
- ✅ Feedback visuel (spinners, check, badges)
- ✅ Affichage hybride D1 + LocalStorage

### ✅ **TERMINÉ - Déploiement Production Cloudflare** (v3.0.0)
- ✅ Configuration Vite avec plugin @hono/vite-cloudflare-pages
- ✅ Build optimisé (_worker.js 259 kB)
- ✅ Déploiement Cloudflare Pages réussi
- ✅ Migrations D1 appliquées en production (15 tables, 152 rows seed data)
- ✅ Tests complets : 8/8 routes API validées
- ✅ GitHub synchronisé (commit 078cf98)
- ✅ Backup projet créé (1.9 MB)
- ✅ URL production active : https://1393212e.diagnostic-hub.pages.dev

### 1. **Tests Utilisateurs & Feedback** (Priorité Haute)
- Valider fonctionnement synchronisation en conditions réelles
- Tester charge utilisateur (multiple clients simultanés)
- Vérifier performance edge network < 50ms
- Collecter feedback terrain équipe DiagPV

### 2. **Intégration Mobile** (Priorité Haute)
- PWA complète pour usage terrain nocturne
- Synchronisation offline/online automatique  
- GPS intégré pour géolocalisation mesures
- Camera API pour capture photos défauts

### 3. **Automatisation Rapports** (Priorité Moyenne)
- Templates PDF normatifs IEC/NFC/DIN
- Signature électronique certifiée
- Envoi automatique clients (< 5 jours)
- Génération depuis données D1 synchronisées

### 4. **Dashboard Analytics** (Priorité Moyenne)
- KPI temps réel (interventions/mois, défauts détectés)
- ROI client quantifié (kWh/€ économisés)
- Performance équipe (certifications/missions)
- Graphiques évolution projets

### 5. **Extensions Techniques**
- **API météo** : Conditions optimales mesures
- **IoT sensors** : Irradiance/température temps réel
- **IA prédictive** : Détection précoce dégradations
- **Sync bidirectionnel** : D1 → LocalStorage (multi-devices)

---

**Contact**: www.diagnosticphotovoltaique.fr  
**Expertise**: Audits N1-N3, Commissioning, Post-Sinistre  
**Normes**: IEC 62446-1, IEC 60904-1, DIN EN 62446-3, NFC 15-100