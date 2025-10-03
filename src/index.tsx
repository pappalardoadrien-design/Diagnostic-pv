import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { PVservParser } from './pvserv-parser.js'

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
// API ROUTES - GESTION DES AUDITS
// ============================================================================

// Créer un nouvel audit
app.post('/api/audit/create', async (c) => {
  const { env } = c
  const { projectName, clientName, location, stringCount, modulesPerString } = await c.req.json()
  
  // Génération token unique sécurisé
  const auditToken = crypto.randomUUID()
  const totalModules = stringCount * modulesPerString
  
  // Création structure audit en base D1
  const audit = await env.DB.prepare(`
    INSERT INTO audits (
      token, project_name, client_name, location, 
      string_count, modules_per_string, total_modules,
      created_at, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), 'created')
  `).bind(
    auditToken, projectName, clientName, location,
    stringCount, modulesPerString, totalModules
  ).run()
  
  // Génération grille modules
  for (let s = 1; s <= stringCount; s++) {
    for (let m = 1; m <= modulesPerString; m++) {
      const moduleNumber = ((s - 1) * modulesPerString) + m
      const moduleId = `M${moduleNumber.toString().padStart(3, '0')}`
      
      await env.DB.prepare(`
        INSERT INTO modules (
          audit_token, module_id, string_number, position_in_string,
          status, created_at
        ) VALUES (?, ?, ?, ?, 'pending', datetime('now'))
      `).bind(auditToken, moduleId, s, m).run()
    }
  }
  
  return c.json({
    success: true,
    auditToken,
    auditUrl: `/audit/${auditToken}`,
    totalModules,
    message: 'Audit créé avec succès'
  })
})

// Récupérer les informations d'un audit
app.get('/api/audit/:token', async (c) => {
  const { env } = c
  const token = c.req.param('token')
  
  const audit = await env.DB.prepare(
    'SELECT * FROM audits WHERE token = ?'
  ).bind(token).first()
  
  if (!audit) {
    return c.json({ error: 'Audit non trouvé' }, 404)
  }
  
  const modules = await env.DB.prepare(
    'SELECT * FROM modules WHERE audit_token = ? ORDER BY string_number, position_in_string'
  ).bind(token).all()
  
  const progress = await env.DB.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status != 'pending' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status = 'ok' THEN 1 ELSE 0 END) as ok,
      SUM(CASE WHEN status = 'inequality' THEN 1 ELSE 0 END) as inequality,
      SUM(CASE WHEN status = 'microcracks' THEN 1 ELSE 0 END) as microcracks,
      SUM(CASE WHEN status = 'dead' THEN 1 ELSE 0 END) as dead,
      SUM(CASE WHEN status = 'string_open' THEN 1 ELSE 0 END) as string_open,
      SUM(CASE WHEN status = 'not_connected' THEN 1 ELSE 0 END) as not_connected
    FROM modules WHERE audit_token = ?
  `).bind(token).first()
  
  return c.json({
    audit,
    modules: modules.results,
    progress
  })
})

// Mettre à jour le statut d'un module
app.post('/api/audit/:token/module/:moduleId', async (c) => {
  const { env } = c
  const token = c.req.param('token')
  const moduleId = c.req.param('moduleId')
  const { status, comment, technicianId } = await c.req.json()
  
  // Validation des statuts autorisés
  const validStatuses = ['ok', 'inequality', 'microcracks', 'dead', 'string_open', 'not_connected']
  if (!validStatuses.includes(status)) {
    return c.json({ error: 'Statut invalide' }, 400)
  }
  
  await env.DB.prepare(`
    UPDATE modules 
    SET status = ?, comment = ?, technician_id = ?, updated_at = datetime('now')
    WHERE audit_token = ? AND module_id = ?
  `).bind(status, comment || null, technicianId || null, token, moduleId).run()
  
  // Mise à jour session collaborative temps réel via KV
  const sessionKey = `audit_session:${token}`
  const sessionData = {
    lastUpdate: Date.now(),
    moduleId,
    status,
    technicianId
  }
  
  await env.KV.put(sessionKey, JSON.stringify(sessionData), {
    expirationTtl: 3600 // 1 heure
  })
  
  return c.json({ success: true })
})

// Endpoint WebSocket simulation pour temps réel (via Server-Sent Events)
app.get('/api/audit/:token/stream', async (c) => {
  const token = c.req.param('token')
  
  // Configuration Server-Sent Events pour collaboration temps réel
  return new Response(
    new ReadableStream({
      start(controller) {
        // Simuler des updates temps réel
        const keepAlive = setInterval(() => {
          controller.enqueue(new TextEncoder().encode('data: {"type":"ping"}\n\n'))
        }, 30000)
        
        // Cleanup après déconnexion
        setTimeout(() => {
          clearInterval(keepAlive)
          controller.close()
        }, 3600000) // 1 heure max
      }
    }),
    {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    }
  )
})

// Upload plan PDF
app.post('/api/audit/:token/upload-plan', async (c) => {
  const { env } = c
  const token = c.req.param('token')
  const formData = await c.req.formData()
  const file = formData.get('plan') as File
  
  if (!file) {
    return c.json({ error: 'Aucun fichier fourni' }, 400)
  }
  
  // Stockage du plan dans R2
  const fileKey = `audits/${token}/plan_${Date.now()}.${file.name.split('.').pop()}`
  await env.R2.put(fileKey, await file.arrayBuffer(), {
    httpMetadata: {
      contentType: file.type
    }
  })
  
  // Mise à jour en base avec le lien du plan
  await env.DB.prepare(`
    UPDATE audits SET plan_file = ? WHERE token = ?
  `).bind(fileKey, token).run()
  
  return c.json({
    success: true,
    planUrl: `/api/plan/${fileKey}`
  })
})

// Récupérer un plan uploadé
app.get('/api/plan/*', async (c) => {
  const { env } = c
  const key = c.req.path.replace('/api/plan/', '')
  
  const object = await env.R2.get(key)
  if (!object) {
    return c.notFound()
  }
  
  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000'
    }
  })
})

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

// Route debug test
app.get('/debug-test', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <title>Test DiagPV Debug</title>
        <style>
            body { 
                font-family: Arial; 
                padding: 20px; 
                background: #000; 
                color: #fff; 
            }
            .form-group { 
                margin: 10px 0; 
            }
            input, button { 
                padding: 10px; 
                margin: 5px; 
                font-size: 16px; 
            }
            button { 
                background: #10b981; 
                color: white; 
                border: none; 
                cursor: pointer; 
            }
            #result { 
                margin-top: 20px; 
                padding: 10px; 
                border: 1px solid #333; 
            }
        </style>
    </head>
    <body>
        <h1>🌙 Test DiagPV - Création Audit</h1>
        
        <form id="testForm">
            <div class="form-group">
                <label>Projet:</label>
                <input type="text" id="projectName" value="Test-Debug-Direct" required>
            </div>
            <div class="form-group">
                <label>Client:</label>
                <input type="text" id="clientName" value="Client Test" required>
            </div>
            <div class="form-group">
                <label>Location:</label>
                <input type="text" id="location" value="Test Location" required>
            </div>
            <div class="form-group">
                <label>Strings:</label>
                <input type="number" id="stringCount" value="2" required>
            </div>
            <div class="form-group">
                <label>Modules/String:</label>
                <input type="number" id="modulesPerString" value="5" required>
            </div>
            <button type="submit">CRÉER AUDIT TEST</button>
        </form>
        
        <div id="result"></div>
        
        <script>
            document.getElementById('testForm').addEventListener('submit', async (e) => {
                e.preventDefault()
                
                const resultDiv = document.getElementById('result')
                resultDiv.innerHTML = '⏳ Création en cours...'
                
                console.log('🚀 Test création audit démarré')
                
                try {
                    const auditData = {
                        projectName: document.getElementById('projectName').value,
                        clientName: document.getElementById('clientName').value,
                        location: document.getElementById('location').value,
                        auditDate: new Date().toISOString().split('T')[0],
                        stringCount: parseInt(document.getElementById('stringCount').value),
                        modulesPerString: parseInt(document.getElementById('modulesPerString').value)
                    }
                    
                    console.log('📡 Données à envoyer:', auditData)
                    
                    const response = await fetch('/api/audit/create', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(auditData)
                    })
                    
                    console.log('📥 Réponse status:', response.status)
                    
                    const result = await response.json()
                    console.log('✅ Résultat:', result)
                    
                    if (result.success) {
                        resultDiv.innerHTML = \`
                            <h3>✅ SUCCÈS!</h3>
                            <p><strong>Token:</strong> \${result.auditToken}</p>
                            <p><strong>URL:</strong> <a href="\${result.auditUrl}" style="color: #10b981">\${result.auditUrl}</a></p>
                            <p><strong>Modules:</strong> \${result.totalModules}</p>
                            <button onclick="window.location.href='\${result.auditUrl}'" style="margin-top: 10px;">
                                🎯 ALLER À L'AUDIT
                            </button>
                        \`
                    } else {
                        resultDiv.innerHTML = \`❌ Échec: \${result.message || 'Erreur inconnue'}\`
                    }
                    
                } catch (error) {
                    console.error('❌ Erreur:', error)
                    resultDiv.innerHTML = \`❌ Erreur: \${error.message}\`
                }
            })
            
            console.log('🌙 DiagPV Debug Test initialisé')
        </script>
    </body>
    </html>
  `)
})

// Page d'accueil - Dashboard
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>DiagPV Audit - Électroluminescence Photovoltaïque</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/diagpv-styles.css" rel="stylesheet">
        <meta name="theme-color" content="#000000">
        <link rel="manifest" href="/manifest.json">
    </head>
    <body class="bg-black text-white min-h-screen font-bold">
        <div class="container mx-auto p-6">
            <!-- En-tête DiagPV -->
            <header class="mb-8 text-center">
                <div class="inline-flex items-center mb-4">
                    <i class="fas fa-solar-panel text-4xl text-yellow-400 mr-4"></i>
                    <h1 class="text-4xl font-black">DIAGNOSTIC PHOTOVOLTAÏQUE</h1>
                </div>
                <p class="text-xl text-gray-300">Audit Électroluminescence - Interface Terrain Nocturne</p>
                <p class="text-lg text-blue-400 mt-2">
                    <i class="fas fa-globe mr-2"></i>
                    www.diagnosticphotovoltaique.fr
                </p>
            </header>
            
            <!-- Interface création audit -->
            <div class="max-w-4xl mx-auto">
                <div class="bg-gray-900 rounded-lg p-8 border-2 border-yellow-400">
                    <h2 class="text-2xl font-black mb-6 text-center">
                        <i class="fas fa-plus-circle mr-2 text-green-400"></i>
                        NOUVEL AUDIT ÉLECTROLUMINESCENCE
                    </h2>
                    
                    <form id="createAuditForm" class="space-y-6">
                        <div class="grid md:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-lg font-bold mb-2">Nom du projet :</label>
                                <input type="text" id="projectName" required 
                                       class="w-full bg-black border-2 border-gray-600 rounded-lg px-4 py-3 text-lg focus:border-yellow-400 focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-lg font-bold mb-2">Client :</label>
                                <input type="text" id="clientName" required 
                                       class="w-full bg-black border-2 border-gray-600 rounded-lg px-4 py-3 text-lg focus:border-yellow-400 focus:outline-none">
                            </div>
                        </div>
                        
                        <div class="grid md:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-lg font-bold mb-2">Localisation :</label>
                                <input type="text" id="location" required 
                                       class="w-full bg-black border-2 border-gray-600 rounded-lg px-4 py-3 text-lg focus:border-yellow-400 focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-lg font-bold mb-2">Date :</label>
                                <input type="date" id="auditDate" required 
                                       class="w-full bg-black border-2 border-gray-600 rounded-lg px-4 py-3 text-lg focus:border-yellow-400 focus:outline-none">
                            </div>
                        </div>
                        
                        <div class="bg-gray-800 rounded-lg p-6 border border-gray-600">
                            <h3 class="text-xl font-bold mb-4 text-yellow-400">CONFIGURATION OU UPLOAD PLAN</h3>
                            
                            <div class="mb-6">
                                <h4 class="text-lg font-bold mb-3">Option A - Configuration manuelle :</h4>
                                <div class="grid md:grid-cols-3 gap-4">
                                    <div>
                                        <label class="block text-sm font-bold mb-2">Nombre de strings :</label>
                                        <input type="number" id="stringCount" min="1" max="100" 
                                               class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2 text-lg focus:border-yellow-400 focus:outline-none">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-bold mb-2">Modules par string :</label>
                                        <input type="number" id="modulesPerString" min="1" max="50" 
                                               class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2 text-lg focus:border-yellow-400 focus:outline-none">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-bold mb-2">Total modules :</label>
                                        <div id="totalModules" class="bg-black border-2 border-gray-600 rounded px-3 py-2 text-lg text-green-400 font-black">0</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="border-t border-gray-600 pt-6">
                                <h4 class="text-lg font-bold mb-3">Option B - Upload plan :</h4>
                                <div class="flex items-center space-x-4">
                                    <input type="file" id="planFile" accept=".pdf,.png,.jpg,.jpeg" 
                                           class="hidden">
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
                
                <!-- Audits récents -->
                <div class="mt-8 bg-gray-900 rounded-lg p-6 border border-gray-600">
                    <h3 class="text-xl font-bold mb-4 flex items-center">
                        <i class="fas fa-history mr-2 text-blue-400"></i>
                        MES AUDITS RÉCENTS
                    </h3>
                    <div id="recentAudits" class="space-y-2">
                        <p class="text-gray-400">Aucun audit récent trouvé</p>
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
        <meta name="theme-color" content="#000000">
    </head>
    <body class="bg-black text-white min-h-screen font-bold overflow-x-auto" data-audit-token="${token}">
        <!-- En-tête audit -->
        <header class="sticky top-0 bg-black border-b-2 border-yellow-400 p-4 z-50">
            <div class="flex flex-wrap items-center justify-between">
                <div class="flex items-center space-x-4">
                    <i class="fas fa-moon text-2xl text-yellow-400"></i>
                    <div>
                        <h1 id="projectTitle" class="text-xl font-black">Chargement...</h1>
                        <div class="flex items-center space-x-4 text-sm">
                            <span>Progression: <span id="progress" class="text-green-400 font-black">0/0</span></span>
                            <span>Techniciens: <span id="technicians" class="text-blue-400">0/4</span></span>
                            <span id="technicianIcons">👤</span>
                        </div>
                    </div>
                </div>
                
                <div class="flex space-x-2">
                    <button id="measureBtn" class="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded font-bold">
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
        
        <script src="/static/diagpv-audit.js"></script>
        <script src="/static/diagpv-measures.js"></script>
    </body>
    </html>
  `)
})

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
            body { font-family: Arial; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #000; padding: 20px; }
            .section { margin: 20px 0; page-break-inside: avoid; }
            .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
            .module-grid { display: grid; grid-template-columns: repeat(20, 30px); gap: 2px; }
            .module { width: 28px; height: 20px; border: 1px solid #000; text-align: center; font-size: 8px; }
            .ok { background: #22c55e; }
            .inequality { background: #eab308; }
            .microcracks { background: #f97316; }
            .dead { background: #ef4444; }
            .string_open { background: #3b82f6; }
            .not_connected { background: #6b7280; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🏢 DIAGNOSTIC PHOTOVOLTAÏQUE</h1>
            <p>www.diagnosticphotovoltaique.fr</p>
            <h2>AUDIT ÉLECTROLUMINESCENCE</h2>
            
            <div style="text-align: left; margin-top: 20px;">
                <p><strong>Client :</strong> ${audit.client_name}</p>
                <p><strong>Installation :</strong> ${audit.location}</p>
                <p><strong>Date intervention :</strong> ${date}</p>
                <p><strong>Configuration :</strong> ${audit.total_modules} modules photovoltaïques, ${audit.string_count} strings</p>
                <p><strong>Méthode :</strong> Électroluminescence nocturne</p>
                <p><strong>Normes :</strong> IEC 62446-1, IEC 61215</p>
            </div>
        </div>
        
        <div class="section">
            <h3>RÉSULTATS AUDIT ÉLECTROLUMINESCENCE</h3>
            <div class="stats">
                <div>🟢 Modules OK : ${stats.ok} (${okPercentage}%)</div>
                <div>🟡 Inégalité cellules : ${stats.inequality} (${inequalityPercentage}%)</div>
                <div>🟠 Microfissures : ${stats.microcracks} (${microcracksPercentage}%)</div>
                <div>🔴 Modules HS : ${stats.dead} (${deadPercentage}%)</div>
                <div>🔵 Strings ouverts : ${stats.string_open} (${stringOpenPercentage}%)</div>
                <div>⚫ Non raccordés : ${stats.not_connected} (${notConnectedPercentage}%)</div>
            </div>
            <p><strong>TOTAL MODULES AUDITÉS : ${stats.total}</strong></p>
        </div>
        
        <div class="section">
            <h3>CARTOGRAPHIE MODULES</h3>
            <div class="module-grid">
                ${modules.map(module => 
                  `<div class="module ${module.status}" title="${module.module_id}">
                     ${module.module_id.substring(1)}
                   </div>`
                ).join('')}
            </div>
        </div>
        
        <div class="section">
            <h3>MODULES NON-CONFORMES</h3>
            <table border="1" style="width: 100%; border-collapse: collapse;">
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
        
        ${measurements.length > 0 ? `
        <div class="section">
            <h3>MESURES ÉLECTRIQUES PVSERV</h3>
            <div style="margin-bottom: 15px;">
                <p><strong>Total mesures:</strong> ${measurements.length}</p>
                <p><strong>FF moyen:</strong> ${(measurements.reduce((sum, m) => sum + parseFloat(m.ff || 0), 0) / measurements.length).toFixed(3)}</p>
                <p><strong>Rds moyen:</strong> ${(measurements.reduce((sum, m) => sum + parseFloat(m.rds || 0), 0) / measurements.length).toFixed(2)} Ω</p>
            </div>
            
            <table border="1" style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <tr style="background: #f3f4f6;">
                    <th style="padding: 4px;">Module</th>
                    <th style="padding: 4px;">Type</th>
                    <th style="padding: 4px;">FF</th>
                    <th style="padding: 4px;">Rds (Ω)</th>
                    <th style="padding: 4px;">Uf (V)</th>
                    <th style="padding: 4px;">Points IV</th>
                </tr>
                ${measurements.slice(0, 50).map(m => { // Limite 50 pour PDF
                  const ivData = JSON.parse(m.iv_curve_data || '{"count": 0}')
                  return `
                    <tr>
                        <td style="padding: 4px;">M${m.module_number?.toString().padStart(3, '0')}</td>
                        <td style="padding: 4px;">${m.measurement_type}</td>
                        <td style="padding: 4px;">${parseFloat(m.ff || 0).toFixed(3)}</td>
                        <td style="padding: 4px;">${parseFloat(m.rds || 0).toFixed(2)}</td>
                        <td style="padding: 4px;">${m.uf || 0}</td>
                        <td style="padding: 4px;">${ivData.count || 0}</td>
                    </tr>
                  `
                }).join('')}
                ${measurements.length > 50 ? `
                <tr>
                    <td colspan="6" style="padding: 4px; text-align: center; font-style: italic;">
                        ... ${measurements.length - 50} mesures supplémentaires disponibles dans l'export complet
                    </td>
                </tr>
                ` : ''}
            </table>
            
            <div style="margin-top: 10px; font-size: 10px; color: #666;">
                <p><strong>Note:</strong> Données PVserv brutes sans interprétation. FF = Fill Factor, Rds = Résistance série, Uf = Tension.</p>
            </div>
        </div>
        ` : ''}

        <div class="section">
            <h3>SIGNATURE NUMÉRIQUE</h3>
            <p>Rapport généré automatiquement par DiagPV Audit</p>
            <p>Date génération : ${date}</p>
            <p>Token audit : ${audit.token}</p>
            ${measurements.length > 0 ? `<p>Mesures PVserv : ${measurements.length} intégrées</p>` : ''}
        </div>
    </body>
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

export default app