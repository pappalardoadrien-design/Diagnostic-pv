/**
 * EL Audit Terrain - Interface nocturne collaborative
 * Extrait de index.tsx le 2026-02-20 (refactoring)
 * ~590 lignes - Page audit terrain EL
 */

export function getElAuditTerrainPage(token: string): string {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
        <title>DiagPV Audit EL - ${token.substring(0, 8)}</title>
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
    </head>
    <body class="bg-black text-white min-h-screen font-bold overflow-x-auto" data-audit-token="${token}">
        <!-- En-tête audit -->
        <header class="sticky top-0 bg-black border-b-2 border-yellow-400 p-4 z-50">
            <div class="flex flex-wrap items-center justify-between">
                <div class="flex items-center space-x-4">
                    <a href="/" class="text-yellow-400 hover:text-yellow-300" title="Retour à l'accueil">
                        <i class="fas fa-home text-2xl"></i>
                    </a>
                    <i class="fas fa-moon text-2xl text-yellow-400"></i>
                    <div>
                        <div class="flex items-center space-x-2">
                            <h1 id="projectTitle" class="text-xl font-black">Chargement...</h1>
                            <button id="editAuditBtn" class="text-orange-400 hover:text-orange-300 p-1" title="Modifier l'audit">
                                <i class="fas fa-edit text-lg"></i>
                            </button>
                        </div>
                        <div class="flex items-center space-x-4 text-sm">
                            <span>Progression: <span id="progress" class="text-green-400 font-black">0/0</span></span>
                            <span>Techniciens: <span id="technicians" class="text-blue-400">0/4</span></span>
                            <span id="technicianIcons"></span>
                        </div>
                    </div>
                </div>
                
                <div class="flex space-x-2 flex-wrap">
                    <a href="/dashboard" class="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded font-bold flex items-center border-2 border-orange-400 shadow-lg" title="Accéder au tableau de bord - Vue d'ensemble audits">
                        <i class="fas fa-tachometer-alt mr-2 text-lg"></i>TABLEAU DE BORD
                    </a>
                    <a href="/audit/${token}/photos" class="bg-pink-600 hover:bg-pink-700 px-4 py-2 rounded font-bold flex items-center border-2 border-pink-400 shadow-lg" title="Upload et analyse IA des photos EL">
                        <i class="fas fa-camera mr-2 text-lg"></i>PHOTOS EL
                    </a>
                    <button id="pvCartoBtn" class="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded font-bold flex items-center" style="display:none;" title="Cartographie PV de cette centrale">
                        <i class="fas fa-solar-panel mr-1"></i>PV CARTO
                    </button>
                    <a href="/pv/plants" class="bg-purple-500 hover:bg-purple-600 px-4 py-2 rounded font-bold flex items-center" title="Liste toutes centrales PV">
                        <i class="fas fa-list mr-1"></i>CENTRALES
                    </a>
                    <button id="multiSelectToggleBtn" class="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded font-bold border-2 border-yellow-400" title="Activer la sélection multiple pour gagner du temps sur les modules défectueux">
                        <i class="fas fa-check-square mr-1"></i>SÉLECTION MULTIPLE
                    </button>
                    <button id="configBtn" class="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded font-bold" title="Modifier configuration technique (strings, BJ, onduleurs)">
                        <i class="fas fa-cog mr-1"></i>CONFIG
                    </button>
                    <button id="measureBtn" class="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded font-bold">
                        <i class="fas fa-chart-line mr-1"></i>MESURES
                    </button>
                    <button id="reportBtn" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-bold">
                        <i class="fas fa-file-pdf mr-1"></i>RAPPORT
                    </button>
                    <button id="shareBtn" class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-bold">
                        <i class="fas fa-share mr-1"></i>PARTAGE
                    </button>
                </div>
            </div>
        </header>
        
        <!-- Navigation strings -->
        <nav class="bg-gray-900 p-4 border-b border-gray-600 overflow-x-auto">
            <div id="stringNavigation" class="flex space-x-2 min-w-max">
                <!-- Navigation dynamique des strings -->
            </div>
        </nav>
        
        <!-- Zone principale audit -->
        <main class="p-4">
            <!-- Barre d'outils sélection multiple -->
            <div id="multiSelectToolbar" class="hidden bg-orange-900 border-2 border-orange-400 rounded-lg p-4 mb-4 sticky top-20 z-40">
                <div class="flex flex-wrap items-center justify-between gap-4">
                    <div class="flex items-center space-x-4">
                        <button id="exitMultiSelectBtn" class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-bold text-sm" title="Quitter le mode sélection">
                            <i class="fas fa-times mr-1"></i>QUITTER
                        </button>
                        <button id="selectAllBtn" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-bold text-sm" title="Sélectionner tous les modules visibles">
                            <i class="fas fa-check-double mr-1"></i>TOUT
                        </button>
                        <button id="clearSelectionBtn" class="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded font-bold text-sm" title="Désélectionner tout">
                            <i class="fas fa-times-circle mr-1"></i>AUCUN
                        </button>
                    </div>
                    
                    <div class="flex items-center space-x-2">
                        <span class="text-sm">Sélectionnés:</span>
                        <span id="selectedCount" class="bg-black px-3 py-1 rounded font-black text-yellow-400">0</span>
                    </div>
                </div>
                
                <!-- Actions de lot -->
                <div class="mt-4 pt-4 border-t border-orange-400">
                    <div class="grid grid-cols-2 md:grid-cols-6 gap-2">
                        <button class="bulk-action-btn bg-green-600 hover:bg-green-700 p-2 rounded font-bold text-sm" data-status="ok" title="Marquer comme OK">
                            OK
                        </button>
                        <button class="bulk-action-btn bg-yellow-600 hover:bg-yellow-700 p-2 rounded font-bold text-sm" data-status="inequality" title="Marquer comme inégalité">
                            Inegalite
                        </button>
                        <button class="bulk-action-btn bg-orange-600 hover:bg-orange-700 p-2 rounded font-bold text-sm" data-status="microcracks" title="Marquer comme microfissures">
                            Fissures
                        </button>
                        <button class="bulk-action-btn bg-red-600 hover:bg-red-700 p-2 rounded font-bold text-sm" data-status="dead" title="Marquer comme HS">
                            Impact Cellulaire
                        </button>
                        <button class="bulk-action-btn bg-blue-600 hover:bg-blue-700 p-2 rounded font-bold text-sm" data-status="string_open" title="Marquer comme string ouvert">
                            String
                        </button>
                        <button class="bulk-action-btn bg-gray-600 hover:bg-gray-700 p-2 rounded font-bold text-sm" data-status="not_connected" title="Marquer comme non raccordé">
                            Non raccorde
                        </button>
                    </div>
                </div>
            </div>
            
            <div id="auditContent">
                <!-- Contenu dynamique de l'audit -->
            </div>
        </main>
        
        <!-- Modal diagnostic module -->
        <div id="moduleModal" class="hidden fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
            <div class="bg-gray-900 border-2 border-yellow-400 rounded-lg p-6 max-w-md w-full">
                <h3 id="modalTitle" class="text-xl font-black mb-4 text-center">MODULE M000</h3>
                
                <div class="grid grid-cols-2 gap-3 mb-4">
                    <button class="module-status-btn bg-green-600 hover:bg-green-700 p-3 rounded font-bold" data-status="ok">
                        ✅ OK<br><span class="text-sm font-normal">Aucun défaut détecté</span>
                    </button>
                    <button class="module-status-btn bg-yellow-600 hover:bg-yellow-700 p-3 rounded font-bold" data-status="inequality">
                        ⚠️ Inégalité<br><span class="text-sm font-normal">Qualité cellules</span>
                    </button>
                    <button class="module-status-btn bg-orange-600 hover:bg-orange-700 p-3 rounded font-bold" data-status="microcracks">
                        🔶 Microfissures<br><span class="text-sm font-normal">Visibles EL</span>
                    </button>
                    <button class="module-status-btn bg-red-600 hover:bg-red-700 p-3 rounded font-bold" data-status="dead">
                        ❌ HS Impact Cell.<br><span class="text-sm font-normal">Défaut cellulaire majeur</span>
                    </button>
                    <button class="module-status-btn bg-blue-600 hover:bg-blue-700 p-3 rounded font-bold" data-status="string_open">
                        🔗 String ouvert<br><span class="text-sm font-normal">Sous-string ouvert</span>
                    </button>
                    <button class="module-status-btn bg-purple-600 hover:bg-purple-700 p-3 rounded font-bold" data-status="not_connected">
                        🚫 Non raccordé<br><span class="text-sm font-normal">Non connecté</span>
                    </button>
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-bold mb-2">Commentaire (optionnel) :</label>
                    <div class="relative">
                        <input type="text" id="moduleComment" 
                               class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2 pr-12 text-lg focus:border-yellow-400 focus:outline-none"
                               placeholder="Détails du défaut...">
                    </div>
                </div>
                
                <div class="flex space-x-3 relative">
                    <button id="validateBtn" class="flex-1 bg-green-600 hover:bg-green-700 py-3 rounded font-black">
                        VALIDER
                    </button>
                    <!-- Bouton microphone -->
                    <button type="button" id="voiceBtn" class="w-14 h-14 bg-blue-600 hover:bg-blue-700 rounded-full font-black flex items-center justify-center shadow-lg border-2 border-blue-400" title="Dictée vocale">
                        <i class="fas fa-microphone text-xl"></i>
                    </button>
                    <button id="cancelBtn" class="flex-1 bg-gray-600 hover:bg-gray-700 py-3 rounded font-black">
                        ANNULER
                    </button>
                </div>
                
                <!-- Indicateur d'enregistrement vocal -->
                <div id="voiceIndicator" class="hidden mt-3 text-center">
                    <div class="inline-flex items-center space-x-2 bg-red-600 px-4 py-2 rounded-full animate-pulse">
                        <i class="fas fa-circle text-xs"></i>
                        <span class="font-bold">Écoute en cours...</span>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Modal édition audit -->
        <div id="editAuditModal" class="hidden fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
            <div class="bg-gray-900 border-2 border-orange-400 rounded-lg p-6 max-w-lg w-full">
                <h3 class="text-xl font-black mb-4 text-center text-orange-400">
                    <i class="fas fa-edit mr-2"></i>MODIFIER L'AUDIT
                </h3>
                
                <form id="editAuditForm" class="space-y-4">
                    <div>
                        <label class="block text-sm font-bold mb-2">Nom du projet :</label>
                        <input type="text" id="editProjectName" required 
                               class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2 text-lg focus:border-orange-400 focus:outline-none">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-bold mb-2">Client :</label>
                        <input type="text" id="editClientName" required 
                               class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2 text-lg focus:border-orange-400 focus:outline-none">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-bold mb-2">Localisation :</label>
                        <input type="text" id="editLocation" required 
                               class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2 text-lg focus:border-orange-400 focus:outline-none">
                    </div>
                    
                    <div class="flex space-x-3 pt-4">
                        <button type="submit" class="flex-1 bg-orange-600 hover:bg-orange-700 py-3 rounded font-black">
                            <i class="fas fa-save mr-2"></i>SAUVEGARDER
                        </button>
                        <button type="button" id="cancelEditBtn" class="flex-1 bg-gray-600 hover:bg-gray-700 py-3 rounded font-black">
                            ANNULER
                        </button>
                    </div>
                </form>
            </div>
        </div>
        
        <!-- Modal configuration technique -->
        <div id="configModal" class="hidden fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
            <div class="bg-gray-900 border-2 border-purple-400 rounded-lg p-6 max-w-2xl w-full max-h-screen overflow-y-auto">
                <h3 class="text-xl font-black mb-4 text-center text-purple-400">
                    <i class="fas fa-cog mr-2"></i>CONFIGURATION TECHNIQUE
                </h3>
                
                <div class="bg-yellow-900 border border-yellow-400 rounded p-3 mb-4">
                    <p class="text-sm text-yellow-200">
                        <i class="fas fa-exclamation-triangle mr-2"></i>
                        <strong>ATTENTION :</strong> Modifier la configuration en cours d'audit peut affecter vos données.
                        Soyez sûr des valeurs entrées.
                    </p>
                </div>
                
                <form id="configForm" class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-bold mb-2">Nombre de strings :</label>
                            <input type="number" id="configStringCount" min="1" max="50"
                                   class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2 text-lg focus:border-purple-400 focus:outline-none">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-bold mb-2">Puissance panneau (Wc) :</label>
                            <input type="number" id="configPanelPower" min="100" max="1000"
                                   class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2 text-lg focus:border-purple-400 focus:outline-none">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-bold mb-2">Boîtes de jonction (BJ) :</label>
                            <input type="number" id="configJunctionBoxes" min="0" max="100"
                                   class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2 text-lg focus:border-purple-400 focus:outline-none">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-bold mb-2">Nombre d'onduleurs :</label>
                            <input type="number" id="configInverterCount" min="1" max="50"
                                   class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2 text-lg focus:border-purple-400 focus:outline-none">
                        </div>
                    </div>
                    
                    <div class="border-t-2 border-gray-700 pt-4 mt-4">
                        <h4 class="text-lg font-black mb-3 text-purple-400">
                            <i class="fas fa-plus-circle mr-2"></i>AJOUTER UN STRING
                        </h4>
                        
                        <div class="bg-gray-800 rounded p-4 space-y-3">
                            <div class="grid grid-cols-3 gap-3">
                                <div>
                                    <label class="block text-xs font-bold mb-1">N° String :</label>
                                    <input type="number" id="addStringNumber" min="1" max="50" placeholder="Ex: 11"
                                           class="w-full bg-black border-2 border-gray-600 rounded px-2 py-2 text-lg focus:border-purple-400 focus:outline-none">
                                </div>
                                
                                <div>
                                    <label class="block text-xs font-bold mb-1">Nb modules :</label>
                                    <input type="number" id="addStringModuleCount" min="1" max="100" placeholder="Ex: 24"
                                           class="w-full bg-black border-2 border-gray-600 rounded px-2 py-2 text-lg focus:border-purple-400 focus:outline-none">
                                </div>
                                
                                <div>
                                    <label class="block text-xs font-bold mb-1">Début :</label>
                                    <input type="number" id="addStringStartPos" min="1" max="100" value="1"
                                           class="w-full bg-black border-2 border-gray-600 rounded px-2 py-2 text-lg focus:border-purple-400 focus:outline-none">
                                </div>
                            </div>
                            
                            <button type="button" id="addStringBtn" class="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded font-bold">
                                <i class="fas fa-plus mr-2"></i>AJOUTER CE STRING
                            </button>
                            
                            <div id="addedStringsList" class="text-sm text-green-400 hidden">
                                <!-- Liste des strings ajoutés -->
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex space-x-3 pt-4">
                        <button type="submit" class="flex-1 bg-purple-600 hover:bg-purple-700 py-3 rounded font-black">
                            <i class="fas fa-save mr-2"></i>SAUVEGARDER CONFIGURATION
                        </button>
                        <button type="button" id="cancelConfigBtn" class="flex-1 bg-gray-600 hover:bg-gray-700 py-3 rounded font-black">
                            ANNULER
                        </button>
                    </div>
                </form>
            </div>
        </div>
        
        <!-- Modal confirmation sélection multiple -->
        <div id="bulkActionModal" class="hidden fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
            <div class="bg-gray-900 border-2 border-yellow-400 rounded-lg p-6 max-w-lg w-full">
                <h3 class="text-xl font-black mb-4 text-center text-yellow-400">
                    <i class="fas fa-exclamation-triangle mr-2"></i>CONFIRMATION SÉLECTION MULTIPLE
                </h3>
                
                <div class="bg-gray-800 border border-orange-400 rounded p-4 mb-4">
                    <p class="text-center mb-2">Vous allez modifier <span id="bulkCount" class="text-yellow-400 font-black">0</span> modules :</p>
                    <div id="bulkModulesList" class="text-sm text-gray-300 max-h-32 overflow-y-auto">
                        <!-- Liste des modules sélectionnés -->
                    </div>
                </div>
                
                <div class="bg-gray-800 border border-green-400 rounded p-4 mb-4">
                    <p class="text-center">
                        Nouveau statut : <span id="bulkNewStatus" class="font-black text-green-400">OK</span>
                    </p>
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-bold mb-2">Commentaire pour tous (optionnel) :</label>
                    <input type="text" id="bulkComment" 
                           class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2 text-lg focus:border-yellow-400 focus:outline-none"
                           placeholder="Ex: Modules cassés lors passage EL...">
                </div>
                
                <div class="flex space-x-3">
                    <button id="confirmBulkBtn" class="flex-1 bg-green-600 hover:bg-green-700 py-3 rounded font-black">
                        <i class="fas fa-check mr-2"></i>CONFIRMER
                    </button>
                    <button id="cancelBulkBtn" class="flex-1 bg-gray-600 hover:bg-gray-700 py-3 rounded font-black">
                        ANNULER
                    </button>
                </div>
            </div>
        </div>
        
        <script src="/static/diagpv-audit.js?v=20251104-2"></script>
        <script src="/static/diagpv-measures.js?v=20251104-2"></script>
        <script>
        // ============================================================================
        // Interconnexion Module EL  PV Carto
        // ============================================================================
        const AUDIT_TOKEN = '${token}'
        
        async function loadPlantLink() {
            const btn = document.getElementById('pvCartoBtn')
            if (!btn) return
            
            try {
                const response = await fetch(\`/api/interconnect/audit/\${AUDIT_TOKEN}/plant\`)
                const data = await response.json()
                
                if (data.linked && data.plant) {
                    btn.style.display = 'flex'
                    btn.onclick = () => {
                        window.location.href = \`/pv/plant/\${data.plant.plant_id}\`
                    }
                    btn.title = \`Cartographie PV: \${data.plant.plant_name || 'Centrale liée'}\`
                    console.log("✅ Centrale PV liée:", data.plant.plant_name)
                } else {
                    btn.style.display = 'flex'
                    btn.onclick = () => {
                        window.location.href = \`/api/pv/el-audit/\${AUDIT_TOKEN}/quick-map\`
                    }
                    btn.title = "Créer cartographie PV depuis cet audit EL"
                    console.log("ℹ️ Bouton Quick-Map activé")
                }
            } catch (error) {
                btn.style.display = 'flex'
                btn.onclick = () => {
                    window.location.href = \`/api/pv/el-audit/\${AUDIT_TOKEN}/quick-map\`
                }
                btn.title = "Créer cartographie PV depuis cet audit EL"
                console.log("ℹ️ Bouton Quick-Map activé (fallback)")
            }
        }
        
        // Charger lien après initialisation
        window.addEventListener('DOMContentLoaded', () => {
            setTimeout(loadPlantLink, 500)
        })
        <\/script>
    </body>
    </html>
  `
}
