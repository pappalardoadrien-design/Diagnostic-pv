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

app.post('/api/audit/create-from-json', async (c) => {
  const { env } = c
  const { jsonConfig } = await c.req.json()
  
  if (!jsonConfig || !jsonConfig.diagpv_import_format) {
    return c.json({ error: 'Configuration JSON invalide' }, 400)
  }
  
  const config = jsonConfig.diagpv_import_format
  const auditToken = crypto.randomUUID()
  
  // Création audit avec données JSON
  await env.DB.prepare(`
    INSERT INTO audits (
      token, project_name, client_name, location, 
      string_count, modules_per_string, total_modules,
      created_at, status, json_config
    ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), 'created', ?)
  `).bind(
    auditToken, config.project_name, config.client_name, config.location,
    config.string_count, config.modules_per_string, config.total_modules,
    JSON.stringify(jsonConfig)
  ).run()
  
  // Génération modules avec positions détaillées si disponibles
  if (jsonConfig.strings_configuration) {
    for (const stringConfig of jsonConfig.strings_configuration) {
      for (const moduleConfig of stringConfig.modules) {
        // Nouvelle numérotation : S{string}-{position} au lieu de l'ancien module_id du JSON
        const newModuleId = `S${stringConfig.string_number}-${moduleConfig.position_in_string}`
        
        await env.DB.prepare(`
          INSERT INTO modules (
            audit_token, module_id, string_number, position_in_string,
            status, physical_row, physical_col, created_at
          ) VALUES (?, ?, ?, ?, 'pending', ?, ?, datetime('now'))
        `).bind(
          auditToken, newModuleId, stringConfig.string_number, 
          moduleConfig.position_in_string,
          moduleConfig.physical_position?.row || null,
          moduleConfig.physical_position?.col || null
        ).run()
      }
    }
  } else {
    // Génération standard si pas de configuration détaillée
    for (let s = 1; s <= config.string_count; s++) {
      for (let m = 1; m <= config.modules_per_string; m++) {
        // Nouvelle numérotation : S{string}-{position}
        const moduleId = `S${s}-${m}`
        
        await env.DB.prepare(`
          INSERT INTO modules (
            audit_token, module_id, string_number, position_in_string,
            status, created_at
          ) VALUES (?, ?, ?, ?, 'pending', datetime('now'))
        `).bind(auditToken, moduleId, s, m).run()
      }
    }
  }
  
  return c.json({
    success: true,
    auditToken,
    auditUrl: `/audit/${auditToken}`,
    totalModules: config.total_modules,
    message: 'Audit créé depuis configuration JSON'
  })
})

// Créer un nouvel audit
app.post('/api/audit/create', async (c) => {
  const { env } = c
  const requestData = await c.req.json()
  const { projectName, clientName, location, configuration } = requestData
  
  // Génération token unique sécurisé
  const auditToken = crypto.randomUUID()
  
  let totalModules = 0
  let stringCount = 0
  let modulesPerString = 0
  let configJson = null
  
  // Détermination du mode de configuration
  if (configuration && configuration.mode === 'advanced') {
    // Mode configuration avancée
    totalModules = configuration.totalModules
    stringCount = configuration.stringCount
    modulesPerString = 0 // Variable en mode avancé
    configJson = JSON.stringify(configuration)
  } else if (configuration && configuration.mode === 'simple') {
    // Mode simple (nouveau format)
    totalModules = configuration.totalModules
    stringCount = configuration.stringCount
    modulesPerString = configuration.modulesPerString
    configJson = JSON.stringify(configuration)
  } else {
    // Rétrocompatibilité - ancien format
    const { stringCount: oldStringCount, modulesPerString: oldModulesPerString } = requestData
    totalModules = (oldStringCount || 0) * (oldModulesPerString || 0)
    stringCount = oldStringCount || 0
    modulesPerString = oldModulesPerString || 0
  }
  
  // Création structure audit en base D1
  const audit = await env.DB.prepare(`
    INSERT INTO audits (
      token, project_name, client_name, location, 
      string_count, modules_per_string, total_modules,
      created_at, status, json_config
    ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), 'created', ?)
  `).bind(
    auditToken, projectName, clientName, location,
    stringCount, modulesPerString, totalModules, configJson
  ).run()
  
  // Génération modules selon le mode
  if (configuration && configuration.mode === 'advanced' && configuration.strings) {
    // Génération avancée avec configuration par string
    for (const stringConfig of configuration.strings) {
      if (stringConfig.moduleCount > 0) {
        const stringNumber = stringConfig.mpptNumber || stringConfig.id
        
        for (let modulePos = 1; modulePos <= stringConfig.moduleCount; modulePos++) {
          // Nouvelle numérotation : S{string}-{position}
          const moduleId = `S${stringNumber}-${modulePos}`
          
          await env.DB.prepare(`
            INSERT INTO modules (
              audit_token, module_id, string_number, position_in_string,
              status, created_at, physical_row, physical_col
            ) VALUES (?, ?, ?, ?, 'pending', datetime('now'), ?, ?)
          `).bind(
            auditToken, 
            moduleId, 
            stringNumber, 
            modulePos,
            stringNumber, // row = MPPT number pour organisation visuelle
            modulePos // col = position dans string
          ).run()
        }
      }
    }
  } else {
    // Génération simple (grille uniforme)
    for (let s = 1; s <= stringCount; s++) {
      for (let m = 1; m <= modulesPerString; m++) {
        // Nouvelle numérotation : S{string}-{position}
        const moduleId = `S${s}-${m}`
        
        await env.DB.prepare(`
          INSERT INTO modules (
            audit_token, module_id, string_number, position_in_string,
            status, created_at
          ) VALUES (?, ?, ?, ?, 'pending', datetime('now'))
        `).bind(auditToken, moduleId, s, m).run()
      }
    }
  }
  
  return c.json({
    success: true,
    auditToken,
    auditUrl: `/audit/${auditToken}`,
    totalModules,
    configuration: configuration ? configuration.mode : 'legacy',
    message: 'Audit créé avec succès'
  })
})

// API Dashboard - Audits avec statistiques détaillées
app.get('/api/dashboard/audits', async (c) => {
  const { env } = c
  
  try {
    // Récupération audits avec statistiques
    const audits = await env.DB.prepare(`
      SELECT 
        a.token, a.project_name, a.client_name, a.location,
        a.total_modules, a.string_count, a.status, a.created_at,
        COUNT(m.id) as modules_created,
        SUM(CASE WHEN m.status != 'pending' THEN 1 ELSE 0 END) as modules_completed,
        SUM(CASE WHEN m.status = 'ok' THEN 1 ELSE 0 END) as modules_ok,
        SUM(CASE WHEN m.status = 'inequality' THEN 1 ELSE 0 END) as modules_inequality,
        SUM(CASE WHEN m.status = 'microcracks' THEN 1 ELSE 0 END) as modules_microcracks,
        SUM(CASE WHEN m.status = 'dead' THEN 1 ELSE 0 END) as modules_dead,
        SUM(CASE WHEN m.status = 'string_open' THEN 1 ELSE 0 END) as modules_string_open,
        SUM(CASE WHEN m.status = 'not_connected' THEN 1 ELSE 0 END) as modules_not_connected
      FROM audits a
      LEFT JOIN modules m ON a.token = m.audit_token
      GROUP BY a.token
      ORDER BY a.created_at DESC
    `).all()
    
    // Calcul statistiques globales
    let totalAudits = 0
    let activeAudits = 0
    let totalModules = 0
    let totalDefauts = 0
    
    const auditsWithStats = audits.results.map(audit => {
      totalAudits++
      if (audit.status === 'created' || audit.status === 'in_progress') {
        activeAudits++
      }
      totalModules += audit.total_modules || 0
      
      const defauts = (audit.modules_inequality || 0) + 
                     (audit.modules_microcracks || 0) + 
                     (audit.modules_dead || 0) + 
                     (audit.modules_string_open || 0) + 
                     (audit.modules_not_connected || 0)
      totalDefauts += defauts
      
      const progressionPct = audit.total_modules > 0 
        ? Math.round(((audit.modules_completed || 0) / audit.total_modules) * 100)
        : 0
        
      return {
        ...audit,
        defauts_total: defauts,
        progression_pct: progressionPct,
        created_at_formatted: new Date(audit.created_at).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      }
    })
    
    return c.json({ 
      success: true,
      audits: auditsWithStats,
      stats: {
        totalAudits,
        activeAudits,
        totalModules,
        totalDefauts
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Erreur récupération dashboard:', error)
    return c.json({ error: 'Erreur récupération dashboard' }, 500)
  }
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

// Modifier les informations d'un audit
app.put('/api/audit/:token', async (c) => {
  const { env } = c
  const token = c.req.param('token')
  const { project_name, client_name, location } = await c.req.json()
  
  // Vérification que l'audit existe
  const existingAudit = await env.DB.prepare(
    'SELECT * FROM audits WHERE token = ?'
  ).bind(token).first()
  
  if (!existingAudit) {
    return c.json({ error: 'Audit non trouvé' }, 404)
  }
  
  // Mise à jour avec validation des champs requis
  if (!project_name || !client_name || !location) {
    return c.json({ error: 'Nom projet, client et localisation requis' }, 400)
  }
  
  await env.DB.prepare(`
    UPDATE audits 
    SET project_name = ?, client_name = ?, location = ?, updated_at = datetime('now')
    WHERE token = ?
  `).bind(project_name, client_name, location, token).run()
  
  return c.json({ 
    success: true,
    message: 'Audit mis à jour avec succès',
    updated: { project_name, client_name, location }
  })
})

// Supprimer un audit complet (avec tous ses modules)
app.delete('/api/audit/:token', async (c) => {
  const { env } = c
  const token = c.req.param('token')
  
  try {
    // Vérification que l'audit existe
    const existingAudit = await env.DB.prepare(
      'SELECT token, project_name FROM audits WHERE token = ?'
    ).bind(token).first()
    
    if (!existingAudit) {
      return c.json({ error: 'Audit non trouvé' }, 404)
    }
    
    // Suppression des modules en cascade
    await env.DB.prepare(`
      DELETE FROM modules WHERE audit_token = ?
    `).bind(token).run()
    
    // Suppression de l'audit
    await env.DB.prepare(`
      DELETE FROM audits WHERE token = ?
    `).bind(token).run()
    
    // Nettoyage des données de session collaborative
    const sessionKey = `audit_session:${token}`
    await env.KV.delete(sessionKey)
    
    return c.json({ 
      success: true,
      message: `Audit "${existingAudit.project_name}" supprimé avec succès`,
      deleted_audit: {
        token: existingAudit.token,
        project_name: existingAudit.project_name
      }
    })
    
  } catch (error) {
    console.error('Erreur suppression audit:', error)
    return c.json({ 
      error: 'Erreur lors de la suppression de l\'audit',
      details: error.message 
    }, 500)
  }
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
        <style>
        /* Styles critiques inline pour éviter l'écran noir */
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
                                
                                <!-- Configuration simple (mode actuel) -->
                                <div id="simpleConfig" class="grid md:grid-cols-3 gap-4 mb-4">
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
                                
                                <!-- Bouton pour configuration avancée -->
                                <div class="text-center mb-4 space-x-3">
                                    <button type="button" id="toggleAdvancedConfig" 
                                            class="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg font-bold text-sm">
                                        <i class="fas fa-cog mr-2"></i>CONFIGURATION AVANCÉE (Strings différents)
                                    </button>
                                    <button type="button" id="loadExampleConfig" 
                                            class="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-bold text-sm">
                                        <i class="fas fa-magic mr-2"></i>EXEMPLE MPPT (26+9×24)
                                    </button>
                                </div>
                                
                                <!-- Configuration avancée (masquée par défaut) -->
                                <div id="advancedConfig" class="hidden bg-gray-700 rounded-lg p-4 border border-orange-400">
                                    <div class="flex items-center justify-between mb-4">
                                        <h5 class="text-lg font-bold text-orange-400">Configuration par String/MPPT</h5>
                                        <button type="button" id="addStringBtn" 
                                                class="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm font-bold">
                                            <i class="fas fa-plus mr-1"></i>Ajouter String
                                        </button>
                                    </div>
                                    
                                    <div id="stringsList" class="space-y-2 max-h-60 overflow-y-auto">
                                        <!-- Strings dynamiques seront ajoutés ici -->
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
                
                <!-- Boutons d'accès -->
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
                        <p class="text-gray-300 mb-4">Gérez tous vos audits en cours avec mise à jour temps réel</p>
                        <a href="/dashboard" class="w-full bg-orange-600 hover:bg-orange-700 py-3 rounded-lg font-black text-lg transition-colors flex items-center justify-center">
                            <i class="fas fa-chart-line mr-2"></i>
                            ACCÉDER AU DASHBOARD
                        </a>
                    </div>
                </div>
            </div>
        </div>
        
        <script src="/static/diagpv-app.js"></script>
        <script src="/static/diagpv-json-importer.js"></script>
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
        /* Styles critiques inline pour éviter l'écran noir */
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
                
                <div class="flex space-x-2">
                    <a href="/dashboard" class="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded font-bold flex items-center border-2 border-orange-400 shadow-lg" title="Accéder au tableau de bord - Vue d'ensemble audits">
                        <i class="fas fa-tachometer-alt mr-2 text-lg"></i>TABLEAU DE BORD
                    </a>
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
        /* Styles critiques inline pour éviter l'écran noir */
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

export default app