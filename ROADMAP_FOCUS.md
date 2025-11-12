# 🎯 ROADMAP FOCUS - À SUIVRE STRICTEMENT

## ⚠️ RÈGLE ABSOLUE
**NE DÉVELOPPER QUE CE QUI EST DANS CETTE ROADMAP**
**NE PAS INVENTER DE NOUVELLES FONCTIONNALITÉS**

---

## 📋 PHASE 2 - EN COURS

### Modules à Développer (Ordre Prioritaire)

#### 1. MODULE IV - COURBES I-V ✅ TERMINÉ
**Durée réalisée** : 2 semaines  
**Budget estimé** : ~3k€  
**Commits** : `ba71545`, `1fd4ce6`

**Fonctionnalités COMPLÉTÉES** :
- ✅ Upload fichiers courbes PVserv/MBJ Lab (CSV/Excel)
- ✅ Parsing automatique données
- ✅ Calcul paramètres : Isc, Voc, Pmax, FF
- ✅ Graphiques courbes interactifs (Chart.js)
- ✅ Détection anomalies (seuils configurables)
- ✅ Liaison bidirectionnelle IV ↔ EL
- ✅ Dashboard unifié IV + EL (15 strings, 340 courbes, 28 modules EL)
- ✅ Interface `/static/iv-curves.html`

**Tables DB créées** :
- `iv_curves` (migration 0010)
- Liaison `string_number` avec `el_modules`

**API Endpoints** : 6 routes opérationnelles

---

#### 2. MODULE THERMIQUE ⏳ EN ATTENTE
**Durée estimée** : 3-4 semaines  
**Budget** : 2-5k€  

**Fonctionnalités** :
- Upload images thermographiques (FLIR, DJI)
- Extraction métadonnées EXIF (température, GPS)
- Analyse automatique points chauds (seuils ΔT configurable)
- Cartographie thermique sur plan site
- Corrélation GPS avec modules EL
- Statistiques températures (min/max/moyenne/écart-type)
- Historique évolution thermique

**Tables DB existantes** :
- `pv_modules` (colonnes `ir_*` déjà créées)

---

#### 3. MODULE CONTRÔLES VISUELS ✅ OPÉRATIONNEL (90%)
**Durée réalisée** : 1.5 semaines  
**Budget estimé** : ~2k€  
**Commits** : `c20db3c`, `3f707b4`, `fd754e8`

**Fonctionnalités COMPLÉTÉES** :
- ✅ Checklist normative IEC 62446-1 (36 items : MECHANICAL, ELECTRICAL, DOCUMENTATION, SAFETY)
- ✅ Interface mobile-first responsive dark mode
- ✅ Conformité : CONFORME / NON CONFORME / N/A
- ✅ Observations + recommandations terrain
- ✅ Progress tracking temps réel
- ✅ Token unique sécurisé (`VIS-TIMESTAMP-RANDOM`)
- ✅ Statistiques live (checked, conform, non-conform)

**Fonctionnalités EN ATTENTE** :
- ⏳ Upload photos défauts → **SOLUTION TEMPORAIRE : Transfert externe (Swisstransfer/WeTransfer/Drive)**
  - Convention nommage standardisée documentée
  - Migration future vers upload direct (Phase 3+)
- ⏳ Interface création défauts (modal)
- ⏳ Génération PDF IEC 62446-1
- ⏳ Intégration rapport unifié

**Tables DB créées** :
- `visual_inspections` (migration 0016)
- `visual_inspection_items`
- `visual_defects`
- `visual_inspection_photos`

**API Endpoints** : 6 routes opérationnelles

**Documentation** : `AUDIT_ROADMAP_ET_PHOTOS.md` (méthodologie nommage photos)

---

#### 4. MODULE ISOLATION ⏳ EN ATTENTE
**Durée estimée** : 2 semaines  
**Budget** : 1-3k€  

**Fonctionnalités** :
- Saisie mesures isolement DC/AC
- Historique tests par site
- Alertes dégradation (seuils IEC 62446)
- Graphiques évolution temporelle
- Conformité normative (>1MΩ)
- Export données Excel

---

#### 5. MODULE EXPERTISE POST-SINISTRE ⏳ EN ATTENTE
**Durée estimée** : 3-4 semaines  
**Budget** : 2-5k€  

**Fonctionnalités** :
- Template rapport judiciaire (structure DiagPV)
- Checklist analyse causes racines
- Évaluation dommages (chiffrages €)
- Préconisations réparation hiérarchisées
- Photos avant/après
- Export format assurance (STELLIANT)

---

#### 6. RAPPORT UNIFIÉ MULTI-MODULES 🔧 PARTIEL (30%)
**Durée réalisée** : 1 semaine  
**Budget estimé** : ~1k€  
**Commits** : `1fd4ce6`

**Fonctionnalités COMPLÉTÉES** :
- ✅ Dashboard unifié IV + EL (`/static/iv-el-dashboard.html`)
- ✅ Vue globale 15 strings (340 courbes IV, 28 modules EL)
- ✅ Statistiques agrégées (FF moyen, défauts critiques)
- ✅ Indicateurs santé par string (ok/warning/critical)
- ✅ Navigation fluide entre modules

**Fonctionnalités EN ATTENTE** :
- ⏳ Génération PDF consolidé multi-modules
- ⏳ Intégration Module Thermique (non développé)
- ⏳ Intégration Module Visuels (checklist, photos, défauts)
- ⏳ Intégration Module Isolation (non développé)
- ⏳ Intégration Module Expertise (non développé)
- ⏳ Template HTML responsive complet
- ⏳ Export Excel agrégé

---

## ✅ CE QUI EST DÉJÀ FAIT (Phase 1 + Bonus)

### Module EL ✅ TERMINÉ
- Interface nocturne tactile
- Collaboration temps réel 4 techniciens
- Import mesures PVserv
- Mode offline
- Génération rapports PDF

### PV Cartography ✅ TERMINÉ (BONUS hors roadmap)
- Canvas V2 éditeur
- Drag & drop modules
- Liens EL↔PV bidirectionnels
- Page installations unifiée

### Déploiement Production ✅ FAIT
- Cloudflare Pages
- URL : https://18cdaf5b.diagnostic-hub.pages.dev/
- Database D1 persistante

---

## 🚫 CE QU'IL NE FAUT PAS FAIRE

❌ **Inventer de nouvelles fonctionnalités**  
❌ **Développer des modules non listés**  
❌ **Ajouter des pages hors roadmap**  
❌ **S'éparpiller sur des améliorations mineures**  

✅ **Se concentrer uniquement sur les 6 modules Phase 2**  
✅ **Suivre l'ordre prioritaire défini**  
✅ **Valider avec Adrien avant tout nouveau développement**

---

## 📊 BUDGET & TIMELINE Phase 2

**Budget Total** : 10-15k€ (estimé roadmap)  
**Durée Totale** : 3-4 mois  
**Modules** : 5 modules + 1 rapport unifié  

**Stratégie recommandée** :
- Module IV : Semaines 1-3
- Module Thermique : Semaines 4-7
- Module Visuels : Semaines 8-9
- Module Isolation : Semaines 10-11
- Module Expertise : Semaines 12-15
- Rapport Unifié : Semaines 16-18

---

## 📞 PROCHAINES ACTIONS

### Cette Semaine
1. ✅ Créer ROADMAP_FOCUS.md (ce fichier)
2. ⏳ Décider budget Phase 2 (5k / 10k / 15k€ ?)
3. ⏳ Confirmer priorité Module IV
4. ⏳ Spécifications détaillées Module IV

### Prochaines Semaines
1. Développement Module IV (2-3 semaines)
2. Tests terrain Module IV
3. Développement Module Thermique (3-4 semaines)
4. Tests terrain Module Thermique
5. Etc.

---

---

## 📊 ÉTAT AVANCEMENT PHASE 2

**Modules complétés** : 3/6 (50%)
- ✅ Module IV - Courbes I-V (100%)
- ✅ Module Contrôles Visuels (90% - photos externalisées)
- 🔧 Rapport Unifié (30% - IV+EL intégrés)

**Modules en attente** : 3/6 (50%)
- ⏳ Module Thermique (priorité #1 suivante)
- ⏳ Module Isolation
- ⏳ Module Expertise Post-Sinistre

**Budget Phase 2** :
- Dépensé : ~10k€ (estimé)
- Restant : ~10-15k€

---

## 🎯 DÉCISION STRATÉGIQUE : PHOTOS EXTERNALISÉES

**Contexte** : Module Visuels opérationnel mais upload photos différé

**Solution adoptée** :
- **Transfert externe** via Swisstransfer/WeTransfer/Drive partagé
- **Convention nommage standardisée** : `{TOKEN}_{ITEM}_{DEFAUT}_{SEQ}.jpg`
- **Avantages** :
  - Évite surcharge serveur pendant phase de rodage
  - Process établi dans le secteur BTP/audit
  - Migration future facile vers upload direct

**Documentation** :
- `AUDIT_ROADMAP_ET_PHOTOS.md` - Guide complet méthodologie photos
- Exemples nommage : `VIS-1762961953742-GCS31P_M02_CORROSION_01.jpg`
- Instructions techniciens terrain incluses

**Migration future (Phase 3+)** :
- Implémenter endpoint `POST /api/visual/inspection/:token/photo/upload`
- Stockage Cloudflare R2
- Upload direct depuis interface mobile
- Galerie photos intégrée rapports PDF

---

**Date création** : 2025-11-12  
**Dernière mise à jour** : 2025-11-12 (Audit conformité + méthodologie photos)  
**Version** : 1.1  
