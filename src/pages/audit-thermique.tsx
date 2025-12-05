/**
 * PAGE AUDIT THERMOGRAPHIE
 * 
 * Analyse thermique infrarouge - Détection défauts thermiques
 * Conforme DIN EN 62446-3
 */

export function getAuditThermiquePage() {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Audit Thermographie - DiagPV Hub</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
</head>
<body class="bg-gradient-to-br from-red-900 via-black to-orange-900 text-white min-h-screen">
  <div class="container mx-auto p-6">
    
    <!-- En-tête -->
    <header class="mb-8">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <i class="fas fa-fire text-6xl text-red-400 mr-4"></i>
          <div>
            <h1 class="text-5xl font-black bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              THERMOGRAPHIE IR
            </h1>
            <p class="text-xl text-gray-300 mt-2">
              Audit <span id="audit-token" class="text-red-400 font-mono">Chargement...</span>
            </p>
          </div>
        </div>
        
        <!-- Actions -->
        <div class="flex gap-3">
          <a href="/crm/dashboard" 
             class="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition">
            <i class="fas fa-arrow-left mr-2"></i>
            Retour
          </a>
          <button onclick="refreshData()" 
                  class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition">
            <i class="fas fa-sync mr-2"></i>
            Rafraîchir
          </button>
          <a id="btn-rapport-pdf" href="#" target="_blank"
             class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition">
            <i class="fas fa-file-pdf mr-2"></i>
            Rapport PDF
          </a>
        </div>
      </div>
    </header>

    <!-- Chargement -->
    <div id="loading" class="text-center py-20">
      <i class="fas fa-spinner fa-spin text-6xl text-red-400 mb-4"></i>
      <p class="text-xl text-gray-300">Chargement données thermiques...</p>
    </div>

    <!-- Contenu principal -->
    <div id="content" class="hidden">
      
      <!-- Statistiques KPI -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <!-- Total mesures -->
        <div class="bg-gradient-to-br from-blue-900 to-blue-700 rounded-xl p-6 border-2 border-blue-400 shadow-xl">
          <div class="flex items-center justify-between mb-3">
            <i class="fas fa-thermometer-three-quarters text-3xl text-blue-200"></i>
            <span class="text-xs bg-blue-600 px-3 py-1 rounded-full font-bold">MESURES</span>
          </div>
          <div class="text-4xl font-black mb-1" id="stat-total">-</div>
          <div class="text-blue-200 text-sm">Mesures thermiques</div>
        </div>

        <!-- Hotspots critiques -->
        <div class="bg-gradient-to-br from-red-900 to-red-700 rounded-xl p-6 border-2 border-red-400 shadow-xl">
          <div class="flex items-center justify-between mb-3">
            <i class="fas fa-fire text-3xl text-red-200"></i>
            <span class="text-xs bg-red-600 px-3 py-1 rounded-full font-bold">HOTSPOTS</span>
          </div>
          <div class="text-4xl font-black mb-1" id="stat-hotspots">-</div>
          <div class="text-red-200 text-sm">Défauts critiques</div>
        </div>

        <!-- Température max -->
        <div class="bg-gradient-to-br from-orange-900 to-orange-700 rounded-xl p-6 border-2 border-orange-400 shadow-xl">
          <div class="flex items-center justify-between mb-3">
            <i class="fas fa-temperature-high text-3xl text-orange-200"></i>
            <span class="text-xs bg-orange-600 px-3 py-1 rounded-full font-bold">TEMP MAX</span>
          </div>
          <div class="text-4xl font-black mb-1" id="stat-temp-max">-</div>
          <div class="text-orange-200 text-sm">Température maximum (°C)</div>
        </div>

        <!-- Delta T max -->
        <div class="bg-gradient-to-br from-yellow-900 to-yellow-700 rounded-xl p-6 border-2 border-yellow-400 shadow-xl">
          <div class="flex items-center justify-between mb-3">
            <i class="fas fa-chart-line text-3xl text-yellow-200"></i>
            <span class="text-xs bg-yellow-600 px-3 py-1 rounded-full font-bold">ΔT MAX</span>
          </div>
          <div class="text-4xl font-black mb-1" id="stat-delta-t">-</div>
          <div class="text-yellow-200 text-sm">Écart maximum (°C)</div>
        </div>
      </div>

      <!-- Graphiques -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <!-- Répartition défauts -->
        <div class="bg-gray-800 rounded-xl p-6 border-2 border-gray-700">
          <h3 class="text-xl font-bold mb-4 flex items-center">
            <i class="fas fa-chart-pie text-red-400 mr-2"></i>
            Répartition Défauts Thermiques
          </h3>
          <canvas id="chart-defects"></canvas>
        </div>

        <!-- Distribution sévérité -->
        <div class="bg-gray-800 rounded-xl p-6 border-2 border-gray-700">
          <h3 class="text-xl font-bold mb-4 flex items-center">
            <i class="fas fa-exclamation-triangle text-orange-400 mr-2"></i>
            Distribution Sévérité
          </h3>
          <canvas id="chart-severity"></canvas>
        </div>
      </div>

      <!-- Tableau mesures thermiques -->
      <div class="bg-gray-800 rounded-xl p-6 border-2 border-gray-700 mb-8">
        <h2 class="text-2xl font-black mb-6 flex items-center">
          <i class="fas fa-table text-red-400 mr-3"></i>
          MESURES THERMIQUES DÉTAILLÉES
        </h2>

        <!-- Filtres -->
        <div class="flex gap-4 mb-6">
          <select id="filter-defect" 
                  onchange="filterMeasurements()" 
                  class="bg-gray-700 text-white px-4 py-2 rounded-lg">
            <option value="all">Tous les défauts</option>
            <option value="hotspot">Hotspot uniquement</option>
            <option value="bypass_diode">Diode bypass</option>
            <option value="shading">Ombrage</option>
            <option value="disconnection">Déconnexion</option>
            <option value="ok">Sans défaut</option>
          </select>

          <select id="filter-severity" 
                  onchange="filterMeasurements()" 
                  class="bg-gray-700 text-white px-4 py-2 rounded-lg">
            <option value="all">Toutes sévérités</option>
            <option value="5">Critique (5)</option>
            <option value="4">Sévère (4)</option>
            <option value="3">Modéré (3)</option>
            <option value="2">Mineur (2)</option>
            <option value="1">Info (1)</option>
          </select>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="bg-gray-700">
                <th class="px-4 py-3 text-left">String</th>
                <th class="px-4 py-3 text-left">Module</th>
                <th class="px-4 py-3 text-left">T° Max (°C)</th>
                <th class="px-4 py-3 text-left">ΔT (°C)</th>
                <th class="px-4 py-3 text-left">Type Défaut</th>
                <th class="px-4 py-3 text-left">Sévérité</th>
                <th class="px-4 py-3 text-left">Remarques</th>
              </tr>
            </thead>
            <tbody id="measurements-table">
              <tr>
                <td colspan="7" class="px-4 py-8 text-center text-gray-400">
                  Aucune mesure thermique disponible
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Info normative -->
      <div class="bg-blue-900 border-2 border-blue-500 rounded-xl p-4">
        <div class="flex items-start gap-3">
          <i class="fas fa-info-circle text-2xl text-blue-300 mt-1"></i>
          <div class="text-sm text-blue-100">
            <strong class="block mb-1">Conformité DIN EN 62446-3 :</strong>
            Les mesures thermographiques suivent la norme européenne pour l'inspection par thermographie IR des installations photovoltaïques. 
            ΔT >10°C indique généralement un défaut nécessitant investigation.
          </div>
        </div>
      </div>
    </div>

  </div>

  <script>
    let auditToken = '';
    let allMeasurements = [];
    let charts = { defects: null, severity: null };

    // Récupérer audit_token depuis URL
    const pathParts = window.location.pathname.split('/');
    auditToken = pathParts[pathParts.length - 1];
    document.getElementById('audit-token').textContent = auditToken;
    document.getElementById('btn-rapport-pdf').href = \`/rapport/print/\${auditToken}\`;

    // ================================================================
    // INITIALISATION
    // ================================================================
    async function init() {
      await loadThermalData();
      document.getElementById('loading').classList.add('hidden');
      document.getElementById('content').classList.remove('hidden');
    }

    // ================================================================
    // CHARGEMENT DONNÉES
    // ================================================================
    async function loadThermalData() {
      try {
        // Charger mesures
        const response = await axios.get(\`/api/thermique/measurements/\${auditToken}\`);
        allMeasurements = response.data.measurements || [];
        
        // Charger stats
        const statsResponse = await axios.get(\`/api/thermique/stats/\${auditToken}\`);
        const stats = statsResponse.data.stats || {};
        
        updateStatistics(stats);
        renderCharts(stats);
        renderMeasurementsTable(allMeasurements);
        
      } catch (error) {
        console.error('Erreur chargement données thermiques:', error);
        alert('Erreur lors du chargement des données thermiques');
      }
    }

    // ================================================================
    // MISE À JOUR STATISTIQUES
    // ================================================================
    function updateStatistics(stats) {
      document.getElementById('stat-total').textContent = stats.total_measurements || 0;
      document.getElementById('stat-hotspots').textContent = stats.critical_defects || 0;
      document.getElementById('stat-temp-max').textContent = 
        stats.max_temp_max ? stats.max_temp_max.toFixed(1) : '0';
      document.getElementById('stat-delta-t').textContent = 
        stats.max_delta_t ? stats.max_delta_t.toFixed(1) : '0';
    }

    // ================================================================
    // GRAPHIQUES
    // ================================================================
    function renderCharts(stats) {
      // Graphique défauts
      const ctxDefects = document.getElementById('chart-defects').getContext('2d');
      if (charts.defects) charts.defects.destroy();
      
      charts.defects = new Chart(ctxDefects, {
        type: 'doughnut',
        data: {
          labels: ['OK', 'Hotspot', 'Diode', 'Ombrage', 'Déconnexion'],
          datasets: [{
            data: [
              stats.ok_count || 0,
              stats.hotspots_count || 0,
              stats.diode_defects || 0,
              stats.shading_count || 0,
              stats.disconnection_count || 0
            ],
            backgroundColor: ['#10B981', '#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { labels: { color: '#FFF' } }
          }
        }
      });

      // Graphique sévérité
      const ctxSeverity = document.getElementById('chart-severity').getContext('2d');
      if (charts.severity) charts.severity.destroy();
      
      // Compter par sévérité
      const severityCounts = [0, 0, 0, 0, 0];
      allMeasurements.forEach(m => {
        const sev = m.severity_level || 1;
        severityCounts[sev - 1]++;
      });
      
      charts.severity = new Chart(ctxSeverity, {
        type: 'bar',
        data: {
          labels: ['1 (Info)', '2 (Mineur)', '3 (Modéré)', '4 (Sévère)', '5 (Critique)'],
          datasets: [{
            label: 'Nombre de mesures',
            data: severityCounts,
            backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#B91C1C']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: { 
              beginAtZero: true,
              ticks: { color: '#FFF' }
            },
            x: { ticks: { color: '#FFF' } }
          }
        }
      });
    }

    // ================================================================
    // TABLEAU MESURES
    // ================================================================
    function renderMeasurementsTable(measurements) {
      const tbody = document.getElementById('measurements-table');
      
      if (!measurements || measurements.length === 0) {
        tbody.innerHTML = \`
          <tr>
            <td colspan="7" class="px-4 py-8 text-center text-gray-400">
              Aucune mesure thermique disponible
            </td>
          </tr>
        \`;
        return;
      }
      
      tbody.innerHTML = measurements.map(m => \`
        <tr class="border-b border-gray-700 hover:bg-gray-700 transition">
          <td class="px-4 py-3">\${m.string_number || 'N/A'}</td>
          <td class="px-4 py-3">\${m.module_number || 'N/A'}</td>
          <td class="px-4 py-3 font-bold text-orange-400">\${m.temperature_max ? m.temperature_max.toFixed(1) : 'N/A'}</td>
          <td class="px-4 py-3 font-bold \${m.delta_t_max > 10 ? 'text-red-400' : 'text-green-400'}">
            \${m.delta_t_max ? m.delta_t_max.toFixed(1) : 'N/A'}
          </td>
          <td class="px-4 py-3">
            <span class="px-3 py-1 rounded-full text-xs font-bold \${getDefectBadgeClass(m.defect_type)}">
              \${getDefectLabel(m.defect_type)}
            </span>
          </td>
          <td class="px-4 py-3">
            <span class="px-3 py-1 rounded-full text-xs font-bold \${getSeverityBadgeClass(m.severity_level)}">
              \${m.severity_level || 1}
            </span>
          </td>
          <td class="px-4 py-3 text-sm text-gray-300">\${m.notes || '-'}</td>
        </tr>
      \`).join('');
    }

    function getDefectLabel(type) {
      const labels = {
        'ok': 'OK',
        'hotspot': 'Hotspot',
        'bypass_diode': 'Diode bypass',
        'shading': 'Ombrage',
        'disconnection': 'Déconnexion'
      };
      return labels[type] || type || 'N/A';
    }

    function getDefectBadgeClass(type) {
      const classes = {
        'ok': 'bg-green-600',
        'hotspot': 'bg-red-600',
        'bypass_diode': 'bg-orange-600',
        'shading': 'bg-blue-600',
        'disconnection': 'bg-purple-600'
      };
      return classes[type] || 'bg-gray-600';
    }

    function getSeverityBadgeClass(level) {
      const classes = {
        1: 'bg-green-600',
        2: 'bg-blue-600',
        3: 'bg-yellow-600',
        4: 'bg-orange-600',
        5: 'bg-red-600'
      };
      return classes[level] || 'bg-gray-600';
    }

    // ================================================================
    // FILTRES
    // ================================================================
    function filterMeasurements() {
      const defectFilter = document.getElementById('filter-defect').value;
      const severityFilter = document.getElementById('filter-severity').value;
      
      let filtered = [...allMeasurements];
      
      if (defectFilter !== 'all') {
        filtered = filtered.filter(m => m.defect_type === defectFilter);
      }
      
      if (severityFilter !== 'all') {
        filtered = filtered.filter(m => m.severity_level === parseInt(severityFilter));
      }
      
      renderMeasurementsTable(filtered);
    }

    // ================================================================
    // ACTIONS
    // ================================================================
    function refreshData() {
      location.reload();
    }

    // ================================================================
    // INIT
    // ================================================================
    init();
  </script>
</body>
</html>
  `;
}
