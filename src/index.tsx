import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { PVservParser } from './pvserv-parser.js'
import elModule from './modules/el'
import pvModule from './modules/pv/routes/plants'

// Types pour l'environnement Cloudflare
type Bindings = {
  DB: D1Database
  KV: KVNamespace
  R2: R2Bucket
}

const app = new Hono<{ Bindings: Bindings }>()

// Configuration CORS pour collaboration temps réel
app.use('/api/*', cors({
  origin: ['http://localhost:3000', 'https://*.pages.dev'],
  credentials: true
}))

// Serveur de fichiers statiques
app.use('/static/*', serveStatic({ root: './public' }))

// ============================================================================
// MODULE EL - ARCHITECTURE MODULAIRE (Point 4.1 + 4.3)
// ============================================================================
app.route('/api/el', elModule)

// ============================================================================
// MODULE PV CARTOGRAPHY - ARCHITECTURE MODULAIRE (NOUVEAU - NON-DESTRUCTIF)
// ============================================================================
app.route('/api/pv/plants', pvModule)

// ============================================================================
// ANCIENNES ROUTES API RETIRÉES - REMPLACÉES PAR MODULE MODULAIRE
// ============================================================================
// Les routes suivantes ont été migrées vers src/modules/el/ (Point 4.1)
// et montées sous /api/el/ (voir ligne 27)
//
// ROUTES MIGRÉES:
// - POST /api/el/audit/create-from-json
// - POST /api/el/audit/create
// - GET /api/el/dashboard/audits
// - GET /api/el/audit/:token
// - PUT /api/el/audit/:token
// - DELETE /api/el/audit/:token
// - POST /api/el/audit/:token/module/:moduleId
// - POST /api/el/audit/:token/module
// - POST /api/el/audit/:token/bulk-update
//
// ROUTES CONSERVÉES (PVserv parser):
// - POST /api/audit/:token/parse-pvserv
// - POST /api/audit/:token/save-measurements
// - GET /api/audit/:token/measurements
// - GET /api/audit/:token/report
// ============================================================================

// ============================================================================
// API ROUTES - MESURES PVSERV
// ============================================================================

// Parse contenu PVserv
app.post('/api/audit/:token/parse-pvserv', async (c) => {
  const { content } = await c.req.json()
  
  if (!content) {
    return c.json({ error: 'Contenu fichier requis' }, 400)
  }

  try {
    const parser = new PVservParser()
    const results = parser.parseFile(content)
    
    return c.json(results)
  } catch (error) {
    console.error('Erreur parsing PVserv:', error)
    return c.json({ 
      error: 'Erreur parsing PVserv: ' + error.message,
      success: false 
    }, 500)
  }
})

// Sauvegarder mesures PVserv
app.post('/api/audit/:token/save-measurements', async (c) => {
  const { env } = c
  const token = c.req.param('token')
  const { measurements } = await c.req.json()

  if (!measurements || measurements.length === 0) {
    return c.json({ error: 'Aucune mesure à sauvegarder' }, 400)
  }

  try {
    // Suppression anciennes mesures
    await env.DB.prepare(
      'DELETE FROM pvserv_measurements WHERE audit_token = ?'
    ).bind(token).run()

    // Insertion nouvelles mesures
    const parser = new PVservParser()
    const dbData = parser.formatForDatabase(measurements, token)

    for (const measurement of dbData) {
      await env.DB.prepare(`
        INSERT INTO pvserv_measurements (
          audit_token, string_number, module_number, ff, rds, uf,
          measurement_type, iv_curve_data, raw_line, line_number, valid
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        measurement.audit_token, measurement.string_number, measurement.module_number,
        measurement.ff, measurement.rds, measurement.uf, measurement.measurement_type,
        measurement.iv_curve_data, measurement.raw_line, measurement.line_number,
        measurement.valid ? 1 : 0
      ).run()
    }

    return c.json({ 
      success: true, 
      saved: dbData.length 
    })

  } catch (error) {
    console.error('Erreur sauvegarde mesures:', error)
    return c.json({ 
      error: 'Erreur sauvegarde: ' + error.message 
    }, 500)
  }
})

// Récupérer mesures existantes
app.get('/api/audit/:token/measurements', async (c) => {
  const { env } = c
  const token = c.req.param('token')

  try {
    const measurements = await env.DB.prepare(
      'SELECT * FROM pvserv_measurements WHERE audit_token = ? ORDER BY module_number'
    ).bind(token).all()

    return c.json({ measurements: measurements.results })
  } catch (error) {
    console.error('Erreur récupération mesures:', error)
    return c.json({ error: 'Erreur récupération mesures' }, 500)
  }
})

// Génération rapport PDF
app.get('/api/audit/:token/report', async (c) => {
  const { env } = c
  const token = c.req.param('token')
  
  // Récupération données complètes audit
  const audit = await env.DB.prepare(
    'SELECT * FROM audits WHERE token = ?'
  ).bind(token).first()
  
  if (!audit) {
    return c.json({ error: 'Audit non trouvé' }, 404)
  }
  
  const modules = await env.DB.prepare(
    'SELECT * FROM modules WHERE audit_token = ? ORDER BY string_number, position_in_string'
  ).bind(token).all()
  
  const stats = await env.DB.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'ok' THEN 1 ELSE 0 END) as ok,
      SUM(CASE WHEN status = 'inequality' THEN 1 ELSE 0 END) as inequality,
      SUM(CASE WHEN status = 'microcracks' THEN 1 ELSE 0 END) as microcracks,
      SUM(CASE WHEN status = 'dead' THEN 1 ELSE 0 END) as dead,
      SUM(CASE WHEN status = 'string_open' THEN 1 ELSE 0 END) as string_open,
      SUM(CASE WHEN status = 'not_connected' THEN 1 ELSE 0 END) as not_connected
    FROM modules WHERE audit_token = ?
  `).bind(token).first()

  // Récupération mesures PVserv si disponibles
  const measurements = await env.DB.prepare(
    'SELECT * FROM pvserv_measurements WHERE audit_token = ? ORDER BY module_number'
  ).bind(token).all()
  
  // Génération HTML pour rapport PDF (sera converti côté client)
  const reportHtml = await generateReportHTML(audit, modules.results, stats, measurements.results)
  
  return c.html(reportHtml)
})

// ============================================================================
// INTERFACE FRONTEND
// ============================================================================

// ============================================================================
// PAGE D'ACCUEIL - DIAGNOSTIC HUB
// ============================================================================
app.get('/', (c) => {
  return c.html(`
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
            content: "✓" !important;
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
                    
                    <!-- Module I-V - À VENIR -->
                    <div class="bg-gradient-to-br from-gray-800 to-gray-700 rounded-lg p-8 border-4 border-gray-500 opacity-75">
                        <div class="text-center">
                            <div class="bg-gray-600 w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <i class="fas fa-chart-line text-4xl text-white"></i>
                            </div>
                            <h3 class="text-2xl font-black mb-2 text-white">MODULE I-V</h3>
                            <p class="text-lg text-gray-300 mb-3">Courbes I-V</p>
                            <div class="bg-yellow-500 text-black px-4 py-2 rounded-full font-black text-sm inline-block mb-4">
                                <i class="fas fa-clock mr-1"></i> PROCHAINEMENT
                            </div>
                            <p class="text-sm text-gray-300">Mesures électriques et analyse performances</p>
                        </div>
                    </div>
                    
                    <!-- Module Thermographie -->
                    <div class="bg-gradient-to-br from-gray-800 to-gray-700 rounded-lg p-8 border-4 border-gray-500 opacity-75">
                        <div class="text-center">
                            <div class="bg-gray-600 w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <i class="fas fa-thermometer-half text-4xl text-white"></i>
                            </div>
                            <h3 class="text-2xl font-black mb-2 text-white">MODULE THERMIQUE</h3>
                            <p class="text-lg text-gray-300 mb-3">Thermographie IR</p>
                            <div class="bg-yellow-500 text-black px-4 py-2 rounded-full font-black text-sm inline-block mb-4">
                                <i class="fas fa-clock mr-1"></i> PROCHAINEMENT
                            </div>
                            <p class="text-sm text-gray-300">Détection points chauds et anomalies thermiques</p>
                        </div>
                    </div>
                    
                    <!-- Module Visuels -->
                    <div class="bg-gradient-to-br from-gray-800 to-gray-700 rounded-lg p-8 border-4 border-gray-500 opacity-75">
                        <div class="text-center">
                            <div class="bg-gray-600 w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <i class="fas fa-eye text-4xl text-white"></i>
                            </div>
                            <h3 class="text-2xl font-black mb-2 text-white">MODULE VISUELS</h3>
                            <p class="text-lg text-gray-300 mb-3">Contrôles Visuels</p>
                            <div class="bg-yellow-500 text-black px-4 py-2 rounded-full font-black text-sm inline-block mb-4">
                                <i class="fas fa-clock mr-1"></i> PROCHAINEMENT
                            </div>
                            <p class="text-sm text-gray-300">Inspection visuelle et défauts mécaniques</p>
                        </div>
                    </div>
                    
                    <!-- Module Isolation -->
                    <div class="bg-gradient-to-br from-gray-800 to-gray-700 rounded-lg p-8 border-4 border-gray-500 opacity-75">
                        <div class="text-center">
                            <div class="bg-gray-600 w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <i class="fas fa-bolt text-4xl text-white"></i>
                            </div>
                            <h3 class="text-2xl font-black mb-2 text-white">MODULE ISOLATION</h3>
                            <p class="text-lg text-gray-300 mb-3">Tests d'Isolation</p>
                            <div class="bg-yellow-500 text-black px-4 py-2 rounded-full font-black text-sm inline-block mb-4">
                                <i class="fas fa-clock mr-1"></i> PROCHAINEMENT
                            </div>
                            <p class="text-sm text-gray-300">Mesures résistance isolation et défauts électriques</p>
                        </div>
                    </div>
                    
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
  `)
})

// ============================================================================
// ROUTE MODULE EL - INTERFACE CRÉATION AUDIT ÉLECTROLUMINESCENCE
// ============================================================================
app.get('/el', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Module EL - Création Audit Électroluminescence</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/diagpv-styles.css" rel="stylesheet">
        <meta name="theme-color" content="#000000">
    </head>
    <body class="bg-black text-white min-h-screen font-bold">
        <div class="container mx-auto p-6">
            <!-- En-tête retour Hub -->
            <div class="mb-6 flex justify-between items-center">
                <a href="/" class="inline-flex items-center text-yellow-400 hover:text-yellow-300 text-lg">
                    <i class="fas fa-arrow-left mr-2"></i>
                    Retour au Diagnostic Hub
                </a>
                <div class="flex gap-3">
                    <a href="/dashboard" class="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded font-bold">
                        <i class="fas fa-chart-line mr-1"></i>DASHBOARD
                    </a>
                    <a href="/pv/plants" class="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded font-bold">
                        <i class="fas fa-solar-panel mr-1"></i>PV CARTO
                    </a>
                </div>
            </div>
            
            <!-- En-tête Module EL -->
            <header class="mb-8 text-center">
                <div class="inline-flex items-center mb-4">
                    <i class="fas fa-moon text-4xl text-green-400 mr-4"></i>
                    <h1 class="text-4xl font-black">MODULE EL - ÉLECTROLUMINESCENCE</h1>
                </div>
                <p class="text-xl text-gray-300">Interface Terrain Nocturne - Audit Photovoltaïque</p>
                <p class="text-lg text-blue-400 mt-2">
                    <i class="fas fa-globe mr-2"></i>
                    www.diagnosticphotovoltaique.fr
                </p>
            </header>
            
            <!-- Interface création audit (contenu identique à l'ancienne page /) -->
            <div class="max-w-4xl mx-auto">
                <div class="bg-gray-900 rounded-lg p-8 border-2 border-green-400">
                    <h2 class="text-2xl font-black mb-6 text-center">
                        <i class="fas fa-plus-circle mr-2 text-green-400"></i>
                        NOUVEL AUDIT ÉLECTROLUMINESCENCE
                    </h2>
                    
                    <form id="createAuditForm" class="space-y-6">
                        <div class="grid md:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-lg font-bold mb-2">Nom du projet :</label>
                                <input type="text" id="projectName" required 
                                       class="w-full bg-black border-2 border-gray-600 rounded-lg px-4 py-3 text-lg focus:border-green-400 focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-lg font-bold mb-2">Client :</label>
                                <input type="text" id="clientName" required 
                                       class="w-full bg-black border-2 border-gray-600 rounded-lg px-4 py-3 text-lg focus:border-green-400 focus:outline-none">
                            </div>
                        </div>
                        
                        <div class="grid md:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-lg font-bold mb-2">Localisation :</label>
                                <input type="text" id="location" required 
                                       class="w-full bg-black border-2 border-gray-600 rounded-lg px-4 py-3 text-lg focus:border-green-400 focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-lg font-bold mb-2">Date :</label>
                                <input type="date" id="auditDate" required 
                                       class="w-full bg-black border-2 border-gray-600 rounded-lg px-4 py-3 text-lg focus:border-green-400 focus:outline-none">
                            </div>
                        </div>
                        
                        <div class="bg-gray-800 rounded-lg p-6 border border-gray-600">
                            <h3 class="text-xl font-bold mb-4 text-green-400">CONFIGURATION OU UPLOAD PLAN</h3>
                            
                            <div class="mb-6">
                                <h4 class="text-lg font-bold mb-3">Option A - Configuration manuelle :</h4>
                                
                                <div id="simpleConfig" class="grid md:grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <label class="block text-sm font-bold mb-2">Nombre de strings :</label>
                                        <input type="number" id="stringCount" min="1" max="100" 
                                               class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2 text-lg focus:border-green-400 focus:outline-none">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-bold mb-2">Modules par string :</label>
                                        <input type="number" id="modulesPerString" min="1" max="50" 
                                               class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2 text-lg focus:border-green-400 focus:outline-none">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-bold mb-2">Total modules :</label>
                                        <div id="totalModules" class="bg-black border-2 border-gray-600 rounded px-3 py-2 text-lg text-green-400 font-black">0</div>
                                    </div>
                                </div>
                                
                                <div class="text-center mb-4 space-x-3">
                                    <button type="button" id="toggleAdvancedConfig" 
                                            class="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg font-bold text-sm">
                                        <i class="fas fa-cog mr-2"></i>CONFIGURATION AVANCÉE
                                    </button>
                                    <button type="button" id="loadExampleConfig" 
                                            class="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-bold text-sm">
                                        <i class="fas fa-magic mr-2"></i>EXEMPLE MPPT
                                    </button>
                                </div>
                                
                                <div id="advancedConfig" class="hidden bg-gray-700 rounded-lg p-4 border border-orange-400">
                                    <div class="flex items-center justify-between mb-4">
                                        <h5 class="text-lg font-bold text-orange-400">Configuration par String/MPPT</h5>
                                        <button type="button" id="addStringBtn" 
                                                class="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm font-bold">
                                            <i class="fas fa-plus mr-1"></i>Ajouter String
                                        </button>
                                    </div>
                                    
                                    <div id="stringsList" class="space-y-2 max-h-60 overflow-y-auto">
                                    </div>
                                    
                                    <div class="mt-4 p-3 bg-gray-800 rounded border-l-4 border-green-400">
                                        <div class="flex justify-between items-center">
                                            <span class="text-sm font-bold">TOTAL CONFIGURATION :</span>
                                            <span id="advancedTotal" class="text-green-400 font-black text-lg">0 modules</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="border-t border-gray-600 pt-6">
                                <h4 class="text-lg font-bold mb-3">Option B - Upload plan :</h4>
                                <div class="flex items-center space-x-4">
                                    <input type="file" id="planFile" accept=".pdf,.png,.jpg,.jpeg" class="hidden">
                                    <button type="button" onclick="document.getElementById('planFile').click()" 
                                            class="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-bold text-lg">
                                        <i class="fas fa-paperclip mr-2"></i>CHARGER PLAN PDF/IMAGE
                                    </button>
                                    <span id="planFileName" class="text-gray-400"></span>
                                </div>
                            </div>
                        </div>
                        
                        <button type="submit" 
                                class="w-full bg-green-600 hover:bg-green-700 py-4 rounded-lg font-black text-xl transition-colors">
                            <i class="fas fa-rocket mr-2"></i>CRÉER L'AUDIT
                        </button>
                    </form>
                </div>
                
                <div class="mt-8 grid md:grid-cols-2 gap-6">
                    <div class="bg-gray-900 rounded-lg p-6 border border-gray-600">
                        <h3 class="text-xl font-bold mb-4 flex items-center">
                            <i class="fas fa-history mr-2 text-blue-400"></i>
                            MES AUDITS RÉCENTS
                        </h3>
                        <div id="recentAudits" class="space-y-2 mb-4">
                            <p class="text-gray-400">Aucun audit récent trouvé</p>
                        </div>
                    </div>
                    
                    <div class="bg-gray-900 rounded-lg p-6 border border-orange-400">
                        <h3 class="text-xl font-bold mb-4 text-orange-400 flex items-center">
                            <i class="fas fa-tachometer-alt mr-2"></i>
                            TABLEAU DE BORD
                        </h3>
                        <p class="text-gray-300 mb-4">Gérez tous vos audits en cours</p>
                        <a href="/dashboard" class="w-full bg-orange-600 hover:bg-orange-700 py-3 rounded-lg font-black text-lg flex items-center justify-center">
                            <i class="fas fa-chart-line mr-2"></i>
                            ACCÉDER AU DASHBOARD
                        </a>
                    </div>
                </div>
            </div>
        </div>

        <script src="/static/diagpv-app.js"></script>
    </body>
    </html>
  `)
})

// Page d'audit terrain nocturne
app.get('/audit/:token', async (c) => {
  const token = c.req.param('token')
  
  return c.html(`
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
            content: "✓" !important;
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
                            <span id="technicianIcons">👤</span>
                        </div>
                    </div>
                </div>
                
                <div class="flex space-x-2 flex-wrap">
                    <a href="/dashboard" class="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded font-bold flex items-center border-2 border-orange-400 shadow-lg" title="Accéder au tableau de bord - Vue d'ensemble audits">
                        <i class="fas fa-tachometer-alt mr-2 text-lg"></i>TABLEAU DE BORD
                    </a>
                    <a href="/pv/plants" class="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded font-bold flex items-center" title="Cartographie centrales PV">
                        <i class="fas fa-solar-panel mr-1"></i>PV CARTO
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
                            🟢 OK
                        </button>
                        <button class="bulk-action-btn bg-yellow-600 hover:bg-yellow-700 p-2 rounded font-bold text-sm" data-status="inequality" title="Marquer comme inégalité">
                            🟡 Inégalité
                        </button>
                        <button class="bulk-action-btn bg-orange-600 hover:bg-orange-700 p-2 rounded font-bold text-sm" data-status="microcracks" title="Marquer comme microfissures">
                            🟠 Fissures
                        </button>
                        <button class="bulk-action-btn bg-red-600 hover:bg-red-700 p-2 rounded font-bold text-sm" data-status="dead" title="Marquer comme HS">
                            🔴 HS
                        </button>
                        <button class="bulk-action-btn bg-blue-600 hover:bg-blue-700 p-2 rounded font-bold text-sm" data-status="string_open" title="Marquer comme string ouvert">
                            🔵 String
                        </button>
                        <button class="bulk-action-btn bg-gray-600 hover:bg-gray-700 p-2 rounded font-bold text-sm" data-status="not_connected" title="Marquer comme non raccordé">
                            ⚫ Non raccordé
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
                        🟢 OK<br><span class="text-sm font-normal">Aucun défaut détecté</span>
                    </button>
                    <button class="module-status-btn bg-yellow-600 hover:bg-yellow-700 p-3 rounded font-bold" data-status="inequality">
                        🟡 Inégalité<br><span class="text-sm font-normal">Qualité cellules</span>
                    </button>
                    <button class="module-status-btn bg-orange-600 hover:bg-orange-700 p-3 rounded font-bold" data-status="microcracks">
                        🟠 Microfissures<br><span class="text-sm font-normal">Visibles EL</span>
                    </button>
                    <button class="module-status-btn bg-red-600 hover:bg-red-700 p-3 rounded font-bold" data-status="dead">
                        🔴 HS<br><span class="text-sm font-normal">Module défaillant</span>
                    </button>
                    <button class="module-status-btn bg-blue-600 hover:bg-blue-700 p-3 rounded font-bold" data-status="string_open">
                        🔵 String ouvert<br><span class="text-sm font-normal">Sous-string ouvert</span>
                    </button>
                    <button class="module-status-btn bg-gray-600 hover:bg-gray-700 p-3 rounded font-bold" data-status="not_connected">
                        ⚫ Non raccordé<br><span class="text-sm font-normal">Non connecté</span>
                    </button>
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-bold mb-2">Commentaire (optionnel) :</label>
                    <input type="text" id="moduleComment" 
                           class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2 text-lg focus:border-yellow-400 focus:outline-none"
                           placeholder="Détails du défaut...">
                </div>
                
                <div class="flex space-x-3">
                    <button id="validateBtn" class="flex-1 bg-green-600 hover:bg-green-700 py-3 rounded font-black">
                        VALIDER
                    </button>
                    <button id="cancelBtn" class="flex-1 bg-gray-600 hover:bg-gray-700 py-3 rounded font-black">
                        ANNULER
                    </button>
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
        
        <script src="/static/diagpv-audit.js"></script>
        <script src="/static/diagpv-measures.js"></script>
    </body>
    </html>
  `)
})

// Fonction génération grille modules physique
function generatePhysicalModulesGrid(modules: any[]) {
  if (!modules || modules.length === 0) {
    return '<p>Aucun module trouvé</p>'
  }

  // Tri des modules par position physique
  const sortedModules = modules.sort((a, b) => {
    // Tri par rangée (row) d'abord, puis par colonne (col)
    if (a.physical_row !== b.physical_row) {
      return (a.physical_row || 0) - (b.physical_row || 0)
    }
    return (a.physical_col || 0) - (b.physical_col || 0)
  })

  // Déterminer dimensions de la grille
  const maxRow = Math.max(...sortedModules.map(m => m.physical_row || 0))
  const maxCol = Math.max(...sortedModules.map(m => m.physical_col || 0))
  const minRow = Math.min(...sortedModules.map(m => m.physical_row || 0))
  const minCol = Math.min(...sortedModules.map(m => m.physical_col || 0))

  // Créer une grille vide
  const grid = []
  for (let row = maxRow; row >= minRow; row--) { // De haut en bas (inversion visuelle)
    const gridRow = []
    for (let col = minCol; col <= maxCol; col++) {
      gridRow.push(null)
    }
    grid.push(gridRow)
  }

  // Placer les modules dans la grille
  sortedModules.forEach(module => {
    const row = module.physical_row || 0
    const col = module.physical_col || 0
    const gridRowIndex = maxRow - row  // Inversion pour affichage correct
    const gridColIndex = col - minCol
    
    if (grid[gridRowIndex] && grid[gridRowIndex][gridColIndex] !== undefined) {
      grid[gridRowIndex][gridColIndex] = module
    }
  })

  // Génération HTML de la grille
  let html = `
    <div class="physical-modules-grid" style="
      display: grid; 
      grid-template-columns: repeat(${maxCol - minCol + 1}, 32px);
      gap: 3px;
      padding: 20px;
      background: #f8fafc;
      border-radius: 10px;
      border: 2px dashed #cbd5e1;
      justify-content: center;
      max-width: fit-content;
      margin: 0 auto;
    ">
  `

  grid.forEach((row, rowIndex) => {
    row.forEach((module, colIndex) => {
      if (module) {
        html += `
          <div class="module ${module.status}" title="${module.module_id} (Rang ${module.physical_row}, Col ${module.physical_col})">
            ${module.module_id.includes('-') ? module.module_id.split('-')[1] : module.module_id.substring(1)}
          </div>
        `
      } else {
        // Cellule vide pour maintenir l'alignement
        html += `<div class="module-empty" style="width: 30px; height: 24px;"></div>`
      }
    })
  })

  html += '</div>'
  
  // Ajouter une vue par string aussi pour référence
  html += '<div style="margin-top: 30px;">'
  html += '<h4 style="color: #374151; margin-bottom: 15px;">📋 Vue par String (référence)</h4>'
  
  // Grouper par string
  const modulesByString = {}
  sortedModules.forEach(module => {
    const stringNum = module.string_number
    if (!modulesByString[stringNum]) {
      modulesByString[stringNum] = []
    }
    modulesByString[stringNum].push(module)
  })

  Object.keys(modulesByString).sort((a, b) => parseInt(a) - parseInt(b)).forEach(stringNum => {
    const stringModules = modulesByString[stringNum].sort((a, b) => a.position_in_string - b.position_in_string)
    
    html += `
      <div style="margin-bottom: 15px;">
        <div style="font-weight: 600; margin-bottom: 5px; color: #1f2937;">
          String ${stringNum} (${stringModules.length} modules)
        </div>
        <div style="display: flex; gap: 3px; flex-wrap: wrap;">
    `
    
    stringModules.forEach(module => {
      html += `
        <div class="module ${module.status}" style="width: 28px; height: 20px; font-size: 8px;" 
             title="${module.module_id}">
          ${module.position_in_string}
        </div>
      `
    })
    
    html += '</div></div>'
  })
  
  html += '</div>'
  
  return html
}

// Fonction génération HTML rapport
async function generateReportHTML(audit: any, modules: any[], stats: any, measurements: any[] = []) {
  const date = new Date().toLocaleDateString('fr-FR')
  const okPercentage = ((stats.ok / stats.total) * 100).toFixed(1)
  const inequalityPercentage = ((stats.inequality / stats.total) * 100).toFixed(1)
  const microcracksPercentage = ((stats.microcracks / stats.total) * 100).toFixed(1)
  const deadPercentage = ((stats.dead / stats.total) * 100).toFixed(1)
  const stringOpenPercentage = ((stats.string_open / stats.total) * 100).toFixed(1)
  const notConnectedPercentage = ((stats.not_connected / stats.total) * 100).toFixed(1)

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <title>Rapport Audit EL - ${audit.project_name}</title>
        <style>
            /* === DESIGN PROFESSIONNEL DIAGPV === */
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            
            body { 
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
                margin: 0; 
                padding: 20px;
                color: #1f2937; 
                background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                line-height: 1.6;
            }
            
            .header { 
                background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
                color: white;
                text-align: center; 
                padding: 40px;
                border-radius: 16px;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                margin-bottom: 30px;
                position: relative;
                overflow: hidden;
            }
            
            .header::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="0.5" fill="%23ffffff" opacity="0.03"/></pattern></defs><rect width="100%" height="100%" fill="url(%23grain)"/></svg>');
                pointer-events: none;
            }
            
            .header h1 {
                font-size: 2.5rem;
                font-weight: 700;
                margin: 0 0 10px 0;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
                letter-spacing: -0.5px;
            }
            
            .header p {
                font-size: 1.1rem;
                opacity: 0.9;
                margin: 5px 0;
                font-weight: 400;
            }
            
            .header h2 {
                color: #f59e0b;
                font-size: 1.5rem;
                font-weight: 600;
                margin: 20px 0 30px 0;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            .client-info {
                background: rgba(255,255,255,0.1);
                backdrop-filter: blur(10px);
                border-radius: 12px;
                padding: 25px;
                text-align: left;
                margin-top: 25px;
                border: 1px solid rgba(255,255,255,0.2);
            }
            
            .client-info p {
                margin: 8px 0;
                display: flex;
                align-items: center;
                font-size: 0.95rem;
            }
            
            .client-info strong {
                min-width: 140px;
                color: #f59e0b;
                font-weight: 600;
            }
            
            .section { 
                background: white;
                margin: 25px 0;
                page-break-inside: avoid;
                border-radius: 12px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                overflow: hidden;
                border: 1px solid #e5e7eb;
            }
            
            .section h3 {
                background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                color: white;
                margin: 0;
                padding: 20px 25px;
                font-size: 1.25rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
            }
            
            .section-content {
                padding: 25px;
            }
            
            .stats { 
                display: grid; 
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); 
                gap: 15px;
                margin: 20px 0;
            }
            
            .stat-card {
                background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                border-radius: 10px;
                padding: 20px;
                border-left: 4px solid;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                transition: transform 0.2s ease;
            }
            
            .stat-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            }
            
            .stat-ok { border-left-color: #22c55e; }
            .stat-inequality { border-left-color: #eab308; }
            .stat-microcracks { border-left-color: #f97316; }
            .stat-dead { border-left-color: #ef4444; }
            .stat-string_open { border-left-color: #3b82f6; }
            .stat-not_connected { border-left-color: #6b7280; }
            
            .total-summary {
                background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
                color: white;
                padding: 20px;
                border-radius: 10px;
                text-align: center;
                font-size: 1.1rem;
                font-weight: 600;
                margin: 20px 0;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            
            .module-grid { 
                display: grid; 
                grid-template-columns: repeat(auto-fill, 32px); 
                gap: 3px;
                padding: 20px;
                background: #f8fafc;
                border-radius: 10px;
                border: 2px dashed #cbd5e1;
            }
            
            .module { 
                width: 30px; 
                height: 24px; 
                border-radius: 4px;
                text-align: center; 
                font-size: 9px; 
                color: white; 
                font-weight: 600;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                transition: transform 0.1s ease;
            }
            
            .module:hover {
                transform: scale(1.1);
                z-index: 10;
                position: relative;
            }
            
            .ok { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%) !important; }
            .inequality { background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%) !important; }
            .microcracks { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%) !important; }
            .dead { 
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important; 
                animation: pulse-danger 2s infinite;
            }
            .string_open { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important; }
            .not_connected { background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%) !important; }
            .pending { 
                background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%) !important; 
                color: #4b5563 !important;
                border: 1px dashed #9ca3af;
            }
            
            @keyframes pulse-danger {
                0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
                50% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
            }
            
            .legend {
                display: flex;
                flex-wrap: wrap;
                gap: 15px;
                margin: 20px 0;
                padding: 20px;
                background: white;
                border-radius: 10px;
                border: 1px solid #e5e7eb;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            }
            
            .legend-item {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 0.9rem;
                font-weight: 500;
                color: #4b5563;
            }
            
            .legend-color {
                width: 20px;
                height: 16px;
                border-radius: 3px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.2);
            }
            
            table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
                font-size: 0.9rem;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                border-radius: 8px;
                overflow: hidden;
            }
            
            table th {
                background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
                color: white;
                padding: 15px 12px;
                text-align: left;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                font-size: 0.8rem;
            }
            
            table td {
                padding: 12px;
                border-bottom: 1px solid #e5e7eb;
                background: white;
            }
            
            table tr:nth-child(even) td {
                background: #f8fafc;
            }
            
            table tr:hover td {
                background: #e0f2fe;
            }
            
            .signature-section {
                background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                border: 2px solid #cbd5e1;
                border-radius: 12px;
                padding: 25px;
                text-align: center;
                margin-top: 30px;
            }
            
            .instructions-box {
                background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                border: 2px solid #f59e0b;
                border-radius: 12px;
                padding: 20px;
                margin: 25px 0;
                box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            }
            
            .instructions-box h4 {
                color: #92400e;
                margin: 0 0 15px 0;
                font-size: 1.1rem;
                font-weight: 600;
            }
            
            .instructions-box p {
                color: #92400e;
                margin: 8px 0;
                font-size: 0.9rem;
            }
            
            /* Styles spécifiques pour impression */
            @media print {
                body { 
                    margin: 15px; 
                    font-size: 12px;
                    -webkit-print-color-adjust: exact !important;
                    color-adjust: exact !important;
                }
                .module { 
                    -webkit-print-color-adjust: exact !important;
                    color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
                .ok { background-color: #22c55e !important; -webkit-print-color-adjust: exact !important; }
                .inequality { background-color: #eab308 !important; -webkit-print-color-adjust: exact !important; }
                .microcracks { background-color: #f97316 !important; -webkit-print-color-adjust: exact !important; }
                .dead { background-color: #ef4444 !important; -webkit-print-color-adjust: exact !important; }
                .string_open { background-color: #3b82f6 !important; -webkit-print-color-adjust: exact !important; }
                .not_connected { background-color: #6b7280 !important; -webkit-print-color-adjust: exact !important; }
                .pending { background-color: #e5e7eb !important; -webkit-print-color-adjust: exact !important; }
                
                /* Forcer les couleurs même en mode économie d'encre */
                * { 
                    -webkit-print-color-adjust: exact !important;
                    color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
            }
            
            /* Styles pour PDF */
            @page {
                size: A4;
                margin: 1cm;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🏢 DIAGNOSTIC PHOTOVOLTAÏQUE</h1>
            <p>www.diagnosticphotovoltaique.fr</p>
            <h2>⚡ AUDIT ÉLECTROLUMINESCENCE ⚡</h2>
            
            <div class="client-info">
                <p><strong>Client :</strong> ${audit.client_name}</p>
                <p><strong>Installation :</strong> ${audit.location}</p>
                <p><strong>Date intervention :</strong> ${date}</p>
                <p><strong>Configuration :</strong> ${audit.total_modules} modules photovoltaïques, ${audit.string_count} strings</p>
                <p><strong>Méthode :</strong> Électroluminescence nocturne</p>
                <p><strong>Normes :</strong> IEC 62446-1, IEC 61215</p>
            </div>
        </div>
        
        <div class="section">
            <h3>📊 RÉSULTATS AUDIT ÉLECTROLUMINESCENCE</h3>
            <div class="section-content">
                <div class="stats">
                    <div class="stat-card stat-ok">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="font-size: 2rem;">🟢</div>
                            <div>
                                <div style="font-weight: 600; font-size: 1.1rem;">Modules OK</div>
                                <div style="font-size: 1.5rem; font-weight: 700; color: #22c55e;">${stats.ok} (${okPercentage}%)</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="stat-card stat-inequality">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="font-size: 2rem;">🟡</div>
                            <div>
                                <div style="font-weight: 600; font-size: 1.1rem;">Inégalité cellules</div>
                                <div style="font-size: 1.5rem; font-weight: 700; color: #eab308;">${stats.inequality} (${inequalityPercentage}%)</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="stat-card stat-microcracks">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="font-size: 2rem;">🟠</div>
                            <div>
                                <div style="font-weight: 600; font-size: 1.1rem;">Microfissures</div>
                                <div style="font-size: 1.5rem; font-weight: 700; color: #f97316;">${stats.microcracks} (${microcracksPercentage}%)</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="stat-card stat-dead">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="font-size: 2rem;">🔴</div>
                            <div>
                                <div style="font-weight: 600; font-size: 1.1rem;">Modules HS</div>
                                <div style="font-size: 1.5rem; font-weight: 700; color: #ef4444;">${stats.dead} (${deadPercentage}%)</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="stat-card stat-string_open">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="font-size: 2rem;">🔵</div>
                            <div>
                                <div style="font-weight: 600; font-size: 1.1rem;">Strings ouverts</div>
                                <div style="font-size: 1.5rem; font-weight: 700; color: #3b82f6;">${stats.string_open} (${stringOpenPercentage}%)</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="stat-card stat-not_connected">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="font-size: 2rem;">⚫</div>
                            <div>
                                <div style="font-weight: 600; font-size: 1.1rem;">Non raccordés</div>
                                <div style="font-size: 1.5rem; font-weight: 700; color: #6b7280;">${stats.not_connected} (${notConnectedPercentage}%)</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="total-summary">
                    ⚡ TOTAL MODULES AUDITÉS : ${stats.total} ⚡
                </div>
            </div>
        </div>
        
        <div class="section">
            <h3>🗺️ CARTOGRAPHIE MODULES</h3>
            <div class="section-content">
                
                <!-- Légende des couleurs -->
                <div class="legend">
                    <div class="legend-item">
                        <div class="legend-color ok"></div>
                        <span>OK</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color inequality"></div>
                        <span>Inégalité</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color microcracks"></div>
                        <span>Microfissures</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color dead"></div>
                        <span>HS</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color string_open"></div>
                        <span>String ouvert</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color not_connected"></div>
                        <span>Non raccordé</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color pending"></div>
                        <span>En attente</span>
                    </div>
                </div>
                
                ${generatePhysicalModulesGrid(modules)}
                
            </div>
        </div>
        
        <div class="section">
            <h3>⚠️ MODULES NON-CONFORMES</h3>
            <div class="section-content">
                <table>
                    <tr>
                        <th>N° Module</th>
                        <th>String</th>
                        <th>État</th>
                        <th>Commentaire</th>
                    </tr>
                ${modules
                  .filter(m => m.status !== 'ok' && m.status !== 'pending')
                  .map(module => `
                    <tr>
                        <td>${module.module_id}</td>
                        <td>S${module.string_number}</td>
                        <td>${getStatusLabel(module.status)}</td>
                        <td>${module.comment || '-'}</td>
                    </tr>
                  `).join('')}
                </table>
            </div>
        </div>
        
        ${measurements.length > 0 ? `
        <div class="section">
            <h3>⚡ MESURES ÉLECTRIQUES PVSERV</h3>
            <div class="section-content">
                <div class="stats">
                    <div class="stat-card">
                        <div style="text-align: center;">
                            <div style="font-size: 2rem; margin-bottom: 5px;">📊</div>
                            <div style="font-weight: 600;">Total mesures</div>
                            <div style="font-size: 1.5rem; font-weight: 700; color: #3b82f6;">${measurements.length}</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div style="text-align: center;">
                            <div style="font-size: 2rem; margin-bottom: 5px;">⚡</div>
                            <div style="font-weight: 600;">FF moyen</div>
                            <div style="font-size: 1.5rem; font-weight: 700; color: #22c55e;">${(measurements.reduce((sum, m) => sum + parseFloat(m.ff || 0), 0) / measurements.length).toFixed(3)}</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div style="text-align: center;">
                            <div style="font-size: 2rem; margin-bottom: 5px;">🔌</div>
                            <div style="font-weight: 600;">Rds moyen</div>
                            <div style="font-size: 1.5rem; font-weight: 700; color: #f59e0b;">${(measurements.reduce((sum, m) => sum + parseFloat(m.rds || 0), 0) / measurements.length).toFixed(2)} Ω</div>
                        </div>
                    </div>
                </div>
                
                <table>
                    <tr>
                        <th>Module</th>
                        <th>Type</th>
                        <th>FF</th>
                        <th>Rds (Ω)</th>
                        <th>Uf (V)</th>
                        <th>Points IV</th>
                    </tr>
                ${measurements.slice(0, 50).map(m => { // Limite 50 pour PDF
                  const ivData = JSON.parse(m.iv_curve_data || '{"count": 0}')
                  return `
                    <tr>
                        <td>M${m.module_number?.toString().padStart(3, '0')}</td>
                        <td>${m.measurement_type}</td>
                        <td>${parseFloat(m.ff || 0).toFixed(3)}</td>
                        <td>${parseFloat(m.rds || 0).toFixed(2)}</td>
                        <td>${m.uf || 0}</td>
                        <td>${ivData.count || 0}</td>
                    </tr>
                  `
                }).join('')}
                ${measurements.length > 50 ? `
                <tr>
                    <td colspan="6" style="text-align: center; font-style: italic; color: #6b7280;">
                        ... ${measurements.length - 50} mesures supplémentaires disponibles dans l'export complet
                    </td>
                </tr>
                ` : ''}
                </table>
                
                <div style="margin-top: 15px; padding: 15px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #3b82f6;">
                    <p style="margin: 0; font-size: 0.9rem; color: #4b5563;"><strong>Note:</strong> Données PVserv brutes sans interprétation. FF = Fill Factor, Rds = Résistance série, Uf = Tension.</p>
                </div>
            </div>
        </div>
        ` : ''}

        <div class="signature-section">
            <h3 style="color: #1e293b; margin: 0 0 15px 0; font-size: 1.25rem;">🔐 SIGNATURE NUMÉRIQUE</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; text-align: left; font-size: 0.9rem; color: #4b5563;">
                <div><strong>Génération :</strong> Automatique DiagPV Audit</div>
                <div><strong>Date :</strong> ${date}</div>
                <div><strong>Token :</strong> ${audit.token}</div>
                ${measurements.length > 0 ? `<div><strong>Mesures PVserv :</strong> ${measurements.length} intégrées</div>` : ''}
            </div>
        </div>
        
        <div class="instructions-box">
            <h4>📋 INSTRUCTIONS IMPRESSION COULEURS</h4>
            <p><strong>Pour imprimer les couleurs des modules :</strong></p>
            <div style="margin-left: 15px; line-height: 1.6;">
                <p>• <strong>Chrome/Edge :</strong> Ctrl+P → Plus de paramètres → ✅ Graphiques d'arrière-plan</p>
                <p>• <strong>Firefox :</strong> Ctrl+P → Plus de paramètres → ✅ Imprimer les arrière-plans</p>
                <p>• <strong>Safari :</strong> Cmd+P → Safari → ✅ Imprimer les arrière-plans</p>
            </div>
        </div>
        
    </body>
    <script>
        // Optimisation automatique pour impression des couleurs
        document.addEventListener('DOMContentLoaded', function() {
            // Optimisation couleurs rapport activée
            
            // Force l'affichage des couleurs pour tous les modules
            const modules = document.querySelectorAll('.module');
            modules.forEach(module => {
                // Propriétés CSS pour forcer l'impression couleurs
                module.style.webkitPrintColorAdjust = 'exact';
                module.style.colorAdjust = 'exact';
                module.style.printColorAdjust = 'exact';
            });
            
            // Optimisation avant impression
            window.addEventListener('beforeprint', function() {
                // Impression détectée - force des couleurs
                
                // Force chaque couleur individuellement
                document.querySelectorAll('.module.ok').forEach(el => {
                    el.style.setProperty('background-color', '#22c55e', 'important');
                });
                document.querySelectorAll('.module.inequality').forEach(el => {
                    el.style.setProperty('background-color', '#eab308', 'important');
                });
                document.querySelectorAll('.module.microcracks').forEach(el => {
                    el.style.setProperty('background-color', '#f97316', 'important');
                });
                document.querySelectorAll('.module.dead').forEach(el => {
                    el.style.setProperty('background-color', '#ef4444', 'important');
                });
                document.querySelectorAll('.module.string_open').forEach(el => {
                    el.style.setProperty('background-color', '#3b82f6', 'important');
                });
                document.querySelectorAll('.module.not_connected').forEach(el => {
                    el.style.setProperty('background-color', '#6b7280', 'important');
                });
            });
        });
    </script>
    </html>
  `
}

function getStatusLabel(status: string): string {
  const labels: { [key: string]: string } = {
    'ok': '🟢 OK',
    'inequality': '🟡 Inégalité',
    'microcracks': '🟠 Microfissures',
    'dead': '🔴 HS',
    'string_open': '🔵 String ouvert',
    'not_connected': '⚫ Non raccordé'
  }
  return labels[status] || status
}

// Route Dashboard - Tableau de bord audits en temps réel
app.get('/dashboard', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dashboard - DiagPV Audits</title>
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
            content: "✓" !important;
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
    <body class="bg-black text-white min-h-screen font-bold">
        <!-- Header Dashboard -->
        <header class="bg-gray-900 border-b-2 border-orange-400 p-4">
            <div class="container mx-auto flex justify-between items-center">
                <div class="flex items-center space-x-4">
                    <i class="fas fa-tachometer-alt text-3xl text-orange-400"></i>
                    <div>
                        <h1 class="text-2xl font-black">DASHBOARD AUDITS</h1>
                        <p class="text-gray-300">Tableau de bord temps réel - DiagPV</p>
                    </div>
                </div>
                
                <div class="flex space-x-3">
                    <a href="/" class="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded font-bold">
                        <i class="fas fa-home mr-1"></i>ACCUEIL
                    </a>
                    <a href="/pv/plants" class="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded font-bold">
                        <i class="fas fa-solar-panel mr-1"></i>PV CARTO
                    </a>
                    <button id="refreshBtn" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-bold">
                        <i class="fas fa-sync-alt mr-1"></i>ACTUALISER
                    </button>
                    <button id="autoRefreshBtn" class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-bold">
                        <i class="fas fa-play mr-1"></i>AUTO (OFF)
                    </button>
                </div>
            </div>
        </header>

        <!-- Statistiques globales -->
        <div class="container mx-auto p-6">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div class="bg-blue-900 rounded-lg p-4 text-center">
                    <i class="fas fa-clipboard-list text-3xl text-blue-400 mb-2"></i>
                    <div class="text-2xl font-black" id="totalAudits">0</div>
                    <div class="text-sm text-gray-300">Audits Totaux</div>
                </div>
                
                <div class="bg-green-900 rounded-lg p-4 text-center">
                    <i class="fas fa-play text-3xl text-green-400 mb-2"></i>
                    <div class="text-2xl font-black" id="activeAudits">0</div>
                    <div class="text-sm text-gray-300">En Cours</div>
                </div>
                
                <div class="bg-orange-900 rounded-lg p-4 text-center">
                    <i class="fas fa-solar-panel text-3xl text-orange-400 mb-2"></i>
                    <div class="text-2xl font-black" id="totalModules">0</div>
                    <div class="text-sm text-gray-300">Modules Totaux</div>
                </div>
                
                <div class="bg-red-900 rounded-lg p-4 text-center">
                    <i class="fas fa-exclamation-triangle text-3xl text-red-400 mb-2"></i>
                    <div class="text-2xl font-black" id="totalDefauts">0</div>
                    <div class="text-sm text-gray-300">Défauts Détectés</div>
                </div>
            </div>

            <!-- Dernière mise à jour -->
            <div class="mb-6 text-center">
                <span class="text-gray-400">Dernière mise à jour : </span>
                <span id="lastUpdate" class="text-green-400 font-black">--:--:--</span>
                <span id="autoStatus" class="ml-4 px-2 py-1 bg-gray-600 rounded text-xs">MANUEL</span>
            </div>

            <!-- Liste des audits -->
            <div class="bg-gray-900 rounded-lg p-6 border border-gray-600">
                <h2 class="text-xl font-black mb-4 flex items-center">
                    <i class="fas fa-list mr-2 text-blue-400"></i>
                    AUDITS EN COURS
                </h2>
                
                <!-- Loading -->
                <div id="loading" class="text-center py-8">
                    <i class="fas fa-spinner fa-spin text-3xl text-blue-400 mb-4"></i>
                    <p class="text-gray-400">Chargement des audits...</p>
                </div>
                
                <!-- Table audits -->
                <div id="auditsContainer" class="hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead>
                                <tr class="border-b border-gray-600">
                                    <th class="text-left py-3 px-2 text-orange-400">Projet</th>
                                    <th class="text-left py-3 px-2 text-orange-400">Client</th>
                                    <th class="text-left py-3 px-2 text-orange-400">Localisation</th>
                                    <th class="text-center py-3 px-2 text-orange-400">Modules</th>
                                    <th class="text-center py-3 px-2 text-orange-400">Progression</th>
                                    <th class="text-center py-3 px-2 text-orange-400">Défauts</th>
                                    <th class="text-center py-3 px-2 text-orange-400">Statut</th>
                                    <th class="text-center py-3 px-2 text-orange-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="auditsTable">
                                <!-- Audits seront chargés ici -->
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <!-- Aucun audit -->
                <div id="noAudits" class="hidden text-center py-8">
                    <i class="fas fa-inbox text-4xl text-gray-400 mb-4"></i>
                    <p class="text-gray-400 text-lg">Aucun audit trouvé</p>
                    <a href="/" class="inline-block mt-4 bg-green-600 hover:bg-green-700 px-6 py-3 rounded font-bold">
                        <i class="fas fa-plus mr-2"></i>CRÉER UN AUDIT
                    </a>
                </div>
            </div>
        </div>
        
        <script src="/static/diagpv-dashboard.js"></script>
    </body>
    </html>
  `)
})

// ============================================================================
// ROUTE PV CARTOGRAPHY - Liste centrales PV (NOUVEAU - NON-DESTRUCTIF)
// ============================================================================
app.get('/pv/plants', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PV Cartography - Centrales Photovoltaïques</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/diagpv-styles.css" rel="stylesheet">
    </head>
    <body class="bg-black text-white min-h-screen">
        <div class="container mx-auto px-4 py-8 max-w-7xl">
            <!-- Header -->
            <div class="mb-8">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <h1 class="text-4xl font-black text-purple-400 mb-2">
                            <i class="fas fa-solar-panel mr-3"></i>PV CARTOGRAPHY
                        </h1>
                        <p class="text-gray-400 text-lg">Modélisation & Cartographie Centrales Photovoltaïques</p>
                    </div>
                    <div class="flex gap-3">
                        <a href="/" class="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded font-bold">
                            <i class="fas fa-home mr-2"></i>ACCUEIL
                        </a>
                        <a href="/dashboard" class="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded font-bold">
                            <i class="fas fa-chart-line mr-2"></i>AUDITS
                        </a>
                        <button id="createPlantBtn" class="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded font-black">
                            <i class="fas fa-plus mr-2"></i>NOUVELLE CENTRALE
                        </button>
                    </div>
                </div>
            </div>

            <!-- Statistiques -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div class="bg-gray-900 rounded-lg p-6 border border-purple-400">
                    <div class="text-3xl font-black text-purple-400 mb-2" id="statsPlants">0</div>
                    <div class="text-sm text-gray-400">Centrales</div>
                </div>
                <div class="bg-gray-900 rounded-lg p-6 border border-blue-400">
                    <div class="text-3xl font-black text-blue-400 mb-2" id="statsZones">0</div>
                    <div class="text-sm text-gray-400">Zones</div>
                </div>
                <div class="bg-gray-900 rounded-lg p-6 border border-green-400">
                    <div class="text-3xl font-black text-green-400 mb-2" id="statsModules">0</div>
                    <div class="text-sm text-gray-400">Modules</div>
                </div>
                <div class="bg-gray-900 rounded-lg p-6 border border-yellow-400">
                    <div class="text-3xl font-black text-yellow-400 mb-2" id="statsPower">0</div>
                    <div class="text-sm text-gray-400">kWc Total</div>
                </div>
            </div>

            <!-- Liste centrales -->
            <div id="plantsList" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- Chargement -->
                <div class="col-span-full text-center py-12">
                    <i class="fas fa-spinner fa-spin text-4xl text-purple-400 mb-4"></i>
                    <p class="text-gray-400">Chargement centrales...</p>
                </div>
            </div>

            <!-- Message vide -->
            <div id="emptyState" class="hidden text-center py-12">
                <i class="fas fa-solar-panel text-6xl text-gray-600 mb-4"></i>
                <p class="text-gray-400 text-xl mb-6">Aucune centrale PV créée</p>
                <button onclick="showCreatePlantModal()" class="bg-purple-600 hover:bg-purple-700 px-8 py-3 rounded font-black text-lg">
                    <i class="fas fa-plus mr-2"></i>CRÉER MA PREMIÈRE CENTRALE
                </button>
            </div>
        </div>

        <!-- Modal Création Centrale -->
        <div id="createPlantModal" class="hidden fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
            <div class="bg-gray-900 border-2 border-purple-400 rounded-lg p-6 max-w-2xl w-full">
                <h3 class="text-2xl font-black mb-4 text-purple-400">
                    <i class="fas fa-plus-circle mr-2"></i>NOUVELLE CENTRALE PV
                </h3>
                
                <form id="createPlantForm" class="space-y-4">
                    <div>
                        <label class="block text-sm font-bold mb-2">Nom de la centrale *</label>
                        <input type="text" id="plantName" required
                               class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2 focus:border-purple-400 focus:outline-none"
                               placeholder="Ex: Centrale Solaire Marseille">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-bold mb-2">Type d'installation *</label>
                        <select id="plantType" required
                                class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2 focus:border-purple-400 focus:outline-none">
                            <option value="rooftop">Toiture</option>
                            <option value="ground">Sol</option>
                            <option value="carport">Ombrière</option>
                        </select>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-bold mb-2">Adresse</label>
                            <input type="text" id="plantAddress"
                                   class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2 focus:border-purple-400 focus:outline-none"
                                   placeholder="123 Rue du Soleil">
                        </div>
                        <div>
                            <label class="block text-sm font-bold mb-2">Ville</label>
                            <input type="text" id="plantCity"
                                   class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2 focus:border-purple-400 focus:outline-none"
                                   placeholder="Marseille">
                        </div>
                    </div>
                    
                    <div class="flex gap-3 pt-4">
                        <button type="submit" class="flex-1 bg-purple-600 hover:bg-purple-700 py-3 rounded font-black">
                            <i class="fas fa-save mr-2"></i>CRÉER CENTRALE
                        </button>
                        <button type="button" id="cancelCreateBtn" class="flex-1 bg-gray-600 hover:bg-gray-700 py-3 rounded font-black">
                            ANNULER
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <script>
        // Script PV Cartography - Liste centrales
        let plants = []

        async function loadPlants() {
            try {
                const response = await fetch('/api/pv/plants')
                const data = await response.json()
                
                plants = data.plants || []
                
                updateStats()
                renderPlantsList()
            } catch (error) {
                console.error('Erreur chargement centrales:', error)
                showAlert('Erreur chargement centrales', 'error')
            }
        }

        function updateStats() {
            const totalZones = plants.reduce((sum, p) => sum + (p.zone_count || 0), 0)
            const totalModules = plants.reduce((sum, p) => sum + (p.module_count || 0), 0)
            const totalPower = plants.reduce((sum, p) => sum + (p.total_power_wp || 0), 0)
            
            document.getElementById('statsPlants').textContent = plants.length
            document.getElementById('statsZones').textContent = totalZones
            document.getElementById('statsModules').textContent = totalModules.toLocaleString()
            document.getElementById('statsPower').textContent = (totalPower / 1000).toFixed(1)
        }

        function renderPlantsList() {
            const container = document.getElementById('plantsList')
            const emptyState = document.getElementById('emptyState')
            
            if (plants.length === 0) {
                container.classList.add('hidden')
                emptyState.classList.remove('hidden')
                return
            }
            
            container.classList.remove('hidden')
            emptyState.classList.add('hidden')
            
            const typeIcons = {
                rooftop: 'fa-building',
                ground: 'fa-mountain',
                carport: 'fa-car'
            }
            
            const typeLabels = {
                rooftop: 'Toiture',
                ground: 'Sol',
                carport: 'Ombrière'
            }
            
            container.innerHTML = plants.map(plant => \`
                <div class="bg-gray-900 rounded-lg border-2 border-gray-700 hover:border-purple-400 transition-all p-6">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h3 class="text-xl font-black text-purple-400 mb-1">\${plant.plant_name}</h3>
                            <p class="text-sm text-gray-400">
                                <i class="fas \${typeIcons[plant.plant_type] || 'fa-solar-panel'} mr-1"></i>
                                \${typeLabels[plant.plant_type] || plant.plant_type}
                            </p>
                        </div>
                        <button onclick="deletePlant(\${plant.id})" 
                                class="text-red-400 hover:text-red-300" title="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    
                    <div class="grid grid-cols-3 gap-3 mb-4 text-center">
                        <div>
                            <div class="text-2xl font-bold text-blue-400">\${plant.zone_count || 0}</div>
                            <div class="text-xs text-gray-500">Zones</div>
                        </div>
                        <div>
                            <div class="text-2xl font-bold text-green-400">\${plant.module_count || 0}</div>
                            <div class="text-xs text-gray-500">Modules</div>
                        </div>
                        <div>
                            <div class="text-2xl font-bold text-yellow-400">\${((plant.total_power_wp || 0) / 1000).toFixed(1)}</div>
                            <div class="text-xs text-gray-500">kWc</div>
                        </div>
                    </div>
                    
                    \${plant.address || plant.city ? \`
                        <p class="text-sm text-gray-400 mb-4">
                            <i class="fas fa-map-marker-alt mr-1"></i>
                            \${plant.address || ''} \${plant.city || ''}
                        </p>
                    \` : ''}
                    
                    <div class="flex gap-2">
                        <a href="/pv/plant/\${plant.id}" 
                           class="flex-1 bg-purple-600 hover:bg-purple-700 py-2 rounded font-bold text-center">
                            <i class="fas fa-eye mr-1"></i>VOIR
                        </a>
                    </div>
                </div>
            \`).join('')
        }

        function showCreatePlantModal() {
            document.getElementById('createPlantModal').classList.remove('hidden')
        }

        function hideCreatePlantModal() {
            document.getElementById('createPlantModal').classList.add('hidden')
            document.getElementById('createPlantForm').reset()
        }

        async function createPlant(formData) {
            try {
                const response = await fetch('/api/pv/plants', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                })
                
                const result = await response.json()
                
                if (result.success) {
                    showAlert('Centrale créée avec succès !', 'success')
                    hideCreatePlantModal()
                    loadPlants()
                } else {
                    showAlert('Erreur création centrale', 'error')
                }
            } catch (error) {
                console.error('Erreur:', error)
                showAlert('Erreur création centrale', 'error')
            }
        }

        async function deletePlant(plantId) {
            if (!confirm('Supprimer cette centrale et toutes ses données ?')) return
            
            try {
                const response = await fetch(\`/api/pv/plants/\${plantId}\`, {
                    method: 'DELETE'
                })
                
                if (response.ok) {
                    showAlert('Centrale supprimée', 'success')
                    loadPlants()
                }
            } catch (error) {
                console.error('Erreur suppression:', error)
                showAlert('Erreur suppression centrale', 'error')
            }
        }

        function showAlert(message, type = 'info') {
            const colors = {
                success: 'bg-green-600',
                error: 'bg-red-600',
                info: 'bg-blue-600'
            }
            
            const alert = document.createElement('div')
            alert.className = \`fixed top-4 right-4 \${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 font-bold\`
            alert.textContent = message
            
            document.body.appendChild(alert)
            
            setTimeout(() => alert.remove(), 3000)
        }

        // Event listeners
        document.getElementById('createPlantBtn').addEventListener('click', showCreatePlantModal)
        document.getElementById('cancelCreateBtn').addEventListener('click', hideCreatePlantModal)
        
        document.getElementById('createPlantForm').addEventListener('submit', (e) => {
            e.preventDefault()
            
            const formData = {
                plant_name: document.getElementById('plantName').value,
                plant_type: document.getElementById('plantType').value,
                address: document.getElementById('plantAddress').value || null,
                city: document.getElementById('plantCity').value || null
            }
            
            createPlant(formData)
        })

        // Init
        loadPlants()
        </script>
    </body>
    </html>
  `)
})

// ============================================================================
// ROUTE PV CARTOGRAPHY - Canvas Editor (PHASE 2b)
// ============================================================================
app.get('/pv/plant/:plantId/zone/:zoneId/editor', async (c) => {
  const plantId = c.req.param('plantId')
  const zoneId = c.req.param('zoneId')
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Canvas Editor - Zone PV</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
        <style>
            /* CSS identique Module EL pour status modules */
            .module-rect.ok { fill: #22c55e; }
            .module-rect.inequality { fill: #eab308; }
            .module-rect.microcracks { fill: #f97316; }
            .module-rect.dead { fill: #ef4444; }
            .module-rect.string_open { fill: #3b82f6; }
            .module-rect.not_connected { fill: #6b7280; }
            .module-rect.pending { fill: #e5e7eb; stroke: #9ca3af; stroke-dasharray: 2,2; }
            
            @keyframes pulse-danger {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }
            
            .module-rect.dead {
                animation: pulse-danger 2s infinite;
            }
            
            #canvas { 
                border: 2px solid #9333ea; 
                cursor: crosshair;
                max-width: 100%;
                display: block;
            }
            
            .mode-btn.active {
                background-color: #9333ea !important;
            }
        </style>
    </head>
    <body class="bg-black text-white min-h-screen">
        <!-- Header Navigation -->
        <div class="bg-gray-900 border-b-2 border-purple-400 p-4">
            <div class="container mx-auto flex justify-between items-center">
                <div class="flex gap-3">
                    <a href="/pv/plant/${plantId}" class="text-purple-400 hover:text-purple-300 font-bold">
                        <i class="fas fa-arrow-left mr-2"></i>RETOUR ZONE
                    </a>
                    <h1 id="zoneTitle" class="text-xl font-black">Zone...</h1>
                </div>
                <div class="flex gap-3">
                    <button id="saveBtn" class="bg-green-600 hover:bg-green-700 px-6 py-2 rounded font-black">
                        <i class="fas fa-save mr-2"></i>ENREGISTRER
                    </button>
                    <button id="exportBtn" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-bold">
                        <i class="fas fa-file-pdf mr-2"></i>EXPORT PDF
                    </button>
                </div>
            </div>
        </div>

        <div class="container mx-auto px-4 py-6">
            <!-- Toolbar -->
            <div class="bg-gray-900 rounded-lg border-2 border-purple-400 p-4 mb-6">
                <div class="flex flex-wrap gap-3 items-center">
                    <!-- Mode Placement -->
                    <div class="flex gap-2">
                        <button id="modeManualBtn" class="mode-btn active bg-purple-600 px-4 py-2 rounded font-bold">
                            <i class="fas fa-mouse-pointer mr-2"></i>MANUEL
                        </button>
                        <button id="modeGridBtn" class="mode-btn bg-gray-600 px-4 py-2 rounded font-bold">
                            <i class="fas fa-th mr-2"></i>GRILLE AUTO
                        </button>
                    </div>
                    
                    <!-- Upload Image Fond -->
                    <div>
                        <label class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-bold cursor-pointer">
                            <i class="fas fa-image mr-2"></i>IMAGE FOND
                            <input type="file" id="uploadBackground" accept="image/*" class="hidden">
                        </label>
                    </div>
                    
                    <!-- Rotation -->
                    <div class="flex gap-2 items-center">
                        <button id="rotateBtn" class="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded font-bold">
                            <i class="fas fa-redo mr-2"></i>ROTATION
                        </button>
                        <span id="rotationLabel" class="px-3 py-2 bg-gray-800 rounded font-bold">0°</span>
                    </div>
                    
                    <!-- Config Grille -->
                    <div class="flex gap-2 items-center border-l-2 border-gray-600 pl-3">
                        <label class="text-sm font-bold">Lignes:</label>
                        <input type="number" id="gridRows" value="10" min="1" max="50" 
                               class="w-16 bg-black border border-gray-600 rounded px-2 py-1 text-center font-bold">
                        <label class="text-sm font-bold">Cols:</label>
                        <input type="number" id="gridCols" value="10" min="1" max="50" 
                               class="w-16 bg-black border border-gray-600 rounded px-2 py-1 text-center font-bold">
                        <button id="applyGridBtn" class="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm font-bold">
                            APPLIQUER
                        </button>
                    </div>
                    
                    <!-- Reset -->
                    <button id="clearBtn" class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-bold ml-auto">
                        <i class="fas fa-trash mr-2"></i>EFFACER TOUT
                    </button>
                </div>
            </div>

            <!-- Canvas -->
            <div class="bg-gray-900 rounded-lg border-2 border-purple-400 p-4 mb-6">
                <canvas id="canvas" width="1200" height="800"></canvas>
            </div>

            <!-- Stats -->
            <div class="grid grid-cols-7 gap-3">
                <div class="bg-gray-900 rounded-lg p-3 text-center border border-purple-400">
                    <div class="text-xl font-black text-purple-400" id="statsTotal">0</div>
                    <div class="text-xs text-gray-400">Total</div>
                </div>
                <div class="bg-gray-900 rounded-lg p-3 text-center border border-green-400">
                    <div class="text-xl font-black text-green-400" id="statsOk">0</div>
                    <div class="text-xs text-gray-400">🟢 OK</div>
                </div>
                <div class="bg-gray-900 rounded-lg p-3 text-center border border-yellow-400">
                    <div class="text-xl font-black text-yellow-400" id="statsInequality">0</div>
                    <div class="text-xs text-gray-400">🟡 Inégalité</div>
                </div>
                <div class="bg-gray-900 rounded-lg p-3 text-center border border-orange-400">
                    <div class="text-xl font-black text-orange-400" id="statsMicrocracks">0</div>
                    <div class="text-xs text-gray-400">🟠 Fissures</div>
                </div>
                <div class="bg-gray-900 rounded-lg p-3 text-center border border-red-400">
                    <div class="text-xl font-black text-red-400" id="statsDead">0</div>
                    <div class="text-xs text-gray-400">🔴 HS</div>
                </div>
                <div class="bg-gray-900 rounded-lg p-3 text-center border border-blue-400">
                    <div class="text-xl font-black text-blue-400" id="statsStringOpen">0</div>
                    <div class="text-xs text-gray-400">🔵 String</div>
                </div>
                <div class="bg-gray-900 rounded-lg p-3 text-center border border-gray-400">
                    <div class="text-xl font-black text-gray-400" id="statsPending">0</div>
                    <div class="text-xs text-gray-400">⚪ Pending</div>
                </div>
            </div>
        </div>

        <!-- Modal Statut Module (IDENTIQUE Module EL) -->
        <div id="moduleModal" class="hidden fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
            <div class="bg-gray-900 border-2 border-yellow-400 rounded-lg p-6 max-w-md w-full">
                <h3 id="modalTitle" class="text-xl font-black mb-4 text-center">MODULE M000</h3>
                
                <div class="grid grid-cols-2 gap-3 mb-4">
                    <button class="module-status-btn bg-green-600 hover:bg-green-700 p-3 rounded font-bold" data-status="ok">
                        🟢 OK<br><span class="text-sm font-normal">Aucun défaut détecté</span>
                    </button>
                    <button class="module-status-btn bg-yellow-600 hover:bg-yellow-700 p-3 rounded font-bold" data-status="inequality">
                        🟡 Inégalité<br><span class="text-sm font-normal">Qualité cellules</span>
                    </button>
                    <button class="module-status-btn bg-orange-600 hover:bg-orange-700 p-3 rounded font-bold" data-status="microcracks">
                        🟠 Microfissures<br><span class="text-sm font-normal">Visibles EL</span>
                    </button>
                    <button class="module-status-btn bg-red-600 hover:bg-red-700 p-3 rounded font-bold" data-status="dead">
                        🔴 HS<br><span class="text-sm font-normal">Module défaillant</span>
                    </button>
                    <button class="module-status-btn bg-blue-600 hover:bg-blue-700 p-3 rounded font-bold" data-status="string_open">
                        🔵 String ouvert<br><span class="text-sm font-normal">Sous-string ouvert</span>
                    </button>
                    <button class="module-status-btn bg-gray-600 hover:bg-gray-700 p-3 rounded font-bold" data-status="not_connected">
                        ⚫ Non raccordé<br><span class="text-sm font-normal">Non connecté</span>
                    </button>
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-bold mb-2">Commentaire (optionnel) :</label>
                    <input type="text" id="moduleComment" 
                           class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2 focus:border-yellow-400 focus:outline-none"
                           placeholder="Détails du défaut...">
                </div>
                
                <div class="flex gap-3">
                    <button id="saveStatusBtn" class="flex-1 bg-green-600 hover:bg-green-700 py-3 rounded font-black">
                        ENREGISTRER
                    </button>
                    <button id="cancelStatusBtn" class="flex-1 bg-gray-600 hover:bg-gray-700 py-3 rounded font-black">
                        ANNULER
                    </button>
                </div>
            </div>
        </div>

        <script>
        // VARIABLES GLOBALES
        const plantId = '${plantId}'
        const zoneId = '${zoneId}'
        const canvas = document.getElementById('canvas')
        const ctx = canvas.getContext('2d')
        
        let modules = []
        let zoneData = null
        let backgroundImage = null
        let placementMode = 'manual'
        let currentRotation = 0
        let selectedModule = null
        let nextModuleNum = 1
        
        // DIMENSIONS MODULE (pixels, ratio 1.7:1)
        const MODULE_WIDTH_PX = 51
        const MODULE_HEIGHT_PX = 30
        const SCALE = 30 // 30 px = 1 m
        
        // COULEURS STATUS (IDENTIQUE Module EL)
        const STATUS_COLORS = {
            ok: '#22c55e',
            inequality: '#eab308',
            microcracks: '#f97316',
            dead: '#ef4444',
            string_open: '#3b82f6',
            not_connected: '#6b7280',
            pending: '#e5e7eb'
        }
        
        // ========================================================================
        // INIT
        // ========================================================================
        async function init() {
            await loadZone()
            await loadModules()
            render()
            setupEventListeners()
        }
        
        async function loadZone() {
            try {
                const response = await fetch(\`/api/pv/plants/\${plantId}/zones/\${zoneId}\`)
                const data = await response.json()
                zoneData = data.zone
                
                document.getElementById('zoneTitle').textContent = zoneData.zone_name
                
                if (zoneData.background_image_url) {
                    backgroundImage = new Image()
                    backgroundImage.src = zoneData.background_image_url
                    backgroundImage.onload = () => render()
                }
            } catch (error) {
                console.error('Erreur chargement zone:', error)
            }
        }
        
        async function loadModules() {
            try {
                const response = await fetch(\`/api/pv/plants/\${plantId}/zones/\${zoneId}/modules\`)
                const data = await response.json()
                modules = data.modules || []
                
                if (modules.length > 0) {
                    nextModuleNum = Math.max(...modules.map(m => {
                        const match = m.module_identifier.match(/\\d+/)
                        return match ? parseInt(match[0]) : 0
                    })) + 1
                }
                
                updateStats()
            } catch (error) {
                console.error('Erreur chargement modules:', error)
            }
        }
        
        // ========================================================================
        // RENDER
        // ========================================================================
        function render() {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            
            // Fond noir
            ctx.fillStyle = '#000'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            
            // Image fond si chargée
            if (backgroundImage) {
                ctx.globalAlpha = 0.6
                ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height)
                ctx.globalAlpha = 1.0
            }
            
            // Modules
            modules.forEach(module => {
                drawModule(module)
            })
        }
        
        function drawModule(module) {
            const x = module.pos_x_meters * SCALE
            const y = module.pos_y_meters * SCALE
            const width = module.width_meters * SCALE
            const height = module.height_meters * SCALE
            
            ctx.save()
            ctx.translate(x + width/2, y + height/2)
            ctx.rotate(module.rotation * Math.PI / 180)
            
            // Rectangle module avec couleur status
            ctx.fillStyle = STATUS_COLORS[module.module_status] || STATUS_COLORS.pending
            ctx.fillRect(-width/2, -height/2, width, height)
            
            // Border
            ctx.strokeStyle = '#000'
            ctx.lineWidth = 2
            ctx.strokeRect(-width/2, -height/2, width, height)
            
            // Identifiant module
            ctx.fillStyle = '#000'
            ctx.font = 'bold 11px Arial'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(module.module_identifier, 0, 0)
            
            ctx.restore()
        }
        
        // ========================================================================
        // INTERACTIONS
        // ========================================================================
        function setupEventListeners() {
            // Canvas clic
            canvas.addEventListener('click', handleCanvasClick)
            
            // Modes
            document.getElementById('modeManualBtn').addEventListener('click', () => setMode('manual'))
            document.getElementById('modeGridBtn').addEventListener('click', () => setMode('grid'))
            
            // Rotation
            document.getElementById('rotateBtn').addEventListener('click', rotateNext)
            
            // Grille
            document.getElementById('applyGridBtn').addEventListener('click', applyGrid)
            
            // Upload fond
            document.getElementById('uploadBackground').addEventListener('change', handleImageUpload)
            
            // Clear
            document.getElementById('clearBtn').addEventListener('click', clearAll)
            
            // Save
            document.getElementById('saveBtn').addEventListener('click', saveModules)
            
            // Export
            document.getElementById('exportBtn').addEventListener('click', exportPDF)
            
            // Modal status
            document.querySelectorAll('.module-status-btn').forEach(btn => {
                btn.addEventListener('click', () => selectStatus(btn.dataset.status))
            })
            document.getElementById('cancelStatusBtn').addEventListener('click', closeModal)
        }
        
        function handleCanvasClick(e) {
            const rect = canvas.getBoundingClientRect()
            const x = (e.clientX - rect.left) * (canvas.width / rect.width)
            const y = (e.clientY - rect.top) * (canvas.height / rect.height)
            
            const clickedModule = findModuleAt(x, y)
            if (clickedModule) {
                openStatusModal(clickedModule)
            } else if (placementMode === 'manual') {
                addModule(x / SCALE, y / SCALE)
            }
        }
        
        function findModuleAt(x, y) {
            return modules.find(m => {
                const mx = m.pos_x_meters * SCALE
                const my = m.pos_y_meters * SCALE
                const mw = m.width_meters * SCALE
                const mh = m.height_meters * SCALE
                
                // Vérifier rotation
                const centerX = mx + mw/2
                const centerY = my + mh/2
                const angle = -m.rotation * Math.PI / 180
                
                const dx = x - centerX
                const dy = y - centerY
                const rotatedX = dx * Math.cos(angle) - dy * Math.sin(angle)
                const rotatedY = dx * Math.sin(angle) + dy * Math.cos(angle)
                
                return Math.abs(rotatedX) <= mw/2 && Math.abs(rotatedY) <= mh/2
            })
        }
        
        function addModule(xMeters, yMeters) {
            const newModule = {
                zone_id: parseInt(zoneId),
                module_identifier: \`M\${nextModuleNum}\`,
                string_number: 1,
                position_in_string: modules.length + 1,
                pos_x_meters: xMeters,
                pos_y_meters: yMeters,
                width_meters: 1.7,
                height_meters: 1.0,
                rotation: currentRotation,
                power_wp: 450,
                module_status: 'pending',
                status_comment: null
            }
            
            modules.push(newModule)
            nextModuleNum++
            render()
            updateStats()
        }
        
        function applyGrid() {
            const rows = parseInt(document.getElementById('gridRows').value)
            const cols = parseInt(document.getElementById('gridCols').value)
            const spacing = 0.02 // 2cm
            
            modules = []
            nextModuleNum = 1
            
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    modules.push({
                        zone_id: parseInt(zoneId),
                        module_identifier: \`M\${nextModuleNum}\`,
                        string_number: Math.floor((nextModuleNum - 1) / cols) + 1,
                        position_in_string: ((nextModuleNum - 1) % cols) + 1,
                        pos_x_meters: col * (1.7 + spacing),
                        pos_y_meters: row * (1.0 + spacing),
                        width_meters: 1.7,
                        height_meters: 1.0,
                        rotation: currentRotation,
                        power_wp: 450,
                        module_status: 'pending',
                        status_comment: null
                    })
                    nextModuleNum++
                }
            }
            
            render()
            updateStats()
        }
        
        function rotateNext() {
            currentRotation = (currentRotation + 90) % 360
            document.getElementById('rotationLabel').textContent = currentRotation + '°'
        }
        
        function setMode(mode) {
            placementMode = mode
            document.getElementById('modeManualBtn').classList.toggle('active', mode === 'manual')
            document.getElementById('modeGridBtn').classList.toggle('active', mode === 'grid')
            
            if (mode === 'manual') {
                document.getElementById('modeManualBtn').classList.replace('bg-gray-600', 'bg-purple-600')
                document.getElementById('modeGridBtn').classList.replace('bg-purple-600', 'bg-gray-600')
            } else {
                document.getElementById('modeGridBtn').classList.replace('bg-gray-600', 'bg-purple-600')
                document.getElementById('modeManualBtn').classList.replace('bg-purple-600', 'bg-gray-600')
            }
        }
        
        function clearAll() {
            if (confirm('Effacer tous les modules ?')) {
                modules = []
                nextModuleNum = 1
                render()
                updateStats()
            }
        }
        
        // ========================================================================
        // MODAL STATUS
        // ========================================================================
        function openStatusModal(module) {
            selectedModule = module
            document.getElementById('modalTitle').textContent = module.module_identifier
            document.getElementById('moduleComment').value = module.status_comment || ''
            document.getElementById('moduleModal').classList.remove('hidden')
        }
        
        function closeModal() {
            document.getElementById('moduleModal').classList.add('hidden')
            selectedModule = null
        }
        
        function selectStatus(status) {
            if (!selectedModule) return
            
            selectedModule.module_status = status
            selectedModule.status_comment = document.getElementById('moduleComment').value || null
            
            closeModal()
            render()
            updateStats()
        }
        
        // ========================================================================
        // UPLOAD IMAGE
        // ========================================================================
        async function handleImageUpload(e) {
            const file = e.target.files[0]
            if (!file) return
            
            const reader = new FileReader()
            reader.onload = async (event) => {
                backgroundImage = new Image()
                backgroundImage.src = event.target.result
                backgroundImage.onload = () => {
                    render()
                    saveBackgroundImage(event.target.result)
                }
            }
            reader.readAsDataURL(file)
        }
        
        async function saveBackgroundImage(dataUrl) {
            try {
                await fetch(\`/api/pv/plants/\${plantId}/zones/\${zoneId}/background\`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        image_url: dataUrl,
                        image_type: 'upload',
                        width_meters: 50,
                        height_meters: 30
                    })
                })
            } catch (error) {
                console.error('Erreur sauvegarde image:', error)
            }
        }
        
        // ========================================================================
        // SAVE
        // ========================================================================
        async function saveModules() {
            try {
                // Supprimer modules existants
                await fetch(\`/api/pv/plants/\${plantId}/zones/\${zoneId}/modules\`, {
                    method: 'DELETE'
                })
                
                if (modules.length === 0) {
                    alert('Aucun module à sauvegarder')
                    return
                }
                
                // Créer nouveaux modules
                const response = await fetch(\`/api/pv/plants/\${plantId}/zones/\${zoneId}/modules\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ modules })
                })
                
                const data = await response.json()
                
                if (data.success) {
                    alert(\`\${data.added} module(s) sauvegardé(s) avec succès!\`)
                    await loadModules()
                } else {
                    alert('Erreur: ' + data.error)
                }
            } catch (error) {
                alert('Erreur sauvegarde: ' + error.message)
            }
        }
        
        // ========================================================================
        // EXPORT PDF
        // ========================================================================
        function exportPDF() {
            const { jsPDF } = window.jspdf
            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            })
            
            // Page 1: Plan
            doc.setFontSize(16)
            doc.text(\`Plan Calepinage - \${zoneData.zone_name}\`, 10, 10)
            
            const canvasDataUrl = canvas.toDataURL('image/png')
            doc.addImage(canvasDataUrl, 'PNG', 10, 20, 277, 165)
            
            // Page 2: Tableau
            doc.addPage()
            doc.setFontSize(14)
            doc.text('LISTE MODULES', 10, 10)
            
            doc.setFontSize(9)
            let y = 20
            modules.forEach((m, i) => {
                doc.text(\`\${m.module_identifier} | String \${m.string_number} | Pos \${m.position_in_string} | Status: \${m.module_status}\`, 10, y)
                if (m.status_comment) {
                    y += 4
                    doc.setFontSize(8)
                    doc.text(\`   → \${m.status_comment}\`, 10, y)
                    doc.setFontSize(9)
                }
                y += 5
                if (y > 190) {
                    doc.addPage()
                    y = 10
                }
            })
            
            doc.save(\`calepinage_\${zoneData.zone_name}_\${Date.now()}.pdf\`)
        }
        
        // ========================================================================
        // STATS
        // ========================================================================
        function updateStats() {
            document.getElementById('statsTotal').textContent = modules.length
            document.getElementById('statsOk').textContent = modules.filter(m => m.module_status === 'ok').length
            document.getElementById('statsInequality').textContent = modules.filter(m => m.module_status === 'inequality').length
            document.getElementById('statsMicrocracks').textContent = modules.filter(m => m.module_status === 'microcracks').length
            document.getElementById('statsDead').textContent = modules.filter(m => m.module_status === 'dead').length
            document.getElementById('statsStringOpen').textContent = modules.filter(m => m.module_status === 'string_open').length
            document.getElementById('statsPending').textContent = modules.filter(m => m.module_status === 'pending').length
        }
        
        // INIT
        init()
        </script>
    </body>
    </html>
  `)
})
// CETTE SECTION SERA INSÉRÉE DANS index.tsx LIGNE 3344

// ============================================================================
// ROUTE PV CARTOGRAPHY - Canvas Editor V2 LEAFLET PROFESSIONNEL (PHASE 2c)
// ============================================================================
app.get('/pv/plant/:plantId/zone/:zoneId/editor/v2', async (c) => {
  const plantId = c.req.param('plantId')
  const zoneId = c.req.param('zoneId')
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cartographie PV Pro - DiagPV</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script src="https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/@turf/turf@6/turf.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
        
        <style>
            #map { height: 700px; width: 100%; border: 2px solid #9333ea; border-radius: 0.5rem; }
            .module-ok { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); }
            .module-inequality { background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%); }
            .module-microcracks { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); }
            .module-dead { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); animation: pulse 2s infinite; }
            .module-string_open { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); }
            .module-not_connected { background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); }
            .module-pending { background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%); border: 2px dashed #9ca3af !important; }
            @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
            
            /* Fix z-index modal au-dessus de Leaflet */
            #statusModal { z-index: 9999 !important; }
        </style>
    </head>
    <body class="bg-black text-white">
        <!-- Header -->
        <div class="bg-gray-900 border-b-2 border-purple-400 p-4">
            <div class="container mx-auto flex justify-between items-center">
                <div class="flex gap-3 items-center">
                    <a href="/pv/plant/${plantId}" class="text-purple-400 hover:text-purple-300 font-bold">
                        <i class="fas fa-arrow-left mr-2"></i>RETOUR
                    </a>
                    <span class="text-sm bg-green-600 px-3 py-1 rounded font-bold">✨ VERSION PRO</span>
                    <h1 id="zoneTitle" class="text-xl font-black">Chargement...</h1>
                </div>
                <div class="flex gap-3">
                    <button id="saveAllBtn" class="bg-green-600 hover:bg-green-700 px-6 py-2 rounded font-black">
                        <i class="fas fa-save mr-2"></i>ENREGISTRER TOUT
                    </button>
                    <button id="exportBtn" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-bold">
                        <i class="fas fa-file-pdf mr-2"></i>EXPORT PDF
                    </button>
                </div>
            </div>
        </div>

        <div class="container mx-auto px-4 py-6 grid grid-cols-4 gap-6">
            <!-- LEFT SIDEBAR: Configuration -->
            <div class="col-span-1 space-y-4">
                <!-- Étape 1 : Dessin -->
                <div class="bg-gray-900 rounded-lg border-2 border-yellow-400 p-4">
                    <h3 class="text-lg font-black mb-3 text-yellow-400">
                        <i class="fas fa-pencil-ruler mr-2"></i>ÉTAPE 1 : DESSIN
                    </h3>
                    <button id="drawRoofBtn" class="w-full bg-yellow-600 hover:bg-yellow-700 py-3 rounded font-bold mb-2">
                        <i class="fas fa-draw-polygon mr-2"></i>DESSINER TOITURE
                    </button>
                    <button id="clearRoofBtn" class="w-full bg-red-600 hover:bg-red-700 py-2 rounded font-bold text-sm">
                        <i class="fas fa-trash mr-1"></i>Effacer
                    </button>
                    <div id="roofInfo" class="mt-3 p-3 bg-black rounded text-sm hidden">
                        <div class="text-gray-400">Surface toiture:</div>
                        <div id="roofArea" class="text-2xl font-black text-yellow-400">-- m²</div>
                    </div>
                </div>

                <!-- Étape 2 : Configuration Électrique -->
                <div class="bg-gray-900 rounded-lg border-2 border-green-400 p-4">
                    <h3 class="text-lg font-black mb-3 text-green-400">
                        <i class="fas fa-bolt mr-2"></i>ÉTAPE 2 : CONFIG ÉLEC
                    </h3>
                    <div class="space-y-3">
                        <div>
                            <label class="block text-xs text-gray-400 mb-1">Onduleurs</label>
                            <input type="number" id="inverterCount" min="0" max="50" value="1"
                                   class="w-full bg-black border border-gray-600 rounded px-3 py-2 text-center font-bold">
                        </div>
                        <div>
                            <label class="block text-xs text-gray-400 mb-1">Boîtes Jonction (BJ)</label>
                            <input type="number" id="junctionBoxCount" min="0" max="100" value="0"
                                   class="w-full bg-black border border-gray-600 rounded px-3 py-2 text-center font-bold">
                        </div>
                        <div>
                            <label class="block text-xs text-gray-400 mb-1">Nombre de Strings</label>
                            <input type="number" id="stringCount" min="1" max="50" value="2"
                                   class="w-full bg-black border border-gray-600 rounded px-3 py-2 text-center font-bold">
                        </div>
                        <button id="configureStringsBtn" class="w-full bg-yellow-600 hover:bg-yellow-700 py-2 rounded font-bold text-sm">
                            <i class="fas fa-sliders-h mr-1"></i>Configurer Strings
                        </button>
                        <div id="stringsSummary" class="p-2 bg-black rounded text-xs text-gray-400 hidden">
                            <div class="font-bold text-yellow-400 mb-1">Config actuelle:</div>
                            <div id="stringsSummaryText">2 strings x 10 modules = 20 total</div>
                        </div>
                        <button id="saveConfigBtn" class="w-full bg-green-600 hover:bg-green-700 py-2 rounded font-bold">
                            <i class="fas fa-check mr-1"></i>Sauvegarder Config
                        </button>
                    </div>
                </div>

                <!-- Étape 3 : Placement Modules -->
                <div class="bg-gray-900 rounded-lg border-2 border-purple-400 p-4">
                    <h3 class="text-lg font-black mb-3 text-purple-400">
                        <i class="fas fa-solar-panel mr-2"></i>ÉTAPE 3 : MODULES
                    </h3>
                    <div class="space-y-2">
                        <button id="drawRowBtn" class="w-full bg-green-600 hover:bg-green-700 py-2 rounded font-bold text-sm">
                            <i class="fas fa-draw-polygon mr-1"></i>Dessiner Rangée
                        </button>
                        <button id="placeManualBtn" class="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded font-bold text-sm">
                            <i class="fas fa-mouse-pointer mr-1"></i>Placement Manuel
                        </button>
                        <button id="placeAutoBtn" class="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded font-bold text-sm">
                            <i class="fas fa-magic mr-1"></i>Auto (Config)
                        </button>
                        <div class="flex gap-2 items-center pt-2">
                            <button id="rotateBtn" class="flex-1 bg-orange-600 hover:bg-orange-700 py-2 rounded font-bold text-sm">
                                <i class="fas fa-redo"></i>
                            </button>
                            <span id="rotationLabel" class="flex-1 px-3 py-2 bg-black rounded text-center font-bold">0°</span>
                        </div>
                        <button id="clearModulesBtn" class="w-full bg-red-600 hover:bg-red-700 py-2 rounded font-bold text-sm mt-3">
                            <i class="fas fa-trash mr-1"></i>Effacer Modules
                        </button>
                    </div>
                </div>

                <!-- Stats Rapides -->
                <div class="bg-gray-900 rounded-lg border-2 border-blue-400 p-4">
                    <h3 class="text-sm font-black mb-2 text-blue-400">
                        <i class="fas fa-chart-bar mr-1"></i>STATS RAPIDES
                    </h3>
                    <div class="space-y-2 text-xs">
                        <div class="flex justify-between">
                            <span class="text-gray-400">Total:</span>
                            <span id="statsTotal" class="font-bold text-purple-400">0</span>
                        </div>
                        <div class="flex justify-between">
                            <span>🟢 OK:</span>
                            <span id="statsOk" class="font-bold text-green-400">0</span>
                        </div>
                        <div class="flex justify-between">
                            <span>🔴 HS:</span>
                            <span id="statsDead" class="font-bold text-red-400">0</span>
                        </div>
                        <div class="flex justify-between">
                            <span>⚪ Pending:</span>
                            <span id="statsPending" class="font-bold text-gray-400">0</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- CENTER: Carte Leaflet -->
            <div class="col-span-3">
                <div class="bg-gray-900 rounded-lg border-2 border-purple-400 p-4 mb-4">
                    <div id="map"></div>
                </div>

                <!-- Stats Détaillées -->
                <div class="grid grid-cols-8 gap-3">
                    <div class="bg-gray-900 rounded-lg p-3 text-center border border-purple-400">
                        <div class="text-xl font-black text-purple-400" id="statsTotal2">0</div>
                        <div class="text-xs text-gray-400">Total</div>
                    </div>
                    <div class="bg-gray-900 rounded-lg p-3 text-center border border-green-400">
                        <div class="text-xl font-black text-green-400" id="statsOk2">0</div>
                        <div class="text-xs">🟢 OK</div>
                    </div>
                    <div class="bg-gray-900 rounded-lg p-3 text-center border border-yellow-400">
                        <div class="text-xl font-black text-yellow-400" id="statsInequality">0</div>
                        <div class="text-xs">🟡 Inégal.</div>
                    </div>
                    <div class="bg-gray-900 rounded-lg p-3 text-center border border-orange-400">
                        <div class="text-xl font-black text-orange-400" id="statsMicrocracks">0</div>
                        <div class="text-xs">🟠 Fissures</div>
                    </div>
                    <div class="bg-gray-900 rounded-lg p-3 text-center border border-red-400">
                        <div class="text-xl font-black text-red-400" id="statsDead2">0</div>
                        <div class="text-xs">🔴 HS</div>
                    </div>
                    <div class="bg-gray-900 rounded-lg p-3 text-center border border-blue-400">
                        <div class="text-xl font-black text-blue-400" id="statsStringOpen">0</div>
                        <div class="text-xs">🔵 String</div>
                    </div>
                    <div class="bg-gray-900 rounded-lg p-3 text-center border border-gray-500">
                        <div class="text-xl font-black text-gray-400" id="statsNotConnected">0</div>
                        <div class="text-xs">⚫ NC</div>
                    </div>
                    <div class="bg-gray-900 rounded-lg p-3 text-center border border-gray-400">
                        <div class="text-xl font-black text-gray-400" id="statsPending2">0</div>
                        <div class="text-xs">⚪ Pend.</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal Annotation Statut -->
        <div id="statusModal" class="hidden fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
            <div class="bg-gray-900 border-2 border-yellow-400 rounded-lg p-6 max-w-md w-full">
                <h3 id="modalTitle" class="text-xl font-black mb-4 text-center">MODULE M000</h3>
                
                <div class="grid grid-cols-2 gap-3 mb-4">
                    <button class="status-btn bg-green-600 hover:bg-green-700 p-3 rounded font-bold" data-status="ok">
                        🟢 OK<br><span class="text-sm font-normal">Aucun défaut</span>
                    </button>
                    <button class="status-btn bg-yellow-600 hover:bg-yellow-700 p-3 rounded font-bold" data-status="inequality">
                        🟡 Inégalité<br><span class="text-sm font-normal">Qualité cellules</span>
                    </button>
                    <button class="status-btn bg-orange-600 hover:bg-orange-700 p-3 rounded font-bold" data-status="microcracks">
                        🟠 Microfissures<br><span class="text-sm font-normal">Visibles EL</span>
                    </button>
                    <button class="status-btn bg-red-600 hover:bg-red-700 p-3 rounded font-bold" data-status="dead">
                        🔴 HS<br><span class="text-sm font-normal">Défaillant</span>
                    </button>
                    <button class="status-btn bg-blue-600 hover:bg-blue-700 p-3 rounded font-bold" data-status="string_open">
                        🔵 String ouvert<br><span class="text-sm font-normal">Sous-string</span>
                    </button>
                    <button class="status-btn bg-gray-600 hover:bg-gray-700 p-3 rounded font-bold" data-status="not_connected">
                        ⚫ Non raccordé<br><span class="text-sm font-normal">NC</span>
                    </button>
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-bold mb-2">Commentaire :</label>
                    <input type="text" id="statusComment" 
                           class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2"
                           placeholder="Détails défaut...">
                </div>
                
                <div class="flex gap-3">
                    <button id="saveStatusBtn" class="flex-1 bg-green-600 hover:bg-green-700 py-3 rounded font-black">
                        ENREGISTRER
                    </button>
                    <button id="cancelStatusBtn" class="flex-1 bg-gray-600 hover:bg-gray-700 py-3 rounded font-black">
                        ANNULER
                    </button>
                </div>
            </div>
        </div>

        <!-- Modal Configuration Strings -->
        <div id="stringsModal" class="hidden fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
            <div class="bg-gray-900 border-2 border-yellow-400 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <h3 class="text-xl font-black mb-4 text-center text-yellow-400">
                    <i class="fas fa-sliders-h mr-2"></i>CONFIGURATION STRINGS NON RÉGULIERS
                </h3>
                
                <div class="mb-4 p-3 bg-black rounded text-sm text-gray-400">
                    <i class="fas fa-info-circle mr-2 text-yellow-400"></i>
                    Configurez le nombre de modules pour chaque string individuellement (ex: String 1 = 26 modules, String 2 = 24 modules)
                </div>
                
                <div id="stringsConfigContainer" class="space-y-3 mb-4">
                    <!-- Généré dynamiquement par JS -->
                </div>
                
                <div class="p-3 bg-green-900/30 border border-green-400 rounded mb-4">
                    <div class="text-sm font-bold text-green-400">TOTAL MODULES</div>
                    <div id="totalModulesDisplay" class="text-3xl font-black text-green-400">0</div>
                </div>
                
                <div class="flex gap-3">
                    <button id="applyStringsConfigBtn" class="flex-1 bg-yellow-600 hover:bg-yellow-700 py-3 rounded font-black">
                        <i class="fas fa-check mr-2"></i>APPLIQUER
                    </button>
                    <button id="cancelStringsConfigBtn" class="flex-1 bg-gray-600 hover:bg-gray-700 py-3 rounded font-black">
                        ANNULER
                    </button>
                </div>
            </div>
        </div>

        <script>
        // ================================================================
        // VARIABLES GLOBALES
        // ================================================================
        const plantId = '${plantId}'
        const zoneId = '${zoneId}'
        
        let map = null
        let drawnItems = new L.FeatureGroup()
        let roofPolygon = null
        let roofArea = 0
        let modules = []
        let plantData = null
        let zoneData = null
        let currentRotation = 0
        let selectedModule = null
        let placementMode = 'manual'
        let drawControl = null
        let nextModuleNum = 1
        let stringsConfig = [] // Configuration strings non réguliers: [{stringNum: 1, modulesCount: 26}, ...]
        
        // Variables pour dessin rangée drag & drop
        let isDrawingRow = false
        let rowStartLatLng = null
        let rowPreviewRect = null
        
        const STATUS_COLORS = {
            ok: '#22c55e',
            inequality: '#eab308',
            microcracks: '#f97316',
            dead: '#ef4444',
            string_open: '#3b82f6',
            not_connected: '#6b7280',
            pending: '#e5e7eb'
        }
        
        // ================================================================
        // INIT
        // ================================================================
        async function init() {
            await loadPlantData()
            await loadZoneData()
            initMap()
            await loadModules()
            setupEventListeners()
            updateStats()
        }
        
        async function loadPlantData() {
            try {
                const response = await fetch(\`/api/pv/plants/\${plantId}\`)
                const data = await response.json()
                plantData = data.plant
            } catch (error) {
                console.error('Erreur chargement centrale:', error)
                plantData = { latitude: 48.8566, longitude: 2.3522, plant_name: 'Centrale' }
            }
        }
        
        async function loadZoneData() {
            try {
                const response = await fetch(\`/api/pv/plants/\${plantId}/zones/\${zoneId}\`)
                const data = await response.json()
                zoneData = data.zone
                document.getElementById('zoneTitle').textContent = zoneData.zone_name
                
                // Charger config électrique
                if (zoneData.inverter_count) document.getElementById('inverterCount').value = zoneData.inverter_count
                if (zoneData.junction_box_count) document.getElementById('junctionBoxCount').value = zoneData.junction_box_count
                if (zoneData.string_count) document.getElementById('stringCount').value = zoneData.string_count
                if (zoneData.modules_per_string) document.getElementById('modulesPerString').value = zoneData.modules_per_string
            } catch (error) {
                console.error('Erreur chargement zone:', error)
                zoneData = { zone_name: 'Zone', azimuth: 180, tilt: 30 }
            }
        }
        
        function initMap() {
            const lat = plantData.latitude || 48.8566
            const lng = plantData.longitude || 2.3522
            
            map = L.map('map', {
                center: [lat, lng],
                zoom: 20,
                maxZoom: 22
            })
            
            // Google Satellite (sans clé API, limitations possibles)
            L.tileLayer('https://{s}.google.com/vrt/lyrs=s&x={x}&y={y}&z={z}', {
                maxZoom: 22,
                subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
            }).addTo(map)
            
            map.addLayer(drawnItems)
            L.control.scale({ metric: true, imperial: false }).addTo(map)
            
            // Charger contour toiture existant
            if (zoneData.roof_polygon) {
                try {
                    const coords = JSON.parse(zoneData.roof_polygon)
                    roofPolygon = L.polygon(coords, {
                        color: '#fbbf24',
                        weight: 3,
                        fillOpacity: 0.1,
                        className: 'roof-polygon'
                    }).addTo(drawnItems)
                    
                    const geoJSON = roofPolygon.toGeoJSON()
                    roofArea = turf.area(geoJSON)
                    document.getElementById('roofArea').textContent = roofArea.toFixed(2) + ' m²'
                    document.getElementById('roofInfo').classList.remove('hidden')
                } catch (e) {
                    console.error('Erreur chargement polygone:', e)
                }
            }
        }
        
        async function loadModules() {
            try {
                const response = await fetch(\`/api/pv/plants/\${plantId}/zones/\${zoneId}/modules\`)
                const data = await response.json()
                modules = data.modules || []
                
                if (modules.length > 0) {
                    nextModuleNum = Math.max(...modules.map(m => {
                        const match = m.module_identifier.match(/\\d+/)
                        return match ? parseInt(match[0]) : 0
                    })) + 1
                }
                
                renderModules()
            } catch (error) {
                console.error('Erreur chargement modules:', error)
            }
        }
        
        // ================================================================
        // DESSIN TOITURE
        // ================================================================
        function enableRoofDrawing() {
            if (drawControl) map.removeControl(drawControl)
            
            drawControl = new L.Control.Draw({
                draw: {
                    polygon: {
                        showArea: true,
                        metric: true,
                        shapeOptions: { color: '#fbbf24', weight: 3 }
                    },
                    polyline: false,
                    rectangle: false,
                    circle: false,
                    marker: false,
                    circlemarker: false
                },
                edit: { featureGroup: drawnItems, remove: true }
            })
            
            map.addControl(drawControl)
            
            map.on(L.Draw.Event.CREATED, async (e) => {
                if (roofPolygon) drawnItems.removeLayer(roofPolygon)
                
                roofPolygon = e.layer
                drawnItems.addLayer(roofPolygon)
                
                // S'assurer que le polygone est fermé pour Turf.js
                const geoJSON = roofPolygon.toGeoJSON()
                const coords = geoJSON.geometry.coordinates[0]
                const firstPoint = coords[0]
                const lastPoint = coords[coords.length - 1]
                
                // Fermer le polygone si nécessaire
                if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
                    coords.push([...firstPoint])
                }
                
                try {
                    roofArea = turf.area(geoJSON)
                } catch (error) {
                    console.warn('Erreur calcul surface Turf.js:', error)
                    roofArea = 0
                }
                
                document.getElementById('roofArea').textContent = roofArea.toFixed(2) + ' m²'
                document.getElementById('roofInfo').classList.remove('hidden')
                
                await saveRoofPolygon()
            })
        }
        
        async function saveRoofPolygon() {
            if (!roofPolygon) return
            
            const coords = roofPolygon.getLatLngs()[0].map(ll => [ll.lat, ll.lng])
            
            try {
                await fetch(\`/api/pv/plants/\${plantId}/zones/\${zoneId}/roof\`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        roof_polygon: JSON.stringify(coords),
                        roof_area_sqm: roofArea
                    })
                })
                alert('OK: Contour toiture sauvegarde!')
            } catch (error) {
                alert('ERREUR: Sauvegarde - ' + error.message)
            }
        }
        
        function clearRoof() {
            if (confirm('Effacer le contour de toiture ?')) {
                if (roofPolygon) drawnItems.removeLayer(roofPolygon)
                roofPolygon = null
                roofArea = 0
                document.getElementById('roofInfo').classList.add('hidden')
            }
        }
        
        // ================================================================
        // CONFIG ÉLECTRIQUE
        // ================================================================
        function openStringsConfigModal() {
            const stringCount = parseInt(document.getElementById('stringCount').value)
            
            // Initialiser config si vide ou si nombre strings changé
            if (stringsConfig.length !== stringCount) {
                stringsConfig = []
                for (let i = 0; i < stringCount; i++) {
                    stringsConfig.push({
                        stringNum: i + 1,
                        modulesCount: 10 // Valeur par défaut
                    })
                }
            }
            
            // Générer inputs
            const container = document.getElementById('stringsConfigContainer')
            container.innerHTML = ''
            
            stringsConfig.forEach((config, index) => {
                const div = document.createElement('div')
                div.className = 'flex items-center gap-3 p-3 bg-gray-800 rounded border border-gray-600'
                div.innerHTML = \`
                    <div class="flex-1">
                        <label class="block text-sm font-bold text-yellow-400 mb-1">String \${config.stringNum}</label>
                        <input type="number" 
                               class="string-modules-input w-full bg-gray-700 border border-gray-500 rounded px-3 py-2 text-center font-bold text-white" 
                               data-index="\${index}"
                               min="1" 
                               max="50" 
                               value="\${config.modulesCount}">
                    </div>
                    <div class="text-2xl font-black text-gray-400">\${config.modulesCount}</div>
                \`
                container.appendChild(div)
            })
            
            // Event listeners pour update en temps réel
            document.querySelectorAll('.string-modules-input').forEach(input => {
                input.addEventListener('input', (e) => {
                    const index = parseInt(e.target.dataset.index)
                    const value = parseInt(e.target.value) || 0
                    stringsConfig[index].modulesCount = value
                    
                    // Update display à côté
                    e.target.parentElement.nextElementSibling.textContent = value
                    
                    // Update total
                    updateTotalModulesDisplay()
                })
            })
            
            updateTotalModulesDisplay()
            document.getElementById('stringsModal').classList.remove('hidden')
        }
        
        function updateTotalModulesDisplay() {
            const total = stringsConfig.reduce((sum, config) => sum + config.modulesCount, 0)
            document.getElementById('totalModulesDisplay').textContent = total
        }
        
        function applyStringsConfig() {
            // Update summary display
            const total = stringsConfig.reduce((sum, config) => sum + config.modulesCount, 0)
            const summaryText = stringsConfig.map(c => \`S\${c.stringNum}=\${c.modulesCount}\`).join(', ') + \` (Total: \${total})\`
            document.getElementById('stringsSummaryText').textContent = summaryText
            document.getElementById('stringsSummary').classList.remove('hidden')
            
            closeStringsModal()
            alert(\`OK: Configuration appliquee - \${total} modules repartis sur \${stringsConfig.length} strings\`)
        }
        
        function closeStringsModal() {
            document.getElementById('stringsModal').classList.add('hidden')
        }
        
        async function saveElectricalConfig() {
            // Validation des champs
            const inverterEl = document.getElementById('inverterCount')
            const junctionBoxEl = document.getElementById('junctionBoxCount')
            const stringEl = document.getElementById('stringCount')
            const modulesPerStringEl = document.getElementById('modulesPerString')
            
            if (!inverterEl || !junctionBoxEl || !stringEl || !modulesPerStringEl) {
                alert('ERREUR: Champs de configuration manquants')
                return
            }
            
            const config = {
                inverter_count: parseInt(inverterEl.value) || 0,
                junction_box_count: parseInt(junctionBoxEl.value) || 0,
                string_count: parseInt(stringEl.value) || 0,
                modules_per_string: parseInt(modulesPerStringEl.value) || 0
            }
            
            try {
                await fetch(\`/api/pv/plants/\${plantId}/zones/\${zoneId}/config\`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(config)
                })
                alert('OK: Configuration electrique sauvegardee!')
            } catch (error) {
                alert('ERREUR: ' + error.message)
            }
        }
        
        // ================================================================
        // PLACEMENT MODULES
        // ================================================================
        function placeModulesAuto() {
            if (!roofPolygon) {
                alert("ATTENTION: Dessinez d'abord le contour de toiture!")
                return
            }
            
            // Utiliser config strings si définie, sinon config uniforme
            const stringCount = parseInt(document.getElementById('stringCount').value)
            let totalModules = 0
            let useCustomConfig = stringsConfig.length === stringCount && stringsConfig.length > 0
            
            if (!useCustomConfig) {
                alert("ATTENTION: Configurez d'abord les strings avec le bouton 'Configurer Strings'!")
                return
            }
            
            totalModules = stringsConfig.reduce((sum, config) => sum + config.modulesCount, 0)
            
            const moduleWidth = 1.7
            const moduleHeight = 1.0
            const spacing = 0.02
            
            const bounds = roofPolygon.getBounds()
            const center = bounds.getCenter()
            
            modules = []
            let moduleNum = 1
            let currentRow = 0
            
            // Placer modules string par string (config non régulière)
            stringsConfig.forEach((stringConfig, stringIndex) => {
                const cols = stringConfig.modulesCount
                
                for (let col = 0; col < cols; col++) {
                    const latOffset = (currentRow * (moduleHeight + spacing)) / 111320
                    const lngOffset = (col * (moduleWidth + spacing)) / (111320 * Math.cos(center.lat * Math.PI / 180))
                    
                    const moduleLat = center.lat + latOffset - (stringCount * moduleHeight / 2 / 111320)
                    const moduleLng = center.lng + lngOffset - (cols * moduleWidth / 2 / (111320 * Math.cos(center.lat * Math.PI / 180)))
                    
                    const point = turf.point([moduleLng, moduleLat])
                    const poly = roofPolygon.toGeoJSON()
                    
                    if (turf.booleanPointInPolygon(point, poly)) {
                        modules.push({
                            id: null,
                            zone_id: parseInt(zoneId),
                            module_identifier: \`M\${moduleNum}\`,
                            latitude: moduleLat,
                            longitude: moduleLng,
                            pos_x_meters: col * (moduleWidth + spacing),
                            pos_y_meters: currentRow * (moduleHeight + spacing),
                            width_meters: moduleWidth,
                            height_meters: moduleHeight,
                            rotation: currentRotation,
                            string_number: stringConfig.stringNum,
                            position_in_string: col + 1,
                            power_wp: 450,
                            module_status: 'pending',
                            status_comment: null
                        })
                        moduleNum++
                    }
                }
                
                currentRow++ // Passer à la ligne suivante pour le prochain string
            })
            
            nextModuleNum = moduleNum
            renderModules()
            updateStats()
            alert(\`OK: \${modules.length} modules places!\n\${stringsConfig.map(c => \`String \${c.stringNum}: \${c.modulesCount} modules\`).join('\\n')}\`)
        }
        
        function placeModuleManual() {
            placementMode = 'manual'
            alert('Cliquez sur la carte pour placer des modules individuellement')
            
            map.once('click', (e) => {
                if (placementMode !== 'manual') return
                
                // Déterminer string et position en fonction de stringsConfig
                let stringNum = 1
                let posInString = 1
                
                if (stringsConfig.length > 0) {
                    let accumulatedModules = 0
                    for (let i = 0; i < stringsConfig.length; i++) {
                        const config = stringsConfig[i]
                        if (nextModuleNum <= accumulatedModules + config.modulesCount) {
                            stringNum = config.stringNum
                            posInString = nextModuleNum - accumulatedModules
                            break
                        }
                        accumulatedModules += config.modulesCount
                    }
                } else {
                    // Fallback si pas de config strings
                    const modulesPerString = 10 // Valeur par défaut
                    stringNum = Math.floor((nextModuleNum - 1) / modulesPerString) + 1
                    posInString = ((nextModuleNum - 1) % modulesPerString) + 1
                }
                
                modules.push({
                    id: null,
                    zone_id: parseInt(zoneId),
                    module_identifier: \`M\${nextModuleNum}\`,
                    latitude: e.latlng.lat,
                    longitude: e.latlng.lng,
                    pos_x_meters: 0,
                    pos_y_meters: 0,
                    width_meters: 1.7,
                    height_meters: 1.0,
                    rotation: currentRotation,
                    string_number: stringNum,
                    position_in_string: posInString,
                    power_wp: 450,
                    module_status: 'pending',
                    status_comment: null
                })
                
                nextModuleNum++
                renderModules()
                updateStats()
                
                // Continuer placement
                placeModuleManual()
            })
        }
        
        function drawRowMode() {
            if (!roofPolygon) {
                alert("ATTENTION: Dessinez d'abord le contour de toiture!")
                return
            }
            
            if (stringsConfig.length === 0) {
                alert("ATTENTION: Configurez d'abord les strings!")
                return
            }
            
            placementMode = 'drawRow'
            isDrawingRow = false
            rowStartLatLng = null
            
            alert('MODE DESSIN RANGEE\\n\\n1. Cliquez sur point de depart\\n2. Glissez la souris\\n3. Relachez pour creer rangee\\n\\nAppuyez sur ESC pour annuler')
            
            // Désactiver événements Leaflet par défaut
            map.dragging.disable()
            map.doubleClickZoom.disable()
            
            // Event listeners
            map.on('mousedown', onRowMouseDown)
            map.on('mousemove', onRowMouseMove)
            map.on('mouseup', onRowMouseUp)
            
            // ESC pour annuler
            document.addEventListener('keydown', onEscapeKey)
        }
        
        function onRowMouseDown(e) {
            if (placementMode !== 'drawRow') return
            
            isDrawingRow = true
            rowStartLatLng = e.latlng
            
            // Créer rectangle preview
            rowPreviewRect = L.rectangle([
                [e.latlng.lat, e.latlng.lng],
                [e.latlng.lat, e.latlng.lng]
            ], {
                color: '#22c55e',
                weight: 3,
                fillColor: '#22c55e',
                fillOpacity: 0.2,
                dashArray: '10, 10'
            }).addTo(map)
        }
        
        function onRowMouseMove(e) {
            if (!isDrawingRow || !rowPreviewRect) return
            
            // Mettre à jour rectangle preview
            rowPreviewRect.setBounds([
                [rowStartLatLng.lat, rowStartLatLng.lng],
                [e.latlng.lat, e.latlng.lng]
            ])
        }
        
        function onRowMouseUp(e) {
            if (!isDrawingRow) return
            
            isDrawingRow = false
            
            // Calculer dimensions rectangle en mètres
            const bounds = rowPreviewRect.getBounds()
            const latDiff = Math.abs(bounds.getNorth() - bounds.getSouth())
            const lngDiff = Math.abs(bounds.getEast() - bounds.getWest())
            
            const heightMeters = latDiff * 111320 // 1 degré latitude ≈ 111.32 km
            const centerLat = (bounds.getNorth() + bounds.getSouth()) / 2
            const widthMeters = lngDiff * 111320 * Math.cos(centerLat * Math.PI / 180)
            
            // Dimensions module + espacement
            const moduleWidth = 1.7 + 0.02  // 1.7m + 2cm espacement
            const moduleHeight = 1.0 + 0.02 // 1.0m + 2cm espacement
            
            // Calculer nombre de modules (colonnes x lignes)
            const cols = Math.floor(widthMeters / moduleWidth)
            const rows = Math.floor(heightMeters / moduleHeight)
            const totalModules = cols * rows
            
            if (totalModules === 0) {
                alert('ATTENTION: Rectangle trop petit! Dessinez une zone plus grande.')
                cancelDrawRowMode()
                return
            }
            
            // Confirmation
            const confirmed = confirm(\`CREATION RANGEE\n\nDimensions: \${widthMeters.toFixed(1)}m x \${heightMeters.toFixed(1)}m\nModules: \${cols} colonnes x \${rows} lignes = \${totalModules} modules\n\nCreer cette rangee?\`)
            
            if (!confirmed) {
                cancelDrawRowMode()
                return
            }
            
            // Générer modules dans le rectangle
            const generatedModules = []
            let moduleNum = nextModuleNum
            
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    // Calculer position GPS
                    const latOffset = (row * moduleHeight) / 111320
                    const lngOffset = (col * moduleWidth) / (111320 * Math.cos(centerLat * Math.PI / 180))
                    
                    const moduleLat = bounds.getSouth() + latOffset
                    const moduleLng = bounds.getWest() + lngOffset
                    
                    // Vérifier si dans contour toiture
                    const point = turf.point([moduleLng, moduleLat])
                    const polygon = turf.polygon([roofPolygon.getLatLngs()[0].map(ll => [ll.lng, ll.lat])])
                    
                    if (turf.booleanPointInPolygon(point, polygon)) {
                        // Déterminer string et position selon stringsConfig
                        let stringNum = 1
                        let posInString = 1
                        
                        if (stringsConfig.length > 0) {
                            let accumulatedModules = 0
                            for (let i = 0; i < stringsConfig.length; i++) {
                                const config = stringsConfig[i]
                                if (moduleNum <= accumulatedModules + config.modulesCount) {
                                    stringNum = config.stringNum
                                    posInString = moduleNum - accumulatedModules
                                    break
                                }
                                accumulatedModules += config.modulesCount
                            }
                        }
                        
                        generatedModules.push({
                            id: null,
                            zone_id: parseInt(zoneId),
                            module_identifier: \`M\${moduleNum}\`,
                            latitude: moduleLat,
                            longitude: moduleLng,
                            pos_x_meters: 0,
                            pos_y_meters: 0,
                            width_meters: 1.7,
                            height_meters: 1.0,
                            rotation: currentRotation,
                            string_number: stringNum,
                            position_in_string: posInString,
                            power_wp: 450,
                            module_status: 'pending',
                            status_comment: null
                        })
                        
                        moduleNum++
                    }
                }
            }
            
            // Ajouter modules générés
            modules.push(...generatedModules)
            nextModuleNum = moduleNum
            
            // Nettoyer mode dessin
            cancelDrawRowMode()
            
            // Render
            renderModules()
            updateStats()
            
            alert(\`OK: \${generatedModules.length} modules crees!\n\nRectangle: \${widthMeters.toFixed(1)}m x \${heightMeters.toFixed(1)}m\nGrille: \${cols} x \${rows}\`)
        }
        
        function onEscapeKey(e) {
            if (e.key === 'Escape' && placementMode === 'drawRow') {
                cancelDrawRowMode()
                alert('Mode dessin rangee annule')
            }
        }
        
        function cancelDrawRowMode() {
            // Nettoyer preview rectangle
            if (rowPreviewRect) {
                map.removeLayer(rowPreviewRect)
                rowPreviewRect = null
            }
            
            // Réactiver Leaflet
            map.dragging.enable()
            map.doubleClickZoom.enable()
            
            // Retirer event listeners
            map.off('mousedown', onRowMouseDown)
            map.off('mousemove', onRowMouseMove)
            map.off('mouseup', onRowMouseUp)
            document.removeEventListener('keydown', onEscapeKey)
            
            // Reset variables
            isDrawingRow = false
            rowStartLatLng = null
            placementMode = 'manual'
        }
        
        function clearModules() {
            if (confirm('Effacer tous les modules ?')) {
                modules = []
                nextModuleNum = 1
                renderModules()
                updateStats()
            }
        }
        
        // ================================================================
        // RENDU MODULES
        // ================================================================
        function renderModules() {
            drawnItems.eachLayer(layer => {
                if (layer.options.className && layer.options.className.startsWith('module-')) {
                    drawnItems.removeLayer(layer)
                }
            })
            
            modules.forEach(module => {
                const color = STATUS_COLORS[module.module_status] || STATUS_COLORS.pending
                
                const latOffset = module.height_meters / 111320 / 2
                const lngOffset = module.width_meters / (111320 * Math.cos(module.latitude * Math.PI / 180)) / 2
                
                const bounds = [
                    [module.latitude - latOffset, module.longitude - lngOffset],
                    [module.latitude + latOffset, module.longitude + lngOffset]
                ]
                
                const rect = L.rectangle(bounds, {
                    color: color,
                    weight: 2,
                    fillColor: color,
                    fillOpacity: 0.7,
                    className: \`module-\${module.module_status}\`
                })
                
                rect.bindPopup(\`
                    <strong>\${module.module_identifier}</strong><br>
                    String \${module.string_number} | Pos \${module.position_in_string}<br>
                    Statut: \${module.module_status}
                \`)
                
                rect.on('click', () => openStatusModal(module))
                rect.addTo(drawnItems)
            })
        }
        
        // ================================================================
        // MODAL ANNOTATION
        // ================================================================
        function openStatusModal(module) {
            selectedModule = module
            document.getElementById('modalTitle').textContent = module.module_identifier
            document.getElementById('statusComment').value = module.status_comment || ''
            document.getElementById('statusModal').classList.remove('hidden')
        }
        
        function closeModal() {
            document.getElementById('statusModal').classList.add('hidden')
            selectedModule = null
        }
        
        function selectStatus(status) {
            if (!selectedModule) return
            
            selectedModule.module_status = status
            selectedModule.status_comment = document.getElementById('statusComment').value || null
            
            closeModal()
            renderModules()
            updateStats()
        }
        
        // ================================================================
        // SAUVEGARDE
        // ================================================================
        async function saveAll() {
            try {
                // Sauvegarder modules
                await fetch(\`/api/pv/plants/\${plantId}/zones/\${zoneId}/modules\`, {
                    method: 'DELETE'
                })
                
                if (modules.length > 0) {
                    const response = await fetch(\`/api/pv/plants/\${plantId}/zones/\${zoneId}/modules\`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ modules })
                    })
                    
                    const data = await response.json()
                    
                    if (!data.success) {
                        throw new Error(data.error)
                    }
                }
                
                // Sauvegarder config
                await saveElectricalConfig()
                
                // Sauvegarder toiture
                if (roofPolygon) await saveRoofPolygon()
                
                alert(\`OK: Sauvegarde complete reussie!\n\${modules.length} modules | Surface: \${roofArea.toFixed(2)} m2\`)
                
                await loadModules()
            } catch (error) {
                alert('ERREUR: Sauvegarde - ' + error.message)
            }
        }
        
        // ================================================================
        // EXPORT PDF
        // ================================================================
        async function exportPDF() {
            const { jsPDF } = window.jspdf
            const doc = new jsPDF('landscape', 'mm', 'a3')
            
            // PAGE 1: Plan
            doc.setFontSize(18)
            doc.setFont('helvetica', 'bold')
            doc.text('PLAN CARTOGRAPHIQUE PHOTOVOLTAÏQUE', 15, 20)
            
            doc.setFontSize(11)
            doc.setFont('helvetica', 'normal')
            doc.text(\`Centrale: \${plantData.plant_name}\`, 15, 30)
            doc.text(\`Zone: \${zoneData.zone_name}\`, 15, 36)
            doc.text(\`Date: \${new Date().toLocaleDateString('fr-FR')}\`, 15, 42)
            
            // Capture carte
            await new Promise(r => setTimeout(r, 1000))
            const mapElement = document.getElementById('map')
            const canvas = await html2canvas(mapElement, { useCORS: true })
            const imgData = canvas.toDataURL('image/png')
            doc.addImage(imgData, 'PNG', 15, 50, 270, 140)
            
            // Specs
            doc.setFontSize(12)
            doc.setFont('helvetica', 'bold')
            doc.text('CARACTÉRISTIQUES TECHNIQUES', 15, 200)
            
            doc.setFontSize(10)
            doc.setFont('helvetica', 'normal')
            const stringCount = parseInt(document.getElementById('stringCount').value)
            const inverterCount = parseInt(document.getElementById('inverterCount').value)
            const junctionBoxCount = parseInt(document.getElementById('junctionBoxCount').value)
            
            doc.text(\`Modules: \${modules.length} | Puissance: \${(modules.length * 450 / 1000).toFixed(2)} kWc\`, 20, 210)
            doc.text(\`Onduleurs: \${inverterCount} | Boîtes Jonction: \${junctionBoxCount} | Strings: \${stringCount}\`, 20, 216)
            doc.text(\`Surface toiture: \${roofArea.toFixed(2)} m² | Azimut: \${zoneData.azimuth}° | Inclinaison: \${zoneData.tilt}°\`, 20, 222)
            
            // PAGE 2: Liste modules
            doc.addPage()
            doc.setFontSize(14)
            doc.setFont('helvetica', 'bold')
            doc.text('LISTE DÉTAILLÉE DES MODULES', 15, 20)
            
            doc.setFontSize(9)
            doc.setFont('helvetica', 'normal')
            let y = 30
            
            modules.forEach(m => {
                const emoji = {ok:'🟢',inequality:'🟡',microcracks:'🟠',dead:'🔴',string_open:'🔵',not_connected:'⚫',pending:'⚪'}[m.module_status]
                doc.text(\`\${m.module_identifier} | S\${m.string_number} P\${m.position_in_string} | \${emoji} \${m.module_status}\`, 15, y)
                
                if (m.status_comment) {
                    y += 4
                    doc.setFontSize(8)
                    doc.text(\`   → \${m.status_comment}\`, 15, y)
                    doc.setFontSize(9)
                }
                
                y += 5
                if (y > 280) {
                    doc.addPage()
                    y = 20
                }
            })
            
            doc.save(\`cartographie_\${zoneData.zone_name}_\${Date.now()}.pdf\`)
        }
        
        // ================================================================
        // STATS
        // ================================================================
        function updateStats() {
            const total = modules.length
            const ok = modules.filter(m => m.module_status === 'ok').length
            const inequality = modules.filter(m => m.module_status === 'inequality').length
            const microcracks = modules.filter(m => m.module_status === 'microcracks').length
            const dead = modules.filter(m => m.module_status === 'dead').length
            const stringOpen = modules.filter(m => m.module_status === 'string_open').length
            const notConnected = modules.filter(m => m.module_status === 'not_connected').length
            const pending = modules.filter(m => m.module_status === 'pending').length
            
            document.getElementById('statsTotal').textContent = total
            document.getElementById('statsTotal2').textContent = total
            document.getElementById('statsOk').textContent = ok
            document.getElementById('statsOk2').textContent = ok
            document.getElementById('statsInequality').textContent = inequality
            document.getElementById('statsMicrocracks').textContent = microcracks
            document.getElementById('statsDead').textContent = dead
            document.getElementById('statsDead2').textContent = dead
            document.getElementById('statsStringOpen').textContent = stringOpen
            document.getElementById('statsNotConnected').textContent = notConnected
            document.getElementById('statsPending').textContent = pending
            document.getElementById('statsPending2').textContent = pending
        }
        
        // ================================================================
        // EVENT LISTENERS
        // ================================================================
        function setupEventListeners() {
            document.getElementById('drawRoofBtn').addEventListener('click', enableRoofDrawing)
            document.getElementById('clearRoofBtn').addEventListener('click', clearRoof)
            document.getElementById('saveConfigBtn').addEventListener('click', saveElectricalConfig)
            
            // Strings Configuration (Non-Regular)
            document.getElementById('configureStringsBtn').addEventListener('click', openStringsConfigModal)
            document.getElementById('applyStringsConfigBtn').addEventListener('click', applyStringsConfig)
            document.getElementById('cancelStringsConfigBtn').addEventListener('click', closeStringsModal)
            
            // Module Placement
            document.getElementById('drawRowBtn').addEventListener('click', drawRowMode)
            document.getElementById('placeManualBtn').addEventListener('click', placeModuleManual)
            document.getElementById('placeAutoBtn').addEventListener('click', placeModulesAuto)
            document.getElementById('rotateBtn').addEventListener('click', () => {
                currentRotation = (currentRotation + 90) % 360
                document.getElementById('rotationLabel').textContent = currentRotation + '°'
            })
            document.getElementById('clearModulesBtn').addEventListener('click', clearModules)
            document.getElementById('saveAllBtn').addEventListener('click', saveAll)
            document.getElementById('exportBtn').addEventListener('click', exportPDF)
            
            document.querySelectorAll('.status-btn').forEach(btn => {
                btn.addEventListener('click', () => selectStatus(btn.dataset.status))
            })
            document.getElementById('cancelStatusBtn').addEventListener('click', closeModal)
        }
        
        // INIT
        init()
        </script>
    </body>
    </html>
  `)
})

// ============================================================================
// ROUTE PV CARTOGRAPHY - Détail Centrale (PHASE 2a)
// ============================================================================
app.get('/pv/plant/:id', async (c) => {
  const plantId = c.req.param('id')
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Centrale PV - Détail & Zones</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/diagpv-styles.css" rel="stylesheet">
    </head>
    <body class="bg-black text-white min-h-screen">
        <div class="container mx-auto px-4 py-8 max-w-7xl">
            <!-- Header Navigation -->
            <div class="mb-6 flex justify-between items-center">
                <div class="flex gap-3">
                    <a href="/pv/plants" class="text-purple-400 hover:text-purple-300 font-bold">
                        <i class="fas fa-arrow-left mr-2"></i>RETOUR CENTRALES
                    </a>
                    <a href="/dashboard" class="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded font-bold">
                        <i class="fas fa-chart-line mr-1"></i>AUDITS
                    </a>
                </div>
                <a href="/" class="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded font-bold">
                    <i class="fas fa-home mr-2"></i>ACCUEIL
                </a>
            </div>

            <!-- Loading -->
            <div id="loading" class="text-center py-12">
                <i class="fas fa-spinner fa-spin text-4xl text-purple-400 mb-4"></i>
                <p class="text-gray-400">Chargement centrale...</p>
            </div>

            <!-- Erreur -->
            <div id="error" class="hidden bg-red-900 border-2 border-red-400 rounded-lg p-6 text-center">
                <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
                <p id="errorMessage" class="text-xl"></p>
                <a href="/pv/plants" class="inline-block mt-4 bg-red-600 hover:bg-red-700 px-6 py-2 rounded font-bold">
                    RETOUR LISTE CENTRALES
                </a>
            </div>

            <!-- Contenu Principal -->
            <div id="content" class="hidden">
                <!-- Header Centrale -->
                <div class="bg-gray-900 rounded-lg border-2 border-purple-400 p-6 mb-8">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h1 id="plantName" class="text-3xl font-black text-purple-400 mb-2">...</h1>
                            <p id="plantType" class="text-gray-400">
                                <i class="fas fa-building mr-2"></i>Type: ...
                            </p>
                            <p id="plantAddress" class="text-gray-400 mt-1">
                                <i class="fas fa-map-marker-alt mr-2"></i>...
                            </p>
                        </div>
                        <button id="editPlantBtn" class="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded font-bold">
                            <i class="fas fa-edit mr-2"></i>MODIFIER
                        </button>
                    </div>

                    <!-- Stats Globales -->
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                        <div class="bg-gray-800 rounded-lg p-4 text-center">
                            <div class="text-3xl font-black text-blue-400" id="statsZones">0</div>
                            <div class="text-sm text-gray-400">Zones</div>
                        </div>
                        <div class="bg-gray-800 rounded-lg p-4 text-center">
                            <div class="text-3xl font-black text-green-400" id="statsModules">0</div>
                            <div class="text-sm text-gray-400">Modules</div>
                        </div>
                        <div class="bg-gray-800 rounded-lg p-4 text-center">
                            <div class="text-3xl font-black text-yellow-400" id="statsPower">0</div>
                            <div class="text-sm text-gray-400">kWc</div>
                        </div>
                        <div class="bg-gray-800 rounded-lg p-4 text-center">
                            <div class="text-3xl font-black text-purple-400" id="statsArea">0</div>
                            <div class="text-sm text-gray-400">m²</div>
                        </div>
                    </div>
                </div>

                <!-- Section Zones -->
                <div class="mb-8">
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-2xl font-black text-purple-400">
                            <i class="fas fa-layer-group mr-2"></i>ZONES
                        </h2>
                        <button id="addZoneBtn" class="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-black">
                            <i class="fas fa-plus mr-2"></i>AJOUTER ZONE
                        </button>
                    </div>

                    <!-- Liste Zones (vide) -->
                    <div id="emptyZones" class="hidden text-center py-12 bg-gray-900 rounded-lg border-2 border-gray-700">
                        <i class="fas fa-layer-group text-6xl text-gray-600 mb-4"></i>
                        <p class="text-gray-400 text-xl mb-6">Aucune zone créée</p>
                        <button onclick="showAddZoneModal()" class="bg-purple-600 hover:bg-purple-700 px-8 py-3 rounded font-black text-lg">
                            <i class="fas fa-plus mr-2"></i>CRÉER PREMIÈRE ZONE
                        </button>
                    </div>

                    <!-- Liste Zones (remplie) -->
                    <div id="zonesList" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div>
                </div>
            </div>
        </div>

        <!-- Modal Ajout/Édition Zone -->
        <div id="zoneModal" class="hidden fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
            <div class="bg-gray-900 border-2 border-purple-400 rounded-lg p-6 max-w-2xl w-full">
                <h3 class="text-2xl font-black mb-4 text-purple-400">
                    <i class="fas fa-layer-group mr-2"></i><span id="modalTitle">NOUVELLE ZONE</span>
                </h3>
                
                <form id="zoneForm" class="space-y-4">
                    <input type="hidden" id="zoneId">
                    
                    <div>
                        <label class="block text-sm font-bold mb-2">Nom de la zone *</label>
                        <input type="text" id="zoneName" required
                               class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2 focus:border-purple-400 focus:outline-none"
                               placeholder="Ex: Toiture Sud, Secteur A">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-bold mb-2">Type de zone *</label>
                        <select id="zoneType" required
                                class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2 focus:border-purple-400 focus:outline-none">
                            <option value="roof">Toiture</option>
                            <option value="ground">Sol</option>
                            <option value="carport">Ombrière</option>
                        </select>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-bold mb-2">Azimut (°) *</label>
                            <input type="number" id="zoneAzimuth" required min="0" max="360" value="180"
                                   class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2 focus:border-purple-400 focus:outline-none">
                            <p class="text-xs text-gray-500 mt-1">0°=Nord, 90°=Est, 180°=Sud, 270°=Ouest</p>
                        </div>
                        <div>
                            <label class="block text-sm font-bold mb-2">Inclinaison (°) *</label>
                            <input type="number" id="zoneTilt" required min="0" max="90" value="30"
                                   class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2 focus:border-purple-400 focus:outline-none">
                            <p class="text-xs text-gray-500 mt-1">0°=Plat, 90°=Vertical</p>
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-bold mb-2">Surface estimée (m²)</label>
                        <input type="number" id="zoneArea" min="0" step="0.1"
                               class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2 focus:border-purple-400 focus:outline-none"
                               placeholder="Ex: 150.5">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-bold mb-2">Notes</label>
                        <textarea id="zoneNotes" rows="3"
                                  class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2 focus:border-purple-400 focus:outline-none"
                                  placeholder="Remarques techniques..."></textarea>
                    </div>
                    
                    <div class="flex gap-3 pt-4">
                        <button type="submit" class="flex-1 bg-purple-600 hover:bg-purple-700 py-3 rounded font-black">
                            <i class="fas fa-save mr-2"></i>ENREGISTRER
                        </button>
                        <button type="button" id="cancelZoneBtn" class="flex-1 bg-gray-600 hover:bg-gray-700 py-3 rounded font-black">
                            ANNULER
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <script>
        const plantId = '${plantId}'
        let plantData = null
        let zones = []

        async function loadPlantDetail() {
            try {
                document.getElementById('loading').classList.remove('hidden')
                document.getElementById('error').classList.add('hidden')
                document.getElementById('content').classList.add('hidden')

                const response = await fetch(\`/api/pv/plants/\${plantId}\`)
                const data = await response.json()
                
                if (!response.ok || !data.success) {
                    throw new Error(data.error || 'Erreur chargement centrale')
                }
                
                plantData = data.plant
                zones = data.zones || []
                
                renderPlantHeader()
                renderZonesList()
                updateStats()
                
                document.getElementById('loading').classList.add('hidden')
                document.getElementById('content').classList.remove('hidden')
            } catch (error) {
                console.error('Erreur:', error)
                document.getElementById('loading').classList.add('hidden')
                document.getElementById('error').classList.remove('hidden')
                document.getElementById('errorMessage').textContent = error.message
            }
        }

        function renderPlantHeader() {
            const typeIcons = {
                rooftop: 'fa-building',
                ground: 'fa-mountain',
                carport: 'fa-car'
            }
            
            const typeLabels = {
                rooftop: 'Toiture',
                ground: 'Sol',
                carport: 'Ombrière'
            }
            
            document.getElementById('plantName').textContent = plantData.plant_name
            
            document.getElementById('plantType').innerHTML = \`
                <i class="fas \${typeIcons[plantData.plant_type] || 'fa-solar-panel'} mr-2"></i>
                Type: \${typeLabels[plantData.plant_type] || plantData.plant_type}
            \`
            
            const addressParts = []
            if (plantData.address) addressParts.push(plantData.address)
            if (plantData.city) addressParts.push(plantData.city)
            if (plantData.postal_code) addressParts.push(plantData.postal_code)
            
            if (addressParts.length > 0) {
                document.getElementById('plantAddress').innerHTML = \`
                    <i class="fas fa-map-marker-alt mr-2"></i>\${addressParts.join(', ')}
                \`
            } else {
                document.getElementById('plantAddress').innerHTML = \`
                    <i class="fas fa-map-marker-alt mr-2"></i>Adresse non renseignée
                \`
            }
        }

        function updateStats() {
            const totalModules = zones.reduce((sum, z) => sum + (parseInt(z.module_count) || 0), 0)
            const totalPower = zones.reduce((sum, z) => sum + (parseFloat(z.total_power_wp) || 0), 0)
            const totalArea = zones.reduce((sum, z) => sum + (parseFloat(z.area_sqm) || 0), 0)
            
            document.getElementById('statsZones').textContent = zones.length
            document.getElementById('statsModules').textContent = totalModules
            document.getElementById('statsPower').textContent = (totalPower / 1000).toFixed(1)
            document.getElementById('statsArea').textContent = totalArea.toFixed(0)
        }

        function renderZonesList() {
            const container = document.getElementById('zonesList')
            const emptyState = document.getElementById('emptyZones')
            
            if (zones.length === 0) {
                container.classList.add('hidden')
                emptyState.classList.remove('hidden')
                return
            }
            
            container.classList.remove('hidden')
            emptyState.classList.add('hidden')
            
            const typeIcons = {
                roof: 'fa-building',
                ground: 'fa-mountain',
                carport: 'fa-car'
            }
            
            const typeLabels = {
                roof: 'Toiture',
                ground: 'Sol',
                carport: 'Ombrière'
            }
            
            container.innerHTML = zones.map(zone => \`
                <div class="bg-gray-900 rounded-lg border-2 border-gray-700 hover:border-blue-400 transition-all p-6">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h3 class="text-xl font-black text-blue-400 mb-1">\${zone.zone_name}</h3>
                            <p class="text-sm text-gray-400">
                                <i class="fas \${typeIcons[zone.zone_type] || 'fa-layer-group'} mr-1"></i>
                                \${typeLabels[zone.zone_type] || zone.zone_type}
                            </p>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="editZone(\${zone.id})" class="text-orange-400 hover:text-orange-300" title="Modifier">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteZone(\${zone.id})" class="text-red-400 hover:text-red-300" title="Supprimer">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-3 mb-4">
                        <div>
                            <div class="text-sm text-gray-500">Azimut</div>
                            <div class="text-lg font-bold text-yellow-400">\${zone.azimuth}°</div>
                        </div>
                        <div>
                            <div class="text-sm text-gray-500">Inclinaison</div>
                            <div class="text-lg font-bold text-yellow-400">\${zone.tilt}°</div>
                        </div>
                        <div>
                            <div class="text-sm text-gray-500">Modules</div>
                            <div class="text-lg font-bold text-green-400">\${zone.module_count || 0}</div>
                        </div>
                        <div>
                            <div class="text-sm text-gray-500">Surface</div>
                            <div class="text-lg font-bold text-blue-400">\${zone.area_sqm ? zone.area_sqm.toFixed(0) + ' m²' : '-'}</div>
                        </div>
                    </div>
                    
                    <div class="pt-4 border-t border-gray-700 grid grid-cols-2 gap-2">
                        <a href="/pv/plant/\${plantId}/zone/\${zone.id}/editor" 
                           class="block bg-purple-600 hover:bg-purple-700 py-2 rounded font-bold text-center text-sm">
                            <i class="fas fa-pen-ruler mr-1"></i>V1
                        </a>
                        <a href="/pv/plant/\${plantId}/zone/\${zone.id}/editor/v2" 
                           class="block bg-green-600 hover:bg-green-700 py-2 rounded font-bold text-center text-sm">
                            ✨ V2 PRO
                        </a>
                    </div>
                </div>
            \`).join('')
        }

        function showAddZoneModal() {
            document.getElementById('modalTitle').textContent = 'NOUVELLE ZONE'
            document.getElementById('zoneForm').reset()
            document.getElementById('zoneId').value = ''
            document.getElementById('zoneAzimuth').value = '180'
            document.getElementById('zoneTilt').value = '30'
            document.getElementById('zoneModal').classList.remove('hidden')
        }

        async function editZone(zoneId) {
            const zone = zones.find(z => z.id === zoneId)
            if (!zone) return
            
            document.getElementById('modalTitle').textContent = 'MODIFIER ZONE'
            document.getElementById('zoneId').value = zone.id
            document.getElementById('zoneName').value = zone.zone_name
            document.getElementById('zoneType').value = zone.zone_type
            document.getElementById('zoneAzimuth').value = zone.azimuth
            document.getElementById('zoneTilt').value = zone.tilt
            document.getElementById('zoneArea').value = zone.area_sqm || ''
            document.getElementById('zoneNotes').value = zone.notes || ''
            document.getElementById('zoneModal').classList.remove('hidden')
        }

        async function deleteZone(zoneId) {
            if (!confirm('Supprimer cette zone ? Tous les modules associés seront supprimés.')) return
            
            try {
                const response = await fetch(\`/api/pv/plants/\${plantId}/zones/\${zoneId}\`, {
                    method: 'DELETE'
                })
                
                const data = await response.json()
                
                if (!response.ok || !data.success) {
                    throw new Error(data.error || 'Erreur suppression zone')
                }
                
                alert('Zone supprimée avec succès')
                loadPlantDetail()
            } catch (error) {
                console.error('Erreur:', error)
                alert('Erreur: ' + error.message)
            }
        }

        function hideZoneModal() {
            document.getElementById('zoneModal').classList.add('hidden')
            document.getElementById('zoneForm').reset()
        }

        async function saveZone(formData) {
            try {
                const zoneId = document.getElementById('zoneId').value
                const isEdit = !!zoneId
                
                const url = isEdit 
                    ? \`/api/pv/plants/\${plantId}/zones/\${zoneId}\`
                    : \`/api/pv/plants/\${plantId}/zones\`
                
                const method = isEdit ? 'PUT' : 'POST'
                
                const response = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                })
                
                const data = await response.json()
                
                if (!response.ok || !data.success) {
                    throw new Error(data.error || 'Erreur enregistrement zone')
                }
                
                alert(isEdit ? 'Zone modifiée avec succès' : 'Zone créée avec succès')
                hideZoneModal()
                loadPlantDetail()
            } catch (error) {
                console.error('Erreur:', error)
                alert('Erreur: ' + error.message)
            }
        }

        function viewZoneModules(zoneId) {
            alert('Placement modules disponible en Phase 2b (Canvas Editor)')
        }

        // Event Listeners
        document.getElementById('addZoneBtn').addEventListener('click', showAddZoneModal)
        document.getElementById('cancelZoneBtn').addEventListener('click', hideZoneModal)
        
        document.getElementById('zoneForm').addEventListener('submit', (e) => {
            e.preventDefault()
            
            const formData = {
                zone_name: document.getElementById('zoneName').value,
                zone_type: document.getElementById('zoneType').value,
                azimuth: parseInt(document.getElementById('zoneAzimuth').value),
                tilt: parseInt(document.getElementById('zoneTilt').value),
                area_sqm: parseFloat(document.getElementById('zoneArea').value) || null,
                notes: document.getElementById('zoneNotes').value || null
            }
            
            saveZone(formData)
        })

        // Init
        loadPlantDetail()
        </script>
    </body>
    </html>
  `)
})

export default app