// ============================================================================
// PAGE UPLOAD PHOTOS - INTERFACE DRAG & DROP PROFESSIONNELLE
// ============================================================================
// Upload photos EL, thermographie, visuelles vers R2
// Interface moderne avec drag & drop, preview, progress
// ============================================================================

export function getPhotosUploadPage() {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Upload Photos - DiagPV Hub</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <style>
            .drag-active {
                border-color: #FF6B35 !important;
                background-color: rgba(255, 107, 53, 0.1) !important;
            }
            .preview-image {
                width: 150px;
                height: 150px;
                object-fit: cover;
                border-radius: 8px;
            }
            .progress-bar {
                transition: width 0.3s ease;
            }
        </style>
    </head>
    <body class="bg-black text-white min-h-screen font-bold">
        <div class="container mx-auto p-6">
            <!-- Navigation -->
            <div id="module-nav" class="mb-6"></div>
            
            <!-- En-tête -->
            <header class="mb-8">
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <i class="fas fa-camera text-5xl text-orange-400 mr-4"></i>
                        <div>
                            <h1 class="text-4xl font-black">UPLOAD PHOTOS</h1>
                            <p class="text-xl text-gray-300">Drag & Drop ou sélection manuelle</p>
                        </div>
                    </div>
                    <button onclick="window.history.back()" class="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-black">
                        <i class="fas fa-arrow-left mr-2"></i>
                        RETOUR
                    </button>
                </div>
            </header>
            
            <!-- Configuration Upload -->
            <div class="max-w-4xl mx-auto mb-8">
                <div class="bg-gray-900 rounded-lg p-6 border-2 border-orange-400">
                    <h2 class="text-2xl font-black mb-4">
                        <i class="fas fa-cog mr-2 text-orange-400"></i>
                        CONFIGURATION
                    </h2>
                    
                    <div class="grid md:grid-cols-3 gap-4">
                        <div>
                            <label class="block text-sm font-bold mb-2">Type de photo *</label>
                            <select id="photo-type" class="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white">
                                <option value="el">📸 Électroluminescence</option>
                                <option value="thermal">🌡️ Thermographie</option>
                                <option value="visual">👁️ Visuelle</option>
                                <option value="iv">📊 Courbe I-V</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-bold mb-2">String (optionnel)</label>
                            <input type="number" id="string-number" placeholder="Ex: 1" 
                                   class="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white">
                        </div>
                        <div>
                            <label class="block text-sm font-bold mb-2">Module (optionnel)</label>
                            <input type="number" id="module-number" placeholder="Ex: 5" 
                                   class="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white">
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Zone Drag & Drop -->
            <div class="max-w-4xl mx-auto mb-8">
                <div id="drop-zone" class="bg-gray-900 rounded-lg p-12 border-4 border-dashed border-gray-600 text-center cursor-pointer hover:border-orange-400 transition-all">
                    <i class="fas fa-cloud-upload-alt text-6xl text-gray-500 mb-4"></i>
                    <h3 class="text-2xl font-black mb-2">Glissez vos photos ici</h3>
                    <p class="text-gray-400 mb-4">ou cliquez pour sélectionner</p>
                    <button onclick="document.getElementById('file-input').click()" 
                            class="bg-orange-600 hover:bg-orange-700 px-8 py-3 rounded-lg font-black">
                        <i class="fas fa-folder-open mr-2"></i>
                        PARCOURIR
                    </button>
                    <input type="file" id="file-input" multiple accept="image/*" class="hidden">
                    <p class="text-xs text-gray-500 mt-4">
                        Formats acceptés: JPG, PNG, HEIC | Taille max: 10 MB par photo
                    </p>
                </div>
            </div>
            
            <!-- Preview & Progress -->
            <div id="preview-container" class="max-w-4xl mx-auto mb-8 hidden">
                <div class="bg-gray-900 rounded-lg p-6 border-2 border-green-400">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-2xl font-black">
                            <i class="fas fa-images mr-2 text-green-400"></i>
                            PHOTOS SÉLECTIONNÉES (<span id="photo-count">0</span>)
                        </h2>
                        <button onclick="clearPhotos()" class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-bold text-sm">
                            <i class="fas fa-trash mr-2"></i>
                            EFFACER TOUT
                        </button>
                    </div>
                    
                    <!-- Liste previews -->
                    <div id="preview-list" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <!-- Previews générées dynamiquement -->
                    </div>
                    
                    <!-- Progress Bar -->
                    <div class="mb-4">
                        <div class="flex justify-between text-sm mb-2">
                            <span id="upload-status">Prêt à uploader</span>
                            <span id="upload-progress">0%</span>
                        </div>
                        <div class="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                            <div id="progress-bar" class="progress-bar bg-gradient-to-r from-orange-500 to-green-500 h-4 rounded-full" style="width: 0%"></div>
                        </div>
                    </div>
                    
                    <!-- Bouton Upload -->
                    <button id="btn-upload" onclick="uploadPhotos()" 
                            class="w-full bg-gradient-to-r from-orange-600 to-green-600 hover:from-orange-700 hover:to-green-700 px-8 py-4 rounded-lg font-black text-xl">
                        <i class="fas fa-rocket mr-2"></i>
                        UPLOADER <span id="photo-count-btn">0</span> PHOTOS
                    </button>
                </div>
            </div>
            
            <!-- Résultats Upload -->
            <div id="results-container" class="max-w-4xl mx-auto hidden">
                <div class="bg-gray-900 rounded-lg p-6 border-2 border-blue-400">
                    <h2 class="text-2xl font-black mb-4">
                        <i class="fas fa-check-circle mr-2 text-blue-400"></i>
                        RÉSULTATS UPLOAD
                    </h2>
                    <div id="results-list" class="space-y-2">
                        <!-- Résultats générés dynamiquement -->
                    </div>
                    
                    <div class="flex gap-4 mt-6">
                        <button onclick="resetUpload()" class="flex-1 bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-black">
                            <i class="fas fa-redo mr-2"></i>
                            UPLOADER D'AUTRES PHOTOS
                        </button>
                        <button onclick="viewPhotos()" class="flex-1 bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-black">
                            <i class="fas fa-eye mr-2"></i>
                            VOIR TOUTES LES PHOTOS
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <script>
            let auditToken = '';
            let selectedFiles = [];
            
            // ================================================================
            // INITIALISATION
            // ================================================================
            async function initPage() {
                // Extraire token depuis URL
                const pathParts = window.location.pathname.split('/');
                auditToken = pathParts[2];
                
                // Charger navigation modules
                await loadModuleNav();
                
                // Setup drag & drop
                setupDragAndDrop();
                
                // Setup file input
                document.getElementById('file-input').addEventListener('change', handleFileSelect);
            }
            
            async function loadModuleNav() {
                try {
                    const response = await axios.get(\`/api/module-nav/\${auditToken}\`);
                    document.getElementById('module-nav').innerHTML = response.data.html;
                } catch (error) {
                    console.error('Erreur chargement navigation:', error);
                }
            }
            
            // ================================================================
            // DRAG & DROP
            // ================================================================
            function setupDragAndDrop() {
                const dropZone = document.getElementById('drop-zone');
                
                ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                    dropZone.addEventListener(eventName, preventDefaults, false);
                    document.body.addEventListener(eventName, preventDefaults, false);
                });
                
                ['dragenter', 'dragover'].forEach(eventName => {
                    dropZone.addEventListener(eventName, () => {
                        dropZone.classList.add('drag-active');
                    }, false);
                });
                
                ['dragleave', 'drop'].forEach(eventName => {
                    dropZone.addEventListener(eventName, () => {
                        dropZone.classList.remove('drag-active');
                    }, false);
                });
                
                dropZone.addEventListener('drop', handleDrop, false);
                dropZone.addEventListener('click', () => {
                    document.getElementById('file-input').click();
                });
            }
            
            function preventDefaults(e) {
                e.preventDefault();
                e.stopPropagation();
            }
            
            function handleDrop(e) {
                const dt = e.dataTransfer;
                const files = dt.files;
                handleFiles(files);
            }
            
            function handleFileSelect(e) {
                const files = e.target.files;
                handleFiles(files);
            }
            
            // ================================================================
            // GESTION FICHIERS
            // ================================================================
            function handleFiles(files) {
                selectedFiles = Array.from(files).filter(file => {
                    // Vérifier type
                    if (!file.type.startsWith('image/')) {
                        alert(\`\${file.name} n'est pas une image valide\`);
                        return false;
                    }
                    
                    // Vérifier taille (10 MB max)
                    if (file.size > 10 * 1024 * 1024) {
                        alert(\`\${file.name} dépasse 10 MB\`);
                        return false;
                    }
                    
                    return true;
                });
                
                if (selectedFiles.length > 0) {
                    displayPreviews();
                    document.getElementById('preview-container').classList.remove('hidden');
                }
            }
            
            function displayPreviews() {
                const previewList = document.getElementById('preview-list');
                previewList.innerHTML = '';
                
                selectedFiles.forEach((file, index) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const preview = \`
                            <div class="relative group">
                                <img src="\${e.target.result}" class="preview-image border-2 border-gray-700" alt="\${file.name}">
                                <button onclick="removePhoto(\${index})" 
                                        class="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <i class="fas fa-times"></i>
                                </button>
                                <p class="text-xs text-gray-400 mt-2 truncate">\${file.name}</p>
                                <p class="text-xs text-gray-500">\${(file.size / 1024).toFixed(1)} KB</p>
                            </div>
                        \`;
                        previewList.innerHTML += preview;
                    };
                    reader.readAsDataURL(file);
                });
                
                document.getElementById('photo-count').textContent = selectedFiles.length;
                document.getElementById('photo-count-btn').textContent = selectedFiles.length;
            }
            
            function removePhoto(index) {
                selectedFiles.splice(index, 1);
                if (selectedFiles.length > 0) {
                    displayPreviews();
                } else {
                    clearPhotos();
                }
            }
            
            function clearPhotos() {
                selectedFiles = [];
                document.getElementById('preview-container').classList.add('hidden');
                document.getElementById('file-input').value = '';
            }
            
            // ================================================================
            // UPLOAD
            // ================================================================
            async function uploadPhotos() {
                if (selectedFiles.length === 0) {
                    alert('Aucune photo sélectionnée');
                    return;
                }
                
                const photoType = document.getElementById('photo-type').value;
                const stringNumber = document.getElementById('string-number').value;
                const moduleNumber = document.getElementById('module-number').value;
                
                const btnUpload = document.getElementById('btn-upload');
                btnUpload.disabled = true;
                btnUpload.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>UPLOAD EN COURS...';
                
                const results = [];
                const total = selectedFiles.length;
                
                for (let i = 0; i < selectedFiles.length; i++) {
                    const file = selectedFiles[i];
                    
                    // Update progress
                    const percent = Math.round(((i + 1) / total) * 100);
                    document.getElementById('upload-progress').textContent = percent + '%';
                    document.getElementById('progress-bar').style.width = percent + '%';
                    document.getElementById('upload-status').textContent = \`Upload \${i + 1}/\${total}: \${file.name}\`;
                    
                    try {
                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('audit_token', auditToken);
                        formData.append('photo_type', photoType);
                        if (stringNumber) formData.append('string_number', stringNumber);
                        if (moduleNumber) formData.append('module_number', moduleNumber);
                        
                        const response = await axios.post('/api/photos/upload', formData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                        });
                        
                        results.push({
                            file: file.name,
                            success: response.data.success,
                            url: response.data.data?.public_url
                        });
                        
                    } catch (error) {
                        results.push({
                            file: file.name,
                            success: false,
                            error: error.response?.data?.error || error.message
                        });
                    }
                }
                
                // Afficher résultats
                displayResults(results);
                
                // Reset
                btnUpload.disabled = false;
                btnUpload.innerHTML = '<i class="fas fa-rocket mr-2"></i>UPLOADER <span id="photo-count-btn">' + selectedFiles.length + '</span> PHOTOS';
            }
            
            function displayResults(results) {
                document.getElementById('preview-container').classList.add('hidden');
                document.getElementById('results-container').classList.remove('hidden');
                
                const resultsList = document.getElementById('results-list');
                resultsList.innerHTML = '';
                
                results.forEach(result => {
                    const icon = result.success ? '✅' : '❌';
                    const color = result.success ? 'text-green-400' : 'text-red-400';
                    const message = result.success 
                        ? 'Upload réussi' 
                        : (result.error || 'Erreur inconnue');
                    
                    resultsList.innerHTML += \`
                        <div class="flex items-center justify-between bg-gray-800 p-3 rounded">
                            <div class="flex items-center gap-3">
                                <span class="text-2xl">\${icon}</span>
                                <div>
                                    <p class="font-bold">\${result.file}</p>
                                    <p class="text-sm \${color}">\${message}</p>
                                </div>
                            </div>
                            \${result.url ? \`<a href="\${result.url}" target="_blank" class="text-blue-400 hover:text-blue-300"><i class="fas fa-external-link-alt"></i></a>\` : ''}
                        </div>
                    \`;
                });
            }
            
            function resetUpload() {
                document.getElementById('results-container').classList.add('hidden');
                clearPhotos();
                document.getElementById('upload-progress').textContent = '0%';
                document.getElementById('progress-bar').style.width = '0%';
                document.getElementById('upload-status').textContent = 'Prêt à uploader';
            }
            
            function viewPhotos() {
                window.location.href = \`/audit/\${auditToken}/photos\`;
            }
            
            // ================================================================
            // DÉMARRAGE
            // ================================================================
            document.addEventListener('DOMContentLoaded', initPage);
        </script>
    </body>
    </html>
  `;
}
