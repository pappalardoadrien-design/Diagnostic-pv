# 🎯 ROADMAP FOCUS - À SUIVRE STRICTEMENT

## ⚠️ RÈGLE ABSOLUE
**NE DÉVELOPPER QUE CE QUI EST DANS CETTE ROADMAP**
**NE PAS INVENTER DE NOUVELLES FONCTIONNALITÉS**

---

## 📋 PHASE 2 - EN COURS

### Modules à Développer (Ordre Prioritaire)

#### 1. MODULE IV - COURBES I-V ⏳ EN ATTENTE
**Durée estimée** : 2-3 semaines  
**Budget** : 2-5k€  

**Fonctionnalités** :
- Upload fichiers courbes PVserv/MBJ Lab (CSV/Excel)
- Parsing automatique données
- Calcul paramètres : Isc, Voc, Pmax, FF, Rs, Rsh
- Graphiques courbes interactifs (Chart.js)
- Détection anomalies (seuils IEC)
- Comparaison courbes référence
- Intégration rapport unifié

**Tables DB existantes** :
- `pv_modules` (colonnes `iv_*` déjà créées en migration 0009)

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

#### 3. MODULE CONTRÔLES VISUELS ⏳ EN ATTENTE
**Durée estimée** : 2 semaines  
**Budget** : 1-3k€  

**Fonctionnalités** :
- Checklist normative (NF C 15-100, IEC 62446-1, UTE C 15-712-1)
- Upload photos défauts (câblage, MC4, onduleur, structure)
- Annotations images (flèches, zones, texte)
- Scoring conformité automatique
- Section dédiée rapport PDF
- Export Excel conformité

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

#### 6. RAPPORT UNIFIÉ MULTI-MODULES ⏳ EN ATTENTE
**Durée estimée** : 2-3 semaines  
**Budget** : 2-5k€  

**Fonctionnalités** :
- Génération PDF consolidé (EL + IV + Thermique + Visuels + Isolation)
- Template HTML responsive
- Sections dynamiques (affichage si données présentes)
- Export Excel agrégé
- Statistiques globales site
- Graphiques comparatifs

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

**Date création** : 2025-11-12  
**Dernière mise à jour** : 2025-11-12  
**Version** : 1.0  
