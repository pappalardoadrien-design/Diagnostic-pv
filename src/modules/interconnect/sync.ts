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
    
    // 4. Créer/Mettre à jour zone UNIQUE pour tous les strings
    const stringNumbers = [...new Set(modules.results.map((m: any) => m.string_number))]
    const totalStrings = stringNumbers.length
    
    // Calculer modules par string (moyenne ou mode)
    const modulesPerStringArray = stringNumbers.map(sn => 
      modules.results.filter((m: any) => m.string_number === sn).length
    )
    const avgModulesPerString = Math.round(
      modulesPerStringArray.reduce((a, b) => a + b, 0) / totalStrings
    )
    
    // Vérifier si zone unique existe déjà pour cette centrale
    let zone = await env.DB.prepare(`
      SELECT id FROM pv_zones 
      WHERE plant_id = ? 
      ORDER BY id ASC 
      LIMIT 1
    `).bind(plantId).first()
    
    let zoneId: number
    
    if (!zone) {
      // Créer zone UNIQUE avec tous les strings
      const zoneResult = await env.DB.prepare(`
        INSERT INTO pv_zones (
          plant_id, 
          zone_name, 
          zone_type, 
          zone_order,
          string_count,
          modules_per_string,
          inverter_count,
          junction_box_count
        ) VALUES (?, ?, 'roof', 1, ?, ?, 1, 0)
      `).bind(
        plantId,
        audit.project_name || `Zone ${audit.client_name}`,
        totalStrings,
        avgModulesPerString
      ).run()
      
      zoneId = zoneResult.meta.last_row_id as number
    } else {
      zoneId = zone.id as number
      
      // Mettre à jour config électrique si zone existe déjà
      await env.DB.prepare(`
        UPDATE pv_zones 
        SET string_count = ?,
            modules_per_string = ?,
            updated_at = datetime('now')
        WHERE id = ?
      `).bind(totalStrings, avgModulesPerString, zoneId).run()
    }
    
    // 5. Créer/Mettre à jour modules PV avec référence EL (TOUS dans la zone unique)
    let createdCount = 0
    let updatedCount = 0
    
    for (const elModule of modules.results as any[]) {
      // TOUS les modules vont dans la zone unique (pas de zoneId par string)
      
      // Vérifier si module PV existe déjà
      const existingModule = await env.DB.prepare(`
        SELECT id FROM pv_modules 
        WHERE zone_id = ? AND module_identifier = ?
      `).bind(zoneId, elModule.module_identifier).first()
      
      if (!existingModule) {
        // Créer module PV avec données EL
        await env.DB.prepare(`
          INSERT INTO pv_modules (
            zone_id,
            module_identifier,
            string_number,
            position_in_string,
            pos_x_meters,
            pos_y_meters,
            el_defect_type,
            el_severity_level,
            el_notes,
            el_analysis_date,
            notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)
        `).bind(
          zoneId,
          elModule.module_identifier,
          elModule.string_number,
          elModule.position_in_string,
          elModule.physical_col * 2, // Espacement 2m
          elModule.physical_row * 1, // Espacement 1m
          elModule.defect_type,
          elModule.severity_level,
          elModule.comment || '',
          `Sync auto audit EL ${auditToken}`
        ).run()
        
        createdCount++
      } else {
        // Mettre à jour défauts (via notes)
        await env.DB.prepare(`
          UPDATE pv_modules 
          SET notes = ?,
              updated_at = datetime('now')
          WHERE id = ?
        `).bind(
          `EL: ${elModule.defect_type} (sévérité ${elModule.severity_level}) - ${elModule.comment || ''}`,
          existingModule.id
        ).run()
        
        updatedCount++
      }
    }
    
    return c.json({
      success: true,
      plantId,
      zoneId,
      zonesCreated: zone ? 0 : 1,  // 1 zone créée ou 0 si existait déjà
      stringCount: totalStrings,
      modulesCreated: createdCount,
      modulesUpdated: updatedCount,
      totalModules: modules.results.length,
      message: `Synchronisation réussie: ${totalStrings} strings, ${modules.results.length} modules dans 1 zone unique`
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
