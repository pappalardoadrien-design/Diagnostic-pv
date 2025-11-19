// ============================================================================
// PAGE CHECKLIST GIRASOLE - CONFORMITÉ NF C 15-100 + UTE C 15-712
// ============================================================================
// Checklist audit visuel conformité pour centrales SOL
// Workflow 12 étapes - Format GIRASOLE

export function getGirasoleConformiteChecklistPage() {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Checklist GIRASOLE - Conformité</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <link rel="manifest" href="/static/manifest.json">
    <style>
        body { 
            font-family: system-ui, -apple-system, sans-serif;
            -webkit-font-smoothing: antialiased;
            touch-action: manipulation;
        }
        .btn-touch { min-height: 60px; font-size: 16px; }
        .section { border-left: 4px solid #fbbf24; }
        .section-completed { border-left-color: #22c55e; }
        .conformite-btn { min-width: 100px; }
        .conformite-conforme { background: #22c55e; color: white; }
        .conformite-non-conforme { background: #ef4444; color: white; }
        .conformite-so { background: #9ca3af; color: white; }
        @media (max-width: 768px) {
            .container { padding: 8px; }
            h1 { font-size: 20px; }
        }
    </style>
</head>
<body class="bg-gray-50">
    <div class="container mx-auto p-4 max-w-4xl">
        <!-- Header -->
        <div class="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-6 rounded-lg shadow-lg mb-6">
            <h1 class="text-2xl font-bold">
                <i class="fas fa-clipboard-check mr-2"></i>
                Audit Conformité GIRASOLE
            </h1>
            <p class="text-sm mt-2 opacity-90">NF C 15-100 + UTE C 15-712</p>
            <div id="audit-info" class="mt-4 text-sm bg-white/20 p-3 rounded">
                <div><strong>Audit:</strong> <span id="audit-project">Chargement...</span></div>
                <div><strong>Client:</strong> <span id="audit-client">-</span></div>
            </div>
        </div>

        <!-- Progress Bar -->
        <div class="bg-white p-4 rounded-lg shadow mb-6">
            <div class="flex justify-between items-center mb-2">
                <span class="text-sm font-medium">Progression</span>
                <span id="progress-text" class="text-sm text-gray-600">0/12 sections</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-3">
                <div id="progress-bar" class="bg-green-500 h-3 rounded-full transition-all duration-300" style="width: 0%"></div>
            </div>
        </div>

        <!-- Sections Checklist -->
        <div id="checklist-container"></div>

        <!-- Actions Bottom -->
        <div class="sticky bottom-0 bg-white p-4 rounded-lg shadow-lg mt-6 space-y-3">
            <button id="btn-save-draft" class="btn-touch w-full bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition">
                <i class="fas fa-save mr-2"></i>
                Sauvegarder brouillon
            </button>
            <button id="btn-submit" class="btn-touch w-full bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition">
                <i class="fas fa-check-circle mr-2"></i>
                Soumettre audit complet
            </button>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
        // ========================================================================
        // CONFIGURATION
        // ========================================================================
        const auditToken = window.location.pathname.split('/')[2];
        
        // Structure checklist GIRASOLE (12 sections)
        const checklistStructure = [
            {
                id: 1,
                title: "1. Identification Centrale",
                items: [
                    { id: "id_centrale", label: "Nom centrale", type: "text", required: true },
                    { id: "id_adresse", label: "Adresse complète", type: "text", required: true },
                    { id: "id_puissance", label: "Puissance installée (kWc)", type: "number", required: true },
                    { id: "id_date_mes", label: "Date mise en service", type: "date", required: true }
                ]
            },
            {
                id: 2,
                title: "2. Autocontrôle Installateur",
                items: [
                    { id: "auto_pv_reception", label: "PV de réception lot PV présent", type: "conformite", required: true },
                    { id: "auto_cr_visite", label: "≥1 CR visite chantier présent", type: "conformite", required: true },
                    { id: "auto_cdc_tranchees", label: "Cahier des charges tranchées présent", type: "conformite", required: true }
                ]
            },
            {
                id: 3,
                title: "3. Cheminements Câbles DC",
                items: [
                    { id: "chem_fixations", label: "Fixations câbles conformes", type: "conformite", required: true },
                    { id: "chem_reperage", label: "Repérage câbles correct", type: "conformite", required: true },
                    { id: "chem_protections", label: "Protections mécaniques présentes", type: "conformite", required: true },
                    { id: "chem_rayon_courbure", label: "Rayons de courbure respectés", type: "conformite", required: true }
                ]
            },
            {
                id: 4,
                title: "4. Connexions & Raccordements",
                items: [
                    { id: "conn_cosses_bimetal", label: "Cosses bimétalliques si nécessaire", type: "conformite", required: true },
                    { id: "conn_serrage", label: "Serrage connecteurs conforme", type: "conformite", required: true },
                    { id: "conn_etancheite", label: "Étanchéité IP conforme", type: "conformite", required: true }
                ]
            },
            {
                id: 5,
                title: "5. Tranchées AC (Shelter→PDL)",
                items: [
                    { id: "tranch_profondeur", label: "Profondeur tranchée conforme", type: "conformite", required: true },
                    { id: "tranch_grillage", label: "Grillage avertisseur présent", type: "conformite", required: true },
                    { id: "tranch_rebouchage", label: "Rebouchage fourreaux correct", type: "conformite", required: true }
                ]
            },
            {
                id: 6,
                title: "6. Onduleurs & BT",
                items: [
                    { id: "ond_fixation", label: "Fixation onduleurs conforme", type: "conformite", required: true },
                    { id: "ond_ventilation", label: "Ventilation suffisante", type: "conformite", required: true },
                    { id: "ond_terre", label: "Mise à la terre correcte", type: "conformite", required: true },
                    { id: "ond_etiquetage", label: "Étiquetage tension DC présent", type: "conformite", required: true }
                ]
            },
            {
                id: 7,
                title: "7. Boîtes de Jonction",
                items: [
                    { id: "bj_etancheite", label: "Étanchéité BJ conforme", type: "conformite", required: true },
                    { id: "bj_fixation", label: "Fixation BJ solide", type: "conformite", required: true },
                    { id: "bj_reperage", label: "Repérage strings correct", type: "conformite", required: true }
                ]
            },
            {
                id: 8,
                title: "8. Modules Photovoltaïques",
                items: [
                    { id: "mod_fixation", label: "Fixation modules conforme", type: "conformite", required: true },
                    { id: "mod_serrage", label: "Serrage SI correct", type: "conformite", required: true },
                    { id: "mod_etat_visuel", label: "État visuel modules OK", type: "conformite", required: true },
                    { id: "mod_inclinaison", label: "Inclinaison conforme plans", type: "conformite", required: true }
                ]
            },
            {
                id: 9,
                title: "9. Structure Support",
                items: [
                    { id: "struct_ancrage", label: "Ancrage structure conforme", type: "conformite", required: true },
                    { id: "struct_corrosion", label: "Absence corrosion", type: "conformite", required: true },
                    { id: "struct_stabilite", label: "Stabilité générale OK", type: "conformite", required: true }
                ]
            },
            {
                id: 10,
                title: "10. Sécurité & Signalisation",
                items: [
                    { id: "secu_acces", label: "Accès sécurisés (clôtures)", type: "conformite", required: true },
                    { id: "secu_panneaux", label: "Panneaux signalisation présents", type: "conformite", required: true },
                    { id: "secu_extincteur", label: "Extincteur présent et valide", type: "conformite", required: true }
                ]
            },
            {
                id: 11,
                title: "11. Monitoring & Supervision",
                items: [
                    { id: "mon_systeme", label: "Système monitoring fonctionnel", type: "conformite", required: true },
                    { id: "mon_acces", label: "Accès interface OK", type: "conformite", required: true }
                ]
            },
            {
                id: 12,
                title: "12. Observations Générales",
                items: [
                    { id: "obs_generale", label: "Observations générales", type: "textarea", required: false },
                    { id: "obs_recommandations", label: "Recommandations", type: "textarea", required: false }
                ]
            }
        ];

        // ========================================================================
        // STATE
        // ========================================================================
        let checklistData = {};
        let auditInfo = null;
        let photos = {};

        // ========================================================================
        // INIT
        // ========================================================================
        document.addEventListener('DOMContentLoaded', async () => {
            await loadAuditInfo();
            renderChecklist();
            loadDraft();
            setupEventListeners();
        });

        // ========================================================================
        // LOAD AUDIT INFO
        // ========================================================================
        async function loadAuditInfo() {
            try {
                const response = await axios.get(\`/api/audits/\${auditToken}\`);
                auditInfo = response.data.audit;
                document.getElementById('audit-project').textContent = auditInfo.project_name || 'N/A';
                document.getElementById('audit-client').textContent = auditInfo.client_name || 'N/A';
            } catch (error) {
                console.error('Error loading audit:', error);
                alert('Erreur chargement audit');
            }
        }

        // ========================================================================
        // RENDER CHECKLIST
        // ========================================================================
        function renderChecklist() {
            const container = document.getElementById('checklist-container');
            container.innerHTML = '';

            checklistStructure.forEach(section => {
                const sectionDiv = document.createElement('div');
                sectionDiv.className = 'section bg-white p-4 rounded-lg shadow mb-4';
                sectionDiv.id = \`section-\${section.id}\`;

                let sectionHTML = \`
                    <h3 class="text-lg font-bold text-gray-800 mb-4">
                        <i class="fas fa-check-circle mr-2 text-gray-400"></i>
                        \${section.title}
                    </h3>
                    <div class="space-y-4">
                \`;

                section.items.forEach(item => {
                    sectionHTML += renderItem(section.id, item);
                });

                sectionHTML += '</div>';
                sectionDiv.innerHTML = sectionHTML;
                container.appendChild(sectionDiv);
            });

            updateProgress();
        }

        // ========================================================================
        // RENDER ITEM
        // ========================================================================
        function renderItem(sectionId, item) {
            const itemId = \`item-\${item.id}\`;

            if (item.type === 'conformite') {
                return \`
                    <div class="border-b pb-3">
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            \${item.label} \${item.required ? '<span class="text-red-500">*</span>' : ''}
                        </label>
                        <div class="flex gap-2">
                            <button 
                                type="button" 
                                class="conformite-btn conformite-conforme rounded px-4 py-2 text-sm font-medium" 
                                data-item="\${item.id}" 
                                data-value="conforme"
                                onclick="setConformite('\${item.id}', 'conforme', \${sectionId})">
                                Conforme
                            </button>
                            <button 
                                type="button" 
                                class="conformite-btn conformite-non-conforme rounded px-4 py-2 text-sm font-medium" 
                                data-item="\${item.id}" 
                                data-value="non_conforme"
                                onclick="setConformite('\${item.id}', 'non_conforme', \${sectionId})">
                                Non conforme
                            </button>
                            <button 
                                type="button" 
                                class="conformite-btn conformite-so rounded px-4 py-2 text-sm font-medium" 
                                data-item="\${item.id}" 
                                data-value="so"
                                onclick="setConformite('\${item.id}', 'so', \${sectionId})">
                                S.O
                            </button>
                        </div>
                        <div class="mt-2">
                            <input 
                                type="text" 
                                id="comment-\${item.id}" 
                                placeholder="Commentaire (optionnel)" 
                                class="w-full px-3 py-2 border rounded text-sm"
                                onchange="updateComment('\${item.id}', this.value)">
                        </div>
                        <div class="mt-2">
                            <button 
                                type="button" 
                                class="text-sm text-blue-600 hover:underline" 
                                onclick="addPhoto('\${item.id}')">
                                <i class="fas fa-camera mr-1"></i>
                                Ajouter photo
                            </button>
                            <div id="photos-\${item.id}" class="mt-2 flex gap-2 flex-wrap"></div>
                        </div>
                    </div>
                \`;
            }

            if (item.type === 'textarea') {
                return \`
                    <div class="border-b pb-3">
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            \${item.label}
                        </label>
                        <textarea 
                            id="\${itemId}" 
                            rows="4" 
                            class="w-full px-3 py-2 border rounded text-sm"
                            onchange="updateTextarea('\${item.id}', this.value)"></textarea>
                    </div>
                \`;
            }

            // Default text/number/date inputs
            return \`
                <div class="border-b pb-3">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        \${item.label} \${item.required ? '<span class="text-red-500">*</span>' : ''}
                    </label>
                    <input 
                        type="\${item.type}" 
                        id="\${itemId}" 
                        class="w-full px-3 py-2 border rounded text-sm"
                        \${item.required ? 'required' : ''}
                        onchange="updateInput('\${item.id}', this.value)">
                </div>
            \`;
        }

        // ========================================================================
        // HANDLERS
        // ========================================================================
        function setConformite(itemId, value, sectionId) {
            checklistData[itemId] = { conformite: value };
            
            // Visual feedback
            document.querySelectorAll(\`[data-item="\${itemId}"]\`).forEach(btn => {
                btn.classList.remove('opacity-100');
                btn.classList.add('opacity-50');
            });
            document.querySelector(\`[data-item="\${itemId}"][data-value="\${value}"]\`).classList.remove('opacity-50');
            document.querySelector(\`[data-item="\${itemId}"][data-value="\${value}"]\`).classList.add('opacity-100');
            
            saveDraft();
            updateProgress();
        }

        function updateComment(itemId, value) {
            if (!checklistData[itemId]) checklistData[itemId] = {};
            checklistData[itemId].comment = value;
            saveDraft();
        }

        function updateTextarea(itemId, value) {
            checklistData[itemId] = { value };
            saveDraft();
        }

        function updateInput(itemId, value) {
            checklistData[itemId] = { value };
            saveDraft();
        }

        function addPhoto(itemId) {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.capture = 'environment';
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = async (event) => {
                        const photoData = event.target.result;
                        
                        // Upload photo
                        try {
                            const response = await axios.post('/api/photos/upload', {
                                audit_token: auditToken,
                                module_type: 'CONFORMITE_GIRASOLE',
                                photo_data: photoData,
                                description: itemId,
                                latitude: null,
                                longitude: null
                            });
                            
                            if (!photos[itemId]) photos[itemId] = [];
                            photos[itemId].push({ id: response.data.photo_id, data: photoData });
                            
                            renderPhotos(itemId);
                            saveDraft();
                        } catch (error) {
                            console.error('Upload error:', error);
                            alert('Erreur upload photo');
                        }
                    };
                    reader.readAsDataURL(file);
                }
            };
            input.click();
        }

        function renderPhotos(itemId) {
            const container = document.getElementById(\`photos-\${itemId}\`);
            if (!container) return;
            
            const itemPhotos = photos[itemId] || [];
            container.innerHTML = itemPhotos.map((photo, idx) => \`
                <div class="relative">
                    <img src="\${photo.data}" class="w-20 h-20 object-cover rounded border">
                    <button 
                        type="button" 
                        class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs"
                        onclick="deletePhoto('\${itemId}', \${idx})">
                        ×
                    </button>
                </div>
            \`).join('');
        }

        function deletePhoto(itemId, index) {
            photos[itemId].splice(index, 1);
            renderPhotos(itemId);
            saveDraft();
        }

        // ========================================================================
        // PROGRESS
        // ========================================================================
        function updateProgress() {
            const totalSections = checklistStructure.length;
            let completedSections = 0;

            checklistStructure.forEach(section => {
                const requiredItems = section.items.filter(i => i.required);
                const filledItems = requiredItems.filter(item => checklistData[item.id]);
                
                if (filledItems.length === requiredItems.length) {
                    completedSections++;
                    document.getElementById(\`section-\${section.id}\`).classList.add('section-completed');
                }
            });

            const progress = (completedSections / totalSections) * 100;
            document.getElementById('progress-bar').style.width = progress + '%';
            document.getElementById('progress-text').textContent = \`\${completedSections}/\${totalSections} sections\`;
        }

        // ========================================================================
        // SAVE/LOAD DRAFT
        // ========================================================================
        function saveDraft() {
            localStorage.setItem(\`girasole-draft-\${auditToken}\`, JSON.stringify({
                checklistData,
                photos,
                timestamp: Date.now()
            }));
        }

        function loadDraft() {
            const draft = localStorage.getItem(\`girasole-draft-\${auditToken}\`);
            if (draft) {
                const data = JSON.parse(draft);
                checklistData = data.checklistData || {};
                photos = data.photos || {};
                
                // Restore UI
                Object.entries(checklistData).forEach(([itemId, value]) => {
                    if (value.conformite) {
                        const btn = document.querySelector(\`[data-item="\${itemId}"][data-value="\${value.conformite}"]\`);
                        if (btn) btn.click();
                    }
                    if (value.comment) {
                        const input = document.getElementById(\`comment-\${itemId}\`);
                        if (input) input.value = value.comment;
                    }
                    if (value.value) {
                        const input = document.getElementById(\`item-\${itemId}\`);
                        if (input) input.value = value.value;
                    }
                });
                
                Object.keys(photos).forEach(itemId => renderPhotos(itemId));
                updateProgress();
            }
        }

        // ========================================================================
        // SUBMIT
        // ========================================================================
        async function submitAudit() {
            if (!confirm('Soumettre cet audit complet ?')) return;

            try {
                // Convert checklist data to visual_inspections format
                const inspections = [];
                
                checklistStructure.forEach((section, sectionIdx) => {
                    section.items.forEach((item, itemIdx) => {
                        const data = checklistData[item.id];
                        if (!data) return;

                        inspections.push({
                            audit_token: auditToken,
                            inspection_type: 'conformite_nfc15100',
                            audit_category: 'conformite_nfc15100',
                            checklist_section: section.title,
                            item_order: sectionIdx * 100 + itemIdx,
                            location_description: item.label,
                            defect_found: data.conformite === 'non_conforme',
                            conformite: data.conformite || 'so',
                            notes: data.comment || data.value || '',
                            photo_url: photos[item.id] ? JSON.stringify(photos[item.id].map(p => p.id)) : null
                        });
                    });
                });

                // Submit all inspections
                for (const inspection of inspections) {
                    await axios.post(\`/api/visual/inspections/\${auditToken}\`, inspection);
                }

                localStorage.removeItem(\`girasole-draft-\${auditToken}\`);
                alert('✅ Audit soumis avec succès !');
                window.location.href = \`/audit/\${auditToken}/visual\`;
            } catch (error) {
                console.error('Submit error:', error);
                alert('Erreur soumission : ' + error.message);
            }
        }

        // ========================================================================
        // SETUP
        // ========================================================================
        function setupEventListeners() {
            document.getElementById('btn-save-draft').addEventListener('click', () => {
                saveDraft();
                alert('✅ Brouillon sauvegardé');
            });

            document.getElementById('btn-submit').addEventListener('click', submitAudit);
        }
    </script>
</body>
</html>
  `;
}
