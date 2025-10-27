// ============================================================================
// MODULE EL - ROUTES AUDITS
// ============================================================================
// Gestion des audits électroluminescence (création, modification, suppression, consultation)
// Adapté au schéma D1 unifié (el_audits, el_modules)

import { Hono } from 'hono'
import type { 
  ELAudit, 
  ELModule, 
  CreateAuditRequest, 
  ELAuditConfiguration,
  DiagPVImportFormat,
  OLD_STATUS_MAPPING
} from '../types'

type Bindings = {
  DB: D1Database
  KV: KVNamespace
  R2: R2Bucket
}

const auditsRouter = new Hono<{ Bindings: Bindings }>()

// ============================================================================
// POST /api/el/audit/create - Créer un nouvel audit EL
// ============================================================================
auditsRouter.post('/create', async (c) => {
  const { env } = c
  const requestData: CreateAuditRequest = await c.req.json()
  const { projectName, clientName, location, configuration } = requestData
  
  // Validation des paramètres requis
  if (!projectName || !clientName || !location) {
    return c.json({ 
      error: 'Paramètres manquants: projectName, clientName et location sont requis'
    }, 400)
  }
  
  // Génération token unique sécurisé
  const auditToken = crypto.randomUUID()
  
  let totalModules = 0
  let stringCount = 0
  let modulesPerString = 0
  let configJson: string | null = null
  
  // Détermination du mode de configuration
  if (configuration && configuration.mode === 'advanced') {
    // Mode configuration avancée
    totalModules = configuration.totalModules || 0
    stringCount = configuration.stringCount || 0
    modulesPerString = 0 // Variable en mode avancé
    configJson = JSON.stringify(configuration)
  } else if (configuration && configuration.mode === 'simple') {
    // Mode simple
    stringCount = configuration.stringCount || 0
    modulesPerString = configuration.modulesPerString || 0
    totalModules = configuration.totalModules || (stringCount * modulesPerString)
    configJson = JSON.stringify(configuration)
  } else {
    // Rétrocompatibilité - ancien format
    const { stringCount: oldStringCount, modulesPerString: oldModulesPerString } = requestData
    totalModules = (oldStringCount || 0) * (oldModulesPerString || 0)
    stringCount = oldStringCount || 0
    modulesPerString = oldModulesPerString || 0
  }
  
  // Création structure audit en base D1
  await env.DB.prepare(`
    INSERT INTO el_audits (
      audit_token, project_name, client_name, location, 
      string_count, modules_per_string, total_modules,
      configuration_json, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'created', datetime('now'), datetime('now'))
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
          const moduleIdentifier = `S${stringNumber}-${modulePos}`
          
          await env.DB.prepare(`
            INSERT INTO el_modules (
              el_audit_id, audit_token, module_identifier, 
              string_number, position_in_string,
              defect_type, severity_level, physical_row, physical_col,
              created_at, updated_at
            ) 
            SELECT id, ?, ?, ?, ?, 'pending', 0, ?, ?, datetime('now'), datetime('now')
            FROM el_audits WHERE audit_token = ?
          `).bind(
            auditToken, 
            moduleIdentifier, 
            stringNumber, 
            modulePos,
            stringConfig.physicalRow || stringNumber,
            (stringConfig.physicalCol || 0) + modulePos - 1,
            auditToken
          ).run()
        }
      }
    }
  } else {
    // Génération simple (grille uniforme avec positions physiques)
    for (let s = 1; s <= stringCount; s++) {
      for (let m = 1; m <= modulesPerString; m++) {
        const moduleIdentifier = `S${s}-${m}`
        const physicalRow = s
        const physicalCol = m - 1
        
        await env.DB.prepare(`
          INSERT INTO el_modules (
            el_audit_id, audit_token, module_identifier,
            string_number, position_in_string,
            defect_type, severity_level, physical_row, physical_col,
            created_at, updated_at
          )
          SELECT id, ?, ?, ?, ?, 'pending', 0, ?, ?, datetime('now'), datetime('now')
          FROM el_audits WHERE audit_token = ?
        `).bind(
          auditToken, moduleIdentifier, s, m, physicalRow, physicalCol, auditToken
        ).run()
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

// ============================================================================
// POST /api/el/audit/create-from-json - Créer audit depuis format JSON DiagPV
// ============================================================================
auditsRouter.post('/create-from-json', async (c) => {
  const { env } = c
  const { jsonConfig }: { jsonConfig: DiagPVImportFormat } = await c.req.json()
  
  if (!jsonConfig || !jsonConfig.diagpv_import_format) {
    return c.json({ error: 'Configuration JSON invalide' }, 400)
  }
  
  const config = jsonConfig.diagpv_import_format
  const auditToken = crypto.randomUUID()
  
  // Création audit avec données JSON
  await env.DB.prepare(`
    INSERT INTO el_audits (
      audit_token, project_name, client_name, location, 
      string_count, modules_per_string, total_modules,
      configuration_json, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'created', datetime('now'), datetime('now'))
  `).bind(
    auditToken, config.project_name, config.client_name, config.location,
    config.string_count, config.modules_per_string, config.total_modules,
    JSON.stringify(jsonConfig)
  ).run()
  
  // Génération modules avec positions détaillées si disponibles
  if (jsonConfig.strings_configuration) {
    for (const stringConfig of jsonConfig.strings_configuration) {
      for (const moduleConfig of stringConfig.modules) {
        const moduleIdentifier = `S${stringConfig.string_number}-${moduleConfig.position_in_string}`
        
        await env.DB.prepare(`
          INSERT INTO el_modules (
            el_audit_id, audit_token, module_identifier,
            string_number, position_in_string,
            defect_type, severity_level, physical_row, physical_col,
            created_at, updated_at
          )
          SELECT id, ?, ?, ?, ?, 'pending', 0, ?, ?, datetime('now'), datetime('now')
          FROM el_audits WHERE audit_token = ?
        `).bind(
          auditToken,
          moduleIdentifier,
          stringConfig.string_number, 
          moduleConfig.position_in_string,
          moduleConfig.physical_position?.row || null,
          moduleConfig.physical_position?.col || null,
          auditToken
        ).run()
      }
    }
  } else {
    // Génération standard si pas de configuration détaillée
    for (let s = 1; s <= config.string_count; s++) {
      for (let m = 1; m <= config.modules_per_string; m++) {
        const moduleIdentifier = `S${s}-${m}`
        
        await env.DB.prepare(`
          INSERT INTO el_modules (
            el_audit_id, audit_token, module_identifier,
            string_number, position_in_string,
            defect_type, severity_level,
            created_at, updated_at
          )
          SELECT id, ?, ?, ?, ?, 'pending', 0, datetime('now'), datetime('now')
          FROM el_audits WHERE audit_token = ?
        `).bind(auditToken, moduleIdentifier, s, m, auditToken).run()
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

// ============================================================================
// GET /api/el/audit/:token - Récupérer les informations d'un audit
// ============================================================================
auditsRouter.get('/:token', async (c) => {
  const { env } = c
  const token = c.req.param('token')
  
  const audit = await env.DB.prepare(
    'SELECT * FROM el_audits WHERE audit_token = ?'
  ).bind(token).first<ELAudit>()
  
  if (!audit) {
    return c.json({ error: 'Audit non trouvé' }, 404)
  }
  
  const modules = await env.DB.prepare(
    'SELECT * FROM el_modules WHERE audit_token = ? ORDER BY string_number, position_in_string'
  ).bind(token).all()
  
  const progress = await env.DB.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN defect_type != 'pending' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN defect_type = 'none' THEN 1 ELSE 0 END) as ok,
      SUM(CASE WHEN defect_type = 'luminescence_inequality' THEN 1 ELSE 0 END) as inequality,
      SUM(CASE WHEN defect_type = 'microcrack' THEN 1 ELSE 0 END) as microcracks,
      SUM(CASE WHEN defect_type = 'dead_module' THEN 1 ELSE 0 END) as dead,
      SUM(CASE WHEN defect_type = 'string_open' THEN 1 ELSE 0 END) as string_open,
      SUM(CASE WHEN defect_type = 'not_connected' THEN 1 ELSE 0 END) as not_connected
    FROM el_modules WHERE audit_token = ?
  `).bind(token).first()
  
  // Transform modules pour compatibilité frontend
  const transformedModules = modules.results.map((m: any) => ({
    ...m,
    module_id: m.module_identifier,  // Ajouter alias pour ancien nom
    status: m.defect_type === 'none' ? 'ok' : 
            m.defect_type === 'luminescence_inequality' ? 'inequality' :
            m.defect_type === 'microcrack' ? 'microcracks' :
            m.defect_type === 'dead_module' ? 'dead' :
            m.defect_type === 'string_open' ? 'string_open' :
            m.defect_type === 'not_connected' ? 'not_connected' :
            m.defect_type === 'pending' ? 'pending' : m.defect_type
  }))
  
  return c.json({
    audit,
    modules: transformedModules,
    progress
  })
})

// ============================================================================
// PUT /api/el/audit/:token - Modifier les informations d'un audit
// ============================================================================
auditsRouter.put('/:token', async (c) => {
  const { env } = c
  const token = c.req.param('token')
  const { project_name, client_name, location } = await c.req.json()
  
  // Vérification que l'audit existe
  const existingAudit = await env.DB.prepare(
    'SELECT * FROM el_audits WHERE audit_token = ?'
  ).bind(token).first()
  
  if (!existingAudit) {
    return c.json({ error: 'Audit non trouvé' }, 404)
  }
  
  // Validation des champs requis
  if (!project_name || !client_name || !location) {
    return c.json({ error: 'Nom projet, client et localisation requis' }, 400)
  }
  
  await env.DB.prepare(`
    UPDATE el_audits 
    SET project_name = ?, client_name = ?, location = ?, updated_at = datetime('now')
    WHERE audit_token = ?
  `).bind(project_name, client_name, location, token).run()
  
  return c.json({ 
    success: true,
    message: 'Audit mis à jour avec succès',
    updated: { project_name, client_name, location }
  })
})

// ============================================================================
// DELETE /api/el/audit/:token - Supprimer un audit complet
// ============================================================================
auditsRouter.delete('/:token', async (c) => {
  const { env } = c
  const token = c.req.param('token')
  
  try {
    // Vérification que l'audit existe
    const existingAudit = await env.DB.prepare(
      'SELECT audit_token, project_name FROM el_audits WHERE audit_token = ?'
    ).bind(token).first()
    
    if (!existingAudit) {
      return c.json({ error: 'Audit non trouvé' }, 404)
    }
    
    // Suppression des modules en cascade (déjà géré par ON DELETE CASCADE)
    // Mais on le fait explicitement pour la clarté
    await env.DB.prepare(`
      DELETE FROM el_modules WHERE audit_token = ?
    `).bind(token).run()
    
    // Suppression de l'audit
    await env.DB.prepare(`
      DELETE FROM el_audits WHERE audit_token = ?
    `).bind(token).run()
    
    // Nettoyage des données de session collaborative
    const sessionKey = `audit_session:${token}`
    await env.KV.delete(sessionKey)
    
    return c.json({ 
      success: true,
      message: `Audit "${existingAudit.project_name}" supprimé avec succès`,
      deleted_audit: {
        token: existingAudit.audit_token,
        project_name: existingAudit.project_name
      }
    })
    
  } catch (error: any) {
    console.error('Erreur suppression audit:', error)
    return c.json({ 
      error: 'Erreur lors de la suppression de l\'audit',
      details: error.message 
    }, 500)
  }
})

// ============================================================================
// GET /api/el/audit/:token/report - Générer rapport PDF de l'audit
// ============================================================================
auditsRouter.get('/:token/report', async (c) => {
  const { env } = c
  const token = c.req.param('token')
  
  try {
    // Récupération audit
    const auditResult = await env.DB.prepare(`
      SELECT * FROM el_audits WHERE audit_token = ?
    `).bind(token).first()
    
    if (!auditResult) {
      return c.json({ error: 'Audit non trouvé' }, 404)
    }
    
    const audit = auditResult as ELAudit
    
    // Récupération tous les modules
    const modulesResult = await env.DB.prepare(`
      SELECT * FROM el_modules 
      WHERE audit_token = ?
      ORDER BY string_number, position_in_string
    `).bind(token).all()
    
    const modules = modulesResult.results as ELModule[]
    
    // Statistiques pour le rapport
    const stats = {
      total: modules.length,
      ok: modules.filter(m => m.defect_type === 'none').length,
      inequality: modules.filter(m => m.defect_type === 'luminescence_inequality').length,
      microcracks: modules.filter(m => m.defect_type === 'microcrack').length,
      dead: modules.filter(m => m.defect_type === 'dead_module').length,
      string_open: modules.filter(m => m.defect_type === 'string_open').length,
      not_connected: modules.filter(m => m.defect_type === 'not_connected').length,
      pending: modules.filter(m => m.defect_type === 'pending').length
    }
    
    const completion_rate = ((stats.total - stats.pending) / stats.total * 100).toFixed(1)
    
    // Génération HTML du rapport
    const reportHTML = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport EL - ${audit.project_name}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #fff; color: #000; }
        h1 { color: #ea580c; border-bottom: 3px solid #facc15; padding-bottom: 10px; }
        h2 { color: #ea580c; margin-top: 30px; }
        .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .info-box { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .info-row { display: flex; margin: 10px 0; }
        .info-label { font-weight: bold; width: 200px; }
        .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
        .stat-box { background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center; }
        .stat-number { font-size: 32px; font-weight: bold; }
        .stat-label { font-size: 14px; color: #666; margin-top: 5px; }
        .module-list { margin: 20px 0; }
        .module-item { display: flex; padding: 10px; border-bottom: 1px solid #ddd; }
        .module-id { width: 100px; font-weight: bold; }
        .module-status { width: 150px; }
        .module-comment { flex: 1; color: #666; }
        .status-ok { color: #16a34a; }
        .status-inequality { color: #facc15; }
        .status-microcracks { color: #fb923c; }
        .status-dead { color: #dc2626; }
        .footer { margin-top: 50px; padding-top: 20px; border-top: 2px solid #ddd; font-size: 12px; color: #666; text-align: center; }
        @media print {
            body { margin: 20px; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="no-print" style="margin-bottom: 20px;">
        <button onclick="window.print()" style="background: #ea580c; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
            📄 Imprimer / Enregistrer PDF
        </button>
        <button onclick="window.close()" style="background: #666; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; margin-left: 10px;">
            ✕ Fermer
        </button>
    </div>

    <h1>🔋 RAPPORT AUDIT ÉLECTROLUMINESCENCE</h1>
    
    <div class="info-box">
        <div class="info-row">
            <div class="info-label">Projet :</div>
            <div>${audit.project_name}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Client :</div>
            <div>${audit.client_name}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Localisation :</div>
            <div>${audit.location || 'N/A'}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Date d'installation :</div>
            <div>${audit.installation_date || 'N/A'}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Type d'installation :</div>
            <div>${audit.installation_type || 'N/A'}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Puissance panneaux :</div>
            <div>${audit.panel_power || 'N/A'} Wc</div>
        </div>
        <div class="info-row">
            <div class="info-label">Date d'audit :</div>
            <div>${new Date(audit.created_at).toLocaleDateString('fr-FR')}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Token audit :</div>
            <div>${audit.audit_token}</div>
        </div>
    </div>

    <h2>📊 STATISTIQUES</h2>
    <div class="stats">
        <div class="stat-box">
            <div class="stat-number">${stats.total}</div>
            <div class="stat-label">Total modules</div>
        </div>
        <div class="stat-box">
            <div class="stat-number" style="color: #16a34a;">${stats.ok}</div>
            <div class="stat-label">Modules OK</div>
        </div>
        <div class="stat-box">
            <div class="stat-number" style="color: #fb923c;">${stats.microcracks}</div>
            <div class="stat-label">Microfissures</div>
        </div>
        <div class="stat-box">
            <div class="stat-number" style="color: #dc2626;">${stats.dead}</div>
            <div class="stat-label">Modules HS</div>
        </div>
        <div class="stat-box">
            <div class="stat-number" style="color: #facc15;">${stats.inequality}</div>
            <div class="stat-label">Inégalités</div>
        </div>
        <div class="stat-box">
            <div class="stat-number" style="color: #60a5fa;">${stats.string_open}</div>
            <div class="stat-label">Strings ouverts</div>
        </div>
        <div class="stat-box">
            <div class="stat-number" style="color: #9ca3af;">${stats.not_connected}</div>
            <div class="stat-label">Non raccordés</div>
        </div>
        <div class="stat-box">
            <div class="stat-number">${completion_rate}%</div>
            <div class="stat-label">Complétion</div>
        </div>
    </div>

    <h2>📋 DÉTAIL DES MODULES</h2>
    <div class="module-list">
        ${modules.filter(m => m.defect_type !== 'none' && m.defect_type !== 'pending').map(module => `
            <div class="module-item">
                <div class="module-id">${module.module_identifier}</div>
                <div class="module-status status-${module.defect_type}">
                    ${module.defect_type === 'luminescence_inequality' ? '🟡 Inégalité luminescence' : 
                      module.defect_type === 'microcrack' ? '🟠 Microfissures' :
                      module.defect_type === 'dead_module' ? '🔴 Module HS' :
                      module.defect_type === 'string_open' ? '🔵 String ouvert' :
                      module.defect_type === 'not_connected' ? '⚫ Non raccordé' :
                      module.defect_type}
                </div>
                <div class="module-comment">${module.comment || ''}</div>
            </div>
        `).join('')}
    </div>

    <div class="footer">
        <p><strong>Diagnostic Photovoltaïque - Rapport généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</strong></p>
        <p>Ce document a été généré automatiquement par le système DiagPV Audit EL</p>
    </div>
</body>
</html>
    `
    
    return c.html(reportHTML)
    
  } catch (error: any) {
    console.error('Erreur génération rapport:', error)
    return c.json({ 
      error: 'Erreur lors de la génération du rapport',
      details: error.message 
    }, 500)
  }
})

// ============================================================================
// IMPORT ET MONTAGE ROUTES MODULES SOUS /:token
// ============================================================================
import modulesRouter from './modules'
auditsRouter.route('/:token', modulesRouter)

export default auditsRouter
