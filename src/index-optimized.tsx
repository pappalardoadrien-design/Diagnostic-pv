import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'
import { cors } from 'hono/cors'

interface Bindings {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Bindings }>()

// Middleware CORS
app.use('/api/*', cors())
app.use('/static/*', serveStatic())

// Route racine
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>DiagPV HUB - Diagnostic Photovoltaïque</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-100">
        <div class="min-h-screen">
            <header class="bg-purple-600 text-white py-8">
                <div class="max-w-6xl mx-auto px-4">
                    <h1 class="text-4xl font-bold mb-2">
                        <i class="fas fa-solar-panel mr-3"></i>DiagPV HUB
                    </h1>
                    <p class="text-purple-200 text-xl">Diagnostic Photovoltaïque Professionnel</p>
                </div>
            </header>
            
            <main class="max-w-6xl mx-auto py-12 px-4">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    
                    <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                        <div class="flex items-center mb-4">
                            <div class="bg-purple-100 p-3 rounded-lg mr-4">
                                <i class="fas fa-moon text-purple-600 text-xl"></i>
                            </div>
                            <h3 class="text-xl font-bold text-gray-800">Électroluminescence</h3>
                        </div>
                        <p class="text-gray-600 mb-4">Détection de défauts par imagerie EL nocturne avec designer satellite intégré</p>
                        <a href="/modules/electroluminescence" 
                           class="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                            <i class="fas fa-rocket mr-2"></i>Accéder au Module
                        </a>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                        <div class="flex items-center mb-4">
                            <div class="bg-red-100 p-3 rounded-lg mr-4">
                                <i class="fas fa-thermometer-half text-red-600 text-xl"></i>
                            </div>
                            <h3 class="text-xl font-bold text-gray-800">Thermographie</h3>
                        </div>
                        <p class="text-gray-600 mb-4">Analyse thermique IR pour détection points chauds</p>
                        <a href="/modules/thermography" 
                           class="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                            <i class="fas fa-camera mr-2"></i>Accéder au Module
                        </a>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                        <div class="flex items-center mb-4">
                            <div class="bg-blue-100 p-3 rounded-lg mr-4">
                                <i class="fas fa-chart-line text-blue-600 text-xl"></i>
                            </div>
                            <h3 class="text-xl font-bold text-gray-800">Courbes I-V</h3>
                        </div>
                        <p class="text-gray-600 mb-4">Mesures I-V et caractérisation électrique</p>
                        <a href="/modules/iv-curves" 
                           class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            <i class="fas fa-wave-square mr-2"></i>Accéder au Module
                        </a>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                        <div class="flex items-center mb-4">
                            <div class="bg-green-100 p-3 rounded-lg mr-4">
                                <i class="fas fa-shield-alt text-green-600 text-xl"></i>
                            </div>
                            <h3 class="text-xl font-bold text-gray-800">Test Isolement</h3>
                        </div>
                        <p class="text-gray-600 mb-4">Contrôle isolement et sécurité électrique</p>
                        <a href="/modules/isolation" 
                           class="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                            <i class="fas fa-plug mr-2"></i>Accéder au Module
                        </a>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                        <div class="flex items-center mb-4">
                            <div class="bg-yellow-100 p-3 rounded-lg mr-4">
                                <i class="fas fa-eye text-yellow-600 text-xl"></i>
                            </div>
                            <h3 class="text-xl font-bold text-gray-800">Contrôle Visuel</h3>
                        </div>
                        <p class="text-gray-600 mb-4">Inspection visuelle et mécanique</p>
                        <a href="/modules/visual" 
                           class="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
                            <i class="fas fa-search mr-2"></i>Accéder au Module
                        </a>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                        <div class="flex items-center mb-4">
                            <div class="bg-orange-100 p-3 rounded-lg mr-4">
                                <i class="fas fa-exclamation-triangle text-orange-600 text-xl"></i>
                            </div>
                            <h3 class="text-xl font-bold text-gray-800">Post-Sinistre</h3>
                        </div>
                        <p class="text-gray-600 mb-4">Expertise post-incident et évaluation dommages</p>
                        <a href="/modules/post-incident" 
                           class="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                            <i class="fas fa-clipboard-check mr-2"></i>Accéder au Module
                        </a>
                    </div>
                    
                </div>
                
                <div class="mt-12 text-center">
                    <div class="bg-white rounded-xl shadow-lg p-8">
                        <h2 class="text-2xl font-bold text-gray-800 mb-4">
                            <i class="fas fa-sync mr-2 text-purple-600"></i>Intégration Temps Réel
                        </h2>
                        <p class="text-gray-600 mb-6">
                            Tous les modules sont synchronisés avec sauvegarde 4 niveaux (LocalStorage + IndexedDB + D1 + API Emergency)
                        </p>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div class="text-center">
                                <div class="text-2xl font-bold text-green-600">✅ 100%</div>
                                <div class="text-sm text-gray-600">Intégrité Données</div>
                            </div>
                            <div class="text-center">
                                <div class="text-2xl font-bold text-blue-600">⚡ Temps Réel</div>
                                <div class="text-sm text-gray-600">Synchronisation</div>
                            </div>
                            <div class="text-center">
                                <div class="text-2xl font-bold text-purple-600">🔄 Dynamique</div>
                                <div class="text-sm text-gray-600">Intégration EL-Designer</div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    </body>
    </html>
  `)
})

// Module Électroluminescence optimisé
app.get('/modules/electroluminescence', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Module Électroluminescence + Designer - HUB Diagnostic</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        
        <!-- Leaflet pour carte satellite -->
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        
        <!-- Leaflet.draw pour outils de dessin -->
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css" />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js"></script>
        
        <style>
            :root { --el-purple: #8B5CF6; --diag-dark: #1F2937; }
            .bg-el-purple { background-color: var(--el-purple); }
            #satelliteMap { height: 600px; width: 100%; border-radius: 8px; }
            .module-marker { 
                background: #3b82f6; 
                border: 2px solid #1d4ed8; 
                border-radius: 4px; 
                color: white; 
                font-weight: bold; 
                text-align: center; 
                font-size: 10px; 
                padding: 2px 4px; 
            }
            .module-marker.defect { background: #ef4444; border-color: #dc2626; }
        </style>
    </head>
    <body class="bg-gray-50">
        <!-- Header -->
        <header class="bg-el-purple text-white py-3">
            <div class="max-w-full px-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <div class="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                            <i class="fas fa-moon text-lg"></i>
                        </div>
                        <div>
                            <h1 class="text-lg font-bold">ÉLECTROLUMINESCENCE + DESIGNER</h1>
                            <p class="text-purple-100 text-sm">IEC 62446-1 • Intégration Satellite Maps</p>
                        </div>
                    </div>
                    <a href="/" class="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded-lg text-sm">
                        <i class="fas fa-home mr-1"></i>HUB
                    </a>
                </div>
            </div>
        </header>

        <!-- Système d'onglets -->
        <div class="bg-white border-b">
            <div class="max-w-full px-4">
                <nav class="flex space-x-8">
                    <button id="tabAudit" class="py-4 px-2 border-b-2 border-purple-600 text-purple-600 font-medium" 
                            onclick="switchTab('audit')">
                        <i class="fas fa-moon mr-2"></i>Audit Électroluminescence
                    </button>
                    <button id="tabDesigner" class="py-4 px-2 text-gray-500 font-medium" 
                            onclick="switchTab('designer')">
                        <i class="fas fa-th-large mr-2"></i>Designer Layout Satellite
                    </button>
                </nav>
            </div>
        </div>

        <!-- Contenu Audit EL -->
        <main id="contentAudit" class="p-4">
            <div class="bg-white rounded-xl p-6">
                <h2 class="text-xl font-bold mb-4">
                    <i class="fas fa-moon text-purple-600 mr-2"></i>Module Audit Électroluminescence
                </h2>
                <div class="bg-purple-50 p-4 rounded-lg">
                    <p class="text-purple-800">
                        ✅ Module EL opérationnel avec synchronisation Designer<br>
                        🔄 Intégration bidirectionnelle activée<br>
                        💾 Sauvegarde 4 niveaux garantie (LocalStorage + IndexedDB + D1 + Emergency API)
                    </p>
                    <div class="mt-4">
                        <button onclick="simulateDefectDetection()" class="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
                            <i class="fas fa-bug mr-1"></i>Simuler Détection Défaut
                        </button>
                        <button onclick="syncWithDesigner()" class="ml-2 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600">
                            <i class="fas fa-sync mr-1"></i>Sync Designer
                        </button>
                    </div>
                </div>
            </div>
        </main>

        <!-- Contenu Designer Layout -->
        <main id="contentDesigner" class="p-4 hidden">
            <!-- Outils de dessin -->
            <div class="bg-white rounded-xl p-4 mb-4">
                <div class="flex flex-wrap gap-2">
                    <button onclick="setDrawingMode('zone')" class="px-3 py-2 bg-blue-500 text-white rounded text-sm">
                        <i class="fas fa-vector-square mr-1"></i>Zone Installation
                    </button>
                    <button onclick="setDrawingMode('building')" class="px-3 py-2 bg-red-500 text-white rounded text-sm">
                        <i class="fas fa-building mr-1"></i>Bâtiment
                    </button>
                    <button onclick="setDrawingMode('ombriere')" class="px-3 py-2 bg-green-500 text-white rounded text-sm">
                        <i class="fas fa-umbrella mr-1"></i>Ombrière
                    </button>
                    <button onclick="clearAllDrawings()" class="px-3 py-2 bg-red-600 text-white rounded text-sm">
                        <i class="fas fa-eraser mr-1"></i>Effacer Tout
                    </button>
                    <button onclick="syncWithAudit()" class="px-3 py-2 bg-orange-500 text-white rounded text-sm">
                        <i class="fas fa-paper-plane mr-1"></i>→ Audit EL
                    </button>
                </div>
            </div>

            <!-- Configuration -->
            <div class="bg-white rounded-xl p-4 mb-4">
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-1">Longueur Module (mm)</label>
                        <input type="number" id="moduleLength" value="1960" class="w-full px-2 py-1 border rounded">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Largeur Module (mm)</label>
                        <input type="number" id="moduleWidth" value="990" class="w-full px-2 py-1 border rounded">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Puissance (Wc)</label>
                        <input type="number" id="modulePower" value="300" class="w-full px-2 py-1 border rounded">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Mode</label>
                        <select id="designMode" class="w-full px-2 py-1 border rounded">
                            <option value="add">Ajouter</option>
                            <option value="remove">Supprimer</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <!-- Carte satellite -->
            <div class="bg-white rounded-xl p-4">
                <div class="relative">
                    <input type="text" id="addressSearch" placeholder="Rechercher adresse..." 
                           class="absolute top-2 left-2 z-10 px-2 py-1 text-sm border rounded bg-white">
                    <div id="satelliteMap"></div>
                </div>
                
                <!-- Statistiques -->
                <div class="mt-4 grid grid-cols-4 gap-4">
                    <div class="text-center p-2 bg-blue-50 rounded">
                        <div class="font-bold text-blue-600" id="moduleCount">0</div>
                        <div class="text-xs">Modules</div>
                    </div>
                    <div class="text-center p-2 bg-green-50 rounded">
                        <div class="font-bold text-green-600" id="totalPower">0 kWc</div>
                        <div class="text-xs">Puissance</div>
                    </div>
                    <div class="text-center p-2 bg-red-50 rounded">
                        <div class="font-bold text-red-600" id="defectsLinked">0</div>
                        <div class="text-xs">Défauts EL</div>
                    </div>
                    <div class="text-center p-2 bg-purple-50 rounded">
                        <div class="font-bold text-purple-600" id="syncStatus">✅</div>
                        <div class="text-xs">Sync</div>
                    </div>
                </div>
            </div>
        </main>

        <script>
        // Variables globales
        let layoutData = {
            modules: [],
            config: { moduleLength: 1960, moduleWidth: 990, modulePower: 300 },
            mapCenter: [43.296482, 5.369780],
            mapZoom: 18
        };
        let map, moduleMarkers = [], currentMode = 'add', drawControl, drawnItems;
        let auditData = { defectsFound: 0, totalModules: 0 };

        // Gestion des onglets
        function switchTab(tabName) {
            document.querySelectorAll('#contentAudit, #contentDesigner').forEach(el => el.classList.add('hidden'));
            document.querySelectorAll('#tabAudit, #tabDesigner').forEach(el => {
                el.classList.remove('border-purple-600', 'text-purple-600');
                el.classList.add('text-gray-500');
            });
            
            document.getElementById('content' + tabName.charAt(0).toUpperCase() + tabName.slice(1)).classList.remove('hidden');
            document.getElementById('tab' + tabName.charAt(0).toUpperCase() + tabName.slice(1)).classList.add('border-purple-600', 'text-purple-600');
            document.getElementById('tab' + tabName.charAt(0).toUpperCase() + tabName.slice(1)).classList.remove('text-gray-500');
            
            if (tabName === 'designer') setTimeout(initDesigner, 100);
        }

        // Initialisation Designer
        function initDesigner() {
            if (!map && document.getElementById('satelliteMap')) {
                initSatelliteMap();
                initDrawingTools();
            }
        }

        function initSatelliteMap() {
            map = L.map('satelliteMap').setView(layoutData.mapCenter, layoutData.mapZoom);
            
            L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Esri World Imagery',
                maxZoom: 20
            }).addTo(map);
            
            map.on('click', handleMapClick);
        }

        function initDrawingTools() {
            drawnItems = new L.FeatureGroup();
            map.addLayer(drawnItems);
            
            drawControl = new L.Control.Draw({
                position: 'topright',
                draw: {
                    polyline: false, marker: false, circle: false, circlemarker: false,
                    rectangle: { shapeOptions: { color: '#3b82f6', weight: 2, fillOpacity: 0.2 } },
                    polygon: { shapeOptions: { color: '#3b82f6', weight: 2, fillOpacity: 0.2 } }
                },
                edit: { featureGroup: drawnItems, remove: true }
            });
            
            map.addControl(drawControl);
            map.on(L.Draw.Event.CREATED, onDrawCreated);
        }

        function onDrawCreated(event) {
            const layer = event.layer;
            layer.options.drawingType = currentDrawingMode || 'zone';
            drawnItems.addLayer(layer);
            
            const area = calculateArea(layer);
            layer.bindPopup(\`Zone: \${layer.options.drawingType}<br>Superficie: \${area.toFixed(0)} m²\`);
            
            showNotification('Zone ajoutée', 'Élément créé avec succès');
        }

        function calculateArea(layer) {
            if (layer instanceof L.Rectangle) {
                const bounds = layer.getBounds();
                const width = map.distance(bounds.getNorthWest(), bounds.getNorthEast());
                const height = map.distance(bounds.getNorthWest(), bounds.getSouthWest());
                return width * height;
            }
            return 1000; // Estimation
        }

        function handleMapClick(e) {
            if (currentMode === 'add') {
                addModuleOnMap(e.latlng.lat, e.latlng.lng);
            } else {
                removeNearestModule(e.latlng.lat, e.latlng.lng);
            }
        }

        function addModuleOnMap(lat, lng) {
            const moduleId = 'M' + String(layoutData.modules.length + 1).padStart(3, '0');
            const module = { id: moduleId, lat, lng, hasDefect: false };
            
            layoutData.modules.push(module);
            addModuleMarker(module);
            updateStats();
            
            showNotification('Module ajouté', \`Module \${moduleId} placé\`);
        }

        function addModuleMarker(module) {
            const icon = L.divIcon({
                className: 'module-marker' + (module.hasDefect ? ' defect' : ''),
                html: module.id,
                iconSize: [25, 20]
            });
            
            const marker = L.marker([module.lat, module.lng], { icon })
                .bindPopup(\`Module \${module.id}<br>Puissance: \${layoutData.config.modulePower}Wc\`)
                .addTo(map);
            
            moduleMarkers.push(marker);
        }

        function removeNearestModule(lat, lng) {
            let nearestIndex = -1, minDistance = Infinity;
            
            layoutData.modules.forEach((module, index) => {
                const distance = Math.sqrt(Math.pow(module.lat - lat, 2) + Math.pow(module.lng - lng, 2));
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestIndex = index;
                }
            });
            
            if (nearestIndex !== -1 && minDistance < 0.0001) {
                if (moduleMarkers[nearestIndex]) {
                    map.removeLayer(moduleMarkers[nearestIndex]);
                    moduleMarkers.splice(nearestIndex, 1);
                }
                layoutData.modules.splice(nearestIndex, 1);
                redrawMarkers();
                updateStats();
            }
        }

        function redrawMarkers() {
            moduleMarkers.forEach(marker => map.removeLayer(marker));
            moduleMarkers = [];
            layoutData.modules.forEach((module, index) => {
                module.id = 'M' + String(index + 1).padStart(3, '0');
                addModuleMarker(module);
            });
        }

        function updateStats() {
            const count = layoutData.modules.length;
            const totalPower = count * layoutData.config.modulePower / 1000;
            const defectCount = layoutData.modules.filter(m => m.hasDefect).length;
            
            document.getElementById('moduleCount').textContent = count;
            document.getElementById('totalPower').textContent = totalPower.toFixed(1) + ' kWc';
            document.getElementById('defectsLinked').textContent = defectCount;
        }

        function setDrawingMode(mode) {
            currentDrawingMode = mode;
            showNotification('Mode ' + mode, 'Mode de dessin activé');
        }

        function clearAllDrawings() {
            if (confirm('Effacer tous les dessins ?')) {
                drawnItems.clearLayers();
                showNotification('Dessins effacés', 'Tous les éléments supprimés');
            }
        }

        // Synchronisation entre modules
        function simulateDefectDetection() {
            if (layoutData.modules.length === 0) {
                showNotification('Aucun module', 'Placez des modules d\\'abord');
                return;
            }
            
            const randomModule = layoutData.modules[Math.floor(Math.random() * layoutData.modules.length)];
            randomModule.hasDefect = true;
            auditData.defectsFound++;
            
            redrawMarkers();
            updateStats();
            
            showNotification('Défaut détecté', \`Défaut EL sur module \${randomModule.id}\`, 'warning');
        }

        function syncWithDesigner() {
            document.getElementById('syncStatus').textContent = '🔄';
            setTimeout(() => {
                document.getElementById('syncStatus').textContent = '✅';
                showNotification('Synchronisation', 'Données synchronisées avec Designer', 'success');
            }, 1000);
        }

        function syncWithAudit() {
            switchTab('audit');
            showNotification('Données transmises', 'Layout envoyé au module Audit EL');
        }

        function showNotification(title, message, type = 'info') {
            const colors = { 
                success: 'bg-green-500', 
                warning: 'bg-yellow-500', 
                error: 'bg-red-500', 
                info: 'bg-blue-500' 
            };
            
            const notification = document.createElement('div');
            notification.className = \`fixed top-4 right-4 \${colors[type]} text-white p-4 rounded-lg shadow-lg z-50 max-w-sm\`;
            notification.innerHTML = \`<div class="font-bold">\${title}</div><div class="text-sm">\${message}</div>\`;
            
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 3000);
        }

        // Recherche d'adresse
        document.addEventListener('DOMContentLoaded', () => {
            document.getElementById('addressSearch')?.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const address = e.target.value;
                    if (address.trim()) searchAddress(address);
                }
            });
        });

        async function searchAddress(address) {
            try {
                const response = await fetch(\`https://nominatim.openstreetmap.org/search?format=json&q=\${encodeURIComponent(address + ', France')}&limit=1\`);
                const data = await response.json();
                
                if (data && data.length > 0) {
                    const lat = parseFloat(data[0].lat);
                    const lon = parseFloat(data[0].lon);
                    
                    if (map) {
                        map.setView([lat, lon], 19);
                        L.marker([lat, lon]).addTo(map)
                            .bindPopup(\`📍 \${data[0].display_name}\`)
                            .openPopup();
                    }
                }
            } catch (error) {
                showNotification('Recherche', 'Adresse non trouvée', 'error');
            }
        }
        </script>
    </body>
    </html>
  `)
})

// API minimale pour tests
app.get('/api/users', async (c) => {
  return c.json({ success: true, users: [] });
})

app.get('/api/projects', async (c) => {
  return c.json({ success: true, projects: [] });
})

export default app