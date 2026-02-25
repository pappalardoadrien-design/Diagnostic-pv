import { getLayout } from './layout.js';

export function getPvservDarkPage() {
  const content = `
    <!-- HEADER -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
            <h1 class="text-3xl font-black text-slate-900 tracking-tight flex items-center">
                <span class="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mr-3 text-xl">
                    <i class="fas fa-wave-square"></i>
                </span>
                Courbes Sombres PVServ
            </h1>
            <p class="text-slate-500 font-medium ml-14">Import fichier .txt carte SD - Strings + Diodes Bypass</p>
        </div>
        <div class="flex gap-3">
            <button onclick="openUploadModal()" class="px-6 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 shadow-lg shadow-purple-200 transition-all flex items-center">
                <i class="fas fa-file-import mr-2"></i>
                Importer fichier .txt
            </button>
        </div>
    </div>

    <!-- UPLOAD ZONE (initialement visible si pas de données) -->
    <div id="emptyState" class="mb-8">
        <div class="bg-white rounded-2xl shadow-sm border-2 border-dashed border-purple-300 p-12 text-center hover:border-purple-500 transition-colors cursor-pointer" onclick="openUploadModal()">
            <div class="w-20 h-20 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-6">
                <i class="fas fa-sd-card text-4xl text-purple-400"></i>
            </div>
            <h3 class="text-xl font-bold text-slate-700 mb-2">Importer un fichier PVServ (.txt)</h3>
            <p class="text-slate-500 mb-4 max-w-md mx-auto">
                Glissez votre fichier <code class="bg-purple-50 px-2 py-0.5 rounded text-purple-700 font-mono text-sm">pvserve.txt</code> 
                depuis la carte SD du PVServ. Les courbes strings et diodes seront automatiquement separees.
            </p>
            <div class="flex items-center justify-center gap-6 text-sm text-slate-400">
                <span><i class="fas fa-check-circle text-green-400 mr-1"></i> Courbes sombres</span>
                <span><i class="fas fa-check-circle text-green-400 mr-1"></i> Tests diodes</span>
                <span><i class="fas fa-check-circle text-green-400 mr-1"></i> Detection anomalies</span>
            </div>
        </div>
    </div>

    <!-- SESSIONS EXISTANTES -->
    <div id="sessionsContainer" class="hidden mb-8">
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div class="flex items-center justify-between mb-4">
                <h2 class="font-bold text-slate-800 flex items-center">
                    <i class="fas fa-history text-slate-400 mr-2"></i> Sessions d'import
                </h2>
                <button onclick="openUploadModal()" class="px-4 py-2 text-sm bg-purple-100 text-purple-700 rounded-lg font-semibold hover:bg-purple-200 transition-colors">
                    <i class="fas fa-plus mr-1"></i> Nouvel import
                </button>
            </div>
            <div id="sessionsList" class="space-y-2"></div>
        </div>
    </div>

    <!-- DASHBOARD STATS (visible apres import) -->
    <div id="statsContainer" class="hidden">
        <!-- Stats row -->
        <div class="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
            <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 text-center">
                <div class="text-xs font-bold text-slate-400 uppercase mb-1">Strings</div>
                <div class="text-2xl font-black text-blue-600" id="statStrings">-</div>
            </div>
            <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 text-center">
                <div class="text-xs font-bold text-slate-400 uppercase mb-1">Diodes</div>
                <div class="text-2xl font-black text-purple-600" id="statDiodes">-</div>
            </div>
            <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 text-center">
                <div class="text-xs font-bold text-slate-400 uppercase mb-1">FF Strings</div>
                <div class="text-2xl font-black text-green-600" id="statFFStr">-</div>
            </div>
            <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 text-center">
                <div class="text-xs font-bold text-slate-400 uppercase mb-1">FF Diodes</div>
                <div class="text-2xl font-black text-amber-600" id="statFFDio">-</div>
            </div>
            <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 text-center">
                <div class="text-xs font-bold text-slate-400 uppercase mb-1">Rds Strings</div>
                <div class="text-2xl font-black text-cyan-600" id="statRdsStr">-</div>
            </div>
            <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 text-center">
                <div class="text-xs font-bold text-slate-400 uppercase mb-1">Anomalies</div>
                <div class="text-2xl font-black text-red-500" id="statAnomalies">-</div>
            </div>
        </div>

        <!-- CHARTS: Strings -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-bold text-slate-800 flex items-center">
                    <span class="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mr-2 text-sm">
                        <i class="fas fa-bolt"></i>
                    </span>
                    Dunkelkennlinien - Courbes Sombres Strings
                </h2>
                <div class="flex gap-2">
                    <button onclick="toggleAllCurves('strings', true)" class="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg font-semibold hover:bg-blue-200">Tout afficher</button>
                    <button onclick="toggleAllCurves('strings', false)" class="px-3 py-1 text-xs bg-slate-100 text-slate-600 rounded-lg font-semibold hover:bg-slate-200">Tout masquer</button>
                </div>
            </div>
            <div class="h-[450px] relative">
                <canvas id="stringsChart"></canvas>
            </div>
            <div class="mt-4 text-xs text-slate-400 text-center">
                <i class="fas fa-info-circle mr-1"></i>
                Cliquez sur une legende pour afficher/masquer la courbe. Axe X: Tension (V), Axe Y: Courant (A)
            </div>
        </div>

        <!-- CHARTS: Diodes -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-bold text-slate-800 flex items-center">
                    <span class="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mr-2 text-sm">
                        <i class="fas fa-circle-nodes"></i>
                    </span>
                    Dunkelkennlinien - Courbes Diodes Bypass
                </h2>
                <div class="flex gap-2">
                    <button onclick="toggleAllCurves('diodes', true)" class="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-lg font-semibold hover:bg-purple-200">Tout afficher</button>
                    <button onclick="toggleAllCurves('diodes', false)" class="px-3 py-1 text-xs bg-slate-100 text-slate-600 rounded-lg font-semibold hover:bg-slate-200">Tout masquer</button>
                </div>
            </div>
            <div class="h-[450px] relative">
                <canvas id="diodesChart"></canvas>
            </div>
            <div class="mt-4 text-xs text-slate-400 text-center">
                <i class="fas fa-info-circle mr-1"></i>
                Les courbes en <span class="text-red-500 font-bold">rouge pointille</span> indiquent des anomalies detectees.
            </div>
        </div>

        <!-- TABS: Tableaux comparatifs -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
            <div class="flex border-b border-slate-200">
                <button id="tabStrings" onclick="showTab('strings')" class="flex-1 px-6 py-3 text-sm font-bold text-blue-600 border-b-2 border-blue-600 bg-blue-50/50">
                    <i class="fas fa-bolt mr-1"></i> Parametres Strings
                </button>
                <button id="tabDiodes" onclick="showTab('diodes')" class="flex-1 px-6 py-3 text-sm font-bold text-slate-400 border-b-2 border-transparent hover:text-slate-600">
                    <i class="fas fa-circle-nodes mr-1"></i> Parametres Diodes
                </button>
                <button id="tabAnomalies" onclick="showTab('anomalies')" class="flex-1 px-6 py-3 text-sm font-bold text-slate-400 border-b-2 border-transparent hover:text-slate-600">
                    <i class="fas fa-triangle-exclamation mr-1"></i> Anomalies
                </button>
            </div>
            
            <!-- Tab Strings -->
            <div id="panelStrings" class="p-6">
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="bg-slate-50">
                                <th class="px-4 py-3 text-left font-bold text-slate-500 text-xs uppercase">Nr.</th>
                                <th class="px-4 py-3 text-center font-bold text-slate-500 text-xs uppercase">FF</th>
                                <th class="px-4 py-3 text-center font-bold text-slate-500 text-xs uppercase">Rds (Ohm)</th>
                                <th class="px-4 py-3 text-center font-bold text-slate-500 text-xs uppercase">Uf (V)</th>
                                <th class="px-4 py-3 text-center font-bold text-slate-500 text-xs uppercase">V max (V)</th>
                                <th class="px-4 py-3 text-center font-bold text-slate-500 text-xs uppercase">I max (A)</th>
                                <th class="px-4 py-3 text-center font-bold text-slate-500 text-xs uppercase">Statut</th>
                            </tr>
                        </thead>
                        <tbody id="stringsTable"></tbody>
                    </table>
                </div>
            </div>
            
            <!-- Tab Diodes -->
            <div id="panelDiodes" class="p-6 hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="bg-slate-50">
                                <th class="px-4 py-3 text-left font-bold text-slate-500 text-xs uppercase">Nr.</th>
                                <th class="px-4 py-3 text-center font-bold text-slate-500 text-xs uppercase">FF</th>
                                <th class="px-4 py-3 text-center font-bold text-slate-500 text-xs uppercase">Rds (Ohm)</th>
                                <th class="px-4 py-3 text-center font-bold text-slate-500 text-xs uppercase">Uf (V)</th>
                                <th class="px-4 py-3 text-center font-bold text-slate-500 text-xs uppercase">V max (V)</th>
                                <th class="px-4 py-3 text-center font-bold text-slate-500 text-xs uppercase">I max (A)</th>
                                <th class="px-4 py-3 text-center font-bold text-slate-500 text-xs uppercase">Statut</th>
                            </tr>
                        </thead>
                        <tbody id="diodesTable"></tbody>
                    </table>
                </div>
            </div>
            
            <!-- Tab Anomalies -->
            <div id="panelAnomalies" class="p-6 hidden">
                <div id="anomaliesList" class="space-y-3"></div>
                <div id="noAnomalies" class="hidden text-center py-8 text-slate-400">
                    <i class="fas fa-check-circle text-4xl text-green-400 mb-3"></i>
                    <p class="font-semibold">Aucune anomalie detectee</p>
                    <p class="text-sm">Toutes les mesures sont dans les tolerances normales.</p>
                </div>
            </div>
        </div>

        <!-- Bar charts FF comparatif -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 class="font-bold text-slate-700 mb-4 flex items-center">
                    <i class="fas fa-chart-bar text-blue-500 mr-2"></i>Fill Factor - Strings
                </h3>
                <div class="h-[250px]"><canvas id="ffStringsBar"></canvas></div>
            </div>
            <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 class="font-bold text-slate-700 mb-4 flex items-center">
                    <i class="fas fa-chart-bar text-purple-500 mr-2"></i>Fill Factor - Diodes
                </h3>
                <div class="h-[250px]"><canvas id="ffDiodesBar"></canvas></div>
            </div>
        </div>
    </div>

    <!-- UPLOAD MODAL -->
    <div id="uploadModal" class="fixed inset-0 z-50 hidden items-center justify-center bg-black/50 backdrop-blur-sm">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            <div class="p-6 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-blue-50">
                <h2 class="text-xl font-bold text-slate-800 flex items-center">
                    <i class="fas fa-file-import text-purple-600 mr-3"></i>
                    Import fichier PVServ
                </h2>
                <p class="text-sm text-slate-500 mt-1">Fichier .txt depuis la carte SD du PVServ</p>
            </div>
            <div class="p-6 space-y-4">
                <!-- Drop zone -->
                <div id="dropZone" class="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-purple-500 hover:bg-purple-50/50 transition-all cursor-pointer"
                     onclick="document.getElementById('fileInput').click()">
                    <i class="fas fa-cloud-upload-alt text-3xl text-slate-400 mb-3"></i>
                    <p class="font-semibold text-slate-600" id="dropText">Glissez ou cliquez pour selectionner</p>
                    <p class="text-xs text-slate-400 mt-1">Format accepte: .txt (PVServ)</p>
                    <input type="file" id="fileInput" accept=".txt" class="hidden" onchange="handleFileSelect(event)">
                </div>
                
                <!-- Options -->
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Projet (optionnel)</label>
                        <select id="uploadProjectId" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none">
                            <option value="">Aucun projet lie</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Technicien</label>
                        <input type="text" id="uploadTechnician" value="Adrien Pappalardo" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none">
                    </div>
                </div>
                
                <!-- Preview -->
                <div id="uploadPreview" class="hidden bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div class="flex items-center justify-between mb-2">
                        <span class="font-bold text-sm text-slate-700" id="previewFilename"></span>
                        <span class="text-xs text-slate-400" id="previewSize"></span>
                    </div>
                    <div class="grid grid-cols-2 gap-2 text-xs">
                        <div class="bg-white p-2 rounded-lg">
                            <span class="text-slate-400">Blocs detectes:</span>
                            <span class="font-bold text-slate-700 ml-1" id="previewBlocks">-</span>
                        </div>
                        <div class="bg-white p-2 rounded-lg">
                            <span class="text-slate-400">Taille:</span>
                            <span class="font-bold text-slate-700 ml-1" id="previewSizeDetail">-</span>
                        </div>
                    </div>
                </div>
                
                <!-- Progress bar -->
                <div id="uploadProgress" class="hidden">
                    <div class="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div id="progressBar" class="h-full bg-purple-600 rounded-full transition-all duration-500" style="width: 0%"></div>
                    </div>
                    <p class="text-xs text-slate-500 mt-1 text-center" id="progressText">Import en cours...</p>
                </div>
            </div>
            <div class="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                <button onclick="closeUploadModal()" class="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors">
                    Annuler
                </button>
                <button id="uploadBtn" onclick="uploadFile()" disabled class="px-6 py-2 bg-purple-600 text-white font-bold text-sm rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center">
                    <i class="fas fa-upload mr-2"></i>
                    Importer et analyser
                </button>
            </div>
        </div>
    </div>

    <script>
    // ============================================================================
    // STATE
    // ============================================================================
    let currentSessionToken = null;
    let stringsChartInstance = null;
    let diodesChartInstance = null;
    let ffStringsBarInstance = null;
    let ffDiodesBarInstance = null;
    let selectedFile = null;
    let chartData = null;

    // Chart colors
    const COLORS = [
      '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
      '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1',
      '#84cc16', '#e11d48', '#0ea5e9', '#a855f7', '#10b981',
      '#d946ef', '#0891b2', '#65a30d', '#dc2626', '#7c3aed'
    ];

    // ============================================================================
    // INIT
    // ============================================================================
    document.addEventListener('DOMContentLoaded', () => {
      loadSessions();
      loadProjects();
      setupDragDrop();
    });

    async function loadSessions() {
      try {
        const res = await fetch('/api/pvserv/sessions');
        const data = await res.json();
        if (data.sessions && data.sessions.length > 0) {
          document.getElementById('emptyState').classList.add('hidden');
          document.getElementById('sessionsContainer').classList.remove('hidden');
          renderSessions(data.sessions);
          // Charger la derniere session automatiquement
          loadSession(data.sessions[0].session_token);
        }
      } catch(e) { console.error(e); }
    }

    async function loadProjects() {
      try {
        const res = await fetch('/api/crm/projects?limit=50');
        const data = await res.json();
        const select = document.getElementById('uploadProjectId');
        (data.projects || []).forEach(p => {
          const opt = document.createElement('option');
          opt.value = p.id;
          opt.textContent = p.name || 'Projet #' + p.id;
          select.appendChild(opt);
        });
      } catch(e) {}
    }

    function renderSessions(sessions) {
      const container = document.getElementById('sessionsList');
      container.innerHTML = sessions.map(s => {
        const isActive = s.session_token === currentSessionToken;
        return '<div class="flex items-center justify-between p-3 rounded-xl border ' +
          (isActive ? 'border-purple-300 bg-purple-50' : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50') +
          ' cursor-pointer transition-all" onclick="loadSession(\\'' + s.session_token + '\\')">' +
          '<div class="flex items-center gap-3">' +
            '<div class="w-10 h-10 rounded-lg ' + (isActive ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-500') + ' flex items-center justify-center">' +
              '<i class="fas fa-file-alt"></i>' +
            '</div>' +
            '<div>' +
              '<div class="font-bold text-sm text-slate-800">' + (s.source_filename || 'Import') + '</div>' +
              '<div class="text-xs text-slate-400">' + s.string_count + ' strings, ' + s.diode_count + ' diodes | ' + new Date(s.created_at).toLocaleDateString('fr-FR') + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="flex items-center gap-2">' +
            (s.critical_count > 0 ? '<span class="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">' + s.critical_count + ' crit</span>' : '') +
            (s.warning_count > 0 ? '<span class="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">' + s.warning_count + ' warn</span>' : '') +
            (s.critical_count === 0 && s.warning_count === 0 ? '<span class="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full"><i class="fas fa-check mr-1"></i>OK</span>' : '') +
            '<button onclick="event.stopPropagation(); deleteSession(\\'' + s.session_token + '\\')" class="w-8 h-8 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg flex items-center justify-center transition-colors"><i class="fas fa-trash text-xs"></i></button>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    // ============================================================================
    // LOAD SESSION DATA + CHARTS
    // ============================================================================
    async function loadSession(token) {
      currentSessionToken = token;
      document.getElementById('statsContainer').classList.remove('hidden');
      
      try {
        const res = await fetch('/api/pvserv/sessions/' + token + '/chart-data');
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        
        chartData = data;
        
        // Mettre a jour stats
        document.getElementById('statStrings').textContent = data.session.stringCount;
        document.getElementById('statDiodes').textContent = data.session.diodeCount;
        
        const avgFFStr = data.comparison.strings.length > 0 
          ? (data.comparison.strings.reduce((s,c) => s + c.ff, 0) / data.comparison.strings.length).toFixed(3) : '-';
        const avgFFDio = data.comparison.diodes.length > 0 
          ? (data.comparison.diodes.reduce((s,c) => s + c.ff, 0) / data.comparison.diodes.length).toFixed(3) : '-';
        const avgRdsStr = data.comparison.strings.length > 0 
          ? (data.comparison.strings.reduce((s,c) => s + c.rds, 0) / data.comparison.strings.length).toFixed(1) + ' Ohm' : '-';
        
        document.getElementById('statFFStr').textContent = avgFFStr;
        document.getElementById('statFFDio').textContent = avgFFDio;
        document.getElementById('statRdsStr').textContent = avgRdsStr;
        
        const anomalyCount = [...data.comparison.strings, ...data.comparison.diodes].filter(c => c.anomaly).length;
        document.getElementById('statAnomalies').textContent = anomalyCount;
        
        // Dessiner les charts
        drawStringsCurves(data.charts.strings);
        drawDiodesCurves(data.charts.diodes);
        drawFFBars(data.comparison);
        fillTables(data.comparison);
        fillAnomalies(data);
        
        // Refresh sessions list highlight
        loadSessions();
        
      } catch(e) { console.error(e); alert('Erreur chargement: ' + e.message); }
    }

    // ============================================================================
    // CHART.JS - COURBES SOMBRES STRINGS (style Dunkelkennlinien Excel)
    // ============================================================================
    function drawStringsCurves(chartConfig) {
      if (stringsChartInstance) stringsChartInstance.destroy();
      const ctx = document.getElementById('stringsChart').getContext('2d');
      
      stringsChartInstance = new Chart(ctx, {
        type: 'scatter',
        data: { datasets: chartConfig.datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'nearest', intersect: false },
          plugins: {
            legend: {
              position: 'bottom',
              labels: { 
                usePointStyle: true, pointStyle: 'line', 
                font: { size: 11, family: 'Plus Jakarta Sans' },
                padding: 15
              }
            },
            tooltip: {
              backgroundColor: '#1e293b',
              titleFont: { family: 'Plus Jakarta Sans', weight: 'bold' },
              bodyFont: { family: 'Plus Jakarta Sans' },
              callbacks: {
                label: function(ctx) {
                  return ctx.dataset.label + ' | U=' + ctx.parsed.x.toFixed(0) + 'V, I=' + ctx.parsed.y.toFixed(2) + 'A';
                }
              }
            }
          },
          scales: {
            x: { 
              title: { display: true, text: 'Spannung / Tension (V)', font: { weight: 'bold', family: 'Plus Jakarta Sans' } },
              grid: { color: '#f1f5f9' },
              ticks: { font: { family: 'Plus Jakarta Sans' } }
            },
            y: { 
              title: { display: true, text: 'Strom / Courant (A)', font: { weight: 'bold', family: 'Plus Jakarta Sans' } },
              grid: { color: '#f1f5f9' },
              ticks: { font: { family: 'Plus Jakarta Sans' } }
            }
          },
          elements: { line: { tension: 0.3 } }
        }
      });
    }

    // ============================================================================
    // CHART.JS - COURBES DIODES BYPASS
    // ============================================================================
    function drawDiodesCurves(chartConfig) {
      if (diodesChartInstance) diodesChartInstance.destroy();
      const ctx = document.getElementById('diodesChart').getContext('2d');
      
      diodesChartInstance = new Chart(ctx, {
        type: 'scatter',
        data: { datasets: chartConfig.datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'nearest', intersect: false },
          plugins: {
            legend: {
              position: 'bottom',
              labels: { 
                usePointStyle: true, pointStyle: 'line',
                font: { size: 11, family: 'Plus Jakarta Sans' },
                padding: 15
              }
            },
            tooltip: {
              backgroundColor: '#1e293b',
              callbacks: {
                label: function(ctx) {
                  return ctx.dataset.label + ' | U=' + ctx.parsed.x.toFixed(1) + 'V, I=' + ctx.parsed.y.toFixed(2) + 'A';
                }
              }
            }
          },
          scales: {
            x: { 
              title: { display: true, text: 'Spannung / Tension (V)', font: { weight: 'bold', family: 'Plus Jakarta Sans' } },
              grid: { color: '#f1f5f9' }
            },
            y: { 
              title: { display: true, text: 'Strom / Courant (A)', font: { weight: 'bold', family: 'Plus Jakarta Sans' } },
              grid: { color: '#f1f5f9' }
            }
          },
          elements: { line: { tension: 0.3 } }
        }
      });
    }

    // ============================================================================
    // CHART.JS - BAR CHARTS FF COMPARATIF
    // ============================================================================
    function drawFFBars(comparison) {
      // FF Strings
      if (ffStringsBarInstance) ffStringsBarInstance.destroy();
      const ctxStr = document.getElementById('ffStringsBar').getContext('2d');
      const strLabels = comparison.strings.map(c => 'Nr.' + c.nr);
      const strValues = comparison.strings.map(c => c.ff);
      const strColors = comparison.strings.map(c => c.anomaly ? '#ef4444' : '#3b82f6');
      
      ffStringsBarInstance = new Chart(ctxStr, {
        type: 'bar',
        data: {
          labels: strLabels,
          datasets: [{
            label: 'Fill Factor',
            data: strValues,
            backgroundColor: strColors,
            borderRadius: 6,
            borderWidth: 0,
            barPercentage: 0.7,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: ctx => 'FF = ' + ctx.parsed.y.toFixed(4)
              }
            }
          },
          scales: {
            y: { min: 0.9, max: 1.0, title: { display: true, text: 'Fill Factor' }, grid: { color: '#f1f5f9' } },
            x: { grid: { display: false } }
          }
        }
      });
      
      // FF Diodes
      if (ffDiodesBarInstance) ffDiodesBarInstance.destroy();
      const ctxDio = document.getElementById('ffDiodesBar').getContext('2d');
      const dioLabels = comparison.diodes.map(c => 'Nr.' + c.nr);
      const dioValues = comparison.diodes.map(c => c.ff);
      const dioColors = comparison.diodes.map(c => c.anomaly ? '#ef4444' : '#8b5cf6');
      
      ffDiodesBarInstance = new Chart(ctxDio, {
        type: 'bar',
        data: {
          labels: dioLabels,
          datasets: [{
            label: 'Fill Factor',
            data: dioValues,
            backgroundColor: dioColors,
            borderRadius: 6,
            borderWidth: 0,
            barPercentage: 0.7,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: ctx => 'FF = ' + ctx.parsed.y.toFixed(4)
              }
            }
          },
          scales: {
            y: { min: 0.6, max: 1.0, title: { display: true, text: 'Fill Factor' }, grid: { color: '#f1f5f9' } },
            x: { grid: { display: false } }
          }
        }
      });
    }

    // ============================================================================
    // TOGGLE CURVES VISIBILITY
    // ============================================================================
    function toggleAllCurves(type, visible) {
      const chart = type === 'strings' ? stringsChartInstance : diodesChartInstance;
      if (!chart) return;
      chart.data.datasets.forEach((ds, i) => {
        chart.setDatasetVisibility(i, visible);
      });
      chart.update();
    }

    // ============================================================================
    // FILL COMPARISON TABLES
    // ============================================================================
    function fillTables(comparison) {
      const stringsTable = document.getElementById('stringsTable');
      stringsTable.innerHTML = comparison.strings.map(c => {
        const severityClass = c.severity === 'critical' ? 'bg-red-100 text-red-700' : 
                              c.severity === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700';
        const severityIcon = c.severity === 'critical' ? 'fa-circle-xmark' : 
                             c.severity === 'warning' ? 'fa-triangle-exclamation' : 'fa-circle-check';
        return '<tr class="border-b border-slate-100 hover:bg-slate-50">' +
          '<td class="px-4 py-3 font-bold text-slate-800">' + c.nr + '</td>' +
          '<td class="px-4 py-3 text-center font-mono font-semibold">' + c.ff.toFixed(4) + '</td>' +
          '<td class="px-4 py-3 text-center font-mono">' + c.rds.toFixed(2) + '</td>' +
          '<td class="px-4 py-3 text-center font-mono">' + c.uf + '</td>' +
          '<td class="px-4 py-3 text-center font-mono">' + (c.vMax || '-') + '</td>' +
          '<td class="px-4 py-3 text-center font-mono">' + (c.iMax ? c.iMax.toFixed(2) : '-') + '</td>' +
          '<td class="px-4 py-3 text-center"><span class="px-2 py-1 rounded-full text-xs font-bold ' + severityClass + '"><i class="fas ' + severityIcon + ' mr-1"></i>' + (c.anomaly ? c.severity : 'OK') + '</span></td>' +
        '</tr>';
      }).join('');
      
      const diodesTable = document.getElementById('diodesTable');
      diodesTable.innerHTML = comparison.diodes.map(c => {
        const severityClass = c.severity === 'critical' ? 'bg-red-100 text-red-700' : 
                              c.severity === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700';
        const severityIcon = c.severity === 'critical' ? 'fa-circle-xmark' : 
                             c.severity === 'warning' ? 'fa-triangle-exclamation' : 'fa-circle-check';
        return '<tr class="border-b border-slate-100 hover:bg-slate-50">' +
          '<td class="px-4 py-3 font-bold text-slate-800">' + c.nr + '</td>' +
          '<td class="px-4 py-3 text-center font-mono font-semibold">' + c.ff.toFixed(4) + '</td>' +
          '<td class="px-4 py-3 text-center font-mono">' + c.rds.toFixed(2) + '</td>' +
          '<td class="px-4 py-3 text-center font-mono">' + c.uf + '</td>' +
          '<td class="px-4 py-3 text-center font-mono">' + (c.vMax || '-') + '</td>' +
          '<td class="px-4 py-3 text-center font-mono">' + (c.iMax ? c.iMax.toFixed(2) : '-') + '</td>' +
          '<td class="px-4 py-3 text-center"><span class="px-2 py-1 rounded-full text-xs font-bold ' + severityClass + '"><i class="fas ' + severityIcon + ' mr-1"></i>' + (c.anomaly ? c.severity : 'OK') + '</span></td>' +
        '</tr>';
      }).join('');
    }

    function fillAnomalies(data) {
      const container = document.getElementById('anomaliesList');
      const noAnomContainer = document.getElementById('noAnomalies');
      
      // Recuperer anomalies des comparaisons
      const allCurves = [...data.comparison.strings.map(c => ({...c, curveType: 'string'})), 
                         ...data.comparison.diodes.map(c => ({...c, curveType: 'diode'}))];
      const anomalies = allCurves.filter(c => c.anomaly);
      
      if (anomalies.length === 0) {
        container.classList.add('hidden');
        noAnomContainer.classList.remove('hidden');
        return;
      }
      
      container.classList.remove('hidden');
      noAnomContainer.classList.add('hidden');
      
      container.innerHTML = anomalies.map(a => {
        const isCritical = a.severity === 'critical';
        return '<div class="p-4 rounded-xl border ' + (isCritical ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50') + '">' +
          '<div class="flex items-center gap-3">' +
            '<div class="w-8 h-8 rounded-lg ' + (isCritical ? 'bg-red-200 text-red-700' : 'bg-amber-200 text-amber-700') + ' flex items-center justify-center">' +
              '<i class="fas ' + (isCritical ? 'fa-circle-xmark' : 'fa-triangle-exclamation') + '"></i>' +
            '</div>' +
            '<div class="flex-1">' +
              '<div class="font-bold text-sm text-slate-800">' + (a.curveType === 'string' ? 'String' : 'Diode') + ' Nr.' + a.nr + ' - ' + a.severity.toUpperCase() + '</div>' +
              '<div class="text-xs text-slate-500">FF=' + a.ff.toFixed(3) + ' | Rds=' + a.rds.toFixed(2) + ' Ohm | Uf=' + a.uf + 'V</div>' +
            '</div>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    // ============================================================================
    // TAB NAVIGATION
    // ============================================================================
    function showTab(tab) {
      ['strings', 'diodes', 'anomalies'].forEach(t => {
        document.getElementById('panel' + t.charAt(0).toUpperCase() + t.slice(1)).classList.toggle('hidden', t !== tab);
        const tabBtn = document.getElementById('tab' + t.charAt(0).toUpperCase() + t.slice(1));
        tabBtn.className = 'flex-1 px-6 py-3 text-sm font-bold ' + 
          (t === tab ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-400 border-b-2 border-transparent hover:text-slate-600');
      });
    }

    // ============================================================================
    // FILE UPLOAD
    // ============================================================================
    function openUploadModal() {
      document.getElementById('uploadModal').classList.remove('hidden');
      document.getElementById('uploadModal').classList.add('flex');
    }
    
    function closeUploadModal() {
      document.getElementById('uploadModal').classList.add('hidden');
      document.getElementById('uploadModal').classList.remove('flex');
      selectedFile = null;
      document.getElementById('uploadPreview').classList.add('hidden');
      document.getElementById('uploadProgress').classList.add('hidden');
      document.getElementById('uploadBtn').disabled = true;
      document.getElementById('dropText').textContent = 'Glissez ou cliquez pour selectionner';
    }
    
    function setupDragDrop() {
      const zone = document.getElementById('dropZone');
      if (!zone) return;
      zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('border-purple-500', 'bg-purple-50'); });
      zone.addEventListener('dragleave', () => { zone.classList.remove('border-purple-500', 'bg-purple-50'); });
      zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('border-purple-500', 'bg-purple-50');
        if (e.dataTransfer.files.length > 0) {
          selectedFile = e.dataTransfer.files[0];
          showFilePreview(selectedFile);
        }
      });
    }
    
    function handleFileSelect(e) {
      if (e.target.files.length > 0) {
        selectedFile = e.target.files[0];
        showFilePreview(selectedFile);
      }
    }
    
    function showFilePreview(file) {
      document.getElementById('dropText').textContent = file.name;
      document.getElementById('previewFilename').textContent = file.name;
      document.getElementById('previewSizeDetail').textContent = (file.size / 1024).toFixed(1) + ' KB';
      
      // Compter les blocs (Nr.)
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        const blocks = (content.match(/^Nr\\./gm) || []).length;
        document.getElementById('previewBlocks').textContent = blocks;
      };
      reader.readAsText(file);
      
      document.getElementById('uploadPreview').classList.remove('hidden');
      document.getElementById('uploadBtn').disabled = false;
    }
    
    async function uploadFile() {
      if (!selectedFile) return;
      
      const btn = document.getElementById('uploadBtn');
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Analyse en cours...';
      
      document.getElementById('uploadProgress').classList.remove('hidden');
      document.getElementById('progressBar').style.width = '30%';
      document.getElementById('progressText').textContent = 'Envoi du fichier...';
      
      try {
        const formData = new FormData();
        formData.append('file', selectedFile);
        
        const projectId = document.getElementById('uploadProjectId').value;
        const technician = document.getElementById('uploadTechnician').value;
        if (projectId) formData.append('project_id', projectId);
        if (technician) formData.append('technician_name', technician);
        
        document.getElementById('progressBar').style.width = '60%';
        document.getElementById('progressText').textContent = 'Parsing et analyse...';
        
        const res = await fetch('/api/pvserv/upload', { method: 'POST', body: formData });
        const data = await res.json();
        
        document.getElementById('progressBar').style.width = '100%';
        
        if (!data.success) throw new Error(data.error || 'Erreur inconnue');
        
        document.getElementById('progressText').textContent = 
          data.stats.stringCount + ' strings + ' + data.stats.diodeCount + ' diodes importes !';
        
        setTimeout(() => {
          closeUploadModal();
          loadSession(data.session.token);
          document.getElementById('emptyState').classList.add('hidden');
          document.getElementById('sessionsContainer').classList.remove('hidden');
          loadSessions();
        }, 800);
        
      } catch(e) {
        document.getElementById('progressText').textContent = 'Erreur: ' + e.message;
        document.getElementById('progressBar').style.width = '100%';
        document.getElementById('progressBar').classList.add('bg-red-500');
        document.getElementById('progressBar').classList.remove('bg-purple-600');
        btn.innerHTML = '<i class="fas fa-upload mr-2"></i>Importer et analyser';
        btn.disabled = false;
      }
    }

    async function deleteSession(token) {
      if (!confirm('Supprimer cette session et toutes ses donnees ?')) return;
      try {
        await fetch('/api/pvserv/sessions/' + token, { method: 'DELETE' });
        if (currentSessionToken === token) {
          currentSessionToken = null;
          document.getElementById('statsContainer').classList.add('hidden');
        }
        loadSessions();
      } catch(e) { alert('Erreur: ' + e.message); }
    }
    </script>
  `;
  
  return getLayout('Courbes Sombres PVServ', content, 'audit-iv');
}
