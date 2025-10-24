# 🔄 Guide Synchronisation Module EL → Hub DiagPV

## 📋 Architecture

**Flux de synchronisation :**
```
Module EL (iframe) → localStorage → Bouton Sync → API Hub → Base D1 Production
```

---

## 1️⃣ Code à Ajouter dans le Module EL (diagpv-audit.pages.dev)

### A. Fonction de Synchronisation JavaScript

**Ajouter dans le fichier JavaScript principal du module EL :**

```javascript
/**
 * 🔄 Synchronisation automatique des données EL vers le Hub DiagPV
 * 
 * Cette fonction récupère les données d'audit depuis localStorage
 * et les envoie vers l'API du Hub pour stockage en base D1.
 */
async function syncAuditToHub() {
    try {
        // 1. Récupérer sessionId depuis l'URL
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = window.location.pathname.split('/').pop() || urlParams.get('sessionId');
        
        if (!sessionId) {
            throw new Error('Session ID introuvable');
        }
        
        // 2. Récupérer données audit depuis localStorage
        const auditDataKey = `audit_${sessionId}`;
        const auditDataRaw = localStorage.getItem(auditDataKey);
        
        if (!auditDataRaw) {
            throw new Error(`Aucune donnée trouvée pour la session ${sessionId}`);
        }
        
        const auditData = JSON.parse(auditDataRaw);
        
        // 3. Extraire informations essentielles
        const syncPayload = {
            auditData: {
                // Identification
                sessionId: sessionId,
                projectName: auditData.projectName || 'Audit Sans Nom',
                clientName: auditData.clientName || 'Client Inconnu',
                clientEmail: auditData.clientEmail || null,
                siteAddress: auditData.siteAddress || auditData.projectName || 'Adresse à définir',
                
                // Configuration technique
                totalModules: auditData.totalModules || auditData.moduleCount || 0,
                installedPower: auditData.installedPower || (auditData.totalModules * 0.4), // 400Wc par défaut
                stringCount: auditData.stringCount || 0,
                
                // Résultats audit
                defectsFound: auditData.defectsFound || (auditData.defects ? auditData.defects.length : 0),
                conformityRate: auditData.conformityRate || calculateConformityRate(auditData),
                progress: auditData.progress || 100,
                
                // Métadonnées
                auditDate: auditData.auditDate || new Date().toISOString(),
                technicians: auditData.technicians || [],
                auditType: 'Électroluminescence',
                norms: ['IEC 62446-1', 'IEC 61215']
            }
        };
        
        // 4. Envoyer vers API Hub
        console.log('📤 Synchronisation vers Hub DiagPV...', syncPayload);
        
        const response = await fetch('https://diagnostic-hub.pages.dev/api/projects/sync', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(syncPayload)
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Synchronisation réussie !', result.data);
            
            // Afficher notification succès
            showNotification('✅ Projet synchronisé avec le Hub DiagPV !', 'success');
            
            // Stocker info de synchronisation
            localStorage.setItem(`${auditDataKey}_synced`, JSON.stringify({
                syncDate: new Date().toISOString(),
                projectId: result.data.projectId,
                interventionId: result.data.interventionId
            }));
            
            return result.data;
        } else {
            throw new Error(result.error || 'Erreur synchronisation');
        }
        
    } catch (error) {
        console.error('❌ Erreur synchronisation Hub:', error);
        showNotification('❌ Erreur synchronisation: ' + error.message, 'error');
        throw error;
    }
}

/**
 * Calculer taux de conformité depuis données audit
 */
function calculateConformityRate(auditData) {
    const totalModules = auditData.totalModules || auditData.moduleCount || 0;
    const defectsFound = auditData.defectsFound || (auditData.defects ? auditData.defects.length : 0);
    
    if (totalModules === 0) return 100;
    
    const conformModules = totalModules - defectsFound;
    return Math.round((conformModules / totalModules) * 100);
}

/**
 * Afficher notification utilisateur
 */
function showNotification(message, type = 'info') {
    // Si vous avez déjà un système de notifications, utilisez-le
    // Sinon, voici un exemple basique
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#22c55e' : '#ef4444'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

/**
 * Synchronisation automatique au chargement
 * Déclencher si audit terminé (progress = 100%)
 */
window.addEventListener('load', () => {
    const sessionId = window.location.pathname.split('/').pop();
    const auditDataKey = `audit_${sessionId}`;
    const auditData = JSON.parse(localStorage.getItem(auditDataKey) || '{}');
    
    // Vérifier si déjà synchronisé
    const syncInfo = localStorage.getItem(`${auditDataKey}_synced`);
    
    if (auditData.progress === 100 && !syncInfo) {
        console.log('🔄 Audit terminé, synchronisation automatique...');
        // Attendre 2 secondes avant sync auto
        setTimeout(() => syncAuditToHub(), 2000);
    }
});
```

### B. Bouton de Synchronisation Manuelle

**Ajouter dans le HTML du module EL :**

```html
<!-- Bouton Synchronisation -->
<button 
    id="syncToHubBtn" 
    onclick="syncAuditToHub()"
    class="sync-button"
    style="
        background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%);
        color: white;
        padding: 12px 24px;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 6px rgba(139, 92, 246, 0.3);
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 8px;
    "
    onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 12px rgba(139, 92, 246, 0.4)'"
    onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 6px rgba(139, 92, 246, 0.3)'"
>
    <i class="fas fa-sync-alt"></i>
    <span>Synchroniser avec Hub DiagPV</span>
</button>

<!-- CSS animations -->
<style>
@keyframes slideIn {
    from {
        transform: translateX(400px);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes slideOut {
    from {
        transform: translateX(0);
        opacity: 1;
    }
    to {
        transform: translateX(400px);
        opacity: 0;
    }
}

.sync-button:active {
    transform: scale(0.95) !important;
}

.sync-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
</style>
```

---

## 2️⃣ Test de Synchronisation

### A. Test Manuel depuis la Console

**Ouvrir la console (F12) sur le module EL et exécuter :**

```javascript
// Test synchronisation
syncAuditToHub().then(result => {
    console.log('✅ Synchronisation test réussie:', result);
}).catch(error => {
    console.error('❌ Erreur test:', error);
});
```

### B. Test avec cURL (Depuis le serveur)

```bash
curl -X POST https://diagnostic-hub.pages.dev/api/projects/sync \
  -H "Content-Type: application/json" \
  -d '{
    "auditData": {
      "sessionId": "76e6eb36-8b49-4255-99d3-55fc1adfc1c9",
      "projectName": "Les Forges de Lanouée",
      "clientName": "ARKOLIA",
      "clientEmail": "contact@arkolia.fr",
      "siteAddress": "Les Forges de Lanouée",
      "totalModules": 220,
      "installedPower": 88,
      "stringCount": 11,
      "defectsFound": 5,
      "conformityRate": 97.7,
      "progress": 100
    }
  }'
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Synchronisation réussie",
  "data": {
    "projectId": 13,
    "projectName": "Les Forges de Lanouée",
    "interventionId": 7,
    "moduleCount": 220,
    "defectsCount": 5,
    "conformityRate": 97.7
  }
}
```

---

## 3️⃣ Bouton Synchronisation dans le Hub (Vue Projet)

### Ajouter dans la page projet du Hub

**Code à ajouter dans `/projects` page :**

```javascript
async function syncProjectFromIframe(projectId) {
    try {
        // 1. Récupérer sessionId depuis les notes d'intervention
        const response = await fetch(`/api/projects/${projectId}`);
        const data = await response.json();
        
        if (!data.success || !data.project) {
            throw new Error('Projet introuvable');
        }
        
        // 2. Extraire sessionId depuis notes intervention
        const interventions = data.project.interventions || [];
        const elIntervention = interventions.find(i => i.intervention_type === 'electroluminescence');
        
        if (!elIntervention) {
            throw new Error('Aucune intervention EL trouvée');
        }
        
        let sessionId;
        try {
            const notes = JSON.parse(elIntervention.notes);
            sessionId = notes.sessionId;
        } catch {
            sessionId = null;
        }
        
        if (!sessionId) {
            alert('⚠️ Session EL non trouvée. Créez d\'abord un audit EL pour ce projet.');
            return;
        }
        
        // 3. Ouvrir module EL et déclencher sync
        const elUrl = `https://diagpv-audit.pages.dev/audit/${sessionId}`;
        alert(`📱 Ouvrez le module EL et cliquez sur "Synchroniser":\\n\\n${elUrl}`);
        window.open(elUrl, '_blank');
        
    } catch (error) {
        console.error('Erreur:', error);
        alert('❌ Erreur: ' + error.message);
    }
}
```

---

## 4️⃣ Format Données Attendu par l'API

### Structure JSON complète

```typescript
interface SyncPayload {
  auditData: {
    // Identification
    sessionId: string;           // UUID session EL
    projectName: string;          // "Les Forges de Lanouée"
    clientName: string;           // "ARKOLIA"
    clientEmail?: string;         // "contact@arkolia.fr"
    siteAddress: string;          // "Les Forges de Lanouée"
    
    // Configuration
    totalModules: number;         // 220
    installedPower: number;       // 88 (kWc)
    stringCount?: number;         // 11
    
    // Résultats
    defectsFound: number;         // 5
    conformityRate: number;       // 97.7 (%)
    progress: number;             // 0-100
    
    // Métadonnées
    auditDate?: string;           // ISO 8601
    technicians?: string[];       // ["Tech1", "Tech2"]
    auditType?: string;           // "Électroluminescence"
    norms?: string[];             // ["IEC 62446-1"]
  }
}
```

---

## 5️⃣ Dépannage

### Problème : "Erreur CORS"

**Solution :** Vérifier que l'API Hub autorise les requêtes depuis `diagpv-audit.pages.dev`

```typescript
// Dans src/index.tsx (déjà présent)
app.use('/api/*', cors({
  origin: ['https://diagpv-audit.pages.dev', 'https://diagnostic-hub.pages.dev'],
  credentials: true
}));
```

### Problème : "Données audit manquantes"

**Solution :** Vérifier structure localStorage :

```javascript
// Console du module EL
const sessionId = '76e6eb36-8b49-4255-99d3-55fc1adfc1c9';
const auditData = localStorage.getItem(`audit_${sessionId}`);
console.log(JSON.parse(auditData));
```

### Problème : "Projet ne s'affiche pas dans le Hub"

**Solution :** Vider cache navigateur et recharger `/projects`

```bash
# Test API directement
curl https://diagnostic-hub.pages.dev/api/projects | jq '.projects[] | select(.name | contains("Forges"))'
```

---

## 6️⃣ Checklist de Déploiement

- [ ] Code JavaScript ajouté au module EL
- [ ] Bouton "Synchroniser" visible sur la page audit
- [ ] Test synchronisation manuelle OK
- [ ] API `/api/projects/sync` fonctionne
- [ ] Projet apparaît dans Hub après sync
- [ ] Notification utilisateur affichée
- [ ] localStorage contient info synchronisation
- [ ] CORS configuré correctement

---

## 📊 Résultat Attendu

**Après synchronisation :**

1. ✅ Projet visible dans `https://diagnostic-hub.pages.dev/projects`
2. ✅ Intervention EL créée automatiquement
3. ✅ Données techniques mises à jour (modules, puissance)
4. ✅ Statistiques audit disponibles (défauts, conformité)
5. ✅ Bouton "Rapport" fonctionnel

---

**Date création :** 2025-10-24  
**Version Hub :** v3.4.0  
**Auteur :** DiagPV Assistant  
**Contact :** Adrien Pappalardo - Business Developer
