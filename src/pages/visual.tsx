/**
 * Page /visual - Interface Module Visuels IEC 62446-1
 * Contrôles visuels terrain
 */

export function getVisualPage() {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Module Contrôles Visuels - DiagPV</title>
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
        .btn-primary {
            background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
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
            box-shadow: 0 10px 20px rgba(249, 115, 22, 0.3);
        }
        .stat-card {
            background: linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%);
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
        .status-pending { background: #f3f4f6; color: #6b7280; }
    </style>
</head>
<body class="min-h-screen p-6">
    
    <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="diagpv-card">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-4xl font-black text-gray-800 mb-2">
                        <i class="fas fa-eye text-orange-600 mr-3"></i>
                        MODULE CONTRÔLES VISUELS
                    </h1>
                    <p class="text-gray-600 font-semibold">Inspections IEC 62446-1 - Conformité Terrain</p>
                </div>
                <button onclick="showCreateModal()" class="btn-primary">
                    <i class="fas fa-plus mr-2"></i>
                    NOUVELLE INSPECTION
                </button>
            </div>
        </div>
        
        <!-- Statistiques -->
        <div id="statsContainer" class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div class="stat-card">
                <div class="text-4xl font-black text-orange-600" id="totalInspections">-</div>
                <div class="text-gray-600 font-semibold mt-2">Inspections Total</div>
            </div>
            <div class="stat-card">
                <div class="text-4xl font-black text-green-600" id="avgConformity">-</div>
                <div class="text-gray-600 font-semibold mt-2">Conformité Moyenne</div>
            </div>
            <div class="stat-card">
                <div class="text-4xl font-black text-red-600" id="totalCritical">-</div>
                <div class="text-gray-600 font-semibold mt-2">Défauts Critiques</div>
            </div>
            <div class="stat-card">
                <div class="text-4xl font-black text-blue-600" id="totalItems">-</div>
                <div class="text-gray-600 font-semibold mt-2">Items Vérifiés</div>
            </div>
        </div>
        
        <!-- Liste Inspections -->
        <div class="diagpv-card">
            <h3 class="text-2xl font-bold text-gray-800 mb-4">
                <i class="fas fa-list text-orange-600 mr-2"></i>
                Liste Inspections
                <span id="inspectionCount" class="text-sm text-gray-500 ml-2"></span>
            </h3>
            
            <div id="loadingSpinner" class="text-center py-12">
                <i class="fas fa-spinner fa-spin text-4xl text-orange-600"></i>
                <p class="text-gray-600 mt-4 font-semibold">Chargement inspections...</p>
            </div>
            
            <div id="inspectionsTable" style="display: none;" class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-3 text-left font-bold text-gray-700">Token</th>
                            <th class="px-4 py-3 text-left font-bold text-gray-700">Projet</th>
                            <th class="px-4 py-3 text-left font-bold text-gray-700">Client</th>
                            <th class="px-4 py-3 text-left font-bold text-gray-700">Date</th>
                            <th class="px-4 py-3 text-left font-bold text-gray-700">Conformité</th>
                            <th class="px-4 py-3 text-left font-bold text-gray-700">Critiques</th>
                            <th class="px-4 py-3 text-left font-bold text-gray-700">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="inspectionsBody">
                    </tbody>
                </table>
            </div>
            
            <div id="noInspections" style="display: none;" class="text-center py-12">
                <i class="fas fa-inbox text-6xl text-gray-300 mb-4"></i>
                <p class="text-gray-600 font-semibold text-lg">Aucune inspection trouvée</p>
                <button onclick="showCreateModal()" class="btn-primary mt-4">
                    <i class="fas fa-plus mr-2"></i>
                    Créer Première Inspection
                </button>
            </div>
        </div>
    </div>
    
    <!-- Modal Création -->
    <div id="createModal" class="hidden fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center overflow-y-auto">
        <div class="bg-white rounded-xl p-8 max-w-3xl w-full mx-4 my-8">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold text-gray-800">
                    <i class="fas fa-plus-circle text-orange-600 mr-2"></i>
                    Nouvelle Inspection Visuelle
                </h2>
                <button onclick="closeCreateModal()" class="text-gray-500 hover:text-gray-800 text-2xl">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <form id="createForm" onsubmit="createInspection(event)">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-2">Nom Projet *</label>
                        <input type="text" id="projectName" required placeholder="Ex: Centrale Toulouse" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-2">Client *</label>
                        <input type="text" id="clientName" required placeholder="Ex: EDF Renouvelables" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-2">Localisation *</label>
                        <input type="text" id="location" required placeholder="Ex: 31000 Toulouse" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-2">Date Inspection *</label>
                        <input type="date" id="inspectionDate" required class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-2">Inspecteur *</label>
                        <select id="inspectorName" required class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                            <option value="">-- Sélectionner --</option>
                            <option value="Adrien PAPPALARDO">Adrien PAPPALARDO</option>
                            <option value="Fabien CORRERA">Fabien CORRERA</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-2">Puissance Système (kWp) *</label>
                        <input type="number" id="systemPower" required step="0.01" placeholder="Ex: 500.00" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-2">Nb Modules</label>
                        <input type="number" id="moduleCount" placeholder="Ex: 1250" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-2">Nb Onduleurs</label>
                        <input type="number" id="inverterCount" placeholder="Ex: 5" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-2">Année Installation</label>
                        <input type="number" id="installationYear" placeholder="Ex: 2023" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                    </div>
                </div>
                
                <div class="mb-6">
                    <label class="block text-sm font-bold text-gray-700 mb-2">Centrale PV (ID)</label>
                    <input type="number" id="plantId" placeholder="ID centrale (optionnel)" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                    <p class="text-sm text-gray-500 mt-1">Pour lier cette inspection à une centrale existante</p>
                </div>
                
                <div class="flex space-x-4">
                    <button type="button" onclick="closeCreateModal()" class="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-bold hover:bg-gray-300">
                        Annuler
                    </button>
                    <button type="submit" class="flex-1 btn-primary">
                        <i class="fas fa-check mr-2"></i>
                        Créer Inspection
                    </button>
                </div>
            </form>
            
            <div id="createProgress" style="display: none;" class="text-center py-8">
                <i class="fas fa-spinner fa-spin text-4xl text-orange-600 mb-4"></i>
                <p class="text-gray-700 font-bold">Création en cours...</p>
            </div>
        </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
        let allInspections = [];
        
        document.addEventListener('DOMContentLoaded', () => {
            loadInspections();
            document.getElementById('inspectionDate').valueAsDate = new Date();
        });
        
        async function loadInspections() {
            try {
                document.getElementById('loadingSpinner').style.display = 'block';
                document.getElementById('inspectionsTable').style.display = 'none';
                document.getElementById('noInspections').style.display = 'none';
                
                const response = await axios.get('/api/visual/inspections');
                
                if (response.data.success) {
                    allInspections = response.data.inspections || [];
                    displayInspections(allInspections);
                    updateStats(allInspections);
                }
            } catch (error) {
                console.error('Erreur chargement inspections:', error);
                document.getElementById('loadingSpinner').style.display = 'none';
                document.getElementById('noInspections').style.display = 'block';
            }
        }
        
        function displayInspections(inspections) {
            document.getElementById('loadingSpinner').style.display = 'none';
            
            if (inspections.length === 0) {
                document.getElementById('inspectionsTable').style.display = 'none';
                document.getElementById('noInspections').style.display = 'block';
                return;
            }
            
            document.getElementById('inspectionsTable').style.display = 'block';
            document.getElementById('noInspections').style.display = 'none';
            document.getElementById('inspectionCount').textContent = \`(\${inspections.length} inspection(s))\`;
            
            const tbody = document.getElementById('inspectionsBody');
            tbody.innerHTML = inspections.map(i => \`
                <tr class="border-t border-gray-200 hover:bg-gray-50">
                    <td class="px-4 py-3 font-mono text-sm text-gray-600">\${i.inspection_token.substring(0, 16)}...</td>
                    <td class="px-4 py-3 font-semibold">\${i.project_name}</td>
                    <td class="px-4 py-3">\${i.client_name}</td>
                    <td class="px-4 py-3 text-sm">\${new Date(i.inspection_date).toLocaleDateString('fr-FR')}</td>
                    <td class="px-4 py-3">
                        <span class="conformity-badge \${(i.conformity_level * 100) >= 80 ? 'status-conform' : 'status-non-conform'}">
                            \${Math.round(i.conformity_level * 100)}%
                        </span>
                    </td>
                    <td class="px-4 py-3">
                        <span class="text-red-600 font-bold">\${i.critical_issues_count}</span>
                    </td>
                    <td class="px-4 py-3">
                        <button onclick="viewInspection('\${i.inspection_token}')" class="px-3 py-1 bg-orange-100 text-orange-800 rounded font-bold text-xs hover:bg-orange-200">
                            <i class="fas fa-eye mr-1"></i>Détails
                        </button>
                    </td>
                </tr>
            \`).join('');
        }
        
        function updateStats(inspections) {
            if (inspections.length === 0) {
                document.getElementById('totalInspections').textContent = '0';
                document.getElementById('avgConformity').textContent = '-';
                document.getElementById('totalCritical').textContent = '0';
                document.getElementById('totalItems').textContent = '0';
                return;
            }
            
            const avgConf = Math.round(inspections.reduce((sum, i) => sum + (i.conformity_level * 100), 0) / inspections.length);
            const totalCrit = inspections.reduce((sum, i) => sum + i.critical_issues_count, 0);
            
            document.getElementById('totalInspections').textContent = inspections.length;
            document.getElementById('avgConformity').textContent = avgConf + '%';
            document.getElementById('totalCritical').textContent = totalCrit;
            document.getElementById('totalItems').textContent = '-';
        }
        
        function showCreateModal() {
            document.getElementById('createModal').classList.remove('hidden');
        }
        
        function closeCreateModal() {
            document.getElementById('createModal').classList.add('hidden');
            document.getElementById('createForm').reset();
        }
        
        async function createInspection(event) {
            event.preventDefault();
            
            const data = {
                projectName: document.getElementById('projectName').value,
                clientName: document.getElementById('clientName').value,
                location: document.getElementById('location').value,
                inspectionDate: document.getElementById('inspectionDate').value,
                inspectorName: document.getElementById('inspectorName').value,
                systemPowerKwp: parseFloat(document.getElementById('systemPower').value),
                moduleCount: parseInt(document.getElementById('moduleCount').value) || null,
                inverterCount: parseInt(document.getElementById('inverterCount').value) || null,
                installationYear: parseInt(document.getElementById('installationYear').value) || null,
                plantId: parseInt(document.getElementById('plantId').value) || null
            };
            
            try {
                document.getElementById('createForm').style.display = 'none';
                document.getElementById('createProgress').style.display = 'block';
                
                const response = await axios.post('/api/visual/inspection/create', data);
                
                if (response.data.success) {
                    alert(\`Inspection créée !\\nToken: \${response.data.inspectionToken}\`);
                    closeCreateModal();
                    document.getElementById('createForm').style.display = 'block';
                    document.getElementById('createProgress').style.display = 'none';
                    loadInspections();
                } else {
                    throw new Error(response.data.error || 'Erreur création');
                }
            } catch (error) {
                console.error('Erreur création inspection:', error);
                alert('Erreur: ' + (error.response?.data?.error || error.message));
                document.getElementById('createForm').style.display = 'block';
                document.getElementById('createProgress').style.display = 'none';
            }
        }
        
        async function viewInspection(token) {
            try {
                const response = await axios.get(\`/api/visual/inspection/\${token}\`);
                
                if (response.data.success) {
                    const inspection = response.data.inspection;
                    alert(\`Inspection: \${inspection.project_name}\\nToken: \${token}\\nConformité: \${Math.round(inspection.conformity_level * 100)}%\\n\\nDétails complets via API\`);
                }
            } catch (error) {
                console.error('Erreur chargement inspection:', error);
                alert('Erreur chargement inspection');
            }
        }
    </script>
    
</body>
</html>
  `;
}
