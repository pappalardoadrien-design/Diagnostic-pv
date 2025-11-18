// ============================================================================
// PAGE CRM DASHBOARD - PAGE CENTRALE APPLICATION
// ============================================================================
// Hub central : KPIs, Audits en cours, Planning, Actions rapides
// ============================================================================

export function getCrmDashboardPage() {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CRM Dashboard - Diagnostic Photovoltaïque</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/diagpv-styles.css" rel="stylesheet">
        <style>
            .stat-card { transition: transform 0.2s; }
            .stat-card:hover { transform: translateY(-4px); }
            .audit-card { transition: all 0.2s; }
            .audit-card:hover { background-color: #1f2937; }
        </style>
    </head>
    <body class="bg-black text-white min-h-screen font-bold">
        <div class="container mx-auto p-6">
            <!-- En-tête Dashboard -->
            <header class="mb-8">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center">
                        <i class="fas fa-solar-panel text-5xl text-yellow-400 mr-4"></i>
                        <div>
                            <h1 class="text-4xl font-black">CRM DASHBOARD</h1>
                            <p class="text-xl text-orange-400">Diagnostic Photovoltaïque</p>
                        </div>
                    </div>
                    
                    <!-- Actions rapides -->
                    <div class="flex gap-3">
                        <a href="/audits/create" class="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-black text-lg shadow-lg">
                            <i class="fas fa-plus mr-2"></i>
                            NOUVEL AUDIT
                        </a>
                        <a href="/crm/clients/create" class="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-black text-lg shadow-lg">
                            <i class="fas fa-user-plus mr-2"></i>
                            NOUVEAU CLIENT
                        </a>
                    </div>
                </div>
            </header>
            
            <!-- Navigation Tabs -->
            <div class="mb-8 border-b border-gray-700">
                <div class="flex gap-6">
                    <button class="tab-btn active px-4 py-3 font-bold border-b-4 border-yellow-400 text-yellow-400" data-tab="dashboard">
                        <i class="fas fa-chart-line mr-2"></i>Dashboard
                    </button>
                    <button class="tab-btn px-4 py-3 font-bold border-b-4 border-transparent text-gray-400 hover:text-white" data-tab="audits">
                        <i class="fas fa-clipboard-list mr-2"></i>Audits
                    </button>
                    <button class="tab-btn px-4 py-3 font-bold border-b-4 border-transparent text-gray-400 hover:text-white" data-tab="planning">
                        <i class="fas fa-calendar mr-2"></i>Planning
                    </button>
                    <button class="tab-btn px-4 py-3 font-bold border-b-4 border-transparent text-gray-400 hover:text-white" data-tab="clients">
                        <i class="fas fa-users mr-2"></i>Clients
                    </button>
                </div>
            </div>
            
            <!-- ONGLET DASHBOARD -->
            <div id="tab-dashboard" class="tab-content">
                <!-- KPIs -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div class="stat-card bg-gradient-to-br from-blue-900 to-blue-700 rounded-lg p-6 border-2 border-blue-400 shadow-lg">
                        <div class="flex items-center justify-between mb-2">
                            <i class="fas fa-users text-3xl text-blue-200"></i>
                            <span id="stat-clients" class="text-4xl font-black">-</span>
                        </div>
                        <p class="text-lg text-blue-200">Clients Actifs</p>
                    </div>
                    
                    <div class="stat-card bg-gradient-to-br from-purple-900 to-purple-700 rounded-lg p-6 border-2 border-purple-400 shadow-lg">
                        <div class="flex items-center justify-between mb-2">
                            <i class="fas fa-map-marker-alt text-3xl text-purple-200"></i>
                            <span id="stat-sites" class="text-4xl font-black">-</span>
                        </div>
                        <p class="text-lg text-purple-200">Sites / Projets</p>
                    </div>
                    
                    <div class="stat-card bg-gradient-to-br from-green-900 to-green-700 rounded-lg p-6 border-2 border-green-400 shadow-lg">
                        <div class="flex items-center justify-between mb-2">
                            <i class="fas fa-clipboard-check text-3xl text-green-200"></i>
                            <span id="stat-audits-actifs" class="text-4xl font-black">-</span>
                        </div>
                        <p class="text-lg text-green-200">Audits En Cours</p>
                    </div>
                    
                    <div class="stat-card bg-gradient-to-br from-orange-900 to-orange-700 rounded-lg p-6 border-2 border-orange-400 shadow-lg">
                        <div class="flex items-center justify-between mb-2">
                            <i class="fas fa-calendar-check text-3xl text-orange-200"></i>
                            <span id="stat-interventions" class="text-4xl font-black">-</span>
                        </div>
                        <p class="text-lg text-orange-200">Interventions Semaine</p>
                    </div>
                </div>
                
                <!-- Audits en cours -->
                <div class="bg-gray-900 rounded-lg p-6 border-2 border-yellow-400 mb-8">
                    <div class="flex items-center justify-between mb-6">
                        <h2 class="text-2xl font-black">
                            <i class="fas fa-clipboard-list mr-2 text-yellow-400"></i>
                            AUDITS EN COURS
                        </h2>
                        <a href="/audits/create" class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-bold">
                            <i class="fas fa-plus mr-2"></i>Nouvel Audit
                        </a>
                    </div>
                    
                    <div id="audits-list" class="space-y-4">
                        <div class="text-center text-gray-400 py-8">
                            <i class="fas fa-spinner fa-spin text-3xl mb-2"></i>
                            <p>Chargement des audits...</p>
                        </div>
                    </div>
                </div>
                
                <!-- Interventions à venir -->
                <div class="bg-gray-900 rounded-lg p-6 border-2 border-purple-400">
                    <div class="flex items-center justify-between mb-6">
                        <h2 class="text-2xl font-black">
                            <i class="fas fa-calendar-alt mr-2 text-purple-400"></i>
                            INTERVENTIONS À VENIR
                        </h2>
                        <a href="/planning" class="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-bold">
                            <i class="fas fa-calendar mr-2"></i>Planning Complet
                        </a>
                    </div>
                    
                    <div id="interventions-list" class="space-y-4">
                        <div class="text-center text-gray-400 py-8">
                            <i class="fas fa-spinner fa-spin text-3xl mb-2"></i>
                            <p>Chargement des interventions...</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- ONGLET AUDITS -->
            <div id="tab-audits" class="tab-content hidden">
                <div class="bg-gray-900 rounded-lg p-6 border-2 border-green-400">
                    <h2 class="text-2xl font-black mb-6">
                        <i class="fas fa-clipboard-list mr-2 text-green-400"></i>
                        TOUS LES AUDITS
                    </h2>
                    <div id="all-audits-list"></div>
                </div>
            </div>
            
            <!-- ONGLET PLANNING -->
            <div id="tab-planning" class="tab-content hidden">
                <div class="bg-gray-900 rounded-lg p-6 border-2 border-purple-400">
                    <h2 class="text-2xl font-black mb-6">
                        <i class="fas fa-calendar mr-2 text-purple-400"></i>
                        PLANNING INTERVENTIONS
                    </h2>
                    <iframe src="/planning" class="w-full h-screen border-0 rounded-lg"></iframe>
                </div>
            </div>
            
            <!-- ONGLET CLIENTS -->
            <div id="tab-clients" class="tab-content hidden">
                <div class="bg-gray-900 rounded-lg p-6 border-2 border-blue-400">
                    <h2 class="text-2xl font-black mb-6">
                        <i class="fas fa-users mr-2 text-blue-400"></i>
                        GESTION CLIENTS
                    </h2>
                    <iframe src="/crm/clients" class="w-full h-screen border-0 rounded-lg"></iframe>
                </div>
            </div>
        </div>
        
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            // Gestion des onglets
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const tabName = btn.dataset.tab
                    
                    // Désactiver tous les onglets
                    document.querySelectorAll('.tab-btn').forEach(b => {
                        b.classList.remove('active', 'border-yellow-400', 'text-yellow-400')
                        b.classList.add('border-transparent', 'text-gray-400')
                    })
                    
                    // Activer l'onglet cliqué
                    btn.classList.add('active', 'border-yellow-400', 'text-yellow-400')
                    btn.classList.remove('border-transparent', 'text-gray-400')
                    
                    // Cacher tous les contenus
                    document.querySelectorAll('.tab-content').forEach(content => {
                        content.classList.add('hidden')
                    })
                    
                    // Afficher le contenu sélectionné
                    document.getElementById('tab-' + tabName).classList.remove('hidden')
                })
            })
            
            // Charger les KPIs
            async function loadKPIs() {
                try {
                    // Clients
                    const clientsRes = await axios.get('/api/crm/clients')
                    document.getElementById('stat-clients').textContent = clientsRes.data.count || 0
                    
                    // Sites
                    const sitesRes = await axios.get('/api/crm/projects')
                    document.getElementById('stat-sites').textContent = sitesRes.data.count || 0
                    
                    // Audits actifs
                    const auditsRes = await axios.get('/api/audits/list')
                    const auditsActifs = auditsRes.data.audits.filter(a => a.status === 'en_cours')
                    document.getElementById('stat-audits-actifs').textContent = auditsActifs.length
                    
                    // Interventions semaine
                    const interventionsRes = await axios.get('/api/planning/interventions')
                    const today = new Date()
                    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
                    const interventionsSemaine = interventionsRes.data.interventions.filter(i => {
                        const date = new Date(i.intervention_date)
                        return date >= today && date <= nextWeek
                    })
                    document.getElementById('stat-interventions').textContent = interventionsSemaine.length
                    
                } catch (error) {
                    console.error('Erreur chargement KPIs:', error)
                }
            }
            
            // Charger les audits en cours
            async function loadAudits() {
                try {
                    const response = await axios.get('/api/audits/list')
                    const audits = response.data.audits.filter(a => a.status === 'en_cours')
                    
                    const container = document.getElementById('audits-list')
                    
                    if (audits.length === 0) {
                        container.innerHTML = \`
                            <div class="text-center text-gray-400 py-8">
                                <i class="fas fa-inbox text-4xl mb-4"></i>
                                <p class="text-lg">Aucun audit en cours</p>
                                <a href="/audits/create" class="inline-block mt-4 bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-bold">
                                    <i class="fas fa-plus mr-2"></i>Créer un audit
                                </a>
                            </div>
                        \`
                        return
                    }
                    
                    container.innerHTML = audits.map(audit => {
                        const modules = JSON.parse(audit.modules_enabled || '[]')
                        const modulesIcons = {
                            'EL': '<i class="fas fa-moon text-green-400"></i>',
                            'IV': '<i class="fas fa-chart-line text-orange-400"></i>',
                            'VISUAL': '<i class="fas fa-eye text-teal-400"></i>',
                            'ISOLATION': '<i class="fas fa-bolt text-red-400"></i>'
                        }
                        
                        return \`
                            <div class="audit-card bg-gray-800 rounded-lg p-4 border border-gray-700 cursor-pointer"
                                 onclick="window.location.href='/audit/\${audit.audit_token}'">
                                <div class="flex items-center justify-between">
                                    <div class="flex-1">
                                        <h3 class="text-xl font-bold text-yellow-400 mb-1">\${audit.project_name}</h3>
                                        <p class="text-gray-300 mb-2">\${audit.client_name}</p>
                                        <div class="flex items-center gap-4 text-sm text-gray-400">
                                            <span><i class="fas fa-map-marker-alt mr-1"></i>\${audit.location || 'N/A'}</span>
                                            <span><i class="fas fa-calendar mr-1"></i>\${audit.audit_date}</span>
                                        </div>
                                    </div>
                                    
                                    <div class="flex flex-col items-end gap-2">
                                        <div class="flex gap-2">
                                            \${modules.map(m => modulesIcons[m] || '').join(' ')}
                                        </div>
                                        <span class="bg-green-600 px-3 py-1 rounded-full text-xs font-bold">
                                            EN COURS
                                        </span>
                                    </div>
                                </div>
                            </div>
                        \`
                    }).join('')
                    
                } catch (error) {
                    console.error('Erreur chargement audits:', error)
                    document.getElementById('audits-list').innerHTML = \`
                        <div class="text-center text-red-400 py-8">
                            <i class="fas fa-exclamation-triangle text-3xl mb-2"></i>
                            <p>Erreur de chargement</p>
                        </div>
                    \`
                }
            }
            
            // Charger les interventions à venir
            async function loadInterventions() {
                try {
                    const response = await axios.get('/api/planning/interventions')
                    const today = new Date()
                    const interventions = response.data.interventions
                        .filter(i => new Date(i.intervention_date) >= today)
                        .sort((a, b) => new Date(a.intervention_date) - new Date(b.intervention_date))
                        .slice(0, 5)
                    
                    const container = document.getElementById('interventions-list')
                    
                    if (interventions.length === 0) {
                        container.innerHTML = \`
                            <div class="text-center text-gray-400 py-8">
                                <i class="fas fa-calendar-times text-4xl mb-4"></i>
                                <p class="text-lg">Aucune intervention planifiée</p>
                            </div>
                        \`
                        return
                    }
                    
                    container.innerHTML = interventions.map(intervention => \`
                        <div class="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-purple-400 cursor-pointer"
                             onclick="window.location.href='/planning/detail?id=\${intervention.id}'">
                            <div class="flex items-center justify-between">
                                <div>
                                    <h4 class="font-bold text-lg text-purple-300">\${intervention.intervention_type}</h4>
                                    <p class="text-gray-400 text-sm">\${intervention.project_name || 'Projet N/A'}</p>
                                </div>
                                <div class="text-right">
                                    <p class="font-bold text-yellow-400">\${new Date(intervention.intervention_date).toLocaleDateString('fr-FR')}</p>
                                    <p class="text-sm text-gray-400">\${intervention.status || 'Planifiée'}</p>
                                </div>
                            </div>
                        </div>
                    \`).join('')
                    
                } catch (error) {
                    console.error('Erreur chargement interventions:', error)
                    document.getElementById('interventions-list').innerHTML = \`
                        <div class="text-center text-red-400 py-8">
                            <i class="fas fa-exclamation-triangle text-3xl mb-2"></i>
                            <p>Erreur de chargement</p>
                        </div>
                    \`
                }
            }
            
            // Initialisation
            document.addEventListener('DOMContentLoaded', () => {
                loadKPIs()
                loadAudits()
                loadInterventions()
            })
        </script>
    </body>
    </html>
  `
}
