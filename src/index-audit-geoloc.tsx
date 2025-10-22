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
                        <p class="text-gray-600 mb-4">Audit EL + Géolocalisation terrain + Calepinage automatique</p>
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
                            Géolocalisation terrain • Calepinage automatique • Audit EL intégré
                        </p>
                    </div>
                </div>
            </main>
        </div>
    </body>
    </html>
  `)
})

// Module Électroluminescence avec géolocalisation intégrée STYLE SOLAREDGE
app.get('/modules/electroluminescence', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Audit EL + Géolocalisation Terrain - DiagPV HUB</title>
        
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
        
        <!-- Custom Styles SOLAREDGE INSPIRED -->
        <style>
            /* Variables CSS */
            :root { 
                --el-purple: #8B5CF6; 
                --solar-orange: #FF6B35;
                --solar-blue: #1E40AF;
                --diag-dark: #1F2937; 
                --diag-green: #22C55E; 
            }
            
            /* Layout principal */
            .main-container {
                display: grid;
                grid-template-columns: 300px 1fr;
                height: calc(100vh - 80px);
                gap: 0;
            }
            
            /* PANEL AUDIT EL (gauche) */
            .audit-panel {
                background: #f8fafc;
                border-right: 1px solid #e2e8f0;
                overflow-y: auto;
                padding: 20px;
            }
            
            /* CARTE TERRAIN (droite) */
            .terrain-panel {
                background: #ffffff;
                position: relative;
                overflow: hidden;
            }
            
            #terrainMap {
                height: 100% !important;
                width: 100% !important;
            }
            
            /* BARRE RECHERCHE ADRESSE (style SolarEdge) */
            .address-bar {
                position: absolute;
                top: 20px;
                left: 20px;
                right: 20px;
                z-index: 1000;
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                border: 1px solid #e2e8f0;
            }
            
            .address-input {
                width: 100%;
                padding: 16px 20px;
                border: none;
                border-radius: 12px;
                font-size: 16px;
                background: transparent;
                outline: none;
            }
            
            .address-input::placeholder {
                color: #94a3b8;
                font-weight: 500;
            }
            
            .search-btn {
                position: absolute;
                right: 8px;
                top: 50%;
                transform: translateY(-50%);
                background: var(--solar-orange);
                color: white;
                border: none;
                border-radius: 8px;
                padding: 8px 12px;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .search-btn:hover {
                background: #e55a2b;
                transform: translateY(-50%) scale(1.05);
            }
            
            /* PANEL OUTILS CALEPINAGE */
            .tools-panel {
                position: absolute;
                top: 90px;
                left: 20px;
                z-index: 1000;
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                padding: 16px;
                border: 1px solid #e2e8f0;
            }
            
            .tool-section {
                margin-bottom: 16px;
                padding-bottom: 16px;
                border-bottom: 1px solid #f1f5f9;
            }
            
            .tool-section:last-child {
                margin-bottom: 0;
                padding-bottom: 0;
                border-bottom: none;
            }
            
            .tool-title {
                font-weight: 600;
                font-size: 14px;
                color: var(--diag-dark);
                margin-bottom: 12px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .tool-buttons {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .tool-btn {
                padding: 10px 12px;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                background: white;
                color: #475569;
                font-size: 13px;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                gap: 8px;
                min-width: 180px;
            }
            
            .tool-btn:hover {
                border-color: var(--solar-orange);
                color: var(--solar-orange);
                transform: translateX(2px);
            }
            
            .tool-btn.active {
                background: var(--solar-orange);
                color: white;
                border-color: var(--solar-orange);
            }
            
            /* INFO PANEL (droite) */
            .info-panel {
                position: absolute;
                top: 90px;
                right: 20px;
                z-index: 1000;
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                padding: 20px;
                width: 280px;
                border: 1px solid #e2e8f0;
            }
            
            /* AUDIT EL SECTION */
            .audit-section {
                background: white;
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 20px;
                border: 1px solid #e2e8f0;
                box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            }
            
            .section-title {
                font-weight: 700;
                font-size: 16px;
                color: var(--diag-dark);
                margin-bottom: 16px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .defect-list {
                max-height: 200px;
                overflow-y: auto;
                border: 1px solid #f1f5f9;
                border-radius: 8px;
                padding: 12px;
            }
            
            .defect-item {
                padding: 12px;
                border-left: 4px solid #ef4444;
                background: #fef2f2;
                border-radius: 0 8px 8px 0;
                margin-bottom: 8px;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .defect-item:hover {
                background: #fee2e2;
                transform: translateX(4px);
            }
            
            .defect-id {
                font-weight: 600;
                color: #dc2626;
                font-size: 14px;
            }
            
            .defect-type {
                color: #7f1d1d;
                font-size: 12px;
                margin-top: 2px;
            }
            
            /* MARQUEURS MODULES */
            .module-marker {
                background: var(--solar-blue) !important;
                border: 2px solid #1e3a8a !important;
                border-radius: 6px !important;
                color: white !important;
                font-weight: bold !important;
                text-align: center !important;
                font-size: 11px !important;
                padding: 4px 8px !important;
                min-width: 35px !important;
                min-height: 22px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                box-shadow: 0 3px 8px rgba(0,0,0,0.3) !important;
                transition: all 0.2s !important;
            }
            
            .module-marker:hover {
                transform: scale(1.1) !important;
            }
            
            .module-marker.defect {
                background: #dc2626 !important;
                border-color: #991b1b !important;
                animation: pulse-defect 2s infinite !important;
            }
            
            @keyframes pulse-defect {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.8; transform: scale(1.05); }
            }
            
            /* STATISTIQUES */
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 12px;
                margin-top: 16px;
            }
            
            .stat-item {
                text-align: center;
                padding: 12px;
                background: #f8fafc;
                border-radius: 8px;
                border: 1px solid #f1f5f9;
            }
            
            .stat-value {
                font-size: 20px;
                font-weight: bold;
                color: var(--diag-dark);
            }
            
            .stat-label {
                font-size: 11px;
                color: #64748b;
                margin-top: 4px;
            }
            
            /* RESPONSIVE */
            @media (max-width: 1024px) {
                .main-container {
                    grid-template-columns: 1fr;
                    grid-template-rows: 400px 1fr;
                }
                .audit-panel {
                    padding: 16px;
                }
                .tools-panel, .info-panel {
                    position: relative;
                    margin: 10px;
                    width: auto;
                }
            }
            
            /* ANIMATIONS */
            .fade-in {
                animation: fadeIn 0.3s ease-in;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .loading-geocode {
                display: inline-block;
                width: 14px;
                height: 14px;
                border: 2px solid #f3f4f6;
                border-top: 2px solid var(--solar-orange);
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            /* NOTIFICATIONS STYLE SOLAREDGE */
            .notification {
                position: fixed;
                top: 100px;
                right: 30px;
                z-index: 2000;
                background: white;
                border-radius: 12px;
                padding: 16px 20px;
                box-shadow: 0 8px 30px rgba(0,0,0,0.15);
                border-left: 4px solid var(--solar-orange);
                max-width: 400px;
                transform: translateX(100%);
                transition: transform 0.3s ease;
            }
            
            .notification.show {
                transform: translateX(0);
            }
            
            .notification-title {
                font-weight: 600;
                color: var(--diag-dark);
                margin-bottom: 4px;
            }
            
            .notification-message {
                color: #64748b;
                font-size: 14px;
            }
        </style>
    </head>
    <body class="bg-gray-50">
        <!-- Header -->
        <header class="bg-el-purple text-white py-4 shadow-lg">
            <div class="max-w-full px-6">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <div class="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                            <i class="fas fa-moon text-xl"></i>
                        </div>
                        <div>
                            <h1 class="text-xl font-bold">AUDIT EL + GÉOLOCALISATION TERRAIN</h1>
                            <p class="text-purple-200 text-sm">Style SolarEdge Designer • IEC 62446-1 • Calepinage Automatique</p>
                        </div>
                    </div>
                    <div class="flex items-center space-x-3">
                        <div id="connectionStatus" class="flex items-center space-x-2 bg-white bg-opacity-20 px-3 py-2 rounded-lg">
                            <div class="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span class="text-sm font-medium">Terrain Connecté</span>
                        </div>
                        <a href="/" class="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                            <i class="fas fa-home mr-2"></i>HUB
                        </a>
                    </div>
                </div>
            </div>
        </header>

        <!-- Layout Principal -->
        <div class="main-container">
            
            <!-- PANEL AUDIT EL (Gauche) -->
            <div class="audit-panel">
                
                <!-- Informations Terrain -->
                <div class="audit-section">
                    <div class="section-title">
                        <i class="fas fa-map-marker-alt text-red-500"></i>
                        Terrain Localisé
                    </div>
                    <div id="terrainInfo" class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span class="text-gray-600">Adresse:</span>
                            <span id="currentAddress" class="font-medium text-gray-800">Non définie</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Type:</span>
                            <span id="terrainType" class="font-medium text-blue-600">À identifier</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Surface estimée:</span>
                            <span id="estimatedArea" class="font-medium text-green-600">0 m²</span>
                        </div>
                    </div>
                    
                    <button onclick="openAddressModal()" class="w-full mt-4 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium">
                        <i class="fas fa-search-location mr-2"></i>Localiser Nouveau Terrain
                    </button>
                </div>
                
                <!-- Module Défauts EL -->
                <div class="audit-section">
                    <div class="section-title">
                        <i class="fas fa-exclamation-triangle text-yellow-500"></i>
                        Défauts Électroluminescence
                    </div>
                    <div id="defectsList" class="defect-list">
                        <div class="text-center text-gray-500 py-4">
                            <i class="fas fa-info-circle mb-2"></i><br>
                            Aucun défaut détecté<br>
                            <small>Les défauts apparaîtront ici</small>
                        </div>
                    </div>
                    
                    <div class="mt-4 space-y-2">
                        <button onclick="simulateDefectDetection()" class="w-full px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm">
                            <i class="fas fa-bug mr-2"></i>Simuler Détection Défaut
                        </button>
                        <button onclick="correlateDefectsOnMap()" class="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm">
                            <i class="fas fa-crosshairs mr-2"></i>Corréler sur Terrain
                        </button>
                    </div>
                </div>
                
                <!-- Statistiques Audit -->
                <div class="audit-section">
                    <div class="section-title">
                        <i class="fas fa-chart-pie text-blue-500"></i>
                        Statistiques Temps Réel
                    </div>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-value text-blue-600" id="totalModules">0</div>
                            <div class="stat-label">Modules Placés</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value text-red-600" id="defectsCount">0</div>
                            <div class="stat-label">Défauts EL</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value text-green-600" id="conformityRate">100%</div>
                            <div class="stat-label">Conformité</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value text-purple-600" id="totalPower">0 kWc</div>
                            <div class="stat-label">Puissance</div>
                        </div>
                    </div>
                </div>
                
                <!-- Actions Export -->
                <div class="audit-section">
                    <div class="section-title">
                        <i class="fas fa-download text-green-500"></i>
                        Export & Rapports
                    </div>
                    <div class="space-y-2">
                        <button onclick="exportAuditReport()" class="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm">
                            <i class="fas fa-file-pdf mr-2"></i>Rapport Audit EL
                        </button>
                        <button onclick="exportLayoutPlan()" class="w-full px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm">
                            <i class="fas fa-map mr-2"></i>Plan Calepinage
                        </button>
                        <button onclick="exportCombinedReport()" class="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm">
                            <i class="fas fa-layer-group mr-2"></i>Rapport Complet
                        </button>
                    </div>
                </div>
                
            </div>
            
            <!-- CARTE TERRAIN (Droite) -->
            <div class="terrain-panel">
                
                <!-- Barre recherche adresse (style SolarEdge) -->
                <div class="address-bar">
                    <input type="text" 
                           id="addressInput" 
                           class="address-input" 
                           placeholder="Entrez l'adresse du terrain (ex: 123 rue de la Paix, Marseille)..."
                           onkeypress="handleAddressKeyPress(event)">
                    <button class="search-btn" onclick="searchAndLocalizeTerrain()">
                        <i class="fas fa-search"></i>
                    </button>
                </div>
                
                <!-- Panel outils calepinage -->
                <div class="tools-panel">
                    
                    <div class="tool-section">
                        <div class="tool-title">
                            <i class="fas fa-vector-square"></i>Délimitation Terrain
                        </div>
                        <div class="tool-buttons">
                            <button class="tool-btn" onclick="setDrawingMode('rooftop')">
                                <i class="fas fa-home"></i>Toiture Bâtiment
                            </button>
                            <button class="tool-btn" onclick="setDrawingMode('ground')">
                                <i class="fas fa-seedling"></i>Installation Sol
                            </button>
                            <button class="tool-btn" onclick="setDrawingMode('carport')">
                                <i class="fas fa-car"></i>Ombrière Parking
                            </button>
                        </div>
                    </div>
                    
                    <div class="tool-section">
                        <div class="tool-title">
                            <i class="fas fa-th"></i>Calepinage Auto
                        </div>
                        <div class="tool-buttons">
                            <button class="tool-btn" onclick="autoLayout()">
                                <i class="fas fa-magic"></i>Calepinage Optimal
                            </button>
                            <button class="tool-btn" onclick="manualPlacement()">
                                <i class="fas fa-mouse-pointer"></i>Placement Manuel
                            </button>
                        </div>
                    </div>
                    
                    <div class="tool-section">
                        <div class="tool-title">
                            <i class="fas fa-tools"></i>Outils
                        </div>
                        <div class="tool-buttons">
                            <button class="tool-btn" onclick="clearAllElements()">
                                <i class="fas fa-eraser"></i>Effacer Tout
                            </button>
                            <button class="tool-btn" onclick="undoLastAction()">
                                <i class="fas fa-undo"></i>Annuler
                            </button>
                        </div>
                    </div>
                    
                </div>
                
                <!-- Carte satellite -->
                <div id="terrainMap"></div>
                
                <!-- Panel informations -->
                <div class="info-panel">
                    <h4 class="font-bold text-gray-800 mb-3">
                        <i class="fas fa-info-circle text-blue-500 mr-2"></i>Informations Calepinage
                    </h4>
                    <div id="calepiageInfo" class="space-y-3 text-sm">
                        <div class="flex justify-between">
                            <span>Configuration:</span>
                            <span id="configInfo" class="font-medium">Standard 300Wc</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Surface utilisable:</span>
                            <span id="usableArea" class="font-medium text-green-600">0 m²</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Modules possibles:</span>
                            <span id="maxModules" class="font-medium text-blue-600">0</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Puissance max:</span>
                            <span id="maxPower" class="font-medium text-purple-600">0 kWc</span>
                        </div>
                    </div>
                    
                    <div class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div class="text-xs text-yellow-800">
                            <i class="fas fa-lightbulb mr-1"></i>
                            <strong>Conseil:</strong> Délimitez d'abord la zone d'installation, puis utilisez le calepinage automatique pour un placement optimal.
                        </div>
                    </div>
                </div>
                
            </div>
        </div>

        <!-- Modal Configuration Terrain -->
        <div id="addressModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 hidden flex items-center justify-center">
            <div class="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                <h3 class="text-xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-map-marker-alt text-red-500 mr-2"></i>Localisation Terrain
                </h3>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Adresse complète</label>
                        <input type="text" id="modalAddressInput" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                               placeholder="Ex: 123 Avenue des Champs, 13008 Marseille">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Type d'installation</label>
                        <select id="installationType" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            <option value="rooftop">Toiture résidentielle</option>
                            <option value="commercial">Toiture commerciale</option>
                            <option value="ground">Installation au sol</option>
                            <option value="carport">Ombrière de parking</option>
                            <option value="agrivoltaic">Agrivoltaïque</option>
                        </select>
                    </div>
                </div>
                <div class="flex space-x-3 mt-6">
                    <button onclick="closeAddressModal()" class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                        Annuler
                    </button>
                    <button onclick="confirmTerrainLocation()" class="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
                        <i class="fas fa-search mr-1"></i>Localiser
                    </button>
                </div>
            </div>
        </div>

        <!-- JavaScript Application -->
        <script>
        // ===== VARIABLES GLOBALES =====
        let terrainMap = null;
        let currentTerrain = {
            address: '',
            coordinates: [43.296482, 5.369780], // Marseille par défaut
            type: 'rooftop',
            boundaries: [],
            modules: [],
            defects: []
        };
        
        let layoutData = {
            modules: [],
            drawings: [],
            config: { 
                moduleLength: 1960, 
                moduleWidth: 990, 
                modulePower: 300, 
                spacing: 20 
            }
        };
        
        let auditData = {
            defectsFound: 0,
            totalModules: 0,
            conformityRate: 100,
            detectedDefects: []
        };
        
        let drawControl = null;
        let drawnItems = null;
        let currentDrawingMode = 'rooftop';
        let placementMode = 'manual';

        // ===== INITIALISATION =====
        document.addEventListener('DOMContentLoaded', function() {
            console.log('Initializing Terrain Audit System...');
            initTerrainMap();
            updateAllStats();
            
            // Auto-localiser si coordonnées disponibles
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function(position) {
                    currentTerrain.coordinates = [position.coords.latitude, position.coords.longitude];
                    if (terrainMap) {
                        terrainMap.setView(currentTerrain.coordinates, 18);
                    }
                    showNotification('Géolocalisation', 'Position automatique détectée', 'success');
                });
            }
        });

        // ===== INITIALISATION CARTE TERRAIN =====
        function initTerrainMap() {
            console.log('Initializing terrain map...');
            
            try {
                terrainMap = L.map('terrainMap', {
                    center: currentTerrain.coordinates,
                    zoom: 18,
                    zoomControl: true,
                    attributionControl: true
                });
                
                // Couche satellite haute résolution
                const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                    attribution: 'Esri World Imagery',
                    maxZoom: 20,
                    minZoom: 1
                });
                
                satelliteLayer.addTo(terrainMap);
                
                // Initialiser outils de dessin
                initDrawingTools();
                
                // Événements
                terrainMap.on('click', handleMapClick);
                
                console.log('Terrain map initialized successfully');
                
            } catch (error) {
                console.error('Error initializing terrain map:', error);
                showNotification('Erreur', 'Erreur initialisation carte terrain', 'error');
            }
        }

        function initDrawingTools() {
            if (!terrainMap) return;
            
            drawnItems = new L.FeatureGroup();
            terrainMap.addLayer(drawnItems);
            
            drawControl = new L.Control.Draw({
                position: 'topleft',
                draw: {
                    polyline: false,
                    marker: false,
                    circle: false,
                    circlemarker: false,
                    rectangle: {
                        shapeOptions: {
                            color: '#ef4444',
                            weight: 2,
                            fillOpacity: 0.2
                        }
                    },
                    polygon: {
                        shapeOptions: {
                            color: '#ef4444',
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
            
            terrainMap.addControl(drawControl);
            
            // Événements dessin
            terrainMap.on(L.Draw.Event.CREATED, onAreaDrawn);
            terrainMap.on(L.Draw.Event.EDITED, onAreaEdited);
            terrainMap.on(L.Draw.Event.DELETED, onAreaDeleted);
        }

        // ===== GÉOLOCALISATION ADRESSE =====
        function handleAddressKeyPress(event) {
            if (event.key === 'Enter') {
                searchAndLocalizeTerrain();
            }
        }

        async function searchAndLocalizeTerrain() {
            const addressInput = document.getElementById('addressInput');
            const address = addressInput.value.trim();
            
            if (!address) {
                showNotification('Adresse', 'Veuillez saisir une adresse', 'warning');
                return;
            }
            
            // Animation de recherche
            const searchBtn = document.querySelector('.search-btn');
            const originalHTML = searchBtn.innerHTML;
            searchBtn.innerHTML = '<div class="loading-geocode"></div>';
            
            try {
                showNotification('Géolocalisation', 'Recherche en cours...', 'info');
                
                // Géocodage avec Nominatim
                const response = await fetch(\`https://nominatim.openstreetmap.org/search?format=json&q=\${encodeURIComponent(address)}&limit=1&countrycodes=fr\`);
                const data = await response.json();
                
                if (data && data.length > 0) {
                    const result = data[0];
                    const lat = parseFloat(result.lat);
                    const lon = parseFloat(result.lon);
                    
                    // Mettre à jour terrain actuel
                    currentTerrain.coordinates = [lat, lon];
                    currentTerrain.address = result.display_name;
                    
                    // Centrer la carte
                    terrainMap.setView([lat, lon], 19);
                    
                    // Marqueur temporaire
                    const locationMarker = L.marker([lat, lon]).addTo(terrainMap)
                        .bindPopup(\`
                            <div class="text-center p-2">
                                <strong>📍 Terrain Localisé</strong><br>
                                <small>\${result.display_name}</small><br>
                                <button onclick="removeLocationMarker()" class="mt-2 px-2 py-1 bg-red-500 text-white text-xs rounded">
                                    Masquer
                                </button>
                            </div>
                        \`)
                        .openPopup();
                    
                    // Stocker pour suppression
                    window.currentLocationMarker = locationMarker;
                    
                    // Mettre à jour interface
                    updateTerrainInfo(result.display_name);
                    
                    // Auto-identifier type de terrain
                    const terrainType = identifyTerrainType(result.display_name);
                    currentTerrain.type = terrainType;
                    
                    showNotification('Terrain Localisé', 'Adresse trouvée et centrée sur la carte', 'success');
                    
                    // Suggestions automatiques
                    setTimeout(() => {
                        showAutoSuggestions(terrainType);
                    }, 2000);
                    
                } else {
                    showNotification('Adresse', 'Adresse non trouvée. Vérifiez la saisie.', 'warning');
                }
                
            } catch (error) {
                console.error('Geocoding error:', error);
                showNotification('Erreur', 'Erreur de géolocalisation', 'error');
            } finally {
                // Restaurer bouton
                searchBtn.innerHTML = originalHTML;
            }
        }

        function removeLocationMarker() {
            if (window.currentLocationMarker) {
                terrainMap.removeLayer(window.currentLocationMarker);
                window.currentLocationMarker = null;
            }
        }

        function identifyTerrainType(address) {
            const addressLower = address.toLowerCase();
            
            if (addressLower.includes('parking') || addressLower.includes('centre commercial')) {
                return 'carport';
            } else if (addressLower.includes('zone industrielle') || addressLower.includes('entrepôt')) {
                return 'commercial';
            } else if (addressLower.includes('champ') || addressLower.includes('terrain') || addressLower.includes('agricole')) {
                return 'ground';
            } else {
                return 'rooftop';
            }
        }

        function updateTerrainInfo(address) {
            document.getElementById('currentAddress').textContent = address.split(',')[0] || 'Terrain localisé';
            
            const terrainTypes = {
                rooftop: 'Toiture résidentielle',
                commercial: 'Toiture commerciale', 
                ground: 'Installation sol',
                carport: 'Ombrière parking',
                agrivoltaic: 'Agrivoltaïque'
            };
            
            document.getElementById('terrainType').textContent = terrainTypes[currentTerrain.type] || 'À identifier';
        }

        function showAutoSuggestions(terrainType) {
            const suggestions = {
                rooftop: 'Délimitez la toiture puis utilisez le calepinage automatique',
                commercial: 'Tracez les zones exploitables sur le toit',
                ground: 'Définissez la zone d\\'installation au sol',
                carport: 'Délimitez l\\'emplacement de l\\'ombrière'
            };
            
            const suggestion = suggestions[terrainType];
            if (suggestion) {
                showNotification('Conseil Calepinage', suggestion, 'info');
            }
        }

        // ===== MODAL ADRESSE =====
        function openAddressModal() {
            document.getElementById('addressModal').classList.remove('hidden');
            document.getElementById('modalAddressInput').focus();
        }

        function closeAddressModal() {
            document.getElementById('addressModal').classList.add('hidden');
        }

        async function confirmTerrainLocation() {
            const address = document.getElementById('modalAddressInput').value.trim();
            const type = document.getElementById('installationType').value;
            
            if (!address) {
                showNotification('Adresse', 'Veuillez saisir une adresse', 'warning');
                return;
            }
            
            currentTerrain.type = type;
            document.getElementById('addressInput').value = address;
            
            closeAddressModal();
            await searchAndLocalizeTerrain();
        }

        // ===== OUTILS DESSIN =====
        function setDrawingMode(mode) {
            currentDrawingMode = mode;
            
            // Mettre à jour styles boutons
            document.querySelectorAll('.tool-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            event.target.classList.add('active');
            
            const modeNames = {
                rooftop: 'toiture',
                ground: 'installation au sol',
                carport: 'ombrière'
            };
            
            showNotification('Mode Dessin', \`Mode \${modeNames[mode]} activé - Dessinez sur la carte\`, 'info');
        }

        function onAreaDrawn(event) {
            const layer = event.layer;
            
            // Ajouter métadonnées
            layer.options.terrainType = currentDrawingMode;
            layer.options.createdAt = new Date().toISOString();
            layer.options.id = 'area_' + Date.now();
            
            // Calculer superficie
            const area = calculatePolygonArea(layer);
            
            // Ajouter au groupe
            drawnItems.addLayer(layer);
            
            // Popup informative
            layer.bindPopup(\`
                <div class="text-center p-2">
                    <strong>Zone \${currentDrawingMode.toUpperCase()}</strong><br>
                    <strong class="text-blue-600">\${area.toFixed(0)} m²</strong><br>
                    <small>Modules estimés: ~\${Math.floor(area / 2)} unités</small><br>
                    <div class="mt-2">
                        <button onclick="autoLayoutInArea('\${layer.options.id}')" class="px-2 py-1 bg-blue-500 text-white text-xs rounded mr-1">
                            🔧 Auto-Calepinage
                        </button>
                        <button onclick="deleteArea('\${layer.options.id}')" class="px-2 py-1 bg-red-500 text-white text-xs rounded">
                            🗑️ Suppr.
                        </button>
                    </div>
                </div>
            \`);
            
            // Sauvegarder données terrain
            currentTerrain.boundaries.push({
                id: layer.options.id,
                type: currentDrawingMode,
                area: area,
                coordinates: getLayerCoordinates(layer)
            });
            
            // Mettre à jour stats
            updateTerrainStats();
            
            showNotification('Zone Délimitée', \`Zone \${currentDrawingMode} de \${area.toFixed(0)} m² créée\`, 'success');
        }

        function calculatePolygonArea(layer) {
            if (layer instanceof L.Rectangle) {
                const bounds = layer.getBounds();
                const width = terrainMap.distance(bounds.getNorthWest(), bounds.getNorthEast());
                const height = terrainMap.distance(bounds.getNorthWest(), bounds.getSouthWest());
                return width * height;
            }
            
            if (layer instanceof L.Polygon) {
                // Approximation simple
                const latlngs = layer.getLatLngs()[0];
                if (latlngs.length < 3) return 0;
                
                let perimeter = 0;
                for (let i = 0; i < latlngs.length; i++) {
                    const j = (i + 1) % latlngs.length;
                    perimeter += terrainMap.distance(latlngs[i], latlngs[j]);
                }
                // Estimation grossière : aire ≈ périmètre²/(4π) pour formes régulières
                return (perimeter * perimeter) / (4 * Math.PI);
            }
            
            return 1000; // Valeur par défaut
        }

        function getLayerCoordinates(layer) {
            if (layer instanceof L.Rectangle) {
                const bounds = layer.getBounds();
                return [
                    [bounds.getNorth(), bounds.getWest()],
                    [bounds.getSouth(), bounds.getEast()]
                ];
            }
            
            if (layer instanceof L.Polygon) {
                return layer.getLatLngs()[0].map(ll => [ll.lat, ll.lng]);
            }
            
            return [];
        }

        // ===== CALEPINAGE AUTOMATIQUE =====
        function autoLayout() {
            if (currentTerrain.boundaries.length === 0) {
                showNotification('Zone Manquante', 'Délimitez d\\'abord une zone d\\'installation', 'warning');
                return;
            }
            
            showNotification('Calepinage', 'Calcul automatique en cours...', 'info');
            
            setTimeout(() => {
                // Simulation calepinage automatique
                const totalArea = currentTerrain.boundaries.reduce((sum, boundary) => sum + boundary.area, 0);
                const moduleArea = (layoutData.config.moduleLength / 1000) * (layoutData.config.moduleWidth / 1000);
                const estimatedModules = Math.floor(totalArea / moduleArea * 0.7); // 70% d'efficacité
                
                // Générer positions modules
                generateOptimalModuleLayout(estimatedModules);
                
                showNotification('Calepinage Terminé', \`\${estimatedModules} modules placés automatiquement\`, 'success');
            }, 2000);
        }

        function generateOptimalModuleLayout(moduleCount) {
            // Supprimer modules existants
            clearExistingModules();
            
            if (currentTerrain.boundaries.length === 0) return;
            
            const firstBoundary = currentTerrain.boundaries[0];
            const coords = firstBoundary.coordinates;
            
            if (coords.length < 2) return;
            
            // Calculer centre et dimensions approximatives
            const centerLat = coords.reduce((sum, coord) => sum + coord[0], 0) / coords.length;
            const centerLng = coords.reduce((sum, coord) => sum + coord[1], 0) / coords.length;
            
            // Espacements modules
            const moduleSpacing = 0.00005; // ~5m en coordonnées GPS
            const rowSpacing = 0.00003; // ~3m entre rangées
            
            // Générer grille modules
            let placedModules = 0;
            const maxRows = Math.ceil(Math.sqrt(moduleCount));
            const modulesPerRow = Math.ceil(moduleCount / maxRows);
            
            for (let row = 0; row < maxRows && placedModules < moduleCount; row++) {
                for (let col = 0; col < modulesPerRow && placedModules < moduleCount; col++) {
                    const lat = centerLat + (row - maxRows/2) * rowSpacing;
                    const lng = centerLng + (col - modulesPerRow/2) * moduleSpacing;
                    
                    addModuleAtPosition(lat, lng, \`M\${String(placedModules + 1).padStart(3, '0')}\`);
                    placedModules++;
                }
            }
            
            updateAllStats();
        }

        function addModuleAtPosition(lat, lng, moduleId) {
            const module = {
                id: moduleId,
                lat: lat,
                lng: lng,
                hasDefect: false,
                power: layoutData.config.modulePower,
                timestamp: Date.now()
            };
            
            currentTerrain.modules.push(module);
            
            // Créer marqueur
            const icon = L.divIcon({
                className: 'module-marker' + (module.hasDefect ? ' defect' : ''),
                html: moduleId,
                iconSize: [35, 22],
                iconAnchor: [17, 11]
            });
            
            const marker = L.marker([lat, lng], { icon })
                .bindPopup(\`
                    <div class="text-center p-2">
                        <strong>Module \${moduleId}</strong><br>
                        <small>Puissance: <span class="text-green-600 font-bold">\${module.power}Wc</span></small><br>
                        \${module.hasDefect ? '<span class="text-red-600 font-bold">⚠️ DÉFAUT EL</span>' : '<span class="text-green-600">✅ Conforme</span>'}
                    </div>
                \`)
                .addTo(terrainMap);
            
            // Stocker référence marker
            module.marker = marker;
        }

        function clearExistingModules() {
            currentTerrain.modules.forEach(module => {
                if (module.marker) {
                    terrainMap.removeLayer(module.marker);
                }
            });
            currentTerrain.modules = [];
        }

        function manualPlacement() {
            placementMode = 'manual';
            
            // Activer bouton
            event.target.classList.add('active');
            document.querySelectorAll('.tool-btn').forEach(btn => {
                if (btn !== event.target) btn.classList.remove('active');
            });
            
            showNotification('Placement Manuel', 'Cliquez sur la carte pour placer des modules', 'info');
        }

        function handleMapClick(e) {
            if (placementMode === 'manual') {
                const moduleId = \`M\${String(currentTerrain.modules.length + 1).padStart(3, '0')}\`;
                addModuleAtPosition(e.latlng.lat, e.latlng.lng, moduleId);
                updateAllStats();
                showNotification('Module Ajouté', \`Module \${moduleId} placé\`, 'success');
            }
        }

        // ===== SIMULATION DÉFAUTS EL =====
        function simulateDefectDetection() {
            if (currentTerrain.modules.length === 0) {
                showNotification('Aucun Module', 'Placez des modules avant de simuler des défauts', 'warning');
                return;
            }
            
            // Sélectionner module aléatoire sans défaut
            const healthyModules = currentTerrain.modules.filter(m => !m.hasDefect);
            if (healthyModules.length === 0) {
                showNotification('Tous Défectueux', 'Tous les modules ont déjà des défauts', 'info');
                return;
            }
            
            const randomModule = healthyModules[Math.floor(Math.random() * healthyModules.length)];
            
            // Types de défauts EL
            const defectTypes = [
                { type: 'Microfissure', severity: 'Moyen', color: '#f59e0b' },
                { type: 'Cellule court-circuitée', severity: 'Élevé', color: '#ef4444' },
                { type: 'PID (Potential Induced Degradation)', severity: 'Faible', color: '#f97316' },
                { type: 'Soudure défectueuse', severity: 'Moyen', color: '#d97706' },
                { type: 'Délamination', severity: 'Élevé', color: '#dc2626' }
            ];
            
            const selectedDefect = defectTypes[Math.floor(Math.random() * defectTypes.length)];
            
            // Marquer module comme défectueux
            randomModule.hasDefect = true;
            randomModule.defectType = selectedDefect.type;
            randomModule.defectSeverity = selectedDefect.severity;
            randomModule.defectTimestamp = new Date().toISOString();
            
            // Mettre à jour marqueur
            if (randomModule.marker) {
                const newIcon = L.divIcon({
                    className: 'module-marker defect',
                    html: randomModule.id,
                    iconSize: [35, 22],
                    iconAnchor: [17, 11]
                });
                randomModule.marker.setIcon(newIcon);
                
                // Mettre à jour popup
                randomModule.marker.setPopupContent(\`
                    <div class="text-center p-2">
                        <strong>Module \${randomModule.id}</strong><br>
                        <small>Puissance: \${randomModule.power}Wc</small><br>
                        <span class="text-red-600 font-bold">⚠️ DÉFAUT EL</span><br>
                        <small class="text-red-500">\${selectedDefect.type}</small><br>
                        <small class="text-orange-600">Sévérité: \${selectedDefect.severity}</small>
                    </div>
                \`);
            }
            
            // Ajouter à la liste des défauts
            auditData.detectedDefects.push({
                moduleId: randomModule.id,
                type: selectedDefect.type,
                severity: selectedDefect.severity,
                coordinates: [randomModule.lat, randomModule.lng],
                timestamp: randomModule.defectTimestamp
            });
            
            // Mettre à jour interface défauts
            updateDefectsList();
            updateAllStats();
            
            showNotification('Défaut EL Détecté', \`\${selectedDefect.type} sur module \${randomModule.id}\`, 'warning');
        }

        function updateDefectsList() {
            const defectsList = document.getElementById('defectsList');
            
            if (auditData.detectedDefects.length === 0) {
                defectsList.innerHTML = \`
                    <div class="text-center text-gray-500 py-4">
                        <i class="fas fa-check-circle mb-2"></i><br>
                        Aucun défaut détecté<br>
                        <small>Installation conforme</small>
                    </div>
                \`;
                return;
            }
            
            defectsList.innerHTML = auditData.detectedDefects.map(defect => \`
                <div class="defect-item" onclick="focusOnModule('\${defect.moduleId}')">
                    <div class="defect-id">Module \${defect.moduleId}</div>
                    <div class="defect-type">\${defect.type}</div>
                    <div class="text-xs text-gray-600 mt-1">Sévérité: \${defect.severity}</div>
                </div>
            \`).join('');
        }

        function focusOnModule(moduleId) {
            const module = currentTerrain.modules.find(m => m.id === moduleId);
            if (module && module.marker) {
                terrainMap.setView([module.lat, module.lng], 20);
                module.marker.openPopup();
                showNotification('Module Localisé', \`Focus sur module \${moduleId}\`, 'info');
            }
        }

        function correlateDefectsOnMap() {
            if (auditData.detectedDefects.length === 0) {
                showNotification('Aucun Défaut', 'Aucun défaut à corréler sur la carte', 'info');
                return;
            }
            
            // Animation de corrélation
            auditData.detectedDefects.forEach((defect, index) => {
                setTimeout(() => {
                    focusOnModule(defect.moduleId);
                }, index * 1000);
            });
            
            showNotification('Corrélation', \`\${auditData.detectedDefects.length} défaut(s) corrélé(s) sur la carte\`, 'success');
        }

        // ===== STATISTIQUES =====
        function updateAllStats() {
            updateTerrainStats();
            updateAuditStats();
        }

        function updateTerrainStats() {
            const totalArea = currentTerrain.boundaries.reduce((sum, boundary) => sum + boundary.area, 0);
            document.getElementById('estimatedArea').textContent = totalArea.toFixed(0) + ' m²';
            document.getElementById('usableArea').textContent = totalArea.toFixed(0) + ' m²';
            
            const moduleArea = (layoutData.config.moduleLength / 1000) * (layoutData.config.moduleWidth / 1000);
            const maxModules = Math.floor(totalArea / moduleArea * 0.7);
            document.getElementById('maxModules').textContent = maxModules;
            document.getElementById('maxPower').textContent = (maxModules * layoutData.config.modulePower / 1000).toFixed(1) + ' kWc';
        }

        function updateAuditStats() {
            const totalModules = currentTerrain.modules.length;
            const defectCount = auditData.detectedDefects.length;
            const conformityRate = totalModules > 0 ? Math.round((1 - defectCount / totalModules) * 100) : 100;
            const totalPower = totalModules * layoutData.config.modulePower / 1000;
            
            document.getElementById('totalModules').textContent = totalModules;
            document.getElementById('defectsCount').textContent = defectCount;
            document.getElementById('conformityRate').textContent = conformityRate + '%';
            document.getElementById('totalPower').textContent = totalPower.toFixed(1) + ' kWc';
            
            // Mettre à jour variables globales
            auditData.totalModules = totalModules;
            auditData.defectsFound = defectCount;
            auditData.conformityRate = conformityRate;
        }

        // ===== ACTIONS UTILITAIRES =====
        function clearAllElements() {
            if (confirm('Effacer tous les éléments (zones + modules) ?\\n\\nCette action est irréversible.')) {
                // Supprimer dessins
                if (drawnItems) {
                    drawnItems.clearLayers();
                }
                
                // Supprimer modules
                clearExistingModules();
                
                // Reset données
                currentTerrain.boundaries = [];
                currentTerrain.modules = [];
                auditData.detectedDefects = [];
                
                updateDefectsList();
                updateAllStats();
                
                showNotification('Effacement', 'Tous les éléments ont été supprimés', 'info');
            }
        }

        function undoLastAction() {
            // Supprimer dernier module ajouté
            if (currentTerrain.modules.length > 0) {
                const lastModule = currentTerrain.modules.pop();
                if (lastModule.marker) {
                    terrainMap.removeLayer(lastModule.marker);
                }
                
                // Supprimer des défauts si nécessaire
                auditData.detectedDefects = auditData.detectedDefects.filter(d => d.moduleId !== lastModule.id);
                
                updateDefectsList();
                updateAllStats();
                
                showNotification('Annulation', \`Module \${lastModule.id} supprimé\`, 'info');
            }
        }

        // ===== EXPORTS =====
        function exportAuditReport() {
            const reportData = {
                metadata: {
                    title: 'Rapport Audit Électroluminescence',
                    generated: new Date().toISOString(),
                    operator: 'DiagPV HUB',
                    terrain: currentTerrain.address
                },
                terrain: {
                    address: currentTerrain.address,
                    type: currentTerrain.type,
                    coordinates: currentTerrain.coordinates,
                    totalArea: currentTerrain.boundaries.reduce((sum, b) => sum + b.area, 0)
                },
                installation: {
                    totalModules: currentTerrain.modules.length,
                    totalPower: currentTerrain.modules.length * layoutData.config.modulePower / 1000,
                    moduleConfig: layoutData.config
                },
                audit: {
                    defectsFound: auditData.detectedDefects.length,
                    conformityRate: auditData.conformityRate,
                    defectsList: auditData.detectedDefects
                }
            };
            
            const dataStr = JSON.stringify(reportData, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            
            const filename = \`audit_el_rapport_\${new Date().toISOString().slice(0,10)}.json\`;
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', filename);
            linkElement.click();
            
            showNotification('Export Réussi', \`Rapport audit exporté: \${filename}\`, 'success');
        }

        function exportLayoutPlan() {
            showNotification('Export Plan', 'Export plan calepinage à implémenter', 'info');
        }

        function exportCombinedReport() {
            showNotification('Export Complet', 'Export rapport complet à implémenter', 'info');
        }

        // ===== ÉVÉNEMENTS DESSIN =====
        function onAreaEdited(event) {
            showNotification('Zone Modifiée', 'Zone mise à jour', 'info');
            updateTerrainStats();
        }

        function onAreaDeleted(event) {
            // Mettre à jour données terrain
            currentTerrain.boundaries = [];
            updateTerrainStats();
            showNotification('Zone Supprimée', 'Zone supprimée', 'info');
        }

        function autoLayoutInArea(areaId) {
            showNotification('Calepinage Zone', 'Calepinage spécifique à la zone à implémenter', 'info');
        }

        function deleteArea(areaId) {
            // Trouver et supprimer la zone
            drawnItems.eachLayer(layer => {
                if (layer.options.id === areaId) {
                    drawnItems.removeLayer(layer);
                }
            });
            
            // Mettre à jour données
            currentTerrain.boundaries = currentTerrain.boundaries.filter(b => b.id !== areaId);
            updateTerrainStats();
            
            showNotification('Zone Supprimée', 'Zone supprimée avec succès', 'info');
        }

        // ===== NOTIFICATIONS =====
        function showNotification(title, message, type = 'info') {
            const notification = document.createElement('div');
            notification.className = 'notification';
            
            const colors = {
                success: '#22c55e',
                warning: '#f59e0b', 
                error: '#ef4444',
                info: '#3b82f6'
            };
            
            notification.style.borderLeftColor = colors[type] || colors.info;
            
            notification.innerHTML = \`
                <div class="notification-title">\${title}</div>
                <div class="notification-message">\${message}</div>
            \`;
            
            document.body.appendChild(notification);
            
            // Animer entrée
            setTimeout(() => {
                notification.classList.add('show');
            }, 100);
            
            // Auto-remove
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }, 4000);
        }
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