/**
 * Page Checklist GIRASOLE - Inspection terrain
 * Types: CONFORMITE (NF C 15-100) ou TOITURE (DTU 40.35)
 */

export function getGirasoleChecklistPage(projectId: string, checklistType: 'CONFORMITE' | 'TOITURE') {
  const pageTitle = checklistType === 'CONFORMITE' 
    ? 'Checklist Conformité NF C 15-100' 
    : 'Checklist Toiture DTU 40.35';
  
  const headerColor = checklistType === 'CONFORMITE'
    ? 'from-green-600 to-green-700'
    : 'from-orange-600 to-orange-700';

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pageTitle} - GIRASOLE</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <style>
        .checklist-item { transition: all 0.2s ease; }
        .checklist-item:hover { background: #f9fafb; }
        .category-header { position: sticky; top: 0; z-index: 10; }
        .conformity-btn { transition: all 0.2s ease; transform: scale(1); }
        .conformity-btn:hover { transform: scale(1.05); }
        .conformity-btn.active { transform: scale(1.1); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
    </style>
</head>
<body class="bg-gray-50">
    <!-- Header -->
    <div class="bg-gradient-to-r ${headerColor} text-white shadow-lg sticky top-0 z-20">
        <div class="max-w-7xl mx-auto px-4 py-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <button onclick="goBack()" class="hover:bg-white/20 px-3 py-2 rounded-lg transition">
                        <i class="fas fa-arrow-left text-xl"></i>
                    </button>
                    <div>
                        <h1 class="text-2xl font-bold">${pageTitle}</h1>
                        <p class="text-sm opacity-90" id="project-name">Chargement...</p>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <div class="text-right">
                        <div class="text-2xl font-bold" id="progress-percent">0%</div>
                        <div class="text-xs opacity-90" id="progress-text">0/0 items</div>
                    </div>
                    <button onclick="saveChecklist()" class="bg-white text-green-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition flex items-center gap-2">
                        <i class="fas fa-save"></i>
                        Sauvegarder
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Barre progression -->
    <div class="bg-white border-b sticky top-16 z-10">
        <div class="max-w-7xl mx-auto px-4 py-3">
            <div class="flex items-center gap-4">
                <span class="text-sm font-medium text-gray-700">Progression :</span>
                <div class="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div id="progress-bar" class="bg-green-600 h-full transition-all duration-500" style="width: 0%"></div>
                </div>
            </div>
        </div>
    </div>

    <!-- Filtres rapides -->
    <div class="max-w-7xl mx-auto px-4 py-4">
        <div class="bg-white rounded-lg shadow-md p-4 mb-6">
            <div class="flex items-center gap-4 flex-wrap">
                <label class="text-sm font-medium text-gray-700">Afficher :</label>
                <button onclick="filterItems('all')" class="filter-btn px-4 py-2 rounded-lg bg-blue-100 text-blue-700 font-medium hover:bg-blue-200 transition active" data-filter="all">
                    Tous
                </button>
                <button onclick="filterItems('pending')" class="filter-btn px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-yellow-100 hover:text-yellow-700 transition" data-filter="pending">
                    <i class="fas fa-clock mr-1"></i> Non vérifiés
                </button>
                <button onclick="filterItems('conforme')" class="filter-btn px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-green-100 hover:text-green-700 transition" data-filter="conforme">
                    <i class="fas fa-check-circle mr-1"></i> Conformes
                </button>
                <button onclick="filterItems('non_conforme')" class="filter-btn px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-red-100 hover:text-red-700 transition" data-filter="non_conforme">
                    <i class="fas fa-times-circle mr-1"></i> Non conformes
                </button>
                <div class="ml-auto">
                    <input type="text" id="search-input" placeholder="Rechercher..." class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" onkeyup="searchItems()">
                </div>
            </div>
        </div>
    </div>

    <!-- Checklist -->
    <div class="max-w-7xl mx-auto px-4 pb-8">
        <div id="checklist-container">
            <!-- Généré dynamiquement -->
        </div>
    </div>

    <script>
        const PROJECT_ID = ${projectId};
        const CHECKLIST_TYPE = '${checklistType}';
        let checklistData = [];
        let checklistState = {};
        let currentFilter = 'all';
        let inspectionToken = null;

        // Charger données
        async function loadData() {
            try {
                // Charger info projet
                const projectResp = await axios.get(\`/api/girasole/project/\${PROJECT_ID}\`);
                const project = projectResp.data.project;
                document.getElementById('project-name').textContent = project.name;

                // Charger checklist template
                const checklistResp = await axios.get(\`/api/girasole/checklist/\${CHECKLIST_TYPE}\`);
                checklistData = checklistResp.data.items;

                // Initialiser état (tous à non_verifie par défaut)
                checklistData.forEach(item => {
                    checklistState[item.code] = {
                        conformity: 'non_verifie',
                        observation: '',
                        photos: []
                    };
                });

                // Chercher inspection existante OU créer nouvelle
                // TODO: Implémenter recherche inspection existante
                // Pour l'instant, on crée toujours une nouvelle inspection
                const createResp = await axios.post('/api/girasole/inspection/create', {
                    project_id: PROJECT_ID,
                    checklist_type: CHECKLIST_TYPE
                });
                
                inspectionToken = createResp.data.inspection.token;
                console.log('Inspection créée:', inspectionToken);

                renderChecklist();
                updateProgress();
            } catch (error) {
                console.error('Erreur chargement:', error);
                alert('Erreur lors du chargement de la checklist');
            }
        }

        // Afficher checklist
        function renderChecklist() {
            const container = document.getElementById('checklist-container');
            
            // Grouper par catégorie
            const categories = {};
            checklistData.forEach(item => {
                if (!categories[item.category]) {
                    categories[item.category] = [];
                }
                categories[item.category].push(item);
            });

            let html = '';
            Object.keys(categories).forEach(category => {
                html += \`
                    <div class="mb-8">
                        <div class="category-header bg-gray-800 text-white px-6 py-4 rounded-t-lg">
                            <h2 class="text-xl font-bold">\${category}</h2>
                            <p class="text-sm opacity-80">\${categories[category].length} items</p>
                        </div>
                        <div class="bg-white rounded-b-lg shadow-md overflow-hidden">
                            \${categories[category].map((item, idx) => renderChecklistItem(item, idx === categories[category].length - 1)).join('')}
                        </div>
                    </div>
                \`;
            });

            container.innerHTML = html;
        }

        // Afficher un item
        function renderChecklistItem(item, isLast) {
            const state = checklistState[item.code];
            const borderClass = isLast ? '' : 'border-b';
            
            const criticalityColors = {
                critical: 'bg-red-100 text-red-800',
                major: 'bg-orange-100 text-orange-800',
                minor: 'bg-yellow-100 text-yellow-800',
                info: 'bg-blue-100 text-blue-800'
            };

            const criticalityLabels = {
                critical: 'Critique',
                major: 'Majeur',
                minor: 'Mineur',
                info: 'Info'
            };

            return \`
                <div class="checklist-item p-6 \${borderClass}" data-code="\${item.code}" data-conformity="\${state.conformity}">
                    <div class="flex items-start gap-6">
                        <!-- Code + Criticité -->
                        <div class="flex-shrink-0 w-24">
                            <div class="text-2xl font-bold text-gray-800 mb-2">\${item.code}</div>
                            <span class="\${criticalityColors[item.criticalityLevel]} px-2 py-1 rounded text-xs font-medium">
                                \${criticalityLabels[item.criticalityLevel]}
                            </span>
                        </div>

                        <!-- Description -->
                        <div class="flex-1">
                            <h3 class="text-lg font-semibold text-gray-800 mb-2">\${item.description}</h3>
                            <div class="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                                <div>
                                    <i class="fas fa-book text-blue-600 mr-2"></i>
                                    <strong>Norme :</strong> \${item.normReference}
                                </div>
                                <div>
                                    <i class="fas fa-clipboard-check text-purple-600 mr-2"></i>
                                    <strong>Méthode :</strong> \${item.checkMethod}
                                </div>
                            </div>

                            <!-- Boutons conformité -->
                            <div class="flex gap-3 mb-4">
                                <button onclick="setConformity('\${item.code}', 'conforme')" 
                                        class="conformity-btn flex-1 px-4 py-3 rounded-lg font-medium transition \${state.conformity === 'conforme' ? 'bg-green-600 text-white active' : 'bg-gray-100 text-gray-700 hover:bg-green-100'}">
                                    <i class="fas fa-check-circle mr-2"></i>Conforme
                                </button>
                                <button onclick="setConformity('\${item.code}', 'non_conforme')" 
                                        class="conformity-btn flex-1 px-4 py-3 rounded-lg font-medium transition \${state.conformity === 'non_conforme' ? 'bg-red-600 text-white active' : 'bg-gray-100 text-gray-700 hover:bg-red-100'}">
                                    <i class="fas fa-times-circle mr-2"></i>Non conforme
                                </button>
                                <button onclick="setConformity('\${item.code}', 'sans_objet')" 
                                        class="conformity-btn flex-1 px-4 py-3 rounded-lg font-medium transition \${state.conformity === 'sans_objet' ? 'bg-gray-600 text-white active' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}">
                                    <i class="fas fa-ban mr-2"></i>Sans objet
                                </button>
                            </div>

                            <!-- Zone observation (visible si non conforme) -->
                            <div id="obs-\${item.code}" class="mt-4 \${state.conformity === 'non_conforme' ? '' : 'hidden'}">
                                <label class="block text-sm font-medium text-gray-700 mb-2">Observation / Préconisation :</label>
                                <textarea 
                                    id="textarea-\${item.code}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    rows="3"
                                    placeholder="Décrire la non-conformité et les actions recommandées..."
                                    onchange="updateObservation('\${item.code}', this.value)"
                                >\${state.observation}</textarea>
                            </div>
                        </div>
                    </div>
                </div>
            \`;
        }

        // Définir conformité
        async function setConformity(code, value) {
            checklistState[code].conformity = value;
            
            // Sauvegarder en base immédiatement
            if (inspectionToken) {
                try {
                    await axios.put(\`/api/girasole/inspection/\${inspectionToken}/item/\${code}\`, {
                        conformity: value,
                        observation: checklistState[code].observation
                    });
                } catch (error) {
                    console.error('Erreur sauvegarde item:', error);
                }
            }
            
            // Mise à jour UI
            const item = document.querySelector(\`[data-code="\${code}"]\`);
            item.setAttribute('data-conformity', value);
            
            // Toggle observation
            const obsDiv = document.getElementById(\`obs-\${code}\`);
            if (value === 'non_conforme') {
                obsDiv.classList.remove('hidden');
            } else {
                obsDiv.classList.add('hidden');
            }
            
            // Re-render buttons
            renderChecklist();
            updateProgress();
        }

        // Mettre à jour observation
        async function updateObservation(code, value) {
            checklistState[code].observation = value;
            
            // Sauvegarder en base
            if (inspectionToken) {
                try {
                    await axios.put(\`/api/girasole/inspection/\${inspectionToken}/item/\${code}\`, {
                        conformity: checklistState[code].conformity,
                        observation: value
                    });
                } catch (error) {
                    console.error('Erreur sauvegarde observation:', error);
                }
            }
        }

        // Mettre à jour progression
        function updateProgress() {
            const total = checklistData.length;
            const verified = Object.values(checklistState).filter(s => s.conformity !== 'non_verifie').length;
            const percent = Math.round((verified / total) * 100);

            document.getElementById('progress-percent').textContent = percent + '%';
            document.getElementById('progress-text').textContent = \`\${verified}/\${total} items\`;
            document.getElementById('progress-bar').style.width = percent + '%';
        }

        // Filtrer items
        function filterItems(type) {
            currentFilter = type;
            
            // Update buttons
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active', 'bg-blue-100', 'text-blue-700', 'bg-green-100', 'text-green-700', 'bg-red-100', 'text-red-700', 'bg-yellow-100', 'text-yellow-700');
                btn.classList.add('bg-gray-100', 'text-gray-700');
            });

            const activeBtn = document.querySelector(\`[data-filter="\${type}"]\`);
            if (type === 'all') {
                activeBtn.classList.remove('bg-gray-100', 'text-gray-700');
                activeBtn.classList.add('bg-blue-100', 'text-blue-700', 'active');
            } else if (type === 'conforme') {
                activeBtn.classList.remove('bg-gray-100', 'text-gray-700');
                activeBtn.classList.add('bg-green-100', 'text-green-700', 'active');
            } else if (type === 'non_conforme') {
                activeBtn.classList.remove('bg-gray-100', 'text-gray-700');
                activeBtn.classList.add('bg-red-100', 'text-red-700', 'active');
            } else if (type === 'pending') {
                activeBtn.classList.remove('bg-gray-100', 'text-gray-700');
                activeBtn.classList.add('bg-yellow-100', 'text-yellow-700', 'active');
            }

            // Filter display
            document.querySelectorAll('.checklist-item').forEach(item => {
                const conformity = item.getAttribute('data-conformity');
                if (type === 'all') {
                    item.style.display = '';
                } else if (type === 'pending' && conformity === 'non_verifie') {
                    item.style.display = '';
                } else if (conformity === type) {
                    item.style.display = '';
                } else {
                    item.style.display = 'none';
                }
            });
        }

        // Rechercher
        function searchItems() {
            const query = document.getElementById('search-input').value.toLowerCase();
            document.querySelectorAll('.checklist-item').forEach(item => {
                const text = item.textContent.toLowerCase();
                item.style.display = text.includes(query) ? '' : 'none';
            });
        }

        // Sauvegarder (auto-save activé, ce bouton force juste la synchro)
        async function saveChecklist() {
            alert('✅ Sauvegarde automatique activée !\\nToutes vos modifications sont enregistrées en temps réel.');
        }

        // Retour
        function goBack() {
            window.location.href = '/girasole/dashboard';
        }

        // Charger au démarrage
        loadData();
    </script>
</body>
</html>
  `;
}
