// ============================================================================
// MODULE SYNC REVERSE - Synchronisation PV Carto → EL
// ============================================================================
// Crée audit EL depuis modélisation PV Carto existante
// Permet workflow : Calepinage PV d'abord, puis audit terrain EL

import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
  KV: KVNamespace
  R2: R2Bucket
}

const syncReverseModule = new Hono<{ Bindings: Bindings }>()

// ============================================================================
// POST /create-audit-from-plant - Créer audit EL depuis centrale PV
// ============================================================================
// Importe automatiquement la structure (zones, modules) depuis PV Carto
syncReverseModule.post('/create-audit-from-plant', async (c) => {
  const { env } = c
  const { 
    plantId, 
    projectName, 
    clientName, 
    location,
    interventionId 
  } = await c.req.json()
  
  if (!plantId) {
    return c.json({ error: 'plantId requis' }, 400)
  }
  
  try {
    // 1. Récupérer centrale PV
    const plant = await env.DB.prepare(`
      SELECT * FROM pv_plants WHERE id = ?
    `).bind(plantId).first()
    
    if (!plant) {
      return c.json({ error: 'Centrale non trouvée' }, 404)
    }
    
    // 2. Récupérer zones et compter modules
    const zones = await env.DB.prepare(`
      SELECT z.*, COUNT(pm.id) as module_count
      FROM pv_zones z
      LEFT JOIN pv_modules pm ON z.id = pm.zone_id
      WHERE z.plant_id = ?
      GROUP BY z.id
      ORDER BY z.zone_order
    `).bind(plantId).all()
    
    if (!zones.results || zones.results.length === 0) {
      return c.json({ error: 'Aucune zone dans cette centrale' }, 400)
    }
    
    // 3. Récupérer tous modules PV
    const modules = await env.DB.prepare(`
      SELECT pm.*, z.zone_name
      FROM pv_modules pm
      JOIN pv_zones z ON pm.zone_id = z.id
      WHERE z.plant_id = ?
      ORDER BY pm.string_number, pm.position_in_string
    `).bind(plantId).all()
    
    if (!modules.results || modules.results.length === 0) {
      return c.json({ error: 'Aucun module dans cette centrale' }, 400)
    }
    
    const totalModules = modules.results.length
    
    // Calculer strings (par zone)
    const stringNumbers = [...new Set(modules.results.map((m: any) => m.string_number))]
    const stringCount = stringNumbers.length
    
    // Calculer modules par string (moyenne)
    const modulesPerString = Math.round(totalModules / stringCount)
    
    // 4. Créer intervention si fournie (sinon null - compatible)
    // NOTE: Création intervention désactivée temporairement
    // car schéma interventions nécessite project_id + technician_id
    // L'audit EL peut exister sans intervention (intervention_id nullable)
    let finalInterventionId = interventionId || null
    
    // 5. Créer audit EL
    const auditToken = crypto.randomUUID()
    
    const auditResult = await env.DB.prepare(`
      INSERT INTO el_audits (
        intervention_id,
        audit_token,
        project_name,
        client_name,
        location,
        string_count,
        modules_per_string,
        total_modules,
        status,
        configuration_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'created', ?)
    `).bind(
      finalInterventionId,
      auditToken,
      projectName || plant.plant_name,
      clientName || 'Client',
      location || plant.address || 'À définir',
      stringCount,
      modulesPerString,
      totalModules,
      JSON.stringify({
        mode: 'imported_from_pv',
        plantId,
        stringCount,
        modulesPerString,
        totalModules
      })
    ).run()
    
    const auditId = auditResult.meta.last_row_id
    
    // 6. Créer modules EL depuis modules PV
    let createdCount = 0
    
    for (const pvModule of modules.results as any[]) {
      // Calculer position physique depuis position en mètres
      const physicalRow = Math.round(pvModule.pos_y_meters)
      const physicalCol = Math.round(pvModule.pos_x_meters / 2)
      
      // Importer défaut EL existant ou mettre en pending
      const defectType = pvModule.el_defect_type || 'pending'
      const severityLevel = pvModule.el_severity_level || 0
      const comment = pvModule.el_notes || pvModule.notes || null
      
      await env.DB.prepare(`
        INSERT INTO el_modules (
          el_audit_id,
          audit_token,
          module_identifier,
          string_number,
          position_in_string,
          defect_type,
          severity_level,
          comment,
          physical_row,
          physical_col
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        auditId,
        auditToken,
        pvModule.module_identifier,
        pvModule.string_number,
        pvModule.position_in_string,
        defectType,
        severityLevel,
        comment,
        physicalRow,
        physicalCol
      ).run()
      
      createdCount++
    }
    
    // 7. Créer liaison directe audit EL ↔ centrale PV
    // Table el_audit_plants pour navigation bidirectionnelle sans dépendre d'interventions
    await env.DB.prepare(`
      INSERT OR IGNORE INTO el_audit_plants (el_audit_id, audit_token, plant_id)
      VALUES (?, ?, ?)
    `).bind(auditId, auditToken, plantId).run()
    
    return c.json({
      success: true,
      auditToken,
      auditId,
      interventionId: finalInterventionId,
      plantId,
      modulesCreated: createdCount,
      stringCount,
      totalModules,
      message: 'Audit EL créé depuis centrale PV',
      auditUrl: `/audit/${auditToken}`
    })
    
  } catch (error: any) {
    return c.json({ 
      error: 'Erreur création audit depuis PV', 
      details: error?.message,
      stack: error?.stack?.split('\n').slice(0, 3).join('\n')
    }, 500)
  }
})

// ============================================================================
// GET /plant/:plantId/can-create-audit - Vérifier si centrale peut créer audit
// ============================================================================
syncReverseModule.get('/plant/:plantId/can-create-audit', async (c) => {
  const { env } = c
  const plantId = parseInt(c.req.param('plantId'))
  
  try {
    // Compter zones et modules
    const stats = await env.DB.prepare(`
      SELECT 
        COUNT(DISTINCT z.id) as zone_count,
        COUNT(pm.id) as module_count
      FROM pv_zones z
      LEFT JOIN pv_modules pm ON z.id = pm.zone_id
      WHERE z.plant_id = ?
    `).bind(plantId).first()
    
    const canCreate = stats && stats.module_count > 0
    
    return c.json({
      canCreate,
      zoneCount: stats?.zone_count || 0,
      moduleCount: stats?.module_count || 0,
      message: canCreate ? 
        'Centrale prête pour création audit EL' : 
        'Centrale sans modules : modélisez d\'abord la centrale'
    })
    
  } catch (error: any) {
    return c.json({ 
      error: 'Erreur vérification', 
      details: error?.message 
    }, 500)
  }
})

export default syncReverseModule
