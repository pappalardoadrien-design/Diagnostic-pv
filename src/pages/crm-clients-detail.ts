// Page Détail Client CRM - Vue complète avec sites, contacts, interventions et historique
// Navigation vers édition, suppression, création site

export function getCrmClientsDetailPage() {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Détail Client - CRM DiagPV</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        body { background: #f8fafc; }
        .section-card { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; }
        .badge-active { background: #dcfce7; color: #166534; }
        .badge-inactive { background: #fee2e2; color: #991b1b; }
        .badge-prospect { background: #fef3c7; color: #92400e; }
        .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f3f4f6; }
        .info-row:last-child { border-bottom: none; }
        .tab-button { padding: 12px 24px; border-bottom: 3px solid transparent; cursor: pointer; }
        .tab-button.active { border-bottom-color: #2563eb; color: #2563eb; font-weight: 600; }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        .project-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
        .project-card:hover { background: #f3f4f6; }
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
                    <a href="/crm/clients" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-arrow-left"></i>
                    </a>
                    <h1 class="text-2xl font-bold text-gray-900">
                        <i class="fas fa-building text-blue-600 mr-2"></i>
                        <span id="client-name">Chargement...</span>
                    </h1>
                    <span id="client-status-badge" class="badge"></span>
                </div>
                <div class="flex items-center space-x-3">
                    <button id="delete-client-btn" class="border border-red-300 hover:bg-red-50 text-red-700 px-4 py-2 rounded-lg font-medium transition">
                        <i class="fas fa-trash mr-2"></i>
                        Supprimer
                    </button>
                    <a id="edit-client-btn" href="#" class="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition">
                        <i class="fas fa-edit mr-2"></i>
                        Modifier
                    </a>
                    <a id="create-project-btn" href="#" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition">
                        <i class="fas fa-plus mr-2"></i>
                        Nouveau Site
                    </a>
                </div>
            </div>
        </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <!-- Informations Générales -->
        <div class="section-card p-6 mb-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">
                <i class="fas fa-info-circle text-blue-600 mr-2"></i>
                Informations Générales
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                <div>
                    <div class="info-row">
                        <span class="text-gray-600">Raison sociale</span>
                        <span id="info-company-name" class="font-medium text-gray-900"></span>
                    </div>
                    <div class="info-row">
                        <span class="text-gray-600">SIRET</span>
                        <span id="info-siret" class="font-medium text-gray-900"></span>
                    </div>
                    <div class="info-row">
                        <span class="text-gray-600">TVA Intracommunautaire</span>
                        <span id="info-vat" class="font-medium text-gray-900"></span>
                    </div>
                    <div class="info-row">
                        <span class="text-gray-600">Type</span>
                        <span id="info-client-type" class="font-medium text-gray-900"></span>
                    </div>
                </div>
                <div>
                    <div class="info-row">
                        <span class="text-gray-600">Statut</span>
                        <span id="info-status" class="font-medium text-gray-900"></span>
                    </div>
                    <div class="info-row">
                        <span class="text-gray-600">Date de création</span>
                        <span id="info-created-at" class="font-medium text-gray-900"></span>
                    </div>
                    <div class="info-row">
                        <span class="text-gray-600">Dernière modification</span>
                        <span id="info-updated-at" class="font-medium text-gray-900"></span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Contact Principal -->
        <div class="section-card p-6 mb-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">
                <i class="fas fa-user text-blue-600 mr-2"></i>
                Contact Principal
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                <div>
                    <div class="info-row">
                        <span class="text-gray-600">Nom complet</span>
                        <span id="contact-name" class="font-medium text-gray-900"></span>
                    </div>
                    <div class="info-row">
                        <span class="text-gray-600">Email</span>
                        <a id="contact-email" href="#" class="font-medium text-blue-600 hover:underline"></a>
                    </div>
                </div>
                <div>
                    <div class="info-row">
                        <span class="text-gray-600">Téléphone</span>
                        <a id="contact-phone" href="#" class="font-medium text-blue-600 hover:underline"></a>
                    </div>
                    <div class="info-row">
                        <span class="text-gray-600">Rôle</span>
                        <span id="contact-role" class="font-medium text-gray-900"></span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Adresse -->
        <div class="section-card p-6 mb-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">
                <i class="fas fa-map-marker-alt text-blue-600 mr-2"></i>
                Adresse
            </h2>
            <p id="address-full" class="text-gray-700"></p>
        </div>

        <!-- Notes -->
        <div id="notes-section" class="section-card p-6 mb-6" style="display: none;">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">
                <i class="fas fa-sticky-note text-blue-600 mr-2"></i>
                Notes
            </h2>
            <p id="notes-content" class="text-gray-700 whitespace-pre-wrap"></p>
        </div>

        <!-- Tabs Navigation -->
        <div class="section-card mb-6">
            <div class="border-b border-gray-200 flex">
                <button class="tab-button active" data-tab="sites">
                    <i class="fas fa-solar-panel mr-2"></i>
                    Sites / Projets (<span id="sites-count">0</span>)
                </button>
                <button class="tab-button" data-tab="interventions">
                    <i class="fas fa-calendar-check mr-2"></i>
                    Interventions (<span id="interventions-count">0</span>)
                </button>
                <button class="tab-button" data-tab="audits">
                    <i class="fas fa-clipboard-check mr-2"></i>
                    Audits (<span id="audits-count">0</span>)
                </button>
            </div>

            <!-- Tab Content: Sites -->
            <div id="tab-sites" class="tab-content active p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold text-gray-900">Liste des Sites</h3>
                    <a id="add-site-btn" href="#" class="text-blue-600 hover:text-blue-700 font-medium">
                        <i class="fas fa-plus mr-1"></i>
                        Ajouter un site
                    </a>
                </div>
                <div id="sites-list">
                    <!-- Populated by JS -->
                </div>
            </div>

            <!-- Tab Content: Interventions -->
            <div id="tab-interventions" class="tab-content p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Historique des Interventions</h3>
                <div id="interventions-list">
                    <!-- Populated by JS -->
                </div>
            </div>

            <!-- Tab Content: Audits -->
            <div id="tab-audits" class="tab-content p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Historique des Audits</h3>
                <div id="audits-list">
                    <!-- Populated by JS -->
                </div>
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
                    Êtes-vous sûr de vouloir supprimer ce client ? Cette action est irréversible et supprimera également :
                </p>
                <ul class="list-disc list-inside text-gray-600 mb-6 space-y-1">
                    <li>Tous les sites/projets associés</li>
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
        const clientId = urlParams.get('id');

        if (!clientId) {
            alert('ID client manquant');
            window.location.href = '/crm/clients';
        }

        let clientData = null;
        let projectsData = [];
        let interventionsData = [];
        let auditsData = [];

        // Load all data
        async function init() {
            await Promise.all([
                loadClient(),
                loadProjects(),
                loadInterventions(),
                loadAudits()
            ]);

            updateCounts();
            renderSites();
            renderInterventions();
            renderAudits();
        }

        async function loadClient() {
            const response = await fetch(\`/api/crm/clients/\${clientId}\`);
            if (!response.ok) {
                alert('Client non trouvé');
                window.location.href = '/crm/clients';
                return;
            }
            const data = await response.json();
            clientData = data.client;
            renderClientInfo();
        }

        async function loadProjects() {
            const response = await fetch(\`/api/crm/clients/\${clientId}/projects\`);
            if (response.ok) {
                const data = await response.json();
                projectsData = data.projects || [];
            }
        }

        async function loadInterventions() {
            const response = await fetch(\`/api/planning/interventions?client_id=\${clientId}\`);
            if (response.ok) {
                const data = await response.json();
                interventionsData = data.interventions || [];
            }
        }

        async function loadAudits() {
            // Load all audits for this client's interventions
            const response = await fetch(\`/api/audits\`); // Correct endpoint: plural 'audits'
            if (response.ok) {
                const data = await response.json();
                const clientInterventionIds = interventionsData.map(i => i.id);
                auditsData = (data.audits || []).filter(a => 
                    clientInterventionIds.includes(a.intervention_id)
                );
            }
        }

        function renderClientInfo() {
            // Header
            document.getElementById('client-name').textContent = clientData.company_name;
            const statusBadge = document.getElementById('client-status-badge');
            statusBadge.textContent = clientData.status.toUpperCase();
            statusBadge.className = 'badge badge-' + clientData.status;

            // General info
            document.getElementById('info-company-name').textContent = clientData.company_name;
            document.getElementById('info-siret').textContent = clientData.siret || 'N/A';
            document.getElementById('info-vat').textContent = clientData.vat_number || 'N/A';
            document.getElementById('info-client-type').textContent = clientData.client_type || 'N/A';
            document.getElementById('info-status').textContent = clientData.status;
            document.getElementById('info-created-at').textContent = new Date(clientData.created_at).toLocaleDateString('fr-FR');
            document.getElementById('info-updated-at').textContent = new Date(clientData.updated_at).toLocaleDateString('fr-FR');

            // Contact
            document.getElementById('contact-name').textContent = clientData.contact_name || 'N/A';
            const emailEl = document.getElementById('contact-email');
            if (clientData.contact_email) {
                emailEl.textContent = clientData.contact_email;
                emailEl.href = 'mailto:' + clientData.contact_email;
            } else {
                emailEl.textContent = 'N/A';
                emailEl.removeAttribute('href');
            }
            const phoneEl = document.getElementById('contact-phone');
            if (clientData.contact_phone) {
                phoneEl.textContent = clientData.contact_phone;
                phoneEl.href = 'tel:' + clientData.contact_phone;
            } else {
                phoneEl.textContent = 'N/A';
                phoneEl.removeAttribute('href');
            }
            document.getElementById('contact-role').textContent = clientData.contact_role || 'N/A';

            // Address
            const address = [
                clientData.address_street,
                clientData.address_postal_code,
                clientData.address_city
            ].filter(Boolean).join(', ');
            document.getElementById('address-full').textContent = address || 'Adresse non renseignée';

            // Notes
            if (clientData.notes) {
                document.getElementById('notes-section').style.display = 'block';
                document.getElementById('notes-content').textContent = clientData.notes;
            }

            // Buttons
            document.getElementById('edit-client-btn').href = \`/crm/clients/edit?id=\${clientId}\`;
            document.getElementById('create-project-btn').href = \`/crm/projects/create?client_id=\${clientId}\`;
            document.getElementById('add-site-btn').href = \`/crm/projects/create?client_id=\${clientId}\`;
        }

        function updateCounts() {
            document.getElementById('sites-count').textContent = projectsData.length;
            document.getElementById('interventions-count').textContent = interventionsData.length;
            document.getElementById('audits-count').textContent = auditsData.length;
        }

        function renderSites() {
            const container = document.getElementById('sites-list');
            if (projectsData.length === 0) {
                container.innerHTML = '<p class="text-gray-500 italic">Aucun site enregistré</p>';
                return;
            }

            container.innerHTML = projectsData.map(project => {
                const interventionsCount = interventionsData.filter(i => i.project_id === project.id).length;
                return \`
                    <div class="project-card">
                        <div class="flex items-start justify-between mb-2">
                            <div>
                                <h4 class="font-semibold text-gray-900 text-lg">\${project.project_name}</h4>
                                <p class="text-sm text-gray-600">\${project.address_street || ''}, \${project.address_postal_code || ''} \${project.address_city || ''}</p>
                            </div>
                            <a href="/crm/projects/detail?id=\${project.id}" class="text-blue-600 hover:text-blue-700 text-sm font-medium">
                                Voir détails →
                            </a>
                        </div>
                        <div class="flex items-center space-x-4 text-sm text-gray-600 mt-3">
                            <span><i class="fas fa-bolt mr-1"></i>\${project.total_power_kwp || 'N/A'} kWp</span>
                            <span><i class="fas fa-solar-panel mr-1"></i>\${project.module_count || 'N/A'} modules</span>
                            <span><i class="fas fa-calendar-check mr-1"></i>\${interventionsCount} intervention(s)</span>
                        </div>
                    </div>
                \`;
            }).join('');
        }

        function renderInterventions() {
            const container = document.getElementById('interventions-list');
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
                            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Site</th>
                            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Technicien</th>
                            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Statut</th>
                            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        \${sorted.map(intervention => {
                            const project = projectsData.find(p => p.id === intervention.project_id);
                            return \`
                                <tr class="border-b border-gray-100 hover:bg-gray-50">
                                    <td class="px-4 py-3 text-sm">\${new Date(intervention.intervention_date).toLocaleDateString('fr-FR')}</td>
                                    <td class="px-4 py-3">
                                        <span class="intervention-badge type-\${intervention.intervention_type}">
                                            \${intervention.intervention_type.toUpperCase()}
                                        </span>
                                    </td>
                                    <td class="px-4 py-3 text-sm">\${project ? project.project_name : 'N/A'}</td>
                                    <td class="px-4 py-3 text-sm">\${intervention.technician_name || 'Non assigné'}</td>
                                    <td class="px-4 py-3 text-sm">\${intervention.status}</td>
                                    <td class="px-4 py-3">
                                        <a href="/planning/detail?id=\${intervention.id}" class="text-blue-600 hover:text-blue-700 text-sm">
                                            Détails
                                        </a>
                                    </td>
                                </tr>
                            \`;
                        }).join('')}
                    </tbody>
                </table>
            \`;
        }

        function renderAudits() {
            const container = document.getElementById('audits-list');
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
                            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Site</th>
                            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Modules</th>
                            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        \${sorted.map(audit => {
                            const intervention = interventionsData.find(i => i.id === audit.intervention_id);
                            const project = intervention ? projectsData.find(p => p.id === intervention.project_id) : null;
                            return \`
                                <tr class="border-b border-gray-100 hover:bg-gray-50">
                                    <td class="px-4 py-3 text-sm">\${new Date(audit.created_at).toLocaleDateString('fr-FR')}</td>
                                    <td class="px-4 py-3">
                                        <span class="intervention-badge type-el">EL</span>
                                    </td>
                                    <td class="px-4 py-3 text-sm">\${project ? project.project_name : 'N/A'}</td>
                                    <td class="px-4 py-3 text-sm">\${audit.modules_diagnosed || 0} / \${audit.total_modules || 0}</td>
                                    <td class="px-4 py-3">
                                        <a href="/el/audit?token=\${audit.audit_token}" target="_blank" class="text-blue-600 hover:text-blue-700 text-sm">
                                            Ouvrir audit
                                        </a>
                                    </td>
                                </tr>
                            \`;
                        }).join('')}
                    </tbody>
                </table>
            \`;
        }

        // Tab switching
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.dataset.tab;
                
                // Update buttons
                document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
                button.classList.add('active');
                
                // Update content
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                document.getElementById('tab-' + tabName).classList.add('active');
            });
        });

        // Delete client modal
        document.getElementById('delete-client-btn').addEventListener('click', () => {
            document.getElementById('delete-modal').classList.add('active');
        });

        document.getElementById('cancel-delete-btn').addEventListener('click', () => {
            document.getElementById('delete-modal').classList.remove('active');
        });

        document.getElementById('confirm-delete-btn').addEventListener('click', async () => {
            const response = await fetch(\`/api/crm/clients/\${clientId}\`, {
                method: 'DELETE'
            });

            if (response.ok) {
                alert('Client supprimé avec succès');
                window.location.href = '/crm/clients';
            } else {
                const data = await response.json();
                alert('Erreur: ' + (data.error || 'Impossible de supprimer le client'));
            }
        });

        // Initialize
        init();
    </script>

</body>
</html>
  `;
}
