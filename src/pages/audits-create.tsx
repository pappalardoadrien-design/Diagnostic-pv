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
                        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Intervention ou Projet</label>
                        <div class="relative group">
                            <i class="fas fa-search absolute left-4 top-4 text-slate-400 group-hover:text-green-500 transition-colors"></i>
                            <select id="intervention_id" class="w-full pl-12 pr-10 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-green-500 focus:bg-white outline-none font-bold text-slate-700 transition-all cursor-pointer appearance-none">
                                <option value="">Chargement des dossiers...</option>
                            </select>
                            <div class="absolute right-4 top-4 pointer-events-none text-slate-400">
                                <i class="fas fa-chevron-down"></i>
                            </div>
                        </div>
                        
                        <div class="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                            <i class="fas fa-info-circle text-blue-500 mt-0.5"></i>
                            <p class="text-sm text-blue-700 font-medium">
                                Sélectionnez une intervention planifiée pour lier automatiquement le rapport au planning.
                                Sinon, choisissez un projet pour un audit inopiné.
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
        // --- LOGIC ---
        
        async function loadInterventions() {
            try {
                const [resInterventions, resProjects] = await Promise.all([
                    axios.get('/api/planning/interventions'),
                    axios.get('/api/crm/projects')
                ]);

                const select = document.getElementById('intervention_id');
                select.innerHTML = '<option value="">-- Choisir un dossier --</option>';
                
                // Group 1: Interventions Planifiées
                if (resInterventions.data.interventions.length > 0) {
                    const optGroup = document.createElement('optgroup');
                    optGroup.label = "📅 AGENDA (Conseillé)";
                    
                    resInterventions.data.interventions
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

                // Group 2: Tous les Projets
                if (resProjects.data.projects.length > 0) {
                    const optGroup = document.createElement('optgroup');
                    optGroup.label = "📂 TOUS LES SITES";
                    
                    resProjects.data.projects.sort((a,b) => (a.name||'').localeCompare(b.name||'')).forEach(p => {
                        const opt = document.createElement('option');
                        opt.value = 'PROJ:' + p.id;
                        opt.textContent = \`\${p.name || p.project_name} • \${p.address_city || ''}\`;
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
            const progress = document.getElementById('progress-bar');
            
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
                let project = null;

                if (type === 'INT') {
                    const res = await axios.get(\`/api/planning/interventions/\${id}\`);
                    project = res.data.intervention;
                } else {
                    const res = await axios.get(\`/api/crm/projects/\${id}\`);
                    project = res.data.project;
                }

                // Render Details
                document.getElementById('project-name-display').textContent = project.project_name || project.name;
                details.innerHTML = \`
                    <div class="flex items-center"><i class="fas fa-user-tie w-6 text-center text-slate-400"></i> \${project.client_name || 'Client inconnu'}</div>
                    <div class="flex items-center"><i class="fas fa-map-marker-alt w-6 text-center text-slate-400"></i> \${project.address_city || project.location || 'Loc. N/A'}</div>
                    <div class="flex items-center mt-2 pt-2 border-t border-slate-200 text-xs">
                        <span class="bg-slate-200 px-2 py-1 rounded font-bold mr-2 text-slate-600">\${project.total_power_kwp || '?'} kWc</span>
                        <span class="bg-slate-200 px-2 py-1 rounded font-bold text-slate-600">\${project.module_count || '?'} Mods</span>
                    </div>
                \`;

                // Technical Check
                const hasConfig = project.strings_configuration || (project.module_count && project.string_count);
                
                if (hasConfig) {
                    icon.className = "w-14 h-14 rounded-xl bg-green-100 text-green-600 flex items-center justify-center text-2xl shadow-sm flex-shrink-0";
                    icon.innerHTML = '<i class="fas fa-check-circle"></i>';
                    warning.classList.add('hidden');
                } else {
                    icon.className = "w-14 h-14 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-2xl shadow-sm flex-shrink-0";
                    icon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
                    warning.classList.remove('hidden');
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

                const payload = { modules };
                
                if (type === 'INT') {
                    payload.intervention_id = parseInt(id);
                } else {
                    // Fallback Mode: Create phantom intervention or link project directly
                    const resProj = await axios.get(\`/api/crm/projects/\${id}\`);
                    const proj = resProj.data.project;
                    
                    payload.project_name = proj.name;
                    payload.client_name = proj.client_name;
                    payload.location = proj.address_city;
                    
                    if (proj.strings_configuration) {
                        try {
                            payload.configuration = JSON.parse(proj.strings_configuration);
                        } catch(e) {}
                    }
                }

                const res = await axios.post('/api/audits/create-multi-modules', payload);
                if (res.data.success) {
                    window.location.href = \`/audit/\${res.data.audit_token}\`;
                } else {
                    throw new Error(res.data.error || "Erreur inconnue");
                }

            } catch (err) {
                console.error(err);
                alert("Erreur: " + err.message);
                btn.disabled = false;
                btn.innerHTML = originalContent;
            }
        });

        // Init
        const params = new URLSearchParams(window.location.search);
        const intId = params.get('intervention_id');
        
        loadInterventions().then(() => {
            if (intId) {
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
