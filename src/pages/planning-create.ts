// Page Création Intervention - Selects Dynamiques CRM → Projets → Techniciens
// Détection conflits temps réel + Validation complète

export function getPlanningCreatePage() {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nouvelle Intervention - Planning DiagPV</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        body { background: #f8fafc; }
        .loading-spinner {
            border: 3px solid #f3f4f6;
            border-top: 3px solid #3b82f6;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            animation: spin 0.6s linear infinite;
            display: inline-block;
            margin-left: 8px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .conflict-warning {
            animation: pulse-warning 2s infinite;
        }
        @keyframes pulse-warning {
            0%, 100% { background: #fef3c7; }
            50% { background: #fde68a; }
        }
        .select-with-icon {
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E");
            background-position: right 0.5rem center;
            background-repeat: no-repeat;
            background-size: 1.5em 1.5em;
            padding-right: 2.5rem;
        }
    </style>
</head>
<body class="min-h-screen">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4">
                    <a href="/planning" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-arrow-left"></i>
                    </a>
                    <h1 class="text-2xl font-bold text-gray-900">
                        <i class="fas fa-plus-circle text-blue-600 mr-2"></i>
                        Nouvelle Intervention
                    </h1>
                </div>
            </div>
        </div>
    </header>

    <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <!-- Formulaire Création -->
        <form id="createInterventionForm" class="bg-white rounded-lg shadow-sm p-8 space-y-6">
            
            <!-- Sélection Client CRM (Étape 1) -->
            <div>
                <label for="client_id" class="block text-sm font-semibold text-gray-900 mb-2">
                    <i class="fas fa-building text-blue-600 mr-2"></i>
                    1. Sélectionner le client
                </label>
                <select 
                    id="client_id" 
                    name="client_id"
                    required
                    class="select-with-icon w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                >
                    <option value="">-- Chargement clients CRM... --</option>
                </select>
                <p class="mt-1 text-sm text-gray-500">Les clients sont chargés depuis le CRM</p>
            </div>

            <!-- Sélection Projet (Étape 2 - Désactivé par défaut) -->
            <div>
                <label for="project_id" class="block text-sm font-semibold text-gray-900 mb-2">
                    <i class="fas fa-solar-panel text-green-600 mr-2"></i>
                    2. Sélectionner le projet / centrale PV
                </label>
                <select 
                    id="project_id" 
                    name="project_id"
                    required
                    disabled
                    class="select-with-icon w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                    <option value="">-- Sélectionnez d'abord un client --</option>
                </select>
                <p class="mt-1 text-sm text-gray-500">Les projets du client sélectionné apparaîtront ici</p>
                
                <!-- Info Projet (apparaît après sélection) -->
                <div id="project-info" class="hidden mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div class="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <span class="font-semibold text-gray-700">Localisation :</span>
                            <span id="project-location" class="text-gray-600"></span>
                        </div>
                        <div>
                            <span class="font-semibold text-gray-700">Puissance :</span>
                            <span id="project-power" class="text-gray-600"></span>
                        </div>
                        <div>
                            <span class="font-semibold text-gray-700">Nb modules :</span>
                            <span id="project-modules" class="text-gray-600"></span>
                        </div>
                        <div>
                            <span class="font-semibold text-gray-700">Statut :</span>
                            <span id="project-status" class="text-gray-600"></span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Type d'intervention -->
            <div>
                <label for="intervention_type" class="block text-sm font-semibold text-gray-900 mb-2">
                    <i class="fas fa-tasks text-purple-600 mr-2"></i>
                    3. Type d'intervention
                </label>
                <select 
                    id="intervention_type" 
                    name="intervention_type"
                    required
                    class="select-with-icon w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                >
                    <option value="">-- Choisir le type --</option>
                    <option value="el_audit">🌙 Audit Électroluminescence (EL)</option>
                    <option value="iv_test">📊 Test Courbes I-V</option>
                    <option value="thermography">🌡️ Thermographie IR</option>
                    <option value="visual_inspection">👁️ Inspection Visuelle</option>
                    <option value="isolation_test">⚡ Test Isolation</option>
                    <option value="commissioning">✅ Commissioning</option>
                    <option value="maintenance">🔧 Maintenance</option>
                    <option value="post_incident">🚨 Expertise Post-Sinistre</option>
                </select>
            </div>

            <!-- Date et Durée -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label for="intervention_date" class="block text-sm font-semibold text-gray-900 mb-2">
                        <i class="fas fa-calendar text-orange-600 mr-2"></i>
                        4. Date d'intervention
                    </label>
                    <input 
                        type="date" 
                        id="intervention_date" 
                        name="intervention_date"
                        required
                        min="${new Date().toISOString().split('T')[0]}"
                        class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                    <p class="mt-1 text-sm text-gray-500">Date planifiée pour l'intervention</p>
                </div>

                <div>
                    <label for="duration_hours" class="block text-sm font-semibold text-gray-900 mb-2">
                        <i class="fas fa-clock text-blue-600 mr-2"></i>
                        Durée estimée (heures)
                    </label>
                    <input 
                        type="number" 
                        id="duration_hours" 
                        name="duration_hours"
                        min="0.5"
                        step="0.5"
                        value="4"
                        class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                    <p class="mt-1 text-sm text-gray-500">Durée estimée en heures</p>
                </div>
            </div>

            <!-- Sélection Technicien (Étape 5 - Désactivé par défaut) -->
            <div>
                <label for="technician_id" class="block text-sm font-semibold text-gray-900 mb-2">
                    <i class="fas fa-user-hard-hat text-green-600 mr-2"></i>
                    5. Attribuer à un technicien (optionnel)
                </label>
                <select 
                    id="technician_id" 
                    name="technician_id"
                    disabled
                    class="select-with-icon w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                    <option value="">-- Sélectionnez une date d'abord --</option>
                </select>
                <p class="mt-1 text-sm text-gray-500">Techniciens disponibles pour la date sélectionnée</p>
                
                <!-- Warning Conflits -->
                <div id="conflicts-warning" class="hidden mt-3 p-4 conflict-warning rounded-lg border-2 border-yellow-500">
                    <div class="flex items-start space-x-3">
                        <i class="fas fa-exclamation-triangle text-yellow-700 text-xl mt-1"></i>
                        <div class="flex-1">
                            <h4 class="font-semibold text-yellow-900">⚠️ Conflit détecté</h4>
                            <p id="conflicts-message" class="text-sm text-yellow-800 mt-1"></p>
                            <ul id="conflicts-list" class="mt-2 space-y-1 text-sm text-yellow-800"></ul>
                            <p class="mt-2 text-xs text-yellow-700 italic">Vous pouvez continuer l'assignation malgré le conflit.</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Description / Notes -->
            <div>
                <label for="description" class="block text-sm font-semibold text-gray-900 mb-2">
                    <i class="fas fa-comment-alt text-gray-600 mr-2"></i>
                    Description / Consignes (optionnel)
                </label>
                <textarea 
                    id="description" 
                    name="description"
                    rows="4"
                    placeholder="Détails, consignes de sécurité, équipements nécessaires..."
                    class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                ></textarea>
            </div>

            <!-- Boutons -->
            <div class="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                <a href="/planning" class="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition">
                    <i class="fas fa-times mr-2"></i>
                    Annuler
                </a>
                <button 
                    type="submit" 
                    class="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition shadow-md hover:shadow-lg"
                >
                    <i class="fas fa-save mr-2"></i>
                    Créer l'intervention
                </button>
            </div>
        </form>

    </main>

    <script>
        // ============================================================================
        // GESTION DYNAMIQUE FORMULAIRE CRÉATION INTERVENTION
        // ============================================================================

        let selectedClientId = null;
        let selectedProjectId = null;
        let selectedDate = null;
        let selectedTechnicianId = null;

        // ============================================================================
        // ÉTAPE 1 : CHARGEMENT CLIENTS CRM
        // ============================================================================
        async function loadClients() {
            try {
                const response = await fetch('/api/crm/clients');
                const data = await response.json();
                
                const select = document.getElementById('client_id');
                select.innerHTML = '<option value="">-- Sélectionner un client --</option>';
                
                if (data.success && data.clients && data.clients.length > 0) {
                    data.clients.forEach(client => {
                        const option = document.createElement('option');
                        option.value = client.id;
                        option.textContent = \`\${client.company_name}\${client.contact_name ? ' - ' + client.contact_name : ''}\`;
                        select.appendChild(option);
                    });
                } else {
                    select.innerHTML = '<option value="">-- Aucun client disponible --</option>';
                }
            } catch (error) {
                console.error('Erreur chargement clients:', error);
                document.getElementById('client_id').innerHTML = '<option value="">❌ Erreur chargement clients</option>';
            }
        }

        // ============================================================================
        // ÉTAPE 2 : CHARGEMENT PROJETS DU CLIENT
        // ============================================================================
        async function loadProjects(clientId) {
            selectedClientId = clientId;
            const projectSelect = document.getElementById('project_id');
            
            if (!clientId) {
                projectSelect.disabled = true;
                projectSelect.innerHTML = '<option value="">-- Sélectionnez d\'abord un client --</option>';
                document.getElementById('project-info').classList.add('hidden');
                return;
            }

            try {
                projectSelect.disabled = true;
                projectSelect.innerHTML = '<option value="">⏳ Chargement projets...</option>';

                const response = await fetch(\`/api/crm/clients/\${clientId}/projects\`);
                const data = await response.json();
                
                projectSelect.innerHTML = '<option value="">-- Sélectionner un projet --</option>';
                
                if (data.success && data.projects && data.projects.length > 0) {
                    data.projects.forEach(project => {
                        const option = document.createElement('option');
                        option.value = project.id;
                        option.textContent = \`\${project.name} - \${project.site_address || 'Localisation non renseignée'}\`;
                        option.dataset.project = JSON.stringify(project);
                        projectSelect.appendChild(option);
                    });
                    projectSelect.disabled = false;
                } else {
                    projectSelect.innerHTML = '<option value="">-- Aucun projet pour ce client --</option>';
                }
            } catch (error) {
                console.error('Erreur chargement projets:', error);
                projectSelect.innerHTML = '<option value="">❌ Erreur chargement projets</option>';
            }
        }

        // ============================================================================
        // AFFICHAGE INFOS PROJET
        // ============================================================================
        function displayProjectInfo(projectId) {
            selectedProjectId = projectId;
            const projectSelect = document.getElementById('project_id');
            const selectedOption = projectSelect.options[projectSelect.selectedIndex];
            
            if (!projectId || !selectedOption.dataset.project) {
                document.getElementById('project-info').classList.add('hidden');
                return;
            }

            try {
                const project = JSON.parse(selectedOption.dataset.project);
                
                document.getElementById('project-location').textContent = project.site_address || 'N/A';
                document.getElementById('project-power').textContent = project.installed_power_kwc ? project.installed_power_kwc + ' kWc' : 'N/A';
                document.getElementById('project-modules').textContent = project.module_count || 'N/A';
                document.getElementById('project-status').textContent = project.status || 'N/A';
                
                document.getElementById('project-info').classList.remove('hidden');
            } catch (error) {
                console.error('Erreur affichage infos projet:', error);
            }
        }

        // ============================================================================
        // ÉTAPE 5 : CHARGEMENT TECHNICIENS DISPONIBLES + CONFLITS
        // ============================================================================
        async function loadAvailableTechnicians(date) {
            selectedDate = date;
            const techSelect = document.getElementById('technician_id');
            const conflictsWarning = document.getElementById('conflicts-warning');
            
            if (!date) {
                techSelect.disabled = true;
                techSelect.innerHTML = '<option value="">-- Sélectionnez une date d\'abord --</option>';
                conflictsWarning.classList.add('hidden');
                return;
            }

            try {
                techSelect.disabled = true;
                techSelect.innerHTML = '<option value="">⏳ Chargement techniciens...</option>';
                conflictsWarning.classList.add('hidden');

                const response = await fetch(\`/api/planning/technicians/available?date=\${date}\`);
                const data = await response.json();
                
                techSelect.innerHTML = '<option value="">-- Non assigné (attribution ultérieure) --</option>';
                
                if (data.success && data.technicians && data.technicians.length > 0) {
                    data.technicians.forEach(tech => {
                        const option = document.createElement('option');
                        option.value = tech.id;
                        option.textContent = \`\${tech.email}\${tech.conflict_count > 0 ? ' ⚠️ (' + tech.conflict_count + ' conflit' + (tech.conflict_count > 1 ? 's' : '') + ')' : ''}\`;
                        option.dataset.conflicts = JSON.stringify(tech.conflicts || []);
                        option.dataset.conflictCount = tech.conflict_count || 0;
                        techSelect.appendChild(option);
                    });
                    techSelect.disabled = false;
                } else {
                    techSelect.innerHTML = '<option value="">-- Aucun technicien disponible --</option>';
                }
            } catch (error) {
                console.error('Erreur chargement techniciens:', error);
                techSelect.innerHTML = '<option value="">❌ Erreur chargement techniciens</option>';
            }
        }

        // ============================================================================
        // AFFICHAGE CONFLITS TECHNICIEN
        // ============================================================================
        function displayTechnicianConflicts(technicianId) {
            selectedTechnicianId = technicianId;
            const techSelect = document.getElementById('technician_id');
            const selectedOption = techSelect.options[techSelect.selectedIndex];
            const conflictsWarning = document.getElementById('conflicts-warning');
            
            if (!technicianId || !selectedOption.dataset.conflicts) {
                conflictsWarning.classList.add('hidden');
                return;
            }

            try {
                const conflicts = JSON.parse(selectedOption.dataset.conflicts);
                const conflictCount = parseInt(selectedOption.dataset.conflictCount || 0);
                
                if (conflictCount === 0 || conflicts.length === 0) {
                    conflictsWarning.classList.add('hidden');
                    return;
                }

                // Afficher warning
                document.getElementById('conflicts-message').textContent = 
                    \`Ce technicien a déjà \${conflictCount} intervention\${conflictCount > 1 ? 's' : ''} planifiée\${conflictCount > 1 ? 's' : ''} le \${selectedDate} :\`;
                
                const conflictsList = document.getElementById('conflicts-list');
                conflictsList.innerHTML = '';
                conflicts.forEach(conflict => {
                    const li = document.createElement('li');
                    li.textContent = \`• \${conflict.intervention_type} (\${conflict.duration_hours || '?'}h) - Statut: \${conflict.status}\`;
                    conflictsList.appendChild(li);
                });
                
                conflictsWarning.classList.remove('hidden');
            } catch (error) {
                console.error('Erreur affichage conflits:', error);
            }
        }

        // ============================================================================
        // EVENT LISTENERS - SELECTS CASCADES
        // ============================================================================
        
        // Client sélectionné → Charge projets
        document.getElementById('client_id').addEventListener('change', (e) => {
            loadProjects(e.target.value);
        });

        // Projet sélectionné → Affiche infos
        document.getElementById('project_id').addEventListener('change', (e) => {
            displayProjectInfo(e.target.value);
        });

        // Date sélectionnée → Charge techniciens disponibles
        document.getElementById('intervention_date').addEventListener('change', (e) => {
            loadAvailableTechnicians(e.target.value);
        });

        // Technicien sélectionné → Affiche conflits
        document.getElementById('technician_id').addEventListener('change', (e) => {
            displayTechnicianConflicts(e.target.value);
        });

        // ============================================================================
        // SOUMISSION FORMULAIRE
        // ============================================================================
        document.getElementById('createInterventionForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = {
                project_id: parseInt(document.getElementById('project_id').value),
                technician_id: document.getElementById('technician_id').value ? parseInt(document.getElementById('technician_id').value) : null,
                intervention_type: document.getElementById('intervention_type').value,
                intervention_date: document.getElementById('intervention_date').value,
                duration_hours: parseFloat(document.getElementById('duration_hours').value) || null,
                description: document.getElementById('description').value || null,
                status: 'scheduled'
            };

            // Validation
            if (!formData.project_id || !formData.intervention_type || !formData.intervention_date) {
                alert('❌ Veuillez remplir tous les champs obligatoires (projet, type, date)');
                return;
            }

            try {
                const submitBtn = e.target.querySelector('button[type="submit"]');
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Création en cours...';

                const response = await fetch('/api/planning/interventions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();

                if (data.success) {
                    alert(\`✅ Intervention créée avec succès !\${data.intervention.technician_id ? '\\nTechnicien assigné.' : '\\nIntervention non assignée.'}\`);
                    window.location.href = '/planning';
                } else {
                    alert('❌ Erreur : ' + (data.error || 'Erreur inconnue'));
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-save mr-2"></i>Créer l\'intervention';
                }
            } catch (error) {
                console.error('Erreur création intervention:', error);
                alert('❌ Erreur réseau : ' + error.message);
                const submitBtn = e.target.querySelector('button[type="submit"]');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-save mr-2"></i>Créer l\'intervention';
            }
        });

        // ============================================================================
        // INITIALISATION
        // ============================================================================
        document.addEventListener('DOMContentLoaded', () => {
            loadClients();
        });
    </script>
</body>
</html>
  `;
}
