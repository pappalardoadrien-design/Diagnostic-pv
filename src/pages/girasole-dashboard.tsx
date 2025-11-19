// ============================================================================
// GIRASOLE DASHBOARD - Gestion Mission 52 Centrales PV
// ============================================================================

export function getGirasoleDashboardPage() {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard GIRASOLE - DiagPV</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
</head>
<body class="bg-gray-50">
    <!-- Header -->
    <div class="bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg">
        <div class="max-w-7xl mx-auto px-4 py-6">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-3xl font-bold flex items-center gap-3">
                        <i class="fas fa-solar-panel"></i>
                        Mission GIRASOLE
                    </h1>
                    <p class="text-green-100 mt-1">52 Centrales PV - Audits Conformité</p>
                </div>
                <div class="text-right">
                    <div class="text-2xl font-bold">66.885€ HT</div>
                    <div class="text-green-100">Janvier - Mars 2025</div>
                </div>
            </div>
        </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 py-8">
        
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="bg-white rounded-lg shadow-md p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-500 text-sm">Total Centrales</p>
                        <p class="text-3xl font-bold text-gray-800" id="stat-total">52</p>
                    </div>
                    <div class="bg-blue-100 rounded-full p-3">
                        <i class="fas fa-solar-panel text-blue-600 text-2xl"></i>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow-md p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-500 text-sm">Complétées</p>
                        <p class="text-3xl font-bold text-green-600" id="stat-completed">0</p>
                    </div>
                    <div class="bg-green-100 rounded-full p-3">
                        <i class="fas fa-check-circle text-green-600 text-2xl"></i>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow-md p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-500 text-sm">En cours</p>
                        <p class="text-3xl font-bold text-yellow-600" id="stat-inprogress">0</p>
                    </div>
                    <div class="bg-yellow-100 rounded-full p-3">
                        <i class="fas fa-clock text-yellow-600 text-2xl"></i>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow-md p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-500 text-sm">Non démarrées</p>
                        <p class="text-3xl font-bold text-gray-600" id="stat-pending">52</p>
                    </div>
                    <div class="bg-gray-100 rounded-full p-3">
                        <i class="fas fa-hourglass-start text-gray-600 text-2xl"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Filters & Actions -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
            <div class="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div class="flex gap-4 items-center flex-wrap">
                    <div>
                        <label class="text-sm text-gray-600 mb-1 block">Type</label>
                        <select id="filter-type" class="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500">
                            <option value="all">Tous</option>
                            <option value="SOL">SOL (39)</option>
                            <option value="TOITURE">TOITURE (13)</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="text-sm text-gray-600 mb-1 block">Statut</label>
                        <select id="filter-status" class="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500">
                            <option value="all">Tous</option>
                            <option value="completed">Complétées</option>
                            <option value="inprogress">En cours</option>
                            <option value="pending">Non démarrées</option>
                        </select>
                    </div>

                    <div class="flex-1">
                        <label class="text-sm text-gray-600 mb-1 block">Recherche</label>
                        <input 
                            type="text" 
                            id="search-input" 
                            placeholder="Nom centrale, ville..." 
                            class="border rounded-lg px-4 py-2 w-full focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                </div>

                <div class="flex gap-2">
                    <button id="btn-export-excel" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2">
                        <i class="fas fa-file-excel"></i>
                        Export Excel
                    </button>
                    <button id="btn-import-csv" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2">
                        <i class="fas fa-upload"></i>
                        Import CSV
                    </button>
                </div>
            </div>
        </div>

        <!-- Centrales List -->
        <div class="bg-white rounded-lg shadow-md overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gray-50 border-b">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Centrale
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Type
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Ville
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Puissance
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Statut
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Progression
                            </th>
                            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody id="centrales-list" class="bg-white divide-y divide-gray-200">
                        <!-- Populated by JS -->
                        <tr>
                            <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                                <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                                <p>Chargement des centrales...</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

    </div>

    <!-- Import CSV Modal -->
    <div id="modal-import" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
            <h3 class="text-2xl font-bold mb-4 flex items-center gap-2">
                <i class="fas fa-upload text-blue-600"></i>
                Import Planificateur GIRASOLE
            </h3>
            
            <div class="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p class="text-sm text-blue-800 mb-2">
                    <i class="fas fa-info-circle"></i>
                    Format CSV attendu : <code class="bg-white px-2 py-1 rounded">nom_centrale,type,ville,code_postal,puissance_kwc,nombre_modules,latitude,longitude,date_intervention</code>
                </p>
                <a href="/api/girasole/template" download="girasole_template.csv" class="text-sm text-blue-600 hover:underline">
                    <i class="fas fa-download mr-1"></i>
                    Télécharger le template CSV avec exemples
                </a>
            </div>

            <input type="file" id="csv-file-input" accept=".csv" class="border rounded-lg px-4 py-2 w-full mb-4" />
            
            <div class="flex justify-end gap-2">
                <button id="btn-cancel-import" class="px-6 py-2 border rounded-lg hover:bg-gray-50">
                    Annuler
                </button>
                <button id="btn-confirm-import" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">
                    Importer
                </button>
            </div>
        </div>
    </div>

    <script>
        let centrales = [];
        let filteredCentrales = [];

        // ========================================================================
        // LOAD DATA
        // ========================================================================
        async function loadCentrales() {
            try {
                // Get all projects with client GIRASOLE
                const { data: clientsData } = await axios.get('/api/crm/clients');
                const girasoleClient = clientsData.clients?.find(c => 
                    c.company_name?.toLowerCase().includes('girasole')
                );

                if (!girasoleClient) {
                    renderEmptyState('Client GIRASOLE non trouvé dans le CRM');
                    return;
                }

                // Get all projects for GIRASOLE client
                const { data: projectsData } = await axios.get(\`/api/crm/clients/\${girasoleClient.id}/projects\`);
                
                if (!projectsData.projects || projectsData.projects.length === 0) {
                    renderEmptyState('Aucune centrale GIRASOLE trouvée. Utilisez "Import CSV" pour créer les sites.');
                    return;
                }

                // Get interventions and audits for each project
                const promises = projectsData.projects.map(async (project) => {
                    try {
                        // Get interventions for this project
                        const { data: interventionsData } = await axios.get(\`/api/planning/interventions?project_id=\${project.id}\`);
                        const intervention = interventionsData.interventions?.[0];
                        
                        // Get audit if exists
                        let audit = null;
                        let auditStats = null;
                        if (intervention?.audit_token) {
                            const { data: inspections } = await axios.get(\`/api/visual/inspections/\${intervention.audit_token}\`);
                            auditStats = {
                                total: inspections.inspections?.length || 0,
                                completed: inspections.inspections?.filter(i => i.conformite).length || 0
                            };
                            audit = {
                                token: intervention.audit_token,
                                stats: auditStats
                            };
                        }

                        return {
                            ...project,
                            intervention,
                            audit,
                            type: project.site_type || (project.project_name?.includes('SOL') ? 'SOL' : 'TOITURE')
                        };
                    } catch (err) {
                        return { ...project, type: 'SOL' };
                    }
                });

                centrales = await Promise.all(promises);
                filteredCentrales = [...centrales];
                
                updateStats();
                renderCentrales();
            } catch (error) {
                console.error('Load error:', error);
                renderEmptyState('Erreur chargement : ' + error.message);
            }
        }

        // ========================================================================
        // RENDER
        // ========================================================================
        function renderCentrales() {
            const tbody = document.getElementById('centrales-list');
            
            if (filteredCentrales.length === 0) {
                tbody.innerHTML = \`
                    <tr>
                        <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                            <i class="fas fa-search text-2xl mb-2"></i>
                            <p>Aucune centrale trouvée avec ces filtres</p>
                        </td>
                    </tr>
                \`;
                return;
            }

            tbody.innerHTML = filteredCentrales.map(c => {
                const status = getStatus(c);
                const progress = getProgress(c);
                const statusBadge = getStatusBadge(status);
                
                return \`
                    <tr class="hover:bg-gray-50">
                        <td class="px-6 py-4">
                            <div class="font-medium text-gray-900">\${c.project_name || 'Sans nom'}</div>
                            <div class="text-sm text-gray-500">ID: \${c.id}</div>
                        </td>
                        <td class="px-6 py-4">
                            <span class="px-3 py-1 rounded-full text-xs font-medium \${
                                c.type === 'SOL' 
                                    ? 'bg-yellow-100 text-yellow-800' 
                                    : 'bg-purple-100 text-purple-800'
                            }">
                                <i class="fas fa-\${c.type === 'SOL' ? 'sun' : 'home'}"></i>
                                \${c.type}
                            </span>
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-900">
                            \${c.city || '-'}
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-900">
                            \${c.installed_power ? c.installed_power + ' kWc' : '-'}
                        </td>
                        <td class="px-6 py-4">
                            \${statusBadge}
                        </td>
                        <td class="px-6 py-4">
                            <div class="flex items-center gap-2">
                                <div class="flex-1 bg-gray-200 rounded-full h-2">
                                    <div class="bg-green-600 h-2 rounded-full" style="width: \${progress}%"></div>
                                </div>
                                <span class="text-sm text-gray-600">\${progress}%</span>
                            </div>
                        </td>
                        <td class="px-6 py-4 text-right space-x-2">
                            \${getActionButtons(c)}
                        </td>
                    </tr>
                \`;
            }).join('');
        }

        function getStatus(centrale) {
            if (!centrale.audit) return 'pending';
            if (centrale.audit.stats && centrale.audit.stats.completed > 0) {
                return centrale.audit.stats.completed >= centrale.audit.stats.total * 0.8 
                    ? 'completed' 
                    : 'inprogress';
            }
            return 'pending';
        }

        function getProgress(centrale) {
            if (!centrale.audit?.stats) return 0;
            const { completed, total } = centrale.audit.stats;
            return total > 0 ? Math.round((completed / total) * 100) : 0;
        }

        function getStatusBadge(status) {
            const badges = {
                completed: '<span class="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"><i class="fas fa-check-circle"></i> Complétée</span>',
                inprogress: '<span class="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><i class="fas fa-clock"></i> En cours</span>',
                pending: '<span class="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"><i class="fas fa-hourglass-start"></i> Non démarrée</span>'
            };
            return badges[status] || badges.pending;
        }

        function getActionButtons(centrale) {
            const checklistUrl = centrale.type === 'SOL' 
                ? \`/audit/\${centrale.audit?.token || 'NEW'}/visual/girasole/conformite\`
                : \`/audit/\${centrale.audit?.token || 'NEW'}/visual/girasole/toiture\`;
            
            let buttons = \`
                <a href="\${checklistUrl}" class="inline-flex items-center px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg">
                    <i class="fas fa-clipboard-check mr-1"></i>
                    Checklist
                </a>
            \`;

            if (centrale.audit) {
                buttons += \`
                    <a href="/api/visual/report/\${centrale.audit.token}" target="_blank" class="inline-flex items-center px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg">
                        <i class="fas fa-file-pdf mr-1"></i>
                        PDF
                    </a>
                \`;
            }

            return buttons;
        }

        function renderEmptyState(message) {
            const tbody = document.getElementById('centrales-list');
            tbody.innerHTML = \`
                <tr>
                    <td colspan="7" class="px-6 py-12 text-center">
                        <i class="fas fa-inbox text-gray-400 text-4xl mb-4"></i>
                        <p class="text-gray-600 text-lg">\${message}</p>
                        <button onclick="document.getElementById('modal-import').classList.remove('hidden')" class="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">
                            <i class="fas fa-upload mr-2"></i>
                            Importer les centrales
                        </button>
                    </td>
                </tr>
            \`;
        }

        // ========================================================================
        // STATS
        // ========================================================================
        function updateStats() {
            const completed = centrales.filter(c => getStatus(c) === 'completed').length;
            const inprogress = centrales.filter(c => getStatus(c) === 'inprogress').length;
            const pending = centrales.filter(c => getStatus(c) === 'pending').length;

            document.getElementById('stat-total').textContent = centrales.length;
            document.getElementById('stat-completed').textContent = completed;
            document.getElementById('stat-inprogress').textContent = inprogress;
            document.getElementById('stat-pending').textContent = pending;
        }

        // ========================================================================
        // FILTERS
        // ========================================================================
        function applyFilters() {
            const typeFilter = document.getElementById('filter-type').value;
            const statusFilter = document.getElementById('filter-status').value;
            const searchQuery = document.getElementById('search-input').value.toLowerCase();

            filteredCentrales = centrales.filter(c => {
                const matchType = typeFilter === 'all' || c.type === typeFilter;
                const matchStatus = statusFilter === 'all' || getStatus(c) === statusFilter;
                const matchSearch = !searchQuery || 
                    c.project_name?.toLowerCase().includes(searchQuery) ||
                    c.city?.toLowerCase().includes(searchQuery);
                
                return matchType && matchStatus && matchSearch;
            });

            renderCentrales();
        }

        // ========================================================================
        // EXPORT EXCEL
        // ========================================================================
        async function exportExcel() {
            try {
                alert('Export Excel en cours de développement (ANNEXE 2)');
                // TODO: Implement /api/visual/export-annexe2-batch
            } catch (error) {
                alert('Erreur export : ' + error.message);
            }
        }

        // ========================================================================
        // IMPORT CSV
        // ========================================================================
        function showImportModal() {
            document.getElementById('modal-import').classList.remove('hidden');
        }

        function hideImportModal() {
            document.getElementById('modal-import').classList.add('hidden');
        }

        async function importCSV() {
            const fileInput = document.getElementById('csv-file-input');
            const file = fileInput.files[0];
            
            if (!file) {
                alert('Sélectionnez un fichier CSV');
                return;
            }

            try {
                const text = await file.text();
                
                // Show loading
                const confirmBtn = document.getElementById('btn-confirm-import');
                confirmBtn.disabled = true;
                confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Import en cours...';
                
                // Call import API
                const { data } = await axios.post('/api/girasole/import-csv', {
                    csv_content: text,
                    client_name: 'GIRASOLE Energies'
                });
                
                hideImportModal();
                
                if (data.success) {
                    alert(\`✅ Import réussi !
                    
\${data.projects_created} centrales créées
\${data.interventions_created} interventions créées
\${data.audits_created} audits créés

\${data.errors.length > 0 ? 'Erreurs : ' + data.errors.length : ''}\`);
                    
                    // Reload dashboard
                    loadCentrales();
                } else {
                    alert('❌ Erreur import : ' + data.error);
                }
                
            } catch (error) {
                alert('❌ Erreur import : ' + error.message);
            } finally {
                // Reset button
                const confirmBtn = document.getElementById('btn-confirm-import');
                confirmBtn.disabled = false;
                confirmBtn.innerHTML = 'Importer';
            }
        }

        // ========================================================================
        // INIT
        // ========================================================================
        document.addEventListener('DOMContentLoaded', () => {
            loadCentrales();

            // Filters
            document.getElementById('filter-type').addEventListener('change', applyFilters);
            document.getElementById('filter-status').addEventListener('change', applyFilters);
            document.getElementById('search-input').addEventListener('input', applyFilters);

            // Actions
            document.getElementById('btn-export-excel').addEventListener('click', exportExcel);
            document.getElementById('btn-import-csv').addEventListener('click', showImportModal);
            document.getElementById('btn-cancel-import').addEventListener('click', hideImportModal);
            document.getElementById('btn-confirm-import').addEventListener('click', importCSV);
        });
    </script>
</body>
</html>
  `;
}
