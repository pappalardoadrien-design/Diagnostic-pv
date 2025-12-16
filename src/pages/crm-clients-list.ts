// Page Liste Clients CRM - Vue d'ensemble avec liens vers détails
// Navigation vers création, édition, suppression

export function getCrmClientsListPage() {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Liste Clients - CRM DiagPV</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        body { background: #f8fafc; }
        .client-row:hover { background: #f9fafb; }
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
                        <i class="fas fa-building text-blue-600 mr-2"></i>
                        Gestion Clients CRM
                    </h1>
                </div>
                <div class="flex items-center space-x-3">
                    <a href="/crm/projects" class="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition">
                        <i class="fas fa-solar-panel mr-2"></i>
                        Voir Sites/Projets
                    </a>
                    <a href="/crm/clients/create" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition">
                        <i class="fas fa-plus mr-2"></i>
                        Nouveau Client
                    </a>
                </div>
            </div>
        </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="bg-white rounded-lg shadow-sm p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-gray-600 mb-1">Total Clients</p>
                        <p id="stat-total" class="text-3xl font-bold text-gray-900">-</p>
                    </div>
                    <div class="bg-blue-100 p-3 rounded-lg">
                        <i class="fas fa-building text-2xl text-blue-600"></i>
                    </div>
                </div>
            </div>
            <div class="bg-white rounded-lg shadow-sm p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-gray-600 mb-1">Clients Actifs</p>
                        <p id="stat-active" class="text-3xl font-bold text-green-600">-</p>
                    </div>
                    <div class="bg-green-100 p-3 rounded-lg">
                        <i class="fas fa-check-circle text-2xl text-green-600"></i>
                    </div>
                </div>
            </div>
            <div class="bg-white rounded-lg shadow-sm p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-gray-600 mb-1">Total Sites</p>
                        <p id="stat-projects" class="text-3xl font-bold text-purple-600">-</p>
                    </div>
                    <div class="bg-purple-100 p-3 rounded-lg">
                        <i class="fas fa-solar-panel text-2xl text-purple-600"></i>
                    </div>
                </div>
            </div>
            <div class="bg-white rounded-lg shadow-sm p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-gray-600 mb-1">Interventions</p>
                        <p id="stat-interventions" class="text-3xl font-bold text-orange-600">-</p>
                    </div>
                    <div class="bg-orange-100 p-3 rounded-lg">
                        <i class="fas fa-calendar-check text-2xl text-orange-600"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Filtres -->
        <div class="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-semibold text-gray-900">
                    <i class="fas fa-filter text-gray-500 mr-2"></i>
                    Filtres
                </h2>
                <button id="btnResetFilters" class="text-sm text-blue-600 hover:text-blue-800">
                    Réinitialiser
                </button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Recherche</label>
                    <input 
                        type="text" 
                        id="filter-search" 
                        placeholder="Nom, SIRET, email..."
                        class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    >
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                    <select id="filter-status" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500">
                        <option value="">Tous</option>
                        <option value="active">Actif</option>
                        <option value="inactive">Inactif</option>
                        <option value="prospect">Prospect</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <select id="filter-type" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500">
                        <option value="">Tous</option>
                        <option value="company">Entreprise</option>
                        <option value="individual">Particulier</option>
                    </select>
                </div>
            </div>
        </div>

        <!-- Table Clients -->
        <div class="bg-white rounded-lg shadow-sm overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Client
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Contact Principal
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                SIRET
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Sites
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Statut
                            </th>
                            <th class="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody id="clientsTableBody" class="divide-y divide-gray-200">
                        <!-- Contenu dynamique -->
                    </tbody>
                </table>
            </div>
            
            <!-- Empty State -->
            <div id="emptyState" class="hidden p-12 text-center">
                <i class="fas fa-building text-6xl text-gray-300 mb-4"></i>
                <h3 class="text-lg font-semibold text-gray-900 mb-2">Aucun client</h3>
                <p class="text-gray-600 mb-6">Commencez par créer votre premier client</p>
                <a href="/crm/clients/create" class="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium">
                    <i class="fas fa-plus mr-2"></i>
                    Créer un client
                </a>
            </div>
        </div>

    </main>

    <script>
        let allClients = [];
        let allProjects = [];
        let allInterventions = [];

        // Chargement initial
        async function init() {
            await Promise.all([
                loadClients(),
                loadProjects(),
                loadInterventions()
            ]);
            updateStats();
            renderClients();
        }

        // Charger clients
        async function loadClients() {
            try {
                const response = await fetch('/api/crm/clients');
                const data = await response.json();
                if (data.success) {
                    allClients = data.clients || [];
                }
            } catch (error) {
                console.error('Erreur chargement clients:', error);
            }
        }

        // Charger projets
        async function loadProjects() {
            try {
                const response = await fetch('/api/crm/clients');
                const data = await response.json();
                if (data.success && data.clients) {
                    // Charger projets de chaque client
                    const projectPromises = data.clients.map(client => 
                        fetch(\`/api/crm/clients/\${client.id}/projects\`).then(r => r.json())
                    );
                    const projectsData = await Promise.all(projectPromises);
                    allProjects = projectsData.flatMap(d => d.success ? d.projects : []);
                }
            } catch (error) {
                console.error('Erreur chargement projets:', error);
            }
        }

        // Charger interventions
        async function loadInterventions() {
            try {
                const response = await fetch('/api/planning/interventions');
                const data = await response.json();
                if (data.success) {
                    allInterventions = data.interventions || [];
                }
            } catch (error) {
                console.error('Erreur chargement interventions:', error);
            }
        }

        // Update stats
        function updateStats() {
            document.getElementById('stat-total').textContent = allClients.length;
            document.getElementById('stat-active').textContent = 
                allClients.filter(c => c.status === 'active').length;
            document.getElementById('stat-projects').textContent = allProjects.length;
            document.getElementById('stat-interventions').textContent = allInterventions.length;
        }

        // Rendu clients
        function renderClients() {
            const search = document.getElementById('filter-search').value.toLowerCase();
            const status = document.getElementById('filter-status').value;
            const type = document.getElementById('filter-type').value;

            let filtered = allClients.filter(client => {
                if (search && !(
                    client.company_name?.toLowerCase().includes(search) ||
                    client.siret?.includes(search) ||
                    client.main_contact_email?.toLowerCase().includes(search)
                )) return false;
                
                if (status && client.status !== status) return false;
                if (type && client.client_type !== type) return false;
                
                return true;
            });

            const tbody = document.getElementById('clientsTableBody');
            const emptyState = document.getElementById('emptyState');

            if (filtered.length === 0) {
                tbody.innerHTML = '';
                emptyState.classList.remove('hidden');
                return;
            }

            emptyState.classList.add('hidden');
            tbody.innerHTML = filtered.map(client => {
                const projectsCount = allProjects.filter(p => p.client_id === client.id).length;
                
                return \`
                    <tr class="client-row cursor-pointer" onclick="window.location.href='/crm/clients/detail?id=\${client.id}'">
                        <td class="px-6 py-4">
                            <div class="flex items-center">
                                <div class="bg-blue-100 p-2 rounded-lg mr-3">
                                    <i class="fas fa-building text-blue-600"></i>
                                </div>
                                <div>
                                    <div class="text-sm font-semibold text-gray-900">\${client.company_name}</div>
                                    <div class="text-sm text-gray-500">\${client.client_type === 'company' ? 'Entreprise' : 'Particulier'}</div>
                                </div>
                            </div>
                        </td>
                        <td class="px-6 py-4">
                            <div class="text-sm text-gray-900">\${client.main_contact_name || '-'}</div>
                            <div class="text-sm text-gray-500">\${client.main_contact_email || '-'}</div>
                            <div class="text-sm text-gray-500">\${client.main_contact_phone || '-'}</div>
                        </td>
                        <td class="px-6 py-4">
                            <div class="text-sm font-mono text-gray-900">\${client.siret || '-'}</div>
                        </td>
                        <td class="px-6 py-4">
                            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-800">
                                <i class="fas fa-solar-panel mr-1"></i>
                                \${projectsCount}
                            </span>
                        </td>
                        <td class="px-6 py-4">
                            \${getStatusBadge(client.status)}
                        </td>
                        <td class="px-6 py-4 text-right">
                            <button onclick="event.stopPropagation(); window.location.href='/crm/clients/detail?id=\${client.id}'" class="text-blue-600 hover:text-blue-800 mr-3" title="Voir">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button onclick="event.stopPropagation(); window.location.href='/crm/clients/edit?id=\${client.id}'" class="text-gray-600 hover:text-gray-800 mr-3" title="Modifier">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="event.stopPropagation(); deleteClient(\${client.id})" class="text-red-600 hover:text-red-800" title="Supprimer">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                \`;
            }).join('');
        }

        // Suppression client
        async function deleteClient(id) {
            if (!confirm('Êtes-vous sûr de vouloir supprimer ce client ?\\n\\nATTENTION : Tous les sites et interventions associés seront également supprimés.')) {
                return;
            }

            try {
                const response = await fetch(\`/api/crm/clients/\${id}\`, {
                    method: 'DELETE'
                });
                const data = await response.json();

                if (data.success) {
                    alert('Client supprimé avec succès');
                    init(); // Recharger
                } else {
                    alert('Erreur: ' + data.error);
                }
            } catch (error) {
                console.error('Erreur:', error);
                alert('Erreur lors de la suppression');
            }
        }

        // Helpers
        function getStatusBadge(status) {
            const badges = {
                'active': '<span class="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">Actif</span>',
                'inactive': '<span class="px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-800">Inactif</span>',
                'prospect': '<span class="px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800">Prospect</span>'
            };
            return badges[status] || status;
        }

        // Event listeners
        document.getElementById('filter-search').addEventListener('input', renderClients);
        document.getElementById('filter-status').addEventListener('change', renderClients);
        document.getElementById('filter-type').addEventListener('change', renderClients);
        document.getElementById('btnResetFilters').addEventListener('click', () => {
            document.getElementById('filter-search').value = '';
            document.getElementById('filter-status').value = '';
            document.getElementById('filter-type').value = '';
            renderClients();
        });

        // Init
        init();
    </script>
</body>
</html>
  `;
}
