import { Hono } from 'hono'
import type { D1Database } from '@cloudflare/workers-types'

type Bindings = {
  DB: D1Database
}

const elPhotosUploadRoutes = new Hono<{ Bindings: Bindings }>()

// ============================================================================
// PAGE UPLOAD PHOTOS EL
// ============================================================================
// GET /audit/:token/el/photos/upload
elPhotosUploadRoutes.get('/audit/:token/el/photos/upload', async (c) => {
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
  
  // Get modules list for selector
  const { results: modules } = await DB.prepare(`
    SELECT module_identifier, string_number, position_in_string
    FROM el_modules
    WHERE audit_token = ?
    ORDER BY string_number ASC, position_in_string ASC
  `).bind(token).all()
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Upload Photos EL - ${audit.project_name}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css">
      <style>
        .drop-zone { border: 2px dashed #cbd5e0; transition: all 0.3s; }
        .drop-zone.dragover { border-color: #805ad5; background-color: #faf5ff; }
        .preview-image { max-height: 200px; object-fit: cover; }
        .upload-item { border-left: 4px solid #805ad5; }
      </style>
    </head>
    <body class="bg-gray-100">
      <div class="container mx-auto px-4 py-8">
        <!-- Header -->
        <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 class="text-3xl font-bold text-gray-800">
            <i class="fas fa-upload text-purple-600 mr-2"></i>
            Upload Photos EL
          </h1>
          <p class="text-gray-600 mt-1">📍 ${audit.project_name} - ${audit.site_location}</p>
        </div>
        
        <!-- Single Photo Upload -->
        <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 class="text-xl font-bold text-gray-800 mb-4">
            <i class="fas fa-camera mr-2"></i>
            Upload Photo Unique
          </h2>
          
          <form id="singleUploadForm" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Module Selector -->
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                  <i class="fas fa-solar-panel text-blue-600 mr-1"></i>
                  Module *
                </label>
                <select id="single_module" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                  <option value="">-- Sélectionner module --</option>
                  ${modules?.map((m: any) => `
                    <option value="${m.module_identifier}">
                      ${m.module_identifier} (String ${m.string_number}, Pos ${m.position_in_string})
                    </option>
                  `).join('')}
                </select>
              </div>
              
              <!-- Photo Type -->
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                  <i class="fas fa-tag text-green-600 mr-1"></i>
                  Type Photo
                </label>
                <select id="single_photo_type" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                  <option value="defect">🔍 Défaut</option>
                  <option value="overview">🖼️ Vue d'ensemble</option>
                  <option value="detail">🔬 Détail</option>
                  <option value="comparison">📊 Comparaison</option>
                </select>
              </div>
              
              <!-- Defect Category -->
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                  <i class="fas fa-exclamation-triangle text-yellow-600 mr-1"></i>
                  Catégorie Défaut
                </label>
                <select id="single_defect_category" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                  <option value="">-- Aucun défaut --</option>
                  <option value="microcracks">🔬 Microfissures</option>
                  <option value="hotspot">🔥 Point chaud</option>
                  <option value="pid">⚡ PID</option>
                  <option value="bypass_diode">🔌 Diode bypass</option>
                  <option value="snail_trail">🐌 Snail trail</option>
                  <option value="delamination">🔨 Délamination</option>
                </select>
              </div>
              
              <!-- Severity Level -->
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                  <i class="fas fa-exclamation-circle text-red-600 mr-1"></i>
                  Niveau Sévérité
                </label>
                <select id="single_severity" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                  <option value="0">0 - Aucun</option>
                  <option value="1">1 - Mineur</option>
                  <option value="2">2 - Modéré</option>
                  <option value="3">3 - Sévère</option>
                  <option value="4">4 - Critique</option>
                </select>
              </div>
            </div>
            
            <!-- Description -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                <i class="fas fa-comment text-gray-600 mr-1"></i>
                Description
              </label>
              <textarea id="single_description" rows="2" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="Description du défaut ou contexte..."></textarea>
            </div>
            
            <!-- File Input -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                <i class="fas fa-file-image text-purple-600 mr-1"></i>
                Photo *
              </label>
              <input type="file" id="single_photo" accept="image/*" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
            </div>
            
            <!-- Preview -->
            <div id="single_preview" class="hidden">
              <img id="single_preview_img" class="preview-image rounded-lg shadow">
            </div>
            
            <!-- Submit -->
            <button type="submit" class="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition">
              <i class="fas fa-upload mr-2"></i>
              Upload Photo
            </button>
          </form>
          
          <div id="single_result" class="mt-4 hidden"></div>
        </div>
        
        <!-- Batch Upload -->
        <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 class="text-xl font-bold text-gray-800 mb-4">
            <i class="fas fa-images mr-2"></i>
            Upload Multiple Photos
          </h2>
          
          <div class="drop-zone rounded-lg p-8 text-center cursor-pointer" id="dropZone">
            <i class="fas fa-cloud-upload-alt text-6xl text-gray-300 mb-4"></i>
            <p class="text-lg text-gray-600 mb-2">Glissez-déposez des photos ici</p>
            <p class="text-sm text-gray-500 mb-4">ou</p>
            <label class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg cursor-pointer inline-block">
              <i class="fas fa-folder-open mr-2"></i>
              Sélectionner Fichiers
              <input type="file" id="batch_photos" accept="image/*" multiple class="hidden">
            </label>
          </div>
          
          <div id="batch_files_list" class="mt-4 space-y-2"></div>
          
          <button id="batch_upload_btn" class="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition mt-4 hidden">
            <i class="fas fa-upload mr-2"></i>
            Upload <span id="batch_count">0</span> Photo(s)
          </button>
          
          <div id="batch_result" class="mt-4 hidden"></div>
        </div>
        
        <!-- Navigation -->
        <div class="bg-white rounded-lg shadow-lg p-6">
          <div class="flex gap-3">
            <a href="/audit/${token}/el/photos" class="text-blue-600 hover:text-blue-800 font-semibold">
              <i class="fas fa-images mr-2"></i>
              Voir Galerie
            </a>
            <a href="/audit/${token}" class="text-gray-600 hover:text-gray-800 font-semibold">
              <i class="fas fa-arrow-left mr-2"></i>
              Retour audit EL
            </a>
          </div>
        </div>
      </div>
      
      <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
      <script>
        const auditToken = '${token}'
        
        // ========== SINGLE UPLOAD ==========
        const singlePhotoInput = document.getElementById('single_photo')
        const singlePreview = document.getElementById('single_preview')
        const singlePreviewImg = document.getElementById('single_preview_img')
        
        singlePhotoInput.addEventListener('change', (e) => {
          const file = e.target.files[0]
          if (file) {
            const reader = new FileReader()
            reader.onload = (e) => {
              singlePreviewImg.src = e.target.result
              singlePreview.classList.remove('hidden')
            }
            reader.readAsDataURL(file)
          }
        })
        
        document.getElementById('singleUploadForm').addEventListener('submit', async (e) => {
          e.preventDefault()
          
          const formData = new FormData()
          formData.append('audit_token', auditToken)
          formData.append('photo', singlePhotoInput.files[0])
          formData.append('module_identifier', document.getElementById('single_module').value)
          formData.append('photo_type', document.getElementById('single_photo_type').value)
          formData.append('defect_category', document.getElementById('single_defect_category').value)
          formData.append('severity_level', document.getElementById('single_severity').value)
          formData.append('description', document.getElementById('single_description').value)
          
          const resultDiv = document.getElementById('single_result')
          resultDiv.innerHTML = '<div class="bg-blue-100 text-blue-800 p-4 rounded-lg"><i class="fas fa-spinner fa-spin mr-2"></i>Upload en cours...</div>'
          resultDiv.classList.remove('hidden')
          
          try {
            const response = await axios.post('/api/el/photos/upload', formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            })
            
            resultDiv.innerHTML = '<div class="bg-green-100 text-green-800 p-4 rounded-lg"><i class="fas fa-check-circle mr-2"></i>Photo uploadée avec succès !</div>'
            
            setTimeout(() => {
              window.location.href = '/audit/' + auditToken + '/el/photos'
            }, 1500)
            
          } catch (error) {
            console.error('Upload error:', error)
            resultDiv.innerHTML = '<div class="bg-red-100 text-red-800 p-4 rounded-lg"><i class="fas fa-times-circle mr-2"></i>Erreur upload: ' + (error.response?.data?.error || error.message) + '</div>'
          }
        })
        
        // ========== BATCH UPLOAD ==========
        const dropZone = document.getElementById('dropZone')
        const batchInput = document.getElementById('batch_photos')
        const filesList = document.getElementById('batch_files_list')
        const batchUploadBtn = document.getElementById('batch_upload_btn')
        const batchCount = document.getElementById('batch_count')
        
        let selectedFiles = []
        
        dropZone.addEventListener('dragover', (e) => {
          e.preventDefault()
          dropZone.classList.add('dragover')
        })
        
        dropZone.addEventListener('dragleave', () => {
          dropZone.classList.remove('dragover')
        })
        
        dropZone.addEventListener('drop', (e) => {
          e.preventDefault()
          dropZone.classList.remove('dragover')
          handleFiles(e.dataTransfer.files)
        })
        
        batchInput.addEventListener('change', (e) => {
          handleFiles(e.target.files)
        })
        
        function handleFiles(files) {
          selectedFiles = Array.from(files)
          displayFilesList()
        }
        
        function displayFilesList() {
          if (selectedFiles.length === 0) {
            filesList.innerHTML = ''
            batchUploadBtn.classList.add('hidden')
            return
          }
          
          filesList.innerHTML = selectedFiles.map((file, index) => \`
            <div class="upload-item bg-gray-50 rounded-lg p-4 flex items-center justify-between">
              <div class="flex items-center gap-4">
                <i class="fas fa-image text-purple-600 text-2xl"></i>
                <div>
                  <div class="font-semibold text-gray-800">\${file.name}</div>
                  <div class="text-sm text-gray-500">\${(file.size / 1024).toFixed(1)} KB</div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <select id="batch_module_\${index}" class="px-3 py-1 border border-gray-300 rounded text-sm">
                  <option value="">Module...</option>
                  ${modules?.map((m: any) => `<option value="${m.module_identifier}">${m.module_identifier}</option>`).join('')}
                </select>
                <button onclick="removeFile(\${index})" class="text-red-600 hover:text-red-800">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
          \`).join('')
          
          batchCount.textContent = selectedFiles.length
          batchUploadBtn.classList.remove('hidden')
        }
        
        window.removeFile = (index) => {
          selectedFiles.splice(index, 1)
          displayFilesList()
        }
        
        batchUploadBtn.addEventListener('click', async () => {
          const formData = new FormData()
          formData.append('audit_token', auditToken)
          
          selectedFiles.forEach((file, index) => {
            formData.append(\`photo_\${index}\`, file)
            const moduleId = document.getElementById(\`batch_module_\${index}\`).value
            if (moduleId) {
              formData.append(\`module_identifier_\${index}\`, moduleId)
            }
            formData.append(\`photo_type_\${index}\`, 'defect')
            formData.append(\`severity_level_\${index}\`, '1')
          })
          
          const resultDiv = document.getElementById('batch_result')
          resultDiv.innerHTML = '<div class="bg-blue-100 text-blue-800 p-4 rounded-lg"><i class="fas fa-spinner fa-spin mr-2"></i>Upload de ' + selectedFiles.length + ' photo(s) en cours...</div>'
          resultDiv.classList.remove('hidden')
          
          try {
            const response = await axios.post('/api/el/photos/batch-upload', formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            })
            
            const data = response.data
            resultDiv.innerHTML = \`
              <div class="bg-green-100 text-green-800 p-4 rounded-lg">
                <i class="fas fa-check-circle mr-2"></i>
                <strong>\${data.uploaded}</strong> photo(s) uploadée(s) avec succès !
                \${data.failed > 0 ? '<br><span class="text-red-600">⚠️ ' + data.failed + ' échec(s)</span>' : ''}
              </div>
            \`
            
            setTimeout(() => {
              window.location.href = '/audit/' + auditToken + '/el/photos'
            }, 2000)
            
          } catch (error) {
            console.error('Batch upload error:', error)
            resultDiv.innerHTML = '<div class="bg-red-100 text-red-800 p-4 rounded-lg"><i class="fas fa-times-circle mr-2"></i>Erreur upload batch: ' + (error.response?.data?.error || error.message) + '</div>'
          }
        })
      </script>
    </body>
    </html>
  `)
})

export default elPhotosUploadRoutes
