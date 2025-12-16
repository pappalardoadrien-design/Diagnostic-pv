// ============================================================================
// PAGE CRM - VUE UNIFIÉE CLIENT → PROJECTS → INTERVENTIONS → AUDITS
// ============================================================================
// Navigation hiérarchique complète avec synchronisation dynamique
// Permet de suivre l'intégralité du workflow depuis le client jusqu'aux audits
// ============================================================================

import { Hono } from 'hono'
import { html } from 'hono/html'

type Bindings = {
  DB: D1Database
}

const crmUnifiedViewPage = new Hono<{ Bindings: Bindings }>()

// ============================================================================
// GET /api/crm/unified-view - Page principale vue unifiée
// ============================================================================
crmUnifiedViewPage.get('/', async (c) => {
  const { DB } = c.env
  
  // Récupérer TOUS les clients avec statistiques
  const clients = await DB.prepare(`
    SELECT 
      c.id,
      c.company_name,
      c.client_type,
      c.city,
      c.status,
      c.main_contact_name,
      c.main_contact_email,
      c.main_contact_phone,
      COUNT(DISTINCT p.id) as project_count,
      COUNT(DISTINCT i.id) as intervention_count,
      COUNT(DISTINCT a.id) as audit_count
    FROM crm_clients c
    LEFT JOIN projects p ON p.client_id = c.id
    LEFT JOIN interventions i ON i.project_id = p.id
    LEFT JOIN audits a ON a.client_id = c.id
    WHERE c.status = 'active'
    GROUP BY c.id
    ORDER BY c.company_name ASC
  `).all()
  
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>CRM Unifié - DiagPV</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
      <style>
        .client-card { transition: all 0.2s; }
        .client-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .stat-badge { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .loading { animation: pulse 1.5s ease-in-out infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      </style>
    </head>
    <body class="bg-gray-50">
      
      <!-- Header -->
      <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-6 shadow-lg">
        <div class="container mx-auto px-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-3xl font-bold mb-2">
                <i class="fas fa-sitemap mr-3"></i>
                CRM Unifié - Vue Complète
              </h1>
              <p class="text-blue-100">Client → Projets → Interventions → Audits</p>
            </div>
            <div class="flex gap-3">
              <a href="/" class="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition">
                <i class="fas fa-clipboard-list mr-2"></i>Dashboard Audits
              </a>
              <a href="/api/crm/clients" class="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/30 transition">
                <i class="fas fa-users mr-2"></i>Gestion Clients
              </a>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Stats globales -->
      <div class="container mx-auto px-6 py-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div class="bg-white rounded-xl shadow-md p-6">
            <div class="flex items-center">
              <div class="stat-badge p-3 rounded-lg">
                <i class="fas fa-building text-white text-2xl"></i>
              </div>
              <div class="ml-4">
                <p class="text-gray-500 text-sm">Clients Actifs</p>
                <p class="text-2xl font-bold text-gray-800">${clients.results.length}</p>
              </div>
            </div>
          </div>
          
          <div class="bg-white rounded-xl shadow-md p-6">
            <div class="flex items-center">
              <div class="bg-green-500 p-3 rounded-lg">
                <i class="fas fa-solar-panel text-white text-2xl"></i>
              </div>
              <div class="ml-4">
                <p class="text-gray-500 text-sm">Total Projets</p>
                <p class="text-2xl font-bold text-gray-800">
                  ${clients.results.reduce((sum, c) => sum + (c.project_count || 0), 0)}
                </p>
              </div>
            </div>
          </div>
          
          <div class="bg-white rounded-xl shadow-md p-6">
            <div class="flex items-center">
              <div class="bg-blue-500 p-3 rounded-lg">
                <i class="fas fa-hard-hat text-white text-2xl"></i>
              </div>
              <div class="ml-4">
                <p class="text-gray-500 text-sm">Total Interventions</p>
                <p class="text-2xl font-bold text-gray-800">
                  ${clients.results.reduce((sum, c) => sum + (c.intervention_count || 0), 0)}
                </p>
              </div>
            </div>
          </div>
          
          <div class="bg-white rounded-xl shadow-md p-6">
            <div class="flex items-center">
              <div class="bg-purple-500 p-3 rounded-lg">
                <i class="fas fa-clipboard-check text-white text-2xl"></i>
              </div>
              <div class="ml-4">
                <p class="text-gray-500 text-sm">Total Audits</p>
                <p class="text-2xl font-bold text-gray-800">
                  ${clients.results.reduce((sum, c) => sum + (c.audit_count || 0), 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Liste des clients avec détails -->
        <div class="bg-white rounded-xl shadow-lg p-6">
          <h2 class="text-2xl font-bold text-gray-800 mb-6">
            <i class="fas fa-users mr-2"></i>
            Clients et Projets
          </h2>
          
          <div class="space-y-4">
            ${clients.results.map(client => `
              <div class="client-card border border-gray-200 rounded-lg p-6 hover:border-blue-400">
                <div class="flex items-start justify-between mb-4">
                  <div class="flex-1">
                    <h3 class="text-xl font-bold text-gray-800 mb-2">
                      <i class="fas fa-building text-blue-600 mr-2"></i>
                      ${client.company_name}
                    </h3>
                    <div class="flex items-center gap-4 text-sm text-gray-600">
                      <span><i class="fas fa-tag mr-1"></i>${client.client_type}</span>
                      ${client.city ? `<span><i class="fas fa-map-marker-alt mr-1"></i>${client.city}</span>` : ''}
                      ${client.main_contact_name ? `<span><i class="fas fa-user mr-1"></i>${client.main_contact_name}</span>` : ''}
                    </div>
                  </div>
                  
                  <div class="flex gap-2">
                    <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                      ${client.project_count} projet${client.project_count > 1 ? 's' : ''}
                    </span>
                    <span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                      ${client.intervention_count} intervention${client.intervention_count > 1 ? 's' : ''}
                    </span>
                    <span class="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
                      ${client.audit_count} audit${client.audit_count > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                
                <!-- Détails du client (chargement dynamique) -->
                <div id="client-details-${client.id}" class="hidden mt-4 border-t pt-4"></div>
                
                <div class="flex gap-3 mt-4">
                  <button 
                    onclick="loadClientDetails(${client.id})" 
                    class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                    <i class="fas fa-eye mr-2"></i>Voir Détails
                  </button>
                  <a href="/api/crm/clients/${client.id}" 
                     class="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition">
                    <i class="fas fa-edit mr-2"></i>Éditer
                  </a>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
      
      <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
      <script>
        let expandedClients = {};
        
        async function loadClientDetails(clientId) {
          const detailsDiv = document.getElementById(\`client-details-\${clientId}\`);
          
          // Toggle visibility
          if (expandedClients[clientId]) {
            detailsDiv.classList.add('hidden');
            expandedClients[clientId] = false;
            return;
          }
          
          // Afficher le chargement
          detailsDiv.innerHTML = '<p class="text-gray-500 loading"><i class="fas fa-spinner fa-spin mr-2"></i>Chargement...</p>';
          detailsDiv.classList.remove('hidden');
          
          try {
            // Charger les données du client
            const response = await axios.get(\`/api/crm-unified/client/\${clientId}/details\`);
            const data = response.data;
            
            // Construire le HTML des détails
            let html = '<div class="space-y-4">';
            
            // Projets
            if (data.projects && data.projects.length > 0) {
              html += '<div class="bg-blue-50 rounded-lg p-4">';
              html += '<h4 class="font-bold text-gray-800 mb-3"><i class="fas fa-solar-panel mr-2"></i>Projets</h4>';
              html += '<div class="space-y-2">';
              
              data.projects.forEach(project => {
                html += \`
                  <div class="bg-white rounded p-3 border border-blue-200">
                    <div class="flex items-center justify-between">
                      <div>
                        <p class="font-semibold text-gray-800">\${project.name}</p>
                        <p class="text-sm text-gray-600">\${project.site_address || 'Adresse non renseignée'}</p>
                        <p class="text-xs text-gray-500 mt-1">\${project.total_modules || 0} modules · \${project.installation_power || 0} kWp</p>
                      </div>
                      <button 
                        onclick="loadProjectDetails(\${project.id})" 
                        class="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm">
                        Voir Interventions
                      </button>
                    </div>
                    <div id="project-details-\${project.id}" class="hidden mt-3 border-t pt-3"></div>
                  </div>
                \`;
              });
              
              html += '</div></div>';
            }
            
            // Audits directs
            if (data.audits && data.audits.length > 0) {
              html += '<div class="bg-purple-50 rounded-lg p-4">';
              html += '<h4 class="font-bold text-gray-800 mb-3"><i class="fas fa-clipboard-check mr-2"></i>Audits</h4>';
              html += '<div class="space-y-2">';
              
              data.audits.forEach(audit => {
                const modules = JSON.parse(audit.modules_enabled || '[]');
                html += \`
                  <div class="bg-white rounded p-3 border border-purple-200">
                    <div class="flex items-center justify-between">
                      <div>
                        <p class="font-semibold text-gray-800">\${audit.project_name}</p>
                        <p class="text-sm text-gray-600">\${audit.location || 'Localisation non renseignée'}</p>
                        <div class="flex gap-2 mt-1">
                          \${modules.map(m => \`<span class="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">\${m}</span>\`).join('')}
                        </div>
                      </div>
                      <a href="/api/calepinage/editor/\${audit.audit_token}?module_type=el" 
                         class="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 text-sm">
                        <i class="fas fa-pencil-ruler mr-1"></i>Calepinage
                      </a>
                    </div>
                  </div>
                \`;
              });
              
              html += '</div></div>';
            }
            
            html += '</div>';
            detailsDiv.innerHTML = html;
            expandedClients[clientId] = true;
            
          } catch (error) {
            console.error('Erreur chargement détails:', error);
            detailsDiv.innerHTML = '<p class="text-red-500"><i class="fas fa-exclamation-triangle mr-2"></i>Erreur de chargement</p>';
          }
        }
        
        async function loadProjectDetails(projectId) {
          const detailsDiv = document.getElementById(\`project-details-\${projectId}\`);
          
          if (!detailsDiv.classList.contains('hidden')) {
            detailsDiv.classList.add('hidden');
            return;
          }
          
          detailsDiv.innerHTML = '<p class="text-gray-500 loading text-sm"><i class="fas fa-spinner fa-spin mr-2"></i>Chargement interventions...</p>';
          detailsDiv.classList.remove('hidden');
          
          try {
            const response = await axios.get(\`/api/crm-unified/project/\${projectId}/interventions\`);
            const interventions = response.data.interventions;
            
            if (interventions && interventions.length > 0) {
              let html = '<div class="space-y-2">';
              interventions.forEach(intervention => {
                html += \`
                  <div class="bg-gray-50 rounded p-2 text-sm">
                    <div class="flex items-center justify-between">
                      <div>
                        <span class="font-semibold">\${intervention.intervention_type}</span>
                        <span class="text-gray-500 ml-2">\${new Date(intervention.intervention_date).toLocaleDateString('fr-FR')}</span>
                        <span class="ml-2 px-2 py-1 rounded text-xs \${
                          intervention.status === 'completed' ? 'bg-green-100 text-green-800' :
                          intervention.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }">\${intervention.status}</span>
                      </div>
                      \${intervention.audit_count > 0 ? \`<span class="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">\${intervention.audit_count} audit(s)</span>\` : ''}
                    </div>
                  </div>
                \`;
              });
              html += '</div>';
              detailsDiv.innerHTML = html;
            } else {
              detailsDiv.innerHTML = '<p class="text-gray-500 text-sm">Aucune intervention</p>';
            }
            
          } catch (error) {
            console.error('Erreur chargement interventions:', error);
            detailsDiv.innerHTML = '<p class="text-red-500 text-sm">Erreur de chargement</p>';
          }
        }
      </script>
    </body>
    </html>
  `
  
  return c.html(htmlContent)
})

// ============================================================================
// GET /api/crm/unified-view/client/:id/details
// API pour charger les détails d'un client (projets + audits)
// ============================================================================
crmUnifiedViewPage.get('/client/:id/details', async (c) => {
  const { DB } = c.env
  const clientId = parseInt(c.req.param('id'))
  
  // Récupérer les projets du client
  const projects = await DB.prepare(`
    SELECT 
      id, name, site_address, installation_power,
      total_modules, string_count
    FROM projects
    WHERE client_id = ?
    ORDER BY created_at DESC
  `).bind(clientId).all()
  
  // Récupérer les audits du client
  const audits = await DB.prepare(`
    SELECT 
      id, audit_token, project_name, location,
      modules_enabled, status, created_at
    FROM audits
    WHERE client_id = ?
    ORDER BY created_at DESC
  `).bind(clientId).all()
  
  return c.json({
    success: true,
    projects: projects.results,
    audits: audits.results
  })
})

// ============================================================================
// GET /api/crm/unified-view/project/:id/interventions
// API pour charger les interventions d'un projet
// ============================================================================
crmUnifiedViewPage.get('/project/:id/interventions', async (c) => {
  const { DB } = c.env
  const projectId = parseInt(c.req.param('id'))
  
  const interventions = await DB.prepare(`
    SELECT 
      i.id, i.intervention_type, i.intervention_date, i.status,
      COUNT(DISTINCT a.id) as audit_count
    FROM interventions i
    LEFT JOIN audits a ON a.intervention_id = i.id
    WHERE i.project_id = ?
    GROUP BY i.id
    ORDER BY i.intervention_date DESC
  `).bind(projectId).all()
  
  return c.json({
    success: true,
    interventions: interventions.results
  })
})

export default crmUnifiedViewPage
