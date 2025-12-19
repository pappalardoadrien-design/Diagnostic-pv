import { getLayout } from './layout.js';

export function getCrmClientsListPage() {
  const content = `
    <div class="max-w-7xl mx-auto space-y-8">
        
        <!-- Header Section -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h2 class="text-3xl font-black text-slate-900 tracking-tight">Clients</h2>
                <p class="text-slate-500 mt-1 font-medium">Gestion de la base de données clients et prospects</p>
            </div>
            <div class="flex items-center gap-3">
                <a href="/crm/projects" class="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-400 transition-all shadow-sm">
                    <i class="fas fa-layer-group mr-2 text-slate-400"></i>Voir les Sites
                </a>
                <a href="/crm/clients/create" class="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 transform hover:-translate-y-0.5 flex items-center">
                    <i class="fas fa-plus mr-2"></i>Nouveau Client
                </a>
            </div>
        </div>

        <!-- KPI Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            <!-- Total Clients -->
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group hover:border-blue-300 transition-colors">
                <div class="absolute right-0 top-0 h-full w-1 bg-blue-500"></div>
                <div class="flex justify-between items-start mb-4">
                    <div class="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-100 transition-colors">
                        <i class="fas fa-users text-xl"></i>
                    </div>
                </div>
                <div class="text-3xl font-black text-slate-900 mb-1" id="stat-total">...</div>
                <div class="text-sm font-bold text-slate-500 uppercase tracking-wide">Total Clients</div>
            </div>

            <!-- Actifs -->
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group hover:border-green-300 transition-colors">
                <div class="absolute right-0 top-0 h-full w-1 bg-green-500"></div>
                <div class="flex justify-between items-start mb-4">
                    <div class="p-3 bg-green-50 rounded-xl text-green-600 group-hover:bg-green-100 transition-colors">
                        <i class="fas fa-check-circle text-xl"></i>
                    </div>
                </div>
                <div class="text-3xl font-black text-slate-900 mb-1" id="stat-active">...</div>
                <div class="text-sm font-bold text-slate-500 uppercase tracking-wide">Clients Actifs</div>
            </div>

            <!-- Sites -->
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group hover:border-purple-300 transition-colors">
                <div class="absolute right-0 top-0 h-full w-1 bg-purple-500"></div>
                <div class="flex justify-between items-start mb-4">
                    <div class="p-3 bg-purple-50 rounded-xl text-purple-600 group-hover:bg-purple-100 transition-colors">
                        <i class="fas fa-solar-panel text-xl"></i>
                    </div>
                </div>
                <div class="text-3xl font-black text-slate-900 mb-1" id="stat-projects">...</div>
                <div class="text-sm font-bold text-slate-500 uppercase tracking-wide">Sites Gérés</div>
            </div>

            <!-- Interventions -->
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group hover:border-orange-300 transition-colors">
                <div class="absolute right-0 top-0 h-full w-1 bg-orange-500"></div>
                <div class="flex justify-between items-start mb-4">
                    <div class="p-3 bg-orange-50 rounded-xl text-orange-600 group-hover:bg-orange-100 transition-colors">
                        <i class="fas fa-clipboard-check text-xl"></i>
                    </div>
                </div>
                <div class="text-3xl font-black text-slate-900 mb-1" id="stat-interventions">...</div>
                <div class="text-sm font-bold text-slate-500 uppercase tracking-wide">Missions</div>
            </div>
        </div>

        <!-- Filters & Search -->
        <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center gap-4">
            <div class="relative flex-1 w-full">
                <i class="fas fa-search absolute left-4 top-3.5 text-slate-400"></i>
                <input type="text" id="filter-search" placeholder="Rechercher un client, SIRET, contact..." 
                       class="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 font-medium">
            </div>
            
            <div class="flex gap-4 w-full md:w-auto">
                <select id="filter-status" class="px-4 py-3 bg-slate-50 border-none rounded-lg text-slate-700 font-bold focus:ring-2 focus:ring-blue-500 cursor-pointer">
                    <option value="">Tous statuts</option>
                    <option value="active">Actif</option>
                    <option value="prospect">Prospect</option>
                    <option value="inactive">Inactif</option>
                </select>

                <select id="filter-type" class="px-4 py-3 bg-slate-50 border-none rounded-lg text-slate-700 font-bold focus:ring-2 focus:ring-blue-500 cursor-pointer">
                    <option value="">Tous types</option>
                    <option value="company">Entreprise</option>
                    <option value="individual">Particulier</option>
                </select>
                
                <button id="btnResetFilters" class="px-4 py-3 text-slate-400 hover:text-slate-600 transition-colors" title="Réinitialiser">
                    <i class="fas fa-undo"></i>
                </button>
            </div>
        </div>

        <!-- Data Table -->
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-slate-50 border-b border-slate-200">
                            <th class="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Identité</th>
                            <th class="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Contact Principal</th>
                            <th class="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">SIRET / Infos</th>
                            <th class="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Sites</th>
                            <th class="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Statut</th>
                            <th class="px-6 py-4 text-right text-xs font-black text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="clientsTableBody" class="divide-y divide-slate-100">
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
            
            <!-- Empty State (Hidden by default) -->
            <div id="emptyState" class="hidden flex flex-col items-center justify-center py-16 px-4 text-center">
                <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <i class="fas fa-search text-slate-400 text-2xl"></i>
                </div>
                <h3 class="text-lg font-bold text-slate-900 mb-1">Aucun résultat trouvé</h3>
                <p class="text-slate-500 max-w-sm mx-auto mb-6">Essayez de modifier vos filtres ou créez un nouveau client.</p>
                <button id="clearSearchBtn" class="text-blue-600 font-bold hover:underline">Effacer la recherche</button>
            </div>
        </div>

    </div>

    <script>
        let allClients = [];
        let allProjects = [];
        let allInterventions = [];

        async function init() {
            try {
                // Parallel data loading
                const [clientsRes, interventionsRes] = await Promise.all([
                    fetch('/api/crm/clients').then(r => r.json()),
                    fetch('/api/planning/interventions').then(r => r.json())
                ]);

                if (clientsRes.success) allClients = clientsRes.clients || [];
                if (interventionsRes.success) allInterventions = interventionsRes.interventions || [];

                // Load projects for each client (could be optimized with a single endpoint later)
                if (allClients.length > 0) {
                    const projectPromises = allClients.map(c => 
                        fetch(\`/api/crm/clients/\${c.id}/projects\`).then(r => r.json()).catch(() => ({ success: false }))
                    );
                    const projectsResults = await Promise.all(projectPromises);
                    allProjects = projectsResults.flatMap(r => r.success ? r.projects : []);
                }

                updateStats();
                renderClients();

            } catch (err) {
                console.error('Init Error:', err);
                document.getElementById('clientsTableBody').innerHTML = \`
                    <tr><td colspan="6" class="px-6 py-8 text-center text-red-500 font-bold">Erreur de chargement des données.</td></tr>
                \`;
            }
        }

        function updateStats() {
            document.getElementById('stat-total').textContent = allClients.length;
            document.getElementById('stat-active').textContent = allClients.filter(c => c.status === 'active').length;
            document.getElementById('stat-projects').textContent = allProjects.length;
            document.getElementById('stat-interventions').textContent = allInterventions.length;
        }

        function renderClients() {
            const search = document.getElementById('filter-search').value.toLowerCase();
            const status = document.getElementById('filter-status').value;
            const type = document.getElementById('filter-type').value;

            const filtered = allClients.filter(client => {
                const matchesSearch = !search || (
                    (client.company_name || '').toLowerCase().includes(search) ||
                    (client.siret || '').includes(search) ||
                    (client.main_contact_name || '').toLowerCase().includes(search)
                );
                const matchesStatus = !status || client.status === status;
                const matchesType = !type || client.client_type === type;
                return matchesSearch && matchesStatus && matchesType;
            });

            const tbody = document.getElementById('clientsTableBody');
            const emptyState = document.getElementById('emptyState');

            if (filtered.length === 0) {
                tbody.innerHTML = '';
                tbody.parentElement.classList.add('hidden');
                emptyState.classList.remove('hidden');
                return;
            }

            tbody.parentElement.classList.remove('hidden');
            emptyState.classList.add('hidden');

            tbody.innerHTML = filtered.map(client => {
                const clientProjects = allProjects.filter(p => p.client_id === client.id);
                
                return \`
                    <tr class="group hover:bg-blue-50/30 transition-colors cursor-pointer border-b last:border-0 border-slate-100" 
                        onclick="window.location.href='/crm/clients/detail?id=\${client.id}'">
                        
                        <!-- Identité -->
                        <td class="px-6 py-4">
                            <div class="flex items-center gap-4">
                                <div class="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center font-bold text-lg
                                    \${client.client_type === 'company' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}">
                                    \${client.company_name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div class="font-bold text-slate-900">\${client.company_name}</div>
                                    <div class="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                        \${client.client_type === 'company' ? 'Entreprise' : 'Particulier'}
                                    </div>
                                </div>
                            </div>
                        </td>

                        <!-- Contact -->
                        <td class="px-6 py-4">
                            <div class="text-sm font-medium text-slate-900">\${client.main_contact_name || '<span class="text-slate-400 italic">Non renseigné</span>'}</div>
                            <div class="text-xs text-slate-500">\${client.main_contact_email || ''}</div>
                        </td>

                        <!-- SIRET -->
                        <td class="px-6 py-4">
                            <div class="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded inline-block">
                                \${client.siret || 'N/A'}
                            </div>
                        </td>

                        <!-- Sites -->
                        <td class="px-6 py-4">
                            \${clientProjects.length > 0 
                                ? \`<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                                    <i class="fas fa-solar-panel mr-1.5 text-slate-400"></i>\${clientProjects.length}
                                   </span>\`
                                : '<span class="text-slate-400 text-xs">-</span>'
                            }
                        </td>

                        <!-- Statut -->
                        <td class="px-6 py-4">
                            \${getStatusBadge(client.status)}
                        </td>

                        <!-- Actions -->
                        <td class="px-6 py-4 text-right">
                            <div class="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end gap-2">
                                <button onclick="event.stopPropagation(); window.location.href='/crm/clients/edit?id=\${client.id}'" 
                                        class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Modifier">
                                    <i class="fas fa-pen"></i>
                                </button>
                                <button onclick="event.stopPropagation(); deleteClient(\${client.id})" 
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
                'active': 'bg-green-100 text-green-700 ring-green-600/20',
                'inactive': 'bg-slate-100 text-slate-600 ring-slate-500/20',
                'prospect': 'bg-amber-100 text-amber-700 ring-amber-600/20'
            };
            const labels = {
                'active': 'Actif',
                'inactive': 'Inactif',
                'prospect': 'Prospect'
            };
            
            const style = styles[status] || styles['inactive'];
            const label = labels[status] || status;

            return \`<span class="inline-flex items-center rounded-md px-2 py-1 text-xs font-bold ring-1 ring-inset \${style}">\${label}</span>\`;
        }

        async function deleteClient(id) {
            if(!confirm('Attention ! Cette action est irréversible.\\n\\nLa suppression du client entraînera la perte de tous les historiques, audits et données associées.\\n\\nConfirmer la suppression ?')) return;

            try {
                const res = await fetch(\`/api/crm/clients/\${id}\`, { method: 'DELETE' });
                const data = await res.json();
                if(data.success) {
                    init(); // Reload
                } else {
                    alert('Erreur: ' + data.error);
                }
            } catch(e) {
                console.error(e);
                alert('Erreur serveur lors de la suppression');
            }
        }

        // Listeners
        document.getElementById('filter-search').addEventListener('input', renderClients);
        document.getElementById('filter-status').addEventListener('change', renderClients);
        document.getElementById('filter-type').addEventListener('change', renderClients);
        document.getElementById('btnResetFilters').addEventListener('click', () => {
            document.getElementById('filter-search').value = '';
            document.getElementById('filter-status').value = '';
            document.getElementById('filter-type').value = '';
            renderClients();
        });
        document.getElementById('clearSearchBtn').addEventListener('click', () => {
             document.getElementById('filter-search').value = '';
             renderClients();
        });

        // Start
        init();
    </script>
  `;

  return getLayout('Clients', content, 'clients');
}
