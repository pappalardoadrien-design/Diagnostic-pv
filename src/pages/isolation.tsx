/**
 * Page /isolation - Interface Module Tests Isolation
 * Import CSV Benning + Historique mesures
 */

export function getIsolationPage() {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Module Tests Isolation - DiagPV</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        body { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); }
        .diagpv-card {
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            padding: 2rem;
            margin-bottom: 2rem;
        }
        .btn-primary {
            background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: bold;
            border: none;
            cursor: pointer;
            transition: all 0.3s;
        }
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(234, 179, 8, 0.3);
        }
        .stat-card {
            background: linear-gradient(135deg, #fefce8 0%, #fef08a 100%);
            border-radius: 12px;
            padding: 1.5rem;
            text-align: center;
        }
        .conformity-badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 0.875rem;
        }
        .status-conform { background: #dcfce7; color: #166534; }
        .status-non-conform { background: #fee2e2; color: #991b1b; }
    </style>
</head>
<body class="min-h-screen p-6">
    
    <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="diagpv-card">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-4xl font-black text-gray-800 mb-2">
                        <i class="fas fa-bolt text-yellow-600 mr-3"></i>
                        MODULE TESTS ISOLATION
                    </h1>
                    <p class="text-gray-600 font-semibold">IEC 62446 - Tests DC/AC - Import Benning IT 130</p>
                </div>
                <button onclick="showImportModal()" class="btn-primary">
                    <i class="fas fa-file-import mr-2"></i>
                    IMPORT CSV BENNING
                </button>
            </div>
        </div>
        
        <!-- Statistiques -->
        <div id="statsContainer" class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div class="stat-card">
                <div class="text-4xl font-black text-yellow-600" id="totalTests">-</div>
                <div class="text-gray-600 font-semibold mt-2">Tests Total</div>
            </div>
            <div class="stat-card">
                <div class="text-4xl font-black text-green-600" id="conformRate">-</div>
                <div class="text-gray-600 font-semibold mt-2">Taux Conformité</div>
            </div>
            <div class="stat-card">
                <div class="text-4xl font-black text-purple-600" id="avgDCPosEarth">-</div>
                <div class="text-gray-600 font-semibold mt-2">DC+ Terre Moy (MΩ)</div>
            </div>
            <div class="stat-card">
                <div class="text-4xl font-black text-red-600" id="nonConformTests">-</div>
                <div class="text-gray-600 font-semibold mt-2">Non-Conformes</div>
            </div>
        </div>
        
        <!-- Filtres -->
        <div class="diagpv-card">
            <h3 class="text-xl font-bold text-gray-800 mb-4">
                <i class="fas fa-filter text-purple-600 mr-2"></i>
                Filtres
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">Centrale</label>
                    <select id="filterPlantId" onchange="loadTests()" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                        <option value="">Toutes centrales</option>
                        <option value="1">Centrale Test (ID 1)</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">Type Test</label>
                    <select id="filterTestType" onchange="loadTests()" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                        <option value="">Tous types</option>
                        <option value="benning">Benning IT 130</option>
                        <option value="manual">Manuel</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">Conformité</label>
                    <select id="filterConformity" onchange="loadTests()" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                        <option value="">Tous</option>
                        <option value="true">Conformes</option>
                        <option value="false">Non-Conformes</option>
                    </select>
                </div>
                <div class="flex items-end">
                    <button onclick="resetFilters()" class="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-bold hover:bg-gray-300">
                        <i class="fas fa-redo mr-2"></i>
                        Réinitialiser
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Graphique Historique -->
        <div class="diagpv-card">
            <h3 class="text-2xl font-bold text-gray-800 mb-4">
                <i class="fas fa-chart-line text-green-600 mr-2"></i>
                Historique Mesures DC+ Terre
            </h3>
            <div style="height: 300px;">
                <canvas id="isolationChart"></canvas>
            </div>
        </div>
        
        <!-- Tableau Tests -->
        <div class="diagpv-card">
            <h3 class="text-2xl font-bold text-gray-800 mb-4">
                <i class="fas fa-list text-yellow-600 mr-2"></i>
                Liste Tests Isolation
                <span id="testCount" class="text-sm text-gray-500 ml-2"></span>
            </h3>
            
            <div id="loadingSpinner" class="text-center py-12">
                <i class="fas fa-spinner fa-spin text-4xl text-yellow-600"></i>
                <p class="text-gray-600 mt-4 font-semibold">Chargement tests...</p>
            </div>
            
            <div id="testsTable" style="display: none;" class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-3 text-left font-bold text-gray-700">Date</th>
                            <th class="px-4 py-3 text-left font-bold text-gray-700">Type</th>
                            <th class="px-4 py-3 text-left font-bold text-gray-700">DC+ Terre</th>
                            <th class="px-4 py-3 text-left font-bold text-gray-700">DC- Terre</th>
                            <th class="px-4 py-3 text-left font-bold text-gray-700">DC+ DC-</th>
                            <th class="px-4 py-3 text-left font-bold text-gray-700">AC Terre</th>
                            <th class="px-4 py-3 text-left font-bold text-gray-700">Conformité</th>
                        </tr>
                    </thead>
                    <tbody id="testsBody">
                    </tbody>
                </table>
            </div>
            
            <div id="noTests" style="display: none;" class="text-center py-12">
                <i class="fas fa-inbox text-6xl text-gray-300 mb-4"></i>
                <p class="text-gray-600 font-semibold text-lg">Aucun test trouvé</p>
                <button onclick="showImportModal()" class="btn-primary mt-4">
                    <i class="fas fa-file-import mr-2"></i>
                    Import Premier Fichier
                </button>
            </div>
        </div>
    </div>
    
    <!-- Modal Import -->
    <div id="importModal" class="hidden fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center">
        <div class="bg-white rounded-xl p-8 max-w-2xl w-full mx-4">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold text-gray-800">
                    <i class="fas fa-file-import text-yellow-600 mr-2"></i>
                    Import CSV Benning IT 130
                </h2>
                <button onclick="closeImportModal()" class="text-gray-500 hover:text-gray-800 text-2xl">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <form id="importForm" onsubmit="importBenning(event)">
                <div class="mb-6">
                    <label class="block text-sm font-bold text-gray-700 mb-2">Centrale PV *</label>
                    <select id="importPlantId" required class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                        <option value="">-- Sélectionner --</option>
                        <option value="1">Centrale Test (ID 1)</option>
                    </select>
                </div>
                
                <div class="mb-6">
                    <label class="block text-sm font-bold text-gray-700 mb-2">Fichier CSV Benning *</label>
                    <input type="file" id="importFile" required accept=".csv" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                    <p class="text-sm text-gray-500 mt-1">Format : Export CSV du Benning IT 130</p>
                </div>
                
                <div class="flex space-x-4">
                    <button type="button" onclick="closeImportModal()" class="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-bold hover:bg-gray-300">
                        Annuler
                    </button>
                    <button type="submit" class="flex-1 btn-primary">
                        <i class="fas fa-cloud-upload-alt mr-2"></i>
                        Import
                    </button>
                </div>
            </form>
            
            <div id="importProgress" style="display: none;" class="text-center py-8">
                <i class="fas fa-spinner fa-spin text-4xl text-yellow-600 mb-4"></i>
                <p class="text-gray-700 font-bold">Import en cours...</p>
            </div>
        </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
        let allTests = [];
        let isolationChart = null;
        
        document.addEventListener('DOMContentLoaded', () => {
            loadTests();
        });
        
        async function loadTests() {
            try {
                document.getElementById('loadingSpinner').style.display = 'block';
                document.getElementById('testsTable').style.display = 'none';
                document.getElementById('noTests').style.display = 'none';
                
                const plantId = document.getElementById('filterPlantId').value;
                const testType = document.getElementById('filterTestType').value;
                const isConform = document.getElementById('filterConformity').value;
                
                let url = '/api/isolation/tests';
                const params = [];
                if (plantId) params.push(\`plantId=\${plantId}\`);
                if (testType) params.push(\`testType=\${testType}\`);
                if (isConform) params.push(\`isConform=\${isConform}\`);
                if (params.length > 0) url += '?' + params.join('&');
                
                const response = await axios.get(url);
                
                if (response.data.success) {
                    allTests = response.data.tests || [];
                    displayTests(allTests);
                    updateStats(allTests);
                    updateChart(allTests);
                }
            } catch (error) {
                console.error('Erreur chargement tests:', error);
                document.getElementById('loadingSpinner').style.display = 'none';
                document.getElementById('noTests').style.display = 'block';
            }
        }
        
        function displayTests(tests) {
            document.getElementById('loadingSpinner').style.display = 'none';
            
            if (tests.length === 0) {
                document.getElementById('testsTable').style.display = 'none';
                document.getElementById('noTests').style.display = 'block';
                return;
            }
            
            document.getElementById('testsTable').style.display = 'block';
            document.getElementById('noTests').style.display = 'none';
            document.getElementById('testCount').textContent = \`(\${tests.length} test(s))\`;
            
            const tbody = document.getElementById('testsBody');
            tbody.innerHTML = tests.map(t => \`
                <tr class="border-t border-gray-200 hover:bg-gray-50">
                    <td class="px-4 py-3 text-sm">\${new Date(t.test_date).toLocaleDateString('fr-FR')}</td>
                    <td class="px-4 py-3 text-xs text-gray-600">\${t.test_type}</td>
                    <td class="px-4 py-3 font-bold">\${t.dc_positive_to_earth ? t.dc_positive_to_earth.toFixed(2) + ' MΩ' : '-'}</td>
                    <td class="px-4 py-3">\${t.dc_negative_to_earth ? t.dc_negative_to_earth.toFixed(2) + ' MΩ' : '-'}</td>
                    <td class="px-4 py-3">\${t.dc_positive_to_negative ? t.dc_positive_to_negative.toFixed(2) + ' MΩ' : '-'}</td>
                    <td class="px-4 py-3">\${t.ac_to_earth ? t.ac_to_earth.toFixed(2) + ' MΩ' : '-'}</td>
                    <td class="px-4 py-3">
                        <span class="conformity-badge \${t.is_conform ? 'status-conform' : 'status-non-conform'}">
                            \${t.is_conform ? 'CONFORME' : 'NON-CONFORME'}
                        </span>
                    </td>
                </tr>
            \`).join('');
        }
        
        function updateStats(tests) {
            if (tests.length === 0) return;
            
            const conformTests = tests.filter(t => t.is_conform).length;
            const conformRate = Math.round((conformTests / tests.length) * 100);
            const dcPosEarthValues = tests.filter(t => t.dc_positive_to_earth).map(t => t.dc_positive_to_earth);
            const avgDCPosEarth = dcPosEarthValues.length > 0 
                ? (dcPosEarthValues.reduce((sum, val) => sum + val, 0) / dcPosEarthValues.length).toFixed(2)
                : '-';
            
            document.getElementById('totalTests').textContent = tests.length;
            document.getElementById('conformRate').textContent = conformRate + '%';
            document.getElementById('avgDCPosEarth').textContent = avgDCPosEarth;
            document.getElementById('nonConformTests').textContent = tests.length - conformTests;
        }
        
        function updateChart(tests) {
            if (tests.length === 0) return;
            
            // Trier par date
            const sorted = tests.filter(t => t.dc_positive_to_earth).sort((a, b) => 
                new Date(a.test_date) - new Date(b.test_date)
            );
            
            const dates = sorted.map(t => new Date(t.test_date).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }));
            const values = sorted.map(t => t.dc_positive_to_earth);
            
            const ctx = document.getElementById('isolationChart');
            if (isolationChart) isolationChart.destroy();
            
            isolationChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: dates,
                    datasets: [{
                        label: 'DC+ Terre (MΩ)',
                        data: values,
                        borderColor: 'rgb(234, 179, 8)',
                        backgroundColor: 'rgba(234, 179, 8, 0.2)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.3
                    }, {
                        label: 'Seuil Conformité (1 MΩ)',
                        data: Array(dates.length).fill(1),
                        borderColor: 'rgb(239, 68, 68)',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        fill: false
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: true }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return value + ' MΩ';
                                }
                            }
                        }
                    }
                }
            });
        }
        
        function resetFilters() {
            document.getElementById('filterPlantId').value = '';
            document.getElementById('filterTestType').value = '';
            document.getElementById('filterConformity').value = '';
            loadTests();
        }
        
        function showImportModal() {
            document.getElementById('importModal').classList.remove('hidden');
        }
        
        function closeImportModal() {
            document.getElementById('importModal').classList.add('hidden');
            document.getElementById('importForm').reset();
        }
        
        async function importBenning(event) {
            event.preventDefault();
            
            const plantId = parseInt(document.getElementById('importPlantId').value);
            const file = document.getElementById('importFile').files[0];
            
            if (!file) {
                alert('Veuillez sélectionner un fichier');
                return;
            }
            
            try {
                document.getElementById('importForm').style.display = 'none';
                document.getElementById('importProgress').style.display = 'block';
                
                const text = await file.text();
                
                const response = await axios.post('/api/isolation/import/benning-csv', {
                    csvContent: text,
                    plantId: plantId
                });
                
                if (response.data.success) {
                    alert(\`Import réussi !\\n\${response.data.testsImported} test(s) importé(s)\`);
                    closeImportModal();
                    document.getElementById('importForm').style.display = 'block';
                    document.getElementById('importProgress').style.display = 'none';
                    loadTests();
                } else {
                    throw new Error(response.data.error || 'Erreur import');
                }
            } catch (error) {
                console.error('Erreur import:', error);
                alert('Erreur import: ' + (error.response?.data?.error || error.message));
                document.getElementById('importForm').style.display = 'block';
                document.getElementById('importProgress').style.display = 'none';
            }
        }
    </script>
    
</body>
</html>
  `;
}
