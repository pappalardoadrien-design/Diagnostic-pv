# 📝 Changelog - DiagPV Hub

Toutes les modifications notables de ce projet sont documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère à [Semantic Versioning](https://semver.org/lang/fr/).

---

## [4.0.0] - 2025-01-21 🎉 NOUVELLE VERSION MAJEURE

### 🆕 Ajouté - Système Calepinage Universel

#### Module Calepinage (`/src/modules/calepinage/`)
- **Éditeur visuel drag-and-drop** pour création plans de câblage
- **Outil Sélection** : Click pour sélectionner, Delete pour supprimer
- **Outil Déplacement** : Drag-and-drop modules avec snap-to-grid 20px
- **Outil Flèche** : Tracer flèches câblage (2 clics : start → end)
- **Outil Zone** : Tracer zones rectangulaires (click-drag)
- **Sauvegarde D1** : Persistance automatique configurations
- **Chargement automatique** : Restauration layouts existants
- **Export JSON** : Backup local des configurations
- **Zoom** : Controls +/- et reset view
- **Status bar** : Compteurs temps réel (modules, flèches, zones)
- **Escape key** : Annuler dessin en cours
- **Loading overlay** : Feedback visuel pendant sauvegarde

#### Viewer SVG Dynamique
- **Génération SVG vectoriel** avec zoom infini sans perte
- **Couleurs dynamiques EL temps réel** :
  - 🟢 Vert (#10b981) = OK
  - 🟠 Orange (#fb923c) = Microfissures
  - 🩷 Rose (#f472b6) = Impact cellulaire
  - 🔴 Rouge (#dc2626) = PID
  - 🟣 Violet (#7c3aed) = Diode HS
  - ⚪ Gris (#d1d5db) = Non configuré
- **Flèches câblage** avec SVG markers
- **Zones rectangulaires** avec bordures personnalisables
- **Légende automatique** des couleurs
- **Export PDF vectoriel** (Ctrl+P)
- **Message erreur friendly** si layout absent

#### API REST Complète
- `GET /api/calepinage/layouts` - Liste tous layouts (filtrable par module_type)
- `GET /api/calepinage/layouts/:projectId` - Récupère layout spécifique
- `POST /api/calepinage/layouts` - Créer/mettre à jour layout (upsert)
- `DELETE /api/calepinage/layouts/:projectId` - Supprimer layout
- `GET /api/calepinage/editor/:projectId?module_type=el` - Éditeur visuel
- `GET /api/calepinage/viewer/:projectId?module_type=el` - Viewer SVG

#### Base de données D1
- **Migration 0002** : Tables `calepinage_layouts`, `module_positions`, `calepinage_cables`, `calepinage_zones`
- **Migration 0003** : Colonnes JSON (`modules_json`, `arrows_json`, `zones_json`, `view_box_json`)
- **Index optimisés** sur `project_id` pour performance
- **Contraintes** : `project_id` UNIQUE, `layout_data` NOT NULL

#### Types TypeScript
- `ModuleType` : Enum supportant 6 types ('el' | 'iv' | 'diodes' | 'thermique' | 'isolation' | 'visual')
- `CalepinageLayout` : Structure complète layout
- `ModulePosition` : Coordonnées modules
- `WiringArrow` : Flèches câblage
- `CablingZone` : Zones rectangulaires
- `EditorMode` : États éditeur ('select' | 'move' | 'arrow' | 'zone')

#### Documentation
- **CALEPINAGE-GUIDE-UTILISATEUR.md** (280 lignes) : Guide utilisateur complet
- **CALEPINAGE-SYSTEM.md** (400 lignes) : Architecture technique détaillée
- **CALEPINAGE-IMPLEMENTATION-SUMMARY.md** (450 lignes) : Résumé implémentation
- **DEPLOYMENT-GUIDE.md** (310 lignes) : Guide déploiement production
- **LIVRAISON-FINALE.md** (320 lignes) : Document livraison client

#### Tests
- **test-calepinage.sh** : Script automatique 11 scénarios
  1. API Health Check
  2. Liste layouts
  3. Créer layout
  4. Récupérer layout
  5. Éditeur HTML
  6. Viewer SVG
  7. Update layout
  8. Vérifier update
  9. Delete layout
  10. Vérifier delete
  11. Viewer sans layout
- **Résultat** : 11/11 tests PASS ✅

#### Intégration
- **Module EL** : Liens éditeur/viewer dans rapports (section Plan de Calepinage)
- **README.md** : Section v4.0 ajoutée
- **Architecture** : Système universel réutilisable tous modules

### 🔧 Modifié

#### Module EL
- `/src/modules/el/routes/report-complete.ts` :
  - Section "Plan de Calepinage" mise à jour
  - Lien **✏️ Éditeur de Plan** vers `/api/calepinage/editor/:token?module_type=el`
  - Lien **🗺️ Voir le Plan (SVG)** vers `/api/calepinage/viewer/:token?module_type=el`
  - Suppression anciens liens hardcodés (`/api/el/calepinage-physical`, `/api/el/calepinage-grid`)

#### Application principale
- `/src/index.tsx` :
  - Import module calepinage
  - Route montée : `app.route('/api/calepinage', calepinageModule)`

### 🗑️ Déprécié

#### Routes EL obsolètes
- ~~`GET /api/el/calepinage-physical/:token`~~ → Remplacé par `/api/calepinage/editor`
- ~~`GET /api/el/calepinage-grid/:token`~~ → Remplacé par `/api/calepinage/viewer`

**Raison** : Plans hardcodés en TypeScript vs système visuel universel

### 🐛 Corrigé

#### Calepinage
- **Flèches de câblage** : Positionnement DANS strings (pas entre strings)
- **Colonnes D1** : `layout_data` remplie correctement (NOT NULL constraint)
- **SQL queries** : Utilisation `defect_type` au lieu de `status` (colonne inexistante)
- **Render function** : Ajout paramètre `auditToken` manquant

### 🔒 Sécurité
- Validation types TypeScript stricte
- Sanitization identifier modules
- Gestion erreurs complète (try-catch)
- Messages erreur sans leak info sensible

### ⚡ Performance
- Snap-to-grid optimisé (20px)
- Render canvas incrémental
- Index D1 sur `project_id`
- SVG généré < 1s
- JSON parsing optimisé

---

## [3.6.0] - 2025-01-20

### Ajouté
- **Plan de calepinage JALIBAT** : Configuration hardcodée 1×26 + 9×24 modules
- **Câblage serpentin** : Strings pairs inversés avec flèches verticales
- **Marqueurs croix bleues** sur modules défectueux
- **7 états couleur** : OK, Inégalité, Microfissures, Impact cellulaire, PID, String ouvert, Non raccordé

### Corrigé
- Suppression croix bleues (demande client)
- Optimisation disposition physique JALIBAT

---

## [3.5.0] - 2025-01-15

### Ajouté
- **Module Isolation** : Tests d'isolement électrique
- **Module Visuels** : Inspections visuelles terrain
- **Checklist GIRASOLE** : Conformité NF C 15-100 et toiture DTU 40.35

---

## [3.0.0] - 2024-12-01

### Ajouté
- **Module EL** : Électroluminescence avec gestion défauts
- **Module I-V** : Courbes I-V référence et sombres
- **Import PVserv** : Parser mesures électriques
- **CRM Clients & Sites** : Base de données clients

---

## [2.0.0] - 2024-10-01

### Ajouté
- **Planning & Attribution** : Gestion interventions sous-traitants
- **Ordres de mission PDF** : Génération automatique
- **Dashboard temps réel** : KPIs et statistiques

---

## [1.0.0] - 2024-08-01

### Ajouté
- **Architecture initiale** : Hono + Cloudflare Workers/Pages
- **Base D1** : Schéma initial audits/modules
- **Authentification** : Système users/roles (désactivé par défaut)

---

## Types de changements

- `Ajouté` : Nouvelles fonctionnalités
- `Modifié` : Changements fonctionnalités existantes
- `Déprécié` : Fonctionnalités bientôt supprimées
- `Supprimé` : Fonctionnalités supprimées
- `Corrigé` : Corrections de bugs
- `Sécurité` : Correctifs vulnérabilités

---

## Conventions commits

Ce projet utilise [Conventional Commits](https://www.conventionalcommits.org/fr/) :

- `feat:` Nouvelle fonctionnalité
- `fix:` Correction bug
- `docs:` Documentation uniquement
- `style:` Formatage (pas de changement code)
- `refactor:` Refactoring code
- `test:` Ajout/modification tests
- `chore:` Maintenance (build, CI, etc.)

---

**Auteur** : Adrien PAPPALARDO - Diagnostic Photovoltaïque  
**Développeur** : Claude Code Agent  
**License** : Propriétaire
