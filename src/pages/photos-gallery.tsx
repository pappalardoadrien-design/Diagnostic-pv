// ============================================================================
// PAGE GALERIE PHOTOS - VISUALISATION PHOTOS AUDIT
// ============================================================================
// Galerie photos avec lightbox, filtres, download
// Photos EL, thermographie, visuelles, I-V
// ============================================================================

export function getPhotosGalleryPage() {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Galerie Photos - DiagPV Hub</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <style>
            .photo-card {
                position: relative;
                overflow: hidden;
                border-radius: 12px;
                cursor: pointer;
                transition: transform 0.3s ease, box-shadow 0.3s ease;
            }
            .photo-card:hover {
                transform: scale(1.05);
                box-shadow: 0 10px 30px rgba(255, 107, 53, 0.5);
            }
            .photo-card img {
                width: 100%;
                height: 250px;
                object-fit: cover;
            }
            .photo-overlay {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                background: linear-gradient(to top, rgba(0,0,0,0.9), transparent);
                padding: 15px;
                opacity: 0;
                transition: opacity 0.3s;
            }
            .photo-card:hover .photo-overlay {
                opacity: 1;
            }
            .lightbox {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.95);
                z-index: 9999;
                align-items: center;
                justify-content: center;
            }
            .lightbox.active {
                display: flex;
            }
            .lightbox-image {
                max-width: 90%;
                max-height: 90%;
                object-fit: contain;
            }
            .badge-type {
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 11px;
                font-weight: bold;
                text-transform: uppercase;
            }
            .badge-el { background: #3B82F6; color: white; }
            .badge-thermal { background: #EF4444; color: white; }
            .badge-visual { background: #10B981; color: white; }
            .badge-iv { background: #8B5CF6; color: white; }
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
                        <i class="fas fa-images text-5xl text-orange-400 mr-4"></i>
                        <div>
                            <h1 class="text-4xl font-black">GALERIE PHOTOS</h1>
                            <p class="text-xl text-gray-300">Photos terrain audit photovoltaïque</p>
                        </div>
                    </div>
                    <div class="flex gap-3">
                        <button onclick="window.location.href='/audit/'+auditToken+'/photos/upload'" 
                                class="bg-orange-600 hover:bg-orange-700 px-6 py-3 rounded-lg font-black">
                            <i class="fas fa-upload mr-2"></i>
                            UPLOADER
                        </button>
                        <button onclick="window.history.back()" 
                                class="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-black">
                            <i class="fas fa-arrow-left mr-2"></i>
                            RETOUR
                        </button>
                    </div>
                </div>
            </header>
            
            <!-- Statistiques -->
            <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                <div class="bg-gray-900 rounded-lg p-4 border-2 border-orange-400 text-center">
                    <div class="text-3xl font-black text-orange-400" id="stat-total">0</div>
                    <div class="text-sm text-gray-400">Total Photos</div>
                </div>
                <div class="bg-gray-900 rounded-lg p-4 border-2 border-blue-400 text-center">
                    <div class="text-3xl font-black text-blue-400" id="stat-el">0</div>
                    <div class="text-sm text-gray-400">EL</div>
                </div>
                <div class="bg-gray-900 rounded-lg p-4 border-2 border-red-400 text-center">
                    <div class="text-3xl font-black text-red-400" id="stat-thermal">0</div>
                    <div class="text-sm text-gray-400">Thermographie</div>
                </div>
                <div class="bg-gray-900 rounded-lg p-4 border-2 border-green-400 text-center">
                    <div class="text-3xl font-black text-green-400" id="stat-visual">0</div>
                    <div class="text-sm text-gray-400">Visuelles</div>
                </div>
                <div class="bg-gray-900 rounded-lg p-4 border-2 border-purple-400 text-center">
                    <div class="text-3xl font-black text-purple-400" id="stat-iv">0</div>
                    <div class="text-sm text-gray-400">I-V</div>
                </div>
            </div>
            
            <!-- Filtres -->
            <div class="mb-8">
                <div class="bg-gray-900 rounded-lg p-6 border-2 border-orange-400">
                    <h2 class="text-2xl font-black mb-4">
                        <i class="fas fa-filter mr-2 text-orange-400"></i>
                        FILTRES
                    </h2>
                    <div class="grid md:grid-cols-4 gap-4">
                        <div>
                            <label class="block text-sm font-bold mb-2">Type de photo</label>
                            <select id="filter-type" onchange="applyFilters()" 
                                    class="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white">
                                <option value="">Tous types</option>
                                <option value="EL">📸 Électroluminescence</option>
                                <option value="THERMAL">🌡️ Thermographie</option>
                                <option value="VISUAL">👁️ Visuelles</option>
                                <option value="IV">📊 Courbes I-V</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-bold mb-2">String</label>
                            <select id="filter-string" onchange="applyFilters()" 
                                    class="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white">
                                <option value="">Tous strings</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-bold mb-2">Module</label>
                            <select id="filter-module" onchange="applyFilters()" 
                                    class="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white">
                                <option value="">Tous modules</option>
                            </select>
                        </div>
                        <div class="flex items-end">
                            <button onclick="resetFilters()" 
                                    class="w-full bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-bold">
                                <i class="fas fa-times mr-2"></i>
                                RÉINITIALISER
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Galerie -->
            <div id="gallery-container">
                <div id="gallery-grid" class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    <!-- Photos générées dynamiquement -->
                </div>
                
                <!-- Empty State -->
                <div id="empty-state" class="text-center py-20 hidden">
                    <i class="fas fa-camera-retro text-6xl text-gray-600 mb-4"></i>
                    <h3 class="text-2xl font-bold text-gray-400 mb-2">Aucune photo</h3>
                    <p class="text-gray-500 mb-6">Commencez par uploader des photos terrain</p>
                    <button onclick="window.location.href='/audit/'+auditToken+'/photos/upload'" 
                            class="bg-orange-600 hover:bg-orange-700 px-8 py-3 rounded-lg font-black">
                        <i class="fas fa-upload mr-2"></i>
                        UPLOADER DES PHOTOS
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Lightbox -->
        <div id="lightbox" class="lightbox">
            <button onclick="closeLightbox()" 
                    class="absolute top-6 right-6 bg-red-600 hover:bg-red-700 text-white rounded-full w-12 h-12 z-10">
                <i class="fas fa-times text-xl"></i>
            </button>
            <button onclick="previousPhoto()" 
                    class="absolute left-6 top-1/2 -translate-y-1/2 bg-gray-800 hover:bg-gray-700 text-white rounded-full w-12 h-12">
                <i class="fas fa-chevron-left text-xl"></i>
            </button>
            <button onclick="nextPhoto()" 
                    class="absolute right-6 top-1/2 -translate-y-1/2 bg-gray-800 hover:bg-gray-700 text-white rounded-full w-12 h-12">
                <i class="fas fa-chevron-right text-xl"></i>
            </button>
            <img id="lightbox-image" class="lightbox-image" src="" alt="Photo">
            <div class="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black bg-opacity-75 rounded-lg px-6 py-3">
                <p id="lightbox-caption" class="text-white font-bold"></p>
            </div>
        </div>
        
        <script>
            let auditToken = '';
            let allPhotos = [];
            let filteredPhotos = [];
            let currentPhotoIndex = 0;
            
            // ================================================================
            // INITIALISATION
            // ================================================================
            async function initPage() {
                // Extraire token depuis URL
                const pathParts = window.location.pathname.split('/');
                auditToken = pathParts[2];
                
                // Charger navigation modules
                await loadModuleNav();
                
                // Charger photos
                await loadPhotos();
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
            // CHARGEMENT PHOTOS
            // ================================================================
            async function loadPhotos() {
                try {
                    const response = await axios.get(\`/api/photos/list/\${auditToken}\`);
                    
                    if (response.data.success) {
                        allPhotos = response.data.data;
                        filteredPhotos = [...allPhotos];
                        
                        // Update stats
                        updateStats();
                        
                        // Populate filters
                        populateFilters();
                        
                        // Render gallery
                        renderGallery();
                    }
                } catch (error) {
                    console.error('Erreur chargement photos:', error);
                }
            }
            
            function updateStats() {
                document.getElementById('stat-total').textContent = allPhotos.length;
                document.getElementById('stat-el').textContent = allPhotos.filter(p => p.photo_type === 'EL').length;
                document.getElementById('stat-thermal').textContent = allPhotos.filter(p => p.photo_type === 'THERMAL').length;
                document.getElementById('stat-visual').textContent = allPhotos.filter(p => p.photo_type === 'VISUAL').length;
                document.getElementById('stat-iv').textContent = allPhotos.filter(p => p.photo_type === 'IV').length;
            }
            
            function populateFilters() {
                // Strings
                const strings = [...new Set(allPhotos.map(p => p.string_number).filter(Boolean))].sort((a, b) => a - b);
                const stringSelect = document.getElementById('filter-string');
                strings.forEach(s => {
                    const option = document.createElement('option');
                    option.value = s;
                    option.textContent = \`String \${s}\`;
                    stringSelect.appendChild(option);
                });
                
                // Modules
                const modules = [...new Set(allPhotos.map(p => p.module_number).filter(Boolean))].sort((a, b) => a - b);
                const moduleSelect = document.getElementById('filter-module');
                modules.forEach(m => {
                    const option = document.createElement('option');
                    option.value = m;
                    option.textContent = \`Module \${m}\`;
                    moduleSelect.appendChild(option);
                });
            }
            
            // ================================================================
            // FILTRES
            // ================================================================
            function applyFilters() {
                const typeFilter = document.getElementById('filter-type').value;
                const stringFilter = document.getElementById('filter-string').value;
                const moduleFilter = document.getElementById('filter-module').value;
                
                filteredPhotos = allPhotos.filter(photo => {
                    if (typeFilter && photo.photo_type !== typeFilter) return false;
                    if (stringFilter && photo.string_number != stringFilter) return false;
                    if (moduleFilter && photo.module_number != moduleFilter) return false;
                    return true;
                });
                
                renderGallery();
            }
            
            function resetFilters() {
                document.getElementById('filter-type').value = '';
                document.getElementById('filter-string').value = '';
                document.getElementById('filter-module').value = '';
                filteredPhotos = [...allPhotos];
                renderGallery();
            }
            
            // ================================================================
            // RENDER GALERIE
            // ================================================================
            function renderGallery() {
                const grid = document.getElementById('gallery-grid');
                const emptyState = document.getElementById('empty-state');
                
                if (filteredPhotos.length === 0) {
                    grid.innerHTML = '';
                    emptyState.classList.remove('hidden');
                    return;
                }
                
                emptyState.classList.add('hidden');
                
                grid.innerHTML = filteredPhotos.map((photo, index) => {
                    const badgeClass = \`badge-\${photo.photo_type.toLowerCase()}\`;
                    const location = photo.string_number && photo.module_number 
                        ? \`S\${photo.string_number}-\${photo.module_number}\`
                        : 'Position non définie';
                    
                    return \`
                        <div class="photo-card border-2 border-gray-700 hover:border-orange-400" onclick="openLightbox(\${index})">
                            <img src="\${photo.public_url}" alt="Photo \${photo.photo_type}" loading="lazy">
                            <div class="photo-overlay">
                                <span class="badge-type \${badgeClass}">\${photo.photo_type}</span>
                                <p class="text-white font-bold mt-2">\${location}</p>
                                <p class="text-gray-300 text-xs">\${formatFileSize(photo.file_size)}</p>
                            </div>
                        </div>
                    \`;
                }).join('');
            }
            
            // ================================================================
            // LIGHTBOX
            // ================================================================
            function openLightbox(index) {
                currentPhotoIndex = index;
                updateLightbox();
                document.getElementById('lightbox').classList.add('active');
                document.body.style.overflow = 'hidden';
            }
            
            function closeLightbox() {
                document.getElementById('lightbox').classList.remove('active');
                document.body.style.overflow = 'auto';
            }
            
            function previousPhoto() {
                currentPhotoIndex = (currentPhotoIndex - 1 + filteredPhotos.length) % filteredPhotos.length;
                updateLightbox();
            }
            
            function nextPhoto() {
                currentPhotoIndex = (currentPhotoIndex + 1) % filteredPhotos.length;
                updateLightbox();
            }
            
            function updateLightbox() {
                const photo = filteredPhotos[currentPhotoIndex];
                document.getElementById('lightbox-image').src = photo.public_url;
                
                const location = photo.string_number && photo.module_number 
                    ? \`S\${photo.string_number}-\${photo.module_number}\`
                    : 'Position non définie';
                document.getElementById('lightbox-caption').textContent = \`\${photo.photo_type} - \${location} (\${currentPhotoIndex + 1}/\${filteredPhotos.length})\`;
            }
            
            // Keyboard navigation
            document.addEventListener('keydown', (e) => {
                const lightbox = document.getElementById('lightbox');
                if (!lightbox.classList.contains('active')) return;
                
                if (e.key === 'Escape') closeLightbox();
                if (e.key === 'ArrowLeft') previousPhoto();
                if (e.key === 'ArrowRight') nextPhoto();
            });
            
            // ================================================================
            // UTILS
            // ================================================================
            function formatFileSize(bytes) {
                if (bytes < 1024) return bytes + ' B';
                if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
                return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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
