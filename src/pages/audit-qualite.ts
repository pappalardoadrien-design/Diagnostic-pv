/**
 * Page Audit Qualité Terrain - Interface Mobile Checklist
 * Adapté de GIRASOLE pour DiagPV CRM
 * 
 * Routes:
 * - /audit-qualite/:mission_id          → Checklist principale (SOL + TOITURE)
 * - /audit-qualite/:mission_id/photos   → Galerie photos mission
 */

export function getAuditQualitePage(missionId: string) {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Audit Qualité Terrain - DiagPV</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <style>
        * { -webkit-tap-highlight-color: transparent; }
        body { overscroll-behavior: none; }
        .checklist-item { transition: all 0.2s ease; border-left: 4px solid transparent; }
        .checklist-item:active { transform: scale(0.99); }
        .checklist-item[data-conformite="conforme"] { border-left-color: #22c55e; background: #f0fdf4; }
        .checklist-item[data-conformite="non_conforme"] { border-left-color: #ef4444; background: #fef2f2; }
        .checklist-item[data-conformite="observation"] { border-left-color: #f59e0b; background: #fffbeb; }
        .checklist-item[data-conformite="non_applicable"] { border-left-color: #6b7280; background: #f9fafb; }
        .conformity-btn { transition: all 0.15s; min-width: 44px; min-height: 44px; }
        .conformity-btn:active { transform: scale(0.9); }
        .conformity-btn.active { ring: 2px; box-shadow: 0 0 0 3px rgba(0,0,0,0.1); }
        .category-header { position: sticky; top: 64px; z-index: 10; backdrop-filter: blur(8px); }
        .tab-btn.active { border-bottom: 3px solid #3b82f6; color: #3b82f6; font-weight: 800; }
        .progress-ring { transition: stroke-dashoffset 0.5s ease; }
        .photo-preview { width: 60px; height: 60px; object-fit: cover; border-radius: 8px; }
        .toast { animation: slideUp 0.3s ease; }
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .modal-overlay { animation: fadeIn 0.2s ease; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    </style>
</head>
<body class="bg-slate-50 min-h-screen">
    <!-- Header fixe -->
    <header class="bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg sticky top-0 z-30">
        <div class="px-4 py-3">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <button onclick="history.back()" class="hover:bg-white/20 p-2 rounded-lg transition">
                        <i class="fas fa-arrow-left text-lg"></i>
                    </button>
                    <div>
                        <h1 class="text-lg font-black" id="mission-title">Audit Qualité</h1>
                        <p class="text-xs opacity-80" id="mission-subtitle">Chargement...</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <!-- Score circulaire -->
                    <div class="relative w-12 h-12" id="score-ring-container">
                        <svg class="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                            <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="4"/>
                            <circle id="progress-ring" cx="24" cy="24" r="20" fill="none" stroke="white" stroke-width="4" stroke-dasharray="125.6" stroke-dashoffset="125.6" stroke-linecap="round" class="progress-ring"/>
                        </svg>
                        <div class="absolute inset-0 flex items-center justify-center">
                            <span class="text-xs font-black" id="score-text">0%</span>
                        </div>
                    </div>
                    <button onclick="saveAndFinish()" class="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg text-sm font-bold transition flex items-center gap-1">
                        <i class="fas fa-check-double"></i>
                        <span class="hidden sm:inline">Terminer</span>
                    </button>
                </div>
            </div>
        </div>
    </header>

    <!-- Tabs SOL / TOITURE -->
    <div class="bg-white border-b sticky top-[64px] z-20 shadow-sm">
        <div class="flex">
            <button id="tab-sol" class="tab-btn active flex-1 py-3 text-center text-sm font-bold text-slate-600 transition border-b-3" onclick="switchTab('sol')">
                <i class="fas fa-solar-panel mr-1"></i> Conformité SOL
                <span class="ml-1 text-xs bg-slate-100 px-2 py-0.5 rounded-full" id="count-sol">0</span>
            </button>
            <button id="tab-toiture" class="tab-btn flex-1 py-3 text-center text-sm font-bold text-slate-400 transition" onclick="switchTab('toiture')">
                <i class="fas fa-home mr-1"></i> Toiture
                <span class="ml-1 text-xs bg-slate-100 px-2 py-0.5 rounded-full" id="count-toiture">0</span>
            </button>
            <button id="tab-resume" class="tab-btn flex-1 py-3 text-center text-sm font-bold text-slate-400 transition" onclick="switchTab('resume')">
                <i class="fas fa-chart-pie mr-1"></i> Résumé
                <span class="ml-1 text-xs bg-slate-100 px-2 py-0.5 rounded-full" id="count-nc">0</span>
            </button>
        </div>
    </div>

    <!-- Filtres rapides -->
    <div class="px-4 py-3 bg-white border-b" id="filters-bar">
        <div class="flex gap-2 overflow-x-auto pb-1">
            <button onclick="filterItems('all')" class="filter-btn active whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold bg-slate-900 text-white">Tous</button>
            <button onclick="filterItems('non_verifie')" class="filter-btn whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">Non vérifiés</button>
            <button onclick="filterItems('non_conforme')" class="filter-btn whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold bg-red-50 text-red-600">NC</button>
            <button onclick="filterItems('observation')" class="filter-btn whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-600">Observations</button>
            <button onclick="filterItems('conforme')" class="filter-btn whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold bg-green-50 text-green-600">Conformes</button>
        </div>
    </div>

    <!-- Contenu principal -->
    <main class="pb-24">
        <!-- Tab SOL -->
        <div id="panel-sol" class="tab-panel">
            <div id="checklist-sol" class="divide-y divide-slate-100">
                <div class="p-8 text-center">
                    <i class="fas fa-circle-notch fa-spin text-3xl text-emerald-500 mb-3"></i>
                    <p class="text-slate-400 text-sm font-medium">Chargement checklist...</p>
                </div>
            </div>
        </div>

        <!-- Tab TOITURE -->
        <div id="panel-toiture" class="tab-panel hidden">
            <div id="checklist-toiture" class="divide-y divide-slate-100">
                <div class="p-8 text-center">
                    <i class="fas fa-circle-notch fa-spin text-3xl text-emerald-500 mb-3"></i>
                    <p class="text-slate-400 text-sm font-medium">Chargement checklist toiture...</p>
                </div>
            </div>
        </div>

        <!-- Tab RÉSUMÉ -->
        <div id="panel-resume" class="tab-panel hidden">
            <div class="p-4 space-y-4" id="resume-content">
                <!-- Rempli dynamiquement -->
            </div>
        </div>
    </main>

    <!-- Bouton flottant Actions -->
    <div class="fixed bottom-4 right-4 z-40 flex flex-col gap-2">
        <button onclick="openPhotoModal()" class="w-14 h-14 bg-blue-600 text-white rounded-full shadow-xl flex items-center justify-center hover:bg-blue-700 transition active:scale-95">
            <i class="fas fa-camera text-xl"></i>
        </button>
        <button onclick="openCommentModal()" class="w-14 h-14 bg-amber-500 text-white rounded-full shadow-xl flex items-center justify-center hover:bg-amber-600 transition active:scale-95">
            <i class="fas fa-comment text-xl"></i>
        </button>
    </div>

    <!-- Toast notification -->
    <div id="toast" class="fixed bottom-20 left-4 right-4 z-50 hidden">
        <div class="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 toast">
            <i id="toast-icon" class="fas fa-check-circle text-green-400"></i>
            <span id="toast-text" class="text-sm font-medium flex-1">Sauvegardé</span>
        </div>
    </div>

    <!-- Modal Commentaire Item -->
    <div id="comment-modal" class="fixed inset-0 z-50 hidden">
        <div class="modal-overlay absolute inset-0 bg-black/50" onclick="closeCommentModal()"></div>
        <div class="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6 max-h-[70vh] overflow-y-auto" style="animation: slideUp 0.3s ease;">
            <div class="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-4"></div>
            <h3 class="text-lg font-black text-slate-800 mb-4" id="comment-modal-title">Commentaire</h3>
            <input type="hidden" id="comment-item-id" />
            <input type="hidden" id="comment-item-type" />
            <textarea id="comment-text" class="w-full border border-slate-200 rounded-xl p-4 text-sm min-h-[120px] focus:ring-2 focus:ring-emerald-500 focus:border-transparent" placeholder="Ajouter un commentaire..."></textarea>
            <div class="mt-4 flex gap-3">
                <button onclick="closeCommentModal()" class="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm">Annuler</button>
                <button onclick="saveComment()" class="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm">Enregistrer</button>
            </div>
        </div>
    </div>

    <!-- Modal Commentaire Final -->
    <div id="final-comment-modal" class="fixed inset-0 z-50 hidden">
        <div class="modal-overlay absolute inset-0 bg-black/50" onclick="closeFinalCommentModal()"></div>
        <div class="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto" style="animation: slideUp 0.3s ease;">
            <div class="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-4"></div>
            <h3 class="text-lg font-black text-slate-800 mb-4"><i class="fas fa-clipboard-check text-emerald-500 mr-2"></i>Commentaires Finaux</h3>
            <label class="block text-sm font-bold text-slate-700 mb-2">Conclusion Générale</label>
            <textarea id="final-conclusion" class="w-full border rounded-xl p-3 text-sm min-h-[80px] mb-4" placeholder="Synthèse de l'audit..."></textarea>
            <label class="block text-sm font-bold text-slate-700 mb-2">Recommandations</label>
            <textarea id="final-recommandations" class="w-full border rounded-xl p-3 text-sm min-h-[80px] mb-4" placeholder="Actions correctives recommandées..."></textarea>
            <label class="block text-sm font-bold text-slate-700 mb-2">Signature</label>
            <input type="text" id="final-signe-par" class="w-full border rounded-xl p-3 text-sm mb-4" placeholder="Nom du signataire" value="Adrien PAPPALARDO" />
            <div class="flex gap-3">
                <button onclick="closeFinalCommentModal()" class="flex-1 py-3 rounded-xl border text-slate-600 font-bold text-sm">Annuler</button>
                <button onclick="saveFinalComment()" class="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm">Enregistrer & Signer</button>
            </div>
        </div>
    </div>

    <!-- Modal Photo Générale -->
    <div id="photo-gen-modal" class="fixed inset-0 z-50 hidden">
        <div class="modal-overlay absolute inset-0 bg-black/50" onclick="closePhotoModal()"></div>
        <div class="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6" style="animation: slideUp 0.3s ease;">
            <div class="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-4"></div>
            <h3 class="text-lg font-black text-slate-800 mb-4"><i class="fas fa-camera text-blue-500 mr-2"></i>Photo Générale</h3>
            <select id="photo-type" class="w-full border rounded-xl p-3 text-sm mb-3">
                <option value="vue_ensemble">Vue d'ensemble</option>
                <option value="environnement">Environnement</option>
                <option value="acces">Accès site</option>
                <option value="signalisation">Signalisation</option>
            </select>
            <input type="text" id="photo-legende" class="w-full border rounded-xl p-3 text-sm mb-3" placeholder="Légende (optionnel)" />
            <input type="file" id="photo-file" accept="image/*" capture="environment" class="w-full border rounded-xl p-3 text-sm mb-4" />
            <div class="flex gap-3">
                <button onclick="closePhotoModal()" class="flex-1 py-3 rounded-xl border text-slate-600 font-bold text-sm">Annuler</button>
                <button onclick="uploadGeneralPhoto()" class="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm">Envoyer</button>
            </div>
        </div>
    </div>

    <script>
    const MISSION_ID = '${missionId}';
    const API = '/api/audit-qualite';
    
    let currentTab = 'sol';
    let currentFilter = 'all';
    let itemsSol = [];
    let itemsToiture = [];
    let missionData = null;

    // === INIT ===
    async function init() {
        try {
            // Charger mission
            const missionRes = await axios.get(API + '/missions/' + MISSION_ID);
            missionData = missionRes.data.mission;
            
            document.getElementById('mission-title').textContent = missionData.reference || 'Audit Qualité';
            document.getElementById('mission-subtitle').textContent = 
                (missionData.project_name || 'Centrale') + ' - ' + (missionData.client_name || 'Client');

            // Charger checklists
            await loadChecklistSol();
            
            if (missionData.type_audit === 'TOITURE' || missionData.type_audit === 'DOUBLE') {
                await loadChecklistToiture();
            } else {
                document.getElementById('tab-toiture').style.display = 'none';
            }
            
            updateProgress();
        } catch (err) {
            console.error('Erreur init:', err);
            showToast('Erreur de chargement', 'error');
        }
    }

    // === CHECKLIST SOL ===
    async function loadChecklistSol() {
        try {
            const res = await axios.get(API + '/missions/' + MISSION_ID + '/checklist/sol');
            
            if (res.data.items.length === 0) {
                // Initialiser
                await axios.post(API + '/missions/' + MISSION_ID + '/checklist/sol/init');
                const res2 = await axios.get(API + '/missions/' + MISSION_ID + '/checklist/sol');
                itemsSol = res2.data.items;
            } else {
                itemsSol = res.data.items;
            }
            
            document.getElementById('count-sol').textContent = itemsSol.length;
            renderChecklist('sol', itemsSol);
        } catch (err) {
            console.error('Erreur checklist SOL:', err);
        }
    }

    // === CHECKLIST TOITURE ===
    async function loadChecklistToiture() {
        try {
            const res = await axios.get(API + '/missions/' + MISSION_ID + '/checklist/toiture');
            
            if (res.data.items.length === 0) {
                await axios.post(API + '/missions/' + MISSION_ID + '/checklist/toiture/init');
                const res2 = await axios.get(API + '/missions/' + MISSION_ID + '/checklist/toiture');
                itemsToiture = res2.data.items;
            } else {
                itemsToiture = res.data.items;
            }
            
            document.getElementById('count-toiture').textContent = itemsToiture.length;
            renderChecklist('toiture', itemsToiture);
        } catch (err) {
            console.error('Erreur checklist toiture:', err);
        }
    }

    // === RENDER CHECKLIST ===
    function renderChecklist(type, items) {
        const container = document.getElementById('checklist-' + type);
        if (!items.length) {
            container.innerHTML = '<div class="p-8 text-center text-slate-400"><i class="fas fa-clipboard-list text-4xl mb-3"></i><p>Aucun item</p></div>';
            return;
        }

        // Grouper par catégorie
        const categories = {};
        items.forEach(item => {
            if (!categories[item.categorie]) categories[item.categorie] = [];
            categories[item.categorie].push(item);
        });

        const categoryLabels = {
            modules: 'Modules PV', cablage: 'Câblage', protection: 'Protections', structure: 'Structure',
            etiquetage: 'Étiquetage', onduleur: 'Onduleur', mise_terre: 'Mise à la Terre',
            etancheite: 'Étanchéité', fixation: 'Fixations', ventilation: 'Ventilation',
            protection_incendie: 'Protection Incendie', acces_securite: 'Accès & Sécurité'
        };
        
        const categoryIcons = {
            modules: 'fa-solar-panel', cablage: 'fa-plug', protection: 'fa-shield-halved', structure: 'fa-cubes',
            etiquetage: 'fa-tags', onduleur: 'fa-microchip', mise_terre: 'fa-bolt',
            etancheite: 'fa-droplet', fixation: 'fa-wrench', ventilation: 'fa-wind',
            protection_incendie: 'fa-fire-extinguisher', acces_securite: 'fa-hard-hat'
        };

        let html = '';
        for (const [cat, catItems] of Object.entries(categories)) {
            const catConformes = catItems.filter(i => i.conformite === 'conforme').length;
            const catTotal = catItems.length;
            
            html += '<div class="category-header bg-white/90 px-4 py-3 border-b border-slate-200">';
            html += '<div class="flex items-center justify-between">';
            html += '<div class="flex items-center gap-2">';
            html += '<i class="fas ' + (categoryIcons[cat] || 'fa-list') + ' text-emerald-600"></i>';
            html += '<span class="text-sm font-black text-slate-800 uppercase tracking-wide">' + (categoryLabels[cat] || cat) + '</span>';
            html += '</div>';
            html += '<span class="text-xs font-bold px-2 py-1 rounded-full ' + (catConformes === catTotal ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500') + '">' + catConformes + '/' + catTotal + '</span>';
            html += '</div></div>';

            catItems.forEach(item => {
                const filtered = currentFilter !== 'all' && item.conformite !== currentFilter;
                html += '<div class="checklist-item px-4 py-3 bg-white ' + (filtered ? 'hidden' : '') + '" data-conformite="' + item.conformite + '" data-id="' + item.id + '" data-type="' + type + '">';
                html += '<div class="flex items-start gap-3">';
                html += '<div class="flex-1 min-w-0">';
                html += '<div class="flex items-center gap-2 mb-1">';
                html += '<span class="text-[10px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">' + item.code_item + '</span>';
                if (item.severite === 'critique') html += '<span class="text-[10px] font-black text-red-500 bg-red-50 px-1.5 py-0.5 rounded">CRITIQUE</span>';
                html += '</div>';
                html += '<p class="text-sm text-slate-700 leading-snug">' + item.libelle + '</p>';
                html += '<p class="text-[10px] text-slate-400 mt-1">' + (item.norme_reference || '') + '</p>';
                if (item.commentaire) html += '<p class="text-xs text-amber-600 mt-1 italic"><i class="fas fa-comment-dots mr-1"></i>' + item.commentaire + '</p>';
                html += '</div>';
                
                // Boutons conformité
                html += '<div class="flex flex-col gap-1.5 flex-shrink-0">';
                html += '<button class="conformity-btn w-10 h-10 rounded-lg flex items-center justify-center text-sm ' + (item.conformite === 'conforme' ? 'bg-green-500 text-white active' : 'bg-green-50 text-green-600') + '" onclick="setConformite(' + item.id + ',\\'' + type + '\\',\\'conforme\\')"><i class="fas fa-check"></i></button>';
                html += '<button class="conformity-btn w-10 h-10 rounded-lg flex items-center justify-center text-sm ' + (item.conformite === 'non_conforme' ? 'bg-red-500 text-white active' : 'bg-red-50 text-red-600') + '" onclick="setConformite(' + item.id + ',\\'' + type + '\\',\\'non_conforme\\')"><i class="fas fa-times"></i></button>';
                html += '<button class="conformity-btn w-10 h-10 rounded-lg flex items-center justify-center text-sm ' + (item.conformite === 'observation' ? 'bg-amber-500 text-white active' : 'bg-amber-50 text-amber-600') + '" onclick="setConformite(' + item.id + ',\\'' + type + '\\',\\'observation\\')"><i class="fas fa-eye"></i></button>';
                html += '</div>';
                
                html += '</div>';
                
                // Actions secondaires
                html += '<div class="flex gap-2 mt-2 pl-0">';
                html += '<button class="text-[10px] font-bold text-slate-400 hover:text-slate-600 px-2 py-1 rounded bg-slate-50" onclick="openItemComment(' + item.id + ',\\'' + type + '\\',\\'' + item.code_item + '\\')"><i class="fas fa-comment mr-1"></i>Note</button>';
                html += '<button class="text-[10px] font-bold text-slate-400 hover:text-slate-600 px-2 py-1 rounded bg-slate-50" onclick="setConformite(' + item.id + ',\\'' + type + '\\',\\'non_applicable\\')"><i class="fas fa-ban mr-1"></i>N/A</button>';
                html += '</div>';
                
                html += '</div>';
            });
        }
        
        container.innerHTML = html;
    }

    // === SET CONFORMITÉ ===
    async function setConformite(itemId, type, value) {
        try {
            await axios.put(API + '/checklist/' + type + '/' + itemId, { conformite: value });
            
            // MAJ locale
            const items = type === 'sol' ? itemsSol : itemsToiture;
            const item = items.find(i => i.id === itemId);
            if (item) item.conformite = value;
            
            renderChecklist(type, items);
            updateProgress();
            showToast(value === 'conforme' ? 'Conforme' : value === 'non_conforme' ? 'Non conforme' : value === 'observation' ? 'Observation' : 'N/A', value === 'conforme' ? 'success' : value === 'non_conforme' ? 'error' : 'warning');
        } catch (err) {
            showToast('Erreur de sauvegarde', 'error');
        }
    }

    // === PROGRESS ===
    function updateProgress() {
        const allItems = [...itemsSol, ...itemsToiture];
        const total = allItems.length;
        const verified = allItems.filter(i => i.conformite !== 'non_verifie').length;
        const conformes = allItems.filter(i => i.conformite === 'conforme').length;
        const nc = allItems.filter(i => i.conformite === 'non_conforme').length;
        
        const pct = total > 0 ? Math.round((verified / total) * 100) : 0;
        
        // Ring progress
        const ring = document.getElementById('progress-ring');
        const circumference = 125.6;
        ring.style.strokeDashoffset = circumference - (circumference * pct / 100);
        document.getElementById('score-text').textContent = pct + '%';
        
        // Badges
        document.getElementById('count-nc').textContent = nc;
    }

    // === TABS ===
    function switchTab(tab) {
        currentTab = tab;
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.getElementById('tab-' + tab).classList.add('active');
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
        document.getElementById('panel-' + tab).classList.remove('hidden');
        
        if (tab === 'resume') {
            renderResume();
            document.getElementById('filters-bar').classList.add('hidden');
        } else {
            document.getElementById('filters-bar').classList.remove('hidden');
        }
    }

    // === FILTRES ===
    function filterItems(filter) {
        currentFilter = filter;
        document.querySelectorAll('.filter-btn').forEach(b => {
            b.classList.remove('active', 'bg-slate-900', 'text-white');
            b.classList.add('bg-slate-100');
        });
        event.target.classList.add('active', 'bg-slate-900', 'text-white');
        event.target.classList.remove('bg-slate-100');
        
        renderChecklist('sol', itemsSol);
        renderChecklist('toiture', itemsToiture);
    }

    // === RÉSUMÉ ===
    function renderResume() {
        const allItems = [...itemsSol, ...itemsToiture];
        const total = allItems.length;
        const c = allItems.filter(i => i.conformite === 'conforme').length;
        const nc = allItems.filter(i => i.conformite === 'non_conforme').length;
        const obs = allItems.filter(i => i.conformite === 'observation').length;
        const na = allItems.filter(i => i.conformite === 'non_applicable').length;
        const nv = allItems.filter(i => i.conformite === 'non_verifie').length;
        const scorePct = (total - nv - na) > 0 ? Math.round((c / (total - nv - na)) * 100) : 0;

        const ncItems = allItems.filter(i => i.conformite === 'non_conforme');
        const obsItems = allItems.filter(i => i.conformite === 'observation');

        let html = '';
        
        // Score card
        html += '<div class="bg-white rounded-2xl p-6 shadow-sm border">';
        html += '<h3 class="text-lg font-black text-slate-800 mb-4">Score de Conformité</h3>';
        html += '<div class="text-center mb-4"><span class="text-5xl font-black ' + (scorePct >= 80 ? 'text-green-600' : scorePct >= 60 ? 'text-amber-500' : 'text-red-500') + '">' + scorePct + '%</span></div>';
        html += '<div class="grid grid-cols-5 gap-2 text-center">';
        html += '<div><div class="text-lg font-black text-green-600">' + c + '</div><div class="text-[10px] text-slate-400">OK</div></div>';
        html += '<div><div class="text-lg font-black text-red-600">' + nc + '</div><div class="text-[10px] text-slate-400">NC</div></div>';
        html += '<div><div class="text-lg font-black text-amber-500">' + obs + '</div><div class="text-[10px] text-slate-400">OBS</div></div>';
        html += '<div><div class="text-lg font-black text-slate-400">' + na + '</div><div class="text-[10px] text-slate-400">N/A</div></div>';
        html += '<div><div class="text-lg font-black text-slate-300">' + nv + '</div><div class="text-[10px] text-slate-400">NV</div></div>';
        html += '</div></div>';

        // Non-conformités
        if (ncItems.length > 0) {
            html += '<div class="bg-red-50 rounded-2xl p-4 border border-red-200">';
            html += '<h3 class="text-sm font-black text-red-700 mb-3"><i class="fas fa-exclamation-triangle mr-2"></i>Non-Conformités (' + nc + ')</h3>';
            ncItems.forEach(item => {
                html += '<div class="bg-white rounded-lg p-3 mb-2 border border-red-100">';
                html += '<div class="flex items-center gap-2 mb-1"><span class="text-[10px] font-black text-red-400">' + item.code_item + '</span>';
                if (item.severite === 'critique') html += '<span class="text-[10px] font-black text-white bg-red-500 px-1.5 rounded">CRITIQUE</span>';
                html += '</div>';
                html += '<p class="text-xs text-slate-700">' + item.libelle + '</p>';
                if (item.commentaire) html += '<p class="text-xs text-red-500 mt-1 italic">' + item.commentaire + '</p>';
                html += '</div>';
            });
            html += '</div>';
        }

        // Observations
        if (obsItems.length > 0) {
            html += '<div class="bg-amber-50 rounded-2xl p-4 border border-amber-200">';
            html += '<h3 class="text-sm font-black text-amber-700 mb-3"><i class="fas fa-eye mr-2"></i>Observations (' + obs + ')</h3>';
            obsItems.forEach(item => {
                html += '<div class="bg-white rounded-lg p-3 mb-2 border border-amber-100">';
                html += '<span class="text-[10px] font-black text-amber-400">' + item.code_item + '</span>';
                html += '<p class="text-xs text-slate-700">' + item.libelle + '</p>';
                if (item.commentaire) html += '<p class="text-xs text-amber-500 mt-1 italic">' + item.commentaire + '</p>';
                html += '</div>';
            });
            html += '</div>';
        }

        // Actions
        html += '<div class="flex gap-3">';
        html += '<button onclick="openFinalCommentModal()" class="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2"><i class="fas fa-signature"></i>Commentaires & Signature</button>';
        html += '<button onclick="generateRapport()" class="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center gap-2"><i class="fas fa-file-pdf"></i>Générer Rapport</button>';
        html += '</div>';

        document.getElementById('resume-content').innerHTML = html;
    }

    // === COMMENTAIRE ITEM ===
    function openItemComment(itemId, type, code) {
        document.getElementById('comment-item-id').value = itemId;
        document.getElementById('comment-item-type').value = type;
        document.getElementById('comment-modal-title').textContent = 'Commentaire - ' + code;
        
        const items = type === 'sol' ? itemsSol : itemsToiture;
        const item = items.find(i => i.id === itemId);
        document.getElementById('comment-text').value = item?.commentaire || '';
        
        document.getElementById('comment-modal').classList.remove('hidden');
    }
    
    function closeCommentModal() { document.getElementById('comment-modal').classList.add('hidden'); }
    
    async function saveComment() {
        const itemId = document.getElementById('comment-item-id').value;
        const type = document.getElementById('comment-item-type').value;
        const commentaire = document.getElementById('comment-text').value;
        
        try {
            await axios.put(API + '/checklist/' + type + '/' + itemId, { commentaire });
            const items = type === 'sol' ? itemsSol : itemsToiture;
            const item = items.find(i => i.id == itemId);
            if (item) item.commentaire = commentaire;
            renderChecklist(type, items);
            closeCommentModal();
            showToast('Commentaire enregistré');
        } catch (err) {
            showToast('Erreur', 'error');
        }
    }

    // === COMMENTAIRE FINAL ===
    function openFinalCommentModal() { document.getElementById('final-comment-modal').classList.remove('hidden'); loadFinalComment(); }
    function closeFinalCommentModal() { document.getElementById('final-comment-modal').classList.add('hidden'); }
    function openCommentModal() { openFinalCommentModal(); }

    async function loadFinalComment() {
        try {
            const res = await axios.get(API + '/missions/' + MISSION_ID + '/commentaires');
            if (res.data.commentaire) {
                document.getElementById('final-conclusion').value = res.data.commentaire.conclusion_generale || '';
                document.getElementById('final-recommandations').value = res.data.commentaire.recommandations || '';
                document.getElementById('final-signe-par').value = res.data.commentaire.signe_par || 'Adrien PAPPALARDO';
            }
        } catch (err) { /* ignore */ }
    }

    async function saveFinalComment() {
        try {
            await axios.post(API + '/missions/' + MISSION_ID + '/commentaires', {
                conclusion_generale: document.getElementById('final-conclusion').value,
                recommandations: document.getElementById('final-recommandations').value,
                signe_par: document.getElementById('final-signe-par').value
            });
            closeFinalCommentModal();
            showToast('Commentaires signés et enregistrés');
        } catch (err) {
            showToast('Erreur sauvegarde', 'error');
        }
    }

    // === PHOTOS ===
    function openPhotoModal() { document.getElementById('photo-gen-modal').classList.remove('hidden'); }
    function closePhotoModal() { document.getElementById('photo-gen-modal').classList.add('hidden'); }

    async function uploadGeneralPhoto() {
        const file = document.getElementById('photo-file').files[0];
        if (!file) { showToast('Sélectionnez une photo', 'warning'); return; }
        
        const reader = new FileReader();
        reader.onload = async function() {
            const base64 = reader.result.split(',')[1];
            try {
                await axios.post(API + '/missions/' + MISSION_ID + '/photos-generales', {
                    photo_base64: base64,
                    type_photo: document.getElementById('photo-type').value,
                    legende: document.getElementById('photo-legende').value
                });
                closePhotoModal();
                showToast('Photo enregistrée');
            } catch (err) {
                showToast('Erreur upload', 'error');
            }
        };
        reader.readAsDataURL(file);
    }

    // === RAPPORT ===
    async function generateRapport() {
        try {
            showToast('Génération en cours...', 'info');
            const res = await axios.post(API + '/missions/' + MISSION_ID + '/rapport/generer');
            if (res.data.success && res.data.rapport) {
                window.open('/rapport-qualite/' + res.data.rapport.id, '_blank');
                showToast('Rapport généré');
            }
        } catch (err) {
            showToast('Erreur génération rapport', 'error');
        }
    }

    // === SAVE & FINISH ===
    async function saveAndFinish() {
        if (!confirm('Terminer cet audit qualité ? Le statut passera à "terminé".')) return;
        try {
            await axios.put(API + '/missions/' + MISSION_ID + '/statut', { statut: 'termine' });
            showToast('Audit terminé avec succès');
            setTimeout(() => window.location.href = '/crm/dashboard', 1500);
        } catch (err) {
            showToast('Erreur', 'error');
        }
    }

    // === TOAST ===
    function showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const icon = document.getElementById('toast-icon');
        const text = document.getElementById('toast-text');
        
        text.textContent = message;
        icon.className = 'fas ' + (type === 'success' ? 'fa-check-circle text-green-400' : type === 'error' ? 'fa-exclamation-circle text-red-400' : type === 'warning' ? 'fa-exclamation-triangle text-amber-400' : 'fa-info-circle text-blue-400');
        
        toast.classList.remove('hidden');
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => toast.classList.add('hidden'), 2500);
    }

    // === START ===
    document.addEventListener('DOMContentLoaded', init);
    </script>
</body>
</html>`;
}

export function getAuditQualitePhotosPage(missionId: string) {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Photos Audit Qualité - DiagPV</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
</head>
<body class="bg-slate-50 min-h-screen">
    <header class="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg sticky top-0 z-30 px-4 py-4">
        <div class="flex items-center gap-3">
            <button onclick="history.back()" class="hover:bg-white/20 p-2 rounded-lg"><i class="fas fa-arrow-left"></i></button>
            <div>
                <h1 class="text-lg font-black">Galerie Photos</h1>
                <p class="text-xs opacity-80" id="mission-ref">Mission ${missionId}</p>
            </div>
        </div>
    </header>
    
    <main class="p-4 space-y-4">
        <div id="photos-grid" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <div class="col-span-full p-8 text-center">
                <i class="fas fa-circle-notch fa-spin text-2xl text-blue-500 mb-3"></i>
                <p class="text-slate-400 text-sm">Chargement...</p>
            </div>
        </div>
    </main>

    <script>
    const MISSION_ID = '${missionId}';
    const API = '/api/audit-qualite';

    async function loadPhotos() {
        try {
            const [itemPhotos, genPhotos] = await Promise.all([
                axios.get(API + '/missions/' + MISSION_ID + '/photos'),
                axios.get(API + '/missions/' + MISSION_ID + '/photos-generales')
            ]);
            
            const allPhotos = [
                ...(genPhotos.data.photos || []).map(p => ({...p, source: 'generale'})),
                ...(itemPhotos.data.photos || []).map(p => ({...p, source: 'item'}))
            ];
            
            const grid = document.getElementById('photos-grid');
            if (!allPhotos.length) {
                grid.innerHTML = '<div class="col-span-full p-12 text-center"><i class="fas fa-image text-4xl text-slate-300 mb-3"></i><p class="text-slate-400">Aucune photo</p></div>';
                return;
            }
            
            grid.innerHTML = allPhotos.map(p => 
                '<div class="relative rounded-xl overflow-hidden shadow-sm border bg-white group">' +
                '<img src="' + p.photo_url + '" class="w-full h-40 object-cover" alt="Photo" onerror="this.src=\\'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23e2e8f0%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%2394a3b8%22 font-size=%2212%22>Photo</text></svg>\\'" />' +
                '<div class="p-2">' +
                '<span class="text-[10px] font-bold uppercase tracking-wide ' + (p.source === 'generale' ? 'text-blue-500' : 'text-emerald-500') + '">' + (p.source === 'generale' ? p.type_photo || 'Générale' : 'Item ' + (p.checklist_type || '')) + '</span>' +
                (p.legende ? '<p class="text-xs text-slate-500 truncate">' + p.legende + '</p>' : '') +
                '</div></div>'
            ).join('');
            
        } catch (err) {
            console.error(err);
        }
    }
    
    document.addEventListener('DOMContentLoaded', loadPhotos);
    </script>
</body>
</html>`;
}
