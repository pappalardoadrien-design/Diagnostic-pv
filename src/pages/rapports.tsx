/**
 * Page /rapports - Interface Gestion Rapports Unifiés
 * Phase 4C - Module Rapport Unifié
 */

export function getRapportsPage() {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapports Unifiés - DiagPV</title>
    <script src="https://cdn.tailwindcss.com"></script>
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
        
        .conformity-badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 0.875rem;
        }
        
        .conformity-high { background: #dcfce7; color: #166534; }
        .conformity-medium { background: #fef3c7; color: #92400e; }
        .conformity-low { background: #fee2e2; color: #991b1b; }
        
        .module-tag {
            display: inline-block;
            padding: 2px 8px;
            margin: 2px;
            background: #e0e7ff;
            color: #3730a3;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 600;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
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
            box-shadow: 0 10px 20px rgba(22, 163, 74, 0.3);
        }
        
        .btn-secondary {
            background: white;
            color: #374151;
            padding: 8px 16px;
            border-radius: 6px;
            font-weight: 600;
            border: 2px solid #e5e7eb;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .btn-secondary:hover {
            border-color: #16a34a;
            color: #16a34a;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
        }
        
        th {
            background: #f9fafb;
            padding: 12px;
            text-align: left;
            font-weight: 700;
            color: #374151;
            border-bottom: 2px solid #e5e7eb;
        }
        
        td {
            padding: 12px;
            border-bottom: 1px solid #f3f4f6;
        }
        
        tr:hover {
            background: #f9fafb;
        }
        
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 1000;
            overflow: auto;
        }
        
        .modal-content {
            background: white;
            margin: 2% auto;
            width: 95%;
            max-width: 1200px;
            border-radius: 12px;
            max-height: 90vh;
            overflow: auto;
        }
        
        .stat-card {
            background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
            border-radius: 12px;
            padding: 1.5rem;
            text-align: center;
        }
        
        .stat-value {
            font-size: 2.5rem;
            font-weight: 900;
            color: #166534;
        }
        
        .stat-label {
            color: #6b7280;
            font-weight: 600;
            margin-top: 0.5rem;
        }
    </style>
</head>
<body class="min-h-screen p-6">
    
    <!-- Header DiagPV -->
    <div class="max-w-7xl mx-auto">
        <div class="diagpv-card">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-4xl font-black text-gray-800 mb-2">
                        <i class="fas fa-file-alt text-green-600 mr-3"></i>
                        RAPPORTS UNIFIÉS
                    </h1>
                    <p class="text-gray-600 font-semibold">Gestion centralisée des audits multi-modules DiagPV</p>
                </div>
                <button onclick="showGenerateForm()" class="btn-primary">
                    <i class="fas fa-plus mr-2"></i>
                    NOUVEAU RAPPORT
                </button>
            </div>
        </div>
        
        <!-- Statistiques Globales -->
        <div id="statsContainer" class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div class="stat-card">
                <div class="stat-value" id="totalReports">-</div>
                <div class="stat-label">Rapports Générés</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="avgConformity">-</div>
                <div class="stat-label">Conformité Moyenne</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="criticalIssues">-</div>
                <div class="stat-label">Défauts Critiques</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="recentReports">-</div>
                <div class="stat-label">Cette Semaine</div>
            </div>
        </div>
        
        <!-- Filtres -->
        <div class="diagpv-card">
            <h3 class="text-xl font-bold text-gray-800 mb-4">
                <i class="fas fa-filter text-blue-600 mr-2"></i>
                Filtres
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">Centrale</label>
                    <select id="filterPlantId" onchange="loadReports()" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                        <option value="">Toutes les centrales</option>
                        <option value="1">Centrale Test (ID 1)</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">Date Min</label>
                    <input type="date" id="filterDateMin" onchange="loadReports()" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                </div>
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">Conformité Min</label>
                    <input type="number" id="filterConformityMin" min="0" max="100" placeholder="0-100" onchange="loadReports()" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                </div>
                <div class="flex items-end">
                    <button onclick="resetFilters()" class="btn-secondary w-full">
                        <i class="fas fa-redo mr-2"></i>
                        Réinitialiser
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Tableau Rapports -->
        <div class="diagpv-card">
            <h3 class="text-2xl font-bold text-gray-800 mb-4">
                <i class="fas fa-list text-purple-600 mr-2"></i>
                Liste des Rapports
                <span id="reportCount" class="text-sm text-gray-500 ml-2"></span>
            </h3>
            
            <div id="loadingSpinner" class="text-center py-12">
                <i class="fas fa-spinner fa-spin text-4xl text-green-600"></i>
                <p class="text-gray-600 mt-4 font-semibold">Chargement des rapports...</p>
            </div>
            
            <div id="reportsTable" style="display: none;">
                <table>
                    <thead>
                        <tr>
                            <th>Token</th>
                            <th>Titre</th>
                            <th>Client</th>
                            <th>Date</th>
                            <th>Auditeur</th>
                            <th>Conformité</th>
                            <th>Modules</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="reportsBody">
                    </tbody>
                </table>
            </div>
            
            <div id="noReports" style="display: none;" class="text-center py-12">
                <i class="fas fa-inbox text-6xl text-gray-300 mb-4"></i>
                <p class="text-gray-600 font-semibold text-lg">Aucun rapport trouvé</p>
                <button onclick="showGenerateForm()" class="btn-primary mt-4">
                    <i class="fas fa-plus mr-2"></i>
                    Générer Premier Rapport
                </button>
            </div>
        </div>
    </div>
    
    <!-- Modal Visualisation Rapport -->
    <div id="reportModal" class="modal">
        <div class="modal-content">
            <div class="p-6 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                <h2 class="text-2xl font-bold text-gray-800">
                    <i class="fas fa-file-pdf text-red-600 mr-2"></i>
                    Rapport <span id="modalReportToken"></span>
                </h2>
                <button onclick="closeModal()" class="text-gray-500 hover:text-gray-800 text-2xl">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div id="reportContent" class="p-6"></div>
        </div>
    </div>
    
    <!-- Modal Génération Rapport -->
    <div id="generateModal" class="modal">
        <div class="modal-content">
            <div class="p-6 border-b border-gray-200 flex items-center justify-between bg-green-50">
                <h2 class="text-2xl font-bold text-gray-800">
                    <i class="fas fa-plus-circle text-green-600 mr-2"></i>
                    Générer Nouveau Rapport
                </h2>
                <button onclick="closeGenerateModal()" class="text-gray-500 hover:text-gray-800 text-2xl">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="p-6">
                <form id="generateForm" onsubmit="generateReport(event)">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label class="block text-sm font-bold text-gray-700 mb-2">Centrale PV *</label>
                            <select id="genPlantId" required class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                                <option value="">-- Sélectionner --</option>
                                <option value="1">Centrale Test (ID 1)</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-bold text-gray-700 mb-2">Date Audit *</label>
                            <input type="date" id="genAuditDate" required class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label class="block text-sm font-bold text-gray-700 mb-2">Titre Rapport *</label>
                            <input type="text" id="genReportTitle" required placeholder="Ex: Audit Annuel 2025" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                        </div>
                        <div>
                            <label class="block text-sm font-bold text-gray-700 mb-2">Nom Client *</label>
                            <input type="text" id="genClientName" required placeholder="Ex: EDF Renouvelables" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                        </div>
                    </div>
                    
                    <div class="mb-6">
                        <label class="block text-sm font-bold text-gray-700 mb-2">Auditeur</label>
                        <select id="genAuditorName" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                            <option value="">-- Optionnel --</option>
                            <option value="Adrien PAPPALARDO">Adrien PAPPALARDO</option>
                            <option value="Fabien CORRERA">Fabien CORRERA</option>
                        </select>
                    </div>
                    
                    <!-- Aperçu Données Disponibles -->
                    <div id="previewData" class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6" style="display: none;">
                        <h4 class="font-bold text-blue-800 mb-2">
                            <i class="fas fa-info-circle mr-2"></i>
                            Données Disponibles
                        </h4>
                        <div id="previewModules" class="text-sm text-gray-700"></div>
                    </div>
                    
                    <div class="flex space-x-4">
                        <button type="button" onclick="previewAvailableData()" class="btn-secondary flex-1">
                            <i class="fas fa-search mr-2"></i>
                            Aperçu Données
                        </button>
                        <button type="submit" class="btn-primary flex-1">
                            <i class="fas fa-file-pdf mr-2"></i>
                            Générer Rapport
                        </button>
                    </div>
                </form>
                
                <div id="generateProgress" style="display: none;" class="text-center py-8">
                    <i class="fas fa-spinner fa-spin text-4xl text-green-600 mb-4"></i>
                    <p class="text-gray-700 font-bold">Génération en cours...</p>
                </div>
            </div>
        </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
        // État global
        let allReports = [];
        
        // Chargement initial
        document.addEventListener('DOMContentLoaded', () => {
            loadReports();
            updateStats();
            
            // Date par défaut = aujourd'hui
            document.getElementById('genAuditDate').valueAsDate = new Date();
        });
        
        // Charger tous les rapports
        async function loadReports() {
            const plantId = document.getElementById('filterPlantId').value;
            
            try {
                document.getElementById('loadingSpinner').style.display = 'block';
                document.getElementById('reportsTable').style.display = 'none';
                document.getElementById('noReports').style.display = 'none';
                
                let url = '/api/report/unified/plant/1'; // TODO: Dynamiser quand multi-centrales
                if (plantId) {
                    url = \`/api/report/unified/plant/\${plantId}\`;
                }
                
                const response = await axios.get(url);
                
                if (response.data.success) {
                    allReports = response.data.reports || [];
                    applyFiltersAndDisplay();
                }
            } catch (error) {
                console.error('Erreur chargement rapports:', error);
                document.getElementById('loadingSpinner').style.display = 'none';
                document.getElementById('noReports').style.display = 'block';
            }
        }
        
        // Appliquer filtres et afficher
        function applyFiltersAndDisplay() {
            const dateMin = document.getElementById('filterDateMin').value;
            const conformityMin = parseInt(document.getElementById('filterConformityMin').value) || 0;
            
            let filtered = allReports.filter(r => {
                if (dateMin && r.auditDate < dateMin) return false;
                if (r.overallConformityRate < conformityMin) return false;
                return true;
            });
            
            displayReports(filtered);
        }
        
        // Afficher rapports
        function displayReports(reports) {
            document.getElementById('loadingSpinner').style.display = 'none';
            
            if (reports.length === 0) {
                document.getElementById('reportsTable').style.display = 'none';
                document.getElementById('noReports').style.display = 'block';
                return;
            }
            
            document.getElementById('reportsTable').style.display = 'block';
            document.getElementById('noReports').style.display = 'none';
            document.getElementById('reportCount').textContent = \`(\${reports.length} rapport(s))\`;
            
            const tbody = document.getElementById('reportsBody');
            tbody.innerHTML = reports.map(r => \`
                <tr>
                    <td class="font-mono text-sm text-gray-600">\${r.reportToken.substring(0, 16)}...</td>
                    <td class="font-semibold">\${r.reportTitle}</td>
                    <td>\${r.clientName}</td>
                    <td>\${new Date(r.auditDate).toLocaleDateString('fr-FR')}</td>
                    <td class="text-sm text-gray-600">\${r.auditorName || '-'}</td>
                    <td>
                        <span class="conformity-badge \${getConformityClass(r.overallConformityRate)}">
                            \${r.overallConformityRate}%
                        </span>
                    </td>
                    <td>
                        \${r.modulesIncluded.map(m => \`<span class="module-tag">\${m.toUpperCase()}</span>\`).join(' ')}
                    </td>
                    <td>
                        <button onclick="viewReport('\${r.reportToken}')" class="btn-secondary text-xs">
                            <i class="fas fa-eye mr-1"></i>Voir
                        </button>
                    </td>
                </tr>
            \`).join('');
        }
        
        // Classe conformité
        function getConformityClass(rate) {
            if (rate >= 80) return 'conformity-high';
            if (rate >= 60) return 'conformity-medium';
            return 'conformity-low';
        }
        
        // Réinitialiser filtres
        function resetFilters() {
            document.getElementById('filterPlantId').value = '';
            document.getElementById('filterDateMin').value = '';
            document.getElementById('filterConformityMin').value = '';
            loadReports();
        }
        
        // Mettre à jour statistiques
        async function updateStats() {
            // TODO: Endpoint API dédié pour stats globales
            // Pour l'instant, calculer depuis allReports
            if (allReports.length > 0) {
                const avgConf = Math.round(allReports.reduce((sum, r) => sum + r.overallConformityRate, 0) / allReports.length);
                const criticals = allReports.reduce((sum, r) => sum + r.criticalIssuesCount, 0);
                
                document.getElementById('totalReports').textContent = allReports.length;
                document.getElementById('avgConformity').textContent = avgConf + '%';
                document.getElementById('criticalIssues').textContent = criticals;
                document.getElementById('recentReports').textContent = allReports.filter(r => {
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return new Date(r.createdAt) > weekAgo;
                }).length;
            }
        }
        
        // Afficher formulaire génération
        function showGenerateForm() {
            document.getElementById('generateModal').style.display = 'block';
        }
        
        // Fermer modal génération
        function closeGenerateModal() {
            document.getElementById('generateModal').style.display = 'none';
            document.getElementById('generateForm').reset();
            document.getElementById('previewData').style.display = 'none';
        }
        
        // Aperçu données disponibles
        async function previewAvailableData() {
            const plantId = document.getElementById('genPlantId').value;
            if (!plantId) {
                alert('Veuillez sélectionner une centrale');
                return;
            }
            
            try {
                const response = await axios.get(\`/api/report/unified/preview?plantId=\${plantId}\`);
                
                if (response.data.success) {
                    const data = response.data;
                    const modules = [];
                    if (data.availableModules.el) modules.push(\`✅ EL (\${data.dataSummary.elAuditsCount} audit(s))\`);
                    if (data.availableModules.iv) modules.push(\`✅ IV (\${data.dataSummary.ivCurvesCount} courbe(s))\`);
                    if (data.availableModules.visual) modules.push(\`✅ Visuels (\${data.dataSummary.visualInspectionsCount} inspection(s))\`);
                    if (data.availableModules.isolation) modules.push(\`✅ Isolation (\${data.dataSummary.isolationTestsCount} test(s))\`);
                    
                    document.getElementById('previewModules').innerHTML = modules.join('<br>');
                    document.getElementById('previewData').style.display = 'block';
                }
            } catch (error) {
                console.error('Erreur aperçu:', error);
                alert('Erreur récupération données');
            }
        }
        
        // Générer rapport
        async function generateReport(event) {
            event.preventDefault();
            
            const formData = {
                plantId: parseInt(document.getElementById('genPlantId').value),
                reportTitle: document.getElementById('genReportTitle').value,
                clientName: document.getElementById('genClientName').value,
                auditDate: document.getElementById('genAuditDate').value,
                auditorName: document.getElementById('genAuditorName').value || null
            };
            
            try {
                document.getElementById('generateForm').style.display = 'none';
                document.getElementById('generateProgress').style.display = 'block';
                
                const response = await axios.post('/api/report/unified/generate', formData);
                
                if (response.data.success) {
                    alert(\`Rapport généré avec succès !\\nToken: \${response.data.reportToken}\`);
                    closeGenerateModal();
                    document.getElementById('generateForm').style.display = 'block';
                    document.getElementById('generateProgress').style.display = 'none';
                    loadReports();
                    updateStats();
                } else {
                    throw new Error(response.data.error || 'Erreur génération');
                }
            } catch (error) {
                console.error('Erreur génération rapport:', error);
                alert('Erreur génération rapport: ' + (error.response?.data?.error || error.message));
                document.getElementById('generateForm').style.display = 'block';
                document.getElementById('generateProgress').style.display = 'none';
            }
        }
        
        // Visualiser rapport
        async function viewReport(token) {
            try {
                const response = await axios.get(\`/api/report/unified/\${token}\`);
                
                if (response.data.success) {
                    const report = response.data.report;
                    document.getElementById('modalReportToken').textContent = token;
                    document.getElementById('reportContent').innerHTML = report.htmlContent;
                    document.getElementById('reportModal').style.display = 'block';
                }
            } catch (error) {
                console.error('Erreur chargement rapport:', error);
                alert('Erreur chargement rapport');
            }
        }
        
        // Fermer modal
        function closeModal() {
            document.getElementById('reportModal').style.display = 'none';
        }
        
        // Fermer modals au clic extérieur
        window.onclick = function(event) {
            if (event.target.classList.contains('modal')) {
                event.target.style.display = 'none';
            }
        }
    </script>
    
</body>
</html>
  `;
}
