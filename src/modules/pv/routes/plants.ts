// ============================================================================
// PV CARTOGRAPHY MODULE - PLANTS ROUTES
// Routes API pour gestion centrales PV, zones et modules
// ============================================================================

import { Hono } from 'hono'
import type { Context } from 'hono'

type Bindings = {
  DB: D1Database
}

const plantsRouter = new Hono<{ Bindings: Bindings }>()

// ============================================================================
// CENTRALES PV
// ============================================================================

// GET /api/pv/plants - Liste toutes les centrales
plantsRouter.get('/', async (c: Context) => {
  const { env } = c
  
  try {
    const plants = await env.DB.prepare(`
      SELECT 
        p.*,
        COUNT(DISTINCT z.id) as zone_count,
        COUNT(m.id) as module_count,
        SUM(m.power_wp) as total_power_wp
      FROM pv_plants p
      LEFT JOIN pv_zones z ON p.id = z.plant_id
      LEFT JOIN pv_modules m ON z.id = m.zone_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `).all()
    
    return c.json({ 
      success: true,
      plants: plants.results || []
    })
  } catch (error: any) {
    console.error('Erreur liste centrales:', error)
    return c.json({ 
      error: 'Erreur chargement centrales',
      details: error.message 
    }, 500)
  }
})

// GET /api/pv/plants/:id - Détail centrale
plantsRouter.get('/:id', async (c: Context) => {
  const { env } = c
  const plantId = c.req.param('id')
  
  try {
    const plant = await env.DB.prepare(`
      SELECT * FROM pv_plants WHERE id = ?
    `).bind(plantId).first()
    
    if (!plant) {
      return c.json({ error: 'Centrale non trouvée' }, 404)
    }
    
    const zones = await env.DB.prepare(`
      SELECT 
        z.*,
        COUNT(m.id) as module_count,
        SUM(m.power_wp) as total_power_wp
      FROM pv_zones z
      LEFT JOIN pv_modules m ON z.id = m.zone_id
      WHERE z.plant_id = ?
      GROUP BY z.id
      ORDER BY z.zone_order
    `).bind(plantId).all()
    
    return c.json({ 
      success: true,
      plant,
      zones: zones.results || []
    })
  } catch (error: any) {
    console.error('Erreur détail centrale:', error)
    return c.json({ 
      error: 'Erreur chargement centrale',
      details: error.message 
    }, 500)
  }
})

// POST /api/pv/plants - Créer centrale
plantsRouter.post('/', async (c: Context) => {
  const { env } = c
  const data = await c.req.json()
  
  try {
    const result = await env.DB.prepare(`
      INSERT INTO pv_plants (
        plant_name, plant_type, address, city, postal_code, 
        country, latitude, longitude, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.plant_name || 'Nouvelle Centrale',
      data.plant_type || 'rooftop',
      data.address || null,
      data.city || null,
      data.postal_code || null,
      data.country || 'France',
      data.latitude || null,
      data.longitude || null,
      data.notes || null
    ).run()
    
    return c.json({ 
      success: true, 
      plant_id: result.meta.last_row_id,
      message: 'Centrale créée avec succès'
    })
  } catch (error: any) {
    console.error('Erreur création centrale:', error)
    return c.json({ 
      error: 'Erreur création centrale',
      details: error.message 
    }, 500)
  }
})

// PUT /api/pv/plants/:id - Modifier centrale
plantsRouter.put('/:id', async (c: Context) => {
  const { env } = c
  const plantId = c.req.param('id')
  const data = await c.req.json()
  
  try {
    await env.DB.prepare(`
      UPDATE pv_plants 
      SET plant_name = ?, 
          plant_type = ?,
          address = ?, 
          city = ?, 
          postal_code = ?,
          country = ?,
          latitude = ?, 
          longitude = ?,
          notes = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      data.plant_name,
      data.plant_type,
      data.address,
      data.city,
      data.postal_code,
      data.country,
      data.latitude,
      data.longitude,
      data.notes,
      plantId
    ).run()
    
    return c.json({ 
      success: true,
      message: 'Centrale mise à jour'
    })
  } catch (error: any) {
    console.error('Erreur mise à jour centrale:', error)
    return c.json({ 
      error: 'Erreur mise à jour centrale',
      details: error.message 
    }, 500)
  }
})

// DELETE /api/pv/plants/:id - Supprimer centrale
plantsRouter.delete('/:id', async (c: Context) => {
  const { env } = c
  const plantId = c.req.param('id')
  
  try {
    await env.DB.prepare(`
      DELETE FROM pv_plants WHERE id = ?
    `).bind(plantId).run()
    
    return c.json({ 
      success: true,
      message: 'Centrale supprimée'
    })
  } catch (error: any) {
    console.error('Erreur suppression centrale:', error)
    return c.json({ 
      error: 'Erreur suppression centrale',
      details: error.message 
    }, 500)
  }
})

// ============================================================================
// ZONES
// ============================================================================

// GET /api/pv/plants/:plantId/zones - Liste zones d'une centrale
plantsRouter.get('/:plantId/zones', async (c: Context) => {
  const { env } = c
  const plantId = c.req.param('plantId')
  
  try {
    const zones = await env.DB.prepare(`
      SELECT 
        z.*,
        COUNT(m.id) as module_count,
        SUM(m.power_wp) as total_power_wp
      FROM pv_zones z
      LEFT JOIN pv_modules m ON z.id = m.zone_id
      WHERE z.plant_id = ?
      GROUP BY z.id
      ORDER BY z.zone_order
    `).bind(plantId).all()
    
    return c.json({ 
      success: true,
      zones: zones.results || []
    })
  } catch (error: any) {
    console.error('Erreur liste zones:', error)
    return c.json({ 
      error: 'Erreur chargement zones',
      details: error.message 
    }, 500)
  }
})

// GET /api/pv/plants/:plantId/zones/:zoneId - Détail zone avec modules
plantsRouter.get('/:plantId/zones/:zoneId', async (c: Context) => {
  const { env } = c
  const zoneId = c.req.param('zoneId')
  
  try {
    const zone = await env.DB.prepare(`
      SELECT * FROM pv_zones WHERE id = ?
    `).bind(zoneId).first()
    
    if (!zone) {
      return c.json({ error: 'Zone non trouvée' }, 404)
    }
    
    const modules = await env.DB.prepare(`
      SELECT * FROM pv_modules 
      WHERE zone_id = ?
      ORDER BY string_number, position_in_string
    `).bind(zoneId).all()
    
    return c.json({ 
      success: true,
      zone,
      modules: modules.results || []
    })
  } catch (error: any) {
    console.error('Erreur détail zone:', error)
    return c.json({ 
      error: 'Erreur chargement zone',
      details: error.message 
    }, 500)
  }
})

// POST /api/pv/plants/:plantId/zones - Créer zone
plantsRouter.post('/:plantId/zones', async (c: Context) => {
  const { env } = c
  const plantId = c.req.param('plantId')
  const data = await c.req.json()
  
  try {
    const result = await env.DB.prepare(`
      INSERT INTO pv_zones (
        plant_id, zone_name, zone_type, zone_order,
        azimuth, tilt, outline_coordinates, area_sqm, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      plantId,
      data.zone_name || 'Nouvelle Zone',
      data.zone_type || 'roof',
      data.zone_order || 1,
      data.azimuth || 180,
      data.tilt || 30,
      JSON.stringify(data.outline_coordinates || []),
      data.area_sqm || 0,
      data.notes || null
    ).run()
    
    return c.json({ 
      success: true, 
      zone_id: result.meta.last_row_id,
      message: 'Zone créée avec succès'
    })
  } catch (error: any) {
    console.error('Erreur création zone:', error)
    return c.json({ 
      error: 'Erreur création zone',
      details: error.message 
    }, 500)
  }
})

// PUT /api/pv/plants/:plantId/zones/:zoneId - Modifier zone
plantsRouter.put('/:plantId/zones/:zoneId', async (c: Context) => {
  const { env } = c
  const zoneId = c.req.param('zoneId')
  const data = await c.req.json()
  
  try {
    await env.DB.prepare(`
      UPDATE pv_zones 
      SET zone_name = ?,
          zone_type = ?,
          azimuth = ?,
          tilt = ?,
          outline_coordinates = ?,
          area_sqm = ?,
          notes = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      data.zone_name || 'Zone',
      data.zone_type || 'roof',
      data.azimuth || 180,
      data.tilt || 30,
      JSON.stringify(data.outline_coordinates || []),
      data.area_sqm || null,
      data.notes || null,
      zoneId
    ).run()
    
    return c.json({ 
      success: true,
      message: 'Zone mise à jour'
    })
  } catch (error: any) {
    console.error('Erreur mise à jour zone:', error)
    return c.json({ 
      error: 'Erreur mise à jour zone',
      details: error.message 
    }, 500)
  }
})

// DELETE /api/pv/plants/:plantId/zones/:zoneId - Supprimer zone
plantsRouter.delete('/:plantId/zones/:zoneId', async (c: Context) => {
  const { env } = c
  const zoneId = c.req.param('zoneId')
  
  try {
    await env.DB.prepare(`
      DELETE FROM pv_zones WHERE id = ?
    `).bind(zoneId).run()
    
    return c.json({ 
      success: true,
      message: 'Zone supprimée'
    })
  } catch (error: any) {
    console.error('Erreur suppression zone:', error)
    return c.json({ 
      error: 'Erreur suppression zone',
      details: error.message 
    }, 500)
  }
})

// ============================================================================
// MODULES
// ============================================================================

// POST /api/pv/plants/:plantId/zones/:zoneId/modules - Ajouter modules (batch)
plantsRouter.post('/:plantId/zones/:zoneId/modules', async (c: Context) => {
  const { env } = c
  const zoneId = c.req.param('zoneId')
  const { modules } = await c.req.json()
  
  if (!Array.isArray(modules) || modules.length === 0) {
    return c.json({ error: 'Aucun module fourni' }, 400)
  }
  
  try {
    // Insertion par batch
    for (const m of modules) {
      await env.DB.prepare(`
        INSERT INTO pv_modules (
          zone_id, module_identifier, string_number, position_in_string,
          pos_x_meters, pos_y_meters, width_meters, height_meters, 
          rotation, power_wp, module_status, status_comment, brand, model, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        zoneId,
        m.module_identifier,
        m.string_number,
        m.position_in_string,
        m.pos_x_meters,
        m.pos_y_meters,
        m.width_meters || 1.7,
        m.height_meters || 1.0,
        m.rotation || 0,
        m.power_wp || 450,
        m.module_status || 'pending',
        m.status_comment || null,
        m.brand || null,
        m.model || null,
        m.notes || null
      ).run()
    }
    
    return c.json({ 
      success: true, 
      added: modules.length,
      message: `${modules.length} module(s) ajouté(s)`
    })
  } catch (error: any) {
    console.error('Erreur ajout modules:', error)
    return c.json({ 
      error: 'Erreur ajout modules',
      details: error.message 
    }, 500)
  }
})

// PUT /api/pv/plants/:plantId/zones/:zoneId/modules/:moduleId - Modifier module
plantsRouter.put('/:plantId/zones/:zoneId/modules/:moduleId', async (c: Context) => {
  const { env } = c
  const moduleId = c.req.param('moduleId')
  const data = await c.req.json()
  
  try {
    await env.DB.prepare(`
      UPDATE pv_modules 
      SET pos_x_meters = ?, 
          pos_y_meters = ?, 
          rotation = ?,
          notes = ?
      WHERE id = ?
    `).bind(
      data.pos_x_meters,
      data.pos_y_meters,
      data.rotation,
      data.notes,
      moduleId
    ).run()
    
    return c.json({ 
      success: true,
      message: 'Module mis à jour'
    })
  } catch (error: any) {
    console.error('Erreur mise à jour module:', error)
    return c.json({ 
      error: 'Erreur mise à jour module',
      details: error.message 
    }, 500)
  }
})

// DELETE /api/pv/plants/:plantId/zones/:zoneId/modules/:moduleId - Supprimer module
plantsRouter.delete('/:plantId/zones/:zoneId/modules/:moduleId', async (c: Context) => {
  const { env } = c
  const moduleId = c.req.param('moduleId')
  
  try {
    await env.DB.prepare(`
      DELETE FROM pv_modules WHERE id = ?
    `).bind(moduleId).run()
    
    return c.json({ 
      success: true,
      message: 'Module supprimé'
    })
  } catch (error: any) {
    console.error('Erreur suppression module:', error)
    return c.json({ 
      error: 'Erreur suppression module',
      details: error.message 
    }, 500)
  }
})

// GET /api/pv/plants/:plantId/zones/:zoneId/modules - Liste modules d'une zone
plantsRouter.get('/:plantId/zones/:zoneId/modules', async (c: Context) => {
  const { env } = c
  const zoneId = c.req.param('zoneId')
  
  try {
    const modules = await env.DB.prepare(`
      SELECT * FROM pv_modules 
      WHERE zone_id = ?
      ORDER BY string_number, position_in_string
    `).bind(zoneId).all()
    
    return c.json({ 
      success: true,
      modules: modules.results || []
    })
  } catch (error: any) {
    console.error('Erreur liste modules:', error)
    return c.json({ 
      error: 'Erreur chargement modules',
      details: error.message 
    }, 500)
  }
})

// DELETE /api/pv/plants/:plantId/zones/:zoneId/modules - Supprimer tous modules zone
plantsRouter.delete('/:plantId/zones/:zoneId/modules', async (c: Context) => {
  const { env } = c
  const zoneId = c.req.param('zoneId')
  
  try {
    await env.DB.prepare(`
      DELETE FROM pv_modules WHERE zone_id = ?
    `).bind(zoneId).run()
    
    return c.json({ 
      success: true,
      message: 'Tous les modules supprimés'
    })
  } catch (error: any) {
    console.error('Erreur suppression modules:', error)
    return c.json({ 
      error: 'Erreur suppression modules',
      details: error.message 
    }, 500)
  }
})

// PUT /api/pv/plants/:plantId/zones/:zoneId/modules/:moduleId/status - MAJ statut module
plantsRouter.put('/:plantId/zones/:zoneId/modules/:moduleId/status', async (c: Context) => {
  const { env } = c
  const moduleId = c.req.param('moduleId')
  const { module_status, status_comment } = await c.req.json()
  
  try {
    await env.DB.prepare(`
      UPDATE pv_modules 
      SET module_status = ?, status_comment = ?
      WHERE id = ?
    `).bind(
      module_status || 'pending',
      status_comment || null,
      moduleId
    ).run()
    
    return c.json({ 
      success: true,
      message: 'Statut mis à jour'
    })
  } catch (error: any) {
    console.error('Erreur mise à jour statut:', error)
    return c.json({ 
      error: 'Erreur mise à jour statut',
      details: error.message 
    }, 500)
  }
})

// PUT /api/pv/plants/:plantId/zones/:zoneId/background - Upload image fond zone
plantsRouter.put('/:plantId/zones/:zoneId/background', async (c: Context) => {
  const { env } = c
  const zoneId = c.req.param('zoneId')
  const { image_url, image_type, width_meters, height_meters } = await c.req.json()
  
  try {
    await env.DB.prepare(`
      UPDATE pv_zones 
      SET background_image_url = ?, 
          background_image_type = ?,
          width_meters = ?,
          height_meters = ?
      WHERE id = ?
    `).bind(
      image_url || null,
      image_type || 'upload',
      width_meters || 50.0,
      height_meters || 30.0,
      zoneId
    ).run()
    
    return c.json({ 
      success: true,
      message: 'Image fond mise à jour'
    })
  } catch (error: any) {
    console.error('Erreur mise à jour image fond:', error)
    return c.json({ 
      error: 'Erreur mise à jour image fond',
      details: error.message 
    }, 500)
  }
})

// PUT /api/pv/plants/:plantId/zones/:zoneId/config - Configuration électrique zone
plantsRouter.put('/:plantId/zones/:zoneId/config', async (c: Context) => {
  const { env } = c
  const zoneId = c.req.param('zoneId')
  const { 
    inverter_count, 
    junction_box_count, 
    string_count, 
    modules_per_string 
  } = await c.req.json()
  
  try {
    await env.DB.prepare(`
      UPDATE pv_zones 
      SET inverter_count = ?, 
          junction_box_count = ?, 
          string_count = ?, 
          modules_per_string = ?
      WHERE id = ?
    `).bind(
      inverter_count || 0, 
      junction_box_count || 0, 
      string_count || 0, 
      modules_per_string || 0, 
      zoneId
    ).run()
    
    return c.json({ 
      success: true,
      message: 'Configuration électrique mise à jour'
    })
  } catch (error: any) {
    console.error('Erreur mise à jour config:', error)
    return c.json({ 
      error: 'Erreur mise à jour configuration',
      details: error.message 
    }, 500)
  }
})

// PUT /api/pv/plants/:plantId/zones/:zoneId/roof - Contour toiture GPS
plantsRouter.put('/:plantId/zones/:zoneId/roof', async (c: Context) => {
  const { env } = c
  const zoneId = c.req.param('zoneId')
  const { roof_polygon, roof_area_sqm } = await c.req.json()
  
  try {
    await env.DB.prepare(`
      UPDATE pv_zones 
      SET roof_polygon = ?, 
          roof_area_sqm = ?,
          outline_coordinates = ?
      WHERE id = ?
    `).bind(
      roof_polygon || null,
      roof_area_sqm || 0,
      roof_polygon || null, // Alias pour compatibilité
      zoneId
    ).run()
    
    return c.json({ 
      success: true,
      message: 'Contour toiture sauvegardé',
      area_sqm: roof_area_sqm
    })
  } catch (error: any) {
    console.error('Erreur sauvegarde contour toiture:', error)
    return c.json({ 
      error: 'Erreur sauvegarde contour',
      details: error.message 
    }, 500)
  }
})

export default plantsRouter
