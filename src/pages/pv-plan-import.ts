import { getLayout } from './layout'

export function getPvPlanImportPage(plantId: string): string {
  const content = `
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <div class="flex items-center gap-4">
        <a href="/pv/plant/${plantId}" class="text-slate-500 hover:text-slate-700 transition-colors">
          <i class="fas fa-arrow-left mr-2"></i>Retour à la centrale
        </a>
      </div>
      <div class="flex gap-3">
        <button id="resetBtn" class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-all flex items-center gap-2">
          <i class="fas fa-undo"></i>
          <span>Réinitialiser</span>
        </button>
        <button id="generateBtn" class="px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all flex items-center gap-2 disabled:opacity-50" disabled>
          <i class="fas fa-magic"></i>
          <span>Générer Modules</span>
        </button>
      </div>
    </div>

    <!-- Main Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      
      <!-- Left Panel: Controls -->
      <div class="lg:col-span-1 space-y-6">
        
        <!-- Upload Card -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div class="p-4 border-b border-slate-100 bg-gradient-to-r from-blue-500 to-blue-600">
            <h3 class="font-bold text-white flex items-center gap-2">
              <i class="fas fa-upload"></i>
              1. Importer le Plan
            </h3>
          </div>
          <div class="p-4">
            <div id="dropZone" class="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer">
              <input type="file" id="planFile" accept="image/*" class="hidden">
              <i class="fas fa-cloud-upload-alt text-4xl text-slate-400 mb-3"></i>
              <p class="text-slate-600 font-medium">Glisser le plan ici</p>
              <p class="text-slate-400 text-sm mt-1">ou cliquer pour sélectionner</p>
              <p class="text-xs text-slate-400 mt-2">PNG, JPG (max 10MB)</p>
            </div>
            <div id="fileInfo" class="hidden mt-4 p-3 bg-green-50 border border-green-200 rounded-xl">
              <div class="flex items-center gap-2 text-green-700">
                <i class="fas fa-check-circle"></i>
                <span id="fileName" class="font-medium text-sm truncate"></span>
              </div>
            </div>
          </div>
        </div>

        <!-- Position Card -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div class="p-4 border-b border-slate-100 bg-gradient-to-r from-purple-500 to-purple-600">
            <h3 class="font-bold text-white flex items-center gap-2">
              <i class="fas fa-arrows-alt"></i>
              2. Positionner
            </h3>
          </div>
          <div class="p-4 space-y-4">
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-2">Opacité</label>
              <input type="range" id="opacitySlider" min="10" max="100" value="70" class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer">
              <div class="flex justify-between text-xs text-slate-400 mt-1">
                <span>10%</span>
                <span id="opacityValue">70%</span>
                <span>100%</span>
              </div>
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-2">Rotation</label>
              <input type="range" id="rotationSlider" min="-180" max="180" value="0" class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer">
              <div class="flex justify-between text-xs text-slate-400 mt-1">
                <span>-180°</span>
                <span id="rotationValue">0°</span>
                <span>180°</span>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <button id="zoomInOverlay" class="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                <i class="fas fa-search-plus"></i> Agrandir
              </button>
              <button id="zoomOutOverlay" class="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                <i class="fas fa-search-minus"></i> Réduire
              </button>
            </div>
          </div>
        </div>

        <!-- Grid Config Card -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div class="p-4 border-b border-slate-100 bg-gradient-to-r from-amber-500 to-orange-500">
            <h3 class="font-bold text-white flex items-center gap-2">
              <i class="fas fa-th"></i>
              3. Configuration Grille
            </h3>
          </div>
          <div class="p-4 space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-2">Strings</label>
                <input type="number" id="nbStrings" value="15" min="1" max="50" class="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500">
              </div>
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-2">Modules/String</label>
                <input type="number" id="nbModulesPerString" value="14" min="1" max="50" class="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500">
              </div>
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-2">Préfixe String</label>
              <input type="text" id="stringPrefix" value="A" maxlength="5" class="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500">
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-2">Puissance Module (Wc)</label>
              <input type="number" id="modulePower" value="185" min="1" max="1000" class="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500">
            </div>
            <div class="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <div class="text-sm text-amber-800">
                <div class="flex justify-between"><span>Total modules:</span><strong id="totalModules">210</strong></div>
                <div class="flex justify-between"><span>Puissance:</span><strong id="totalPower">38.85 kWc</strong></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Corners Card -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div class="p-4 border-b border-slate-100 bg-gradient-to-r from-green-500 to-emerald-600">
            <h3 class="font-bold text-white flex items-center gap-2">
              <i class="fas fa-vector-square"></i>
              4. Définir les Coins
            </h3>
          </div>
          <div class="p-4 space-y-3">
            <p class="text-sm text-slate-500">Cliquez sur la carte pour placer les 4 coins de la zone de modules.</p>
            <div id="cornersStatus" class="space-y-2">
              <div class="flex items-center gap-2 text-sm">
                <span id="corner1" class="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold">1</span>
                <span class="text-slate-500">Haut-Gauche</span>
                <span id="corner1Coords" class="ml-auto text-slate-400 text-xs">--</span>
              </div>
              <div class="flex items-center gap-2 text-sm">
                <span id="corner2" class="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold">2</span>
                <span class="text-slate-500">Haut-Droite</span>
                <span id="corner2Coords" class="ml-auto text-slate-400 text-xs">--</span>
              </div>
              <div class="flex items-center gap-2 text-sm">
                <span id="corner3" class="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold">3</span>
                <span class="text-slate-500">Bas-Droite</span>
                <span id="corner3Coords" class="ml-auto text-slate-400 text-xs">--</span>
              </div>
              <div class="flex items-center gap-2 text-sm">
                <span id="corner4" class="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold">4</span>
                <span class="text-slate-500">Bas-Gauche</span>
                <span id="corner4Coords" class="ml-auto text-slate-400 text-xs">--</span>
              </div>
            </div>
            <button id="clearCornersBtn" class="w-full mt-2 p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-medium transition-colors">
              <i class="fas fa-trash-alt mr-1"></i> Effacer les coins
            </button>
          </div>
        </div>

      </div>

      <!-- Right Panel: Map -->
      <div class="lg:col-span-3">
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-[700px]">
          <div class="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 class="font-bold text-slate-800 flex items-center gap-2">
              <i class="fas fa-map-marked-alt text-blue-500"></i>
              Carte Satellite
            </h3>
            <div class="flex items-center gap-4 text-sm text-slate-500">
              <span id="mapStatus">Prêt</span>
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 bg-blue-500 rounded-full"></span> Overlay
                <span class="w-3 h-3 bg-green-500 rounded-full"></span> Coins
                <span class="w-3 h-3 bg-amber-500 rounded-full"></span> Grille
              </div>
            </div>
          </div>
          <div id="map" class="h-[calc(100%-60px)]"></div>
        </div>
      </div>

    </div>

    <!-- Leaflet CSS -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

    <style>
      .corner-marker {
        background: #22c55e;
        border: 3px solid white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      }
      .corner-marker.active {
        background: #f59e0b;
        animation: pulse 1s infinite;
      }
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.2); }
      }
      .module-preview {
        background: rgba(59, 130, 246, 0.3);
        border: 1px solid rgba(59, 130, 246, 0.8);
      }
    </style>

    <script>
      const plantId = '${plantId}';
      let map, imageOverlay, overlayBounds;
      let corners = [];
      let cornerMarkers = [];
      let gridPolygon = null;
      let moduleMarkers = [];
      let currentCornerIndex = 0;
      let overlayScale = 1;
      let overlayRotation = 0;
      let imageLoaded = false;

      // Initialize map
      document.addEventListener('DOMContentLoaded', () => {
        initMap();
        setupEventListeners();
        updateTotals();
      });

      function initMap() {
        // Default center (France)
        map = L.map('map').setView([43.6, 1.44], 13);
        
        // Satellite layer
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: 'Esri World Imagery',
          maxZoom: 21
        }).addTo(map);

        // Labels layer
        L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-labels/{z}/{x}/{y}{r}.png', {
          subdomains: 'abcd',
          maxZoom: 20,
          opacity: 0.7
        }).addTo(map);

        // Click handler for corners
        map.on('click', onMapClick);
        
        updateStatus('Carte chargée - Importez un plan');
      }

      function setupEventListeners() {
        // File upload
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('planFile');

        dropZone.addEventListener('click', () => fileInput.click());
        dropZone.addEventListener('dragover', (e) => {
          e.preventDefault();
          dropZone.classList.add('border-blue-500', 'bg-blue-50');
        });
        dropZone.addEventListener('dragleave', () => {
          dropZone.classList.remove('border-blue-500', 'bg-blue-50');
        });
        dropZone.addEventListener('drop', (e) => {
          e.preventDefault();
          dropZone.classList.remove('border-blue-500', 'bg-blue-50');
          if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
        });
        fileInput.addEventListener('change', (e) => {
          if (e.target.files.length) handleFile(e.target.files[0]);
        });

        // Sliders
        document.getElementById('opacitySlider').addEventListener('input', (e) => {
          const val = e.target.value;
          document.getElementById('opacityValue').textContent = val + '%';
          if (imageOverlay) imageOverlay.setOpacity(val / 100);
        });

        document.getElementById('rotationSlider').addEventListener('input', (e) => {
          overlayRotation = parseInt(e.target.value);
          document.getElementById('rotationValue').textContent = overlayRotation + '°';
          updateOverlayTransform();
        });

        // Zoom overlay
        document.getElementById('zoomInOverlay').addEventListener('click', () => {
          overlayScale *= 1.1;
          updateOverlayTransform();
        });
        document.getElementById('zoomOutOverlay').addEventListener('click', () => {
          overlayScale *= 0.9;
          updateOverlayTransform();
        });

        // Grid config
        ['nbStrings', 'nbModulesPerString', 'modulePower'].forEach(id => {
          document.getElementById(id).addEventListener('input', updateTotals);
        });

        // Clear corners
        document.getElementById('clearCornersBtn').addEventListener('click', clearCorners);

        // Reset
        document.getElementById('resetBtn').addEventListener('click', resetAll);

        // Generate
        document.getElementById('generateBtn').addEventListener('click', generateModules);
      }

      function handleFile(file) {
        if (!file.type.startsWith('image/')) {
          alert('Veuillez sélectionner une image');
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            // Show file info
            document.getElementById('fileInfo').classList.remove('hidden');
            document.getElementById('fileName').textContent = file.name;

            // Calculate overlay bounds (centered on map)
            const center = map.getCenter();
            const aspectRatio = img.width / img.height;
            const heightDeg = 0.005; // ~500m
            const widthDeg = heightDeg * aspectRatio;

            overlayBounds = L.latLngBounds(
              [center.lat - heightDeg/2, center.lng - widthDeg/2],
              [center.lat + heightDeg/2, center.lng + widthDeg/2]
            );

            // Remove old overlay
            if (imageOverlay) map.removeLayer(imageOverlay);

            // Add new overlay
            imageOverlay = L.imageOverlay(e.target.result, overlayBounds, {
              opacity: 0.7,
              interactive: true
            }).addTo(map);

            // Make draggable
            imageOverlay.on('mousedown', startDrag);

            map.fitBounds(overlayBounds.pad(0.5));
            imageLoaded = true;
            updateStatus('Plan importé - Positionnez-le sur la carte');
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      }

      let isDragging = false;
      let dragStartLatLng = null;

      function startDrag(e) {
        isDragging = true;
        dragStartLatLng = e.latlng;
        map.dragging.disable();
        map.on('mousemove', onDrag);
        map.on('mouseup', stopDrag);
      }

      function onDrag(e) {
        if (!isDragging || !dragStartLatLng) return;
        
        const latDiff = e.latlng.lat - dragStartLatLng.lat;
        const lngDiff = e.latlng.lng - dragStartLatLng.lng;

        const newBounds = L.latLngBounds(
          [overlayBounds.getSouthWest().lat + latDiff, overlayBounds.getSouthWest().lng + lngDiff],
          [overlayBounds.getNorthEast().lat + latDiff, overlayBounds.getNorthEast().lng + lngDiff]
        );

        overlayBounds = newBounds;
        imageOverlay.setBounds(newBounds);
        dragStartLatLng = e.latlng;
      }

      function stopDrag() {
        isDragging = false;
        dragStartLatLng = null;
        map.dragging.enable();
        map.off('mousemove', onDrag);
        map.off('mouseup', stopDrag);
      }

      function updateOverlayTransform() {
        if (!imageOverlay) return;
        const el = imageOverlay.getElement();
        if (el) {
          el.style.transform = \`rotate(\${overlayRotation}deg) scale(\${overlayScale})\`;
          el.style.transformOrigin = 'center';
        }
      }

      function onMapClick(e) {
        if (corners.length >= 4) return;

        corners.push(e.latlng);
        
        // Add marker
        const marker = L.marker(e.latlng, {
          icon: L.divIcon({
            className: 'corner-marker',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          }),
          draggable: true
        }).addTo(map);

        marker.on('drag', (ev) => {
          const idx = cornerMarkers.indexOf(marker);
          corners[idx] = ev.target.getLatLng();
          updateCornerDisplay();
          updateGridPreview();
        });

        cornerMarkers.push(marker);
        
        updateCornerDisplay();
        updateGridPreview();

        if (corners.length === 4) {
          document.getElementById('generateBtn').disabled = false;
          updateStatus('4 coins définis - Prêt à générer les modules');
        } else {
          updateStatus(\`Coin \${corners.length}/4 placé - Cliquez pour placer le suivant\`);
        }
      }

      function updateCornerDisplay() {
        for (let i = 0; i < 4; i++) {
          const el = document.getElementById(\`corner\${i+1}\`);
          const coords = document.getElementById(\`corner\${i+1}Coords\`);
          
          if (corners[i]) {
            el.classList.remove('bg-slate-200');
            el.classList.add('bg-green-500', 'text-white');
            coords.textContent = \`\${corners[i].lat.toFixed(5)}, \${corners[i].lng.toFixed(5)}\`;
          } else {
            el.classList.add('bg-slate-200');
            el.classList.remove('bg-green-500', 'text-white');
            coords.textContent = '--';
          }
        }
      }

      function updateGridPreview() {
        // Remove old polygon
        if (gridPolygon) map.removeLayer(gridPolygon);
        moduleMarkers.forEach(m => map.removeLayer(m));
        moduleMarkers = [];

        if (corners.length < 4) return;

        // Draw polygon
        gridPolygon = L.polygon(corners, {
          color: '#f59e0b',
          weight: 2,
          fillColor: '#f59e0b',
          fillOpacity: 0.1
        }).addTo(map);

        // Preview module grid
        const nbStrings = parseInt(document.getElementById('nbStrings').value);
        const nbModules = parseInt(document.getElementById('nbModulesPerString').value);

        // Calculate grid positions
        for (let s = 0; s < nbStrings; s++) {
          for (let m = 0; m < nbModules; m++) {
            const pos = interpolatePosition(s, m, nbStrings, nbModules);
            
            const marker = L.circleMarker(pos, {
              radius: 3,
              color: '#3b82f6',
              fillColor: '#3b82f6',
              fillOpacity: 0.5
            }).addTo(map);
            
            moduleMarkers.push(marker);
          }
        }
      }

      function interpolatePosition(stringIdx, moduleIdx, totalStrings, totalModules) {
        // Bilinear interpolation within the quadrilateral
        const u = (moduleIdx + 0.5) / totalModules; // horizontal position
        const v = (stringIdx + 0.5) / totalStrings; // vertical position

        // Corners: 0=TopLeft, 1=TopRight, 2=BottomRight, 3=BottomLeft
        const top = {
          lat: corners[0].lat + u * (corners[1].lat - corners[0].lat),
          lng: corners[0].lng + u * (corners[1].lng - corners[0].lng)
        };
        const bottom = {
          lat: corners[3].lat + u * (corners[2].lat - corners[3].lat),
          lng: corners[3].lng + u * (corners[2].lng - corners[3].lng)
        };

        return {
          lat: top.lat + v * (bottom.lat - top.lat),
          lng: top.lng + v * (bottom.lng - top.lng)
        };
      }

      function updateTotals() {
        const nbStrings = parseInt(document.getElementById('nbStrings').value) || 0;
        const nbModules = parseInt(document.getElementById('nbModulesPerString').value) || 0;
        const power = parseInt(document.getElementById('modulePower').value) || 0;

        const total = nbStrings * nbModules;
        const totalKwc = (total * power / 1000).toFixed(2);

        document.getElementById('totalModules').textContent = total;
        document.getElementById('totalPower').textContent = totalKwc + ' kWc';

        updateGridPreview();
      }

      function clearCorners() {
        corners = [];
        cornerMarkers.forEach(m => map.removeLayer(m));
        cornerMarkers = [];
        if (gridPolygon) map.removeLayer(gridPolygon);
        gridPolygon = null;
        moduleMarkers.forEach(m => map.removeLayer(m));
        moduleMarkers = [];
        
        document.getElementById('generateBtn').disabled = true;
        updateCornerDisplay();
        updateStatus('Coins effacés - Cliquez pour redéfinir');
      }

      function resetAll() {
        clearCorners();
        if (imageOverlay) {
          map.removeLayer(imageOverlay);
          imageOverlay = null;
        }
        document.getElementById('fileInfo').classList.add('hidden');
        document.getElementById('opacitySlider').value = 70;
        document.getElementById('opacityValue').textContent = '70%';
        document.getElementById('rotationSlider').value = 0;
        document.getElementById('rotationValue').textContent = '0°';
        overlayScale = 1;
        overlayRotation = 0;
        imageLoaded = false;
        updateStatus('Réinitialisé - Importez un plan');
      }

      async function generateModules() {
        if (corners.length < 4) {
          alert('Veuillez définir les 4 coins de la zone');
          return;
        }

        const nbStrings = parseInt(document.getElementById('nbStrings').value);
        const nbModules = parseInt(document.getElementById('nbModulesPerString').value);
        const prefix = document.getElementById('stringPrefix').value || 'A';
        const power = parseInt(document.getElementById('modulePower').value);

        const modules = [];

        for (let s = 0; s < nbStrings; s++) {
          const stringNumber = prefix + (s + 1);
          
          for (let m = 0; m < nbModules; m++) {
            const pos = interpolatePosition(s, m, nbStrings, nbModules);
            
            modules.push({
              string_number: stringNumber,
              position_in_string: m + 1,
              latitude: pos.lat,
              longitude: pos.lng,
              power_wp: power,
              module_status: 'pending'
            });
          }
        }

        updateStatus('Génération en cours...');
        document.getElementById('generateBtn').disabled = true;

        try {
          const response = await fetch(\`/api/pv/plants/\${plantId}/import-modules\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              modules,
              clear_existing: true,
              corners: corners.map(c => ({ lat: c.lat, lng: c.lng }))
            })
          });

          const data = await response.json();

          if (data.success) {
            alert(\`✅ \${data.created} modules créés avec succès !\\n\\nVous pouvez maintenant utiliser l'audit EL pour marquer les défauts.\`);
            window.location.href = \`/pv/plant/\${plantId}\`;
          } else {
            throw new Error(data.error || 'Erreur inconnue');
          }
        } catch (err) {
          alert('❌ Erreur: ' + err.message);
          document.getElementById('generateBtn').disabled = false;
          updateStatus('Erreur - Réessayez');
        }
      }

      function updateStatus(msg) {
        document.getElementById('mapStatus').textContent = msg;
      }
    </script>
  `;

  return getLayout('Import Plan Boucles', content, 'projects');
}
