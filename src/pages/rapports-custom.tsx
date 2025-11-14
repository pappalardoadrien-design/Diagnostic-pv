/**
 * Interface Builder de Rapports Flexibles
 * Permet de créer des rapports adaptés au type d'audit
 */

export function getRapportsCustomPage() {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Builder de Rapports Flexibles - DiagPV</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
</head>
<body class="bg-gray-50">
    
    <!-- NAVIGATION -->
    <div class="bg-green-700 text-white p-4 mb-6">
        <div class="max-w-7xl mx-auto flex items-center justify-between">
            <div class="flex items-center space-x-4">
                <a href="/" class="hover:text-green-200">
                    <i class="fas fa-home"></i> Accueil
                </a>
                <a href="/rapports" class="hover:text-green-200">
                    <i class="fas fa-file-alt"></i> Rapports Unifiés
                </a>
                <span class="text-green-200">
                    <i class="fas fa-magic"></i> Builder Flexible
                </span>
            </div>
            <div class="text-sm">
                <i class="fas fa-user"></i> ${typeof localStorage !== 'undefined' && localStorage.getItem('auditor_name') || 'Adrien PAPPALARDO'}
            </div>
        </div>
    </div>

    <div class="max-w-7xl mx-auto px-4">
        
        <!-- EN-TÊTE -->
        <div class="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg p-8 mb-6">
            <div class="flex items-center mb-4">
                <i class="fas fa-magic text-5xl mr-4"></i>
                <div>
                    <h1 class="text-4xl font-black">Builder de Rapports Flexibles</h1>
                    <p class="text-xl text-green-100">Générez des rapports adaptés à chaque type d'audit</p>
                </div>
            </div>
            <div class="grid grid-cols-4 gap-4 mt-6 text-center">
                <div class="bg-white bg-opacity-20 rounded-lg p-3">
                    <div class="text-2xl font-bold">6</div>
                    <div class="text-sm">Templates</div>
                </div>
                <div class="bg-white bg-opacity-20 rounded-lg p-3">
                    <div class="text-2xl font-bold">5</div>
                    <div class="text-sm">Modules</div>
                </div>
                <div class="bg-white bg-opacity-20 rounded-lg p-3">
                    <div class="text-2xl font-bold">100%</div>
                    <div class="text-sm">Flexible</div>
                </div>
                <div class="bg-white bg-opacity-20 rounded-lg p-3">
                    <div class="text-2xl font-bold">30s</div>
                    <div class="text-sm">Génération</div>
                </div>
            </div>
        </div>

        <!-- WIZARD DE GÉNÉRATION -->
        <div class="bg-white rounded-lg shadow-lg p-8 mb-6">
            <form id="reportBuilderForm" class="space-y-6">
                
                <!-- ÉTAPE 1 : SÉLECTION TEMPLATE -->
                <div class="border-b pb-6">
                    <h2 class="text-2xl font-bold mb-4 flex items-center">
                        <span class="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3">1</span>
                        Type de Rapport
                    </h2>
                    <div id="templatesGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <!-- Chargé dynamiquement -->
                    </div>
                </div>

                <!-- ÉTAPE 2 : INFORMATIONS GÉNÉRALES -->
                <div class="border-b pb-6">
                    <h2 class="text-2xl font-bold mb-4 flex items-center">
                        <span class="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3">2</span>
                        Informations Générales
                    </h2>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">
                                Centrale PV *
                            </label>
                            <select id="plantId" required class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none">
                                <option value="">Sélectionner...</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">
                                Date d'Audit *
                            </label>
                            <input type="date" id="auditDate" required value="${new Date().toISOString().split('T')[0]}" 
                                class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">
                                Titre du Rapport *
                            </label>
                            <input type="text" id="reportTitle" required placeholder="Ex: Audit Commissioning 2025"
                                class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">
                                Client *
                            </label>
                            <input type="text" id="clientName" required placeholder="Nom du client"
                                class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">
                                Auditeur
                            </label>
                            <select id="auditorName" class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none">
                                <option value="Adrien PAPPALARDO">Adrien PAPPALARDO</option>
                                <option value="Fabien CORRERA">Fabien CORRERA</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- ÉTAPE 3 : SÉLECTION MODULES -->
                <div class="border-b pb-6">
                    <h2 class="text-2xl font-bold mb-4 flex items-center">
                        <span class="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3">3</span>
                        Modules à Inclure
                    </h2>
                    <div id="modulesSelection" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <!-- Chargé dynamiquement selon template -->
                    </div>
                    <div id="customWeights" class="mt-6 hidden">
                        <h3 class="text-lg font-bold mb-3">Pondérations Personnalisées (Total = 100%)</h3>
                        <div class="grid grid-cols-5 gap-3" id="weightsInputs">
                            <!-- Chargé dynamiquement si template custom -->
                        </div>
                    </div>
                </div>

                <!-- ÉTAPE 4 : PRÉVISUALISATION DONNÉES -->
                <div class="border-b pb-6">
                    <h2 class="text-2xl font-bold mb-4 flex items-center">
                        <span class="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3">4</span>
                        Vérification des Données
                    </h2>
                    <button type="button" onclick="checkDataAvailability()" 
                        class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold">
                        <i class="fas fa-search mr-2"></i>Vérifier Disponibilité des Données
                    </button>
                    <div id="dataAvailability" class="mt-4"></div>
                </div>

                <!-- ÉTAPE 5 : GÉNÉRATION -->
                <div class="flex items-center justify-between">
                    <div class="text-sm text-gray-600">
                        <i class="fas fa-info-circle mr-1"></i>
                        Le rapport sera sauvegardé automatiquement et accessible depuis la liste des rapports
                    </div>
                    <button type="submit" id="generateBtn" disabled
                        class="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-8 py-4 rounded-lg font-bold text-lg">
                        <i class="fas fa-magic mr-2"></i>Générer le Rapport
                    </button>
                </div>
            </form>
        </div>

        <!-- MODAL RÉSULTAT -->
        <div id="resultModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
                <div id="resultContent"></div>
            </div>
        </div>

    </div>

    <script>
        let templates = [];
        let selectedTemplate = null;
        let selectedModules = [];
        let dataAvailable = false;

        // Charger templates au chargement de la page
        async function loadTemplates() {
            try {
                const response = await axios.get('/api/report/custom/templates');
                templates = response.data.templates;
                displayTemplates();
            } catch (error) {
                console.error('Error loading templates:', error);
                alert('Erreur lors du chargement des templates');
            }
        }

        // Afficher templates
        function displayTemplates() {
            const grid = document.getElementById('templatesGrid');
            grid.innerHTML = templates.map(template => {
                const modulesRequired = JSON.parse(template.modules_required);
                const modulesOptional = JSON.parse(template.modules_optional || '[]');
                const allModules = [...modulesRequired, ...modulesOptional];
                
                return \`
                    <div class="border-2 rounded-lg p-4 cursor-pointer hover:border-green-500 hover:bg-green-50 transition template-card"
                        data-template-code="\${template.template_code}"
                        onclick="selectTemplate('\${template.template_code}')">
                        <div class="flex items-center mb-3">
                            <i class="\${template.icon} text-3xl text-green-600 mr-3"></i>
                            <div class="flex-1">
                                <div class="font-bold text-lg">\${template.display_name}</div>
                                <div class="text-xs text-gray-600">\${template.description}</div>
                            </div>
                        </div>
                        <div class="flex flex-wrap gap-1">
                            \${allModules.map(m => {
                                const isRequired = modulesRequired.includes(m);
                                const labels = {
                                    'el': 'EL',
                                    'thermal': 'Thermal',
                                    'iv_curves': 'IV',
                                    'visual': 'Visual',
                                    'isolation': 'Isolation'
                                };
                                return \`<span class="text-xs px-2 py-1 rounded \${isRequired ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}">\${labels[m] || m}</span>\`;
                            }).join('')}
                        </div>
                    </div>
                \`;
            }).join('');
        }

        // Sélectionner template
        function selectTemplate(templateCode) {
            selectedTemplate = templates.find(t => t.template_code === templateCode);
            
            // Mettre à jour visuel
            document.querySelectorAll('.template-card').forEach(card => {
                if (card.dataset.templateCode === templateCode) {
                    card.classList.add('border-green-600', 'bg-green-50');
                } else {
                    card.classList.remove('border-green-600', 'bg-green-50');
                }
            });
            
            // Afficher modules
            displayModulesSelection();
            
            // Réinitialiser disponibilité
            document.getElementById('dataAvailability').innerHTML = '';
            dataAvailable = false;
            document.getElementById('generateBtn').disabled = true;
        }

        // Afficher sélection modules
        function displayModulesSelection() {
            if (!selectedTemplate) return;
            
            const modulesRequired = JSON.parse(selectedTemplate.modules_required);
            const modulesOptional = JSON.parse(selectedTemplate.modules_optional || '[]');
            
            const moduleInfo = {
                'el': { name: 'Électroluminescence', icon: 'fa-bolt', color: 'purple' },
                'thermal': { name: 'Thermographie', icon: 'fa-thermometer-half', color: 'red' },
                'iv_curves': { name: 'Courbes I-V', icon: 'fa-chart-line', color: 'blue' },
                'visual': { name: 'Inspection Visuelle', icon: 'fa-eye', color: 'green' },
                'isolation': { name: 'Tests Isolation', icon: 'fa-shield-alt', color: 'yellow' }
            };
            
            const allModules = [...modulesRequired, ...modulesOptional];
            const container = document.getElementById('modulesSelection');
            
            container.innerHTML = allModules.map(moduleCode => {
                const info = moduleInfo[moduleCode];
                const isRequired = modulesRequired.includes(moduleCode);
                
                return \`
                    <label class="border-2 rounded-lg p-4 cursor-pointer hover:bg-\${info.color}-50 transition flex items-center">
                        <input type="checkbox" name="modules" value="\${moduleCode}" 
                            \${isRequired ? 'checked disabled' : ''}
                            onchange="updateSelectedModules()"
                            class="w-5 h-5 mr-3">
                        <i class="fas \${info.icon} text-2xl text-\${info.color}-600 mr-3"></i>
                        <div class="flex-1">
                            <div class="font-bold">\${info.name}</div>
                            <div class="text-xs text-gray-600">\${isRequired ? 'Requis' : 'Optionnel'}</div>
                        </div>
                    </label>
                \`;
            }).join('');
            
            // Initialiser modules sélectionnés avec les requis
            selectedModules = [...modulesRequired];
            
            // Afficher weights si template custom
            if (selectedTemplate.template_code === 'custom') {
                document.getElementById('customWeights').classList.remove('hidden');
                displayCustomWeights();
            } else {
                document.getElementById('customWeights').classList.add('hidden');
            }
        }

        // Afficher inputs de pondérations personnalisées
        function displayCustomWeights() {
            const container = document.getElementById('weightsInputs');
            const moduleInfo = {
                'el': 'EL',
                'thermal': 'Thermal',
                'iv_curves': 'IV',
                'visual': 'Visual',
                'isolation': 'Isolation'
            };
            
            container.innerHTML = selectedModules.map(moduleCode => \`
                <div>
                    <label class="block text-sm font-semibold mb-1">\${moduleInfo[moduleCode]}</label>
                    <input type="number" id="weight_\${moduleCode}" min="0" max="100" step="1" value="0"
                        onchange="validateWeights()"
                        class="w-full px-3 py-2 border-2 rounded-lg focus:border-green-500">
                    <div class="text-xs text-gray-500 mt-1">%</div>
                </div>
            \`).join('');
        }

        // Mettre à jour modules sélectionnés
        function updateSelectedModules() {
            const checkboxes = document.querySelectorAll('input[name="modules"]:checked');
            selectedModules = Array.from(checkboxes).map(cb => cb.value);
            
            if (selectedTemplate.template_code === 'custom') {
                displayCustomWeights();
            }
            
            // Réinitialiser disponibilité
            document.getElementById('dataAvailability').innerHTML = '';
            dataAvailable = false;
            document.getElementById('generateBtn').disabled = true;
        }

        // Valider pondérations (total = 100%)
        function validateWeights() {
            let total = 0;
            selectedModules.forEach(moduleCode => {
                const input = document.getElementById(\`weight_\${moduleCode}\`);
                total += parseFloat(input.value || 0);
            });
            
            if (Math.abs(total - 100) > 0.01) {
                alert(\`Total des pondérations: \${total.toFixed(1)}%. Doit être égal à 100%.\`);
                return false;
            }
            return true;
        }

        // Vérifier disponibilité des données
        async function checkDataAvailability() {
            const plantId = document.getElementById('plantId').value;
            
            if (!plantId) {
                alert('Veuillez sélectionner une centrale');
                return;
            }
            
            if (selectedModules.length === 0) {
                alert('Veuillez sélectionner au moins un module');
                return;
            }
            
            try {
                const response = await axios.post('/api/report/custom/check-availability', {
                    plant_id: parseInt(plantId),
                    modules_selected: selectedModules
                });
                
                const data = response.data;
                const container = document.getElementById('dataAvailability');
                
                const modulesHTML = data.modules.map(m => {
                    const statusIcon = m.available ? '<i class="fas fa-check-circle text-green-600"></i>' : '<i class="fas fa-times-circle text-red-600"></i>';
                    const bgColor = m.available ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
                    
                    return \`
                        <div class="flex items-center justify-between p-4 border-2 rounded-lg \${bgColor}">
                            <div class="flex items-center">
                                \${statusIcon}
                                <span class="ml-3 font-semibold">\${m.module_code.toUpperCase()}</span>
                            </div>
                            <div class="text-sm text-gray-700">\${m.message}</div>
                        </div>
                    \`;
                }).join('');
                
                container.innerHTML = \`
                    <div class="bg-gray-50 border-2 border-gray-200 rounded-lg p-6">
                        <h3 class="font-bold text-lg mb-4">Centrale: \${data.plant_name}</h3>
                        <div class="space-y-2">
                            \${modulesHTML}
                        </div>
                        <div class="mt-4 text-center">
                            \${data.ready_to_generate 
                                ? '<div class="text-green-600 font-bold"><i class="fas fa-check-circle mr-2"></i>Toutes les données sont disponibles</div>'
                                : '<div class="text-red-600 font-bold"><i class="fas fa-exclamation-triangle mr-2"></i>Certaines données manquent</div>'
                            }
                        </div>
                    </div>
                \`;
                
                dataAvailable = data.ready_to_generate;
                document.getElementById('generateBtn').disabled = !dataAvailable;
                
            } catch (error) {
                console.error('Error checking availability:', error);
                alert('Erreur lors de la vérification des données');
            }
        }

        // Générer rapport
        document.getElementById('reportBuilderForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!dataAvailable) {
                alert('Veuillez vérifier la disponibilité des données avant de générer');
                return;
            }
            
            if (selectedTemplate.template_code === 'custom' && !validateWeights()) {
                return;
            }
            
            const formData = {
                template_code: selectedTemplate.template_code,
                plant_id: parseInt(document.getElementById('plantId').value),
                modules_selected: selectedModules,
                report_title: document.getElementById('reportTitle').value,
                client_name: document.getElementById('clientName').value,
                audit_date: document.getElementById('auditDate').value,
                auditor_name: document.getElementById('auditorName').value
            };
            
            // Ajouter weights si custom
            if (selectedTemplate.template_code === 'custom') {
                const weights = {};
                selectedModules.forEach(moduleCode => {
                    const value = parseFloat(document.getElementById(\`weight_\${moduleCode}\`).value);
                    weights[moduleCode] = value / 100; // Convertir en décimal
                });
                formData.custom_weights = weights;
            }
            
            try {
                document.getElementById('generateBtn').disabled = true;
                document.getElementById('generateBtn').innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Génération en cours...';
                
                const response = await axios.post('/api/report/custom/generate', formData);
                
                if (response.data.success) {
                    showResult({
                        success: true,
                        reportToken: response.data.report_token,
                        conformity: response.data.overall_conformity_rate
                    });
                } else {
                    showResult({ success: false, error: response.data.error });
                }
            } catch (error) {
                console.error('Error generating report:', error);
                showResult({ success: false, error: error.response?.data?.error || 'Erreur lors de la génération' });
            } finally {
                document.getElementById('generateBtn').disabled = false;
                document.getElementById('generateBtn').innerHTML = '<i class="fas fa-magic mr-2"></i>Générer le Rapport';
            }
        });

        // Afficher résultat
        function showResult(result) {
            const modal = document.getElementById('resultModal');
            const content = document.getElementById('resultContent');
            
            if (result.success) {
                content.innerHTML = \`
                    <div class="text-center">
                        <i class="fas fa-check-circle text-green-600 text-6xl mb-4"></i>
                        <h2 class="text-2xl font-bold mb-4">Rapport Généré avec Succès</h2>
                        <div class="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-4">
                            <div class="text-gray-700 mb-2">Token: <code class="bg-gray-100 px-2 py-1 rounded">\${result.reportToken}</code></div>
                            <div class="text-gray-700">Conformité Globale: <span class="text-3xl font-black text-green-600">\${result.conformity.toFixed(1)}%</span></div>
                        </div>
                        <div class="flex gap-4 justify-center">
                            <a href="/api/report/unified/\${result.reportToken}" target="_blank"
                                class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold">
                                <i class="fas fa-eye mr-2"></i>Voir le Rapport
                            </a>
                            <a href="/rapports"
                                class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold">
                                <i class="fas fa-list mr-2"></i>Liste des Rapports
                            </a>
                            <button onclick="closeModal()" class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-bold">
                                <i class="fas fa-times mr-2"></i>Fermer
                            </button>
                        </div>
                    </div>
                \`;
            } else {
                content.innerHTML = \`
                    <div class="text-center">
                        <i class="fas fa-exclamation-triangle text-red-600 text-6xl mb-4"></i>
                        <h2 class="text-2xl font-bold mb-4">Erreur de Génération</h2>
                        <div class="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-4">
                            <div class="text-red-700">\${result.error}</div>
                        </div>
                        <button onclick="closeModal()" class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-bold">
                            <i class="fas fa-times mr-2"></i>Fermer
                        </button>
                    </div>
                \`;
            }
            
            modal.classList.remove('hidden');
        }

        function closeModal() {
            document.getElementById('resultModal').classList.add('hidden');
        }

        // Charger centrales
        async function loadPlants() {
            try {
                const response = await axios.get('/api/plants/list');
                const select = document.getElementById('plantId');
                select.innerHTML = '<option value="">Sélectionner...</option>' + 
                    response.data.plants.map(p => \`<option value="\${p.id}">\${p.name} (\${p.power_kwp} kWp)</option>\`).join('');
            } catch (error) {
                console.error('Error loading plants:', error);
            }
        }

        // Initialisation
        window.addEventListener('DOMContentLoaded', () => {
            loadTemplates();
            loadPlants();
        });
    </script>
</body>
</html>
`;
}
