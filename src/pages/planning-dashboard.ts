// Page Planning Dashboard - Vue d'ensemble planning & interventions
// Intégration dynamique avec CRM, Projets, Auth

export function getPlanningDashboardPage() {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Planning & Attribution - Diagnostic Hub</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        body { background: #f8fafc; }
        .stat-card { transition: transform 0.2s, box-shadow 0.2s; }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
        .intervention-row { transition: background 0.2s; }
        .intervention-row:hover { background: #f1f5f9; }
        .badge { padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; }
        .badge-scheduled { background: #dbeafe; color: #1e40af; }
        .badge-in_progress { background: #fef3c7; color: #92400e; }
        .badge-completed { background: #d1fae5; color: #065f46; }
        .badge-cancelled { background: #fee2e2; color: #991b1b; }
        .filter-btn { transition: all 0.2s; }
        .filter-btn.active { background: #3b82f6; color: white; }
    </style>
</head>
<body class="min-h-screen">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4">
                    <a href="/" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-arrow-left"></i>
                    </a>
                    <h1 class="text-2xl font-bold text-gray-900">
                        <i class="fas fa-calendar-alt text-blue-600 mr-2"></i>
                        Planning & Attribution
                    </h1>
                </div>
                <div class="flex items-center space-x-3">
                    <a href="/planning/create" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition">
                        <i class="fas fa-plus mr-2"></i>
                        Nouvelle Intervention
                    </a>
                    <a href="/admin/users" class="text-gray-600 hover:text-gray-900">
                        <i class="fas fa-users-cog text-xl"></i>
                    </a>
                </div>
            </div>
        </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" id="stats-container">
            <!-- Chargement stats... -->
            <div class="bg-white rounded-xl shadow-sm p-6 animate-pulse">
                <div class="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div class="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
        </div>

        <!-- Filtres -->
        <div class="bg-white rounded-xl shadow-sm p-6 mb-8">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">
                <i class="fas fa-filter text-gray-500 mr-2"></i>
                Filtres
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <!-- Filtre Status -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                    <select id="filter-status" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="">Tous les statuts</option>
                        <option value="scheduled">Planifiée</option>
                        <option value="in_progress">En cours</option>
                        <option value="completed">Terminée</option>
                        <option value="cancelled">Annulée</option>
                    </select>
                </div>

                <!-- Filtre Type -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Type d'audit</label>
                    <select id="filter-type" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="">Tous les types</option>
                        <option value="el_audit">Audit EL</option>
                        <option value="iv_test">Test I-V</option>
                        <option value="thermography">Thermographie</option>
                        <option value="visual_inspection">Inspection visuelle</option>
                        <option value="isolation_test">Test isolation</option>
                        <option value="commissioning">Commissioning</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="post_incident">Post-sinistre</option>
                    </select>
                </div>

                <!-- Filtre Période -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Date début</label>
                    <input type="date" id="filter-date-from" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Date fin</label>
                    <input type="date" id="filter-date-to" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                </div>
            </div>

            <div class="flex items-center justify-between mt-4">
                <label class="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" id="filter-unassigned" class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
                    <span class="text-sm font-medium text-gray-700">Non assignées uniquement</span>
                </label>
                <div class="flex space-x-2">
                    <button onclick="resetFilters()" class="text-gray-600 hover:text-gray-900 text-sm font-medium">
                        <i class="fas fa-undo mr-1"></i>
                        Réinitialiser
                    </button>
                    <button onclick="applyFilters()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                        <i class="fas fa-search mr-1"></i>
                        Appliquer
                    </button>
                </div>
            </div>
        </div>

        <!-- Liste Interventions -->
        <div class="bg-white rounded-xl shadow-sm overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 class="text-lg font-semibold text-gray-900">
                    <i class="fas fa-list text-gray-500 mr-2"></i>
                    Interventions
                    <span id="intervention-count" class="text-gray-500 text-sm font-normal ml-2">(0)</span>
                </h2>
                <div class="flex space-x-2">
                    <button onclick="refreshData()" class="text-gray-600 hover:text-gray-900 transition">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                    <button onclick="window.location.href='/planning/calendar'" class="text-gray-600 hover:text-gray-900 transition">
                        <i class="fas fa-calendar text-lg"></i>
                    </button>
                </div>
            </div>

            <div id="interventions-container">
                <!-- Chargement... -->
                <div class="p-8 text-center text-gray-500">
                    <i class="fas fa-spinner fa-spin text-3xl mb-4"></i>
                    <p>Chargement des interventions...</p>
                </div>
            </div>
        </div>

    </main>

    <script>
        let currentFilters = {};

        // Charger données au démarrage
        document.addEventListener('DOMContentLoaded', () => {
            loadStats();
            loadInterventions();
        });

        // Charger statistiques
        async function loadStats() {
            try {
                const response = await fetch('/api/planning/dashboard');
                const data = await response.json();

                if (!data.success) {
                    throw new Error(data.error);
                }

                const stats = data.stats;
                const statsHTML = \`
                    <div class="stat-card bg-white rounded-xl shadow-sm p-6">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-gray-600 text-sm font-medium">Total</span>
                            <i class="fas fa-clipboard-list text-gray-400 text-xl"></i>
                        </div>
                        <div class="text-3xl font-bold text-gray-900">\${stats.total_interventions}</div>
                        <div class="text-xs text-gray-500 mt-1">Toutes interventions</div>
                    </div>

                    <div class="stat-card bg-white rounded-xl shadow-sm p-6">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-gray-600 text-sm font-medium">Planifiées</span>
                            <i class="fas fa-calendar-check text-blue-400 text-xl"></i>
                        </div>
                        <div class="text-3xl font-bold text-blue-600">\${stats.scheduled}</div>
                        <div class="text-xs text-gray-500 mt-1">
                            <span class="text-orange-600 font-semibold">\${stats.upcoming_7_days}</span> dans 7 jours
                        </div>
                    </div>

                    <div class="stat-card bg-white rounded-xl shadow-sm p-6">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-gray-600 text-sm font-medium">En cours</span>
                            <i class="fas fa-spinner text-yellow-400 text-xl"></i>
                        </div>
                        <div class="text-3xl font-bold text-yellow-600">\${stats.in_progress}</div>
                        <div class="text-xs text-gray-500 mt-1">Interventions actives</div>
                    </div>

                    <div class="stat-card bg-white rounded-xl shadow-sm p-6">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-gray-600 text-sm font-medium">Non assignées</span>
                            <i class="fas fa-user-slash text-red-400 text-xl"></i>
                        </div>
                        <div class="text-3xl font-bold text-red-600">\${stats.unassigned}</div>
                        <div class="text-xs text-gray-500 mt-1">Sans technicien</div>
                    </div>
                \`;

                document.getElementById('stats-container').innerHTML = statsHTML;

            } catch (error) {
                console.error('Erreur chargement stats:', error);
                document.getElementById('stats-container').innerHTML = \`
                    <div class="col-span-4 bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                        <i class="fas fa-exclamation-triangle text-red-600 text-2xl mb-2"></i>
                        <p class="text-red-800 font-medium">Erreur de chargement des statistiques</p>
                        <p class="text-red-600 text-sm mt-1">\${error.message}</p>
                        <button onclick="loadStats()" class="mt-3 text-red-600 hover:text-red-800 font-medium">
                            <i class="fas fa-redo mr-1"></i> Réessayer
                        </button>
                    </div>
                \`;
            }
        }

        // Charger interventions
        async function loadInterventions() {
            const container = document.getElementById('interventions-container');
            
            try {
                // Construction URL avec filtres
                const params = new URLSearchParams(currentFilters);
                const response = await fetch(\`/api/planning/interventions?\${params}\`);
                const data = await response.json();

                if (!data.success) {
                    throw new Error(data.error);
                }

                document.getElementById('intervention-count').textContent = \`(\${data.total})\`;

                if (data.total === 0) {
                    container.innerHTML = \`
                        <div class="p-12 text-center">
                            <i class="fas fa-inbox text-gray-300 text-5xl mb-4"></i>
                            <p class="text-gray-600 text-lg font-medium">Aucune intervention trouvée</p>
                            <p class="text-gray-500 text-sm mt-2">Créez votre première intervention pour commencer</p>
                            <a href="/planning/create" class="inline-block mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition">
                                <i class="fas fa-plus mr-2"></i>
                                Créer une intervention
                            </a>
                        </div>
                    \`;
                    return;
                }

                const interventionsHTML = \`
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead class="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Projet / Client</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Technicien</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                \${data.interventions.map(intervention => \`
                                    <tr class="intervention-row cursor-pointer" onclick="window.location.href='/planning/interventions/\${intervention.id}'">
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="flex items-center">
                                                <i class="far fa-calendar text-gray-400 mr-2"></i>
                                                <span class="text-sm font-medium text-gray-900">
                                                    \${new Date(intervention.intervention_date).toLocaleDateString('fr-FR')}
                                                </span>
                                            </div>
                                            \${intervention.duration_hours ? \`
                                                <div class="text-xs text-gray-500 ml-6">\${intervention.duration_hours}h</div>
                                            \` : ''}
                                        </td>
                                        <td class="px-6 py-4">
                                            <div class="text-sm font-medium text-gray-900">\${intervention.project_name || 'Projet inconnu'}</div>
                                            <div class="text-xs text-gray-500">
                                                <i class="fas fa-building text-gray-400 mr-1"></i>
                                                \${intervention.client_name || 'Client inconnu'}
                                            </div>
                                            \${intervention.project_location ? \`
                                                <div class="text-xs text-gray-500 mt-1">
                                                    <i class="fas fa-map-marker-alt text-gray-400 mr-1"></i>
                                                    \${intervention.project_location}
                                                </div>
                                            \` : ''}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="text-sm text-gray-900">\${formatInterventionType(intervention.intervention_type)}</span>
                                        </td>
                                        <td class="px-6 py-4">
                                            \${intervention.technician_email ? \`
                                                <div class="flex items-center">
                                                    <i class="fas fa-user-circle text-blue-600 mr-2"></i>
                                                    <span class="text-sm text-gray-900">\${intervention.technician_email}</span>
                                                </div>
                                            \` : \`
                                                <span class="text-sm text-red-600 font-medium">
                                                    <i class="fas fa-user-slash mr-1"></i>
                                                    Non assigné
                                                </span>
                                            \`}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="badge badge-\${intervention.status}">
                                                \${formatStatus(intervention.status)}
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                                            <div class="flex space-x-2">
                                                <button onclick="event.stopPropagation(); window.location.href='/planning/interventions/\${intervention.id}'" class="text-blue-600 hover:text-blue-800" title="Voir détails">
                                                    <i class="fas fa-eye"></i>
                                                </button>
                                                <button onclick="event.stopPropagation(); editIntervention(\${intervention.id})" class="text-gray-600 hover:text-gray-800" title="Modifier">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                \${!intervention.technician_id ? \`
                                                    <button onclick="event.stopPropagation(); assignTechnician(\${intervention.id})" class="text-green-600 hover:text-green-800" title="Assigner technicien">
                                                        <i class="fas fa-user-plus"></i>
                                                    </button>
                                                \` : ''}
                                            </div>
                                        </td>
                                    </tr>
                                \`).join('')}
                            </tbody>
                        </table>
                    </div>
                \`;

                container.innerHTML = interventionsHTML;

            } catch (error) {
                console.error('Erreur chargement interventions:', error);
                container.innerHTML = \`
                    <div class="p-8 text-center">
                        <i class="fas fa-exclamation-triangle text-red-600 text-3xl mb-4"></i>
                        <p class="text-red-800 font-medium">Erreur de chargement</p>
                        <p class="text-red-600 text-sm mt-1">\${error.message}</p>
                        <button onclick="loadInterventions()" class="mt-3 text-red-600 hover:text-red-800 font-medium">
                            <i class="fas fa-redo mr-1"></i> Réessayer
                        </button>
                    </div>
                \`;
            }
        }

        // Formattage type intervention
        function formatInterventionType(type) {
            const types = {
                'el_audit': 'Audit EL',
                'iv_test': 'Test I-V',
                'thermography': 'Thermographie',
                'visual_inspection': 'Inspection visuelle',
                'isolation_test': 'Test isolation',
                'post_incident': 'Post-sinistre',
                'commissioning': 'Commissioning',
                'maintenance': 'Maintenance'
            };
            return types[type] || type;
        }

        // Formattage statut
        function formatStatus(status) {
            const statuses = {
                'scheduled': 'Planifiée',
                'in_progress': 'En cours',
                'completed': 'Terminée',
                'cancelled': 'Annulée'
            };
            return statuses[status] || status;
        }

        // Appliquer filtres
        function applyFilters() {
            currentFilters = {};

            const status = document.getElementById('filter-status').value;
            const type = document.getElementById('filter-type').value;
            const dateFrom = document.getElementById('filter-date-from').value;
            const dateTo = document.getElementById('filter-date-to').value;
            const unassigned = document.getElementById('filter-unassigned').checked;

            if (status) currentFilters.status = status;
            if (type) currentFilters.intervention_type = type;
            if (dateFrom) currentFilters.date_from = dateFrom;
            if (dateTo) currentFilters.date_to = dateTo;
            if (unassigned) currentFilters.unassigned_only = 'true';

            loadInterventions();
        }

        // Réinitialiser filtres
        function resetFilters() {
            document.getElementById('filter-status').value = '';
            document.getElementById('filter-type').value = '';
            document.getElementById('filter-date-from').value = '';
            document.getElementById('filter-date-to').value = '';
            document.getElementById('filter-unassigned').checked = false;
            currentFilters = {};
            loadInterventions();
        }

        // Rafraîchir données
        function refreshData() {
            loadStats();
            loadInterventions();
        }

        // Éditer intervention
        function editIntervention(id) {
            window.location.href = \`/planning/interventions/\${id}\`;
        }

        // Assigner technicien (modal rapide)
        async function assignTechnician(interventionId) {
            // TODO: Modal attribution rapide
            alert('Modal attribution technicien - À implémenter');
        }

        // Auto-refresh toutes les 30s
        setInterval(refreshData, 30000);
    </script>
</body>
</html>
  `;
}
