// ============================================================================
// MODE TERRAIN MOBILE - INTERFACE OPTIMISÉE SMARTPHONE
// ============================================================================
// Saisie rapide sur site : photos, géolocalisation, notes vocales
// Design mobile-first, grosses touches, contraste élevé
// ============================================================================

export function getMobileFieldModePage() {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <title>Mode Terrain - DiagPV</title>
        <link rel="manifest" href="/static/manifest.json">
        <link rel="icon" type="image/png" href="/static/icon-192.png">
        <link rel="apple-touch-icon" href="/static/icon-192.png">
        <meta name="theme-color" content="#fbbf24">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            /* Mobile-optimized styles */
            body {
                -webkit-tap-highlight-color: transparent;
                -webkit-touch-callout: none;
                -webkit-user-select: none;
                user-select: none;
                overscroll-behavior: none;
            }
            
            .mobile-touch-btn {
                min-height: 60px;
                font-size: 1.1rem;
                touch-action: manipulation;
            }
            
            .mobile-input {
                font-size: 16px; /* Prevent zoom on iOS */
                min-height: 50px;
            }
            
            .fab-button {
                position: fixed;
                bottom: 80px;
                right: 20px;
                width: 70px;
                height: 70px;
                border-radius: 50%;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                z-index: 1000;
            }
            
            .bottom-nav {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                height: 70px;
                background: linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0.9));
                backdrop-filter: blur(10px);
                border-top: 2px solid #fbbf24;
                z-index: 999;
            }
            
            .online-indicator {
                display: inline-block;
                width: 10px;
                height: 10px;
                border-radius: 50%;
                margin-right: 8px;
            }
            
            .online { background: #10b981; }
            .offline { background: #ef4444; }
            
            @keyframes pulse-online {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
            
            .pulse { animation: pulse-online 2s infinite; }
        </style>
    </head>
    <body class="bg-black text-white pb-24">
        <!-- Header Mobile -->
        <header class="bg-gradient-to-b from-gray-900 to-black p-4 sticky top-0 z-50 border-b-2 border-yellow-400">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <i class="fas fa-mobile-alt text-3xl text-yellow-400"></i>
                    <div>
                        <h1 class="text-xl font-black">MODE TERRAIN</h1>
                        <p class="text-xs text-gray-400" id="current-audit">Aucun audit actif</p>
                    </div>
                </div>
                <div class="text-right">
                    <div class="flex items-center gap-2 mb-1">
                        <span class="online-indicator pulse online" id="online-status"></span>
                        <span class="text-xs font-bold text-green-400" id="connection-text">CONNECTÉ</span>
                    </div>
                    <div class="text-xs text-gray-400">
                        <i class="fas fa-battery-three-quarters text-green-400"></i>
                        <span id="battery-level">--</span>%
                    </div>
                </div>
            </div>
        </header>

        <!-- Sélection Audit -->
        <div class="p-4" id="audit-selector">
            <div class="bg-gray-900 rounded-lg p-4 border-2 border-yellow-400 mb-4">
                <label class="block font-bold mb-3 text-yellow-400">
                    <i class="fas fa-clipboard-check mr-2"></i>
                    SÉLECTIONNER UN AUDIT
                </label>
                <select id="select-audit" class="w-full bg-black border-2 border-gray-600 rounded-lg px-4 py-3 mobile-input font-bold">
                    <option value="">-- Choisir un audit --</option>
                </select>
            </div>
        </div>

        <!-- Actions Rapides (masqué tant qu'aucun audit sélectionné) -->
        <div id="quick-actions" class="hidden">
            <!-- Module actif -->
            <div class="bg-gradient-to-br from-purple-900 to-purple-700 p-4 mb-2">
                <div class="flex items-center justify-between">
                    <span class="font-bold">Module actif :</span>
                    <select id="active-module" class="bg-black border-2 border-purple-400 rounded px-3 py-2 font-bold">
                        <option value="EL">EL Cartographie</option>
                        <option value="IV">Courbes I-V</option>
                        <option value="VISUAL">Inspections Visuelles</option>
                        <option value="ISOLATION">Tests Isolation</option>
                    </select>
                </div>
            </div>

            <!-- Stats Mini -->
            <div class="grid grid-cols-3 gap-2 px-4 mb-6">
                <div class="bg-gradient-to-br from-green-900 to-green-700 rounded-lg p-3 text-center border border-green-400">
                    <p class="text-2xl font-black" id="stat-observations">0</p>
                    <p class="text-xs text-green-200">Observations</p>
                </div>
                <div class="bg-gradient-to-br from-blue-900 to-blue-700 rounded-lg p-3 text-center border border-blue-400">
                    <p class="text-2xl font-black" id="stat-photos">0</p>
                    <p class="text-xs text-blue-200">Photos</p>
                </div>
                <div class="bg-gradient-to-br from-orange-900 to-orange-700 rounded-lg p-3 text-center border border-orange-400">
                    <p class="text-2xl font-black" id="stat-defects">0</p>
                    <p class="text-xs text-orange-200">Défauts</p>
                </div>
            </div>

            <!-- Boutons Actions Principales -->
            <div class="px-4 space-y-3">
                <!-- Photo avec Camera -->
                <button id="btn-capture-photo" class="mobile-touch-btn w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 rounded-xl font-black shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-3">
                    <i class="fas fa-camera text-2xl"></i>
                    <span class="text-lg">PRENDRE PHOTO</span>
                </button>

                <!-- Nouvelle Observation -->
                <button id="btn-new-observation" class="mobile-touch-btn w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 rounded-xl font-black shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-3">
                    <i class="fas fa-plus-circle text-2xl"></i>
                    <span class="text-lg">OBSERVATION RAPIDE</span>
                </button>

                <!-- Géolocalisation -->
                <button id="btn-geolocation" class="mobile-touch-btn w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 rounded-xl font-black shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-3">
                    <i class="fas fa-map-marker-alt text-2xl"></i>
                    <span class="text-lg">POSITION GPS</span>
                    <span class="text-xs bg-black bg-opacity-30 px-2 py-1 rounded" id="gps-status">Non activé</span>
                </button>

                <!-- Scan QR Code -->
                <button id="btn-scan-qr" class="mobile-touch-btn w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 rounded-xl font-black shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-3">
                    <i class="fas fa-qrcode text-2xl"></i>
                    <span class="text-lg">SCANNER MODULE</span>
                </button>

                <!-- Notes Vocales -->
                <button id="btn-voice-note" class="mobile-touch-btn w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 rounded-xl font-black shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-3">
                    <i class="fas fa-microphone text-2xl"></i>
                    <span class="text-lg">NOTE VOCALE</span>
                    <span class="text-xs bg-black bg-opacity-30 px-2 py-1 rounded" id="voice-status">Prêt</span>
                </button>
            </div>

            <!-- Dernières Observations -->
            <div class="mt-6 px-4">
                <h3 class="text-lg font-black mb-3 flex items-center gap-2">
                    <i class="fas fa-history text-yellow-400"></i>
                    DERNIÈRES SAISIES
                </h3>
                <div id="recent-observations" class="space-y-2">
                    <p class="text-center text-gray-500 py-8 text-sm">Aucune observation récente</p>
                </div>
            </div>
        </div>

        <!-- FAB Sync Button -->
        <button id="fab-sync" class="fab-button bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-xl hidden">
            <i class="fas fa-sync-alt text-2xl text-white"></i>
        </button>

        <!-- Bottom Navigation -->
        <nav class="bottom-nav">
            <div class="flex items-center justify-around h-full px-2">
                <a href="/crm/dashboard" class="flex flex-col items-center gap-1 text-gray-400 hover:text-yellow-400 transition-colors">
                    <i class="fas fa-home text-xl"></i>
                    <span class="text-xs font-bold">Accueil</span>
                </a>
                <a href="#" class="flex flex-col items-center gap-1 text-yellow-400">
                    <i class="fas fa-mobile-alt text-xl"></i>
                    <span class="text-xs font-bold">Terrain</span>
                </a>
                <button id="btn-offline-data" class="flex flex-col items-center gap-1 text-gray-400 hover:text-yellow-400 transition-colors">
                    <i class="fas fa-database text-xl"></i>
                    <span class="text-xs font-bold">Offline</span>
                    <span class="text-xs bg-red-600 px-2 rounded-full hidden" id="offline-count">0</span>
                </button>
                <a href="/planning" class="flex flex-col items-center gap-1 text-gray-400 hover:text-yellow-400 transition-colors">
                    <i class="fas fa-calendar text-xl"></i>
                    <span class="text-xs font-bold">Planning</span>
                </a>
            </div>
        </nav>

        <!-- Modal Capture Photo -->
        <div id="modal-photo" class="fixed inset-0 bg-black bg-opacity-95 hidden z-[9999] flex items-center justify-center">
            <div class="w-full h-full flex flex-col">
                <div class="flex items-center justify-between p-4 bg-gray-900">
                    <h3 class="text-xl font-black">CAPTURE PHOTO</h3>
                    <button id="close-photo-modal" class="text-3xl">&times;</button>
                </div>
                
                <div class="flex-1 relative bg-black">
                    <video id="camera-stream" class="w-full h-full object-cover" autoplay playsinline></video>
                    <canvas id="photo-canvas" class="hidden"></canvas>
                    <img id="photo-preview" class="w-full h-full object-contain hidden">
                </div>
                
                <div class="p-4 bg-gray-900 space-y-3">
                    <button id="btn-take-photo" class="mobile-touch-btn w-full bg-blue-600 hover:bg-blue-700 rounded-xl font-black">
                        <i class="fas fa-camera mr-2"></i>CAPTURER
                    </button>
                    <div id="photo-actions" class="hidden space-y-2">
                        <input type="text" id="photo-description" placeholder="Description photo..." 
                               class="w-full bg-black border-2 border-gray-600 rounded-lg px-4 py-3 mobile-input">
                        <div class="grid grid-cols-2 gap-2">
                            <button id="btn-save-photo" class="mobile-touch-btn bg-green-600 hover:bg-green-700 rounded-lg font-bold">
                                <i class="fas fa-save mr-2"></i>ENREGISTRER
                            </button>
                            <button id="btn-retake-photo" class="mobile-touch-btn bg-yellow-600 hover:bg-yellow-700 rounded-lg font-bold">
                                <i class="fas fa-redo mr-2"></i>REPRENDRE
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal Observation Rapide -->
        <div id="modal-observation" class="fixed inset-0 bg-black bg-opacity-95 hidden z-[9999] overflow-y-auto">
            <div class="min-h-screen p-4 pb-24">
                <div class="bg-gray-900 rounded-lg border-2 border-green-400">
                    <div class="flex items-center justify-between p-4 border-b border-gray-700">
                        <h3 class="text-xl font-black text-green-400">OBSERVATION RAPIDE</h3>
                        <button id="close-observation-modal" class="text-3xl">&times;</button>
                    </div>
                    
                    <form id="quick-observation-form" class="p-4 space-y-4">
                        <div>
                            <label class="block font-bold mb-2">Type :</label>
                            <select id="obs-type" class="w-full bg-black border-2 border-gray-600 rounded-lg px-4 py-3 mobile-input font-bold">
                                <option value="defect">Défaut détecté</option>
                                <option value="ok">Conforme</option>
                                <option value="note">Note simple</option>
                            </select>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block font-bold mb-2">String :</label>
                                <input type="number" id="obs-string" class="w-full bg-black border-2 border-gray-600 rounded-lg px-4 py-3 mobile-input font-bold">
                            </div>
                            <div>
                                <label class="block font-bold mb-2">Module :</label>
                                <input type="number" id="obs-module" class="w-full bg-black border-2 border-gray-600 rounded-lg px-4 py-3 mobile-input font-bold">
                            </div>
                        </div>
                        
                        <div>
                            <label class="block font-bold mb-2">Description :</label>
                            <textarea id="obs-description" rows="3" 
                                      class="w-full bg-black border-2 border-gray-600 rounded-lg px-4 py-3 mobile-input"></textarea>
                        </div>
                        
                        <div id="obs-defect-details" class="hidden space-y-3 bg-red-900 bg-opacity-20 p-3 rounded-lg border border-red-400">
                            <div>
                                <label class="block font-bold mb-2 text-red-400">Gravité :</label>
                                <select id="obs-severity" class="w-full bg-black border-2 border-red-600 rounded-lg px-4 py-3 mobile-input font-bold">
                                    <option value="1">1 - Mineur</option>
                                    <option value="2">2 - Modéré</option>
                                    <option value="3">3 - Sérieux</option>
                                    <option value="4">4 - Critique</option>
                                    <option value="5">5 - Urgent</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="bg-purple-900 bg-opacity-20 p-3 rounded-lg border border-purple-400">
                            <div class="flex items-center justify-between mb-2">
                                <span class="font-bold text-purple-400">Position GPS :</span>
                                <button type="button" id="btn-get-gps" class="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded font-bold text-sm">
                                    <i class="fas fa-crosshairs mr-1"></i>Obtenir
                                </button>
                            </div>
                            <p class="text-xs text-gray-400" id="gps-coords">Non défini</p>
                        </div>
                        
                        <button type="submit" class="mobile-touch-btn w-full bg-green-600 hover:bg-green-700 rounded-xl font-black">
                            <i class="fas fa-check-circle mr-2"></i>ENREGISTRER OBSERVATION
                        </button>
                    </form>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            // IndexedDB Helper
            function openDB() {
                return new Promise((resolve, reject) => {
                    const request = indexedDB.open('diagpv-db', 1)
                    request.onupgradeneeded = (event) => {
                        const db = event.target.result
                        if (!db.objectStoreNames.contains('uploadQueue')) {
                            db.createObjectStore('uploadQueue', { keyPath: 'id', autoIncrement: true })
                        }
                    }
                    request.onsuccess = () => resolve(request.result)
                    request.onerror = () => reject(request.error)
                })
            }

            async function saveToQueue(data) {
                const db = await openDB()
                return new Promise((resolve, reject) => {
                    const tx = db.transaction('uploadQueue', 'readwrite')
                    const store = tx.objectStore('uploadQueue')
                    const request = store.add({ data: data, timestamp: Date.now() })
                    request.onsuccess = () => resolve(request.result)
                    request.onerror = () => reject(request.error)
                })
            }

            let currentAudit = null
            let currentModule = 'EL'
            let currentPosition = null
            let cameraStream = null
            let offlineObservations = []
            
            // Détecter connexion online/offline
            function updateOnlineStatus() {
                const isOnline = navigator.onLine
                const statusEl = document.getElementById('online-status')
                const textEl = document.getElementById('connection-text')
                
                if (isOnline) {
                    statusEl.classList.remove('offline')
                    statusEl.classList.add('online', 'pulse')
                    textEl.textContent = 'CONNECTÉ'
                    textEl.className = 'text-xs font-bold text-green-400'
                } else {
                    statusEl.classList.remove('online', 'pulse')
                    statusEl.classList.add('offline')
                    textEl.textContent = 'HORS LIGNE'
                    textEl.className = 'text-xs font-bold text-red-400'
                }
            }
            
            window.addEventListener('online', updateOnlineStatus)
            window.addEventListener('offline', updateOnlineStatus)
            updateOnlineStatus()
            
            // Battery status
            if ('getBattery' in navigator) {
                navigator.getBattery().then(battery => {
                    const updateBattery = () => {
                        document.getElementById('battery-level').textContent = Math.round(battery.level * 100)
                    }
                    updateBattery()
                    battery.addEventListener('levelchange', updateBattery)
                })
            }
            
            // Charger audits
            async function loadAudits() {
                try {
                    const response = await axios.get('/api/audits/list')
                    const audits = response.data.audits.filter(a => a.status === 'en_cours')
                    
                    const select = document.getElementById('select-audit')
                    select.innerHTML = '<option value="">-- Choisir un audit --</option>' +
                        audits.map(a => \`<option value="\${a.audit_token}">\${a.project_name} - \${a.client_name}</option>\`).join('')
                } catch (error) {
                    console.error('Load audits error:', error)
                }
            }
            
            // Sélection audit
            document.getElementById('select-audit').addEventListener('change', (e) => {
                const token = e.target.value
                if (token) {
                    currentAudit = token
                    document.getElementById('current-audit').textContent = e.target.selectedOptions[0].textContent
                    document.getElementById('quick-actions').classList.remove('hidden')
                    document.getElementById('fab-sync').classList.remove('hidden')
                    loadStats()
                } else {
                    document.getElementById('quick-actions').classList.add('hidden')
                    document.getElementById('fab-sync').classList.add('hidden')
                }
            })
            
            // Module change
            document.getElementById('active-module').addEventListener('change', (e) => {
                currentModule = e.target.value
            })
            
            // Stats
            async function loadStats() {
                // TODO: Charger vraies stats
                document.getElementById('stat-observations').textContent = '12'
                document.getElementById('stat-photos').textContent = '8'
                document.getElementById('stat-defects').textContent = '3'
            }
            
            // Photo capture
            document.getElementById('btn-capture-photo').addEventListener('click', () => {
                document.getElementById('modal-photo').classList.remove('hidden')
                startCamera()
            })
            
            document.getElementById('close-photo-modal').addEventListener('click', () => {
                stopCamera()
                document.getElementById('modal-photo').classList.add('hidden')
            })
            
            async function startCamera() {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({
                        video: { facingMode: 'environment', width: 1920, height: 1080 }
                    })
                    cameraStream = stream
                    document.getElementById('camera-stream').srcObject = stream
                } catch (error) {
                    alert('Erreur caméra: ' + error.message)
                }
            }
            
            function stopCamera() {
                if (cameraStream) {
                    cameraStream.getTracks().forEach(track => track.stop())
                    cameraStream = null
                }
            }
            
            document.getElementById('btn-take-photo').addEventListener('click', () => {
                const video = document.getElementById('camera-stream')
                const canvas = document.getElementById('photo-canvas')
                const preview = document.getElementById('photo-preview')
                
                canvas.width = video.videoWidth
                canvas.height = video.videoHeight
                canvas.getContext('2d').drawImage(video, 0, 0)
                
                const photoData = canvas.toDataURL('image/jpeg', 0.8)
                preview.src = photoData
                
                video.classList.add('hidden')
                preview.classList.remove('hidden')
                document.getElementById('btn-take-photo').classList.add('hidden')
                document.getElementById('photo-actions').classList.remove('hidden')
                
                stopCamera()
            })
            
            document.getElementById('btn-retake-photo').addEventListener('click', () => {
                const video = document.getElementById('camera-stream')
                const preview = document.getElementById('photo-preview')
                
                preview.classList.add('hidden')
                video.classList.remove('hidden')
                document.getElementById('btn-take-photo').classList.remove('hidden')
                document.getElementById('photo-actions').classList.add('hidden')
                
                startCamera()
            })
            
            document.getElementById('btn-save-photo').addEventListener('click', async () => {
                const description = document.getElementById('photo-description').value
                const preview = document.getElementById('photo-preview')
                const photoData = preview.src // Base64 data URL
                
                if (!currentAudit) {
                    alert('Erreur: Aucun audit sélectionné')
                    return
                }
                
                // Afficher loading
                const btn = document.getElementById('btn-save-photo')
                const originalText = btn.innerHTML
                btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Upload...'
                btn.disabled = true
                
                try {
                    // Upload photo to server
                    const uploadData = {
                        audit_token: currentAudit,
                        module_type: currentModule,
                        photo_data: photoData,
                        description: description,
                        latitude: currentPosition?.lat || null,
                        longitude: currentPosition?.lng || null,
                        accuracy: currentPosition?.accuracy || null
                    }
                    
                    const response = await axios.post('/api/photos/upload', uploadData)
                    
                    if (response.data.success) {
                        alert(\`✅ Photo enregistrée! (ID: \${response.data.photo_id}, Taille: \${Math.round(response.data.size / 1024)}KB)\`)
                        
                        // Incrémenter compteur photos
                        const currentCount = parseInt(document.getElementById('stat-photos').textContent) || 0
                        document.getElementById('stat-photos').textContent = currentCount + 1
                    } else {
                        throw new Error(response.data.error || 'Upload failed')
                    }
                    
                } catch (error) {
                    console.error('Upload error:', error)
                    alert('❌ Erreur upload: ' + (error.response?.data?.error || error.message))
                } finally {
                    btn.innerHTML = originalText
                    btn.disabled = false
                }
                
                // Reset modal
                document.getElementById('modal-photo').classList.add('hidden')
                document.getElementById('photo-description').value = ''
                preview.classList.add('hidden')
                document.getElementById('camera-stream').classList.remove('hidden')
                document.getElementById('btn-take-photo').classList.remove('hidden')
                document.getElementById('photo-actions').classList.add('hidden')
            })
            
            // Observation rapide
            document.getElementById('btn-new-observation').addEventListener('click', () => {
                document.getElementById('modal-observation').classList.remove('hidden')
                
                // Pré-remplir avec données QR si disponibles
                if (window.lastQRScan) {
                    document.getElementById('obs-string').value = window.lastQRScan.string
                    document.getElementById('obs-module').value = window.lastQRScan.module
                    
                    // Flash yellow pour indiquer pré-remplissage
                    const stringInput = document.getElementById('obs-string')
                    const moduleInput = document.getElementById('obs-module')
                    stringInput.classList.add('border-yellow-400')
                    moduleInput.classList.add('border-yellow-400')
                    
                    setTimeout(() => {
                        stringInput.classList.remove('border-yellow-400')
                        moduleInput.classList.remove('border-yellow-400')
                    }, 2000)
                    
                    // Effacer après utilisation
                    delete window.lastQRScan
                }
            })
            
            document.getElementById('close-observation-modal').addEventListener('click', () => {
                document.getElementById('modal-observation').classList.add('hidden')
            })
            
            document.getElementById('obs-type').addEventListener('change', (e) => {
                const details = document.getElementById('obs-defect-details')
                if (e.target.value === 'defect') {
                    details.classList.remove('hidden')
                } else {
                    details.classList.add('hidden')
                }
            })
            
            // Géolocalisation
            document.getElementById('btn-get-gps').addEventListener('click', () => {
                if ('geolocation' in navigator) {
                    document.getElementById('btn-get-gps').innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>GPS...'
                    
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            currentPosition = {
                                lat: position.coords.latitude,
                                lng: position.coords.longitude,
                                accuracy: position.coords.accuracy
                            }
                            document.getElementById('gps-coords').textContent = 
                                \`Lat: \${currentPosition.lat.toFixed(6)}, Lng: \${currentPosition.lng.toFixed(6)} (±\${Math.round(currentPosition.accuracy)}m)\`
                            document.getElementById('btn-get-gps').innerHTML = '<i class="fas fa-check mr-1"></i>OK'
                            setTimeout(() => {
                                document.getElementById('btn-get-gps').innerHTML = '<i class="fas fa-crosshairs mr-1"></i>Obtenir'
                            }, 2000)
                        },
                        (error) => {
                            alert('Erreur GPS: ' + error.message)
                            document.getElementById('btn-get-gps').innerHTML = '<i class="fas fa-crosshairs mr-1"></i>Obtenir'
                        },
                        { enableHighAccuracy: true, timeout: 10000 }
                    )
                } else {
                    alert('Géolocalisation non disponible')
                }
            })
            
            document.getElementById('btn-geolocation').addEventListener('click', () => {
                document.getElementById('btn-get-gps').click()
            })
            
            // Submit observation
            document.getElementById('quick-observation-form').addEventListener('submit', async (e) => {
                e.preventDefault()
                
                const observation = {
                    audit_token: currentAudit,
                    module_type: currentModule,
                    observation_type: document.getElementById('obs-type').value,
                    string_number: parseInt(document.getElementById('obs-string').value) || null,
                    module_number: parseInt(document.getElementById('obs-module').value) || null,
                    description: document.getElementById('obs-description').value,
                    severity_level: document.getElementById('obs-type').value === 'defect' ? parseInt(document.getElementById('obs-severity').value) : null,
                    latitude: currentPosition?.lat || null,
                    longitude: currentPosition?.lng || null,
                    gps_accuracy: currentPosition?.accuracy || null,
                    timestamp: new Date().toISOString()
                }
                
                // Si offline, sauvegarder localement
                if (!navigator.onLine) {
                    offlineObservations.push(observation)
                    localStorage.setItem('offlineObservations', JSON.stringify(offlineObservations))
                    document.getElementById('offline-count').textContent = offlineObservations.length
                    document.getElementById('offline-count').classList.remove('hidden')
                    alert('✅ Observation sauvegardée en local (mode hors ligne)')
                    
                    // Incrémenter compteur local
                    const currentCount = parseInt(document.getElementById('stat-observations').textContent) || 0
                    document.getElementById('stat-observations').textContent = currentCount + 1
                } else {
                    // Sinon envoyer au serveur selon le module
                    try {
                        let apiEndpoint = ''
                        let apiData = {}
                        
                        // Router vers la bonne API selon le module
                        switch(currentModule) {
                            case 'VISUAL':
                                apiEndpoint = \`/api/visual/inspections/\${currentAudit}\`
                                apiData = {
                                    inspection_type: observation.observation_type,
                                    component: 'Module',
                                    severity: observation.severity_level || 1,
                                    description: observation.description,
                                    location: \`String \${observation.string_number || '?'}, Module \${observation.module_number || '?'}\`,
                                    latitude: observation.latitude,
                                    longitude: observation.longitude
                                }
                                break
                            case 'ISOLATION':
                                // TODO: API isolation
                                apiEndpoint = \`/api/isolation/tests/\${currentAudit}\`
                                apiData = observation
                                break
                            case 'EL':
                            case 'IV':
                            default:
                                // Pour EL et IV, log simplement pour l'instant
                                console.log('Observation:', observation)
                                alert('✅ Observation enregistrée en local (API ' + currentModule + ' à implémenter)')
                                break
                        }
                        
                        if (apiEndpoint && currentModule === 'VISUAL') {
                            await axios.post(apiEndpoint, apiData)
                            alert('✅ Observation enregistrée sur le serveur!')
                            
                            // Incrémenter compteur
                            const currentCount = parseInt(document.getElementById('stat-observations').textContent) || 0
                            document.getElementById('stat-observations').textContent = currentCount + 1
                            
                            if (observation.observation_type === 'defect') {
                                const defectsCount = parseInt(document.getElementById('stat-defects').textContent) || 0
                                document.getElementById('stat-defects').textContent = defectsCount + 1
                            }
                        }
                    } catch (error) {
                        console.error('API error:', error)
                        alert('❌ Erreur serveur: ' + (error.response?.data?.error || error.message))
                    }
                }
                
                document.getElementById('modal-observation').classList.add('hidden')
                document.getElementById('quick-observation-form').reset()
                currentPosition = null
                document.getElementById('gps-coords').textContent = 'Non défini'
                document.getElementById('obs-defect-details').classList.add('hidden')
            })
            
            // ===================================================================
            // QR SCANNER
            // ===================================================================
            let qrScannerActive = false
            let qrScanInterval = null
            
            document.getElementById('btn-scan-qr').addEventListener('click', () => {
                // Créer modal QR scanner dynamiquement
                const modal = document.createElement('div')
                modal.id = 'modal-qr-scanner'
                modal.className = 'fixed inset-0 bg-black bg-opacity-95 z-[9999] flex flex-col'
                modal.innerHTML = \`
                    <div class="flex items-center justify-between p-4 bg-gray-900">
                        <h3 class="text-xl font-black text-yellow-400">
                            <i class="fas fa-qrcode mr-2"></i>SCANNER QR CODE
                        </h3>
                        <button id="close-qr-modal" class="text-3xl">&times;</button>
                    </div>
                    
                    <div class="flex-1 relative bg-black flex items-center justify-center">
                        <video id="qr-video" class="w-full h-full object-cover" autoplay playsinline></video>
                        <canvas id="qr-canvas" class="hidden"></canvas>
                        
                        <!-- Overlay scan guide -->
                        <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div class="w-64 h-64 border-4 border-yellow-400 rounded-lg relative">
                                <div class="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-yellow-400 rounded-tl-lg"></div>
                                <div class="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-yellow-400 rounded-tr-lg"></div>
                                <div class="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-yellow-400 rounded-bl-lg"></div>
                                <div class="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-yellow-400 rounded-br-lg"></div>
                            </div>
                        </div>
                        
                        <div id="qr-status" class="absolute bottom-4 left-0 right-0 text-center text-white font-bold bg-black bg-opacity-70 py-3">
                            Positionnez le QR code dans le cadre...
                        </div>
                    </div>
                    
                    <div class="p-4 bg-gray-900">
                        <div class="bg-gray-800 rounded-lg p-3 mb-3 hidden" id="qr-result-box">
                            <p class="text-xs text-gray-400 mb-1">QR Code détecté:</p>
                            <p id="qr-result-text" class="font-mono text-sm text-yellow-400"></p>
                        </div>
                        <button id="btn-use-qr" class="mobile-touch-btn w-full bg-green-600 hover:bg-green-700 rounded-xl font-black hidden">
                            <i class="fas fa-check mr-2"></i>UTILISER CE CODE
                        </button>
                    </div>
                \`
                document.body.appendChild(modal)
                
                // Start QR scanner
                startQRScanner()
                
                // Close button
                document.getElementById('close-qr-modal').addEventListener('click', () => {
                    stopQRScanner()
                    modal.remove()
                })
                
                // Use QR button
                document.getElementById('btn-use-qr').addEventListener('click', () => {
                    const qrData = document.getElementById('qr-result-text').textContent
                    processQRCode(qrData)
                    stopQRScanner()
                    modal.remove()
                })
            })
            
            async function startQRScanner() {
                try {
                    const video = document.getElementById('qr-video')
                    const canvas = document.getElementById('qr-canvas')
                    const ctx = canvas.getContext('2d')
                    
                    const stream = await navigator.mediaDevices.getUserMedia({
                        video: { facingMode: 'environment' }
                    })
                    
                    video.srcObject = stream
                    qrScannerActive = true
                    
                    // Scanner loop with jsQR (we'll use manual detection)
                    qrScanInterval = setInterval(() => {
                        if (!qrScannerActive) return
                        
                        canvas.width = video.videoWidth
                        canvas.height = video.videoHeight
                        
                        if (canvas.width === 0) return
                        
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
                        
                        // Détection QR basique (regex patterns)
                        // Pour une vraie détection, il faudrait jsQR library
                        // Ici on simule avec pattern matching simple
                        detectQRPattern(canvas)
                    }, 500)
                    
                } catch (error) {
                    console.error('QR Scanner error:', error)
                    document.getElementById('qr-status').textContent = 'Erreur: ' + error.message
                }
            }
            
            function stopQRScanner() {
                qrScannerActive = false
                if (qrScanInterval) {
                    clearInterval(qrScanInterval)
                    qrScanInterval = null
                }
                
                const video = document.getElementById('qr-video')
                if (video && video.srcObject) {
                    video.srcObject.getTracks().forEach(track => track.stop())
                }
            }
            
            // Détection QR basique (sans librairie externe pour l'instant)
            // Dans une vraie implémentation, utiliser jsQR
            function detectQRPattern(canvas) {
                // Pour l'instant, on va simuler avec un timeout
                // Une vraie implémentation nécessiterait jsQR ou zxing
                
                // Simulation: générer un faux QR code après 3 secondes
                // Dans la vraie vie, jsQR.scan(imageData) détecterait le code
            }
            
            // Process QR code data
            function processQRCode(qrData) {
                console.log('QR Code scanned:', qrData)
                
                // Pattern attendu: "STRING:5-MODULE:12" ou "S5-M12"
                let stringNum = null
                let moduleNum = null
                
                // Try different patterns
                const pattern1 = /STRING:(\d+)-MODULE:(\d+)/i
                const pattern2 = /S(\d+)-M(\d+)/i
                const pattern3 = /(\d+)-(\d+)/ // Simple: "5-12"
                
                let match = qrData.match(pattern1) || qrData.match(pattern2) || qrData.match(pattern3)
                
                if (match) {
                    stringNum = parseInt(match[1])
                    moduleNum = parseInt(match[2])
                    
                    alert(\`✅ QR Code détecté!\\n\\nString: \${stringNum}\\nModule: \${moduleNum}\\n\\nOuvrez une observation pour l'utiliser.\`)
                    
                    // TODO: Stocker temporairement pour pré-remplir le prochain formulaire
                    window.lastQRScan = { string: stringNum, module: moduleNum }
                } else {
                    alert('⚠️ Format QR non reconnu:\\n\\n' + qrData + '\\n\\nFormats acceptés:\\n- STRING:5-MODULE:12\\n- S5-M12\\n- 5-12')
                }
            }
            
            // Ajout bouton demo QR
            setTimeout(() => {
                if (document.getElementById('btn-scan-qr')) {
                    const demoBtn = document.createElement('button')
                    demoBtn.textContent = '🧪 DEMO QR'
                    demoBtn.className = 'text-xs bg-purple-900 px-2 py-1 rounded ml-2'
                    demoBtn.onclick = () => {
                        const demoQR = 'STRING:3-MODULE:42'
                        processQRCode(demoQR)
                    }
                    document.getElementById('btn-scan-qr').appendChild(demoBtn)
                }
            }, 1000)
            
            // ===================================================================
            // VOICE NOTE - WEB SPEECH API
            // ===================================================================
            let recognition = null
            let isRecording = false
            
            // Vérifier support Web Speech API
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
            
            if (SpeechRecognition) {
                recognition = new SpeechRecognition()
                recognition.lang = 'fr-FR'
                recognition.continuous = false
                recognition.interimResults = true
                recognition.maxAlternatives = 1
                
                recognition.onstart = () => {
                    isRecording = true
                    document.getElementById('voice-status').textContent = '🔴 Enregistrement...'
                    document.getElementById('voice-status').classList.add('animate-pulse')
                    document.getElementById('btn-voice-note').classList.add('bg-red-700', 'ring-4', 'ring-red-300')
                }
                
                recognition.onresult = (event) => {
                    const transcript = Array.from(event.results)
                        .map(result => result[0])
                        .map(result => result.transcript)
                        .join('')
                    
                    console.log('Voice transcript:', transcript)
                    
                    // Ouvrir modal observation avec transcription
                    document.getElementById('modal-observation').classList.remove('hidden')
                    document.getElementById('obs-description').value = transcript
                    document.getElementById('obs-description').focus()
                }
                
                recognition.onerror = (event) => {
                    console.error('Speech recognition error:', event.error)
                    let errorMsg = 'Erreur'
                    
                    switch(event.error) {
                        case 'no-speech':
                            errorMsg = 'Aucune voix détectée'
                            break
                        case 'audio-capture':
                            errorMsg = 'Micro non disponible'
                            break
                        case 'not-allowed':
                            errorMsg = 'Permission micro refusée'
                            break
                        default:
                            errorMsg = event.error
                    }
                    
                    alert('❌ ' + errorMsg)
                    document.getElementById('voice-status').textContent = errorMsg
                    resetVoiceButton()
                }
                
                recognition.onend = () => {
                    resetVoiceButton()
                }
            }
            
            function resetVoiceButton() {
                isRecording = false
                document.getElementById('voice-status').textContent = 'Prêt'
                document.getElementById('voice-status').classList.remove('animate-pulse')
                document.getElementById('btn-voice-note').classList.remove('bg-red-700', 'ring-4', 'ring-red-300')
            }
            
            document.getElementById('btn-voice-note').addEventListener('click', () => {
                if (!SpeechRecognition) {
                    alert('❌ Reconnaissance vocale non supportée sur ce navigateur.\\n\\nEssayez Chrome ou Safari.')
                    return
                }
                
                if (isRecording) {
                    // Stop recording
                    recognition.stop()
                    resetVoiceButton()
                } else {
                    // Start recording
                    try {
                        recognition.start()
                    } catch (error) {
                        console.error('Recognition start error:', error)
                        alert('Erreur démarrage micro: ' + error.message)
                    }
                }
            })
            
            // Sync offline data
            document.getElementById('fab-sync').addEventListener('click', async () => {
                if (offlineObservations.length === 0) {
                    alert('Aucune donnée à synchroniser')
                    return
                }
                
                if (!navigator.onLine) {
                    alert('Vous êtes hors ligne. Synchronisation impossible.')
                    return
                }
                
                // TODO: Sync with server
                alert(\`🔄 Synchronisation de \${offlineObservations.length} observations...\`)
                offlineObservations = []
                localStorage.removeItem('offlineObservations')
                document.getElementById('offline-count').classList.add('hidden')
            })
            
            // Charger données offline au démarrage
            const savedOffline = localStorage.getItem('offlineObservations')
            if (savedOffline) {
                offlineObservations = JSON.parse(savedOffline)
                if (offlineObservations.length > 0) {
                    document.getElementById('offline-count').textContent = offlineObservations.length
                    document.getElementById('offline-count').classList.remove('hidden')
                }
            }
            
            // Init
            loadAudits()
            
            // ===================================================================
            // PWA - SERVICE WORKER REGISTRATION
            // ===================================================================
            if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                    navigator.serviceWorker.register('/static/sw.js')
                        .then(registration => {
                            console.log('✅ SW registered:', registration.scope)
                            
                            // Vérifier les updates toutes les heures
                            setInterval(() => {
                                registration.update()
                            }, 3600000)
                            
                            // Background Sync pour synchronisation offline
                            if ('sync' in registration) {
                                console.log('✅ Background Sync supported')
                            }
                        })
                        .catch(error => {
                            console.error('❌ SW registration failed:', error)
                        })
                })
                
                // Détecter quand une nouvelle version est disponible
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                    console.log('🔄 New version detected, reloading...')
                    if (confirm('Une nouvelle version est disponible. Recharger ?')) {
                        window.location.reload()
                    }
                })
            }
            
            // ===================================================================
            // PWA - INSTALL PROMPT
            // ===================================================================
            let deferredPrompt
            
            window.addEventListener('beforeinstallprompt', (e) => {
                // Empêcher l'affichage automatique
                e.preventDefault()
                deferredPrompt = e
                
                // Afficher un bouton d'installation personnalisé
                console.log('💾 PWA installation available')
                
                // Créer et afficher le bouton d'installation
                const installBtn = document.createElement('button')
                installBtn.innerHTML = '<i class="fas fa-download mr-2"></i>INSTALLER L\'APP'
                installBtn.className = 'mobile-touch-btn w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 rounded-xl font-black shadow-lg mb-3 px-4'
                
                const actionsContainer = document.querySelector('#quick-actions .px-4')
                if (actionsContainer) {
                    actionsContainer.insertBefore(installBtn, actionsContainer.firstChild)
                }
                
                installBtn.addEventListener('click', async () => {
                    if (!deferredPrompt) return
                    
                    deferredPrompt.prompt()
                    const { outcome } = await deferredPrompt.userChoice
                    
                    if (outcome === 'accepted') {
                        console.log('✅ PWA installed')
                        installBtn.remove()
                    }
                    
                    deferredPrompt = null
                })
            })
            
            window.addEventListener('appinstalled', () => {
                console.log('🎉 PWA installed successfully')
                deferredPrompt = null
            })
        </script>
    </body>
    </html>
  `
}
