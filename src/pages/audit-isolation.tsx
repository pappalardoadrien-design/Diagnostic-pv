// ============================================================================
// PAGE MODULE ISOLATION - TESTS D'ISOLATION
// ============================================================================
// Interface de saisie tests d'isolation DC/AC/Terre
// Mesures résistance + seuils automatiques
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
                <div class="grid md:grid-cols-3 gap-4">
                    <button onclick="addTest('DC')" class="bg-red-600 hover:bg-red-700 px-6 py-4 rounded-lg font-black text-xl">
                        <i class="fas fa-plus-circle mr-2"></i>
                        TEST DC
                    </button>
                    <button onclick="addTest('AC')" class="bg-orange-600 hover:bg-orange-700 px-6 py-4 rounded-lg font-black text-xl">
                        <i class="fas fa-plus-circle mr-2"></i>
                        TEST AC
                    </button>
                    <button onclick="addTest('Earth')" class="bg-yellow-600 hover:bg-yellow-700 px-6 py-4 rounded-lg font-black text-xl">
                        <i class="fas fa-plus-circle mr-2"></i>
                        TEST TERRE
                    </button>
                </div>
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
                            <p class="text-blue-200">Résistance Moy. (MΩ)</p>
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
                            <p class="text-lg">Aucun test. Ajoutez vos mesures terrain.</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Modal Ajout Test -->
            <div id="modalTest" class="fixed inset-0 bg-black bg-opacity-75 hidden items-center justify-center z-50">
                <div class="bg-gray-900 rounded-lg p-8 max-w-2xl w-full mx-4 border-2 border-red-400">
                    <h3 class="text-2xl font-black mb-6 text-red-400">
                        <i class="fas fa-plus-circle mr-2"></i>
                        AJOUTER TEST ISOLATION <span id="modal-test-type"></span>
                    </h3>
                    
                    <form id="testForm" class="space-y-4">
                        <input type="hidden" id="test-type">
                        
                        <div class="grid md:grid-cols-2 gap-4">
                            <div>
                                <label class="block font-bold mb-2">Tension test (V) :</label>
                                <input type="number" step="0.1" id="voltage" required class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2">
                                <p class="text-xs text-gray-400 mt-1">Ex: 500V, 1000V</p>
                            </div>
                            <div>
                                <label class="block font-bold mb-2">Résistance (MΩ) :</label>
                                <input type="number" step="0.01" id="resistance" required class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2">
                            </div>
                        </div>
                        
                        <div class="grid md:grid-cols-2 gap-4">
                            <div>
                                <label class="block font-bold mb-2">Seuil minimum (MΩ) :</label>
                                <input type="number" step="0.1" id="threshold" value="1.0" class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2">
                                <p class="text-xs text-gray-400 mt-1">NF C 15-100: ≥1 MΩ</p>
                            </div>
                            <div>
                                <label class="block font-bold mb-2">Résultat :</label>
                                <select id="pass-result" class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2">
                                    <option value="1" selected>✓ Conforme</option>
                                    <option value="0">✗ Non Conforme</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="grid md:grid-cols-2 gap-4">
                            <div>
                                <label class="block font-bold mb-2">Température (°C) :</label>
                                <input type="number" step="0.1" id="temperature" class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2">
                            </div>
                            <div>
                                <label class="block font-bold mb-2">Humidité (%) :</label>
                                <input type="number" step="0.1" id="humidity" class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2">
                            </div>
                        </div>
                        
                        <div>
                            <label class="block font-bold mb-2">Notes / Observations :</label>
                            <textarea id="notes" rows="3" class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2"></textarea>
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
        <script>
            const auditToken = window.location.pathname.split('/')[2]
            
            // Navigation modules
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
                                \${modules.includes('VISUAL') ? '<a href="/audit/'+auditToken+'/visual" class="bg-teal-700 hover:bg-teal-600 px-4 py-2 rounded font-bold"><i class="fas fa-eye mr-2"></i>Visuels</a>' : ''}
                                \${modules.includes('ISOLATION') ? '<a href="/audit/'+auditToken+'/isolation" class="bg-red-700 border-2 border-red-400 px-4 py-2 rounded font-bold"><i class="fas fa-bolt mr-2"></i>Isolation</a>' : ''}
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
            
            // Charger tests
            async function loadTests() {
                try {
                    const response = await axios.get(\`/api/isolation/tests/\${auditToken}\`)
                    const tests = response.data.tests || []
                    
                    // Stats
                    document.getElementById('stat-total').textContent = tests.length
                    const pass = tests.filter(t => t.resistance >= (t.pass_threshold || 1)).length
                    document.getElementById('stat-pass').textContent = pass
                    document.getElementById('stat-fail').textContent = tests.length - pass
                    
                    if (tests.length > 0) {
                        const avgRes = tests.reduce((sum, t) => sum + (t.resistance || 0), 0) / tests.length
                        document.getElementById('stat-avg').textContent = avgRes.toFixed(2)
                    }
                    
                    // Liste
                    const container = document.getElementById('tests-list')
                    if (tests.length === 0) {
                        container.innerHTML = '<div class="text-center text-gray-400 py-8"><i class="fas fa-inbox text-4xl mb-4"></i><p>Aucun test</p></div>'
                        return
                    }
                    
                    const typeColors = {DC: 'red', AC: 'orange', Earth: 'yellow'}
                    const typeIcons = {DC: 'bolt', AC: 'plug', Earth: 'ground'}
                    
                    container.innerHTML = tests.map(t => {
                        const isPass = t.resistance >= (t.pass_threshold || 1)
                        return \`
                            <div class="bg-gray-800 rounded-lg p-4 border border-\${isPass ? 'green' : 'red'}-600">
                                <div class="flex items-center justify-between mb-3">
                                    <div class="flex items-center gap-3">
                                        <i class="fas fa-\${typeIcons[t.test_type]} text-2xl text-\${typeColors[t.test_type]}-400"></i>
                                        <div>
                                            <h4 class="text-lg font-bold">TEST \${t.test_type}</h4>
                                            <p class="text-sm text-gray-400">\${new Date(t.test_date).toLocaleDateString('fr-FR')}</p>
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        \${isPass ? 
                                            '<span class="bg-green-600 px-4 py-2 rounded font-bold"><i class="fas fa-check-circle mr-1"></i>CONFORME</span>' : 
                                            '<span class="bg-red-600 px-4 py-2 rounded font-bold"><i class="fas fa-exclamation-triangle mr-1"></i>NON CONFORME</span>'
                                        }
                                    </div>
                                </div>
                                <div class="grid grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <p class="text-gray-400">Tension</p>
                                        <p class="font-bold">\${t.voltage || '-'} V</p>
                                    </div>
                                    <div>
                                        <p class="text-gray-400">Résistance</p>
                                        <p class="font-bold text-\${isPass ? 'green' : 'red'}-400">\${t.resistance?.toFixed(2) || '-'} MΩ</p>
                                    </div>
                                    <div>
                                        <p class="text-gray-400">Seuil</p>
                                        <p class="font-bold">\${t.pass_threshold?.toFixed(1) || '1.0'} MΩ</p>
                                    </div>
                                    <div>
                                        <p class="text-gray-400">Conditions</p>
                                        <p class="font-bold">\${t.temperature ? t.temperature+'°C' : '-'} / \${t.humidity ? t.humidity+'%' : '-'}</p>
                                    </div>
                                </div>
                                \${t.notes ? '<p class="text-sm text-gray-300 mt-3 border-t border-gray-700 pt-3">'+t.notes+'</p>' : ''}
                            </div>
                        \`
                    }).join('')
                } catch (error) {
                    console.error('Erreur:', error)
                }
            }
            
            // Modal
            window.addTest = function(type) {
                document.getElementById('test-type').value = type
                document.getElementById('modal-test-type').textContent = type
                document.getElementById('modalTest').classList.remove('hidden')
                document.getElementById('modalTest').classList.add('flex')
            }
            
            document.getElementById('btnCancelTest').addEventListener('click', () => {
                document.getElementById('modalTest').classList.add('hidden')
            })
            
            // Auto-calcul conformité
            document.getElementById('resistance').addEventListener('input', () => {
                const res = parseFloat(document.getElementById('resistance').value)
                const threshold = parseFloat(document.getElementById('threshold').value)
                if (res && threshold) {
                    document.getElementById('pass-result').value = res >= threshold ? '1' : '0'
                }
            })
            
            document.getElementById('testForm').addEventListener('submit', async (e) => {
                e.preventDefault()
                
                const data = {
                    test_type: document.getElementById('test-type').value,
                    voltage: parseFloat(document.getElementById('voltage').value),
                    resistance: parseFloat(document.getElementById('resistance').value),
                    pass_threshold: parseFloat(document.getElementById('threshold').value),
                    temperature: parseFloat(document.getElementById('temperature').value) || null,
                    humidity: parseFloat(document.getElementById('humidity').value) || null,
                    notes: document.getElementById('notes').value
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
            loadModuleNav()
            loadTests()
        </script>
    </body>
    </html>
  `
}
