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
        SUM(m.power_wp) as total_power_wp
      FROM pv_zones z
      LEFT JOIN pv_modules m ON m.zone_id = z.id
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
    const { zone_name, zone_type, azimuth, tilt, width_meters, height_meters } = body
    
    const result = await c.env.DB.prepare(`
      INSERT INTO pv_zones (
        plant_id, zone_name, zone_type, azimuth, tilt, width_meters, height_meters
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      plantId,
      zone_name,
      zone_type || 'roof',
      azimuth || 180,
      tilt || 30,
      width_meters || 50,
      height_meters || 30
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
      SELECT * FROM pv_zones WHERE id = ?
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

export default app
