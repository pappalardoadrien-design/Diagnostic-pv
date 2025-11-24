import { Hono } from 'hono'
import type { Context } from 'hono'

type Bindings = {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Bindings }>()

// ========================================================================
// API PV PLANTS
// ========================================================================

// Lister toutes les centrales PV
app.get('/api/pv/plants', async (c: Context<{ Bindings: Bindings }>) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT 
        p.*,
        COUNT(DISTINCT z.id) as zone_count,
        COUNT(DISTINCT m.id) as module_count,
        SUM(m.power_wp) as total_power_wp
      FROM pv_plants p
      LEFT JOIN pv_zones z ON z.plant_id = p.id
      LEFT JOIN pv_modules m ON m.zone_id = z.id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `).all()
    
    return c.json({ success: true, plants: results })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Créer une nouvelle centrale PV
app.post('/api/pv/plants', async (c: Context<{ Bindings: Bindings }>) => {
  try {
    const body = await c.req.json()
    const { plant_name, plant_type, address, city, postal_code, latitude, longitude, total_power_kwp, module_count } = body
    
    const result = await c.env.DB.prepare(`
      INSERT INTO pv_plants (
        plant_name, plant_type, address, city, postal_code, 
        latitude, longitude, total_power_kwp, module_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      plant_name,
      plant_type || 'rooftop',
      address || null,
      city || null,
      postal_code || null,
      latitude || null,
      longitude || null,
      total_power_kwp || 0,
      module_count || 0
    ).run()
    
    return c.json({ 
      success: true, 
      plant: { 
        id: result.meta.last_row_id,
        plant_name,
        plant_type
      }
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Obtenir détails d'une centrale PV
app.get('/api/pv/plants/:id', async (c: Context<{ Bindings: Bindings }>) => {
  try {
    const plantId = c.req.param('id')
    
    const plant = await c.env.DB.prepare(`
      SELECT * FROM pv_plants WHERE id = ?
    `).bind(plantId).first()
    
    if (!plant) {
      return c.json({ success: false, error: 'Centrale non trouvée' }, 404)
    }
    
    const { results: zones } = await c.env.DB.prepare(`
      SELECT 
        z.*,
        COUNT(m.id) as module_count,
        SUM(m.power_wp) as total_power_wp,
        a.project_name as audit_project_name,
        a.client_name as audit_client_name,
        a.status as audit_status,
        a.modules_enabled as audit_modules_enabled
      FROM pv_zones z
      LEFT JOIN pv_modules m ON m.zone_id = z.id
      LEFT JOIN audits a ON a.audit_token = z.audit_token
      WHERE z.plant_id = ?
      GROUP BY z.id
      ORDER BY z.zone_order ASC
    `).bind(plantId).all()
    
    return c.json({ success: true, plant, zones })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Supprimer une centrale PV
app.delete('/api/pv/plants/:id', async (c: Context<{ Bindings: Bindings }>) => {
  try {
    const plantId = c.req.param('id')
    
    // Supprimer modules, zones, puis centrale
    await c.env.DB.prepare(`
      DELETE FROM pv_modules WHERE zone_id IN (
        SELECT id FROM pv_zones WHERE plant_id = ?
      )
    `).bind(plantId).run()
    
    await c.env.DB.prepare(`
      DELETE FROM pv_zones WHERE plant_id = ?
    `).bind(plantId).run()
    
    await c.env.DB.prepare(`
      DELETE FROM pv_plants WHERE id = ?
    `).bind(plantId).run()
    
    return c.json({ success: true })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ========================================================================
// API PV ZONES
// ========================================================================

// Créer une nouvelle zone
app.post('/api/pv/plants/:plantId/zones', async (c: Context<{ Bindings: Bindings }>) => {
  try {
    const plantId = c.req.param('plantId')
    const body = await c.req.json()
    const { zone_name, zone_type, azimuth, tilt, width_meters, height_meters, audit_token, sync_status } = body
    
    const result = await c.env.DB.prepare(`
      INSERT INTO pv_zones (
        plant_id, zone_name, zone_type, azimuth, tilt, width_meters, height_meters, 
        audit_token, sync_status, sync_direction
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      plantId,
      zone_name,
      zone_type || 'roof',
      azimuth || 180,
      tilt || 30,
      width_meters || 50,
      height_meters || 30,
      audit_token || null,
      sync_status || 'manual',
      'bidirectional'
    ).run()
    
    return c.json({ 
      success: true, 
      zone: { 
        id: result.meta.last_row_id,
        zone_name
      }
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Obtenir détails d'une zone
app.get('/api/pv/plants/:plantId/zones/:zoneId', async (c: Context<{ Bindings: Bindings }>) => {
  try {
    const zoneId = c.req.param('zoneId')
    
    const zone = await c.env.DB.prepare(`
      SELECT 
        z.*,
        a.project_name as audit_project_name,
        a.client_name as audit_client_name,
        a.location as audit_location,
        a.status as audit_status,
        a.modules_enabled as audit_modules_enabled
      FROM pv_zones z
      LEFT JOIN audits a ON a.audit_token = z.audit_token
      WHERE z.id = ?
    `).bind(zoneId).first()
    
    if (!zone) {
      return c.json({ success: false, error: 'Zone non trouvée' }, 404)
    }
    
    return c.json({ success: true, zone })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Mettre à jour image de fond zone
app.put('/api/pv/plants/:plantId/zones/:zoneId/background', async (c: Context<{ Bindings: Bindings }>) => {
  try {
    const zoneId = c.req.param('zoneId')
    const body = await c.req.json()
    const { image_url, image_type, width_meters, height_meters } = body
    
    await c.env.DB.prepare(`
      UPDATE pv_zones 
      SET background_image_url = ?,
          background_image_type = ?,
          width_meters = ?,
          height_meters = ?
      WHERE id = ?
    `).bind(
      image_url,
      image_type || 'upload',
      width_meters || 50,
      height_meters || 30,
      zoneId
    ).run()
    
    return c.json({ success: true })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Lier une zone PV à un audit
app.put('/api/pv/plants/:plantId/zones/:zoneId/link-audit', async (c: Context<{ Bindings: Bindings }>) => {
  try {
    const zoneId = c.req.param('zoneId')
    const body = await c.req.json()
    const { audit_token, sync_status, sync_direction } = body
    
    if (!audit_token) {
      return c.json({ success: false, error: 'audit_token requis' }, 400)
    }
    
    // Vérifier que l'audit existe
    const audit = await c.env.DB.prepare(`
      SELECT id, project_name, client_name FROM audits WHERE audit_token = ?
    `).bind(audit_token).first()
    
    if (!audit) {
      return c.json({ success: false, error: 'Audit non trouvé' }, 404)
    }
    
    // Mettre à jour zone
    await c.env.DB.prepare(`
      UPDATE pv_zones 
      SET audit_token = ?,
          audit_id = ?,
          sync_status = ?,
          sync_direction = ?,
          last_sync_at = datetime('now')
      WHERE id = ?
    `).bind(
      audit_token,
      (audit as any).id,
      sync_status || 'synced',
      sync_direction || 'bidirectional',
      zoneId
    ).run()
    
    // Mettre à jour audit (lien inverse)
    const zone = await c.env.DB.prepare(`
      SELECT plant_id FROM pv_zones WHERE id = ?
    `).bind(zoneId).first()
    
    await c.env.DB.prepare(`
      UPDATE audits
      SET pv_zone_id = ?,
          pv_plant_id = ?
      WHERE audit_token = ?
    `).bind(zoneId, (zone as any)?.plant_id, audit_token).run()
    
    return c.json({ 
      success: true,
      message: `Zone liée à l'audit "${(audit as any).project_name}"`,
      audit_info: {
        project_name: (audit as any).project_name,
        client_name: (audit as any).client_name
      }
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Supprimer une zone
app.delete('/api/pv/plants/:plantId/zones/:zoneId', async (c: Context<{ Bindings: Bindings }>) => {
  try {
    const zoneId = c.req.param('zoneId')
    
    // Supprimer modules puis zone
    await c.env.DB.prepare(`
      DELETE FROM pv_modules WHERE zone_id = ?
    `).bind(zoneId).run()
    
    await c.env.DB.prepare(`
      DELETE FROM pv_zones WHERE id = ?
    `).bind(zoneId).run()
    
    return c.json({ success: true })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ========================================================================
// API PV MODULES
// ========================================================================

// Lister modules d'une zone
app.get('/api/pv/plants/:plantId/zones/:zoneId/modules', async (c: Context<{ Bindings: Bindings }>) => {
  try {
    const zoneId = c.req.param('zoneId')
    
    const { results: modules } = await c.env.DB.prepare(`
      SELECT * FROM pv_modules 
      WHERE zone_id = ?
      ORDER BY string_number ASC, position_in_string ASC
    `).bind(zoneId).all()
    
    return c.json({ success: true, modules })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Créer modules en batch
app.post('/api/pv/plants/:plantId/zones/:zoneId/modules', async (c: Context<{ Bindings: Bindings }>) => {
  try {
    const zoneId = c.req.param('zoneId')
    const body = await c.req.json()
    const { modules } = body
    
    if (!modules || modules.length === 0) {
      return c.json({ success: false, error: 'Aucun module fourni' }, 400)
    }
    
    let added = 0
    for (const mod of modules) {
      await c.env.DB.prepare(`
        INSERT INTO pv_modules (
          zone_id, module_identifier, string_number, position_in_string,
          pos_x_meters, pos_y_meters, width_meters, height_meters,
          rotation, power_wp, module_status, status_comment
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        zoneId,
        mod.module_identifier,
        mod.string_number || 1,
        mod.position_in_string || 1,
        mod.pos_x_meters || 0,
        mod.pos_y_meters || 0,
        mod.width_meters || 1.7,
        mod.height_meters || 1.0,
        mod.rotation || 0,
        mod.power_wp || 450,
        mod.module_status || 'pending',
        mod.status_comment || null
      ).run()
      added++
    }
    
    return c.json({ success: true, added })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Supprimer tous les modules d'une zone
app.delete('/api/pv/plants/:plantId/zones/:zoneId/modules', async (c: Context<{ Bindings: Bindings }>) => {
  try {
    const zoneId = c.req.param('zoneId')
    
    await c.env.DB.prepare(`
      DELETE FROM pv_modules WHERE zone_id = ?
    `).bind(zoneId).run()
    
    return c.json({ success: true })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ========================================================================
// ROUTE SPÉCIALE: Créer zone PV depuis audit EL
// ========================================================================

// Créer automatiquement zone PV depuis audit EL
app.post('/api/pv/zones/from-audit/:auditToken', async (c: Context<{ Bindings: Bindings }>) => {
  try {
    const auditToken = c.req.param('auditToken')
    
    // Récupérer audit EL avec infos complètes
    const audit = await c.env.DB.prepare(`
      SELECT 
        a.*,
        ea.total_modules,
        ea.string_count,
        c.company_name as client_name,
        p.name as project_name,
        p.id as project_id,
        p.site_address
      FROM audits a
      LEFT JOIN el_audits ea ON ea.audit_token = a.audit_token
      LEFT JOIN projects p ON p.id = a.project_id
      LEFT JOIN crm_clients c ON c.id = a.client_id
      WHERE a.audit_token = ?
    `).bind(auditToken).first()
    
    if (!audit) {
      return c.json({ success: false, error: 'Audit non trouvé' }, 404)
    }
    
    const auditData = audit as any
    
    // Créer ou récupérer centrale PV pour ce projet
    let plant = await c.env.DB.prepare(`
      SELECT id FROM pv_plants WHERE plant_name = ?
    `).bind(auditData.project_name || 'Centrale sans nom').first()
    
    let plantId
    if (!plant) {
      // Créer nouvelle centrale
      const plantResult = await c.env.DB.prepare(`
        INSERT INTO pv_plants (
          plant_name, plant_type, address, city, module_count, notes
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        auditData.project_name || 'Centrale sans nom',
        'rooftop',
        auditData.site_address || auditData.location,
        null,
        auditData.total_modules || 0,
        `Centrale créée automatiquement depuis audit EL ${auditToken}`
      ).run()
      plantId = plantResult.meta.last_row_id
    } else {
      plantId = (plant as any).id
    }
    
    // Créer zone liée à l'audit
    const zoneResult = await c.env.DB.prepare(`
      INSERT INTO pv_zones (
        plant_id, zone_name, zone_type,
        audit_token, audit_id, sync_status, sync_direction,
        string_count, modules_per_string
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      plantId,
      auditData.project_name || 'Zone principale',
      'roof',
      auditToken,
      auditData.id,
      'auto',
      'audit_to_pv',
      auditData.string_count || 0,
      auditData.total_modules && auditData.string_count 
        ? Math.ceil(auditData.total_modules / auditData.string_count)
        : 0
    ).run()
    
    const zoneId = zoneResult.meta.last_row_id
    
    // Mettre à jour audit (lien inverse)
    await c.env.DB.prepare(`
      UPDATE audits
      SET pv_zone_id = ?,
          pv_plant_id = ?
      WHERE audit_token = ?
    `).bind(zoneId, plantId, auditToken).run()
    
    return c.json({
      success: true,
      message: 'Zone PV créée et liée à l\'audit',
      plant_id: plantId,
      zone_id: zoneId,
      editor_url: `/pv/plant/${plantId}/zone/${zoneId}/editor`,
      audit_token: auditToken
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Synchroniser modules EL → PV (copie états des modules EL vers PV)
app.post('/api/pv/zones/:zoneId/sync-from-el', async (c: Context<{ Bindings: Bindings }>) => {
  try {
    const zoneId = c.req.param('zoneId')
    
    // Récupérer zone avec audit_token
    const zone = await c.env.DB.prepare(`
      SELECT * FROM pv_zones WHERE id = ?
    `).bind(zoneId).first() as any
    
    if (!zone || !zone.audit_token) {
      return c.json({ success: false, error: 'Zone PV non liée à un audit' }, 400)
    }
    
    // Récupérer modules EL
    const { results: elModules } = await c.env.DB.prepare(`
      SELECT 
        id,
        module_identifier,
        string_number,
        position_in_string,
        defect_type,
        severity_level,
        comment as notes
      FROM el_modules
      WHERE audit_token = ?
      ORDER BY string_number, position_in_string
    `).bind(zone.audit_token).all()
    
    if (!elModules || elModules.length === 0) {
      return c.json({ success: false, error: 'Aucun module EL trouvé pour cet audit' }, 404)
    }
    
    // Supprimer modules PV existants
    await c.env.DB.prepare(`
      DELETE FROM pv_modules WHERE zone_id = ?
    `).bind(zoneId).run()
    
    // Créer modules PV avec états EL
    let syncedCount = 0
    for (const el of elModules) {
      const elMod = el as any
      
      // Mapper defect_type EL → module_status PV
      let pvStatus = 'ok'
      if (elMod.defect_type === 'microcracks' || elMod.defect_type === 'pid') {
        pvStatus = 'warning'
      } else if (elMod.defect_type === 'dead_cell' || elMod.defect_type === 'hotspot') {
        pvStatus = 'critical'
      } else if (elMod.defect_type === 'pending') {
        pvStatus = 'pending'
      }
      
      await c.env.DB.prepare(`
        INSERT INTO pv_modules (
          zone_id, module_identifier, string_number, position_in_string,
          pos_x_meters, pos_y_meters, width_meters, height_meters,
          rotation, power_wp, module_status, status_comment
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        zoneId,
        elMod.module_identifier,
        elMod.string_number || 1,
        elMod.position_in_string || 1,
        0, 0, // Position par défaut (à placer manuellement)
        1.7, 1.0, // Dimensions standard modules
        0, // Rotation par défaut
        450, // Power par défaut
        pvStatus,
        elMod.notes || `Synchronisé depuis EL: ${elMod.defect_type}`
      ).run()
      
      syncedCount++
    }
    
    return c.json({
      success: true,
      message: `${syncedCount} modules synchronisés depuis EL vers PV`,
      synced_count: syncedCount
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

export default app
