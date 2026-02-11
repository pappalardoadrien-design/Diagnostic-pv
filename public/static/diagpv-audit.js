// DiagPV Audit EL - Interface audit terrain nocturne
// Collaboration temps réel + diagnostic modules optimisé tablette tactile

// Configuration logging production
const DEBUG_AUDIT = localStorage.getItem('diagpv_debug') === 'true'
const logAudit = (...args) => DEBUG_AUDIT && console.log(...args)
const errorAudit = (...args) => console.error(...args) // Toujours afficher les erreurs

class DiagPVAudit {
    constructor() {
        this.auditToken = document.body.dataset.auditToken
        this.auditData = null
        this.modules = new Map()
        this.currentStringFilter = 'all'
        this.technicianId = this.generateTechnicianId()
        this.eventSource = null
        this.selectedModule = null
        this.offlineQueue = []
        
        // Propriétés sélection multiple
        this.multiSelectMode = false
        this.selectedModules = new Set()
        this.bulkActionStatus = null
        
        // Propriétés affichage
        this.viewMode = 'string' // 'string' ou 'physical'
        
        // Propriétés sens câblage par string
        // Directions: 'ltr' (gauche→droite), 'rtl' (droite→gauche), 'ttb' (haut→bas), 'btt' (bas→haut)
        this.cableDirections = this.loadCableDirections()
        
        // Propriétés Assistant Vocal
        this.isListening = false
        this.recognition = null
        
        this.init()
    }

    async init() {
        logAudit('🌙 DiagPV Audit Terrain - Token:', this.auditToken)
        
        try {
            await this.loadAuditData()
            this.setupInterface()
            this.setupEventListeners()
            this.setupRealtimeSync()
            this.setupOfflineSupport()
            this.setupVoiceAssistant() // Nouveau module vocal
        } catch (err) {
            errorAudit('Erreur initialisation:', err)
            this.showAlert('Erreur chargement audit: ' + err.message, 'error')
        }
    }

    async loadAuditData() {
        const response = await fetch(`/api/el/audit/${this.auditToken}`)
        
        if (!response.ok) {
            throw new Error('Audit introuvable')
        }

        const data = await response.json()
        this.auditData = data.audit
        this.linkedPlant = data.linkedPlant || null
        this.linkedZones = data.linkedZones || []
        
        // Construction Map modules pour accès rapide
        data.modules.forEach(module => {
            this.modules.set(module.module_id, module)
        })

        logAudit('✅ Audit chargé:', this.auditData.project_name, 'Modules:', this.modules.size)
        if (this.linkedPlant) {
            logAudit('🔗 Centrale liée:', this.linkedPlant.plant_name, 'Zones:', this.linkedZones.length)
        }
    }

    setupInterface() {
        // Mise à jour titre et informations avec données centrale
        const titleEl = document.getElementById('projectTitle')
        if (this.linkedPlant) {
            titleEl.innerHTML = `${this.auditData.project_name} <span class="text-purple-400 text-sm ml-2"><i class="fas fa-link"></i> ${this.linkedPlant.plant_name}</span>`
        } else {
            titleEl.textContent = this.auditData.project_name
        }
        
        this.updateProgress()
        this.renderPlantInfo()
        this.renderStringNavigation()
        this.renderModulesGrid()
        
        // Ajout du bouton micro flottant
        this.renderVoiceButton()
        
        // Ajout du panneau notes
        this.renderNotesPanel()
    }
    
    renderPlantInfo() {
        // Afficher les infos de la centrale liée si disponible
        const pvCartoBtn = document.getElementById('pvCartoBtn')
        if (this.linkedPlant && pvCartoBtn) {
            pvCartoBtn.style.display = 'flex'
            pvCartoBtn.onclick = () => {
                window.location.href = `/pv/plant/${this.linkedPlant.plant_id}`
            }
            pvCartoBtn.title = `Cartographie PV: ${this.linkedPlant.plant_name}`
            pvCartoBtn.innerHTML = `<i class="fas fa-solar-panel mr-1"></i>${this.linkedPlant.plant_name}`
        }
        
        // Insérer un bandeau d'information centrale si lié
        if (this.linkedPlant) {
            const header = document.querySelector('header')
            if (header && !document.getElementById('plantInfoBanner')) {
                const banner = document.createElement('div')
                banner.id = 'plantInfoBanner'
                banner.className = 'bg-purple-900 border-b border-purple-400 p-2'
                banner.innerHTML = `
                    <div class="flex items-center justify-between max-w-screen-xl mx-auto px-4">
                        <div class="flex items-center space-x-4 text-sm">
                            <span class="text-purple-300"><i class="fas fa-building mr-1"></i>${this.linkedPlant.client_company || this.auditData.client_name || '-'}</span>
                            <span class="text-purple-300"><i class="fas fa-solar-panel mr-1"></i>${this.linkedPlant.plant_name}</span>
                            <span class="text-purple-300"><i class="fas fa-map-marker-alt mr-1"></i>${this.linkedPlant.address || ''} ${this.linkedPlant.city || ''}</span>
                            <span class="text-purple-300"><i class="fas fa-bolt mr-1"></i>${this.linkedZones.reduce((sum, z) => sum + (z.total_power_wp || 0), 0) / 1000} kWc</span>
                            <span class="text-purple-300"><i class="fas fa-layer-group mr-1"></i>${this.linkedZones.length} zones</span>
                        </div>
                        <a href="/pv/plant/${this.linkedPlant.plant_id}" class="text-purple-300 hover:text-white text-sm">
                            <i class="fas fa-external-link-alt mr-1"></i>Voir cartographie
                        </a>
                    </div>
                `
                header.after(banner)
            }
        }
    }
    
    renderVoiceButton() {
        const btn = document.createElement('button')
        btn.id = 'voiceAssistantBtn'
        btn.className = 'fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-20 h-20 rounded-full bg-blue-600 text-white shadow-2xl flex items-center justify-center transition-all active:scale-95 border-4 border-white'
        btn.innerHTML = '<i class="fas fa-microphone text-3xl"></i>'
        btn.title = "Maintenir pour parler (Push-to-Talk)"
        document.body.appendChild(btn)
        
        // Styles d'animation d'écoute
        const style = document.createElement('style')
        style.textContent = `
            @keyframes pulse-ring {
                0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.7); }
                70% { box-shadow: 0 0 0 20px rgba(37, 99, 235, 0); }
                100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
            }
            .listening-mode {
                background-color: #ef4444 !important; /* Rouge quand écoute */
                animation: pulse-ring 1.5s infinite;
            }
        `
        document.head.appendChild(style)
    }

    renderStringNavigation() {
        const nav = document.getElementById('stringNavigation')
        let navHTML = `
            <button class="string-nav-btn ${this.currentStringFilter === 'all' ? 'active' : ''}" 
                    data-string="all">
                TOUS
            </button>
        `

        for (let i = 1; i <= this.auditData.string_count; i++) {
            const stringModules = Array.from(this.modules.values())
                .filter(m => m.string_number === i)
            const completed = stringModules.filter(m => m.status !== 'pending').length
            
            navHTML += `
                <button class="string-nav-btn ${this.currentStringFilter === i ? 'active' : ''}" 
                        data-string="${i}">
                    S${i} (${completed}/${stringModules.length})
                </button>
            `
        }

        nav.innerHTML = navHTML
    }

    renderModulesGrid() {
        const container = document.getElementById('auditContent')
        let gridHTML = ''

        // Boutons de basculement vue
        gridHTML += `
            <div class="view-toggle-container mb-6">
                <div class="flex gap-2 justify-center">
                    <button id="stringViewBtn" class="view-toggle-btn ${this.viewMode !== 'physical' ? 'active' : ''}" 
                            onclick="diagpvAudit.setViewMode('string')">
                        <i class="fas fa-list mr-2"></i>Vue par String
                    </button>
                    <button id="physicalViewBtn" class="view-toggle-btn ${this.viewMode === 'physical' ? 'active' : ''}" 
                            onclick="diagpvAudit.setViewMode('physical')">
                        <i class="fas fa-th mr-2"></i>Vue Calepinage
                    </button>
                </div>
            </div>
        `

        if (this.viewMode === 'physical') {
            // Affichage vue physique
            gridHTML += this.renderPhysicalGrid()
        } else {
            // Affichage vue par string (existant)
            if (this.currentStringFilter === 'all') {
                for (let s = 1; s <= this.auditData.string_count; s++) {
                    gridHTML += this.renderStringContainer(s)
                }
            } else {
                gridHTML = this.renderStringContainer(this.currentStringFilter)
            }
        }

        container.innerHTML = gridHTML
    }

    renderStringContainer(stringNumber) {
        const stringModules = Array.from(this.modules.values())
            .filter(m => m.string_number === stringNumber)
            .sort((a, b) => a.position_in_string - b.position_in_string)

        const completed = stringModules.filter(m => m.status !== 'pending').length
        const total = stringModules.length
        
        // Récupérer le sens de câblage actuel
        const currentDirection = this.cableDirections[stringNumber] || null
        const directionLabel = currentDirection ? this.getDirectionLabel(currentDirection) : 'Définir sens câblage'
        const directionArrow = currentDirection ? this.getDirectionArrow(currentDirection) : '?'
        const directionClass = currentDirection ? 'bg-green-600' : 'bg-orange-600'

        let html = `
            <div class="string-container" data-string="${stringNumber}">
                <div class="string-header">
                    <h3>
                        <i class="fas fa-solar-panel mr-2"></i>
                        STRING ${stringNumber}
                    </h3>
                    <div class="string-progress">
                        ${completed}/${total}
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${(completed/total)*100}%"></div>
                        </div>
                    </div>
                </div>
                
                <!-- SENS DE CÂBLAGE -->
                <div class="cable-direction-panel" style="
                    display: flex; 
                    flex-wrap: wrap;
                    gap: 8px; 
                    padding: 10px; 
                    background: #1a1a2e; 
                    border-radius: 8px; 
                    margin-bottom: 10px;
                    align-items: center;
                ">
                    <span style="font-size: 12px; color: #9ca3af; margin-right: 5px;">
                        <i class="fas fa-route"></i> Câblage:
                    </span>
                    <button onclick="window.diagpvAudit.setCableDirection(${stringNumber}, 'ltr')" 
                            class="cable-btn ${currentDirection === 'ltr' ? 'active' : ''}"
                            style="
                                padding: 6px 12px; 
                                border-radius: 6px; 
                                font-size: 11px; 
                                font-weight: bold;
                                border: 2px solid ${currentDirection === 'ltr' ? '#22c55e' : '#4b5563'};
                                background: ${currentDirection === 'ltr' ? '#22c55e' : '#374151'};
                                color: white;
                            ">
                        <i class="fas fa-arrow-right"></i> G→D
                    </button>
                    <button onclick="window.diagpvAudit.setCableDirection(${stringNumber}, 'rtl')"
                            class="cable-btn ${currentDirection === 'rtl' ? 'active' : ''}"
                            style="
                                padding: 6px 12px; 
                                border-radius: 6px; 
                                font-size: 11px; 
                                font-weight: bold;
                                border: 2px solid ${currentDirection === 'rtl' ? '#22c55e' : '#4b5563'};
                                background: ${currentDirection === 'rtl' ? '#22c55e' : '#374151'};
                                color: white;
                            ">
                        <i class="fas fa-arrow-left"></i> D→G
                    </button>
                    <button onclick="window.diagpvAudit.setCableDirection(${stringNumber}, 'ttb')"
                            class="cable-btn ${currentDirection === 'ttb' ? 'active' : ''}"
                            style="
                                padding: 6px 12px; 
                                border-radius: 6px; 
                                font-size: 11px; 
                                font-weight: bold;
                                border: 2px solid ${currentDirection === 'ttb' ? '#22c55e' : '#4b5563'};
                                background: ${currentDirection === 'ttb' ? '#22c55e' : '#374151'};
                                color: white;
                            ">
                        <i class="fas fa-arrow-down"></i> H→B
                    </button>
                    <button onclick="window.diagpvAudit.setCableDirection(${stringNumber}, 'btt')"
                            class="cable-btn ${currentDirection === 'btt' ? 'active' : ''}"
                            style="
                                padding: 6px 12px; 
                                border-radius: 6px; 
                                font-size: 11px; 
                                font-weight: bold;
                                border: 2px solid ${currentDirection === 'btt' ? '#22c55e' : '#4b5563'};
                                background: ${currentDirection === 'btt' ? '#22c55e' : '#374151'};
                                color: white;
                            ">
                        <i class="fas fa-arrow-up"></i> B→H
                    </button>
                    ${currentDirection ? `
                        <span style="
                            margin-left: auto;
                            padding: 4px 10px;
                            background: #22c55e;
                            border-radius: 20px;
                            font-size: 11px;
                            font-weight: bold;
                            color: white;
                        ">
                            <i class="fas fa-check"></i> ${directionArrow} Module 1 ${currentDirection === 'ltr' ? 'à GAUCHE' : currentDirection === 'rtl' ? 'à DROITE' : currentDirection === 'ttb' ? 'en HAUT' : 'en BAS'}
                        </span>
                    ` : `
                        <span style="
                            margin-left: auto;
                            padding: 4px 10px;
                            background: #f97316;
                            border-radius: 20px;
                            font-size: 11px;
                            font-weight: bold;
                            color: white;
                        ">
                            <i class="fas fa-exclamation-triangle"></i> Définir le sens !
                        </span>
                    `}
                </div>
                
                <!-- INDICATEUR VISUEL DU SENS -->
                <div class="cable-visual-indicator" style="
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 5px 10px;
                    background: ${currentDirection ? '#1e3a1e' : '#3a2a1e'};
                    border-radius: 6px;
                    margin-bottom: 8px;
                    font-size: 12px;
                ">
                    ${currentDirection === 'ltr' || currentDirection === 'rtl' ? `
                        <span style="color: ${currentDirection === 'ltr' ? '#4ade80' : '#9ca3af'}; font-weight: bold;">
                            ${currentDirection === 'ltr' ? '🟢 M1' : 'M${total}'}
                        </span>
                        <span style="color: #6b7280; flex-grow: 1; text-align: center;">
                            ${currentDirection === 'ltr' ? '━━━━━━━━━━━━━━━━━━━━━━━━━━▶' : '◀━━━━━━━━━━━━━━━━━━━━━━━━━━'}
                        </span>
                        <span style="color: ${currentDirection === 'rtl' ? '#4ade80' : '#9ca3af'}; font-weight: bold;">
                            ${currentDirection === 'rtl' ? '🟢 M1' : 'M${total}'}
                        </span>
                    ` : currentDirection === 'ttb' || currentDirection === 'btt' ? `
                        <span style="color: #6b7280; width: 100%; text-align: center;">
                            ${currentDirection === 'ttb' ? '🟢 M1 en HAUT ↓↓↓ M' + total + ' en BAS' : '🟢 M1 en BAS ↑↑↑ M' + total + ' en HAUT'}
                        </span>
                    ` : `
                        <span style="color: #f97316; width: 100%; text-align: center;">
                            ⚠️ Cliquez sur un sens de câblage ci-dessus
                        </span>
                    `}
                </div>
                
                <div class="modules-grid" style="${currentDirection === 'rtl' ? 'direction: rtl;' : ''}">
        `

        // Modules de la string (inversés si rtl)
        const displayModules = currentDirection === 'rtl' ? [...stringModules].reverse() : stringModules
        
        displayModules.forEach((module, index) => {
            const statusClass = `module-${module.status}`
            const isFirst = (currentDirection === 'rtl') ? (index === stringModules.length - 1) : (index === 0)
            const isLast = (currentDirection === 'rtl') ? (index === 0) : (index === stringModules.length - 1)
            
            // Indicateur de position pour le premier et dernier module
            const posIndicator = isFirst ? '🟢' : (isLast ? '🔴' : '')
            
            html += `
                <button class="module-btn ${statusClass} touch-optimized" 
                        data-module-id="${module.module_id}"
                        data-string="${module.string_number}"
                        style="${isFirst ? 'box-shadow: 0 0 0 3px #22c55e;' : ''} ${isLast ? 'box-shadow: 0 0 0 3px #ef4444;' : ''}"
                        title="${module.module_id} - ${this.getStatusLabel(module.status)}${module.comment ? ' - ' + module.comment : ''}${isFirst ? ' (DÉBUT STRING)' : ''}${isLast ? ' (FIN STRING)' : ''}">
                    ${posIndicator}${module.module_id.includes('-') ? module.module_id.split('-')[1] : module.module_id.substring(1)}
                </button>
            `
        })

        html += `
                </div>
            </div>
        `

        return html
    }

    renderPhysicalGrid() {
        const allModules = Array.from(this.modules.values())
        
        if (allModules.length === 0) return '<p>Aucun module trouvé</p>'

        // Tri par position physique
        const sortedModules = allModules.sort((a, b) => {
            if (a.physical_row !== b.physical_row) {
                return (a.physical_row || 0) - (b.physical_row || 0)
            }
            return (a.physical_col || 0) - (b.physical_col || 0)
        })

        // Déterminer dimensions grille
        const maxRow = Math.max(...sortedModules.map(m => m.physical_row || 0))
        const maxCol = Math.max(...sortedModules.map(m => m.physical_col || 0))
        const minRow = Math.min(...sortedModules.map(m => m.physical_row || 0))
        const minCol = Math.min(...sortedModules.map(m => m.physical_col || 0))

        // Créer grille vide
        const grid = []
        for (let row = maxRow; row >= minRow; row--) {
            const gridRow = []
            for (let col = minCol; col <= maxCol; col++) {
                gridRow.push(null)
            }
            grid.push(gridRow)
        }

        // Placer modules
        sortedModules.forEach(module => {
            const row = module.physical_row || 0
            const col = module.physical_col || 0
            const gridRowIndex = maxRow - row
            const gridColIndex = col - minCol
            
            if (grid[gridRowIndex] && grid[gridRowIndex][gridColIndex] !== undefined) {
                grid[gridRowIndex][gridColIndex] = module
            }
        })

        // Génération HTML
        let html = `
            <div class="physical-grid-container">
                <div class="physical-grid-header">
                    <h3><i class="fas fa-th mr-2"></i>Vue Calepinage Toiture</h3>
                    <p class="text-sm text-gray-600">Représentation fidèle au plan physique</p>
                </div>
                <div class="physical-modules-grid" style="
                    display: grid; 
                    grid-template-columns: repeat(${maxCol - minCol + 1}, 50px);
                    gap: 4px;
                    padding: 20px;
                    background: #f8fafc;
                    border-radius: 12px;
                    border: 2px dashed #cbd5e1;
                    justify-content: center;
                    max-width: fit-content;
                    margin: 0 auto;
                ">
        `

        grid.forEach((row, rowIndex) => {
            row.forEach((module, colIndex) => {
                if (module) {
                    const statusClass = `module-${module.status}`
                    const isSelected = this.selectedModules.has(module.module_id)
                    html += `
                        <button class="module-btn ${statusClass} ${isSelected ? 'selected' : ''} touch-optimized physical-module" 
                                data-module-id="${module.module_id}"
                                data-string="${module.string_number}"
                                style="width: 46px; height: 36px; font-size: 10px;"
                                title="String ${module.string_number} - ${module.module_id}${module.comment ? ' - ' + module.comment : ''}">
                            ${module.module_id.includes('-') ? module.module_id.split('-')[1] : module.module_id.substring(1)}
                        </button>
                    `
                } else {
                    html += `<div class="module-empty" style="width: 46px; height: 36px;"></div>`
                }
            })
        })

        html += '</div></div>'
        return html
    }

    setViewMode(mode) {
        this.viewMode = mode
        this.renderModulesGrid()
        logAudit('🔄 Mode d\'affichage changé:', mode)
    }

    setupEventListeners() {
        // Navigation strings
        document.getElementById('stringNavigation').addEventListener('click', (e) => {
            if (e.target.classList.contains('string-nav-btn')) {
                const stringFilter = e.target.dataset.string
                this.currentStringFilter = stringFilter === 'all' ? 'all' : parseInt(stringFilter)
                this.renderStringNavigation()
                this.renderModulesGrid()
            }
        })

        // Clic modules
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('module-btn')) {
                const moduleId = e.target.getAttribute('data-module-id')
                logAudit('🎯 Module cliqué:', moduleId, 'Mode:', this.multiSelectMode ? 'Sélection' : 'Normal')
                
                if (moduleId) {
                    if (this.multiSelectMode) {
                        this.toggleModuleSelection(moduleId, e.target)
                    } else {
                        this.openModuleModal(moduleId)
                    }
                } else {
                    errorAudit('❌ Pas de module-id trouvé sur:', e.target)
                }
            }
        })

        // Modal diagnostic
        this.setupModalEvents()

        // Boutons header
        document.getElementById('measureBtn').addEventListener('click', () => this.showMeasuresModal())
        document.getElementById('reportBtn').addEventListener('click', () => this.generateReport())
        document.getElementById('shareBtn').addEventListener('click', () => this.shareAudit())
        document.getElementById('editAuditBtn').addEventListener('click', () => this.showEditAuditModal())
        document.getElementById('configBtn').addEventListener('click', () => this.showConfigModal())

        // Sélection multiple
        this.setupMultiSelectEvents()

        // Raccourcis clavier tactile
        document.addEventListener('keydown', (e) => this.handleKeyboard(e))

        // Gestion toucher/glisser pour navigation rapide
        this.setupTouchGestures()
    }

    // ============================================================================
    // ASSISTANT VOCAL (PUSH-TO-TALK)
    // ============================================================================
    
    setupVoiceAssistant() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            this.showAlert("Assistant vocal non supporté sur ce navigateur", "warning")
            return
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        this.recognition = new SpeechRecognition()
        this.recognition.lang = 'fr-FR'
        this.recognition.continuous = false // Arrête d'écouter quand on lâche
        this.recognition.interimResults = false

        const btn = document.getElementById('voiceAssistantBtn')
        
        // PUSH-TO-TALK LOGIC
        
        // 1. Appui (Start)
        const startListening = (e) => {
            e.preventDefault()
            if (this.isListening) return
            
            try {
                this.recognition.start()
                this.isListening = true
                btn.classList.add('listening-mode')
                btn.innerHTML = '<i class="fas fa-wave-square text-3xl"></i>'
                // Petit retour haptique
                if (navigator.vibrate) navigator.vibrate(50)
            } catch (err) {
                console.error("Erreur start voice:", err)
            }
        }

        // 2. Relâchement (Stop)
        const stopListening = (e) => {
            e.preventDefault()
            if (!this.isListening) return
            
            this.recognition.stop()
            this.isListening = false
            btn.classList.remove('listening-mode')
            btn.innerHTML = '<i class="fas fa-microphone text-3xl"></i>'
        }

        // Mouse events
        btn.addEventListener('mousedown', startListening)
        btn.addEventListener('mouseup', stopListening)
        btn.addEventListener('mouseleave', stopListening) // Si on sort du bouton

        // Touch events (Mobile)
        btn.addEventListener('touchstart', startListening)
        btn.addEventListener('touchend', stopListening)

        // 3. Résultat
        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.toLowerCase().trim()
            logAudit('🎤 Voix reçue:', transcript)
            this.processVoiceCommand(transcript)
        }

        this.recognition.onerror = (event) => {
            logAudit('🎤 Erreur voix:', event.error)
            this.isListening = false
            btn.classList.remove('listening-mode')
            btn.innerHTML = '<i class="fas fa-microphone-slash text-3xl"></i>'
            setTimeout(() => btn.innerHTML = '<i class="fas fa-microphone text-3xl"></i>', 1000)
        }
    }

    processVoiceCommand(text) {
        // Nettoyage texte (suppression "euuuh", ponctuation)
        text = text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
        
        // Regex pour détecter commande de grille : "String 2 Panneau 6 HS"
        // Accepte: "String 2", "Chaîne 2", "Rangée 2" ... "Panneau 6", "Module 6"
        const gridRegex = /(string|chaîne|rangée)\s*(\d+).*?(panneau|module)\s*(\d+)\s*(.*)/i
        const match = text.match(gridRegex)

        if (match) {
            // MODE SNIPER (COMMANDE GRILLE)
            const stringNum = parseInt(match[2])
            const modulePos = parseInt(match[4])
            const command = match[5].trim()

            // Trouver le module ID correspondant
            const module = Array.from(this.modules.values()).find(m => 
                m.string_number === stringNum && 
                m.position_in_string === modulePos
            )

            if (module) {
                // Déduire statut
                const status = this.parseVoiceStatus(command)
                if (status) {
                    // Action !
                    this.selectedModule = module
                    this.selectedStatus = status
                    
                    // Simuler validation (ajouter commentaire auto ?)
                    document.getElementById('moduleComment').value = "Commande vocale: " + command
                    this.validateModuleStatus() // Utilise la fonction existante robuste
                    
                    this.showAlert(`🎤 S${stringNum}.${modulePos} → ${command.toUpperCase()}`, 'success')
                } else {
                    this.showAlert(`❓ Statut "${command}" non reconnu`, 'warning')
                }
            } else {
                this.showAlert(`❌ Module S${stringNum} P${modulePos} introuvable`, 'error')
            }

        } else {
            // MODE DICTAPHONE (NOTE GÉNÉRALE)
            // Tout ce qui n'est pas une commande grille est une note
            this.addGeneralVoiceNote(text)
        }
    }

    parseVoiceStatus(command) {
        if (command.includes('hs') || command.includes('mort') || command.includes('dead') || command.includes('cassé')) return 'dead'
        if (command.includes('inégalité') || command.includes('jaune') || command.includes('différence')) return 'inequality'
        if (command.includes('micro') || command.includes('fissure') || command.includes('orange')) return 'microcracks'
        if (command.includes('ouvert') || command.includes('coupé') || command.includes('bleu')) return 'string_open'
        if (command.includes('ok') || command.includes('bon') || command.includes('ras') || command.includes('vert')) return 'ok'
        return null
    }

    async addGeneralVoiceNote(text) {
        logAudit('📝 Note vocale détectée:', text)
        this.showAlert('⏳ Enregistrement note...', 'info')
        
        try {
            const response = await fetch(`/api/el/audit/${this.auditToken}/notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: text,
                    technicianId: this.technicianId
                })
            })

            if (!response.ok) throw new Error('Erreur sauvegarde note')

            this.showAlert(`📝 Note enregistrée : "${text}"`, 'success')
            
            // Feedback sonore
            if (window.speechSynthesis) {
                const utterance = new SpeechSynthesisUtterance("Note enregistrée");
                utterance.lang = 'fr-FR';
                window.speechSynthesis.speak(utterance);
            }

        } catch (err) {
            errorAudit('Erreur note vocale:', err)
            // Fallback localStorage en cas d'erreur réseau
            let notes = JSON.parse(localStorage.getItem(`voice_notes_${this.auditToken}`) || '[]')
            notes.push({
                text: text,
                date: new Date().toISOString(),
                technician: this.technicianId,
                synced: false
            })
            localStorage.setItem(`voice_notes_${this.auditToken}`, JSON.stringify(notes))
            this.showAlert(`💾 Note sauvegardée HORS LIGNE`, 'warning')
        }
    }

    // ============================================================================
    // FIN ASSISTANT VOCAL
    // ============================================================================

    // ============================================================================
    // PANNEAU NOTES VOCALES
    // ============================================================================
    
    renderNotesPanel() {
        // Créer le panneau notes s'il n'existe pas
        if (document.getElementById('notesPanel')) return
        
        const panel = document.createElement('div')
        panel.id = 'notesPanel'
        panel.className = 'fixed top-20 right-4 w-80 max-h-96 bg-gray-900 border-2 border-blue-400 rounded-lg shadow-2xl z-40 hidden'
        panel.innerHTML = `
            <div class="bg-blue-600 px-4 py-2 rounded-t-lg flex items-center justify-between">
                <h3 class="font-bold text-white"><i class="fas fa-sticky-note mr-2"></i>Notes vocales</h3>
                <div class="flex items-center gap-2">
                    <span id="notesCount" class="bg-blue-800 px-2 py-0.5 rounded text-xs">0</span>
                    <button id="closeNotesPanel" class="text-white hover:text-gray-300">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div id="notesList" class="p-3 overflow-y-auto max-h-72 space-y-2">
                <p class="text-gray-500 text-center text-sm">Aucune note</p>
            </div>
            <div class="p-3 border-t border-gray-700">
                <div class="flex gap-2">
                    <input type="text" id="newNoteInput" placeholder="Ajouter une note..." 
                           class="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none">
                    <button id="addNoteBtn" class="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-white">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
        `
        document.body.appendChild(panel)
        
        // Event listeners
        document.getElementById('closeNotesPanel').addEventListener('click', () => this.toggleNotesPanel(false))
        document.getElementById('addNoteBtn').addEventListener('click', () => this.addManualNote())
        document.getElementById('newNoteInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addManualNote()
        })
        
        // Bouton pour ouvrir le panneau (ajouté à côté du micro)
        this.renderNotesToggleButton()
    }
    
    renderNotesToggleButton() {
        const btn = document.createElement('button')
        btn.id = 'notesToggleBtn'
        btn.className = 'fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-purple-600 text-white shadow-xl flex items-center justify-center transition-all hover:bg-purple-700 border-2 border-white'
        btn.innerHTML = '<i class="fas fa-sticky-note text-xl"></i>'
        btn.title = "Voir les notes"
        btn.addEventListener('click', () => this.toggleNotesPanel())
        document.body.appendChild(btn)
    }
    
    toggleNotesPanel(forceState) {
        const panel = document.getElementById('notesPanel')
        if (!panel) return
        
        const isHidden = panel.classList.contains('hidden')
        const shouldShow = forceState !== undefined ? forceState : isHidden
        
        if (shouldShow) {
            panel.classList.remove('hidden')
            this.loadNotes()
        } else {
            panel.classList.add('hidden')
        }
    }
    
    async loadNotes() {
        try {
            const response = await fetch(`/api/el/audit/${this.auditToken}/notes`)
            const data = await response.json()
            
            this.notes = data.notes || []
            
            // Ajouter notes hors-ligne non synchronisées
            const offlineNotes = JSON.parse(localStorage.getItem(`voice_notes_${this.auditToken}`) || '[]')
            offlineNotes.forEach(n => {
                if (!n.synced) {
                    this.notes.unshift({ ...n, content: n.text, offline: true })
                }
            })
            
            this.renderNotesList()
        } catch (err) {
            errorAudit('Erreur chargement notes:', err)
        }
    }
    
    renderNotesList() {
        const container = document.getElementById('notesList')
        const countEl = document.getElementById('notesCount')
        
        if (!this.notes || this.notes.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center text-sm py-4">Aucune note</p>'
            countEl.textContent = '0'
            return
        }
        
        countEl.textContent = this.notes.length
        
        container.innerHTML = this.notes.map((note, index) => `
            <div class="bg-gray-800 rounded p-3 group relative ${note.offline ? 'border-l-4 border-yellow-500' : ''}">
                <div class="flex items-start justify-between gap-2">
                    <p class="text-sm text-white flex-1">${this.escapeHtml(note.content)}</p>
                    <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button class="text-blue-400 hover:text-blue-300 text-xs p-1" onclick="window.diagpvAudit.editNote(${note.id || index}, '${this.escapeHtml(note.content).replace(/'/g, "\\'")}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="text-red-400 hover:text-red-300 text-xs p-1" onclick="window.diagpvAudit.deleteNote(${note.id || index})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <span>${note.created_at ? new Date(note.created_at).toLocaleString('fr-FR') : 'Non sync'}</span>
                    ${note.offline ? '<span class="text-yellow-500"><i class="fas fa-wifi-slash mr-1"></i>Hors-ligne</span>' : ''}
                </div>
            </div>
        `).join('')
    }
    
    escapeHtml(text) {
        const div = document.createElement('div')
        div.textContent = text
        return div.innerHTML
    }
    
    async addManualNote() {
        const input = document.getElementById('newNoteInput')
        const content = input.value.trim()
        
        if (!content) return
        
        try {
            const response = await fetch(`/api/el/audit/${this.auditToken}/notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: content,
                    technicianId: this.technicianId
                })
            })
            
            if (!response.ok) throw new Error('Erreur sauvegarde')
            
            input.value = ''
            this.showAlert('📝 Note ajoutée', 'success')
            await this.loadNotes()
            
        } catch (err) {
            errorAudit('Erreur ajout note:', err)
            this.showAlert('Erreur ajout note', 'error')
        }
    }
    
    async editNote(noteId, currentContent) {
        const newContent = prompt('Modifier la note:', currentContent)
        
        if (newContent === null || newContent === currentContent) return
        
        try {
            const response = await fetch(`/api/el/audit/${this.auditToken}/notes/${noteId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newContent })
            })
            
            if (!response.ok) throw new Error('Erreur modification')
            
            this.showAlert('📝 Note modifiée', 'success')
            await this.loadNotes()
            
        } catch (err) {
            errorAudit('Erreur modification note:', err)
            this.showAlert('Erreur modification', 'error')
        }
    }
    
    async deleteNote(noteId) {
        if (!confirm('Supprimer cette note ?')) return
        
        try {
            const response = await fetch(`/api/el/audit/${this.auditToken}/notes/${noteId}`, {
                method: 'DELETE'
            })
            
            if (!response.ok) throw new Error('Erreur suppression')
            
            this.showAlert('🗑️ Note supprimée', 'success')
            await this.loadNotes()
            
        } catch (err) {
            errorAudit('Erreur suppression note:', err)
            this.showAlert('Erreur suppression', 'error')
        }
    }
    
    // ============================================================================
    // FIN PANNEAU NOTES
    // ============================================================================

    openModuleModal(moduleId) {
        logAudit('📝 Ouverture modal pour module:', moduleId)
        
        if (!moduleId) {
            errorAudit('❌ Module ID manquant')
            return
        }
        
        const module = this.modules.get(moduleId)
        if (!module) {
            errorAudit('❌ Module non trouvé:', moduleId, 'Modules disponibles:', Array.from(this.modules.keys()).slice(0, 5))
            return
        }

        this.selectedModule = module

        // Mise à jour titre modal
        document.getElementById('modalTitle').textContent = `MODULE ${moduleId}`
        
        // Pré-sélection statut actuel
        document.querySelectorAll('.module-status-btn').forEach(btn => {
            btn.classList.remove('selected')
            if (btn.dataset.status === module.status) {
                btn.classList.add('selected')
            }
        })

        // Commentaire existant
        document.getElementById('moduleComment').value = module.comment || ''

        // Affichage modal
        document.getElementById('moduleModal').classList.remove('hidden')
        
        // Focus sur premier bouton pour navigation clavier
        document.querySelector('.module-status-btn').focus()
    }

    setupModalEvents() {
        const modal = document.getElementById('moduleModal')
        
        // Sélection statut
        document.querySelectorAll('.module-status-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.module-status-btn').forEach(b => b.classList.remove('selected'))
                btn.classList.add('selected')
                this.selectedStatus = btn.dataset.status
            })
        })

        // Validation
        document.getElementById('validateBtn').addEventListener('click', () => {
            this.validateModuleStatus()
        })

        // Annulation
        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.closeModal()
        })

        // Fermeture ESC ou clic extérieur
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal()
            }
        })
        
        // Bouton micro - Reconnaissance vocale
        this.setupVoiceRecognition()

        // Configuration modal édition audit
        this.setupEditModalEvents()
        
        // Configuration modal config technique
        this.setupConfigModalEvents()
    }

    setupEditModalEvents() {
        const editModal = document.getElementById('editAuditModal')
        const editForm = document.getElementById('editAuditForm')
        
        // Soumission formulaire édition
        editForm.addEventListener('submit', (e) => {
            e.preventDefault()
            
            const formData = {
                project_name: document.getElementById('editProjectName').value.trim(),
                client_name: document.getElementById('editClientName').value.trim(),
                location: document.getElementById('editLocation').value.trim()
            }
            
            if (!formData.project_name || !formData.client_name || !formData.location) {
                this.showAlert('Tous les champs sont requis', 'error')
                return
            }
            
            this.saveAuditChanges(formData)
        })

        // Annulation édition
        document.getElementById('cancelEditBtn').addEventListener('click', () => {
            this.closeEditAuditModal()
        })

        // Fermeture ESC ou clic extérieur  
        editModal.addEventListener('click', (e) => {
            if (e.target === editModal) {
                this.closeEditAuditModal()
            }
        })

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
                this.closeModal()
            }
        })
    }

    setupConfigModalEvents() {
        const configModal = document.getElementById('configModal')
        const configForm = document.getElementById('configForm')
        
        // Liste temporaire des strings à ajouter
        this.stringsToAdd = []
        
        // Bouton ajout string
        document.getElementById('addStringBtn').addEventListener('click', () => {
            const stringNumber = parseInt(document.getElementById('addStringNumber').value)
            const moduleCount = parseInt(document.getElementById('addStringModuleCount').value)
            const startPos = parseInt(document.getElementById('addStringStartPos').value) || 1
            
            if (!stringNumber || !moduleCount) {
                this.showAlert('Veuillez renseigner le N° string et le nombre de modules', 'warning')
                return
            }
            
            if (stringNumber < 1 || stringNumber > 50) {
                this.showAlert('N° String doit être entre 1 et 50', 'error')
                return
            }
            
            if (moduleCount < 1 || moduleCount > 100) {
                this.showAlert('Nombre de modules doit être entre 1 et 100', 'error')
                return
            }
            
            // Vérifier que le string n'est pas déjà dans la liste
            if (this.stringsToAdd.some(s => s.string_number === stringNumber)) {
                this.showAlert(`String ${stringNumber} déjà dans la liste`, 'warning')
                return
            }
            
            // Ajouter à la liste temporaire
            this.stringsToAdd.push({
                string_number: stringNumber,
                module_count: moduleCount,
                start_position: startPos
            })
            
            // Afficher dans la liste
            this.updateAddedStringsList()
            
            // Reset champs
            document.getElementById('addStringNumber').value = ''
            document.getElementById('addStringModuleCount').value = ''
            document.getElementById('addStringStartPos').value = '1'
            
            this.showAlert(`String ${stringNumber} ajouté (${moduleCount} modules)`, 'success')
            logAudit('✅ String ajouté à la liste:', { stringNumber, moduleCount, startPos })
        })
        
        // Soumission formulaire configuration
        configForm.addEventListener('submit', async (e) => {
            e.preventDefault()
            await this.saveConfigChanges()
        })
        
        // Annulation configuration
        document.getElementById('cancelConfigBtn').addEventListener('click', () => {
            this.closeConfigModal()
        })
        
        // Fermeture ESC ou clic extérieur
        configModal.addEventListener('click', (e) => {
            if (e.target === configModal) {
                this.closeConfigModal()
            }
        })
    }

    updateAddedStringsList() {
        const listDiv = document.getElementById('addedStringsList')
        
        if (this.stringsToAdd.length === 0) {
            listDiv.classList.add('hidden')
            return
        }
        
        listDiv.classList.remove('hidden')
        listDiv.innerHTML = `
            <div class="border-t border-gray-600 pt-2 mt-2">
                <p class="font-bold mb-2">Strings à ajouter :</p>
                ${this.stringsToAdd.map(s => `
                    <div class="flex justify-between items-center bg-gray-700 px-2 py-1 rounded mb-1">
                        <span>String ${s.string_number}: ${s.module_count} modules (début: ${s.start_position})</span>
                        <button type="button" onclick="diagpvAudit.removeStringFromList(${s.string_number})" 
                                class="text-red-400 hover:text-red-300 font-bold">
                            ✕
                        </button>
                    </div>
                `).join('')}
            </div>
        `
    }

    removeStringFromList(stringNumber) {
        this.stringsToAdd = this.stringsToAdd.filter(s => s.string_number !== stringNumber)
        this.updateAddedStringsList()
        logAudit('🗑️ String retiré de la liste:', stringNumber)
    }

    async validateModuleStatus() {
        logAudit('🔍 Validation module - selectedModule:', this.selectedModule)
        logAudit('🔍 Validation module - selectedStatus:', this.selectedStatus)
        
        if (!this.selectedModule || !this.selectedStatus) {
            this.showAlert('Veuillez sélectionner un statut', 'warning')
            return
        }

        if (!this.selectedModule.module_id) {
            errorAudit('❌ Module ID manquant dans selectedModule:', this.selectedModule)
            this.showAlert('Erreur: Module ID manquant', 'error')
            return
        }

        try {
            const comment = document.getElementById('moduleComment').value.trim()
            
            // Sauvegarde des données du module avant l'appel API (évite les références async perdues)
            const moduleId = this.selectedModule.module_id
            const selectedModule = { ...this.selectedModule } // copie de sécurité
            const selectedStatus = this.selectedStatus
            
            logAudit('📡 Mise à jour module:', moduleId, '→', selectedStatus)
            
            // API update
            const updateData = {
                status: selectedStatus,
                comment: comment || null,
                technicianId: this.technicianId
            }

            // Stratégie "Optimistic UI" avec gestion Offline
            const applyLocalUpdate = () => {
                selectedModule.status = selectedStatus
                selectedModule.comment = comment || null
                selectedModule.technician_id = this.technicianId
                selectedModule.updated_at = new Date().toISOString()

                this.modules.set(moduleId, selectedModule)
                this.updateModuleButton(moduleId)
                this.updateProgress()
                this.renderStringNavigation()
                this.saveOfflineData()
                this.closeModal()
            }

            const response = await fetch(`/api/el/audit/${this.auditToken}/module/${moduleId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            })

            // Si le serveur renvoie 503 (Mode Offline détecté par SW) ou une autre erreur
            if (!response.ok) {
                // Gestion spécifique mode Offline (503 ou erreur réseau attrapée plus bas)
                if (response.status === 503) {
                    throw new Error('OFFLINE_MODE')
                }
                
                let errorData
                try {
                    const json = await response.json()
                    errorData = json.error || json.details || JSON.stringify(json)
                } catch {
                    errorData = await response.text()
                }
                throw new Error(`Erreur ${response.status}: ${errorData}`)
            }

            // Succès serveur
            applyLocalUpdate()
            this.showAlert(`Module ${moduleId} mis à jour`, 'success')
            logAudit('✅ Module mis à jour (Serveur):', moduleId, '→', selectedStatus)

        } catch (err) {
            // Gestion erreur (Offline ou autre)
            const isOffline = err.message === 'OFFLINE_MODE' || !navigator.onLine
            
            if (isOffline) {
                // Mode Offline : on applique l'update localement et on met en file d'attente
                const updateData = {
                    status: this.selectedStatus,
                    comment: document.getElementById('moduleComment').value.trim() || null,
                    technicianId: this.technicianId
                }
                
                // Appliquer l'update localement (Optimistic UI)
                const moduleId = this.selectedModule.module_id
                const selectedModule = this.modules.get(moduleId)
                if (selectedModule) {
                    selectedModule.status = this.selectedStatus
                    selectedModule.comment = updateData.comment
                    selectedModule.technician_id = this.technicianId
                    selectedModule.updated_at = new Date().toISOString()
                    
                    this.updateModuleButton(moduleId)
                    this.updateProgress()
                    this.renderStringNavigation()
                    this.saveOfflineData()
                }
                
                this.queueOfflineUpdate(updateData)
                this.closeModal()
                this.showAlert('Sauvegardé hors ligne 💾', 'warning')
                logAudit('💾 Module mis à jour (Offline):', moduleId)
            } else {
                errorAudit('Erreur validation module:', err)
                this.showAlert('Erreur: ' + err.message, 'error')
            }
        }
    }

    updateModuleButton(moduleId) {
        logAudit('🔄 Mise à jour bouton module:', moduleId)
        
        if (!moduleId) {
            errorAudit('❌ Module ID manquant pour mise à jour bouton')
            return
        }
        
        const btn = document.querySelector(`[data-module-id="${moduleId}"]`)
        if (!btn) {
            errorAudit('❌ Bouton module non trouvé:', moduleId)
            return
        }

        const module = this.modules.get(moduleId)
        if (!module) {
            errorAudit('❌ Module non trouvé dans Map:', moduleId)
            return
        }
        
        // Suppression anciennes classes statut
        btn.className = btn.className.replace(/module-\w+/g, '')
        
        // Ajout nouvelle classe
        btn.classList.add(`module-${module.status}`)
        
        // Mise à jour titre tooltip
        btn.title = `${moduleId} - ${this.getStatusLabel(module.status)}${module.comment ? ' - ' + module.comment : ''}`

        // Animation visuelle
        btn.style.transform = 'scale(1.1)'
        setTimeout(() => {
            btn.style.transform = 'scale(1)'
        }, 200)
    }

    updateProgress() {
        const totalModules = this.modules.size
        const completedModules = Array.from(this.modules.values())
            .filter(m => m.status !== 'pending').length

        document.getElementById('progress').textContent = `${completedModules}/${totalModules}`

        // Statistiques détaillées
        const stats = this.calculateStats()
        logAudit('📊 Progression:', stats)
    }

    calculateStats() {
        const modules = Array.from(this.modules.values())
        
        return {
            total: modules.length,
            completed: modules.filter(m => m.status !== 'pending').length,
            ok: modules.filter(m => m.status === 'ok').length,
            inequality: modules.filter(m => m.status === 'inequality').length,
            microcracks: modules.filter(m => m.status === 'microcracks').length,
            dead: modules.filter(m => m.status === 'dead').length,
            string_open: modules.filter(m => m.status === 'string_open').length,
            not_connected: modules.filter(m => m.status === 'not_connected').length
        }
    }

    setupRealtimeSync() {
        // Server-Sent Events pour collaboration temps réel
        if (typeof EventSource !== 'undefined') {
            this.eventSource = new EventSource(`/api/el/audit/${this.auditToken}/stream`)
            
            this.eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data)
                    if (data.type !== 'ping') {
                        this.handleRealtimeUpdate(data)
                    }
                } catch (err) {
                    errorAudit('Erreur parsing SSE:', err)
                }
            }

            this.eventSource.onerror = () => {
                logAudit('⚠️ Connexion temps réel interrompue')
                // Reconnexion automatique après 5s
                setTimeout(() => this.setupRealtimeSync(), 5000)
            }
        }

        // Simulation indicateur techniciens connectés
        this.updateTechniciansIndicator()
    }

    handleRealtimeUpdate(data) {
        if (data.moduleId && data.status && data.technicianId !== this.technicianId) {
            // Mise à jour module par autre technicien
            const module = this.modules.get(data.moduleId)
            if (module) {
                module.status = data.status
                this.updateModuleButton(data.moduleId)
                
                this.showAlert(`${data.moduleId} mis à jour par autre technicien`, 'info')
            }
        }
    }

    updateTechniciansIndicator() {
        // Simulation 2-3 techniciens connectés
        const count = 2 + Math.floor(Math.random() * 2)
        document.getElementById('technicians').textContent = `${count}/4`
        document.getElementById('technicianIcons').textContent = '👤'.repeat(count)
    }

    // =============================================
    // RECONNAISSANCE VOCALE
    // =============================================
    setupVoiceRecognition() {
        const voiceBtn = document.getElementById('voiceBtn')
        const voiceIndicator = document.getElementById('voiceIndicator')
        const commentInput = document.getElementById('moduleComment')
        
        if (!voiceBtn) return
        
        // Vérifier support Web Speech API
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        
        if (!SpeechRecognition) {
            voiceBtn.title = "Reconnaissance vocale non supportée par ce navigateur"
            voiceBtn.classList.add('opacity-50')
            voiceBtn.disabled = true
            return
        }
        
        this.recognition = new SpeechRecognition()
        this.recognition.continuous = false
        this.recognition.interimResults = true
        this.recognition.lang = 'fr-FR'
        this.isRecording = false
        
        // Événement clic sur bouton micro
        voiceBtn.addEventListener('click', () => {
            if (this.isRecording) {
                this.stopVoiceRecording()
            } else {
                this.startVoiceRecording()
            }
        })
        
        // Résultats reconnaissance
        this.recognition.onresult = (event) => {
            let transcript = ''
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript
            }
            commentInput.value = transcript
            logAudit('🎤 Transcription:', transcript)
        }
        
        // Fin reconnaissance
        this.recognition.onend = () => {
            this.stopVoiceRecording()
        }
        
        // Erreur
        this.recognition.onerror = (event) => {
            errorAudit('🎤 Erreur reconnaissance vocale:', event.error)
            this.stopVoiceRecording()
            
            if (event.error === 'not-allowed') {
                this.showAlert('Accès au microphone refusé. Autorisez le micro dans les paramètres du navigateur.', 'error')
            } else if (event.error === 'no-speech') {
                this.showAlert('Aucune voix détectée. Réessayez.', 'warning')
            } else {
                this.showAlert('Erreur reconnaissance vocale: ' + event.error, 'error')
            }
        }
    }
    
    startVoiceRecording() {
        const voiceBtn = document.getElementById('voiceBtn')
        const voiceIndicator = document.getElementById('voiceIndicator')
        
        if (!this.recognition) return
        
        try {
            this.recognition.start()
            this.isRecording = true
            
            // UI état enregistrement
            voiceBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700', 'border-blue-400')
            voiceBtn.classList.add('bg-red-600', 'hover:bg-red-700', 'border-red-400', 'animate-pulse')
            voiceBtn.innerHTML = '<i class="fas fa-stop text-xl"></i>'
            
            if (voiceIndicator) {
                voiceIndicator.classList.remove('hidden')
            }
            
            logAudit('🎤 Enregistrement démarré')
        } catch (err) {
            errorAudit('🎤 Erreur démarrage:', err)
        }
    }
    
    stopVoiceRecording() {
        const voiceBtn = document.getElementById('voiceBtn')
        const voiceIndicator = document.getElementById('voiceIndicator')
        
        if (this.recognition && this.isRecording) {
            try {
                this.recognition.stop()
            } catch (e) {}
        }
        
        this.isRecording = false
        
        // UI état normal
        if (voiceBtn) {
            voiceBtn.classList.remove('bg-red-600', 'hover:bg-red-700', 'border-red-400', 'animate-pulse')
            voiceBtn.classList.add('bg-blue-600', 'hover:bg-blue-700', 'border-blue-400')
            voiceBtn.innerHTML = '<i class="fas fa-microphone text-xl"></i>'
        }
        
        if (voiceIndicator) {
            voiceIndicator.classList.add('hidden')
        }
        
        logAudit('🎤 Enregistrement arrêté')
    }

    setupOfflineSupport() {
        // Chargement données offline existantes
        this.loadOfflineData()

        // Sync automatique au retour online
        window.addEventListener('online', () => {
            this.syncOfflineQueue()
        })

        // Sauvegarde périodique
        setInterval(() => {
            this.saveOfflineData()
        }, 30000) // Toutes les 30 secondes
    }

    saveOfflineData() {
        const data = {
            auditToken: this.auditToken,
            auditData: this.auditData,
            modules: Array.from(this.modules.entries()),
            lastSync: Date.now()
        }
        
        localStorage.setItem(`diagpv_audit_${this.auditToken}`, JSON.stringify(data))
    }

    loadOfflineData() {
        const data = localStorage.getItem(`diagpv_audit_${this.auditToken}`)
        if (data) {
            const parsed = JSON.parse(data)
            logAudit('📱 Données offline chargées:', parsed.lastSync)
        }
    }

    queueOfflineUpdate(updateData) {
        this.offlineQueue.push({
            ...updateData,
            moduleId: this.selectedModule.module_id,
            timestamp: Date.now()
        })
        logAudit('📤 Queued offline:', this.offlineQueue.length, 'updates')
    }

    async syncOfflineQueue() {
        if (this.offlineQueue.length === 0) return

        logAudit('🔄 Sync offline queue:', this.offlineQueue.length, 'items')
        
        for (const update of this.offlineQueue) {
            try {
                await fetch(`/api/el/audit/${this.auditToken}/module/${update.moduleId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(update)
                })
            } catch (err) {
                errorAudit('Erreur sync offline:', err)
                break
            }
        }

        this.offlineQueue = []
        this.showAlert('Données synchronisées avec succès', 'success')
    }

    setupTouchGestures() {
        let startX, startY
        
        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX
            startY = e.touches[0].clientY
        })

        document.addEventListener('touchend', (e) => {
            if (!startX || !startY) return

            const endX = e.changedTouches[0].clientX
            const endY = e.changedTouches[0].clientY
            
            const deltaX = endX - startX
            const deltaY = endY - startY

            // Swipe horizontal pour navigation strings
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 100) {
                if (deltaX > 0) {
                    this.navigateString('prev')
                } else {
                    this.navigateString('next')
                }
            }
        })
    }

    navigateString(direction) {
        if (this.currentStringFilter === 'all') return

        const current = this.currentStringFilter
        let next = current

        if (direction === 'next' && current < this.auditData.string_count) {
            next = current + 1
        } else if (direction === 'prev' && current > 1) {
            next = current - 1
        }

        if (next !== current) {
            this.currentStringFilter = next
            this.renderStringNavigation()
            this.renderModulesGrid()
        }
    }

    handleKeyboard(event) {
        // Navigation rapide clavier
        if (event.key === 'ArrowLeft') {
            this.navigateString('prev')
        } else if (event.key === 'ArrowRight') {
            this.navigateString('next')
        }

        // Raccourcis rapides statuts (dans modal)
        if (!document.getElementById('moduleModal').classList.contains('hidden')) {
            const statusKeys = {
                '1': 'ok',
                '2': 'inequality', 
                '3': 'microcracks',
                '4': 'dead',
                '5': 'string_open',
                '6': 'not_connected'
            }

            if (statusKeys[event.key]) {
                const btn = document.querySelector(`[data-status="${statusKeys[event.key]}"]`)
                if (btn) {
                    btn.click()
                }
            }

            // Validation rapide Entrée
            if (event.key === 'Enter') {
                document.getElementById('validateBtn').click()
            }
        }
    }

    async generateReport() {
        try {
            this.showAlert('Génération rapport en cours...', 'info')
            
            // Ouverture rapport dans nouvel onglet
            const reportUrl = `/api/el/audit/${this.auditToken}/report`
            window.open(reportUrl, '_blank')
            
            logAudit('📄 Rapport généré:', reportUrl)
            
        } catch (err) {
            errorAudit('Erreur génération rapport:', err)
            this.showAlert('Erreur génération rapport', 'error')
        }
    }

    shareAudit() {
        const shareUrl = window.location.href
        
        if (navigator.share) {
            navigator.share({
                title: `Audit EL - ${this.auditData.project_name}`,
                text: `Audit électroluminescence en cours`,
                url: shareUrl
            })
        } else {
            // Fallback copie clipboard
            navigator.clipboard.writeText(shareUrl).then(() => {
                this.showAlert('URL copiée dans le presse-papiers', 'success')
            })
        }
    }

    showMeasuresModal() {
        // TODO: Interface upload/visualisation mesures PVserv
        this.showAlert('Interface mesures PVserv en développement', 'info')
    }

    closeModal() {
        document.getElementById('moduleModal').classList.add('hidden')
        this.selectedModule = null
        this.selectedStatus = null
    }

    getStatusLabel(status) {
        const labels = {
            'pending': '⏳ En attente',
            'ok': '🟢 OK',
            'inequality': '🟡 Inégalité',
            'microcracks': '🟠 Microfissures',
            'dead': '🔴 HS',
            'string_open': '🔵 String ouvert',
            'not_connected': '⚫ Non raccordé'
        }
        return labels[status] || status
    }

    generateTechnicianId() {
        let id = localStorage.getItem('diagpv_technician_id')
        if (!id) {
            id = 'tech_' + Math.random().toString(36).substr(2, 8)
            localStorage.setItem('diagpv_technician_id', id)
        }
        return id
    }

    showAlert(message, type = 'info') {
        // Suppression ancienne alerte
        const existingAlert = document.querySelector('.diagpv-alert')
        if (existingAlert) {
            existingAlert.remove()
        }

        // Couleurs selon type
        const colors = {
            success: 'bg-green-600 border-green-500',
            error: 'bg-red-600 border-red-500',
            warning: 'bg-yellow-600 border-yellow-500',
            info: 'bg-blue-600 border-blue-500'
        }

        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-triangle',
            warning: 'fas fa-exclamation-circle',
            info: 'fas fa-info-circle'
        }

        // Création alerte
        const alert = document.createElement('div')
        alert.className = `diagpv-alert fixed top-20 right-4 ${colors[type]} border-2 rounded-lg px-6 py-4 text-white font-bold z-50 max-w-md shadow-lg`
        alert.innerHTML = `
            <div class="flex items-center">
                <i class="${icons[type]} mr-3 text-xl"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-xl hover:text-gray-300">×</button>
            </div>
        `

        document.body.appendChild(alert)

        // Auto-suppression après 4 secondes
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove()
            }
        }, 4000)
    }

    // Affichage modal édition audit
    showEditAuditModal() {
        // Pré-remplissage avec données actuelles
        document.getElementById('editProjectName').value = this.auditData.project_name || ''
        document.getElementById('editClientName').value = this.auditData.client_name || ''
        document.getElementById('editLocation').value = this.auditData.location || ''
        
        // Affichage modal
        document.getElementById('editAuditModal').classList.remove('hidden')
        
        // Focus sur premier champ
        document.getElementById('editProjectName').focus()
    }

    // Fermeture modal édition audit
    closeEditAuditModal() {
        document.getElementById('editAuditModal').classList.add('hidden')
    }

    // Affichage modal configuration technique
    showConfigModal() {
        // Pré-remplissage avec données actuelles
        document.getElementById('configStringCount').value = this.auditData.string_count || ''
        document.getElementById('configPanelPower').value = this.auditData.panel_power || ''
        document.getElementById('configJunctionBoxes').value = this.auditData.junction_boxes || ''
        document.getElementById('configInverterCount').value = this.auditData.inverter_count || ''
        
        // Reset liste strings à ajouter
        this.stringsToAdd = []
        this.updateAddedStringsList()
        
        // Reset champs ajout string
        document.getElementById('addStringNumber').value = ''
        document.getElementById('addStringModuleCount').value = ''
        document.getElementById('addStringStartPos').value = '1'
        
        // Affichage modal
        document.getElementById('configModal').classList.remove('hidden')
        
        // Focus sur premier champ
        document.getElementById('configStringCount').focus()
        
        logAudit('📝 Modal configuration ouverte')
    }

    // Fermeture modal configuration
    closeConfigModal() {
        document.getElementById('configModal').classList.add('hidden')
        this.stringsToAdd = []
        logAudit('❌ Modal configuration fermée')
    }

    // Sauvegarde modifications audit
    async saveAuditChanges(formData) {
        try {
            const response = await fetch(`/api/el/audit/${this.auditToken}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            })

            if (!response.ok) {
                throw new Error('Erreur sauvegarde audit')
            }

            const result = await response.json()
            
            // Mise à jour données locales
            this.auditData.project_name = formData.project_name
            this.auditData.client_name = formData.client_name
            this.auditData.location = formData.location
            
            // Mise à jour affichage titre
            document.getElementById('projectTitle').textContent = formData.project_name
            
            this.closeEditAuditModal()
            this.showAlert('Audit modifié avec succès', 'success')
            
            logAudit('✅ Audit modifié:', formData.project_name)
            
        } catch (err) {
            errorAudit('Erreur modification audit:', err)
            this.showAlert('Erreur lors de la modification', 'error')
        }
    }

    // Sauvegarde modifications configuration technique
    async saveConfigChanges() {
        try {
            // Récupération valeurs formulaire
            const stringCountValue = document.getElementById('configStringCount').value.trim()
            const panelPowerValue = document.getElementById('configPanelPower').value.trim()
            const junctionBoxesValue = document.getElementById('configJunctionBoxes').value.trim()
            const inverterCountValue = document.getElementById('configInverterCount').value.trim()
            
            // Construction objet données à envoyer (seulement les champs modifiés)
            const configData = {}
            
            if (stringCountValue !== '') {
                configData.string_count = parseInt(stringCountValue)
            }
            
            if (panelPowerValue !== '') {
                configData.panel_power = parseInt(panelPowerValue)
            }
            
            if (junctionBoxesValue !== '') {
                configData.junction_boxes = parseInt(junctionBoxesValue)
            }
            
            if (inverterCountValue !== '') {
                configData.inverter_count = parseInt(inverterCountValue)
            }
            
            // Ajout des strings si présents
            if (this.stringsToAdd.length > 0) {
                configData.add_strings = this.stringsToAdd
            }
            
            // Vérifier qu'au moins un champ est modifié
            if (Object.keys(configData).length === 0) {
                this.showAlert('Aucune modification à enregistrer', 'warning')
                return
            }
            
            logAudit('📡 Envoi configuration:', configData)
            
            // Afficher message d'attente
            this.showAlert('⏳ Sauvegarde en cours...', 'info')
            
            // Appel API
            const response = await fetch(`/api/el/audit/${this.auditToken}/configuration`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(configData)
            })
            
            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Erreur sauvegarde configuration')
            }
            
            const result = await response.json()
            
            logAudit('✅ Configuration sauvegardée:', result)
            
            // Fermer modal
            this.closeConfigModal()
            
            // Message succès
            this.showAlert(`✅ Configuration mise à jour ! ${result.updated.strings_added || 0} string(s) ajouté(s)`, 'success')
            
            // Recharger les données de l'audit pour refléter les changements
            logAudit('🔄 Rechargement données audit...')
            await this.loadAuditData()
            
            // Re-rendu complet interface
            this.setupInterface()
            
            logAudit('✅ Interface rechargée avec nouvelle configuration')
            
        } catch (err) {
            errorAudit('❌ Erreur sauvegarde configuration:', err)
            this.showAlert('Erreur: ' + err.message, 'error')
        }
    }

    // Helper pour mise à jour locale
    updateLocalModuleState(moduleId, status, comment) {
        let module = this.modules.get(moduleId)
        if (!module) {
            module = {
                module_id: moduleId,
                status: 'pending',
                comment: null,
                technician_id: this.technicianId,
                updated_at: new Date().toISOString()
            }
            this.modules.set(moduleId, module)
        }
        
        module.status = status
        if (comment) module.comment = comment
        module.updated_at = new Date().toISOString()
        module.technician_id = this.technicianId
        
        // Mise à jour visuelle bouton
        // Note: updateModuleButton fait déjà les checks d'existence
        this.updateModuleButton(moduleId)
    }

    // Cleanup lors fermeture
    destroy() {
        if (this.eventSource) {
            this.eventSource.close()
        }
        this.saveOfflineData()
    }

    // ============================================================================
    // SÉLECTION MULTIPLE POUR AUDIT TERRAIN RAPIDE
    // ============================================================================

    setupMultiSelectEvents() {
        // Bouton activation/désactivation mode sélection
        document.getElementById('multiSelectToggleBtn').addEventListener('click', () => {
            this.toggleMultiSelectMode()
        })

        // Barre d'outils sélection
        document.getElementById('exitMultiSelectBtn').addEventListener('click', () => {
            this.exitMultiSelectMode()
        })

        document.getElementById('selectAllBtn').addEventListener('click', () => {
            this.selectAllVisibleModules()
        })

        document.getElementById('clearSelectionBtn').addEventListener('click', () => {
            this.clearSelection()
        })

        // Actions de lot
        document.querySelectorAll('.bulk-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const status = e.target.getAttribute('data-status')
                this.showBulkActionModal(status)
            })
        })

        // Modal confirmation lot
        document.getElementById('confirmBulkBtn').addEventListener('click', () => {
            this.executeBulkAction()
        })

        document.getElementById('cancelBulkBtn').addEventListener('click', () => {
            this.closeBulkModal()
        })

        // Fermeture modal si clic extérieur
        document.getElementById('bulkActionModal').addEventListener('click', (e) => {
            if (e.target.id === 'bulkActionModal') {
                this.closeBulkModal()
            }
        })
    }

    toggleMultiSelectMode() {
        this.multiSelectMode = !this.multiSelectMode
        logAudit('🔄 Mode sélection multiple:', this.multiSelectMode ? 'ACTIVÉ' : 'DÉSACTIVÉ')

        const toggleBtn = document.getElementById('multiSelectToggleBtn')
        const toolbar = document.getElementById('multiSelectToolbar')

        if (this.multiSelectMode) {
            // Activer mode sélection
            toggleBtn.classList.add('active')
            toggleBtn.innerHTML = '<i class="fas fa-times mr-1"></i>QUITTER SÉLECTION'
            toolbar.classList.remove('hidden')
            
            // Ajouter classe aux modules
            document.querySelectorAll('.module-btn').forEach(btn => {
                btn.classList.add('multi-select-mode')
            })
            
            this.showAlert('Mode sélection multiple activé ! Cliquez sur les modules à modifier ensemble.', 'success')
        } else {
            this.exitMultiSelectMode()
        }
    }

    exitMultiSelectMode() {
        this.multiSelectMode = false
        this.clearSelection()

        const toggleBtn = document.getElementById('multiSelectToggleBtn')
        const toolbar = document.getElementById('multiSelectToolbar')

        toggleBtn.classList.remove('active')
        toggleBtn.innerHTML = '<i class="fas fa-check-square mr-1"></i>SÉLECTION MULTIPLE'
        toolbar.classList.add('hidden')

        // Retirer classes des modules
        document.querySelectorAll('.module-btn').forEach(btn => {
            btn.classList.remove('multi-select-mode', 'selected-for-bulk')
        })

        logAudit('✅ Mode sélection multiple désactivé')
    }

    toggleModuleSelection(moduleId, element) {
        if (this.selectedModules.has(moduleId)) {
            // Désélectionner
            this.selectedModules.delete(moduleId)
            element.classList.remove('selected-for-bulk')
            logAudit('➖ Module désélectionné:', moduleId)
        } else {
            // Sélectionner
            this.selectedModules.add(moduleId)
            element.classList.add('selected-for-bulk')
            logAudit('➕ Module sélectionné:', moduleId)
        }

        this.updateSelectionCount()
    }

    selectAllVisibleModules() {
        const visibleModules = document.querySelectorAll('.module-btn:not(.hidden)')
        let addedCount = 0

        visibleModules.forEach(btn => {
            const moduleId = btn.getAttribute('data-module-id')
            if (moduleId && !this.selectedModules.has(moduleId)) {
                this.selectedModules.add(moduleId)
                btn.classList.add('selected-for-bulk')
                addedCount++
            }
        })

        this.updateSelectionCount()
        this.showAlert(`${addedCount} modules sélectionnés`, 'success')
        logAudit('✅ Tous les modules visibles sélectionnés:', addedCount)
    }

    clearSelection() {
        this.selectedModules.clear()
        document.querySelectorAll('.module-btn.selected-for-bulk').forEach(btn => {
            btn.classList.remove('selected-for-bulk')
        })
        this.updateSelectionCount()
        logAudit('🗑️ Sélection effacée')
    }

    updateSelectionCount() {
        const count = this.selectedModules.size
        document.getElementById('selectedCount').textContent = count
        
        // Activer/désactiver boutons d'action selon sélection
        const actionBtns = document.querySelectorAll('.bulk-action-btn')
        actionBtns.forEach(btn => {
            btn.disabled = count === 0
            btn.style.opacity = count === 0 ? '0.5' : '1'
        })
    }

    showBulkActionModal(status) {
        if (this.selectedModules.size === 0) {
            this.showAlert('Aucun module sélectionné', 'warning')
            return
        }

        this.bulkActionStatus = status
        const statusLabels = {
            'ok': '🟢 OK',
            'inequality': '🟡 Inégalité', 
            'microcracks': '🟠 Microfissures',
            'dead': '🔴 Hors Service',
            'string_open': '🔵 String ouvert',
            'not_connected': '⚫ Non raccordé'
        }

        // Mise à jour modal
        document.getElementById('bulkCount').textContent = this.selectedModules.size
        document.getElementById('bulkNewStatus').textContent = statusLabels[status] || status
        
        // Liste modules sélectionnés
        const modulesList = document.getElementById('bulkModulesList')
        const modulesArray = Array.from(this.selectedModules).sort()
        modulesList.innerHTML = modulesArray.map(moduleId => 
            `<span class="inline-block bg-gray-700 px-2 py-1 rounded mr-1 mb-1">${moduleId}</span>`
        ).join('')

        // Reset commentaire
        document.getElementById('bulkComment').value = ''

        // Afficher modal
        document.getElementById('bulkActionModal').classList.remove('hidden')
    }

    closeBulkModal() {
        document.getElementById('bulkActionModal').classList.add('hidden')
        this.bulkActionStatus = null
    }

    async executeBulkAction() {
        if (!this.bulkActionStatus || this.selectedModules.size === 0) {
            return
        }

        const comment = document.getElementById('bulkComment').value.trim()
        const modulesToUpdate = Array.from(this.selectedModules)

        try {
            logAudit('🔄 Mise à jour en lot:', {
                total: modulesToUpdate.length,
                status: this.bulkActionStatus,
                comment: comment
            })

            // Afficher progress pour gros lots
            if (modulesToUpdate.length > 100) {
                this.showAlert(`🔄 Traitement de ${modulesToUpdate.length} modules par lots de 100...`, 'info')
            }

            // Division en lots de 100 modules maximum
            const batchSize = 100
            const batches = []
            for (let i = 0; i < modulesToUpdate.length; i += batchSize) {
                batches.push(modulesToUpdate.slice(i, i + batchSize))
            }

            logAudit(`📦 ${batches.length} lot(s) à traiter (${modulesToUpdate.length} modules total)`)

            // Traitement séquentiel des lots
            let totalUpdated = 0
            let totalNotFound = 0
            let hasErrors = false

            for (let i = 0; i < batches.length; i++) {
                const batch = batches[i]
                logAudit(`🔄 Traitement lot ${i + 1}/${batches.length} (${batch.length} modules)`)

                try {
                    // Vérification préalable mode Offline (optimisation)
                    const isOfflineMode = !navigator.onLine
                    
                    if (isOfflineMode) {
                        throw new Error('OFFLINE_MODE') // Forcer le passage en catch
                    }

                    // Appel API pour ce lot
                    const response = await fetch(`/api/el/audit/${this.auditToken}/bulk-update`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            modules: batch,
                            status: this.bulkActionStatus,
                            comment: comment,
                            technician_id: this.technicianId
                        })
                    })

                    if (!response.ok) {
                        if (response.status === 503) throw new Error('OFFLINE_MODE')
                        throw new Error(`Erreur lot ${i + 1}: ${response.statusText}`)
                    }

                    const result = await response.json()
                    logAudit(`✅ Lot ${i + 1} traité:`, result)

                    // Accumulation des résultats
                    totalUpdated += result.updated || 0
                    totalNotFound += result.notFound || 0

                    // Mise à jour locale des modules de ce lot (Succès Serveur)
                    batch.forEach(moduleId => {
                        this.updateLocalModuleState(moduleId, this.bulkActionStatus, comment)
                    })

                    // Mise à jour interface progressive
                    if (batches.length > 3) {
                        this.renderModulesGrid()
                        this.updateProgress()
                    }

                } catch (err) {
                    // GESTION OFFLINE BULK
                    if (err.message === 'OFFLINE_MODE' || !navigator.onLine) {
                        logAudit(`⚠️ Lot ${i + 1} basculé en OFFLINE`)
                        
                        // Pour chaque module du lot, on l'ajoute à la queue individuelle
                        // (C'est moins efficace que du bulk offline, mais ça réutilise la sync existante)
                        batch.forEach(moduleId => {
                            // 1. Update local
                            this.updateLocalModuleState(moduleId, this.bulkActionStatus, comment)
                            
                            // 2. Queue
                            this.queueOfflineUpdate({
                                status: this.bulkActionStatus,
                                comment: comment || null,
                                technicianId: this.technicianId
                            })
                        })
                        
                        totalNotFound += batch.length // On utilise "notFound" temporairement pour dire "Local"
                        // Pas d'erreur, c'est géré
                    } else {
                        errorAudit(`❌ Erreur lot ${i + 1}:`, err)
                        hasErrors = true
                    }
                }
            }

            logAudit(`✅ Traitement terminé: ${totalUpdated} serveur, ${totalNotFound} local/offline`)

            // Re-rendu final de l'interface  
            logAudit('🎨 Re-rendu final interface après multi-sélection')
            this.renderModulesGrid()
            this.updateProgress()
            this.saveOfflineData() // Sauvegarde globale état
            
            this.exitMultiSelectMode()
            this.closeBulkModal()

            // Message de résultat final adapté
            if (hasErrors) {
                this.showAlert(`⚠️ Traitement terminé avec des erreurs réseau`, 'warning')
            } else if (totalNotFound > 0 && totalUpdated === 0) {
                this.showAlert(`💾 ${totalNotFound} modules sauvegardés HORS LIGNE (sera synchronisé)`, 'warning')
            } else if (totalNotFound > 0) {
                this.showAlert(`✅ ${totalUpdated} sauvés serveur, 💾 ${totalNotFound} sauvés local`, 'success')
            } else {
                this.showAlert(`✅ ${totalUpdated} modules mis à jour avec succès !`, 'success')
            }

        } catch (err) {
            errorAudit('❌ Erreur globale mise à jour en lot:', err)
            this.showAlert('Erreur critique lors de la mise à jour: ' + err.message, 'error')
            
            // Fermeture modal en cas d'erreur critique
            this.exitMultiSelectMode()
            this.closeBulkModal()
        }
    }

    // ============================================================================
    // SENS DE CÂBLAGE PAR STRING
    // ============================================================================
    
    loadCableDirections() {
        try {
            const saved = localStorage.getItem(`diagpv_cable_${this.auditToken}`)
            return saved ? JSON.parse(saved) : {}
        } catch (e) {
            return {}
        }
    }
    
    saveCableDirections() {
        try {
            localStorage.setItem(`diagpv_cable_${this.auditToken}`, JSON.stringify(this.cableDirections))
        } catch (e) {
            errorAudit('Erreur sauvegarde sens câblage:', e)
        }
    }
    
    setCableDirection(stringNumber, direction) {
        this.cableDirections[stringNumber] = direction
        this.saveCableDirections()
        this.renderModulesGrid()
        this.showAlert(`String ${stringNumber}: ${this.getDirectionLabel(direction)}`, 'success')
    }
    
    getDirectionLabel(direction) {
        const labels = {
            'ltr': '← Module 1 à GAUCHE →',
            'rtl': '→ Module 1 à DROITE ←',
            'ttb': '↓ Module 1 en HAUT ↓',
            'btt': '↑ Module 1 en BAS ↑'
        }
        return labels[direction] || 'Non défini'
    }
    
    getDirectionArrow(direction) {
        const arrows = {
            'ltr': '→',
            'rtl': '←',
            'ttb': '↓',
            'btt': '↑'
        }
        return arrows[direction] || '?'
    }
    
    getDirectionIcon(direction) {
        const icons = {
            'ltr': 'fa-arrow-right',
            'rtl': 'fa-arrow-left',
            'ttb': 'fa-arrow-down',
            'btt': 'fa-arrow-up'
        }
        return icons[direction] || 'fa-question'
    }


}

// Initialisation audit au chargement DOM
document.addEventListener('DOMContentLoaded', () => {
    logAudit('🌙 DiagPV Audit Terrain - Interface Nocturne Initialisée')
    window.diagpvAudit = new DiagPVAudit()
})

// Sauvegarde avant fermeture page
window.addEventListener('beforeunload', () => {
    if (window.diagpvAudit) {
        window.diagpvAudit.destroy()
    }
})

// Export pour usage externe
window.DiagPVAudit = DiagPVAudit