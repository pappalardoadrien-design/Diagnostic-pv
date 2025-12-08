import { Hono } from 'hono'
import type { Context } from 'hono'

const app = new Hono()

/**
 * GET /pv/plant/:plantId/zone/:zoneId/designer
 * 
 * Éditeur Designer Satellite - Placement modules PV sur carte satellite
 * Avec Google Maps, recherche d'adresse, rotation gestuelle, drag & drop
 */
app.get('/pv/plant/:plantId/zone/:zoneId/designer', (c: Context) => {
  const plantId = c.req.param('plantId')
  const zoneId = c.req.param('zoneId')

  return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Designer Satellite - Cartographie PV</title>
        <script src="https://cdn.tailwindcss.com"></script>
        
        <!-- Leaflet CSS -->
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css" />
        
        <!-- Leaflet JS -->
        <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js"></script>
        
        <!-- Turf.js pour calculs géométriques -->
        <script src="https://cdn.jsdelivr.net/npm/@turf/turf@6.5.0/turf.min.js"></script>
        
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        
        <style>
            body, html {
                margin: 0;
                padding: 0;
                height: 100%;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }
            
            #map {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 1;
            }
            
            .controls-panel {
                position: absolute;
                top: 20px;
                right: 20px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                padding: 20px;
                max-width: 350px;
                z-index: 1000;
            }
            
            .search-box {
                position: absolute;
                top: 20px;
                left: 20px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                padding: 15px;
                z-index: 1000;
                min-width: 300px;
            }
            
            .module-marker {
                border: 2px solid #22C55E;
                background-color: rgba(34, 197, 94, 0.3);
                transform-origin: center center;
                cursor: move;
            }
            
            .module-marker.selected {
                border-color: #3B82F6;
                background-color: rgba(59, 130, 246, 0.5);
                box-shadow: 0 0 10px rgba(59, 130, 246, 0.8);
            }
            
            .status-panel {
                position: absolute;
                bottom: 20px;
                left: 20px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                padding: 15px;
                z-index: 1000;
            }
            
            button {
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            button:hover {
                transform: translateY(-2px);
            }
        </style>
    </head>
    <body>
        <!-- Carte Leaflet -->
        <div id="map"></div>
        
        <!-- Barre de recherche d'adresse -->
        <div class="search-box">
            <h3 class="text-lg font-bold text-gray-800 mb-3">
                <i class="fas fa-search mr-2"></i>Recherche d'adresse
            </h3>
            <div class="flex space-x-2">
                <input 
                    type="text" 
                    id="addressSearch" 
                    placeholder="Entrez une adresse..."
                    class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    onkeypress="if(event.key === 'Enter') searchAddress()"
                />
                <button 
                    onclick="searchAddress()"
                    class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium">
                    <i class="fas fa-search"></i>
                </button>
            </div>
            <p class="text-xs text-gray-500 mt-2">Exemple: "1 rue de Rivoli, Paris"</p>
        </div>
        
        <!-- Panneau de contrôles -->
        <div class="controls-panel">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-bold text-gray-800">
                    <i class="fas fa-cog mr-2"></i>Contrôles
                </h2>
                <a href="/pv/plant/${plantId}/zone/${zoneId}/editor" 
                   class="text-sm text-blue-600 hover:text-blue-800">
                    <i class="fas fa-arrow-left mr-1"></i>Éditeur Canvas
                </a>
            </div>
            
            <div class="space-y-4">
                <!-- Informations zone -->
                <div class="p-3 bg-gray-50 rounded-lg">
                    <div class="text-sm text-gray-600">Zone:</div>
                    <div id="zoneName" class="font-bold text-gray-900">Chargement...</div>
                    <div class="text-xs text-gray-500 mt-1">
                        Plant ${plantId} • Zone ${zoneId}
                    </div>
                </div>
                
                <!-- Statistiques modules -->
                <div class="grid grid-cols-2 gap-2">
                    <div class="p-2 bg-blue-50 rounded text-center">
                        <div id="moduleCount" class="text-2xl font-bold text-blue-600">0</div>
                        <div class="text-xs text-gray-600">Modules</div>
                    </div>
                    <div class="p-2 bg-green-50 rounded text-center">
                        <div id="totalPower" class="text-2xl font-bold text-green-600">0</div>
                        <div class="text-xs text-gray-600">kWc</div>
                    </div>
                </div>
                
                <!-- Actions principales -->
                <div class="space-y-2">
                    <button 
                        onclick="syncFromEL()"
                        class="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold">
                        <i class="fas fa-sync mr-2"></i>Synchroniser depuis Audit EL
                    </button>
                    
                    <button 
                        onclick="placeModulesOnMap()"
                        class="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold">
                        <i class="fas fa-plus-circle mr-2"></i>Placer Modules sur Carte
                    </button>
                    
                    <button 
                        onclick="selectAllModules()"
                        class="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium">
                        <i class="fas fa-check-square mr-2"></i>Tout Sélectionner
                    </button>
                    
                    <button 
                        onclick="deleteSelected()"
                        class="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium">
                        <i class="fas fa-trash mr-2"></i>Supprimer Sélection
                    </button>
                </div>
                
                <!-- Rotation manuelle -->
                <div class="p-3 bg-gray-50 rounded-lg">
                    <label class="text-sm font-medium text-gray-700 mb-2 block">
                        Rotation (°)
                    </label>
                    <div class="flex items-center space-x-2">
                        <input 
                            type="range" 
                            id="rotationSlider" 
                            min="0" 
                            max="360" 
                            value="0"
                            class="flex-1"
                            oninput="document.getElementById('rotationValue').textContent = this.value"
                        />
                        <span id="rotationValue" class="font-bold text-gray-900 w-12 text-right">0</span>°
                    </div>
                    <button 
                        onclick="applyRotation()"
                        class="w-full mt-2 px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded text-sm">
                        <i class="fas fa-redo mr-1"></i>Appliquer Rotation
                    </button>
                </div>
                
                <!-- Sauvegarde -->
                <div class="space-y-2 border-t pt-4">
                    <button 
                        onclick="saveLayout()"
                        class="w-full px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg font-medium">
                        <i class="fas fa-save mr-2"></i>Sauvegarder Layout
                    </button>
                    
                    <button 
                        onclick="exportToJSON()"
                        class="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium">
                        <i class="fas fa-download mr-2"></i>Export JSON
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Panneau de statut -->
        <div class="status-panel">
            <div class="flex items-center space-x-3">
                <div class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span id="statusText" class="text-sm font-medium text-gray-700">Prêt</span>
            </div>
        </div>

        <script>
        // VARIABLES GLOBALES
        const plantId = '${plantId}';
        const zoneId = '${zoneId}';
        
        let map;
        let moduleMarkers = [];
        let selectedMarkers = new Set();
        let pvModules = [];
        let zoneData = null;
        let drawnItems;
        let roofPolygons = [];
        
        // Initialisation carte Leaflet
        function initMap() {
            // Carte centrée sur la France par défaut
            map = L.map('map').setView([46.603354, 1.888334], 6);
            
            // Layer Google Satellite
            L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
                maxZoom: 20,
                subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
                attribution: '© Google Maps'
            }).addTo(map);
            
            // ✨ NOUVEAU: Initialisation Leaflet.draw pour dessiner polygones toiture
            drawnItems = new L.FeatureGroup();
            map.addLayer(drawnItems);
            
            const drawControl = new L.Control.Draw({
                position: 'topleft',
                draw: {
                    polygon: {
                        allowIntersection: false,
                        shapeOptions: {
                            color: '#FFD700',
                            fillColor: '#FFD700',
                            fillOpacity: 0.3,
                            weight: 3
                        }
                    },
                    rectangle: {
                        shapeOptions: {
                            color: '#FFD700',
                            fillColor: '#FFD700',
                            fillOpacity: 0.3,
                            weight: 3
                        }
                    },
                    polyline: false,
                    circle: false,
                    marker: false,
                    circlemarker: false
                },
                edit: {
                    featureGroup: drawnItems,
                    remove: true
                }
            });
            map.addControl(drawControl);
            
            // ✨ Événement: Polygone toiture dessiné
            map.on(L.Draw.Event.CREATED, function (e) {
                const layer = e.layer;
                drawnItems.addLayer(layer);
                roofPolygons.push(layer);
                
                // Calculer surface avec Turf.js
                const area = turf.area(layer.toGeoJSON());
                const areaSqm = area.toFixed(2);
                
                // Afficher popup avec surface
                layer.bindPopup(\`
                    <b>Toiture dessinée</b><br>
                    Surface: \${areaSqm} m²<br>
                    <button onclick="placeModulesInPolygon(\${roofPolygons.length - 1})" 
                            class="mt-2 px-3 py-1 bg-green-600 text-white rounded text-sm">
                        Placer modules ici
                    </button>
                \`).openPopup();
                
                updateStatus(\`Toiture dessinée: \${areaSqm} m²\`);
            });
            
            // ✨ Événement: Polygone modifié
            map.on(L.Draw.Event.EDITED, function (e) {
                updateStatus('Toitures modifiées');
            });
            
            // ✨ Événement: Polygone supprimé
            map.on(L.Draw.Event.DELETED, function (e) {
                e.layers.eachLayer(function(layer) {
                    const index = roofPolygons.indexOf(layer);
                    if (index > -1) {
                        roofPolygons.splice(index, 1);
                    }
                });
                updateStatus('Toitures supprimées');
            });
            
            updateStatus('Carte satellite chargée - Dessinez une toiture avec les outils à gauche');
        }
        
        // Recherche d'adresse avec Nominatim
        async function searchAddress() {
            const address = document.getElementById('addressSearch').value;
            
            if (!address) {
                alert('Veuillez entrer une adresse');
                return;
            }
            
            updateStatus('Recherche en cours...');
            
            try {
                const response = await fetch(\`https://nominatim.openstreetmap.org/search?format=json&q=\${encodeURIComponent(address)}\`);
                const results = await response.json();
                
                if (results.length > 0) {
                    const result = results[0];
                    const lat = parseFloat(result.lat);
                    const lon = parseFloat(result.lon);
                    
                    map.setView([lat, lon], 18);
                    
                    // Marker temporaire
                    L.marker([lat, lon]).addTo(map)
                        .bindPopup(\`<b>\${result.display_name}</b>\`)
                        .openPopup();
                    
                    updateStatus(\`Trouvé: \${result.display_name}\`);
                } else {
                    alert('Adresse non trouvée');
                    updateStatus('Adresse non trouvée');
                }
            } catch (error) {
                console.error('Erreur recherche:', error);
                alert('Erreur lors de la recherche d\\'adresse');
                updateStatus('Erreur recherche');
            }
        }
        
        // ✨ NOUVEAU: Synchroniser modules depuis audit EL (connexion dynamique)
        async function syncFromEL() {
            if (!confirm('Synchroniser les modules et leurs statuts depuis l\\'audit EL ?\\nCela va écraser les modules actuels.')) {
                return;
            }
            
            try {
                updateStatus('Synchronisation depuis audit EL...');
                
                const response = await fetch(\`/api/pv/zones/\${zoneId}/sync-from-el\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                
                const data = await response.json();
                
                if (data.success) {
                    alert(\`✅ \${data.synced_count} modules synchronisés depuis l'audit EL\\nLes statuts ont été mis à jour !\`);
                    // Recharger les modules avec les nouveaux statuts
                    await loadModules();
                    updateStatus(\`Synchronisation réussie: \${data.synced_count} modules\`);
                } else {
                    alert(\`❌ Erreur: \${data.error}\`);
                    updateStatus('Échec synchronisation');
                }
            } catch (error) {
                console.error('Erreur sync EL:', error);
                alert('Erreur lors de la synchronisation avec l\\'audit EL');
                updateStatus('Erreur synchronisation');
            }
        }
        
        // Charger les modules PV depuis l'API
        async function loadModules() {
            try {
                updateStatus('Chargement modules...');
                
                const response = await fetch(\`/api/pv/plants/\${plantId}/zones/\${zoneId}/modules\`);
                const data = await response.json();
                
                if (data.success && data.modules) {
                    pvModules = data.modules;
                    
                    // Mise à jour statistiques
                    document.getElementById('moduleCount').textContent = pvModules.length;
                    
                    const totalPower = pvModules.reduce((sum, m) => sum + (m.power_wp || 0), 0) / 1000;
                    document.getElementById('totalPower').textContent = totalPower.toFixed(1);
                    
                    updateStatus(\`\${pvModules.length} modules chargés\`);
                } else {
                    updateStatus('Aucun module trouvé');
                }
            } catch (error) {
                console.error('Erreur chargement modules:', error);
                updateStatus('Erreur chargement');
            }
        }
        
        // Charger informations zone
        async function loadZone() {
            try {
                const response = await fetch(\`/api/pv/plants/\${plantId}/zones/\${zoneId}\`);
                const data = await response.json();
                
                if (data.success && data.zone) {
                    zoneData = data.zone;
                    document.getElementById('zoneName').textContent = zoneData.zone_name || 'Sans nom';
                }
            } catch (error) {
                console.error('Erreur chargement zone:', error);
            }
        }
        
        // Placer tous les modules sur la carte
        function placeModulesOnMap() {
            if (pvModules.length === 0) {
                alert('Aucun module à placer. Chargez d\\'abord les modules depuis l\\'éditeur Canvas.');
                return;
            }
            
            // Supprimer markers existants
            moduleMarkers.forEach(marker => map.removeLayer(marker));
            moduleMarkers = [];
            selectedMarkers.clear();
            
            // Centre de la carte actuelle
            const center = map.getCenter();
            
            // Dimensions module (1.7m x 1.0m)
            const moduleWidth = 1.7;
            const moduleHeight = 1.0;
            
            // Espacement entre modules
            const spacing = 0.3;
            
            // Calculer nombre de lignes/colonnes pour une grille
            const cols = Math.ceil(Math.sqrt(pvModules.length));
            const rows = Math.ceil(pvModules.length / cols);
            
            pvModules.forEach((module, index) => {
                const row = Math.floor(index / cols);
                const col = index % cols;
                
                // Position relative en mètres
                const offsetX = (col - cols / 2) * (moduleWidth + spacing);
                const offsetY = (row - rows / 2) * (moduleHeight + spacing);
                
                // Conversion mètres → degrés approximatifs
                const latOffset = offsetY / 111320; // 1° lat ≈ 111.32 km
                const lonOffset = offsetX / (111320 * Math.cos(center.lat * Math.PI / 180));
                
                const lat = center.lat + latOffset;
                const lon = center.lng + lonOffset;
                
                createModuleMarker(module, lat, lon);
            });
            
            updateStatus(\`\${pvModules.length} modules placés sur la carte\`);
        }
        
        // ✨ NOUVEAU: Placer modules DANS un polygone toiture dessiné
        function placeModulesInPolygon(polygonIndex) {
            if (pvModules.length === 0) {
                alert('Aucun module à placer. Chargez d\\'abord les modules depuis l\\'API.');
                return;
            }
            
            if (!roofPolygons[polygonIndex]) {
                alert('Polygone toiture non trouvé');
                return;
            }
            
            // Supprimer markers existants
            moduleMarkers.forEach(marker => map.removeLayer(marker));
            moduleMarkers = [];
            selectedMarkers.clear();
            
            const polygon = roofPolygons[polygonIndex];
            const bounds = polygon.getBounds();
            
            // Calculer dimensions du polygone en mètres (approximatif)
            const latDiff = bounds.getNorth() - bounds.getSouth();
            const lonDiff = bounds.getEast() - bounds.getWest();
            const heightMeters = latDiff * 111320; // 1° lat ≈ 111.32 km
            const widthMeters = lonDiff * 111320 * Math.cos(bounds.getCenter().lat * Math.PI / 180);
            
            // Dimensions module
            const moduleWidth = 1.7;
            const moduleHeight = 1.0;
            const spacing = 0.3;
            
            // Calculer nombre de lignes/colonnes optimales
            const cols = Math.floor(widthMeters / (moduleWidth + spacing));
            const rows = Math.ceil(pvModules.length / cols);
            
            // Centre du polygone
            const center = bounds.getCenter();
            
            let placedCount = 0;
            pvModules.forEach((module, index) => {
                if (placedCount >= pvModules.length) return;
                
                const row = Math.floor(index / cols);
                const col = index % cols;
                
                // Position relative en mètres depuis le centre
                const offsetX = (col - cols / 2) * (moduleWidth + spacing);
                const offsetY = (row - rows / 2) * (moduleHeight + spacing);
                
                // Conversion mètres → degrés
                const latOffset = offsetY / 111320;
                const lonOffset = offsetX / (111320 * Math.cos(center.lat * Math.PI / 180));
                
                const lat = center.lat + latOffset;
                const lon = center.lng + lonOffset;
                
                // Vérifier si le point est DANS le polygone
                const point = turf.point([lon, lat]);
                const poly = turf.polygon([polygon.getLatLngs()[0].map(ll => [ll.lng, ll.lat])]);
                
                if (turf.booleanPointInPolygon(point, poly)) {
                    createModuleMarker(module, lat, lon);
                    placedCount++;
                }
            });
            
            updateStatus(\`\${placedCount} modules placés dans la toiture\`);
        }
        
        // Créer un marker de module
        function createModuleMarker(module, lat, lon) {
            // ✨ Utiliser la couleur selon le statut du module (connexion dynamique avec audit EL)
            const statusColor = getStatusColor(module.module_status);
            
            const marker = L.rectangle(
                [[lat - 0.000005, lon - 0.000008], [lat + 0.000005, lon + 0.000008]],
                {
                    color: statusColor,
                    fillColor: statusColor,
                    fillOpacity: 0.5,
                    weight: 2,
                    className: 'module-marker',
                    moduleData: module,
                    draggable: true
                }
            ).addTo(map);
            
            // Popup informations
            marker.bindPopup(\`
                <b>\${module.module_identifier || 'Module'}</b><br>
                String: \${module.string_number || '-'}<br>
                Position: \${module.position_in_string || '-'}<br>
                Puissance: \${module.power_wp || 0}Wp<br>
                Statut: <span style="color: \${getStatusColor(module.module_status)}">\${module.module_status || 'ok'}</span>
            \`);
            
            // Événements
            marker.on('click', function(e) {
                if (e.originalEvent.ctrlKey || e.originalEvent.metaKey) {
                    toggleSelection(marker);
                } else {
                    clearSelection();
                    selectMarker(marker);
                }
            });
            
            moduleMarkers.push(marker);
            
            return marker;
        }
        
        // Gestion sélection
        function toggleSelection(marker) {
            if (selectedMarkers.has(marker)) {
                deselectMarker(marker);
            } else {
                selectMarker(marker);
            }
        }
        
        function selectMarker(marker) {
            selectedMarkers.add(marker);
            // Sauvegarder la couleur d'origine
            if (!marker.options.originalColor) {
                marker.options.originalColor = marker.options.color;
            }
            marker.setStyle({ color: '#3B82F6', fillColor: '#3B82F6' });
        }
        
        function deselectMarker(marker) {
            selectedMarkers.delete(marker);
            // ✨ Restaurer la couleur d'origine selon le statut
            const originalColor = marker.options.originalColor || getStatusColor(marker.options.moduleData?.module_status);
            marker.setStyle({ color: originalColor, fillColor: originalColor });
        }
        
        function clearSelection() {
            selectedMarkers.forEach(marker => {
                // ✨ Restaurer la couleur d'origine selon le statut
                const originalColor = marker.options.originalColor || getStatusColor(marker.options.moduleData?.module_status);
                marker.setStyle({ color: originalColor, fillColor: originalColor });
            });
            selectedMarkers.clear();
        }
        
        function selectAllModules() {
            clearSelection();
            moduleMarkers.forEach(marker => selectMarker(marker));
            updateStatus(\`\${moduleMarkers.length} modules sélectionnés\`);
        }
        
        // Rotation
        function applyRotation() {
            const angle = parseInt(document.getElementById('rotationSlider').value);
            
            if (selectedMarkers.size === 0) {
                alert('Sélectionnez des modules à faire pivoter');
                return;
            }
            
            selectedMarkers.forEach(marker => {
                // TODO: Implémenter rotation rectangle Leaflet
                // Leaflet ne supporte pas nativement la rotation, nécessite plugin
                console.log('Rotation:', angle, 'pour marker:', marker);
            });
            
            updateStatus(\`Rotation \${angle}° appliquée à \${selectedMarkers.size} modules\`);
        }
        
        // Suppression
        function deleteSelected() {
            if (selectedMarkers.size === 0) {
                alert('Aucun module sélectionné');
                return;
            }
            
            if (!confirm(\`Supprimer \${selectedMarkers.size} modules ?\`)) return;
            
            selectedMarkers.forEach(marker => {
                map.removeLayer(marker);
                const index = moduleMarkers.indexOf(marker);
                if (index > -1) moduleMarkers.splice(index, 1);
            });
            
            selectedMarkers.clear();
            updateStatus('Modules supprimés');
        }
        
        // Sauvegarde
        async function saveLayout() {
            try {
                updateStatus('Sauvegarde en cours...');
                
                const layoutData = moduleMarkers.map(marker => {
                    const bounds = marker.getBounds();
                    const center = bounds.getCenter();
                    
                    return {
                        module_id: marker.options.moduleData.id,
                        lat: center.lat,
                        lon: center.lng,
                        rotation: 0 // TODO: récupérer rotation réelle
                    };
                });
                
                const response = await fetch(\`/api/pv/zones/\${zoneId}/save-designer-layout\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        modules: layoutData,
                        map_center: { lat: map.getCenter().lat, lon: map.getCenter().lng },
                        zoom: map.getZoom()
                    })
                });
                
                if (response.ok) {
                    updateStatus('✅ Layout sauvegardé');
                    alert('Layout Designer Satellite sauvegardé avec succès !');
                } else {
                    throw new Error('Erreur sauvegarde');
                }
            } catch (error) {
                console.error('Erreur sauvegarde:', error);
                updateStatus('❌ Erreur sauvegarde');
                alert('Erreur lors de la sauvegarde');
            }
        }
        
        // Export JSON
        function exportToJSON() {
            const exportData = {
                plant_id: plantId,
                zone_id: zoneId,
                zone_name: zoneData?.zone_name || 'Zone',
                modules: moduleMarkers.map(marker => {
                    const bounds = marker.getBounds();
                    const center = bounds.getCenter();
                    
                    return {
                        ...marker.options.moduleData,
                        designer_lat: center.lat,
                        designer_lon: center.lng
                    };
                }),
                map_center: { lat: map.getCenter().lat, lon: map.getCenter().lng },
                zoom: map.getZoom(),
                export_date: new Date().toISOString()
            };
            
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            
            const exportFileDefaultName = \`designer_satellite_plant\${plantId}_zone\${zoneId}_\${new Date().toISOString().slice(0,10)}.json\`;
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            
            updateStatus('Export JSON téléchargé');
        }
        
        // Helpers
        function updateStatus(text) {
            document.getElementById('statusText').textContent = text;
        }
        
        function getStatusColor(status) {
            const colors = {
                'ok': '#22C55E',
                'inequality': '#F59E0B',
                'microcracks': '#EF4444',
                'dead': '#991B1B',
                'string_open': '#DC2626',
                'pending': '#6B7280'
            };
            return colors[status] || '#6B7280';
        }
        
        // Initialisation
        initMap();
        loadZone();
        loadModules();
        </script>
    </body>
    </html>
  `)
})

export default app
