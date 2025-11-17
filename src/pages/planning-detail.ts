// Page Détail Intervention - Affichage complet + Bouton Attribution/Réassignation
// Navigation vers audit EL associé + Historique

export function getPlanningDetailPage() {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Détail Intervention - Planning DiagPV</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        body { background: #f8fafc; }
        .loading-spinner {
            border: 3px solid #f3f4f6;
            border-top: 3px solid #3b82f6;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 0.8s linear infinite;
            margin: 0 auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .status-badge {
            display: inline-block;
            padding: 0.375rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
        }
        .info-row {
            display: flex;
            padding: 1rem;
            border-bottom: 1px solid #e5e7eb;
        }
        .info-row:last-child {
            border-bottom: none;
        }
        .info-label {
            width: 180px;
            font-weight: 600;
            color: #6b7280;
            display: flex;
            align-items: center;
        }
        .info-value {
            flex: 1;
            color: #1f2937;
        }
    </style>
</head>
<body class="min-h-screen">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4">
                    <a href="/planning" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-arrow-left"></i>
                    </a>
                    <h1 class="text-2xl font-bold text-gray-900">
                        <i class="fas fa-file-alt text-blue-600 mr-2"></i>
                        Détail Intervention
                    </h1>
                </div>
                <div id="headerActions" class="flex items-center space-x-2">
                    <!-- Actions dynamiques -->
                </div>
            </div>
        </div>
    </header>

    <main class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <!-- Loading State -->
        <div id="loadingState" class="bg-white rounded-lg shadow-sm p-12 text-center">
            <div class="loading-spinner"></div>
            <p class="text-gray-600 mt-4">Chargement des détails...</p>
        </div>

        <!-- Content Container -->
        <div id="contentContainer" class="hidden space-y-6">
            
            <!-- Carte Informations Principales -->
            <div class="bg-white rounded-lg shadow-sm overflow-hidden">
                <div class="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                    <h2 class="text-xl font-bold text-white">
                        <i class="fas fa-info-circle mr-2"></i>
                        Informations Générales
                    </h2>
                </div>
                <div id="generalInfo">
                    <!-- Contenu dynamique -->
                </div>
            </div>

            <!-- Carte Projet Associé -->
            <div class="bg-white rounded-lg shadow-sm overflow-hidden">
                <div class="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
                    <h2 class="text-xl font-bold text-white">
                        <i class="fas fa-solar-panel mr-2"></i>
                        Projet Associé
                    </h2>
                </div>
                <div id="projectInfo">
                    <!-- Contenu dynamique -->
                </div>
            </div>

            <!-- Carte Attribution Technicien -->
            <div class="bg-white rounded-lg shadow-sm overflow-hidden">
                <div class="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
                    <h2 class="text-xl font-bold text-white">
                        <i class="fas fa-user-hard-hat mr-2"></i>
                        Attribution Technicien
                    </h2>
                </div>
                <div id="technicianInfo" class="p-6">
                    <!-- Contenu dynamique -->
                </div>
            </div>

            <!-- Carte Audit EL Associé -->
            <div id="auditCard" class="bg-white rounded-lg shadow-sm overflow-hidden hidden">
                <div class="bg-gradient-to-r from-yellow-600 to-orange-600 px-6 py-4">
                    <h2 class="text-xl font-bold text-white">
                        <i class="fas fa-microscope mr-2"></i>
                        Audit Électroluminescence Associé
                    </h2>
                </div>
                <div id="auditInfo">
                    <!-- Contenu dynamique -->
                </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center justify-between">
                <a href="/planning" class="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">
                    <i class="fas fa-arrow-left mr-2"></i>
                    Retour à la liste
                </a>
                <div class="flex space-x-3">
                    <button 
                        id="btnOrdreMission" 
                        class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                        title="Générer PDF Ordre de Mission"
                    >
                        <i class="fas fa-file-pdf mr-2"></i>
                        Ordre de Mission
                    </button>
                    <button 
                        id="btnEdit" 
                        class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                        <i class="fas fa-edit mr-2"></i>
                        Modifier
                    </button>
                    <button 
                        id="btnDelete" 
                        class="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                    >
                        <i class="fas fa-trash mr-2"></i>
                        Supprimer
                    </button>
                </div>
            </div>
        </div>

    </main>

    <!-- Modal Attribution Technicien -->
    <div id="assignModal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div class="bg-blue-600 px-6 py-4 rounded-t-lg">
                <h3 class="text-xl font-bold text-white">
                    <i class="fas fa-user-plus mr-2"></i>
                    Attribuer un Technicien
                </h3>
            </div>
            <div class="p-6">
                <div class="mb-4">
                    <label class="block text-sm font-semibold text-gray-900 mb-2">
                        Sélectionner un technicien
                    </label>
                    <select 
                        id="modalTechnicianSelect" 
                        class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">-- Chargement... --</option>
                    </select>
                </div>
                
                <!-- Conflits détectés -->
                <div id="modalConflicts" class="hidden mb-4">
                    <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                        <div class="flex">
                            <i class="fas fa-exclamation-triangle text-yellow-600 mt-1 mr-3"></i>
                            <div>
                                <h4 class="text-sm font-bold text-yellow-800 mb-2">
                                    Conflits détectés
                                </h4>
                                <div id="modalConflictsList" class="text-sm text-yellow-700"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex justify-end space-x-3">
                    <button 
                        id="btnCancelAssign" 
                        class="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                        Annuler
                    </button>
                    <button 
                        id="btnConfirmAssign" 
                        class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <i class="fas fa-check mr-2"></i>
                        Attribuer
                    </button>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Récupération ID intervention depuis URL
        const urlParams = new URLSearchParams(window.location.search);
        const interventionId = urlParams.get('id');

        if (!interventionId) {
            alert('ID intervention manquant');
            window.location.href = '/planning';
        }

        let currentIntervention = null;

        // Chargement détails intervention
        async function loadInterventionDetails() {
            try {
                const response = await fetch(\`/api/planning/interventions/\${interventionId}\`);
                const data = await response.json();

                if (!data.success) {
                    throw new Error(data.error || 'Erreur chargement');
                }

                currentIntervention = data.intervention;
                renderInterventionDetails(currentIntervention);
                
                // Charger audit EL associé si existe
                if (currentIntervention.intervention_type === 'el_audit') {
                    loadAssociatedAudit();
                }

                document.getElementById('loadingState').classList.add('hidden');
                document.getElementById('contentContainer').classList.remove('hidden');

            } catch (error) {
                console.error('Erreur:', error);
                alert('Erreur lors du chargement: ' + error.message);
            }
        }

        // Rendu détails intervention
        function renderInterventionDetails(intervention) {
            // Informations générales
            document.getElementById('generalInfo').innerHTML = \`
                <div class="info-row">
                    <div class="info-label">
                        <i class="fas fa-hashtag text-gray-400 mr-2"></i>
                        ID Intervention
                    </div>
                    <div class="info-value font-mono">#\${intervention.id}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">
                        <i class="fas fa-tag text-gray-400 mr-2"></i>
                        Type
                    </div>
                    <div class="info-value">
                        <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                            \${getInterventionTypeLabel(intervention.intervention_type)}
                        </span>
                    </div>
                </div>
                <div class="info-row">
                    <div class="info-label">
                        <i class="fas fa-calendar text-gray-400 mr-2"></i>
                        Date planifiée
                    </div>
                    <div class="info-value font-semibold">
                        \${formatDate(intervention.intervention_date)}
                    </div>
                </div>
                <div class="info-row">
                    <div class="info-label">
                        <i class="fas fa-clock text-gray-400 mr-2"></i>
                        Durée estimée
                    </div>
                    <div class="info-value">
                        \${intervention.duration_hours ? intervention.duration_hours + ' heures' : 'Non spécifiée'}
                    </div>
                </div>
                <div class="info-row">
                    <div class="info-label">
                        <i class="fas fa-traffic-light text-gray-400 mr-2"></i>
                        Statut
                    </div>
                    <div class="info-value">
                        \${getStatusBadge(intervention.status)}
                    </div>
                </div>
                \${intervention.notes ? \`
                <div class="info-row">
                    <div class="info-label">
                        <i class="fas fa-sticky-note text-gray-400 mr-2"></i>
                        Notes
                    </div>
                    <div class="info-value text-gray-600 italic">
                        \${intervention.notes}
                    </div>
                </div>
                \` : ''}
            \`;

            // Informations projet
            document.getElementById('projectInfo').innerHTML = \`
                <div class="info-row">
                    <div class="info-label">
                        <i class="fas fa-building text-gray-400 mr-2"></i>
                        Client
                    </div>
                    <div class="info-value font-semibold text-blue-600">
                        \${intervention.client_name || 'N/A'}
                    </div>
                </div>
                <div class="info-row">
                    <div class="info-label">
                        <i class="fas fa-project-diagram text-gray-400 mr-2"></i>
                        Projet
                    </div>
                    <div class="info-value font-semibold">
                        \${intervention.project_name || 'N/A'}
                    </div>
                </div>
                <div class="info-row">
                    <div class="info-label">
                        <i class="fas fa-map-marker-alt text-gray-400 mr-2"></i>
                        Localisation
                    </div>
                    <div class="info-value text-gray-600">
                        \${intervention.project_location || 'Non spécifiée'}
                    </div>
                </div>
            \`;

            // Attribution technicien
            if (intervention.technician_id) {
                document.getElementById('technicianInfo').innerHTML = \`
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-600 mb-1">Technicien assigné :</p>
                            <p class="text-lg font-semibold text-gray-900">
                                <i class="fas fa-user-check text-green-600 mr-2"></i>
                                \${intervention.technician_email || 'N/A'}
                            </p>
                        </div>
                        <button 
                            onclick="openAssignModal()" 
                            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <i class="fas fa-sync-alt mr-2"></i>
                            Réassigner
                        </button>
                    </div>
                \`;
            } else {
                document.getElementById('technicianInfo').innerHTML = \`
                    <div class="text-center py-6">
                        <i class="fas fa-user-slash text-gray-400 text-4xl mb-3"></i>
                        <p class="text-gray-600 mb-4">Aucun technicien assigné</p>
                        <button 
                            onclick="openAssignModal()" 
                            class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                        >
                            <i class="fas fa-user-plus mr-2"></i>
                            Attribuer un technicien
                        </button>
                    </div>
                \`;
            }
        }

        // Charger audit EL associé
        async function loadAssociatedAudit() {
            try {
                const response = await fetch(\`/api/el/dashboard/audits?intervention_id=\${interventionId}\`);
                const data = await response.json();

                // Si audit existe déjà, l'afficher
                if (data.success && data.audits && data.audits.length > 0) {
                    const audit = data.audits[0];
                    document.getElementById('auditCard').classList.remove('hidden');
                    document.getElementById('auditInfo').innerHTML = \`
                        <div class="info-row">
                            <div class="info-label">
                                <i class="fas fa-fingerprint text-gray-400 mr-2"></i>
                                Token Audit
                            </div>
                            <div class="info-value font-mono text-sm bg-gray-100 px-3 py-1 rounded">
                                \${audit.audit_token}
                            </div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">
                                <i class="fas fa-solar-panel text-gray-400 mr-2"></i>
                                Modules
                            </div>
                            <div class="info-value font-semibold">
                                \${audit.total_modules} modules
                            </div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">
                                <i class="fas fa-tasks text-gray-400 mr-2"></i>
                                Progression
                            </div>
                            <div class="info-value">
                                <div class="flex items-center">
                                    <div class="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                                        <div class="bg-green-600 h-2 rounded-full" style="width: \${audit.completion_rate}%"></div>
                                    </div>
                                    <span class="text-sm font-semibold">\${audit.completion_rate}%</span>
                                </div>
                            </div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">
                                <i class="fas fa-traffic-light text-gray-400 mr-2"></i>
                                Statut
                            </div>
                            <div class="info-value">
                                \${getAuditStatusBadge(audit.status)}
                            </div>
                        </div>
                        <div class="p-6 bg-gray-50">
                            <a 
                                href="/el/audit?token=\${audit.audit_token}" 
                                target="_blank"
                                class="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                            >
                                <i class="fas fa-external-link-alt mr-2"></i>
                                Ouvrir l'audit EL
                            </a>
                        </div>
                    \`;
                } else {
                    // Si pas d'audit et intervention type=el, afficher bouton création
                    if (currentIntervention && currentIntervention.intervention_type === 'el') {
                        document.getElementById('auditCard').classList.remove('hidden');
                        document.getElementById('auditInfo').innerHTML = \`
                            <div class="p-8 text-center">
                                <i class="fas fa-microscope text-gray-300 text-6xl mb-4"></i>
                                <h3 class="text-lg font-semibold text-gray-900 mb-2">
                                    Aucun audit EL créé pour cette intervention
                                </h3>
                                <p class="text-gray-600 mb-6">
                                    Créez un audit électroluminescence pour commencer le diagnostic
                                </p>
                                <button 
                                    id="btnCreateAudit"
                                    class="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-lg shadow-md"
                                >
                                    <i class="fas fa-plus-circle mr-2"></i>
                                    Créer l'audit EL
                                </button>
                            </div>
                        \`;

                        // Ajouter event listener pour création
                        document.getElementById('btnCreateAudit').addEventListener('click', createAuditFromIntervention);
                    }
                }
            } catch (error) {
                console.error('Erreur chargement audit:', error);
            }
        }

        // Créer audit EL depuis intervention
        async function createAuditFromIntervention() {
            if (!currentIntervention) {
                alert('Erreur: Données intervention manquantes');
                return;
            }

            const confirmCreate = confirm(\`Créer un audit EL pour cette intervention ?\n\nClient: \${currentIntervention.client_name || 'N/A'}\nSite: \${currentIntervention.project_name || 'N/A'}\nDate: \${new Date(currentIntervention.intervention_date).toLocaleDateString('fr-FR')}\`);
            
            if (!confirmCreate) return;

            try {
                const response = await fetch('/api/el/audit/create-from-intervention', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        intervention_id: parseInt(interventionId)
                    })
                });

                const data = await response.json();

                if (!data.success) {
                    throw new Error(data.error || 'Erreur création audit');
                }

                alert('Audit EL créé avec succès !');
                
                // Ouvrir l'audit dans un nouvel onglet
                window.open(\`/el/audit?token=\${data.audit.audit_token}\`, '_blank');
                
                // Recharger l'affichage
                loadAssociatedAudit();

            } catch (error) {
                console.error('Erreur création audit:', error);
                alert('Erreur: ' + error.message);
            }
        }

        // Modal attribution
        async function openAssignModal() {
            document.getElementById('assignModal').classList.remove('hidden');
            
            // Charger techniciens disponibles
            try {
                const response = await fetch(\`/api/planning/technicians/available?date=\${currentIntervention.intervention_date}\`);
                const data = await response.json();

                const select = document.getElementById('modalTechnicianSelect');
                select.innerHTML = '<option value="">-- Sélectionner un technicien --</option>';
                
                if (data.success && data.technicians) {
                    data.technicians.forEach(tech => {
                        const option = document.createElement('option');
                        option.value = tech.id;
                        option.textContent = \`\${tech.email} (\${tech.intervention_count} interventions ce jour)\`;
                        select.appendChild(option);
                    });
                }

                // Pré-sélectionner technicien actuel si existe
                if (currentIntervention.technician_id) {
                    select.value = currentIntervention.technician_id;
                }

            } catch (error) {
                console.error('Erreur chargement techniciens:', error);
            }
        }

        function closeAssignModal() {
            document.getElementById('assignModal').classList.add('hidden');
            document.getElementById('modalConflicts').classList.add('hidden');
        }

        // Attribution technicien
        async function assignTechnician() {
            const technicianId = document.getElementById('modalTechnicianSelect').value;
            
            if (!technicianId) {
                alert('Veuillez sélectionner un technicien');
                return;
            }

            try {
                const response = await fetch('/api/planning/assign', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        intervention_id: parseInt(interventionId),
                        technician_id: parseInt(technicianId)
                    })
                });

                const data = await response.json();

                if (!data.success) {
                    throw new Error(data.error || 'Erreur attribution');
                }

                // Afficher conflits si existent
                if (data.conflicts && data.conflicts.length > 0) {
                    displayConflicts(data.conflicts);
                    return; // Ne pas fermer modal, laisser user voir les conflits
                }

                alert('Technicien attribué avec succès !');
                closeAssignModal();
                loadInterventionDetails(); // Recharger

            } catch (error) {
                console.error('Erreur:', error);
                alert('Erreur: ' + error.message);
            }
        }

        function displayConflicts(conflicts) {
            const conflictsDiv = document.getElementById('modalConflicts');
            const conflictsList = document.getElementById('modalConflictsList');
            
            conflictsList.innerHTML = conflicts.map(c => \`
                <div class="mb-2">
                    • Intervention #\${c.id} (\${getInterventionTypeLabel(c.intervention_type)}) - \${formatDate(c.intervention_date)}
                </div>
            \`).join('');
            
            conflictsDiv.classList.remove('hidden');
        }

        // Suppression intervention
        async function deleteIntervention() {
            if (!confirm('Êtes-vous sûr de vouloir supprimer cette intervention ?')) {
                return;
            }

            try {
                const response = await fetch(\`/api/planning/interventions/\${interventionId}\`, {
                    method: 'DELETE'
                });

                const data = await response.json();

                if (!data.success) {
                    throw new Error(data.error || 'Erreur suppression');
                }

                alert('Intervention supprimée avec succès');
                window.location.href = '/planning';

            } catch (error) {
                console.error('Erreur:', error);
                alert('Erreur: ' + error.message);
            }
        }

        // Event listeners
        document.getElementById('btnCancelAssign').addEventListener('click', closeAssignModal);
        document.getElementById('btnOrdreMission').addEventListener('click', () => {
            // Ouvrir ordre de mission dans nouvelle fenêtre
            window.open(\`/api/planning/interventions/\${interventionId}/ordre-mission\`, '_blank');
        });
        
        document.getElementById('btnConfirmAssign').addEventListener('click', assignTechnician);
        document.getElementById('btnDelete').addEventListener('click', deleteIntervention);
        document.getElementById('btnEdit').addEventListener('click', () => {
            alert('Fonctionnalité modification à venir');
        });

        // Helpers
        function getInterventionTypeLabel(type) {
            const types = {
                'el_audit': 'Audit EL',
                'iv_test': 'Test I-V',
                'thermography': 'Thermographie',
                'visual_inspection': 'Contrôle Visuel',
                'commissioning': 'Commissioning',
                'maintenance': 'Maintenance',
                'post_incident': 'Post-Sinistre',
                'isolation_test': 'Test Isolation'
            };
            return types[type] || type;
        }

        function getStatusBadge(status) {
            const badges = {
                'scheduled': '<span class="status-badge bg-blue-100 text-blue-800">Planifiée</span>',
                'in_progress': '<span class="status-badge bg-yellow-100 text-yellow-800">En cours</span>',
                'completed': '<span class="status-badge bg-green-100 text-green-800">Terminée</span>',
                'cancelled': '<span class="status-badge bg-red-100 text-red-800">Annulée</span>'
            };
            return badges[status] || status;
        }

        function getAuditStatusBadge(status) {
            const badges = {
                'created': '<span class="status-badge bg-blue-100 text-blue-800">Créé</span>',
                'in_progress': '<span class="status-badge bg-yellow-100 text-yellow-800">En cours</span>',
                'completed': '<span class="status-badge bg-green-100 text-green-800">Terminé</span>'
            };
            return badges[status] || status;
        }

        function formatDate(dateStr) {
            const date = new Date(dateStr);
            return new Intl.DateTimeFormat('fr-FR', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            }).format(date);
        }

        // Chargement initial
        loadInterventionDetails();
    </script>
</body>
</html>
  `;
}
