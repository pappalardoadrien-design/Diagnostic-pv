# 🗺️ CONFIGURATION GOOGLE MAPS API

## Objectif
Obtenir une clé API Google Maps pour afficher satellite haute résolution dans PV Cartography.

## Étapes de Configuration

### 1. Créer Compte Google Cloud
- Aller sur : https://console.cloud.google.com/
- Se connecter avec compte Google (ou créer un compte)
- Accepter les Termes & Conditions

### 2. Créer un Nouveau Projet
1. Cliquer sur le menu déroulant en haut "Sélectionner un projet"
2. Cliquer "NOUVEAU PROJET"
3. Nom du projet : `DiagPV-Cartography` (ou autre nom)
4. Cliquer "CRÉER"
5. Attendre quelques secondes que le projet soit créé

### 3. Activer l'API Maps JavaScript
1. Dans le menu hamburger (☰) à gauche, aller sur **"APIs et services" > "Bibliothèque"**
2. Rechercher : `Maps JavaScript API`
3. Cliquer sur "Maps JavaScript API"
4. Cliquer "ACTIVER"
5. Attendre quelques secondes l'activation

### 4. Créer une Clé API
1. Dans le menu hamburger, aller sur **"APIs et services" > "Identifiants"**
2. Cliquer "CRÉER DES IDENTIFIANTS" en haut
3. Sélectionner "Clé API"
4. Une clé API sera générée (format : `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX`)
5. **COPIER cette clé** immédiatement

### 5. Restreindre la Clé (Sécurité)
1. Cliquer sur l'icône ✏️ (modifier) à côté de la clé créée
2. Nom : `DiagPV-Maps-Key`
3. **Restrictions d'application** :
   - Cocher "Référents HTTP (sites web)"
   - Ajouter vos domaines autorisés :
     ```
     https://diagnostic-hub.pages.dev/*
     https://*.diagnostic-hub.pages.dev/*
     http://localhost:3000/*
     ```
4. **Restrictions relatives aux API** :
   - Sélectionner "Restreindre la clé"
   - Cocher uniquement :
     - ✅ Maps JavaScript API
     - ✅ Maps Static API (optionnel)
5. Cliquer "ENREGISTRER"

### 6. Configuration du Compte de Facturation
**⚠️ IMPORTANT** : Google Maps nécessite un compte de facturation même pour l'usage gratuit.

1. Aller sur **"Facturation"** dans le menu
2. Cliquer "ASSOCIER UN COMPTE DE FACTURATION"
3. Cliquer "CRÉER UN COMPTE DE FACTURATION"
4. Remplir informations :
   - Nom du compte : `DiagPV-Billing`
   - Pays : France
   - Devise : EUR
5. Ajouter **carte bancaire** (pas de débit si usage < 200$/mois)
6. Valider

### 7. Activer l'Essai Gratuit
- Google offre **300$ de crédits gratuits** pendant 90 jours
- Après l'essai :
  - **200$/mois GRATUITS** (crédit mensuel automatique)
  - Au-delà : facturation à l'utilisation

## 📊 Tarification Google Maps

### Usage Gratuit Mensuel (après essai)
- **28 000 chargements de carte** gratuits/mois
- **100 000 sessions Street View** gratuites/mois
- Équivaut à **200$ de crédit gratuit/mois**

### Coût Au-Delà du Gratuit
- **Maps JavaScript API** : 7$ pour 1000 chargements supplémentaires
- **Maps Static API** : 2$ pour 1000 images
- **Geocoding API** : 5$ pour 1000 requêtes

### Estimation Usage DiagPV
**Scénario typique** :
- 50 centrales PV
- 5 audits/mois (consultation cartographie)
- ~250 chargements de carte/mois

**Coût estimé** : **0€/mois** (largement sous les 28k chargements gratuits)

## 🔐 Sécurité de la Clé

### ✅ Bonnes Pratiques
1. **Ne JAMAIS committer la clé** dans le code Git
2. **Utiliser les restrictions de domaine** (voir étape 5)
3. **Surveiller l'usage** : Google Cloud Console > APIs & Services > Dashboard
4. **Définir des quotas** : Limiter à 1000 requêtes/jour par précaution

### Configuration dans DiagPV

**Option 1 : Variable d'environnement Cloudflare** (Recommandé)
```bash
# En production
npx wrangler pages secret put GOOGLE_MAPS_API_KEY --project-name diagnostic-hub

# En local (.dev.vars)
GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**Option 2 : Directement dans le code** (Moins sécurisé)
```javascript
// Dans index.tsx, route Canvas Editor
const GOOGLE_MAPS_API_KEY = '${c.env.GOOGLE_MAPS_API_KEY || "YOUR_KEY_HERE"}'
```

## 🚀 Utilisation dans DiagPV

Une fois la clé configurée, l'intégrer dans Canvas Editor :

```html
<!-- Leaflet avec tuiles Google Satellite -->
<script>
const map = L.map('map').setView([48.8566, 2.3522], 20)

L.tileLayer('https://{s}.google.com/vrt/lyrs=s&x={x}&y={y}&z={z}', {
  maxZoom: 22,
  subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
}).addTo(map)
</script>
```

**Note** : Cette approche utilise les tuiles Google sans clé API (gratuit, limitations inconnues).

**Avec clé API** (plus robuste) :
```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=drawing"></script>
```

## ℹ️ Ressources

- **Console Google Cloud** : https://console.cloud.google.com/
- **Documentation Maps API** : https://developers.google.com/maps/documentation/javascript
- **Tarification** : https://cloud.google.com/maps-platform/pricing
- **Surveillance usage** : https://console.cloud.google.com/google/maps-apis/metrics

## ⚠️ Points d'Attention

1. **Carte bancaire requise** même pour usage gratuit
2. **200$/mois gratuits** largement suffisants pour DiagPV
3. **Surveiller les quotas** si usage anormal
4. **Restrictions de domaine** activées pour sécurité

---

**🎯 Adrien, suis ce guide pour créer ta clé API. Une fois obtenue, envoie-moi la clé et je l'intégrerai dans le Canvas Editor. En attendant, je continue la refonte avec une solution sans clé (tuiles Google libres).**
