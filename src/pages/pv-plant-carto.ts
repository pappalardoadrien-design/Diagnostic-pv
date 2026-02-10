/**
 * Cartographie Centrale PV - Vue complète avec tous les strings
 * Permet de modéliser visuellement la centrale et accéder aux modules EL
 */

export function getPvPlantCartoPage(plantId: string): string {
  const buildTimestamp = Date.now()
  
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="build" content="${buildTimestamp}">
    <title>Cartographie Centrale - DiagPV OS</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <link rel="stylesheet" href="https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.css" />
    <script src="https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
    <style>
        body { font-family: 'Inter', sans-serif; }
        #map { height: calc(100vh - 180px); border-radius: 12px; }
        
        .string-rect {
            cursor: move;
            transition: all 0.2s;
        }
        .string-rect:hover {
            filter: brightness(1.1);
        }
        
        /* Rotation handle - Main rotation control */
        .rotation-handle {
            width: 24px;
            height: 24px;
            background: linear-gradient(135deg, #7c3aed, #5b21b6);
            border: 3px solid white;
            border-radius: 50%;
            cursor: grab;
            box-shadow: 0 4px 12px rgba(124,58,237,0.5);
            z-index: 1000;
            transition: all 0.15s;
        }
        .rotation-handle:hover {
            transform: scale(1.2);
            box-shadow: 0 6px 16px rgba(124,58,237,0.7);
        }
        .rotation-handle:active {
            cursor: grabbing;
            background: linear-gradient(135deg, #5b21b6, #4c1d95);
            transform: scale(1.1);
        }
        
        /* Corner handles for direct rotation */
        .corner-handle {
            width: 14px;
            height: 14px;
            background: #f97316;
            border: 2px solid white;
            border-radius: 50%;
            cursor: crosshair;
            box-shadow: 0 2px 8px rgba(249,115,22,0.5);
            z-index: 999;
            transition: all 0.15s;
        }
        .corner-handle:hover {
            background: #ea580c;
            transform: scale(1.3);
        }
        
        /* Resize handles */
        .resize-handle {
            width: 12px;
            height: 12px;
            background: #22c55e;
            border: 2px solid white;
            border-radius: 2px;
            cursor: nwse-resize;
            box-shadow: 0 2px 6px rgba(34,197,94,0.5);
            z-index: 999;
        }
        .resize-handle:hover {
            background: #16a34a;
            transform: scale(1.2);
        }
        
        /* Rotation indicator */
        .rotation-indicator {
            background: rgba(124,58,237,0.9);
            color: white;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: bold;
            white-space: nowrap;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            z-index: 1001;
        }
        
        /* Guide line for rotation */
        .rotation-guide-line {
            stroke: #7c3aed;
            stroke-width: 2;
            stroke-dasharray: 8,4;
        }
        
        /* Rotation panel */
        .rotation-panel {
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            padding: 12px;
            min-width: 200px;
        }
        .rotation-slider {
            -webkit-appearance: none;
            width: 100%;
            height: 8px;
            border-radius: 4px;
            background: #e2e8f0;
            outline: none;
        }
        .rotation-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #7c3aed;
            cursor: pointer;
        }
        
        .string-rect.selected {
            outline: 3px solid #7c3aed;
            outline-offset: 2px;
        }
        
        .module-cell {
            width: 24px;
            height: 36px;
            border: 1px solid rgba(255,255,255,0.3);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 8px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.15s;
        }
        .module-cell:hover {
            transform: scale(1.2);
            z-index: 100;
        }
        
        .module-ok { background: #22c55e; color: white; }
        .module-pending { background: #94a3b8; color: white; }
        .module-inequality { background: #eab308; color: black; }
        .module-microcracks { background: #f97316; color: white; }
        .module-dead { background: #ef4444; color: white; }
        .module-bypass { background: #8b5cf6; color: white; }
        
        .sidebar-panel {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .string-item {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
            cursor: pointer;
            transition: all 0.2s;
        }
        .string-item:hover {
            background: #f8fafc;
        }
        .string-item.active {
            background: #ede9fe;
            border-left: 4px solid #7c3aed;
        }
        
        .leaflet-popup-content-wrapper {
            border-radius: 12px;
            padding: 0;
        }
        .leaflet-popup-content {
            margin: 0;
            min-width: 280px;
        }
        
        .btn-tool {
            padding: 8px 16px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 13px;
            transition: all 0.2s;
            border: 2px solid transparent;
        }
        .btn-tool:hover {
            transform: translateY(-1px);
        }
        .btn-tool.active {
            border-color: #7c3aed;
            background: #ede9fe;
        }
    </style>
</head>
<body class="bg-slate-100 min-h-screen">
    <!-- Header -->
    <header class="bg-white border-b border-slate-200 px-6 py-3">
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
                <a href="/pv/plant/${plantId}" class="text-slate-400 hover:text-slate-600">
                    <i class="fas fa-arrow-left"></i>
                </a>
                <div>
                    <h1 class="text-xl font-bold text-slate-800" id="plantName">Chargement...</h1>
                    <p class="text-sm text-slate-500"><i class="fas fa-user mr-1"></i> <span id="clientName">-</span></p>
                </div>
            </div>
            
            <div class="flex items-center gap-3">
                <div class="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
                    <button id="btnSelect" class="btn-tool active" onclick="setTool('select')">
                        <i class="fas fa-mouse-pointer mr-1"></i> Sélection
                    </button>
                    <button id="btnMove" class="btn-tool" onclick="setTool('move')">
                        <i class="fas fa-arrows-alt mr-1"></i> Déplacer
                    </button>
                    <button id="btnDraw" class="btn-tool" onclick="setTool('draw')">
                        <i class="fas fa-draw-polygon mr-1"></i> Dessiner
                    </button>
                    <button id="btnRotate" class="btn-tool" onclick="setTool('rotate')">
                        <i class="fas fa-sync-alt mr-1"></i> Rotation
                    </button>
                </div>
                
                <button onclick="saveLayout()" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold">
                    <i class="fas fa-save mr-2"></i> Sauvegarder
                </button>
                <button onclick="calculateAllGPS()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold" title="Calculer les coordonnées GPS de tous les modules">
                    <i class="fas fa-map-marker-alt mr-2"></i> Géolocaliser
                </button>
                <button onclick="exportPlan()" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold">
                    <i class="fas fa-file-pdf mr-2"></i> Export Plan
                </button>
            </div>
        </div>
    </header>
    
    <!-- Main Content -->
    <div class="flex gap-4 p-4" style="height: calc(100vh - 80px);">
        <!-- Left Sidebar - Strings List -->
        <div class="w-72 flex flex-col gap-4">
            <div class="sidebar-panel">
                <div class="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4">
                    <h2 class="font-bold"><i class="fas fa-layer-group mr-2"></i> Strings</h2>
                    <p class="text-purple-200 text-sm mt-1"><span id="stringsCount">0</span> strings • <span id="modulesCount">0</span> modules</p>
                </div>
                <div id="stringsList" class="max-h-96 overflow-y-auto">
                    <div class="p-4 text-center text-slate-400">
                        <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                        <p>Chargement...</p>
                    </div>
                </div>
            </div>
            
            <!-- Quick Add -->
            <div class="sidebar-panel p-4">
                <h3 class="font-bold text-slate-800 mb-3"><i class="fas fa-plus-circle mr-2 text-green-600"></i> Positionner Strings</h3>
                <div class="space-y-3">
                    <!-- Mode Selection -->
                    <div class="flex gap-2 text-sm">
                        <button id="btnModeSingle" onclick="setPlaceMode('single')" class="flex-1 py-2 rounded-lg font-semibold bg-purple-600 text-white">
                            <i class="fas fa-hand-pointer mr-1"></i> 1 string
                        </button>
                        <button id="btnModeMulti" onclick="setPlaceMode('multi')" class="flex-1 py-2 rounded-lg font-semibold bg-slate-200 text-slate-700">
                            <i class="fas fa-layer-group mr-1"></i> Multi
                        </button>
                        <button id="btnModeAll" onclick="setPlaceMode('all')" class="flex-1 py-2 rounded-lg font-semibold bg-slate-200 text-slate-700">
                            <i class="fas fa-th mr-1"></i> Tous
                        </button>
                    </div>
                    
                    <!-- Single String Select -->
                    <div id="singleStringSelect">
                        <select id="stringToPlace" class="w-full px-3 py-2 border border-slate-300 rounded-lg">
                            <option value="">Sélectionner un string...</option>
                        </select>
                    </div>
                    
                    <!-- Multi Select (checkboxes) -->
                    <div id="multiStringSelect" class="hidden max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-2">
                        <div id="multiSelectCheckboxes" class="space-y-1">
                            <!-- Populated dynamically -->
                        </div>
                        <div class="flex gap-2 mt-2 pt-2 border-t">
                            <button onclick="selectAllStrings()" class="flex-1 text-xs bg-slate-100 py-1 rounded">Tout</button>
                            <button onclick="selectNoStrings()" class="flex-1 text-xs bg-slate-100 py-1 rounded">Aucun</button>
                            <button onclick="selectUnplacedStrings()" class="flex-1 text-xs bg-slate-100 py-1 rounded">Non placés</button>
                        </div>
                    </div>
                    
                    <!-- Layout Options (for multi/all) -->
                    <div id="layoutOptions" class="hidden border border-purple-200 bg-purple-50 rounded-lg p-3">
                        <label class="text-xs text-purple-700 font-semibold block mb-2"><i class="fas fa-th mr-1"></i> Disposition automatique</label>
                        <div class="grid grid-cols-2 gap-2 text-xs">
                            <button onclick="setLayout('grid')" id="layoutGrid" class="py-2 rounded bg-purple-600 text-white font-semibold">
                                <i class="fas fa-th mr-1"></i> Grille
                            </button>
                            <button onclick="setLayout('rows')" id="layoutRows" class="py-2 rounded bg-white text-purple-700 font-semibold border border-purple-300">
                                <i class="fas fa-grip-lines mr-1"></i> Lignes
                            </button>
                            <button onclick="setLayout('cols')" id="layoutCols" class="py-2 rounded bg-white text-purple-700 font-semibold border border-purple-300">
                                <i class="fas fa-grip-lines-vertical mr-1"></i> Colonnes
                            </button>
                            <button onclick="setLayout('manual')" id="layoutManual" class="py-2 rounded bg-white text-purple-700 font-semibold border border-purple-300">
                                <i class="fas fa-hand-pointer mr-1"></i> Manuel
                            </button>
                        </div>
                        <div id="gridConfig" class="mt-2 grid grid-cols-2 gap-2">
                            <div>
                                <label class="text-xs text-slate-500">Colonnes</label>
                                <input type="number" id="gridCols" value="5" min="1" max="15" class="w-full px-2 py-1 border rounded text-sm">
                            </div>
                            <div>
                                <label class="text-xs text-slate-500">Espacement (m)</label>
                                <input type="number" id="gridSpacing" value="0.5" step="0.1" class="w-full px-2 py-1 border rounded text-sm">
                            </div>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="text-xs text-slate-500">Largeur (m)</label>
                            <input type="number" id="rectWidth" value="24" class="w-full px-2 py-1 border rounded text-sm">
                        </div>
                        <div>
                            <label class="text-xs text-slate-500">Hauteur (m)</label>
                            <input type="number" id="rectHeight" value="1.7" class="w-full px-2 py-1 border rounded text-sm">
                        </div>
                    </div>
                    
                    <button onclick="placeStringsOnMap()" class="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-semibold">
                        <i class="fas fa-map-marker-alt mr-2"></i> <span id="placeButtonText">Placer sur la carte</span>
                    </button>
                    
                    <div id="selectionInfo" class="text-center text-sm text-slate-500 hidden">
                        <span id="selectedCount">0</span> string(s) sélectionné(s)
                    </div>
                </div>
            </div>
            
            <!-- Légende -->
            <div class="sidebar-panel p-4">
                <h3 class="font-bold text-slate-800 mb-3"><i class="fas fa-info-circle mr-2"></i> Légende EL</h3>
                <div class="space-y-2 text-sm">
                    <div class="flex items-center gap-2"><div class="w-4 h-4 rounded bg-green-500"></div> OK</div>
                    <div class="flex items-center gap-2"><div class="w-4 h-4 rounded bg-yellow-500"></div> Inégalité</div>
                    <div class="flex items-center gap-2"><div class="w-4 h-4 rounded bg-orange-500"></div> Microfissures</div>
                    <div class="flex items-center gap-2"><div class="w-4 h-4 rounded bg-red-500"></div> HS / À remplacer</div>
                    <div class="flex items-center gap-2"><div class="w-4 h-4 rounded bg-purple-500"></div> Diode bypass</div>
                    <div class="flex items-center gap-2"><div class="w-4 h-4 rounded bg-slate-400"></div> En attente</div>
                </div>
            </div>
        </div>
        
        <!-- Map Container -->
        <div class="flex-1 sidebar-panel overflow-hidden">
            <div id="map"></div>
        </div>
        
        <!-- Right Sidebar - Module Details -->
        <div class="w-80 flex flex-col gap-4">
            <div class="sidebar-panel">
                <div class="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4">
                    <h2 class="font-bold"><i class="fas fa-solar-panel mr-2"></i> Détail String</h2>
                    <p class="text-orange-200 text-sm" id="selectedStringName">Sélectionnez un string</p>
                </div>
                <div id="stringDetail" class="p-4">
                    <p class="text-slate-400 text-center py-8">
                        <i class="fas fa-hand-pointer text-3xl mb-2"></i><br>
                        Cliquez sur un string pour voir ses modules
                    </p>
                </div>
            </div>
            
            <!-- Stats -->
            <div class="sidebar-panel p-4">
                <h3 class="font-bold text-slate-800 mb-3"><i class="fas fa-chart-pie mr-2 text-blue-600"></i> Statistiques EL</h3>
                <div id="statsContainer" class="space-y-2">
                    <div class="flex justify-between text-sm">
                        <span class="text-slate-600">Modules OK</span>
                        <span class="font-bold text-green-600" id="statOk">-</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-slate-600">Inégalités</span>
                        <span class="font-bold text-yellow-600" id="statInequality">-</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-slate-600">Microfissures</span>
                        <span class="font-bold text-orange-600" id="statMicrocracks">-</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-slate-600">HS / À remplacer</span>
                        <span class="font-bold text-red-600" id="statDead">-</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-slate-600">En attente</span>
                        <span class="font-bold text-slate-500" id="statPending">-</span>
                    </div>
                    <div class="border-t pt-2 mt-2">
                        <div class="flex justify-between text-sm font-bold">
                            <span>Total</span>
                            <span id="statTotal">-</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Lien Audit EL -->
            <div class="sidebar-panel p-4" id="elAuditPanel">
                <h3 class="font-bold text-slate-800 mb-3"><i class="fas fa-link mr-2 text-purple-600"></i> Audit EL</h3>
                <div id="elAuditInfo" class="text-sm text-slate-500">
                    Chargement...
                </div>
            </div>
        </div>
    </div>
    
    <!-- Module Detail Modal -->
    <div id="moduleModal" class="fixed inset-0 bg-black/50 hidden items-center justify-center z-50">
        <div class="bg-white rounded-xl shadow-2xl w-96 max-h-[80vh] overflow-hidden">
            <div class="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-4 flex justify-between items-center">
                <h3 class="font-bold"><i class="fas fa-microchip mr-2"></i> Module <span id="modalModuleId">-</span></h3>
                <button onclick="closeModuleModal()" class="text-white/70 hover:text-white">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            <div id="moduleModalContent" class="p-4">
                <!-- Content loaded dynamically -->
            </div>
        </div>
    </div>

<script>
    const PLANT_ID = ${plantId}
    let map, plantData, zonesData = [], elModules = {}
    let stringRectangles = {} // zone_id -> { polygon, marker, rotation, center }
    let selectedZone = null
    let currentTool = 'select'
    let linkedAudit = null
    
    // Rotation state
    let rotationHandle = null
    let rotationPanel = null
    let isRotating = false
    let zoneRotations = {} // zone_id -> angle in degrees
    let cornerHandles = [] // Array of corner handle markers
    let rotationIndicator = null // Shows current angle
    let rotationGuideLine = null // Line from center to rotation handle
    
    // Multi-selection state
    let placeMode = 'single' // 'single', 'multi', 'all'
    let selectedStringsToPlace = [] // Array of zone IDs
    let currentLayout = 'grid' // 'grid', 'rows', 'cols', 'manual'
    let placingMultipleStrings = false
    let multiPlaceIndex = 0
    
    // ========================================
    // INITIALIZATION
    // ========================================
    
    async function init() {
        initMap()
        initDrawTool()
        await loadPlantData()
        await loadAllModules()
        await checkELAudit()
        renderStringsList()
        updateStats()
    }
    
    function initMap() {
        map = L.map('map', {
            center: [43.6, 1.4],
            zoom: 18,
            maxZoom: 22
        })
        
        // Satellite layer
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 22,
            attribution: 'Esri'
        }).addTo(map)
        
        // Geocoder
        L.Control.geocoder({
            defaultMarkGeocode: false,
            placeholder: 'Rechercher une adresse...',
            position: 'topleft',
            collapsed: false
        }).on('markgeocode', function(e) {
            map.setView(e.geocode.center, 19)
            L.marker(e.geocode.center).addTo(map)
                .bindPopup('<b>' + e.geocode.name + '</b>')
                .openPopup()
        }).addTo(map)
        
        // Click handler for placing strings
        map.on('click', onMapClick)
    }
    
    async function loadPlantData() {
        try {
            const res = await fetch('/api/pv/plants/' + PLANT_ID)
            const data = await res.json()
            
            if (data.success) {
                plantData = data.plant
                zonesData = data.zones || []
                
                document.getElementById('plantName').textContent = plantData.plant_name
                document.getElementById('clientName').textContent = plantData.client_name || 'Client non défini'
                document.getElementById('stringsCount').textContent = zonesData.length
                
                // Populate string selector (single mode)
                const select = document.getElementById('stringToPlace')
                select.innerHTML = '<option value="">Sélectionner un string...</option>'
                zonesData.forEach(z => {
                    select.innerHTML += '<option value="' + z.id + '">' + z.zone_name + ' (' + z.module_count + ' modules)</option>'
                })
                
                // Populate multi-select checkboxes
                populateMultiSelectCheckboxes()
                
                // Center map if coordinates available
                if (plantData.latitude && plantData.longitude) {
                    map.setView([plantData.latitude, plantData.longitude], 18)
                }
                
                // Load existing rectangles
                loadStringRectangles()
            }
        } catch (err) {
            console.error('Error loading plant:', err)
        }
    }
    
    async function loadAllModules() {
        let totalModules = 0
        
        for (const zone of zonesData) {
            try {
                const res = await fetch('/api/pv/plants/' + PLANT_ID + '/zones/' + zone.id + '/modules')
                const data = await res.json()
                
                if (data.success) {
                    elModules[zone.id] = data.modules || []
                    totalModules += elModules[zone.id].length
                }
            } catch (err) {
                console.error('Error loading modules for zone', zone.id, err)
            }
        }
        
        document.getElementById('modulesCount').textContent = totalModules
    }
    
    async function checkELAudit() {
        // Check if any zone has linked EL audit
        for (const zone of zonesData) {
            try {
                const res = await fetch('/api/pv/plants/' + PLANT_ID + '/zones/' + zone.id + '/el-link')
                const data = await res.json()
                
                if (data.linked && data.el_audit_token) {
                    linkedAudit = data
                    break
                }
            } catch (err) {
                // Ignore
            }
        }
        
        const panel = document.getElementById('elAuditInfo')
        if (linkedAudit) {
            panel.innerHTML = \`
                <div class="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div class="flex items-center gap-2 text-green-700 font-semibold mb-2">
                        <i class="fas fa-check-circle"></i> Audit EL lié
                    </div>
                    <p class="text-slate-600 text-xs mb-2">\${linkedAudit.project_name || 'Audit EL'}</p>
                    <div class="flex flex-col gap-2 mt-2">
                        <a href="/audit/\${linkedAudit.el_audit_token}" target="_blank" 
                           class="inline-flex items-center gap-1 text-purple-600 hover:text-purple-800 font-semibold text-sm">
                            <i class="fas fa-external-link-alt"></i> Ouvrir Audit EL
                        </a>
                        <button onclick="importELModules('\${linkedAudit.el_audit_token}')" 
                                class="inline-flex items-center justify-center gap-1 bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1.5 rounded font-semibold">
                            <i class="fas fa-download"></i> Importer modules
                        </button>
                    </div>
                </div>
            \`
        } else {
            panel.innerHTML = \`
                <div class="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                    <i class="fas fa-unlink text-2xl text-slate-300 mb-2"></i>
                    <p class="text-slate-500 text-sm">Aucun audit EL lié</p>
                </div>
            \`
        }
    }
    
    // ========================================
    // STRING RECTANGLES
    // ========================================
    
    function loadStringRectangles() {
        zonesData.forEach(zone => {
            // Check if zone has saved rectangle coordinates
            if (zone.roof_polygon) {
                try {
                    const data = JSON.parse(zone.roof_polygon)
                    
                    // Support both old format (array) and new format (object with rotation)
                    if (data.bounds && data.rotation !== undefined) {
                        // New format with rotation
                        zoneRotations[zone.id] = data.rotation
                        createStringRectangle(zone, data.bounds, data.rotation)
                    } else if (Array.isArray(data) && data.length >= 2) {
                        // Old format (simple bounds array)
                        createStringRectangle(zone, data, 0)
                    }
                } catch (e) {
                    // No saved position
                    console.warn('Could not parse roof_polygon for zone', zone.id, e)
                }
            }
        })
    }
    
    function createStringRectangle(zone, bounds, rotation = 0) {
        const color = getZoneColor(zone)
        
        // Calculate center and dimensions from bounds
        const sw = bounds[0]
        const ne = bounds[1]
        const centerLat = (sw[0] + ne[0]) / 2
        const centerLng = (sw[1] + ne[1]) / 2
        const center = L.latLng(centerLat, centerLng)
        const halfWidth = (ne[1] - sw[1]) / 2
        const halfHeight = (ne[0] - sw[0]) / 2
        
        // Get saved rotation or use provided
        const savedRotation = zoneRotations[zone.id] !== undefined ? zoneRotations[zone.id] : rotation
        zoneRotations[zone.id] = savedRotation
        
        // Create rotated polygon corners
        const corners = getRotatedCorners(center, halfWidth, halfHeight, savedRotation)
        
        const polygon = L.polygon(corners, {
            color: color,
            weight: 2,
            fillColor: color,
            fillOpacity: 0.4,
            className: 'string-rect'
        }).addTo(map)
        
        // Label at center
        const label = L.divIcon({
            className: 'string-label',
            html: '<div style="background:' + color + '; color:white; padding:2px 6px; border-radius:4px; font-size:11px; font-weight:bold; white-space:nowrap;">' + zone.zone_name + '</div>',
            iconSize: [80, 20],
            iconAnchor: [40, 10]
        })
        const marker = L.marker(center, { icon: label }).addTo(map)
        
        // Click to select
        polygon.on('click', () => selectZone(zone))
        
        // Make draggable - toujours actif (drag & drop direct)
        polygon.on('mousedown', function(e) {
            // Shift+click pour drag, ou outil move sélectionné
            if (e.originalEvent.shiftKey || currentTool === 'move') {
                enableDragging(polygon, zone, marker)
            }
        })
        
        // Double-click pour activer le drag temporairement
        polygon.on('dblclick', function() {
            enableDragging(polygon, zone, marker)
        })
        
        stringRectangles[zone.id] = { 
            polygon, 
            marker, 
            rotation: savedRotation, 
            center: center,
            halfWidth,
            halfHeight
        }
    }
    
    // Calculate rotated rectangle corners
    function getRotatedCorners(center, halfWidth, halfHeight, angleDeg) {
        const angleRad = angleDeg * Math.PI / 180
        const cos = Math.cos(angleRad)
        const sin = Math.sin(angleRad)
        
        // Corner offsets (unrotated)
        const corners = [
            [-halfHeight, -halfWidth], // SW
            [-halfHeight, halfWidth],  // SE
            [halfHeight, halfWidth],   // NE
            [halfHeight, -halfWidth]   // NW
        ]
        
        // Rotate each corner around center
        return corners.map(([dLat, dLng]) => {
            const rotLat = dLat * cos - dLng * sin
            const rotLng = dLat * sin + dLng * cos
            return [center.lat + rotLat, center.lng + rotLng]
        })
    }
    
    function getZoneColor(zone) {
        const modules = elModules[zone.id] || []
        const hasDead = modules.some(m => m.module_status === 'dead' || m.defect_type === 'dead_module')
        const hasMicro = modules.some(m => m.module_status === 'microcracks' || m.defect_type === 'microcrack')
        const hasInequality = modules.some(m => m.module_status === 'inequality' || m.defect_type === 'luminescence_inequality')
        
        if (hasDead) return '#ef4444'
        if (hasMicro) return '#f97316'
        if (hasInequality) return '#eab308'
        return '#22c55e'
    }
    
    function enableDragging(polygon, zone, marker) {
        map.dragging.disable()
        hideRotationControls()
        
        const sr = stringRectangles[zone.id]
        let lastLatLng = polygon.getBounds().getCenter()
        
        const onMove = (e) => {
            const latDiff = e.latlng.lat - lastLatLng.lat
            const lngDiff = e.latlng.lng - lastLatLng.lng
            
            // Move all polygon points
            const latlngs = polygon.getLatLngs()[0]
            const newLatLngs = latlngs.map(ll => L.latLng(ll.lat + latDiff, ll.lng + lngDiff))
            polygon.setLatLngs(newLatLngs)
            
            // Update center
            const newCenter = polygon.getBounds().getCenter()
            marker.setLatLng(newCenter)
            lastLatLng = newCenter
            
            // Update stored center
            if (sr) sr.center = newCenter
        }
        
        const onUp = () => {
            map.off('mousemove', onMove)
            map.off('mouseup', onUp)
            map.dragging.enable()
            
            // Save new position with rotation
            const newCenter = polygon.getBounds().getCenter()
            const rotation = zoneRotations[zone.id] || 0
            
            saveZonePositionWithRotation(zone.id, newCenter, sr.halfWidth, sr.halfHeight, rotation)
        }
        
        map.on('mousemove', onMove)
        map.on('mouseup', onUp)
    }
    
    // ========================================
    // MULTI-SELECT CONTROLS
    // ========================================
    
    function setPlaceMode(mode) {
        placeMode = mode
        
        // Update UI buttons
        document.getElementById('btnModeSingle').className = mode === 'single' 
            ? 'flex-1 py-2 rounded-lg font-semibold bg-purple-600 text-white'
            : 'flex-1 py-2 rounded-lg font-semibold bg-slate-200 text-slate-700'
        document.getElementById('btnModeMulti').className = mode === 'multi'
            ? 'flex-1 py-2 rounded-lg font-semibold bg-purple-600 text-white'
            : 'flex-1 py-2 rounded-lg font-semibold bg-slate-200 text-slate-700'
        document.getElementById('btnModeAll').className = mode === 'all'
            ? 'flex-1 py-2 rounded-lg font-semibold bg-purple-600 text-white'
            : 'flex-1 py-2 rounded-lg font-semibold bg-slate-200 text-slate-700'
        
        // Toggle visibility
        document.getElementById('singleStringSelect').classList.toggle('hidden', mode !== 'single')
        document.getElementById('multiStringSelect').classList.toggle('hidden', mode === 'single')
        document.getElementById('layoutOptions').classList.toggle('hidden', mode === 'single')
        document.getElementById('selectionInfo').classList.toggle('hidden', mode === 'single')
        
        // Update button text
        updatePlaceButtonText()
        
        // For 'all' mode, auto-select all strings
        if (mode === 'all') {
            selectAllStrings()
        }
    }
    
    function populateMultiSelectCheckboxes() {
        const container = document.getElementById('multiSelectCheckboxes')
        let html = ''
        
        zonesData.forEach(z => {
            const isPlaced = !!stringRectangles[z.id]
            const placedIcon = isPlaced ? '<i class="fas fa-check text-green-500 ml-1"></i>' : ''
            
            html += \`
                <label class="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded text-sm">
                    <input type="checkbox" class="string-checkbox" value="\${z.id}" 
                           onchange="updateSelectedStrings()" \${isPlaced ? '' : 'checked'}>
                    <span>\${z.zone_name} (\${z.module_count || 14}m)</span>
                    \${placedIcon}
                </label>
            \`
        })
        
        container.innerHTML = html
        updateSelectedStrings()
    }
    
    function updateSelectedStrings() {
        const checkboxes = document.querySelectorAll('.string-checkbox:checked')
        selectedStringsToPlace = Array.from(checkboxes).map(cb => parseInt(cb.value))
        
        document.getElementById('selectedCount').textContent = selectedStringsToPlace.length
        updatePlaceButtonText()
    }
    
    function selectAllStrings() {
        document.querySelectorAll('.string-checkbox').forEach(cb => cb.checked = true)
        updateSelectedStrings()
    }
    
    function selectNoStrings() {
        document.querySelectorAll('.string-checkbox').forEach(cb => cb.checked = false)
        updateSelectedStrings()
    }
    
    function selectUnplacedStrings() {
        document.querySelectorAll('.string-checkbox').forEach(cb => {
            const zoneId = parseInt(cb.value)
            cb.checked = !stringRectangles[zoneId]
        })
        updateSelectedStrings()
    }
    
    function updatePlaceButtonText() {
        const btn = document.getElementById('placeButtonText')
        if (placeMode === 'single') {
            btn.textContent = 'Placer sur la carte'
        } else {
            const count = selectedStringsToPlace.length
            btn.textContent = \`Placer \${count} string(s)\`
        }
    }
    
    function setLayout(layout) {
        currentLayout = layout
        
        const layouts = ['grid', 'rows', 'cols', 'manual']
        layouts.forEach(l => {
            const btn = document.getElementById('layout' + l.charAt(0).toUpperCase() + l.slice(1))
            if (l === layout) {
                btn.className = 'py-2 rounded bg-purple-600 text-white font-semibold'
            } else {
                btn.className = 'py-2 rounded bg-white text-purple-700 font-semibold border border-purple-300'
            }
        })
        
        // Show/hide grid config
        document.getElementById('gridConfig').classList.toggle('hidden', layout === 'manual')
    }
    
    // ========================================
    // PLACING STRINGS (Single & Multi)
    // ========================================
    
    let placingZone = null
    
    function placeStringsOnMap() {
        if (placeMode === 'single') {
            // Original single placement
            const zoneId = document.getElementById('stringToPlace').value
            if (!zoneId) {
                alert('Sélectionnez un string à placer')
                return
            }
            
            placingZone = zonesData.find(z => z.id == parseInt(zoneId))
            if (!placingZone) return
            
            document.getElementById('map').style.cursor = 'crosshair'
            showNotification('Cliquez sur la carte pour placer ' + placingZone.zone_name, 'info')
        } else {
            // Multi placement
            if (selectedStringsToPlace.length === 0) {
                alert('Sélectionnez au moins un string à placer')
                return
            }
            
            if (currentLayout === 'manual') {
                // Manual: place one by one
                placingMultipleStrings = true
                multiPlaceIndex = 0
                placeNextStringManual()
            } else {
                // Auto layout: click once to set origin
                document.getElementById('map').style.cursor = 'crosshair'
                showNotification('Cliquez sur la carte pour placer les ' + selectedStringsToPlace.length + ' strings', 'info')
                placingMultipleStrings = true
            }
        }
    }
    
    function placeNextStringManual() {
        if (multiPlaceIndex >= selectedStringsToPlace.length) {
            finishMultiPlacement()
            return
        }
        
        const zoneId = selectedStringsToPlace[multiPlaceIndex]
        placingZone = zonesData.find(z => z.id === zoneId)
        
        if (!placingZone) {
            multiPlaceIndex++
            placeNextStringManual()
            return
        }
        
        document.getElementById('map').style.cursor = 'crosshair'
        showNotification(\`Placez \${placingZone.zone_name} (\${multiPlaceIndex + 1}/\${selectedStringsToPlace.length})\`, 'info')
    }
    
    function finishMultiPlacement() {
        placingMultipleStrings = false
        multiPlaceIndex = 0
        placingZone = null
        document.getElementById('map').style.cursor = ''
        showNotification(\`\${selectedStringsToPlace.length} strings placés!\`, 'success')
        renderStringsList()
        populateMultiSelectCheckboxes()
    }
    
    function onMapClick(e) {
        // Multi-placement with auto layout
        if (placingMultipleStrings && placeMode !== 'single' && currentLayout !== 'manual') {
            placeStringsAutoLayout(e.latlng)
            return
        }
        
        // Manual multi-placement (one by one)
        if (placingMultipleStrings && currentLayout === 'manual' && placingZone) {
            placeSingleStringAt(e.latlng, placingZone)
            multiPlaceIndex++
            placeNextStringManual()
            return
        }
        
        // Single placement
        if (!placingZone) return
        
        placeSingleStringAt(e.latlng, placingZone)
        
        document.getElementById('map').style.cursor = ''
        placingZone = null
        showNotification('String placé!', 'success')
        renderStringsList()
    }
    
    function placeSingleStringAt(latlng, zone) {
        const width = parseFloat(document.getElementById('rectWidth').value) || 24
        const height = parseFloat(document.getElementById('rectHeight').value) || 1.7
        
        // Convert meters to lat/lng (approximate)
        const latPerMeter = 0.000009
        const lngPerMeter = 0.000012
        
        const bounds = [
            [latlng.lat - (height * latPerMeter / 2), latlng.lng - (width * lngPerMeter / 2)],
            [latlng.lat + (height * latPerMeter / 2), latlng.lng + (width * lngPerMeter / 2)]
        ]
        
        // Remove existing if any
        if (stringRectangles[zone.id]) {
            map.removeLayer(stringRectangles[zone.id].polygon)
            map.removeLayer(stringRectangles[zone.id].marker)
        }
        
        createStringRectangle(zone, bounds)
        saveZonePosition(zone.id, bounds)
    }
    
    function placeStringsAutoLayout(originLatLng) {
        const width = parseFloat(document.getElementById('rectWidth').value) || 24
        const height = parseFloat(document.getElementById('rectHeight').value) || 1.7
        const spacing = parseFloat(document.getElementById('gridSpacing').value) || 0.5
        const gridCols = parseInt(document.getElementById('gridCols').value) || 5
        
        const latPerMeter = 0.000009
        const lngPerMeter = 0.000012
        
        const stringsToPlace = selectedStringsToPlace
            .map(id => zonesData.find(z => z.id === id))
            .filter(z => z)
        
        stringsToPlace.forEach((zone, index) => {
            let offsetLat = 0
            let offsetLng = 0
            
            if (currentLayout === 'grid') {
                const row = Math.floor(index / gridCols)
                const col = index % gridCols
                offsetLat = -row * (height + spacing) * latPerMeter
                offsetLng = col * (width + spacing) * lngPerMeter
            } else if (currentLayout === 'rows') {
                // All in horizontal rows
                offsetLat = -index * (height + spacing) * latPerMeter
            } else if (currentLayout === 'cols') {
                // All in vertical columns
                offsetLng = index * (width + spacing) * lngPerMeter
            }
            
            const lat = originLatLng.lat + offsetLat
            const lng = originLatLng.lng + offsetLng
            
            const bounds = [
                [lat - (height * latPerMeter / 2), lng - (width * lngPerMeter / 2)],
                [lat + (height * latPerMeter / 2), lng + (width * lngPerMeter / 2)]
            ]
            
            // Remove existing
            if (stringRectangles[zone.id]) {
                map.removeLayer(stringRectangles[zone.id].polygon)
                map.removeLayer(stringRectangles[zone.id].marker)
            }
            
            createStringRectangle(zone, bounds)
            saveZonePosition(zone.id, bounds)
        })
        
        finishMultiPlacement()
    }
    
    async function saveZonePosition(zoneId, bounds) {
        try {
            // 1. Sauvegarder la position du rectangle
            await fetch('/api/pv/plants/' + PLANT_ID + '/zones/' + zoneId, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roof_polygon: JSON.stringify(bounds)
                })
            })
            
            // 2. Calculer automatiquement les coordonnées GPS des modules
            const gpsRes = await fetch('/api/pv/plants/' + PLANT_ID + '/zones/' + zoneId + '/calculate-gps', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            })
            const gpsData = await gpsRes.json()
            
            if (gpsData.success) {
                showNotification(gpsData.message || 'GPS calculé', 'success')
            }
        } catch (err) {
            console.error('Error saving zone position:', err)
        }
    }
    
    // ========================================
    // SELECTION & DETAILS
    // ========================================
    
    function selectZone(zone) {
        selectedZone = zone
        
        // Update sidebar
        document.querySelectorAll('.string-item').forEach(el => el.classList.remove('active'))
        const item = document.querySelector('[data-zone-id="' + zone.id + '"]')
        if (item) item.classList.add('active')
        
        // Update rectangle styles
        Object.keys(stringRectangles).forEach(id => {
            const r = stringRectangles[id].polygon
            if (parseInt(id) === zone.id) {
                r.setStyle({ weight: 4, dashArray: '5,5' })
            } else {
                r.setStyle({ weight: 2, dashArray: null })
            }
        })
        
        // Show rotation controls if rotation tool is active
        if (currentTool === 'rotate' && stringRectangles[zone.id]) {
            showRotationControls(zone)
        }
        
        // Show string details
        document.getElementById('selectedStringName').textContent = zone.zone_name
        renderStringDetail(zone)
    }
    
    function renderStringDetail(zone) {
        const modules = elModules[zone.id] || []
        const container = document.getElementById('stringDetail')
        
        if (modules.length === 0) {
            container.innerHTML = '<p class="text-slate-400 text-center py-4">Aucun module dans ce string</p>'
            return
        }
        
        // Group by row for display
        const cols = Math.min(14, modules.length)
        const rows = Math.ceil(modules.length / cols)
        
        let html = '<div class="mb-3"><span class="text-sm text-slate-600">' + modules.length + ' modules</span></div>'
        html += '<div style="display: grid; grid-template-columns: repeat(' + cols + ', 1fr); gap: 2px;">'
        
        modules.forEach((m, idx) => {
            const status = getModuleStatusClass(m)
            const num = idx + 1
            html += '<div class="module-cell ' + status + '" onclick="openModuleModal(' + zone.id + ', ' + idx + ')" title="' + m.module_identifier + '">' + num + '</div>'
        })
        
        html += '</div>'
        
        // Actions
        html += \`
            <div class="mt-4 flex gap-2">
                <a href="/pv/plant/\${PLANT_ID}/zone/\${zone.id}/editor/v3" 
                   class="flex-1 text-center bg-purple-100 text-purple-700 py-2 rounded-lg text-sm font-semibold hover:bg-purple-200">
                    <i class="fas fa-edit mr-1"></i> Éditer
                </a>
                \${linkedAudit ? \`
                <a href="/el/view/\${linkedAudit.el_audit_token}?zone=\${zone.id}" 
                   class="flex-1 text-center bg-orange-100 text-orange-700 py-2 rounded-lg text-sm font-semibold hover:bg-orange-200">
                    <i class="fas fa-search mr-1"></i> Voir EL
                </a>
                \` : ''}
            </div>
        \`
        
        container.innerHTML = html
    }
    
    function getModuleStatusClass(module) {
        const status = module.module_status || module.defect_type || 'pending'
        
        if (status === 'ok' || status === 'none') return 'module-ok'
        if (status === 'pending') return 'module-pending'
        if (status === 'inequality' || status === 'luminescence_inequality') return 'module-inequality'
        if (status === 'microcracks' || status === 'microcrack') return 'module-microcracks'
        if (status === 'dead' || status === 'dead_module') return 'module-dead'
        if (status === 'bypass' || status === 'bypass_diode_failure') return 'module-bypass'
        
        return 'module-pending'
    }
    
    // ========================================
    // MODULE MODAL
    // ========================================
    
    function openModuleModal(zoneId, moduleIndex) {
        const modules = elModules[zoneId] || []
        const module = modules[moduleIndex]
        if (!module) return
        
        document.getElementById('modalModuleId').textContent = module.module_identifier
        
        const status = module.module_status || module.defect_type || 'pending'
        const statusLabel = {
            'ok': '✅ OK',
            'none': '✅ OK',
            'pending': '⏳ En attente',
            'inequality': '🟡 Inégalité',
            'luminescence_inequality': '🟡 Inégalité',
            'microcracks': '🟠 Microfissures',
            'microcrack': '🟠 Microfissures',
            'dead': '🔴 HS - À remplacer',
            'dead_module': '🔴 HS - À remplacer',
            'bypass': '⚡ Diode bypass HS',
            'bypass_diode_failure': '⚡ Diode bypass HS'
        }[status] || status
        
        const content = \`
            <div class="space-y-4">
                <div class="bg-slate-50 rounded-lg p-3">
                    <div class="text-sm text-slate-500 mb-1">Statut EL</div>
                    <div class="text-lg font-bold">\${statusLabel}</div>
                </div>
                
                <div class="grid grid-cols-2 gap-3">
                    <div class="bg-slate-50 rounded-lg p-3">
                        <div class="text-sm text-slate-500">String</div>
                        <div class="font-bold">\${module.string_number || '-'}</div>
                    </div>
                    <div class="bg-slate-50 rounded-lg p-3">
                        <div class="text-sm text-slate-500">Position</div>
                        <div class="font-bold">\${module.position_in_string || moduleIndex + 1}</div>
                    </div>
                </div>
                
                \${module.comment ? \`
                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div class="text-sm text-yellow-700 font-semibold mb-1"><i class="fas fa-comment mr-1"></i> Commentaire</div>
                    <div class="text-slate-700">\${module.comment}</div>
                </div>
                \` : ''}
                
                <div class="flex gap-2">
                    \${linkedAudit ? \`
                    <a href="/audit/\${linkedAudit.el_audit_token}#module-\${module.module_identifier}" 
                       class="flex-1 text-center bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600">
                        <i class="fas fa-edit mr-1"></i> Modifier dans EL
                    </a>
                    \` : ''}
                    <button onclick="closeModuleModal()" class="flex-1 bg-slate-200 text-slate-700 py-2 rounded-lg font-semibold hover:bg-slate-300">
                        Fermer
                    </button>
                </div>
            </div>
        \`
        
        document.getElementById('moduleModalContent').innerHTML = content
        document.getElementById('moduleModal').classList.remove('hidden')
        document.getElementById('moduleModal').classList.add('flex')
    }
    
    function closeModuleModal() {
        document.getElementById('moduleModal').classList.add('hidden')
        document.getElementById('moduleModal').classList.remove('flex')
    }
    
    // ========================================
    // UI RENDERING
    // ========================================
    
    function renderStringsList() {
        const container = document.getElementById('stringsList')
        
        if (zonesData.length === 0) {
            container.innerHTML = '<p class="p-4 text-slate-400 text-center">Aucun string</p>'
            return
        }
        
        let html = ''
        zonesData.forEach(zone => {
            const modules = elModules[zone.id] || []
            const okCount = modules.filter(m => m.module_status === 'ok' || m.defect_type === 'none').length
            const issueCount = modules.filter(m => m.module_status !== 'ok' && m.module_status !== 'pending' && m.defect_type !== 'none' && m.defect_type !== 'pending').length
            const color = getZoneColor(zone)
            const isPlaced = !!stringRectangles[zone.id]
            
            html += \`
                <div class="string-item" data-zone-id="\${zone.id}" onclick="selectZone(zonesData.find(z => z.id == \${zone.id})); focusOnString(\${zone.id})">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <div class="w-3 h-3 rounded" style="background: \${color}"></div>
                            <span class="font-semibold text-slate-800">\${zone.zone_name}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            \${isPlaced ? '<i class="fas fa-map-marker-alt text-green-500" title="Positionné"></i>' : '<i class="fas fa-question-circle text-slate-300" title="Non positionné"></i>'}
                            <span class="text-xs text-slate-500">\${modules.length}m</span>
                        </div>
                    </div>
                    \${issueCount > 0 ? '<div class="text-xs text-red-500 mt-1"><i class="fas fa-exclamation-triangle mr-1"></i>' + issueCount + ' problème(s)</div>' : ''}
                </div>
            \`
        })
        
        container.innerHTML = html
    }
    
    function updateStats() {
        let ok = 0, inequality = 0, microcracks = 0, dead = 0, pending = 0
        
        Object.values(elModules).forEach(modules => {
            modules.forEach(m => {
                const status = m.module_status || m.defect_type || 'pending'
                if (status === 'ok' || status === 'none') ok++
                else if (status === 'inequality' || status === 'luminescence_inequality') inequality++
                else if (status === 'microcracks' || status === 'microcrack') microcracks++
                else if (status === 'dead' || status === 'dead_module') dead++
                else pending++
            })
        })
        
        document.getElementById('statOk').textContent = ok
        document.getElementById('statInequality').textContent = inequality
        document.getElementById('statMicrocracks').textContent = microcracks
        document.getElementById('statDead').textContent = dead
        document.getElementById('statPending').textContent = pending
        document.getElementById('statTotal').textContent = ok + inequality + microcracks + dead + pending
    }
    
    function focusOnString(zoneId) {
        const sr = stringRectangles[zoneId]
        if (sr) {
            map.fitBounds(sr.polygon.getBounds(), { padding: [50, 50] })
        }
    }
    
    // ========================================
    // TOOLS
    // ========================================
    
    let drawStartPoint = null
    let drawRect = null
    
    function setTool(tool) {
        currentTool = tool
        document.querySelectorAll('.btn-tool').forEach(btn => btn.classList.remove('active'))
        document.getElementById('btn' + tool.charAt(0).toUpperCase() + tool.slice(1)).classList.add('active')
        
        // Hide rotation controls when changing tools (but not when switching to rotate)
        if (tool !== 'rotate') {
            hideRotationControls()
        }
        
        if (tool === 'move') {
            document.getElementById('map').style.cursor = 'move'
            showNotification('Mode déplacement: Cliquez-glissez sur une zone pour la déplacer', 'info')
        } else if (tool === 'draw') {
            document.getElementById('map').style.cursor = 'crosshair'
            showNotification('Mode dessin: Cliquez et glissez pour dessiner un rectangle', 'info')
        } else if (tool === 'rotate') {
            document.getElementById('map').style.cursor = 'crosshair'
            if (!selectedZone) {
                showNotification('⚠️ Sélectionnez d\\'abord une zone dans la liste à gauche, puis utilisez l\\'outil Rotation', 'warning')
            } else if (!stringRectangles[selectedZone.id]) {
                showNotification('⚠️ Cette zone n\\'est pas positionnée sur la carte. Utilisez l\\'outil Dessiner d\\'abord.', 'warning')
            } else {
                showRotationControls(selectedZone)
            }
        } else if (tool === 'select') {
            document.getElementById('map').style.cursor = ''
            showNotification('Mode sélection: Cliquez sur une zone pour la sélectionner', 'info')
        }
        
        // Annuler le dessin en cours si on change d'outil
        if (tool !== 'draw' && drawRect) {
            map.removeLayer(drawRect)
            drawRect = null
            drawStartPoint = null
        }
    }
    
    // ========================================
    // ROTATION TOOL - Enhanced Version
    // ========================================
    
    function showRotationControls(zone) {
        if (!zone || !stringRectangles[zone.id]) {
            showNotification('Zone non positionnée sur la carte. Dessinez d\\'abord le rectangle.', 'error')
            return
        }
        
        const sr = stringRectangles[zone.id]
        const center = sr.center
        const currentRotation = zoneRotations[zone.id] || 0
        
        // Remove existing controls first
        hideRotationControls()
        
        // Create rotation panel on screen
        rotationPanel = L.control({ position: 'bottomleft' })
        rotationPanel.onAdd = function() {
            const div = L.DomUtil.create('div', 'rotation-panel')
            div.style.cssText = 'background:white; border-radius:12px; padding:16px; box-shadow:0 4px 20px rgba(0,0,0,0.2); min-width:280px;'
            div.innerHTML = \`
                <div class="mb-3 flex items-center justify-between">
                    <div class="font-bold text-slate-800">
                        <i class="fas fa-sync-alt mr-2 text-purple-600"></i>Rotation: \${zone.zone_name}
                    </div>
                    <span id="rotationDisplay" class="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold">\${Math.round(currentRotation)}°</span>
                </div>
                
                <div class="mb-4">
                    <input type="range" id="rotationSlider" class="rotation-slider w-full" 
                           min="-180" max="180" step="1" value="\${currentRotation > 180 ? currentRotation - 360 : currentRotation}">
                    <div class="flex justify-between text-xs text-slate-400 mt-1">
                        <span>-180°</span>
                        <span>0°</span>
                        <span>180°</span>
                    </div>
                </div>
                
                <div class="mb-3">
                    <div class="text-xs text-slate-500 mb-2 font-semibold">⚡ ANGLES RAPIDES</div>
                    <div class="grid grid-cols-6 gap-1">
                        <button onclick="setRotationAngle(0)" class="py-2 bg-slate-100 rounded text-xs font-bold hover:bg-purple-100">0°</button>
                        <button onclick="setRotationAngle(30)" class="py-2 bg-slate-100 rounded text-xs font-bold hover:bg-purple-100">30°</button>
                        <button onclick="setRotationAngle(45)" class="py-2 bg-slate-100 rounded text-xs font-bold hover:bg-purple-100">45°</button>
                        <button onclick="setRotationAngle(90)" class="py-2 bg-slate-100 rounded text-xs font-bold hover:bg-purple-100">90°</button>
                        <button onclick="setRotationAngle(135)" class="py-2 bg-slate-100 rounded text-xs font-bold hover:bg-purple-100">135°</button>
                        <button onclick="setRotationAngle(180)" class="py-2 bg-slate-100 rounded text-xs font-bold hover:bg-purple-100">180°</button>
                    </div>
                </div>
                
                <div class="mb-3">
                    <div class="text-xs text-slate-500 mb-2 font-semibold">🔧 AJUSTEMENT FIN</div>
                    <div class="flex gap-1">
                        <button onclick="rotateByDelta(-10)" class="flex-1 py-2 bg-purple-100 text-purple-700 rounded text-xs font-bold hover:bg-purple-200">-10°</button>
                        <button onclick="rotateByDelta(-5)" class="flex-1 py-2 bg-purple-100 text-purple-700 rounded text-xs font-bold hover:bg-purple-200">-5°</button>
                        <button onclick="rotateByDelta(-1)" class="flex-1 py-2 bg-purple-100 text-purple-700 rounded text-xs font-bold hover:bg-purple-200">-1°</button>
                        <button onclick="rotateByDelta(1)" class="flex-1 py-2 bg-purple-100 text-purple-700 rounded text-xs font-bold hover:bg-purple-200">+1°</button>
                        <button onclick="rotateByDelta(5)" class="flex-1 py-2 bg-purple-100 text-purple-700 rounded text-xs font-bold hover:bg-purple-200">+5°</button>
                        <button onclick="rotateByDelta(10)" class="flex-1 py-2 bg-purple-100 text-purple-700 rounded text-xs font-bold hover:bg-purple-200">+10°</button>
                    </div>
                </div>
                
                <div class="mb-3 p-2 bg-orange-50 rounded-lg border border-orange-200">
                    <div class="text-xs text-orange-700">
                        <i class="fas fa-info-circle mr-1"></i>
                        <strong>Astuce:</strong> Glissez la <span class="bg-purple-600 text-white px-1 rounded">poignée violette</span> sur la carte pour faire pivoter librement.
                    </div>
                </div>
                
                <div class="flex gap-2">
                    <button onclick="applyRotation()" class="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-all">
                        <i class="fas fa-check mr-1"></i> Appliquer & Sauvegarder
                    </button>
                    <button onclick="hideRotationControls(); setTool('select')" class="bg-slate-400 text-white px-4 py-3 rounded-lg font-bold hover:bg-slate-500 transition-all">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            \`
            
            // Prevent map interactions on panel
            L.DomEvent.disableClickPropagation(div)
            L.DomEvent.disableScrollPropagation(div)
            
            return div
        }
        rotationPanel.addTo(map)
        
        // Setup slider and input listeners
        setTimeout(() => {
            const slider = document.getElementById('rotationSlider')
            
            if (slider) {
                slider.addEventListener('input', (e) => {
                    let angle = parseInt(e.target.value)
                    if (angle < 0) angle += 360
                    updateZoneRotationWithDisplay(zone.id, angle)
                })
            }
        }, 100)
        
        // Create rotation handle on map
        createRotationHandle(zone)
        
        // Create guide line from center to handle
        createRotationGuideLine(zone)
        
        // Highlight the zone being rotated
        sr.polygon.setStyle({ weight: 4, dashArray: '8,4' })
    }
    
    function updateZoneRotationWithDisplay(zoneId, angle) {
        updateZoneRotation(zoneId, angle)
        
        // Update display
        const display = document.getElementById('rotationDisplay')
        if (display) display.textContent = Math.round(angle) + '°'
        
        // Update slider
        const slider = document.getElementById('rotationSlider')
        if (slider) slider.value = angle > 180 ? angle - 360 : angle
        
        // Update handle position
        if (selectedZone && selectedZone.id === zoneId) {
            createRotationHandle(selectedZone)
            createRotationGuideLine(selectedZone)
        }
    }
    
    function createRotationGuideLine(zone) {
        if (rotationGuideLine) {
            map.removeLayer(rotationGuideLine)
        }
        
        const sr = stringRectangles[zone.id]
        if (!sr) return
        
        const currentRotation = zoneRotations[zone.id] || 0
        const handleDistance = Math.max(sr.halfWidth, sr.halfHeight) * 1.8
        const handleAngle = currentRotation * Math.PI / 180
        
        const handleLat = sr.center.lat + handleDistance * Math.cos(handleAngle)
        const handleLng = sr.center.lng + handleDistance * Math.sin(handleAngle)
        
        rotationGuideLine = L.polyline([
            [sr.center.lat, sr.center.lng],
            [handleLat, handleLng]
        ], {
            color: '#7c3aed',
            weight: 2,
            dashArray: '8,4',
            opacity: 0.7
        }).addTo(map)
    }
    
    function hideRotationControls() {
        if (rotationPanel) {
            map.removeControl(rotationPanel)
            rotationPanel = null
        }
        if (rotationHandle) {
            map.removeLayer(rotationHandle)
            rotationHandle = null
        }
        if (rotationGuideLine) {
            map.removeLayer(rotationGuideLine)
            rotationGuideLine = null
        }
        if (rotationIndicator) {
            map.removeLayer(rotationIndicator)
            rotationIndicator = null
        }
        // Remove corner handles
        cornerHandles.forEach(h => map.removeLayer(h))
        cornerHandles = []
        
        // Reset zone style if it was highlighted
        if (selectedZone && stringRectangles[selectedZone.id]) {
            stringRectangles[selectedZone.id].polygon.setStyle({ weight: 2, dashArray: null })
        }
    }
    
    function createRotationHandle(zone) {
        if (rotationHandle) {
            map.removeLayer(rotationHandle)
        }
        
        const sr = stringRectangles[zone.id]
        if (!sr) return
        
        const currentRotation = zoneRotations[zone.id] || 0
        const handleDistance = Math.max(sr.halfWidth, sr.halfHeight) * 1.8
        const handleAngle = currentRotation * Math.PI / 180
        
        const handleLat = sr.center.lat + handleDistance * Math.cos(handleAngle)
        const handleLng = sr.center.lng + handleDistance * Math.sin(handleAngle)
        
        // Create a more visible handle with rotation icon
        const handleIcon = L.divIcon({
            className: '',
            html: '<div class="rotation-handle" style="display:flex;align-items:center;justify-content:center;"><i class="fas fa-sync-alt" style="font-size:10px;color:white;"></i></div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        })
        
        rotationHandle = L.marker([handleLat, handleLng], {
            icon: handleIcon,
            draggable: true,
            zIndexOffset: 1000
        }).addTo(map)
        
        // Bind tooltip to show angle during drag
        rotationHandle.bindTooltip(Math.round(currentRotation) + '°', {
            permanent: true,
            direction: 'top',
            offset: [0, -15],
            className: 'rotation-indicator'
        })
        
        rotationHandle.on('drag', (e) => {
            const handlePos = e.target.getLatLng()
            const angle = Math.atan2(
                handlePos.lng - sr.center.lng,
                handlePos.lat - sr.center.lat
            ) * 180 / Math.PI
            
            let normalizedAngle = ((angle % 360) + 360) % 360
            
            // Snapping to common angles (hold Shift to disable)
            if (!window.event?.shiftKey) {
                const snapAngles = [0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, 195, 210, 225, 240, 255, 270, 285, 300, 315, 330, 345]
                const snapTolerance = 3
                for (const snap of snapAngles) {
                    if (Math.abs(normalizedAngle - snap) < snapTolerance) {
                        normalizedAngle = snap
                        break
                    }
                }
            }
            
            // Update tooltip
            rotationHandle.setTooltipContent(Math.round(normalizedAngle) + '°')
            
            // Update guide line in real-time
            if (rotationGuideLine) {
                rotationGuideLine.setLatLngs([
                    [sr.center.lat, sr.center.lng],
                    [handlePos.lat, handlePos.lng]
                ])
            }
            
            updateZoneRotationWithDisplay(zone.id, normalizedAngle)
        })
        
        rotationHandle.on('dragend', () => {
            // Re-position handle at correct distance
            createRotationHandle(zone)
            createRotationGuideLine(zone)
        })
    }
    
    function setRotationAngle(angle) {
        if (!selectedZone) return
        
        updateZoneRotationWithDisplay(selectedZone.id, angle)
        createRotationHandle(selectedZone)
        createRotationGuideLine(selectedZone)
    }
    
    function rotateByDelta(delta) {
        if (!selectedZone) return
        
        const currentAngle = zoneRotations[selectedZone.id] || 0
        let newAngle = (currentAngle + delta) % 360
        if (newAngle < 0) newAngle += 360
        
        setRotationAngle(Math.round(newAngle))
    }
    
    function updateZoneRotation(zoneId, angle) {
        const sr = stringRectangles[zoneId]
        if (!sr) return
        
        zoneRotations[zoneId] = angle
        sr.rotation = angle
        
        // Recalculate corners with new rotation
        const corners = getRotatedCorners(sr.center, sr.halfWidth, sr.halfHeight, angle)
        sr.polygon.setLatLngs(corners)
    }
    
    async function applyRotation() {
        if (!selectedZone) return
        
        const sr = stringRectangles[selectedZone.id]
        if (!sr) return
        
        showNotification('Sauvegarde de la rotation...', 'info')
        
        try {
            await saveZonePositionWithRotation(
                selectedZone.id, 
                sr.center, 
                sr.halfWidth, 
                sr.halfHeight, 
                sr.rotation
            )
            
            showNotification('Rotation sauvegardée et GPS recalculé!', 'success')
            hideRotationControls()
            setTool('select')
        } catch (err) {
            console.error('Error saving rotation:', err)
            showNotification('Erreur lors de la sauvegarde', 'error')
        }
    }
    
    async function saveZonePositionWithRotation(zoneId, center, halfWidth, halfHeight, rotation) {
        // Calculate bounds for storage (unrotated for compatibility)
        const bounds = [
            [center.lat - halfHeight, center.lng - halfWidth],
            [center.lat + halfHeight, center.lng + halfWidth]
        ]
        
        // Store rotation angle and polygon data
        const polygonData = {
            bounds: bounds,
            rotation: rotation,
            center: { lat: center.lat, lng: center.lng },
            halfWidth: halfWidth,
            halfHeight: halfHeight
        }
        
        // 1. Save zone position with rotation data
        await fetch('/api/pv/plants/' + PLANT_ID + '/zones/' + zoneId, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                roof_polygon: JSON.stringify(polygonData)
            })
        })
        
        // 2. Calculate GPS coordinates for modules
        const gpsRes = await fetch('/api/pv/plants/' + PLANT_ID + '/zones/' + zoneId + '/calculate-gps', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rotation: rotation })
        })
        const gpsData = await gpsRes.json()
        
        if (gpsData.success) {
            showNotification(gpsData.message || 'GPS calculé', 'success')
        }
    }
    
    // Dessin de rectangle pour positionner une zone
    function initDrawTool() {
        map.on('mousedown', function(e) {
            if (currentTool !== 'draw') return
            if (!selectedZone) {
                showNotification('Sélectionnez d\\'abord une zone dans la liste', 'error')
                return
            }
            
            drawStartPoint = e.latlng
            map.dragging.disable()
        })
        
        map.on('mousemove', function(e) {
            if (currentTool !== 'draw' || !drawStartPoint) return
            
            const bounds = [
                [Math.min(drawStartPoint.lat, e.latlng.lat), Math.min(drawStartPoint.lng, e.latlng.lng)],
                [Math.max(drawStartPoint.lat, e.latlng.lat), Math.max(drawStartPoint.lng, e.latlng.lng)]
            ]
            
            if (drawRect) {
                drawRect.setBounds(bounds)
            } else {
                drawRect = L.rectangle(bounds, {
                    color: '#7c3aed',
                    weight: 2,
                    fillColor: '#7c3aed',
                    fillOpacity: 0.3,
                    dashArray: '5,5'
                }).addTo(map)
            }
        })
        
        map.on('mouseup', async function(e) {
            if (currentTool !== 'draw' || !drawStartPoint) return
            
            map.dragging.enable()
            
            if (!drawRect) {
                drawStartPoint = null
                return
            }
            
            const bounds = drawRect.getBounds()
            const boundsArray = [
                [bounds.getSouth(), bounds.getWest()],
                [bounds.getNorth(), bounds.getEast()]
            ]
            
            // Supprimer l'ancien rectangle de la zone si existe
            if (stringRectangles[selectedZone.id]) {
                map.removeLayer(stringRectangles[selectedZone.id].polygon)
                map.removeLayer(stringRectangles[selectedZone.id].marker)
                delete stringRectangles[selectedZone.id]
            }
            
            // Supprimer le rectangle de dessin temporaire
            map.removeLayer(drawRect)
            drawRect = null
            drawStartPoint = null
            
            // Créer le rectangle permanent
            createStringRectangle(selectedZone, boundsArray)
            
            // Sauvegarder + calculer GPS
            await saveZonePosition(selectedZone.id, boundsArray)
            
            showNotification('Zone "' + selectedZone.zone_name + '" positionnée!', 'success')
            
            // Passer en mode sélection
            setTool('select')
        })
    }
    
    // ========================================
    // SAVE & EXPORT
    // ========================================
    
    async function saveLayout() {
        showNotification('Sauvegarde en cours...', 'info')
        
        // Save is automatic when moving strings
        showNotification('Layout sauvegardé!', 'success')
    }
    
    async function calculateAllGPS() {
        showNotification('Calcul GPS en cours...', 'info')
        
        try {
            const res = await fetch('/api/pv/plants/' + PLANT_ID + '/calculate-all-gps', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            })
            const data = await res.json()
            
            if (data.success) {
                showNotification(data.zones_processed + ' zones, ' + data.total_modules + ' modules géolocalisés', 'success')
                
                // Recentrer la carte sur le nouveau centre
                if (data.plant_center) {
                    map.setView([data.plant_center.lat, data.plant_center.lng], map.getZoom())
                }
            } else {
                showNotification('Erreur: ' + (data.error || 'Calcul GPS échoué'), 'error')
            }
        } catch (err) {
            console.error('GPS calculation error:', err)
            showNotification('Erreur réseau', 'error')
        }
    }
    
    // Importer les modules depuis l'audit EL lié vers toutes les zones PV
    async function importELModules(auditToken) {
        if (!zonesData || zonesData.length === 0) {
            showNotification('Aucune zone disponible', 'error')
            return
        }
        
        showNotification('Import des modules EL en cours...', 'info')
        
        let totalImported = 0
        let errors = []
        
        for (const zone of zonesData) {
            try {
                const res = await fetch('/api/pv/plants/' + PLANT_ID + '/zones/' + zone.id + '/import-el-modules', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                })
                const data = await res.json()
                
                if (data.success) {
                    totalImported += data.imported || 0
                } else if (data.existing_count) {
                    // Modules existent déjà, synchroniser les statuts
                    const syncRes = await fetch('/api/pv/plants/' + PLANT_ID + '/zones/' + zone.id + '/sync-from-el', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                    })
                    const syncData = await syncRes.json()
                    if (syncData.success) {
                        totalImported += syncData.stats?.synced || 0
                    }
                }
            } catch (err) {
                errors.push(zone.zone_name)
            }
        }
        
        if (totalImported > 0) {
            showNotification(totalImported + ' modules importés/synchronisés', 'success')
            // Recalculer le GPS
            await calculateAllGPS()
            // Recharger les modules
            await loadAllModules()
            updateStats()
        } else if (errors.length > 0) {
            showNotification('Erreurs: ' + errors.join(', '), 'error')
        } else {
            showNotification('Aucun module à importer', 'info')
        }
    }
    
    async function exportPlan() {
        showNotification('Génération du plan...', 'info')
        
        // Hide controls temporarily
        document.querySelector('.leaflet-control-container').style.display = 'none'
        
        try {
            const canvas = await html2canvas(document.getElementById('map'), {
                useCORS: true,
                scale: 2
            })
            
            // Create download link
            const link = document.createElement('a')
            link.download = 'plan-centrale-' + (plantData?.plant_name || 'export') + '.png'
            link.href = canvas.toDataURL('image/png')
            link.click()
            
            showNotification('Plan exporté!', 'success')
        } catch (err) {
            console.error('Export error:', err)
            showNotification('Erreur export: ' + err.message, 'error')
        } finally {
            document.querySelector('.leaflet-control-container').style.display = ''
        }
    }
    
    // ========================================
    // UTILS
    // ========================================
    
    function showNotification(message, type = 'info') {
        const colors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            info: 'bg-blue-500'
        }
        
        const notif = document.createElement('div')
        notif.className = \`fixed bottom-4 right-4 \${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-pulse\`
        notif.innerHTML = message
        document.body.appendChild(notif)
        
        setTimeout(() => notif.remove(), 3000)
    }
    
    // Initialize
    document.addEventListener('DOMContentLoaded', init)
</script>
</body>
</html>
  `
}
