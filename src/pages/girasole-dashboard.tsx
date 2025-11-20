/**
 * Page Dashboard GIRASOLE - 52 Centrales PV
 * Mission: Janvier-Mars 2025 (66.885€ HT)
 * Architecture: 39 SOL (CONFORMITE) + 13 DOUBLE (CONFORMITE + TOITURE)
 */

export function getGirasoleDashboardPage() {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mission GIRASOLE - DiagPV</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <style>
        .centrale-card { transition: all 0.3s ease; }
        .centrale-card:hover { transform: translateY(-4px); box-shadow: 0 8px 16px rgba(0,0,0,0.1); }
        .badge-sol { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
        .badge-double { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
    </style>
</head>
<body class="bg-gray-50">
    <!-- Header Mission -->
    <div class="bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg">
        <div class="max-w-7xl mx-auto px-4 py-6">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-3xl font-bold flex items-center gap-3">
                        <i class="fas fa-solar-panel"></i>
                        Mission GIRASOLE
                    </h1>
                    <p class="text-green-100 mt-1">52 Centrales PV - Audits Conformité NF C 15-100 & DTU 40.35</p>
                </div>
                <div class="text-right">
                    <div class="text-2xl font-bold" id="mission-budget">66.885€ HT</div>
                    <div class="text-green-100">Janvier - Mars 2025</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Stats Cards -->
    <div class="max-w-7xl mx-auto px-4 py-8">
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <!-- Total -->
            <div class="bg-white rounded-lg shadow-md p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-500 text-sm font-medium">Total Centrales</p>
                        <p class="text-3xl font-bold text-gray-800" id="stat-total">52</p>
                    </div>
                    <div class="bg-blue-100 rounded-full p-3">
                        <i class="fas fa-solar-panel text-blue-600 text-2xl"></i>
                    </div>
                </div>
            </div>

            <!-- SOL -->
            <div class="bg-white rounded-lg shadow-md p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-500 text-sm font-medium">Audits SOL</p>
                        <p class="text-3xl font-bold text-green-600" id="stat-sol">39</p>
                        <p class="text-xs text-gray-400">CONFORMITE</p>
                    </div>
                    <div class="bg-green-100 rounded-full p-3">
                        <i class="fas fa-check-circle text-green-600 text-2xl"></i>
                    </div>
                </div>
            </div>

            <!-- DOUBLE -->
            <div class="bg-white rounded-lg shadow-md p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-500 text-sm font-medium">Audits DOUBLE</p>
                        <p class="text-3xl font-bold text-orange-600" id="stat-double">13</p>
                        <p class="text-xs text-gray-400">+ TOITURE</p>
                    </div>
                    <div class="bg-orange-100 rounded-full p-3">
                        <i class="fas fa-building text-orange-600 text-2xl"></i>
                    </div>
                </div>
            </div>

            <!-- Complétés -->
            <div class="bg-white rounded-lg shadow-md p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-500 text-sm font-medium">Complétés</p>
                        <p class="text-3xl font-bold text-purple-600" id="stat-completed">0</p>
                        <p class="text-xs text-gray-400">Inspections</p>
                    </div>
                    <div class="bg-purple-100 rounded-full p-3">
                        <i class="fas fa-clipboard-check text-purple-600 text-2xl"></i>
                    </div>
                </div>
            </div>

            <!-- En attente -->
            <div class="bg-white rounded-lg shadow-md p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-500 text-sm font-medium">En attente</p>
                        <p class="text-3xl font-bold text-gray-600" id="stat-pending">52</p>
                        <p class="text-xs text-gray-400">À réaliser</p>
                    </div>
                    <div class="bg-gray-100 rounded-full p-3">
                        <i class="fas fa-clock text-gray-600 text-2xl"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Filtres -->
        <div class="bg-white rounded-lg shadow-md p-4 mb-6">
            <div class="flex items-center gap-4">
                <label class="text-sm font-medium text-gray-700">Filtrer:</label>
                <button onclick="filterCentrales('all')" 
                        class="filter-btn px-4 py-2 rounded-lg bg-blue-100 text-blue-700 font-medium hover:bg-blue-200 transition active"
                        data-filter="all">
                    Toutes (52)
                </button>
                <button onclick="filterCentrales('sol')" 
                        class="filter-btn px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-green-100 hover:text-green-700 transition"
                        data-filter="sol">
                    SOL (39)
                </button>
                <button onclick="filterCentrales('double')" 
                        class="filter-btn px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-orange-100 hover:text-orange-700 transition"
                        data-filter="double">
                    DOUBLE (13)
                </button>
                <div class="ml-auto">
                    <input type="text" 
                           id="search-input" 
                           placeholder="Rechercher une centrale..." 
                           class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                           onkeyup="searchCentrales()">
                </div>
            </div>
        </div>

        <!-- Liste Centrales -->
        <div id="centrales-list" class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Cards générées dynamiquement -->
        </div>
    </div>

    <script>
        let allCentrales = [];
        let currentFilter = 'all';

        // Charger les données au démarrage
        async function loadData() {
            try {
                const response = await axios.get('/api/girasole/projects');
                const { stats, projects } = response.data;

                // Mettre à jour les stats
                document.getElementById('stat-total').textContent = stats.total;
                document.getElementById('stat-sol').textContent = stats.sol;
                document.getElementById('stat-double').textContent = stats.double;
                document.getElementById('stat-completed').textContent = stats.completed;
                document.getElementById('stat-pending').textContent = stats.pending;

                // Stocker les centrales
                allCentrales = projects;

                // Afficher toutes les centrales
                renderCentrales(allCentrales);
            } catch (error) {
                console.error('Erreur chargement données:', error);
                alert('Erreur lors du chargement des centrales');
            }
        }

        // Afficher les centrales
        function renderCentrales(centrales) {
            const container = document.getElementById('centrales-list');
            
            if (centrales.length === 0) {
                container.innerHTML = '<div class="col-span-2 text-center py-12 text-gray-500"><i class="fas fa-inbox text-5xl mb-4"></i><p class="text-lg">Aucune centrale trouvée</p></div>';
                return;
            }

            container.innerHTML = centrales.map(centrale => {
                const auditTypes = JSON.parse(centrale.audit_types || '[]');
                const isDouble = auditTypes.includes('TOITURE');
                const badgeClass = isDouble ? 'badge-double' : 'badge-sol';
                const badgeText = isDouble ? 'DOUBLE (CONFORMITE + TOITURE)' : 'SOL (CONFORMITE)';
                const badgeIcon = isDouble ? 'fa-building' : 'fa-check-circle';

                return \`
                    <div class="centrale-card bg-white rounded-lg shadow-md p-6 \${isDouble ? 'border-l-4 border-orange-500' : 'border-l-4 border-green-500'}">
                        <div class="flex items-start justify-between mb-4">
                            <div class="flex-1">
                                <h3 class="text-lg font-bold text-gray-800 mb-2">\${centrale.name}</h3>
                                <p class="text-sm text-gray-600 mb-3">
                                    <i class="fas fa-map-marker-alt mr-2"></i>\${centrale.site_address || 'Adresse non renseignée'}
                                </p>
                            </div>
                            <span class="\${badgeClass} text-white text-xs px-3 py-1 rounded-full font-medium flex items-center gap-2">
                                <i class="fas \${badgeIcon}"></i>
                                \${badgeText}
                            </span>
                        </div>

                        <div class="border-t pt-4">
                            <div class="flex items-center justify-between text-sm text-gray-600 mb-4">
                                <span><i class="fas fa-bolt mr-2"></i>\${centrale.installation_power ? centrale.installation_power + ' kWc' : 'Puissance N/A'}</span>
                                <span><i class="fas fa-hashtag mr-2"></i>ID: \${centrale.id_referent || centrale.id}</span>
                            </div>

                            <div class="flex gap-2">
                                \${isDouble ? \`
                                    <button onclick="openChecklist(\${centrale.id}, 'CONFORMITE')" 
                                            class="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2">
                                        <i class="fas fa-clipboard-list"></i>
                                        Conformité
                                    </button>
                                    <button onclick="openChecklist(\${centrale.id}, 'TOITURE')" 
                                            class="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2">
                                        <i class="fas fa-building"></i>
                                        Toiture
                                    </button>
                                \` : \`
                                    <button onclick="openChecklist(\${centrale.id}, 'CONFORMITE')" 
                                            class="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2">
                                        <i class="fas fa-clipboard-list"></i>
                                        Audit Conformité
                                    </button>
                                \`}
                            </div>
                        </div>
                    </div>
                \`;
            }).join('');
        }

        // Filtrer les centrales
        function filterCentrales(type) {
            currentFilter = type;
            
            // Mettre à jour les boutons
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active', 'bg-blue-100', 'text-blue-700', 'bg-green-100', 'text-green-700', 'bg-orange-100', 'text-orange-700');
                btn.classList.add('bg-gray-100', 'text-gray-700');
            });

            const activeBtn = document.querySelector(\`[data-filter="\${type}"]\`);
            if (type === 'all') {
                activeBtn.classList.remove('bg-gray-100', 'text-gray-700');
                activeBtn.classList.add('bg-blue-100', 'text-blue-700', 'active');
            } else if (type === 'sol') {
                activeBtn.classList.remove('bg-gray-100', 'text-gray-700');
                activeBtn.classList.add('bg-green-100', 'text-green-700', 'active');
            } else if (type === 'double') {
                activeBtn.classList.remove('bg-gray-100', 'text-gray-700');
                activeBtn.classList.add('bg-orange-100', 'text-orange-700', 'active');
            }

            // Filtrer
            let filtered = allCentrales;
            if (type === 'sol') {
                filtered = allCentrales.filter(c => {
                    const types = JSON.parse(c.audit_types || '[]');
                    return types.includes('CONFORMITE') && !types.includes('TOITURE');
                });
            } else if (type === 'double') {
                filtered = allCentrales.filter(c => {
                    const types = JSON.parse(c.audit_types || '[]');
                    return types.includes('TOITURE');
                });
            }

            renderCentrales(filtered);
        }

        // Rechercher
        function searchCentrales() {
            const query = document.getElementById('search-input').value.toLowerCase();
            let filtered = allCentrales;

            // Appliquer le filtre de type
            if (currentFilter === 'sol') {
                filtered = filtered.filter(c => {
                    const types = JSON.parse(c.audit_types || '[]');
                    return types.includes('CONFORMITE') && !types.includes('TOITURE');
                });
            } else if (currentFilter === 'double') {
                filtered = filtered.filter(c => {
                    const types = JSON.parse(c.audit_types || '[]');
                    return types.includes('TOITURE');
                });
            }

            // Appliquer la recherche texte
            if (query) {
                filtered = filtered.filter(c => 
                    c.name.toLowerCase().includes(query) || 
                    (c.site_address && c.site_address.toLowerCase().includes(query))
                );
            }

            renderCentrales(filtered);
        }

        // Ouvrir checklist
        function openChecklist(projectId, checklistType) {
            window.location.href = \`/girasole/checklist/\${checklistType.toLowerCase()}/\${projectId}\`;
        }

        // Charger au démarrage
        loadData();
    </script>
</body>
</html>
  `;
}
