/**
 * PAGE: Détail Module I-V avec Graphiques
 * URL: /audit/:token/iv/module/:identifier
 * 
 * Affiche les mesures référence + sombre d'un module
 * Graphiques courbes I-V avec Chart.js
 */

import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
}

const ivModuleDetailRoutes = new Hono<{ Bindings: Bindings }>()

ivModuleDetailRoutes.get('/audit/:token/iv/module/:identifier', async (c) => {
  const { DB } = c.env
  const token = c.req.param('token')
  const identifier = c.req.param('identifier')

  try {
    // Get audit info
    const audit = await DB.prepare(`
      SELECT * FROM audits WHERE audit_token = ?
    `).bind(token).first()

    if (!audit) {
      return c.html('<h1>Audit non trouvé</h1>', 404)
    }

    // Get module measurements
    const { results: measurements } = await DB.prepare(`
      SELECT *
      FROM iv_measurements
      WHERE audit_token = ? AND module_identifier = ?
      ORDER BY measurement_type ASC
    `).bind(token, identifier).all()

    if (!measurements || measurements.length === 0) {
      return c.html(`<h1>Module non trouvé</h1><p>Aucune mesure pour ${identifier}</p>`, 404)
    }

    const refMeasurement = measurements.find((m: any) => m.measurement_type === 'reference')
    const darkMeasurement = measurements.find((m: any) => m.measurement_type === 'dark')

    // Parse IV curve data
    let refCurve = []
    let darkCurve = []
    
    try {
      if (refMeasurement?.iv_curve_data) {
        refCurve = JSON.parse(refMeasurement.iv_curve_data)
      }
    } catch (e) {}
    
    try {
      if (darkMeasurement?.iv_curve_data) {
        darkCurve = JSON.parse(darkMeasurement.iv_curve_data)
      }
    } catch (e) {}

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Module ${identifier} - Courbes I-V</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-gray-50">
  <div class="max-w-7xl mx-auto p-8">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-800">📊 Module ${identifier}</h1>
      <p class="text-gray-600 mt-1">${audit.project_name || 'Projet'} - ${audit.location || ''}</p>
      <p class="text-sm text-gray-500">Audit: ${token}</p>
    </div>

    <!-- Back Button -->
    <div class="mb-6">
      <a href="/audit/${token}/iv/measurements" class="text-blue-600 hover:text-blue-800">
        <i class="fas fa-arrow-left mr-2"></i>Retour à la liste
      </a>
    </div>

    <!-- Measurements Grid -->
    <div class="grid grid-cols-2 gap-6 mb-6">
      <!-- Reference Measurement -->
      ${refMeasurement ? `
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-bold mb-4 flex items-center">
          <i class="fas fa-sun text-yellow-500 mr-2"></i>
          <span>Mesure Référence (Lumière)</span>
        </h2>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div class="p-3 bg-blue-50 rounded">
            <div class="text-gray-600 mb-1">Isc</div>
            <div class="text-2xl font-bold text-blue-600">${refMeasurement.isc?.toFixed(2) || '-'} A</div>
          </div>
          <div class="p-3 bg-blue-50 rounded">
            <div class="text-gray-600 mb-1">Voc</div>
            <div class="text-2xl font-bold text-blue-600">${refMeasurement.voc?.toFixed(2) || '-'} V</div>
          </div>
          <div class="p-3 bg-green-50 rounded">
            <div class="text-gray-600 mb-1">Pmax</div>
            <div class="text-2xl font-bold text-green-600">${refMeasurement.pmax?.toFixed(1) || '-'} W</div>
          </div>
          <div class="p-3 bg-purple-50 rounded">
            <div class="text-gray-600 mb-1">Fill Factor</div>
            <div class="text-2xl font-bold text-purple-600">${refMeasurement.fill_factor ? (refMeasurement.fill_factor * 100).toFixed(1) + '%' : '-'}</div>
          </div>
          <div class="p-3 bg-gray-50 rounded">
            <div class="text-gray-600 mb-1">Rs (série)</div>
            <div class="text-xl font-bold text-gray-800">${refMeasurement.rs?.toFixed(2) || '-'} Ω</div>
          </div>
          <div class="p-3 bg-gray-50 rounded">
            <div class="text-gray-600 mb-1">Rsh (shunt)</div>
            <div class="text-xl font-bold text-gray-800">${refMeasurement.rsh?.toFixed(0) || '-'} Ω</div>
          </div>
        </div>
      </div>
      ` : `
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-bold mb-4 text-gray-400">
          <i class="fas fa-sun mr-2"></i>Mesure Référence
        </h2>
        <p class="text-gray-500">Aucune mesure de référence disponible</p>
      </div>
      `}

      <!-- Dark Measurement -->
      ${darkMeasurement ? `
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-bold mb-4 flex items-center">
          <i class="fas fa-moon text-indigo-500 mr-2"></i>
          <span>Mesure Sombre (Dark)</span>
        </h2>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div class="p-3 bg-gray-50 rounded">
            <div class="text-gray-600 mb-1">Rs (série)</div>
            <div class="text-2xl font-bold text-gray-800">${darkMeasurement.rs?.toFixed(2) || '-'} Ω</div>
          </div>
          <div class="p-3 bg-gray-50 rounded">
            <div class="text-gray-600 mb-1">Rsh (shunt)</div>
            <div class="text-2xl font-bold text-gray-800">${darkMeasurement.rsh?.toFixed(0) || '-'} Ω</div>
          </div>
        </div>
        <div class="mt-4 p-3 bg-purple-50 rounded text-sm">
          <p class="text-purple-800">
            <i class="fas fa-info-circle mr-2"></i>
            <strong>Rs faible</strong> = Bonne conductivité série<br>
            <strong>Rsh élevé</strong> = Peu de fuites (bon isolement)
          </p>
        </div>
      </div>
      ` : `
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-bold mb-4 text-gray-400">
          <i class="fas fa-moon mr-2"></i>Mesure Sombre
        </h2>
        <p class="text-gray-500">Aucune mesure sombre disponible</p>
      </div>
      `}
    </div>

    <!-- IV Curves Chart -->
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-xl font-bold mb-4">📈 Courbes I-V</h2>
      <div class="h-96">
        <canvas id="ivChart"></canvas>
      </div>
      ${refCurve.length === 0 && darkCurve.length === 0 ? `
      <div class="text-center text-gray-500 mt-4">
        <i class="fas fa-chart-line text-4xl text-gray-300 mb-2"></i>
        <p>Aucune courbe I-V disponible</p>
        <p class="text-sm mt-2">Les données de courbes ne sont pas encore chargées pour ce module</p>
      </div>
      ` : ''}
    </div>

    <!-- Footer -->
    <div class="mt-8 text-center text-sm text-gray-500">
      <p><strong>DiagPV - Diagnostic Photovoltaïque</strong></p>
      <p>3 rue d'Apollo, 31240 L'Union | 05.81.10.16.59 | contact@diagpv.fr</p>
    </div>
  </div>

  <script>
    // Prepare chart data
    const refCurveData = ${JSON.stringify(refCurve)};
    const darkCurveData = ${JSON.stringify(darkCurve)};

    // Generate sample curves if no data (for demo)
    function generateSampleCurve(type) {
      const points = [];
      if (type === 'reference') {
        const isc = ${refMeasurement?.isc || 9.5};
        const voc = ${refMeasurement?.voc || 45};
        for (let i = 0; i <= 20; i++) {
          const v = (i / 20) * voc;
          const current = isc * (1 - Math.pow(v / voc, 2.5));
          points.push({ v: v.toFixed(2), i: current.toFixed(3) });
        }
      } else {
        // Dark curve (exponential)
        for (let i = 0; i <= 20; i++) {
          const v = (i / 20) * 1.5;
          const current = 0.001 * (Math.exp(v / 0.5) - 1);
          points.push({ v: v.toFixed(2), i: current.toFixed(6) });
        }
      }
      return points;
    }

    const refData = refCurveData.length > 0 ? refCurveData : (${!!refMeasurement} ? generateSampleCurve('reference') : []);
    const darkData = darkCurveData.length > 0 ? darkCurveData : (${!!darkMeasurement} ? generateSampleCurve('dark') : []);

    // Create Chart
    if (refData.length > 0 || darkData.length > 0) {
      const ctx = document.getElementById('ivChart');
      new Chart(ctx, {
        type: 'line',
        data: {
          datasets: [
            {
              label: 'Courbe Référence (Lumière)',
              data: refData.map(p => ({ x: parseFloat(p.v), y: parseFloat(p.i) })),
              borderColor: 'rgb(59, 130, 246)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              borderWidth: 3,
              tension: 0.3,
              hidden: refData.length === 0
            },
            {
              label: 'Courbe Sombre (Dark)',
              data: darkData.map(p => ({ x: parseFloat(p.v), y: parseFloat(p.i) })),
              borderColor: 'rgb(139, 92, 246)',
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
              borderWidth: 3,
              tension: 0.3,
              hidden: darkData.length === 0
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'top'
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return context.dataset.label + ': V=' + context.parsed.x.toFixed(2) + 'V, I=' + context.parsed.y.toFixed(3) + 'A';
                }
              }
            }
          },
          scales: {
            x: {
              type: 'linear',
              title: {
                display: true,
                text: 'Tension (V)'
              }
            },
            y: {
              type: 'linear',
              title: {
                display: true,
                text: 'Courant (A)'
              }
            }
          }
        }
      });
    }
  </script>
</body>
</html>`

    return c.html(html)
  } catch (error) {
    console.error('Error loading module detail:', error)
    return c.html(`<h1>Erreur</h1><p>${error}</p>`, 500)
  }
})

export default ivModuleDetailRoutes
