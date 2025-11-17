// Page Détail Projet/Site CRM - Vue complète avec interventions et audits
// Navigation vers édition, suppression, création intervention

export function getCrmProjectsDetailPage() {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Détail Site - CRM DiagPV</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        body { background: #f8fafc; }
        .section-card { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; }
        .badge-active { background: #dcfce7; color: #166534; }
        .badge-completed { background: #dbeafe; color: #1e3a8a; }
        .badge-pending { background: #fef3c7; color: #92400e; }
        .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f3f4f6; }
        .info-row:last-child { border-bottom: none; }
        .intervention-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin-right: 4px; }
        .type-el { background: #fef3c7; color: #92400e; }
        .type-iv { background: #dbeafe; color: #1e3a8a; }
        .type-visuels { background: #e0e7ff; color: #3730a3; }
        .type-isolation { background: #fce7f3; color: #831843; }
        .modal { display: none; position: fixed; z-index: 50; left: 0; top: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); }
        .modal.active { display: flex; align-items: center; justify-content: center; }
        .modal-content { background: white; border-radius: 8px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto; }
    </style>
</head>
<body class="min-h-screen">

    <!-- Header -->
    <header class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4">
                    <a href="/crm/projects" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-arrow-left"></i>
                    </a>
                    <h1 class="text-2xl font-bold text-gray-900">
                        <i class="fas fa-solar-panel text-blue-600 mr-2"></i>
                        <span id="project-name">Chargement...</span>
                    </h1>
                    <span id="project-status-badge" class="badge"></span>
                </div>
                <div class="flex items-center space-x-3">
                    <button id="delete-project-btn" class="border border-red-300 hover:bg-red-50 text-red-700 px-4 py-2 rounded-lg font-medium transition">
                        <i class="fas fa-trash mr-2"></i>
                        Supprimer
                    </button>
                    <a id="edit-project-btn" href="#" class="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition">
                        <i class="fas fa-edit mr-2"></i>
                        Modifier
                    </a>
                    <a id="create-intervention-btn" href="/planning/create" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition">
                        <i class="fas fa-plus mr-2"></i>
                        Nouvelle Intervention
                    </a>
                </div>
            </div>
        </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <!-- Client Info Banner -->
        <div class="section-card p-4 mb-6 bg-blue-50 border-l-4 border-blue-600">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-blue-900">Client propriétaire :</p>
                    <a id="client-link" href="#" class="text-lg font-bold text-blue-600 hover:underline"></a>
                </div>
            </div>
        </div>

        <!-- Informations Techniques -->
        <div class="section-card p-6 mb-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">
                <i class="fas fa-info-circle text-blue-600 mr-2"></i>
                Informations Techniques
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                <div>
                    <div class="info-row">
                        <span class="text-gray-600">Nom du site</span>
                        <span id="info-project-name" class="font-medium text-gray-900"></span>
                    </div>
                    <div class="info-row">
                        <span class="text-gray-600">Puissance totale</span>
                        <span id="info-power" class="font-medium text-gray-900"></span>
                    </div>
                    <div class="info-row">
                        <span class="text-gray-600">Nombre de modules</span>
                        <span id="info-modules" class="font-medium text-gray-900"></span>
                    </div>
                </div>
                <div>
                    <div class="info-row">
                        <span class="text-gray-600">Type de module</span>
                        <span id="info-module-type" class="font-medium text-gray-900"></span>
                    </div>
                    <div class="info-row">
                        <span class="text-gray-600">Type d'onduleur</span>
                        <span id="info-inverter" class="font-medium text-gray-900"></span>
                    </div>
                    <div class="info-row">
                        <span class="text-gray-600">Date d'installation</span>
                        <span id="info-install-date" class="font-medium text-gray-900"></span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Localisation -->
        <div class="section-card p-6 mb-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">
                <i class="fas fa-map-marker-alt text-blue-600 mr-2"></i>
                Localisation
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                <div>
                    <div class="info-row">
                        <span class="text-gray-600">Adresse</span>
                        <span id="info-address" class="font-medium text-gray-900"></span>
                    </div>
                </div>
                <div>
                    <div class="info-row">
                        <span class="text-gray-600">Coordonnées GPS</span>
                        <span id="info-gps" class="font-medium text-gray-900"></span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Notes -->
        <div id="notes-section" class="section-card p-6 mb-6" style="display: none;">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">
                <i class="fas fa-sticky-note text-blue-600 mr-2"></i>
                Notes
            </h2>
            <p id="notes-content" class="text-gray-700 whitespace-pre-wrap"></p>
        </div>

        <!-- Interventions -->
        <div class="section-card p-6 mb-6">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-semibold text-gray-900">
                    <i class="fas fa-calendar-check text-blue-600 mr-2"></i>
                    Interventions sur ce site (<span id="interventions-count">0</span>)
                </h2>
                <a href="/planning/create" class="text-blue-600 hover:text-blue-700 font-medium">
                    <i class="fas fa-plus mr-1"></i>
                    Créer intervention
                </a>
            </div>
            <div id="interventions-list">
                <!-- Populated by JS -->
            </div>
        </div>

        <!-- Audits -->
        <div class="section-card p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">
                <i class="fas fa-clipboard-check text-blue-600 mr-2"></i>
                Audits réalisés (<span id="audits-count">0</span>)
            </h2>
            <div id="audits-list">
                <!-- Populated by JS -->
            </div>
        </div>

    </main>

    <!-- Modal Confirmation Suppression -->
    <div id="delete-modal" class="modal">
        <div class="modal-content">
            <div class="p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">
                    <i class="fas fa-exclamation-triangle text-red-600 mr-2"></i>
                    Confirmer la suppression
                </h3>
                <p class="text-gray-600 mb-6">
                    Êtes-vous sûr de vouloir supprimer ce site ? Cette action est irréversible et supprimera également :
                </p>
                <ul class="list-disc list-inside text-gray-600 mb-6 space-y-1">
                    <li>Toutes les interventions liées</li>
                    <li>Tous les audits associés</li>
                </ul>
                <div class="flex justify-end space-x-3">
                    <button id="cancel-delete-btn" class="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition">
                        Annuler
                    </button>
                    <button id="confirm-delete-btn" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition">
                        Supprimer définitivement
                    </button>
                </div>
            </div>
        </div>
    </div>

    <script>
        const urlParams = new URLSearchParams(window.location.search);
        const projectId = urlParams.get('id');

        if (!projectId) {
            alert('ID projet manquant');
            window.location.href = '/crm/projects';
        }

        let projectData = null;
        let clientData = null;
        let interventionsData = [];
        let auditsData = [];

        // Load all data
        async function init() {
            await loadProject();
            await Promise.all([
                loadClient(),
                loadInterventions(),
                loadAudits()
            ]);

            renderProjectInfo();
            renderInterventions();
            renderAudits();
        }

        async function loadProject() {
            const response = await fetch(\`/api/crm/projects/\${projectId}\`);
            if (!response.ok) {
                alert('Projet non trouvé');
                window.location.href = '/crm/projects';
                return;
            }
            const data = await response.json();
            projectData = data.project;
        }

        async function loadClient() {
            if (!projectData || !projectData.client_id) return;
            
            const response = await fetch(\`/api/crm/clients/\${projectData.client_id}\`);
            if (response.ok) {
                const data = await response.json();
                clientData = data.client;
            }
        }

        async function loadInterventions() {
            const response = await fetch(\`/api/planning/interventions?project_id=\${projectId}\`);
            if (response.ok) {
                const data = await response.json();
                interventionsData = data.interventions || [];
            }
        }

        async function loadAudits() {
            // Load all EL audits for this project's interventions
            const response = await fetch(\`/api/el/audits\`);
            if (response.ok) {
                const data = await response.json();
                const projectInterventionIds = interventionsData.map(i => i.id);
                auditsData = (data.audits || []).filter(a => 
                    projectInterventionIds.includes(a.intervention_id)
                );
            }
        }

        function renderProjectInfo() {
            // Header
            document.getElementById('project-name').textContent = projectData.project_name;
            const statusBadge = document.getElementById('project-status-badge');
            statusBadge.textContent = projectData.status.toUpperCase();
            statusBadge.className = 'badge badge-' + projectData.status;

            // Client banner
            if (clientData) {
                const clientLink = document.getElementById('client-link');
                clientLink.textContent = clientData.company_name;
                clientLink.href = \`/crm/clients/detail?id=\${clientData.id}\`;
            }

            // Technical info
            document.getElementById('info-project-name').textContent = projectData.project_name;
            document.getElementById('info-power').textContent = projectData.total_power_kwp ? projectData.total_power_kwp + ' kWp' : 'N/A';
            document.getElementById('info-modules').textContent = projectData.module_count || 'N/A';
            document.getElementById('info-module-type').textContent = projectData.module_type || 'N/A';
            document.getElementById('info-inverter').textContent = projectData.inverter_type || 'N/A';
            document.getElementById('info-install-date').textContent = projectData.installation_date ? 
                new Date(projectData.installation_date).toLocaleDateString('fr-FR') : 'N/A';

            // Location
            const address = [
                projectData.address_street,
                projectData.address_postal_code,
                projectData.address_city
            ].filter(Boolean).join(', ');
            document.getElementById('info-address').textContent = address || 'Non renseigné';

            const gps = projectData.gps_latitude && projectData.gps_longitude ? 
                \`\${projectData.gps_latitude}, \${projectData.gps_longitude}\` : 'N/A';
            document.getElementById('info-gps').textContent = gps;

            // Notes
            if (projectData.notes) {
                document.getElementById('notes-section').style.display = 'block';
                document.getElementById('notes-content').textContent = projectData.notes;
            }

            // Buttons
            document.getElementById('edit-project-btn').href = \`/crm/projects/edit?id=\${projectId}\`;
        }

        function renderInterventions() {
            const container = document.getElementById('interventions-list');
            document.getElementById('interventions-count').textContent = interventionsData.length;

            if (interventionsData.length === 0) {
                container.innerHTML = '<p class="text-gray-500 italic">Aucune intervention enregistrée</p>';
                return;
            }

            const sorted = [...interventionsData].sort((a, b) => 
                new Date(b.intervention_date) - new Date(a.intervention_date)
            );

            container.innerHTML = \`
                <table class="w-full">
                    <thead class="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Technicien</th>
                            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Statut</th>
                            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        \${sorted.map(intervention => \`
                            <tr class="border-b border-gray-100 hover:bg-gray-50">
                                <td class="px-4 py-3 text-sm">\${new Date(intervention.intervention_date).toLocaleDateString('fr-FR')}</td>
                                <td class="px-4 py-3">
                                    <span class="intervention-badge type-\${intervention.intervention_type}">
                                        \${intervention.intervention_type.toUpperCase()}
                                    </span>
                                </td>
                                <td class="px-4 py-3 text-sm">\${intervention.technician_name || 'Non assigné'}</td>
                                <td class="px-4 py-3 text-sm">\${intervention.status}</td>
                                <td class="px-4 py-3">
                                    <a href="/planning/detail?id=\${intervention.id}" class="text-blue-600 hover:text-blue-700 text-sm">
                                        Détails
                                    </a>
                                </td>
                            </tr>
                        \`).join('')}
                    </tbody>
                </table>
            \`;
        }

        function renderAudits() {
            const container = document.getElementById('audits-list');
            document.getElementById('audits-count').textContent = auditsData.length;

            if (auditsData.length === 0) {
                container.innerHTML = '<p class="text-gray-500 italic">Aucun audit enregistré</p>';
                return;
            }

            const sorted = [...auditsData].sort((a, b) => 
                new Date(b.created_at) - new Date(a.created_at)
            );

            container.innerHTML = \`
                <table class="w-full">
                    <thead class="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date création</th>
                            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Modules</th>
                            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        \${sorted.map(audit => \`
                            <tr class="border-b border-gray-100 hover:bg-gray-50">
                                <td class="px-4 py-3 text-sm">\${new Date(audit.created_at).toLocaleDateString('fr-FR')}</td>
                                <td class="px-4 py-3">
                                    <span class="intervention-badge type-el">EL</span>
                                </td>
                                <td class="px-4 py-3 text-sm">\${audit.modules_diagnosed || 0} / \${audit.total_modules || 0}</td>
                                <td class="px-4 py-3">
                                    <a href="/el/audit?token=\${audit.audit_token}" target="_blank" class="text-blue-600 hover:text-blue-700 text-sm">
                                        Ouvrir audit
                                    </a>
                                </td>
                            </tr>
                        \`).join('')}
                    </tbody>
                </table>
            \`;
        }

        // Delete project modal
        document.getElementById('delete-project-btn').addEventListener('click', () => {
            document.getElementById('delete-modal').classList.add('active');
        });

        document.getElementById('cancel-delete-btn').addEventListener('click', () => {
            document.getElementById('delete-modal').classList.remove('active');
        });

        document.getElementById('confirm-delete-btn').addEventListener('click', async () => {
            const response = await fetch(\`/api/crm/projects/\${projectId}\`, {
                method: 'DELETE'
            });

            if (response.ok) {
                alert('Site supprimé avec succès');
                window.location.href = '/crm/projects';
            } else {
                const data = await response.json();
                alert('Erreur: ' + (data.error || 'Impossible de supprimer le site'));
            }
        });

        // Initialize
        init();
    </script>

</body>
</html>
  `;
}
