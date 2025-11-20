import { Hono } from 'hono'
import type { D1Database } from '@cloudflare/workers-types'

type Bindings = {
  DB: D1Database
}

const missionsDashboardPage = new Hono<{ Bindings: Bindings }>()

// GET /missions/dashboard
missionsDashboardPage.get('/missions/dashboard', async (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Dashboard Missions - DiagPV</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css">
    </head>
    <body class="bg-gray-100">
      <div class="container mx-auto px-4 py-8">
        
        <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-3xl font-bold text-gray-800">
                <i class="fas fa-tasks text-blue-600 mr-2"></i>
                Dashboard Missions
              </h1>
              <p class="text-gray-600 mt-1">Affectation automatique diagnostiqueurs</p>
            </div>
            <button onclick="showCreateModal()" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold">
              <i class="fas fa-plus mr-2"></i>
              Nouvelle Mission
            </button>
          </div>
        </div>

        <!-- Stats -->
        <div id="statsCards" class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6"></div>

        <!-- Filters -->
        <div class="bg-white rounded-lg shadow-lg p-4 mb-6">
          <div class="flex gap-4">
            <select id="filter-statut" class="px-4 py-2 border rounded-lg" onchange="loadMissions()">
              <option value="">Tous statuts</option>
              <option value="en_attente">En attente</option>
              <option value="proposee">Proposée</option>
              <option value="affectee">Affectée</option>
              <option value="en_cours">En cours</option>
              <option value="terminee">Terminée</option>
            </select>
          </div>
        </div>

        <!-- Missions List -->
        <div id="missionsList" class="space-y-4"></div>

      </div>

      <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
      <script>
        async function loadStats() {
          const { data } = await axios.get('/api/missions/stats/global')
          if (data.success) {
            const s = data.stats
            document.getElementById('statsCards').innerHTML = \`
              <div class="bg-white rounded-lg shadow p-4">
                <div class="text-gray-500 text-sm">Total</div>
                <div class="text-2xl font-bold text-gray-800">\${s.total || 0}</div>
              </div>
              <div class="bg-yellow-50 rounded-lg shadow p-4">
                <div class="text-yellow-700 text-sm">En attente</div>
                <div class="text-2xl font-bold text-yellow-600">\${s.en_attente || 0}</div>
              </div>
              <div class="bg-blue-50 rounded-lg shadow p-4">
                <div class="text-blue-700 text-sm">Proposées</div>
                <div class="text-2xl font-bold text-blue-600">\${s.proposee || 0}</div>
              </div>
              <div class="bg-green-50 rounded-lg shadow p-4">
                <div class="text-green-700 text-sm">Affectées</div>
                <div class="text-2xl font-bold text-green-600">\${s.affectee || 0}</div>
              </div>
              <div class="bg-purple-50 rounded-lg shadow p-4">
                <div class="text-purple-700 text-sm">En cours</div>
                <div class="text-2xl font-bold text-purple-600">\${s.en_cours || 0}</div>
              </div>
            \`
          }
        }

        async function loadMissions() {
          const statut = document.getElementById('filter-statut').value
          const params = new URLSearchParams({ limit: 50 })
          if (statut) params.append('statut', statut)

          const { data } = await axios.get(\`/api/missions?\${params}\`)
          
          if (data.success && data.missions.length > 0) {
            const html = data.missions.map(m => \`
              <div class="bg-white rounded-lg shadow-lg p-6">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center gap-3 mb-3">
                      <h3 class="text-xl font-bold text-gray-800">\${m.titre}</h3>
                      <span class="px-3 py-1 text-sm font-semibold rounded \${getStatutBadgeClass(m.statut)}">\${getStatutLabel(m.statut)}</span>
                      <span class="px-2 py-1 text-xs rounded \${getPrioriteBadgeClass(m.priorite)}">\${m.priorite}</span>
                    </div>
                    
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                      <div><i class="fas fa-map-marker-alt text-red-500 mr-1"></i> \${m.ville} (\${m.code_postal})</div>
                      <div><i class="fas fa-calendar text-blue-500 mr-1"></i> \${m.date_souhaitee ? new Date(m.date_souhaitee).toLocaleDateString('fr-FR') : 'N/A'}</div>
                      <div><i class="fas fa-clock text-green-500 mr-1"></i> \${m.duree_estimee_heures}h estimées</div>
                      <div><i class="fas fa-clipboard-list text-purple-500 mr-1"></i> \${m.type_audit}</div>
                    </div>

                    \${m.diagnostiqueur_nom ? \`
                      <div class="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                        <div class="text-sm text-green-800">
                          <i class="fas fa-user-check mr-1"></i>
                          Affecté à: <strong>\${m.diagnostiqueur_nom} \${m.diagnostiqueur_prenom}</strong>
                        </div>
                      </div>
                    \` : ''}

                    \${m.propositions_en_attente > 0 ? \`
                      <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div class="text-sm text-blue-800">
                          <i class="fas fa-users mr-1"></i>
                          \${m.propositions_en_attente} proposition(s) en attente de réponse
                        </div>
                      </div>
                    \` : ''}
                  </div>

                  <div class="ml-4 flex flex-col gap-2">
                    <button onclick="viewMission(\${m.id})" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
                      <i class="fas fa-eye mr-1"></i> Détails
                    </button>
                    \${m.statut === 'en_attente' ? \`
                      <button onclick="proposerMission(\${m.id})" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm">
                        <i class="fas fa-share mr-1"></i> Proposer
                      </button>
                    \` : ''}
                  </div>
                </div>
              </div>
            \`).join('')
            
            document.getElementById('missionsList').innerHTML = html
          } else {
            document.getElementById('missionsList').innerHTML = '<div class="bg-white rounded-lg shadow-lg p-12 text-center text-gray-500">Aucune mission trouvée</div>'
          }
        }

        function getStatutLabel(statut) {
          const labels = {
            'en_attente': 'En attente',
            'proposee': 'Proposée',
            'affectee': 'Affectée',
            'en_cours': 'En cours',
            'terminee': 'Terminée',
            'validee': 'Validée'
          }
          return labels[statut] || statut
        }

        function getStatutBadgeClass(statut) {
          const classes = {
            'en_attente': 'bg-yellow-100 text-yellow-800',
            'proposee': 'bg-blue-100 text-blue-800',
            'affectee': 'bg-green-100 text-green-800',
            'en_cours': 'bg-purple-100 text-purple-800',
            'terminee': 'bg-gray-100 text-gray-800',
            'validee': 'bg-emerald-100 text-emerald-800'
          }
          return classes[statut] || 'bg-gray-100 text-gray-800'
        }

        function getPrioriteBadgeClass(priorite) {
          const classes = {
            'urgente': 'bg-red-100 text-red-800',
            'haute': 'bg-orange-100 text-orange-800',
            'normale': 'bg-blue-100 text-blue-800',
            'basse': 'bg-gray-100 text-gray-800'
          }
          return classes[priorite] || 'bg-gray-100 text-gray-800'
        }

        async function proposerMission(missionId) {
          if (!confirm('Lancer le matching automatique et proposer aux diagnostiqueurs ?')) return
          
          try {
            const { data } = await axios.post(\`/api/missions/\${missionId}/proposer\`, {
              nombre_propositions: 3
            })
            
            if (data.success) {
              alert(\`Mission proposée à \${data.propositions_count} diagnostiqueur(s) !\\n\\nTop scores: \${data.propositions.map(p => \`\${p.diagnostiqueur.nom} (\${p.score}/100)\`).join(', ')}\`)
              loadMissions()
              loadStats()
            }
          } catch (error) {
            console.error('Error:', error)
            alert('Erreur lors de la proposition')
          }
        }

        function viewMission(id) {
          window.location.href = \`/missions/detail/\${id}\`
        }

        function showCreateModal() {
          alert('Formulaire création mission à implémenter')
        }

        // Init
        loadStats()
        loadMissions()
      </script>
    </body>
    </html>
  `)
})

export default missionsDashboardPage
