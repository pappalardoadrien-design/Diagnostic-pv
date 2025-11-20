/**
 * PAGE: Import CSV Mesures I-V
 * URL: /audit/:token/iv/import
 * 
 * Permet d'uploader un fichier CSV contenant les mesures I-V
 * Valide et importe les données dans la base
 */

import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
}

const ivImportRoutes = new Hono<{ Bindings: Bindings }>()

ivImportRoutes.get('/audit/:token/iv/import', async (c) => {
  const token = c.req.param('token')

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Import CSV Mesures I-V</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-gray-50">
  <div class="max-w-4xl mx-auto p-8">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-800">📤 Import CSV Mesures I-V</h1>
      <p class="text-gray-600 mt-1">Token: ${token}</p>
    </div>

    <!-- Instructions -->
    <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
      <p class="font-semibold text-blue-800 mb-2">📋 Format CSV attendu:</p>
      <ul class="list-disc list-inside text-blue-700 space-y-1 text-sm">
        <li><strong>Mesures Référence</strong>: module_identifier,measurement_type,isc,voc,pmax,impp,vmpp,fill_factor,rs,rsh</li>
        <li><strong>Mesures Sombre</strong>: module_identifier,measurement_type,rs,rsh</li>
        <li>measurement_type = "reference" ou "dark"</li>
        <li>module_identifier format: "S1-15" (String-Position)</li>
      </ul>
    </div>

    <!-- CSV Template Download -->
    <div class="mb-6 flex gap-3">
      <button onclick="downloadTemplate('reference')" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
        <i class="fas fa-download mr-2"></i>Template Référence
      </button>
      <button onclick="downloadTemplate('dark')" class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition">
        <i class="fas fa-download mr-2"></i>Template Sombre
      </button>
    </div>

    <!-- Upload Form -->
    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <h2 class="text-xl font-bold mb-4">📁 Sélectionner Fichier CSV</h2>
      
      <div class="mb-4">
        <label class="block text-sm font-semibold text-gray-700 mb-2">Type de mesures</label>
        <select id="measurementType" class="w-full border rounded-lg p-2">
          <option value="reference">Mesures Référence (lumière)</option>
          <option value="dark">Mesures Sombre (dark)</option>
        </select>
      </div>

      <div class="mb-4">
        <label class="block text-sm font-semibold text-gray-700 mb-2">Fichier CSV</label>
        <input type="file" id="csvFile" accept=".csv" class="w-full border rounded-lg p-2">
      </div>

      <button onclick="uploadCSV()" class="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold">
        <i class="fas fa-upload mr-2"></i>Importer Mesures
      </button>
    </div>

    <!-- Results -->
    <div id="results" class="hidden bg-white rounded-lg shadow p-6">
      <h3 class="text-lg font-bold mb-3">📊 Résultats Import</h3>
      <div id="resultsContent"></div>
    </div>

    <!-- Back Button -->
    <div class="mt-6">
      <a href="/audit/${token}/iv/measurements" class="text-blue-600 hover:text-blue-800">
        <i class="fas fa-arrow-left mr-2"></i>Retour à la liste
      </a>
    </div>
  </div>

  <script>
    function downloadTemplate(type) {
      let csv = ''
      if (type === 'reference') {
        csv = 'module_identifier,measurement_type,isc,voc,pmax,impp,vmpp,fill_factor,rs,rsh\\n'
        csv += 'S1-1,reference,9.45,45.2,325.8,8.92,36.5,0.78,0.42,1200\\n'
        csv += 'S1-2,reference,9.50,45.0,328.0,8.95,36.6,0.78,0.40,1250\\n'
        csv += 'S1-3,reference,9.42,44.8,322.5,8.88,36.3,0.77,0.45,1150'
      } else {
        csv = 'module_identifier,measurement_type,rs,rsh\\n'
        csv += 'S1-1,dark,0.42,1200\\n'
        csv += 'S1-2,dark,0.40,1250\\n'
        csv += 'S1-3,dark,0.45,1150'
      }
      
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = \`template_iv_\${type}.csv\`
      a.click()
      URL.revokeObjectURL(url)
    }

    async function uploadCSV() {
      const fileInput = document.getElementById('csvFile')
      const measurementType = document.getElementById('measurementType').value
      const file = fileInput.files[0]
      
      if (!file) {
        alert('Veuillez sélectionner un fichier CSV')
        return
      }

      const reader = new FileReader()
      reader.onload = async (e) => {
        const csvText = e.target.result
        
        try {
          const response = await fetch('/api/iv/measurements/${token}', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              csv_data: csvText,
              measurement_type: measurementType
            })
          })

          const result = await response.json()
          
          document.getElementById('results').classList.remove('hidden')
          const resultsDiv = document.getElementById('resultsContent')
          
          if (result.success) {
            resultsDiv.innerHTML = \`
              <div class="space-y-3">
                <div class="flex items-center text-green-600">
                  <i class="fas fa-check-circle text-2xl mr-3"></i>
                  <span class="font-semibold">Import réussi !</span>
                </div>
                <div class="bg-gray-50 rounded p-3 text-sm">
                  <p><strong>Total lignes:</strong> \${result.summary?.total || 0}</p>
                  <p><strong>Importées:</strong> \${result.summary?.inserted || 0}</p>
                  <p><strong>Erreurs:</strong> \${result.summary?.errors || 0}</p>
                  <p><strong>Liées aux modules EL:</strong> \${result.summary?.linked_to_el_modules || 0}</p>
                </div>
                <a href="/audit/${token}/iv/measurements" class="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                  <i class="fas fa-list mr-2"></i>Voir les mesures
                </a>
              </div>
            \`
          } else {
            resultsDiv.innerHTML = \`
              <div class="text-red-600">
                <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                <p class="font-semibold">Erreur lors de l'import</p>
                <p class="text-sm mt-2">\${result.error || 'Erreur inconnue'}</p>
              </div>
            \`
          }
        } catch (error) {
          console.error('Error:', error)
          alert('Erreur lors de l\\'import: ' + error.message)
        }
      }
      
      reader.readAsText(file)
    }
  </script>
</body>
</html>`

  return c.html(html)
})

export default ivImportRoutes
