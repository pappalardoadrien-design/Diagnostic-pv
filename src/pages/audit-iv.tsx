// ============================================================================
// PAGE MODULE I-V - COURBES I-V
// ============================================================================
// Interface de saisie et visualisation mesures I-V
// Import CSV PVserv + auto-liaison modules EL
// ============================================================================

export function getAuditIvPage() {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Module I-V - Courbes I-V</title>
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
                    <i class="fas fa-chart-line text-5xl text-orange-400 mr-4"></i>
                    <h1 class="text-4xl font-black">MODULE I-V - COURBES I-V</h1>
                </div>
                <p class="text-xl text-gray-300" id="audit-info">Mesures Électriques & Analyse Performances</p>
            </header>
            
            <!-- Actions -->
            <div class="max-w-6xl mx-auto mb-6">
                <div class="flex gap-4 justify-end mb-4">
                    <button onclick="generateMultiModuleReport()" class="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-black">
                        <i class="fas fa-file-pdf mr-2"></i>
                        RAPPORT PDF MULTI-MODULES
                    </button>
                </div>
            </div>

            <div class="max-w-6xl mx-auto mb-8">
                <div class="bg-gray-900 rounded-lg p-6 border-2 border-orange-400">
                    <h2 class="text-2xl font-black mb-4">
                        <i class="fas fa-upload mr-2 text-orange-400"></i>
                        IMPORTER MESURES I-V
                    </h2>
                    
                    <div class="grid md:grid-cols-2 gap-6">
                        <!-- Import CSV -->
                        <div class="bg-gray-800 rounded-lg p-6 border border-orange-400">
                            <h3 class="text-xl font-bold mb-4 text-orange-300">
                                <i class="fas fa-file-csv mr-2"></i>
                                Import CSV PVserv
                            </h3>
                            <input type="file" id="csvFile" accept=".csv" class="hidden">
                            <button onclick="document.getElementById('csvFile').click()" 
                                    class="w-full bg-orange-600 hover:bg-orange-700 px-6 py-3 rounded-lg font-bold mb-3">
                                <i class="fas fa-upload mr-2"></i>
                                Sélectionner Fichier CSV
                            </button>
                            <p class="text-sm text-gray-400">
                                <i class="fas fa-info-circle mr-1"></i>
                                Format PVserv avec colonnes: String, Module, Isc, Voc, Pmax, etc.
                            </p>
                        </div>
                        
                        <!-- Saisie manuelle -->
                        <div class="bg-gray-800 rounded-lg p-6 border border-gray-600">
                            <h3 class="text-xl font-bold mb-4 text-gray-300">
                                <i class="fas fa-keyboard mr-2"></i>
                                Saisie Manuelle
                            </h3>
                            <button id="btnManualEntry" class="w-full bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-bold mb-3">
                                <i class="fas fa-plus mr-2"></i>
                                Ajouter Mesure Manuelle
                            </button>
                            <p class="text-sm text-gray-400">
                                <i class="fas fa-info-circle mr-1"></i>
                                Saisie unitaire pour corrections ou compléments
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Statistiques -->
            <div class="max-w-6xl mx-auto mb-8">
                <div class="grid md:grid-cols-4 gap-4">
                    <div class="bg-gradient-to-br from-orange-900 to-orange-700 rounded-lg p-4 border-2 border-orange-400">
                        <div class="text-center">
                            <p class="text-3xl font-black" id="stat-total">0</p>
                            <p class="text-orange-200">Mesures Totales</p>
                        </div>
                    </div>
                    <div class="bg-gradient-to-br from-green-900 to-green-700 rounded-lg p-4 border-2 border-green-400">
                        <div class="text-center">
                            <p class="text-3xl font-black" id="stat-linked">0</p>
                            <p class="text-green-200">Liées Module EL</p>
                        </div>
                    </div>
                    <div class="bg-gradient-to-br from-blue-900 to-blue-700 rounded-lg p-4 border-2 border-blue-400">
                        <div class="text-center">
                            <p class="text-3xl font-black" id="stat-avg-pmax">-</p>
                            <p class="text-blue-200">Pmax Moyen (W)</p>
                        </div>
                    </div>
                    <div class="bg-gradient-to-br from-purple-900 to-purple-700 rounded-lg p-4 border-2 border-purple-400">
                        <div class="text-center">
                            <p class="text-3xl font-black" id="stat-strings">0</p>
                            <p class="text-purple-200">Strings Mesurés</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Liste des mesures -->
            <div class="max-w-6xl mx-auto">
                <div class="bg-gray-900 rounded-lg p-6 border-2 border-orange-400">
                    <div class="flex items-center justify-between mb-6">
                        <h2 class="text-2xl font-black">
                            <i class="fas fa-list mr-2 text-orange-400"></i>
                            MESURES I-V
                        </h2>
                        <button id="btnGenerateReport" class="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-bold">
                            <i class="fas fa-file-pdf mr-2"></i>
                            Générer Rapport PDF
                        </button>
                    </div>
                    
                    <div id="measurements-list" class="space-y-2">
                        <div class="text-center text-gray-400 py-8">
                            <i class="fas fa-inbox text-4xl mb-4"></i>
                            <p class="text-lg">Aucune mesure. Importez un fichier CSV ou ajoutez des mesures manuellement.</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Modal Saisie Manuelle -->
            <div id="modalManual" class="fixed inset-0 bg-black bg-opacity-75 hidden items-center justify-center z-50">
                <div class="bg-gray-900 rounded-lg p-8 max-w-2xl w-full mx-4 border-2 border-orange-400">
                    <h3 class="text-2xl font-black mb-6 text-orange-400">
                        <i class="fas fa-plus-circle mr-2"></i>
                        AJOUTER MESURE MANUELLE
                    </h3>
                    
                    <form id="manualForm" class="space-y-4">
                        <div class="grid md:grid-cols-2 gap-4">
                            <div>
                                <label class="block font-bold mb-2">String :</label>
                                <input type="number" id="manual-string" required class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2">
                            </div>
                            <div>
                                <label class="block font-bold mb-2">Module :</label>
                                <input type="number" id="manual-module" required class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2">
                            </div>
                        </div>
                        
                        <div class="grid md:grid-cols-3 gap-4">
                            <div>
                                <label class="block font-bold mb-2">Isc (A) :</label>
                                <input type="number" step="0.01" id="manual-isc" required class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2">
                            </div>
                            <div>
                                <label class="block font-bold mb-2">Voc (V) :</label>
                                <input type="number" step="0.01" id="manual-voc" required class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2">
                            </div>
                            <div>
                                <label class="block font-bold mb-2">Pmax (W) :</label>
                                <input type="number" step="0.01" id="manual-pmax" required class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2">
                            </div>
                        </div>
                        
                        <div class="grid md:grid-cols-2 gap-4">
                            <div>
                                <label class="block font-bold mb-2">Irradiance (W/m²) :</label>
                                <input type="number" step="0.1" id="manual-irradiance" class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2">
                            </div>
                            <div>
                                <label class="block font-bold mb-2">Température (°C) :</label>
                                <input type="number" step="0.1" id="manual-temp" class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2">
                            </div>
                        </div>
                        
                        <div class="flex gap-4 mt-6">
                            <button type="submit" class="flex-1 bg-orange-600 hover:bg-orange-700 px-6 py-3 rounded-lg font-bold">
                                <i class="fas fa-check mr-2"></i>
                                Ajouter
                            </button>
                            <button type="button" id="btnCancelManual" class="flex-1 bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-bold">
                                <i class="fas fa-times mr-2"></i>
                                Annuler
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            const auditToken = window.location.pathname.split('/')[2]
            
            // Charger navigation modules
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
                                \${modules.includes('EL') ? '<a href="/audit/'+auditToken+'" class="bg-green-700 hover:bg-green-600 px-4 py-2 rounded font-bold"><i class="fas fa-moon mr-2"></i>EL Cartographie</a>' : ''}
                                \${modules.includes('IV') ? '<a href="/audit/'+auditToken+'/iv" class="bg-orange-700 border-2 border-orange-400 px-4 py-2 rounded font-bold"><i class="fas fa-chart-line mr-2"></i>I-V Courbes</a>' : ''}
                                \${modules.includes('VISUAL') ? '<a href="/audit/'+auditToken+'/visual" class="bg-teal-700 hover:bg-teal-600 px-4 py-2 rounded font-bold"><i class="fas fa-eye mr-2"></i>Visuels</a>' : ''}
                                \${modules.includes('ISOLATION') ? '<a href="/audit/'+auditToken+'/isolation" class="bg-red-700 hover:bg-red-600 px-4 py-2 rounded font-bold"><i class="fas fa-bolt mr-2"></i>Isolation</a>' : ''}
                            </div>
                            <a href="/crm/dashboard" class="bg-blue-700 hover:bg-blue-600 px-4 py-2 rounded font-bold">
                                <i class="fas fa-home mr-2"></i>Dashboard
                            </a>
                        </div>
                    \`
                } catch (error) {
                    console.error('Erreur chargement navigation:', error)
                }
            }
            
            // Charger mesures
            async function loadMeasurements() {
                try {
                    const response = await axios.get(\`/api/iv/measurements/\${auditToken}\`)
                    const measurements = response.data.measurements || []
                    
                    // Stats
                    document.getElementById('stat-total').textContent = measurements.length
                    const linked = measurements.filter(m => m.module_identifier).length
                    document.getElementById('stat-linked').textContent = linked
                    
                    if (measurements.length > 0) {
                        const avgPmax = measurements.reduce((sum, m) => sum + (m.pmax || 0), 0) / measurements.length
                        document.getElementById('stat-avg-pmax').textContent = avgPmax.toFixed(1)
                        
                        const strings = new Set(measurements.map(m => m.string_number)).size
                        document.getElementById('stat-strings').textContent = strings
                    }
                    
                    // Liste
                    const container = document.getElementById('measurements-list')
                    if (measurements.length === 0) {
                        container.innerHTML = \`
                            <div class="text-center text-gray-400 py-8">
                                <i class="fas fa-inbox text-4xl mb-4"></i>
                                <p class="text-lg">Aucune mesure</p>
                            </div>
                        \`
                        return
                    }
                    
                    container.innerHTML = measurements.map(m => \`
                        <div class="bg-gray-800 rounded p-4 border border-gray-700 flex items-center justify-between">
                            <div class="flex-1 grid grid-cols-5 gap-4">
                                <div>
                                    <p class="text-sm text-gray-400">Module</p>
                                    <p class="font-bold text-orange-400">\${m.module_identifier || 'S'+m.string_number+'-'+m.module_number}</p>
                                </div>
                                <div>
                                    <p class="text-sm text-gray-400">Isc</p>
                                    <p class="font-bold">\${m.isc?.toFixed(2) || '-'} A</p>
                                </div>
                                <div>
                                    <p class="text-sm text-gray-400">Voc</p>
                                    <p class="font-bold">\${m.voc?.toFixed(2) || '-'} V</p>
                                </div>
                                <div>
                                    <p class="text-sm text-gray-400">Pmax</p>
                                    <p class="font-bold text-green-400">\${m.pmax?.toFixed(1) || '-'} W</p>
                                </div>
                                <div>
                                    <p class="text-sm text-gray-400">FF</p>
                                    <p class="font-bold">\${m.fill_factor?.toFixed(3) || '-'}</p>
                                </div>
                            </div>
                            <div>
                                \${m.module_identifier ? '<span class="bg-green-600 px-2 py-1 rounded text-xs"><i class="fas fa-link mr-1"></i>Lié EL</span>' : '<span class="bg-gray-600 px-2 py-1 rounded text-xs">Non lié</span>'}
                            </div>
                        </div>
                    \`).join('')
                    
                } catch (error) {
                    console.error('Erreur chargement mesures:', error)
                }
            }
            
            // Import CSV
            document.getElementById('csvFile').addEventListener('change', async (e) => {
                const file = e.target.files[0]
                if (!file) return
                
                const formData = new FormData()
                formData.append('csv', file)
                
                try {
                    const response = await axios.post(\`/api/iv/measurements/\${auditToken}\`, formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    })
                    
                    alert(\`Import réussi: \${response.data.imported} mesures importées, \${response.data.linked} liées aux modules EL\`)
                    loadMeasurements()
                } catch (error) {
                    alert('Erreur import: ' + (error.response?.data?.error || error.message))
                }
            })
            
            // Modal saisie manuelle
            document.getElementById('btnManualEntry').addEventListener('click', () => {
                document.getElementById('modalManual').classList.remove('hidden')
                document.getElementById('modalManual').classList.add('flex')
            })
            
            document.getElementById('btnCancelManual').addEventListener('click', () => {
                document.getElementById('modalManual').classList.add('hidden')
            })
            
            document.getElementById('manualForm').addEventListener('submit', async (e) => {
                e.preventDefault()
                
                const data = {
                    string_number: parseInt(document.getElementById('manual-string').value),
                    module_number: parseInt(document.getElementById('manual-module').value),
                    isc: parseFloat(document.getElementById('manual-isc').value),
                    voc: parseFloat(document.getElementById('manual-voc').value),
                    pmax: parseFloat(document.getElementById('manual-pmax').value),
                    irradiance: parseFloat(document.getElementById('manual-irradiance').value) || null,
                    temperature_module: parseFloat(document.getElementById('manual-temp').value) || null
                }
                
                try {
                    await axios.post(\`/api/iv/measurements/\${auditToken}/manual\`, data)
                    document.getElementById('modalManual').classList.add('hidden')
                    document.getElementById('manualForm').reset()
                    loadMeasurements()
                } catch (error) {
                    alert('Erreur ajout: ' + (error.response?.data?.error || error.message))
                }
            })
            
            // Générer rapport multi-modules
            function generateMultiModuleReport() {
                window.open(\`/api/reports/multi-module/\${auditToken}\`, '_blank')
            }
            
            // Générer rapport
            document.getElementById('btnGenerateReport').addEventListener('click', () => {
                window.open(\`/api/iv/report/\${auditToken}\`, '_blank')
            })
            
            // Init
            loadModuleNav()
            loadMeasurements()
        </script>
    </body>
    </html>
  `
}
