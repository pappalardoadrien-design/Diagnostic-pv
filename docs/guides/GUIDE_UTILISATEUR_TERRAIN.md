# 🔋 DiagPV Audit EL - Guide Terrain (1 page)

**Version:** Phase 1 MVP Terrain  
**Public:** Techniciens DiagPV  
**Durée:** 2 minutes lecture

---

## 🚀 Démarrage Rapide

### **1. Créer un Nouvel Audit (30s)**

**URL:** `https://[domaine]/dashboard`

1. Cliquer **"Nouvel Audit EL"**
2. Renseigner:
   - Nom projet (ex: "JALIBAT")
   - Client
   - Localisation
   - Configuration:
     - Nombre de strings (ex: 10)
     - Modules par string (ex: 24)
3. Cliquer **"Créer Audit"**
4. **Noter le token** (ex: `jalibat-a4e19...`) → URL audit générée

---

### **2. Audit Terrain - Diagnostic Modules (90% du temps)**

**URL audit:** `https://[domaine]/audit/[TOKEN]`

#### **Navigation Rapide**

- **Vue grille:** Visualisation complète centrale (tous strings)
- **Clic module:** Ouvre diagnostic instantané
- **Raccourcis clavier:**
  - `→` Module suivant
  - `←` Module précédent
  - `Espace` Valider et suivant

#### **Diagnostic Module (10s/module)**

**4 actions rapides:**

1. **Photo EL** (optionnel)
   - Bouton "📷 Photo" → Upload image électroluminescence
   
2. **Statut diagnostic** (requis)
   - 🟢 **OK** - Aucun défaut (95% cas)
   - 🟡 **Microfissure** - Fissure mineure
   - 🔴 **HS (Dead)** - Module mort
   - 🟠 **Inégalité** - Cellules déséquilibrées
   - ⚫ **Critique** - Risque sécurité

3. **Notes** (optionnel)
   - Précisions techniques (ex: "Cellule C3 sombre")

4. **Validation**
   - Bouton **"Valider"** → Module suivant automatique
   - Progression temps réel affichée

---

### **3. Finalisation Audit (2 min)**

**Depuis page audit:**

1. Vérifier **barre progression = 100%**
2. Cliquer **"Finaliser Audit"**
3. Statut passe à **"Terminé"**
4. Rapport généré automatiquement

---

## 📊 Indicateurs Temps Réel

**Affichés en permanence:**
- **Progression:** X/242 modules (%)
- **Défauts détectés:** Compteurs par type
- **String actuel:** Navigation visuelle
- **Temps restant estimé:** Calcul automatique

---

## 🎯 Gains Terrain vs Excel

| Action | Excel (ancien) | DiagPV Tool | Gain |
|--------|----------------|-------------|------|
| Saisie 1 module | 45s | 5s | **-89%** |
| Audit 242 modules | 180 min | 20 min | **-89%** |
| Génération rapport | 60 min | 0 min | **-100%** |
| Risque erreur saisie | 15% | <1% | **-93%** |

**Total gain audit complet:** **-92% temps administratif**

---

## 🔥 Astuces Pro

### **Workflow Optimal**

1. **Préparation (5 min)**
   - Créer audit depuis bureau
   - Envoyer URL audit sur mobile/tablette terrain

2. **Terrain (20 min)**
   - Mode plein écran recommandé
   - Diagnostic module par module
   - Synchronisation automatique cloud

3. **Bureau (0 min)**
   - Rapport PDF généré automatiquement
   - Export Excel disponible
   - Aucune ressaisie requise

### **Mode Hors-Ligne (Futur)**
⏳ Phase 2 - Synchronisation différée disponible

---

## 📱 Accès Mobile

**Compatible:**
- ✅ Smartphone (iOS/Android)
- ✅ Tablette
- ✅ Ordinateur portable

**Connexion requise:** Oui (Phase 1)

---

## 🆘 Support Rapide

**Problème technique:**
- Rafraîchir page (F5)
- Vérifier connexion internet
- Token audit toujours valide (pas d'expiration)

**Contact:** [Email support DiagPV]

---

## 🏆 Bonnes Pratiques

✅ **Créer audit AVANT départ terrain**  
✅ **Noter token audit (backup papier)**  
✅ **Valider chaque module immédiatement**  
✅ **Photos EL pour défauts critiques uniquement**  
✅ **Finaliser audit à chaud (terrain ou retour)**

❌ **Ne pas créer plusieurs audits même projet**  
❌ **Ne pas sauter modules (progression séquentielle)**  
❌ **Ne pas attendre fin terrain pour saisir**

---

**🎯 Objectif:** Audit EL 242 modules en **20 minutes terrain** (vs 3h Excel)

**Feedback:** Votre retour améliore l'outil → NPS terrain attendu ≥8/10
