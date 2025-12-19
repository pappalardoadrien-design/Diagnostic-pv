import { getLayout } from './layout.js';

export function getCrmProjectsListPage() {
  const content = `
    <div class="max-w-7xl mx-auto space-y-8">
        
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h2 class="text-3xl font-black text-slate-900 tracking-tight">Sites & Centrales</h2>
                <p class="text-slate-500 mt-1 font-medium">Parc photovoltaïque géré et projets en cours</p>
            </div>
            <div class="flex items-center gap-3">
                <a href="/crm/clients" class="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-400 transition-all shadow-sm">
                    <i class="fas fa-users mr-2 text-slate-400"></i>Voir les Clients
                </a>
                <a href="/crm/projects/create" class="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 transform hover:-translate-y-0.5 flex items-center">
                    <i class="fas fa-plus mr-2"></i>Nouveau Site
                </a>
            </div>
        </div>

        <!-- KPI Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            <!-- Total Sites -->
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group hover:border-blue-300 transition-colors">
                <div class="absolute right-0 top-0 h-full w-1 bg-blue-500"></div>
                <div class="flex justify-between items-start mb-4">
                    <div class="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-100 transition-colors">
                        <i class="fas fa-solar-panel text-xl"></i>
                    </div>
                </div>
                <div class="text-3xl font-black text-slate-900 mb-1" id="stat-total">...</div>
                <div class="text-sm font-bold text-slate-500 uppercase tracking-wide">Total Sites</div>
            </div>

            <!-- Puissance Totale -->
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group hover:border-yellow-300 transition-colors">
                <div class="absolute right-0 top-0 h-full w-1 bg-yellow-500"></div>
                <div class="flex justify-between items-start mb-4">
                    <div class="p-3 bg-yellow-50 rounded-xl text-yellow-600 group-hover:bg-yellow-100 transition-colors">
                        <i class="fas fa-bolt text-xl"></i>
                    </div>
                </div>
                <div class="text-3xl font-black text-slate-900 mb-1" id="stat-power">...</div>
                <div class="text-sm font-bold text-slate-500 uppercase tracking-wide">Puissance Installée</div>
            </div>

            <!-- Modules -->
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group hover:border-green-300 transition-colors">
                <div class="absolute right-0 top-0 h-full w-1 bg-green-500"></div>
                <div class="flex justify-between items-start mb-4">
                    <div class="p-3 bg-green-50 rounded-xl text-green-600 group-hover:bg-green-100 transition-colors">
                        <i class="fas fa-th text-xl"></i>
                    </div>
                </div>
                <div class="text-3xl font-black text-slate-900 mb-1" id="stat-modules">...</div>
                <div class="text-sm font-bold text-slate-500 uppercase tracking-wide">Modules Diagnostiqués</div>
            </div>

            <!-- Interventions -->
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group hover:border-purple-300 transition-colors">
                <div class="absolute right-0 top-0 h-full w-1 bg-purple-500"></div>
                <div class="flex justify-between items-start mb-4">
                    <div class="p-3 bg-purple-50 rounded-xl text-purple-600 group-hover:bg-purple-100 transition-colors">
                        <i class="fas fa-calendar-check text-xl"></i>
                    </div>
                </div>
                <div class="text-3xl font-black text-slate-900 mb-1" id="stat-interventions">...</div>
                <div class="text-sm font-bold text-slate-500 uppercase tracking-wide">Missions Totales</div>
            </div>
        </div>

        <!-- Filters -->
        <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center gap-4">
            <div class="relative flex-1 w-full">
                <i class="fas fa-search absolute left-4 top-3.5 text-slate-400"></i>
                <input type="text" id="search-input" placeholder="Nom du site, ville, client..." 
                       class="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 font-medium">
            </div>
            
            <div class="flex gap-4 w-full md:w-auto">
                <select id="filter-client" class="px-4 py-3 bg-slate-50 border-none rounded-lg text-slate-700 font-bold focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[200px]">
                    <option value="">Tous les clients</option>
                    <!-- Populated by JS -->
                </select>

                <select id="filter-status" class="px-4 py-3 bg-slate-50 border-none rounded-lg text-slate-700 font-bold focus:ring-2 focus:ring-blue-500 cursor-pointer">
                    <option value="">Tous statuts</option>
                    <option value="active">Actif</option>
                    <option value="pending">En attente</option>
                    <option value="completed">Terminé</option>
                </select>
            </div>
        </div>

        <!-- Data Table -->
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-slate-50 border-b border-slate-200">
                            <th class="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Site / Projet</th>
                            <th class="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Client Propriétaire</th>
                            <th class="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Localisation</th>
                            <th class="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Technique</th>
                            <th class="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Statut</th>
                            <th class="px-6 py-4 text-right text-xs font-black text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="projects-tbody" class="divide-y divide-slate-100">
                        <!-- Loading State -->
                        <tr>
                            <td colspan="6" class="px-6 py-12 text-center">
                                <div class="inline-flex items-center text-slate-400 font-medium">
                                    <i class="fas fa-circle-notch fa-spin mr-3 text-blue-500"></i>
                                    Chargement des données...
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Empty State -->
            <div id="empty-state" class="hidden flex flex-col items-center justify-center py-16 px-4 text-center">
                <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <i class="fas fa-solar-panel text-slate-400 text-2xl"></i>
                </div>
                <h3 class="text-lg font-bold text-slate-900 mb-1">Aucun site trouvé</h3>
                <p class="text-slate-500 max-w-sm mx-auto mb-6">Commencez par ajouter un nouveau site à la base de données.</p>
                <a href="/crm/projects/create" class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition">
                    <i class="fas fa-plus mr-2"></i>
                    Créer un site
                </a>
            </div>
        </div>

    </div>

    <script>
        let allProjects = [];
        let allClients = [];
        let allInterventions = [];

        // --- INIT ---
        async function init() {
            try {
                // Parallel Loading
                const [projectsRes, clientsRes, interventionsRes] = await Promise.all([
                    fetch('/api/crm/projects').then(r => r.json()),
                    fetch('/api/crm/clients').then(r => r.json()),
                    fetch('/api/planning/interventions').then(r => r.json())
                ]);

                allProjects = projectsRes.projects || [];
                allClients = clientsRes.clients || [];
                allInterventions = interventionsRes.interventions || [];

                populateClientFilter();
                updateStats();
                renderProjects();
                
            } catch (err) {
                console.error('Init Error:', err);
                document.getElementById('projects-tbody').innerHTML = \`
                    <tr><td colspan="6" class="px-6 py-8 text-center text-red-500 font-bold">Erreur de chargement des données.</td></tr>
                \`;
            }
        }

        // --- RENDERERS ---
        function populateClientFilter() {
            const select = document.getElementById('filter-client');
            allClients.sort((a,b) => a.company_name.localeCompare(b.company_name)).forEach(client => {
                const option = document.createElement('option');
                option.value = client.id;
                option.textContent = client.company_name;
                select.appendChild(option);
            });
        }

        function updateStats() {
            // Total Sites
            document.getElementById('stat-total').textContent = allProjects.length;

            // Total Power
            const totalPower = allProjects.reduce((sum, p) => sum + (parseFloat(p.total_power_kwp) || 0), 0);
            document.getElementById('stat-power').textContent = totalPower.toLocaleString('fr-FR', {maximumFractionDigits: 1}) + ' kWc';

            // Total Modules
            const totalModules = allProjects.reduce((sum, p) => sum + (parseInt(p.module_count) || 0), 0);
            document.getElementById('stat-modules').textContent = totalModules.toLocaleString('fr-FR');

            // Total Interventions
            document.getElementById('stat-interventions').textContent = allInterventions.length;
        }

        function renderProjects() {
            const tbody = document.getElementById('projects-tbody');
            const emptyState = document.getElementById('empty-state');
            
            const searchTerm = document.getElementById('search-input').value.toLowerCase();
            const filterClient = document.getElementById('filter-client').value;
            const filterStatus = document.getElementById('filter-status').value;

            const filtered = allProjects.filter(project => {
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
                tbody.parentElement.classList.add('hidden');
                emptyState.classList.remove('hidden');
                return;
            }

            tbody.parentElement.classList.remove('hidden');
            emptyState.classList.add('hidden');

            tbody.innerHTML = filtered.map(project => {
                const client = allClients.find(c => c.id === project.client_id);
                const clientName = client ? client.company_name : 'Client inconnu';
                const interventionsCount = allInterventions.filter(i => i.project_id === project.id).length;

                return \`
                    <tr class="group hover:bg-blue-50/30 transition-colors cursor-pointer border-b last:border-0 border-slate-100"
                        onclick="window.location.href='/crm/projects/detail?id=\${project.id}'">
                        
                        <!-- Nom Site -->
                        <td class="px-6 py-4">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 text-lg flex-shrink-0">
                                    <i class="fas fa-solar-panel"></i>
                                </div>
                                <div>
                                    <div class="font-bold text-slate-900">\${project.name || project.project_name}</div>
                                    <div class="text-xs text-slate-400">Ajouté le \${new Date(project.created_at).toLocaleDateString('fr-FR')}</div>
                                </div>
                            </div>
                        </td>

                        <!-- Client -->
                        <td class="px-6 py-4">
                            <div class="text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors" onclick="event.stopPropagation(); window.location.href='/crm/clients/detail?id=\${project.client_id}'">
                                \${clientName}
                            </div>
                        </td>

                        <!-- Localisation -->
                        <td class="px-6 py-4">
                            <div class="text-sm text-slate-600">
                                <i class="fas fa-map-marker-alt text-slate-300 mr-1.5"></i>
                                \${project.address_city || 'N/A'}
                            </div>
                        </td>

                        <!-- Technique -->
                        <td class="px-6 py-4">
                            <div class="flex flex-col gap-1">
                                <span class="text-xs font-medium text-slate-600">
                                    <i class="fas fa-bolt text-amber-500 w-4"></i>
                                    \${project.total_power_kwp || '-'} kWc
                                </span>
                                <span class="text-xs font-medium text-slate-600">
                                    <i class="fas fa-th text-slate-400 w-4"></i>
                                    \${project.module_count || '-'} modules
                                </span>
                            </div>
                        </td>

                        <!-- Statut -->
                        <td class="px-6 py-4">
                            \${getStatusBadge(project.status)}
                        </td>

                        <!-- Actions -->
                        <td class="px-6 py-4 text-right">
                            <div class="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end gap-2">
                                <button onclick="event.stopPropagation(); window.location.href='/crm/projects/edit?id=\${project.id}'" 
                                        class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Modifier">
                                    <i class="fas fa-pen"></i>
                                </button>
                                <button onclick="event.stopPropagation(); deleteProject(\${project.id})" 
                                        class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Supprimer">
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                \`;
            }).join('');
        }

        function getStatusBadge(status) {
            const styles = {
                'active': 'bg-green-100 text-green-700 border-green-200',
                'pending': 'bg-amber-100 text-amber-700 border-amber-200',
                'completed': 'bg-blue-100 text-blue-700 border-blue-200'
            };
            const labels = {
                'active': 'Actif',
                'pending': 'En attente',
                'completed': 'Terminé'
            };
            const style = styles[status] || styles['pending'];
            const label = labels[status] || status;

            return \`<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border \${style}">\${label}</span>\`;
        }

        // --- ACTIONS ---
        async function deleteProject(id) {
            if(!confirm('Attention ! Suppression irréversible.\\n\\nConfirmer ?')) return;
            // TODO: Implement delete API call
            alert('Fonctionnalité de suppression à implémenter (API)');
        }

        // --- LISTENERS ---
        document.getElementById('search-input').addEventListener('input', renderProjects);
        document.getElementById('filter-client').addEventListener('change', renderProjects);
        document.getElementById('filter-status').addEventListener('change', renderProjects);

        // START
        init();
    </script>
  `;

  return getLayout('Sites & Projets', content, 'projects');
}
