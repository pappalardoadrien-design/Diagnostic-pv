import { getLayout } from './layout.js';

export function getCrmDashboardPage() {
  const content = `
    <!-- HEADER KPI -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        <!-- Clients -->
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group">
            <div class="absolute right-0 top-0 h-full w-1 bg-blue-500 transition-all group-hover:w-2"></div>
            <div class="flex justify-between items-start mb-4">
                <div class="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-100 transition-colors">
                    <i class="fas fa-users text-xl"></i>
                </div>
                <span class="text-xs font-bold text-green-500 bg-green-50 px-2 py-1 rounded-full">+12%</span>
            </div>
            <div class="text-3xl font-black text-slate-900 mb-1" id="stat-clients">-</div>
            <div class="text-xs font-bold text-slate-400 uppercase tracking-widest">Clients Actifs</div>
        </div>

        <!-- Projets -->
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group">
            <div class="absolute right-0 top-0 h-full w-1 bg-purple-500 transition-all group-hover:w-2"></div>
            <div class="flex justify-between items-start mb-4">
                <div class="p-3 bg-purple-50 rounded-xl text-purple-600 group-hover:bg-purple-100 transition-colors">
                    <i class="fas fa-solar-panel text-xl"></i>
                </div>
            </div>
            <div class="text-3xl font-black text-slate-900 mb-1" id="stat-sites">-</div>
            <div class="text-xs font-bold text-slate-400 uppercase tracking-widest">Centrales Gérées</div>
        </div>

        <!-- Missions -->
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group">
            <div class="absolute right-0 top-0 h-full w-1 bg-orange-500 transition-all group-hover:w-2"></div>
            <div class="flex justify-between items-start mb-4">
                <div class="p-3 bg-orange-50 rounded-xl text-orange-600 group-hover:bg-orange-100 transition-colors">
                    <i class="fas fa-hard-hat text-xl"></i>
                </div>
                <span class="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-full">En cours</span>
            </div>
            <div class="text-3xl font-black text-slate-900 mb-1" id="stat-audits-actifs">-</div>
            <div class="text-xs font-bold text-slate-400 uppercase tracking-widest">Missions Terrain</div>
        </div>

        <!-- Alertes -->
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group">
            <div class="absolute right-0 top-0 h-full w-1 bg-red-500 transition-all group-hover:w-2"></div>
            <div class="flex justify-between items-start mb-4">
                <div class="p-3 bg-red-50 rounded-xl text-red-600 group-hover:bg-red-100 transition-colors animate-pulse">
                    <i class="fas fa-bolt text-xl"></i>
                </div>
            </div>
            <div class="text-3xl font-black text-slate-900 mb-1" id="stat-alerts">-</div>
            <div class="text-xs font-bold text-slate-400 uppercase tracking-widest">Anomalies Critiques</div>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- MAIN COLUMN (Left) -->
        <div class="lg:col-span-2 space-y-8">
            
            <!-- Quick Actions Grid -->
            <div class="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <h2 class="text-lg font-black text-slate-800 mb-6 flex items-center">
                    <i class="fas fa-rocket text-blue-500 mr-3"></i>Centre de Contrôle
                </h2>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <a href="/crm/clients/create" class="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-xl hover:bg-blue-50 hover:shadow-md transition-all group cursor-pointer border border-transparent hover:border-blue-200">
                        <div class="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-blue-500 mb-3 group-hover:scale-110 transition-transform">
                            <i class="fas fa-user-plus text-lg"></i>
                        </div>
                        <span class="text-sm font-bold text-slate-700 group-hover:text-blue-700">Nouveau Client</span>
                    </a>
                    
                    <a href="/crm/projects/create" class="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-xl hover:bg-purple-50 hover:shadow-md transition-all group cursor-pointer border border-transparent hover:border-purple-200">
                        <div class="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-purple-500 mb-3 group-hover:scale-110 transition-transform">
                            <i class="fas fa-solar-panel text-lg"></i>
                        </div>
                        <span class="text-sm font-bold text-slate-700 group-hover:text-purple-700">Nouveau Site</span>
                    </a>

                    <a href="/audit/create" class="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-xl hover:bg-green-50 hover:shadow-md transition-all group cursor-pointer border border-transparent hover:border-green-200">
                        <div class="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-green-500 mb-3 group-hover:scale-110 transition-transform">
                            <i class="fas fa-clipboard-check text-lg"></i>
                        </div>
                        <span class="text-sm font-bold text-slate-700 group-hover:text-green-700">Lancer Audit</span>
                    </a>

                    <a href="/planning" class="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-xl hover:bg-orange-50 hover:shadow-md transition-all group cursor-pointer border border-transparent hover:border-orange-200">
                        <div class="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-orange-500 mb-3 group-hover:scale-110 transition-transform">
                            <i class="fas fa-calendar-alt text-lg"></i>
                        </div>
                        <span class="text-sm font-bold text-slate-700 group-hover:text-orange-700">Planning</span>
                    </a>
                </div>
            </div>

            <!-- Recent Activity Feed -->
            <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div class="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
                        <i class="fas fa-history text-slate-400"></i> Dernières Activités
                    </h2>
                    <a href="/crm/unified" class="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">VOIR TOUT</a>
                </div>
                <div id="audits-list" class="divide-y divide-slate-50">
                    <div class="p-12 text-center">
                        <i class="fas fa-circle-notch fa-spin text-3xl text-blue-500 mb-4 opacity-50"></i>
                        <p class="text-slate-400 font-medium">Chargement du flux d'activité...</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- SIDE COLUMN (Right) -->
        <div class="space-y-8">
            
            <!-- Agenda Widget -->
            <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div class="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h2 class="text-lg font-black text-slate-800">Agenda</h2>
                    <span class="text-[10px] font-bold bg-white border border-slate-200 px-2 py-1 rounded text-slate-500 uppercase tracking-wide">7 Jours</span>
                </div>
                <div id="interventions-list" class="p-4 space-y-3 min-h-[200px]">
                    <!-- Skeleton Loader -->
                    <div class="animate-pulse flex space-x-4">
                        <div class="rounded-lg bg-slate-200 h-12 w-12"></div>
                        <div class="flex-1 space-y-2 py-1">
                            <div class="h-2 bg-slate-200 rounded w-3/4"></div>
                            <div class="h-2 bg-slate-200 rounded w-1/2"></div>
                        </div>
                    </div>
                </div>
                <a href="/planning" class="block p-4 text-center text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors border-t border-slate-100 uppercase tracking-wide">
                    Accéder au planning complet
                </a>
            </div>

            <!-- Modules Toolbox -->
            <div class="bg-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                <div class="absolute top-0 right-0 p-4 opacity-10">
                    <i class="fas fa-tools text-8xl"></i>
                </div>
                <h3 class="font-bold text-lg mb-6 flex items-center relative z-10">
                    <i class="fas fa-toolbox text-green-400 mr-3"></i>Modules Terrain
                </h3>
                <div class="space-y-3 relative z-10">
                    <a href="/el" class="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer group">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 group-hover:text-white transition-colors">
                                <i class="fas fa-moon"></i>
                            </div>
                            <span class="font-bold text-sm text-slate-300 group-hover:text-white">Audit EL (Nocturne)</span>
                        </div>
                        <i class="fas fa-chevron-right text-xs opacity-50 group-hover:translate-x-1 transition-transform"></i>
                    </a>
                    
                    <a href="/thermal" class="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer group">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400 group-hover:text-white transition-colors">
                                <i class="fas fa-fire"></i>
                            </div>
                            <span class="font-bold text-sm text-slate-300 group-hover:text-white">Thermographie</span>
                        </div>
                        <i class="fas fa-chevron-right text-xs opacity-50 group-hover:translate-x-1 transition-transform"></i>
                    </a>

                    <a href="/iv" class="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer group">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:text-white transition-colors">
                                <i class="fas fa-wave-square"></i>
                            </div>
                            <span class="font-bold text-sm text-slate-300 group-hover:text-white">Courbes I-V</span>
                        </div>
                        <i class="fas fa-chevron-right text-xs opacity-50 group-hover:translate-x-1 transition-transform"></i>
                    </a>
                </div>
            </div>

        </div>
    </div>

    <!-- SCRIPTS -->
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
        // --- DATA LOADER ---
        async function loadDashboardData() {
            try {
                // Fetch Unified Summary API
                const response = await axios.get('/api/crm/dashboard/unified/summary');
                
                if (!response.data || !response.data.success) throw new Error('Données invalides');
                
                const { kpi, audits, interventions } = response.data;

                // --- 1. KPIs ---
                animateValue('stat-clients', 0, kpi.clients_active || 0, 1000);
                animateValue('stat-sites', 0, kpi.projects_active || 0, 1000);
                animateValue('stat-audits-actifs', 0, kpi.audits_active || 0, 1000);
                animateValue('stat-alerts', 0, kpi.critical_defects || 0, 1000);

                if (kpi.critical_defects > 0) document.getElementById('stat-alerts').classList.add('text-red-500');

                // --- 2. RECENT ACTIVITY ---
                const auditsContainer = document.getElementById('audits-list');
                if (audits.length === 0) {
                    auditsContainer.innerHTML = \`
                        <div class="p-12 text-center opacity-50">
                            <i class="fas fa-wind text-4xl mb-3 text-slate-300"></i>
                            <p class="font-medium text-slate-400">Aucune activité récente</p>
                        </div>\`;
                } else {
                    auditsContainer.innerHTML = audits.map(audit => \`
                        <div class="p-4 hover:bg-slate-50 transition-colors flex justify-between items-center cursor-pointer group"
                             onclick="window.location.href='/audit/\${audit.audit_token}'">
                            <div class="flex items-center gap-4">
                                <div class="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-lg group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors shadow-sm">
                                    \${(audit.project_name || '??').substring(0,2).toUpperCase()}
                                </div>
                                <div>
                                    <h4 class="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">\${audit.project_name || 'Projet Inconnu'}</h4>
                                    <p class="text-xs font-medium text-slate-400 uppercase tracking-wide">\${audit.client_company || 'Client Inconnu'}</p>
                                </div>
                            </div>
                            <div class="text-right">
                                <span class="text-xs font-bold text-slate-400 block mb-1">\${new Date(audit.audit_date).toLocaleDateString()}</span>
                                <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-green-100 text-green-700 uppercase tracking-wide">En Cours</span>
                            </div>
                        </div>
                    \`).join('');
                }

                // --- 3. AGENDA ---
                const interventionsContainer = document.getElementById('interventions-list');
                if (interventions.length === 0) {
                    interventionsContainer.innerHTML = \`
                         <div class="p-8 text-center opacity-50">
                            <p class="text-xs font-bold text-slate-400 uppercase">Rien de prévu cette semaine</p>
                        </div>\`;
                } else {
                    interventionsContainer.innerHTML = interventions.map(inter => {
                        const date = new Date(inter.date_souhaitee);
                        return \`
                            <div class="flex items-center gap-4 p-3 bg-white rounded-xl border border-slate-100 shadow-sm hover:border-blue-200 transition-colors group cursor-pointer" onclick="window.location.href='/planning/detail?id=\${inter.id}'">
                                <div class="flex-shrink-0 w-12 text-center bg-slate-50 rounded-lg border border-slate-200 py-1.5 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                                    <span class="block text-[10px] text-slate-400 font-black uppercase leading-none group-hover:text-blue-400">\${date.toLocaleDateString('fr-FR', {month:'short'})}</span>
                                    <span class="block text-xl font-black text-slate-700 leading-none mt-0.5 group-hover:text-blue-600">\${date.getDate()}</span>
                                </div>
                                <div class="min-w-0">
                                    <h4 class="text-sm font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">\${inter.titre || inter.project_name || 'Intervention'}</h4>
                                    <p class="text-xs text-slate-400 truncate">\${inter.client_name || 'Client...'}</p>
                                </div>
                            </div>
                        \`;
                    }).join('');
                }

            } catch (error) {
                console.error('Erreur dashboard:', error);
                // Fail silently or show toast
            }
        }

        // Helper Animation
        function animateValue(id, start, end, duration) {
            const obj = document.getElementById(id);
            if(!obj) return;
            let startTimestamp = null;
            const step = (timestamp) => {
                if (!startTimestamp) startTimestamp = timestamp;
                const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                obj.innerHTML = Math.floor(progress * (end - start) + start);
                if (progress < 1) {
                    window.requestAnimationFrame(step);
                }
            };
            window.requestAnimationFrame(step);
        }

        // Start
        document.addEventListener('DOMContentLoaded', loadDashboardData);
    </script>
  `;

  return getLayout('Tableau de Bord', content, 'dashboard');
}
