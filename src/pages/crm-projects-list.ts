// Page Liste Projets/Sites CRM - Vue d'ensemble tous sites avec filtres
// Navigation vers création, détail, édition

export function getCrmProjectsListPage() {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Liste Sites/Projets - CRM DiagPV</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        body { background: #f8fafc; }
        .project-row:hover { background: #f9fafb; }
        .stat-card { background: white; border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .badge-status { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; }
        .badge-active { background: #dcfce7; color: #166534; }
        .badge-completed { background: #dbeafe; color: #1e3a8a; }
        .badge-pending { background: #fef3c7; color: #92400e; }
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
                        <i class="fas fa-solar-panel text-blue-600 mr-2"></i>
                        Gestion Sites / Projets
                    </h1>
                </div>
                <div class="flex items-center space-x-3">
                    <a href="/crm/clients" class="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition">
                        <i class="fas fa-building mr-2"></i>
                        Voir Clients
                    </a>
                    <a href="/crm/projects/create" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition">
                        <i class="fas fa-plus mr-2"></i>
                        Nouveau Site
                    </a>
                </div>
            </div>
        </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="stat-card">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-600 text-sm font-medium">Total Sites</p>
                        <p id="stat-total" class="text-3xl font-bold text-gray-900 mt-1">0</p>
                    </div>
                    <div class="bg-blue-100 text-blue-600 p-3 rounded-lg">
                        <i class="fas fa-solar-panel text-2xl"></i>
                    </div>
                </div>
            </div>

            <div class="stat-card">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-600 text-sm font-medium">Puissance Totale</p>
                        <p id="stat-power" class="text-3xl font-bold text-gray-900 mt-1">0 kWp</p>
                    </div>
                    <div class="bg-yellow-100 text-yellow-600 p-3 rounded-lg">
                        <i class="fas fa-bolt text-2xl"></i>
                    </div>
                </div>
            </div>

            <div class="stat-card">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-600 text-sm font-medium">Modules Totaux</p>
                        <p id="stat-modules" class="text-3xl font-bold text-gray-900 mt-1">0</p>
                    </div>
                    <div class="bg-green-100 text-green-600 p-3 rounded-lg">
                        <i class="fas fa-layer-group text-2xl"></i>
                    </div>
                </div>
            </div>

            <div class="stat-card">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-600 text-sm font-medium">Interventions</p>
                        <p id="stat-interventions" class="text-3xl font-bold text-gray-900 mt-1">0</p>
                    </div>
                    <div class="bg-purple-100 text-purple-600 p-3 rounded-lg">
                        <i class="fas fa-calendar-check text-2xl"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Filters & Search -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        <i class="fas fa-search mr-1"></i>
                        Rechercher
                    </label>
                    <input type="text" id="search-input" placeholder="Nom site, ville, client..." 
                           class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        <i class="fas fa-building mr-1"></i>
                        Client
                    </label>
                    <select id="filter-client" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="">Tous les clients</option>
                    </select>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        <i class="fas fa-info-circle mr-1"></i>
                        Statut
                    </label>
                    <select id="filter-status" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="">Tous les statuts</option>
                        <option value="active">Actif</option>
                        <option value="completed">Terminé</option>
                        <option value="pending">En attente</option>
                    </select>
                </div>
            </div>
        </div>

        <!-- Projects Table -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Nom du Site
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Client
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Localisation
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Puissance
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Modules
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Interventions
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Statut
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody id="projects-tbody" class="bg-white divide-y divide-gray-200">
                        <!-- Populated by JS -->
                    </tbody>
                </table>
            </div>

            <!-- Empty State -->
            <div id="empty-state" class="text-center py-12" style="display: none;">
                <i class="fas fa-solar-panel text-gray-300 text-6xl mb-4"></i>
                <h3 class="text-lg font-medium text-gray-900 mb-2">Aucun site trouvé</h3>
                <p class="text-gray-500 mb-6">Commencez par créer votre premier site</p>
                <a href="/crm/projects/create" class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition">
                    <i class="fas fa-plus mr-2"></i>
                    Créer un site
                </a>
            </div>
        </div>

    </main>

    <script>
        let allProjects = [];
        let allClients = [];
        let allInterventions = [];

        // Load all data
        async function init() {
            await Promise.all([
                loadProjects(),
                loadClients(),
                loadInterventions()
            ]);

            populateClientFilter();
            updateStats();
            renderProjects();
            setupFilters();
        }

        async function loadProjects() {
            const response = await fetch('/api/crm/projects');
            if (response.ok) {
                const data = await response.json();
                allProjects = data.projects || [];
            }
        }

        async function loadClients() {
            const response = await fetch('/api/crm/clients');
            if (response.ok) {
                const data = await response.json();
                allClients = data.clients || [];
            }
        }

        async function loadInterventions() {
            const response = await fetch('/api/planning/interventions');
            if (response.ok) {
                const data = await response.json();
                allInterventions = data.interventions || [];
            }
        }

        function populateClientFilter() {
            const select = document.getElementById('filter-client');
            allClients.forEach(client => {
                const option = document.createElement('option');
                option.value = client.id;
                option.textContent = client.company_name;
                select.appendChild(option);
            });
        }

        function updateStats() {
            document.getElementById('stat-total').textContent = allProjects.length;

            const totalPower = allProjects.reduce((sum, p) => sum + (parseFloat(p.total_power_kwp) || 0), 0);
            document.getElementById('stat-power').textContent = totalPower.toFixed(2) + ' kWp';

            const totalModules = allProjects.reduce((sum, p) => sum + (parseInt(p.module_count) || 0), 0);
            document.getElementById('stat-modules').textContent = totalModules;

            document.getElementById('stat-interventions').textContent = allInterventions.length;
        }

        function renderProjects() {
            const tbody = document.getElementById('projects-tbody');
            const emptyState = document.getElementById('empty-state');

            const searchTerm = document.getElementById('search-input').value.toLowerCase();
            const filterClient = document.getElementById('filter-client').value;
            const filterStatus = document.getElementById('filter-status').value;

            let filtered = allProjects.filter(project => {
                const client = allClients.find(c => c.id === project.client_id);
                const clientName = client ? client.company_name : '';

                const matchesSearch = !searchTerm || 
                    (project.name || project.project_name || '').toLowerCase().includes(searchTerm) ||
                    (project.address_city || '').toLowerCase().includes(searchTerm) ||
                    clientName.toLowerCase().includes(searchTerm);

                const matchesClient = !filterClient || project.client_id == filterClient;
                const matchesStatus = !filterStatus || project.status === filterStatus;

                return matchesSearch && matchesClient && matchesStatus;
            });

            if (filtered.length === 0) {
                tbody.innerHTML = '';
                emptyState.style.display = 'block';
                return;
            }

            emptyState.style.display = 'none';

            tbody.innerHTML = filtered.map(project => {
                const client = allClients.find(c => c.id === project.client_id);
                const clientName = client ? client.company_name : 'N/A';
                
                const interventionsCount = allInterventions.filter(i => i.project_id === project.id).length;

                const statusClass = project.status === 'active' ? 'badge-active' : 
                                   project.status === 'completed' ? 'badge-completed' : 'badge-pending';

                return \`
                    <tr class="project-row">
                        <td class="px-6 py-4">
                            <div class="flex items-center">
                                <i class="fas fa-solar-panel text-blue-600 mr-3"></i>
                                <div>
                                    <p class="font-semibold text-gray-900">\${project.name || project.project_name}</p>
                                    <p class="text-xs text-gray-500">Créé le \${new Date(project.created_at).toLocaleDateString('fr-FR')}</p>
                                </div>
                            </div>
                        </td>
                        <td class="px-6 py-4">
                            <a href="/crm/clients/detail?id=\${project.client_id}" class="text-blue-600 hover:underline">
                                \${clientName}
                            </a>
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-700">
                            \${project.address_city || 'N/A'}
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-700">
                            <i class="fas fa-bolt text-yellow-500 mr-1"></i>
                            \${project.total_power_kwp || 'N/A'} kWp
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-700">
                            <i class="fas fa-layer-group text-green-500 mr-1"></i>
                            \${project.module_count || 'N/A'}
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-700">
                            <i class="fas fa-calendar-check text-purple-500 mr-1"></i>
                            \${interventionsCount}
                        </td>
                        <td class="px-6 py-4">
                            <span class="badge-status \${statusClass}">
                                \${project.status || 'pending'}
                            </span>
                        </td>
                        <td class="px-6 py-4">
                            <div class="flex items-center space-x-2">
                                <a href="/crm/projects/detail?id=\${project.id}" 
                                   class="text-blue-600 hover:text-blue-700 text-sm font-medium">
                                    <i class="fas fa-eye mr-1"></i>
                                    Voir
                                </a>
                                <a href="/crm/projects/edit?id=\${project.id}" 
                                   class="text-gray-600 hover:text-gray-700 text-sm font-medium">
                                    <i class="fas fa-edit mr-1"></i>
                                    Modifier
                                </a>
                            </div>
                        </td>
                    </tr>
                \`;
            }).join('');
        }

        function setupFilters() {
            document.getElementById('search-input').addEventListener('input', renderProjects);
            document.getElementById('filter-client').addEventListener('change', renderProjects);
            document.getElementById('filter-status').addEventListener('change', renderProjects);
        }

        // Initialize
        init();
    </script>

</body>
</html>
  `;
}
