// Page Créer Projet/Site CRM - Formulaire création site lié à client
// Validation, sauvegarde et redirection vers détail

export function getCrmProjectsCreatePage() {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Créer Site/Projet - CRM DiagPV</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        body { background: #f8fafc; }
        .form-section { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); padding: 24px; margin-bottom: 24px; }
        .form-group { margin-bottom: 20px; }
        .form-label { display: block; font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 6px; }
        .form-input { width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; }
        .form-input:focus { outline: none; border-color: #2563eb; ring: 2px; ring-color: #93c5fd; }
        .form-select { width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; }
        .form-textarea { width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; min-height: 100px; }
        .required { color: #dc2626; }
        .error-message { color: #dc2626; font-size: 12px; margin-top: 4px; display: none; }
        .info-banner { background: #eff6ff; border-left: 4px solid #2563eb; padding: 12px 16px; border-radius: 4px; margin-bottom: 20px; }
    </style>
</head>
<body class="min-h-screen">

    <!-- Header -->
    <header class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4">
                    <a href="/crm/projects" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-arrow-left"></i>
                    </a>
                    <h1 class="text-2xl font-bold text-gray-900">
                        <i class="fas fa-solar-panel text-blue-600 mr-2"></i>
                        Créer un Site / Projet
                    </h1>
                </div>
            </div>
        </div>
    </header>

    <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <!-- Client Info Banner (if client_id provided) -->
        <div id="client-info-banner" class="info-banner" style="display: none;">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-semibold text-blue-900">Site créé pour le client :</p>
                    <p id="client-info-name" class="text-lg font-bold text-blue-900"></p>
                </div>
                <a id="change-client-btn" href="/crm/projects/create" class="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    Changer de client
                </a>
            </div>
        </div>

        <form id="create-project-form">

            <!-- Client Selection -->
            <div class="form-section">
                <h2 class="text-lg font-semibold text-gray-900 mb-4">
                    <i class="fas fa-building text-blue-600 mr-2"></i>
                    Client Associé
                </h2>
                
                <div class="form-group">
                    <label for="client_id" class="form-label">
                        Sélectionner le client <span class="required">*</span>
                    </label>
                    <select id="client_id" class="form-select" required>
                        <option value="">-- Choisir un client --</option>
                    </select>
                    <p class="error-message" id="error-client_id">Veuillez sélectionner un client</p>
                </div>
            </div>

            <!-- Site Information -->
            <div class="form-section">
                <h2 class="text-lg font-semibold text-gray-900 mb-4">
                    <i class="fas fa-info-circle text-blue-600 mr-2"></i>
                    Informations du Site
                </h2>
                
                <div class="grid grid-cols-1 gap-4">
                    <div class="form-group">
                        <label for="project_name" class="form-label">
                            Nom du site / projet <span class="required">*</span>
                        </label>
                        <input type="text" id="project_name" class="form-input" required 
                               placeholder="Centrale PV Toulouse Sud">
                        <p class="error-message" id="error-project_name">Ce champ est requis</p>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="form-group">
                            <label for="total_power_kwp" class="form-label">
                                Puissance totale (kWp)
                            </label>
                            <input type="number" id="total_power_kwp" class="form-input" step="0.01" 
                                   placeholder="250.5">
                        </div>

                        <div class="form-group">
                            <label for="module_count" class="form-label">
                                Nombre de modules
                            </label>
                            <input type="number" id="module_count" class="form-input" 
                                   placeholder="1000">
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="form-group">
                            <label for="module_type" class="form-label">
                                Type de module
                            </label>
                            <input type="text" id="module_type" class="form-input" 
                                   placeholder="Mono-PERC, Poly, BiF...">
                        </div>

                        <div class="form-group">
                            <label for="inverter_type" class="form-label">
                                Type d'onduleur
                            </label>
                            <input type="text" id="inverter_type" class="form-input" 
                                   placeholder="String, Micro, Central...">
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="installation_date" class="form-label">
                            Date d'installation (mise en service)
                        </label>
                        <input type="date" id="installation_date" class="form-input">
                    </div>

                    <div class="form-group">
                        <label for="status" class="form-label">
                            Statut du projet <span class="required">*</span>
                        </label>
                        <select id="status" class="form-select" required>
                            <option value="active">Actif</option>
                            <option value="completed">Terminé</option>
                            <option value="pending">En attente</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Configuration PV Détaillée -->
            <div class="form-section">
                <h2 class="text-lg font-semibold text-gray-900 mb-4">
                    <i class="fas fa-cog text-blue-600 mr-2"></i>
                    Configuration PV Détaillée (Compatible Module EL)
                </h2>
                
                <div class="grid grid-cols-1 gap-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="form-group">
                            <label for="inverter_count" class="form-label">
                                Nombre d'onduleurs
                            </label>
                            <input type="number" id="inverter_count" class="form-input" 
                                   placeholder="2" min="0">
                        </div>

                        <div class="form-group">
                            <label for="inverter_brand" class="form-label">
                                Marque/Modèle onduleur
                            </label>
                            <input type="text" id="inverter_brand" class="form-input" 
                                   placeholder="Huawei SUN2000-100KTL">
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="junction_box_count" class="form-label">
                            Nombre de boîtes de jonction (BJ)
                        </label>
                        <input type="number" id="junction_box_count" class="form-input" 
                               placeholder="4" min="0">
                    </div>

                    <!-- Configuration Strings -->
                    <div class="border border-gray-300 rounded-lg p-4 bg-gray-50">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-md font-semibold text-gray-900">
                                <i class="fas fa-list-ol mr-2"></i>
                                Configuration Strings par MPPT
                            </h3>
                            <button type="button" id="btnAddString" class="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                                <i class="fas fa-plus mr-1"></i>
                                Ajouter String
                            </button>
                        </div>
                        <p class="text-xs text-gray-600 mb-3">
                            <i class="fas fa-info-circle mr-1"></i>
                            Cette configuration sera automatiquement utilisée lors de la création d'audits EL
                        </p>
                        <div id="stringsContainer" class="space-y-2">
                            <!-- Strings dynamiques -->
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="technical_notes" class="form-label">Notes techniques</label>
                        <textarea id="technical_notes" class="form-textarea" 
                                  placeholder="Notes sur la configuration électrique, particularités..."></textarea>
                    </div>
                </div>
            </div>

            <!-- Address -->
            <div class="form-section">
                <h2 class="text-lg font-semibold text-gray-900 mb-4">
                    <i class="fas fa-map-marker-alt text-blue-600 mr-2"></i>
                    Localisation du Site
                </h2>
                
                <div class="grid grid-cols-1 gap-4">
                    <div class="form-group">
                        <label for="address_street" class="form-label">Adresse</label>
                        <input type="text" id="address_street" class="form-input" 
                               placeholder="123 Chemin du Soleil">
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="form-group">
                            <label for="address_postal_code" class="form-label">Code postal</label>
                            <input type="text" id="address_postal_code" class="form-input" 
                                   maxlength="5" placeholder="31000">
                        </div>

                        <div class="form-group md:col-span-2">
                            <label for="address_city" class="form-label">Ville</label>
                            <input type="text" id="address_city" class="form-input" 
                                   placeholder="Toulouse">
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="form-group">
                            <label for="gps_latitude" class="form-label">Latitude GPS</label>
                            <input type="text" id="gps_latitude" class="form-input" 
                                   placeholder="43.6047" pattern="^-?[0-9]{1,3}\\.[0-9]+$">
                        </div>

                        <div class="form-group">
                            <label for="gps_longitude" class="form-label">Longitude GPS</label>
                            <input type="text" id="gps_longitude" class="form-input" 
                                   placeholder="1.4442" pattern="^-?[0-9]{1,3}\\.[0-9]+$">
                        </div>
                    </div>
                </div>
            </div>

            <!-- Notes -->
            <div class="form-section">
                <h2 class="text-lg font-semibold text-gray-900 mb-4">
                    <i class="fas fa-sticky-note text-blue-600 mr-2"></i>
                    Notes et Remarques
                </h2>
                
                <div class="form-group">
                    <label for="notes" class="form-label">Notes internes</label>
                    <textarea id="notes" class="form-textarea" 
                              placeholder="Informations complémentaires sur le site..."></textarea>
                </div>
            </div>

            <!-- Actions -->
            <div class="flex justify-end space-x-3">
                <a href="/crm/projects" class="border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg font-medium transition">
                    Annuler
                </a>
                <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition">
                    <i class="fas fa-save mr-2"></i>
                    Créer le site
                </button>
            </div>

        </form>

    </main>

    <script>
        const urlParams = new URLSearchParams(window.location.search);
        const preselectedClientId = urlParams.get('client_id');

        // Load clients and populate select
        async function loadClients() {
            const response = await fetch('/api/crm/clients');
            if (!response.ok) {
                alert('Impossible de charger les clients');
                return;
            }

            const data = await response.json();
            const clients = data.clients || [];

            const select = document.getElementById('client_id');
            clients.forEach(client => {
                const option = document.createElement('option');
                option.value = client.id;
                option.textContent = client.company_name;
                if (preselectedClientId && client.id == preselectedClientId) {
                    option.selected = true;
                }
                select.appendChild(option);
            });

            // Show banner if client preselected
            if (preselectedClientId) {
                const selectedClient = clients.find(c => c.id == preselectedClientId);
                if (selectedClient) {
                    document.getElementById('client-info-banner').style.display = 'block';
                    document.getElementById('client-info-name').textContent = selectedClient.company_name;
                    document.getElementById('client_id').disabled = true;
                }
            }
        }

        // Form validation
        function validateForm() {
            let isValid = true;

            // Client required
            const clientId = document.getElementById('client_id');
            if (!clientId.value) {
                document.getElementById('error-client_id').style.display = 'block';
                clientId.style.borderColor = '#dc2626';
                isValid = false;
            } else {
                document.getElementById('error-client_id').style.display = 'none';
                clientId.style.borderColor = '#d1d5db';
            }

            // Project name required
            const projectName = document.getElementById('project_name');
            if (!projectName.value.trim()) {
                document.getElementById('error-project_name').style.display = 'block';
                projectName.style.borderColor = '#dc2626';
                isValid = false;
            } else {
                document.getElementById('error-project_name').style.display = 'none';
                projectName.style.borderColor = '#d1d5db';
            }

            return isValid;
        }

        // Form submission
        document.getElementById('create-project-form').addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!validateForm()) {
                alert('Veuillez corriger les erreurs dans le formulaire');
                return;
            }

            // Collecter configuration strings
            const stringsConfiguration = collectStringsConfiguration();

            const projectData = {
                client_id: parseInt(document.getElementById('client_id').value),
                project_name: document.getElementById('project_name').value.trim(),
                total_power_kwp: parseFloat(document.getElementById('total_power_kwp').value) || null,
                module_count: parseInt(document.getElementById('module_count').value) || null,
                module_type: document.getElementById('module_type').value.trim() || null,
                inverter_type: document.getElementById('inverter_type').value.trim() || null,
                installation_date: document.getElementById('installation_date').value || null,
                status: document.getElementById('status').value,
                address_street: document.getElementById('address_street').value.trim() || null,
                address_postal_code: document.getElementById('address_postal_code').value.trim() || null,
                address_city: document.getElementById('address_city').value.trim() || null,
                gps_latitude: parseFloat(document.getElementById('gps_latitude').value) || null,
                gps_longitude: parseFloat(document.getElementById('gps_longitude').value) || null,
                notes: document.getElementById('notes').value.trim() || null,
                // Configuration PV
                inverter_count: parseInt(document.getElementById('inverter_count').value) || null,
                inverter_brand: document.getElementById('inverter_brand').value.trim() || null,
                junction_box_count: parseInt(document.getElementById('junction_box_count').value) || null,
                strings_configuration: stringsConfiguration ? JSON.stringify(stringsConfiguration) : null,
                technical_notes: document.getElementById('technical_notes').value.trim() || null
            };

            try {
                const response = await fetch('/api/crm/projects', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(projectData)
                });

                const data = await response.json();

                if (data.success) {
                    alert('Site créé avec succès');
                    window.location.href = \`/crm/projects/detail?id=\${data.project.id}\`;
                } else {
                    alert('Erreur: ' + (data.error || 'Impossible de créer le site'));
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Erreur réseau. Veuillez réessayer.');
            }
        });

        // Gestion configuration strings dynamique
        let stringsConfig = [];
        let stringIdCounter = 1;

        function addStringRow() {
            const stringId = stringIdCounter++;
            const container = document.getElementById('stringsContainer');
            
            const stringDiv = document.createElement('div');
            stringDiv.id = \`string-\${stringId}\`;
            stringDiv.className = 'flex items-center gap-3 bg-white p-3 rounded border border-gray-200';
            stringDiv.innerHTML = \`
                <div class="flex-1 grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">MPPT/String #</label>
                        <input type="number" class="w-full px-3 py-2 border border-gray-300 rounded text-sm" 
                               id="mppt-\${stringId}" placeholder="1" min="1" value="\${stringId}">
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Modules</label>
                        <input type="number" class="w-full px-3 py-2 border border-gray-300 rounded text-sm" 
                               id="modules-\${stringId}" placeholder="20" min="1">
                    </div>
                </div>
                <button type="button" onclick="removeStringRow(\${stringId})" 
                        class="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm">
                    <i class="fas fa-trash"></i>
                </button>
            \`;
            container.appendChild(stringDiv);
            
            stringsConfig.push({ id: stringId });
        }

        window.removeStringRow = function(stringId) {
            const element = document.getElementById(\`string-\${stringId}\`);
            if (element) {
                element.remove();
                stringsConfig = stringsConfig.filter(s => s.id !== stringId);
            }
        }

        function collectStringsConfiguration() {
            const strings = [];
            stringsConfig.forEach(s => {
                const mpptInput = document.getElementById(\`mppt-\${s.id}\`);
                const modulesInput = document.getElementById(\`modules-\${s.id}\`);
                
                if (mpptInput && modulesInput && modulesInput.value) {
                    strings.push({
                        mpptNumber: parseInt(mpptInput.value) || 1,
                        moduleCount: parseInt(modulesInput.value) || 0,
                        id: s.id
                    });
                }
            });
            
            if (strings.length === 0) return null;
            
            return {
                mode: 'advanced',
                strings: strings
            };
        }

        // Event listeners
        document.getElementById('btnAddString').addEventListener('click', addStringRow);

        // Initialize
        loadClients();
    </script>

</body>
</html>
  `;
}
