export const getLayout = (title: string, content: string, activeMenu: string = 'dashboard') => `
<!DOCTYPE html>
<html lang="fr" class="h-full bg-slate-50">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} | DiagPV OS</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        .sidebar-link { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); border-left: 3px solid transparent; }
        .sidebar-link:hover { background-color: rgba(255,255,255,0.05); color: white; }
        .sidebar-link.active { background-color: rgba(255,255,255,0.1); border-left-color: #22c55e; color: white; }
        
        /* Custom Scrollbar */
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

        /* Loader */
        .loader-dots::after {
            content: " .";
            animation: dots 1.5s steps(5, end) infinite;
        }
        @keyframes dots { 0%, 20% { content: " ."; } 40% { content: " .."; } 60% { content: " ..."; } 80%, 100% { content: ""; } }
    </style>
</head>
<body class="h-full flex overflow-hidden bg-slate-50">

    <!-- SIDEBAR -->
    <aside class="w-64 bg-slate-900 text-slate-400 flex flex-col shadow-2xl z-30 flex-shrink-0 border-r border-slate-800">
        <!-- Logo -->
        <div class="h-16 flex items-center px-6 bg-slate-950/50 border-b border-slate-800">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-green-900/20">
                    <i class="fas fa-bolt text-sm"></i>
                </div>
                <div>
                    <span class="font-extrabold text-white text-lg tracking-tight leading-none block">DiagPV</span>
                    <span class="text-[10px] font-bold text-green-500 tracking-widest uppercase block leading-none">Operating System</span>
                </div>
            </div>
        </div>

        <!-- User Profile -->
        <div class="p-4 border-b border-slate-800/50">
            <div class="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group">
                <div class="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold group-hover:border-green-500/50 group-hover:text-white transition-all">
                    AP
                </div>
                <div class="overflow-hidden">
                    <div class="text-sm font-bold text-slate-200 truncate">Adrien P.</div>
                    <div class="text-xs text-slate-500 truncate">Business Developer</div>
                </div>
                <i class="fas fa-chevron-right text-xs ml-auto text-slate-600 group-hover:text-slate-400"></i>
            </div>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 py-4 space-y-1 overflow-y-auto px-2">
            
            <a href="/crm/dashboard" class="sidebar-link flex items-center px-4 py-2.5 rounded-lg text-sm mb-4 ${activeMenu === 'dashboard' ? 'active' : ''}">
                <i class="fas fa-grid-2 w-6 text-center text-lg ${activeMenu === 'dashboard' ? 'text-green-500' : 'text-slate-500'}"></i>
                <span class="font-semibold">Tableau de Bord</span>
            </a>
            
            <div class="px-4 py-2 mt-2">
                <div class="text-[10px] font-black text-slate-600 uppercase tracking-widest">CRM & Business</div>
            </div>
            
            <a href="/crm/clients" class="sidebar-link flex items-center px-4 py-2.5 rounded-lg text-sm ${activeMenu === 'clients' ? 'active' : ''}">
                <i class="fas fa-users w-6 text-center ${activeMenu === 'clients' ? 'text-blue-400' : 'text-slate-500'}"></i>
                <span class="font-medium">Clients</span>
            </a>
            
            <a href="/pv/plants" class="sidebar-link flex items-center px-4 py-2.5 rounded-lg text-sm ${activeMenu === 'projects' ? 'active' : ''}">
                <i class="fas fa-solar-panel w-6 text-center ${activeMenu === 'projects' ? 'text-blue-400' : 'text-slate-500'}"></i>
                <span class="font-medium">Sites & Projets</span>
            </a>

            <div class="px-4 py-2 mt-4">
                <div class="text-[10px] font-black text-slate-600 uppercase tracking-widest">Opérations</div>
            </div>

            <a href="/planning" class="sidebar-link flex items-center px-4 py-2.5 rounded-lg text-sm ${activeMenu === 'planning' ? 'active' : ''}">
                <i class="fas fa-calendar-day w-6 text-center ${activeMenu === 'planning' ? 'text-orange-400' : 'text-slate-500'}"></i>
                <span class="font-medium">Planning</span>
            </a>
            
            <a href="/audit/create" class="sidebar-link flex items-center px-4 py-2.5 rounded-lg text-sm ${activeMenu === 'new-audit' ? 'active' : ''}">
                <i class="fas fa-file-circle-plus w-6 text-center ${activeMenu === 'new-audit' ? 'text-green-400' : 'text-slate-500'}"></i>
                <span class="font-medium">Nouvelle Mission</span>
            </a>

            <div class="px-4 py-2 mt-4">
                <div class="text-[10px] font-black text-slate-600 uppercase tracking-widest">Modules Techniques</div>
            </div>

            <a href="/visual" class="sidebar-link flex items-center px-4 py-2.5 rounded-lg text-sm ${activeMenu === 'audit-visuel' ? 'active' : ''}">
                <i class="fas fa-eye w-6 text-center text-slate-500"></i>
                <span class="font-medium">Inspection Visuelle</span>
            </a>
            <a href="/iv" class="sidebar-link flex items-center px-4 py-2.5 rounded-lg text-sm ${activeMenu === 'audit-iv' ? 'active' : ''}">
                <i class="fas fa-wave-square w-6 text-center text-slate-500"></i>
                <span class="font-medium">Courbes I-V</span>
            </a>
            <a href="/thermal" class="sidebar-link flex items-center px-4 py-2.5 rounded-lg text-sm ${activeMenu === 'audit-thermal' ? 'active' : ''}">
                <i class="fas fa-temperature-high w-6 text-center text-slate-500"></i>
                <span class="font-medium">Thermographie</span>
            </a>
             <a href="/el" class="sidebar-link flex items-center px-4 py-2.5 rounded-lg text-sm ${activeMenu === 'audit-el' ? 'active' : ''}">
                <i class="fas fa-camera w-6 text-center text-slate-500"></i>
                <span class="font-medium">Électroluminescence</span>
            </a>

        </nav>

        <!-- Footer Sidebar -->
        <div class="p-4 bg-slate-950/30 border-t border-slate-800">
            <a href="/settings" class="flex items-center gap-3 px-2 py-2 text-slate-500 hover:text-white transition-colors rounded-lg hover:bg-white/5">
                <i class="fas fa-cog w-6 text-center"></i>
                <span class="text-xs font-bold uppercase tracking-wide">Paramètres</span>
            </a>
        </div>
    </aside>

    <!-- MAIN CONTENT -->
    <main class="flex-1 flex flex-col h-full overflow-hidden relative bg-slate-50">
        <!-- Topbar -->
        <header class="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-20 flex-shrink-0">
            
            <!-- Breadcrumb / Title -->
            <div class="flex items-center gap-4">
                <h1 class="text-lg font-bold text-slate-800 tracking-tight">
                    ${title}
                </h1>
                <div class="h-4 w-px bg-slate-300 mx-2 hidden md:block"></div>
                <div class="hidden md:flex items-center text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
                    <span class="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                    Système opérationnel
                </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-3">
                <div class="relative group">
                    <button class="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all">
                        <i class="fas fa-bell"></i>
                        <span class="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                    </button>
                </div>
                
                <div class="h-8 w-px bg-slate-200 mx-1"></div>
                
                <a href="https://github.com/adrien-pappalardo/diagnostic-hub" target="_blank" class="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all flex items-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                    <i class="fab fa-github mr-2"></i>Code Source
                </a>
            </div>
        </header>

        <!-- Page Content Scroller -->
        <div class="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-8 scroll-smooth">
            ${content}
        </div>
    </main>

</body>
</html>
`;
