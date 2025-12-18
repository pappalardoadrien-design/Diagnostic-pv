// Page Détail Projet/Site CRM - Hub Central ("Cockpit Projet")
// Nouvelle version "Plateforme Pro" - Centralisation Designer, Audits, Rapports

export function getCrmProjectsDetailPage() {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cockpit Projet - DiagPV</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        body { background: #f1f5f9; font-family: 'Segoe UI', system-ui, sans-serif; }
        
        /* Composants Pros */
        .card { 
            background: white; 
            border-radius: 12px; 
            border: 1px solid #e2e8f0; 
            box-shadow: 0 1px 3px rgba(0,0,0,0.05); 
            overflow: hidden;
        }
        
        .btn-primary { 
            background: #16a34a; 
            color: white; 
            padding: 0.5rem 1rem; 
            border-radius: 0.5rem; 
            font-weight: 600; 
            transition: all 0.2s; 
        }
        .btn-primary:hover { background: #15803d; }
        
        .btn-secondary { 
            background: white; 
            color: #475569; 
            border: 1px solid #cbd5e1; 
            padding: 0.5rem 1rem; 
            border-radius: 0.5rem; 
            font-weight: 600; 
            transition: all 0.2s; 
        }
        .btn-secondary:hover { background: #f8fafc; border-color: #94a3b8; }

        .btn-action-large {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 1.5rem;
            border-radius: 1rem;
            border: 2px dashed #cbd5e1;
            color: #64748b;
            transition: all 0.2s;
            cursor: pointer;
        }
        .btn-action-large:hover {
            border-color: #16a34a;
            background: #f0fdf4;
            color: #16a34a;
        }

        /* Status Badges */
        .status-badge { padding: 4px 12px; border-radius: 99px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
        .status-active { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
        .status-draft { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }

        /* Map Preview */
        .map-preview {
            height: 200px;
            background: #e2e8f0;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #94a3b8;
            position: relative;
        }
        .map-preview img { width: 100%; height: 100%; object-fit: cover; }
        
        .designer-overlay {
            position: absolute;
            inset: 0;
            background: rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.2s;
        }
        .map-preview:hover .designer-overlay { opacity: 1; }

        /* Modale */
        .modal { display: none; position: fixed; z-index: 100; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); align-items: center; justify-content: center; }
        .modal.active { display: flex; }
        .modal-box { background: white; border-radius: 16px; width: 100%; max-width: 500px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); animation: modalSlide 0.3s ease-out; }
        
        @keyframes modalSlide {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
</head>
<body>

    <!-- NAV BAR PRO -->
    <nav class="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div class="flex items-center gap-4">
                <a href="/crm/projects" class="text-gray-400 hover:text-gray-700 transition">
                    <i class="fas fa-arrow-left text-lg"></i>
                </a>
                <div class="h-6 w-px bg-gray-300"></div>
                <div class="flex flex-col">
                    <div class="text-xs font-bold text-gray-500 uppercase tracking-wider" id="client-name-header">CLIENT</div>
                    <div class="font-bold text-lg text-gray-900" id="project-name-header">Chargement...</div>
                </div>
                <span id="header-status-badge" class="status-badge status-draft ml-2">...</span>
            </div>
            
            <div class="flex items-center gap-3">
                <button onclick="deleteProject()" class="text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg text-sm font-semibold transition">
                    <i class="fas fa-trash mr-2"></i>Supprimer
                </button>
                <a href="#" id="edit-btn" class="btn-secondary text-sm">
                    <i class="fas fa-cog mr-2"></i>Paramètres
                </a>
            </div>
        </div>
    </nav>

    <!-- CONTENU PRINCIPAL -->
    <main class="max-w-7xl mx-auto px-6 py-8">
        
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <!-- COLONNE GAUCHE : IDENTITÉ & JUMEAU NUMÉRIQUE -->
            <div class="lg:col-span-1 space-y-6">
                
                <!-- Carte Jumeau Numérique -->
                <div class="card">
                    <div class="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h3 class="font-bold text-gray-800"><i class="fas fa-map mr-2 text-indigo-600"></i>Jumeau Numérique</h3>
                        <a href="#" id="designer-link-header" class="text-xs font-bold text-indigo-600 hover:underline">OUVRIR DESIGNER ↗</a>
                    </div>
                    
                    <div class="map-preview group" id="map-container">
                        <div class="text-center p-6">
                            <i class="fas fa-satellite text-4xl mb-2 text-gray-300"></i>
                            <p class="text-sm">Aperçu carte</p>
                        </div>
                        <a href="#" id="designer-link-overlay" class="designer-overlay">
                            <button class="bg-white text-indigo-600 px-6 py-3 rounded-full font-bold shadow-lg transform group-hover:scale-105 transition">
                                <i class="fas fa-pen mr-2"></i>Modifier le plan
                            </button>
                        </a>
                    </div>
                    
                    <div class="p-4 bg-indigo-50 border-t border-indigo-100">
                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <div class="text-gray-500 text-xs">Puissance</div>
                                <div class="font-bold text-gray-900" id="power-display">-</div>
                            </div>
                            <div>
                                <div class="text-gray-500 text-xs">Modules</div>
                                <div class="font-bold text-gray-900" id="modules-display">-</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Carte Identité Site -->
                <div class="card p-6">
                    <h3 class="font-bold text-gray-800 mb-4">Fiche Technique</h3>
                    <div class="space-y-4">
                        <div class="flex items-start gap-3">
                            <div class="mt-1 text-gray-400"><i class="fas fa-map-marker-alt"></i></div>
                            <div>
                                <div class="text-xs text-gray-500 font-bold uppercase">Adresse</div>
                                <div class="text-sm text-gray-900" id="address-display">...</div>
                            </div>
                        </div>
                        <div class="flex items-start gap-3">
                            <div class="mt-1 text-gray-400"><i class="fas fa-solar-panel"></i></div>
                            <div>
                                <div class="text-xs text-gray-500 font-bold uppercase">Matériel</div>
                                <div class="text-sm text-gray-900" id="hardware-display">...</div>
                            </div>
                        </div>
                        <div class="flex items-start gap-3">
                            <div class="mt-1 text-gray-400"><i class="fas fa-user-tie"></i></div>
                            <div>
                                <div class="text-xs text-gray-500 font-bold uppercase">Propriétaire</div>
                                <a href="#" id="client-link" class="text-sm text-blue-600 hover:underline font-bold">...</a>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <!-- COLONNE DROITE : MISSIONS & RAPPORTS -->
            <div class="lg:col-span-2 space-y-6">
                
                <!-- En-tête Section Missions -->
                <div class="flex justify-between items-end">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-900">Missions & Audits</h2>
                        <p class="text-gray-500 text-sm">Historique des interventions sur ce site</p>
                    </div>
                    <button onclick="openMissionModal()" class="btn-primary shadow-lg shadow-green-200">
                        <i class="fas fa-plus mr-2"></i>Nouvelle Mission
                    </button>
                </div>

                <!-- Liste des Missions (Cards) -->
                <div id="missions-list" class="space-y-4">
                    <!-- Loading state -->
                    <div class="card p-8 text-center text-gray-400">
                        <i class="fas fa-circle-notch fa-spin text-2xl mb-2"></i>
                        <p>Chargement des missions...</p>
                    </div>
                </div>

                <!-- Empty State (si aucune mission) -->
                <div id="empty-missions" class="hidden">
                    <button onclick="openMissionModal()" class="w-full btn-action-large">
                        <div class="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4 text-green-600">
                            <i class="fas fa-plus text-2xl"></i>
                        </div>
                        <span class="font-bold text-lg text-gray-800">Planifier la première mission</span>
                        <span class="text-sm mt-1">Audit EL, Thermographie, Inspection Visuelle...</span>
                    </button>
                </div>

            </div>
        </div>
    </main>

    <!-- MODAL CRÉATION MISSION -->
    <div id="mission-modal" class="modal">
        <div class="modal-box">
            <div class="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 class="text-xl font-bold text-gray-900">Nouvelle Mission</h3>
                <button onclick="closeMissionModal()" class="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            
            <div class="p-6 space-y-6">
                <!-- Sélection Type -->
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-3">Type d'intervention</label>
                    <div class="grid grid-cols-2 gap-3">
                        <label class="cursor-pointer">
                            <input type="checkbox" name="mission_type" value="EL" class="peer sr-only" checked>
                            <div class="p-3 border-2 border-gray-200 rounded-lg peer-checked:border-green-500 peer-checked:bg-green-50 hover:bg-gray-50 transition text-center">
                                <i class="fas fa-moon text-indigo-600 mb-1 block text-xl"></i>
                                <span class="text-sm font-bold text-gray-700">Audit EL</span>
                            </div>
                        </label>
                        <label class="cursor-pointer">
                            <input type="checkbox" name="mission_type" value="THERMO" class="peer sr-only">
                            <div class="p-3 border-2 border-gray-200 rounded-lg peer-checked:border-green-500 peer-checked:bg-green-50 hover:bg-gray-50 transition text-center">
                                <i class="fas fa-fire text-red-500 mb-1 block text-xl"></i>
                                <span class="text-sm font-bold text-gray-700">Thermique</span>
                            </div>
                        </label>
                        <label class="cursor-pointer">
                            <input type="checkbox" name="mission_type" value="IV" class="peer sr-only">
                            <div class="p-3 border-2 border-gray-200 rounded-lg peer-checked:border-green-500 peer-checked:bg-green-50 hover:bg-gray-50 transition text-center">
                                <i class="fas fa-chart-line text-blue-500 mb-1 block text-xl"></i>
                                <span class="text-sm font-bold text-gray-700">Courbes IV</span>
                            </div>
                        </label>
                        <label class="cursor-pointer">
                            <input type="checkbox" name="mission_type" value="VISUAL" class="peer sr-only">
                            <div class="p-3 border-2 border-gray-200 rounded-lg peer-checked:border-green-500 peer-checked:bg-green-50 hover:bg-gray-50 transition text-center">
                                <i class="fas fa-eye text-orange-500 mb-1 block text-xl"></i>
                                <span class="text-sm font-bold text-gray-700">Visuel</span>
                            </div>
                        </label>
                    </div>
                </div>

                <!-- Date -->
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">Date prévue</label>
                    <input type="date" id="mission-date" class="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 outline-none">
                </div>

                <!-- Technicien -->
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">Technicien assigné</label>
                    <select id="mission-tech" class="w-full border border-gray-300 rounded-lg p-3 bg-white outline-none">
                        <option value="">-- Choisir un technicien --</option>
                        <option value="1">Adrien Pappalardo</option>
                        <option value="2">Technicien Réseau 01</option>
                    </select>
                </div>
            </div>

            <div class="p-6 border-t border-gray-100 bg-gray-50 rounded-b-16 flex justify-end gap-3">
                <button onclick="closeMissionModal()" class="btn-secondary">Annuler</button>
                <button onclick="createMission()" class="btn-primary px-6">Créer la mission</button>
            </div>
        </div>
    </div>

    <script>
        const urlParams = new URLSearchParams(window.location.search);
        const projectId = urlParams.get('id');
        let projectData = null;

        // --- INIT ---
        async function init() {
            if (!projectId) return window.location.href = '/crm/projects';
            
            await loadProjectData();
            loadMissions();
        }

        // --- DATA LOADING ---
        async function loadProjectData() {
            try {
                const res = await fetch(\`/api/crm/projects/\${projectId}\`);
                const data = await res.json();
                
                if (!data.project) throw new Error('Projet introuvable');
                projectData = data.project;

                // Update UI
                document.getElementById('project-name-header').textContent = projectData.name || projectData.project_name;
                document.getElementById('header-status-badge').textContent = projectData.status || 'Actif';
                
                document.getElementById('power-display').textContent = (projectData.total_power_kwp || 0) + ' kWp';
                document.getElementById('modules-display').textContent = projectData.module_count || 0;
                
                const addr = [projectData.address_street, projectData.address_city].filter(Boolean).join(', ');
                document.getElementById('address-display').textContent = addr || 'Adresse non renseignée';
                
                const hw = [projectData.module_type, projectData.inverter_type].filter(Boolean).join(' / ');
                document.getElementById('hardware-display').textContent = hw || 'Non spécifié';

                // Client Link
                if (projectData.client_id) {
                    loadClientName(projectData.client_id);
                }

                // Links
                document.getElementById('edit-btn').href = \`/crm/projects/edit?id=\${projectId}\`;
                
                // MAP & DESIGNER LINK
                // IMPORTANT : C'est ici qu'on fait le lien avec la carto
                // Le Designer a besoin du plantId (qui est l'ID du projet ici) et d'un zoneId par défaut (souvent 1)
                const designerUrl = \`/pv/plant/\${projectId}/zone/1/designer\`; 
                document.getElementById('designer-link-header').href = designerUrl;
                document.getElementById('designer-link-overlay').href = designerUrl;

            } catch (e) {
                console.error(e);
                alert('Erreur chargement projet');
            }
        }

        async function loadClientName(clientId) {
            const res = await fetch(\`/api/crm/clients/\${clientId}\`);
            const data = await res.json();
            if (data.client) {
                const link = document.getElementById('client-link');
                link.textContent = data.client.company_name;
                link.href = \`/crm/clients/detail?id=\${clientId}\`;
                document.getElementById('client-name-header').textContent = data.client.company_name;
            }
        }

        async function loadMissions() {
            // On charge les "Interventions" qui servent de conteneur aux audits
            // C'est ça la notion de "Mission"
            const res = await fetch(\`/api/planning/interventions?project_id=\${projectId}\`);
            const data = await res.json();
            const missions = data.interventions || [];

            const list = document.getElementById('missions-list');
            list.innerHTML = '';

            if (missions.length === 0) {
                document.getElementById('empty-missions').classList.remove('hidden');
                return;
            }

            // Pour chaque mission, on va chercher s'il y a des audits liés (EL, etc)
            // Note: Dans une V2 optimisée, l'API interventions devrait retourner les audits liés directement
            
            missions.sort((a,b) => new Date(b.intervention_date) - new Date(a.intervention_date)).forEach(m => {
                const date = new Date(m.intervention_date).toLocaleDateString('fr-FR');
                const types = m.intervention_type.split(',').map(t => t.trim());
                
                let badges = types.map(t => {
                    let color = 'bg-gray-100 text-gray-600';
                    if(t.includes('EL')) color = 'bg-indigo-100 text-indigo-700 border-indigo-200';
                    if(t.includes('THERMO')) color = 'bg-red-100 text-red-700 border-red-200';
                    if(t.includes('IV')) color = 'bg-blue-100 text-blue-700 border-blue-200';
                    return \`<span class="px-2 py-1 rounded text-xs font-bold border \${color} mr-2">\${t}</span>\`;
                }).join('');

                list.innerHTML += \`
                <div class="card p-5 hover:border-green-400 transition group">
                    <div class="flex justify-between items-start">
                        <div class="flex gap-4">
                            <div class="bg-gray-100 w-16 h-16 rounded-lg flex flex-col items-center justify-center text-gray-500 font-bold border border-gray-200">
                                <span class="text-xl">\${date.split('/')[0]}</span>
                                <span class="text-xs uppercase">\${new Date(m.intervention_date).toLocaleString('default', {month:'short'})}</span>
                            </div>
                            <div>
                                <div class="flex items-center mb-1">
                                    <h4 class="font-bold text-gray-900 text-lg mr-3">Intervention #\${m.id}</h4>
                                    \${badges}
                                </div>
                                <div class="text-sm text-gray-500 mb-2">
                                    <i class="fas fa-user-hard-hat mr-2"></i>\${m.technician_name || 'Non assigné'}
                                </div>
                                <div class="flex gap-2 mt-3">
                                    <a href="/audit/create?intervention_id=\${m.id}" class="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-md flex items-center">
                                        <i class="fas fa-play mr-1.5"></i>LANCER AUDIT
                                    </a>
                                    <a href="#" class="text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-md border border-gray-200">
                                        <i class="fas fa-file-pdf mr-1.5"></i>RAPPORT
                                    </a>
                                </div>
                            </div>
                        </div>
                        <div class="text-right">
                            <span class="status-badge \${m.status === 'TERMINE' ? 'status-active' : 'status-draft'}">\${m.status}</span>
                        </div>
                    </div>
                </div>
                \`;
            });
        }

        // --- ACTIONS ---
        function openMissionModal() {
            // Set default date to today
            document.getElementById('mission-date').valueAsDate = new Date();
            document.getElementById('mission-modal').classList.add('active');
        }

        function closeMissionModal() {
            document.getElementById('mission-modal').classList.remove('active');
        }

        async function createMission() {
            const date = document.getElementById('mission-date').value;
            const tech = document.getElementById('mission-tech').value;
            
            // Récupérer types cochés
            const types = Array.from(document.querySelectorAll('input[name="mission_type"]:checked'))
                .map(cb => cb.value)
                .join(',');

            if (!date || !types) return alert('Date et type requis');

            // Création via API Planning
            // Note: On simule une création simplifiée
            try {
                const res = await fetch('/api/planning/interventions', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        project_id: projectId,
                        date: date,
                        type: types,
                        technician_id: tech || null,
                        status: 'PLANIFIE'
                    })
                });

                if (res.ok) {
                    closeMissionModal();
                    loadMissions(); // Refresh
                } else {
                    alert('Erreur création mission');
                }
            } catch (e) {
                console.error(e);
                alert('Erreur réseau');
            }
        }

        async function deleteProject() {
            if(confirm('Êtes-vous sûr de vouloir supprimer ce site et toutes ses données ?')) {
                await fetch(\`/api/crm/projects/\${projectId}\`, { method: 'DELETE' });
                window.location.href = '/crm/projects';
            }
        }

        init();
    </script>
</body>
</html>
  `;
}
