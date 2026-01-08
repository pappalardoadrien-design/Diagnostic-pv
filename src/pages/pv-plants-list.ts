import { getLayout } from './layout'

export function getPvPlantsListPage(): string {
  const content = `
    <!-- KPI Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500 mb-1">Centrales</p>
            <p class="text-3xl font-extrabold text-slate-800" id="statsPlants">0</p>
          </div>
          <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
            <i class="fas fa-solar-panel text-white text-lg"></i>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500 mb-1">Zones</p>
            <p class="text-3xl font-extrabold text-slate-800" id="statsZones">0</p>
          </div>
          <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <i class="fas fa-layer-group text-white text-lg"></i>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500 mb-1">Modules</p>
            <p class="text-3xl font-extrabold text-slate-800" id="statsModules">0</p>
          </div>
          <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
            <i class="fas fa-th text-white text-lg"></i>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500 mb-1">Puissance Totale</p>
            <p class="text-3xl font-extrabold text-slate-800"><span id="statsPower">0</span> <span class="text-lg font-medium text-slate-500">kWc</span></p>
          </div>
          <div class="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
            <i class="fas fa-bolt text-white text-lg"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- Header Actions -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <div>
        <h2 class="text-xl font-bold text-slate-800">Mes Centrales PV</h2>
        <p class="text-sm text-slate-500">Gérez vos installations photovoltaïques</p>
      </div>
      <div class="flex gap-3">
        <button id="createPlantBtn" class="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all transform hover:-translate-y-0.5 flex items-center gap-2">
          <i class="fas fa-plus"></i>
          <span>Nouvelle Centrale</span>
        </button>
      </div>
    </div>

    <!-- Plants List -->
    <div id="plantsList" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- Loading -->
      <div class="col-span-full flex flex-col items-center justify-center py-16">
        <div class="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
        <p class="text-slate-500 font-medium">Chargement des centrales...</p>
      </div>
    </div>

    <!-- Empty State -->
    <div id="emptyState" class="hidden">
      <div class="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center">
        <div class="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <i class="fas fa-solar-panel text-4xl text-slate-400"></i>
        </div>
        <h3 class="text-xl font-bold text-slate-700 mb-2">Aucune centrale PV</h3>
        <p class="text-slate-500 mb-6">Commencez par créer votre première installation photovoltaïque</p>
        <button onclick="showCreatePlantModal()" class="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all">
          <i class="fas fa-plus mr-2"></i>Créer ma première centrale
        </button>
      </div>
    </div>

    <!-- Modal Création Centrale -->
    <div id="createPlantModal" class="hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        <div class="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
          <h3 class="text-xl font-bold text-white flex items-center gap-3">
            <i class="fas fa-plus-circle"></i>
            Nouvelle Centrale PV
          </h3>
        </div>
        
        <form id="createPlantForm" class="p-6 space-y-5">
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-2">Nom de la centrale *</label>
            <input type="text" id="plantName" required
                   class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                   placeholder="Ex: Centrale Solaire Marseille">
          </div>
          
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-2">Type d'installation *</label>
            <select id="plantType" required
                    class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all">
              <option value="rooftop">🏢 Toiture</option>
              <option value="ground">🏔️ Sol</option>
              <option value="carport">🚗 Ombrière</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-2">Client associé</label>
            <select id="plantClient"
                    class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all">
              <option value="">-- Sélectionner un client --</option>
            </select>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-2">Adresse</label>
              <input type="text" id="plantAddress"
                     class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                     placeholder="123 Rue du Soleil">
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-2">Ville</label>
              <input type="text" id="plantCity"
                     class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                     placeholder="Marseille">
            </div>
          </div>
          
          <div class="flex gap-3 pt-4">
            <button type="submit" class="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all">
              <i class="fas fa-save mr-2"></i>Créer la centrale
            </button>
            <button type="button" id="cancelCreateBtn" class="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-all">
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>

    <script>
    // ============================================
    // PV CARTOGRAPHY - Liste des centrales
    // Style unifié DiagPV OS
    // ============================================
    
    let plants = []
    let clients = []

    async function loadData() {
      await Promise.all([loadPlants(), loadClients()])
    }

    async function loadClients() {
      try {
        const response = await fetch('/api/crm/clients')
        const data = await response.json()
        clients = data.clients || []
        
        // Populate client dropdown
        const select = document.getElementById('plantClient')
        clients.forEach(client => {
          const option = document.createElement('option')
          option.value = client.id
          option.textContent = client.company_name || client.name || 'Client #' + client.id
          select.appendChild(option)
        })
      } catch (error) {
        console.error('Erreur chargement clients:', error)
      }
    }

    async function loadPlants() {
      try {
        const response = await fetch('/api/pv/plants')
        const data = await response.json()
        
        plants = data.plants || []
        
        updateStats()
        renderPlantsList()
      } catch (error) {
        console.error('Erreur chargement centrales:', error)
        showNotification('Erreur lors du chargement des centrales', 'error')
      }
    }

    function updateStats() {
      const totalZones = plants.reduce((sum, p) => sum + (p.zone_count || 0), 0)
      const totalModules = plants.reduce((sum, p) => sum + (p.module_count || 0), 0)
      const totalPower = plants.reduce((sum, p) => sum + (p.total_power_wp || 0), 0)
      
      document.getElementById('statsPlants').textContent = plants.length
      document.getElementById('statsZones').textContent = totalZones
      document.getElementById('statsModules').textContent = totalModules.toLocaleString('fr-FR')
      document.getElementById('statsPower').textContent = (totalPower / 1000).toFixed(1)
    }

    function renderPlantsList() {
      const container = document.getElementById('plantsList')
      const emptyState = document.getElementById('emptyState')
      
      if (plants.length === 0) {
        container.classList.add('hidden')
        emptyState.classList.remove('hidden')
        return
      }
      
      container.classList.remove('hidden')
      emptyState.classList.add('hidden')
      
      const typeConfig = {
        rooftop: { icon: 'fa-building', label: 'Toiture', color: 'blue' },
        ground: { icon: 'fa-mountain-sun', label: 'Sol', color: 'green' },
        carport: { icon: 'fa-car', label: 'Ombrière', color: 'amber' }
      }
      
      container.innerHTML = plants.map(plant => {
        const config = typeConfig[plant.plant_type] || { icon: 'fa-solar-panel', label: plant.plant_type, color: 'purple' }
        const clientInfo = plant.client_id ? clients.find(c => c.id === plant.client_id) : null
        
        return \`
          <div class="bg-white rounded-2xl border border-slate-200 hover:border-purple-300 hover:shadow-lg transition-all overflow-hidden group">
            <!-- Header with gradient -->
            <div class="bg-gradient-to-r from-purple-500 to-purple-600 p-4 relative overflow-hidden">
              <div class="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div class="relative">
                <div class="flex items-center gap-3 mb-2">
                  <div class="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <i class="fas \${config.icon} text-white"></i>
                  </div>
                  <div>
                    <h3 class="font-bold text-white text-lg truncate">\${plant.plant_name}</h3>
                    <span class="text-xs text-purple-200">\${config.label}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Content -->
            <div class="p-4">
              <!-- Stats -->
              <div class="grid grid-cols-3 gap-3 mb-4">
                <div class="text-center p-2 bg-slate-50 rounded-lg">
                  <div class="text-xl font-bold text-blue-600">\${plant.zone_count || 0}</div>
                  <div class="text-xs text-slate-500">Zones</div>
                </div>
                <div class="text-center p-2 bg-slate-50 rounded-lg">
                  <div class="text-xl font-bold text-green-600">\${plant.module_count || 0}</div>
                  <div class="text-xs text-slate-500">Modules</div>
                </div>
                <div class="text-center p-2 bg-slate-50 rounded-lg">
                  <div class="text-xl font-bold text-amber-600">\${((plant.total_power_wp || 0) / 1000).toFixed(1)}</div>
                  <div class="text-xs text-slate-500">kWc</div>
                </div>
              </div>
              
              <!-- Client & Location -->
              <div class="space-y-2 mb-4">
                \${clientInfo ? \`
                  <div class="flex items-center gap-2 text-sm text-slate-600">
                    <i class="fas fa-building w-4 text-slate-400"></i>
                    <span>\${clientInfo.company_name || 'Client'}</span>
                  </div>
                \` : ''}
                \${plant.address || plant.city ? \`
                  <div class="flex items-center gap-2 text-sm text-slate-600">
                    <i class="fas fa-map-marker-alt w-4 text-slate-400"></i>
                    <span>\${[plant.address, plant.city].filter(Boolean).join(', ')}</span>
                  </div>
                \` : ''}
              </div>
              
              <!-- Actions -->
              <div class="flex gap-2">
                <a href="/pv/plant/\${plant.id}" 
                   class="flex-1 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold text-center text-sm transition-colors">
                  <i class="fas fa-eye mr-1"></i> Voir détails
                </a>
                <a href="/pv/plant/\${plant.id}/designer" 
                   class="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-sm transition-colors">
                  <i class="fas fa-edit"></i>
                </a>
              </div>
            </div>
          </div>
        \`
      }).join('')
    }

    function showCreatePlantModal() {
      document.getElementById('createPlantModal').classList.remove('hidden')
    }

    function hideCreatePlantModal() {
      document.getElementById('createPlantModal').classList.add('hidden')
      document.getElementById('createPlantForm').reset()
    }

    async function createPlant(formData) {
      try {
        const response = await fetch('/api/pv/plants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
        
        const result = await response.json()
        
        if (result.success) {
          showNotification('Centrale créée avec succès !', 'success')
          hideCreatePlantModal()
          loadPlants()
        } else {
          showNotification(result.error || 'Erreur lors de la création', 'error')
        }
      } catch (error) {
        console.error('Erreur:', error)
        showNotification('Erreur lors de la création de la centrale', 'error')
      }
    }

    function showNotification(message, type = 'info') {
      const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500'
      }
      
      const notification = document.createElement('div')
      notification.className = \`fixed bottom-6 right-6 \${colors[type]} text-white px-6 py-3 rounded-xl shadow-lg z-50 font-semibold flex items-center gap-3 transform translate-y-0 opacity-100 transition-all\`
      notification.innerHTML = \`
        <i class="fas \${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>\${message}</span>
      \`
      
      document.body.appendChild(notification)
      
      setTimeout(() => {
        notification.classList.add('translate-y-4', 'opacity-0')
        setTimeout(() => notification.remove(), 300)
      }, 3000)
    }

    // Event listeners
    document.getElementById('createPlantBtn').addEventListener('click', showCreatePlantModal)
    document.getElementById('cancelCreateBtn').addEventListener('click', hideCreatePlantModal)
    
    document.getElementById('createPlantModal').addEventListener('click', (e) => {
      if (e.target === document.getElementById('createPlantModal')) {
        hideCreatePlantModal()
      }
    })
    
    document.getElementById('createPlantForm').addEventListener('submit', (e) => {
      e.preventDefault()
      
      const formData = {
        plant_name: document.getElementById('plantName').value,
        plant_type: document.getElementById('plantType').value,
        client_id: document.getElementById('plantClient').value || null,
        address: document.getElementById('plantAddress').value || null,
        city: document.getElementById('plantCity').value || null
      }
      
      createPlant(formData)
    })

    // Init
    loadData()
    </script>
  `

  return getLayout('Sites & Centrales PV', content, 'projects')
}
