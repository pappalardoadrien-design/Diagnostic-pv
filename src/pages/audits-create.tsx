import { getLayout } from './layout.js';

export function getAuditsCreatePage() {
  const content = `
    <div class="max-w-3xl mx-auto">
        <!-- HEADER -->
        <div class="text-center mb-8">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 shadow-lg shadow-green-200 mb-4">
                <i class="fas fa-rocket text-2xl text-white"></i>
            </div>
            <h1 class="text-3xl font-black text-slate-900 tracking-tight">Nouvelle Mission</h1>
            <p class="text-slate-500 font-medium">Lancer une séquence d'audit terrain</p>
        </div>

        <!-- WIZARD CARD -->
        <div class="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden relative">
            
            <!-- PROGRESS BAR -->
            <div class="absolute top-0 left-0 w-full h-1.5 bg-slate-100">
                <div class="h-full bg-gradient-to-r from-green-400 to-emerald-500 w-1/3 transition-all duration-500" id="progress-bar"></div>
            </div>

            <form id="createAuditForm" class="p-8">
                
                <!-- STEP 1 : CIBLE -->
                <div id="step-1" class="step-content">
                    <h2 class="text-xl font-bold text-slate-800 mb-6 flex items-center">
                        <span class="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm mr-3 font-black">1</span>
                        Quel site auditer ?
                    </h2>
                    
                    <div class="space-y-4">
                        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Centrale PV, Intervention ou Projet</label>
                        <div class="relative group">
                            <i class="fas fa-search absolute left-4 top-4 text-slate-400 group-hover:text-green-500 transition-colors"></i>
                            <select id="intervention_id" class="w-full pl-12 pr-10 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-green-500 focus:bg-white outline-none font-bold text-slate-700 transition-all cursor-pointer appearance-none">
                                <option value="">Chargement des dossiers...</option>
                            </select>
                            <div class="absolute right-4 top-4 pointer-events-none text-slate-400">
                                <i class="fas fa-chevron-down"></i>
                            </div>
                        </div>
                        
                        <div class="bg-green-50 border border-green-100 rounded-xl p-4 flex items-start gap-3">
                            <i class="fas fa-solar-panel text-green-500 mt-0.5"></i>
                            <p class="text-sm text-green-700 font-medium">
                                <strong>Recommandé :</strong> Sélectionnez une <strong>Centrale PV</strong> pour créer automatiquement la liaison avec le calepinage.
                            </p>
                        </div>
                    </div>
                </div>

                <!-- STEP 2 : TECHNIQUE (AUTO) -->
                <div id="step-2" class="step-content hidden opacity-0 transition-all duration-300 transform translate-y-4">
                    <div class="my-8 border-t border-slate-100"></div>
                    <h2 class="text-xl font-bold text-slate-800 mb-6 flex items-center">
                        <span class="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm mr-3 font-black">2</span>
                        Vérification Technique
                    </h2>

                    <div id="config-card" class="bg-slate-50 rounded-xl p-5 border border-slate-200 transition-all">
                        <div class="flex items-start gap-4">
                            <div id="config-icon" class="w-14 h-14 rounded-xl bg-slate-200 flex items-center justify-center text-2xl shadow-sm flex-shrink-0">
                                <i class="fas fa-cog text-slate-400"></i>
                            </div>
                            <div class="flex-1 min-w-0">
                                <h4 id="project-name-display" class="font-black text-slate-800 text-lg truncate">...</h4>
                                <div id="config-details" class="text-sm text-slate-500 mt-1 space-y-1 font-medium">
                                    <!-- JS Filled -->
                                </div>
                            </div>
                        </div>
                        
                        <!-- Warning Auto -->
                        <div id="config-warning" class="hidden mt-4 bg-amber-50 text-amber-800 text-xs font-bold p-3 rounded-lg border border-amber-200 flex items-center gap-3">
                            <i class="fas fa-exclamation-triangle text-xl"></i>
                            <span>Configuration technique incomplète. Une grille par défaut sera générée.</span>
                        </div>
                        
                        <!-- PV Link Info -->
                        <div id="pv-link-info" class="hidden mt-4 bg-green-50 text-green-800 text-xs font-bold p-3 rounded-lg border border-green-200 flex items-center gap-3">
                            <i class="fas fa-link text-xl"></i>
                            <span>Liaison automatique avec la cartographie PV activée</span>
                        </div>
                    </div>
                </div>

                <!-- STEP 3 : OUTILS -->
                <div id="step-3" class="step-content hidden opacity-0 transition-all duration-300 transform translate-y-4">
                    <div class="my-8 border-t border-slate-100"></div>
                    <h2 class="text-xl font-bold text-slate-800 mb-6 flex items-center">
                        <span class="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm mr-3 font-black">3</span>
                        Outils à activer
                    </h2>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <!-- EL -->
                        <label class="cursor-pointer relative group">
                            <input type="checkbox" name="modules" value="EL" checked class="peer sr-only">
                            <div class="p-4 border-2 border-slate-200 rounded-xl peer-checked:border-purple-500 peer-checked:bg-purple-50 hover:border-slate-300 transition-all h-full flex flex-col items-center text-center">
                                <div class="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <i class="fas fa-moon"></i>
                                </div>
                                <span class="font-bold text-slate-700 text-sm peer-checked:text-purple-800">Électro (EL)</span>
                            </div>
                            <div class="absolute top-3 right-3 text-purple-500 opacity-0 peer-checked:opacity-100 transition-opacity">
                                <i class="fas fa-check-circle"></i>
                            </div>
                        </label>
                        
                        <!-- Thermographie -->
                        <label class="cursor-pointer relative group">
                            <input type="checkbox" name="modules" value="THERMO" class="peer sr-only">
                            <div class="p-4 border-2 border-slate-200 rounded-xl peer-checked:border-red-500 peer-checked:bg-red-50 hover:border-slate-300 transition-all h-full flex flex-col items-center text-center">
                                <div class="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <i class="fas fa-fire"></i>
                                </div>
                                <span class="font-bold text-slate-700 text-sm peer-checked:text-red-800">Thermique</span>
                            </div>
                            <div class="absolute top-3 right-3 text-red-500 opacity-0 peer-checked:opacity-100 transition-opacity">
                                <i class="fas fa-check-circle"></i>
                            </div>
                        </label>

                        <!-- Visuel -->
                        <label class="cursor-pointer relative group">
                            <input type="checkbox" name="modules" value="VISUAL" class="peer sr-only">
                            <div class="p-4 border-2 border-slate-200 rounded-xl peer-checked:border-orange-500 peer-checked:bg-orange-50 hover:border-slate-300 transition-all h-full flex flex-col items-center text-center">
                                <div class="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <i class="fas fa-eye"></i>
                                </div>
                                <span class="font-bold text-slate-700 text-sm peer-checked:text-orange-800">Visuel</span>
                            </div>
                            <div class="absolute top-3 right-3 text-orange-500 opacity-0 peer-checked:opacity-100 transition-opacity">
                                <i class="fas fa-check-circle"></i>
                            </div>
                        </label>

                        <!-- IV Curves -->
                        <label class="cursor-pointer relative group">
                            <input type="checkbox" name="modules" value="IV" class="peer sr-only">
                            <div class="p-4 border-2 border-slate-200 rounded-xl peer-checked:border-blue-500 peer-checked:bg-blue-50 hover:border-slate-300 transition-all h-full flex flex-col items-center text-center">
                                <div class="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <i class="fas fa-wave-square"></i>
                                </div>
                                <span class="font-bold text-slate-700 text-sm peer-checked:text-blue-800">Courbes I-V</span>
                            </div>
                            <div class="absolute top-3 right-3 text-blue-500 opacity-0 peer-checked:opacity-100 transition-opacity">
                                <i class="fas fa-check-circle"></i>
                            </div>
                        </label>
                    </div>
                </div>

                <!-- ACTION BAR -->
                <div class="mt-8 pt-6">
                    <button type="submit" id="submitBtn" disabled 
                        class="w-full py-4 bg-slate-100 text-slate-400 font-black rounded-xl transition-all cursor-not-allowed flex items-center justify-center group">
                        <span class="mr-2 group-hover:scale-105 transition-transform">SÉLECTIONNEZ UN SITE</span>
                        <i class="fas fa-arrow-right opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all"></i>
                    </button>
                </div>

            </form>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
        // --- GLOBAL STATE ---
        let selectedPlant = null;
        let selectedProject = null;
        
        // --- LOGIC ---
        async function loadInterventions() {
            try {
                const [resInterventions, resProjects, resPlants] = await Promise.all([
                    axios.get('/api/planning/interventions'),
                    axios.get('/api/crm/projects'),
                    axios.get('/api/pv/plants')
                ]);

                const select = document.getElementById('intervention_id');
                select.innerHTML = '<option value="">-- Choisir un dossier --</option>';
                
                // Group 0: CENTRALES PV (RECOMMANDÉ)
                const plants = resPlants.data.plants || [];
                if (plants.length > 0) {
                    const optGroup = document.createElement('optgroup');
                    optGroup.label = "🏭 CENTRALES PV (Recommandé)";
                    
                    plants
                        .filter(p => p.module_count > 0)
                        .sort((a,b) => (a.plant_name||'').localeCompare(b.plant_name||''))
                        .forEach(p => {
                            const opt = document.createElement('option');
                            opt.value = 'PLANT:' + p.id;
                            opt.textContent = \`\${p.plant_name} • \${p.client_name || '?'} (\${p.module_count} modules)\`;
                            optGroup.appendChild(opt);
                        });
                    select.appendChild(optGroup);
                }
                
                // Group 1: Interventions Planifiées
                const interventions = resInterventions.data.interventions || [];
                if (interventions.length > 0) {
                    const optGroup = document.createElement('optgroup');
                    optGroup.label = "📅 AGENDA";
                    
                    interventions
                        .sort((a,b) => new Date(b.intervention_date) - new Date(a.intervention_date))
                        .forEach(i => {
                            const date = new Date(i.intervention_date).toLocaleDateString('fr-FR');
                            const opt = document.createElement('option');
                            opt.value = 'INT:' + i.id;
                            opt.textContent = \`\${date} • \${i.project_name || 'Projet sans nom'} (\${i.client_name || '?'})\`;
                            optGroup.appendChild(opt);
                        });
                    select.appendChild(optGroup);
                }

                // Group 2: Tous les Projets CRM
                const projects = resProjects.data.projects || [];
                if (projects.length > 0) {
                    const optGroup = document.createElement('optgroup');
                    optGroup.label = "📂 PROJETS CRM";
                    
                    projects
                        .sort((a,b) => (a.name||'').localeCompare(b.name||''))
                        .slice(0, 50) // Limiter à 50
                        .forEach(p => {
                            const opt = document.createElement('option');
                            opt.value = 'PROJ:' + p.id;
                            opt.textContent = \`\${p.name || p.project_name} • \${p.client_name || '?'}\`;
                            optGroup.appendChild(opt);
                        });
                    select.appendChild(optGroup);
                }

            } catch(e) { 
                console.error(e);
                const select = document.getElementById('intervention_id');
                select.innerHTML = '<option value="">Erreur chargement (hors ligne ?)</option>';
            }
        }

        async function loadSelectionDetails(value) {
            const step2 = document.getElementById('step-2');
            const step3 = document.getElementById('step-3');
            const btn = document.getElementById('submitBtn');
            const details = document.getElementById('config-details');
            const icon = document.getElementById('config-icon');
            const warning = document.getElementById('config-warning');
            const pvLinkInfo = document.getElementById('pv-link-info');
            const progress = document.getElementById('progress-bar');
            
            // Reset state
            selectedPlant = null;
            selectedProject = null;
            
            if (!value) {
                step2.classList.add('hidden', 'opacity-0', 'translate-y-4');
                step3.classList.add('hidden', 'opacity-0', 'translate-y-4');
                progress.style.width = '33%';
                
                btn.disabled = true;
                btn.className = "w-full py-4 bg-slate-100 text-slate-400 font-black rounded-xl transition-all cursor-not-allowed flex items-center justify-center";
                btn.innerHTML = "<span>SÉLECTIONNEZ UN SITE</span>";
                return;
            }

            // Show Loading State
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-2"></i> ANALYSE...';
            
            // Unfold Steps
            step2.classList.remove('hidden');
            setTimeout(() => step2.classList.remove('opacity-0', 'translate-y-4'), 50);
            
            step3.classList.remove('hidden');
            setTimeout(() => step3.classList.remove('opacity-0', 'translate-y-4'), 150);
            
            progress.style.width = '100%';

            try {
                const [type, id] = value.split(':');
                let displayData = {};
                let hasConfig = false;
                let isPVPlant = false;

                if (type === 'PLANT') {
                    // === CENTRALE PV ===
                    isPVPlant = true;
                    const res = await axios.get(\`/api/pv/plants/\${id}\`);
                    const plant = res.data.plant;
                    const zones = res.data.zones || [];
                    
                    selectedPlant = { ...plant, zones };
                    
                    // Calculer config depuis zones
                    const totalModules = zones.reduce((sum, z) => sum + (z.module_count || 0), 0);
                    const stringCount = zones.length;
                    
                    displayData = {
                        name: plant.plant_name,
                        client_name: plant.client_name,
                        location: plant.address || plant.city,
                        total_power_kwp: (totalModules * 0.185).toFixed(2), // Estimation 185W/module
                        module_count: totalModules,
                        string_count: stringCount
                    };
                    
                    hasConfig = totalModules > 0 && stringCount > 0;
                    
                } else if (type === 'INT') {
                    // === INTERVENTION ===
                    const res = await axios.get(\`/api/planning/interventions/\${id}\`);
                    const intervention = res.data.intervention;
                    selectedProject = intervention;
                    
                    displayData = {
                        name: intervention.project_name || intervention.name,
                        client_name: intervention.client_name,
                        location: intervention.address_city || intervention.location,
                        total_power_kwp: intervention.total_power_kwp,
                        module_count: intervention.module_count
                    };
                    
                    hasConfig = intervention.strings_configuration || (intervention.module_count && intervention.string_count);
                    
                } else {
                    // === PROJET CRM ===
                    const res = await axios.get(\`/api/crm/projects/\${id}\`);
                    const project = res.data.project;
                    selectedProject = project;
                    
                    displayData = {
                        name: project.project_name || project.name,
                        client_name: project.client_name,
                        location: project.address_city,
                        total_power_kwp: project.total_power_kwp,
                        module_count: project.module_count
                    };
                    
                    hasConfig = project.strings_configuration || (project.module_count && project.string_count);
                }

                // Render Details
                document.getElementById('project-name-display').textContent = displayData.name || 'Sans nom';
                details.innerHTML = \`
                    <div class="flex items-center"><i class="fas fa-user-tie w-6 text-center text-slate-400"></i> \${displayData.client_name || 'Client inconnu'}</div>
                    <div class="flex items-center"><i class="fas fa-map-marker-alt w-6 text-center text-slate-400"></i> \${displayData.location || 'Loc. N/A'}</div>
                    <div class="flex items-center mt-2 pt-2 border-t border-slate-200 text-xs">
                        <span class="bg-slate-200 px-2 py-1 rounded font-bold mr-2 text-slate-600">\${displayData.total_power_kwp || '?'} kWc</span>
                        <span class="bg-slate-200 px-2 py-1 rounded font-bold text-slate-600">\${displayData.module_count || '?'} Modules</span>
                        \${displayData.string_count ? \`<span class="bg-slate-200 px-2 py-1 rounded font-bold ml-2 text-slate-600">\${displayData.string_count} Strings</span>\` : ''}
                    </div>
                \`;

                // Technical Check Icons
                if (hasConfig) {
                    icon.className = "w-14 h-14 rounded-xl bg-green-100 text-green-600 flex items-center justify-center text-2xl shadow-sm flex-shrink-0";
                    icon.innerHTML = '<i class="fas fa-check-circle"></i>';
                    warning.classList.add('hidden');
                } else {
                    icon.className = "w-14 h-14 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-2xl shadow-sm flex-shrink-0";
                    icon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
                    warning.classList.remove('hidden');
                }
                
                // PV Link Info
                if (isPVPlant) {
                    pvLinkInfo.classList.remove('hidden');
                } else {
                    pvLinkInfo.classList.add('hidden');
                }

                // Enable Submit
                btn.disabled = false;
                btn.className = "w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-black rounded-xl shadow-xl shadow-green-200 hover:shadow-2xl hover:-translate-y-1 transform transition-all flex items-center justify-center text-lg";
                btn.innerHTML = \`<i class="fas fa-rocket mr-3"></i> LANCER LA MISSION\`;

            } catch (e) {
                console.error(e);
                btn.innerHTML = "ERREUR CHARGEMENT";
                alert("Erreur lors de la récupération des données.");
            }
        }

        document.getElementById('intervention_id').addEventListener('change', (e) => loadSelectionDetails(e.target.value));

        // --- SUBMIT ---
        document.getElementById('createAuditForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('submitBtn');
            const originalContent = btn.innerHTML;
            
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-sync fa-spin mr-2"></i> INITIALISATION...';

            try {
                const selection = document.getElementById('intervention_id').value;
                const [type, id] = selection.split(':');
                const modules = Array.from(document.querySelectorAll('input[name="modules"]:checked')).map(cb => cb.value);

                let auditToken = null;
                
                if (type === 'PLANT' && selectedPlant) {
                    // === MODE CENTRALE PV (RECOMMANDÉ) ===
                    const plant = selectedPlant;
                    const zones = plant.zones || [];
                    
                    // Construire configuration depuis zones PV
                    const configuration = {
                        mode: 'advanced',
                        strings: zones.map((z, idx) => ({
                            id: idx + 1,
                            mpptNumber: idx + 1,
                            moduleCount: z.module_count || 0,
                            zoneName: z.zone_name,
                            zoneId: z.id
                        }))
                    };
                    
                    const totalModules = zones.reduce((sum, z) => sum + (z.module_count || 0), 0);
                    
                    // 1. Créer l'audit EL
                    const createRes = await axios.post('/api/el/audit/create', {
                        projectName: \`Audit EL - \${plant.plant_name}\`,
                        clientName: plant.client_name || 'Client inconnu',
                        location: plant.address || plant.city || '',
                        configuration
                    });
                    
                    if (!createRes.data.success) {
                        throw new Error(createRes.data.error || 'Erreur création audit');
                    }
                    
                    auditToken = createRes.data.auditToken;
                    
                    // 2. Créer les liaisons EL ↔ PV automatiquement
                    btn.innerHTML = '<i class="fas fa-link fa-spin mr-2"></i> LIAISON PV...';
                    
                    for (let i = 0; i < zones.length; i++) {
                        const zone = zones[i];
                        try {
                            await axios.post(\`/api/pv/plants/\${plant.id}/zones/\${zone.id}/link-el-audit\`, {
                                el_audit_token: auditToken
                            });
                        } catch (linkErr: any) {
                            // 409 = liaison déjà existante (normal si reliaison)
                            if (linkErr?.response?.status === 409) {
                                console.log(\`Zone \${zone.id}: liaison existante (OK)\`);
                            } else {
                                console.warn(\`Liaison zone \${zone.id} échouée:\`, linkErr);
                            }
                        }
                    }
                    
                } else if (type === 'INT') {
                    // === MODE INTERVENTION ===
                    const payload = { 
                        modules,
                        intervention_id: parseInt(id)
                    };
                    
                    const res = await axios.post('/api/audits/create-multi-modules', payload);
                    if (!res.data.success) {
                        throw new Error(res.data.error || 'Erreur création');
                    }
                    auditToken = res.data.audit_token;
                    
                } else {
                    // === MODE PROJET CRM ===
                    const proj = selectedProject;
                    
                    const payload = {
                        modules,
                        project_name: proj.name || proj.project_name,
                        client_name: proj.client_name,
                        location: proj.address_city
                    };
                    
                    if (proj.strings_configuration) {
                        try {
                            payload.configuration = JSON.parse(proj.strings_configuration);
                        } catch(e) {}
                    }
                    
                    const res = await axios.post('/api/audits/create-multi-modules', payload);
                    if (!res.data.success) {
                        throw new Error(res.data.error || 'Erreur création');
                    }
                    auditToken = res.data.audit_token;
                }
                
                // Redirect to audit
                if (auditToken) {
                    window.location.href = \`/audit/\${auditToken}\`;
                } else {
                    throw new Error('Token audit non reçu');
                }

            } catch (err) {
                console.error(err);
                alert("Erreur: " + (err.response?.data?.error || err.message));
                btn.disabled = false;
                btn.innerHTML = originalContent;
            }
        });

        // Init
        const params = new URLSearchParams(window.location.search);
        const intId = params.get('intervention_id');
        const plantId = params.get('plant_id');
        
        loadInterventions().then(() => {
            if (plantId) {
                const select = document.getElementById('intervention_id');
                const val = 'PLANT:' + plantId;
                if (select.querySelector(\`option[value="\${val}"]\`)) {
                    select.value = val;
                    loadSelectionDetails(val);
                }
            } else if (intId) {
                const select = document.getElementById('intervention_id');
                const val = 'INT:' + intId;
                if (select.querySelector(\`option[value="\${val}"]\`)) {
                    select.value = val;
                    loadSelectionDetails(val);
                }
            }
        });

    </script>
  `;

  return getLayout('Nouvelle Mission', content, 'new-audit');
}
