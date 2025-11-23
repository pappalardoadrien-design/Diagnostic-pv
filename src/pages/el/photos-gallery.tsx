import { Hono } from 'hono'
import type { D1Database } from '@cloudflare/workers-types'

type Bindings = {
  DB: D1Database
}

const elPhotosGalleryRoutes = new Hono<{ Bindings: Bindings }>()

// ============================================================================
// PAGE GALERIE PHOTOS EL
// ============================================================================
// GET /audit/:token/el/photos
elPhotosGalleryRoutes.get('/audit/:token/el/photos', async (c) => {
  const { DB } = c.env
  const token = c.req.param('token')
  
  // Get audit info (unified from audits + el_audits)
  const { results: audits } = await DB.prepare(`
    SELECT 
      a.*,
      el.*,
      a.id as audit_id,
      el.id as el_audit_id
    FROM audits a
    LEFT JOIN el_audits el ON a.audit_token = el.audit_token
    WHERE a.audit_token = ?
  `).bind(token).all()
  
  if (!audits || audits.length === 0) {
    return c.html(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Audit introuvable</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-gray-100 p-8">
        <div class="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <h1 class="text-2xl font-bold text-red-600 mb-4">❌ Audit introuvable</h1>
          <p>Token: ${token}</p>
          <a href="/" class="mt-4 inline-block text-blue-600 hover:underline">← Retour accueil</a>
        </div>
      </body>
      </html>
    `)
  }
  
  const audit = audits[0] as any
  
  // Get photos with module info
  const { results: photos } = await DB.prepare(`
    SELECT 
      p.*,
      m.string_number,
      m.position_in_string,
      m.defect_type as module_defect_type
    FROM el_photos p
    LEFT JOIN el_modules m ON p.el_module_id = m.id
    WHERE p.audit_token = ?
    ORDER BY p.severity_level DESC, p.created_at DESC
  `).bind(token).all()
  
  // Get stats
  const { results: stats } = await DB.prepare(`
    SELECT * FROM v_el_photos_stats WHERE audit_token = ?
  `).bind(token).all()
  
  const photoStats = stats && stats.length > 0 ? stats[0] as any : {
    total_photos: 0,
    modules_with_photos: 0,
    defect_photos: 0,
    critical_photos: 0,
    total_storage_bytes: 0
  }
  
  // Group photos by module
  const photosByModule: Record<string, any[]> = {}
  photos?.forEach((photo: any) => {
    if (!photosByModule[photo.module_identifier]) {
      photosByModule[photo.module_identifier] = []
    }
    photosByModule[photo.module_identifier].push(photo)
  })
  
  const defectLabels: Record<string, string> = {
    'microcracks': '🔬 Microfissures',
    'hotspot': '🔥 Point chaud',
    'pid': '⚡ PID',
    'bypass_diode': '🔌 Diode bypass',
    'snail_trail': '🐌 Snail trail',
    'delamination': '🔨 Délamination'
  }
  
  const severityLabels: Record<number, { label: string, color: string }> = {
    0: { label: 'Aucun', color: 'bg-gray-200 text-gray-700' },
    1: { label: 'Mineur', color: 'bg-blue-200 text-blue-800' },
    2: { label: 'Modéré', color: 'bg-yellow-200 text-yellow-800' },
    3: { label: 'Sévère', color: 'bg-orange-200 text-orange-800' },
    4: { label: 'Critique', color: 'bg-red-200 text-red-800' }
  }
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Galerie Photos EL - ${audit.project_name}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css">
      <style>
        .photo-card { transition: transform 0.2s; }
        .photo-card:hover { transform: scale(1.02); }
        .modal { display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.9); }
        .modal.active { display: flex; align-items: center; justify-content: center; }
        .modal-content { max-width: 90%; max-height: 90vh; object-fit: contain; }
      </style>
    </head>
    <body class="bg-gray-100">
      <div class="container mx-auto px-4 py-8">
        <!-- Header -->
        <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h1 class="text-3xl font-bold text-gray-800">
                <i class="fas fa-images text-purple-600 mr-2"></i>
                Galerie Photos EL
              </h1>
              <p class="text-gray-600 mt-1">📍 ${audit.project_name} - ${audit.site_location}</p>
            </div>
            <div class="text-right flex gap-3">
              <a href="/api/el/reports/photos/${token}" target="_blank" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold inline-flex items-center">
                <i class="fas fa-file-pdf mr-2"></i>
                Rapport PDF
              </a>
              <a href="/audit/${token}/el/photos/upload" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold inline-flex items-center">
                <i class="fas fa-upload mr-2"></i>
                Upload Photos
              </a>
            </div>
          </div>
          
          <!-- Stats -->
          <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div class="bg-blue-50 rounded-lg p-4">
              <div class="text-blue-600 text-2xl font-bold">${photoStats.total_photos}</div>
              <div class="text-gray-600 text-sm">Photos totales</div>
            </div>
            <div class="bg-green-50 rounded-lg p-4">
              <div class="text-green-600 text-2xl font-bold">${photoStats.modules_with_photos}</div>
              <div class="text-gray-600 text-sm">Modules photographiés</div>
            </div>
            <div class="bg-yellow-50 rounded-lg p-4">
              <div class="text-yellow-600 text-2xl font-bold">${photoStats.defect_photos}</div>
              <div class="text-gray-600 text-sm">Photos défauts</div>
            </div>
            <div class="bg-red-50 rounded-lg p-4">
              <div class="text-red-600 text-2xl font-bold">${photoStats.critical_photos}</div>
              <div class="text-gray-600 text-sm">Défauts critiques</div>
            </div>
            <div class="bg-purple-50 rounded-lg p-4">
              <div class="text-purple-600 text-2xl font-bold">${(photoStats.total_storage_bytes / 1024 / 1024).toFixed(1)} MB</div>
              <div class="text-gray-600 text-sm">Stockage utilisé</div>
            </div>
          </div>
        </div>
        
        ${photoStats.total_photos === 0 ? `
          <div class="bg-white rounded-lg shadow-lg p-12 text-center">
            <i class="fas fa-camera text-gray-300 text-6xl mb-4"></i>
            <h2 class="text-2xl font-bold text-gray-700 mb-2">Aucune photo uploadée</h2>
            <p class="text-gray-500 mb-6">Commencez par uploader des photos de défauts EL</p>
            <a href="/audit/${token}/el/photos/upload" class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold inline-flex items-center">
              <i class="fas fa-upload mr-2"></i>
              Upload Photos
            </a>
          </div>
        ` : `
          <!-- Photos by Module -->
          ${Object.entries(photosByModule).map(([moduleId, modulePhotos]) => {
            const firstPhoto = modulePhotos[0]
            return `
              <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
                <h2 class="text-xl font-bold text-gray-800 mb-4">
                  <i class="fas fa-solar-panel text-blue-600 mr-2"></i>
                  Module ${moduleId}
                  ${firstPhoto.string_number ? `<span class="text-sm font-normal text-gray-600">- String ${firstPhoto.string_number}, Position ${firstPhoto.position_in_string}</span>` : ''}
                  <span class="text-sm font-normal text-gray-500 ml-2">(${modulePhotos.length} photo${modulePhotos.length > 1 ? 's' : ''})</span>
                </h2>
                
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  ${modulePhotos.map((photo: any) => {
                    const severity = severityLabels[photo.severity_level] || severityLabels[0]
                    const defect = photo.defect_category ? defectLabels[photo.defect_category] || photo.defect_category : 'Non spécifié'
                    
                    return `
                      <div class="photo-card bg-gray-50 rounded-lg overflow-hidden shadow cursor-pointer" onclick="openModal('${photo.r2_url}', '${photo.module_identifier}', '${defect}', '${photo.description || ''}')">
                        <div class="relative">
                          <img src="${photo.r2_url}" alt="Photo ${photo.module_identifier}" class="w-full h-48 object-cover">
                          <div class="absolute top-2 right-2">
                            <span class="px-2 py-1 text-xs font-semibold rounded ${severity.color}">
                              ${severity.label}
                            </span>
                          </div>
                        </div>
                        <div class="p-3">
                          <div class="text-sm font-semibold text-gray-700 mb-1">${defect}</div>
                          ${photo.description ? `<div class="text-xs text-gray-500 truncate">${photo.description}</div>` : ''}
                          <div class="text-xs text-gray-400 mt-2">
                            <i class="far fa-clock mr-1"></i>
                            ${new Date(photo.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    `
                  }).join('')}
                </div>
              </div>
            `
          }).join('')}
        `}
        
        <!-- Navigation -->
        <div class="bg-white rounded-lg shadow-lg p-6 mt-6">
          <div class="flex gap-3">
            <a href="/audit/${token}" class="text-blue-600 hover:text-blue-800 font-semibold">
              <i class="fas fa-arrow-left mr-2"></i>
              Retour audit EL
            </a>
            <a href="/audit/${token}/el/photos/upload" class="text-purple-600 hover:text-purple-800 font-semibold">
              <i class="fas fa-upload mr-2"></i>
              Upload Photos
            </a>
          </div>
        </div>
      </div>
      
      <!-- Modal -->
      <div id="photoModal" class="modal" onclick="closeModal()">
        <span class="absolute top-4 right-8 text-white text-4xl font-bold cursor-pointer hover:text-gray-300">&times;</span>
        <div class="text-center">
          <img id="modalImage" class="modal-content rounded-lg shadow-2xl">
          <div class="bg-white rounded-lg p-4 mt-4 max-w-2xl mx-auto">
            <h3 id="modalModule" class="text-lg font-bold text-gray-800 mb-2"></h3>
            <p id="modalDefect" class="text-gray-600 mb-2"></p>
            <p id="modalDescription" class="text-sm text-gray-500"></p>
          </div>
        </div>
      </div>
      
      <script>
        function openModal(imageUrl, moduleId, defect, description) {
          document.getElementById('photoModal').classList.add('active')
          document.getElementById('modalImage').src = imageUrl
          document.getElementById('modalModule').textContent = 'Module ' + moduleId
          document.getElementById('modalDefect').textContent = defect
          document.getElementById('modalDescription').textContent = description || 'Aucune description'
        }
        
        function closeModal() {
          document.getElementById('photoModal').classList.remove('active')
        }
        
        document.addEventListener('keydown', function(e) {
          if (e.key === 'Escape') closeModal()
        })
      </script>
    </body>
    </html>
  `)
})

export default elPhotosGalleryRoutes
