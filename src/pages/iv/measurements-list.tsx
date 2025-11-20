/**
 * PAGE: Liste Mesures I-V par Audit
 * URL: /audit/:token/iv/measurements
 * 
 * Affiche toutes les mesures I-V (référence + sombre) pour un audit
 * Permet import CSV et navigation vers détails modules
 */

import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
}

const ivPagesRoutes = new Hono<{ Bindings: Bindings }>()

ivPagesRoutes.get('/audit/:token/iv/measurements', async (c) => {
  const { DB } = c.env
  const token = c.req.param('token')

  try {
    // Get audit info
    const audit = await DB.prepare(`
      SELECT * FROM audits WHERE audit_token = ?
    `).bind(token).first()

    if (!audit) {
      return c.html('<h1>Audit non trouvé</h1>', 404)
    }

    // Get I-V measurements
    const { results: measurements } = await DB.prepare(`
      SELECT 
        module_identifier,
        measurement_type,
        isc, voc, pmax, impp, vmpp, fill_factor,
        rs, rsh,
        created_at
      FROM iv_measurements
      WHERE audit_token = ?
      ORDER BY module_identifier ASC, measurement_type ASC
    `).bind(token).all()

    // Group by module
    const moduleData: Record<string, any> = {}
    measurements?.forEach((m: any) => {
      if (!moduleData[m.module_identifier]) {
        moduleData[m.module_identifier] = {
          identifier: m.module_identifier,
          reference: null,
          dark: null
        }
      }
      
      if (m.measurement_type === 'reference') {
        moduleData[m.module_identifier].reference = m
      } else if (m.measurement_type === 'dark') {
        moduleData[m.module_identifier].dark = m
      }
    })

    const modules = Object.values(moduleData)

    // Statistics
    const totalModules = modules.length
    const withReference = modules.filter(m => m.reference).length
    const withDark = modules.filter(m => m.dark).length
    const complete = modules.filter(m => m.reference && m.dark).length

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mesures I-V - ${audit.project_name || audit.audit_token}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-gray-50">
  <div class="max-w-7xl mx-auto p-8">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-800">📈 Mesures Courbes I-V</h1>
          <p class="text-gray-600 mt-1">${audit.project_name || 'Projet'} - ${audit.location || ''}</p>
          <p class="text-sm text-gray-500">Token: ${token}</p>
        </div>
        <div class="space-x-2">
          <a href="/audit/${token}/iv/import" class="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
            <i class="fas fa-upload mr-2"></i>Importer CSV
          </a>
          <a href="/api/iv/report/${token}" target="_blank" class="inline-block bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
            <i class="fas fa-file-pdf mr-2"></i>Rapport PDF
          </a>
        </div>
      </div>
    </div>

    <!-- Statistics -->
    <div class="grid grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-lg shadow p-4">
        <div class="text-sm text-gray-600 mb-1">Modules Total</div>
        <div class="text-2xl font-bold text-gray-800">${totalModules}</div>
      </div>
      <div class="bg-white rounded-lg shadow p-4">
        <div class="text-sm text-gray-600 mb-1">Mesures Référence</div>
        <div class="text-2xl font-bold text-blue-600">${withReference}</div>
      </div>
      <div class="bg-white rounded-lg shadow p-4">
        <div class="text-sm text-gray-600 mb-1">Mesures Sombre</div>
        <div class="text-2xl font-bold text-purple-600">${withDark}</div>
      </div>
      <div class="bg-white rounded-lg shadow p-4">
        <div class="text-sm text-gray-600 mb-1">Complets (Ref+Dark)</div>
        <div class="text-2xl font-bold text-green-600">${complete}</div>
      </div>
    </div>

    <!-- Measurements Table -->
    <div class="bg-white rounded-lg shadow">
      <div class="p-4 border-b">
        <h2 class="text-xl font-bold text-gray-800">Liste Modules (${totalModules})</h2>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-gray-100 border-b">
              <th class="p-3 text-left">Module</th>
              <th class="p-3 text-center">Type</th>
              <th class="p-3 text-center">Isc (A)</th>
              <th class="p-3 text-center">Voc (V)</th>
              <th class="p-3 text-center">Pmax (W)</th>
              <th class="p-3 text-center">FF (%)</th>
              <th class="p-3 text-center">Rs (Ω)</th>
              <th class="p-3 text-center">Rsh (Ω)</th>
              <th class="p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            ${modules.map((mod: any) => {
              const ref = mod.reference
              const dark = mod.dark
              
              return `
                ${ref ? `
                <tr class="border-b hover:bg-gray-50">
                  <td class="p-3 font-mono font-semibold" rowspan="${dark ? 2 : 1}">${mod.identifier}</td>
                  <td class="p-3 text-center">
                    <span class="px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                      <i class="fas fa-sun mr-1"></i>Référence
                    </span>
                  </td>
                  <td class="p-3 text-center">${ref.isc?.toFixed(2) || '-'}</td>
                  <td class="p-3 text-center">${ref.voc?.toFixed(2) || '-'}</td>
                  <td class="p-3 text-center font-semibold">${ref.pmax?.toFixed(1) || '-'}</td>
                  <td class="p-3 text-center">${ref.fill_factor ? (ref.fill_factor * 100).toFixed(1) : '-'}</td>
                  <td class="p-3 text-center">${ref.rs?.toFixed(2) || '-'}</td>
                  <td class="p-3 text-center">${ref.rsh?.toFixed(0) || '-'}</td>
                  <td class="p-3 text-center" rowspan="${dark ? 2 : 1}">
                    <a href="/audit/${token}/iv/module/${mod.identifier}" class="text-blue-600 hover:text-blue-800">
                      <i class="fas fa-chart-line mr-1"></i>Détails
                    </a>
                  </td>
                </tr>
                ` : ''}
                
                ${dark ? `
                <tr class="border-b hover:bg-gray-50">
                  ${!ref ? `<td class="p-3 font-mono font-semibold">${mod.identifier}</td>` : ''}
                  <td class="p-3 text-center">
                    <span class="px-2 py-1 rounded text-xs font-semibold bg-purple-100 text-purple-800">
                      <i class="fas fa-moon mr-1"></i>Sombre
                    </span>
                  </td>
                  <td class="p-3 text-center" colspan="4">-</td>
                  <td class="p-3 text-center">${dark.rs?.toFixed(2) || '-'}</td>
                  <td class="p-3 text-center">${dark.rsh?.toFixed(0) || '-'}</td>
                  ${!ref ? `<td class="p-3 text-center">
                    <a href="/audit/${token}/iv/module/${mod.identifier}" class="text-blue-600 hover:text-blue-800">
                      <i class="fas fa-chart-line mr-1"></i>Détails
                    </a>
                  </td>` : ''}
                </tr>
                ` : ''}
              `
            }).join('')}
            
            ${modules.length === 0 ? `
            <tr>
              <td colspan="9" class="p-8 text-center text-gray-500">
                <i class="fas fa-inbox text-4xl mb-3 text-gray-300"></i>
                <p>Aucune mesure I-V trouvée</p>
                <a href="/audit/${token}/iv/import" class="inline-block mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                  <i class="fas fa-upload mr-2"></i>Importer CSV
                </a>
              </td>
            </tr>
            ` : ''}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Footer -->
    <div class="mt-8 text-center text-sm text-gray-500">
      <p><strong>DiagPV - Diagnostic Photovoltaïque</strong></p>
      <p>3 rue d'Apollo, 31240 L'Union | 05.81.10.16.59 | contact@diagpv.fr</p>
    </div>
  </div>
</body>
</html>`

    return c.html(html)
  } catch (error) {
    console.error('Error loading I-V measurements:', error)
    return c.html(`<h1>Erreur</h1><p>${error}</p>`, 500)
  }
})

export default ivPagesRoutes
