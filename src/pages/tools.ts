/**
 * Tools Page - Hub d'acces aux outils DiagPV
 * Extrait de index.tsx le 2026-02-20 (refactoring)
 */

export function getToolsPage(): string {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Diagnostic Hub - Plateforme Unifiée DiagPV</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/diagpv-styles.css" rel="stylesheet">
        <style>
        /* Styles critiques inline pour éviter l'écran noir - VERSION RENFORCÉE */
        * { box-sizing: border-box; }
        html, body { 
            background: #000000 !important; 
            color: #ffffff !important; 
            min-height: 100vh !important;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif !important;
            font-weight: bold !important;
            margin: 0 !important;
            padding: 0 !important;
            line-height: 1.5 !important;
        }
        
        /* Container et layout */
        .container { max-width: 1200px; margin: 0 auto; padding: 24px !important; }
        .grid { display: grid !important; }
        .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)) !important; }
        .gap-6 { gap: 24px !important; }
        .flex { display: flex !important; }
        .items-center { align-items: center !important; }
        .justify-center { justify-content: center !important; }
        .space-x-4 > * + * { margin-left: 16px !important; }
        .mb-4 { margin-bottom: 16px !important; }
        .mb-6 { margin-bottom: 24px !important; }
        .mb-8 { margin-bottom: 32px !important; }
        .p-6 { padding: 24px !important; }
        .p-4 { padding: 16px !important; }
        .px-4 { padding-left: 16px !important; padding-right: 16px !important; }
        .py-3 { padding-top: 12px !important; padding-bottom: 12px !important; }
        .text-center { text-align: center !important; }
        
        /* Couleurs de fond */
        .bg-black { background-color: #000000 !important; }
        .bg-gray-900 { background-color: #111827 !important; }
        .bg-orange-600 { background-color: #ea580c !important; }
        .bg-green-600 { background-color: #16a34a !important; }
        .bg-blue-600 { background-color: #2563eb !important; }
        .bg-purple-600 { background-color: #9333ea !important; }
        
        /* Couleurs de texte */
        .text-white { color: #ffffff !important; }
        .text-yellow-400 { color: #facc15 !important; }
        .text-orange-400 { color: #fb923c !important; }
        .text-green-400 { color: #4ade80 !important; }
        .text-blue-400 { color: #60a5fa !important; }
        .text-gray-300 { color: #d1d5db !important; }
        .text-gray-400 { color: #9ca3af !important; }
        
        /* Bordures */
        .border { border-width: 1px !important; border-style: solid !important; }
        .border-2 { border-width: 2px !important; border-style: solid !important; }
        .border-yellow-400 { border-color: #facc15 !important; }
        .border-orange-400 { border-color: #fb923c !important; }
        .border-gray-600 { border-color: #4b5563 !important; }
        .rounded-lg { border-radius: 8px !important; }
        
        /* Tailles de police */
        .text-xl { font-size: 20px !important; }
        .text-2xl { font-size: 24px !important; }
        .text-3xl { font-size: 30px !important; }
        .text-4xl { font-size: 36px !important; }
        .font-bold { font-weight: bold !important; }
        .font-black { font-weight: 900 !important; }
        
        /* Éléments interactifs */
        button, input, select, textarea {
            padding: 12px 16px !important;
            border: 2px solid #4b5563 !important;
            border-radius: 8px !important;
            background: #000000 !important;
            color: #ffffff !important;
            font-weight: bold !important;
            font-family: inherit !important;
            cursor: pointer !important;
        }
        
        button:hover {
            opacity: 0.8 !important;
            transform: translateY(-1px) !important;
            transition: all 0.2s !important;
        }
        
        input:focus, select:focus, textarea:focus {
            outline: none !important;
            border-color: #facc15 !important;
            box-shadow: 0 0 0 2px rgba(250, 204, 21, 0.2) !important;
        }
        
        /* Responsive */
        @media (min-width: 768px) {
            .md\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
        }
        
        /* Icônes FontAwesome */
        .fa, .fas { font-family: "Font Awesome 6 Free" !important; font-weight: 900 !important; }
        
        /* Classes utilitaires supplémentaires */
        .inline-flex { display: inline-flex !important; }
        .w-full { width: 100% !important; }
        .mr-2 { margin-right: 8px !important; }
        .mr-4 { margin-right: 16px !important; }
        .hidden { display: none !important; }
        
        /* Animation de chargement */
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite !important; }
        
        /* Styles sélection multiple */
        .module-btn.multi-select-mode {
            position: relative !important;
            transition: all 0.2s ease !important;
        }
        .module-btn.multi-select-mode:hover {
            transform: scale(1.05) !important;
            box-shadow: 0 0 10px rgba(250, 204, 21, 0.5) !important;
        }
        .module-btn.selected-for-bulk {
            border: 3px solid #facc15 !important;
            box-shadow: 0 0 15px rgba(250, 204, 21, 0.8) !important;
            transform: scale(1.02) !important;
        }
        .module-btn.selected-for-bulk::after {
            content: "OK" !important;
            position: absolute !important;
            top: -5px !important;
            right: -5px !important;
            background: #facc15 !important;
            color: #000 !important;
            width: 20px !important;
            height: 20px !important;
            border-radius: 50% !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-size: 12px !important;
            font-weight: bold !important;
        }
        #multiSelectToggleBtn.active {
            background-color: #facc15 !important;
            color: #000000 !important;
            transform: scale(1.05) !important;
            box-shadow: 0 0 10px rgba(250, 204, 21, 0.6) !important;
        }
        .bulk-action-btn:hover {
            transform: translateY(-2px) !important;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3) !important;
        }
        body { background: #000 !important; color: #fff !important; min-height: 100vh; font-family: system-ui, -apple-system, sans-serif; font-weight: bold; }
        .container { max-width: 1200px; margin: 0 auto; padding: 24px; }
        .bg-black { background-color: #000 !important; }
        .text-white { color: #fff !important; }
        .text-yellow-400 { color: #facc15 !important; }
        .text-orange-400 { color: #fb923c !important; }
        .text-green-400 { color: #4ade80 !important; }
        .text-blue-400 { color: #60a5fa !important; }
        .bg-gray-900 { background-color: #111827 !important; }
        .bg-orange-600 { background-color: #ea580c !important; }
        .border-yellow-400 { border-color: #facc15 !important; }
        .border-orange-400 { border-color: #fb923c !important; }
        .rounded-lg { border-radius: 8px; }
        .p-6 { padding: 24px; }
        .mb-4 { margin-bottom: 16px; }
        .font-bold { font-weight: bold; }
        .text-2xl { font-size: 24px; }
        .text-xl { font-size: 20px; }
        .flex { display: flex; }
        .items-center { align-items: center; }
        .justify-center { justify-content: center; }
        .space-x-4 > * + * { margin-left: 16px; }
        .grid { display: grid; }
        .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
        @media (min-width: 768px) { .md\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
        .gap-6 { gap: 24px; }
        .border-2 { border-width: 2px; }
        .border { border-width: 1px; }
        button, input { padding: 12px 16px; border: 2px solid #4b5563; border-radius: 8px; background: #000; color: #fff; font-weight: bold; }
        button:hover { opacity: 0.8; }
        .fa, .fas { font-family: "Font Awesome 6 Free"; font-weight: 900; }
        </style>
        <meta name="theme-color" content="#000000">
        <link rel="manifest" href="/manifest.json">
        <script>
          // Enregistrement du Service Worker pour le mode PWA (Offline)
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                  console.log('✅ DiagPV "Mode Terrain" prêt (SW registered):', registration.scope);
                })
                .catch(error => {
                  console.log('❌ Erreur Service Worker:', error);
                });
            });
          }
        </script>
    </head>
    <body class="bg-black text-white min-h-screen font-bold">

        <div class="container mx-auto p-6">
            <!-- En-tête Diagnostic Hub -->
            <header class="mb-8 text-center">
                <div class="inline-flex items-center mb-4">
                    <i class="fas fa-solar-panel text-5xl text-yellow-400 mr-4"></i>
                    <div>
                        <h1 class="text-5xl font-black">DIAGNOSTIC HUB</h1>
                        <p class="text-2xl text-orange-400 mt-2">Plateforme Unifiée DiagPV</p>
                    </div>
                </div>
                <p class="text-xl text-gray-300 mt-4">Tous vos outils d'audit photovoltaïque en un seul endroit</p>
                <p class="text-lg text-blue-400 mt-2">
                    <i class="fas fa-globe mr-2"></i>
                    www.diagnosticphotovoltaique.fr
                </p>
            </header>
            
            <!-- Modules disponibles -->
            <div class="max-w-6xl mx-auto">
                <h2 class="text-3xl font-black mb-8 text-center text-yellow-400">
                    <i class="fas fa-th mr-2"></i>
                    MODULES DISPONIBLES
                </h2>
                
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <!-- Module EL - OPÉRATIONNEL -->
                    <a href="/el" class="bg-gradient-to-br from-green-900 to-green-700 rounded-lg p-8 border-4 border-green-400 hover:scale-105 transition-transform duration-200 shadow-2xl">
                        <div class="text-center">
                            <div class="bg-green-600 w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <i class="fas fa-moon text-4xl text-white"></i>
                            </div>
                            <h3 class="text-2xl font-black mb-2 text-white">MODULE EL</h3>
                            <p class="text-lg text-green-200 mb-3">Électroluminescence</p>
                            <div class="bg-green-500 text-black px-4 py-2 rounded-full font-black text-sm inline-block mb-4">
                                <i class="fas fa-check-circle mr-1"></i> OPÉRATIONNEL
                            </div>
                            <p class="text-sm text-green-100">Audit nocturne EL terrain avec cartographie temps réel</p>
                        </div>
                    </a>
                    
                    <!-- Module PV CARTOGRAPHY - OPÉRATIONNEL -->
                    <a href="/pv/plants" class="bg-gradient-to-br from-purple-900 to-purple-700 rounded-lg p-8 border-4 border-purple-400 hover:scale-105 transition-transform duration-200 shadow-2xl">
                        <div class="text-center">
                            <div class="bg-purple-600 w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <i class="fas fa-solar-panel text-4xl text-white"></i>
                            </div>
                            <h3 class="text-2xl font-black mb-2 text-white">PV CARTOGRAPHY</h3>
                            <p class="text-lg text-purple-200 mb-3">Modélisation Centrales</p>
                            <div class="bg-purple-500 text-black px-4 py-2 rounded-full font-black text-sm inline-block mb-4">
                                <i class="fas fa-check-circle mr-1"></i> OPÉRATIONNEL
                            </div>
                            <p class="text-sm text-purple-100">Cartographie & placement modules photovoltaïques</p>
                        </div>
                    </a>
                    
                    <!-- INSTALLATIONS UNIFIÉES - NOUVEAU -->
                    <a href="/pv/installations" class="bg-gradient-to-br from-blue-900 to-blue-700 rounded-lg p-8 border-4 border-blue-400 hover:scale-105 transition-transform duration-200 shadow-2xl">
                        <div class="text-center">
                            <div class="bg-blue-600 w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <i class="fas fa-th-large text-4xl text-white"></i>
                            </div>
                            <h3 class="text-2xl font-black mb-2 text-white">INSTALLATIONS</h3>
                            <p class="text-lg text-blue-200 mb-3">Vue Unifiée EL + PV</p>
                            <div class="bg-blue-500 text-black px-4 py-2 rounded-full font-black text-sm inline-block mb-4">
                                <i class="fas fa-check-circle mr-1"></i> OPÉRATIONNEL
                            </div>
                            <p class="text-sm text-blue-100">Gestion centralisée audits EL & centrales PV</p>
                        </div>
                    </a>
                    
                    <!-- Module I-V - OPÉRATIONNEL -->
                    <a href="/iv-curves" class="bg-gradient-to-br from-blue-900 to-blue-700 rounded-lg p-8 border-4 border-blue-400 hover:scale-105 transition-transform duration-200 shadow-2xl">
                        <div class="text-center">
                            <div class="bg-blue-600 w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <i class="fas fa-chart-line text-4xl text-white"></i>
                            </div>
                            <h3 class="text-2xl font-black mb-2 text-white">MODULE I-V</h3>
                            <p class="text-lg text-blue-200 mb-3">Courbes I-V</p>
                            <div class="bg-blue-500 text-black px-4 py-2 rounded-full font-black text-sm inline-block mb-4">
                                <i class="fas fa-check-circle mr-1"></i> OPÉRATIONNEL
                            </div>
                            <p class="text-sm text-blue-100">Mesures PVServ - Fill Factor & Résistance Série</p>
                        </div>
                    </a>
                    
                    <!-- Module Thermographie -->
                    <a href="/thermal" class="bg-gradient-to-br from-red-900 to-red-700 rounded-lg p-8 border-4 border-red-400 hover:scale-105 transition-transform duration-200 shadow-2xl">
                        <div class="text-center">
                            <div class="bg-red-600 w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <i class="fas fa-fire text-4xl text-white"></i>
                            </div>
                            <h3 class="text-2xl font-black mb-2 text-white">MODULE THERMIQUE</h3>
                            <p class="text-lg text-red-200 mb-3">Thermographie IR</p>
                            <div class="bg-red-500 text-black px-4 py-2 rounded-full font-black text-sm inline-block mb-4">
                                <i class="fas fa-check-circle mr-1"></i> OPÉRATIONNEL
                            </div>
                            <p class="text-sm text-red-100">Détection points chauds et anomalies thermiques</p>
                        </div>
                    </a>
                    
                    <!-- Module Visuels - OPÉRATIONNEL -->
                    <a href="/visual" class="bg-gradient-to-br from-amber-900 to-amber-700 rounded-lg p-8 border-4 border-amber-400 hover:scale-105 transition-transform duration-200 shadow-2xl">
                        <div class="text-center">
                            <div class="bg-amber-600 w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <i class="fas fa-eye text-4xl text-white"></i>
                            </div>
                            <h3 class="text-2xl font-black mb-2 text-white">MODULE VISUELS</h3>
                            <p class="text-lg text-amber-200 mb-3">Contrôles Visuels</p>
                            <div class="bg-amber-500 text-black px-4 py-2 rounded-full font-black text-sm inline-block mb-4">
                                <i class="fas fa-check-circle mr-1"></i> OPÉRATIONNEL
                            </div>
                            <p class="text-sm text-amber-100">Inspection visuelle IEC 62446-1 & défauts mécaniques</p>
                        </div>
                    </a>
                    
                    <!-- Module Isolation - OPÉRATIONNEL -->
                    <a href="/isolation" class="bg-gradient-to-br from-yellow-900 to-yellow-700 rounded-lg p-8 border-4 border-yellow-400 hover:scale-105 transition-transform duration-200 shadow-2xl">
                        <div class="text-center">
                            <div class="bg-yellow-600 w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <i class="fas fa-bolt text-4xl text-white"></i>
                            </div>
                            <h3 class="text-2xl font-black mb-2 text-white">MODULE ISOLATION</h3>
                            <p class="text-lg text-yellow-200 mb-3">Tests d'Isolation</p>
                            <div class="bg-yellow-500 text-black px-4 py-2 rounded-full font-black text-sm inline-block mb-4">
                                <i class="fas fa-check-circle mr-1"></i> OPÉRATIONNEL
                            </div>
                            <p class="text-sm text-yellow-100">Mesures résistance isolation DC/AC & défauts électriques</p>
                        </div>
                    </a>
                    
                    <!-- Module Expertise Post-Sinistre -->
                    <div class="bg-gradient-to-br from-gray-800 to-gray-700 rounded-lg p-8 border-4 border-gray-500 opacity-75">
                        <div class="text-center">
                            <div class="bg-gray-600 w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <i class="fas fa-gavel text-4xl text-white"></i>
                            </div>
                            <h3 class="text-2xl font-black mb-2 text-white">MODULE EXPERTISE</h3>
                            <p class="text-lg text-gray-300 mb-3">Expertise Post-Sinistre</p>
                            <div class="bg-yellow-500 text-black px-4 py-2 rounded-full font-black text-sm inline-block mb-4">
                                <i class="fas fa-clock mr-1"></i> PROCHAINEMENT
                            </div>
                            <p class="text-sm text-gray-300">Analyse sinistres et rapports experts judiciaires</p>
                        </div>
                    </div>
                </div>
                
                <!-- Accès rapides -->
                <div class="bg-gray-900 rounded-lg p-8 border-2 border-yellow-400">
                    <h2 class="text-2xl font-black mb-6 text-center">
                        <i class="fas fa-rocket mr-2 text-green-400"></i>
                        ACCÈS RAPIDES
                    </h2>
                    <div class="grid md:grid-cols-2 gap-6">
                        <div class="bg-gray-800 rounded-lg p-6 border border-green-400 hover:bg-gray-750 transition-colors">
                            <h3 class="text-xl font-bold mb-3 text-green-400 flex items-center">
                                <i class="fas fa-plus-circle mr-2"></i>
                                NOUVEL AUDIT EL
                            </h3>
                            <p class="text-gray-300 mb-4">Créer un nouvel audit électroluminescence terrain nocturne</p>
                            <a href="/el" class="w-full bg-green-600 hover:bg-green-700 py-3 rounded-lg font-black text-lg transition-colors flex items-center justify-center">
                                <i class="fas fa-moon mr-2"></i>
                                CRÉER AUDIT EL
                            </a>
                        </div>
                        
                        <div class="bg-gray-800 rounded-lg p-6 border border-orange-400 hover:bg-gray-750 transition-colors">
                            <h3 class="text-xl font-bold mb-3 text-orange-400 flex items-center">
                                <i class="fas fa-tachometer-alt mr-2"></i>
                                TABLEAU DE BORD
                            </h3>
                            <p class="text-gray-300 mb-4">Gérez tous vos audits en cours avec mise à jour temps réel</p>
                            <a href="/dashboard" class="w-full bg-orange-600 hover:bg-orange-700 py-3 rounded-lg font-black text-lg transition-colors flex items-center justify-center">
                                <i class="fas fa-chart-line mr-2"></i>
                                ACCÉDER AU DASHBOARD
                            </a>
                        </div>
                        
                        <div class="bg-gray-800 rounded-lg p-6 border border-purple-400 hover:bg-gray-750 transition-colors">
                            <h3 class="text-xl font-bold mb-3 text-purple-400 flex items-center">
                                <i class="fas fa-solar-panel mr-2"></i>
                                PV CARTOGRAPHY
                            </h3>
                            <p class="text-gray-300 mb-4">Modélisez vos centrales PV avec placement précis modules</p>
                            <a href="/pv/plants" class="w-full bg-purple-600 hover:bg-purple-700 py-3 rounded-lg font-black text-lg transition-colors flex items-center justify-center">
                                <i class="fas fa-map mr-2"></i>
                                GÉRER CENTRALES PV
                            </a>
                        </div>
                        
                        <div class="bg-gray-800 rounded-lg p-6 border border-blue-400 hover:bg-gray-750 transition-colors">
                            <h3 class="text-xl font-bold mb-3 text-blue-400 flex items-center">
                                <i class="fas fa-chart-line mr-2"></i>
                                COURBES I-V
                            </h3>
                            <p class="text-gray-300 mb-4">Upload fichiers PVServ et analyse Fill Factor</p>
                            <a href="/iv-curves" class="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-black text-lg transition-colors flex items-center justify-center">
                                <i class="fas fa-bolt mr-2"></i>
                                MESURES I-V
                            </a>
                        </div>
                    </div>
                </div>
                
                <!-- Footer -->
                <div class="mt-12 text-center text-gray-400 text-sm">
                    <p>Diagnostic Hub v1.0 - Architecture Modulaire Unifiée</p>
                    <p class="mt-2">
                        <i class="fas fa-shield-alt mr-1"></i>
                        Conformité IEC 62446-1 | IEC 61215 | NF C 15-100
                    </p>
                </div>
            </div>
        </div>
    </body>
    </html>
  `
}
