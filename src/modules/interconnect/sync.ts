// ============================================================================
// MODULE INTERCONNECT - Synchronisation automatique EL ↔ PV Carto
// ============================================================================
// Synchronise les modules et défauts entre Module EL et PV Cartography
// Sans duplication, en temps réel

import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
  KV: KVNamespace
  R2: R2Bucket
}

const syncModule = new Hono<{ Bindings: Bindings }>()

// ============================================================================
// POST /sync-audit-to-plant - Synchroniser audit EL → Centrale PV
// ============================================================================
// Crée automatiquement zones et modules dans PV Carto depuis audit EL
syncModule.post('/sync-audit-to-plant', async (c) => {
  const { env } = c
  const { auditToken } = await c.req.json()
  
  if (!auditToken) {
    return c.json({ error: 'auditToken requis' }, 400)
  }
  
  try {
    // 1. Récupérer audit EL complet
    const audit = await env.DB.prepare(`
      SELECT * FROM el_audits WHERE audit_token = ?
    `).bind(auditToken).first()
    
    if (!audit) {
      return c.json({ error: 'Audit non trouvé' }, 404)
    }
    
    // 2. Récupérer modules EL
    const modules = await env.DB.prepare(`
      SELECT * FROM el_modules 
      WHERE audit_token = ? 
      ORDER BY string_number, position_in_string
    `).bind(auditToken).all()
    
    if (!modules.results || modules.results.length === 0) {
      return c.json({ error: 'Aucun module dans cet audit' }, 400)
    }
    
    // 3. Récupérer ou créer centrale PV
    let plant = await env.DB.prepare(`
      SELECT p.* FROM pv_plants p
      JOIN intervention_plants ip ON p.id = ip.plant_id
      JOIN el_audits ea ON ea.intervention_id = ip.intervention_id
      WHERE ea.audit_token = ?
      LIMIT 1
    `).bind(auditToken).first()
    
    let plantId
    if (!plant) {
      // Créer centrale automatiquement
      const plantResult = await env.DB.prepare(`
        INSERT INTO pv_plants (plant_name, address, city, module_count)
        VALUES (?, ?, ?, ?)
      `).bind(
        audit.project_name,
        audit.location || 'À définir',
        audit.client_name || '',
        audit.total_modules
      ).run()
      
      plantId = plantResult.meta.last_row_id
      
      // Créer lien intervention → centrale
      if (audit.intervention_id) {
        await env.DB.prepare(`
          INSERT OR IGNORE INTO intervention_plants (intervention_id, plant_id, is_primary)
          VALUES (?, ?, 1)
        `).bind(audit.intervention_id, plantId).run()
      }
    } else {
      plantId = plant.id
    }
    
    // 4. Créer/Mettre à jour zones (1 zone par string)
    const stringNumbers = [...new Set(modules.results.map((m: any) => m.string_number))]
    const zoneIds: Record<number, number> = {}
    
    for (const stringNum of stringNumbers) {
      // Vérifier si zone existe déjà
      let zone = await env.DB.prepare(`
        SELECT id FROM pv_zones 
        WHERE plant_id = ? AND zone_name = ?
      `).bind(plantId, `String ${stringNum}`).first()
      
      if (!zone) {
        // Créer zone
        const zoneResult = await env.DB.prepare(`
          INSERT INTO pv_zones (
            plant_id, 
            zone_name, 
            zone_type, 
            zone_order,
            string_count,
            modules_per_string
          ) VALUES (?, ?, 'roof', ?, 1, ?)
        `).bind(
          plantId,
          `String ${stringNum}`,
          stringNum,
          modules.results.filter((m: any) => m.string_number === stringNum).length
        ).run()
        
        zoneIds[stringNum] = zoneResult.meta.last_row_id as number
      } else {
        zoneIds[stringNum] = zone.id as number
      }
    }
    
    // 5. Créer/Mettre à jour modules PV avec référence EL
    let createdCount = 0
    let updatedCount = 0
    
    for (const elModule of modules.results as any[]) {
      const zoneId = zoneIds[elModule.string_number]
      
      // Vérifier si module PV existe déjà
      const existingModule = await env.DB.prepare(`
        SELECT id FROM pv_modules 
        WHERE zone_id = ? AND module_identifier = ?
      `).bind(zoneId, elModule.module_identifier).first()
      
      if (!existingModule) {
        // Créer module PV
        await env.DB.prepare(`
          INSERT INTO pv_modules (
            zone_id,
            plant_id,
            module_identifier,
            string_number,
            position_in_string,
            physical_row,
            physical_col,
            x_position,
            y_position,
            el_module_id,
            el_audit_token,
            defect_type,
            defect_severity
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          zoneId,
          plantId,
          elModule.module_identifier,
          elModule.string_number,
          elModule.position_in_string,
          elModule.physical_row,
          elModule.physical_col,
          elModule.physical_col * 2, // Espacement 2m
          elModule.physical_row * 1, // Espacement 1m
          elModule.id,
          auditToken,
          elModule.defect_type,
          elModule.severity_level
        ).run()
        
        createdCount++
      } else {
        // Mettre à jour défauts
        await env.DB.prepare(`
          UPDATE pv_modules 
          SET defect_type = ?,
              defect_severity = ?,
              el_module_id = ?,
              el_audit_token = ?,
              updated_at = datetime('now')
          WHERE id = ?
        `).bind(
          elModule.defect_type,
          elModule.severity_level,
          elModule.id,
          auditToken,
          existingModule.id
        ).run()
        
        updatedCount++
      }
    }
    
    return c.json({
      success: true,
      plantId,
      zonesCreated: Object.keys(zoneIds).length,
      modulesCreated: createdCount,
      modulesUpdated: updatedCount,
      totalModules: modules.results.length,
      message: 'Synchronisation réussie'
    })
    
  } catch (error: any) {
    return c.json({ 
      error: 'Erreur synchronisation', 
      details: error?.message,
      stack: error?.stack?.split('\n').slice(0, 3).join('\n')
    }, 500)
  }
})

// ============================================================================
// GET /audit/:token/sync-status - Vérifier état synchronisation
// ============================================================================
syncModule.get('/audit/:token/sync-status', async (c) => {
  const { env } = c
  const token = c.req.param('token')
  
  try {
    // Compter modules EL
    const elCount = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM el_modules WHERE audit_token = ?
    `).bind(token).first()
    
    // Compter modules PV synchronisés
    const pvCount = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM pv_modules WHERE el_audit_token = ?
    `).bind(token).first()
    
    const isSynced = elCount?.count === pvCount?.count
    
    return c.json({
      auditToken: token,
      elModules: elCount?.count || 0,
      pvModules: pvCount?.count || 0,
      isSynced,
      syncRate: elCount?.count ? Math.round((pvCount?.count / elCount?.count) * 100) : 0
    })
    
  } catch (error: any) {
    return c.json({ 
      error: 'Erreur vérification sync', 
      details: error?.message 
    }, 500)
  }
})

export default syncModule
