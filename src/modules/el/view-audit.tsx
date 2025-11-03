/**
 * MODULE EL - INTERFACE AUDIT ÉLECTROLUMINESCENCE
 * =================================================
 * Interface dédiée pour annoter les modules PV avec défauts EL
 * Interconnecté avec Canvas V2 via pv_modules (table unifiée)
 * 
 * Workflow:
 * 1. Canvas V2 → Clic "AUDIT EL" → Cette interface (chargée avec zoneId)
 * 2. Affichage liste modules de la zone (GET /api/el/zone/:zoneId/modules)
 * 3. Formulaire annotation par module (POST /api/el/zone/:zoneId/module/:moduleId)
 * 4. Sauvegarde → module_status synchronisé automatiquement dans pv_modules
 * 5. Retour Canvas V2 → Modules affichent nouvelles couleurs
 */

import { Context } from 'hono'

export function renderAuditELPage(c: Context, zoneId: number, zoneName: string, plantId: number) {
  return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Audit EL - ${zoneName} | DiagPV Hub</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <style>
            body { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); min-height: 100vh; }
            .module-card { 
                transition: all 0.3s ease; 
                cursor: pointer;
                background: rgba(255, 255, 255, 0.05);
                backdrop-filter: blur(10px);
            }
            .module-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(139, 92, 246, 0.3); }
            .status-badge { font-size: 0.7rem; padding: 2px 8px; border-radius: 12px; font-weight: 700; }
            .modal { display: none; }
            .modal.active { display: flex; }
            .severity-btn { transition: all 0.2s ease; }
            .severity-btn.active { transform: scale(1.1); box-shadow: 0 0 20px currentColor; }
        </style>
    </head>
    <body class="text-white">
        <!-- Header -->
        <div class="bg-gradient-to-r from-purple-900 to-indigo-900 shadow-2xl">
            <div class="container mx-auto px-6 py-5 flex justify-between items-center">
                <div class="flex gap-4 items-center">
                    <a href="/pv/plant/${plantId}/zone/${zoneId}/editor/v2" class="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-bold transition">
                        <i class="fas fa-arrow-left mr-2"></i>RETOUR CANVAS
                    </a>
                    <div>
                        <h1 class="text-2xl font-black text-white">
                            <i class="fas fa-bolt text-yellow-400 mr-2"></i>AUDIT ÉLECTROLUMINESCENCE
                        </h1>
                        <p class="text-purple-300 text-sm mt-1">Zone: ${zoneName} (ID: ${zoneId})</p>
                    </div>
                </div>
                <div class="flex gap-3 items-center">
                    <div id="statsDisplay" class="bg-black bg-opacity-40 px-4 py-2 rounded-lg">
                        <span class="text-xs text-gray-400">Stats chargement...</span>
                    </div>
                    <button id="refreshBtn" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-bold">
                        <i class="fas fa-sync-alt mr-2"></i>RAFRAÎCHIR
                    </button>
                </div>
            </div>
        </div>

        <div class="container mx-auto px-6 py-8">
            <!-- Filtres -->
            <div class="bg-gray-900 bg-opacity-60 rounded-xl p-5 mb-6 backdrop-blur-sm">
                <div class="flex gap-4 items-center flex-wrap">
                    <div class="flex gap-2">
                        <button class="filter-btn active" data-filter="all">
                            <i class="fas fa-list mr-2"></i>TOUS (<span id="countAll">0</span>)
                        </button>
                        <button class="filter-btn" data-filter="ok">
                            <i class="fas fa-check-circle mr-2 text-green-400"></i>OK (<span id="countOk">0</span>)
                        </button>
                        <button class="filter-btn" data-filter="inequality">
                            <i class="fas fa-exclamation-triangle mr-2 text-yellow-400"></i>INÉGALITÉ (<span id="countInequality">0</span>)
                        </button>
                        <button class="filter-btn" data-filter="microcracks">
                            <i class="fas fa-exclamation-circle mr-2 text-orange-400"></i>MICROFISSURES (<span id="countMicro">0</span>)
                        </button>
                        <button class="filter-btn" data-filter="dead">
                            <i class="fas fa-times-circle mr-2 text-red-500"></i>HS (<span id="countDead">0</span>)
                        </button>
                        <button class="filter-btn" data-filter="pending">
                            <i class="fas fa-clock mr-2 text-gray-400"></i>EN ATTENTE (<span id="countPending">0</span>)
                        </button>
                    </div>
                    <div class="ml-auto">
                        <input type="text" id="searchInput" placeholder="Rechercher module (ex: S1-P03)..." 
                               class="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500">
                    </div>
                </div>
            </div>

            <!-- Grille modules -->
            <div id="modulesGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <!-- Modules chargés dynamiquement -->
            </div>

            <!-- Loading -->
            <div id="loadingState" class="text-center py-20">
                <i class="fas fa-spinner fa-spin text-6xl text-purple-500 mb-4"></i>
                <p class="text-xl text-gray-400">Chargement modules...</p>
            </div>

            <!-- Empty state -->
            <div id="emptyState" class="hidden text-center py-20">
                <i class="fas fa-solar-panel text-6xl text-gray-600 mb-4"></i>
                <p class="text-xl text-gray-400">Aucun module trouvé dans cette zone</p>
                <a href="/pv/plant/${plantId}/zone/${zoneId}/editor/v2" class="mt-4 inline-block bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-bold">
                    Créer des modules dans Canvas V2
                </a>
            </div>
        </div>

        <!-- Modal Annotation -->
        <div id="annotationModal" class="modal fixed inset-0 bg-black bg-opacity-80 items-center justify-center z-50 p-6">
            <div class="bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-purple-500">
                <!-- Header -->
                <div class="bg-gradient-to-r from-purple-800 to-indigo-800 p-6 rounded-t-2xl">
                    <div class="flex justify-between items-center">
                        <h2 class="text-2xl font-black">
                            <i class="fas fa-microscope mr-2"></i>ANNOTATION MODULE <span id="modalModuleId" class="text-yellow-400"></span>
                        </h2>
                        <button id="closeModalBtn" class="text-white hover:text-red-400 text-2xl">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <p class="text-purple-200 text-sm mt-2">
                        String <span id="modalString"></span> - Position <span id="modalPosition"></span>
                    </p>
                </div>

                <!-- Form -->
                <form id="annotationForm" class="p-6 space-y-6">
                    <!-- Sélection défaut -->
                    <div>
                        <label class="block text-sm font-bold mb-3 text-purple-300">TYPE DE DÉFAUT</label>
                        <div class="grid grid-cols-2 gap-3">
                            <button type="button" class="defect-btn bg-green-700 hover:bg-green-600" data-defect="none" data-severity="0">
                                <i class="fas fa-check-circle text-2xl mb-1"></i>
                                <div class="font-bold">AUCUN</div>
                                <div class="text-xs opacity-80">Module OK</div>
                            </button>
                            <button type="button" class="defect-btn bg-yellow-700 hover:bg-yellow-600" data-defect="luminescence_inequality" data-severity="1">
                                <i class="fas fa-exclamation-triangle text-2xl mb-1"></i>
                                <div class="font-bold">INÉGALITÉ</div>
                                <div class="text-xs opacity-80">Luminescence inégale</div>
                            </button>
                            <button type="button" class="defect-btn bg-orange-700 hover:bg-orange-600" data-defect="microcrack" data-severity="2">
                                <i class="fas fa-exclamation-circle text-2xl mb-1"></i>
                                <div class="font-bold">MICROFISSURE</div>
                                <div class="text-xs opacity-80">Fissures visibles</div>
                            </button>
                            <button type="button" class="defect-btn bg-red-700 hover:bg-red-600" data-defect="dead_module" data-severity="3">
                                <i class="fas fa-times-circle text-2xl mb-1"></i>
                                <div class="font-bold">MODULE HS</div>
                                <div class="text-xs opacity-80">Aucune luminescence</div>
                            </button>
                            <button type="button" class="defect-btn bg-purple-700 hover:bg-purple-600" data-defect="string_open" data-severity="2">
                                <i class="fas fa-link-slash text-2xl mb-1"></i>
                                <div class="font-bold">STRING OUVERT</div>
                                <div class="text-xs opacity-80">Circuit ouvert</div>
                            </button>
                            <button type="button" class="defect-btn bg-blue-700 hover:bg-blue-600" data-defect="not_connected" data-severity="2">
                                <i class="fas fa-plug text-2xl mb-1"></i>
                                <div class="font-bold">NON CONNECTÉ</div>
                                <div class="text-xs opacity-80">Pas de connexion</div>
                            </button>
                        </div>
                    </div>

                    <!-- Commentaire -->
                    <div>
                        <label class="block text-sm font-bold mb-2 text-purple-300">COMMENTAIRES</label>
                        <textarea id="commentInput" rows="4" 
                                  class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500" 
                                  placeholder="Observations, détails du défaut, recommandations..."></textarea>
                    </div>

                    <!-- Photo URL (optionnel) -->
                    <div>
                        <label class="block text-sm font-bold mb-2 text-purple-300">PHOTO EL (URL)</label>
                        <input type="url" id="photoUrlInput" 
                               class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500" 
                               placeholder="https://example.com/photo-el.jpg">
                        <p class="text-xs text-gray-500 mt-1">Optionnel - URL de la photo électroluminescence</p>
                    </div>

                    <!-- Actions -->
                    <div class="flex gap-3 pt-4">
                        <button type="submit" class="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 px-6 py-3 rounded-lg font-black text-lg shadow-lg">
                            <i class="fas fa-save mr-2"></i>ENREGISTRER
                        </button>
                        <button type="button" id="cancelModalBtn" class="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-bold">
                            ANNULER
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <script>
            const zoneId = ${zoneId}
            const plantId = ${plantId}
            let modules = []
            let currentFilter = 'all'
            let selectedDefect = null
            let selectedSeverity = 0

            // Charger modules
            async function loadModules() {
                try {
                    document.getElementById('loadingState').classList.remove('hidden')
                    document.getElementById('modulesGrid').innerHTML = ''
                    
                    const response = await axios.get(\`/api/el/zone/\${zoneId}/modules\`)
                    modules = response.data.modules || []
                    
                    document.getElementById('loadingState').classList.add('hidden')
                    
                    if (modules.length === 0) {
                        document.getElementById('emptyState').classList.remove('hidden')
                        return
                    }
                    
                    renderModules()
                    updateStats()
                } catch (error) {
                    console.error('Erreur chargement modules:', error)
                    document.getElementById('loadingState').innerHTML = '<div class="text-red-500 text-center"><i class="fas fa-exclamation-triangle text-4xl mb-3"></i><p>Erreur chargement modules</p></div>'
                }
            }

            // Afficher modules
            function renderModules() {
                const grid = document.getElementById('modulesGrid')
                const searchTerm = document.getElementById('searchInput').value.toLowerCase()
                
                const filtered = modules.filter(m => {
                    const matchesFilter = currentFilter === 'all' || m.module_status === currentFilter
                    const matchesSearch = m.module_identifier.toLowerCase().includes(searchTerm)
                    return matchesFilter && matchesSearch
                })
                
                grid.innerHTML = filtered.map(module => {
                    const statusColors = {
                        'ok': 'bg-green-600',
                        'inequality': 'bg-yellow-600',
                        'microcracks': 'bg-orange-600',
                        'dead': 'bg-red-600',
                        'string_open': 'bg-purple-600',
                        'not_connected': 'bg-blue-600',
                        'pending': 'bg-gray-600'
                    }
                    
                    const statusIcons = {
                        'ok': 'fa-check-circle',
                        'inequality': 'fa-exclamation-triangle',
                        'microcracks': 'fa-exclamation-circle',
                        'dead': 'fa-times-circle',
                        'string_open': 'fa-link-slash',
                        'not_connected': 'fa-plug',
                        'pending': 'fa-clock'
                    }
                    
                    const statusLabels = {
                        'ok': 'OK',
                        'inequality': 'Inégalité',
                        'microcracks': 'Microfissures',
                        'dead': 'HS',
                        'string_open': 'String ouvert',
                        'not_connected': 'Non connecté',
                        'pending': 'En attente'
                    }
                    
                    const bgColor = statusColors[module.module_status] || 'bg-gray-600'
                    const icon = statusIcons[module.module_status] || 'fa-question'
                    const label = statusLabels[module.module_status] || module.module_status
                    
                    return \`
                        <div class="module-card rounded-xl p-5 border-2 border-gray-700 hover:border-purple-500" onclick="openAnnotationModal('\${module.module_identifier}', \${module.string_number}, \${module.position_in_string})">
                            <div class="flex justify-between items-start mb-3">
                                <div>
                                    <h3 class="text-xl font-black text-white">\${module.module_identifier}</h3>
                                    <p class="text-xs text-gray-400">S\${module.string_number} - Pos \${module.position_in_string}</p>
                                </div>
                                <span class="\${bgColor} status-badge">
                                    <i class="fas \${icon} mr-1"></i>\${label}
                                </span>
                            </div>
                            
                            \${module.el_defect_type ? \`
                                <div class="mt-3 pt-3 border-t border-gray-700">
                                    <p class="text-xs text-purple-300 font-bold mb-1">
                                        <i class="fas fa-clipboard-list mr-1"></i>Défaut: \${module.el_defect_type}
                                    </p>
                                    \${module.el_notes ? \`<p class="text-xs text-gray-400 line-clamp-2">\${module.el_notes}</p>\` : ''}
                                    \${module.el_photo_url ? \`<p class="text-xs text-blue-400 mt-1"><i class="fas fa-camera mr-1"></i>Photo disponible</p>\` : ''}
                                    <p class="text-xs text-gray-500 mt-1">Sévérité: \${module.el_severity_level}/3</p>
                                </div>
                            \` : \`
                                <div class="mt-3 pt-3 border-t border-gray-700">
                                    <p class="text-xs text-gray-500 italic">Cliquez pour annoter</p>
                                </div>
                            \`}
                        </div>
                    \`
                }).join('')
            }

            // Ouvrir modal annotation
            function openAnnotationModal(moduleId, stringNum, position) {
                const module = modules.find(m => m.module_identifier === moduleId)
                if (!module) return
                
                // Pré-remplir
                document.getElementById('modalModuleId').textContent = moduleId
                document.getElementById('modalString').textContent = stringNum
                document.getElementById('modalPosition').textContent = position
                document.getElementById('commentInput').value = module.el_notes || ''
                document.getElementById('photoUrlInput').value = module.el_photo_url || ''
                
                // Pré-sélectionner défaut actuel
                selectedDefect = module.el_defect_type || null
                selectedSeverity = module.el_severity_level || 0
                
                // Reset active states
                document.querySelectorAll('.defect-btn').forEach(btn => btn.classList.remove('active', 'ring-4', 'ring-white'))
                
                // Highlight défaut actuel si existe
                if (selectedDefect) {
                    const activeBtn = document.querySelector(\`[data-defect="\${selectedDefect}"]\`)
                    if (activeBtn) {
                        activeBtn.classList.add('active', 'ring-4', 'ring-white')
                    }
                }
                
                document.getElementById('annotationModal').classList.add('active')
                
                // Store current module ID
                window.currentModuleId = moduleId
            }

            // Fermer modal
            function closeModal() {
                document.getElementById('annotationModal').classList.remove('active')
                window.currentModuleId = null
                selectedDefect = null
                selectedSeverity = 0
            }

            // Sélection défaut
            document.querySelectorAll('.defect-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    document.querySelectorAll('.defect-btn').forEach(b => b.classList.remove('active', 'ring-4', 'ring-white'))
                    this.classList.add('active', 'ring-4', 'ring-white')
                    
                    selectedDefect = this.dataset.defect
                    selectedSeverity = parseInt(this.dataset.severity)
                })
            })

            // Soumettre annotation
            document.getElementById('annotationForm').addEventListener('submit', async (e) => {
                e.preventDefault()
                
                if (!selectedDefect) {
                    alert('⚠️ Veuillez sélectionner un type de défaut')
                    return
                }
                
                const comment = document.getElementById('commentInput').value.trim()
                const photoUrl = document.getElementById('photoUrlInput').value.trim()
                
                try {
                    const response = await axios.post(\`/api/el/zone/\${zoneId}/module/\${window.currentModuleId}\`, {
                        status: selectedDefect,
                        comment: comment || null,
                        photoUrl: photoUrl || null
                    })
                    
                    if (response.data.success) {
                        // Succès - reload modules
                        await loadModules()
                        closeModal()
                        
                        // Toast success
                        showToast('✅ Annotation enregistrée avec succès', 'success')
                    }
                } catch (error) {
                    console.error('Erreur sauvegarde:', error)
                    showToast('❌ Erreur lors de la sauvegarde', 'error')
                }
            })

            // Toast notification
            function showToast(message, type = 'info') {
                const toast = document.createElement('div')
                toast.className = \`fixed bottom-6 right-6 px-6 py-4 rounded-lg shadow-2xl font-bold text-white z-50 \${type === 'success' ? 'bg-green-600' : 'bg-red-600'}\`
                toast.textContent = message
                document.body.appendChild(toast)
                
                setTimeout(() => {
                    toast.style.opacity = '0'
                    toast.style.transition = 'opacity 0.3s'
                    setTimeout(() => toast.remove(), 300)
                }, 3000)
            }

            // Filtres
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active', 'bg-purple-600'))
                    this.classList.add('active', 'bg-purple-600')
                    
                    currentFilter = this.dataset.filter
                    renderModules()
                })
            })

            // Recherche
            document.getElementById('searchInput').addEventListener('input', renderModules)

            // Fermeture modal
            document.getElementById('closeModalBtn').addEventListener('click', closeModal)
            document.getElementById('cancelModalBtn').addEventListener('click', closeModal)

            // Rafraîchir
            document.getElementById('refreshBtn').addEventListener('click', loadModules)

            // Stats
            function updateStats() {
                const stats = {
                    all: modules.length,
                    ok: modules.filter(m => m.module_status === 'ok').length,
                    inequality: modules.filter(m => m.module_status === 'inequality').length,
                    microcracks: modules.filter(m => m.module_status === 'microcracks').length,
                    dead: modules.filter(m => m.module_status === 'dead').length,
                    pending: modules.filter(m => m.module_status === 'pending').length
                }
                
                document.getElementById('countAll').textContent = stats.all
                document.getElementById('countOk').textContent = stats.ok
                document.getElementById('countInequality').textContent = stats.inequality
                document.getElementById('countMicro').textContent = stats.microcracks
                document.getElementById('countDead').textContent = stats.dead
                document.getElementById('countPending').textContent = stats.pending
                
                const annotated = modules.filter(m => m.el_defect_type).length
                const completionRate = modules.length > 0 ? Math.round((annotated / modules.length) * 100) : 0
                
                document.getElementById('statsDisplay').innerHTML = \`
                    <div class="text-xs">
                        <span class="text-gray-400">Modules:</span> <span class="text-white font-bold">\${modules.length}</span>
                        <span class="mx-2 text-gray-600">|</span>
                        <span class="text-gray-400">Annotés:</span> <span class="text-purple-400 font-bold">\${annotated}</span>
                        <span class="mx-2 text-gray-600">|</span>
                        <span class="text-gray-400">Complétion:</span> <span class="text-green-400 font-bold">\${completionRate}%</span>
                    </div>
                \`
            }

            // Style filtres
            const style = document.createElement('style')
            style.textContent = \`
                .filter-btn {
                    padding: 0.5rem 1rem;
                    border-radius: 0.5rem;
                    font-weight: 700;
                    font-size: 0.875rem;
                    background: rgba(255, 255, 255, 0.05);
                    border: 2px solid transparent;
                    transition: all 0.2s;
                }
                .filter-btn:hover {
                    background: rgba(139, 92, 246, 0.2);
                    border-color: rgba(139, 92, 246, 0.5);
                }
                .filter-btn.active {
                    background: rgb(139, 92, 246);
                    border-color: rgb(139, 92, 246);
                }
                .defect-btn {
                    padding: 1rem;
                    border-radius: 0.75rem;
                    text-align: center;
                    transition: all 0.2s;
                    border: 3px solid transparent;
                }
                .defect-btn.active {
                    transform: scale(1.05);
                }
                .line-clamp-2 {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
            \`
            document.head.appendChild(style)

            // Init
            loadModules()
        </script>
    </body>
    </html>
  `)
}
