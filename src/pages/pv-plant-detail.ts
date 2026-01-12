import { getLayout } from './layout'

export function getPvPlantDetailPage(plantId: string): string {
  const content = `
    <!-- Header Actions -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <div class="flex items-center gap-4">
        <a href="/pv/plants" class="text-slate-500 hover:text-slate-700 transition-colors">
          <i class="fas fa-arrow-left mr-2"></i>Retour aux centrales
        </a>
      </div>
      <div class="flex flex-wrap gap-3">
        <a href="/pv/plant/${plantId}/import-plan" class="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all flex items-center gap-2">
          <i class="fas fa-map"></i>
          <span>Import Plan</span>
        </a>
        <button id="createAuditBtn" class="px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all flex items-center gap-2">
          <i class="fas fa-plus-circle"></i>
          <span>Créer Audit EL</span>
        </button>
        <button id="editPlantBtn" class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-all flex items-center gap-2">
          <i class="fas fa-edit"></i>
          <span>Modifier</span>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div id="loading" class="flex flex-col items-center justify-center py-16">
      <div class="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
      <p class="text-slate-500 font-medium">Chargement de la centrale...</p>
    </div>

    <!-- Error State -->
    <div id="error" class="hidden">
      <div class="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i class="fas fa-exclamation-triangle text-2xl text-red-500"></i>
        </div>
        <h3 class="text-xl font-bold text-red-700 mb-2">Erreur</h3>
        <p id="errorMessage" class="text-red-600 mb-4"></p>
        <a href="/pv/plants" class="inline-block px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-colors">
          Retour aux centrales
        </a>
      </div>
    </div>

    <!-- Main Content -->
    <div id="content" class="hidden space-y-8">
      
      <!-- Plant Header Card -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="bg-gradient-to-r from-purple-500 to-purple-600 p-6">
          <div class="flex flex-col md:flex-row justify-between items-start gap-4">
            <div>
              <h1 id="plantName" class="text-2xl font-bold text-white mb-2">...</h1>
              <div class="flex flex-wrap gap-4 text-purple-100">
                <span id="plantType" class="flex items-center gap-2">
                  <i class="fas fa-building"></i>
                  <span>Type: ...</span>
                </span>
                <span id="plantAddress" class="flex items-center gap-2">
                  <i class="fas fa-map-marker-alt"></i>
                  <span>...</span>
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Stats Grid -->
        <div class="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100">
          <div class="p-6 text-center">
            <div class="text-3xl font-bold text-blue-600" id="statsZones">0</div>
            <div class="text-sm text-slate-500 font-medium">Zones</div>
          </div>
          <div class="p-6 text-center">
            <div class="text-3xl font-bold text-green-600" id="statsModules">0</div>
            <div class="text-sm text-slate-500 font-medium">Modules</div>
          </div>
          <div class="p-6 text-center">
            <div class="text-3xl font-bold text-amber-600" id="statsPower">0</div>
            <div class="text-sm text-slate-500 font-medium">kWc</div>
          </div>
          <div class="p-6 text-center">
            <div class="text-3xl font-bold text-purple-600" id="statsArea">0</div>
            <div class="text-sm text-slate-500 font-medium">m²</div>
          </div>
        </div>
      </div>

      <!-- Zones Section -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 class="text-lg font-bold text-slate-800 flex items-center gap-3">
            <div class="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <i class="fas fa-layer-group text-purple-600"></i>
            </div>
            Zones
          </h2>
          <button id="addZoneBtn" class="px-4 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-semibold transition-all flex items-center gap-2">
            <i class="fas fa-plus"></i>
            <span>Ajouter Zone</span>
          </button>
        </div>

        <!-- Empty Zones State -->
        <div id="emptyZones" class="hidden p-12 text-center">
          <div class="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <i class="fas fa-layer-group text-4xl text-slate-400"></i>
          </div>
          <h3 class="text-xl font-bold text-slate-700 mb-2">Aucune zone créée</h3>
          <p class="text-slate-500 mb-6">Commencez par créer votre première zone pour cette centrale</p>
          <button onclick="showAddZoneModal()" class="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-semibold transition-all">
            <i class="fas fa-plus mr-2"></i>Créer la première zone
          </button>
        </div>

        <!-- Zones List -->
        <div id="zonesList" class="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></div>
      </div>
    </div>

    <!-- Zone Modal -->
    <div id="zoneModal" class="hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        <div class="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
          <h3 id="modalTitle" class="text-xl font-bold text-white flex items-center gap-3">
            <i class="fas fa-layer-group"></i>
            Nouvelle Zone
          </h3>
        </div>
        
        <form id="zoneForm" class="p-6 space-y-5">
          <input type="hidden" id="zoneId">
          
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-2">Nom de la zone *</label>
            <input type="text" id="zoneName" required
                   class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                   placeholder="Ex: Toiture Sud, Secteur A">
          </div>
          
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-2">Type de zone *</label>
            <select id="zoneType" required
                    class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all">
              <option value="roof">🏢 Toiture</option>
              <option value="ground">🏔️ Sol</option>
              <option value="carport">🚗 Ombrière</option>
            </select>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-2">Azimut (°)</label>
              <input type="number" id="zoneAzimuth" min="0" max="360" value="180"
                     class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all">
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-2">Inclinaison (°)</label>
              <input type="number" id="zoneTilt" min="0" max="90" value="30"
                     class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all">
            </div>
          </div>
          
          <div class="flex gap-3 pt-4">
            <button type="submit" class="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all">
              <i class="fas fa-save mr-2"></i>Enregistrer
            </button>
            <button type="button" id="cancelZoneBtn" class="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-all">
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Edit Plant Modal -->
    <div id="editPlantModal" class="hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        <div class="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
          <h3 class="text-xl font-bold text-white flex items-center gap-3">
            <i class="fas fa-edit"></i>
            Modifier la centrale
          </h3>
        </div>
        
        <form id="editPlantForm" class="p-6 space-y-5">
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-2">Nom de la centrale *</label>
            <input type="text" id="editPlantName" required
                   class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all">
          </div>
          
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-2">Type d'installation</label>
            <select id="editPlantType"
                    class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all">
              <option value="rooftop">🏢 Toiture</option>
              <option value="ground">🏔️ Sol</option>
              <option value="carport">🚗 Ombrière</option>
            </select>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-2">Adresse</label>
              <input type="text" id="editPlantAddress"
                     class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all">
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-2">Ville</label>
              <input type="text" id="editPlantCity"
                     class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all">
            </div>
          </div>
          
          <div class="flex gap-3 pt-4">
            <button type="submit" class="flex-1 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all">
              <i class="fas fa-save mr-2"></i>Enregistrer
            </button>
            <button type="button" id="cancelEditPlantBtn" class="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-all">
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>

    <script>
    // ============================================
    // PV CARTOGRAPHY - Détail Centrale
    // Style unifié DiagPV OS
    // ============================================
    
    const PLANT_ID = ${plantId}
    let plant = null
    let zones = []

    async function loadPlantData() {
      try {
        const response = await fetch(\`/api/pv/plants/\${PLANT_ID}\`)
        const data = await response.json()
        
        if (!data.success || !data.plant) {
          throw new Error(data.error || 'Centrale introuvable')
        }
        
        plant = data.plant
        zones = data.zones || []
        
        renderPlant()
        renderZones()
        
        document.getElementById('loading').classList.add('hidden')
        document.getElementById('content').classList.remove('hidden')
        
      } catch (error) {
        console.error('Erreur:', error)
        document.getElementById('loading').classList.add('hidden')
        document.getElementById('errorMessage').textContent = error.message
        document.getElementById('error').classList.remove('hidden')
      }
    }

    function renderPlant() {
      const typeLabels = {
        rooftop: 'Toiture',
        ground: 'Sol',
        carport: 'Ombrière'
      }
      
      document.getElementById('plantName').textContent = plant.plant_name
      document.getElementById('plantType').innerHTML = \`<i class="fas fa-building mr-2"></i>Type: \${typeLabels[plant.plant_type] || plant.plant_type}\`
      document.getElementById('plantAddress').innerHTML = \`<i class="fas fa-map-marker-alt mr-2"></i>\${[plant.address, plant.city].filter(Boolean).join(', ') || 'Non renseigné'}\`
      
      // Stats
      const totalModules = zones.reduce((sum, z) => sum + (z.module_count || 0), 0)
      const totalPower = zones.reduce((sum, z) => sum + (z.total_power_wp || 0), 0)
      const totalArea = zones.reduce((sum, z) => sum + (z.surface_m2 || 0), 0)
      
      document.getElementById('statsZones').textContent = zones.length
      document.getElementById('statsModules').textContent = totalModules.toLocaleString('fr-FR')
      document.getElementById('statsPower').textContent = (totalPower / 1000).toFixed(1)
      document.getElementById('statsArea').textContent = totalArea.toFixed(0)
    }

    function renderZones() {
      const container = document.getElementById('zonesList')
      const emptyState = document.getElementById('emptyZones')
      
      if (zones.length === 0) {
        container.classList.add('hidden')
        emptyState.classList.remove('hidden')
        return
      }
      
      container.classList.remove('hidden')
      emptyState.classList.add('hidden')
      
      const typeConfig = {
        roof: { icon: 'fa-building', label: 'Toiture' },
        ground: { icon: 'fa-mountain-sun', label: 'Sol' },
        carport: { icon: 'fa-car', label: 'Ombrière' }
      }
      
      container.innerHTML = zones.map(zone => {
        const config = typeConfig[zone.zone_type] || { icon: 'fa-layer-group', label: zone.zone_type }
        
        return \`
          <div class="bg-slate-50 rounded-xl p-4 border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all">
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center gap-3">
                <h4 class="font-bold text-slate-800">\${zone.zone_name}</h4>
                <button onclick="deleteZone(\${zone.id})" class="text-red-400 hover:text-red-600" title="Supprimer">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
            
            <div class="flex items-center gap-2 text-sm text-slate-500 mb-3">
              <i class="fas \${config.icon}"></i>
              <span>\${config.label}</span>
            </div>
            
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span class="text-slate-400">Azimut</span>
                <div class="font-bold text-blue-600">\${zone.azimuth || 0}°</div>
              </div>
              <div>
                <span class="text-slate-400">Inclinaison</span>
                <div class="font-bold text-green-600">\${zone.tilt || 0}°</div>
              </div>
              <div>
                <span class="text-slate-400">Modules</span>
                <div class="font-bold text-purple-600">\${zone.module_count || 0}</div>
              </div>
              <div>
                <span class="text-slate-400">Surface</span>
                <div class="font-bold text-amber-600">\${(zone.surface_m2 || 0).toFixed(0)} m²</div>
              </div>
            </div>
            
            <div class="flex gap-2 mt-4">
              <a href="/pv/plant/\${PLANT_ID}/zone/\${zone.id}/editor/v3" 
                 class="flex-1 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:shadow-lg text-white rounded-lg font-semibold text-center text-sm transition-all">
                <i class="fas fa-solar-panel mr-1"></i> Éditeur V3
              </a>
            </div>
          </div>
        \`
      }).join('')
    }

    // Modal Zone
    function showAddZoneModal() {
      document.getElementById('modalTitle').textContent = 'Nouvelle Zone'
      document.getElementById('zoneId').value = ''
      document.getElementById('zoneForm').reset()
      document.getElementById('zoneModal').classList.remove('hidden')
    }

    function hideZoneModal() {
      document.getElementById('zoneModal').classList.add('hidden')
    }

    async function saveZone(e) {
      e.preventDefault()
      
      const zoneId = document.getElementById('zoneId').value
      const data = {
        zone_name: document.getElementById('zoneName').value,
        zone_type: document.getElementById('zoneType').value,
        azimuth: parseInt(document.getElementById('zoneAzimuth').value) || 180,
        tilt: parseInt(document.getElementById('zoneTilt').value) || 30
      }
      
      try {
        const url = zoneId 
          ? \`/api/pv/plants/\${PLANT_ID}/zones/\${zoneId}\`
          : \`/api/pv/plants/\${PLANT_ID}/zones\`
        
        const response = await fetch(url, {
          method: zoneId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        
        const result = await response.json()
        
        if (result.success) {
          showNotification('Zone enregistrée !', 'success')
          hideZoneModal()
          loadPlantData()
        } else {
          showNotification(result.error || 'Erreur', 'error')
        }
      } catch (error) {
        showNotification('Erreur lors de l\\'enregistrement', 'error')
      }
    }

    async function deleteZone(zoneId) {
      if (!confirm('Supprimer cette zone et tous ses modules ?')) return
      
      try {
        const response = await fetch(\`/api/pv/plants/\${PLANT_ID}/zones/\${zoneId}\`, {
          method: 'DELETE'
        })
        
        if (response.ok) {
          showNotification('Zone supprimée', 'success')
          loadPlantData()
        }
      } catch (error) {
        showNotification('Erreur lors de la suppression', 'error')
      }
    }

    // Modal Edit Plant
    function showEditPlantModal() {
      document.getElementById('editPlantName').value = plant.plant_name || ''
      document.getElementById('editPlantType').value = plant.plant_type || 'rooftop'
      document.getElementById('editPlantAddress').value = plant.address || ''
      document.getElementById('editPlantCity').value = plant.city || ''
      document.getElementById('editPlantModal').classList.remove('hidden')
    }

    function hideEditPlantModal() {
      document.getElementById('editPlantModal').classList.add('hidden')
    }

    async function savePlant(e) {
      e.preventDefault()
      
      const data = {
        plant_name: document.getElementById('editPlantName').value,
        plant_type: document.getElementById('editPlantType').value,
        address: document.getElementById('editPlantAddress').value || null,
        city: document.getElementById('editPlantCity').value || null
      }
      
      try {
        const response = await fetch(\`/api/pv/plants/\${PLANT_ID}\`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        
        const result = await response.json()
        
        if (result.success) {
          showNotification('Centrale mise à jour !', 'success')
          hideEditPlantModal()
          loadPlantData()
        } else {
          showNotification(result.error || 'Erreur', 'error')
        }
      } catch (error) {
        showNotification('Erreur lors de la mise à jour', 'error')
      }
    }

    // Create Audit from Plant
    async function createAuditFromPlant() {
      if (!confirm('Créer un nouvel audit EL depuis cette centrale ?')) return
      
      try {
        const response = await fetch(\`/api/sync-reverse/plant/\${PLANT_ID}/create-el-audit\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        })
        
        const result = await response.json()
        
        if (result.success && result.auditUrl) {
          showNotification('Audit créé ! Redirection...', 'success')
          setTimeout(() => {
            window.location.href = result.auditUrl
          }, 1000)
        } else {
          showNotification(result.error || 'Erreur création audit', 'error')
        }
      } catch (error) {
        showNotification('Erreur lors de la création de l\\'audit', 'error')
      }
    }

    function showNotification(message, type = 'info') {
      const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500'
      }
      
      const notification = document.createElement('div')
      notification.className = \`fixed bottom-6 right-6 \${colors[type]} text-white px-6 py-3 rounded-xl shadow-lg z-50 font-semibold flex items-center gap-3\`
      notification.innerHTML = \`
        <i class="fas \${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>\${message}</span>
      \`
      
      document.body.appendChild(notification)
      
      setTimeout(() => {
        notification.classList.add('opacity-0', 'translate-y-4')
        setTimeout(() => notification.remove(), 300)
      }, 3000)
    }

    // Event Listeners
    document.getElementById('addZoneBtn').addEventListener('click', showAddZoneModal)
    document.getElementById('cancelZoneBtn').addEventListener('click', hideZoneModal)
    document.getElementById('zoneForm').addEventListener('submit', saveZone)
    
    document.getElementById('editPlantBtn').addEventListener('click', showEditPlantModal)
    document.getElementById('cancelEditPlantBtn').addEventListener('click', hideEditPlantModal)
    document.getElementById('editPlantForm').addEventListener('submit', savePlant)
    
    document.getElementById('createAuditBtn').addEventListener('click', createAuditFromPlant)
    
    document.getElementById('zoneModal').addEventListener('click', (e) => {
      if (e.target === document.getElementById('zoneModal')) hideZoneModal()
    })
    
    document.getElementById('editPlantModal').addEventListener('click', (e) => {
      if (e.target === document.getElementById('editPlantModal')) hideEditPlantModal()
    })

    // Init
    loadPlantData()
    </script>
  `

  return getLayout('Détail Centrale PV', content, 'projects')
}
