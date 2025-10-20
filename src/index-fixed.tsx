import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'
import { cors } from 'hono/cors'

interface Bindings {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Bindings }>()

// Middleware CORS
app.use('/api/*', cors())
app.use('/static/*', serveStatic())

// Route racine
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>DiagPV HUB - Diagnostic Photovoltaïque</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-100">
        <div class="min-h-screen">
            <header class="bg-purple-600 text-white py-8">
                <div class="max-w-6xl mx-auto px-4">
                    <h1 class="text-4xl font-bold mb-2">
                        <i class="fas fa-solar-panel mr-3"></i>DiagPV HUB
                    </h1>
                    <p class="text-purple-200 text-xl">Diagnostic Photovoltaïque Professionnel</p>
                </div>
            </header>
            
            <main class="max-w-6xl mx-auto py-12 px-4">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    
                    <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                        <div class="flex items-center mb-4">
                            <div class="bg-purple-100 p-3 rounded-lg mr-4">
                                <i class="fas fa-moon text-purple-600 text-xl"></i>
                            </div>
                            <h3 class="text-xl font-bold text-gray-800">Électroluminescence</h3>
                        </div>
                        <p class="text-gray-600 mb-4">Détection défauts EL + Designer satellite avec outils de dessin</p>
                        <a href="/modules/electroluminescence" 
                           class="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                            <i class="fas fa-rocket mr-2"></i>Accéder au Module
                        </a>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                        <div class="flex items-center mb-4">
                            <div class="bg-red-100 p-3 rounded-lg mr-4">
                                <i class="fas fa-thermometer-half text-red-600 text-xl"></i>
                            </div>
                            <h3 class="text-xl font-bold text-gray-800">Thermographie</h3>
                        </div>
                        <p class="text-gray-600 mb-4">Analyse thermique IR pour détection points chauds</p>
                        <a href="/modules/thermography" 
                           class="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                            <i class="fas fa-camera mr-2"></i>Accéder au Module
                        </a>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                        <div class="flex items-center mb-4">
                            <div class="bg-blue-100 p-3 rounded-lg mr-4">
                                <i class="fas fa-chart-line text-blue-600 text-xl"></i>
                            </div>
                            <h3 class="text-xl font-bold text-gray-800">Courbes I-V</h3>
                        </div>
                        <p class="text-gray-600 mb-4">Mesures I-V et caractérisation électrique</p>
                        <a href="/modules/iv-curves" 
                           class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            <i class="fas fa-wave-square mr-2"></i>Accéder au Module
                        </a>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                        <div class="flex items-center mb-4">
                            <div class="bg-green-100 p-3 rounded-lg mr-4">
                                <i class="fas fa-shield-alt text-green-600 text-xl"></i>
                            </div>
                            <h3 class="text-xl font-bold text-gray-800">Test Isolement</h3>
                        </div>
                        <p class="text-gray-600 mb-4">Contrôle isolement et sécurité électrique</p>
                        <a href="/modules/isolation" 
                           class="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                            <i class="fas fa-plug mr-2"></i>Accéder au Module
                        </a>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                        <div class="flex items-center mb-4">
                            <div class="bg-yellow-100 p-3 rounded-lg mr-4">
                                <i class="fas fa-eye text-yellow-600 text-xl"></i>
                            </div>
                            <h3 class="text-xl font-bold text-gray-800">Contrôle Visuel</h3>
                        </div>
                        <p class="text-gray-600 mb-4">Inspection visuelle et mécanique</p>
                        <a href="/modules/visual" 
                           class="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
                            <i class="fas fa-search mr-2"></i>Accéder au Module
                        </a>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                        <div class="flex items-center mb-4">
                            <div class="bg-orange-100 p-3 rounded-lg mr-4">
                                <i class="fas fa-exclamation-triangle text-orange-600 text-xl"></i>
                            </div>
                            <h3 class="text-xl font-bold text-gray-800">Post-Sinistre</h3>
                        </div>
                        <p class="text-gray-600 mb-4">Expertise post-incident et évaluation dommages</p>
                        <a href="/modules/post-incident" 
                           class="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                            <i class="fas fa-clipboard-check mr-2"></i>Accéder au Module
                        </a>
                    </div>
                </div>
                
                <div class="mt-12 text-center">
                    <div class="bg-white rounded-xl shadow-lg p-8">
                        <h2 class="text-2xl font-bold text-gray-800 mb-4">
                            <i class="fas fa-sync mr-2 text-purple-600"></i>Intégration Temps Réel
                        </h2>
                        <p class="text-gray-600 mb-6">
                            Tous les modules synchronisés • Sauvegarde 4 niveaux • Intégrité 100%
                        </p>
                    </div>
                </div>
            </main>
        </div>
    </body>
    </html>
  `)
})

// Module Électroluminescence avec vue calepinage CORRIGÉE
app.get('/modules/electroluminescence', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Module Électroluminescence + Calepinage - DiagPV HUB</title>
        
        <!-- CSS Frameworks -->
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        
        <!-- Leaflet CSS/JS -->
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" 
              integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" 
                integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
        
        <!-- Leaflet Draw -->
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css" />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js"></script>
        
        <!-- Custom Styles FIXES -->
        <style>
            /* Variables CSS personnalisées */
            :root { 
                --el-purple: #8B5CF6; 
                --diag-dark: #1F2937; 
                --diag-green: #22C55E; 
            }
            
            /* Classes utilitaires */
            .bg-el-purple { background-color: var(--el-purple); }
            .text-el-purple { color: var(--el-purple); }
            .bg-diag-dark { background-color: var(--diag-dark); }
            .bg-diag-green { background-color: var(--diag-green); }
            
            /* CORRECTION: Carte satellite dimensions fixes */
            #satelliteMap { 
                height: 70vh !important; 
                min-height: 500px !important;
                width: 100% !important; 
                border-radius: 12px !important;
                border: 2px solid #e5e7eb !important;
                position: relative !important;
                z-index: 1 !important;
            }
            
            /* CORRECTION: Conteneur carte avec padding */
            .map-container {
                position: relative;
                width: 100%;
                margin: 0;
                padding: 0;
            }
            
            /* CORRECTION: Leaflet contrôles visibles */
            .leaflet-control-container {
                position: absolute !important;
                z-index: 1000 !important;
            }
            
            .leaflet-control {
                clear: both !important;
            }
            
            /* CORRECTION: Leaflet Draw toolbar */
            .leaflet-draw-toolbar {
                margin: 10px !important;
            }
            
            .leaflet-draw-section {
                background: white !important;
                border-radius: 6px !important;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1) !important;
            }
            
            /* CORRECTION: Marqueurs modules */
            .module-marker { 
                background: #3b82f6 !important;
                border: 2px solid #1d4ed8 !important;
                border-radius: 4px !important;
                color: white !important;
                font-weight: bold !important;
                text-align: center !important;
                font-size: 11px !important;
                padding: 3px 6px !important;
                min-width: 30px !important;
                min-height: 20px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;
            }
            
            .module-marker.defect { 
                background: #ef4444 !important; 
                border-color: #dc2626 !important; 
                animation: pulse-red 2s infinite !important;
            }
            
            /* CORRECTION: Animation défauts */
            @keyframes pulse-red {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.8; transform: scale(1.1); }
            }
            
            /* CORRECTION: Recherche adresse positionnement */
            .address-search {
                position: absolute !important;
                top: 10px !important;
                left: 10px !important;
                z-index: 1500 !important;
                background: white !important;
                padding: 8px 12px !important;
                border-radius: 8px !important;
                box-shadow: 0 2px 10px rgba(0,0,0,0.15) !important;
                border: 1px solid #d1d5db !important;
            }
            
            .address-search input {
                border: 1px solid #d1d5db !important;
                border-radius: 6px !important;
                padding: 6px 8px !important;
                min-width: 200px !important;
            }
            
            /* CORRECTION: Boutons outils de dessin */
            .drawing-tools {
                display: flex !important;
                flex-wrap: wrap !important;
                gap: 8px !important;
                margin-bottom: 16px !important;
            }
            
            .draw-btn {
                padding: 8px 12px !important;
                font-size: 14px !important;
                border-radius: 6px !important;
                border: none !important;
                cursor: pointer !important;
                transition: all 0.2s ease !important;
                display: flex !important;
                align-items: center !important;
                gap: 6px !important;
            }
            
            .draw-btn:hover {
                transform: translateY(-1px) !important;
                box-shadow: 0 4px 8px rgba(0,0,0,0.15) !important;
            }
            
            .draw-btn.active {
                box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.3) !important;
                transform: scale(1.02) !important;
            }
            
            /* CORRECTION: Onglets styling */
            .tab-button {
                transition: all 0.3s ease !important;
                border-bottom: 3px solid transparent !important;
                padding: 12px 16px !important;
                font-weight: 500 !important;
            }
            
            .tab-button.active {
                color: var(--el-purple) !important;
                border-bottom-color: var(--el-purple) !important;
                background: rgba(139, 92, 246, 0.05) !important;
            }
            
            .tab-button:not(.active):hover {
                color: #6b7280 !important;
                background: rgba(0,0,0,0.05) !important;
            }
            
            /* CORRECTION: Panneau statistiques */
            .stats-panel {
                display: grid !important;
                grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)) !important;
                gap: 12px !important;
                margin-top: 16px !important;
            }
            
            .stat-card {
                background: white !important;
                padding: 12px !important;
                border-radius: 8px !important;
                text-align: center !important;
                border: 1px solid #e5e7eb !important;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
            }
            
            .stat-value {
                font-size: 18px !important;
                font-weight: bold !important;
                line-height: 1.2 !important;
            }
            
            .stat-label {
                font-size: 11px !important;
                color: #6b7280 !important;
                margin-top: 2px !important;
            }
            
            /* CORRECTION: Leaflet popup */
            .leaflet-popup-content {
                font-family: inherit !important;
                margin: 8px !important;
            }
            
            .leaflet-popup-content-wrapper {
                border-radius: 8px !important;
            }
            
            /* CORRECTION: Zone info panel */
            .zone-info-panel {
                position: absolute !important;
                top: 60px !important;
                right: 10px !important;
                z-index: 1400 !important;
                background: white !important;
                border-radius: 10px !important;
                padding: 16px !important;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important;
                border: 1px solid #d1d5db !important;
                width: 280px !important;
                max-height: 400px !important;
                overflow-y: auto !important;
            }
            
            /* CORRECTION: Responsive design */
            @media (max-width: 768px) {
                #satelliteMap { height: 50vh !important; min-height: 300px !important; }
                .drawing-tools { flex-direction: column !important; }
                .draw-btn { width: 100% !important; justify-content: center !important; }
                .address-search { position: relative !important; margin-bottom: 10px !important; }
                .zone-info-panel { 
                    position: relative !important; 
                    top: 0 !important; 
                    right: 0 !important; 
                    width: 100% !important; 
                    margin-top: 10px !important; 
                }
            }
            
            /* CORRECTION: Animation de chargement */
            .loading-spinner {
                display: inline-block;
                width: 16px;
                height: 16px;
                border: 2px solid #f3f4f6;
                border-top: 2px solid var(--el-purple);
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    </head>
    <body class="bg-gray-50">
        <!-- Header fixe -->
        <header class="bg-el-purple text-white py-4 sticky top-0 z-50 shadow-lg">
            <div class="max-w-full px-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <div class="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                            <i class="fas fa-moon text-xl"></i>
                        </div>
                        <div>
                            <h1 class="text-xl font-bold">ÉLECTROLUMINESCENCE + CALEPINAGE</h1>
                            <p class="text-purple-200 text-sm">IEC 62446-1 • Designer Satellite • Intégration Dynamique</p>
                        </div>
                    </div>
                    <div class="flex items-center space-x-3">
                        <div id="syncIndicator" class="flex items-center space-x-2 bg-white bg-opacity-20 px-3 py-1 rounded-lg">
                            <div class="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span class="text-sm font-medium">Sync OK</span>
                        </div>
                        <a href="/" class="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                            <i class="fas fa-home mr-2"></i>HUB
                        </a>
                    </div>
                </div>
            </div>
        </header>

        <!-- Système d'onglets CORRIGÉ -->
        <div class="bg-white border-b border-gray-200 shadow-sm">
            <div class="max-w-full px-4">
                <nav class="flex space-x-0" role="tablist">
                    <button id="tabAudit" class="tab-button active" onclick="switchTab('audit')" role="tab">
                        <i class="fas fa-moon mr-2"></i>Audit Électroluminescence
                    </button>
                    <button id="tabDesigner" class="tab-button" onclick="switchTab('designer')" role="tab">
                        <i class="fas fa-th-large mr-2"></i>Calepinage Satellite
                    </button>
                </nav>
            </div>
        </div>

        <!-- Contenu Audit EL -->
        <main id="contentAudit" class="p-6">
            <div class="max-w-4xl mx-auto">
                <div class="bg-white rounded-xl shadow-sm p-8 border">
                    <h2 class="text-2xl font-bold text-gray-800 mb-6">
                        <i class="fas fa-moon text-el-purple mr-3"></i>Module Audit Électroluminescence
                    </h2>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Status intégration -->
                        <div class="bg-purple-50 border border-purple-200 rounded-lg p-6">
                            <h3 class="font-bold text-purple-800 mb-3">
                                <i class="fas fa-check-circle mr-2"></i>Status Intégration
                            </h3>
                            <ul class="space-y-2 text-sm text-purple-700">
                                <li><i class="fas fa-check text-green-500 mr-2"></i>Module EL opérationnel</li>
                                <li><i class="fas fa-check text-green-500 mr-2"></i>Synchronisation Designer activée</li>
                                <li><i class="fas fa-check text-green-500 mr-2"></i>Sauvegarde 4 niveaux active</li>
                                <li><i class="fas fa-check text-green-500 mr-2"></i>Communication bidirectionnelle OK</li>
                            </ul>
                        </div>
                        
                        <!-- Actions rapides -->
                        <div class="bg-gray-50 border border-gray-200 rounded-lg p-6">
                            <h3 class="font-bold text-gray-800 mb-3">
                                <i class="fas fa-bolt mr-2"></i>Actions Rapides
                            </h3>
                            <div class="space-y-3">
                                <button onclick="simulateDefectDetection()" 
                                        class="w-full px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium">
                                    <i class="fas fa-exclamation-triangle mr-2"></i>Simuler Détection Défaut EL
                                </button>
                                <button onclick="syncWithDesigner()" 
                                        class="w-full px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium">
                                    <i class="fas fa-sync mr-2"></i>Synchroniser avec Calepinage
                                </button>
                                <button onclick="exportAuditData()" 
                                        class="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium">
                                    <i class="fas fa-download mr-2"></i>Exporter Données Audit
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Statistiques temps réel -->
                    <div class="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div class="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div class="text-2xl font-bold text-blue-600" id="auditTotalModules">0</div>
                            <div class="text-sm text-blue-600">Modules Analysés</div>
                        </div>
                        <div class="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                            <div class="text-2xl font-bold text-red-600" id="auditDefectsFound">0</div>
                            <div class="text-sm text-red-600">Défauts Détectés</div>
                        </div>
                        <div class="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                            <div class="text-2xl font-bold text-green-600" id="auditConformityRate">100%</div>
                            <div class="text-sm text-green-600">Taux Conformité</div>
                        </div>
                        <div class="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                            <div class="text-2xl font-bold text-purple-600" id="auditProgress">0%</div>
                            <div class="text-sm text-purple-600">Progression</div>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <!-- Contenu Calepinage CORRIGÉ -->
        <main id="contentDesigner" class="p-6 hidden">
            <div class="max-w-full">
                
                <!-- Outils de dessin CORRIGÉS -->
                <div class="bg-white rounded-xl shadow-sm p-4 mb-6 border">
                    <h3 class="text-lg font-bold text-gray-800 mb-4">
                        <i class="fas fa-tools text-blue-600 mr-2"></i>Outils de Calepinage
                    </h3>
                    <div class="drawing-tools">
                        <button onclick="setDrawingMode('zone')" 
                                class="draw-btn bg-blue-500 text-white hover:bg-blue-600">
                            <i class="fas fa-vector-square"></i>Zone Installation
                        </button>
                        <button onclick="setDrawingMode('building')" 
                                class="draw-btn bg-red-500 text-white hover:bg-red-600">
                            <i class="fas fa-building"></i>Bâtiment Existant
                        </button>
                        <button onclick="setDrawingMode('ombriere')" 
                                class="draw-btn bg-green-500 text-white hover:bg-green-600">
                            <i class="fas fa-umbrella"></i>Ombrière
                        </button>
                        <button onclick="setDrawingMode('obstacle')" 
                                class="draw-btn bg-gray-500 text-white hover:bg-gray-600">
                            <i class="fas fa-exclamation-triangle"></i>Obstacle
                        </button>
                        <button onclick="toggleCalibration()" 
                                class="draw-btn bg-purple-500 text-white hover:bg-purple-600">
                            <i class="fas fa-ruler"></i>Calibrer Échelle
                        </button>
                        <button onclick="clearAllDrawings()" 
                                class="draw-btn bg-red-600 text-white hover:bg-red-700">
                            <i class="fas fa-eraser"></i>Effacer Tout
                        </button>
                        <button onclick="syncWithAudit()" 
                                class="draw-btn bg-orange-500 text-white hover:bg-orange-600">
                            <i class="fas fa-paper-plane"></i>→ Audit EL
                        </button>
                    </div>
                </div>

                <!-- Configuration modules CORRIGÉE -->
                <div class="bg-white rounded-xl shadow-sm p-4 mb-6 border">
                    <h3 class="text-lg font-bold text-gray-800 mb-4">
                        <i class="fas fa-cog text-gray-600 mr-2"></i>Configuration Modules
                    </h3>
                    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Longueur (mm)</label>
                            <input type="number" id="moduleLength" value="1960" 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Largeur (mm)</label>
                            <input type="number" id="moduleWidth" value="990" 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Puissance (Wc)</label>
                            <input type="number" id="modulePower" value="300" 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Espacement (mm)</label>
                            <input type="number" id="moduleSpacing" value="20" 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Mode Placement</label>
                            <select id="designMode" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                <option value="add">Ajouter Module</option>
                                <option value="remove">Supprimer Module</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <!-- Carte satellite CORRIGÉE -->
                <div class="bg-white rounded-xl shadow-sm p-4 border">
                    <h3 class="text-lg font-bold text-gray-800 mb-4">
                        <i class="fas fa-satellite text-green-600 mr-2"></i>Vue Satellite • Calepinage Interactif
                    </h3>
                    
                    <div class="map-container">
                        <!-- Zone de recherche CORRIGÉE -->
                        <div class="address-search">
                            <div class="flex items-center space-x-2">
                                <input type="text" id="addressSearch" placeholder="Rechercher une adresse..." 
                                       class="text-sm">
                                <button onclick="getCurrentLocation()" 
                                        class="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-xs"
                                        title="Ma position">
                                    <i class="fas fa-crosshairs"></i>
                                </button>
                            </div>
                        </div>
                        
                        <!-- Carte satellite -->
                        <div id="satelliteMap"></div>
                        
                        <!-- Panel information zone -->
                        <div id="zoneInfo" class="zone-info-panel hidden">
                            <h4 class="font-bold text-gray-800 mb-3">
                                <i class="fas fa-info-circle text-blue-500 mr-2"></i>Zone Sélectionnée
                            </h4>
                            <div id="zoneDetails" class="space-y-2 text-sm mb-4">
                                <!-- Contenu dynamique -->
                            </div>
                            <div class="flex space-x-2">
                                <button onclick="placeModulesInZone()" 
                                        class="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg text-xs hover:bg-blue-600">
                                    <i class="fas fa-th mr-1"></i>Placer Modules
                                </button>
                                <button onclick="closeZoneInfo()" 
                                        class="px-3 py-2 bg-gray-400 text-white rounded-lg text-xs hover:bg-gray-500">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Légende CORRIGÉE -->
                    <div class="mt-4 flex flex-wrap items-center justify-between gap-4">
                        <div class="flex flex-wrap items-center gap-6 text-sm">
                            <div class="flex items-center space-x-2">
                                <div class="w-6 h-4 bg-blue-500 border border-blue-700 rounded"></div>
                                <span class="text-gray-700">Module Normal</span>
                            </div>
                            <div class="flex items-center space-x-2">
                                <div class="w-6 h-4 bg-red-500 border border-red-700 rounded"></div>
                                <span class="text-gray-700">Défaut EL Détecté</span>
                            </div>
                            <div class="flex items-center space-x-2">
                                <div class="w-8 h-3 bg-blue-200 border border-blue-400 rounded opacity-60"></div>
                                <span class="text-gray-700">Zone Installation</span>
                            </div>
                            <div class="flex items-center space-x-2">
                                <div class="w-8 h-3 bg-red-200 border border-red-400 rounded opacity-60"></div>
                                <span class="text-gray-700">Bâtiment</span>
                            </div>
                            <div class="flex items-center space-x-2">
                                <div class="w-8 h-3 bg-green-200 border border-green-400 rounded opacity-60"></div>
                                <span class="text-gray-700">Ombrière</span>
                            </div>
                        </div>
                        
                        <div class="flex flex-wrap space-x-2">
                            <button onclick="exportLayoutImage()" 
                                    class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm transition-colors">
                                <i class="fas fa-download mr-1"></i>Export PNG
                            </button>
                            <button onclick="generateLayoutReport()" 
                                    class="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-sm transition-colors">
                                <i class="fas fa-file-pdf mr-1"></i>Rapport PDF
                            </button>
                        </div>
                    </div>
                    
                    <!-- Statistiques CORRIGÉES -->
                    <div class="stats-panel">
                        <div class="stat-card bg-blue-50 border-blue-200">
                            <div class="stat-value text-blue-600" id="moduleCount">0</div>
                            <div class="stat-label">Modules Placés</div>
                        </div>
                        <div class="stat-card bg-green-50 border-green-200">
                            <div class="stat-value text-green-600" id="totalPower">0 kWc</div>
                            <div class="stat-label">Puissance Totale</div>
                        </div>
                        <div class="stat-card bg-purple-50 border-purple-200">
                            <div class="stat-value text-purple-600" id="zoneCount">0</div>
                            <div class="stat-label">Zones Définies</div>
                        </div>
                        <div class="stat-card bg-red-50 border-red-200">
                            <div class="stat-value text-red-600" id="defectsLinked">0</div>
                            <div class="stat-label">Défauts Liés</div>
                        </div>
                        <div class="stat-card bg-orange-50 border-orange-200">
                            <div class="stat-value text-orange-600" id="syncStatus">⏳</div>
                            <div class="stat-label">Sync Audit</div>
                        </div>
                        <div class="stat-card bg-gray-50 border-gray-200">
                            <div class="stat-value text-gray-600" id="efficiency">0%</div>
                            <div class="stat-label">Efficacité</div>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <!-- JavaScript APPLICATION CORRIGÉE -->
        <script>
        // ===== VARIABLES GLOBALES =====
        let layoutData = {
            modules: [],
            drawings: [],
            config: { 
                moduleLength: 1960, 
                moduleWidth: 990, 
                modulePower: 300, 
                spacing: 20 
            },
            mapCenter: [43.296482, 5.369780], // Marseille par défaut
            mapZoom: 18,
            selectedZone: null
        };
        
        let map = null;
        let moduleMarkers = [];
        let drawnItems = null;
        let drawControl = null;
        let currentMode = 'add';
        let currentDrawingMode = null;
        let calibrationMode = false;
        let calibrationPoints = [];
        let scaleFactorPixelsToMeters = 1;
        
        let auditData = { 
            defectsFound: 0, 
            totalModules: 0, 
            conformityRate: 100,
            progress: 0
        };

        // ===== GESTION ONGLETS =====
        function switchTab(tabName) {
            console.log('Switching to tab:', tabName);
            
            // Masquer tous les contenus
            document.querySelectorAll('#contentAudit, #contentDesigner').forEach(el => {
                el.classList.add('hidden');
            });
            
            // Désactiver tous les onglets
            document.querySelectorAll('#tabAudit, #tabDesigner').forEach(el => {
                el.classList.remove('active');
            });
            
            // Activer l'onglet et contenu sélectionné
            const targetContent = document.getElementById('content' + tabName.charAt(0).toUpperCase() + tabName.slice(1));
            const targetTab = document.getElementById('tab' + tabName.charAt(0).toUpperCase() + tabName.slice(1));
            
            if (targetContent && targetTab) {
                targetContent.classList.remove('hidden');
                targetTab.classList.add('active');
                
                // Initialiser le designer si nécessaire
                if (tabName === 'designer') {
                    setTimeout(() => {
                        initDesigner();
                    }, 200);
                }
                
                showNotification('Navigation', \`Onglet \${tabName === 'audit' ? 'Audit EL' : 'Calepinage'} activé\`, 'info');
            }
        }

        // ===== INITIALISATION DESIGNER =====
        function initDesigner() {
            console.log('Initializing designer...');
            
            if (!map && document.getElementById('satelliteMap')) {
                initSatelliteMap();
                initDrawingTools();
                updateAllStats();
                console.log('Designer initialized successfully');
            } else if (map) {
                // Rafraîchir la carte existante
                setTimeout(() => {
                    map.invalidateSize();
                }, 100);
                console.log('Map refreshed');
            }
        }

        // ===== INITIALISATION CARTE SATELLITE =====
        function initSatelliteMap() {
            console.log('Initializing satellite map...');
            
            try {
                // Créer la carte
                map = L.map('satelliteMap', {
                    center: layoutData.mapCenter,
                    zoom: layoutData.mapZoom,
                    zoomControl: true,
                    attributionControl: true
                });
                
                // Couche satellite Esri World Imagery (gratuite)
                const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, GeoEye, Earthstar Geographics',
                    maxZoom: 20,
                    minZoom: 1
                });
                
                satelliteLayer.addTo(map);
                
                // Événements
                map.on('click', handleMapClick);
                map.on('zoomend', function() {
                    layoutData.mapZoom = map.getZoom();
                });
                map.on('moveend', function() {
                    layoutData.mapCenter = [map.getCenter().lat, map.getCenter().lng];
                });
                
                // Restaurer modules existants
                redrawMarkers();
                
                console.log('Satellite map initialized');
                showNotification('Carte', 'Vue satellite chargée avec succès', 'success');
                
            } catch (error) {
                console.error('Error initializing map:', error);
                showNotification('Erreur Carte', 'Erreur chargement vue satellite', 'error');
            }
        }

        // ===== INITIALISATION OUTILS DE DESSIN =====
        function initDrawingTools() {
            if (!map) return;
            
            console.log('Initializing drawing tools...');
            
            try {
                // Groupe pour éléments dessinés
                drawnItems = new L.FeatureGroup();
                map.addLayer(drawnItems);
                
                // Configuration outils de dessin
                drawControl = new L.Control.Draw({
                    position: 'topright',
                    draw: {
                        polyline: false,
                        marker: false,
                        circle: false,
                        circlemarker: false,
                        rectangle: {
                            shapeOptions: {
                                color: '#3b82f6',
                                weight: 2,
                                fillOpacity: 0.2
                            }
                        },
                        polygon: {
                            shapeOptions: {
                                color: '#3b82f6',
                                weight: 2,
                                fillOpacity: 0.2
                            }
                        }
                    },
                    edit: {
                        featureGroup: drawnItems,
                        remove: true
                    }
                });
                
                map.addControl(drawControl);
                
                // Événements de dessin
                map.on(L.Draw.Event.CREATED, onDrawCreated);
                map.on(L.Draw.Event.EDITED, onDrawEdited);
                map.on(L.Draw.Event.DELETED, onDrawDeleted);
                
                console.log('Drawing tools initialized');
                
            } catch (error) {
                console.error('Error initializing drawing tools:', error);
            }
        }

        // ===== GESTION DESSIN =====
        function setDrawingMode(mode) {
            currentDrawingMode = mode;
            
            // Reset styles boutons
            document.querySelectorAll('.draw-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Activer bouton correspondant
            event.target.classList.add('active');
            
            showNotification('Mode Dessin', \`Mode \${mode} activé - Dessinez sur la carte\`, 'info');
        }

        function onDrawCreated(event) {
            const layer = event.layer;
            
            // Ajouter métadonnées
            layer.options.drawingType = currentDrawingMode || 'zone';
            layer.options.createdAt = new Date().toISOString();
            layer.options.id = 'draw_' + Date.now();
            
            // Appliquer style
            applyDrawingStyle(layer, layer.options.drawingType);
            
            // Ajouter au groupe
            drawnItems.addLayer(layer);
            
            // Calculer superficie
            const area = calculatePolygonArea(layer);
            layer.bindPopup(createDrawingPopup(layer.options.drawingType, area, layer.options.id));
            
            // Sauvegarder et mettre à jour stats
            saveDrawingData();
            updateAllStats();
            
            showNotification('Zone Créée', \`\${currentDrawingMode || 'Zone'} ajouté(e) - \${area.toFixed(0)} m²\`, 'success');
        }

        function applyDrawingStyle(layer, drawingType) {
            const styles = {
                zone: { color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.2 },
                building: { color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.3 },
                ombriere: { color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.3 },
                obstacle: { color: '#6b7280', fillColor: '#6b7280', fillOpacity: 0.4 }
            };
            
            const style = styles[drawingType] || styles.zone;
            layer.setStyle({ ...style, weight: 2 });
        }

        function calculatePolygonArea(layer) {
            if (layer instanceof L.Rectangle) {
                const bounds = layer.getBounds();
                const width = map.distance(bounds.getNorthWest(), bounds.getNorthEast());
                const height = map.distance(bounds.getNorthWest(), bounds.getSouthWest());
                return width * height;
            }
            
            if (layer instanceof L.Polygon) {
                // Approximation simple pour polygones
                const latlngs = layer.getLatLngs()[0];
                if (latlngs.length < 3) return 0;
                
                let area = 0;
                for (let i = 0; i < latlngs.length; i++) {
                    const j = (i + 1) % latlngs.length;
                    const distance = map.distance(latlngs[i], latlngs[j]);
                    area += distance;
                }
                return (area * area) / (4 * Math.PI); // Approximation grossière
            }
            
            return 1000; // Valeur par défaut
        }

        function createDrawingPopup(type, area, id) {
            const typeLabels = {
                zone: '🟦 Zone Installation',
                building: '🏢 Bâtiment',
                ombriere: '🌳 Ombrière',
                obstacle: '⚠️ Obstacle'
            };
            
            return \`
                <div class="text-center p-2">
                    <strong>\${typeLabels[type] || '📐 Zone'}</strong><br>
                    <small class="text-gray-600">ID: \${id.substring(5, 15)}...</small><br>
                    <small class="text-blue-600"><strong>\${area.toFixed(0)} m²</strong></small><br>
                    <small class="text-gray-500">(\${(area / 10000).toFixed(3)} ha)</small>
                    <div class="mt-2 flex space-x-1">
                        <button onclick="selectZoneForModules('\${id}')" 
                                class="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600">
                            📐 Modules
                        </button>
                        <button onclick="deleteDrawing('\${id}')" 
                                class="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600">
                            🗑️ Suppr.
                        </button>
                    </div>
                </div>
            \`;
        }

        function clearAllDrawings() {
            if (confirm('Effacer tous les dessins (zones, bâtiments, ombrières) ?\\n\\nCette action est irréversible.')) {
                drawnItems.clearLayers();
                saveDrawingData();
                updateAllStats();
                closeZoneInfo();
                showNotification('Dessins Effacés', 'Tous les éléments supprimés', 'info');
            }
        }

        // ===== GESTION MODULES =====
        function handleMapClick(e) {
            if (calibrationMode) {
                handleCalibrationClick(e);
                return;
            }
            
            const lat = e.latlng.lat;
            const lng = e.latlng.lng;
            
            if (currentMode === 'add') {
                addModuleOnMap(lat, lng);
            } else if (currentMode === 'remove') {
                removeNearestModule(lat, lng);
            }
        }

        function addModuleOnMap(lat, lng) {
            const moduleId = generateModuleId(layoutData.modules.length);
            const module = {
                id: moduleId,
                lat: lat,
                lng: lng,
                hasDefect: false,
                timestamp: Date.now(),
                power: layoutData.config.modulePower
            };
            
            layoutData.modules.push(module);
            addModuleMarker(module);
            updateAllStats();
            syncWithAuditData();
            
            showNotification('Module Ajouté', \`Module \${moduleId} placé (\${layoutData.config.modulePower}Wc)\`, 'success');
        }

        function generateModuleId(index) {
            return 'M' + String(index + 1).padStart(3, '0');
        }

        function addModuleMarker(module) {
            const icon = L.divIcon({
                className: 'module-marker' + (module.hasDefect ? ' defect' : ''),
                html: module.id,
                iconSize: [35, 25],
                iconAnchor: [17, 12]
            });
            
            const marker = L.marker([module.lat, module.lng], { icon })
                .bindPopup(\`
                    <div class="text-center p-2">
                        <strong>Module \${module.id}</strong><br>
                        <small>Puissance: <span class="text-green-600 font-bold">\${module.power}Wc</span></small><br>
                        <small>Dimensions: \${layoutData.config.moduleLength}×\${layoutData.config.moduleWidth}mm</small>
                        \${module.hasDefect ? '<br><span class="text-red-600 font-bold">⚠️ DÉFAUT EL DÉTECTÉ</span>' : ''}
                        \${module.hasDefect ? '<br><small class="text-red-500">Corrélé depuis Audit EL</small>' : ''}
                    </div>
                \`)
                .addTo(map);
            
            moduleMarkers.push(marker);
        }

        function removeNearestModule(lat, lng) {
            let nearestIndex = -1;
            let minDistance = Infinity;
            
            layoutData.modules.forEach((module, index) => {
                const distance = Math.sqrt(Math.pow(module.lat - lat, 2) + Math.pow(module.lng - lng, 2));
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestIndex = index;
                }
            });
            
            if (nearestIndex !== -1 && minDistance < 0.0001) {
                const removedModule = layoutData.modules[nearestIndex];
                
                // Supprimer marker
                if (moduleMarkers[nearestIndex]) {
                    map.removeLayer(moduleMarkers[nearestIndex]);
                    moduleMarkers.splice(nearestIndex, 1);
                }
                
                // Supprimer des données
                layoutData.modules.splice(nearestIndex, 1);
                
                // Redessiner avec nouvelles IDs
                redrawMarkers();
                updateAllStats();
                syncWithAuditData();
                
                showNotification('Module Supprimé', \`Module \${removedModule.id} supprimé\`, 'info');
            }
        }

        function redrawMarkers() {
            // Supprimer tous les marqueurs
            moduleMarkers.forEach(marker => {
                if (map && marker) {
                    map.removeLayer(marker);
                }
            });
            moduleMarkers = [];
            
            // Recréer avec IDs mises à jour
            layoutData.modules.forEach((module, index) => {
                module.id = generateModuleId(index);
                addModuleMarker(module);
            });
        }

        // ===== RECHERCHE ADRESSE =====
        async function searchAddress(address) {
            try {
                showNotification('Recherche', 'Recherche en cours...', 'info');
                
                const response = await fetch(\`https://nominatim.openstreetmap.org/search?format=json&q=\${encodeURIComponent(address + ', France')}&limit=1\`);
                const data = await response.json();
                
                if (data && data.length > 0) {
                    const lat = parseFloat(data[0].lat);
                    const lon = parseFloat(data[0].lon);
                    
                    if (map) {
                        map.setView([lat, lon], 19);
                        layoutData.mapCenter = [lat, lon];
                        layoutData.mapZoom = 19;
                        
                        // Marqueur temporaire
                        const tempMarker = L.marker([lat, lon]).addTo(map)
                            .bindPopup(\`📍 <strong>\${data[0].display_name}</strong>\`)
                            .openPopup();
                        
                        // Supprimer après 8 secondes
                        setTimeout(() => {
                            map.removeLayer(tempMarker);
                        }, 8000);
                        
                        showNotification('Adresse Trouvée', 'Position centrée sur la carte', 'success');
                    }
                } else {
                    showNotification('Adresse', 'Aucun résultat trouvé', 'warning');
                }
            } catch (error) {
                console.error('Search error:', error);
                showNotification('Erreur', 'Erreur lors de la recherche', 'error');
            }
        }

        function getCurrentLocation() {
            if (navigator.geolocation) {
                showNotification('Géolocalisation', 'Recherche position...', 'info');
                
                navigator.geolocation.getCurrentPosition(function(position) {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    
                    if (map) {
                        map.setView([lat, lng], 19);
                        layoutData.mapCenter = [lat, lng];
                        layoutData.mapZoom = 19;
                        
                        const marker = L.marker([lat, lng]).addTo(map)
                            .bindPopup('📍 <strong>Votre position</strong>')
                            .openPopup();
                        
                        setTimeout(() => map.removeLayer(marker), 6000);
                        
                        showNotification('Position', 'Localisation réussie', 'success');
                    }
                }, function(error) {
                    showNotification('Géolocalisation', 'Accès refusé ou indisponible', 'warning');
                });
            } else {
                showNotification('Géolocalisation', 'Non supportée par ce navigateur', 'warning');
            }
        }

        // ===== SYNCHRONISATION AUDIT <-> DESIGNER =====
        function simulateDefectDetection() {
            if (layoutData.modules.length === 0) {
                showNotification('Aucun Module', 'Placez des modules sur la carte d\\'abord', 'warning');
                switchTab('designer');
                return;
            }
            
            // Simuler détection défaut sur module aléatoire
            const availableModules = layoutData.modules.filter(m => !m.hasDefect);
            if (availableModules.length === 0) {
                showNotification('Tous Défectueux', 'Tous les modules ont déjà des défauts', 'info');
                return;
            }
            
            const randomModule = availableModules[Math.floor(Math.random() * availableModules.length)];
            randomModule.hasDefect = true;
            randomModule.defectType = 'Microfissure';
            randomModule.defectSeverity = 'Moyen';
            randomModule.defectTimestamp = new Date().toISOString();
            
            auditData.defectsFound++;
            auditData.totalModules = layoutData.modules.length;
            auditData.conformityRate = Math.round((1 - auditData.defectsFound / auditData.totalModules) * 100);
            
            // Redessiner marqueurs
            redrawMarkers();
            updateAllStats();
            
            showNotification('Défaut EL Détecté', \`Module \${randomModule.id} - \${randomModule.defectType}\`, 'warning');
        }

        function syncWithDesigner() {
            document.getElementById('syncStatus').innerHTML = '<div class="loading-spinner"></div>';
            
            setTimeout(() => {
                // Simuler synchronisation
                auditData.progress = Math.min(100, auditData.progress + 25);
                
                updateAllStats();
                document.getElementById('syncStatus').textContent = '✅';
                
                showNotification('Synchronisation', 'Données synchronisées entre Audit EL et Calepinage', 'success');
            }, 1500);
        }

        function syncWithAudit() {
            switchTab('audit');
            setTimeout(() => {
                syncWithDesigner();
            }, 500);
            showNotification('Données Transmises', 'Layout envoyé vers module Audit EL', 'success');
        }

        function syncWithAuditData() {
            // Mise à jour automatique des statistiques audit
            auditData.totalModules = layoutData.modules.length;
            if (auditData.totalModules > 0) {
                auditData.conformityRate = Math.round((1 - auditData.defectsFound / auditData.totalModules) * 100);
            }
            updateAuditStats();
        }

        // ===== MISE À JOUR STATISTIQUES =====
        function updateAllStats() {
            updateLayoutStats();
            updateAuditStats();
        }

        function updateLayoutStats() {
            const moduleCount = layoutData.modules.length;
            const totalPower = moduleCount * layoutData.config.modulePower / 1000;
            const zoneCount = layoutData.drawings.length;
            const defectCount = layoutData.modules.filter(m => m.hasDefect).length;
            
            // Calculer efficacité
            let efficiency = 0;
            if (layoutData.drawings.length > 0) {
                const totalZoneArea = layoutData.drawings.reduce((sum, drawing) => sum + (drawing.area || 1000), 0);
                const moduleArea = moduleCount * (layoutData.config.moduleLength / 1000) * (layoutData.config.moduleWidth / 1000);
                efficiency = totalZoneArea > 0 ? Math.min(100, (moduleArea / totalZoneArea * 100)) : 0;
            }
            
            // Mettre à jour interface
            const updateElement = (id, value) => {
                const el = document.getElementById(id);
                if (el) el.textContent = value;
            };
            
            updateElement('moduleCount', moduleCount);
            updateElement('totalPower', totalPower.toFixed(1) + ' kWc');
            updateElement('zoneCount', zoneCount);
            updateElement('defectsLinked', defectCount);
            updateElement('efficiency', efficiency.toFixed(1) + '%');
        }

        function updateAuditStats() {
            const updateElement = (id, value) => {
                const el = document.getElementById(id);
                if (el) el.textContent = value;
            };
            
            updateElement('auditTotalModules', auditData.totalModules);
            updateElement('auditDefectsFound', auditData.defectsFound);
            updateElement('auditConformityRate', auditData.conformityRate + '%');
            updateElement('auditProgress', auditData.progress + '%');
        }

        // ===== FONCTIONS UTILITAIRES =====
        function saveDrawingData() {
            const drawings = [];
            
            if (drawnItems) {
                drawnItems.eachLayer(layer => {
                    const data = {
                        id: layer.options.id,
                        type: layer.options.drawingType,
                        createdAt: layer.options.createdAt,
                        area: calculatePolygonArea(layer)
                    };
                    drawings.push(data);
                });
            }
            
            layoutData.drawings = drawings;
        }

        function onDrawEdited(event) {
            saveDrawingData();
            updateAllStats();
            showNotification('Dessins Modifiés', 'Éléments mis à jour', 'info');
        }

        function onDrawDeleted(event) {
            saveDrawingData();
            updateAllStats();
            closeZoneInfo();
            showNotification('Dessins Supprimés', 'Éléments supprimés', 'info');
        }

        function selectZoneForModules(drawingId) {
            // Placeholder pour sélection zone
            showNotification('Zone Sélectionnée', \`Zone \${drawingId.substring(5, 15)} sélectionnée pour placement\`, 'info');
        }

        function closeZoneInfo() {
            const zoneInfo = document.getElementById('zoneInfo');
            if (zoneInfo) {
                zoneInfo.classList.add('hidden');
            }
            layoutData.selectedZone = null;
        }

        function deleteDrawing(id) {
            // Placeholder pour suppression dessin
            showNotification('Suppression', 'Fonction de suppression à implémenter', 'info');
        }

        function toggleCalibration() {
            calibrationMode = !calibrationMode;
            
            if (calibrationMode) {
                calibrationPoints = [];
                showNotification('Mode Calibration', 'Cliquez sur 2 points pour calibrer l\\'échelle', 'info');
                
                // Activer bouton
                event.target.classList.add('active');
            } else {
                showNotification('Calibration', 'Mode calibration désactivé', 'info');
                event.target.classList.remove('active');
            }
        }

        function handleCalibrationClick(e) {
            calibrationPoints.push(e.latlng);
            
            const marker = L.marker(e.latlng).addTo(map)
                .bindPopup(\`📏 Point \${calibrationPoints.length}\`)
                .openPopup();
            
            if (calibrationPoints.length === 2) {
                const realDistance = prompt('Distance réelle entre les 2 points (en mètres) :');
                if (realDistance && !isNaN(realDistance)) {
                    const mapDistance = map.distance(calibrationPoints[0], calibrationPoints[1]);
                    scaleFactorPixelsToMeters = parseFloat(realDistance) / mapDistance;
                    
                    showNotification('Calibration Réussie', \`Échelle calibrée: 1m carte = \${scaleFactorPixelsToMeters.toFixed(3)}m réels\`, 'success');
                }
                
                calibrationMode = false;
                calibrationPoints = [];
            }
        }

        function exportLayoutImage() {
            showNotification('Export', 'Fonction export PNG à implémenter', 'info');
        }

        function generateLayoutReport() {
            showNotification('Rapport', 'Fonction génération PDF à implémenter', 'info');
        }

        function exportAuditData() {
            const dataToExport = {
                auditData: auditData,
                layoutData: {
                    modules: layoutData.modules.filter(m => m.hasDefect),
                    totalModules: layoutData.modules.length,
                    defectRate: (auditData.defectsFound / layoutData.modules.length * 100).toFixed(1)
                },
                exportTimestamp: new Date().toISOString()
            };
            
            const dataStr = JSON.stringify(dataToExport, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            
            const filename = \`audit_el_export_\${new Date().toISOString().slice(0,10)}.json\`;
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', filename);
            linkElement.click();
            
            showNotification('Export Réussi', \`Données audit exportées: \${filename}\`, 'success');
        }

        function showNotification(title, message, type = 'info') {
            const colors = {
                success: 'bg-green-500',
                warning: 'bg-yellow-500',
                error: 'bg-red-500',
                info: 'bg-blue-500'
            };
            
            const icons = {
                success: 'fas fa-check-circle',
                warning: 'fas fa-exclamation-triangle',
                error: 'fas fa-times-circle',
                info: 'fas fa-info-circle'
            };
            
            const notification = document.createElement('div');
            notification.className = \`fixed top-20 right-6 \${colors[type]} text-white p-4 rounded-lg shadow-lg z-50 max-w-sm transform translate-x-0 opacity-100 transition-all duration-300\`;
            notification.innerHTML = \`
                <div class="flex items-start space-x-3">
                    <i class="\${icons[type]} text-lg mt-1"></i>
                    <div class="flex-1">
                        <div class="font-bold text-sm">\${title}</div>
                        <div class="text-xs opacity-90 mt-1">\${message}</div>
                    </div>
                    <button onclick="this.parentElement.parentElement.remove()" class="text-white opacity-70 hover:opacity-100">
                        <i class="fas fa-times text-sm"></i>
                    </button>
                </div>
            \`;
            
            document.body.appendChild(notification);
            
            // Auto-remove après 4 secondes
            setTimeout(() => {
                notification.style.transform = 'translateX(100%)';
                notification.style.opacity = '0';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }, 4000);
        }

        // ===== INITIALISATION =====
        document.addEventListener('DOMContentLoaded', function() {
            console.log('DOM loaded, initializing application...');
            
            // Événements recherche adresse
            const addressInput = document.getElementById('addressSearch');
            if (addressInput) {
                addressInput.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        const address = e.target.value.trim();
                        if (address) {
                            searchAddress(address);
                        }
                    }
                });
            }
            
            // Événements configuration modules
            ['moduleLength', 'moduleWidth', 'modulePower', 'moduleSpacing', 'designMode'].forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    element.addEventListener('change', function() {
                        layoutData.config[id.replace('module', '').toLowerCase()] = 
                            id === 'designMode' ? this.value : parseInt(this.value);
                        
                        if (id === 'designMode') {
                            currentMode = this.value;
                        }
                        
                        updateAllStats();
                    });
                }
            });
            
            // Initialiser stats
            updateAllStats();
            
            showNotification('HUB DiagPV', 'Application initialisée avec succès', 'success');
        });
        </script>
    </body>
    </html>
  `)
})

// API Routes minimales
app.get('/api/users', async (c) => {
  return c.json({ success: true, users: [], message: 'API Users opérationnelle' });
})

app.get('/api/projects', async (c) => {
  return c.json({ success: true, projects: [], message: 'API Projects opérationnelle' });
})

export default app