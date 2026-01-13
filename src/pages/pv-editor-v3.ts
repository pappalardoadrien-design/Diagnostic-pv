// ============================================================================
// PV CARTOGRAPHY EDITOR V3 - DiagPV OS Design
// ============================================================================
// Interface moderne, intuitive et professionnelle pour la modélisation PV
// Interconnecté avec CRM, PV Plants, et Audit EL
// ============================================================================

export function getPvEditorV3Page(plantId: string, zoneId: string): string {
  const buildTimestamp = Date.now()
  
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Éditeur PV V3 - DiagPV OS</title>
    <meta name="build" content="${buildTimestamp}">
    
    <!-- Styles -->
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    
    <!-- Leaflet -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <link rel="stylesheet" href="https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.css" />
    <script src="https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.js"></script>
    <link rel="stylesheet" href="https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.css" />
    <script src="https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@turf/turf@6/turf.min.js"></script>
    
    <!-- PDF Export -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
    
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: { sans: ['Inter', 'sans-serif'] },
                    colors: {
                        diagpv: {
                            primary: '#7c3aed',
                            secondary: '#f59e0b', 
                            success: '#22c55e',
                            danger: '#ef4444',
                            dark: '#1e293b'
                        }
                    }
                }
            }
        }
    </script>
    
    <style>
        body { font-family: 'Inter', sans-serif; }
        
        /* Map Container */
        #map { 
            height: calc(100vh - 140px); 
            width: 100%; 
            border-radius: 12px;
            border: 2px solid #e2e8f0;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        }
        
        /* Module Colors */
        .module-ok { background: linear-gradient(135deg, #22c55e, #16a34a); }
        .module-inequality { background: linear-gradient(135deg, #eab308, #ca8a04); }
        .module-microcracks { background: linear-gradient(135deg, #f97316, #ea580c); }
        .module-dead { background: linear-gradient(135deg, #ef4444, #dc2626); animation: pulse-danger 2s infinite; }
        .module-string_open { background: linear-gradient(135deg, #3b82f6, #2563eb); }
        .module-not_connected { background: linear-gradient(135deg, #6b7280, #4b5563); }
        .module-pending { background: linear-gradient(135deg, #f1f5f9, #e2e8f0); border: 2px dashed #94a3b8; }
        
        @keyframes pulse-danger {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(0.98); }
        }
        
        /* Tool Button */
        .tool-btn {
            transition: all 0.2s ease;
            position: relative;
        }
        .tool-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
        }
        .tool-btn.active {
            background: linear-gradient(135deg, #7c3aed, #6d28d9) !important;
            color: white;
            box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.3);
        }
        
        /* Sidebar Panel */
        .panel-card {
            background: white;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .panel-header {
            background: linear-gradient(135deg, #f8fafc, #f1f5f9);
            padding: 12px 16px;
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .panel-header i {
            color: #7c3aed;
        }
        .panel-body {
            padding: 16px;
        }
        
        /* String Badge */
        .string-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }
        .string-badge:hover {
            transform: scale(1.05);
        }
        
        /* Module Grid */
        .module-grid {
            display: grid;
            gap: 3px;
            padding: 8px;
            background: #f8fafc;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        }
        .module-cell {
            width: 28px;
            height: 22px;
            border-radius: 3px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 8px;
            font-weight: 700;
            color: white;
            cursor: pointer;
            transition: all 0.15s;
        }
        .module-cell:hover {
            transform: scale(1.15);
            z-index: 10;
        }
        
        /* Floating Action Buttons */
        .fab {
            position: fixed;
            bottom: 24px;
            right: 24px;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            color: white;
            box-shadow: 0 4px 14px rgba(0,0,0,0.25);
            cursor: pointer;
            transition: all 0.3s;
            z-index: 1000;
        }
        .fab:hover {
            transform: scale(1.1);
        }
        
        /* Status Bar */
        .status-bar {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #1e293b, #334155);
            color: white;
            padding: 8px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 12px;
            z-index: 999;
        }
        
        /* Interconnection Badge */
        .interconnect-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 600;
        }
        
        /* Scrollbar */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 3px; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        
        /* Leaflet Customizations */
        .leaflet-draw-toolbar a {
            background-color: #7c3aed !important;
        }
        .leaflet-draw-toolbar a:hover {
            background-color: #6d28d9 !important;
        }
    </style>
</head>
<body class="bg-slate-50 min-h-screen">
    
    <!-- Header -->
    <header class="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div class="max-w-screen-2xl mx-auto px-4 py-3">
            <div class="flex items-center justify-between">
                <!-- Left: Navigation -->
                <div class="flex items-center gap-4">
                    <a href="/pv/plant/${plantId}" class="flex items-center gap-2 text-slate-600 hover:text-diagpv-primary transition-colors">
                        <i class="fas fa-arrow-left"></i>
                        <span class="font-medium">Retour</span>
                    </a>
                    <div class="h-6 w-px bg-slate-300"></div>
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-gradient-to-br from-diagpv-primary to-purple-600 rounded-xl flex items-center justify-center">
                            <i class="fas fa-solar-panel text-white"></i>
                        </div>
                        <div>
                            <h1 id="zoneName" class="font-bold text-slate-800">Chargement...</h1>
                            <p id="plantName" class="text-xs text-slate-500">Centrale PV</p>
                        </div>
                    </div>
                </div>
                
                <!-- Center: Tools -->
                <div class="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl">
                    <button id="toolSelect" class="tool-btn active px-4 py-2 rounded-lg text-sm font-medium bg-white shadow-sm" title="Sélectionner">
                        <i class="fas fa-mouse-pointer mr-2"></i>Sélection
                    </button>
                    <button id="toolRoof" class="tool-btn px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-white" title="Dessiner toiture">
                        <i class="fas fa-draw-polygon mr-2"></i>Toiture
                    </button>
                    <button id="toolString" class="tool-btn px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-white" title="Ajouter string">
                        <i class="fas fa-grip-lines mr-2"></i>String
                    </button>
                    <button id="toolModule" class="tool-btn px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-white" title="Placer modules">
                        <i class="fas fa-th mr-2"></i>Modules
                    </button>
                    <button id="toolCable" class="tool-btn px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-white" title="Câblage">
                        <i class="fas fa-project-diagram mr-2"></i>Câblage
                    </button>
                </div>
                
                <!-- Right: Actions -->
                <div class="flex items-center gap-3">
                    <!-- Interconnection Status -->
                    <div id="interconnectStatus" class="hidden">
                        <div class="interconnect-badge bg-purple-100 text-purple-700">
                            <i class="fas fa-link"></i>
                            <span id="elAuditLink">Audit EL lié</span>
                        </div>
                    </div>
                    
                    <button id="btnUndo" class="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors" title="Annuler">
                        <i class="fas fa-undo"></i>
                    </button>
                    <button id="btnRedo" class="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors" title="Refaire">
                        <i class="fas fa-redo"></i>
                    </button>
                    <div class="h-6 w-px bg-slate-300"></div>
                    <button id="btnSave" class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all shadow-sm">
                        <i class="fas fa-save"></i>
                        <span>Enregistrer</span>
                    </button>
                    <button id="btnExport" class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm">
                        <i class="fas fa-file-pdf"></i>
                        <span>Export</span>
                    </button>
                </div>
            </div>
        </div>
    </header>
    
    <!-- Main Content -->
    <div class="flex">
        <!-- Left Sidebar -->
        <aside class="w-80 bg-white border-r border-slate-200 h-[calc(100vh-65px)] overflow-y-auto p-4 space-y-4">
            
            <!-- Client Info Card -->
            <div class="panel-card">
                <div class="panel-header">
                    <i class="fas fa-building"></i>
                    <span class="font-semibold text-slate-700">Informations</span>
                </div>
                <div class="panel-body space-y-3">
                    <div class="flex items-center justify-between">
                        <span class="text-xs text-slate-500">Client</span>
                        <span id="clientName" class="text-sm font-medium text-slate-800">-</span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-xs text-slate-500">Centrale</span>
                        <span id="plantNameInfo" class="text-sm font-medium text-slate-800">-</span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-xs text-slate-500">Zone</span>
                        <span id="zoneNameInfo" class="text-sm font-medium text-diagpv-primary">-</span>
                    </div>
                    <div class="pt-2 border-t border-slate-100">
                        <a id="crmLink" href="#" class="text-xs text-diagpv-primary hover:underline flex items-center gap-1">
                            <i class="fas fa-external-link-alt"></i>
                            Voir dans CRM
                        </a>
                    </div>
                </div>
            </div>
            
            <!-- Configuration Card -->
            <div class="panel-card">
                <div class="panel-header">
                    <i class="fas fa-sliders-h"></i>
                    <span class="font-semibold text-slate-700">Configuration</span>
                </div>
                <div class="panel-body space-y-4">
                    <div>
                        <label class="block text-xs font-medium text-slate-600 mb-1">Type de module</label>
                        <select id="moduleType" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-diagpv-primary focus:border-diagpv-primary">
                            <option value="185">185 Wc (Standard)</option>
                            <option value="300">300 Wc</option>
                            <option value="400">400 Wc</option>
                            <option value="450">450 Wc (Premium)</option>
                            <option value="custom">Personnalisé...</option>
                        </select>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-medium text-slate-600 mb-1">Largeur (m)</label>
                            <input type="number" id="moduleWidth" value="1.7" step="0.01" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-diagpv-primary">
                        </div>
                        <div>
                            <label class="block text-xs font-medium text-slate-600 mb-1">Hauteur (m)</label>
                            <input type="number" id="moduleHeight" value="1.0" step="0.01" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-diagpv-primary">
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-medium text-slate-600 mb-1">Azimut (°)</label>
                            <input type="number" id="azimuth" value="180" min="0" max="360" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-diagpv-primary">
                        </div>
                        <div>
                            <label class="block text-xs font-medium text-slate-600 mb-1">Inclinaison (°)</label>
                            <input type="number" id="tilt" value="30" min="0" max="90" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-diagpv-primary">
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Quick Add String -->
            <div class="panel-card">
                <div class="panel-header">
                    <i class="fas fa-plus-circle"></i>
                    <span class="font-semibold text-slate-700">Ajouter String</span>
                </div>
                <div class="panel-body space-y-3">
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-medium text-slate-600 mb-1">Rangées</label>
                            <input type="number" id="stringRows" value="1" min="1" max="20" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-diagpv-primary">
                        </div>
                        <div>
                            <label class="block text-xs font-medium text-slate-600 mb-1">Colonnes</label>
                            <input type="number" id="stringCols" value="14" min="1" max="50" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-diagpv-primary">
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-slate-600 mb-1">N° String</label>
                        <input type="text" id="stringNumber" value="A1" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-diagpv-primary">
                    </div>
                    <div class="bg-slate-50 rounded-lg p-3">
                        <div class="flex justify-between text-xs">
                            <span class="text-slate-500">Modules</span>
                            <span id="stringModuleCount" class="font-bold text-diagpv-primary">14</span>
                        </div>
                        <div class="flex justify-between text-xs mt-1">
                            <span class="text-slate-500">Puissance</span>
                            <span id="stringPower" class="font-bold text-diagpv-secondary">2.59 kWc</span>
                        </div>
                    </div>
                    <button id="btnAddString" class="w-full py-2.5 bg-gradient-to-r from-diagpv-primary to-purple-600 text-white rounded-lg font-medium hover:from-purple-600 hover:to-purple-700 transition-all">
                        <i class="fas fa-plus mr-2"></i>Ajouter ce String
                    </button>
                </div>
            </div>
            
            <!-- Strings List -->
            <div class="panel-card">
                <div class="panel-header">
                    <i class="fas fa-list"></i>
                    <span class="font-semibold text-slate-700">Strings</span>
                    <span id="stringsCount" class="ml-auto bg-diagpv-primary text-white text-xs px-2 py-0.5 rounded-full">0</span>
                </div>
                <div class="panel-body">
                    <div id="stringsList" class="space-y-2 max-h-48 overflow-y-auto">
                        <p class="text-xs text-slate-400 text-center py-4">Aucun string configuré</p>
                    </div>
                </div>
            </div>
            
            <!-- EL Audit Link -->
            <div class="panel-card border-diagpv-secondary">
                <div class="panel-header bg-gradient-to-r from-amber-50 to-orange-50">
                    <i class="fas fa-bolt text-diagpv-secondary"></i>
                    <span class="font-semibold text-slate-700">Audit EL</span>
                </div>
                <div class="panel-body">
                    <div id="elAuditSection">
                        <div id="elNotLinked" class="text-center py-4">
                            <i class="fas fa-unlink text-3xl text-slate-300 mb-2"></i>
                            <p class="text-xs text-slate-500 mb-3">Aucun audit EL lié</p>
                            <button id="btnLinkEL" class="px-4 py-2 bg-diagpv-secondary text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors">
                                <i class="fas fa-link mr-2"></i>Lier un audit
                            </button>
                        </div>
                        <div id="elLinked" class="hidden">
                            <div class="flex items-center gap-3 mb-3">
                                <div class="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-bolt text-white"></i>
                                </div>
                                <div class="flex-1">
                                    <p id="elAuditName" class="font-medium text-slate-800 text-sm">-</p>
                                    <p id="elAuditModules" class="text-xs text-slate-500">- modules</p>
                                </div>
                            </div>
                            <div class="flex gap-2">
                                <a id="btnViewEL" href="#" class="flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium text-center hover:bg-slate-200 transition-colors">
                                    <i class="fas fa-eye mr-1"></i>Voir
                                </a>
                                <button id="btnSyncEL" class="flex-1 py-2 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition-colors">
                                    <i class="fas fa-sync mr-1"></i>Sync
                                </button>
                                <button id="btnUnlinkEL" class="py-2 px-3 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 transition-colors">
                                    <i class="fas fa-unlink"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
        
        <!-- Map Container -->
        <main class="flex-1 p-4">
            <div id="map" class="relative">
                <!-- Map will be initialized here -->
            </div>
            
            <!-- Map Controls Overlay -->
            <div class="absolute top-20 right-8 z-[1000] space-y-2">
                <button id="btnZoomIn" class="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors">
                    <i class="fas fa-plus"></i>
                </button>
                <button id="btnZoomOut" class="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors">
                    <i class="fas fa-minus"></i>
                </button>
                <div class="h-px bg-slate-200 my-1"></div>
                <button id="btnSatellite" class="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors" title="Vue satellite">
                    <i class="fas fa-satellite"></i>
                </button>
                <button id="btnStreet" class="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors" title="Vue plan">
                    <i class="fas fa-map"></i>
                </button>
            </div>
        </main>
        
        <!-- Right Sidebar - Statistics -->
        <aside class="w-72 bg-white border-l border-slate-200 h-[calc(100vh-65px)] overflow-y-auto p-4 space-y-4">
            
            <!-- Summary Stats -->
            <div class="panel-card">
                <div class="panel-header">
                    <i class="fas fa-chart-pie"></i>
                    <span class="font-semibold text-slate-700">Résumé</span>
                </div>
                <div class="panel-body">
                    <div class="grid grid-cols-2 gap-4">
                        <div class="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                            <div id="totalModules" class="text-2xl font-bold text-diagpv-primary">0</div>
                            <div class="text-xs text-slate-600">Modules</div>
                        </div>
                        <div class="text-center p-3 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl">
                            <div id="totalPower" class="text-2xl font-bold text-diagpv-secondary">0</div>
                            <div class="text-xs text-slate-600">kWc</div>
                        </div>
                        <div class="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                            <div id="totalStrings" class="text-2xl font-bold text-green-600">0</div>
                            <div class="text-xs text-slate-600">Strings</div>
                        </div>
                        <div class="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                            <div id="totalArea" class="text-2xl font-bold text-blue-600">0</div>
                            <div class="text-xs text-slate-600">m²</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Module Status -->
            <div class="panel-card">
                <div class="panel-header">
                    <i class="fas fa-heartbeat"></i>
                    <span class="font-semibold text-slate-700">État des modules</span>
                </div>
                <div class="panel-body space-y-2">
                    <div class="flex items-center justify-between py-2 border-b border-slate-100">
                        <div class="flex items-center gap-2">
                            <div class="w-3 h-3 rounded-full bg-green-500"></div>
                            <span class="text-sm text-slate-600">OK</span>
                        </div>
                        <span id="statusOk" class="font-bold text-slate-800">0</span>
                    </div>
                    <div class="flex items-center justify-between py-2 border-b border-slate-100">
                        <div class="flex items-center gap-2">
                            <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <span class="text-sm text-slate-600">Inégalité</span>
                        </div>
                        <span id="statusInequality" class="font-bold text-slate-800">0</span>
                    </div>
                    <div class="flex items-center justify-between py-2 border-b border-slate-100">
                        <div class="flex items-center gap-2">
                            <div class="w-3 h-3 rounded-full bg-orange-500"></div>
                            <span class="text-sm text-slate-600">Microfissures</span>
                        </div>
                        <span id="statusMicrocracks" class="font-bold text-slate-800">0</span>
                    </div>
                    <div class="flex items-center justify-between py-2 border-b border-slate-100">
                        <div class="flex items-center gap-2">
                            <div class="w-3 h-3 rounded-full bg-red-500"></div>
                            <span class="text-sm text-slate-600">HS / À remplacer</span>
                        </div>
                        <span id="statusDead" class="font-bold text-red-600">0</span>
                    </div>
                    <div class="flex items-center justify-between py-2">
                        <div class="flex items-center gap-2">
                            <div class="w-3 h-3 rounded-full bg-slate-300"></div>
                            <span class="text-sm text-slate-600">En attente</span>
                        </div>
                        <span id="statusPending" class="font-bold text-slate-800">0</span>
                    </div>
                </div>
            </div>
            
            <!-- Electrical Config -->
            <div class="panel-card">
                <div class="panel-header">
                    <i class="fas fa-plug"></i>
                    <span class="font-semibold text-slate-700">Configuration</span>
                </div>
                <div class="panel-body space-y-3">
                    <div class="flex items-center justify-between">
                        <span class="text-sm text-slate-600">Onduleurs</span>
                        <span id="inverterCount" class="font-bold text-slate-800">1</span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-sm text-slate-600">Boîtes jonction</span>
                        <span id="junctionBoxCount" class="font-bold text-slate-800">0</span>
                    </div>
                    <div class="pt-2 border-t border-slate-100">
                        <button id="btnEditConfig" class="w-full py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors">
                            <i class="fas fa-cog mr-2"></i>Modifier config
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Mini Plan Preview -->
            <div class="panel-card">
                <div class="panel-header">
                    <i class="fas fa-th"></i>
                    <span class="font-semibold text-slate-700">Aperçu calepinage</span>
                </div>
                <div class="panel-body">
                    <div id="miniPlanPreview" class="module-grid" style="grid-template-columns: repeat(14, 1fr);">
                        <!-- Mini preview will be generated here -->
                        <p class="text-xs text-slate-400 text-center py-4 col-span-full">Aucun module</p>
                    </div>
                </div>
            </div>
        </aside>
    </div>
    
    <!-- Status Bar -->
    <div class="status-bar">
        <div class="flex items-center gap-4">
            <span class="flex items-center gap-2">
                <i class="fas fa-crosshairs text-diagpv-primary"></i>
                <span id="cursorPosition">--, --</span>
            </span>
            <span class="flex items-center gap-2">
                <i class="fas fa-expand text-diagpv-secondary"></i>
                <span id="zoomLevel">Zoom: 18</span>
            </span>
        </div>
        <div class="flex items-center gap-4">
            <span id="lastSaved" class="text-slate-400">Non enregistré</span>
            <span class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span>DiagPV OS v3.0</span>
            </span>
        </div>
    </div>
    
    <!-- Modals -->
    
    <!-- String Config Modal -->
    <div id="stringConfigModal" class="fixed inset-0 bg-black/50 z-50 hidden flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div class="p-6 border-b border-slate-200">
                <h3 class="text-xl font-bold text-slate-800">Configurer String</h3>
            </div>
            <div class="p-6 space-y-4">
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">Nom du string</label>
                    <input type="text" id="modalStringName" class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-diagpv-primary focus:border-diagpv-primary">
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">Modules par string</label>
                        <input type="number" id="modalModulesPerString" value="14" class="w-full px-4 py-3 border border-slate-300 rounded-xl text-center focus:ring-2 focus:ring-diagpv-primary">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">Onduleur/DC</label>
                        <select id="modalStringDC" class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-diagpv-primary">
                            <option value="DC1">DC1</option>
                            <option value="DC2">DC2</option>
                            <option value="DC3">DC3</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="p-6 border-t border-slate-200 flex justify-end gap-3">
                <button id="btnCancelStringModal" class="px-6 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors">Annuler</button>
                <button id="btnSaveStringModal" class="px-6 py-2.5 bg-gradient-to-r from-diagpv-primary to-purple-600 text-white rounded-xl font-medium hover:from-purple-600 hover:to-purple-700 transition-all">Enregistrer</button>
            </div>
        </div>
    </div>
    
    <!-- Link EL Audit Modal -->
    <div id="linkELModal" class="fixed inset-0 bg-black/50 z-50 hidden flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div class="p-6 border-b border-slate-200">
                <h3 class="text-xl font-bold text-slate-800">Lier un Audit EL</h3>
                <p class="text-sm text-slate-500 mt-1">Sélectionnez un audit existant ou créez-en un nouveau</p>
            </div>
            <div class="p-6">
                <div id="availableAudits" class="space-y-3 max-h-64 overflow-y-auto">
                    <p class="text-center text-slate-400 py-4">Chargement des audits...</p>
                </div>
            </div>
            <div class="p-6 border-t border-slate-200 flex justify-between">
                <button id="btnCreateNewEL" class="px-4 py-2.5 bg-diagpv-secondary text-white rounded-xl font-medium hover:bg-amber-600 transition-colors">
                    <i class="fas fa-plus mr-2"></i>Créer nouvel audit
                </button>
                <button id="btnCancelLinkEL" class="px-6 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors">Fermer</button>
            </div>
        </div>
    </div>

    <!-- JavaScript -->
    <script>
    // ============================================================================
    // PV EDITOR V3 - MAIN APPLICATION
    // ============================================================================
    
    const PLANT_ID = '${plantId}'
    const ZONE_ID = '${zoneId}'
    
    // State
    let map = null
    let drawControl = null
    let currentTool = 'select'
    let plantData = null
    let zoneData = null
    let linkedAudit = null
    let modules = []
    let strings = []
    let unsavedChanges = false
    
    // Layers
    let roofLayer = null
    let modulesLayer = null
    let stringsLayer = null
    let cablingLayer = null
    
    // ============================================================================
    // INITIALIZATION
    // ============================================================================
    
    async function init() {
        console.log('🚀 DiagPV Editor V3 - Initializing...')
        
        // Initialize map
        initMap()
        
        // Load data
        await loadPlantData()
        await loadZoneData()
        await loadModules()
        await checkELLink()
        
        // Setup UI
        setupEventListeners()
        updateStats()
        updateMiniPreview()
        
        console.log('✅ Editor V3 ready!')
    }
    
    function initMap() {
        // Default center (France)
        const defaultCenter = [43.6, 1.4]
        
        map = L.map('map', {
            center: defaultCenter,
            zoom: 18,
            zoomControl: false
        })
        
        // Satellite layer (default)
        const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Esri',
            maxZoom: 21
        }).addTo(map)
        
        // Street layer
        const street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: 'OSM',
            maxZoom: 21
        })
        
        // Initialize layers
        roofLayer = L.featureGroup().addTo(map)
        modulesLayer = L.featureGroup().addTo(map)
        stringsLayer = L.featureGroup().addTo(map)
        cablingLayer = L.featureGroup().addTo(map)
        
        // Draw control
        drawControl = new L.Control.Draw({
            draw: {
                polygon: {
                    allowIntersection: false,
                    shapeOptions: { color: '#f59e0b', weight: 3, fillOpacity: 0.2 }
                },
                rectangle: {
                    shapeOptions: { color: '#7c3aed', weight: 2, fillOpacity: 0.3 }
                },
                polyline: false,
                circle: false,
                circlemarker: false,
                marker: false
            },
            edit: {
                featureGroup: roofLayer
            }
        })
        
        // Map events
        map.on('mousemove', (e) => {
            document.getElementById('cursorPosition').textContent = 
                e.latlng.lat.toFixed(6) + ', ' + e.latlng.lng.toFixed(6)
        })
        
        map.on('zoomend', () => {
            document.getElementById('zoomLevel').textContent = 'Zoom: ' + map.getZoom()
        })
        
        // Layer toggle
        document.getElementById('btnSatellite').onclick = () => {
            map.removeLayer(street)
            map.addLayer(satellite)
        }
        document.getElementById('btnStreet').onclick = () => {
            map.removeLayer(satellite)
            map.addLayer(street)
        }
        
        // Zoom controls
        document.getElementById('btnZoomIn').onclick = () => map.zoomIn()
        document.getElementById('btnZoomOut').onclick = () => map.zoomOut()
        
        // Geocoder - Recherche d'adresse
        L.Control.geocoder({
            defaultMarkGeocode: false,
            placeholder: 'Rechercher une adresse...',
            errorMessage: 'Adresse non trouvée',
            position: 'topleft',
            collapsed: false
        })
        .on('markgeocode', function(e) {
            const latlng = e.geocode.center
            map.setView(latlng, 19)
            
            // Marqueur temporaire
            const marker = L.marker(latlng, {
                icon: L.divIcon({
                    className: 'geocode-marker',
                    html: '<div style="background: #7c3aed; color: white; padding: 10px; border-radius: 50%; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 4px 12px rgba(124,58,237,0.4);"><i class="fas fa-map-marker-alt"></i></div>',
                    iconSize: [44, 44],
                    iconAnchor: [22, 44]
                })
            }).addTo(map)
            
            marker.bindPopup('<div style="text-align:center;"><strong>' + e.geocode.name + '</strong><br><small style="color:#666;">Lat: ' + latlng.lat.toFixed(6) + '<br>Lng: ' + latlng.lng.toFixed(6) + '</small></div>')
                .openPopup()
            
            // Supprimer le marqueur après 10 secondes
            setTimeout(() => map.removeLayer(marker), 10000)
        })
        .addTo(map)
        
        console.log('✅ Geocoder ajouté')
    }
    
    // ============================================================================
    // DATA LOADING
    // ============================================================================
    
    async function loadPlantData() {
        try {
            const res = await fetch('/api/pv/plants/' + PLANT_ID)
            const data = await res.json()
            
            if (data.success) {
                plantData = data.plant
                document.getElementById('plantName').textContent = plantData.plant_name
                document.getElementById('plantNameInfo').textContent = plantData.plant_name
                
                if (plantData.client_name) {
                    document.getElementById('clientName').textContent = plantData.client_name
                    document.getElementById('crmLink').href = '/crm/clients/' + (plantData.client_id || '')
                }
                
                // Center map on plant location if available
                if (plantData.latitude && plantData.longitude) {
                    map.setView([plantData.latitude, plantData.longitude], 18)
                }
                
                console.log('✅ Plant loaded:', plantData.plant_name)
            }
        } catch (err) {
            console.error('❌ Error loading plant:', err)
        }
    }
    
    async function loadZoneData() {
        try {
            const res = await fetch('/api/pv/plants/' + PLANT_ID)
            const data = await res.json()
            
            if (data.success && data.zones) {
                zoneData = data.zones.find(z => z.id == ZONE_ID)
                
                if (zoneData) {
                    document.getElementById('zoneName').textContent = zoneData.zone_name
                    document.getElementById('zoneNameInfo').textContent = zoneData.zone_name
                    document.getElementById('azimuth').value = zoneData.azimuth || 180
                    document.getElementById('tilt').value = zoneData.tilt || 30
                    
                    // Update string number suggestion
                    document.getElementById('stringNumber').value = zoneData.zone_name || 'A1'
                    
                    console.log('✅ Zone loaded:', zoneData.zone_name)
                }
            }
        } catch (err) {
            console.error('❌ Error loading zone:', err)
        }
    }
    
    async function loadModules() {
        try {
            const res = await fetch('/api/pv/plants/' + PLANT_ID + '/zones/' + ZONE_ID + '/modules')
            const data = await res.json()
            
            if (data.success && data.modules) {
                modules = data.modules
                renderModulesOnMap()
                updateStats()
                updateMiniPreview()
                console.log('✅ Modules loaded:', modules.length)
            }
        } catch (err) {
            console.error('❌ Error loading modules:', err)
        }
    }
    
    async function checkELLink() {
        try {
            const res = await fetch('/api/pv/plants/' + PLANT_ID + '/zones/' + ZONE_ID + '/el-link')
            const data = await res.json()
            
            if (data.linked && data.link) {
                linkedAudit = data.link
                showLinkedAudit()
                console.log('✅ EL Audit linked:', linkedAudit.project_name)
            }
        } catch (err) {
            console.log('ℹ️ No EL audit linked')
        }
    }
    
    // ============================================================================
    // RENDERING
    // ============================================================================
    
    function renderModulesOnMap() {
        modulesLayer.clearLayers()
        
        modules.forEach((module, index) => {
            if (module.latitude && module.longitude) {
                const color = getModuleColor(module.module_status || 'pending')
                
                const marker = L.circleMarker([module.latitude, module.longitude], {
                    radius: 6,
                    fillColor: color,
                    color: '#fff',
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.9
                })
                
                marker.bindTooltip(module.module_identifier || ('M' + (index + 1)), {
                    permanent: false,
                    direction: 'top'
                })
                
                marker.on('click', () => openModuleDetails(module))
                
                modulesLayer.addLayer(marker)
            }
        })
    }
    
    function getModuleColor(status) {
        const colors = {
            'ok': '#22c55e',
            'inequality': '#eab308',
            'microcracks': '#f97316',
            'dead': '#ef4444',
            'string_open': '#3b82f6',
            'not_connected': '#6b7280',
            'pending': '#e2e8f0'
        }
        return colors[status] || colors.pending
    }
    
    function updateStats() {
        const totalModules = modules.length
        const power = modules.reduce((sum, m) => sum + (m.power_wp || 185), 0) / 1000
        const stringsSet = new Set(modules.map(m => m.string_number).filter(Boolean))
        
        document.getElementById('totalModules').textContent = totalModules
        document.getElementById('totalPower').textContent = power.toFixed(2)
        document.getElementById('totalStrings').textContent = stringsSet.size
        document.getElementById('stringsCount').textContent = stringsSet.size
        
        // Status counts
        const statusCounts = {
            ok: modules.filter(m => m.module_status === 'ok').length,
            inequality: modules.filter(m => m.module_status === 'inequality').length,
            microcracks: modules.filter(m => m.module_status === 'microcracks').length,
            dead: modules.filter(m => m.module_status === 'dead').length,
            pending: modules.filter(m => !m.module_status || m.module_status === 'pending').length
        }
        
        document.getElementById('statusOk').textContent = statusCounts.ok
        document.getElementById('statusInequality').textContent = statusCounts.inequality
        document.getElementById('statusMicrocracks').textContent = statusCounts.microcracks
        document.getElementById('statusDead').textContent = statusCounts.dead
        document.getElementById('statusPending').textContent = statusCounts.pending
        
        // Update strings list
        renderStringsList(stringsSet)
    }
    
    function renderStringsList(stringsSet) {
        const container = document.getElementById('stringsList')
        
        if (stringsSet.size === 0) {
            container.innerHTML = '<p class="text-xs text-slate-400 text-center py-4">Aucun string configuré</p>'
            return
        }
        
        const sortedStrings = Array.from(stringsSet).sort()
        
        container.innerHTML = sortedStrings.map(stringNum => {
            const stringModules = modules.filter(m => m.string_number === stringNum)
            const power = stringModules.reduce((sum, m) => sum + (m.power_wp || 185), 0) / 1000
            
            return \`
                <div class="flex items-center justify-between p-2 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer" onclick="focusOnString('\${stringNum}')">
                    <div class="flex items-center gap-2">
                        <div class="w-8 h-8 bg-gradient-to-br from-diagpv-primary to-purple-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                            \${stringNum}
                        </div>
                        <div>
                            <div class="text-sm font-medium text-slate-800">\${stringModules.length} modules</div>
                            <div class="text-xs text-slate-500">\${power.toFixed(2)} kWc</div>
                        </div>
                    </div>
                    <i class="fas fa-chevron-right text-slate-400"></i>
                </div>
            \`
        }).join('')
    }
    
    function updateMiniPreview() {
        const container = document.getElementById('miniPlanPreview')
        
        if (modules.length === 0) {
            container.innerHTML = '<p class="text-xs text-slate-400 text-center py-4 col-span-full">Aucun module</p>'
            return
        }
        
        // Group by string and position
        const stringsSet = new Set(modules.map(m => m.string_number).filter(Boolean))
        const sortedStrings = Array.from(stringsSet).sort()
        
        let html = ''
        sortedStrings.forEach(stringNum => {
            const stringModules = modules
                .filter(m => m.string_number === stringNum)
                .sort((a, b) => (a.position_in_string || 0) - (b.position_in_string || 0))
            
            stringModules.forEach(m => {
                const status = m.module_status || 'pending'
                const bgClass = 'module-' + status
                html += \`<div class="module-cell \${bgClass}" title="\${m.module_identifier}">\${m.position_in_string || ''}</div>\`
            })
        })
        
        // Determine grid columns based on typical string size
        const avgPerString = Math.round(modules.length / sortedStrings.length) || 14
        container.style.gridTemplateColumns = 'repeat(' + avgPerString + ', 1fr)'
        container.innerHTML = html
    }
    
    function showLinkedAudit() {
        document.getElementById('elNotLinked').classList.add('hidden')
        document.getElementById('elLinked').classList.remove('hidden')
        document.getElementById('interconnectStatus').classList.remove('hidden')
        
        document.getElementById('elAuditName').textContent = linkedAudit.project_name || 'Audit EL'
        document.getElementById('elAuditModules').textContent = linkedAudit.total_modules + ' modules'
        document.getElementById('elAuditLink').textContent = linkedAudit.project_name
        document.getElementById('btnViewEL').href = '/audit/' + linkedAudit.el_audit_token
    }
    
    // ============================================================================
    // EVENT LISTENERS
    // ============================================================================
    
    function setupEventListeners() {
        // Tool buttons
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'))
                btn.classList.add('active')
                currentTool = btn.id.replace('tool', '').toLowerCase()
                handleToolChange()
            })
        })
        
        // String config
        document.getElementById('stringRows').addEventListener('input', updateStringPreview)
        document.getElementById('stringCols').addEventListener('input', updateStringPreview)
        document.getElementById('moduleType').addEventListener('change', updateStringPreview)
        
        // Add string button
        document.getElementById('btnAddString').addEventListener('click', addString)
        
        // Save button
        document.getElementById('btnSave').addEventListener('click', saveAll)
        
        // Export button
        document.getElementById('btnExport').addEventListener('click', exportPDF)
        
        // EL Link
        document.getElementById('btnLinkEL').addEventListener('click', openLinkELModal)
        document.getElementById('btnCancelLinkEL').addEventListener('click', () => {
            document.getElementById('linkELModal').classList.add('hidden')
        })
        
        // Sync EL
        document.getElementById('btnSyncEL').addEventListener('click', syncFromEL)
    }
    
    function handleToolChange() {
        // Remove existing draw control
        if (map.hasLayer(drawControl)) {
            map.removeControl(drawControl)
        }
        
        switch(currentTool) {
            case 'roof':
                map.addControl(drawControl)
                break
            case 'string':
                // Enable rectangle drawing for strings
                new L.Draw.Rectangle(map, {
                    shapeOptions: { color: '#7c3aed', weight: 2, fillOpacity: 0.3 }
                }).enable()
                break
            case 'module':
                // Enable click to place modules
                map.once('click', placeModuleAtClick)
                break
        }
    }
    
    function updateStringPreview() {
        const rows = parseInt(document.getElementById('stringRows').value) || 1
        const cols = parseInt(document.getElementById('stringCols').value) || 14
        const power = parseInt(document.getElementById('moduleType').value) || 185
        
        const moduleCount = rows * cols
        const totalPower = (moduleCount * power) / 1000
        
        document.getElementById('stringModuleCount').textContent = moduleCount
        document.getElementById('stringPower').textContent = totalPower.toFixed(2) + ' kWc'
    }
    
    // ============================================================================
    // ACTIONS
    // ============================================================================
    
    async function addString() {
        const rows = parseInt(document.getElementById('stringRows').value) || 1
        const cols = parseInt(document.getElementById('stringCols').value) || 14
        const stringNumber = document.getElementById('stringNumber').value || 'A1'
        const power = parseInt(document.getElementById('moduleType').value) || 185
        
        // Generate modules for this string
        const newModules = []
        for (let i = 1; i <= rows * cols; i++) {
            newModules.push({
                module_identifier: stringNumber + '-' + i,
                string_number: stringNumber,
                position_in_string: i,
                power_wp: power,
                module_status: 'pending'
            })
        }
        
        try {
            const res = await fetch('/api/pv/plants/' + PLANT_ID + '/zones/' + ZONE_ID + '/modules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ modules: newModules })
            })
            
            const data = await res.json()
            
            if (data.success) {
                // Reload modules
                await loadModules()
                
                // Auto-increment string number
                const match = stringNumber.match(/([A-Za-z]+)(\\d+)/)
                if (match) {
                    document.getElementById('stringNumber').value = match[1] + (parseInt(match[2]) + 1)
                }
                
                showNotification('String ' + stringNumber + ' ajouté (' + newModules.length + ' modules)', 'success')
            } else {
                showNotification('Erreur: ' + (data.error || 'Échec ajout'), 'error')
            }
        } catch (err) {
            console.error('Error adding string:', err)
            showNotification('Erreur réseau', 'error')
        }
    }
    
    async function saveAll() {
        showNotification('Enregistrement...', 'info')
        
        try {
            // Save zone configuration
            await fetch('/api/pv/plants/' + PLANT_ID + '/zones/' + ZONE_ID, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    azimuth: parseInt(document.getElementById('azimuth').value) || 180,
                    tilt: parseInt(document.getElementById('tilt').value) || 30
                })
            })
            
            document.getElementById('lastSaved').textContent = 'Enregistré à ' + new Date().toLocaleTimeString('fr-FR')
            unsavedChanges = false
            
            showNotification('Enregistré avec succès!', 'success')
        } catch (err) {
            console.error('Save error:', err)
            showNotification('Erreur lors de l\\'enregistrement', 'error')
        }
    }
    
    async function syncFromEL() {
        if (!linkedAudit) return
        
        showNotification('Synchronisation depuis Audit EL...', 'info')
        
        try {
            const res = await fetch('/api/pv/plants/' + PLANT_ID + '/zones/' + ZONE_ID + '/sync-from-el', {
                method: 'POST'
            })
            
            const data = await res.json()
            
            if (data.success) {
                await loadModules()
                showNotification('Synchronisation terminée!', 'success')
            } else {
                showNotification('Erreur sync: ' + (data.error || 'Échec'), 'error')
            }
        } catch (err) {
            console.error('Sync error:', err)
            showNotification('Erreur réseau', 'error')
        }
    }
    
    async function openLinkELModal() {
        document.getElementById('linkELModal').classList.remove('hidden')
        
        // Load available audits
        try {
            const res = await fetch('/api/el/dashboard/audits')
            const data = await res.json()
            
            const container = document.getElementById('availableAudits')
            
            if (data.audits && data.audits.length > 0) {
                container.innerHTML = data.audits.map(audit => \`
                    <div class="p-3 border border-slate-200 rounded-xl hover:border-diagpv-primary cursor-pointer transition-colors" onclick="linkAudit('\${audit.audit_token}')">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="font-medium text-slate-800">\${audit.project_name}</div>
                                <div class="text-xs text-slate-500">\${audit.client_name} • \${audit.total_modules || 0} modules</div>
                            </div>
                            <i class="fas fa-link text-diagpv-primary"></i>
                        </div>
                    </div>
                \`).join('')
            } else {
                container.innerHTML = '<p class="text-center text-slate-400 py-4">Aucun audit disponible</p>'
            }
        } catch (err) {
            console.error('Error loading audits:', err)
        }
    }
    
    async function linkAudit(token) {
        try {
            const res = await fetch('/api/pv/plants/' + PLANT_ID + '/zones/' + ZONE_ID + '/link-el-audit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ el_audit_token: token })
            })
            
            const data = await res.json()
            
            if (data.success) {
                document.getElementById('linkELModal').classList.add('hidden')
                await checkELLink()
                showNotification('Audit EL lié avec succès!', 'success')
            } else {
                showNotification('Erreur: ' + (data.error || 'Échec liaison'), 'error')
            }
        } catch (err) {
            console.error('Link error:', err)
            showNotification('Erreur réseau', 'error')
        }
    }
    
    function exportPDF() {
        showNotification('Export PDF en cours...', 'info')
        // TODO: Implement PDF export
        window.open('/api/pv/plants/' + PLANT_ID + '/zones/' + ZONE_ID + '/export-pdf', '_blank')
    }
    
    function focusOnString(stringNum) {
        // Highlight modules of this string
        console.log('Focus on string:', stringNum)
    }
    
    function openModuleDetails(module) {
        console.log('Module details:', module)
    }
    
    function placeModuleAtClick(e) {
        console.log('Place module at:', e.latlng)
    }
    
    function showNotification(message, type = 'info') {
        // Simple console notification for now
        console.log('[' + type.toUpperCase() + ']', message)
        
        // TODO: Add toast notification UI
    }
    
    // Initialize on load
    document.addEventListener('DOMContentLoaded', init)
    </script>
</body>
</html>
`
}
