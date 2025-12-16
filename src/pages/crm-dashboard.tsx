// ============================================================================
// PAGE CRM DASHBOARD - CONTROL TOWER (TOUR DE CONTRÔLE)
// ============================================================================
// Hub central unifié : KPIs Temps Réel, Alertes Critiques, Audits, Planning
// ============================================================================

export function getCrmDashboardPage() {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Control Tower - DiagPV Hub</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/diagpv-styles.css" rel="stylesheet">
        <style>
            .stat-card { transition: transform 0.2s, box-shadow 0.2s; }
            .stat-card:hover { transform: translateY(-4px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5); }
            .audit-card { transition: all 0.2s; }
            .audit-card:hover { background-color: #1f2937; transform: scale(1.01); }
            
            /* Animation pulse pour les alertes */
            @keyframes pulse-red {
                0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
                50% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
            }
            .alert-pulse { animation: pulse-red 2s infinite; }
        </style>
    </head>
    <body class="bg-black text-white min-h-screen font-bold">
        <div class="container mx-auto p-4 md:p-6">
            <!-- En-tête Dashboard Control Tower -->
            <header class="mb-8 bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                <div class="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div class="flex items-center">
                        <div class="relative mr-4">
                            <i class="fas fa-solar-panel text-5xl text-yellow-400"></i>
                            <div class="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        </div>
                        <div>
                            <h1 class="text-3xl md:text-4xl font-black tracking-tight">DIAGPV <span class="text-orange-500">CONTROL TOWER</span></h1>
                            <div class="flex items-center gap-2 text-gray-400 text-sm">
                                <i class="fas fa-satellite-dish"></i>
                                <span>SYSTEM STATUS: <span class="text-green-400 font-bold">ONLINE</span></span>
                                <span class="mx-2">|</span>
                                <span id="last-update" class="text-xs">Mise à jour...</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Actions rapides -->
                    <div class="flex flex-wrap justify-center gap-3">
                        <a href="/audits/create" class="bg-green-600 hover:bg-green-700 px-5 py-3 rounded-lg font-black text-sm md:text-base shadow-lg flex items-center transition-colors">
                            <i class="fas fa-plus-circle mr-2"></i>
                            AUDIT
                        </a>
                        <a href="/crm/clients/create" class="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-lg font-black text-sm md:text-base shadow-lg flex items-center transition-colors">
                            <i class="fas fa-user-plus mr-2"></i>
                            CLIENT
                        </a>
                        <a href="/crm/clients/create?status=prospect" class="bg-purple-600 hover:bg-purple-700 px-5 py-3 rounded-lg font-black text-sm md:text-base shadow-lg flex items-center transition-colors">
                            <i class="fas fa-file-invoice-dollar mr-2"></i>
                            DEVIS
                        </a>
                        <a href="/crm/unified" class="bg-orange-600 hover:bg-orange-700 px-5 py-3 rounded-lg font-black text-sm md:text-base shadow-lg flex items-center transition-colors">
                            <i class="fas fa-sitemap mr-2"></i>
                            EXPLORATEUR
                        </a>
                    </div>
                </div>
            </header>
            
            <!-- Navigation Tabs -->
            <div class="mb-8 border-b border-gray-800 overflow-x-auto">
                <div class="flex gap-2 min-w-max">
                    <button class="tab-btn active px-6 py-3 font-bold border-b-4 border-yellow-400 text-yellow-400 bg-gray-900/50 rounded-t-lg transition-all" data-tab="dashboard">
                        <i class="fas fa-tachometer-alt mr-2"></i>VUE GLOBALE
                    </button>
                    <button class="tab-btn px-6 py-3 font-bold border-b-4 border-transparent text-gray-400 hover:text-white hover:bg-gray-800 rounded-t-lg transition-all" data-tab="audits">
                        <i class="fas fa-clipboard-list mr-2"></i>AUDITS
                    </button>
                    <button class="tab-btn px-6 py-3 font-bold border-b-4 border-transparent text-gray-400 hover:text-white hover:bg-gray-800 rounded-t-lg transition-all" data-tab="planning">
                        <i class="fas fa-calendar-alt mr-2"></i>PLANNING
                    </button>
                    <button class="tab-btn px-6 py-3 font-bold border-b-4 border-transparent text-gray-400 hover:text-white hover:bg-gray-800 rounded-t-lg transition-all" data-tab="clients">
                        <i class="fas fa-users mr-2"></i>CRM
                    </button>
                </div>
            </div>
            
            <!-- ONGLET DASHBOARD (CONTROL TOWER) -->
            <div id="tab-dashboard" class="tab-content">

                <!-- KPIs CRITIQUES (Ligne 1) -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                    <!-- Alertes Critiques -->
                    <div id="card-alerts" class="stat-card bg-gray-900 rounded-xl p-5 border-l-4 border-red-500 shadow-lg relative overflow-hidden group">
                        <div class="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                            <i class="fas fa-exclamation-triangle text-6xl text-red-500"></i>
                        </div>
                        <div class="flex justify-between items-start mb-2">
                            <div>
                                <p class="text-red-400 text-xs font-bold uppercase tracking-wider">DÉFAUTS CRITIQUES</p>
                                <h3 id="stat-alerts" class="text-4xl font-black text-white mt-1">-</h3>
                            </div>
                            <div class="bg-red-500/20 p-2 rounded-lg">
                                <i class="fas fa-bolt text-red-500 text-xl"></i>
                            </div>
                        </div>
                        <p class="text-xs text-gray-500">Modules HS & Risques Incendie</p>
                    </div>

                    <!-- Audits En Cours -->
                    <div class="stat-card bg-gray-900 rounded-xl p-5 border-l-4 border-green-500 shadow-lg relative overflow-hidden group">
                        <div class="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                            <i class="fas fa-tasks text-6xl text-green-500"></i>
                        </div>
                        <div class="flex justify-between items-start mb-2">
                            <div>
                                <p class="text-green-400 text-xs font-bold uppercase tracking-wider">AUDITS ACTIFS</p>
                                <h3 id="stat-audits-actifs" class="text-4xl font-black text-white mt-1">-</h3>
                            </div>
                            <div class="bg-green-500/20 p-2 rounded-lg">
                                <i class="fas fa-play text-green-500 text-xl"></i>
                            </div>
                        </div>
                        <p class="text-xs text-gray-500">En cours de réalisation</p>
                    </div>

                    <!-- Interventions -->
                    <div class="stat-card bg-gray-900 rounded-xl p-5 border-l-4 border-purple-500 shadow-lg relative overflow-hidden group">
                        <div class="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                            <i class="fas fa-calendar-day text-6xl text-purple-500"></i>
                        </div>
                        <div class="flex justify-between items-start mb-2">
                            <div>
                                <p class="text-purple-400 text-xs font-bold uppercase tracking-wider">INTERVENTIONS 7J</p>
                                <h3 id="stat-interventions" class="text-4xl font-black text-white mt-1">-</h3>
                            </div>
                            <div class="bg-purple-500/20 p-2 rounded-lg">
                                <i class="fas fa-truck text-purple-500 text-xl"></i>
                            </div>
                        </div>
                        <p class="text-xs text-gray-500">Planifiées cette semaine</p>
                    </div>

                    <!-- Clients -->
                    <div class="stat-card bg-gray-900 rounded-xl p-5 border-l-4 border-blue-500 shadow-lg relative overflow-hidden group">
                        <div class="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                            <i class="fas fa-building text-6xl text-blue-500"></i>
                        </div>
                        <div class="flex justify-between items-start mb-2">
                            <div>
                                <p class="text-blue-400 text-xs font-bold uppercase tracking-wider">CLIENTS ACTIFS</p>
                                <h3 id="stat-clients" class="text-4xl font-black text-white mt-1">-</h3>
                            </div>
                            <div class="bg-blue-500/20 p-2 rounded-lg">
                                <i class="fas fa-users text-blue-500 text-xl"></i>
                            </div>
                        </div>
                        <p class="text-xs text-gray-500">Base de données CRM</p>
                    </div>
                    
                     <!-- Projets -->
                    <div class="stat-card bg-gray-900 rounded-xl p-5 border-l-4 border-orange-500 shadow-lg relative overflow-hidden group">
                        <div class="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                            <i class="fas fa-project-diagram text-6xl text-orange-500"></i>
                        </div>
                        <div class="flex justify-between items-start mb-2">
                            <div>
                                <p class="text-orange-400 text-xs font-bold uppercase tracking-wider">SITES PV</p>
                                <h3 id="stat-sites" class="text-4xl font-black text-white mt-1">-</h3>
                            </div>
                            <div class="bg-orange-500/20 p-2 rounded-lg">
                                <i class="fas fa-industry text-orange-500 text-xl"></i>
                            </div>
                        </div>
                        <p class="text-xs text-gray-500">Centrales gérées</p>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <!-- COLONNE GAUCHE: FLUX D'ACTIVITÉ (AUDITS) -->
                    <div class="lg:col-span-2 space-y-6">
                        <!-- Audits en cours -->
                        <div class="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                            <div class="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
                                <h2 class="text-lg font-bold flex items-center text-green-400">
                                    <i class="fas fa-circle-notch fa-spin mr-2"></i>
                                    AUDITS OPÉRATIONNELS
                                </h2>
                                <a href="/audits/create" class="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-white transition-colors">
                                    <i class="fas fa-plus mr-1"></i>CRÉER
                                </a>
                            </div>
                            <div id="audits-list" class="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                                <div class="text-center text-gray-500 py-8">
                                    <i class="fas fa-satellite fa-spin text-2xl mb-2"></i>
                                    <p>Acquisition des données audits...</p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Outils Rapides -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <!-- Convertisseur -->
                            <a href="/tools/report-converter" class="bg-gray-900 rounded-xl p-4 border border-gray-800 hover:border-purple-500 transition-all group flex items-center gap-4">
                                <div class="bg-purple-900/30 text-purple-400 w-12 h-12 rounded-lg flex items-center justify-center text-xl">
                                    <i class="fas fa-magic"></i>
                                </div>
                                <div>
                                    <h3 class="font-bold text-white group-hover:text-purple-400 transition-colors">Convertisseur Rapports</h3>
                                    <p class="text-xs text-gray-500">Sous-traitants → DiagPV</p>
                                </div>
                                <i class="fas fa-chevron-right ml-auto text-gray-700 group-hover:text-white"></i>
                            </a>
                            
                            <!-- Cartographie -->
                            <a href="/calepinage" class="bg-gray-900 rounded-xl p-4 border border-gray-800 hover:border-blue-500 transition-all group flex items-center gap-4">
                                <div class="bg-blue-900/30 text-blue-400 w-12 h-12 rounded-lg flex items-center justify-center text-xl">
                                    <i class="fas fa-map-marked-alt"></i>
                                </div>
                                <div>
                                    <h3 class="font-bold text-white group-hover:text-blue-400 transition-colors">Cartographie PV</h3>
                                    <p class="text-xs text-gray-500">Éditeur de plans universel</p>
                                </div>
                                <i class="fas fa-chevron-right ml-auto text-gray-700 group-hover:text-white"></i>
                            </a>
                        </div>
                    </div>

                    <!-- COLONNE DROITE: PLANNING & ALERTES -->
                    <div class="space-y-6">
                        <!-- Interventions -->
                        <div class="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                            <div class="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
                                <h2 class="text-lg font-bold flex items-center text-purple-400">
                                    <i class="fas fa-calendar-alt mr-2"></i>
                                    PLANNING (7J)
                                </h2>
                                <a href="/planning" class="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-white transition-colors">
                                    VOIR TOUT
                                </a>
                            </div>
                            <div id="interventions-list" class="divide-y divide-gray-800 max-h-[400px] overflow-y-auto">
                                <div class="p-6 text-center text-gray-500">
                                    <i class="fas fa-spinner fa-spin mb-2"></i>
                                    <p>Synchronisation planning...</p>
                                </div>
                            </div>
                        </div>

                        <!-- État Système / Météo (Placeholder) -->
                        <div class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-gray-700">
                            <h3 class="text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">État du Système</h3>
                            <div class="flex items-center justify-between mb-2">
                                <span class="flex items-center text-sm text-green-400">
                                    <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                    Base de données
                                </span>
                                <span class="text-xs font-mono text-gray-500">OK</span>
                            </div>
                            <div class="flex items-center justify-between mb-2">
                                <span class="flex items-center text-sm text-green-400">
                                    <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                    API Cloudflare
                                </span>
                                <span class="text-xs font-mono text-gray-500">OK</span>
                            </div>
                             <div class="flex items-center justify-between">
                                <span class="flex items-center text-sm text-yellow-400">
                                    <span class="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                                    Stockage Photos
                                </span>
                                <span class="text-xs font-mono text-gray-500">98% LIBRE</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- ONGLET AUDITS (IFRAME) -->
            <div id="tab-audits" class="tab-content hidden h-[80vh]">
                 <div class="bg-gray-900 rounded-xl h-full border border-gray-800 p-1">
                    <iframe src="/audits/create" class="w-full h-full border-0 rounded-lg"></iframe>
                 </div>
            </div>
            
            <!-- ONGLET PLANNING (IFRAME) -->
            <div id="tab-planning" class="tab-content hidden h-[80vh]">
                <div class="bg-gray-900 rounded-xl h-full border border-gray-800 p-1">
                    <iframe src="/planning" class="w-full h-full border-0 rounded-lg"></iframe>
                </div>
            </div>
            
            <!-- ONGLET CLIENTS (IFRAME) -->
            <div id="tab-clients" class="tab-content hidden h-[80vh]">
                <div class="bg-gray-900 rounded-xl h-full border border-gray-800 p-1">
                    <iframe src="/crm/clients" class="w-full h-full border-0 rounded-lg"></iframe>
                </div>
            </div>
        </div>
        
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            // === LOGIQUE DASHBOARD UNIFIÉ ===

            // Gestion des onglets
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const tabName = btn.dataset.tab
                    
                    document.querySelectorAll('.tab-btn').forEach(b => {
                        b.classList.remove('active', 'border-yellow-400', 'text-yellow-400', 'bg-gray-900/50')
                        b.classList.add('border-transparent', 'text-gray-400')
                    })
                    
                    btn.classList.add('active', 'border-yellow-400', 'text-yellow-400', 'bg-gray-900/50')
                    btn.classList.remove('border-transparent', 'text-gray-400')
                    
                    document.querySelectorAll('.tab-content').forEach(content => {
                        content.classList.add('hidden')
                    })
                    
                    document.getElementById('tab-' + tabName).classList.remove('hidden')
                })
            })
            
            function animateNumber(elementId, newValue) {
                const element = document.getElementById(elementId)
                if (!element) return
                
                const currentValue = parseInt(element.textContent.replace(/[^0-9]/g, '')) || 0
                if (currentValue === newValue) {
                    element.textContent = newValue
                    return
                }
                
                element.textContent = newValue
                element.classList.add('text-yellow-400', 'scale-110')
                setTimeout(() => element.classList.remove('text-yellow-400', 'scale-110'), 200)
            }
            
            // CHARGEMENT UNIFIÉ (Une seule requête)
            async function loadDashboardData() {
                try {
                    console.log('📡 Fetching unified dashboard data...')
                    const response = await axios.get('/api/crm/dashboard/unified/summary')
                    
                    if (!response.data || !response.data.success) {
                        throw new Error('Données invalides')
                    }
                    
                    const { kpi, audits, interventions, alerts, timestamp } = response.data

                    // 1. UPDATE KPIS
                    animateNumber('stat-clients', kpi.clients_active)
                    animateNumber('stat-sites', kpi.projects_active)
                    animateNumber('stat-audits-actifs', kpi.audits_active)
                    animateNumber('stat-interventions', kpi.interventions_week)
                    animateNumber('stat-alerts', kpi.critical_defects)
                    
                    // Gestion alerte visuelle si défauts critiques
                    const alertCard = document.getElementById('card-alerts')
                    if (kpi.critical_defects > 0) {
                        alertCard.classList.add('alert-pulse', 'bg-red-900/20')
                        alertCard.classList.remove('bg-gray-900')
                    } else {
                        alertCard.classList.remove('alert-pulse', 'bg-red-900/20')
                        alertCard.classList.add('bg-gray-900')
                    }

                    // 2. UPDATE AUDITS LIST
                    const auditsContainer = document.getElementById('audits-list')
                    if (audits.length === 0) {
                        auditsContainer.innerHTML = \`
                            <div class="text-center text-gray-500 py-6">
                                <p>Aucun audit actif</p>
                            </div>
                        \`
                    } else {
                        auditsContainer.innerHTML = audits.map(audit => {
                            const modules = JSON.parse(audit.modules_enabled || '[]')
                            const modulesIcons = {
                                'EL': '<span class="text-xs bg-green-900 text-green-400 px-1 rounded">EL</span>',
                                'IV': '<span class="text-xs bg-orange-900 text-orange-400 px-1 rounded">IV</span>',
                                'VISUAL': '<span class="text-xs bg-teal-900 text-teal-400 px-1 rounded">VIS</span>',
                                'ISOLATION': '<span class="text-xs bg-red-900 text-red-400 px-1 rounded">ISO</span>'
                            }
                            
                            return \`
                                <div class="audit-card bg-gray-800 rounded-lg p-3 border border-gray-700 cursor-pointer flex justify-between items-center group"
                                     onclick="window.location.href='/audit/\${audit.audit_token}'">
                                    <div class="flex items-center gap-3">
                                        <div class="bg-gray-700 w-10 h-10 rounded-full flex items-center justify-center text-yellow-400 font-bold group-hover:bg-yellow-600 group-hover:text-black transition-colors">
                                            \${audit.project_name.substring(0,2).toUpperCase()}
                                        </div>
                                        <div>
                                            <h4 class="font-bold text-sm text-white group-hover:text-yellow-400 transition-colors">\${audit.project_name}</h4>
                                            <p class="text-xs text-gray-400">\${audit.client_company || audit.client_name || 'Client Inconnu'}</p>
                                        </div>
                                    </div>
                                    <div class="flex flex-col items-end gap-1">
                                        <div class="flex gap-1">
                                            \${modules.map(m => modulesIcons[m] || '').join('')}
                                        </div>
                                        <span class="text-xs text-gray-500">\${new Date(audit.audit_date).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            \`
                        }).join('')
                    }

                    // 3. UPDATE INTERVENTIONS LIST
                    const interventionsContainer = document.getElementById('interventions-list')
                    if (interventions.length === 0) {
                        interventionsContainer.innerHTML = \`
                             <div class="p-6 text-center text-gray-500">
                                <i class="fas fa-calendar-check text-2xl mb-2 opacity-30"></i>
                                <p>Aucune intervention cette semaine</p>
                            </div>
                        \`
                    } else {
                        interventionsContainer.innerHTML = interventions.map(intervention => {
                            const date = new Date(intervention.date_souhaitee)
                            const isToday = date.toDateString() === new Date().toDateString()
                            const dateClass = isToday ? 'text-green-400 font-black' : 'text-purple-400 font-bold'
                            
                            return \`
                                <div class="p-4 hover:bg-gray-800 transition-colors cursor-pointer flex justify-between items-center"
                                     onclick="window.location.href='/planning'">
                                    <div>
                                        <div class="flex items-center gap-2 mb-1">
                                            <span class="\${dateClass} text-sm">
                                                \${date.toLocaleDateString('fr-FR', {weekday: 'short', day: 'numeric'})}
                                            </span>
                                            \${isToday ? '<span class="text-[10px] bg-green-600 text-white px-1 rounded uppercase">Aujourd\\'hui</span>' : ''}
                                        </div>
                                        <h4 class="font-bold text-sm text-white">\${intervention.titre || intervention.project_name || 'Intervention'}</h4>
                                        <p class="text-xs text-gray-500">\${intervention.client_name || 'Client N/A'}</p>
                                    </div>
                                    <div class="text-right">
                                        <span class="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">\${intervention.statut}</span>
                                    </div>
                                </div>
                            \`
                        }).join('')
                    }

                    // Update timestamp
                    const now = new Date()
                    document.getElementById('last-update').textContent = 'MAJ: ' + now.toLocaleTimeString()
                    
                } catch (error) {
                    console.error('Erreur chargement dashboard:', error)
                    document.getElementById('last-update').textContent = 'Erreur Connexion'
                    document.getElementById('last-update').classList.add('text-red-500')
                }
            }
            
            // Initialisation
            document.addEventListener('DOMContentLoaded', () => {
                loadDashboardData()
                
                // Refresh toutes les 30s
                setInterval(loadDashboardData, 30000)
                console.log('🚀 Control Tower Initialized')
            })
        </script>
    </body>
    </html>
  `
}
