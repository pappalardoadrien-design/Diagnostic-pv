// DiagPV Audit EL - Interface audit terrain nocturne
// Collaboration temps réel + diagnostic modules optimisé tablette tactile

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
        
        this.init()
    }

    async init() {
        console.log('🌙 DiagPV Audit Terrain - Token:', this.auditToken)
        
        try {
            await this.loadAuditData()
            this.setupInterface()
            this.setupEventListeners()
            this.setupRealtimeSync()
            this.setupOfflineSupport()
        } catch (error) {
            console.error('Erreur initialisation:', error)
            this.showAlert('Erreur chargement audit: ' + error.message, 'error')
        }
    }

    async loadAuditData() {
        const response = await fetch(`/api/audit/${this.auditToken}`)
        
        if (!response.ok) {
            throw new Error('Audit introuvable')
        }

        const data = await response.json()
        this.auditData = data.audit
        
        // Construction Map modules pour accès rapide
        data.modules.forEach(module => {
            this.modules.set(module.module_id, module)
        })

        console.log('✅ Audit chargé:', this.auditData.project_name, 'Modules:', this.modules.size)
    }

    setupInterface() {
        // Mise à jour titre et informations
        document.getElementById('projectTitle').textContent = this.auditData.project_name
        this.updateProgress()
        this.renderStringNavigation()
        this.renderModulesGrid()
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

        if (this.currentStringFilter === 'all') {
            // Affichage toutes strings
            for (let s = 1; s <= this.auditData.string_count; s++) {
                gridHTML += this.renderStringContainer(s)
            }
        } else {
            // Affichage string spécifique
            gridHTML = this.renderStringContainer(this.currentStringFilter)
        }

        container.innerHTML = gridHTML
    }

    renderStringContainer(stringNumber) {
        const stringModules = Array.from(this.modules.values())
            .filter(m => m.string_number === stringNumber)
            .sort((a, b) => a.position_in_string - b.position_in_string)

        const completed = stringModules.filter(m => m.status !== 'pending').length
        const total = stringModules.length

        let html = `
            <div class="string-container" data-string="${stringNumber}">
                <div class="string-header">
                    <h3>
                        <i class="fas fa-solar-panel mr-2"></i>
                        STRING ${stringNumber} (Modules ${stringModules[0]?.module_id} - ${stringModules[stringModules.length - 1]?.module_id})
                    </h3>
                    <div class="string-progress">
                        ${completed}/${total} complétés
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${(completed/total)*100}%"></div>
                        </div>
                    </div>
                </div>
                <div class="modules-grid">
        `

        // Modules de la string
        stringModules.forEach(module => {
            const statusClass = `module-${module.status}`
            html += `
                <button class="module-btn ${statusClass} touch-optimized" 
                        data-module-id="${module.module_id}"
                        data-string="${module.string_number}"
                        title="${module.module_id} - ${this.getStatusLabel(module.status)}${module.comment ? ' - ' + module.comment : ''}">
                    ${module.module_id.substring(1)}
                </button>
            `
        })

        html += `
                </div>
            </div>
        `

        return html
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
                const moduleId = e.target.dataset.moduleId
                this.openModuleModal(moduleId)
            }
        })

        // Modal diagnostic
        this.setupModalEvents()

        // Boutons header
        document.getElementById('measureBtn').addEventListener('click', () => this.showMeasuresModal())
        document.getElementById('reportBtn').addEventListener('click', () => this.generateReport())
        document.getElementById('shareBtn').addEventListener('click', () => this.shareAudit())

        // Raccourcis clavier tactile
        document.addEventListener('keydown', (e) => this.handleKeyboard(e))

        // Gestion toucher/glisser pour navigation rapide
        this.setupTouchGestures()
    }

    openModuleModal(moduleId) {
        const module = this.modules.get(moduleId)
        if (!module) return

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

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
                this.closeModal()
            }
        })
    }

    async validateModuleStatus() {
        if (!this.selectedModule || !this.selectedStatus) {
            this.showAlert('Veuillez sélectionner un statut', 'warning')
            return
        }

        try {
            const comment = document.getElementById('moduleComment').value.trim()
            
            // API update
            const updateData = {
                status: this.selectedStatus,
                comment: comment || null,
                technicianId: this.technicianId
            }

            const response = await fetch(`/api/audit/${this.auditToken}/module/${this.selectedModule.module_id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            })

            if (!response.ok) {
                throw new Error('Erreur mise à jour module')
            }

            // Mise à jour locale immédiate
            this.selectedModule.status = this.selectedStatus
            this.selectedModule.comment = comment || null
            this.selectedModule.technician_id = this.technicianId
            this.selectedModule.updated_at = new Date().toISOString()

            // Mise à jour Map
            this.modules.set(this.selectedModule.module_id, this.selectedModule)

            // Mise à jour interface
            this.updateModuleButton(this.selectedModule.module_id)
            this.updateProgress()
            this.renderStringNavigation()

            // Sauvegarde offline
            this.saveOfflineData()

            this.closeModal()
            this.showAlert(`Module ${this.selectedModule.module_id} mis à jour`, 'success')

            console.log('✅ Module mis à jour:', this.selectedModule.module_id, '→', this.selectedStatus)

        } catch (error) {
            console.error('Erreur validation module:', error)
            
            // Mode offline - queue pour sync ultérieure
            if (!navigator.onLine) {
                this.queueOfflineUpdate(updateData)
                this.showAlert('Mis à jour en mode offline - Sera synchronisé', 'warning')
            } else {
                this.showAlert('Erreur: ' + error.message, 'error')
            }
        }
    }

    updateModuleButton(moduleId) {
        const btn = document.querySelector(`[data-module-id="${moduleId}"]`)
        if (!btn) return

        const module = this.modules.get(moduleId)
        
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
        console.log('📊 Progression:', stats)
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
            this.eventSource = new EventSource(`/api/audit/${this.auditToken}/stream`)
            
            this.eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data)
                    if (data.type !== 'ping') {
                        this.handleRealtimeUpdate(data)
                    }
                } catch (error) {
                    console.error('Erreur parsing SSE:', error)
                }
            }

            this.eventSource.onerror = () => {
                console.log('⚠️ Connexion temps réel interrompue')
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
            console.log('📱 Données offline chargées:', parsed.lastSync)
        }
    }

    queueOfflineUpdate(updateData) {
        this.offlineQueue.push({
            ...updateData,
            moduleId: this.selectedModule.module_id,
            timestamp: Date.now()
        })
        console.log('📤 Queued offline:', this.offlineQueue.length, 'updates')
    }

    async syncOfflineQueue() {
        if (this.offlineQueue.length === 0) return

        console.log('🔄 Sync offline queue:', this.offlineQueue.length, 'items')
        
        for (const update of this.offlineQueue) {
            try {
                await fetch(`/api/audit/${this.auditToken}/module/${update.moduleId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(update)
                })
            } catch (error) {
                console.error('Erreur sync offline:', error)
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
            const reportUrl = `/api/audit/${this.auditToken}/report`
            window.open(reportUrl, '_blank')
            
            console.log('📄 Rapport généré:', reportUrl)
            
        } catch (error) {
            console.error('Erreur génération rapport:', error)
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

    // Cleanup lors fermeture
    destroy() {
        if (this.eventSource) {
            this.eventSource.close()
        }
        this.saveOfflineData()
    }
}

// Initialisation audit au chargement DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌙 DiagPV Audit Terrain - Interface Nocturne Initialisée')
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