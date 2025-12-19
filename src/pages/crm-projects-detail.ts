import { getLayout } from './layout.js';

export function getCrmProjectsDetailPage() {
  const content = `
    <div class="max-w-7xl mx-auto space-y-8">

        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div class="flex items-start gap-4">
                <a href="/crm/projects" class="mt-2 text-slate-400 hover:text-slate-600 transition-colors">
                    <i class="fas fa-arrow-left text-xl"></i>
                </a>
                <div>
                    <div class="flex items-center gap-3 mb-1">
                        <h1 id="project-name-header" class="text-3xl font-black text-slate-900 tracking-tight">Chargement...</h1>
                        <span id="header-status-badge" class="hidden px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border"></span>
                    </div>
                    <div class="flex items-center gap-4 text-sm font-medium text-slate-500">
                        <span class="flex items-center gap-2">
                            <i class="fas fa-user-tie text-slate-400"></i>
                            <a href="#" id="client-link" class="hover:text-blue-600 hover:underline transition-colors">Client...</a>
                        </span>
                        <span class="text-slate-300">|</span>
                        <span class="flex items-center gap-2">
                            <i class="fas fa-map-marker-alt text-slate-400"></i>
                            <span id="address-header">...</span>
                        </span>
                    </div>
                </div>
            </div>

            <div class="flex items-center gap-3">
                <button onclick="deleteProject()" class="px-4 py-2.5 text-red-600 font-bold bg-red-50 hover:bg-red-100 rounded-xl transition-colors border border-red-100">
                    <i class="fas fa-trash-alt mr-2"></i>Supprimer
                </button>
                <a href="#" id="edit-btn" class="px-4 py-2.5 text-slate-600 font-bold bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors shadow-sm">
                    <i class="fas fa-pen mr-2"></i>Paramètres
                </a>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <!-- LEFT COLUMN: DIGITAL TWIN & TECH INFO -->
            <div class="space-y-6">
                
                <!-- Digital Twin Card -->
                <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden group">
                    <div class="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <h3 class="font-bold text-slate-800 text-sm uppercase tracking-wide flex items-center gap-2">
                            <i class="fas fa-layer-group text-blue-500"></i> Jumeau Numérique
                        </h3>
                        <a href="#" id="designer-link-header" class="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                            OUVRIR DESIGNER <i class="fas fa-external-link-alt ml-1"></i>
                        </a>
                    </div>
                    
                    <div class="relative h-48 bg-slate-100 flex items-center justify-center overflow-hidden">
                        <!-- Placeholder Pattern -->
                        <div class="absolute inset-0 opacity-10" style="background-image: radial-gradient(#64748b 1px, transparent 1px); background-size: 20px 20px;"></div>
                        
                        <div class="text-center z-10">
                            <div class="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-3 text-slate-300 text-2xl">
                                <i class="fas fa-map"></i>
                            </div>
                            <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Aucun plan 2D généré</p>
                        </div>

                        <!-- Hover Overlay -->
                        <a href="#" id="designer-link-overlay" class="absolute inset-0 bg-slate-900/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                            <button class="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                                <i class="fas fa-pen mr-2 text-blue-500"></i>Éditer le plan
                            </button>
                        </a>
                    </div>
                    
                    <!-- Quick Tech Summary -->
                    <div class="grid grid-cols-2 divide-x divide-slate-100 border-t border-slate-200">
                        <div class="p-4 text-center">
                            <div class="text-xs font-bold text-slate-400 uppercase mb-1">Puissance</div>
                            <div class="text-xl font-black text-slate-800" id="power-display">-</div>
                        </div>
                        <div class="p-4 text-center">
                            <div class="text-xs font-bold text-slate-400 uppercase mb-1">Modules</div>
                            <div class="text-xl font-black text-slate-800" id="modules-display">-</div>
                        </div>
                    </div>
                </div>

                <!-- Tech Details Card -->
                <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 class="font-bold text-slate-800 text-sm uppercase tracking-wide mb-4 flex items-center gap-2">
                        <i class="fas fa-microchip text-slate-400"></i> Fiche Technique
                    </h3>
                    <div class="space-y-4">
                        <div class="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <div class="mt-0.5 text-blue-500"><i class="fas fa-solar-panel"></i></div>
                            <div>
                                <div class="text-xs text-slate-400 font-bold uppercase mb-0.5">Type Modules</div>
                                <div class="text-sm font-bold text-slate-700" id="module-type-display">...</div>
                            </div>
                        </div>
                        <div class="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <div class="mt-0.5 text-purple-500"><i class="fas fa-charging-station"></i></div>
                            <div>
                                <div class="text-xs text-slate-400 font-bold uppercase mb-0.5">Onduleurs</div>
                                <div class="text-sm font-bold text-slate-700" id="inverter-display">...</div>
                            </div>
                        </div>
                         <div class="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <div class="mt-0.5 text-slate-400"><i class="fas fa-calendar-alt"></i></div>
                            <div>
                                <div class="text-xs text-slate-400 font-bold uppercase mb-0.5">Mise en service</div>
                                <div class="text-sm font-bold text-slate-700" id="install-date-display">...</div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <!-- RIGHT COLUMN: MISSIONS & ACTIVITY -->
            <div class="lg:col-span-2 space-y-6">
                
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="text-xl font-black text-slate-900">Missions & Audits</h2>
                        <p class="text-slate-500 text-sm font-medium">Suivi des interventions techniques</p>
                    </div>
                    <button onclick="openMissionModal()" class="px-5 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-200 hover:shadow-green-300 transform hover:-translate-y-0.5 flex items-center">
                        <i class="fas fa-plus mr-2"></i>Nouvelle Mission
                    </button>
                </div>

                <!-- Missions Feed -->
                <div id="missions-list" class="space-y-4">
                     <!-- Loading state -->
                    <div class="py-12 text-center text-slate-400">
                        <i class="fas fa-circle-notch fa-spin text-2xl mb-3 text-blue-500"></i>
                        <p class="font-medium">Chargement de l'historique...</p>
                    </div>
                </div>

                <!-- Empty State -->
                <div id="empty-missions" class="hidden bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
                    <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-green-500 text-2xl">
                        <i class="fas fa-calendar-plus"></i>
                    </div>
                    <h3 class="text-lg font-bold text-slate-900 mb-1">Aucune mission planifiée</h3>
                    <p class="text-slate-500 mb-6 max-w-sm mx-auto">Programmez une inspection visuelle, un audit EL ou une thermographie pour ce site.</p>
                    <button onclick="openMissionModal()" class="text-green-600 font-bold hover:underline">Planifier maintenant</button>
                </div>

            </div>
        </div>
    </div>

    <!-- MODAL CRÉATION MISSION -->
    <div id="mission-modal" class="fixed inset-0 z-50 hidden bg-slate-900/60 backdrop-blur-sm items-center justify-center p-4 opacity-0 transition-opacity duration-300">
        <div class="bg-white rounded-2xl w-full max-w-lg shadow-2xl transform scale-95 transition-transform duration-300" id="mission-modal-content">
            <div class="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
                <h3 class="text-xl font-black text-slate-800">Nouvelle Mission</h3>
                <button onclick="closeMissionModal()" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="p-8 space-y-6">
                <!-- Type Selection Grid -->
                <div>
                    <label class="block text-xs font-bold text-slate-500 uppercase mb-3">Type d'intervention</label>
                    <div class="grid grid-cols-2 gap-3">
                        <label class="cursor-pointer group">
                            <input type="checkbox" name="mission_type" value="EL" class="peer sr-only" checked>
                            <div class="p-4 border-2 border-slate-100 rounded-xl peer-checked:border-purple-500 peer-checked:bg-purple-50 hover:bg-slate-50 transition-all text-center h-full">
                                <i class="fas fa-moon text-2xl text-slate-300 peer-checked:text-purple-600 mb-2 group-hover:scale-110 transition-transform"></i>
                                <div class="font-bold text-slate-700 peer-checked:text-purple-900 text-sm">Audit EL</div>
                            </div>
                        </label>
                        <label class="cursor-pointer group">
                            <input type="checkbox" name="mission_type" value="THERMO" class="peer sr-only">
                            <div class="p-4 border-2 border-slate-100 rounded-xl peer-checked:border-red-500 peer-checked:bg-red-50 hover:bg-slate-50 transition-all text-center h-full">
                                <i class="fas fa-fire text-2xl text-slate-300 peer-checked:text-red-600 mb-2 group-hover:scale-110 transition-transform"></i>
                                <div class="font-bold text-slate-700 peer-checked:text-red-900 text-sm">Thermographie</div>
                            </div>
                        </label>
                        <label class="cursor-pointer group">
                            <input type="checkbox" name="mission_type" value="IV" class="peer sr-only">
                            <div class="p-4 border-2 border-slate-100 rounded-xl peer-checked:border-blue-500 peer-checked:bg-blue-50 hover:bg-slate-50 transition-all text-center h-full">
                                <i class="fas fa-wave-square text-2xl text-slate-300 peer-checked:text-blue-600 mb-2 group-hover:scale-110 transition-transform"></i>
                                <div class="font-bold text-slate-700 peer-checked:text-blue-900 text-sm">Courbes I-V</div>
                            </div>
                        </label>
                        <label class="cursor-pointer group">
                            <input type="checkbox" name="mission_type" value="VISUAL" class="peer sr-only">
                            <div class="p-4 border-2 border-slate-100 rounded-xl peer-checked:border-orange-500 peer-checked:bg-orange-50 hover:bg-slate-50 transition-all text-center h-full">
                                <i class="fas fa-eye text-2xl text-slate-300 peer-checked:text-orange-600 mb-2 group-hover:scale-110 transition-transform"></i>
                                <div class="font-bold text-slate-700 peer-checked:text-orange-900 text-sm">Inspection Visuelle</div>
                            </div>
                        </label>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Date prévue</label>
                        <input type="date" id="mission-date" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-medium text-slate-800">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Technicien</label>
                        <select id="mission-tech" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-medium text-slate-800">
                            <option value="">Non assigné</option>
                            <option value="1">Adrien P.</option>
                        </select>
                    </div>
                </div>
            </div>

            <div class="p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end gap-3">
                <button onclick="closeMissionModal()" class="px-5 py-2.5 text-slate-500 font-bold hover:bg-slate-200 rounded-xl transition-colors">Annuler</button>
                <button onclick="createMission()" class="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-200 transition-all transform hover:-translate-y-0.5">
                    Créer la mission
                </button>
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

            // Set default date
            document.getElementById('mission-date').valueAsDate = new Date();
        }

        async function loadProjectData() {
            try {
                const res = await fetch(\`/api/crm/projects/\${projectId}\`);
                const data = await res.json();
                
                if (!data.project) throw new Error('Projet introuvable');
                projectData = data.project;

                // Bind Data
                document.getElementById('project-name-header').textContent = projectData.name || projectData.project_name;
                
                // Status Badge
                const statusBadge = document.getElementById('header-status-badge');
                statusBadge.classList.remove('hidden');
                const styles = {
                    'active': 'bg-green-100 text-green-700 border-green-200',
                    'pending': 'bg-amber-100 text-amber-700 border-amber-200',
                    'completed': 'bg-blue-100 text-blue-700 border-blue-200'
                };
                statusBadge.className = \`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border \${styles[projectData.status] || styles.pending}\`;
                statusBadge.textContent = projectData.status;

                // Tech Infos
                document.getElementById('power-display').textContent = (projectData.total_power_kwp || '?') + ' kWc';
                document.getElementById('modules-display').textContent = projectData.module_count || '?';
                document.getElementById('address-header').textContent = projectData.address_city || 'Ville inconnue';
                document.getElementById('module-type-display').textContent = projectData.module_type || 'Non spécifié';
                document.getElementById('inverter-display').textContent = (projectData.inverter_count ? \`\${projectData.inverter_count}x \` : '') + (projectData.inverter_type || 'Non spécifié');
                document.getElementById('install-date-display').textContent = projectData.installation_date ? new Date(projectData.installation_date).toLocaleDateString('fr-FR') : 'Non renseignée';

                // Links
                document.getElementById('edit-btn').href = \`/crm/projects/edit?id=\${projectId}\`;
                const designerUrl = \`/pv/plant/\${projectId}/designer\`; // Mock URL
                document.getElementById('designer-link-header').href = designerUrl;
                document.getElementById('designer-link-overlay').href = designerUrl;

                // Client Fetch
                if (projectData.client_id) {
                    fetch(\`/api/crm/clients/\${projectData.client_id}\`)
                        .then(r => r.json())
                        .then(d => {
                            if(d.client) {
                                const link = document.getElementById('client-link');
                                link.textContent = d.client.company_name;
                                link.href = \`/crm/clients/detail?id=\${d.client.id}\`;
                            }
                        });
                }

            } catch (e) {
                console.error(e);
                alert('Erreur: Impossible de charger le site');
            }
        }

        async function loadMissions() {
            try {
                const res = await fetch(\`/api/planning/interventions?project_id=\${projectId}\`);
                const data = await res.json();
                const missions = data.interventions || [];

                const list = document.getElementById('missions-list');
                const empty = document.getElementById('empty-missions');
                
                list.innerHTML = '';

                if (missions.length === 0) {
                    empty.classList.remove('hidden');
                    return;
                }
                empty.classList.add('hidden');

                missions.sort((a,b) => new Date(b.intervention_date) - new Date(a.intervention_date)).forEach(m => {
                    const dateObj = new Date(m.intervention_date);
                    const day = dateObj.getDate();
                    const month = dateObj.toLocaleString('fr-FR', {month: 'short'}).toUpperCase();
                    
                    const types = m.intervention_type.split(',').map(t => {
                        const style = {
                            'EL': 'bg-purple-100 text-purple-700 border-purple-200',
                            'THERMO': 'bg-red-100 text-red-700 border-red-200',
                            'IV': 'bg-blue-100 text-blue-700 border-blue-200',
                            'VISUAL': 'bg-orange-100 text-orange-700 border-orange-200'
                        }[t.trim()] || 'bg-slate-100 text-slate-600 border-slate-200';
                        return \`<span class="px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wide \${style}">\${t}</span>\`;
                    }).join('');

                    list.innerHTML += \`
                        <div class="bg-white rounded-xl p-4 border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group">
                            <div class="flex items-center gap-4">
                                <div class="w-14 h-14 bg-slate-100 rounded-lg border border-slate-200 flex flex-col items-center justify-center flex-shrink-0 group-hover:bg-blue-50 group-hover:border-blue-100 group-hover:text-blue-600 transition-colors">
                                    <span class="text-xl font-black leading-none">\${day}</span>
                                    <span class="text-[10px] font-bold uppercase leading-none mt-1">\${month}</span>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center gap-2 mb-1">
                                        <h4 class="font-bold text-slate-900 truncate">Mission #\${m.id}</h4>
                                        <div class="flex gap-1">\${types}</div>
                                    </div>
                                    <div class="flex items-center gap-4 text-xs text-slate-500 font-medium">
                                        <span class="flex items-center gap-1"><i class="fas fa-user-hard-hat"></i> \${m.technician_name || 'Non assigné'}</span>
                                        <span class="flex items-center gap-1"><i class="fas fa-info-circle"></i> \${m.status}</span>
                                    </div>
                                </div>
                                <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <a href="/audit/create?intervention_id=\${m.id}" class="px-3 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2">
                                        <i class="fas fa-play"></i> Lancer
                                    </a>
                                </div>
                            </div>
                        </div>
                    \`;
                });

            } catch(e) { console.error(e); }
        }

        // --- MODAL LOGIC ---
        const modal = document.getElementById('mission-modal');
        const modalContent = document.getElementById('mission-modal-content');

        window.openMissionModal = function() {
            modal.classList.remove('hidden');
            // Small delay for transition
            setTimeout(() => {
                modal.classList.remove('opacity-0');
                modalContent.classList.remove('scale-95');
                modalContent.classList.add('scale-100');
            }, 10);
        }

        window.closeMissionModal = function() {
            modal.classList.add('opacity-0');
            modalContent.classList.remove('scale-100');
            modalContent.classList.add('scale-95');
            setTimeout(() => {
                modal.classList.add('hidden');
            }, 300);
        }

        window.createMission = async function() {
            const date = document.getElementById('mission-date').value;
            const tech = document.getElementById('mission-tech').value;
            const types = Array.from(document.querySelectorAll('input[name="mission_type"]:checked')).map(cb => cb.value).join(',');

            if (!date || !types) return alert('Veuillez sélectionner une date et au moins un type.');

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

                if(res.ok) {
                    closeMissionModal();
                    loadMissions();
                } else {
                    alert('Erreur lors de la création');
                }
            } catch(e) { console.error(e); alert('Erreur réseau'); }
        }

        window.deleteProject = async function() {
            if(confirm('Êtes-vous sûr ? Cette action est définitive.')) {
                await fetch(\`/api/crm/projects/\${projectId}\`, { method: 'DELETE' });
                window.location.href = '/crm/projects';
            }
        }

        init();
    </script>
  `;

  return getLayout('Cockpit Site', content, 'projects');
}
