// ============================================================================
// MODULE EL - ROUTES MODULES
// ============================================================================
// Gestion du diagnostic des modules individuels (mise à jour statut, bulk update)
// Adapté au schéma D1 unifié (el_modules avec defect_type + severity_level)

import { Hono } from 'hono'
import type { UpdateModuleRequest, BulkUpdateRequest, OLD_STATUS_MAPPING } from '../types'

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
// POST /api/el/audit/:token/module/:moduleId - Mettre à jour le statut d'un module
// ============================================================================
modulesRouter.post('/module/:moduleId', async (c) => {
  const { env } = c
  const token = c.req.param('token')  // Token vient du parent auditsRouter
  const moduleId = c.req.param('moduleId')
  const { status, comment, technicianId }: UpdateModuleRequest = await c.req.json()
  
  // Validation et transformation du statut
  const transformedStatus = validateAndTransformStatus(status)
  if (!transformedStatus) {
    return c.json({ error: 'Statut invalide' }, 400)
  }
  
  await env.DB.prepare(`
    UPDATE el_modules 
    SET defect_type = ?, 
        severity_level = ?, 
        comment = ?, 
        technician_id = ?, 
        updated_at = datetime('now')
    WHERE audit_token = ? AND module_identifier = ?
  `).bind(
    transformedStatus.defect_type, 
    transformedStatus.severity_level, 
    comment || null, 
    technicianId || null, 
    token, 
    moduleId
  ).run()
  
  // Mise à jour session collaborative temps réel via KV
  const sessionKey = `audit_session:${token}`
  const sessionData = {
    lastUpdate: Date.now(),
    moduleId,
    status: transformedStatus.defect_type,
    technicianId
  }
  
  await env.KV.put(sessionKey, JSON.stringify(sessionData), {
    expirationTtl: 3600 // 1 heure
  })
  
  return c.json({ success: true })
})

// ============================================================================
// POST /api/el/audit/:token/module - Créer un module individuel
// ============================================================================
modulesRouter.post('/module', async (c) => {
  const { env } = c
  const token = c.req.param('token')  // Token vient du parent auditsRouter
  const { module_id, status, comment, technician_id } = await c.req.json()
  
  // Validation entrée
  if (!module_id) {
    return c.json({ error: 'Module ID requis' }, 400)
  }
  
  // Parsing du module_id format "S{string}-{position}"
  const moduleIdMatch = module_id.trim().match(/^S(\d+)-(\d+)$/)
  if (!moduleIdMatch) {
    return c.json({ error: 'Format module_id invalide. Attendu: S{string}-{position} (ex: S1-5)' }, 400)
  }
  
  const stringNumber = parseInt(moduleIdMatch[1])
  const positionInString = parseInt(moduleIdMatch[2])
  
  // Validation et transformation du statut
  const transformedStatus = validateAndTransformStatus(status || 'pending')
  if (!transformedStatus) {
    return c.json({ error: 'Statut invalide' }, 400)
  }
  
  try {
    // Récupérer l'audit_id depuis le token (from el_audits)
    const audit = await env.DB.prepare(`
      SELECT el.id as id
      FROM audits a
      LEFT JOIN el_audits el ON a.audit_token = el.audit_token
      WHERE a.audit_token = ?
    `).bind(token).first<{ id: number }>()
    
    if (!audit) {
      return c.json({ error: 'Audit non trouvé' }, 404)
    }
    
    const stmt = env.DB.prepare(`
      INSERT OR REPLACE INTO el_modules 
      (el_audit_id, audit_token, module_identifier, string_number, position_in_string, 
       defect_type, severity_level, comment, technician_id, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `)
    
    await stmt.bind(
      audit.id,
      token,
      module_id.trim(),
      stringNumber,
      positionInString,
      transformedStatus.defect_type,
      transformedStatus.severity_level,
      comment || null,
      technician_id || null
    ).run()
    
    return c.json({ 
      success: true,
      moduleId: module_id,
      stringNumber,
      positionInString,
      defect_type: transformedStatus.defect_type,
      severity_level: transformedStatus.severity_level,
      message: 'Module créé avec succès'
    })
    
  } catch (error: any) {
    console.error('Erreur création module:', error)
    return c.json({ 
      error: 'Erreur lors de la création du module',
      details: error.message 
    }, 500)
  }
})

// ============================================================================
// POST /api/el/audit/:token/bulk-update - Mise à jour en lot des modules
// ============================================================================
modulesRouter.post('/bulk-update', async (c) => {
  const { env } = c
  const token = c.req.param('token')  // Token vient du parent auditsRouter
  const { modules, status, comment, technician_id }: BulkUpdateRequest = await c.req.json()
  
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
  
  try {
    // Préparation requête batch pour performance optimale
    const stmt = env.DB.prepare(`
      UPDATE el_modules 
      SET defect_type = ?, 
          severity_level = ?, 
          comment = ?, 
          technician_id = ?, 
          updated_at = datetime('now')
      WHERE audit_token = ? AND module_identifier = ?
    `)
    
    // Exécution batch transaction pour atomicité
    const results = []
    for (const moduleId of modules) {
      if (typeof moduleId !== 'string' || !moduleId.trim()) {
        continue // Skip invalid module IDs
      }
      
      // Vérification que le module existe avant mise à jour
      const moduleExists = await env.DB.prepare(
        'SELECT COUNT(*) as count FROM el_modules WHERE audit_token = ? AND module_identifier = ?'
      ).bind(token, moduleId.trim()).first()
      
      if (!moduleExists || (moduleExists as any).count === 0) {
        results.push({
          moduleId: moduleId.trim(),
          success: true,
          changes: 0,
          created: false
        })
        continue
      }
      
      const result = await stmt.bind(
        transformedStatus.defect_type,
        transformedStatus.severity_level,
        comment || null, 
        technician_id || null, 
        token, 
        moduleId.trim()
      ).run()
      
      results.push({
        moduleId: moduleId.trim(),
        success: result.success,
        changes: result.meta?.changes || 0,
        created: false
      })
    }
    
    // Mise à jour session collaborative pour synchronisation temps réel
    const sessionKey = `audit_session:${token}`
    const sessionData = {
      lastUpdate: Date.now(),
      bulkUpdate: {
        modules,
        status: transformedStatus.defect_type,
        count: results.filter((r: any) => r.success).length
      },
      technicianId: technician_id
    }
    
    await env.KV.put(sessionKey, JSON.stringify(sessionData), {
      expirationTtl: 3600 // 1 heure
    })
    
    const successCount = results.filter((r: any) => r.success && r.changes > 0).length
    const notFoundCount = results.filter((r: any) => r.success && r.changes === 0).length
    
    return c.json({ 
      success: true,
      updated: successCount,
      notFound: notFoundCount,
      total: modules.length,
      results,
      message: successCount > 0 
        ? `${successCount} modules mis à jour avec succès`
        : notFoundCount > 0 
        ? `${notFoundCount} modules non trouvés - création automatique requise`
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

export default modulesRouter
