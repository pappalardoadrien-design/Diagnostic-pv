# 📦 Guide d'Installation - Synchronisation Module EL → Hub

## 🎯 Objectif

Intégrer le système de synchronisation automatique dans ton projet **diagpv-audit** (iframe) pour que les audits remontent automatiquement vers le Hub DiagPV.

---

## 📋 Fichiers Fournis

Tu as maintenant **3 fichiers prêts à l'emploi** :

1. **`diagpv-sync.js`** → Script de synchronisation complet (13KB)
2. **`exemple-integration-sync.html`** → Exemple d'intégration fonctionnelle (13KB)
3. **`INSTALLATION_SYNC_GUIDE.md`** → Ce guide (tu es ici)

---

## 🚀 Installation en 3 Étapes

### Étape 1 : Copier le Script dans ton Projet

**Option A : Télécharger depuis GitHub**

1. Va sur ton repository GitHub : `https://github.com/pappalardoadrien-design/Diagnostic-pv`
2. Navigue vers le fichier `diagpv-sync.js`
3. Télécharge le fichier
4. Place-le dans ton projet `diagpv-audit` (ex: `/public/js/diagpv-sync.js`)

**Option B : Copier le contenu directement**

1. Ouvre le fichier `diagpv-sync.js` (dans ce repository)
2. Copie tout le contenu
3. Crée un nouveau fichier dans ton projet diagpv-audit
4. Colle le contenu

**Emplacement recommandé :**
```
diagpv-audit/
├── public/
│   ├── js/
│   │   ├── diagpv-sync.js    ← NOUVEAU FICHIER ICI
│   │   └── app.js             (ton code existant)
│   └── index.html
└── ...
```

---

### Étape 2 : Intégrer dans ton HTML

**A. Ajouter le script dans ton fichier HTML principal**

Trouve ton fichier HTML principal (probablement `/audit/{sessionId}` ou similaire) et ajoute :

```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>DiagPV Audit EL</title>
    <!-- Tes autres scripts et styles existants -->
</head>
<body>
    
    <!-- Ton contenu existant -->
    
    <!-- 🆕 AJOUTER À LA FIN, JUSTE AVANT </body> -->
    <script src="/js/diagpv-sync.js"></script>
    
</body>
</html>
```

**⚠️ Important :** Place le script `diagpv-sync.js` **APRÈS** tous tes autres scripts, mais **AVANT** la fermeture `</body>`.

---

**B. Ajouter le bouton de synchronisation**

**Option 1 : Bouton Simple**

```html
<!-- Dans ton header ou barre d'outils -->
<button 
    onclick="syncAuditToHub()" 
    class="btn-sync"
    style="background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); color: white; padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;"
>
    <i class="fas fa-sync-alt"></i>
    Synchroniser Hub
</button>
```

**Option 2 : Bouton Avancé avec Statut**

```html
<button 
    id="syncBtn"
    onclick="handleSyncClick()"
    class="btn-sync bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-2"
>
    <i class="fas fa-sync-alt"></i>
    <span>Sync Hub</span>
</button>

<script>
async function handleSyncClick() {
    const btn = document.getElementById('syncBtn');
    const text = btn.querySelector('span');
    
    btn.disabled = true;
    text.textContent = 'Synchronisation...';
    
    try {
        const result = await syncAuditToHub();
        console.log('✅ Sync réussie:', result);
    } catch (error) {
        console.error('❌ Erreur sync:', error);
    } finally {
        btn.disabled = false;
        text.textContent = 'Sync Hub';
    }
}
</script>
```

**Placement recommandé :** Dans ton header, à côté des autres boutons (ex: "Dashboard", "Modules", etc.)

---

### Étape 3 : Configuration (Optionnel)

**Si tu veux personnaliser le comportement :**

Ajoute ce script **APRÈS** l'inclusion de `diagpv-sync.js` :

```html
<script src="/js/diagpv-sync.js"></script>

<!-- Configuration personnalisée -->
<script>
    // Activer le mode debug pour voir les logs
    DiagPVSync.config.debugMode = true;
    
    // Désactiver la synchronisation automatique
    DiagPVSync.config.autoSyncOnComplete = false;
    
    // Changer le délai de sync automatique (millisecondes)
    DiagPVSync.config.autoSyncDelay = 5000; // 5 secondes
    
    // Désactiver les notifications
    DiagPVSync.config.showNotifications = false;
</script>
```

**Options disponibles :**
- `debugMode` : Afficher logs dans console (true/false)
- `autoSyncOnComplete` : Sync automatique si audit terminé (true/false)
- `autoSyncDelay` : Délai avant sync auto en ms (défaut: 2000)
- `showNotifications` : Afficher notifications utilisateur (true/false)

---

## 🧪 Test de l'Installation

### Test 1 : Vérifier que le Script est Chargé

1. Ouvre ton audit dans le navigateur
2. Ouvre la Console Développeur (F12)
3. Tape : `DiagPVSync`
4. Tu devrais voir : `{sync: ƒ, config: {...}, isSynced: ƒ, getSessionId: ƒ}`

✅ **Si tu vois cet objet → Le script est bien chargé !**

---

### Test 2 : Créer des Données Test

**Dans la console (F12) :**

```javascript
// Créer données test
const sessionId = '76e6eb36-8b49-4255-99d3-55fc1adfc1c9';
const testData = {
    projectName: 'Test Synchronisation',
    clientName: 'Client Test',
    clientEmail: 'test@example.com',
    siteAddress: 'Site Test',
    totalModules: 100,
    installedPower: 40,
    defectsFound: 2,
    conformityRate: 98,
    progress: 100
};

localStorage.setItem(`audit_${sessionId}`, JSON.stringify(testData));
console.log('✅ Données test créées');
```

---

### Test 3 : Tester la Synchronisation

**Option A : Via le bouton (recommandé)**
1. Clique sur le bouton "Synchroniser Hub"
2. Attends la notification de succès
3. Va sur `https://diagnostic-hub.pages.dev/projects`
4. Vérifie que le projet "Test Synchronisation" apparaît

**Option B : Via la console**

```javascript
// Test sync manuel
syncAuditToHub('76e6eb36-8b49-4255-99d3-55fc1adfc1c9')
    .then(result => console.log('✅ Sync OK:', result))
    .catch(error => console.error('❌ Erreur:', error));
```

**Résultat attendu dans la console :**
```javascript
✅ Sync OK: {
  projectId: 14,
  projectName: "Test Synchronisation",
  interventionId: 9,
  moduleCount: 100,
  defectsCount: 2,
  conformityRate: 98
}
```

---

### Test 4 : Vérifier dans le Hub

1. Va sur `https://diagnostic-hub.pages.dev/projects`
2. Tu devrais voir le projet "Test Synchronisation"
3. Clique dessus pour voir les détails
4. Vérifie que toutes les infos sont correctes

---

## 🛠️ Structure des Données LocalStorage

**Le script cherche les données dans cet ordre :**

### Format Standard (Recommandé)

```javascript
localStorage.setItem('audit_76e6eb36-8b49-4255-99d3-55fc1adfc1c9', JSON.stringify({
    // Identification
    projectName: 'Les Forges de Lanouée',
    clientName: 'ARKOLIA',
    clientEmail: 'contact@arkolia.fr',
    siteAddress: 'Les Forges de Lanouée',
    
    // Configuration
    totalModules: 220,
    installedPower: 88,      // kWc
    stringCount: 11,
    
    // Résultats
    defectsFound: 5,
    conformityRate: 97.7,    // %
    progress: 100,           // %
    
    // Métadonnées
    auditDate: '2025-10-24T12:00:00Z',
    technicians: ['Tech1', 'Tech2']
}));
```

### Champs Optionnels (Adaptabilité)

Le script est **intelligent** et accepte aussi ces variantes :

```javascript
{
    // Alternatives pour projectName
    projectName: 'Nom',        // Standard ✅
    siteName: 'Nom',           // OK
    
    // Alternatives pour totalModules
    totalModules: 220,         // Standard ✅
    moduleCount: 220,          // OK
    
    // Alternatives pour defectsFound
    defectsFound: 5,           // Standard ✅
    defects: [{...}, {...}],   // OK (compte length)
    anomalies: [{...}],        // OK (compte length)
    
    // Alternatives pour installedPower
    installedPower: 88,        // Standard ✅
    installedPowerKwc: 88,     // OK
    // Si absent → calcul automatique (modules × 0.4)
}
```

**Le script s'adapte automatiquement à ta structure de données existante !**

---

## 🔧 Dépannage

### Problème 1 : "Session ID introuvable"

**Cause :** L'URL ne contient pas le sessionId

**Solution :** Vérifie que ton URL est au format :
- ✅ `/audit/76e6eb36-8b49-4255-99d3-55fc1adfc1c9`
- ✅ `?sessionId=76e6eb36-8b49-4255-99d3-55fc1adfc1c9`

---

### Problème 2 : "Aucune donnée trouvée"

**Cause :** Rien dans localStorage pour cette session

**Solution :**

```javascript
// Vérifier ce qui est dans localStorage
console.log('LocalStorage keys:', Object.keys(localStorage));

// Chercher clé audit
const auditKeys = Object.keys(localStorage).filter(k => k.includes('audit'));
console.log('Audit keys:', auditKeys);
```

---

### Problème 3 : Erreur CORS

**Cause :** Le Hub refuse la requête depuis diagpv-audit.pages.dev

**Solution :** L'API Hub est déjà configurée pour accepter CORS. Si erreur persiste :

1. Vérifie l'URL de l'API : `https://diagnostic-hub.pages.dev/api/projects/sync`
2. Vérifie que tu utilises HTTPS (pas HTTP)

---

### Problème 4 : Bouton ne fait rien

**Solution :**

1. Ouvre Console (F12)
2. Regarde les erreurs JavaScript
3. Vérifie que `syncAuditToHub` existe :
   ```javascript
   console.log(typeof syncAuditToHub); // Doit afficher "function"
   ```

---

### Problème 5 : Données incorrectes dans le Hub

**Solution :** Vérifie le payload envoyé :

```javascript
// Activer mode debug
DiagPVSync.config.debugMode = true;

// Relancer sync → tu verras tous les logs dans console
syncAuditToHub();
```

---

## 📊 Exemple Complet Fonctionnel

**Tu peux tester le fichier `exemple-integration-sync.html` directement :**

1. Ouvre `exemple-integration-sync.html` dans un navigateur
2. Clique sur "Créer Données Test"
3. Clique sur "Sync Hub"
4. Vérifie le résultat dans la console log

**Cet exemple montre :**
- ✅ Comment intégrer le bouton
- ✅ Comment gérer les états (loading, succès, erreur)
- ✅ Comment afficher les logs
- ✅ Comment créer des données test

**Tu peux copier-coller ce code dans ton projet et l'adapter !**

---

## 🎯 Checklist Finale

Avant de déployer en production :

- [ ] ✅ Fichier `diagpv-sync.js` copié dans le projet
- [ ] ✅ Script inclus dans HTML principal
- [ ] ✅ Bouton synchronisation ajouté dans l'interface
- [ ] ✅ Test sync avec données test → OK
- [ ] ✅ Projet apparaît dans Hub → OK
- [ ] ✅ Notification succès affichée → OK
- [ ] ✅ Configuration personnalisée (si nécessaire)
- [ ] ✅ Mode debug désactivé (`debugMode: false`)
- [ ] ✅ Tests sur plusieurs audits → OK
- [ ] ✅ Déployé sur Cloudflare Pages

---

## 🚀 Déploiement

### Déployer sur Cloudflare Pages (diagpv-audit)

```bash
# 1. Build ton projet
npm run build

# 2. Déployer
npx wrangler pages deploy dist --project-name diagpv-audit

# 3. Tester l'URL production
curl https://diagpv-audit.pages.dev/audit/76e6eb36-8b49-4255-99d3-55fc1adfc1c9
```

---

## 📞 Support

**Si tu rencontres un problème :**

1. Active le mode debug : `DiagPVSync.config.debugMode = true`
2. Regarde les logs dans la console (F12)
3. Vérifie l'onglet Network → Requête POST vers `/api/projects/sync`
4. Copie l'erreur exacte

---

## ✅ Résultat Final

**Après installation complète, tu auras :**

1. ✅ **Bouton "Sync Hub"** visible dans l'interface EL
2. ✅ **Synchronisation automatique** quand audit terminé
3. ✅ **Notifications** visuelles (succès/erreur)
4. ✅ **Projets remontent automatiquement** dans le Hub
5. ✅ **Données techniques synchronisées** (modules, puissance, défauts)
6. ✅ **Interventions créées automatiquement** en base D1

**Tous tes audits seront maintenant centralisés dans le Hub DiagPV ! 🎉**

---

**Date création :** 2025-10-24  
**Version :** 1.0.0  
**Auteur :** DiagPV Assistant  
**Contact :** Adrien Pappalardo - Business Developer
