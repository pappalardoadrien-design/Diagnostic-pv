# 📐 Workflow Audit EL Complet - Documentation Technique

**Version:** Phase 1 MVP Terrain  
**Public:** Développeurs + Product Owner  
**Date:** 2025-11-06

---

## 🎯 Vue d'Ensemble

**Objectif:** Audit électroluminescence (EL) terrain pour centrales photovoltaïques  
**Gain temps:** -92% admin (180min Excel → 18min Tool)  
**Architecture:** Hono + Cloudflare Pages + D1 Database

---

## 🔄 Workflow Utilisateur (4 Phases)

### **Phase 1: Création Audit (Bureau - 2 min)**

**Actions:**
1. Clic "Nouvel Audit EL"
2. Formulaire configuration (projet, client, strings, modules)
3. Submit → Backend génère token UUID + structure base

**Résultat:** URL audit `/audit/{token}` prête pour terrain

---

### **Phase 2: Diagnostic Terrain (Site - 15-20 min)**

**Écran grille modules:** Vue complète centrale, navigation clic

**Modal diagnostic module:**
- Photo EL (optionnel)
- Statut diagnostic (OK, Microfissure, HS, Inégalité, Critique)
- Notes techniques (optionnel)
- Validation → Update API → Module suivant

**Raccourcis:** `→` suivant, `←` précédent, `Espace` valider+suivant

---

### **Phase 3: Finalisation Audit (Site/Bureau - 2 min)**

**Conditions:** Progression 100%, tous modules diagnostiqués

**Actions:**
- Clic "Finaliser Audit"
- Statut passe "completed"
- Rapport généré automatiquement

---

### **Phase 4: Exploitation Rapport (Bureau - 0 min)**

**Rapport contient:**
- Synthèse exécutive (stats globales)
- Analyse par string
- Modules défaillants (détail + photos)
- Recommandations hiérarchisées

**Exports:** PDF, Excel, ZIP photos EL

---

## 🗄️ Architecture Données

**Tables principales:**
- `el_audits` - Audits EL
- `el_modules` - Modules diagnostiqués

**Intégration PVCarto:**
- `pv_modules` contient colonnes EL natives
- Relations: `el_audits` → `pv_plants` → `pv_zones` → `pv_modules`

---

## 🔧 API Endpoints

1. **POST** `/api/el/audit/create` - Créer audit
2. **GET** `/api/el/audit/{token}` - Récupérer audit
3. **PUT** `/api/el/audit/{token}/module/{id}` - Update module
4. **PUT** `/api/el/audit/{token}/finalize` - Finaliser audit
5. **GET** `/api/el/dashboard/audits` - Liste audits

---

## ⚡ Performance Phase 1

**Mesures actuelles:**
- Dashboard: 26.4ms
- Audit 242 modules: 58ms
- Update module: <20ms

**Objectif:** <200ms ✅ **LARGEMENT DÉPASSÉ**

---

## 📊 KPIs Phase 1

| Métrique | Objectif | Actuel | Statut |
|----------|----------|--------|--------|
| API Réponse | <200ms | 26-58ms | ✅ |
| Audits réussis | ≥5 | 1 (JALIBAT) | ⏳ |
| NPS Techniciens | ≥8/10 | À collecter | ⏳ |
| Gain temps | -80% | À valider | ⏳ |

---

## 🚀 Évolutions Phase 2-3

**Phase 2:**
- Collaboration temps réel
- Mode hors-ligne
- Intégrations pvServe/MBJ Lab

**Phase 3:**
- IA détection défauts
- Marketplace audits
- Partenaires certifiés

---

**Documentation maintenue par:** DiagPV Dev Team  
**Dernière mise à jour:** 2025-11-06
