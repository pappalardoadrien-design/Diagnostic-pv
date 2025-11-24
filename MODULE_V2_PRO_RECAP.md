# 🎯 MODULE V2 PRO - Canvas Editor avec Rotation Gestuelle

## 📅 Date : 24 novembre 2025

## ✅ ÉTAT ACTUEL

### 🗂️ Fichiers principaux du Module V2 PRO

1. **Canvas Editor HTML** (Module principal)
   - `/public/static/pv/editor.html` (40KB)
   - Interface Canvas avec rotation gestuelle
   - Drag & Drop global de centrale
   - Upload image satellite
   - Modules colorés selon statuts EL

2. **Script Bouton PV CARTO** (Intégration audit EL)
   - `/public/static/el-pv-carto.js`
   - Créé automatiquement centrale PV depuis audit EL
   - Ouvre Canvas Editor dans nouvel onglet

3. **API Backend**
   - `/src/modules/pv/routes/api.ts`
   - POST `/api/pv/create-from-el-audit/:auditToken`
   - Synchronisation modules EL → PV
   - Création automatique plant + zone + modules

### 🎨 Fonctionnalités Canvas Editor

✅ **Canvas HTML5** avec fond satellite
✅ **Rotation gestuelle** (Ctrl+Clic+Glissé)
✅ **Drag & Drop global** de toute la centrale
✅ **Sélection multiple** (bouton "TOUT SÉLECTIONNER")
✅ **Modules rectangles** avec couleurs statuts :
   - 🟢 Vert = OK
   - 🟡 Jaune = Inégalité
   - 🟠 Orange = Microfissures
   - 🔴 Rouge = Impact cellulaire / HS
   - 🔵 Bleu = String ouvert
   - ⚫ Gris = Non connecté
✅ **Upload image fond** satellite
✅ **Grille auto** placement
✅ **Rotation manuelle** (bouton + slider 0-360°)
✅ **Export PDF** du plan
✅ **Sauvegarde layout** en base de données

### ⚠️ Fonctionnalités manquantes

❌ **Dessin de polygone toiture** (à ajouter)
   - Pas de fonctionnalité de dessin de polygone interactif
   - L'utilisateur ne peut pas tracer la zone toiture sur la carte

### 🔄 Workflow actuel

```
1. Audit EL (ex: JALIBAT 242 modules)
   ↓
2. Clic bouton "PV CARTO" 
   ↓
3. API crée automatiquement :
   - Centrale PV
   - Zone principale
   - Synchronise tous les modules EL → PV
   ↓
4. Ouvre Canvas Editor dans nouvel onglet
   ↓
5. Utilisateur peut :
   - Upload image satellite
   - Sélectionner tous les modules (TOUT SÉLECTIONNER)
   - Rotation gestuelle (Ctrl+Clic+Glissé)
   - Drag & Drop global pour positionner
   - Ajuster rotation individuelle
   - Sauvegarder layout
```

## 📊 Commits récents

```
cc51caf - feat: Module Canvas Editor V2 PRO complet + API création centrale PV depuis audit EL
593159c - fix: Bouton PV CARTO ouvre maintenant Canvas Editor (module V2 PRO)
78da607 - feat: Bouton PV CARTO dans audit EL - création automatique centrale + cartographie
d6a1781 - feat: Activation Leaflet.draw + connexion dynamique audit EL
```

## 🔗 Routes importantes

### Pages
- `/el` - Dashboard audits EL (avec bouton PV CARTO)
- `/pv/plants` - Liste centrales PV
- `/pv/plant/:plantId` - Détail centrale
- `/pv/plant/:plantId/zone/:zoneId/editor` - **Canvas Editor V2 PRO**
- `/pv/plant/:plantId/zone/:zoneId/designer` - Designer Satellite (Leaflet)

### API
- `POST /api/pv/create-from-el-audit/:auditToken` - Création centrale depuis audit EL
- `POST /api/pv/zones/:zoneId/sync-from-el` - Synchronisation modules
- `GET /api/pv/plants/:plantId/zones/:zoneId/modules` - Liste modules zone
- `POST /api/pv/zones/:zoneId/save-designer-layout` - Sauvegarde positions

## 🗄️ Base de données

### Tables principales
- `pv_plants` - Centrales photovoltaïques
- `pv_zones` - Zones dans les centrales (liées audit via audit_token)
- `pv_modules` - Modules individuels avec positions (pos_x_meters, pos_y_meters, rotation)
- `el_audits` - Audits électroluminescence
- `el_modules` - Modules EL avec statuts/défauts

### Mapping statuts EL → PV
```javascript
'microcracks', 'pid' → 'warning' (orange)
'dead_cell', 'hotspot', 'dead', 'string_open' → 'critical' (rouge)
'pending' → 'pending' (gris)
'ok' → 'ok' (vert)
```

## 📦 Déploiement

### Local (sandbox)
```bash
cd /home/user/webapp
npm run build
pm2 start ecosystem.config.cjs
```

### Production Cloudflare Pages
```bash
cd /home/user/webapp
npm run build
npx wrangler pages deploy dist --project-name diagnostic-hub
```

## 🎯 PROCHAINES ÉTAPES

### Priorité 1 : Ajouter dessin polygone toiture
- Intégrer bibliothèque dessin (Fabric.js ou Paper.js)
- Permettre tracer polygone sur Canvas
- Calculer surface polygone
- Contraindre placement modules dans polygone

### Priorité 2 : Tests et optimisations
- Tester avec JALIBAT (242 modules)
- Optimiser performances Canvas
- Améliorer UX rotation gestuelle

### Priorité 3 : Intégration complète
- Lien bidirectionnel Canvas ↔ Designer Satellite
- Export PNG/PDF du plan avec fond satellite
- Génération automatique rapport avec cartographie

## 📝 Notes techniques

- Canvas dimensions : 1200x800 px
- Module dimensions : 51x30 px (ratio 1.7:1)
- Échelle : 30 px = 1 mètre
- Rotation : 0-360° (sens horaire)
- Format sauvegarde : JSON avec positions en mètres

## 🔧 Dépendances
- Hono (backend)
- Cloudflare Workers/Pages
- Cloudflare D1 (SQLite)
- TailwindCSS (UI)
- FontAwesome (icônes)
- jsPDF (export PDF)

## 🌐 URLs de production

- **Production actuelle** : https://diagnostic-hub.pages.dev
- **GitHub** : https://github.com/pappalardoadrien-design/Diagnostic-pv
- **Branche** : main

---

**Dernière mise à jour** : 24 novembre 2025 17:15 UTC
**Commit** : cc51caf
