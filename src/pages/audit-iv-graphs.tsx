// ============================================================================
// PAGE GRAPHIQUES I-V - VISUALISATION COURBES
// ============================================================================
// Affichage graphique courbes I-V (référence + sombres)
// Avec Chart.js pour rendu professionnel
// ============================================================================

export function getAuditIvGraphsPage() {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Graphiques I-V - Courbes Référence & Sombres</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    </head>
    <body class="bg-black text-white min-h-screen font-bold">
        <div class="container mx-auto p-6">
            <!-- Navigation -->
            <div id="module-nav" class="mb-6"></div>
            
            <!-- En-tête -->
            <header class="mb-8">
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <i class="fas fa-chart-area text-5xl text-purple-400 mr-4"></i>
                        <div>
                            <h1 class="text-4xl font-black">GRAPHIQUES I-V</h1>
                            <p class="text-xl text-gray-300">Courbes de Référence & Sombres</p>
                        </div>
                    </div>
                    <button onclick="window.history.back()" class="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-black">
                        <i class="fas fa-arrow-left mr-2"></i>
                        RETOUR
                    </button>
                </div>
            </header>
            
            <!-- Statistiques globales -->
            <div class="max-w-7xl mx-auto mb-8">
                <div class="grid md:grid-cols-4 gap-4">
                    <div class="bg-gradient-to-br from-orange-900 to-orange-700 rounded-lg p-4 border-2 border-orange-400">
                        <div class="text-center">
                            <p class="text-3xl font-black" id="stat-modules">0</p>
                            <p class="text-orange-200">Modules Testés</p>
                        </div>
                    </div>
                    <div class="bg-gradient-to-br from-green-900 to-green-700 rounded-lg p-4 border-2 border-green-400">
                        <div class="text-center">
                            <p class="text-3xl font-black" id="stat-pmax-avg">0</p>
                            <p class="text-green-200">Pmax Moyen (W)</p>
                        </div>
                    </div>
                    <div class="bg-gradient-to-br from-blue-900 to-blue-700 rounded-lg p-4 border-2 border-blue-400">
                        <div class="text-center">
                            <p class="text-3xl font-black" id="stat-deviation">0%</p>
                            <p class="text-blue-200">Déviation Moyenne</p>
                        </div>
                    </div>
                    <div class="bg-gradient-to-br from-purple-900 to-purple-700 rounded-lg p-4 border-2 border-purple-400">
                        <div class="text-center">
                            <p class="text-3xl font-black" id="stat-rs-avg">0</p>
                            <p class="text-purple-200">Rs Moyen (Ω)</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Filtres -->
            <div class="max-w-7xl mx-auto mb-6">
                <div class="bg-gray-900 rounded-lg p-6 border-2 border-purple-400">
                    <h2 class="text-2xl font-black mb-4">
                        <i class="fas fa-filter mr-2 text-purple-400"></i>
                        FILTRES & SÉLECTION
                    </h2>
                    <div class="grid md:grid-cols-3 gap-4">
                        <div>
                            <label class="block text-sm font-bold mb-2">String</label>
                            <select id="filter-string" class="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white">
                                <option value="">Tous</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-bold mb-2">Type de courbe</label>
                            <select id="filter-type" class="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white">
                                <option value="reference">Référence (STC)</option>
                                <option value="dark">Sombre (Rs/Rsh)</option>
                                <option value="both">Les deux</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-bold mb-2">Module spécifique</label>
                            <select id="filter-module" class="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white">
                                <option value="">Tous</option>
                            </select>
                        </div>
                    </div>
                    <button onclick="applyFilters()" class="mt-4 bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-black">
                        <i class="fas fa-sync mr-2"></i>
                        APPLIQUER FILTRES
                    </button>
                </div>
            </div>
            
            <!-- Graphiques -->
            <div class="max-w-7xl mx-auto">
                <!-- Graphique courbes référence -->
                <div id="graph-reference-container" class="bg-gray-900 rounded-lg p-6 border-2 border-orange-400 mb-6">
                    <h2 class="text-2xl font-black mb-4">
                        <i class="fas fa-sun mr-2 text-orange-400"></i>
                        COURBES I-V DE RÉFÉRENCE (STC)
                    </h2>
                    <div class="bg-white rounded-lg p-4">
                        <canvas id="chart-reference" style="max-height: 500px;"></canvas>
                    </div>
                    <div class="mt-4 text-sm text-gray-400">
                        <i class="fas fa-info-circle mr-2"></i>
                        <strong>Conditions STC:</strong> 1000 W/m², 25°C, AM 1.5 - Norme IEC 60904-1
                    </div>
                </div>
                
                <!-- Graphique courbes sombres -->
                <div id="graph-dark-container" class="bg-gray-900 rounded-lg p-6 border-2 border-blue-400 mb-6">
                    <h2 class="text-2xl font-black mb-4">
                        <i class="fas fa-moon mr-2 text-blue-400"></i>
                        COURBES I-V SOMBRES (Rs & Rsh)
                    </h2>
                    <div class="bg-white rounded-lg p-4">
                        <canvas id="chart-dark" style="max-height: 500px;"></canvas>
                    </div>
                    <div class="mt-4 text-sm text-gray-400">
                        <i class="fas fa-info-circle mr-2"></i>
                        <strong>Mesure sombre:</strong> Analyse résistances série (Rs) et shunt (Rsh) - IEC TS 62804
                    </div>
                </div>
                
                <!-- Tableau comparatif -->
                <div class="bg-gray-900 rounded-lg p-6 border-2 border-green-400">
                    <h2 class="text-2xl font-black mb-4">
                        <i class="fas fa-table mr-2 text-green-400"></i>
                        TABLEAU COMPARATIF PERFORMANCES
                    </h2>
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm" id="comparison-table">
                            <thead class="bg-gray-800">
                                <tr class="border-b border-gray-700">
                                    <th class="px-4 py-3 text-left">Module</th>
                                    <th class="px-4 py-3 text-right">Pmax (W)</th>
                                    <th class="px-4 py-3 text-right">Pmax STC (W)</th>
                                    <th class="px-4 py-3 text-right">Déviation</th>
                                    <th class="px-4 py-3 text-right">Rs (Ω)</th>
                                    <th class="px-4 py-3 text-right">Rsh (Ω)</th>
                                    <th class="px-4 py-3 text-center">Statut</th>
                                </tr>
                            </thead>
                            <tbody id="comparison-tbody" class="divide-y divide-gray-700">
                                <!-- Données chargées dynamiquement -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        
        <script>
            let auditToken = '';
            let allMeasurements = [];
            let chartReference = null;
            let chartDark = null;
            
            // ================================================================
            // INITIALISATION
            // ================================================================
            async function initPage() {
                // Extraire token depuis URL
                const pathParts = window.location.pathname.split('/');
                auditToken = pathParts[2];
                
                // Charger navigation modules
                await loadModuleNav();
                
                // Charger données
                await loadIVMeasurements();
            }
            
            // ================================================================
            // CHARGEMENT NAVIGATION
            // ================================================================
            async function loadModuleNav() {
                try {
                    const response = await axios.get(\`/api/module-nav/\${auditToken}\`);
                    document.getElementById('module-nav').innerHTML = response.data.html;
                } catch (error) {
                    console.error('Erreur chargement navigation:', error);
                }
            }
            
            // ================================================================
            // CHARGEMENT MESURES I-V
            // ================================================================
            async function loadIVMeasurements() {
                try {
                    const response = await axios.get(\`/api/iv/measurements/\${auditToken}\`);
                    
                    if (response.data.success) {
                        allMeasurements = response.data.data;
                        
                        // Mettre à jour statistiques
                        updateStatistics();
                        
                        // Populer filtres
                        populateFilters();
                        
                        // Afficher graphiques
                        renderGraphs();
                        
                        // Afficher tableau
                        renderComparisonTable();
                    }
                } catch (error) {
                    console.error('Erreur chargement mesures:', error);
                    alert('Erreur lors du chargement des mesures I-V');
                }
            }
            
            // ================================================================
            // STATISTIQUES
            // ================================================================
            function updateStatistics() {
                const refMeasurements = allMeasurements.filter(m => m.measurement_type === 'reference');
                const darkMeasurements = allMeasurements.filter(m => m.measurement_type === 'dark');
                
                // Nombre modules
                const uniqueModules = new Set(refMeasurements.map(m => \`S\${m.string_number}-\${m.module_number}\`));
                document.getElementById('stat-modules').textContent = uniqueModules.size;
                
                // Pmax moyen
                const validPmax = refMeasurements.filter(m => m.pmax_measured).map(m => m.pmax_measured);
                const avgPmax = validPmax.length > 0 
                    ? (validPmax.reduce((a, b) => a + b, 0) / validPmax.length).toFixed(1)
                    : 0;
                document.getElementById('stat-pmax-avg').textContent = avgPmax;
                
                // Déviation moyenne
                const validDeviations = refMeasurements
                    .filter(m => m.deviation_percent !== null)
                    .map(m => Math.abs(m.deviation_percent));
                const avgDeviation = validDeviations.length > 0
                    ? (validDeviations.reduce((a, b) => a + b, 0) / validDeviations.length).toFixed(1)
                    : 0;
                document.getElementById('stat-deviation').textContent = avgDeviation + '%';
                
                // Rs moyen
                const validRs = darkMeasurements.filter(m => m.rs).map(m => m.rs);
                const avgRs = validRs.length > 0
                    ? (validRs.reduce((a, b) => a + b, 0) / validRs.length).toFixed(3)
                    : 0;
                document.getElementById('stat-rs-avg').textContent = avgRs;
            }
            
            // ================================================================
            // FILTRES
            // ================================================================
            function populateFilters() {
                // Strings uniques
                const strings = [...new Set(allMeasurements.map(m => m.string_number))].sort((a, b) => a - b);
                const stringSelect = document.getElementById('filter-string');
                strings.forEach(s => {
                    const option = document.createElement('option');
                    option.value = s;
                    option.textContent = \`String \${s}\`;
                    stringSelect.appendChild(option);
                });
                
                // Modules uniques
                const modules = [...new Set(allMeasurements.map(m => \`S\${m.string_number}-\${m.module_number}\`))].sort();
                const moduleSelect = document.getElementById('filter-module');
                modules.forEach(m => {
                    const option = document.createElement('option');
                    option.value = m;
                    option.textContent = m;
                    moduleSelect.appendChild(option);
                });
            }
            
            function applyFilters() {
                renderGraphs();
                renderComparisonTable();
            }
            
            function getFilteredMeasurements() {
                const filterString = document.getElementById('filter-string').value;
                const filterModule = document.getElementById('filter-module').value;
                
                let filtered = allMeasurements;
                
                if (filterString) {
                    filtered = filtered.filter(m => m.string_number == filterString);
                }
                
                if (filterModule) {
                    const [, string, module] = filterModule.match(/S(\d+)-(\d+)/);
                    filtered = filtered.filter(m => 
                        m.string_number == string && m.module_number == module
                    );
                }
                
                return filtered;
            }
            
            // ================================================================
            // RENDU GRAPHIQUES
            // ================================================================
            function renderGraphs() {
                const filterType = document.getElementById('filter-type').value;
                const filtered = getFilteredMeasurements();
                
                // Graphique référence
                if (filterType === 'reference' || filterType === 'both') {
                    renderReferenceGraph(filtered.filter(m => m.measurement_type === 'reference'));
                    document.getElementById('graph-reference-container').style.display = 'block';
                } else {
                    document.getElementById('graph-reference-container').style.display = 'none';
                }
                
                // Graphique sombre
                if (filterType === 'dark' || filterType === 'both') {
                    renderDarkGraph(filtered.filter(m => m.measurement_type === 'dark'));
                    document.getElementById('graph-dark-container').style.display = 'block';
                } else {
                    document.getElementById('graph-dark-container').style.display = 'none';
                }
            }
            
            function renderReferenceGraph(measurements) {
                if (chartReference) {
                    chartReference.destroy();
                }
                
                const datasets = measurements.slice(0, 20).map((m, idx) => {
                    const curveData = m.iv_curve_data ? JSON.parse(m.iv_curve_data) : [];
                    const color = \`hsl(\${(idx * 360 / 20)}, 70%, 50%)\`;
                    
                    return {
                        label: \`S\${m.string_number}-\${m.module_number} (Pmax: \${m.pmax_measured?.toFixed(1) || 'N/A'}W)\`,
                        data: curveData.map(point => ({ x: point.voltage, y: point.current })),
                        borderColor: color,
                        backgroundColor: color + '20',
                        borderWidth: 2,
                        pointRadius: 0,
                        tension: 0.4
                    };
                });
                
                const ctx = document.getElementById('chart-reference').getContext('2d');
                chartReference = new Chart(ctx, {
                    type: 'line',
                    data: { datasets },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        scales: {
                            x: {
                                type: 'linear',
                                title: { display: true, text: 'Tension (V)', color: '#000', font: { weight: 'bold', size: 14 } },
                                ticks: { color: '#000' },
                                grid: { color: 'rgba(0,0,0,0.1)' }
                            },
                            y: {
                                title: { display: true, text: 'Courant (A)', color: '#000', font: { weight: 'bold', size: 14 } },
                                ticks: { color: '#000' },
                                grid: { color: 'rgba(0,0,0,0.1)' }
                            }
                        },
                        plugins: {
                            legend: { 
                                display: true, 
                                position: 'right',
                                labels: { color: '#000', font: { size: 10 } }
                            },
                            tooltip: {
                                mode: 'nearest',
                                intersect: false,
                                callbacks: {
                                    label: (context) => {
                                        const label = context.dataset.label || '';
                                        const value = \`V: \${context.parsed.x.toFixed(2)}V, I: \${context.parsed.y.toFixed(2)}A\`;
                                        return \`\${label} - \${value}\`;
                                    }
                                }
                            }
                        }
                    }
                });
            }
            
            function renderDarkGraph(measurements) {
                if (chartDark) {
                    chartDark.destroy();
                }
                
                const datasets = measurements.slice(0, 20).map((m, idx) => {
                    const curveData = m.iv_curve_data ? JSON.parse(m.iv_curve_data) : [];
                    const color = \`hsl(\${(idx * 360 / 20)}, 70%, 50%)\`;
                    
                    return {
                        label: \`S\${m.string_number}-\${m.module_number} (Rs: \${m.rs?.toFixed(3) || 'N/A'}Ω, Rsh: \${m.rsh?.toFixed(1) || 'N/A'}Ω)\`,
                        data: curveData.map(point => ({ x: point.voltage, y: point.current })),
                        borderColor: color,
                        backgroundColor: color + '20',
                        borderWidth: 2,
                        pointRadius: 0,
                        tension: 0.4
                    };
                });
                
                const ctx = document.getElementById('chart-dark').getContext('2d');
                chartDark = new Chart(ctx, {
                    type: 'line',
                    data: { datasets },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        scales: {
                            x: {
                                type: 'linear',
                                title: { display: true, text: 'Tension (V)', color: '#000', font: { weight: 'bold', size: 14 } },
                                ticks: { color: '#000' },
                                grid: { color: 'rgba(0,0,0,0.1)' }
                            },
                            y: {
                                title: { display: true, text: 'Courant (A)', color: '#000', font: { weight: 'bold', size: 14 } },
                                ticks: { color: '#000' },
                                grid: { color: 'rgba(0,0,0,0.1)' }
                            }
                        },
                        plugins: {
                            legend: { 
                                display: true, 
                                position: 'right',
                                labels: { color: '#000', font: { size: 10 } }
                            },
                            tooltip: {
                                mode: 'nearest',
                                intersect: false,
                                callbacks: {
                                    label: (context) => {
                                        const label = context.dataset.label || '';
                                        const value = \`V: \${context.parsed.x.toFixed(2)}V, I: \${context.parsed.y.toFixed(3)}A\`;
                                        return \`\${label} - \${value}\`;
                                    }
                                }
                            }
                        }
                    }
                });
            }
            
            // ================================================================
            // TABLEAU COMPARATIF
            // ================================================================
            function renderComparisonTable() {
                const filtered = getFilteredMeasurements();
                const refMeasurements = filtered.filter(m => m.measurement_type === 'reference');
                
                // Grouper par module
                const moduleData = new Map();
                refMeasurements.forEach(m => {
                    const key = \`S\${m.string_number}-\${m.module_number}\`;
                    const dark = filtered.find(d => 
                        d.measurement_type === 'dark' && 
                        d.string_number === m.string_number && 
                        d.module_number === m.module_number
                    );
                    
                    moduleData.set(key, {
                        ref: m,
                        dark: dark || {}
                    });
                });
                
                const tbody = document.getElementById('comparison-tbody');
                tbody.innerHTML = '';
                
                [...moduleData.entries()].forEach(([key, data]) => {
                    const m = data.ref;
                    const d = data.dark;
                    
                    const deviation = m.deviation_percent || 0;
                    const deviationClass = Math.abs(deviation) > 10 ? 'text-red-400' : Math.abs(deviation) > 5 ? 'text-yellow-400' : 'text-green-400';
                    const statusIcon = Math.abs(deviation) > 10 ? '❌' : Math.abs(deviation) > 5 ? '⚠️' : '✅';
                    
                    const row = \`
                        <tr class="hover:bg-gray-800">
                            <td class="px-4 py-3 font-bold">\${key}</td>
                            <td class="px-4 py-3 text-right">\${m.pmax_measured?.toFixed(1) || '-'}</td>
                            <td class="px-4 py-3 text-right">\${m.pmax_stc?.toFixed(1) || '-'}</td>
                            <td class="px-4 py-3 text-right \${deviationClass} font-bold">\${deviation.toFixed(1)}%</td>
                            <td class="px-4 py-3 text-right">\${d.rs?.toFixed(3) || '-'}</td>
                            <td class="px-4 py-3 text-right">\${d.rsh?.toFixed(1) || '-'}</td>
                            <td class="px-4 py-3 text-center text-xl">\${statusIcon}</td>
                        </tr>
                    \`;
                    tbody.innerHTML += row;
                });
            }
            
            // ================================================================
            // DÉMARRAGE
            // ================================================================
            document.addEventListener('DOMContentLoaded', initPage);
        </script>
    </body>
    </html>
  `;
}
