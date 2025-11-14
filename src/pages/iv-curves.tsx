/**
 * Page /iv-curves - Interface Module Courbes I-V
 * Upload PVServ + Visualisation courbes
 */

export function getIVCurvesPage() {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Module Courbes I-V - DiagPV</title>
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
            background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
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
            box-shadow: 0 10px 20px rgba(37, 99, 235, 0.3);
        }
        .stat-card {
            background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
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
        .conformity-ok { background: #dcfce7; color: #166534; }
        .conformity-warning { background: #fef3c7; color: #92400e; }
    </style>
</head>
<body class="min-h-screen p-6">
    
    <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="diagpv-card">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-4xl font-black text-gray-800 mb-2">
                        <i class="fas fa-chart-line text-blue-600 mr-3"></i>
                        MODULE COURBES I-V
                    </h1>
                    <p class="text-gray-600 font-semibold">Mesures PVServ - Fill Factor & Résistance Série</p>
                </div>
                <button onclick="showUploadModal()" class="btn-primary">
                    <i class="fas fa-upload mr-2"></i>
                    UPLOAD PVSERV
                </button>
            </div>
        </div>
        
        <!-- Statistiques -->
        <div id="statsContainer" class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div class="stat-card">
                <div class="text-4xl font-black text-blue-600" id="totalCurves">-</div>
                <div class="text-gray-600 font-semibold mt-2">Courbes Total</div>
            </div>
            <div class="stat-card">
                <div class="text-4xl font-black text-green-600" id="avgFF">-</div>
                <div class="text-gray-600 font-semibold mt-2">FF Moyen</div>
            </div>
            <div class="stat-card">
                <div class="text-4xl font-black text-purple-600" id="avgRds">-</div>
                <div class="text-gray-600 font-semibold mt-2">Rds Moyen (Ω)</div>
            </div>
            <div class="stat-card">
                <div class="text-4xl font-black text-orange-600" id="outOfTolerance">-</div>
                <div class="text-gray-600 font-semibold mt-2">Hors Tolérance</div>
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
                    <label class="block text-sm font-bold text-gray-700 mb-2">String</label>
                    <select id="filterString" onchange="loadCurves()" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                        <option value="">Tous les strings</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">FF Min</label>
                    <input type="number" id="filterFFMin" step="0.01" placeholder="0.00" onchange="loadCurves()" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                </div>
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">Audit Token</label>
                    <input type="text" id="filterAuditToken" placeholder="PV-1-XXX" onchange="loadCurves()" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                </div>
                <div class="flex items-end">
                    <button onclick="resetFilters()" class="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-bold hover:bg-gray-300">
                        <i class="fas fa-redo mr-2"></i>
                        Réinitialiser
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Graphique FF par String -->
        <div class="diagpv-card">
            <h3 class="text-2xl font-bold text-gray-800 mb-4">
                <i class="fas fa-chart-bar text-green-600 mr-2"></i>
                Fill Factor par String
            </h3>
            <div style="height: 300px;">
                <canvas id="ffChart"></canvas>
            </div>
        </div>
        
        <!-- Tableau Courbes -->
        <div class="diagpv-card">
            <h3 class="text-2xl font-bold text-gray-800 mb-4">
                <i class="fas fa-list text-blue-600 mr-2"></i>
                Liste Courbes I-V
                <span id="curveCount" class="text-sm text-gray-500 ml-2"></span>
            </h3>
            
            <div id="loadingSpinner" class="text-center py-12">
                <i class="fas fa-spinner fa-spin text-4xl text-blue-600"></i>
                <p class="text-gray-600 mt-4 font-semibold">Chargement courbes...</p>
            </div>
            
            <div id="curvesTable" style="display: none;" class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-3 text-left font-bold text-gray-700">String</th>
                            <th class="px-4 py-3 text-left font-bold text-gray-700">Module</th>
                            <th class="px-4 py-3 text-left font-bold text-gray-700">FF</th>
                            <th class="px-4 py-3 text-left font-bold text-gray-700">Rds (Ω)</th>
                            <th class="px-4 py-3 text-left font-bold text-gray-700">Uf (V)</th>
                            <th class="px-4 py-3 text-left font-bold text-gray-700">Date</th>
                            <th class="px-4 py-3 text-left font-bold text-gray-700">Audit</th>
                        </tr>
                    </thead>
                    <tbody id="curvesBody">
                    </tbody>
                </table>
            </div>
            
            <div id="noCurves" style="display: none;" class="text-center py-12">
                <i class="fas fa-inbox text-6xl text-gray-300 mb-4"></i>
                <p class="text-gray-600 font-semibold text-lg">Aucune courbe I-V trouvée</p>
                <button onclick="showUploadModal()" class="btn-primary mt-4">
                    <i class="fas fa-upload mr-2"></i>
                    Upload Premier Fichier
                </button>
            </div>
        </div>
    </div>
    
    <!-- Modal Upload -->
    <div id="uploadModal" class="hidden fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center">
        <div class="bg-white rounded-xl p-8 max-w-2xl w-full mx-4">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold text-gray-800">
                    <i class="fas fa-upload text-blue-600 mr-2"></i>
                    Upload Fichier PVServ
                </h2>
                <button onclick="closeUploadModal()" class="text-gray-500 hover:text-gray-800 text-2xl">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <form id="uploadForm" onsubmit="uploadPVServ(event)">
                <div class="mb-6">
                    <label class="block text-sm font-bold text-gray-700 mb-2">Audit Token *</label>
                    <input type="text" id="uploadAuditToken" required placeholder="PV-1-XXXXX" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                    <p class="text-sm text-gray-500 mt-1">Token de l'audit EL lié aux mesures</p>
                </div>
                
                <div class="mb-6">
                    <label class="block text-sm font-bold text-gray-700 mb-2">Fichier PVServ (TXT ou XLSM) *</label>
                    <input type="file" id="uploadFile" required accept=".txt,.xlsm" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                </div>
                
                <div class="flex space-x-4">
                    <button type="button" onclick="closeUploadModal()" class="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-bold hover:bg-gray-300">
                        Annuler
                    </button>
                    <button type="submit" class="flex-1 btn-primary">
                        <i class="fas fa-cloud-upload-alt mr-2"></i>
                        Upload
                    </button>
                </div>
            </form>
            
            <div id="uploadProgress" style="display: none;" class="text-center py-8">
                <i class="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
                <p class="text-gray-700 font-bold">Upload en cours...</p>
            </div>
        </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
        let allCurves = [];
        let ffChart = null;
        
        document.addEventListener('DOMContentLoaded', () => {
            loadCurves();
        });
        
        async function loadCurves() {
            try {
                document.getElementById('loadingSpinner').style.display = 'block';
                document.getElementById('curvesTable').style.display = 'none';
                document.getElementById('noCurves').style.display = 'none';
                
                const auditToken = document.getElementById('filterAuditToken').value;
                const stringNum = document.getElementById('filterString').value;
                const ffMin = parseFloat(document.getElementById('filterFFMin').value) || null;
                
                let url = '/api/iv-curves';
                const params = [];
                if (auditToken) params.push(\`auditToken=\${auditToken}\`);
                if (stringNum) params.push(\`stringNumber=\${stringNum}\`);
                if (params.length > 0) url += '?' + params.join('&');
                
                const response = await axios.get(url);
                
                if (response.data.success) {
                    allCurves = response.data.curves || [];
                    
                    // Filtrer FF min côté client
                    if (ffMin !== null) {
                        allCurves = allCurves.filter(c => c.ff >= ffMin);
                    }
                    
                    displayCurves(allCurves);
                    updateStats(allCurves);
                    updateChart(allCurves);
                    populateStringFilter(allCurves);
                }
            } catch (error) {
                console.error('Erreur chargement courbes:', error);
                document.getElementById('loadingSpinner').style.display = 'none';
                document.getElementById('noCurves').style.display = 'block';
            }
        }
        
        function displayCurves(curves) {
            document.getElementById('loadingSpinner').style.display = 'none';
            
            if (curves.length === 0) {
                document.getElementById('curvesTable').style.display = 'none';
                document.getElementById('noCurves').style.display = 'block';
                return;
            }
            
            document.getElementById('curvesTable').style.display = 'block';
            document.getElementById('noCurves').style.display = 'none';
            document.getElementById('curveCount').textContent = \`(\${curves.length} courbe(s))\`;
            
            const tbody = document.getElementById('curvesBody');
            tbody.innerHTML = curves.map(c => \`
                <tr class="border-t border-gray-200 hover:bg-gray-50">
                    <td class="px-4 py-3 font-bold text-blue-600">String \${c.string_number}</td>
                    <td class="px-4 py-3">\${c.module_number || '-'}</td>
                    <td class="px-4 py-3">
                        <span class="conformity-badge \${c.ff >= 0.7 ? 'conformity-ok' : 'conformity-warning'}">
                            \${c.ff.toFixed(3)}
                        </span>
                    </td>
                    <td class="px-4 py-3">\${c.rds.toFixed(2)}</td>
                    <td class="px-4 py-3">\${c.uf.toFixed(2)}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">\${new Date(c.created_at).toLocaleDateString('fr-FR')}</td>
                    <td class="px-4 py-3 text-sm font-mono text-gray-600">\${c.audit_token.substring(0, 12)}...</td>
                </tr>
            \`).join('');
        }
        
        function updateStats(curves) {
            if (curves.length === 0) return;
            
            const avgFF = curves.reduce((sum, c) => sum + c.ff, 0) / curves.length;
            const avgRds = curves.reduce((sum, c) => sum + c.rds, 0) / curves.length;
            const outOfTol = curves.filter(c => c.ff < 0.7).length;
            
            document.getElementById('totalCurves').textContent = curves.length;
            document.getElementById('avgFF').textContent = avgFF.toFixed(3);
            document.getElementById('avgRds').textContent = avgRds.toFixed(2);
            document.getElementById('outOfTolerance').textContent = outOfTol;
        }
        
        function updateChart(curves) {
            if (curves.length === 0) return;
            
            // Grouper par string
            const byString = {};
            curves.forEach(c => {
                if (!byString[c.string_number]) byString[c.string_number] = [];
                byString[c.string_number].push(c.ff);
            });
            
            const strings = Object.keys(byString).sort((a, b) => parseInt(a) - parseInt(b));
            const avgFFs = strings.map(s => {
                const ffs = byString[s];
                return ffs.reduce((sum, ff) => sum + ff, 0) / ffs.length;
            });
            
            const ctx = document.getElementById('ffChart');
            if (ffChart) ffChart.destroy();
            
            ffChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: strings.map(s => \`String \${s}\`),
                    datasets: [{
                        label: 'Fill Factor Moyen',
                        data: avgFFs,
                        backgroundColor: 'rgba(37, 99, 235, 0.8)',
                        borderColor: 'rgb(37, 99, 235)',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 1,
                            ticks: {
                                callback: function(value) {
                                    return value.toFixed(2);
                                }
                            }
                        }
                    }
                }
            });
        }
        
        function populateStringFilter(curves) {
            const strings = [...new Set(curves.map(c => c.string_number))].sort((a, b) => a - b);
            const select = document.getElementById('filterString');
            const currentValue = select.value;
            
            select.innerHTML = '<option value="">Tous les strings</option>' + 
                strings.map(s => \`<option value="\${s}">String \${s}</option>\`).join('');
            
            if (currentValue) select.value = currentValue;
        }
        
        function resetFilters() {
            document.getElementById('filterString').value = '';
            document.getElementById('filterFFMin').value = '';
            document.getElementById('filterAuditToken').value = '';
            loadCurves();
        }
        
        function showUploadModal() {
            document.getElementById('uploadModal').classList.remove('hidden');
        }
        
        function closeUploadModal() {
            document.getElementById('uploadModal').classList.add('hidden');
            document.getElementById('uploadForm').reset();
        }
        
        async function uploadPVServ(event) {
            event.preventDefault();
            
            const auditToken = document.getElementById('uploadAuditToken').value;
            const file = document.getElementById('uploadFile').files[0];
            
            if (!file) {
                alert('Veuillez sélectionner un fichier');
                return;
            }
            
            try {
                document.getElementById('uploadForm').style.display = 'none';
                document.getElementById('uploadProgress').style.display = 'block';
                
                const text = await file.text();
                
                const response = await axios.post('/api/iv-curves/upload', {
                    auditToken,
                    fileContent: text,
                    fileName: file.name
                });
                
                if (response.data.success) {
                    alert(\`Upload réussi !\\n\${response.data.curvesCount} courbes importées\`);
                    closeUploadModal();
                    document.getElementById('uploadForm').style.display = 'block';
                    document.getElementById('uploadProgress').style.display = 'none';
                    loadCurves();
                } else {
                    throw new Error(response.data.error || 'Erreur upload');
                }
            } catch (error) {
                console.error('Erreur upload:', error);
                alert('Erreur upload: ' + (error.response?.data?.error || error.message));
                document.getElementById('uploadForm').style.display = 'block';
                document.getElementById('uploadProgress').style.display = 'none';
            }
        }
    </script>
    
</body>
</html>
  `;
}
