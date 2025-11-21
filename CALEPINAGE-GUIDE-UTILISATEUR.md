# 🗺️ Guide Utilisateur - Éditeur de Calepinage DiagPV

## 📋 Vue d'ensemble

L'**Éditeur de Calepinage** est un outil visuel pour créer et gérer les plans de câblage de vos installations photovoltaïques. Compatible avec tous les types d'audits (EL, I-V, diodes, thermographie, isolation, visuel).

## 🎯 Fonctionnalités principales

### ✏️ Éditeur visuel interactif
- **Drag & drop** : Glissez les modules depuis la sidebar vers le canvas
- **Snap to grid** : Positionnement automatique sur grille 20px
- **Zoom** : +/- pour zoomer/dézoomer, Reset pour réinitialiser
- **Multi-outils** : Sélection, Déplacement, Flèche, Zone

### 🎨 Outils de dessin

#### 👆 Outil Sélection (par défaut)
- Cliquer pour sélectionner un module
- Touche `Delete` pour supprimer l'élément sélectionné

#### ✋ Outil Déplacement
- Cliquer-glisser un module pour le repositionner
- Le module snap automatiquement à la grille

#### ➡️ Outil Flèche
- **1er clic** : Définir le point de départ (cercle rouge)
- **2ème clic** : Définir le point d'arrivée (crée la flèche)
- `Echap` : Annuler le dessin en cours
- Les flèches montrent le **sens du câblage DANS chaque string**

#### 🔲 Outil Zone
- **Cliquer-glisser** : Tracer un rectangle
- Minimum 40x40px
- `Echap` : Annuler le dessin en cours
- Les zones groupent visuellement les strings connectés

### 💾 Sauvegarde et export

#### Sauvegarder
- Bouton **💾 Sauvegarder** : Enregistre la configuration en base de données D1
- Le layout est lié au `projectId` (ex: JALIBAT-2025-001)
- Compatible avec le type de module (el, iv, diodes, etc.)

#### Export JSON
- Bouton **📤 Export JSON** : Télécharge la configuration en .json
- Permet la sauvegarde locale ou le partage
- Format réutilisable pour import futur

#### Tout effacer
- Bouton **🗑️ Tout effacer** : Réinitialise le canvas
- Demande confirmation avant suppression

## 🔗 Accès aux outils

### Depuis le rapport EL
Dans votre rapport d'audit EL, section **🗺️ Plan de Calepinage** :

1. **✏️ Éditeur de Plan** - Créer/modifier le plan
   - URL : `/api/calepinage/editor/[PROJECT_ID]?module_type=el`
   
2. **🗺️ Voir le Plan (SVG)** - Afficher le plan configuré
   - URL : `/api/calepinage/viewer/[PROJECT_ID]?module_type=el`
   - Format SVG vectoriel (zoom infini sans perte)
   - Couleurs dynamiques selon états EL

### Depuis l'API directe

```bash
# Éditeur
https://votre-app.pages.dev/api/calepinage/editor/JALIBAT-2025-001?module_type=el

# Viewer
https://votre-app.pages.dev/api/calepinage/viewer/JALIBAT-2025-001?module_type=el

# API REST
GET    /api/calepinage/layouts              # Liste tous les layouts
GET    /api/calepinage/layouts/:projectId   # Récupère un layout spécifique
POST   /api/calepinage/layouts              # Créer/mettre à jour layout
DELETE /api/calepinage/layouts/:projectId   # Supprimer layout
```

## 🎨 Codes couleur dans le viewer

Les modules sont colorés automatiquement selon leur état :

| Couleur | État | Defect Type |
|---------|------|-------------|
| 🟢 Vert | OK | Aucun défaut |
| 🟠 Orange | Microfissures | `microfissures` |
| 🩷 Rose | Impact cellulaire | `impact_cellulaire` |
| 🔴 Rouge | PID | `pid` |
| 🟣 Violet | Diode HS | `diode_hs` |
| ⚪ Gris | Non configuré | Module absent des données |

## 📐 Workflow recommandé

### Étape 1 : Configuration initiale (Éditeur)
1. Ouvrir l'éditeur : `/api/calepinage/editor/[PROJECT_ID]?module_type=el`
2. Dans la sidebar gauche, vous voyez tous les modules groupés par string
3. Glisser-déposer les modules sur le canvas pour reproduire la **disposition RÉELLE sur toiture**

### Étape 2 : Tracer les flèches de câblage
1. Sélectionner l'outil **➡️ Flèche**
2. Tracer les flèches pour **montrer le sens du câblage DANS chaque string**
3. Les flèches se positionnent automatiquement au-dessus des modules
4. Label "S1", "S2"... ajouté automatiquement

### Étape 3 : Définir les zones de câblage
1. Sélectionner l'outil **🔲 Zone**
2. Tracer des rectangles rouges pour grouper les strings connexes
3. Exemples : "Zone BJ1", "Zone Onduleur 1", etc.

### Étape 4 : Sauvegarder
1. Cliquer **💾 Sauvegarder**
2. Message de confirmation "✅ Layout sauvegardé avec succès"
3. Le plan est maintenant accessible via le viewer

### Étape 5 : Visualiser dans les rapports
1. Retourner dans le rapport EL
2. Cliquer **🗺️ Voir le Plan (SVG)**
3. Le plan s'affiche avec les **couleurs dynamiques** selon états EL
4. Exportable en PDF avec `Ctrl+P`

## 🔧 Cas d'usage avancés

### Multiple configurations par projet
- Vous pouvez créer plusieurs layouts en ajoutant un suffixe au projectId
- Ex: `JALIBAT-2025-001-AVANT`, `JALIBAT-2025-001-APRÈS`

### Réutiliser un layout existant
1. Export JSON depuis le projet A
2. Modifier le `projectId` dans le JSON
3. Importer via POST API dans le projet B

### Débugger un layout
1. Export JSON
2. Ouvrir dans un éditeur de texte
3. Vérifier les coordonnées `x`, `y` des modules
4. Corriger manuellement si nécessaire
5. Réimporter via POST API

## ⚠️ Limitations connues

### Canvas
- Taille maximale : 2400x1200px (configurable dans `viewBox`)
- Grid snap : 20px (optimal pour précision/usabilité)

### Modules
- Taille par défaut : 60x35px
- Pas de redimensionnement dynamique (pour l'instant)
- Identifiant unique requis (ex: S1-1, S2-24)

### Flèches
- Ligne droite uniquement (pas de courbes pour l'instant)
- Pas d'édition après création (supprimer + recréer)

### Zones
- Rectangles uniquement (pas de formes libres)
- Pas d'édition après création (supprimer + recréer)

## 🆘 Dépannage

### "Aucun plan de calepinage configuré"
**Cause** : Aucun layout sauvegardé pour ce projectId

**Solution** :
1. Cliquer sur **✏️ Créer le plan** dans le message d'erreur
2. Créer votre layout dans l'éditeur
3. Sauvegarder avec **💾**

### "Module déjà sur le canvas"
**Cause** : Vous tentez d'ajouter un module déjà présent

**Solution** :
1. Vérifier si le module est déjà placé (chercher visuellement)
2. Si besoin, utiliser l'outil **Déplacement** pour le repositionner

### Les couleurs ne s'affichent pas dans le viewer
**Cause** : Données EL absentes ou `defect_type` non configuré

**Solution** :
1. Vérifier que l'audit EL est complété
2. S'assurer que les modules ont un `defect_type` renseigné
3. Par défaut, modules sans données = gris

### Le viewer affiche un SVG vide
**Cause** : Layout sauvegardé mais aucun module/flèche/zone dedans

**Solution** :
1. Retourner dans l'éditeur
2. Ajouter au moins 1 module
3. Sauvegarder à nouveau

## 📞 Support

Pour toute question ou bug report :
- Contact : adrien@diagnosticphotovoltaique.fr
- Tél : 06 07 29 22 12

---

**Version** : 1.0.0  
**Date** : 2025-01-21  
**Auteur** : DiagPV - Diagnostic Photovoltaïque
