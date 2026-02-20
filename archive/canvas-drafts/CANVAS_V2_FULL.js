// CETTE SECTION SERA INSÉRÉE DANS index.tsx LIGNE 3344

// ============================================================================
// ROUTE PV CARTOGRAPHY - Canvas Editor V2 LEAFLET PROFESSIONNEL (PHASE 2c)
// ============================================================================
app.get('/pv/plant/:plantId/zone/:zoneId/editor/v2', async (c) => {
  const plantId = c.req.param('plantId')
  const zoneId = c.req.param('zoneId')
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cartographie PV Pro - DiagPV</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script src="https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/@turf/turf@6/turf.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
        
        <style>
            #map { height: 700px; width: 100%; border: 2px solid #9333ea; border-radius: 0.5rem; }
            .module-ok { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); }
            .module-inequality { background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%); }
            .module-microcracks { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); }
            .module-dead { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); animation: pulse 2s infinite; }
            .module-string_open { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); }
            .module-not_connected { background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); }
            .module-pending { background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%); border: 2px dashed #9ca3af !important; }
            @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        </style>
    </head>
    <body class="bg-black text-white">
        <!-- Header -->
        <div class="bg-gray-900 border-b-2 border-purple-400 p-4">
            <div class="container mx-auto flex justify-between items-center">
                <div class="flex gap-3 items-center">
                    <a href="/pv/plant/${plantId}" class="text-purple-400 hover:text-purple-300 font-bold">
                        <i class="fas fa-arrow-left mr-2"></i>RETOUR
                    </a>
                    <span class="text-sm bg-green-600 px-3 py-1 rounded font-bold">✨ VERSION PRO</span>
                    <h1 id="zoneTitle" class="text-xl font-black">Chargement...</h1>
                </div>
                <div class="flex gap-3">
                    <button id="saveAllBtn" class="bg-green-600 hover:bg-green-700 px-6 py-2 rounded font-black">
                        <i class="fas fa-save mr-2"></i>ENREGISTRER TOUT
                    </button>
                    <button id="exportBtn" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-bold">
                        <i class="fas fa-file-pdf mr-2"></i>EXPORT PDF
                    </button>
                </div>
            </div>
        </div>

        <div class="container mx-auto px-4 py-6 grid grid-cols-4 gap-6">
            <!-- LEFT SIDEBAR: Configuration -->
            <div class="col-span-1 space-y-4">
                <!-- Étape 1 : Dessin -->
                <div class="bg-gray-900 rounded-lg border-2 border-yellow-400 p-4">
                    <h3 class="text-lg font-black mb-3 text-yellow-400">
                        <i class="fas fa-pencil-ruler mr-2"></i>ÉTAPE 1 : DESSIN
                    </h3>
                    <button id="drawRoofBtn" class="w-full bg-yellow-600 hover:bg-yellow-700 py-3 rounded font-bold mb-2">
                        <i class="fas fa-draw-polygon mr-2"></i>DESSINER TOITURE
                    </button>
                    <button id="clearRoofBtn" class="w-full bg-red-600 hover:bg-red-700 py-2 rounded font-bold text-sm">
                        <i class="fas fa-trash mr-1"></i>Effacer
                    </button>
                    <div id="roofInfo" class="mt-3 p-3 bg-black rounded text-sm hidden">
                        <div class="text-gray-400">Surface toiture:</div>
                        <div id="roofArea" class="text-2xl font-black text-yellow-400">-- m²</div>
                    </div>
                </div>

                <!-- Étape 2 : Configuration Électrique -->
                <div class="bg-gray-900 rounded-lg border-2 border-green-400 p-4">
                    <h3 class="text-lg font-black mb-3 text-green-400">
                        <i class="fas fa-bolt mr-2"></i>ÉTAPE 2 : CONFIG ÉLEC
                    </h3>
                    <div class="space-y-3">
                        <div>
                            <label class="block text-xs text-gray-400 mb-1">Onduleurs</label>
                            <input type="number" id="inverterCount" min="0" max="50" value="1"
                                   class="w-full bg-black border border-gray-600 rounded px-3 py-2 text-center font-bold">
                        </div>
                        <div>
                            <label class="block text-xs text-gray-400 mb-1">Boîtes Jonction (BJ)</label>
                            <input type="number" id="junctionBoxCount" min="0" max="100" value="0"
                                   class="w-full bg-black border border-gray-600 rounded px-3 py-2 text-center font-bold">
                        </div>
                        <div>
                            <label class="block text-xs text-gray-400 mb-1">Strings</label>
                            <input type="number" id="stringCount" min="1" max="50" value="2"
                                   class="w-full bg-black border border-gray-600 rounded px-3 py-2 text-center font-bold">
                        </div>
                        <div>
                            <label class="block text-xs text-gray-400 mb-1">Modules/String</label>
                            <input type="number" id="modulesPerString" min="1" max="30" value="10"
                                   class="w-full bg-black border border-gray-600 rounded px-3 py-2 text-center font-bold">
                        </div>
                        <button id="saveConfigBtn" class="w-full bg-green-600 hover:bg-green-700 py-2 rounded font-bold">
                            <i class="fas fa-check mr-1"></i>Sauvegarder Config
                        </button>
                    </div>
                </div>

                <!-- Étape 3 : Placement Modules -->
                <div class="bg-gray-900 rounded-lg border-2 border-purple-400 p-4">
                    <h3 class="text-lg font-black mb-3 text-purple-400">
                        <i class="fas fa-solar-panel mr-2"></i>ÉTAPE 3 : MODULES
                    </h3>
                    <div class="space-y-2">
                        <button id="placeManualBtn" class="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded font-bold text-sm">
                            <i class="fas fa-mouse-pointer mr-1"></i>Placement Manuel
                        </button>
                        <button id="placeAutoBtn" class="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded font-bold text-sm">
                            <i class="fas fa-magic mr-1"></i>Auto (Config)
                        </button>
                        <div class="flex gap-2 items-center pt-2">
                            <button id="rotateBtn" class="flex-1 bg-orange-600 hover:bg-orange-700 py-2 rounded font-bold text-sm">
                                <i class="fas fa-redo"></i>
                            </button>
                            <span id="rotationLabel" class="flex-1 px-3 py-2 bg-black rounded text-center font-bold">0°</span>
                        </div>
                        <button id="clearModulesBtn" class="w-full bg-red-600 hover:bg-red-700 py-2 rounded font-bold text-sm mt-3">
                            <i class="fas fa-trash mr-1"></i>Effacer Modules
                        </button>
                    </div>
                </div>

                <!-- Stats Rapides -->
                <div class="bg-gray-900 rounded-lg border-2 border-blue-400 p-4">
                    <h3 class="text-sm font-black mb-2 text-blue-400">
                        <i class="fas fa-chart-bar mr-1"></i>STATS RAPIDES
                    </h3>
                    <div class="space-y-2 text-xs">
                        <div class="flex justify-between">
                            <span class="text-gray-400">Total:</span>
                            <span id="statsTotal" class="font-bold text-purple-400">0</span>
                        </div>
                        <div class="flex justify-between">
                            <span>🟢 OK:</span>
                            <span id="statsOk" class="font-bold text-green-400">0</span>
                        </div>
                        <div class="flex justify-between">
                            <span>🔴 HS:</span>
                            <span id="statsDead" class="font-bold text-red-400">0</span>
                        </div>
                        <div class="flex justify-between">
                            <span>⚪ Pending:</span>
                            <span id="statsPending" class="font-bold text-gray-400">0</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- CENTER: Carte Leaflet -->
            <div class="col-span-3">
                <div class="bg-gray-900 rounded-lg border-2 border-purple-400 p-4 mb-4">
                    <div id="map"></div>
                </div>

                <!-- Stats Détaillées -->
                <div class="grid grid-cols-8 gap-3">
                    <div class="bg-gray-900 rounded-lg p-3 text-center border border-purple-400">
                        <div class="text-xl font-black text-purple-400" id="statsTotal2">0</div>
                        <div class="text-xs text-gray-400">Total</div>
                    </div>
                    <div class="bg-gray-900 rounded-lg p-3 text-center border border-green-400">
                        <div class="text-xl font-black text-green-400" id="statsOk2">0</div>
                        <div class="text-xs">🟢 OK</div>
                    </div>
                    <div class="bg-gray-900 rounded-lg p-3 text-center border border-yellow-400">
                        <div class="text-xl font-black text-yellow-400" id="statsInequality">0</div>
                        <div class="text-xs">🟡 Inégal.</div>
                    </div>
                    <div class="bg-gray-900 rounded-lg p-3 text-center border border-orange-400">
                        <div class="text-xl font-black text-orange-400" id="statsMicrocracks">0</div>
                        <div class="text-xs">🟠 Fissures</div>
                    </div>
                    <div class="bg-gray-900 rounded-lg p-3 text-center border border-red-400">
                        <div class="text-xl font-black text-red-400" id="statsDead2">0</div>
                        <div class="text-xs">🔴 HS</div>
                    </div>
                    <div class="bg-gray-900 rounded-lg p-3 text-center border border-blue-400">
                        <div class="text-xl font-black text-blue-400" id="statsStringOpen">0</div>
                        <div class="text-xs">🔵 String</div>
                    </div>
                    <div class="bg-gray-900 rounded-lg p-3 text-center border border-gray-500">
                        <div class="text-xl font-black text-gray-400" id="statsNotConnected">0</div>
                        <div class="text-xs">⚫ NC</div>
                    </div>
                    <div class="bg-gray-900 rounded-lg p-3 text-center border border-gray-400">
                        <div class="text-xl font-black text-gray-400" id="statsPending2">0</div>
                        <div class="text-xs">⚪ Pend.</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal Annotation Statut -->
        <div id="statusModal" class="hidden fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
            <div class="bg-gray-900 border-2 border-yellow-400 rounded-lg p-6 max-w-md w-full">
                <h3 id="modalTitle" class="text-xl font-black mb-4 text-center">MODULE M000</h3>
                
                <div class="grid grid-cols-2 gap-3 mb-4">
                    <button class="status-btn bg-green-600 hover:bg-green-700 p-3 rounded font-bold" data-status="ok">
                        🟢 OK<br><span class="text-sm font-normal">Aucun défaut</span>
                    </button>
                    <button class="status-btn bg-yellow-600 hover:bg-yellow-700 p-3 rounded font-bold" data-status="inequality">
                        🟡 Inégalité<br><span class="text-sm font-normal">Qualité cellules</span>
                    </button>
                    <button class="status-btn bg-orange-600 hover:bg-orange-700 p-3 rounded font-bold" data-status="microcracks">
                        🟠 Microfissures<br><span class="text-sm font-normal">Visibles EL</span>
                    </button>
                    <button class="status-btn bg-red-600 hover:bg-red-700 p-3 rounded font-bold" data-status="dead">
                        🔴 HS<br><span class="text-sm font-normal">Défaillant</span>
                    </button>
                    <button class="status-btn bg-blue-600 hover:bg-blue-700 p-3 rounded font-bold" data-status="string_open">
                        🔵 String ouvert<br><span class="text-sm font-normal">Sous-string</span>
                    </button>
                    <button class="status-btn bg-gray-600 hover:bg-gray-700 p-3 rounded font-bold" data-status="not_connected">
                        ⚫ Non raccordé<br><span class="text-sm font-normal">NC</span>
                    </button>
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-bold mb-2">Commentaire :</label>
                    <input type="text" id="statusComment" 
                           class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2"
                           placeholder="Détails défaut...">
                </div>
                
                <div class="flex gap-3">
                    <button id="saveStatusBtn" class="flex-1 bg-green-600 hover:bg-green-700 py-3 rounded font-black">
                        ENREGISTRER
                    </button>
                    <button id="cancelStatusBtn" class="flex-1 bg-gray-600 hover:bg-gray-700 py-3 rounded font-black">
                        ANNULER
                    </button>
                </div>
            </div>
        </div>

        <script>
        // ================================================================
        // VARIABLES GLOBALES
        // ================================================================
        const plantId = '${plantId}'
        const zoneId = '${zoneId}'
        
        let map = null
        let drawnItems = new L.FeatureGroup()
        let roofPolygon = null
        let roofArea = 0
        let modules = []
        let plantData = null
        let zoneData = null
        let currentRotation = 0
        let selectedModule = null
        let placementMode = 'manual'
        let drawControl = null
        let nextModuleNum = 1
        
        const STATUS_COLORS = {
            ok: '#22c55e',
            inequality: '#eab308',
            microcracks: '#f97316',
            dead: '#ef4444',
            string_open: '#3b82f6',
            not_connected: '#6b7280',
            pending: '#e5e7eb'
        }
        
        // ================================================================
        // INIT
        // ================================================================
        async function init() {
            await loadPlantData()
            await loadZoneData()
            initMap()
            await loadModules()
            setupEventListeners()
            updateStats()
        }
        
        async function loadPlantData() {
            try {
                const response = await fetch(\`/api/pv/plants/\${plantId}\`)
                const data = await response.json()
                plantData = data.plant
            } catch (error) {
                console.error('Erreur chargement centrale:', error)
                plantData = { latitude: 48.8566, longitude: 2.3522, plant_name: 'Centrale' }
            }
        }
        
        async function loadZoneData() {
            try {
                const response = await fetch(\`/api/pv/plants/\${plantId}/zones/\${zoneId}\`)
                const data = await response.json()
                zoneData = data.zone
                document.getElementById('zoneTitle').textContent = zoneData.zone_name
                
                // Charger config électrique
                if (zoneData.inverter_count) document.getElementById('inverterCount').value = zoneData.inverter_count
                if (zoneData.junction_box_count) document.getElementById('junctionBoxCount').value = zoneData.junction_box_count
                if (zoneData.string_count) document.getElementById('stringCount').value = zoneData.string_count
                if (zoneData.modules_per_string) document.getElementById('modulesPerString').value = zoneData.modules_per_string
            } catch (error) {
                console.error('Erreur chargement zone:', error)
                zoneData = { zone_name: 'Zone', azimuth: 180, tilt: 30 }
            }
        }
        
        function initMap() {
            const lat = plantData.latitude || 48.8566
            const lng = plantData.longitude || 2.3522
            
            map = L.map('map', {
                center: [lat, lng],
                zoom: 20,
                maxZoom: 22
            })
            
            // Google Satellite (sans clé API, limitations possibles)
            L.tileLayer('https://{s}.google.com/vrt/lyrs=s&x={x}&y={y}&z={z}', {
                maxZoom: 22,
                subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
            }).addTo(map)
            
            map.addLayer(drawnItems)
            L.control.scale({ metric: true, imperial: false }).addTo(map)
            
            // Charger contour toiture existant
            if (zoneData.roof_polygon) {
                try {
                    const coords = JSON.parse(zoneData.roof_polygon)
                    roofPolygon = L.polygon(coords, {
                        color: '#fbbf24',
                        weight: 3,
                        fillOpacity: 0.1,
                        className: 'roof-polygon'
                    }).addTo(drawnItems)
                    
                    const geoJSON = roofPolygon.toGeoJSON()
                    roofArea = turf.area(geoJSON)
                    document.getElementById('roofArea').textContent = roofArea.toFixed(2) + ' m²'
                    document.getElementById('roofInfo').classList.remove('hidden')
                } catch (e) {
                    console.error('Erreur chargement polygone:', e)
                }
            }
        }
        
        async function loadModules() {
            try {
                const response = await fetch(\`/api/pv/plants/\${plantId}/zones/\${zoneId}/modules\`)
                const data = await response.json()
                modules = data.modules || []
                
                if (modules.length > 0) {
                    nextModuleNum = Math.max(...modules.map(m => {
                        const match = m.module_identifier.match(/\\d+/)
                        return match ? parseInt(match[0]) : 0
                    })) + 1
                }
                
                renderModules()
            } catch (error) {
                console.error('Erreur chargement modules:', error)
            }
        }
        
        // ================================================================
        // DESSIN TOITURE
        // ================================================================
        function enableRoofDrawing() {
            if (drawControl) map.removeControl(drawControl)
            
            drawControl = new L.Control.Draw({
                draw: {
                    polygon: {
                        showArea: true,
                        metric: true,
                        shapeOptions: { color: '#fbbf24', weight: 3 }
                    },
                    polyline: false,
                    rectangle: false,
                    circle: false,
                    marker: false,
                    circlemarker: false
                },
                edit: { featureGroup: drawnItems, remove: true }
            })
            
            map.addControl(drawControl)
            
            map.on(L.Draw.Event.CREATED, async (e) => {
                if (roofPolygon) drawnItems.removeLayer(roofPolygon)
                
                roofPolygon = e.layer
                drawnItems.addLayer(roofPolygon)
                
                const geoJSON = roofPolygon.toGeoJSON()
                roofArea = turf.area(geoJSON)
                
                document.getElementById('roofArea').textContent = roofArea.toFixed(2) + ' m²'
                document.getElementById('roofInfo').classList.remove('hidden')
                
                await saveRoofPolygon()
            })
        }
        
        async function saveRoofPolygon() {
            if (!roofPolygon) return
            
            const coords = roofPolygon.getLatLngs()[0].map(ll => [ll.lat, ll.lng])
            
            try {
                await fetch(\`/api/pv/plants/\${plantId}/zones/\${zoneId}/roof\`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        roof_polygon: JSON.stringify(coords),
                        roof_area_sqm: roofArea
                    })
                })
                alert('✅ Contour toiture sauvegardé!')
            } catch (error) {
                alert('❌ Erreur sauvegarde: ' + error.message)
            }
        }
        
        function clearRoof() {
            if (confirm('Effacer le contour de toiture ?')) {
                if (roofPolygon) drawnItems.removeLayer(roofPolygon)
                roofPolygon = null
                roofArea = 0
                document.getElementById('roofInfo').classList.add('hidden')
            }
        }
        
        // ================================================================
        // CONFIG ÉLECTRIQUE
        // ================================================================
        async function saveElectricalConfig() {
            const config = {
                inverter_count: parseInt(document.getElementById('inverterCount').value),
                junction_box_count: parseInt(document.getElementById('junctionBoxCount').value),
                string_count: parseInt(document.getElementById('stringCount').value),
                modules_per_string: parseInt(document.getElementById('modulesPerString').value)
            }
            
            try {
                await fetch(\`/api/pv/plants/\${plantId}/zones/\${zoneId}/config\`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(config)
                })
                alert('✅ Configuration électrique sauvegardée!')
            } catch (error) {
                alert('❌ Erreur: ' + error.message)
            }
        }
        
        // ================================================================
        // PLACEMENT MODULES
        // ================================================================
        function placeModulesAuto() {
            if (!roofPolygon) {
                alert('⚠️ Dessinez d\\'abord le contour de toiture!')
                return
            }
            
            const stringCount = parseInt(document.getElementById('stringCount').value)
            const modulesPerString = parseInt(document.getElementById('modulesPerString').value)
            const totalModules = stringCount * modulesPerString
            
            const moduleWidth = 1.7
            const moduleHeight = 1.0
            const spacing = 0.02
            
            const bounds = roofPolygon.getBounds()
            const center = bounds.getCenter()
            
            const cols = modulesPerString
            const rows = stringCount
            
            modules = []
            let moduleNum = 1
            
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const latOffset = (row * (moduleHeight + spacing)) / 111320
                    const lngOffset = (col * (moduleWidth + spacing)) / (111320 * Math.cos(center.lat * Math.PI / 180))
                    
                    const moduleLat = center.lat + latOffset - (rows * moduleHeight / 2 / 111320)
                    const moduleLng = center.lng + lngOffset - (cols * moduleWidth / 2 / (111320 * Math.cos(center.lat * Math.PI / 180)))
                    
                    const point = turf.point([moduleLng, moduleLat])
                    const poly = roofPolygon.toGeoJSON()
                    
                    if (turf.booleanPointInPolygon(point, poly)) {
                        modules.push({
                            id: null,
                            zone_id: parseInt(zoneId),
                            module_identifier: \`M\${moduleNum}\`,
                            latitude: moduleLat,
                            longitude: moduleLng,
                            pos_x_meters: col * (moduleWidth + spacing),
                            pos_y_meters: row * (moduleHeight + spacing),
                            width_meters: moduleWidth,
                            height_meters: moduleHeight,
                            rotation: currentRotation,
                            string_number: row + 1,
                            position_in_string: col + 1,
                            power_wp: 450,
                            module_status: 'pending',
                            status_comment: null
                        })
                        moduleNum++
                    }
                }
            }
            
            nextModuleNum = moduleNum
            renderModules()
            updateStats()
            alert(\`✅ \${modules.length} modules placés automatiquement!\`)
        }
        
        function placeModuleManual() {
            placementMode = 'manual'
            alert('Cliquez sur la carte pour placer des modules individuellement')
            
            map.once('click', (e) => {
                if (placementMode !== 'manual') return
                
                const stringCount = parseInt(document.getElementById('stringCount').value)
                const modulesPerString = parseInt(document.getElementById('modulesPerString').value)
                
                const stringNum = Math.floor((nextModuleNum - 1) / modulesPerString) + 1
                const posInString = ((nextModuleNum - 1) % modulesPerString) + 1
                
                modules.push({
                    id: null,
                    zone_id: parseInt(zoneId),
                    module_identifier: \`M\${nextModuleNum}\`,
                    latitude: e.latlng.lat,
                    longitude: e.latlng.lng,
                    pos_x_meters: 0,
                    pos_y_meters: 0,
                    width_meters: 1.7,
                    height_meters: 1.0,
                    rotation: currentRotation,
                    string_number: stringNum,
                    position_in_string: posInString,
                    power_wp: 450,
                    module_status: 'pending',
                    status_comment: null
                })
                
                nextModuleNum++
                renderModules()
                updateStats()
                
                // Continuer placement
                placeModuleManual()
            })
        }
        
        function clearModules() {
            if (confirm('Effacer tous les modules ?')) {
                modules = []
                nextModuleNum = 1
                renderModules()
                updateStats()
            }
        }
        
        // ================================================================
        // RENDU MODULES
        // ================================================================
        function renderModules() {
            drawnItems.eachLayer(layer => {
                if (layer.options.className && layer.options.className.startsWith('module-')) {
                    drawnItems.removeLayer(layer)
                }
            })
            
            modules.forEach(module => {
                const color = STATUS_COLORS[module.module_status] || STATUS_COLORS.pending
                
                const latOffset = module.height_meters / 111320 / 2
                const lngOffset = module.width_meters / (111320 * Math.cos(module.latitude * Math.PI / 180)) / 2
                
                const bounds = [
                    [module.latitude - latOffset, module.longitude - lngOffset],
                    [module.latitude + latOffset, module.longitude + lngOffset]
                ]
                
                const rect = L.rectangle(bounds, {
                    color: color,
                    weight: 2,
                    fillColor: color,
                    fillOpacity: 0.7,
                    className: \`module-\${module.module_status}\`
                })
                
                rect.bindPopup(\`
                    <strong>\${module.module_identifier}</strong><br>
                    String \${module.string_number} | Pos \${module.position_in_string}<br>
                    Statut: \${module.module_status}
                \`)
                
                rect.on('click', () => openStatusModal(module))
                rect.addTo(drawnItems)
            })
        }
        
        // ================================================================
        // MODAL ANNOTATION
        // ================================================================
        function openStatusModal(module) {
            selectedModule = module
            document.getElementById('modalTitle').textContent = module.module_identifier
            document.getElementById('statusComment').value = module.status_comment || ''
            document.getElementById('statusModal').classList.remove('hidden')
        }
        
        function closeModal() {
            document.getElementById('statusModal').classList.add('hidden')
            selectedModule = null
        }
        
        function selectStatus(status) {
            if (!selectedModule) return
            
            selectedModule.module_status = status
            selectedModule.status_comment = document.getElementById('statusComment').value || null
            
            closeModal()
            renderModules()
            updateStats()
        }
        
        // ================================================================
        // SAUVEGARDE
        // ================================================================
        async function saveAll() {
            try {
                // Sauvegarder modules
                await fetch(\`/api/pv/plants/\${plantId}/zones/\${zoneId}/modules\`, {
                    method: 'DELETE'
                })
                
                if (modules.length > 0) {
                    const response = await fetch(\`/api/pv/plants/\${plantId}/zones/\${zoneId}/modules\`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ modules })
                    })
                    
                    const data = await response.json()
                    
                    if (!data.success) {
                        throw new Error(data.error)
                    }
                }
                
                // Sauvegarder config
                await saveElectricalConfig()
                
                // Sauvegarder toiture
                if (roofPolygon) await saveRoofPolygon()
                
                alert(\`✅ Sauvegarde complète réussie!\n\${modules.length} modules | Surface: \${roofArea.toFixed(2)} m²\`)
                
                await loadModules()
            } catch (error) {
                alert('❌ Erreur sauvegarde: ' + error.message)
            }
        }
        
        // ================================================================
        // EXPORT PDF
        // ================================================================
        async function exportPDF() {
            const { jsPDF } = window.jspdf
            const doc = new jsPDF('landscape', 'mm', 'a3')
            
            // PAGE 1: Plan
            doc.setFontSize(18)
            doc.setFont('helvetica', 'bold')
            doc.text('PLAN CARTOGRAPHIQUE PHOTOVOLTAÏQUE', 15, 20)
            
            doc.setFontSize(11)
            doc.setFont('helvetica', 'normal')
            doc.text(\`Centrale: \${plantData.plant_name}\`, 15, 30)
            doc.text(\`Zone: \${zoneData.zone_name}\`, 15, 36)
            doc.text(\`Date: \${new Date().toLocaleDateString('fr-FR')}\`, 15, 42)
            
            // Capture carte
            await new Promise(r => setTimeout(r, 1000))
            const mapElement = document.getElementById('map')
            const canvas = await html2canvas(mapElement, { useCORS: true })
            const imgData = canvas.toDataURL('image/png')
            doc.addImage(imgData, 'PNG', 15, 50, 270, 140)
            
            // Specs
            doc.setFontSize(12)
            doc.setFont('helvetica', 'bold')
            doc.text('CARACTÉRISTIQUES TECHNIQUES', 15, 200)
            
            doc.setFontSize(10)
            doc.setFont('helvetica', 'normal')
            const stringCount = parseInt(document.getElementById('stringCount').value)
            const inverterCount = parseInt(document.getElementById('inverterCount').value)
            const junctionBoxCount = parseInt(document.getElementById('junctionBoxCount').value)
            
            doc.text(\`Modules: \${modules.length} | Puissance: \${(modules.length * 450 / 1000).toFixed(2)} kWc\`, 20, 210)
            doc.text(\`Onduleurs: \${inverterCount} | Boîtes Jonction: \${junctionBoxCount} | Strings: \${stringCount}\`, 20, 216)
            doc.text(\`Surface toiture: \${roofArea.toFixed(2)} m² | Azimut: \${zoneData.azimuth}° | Inclinaison: \${zoneData.tilt}°\`, 20, 222)
            
            // PAGE 2: Liste modules
            doc.addPage()
            doc.setFontSize(14)
            doc.setFont('helvetica', 'bold')
            doc.text('LISTE DÉTAILLÉE DES MODULES', 15, 20)
            
            doc.setFontSize(9)
            doc.setFont('helvetica', 'normal')
            let y = 30
            
            modules.forEach(m => {
                const emoji = {ok:'🟢',inequality:'🟡',microcracks:'🟠',dead:'🔴',string_open:'🔵',not_connected:'⚫',pending:'⚪'}[m.module_status]
                doc.text(\`\${m.module_identifier} | S\${m.string_number} P\${m.position_in_string} | \${emoji} \${m.module_status}\`, 15, y)
                
                if (m.status_comment) {
                    y += 4
                    doc.setFontSize(8)
                    doc.text(\`   → \${m.status_comment}\`, 15, y)
                    doc.setFontSize(9)
                }
                
                y += 5
                if (y > 280) {
                    doc.addPage()
                    y = 20
                }
            })
            
            doc.save(\`cartographie_\${zoneData.zone_name}_\${Date.now()}.pdf\`)
        }
        
        // ================================================================
        // STATS
        // ================================================================
        function updateStats() {
            const total = modules.length
            const ok = modules.filter(m => m.module_status === 'ok').length
            const inequality = modules.filter(m => m.module_status === 'inequality').length
            const microcracks = modules.filter(m => m.module_status === 'microcracks').length
            const dead = modules.filter(m => m.module_status === 'dead').length
            const stringOpen = modules.filter(m => m.module_status === 'string_open').length
            const notConnected = modules.filter(m => m.module_status === 'not_connected').length
            const pending = modules.filter(m => m.module_status === 'pending').length
            
            document.getElementById('statsTotal').textContent = total
            document.getElementById('statsTotal2').textContent = total
            document.getElementById('statsOk').textContent = ok
            document.getElementById('statsOk2').textContent = ok
            document.getElementById('statsInequality').textContent = inequality
            document.getElementById('statsMicrocracks').textContent = microcracks
            document.getElementById('statsDead').textContent = dead
            document.getElementById('statsDead2').textContent = dead
            document.getElementById('statsStringOpen').textContent = stringOpen
            document.getElementById('statsNotConnected').textContent = notConnected
            document.getElementById('statsPending').textContent = pending
            document.getElementById('statsPending2').textContent = pending
        }
        
        // ================================================================
        // EVENT LISTENERS
        // ================================================================
        function setupEventListeners() {
            document.getElementById('drawRoofBtn').addEventListener('click', enableRoofDrawing)
            document.getElementById('clearRoofBtn').addEventListener('click', clearRoof)
            document.getElementById('saveConfigBtn').addEventListener('click', saveElectricalConfig)
            document.getElementById('placeManualBtn').addEventListener('click', placeModuleManual)
            document.getElementById('placeAutoBtn').addEventListener('click', placeModulesAuto)
            document.getElementById('rotateBtn').addEventListener('click', () => {
                currentRotation = (currentRotation + 90) % 360
                document.getElementById('rotationLabel').textContent = currentRotation + '°'
            })
            document.getElementById('clearModulesBtn').addEventListener('click', clearModules)
            document.getElementById('saveAllBtn').addEventListener('click', saveAll)
            document.getElementById('exportBtn').addEventListener('click', exportPDF)
            
            document.querySelectorAll('.status-btn').forEach(btn => {
                btn.addEventListener('click', () => selectStatus(btn.dataset.status))
            })
            document.getElementById('cancelStatusBtn').addEventListener('click', closeModal)
        }
        
        // INIT
        init()
        </script>
    </body>
    </html>
  `)
})
