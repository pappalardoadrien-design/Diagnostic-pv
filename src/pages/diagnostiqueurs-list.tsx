import { Hono } from 'hono'
import type { D1Database } from '@cloudflare/workers-types'

type Bindings = {
  DB: D1Database
}

const diagnostiqueursListPage = new Hono<{ Bindings: Bindings }>()

// ============================================================================
// PAGE LISTE DIAGNOSTIQUEURS
// ============================================================================
// GET /diagnostiqueurs/liste
diagnostiqueursListPage.get('/diagnostiqueurs/liste', async (c) => {
  const { DB } = c.env

  return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Réseau Diagnostiqueurs - DiagPV</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css">
    </head>
    <body class="bg-gray-100">
      <div class="container mx-auto px-4 py-8">
        
        <!-- Header -->
        <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-3xl font-bold text-gray-800">
                <i class="fas fa-users text-green-600 mr-2"></i>
                Réseau Diagnostiqueurs
              </h1>
              <p class="text-gray-600 mt-1">Gestion des partenaires labellisés DiagPV</p>
            </div>
            <div>
              <button onclick="showAddModal()" class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold inline-flex items-center">
                <i class="fas fa-user-plus mr-2"></i>
                Nouveau Diagnostiqueur
              </button>
            </div>
          </div>
        </div>

        <!-- Stats -->
        <div id="statsCards" class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div class="bg-white rounded-lg shadow p-4">
            <div class="text-gray-500 text-sm">Total</div>
            <div id="stat-total" class="text-2xl font-bold text-gray-800">-</div>
          </div>
          <div class="bg-green-50 rounded-lg shadow p-4">
            <div class="text-green-700 text-sm">Labellisés</div>
            <div id="stat-labellises" class="text-2xl font-bold text-green-600">-</div>
          </div>
          <div class="bg-blue-50 rounded-lg shadow p-4">
            <div class="text-blue-700 text-sm">En évaluation</div>
            <div id="stat-evaluation" class="text-2xl font-bold text-blue-600">-</div>
          </div>
          <div class="bg-yellow-50 rounded-lg shadow p-4">
            <div class="text-yellow-700 text-sm">Candidats</div>
            <div id="stat-candidats" class="text-2xl font-bold text-yellow-600">-</div>
          </div>
          <div class="bg-purple-50 rounded-lg shadow p-4">
            <div class="text-purple-700 text-sm">Disponibles</div>
            <div id="stat-disponibles" class="text-2xl font-bold text-purple-600">-</div>
          </div>
        </div>

        <!-- Filters -->
        <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Statut</label>
              <select id="filter-statut" class="w-full px-4 py-2 border border-gray-300 rounded-lg" onchange="loadDiagnostiqueurs()">
                <option value="">Tous</option>
                <option value="candidat">Candidat</option>
                <option value="en_evaluation">En évaluation</option>
                <option value="labellise">Labellisé</option>
                <option value="suspendu">Suspendu</option>
                <option value="refuse">Refusé</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Zone</label>
              <input type="text" id="filter-zone" placeholder="Code postal..." class="w-full px-4 py-2 border border-gray-300 rounded-lg" onchange="loadDiagnostiqueurs()">
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Disponibilité</label>
              <select id="filter-disponible" class="w-full px-4 py-2 border border-gray-300 rounded-lg" onchange="loadDiagnostiqueurs()">
                <option value="">Tous</option>
                <option value="true">Disponible</option>
                <option value="false">Indisponible</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Recherche</label>
              <input type="text" id="filter-search" placeholder="Nom, email..." class="w-full px-4 py-2 border border-gray-300 rounded-lg" onkeyup="debounceSearch()">
            </div>
          </div>
        </div>

        <!-- Liste -->
        <div class="bg-white rounded-lg shadow-lg overflow-hidden">
          <div id="loading" class="p-8 text-center text-gray-500">
            <i class="fas fa-spinner fa-spin text-3xl mb-2"></i>
            <p>Chargement...</p>
          </div>
          
          <div id="diagnostiqueursList" class="hidden">
            <table class="w-full">
              <thead class="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Diagnostiqueur</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Statut</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Label</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Performances</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Zones</th>
                  <th class="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody id="diagnostiqueursTableBody" class="divide-y divide-gray-200">
              </tbody>
            </table>
          </div>

          <div id="emptyState" class="hidden p-12 text-center">
            <i class="fas fa-user-slash text-gray-300 text-6xl mb-4"></i>
            <p class="text-gray-500 text-lg">Aucun diagnostiqueur trouvé</p>
          </div>
        </div>

        <!-- Pagination -->
        <div id="pagination" class="mt-6 flex justify-center"></div>

      </div>

      <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
      <script>
        let currentPage = 1
        let searchTimeout = null

        async function loadStats() {
          try {
            const { data } = await axios.get('/api/diagnostiqueurs/stats/global')
            if (data.success) {
              const stats = data.stats
              document.getElementById('stat-total').textContent = stats.total || 0
              document.getElementById('stat-labellises').textContent = stats.labellises || 0
              document.getElementById('stat-evaluation').textContent = stats.en_evaluation || 0
              document.getElementById('stat-candidats').textContent = stats.candidats || 0
              document.getElementById('stat-disponibles').textContent = stats.disponibles || 0
            }
          } catch (error) {
            console.error('Error loading stats:', error)
          }
        }

        async function loadDiagnostiqueurs(page = 1) {
          currentPage = page
          const statut = document.getElementById('filter-statut').value
          const zone = document.getElementById('filter-zone').value
          const disponible = document.getElementById('filter-disponible').value
          const search = document.getElementById('filter-search').value

          const params = new URLSearchParams({ page, limit: 20 })
          if (statut) params.append('statut', statut)
          if (zone) params.append('zone', zone)
          if (disponible) params.append('disponible', disponible)
          if (search) params.append('search', search)

          document.getElementById('loading').classList.remove('hidden')
          document.getElementById('diagnostiqueursList').classList.add('hidden')

          try {
            const { data } = await axios.get(\`/api/diagnostiqueurs?\${params}\`)
            
            if (data.success && data.diagnostiqueurs.length > 0) {
              renderDiagnostiqueurs(data.diagnostiqueurs)
              renderPagination(data.pagination)
              document.getElementById('diagnostiqueursList').classList.remove('hidden')
              document.getElementById('emptyState').classList.add('hidden')
            } else {
              document.getElementById('emptyState').classList.remove('hidden')
              document.getElementById('diagnostiqueursList').classList.add('hidden')
            }
          } catch (error) {
            console.error('Error loading diagnostiqueurs:', error)
            alert('Erreur chargement données')
          } finally {
            document.getElementById('loading').classList.add('hidden')
          }
        }

        function renderDiagnostiqueurs(diagnostiqueurs) {
          const tbody = document.getElementById('diagnostiqueursTableBody')
          tbody.innerHTML = diagnostiqueurs.map(d => {
            const statutBadges = {
              'candidat': '<span class="px-2 py-1 text-xs font-semibold rounded bg-yellow-100 text-yellow-800">Candidat</span>',
              'en_evaluation': '<span class="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">En évaluation</span>',
              'labellise': '<span class="px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800">Labellisé</span>',
              'suspendu': '<span class="px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800">Suspendu</span>',
              'refuse': '<span class="px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-800">Refusé</span>'
            }

            const zones = d.zones_intervention ? JSON.parse(d.zones_intervention).join(', ') : 'N/A'
            const disponibilite = d.disponible ? '<i class="fas fa-check-circle text-green-500"></i>' : '<i class="fas fa-times-circle text-red-500"></i>'

            return \`
              <tr class="hover:bg-gray-50">
                <td class="px-6 py-4">
                  <div class="font-semibold text-gray-800">\${d.nom} \${d.prenom}</div>
                  <div class="text-sm text-gray-500">\${d.email}</div>
                  <div class="text-sm text-gray-500">\${d.entreprise || ''}</div>
                </td>
                <td class="px-6 py-4">
                  \${statutBadges[d.statut_label]}
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm font-mono text-gray-700">\${d.numero_label || 'N/A'}</div>
                  \${d.date_labellisation ? '<div class="text-xs text-gray-500">' + new Date(d.date_labellisation).toLocaleDateString('fr-FR') + '</div>' : ''}
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm">
                    <div>⭐ Note: <strong>\${(d.note_moyenne || 0).toFixed(1)}/5</strong></div>
                    <div>✅ Conformité: <strong>\${(d.taux_conformite_moyen || 0).toFixed(0)}%</strong></div>
                    <div>📊 Audits: <strong>\${d.nombre_audits_realises || 0}</strong></div>
                  </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">
                  \${zones}
                </td>
                <td class="px-6 py-4 text-center">
                  <button onclick="viewDiagnostiqueur(\${d.id})" class="text-blue-600 hover:text-blue-800 mx-1">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button onclick="editDiagnostiqueur(\${d.id})" class="text-green-600 hover:text-green-800 mx-1">
                    <i class="fas fa-edit"></i>
                  </button>
                  \${d.statut_label === 'en_evaluation' ? '<button onclick="labelliser(' + d.id + ')" class="text-purple-600 hover:text-purple-800 mx-1"><i class="fas fa-certificate"></i></button>' : ''}
                </td>
              </tr>
            \`
          }).join('')
        }

        function renderPagination(pagination) {
          const div = document.getElementById('pagination')
          const pages = []
          
          for (let i = 1; i <= pagination.total_pages; i++) {
            if (i === pagination.page) {
              pages.push(\`<button class="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold">\${i}</button>\`)
            } else {
              pages.push(\`<button onclick="loadDiagnostiqueurs(\${i})" class="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100">\${i}</button>\`)
            }
          }
          
          div.innerHTML = \`<div class="flex gap-2">\${pages.join('')}</div>\`
        }

        function debounceSearch() {
          clearTimeout(searchTimeout)
          searchTimeout = setTimeout(() => loadDiagnostiqueurs(), 500)
        }

        function showAddModal() {
          alert('Formulaire ajout diagnostiqueur à implémenter')
        }

        function viewDiagnostiqueur(id) {
          window.location.href = \`/diagnostiqueurs/detail/\${id}\`
        }

        function editDiagnostiqueur(id) {
          alert(\`Édition diagnostiqueur #\${id} à implémenter\`)
        }

        async function labelliser(id) {
          if (!confirm('Confirmer la labellisation de ce diagnostiqueur ?')) return
          
          try {
            const { data } = await axios.post(\`/api/diagnostiqueurs/\${id}/labelliser\`)
            if (data.success) {
              alert(\`Labellisé avec succès !\\nNuméro: \${data.numero_label}\`)
              loadDiagnostiqueurs(currentPage)
              loadStats()
            }
          } catch (error) {
            console.error('Error labellizing:', error)
            alert('Erreur lors de la labellisation')
          }
        }

        // Init
        loadStats()
        loadDiagnostiqueurs()
      </script>
    </body>
    </html>
  `)
})

export default diagnostiqueursListPage
