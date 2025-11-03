// ============================================================================
// MODULE EL - ROUTES MODULES (REFACTORISÉ)
// ============================================================================
// ✅ UTILISE pv_modules (table unifiée) au lieu de el_modules
// ✅ Synchronisation automatique module_status (critical si severity >= 3)
// ✅ Interconnexion Canvas V2 ↔ Module EL via zone_id

import { Hono } from 'hono'
import type { UpdateModuleRequest, BulkUpdateRequest } from '../types'

type Bindings = {
  DB: D1Database
  KV: KVNamespace
  R2: R2Bucket
}

const modulesRouter = new Hono<{ Bindings: Bindings }>()

/**
 * Mapping ancien statut → nouveau schéma (defect_type + severity_level)
 * Permet rétrocompatibilité avec l'ancien frontend
 */
const OLD_TO_NEW_STATUS: Record<string, { defect_type: string; severity_level: number }> = {
  'ok': { defect_type: 'none', severity_level: 0 },
  'pending': { defect_type: 'pending', severity_level: 0 },
  'inequality': { defect_type: 'luminescence_inequality', severity_level: 1 },
  'microcracks': { defect_type: 'microcrack', severity_level: 2 },
  'dead': { defect_type: 'dead_module', severity_level: 3 },
  'string_open': { defect_type: 'string_open', severity_level: 2 },
  'not_connected': { defect_type: 'not_connected', severity_level: 2 }
}

/**
 * Calculer module_status basé sur el_defect_type (utilise contrainte CHECK existante)
 * Valeurs autorisées: 'ok', 'inequality', 'microcracks', 'dead', 'string_open', 'not_connected', 'pending'
 */
function calculateModuleStatus(defectType: string): string {
  const statusMap: Record<string, string> = {
    'none': 'ok',
    'pending': 'pending',
    'luminescence_inequality': 'inequality',
    'microcrack': 'microcracks',
    'dead_module': 'dead',
    'string_open': 'string_open',
    'not_connected': 'not_connected',
    'bypass_diode_failure': 'microcracks' // Traité comme microcracks
  }
  return statusMap[defectType] || 'pending'
}

/**
 * Valider et transformer le statut d'entrée (ancien format → nouveau format)
 */
function validateAndTransformStatus(status: string): { defect_type: string; severity_level: number } | null {
  // Si c'est un ancien statut, on le transforme
  if (OLD_TO_NEW_STATUS[status]) {
    return OLD_TO_NEW_STATUS[status]
  }
  
  // Si c'est déjà un nouveau defect_type, on retourne avec severity par défaut
  const validDefectTypes = ['none', 'pending', 'microcrack', 'dead_module', 'luminescence_inequality', 'string_open', 'bypass_diode_failure', 'not_connected']
  if (validDefectTypes.includes(status)) {
    // Déterminer severity_level basé sur defect_type
    const severityMap: Record<string, number> = {
      'none': 0,
      'pending': 0,
      'luminescence_inequality': 1,
      'microcrack': 2,
      'string_open': 2,
      'not_connected': 2,
      'bypass_diode_failure': 2,
      'dead_module': 3
    }
    return {
      defect_type: status,
      severity_level: severityMap[status] || 0
    }
  }
  
  return null
}

// ============================================================================
// POST /api/el/zone/:zoneId/module/:moduleId - Mettre à jour le statut d'un module
// ============================================================================
modulesRouter.post('/module/:moduleId', async (c) => {
  const { env } = c
  const zoneId = parseInt(c.req.param('zoneId') || '0')  // zoneId vient du parent route
  const moduleId = c.req.param('moduleId')
  const { status, comment, technicianId, photoUrl }: UpdateModuleRequest & { photoUrl?: string } = await c.req.json()
  
  if (!zoneId) {
    return c.json({ error: 'Zone ID requis' }, 400)
  }
  
  // Validation et transformation du statut
  const transformedStatus = validateAndTransformStatus(status)
  if (!transformedStatus) {
    return c.json({ error: 'Statut invalide' }, 400)
  }
  
  // Calculer module_status automatiquement (basé sur defect_type)
  const moduleStatus = calculateModuleStatus(transformedStatus.defect_type)
  
  try {
    // ✅ NOUVEAU: UPDATE pv_modules (table unifiée) avec colonnes el_*
    await env.DB.prepare(`
      UPDATE pv_modules 
      SET el_defect_type = ?, 
          el_severity_level = ?, 
          el_notes = ?, 
          el_photo_url = ?,
          el_technician_id = ?,
          el_analysis_date = datetime('now'),
          module_status = ?,
          updated_at = datetime('now')
      WHERE zone_id = ? AND module_identifier = ?
    `).bind(
      transformedStatus.defect_type, 
      transformedStatus.severity_level, 
      comment || null,
      photoUrl || null,
      technicianId || null,
      moduleStatus,
      zoneId,
      moduleId
    ).run()
    
    // Mise à jour session collaborative temps réel via KV
    const sessionKey = `zone_session:${zoneId}`
    const sessionData = {
      lastUpdate: Date.now(),
      moduleId,
      status: transformedStatus.defect_type,
      severity: transformedStatus.severity_level,
      technicianId
    }
    
    await env.KV.put(sessionKey, JSON.stringify(sessionData), {
      expirationTtl: 3600 // 1 heure
    })
    
    return c.json({ 
      success: true,
      module_status: moduleStatus
    })
    
  } catch (error: any) {
    console.error('Erreur mise à jour module:', error)
    return c.json({ 
      error: 'Erreur mise à jour module',
      details: error.message 
    }, 500)
  }
})

// ============================================================================
// POST /api/el/zone/:zoneId/module - Créer un module individuel
// ============================================================================
// NOTE: Normalement les modules sont créés par Canvas V2
// Cette route est conservée pour compatibilité mais devrait rarement être utilisée
modulesRouter.post('/module', async (c) => {
  const { env } = c
  const zoneId = parseInt(c.req.param('zoneId') || '0')
  const { module_id, status, comment, technician_id, photo_url } = await c.req.json()
  
  if (!zoneId) {
    return c.json({ error: 'Zone ID requis' }, 400)
  }
  
  // Validation entrée
  if (!module_id) {
    return c.json({ error: 'Module ID requis' }, 400)
  }
  
  // Parsing du module_id format "S{string}-{position}"
  const moduleIdMatch = module_id.trim().match(/^S(\d+)-P?(\d+)$/)
  if (!moduleIdMatch) {
    return c.json({ error: 'Format module_id invalide. Attendu: S{string}-P{position} (ex: S1-P05)' }, 400)
  }
  
  const stringNumber = parseInt(moduleIdMatch[1])
  const positionInString = parseInt(moduleIdMatch[2])
  
  // Validation et transformation du statut
  const transformedStatus = validateAndTransformStatus(status || 'pending')
  if (!transformedStatus) {
    return c.json({ error: 'Statut invalide' }, 400)
  }
  
  const moduleStatus = calculateModuleStatus(transformedStatus.defect_type)
  
  try {
    // Vérifier si module existe déjà
    const existingModule = await env.DB.prepare(`
      SELECT id FROM pv_modules WHERE zone_id = ? AND module_identifier = ?
    `).bind(zoneId, module_id.trim()).first()
    
    if (existingModule) {
      // UPDATE si existe
      await env.DB.prepare(`
        UPDATE pv_modules 
        SET el_defect_type = ?, 
            el_severity_level = ?, 
            el_notes = ?,
            el_photo_url = ?,
            el_technician_id = ?,
            el_analysis_date = datetime('now'),
            module_status = ?,
            updated_at = datetime('now')
        WHERE zone_id = ? AND module_identifier = ?
      `).bind(
        transformedStatus.defect_type,
        transformedStatus.severity_level,
        comment || null,
        photo_url || null,
        technician_id || null,
        moduleStatus,
        zoneId,
        module_id.trim()
      ).run()
    } else {
      // INSERT si n'existe pas (cas rare)
      await env.DB.prepare(`
        INSERT INTO pv_modules 
        (zone_id, module_identifier, string_number, position_in_string,
         pos_x_meters, pos_y_meters, latitude, longitude,
         el_defect_type, el_severity_level, el_notes, el_photo_url, el_technician_id,
         el_analysis_date, module_status, created_at, updated_at)
        VALUES (?, ?, ?, ?, 0, 0, NULL, NULL, ?, ?, ?, ?, ?, datetime('now'), ?, datetime('now'), datetime('now'))
      `).bind(
        zoneId,
        module_id.trim(),
        stringNumber,
        positionInString,
        transformedStatus.defect_type,
        transformedStatus.severity_level,
        comment || null,
        photo_url || null,
        technician_id || null,
        moduleStatus
      ).run()
    }
    
    return c.json({ 
      success: true,
      moduleId: module_id,
      stringNumber,
      positionInString,
      defect_type: transformedStatus.defect_type,
      severity_level: transformedStatus.severity_level,
      module_status: moduleStatus,
      message: existingModule ? 'Module mis à jour' : 'Module créé'
    })
    
  } catch (error: any) {
    console.error('Erreur création/mise à jour module:', error)
    return c.json({ 
      error: 'Erreur lors de la création/mise à jour du module',
      details: error.message 
    }, 500)
  }
})

// ============================================================================
// POST /api/el/zone/:zoneId/bulk-update - Mise à jour en lot des modules
// ============================================================================
modulesRouter.post('/bulk-update', async (c) => {
  const { env } = c
  const zoneId = parseInt(c.req.param('zoneId') || '0')
  const { modules, status, comment, technician_id, photo_url }: BulkUpdateRequest & { photo_url?: string } = await c.req.json()
  
  if (!zoneId) {
    return c.json({ error: 'Zone ID requis' }, 400)
  }
  
  // Validation entrée
  if (!modules || !Array.isArray(modules) || modules.length === 0) {
    return c.json({ error: 'Liste de modules requise' }, 400)
  }
  
  if (modules.length > 100) {
    return c.json({ error: 'Maximum 100 modules par lot' }, 400)
  }
  
  // Validation et transformation du statut
  const transformedStatus = validateAndTransformStatus(status)
  if (!transformedStatus) {
    return c.json({ error: 'Statut invalide' }, 400)
  }
  
  const moduleStatus = calculateModuleStatus(transformedStatus.defect_type)
  
  try {
    // ✅ NOUVEAU: UPDATE pv_modules (batch)
    const stmt = env.DB.prepare(`
      UPDATE pv_modules 
      SET el_defect_type = ?, 
          el_severity_level = ?, 
          el_notes = ?, 
          el_photo_url = ?,
          el_technician_id = ?,
          el_analysis_date = datetime('now'),
          module_status = ?,
          updated_at = datetime('now')
      WHERE zone_id = ? AND module_identifier = ?
    `)
    
    // Exécution batch transaction pour atomicité
    const results = []
    for (const moduleId of modules) {
      if (typeof moduleId !== 'string' || !moduleId.trim()) {
        continue // Skip invalid module IDs
      }
      
      // Vérification que le module existe
      const moduleExists = await env.DB.prepare(
        'SELECT COUNT(*) as count FROM pv_modules WHERE zone_id = ? AND module_identifier = ?'
      ).bind(zoneId, moduleId.trim()).first()
      
      if (!moduleExists || (moduleExists as any).count === 0) {
        results.push({
          moduleId: moduleId.trim(),
          success: false,
          changes: 0,
          error: 'Module non trouvé'
        })
        continue
      }
      
      const result = await stmt.bind(
        transformedStatus.defect_type,
        transformedStatus.severity_level,
        comment || null,
        photo_url || null,
        technician_id || null,
        moduleStatus,
        zoneId,
        moduleId.trim()
      ).run()
      
      results.push({
        moduleId: moduleId.trim(),
        success: result.success,
        changes: result.meta?.changes || 0
      })
    }
    
    // Mise à jour session collaborative pour synchronisation temps réel
    const sessionKey = `zone_session:${zoneId}`
    const sessionData = {
      lastUpdate: Date.now(),
      bulkUpdate: {
        modules,
        status: transformedStatus.defect_type,
        severity: transformedStatus.severity_level,
        count: results.filter((r: any) => r.success).length
      },
      technicianId: technician_id
    }
    
    await env.KV.put(sessionKey, JSON.stringify(sessionData), {
      expirationTtl: 3600 // 1 heure
    })
    
    const successCount = results.filter((r: any) => r.success && r.changes > 0).length
    const notFoundCount = results.filter((r: any) => !r.success).length
    
    return c.json({ 
      success: true,
      updated: successCount,
      notFound: notFoundCount,
      total: modules.length,
      results,
      message: successCount > 0 
        ? `${successCount} modules mis à jour avec succès`
        : notFoundCount > 0 
        ? `${notFoundCount} modules non trouvés`
        : 'Aucun module traité'
    })
    
  } catch (error: any) {
    console.error('Erreur bulk update:', error)
    return c.json({ 
      error: 'Erreur lors de la mise à jour en lot',
      details: error.message 
    }, 500)
  }
})

// ============================================================================
// GET /api/el/zone/:zoneId/modules - Récupérer tous les modules d'une zone
// ============================================================================
modulesRouter.get('/modules', async (c) => {
  const { env } = c
  const zoneId = parseInt(c.req.param('zoneId') || '0')
  
  if (!zoneId) {
    return c.json({ error: 'Zone ID requis' }, 400)
  }
  
  try {
    const modules = await env.DB.prepare(`
      SELECT 
        id,
        module_identifier,
        string_number,
        position_in_string,
        latitude,
        longitude,
        module_status,
        el_defect_type,
        el_severity_level,
        el_notes,
        el_photo_url,
        el_technician_id,
        el_analysis_date,
        power_wp,
        created_at,
        updated_at
      FROM pv_modules
      WHERE zone_id = ?
      ORDER BY string_number, position_in_string
    `).bind(zoneId).all()
    
    return c.json({
      success: true,
      modules: modules.results || [],
      count: modules.results?.length || 0
    })
    
  } catch (error: any) {
    console.error('Erreur récupération modules:', error)
    return c.json({
      error: 'Erreur récupération modules',
      details: error.message
    }, 500)
  }
})

export default modulesRouter
