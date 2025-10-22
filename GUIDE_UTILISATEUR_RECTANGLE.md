# 🎯 Guide Utilisateur - Rectangle Orientable

## 📖 Introduction

Le **Rectangle Orientable** vous permet d'aligner précisément votre zone d'installation sur l'angle réel de la toiture visible sur l'imagerie satellite. Plus besoin de zones alignées uniquement Nord-Sud !

---

## 🚀 Utilisation Étape par Étape

### Étape 1 : Rechercher l'Adresse 🔍

1. **Aller sur Module EL** → Onglet "Designer Layout"
2. **Rechercher adresse** :
   ```
   Exemple : "JALIBAT à Castelmoron sur Lot"
   ```
3. La carte **zoom automatiquement** sur le site (niveau 19 - haute résolution)
4. Vous voyez maintenant la **vraie imagerie satellite** du bâtiment

---

### Étape 2 : Dessiner le Rectangle 🖊️

1. **Cliquer sur l'icône Rectangle** dans la barre d'outils Leaflet.draw (barre droite)
2. **Tracer un rectangle** englobant la toiture :
   - Clic 1 : Premier coin
   - Clic 2 : Coin opposé
   - Rectangle créé !

**Résultat :**
- Rectangle bleu apparaît sur la carte
- **Point bleu central** visible au centre du rectangle

---

### Étape 3 : Orienter le Rectangle 🔄

**🆕 NOUVEAU : Handle de Rotation**

1. **Saisir le point bleu central** avec la souris (cursor devient "grab")
2. **Drag (glisser) le point** autour du rectangle
3. Le rectangle **pivote en temps réel** pour suivre votre mouvement
4. **Aligner le rectangle** avec l'angle exact de la toiture visible sur la carte

**Astuce :**
- Faites un mouvement circulaire autour du centre
- Le rectangle suit votre souris
- Relâchez quand l'angle correspond à la toiture

**Notification :**
```
✅ Rectangle Orientable
Utilisez le point central bleu pour faire pivoter le rectangle
```

---

### Étape 4 : Vérifier l'Orientation ✅

1. **Cliquer sur le rectangle** pour ouvrir la popup
2. **Informations affichées** :
   ```
   Zone: draw_1729612345678
   Superficie: 0.05 ha
   Modules estimés: ~48
   Puissance: ~19.2 kWc
   Rotation: 45° (utilisez handle bleu)
   ```
3. Si l'angle ne convient pas → **Re-drag le handle bleu**

---

### Étape 5 : Placer les Modules ⚡

1. **Cliquer "Placer Modules"** dans la popup
2. **Confirmation affichée** :
   ```
   Placer 48 modules orientés à 45° ?
   Puissance: 19.2 kWc
   
   [OK] [Annuler]
   ```
3. **Cliquer OK**

**Résultat :**
- Tous les anciens modules sont effacés
- **48 rectangles PV bleus** apparaissent orientés à 45°
- Chaque rectangle = 1 module photovoltaïque
- **Labels A1, A2, A3...** centrés sur chaque module

---

### Étape 6 : Audit des Modules 🔍

1. **Cliquer sur un rectangle PV** (module)
2. **Popup informations** :
   ```
   Module A1
   Puissance: 400Wc
   Angle: 45°
   Dimensions: 2100×1040mm
   ```
3. **Définir statut audit** : OK / Defect EL / Thermo / I-V / Critical
4. **Sélection multiple** possible pour lots de modules

---

## 🎨 Rendu Visuel

### Rectangle Orientable
- **Couleur** : Bleu (#3b82f6)
- **Remplissage** : Semi-transparent (15%)
- **Handle rotation** : Point bleu central draggable
- **Bordure** : Ligne pleine 3px

### Modules PV
- **Forme** : Rectangles orientés (plus de markers simples)
- **Couleur** : Bleu clair (#60a5fa)
- **Remplissage** : Semi-transparent (40%)
- **Label** : Blanc avec bordure bleue (A1, A2...)
- **Taille** : Proportionnelle config (2100×1040mm par défaut)

---

## ⚙️ Configuration Modules

**Paramètres disponibles** :

1. **Longueur module** : 1650 - 2100 mm
2. **Largeur module** : 990 - 1040 mm
3. **Puissance module** : 230 - 500 Wc
4. **Espacement** : 0 - 50 mm

**Presets rapides** :
- 2009-2012 : 1650×990mm, 230Wc
- 2013-2017 : 1960×990mm, 300Wc
- 2018-2022 : 2000×1000mm, 400Wc
- 2023-2025 : 2100×1040mm, 500Wc

---

## 💾 Sauvegarde Automatique

**Système 4 niveaux** :

1. ✅ **LocalStorage** (instantané)
2. ✅ **IndexedDB** (backup local)
3. ✅ **Cloudflare D1** (cloud)
4. ✅ **Emergency API** (dernier recours)

**Données sauvegardées** :
```json
{
  "id": "A1",
  "lat": 44.402XXX,
  "lng": 0.489XXX,
  "angle": 45,
  "hasDefect": false,
  "timestamp": 1729612345678
}
```

**Récupération :**
- Rechargement page → modules restaurés automatiquement
- Export JSON disponible
- Données projet JALIBAT préservées ✅

---

## 🔧 Résolution Problèmes

### ❌ Rectangle ne pivote pas
**Solution :**
1. Vérifier que le **point bleu central** est visible
2. Essayer de **drag depuis le point bleu** (pas le rectangle)
3. Si problème persiste → Recharger page (F5)

### ❌ Modules apparaissent comme points (A1, A2...)
**Cause :** Ancien système markers
**Solution :**
1. Cliquer "Placer Modules" à nouveau
2. Anciens markers effacés → nouveaux rectangles PV créés

### ❌ Angle incorrect affiché
**Vérification :**
1. Cliquer rectangle → voir popup
2. Angle affiché = angle réel appliqué
3. Re-drag handle bleu pour ajuster

---

## 📊 Exemple Concret : JALIBAT Castelmoron

**Projet réel conservé** :

1. **Recherche** : "JALIBAT à Castelmoron sur Lot"
2. **Carte zoom** : Latitude 44.402, Longitude 0.489
3. **Rectangle dessiné** : Englobant toiture principale
4. **Orientation** : 45° pour suivre angle bâtiment
5. **Modules placés** : 48 panneaux 400Wc
6. **Puissance totale** : 19.2 kWc
7. **Données audit** : Défauts EL détectés préservés ✅

---

## 🎓 Bonnes Pratiques

### ✅ À FAIRE

- **Zoom max** avant de dessiner (niveau 19)
- **Orienter précisément** avec handle bleu
- **Vérifier angle** dans popup avant placement
- **Sauvegarder régulièrement** (auto + export JSON)
- **Tester rotation** plusieurs fois si besoin

### ❌ À ÉVITER

- Ne pas dessiner sans zoom suffisant
- Ne pas placer modules sans orienter d'abord
- Ne pas oublier d'exporter données périodiquement
- Ne pas fermer navigateur sans vérifier sauvegarde

---

## 📞 Support

**Problème technique ?**

1. **Console navigateur** : F12 → Console
2. **Logs disponibles** : Vérifier erreurs
3. **Backup automatique** : Données toujours sauvegardées

**Contact Adrien - Diagnostic Photovoltaïque :**
- 📧 Email : contact@diagnosticphotovoltaique.fr
- 🌐 Site : www.diagnosticphotovoltaique.fr
- 📱 Tél : [À compléter]

---

## 🎯 Résumé Rapide

```
1️⃣ Rechercher adresse → Zoom satellite
2️⃣ Dessiner rectangle → Outil Leaflet.draw
3️⃣ Drag point bleu → Orienter rectangle
4️⃣ Vérifier angle → Popup rectangle
5️⃣ Placer modules → Rectangles PV orientés
6️⃣ Auditer modules → Clic + statut
7️⃣ Export/Sauvegarde → Automatique
```

**Temps moyen par site :** 5-10 minutes ⏱️

---

**Version :** 2.6.0 - Rectangle Orientable  
**Date :** 2025-10-22  
**Statut :** ✅ Production Ready
