import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()

app.use('/api/*', cors())
app.use('/static/*', serveStatic({ root: './public' }))

// Interface pour les données de panneau individuel
interface SolarPanel {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  status: 'ok' | 'defaut_el' | 'defaut_thermo' | 'defaut_iv' | 'defaut_critique';
  power: number;
  model: string;
  manufacturer: string;
  defects: string[];
  selected: boolean;
}

// Interface pour la configuration de centrale
interface SolarFarm {
  id: string;
  name: string;
  address: string;
  coordinates: { lat: number; lng: number; };
  panels: SolarPanel[];
  configuration: {
    rows: number;
    columns: number;
    orientation: number;
    inclination: number;
    spacing: number;
  };
  totalPower: number;
  auditData: {
    defectCount: number;
    efficiency: number;
    recommendations: string[];
  };
}

app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>DiagPV Hub - Modélisation 3D Professional</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script src="https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.min.js"></script>
        <style>
            .solar-panel-3d {
                position: absolute;
                background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #1e40af 100%);
                border: 1px solid #1e40af;
                border-radius: 2px;
                transform-style: preserve-3d;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .solar-panel-3d:hover {
                transform: translateZ(5px);
                box-shadow: 0 5px 15px rgba(59, 130, 246, 0.3);
            }
            
            .solar-panel-3d.selected {
                border: 2px solid #fbbf24;
                box-shadow: 0 0 10px rgba(251, 191, 36, 0.5);
            }
            
            .solar-panel-3d.defaut_el {
                background: linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #dc2626 100%);
            }
            
            .solar-panel-3d.defaut_thermo {
                background: linear-gradient(135deg, #ea580c 0%, #f97316 50%, #ea580c 100%);
            }
            
            .solar-panel-3d.defaut_iv {
                background: linear-gradient(135deg, #7c2d12 0%, #a16207 50%, #7c2d12 100%);
            }
            
            .solar-panel-3d.defaut_critique {
                background: linear-gradient(135deg, #7f1d1d 0%, #dc2626 50%, #7f1d1d 100%);
                animation: pulse 2s infinite;
            }
            
            .panel-grid {
                background-image: 
                    linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px);
                background-size: 12px 12px;
                width: 100%;
                height: 100%;
                position: absolute;
                top: 0;
                left: 0;
                pointer-events: none;
            }
            
            .panel-shadow {
                position: absolute;
                background: rgba(0, 0, 0, 0.2);
                border-radius: 2px;
                transform: translate(3px, 3px) skew(-10deg, -2deg);
                z-index: -1;
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }
            
            .farm-3d-container {
                position: relative;
                width: 100%;
                height: 100%;
                perspective: 1000px;
                overflow: hidden;
            }
            
            .audit-panel {
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                max-height: calc(100vh - 100px);
                overflow-y: auto;
            }
            
            .terrain-viewer {
                position: relative;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            }
            
            .panel-info-tooltip {
                position: absolute;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 12px;
                white-space: nowrap;
                pointer-events: none;
                z-index: 1000;
                transform: translate(-50%, -100%);
                margin-top: -10px;
            }
            
            .selection-info {
                position: absolute;
                top: 10px;
                right: 10px;
                background: rgba(255, 255, 255, 0.95);
                padding: 12px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                font-size: 14px;
                z-index: 1000;
            }
        </style>
    </head>
    <body class="bg-gray-50">
        <!-- Header DiagPV -->
        <header class="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white shadow-xl">
            <div class="container mx-auto px-6 py-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <div class="bg-yellow-500 p-2 rounded-lg">
                            <i class="fas fa-solar-panel text-xl"></i>
                        </div>
                        <div>
                            <h1 class="text-2xl font-bold">DiagPV Professional</h1>
                            <p class="text-blue-200 text-sm">Modélisation 3D & Audit Intégré</p>
                        </div>
                    </div>
                    <div class="flex items-center space-x-4">
                        <button id="saveProject" class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors">
                            <i class="fas fa-save mr-2"></i>Sauvegarder
                        </button>
                        <button id="generateReport" class="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg transition-colors">
                            <i class="fas fa-file-pdf mr-2"></i>Rapport
                        </button>
                    </div>
                </div>
            </div>
        </header>

        <!-- Interface Principale -->
        <div class="container mx-auto px-6 py-6">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 h-screen">
                
                <!-- Panel Audit Gauche -->
                <div class="lg:col-span-1 audit-panel p-6">
                    <h2 class="text-xl font-bold text-gray-800 mb-6 flex items-center">
                        <i class="fas fa-clipboard-check mr-3 text-blue-600"></i>
                        Audit Électroluminescence
                    </h2>
                    
                    <!-- Recherche d'adresse -->
                    <div class="mb-6">
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Adresse de la centrale
                        </label>
                        <div class="flex space-x-2">
                            <input type="text" id="addressInput" 
                                   placeholder="Ex: 123 Rue de la République, Lyon"
                                   class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            <button id="searchAddress" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                                <i class="fas fa-search"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Configuration Centrale -->
                    <div class="mb-6 p-4 bg-gray-50 rounded-lg">
                        <h3 class="font-semibold text-gray-800 mb-3">Configuration Détectée</h3>
                        <div class="space-y-2 text-sm">
                            <div class="flex justify-between">
                                <span class="text-gray-600">Type terrain:</span>
                                <span id="terrainType" class="font-medium">Sol agricole</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Panneaux:</span>
                                <span id="panelCount" class="font-medium">300 × JKM-450M-60HL4</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Puissance:</span>
                                <span id="totalPower" class="font-medium">135 kWc</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Configuration:</span>
                                <span id="configuration" class="font-medium">6L × 50C</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Orientation:</span>
                                <span id="orientation" class="font-medium">180° / 10°</span>
                            </div>
                        </div>
                    </div>

                    <!-- Sélection Panneaux -->
                    <div class="mb-6">
                        <h3 class="font-semibold text-gray-800 mb-3 flex items-center">
                            <i class="fas fa-mouse-pointer mr-2 text-blue-600"></i>
                            Sélection Panneaux
                        </h3>
                        <div id="selectionInfo" class="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                            <div class="flex justify-between mb-2">
                                <span>Panneaux sélectionnés:</span>
                                <span id="selectedCount" class="font-medium">0</span>
                            </div>
                            <div class="flex space-x-2 mb-3">
                                <button id="selectAll" class="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">
                                    Tout sélectionner
                                </button>
                                <button id="clearSelection" class="text-xs bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-700">
                                    Désélectionner
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Statuts de Défauts -->
                    <div class="mb-6">
                        <h3 class="font-semibold text-gray-800 mb-3">Statut des Panneaux Sélectionnés</h3>
                        <div class="grid grid-cols-2 gap-2">
                            <button class="status-btn bg-green-100 text-green-800 p-3 rounded-lg border hover:bg-green-200 transition-colors" data-status="ok">
                                <i class="fas fa-check-circle mb-1"></i>
                                <div class="text-xs font-medium">OK</div>
                            </button>
                            <button class="status-btn bg-red-100 text-red-800 p-3 rounded-lg border hover:bg-red-200 transition-colors" data-status="defaut_el">
                                <i class="fas fa-exclamation-triangle mb-1"></i>
                                <div class="text-xs font-medium">Défaut EL</div>
                            </button>
                            <button class="status-btn bg-orange-100 text-orange-800 p-3 rounded-lg border hover:bg-orange-200 transition-colors" data-status="defaut_thermo">
                                <i class="fas fa-thermometer-half mb-1"></i>
                                <div class="text-xs font-medium">Défaut Thermo</div>
                            </button>
                            <button class="status-btn bg-yellow-100 text-yellow-800 p-3 rounded-lg border hover:bg-yellow-200 transition-colors" data-status="defaut_iv">
                                <i class="fas fa-chart-line mb-1"></i>
                                <div class="text-xs font-medium">Défaut I-V</div>
                            </button>
                        </div>
                        <button class="status-btn w-full mt-2 bg-red-100 text-red-800 p-3 rounded-lg border hover:bg-red-200 transition-colors" data-status="defaut_critique">
                            <i class="fas fa-skull-crossbones mb-1"></i>
                            <div class="text-xs font-medium">Défaut Critique</div>
                        </button>
                    </div>

                    <!-- Statistiques Audit -->
                    <div class="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                        <h3 class="font-semibold text-gray-800 mb-3">Statistiques Audit</h3>
                        <div class="space-y-2 text-sm">
                            <div class="flex justify-between">
                                <span class="text-gray-600">Panneaux OK:</span>
                                <span id="statsOk" class="font-medium text-green-600">285 (95%)</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Défauts EL:</span>
                                <span id="statsEl" class="font-medium text-red-600">12 (4%)</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Défauts Thermo:</span>
                                <span id="statsThermo" class="font-medium text-orange-600">3 (1%)</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Efficacité:</span>
                                <span id="efficiency" class="font-medium text-blue-600">97.2%</span>
                            </div>
                        </div>
                    </div>

                    <!-- Actions Rapides -->
                    <div class="space-y-3">
                        <button id="autoDetectDefects" class="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors">
                            <i class="fas fa-magic mr-2"></i>Auto-détection IA
                        </button>
                        <button id="exportData" class="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">
                            <i class="fas fa-download mr-2"></i>Exporter Données
                        </button>
                    </div>
                </div>

                <!-- Viewer 3D Terrain -->
                <div class="lg:col-span-2 terrain-viewer">
                    <div id="mapContainer" class="w-full h-full relative">
                        <!-- Carte Leaflet -->
                    </div>
                    
                    <!-- Overlay 3D Solar Farm -->
                    <div id="solarFarmOverlay" class="farm-3d-container absolute inset-0 pointer-events-none">
                        <!-- Panneaux 3D générés dynamiquement -->
                    </div>
                    
                    <!-- Info Sélection -->
                    <div class="selection-info">
                        <div class="text-sm font-medium text-gray-800">
                            Sélection: <span id="selectionCount">0</span> panneaux
                        </div>
                        <div class="text-xs text-gray-600 mt-1">
                            Clic: sélection simple | Ctrl+Clic: sélection multiple
                        </div>
                    </div>
                    
                    <!-- Contrôles 3D -->
                    <div class="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3">
                        <div class="text-sm font-medium mb-2">Vue 3D</div>
                        <div class="flex space-x-2">
                            <button id="viewTop" class="text-xs bg-gray-200 px-3 py-1 rounded hover:bg-gray-300">
                                Vue Dessus
                            </button>
                            <button id="viewPerspective" class="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
                                Perspective
                            </button>
                            <button id="viewSide" class="text-xs bg-gray-200 px-3 py-1 rounded hover:bg-gray-300">
                                Profil
                            </button>
                        </div>
                    </div>
                    
                    <!-- Tooltip Info Panneau -->
                    <div id="panelTooltip" class="panel-info-tooltip hidden"></div>
                </div>
            </div>
        </div>

        <script>
            // État global de l'application
            let currentSolarFarm = {
                id: 'farm_' + Date.now(),
                name: '',
                address: '',
                coordinates: { lat: 46.603354, lng: 1.888334 }, // Centre France
                panels: [],
                configuration: {
                    rows: 6,
                    columns: 50,
                    orientation: 180,
                    inclination: 10,
                    spacing: 2
                },
                totalPower: 0,
                auditData: {
                    defectCount: 0,
                    efficiency: 100,
                    recommendations: []
                }
            };

            let selectedPanels = new Set();
            let map = null;
            let solarFarmLayer = null;

            // Initialisation de la carte
            function initializeMap() {
                map = L.map('mapContainer').setView([currentSolarFarm.coordinates.lat, currentSolarFarm.coordinates.lng], 18);
                
                // Couche satellite haute résolution
                L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                    attribution: 'Esri, DigitalGlobe, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community',
                    maxZoom: 20
                }).addTo(map);
                
                generateSolarFarm();
            }

            // Génération de la centrale solaire
            function generateSolarFarm() {
                const { rows, columns, spacing } = currentSolarFarm.configuration;
                currentSolarFarm.panels = [];
                
                const panelWidth = 2.0; // mètres
                const panelHeight = 1.0; // mètres
                const panelPower = 450; // Watts - JKM-450M-60HL4
                
                const startLat = currentSolarFarm.coordinates.lat;
                const startLng = currentSolarFarm.coordinates.lng;
                
                for (let row = 0; row < rows; row++) {
                    for (let col = 0; col < columns; col++) {
                        const panelId = `panel_${row}_${col}`;
                        
                        // Calcul position GPS précise
                        const offsetLat = (row * (panelHeight + spacing)) / 111320; // Conversion mètres -> degrés lat
                        const offsetLng = (col * (panelWidth + spacing)) / (111320 * Math.cos(startLat * Math.PI / 180)); // Conversion mètres -> degrés lng
                        
                        const panel = {
                            id: panelId,
                            x: col,
                            y: row,
                            lat: startLat - offsetLat,
                            lng: startLng + offsetLng,
                            width: panelWidth,
                            height: panelHeight,
                            rotation: currentSolarFarm.configuration.orientation,
                            status: 'ok',
                            power: panelPower,
                            model: 'JKM-450M-60HL4 Tiger Pro 60HC',
                            manufacturer: 'JinkoSolar Holding Co. Ltd',
                            defects: [],
                            selected: false
                        };
                        
                        currentSolarFarm.panels.push(panel);
                    }
                }
                
                // Calcul puissance totale
                currentSolarFarm.totalPower = currentSolarFarm.panels.length * panelPower / 1000; // kWc
                
                updateUI();
                render3DSolarFarm();
            }

            // Rendu 3D des panneaux solaires
            function render3DSolarFarm() {
                const overlay = document.getElementById('solarFarmOverlay');
                overlay.innerHTML = '';
                
                currentSolarFarm.panels.forEach(panel => {
                    const panelElement = create3DPanel(panel);
                    overlay.appendChild(panelElement);
                });
                
                // Activation des interactions
                overlay.style.pointerEvents = 'auto';
            }

            // Création d'un panneau 3D
            function create3DPanel(panel) {
                const panelDiv = document.createElement('div');
                panelDiv.className = `solar-panel-3d ${panel.status}`;
                panelDiv.id = panel.id;
                panelDiv.dataset.panelId = panel.id;
                
                // Conversion coordonnées GPS -> pixels écran
                const point = map.latLngToContainerPoint([panel.lat, panel.lng]);
                
                // Dimensions 3D avec perspective
                const width = 40; // pixels
                const height = 20; // pixels
                const perspective = Math.cos(currentSolarFarm.configuration.inclination * Math.PI / 180);
                
                panelDiv.style.left = (point.x - width/2) + 'px';
                panelDiv.style.top = (point.y - height/2) + 'px';
                panelDiv.style.width = width + 'px';
                panelDiv.style.height = (height * perspective) + 'px';
                panelDiv.style.transform = `rotateX(${currentSolarFarm.configuration.inclination}deg) rotateZ(${panel.rotation - 180}deg)`;
                
                // Grille du panneau
                const grid = document.createElement('div');
                grid.className = 'panel-grid';
                panelDiv.appendChild(grid);
                
                // Ombre
                const shadow = document.createElement('div');
                shadow.className = 'panel-shadow';
                shadow.style.width = width + 'px';
                shadow.style.height = (height * perspective) + 'px';
                panelDiv.appendChild(shadow);
                
                // Événements de sélection
                panelDiv.addEventListener('click', (e) => handlePanelClick(e, panel));
                panelDiv.addEventListener('mouseover', (e) => showPanelTooltip(e, panel));
                panelDiv.addEventListener('mouseleave', hidePanelTooltip);
                
                return panelDiv;
            }

            // Gestion clic panneau
            function handlePanelClick(event, panel) {
                event.stopPropagation();
                
                if (event.ctrlKey || event.metaKey) {
                    // Sélection multiple
                    if (selectedPanels.has(panel.id)) {
                        selectedPanels.delete(panel.id);
                        panel.selected = false;
                    } else {
                        selectedPanels.add(panel.id);
                        panel.selected = true;
                    }
                } else {
                    // Sélection simple
                    selectedPanels.clear();
                    currentSolarFarm.panels.forEach(p => p.selected = false);
                    selectedPanels.add(panel.id);
                    panel.selected = true;
                }
                
                updatePanelSelection();
                updateSelectionUI();
            }

            // Mise à jour visuelle sélection
            function updatePanelSelection() {
                currentSolarFarm.panels.forEach(panel => {
                    const element = document.getElementById(panel.id);
                    if (element) {
                        if (panel.selected) {
                            element.classList.add('selected');
                        } else {
                            element.classList.remove('selected');
                        }
                    }
                });
            }

            // Tooltip panneau
            function showPanelTooltip(event, panel) {
                const tooltip = document.getElementById('panelTooltip');
                tooltip.innerHTML = `
                    <strong>${panel.model}</strong><br>
                    Position: ${panel.x + 1}×${panel.y + 1}<br>
                    Puissance: ${panel.power}W<br>
                    Statut: ${getStatusLabel(panel.status)}<br>
                    ${panel.defects.length > 0 ? 'Défauts: ' + panel.defects.length : ''}
                `;
                tooltip.style.left = event.pageX + 'px';
                tooltip.style.top = event.pageY + 'px';
                tooltip.classList.remove('hidden');
            }

            function hidePanelTooltip() {
                document.getElementById('panelTooltip').classList.add('hidden');
            }

            function getStatusLabel(status) {
                const labels = {
                    'ok': 'OK',
                    'defaut_el': 'Défaut EL',
                    'defaut_thermo': 'Défaut Thermographie',
                    'defaut_iv': 'Défaut I-V',
                    'defaut_critique': 'Défaut Critique'
                };
                return labels[status] || 'Inconnu';
            }

            // Changement de statut des panneaux sélectionnés
            function changeSelectedPanelsStatus(newStatus) {
                selectedPanels.forEach(panelId => {
                    const panel = currentSolarFarm.panels.find(p => p.id === panelId);
                    if (panel) {
                        panel.status = newStatus;
                        
                        // Mise à jour élément DOM
                        const element = document.getElementById(panelId);
                        if (element) {
                            element.className = `solar-panel-3d selected ${newStatus}`;
                        }
                    }
                });
                
                calculateStatistics();
                updateUI();
                saveToBackupSystem();
            }

            // Calcul statistiques
            function calculateStatistics() {
                const stats = {
                    ok: 0,
                    defaut_el: 0,
                    defaut_thermo: 0,
                    defaut_iv: 0,
                    defaut_critique: 0
                };
                
                currentSolarFarm.panels.forEach(panel => {
                    stats[panel.status]++;
                });
                
                const totalPanels = currentSolarFarm.panels.length;
                const defectCount = totalPanels - stats.ok;
                
                currentSolarFarm.auditData.defectCount = defectCount;
                currentSolarFarm.auditData.efficiency = Math.round((stats.ok / totalPanels) * 100 * 10) / 10;
                
                return stats;
            }

            // Mise à jour interface
            function updateUI() {
                const stats = calculateStatistics();
                const totalPanels = currentSolarFarm.panels.length;
                
                // Configuration
                document.getElementById('panelCount').textContent = `${totalPanels} × ${currentSolarFarm.panels[0]?.model || 'JKM-450M'}`;
                document.getElementById('totalPower').textContent = `${currentSolarFarm.totalPower} kWc`;
                document.getElementById('configuration').textContent = `${currentSolarFarm.configuration.rows}L × ${currentSolarFarm.configuration.columns}C`;
                document.getElementById('orientation').textContent = `${currentSolarFarm.configuration.orientation}° / ${currentSolarFarm.configuration.inclination}°`;
                
                // Statistiques
                document.getElementById('statsOk').textContent = `${stats.ok} (${Math.round(stats.ok/totalPanels*100)}%)`;
                document.getElementById('statsEl').textContent = `${stats.defaut_el} (${Math.round(stats.defaut_el/totalPanels*100)}%)`;
                document.getElementById('statsThermo').textContent = `${stats.defaut_thermo} (${Math.round(stats.defaut_thermo/totalPanels*100)}%)`;
                document.getElementById('efficiency').textContent = `${currentSolarFarm.auditData.efficiency}%`;
            }

            function updateSelectionUI() {
                document.getElementById('selectedCount').textContent = selectedPanels.size;
                document.getElementById('selectionCount').textContent = selectedPanels.size;
            }

            // Recherche et géolocalisation d'adresse
            async function searchAndLocalizeTerrain() {
                const address = document.getElementById('addressInput').value.trim();
                if (!address) return;
                
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=fr`);
                    const results = await response.json();
                    
                    if (results.length > 0) {
                        const result = results[0];
                        const lat = parseFloat(result.lat);
                        const lng = parseFloat(result.lon);
                        
                        // Mise à jour position
                        currentSolarFarm.coordinates = { lat, lng };
                        currentSolarFarm.address = result.display_name;
                        currentSolarFarm.name = address;
                        
                        // Identification type terrain
                        const terrainType = identifyTerrainType(result.display_name);
                        document.getElementById('terrainType').textContent = terrainType;
                        
                        // Centrage carte
                        map.setView([lat, lng], 18);
                        
                        // Régénération centrale
                        generateSolarFarm();
                        
                        console.log('Terrain localisé:', { lat, lng, terrain: terrainType });
                    }
                } catch (error) {
                    console.error('Erreur géocodage:', error);
                    alert('Erreur lors de la recherche d\\'adresse');
                }
            }

            function identifyTerrainType(displayName) {
                const name = displayName.toLowerCase();
                if (name.includes('roof') || name.includes('toit')) return 'Toiture résidentielle';
                if (name.includes('industrial') || name.includes('zone') || name.includes('commercial')) return 'Bâtiment commercial';
                if (name.includes('parking') || name.includes('ombrière')) return 'Ombrière parking';
                return 'Sol agricole';
            }

            // Système de sauvegarde 4 niveaux
            function saveToBackupSystem() {
                const data = {
                    timestamp: new Date().toISOString(),
                    solarFarm: currentSolarFarm,
                    selectedPanels: Array.from(selectedPanels)
                };
                
                // Niveau 1: LocalStorage
                try {
                    localStorage.setItem('diagpv_current_project', JSON.stringify(data));
                } catch (e) {
                    console.warn('LocalStorage sauvegarde échouée');
                }
                
                // Niveau 2: IndexedDB
                saveToIndexedDB(data);
                
                // Niveau 3: Cloudflare D1 (API)
                saveToCloudflareDl(data);
                
                console.log('Sauvegarde effectuée sur 4 niveaux');
            }

            async function saveToIndexedDB(data) {
                try {
                    const request = indexedDB.open('DiagPV_DB', 1);
                    request.onupgradeneeded = (e) => {
                        const db = e.target.result;
                        if (!db.objectStoreNames.contains('projects')) {
                            db.createObjectStore('projects', { keyPath: 'id' });
                        }
                    };
                    request.onsuccess = (e) => {
                        const db = e.target.result;
                        const transaction = db.transaction(['projects'], 'readwrite');
                        const store = transaction.objectStore('projects');
                        store.put({ id: currentSolarFarm.id, data: data });
                    };
                } catch (e) {
                    console.warn('IndexedDB sauvegarde échouée');
                }
            }

            async function saveToCloudflareDl(data) {
                try {
                    await fetch('/api/save-project', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                } catch (e) {
                    console.warn('Cloudflare D1 sauvegarde échouée');
                }
            }

            // Événements
            document.addEventListener('DOMContentLoaded', () => {
                initializeMap();
                
                // Recherche adresse
                document.getElementById('searchAddress').addEventListener('click', searchAndLocalizeTerrain);
                document.getElementById('addressInput').addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') searchAndLocalizeTerrain();
                });
                
                // Changement statut
                document.querySelectorAll('.status-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        if (selectedPanels.size > 0) {
                            const status = btn.dataset.status;
                            changeSelectedPanelsStatus(status);
                        } else {
                            alert('Veuillez sélectionner des panneaux à modifier');
                        }
                    });
                });
                
                // Sélection multiple
                document.getElementById('selectAll').addEventListener('click', () => {
                    selectedPanels.clear();
                    currentSolarFarm.panels.forEach(panel => {
                        selectedPanels.add(panel.id);
                        panel.selected = true;
                    });
                    updatePanelSelection();
                    updateSelectionUI();
                });
                
                document.getElementById('clearSelection').addEventListener('click', () => {
                    selectedPanels.clear();
                    currentSolarFarm.panels.forEach(panel => panel.selected = false);
                    updatePanelSelection();
                    updateSelectionUI();
                });
                
                // Sauvegarde
                document.getElementById('saveProject').addEventListener('click', saveToBackupSystem);
                
                // Redimensionnement carte
                map.on('zoomend moveend', () => {
                    render3DSolarFarm();
                });
                
                // Chargement automatique projet précédent
                loadFromBackupSystem();
            });

            async function loadFromBackupSystem() {
                try {
                    const saved = localStorage.getItem('diagpv_current_project');
                    if (saved) {
                        const data = JSON.parse(saved);
                        currentSolarFarm = data.solarFarm;
                        selectedPanels = new Set(data.selectedPanels);
                        
                        map.setView([currentSolarFarm.coordinates.lat, currentSolarFarm.coordinates.lng], 18);
                        render3DSolarFarm();
                        updateUI();
                        updateSelectionUI();
                        updatePanelSelection();
                        
                        console.log('Projet restauré depuis sauvegarde');
                    }
                } catch (e) {
                    console.warn('Chargement sauvegarde échoué');
                }
            }
        </script>
    </body>
    </html>
  `)
})

// API pour sauvegarde Cloudflare D1
app.post('/api/save-project', async (c) => {
  try {
    const data = await c.req.json()
    
    // Sauvegarde en D1 (nécessite binding database)
    if (c.env?.DB) {
      await c.env.DB.prepare(
        `INSERT OR REPLACE INTO projects (id, data, timestamp) VALUES (?, ?, ?)`
      ).bind(
        data.solarFarm.id,
        JSON.stringify(data),
        data.timestamp
      ).run()
    }
    
    return c.json({ success: true, message: 'Projet sauvegardé' })
  } catch (error) {
    console.error('Erreur sauvegarde:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

app.get('/api/load-project/:id', async (c) => {
  try {
    const projectId = c.req.param('id')
    
    if (c.env?.DB) {
      const result = await c.env.DB.prepare(
        `SELECT * FROM projects WHERE id = ? ORDER BY timestamp DESC LIMIT 1`
      ).bind(projectId).first()
      
      if (result) {
        return c.json({ success: true, data: JSON.parse(result.data) })
      }
    }
    
    return c.json({ success: false, message: 'Projet non trouvé' }, 404)
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

export default app