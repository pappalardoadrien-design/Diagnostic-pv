// ============================================================================
// PAGE MODULE VISUELS - CONTRÔLES VISUELS
// ============================================================================
// Interface de saisie observations visuelles terrain
// Photos géolocalisées + défauts mécaniques
// ============================================================================

export function getAuditVisualPage() {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Module Visuels - Contrôles Visuels</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-black text-white min-h-screen font-bold">
        <div class="container mx-auto p-6">
            <!-- Navigation Modules -->
            <div id="module-nav" class="mb-6"></div>
            
            <!-- En-tête -->
            <header class="mb-8 text-center">
                <div class="inline-flex items-center mb-4">
                    <i class="fas fa-eye text-5xl text-teal-400 mr-4"></i>
                    <h1 class="text-4xl font-black">MODULE VISUELS - CONTRÔLES VISUELS</h1>
                </div>
                <p class="text-xl text-gray-300" id="audit-info">Inspection Visuelle & Défauts Mécaniques</p>
            </header>
            
            <!-- Boutons Actions -->
            <div class="max-w-6xl mx-auto mb-8 space-y-4">
                <button onclick="generateMultiModuleReport()" class="w-full bg-green-600 hover:bg-green-700 px-6 py-4 rounded-lg font-black text-xl">
                    <i class="fas fa-file-pdf mr-2"></i>
                    RAPPORT PDF MULTI-MODULES
                </button>
                <button id="btnAddInspection" class="w-full bg-teal-600 hover:bg-teal-700 px-6 py-4 rounded-lg font-black text-xl">
                    <i class="fas fa-plus-circle mr-2"></i>
                    AJOUTER UNE OBSERVATION
                </button>
            </div>
            
            <!-- Statistiques -->
            <div class="max-w-6xl mx-auto mb-8">
                <div class="grid md:grid-cols-3 gap-4">
                    <div class="bg-gradient-to-br from-teal-900 to-teal-700 rounded-lg p-4 border-2 border-teal-400">
                        <div class="text-center">
                            <p class="text-3xl font-black" id="stat-total">0</p>
                            <p class="text-teal-200">Observations Totales</p>
                        </div>
                    </div>
                    <div class="bg-gradient-to-br from-red-900 to-red-700 rounded-lg p-4 border-2 border-red-400">
                        <div class="text-center">
                            <p class="text-3xl font-black" id="stat-defects">0</p>
                            <p class="text-red-200">Défauts Trouvés</p>
                        </div>
                    </div>
                    <div class="bg-gradient-to-br from-orange-900 to-orange-700 rounded-lg p-4 border-2 border-orange-400">
                        <div class="text-center">
                            <p class="text-3xl font-black" id="stat-critical">0</p>
                            <p class="text-orange-200">Critiques</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Liste observations -->
            <div class="max-w-6xl mx-auto">
                <div class="bg-gray-900 rounded-lg p-6 border-2 border-teal-400">
                    <div class="flex items-center justify-between mb-6">
                        <h2 class="text-2xl font-black">
                            <i class="fas fa-list mr-2 text-teal-400"></i>
                            OBSERVATIONS VISUELLES
                        </h2>
                        <button id="btnGenerateReport" class="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-bold">
                            <i class="fas fa-file-pdf mr-2"></i>
                            Générer Rapport
                        </button>
                    </div>
                    
                    <div id="inspections-list" class="space-y-4">
                        <div class="text-center text-gray-400 py-8">
                            <i class="fas fa-inbox text-4xl mb-4"></i>
                            <p class="text-lg">Aucune observation. Ajoutez vos observations terrain.</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Modal Ajout Observation -->
            <div id="modalInspection" class="fixed inset-0 bg-black bg-opacity-75 hidden items-center justify-center z-50">
                <div class="bg-gray-900 rounded-lg p-8 max-w-2xl w-full mx-4 border-2 border-teal-400 max-h-screen overflow-y-auto">
                    <h3 class="text-2xl font-black mb-6 text-teal-400">
                        <i class="fas fa-plus-circle mr-2"></i>
                        AJOUTER OBSERVATION VISUELLE
                    </h3>
                    
                    <form id="inspectionForm" class="space-y-4">
                        <div>
                            <label class="block font-bold mb-2">Type d'inspection :</label>
                            <select id="inspection-type" class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2">
                                <option value="general">Général</option>
                                <option value="structural">Structurel</option>
                                <option value="electrical">Électrique</option>
                                <option value="mechanical">Mécanique</option>
                            </select>
                        </div>
                        
                        <div class="grid md:grid-cols-2 gap-4">
                            <div>
                                <label class="block font-bold mb-2">String :</label>
                                <input type="number" id="string-number" class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2">
                            </div>
                            <div>
                                <label class="block font-bold mb-2">Module :</label>
                                <input type="number" id="module-number" class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2">
                            </div>
                        </div>
                        
                        <div>
                            <label class="block font-bold mb-2">Localisation :</label>
                            <input type="text" id="location" placeholder="Ex: Rangée 3, Zone Nord" class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2">
                        </div>
                        
                        <div>
                            <label class="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" id="defect-found" class="w-5 h-5">
                                <span class="font-bold text-red-400">Défaut détecté</span>
                            </label>
                        </div>
                        
                        <div id="defect-details" class="hidden space-y-4 bg-gray-800 p-4 rounded border border-red-400">
                            <div>
                                <label class="block font-bold mb-2">Type de défaut :</label>
                                <select id="defect-type" class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2">
                                    <option value="">-- Sélectionner --</option>
                                    <option value="glass_damage">Verre cassé/fissuré</option>
                                    <option value="cell_damage">Cellules endommagées</option>
                                    <option value="delamination">Délamination</option>
                                    <option value="discoloration">Décoloration</option>
                                    <option value="hotspot">Point chaud visible</option>
                                    <option value="junction_box">Boîte de jonction</option>
                                    <option value="frame">Cadre endommagé</option>
                                    <option value="connector">Connecteur MC4</option>
                                    <option value="soiling">Salissure excessive</option>
                                    <option value="other">Autre</option>
                                </select>
                            </div>
                            
                            <div>
                                <label class="block font-bold mb-2">Sévérité :</label>
                                <select id="severity" class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2">
                                    <option value="1">1 - Faible</option>
                                    <option value="2">2 - Moyen</option>
                                    <option value="3">3 - Élevé</option>
                                    <option value="4">4 - Critique</option>
                                </select>
                            </div>
                            
                            <div>
                                <label class="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" id="action-required" class="w-5 h-5">
                                    <span class="font-bold">Action corrective requise</span>
                                </label>
                            </div>
                            
                            <div id="action-details" class="hidden">
                                <label class="block font-bold mb-2">Description action :</label>
                                <textarea id="action-desc" rows="2" class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2"></textarea>
                            </div>
                        </div>
                        
                        <div>
                            <label class="block font-bold mb-2">Notes / Observations :</label>
                            <textarea id="notes" rows="3" class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2"></textarea>
                        </div>
                        
                        <div>
                            <label class="block font-bold mb-2">Photo (URL) :</label>
                            <input type="url" id="photo-url" placeholder="https://..." class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2">
                        </div>
                        
                        <div class="flex gap-4 mt-6">
                            <button type="submit" class="flex-1 bg-teal-600 hover:bg-teal-700 px-6 py-3 rounded-lg font-bold">
                                <i class="fas fa-check mr-2"></i>
                                Enregistrer
                            </button>
                            <button type="button" id="btnCancelInspection" class="flex-1 bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-bold">
                                <i class="fas fa-times mr-2"></i>
                                Annuler
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/module-nav.js"></script>
        <script>
            const auditToken = window.location.pathname.split('/')[2]
            
            // Navigation modules (même que I-V)
            async function loadModuleNav() {
                try {
                    const response = await axios.get(\`/api/audits/\${auditToken}\`)
                    const audit = response.data.audit
                    const modules = JSON.parse(audit.modules_enabled || '[]')
                    
                    document.getElementById('audit-info').textContent = \`\${audit.project_name} - \${audit.client_name}\`
                    
                    const nav = document.getElementById('module-nav')
                    nav.innerHTML = \`
                        <div class="bg-gray-900 rounded-lg p-4 border border-yellow-400 flex flex-wrap gap-3 items-center justify-between">
                            <div class="flex flex-wrap gap-3">
                                \${modules.includes('EL') ? '<a href="/audit/'+auditToken+'" class="bg-green-700 hover:bg-green-600 px-4 py-2 rounded font-bold"><i class="fas fa-moon mr-2"></i>EL</a>' : ''}
                                \${modules.includes('IV') ? '<a href="/audit/'+auditToken+'/iv" class="bg-orange-700 hover:bg-orange-600 px-4 py-2 rounded font-bold"><i class="fas fa-chart-line mr-2"></i>I-V</a>' : ''}
                                \${modules.includes('VISUAL') ? '<a href="/audit/'+auditToken+'/visual" class="bg-teal-700 border-2 border-teal-400 px-4 py-2 rounded font-bold"><i class="fas fa-eye mr-2"></i>Visuels</a>' : ''}
                                \${modules.includes('ISOLATION') ? '<a href="/audit/'+auditToken+'/isolation" class="bg-red-700 hover:bg-red-600 px-4 py-2 rounded font-bold"><i class="fas fa-bolt mr-2"></i>Isolation</a>' : ''}
                            </div>
                            <a href="/crm/dashboard" class="bg-blue-700 hover:bg-blue-600 px-4 py-2 rounded font-bold">
                                <i class="fas fa-home mr-2"></i>Dashboard
                            </a>
                        </div>
                    \`
                } catch (error) {
                    console.error('Erreur:', error)
                }
            }
            
            // Charger observations
            async function loadInspections() {
                try {
                    const response = await axios.get(\`/api/visual/inspections/\${auditToken}\`)
                    const inspections = response.data.inspections || []
                    
                    // Stats
                    document.getElementById('stat-total').textContent = inspections.length
                    const defects = inspections.filter(i => i.defect_found).length
                    document.getElementById('stat-defects').textContent = defects
                    const critical = inspections.filter(i => i.severity_level >= 4).length
                    document.getElementById('stat-critical').textContent = critical
                    
                    // Liste
                    const container = document.getElementById('inspections-list')
                    if (inspections.length === 0) {
                        container.innerHTML = '<div class="text-center text-gray-400 py-8"><i class="fas fa-inbox text-4xl mb-4"></i><p>Aucune observation</p></div>'
                        return
                    }
                    
                    const severityColors = {1: 'blue', 2: 'yellow', 3: 'orange', 4: 'red'}
                    const severityLabels = {1: 'Faible', 2: 'Moyen', 3: 'Élevé', 4: 'Critique'}
                    
                    container.innerHTML = inspections.map(i => \`
                        <div class="bg-gray-800 rounded-lg p-4 border border-\${i.defect_found ? 'red' : 'gray'}-600">
                            <div class="flex items-start justify-between mb-3">
                                <div>
                                    <h4 class="text-lg font-bold text-teal-300">\${i.inspection_type.toUpperCase()}</h4>
                                    <p class="text-sm text-gray-400">\${i.location_description || 'N/A'}</p>
                                    \${i.string_number ? '<p class="text-sm text-orange-400">S'+i.string_number+'-'+i.module_number+'</p>' : ''}
                                </div>
                                <div class="text-right">
                                    \${i.defect_found ? '<span class="bg-red-600 px-3 py-1 rounded text-sm font-bold"><i class="fas fa-exclamation-triangle mr-1"></i>DÉFAUT</span>' : '<span class="bg-green-600 px-3 py-1 rounded text-sm font-bold"><i class="fas fa-check-circle mr-1"></i>OK</span>'}
                                    \${i.severity_level ? '<span class="bg-'+severityColors[i.severity_level]+'-600 px-3 py-1 rounded text-sm font-bold ml-2">'+severityLabels[i.severity_level]+'</span>' : ''}
                                </div>
                            </div>
                            \${i.defect_type ? '<p class="text-sm mb-2"><strong>Type:</strong> '+i.defect_type+'</p>' : ''}
                            \${i.notes ? '<p class="text-sm text-gray-300 mb-2">'+i.notes+'</p>' : ''}
                            \${i.corrective_action_required ? '<p class="text-sm text-orange-400"><i class="fas fa-tools mr-1"></i>Action requise: '+i.corrective_action_description+'</p>' : ''}
                        </div>
                    \`).join('')
                } catch (error) {
                    console.error('Erreur:', error)
                }
            }
            
            // Modal
            document.getElementById('btnAddInspection').addEventListener('click', () => {
                document.getElementById('modalInspection').classList.remove('hidden')
                document.getElementById('modalInspection').classList.add('flex')
            })
            
            document.getElementById('btnCancelInspection').addEventListener('click', () => {
                document.getElementById('modalInspection').classList.add('hidden')
            })
            
            document.getElementById('defect-found').addEventListener('change', (e) => {
                document.getElementById('defect-details').classList.toggle('hidden', !e.target.checked)
            })
            
            document.getElementById('action-required').addEventListener('change', (e) => {
                document.getElementById('action-details').classList.toggle('hidden', !e.target.checked)
            })
            
            document.getElementById('inspectionForm').addEventListener('submit', async (e) => {
                e.preventDefault()
                
                const data = {
                    inspection_type: document.getElementById('inspection-type').value,
                    string_number: parseInt(document.getElementById('string-number').value) || null,
                    module_number: parseInt(document.getElementById('module-number').value) || null,
                    location_description: document.getElementById('location').value,
                    defect_found: document.getElementById('defect-found').checked,
                    defect_type: document.getElementById('defect-type').value || null,
                    severity_level: parseInt(document.getElementById('severity').value) || null,
                    notes: document.getElementById('notes').value,
                    photo_url: document.getElementById('photo-url').value || null,
                    corrective_action_required: document.getElementById('action-required').checked,
                    corrective_action_description: document.getElementById('action-desc').value || null
                }
                
                try {
                    await axios.post(\`/api/visual/inspections/\${auditToken}\`, data)
                    document.getElementById('modalInspection').classList.add('hidden')
                    document.getElementById('inspectionForm').reset()
                    document.getElementById('defect-details').classList.add('hidden')
                    loadInspections()
                } catch (error) {
                    alert('Erreur: ' + (error.response?.data?.error || error.message))
                }
            })
            
            function generateMultiModuleReport() {
                window.open(\`/api/reports/multi-module/\${auditToken}\`, '_blank')
            }
            
            document.getElementById('btnGenerateReport').addEventListener('click', () => {
                window.open(\`/api/visual/report/\${auditToken}\`, '_blank')
            })
            
            // Init
            loadModuleNavigation(auditToken, 'VISUAL')
            loadInspections()
        </script>
    </body>
    </html>
  `
}
