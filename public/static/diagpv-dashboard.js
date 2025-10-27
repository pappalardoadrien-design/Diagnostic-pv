// Configuration logging production
const DEBUG = localStorage.getItem("diagpv_debug") === "true"
const log = (...args) => DEBUG && log(...args)
const error = (...args) => console.error(...args)

// DiagPV Dashboard - Tableau de bord audits temps réel
// Interface de gestion globale des audits avec mise à jour automatique

class DiagPVDashboard {
    constructor() {
        this.autoRefreshEnabled = false
        this.refreshInterval = null
        this.lastUpdate = null
        
        this.init()
        this.setupEventListeners()
        this.loadDashboard()
    }

    init() {
        log('📊 DiagPV Dashboard initialisé')
        
        // Mise à jour horloge temps réel
        this.updateClock()
        setInterval(() => this.updateClock(), 1000)
    }

    setupEventListeners() {
        // Actualisation manuelle
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.loadDashboard()
        })

        // Toggle auto-refresh
        document.getElementById('autoRefreshBtn').addEventListener('click', () => {
            this.toggleAutoRefresh()
        })

        // Raccourci clavier
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
                e.preventDefault()
                this.loadDashboard()
            }
        })
    }

    async loadDashboard() {
        try {
            log('🔄 Chargement dashboard...')
            
            // Affichage loading
            document.getElementById('loading').classList.remove('hidden')
            document.getElementById('auditsContainer').classList.add('hidden')
            document.getElementById('noAudits').classList.add('hidden')

            const response = await fetch('/api/dashboard/audits')
            const data = await response.json()

            if (data.success) {
                this.updateStatistics(data.stats)
                this.renderAudits(data.audits)
                this.lastUpdate = new Date(data.timestamp)
                this.updateLastUpdateDisplay()
                
                log('✅ Dashboard chargé:', data.audits.length, 'audits')
            } else {
                throw new Error(data.error || 'Erreur chargement')
            }

        } catch (err) {
            error('Erreur dashboard:', err)
            this.showError('Erreur de chargement: ' + error.message)
        } finally {
            document.getElementById('loading').classList.add('hidden')
        }
    }

    updateStatistics(stats) {
        document.getElementById('totalAudits').textContent = stats.totalAudits
        document.getElementById('activeAudits').textContent = stats.activeAudits
        document.getElementById('totalModules').textContent = stats.totalModules.toLocaleString()
        document.getElementById('totalDefauts').textContent = stats.totalDefauts
    }

    renderAudits(audits) {
        const container = document.getElementById('auditsTable')
        
        if (audits.length === 0) {
            document.getElementById('noAudits').classList.remove('hidden')
            return
        }

        document.getElementById('auditsContainer').classList.remove('hidden')

        container.innerHTML = audits.map(audit => `
            <tr class="border-b border-gray-700 hover:bg-gray-800 transition-colors">
                <td class="py-3 px-2">
                    <div class="font-bold text-white">${audit.project_name}</div>
                    <div class="text-xs text-gray-400">${audit.created_at_formatted}</div>
                </td>
                
                <td class="py-3 px-2">
                    <div class="text-gray-300">${audit.client_name}</div>
                </td>
                
                <td class="py-3 px-2">
                    <div class="text-gray-300 text-sm">${audit.location}</div>
                </td>
                
                <td class="py-3 px-2 text-center">
                    <div class="text-blue-400 font-bold">${audit.total_modules}</div>
                    <div class="text-xs text-gray-400">${audit.string_count} strings</div>
                </td>
                
                <td class="py-3 px-2 text-center">
                    <div class="flex items-center justify-center space-x-2">
                        <div class="w-20 bg-gray-700 rounded-full h-2">
                            <div class="bg-green-500 h-2 rounded-full transition-all duration-500" 
                                 style="width: ${audit.progression_pct}%"></div>
                        </div>
                        <span class="text-sm font-bold ${audit.progression_pct === 100 ? 'text-green-400' : 'text-yellow-400'}">
                            ${audit.progression_pct}%
                        </span>
                    </div>
                    <div class="text-xs text-gray-400 mt-1">
                        ${audit.modules_completed || 0}/${audit.total_modules}
                    </div>
                </td>
                
                <td class="py-3 px-2 text-center">
                    <div class="text-red-400 font-bold">${audit.defauts_total}</div>
                    ${audit.defauts_total > 0 ? `
                        <div class="text-xs text-gray-400">
                            ${this.formatDefauts(audit)}
                        </div>
                    ` : '<div class="text-xs text-green-400">Aucun</div>'}
                </td>
                
                <td class="py-3 px-2 text-center">
                    <span class="px-2 py-1 rounded text-xs font-bold ${this.getStatusColor(audit.status)}">
                        ${this.getStatusLabel(audit.status)}
                    </span>
                </td>
                
                <td class="py-3 px-2 text-center">
                    <div class="flex justify-center space-x-1">
                        <a href="/audit/${audit.token}" 
                           class="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs font-bold"
                           title="Ouvrir audit">
                            <i class="fas fa-eye"></i>
                        </a>
                        <button onclick="dashboard.editAudit('${audit.token}')" 
                                class="bg-orange-600 hover:bg-orange-700 px-2 py-1 rounded text-xs font-bold"
                                title="Modifier">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="dashboard.generateReport('${audit.token}')" 
                                class="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs font-bold"
                                title="Rapport">
                            <i class="fas fa-file-pdf"></i>
                        </button>
                        <button onclick="dashboard.deleteAudit('${audit.token}', '${audit.project_name}')" 
                                class="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs font-bold"
                                title="Supprimer définitivement">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('')
    }

    formatDefauts(audit) {
        const defauts = []
        if (audit.modules_inequality > 0) defauts.push(`${audit.modules_inequality} inég.`)
        if (audit.modules_microcracks > 0) defauts.push(`${audit.modules_microcracks} fiss.`)
        if (audit.modules_dead > 0) defauts.push(`${audit.modules_dead} HS`)
        if (audit.modules_string_open > 0) defauts.push(`${audit.modules_string_open} ouv.`)
        if (audit.modules_not_connected > 0) defauts.push(`${audit.modules_not_connected} NC`)
        return defauts.join(', ')
    }

    getStatusColor(status) {
        const colors = {
            'created': 'bg-blue-600',
            'in_progress': 'bg-yellow-600', 
            'completed': 'bg-green-600',
            'paused': 'bg-gray-600'
        }
        return colors[status] || 'bg-gray-600'
    }

    getStatusLabel(status) {
        const labels = {
            'created': 'CRÉÉ',
            'in_progress': 'EN COURS',
            'completed': 'TERMINÉ', 
            'paused': 'EN PAUSE'
        }
        return labels[status] || status.toUpperCase()
    }

    toggleAutoRefresh() {
        this.autoRefreshEnabled = !this.autoRefreshEnabled
        const btn = document.getElementById('autoRefreshBtn')
        const status = document.getElementById('autoStatus')

        if (this.autoRefreshEnabled) {
            btn.innerHTML = '<i class="fas fa-pause mr-1"></i>AUTO (ON)'
            btn.className = 'bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-bold'
            status.textContent = 'AUTO'
            status.className = 'ml-4 px-2 py-1 bg-green-600 rounded text-xs'
            
            // Refresh toutes les 10 secondes
            this.refreshInterval = setInterval(() => {
                this.loadDashboard()
            }, 10000)
            
            log('🔄 Auto-refresh activé (10s)')
        } else {
            btn.innerHTML = '<i class="fas fa-play mr-1"></i>AUTO (OFF)'
            btn.className = 'bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-bold'
            status.textContent = 'MANUEL'
            status.className = 'ml-4 px-2 py-1 bg-gray-600 rounded text-xs'
            
            if (this.refreshInterval) {
                clearInterval(this.refreshInterval)
                this.refreshInterval = null
            }
            
            log('⏸️ Auto-refresh désactivé')
        }
    }

    updateClock() {
        const now = new Date()
        const timeStr = now.toLocaleTimeString('fr-FR')
        // Mise à jour discrète sans élément dédié pour l'instant
    }

    updateLastUpdateDisplay() {
        if (this.lastUpdate) {
            const timeStr = this.lastUpdate.toLocaleTimeString('fr-FR')
            document.getElementById('lastUpdate').textContent = timeStr
        }
    }

    editAudit(token) {
        // Redirection vers l'audit pour édition
        window.location.href = `/audit/${token}`
    }

    generateReport(token) {
        // Ouvre le rapport dans nouvel onglet
        window.open(`/api/audit/${token}/report`, '_blank')
    }

    async deleteAudit(token, projectName) {
        // Confirmation double sécurité pour suppression terrain
        const confirmed = confirm(
            `⚠️ ATTENTION - SUPPRESSION DÉFINITIVE ⚠️\n\n` +
            `Projet: "${projectName}"\n` +
            `Token: ${token}\n\n` +
            `Cette action est IRRÉVERSIBLE.\n` +
            `Tous les modules et données seront perdus.\n\n` +
            `Confirmer la suppression ?`
        )
        
        if (!confirmed) {
            return
        }
        
        // Deuxième confirmation pour sécurité terrain
        const doubleConfirm = confirm(
            `🔥 CONFIRMATION FINALE 🔥\n\n` +
            `Supprimer définitivement "${projectName}" ?\n\n` +
            `Tapez OK pour confirmer la suppression.`
        )
        
        if (!doubleConfirm) {
            return
        }

        try {
            log(`🗑️ Suppression audit: ${projectName} (${token})`)
            
            const response = await fetch(`/api/audit/${token}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            
            const result = await response.json()
            
            if (result.success) {
                alert(`✅ SUPPRESSION RÉUSSIE\n\n"${projectName}" a été supprimé avec succès.`)
                
                // Actualisation immédiate du dashboard
                await this.loadDashboard()
                
                log('✅ Audit supprimé:', result.deleted_audit)
            } else {
                throw new Error(result.error || 'Erreur suppression')
            }
            
        } catch (err) {
            error('❌ Erreur suppression audit:', err)
            alert(`❌ ERREUR SUPPRESSION\n\n${error.message}\n\nL'audit n'a pas pu être supprimé.`)
        }
    }

    showError(message) {
        // Simple alert pour l'instant (peut être amélioré avec une modal)
        alert('Erreur Dashboard: ' + message)
    }

    // Cleanup au déchargement
    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval)
        }
    }
}

// Initialisation dashboard
document.addEventListener('DOMContentLoaded', () => {
    log('📊 DiagPV Dashboard - Initialisation')
    window.dashboard = new DiagPVDashboard()
})

// Cleanup avant fermeture
window.addEventListener('beforeunload', () => {
    if (window.dashboard) {
        window.dashboard.destroy()
    }
})