import { getLayout } from './layout.js';

export function getVisualPage() {
  const content = `
    <!-- HEADER FIXE (Mobile/Tablet Friendly) -->
    <div class="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 shadow-sm flex justify-between items-center -mx-6 md:-mx-8 mb-6">
        <div>
            <h1 class="text-2xl font-black text-slate-900 tracking-tight flex items-center">
                <i class="fas fa-eye text-orange-500 mr-3"></i>Inspection Visuelle
            </h1>
            <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                IEC 62446-1 • <span id="project-context">Chargement...</span>
            </p>
        </div>
        <button onclick="openAddModal()" class="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-orange-200 hover:shadow-orange-300 transform hover:-translate-y-0.5 transition-all flex items-center">
            <i class="fas fa-camera text-xl mr-2"></i>
            <span class="hidden md:inline">Ajouter Photo</span>
        </button>
    </div>

    <!-- DASHBOARD STATS -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div class="text-xs font-bold text-slate-400 uppercase mb-1">Total Photos</div>
            <div class="text-3xl font-black text-slate-800" id="totalInspections">-</div>
        </div>
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div class="text-xs font-bold text-slate-400 uppercase mb-1">Conformité</div>
            <div class="text-3xl font-black text-green-500" id="avgConformity">-</div>
        </div>
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div class="text-xs font-bold text-slate-400 uppercase mb-1">Critiques</div>
            <div class="text-3xl font-black text-red-500" id="totalCritical">-</div>
        </div>
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div class="text-xs font-bold text-slate-400 uppercase mb-1">Points Contrôle</div>
            <div class="text-3xl font-black text-blue-500" id="totalItems">-</div>
        </div>
    </div>

    <!-- GALLERY GRID -->
    <div id="loadingSpinner" class="py-20 text-center">
        <i class="fas fa-circle-notch fa-spin text-4xl text-orange-500 mb-4"></i>
        <p class="text-slate-400 font-bold">Chargement des données...</p>
    </div>

    <div id="noInspections" class="hidden py-20 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-300">
        <div class="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-slate-300 text-4xl">
            <i class="fas fa-camera"></i>
        </div>
        <h3 class="text-xl font-bold text-slate-800 mb-2">Aucune observation</h3>
        <p class="text-slate-500 mb-6">Commencez l'inspection en ajoutant des photos de défauts.</p>
        <button onclick="openAddModal()" class="text-orange-600 font-bold hover:underline">Ajouter une observation</button>
    </div>

    <div id="inspectionsGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <!-- Cards injected via JS -->
    </div>

    <!-- MODAL AJOUT -->
    <div id="addModal" class="fixed inset-0 z-50 hidden bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 opacity-0 transition-opacity duration-300">
        <div class="bg-white rounded-2xl w-full max-w-lg shadow-2xl transform scale-95 transition-transform duration-300" id="modalContent">
            
            <div class="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
                <h3 class="text-xl font-black text-slate-800">Nouvelle Observation</h3>
                <button onclick="closeAddModal()" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-400 transition-colors">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <form id="createForm" class="p-6 space-y-6">
                
                <!-- Upload Zone -->
                <div class="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-orange-400 hover:bg-orange-50 transition-colors cursor-pointer relative" id="dropZone">
                    <input type="file" id="photoUpload" accept="image/*" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer">
                    <i class="fas fa-cloud-upload-alt text-4xl text-slate-300 mb-3" id="uploadIcon"></i>
                    <p class="text-sm font-bold text-slate-600" id="uploadText">Touchez pour prendre une photo</p>
                    <p class="text-xs text-slate-400 mt-1">ou glissez un fichier ici</p>
                </div>

                <!-- Details -->
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Catégorie</label>
                        <select id="category" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-medium">
                            <option value="module">Module PV</option>
                            <option value="structure">Structure / Fixation</option>
                            <option value="cabling">Câblage / Connectique</option>
                            <option value="inverter">Onduleur / Coffret</option>
                            <option value="env">Environnement / Accès</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Sévérité</label>
                        <select id="severity" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-medium">
                            <option value="1">1 - Info / Esthétique</option>
                            <option value="2">2 - Mineur</option>
                            <option value="3">3 - Majeur</option>
                            <option value="4">4 - Critique</option>
                            <option value="5">5 - Danger Immédiat</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Description</label>
                    <textarea id="description" rows="3" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-medium" placeholder="Décrivez le défaut observé..."></textarea>
                </div>

                <!-- Hidden Context Fields -->
                <input type="hidden" id="project_id">
                <input type="hidden" id="client_id">

                <div class="pt-2">
                    <button type="submit" class="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-xl shadow-lg shadow-orange-200 transition-all transform hover:-translate-y-1">
                        ENREGISTRER
                    </button>
                </div>
            </form>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
        // --- STATE ---
        let allInspections = [];
        
        // --- INIT ---
        document.addEventListener('DOMContentLoaded', () => {
            loadInspections();
            setupUploadPreview();
        });

        // --- DATA LOADING ---
        async function loadInspections() {
            try {
                const res = await axios.get('/api/visual/inspections');
                if (res.data.success) {
                    allInspections = res.data.inspections || [];
                    renderGallery(allInspections);
                    updateStats(allInspections);
                    
                    // Context (Mock for now, would come from Mission)
                    if(allInspections.length > 0) {
                        document.getElementById('project-context').textContent = allInspections[0].project_name || 'Mission en cours';
                    }
                }
            } catch (e) {
                console.error(e);
                document.getElementById('loadingSpinner').innerHTML = '<p class="text-red-500 font-bold">Erreur de chargement</p>';
            }
        }

        // --- RENDERERS ---
        function renderGallery(items) {
            const grid = document.getElementById('inspectionsGrid');
            const empty = document.getElementById('noInspections');
            const spinner = document.getElementById('loadingSpinner');

            spinner.classList.add('hidden');

            if (items.length === 0) {
                grid.innerHTML = '';
                empty.classList.remove('hidden');
                return;
            }

            empty.classList.add('hidden');
            grid.innerHTML = items.map(item => {
                const severityColor = {
                    1: 'bg-green-100 text-green-700',
                    2: 'bg-blue-100 text-blue-700',
                    3: 'bg-yellow-100 text-yellow-700',
                    4: 'bg-orange-100 text-orange-700',
                    5: 'bg-red-100 text-red-700'
                }[item.critical_issues_count > 0 ? 5 : 1] || 'bg-slate-100 text-slate-600'; // Simplification: using critical count as severity proxy

                const severityLabel = item.critical_issues_count > 0 ? 'CRITIQUE' : 'CONFORME';

                return \`
                <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden group hover:shadow-md transition-all">
                    <div class="relative h-48 bg-slate-100 flex items-center justify-center overflow-hidden">
                        \${item.image_url 
                            ? \`<img src="\${item.image_url}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">\`
                            : \`<i class="fas fa-image text-slate-300 text-4xl"></i>\`
                        }
                        <div class="absolute top-3 right-3">
                            <span class="px-2 py-1 rounded-lg text-xs font-black uppercase tracking-wide \${severityColor}">
                                \${severityLabel}
                            </span>
                        </div>
                    </div>
                    <div class="p-4">
                        <div class="flex justify-between items-start mb-2">
                            <div>
                                <h4 class="font-bold text-slate-800 text-sm line-clamp-1">\${item.project_name || 'Sans titre'}</h4>
                                <p class="text-xs text-slate-500">\${new Date(item.inspection_date).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div class="flex justify-between items-center mt-4">
                            <span class="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded">\${item.inspector_name || 'Tech'}</span>
                            <button class="text-orange-500 hover:text-orange-600 transition-colors">
                                <i class="fas fa-edit"></i>
                            </button>
                        </div>
                    </div>
                </div>
                \`;
            }).join('');
        }

        function updateStats(items) {
            if (items.length === 0) return;
            const avg = Math.round(items.reduce((acc, i) => acc + (i.conformity_level * 100), 0) / items.length);
            const crit = items.reduce((acc, i) => acc + i.critical_issues_count, 0);
            
            document.getElementById('totalInspections').textContent = items.length;
            document.getElementById('avgConformity').textContent = avg + '%';
            document.getElementById('totalCritical').textContent = crit;
            document.getElementById('totalItems').textContent = items.length * 15; // Mock
        }

        // --- MODAL ---
        const modal = document.getElementById('addModal');
        const modalContent = document.getElementById('modalContent');

        window.openAddModal = function() {
            modal.classList.remove('hidden');
            setTimeout(() => {
                modal.classList.remove('opacity-0');
                modalContent.classList.remove('scale-95');
                modalContent.classList.add('scale-100');
            }, 10);
        }

        window.closeAddModal = function() {
            modal.classList.add('opacity-0');
            modalContent.classList.remove('scale-100');
            modalContent.classList.add('scale-95');
            setTimeout(() => modal.classList.add('hidden'), 300);
        }

        // --- UPLOAD PREVIEW ---
        function setupUploadPreview() {
            const input = document.getElementById('photoUpload');
            const zone = document.getElementById('dropZone');
            const icon = document.getElementById('uploadIcon');
            const text = document.getElementById('uploadText');

            input.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        zone.style.backgroundImage = \`url(\${e.target.result})\`;
                        zone.style.backgroundSize = 'cover';
                        zone.style.backgroundPosition = 'center';
                        icon.classList.add('hidden');
                        text.classList.add('hidden');
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        // --- SUBMIT ---
        document.getElementById('createForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            // Mock submission for UI demo
            alert('Photo enregistrée (Simulation)');
            closeAddModal();
        });

    </script>
  `;

  return getLayout('Inspection Visuelle', content, 'audit-visuel');
}
