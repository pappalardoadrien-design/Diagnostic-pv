// DiagPV Audit EL - JavaScript principal interface création
// Optimisé pour usage terrain nocturne + tablette tactile

class DiagPVApp {
    constructor() {
        this.init()
        this.setupEventListeners()
        this.loadRecentAudits()
    }

    init() {
        // Auto-remplissage date du jour
        const today = new Date().toISOString().split('T')[0]
        document.getElementById('auditDate').value = today

        // Calcul automatique total modules
        this.updateTotalModules()
        
        console.log('DiagPV App initialisée')
    }

    setupEventListeners() {
        const form = document.getElementById('createAuditForm')
        const stringCount = document.getElementById('stringCount')
        const modulesPerString = document.getElementById('modulesPerString')
        const planFile = document.getElementById('planFile')

        // Calcul temps réel total modules
        stringCount.addEventListener('input', () => this.updateTotalModules())
        modulesPerString.addEventListener('input', () => this.updateTotalModules())

        // Gestion upload plan
        planFile.addEventListener('change', (e) => this.handlePlanUpload(e))

        // Soumission formulaire création audit
        form.addEventListener('submit', (e) => this.createAudit(e))

        // Raccourcis clavier
        document.addEventListener('keydown', (e) => this.handleKeyboard(e))
    }

    updateTotalModules() {
        const stringCount = parseInt(document.getElementById('stringCount').value) || 0
        const modulesPerString = parseInt(document.getElementById('modulesPerString').value) || 0
        const total = stringCount * modulesPerString
        
        document.getElementById('totalModules').textContent = total

        // Validation limites
        if (total > 20000) {
            this.showAlert('Attention: Maximum 20 000 modules supportés', 'warning')
        }
    }

    handlePlanUpload(event) {
        const file = event.target.files[0]
        if (!file) return

        // Validation fichier
        const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
        if (!validTypes.includes(file.type)) {
            this.showAlert('Format non supporté. Utilisez PDF, PNG ou JPG', 'error')
            event.target.value = ''
            return
        }

        // Validation taille (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            this.showAlert('Fichier trop volumineux. Maximum 10MB', 'error')
            event.target.value = ''
            return
        }

        // Affichage nom fichier
        document.getElementById('planFileName').textContent = `✅ ${file.name}`
        
        console.log('Plan uploadé:', file.name, 'Taille:', (file.size / 1024 / 1024).toFixed(1) + 'MB')
    }

    async createAudit(event) {
        event.preventDefault()

        try {
            // Validation formulaire
            const projectName = document.getElementById('projectName').value.trim()
            const clientName = document.getElementById('clientName').value.trim()
            const location = document.getElementById('location').value.trim()
            const auditDate = document.getElementById('auditDate').value

            if (!projectName || !clientName || !location || !auditDate) {
                this.showAlert('Tous les champs sont obligatoires', 'error')
                return
            }

            // Configuration ou plan
            const stringCount = parseInt(document.getElementById('stringCount').value)
            const modulesPerString = parseInt(document.getElementById('modulesPerString').value)
            const planFile = document.getElementById('planFile').files[0]

            if (!planFile && (!stringCount || !modulesPerString)) {
                this.showAlert('Configuration manuelle OU upload plan requis', 'error')
                return
            }

            // Affichage loading
            const submitBtn = event.target.querySelector('button[type="submit"]')
            const originalText = submitBtn.innerHTML
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>CRÉATION EN COURS...'
            submitBtn.disabled = true

            // Création audit via API
            const auditData = {
                projectName,
                clientName, 
                location,
                auditDate,
                stringCount: stringCount || 0,
                modulesPerString: modulesPerString || 0
            }

            const response = await fetch('/api/audit/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(auditData)
            })

            const result = await response.json()

            if (!result.success) {
                throw new Error(result.message || 'Erreur création audit')
            }

            // Upload plan si fourni
            if (planFile) {
                await this.uploadPlan(result.auditToken, planFile)
            }

            // Sauvegarde local pour audits récents
            this.saveRecentAudit({
                token: result.auditToken,
                projectName,
                clientName,
                location,
                totalModules: result.totalModules,
                createdAt: new Date().toISOString()
            })

            // Redirection vers interface audit
            this.showAlert('Audit créé avec succès ! Redirection...', 'success')
            setTimeout(() => {
                window.location.href = result.auditUrl
            }, 1500)

        } catch (error) {
            console.error('Erreur création audit:', error)
            this.showAlert('Erreur: ' + error.message, 'error')
        } finally {
            // Reset bouton
            const submitBtn = event.target.querySelector('button[type="submit"]')
            submitBtn.innerHTML = originalText
            submitBtn.disabled = false
        }
    }

    async uploadPlan(auditToken, planFile) {
        const formData = new FormData()
        formData.append('plan', planFile)

        const response = await fetch(`/api/audit/${auditToken}/upload-plan`, {
            method: 'POST',
            body: formData
        })

        const result = await response.json()
        if (!result.success) {
            throw new Error('Erreur upload plan: ' + result.error)
        }

        console.log('Plan uploadé avec succès:', result.planUrl)
    }

    saveRecentAudit(auditData) {
        let recent = JSON.parse(localStorage.getItem('diagpv_recent_audits') || '[]')
        
        // Ajout en début de liste
        recent.unshift(auditData)
        
        // Limite 10 audits récents
        recent = recent.slice(0, 10)
        
        localStorage.setItem('diagpv_recent_audits', JSON.stringify(recent))
        this.loadRecentAudits()
    }

    loadRecentAudits() {
        const recent = JSON.parse(localStorage.getItem('diagpv_recent_audits') || '[]')
        const container = document.getElementById('recentAudits')

        if (recent.length === 0) {
            container.innerHTML = '<p class="text-gray-400">Aucun audit récent trouvé</p>'
            return
        }

        container.innerHTML = recent.map(audit => `
            <div class="bg-gray-800 rounded-lg p-4 border border-gray-600 hover:border-yellow-400 cursor-pointer transition-colors"
                 onclick="window.location.href='/audit/${audit.token}'">
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="font-bold text-lg">${audit.projectName}</h4>
                        <p class="text-gray-300">${audit.clientName} - ${audit.location}</p>
                        <p class="text-sm text-blue-400">${audit.totalModules} modules</p>
                    </div>
                    <div class="text-right text-sm">
                        <p class="text-gray-400">${new Date(audit.createdAt).toLocaleDateString('fr-FR')}</p>
                        <span class="bg-green-600 px-2 py-1 rounded text-xs">
                            <i class="fas fa-play mr-1"></i>Continuer
                        </span>
                    </div>
                </div>
            </div>
        `).join('')
    }

    handleKeyboard(event) {
        // Raccourci Ctrl+N pour nouvel audit
        if (event.ctrlKey && event.key === 'n') {
            event.preventDefault()
            document.getElementById('projectName').focus()
        }

        // Raccourci Échap pour effacer formulaire
        if (event.key === 'Escape') {
            if (confirm('Effacer le formulaire ?')) {
                document.getElementById('createAuditForm').reset()
                this.updateTotalModules()
            }
        }
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
        alert.className = `diagpv-alert fixed top-4 right-4 ${colors[type]} border-2 rounded-lg px-6 py-4 text-white font-bold z-50 max-w-md shadow-lg`
        alert.innerHTML = `
            <div class="flex items-center">
                <i class="${icons[type]} mr-3 text-xl"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-xl hover:text-gray-300">×</button>
            </div>
        `

        document.body.appendChild(alert)

        // Auto-suppression après 5 secondes
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove()
            }
        }, 5000)
    }

    // Utilitaire génération token unique
    generateToken() {
        return 'audit_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36)
    }

    // Validation format email
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return re.test(email)
    }

    // Formatage nombres avec séparateurs
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    }
}

// Initialisation app au chargement DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌙 DiagPV Audit EL - Interface Nocturne Initialisée')
    window.diagpvApp = new DiagPVApp()
})

// Gestion offline/online
window.addEventListener('online', () => {
    console.log('✅ Connexion réseau restaurée')
    diagpvApp.showAlert('Connexion réseau restaurée', 'success')
})

window.addEventListener('offline', () => {
    console.log('⚠️ Mode offline activé') 
    diagpvApp.showAlert('Mode offline - Les données seront synchronisées à la reconnexion', 'warning')
})

// Service Worker pour PWA
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(registration => console.log('SW registered:', registration))
        .catch(error => console.log('SW registration failed:', error))
}

// Export pour usage externe
window.DiagPVApp = DiagPVApp