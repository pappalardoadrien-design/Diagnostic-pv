import { getLayout } from './layout.js';

export function getIVCurvesPage() {
  const content = `
    <!-- HEADER -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
            <h1 class="text-3xl font-black text-slate-900 tracking-tight flex items-center">
                <span class="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mr-3 text-xl">
                    <i class="fas fa-wave-square"></i>
                </span>
                Courbes I-V
            </h1>
            <p class="text-slate-500 font-medium ml-14">Analyse de performance String par String</p>
        </div>
        <button onclick="openUploadModal()" class="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center">
            <i class="fas fa-cloud-upload-alt mr-2"></i>
            Import PVSyst / PVServ
        </button>
    </div>

    <!-- DASHBOARD STATS -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div class="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Total Courbes</div>
            <div class="text-3xl font-black text-slate-800" id="totalCurves">-</div>
        </div>
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div class="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Fill Factor Moyen</div>
            <div class="text-3xl font-black text-green-500" id="avgFF">-</div>
        </div>
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div class="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Rds Moyenne</div>
            <div class="text-3xl font-black text-purple-500" id="avgRds">- <span class="text-lg text-slate-400">Ω</span></div>
        </div>
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div class="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Hors Tolérance</div>
            <div class="text-3xl font-black text-red-500" id="outOfTolerance">-</div>
        </div>
    </div>

    <!-- MAIN GRID -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- LEFT: FILTERS & LIST -->
        <div class="lg:col-span-1 space-y-6">
            
            <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 class="font-bold text-slate-800 mb-4 flex items-center">
                    <i class="fas fa-filter text-slate-400 mr-2"></i>Filtres
                </h2>
                <div class="space-y-4">
                    <div>
                        <label class="block text-xs font-bold text-slate-500 uppercase mb-2">String</label>
                        <select id="filterString" class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-medium">
                            <option value="">Tous</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Performance Min (FF)</label>
                        <input type="range" min="0" max="100" value="0" class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600">
                        <div class="flex justify-between text-xs text-slate-400 mt-1">
                            <span>0%</span>
                            <span>100%</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col max-h-[600px]">
                <div class="p-4 border-b border-slate-100 bg-slate-50/50 font-bold text-slate-700 text-sm">
                    Liste des Mesures
                </div>
                <div class="overflow-y-auto flex-1 p-2 space-y-2" id="curvesList">
                    <!-- Items injected via JS -->
                    <div class="p-8 text-center text-slate-400 text-sm">Chargement...</div>
                </div>
            </div>

        </div>

        <!-- RIGHT: CHART & DETAILS -->
        <div class="lg:col-span-2 space-y-6">
            
            <!-- Main Chart -->
            <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="font-black text-slate-800 text-lg">Analyse Graphique</h2>
                    <div class="flex gap-2">
                        <span class="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">Courbe I-V</span>
                        <span class="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500">Courbe P-V</span>
                    </div>
                </div>
                <div class="h-80 w-full relative">
                    <canvas id="ivChart"></canvas>
                </div>
            </div>

            <!-- Details Table -->
            <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <table class="w-full text-left">
                    <thead class="bg-slate-50 text-xs uppercase font-black text-slate-500">
                        <tr>
                            <th class="px-6 py-4">String</th>
                            <th class="px-6 py-4">Voc (V)</th>
                            <th class="px-6 py-4">Isc (A)</th>
                            <th class="px-6 py-4">Pmax (W)</th>
                            <th class="px-6 py-4">FF (%)</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100" id="detailsTable">
                        <!-- Data -->
                    </tbody>
                </table>
            </div>

        </div>
    </div>

    <!-- MODAL UPLOAD -->
    <div id="uploadModal" class="fixed inset-0 z-50 hidden bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 opacity-0 transition-opacity duration-300">
        <div class="bg-white rounded-2xl w-full max-w-lg shadow-2xl transform scale-95 transition-transform duration-300" id="modalContent">
            <div class="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 class="text-xl font-black text-slate-800">Import Données</h3>
                <button onclick="closeUploadModal()" class="text-slate-400 hover:text-slate-600">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <form id="uploadForm" class="p-8 space-y-6">
                <div class="border-2 border-dashed border-blue-200 bg-blue-50 rounded-xl p-10 text-center hover:border-blue-400 transition-colors cursor-pointer relative">
                    <input type="file" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer">
                    <i class="fas fa-file-csv text-4xl text-blue-300 mb-3"></i>
                    <p class="font-bold text-blue-800">Glisser un fichier CSV / PVServ</p>
                    <p class="text-xs text-blue-500 mt-1">ou cliquer pour parcourir</p>
                </div>
                
                <button type="submit" class="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all">
                    IMPORTER
                </button>
            </form>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
        // --- STATE ---
        let ivChart = null;

        // --- INIT ---
        document.addEventListener('DOMContentLoaded', () => {
            initChart();
            loadMockData();
        });

        // --- CHART ---
        function initChart() {
            const ctx = document.getElementById('ivChart').getContext('2d');
            ivChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [0, 100, 200, 300, 400, 500, 600, 700, 800],
                    datasets: [
                        {
                            label: 'String 1 (Ref)',
                            data: [10, 9.9, 9.8, 9.7, 9.5, 9.0, 7.5, 4.0, 0],
                            borderColor: '#2563eb',
                            tension: 0.4,
                            pointRadius: 0
                        },
                        {
                            label: 'String 2 (Mesure)',
                            data: [9.8, 9.7, 9.6, 9.5, 9.3, 8.5, 6.0, 2.0, 0],
                            borderColor: '#ef4444',
                            borderDash: [5, 5],
                            tension: 0.4,
                            pointRadius: 0
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: { legend: { position: 'bottom' } },
                    scales: {
                        x: { title: { display: true, text: 'Voltage (V)' } },
                        y: { title: { display: true, text: 'Current (A)' } }
                    }
                }
            });
        }

        // --- MOCK DATA ---
        function loadMockData() {
            document.getElementById('totalCurves').textContent = '24';
            document.getElementById('avgFF').textContent = '78%';
            document.getElementById('avgRds').textContent = '0.45';
            document.getElementById('outOfTolerance').textContent = '2';

            const list = document.getElementById('curvesList');
            list.innerHTML = '';
            for(let i=1; i<=10; i++) {
                list.innerHTML += \`
                    <div class="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors group">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">S\${i}</div>
                            <div>
                                <div class="font-bold text-slate-700 text-sm">String 0\${i}</div>
                                <div class="text-xs text-slate-400">10:4\${i} AM</div>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="font-bold text-slate-800 text-sm">78.5%</div>
                            <div class="text-[10px] text-green-500 font-bold">OK</div>
                        </div>
                    </div>
                \`;
            }

            const table = document.getElementById('detailsTable');
            table.innerHTML = \`
                <tr class="hover:bg-slate-50">
                    <td class="px-6 py-4 font-bold text-slate-700">String 01</td>
                    <td class="px-6 py-4">820 V</td>
                    <td class="px-6 py-4">9.8 A</td>
                    <td class="px-6 py-4 font-bold text-slate-900">6.2 kW</td>
                    <td class="px-6 py-4"><span class="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">78.2%</span></td>
                </tr>
                <tr class="hover:bg-slate-50">
                    <td class="px-6 py-4 font-bold text-slate-700">String 02</td>
                    <td class="px-6 py-4">815 V</td>
                    <td class="px-6 py-4">9.6 A</td>
                    <td class="px-6 py-4 font-bold text-slate-900">6.0 kW</td>
                    <td class="px-6 py-4"><span class="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-bold">74.5%</span></td>
                </tr>
            \`;
        }

        // --- MODAL ---
        const modal = document.getElementById('uploadModal');
        const modalContent = document.getElementById('modalContent');

        window.openUploadModal = function() {
            modal.classList.remove('hidden');
            setTimeout(() => {
                modal.classList.remove('opacity-0');
                modalContent.classList.remove('scale-95');
                modalContent.classList.add('scale-100');
            }, 10);
        }

        window.closeUploadModal = function() {
            modal.classList.add('opacity-0');
            modalContent.classList.remove('scale-100');
            modalContent.classList.add('scale-95');
            setTimeout(() => modal.classList.add('hidden'), 300);
        }

        document.getElementById('uploadForm').addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Upload simulé !');
            closeUploadModal();
        });

    </script>
  `;

  return getLayout('Courbes I-V', content, 'audit-iv');
}
