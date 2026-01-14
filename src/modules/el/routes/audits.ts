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
  
  // Récupérer la centrale PV liée via pv_cartography_audit_links
  let linkedPlant = null
  let linkedZones: any[] = []
  try {
    linkedPlant = await env.DB.prepare(`
      SELECT DISTINCT
        p.id AS plant_id,
        p.plant_name,
        p.address,
        p.city,
        p.total_power_kwp,
        p.latitude,
        p.longitude,
        c.company_name AS client_company
      FROM pv_cartography_audit_links pcal
      JOIN pv_plants p ON pcal.pv_plant_id = p.id
      LEFT JOIN crm_clients c ON p.client_id = c.id
      WHERE pcal.el_audit_token = ?
      LIMIT 1
    `).bind(token).first()
    
    if (linkedPlant) {
      // Récupérer les zones liées avec modules
      const zonesResult = await env.DB.prepare(`
        SELECT 
          z.id AS zone_id,
          z.zone_name,
          z.zone_type AS layout_type,
          z.azimuth,
          z.tilt,
          (SELECT COUNT(*) FROM pv_modules pm WHERE pm.zone_id = z.id) AS module_count,
          (SELECT SUM(pm.power_wp) FROM pv_modules pm WHERE pm.zone_id = z.id) AS total_power_wp
        FROM pv_cartography_audit_links pcal
        JOIN pv_zones z ON pcal.pv_zone_id = z.id
        WHERE pcal.el_audit_token = ?
        ORDER BY z.zone_name
      `).bind(token).all()
      console.log('Zones query result:', JSON.stringify(zonesResult))
      linkedZones = zonesResult.results || []
    }
  } catch (e: any) {
    console.error('Error fetching linked plant/zones:', e.message)
  }
  
  return c.json({
    audit,
    modules: transformedModules,
    progress,
    linkedPlant,
    linkedZones
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
// PUT /api/el/audit/:token/configuration - Modifier configuration technique audit
// ============================================================================
// Permet de modifier le nombre de strings, modules, BJ, onduleurs même après début audit
auditsRouter.put('/:token/configuration', async (c) => {
  const { env } = c
  const token = c.req.param('token')
  const { 
    string_count, 
    total_modules,
    panel_power,
    junction_boxes,
    inverter_count,
    add_strings 
  } = await c.req.json()
  
  try {
    // Vérification que l'audit existe
    const existingAudit = await env.DB.prepare(
      'SELECT * FROM el_audits WHERE audit_token = ?'
    ).bind(token).first()
    
    if (!existingAudit) {
      return c.json({ error: 'Audit non trouvé' }, 404)
    }
    
    const audit = existingAudit as any
    
    // Construction de la requête de mise à jour dynamique
    const updates: string[] = []
    const bindings: any[] = []
    
    if (string_count !== undefined) {
      updates.push('string_count = ?')
      bindings.push(string_count)
    }
    
    if (total_modules !== undefined) {
      updates.push('total_modules = ?')
      bindings.push(total_modules)
    }
    
    if (panel_power !== undefined) {
      updates.push('panel_power = ?')
      bindings.push(panel_power)
    }
    
    if (junction_boxes !== undefined) {
      updates.push('junction_boxes = ?')
      bindings.push(junction_boxes)
    }
    
    if (inverter_count !== undefined) {
      updates.push('inverter_count = ?')
      bindings.push(inverter_count)
    }
    
    // Toujours mettre à jour le timestamp
    updates.push('updated_at = datetime(\'now\')')
    
    if (updates.length > 1) { // > 1 car updated_at est toujours présent
      bindings.push(token)
      
      await env.DB.prepare(`
        UPDATE el_audits 
        SET ${updates.join(', ')}
        WHERE audit_token = ?
      `).bind(...bindings).run()
    }
    
    // Gestion ajout de strings avec modules
    if (add_strings && Array.isArray(add_strings) && add_strings.length > 0) {
      for (const stringConfig of add_strings) {
        const { string_number, module_count, start_position = 1 } = stringConfig
        
        if (!string_number || !module_count) {
          continue
        }
        
        // Vérifier que le string n'existe pas déjà
        const existingModules = await env.DB.prepare(`
          SELECT COUNT(*) as count 
          FROM el_modules 
          WHERE audit_token = ? AND string_number = ?
        `).bind(token, string_number).first()
        
        if ((existingModules as any).count > 0) {
          console.log(`String ${string_number} existe déjà, skip`)
          continue
        }
        
        // Création des modules pour ce string
        for (let i = 0; i < module_count; i++) {
          const position = start_position + i
          const moduleId = `S${string_number}-${position}`
          
          await env.DB.prepare(`
            INSERT INTO el_modules (
              el_audit_id,
              audit_token,
              module_identifier,
              string_number,
              position_in_string,
              defect_type,
              severity_level,
              physical_row,
              physical_col
            ) VALUES (?, ?, ?, ?, ?, 'pending', 0, ?, ?)
          `).bind(
            audit.id,
            token,
            moduleId,
            string_number,
            position,
            string_number,  // physical_row = string_number par défaut
            position        // physical_col = position par défaut
          ).run()
        }
        
        console.log(`✅ String ${string_number} ajouté: ${module_count} modules`)
      }
    }
    
    // Recompter les modules réels
    const moduleCountResult = await env.DB.prepare(`
      SELECT COUNT(*) as total FROM el_modules WHERE audit_token = ?
    `).bind(token).first()
    
    const actualModuleCount = (moduleCountResult as any).total
    
    // Mettre à jour le total_modules avec le compte réel
    await env.DB.prepare(`
      UPDATE el_audits 
      SET total_modules = ?,
          updated_at = datetime('now')
      WHERE audit_token = ?
    `).bind(actualModuleCount, token).run()
    
    return c.json({ 
      success: true,
      message: 'Configuration mise à jour avec succès',
      updated: {
        string_count,
        total_modules: actualModuleCount,
        panel_power,
        junction_boxes,
        inverter_count,
        strings_added: add_strings?.length || 0
      }
    })
    
  } catch (error: any) {
    console.error('Erreur mise à jour configuration:', error)
    return c.json({ 
      error: 'Erreur lors de la mise à jour de la configuration',
      details: error.message 
    }, 500)
  }
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
// ============================================================================
// POST /api/el/audit/:token/module/:moduleId - Mettre à jour module individuel
// ============================================================================
auditsRouter.post('/:token/module/:moduleId', async (c) => {
  const { env } = c
  const token = c.req.param('token')
  const moduleId = c.req.param('moduleId')
  
  try {
    // Parse body
    let body
    try {
      body = await c.req.json()
    } catch (e) {
      return c.json({ error: 'JSON invalide', details: String(e) }, 400)
    }
    
    const status = body.status || body.defect_type
    const comment = body.comment || body.notes
    const technicianId = body.technicianId || body.technician_id
    
    if (!status) {
      return c.json({ error: 'Champ status requis' }, 400)
    }
    
    // Mapping ancien statut → nouveau defect_type
    const statusMap: Record<string, string> = {
      'ok': 'none',
      'inequality': 'luminescence_inequality',
      'microcracks': 'microcrack',
      'dead': 'dead_module',
      'string_open': 'string_open',
      'not_connected': 'not_connected',
      'pending': 'pending',
      'none': 'none',
      'luminescence_inequality': 'luminescence_inequality',
      'microcrack': 'microcrack',
      'dead_module': 'dead_module'
    }
    
    const defect_type = statusMap[status]
    if (!defect_type) {
      return c.json({ error: `Statut invalide: ${status}` }, 400)
    }
    
    // Calculer severity_level
    const severityMap: Record<string, number> = {
      'none': 0,
      'luminescence_inequality': 1,
      'microcrack': 2,
      'dead_module': 3,
      'string_open': 3,
      'not_connected': 2,
      'pending': 0
    }
    const severity_level = severityMap[defect_type] || 0
    
    // Mise à jour module (sans technician_id pour éviter contrainte FK)
    let result
    try {
      result = await env.DB.prepare(`
        UPDATE el_modules 
        SET defect_type = ?,
            severity_level = ?,
            comment = ?,
            updated_at = datetime('now')
        WHERE audit_token = ? AND module_identifier = ?
      `).bind(defect_type, severity_level, comment || null, token, moduleId).run()
    } catch (dbError: any) {
      return c.json({ 
        error: 'Erreur DB UPDATE', 
        details: dbError?.message || String(dbError),
        query: { token, moduleId, defect_type, severity_level }
      }, 500)
    }
    
    if (!result || !result.meta || result.meta.changes === 0) {
      return c.json({ 
        error: `Module non trouvé: ${moduleId}`,
        token,
        moduleId 
      }, 404)
    }
    
    return c.json({ 
      success: true, 
      moduleId, 
      defect_type, 
      status,
      changes: result.meta.changes 
    })
    
  } catch (error: any) {
    return c.json({ 
      error: 'Erreur serveur inconnue', 
      details: error?.message || String(error),
      stack: error?.stack?.split('\n').slice(0, 3).join('\n')
    }, 500)
  }
})

// ============================================================================
// POST /api/el/audit/:token/bulk-update - Mise à jour en masse des modules
// ============================================================================
// Permet de mettre à jour plusieurs modules en une seule requête (sélection multiple terrain)
auditsRouter.post('/:token/bulk-update', async (c) => {
  const { env } = c
  const token = c.req.param('token')
  
  try {
    const body = await c.req.json()
    // Support les deux formats: 'modules' (utilisé par diagpv-audit.js) et 'moduleIds'
    const moduleIds = body.modules || body.moduleIds
    const { status, comment } = body
    
    if (!moduleIds || !Array.isArray(moduleIds) || moduleIds.length === 0) {
      return c.json({ error: 'modules ou moduleIds requis (tableau)' }, 400)
    }
    
    if (!status) {
      return c.json({ error: 'status requis' }, 400)
    }
    
    // Mapping statut → defect_type
    const statusMap: Record<string, string> = {
      'ok': 'none',
      'inequality': 'luminescence_inequality',
      'microcracks': 'microcrack',
      'dead': 'dead_module',
      'string_open': 'string_open',
      'not_connected': 'not_connected',
      'pending': 'pending',
      'none': 'none',
      'luminescence_inequality': 'luminescence_inequality',
      'microcrack': 'microcrack',
      'dead_module': 'dead_module'
    }
    
    const defect_type = statusMap[status]
    if (!defect_type) {
      return c.json({ error: `Statut invalide: ${status}` }, 400)
    }
    
    // Calculer severity
    const severityMap: Record<string, number> = {
      'none': 0, 'luminescence_inequality': 1, 'microcrack': 2,
      'dead_module': 3, 'string_open': 3, 'not_connected': 2, 'pending': 0
    }
    const severity_level = severityMap[defect_type] || 0
    
    // Mise à jour en batch
    let updatedCount = 0
    for (const moduleId of moduleIds) {
      const result = await env.DB.prepare(`
        UPDATE el_modules 
        SET defect_type = ?, severity_level = ?, comment = COALESCE(?, comment), updated_at = datetime('now')
        WHERE audit_token = ? AND module_identifier = ?
      `).bind(defect_type, severity_level, comment || null, token, moduleId).run()
      
      if (result.meta.changes > 0) {
        updatedCount++
      }
    }
    
    return c.json({
      success: true,
      requested: moduleIds.length,
      updated: updatedCount,
      defect_type,
      status
    })
    
  } catch (error: any) {
    console.error('Erreur batch-update:', error)
    return c.json({ error: 'Erreur batch-update', details: error?.message }, 500)
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
    
    // Récupérer la centrale PV liée pour le rapport
    let linkedPlant: any = null
    let linkedZones: any[] = []
    try {
      linkedPlant = await env.DB.prepare(`
        SELECT DISTINCT
          p.id AS plant_id,
          p.plant_name,
          p.address,
          p.city,
          p.total_power_kwp,
          c.company_name AS client_company
        FROM pv_cartography_audit_links pcal
        JOIN pv_plants p ON pcal.pv_plant_id = p.id
        LEFT JOIN crm_clients c ON p.client_id = c.id
        WHERE pcal.el_audit_token = ?
        LIMIT 1
      `).bind(token).first()
      
      if (linkedPlant) {
        const zonesResult = await env.DB.prepare(`
          SELECT 
            z.id AS zone_id,
            z.zone_name,
            z.zone_type,
            (SELECT COUNT(*) FROM pv_modules pm WHERE pm.zone_id = z.id) AS module_count,
            (SELECT SUM(pm.power_wp) FROM pv_modules pm WHERE pm.zone_id = z.id) AS total_power_wp
          FROM pv_cartography_audit_links pcal
          JOIN pv_zones z ON pcal.pv_zone_id = z.id
          WHERE pcal.el_audit_token = ?
          ORDER BY z.zone_name
        `).bind(token).all()
        linkedZones = zonesResult.results || []
      }
    } catch (e) {
      console.warn('Error fetching linked plant for report:', e)
    }
    
    // Calculer la puissance totale depuis les zones liées
    const totalPowerKw = linkedZones.reduce((sum, z) => sum + (z.total_power_wp || 0), 0) / 1000
    
    // Récupérer les données IV-Curves liées à l'audit
    let ivCurvesData: any = null
    try {
      const ivCurves = await env.DB.prepare(`
        SELECT 
          string_number,
          COUNT(*) as curves_count,
          AVG(fill_factor) as avg_fill_factor,
          AVG(voc) as avg_voc,
          AVG(isc) as avg_isc,
          AVG(pmax) as avg_pmax,
          AVG(uf_diodes) as avg_uf_diodes,
          AVG(rds) as avg_rds,
          SUM(CASE WHEN anomaly_detected = 1 THEN 1 ELSE 0 END) as anomalies_count
        FROM iv_curves 
        WHERE audit_token = ?
        GROUP BY string_number
        ORDER BY string_number ASC
      `).bind(token).all()
      
      if (ivCurves.results && ivCurves.results.length > 0) {
        const totalCurves = ivCurves.results.reduce((sum: number, c: any) => sum + c.curves_count, 0)
        const totalAnomalies = ivCurves.results.reduce((sum: number, c: any) => sum + c.anomalies_count, 0)
        const avgFF = ivCurves.results.reduce((sum: number, c: any) => sum + (c.avg_fill_factor || 0), 0) / ivCurves.results.length
        
        ivCurvesData = {
          hasData: true,
          byString: ivCurves.results,
          totalCurves,
          totalAnomalies,
          avgFillFactor: avgFF
        }
      }
    } catch (e) {
      console.warn('Error fetching IV curves for report:', e)
    }
    
    // Fonction génération grille physique
    const generatePhysicalGrid = (modules: ELModule[]) => {
      if (!modules || modules.length === 0) {
        return '<p>Aucun module trouvé</p>'
      }

      // Tri par position physique
      const sortedModules = modules.sort((a, b) => {
        if (a.physical_row !== b.physical_row) {
          return (a.physical_row || 0) - (b.physical_row || 0)
        }
        return (a.physical_col || 0) - (b.physical_col || 0)
      })

      // Déterminer dimensions grille
      const maxRow = Math.max(...sortedModules.map(m => m.physical_row || 0))
      const maxCol = Math.max(...sortedModules.map(m => m.physical_col || 0))
      const minRow = Math.min(...sortedModules.map(m => m.physical_row || 0))
      const minCol = Math.min(...sortedModules.map(m => m.physical_col || 0))

      // Créer grille vide (String 1 en HAUT = index 0, String max en BAS = dernier index)
      const grid: (ELModule | null)[][] = []
      for (let row = minRow; row <= maxRow; row++) { // Row 1 → 2 → ... → 11
        const gridRow: (ELModule | null)[] = []
        for (let col = minCol; col <= maxCol; col++) {
          gridRow.push(null)
        }
        grid.push(gridRow) // grid[0] = Row 1 (HAUT), grid[10] = Row 11 (BAS)
      }

      // Placer les modules dans la grille
      sortedModules.forEach(module => {
        const row = module.physical_row || 0
        const col = module.physical_col || 0
        const gridRowIndex = row - minRow // Row 1 → index 0 (HAUT), Row 11 → index 10 (BAS)
        const gridColIndex = col - minCol
        
        if (grid[gridRowIndex] && grid[gridRowIndex][gridColIndex] !== undefined) {
          grid[gridRowIndex][gridColIndex] = module
        }
      })

      // Génération HTML de la grille
      let gridHTML = '<div class="physical-grid">'
      
      grid.forEach((row) => {
        gridHTML += '<div class="grid-row">'
        row.forEach((cell) => {
          if (cell) {
            // Mapping defect_type vers classes CSS
            let statusClass = 'module-ok'
            if (cell.defect_type === 'none') {
              statusClass = 'module-ok'
            } else if (cell.defect_type === 'luminescence_inequality') {
              statusClass = 'module-inequality'
            } else {
              statusClass = `module-${cell.defect_type}`
            }
            
            const displayId = cell.module_identifier.includes('-') 
              ? cell.module_identifier.split('-')[1] 
              : cell.module_identifier.substring(1)
            gridHTML += `<div class="grid-cell ${statusClass}" title="${cell.module_identifier} - ${cell.defect_type}">${displayId}</div>`
          } else {
            gridHTML += '<div class="grid-cell empty"></div>'
          }
        })
        gridHTML += '</div>'
      })
      
      gridHTML += '</div>'
      
      // Légende
      gridHTML += `
        <div class="grid-legend">
          <div class="legend-item">
            <div class="legend-box" style="background: #d1fae5;"></div>
            <span>🟢 OK</span>
          </div>
          <div class="legend-item">
            <div class="legend-box" style="background: #fef3c7;"></div>
            <span>🟡 Inégalité</span>
          </div>
          <div class="legend-item">
            <div class="legend-box" style="background: #fed7aa;"></div>
            <span>🟠 Microfissures</span>
          </div>
          <div class="legend-item">
            <div class="legend-box" style="background: #fecaca;"></div>
            <span>🔴 Impact Cellulaire - À REMPLACER</span>
          </div>
          <div class="legend-item">
            <div class="legend-box" style="background: #dbeafe;"></div>
            <span>🔵 String ouvert</span>
          </div>
          <div class="legend-item">
            <div class="legend-box" style="background: #e5e7eb;"></div>
            <span>⚫ Non raccordé</span>
          </div>
          <div class="legend-item">
            <div class="legend-box" style="background: #f5f5f5;"></div>
            <span>⬜ Vide</span>
          </div>
        </div>
      `
      
      return gridHTML
    }
    
    // Génération HTML du rapport
    const reportHTML = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport EL - ${audit.project_name} | Diagnostic Photovoltaïque</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body { font-family: 'Inter', Arial, sans-serif; margin: 40px; background: #fff; color: #1f2937; line-height: 1.6; }
        h1 { color: #ea580c; border-bottom: 3px solid #facc15; padding-bottom: 15px; font-size: 28px; margin-bottom: 25px; }
        h2 { color: #ea580c; margin-top: 35px; font-size: 20px; border-left: 4px solid #facc15; padding-left: 12px; }
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
        
        /* Styles grille calepinage */
        .physical-grid { 
            display: inline-block; 
            border: 2px solid #333; 
            background: #fff;
            margin: 10px auto;
        }
        .grid-row { 
            display: flex; 
            border-bottom: 1px solid #ddd; 
        }
        .grid-row:last-child { 
            border-bottom: none; 
        }
        .grid-cell { 
            width: 50px; 
            height: 50px; 
            border-right: 1px solid #ddd; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            font-size: 10px; 
            font-weight: bold; 
            position: relative;
        }
        .grid-cell:last-child { 
            border-right: none; 
        }
        .grid-cell.empty { 
            background: #f5f5f5; 
        }
        .grid-cell.module-ok { 
            background: #d1fae5; 
            color: #065f46; 
        }
        .grid-cell.module-none { 
            background: #d1fae5; 
            color: #065f46; 
        }
        .grid-cell.module-inequality { 
            background: #fef3c7; 
            color: #92400e; 
        }
        .grid-cell.module-luminescence_inequality { 
            background: #fef3c7; 
            color: #92400e; 
        }
        .grid-cell.module-microcrack { 
            background: #fed7aa; 
            color: #9a3412; 
        }
        .grid-cell.module-dead_module { 
            background: #fecaca; 
            color: #991b1b; 
            font-weight: 900;
        }
        .grid-cell.module-string_open { 
            background: #dbeafe; 
            color: #1e40af; 
        }
        .grid-cell.module-not_connected { 
            background: #e5e7eb; 
            color: #374151; 
        }
        .grid-cell.module-pending { 
            background: #fff; 
            color: #9ca3af; 
        }
        .grid-legend { 
            display: flex; 
            flex-wrap: wrap; 
            gap: 15px; 
            margin-top: 15px; 
            padding: 15px; 
            background: #fff; 
            border: 1px solid #ddd; 
            border-radius: 5px;
        }
        .legend-item { 
            display: flex; 
            align-items: center; 
            gap: 8px; 
        }
        .legend-box { 
            width: 30px; 
            height: 30px; 
            border: 1px solid #333; 
        }
        
        .footer { margin-top: 50px; padding-top: 20px; border-top: 2px solid #ddd; font-size: 12px; color: #666; text-align: center; }
        @media print {
            body { margin: 20px; }
            .no-print { display: none; }
            .physical-grid { page-break-inside: avoid; }
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
            <div>${linkedPlant?.client_company || audit.client_name}</div>
        </div>
        ${linkedPlant ? `
        <div class="info-row">
            <div class="info-label">Centrale PV :</div>
            <div><strong>${linkedPlant.plant_name}</strong></div>
        </div>
        ` : ''}
        <div class="info-row">
            <div class="info-label">Localisation :</div>
            <div>${linkedPlant ? `${linkedPlant.address || ''} ${linkedPlant.city || ''}` : audit.location || 'N/A'}</div>
        </div>
        ${linkedPlant ? `
        <div class="info-row">
            <div class="info-label">Configuration :</div>
            <div>${linkedZones.length} strings × ${linkedZones[0]?.module_count || 0} modules = ${stats.total} modules</div>
        </div>
        <div class="info-row">
            <div class="info-label">Puissance totale :</div>
            <div><strong>${totalPowerKw.toFixed(2)} kWc</strong></div>
        </div>
        ` : `
        <div class="info-row">
            <div class="info-label">Puissance panneaux :</div>
            <div>${audit.panel_power || 'N/A'} Wc</div>
        </div>
        `}
        <div class="info-row">
            <div class="info-label">Date d'audit :</div>
            <div>${new Date(audit.created_at).toLocaleDateString('fr-FR')}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Token audit :</div>
            <div style="font-size: 11px;">${audit.audit_token}</div>
        </div>
    </div>
    
    ${linkedZones.length > 0 ? `
    <h2>📍 ZONES / STRINGS DE LA CENTRALE</h2>
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; margin: 15px 0;">
        ${linkedZones.map(z => `
        <div style="background: #f5f5f5; padding: 12px; border-radius: 6px; text-align: center; border-left: 4px solid #ea580c;">
            <div style="font-weight: bold; color: #ea580c;">${z.zone_name}</div>
            <div style="font-size: 12px; color: #666;">${z.module_count} modules</div>
            <div style="font-size: 11px; color: #999;">${((z.total_power_wp || 0) / 1000).toFixed(2)} kWc</div>
        </div>
        `).join('')}
    </div>
    ` : ''}

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

    <h2>🗺️ PLAN DE CALEPINAGE - LOCALISATION PHYSIQUE DES MODULES</h2>
    <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; page-break-inside: avoid;">
        <p style="margin-bottom: 15px; font-weight: bold; color: #ea580c;">
            ⚠️ IMPORTANT : Utilisez ce plan pour localiser les modules à remplacer sur site
        </p>
        ${generatePhysicalGrid(modules)}
    </div>

    ${ivCurvesData?.hasData ? `
    <h2>📈 DONNÉES COURBES I-V (DIODES & SOMBRE)</h2>
    <div class="info-box" style="background: #fef3c7; border-left: 4px solid #f59e0b;">
        <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 20px; margin-bottom: 15px;">
            <div>
                <div style="font-size: 14px; color: #92400e;">Total courbes mesurées</div>
                <div style="font-size: 28px; font-weight: bold; color: #d97706;">${ivCurvesData.totalCurves}</div>
            </div>
            <div>
                <div style="font-size: 14px; color: #92400e;">Fill Factor moyen</div>
                <div style="font-size: 28px; font-weight: bold; color: ${ivCurvesData.avgFillFactor >= 0.70 ? '#16a34a' : ivCurvesData.avgFillFactor >= 0.60 ? '#d97706' : '#dc2626'};">
                    ${(ivCurvesData.avgFillFactor * 100).toFixed(1)}%
                </div>
            </div>
            <div>
                <div style="font-size: 14px; color: #92400e;">Anomalies détectées</div>
                <div style="font-size: 28px; font-weight: bold; color: ${ivCurvesData.totalAnomalies > 0 ? '#dc2626' : '#16a34a'};">
                    ${ivCurvesData.totalAnomalies}
                </div>
            </div>
        </div>
        
        <h3 style="color: #92400e; font-size: 16px; margin: 15px 0 10px 0;">Détail par String</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <thead>
                <tr style="background: #fcd34d; color: #78350f;">
                    <th style="padding: 8px; text-align: left; border: 1px solid #d97706;">String</th>
                    <th style="padding: 8px; text-align: center; border: 1px solid #d97706;">Courbes</th>
                    <th style="padding: 8px; text-align: center; border: 1px solid #d97706;">Fill Factor</th>
                    <th style="padding: 8px; text-align: center; border: 1px solid #d97706;">Voc (V)</th>
                    <th style="padding: 8px; text-align: center; border: 1px solid #d97706;">Isc (A)</th>
                    <th style="padding: 8px; text-align: center; border: 1px solid #d97706;">Pmax (W)</th>
                    <th style="padding: 8px; text-align: center; border: 1px solid #d97706;">Uf Diodes (V)</th>
                    <th style="padding: 8px; text-align: center; border: 1px solid #d97706;">Rds (Ω)</th>
                    <th style="padding: 8px; text-align: center; border: 1px solid #d97706;">Anomalies</th>
                </tr>
            </thead>
            <tbody>
                ${ivCurvesData.byString.map((s: any) => `
                <tr style="background: ${s.anomalies_count > 0 ? '#fef2f2' : '#fff'};">
                    <td style="padding: 8px; border: 1px solid #d97706; font-weight: bold;">String ${s.string_number}</td>
                    <td style="padding: 8px; border: 1px solid #d97706; text-align: center;">${s.curves_count}</td>
                    <td style="padding: 8px; border: 1px solid #d97706; text-align: center; color: ${(s.avg_fill_factor || 0) >= 0.70 ? '#16a34a' : (s.avg_fill_factor || 0) >= 0.60 ? '#d97706' : '#dc2626'}; font-weight: bold;">
                        ${s.avg_fill_factor ? (s.avg_fill_factor * 100).toFixed(1) + '%' : '-'}
                    </td>
                    <td style="padding: 8px; border: 1px solid #d97706; text-align: center;">${s.avg_voc ? s.avg_voc.toFixed(1) : '-'}</td>
                    <td style="padding: 8px; border: 1px solid #d97706; text-align: center;">${s.avg_isc ? s.avg_isc.toFixed(2) : '-'}</td>
                    <td style="padding: 8px; border: 1px solid #d97706; text-align: center;">${s.avg_pmax ? s.avg_pmax.toFixed(1) : '-'}</td>
                    <td style="padding: 8px; border: 1px solid #d97706; text-align: center; color: ${(s.avg_uf_diodes || 0) > 2 ? '#dc2626' : '#16a34a'};">
                        ${s.avg_uf_diodes ? s.avg_uf_diodes.toFixed(2) : '-'}
                    </td>
                    <td style="padding: 8px; border: 1px solid #d97706; text-align: center;">${s.avg_rds ? s.avg_rds.toFixed(3) : '-'}</td>
                    <td style="padding: 8px; border: 1px solid #d97706; text-align: center; color: ${s.anomalies_count > 0 ? '#dc2626' : '#16a34a'}; font-weight: bold;">
                        ${s.anomalies_count > 0 ? '⚠️ ' + s.anomalies_count : '✅ 0'}
                    </td>
                </tr>
                `).join('')}
            </tbody>
        </table>
        
        <div style="margin-top: 15px; padding: 10px; background: #fff7ed; border-radius: 6px; font-size: 12px; color: #78350f;">
            <strong>Légende :</strong><br>
            • <strong>Fill Factor</strong> : Rapport d'efficacité (≥70% = OK, 60-70% = Attention, &lt;60% = Critique)<br>
            • <strong>Uf Diodes</strong> : Tension diodes bypass (&lt;2V = OK, ≥2V = Diode défaillante probable)<br>
            • <strong>Rds</strong> : Résistance série dynamique (indicateur dégradation)
        </div>
    </div>
    ` : ''}

    <h2>📋 DÉTAIL DES MODULES À REMPLACER</h2>
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
                      module.defect_type === 'bypass_diode_failure' ? '⚡ Diode bypass HS' :
                      module.defect_type}
                </div>
                <div class="module-comment">${module.comment || ''}</div>
            </div>
        `).join('')}
    </div>

    <div class="footer">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px;">
            <div>
                <strong style="color: #ea580c;">DIAGNOSTIC PHOTOVOLTAÏQUE</strong><br>
                <span style="font-size: 11px;">Expertise indépendante depuis 2012</span><br>
                <span style="font-size: 10px; color: #9ca3af;">3 rue d'Apollo, 31240 L'Union • 05.81.10.16.59</span>
            </div>
            <div style="text-align: right;">
                <span style="font-size: 11px;">Rapport généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</span><br>
                <span style="font-size: 10px; color: #9ca3af;">Document confidentiel - Usage interne client</span>
            </div>
        </div>
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
// POST /api/el/audit/:token/notes - Ajouter une note (vocale ou texte)
// ============================================================================
auditsRouter.post('/:token/notes', async (c) => {
  const { env } = c
  const token = c.req.param('token')
  const { content, technicianId } = await c.req.json()

  if (!content) {
    return c.json({ error: 'Contenu note requis' }, 400)
  }

  try {
    const result = await env.DB.prepare(`
      INSERT INTO el_audit_notes (audit_token, content, technician_id)
      VALUES (?, ?, ?)
    `).bind(token, content, technicianId || null).run()

    return c.json({
      success: true,
      noteId: result.meta.last_row_id,
      message: 'Note ajoutée avec succès'
    })
  } catch (error: any) {
    console.error('Erreur ajout note:', error)
    return c.json({ 
      error: 'Erreur lors de l\'ajout de la note',
      details: error.message 
    }, 500)
  }
})

// ============================================================================
// GET /api/el/audit/:token/notes - Récupérer les notes d'un audit
// ============================================================================
auditsRouter.get('/:token/notes', async (c) => {
  const { env } = c
  const token = c.req.param('token')

  try {
    const notes = await env.DB.prepare(`
      SELECT * FROM el_audit_notes 
      WHERE audit_token = ? 
      ORDER BY created_at DESC
    `).bind(token).all()

    return c.json({
      success: true,
      notes: notes.results
    })
  } catch (error: any) {
    console.error('Erreur récupération notes:', error)
    return c.json({ 
      error: 'Erreur récupération notes',
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
