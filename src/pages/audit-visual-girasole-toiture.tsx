// ============================================================================
// PAGE CHECKLIST GIRASOLE - TOITURE DTU 40.35 + ETN
// ============================================================================
// Checklist audit visuel toiture avec démontage 25 panneaux

export function getGirasoleToitureChecklistPage() {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Checklist GIRASOLE - Toiture</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        body { 
            font-family: system-ui, -apple-system, sans-serif;
            -webkit-font-smoothing: antialiased;
            touch-action: manipulation;
        }
        .btn-touch { min-height: 60px; font-size: 16px; }
        .section { border-left: 4px solid #f97316; }
        .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; }
        .conformite-btn { min-width: 100px; }
        .conformite-conforme { background: #22c55e; color: white; }
        .conformite-non-conforme { background: #ef4444; color: white; }
        .conformite-so { background: #9ca3af; color: white; }
    </style>
</head>
<body class="bg-gray-50">
    <div class="container mx-auto p-4 max-w-4xl">
        <!-- Header -->
        <div class="bg-gradient-to-r from-orange-500 to-red-600 text-white p-6 rounded-lg shadow-lg mb-6">
            <h1 class="text-2xl font-bold">
                <i class="fas fa-hard-hat mr-2"></i>
                Audit Toiture GIRASOLE
            </h1>
            <p class="text-sm mt-2 opacity-90">DTU 40.35 + ETN + Notice Montage</p>
            <div id="audit-info" class="mt-4 text-sm bg-white/20 p-3 rounded">
                <div><strong>Audit:</strong> <span id="audit-project">Chargement...</span></div>
            </div>
        </div>

        <!-- Avertissement Sécurité -->
        <div class="warning-box p-4 rounded-lg mb-6">
            <h3 class="font-bold text-amber-900 mb-2">
                <i class="fas fa-exclamation-triangle mr-2"></i>
                CONSIGNES SÉCURITÉ CRITIQUES
            </h3>
            <ul class="text-sm text-amber-800 space-y-1">
                <li>⛔ <strong>INTERDIT de marcher sur les panneaux</strong></li>
                <li>✅ Utiliser échafaudages / nacelles obligatoires</li>
                <li>✅ Harnais si pente >10%</li>
                <li>✅ Démontage 25 panneaux minimum</li>
                <li>✅ Choix pertinent : 1er/dernier chaîne</li>
            </ul>
        </div>

        <!-- Progress -->
        <div class="bg-white p-4 rounded-lg shadow mb-6">
            <div class="flex justify-between items-center mb-2">
                <span class="text-sm font-medium">Progression</span>
                <span id="progress-text" class="text-sm text-gray-600">0/7 sections</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-3">
                <div id="progress-bar" class="bg-orange-500 h-3 rounded-full transition-all duration-300" style="width: 0%"></div>
            </div>
        </div>

        <!-- Sections Checklist -->
        <div id="checklist-container"></div>

        <!-- Actions Bottom -->
        <div class="sticky bottom-0 bg-white p-4 rounded-lg shadow-lg mt-6 space-y-3">
            <button id="btn-save-draft" class="btn-touch w-full bg-blue-500 text-white rounded-lg font-medium">
                <i class="fas fa-save mr-2"></i>
                Sauvegarder brouillon
            </button>
            <button id="btn-submit" class="btn-touch w-full bg-orange-600 text-white rounded-lg font-medium">
                <i class="fas fa-check-circle mr-2"></i>
                Soumettre audit toiture
            </button>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
        const auditToken = window.location.pathname.split('/')[2];
        
        // Structure checklist TOITURE (7 sections DTU 40.35)
        const checklistStructure = [
            {
                id: 1,
                title: "1. Démontage Panneaux (Min 25)",
                items: [
                    { id: "demo_nombre", label: "Nombre panneaux démontés", type: "number", required: true, min: 25 },
                    { id: "demo_position", label: "Position panneaux (1er/dernier chaîne)", type: "text", required: true },
                    { id: "demo_methode", label: "Méthode démontage conforme notice", type: "conformite", required: true }
                ]
            },
            {
                id: 2,
                title: "2. Montage & Serrage Structure Intégration (SI)",
                items: [
                    { id: "si_fixation", label: "Fixation SI conforme DTU 40.35", type: "conformite", required: true },
                    { id: "si_serrage", label: "Couple serrage respecté", type: "conformite", required: true },
                    { id: "si_etat", label: "État structure intégration OK", type: "conformite", required: true }
                ]
            },
            {
                id: 3,
                title: "3. Montage & Serrage Panneaux",
                items: [
                    { id: "pan_fixation", label: "Fixation panneaux conforme notice", type: "conformite", required: true },
                    { id: "pan_serrage", label: "Serrage panneaux correct", type: "conformite", required: true },
                    { id: "pan_alignement", label: "Alignement panneaux OK", type: "conformite", required: true }
                ]
            },
            {
                id: 4,
                title: "4. Fixations Cheminements DC",
                items: [
                    { id: "chem_fixations", label: "Fixations câbles conformes", type: "conformite", required: true },
                    { id: "chem_passage", label: "Passage toiture étanche", type: "conformite", required: true },
                    { id: "chem_protection", label: "Protection mécanique câbles OK", type: "conformite", required: true }
                ]
            },
            {
                id: 5,
                title: "5. Raccordements Connecteurs",
                items: [
                    { id: "conn_etancheite", label: "Étanchéité connecteurs IP68", type: "conformite", required: true },
                    { id: "conn_serrage", label: "Serrage connecteurs conforme", type: "conformite", required: true },
                    { id: "conn_reperage", label: "Repérage + - correct", type: "conformite", required: true }
                ]
            },
            {
                id: 6,
                title: "6. Étanchéité Toiture",
                items: [
                    { id: "etanch_membrane", label: "Membrane étanchéité intacte", type: "conformite", required: true },
                    { id: "etanch_penetrations", label: "Pénétrations étanches", type: "conformite", required: true },
                    { id: "etanch_test", label: "Test étanchéité OK", type: "conformite", required: true }
                ]
            },
            {
                id: 7,
                title: "7. Remontage & Vérifications Finales",
                items: [
                    { id: "remontage_integrite", label: "Remontage sans atteinte intégrité", type: "conformite", required: true },
                    { id: "remontage_serrage", label: "Serrage final conforme", type: "conformite", required: true },
                    { id: "remontage_proprete", label: "Propreté zone intervention", type: "conformite", required: true },
                    { id: "obs_finale", label: "Observations finales", type: "textarea", required: false }
                ]
            }
        ];

        let checklistData = {};
        let photos = {};

        document.addEventListener('DOMContentLoaded', async () => {
            await loadAuditInfo();
            renderChecklist();
            loadDraft();
            setupEventListeners();
        });

        async function loadAuditInfo() {
            try {
                const response = await axios.get(\`/api/audits/\${auditToken}\`);
                document.getElementById('audit-project').textContent = response.data.audit.project_name || 'N/A';
            } catch (error) {
                console.error('Error:', error);
            }
        }

        function renderChecklist() {
            const container = document.getElementById('checklist-container');
            container.innerHTML = '';

            checklistStructure.forEach(section => {
                const sectionDiv = document.createElement('div');
                sectionDiv.className = 'section bg-white p-4 rounded-lg shadow mb-4';
                sectionDiv.id = \`section-\${section.id}\`;

                let sectionHTML = \`
                    <h3 class="text-lg font-bold text-gray-800 mb-4">
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

        function renderItem(sectionId, item) {
            if (item.type === 'conformite') {
                return \`
                    <div class="border-b pb-3">
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            \${item.label} <span class="text-red-500">*</span>
                        </label>
                        <div class="flex gap-2">
                            <button 
                                type="button" 
                                class="conformite-btn conformite-conforme rounded px-4 py-2 text-sm font-medium opacity-50" 
                                data-item="\${item.id}" 
                                data-value="conforme"
                                onclick="setConformite('\${item.id}', 'conforme')">
                                Conforme
                            </button>
                            <button 
                                type="button" 
                                class="conformite-btn conformite-non-conforme rounded px-4 py-2 text-sm font-medium opacity-50" 
                                data-item="\${item.id}" 
                                data-value="non_conforme"
                                onclick="setConformite('\${item.id}', 'non_conforme')">
                                Non conforme
                            </button>
                            <button 
                                type="button" 
                                class="conformite-btn conformite-so rounded px-4 py-2 text-sm font-medium opacity-50" 
                                data-item="\${item.id}" 
                                data-value="so"
                                onclick="setConformite('\${item.id}', 'so')">
                                S.O
                            </button>
                        </div>
                        <input 
                            type="text" 
                            id="comment-\${item.id}" 
                            placeholder="Commentaire" 
                            class="w-full px-3 py-2 border rounded text-sm mt-2"
                            onchange="updateComment('\${item.id}', this.value)">
                        <button 
                            type="button" 
                            class="text-sm text-orange-600 hover:underline mt-2" 
                            onclick="addPhoto('\${item.id}')">
                            <i class="fas fa-camera mr-1"></i>
                            Ajouter photo
                        </button>
                        <div id="photos-\${item.id}" class="mt-2 flex gap-2 flex-wrap"></div>
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
                            id="item-\${item.id}" 
                            rows="4" 
                            class="w-full px-3 py-2 border rounded text-sm"
                            onchange="updateTextarea('\${item.id}', this.value)"></textarea>
                    </div>
                \`;
            }

            return \`
                <div class="border-b pb-3">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        \${item.label} <span class="text-red-500">*</span>
                    </label>
                    <input 
                        type="\${item.type}" 
                        id="item-\${item.id}" 
                        class="w-full px-3 py-2 border rounded text-sm"
                        \${item.min ? \`min="\${item.min}"\` : ''}
                        onchange="updateInput('\${item.id}', this.value)">
                </div>
            \`;
        }

        function setConformite(itemId, value) {
            checklistData[itemId] = { conformite: value };
            document.querySelectorAll(\`[data-item="\${itemId}"]\`).forEach(btn => btn.classList.add('opacity-50'));
            document.querySelector(\`[data-item="\${itemId}"][data-value="\${value}"]\`).classList.remove('opacity-50');
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
                        try {
                            const response = await axios.post('/api/photos/upload', {
                                audit_token: auditToken,
                                module_type: 'TOITURE_GIRASOLE',
                                photo_data: event.target.result,
                                description: itemId
                            });
                            
                            if (!photos[itemId]) photos[itemId] = [];
                            photos[itemId].push({ id: response.data.photo_id, data: event.target.result });
                            
                            renderPhotos(itemId);
                            saveDraft();
                        } catch (error) {
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
                        onclick="deletePhoto('\${itemId}', \${idx})">×</button>
                </div>
            \`).join('');
        }

        function deletePhoto(itemId, index) {
            photos[itemId].splice(index, 1);
            renderPhotos(itemId);
            saveDraft();
        }

        function updateProgress() {
            const totalSections = checklistStructure.length;
            let completedSections = 0;
            checklistStructure.forEach(section => {
                const requiredItems = section.items.filter(i => i.required);
                const filledItems = requiredItems.filter(item => checklistData[item.id]);
                if (filledItems.length === requiredItems.length) completedSections++;
            });
            const progress = (completedSections / totalSections) * 100;
            document.getElementById('progress-bar').style.width = progress + '%';
            document.getElementById('progress-text').textContent = \`\${completedSections}/\${totalSections} sections\`;
        }

        function saveDraft() {
            localStorage.setItem(\`girasole-toiture-draft-\${auditToken}\`, JSON.stringify({
                checklistData,
                photos,
                timestamp: Date.now()
            }));
        }

        function loadDraft() {
            const draft = localStorage.getItem(\`girasole-toiture-draft-\${auditToken}\`);
            if (draft) {
                const data = JSON.parse(draft);
                checklistData = data.checklistData || {};
                photos = data.photos || {};
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

        async function submitAudit() {
            if (!confirm('Soumettre audit toiture ?')) return;

            try {
                const inspections = [];
                checklistStructure.forEach((section, sectionIdx) => {
                    section.items.forEach((item, itemIdx) => {
                        const data = checklistData[item.id];
                        if (!data) return;

                        inspections.push({
                            audit_token: auditToken,
                            inspection_type: 'toiture_dtu4035',
                            audit_category: 'toiture_dtu4035',
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

                for (const inspection of inspections) {
                    await axios.post(\`/api/visual/inspections/\${auditToken}\`, inspection);
                }

                localStorage.removeItem(\`girasole-toiture-draft-\${auditToken}\`);
                alert('✅ Audit toiture soumis !');
                window.location.href = \`/audit/\${auditToken}/visual\`;
            } catch (error) {
                alert('Erreur soumission : ' + error.message);
            }
        }

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
