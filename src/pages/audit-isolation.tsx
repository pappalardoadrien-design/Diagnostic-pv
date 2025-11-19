// ============================================================================
// PAGE MODULE ISOLATION - TESTS D'ISOLATION
// ============================================================================
// Interface de saisie tests isolation DC/AC
// Mesures résistance + conformité seuils
// ============================================================================

export function getAuditIsolationPage() {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Module Isolation - Tests d'Isolation</title>
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
                    <i class="fas fa-bolt text-5xl text-red-400 mr-4"></i>
                    <h1 class="text-4xl font-black">MODULE ISOLATION - TESTS D'ISOLATION</h1>
                </div>
                <p class="text-xl text-gray-300" id="audit-info">Mesures Résistance Isolation & Défauts Électriques</p>
            </header>
            
            <!-- Bouton Ajout -->
            <div class="max-w-6xl mx-auto mb-8">
                <button id="btnAddTest" class="w-full bg-red-600 hover:bg-red-700 px-6 py-4 rounded-lg font-black text-xl">
                    <i class="fas fa-plus-circle mr-2"></i>
                    AJOUTER UN TEST D'ISOLATION
                </button>
            </div>
            
            <!-- Statistiques -->
            <div class="max-w-6xl mx-auto mb-8">
                <div class="grid md:grid-cols-4 gap-4">
                    <div class="bg-gradient-to-br from-red-900 to-red-700 rounded-lg p-4 border-2 border-red-400">
                        <div class="text-center">
                            <p class="text-3xl font-black" id="stat-total">0</p>
                            <p class="text-red-200">Tests Totaux</p>
                        </div>
                    </div>
                    <div class="bg-gradient-to-br from-green-900 to-green-700 rounded-lg p-4 border-2 border-green-400">
                        <div class="text-center">
                            <p class="text-3xl font-black" id="stat-pass">0</p>
                            <p class="text-green-200">Conformes</p>
                        </div>
                    </div>
                    <div class="bg-gradient-to-br from-orange-900 to-orange-700 rounded-lg p-4 border-2 border-orange-400">
                        <div class="text-center">
                            <p class="text-3xl font-black" id="stat-fail">0</p>
                            <p class="text-orange-200">Non Conformes</p>
                        </div>
                    </div>
                    <div class="bg-gradient-to-br from-blue-900 to-blue-700 rounded-lg p-4 border-2 border-blue-400">
                        <div class="text-center">
                            <p class="text-3xl font-black" id="stat-avg">-</p>
                            <p class="text-blue-200">Moy. (MΩ)</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Liste tests -->
            <div class="max-w-6xl mx-auto">
                <div class="bg-gray-900 rounded-lg p-6 border-2 border-red-400">
                    <div class="flex items-center justify-between mb-6">
                        <h2 class="text-2xl font-black">
                            <i class="fas fa-list mr-2 text-red-400"></i>
                            TESTS D'ISOLATION
                        </h2>
                        <button id="btnGenerateReport" class="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-bold">
                            <i class="fas fa-file-pdf mr-2"></i>
                            Générer Rapport
                        </button>
                    </div>
                    
                    <div id="tests-list" class="space-y-4">
                        <div class="text-center text-gray-400 py-8">
                            <i class="fas fa-inbox text-4xl mb-4"></i>
                            <p class="text-lg">Aucun test. Ajoutez vos mesures d'isolation.</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Modal Ajout Test -->
            <div id="modalTest" class="fixed inset-0 bg-black bg-opacity-75 hidden items-center justify-center z-50">
                <div class="bg-gray-900 rounded-lg p-8 max-w-2xl w-full mx-4 border-2 border-red-400">
                    <h3 class="text-2xl font-black mb-6 text-red-400">
                        <i class="fas fa-plus-circle mr-2"></i>
                        AJOUTER TEST D'ISOLATION
                    </h3>
                    
                    <form id="testForm" class="space-y-4">
                        <div>
                            <label class="block font-bold mb-2">Type de test :</label>
                            <select id="test-type" class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2">
                                <option value="DC">DC - Isolement côté continu</option>
                                <option value="AC">AC - Isolement côté alternatif</option>
                                <option value="Earth">Terre - Continuité masse</option>
                            </select>
                        </div>
                        
                        <div class="grid md:grid-cols-2 gap-4">
                            <div>
                                <label class="block font-bold mb-2">Tension test (V) :</label>
                                <input type="number" step="0.1" id="voltage" required placeholder="Ex: 500" class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2">
                            </div>
                            <div>
                                <label class="block font-bold mb-2">Résistance mesurée (MΩ) :</label>
                                <input type="number" step="0.01" id="resistance" required placeholder="Ex: 250.5" class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2">
                            </div>
                        </div>
                        
                        <div>
                            <label class="block font-bold mb-2">Seuil minimum requis (MΩ) :</label>
                            <input type="number" step="0.01" id="threshold" placeholder="Ex: 1 (défaut selon NF C 15-100)" class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2">
                            <p class="text-sm text-gray-400 mt-1">
                                <i class="fas fa-info-circle mr-1"></i>
                                NF C 15-100: Min 1 MΩ (recommandé ≥ 50 MΩ)
                            </p>
                        </div>
                        
                        <div class="grid md:grid-cols-2 gap-4">
                            <div>
                                <label class="block font-bold mb-2">Température (°C) :</label>
                                <input type="number" step="0.1" id="temperature" placeholder="Ex: 25" class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2">
                            </div>
                            <div>
                                <label class="block font-bold mb-2">Humidité (%) :</label>
                                <input type="number" step="0.1" id="humidity" placeholder="Ex: 65" class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2">
                            </div>
                        </div>
                        
                        <div>
                            <label class="block font-bold mb-2">Notes :</label>
                            <textarea id="notes" rows="3" placeholder="Observations, conditions de mesure..." class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2"></textarea>
                        </div>
                        
                        <div class="flex gap-4 mt-6">
                            <button type="submit" class="flex-1 bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-bold">
                                <i class="fas fa-check mr-2"></i>
                                Enregistrer
                            </button>
                            <button type="button" id="btnCancelTest" class="flex-1 bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-bold">
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
            
            // Charger tests
            async function loadTests() {
                try {
                    const response = await axios.get(\`/api/isolation/tests/\${auditToken}\`)
                    const tests = response.data.tests || []
                    
                    // Stats
                    document.getElementById('stat-total').textContent = tests.length
                    
                    if (tests.length > 0) {
                        const avgResistance = tests.reduce((sum, t) => sum + (t.resistance || 0), 0) / tests.length
                        document.getElementById('stat-avg').textContent = avgResistance.toFixed(2)
                        
                        // Calcul conformité (résistance >= seuil)
                        const pass = tests.filter(t => !t.pass_threshold || t.resistance >= t.pass_threshold).length
                        const fail = tests.length - pass
                        document.getElementById('stat-pass').textContent = pass
                        document.getElementById('stat-fail').textContent = fail
                    }
                    
                    // Liste
                    const container = document.getElementById('tests-list')
                    if (tests.length === 0) {
                        container.innerHTML = '<div class="text-center text-gray-400 py-8"><i class="fas fa-inbox text-4xl mb-4"></i><p>Aucun test</p></div>'
                        return
                    }
                    
                    const testTypeLabels = {DC: 'DC - Isolement côté continu', AC: 'AC - Isolement côté alternatif', Earth: 'Terre - Continuité'}
                    
                    container.innerHTML = tests.map(t => {
                        const threshold = t.pass_threshold || 1
                        const pass = t.resistance >= threshold
                        
                        return \`
                            <div class="bg-gray-800 rounded-lg p-4 border border-\${pass ? 'green' : 'red'}-600">
                                <div class="flex items-start justify-between mb-3">
                                    <div>
                                        <h4 class="text-lg font-bold text-red-300">\${testTypeLabels[t.test_type] || t.test_type}</h4>
                                        <p class="text-sm text-gray-400">\${new Date(t.test_date).toLocaleDateString('fr-FR')}</p>
                                    </div>
                                    <div>
                                        \${pass ? '<span class="bg-green-600 px-3 py-1 rounded font-bold"><i class="fas fa-check-circle mr-1"></i>CONFORME</span>' : '<span class="bg-red-600 px-3 py-1 rounded font-bold"><i class="fas fa-times-circle mr-1"></i>NON CONFORME</span>'}
                                    </div>
                                </div>
                                
                                <div class="grid grid-cols-4 gap-4 mb-3">
                                    <div>
                                        <p class="text-sm text-gray-400">Tension</p>
                                        <p class="font-bold">\${t.voltage || '-'} V</p>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-400">Résistance</p>
                                        <p class="font-bold text-\${pass ? 'green' : 'red'}-400">\${t.resistance?.toFixed(2) || '-'} MΩ</p>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-400">Seuil</p>
                                        <p class="font-bold">\${threshold} MΩ</p>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-400">Conditions</p>
                                        <p class="font-bold text-sm">\${t.temperature ? t.temperature+'°C' : ''} \${t.humidity ? t.humidity+'%' : ''}</p>
                                    </div>
                                </div>
                                
                                \${t.notes ? '<p class="text-sm text-gray-300 bg-gray-900 p-2 rounded">'+t.notes+'</p>' : ''}
                            </div>
                        \`
                    }).join('')
                } catch (error) {
                    console.error('Erreur:', error)
                }
            }
            
            // Modal
            document.getElementById('btnAddTest').addEventListener('click', () => {
                document.getElementById('modalTest').classList.remove('hidden')
                document.getElementById('modalTest').classList.add('flex')
            })
            
            document.getElementById('btnCancelTest').addEventListener('click', () => {
                document.getElementById('modalTest').classList.add('hidden')
            })
            
            document.getElementById('testForm').addEventListener('submit', async (e) => {
                e.preventDefault()
                
                const data = {
                    test_type: document.getElementById('test-type').value,
                    voltage: parseFloat(document.getElementById('voltage').value),
                    resistance: parseFloat(document.getElementById('resistance').value),
                    pass_threshold: parseFloat(document.getElementById('threshold').value) || 1,
                    temperature: parseFloat(document.getElementById('temperature').value) || null,
                    humidity: parseFloat(document.getElementById('humidity').value) || null,
                    notes: document.getElementById('notes').value || null
                }
                
                try {
                    await axios.post(\`/api/isolation/tests/\${auditToken}\`, data)
                    document.getElementById('modalTest').classList.add('hidden')
                    document.getElementById('testForm').reset()
                    loadTests()
                } catch (error) {
                    alert('Erreur: ' + (error.response?.data?.error || error.message))
                }
            })
            
            document.getElementById('btnGenerateReport').addEventListener('click', () => {
                window.open(\`/api/isolation/report/\${auditToken}\`, '_blank')
            })
            
            // Init
            loadModuleNavigation(auditToken, 'ISOLATION')
            loadTests()
        </script>
    </body>
    </html>
  `
}
