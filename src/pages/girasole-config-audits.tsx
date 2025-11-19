// ============================================================================
// GIRASOLE - CONFIGURATION TYPES AUDITS PAR CENTRALE
// ============================================================================
// Page admin pour définir quelles checklists sont nécessaires par centrale

export function getGirasoleConfigAuditsPage() {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Configuration Audits GIRASOLE - DiagPV</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
</head>
<body class="bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 py-8">
        
        <!-- Header -->
        <div class="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 rounded-lg shadow-lg mb-6">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-3xl font-bold flex items-center gap-3">
                        <i class="fas fa-cog"></i>
                        Configuration Types d'Audits
                    </h1>
                    <p class="text-purple-100 mt-1">Définir quelles checklists sont nécessaires par centrale</p>
                </div>
                <a href="/girasole/dashboard" class="bg-white text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-50">
                    <i class="fas fa-arrow-left mr-2"></i>
                    Retour Dashboard
                </a>
            </div>
        </div>

        <!-- Info Box -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div class="flex items-start gap-3">
                <i class="fas fa-info-circle text-blue-600 text-xl mt-1"></i>
                <div>
                    <h3 class="font-bold text-blue-900 mb-1">Types d'Audits Disponibles</h3>
                    <ul class="text-sm text-blue-800 space-y-1">
                        <li><strong>CONFORMITE</strong> : Checklist Conformité NF C 15-100 + UTE C 15-712 (12 sections)</li>
                        <li><strong>TOITURE</strong> : Checklist Toiture DTU 40.35 + ETN (7 sections)</li>
                        <li><strong>LES DEUX</strong> : Certaines centrales nécessitent les 2 checklists (13 centrales identifiées)</li>
                    </ul>
                </div>
            </div>
        </div>

        <!-- Centrales List -->
        <div class="bg-white rounded-lg shadow-md overflow-hidden">
            <div class="p-4 bg-gray-50 border-b">
                <h2 class="text-lg font-bold text-gray-800">
                    <i class="fas fa-solar-panel text-purple-600 mr-2"></i>
                    Centrales GIRASOLE
                </h2>
            </div>
            
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gray-50 border-b">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Centrale
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Type
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Audits Nécessaires
                            </th>
                            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                Action
                            </th>
                        </tr>
                    </thead>
                    <tbody id="centrales-list" class="bg-white divide-y divide-gray-200">
                        <tr>
                            <td colspan="4" class="px-6 py-8 text-center text-gray-500">
                                <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                                <p>Chargement...</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Bouton Sauvegarde Globale -->
        <div class="mt-6 flex justify-end">
            <button id="btn-save-all" class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2">
                <i class="fas fa-save"></i>
                Enregistrer Toutes les Modifications
            </button>
        </div>

    </div>

    <script>
        let centrales = [];
        let changes = {};

        async function loadCentrales() {
            try {
                const { data: clientsData } = await axios.get('/api/crm/clients');
                const girasoleClient = clientsData.clients?.find(c => 
                    c.company_name?.toLowerCase().includes('girasole')
                );

                if (!girasoleClient) {
                    alert('❌ Client GIRASOLE non trouvé');
                    return;
                }

                const { data: projectsData } = await axios.get(\`/api/crm/clients/\${girasoleClient.id}/projects\`);
                centrales = projectsData.projects || [];
                
                renderCentrales();
            } catch (error) {
                console.error('Load error:', error);
                alert('❌ Erreur chargement : ' + error.message);
            }
        }

        function renderCentrales() {
            const tbody = document.getElementById('centrales-list');
            
            if (centrales.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-8 text-center text-gray-500">Aucune centrale trouvée</td></tr>';
                return;
            }

            tbody.innerHTML = centrales.map(c => {
                let auditTypes = [];
                try {
                    auditTypes = JSON.parse(c.audit_types || '["CONFORMITE"]');
                } catch (e) {
                    auditTypes = ['CONFORMITE'];
                }

                const hasConformite = auditTypes.includes('CONFORMITE');
                const hasToiture = auditTypes.includes('TOITURE');

                return \`
                    <tr>
                        <td class="px-6 py-4">
                            <div class="font-medium text-gray-900">\${c.name}</div>
                            <div class="text-sm text-gray-500">ID: \${c.id}</div>
                        </td>
                        <td class="px-6 py-4">
                            <span class="px-3 py-1 rounded-full text-xs font-medium \${
                                c.type === 'SOL' ? 'bg-yellow-100 text-yellow-800' : 'bg-purple-100 text-purple-800'
                            }">
                                \${c.type || 'SOL'}
                            </span>
                        </td>
                        <td class="px-6 py-4">
                            <div class="flex gap-2">
                                <label class="flex items-center">
                                    <input 
                                        type="checkbox" 
                                        id="conformite-\${c.id}"
                                        class="mr-2"
                                        \${hasConformite ? 'checked' : ''}
                                        onchange="updateAuditTypes(\${c.id}, 'CONFORMITE', this.checked)">
                                    <span class="text-sm font-medium text-blue-700">CONFORMITE</span>
                                </label>
                                <label class="flex items-center">
                                    <input 
                                        type="checkbox" 
                                        id="toiture-\${c.id}"
                                        class="mr-2"
                                        \${hasToiture ? 'checked' : ''}
                                        onchange="updateAuditTypes(\${c.id}, 'TOITURE', this.checked)">
                                    <span class="text-sm font-medium text-purple-700">TOITURE</span>
                                </label>
                            </div>
                        </td>
                        <td class="px-6 py-4 text-right">
                            <span id="status-\${c.id}" class="text-xs text-gray-400"></span>
                        </td>
                    </tr>
                \`;
            }).join('');
        }

        function updateAuditTypes(centraleId, auditType, checked) {
            const centrale = centrales.find(c => c.id === centraleId);
            if (!centrale) return;

            let auditTypes = [];
            try {
                auditTypes = JSON.parse(centrale.audit_types || '["CONFORMITE"]');
            } catch (e) {
                auditTypes = ['CONFORMITE'];
            }

            if (checked && !auditTypes.includes(auditType)) {
                auditTypes.push(auditType);
            } else if (!checked && auditTypes.includes(auditType)) {
                auditTypes = auditTypes.filter(t => t !== auditType);
            }

            // Si aucun type sélectionné, forcer CONFORMITE
            if (auditTypes.length === 0) {
                auditTypes = ['CONFORMITE'];
                document.getElementById(\`conformite-\${centraleId}\`).checked = true;
            }

            centrale.audit_types = JSON.stringify(auditTypes);
            changes[centraleId] = auditTypes;

            const status = document.getElementById(\`status-\${centraleId}\`);
            status.textContent = '✏️ Modifié';
            status.className = 'text-xs text-orange-600 font-medium';
        }

        async function saveAll() {
            if (Object.keys(changes).length === 0) {
                alert('ℹ️ Aucune modification à enregistrer');
                return;
            }

            const btn = document.getElementById('btn-save-all');
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Enregistrement...';

            let successCount = 0;
            let errorCount = 0;

            for (const [centraleId, auditTypes] of Object.entries(changes)) {
                try {
                    await axios.put(\`/api/crm/projects/\${centraleId}\`, {
                        audit_types: JSON.stringify(auditTypes)
                    });
                    
                    const status = document.getElementById(\`status-\${centraleId}\`);
                    status.textContent = '✅ Enregistré';
                    status.className = 'text-xs text-green-600 font-medium';
                    
                    successCount++;
                } catch (error) {
                    console.error(\`Erreur centrale \${centraleId}:\`, error);
                    
                    const status = document.getElementById(\`status-\${centraleId}\`);
                    status.textContent = '❌ Erreur';
                    status.className = 'text-xs text-red-600 font-medium';
                    
                    errorCount++;
                }
            }

            changes = {};

            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-save mr-2"></i>Enregistrer Toutes les Modifications';

            alert(\`✅ Enregistrement terminé !

\${successCount} centrale(s) mise(s) à jour
\${errorCount} erreur(s)\`);
        }

        // Init
        document.addEventListener('DOMContentLoaded', () => {
            loadCentrales();
            document.getElementById('btn-save-all').addEventListener('click', saveAll);
        });
    </script>
</body>
</html>
  `;
}
