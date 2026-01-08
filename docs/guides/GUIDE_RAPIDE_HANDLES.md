# 🚀 Guide Rapide - Handles Interactifs

## ⚡ Démarrage 2 Minutes

### 1️⃣ Ouvrir Application
🔗 **URL:** https://3000-ihjl3q1cxb8r55v93w6w4-6532622b.e2b.dev

### 2️⃣ Naviguer vers PVCarto
- Dashboard → Plant → Zone → **Module PVCarto**

### 3️⃣ Créer Toiture (Étape 0)
- Cliquer **"ÉTAPE 0: DÉFINIR TOITURE"**
- Dessiner polygone jaune sur carte satellite
- Cliquer **"SAUVEGARDER TOITURE"**

### 4️⃣ Importer 242 Modules (Étape 2)
- Cliquer **"ÉTAPE 2: IMPORTER 242 MODULES (22x11)"**
- Confirmer → Rectangle bleu apparaît avec grille blanche

### 5️⃣ Activer Handles
- **Cliquer sur rectangle bleu**
- → Rectangle passe en **orange**
- → **5 handles** apparaissent:
  - 4 **carrés blancs** aux coins (resize)
  - 1 **cercle bleu** au centre (rotation)

---

## 🎮 Utilisation Handles

### 🔷 Resize (4 Coins Blancs)

```
┌──────────────┐  ← Drag coin = resize depuis ce coin
│ NW        NE │
│              │
│              │
│ SW        SE │
└──────────────┘
```

**Action:**
1. Cliquer et maintenir coin blanc (ex: coin haut-gauche NW)
2. Déplacer souris (agrandir/rétrécir)
3. Relâcher souris
4. → Modules **régénérés automatiquement**

**Résultat:**
- Rectangle redimensionné
- Grille blanche mise à jour
- 242 modules repositionnés

---

### 🔵 Rotation (Centre Bleu)

```
       ↑
       │
   ←───●───→  ← Drag centre + bouger souris = rotation
       │
       ↓
```

**Action:**
1. Cliquer et maintenir cercle bleu centre
2. Déplacer souris en cercle autour du centre
3. Observer rotation en temps réel
4. Relâcher souris
5. → Modules **régénérés avec rotation**

**Résultat:**
- Rectangle pivoté selon angle souris
- Grille modules alignée avec rotation
- Orientation modules mise à jour

---

## 🎨 Codes Couleurs

| Couleur | Signification |
|---------|---------------|
| 🔵 **Bleu** | Rectangle normal (inactif) |
| 🟠 **Orange** | Rectangle sélectionné (handles visibles) |
| ⚪ **Blanc** | Handles resize (coins) |
| 🔵 **Bleu circulaire** | Handle rotation (centre) |
| ⬜ **Grille blanche** | Séparation modules (22 colonnes × 11 lignes) |

---

## ⌨️ Interactions Rapides

### Sélectionner Rectangle
```
Clic sur rectangle bleu → Orange + handles
```

### Désélectionner Rectangle
```
Clic sur carte (hors rectangle) → Bleu + handles cachés
```

### Resize Rapide
```
Drag coin blanc → Redimensionnement temps réel
```

### Rotation Rapide
```
Drag centre bleu → Rotation fluide
```

### Dupliquer Rectangle
```
Clic rectangle → Popup → Bouton "Dupliquer"
```

### Supprimer Rectangle
```
Clic rectangle → Popup → Bouton "Supprimer"
```

---

## ✅ Checklist Rapide

### Avant de Commencer
- [ ] URL application ouverte
- [ ] Plant + Zone créés
- [ ] Coordonnées GPS valides (latitude/longitude)
- [ ] Module PVCarto accessible depuis menu

### Test Basique (2 minutes)
- [ ] Polygone toiture dessiné (jaune)
- [ ] 242 modules importés (rectangle bleu)
- [ ] Handles visibles après clic rectangle
- [ ] Resize coin fonctionne (drag blanc)
- [ ] Rotation centre fonctionne (drag bleu)
- [ ] Modules régénérés après transformation

### Validation Qualité
- [ ] Grille blanche visible (22×11)
- [ ] Overlay info affiche "242 modules"
- [ ] Pas d'erreurs console JavaScript (F12)
- [ ] Rectangle ne s'inverse pas lors resize
- [ ] Rotation fluide (pas de saccades)

---

## 🐛 Résolution Problèmes

### ❌ Handles ne s'affichent pas
**Solution:**
1. Vérifier rectangle sélectionné (couleur orange)
2. Recharger page (F5)
3. Vérifier console JavaScript (F12) pour erreurs

### ❌ Resize ne fonctionne pas
**Solution:**
1. Vérifier handles visibles (clic rectangle)
2. Essayer autre coin (NW, NE, SW, SE)
3. Recharger page si bloqué

### ❌ Rotation saccadée
**Solution:**
1. Ralentir mouvement souris
2. Vérifier performance navigateur (CPU < 80%)
3. Réduire zoom carte si nécessaire

### ❌ Modules non régénérés
**Solution:**
1. Attendre fin drag (relâcher souris)
2. Vérifier console logs "✅ Transform terminé"
3. Recharger page si persistant

### ❌ Rectangle disparaît
**Solution:**
1. Vérifier calque modules visible (panneau gauche)
2. Cliquer "AFFICHER TOUS LES MODULES"
3. Zoom in/out pour rafraîchir carte

---

## 📊 Performance Attendue

| Opération | Temps | Statut |
|-----------|-------|--------|
| **Import 242 modules** | < 1s | ✅ Optimisé |
| **Activation handles** | < 100ms | ✅ Instantané |
| **Resize coin (drag)** | Temps réel | ✅ Fluide |
| **Rotation centre** | Temps réel | ✅ Fluide |
| **Régénération modules** | < 200ms | ✅ Optimisé |

---

## 🎯 Cas d'Usage Réels

### Cas 1: Ajuster Toiture Compliquée
**Problème:** Toiture en L, modules ne rentrent pas
**Solution:**
1. Import 242 modules (rectangle standard)
2. Resize coins pour adapter forme L
3. Rotation si orientation non alignée
4. Duplication rectangle pour 2ème partie L

### Cas 2: Orientation Modules Non Standard
**Problème:** Toiture orientée 45° par rapport Nord
**Solution:**
1. Import 242 modules
2. Rotation centre 45° pour aligner avec toiture
3. Resize ajustements fins si nécessaire

### Cas 3: Plusieurs Zones Modules
**Problème:** Centrale avec 3 bâtiments distincts
**Solution:**
1. Import 242 modules sur bâtiment 1
2. Resize pour adapter surface disponible
3. Dupliquer rectangle → déplacer sur bâtiment 2
4. Resize rectangle 2 selon surface bâtiment 2
5. Répéter pour bâtiment 3

### Cas 4: Optimisation Disposition
**Problème:** Maximiser kWc installé sur toiture limitée
**Solution:**
1. Import 242 modules (position standard)
2. Rotation essais multiples (0°, 15°, 30°, 45°, 90°)
3. Resize pour ajuster aux bordures toiture
4. Comparer overlay info kWc pour chaque configuration

---

## 📈 Évolution Prochaines Versions

### Version Actuelle (v1.0)
- ✅ Sélection rectangle par clic
- ✅ Resize 4 coins biaisé
- ✅ Rotation centre visuelle
- ✅ Régénération modules automatique
- ✅ Grille blanche modules

### Version Future (v1.1 - Phase 2)
- 🔜 Configuration électrique (onduleurs/BJ/strings)
- 🔜 Auto-calcul config optimale
- 🔜 Sync données EL (couleurs modules)
- 🔜 Export PDF rapport avec cartographie

### Version Future (v1.2 - Optimisations)
- 🔜 Snap-to-grid alignement précis
- 🔜 Rotation incréments (15°, 30°, 45°)
- 🔜 Undo/Redo transformations
- 🔜 Raccourcis clavier (Delete, Ctrl+D)

---

## 🏆 Comparaison Concurrence

| Outil | Handles | Resize | Rotation | Sync EL | Prix |
|-------|---------|--------|----------|---------|------|
| **DiagPV (Nous)** | ✅ | ✅ | ✅ | 🔜 v1.1 | Inclus |
| **SolarEdge Designer** | ✅ | ✅ | ✅ | ❌ | Gratuit |
| **OpenSolar** | ✅ | ✅ | ✅ | ❌ | 49€/mois |
| **Fusion Solar** | ✅ | ✅ | ✅ | ❌ | Sur devis |

**🏆 Avantage DiagPV:** Seul outil avec audit électroluminescence intégré

---

## 📞 Support Rapide

**🔧 Commandes Dépannage:**
```bash
# Redémarrer service
cd /home/user/diagnostic-hub
npm run build
pm2 restart diagnostic-hub

# Vérifier logs
pm2 logs diagnostic-hub --nostream --lines 20

# Test local
curl http://localhost:3000
```

**📦 Backup Projet:**
https://page.gensparksite.com/project_backups/diagnostic-hub-handles-interactifs-v1.tar.gz

**📖 Documentation Complète:**
- `HANDLES_INTERACTIFS.md` - Architecture technique détaillée
- `TEST_HANDLES_INTERACTIFS.md` - 20 tests validation
- `RESUME_HANDLES_INTERACTIFS.md` - Résumé exécutif

---

## ⏱️ Temps Estimés

| Tâche | Temps | Détail |
|-------|-------|--------|
| **Première utilisation** | 5 min | Découverte interface + test basique |
| **Audit complet (242 modules)** | 10 min | Import + ajustements + validation |
| **Configuration multi-bâtiments** | 20 min | 3 bâtiments + optimisations |
| **Formation équipe** | 30 min | Demo + pratique supervisée |

---

## ✅ Validation Terrain

**5 Audits Tests Recommandés:**
1. **Audit simple:** Toiture rectangulaire standard
2. **Audit complexe:** Toiture en L ou T
3. **Audit rotation:** Toiture orientée 45° vs Nord
4. **Audit multi-zones:** Plusieurs bâtiments
5. **Audit optimisation:** Maximiser kWc sur surface limitée

**Critères Validation:**
- [ ] Temps audit < 15 min (vs 45 min manuel)
- [ ] Précision placement ± 5cm GPS
- [ ] UX satisfaisante ≥ 4/5
- [ ] Pas de bugs bloquants

---

**🚀 Prêt à Tester!**

**Prochaine étape:** Ouvrir URL et tester checklist basique (2 minutes)
