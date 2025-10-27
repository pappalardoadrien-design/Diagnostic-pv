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
  
  return c.json({
    audit,
    modules: modules.results,
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

export default auditsRouter
