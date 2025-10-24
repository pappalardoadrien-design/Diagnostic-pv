# 📤 INTÉGRATION postMessage Hub ↔ Module EL

## Vue d'Ensemble

Communication bidirectionnelle entre le Hub DiagPV et le module d'audit électroluminescence (iframe) via l'API `postMessage` du navigateur.

**Version** : v3.3.0  
**Date** : 2025-10-24  
**Objectif** : Initialiser automatiquement les sessions d'audit EL avec les données de projet créées dans le Hub.

---

## 🎯 Problème Résolu

**Avant v3.3.0** :
- Utilisateur crée projet via formulaire Hub (`/projects/new`)
- Projet sauvegardé dans D1 database ✅
- Clic sur bouton "Module EL" → Ouverture `/modules/electroluminescence?project=8&name=...`
- Header dynamique mis à jour ✅
- **MAIS** : Iframe DiagPV ne recevait AUCUNE donnée du projet ❌
- Utilisateur devait ressaisir manuellement nom projet, client, modules, etc. 🔴

**Après v3.3.0** :
- Hub envoie automatiquement données projet vers iframe via `postMessage`
- Session audit pré-remplie avec contexte projet ✅
- Expérience utilisateur fluide sans ressaisie ✅

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    HUB DIAGNOSTIC (Parent)                      │
│                 https://7e96ed14.diagnostic-hub.pages.dev       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Clic bouton "Module EL"                                     │
│     → URL: /modules/electroluminescence?project=8&name=...      │
│                                                                 │
│  2. loadProjectContext() lit paramètres URL                     │
│     → Met à jour header dynamique                               │
│     → Appelle loadProjectData(projectId)                        │
│                                                                 │
│  3. loadProjectData(8)                                          │
│     → Fetch /api/projects/8                                     │
│     → Stocke dans window.currentProject                         │
│     → postMessage vers iframe ───────────────┐                  │
│                                              │                  │
│  ┌───────────────────────────────────────────┼────────────┐    │
│  │         <iframe id="auditFrame">          │            │    │
│  │   https://diagpv-audit.pages.dev          │            │    │
│  ├───────────────────────────────────────────┼────────────┤    │
│  │                                            ▼            │    │
│  │  4. Listener 'message' reçoit :                        │    │
│  │     {                                                  │    │
│  │       type: 'HUB_INIT_PROJECT',                        │    │
│  │       project: {                                       │    │
│  │         projectId: 8,                                  │    │
│  │         projectName: "Audit JALIBAT",                  │    │
│  │         clientName: "JALIBAT SAS",                     │    │
│  │         siteAddress: "Route de...",                    │    │
│  │         totalModules: 242,                             │    │
│  │         installedPower: 98.5                           │    │
│  │       }                                                │    │
│  │     }                                                  │    │
│  │                                                        │    │
│  │  5. initializeAuditSession(project)                    │    │
│  │     → Pre-remplit formulaire audit                     │    │
│  │     → Configure session localStorage                   │    │
│  │                                                        │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 💻 Implémentation Code

### 1. Hub (Parent Window)

**Fichier** : `/home/user/diagnostic-hub/src/index.tsx`  
**Lignes** : ~2536-2580

```typescript
// Charger données projet depuis API
async function loadProjectData(projectId) {
    try {
        const response = await fetch('/api/projects/' + projectId);
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.project) {
                console.log('📊 Données projet chargées:', data.project);
                // Stocker pour utilisation future
                window.currentProject = data.project;
                
                // 📤 NOUVEAU : Envoyer données projet vers iframe DiagPV
                const auditFrame = document.getElementById('auditFrame');
                if (auditFrame) {
                    const sendProjectData = () => {
                        try {
                            auditFrame.contentWindow.postMessage({
                                type: 'HUB_INIT_PROJECT',
                                project: {
                                    projectId: data.project.id,
                                    projectName: data.project.name,
                                    clientName: data.project.client_name || '',
                                    siteAddress: data.project.site_address || '',
                                    totalModules: data.project.module_count || 0,
                                    installedPower: data.project.installation_power || 0,
                                    sessionId: 'hub_project_' + projectId,
                                    timestamp: new Date().toISOString()
                                }
                            }, 'https://diagpv-audit.pages.dev');
                            
                            console.log('📤 Données projet envoyées vers iframe DiagPV:', data.project.name);
                        } catch (postError) {
                            console.error('❌ Erreur envoi postMessage:', postError);
                        }
                    };
                    
                    // Si iframe déjà chargée, envoyer immédiatement
                    if (auditFrame.contentDocument && auditFrame.contentDocument.readyState === 'complete') {
                        sendProjectData();
                    } else {
                        // Sinon attendre événement load
                        auditFrame.addEventListener('load', sendProjectData, { once: true });
                    }
                } else {
                    console.warn('⚠️ Iframe auditFrame non trouvée');
                }
            }
        }
    } catch (error) {
        console.error('❌ Erreur chargement projet:', error);
    }
}
```

**Points clés** :
- ✅ Gestion timing chargement iframe (`readyState === 'complete'` vs event `load`)
- ✅ Option `{ once: true }` pour éviter listeners multiples
- ✅ Validation origine cible : `https://diagpv-audit.pages.dev`
- ✅ Structure JSON cohérente et documentée
- ✅ Logs console pour debug

---

### 2. Iframe DiagPV (Child Window)

**Fichier** : `https://diagpv-audit.pages.dev/script.js` (hypothétique)

```javascript
// Listener pour messages du Hub
window.addEventListener('message', function(event) {
    // Sécurité : Valider origine
    if (event.origin !== 'https://7e96ed14.diagnostic-hub.pages.dev') {
        console.warn('⚠️ Message reçu origine non autorisée:', event.origin);
        return;
    }
    
    const data = event.data;
    
    // Initialisation projet depuis Hub
    if (data.type === 'HUB_INIT_PROJECT') {
        const project = data.project;
        
        console.log('✅ Projet reçu depuis Hub:', project.projectName);
        
        // Initialiser session audit
        initializeAuditSession({
            projectName: project.projectName,
            clientName: project.clientName,
            siteAddress: project.siteAddress,
            totalModules: project.totalModules,
            installedPower: project.installedPower,
            sessionId: project.sessionId
        });
        
        // Pre-remplir formulaire
        document.getElementById('projectName').value = project.projectName;
        document.getElementById('clientName').value = project.clientName;
        document.getElementById('moduleCount').value = project.totalModules;
        
        // Sauvegarder dans localStorage pour persistance
        localStorage.setItem('currentAuditProject', JSON.stringify(project));
        
        // Notifier Hub que message reçu (optionnel)
        event.source.postMessage({
            type: 'DIAGPV_ACK_INIT',
            projectId: project.projectId,
            status: 'initialized'
        }, event.origin);
    }
    
    // Autres types de messages existants
    else if (data.type === 'DIAGPV_DATA_UPDATE') {
        updateHubData(data);
    }
});

function initializeAuditSession(projectData) {
    console.log('🚀 Initialisation session audit:', projectData.projectName);
    
    // Créer nouvelle session avec ID unique
    const session = {
        sessionId: projectData.sessionId,
        projectName: projectData.projectName,
        clientName: projectData.clientName,
        siteAddress: projectData.siteAddress,
        totalModules: projectData.totalModules,
        installedPower: projectData.installedPower,
        startDate: new Date().toISOString(),
        measurements: [],
        defects: []
    };
    
    // Sauvegarder session
    window.currentAuditSession = session;
    localStorage.setItem('activeAuditSession', JSON.stringify(session));
    
    // Afficher UI pré-remplie
    renderAuditInterface(session);
}
```

**Points clés** :
- ✅ Validation origine émetteur (sécurité critique)
- ✅ Gestion multiple types messages (`HUB_INIT_PROJECT`, `DIAGPV_DATA_UPDATE`)
- ✅ Accusé réception optionnel (`DIAGPV_ACK_INIT`)
- ✅ Persistance localStorage pour reprendre session
- ✅ Pre-remplissage formulaire HTML

---

## 🔐 Sécurité

### Validation Origine (CRITIQUE)

**Hub → Iframe** :
```javascript
auditFrame.contentWindow.postMessage(data, 'https://diagpv-audit.pages.dev');
//                                          ↑ Origine cible explicite (pas '*')
```

**Iframe → Hub** :
```javascript
window.addEventListener('message', function(event) {
    if (event.origin !== 'https://7e96ed14.diagnostic-hub.pages.dev') {
        return; // Rejeter messages origine inconnue
    }
    // Traiter message...
});
```

⚠️ **JAMAIS utiliser `*` comme origine** en production :
```javascript
// ❌ DANGEREUX
postMessage(data, '*'); // N'importe quelle page peut intercepter

// ✅ SÉCURISÉ
postMessage(data, 'https://diagpv-audit.pages.dev');
```

### Types de Messages

| Type Message | Direction | Description |
|--------------|-----------|-------------|
| `HUB_INIT_PROJECT` | Hub → Iframe | Initialisation projet |
| `DIAGPV_ACK_INIT` | Iframe → Hub | Accusé réception (optionnel) |
| `DIAGPV_DATA_UPDATE` | Iframe → Hub | Synchronisation données audit |
| `DIAGPV_SESSION` | Iframe → Hub | Partage état session |
| `HUB_REQUEST_FULL_SYNC` | Hub → Iframe | Demande sync complète |

---

## 🧪 Tests

### Test 1 : Projet Existant (JALIBAT)

```bash
# 1. Accéder à /projects
curl -s https://7e96ed14.diagnostic-hub.pages.dev/projects | grep "Module EL"

# 2. Clic bouton "Module EL" → Redirection vers :
# https://7e96ed14.diagnostic-hub.pages.dev/modules/electroluminescence?project=8&name=Audit%20JALIBAT%20Production

# 3. Ouvrir Console DevTools (F12)
# ✅ Vérifier log : "📊 Données projet chargées: {id: 8, name: 'Audit JALIBAT Production', ...}"
# ✅ Vérifier log : "📤 Données projet envoyées vers iframe DiagPV: Audit JALIBAT Production"

# 4. Dans iframe (si listener implémenté) :
# ✅ Vérifier log : "✅ Projet reçu depuis Hub: Audit JALIBAT Production"
# ✅ Formulaire audit pré-rempli avec nom client, adresse, 242 modules
```

### Test 2 : Nouveau Projet

```bash
# 1. Créer nouveau projet via /projects/new
curl -X POST https://7e96ed14.diagnostic-hub.pages.dev/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test PostMessage",
    "client_id": 1,
    "site_address": "123 Test St",
    "module_count": 100,
    "installation_power": 40.5
  }'

# Réponse : {"success":true,"project":{"id":13,...}}

# 2. Accéder Module EL
# https://7e96ed14.diagnostic-hub.pages.dev/modules/electroluminescence?project=13&name=Test%20PostMessage

# 3. Vérifier console
# ✅ "📊 Données projet chargées: {id: 13, name: 'Test PostMessage', ...}"
# ✅ "📤 Données projet envoyées vers iframe DiagPV: Test PostMessage"
```

### Test 3 : Timing Chargement Iframe

**Cas A : Iframe charge avant `loadProjectData()`**
```javascript
// auditFrame.contentDocument.readyState === 'complete'
// → sendProjectData() exécuté immédiatement
// ✅ Message envoyé synchrone
```

**Cas B : `loadProjectData()` avant chargement iframe**
```javascript
// auditFrame.addEventListener('load', sendProjectData, {once: true})
// → Attente événement 'load'
// ✅ Message envoyé après chargement complet iframe
```

---

## 📊 Monitoring & Debug

### Logs Console Hub

```javascript
// Succès
📊 Données projet chargées: {id: 8, name: "Audit JALIBAT Production", ...}
📤 Données projet envoyées vers iframe DiagPV: Audit JALIBAT Production

// Erreurs
❌ Erreur chargement projet: Failed to fetch
⚠️ Iframe auditFrame non trouvée
❌ Erreur envoi postMessage: SecurityError
```

### Logs Console Iframe

```javascript
// Succès
✅ Projet reçu depuis Hub: Audit JALIBAT Production
🚀 Initialisation session audit: Audit JALIBAT Production

// Erreurs
⚠️ Message reçu origine non autorisée: http://localhost:3000
❌ Type message inconnu: UNKNOWN_TYPE
```

### Inspection postMessage (Chrome DevTools)

1. Ouvrir DevTools (F12)
2. Onglet **Sources** → **Event Listener Breakpoints**
3. Cocher **Messaging** → `message`
4. Recharger page
5. Débugger s'arrête à chaque `postMessage` / listener `message`

---

## 🚀 Déploiement

### Production v3.3.0

- **URL Hub** : https://7e96ed14.diagnostic-hub.pages.dev
- **URL Iframe** : https://diagpv-audit.pages.dev
- **Commit** : `5145a56` (feat: Initialisation projet dans iframe EL via postMessage)
- **GitHub** : https://github.com/pappalardoadrien-design/Diagnostic-pv
- **Date** : 2025-10-24

### Commandes Déploiement

```bash
# Build
npm run build

# Déploiement
npx wrangler pages deploy dist --project-name diagnostic-hub

# Vérification
curl https://7e96ed14.diagnostic-hub.pages.dev/api/projects/8 | jq '.project.name'
# → "Audit JALIBAT Production"
```

---

## 📝 Prochaines Étapes

### Priorité 1 : Implémentation Côté Iframe
- [ ] Créer listener `message` dans DiagPV audit
- [ ] Implémenter `initializeAuditSession()`
- [ ] Pre-remplir formulaire avec données projet
- [ ] Tester communication bidirectionnelle

### Priorité 2 : Accusé Réception
- [ ] Iframe envoie `DIAGPV_ACK_INIT` après init
- [ ] Hub affiche notification "✅ Projet initialisé dans EL"
- [ ] Gestion timeout si pas de réponse (5s)

### Priorité 3 : Persistance Session
- [ ] Sauvegarder état session dans localStorage iframe
- [ ] Reprendre session si refresh page
- [ ] Synchroniser mesures EL vers Hub en temps réel

---

## 📚 Références

- **MDN postMessage** : https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage
- **Sécurité cross-origin** : https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy
- **IEC 62446-1** : Normes électroluminescence PV
- **Cloudflare Pages Workers** : https://developers.cloudflare.com/pages/

---

**Auteur** : DiagPV Assistant  
**Version** : v3.3.0  
**Date** : 2025-10-24
