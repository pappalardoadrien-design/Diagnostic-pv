import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()

app.use('/api/*', cors())
app.use('/static/*', serveStatic({ root: './public' }))

// Interface pour configuration flexible des modules
interface ModuleConfig {
  model: string;
  manufacturer: string;
  width: number; // mètres
  height: number; // mètres
  power: number; // Watts
  efficiency: number; // %
}

// Interface pour structure à calepiner
interface CaleepinageStructure {
  id: string;
  type: 'toiture' | 'ombriere' | 'table_sol' | 'batiment_industriel';
  name: string;
  dimensions: {
    length: number; // mètres
    width: number; // mètres
    orientation: number; // degrés
    inclination: number; // degrés
  };
  constraints: {
    marginTop: number;
    marginBottom: number;
    marginLeft: number;
    marginRight: number;
    obstacles: Array<{id: string; x: number; y: number; width: number; height: number;}>;
  };
  panels: SolarPanel[];
}

// Interface pour les données de panneau individuel (CONSERVÉE IDENTIQUE)
interface SolarPanel {
  id: string;
  structureId: string; // Nouvelle: référence à la structure
  x: number; // Position relative dans la structure
  y: number;
  lat?: number; // Position GPS globale (optionnelle)
  lng?: number;
  width: number;
  height: number;
  rotation: number;
  status: 'ok' | 'defaut_el' | 'defaut_thermo' | 'defaut_iv' | 'defaut_critique';
  power: number;
  model: string;
  manufacturer: string;
  defects: string[];
  selected: boolean;
  auditData?: { // CONSERVÉ: toutes données audit existantes
    elTest?: any;
    thermoTest?: any;
    ivTest?: any;
    visualInspection?: any;
    timestamp?: string;
    technician?: string;
    notes?: string;
  };
}

// Interface pour projet d'audit (ÉTENDUE, COMPATIBLE EXISTANT)
interface AuditProject {
  id: string;
  name: string;
  address: string;
  coordinates: { lat: number; lng: number; };
  
  // NOUVEAU: Configuration modules flexible
  moduleConfig: ModuleConfig;
  
  // NOUVEAU: Structures multiples 
  structures: CaleepinageStructure[];
  
  // CONSERVÉ: Toutes données audit existantes
  panels: SolarPanel[]; // Maintenu pour compatibilité rétroactive
  
  configuration: {
    rows?: number; // Optionnel pour compatibilité
    columns?: number;
    orientation: number;
    inclination: number;
    spacing: number;
  };
  
  totalPower: number;
  auditData: {
    defectCount: number;
    efficiency: number;
    recommendations: string[];
    // CONSERVÉ: toutes propriétés audit existantes
    startDate?: string;
    endDate?: string;
    technician?: string;
    equipmentUsed?: string[];
    weatherConditions?: string;
    globalNotes?: string;
  };
  
  // NOUVEAU: Métadonnées projet
  projectType: 'new' | 'existing'; // Nouveau vs existant
  version: string; // Version du schéma de données
  createdAt: string;
  updatedAt: string;
}

app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>DiagPV Hub - Calepinage Flexible & Audit Professionnel</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script src="https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.js"></script>
        <style>
            .solar-panel-3d {
                position: absolute;
                background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #1e40af 100%);
                border: 1px solid #1e40af;
                border-radius: 2px;
                transform-style: preserve-3d;
                cursor: pointer;
                transition: all 0.2s ease;
                z-index: 100;
            }
            
            .solar-panel-3d:hover {
                transform: translateZ(5px) scale(1.05);
                box-shadow: 0 5px 15px rgba(59, 130, 246, 0.4);
                z-index: 200;
            }
            
            .solar-panel-3d.selected {
                border: 2px solid #fbbf24;
                box-shadow: 0 0 10px rgba(251, 191, 36, 0.7);
                z-index: 150;
            }
            
            .solar-panel-3d.defaut_el {
                background: linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #dc2626 100%);
            }
            
            .solar-panel-3d.defaut_thermo {
                background: linear-gradient(135deg, #ea580c 0%, #f97316 50%, #ea580c 100%);
            }
            
            .solar-panel-3d.defaut_iv {
                background: linear-gradient(135deg, #7c2d12 0%, #a16207 50%, #7c2d12 100%);
            }
            
            .solar-panel-3d.defaut_critique {
                background: linear-gradient(135deg, #7f1d1d 0%, #dc2626 50%, #7f1d1d 100%);
                animation: pulse 2s infinite;
            }
            
            .panel-grid {
                background-image: 
                    linear-gradient(to right, rgba(255,255,255,0.15) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(255,255,255,0.15) 1px, transparent 1px);
                background-size: 8px 8px;
                width: 100%;
                height: 100%;
                position: absolute;
                top: 0;
                left: 0;
                pointer-events: none;
            }
            
            .structure-outline {
                position: absolute;
                border: 2px solid #3b82f6;
                background: rgba(59, 130, 246, 0.1);
                border-radius: 4px;
                pointer-events: none;
                z-index: 50;
            }
            
            .structure-outline.active {
                border-color: #fbbf24;
                background: rgba(251, 191, 36, 0.1);
                animation: structurePulse 3s infinite;
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }
            
            @keyframes structurePulse {
                0%, 100% { border-color: #3b82f6; }
                50% { border-color: #fbbf24; }
            }
            
            .calepinage-controls {
                position: absolute;
                top: 10px;
                left: 10px;
                background: rgba(255, 255, 255, 0.95);
                padding: 15px;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                z-index: 1000;
                max-width: 300px;
            }
            
            .audit-panel {
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                max-height: calc(100vh - 100px);
                overflow-y: auto;
            }
            
            .terrain-viewer {
                position: relative;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            }
            
            .panel-info-tooltip {
                position: absolute;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 10px 15px;
                border-radius: 8px;
                font-size: 12px;
                white-space: nowrap;
                pointer-events: none;
                z-index: 2000;
                transform: translate(-50%, -100%);
                margin-top: -10px;
                max-width: 250px;
                white-space: normal;
            }
            
            .selection-info {
                position: absolute;
                bottom: 10px;
                right: 10px;
                background: rgba(255, 255, 255, 0.95);
                padding: 12px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                font-size: 14px;
                z-index: 1000;
            }
            
            .structure-tabs {
                display: flex;
                flex-wrap: wrap;
                gap: 5px;
                margin-bottom: 15px;
            }
            
            .structure-tab {
                padding: 5px 10px;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                background: white;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.2s ease;
            }
            
            .structure-tab.active {
                background: #3b82f6;
                color: white;
                border-color: #3b82f6;
            }
        </style>
    </head>
    <body class="bg-gray-50">
        <!-- Header DiagPV -->
        <header class="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white shadow-xl">
            <div class="container mx-auto px-6 py-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <div class="bg-yellow-500 p-2 rounded-lg">
                            <i class="fas fa-solar-panel text-xl"></i>
                        </div>
                        <div>
                            <h1 class="text-2xl font-bold">DiagPV Professional</h1>
                            <p class="text-blue-200 text-sm">Calepinage Flexible & Audit Intégré</p>
                        </div>
                    </div>
                    <div class="flex items-center space-x-4">
                        <button id="saveProject" class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors">
                            <i class="fas fa-save mr-2"></i>Sauvegarder
                        </button>
                        <button id="generateReport" class="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg transition-colors">
                            <i class="fas fa-file-pdf mr-2"></i>Rapport Audit
                        </button>
                    </div>
                </div>
            </div>
        </header>

        <!-- Interface Principale -->
        <div class="container mx-auto px-6 py-6">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 h-screen">
                
                <!-- Panel Configuration & Audit Gauche -->
                <div class="lg:col-span-1 audit-panel p-6">
                    
                    <!-- Configuration Projet -->
                    <div class="mb-6">
                        <h2 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                            <i class="fas fa-cogs mr-3 text-blue-600"></i>
                            Configuration Projet
                        </h2>
                        
                        <!-- Adresse -->
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Adresse de la centrale
                            </label>
                            <div class="flex space-x-2">
                                <input type="text" id="addressInput" 
                                       placeholder="Ex: 123 Rue de la République, Lyon"
                                       class="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                <button id="searchAddress" class="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm">
                                    <i class="fas fa-search"></i>
                                </button>
                            </div>
                        </div>

                        <!-- Configuration Modules -->
                        <div class="mb-4 p-3 bg-gray-50 rounded-lg">
                            <h3 class="font-semibold text-gray-800 mb-3 text-sm">Configuration Modules</h3>
                            <div class="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <label class="block text-xs text-gray-600 mb-1">Modèle</label>
                                    <input type="text" id="moduleModel" value="JKM-450M-60HL4" 
                                           class="w-full px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-blue-500">
                                </div>
                                <div>
                                    <label class="block text-xs text-gray-600 mb-1">Puissance (W)</label>
                                    <input type="number" id="modulePower" value="450" 
                                           class="w-full px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-blue-500">
                                </div>
                                <div>
                                    <label class="block text-xs text-gray-600 mb-1">Largeur (m)</label>
                                    <input type="number" id="moduleWidth" value="2.0" step="0.1"
                                           class="w-full px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-blue-500">
                                </div>
                                <div>
                                    <label class="block text-xs text-gray-600 mb-1">Hauteur (m)</label>
                                    <input type="number" id="moduleHeight" value="1.0" step="0.1"
                                           class="w-full px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-blue-500">
                                </div>
                            </div>
                            <div class="mt-2">
                                <label class="block text-xs text-gray-600 mb-1">Fabricant</label>
                                <input type="text" id="moduleManufacturer" value="JinkoSolar Holding Co. Ltd"
                                       class="w-full px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-blue-500">
                            </div>
                        </div>
                    </div>

                    <!-- Structures de Calepinage -->
                    <div class="mb-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <i class="fas fa-drafting-compass mr-3 text-green-600"></i>
                            Structures à Calepiner
                        </h3>
                        
                        <!-- Onglets structures -->
                        <div id="structureTabs" class="structure-tabs mb-4">
                            <!-- Généré dynamiquement -->
                        </div>
                        
                        <!-- Nouvelle structure -->
                        <div class="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <h4 class="font-medium text-gray-800 mb-2 text-sm">Nouvelle Structure</h4>
                            <div class="grid grid-cols-2 gap-2 mb-3">
                                <select id="newStructureType" class="px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-blue-500">
                                    <option value="toiture">Toiture</option>
                                    <option value="ombriere">Ombrière</option>
                                    <option value="table_sol">Table au Sol</option>
                                    <option value="batiment_industriel">Bâtiment Industriel</option>
                                </select>
                                <input type="text" id="newStructureName" placeholder="Nom structure" 
                                       class="px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-blue-500">
                            </div>
                            
                            <div class="grid grid-cols-2 gap-2 mb-3">
                                <div>
                                    <label class="block text-xs text-gray-600">Longueur (m)</label>
                                    <input type="number" id="newStructureLength" value="30" step="0.5"
                                           class="w-full px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-blue-500">
                                </div>
                                <div>
                                    <label class="block text-xs text-gray-600">Largeur (m)</label>
                                    <input type="number" id="newStructureWidth" value="15" step="0.5"
                                           class="w-full px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-blue-500">
                                </div>
                                <div>
                                    <label class="block text-xs text-gray-600">Orientation (°)</label>
                                    <input type="number" id="newStructureOrientation" value="180" 
                                           class="w-full px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-blue-500">
                                </div>
                                <div>
                                    <label class="block text-xs text-gray-600">Inclinaison (°)</label>
                                    <input type="number" id="newStructureInclination" value="10"
                                           class="w-full px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-blue-500">
                                </div>
                            </div>
                            
                            <div class="grid grid-cols-2 gap-2 mb-3">
                                <div>
                                    <label class="block text-xs text-gray-600">Marge haut (m)</label>
                                    <input type="number" id="newStructureMarginTop" value="1" step="0.1"
                                           class="w-full px-2 py-1 text-xs border rounded">
                                </div>
                                <div>
                                    <label class="block text-xs text-gray-600">Marge bas (m)</label>
                                    <input type="number" id="newStructureMarginBottom" value="1" step="0.1"
                                           class="w-full px-2 py-1 text-xs border rounded">
                                </div>
                                <div>
                                    <label class="block text-xs text-gray-600">Marge gauche (m)</label>
                                    <input type="number" id="newStructureMarginLeft" value="1" step="0.1"
                                           class="w-full px-2 py-1 text-xs border rounded">
                                </div>
                                <div>
                                    <label class="block text-xs text-gray-600">Marge droite (m)</label>
                                    <input type="number" id="newStructureMarginRight" value="1" step="0.1"
                                           class="w-full px-2 py-1 text-xs border rounded">
                                </div>
                            </div>
                            
                            <button id="addStructure" class="w-full bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 text-sm">
                                <i class="fas fa-plus mr-2"></i>Ajouter Structure
                            </button>
                        </div>
                        
                        <!-- Structure sélectionnée -->
                        <div id="selectedStructureConfig" class="mb-4 p-3 bg-gray-50 rounded-lg" style="display: none;">
                            <h4 class="font-medium text-gray-800 mb-2 text-sm">Structure: <span id="currentStructureName"></span></h4>
                            <div class="text-xs text-gray-600 space-y-1">
                                <div>Dimensions: <span id="currentStructureDims"></span></div>
                                <div>Panneaux: <span id="currentStructurePanels"></span></div>
                                <div>Puissance: <span id="currentStructurePower"></span></div>
                            </div>
                            <div class="mt-2 flex space-x-2">
                                <button id="recalculateStructure" class="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
                                    <i class="fas fa-calculator mr-1"></i>Recalculer
                                </button>
                                <button id="deleteStructure" class="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">
                                    <i class="fas fa-trash mr-1"></i>Supprimer
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Audit Électroluminescence -->
                    <div class="mb-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <i class="fas fa-clipboard-check mr-3 text-blue-600"></i>
                            Audit Électroluminescence
                        </h3>
                        
                        <!-- Sélection Panneaux -->
                        <div class="mb-4">
                            <div id="selectionInfo" class="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                                <div class="flex justify-between mb-2">
                                    <span>Panneaux sélectionnés:</span>
                                    <span id="selectedCount" class="font-medium">0</span>
                                </div>
                                <div class="flex space-x-2 mb-3">
                                    <button id="selectAll" class="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">
                                        Tout sélectionner
                                    </button>
                                    <button id="clearSelection" class="text-xs bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-700">
                                        Désélectionner
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Statuts de Défauts -->
                        <div class="mb-4">
                            <h4 class="font-medium text-gray-800 mb-2 text-sm">Statut Panneaux Sélectionnés</h4>
                            <div class="grid grid-cols-2 gap-2">
                                <button class="status-btn bg-green-100 text-green-800 p-2 rounded-lg border hover:bg-green-200 text-xs" data-status="ok">
                                    <i class="fas fa-check-circle mb-1"></i>
                                    <div class="font-medium">OK</div>
                                </button>
                                <button class="status-btn bg-red-100 text-red-800 p-2 rounded-lg border hover:bg-red-200 text-xs" data-status="defaut_el">
                                    <i class="fas fa-exclamation-triangle mb-1"></i>
                                    <div class="font-medium">Défaut EL</div>
                                </button>
                                <button class="status-btn bg-orange-100 text-orange-800 p-2 rounded-lg border hover:bg-orange-200 text-xs" data-status="defaut_thermo">
                                    <i class="fas fa-thermometer-half mb-1"></i>
                                    <div class="font-medium">Défaut Thermo</div>
                                </button>
                                <button class="status-btn bg-yellow-100 text-yellow-800 p-2 rounded-lg border hover:bg-yellow-200 text-xs" data-status="defaut_iv">
                                    <i class="fas fa-chart-line mb-1"></i>
                                    <div class="font-medium">Défaut I-V</div>
                                </button>
                            </div>
                            <button class="status-btn w-full mt-2 bg-red-100 text-red-800 p-2 rounded-lg border hover:bg-red-200 text-xs" data-status="defaut_critique">
                                <i class="fas fa-skull-crossbones mb-1"></i>
                                <div class="font-medium">Défaut Critique</div>
                            </button>
                        </div>

                        <!-- Statistiques Audit -->
                        <div class="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                            <h4 class="font-medium text-gray-800 mb-2 text-sm">Statistiques Globales</h4>
                            <div class="space-y-1 text-xs">
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Total panneaux:</span>
                                    <span id="totalPanelsCount" class="font-medium">0</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Panneaux OK:</span>
                                    <span id="statsOk" class="font-medium text-green-600">0 (0%)</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Défauts EL:</span>
                                    <span id="statsEl" class="font-medium text-red-600">0 (0%)</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Défauts Thermo:</span>
                                    <span id="statsThermo" class="font-medium text-orange-600">0 (0%)</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Puissance totale:</span>
                                    <span id="totalPowerDisplay" class="font-medium text-blue-600">0 kWc</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Efficacité:</span>
                                    <span id="efficiency" class="font-medium text-blue-600">100%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Viewer 3D Terrain & Calepinage -->
                <div class="lg:col-span-2 terrain-viewer">
                    <div id="mapContainer" class="w-full h-full relative">
                        <!-- Carte Leaflet -->
                    </div>
                    
                    <!-- Overlay Structures et Panneaux -->
                    <div id="caleepinageOverlay" class="absolute inset-0 pointer-events-none">
                        <!-- Structures et panneaux générés dynamiquement -->
                    </div>
                    
                    <!-- Contrôles Calepinage -->
                    <div class="calepinage-controls">
                        <div class="text-sm font-medium mb-3">Contrôles Calepinage</div>
                        <div class="space-y-2">
                            <button id="showAllStructures" class="w-full text-xs bg-blue-600 text-white py-2 px-3 rounded hover:bg-blue-700">
                                <i class="fas fa-eye mr-2"></i>Toutes Structures
                            </button>
                            <button id="hideAllStructures" class="w-full text-xs bg-gray-600 text-white py-2 px-3 rounded hover:bg-gray-700">
                                <i class="fas fa-eye-slash mr-2"></i>Masquer Structures
                            </button>
                            <button id="optimizePanelLayout" class="w-full text-xs bg-purple-600 text-white py-2 px-3 rounded hover:bg-purple-700">
                                <i class="fas fa-magic mr-2"></i>Optimiser Layout
                            </button>
                        </div>
                        <div class="mt-3 text-xs text-gray-600">
                            <div>Zoom: Molette souris</div>
                            <div>Sélection: Clic panneau</div>
                            <div>Multi-sélection: Ctrl+Clic</div>
                        </div>
                    </div>
                    
                    <!-- Info Sélection -->
                    <div class="selection-info">
                        <div class="text-sm font-medium text-gray-800">
                            Sélection: <span id="selectionCount">0</span> panneaux
                        </div>
                        <div class="text-xs text-gray-600 mt-1">
                            Structure: <span id="selectedStructureName">Aucune</span>
                        </div>
                    </div>
                    
                    <!-- Tooltip Info Panneau -->
                    <div id="panelTooltip" class="panel-info-tooltip hidden"></div>
                </div>
            </div>
        </div>

        <script>
            // État global de l'application - COMPATIBLE AVEC DONNÉES EXISTANTES
            let currentProject = {
                id: 'project_' + Date.now(),
                name: '',
                address: '',
                coordinates: { lat: 46.603354, lng: 1.888334 }, // Centre France
                
                // Configuration modules flexible
                moduleConfig: {
                    model: 'JKM-450M-60HL4',
                    manufacturer: 'JinkoSolar Holding Co. Ltd',
                    width: 2.0,
                    height: 1.0,
                    power: 450,
                    efficiency: 21.5
                },
                
                // Structures multiples
                structures: [],
                
                // CONSERVÉ pour compatibilité avec projets existants
                panels: [],
                
                configuration: {
                    orientation: 180,
                    inclination: 10,
                    spacing: 0.5
                },
                
                totalPower: 0,
                auditData: {
                    defectCount: 0,
                    efficiency: 100,
                    recommendations: []
                },
                
                // Métadonnées projet
                projectType: 'new',
                version: '2.0',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            let selectedPanels = new Set();
            let selectedStructureId = null;
            let map = null;

            // Initialisation de la carte
            function initializeMap() {
                map = L.map('mapContainer').setView([currentProject.coordinates.lat, currentProject.coordinates.lng], 18);
                
                // Couche satellite haute résolution
                L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                    attribution: 'Esri, DigitalGlobe, GeoEye, Earthstar Geographics',
                    maxZoom: 20
                }).addTo(map);
                
                // Événements carte
                map.on('zoomend moveend', function() {
                    renderCaleepinage();
                });
                
                // Chargement projet existant si disponible
                loadExistingProject();
            }

            // Génération automatique de calepinage pour une structure
            function generateCaleepinageForStructure(structure) {
                const config = currentProject.moduleConfig;
                const constraints = structure.constraints;
                
                // Zone utile après marges
                const usableLength = structure.dimensions.length - constraints.marginLeft - constraints.marginRight;
                const usableWidth = structure.dimensions.width - constraints.marginTop - constraints.marginBottom;
                
                // Calcul nombre de panneaux avec espacement
                const panelsPerRow = Math.floor(usableLength / (config.width + currentProject.configuration.spacing));
                const panelsPerColumn = Math.floor(usableWidth / (config.height + currentProject.configuration.spacing));
                
                // Génération panneaux
                structure.panels = [];
                
                for (let row = 0; row < panelsPerColumn; row++) {
                    for (let col = 0; col < panelsPerRow; col++) {
                        const panelId = structure.id + "_panel_" + row + "_" + col;
                        
                        // Position dans la structure (mètres)
                        const x = constraints.marginLeft + (col * (config.width + currentProject.configuration.spacing));
                        const y = constraints.marginTop + (row * (config.height + currentProject.configuration.spacing));
                        
                        // Calcul position GPS 
                        const offsetLat = (y / 111320) * Math.cos(structure.dimensions.orientation * Math.PI / 180);
                        const offsetLng = x / (111320 * Math.cos(currentProject.coordinates.lat * Math.PI / 180));
                        
                        const panel = {
                            id: panelId,
                            structureId: structure.id,
                            x: x,
                            y: y,
                            lat: currentProject.coordinates.lat + offsetLat,
                            lng: currentProject.coordinates.lng + offsetLng,
                            width: config.width,
                            height: config.height,
                            rotation: structure.dimensions.orientation,
                            status: 'ok',
                            power: config.power,
                            model: config.model,
                            manufacturer: config.manufacturer,
                            defects: [],
                            selected: false,
                            auditData: {} // Prêt pour données audit
                        };
                        
                        structure.panels.push(panel);
                        
                        // Ajout au tableau global pour compatibilité
                        currentProject.panels.push(panel);
                    }
                }
                
                console.log("Calepinage généré:", structure.panels.length + " panneaux pour " + structure.name);
                return structure.panels.length;
            }

            // Rendu du calepinage sur la carte
            function renderCaleepinage() {
                const overlay = document.getElementById('caleepinageOverlay');
                overlay.innerHTML = '';
                
                currentProject.structures.forEach(function(structure) {
                    // Rendu contour structure
                    renderStructureOutline(structure, overlay);
                    
                    // Rendu panneaux
                    structure.panels.forEach(function(panel) {
                        const panelElement = create3DPanel(panel);
                        overlay.appendChild(panelElement);
                    });
                });
                
                // Activation des interactions
                overlay.style.pointerEvents = 'auto';
            }

            // Rendu contour structure
            function renderStructureOutline(structure, container) {
                const bounds = calculateStructureBounds(structure);
                const topLeft = map.latLngToContainerPoint([bounds.north, bounds.west]);
                const bottomRight = map.latLngToContainerPoint([bounds.south, bounds.east]);
                
                const outline = document.createElement('div');
                outline.className = 'structure-outline';
                if (selectedStructureId === structure.id) {
                    outline.classList.add('active');
                }
                
                outline.style.left = topLeft.x + 'px';
                outline.style.top = topLeft.y + 'px';
                outline.style.width = (bottomRight.x - topLeft.x) + 'px';
                outline.style.height = (bottomRight.y - topLeft.y) + 'px';
                
                // Label structure
                const label = document.createElement('div');
                label.style.position = 'absolute';
                label.style.top = '5px';
                label.style.left = '5px';
                label.style.background = 'rgba(255,255,255,0.9)';
                label.style.padding = '2px 6px';
                label.style.borderRadius = '4px';
                label.style.fontSize = '10px';
                label.style.fontWeight = 'bold';
                label.textContent = structure.name + " (" + structure.panels.length + " panneaux)";
                outline.appendChild(label);
                
                container.appendChild(outline);
                
                // Événement clic structure
                outline.addEventListener('click', function() {
                    selectStructure(structure.id);
                });
                outline.style.pointerEvents = 'auto';
            }

            function calculateStructureBounds(structure) {
                const centerLat = currentProject.coordinates.lat;
                const centerLng = currentProject.coordinates.lng;
                
                const halfLength = structure.dimensions.length / 2;
                const halfWidth = structure.dimensions.width / 2;
                
                return {
                    north: centerLat + (halfWidth / 111320),
                    south: centerLat - (halfWidth / 111320),
                    east: centerLng + (halfLength / (111320 * Math.cos(centerLat * Math.PI / 180))),
                    west: centerLng - (halfLength / (111320 * Math.cos(centerLat * Math.PI / 180)))
                };
            }

            // Création d'un panneau 3D (identique au système existant)
            function create3DPanel(panel) {
                const panelDiv = document.createElement('div');
                panelDiv.className = "solar-panel-3d " + panel.status;
                panelDiv.id = panel.id;
                panelDiv.dataset.panelId = panel.id;
                panelDiv.dataset.structureId = panel.structureId;
                
                // Conversion coordonnées GPS -> pixels écran
                const point = map.latLngToContainerPoint([panel.lat, panel.lng]);
                
                // Dimensions 3D avec perspective
                const width = Math.max(20, panel.width * 15); // Scaling pour visibilité
                const height = Math.max(10, panel.height * 15);
                const perspective = Math.cos(currentProject.configuration.inclination * Math.PI / 180);
                
                panelDiv.style.left = (point.x - width/2) + 'px';
                panelDiv.style.top = (point.y - height/2) + 'px';
                panelDiv.style.width = width + 'px';
                panelDiv.style.height = (height * perspective) + 'px';
                panelDiv.style.transform = "rotateX(" + currentProject.configuration.inclination + "deg) rotateZ(" + (panel.rotation - 180) + "deg)";
                
                // Grille du panneau
                const grid = document.createElement('div');
                grid.className = 'panel-grid';
                panelDiv.appendChild(grid);
                
                // Événements (identiques au système existant)
                panelDiv.addEventListener('click', function(e) {
                    handlePanelClick(e, panel);
                });
                panelDiv.addEventListener('mouseover', function(e) {
                    showPanelTooltip(e, panel);
                });
                panelDiv.addEventListener('mouseleave', hidePanelTooltip);
                
                return panelDiv;
            }

            // Gestion clic panneau (CONSERVÉE IDENTIQUE)
            function handlePanelClick(event, panel) {
                event.stopPropagation();
                
                if (event.ctrlKey || event.metaKey) {
                    // Sélection multiple
                    if (selectedPanels.has(panel.id)) {
                        selectedPanels.delete(panel.id);
                        panel.selected = false;
                    } else {
                        selectedPanels.add(panel.id);
                        panel.selected = true;
                    }
                } else {
                    // Sélection simple
                    selectedPanels.clear();
                    getAllPanels().forEach(function(p) {
                        p.selected = false;
                    });
                    selectedPanels.add(panel.id);
                    panel.selected = true;
                }
                
                updatePanelSelection();
                updateSelectionUI();
            }

            // Tooltip panneau (CONSERVÉE IDENTIQUE)
            function showPanelTooltip(event, panel) {
                const structure = currentProject.structures.find(s => s.id === panel.structureId);
                const tooltip = document.getElementById('panelTooltip');
                tooltip.innerHTML = 
                    "<strong>" + panel.model + "</strong><br>" +
                    "Structure: " + (structure ? structure.name : 'N/A') + "<br>" +
                    "Position: " + Math.round(panel.x * 10)/10 + "m × " + Math.round(panel.y * 10)/10 + "m<br>" +
                    "Puissance: " + panel.power + "W<br>" +
                    "Statut: " + getStatusLabel(panel.status) + "<br>" +
                    (panel.defects.length > 0 ? "Défauts: " + panel.defects.length : "");
                tooltip.style.left = event.pageX + 'px';
                tooltip.style.top = event.pageY + 'px';
                tooltip.classList.remove('hidden');
            }

            function hidePanelTooltip() {
                document.getElementById('panelTooltip').classList.add('hidden');
            }

            function getStatusLabel(status) {
                const labels = {
                    'ok': 'OK',
                    'defaut_el': 'Défaut EL',
                    'defaut_thermo': 'Défaut Thermographie',
                    'defaut_iv': 'Défaut I-V',
                    'defaut_critique': 'Défaut Critique'
                };
                return labels[status] || 'Inconnu';
            }

            // Fonctions utilitaires
            function getAllPanels() {
                let allPanels = [];
                currentProject.structures.forEach(function(structure) {
                    allPanels = allPanels.concat(structure.panels);
                });
                return allPanels;
            }

            function updatePanelSelection() {
                getAllPanels().forEach(function(panel) {
                    const element = document.getElementById(panel.id);
                    if (element) {
                        if (panel.selected) {
                            element.classList.add('selected');
                        } else {
                            element.classList.remove('selected');
                        }
                    }
                });
            }

            // Changement de statut des panneaux (CONSERVÉ IDENTIQUE)
            function changeSelectedPanelsStatus(newStatus) {
                selectedPanels.forEach(function(panelId) {
                    const panel = findPanelById(panelId);
                    if (panel) {
                        panel.status = newStatus;
                        
                        // Mise à jour élément DOM
                        const element = document.getElementById(panelId);
                        if (element) {
                            element.className = "solar-panel-3d selected " + newStatus;
                        }
                    }
                });
                
                calculateStatistics();
                updateUI();
                saveToBackupSystem();
            }

            function findPanelById(panelId) {
                return getAllPanels().find(p => p.id === panelId);
            }

            // Calcul statistiques (CONSERVÉ IDENTIQUE)
            function calculateStatistics() {
                const stats = {
                    ok: 0,
                    defaut_el: 0,
                    defaut_thermo: 0,
                    defaut_iv: 0,
                    defaut_critique: 0
                };
                
                const allPanels = getAllPanels();
                allPanels.forEach(function(panel) {
                    stats[panel.status]++;
                });
                
                const totalPanels = allPanels.length;
                const defectCount = totalPanels - stats.ok;
                
                currentProject.auditData.defectCount = defectCount;
                currentProject.auditData.efficiency = totalPanels > 0 ? Math.round((stats.ok / totalPanels) * 100 * 10) / 10 : 100;
                currentProject.totalPower = totalPanels * currentProject.moduleConfig.power / 1000;
                
                return { stats, totalPanels };
            }

            // Mise à jour interface
            function updateUI() {
                const { stats, totalPanels } = calculateStatistics();
                
                // Statistiques
                document.getElementById('totalPanelsCount').textContent = totalPanels;
                document.getElementById('statsOk').textContent = stats.ok + " (" + (totalPanels > 0 ? Math.round(stats.ok/totalPanels*100) : 0) + "%)";
                document.getElementById('statsEl').textContent = stats.defaut_el + " (" + (totalPanels > 0 ? Math.round(stats.defaut_el/totalPanels*100) : 0) + "%)";
                document.getElementById('statsThermo').textContent = stats.defaut_thermo + " (" + (totalPanels > 0 ? Math.round(stats.defaut_thermo/totalPanels*100) : 0) + "%)";
                document.getElementById('totalPowerDisplay').textContent = Math.round(currentProject.totalPower * 10) / 10 + " kWc";
                document.getElementById('efficiency').textContent = currentProject.auditData.efficiency + "%";
                
                updateStructureTabs();
                updateSelectedStructureInfo();
            }

            function updateSelectionUI() {
                document.getElementById('selectedCount').textContent = selectedPanels.size;
                document.getElementById('selectionCount').textContent = selectedPanels.size;
                
                // Affichage structure sélectionnée
                if (selectedPanels.size > 0) {
                    const firstPanel = findPanelById(Array.from(selectedPanels)[0]);
                    if (firstPanel) {
                        const structure = currentProject.structures.find(s => s.id === firstPanel.structureId);
                        document.getElementById('selectedStructureName').textContent = structure ? structure.name : 'Inconnue';
                    }
                } else {
                    document.getElementById('selectedStructureName').textContent = 'Aucune';
                }
            }

            // Gestion des structures
            function addNewStructure() {
                const type = document.getElementById('newStructureType').value;
                const name = document.getElementById('newStructureName').value || (type + '_' + (currentProject.structures.length + 1));
                
                const structure = {
                    id: 'struct_' + Date.now(),
                    type: type,
                    name: name,
                    dimensions: {
                        length: parseFloat(document.getElementById('newStructureLength').value),
                        width: parseFloat(document.getElementById('newStructureWidth').value),
                        orientation: parseFloat(document.getElementById('newStructureOrientation').value),
                        inclination: parseFloat(document.getElementById('newStructureInclination').value)
                    },
                    constraints: {
                        marginTop: parseFloat(document.getElementById('newStructureMarginTop').value),
                        marginBottom: parseFloat(document.getElementById('newStructureMarginBottom').value),
                        marginLeft: parseFloat(document.getElementById('newStructureMarginLeft').value),
                        marginRight: parseFloat(document.getElementById('newStructureMarginRight').value),
                        obstacles: []
                    },
                    panels: []
                };
                
                currentProject.structures.push(structure);
                
                // Génération calepinage
                const panelCount = generateCaleepinageForStructure(structure);
                
                // Mise à jour interface
                updateUI();
                renderCaleepinage();
                selectStructure(structure.id);
                
                // Reset formulaire
                document.getElementById('newStructureName').value = '';
                
                console.log("Structure ajoutée:", name, "avec", panelCount, "panneaux");
            }

            function selectStructure(structureId) {
                selectedStructureId = structureId;
                updateUI();
                renderCaleepinage();
            }

            function updateStructureTabs() {
                const container = document.getElementById('structureTabs');
                container.innerHTML = '';
                
                currentProject.structures.forEach(function(structure) {
                    const tab = document.createElement('div');
                    tab.className = 'structure-tab';
                    if (selectedStructureId === structure.id) {
                        tab.classList.add('active');
                    }
                    tab.textContent = structure.name + " (" + structure.panels.length + ")";
                    tab.addEventListener('click', function() {
                        selectStructure(structure.id);
                    });
                    container.appendChild(tab);
                });
            }

            function updateSelectedStructureInfo() {
                const info = document.getElementById('selectedStructureConfig');
                if (selectedStructureId) {
                    const structure = currentProject.structures.find(s => s.id === selectedStructureId);
                    if (structure) {
                        info.style.display = 'block';
                        document.getElementById('currentStructureName').textContent = structure.name;
                        document.getElementById('currentStructureDims').textContent = structure.dimensions.length + "m × " + structure.dimensions.width + "m";
                        document.getElementById('currentStructurePanels').textContent = structure.panels.length + " panneaux";
                        document.getElementById('currentStructurePower').textContent = Math.round(structure.panels.length * currentProject.moduleConfig.power / 100) / 10 + " kWc";
                    }
                } else {
                    info.style.display = 'none';
                }
            }

            // Recherche et géolocalisation d'adresse (CONSERVÉE IDENTIQUE)
            async function searchAndLocalizeTerrain() {
                const address = document.getElementById('addressInput').value.trim();
                if (!address) return;
                
                try {
                    const response = await fetch("https://nominatim.openstreetmap.org/search?format=json&q=" + encodeURIComponent(address) + "&limit=1&countrycodes=fr");
                    const results = await response.json();
                    
                    if (results.length > 0) {
                        const result = results[0];
                        const lat = parseFloat(result.lat);
                        const lng = parseFloat(result.lon);
                        
                        // Mise à jour position
                        currentProject.coordinates = { lat, lng };
                        currentProject.address = result.display_name;
                        currentProject.name = address;
                        
                        // Centrage carte
                        map.setView([lat, lng], 18);
                        
                        // Recalcul positions GPS des panneaux existants
                        recalculateAllPanelPositions();
                        
                        renderCaleepinage();
                        
                        console.log('Terrain localisé:', { lat, lng });
                    }
                } catch (error) {
                    console.error('Erreur géocodage:', error);
                    alert('Erreur lors de la recherche d\\'adresse');
                }
            }

            function recalculateAllPanelPositions() {
                currentProject.structures.forEach(function(structure) {
                    structure.panels.forEach(function(panel) {
                        // Recalcul position GPS basé sur position relative dans structure
                        const offsetLat = (panel.y / 111320) * Math.cos(structure.dimensions.orientation * Math.PI / 180);
                        const offsetLng = panel.x / (111320 * Math.cos(currentProject.coordinates.lat * Math.PI / 180));
                        
                        panel.lat = currentProject.coordinates.lat + offsetLat;
                        panel.lng = currentProject.coordinates.lng + offsetLng;
                    });
                });
            }

            // Système de sauvegarde (CONSERVÉ IDENTIQUE)
            function saveToBackupSystem() {
                const data = {
                    timestamp: new Date().toISOString(),
                    project: currentProject,
                    selectedPanels: Array.from(selectedPanels),
                    selectedStructureId: selectedStructureId
                };
                
                // Niveau 1: LocalStorage
                try {
                    localStorage.setItem('diagpv_current_project_v2', JSON.stringify(data));
                } catch (e) {
                    console.warn('LocalStorage sauvegarde échouée');
                }
                
                // Niveau 2: IndexedDB
                saveToIndexedDB(data);
                
                console.log('Sauvegarde effectuée - Version 2.0 compatible');
            }

            async function saveToIndexedDB(data) {
                try {
                    const request = indexedDB.open('DiagPV_DB_v2', 1);
                    request.onupgradeneeded = function(e) {
                        const db = e.target.result;
                        if (!db.objectStoreNames.contains('projects')) {
                            db.createObjectStore('projects', { keyPath: 'id' });
                        }
                    };
                    request.onsuccess = function(e) {
                        const db = e.target.result;
                        const transaction = db.transaction(['projects'], 'readwrite');
                        const store = transaction.objectStore('projects');
                        store.put({ id: currentProject.id, data: data });
                    };
                } catch (e) {
                    console.warn('IndexedDB sauvegarde échouée');
                }
            }

            // Chargement projet existant (COMPATIBILITÉ RÉTROACTIVE)
            async function loadExistingProject() {
                try {
                    // Tentative chargement version 2.0
                    let saved = localStorage.getItem('diagpv_current_project_v2');
                    
                    // Si pas trouvé, tentative chargement version 1.0
                    if (!saved) {
                        saved = localStorage.getItem('diagpv_current_project');
                        if (saved) {
                            console.log('Migration projet v1.0 vers v2.0');
                            const oldData = JSON.parse(saved);
                            // Migration des données v1 vers v2
                            migrateProjectV1ToV2(oldData);
                            return;
                        }
                    }
                    
                    if (saved) {
                        const data = JSON.parse(saved);
                        currentProject = data.project;
                        selectedPanels = new Set(data.selectedPanels || []);
                        selectedStructureId = data.selectedStructureId || null;
                        
                        // Mise à jour configuration modules UI
                        updateModuleConfigUI();
                        
                        map.setView([currentProject.coordinates.lat, currentProject.coordinates.lng], 18);
                        renderCaleepinage();
                        updateUI();
                        updateSelectionUI();
                        updatePanelSelection();
                        
                        console.log('Projet v2.0 restauré:', currentProject.structures.length + ' structures');
                    }
                } catch (e) {
                    console.warn('Chargement projet échoué:', e);
                }
            }

            // Migration v1 vers v2 (COMPATIBILITÉ RÉTROACTIVE)
            function migrateProjectV1ToV2(oldData) {
                console.log('Migration v1->v2:', oldData);
                
                if (oldData.solarFarm) {
                    // Structure des données v1.0
                    const farm = oldData.solarFarm;
                    
                    currentProject.id = farm.id || ('project_' + Date.now());
                    currentProject.name = farm.name || '';
                    currentProject.address = farm.address || '';
                    currentProject.coordinates = farm.coordinates || { lat: 46.603354, lng: 1.888334 };
                    currentProject.configuration = farm.configuration || { orientation: 180, inclination: 10, spacing: 0.5 };
                    currentProject.auditData = farm.auditData || { defectCount: 0, efficiency: 100, recommendations: [] };
                    
                    // Migration panneaux vers structure unique
                    if (farm.panels && farm.panels.length > 0) {
                        const migratedStructure = {
                            id: 'migrated_structure_' + Date.now(),
                            type: 'batiment_industriel',
                            name: 'Structure Migrée V1',
                            dimensions: {
                                length: (farm.configuration.columns || 10) * 2.5,
                                width: (farm.configuration.rows || 6) * 1.5,
                                orientation: farm.configuration.orientation || 180,
                                inclination: farm.configuration.inclination || 10
                            },
                            constraints: {
                                marginTop: 1,
                                marginBottom: 1,
                                marginLeft: 1,
                                marginRight: 1,
                                obstacles: []
                            },
                            panels: []
                        };
                        
                        // Migration des panneaux
                        farm.panels.forEach(function(oldPanel) {
                            const migratedPanel = {
                                id: oldPanel.id,
                                structureId: migratedStructure.id,
                                x: oldPanel.x || 0,
                                y: oldPanel.y || 0,
                                lat: oldPanel.lat,
                                lng: oldPanel.lng,
                                width: oldPanel.width || 2.0,
                                height: oldPanel.height || 1.0,
                                rotation: oldPanel.rotation || 180,
                                status: oldPanel.status || 'ok',
                                power: oldPanel.power || 450,
                                model: oldPanel.model || 'JKM-450M-60HL4',
                                manufacturer: oldPanel.manufacturer || 'JinkoSolar Holding Co. Ltd',
                                defects: oldPanel.defects || [],
                                selected: oldPanel.selected || false,
                                auditData: oldPanel.auditData || {}
                            };
                            
                            migratedStructure.panels.push(migratedPanel);
                            currentProject.panels.push(migratedPanel);
                        });
                        
                        currentProject.structures.push(migratedStructure);
                        console.log('Structure migrée créée avec', migratedStructure.panels.length, 'panneaux');
                    }
                    
                    // Sauvegarde version migrée
                    saveToBackupSystem();
                    
                    // Mise à jour interface
                    updateModuleConfigUI();
                    map.setView([currentProject.coordinates.lat, currentProject.coordinates.lng], 18);
                    renderCaleepinage();
                    updateUI();
                }
            }

            function updateModuleConfigUI() {
                const config = currentProject.moduleConfig;
                document.getElementById('moduleModel').value = config.model;
                document.getElementById('modulePower').value = config.power;
                document.getElementById('moduleWidth').value = config.width;
                document.getElementById('moduleHeight').value = config.height;
                document.getElementById('moduleManufacturer').value = config.manufacturer;
            }

            function updateModuleConfigFromUI() {
                currentProject.moduleConfig = {
                    model: document.getElementById('moduleModel').value,
                    manufacturer: document.getElementById('moduleManufacturer').value,
                    width: parseFloat(document.getElementById('moduleWidth').value),
                    height: parseFloat(document.getElementById('moduleHeight').value),
                    power: parseFloat(document.getElementById('modulePower').value),
                    efficiency: currentProject.moduleConfig.efficiency
                };
                
                // Mise à jour tous panneaux existants
                getAllPanels().forEach(function(panel) {
                    panel.model = currentProject.moduleConfig.model;
                    panel.manufacturer = currentProject.moduleConfig.manufacturer;
                    panel.power = currentProject.moduleConfig.power;
                    panel.width = currentProject.moduleConfig.width;
                    panel.height = currentProject.moduleConfig.height;
                });
                
                updateUI();
                saveToBackupSystem();
            }

            // Événements
            document.addEventListener('DOMContentLoaded', function() {
                initializeMap();
                
                // Recherche adresse
                document.getElementById('searchAddress').addEventListener('click', searchAndLocalizeTerrain);
                document.getElementById('addressInput').addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') searchAndLocalizeTerrain();
                });
                
                // Configuration modules
                document.getElementById('moduleModel').addEventListener('change', updateModuleConfigFromUI);
                document.getElementById('modulePower').addEventListener('change', updateModuleConfigFromUI);
                document.getElementById('moduleWidth').addEventListener('change', updateModuleConfigFromUI);
                document.getElementById('moduleHeight').addEventListener('change', updateModuleConfigFromUI);
                document.getElementById('moduleManufacturer').addEventListener('change', updateModuleConfigFromUI);
                
                // Gestion structures
                document.getElementById('addStructure').addEventListener('click', addNewStructure);
                
                document.getElementById('recalculateStructure').addEventListener('click', function() {
                    if (selectedStructureId) {
                        const structure = currentProject.structures.find(s => s.id === selectedStructureId);
                        if (structure) {
                            generateCaleepinageForStructure(structure);
                            renderCaleepinage();
                            updateUI();
                        }
                    }
                });
                
                document.getElementById('deleteStructure').addEventListener('click', function() {
                    if (selectedStructureId && confirm('Supprimer cette structure et tous ses panneaux ?')) {
                        currentProject.structures = currentProject.structures.filter(s => s.id !== selectedStructureId);
                        currentProject.panels = currentProject.panels.filter(p => p.structureId !== selectedStructureId);
                        selectedStructureId = null;
                        selectedPanels.clear();
                        renderCaleepinage();
                        updateUI();
                        updateSelectionUI();
                    }
                });
                
                // Changement statut (CONSERVÉ IDENTIQUE)
                document.querySelectorAll('.status-btn').forEach(function(btn) {
                    btn.addEventListener('click', function() {
                        if (selectedPanels.size > 0) {
                            const status = btn.dataset.status;
                            changeSelectedPanelsStatus(status);
                        } else {
                            alert('Veuillez sélectionner des panneaux à modifier');
                        }
                    });
                });
                
                // Sélection multiple (CONSERVÉE IDENTIQUE)
                document.getElementById('selectAll').addEventListener('click', function() {
                    selectedPanels.clear();
                    getAllPanels().forEach(function(panel) {
                        selectedPanels.add(panel.id);
                        panel.selected = true;
                    });
                    updatePanelSelection();
                    updateSelectionUI();
                });
                
                document.getElementById('clearSelection').addEventListener('click', function() {
                    selectedPanels.clear();
                    getAllPanels().forEach(function(panel) {
                        panel.selected = false;
                    });
                    updatePanelSelection();
                    updateSelectionUI();
                });
                
                // Contrôles calepinage
                document.getElementById('showAllStructures').addEventListener('click', function() {
                    currentProject.structures.forEach(function(structure) {
                        // Logique affichage toutes structures
                    });
                    renderCaleepinage();
                });
                
                document.getElementById('hideAllStructures').addEventListener('click', function() {
                    selectedStructureId = null;
                    renderCaleepinage();
                    updateUI();
                });
                
                // Sauvegarde
                document.getElementById('saveProject').addEventListener('click', saveToBackupSystem);
                
                console.log('DiagPV Hub v2.0 initialisé - Compatible projets existants');
            });
        </script>
    </body>
    </html>
  `)
})

// API routes (conservées identiques)
app.post('/api/save-project', async (c) => {
  try {
    const data = await c.req.json()
    
    if (c.env?.DB) {
      await c.env.DB.prepare(
        `INSERT OR REPLACE INTO projects (id, data, timestamp) VALUES (?, ?, ?)`
      ).bind(
        data.project.id,
        JSON.stringify(data),
        data.timestamp
      ).run()
    }
    
    return c.json({ success: true, message: 'Projet sauvegardé' })
  } catch (error) {
    console.error('Erreur sauvegarde:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

app.get('/api/load-project/:id', async (c) => {
  try {
    const projectId = c.req.param('id')
    
    if (c.env?.DB) {
      const result = await c.env.DB.prepare(
        `SELECT * FROM projects WHERE id = ? ORDER BY timestamp DESC LIMIT 1`
      ).bind(projectId).first()
      
      if (result) {
        return c.json({ success: true, data: JSON.parse(result.data) })
      }
    }
    
    return c.json({ success: false, message: 'Projet non trouvé' }, 404)
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

export default app