export function getSubcontractorsListPage(): string {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sous-Traitants - DiagPV</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/diagpv-styles.css" rel="stylesheet">
    </head>
    <body class="bg-black text-white min-h-screen font-bold">
        <div class="container mx-auto p-6">
            <!-- Navigation -->
            <div class="mb-6">
                <a href="/crm/dashboard" class="inline-flex items-center text-yellow-400 hover:text-yellow-300 text-lg">
                    <i class="fas fa-arrow-left mr-2"></i>
                    Retour Dashboard
                </a>
            </div>

            <!-- En-tête -->
            <header class="mb-8">
                <div class="flex justify-between items-start">
                    <div>
                        <h1 class="text-4xl font-black mb-2">
                            <i class="fas fa-users-cog text-purple-400 mr-3"></i>
                            SOUS-TRAITANTS
                        </h1>
                        <p class="text-xl text-gray-400">Gestion des partenaires techniques DiagPV</p>
                    </div>
                    <button onclick="showCreateModal()" class="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-black text-lg">
                        <i class="fas fa-plus mr-2"></i>
                        NOUVEAU SOUS-TRAITANT
                    </button>
                </div>
            </header>

            <!-- Statistiques -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div class="bg-gray-900 rounded-lg p-4 border border-green-400">
                    <div class="text-green-400 text-sm mb-1">ACTIFS</div>
                    <div class="text-3xl font-black" id="stat-active">-</div>
                </div>
                <div class="bg-gray-900 rounded-lg p-4 border border-blue-400">
                    <div class="text-blue-400 text-sm mb-1">NOTE MOYENNE</div>
                    <div class="text-3xl font-black" id="stat-rating">-</div>
                </div>
                <div class="bg-gray-900 rounded-lg p-4 border border-yellow-400">
                    <div class="text-yellow-400 text-sm mb-1">TOTAL MISSIONS</div>
                    <div class="text-3xl font-black" id="stat-missions">-</div>
                </div>
                <div class="bg-gray-900 rounded-lg p-4 border border-red-400">
                    <div class="text-red-400 text-sm mb-1">INACTIFS</div>
                    <div class="text-3xl font-black" id="stat-inactive">-</div>
                </div>
            </div>

            <!-- Filtres -->
            <div class="bg-gray-900 rounded-lg p-4 mb-6 border border-gray-700">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label class="block text-sm text-gray-400 mb-2">Statut</label>
                        <select id="filter-status" onchange="loadSubcontractors()" class="w-full bg-gray-800 text-white p-2 rounded">
                            <option value="">Tous</option>
                            <option value="active">Actifs</option>
                            <option value="inactive">Inactifs</option>
                            <option value="suspended">Suspendus</option>
                            <option value="blacklisted">Blacklistés</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm text-gray-400 mb-2">Spécialité</label>
                        <select id="filter-specialty" onchange="loadSubcontractors()" class="w-full bg-gray-800 text-white p-2 rounded">
                            <option value="">Toutes</option>
                            <option value="EL">Électroluminescence</option>
                            <option value="IV">Courbes I-V</option>
                            <option value="THERMOGRAPHY">Thermographie</option>
                            <option value="VISUAL">Inspection Visuelle</option>
                            <option value="ISOLATION">Tests Isolation</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm text-gray-400 mb-2">Note minimum</label>
                        <select id="filter-rating" onchange="loadSubcontractors()" class="w-full bg-gray-800 text-white p-2 rounded">
                            <option value="">Toutes notes</option>
                            <option value="4.5">≥ 4.5 ⭐</option>
                            <option value="4.0">≥ 4.0 ⭐</option>
                            <option value="3.5">≥ 3.5 ⭐</option>
                            <option value="3.0">≥ 3.0 ⭐</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm text-gray-400 mb-2">Actions</label>
                        <button onclick="resetFilters()" class="w-full bg-gray-700 hover:bg-gray-600 p-2 rounded">
                            <i class="fas fa-redo mr-2"></i>
                            Réinitialiser
                        </button>
                    </div>
                </div>
            </div>

            <!-- Liste sous-traitants -->
            <div id="subcontractors-list" class="space-y-4">
                <!-- Rempli dynamiquement -->
            </div>

            <!-- Message vide -->
            <div id="empty-message" class="hidden text-center py-12">
                <i class="fas fa-users-slash text-6xl text-gray-700 mb-4"></i>
                <p class="text-xl text-gray-500">Aucun sous-traitant trouvé</p>
            </div>
        </div>

        <!-- Modal Création/Édition -->
        <div id="modal-create" class="hidden fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div class="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border-2 border-green-400">
                <div class="p-6">
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-2xl font-black text-green-400">
                            <i class="fas fa-user-plus mr-2"></i>
                            <span id="modal-title">NOUVEAU SOUS-TRAITANT</span>
                        </h2>
                        <button onclick="closeModal()" class="text-gray-400 hover:text-white text-2xl">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>

                    <form id="form-subcontractor" onsubmit="saveSubcontractor(event)" class="space-y-6">
                        <!-- Informations générales -->
                        <div>
                            <h3 class="text-lg font-black text-white mb-3 border-b border-gray-700 pb-2">
                                <i class="fas fa-building mr-2"></i>
                                INFORMATIONS GÉNÉRALES
                            </h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm text-gray-400 mb-2">Nom société *</label>
                                    <input type="text" name="company_name" required class="w-full bg-gray-800 text-white p-2 rounded">
                                </div>
                                <div>
                                    <label class="block text-sm text-gray-400 mb-2">SIRET</label>
                                    <input type="text" name="siret" class="w-full bg-gray-800 text-white p-2 rounded">
                                </div>
                                <div>
                                    <label class="block text-sm text-gray-400 mb-2">Nom contact *</label>
                                    <input type="text" name="contact_name" required class="w-full bg-gray-800 text-white p-2 rounded">
                                </div>
                                <div>
                                    <label class="block text-sm text-gray-400 mb-2">Email *</label>
                                    <input type="email" name="contact_email" required class="w-full bg-gray-800 text-white p-2 rounded">
                                </div>
                                <div>
                                    <label class="block text-sm text-gray-400 mb-2">Téléphone</label>
                                    <input type="tel" name="contact_phone" class="w-full bg-gray-800 text-white p-2 rounded">
                                </div>
                                <div>
                                    <label class="block text-sm text-gray-400 mb-2">Ville</label>
                                    <input type="text" name="city" class="w-full bg-gray-800 text-white p-2 rounded">
                                </div>
                            </div>
                        </div>

                        <!-- Spécialités -->
                        <div>
                            <h3 class="text-lg font-black text-white mb-3 border-b border-gray-700 pb-2">
                                <i class="fas fa-tools mr-2"></i>
                                SPÉCIALITÉS TECHNIQUES *
                            </h3>
                            <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
                                <label class="flex items-center space-x-2 cursor-pointer">
                                    <input type="checkbox" name="specialties" value="EL" class="form-checkbox">
                                    <span>EL</span>
                                </label>
                                <label class="flex items-center space-x-2 cursor-pointer">
                                    <input type="checkbox" name="specialties" value="IV" class="form-checkbox">
                                    <span>I-V</span>
                                </label>
                                <label class="flex items-center space-x-2 cursor-pointer">
                                    <input type="checkbox" name="specialties" value="THERMOGRAPHY" class="form-checkbox">
                                    <span>Thermographie</span>
                                </label>
                                <label class="flex items-center space-x-2 cursor-pointer">
                                    <input type="checkbox" name="specialties" value="VISUAL" class="form-checkbox">
                                    <span>Visuel</span>
                                </label>
                                <label class="flex items-center space-x-2 cursor-pointer">
                                    <input type="checkbox" name="specialties" value="ISOLATION" class="form-checkbox">
                                    <span>Isolation</span>
                                </label>
                            </div>
                        </div>

                        <!-- Tarification -->
                        <div>
                            <h3 class="text-lg font-black text-white mb-3 border-b border-gray-700 pb-2">
                                <i class="fas fa-euro-sign mr-2"></i>
                                TARIFICATION
                            </h3>
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label class="block text-sm text-gray-400 mb-2">Taux horaire (€/h)</label>
                                    <input type="number" name="hourly_rate" step="0.01" class="w-full bg-gray-800 text-white p-2 rounded">
                                </div>
                                <div>
                                    <label class="block text-sm text-gray-400 mb-2">Taux journalier (€/j)</label>
                                    <input type="number" name="daily_rate" step="0.01" class="w-full bg-gray-800 text-white p-2 rounded">
                                </div>
                                <div>
                                    <label class="block text-sm text-gray-400 mb-2">Frais km (€/km)</label>
                                    <input type="number" name="travel_cost_per_km" value="0.50" step="0.01" class="w-full bg-gray-800 text-white p-2 rounded">
                                </div>
                            </div>
                        </div>

                        <!-- Notes -->
                        <div>
                            <label class="block text-sm text-gray-400 mb-2">Notes</label>
                            <textarea name="notes" rows="3" class="w-full bg-gray-800 text-white p-2 rounded"></textarea>
                        </div>

                        <!-- Boutons -->
                        <div class="flex gap-3 justify-end">
                            <button type="button" onclick="closeModal()" class="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-lg">
                                Annuler
                            </button>
                            <button type="submit" class="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg font-black">
                                <i class="fas fa-save mr-2"></i>
                                ENREGISTRER
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            let currentSubcontractor = null;

            // Charger statistiques
            async function loadStats() {
                try {
                    const response = await axios.get('/api/subcontractors/stats');
                    const { stats } = response.data;

                    document.getElementById('stat-active').textContent = stats.active || 0;
                    document.getElementById('stat-rating').textContent = stats.avg_rating ? stats.avg_rating + ' ⭐' : 'N/A';
                    document.getElementById('stat-missions').textContent = stats.total_missions_all || 0;
                    document.getElementById('stat-inactive').textContent = stats.inactive || 0;
                } catch (error) {
                    console.error('Erreur chargement stats:', error);
                }
            }

            // Charger sous-traitants
            async function loadSubcontractors() {
                try {
                    const status = document.getElementById('filter-status').value;
                    const specialty = document.getElementById('filter-specialty').value;
                    const rating = document.getElementById('filter-rating').value;

                    let url = '/api/subcontractors?';
                    if (status) url += 'status=' + status + '&';
                    if (specialty) url += 'specialty=' + specialty + '&';
                    if (rating) url += 'min_rating=' + rating;

                    const response = await axios.get(url);
                    const subcontractors = response.data.subcontractors;

                    const container = document.getElementById('subcontractors-list');
                    const emptyMsg = document.getElementById('empty-message');

                    if (subcontractors.length === 0) {
                        container.classList.add('hidden');
                        emptyMsg.classList.remove('hidden');
                        return;
                    }

                    container.classList.remove('hidden');
                    emptyMsg.classList.add('hidden');

                    container.innerHTML = subcontractors.map(sub => {
                        const specialties = JSON.parse(sub.specialties || '[]');
                        const statusColors = {
                            'active': 'bg-green-600',
                            'inactive': 'bg-gray-600',
                            'suspended': 'bg-orange-600',
                            'blacklisted': 'bg-red-600'
                        };

                        return \`
                            <div class="bg-gray-900 rounded-lg p-6 border border-purple-400 hover:border-purple-300 transition">
                                <div class="flex justify-between items-start mb-4">
                                    <div class="flex-1">
                                        <div class="flex items-center gap-3 mb-2">
                                            <h3 class="text-2xl font-black text-white">\${sub.company_name}</h3>
                                            <span class="\${statusColors[sub.status] || 'bg-gray-600'} px-3 py-1 rounded-full text-xs font-bold">
                                                \${sub.status}
                                            </span>
                                        </div>
                                        <div class="flex items-center gap-4 text-gray-400">
                                            <span><i class="fas fa-user mr-1"></i>\${sub.contact_name}</span>
                                            <span><i class="fas fa-envelope mr-1"></i>\${sub.contact_email}</span>
                                            <span><i class="fas fa-star text-yellow-400 mr-1"></i>\${sub.rating.toFixed(1)}/5</span>
                                            <span><i class="fas fa-briefcase mr-1"></i>\${sub.total_missions} missions</span>
                                        </div>
                                    </div>
                                    <div class="flex gap-2">
                                        <a href="/subcontractors/\${sub.id}" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
                                            <i class="fas fa-eye"></i>
                                        </a>
                                        <button onclick="editSubcontractor(\${sub.id})" class="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button onclick="deleteSubcontractor(\${sub.id}, '\${sub.company_name}')" class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                                <div class="flex flex-wrap gap-2">
                                    \${specialties.map(spec => \`
                                        <span class="bg-purple-900 text-purple-200 px-3 py-1 rounded-full text-sm">
                                            \${spec}
                                        </span>
                                    \`).join('')}
                                </div>
                                \${sub.hourly_rate || sub.daily_rate ? \`
                                <div class="mt-3 text-sm text-gray-400">
                                    \${sub.hourly_rate ? \`<span class="mr-4"><i class="fas fa-clock mr-1"></i>\${sub.hourly_rate}€/h</span>\` : ''}
                                    \${sub.daily_rate ? \`<span><i class="fas fa-calendar-day mr-1"></i>\${sub.daily_rate}€/j</span>\` : ''}
                                </div>
                                \` : ''}
                            </div>
                        \`;
                    }).join('');

                } catch (error) {
                    console.error('Erreur chargement sous-traitants:', error);
                    alert('Erreur lors du chargement des sous-traitants');
                }
            }

            // Afficher modal création
            function showCreateModal() {
                currentSubcontractor = null;
                document.getElementById('modal-title').textContent = 'NOUVEAU SOUS-TRAITANT';
                document.getElementById('form-subcontractor').reset();
                document.getElementById('modal-create').classList.remove('hidden');
            }

            // Fermer modal
            function closeModal() {
                document.getElementById('modal-create').classList.add('hidden');
            }

            // Sauvegarder sous-traitant
            async function saveSubcontractor(event) {
                event.preventDefault();
                
                const formData = new FormData(event.target);
                const data = {
                    company_name: formData.get('company_name'),
                    siret: formData.get('siret'),
                    contact_name: formData.get('contact_name'),
                    contact_email: formData.get('contact_email'),
                    contact_phone: formData.get('contact_phone'),
                    city: formData.get('city'),
                    hourly_rate: formData.get('hourly_rate') || null,
                    daily_rate: formData.get('daily_rate') || null,
                    travel_cost_per_km: formData.get('travel_cost_per_km') || 0.50,
                    notes: formData.get('notes'),
                    specialties: formData.getAll('specialties')
                };

                if (data.specialties.length === 0) {
                    alert('Veuillez sélectionner au moins une spécialité');
                    return;
                }

                try {
                    if (currentSubcontractor) {
                        await axios.put(\`/api/subcontractors/\${currentSubcontractor}\`, data);
                    } else {
                        await axios.post('/api/subcontractors', data);
                    }

                    closeModal();
                    loadSubcontractors();
                    loadStats();
                    alert('Sous-traitant enregistré avec succès');
                } catch (error) {
                    console.error('Erreur sauvegarde:', error);
                    alert('Erreur lors de l\\'enregistrement');
                }
            }

            // Éditer sous-traitant
            async function editSubcontractor(id) {
                alert('Fonctionnalité édition à implémenter');
            }

            // Supprimer sous-traitant
            async function deleteSubcontractor(id, name) {
                if (!confirm(\`Supprimer le sous-traitant "\${name}" ?\`)) return;

                try {
                    await axios.delete(\`/api/subcontractors/\${id}\`);
                    loadSubcontractors();
                    loadStats();
                    alert('Sous-traitant supprimé avec succès');
                } catch (error) {
                    console.error('Erreur suppression:', error);
                    alert('Erreur lors de la suppression');
                }
            }

            // Réinitialiser filtres
            function resetFilters() {
                document.getElementById('filter-status').value = '';
                document.getElementById('filter-specialty').value = '';
                document.getElementById('filter-rating').value = '';
                loadSubcontractors();
            }

            // Initialisation
            loadStats();
            loadSubcontractors();
        </script>
    </body>
    </html>
  `;
}
