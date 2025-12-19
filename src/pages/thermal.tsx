import { getLayout } from './layout.js';

export function getThermalPage() {
  const content = `
    <!-- HEADER -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
            <h1 class="text-3xl font-black text-slate-900 tracking-tight flex items-center">
                <span class="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center mr-3 text-xl">
                    <i class="fas fa-fire"></i>
                </span>
                Thermographie IR
            </h1>
            <p class="text-slate-500 font-medium ml-14">Analyse thermique conforme DIN EN 62446-3</p>
        </div>
        <div class="flex gap-3">
            <button onclick="refreshData()" class="px-4 py-2 bg-white border border-slate-300 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors">
                <i class="fas fa-sync-alt mr-2"></i>Rafraîchir
            </button>
            <a href="#" class="px-4 py-2 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-200 transition-all">
                <i class="fas fa-file-pdf mr-2"></i>Rapport PDF
            </a>
        </div>
    </div>

    <!-- KPI CARDS -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        
        <!-- Total Mesures -->
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group">
            <div class="absolute right-0 top-0 h-full w-1 bg-blue-500 transition-all group-hover:w-2"></div>
            <div class="flex justify-between items-start mb-4">
                <div class="p-3 bg-blue-50 rounded-xl text-blue-600">
                    <i class="fas fa-thermometer-half text-xl"></i>
                </div>
            </div>
            <div class="text-3xl font-black text-slate-900 mb-1" id="stat-total">-</div>
            <div class="text-xs font-bold text-slate-400 uppercase tracking-widest">Points Mesurés</div>
        </div>

        <!-- Hotspots -->
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group">
            <div class="absolute right-0 top-0 h-full w-1 bg-red-500 transition-all group-hover:w-2"></div>
            <div class="flex justify-between items-start mb-4">
                <div class="p-3 bg-red-50 rounded-xl text-red-600 animate-pulse">
                    <i class="fas fa-fire text-xl"></i>
                </div>
            </div>
            <div class="text-3xl font-black text-slate-900 mb-1" id="stat-hotspots">-</div>
            <div class="text-xs font-bold text-slate-400 uppercase tracking-widest">Hotspots Critiques</div>
        </div>

        <!-- T Max -->
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group">
            <div class="absolute right-0 top-0 h-full w-1 bg-orange-500 transition-all group-hover:w-2"></div>
            <div class="flex justify-between items-start mb-4">
                <div class="p-3 bg-orange-50 rounded-xl text-orange-600">
                    <i class="fas fa-temperature-high text-xl"></i>
                </div>
            </div>
            <div class="text-3xl font-black text-slate-900 mb-1" id="stat-temp-max">-</div>
            <div class="text-xs font-bold text-slate-400 uppercase tracking-widest">Temp. Max (°C)</div>
        </div>

        <!-- Delta T -->
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group">
            <div class="absolute right-0 top-0 h-full w-1 bg-purple-500 transition-all group-hover:w-2"></div>
            <div class="flex justify-between items-start mb-4">
                <div class="p-3 bg-purple-50 rounded-xl text-purple-600">
                    <i class="fas fa-chart-line text-xl"></i>
                </div>
            </div>
            <div class="text-3xl font-black text-slate-900 mb-1" id="stat-delta-t">-</div>
            <div class="text-xs font-bold text-slate-400 uppercase tracking-widest">ΔT Max (°C)</div>
        </div>
    </div>

    <!-- MAIN CONTENT -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- LEFT: INPUT FORM -->
        <div class="lg:col-span-1 space-y-6">
            <div class="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200 p-6 sticky top-24">
                <h2 class="text-lg font-black text-slate-800 mb-6 flex items-center">
                    <i class="fas fa-plus-circle text-green-500 mr-2"></i>Saisie Rapide
                </h2>
                
                <form id="form-add-measurement" class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-2">String</label>
                            <input type="number" id="input-string" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-bold" placeholder="#">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Module</label>
                            <input type="number" id="input-module" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-bold" placeholder="#">
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-2">T° Max (°C)</label>
                            <input type="number" step="0.1" id="input-temp" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none font-bold text-red-600" placeholder="0.0">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-2">ΔT (°C)</label>
                            <input type="number" step="0.1" id="input-delta" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-bold text-purple-600" placeholder="0.0">
                        </div>
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Type de Défaut</label>
                        <select id="input-defect" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700">
                            <option value="hotspot">Hotspot</option>
                            <option value="bypass_diode">Diode Bypass</option>
                            <option value="shading">Ombrage</option>
                            <option value="disconnection">Déconnexion</option>
                            <option value="pid">PID</option>
                            <option value="ok">R.A.S</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Sévérité</label>
                        <div class="flex gap-2">
                            <button type="button" class="flex-1 py-2 rounded-lg bg-green-100 text-green-700 text-xs font-bold hover:bg-green-200 transition-colors" onclick="setSeverity(1)">1</button>
                            <button type="button" class="flex-1 py-2 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold hover:bg-blue-200 transition-colors" onclick="setSeverity(2)">2</button>
                            <button type="button" class="flex-1 py-2 rounded-lg bg-yellow-100 text-yellow-700 text-xs font-bold hover:bg-yellow-200 transition-colors" onclick="setSeverity(3)">3</button>
                            <button type="button" class="flex-1 py-2 rounded-lg bg-orange-100 text-orange-700 text-xs font-bold hover:bg-orange-200 transition-colors" onclick="setSeverity(4)">4</button>
                            <button type="button" class="flex-1 py-2 rounded-lg bg-red-100 text-red-700 text-xs font-bold hover:bg-red-200 transition-colors ring-2 ring-red-500" onclick="setSeverity(5)" id="sev-5-btn">5</button>
                        </div>
                        <input type="hidden" id="input-severity" value="5">
                    </div>

                    <button type="submit" class="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-black rounded-xl shadow-lg shadow-green-200 transition-all transform hover:-translate-y-1 mt-4">
                        ENREGISTRER
                    </button>
                </form>
            </div>
        </div>

        <!-- RIGHT: CHARTS & TABLE -->
        <div class="lg:col-span-2 space-y-8">
            
            <!-- Charts Row -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 class="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">Répartition Défauts</h3>
                    <div class="h-48 relative">
                        <canvas id="chart-defects"></canvas>
                    </div>
                </div>
                <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 class="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">Sévérité</h3>
                    <div class="h-48 relative">
                        <canvas id="chart-severity"></canvas>
                    </div>
                </div>
            </div>

            <!-- Table -->
            <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div class="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h2 class="text-lg font-black text-slate-800">Historique Mesures</h2>
                    <div class="flex gap-2">
                        <select id="filter-defect" class="text-xs font-bold bg-white border border-slate-300 rounded-lg px-3 py-1.5 outline-none">
                            <option value="all">Tous types</option>
                            <option value="hotspot">Hotspot</option>
                        </select>
                    </div>
                </div>
                
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead class="bg-slate-50 text-xs uppercase font-black text-slate-500">
                            <tr>
                                <th class="px-6 py-4">Position</th>
                                <th class="px-6 py-4">T° Max</th>
                                <th class="px-6 py-4">ΔT</th>
                                <th class="px-6 py-4">Type</th>
                                <th class="px-6 py-4">Sévérité</th>
                            </tr>
                        </thead>
                        <tbody id="measurements-table" class="divide-y divide-slate-100">
                            <tr>
                                <td colspan="5" class="px-6 py-12 text-center text-slate-400 font-medium">Chargement...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
        // --- STATE ---
        let allMeasurements = [];
        let charts = { defects: null, severity: null };
        const auditToken = window.location.pathname.split('/').pop() || 'DEMO';

        // --- INIT ---
        document.addEventListener('DOMContentLoaded', () => {
            loadData();
        });

        // --- ACTIONS ---
        function setSeverity(val) {
            document.getElementById('input-severity').value = val;
            // Reset styles
            document.querySelectorAll('[onclick^="setSeverity"]').forEach(b => b.classList.remove('ring-2', 'ring-offset-1', 'ring-slate-400'));
            // Set active
            event.target.classList.add('ring-2', 'ring-offset-1', 'ring-slate-400');
        }

        async function loadData() {
            try {
                // Mock Data for UI Dev
                const stats = {
                    total_measurements: 42,
                    critical_defects: 5,
                    max_temp_max: 85.4,
                    max_delta_t: 32.1
                };
                
                updateStats(stats);
                
                // Mock Measurements
                const mockMeasurements = [
                    {string: 1, module: 12, temp: 85.4, delta: 32.1, type: 'hotspot', severity: 5},
                    {string: 1, module: 14, temp: 65.2, delta: 12.5, type: 'bypass_diode', severity: 3},
                    {string: 2, module: 5, temp: 55.0, delta: 5.0, type: 'shading', severity: 2}
                ];
                
                renderTable(mockMeasurements);
                initCharts();

            } catch(e) { console.error(e); }
        }

        function updateStats(stats) {
            document.getElementById('stat-total').textContent = stats.total_measurements;
            document.getElementById('stat-hotspots').textContent = stats.critical_defects;
            document.getElementById('stat-temp-max').textContent = stats.max_temp_max;
            document.getElementById('stat-delta-t').textContent = stats.max_delta_t;
        }

        function renderTable(data) {
            const tbody = document.getElementById('measurements-table');
            tbody.innerHTML = data.map(m => \`
                <tr class="hover:bg-slate-50 transition-colors">
                    <td class="px-6 py-4 font-bold text-slate-700">S\${m.string} / M\${m.module}</td>
                    <td class="px-6 py-4 font-bold text-red-600">\${m.temp}°C</td>
                    <td class="px-6 py-4 font-bold text-purple-600">+\${m.delta}°C</td>
                    <td class="px-6 py-4">
                        <span class="px-2 py-1 rounded text-xs font-bold bg-slate-100 text-slate-600 uppercase">\${m.type}</span>
                    </td>
                    <td class="px-6 py-4">
                        <span class="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-black">\${m.severity}</span>
                    </td>
                </tr>
            \`).join('');
        }

        function initCharts() {
            // Defects
            new Chart(document.getElementById('chart-defects'), {
                type: 'doughnut',
                data: {
                    labels: ['Hotspot', 'Diode', 'Ombrage'],
                    datasets: [{
                        data: [12, 5, 3],
                        backgroundColor: ['#ef4444', '#f97316', '#3b82f6']
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
            });

            // Severity
            new Chart(document.getElementById('chart-severity'), {
                type: 'bar',
                data: {
                    labels: ['1', '2', '3', '4', '5'],
                    datasets: [{
                        label: 'Sévérité',
                        data: [20, 10, 5, 2, 5],
                        backgroundColor: ['#22c55e', '#3b82f6', '#eab308', '#f97316', '#ef4444'],
                        borderRadius: 4
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
            });
        }

        function refreshData() { loadData(); }

        // Form Submit
        document.getElementById('form-add-measurement').addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Mesure ajoutée (Simulation)');
            loadData();
        });

    </script>
  `;

  return getLayout('Thermographie', content, 'audit-thermal');
}
