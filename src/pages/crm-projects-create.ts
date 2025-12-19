import { getLayout } from './layout.js';

export function getCrmProjectsCreatePage() {
  const content = `
    <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
            <h1 class="text-3xl font-black text-slate-900 tracking-tight">Nouveau Site</h1>
            <p class="text-slate-500 mt-1 font-medium">Création d'une centrale photovoltaïque et configuration technique</p>
        </div>

        <form id="create-project-form" class="space-y-8">

            <!-- Banner Client Pré-sélectionné -->
            <div id="client-info-banner" class="hidden bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-xl shadow-sm">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs font-bold text-blue-500 uppercase tracking-wide mb-1">Client Associé</p>
                        <p id="client-info-name" class="text-xl font-black text-blue-900"></p>
                    </div>
                    <a href="/crm/projects/create" class="px-4 py-2 bg-white text-blue-600 text-sm font-bold rounded-lg hover:bg-blue-50 transition-colors shadow-sm">
                        Changer
                    </a>
                </div>
            </div>

            <!-- 1. Identité & Client -->
            <div class="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
                <div class="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <i class="fas fa-building text-8xl"></i>
                </div>
                
                <h2 class="text-lg font-black text-slate-800 mb-6 flex items-center gap-3">
                    <span class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold shadow-sm">1</span>
                    Identité du Site
                </h2>

                <div class="grid gap-6">
                    <!-- Client Select (if not preselected) -->
                    <div class="form-group" id="client-select-group">
                        <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Propriétaire / Client <span class="text-red-500">*</span></label>
                        <select id="client_id" required class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700 transition-all">
                            <option value="">-- Sélectionner un client --</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Nom du Site / Centrale <span class="text-red-500">*</span></label>
                        <input type="text" id="project_name" required placeholder="Ex: Centrale Toiture Nord" 
                               class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-900 text-lg placeholder-slate-300">
                    </div>

                    <div class="grid md:grid-cols-2 gap-6">
                         <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Date de mise en service</label>
                            <input type="date" id="installation_date" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Statut Actuel</label>
                            <select id="status" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium">
                                <option value="active">Actif / En exploitation</option>
                                <option value="pending">En construction / Projet</option>
                                <option value="completed">Démantelé / Inactif</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 2. Configuration Technique -->
            <div class="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
                <div class="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <i class="fas fa-bolt text-8xl"></i>
                </div>

                <h2 class="text-lg font-black text-slate-800 mb-6 flex items-center gap-3">
                    <span class="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-sm font-bold shadow-sm">2</span>
                    Caractéristiques Techniques
                </h2>

                <div class="grid gap-6">
                    <div class="grid md:grid-cols-2 gap-6">
                        <div class="bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                            <label class="block text-xs font-bold text-amber-600 uppercase mb-2">Puissance Crête (kWc)</label>
                            <div class="relative">
                                <input type="number" step="0.01" id="total_power_kwp" placeholder="0.00" 
                                    class="w-full pl-4 pr-12 py-3 bg-white border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-black text-slate-800 text-xl">
                                <span class="absolute right-4 top-3.5 text-amber-400 font-bold text-sm">kWc</span>
                            </div>
                        </div>

                        <div class="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                            <label class="block text-xs font-bold text-blue-600 uppercase mb-2">Nombre de Modules</label>
                            <div class="relative">
                                <input type="number" id="module_count" placeholder="0" 
                                    class="w-full pl-4 pr-12 py-3 bg-white border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-black text-slate-800 text-xl">
                                <span class="absolute right-4 top-3.5 text-blue-400 font-bold text-sm">mod.</span>
                            </div>
                        </div>
                    </div>

                    <div class="grid md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Type de Modules</label>
                            <input type="text" id="module_type" placeholder="Ex: SunPower Maxeon 3" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Type d'Onduleurs</label>
                            <input type="text" id="inverter_type" placeholder="Ex: Huawei SUN2000" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium">
                        </div>
                    </div>
                </div>
            </div>

            <!-- 3. Configuration Électrique (Avancé) -->
            <div class="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
                <div class="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <i class="fas fa-network-wired text-8xl"></i>
                </div>

                <h2 class="text-lg font-black text-slate-800 mb-6 flex items-center gap-3">
                    <span class="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-bold shadow-sm">3</span>
                    Topologie & Strings
                    <span class="ml-2 px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] uppercase font-bold rounded tracking-wide">Pour Audit EL</span>
                </h2>

                <div class="grid gap-6">
                    <div class="grid md:grid-cols-3 gap-6">
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Nb. Onduleurs</label>
                            <input type="number" id="inverter_count" placeholder="1" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-bold">
                        </div>
                        <div class="md:col-span-2">
                             <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Marque / Modèle Précis</label>
                            <input type="text" id="inverter_brand" placeholder="Ex: SMA Tripower 25000TL" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none">
                        </div>
                    </div>

                    <!-- String Builder -->
                    <div class="bg-slate-50 rounded-xl border border-slate-200 p-5">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="font-bold text-slate-700 text-sm uppercase tracking-wide">Configuration des Strings</h3>
                            <button type="button" id="btnAddString" class="px-3 py-1.5 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg text-xs font-bold transition-colors">
                                <i class="fas fa-plus mr-1"></i> Ajouter un String
                            </button>
                        </div>
                        
                        <div id="stringsContainer" class="space-y-3">
                            <!-- Empty State -->
                            <div id="no-strings-msg" class="text-center py-4 text-slate-400 text-sm italic">
                                Aucune configuration définie. Ajoutez des strings pour préparer l'audit EL.
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 4. Localisation -->
            <div class="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <h2 class="text-lg font-black text-slate-800 mb-6 flex items-center gap-3">
                    <span class="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-bold shadow-sm">4</span>
                    Localisation
                </h2>

                <div class="grid gap-6">
                    <div>
                        <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Adresse Complète</label>
                        <input type="text" id="address_street" placeholder="123 Route Solaire" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-medium">
                    </div>
                    <div class="grid md:grid-cols-3 gap-6">
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Code Postal</label>
                            <input type="text" id="address_postal_code" placeholder="31000" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-medium">
                        </div>
                        <div class="md:col-span-2">
                             <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Ville</label>
                            <input type="text" id="address_city" placeholder="Toulouse" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-medium">
                        </div>
                    </div>
                    <div class="grid md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Latitude GPS</label>
                            <input type="number" step="any" id="gps_latitude" placeholder="43.6047" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-mono text-sm">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Longitude GPS</label>
                            <input type="number" step="any" id="gps_longitude" placeholder="1.4442" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-mono text-sm">
                        </div>
                    </div>
                </div>
            </div>

            <!-- Notes -->
            <div class="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <h2 class="text-lg font-black text-slate-800 mb-6 flex items-center gap-3">
                    <span class="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-sm font-bold shadow-sm">5</span>
                    Notes Internes
                </h2>
                <textarea id="notes" rows="3" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 outline-none font-medium" placeholder="Détails d'accès, codes, contact sur site..."></textarea>
            </div>

            <!-- Actions -->
            <div class="flex items-center justify-end gap-4 pt-4 pb-12">
                <a href="/crm/projects" class="px-6 py-3 text-slate-500 font-bold hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
                    Annuler
                </a>
                <button type="submit" class="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-blue-200 transition-all transform hover:-translate-y-1">
                    Créer le site
                </button>
            </div>

        </form>
    </div>

    <script>
        // --- STATE ---
        const urlParams = new URLSearchParams(window.location.search);
        const preselectedClientId = urlParams.get('client_id');
        let stringsConfig = [];
        let stringIdCounter = 1;

        // --- INIT ---
        async function init() {
            await loadClients();
            
            // Add default string row
            addStringRow(); 
        }

        // --- CLIENTS ---
        async function loadClients() {
            try {
                const res = await fetch('/api/crm/clients');
                const data = await res.json();
                const clients = (data.clients || []).sort((a,b) => a.company_name.localeCompare(b.company_name));
                
                const select = document.getElementById('client_id');
                clients.forEach(c => {
                    const opt = document.createElement('option');
                    opt.value = c.id;
                    opt.textContent = c.company_name;
                    select.appendChild(opt);
                });

                if(preselectedClientId) {
                    const client = clients.find(c => c.id == preselectedClientId);
                    if(client) {
                        select.value = preselectedClientId;
                        // Show banner
                        document.getElementById('client-select-group').classList.add('hidden');
                        document.getElementById('client-info-banner').classList.remove('hidden');
                        document.getElementById('client-info-name').textContent = client.company_name;
                    }
                }

            } catch(e) { console.error(e); }
        }

        // --- STRING BUILDER ---
        function addStringRow() {
            document.getElementById('no-strings-msg')?.remove();
            
            const id = stringIdCounter++;
            const div = document.createElement('div');
            div.id = \`string-row-\${id}\`;
            div.className = "flex items-center gap-3 animate-fade-in";
            div.innerHTML = \`
                <div class="flex-1 grid grid-cols-2 gap-3">
                    <div class="relative">
                        <span class="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">MPPT</span>
                        <input type="number" id="mppt-\${id}" value="1" min="1" class="w-full pl-12 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:border-purple-500">
                    </div>
                    <div class="relative">
                        <span class="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">MODS</span>
                        <input type="number" id="modules-\${id}" placeholder="Ex: 20" min="1" class="w-full pl-12 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:border-purple-500">
                    </div>
                </div>
                <button type="button" onclick="removeString(\${id})" class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <i class="fas fa-trash-alt"></i>
                </button>
            \`;
            
            document.getElementById('stringsContainer').appendChild(div);
            stringsConfig.push(id);
        }

        window.removeString = function(id) {
            document.getElementById(\`string-row-\${id}\`)?.remove();
            stringsConfig = stringsConfig.filter(x => x !== id);
        };
        
        document.getElementById('btnAddString').addEventListener('click', addStringRow);

        // --- SUBMIT ---
        document.getElementById('create-project-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-2"></i> Création...';

            try {
                // Collect Strings
                const strings = stringsConfig.map(id => ({
                    id: id,
                    mpptNumber: parseInt(document.getElementById(\`mppt-\${id}\`).value) || 1,
                    moduleCount: parseInt(document.getElementById(\`modules-\${id}\`).value) || 0
                })).filter(s => s.moduleCount > 0);

                const payload = {
                    client_id: parseInt(document.getElementById('client_id').value),
                    project_name: document.getElementById('project_name').value.trim(),
                    installation_date: document.getElementById('installation_date').value || null,
                    status: document.getElementById('status').value,
                    
                    total_power_kwp: parseFloat(document.getElementById('total_power_kwp').value) || null,
                    module_count: parseInt(document.getElementById('module_count').value) || null,
                    module_type: document.getElementById('module_type').value.trim() || null,
                    inverter_type: document.getElementById('inverter_type').value.trim() || null,
                    
                    inverter_count: parseInt(document.getElementById('inverter_count').value) || null,
                    inverter_brand: document.getElementById('inverter_brand').value.trim() || null,
                    
                    address_street: document.getElementById('address_street').value.trim() || null,
                    address_postal_code: document.getElementById('address_postal_code').value.trim() || null,
                    address_city: document.getElementById('address_city').value.trim() || null,
                    gps_latitude: parseFloat(document.getElementById('gps_latitude').value) || null,
                    gps_longitude: parseFloat(document.getElementById('gps_longitude').value) || null,
                    
                    notes: document.getElementById('notes').value.trim() || null,
                    strings_configuration: strings.length > 0 ? JSON.stringify({ mode: 'advanced', strings }) : null
                };

                const res = await fetch('/api/crm/projects', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(payload)
                });

                const data = await res.json();
                
                if(data.success) {
                    window.location.href = \`/crm/projects/detail?id=\${data.project.id}\`;
                } else {
                    throw new Error(data.message || data.error);
                }

            } catch(err) {
                console.error(err);
                alert('Erreur: ' + err.message);
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        });

        // Start
        init();
    </script>
  `;

  return getLayout('Nouveau Site', content, 'projects');
}
