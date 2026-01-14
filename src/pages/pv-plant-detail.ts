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
        <a href="/pv/plant/${plantId}/carto" class="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-purple-700 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all flex items-center gap-2">
          <i class="fas fa-map-marked-alt"></i>
          <span>Cartographie</span>
        </a>
        <a href="/pv/plant/${plantId}/import-plan" class="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all flex items-center gap-2">
          <i class="fas fa-file-import"></i>
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

      <!-- Audits EL Section -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 class="text-lg font-bold text-slate-800 flex items-center gap-3">
            <div class="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <i class="fas fa-search text-orange-600"></i>
            </div>
            Audits Électroluminescence
          </h2>
          <button id="createAuditBtn2" class="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-all flex items-center gap-2">
            <i class="fas fa-plus"></i>
            <span>Nouvel Audit EL</span>
          </button>
        </div>
        
        <!-- Loading Audits -->
        <div id="loadingAudits" class="p-6 text-center text-slate-400">
          <i class="fas fa-spinner fa-spin mr-2"></i> Chargement des audits...
        </div>
        
        <!-- No Audits -->
        <div id="noAudits" class="hidden p-8 text-center">
          <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-search text-3xl text-slate-300"></i>
          </div>
          <h3 class="text-lg font-bold text-slate-600 mb-2">Aucun audit EL</h3>
          <p class="text-slate-400 text-sm mb-4">Créez un audit électroluminescence pour cette centrale</p>
        </div>
        
        <!-- Audits List -->
        <div id="auditsList" class="hidden p-6 space-y-4"></div>
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
    let linkedAudits = []

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
        
        // Charger les audits EL liés
        loadLinkedAudits()
        
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

    // ============================================
    // AUDITS EL LIÉS
    // ============================================
    
    async function loadLinkedAudits() {
      const loadingEl = document.getElementById('loadingAudits')
      const noAuditsEl = document.getElementById('noAudits')
      const listEl = document.getElementById('auditsList')
      
      try {
        // Chercher les liens EL pour chaque zone
        const auditTokens = new Set()
        
        for (const zone of zones) {
          try {
            const res = await fetch(\`/api/pv/plants/\${PLANT_ID}/zones/\${zone.id}/el-link\`)
            const data = await res.json()
            
            if (data.linked && data.link?.el_audit_token) {
              auditTokens.add(data.link.el_audit_token)
            }
          } catch (e) {
            // Ignorer les erreurs de liaison
          }
        }
        
        linkedAudits = []
        
        // Charger les détails de chaque audit
        for (const token of auditTokens) {
          try {
            const res = await fetch(\`/api/el/audit/\${token}\`)
            const data = await res.json()
            
            if (data.audit) {
              linkedAudits.push({
                ...data.audit,
                progress: data.progress || {}
              })
            }
          } catch (e) {
            // Ignorer
          }
        }
        
        loadingEl.classList.add('hidden')
        
        if (linkedAudits.length === 0) {
          noAuditsEl.classList.remove('hidden')
          listEl.classList.add('hidden')
        } else {
          noAuditsEl.classList.add('hidden')
          listEl.classList.remove('hidden')
          renderLinkedAudits()
        }
        
      } catch (error) {
        console.error('Erreur chargement audits:', error)
        loadingEl.classList.add('hidden')
        noAuditsEl.classList.remove('hidden')
      }
    }
    
    function renderLinkedAudits() {
      const container = document.getElementById('auditsList')
      
      container.innerHTML = linkedAudits.map(audit => {
        const progress = audit.progress || {}
        const total = progress.total || audit.total_modules || 0
        const completed = progress.completed || 0
        const ok = progress.ok || 0
        const microcracks = progress.microcracks || 0
        const dead = progress.dead || 0
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0
        
        const statusColor = dead > 0 ? 'red' : (microcracks > 0 ? 'orange' : 'green')
        const statusIcon = dead > 0 ? 'exclamation-triangle' : (microcracks > 0 ? 'exclamation-circle' : 'check-circle')
        
        return \`
          <div class="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200 p-5 hover:shadow-lg transition-all">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <i class="fas fa-\${statusIcon} text-\${statusColor}-500 text-xl"></i>
                  <h3 class="font-bold text-slate-800 text-lg">\${audit.project_name || 'Audit EL'}</h3>
                </div>
                <div class="flex flex-wrap gap-4 text-sm text-slate-600">
                  <span><i class="fas fa-user mr-1"></i> \${audit.client_name || '-'}</span>
                  <span><i class="fas fa-map-marker-alt mr-1"></i> \${audit.location || '-'}</span>
                  <span><i class="fas fa-calendar mr-1"></i> \${new Date(audit.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
              
              <div class="flex flex-col md:flex-row gap-3">
                <!-- Stats rapides -->
                <div class="flex gap-2 text-sm">
                  <div class="bg-white rounded-lg px-3 py-2 text-center border">
                    <div class="font-bold text-green-600">\${ok}</div>
                    <div class="text-slate-400 text-xs">OK</div>
                  </div>
                  <div class="bg-white rounded-lg px-3 py-2 text-center border">
                    <div class="font-bold text-orange-600">\${microcracks}</div>
                    <div class="text-slate-400 text-xs">Micro</div>
                  </div>
                  <div class="bg-white rounded-lg px-3 py-2 text-center border">
                    <div class="font-bold text-red-600">\${dead}</div>
                    <div class="text-slate-400 text-xs">HS</div>
                  </div>
                  <div class="bg-white rounded-lg px-3 py-2 text-center border">
                    <div class="font-bold text-purple-600">\${completionRate}%</div>
                    <div class="text-slate-400 text-xs">Fait</div>
                  </div>
                </div>
                
                <!-- Actions -->
                <div class="flex gap-2">
                  <a href="/audit/\${audit.audit_token}" 
                     class="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2">
                    <i class="fas fa-edit"></i>
                    <span>Éditer</span>
                  </a>
                  <a href="/api/el/audit/\${audit.audit_token}/report" target="_blank"
                     class="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-all flex items-center gap-2">
                    <i class="fas fa-file-pdf"></i>
                    <span>Rapport</span>
                  </a>
                </div>
              </div>
            </div>
            
            <!-- Progress bar -->
            <div class="mt-4">
              <div class="flex justify-between text-xs text-slate-500 mb-1">
                <span>\${completed} / \${total} modules analysés</span>
                <span>\${completionRate}%</span>
              </div>
              <div class="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all" style="width: \${completionRate}%"></div>
              </div>
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
    document.getElementById('createAuditBtn2')?.addEventListener('click', createAuditFromPlant)
    
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
