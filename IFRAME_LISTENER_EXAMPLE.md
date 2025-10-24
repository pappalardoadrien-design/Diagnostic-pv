# 🎯 Exemple Complet Listener Iframe DiagPV

## Fichier à Créer : `script.js` (dans iframe https://diagpv-audit.pages.dev)

```javascript
/**
 * LISTENER postMessage - Communication avec Hub DiagPV
 * 
 * Reçoit les données projet depuis le Hub et initialise automatiquement
 * la session d'audit électroluminescence.
 * 
 * @version 3.3.0
 * @date 2025-10-24
 */

// ============================================================================
// 1. CONFIGURATION
// ============================================================================

const HUB_ORIGINS = [
    'https://7e96ed14.diagnostic-hub.pages.dev',
    'https://diagnostic-hub.pages.dev',
    'http://localhost:3000' // Dev local
];

// ============================================================================
// 2. LISTENER PRINCIPAL postMessage
// ============================================================================

window.addEventListener('message', function(event) {
    // Validation origine (SÉCURITÉ CRITIQUE)
    if (!HUB_ORIGINS.includes(event.origin)) {
        console.warn('⚠️ Message reçu origine non autorisée:', event.origin);
        return;
    }
    
    const data = event.data;
    console.log('📨 Message reçu du Hub:', data.type);
    
    // Routage par type de message
    switch (data.type) {
        case 'HUB_INIT_PROJECT':
            handleProjectInitialization(data.project, event);
            break;
            
        case 'HUB_REQUEST_FULL_SYNC':
            handleFullSync(event);
            break;
            
        case 'HUB_REQUEST_STATUS':
            sendStatusUpdate(event);
            break;
            
        default:
            console.warn('⚠️ Type message inconnu:', data.type);
    }
});

// ============================================================================
// 3. INITIALISATION PROJET (HUB_INIT_PROJECT)
// ============================================================================

function handleProjectInitialization(project, event) {
    console.log('✅ Projet reçu depuis Hub:', project.projectName);
    console.log('📊 Détails:', {
        id: project.projectId,
        client: project.clientName,
        modules: project.totalModules,
        power: project.installedPower
    });
    
    try {
        // 1. Créer session audit
        const session = createAuditSession(project);
        
        // 2. Sauvegarder dans localStorage
        saveSessionToStorage(session);
        
        // 3. Pre-remplir formulaire HTML
        populateAuditForm(project);
        
        // 4. Initialiser grille modules
        initializeModuleGrid(project.totalModules);
        
        // 5. Afficher interface audit
        renderAuditInterface(session);
        
        // 6. Envoyer accusé réception au Hub
        sendAcknowledgement(project.projectId, 'initialized', event);
        
        // 7. Notifier utilisateur
        showNotification('success', `✅ Projet "${project.projectName}" initialisé avec succès`);
        
        console.log('🚀 Session audit créée:', session.sessionId);
        
    } catch (error) {
        console.error('❌ Erreur initialisation projet:', error);
        sendAcknowledgement(project.projectId, 'error', event, error.message);
        showNotification('error', '❌ Erreur initialisation : ' + error.message);
    }
}

// ============================================================================
// 4. CRÉATION SESSION AUDIT
// ============================================================================

function createAuditSession(project) {
    const session = {
        // Identifiants
        sessionId: project.sessionId || 'session_' + Date.now(),
        projectId: project.projectId,
        
        // Informations projet
        projectName: project.projectName,
        clientName: project.clientName,
        siteAddress: project.siteAddress,
        totalModules: project.totalModules,
        installedPower: project.installedPower,
        
        // Métadonnées session
        startDate: new Date().toISOString(),
        lastUpdate: new Date().toISOString(),
        operator: localStorage.getItem('operatorName') || 'Opérateur',
        
        // Données audit
        measurements: [],
        defects: [],
        progress: {
            modulesAudited: 0,
            modulesTotal: project.totalModules,
            percentComplete: 0,
            defectsDetected: 0
        },
        
        // Statut
        status: 'initialized', // initialized | in_progress | completed
        isFromHub: true
    };
    
    // Stocker globalement
    window.currentAuditSession = session;
    
    return session;
}

// ============================================================================
// 5. SAUVEGARDE LOCALSTORAGE
// ============================================================================

function saveSessionToStorage(session) {
    try {
        localStorage.setItem('activeAuditSession', JSON.stringify(session));
        localStorage.setItem('lastSessionUpdate', new Date().toISOString());
        console.log('💾 Session sauvegardée dans localStorage');
    } catch (error) {
        console.error('❌ Erreur sauvegarde localStorage:', error);
    }
}

// ============================================================================
// 6. PRE-REMPLISSAGE FORMULAIRE HTML
// ============================================================================

function populateAuditForm(project) {
    // Champs projet
    const projectNameField = document.getElementById('projectName');
    if (projectNameField) {
        projectNameField.value = project.projectName;
        projectNameField.disabled = true; // Lecture seule depuis Hub
    }
    
    const clientNameField = document.getElementById('clientName');
    if (clientNameField) {
        clientNameField.value = project.clientName || '';
    }
    
    const siteAddressField = document.getElementById('siteAddress');
    if (siteAddressField) {
        siteAddressField.value = project.siteAddress || '';
    }
    
    const moduleCountField = document.getElementById('moduleCount');
    if (moduleCountField) {
        moduleCountField.value = project.totalModules || 0;
        moduleCountField.disabled = true;
    }
    
    const powerField = document.getElementById('installedPower');
    if (powerField) {
        powerField.value = project.installedPower || 0;
    }
    
    // Badge Hub
    const hubBadge = document.getElementById('hubBadge');
    if (hubBadge) {
        hubBadge.style.display = 'inline-block';
        hubBadge.innerHTML = '<i class="fas fa-link"></i> Projet Hub #' + project.projectId;
    }
    
    console.log('📝 Formulaire pré-rempli avec données Hub');
}

// ============================================================================
// 7. INITIALISATION GRILLE MODULES
// ============================================================================

function initializeModuleGrid(totalModules) {
    const gridContainer = document.getElementById('moduleGrid');
    if (!gridContainer) return;
    
    // Calculer configuration grille (ex: 10 strings)
    const stringsCount = 10;
    const modulesPerString = Math.ceil(totalModules / stringsCount);
    
    gridContainer.innerHTML = ''; // Clear
    
    for (let stringNum = 1; stringNum <= stringsCount; stringNum++) {
        const stringDiv = document.createElement('div');
        stringDiv.className = 'string-row';
        stringDiv.innerHTML = `<h4>String ${stringNum}</h4>`;
        
        for (let moduleNum = 1; moduleNum <= modulesPerString; moduleNum++) {
            const moduleId = `S${stringNum}-${moduleNum}`;
            const moduleDiv = document.createElement('div');
            moduleDiv.className = 'module-cell';
            moduleDiv.id = moduleId;
            moduleDiv.dataset.stringNum = stringNum;
            moduleDiv.dataset.moduleNum = moduleNum;
            moduleDiv.innerHTML = `
                <span class="module-id">${moduleId}</span>
                <span class="module-status">⏳</span>
            `;
            
            moduleDiv.onclick = () => selectModule(moduleId);
            stringDiv.appendChild(moduleDiv);
        }
        
        gridContainer.appendChild(stringDiv);
    }
    
    console.log('🔲 Grille modules initialisée:', totalModules, 'modules');
}

// ============================================================================
// 8. INTERFACE AUDIT
// ============================================================================

function renderAuditInterface(session) {
    // Mettre à jour header
    const headerTitle = document.getElementById('auditTitle');
    if (headerTitle) {
        headerTitle.textContent = `Audit EL - ${session.projectName}`;
    }
    
    // Mettre à jour stats
    updateProgressStats(session.progress);
    
    // Afficher zone mesures
    const measurementSection = document.getElementById('measurementSection');
    if (measurementSection) {
        measurementSection.style.display = 'block';
    }
    
    // Activer boutons
    enableAuditControls();
    
    console.log('🎨 Interface audit rendue');
}

function updateProgressStats(progress) {
    const statsContainer = document.getElementById('auditStats');
    if (!statsContainer) return;
    
    statsContainer.innerHTML = `
        <div class="stat-item">
            <span class="stat-label">Modules audités</span>
            <span class="stat-value">${progress.modulesAudited}/${progress.modulesTotal}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Progression</span>
            <span class="stat-value">${progress.percentComplete}%</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Défauts détectés</span>
            <span class="stat-value">${progress.defectsDetected}</span>
        </div>
    `;
}

// ============================================================================
// 9. ACCUSÉ RÉCEPTION → HUB
// ============================================================================

function sendAcknowledgement(projectId, status, event, errorMsg = null) {
    const message = {
        type: 'DIAGPV_ACK_INIT',
        projectId: projectId,
        status: status, // 'initialized' | 'error'
        timestamp: new Date().toISOString()
    };
    
    if (errorMsg) {
        message.error = errorMsg;
    }
    
    try {
        event.source.postMessage(message, event.origin);
        console.log('📤 Accusé réception envoyé au Hub:', status);
    } catch (error) {
        console.error('❌ Erreur envoi accusé réception:', error);
    }
}

// ============================================================================
// 10. SYNCHRONISATION DONNÉES → HUB (EXISTING)
// ============================================================================

function handleFullSync(event) {
    const session = window.currentAuditSession;
    if (!session) {
        console.warn('⚠️ Aucune session active pour sync');
        return;
    }
    
    const syncData = {
        type: 'DIAGPV_DATA_UPDATE',
        projectId: session.projectId,
        sessionId: session.sessionId,
        timestamp: new Date().toISOString(),
        data: {
            measurements: session.measurements,
            defects: session.defects,
            progress: session.progress
        }
    };
    
    try {
        event.source.postMessage(syncData, event.origin);
        console.log('📤 Données audit synchronisées vers Hub');
    } catch (error) {
        console.error('❌ Erreur sync données:', error);
    }
}

function sendStatusUpdate(event) {
    const session = window.currentAuditSession;
    if (!session) return;
    
    const statusData = {
        type: 'DIAGPV_SESSION',
        session: {
            sessionId: session.sessionId,
            projectId: session.projectId,
            status: session.status,
            progress: session.progress,
            lastUpdate: session.lastUpdate
        }
    };
    
    try {
        event.source.postMessage(statusData, event.origin);
        console.log('📤 Statut session envoyé au Hub');
    } catch (error) {
        console.error('❌ Erreur envoi statut:', error);
    }
}

// ============================================================================
// 11. HELPERS
// ============================================================================

function enableAuditControls() {
    const startBtn = document.getElementById('startAuditBtn');
    if (startBtn) {
        startBtn.disabled = false;
        startBtn.onclick = startAudit;
    }
}

function startAudit() {
    if (!window.currentAuditSession) {
        alert('Aucune session active');
        return;
    }
    
    window.currentAuditSession.status = 'in_progress';
    window.currentAuditSession.lastUpdate = new Date().toISOString();
    saveSessionToStorage(window.currentAuditSession);
    
    showNotification('info', '🚀 Audit démarré');
    console.log('🚀 Audit démarré');
}

function selectModule(moduleId) {
    console.log('📍 Module sélectionné:', moduleId);
    // Logique sélection module...
}

function showNotification(type, message) {
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // Si vous avez un système de notifications UI
    const notifContainer = document.getElementById('notifications');
    if (notifContainer) {
        const notif = document.createElement('div');
        notif.className = `notification notification-${type}`;
        notif.textContent = message;
        notifContainer.appendChild(notif);
        
        setTimeout(() => notif.remove(), 5000);
    }
}

// ============================================================================
// 12. INITIALISATION AU CHARGEMENT PAGE
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🎬 Iframe DiagPV chargée - Listener postMessage actif');
    
    // Restaurer session si existante
    const savedSession = localStorage.getItem('activeAuditSession');
    if (savedSession) {
        try {
            window.currentAuditSession = JSON.parse(savedSession);
            console.log('♻️ Session restaurée:', window.currentAuditSession.sessionId);
            renderAuditInterface(window.currentAuditSession);
        } catch (error) {
            console.error('❌ Erreur restauration session:', error);
        }
    }
    
    // Notifier Hub que iframe est prête
    if (window.parent !== window) {
        window.parent.postMessage({
            type: 'DIAGPV_READY',
            timestamp: new Date().toISOString()
        }, '*');
        console.log('📤 Signal READY envoyé au Hub');
    }
});

// ============================================================================
// 13. EXPORT POUR TESTS
// ============================================================================

// Exposer fonctions pour tests console
window.DiagPVAudit = {
    createSession: createAuditSession,
    saveSession: saveSessionToStorage,
    getCurrentSession: () => window.currentAuditSession,
    simulateHubMessage: (project) => {
        handleProjectInitialization(project, {
            source: window.parent,
            origin: HUB_ORIGINS[0]
        });
    }
};

console.log('✅ Module DiagPV Audit initialisé');
```

---

## HTML Structure Requise (dans iframe)

```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>DiagPV Audit - Électroluminescence</title>
    <style>
        .module-cell {
            display: inline-block;
            width: 60px;
            height: 100px;
            border: 2px solid #ccc;
            margin: 5px;
            padding: 5px;
            cursor: pointer;
            background: #f9f9f9;
        }
        .module-cell:hover {
            background: #e0e0e0;
        }
        .module-id {
            font-size: 12px;
            font-weight: bold;
        }
        .module-status {
            font-size: 20px;
        }
        .string-row {
            margin: 20px 0;
        }
        .notification {
            padding: 10px;
            margin: 10px 0;
            border-radius: 5px;
        }
        .notification-success { background: #d4edda; color: #155724; }
        .notification-error { background: #f8d7da; color: #721c24; }
        .notification-info { background: #d1ecf1; color: #0c5460; }
    </style>
</head>
<body>
    <div id="notifications"></div>
    
    <header>
        <h1 id="auditTitle">Audit Électroluminescence</h1>
        <span id="hubBadge" style="display:none; background:#8b5cf6; color:white; padding:5px 10px; border-radius:5px;"></span>
    </header>
    
    <section id="projectInfo">
        <h2>Informations Projet</h2>
        <div>
            <label>Nom Projet</label>
            <input type="text" id="projectName" placeholder="Nom du projet">
        </div>
        <div>
            <label>Client</label>
            <input type="text" id="clientName" placeholder="Nom client">
        </div>
        <div>
            <label>Adresse Site</label>
            <input type="text" id="siteAddress" placeholder="Adresse">
        </div>
        <div>
            <label>Nombre Modules</label>
            <input type="number" id="moduleCount" placeholder="0">
        </div>
        <div>
            <label>Puissance Installée (kWc)</label>
            <input type="number" id="installedPower" step="0.1" placeholder="0">
        </div>
    </section>
    
    <section id="auditStats">
        <!-- Stats dynamiques -->
    </section>
    
    <section id="measurementSection" style="display:none;">
        <button id="startAuditBtn">🚀 Démarrer Audit</button>
        <div id="moduleGrid"></div>
    </section>
    
    <script src="script.js"></script>
</body>
</html>
```

---

## Test Console (dans iframe)

```javascript
// Simuler message depuis Hub
window.DiagPVAudit.simulateHubMessage({
    projectId: 8,
    projectName: "Test Integration",
    clientName: "Client Test",
    siteAddress: "123 Test St",
    totalModules: 50,
    installedPower: 20.5,
    sessionId: "test_session_123"
});

// Récupérer session courante
window.DiagPVAudit.getCurrentSession();
```

---

**Ce code est prêt à être intégré dans l'iframe DiagPV Audit !**
