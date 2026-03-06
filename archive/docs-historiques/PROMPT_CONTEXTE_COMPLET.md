# PROMPT CONTEXTE - Diagnostic Hub (DiagPV)

## INSTRUCTIONS POUR L'IA

Tu es l'assistant technique du projet **Diagnostic Hub**, la plateforme unifiée de **Diagnostic Photovoltaïque** (www.diagnosticphotovoltaique.fr). Ce document te donne tout le contexte nécessaire pour comprendre le projet, son état actuel et les prochaines étapes.

---

## 1. PRÉSENTATION DU PROJET

### Qu'est-ce que Diagnostic Hub ?

**Diagnostic Hub** est une webapp professionnelle pour réaliser des audits techniques de centrales photovoltaïques. Elle permet aux techniciens terrain de :

1. **Gérer les clients et projets** (CRM intégré)
2. **Cartographier les centrales PV** (positionnement GPS des modules sur carte satellite)
3. **Réaliser des audits Électroluminescence (EL)** (diagnostic nocturne des modules)
4. **Importer des courbes I-V** (mesures électriques)
5. **Générer des rapports PDF professionnels** normés IEC 62446

### Stack Technique

| Composant | Technologie |
|-----------|-------------|
| **Backend** | Hono (TypeScript) sur Cloudflare Workers |
| **Frontend** | Vanilla JS + Tailwind CSS (CDN) |
| **Base de données** | Cloudflare D1 (SQLite distribué) |
| **Stockage fichiers** | Cloudflare R2 |
| **Cartographie** | Leaflet.js + Esri Satellite |
| **Build** | Vite 6.3 |
| **Déploiement** | Cloudflare Pages |

### URLs de Production

- **App principale** : https://diagnostic-hub.pages.dev
- **Dashboard** : https://diagnostic-hub.pages.dev/dashboard
- **CRM Clients** : https://diagnostic-hub.pages.dev/crm/clients
- **Centrales PV** : https://diagnostic-hub.pages.dev/pv/plants
- **GitHub** : https://github.com/pappalardoadrien-design/Diagnostic-pv

---

## 2. ARCHITECTURE MODULAIRE

```
diagnostic-hub/
├── src/
│   ├── index.tsx                    # Point d'entrée principal + pages HTML
│   └── modules/
│       ├── crm/                     # ✅ CRM (Clients/Projets/Contacts)
│       │   ├── routes.ts
│       │   └── types.ts
│       ├── pv/                      # ✅ Cartographie PV (Centrales/Zones/Modules)
│       │   └── routes/
│       │       ├── plants.ts        # CRUD centrales + zones
│       │       ├── el-links.ts      # Liaison PV ↔ EL
│       │       ├── export.ts        # Export GeoJSON/KML/CSV
│       │       ├── inverters.ts     # Gestion onduleurs
│       │       └── structures.ts    # Structures support
│       ├── el/                      # ✅ Électroluminescence
│       │   ├── routes/
│       │   │   ├── audits.ts        # CRUD audits EL
│       │   │   ├── modules.ts       # Gestion modules EL
│       │   │   └── dashboard.ts     # Dashboard EL
│       │   └── types/
│       ├── iv-curves/               # ✅ Courbes I-V
│       │   ├── routes.ts
│       │   ├── parsers/             # Parsers PVserv (TXT/Excel)
│       │   └── calculators/
│       ├── interconnect/            # ✅ Liaison inter-modules
│       │   ├── index.ts             # API diagnostic
│       │   ├── sync.ts              # Sync EL → PV
│       │   └── sync-reverse.ts      # Sync PV → EL
│       ├── planning/                # ✅ Planning interventions
│       ├── girasole/                # ✅ Mission GIRASOLE (54 centrales)
│       ├── isolation/               # 🔜 Tests d'isolement
│       ├── thermal/                 # 🔜 Thermographie
│       └── custom-report/           # ✅ Rapports personnalisés
├── migrations/                      # 53 migrations SQL D1
├── public/
│   └── static/
│       └── diagpv-audit.js          # JS audit terrain (mode sombre)
└── ecosystem.config.cjs             # Config PM2
```

---

## 3. MODULES FONCTIONNELS

### 3.1 Module CRM (✅ Production)

**Fonctionnalités :**
- Gestion clients (CRUD complet)
- Gestion projets liés aux clients
- Gestion contacts par client
- Dashboard unifié avec KPIs

**Routes API :**
```
GET/POST      /api/crm/clients
GET/PUT/DEL   /api/crm/clients/:id
GET           /api/crm/clients/:id/projects
GET           /api/crm/clients/:id/audits
POST/PUT/DEL  /api/crm/contacts/:id
GET/POST      /api/crm/projects
```

**Pages UI :**
- `/crm/clients` - Liste clients
- `/crm/clients/create` - Créer client
- `/crm/clients/detail?id=X` - Détail client
- `/crm/projects` - Liste projets
- `/crm/dashboard` - Dashboard CRM

---

### 3.2 Module PV Cartography (✅ Production)

**Fonctionnalités :**
- Gestion centrales PV (nom, client, localisation)
- Gestion zones/strings par centrale
- Positionnement GPS des modules sur carte satellite
- Éditeur V3 avec fond satellite haute résolution
- Import plan de calepinage
- Liaison bidirectionnelle avec audits EL
- Export GeoJSON/KML/CSV (IEC 62446-1)

**Routes API :**
```
GET/POST      /api/pv/plants
GET/PUT/DEL   /api/pv/plants/:id
GET/POST      /api/pv/plants/:plantId/zones
PUT/DEL       /api/pv/plants/:plantId/zones/:zoneId
GET/POST      /api/pv/plants/:plantId/zones/:zoneId/modules
PUT/DEL       /api/pv/plants/:plantId/zones/:zoneId/modules/:moduleId
PUT           /api/pv/plants/:plantId/zones/:zoneId/config
PUT           /api/pv/plants/:plantId/zones/:zoneId/roof
GET           /api/pv/plants/:plantId/zones/:zoneId/el-link
POST          /api/pv/plants/:plantId/zones/:zoneId/el-link
```

**Pages UI :**
- `/pv/plants` - Liste centrales
- `/pv/plant/:id` - Détail centrale + zones + audits EL liés
- `/pv/plant/:id/carto` - **Cartographie multi-strings** (sélection multiple)
- `/pv/plant/:id/import-plan` - Import plan de calepinage
- `/pv/plant/:plantId/zone/:zoneId/editor/v3` - **Éditeur V3** (principal)

---

### 3.3 Module Électroluminescence EL (✅ Production)

**Fonctionnalités :**
- Création audit avec configuration (strings × modules)
- Interface terrain nocturne (thème sombre)
- Diagnostic 6 états par module (OK, Inégalité, Microfissures, HS, String ouvert, Non raccordé)
- Collaboration temps réel (4 techniciens max)
- Mode offline avec sync différée
- **Reconnaissance vocale** pour commentaires (micro)
- Génération rapport PDF avec plan de calepinage
- Import mesures PVserv

**Routes API :**
```
POST          /api/el/audit/create
POST          /api/el/audit/create-from-json
GET           /api/el/audit/:token
PUT           /api/el/audit/:token
PUT           /api/el/audit/:token/configuration
DELETE        /api/el/audit/:token
POST          /api/el/audit/:token/module/:moduleId
POST          /api/el/audit/:token/bulk-update
GET           /api/el/audit/:token/report
POST/GET      /api/el/audit/:token/notes
GET           /api/el/dashboard/audits
GET           /api/el/dashboard/overview
```

**Pages UI :**
- `/audits/create` - Créer audit EL
- `/audit/:token` - **Interface terrain nocturne** (diagnostic modules)
- `/audit/:token/photos` - Photos audit

---

### 3.4 Module Courbes I-V (✅ Production)

**Fonctionnalités :**
- Upload fichiers PVserv (TXT/Excel)
- Parsing automatique mesures (Isc, Voc, Pmax, FF, Rds)
- Liaison avec audit EL (même token)
- Cross-report EL + IV

**Routes API :**
```
POST          /api/iv-curves/upload
GET           /api/iv-curves/:id
GET           /api/iv-curves/by-audit/:auditToken
GET           /api/iv-curves/audit/:auditToken/cross-report
GET           /api/iv-curves/string/:stringNumber/summary
DELETE        /api/iv-curves/:id
```

**Pages UI :**
- `/iv-curves` - Dashboard courbes I-V

---

### 3.5 Module Interconnect (✅ Production)

**Rôle :** Gérer les liaisons entre modules (CRM ↔ PV ↔ EL ↔ IV)

**Routes API :**
```
GET           /api/diagnostic/interconnect
GET           /api/interconnect/audit/:token/plant
POST          /api/interconnect/sync/el-to-pv
POST          /api/interconnect/sync/pv-to-el
```

---

## 4. BASE DE DONNÉES D1

### Tables Principales

```sql
-- CRM
clients (id, name, type, email, phone, address, city, country, notes)
contacts (id, client_id, name, email, phone, role, is_primary)
projects (id, client_id, name, location, description, status)

-- PV Cartography
pv_plants (id, plant_name, client_id, location, lat, lng, total_power_kwp, notes)
pv_zones (id, plant_id, zone_name, zone_type, module_count, total_power_wp, inverter_count, string_count, roof_polygon, roof_area_sqm, azimuth, tilt)
pv_modules (id, zone_id, module_identifier, string_number, position_in_string, latitude, longitude, power_wp, module_status, notes)

-- Électroluminescence
el_audits (id, audit_token, project_name, client_name, location, string_count, total_modules, modules_per_string, panel_power, inverter_count, plan_file_url, configuration_json, status)
el_modules (id, el_audit_id, audit_token, module_identifier, string_number, position_in_string, defect_type, severity_level, comment, physical_row, physical_col)

-- Courbes I-V
iv_curves (id, audit_token, el_audit_id, string_number, module_position, file_name, isc, voc, pmax, ff, rds, raw_data)

-- Liaison PV ↔ EL
pv_el_zone_links (id, pv_zone_id, pv_plant_id, el_audit_token, link_type, sync_direction, last_sync_at)
```

---

## 5. ÉTAT ACTUEL (Février 2026)

### Statistiques Production

| Métrique | Valeur |
|----------|--------|
| Clients CRM | 8 |
| Centrales PV | 10 |
| Audits EL | 17 |
| Liaisons EL↔PV | 45 |
| Migrations SQL | 53 |

### Centrale de Test : ALBAGNAC 2

| Élément | Valeur |
|---------|--------|
| ID | 12 |
| Client | Broussy Energie (ID 9) |
| Strings | **15** (A1 → A15) |
| Modules/string | **14** |
| Total modules | **210** |
| Puissance | 38.85 kWc |
| Token audit EL | `0fc03209-5862-46ad-b739-cfe45e880048` |

### Fonctionnalités Récentes (Janvier-Février 2026)

1. **Sélection multiple strings** sur cartographie (`/pv/plant/:id/carto`)
2. **Section Audits EL** sur page détail centrale
3. **Reconnaissance vocale** (micro) pour commentaires terrain
4. **Correction doublons textes** boutons modal EL
5. **API trim_modules_after** pour reconfigurer strings
6. **API force_add** pour ajouter modules à strings existants

---

## 6. PROCHAINES ÉTAPES PRIORITAIRES

### 6.1 Court Terme (Cette semaine)

| Priorité | Tâche | Statut |
|----------|-------|--------|
| 🔴 HIGH | Audit terrain ALBAGNAC 2 | En cours |
| 🔴 HIGH | Vérifier interface terrain mobile/tablette | À faire |
| 🟠 MED | Tester reconnaissance vocale sur Chrome mobile | À faire |
| 🟠 MED | Valider génération PDF rapport | À faire |

### 6.2 Moyen Terme (Février-Mars 2026)

| Priorité | Tâche | Détails |
|----------|-------|---------|
| 🔴 HIGH | Mode offline PWA | Service Worker + cache + sync différée |
| 🔴 HIGH | Interface tactile mobile-first | Boutons 60px, espacement 10px |
| 🟠 MED | Import photos EL depuis appareil | Upload + association module |
| 🟠 MED | Rapport PDF avec photos intégrées | html2pdf + layout pro |
| 🟢 LOW | Multi-langue (EN) | i18n fichiers JSON |

### 6.3 Long Terme (Q2 2026)

| Module | Fonctionnalité |
|--------|----------------|
| **Thermographie** | Import images IR + détection points chauds |
| **Tests isolation** | Parser Benning + rapport Megger |
| **Collaboration** | Multi-techniciens temps réel WebSocket |
| **IA Détection** | Picsellia integration pour défauts auto |

---

## 7. CONVENTIONS DE CODE

### Structure Fichiers

```typescript
// Route API type
app.get('/api/resource/:id', async (c) => {
  const { id } = c.req.param()
  const env = c.env as { DB: D1Database }
  
  const result = await env.DB.prepare(`
    SELECT * FROM table WHERE id = ?
  `).bind(id).first()
  
  return c.json({ success: true, data: result })
})
```

### Nommage

- **Tables** : snake_case pluriel (`pv_plants`, `el_modules`)
- **Colonnes** : snake_case (`string_number`, `position_in_string`)
- **Routes API** : `/api/module/resource/:param`
- **Pages UI** : `/module/page/:param`
- **Fichiers** : kebab-case (`pv-plant-detail.ts`)

### Commandes Utiles

```bash
# Build et déploiement
cd /home/user/diagnostic-hub && npm run build
cd /home/user/diagnostic-hub && npx wrangler pages deploy dist --project-name diagnostic-hub

# Base de données
cd /home/user/diagnostic-hub && npx wrangler d1 execute diagnostic-hub-production --local --command="SELECT * FROM el_audits LIMIT 5"

# Git
cd /home/user/diagnostic-hub && git add . && git commit -m "MESSAGE" && git push origin main
```

---

## 8. POINTS D'ATTENTION

### Limitations Cloudflare Workers

- **CPU** : 10ms (free) / 30ms (paid) par requête
- **Taille bundle** : 10MB max
- **Pas de Node.js natif** : Pas de `fs`, `path`, `crypto` node
- **Pas de WebSocket natif** : Utiliser Durable Objects ou SSE

### Bonnes Pratiques

1. **Toujours build avant test** : `npm run build`
2. **Timeout 300s pour npm** : `npm install`, `npm run build`
3. **Tuer port 3000** avant démarrage : `fuser -k 3000/tcp`
4. **PM2 pour daemon** : `pm2 start ecosystem.config.cjs`
5. **Vérifier routes** : `curl https://diagnostic-hub.pages.dev/api/...`

---

## 9. CONTEXTE MÉTIER

### Diagnostic Photovoltaïque (DiagPV)

- **Activité** : Expertise indépendante centrales PV depuis 2012
- **Coordonnées** : 3 rue d'Apollo, 31240 L'Union
- **Contact** : 05.81.10.16.59 / contact@diagpv.fr
- **Site** : www.diagnosticphotovoltaique.fr

### Types d'Audits

1. **Électroluminescence (EL)** : Inspection nocturne caméra EL (microfissures, cellules HS)
2. **Thermographie IR** : Caméra thermique (points chauds, diodes bypass)
3. **Courbes I-V** : Mesures électriques (Isc, Voc, Pmax, Fill Factor)
4. **Inspection visuelle** : Contrôle IEC 62446-1 (état modules, câblage)
5. **Tests d'isolement** : Megger (résistance isolation DC)

### Normes Référentes

- **IEC 62446-1** : Commissioning et maintenance PV
- **IEC 62446-3** : Inspection IR outdoor
- **IEC TS 63049** : Électroluminescence extérieure
- **IEC 61215** : Qualification modules
- **NF C 15-100** : Installations électriques BT

---

## 10. FICHIERS CLÉS

| Fichier | Rôle |
|---------|------|
| `src/index.tsx` | Point d'entrée + toutes les pages HTML |
| `src/modules/el/routes/audits.ts` | API audits EL |
| `src/modules/pv/routes/plants.ts` | API centrales PV |
| `src/modules/crm/routes.ts` | API CRM |
| `public/static/diagpv-audit.js` | JS interface terrain EL |
| `ecosystem.config.cjs` | Config PM2 |
| `wrangler.jsonc` | Config Cloudflare |

---

*Dernière mise à jour : 4 février 2026*
*Version : diagnostic-hub v2.0*
