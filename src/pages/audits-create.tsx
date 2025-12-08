// ============================================================================
// PAGE CRÉATION AUDIT MULTI-MODULES - VERSION CORRIGÉE
// ============================================================================
// Formulaire de création avec 3 options :
// - Option A : Depuis intervention existante (hérite config PV)
// - Option B : Saisie manuelle simple (strings uniformes)
// - Option C : Configuration avancée (strings inégaux)
// Sélection des modules à activer : EL, I-V, Visuels, Isolation
// ============================================================================

export function getAuditsCreatePage() {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Créer Audit Multi-Modules - Diagnostic PV</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/diagpv-styles.css" rel="stylesheet">
    </head>
    <body class="bg-black text-white min-h-screen font-bold">
        <div class="container mx-auto p-6">
            <!-- En-tête -->
            <div class="mb-6">
                <a href="/crm/dashboard" class="inline-flex items-center text-yellow-400 hover:text-yellow-300 text-lg">
                    <i class="fas fa-arrow-left mr-2"></i>
                    Retour au Dashboard
                </a>
            </div>
            
            <header class="mb-8 text-center">
                <div class="inline-flex items-center mb-4">
                    <i class="fas fa-plus-circle text-5xl text-green-400 mr-4"></i>
                    <h1 class="text-4xl font-black">CRÉER NOUVEL AUDIT</h1>
                </div>
                <p class="text-xl text-gray-300">Audit Multi-Modules Personnalisé</p>
            </header>
            
            <div class="max-w-4xl mx-auto">
                <!-- Sélection du mode -->
                <div class="bg-gray-900 rounded-lg p-6 border-2 border-yellow-400 mb-8">
                    <h2 class="text-2xl font-black mb-6 text-center">
                        <i class="fas fa-cog mr-2 text-yellow-400"></i>
                        MODE DE CRÉATION
                    </h2>
                    
                    <div class="grid md:grid-cols-3 gap-6">
                        <button id="btn-mode-intervention" class="mode-btn active bg-gradient-to-br from-purple-900 to-purple-700 rounded-lg p-8 border-4 border-purple-400 hover:scale-105 transition-transform duration-200 shadow-2xl">
                            <i class="fas fa-calendar-check text-5xl text-purple-200 mb-4"></i>
                            <h3 class="text-2xl font-black mb-2">DEPUIS INTERVENTION</h3>
                            <p class="text-purple-200">Hérite automatiquement la config PV du site</p>
                        </button>
                        
                        <button id="btn-mode-manual" class="mode-btn bg-gradient-to-br from-gray-800 to-gray-700 rounded-lg p-8 border-4 border-gray-600 hover:scale-105 transition-transform duration-200 opacity-75">
                            <i class="fas fa-keyboard text-5xl text-gray-400 mb-4"></i>
                            <h3 class="text-2xl font-black mb-2">SAISIE SIMPLE</h3>
                            <p class="text-gray-400">Configuration uniforme</p>
                        </button>
                        
                        <button id="btn-mode-advanced" class="mode-btn bg-gradient-to-br from-gray-800 to-gray-700 rounded-lg p-8 border-4 border-gray-600 hover:scale-105 transition-transform duration-200 opacity-75">
                            <i class="fas fa-cogs text-5xl text-gray-400 mb-4"></i>
                            <h3 class="text-2xl font-black mb-2">CONFIG AVANCÉE</h3>
                            <p class="text-gray-400">Strings non uniformes</p>
                        </button>
                    </div>
                </div>
                
                <!-- Formulaire -->
                <form id="createAuditForm" class="space-y-8">
                    <!-- OPTION A : Depuis intervention -->
                    <div id="form-intervention" class="bg-gray-900 rounded-lg p-6 border-2 border-purple-400">
                        <h3 class="text-xl font-black mb-4 text-purple-400">
                            <i class="fas fa-calendar-check mr-2"></i>
                            SÉLECTIONNER UNE INTERVENTION
                        </h3>
                        
                        <div>
                            <label class="block text-lg font-bold mb-2">Intervention :</label>
                            <select id="intervention_id" class="w-full bg-black border-2 border-gray-600 rounded-lg px-4 py-3 text-lg focus:border-purple-400 focus:outline-none">
                                <option value="">Chargement...</option>
                            </select>
                            <p class="text-sm text-gray-400 mt-2">
                                <i class="fas fa-info-circle mr-1"></i>
                                La configuration PV sera automatiquement héritée
                            </p>
                        </div>
                    </div>
                    
                    <!-- OPTION B : Saisie manuelle simple -->
                    <div id="form-manual" class="bg-gray-900 rounded-lg p-6 border-2 border-gray-600 hidden">
                        <h3 class="text-xl font-black mb-4 text-gray-400">
                            <i class="fas fa-keyboard mr-2"></i>
                            SAISIE SIMPLE (Strings uniformes)
                        </h3>
                        
                        <div class="space-y-4">
                            <div class="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-lg font-bold mb-2">Nom du projet :</label>
                                    <input type="text" id="project_name" class="w-full bg-black border-2 border-gray-600 rounded-lg px-4 py-3 text-lg focus:border-yellow-400 focus:outline-none" placeholder="Ex: Centrale PV Toulouse">
                                </div>
                                <div>
                                    <label class="block text-lg font-bold mb-2">Client :</label>
                                    <input type="text" id="client_name" class="w-full bg-black border-2 border-gray-600 rounded-lg px-4 py-3 text-lg focus:border-yellow-400 focus:outline-none" placeholder="Ex: Engie">
                                </div>
                            </div>
                            
                            <div>
                                <label class="block text-lg font-bold mb-2">Localisation :</label>
                                <input type="text" id="location" class="w-full bg-black border-2 border-gray-600 rounded-lg px-4 py-3 text-lg focus:border-yellow-400 focus:outline-none" placeholder="Ex: 31000 Toulouse">
                            </div>
                            
                            <div class="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-lg font-bold mb-2">Nombre de strings :</label>
                                    <input type="number" id="stringCount" min="1" class="w-full bg-black border-2 border-gray-600 rounded-lg px-4 py-3 text-lg focus:border-yellow-400 focus:outline-none" placeholder="Ex: 10">
                                </div>
                                <div>
                                    <label class="block text-lg font-bold mb-2">Modules par string :</label>
                                    <input type="number" id="modulesPerString" min="1" class="w-full bg-black border-2 border-gray-600 rounded-lg px-4 py-3 text-lg focus:border-yellow-400 focus:outline-none" placeholder="Ex: 20">
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- OPTION C : Configuration avancée (strings non uniformes) -->
                    <div id="form-advanced" class="bg-gray-900 rounded-lg p-6 border-2 border-gray-600 hidden">
                        <h3 class="text-xl font-black mb-4 text-yellow-400">
                            <i class="fas fa-cogs mr-2"></i>
                            CONFIGURATION AVANCÉE (Strings non uniformes)
                        </h3>
                        
                        <div class="space-y-4">
                            <div class="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-lg font-bold mb-2">Nom du projet :</label>
                                    <input type="text" id="project_name_adv" class="w-full bg-black border-2 border-gray-600 rounded-lg px-4 py-3 text-lg focus:border-yellow-400 focus:outline-none" placeholder="Ex: Centrale PV Toulouse">
                                </div>
                                <div>
                                    <label class="block text-lg font-bold mb-2">Client :</label>
                                    <input type="text" id="client_name_adv" class="w-full bg-black border-2 border-gray-600 rounded-lg px-4 py-3 text-lg focus:border-yellow-400 focus:outline-none" placeholder="Ex: Engie">
                                </div>
                            </div>
                            
                            <div>
                                <label class="block text-lg font-bold mb-2">Localisation :</label>
                                <input type="text" id="location_adv" class="w-full bg-black border-2 border-gray-600 rounded-lg px-4 py-3 text-lg focus:border-yellow-400 focus:outline-none" placeholder="Ex: 31000 Toulouse">
                            </div>
                            
                            <div class="border-2 border-yellow-400 rounded-lg p-4 bg-black">
                                <div class="flex items-center justify-between mb-4">
                                    <h4 class="text-lg font-black text-yellow-400">
                                        <i class="fas fa-list mr-2"></i>
                                        CONFIGURATION DES STRINGS
                                    </h4>
                                    <button type="button" id="addStringBtn" class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-bold">
                                        <i class="fas fa-plus mr-1"></i> Ajouter String
                                    </button>
                                </div>
                                
                                <div id="stringsContainer" class="space-y-3">
                                    <!-- Les strings seront ajoutées ici dynamiquement -->
                                </div>
                                
                                <div class="mt-4 p-3 bg-green-900 border border-green-400 rounded-lg">
                                    <div class="flex items-center justify-between">
                                        <span class="font-bold text-green-400">TOTAL MODULES :</span>
                                        <span id="totalModulesCount" class="text-2xl font-black text-green-400">0</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Sélection des modules -->
                    <div class="bg-gray-900 rounded-lg p-6 border-2 border-green-400">
                        <h3 class="text-xl font-black mb-4 text-green-400">
                            <i class="fas fa-th mr-2"></i>
                            MODULES À ACTIVER
                        </h3>
                        
                        <div class="grid md:grid-cols-2 gap-4">
                            <label class="module-checkbox cursor-pointer">
                                <input type="checkbox" name="modules" value="EL" checked class="hidden peer">
                                <div class="peer-checked:bg-green-900 peer-checked:border-green-400 bg-gray-800 border-2 border-gray-600 rounded-lg p-4 hover:border-green-400 transition-colors">
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center gap-3">
                                            <i class="fas fa-moon text-3xl text-green-400"></i>
                                            <div>
                                                <p class="text-lg font-black">EL - Électroluminescence</p>
                                                <p class="text-sm text-gray-400">Audit nocturne + Cartographie</p>
                                            </div>
                                        </div>
                                        <i class="fas fa-check-circle text-2xl text-green-400 peer-checked:block hidden"></i>
                                    </div>
                                </div>
                            </label>
                            
                            <label class="module-checkbox cursor-pointer">
                                <input type="checkbox" name="modules" value="IV" class="hidden peer">
                                <div class="peer-checked:bg-orange-900 peer-checked:border-orange-400 bg-gray-800 border-2 border-gray-600 rounded-lg p-4 hover:border-orange-400 transition-colors">
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center gap-3">
                                            <i class="fas fa-chart-line text-3xl text-orange-400"></i>
                                            <div>
                                                <p class="text-lg font-black">I-V - Courbes I-V</p>
                                                <p class="text-sm text-gray-400">Mesures électriques</p>
                                            </div>
                                        </div>
                                        <i class="fas fa-check-circle text-2xl text-orange-400"></i>
                                    </div>
                                </div>
                            </label>
                            
                            <label class="module-checkbox cursor-pointer">
                                <input type="checkbox" name="modules" value="VISUAL" class="hidden peer">
                                <div class="peer-checked:bg-teal-900 peer-checked:border-teal-400 bg-gray-800 border-2 border-gray-600 rounded-lg p-4 hover:border-teal-400 transition-colors">
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center gap-3">
                                            <i class="fas fa-eye text-3xl text-teal-400"></i>
                                            <div>
                                                <p class="text-lg font-black">VISUELS - Contrôles</p>
                                                <p class="text-sm text-gray-400">Inspection visuelle</p>
                                            </div>
                                        </div>
                                        <i class="fas fa-check-circle text-2xl text-teal-400"></i>
                                    </div>
                                </div>
                            </label>
                            
                            <label class="module-checkbox cursor-pointer">
                                <input type="checkbox" name="modules" value="ISOLATION" class="hidden peer">
                                <div class="peer-checked:bg-red-900 peer-checked:border-red-400 bg-gray-800 border-2 border-gray-600 rounded-lg p-4 hover:border-red-400 transition-colors">
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center gap-3">
                                            <i class="fas fa-bolt text-3xl text-red-400"></i>
                                            <div>
                                                <p class="text-lg font-black">ISOLATION - Tests</p>
                                                <p class="text-sm text-gray-400">Tests isolation DC/AC</p>
                                            </div>
                                        </div>
                                        <i class="fas fa-check-circle text-2xl text-red-400"></i>
                                    </div>
                                </div>
                            </label>
                        </div>
                    </div>
                    
                    <!-- Bouton création -->
                    <div class="text-center">
                        <button type="submit" class="bg-green-600 hover:bg-green-700 px-12 py-4 rounded-lg font-black text-2xl shadow-2xl transform hover:scale-105 transition-transform">
                            <i class="fas fa-plus-circle mr-3"></i>
                            CRÉER L'AUDIT
                        </button>
                    </div>
                </form>
            </div>
        </div>
        
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            let currentMode = 'intervention'
            let stringConfigCounter = 0
            
            // ========================================================================
            // GESTION DES BOUTONS DE MODE
            // ========================================================================
            function switchMode(mode) {
                currentMode = mode
                
                // Reset tous les boutons
                const buttons = ['btn-mode-intervention', 'btn-mode-manual', 'btn-mode-advanced']
                buttons.forEach(btnId => {
                    const btn = document.getElementById(btnId)
                    btn.classList.remove('active', 'border-purple-400', 'border-yellow-400', 'from-purple-900', 'to-purple-700', 'from-yellow-900', 'to-yellow-700')
                    btn.classList.add('opacity-75', 'border-gray-600', 'from-gray-800', 'to-gray-700')
                })
                
                // Reset tous les formulaires
                document.getElementById('form-intervention').classList.add('hidden')
                document.getElementById('form-manual').classList.add('hidden')
                document.getElementById('form-advanced').classList.add('hidden')
                
                // Activer le mode sélectionné
                if (mode === 'intervention') {
                    document.getElementById('btn-mode-intervention').classList.remove('opacity-75', 'border-gray-600', 'from-gray-800', 'to-gray-700')
                    document.getElementById('btn-mode-intervention').classList.add('active', 'border-purple-400', 'from-purple-900', 'to-purple-700')
                    document.getElementById('form-intervention').classList.remove('hidden')
                } else if (mode === 'manual') {
                    document.getElementById('btn-mode-manual').classList.remove('opacity-75', 'border-gray-600', 'from-gray-800', 'to-gray-700')
                    document.getElementById('btn-mode-manual').classList.add('active', 'border-purple-400', 'from-purple-900', 'to-purple-700')
                    document.getElementById('form-manual').classList.remove('hidden')
                } else if (mode === 'advanced') {
                    document.getElementById('btn-mode-advanced').classList.remove('opacity-75', 'border-gray-600', 'from-gray-800', 'to-gray-700')
                    document.getElementById('btn-mode-advanced').classList.add('active', 'border-yellow-400', 'from-yellow-900', 'to-yellow-700')
                    document.getElementById('form-advanced').classList.remove('hidden')
                }
            }
            
            document.getElementById('btn-mode-intervention').addEventListener('click', () => switchMode('intervention'))
            document.getElementById('btn-mode-manual').addEventListener('click', () => switchMode('manual'))
            document.getElementById('btn-mode-advanced').addEventListener('click', () => switchMode('advanced'))
            
            // ========================================================================
            // MODE AVANCÉ : GESTION STRINGS INÉGAUX
            // ========================================================================
            function updateTotalModules() {
                let total = 0
                document.querySelectorAll('.string-module-count').forEach(input => {
                    total += parseInt(input.value) || 0
                })
                document.getElementById('totalModulesCount').textContent = total
            }
            
            function addStringConfig() {
                stringConfigCounter++
                const container = document.getElementById('stringsContainer')
                
                const stringItem = document.createElement('div')
                stringItem.className = 'string-config-item flex items-center gap-3 bg-gray-900 p-3 rounded-lg border border-gray-700'
                stringItem.innerHTML = \`
                    <div class="flex-shrink-0 w-24">
                        <span class="block text-center bg-yellow-900 text-yellow-400 px-3 py-2 rounded font-black">STRING \${stringConfigCounter}</span>
                    </div>
                    <div class="flex-grow">
                        <input type="number" 
                               min="0" 
                               placeholder="Nombre de modules" 
                               class="string-module-count w-full bg-black border-2 border-gray-600 rounded px-3 py-2 text-white focus:border-yellow-400 focus:outline-none"
                               value="20">
                    </div>
                    <button type="button" class="remove-string-btn flex-shrink-0 bg-red-600 hover:bg-red-700 px-3 py-2 rounded font-bold">
                        <i class="fas fa-trash"></i>
                    </button>
                \`
                
                container.appendChild(stringItem)
                
                // Event listener pour suppression
                stringItem.querySelector('.remove-string-btn').addEventListener('click', () => {
                    stringItem.remove()
                    updateTotalModules()
                })
                
                // Event listener pour mise à jour total
                stringItem.querySelector('.string-module-count').addEventListener('input', updateTotalModules)
                
                updateTotalModules()
            }
            
            document.getElementById('addStringBtn').addEventListener('click', addStringConfig)
            
            // Ajouter 2 strings par défaut
            addStringConfig()
            addStringConfig()
            
            // ========================================================================
            // CHARGER LES INTERVENTIONS
            // ========================================================================
            async function loadInterventions() {
                try {
                    const response = await axios.get('/api/planning/interventions')
                    const select = document.getElementById('intervention_id')
                    
                    if (response.data.interventions && response.data.interventions.length > 0) {
                        select.innerHTML = '<option value="">-- Sélectionner une intervention --</option>'
                        
                        response.data.interventions.forEach(intervention => {
                            const date = new Date(intervention.intervention_date).toLocaleDateString('fr-FR')
                            const option = document.createElement('option')
                            option.value = intervention.id
                            option.textContent = \`\${intervention.intervention_type} - \${intervention.project_name || 'N/A'} - \${date}\`
                            select.appendChild(option)
                        })
                    } else {
                        // Aucune intervention → Activer mode MANUEL automatiquement
                        select.innerHTML = '<option value="">⚠️ Aucune intervention disponible</option>'
                        select.disabled = true
                        
                        // Afficher message + passer en mode manuel
                        setTimeout(() => {
                            alert('ℹ️ Aucune intervention existante.\\n\\nPassage automatique en mode SAISIE SIMPLE.\\n\\nVous pouvez aussi utiliser le mode CONFIG AVANCÉE pour des strings inégaux.')
                            switchMode('manual')
                        }, 500)
                    }
                } catch (error) {
                    console.error('Erreur chargement interventions:', error)
                    document.getElementById('intervention_id').innerHTML = '<option value="">Erreur de chargement</option>'
                    
                    // Fallback mode manuel si erreur
                    setTimeout(() => {
                        alert('⚠️ Impossible de charger les interventions.\\n\\nVeuillez utiliser le mode SAISIE SIMPLE ou AVANCÉE.')
                        switchMode('manual')
                    }, 500)
                }
            }
            
            // ========================================================================
            // SOUMISSION FORMULAIRE
            // ========================================================================
            document.getElementById('createAuditForm').addEventListener('submit', async (e) => {
                e.preventDefault()
                
                // Récupérer les modules sélectionnés
                const modules = Array.from(document.querySelectorAll('input[name="modules"]:checked'))
                    .map(input => input.value)
                
                if (modules.length === 0) {
                    alert('⚠️ Veuillez sélectionner au moins un module')
                    return
                }
                
                const btn = e.target.querySelector('button[type="submit"]')
                btn.disabled = true
                btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> CRÉATION EN COURS...'
                
                try {
                    let payload = { modules }
                    
                    // MODE INTERVENTION
                    if (currentMode === 'intervention') {
                        const interventionId = document.getElementById('intervention_id').value
                        if (!interventionId) {
                            alert('⚠️ Veuillez sélectionner une intervention')
                            btn.disabled = false
                            btn.innerHTML = '<i class="fas fa-plus-circle mr-3"></i>CRÉER L\\'AUDIT'
                            return
                        }
                        payload.intervention_id = parseInt(interventionId)
                    } 
                    // MODE MANUEL (strings uniformes)
                    else if (currentMode === 'manual') {
                        payload.project_name = document.getElementById('project_name').value
                        payload.client_name = document.getElementById('client_name').value
                        payload.location = document.getElementById('location').value
                        
                        if (!payload.project_name || !payload.client_name) {
                            alert('⚠️ Veuillez remplir le nom du projet et du client')
                            btn.disabled = false
                            btn.innerHTML = '<i class="fas fa-plus-circle mr-3"></i>CRÉER L\\'AUDIT'
                            return
                        }
                        
                        const stringCount = parseInt(document.getElementById('stringCount').value)
                        const modulesPerString = parseInt(document.getElementById('modulesPerString').value)
                        
                        if (stringCount && modulesPerString) {
                            payload.configuration = {
                                mode: 'simple',
                                stringCount,
                                modulesPerString
                            }
                        }
                    } 
                    // MODE AVANCÉ (strings inégaux)
                    else if (currentMode === 'advanced') {
                        payload.project_name = document.getElementById('project_name_adv').value
                        payload.client_name = document.getElementById('client_name_adv').value
                        payload.location = document.getElementById('location_adv').value
                        
                        if (!payload.project_name || !payload.client_name) {
                            alert('⚠️ Veuillez remplir le nom du projet et du client')
                            btn.disabled = false
                            btn.innerHTML = '<i class="fas fa-plus-circle mr-3"></i>CRÉER L\\'AUDIT'
                            return
                        }
                        
                        // Récupérer configuration strings inégaux
                        const stringsConfig = []
                        document.querySelectorAll('.string-config-item').forEach((item, index) => {
                            const moduleCount = parseInt(item.querySelector('.string-module-count').value) || 0
                            if (moduleCount > 0) {
                                stringsConfig.push({
                                    id: index + 1,
                                    mpptNumber: index + 1,
                                    moduleCount: moduleCount,
                                    physicalRow: index + 1,
                                    physicalCol: 0
                                })
                            }
                        })
                        
                        if (stringsConfig.length === 0) {
                            alert('⚠️ Veuillez ajouter au moins une string avec des modules')
                            btn.disabled = false
                            btn.innerHTML = '<i class="fas fa-plus-circle mr-3"></i>CRÉER L\\'AUDIT'
                            return
                        }
                        
                        payload.configuration = {
                            mode: 'advanced',
                            strings: stringsConfig
                        }
                    }
                    
                    console.log('📤 Payload envoyé:', payload)
                    
                    const response = await axios.post('/api/audits/create-multi-modules', payload)
                    
                    console.log('✅ Réponse API:', response.data)
                    
                    // Rediriger vers l'audit créé
                    if (response.data.success) {
                        alert(\`✅ Audit créé avec succès !\\n\\nToken: \${response.data.audit_token}\\n\\nRedirection...\`)
                        window.location.href = \`/audit/\${response.data.audit_token}\`
                    }
                } catch (error) {
                    console.error('❌ Erreur création audit:', error)
                    const errorMsg = error.response?.data?.error || error.response?.data?.details || error.message
                    alert('❌ Erreur lors de la création de l\\'audit :\\n\\n' + errorMsg)
                    btn.disabled = false
                    btn.innerHTML = '<i class="fas fa-plus-circle mr-3"></i>CRÉER L\\'AUDIT'
                }
            })
            
            // ========================================================================
            // INITIALISATION
            // ========================================================================
            loadInterventions()
        </script>
    </body>
    </html>
  `
}
