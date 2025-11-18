export function getPlanningDetailPage(): string {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Détail Intervention - DiagPV</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/diagpv-styles.css" rel="stylesheet">
    </head>
    <body class="bg-black text-white min-h-screen font-bold">
        <div class="container mx-auto p-6">
            <!-- Navigation -->
            <div class="mb-6">
                <a href="/planning/interventions" class="inline-flex items-center text-yellow-400 hover:text-yellow-300 text-lg">
                    <i class="fas fa-arrow-left mr-2"></i>
                    Retour Planning
                </a>
            </div>

            <!-- En-tête -->
            <header class="mb-8">
                <div class="flex justify-between items-start">
                    <div>
                        <h1 class="text-4xl font-black mb-2">
                            <i class="fas fa-calendar-check text-blue-400 mr-3"></i>
                            DÉTAIL INTERVENTION
                        </h1>
                        <p class="text-xl text-gray-400" id="intervention-subtitle">Chargement...</p>
                    </div>
                    <div id="status-badge"></div>
                </div>
            </header>

            <!-- Actions rapides -->
            <div class="mb-6 flex gap-3">
                <button onclick="generateMissionOrder()" class="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-black">
                    <i class="fas fa-file-pdf mr-2"></i>
                    ORDRE DE MISSION PDF
                </button>
                <button onclick="editIntervention()" class="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-black">
                    <i class="fas fa-edit mr-2"></i>
                    MODIFIER
                </button>
                <button onclick="deleteIntervention()" class="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-black">
                    <i class="fas fa-trash mr-2"></i>
                    SUPPRIMER
                </button>
            </div>

            <!-- Contenu principal -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Colonne gauche : Informations principales -->
                <div class="lg:col-span-2 space-y-6">
                    <!-- Carte Informations Générales -->
                    <div class="bg-gray-900 rounded-lg p-6 border border-blue-400">
                        <h2 class="text-2xl font-black mb-4 text-blue-400">
                            <i class="fas fa-info-circle mr-2"></i>
                            INFORMATIONS GÉNÉRALES
                        </h2>
                        <div id="general-info" class="space-y-3">
                            <!-- Rempli dynamiquement -->
                        </div>
                    </div>

                    <!-- Carte Client & Site -->
                    <div class="bg-gray-900 rounded-lg p-6 border border-green-400">
                        <h2 class="text-2xl font-black mb-4 text-green-400">
                            <i class="fas fa-building mr-2"></i>
                            CLIENT & SITE
                        </h2>
                        <div id="client-site-info" class="space-y-3">
                            <!-- Rempli dynamiquement -->
                        </div>
                    </div>

                    <!-- Carte Technicien -->
                    <div class="bg-gray-900 rounded-lg p-6 border border-yellow-400">
                        <h2 class="text-2xl font-black mb-4 text-yellow-400">
                            <i class="fas fa-user-hard-hat mr-2"></i>
                            TECHNICIEN ASSIGNÉ
                        </h2>
                        <div id="technician-info" class="space-y-3">
                            <!-- Rempli dynamiquement -->
                        </div>
                    </div>
                </div>

                <!-- Colonne droite : Timeline & Actions -->
                <div class="space-y-6">
                    <!-- Carte Conditions -->
                    <div class="bg-gray-900 rounded-lg p-6 border border-orange-400">
                        <h2 class="text-2xl font-black mb-4 text-orange-400">
                            <i class="fas fa-cloud-sun mr-2"></i>
                            CONDITIONS
                        </h2>
                        <div id="conditions-info" class="space-y-3">
                            <!-- Rempli dynamiquement -->
                        </div>
                    </div>

                    <!-- Carte Notes -->
                    <div class="bg-gray-900 rounded-lg p-6 border border-purple-400">
                        <h2 class="text-2xl font-black mb-4 text-purple-400">
                            <i class="fas fa-sticky-note mr-2"></i>
                            NOTES
                        </h2>
                        <div id="notes-info" class="text-gray-300">
                            <!-- Rempli dynamiquement -->
                        </div>
                    </div>

                    <!-- Carte Timeline -->
                    <div class="bg-gray-900 rounded-lg p-6 border border-pink-400">
                        <h2 class="text-2xl font-black mb-4 text-pink-400">
                            <i class="fas fa-history mr-2"></i>
                            HISTORIQUE
                        </h2>
                        <div id="timeline" class="space-y-3">
                            <!-- Rempli dynamiquement -->
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            const interventionId = window.location.pathname.split('/')[3];
            let interventionData = null;

            // Charger les données au démarrage
            async function loadIntervention() {
                try {
                    const response = await axios.get(\`/api/planning/interventions/\${interventionId}\`);
                    interventionData = response.data.intervention;
                    displayIntervention(interventionData);
                } catch (error) {
                    console.error('Erreur chargement intervention:', error);
                    alert('Erreur lors du chargement de l\\'intervention');
                }
            }

            function displayIntervention(data) {
                // Sous-titre
                document.getElementById('intervention-subtitle').textContent = data.project_name || 'Projet non défini';

                // Badge statut
                const statusColors = {
                    'scheduled': 'bg-blue-600',
                    'in_progress': 'bg-orange-600',
                    'completed': 'bg-green-600',
                    'cancelled': 'bg-red-600'
                };
                const statusLabels = {
                    'scheduled': 'Planifiée',
                    'in_progress': 'En cours',
                    'completed': 'Terminée',
                    'cancelled': 'Annulée'
                };
                document.getElementById('status-badge').innerHTML = \`
                    <span class="\${statusColors[data.status] || 'bg-gray-600'} px-4 py-2 rounded-lg text-white font-black text-sm">
                        \${statusLabels[data.status] || data.status}
                    </span>
                \`;

                // Informations générales
                const interventionTypes = {
                    'el_audit': 'Audit EL Nocturne',
                    'iv_test': 'Tests Courbes I-V',
                    'thermography': 'Thermographie IR',
                    'visual_inspection': 'Inspection Visuelle',
                    'isolation_test': 'Tests d\\'Isolation',
                    'post_incident': 'Expertise Post-Sinistre',
                    'commissioning': 'Commissioning',
                    'maintenance': 'Maintenance',
                    'el': 'Électroluminescence'
                };

                document.getElementById('general-info').innerHTML = \`
                    <div class="flex justify-between py-2 border-b border-gray-700">
                        <span class="text-gray-400">Type d'intervention</span>
                        <span class="text-white">\${interventionTypes[data.intervention_type] || data.intervention_type}</span>
                    </div>
                    <div class="flex justify-between py-2 border-b border-gray-700">
                        <span class="text-gray-400">Date prévue</span>
                        <span class="text-white font-black">\${new Date(data.intervention_date).toLocaleDateString('fr-FR', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}</span>
                    </div>
                    <div class="flex justify-between py-2 border-b border-gray-700">
                        <span class="text-gray-400">Durée estimée</span>
                        <span class="text-white">\${data.duration_hours ? data.duration_hours + ' heures' : 'À définir'}</span>
                    </div>
                    <div class="flex justify-between py-2">
                        <span class="text-gray-400">Créée le</span>
                        <span class="text-white">\${new Date(data.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                \`;

                // Client & Site
                document.getElementById('client-site-info').innerHTML = \`
                    <div class="py-2 border-b border-gray-700">
                        <div class="text-gray-400 text-sm mb-1">Client</div>
                        <div class="text-white font-black">\${data.client_name || 'Non renseigné'}</div>
                    </div>
                    <div class="py-2 border-b border-gray-700">
                        <div class="text-gray-400 text-sm mb-1">Projet</div>
                        <div class="text-white">\${data.project_name || 'Non renseigné'}</div>
                    </div>
                    <div class="py-2">
                        <div class="text-gray-400 text-sm mb-1">Site</div>
                        <div class="text-white">\${data.project_location || 'Non renseigné'}</div>
                    </div>
                \`;

                // Technicien
                document.getElementById('technician-info').innerHTML = data.technician_id ? \`
                    <div class="py-2 border-b border-gray-700">
                        <div class="text-gray-400 text-sm mb-1">Nom</div>
                        <div class="text-white font-black">\${data.technician_email || 'Non renseigné'}</div>
                    </div>
                    <div class="py-2">
                        <div class="text-gray-400 text-sm mb-1">Email</div>
                        <div class="text-white">\${data.technician_email || 'Non renseigné'}</div>
                    </div>
                    <button onclick="changeTechnician()" class="w-full mt-3 bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg">
                        <i class="fas fa-user-edit mr-2"></i>
                        Changer technicien
                    </button>
                \` : \`
                    <div class="text-center py-6">
                        <i class="fas fa-user-slash text-4xl text-gray-600 mb-3"></i>
                        <p class="text-gray-400 mb-4">Aucun technicien assigné</p>
                        <button onclick="assignTechnician()" class="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg">
                            <i class="fas fa-user-plus mr-2"></i>
                            Assigner technicien
                        </button>
                    </div>
                \`;

                // Conditions
                document.getElementById('conditions-info').innerHTML = \`
                    <div class="py-2 border-b border-gray-700">
                        <div class="text-gray-400 text-sm mb-1">Météo</div>
                        <div class="text-white">\${data.weather_conditions || 'Non renseigné'}</div>
                    </div>
                    <div class="py-2 border-b border-gray-700">
                        <div class="text-gray-400 text-sm mb-1">Température</div>
                        <div class="text-white">\${data.temperature_ambient ? data.temperature_ambient + '°C' : 'Non renseigné'}</div>
                    </div>
                    <div class="py-2">
                        <div class="text-gray-400 text-sm mb-1">Irradiance</div>
                        <div class="text-white">\${data.irradiance ? data.irradiance + ' W/m²' : 'Non renseigné'}</div>
                    </div>
                \`;

                // Notes
                document.getElementById('notes-info').innerHTML = data.notes || '<i class="text-gray-500">Aucune note</i>';

                // Timeline
                document.getElementById('timeline').innerHTML = \`
                    <div class="flex items-start">
                        <div class="flex-shrink-0 w-2 h-2 rounded-full bg-green-400 mt-2 mr-3"></div>
                        <div>
                            <div class="text-sm text-gray-400">\${new Date(data.created_at).toLocaleDateString('fr-FR')}</div>
                            <div class="text-white">Intervention créée</div>
                        </div>
                    </div>
                    \${data.updated_at !== data.created_at ? \`
                    <div class="flex items-start">
                        <div class="flex-shrink-0 w-2 h-2 rounded-full bg-blue-400 mt-2 mr-3"></div>
                        <div>
                            <div class="text-sm text-gray-400">\${new Date(data.updated_at).toLocaleDateString('fr-FR')}</div>
                            <div class="text-white">Dernière modification</div>
                        </div>
                    </div>
                    \` : ''}
                \`;
            }

            // Générer Ordre de Mission
            function generateMissionOrder() {
                window.open(\`/api/mission-orders/\${interventionId}/generate\`, '_blank');
            }

            // Actions
            function editIntervention() {
                alert('Fonctionnalité édition à implémenter');
            }

            function deleteIntervention() {
                if (confirm('Êtes-vous sûr de vouloir supprimer cette intervention ?')) {
                    alert('Fonctionnalité suppression à implémenter');
                }
            }

            function assignTechnician() {
                alert('Fonctionnalité attribution technicien à implémenter');
            }

            function changeTechnician() {
                alert('Fonctionnalité changement technicien à implémenter');
            }

            // Initialisation
            loadIntervention();
        </script>
    </body>
    </html>
  `;
}
