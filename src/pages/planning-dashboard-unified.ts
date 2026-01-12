import { getLayout } from './layout'

export function getPlanningDashboardUnifiedPage() {
  const content = `
    <!-- Header Actions -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <div class="flex items-center gap-4">
        <span class="text-slate-500 text-sm">
          <i class="fas fa-calendar-alt mr-2"></i>Vue d'ensemble des interventions
        </span>
      </div>
      <div class="flex gap-3">
        <a href="/planning/calendar" class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-all flex items-center gap-2">
          <i class="fas fa-calendar"></i>
          <span>Vue Calendrier</span>
        </a>
        <button onclick="copyICSLink()" class="px-4 py-2.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-xl font-semibold transition-all flex items-center gap-2" title="Sync Outlook">
          <i class="fas fa-rss"></i>
          <span>Sync Outlook</span>
        </button>
        <a href="/planning/create" class="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all flex items-center gap-2">
          <i class="fas fa-plus"></i>
          <span>Nouvelle Intervention</span>
        </a>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" id="stats-container">
      <!-- Loading placeholders -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 animate-pulse">
        <div class="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
        <div class="h-8 bg-slate-200 rounded w-1/2"></div>
      </div>
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 animate-pulse">
        <div class="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
        <div class="h-8 bg-slate-200 rounded w-1/2"></div>
      </div>
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 animate-pulse">
        <div class="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
        <div class="h-8 bg-slate-200 rounded w-1/2"></div>
      </div>
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 animate-pulse">
        <div class="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
        <div class="h-8 bg-slate-200 rounded w-1/2"></div>
      </div>
    </div>

    <!-- Filters Section -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
      <div class="p-6 border-b border-slate-100">
        <h2 class="text-lg font-bold text-slate-800 flex items-center gap-3">
          <div class="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
            <i class="fas fa-filter text-slate-600"></i>
          </div>
          Filtres
        </h2>
      </div>
      <div class="p-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- Filtre Status -->
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-2">Statut</label>
            <select id="filter-status" class="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
              <option value="">Tous les statuts</option>
              <option value="scheduled">Planifiée</option>
              <option value="in_progress">En cours</option>
              <option value="completed">Terminée</option>
              <option value="cancelled">Annulée</option>
            </select>
          </div>

          <!-- Filtre Type -->
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-2">Type d'audit</label>
            <select id="filter-type" class="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
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
            <label class="block text-sm font-semibold text-slate-700 mb-2">Date début</label>
            <input type="date" id="filter-date-from" class="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          </div>

          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-2">Date fin</label>
            <input type="date" id="filter-date-to" class="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          </div>
        </div>

        <div class="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
          <label class="flex items-center space-x-3 cursor-pointer">
            <input type="checkbox" id="filter-unassigned" class="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500">
            <span class="text-sm font-medium text-slate-700">Non assignées uniquement</span>
          </label>
          <div class="flex gap-3">
            <button onclick="resetFilters()" class="px-4 py-2 text-slate-600 hover:text-slate-900 text-sm font-medium hover:bg-slate-100 rounded-lg transition-colors">
              <i class="fas fa-undo mr-2"></i>Réinitialiser
            </button>
            <button onclick="applyFilters()" class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors">
              <i class="fas fa-search mr-2"></i>Appliquer
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Interventions List -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div class="p-6 border-b border-slate-100 flex justify-between items-center">
        <h2 class="text-lg font-bold text-slate-800 flex items-center gap-3">
          <div class="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <i class="fas fa-list text-blue-600"></i>
          </div>
          Interventions
          <span id="intervention-count" class="text-slate-500 text-sm font-normal ml-2">(0)</span>
        </h2>
        <button onclick="refreshData()" class="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          <i class="fas fa-sync-alt"></i>
        </button>
      </div>

      <div id="interventions-container">
        <!-- Loading state -->
        <div class="p-12 text-center text-slate-500">
          <i class="fas fa-spinner fa-spin text-4xl text-blue-500 mb-4"></i>
          <p class="font-medium">Chargement des interventions...</p>
        </div>
      </div>
    </div>

    <script>
      let currentFilters = {};

      document.addEventListener('DOMContentLoaded', () => {
        loadStats();
        loadInterventions();
      });

      // Load statistics
      async function loadStats() {
        try {
          const response = await fetch('/api/planning/dashboard');
          const data = await response.json();

          if (!data.success) throw new Error(data.error);

          const stats = data.stats;
          document.getElementById('stats-container').innerHTML = \`
            <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
              <div class="flex items-center justify-between mb-3">
                <span class="text-slate-500 text-sm font-semibold">Total</span>
                <div class="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                  <i class="fas fa-clipboard-list text-slate-500"></i>
                </div>
              </div>
              <div class="text-3xl font-bold text-slate-800">\${stats.total_interventions}</div>
              <div class="text-xs text-slate-400 mt-1">Toutes interventions</div>
            </div>

            <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
              <div class="flex items-center justify-between mb-3">
                <span class="text-slate-500 text-sm font-semibold">Planifiées</span>
                <div class="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <i class="fas fa-calendar-check text-blue-500"></i>
                </div>
              </div>
              <div class="text-3xl font-bold text-blue-600">\${stats.scheduled}</div>
              <div class="text-xs text-slate-400 mt-1">
                <span class="text-orange-600 font-bold">\${stats.upcoming_7_days}</span> dans 7 jours
              </div>
            </div>

            <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
              <div class="flex items-center justify-between mb-3">
                <span class="text-slate-500 text-sm font-semibold">En cours</span>
                <div class="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <i class="fas fa-spinner text-amber-500"></i>
                </div>
              </div>
              <div class="text-3xl font-bold text-amber-600">\${stats.in_progress}</div>
              <div class="text-xs text-slate-400 mt-1">Interventions actives</div>
            </div>

            <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
              <div class="flex items-center justify-between mb-3">
                <span class="text-slate-500 text-sm font-semibold">Non assignées</span>
                <div class="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <i class="fas fa-user-slash text-red-500"></i>
                </div>
              </div>
              <div class="text-3xl font-bold text-red-600">\${stats.unassigned}</div>
              <div class="text-xs text-slate-400 mt-1">Sans technicien</div>
            </div>
          \`;

        } catch (error) {
          console.error('Erreur stats:', error);
          document.getElementById('stats-container').innerHTML = \`
            <div class="col-span-4 bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
              <i class="fas fa-exclamation-triangle text-red-500 text-2xl mb-3"></i>
              <p class="text-red-800 font-semibold">Erreur de chargement</p>
              <p class="text-red-600 text-sm mt-1">\${error.message}</p>
              <button onclick="loadStats()" class="mt-3 text-red-600 hover:text-red-800 font-medium">
                <i class="fas fa-redo mr-1"></i>Réessayer
              </button>
            </div>
          \`;
        }
      }

      // Load interventions
      async function loadInterventions() {
        const container = document.getElementById('interventions-container');
        
        try {
          const params = new URLSearchParams(currentFilters);
          const response = await fetch(\`/api/planning/interventions?\${params}\`);
          const data = await response.json();

          if (!data.success) throw new Error(data.error);

          document.getElementById('intervention-count').textContent = \`(\${data.total})\`;

          if (data.total === 0) {
            container.innerHTML = \`
              <div class="p-16 text-center">
                <div class="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <i class="fas fa-inbox text-slate-400 text-3xl"></i>
                </div>
                <p class="text-slate-600 text-lg font-semibold mb-2">Aucune intervention trouvée</p>
                <p class="text-slate-400 text-sm mb-6">Créez votre première intervention pour commencer</p>
                <a href="/planning/create" class="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors">
                  <i class="fas fa-plus"></i>
                  Créer une intervention
                </a>
              </div>
            \`;
            return;
          }

          container.innerHTML = \`
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th class="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                    <th class="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Projet / Client</th>
                    <th class="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                    <th class="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Technicien</th>
                    <th class="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Statut</th>
                    <th class="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-slate-100">
                  \${data.interventions.map(intervention => \`
                    <tr class="hover:bg-slate-50 cursor-pointer transition-colors" onclick="window.location.href='/planning/detail?id=\${intervention.id}'">
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center gap-2">
                          <i class="far fa-calendar text-slate-400"></i>
                          <span class="text-sm font-semibold text-slate-800">
                            \${new Date(intervention.intervention_date).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        \${intervention.duration_hours ? \`
                          <div class="text-xs text-slate-400 ml-6">\${intervention.duration_hours}h</div>
                        \` : ''}
                      </td>
                      <td class="px-6 py-4">
                        <div class="text-sm font-semibold text-slate-800">\${intervention.project_name || 'Projet inconnu'}</div>
                        <div class="text-xs text-slate-400 flex items-center gap-1 mt-1">
                          <i class="fas fa-building"></i>
                          \${intervention.client_name || 'Client inconnu'}
                        </div>
                        \${intervention.project_location ? \`
                          <div class="text-xs text-slate-400 flex items-center gap-1 mt-1">
                            <i class="fas fa-map-marker-alt"></i>
                            \${intervention.project_location}
                          </div>
                        \` : ''}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span class="text-sm text-slate-700">\${formatInterventionType(intervention.intervention_type)}</span>
                      </td>
                      <td class="px-6 py-4">
                        \${intervention.technician_email ? \`
                          <div class="flex items-center gap-2">
                            <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <i class="fas fa-user text-blue-600 text-xs"></i>
                            </div>
                            <span class="text-sm text-slate-700">\${intervention.technician_email}</span>
                          </div>
                        \` : \`
                          <span class="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                            <i class="fas fa-user-slash"></i>
                            Non assigné
                          </span>
                        \`}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span class="badge-\${intervention.status} inline-flex items-center px-3 py-1 rounded-full text-xs font-bold">
                          \${formatStatus(intervention.status)}
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center gap-2">
                          <button onclick="event.stopPropagation(); window.location.href='/planning/detail?id=\${intervention.id}'" 
                                  class="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Voir">
                            <i class="fas fa-eye"></i>
                          </button>
                          <button onclick="event.stopPropagation(); editIntervention(\${intervention.id})" 
                                  class="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors" title="Modifier">
                            <i class="fas fa-edit"></i>
                          </button>
                          \${!intervention.technician_id ? \`
                            <button onclick="event.stopPropagation(); assignTechnician(\${intervention.id})" 
                                    class="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors" title="Assigner">
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

        } catch (error) {
          console.error('Erreur interventions:', error);
          container.innerHTML = \`
            <div class="p-12 text-center">
              <i class="fas fa-exclamation-triangle text-red-500 text-3xl mb-4"></i>
              <p class="text-red-800 font-semibold">Erreur de chargement</p>
              <p class="text-red-600 text-sm mt-1">\${error.message}</p>
              <button onclick="loadInterventions()" class="mt-4 text-red-600 hover:text-red-800 font-medium">
                <i class="fas fa-redo mr-2"></i>Réessayer
              </button>
            </div>
          \`;
        }
      }

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

      function formatStatus(status) {
        const statuses = {
          'scheduled': 'Planifiée',
          'in_progress': 'En cours',
          'completed': 'Terminée',
          'cancelled': 'Annulée'
        };
        return statuses[status] || status;
      }

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

      function resetFilters() {
        document.getElementById('filter-status').value = '';
        document.getElementById('filter-type').value = '';
        document.getElementById('filter-date-from').value = '';
        document.getElementById('filter-date-to').value = '';
        document.getElementById('filter-unassigned').checked = false;
        currentFilters = {};
        loadInterventions();
      }

      function refreshData() {
        loadStats();
        loadInterventions();
      }

      function editIntervention(id) {
        window.location.href = \`/planning/interventions/\${id}\`;
      }

      async function assignTechnician(id) {
        alert('Modal attribution technicien - À implémenter');
      }

      function copyICSLink() {
        const feedUrl = window.location.origin + '/api/planning/feed/all.ics';
        navigator.clipboard.writeText(feedUrl).then(() => {
          alert('🔗 Lien copié !\\n\\nDans Outlook :\\n1. Calendrier → "Ajouter un calendrier"\\n2. "À partir d\\'Internet"\\n3. Collez le lien');
        }).catch(() => {
          prompt('Copiez ce lien pour Outlook :', feedUrl);
        });
      }

      // Auto-refresh every 30s
      setInterval(refreshData, 30000);
    </script>

    <style>
      .badge-scheduled { background: #dbeafe; color: #1e40af; }
      .badge-in_progress { background: #fef3c7; color: #92400e; }
      .badge-completed { background: #d1fae5; color: #065f46; }
      .badge-cancelled { background: #fee2e2; color: #991b1b; }
    </style>
  `;

  return getLayout('Planning', content, 'planning');
}
