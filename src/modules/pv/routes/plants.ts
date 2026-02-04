// ============================================================================
// PV CARTOGRAPHY MODULE - PLANTS ROUTES
// Routes API pour gestion centrales PV, zones et modules
// ============================================================================

import { Hono } from 'hono'
import type { Context } from 'hono'
import structuresRouter from './structures'
import invertersRouter from './inverters'
import exportRouter from './export'

type Bindings = {
  DB: D1Database
  KV: KVNamespace
  R2: R2Bucket
}

const plantsRouter = new Hono<{ Bindings: Bindings }>()

// ============================================================================
// ROUTES STRUCTURES (Modélisation bâtiments/ombrières/champs)
// ============================================================================
plantsRouter.route('/:plantId/zones/:zoneId/structures', structuresRouter)

// ============================================================================
// ROUTES INVERTERS (Configuration électrique - Onduleurs + Strings)
// ============================================================================
plantsRouter.route('/', invertersRouter)

// ============================================================================
// ROUTES EXPORT (GeoJSON, KML, CSV pour traçabilité IEC 62446-1)
// ============================================================================
plantsRouter.route('/', exportRouter)

// ============================================================================
// CENTRALES PV
// ============================================================================

// GET /api/pv/plants - Liste toutes les centrales
plantsRouter.get('/', async (c: Context) => {
  const { env } = c
  
  try {
    // Essayer avec jointure client, fallback si client_id n'existe pas
    let plants
    try {
      plants = await env.DB.prepare(`
        SELECT 
          p.*,
          c.company_name as client_name,
          COUNT(DISTINCT z.id) as zone_count,
          COUNT(m.id) as module_count,
          SUM(m.power_wp) as total_power_wp
        FROM pv_plants p
        LEFT JOIN crm_clients c ON p.client_id = c.id
        LEFT JOIN pv_zones z ON p.id = z.plant_id
        LEFT JOIN pv_modules m ON z.id = m.zone_id
        GROUP BY p.id
        ORDER BY p.created_at DESC
      `).all()
    } catch (e) {
      // Fallback sans client_id
      plants = await env.DB.prepare(`
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
    }
    
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
    // Récupérer la centrale avec le nom du client (si lié)
    const plant = await env.DB.prepare(`
      SELECT p.*, c.company_name as client_name
      FROM pv_plants p
      LEFT JOIN crm_clients c ON p.client_id = c.id
      WHERE p.id = ?
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
    // Vérifier si la colonne client_id existe
    let hasClientId = false
    try {
      await env.DB.prepare(`SELECT client_id FROM pv_plants LIMIT 1`).first()
      hasClientId = true
    } catch (e) {
      // Colonne n'existe pas encore
    }
    
    let result
    if (hasClientId && data.client_id) {
      result = await env.DB.prepare(`
        INSERT INTO pv_plants (
          plant_name, plant_type, address, city, postal_code, 
          country, latitude, longitude, notes, client_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        data.plant_name || 'Nouvelle Centrale',
        data.plant_type || 'rooftop',
        data.address || null,
        data.city || null,
        data.postal_code || null,
        data.country || 'France',
        data.latitude || null,
        data.longitude || null,
        data.notes || null,
        data.client_id || null
      ).run()
    } else {
      result = await env.DB.prepare(`
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
    }
    
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
          client_id = ?,
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
      data.client_id || null,
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
    // Build dynamic update query based on provided fields
    const updates: string[] = []
    const values: any[] = []
    
    if (data.zone_name !== undefined) {
      updates.push('zone_name = ?')
      values.push(data.zone_name)
    }
    if (data.zone_type !== undefined) {
      updates.push('zone_type = ?')
      values.push(data.zone_type)
    }
    if (data.azimuth !== undefined) {
      updates.push('azimuth = ?')
      values.push(data.azimuth)
    }
    if (data.tilt !== undefined) {
      updates.push('tilt = ?')
      values.push(data.tilt)
    }
    if (data.outline_coordinates !== undefined) {
      updates.push('outline_coordinates = ?')
      values.push(JSON.stringify(data.outline_coordinates))
    }
    if (data.area_sqm !== undefined) {
      updates.push('area_sqm = ?')
      values.push(data.area_sqm)
    }
    if (data.notes !== undefined) {
      updates.push('notes = ?')
      values.push(data.notes)
    }
    if (data.roof_polygon !== undefined) {
      updates.push('roof_polygon = ?')
      values.push(data.roof_polygon)
    }
    if (data.roof_area_sqm !== undefined) {
      updates.push('roof_area_sqm = ?')
      values.push(data.roof_area_sqm)
    }
    
    if (updates.length === 0) {
      return c.json({ success: true, message: 'Aucune modification' })
    }
    
    updates.push('updated_at = datetime("now")')
    values.push(zoneId)
    
    await env.DB.prepare(`
      UPDATE pv_zones 
      SET ${updates.join(', ')}
      WHERE id = ?
    `).bind(...values).run()
    
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
          zone_id, module_identifier, latitude, longitude, string_number, position_in_string,
          pos_x_meters, pos_y_meters, width_meters, height_meters, 
          rotation, power_wp, module_status, status_comment, brand, model, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        zoneId,
        m.module_identifier || `M-${Date.now()}`,
        m.latitude ?? null,
        m.longitude ?? null,
        m.string_number ?? null,
        m.position_in_string ?? null,
        m.pos_x_meters ?? 0,
        m.pos_y_meters ?? 0,
        m.width_meters ?? 1.7,
        m.height_meters ?? 1.0,
        m.rotation ?? 0,
        m.power_wp ?? 450,
        m.module_status ?? 'pending',
        m.status_comment ?? null,
        m.brand ?? null,
        m.model ?? null,
        m.notes ?? null
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

// ============================================================================
// POST /api/pv/plants/:plantId/import-modules - Import en masse depuis plan
// Crée une zone unique et tous les modules avec coordonnées GPS
// ============================================================================
plantsRouter.post('/:plantId/import-modules', async (c: Context) => {
  const { env } = c
  const plantId = c.req.param('plantId')
  const { modules, clear_existing, corners, zone_name } = await c.req.json()
  
  if (!Array.isArray(modules) || modules.length === 0) {
    return c.json({ error: 'Aucun module fourni' }, 400)
  }
  
  try {
    // 1. Vérifier que la centrale existe
    const plant = await env.DB.prepare('SELECT * FROM pv_plants WHERE id = ?').bind(plantId).first()
    if (!plant) {
      return c.json({ error: 'Centrale non trouvée' }, 404)
    }

    // 2. Créer ou récupérer la zone principale
    let zoneId: number
    const existingZone = await env.DB.prepare(
      'SELECT id FROM pv_zones WHERE plant_id = ? AND zone_name = ?'
    ).bind(plantId, zone_name || 'Zone Import Plan').first()

    if (existingZone) {
      zoneId = existingZone.id as number
      
      // Supprimer anciens modules si demandé
      if (clear_existing) {
        await env.DB.prepare('DELETE FROM pv_modules WHERE zone_id = ?').bind(zoneId).run()
      }
    } else {
      // Créer nouvelle zone
      const zoneResult = await env.DB.prepare(`
        INSERT INTO pv_zones (plant_id, zone_name, zone_type, zone_order, outline_coordinates)
        VALUES (?, ?, 'roof', 1, ?)
      `).bind(
        plantId, 
        zone_name || 'Zone Import Plan',
        corners ? JSON.stringify(corners) : '[]'
      ).run()
      
      zoneId = zoneResult.meta.last_row_id as number
    }

    // 3. Insérer tous les modules
    let created = 0
    for (const m of modules) {
      const identifier = m.module_identifier || `${m.string_number}-${m.position_in_string}`
      
      await env.DB.prepare(`
        INSERT INTO pv_modules (
          zone_id, module_identifier, 
          latitude, longitude, 
          string_number, position_in_string,
          power_wp, module_status,
          width_meters, height_meters
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        zoneId,
        identifier,
        m.latitude || null,
        m.longitude || null,
        m.string_number || null,
        m.position_in_string || null,
        m.power_wp || 185,
        m.module_status || 'pending',
        1.7, // largeur standard module
        1.0  // hauteur standard module
      ).run()
      
      created++
    }

    // 4. Mettre à jour les stats de la centrale
    const totalPower = modules.reduce((sum: number, m: any) => sum + (m.power_wp || 185), 0)
    await env.DB.prepare(`
      UPDATE pv_plants 
      SET module_count = ?, total_power_kwp = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(created, totalPower / 1000, plantId).run()

    return c.json({ 
      success: true, 
      created,
      zone_id: zoneId,
      total_power_kwc: (totalPower / 1000).toFixed(2),
      message: `${created} modules importés dans la zone #${zoneId}`
    })

  } catch (error: any) {
    console.error('Erreur import modules:', error)
    return c.json({ 
      error: 'Erreur import modules',
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
    modules_per_string,
    strings_config // Configuration strings non réguliers
  } = await c.req.json()
  
  try {
    console.log('🔧 UPDATE config zone:', zoneId)
    console.log('📊 Données reçues:', { inverter_count, junction_box_count, string_count, modules_per_string, strings_config })
    
    const stringsConfigJson = strings_config ? JSON.stringify(strings_config) : null
    console.log('💾 strings_config JSON:', stringsConfigJson)
    
    const result = await env.DB.prepare(`
      UPDATE pv_zones 
      SET inverter_count = ?, 
          junction_box_count = ?, 
          string_count = ?, 
          modules_per_string = ?,
          strings_config = ?
      WHERE id = ?
    `).bind(
      inverter_count || 0, 
      junction_box_count || 0, 
      string_count || 0, 
      modules_per_string || 0,
      stringsConfigJson,
      zoneId
    ).run()
    
    console.log('✅ UPDATE result:', result)
    
    return c.json({ 
      success: true,
      message: 'Configuration électrique mise à jour'
    })
  } catch (error: any) {
    console.error('❌ Erreur mise à jour config:', error)
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

// ============================================================================
// GPS GEOLOCATION - Calcul automatique des coordonnées modules
// ============================================================================

// POST /api/pv/plants/:plantId/zones/:zoneId/calculate-gps - Calculer GPS modules depuis bounds zone
plantsRouter.post('/:plantId/zones/:zoneId/calculate-gps', async (c: Context) => {
  const { env } = c
  const plantId = c.req.param('plantId')
  const zoneId = c.req.param('zoneId')
  
  try {
    // Récupérer la zone et ses bounds
    const zone = await env.DB.prepare(`
      SELECT z.*, p.latitude as plant_lat, p.longitude as plant_lng
      FROM pv_zones z
      LEFT JOIN pv_plants p ON z.plant_id = p.id
      WHERE z.id = ? AND z.plant_id = ?
    `).bind(zoneId, plantId).first()
    
    if (!zone) {
      return c.json({ error: 'Zone non trouvée' }, 404)
    }
    
    // Vérifier que roof_polygon existe
    if (!zone.roof_polygon) {
      return c.json({ 
        error: 'Position non définie', 
        message: 'Positionnez d\'abord la zone sur la carte' 
      }, 400)
    }
    
    // Parser les bounds (format: [[lat1,lng1],[lat2,lng2]] ou [sw,ne])
    let bounds
    try {
      bounds = JSON.parse(zone.roof_polygon as string)
    } catch (e) {
      return c.json({ error: 'Format bounds invalide' }, 400)
    }
    
    // Récupérer les modules de la zone
    const modules = await env.DB.prepare(`
      SELECT id, module_identifier, position_in_string
      FROM pv_modules
      WHERE zone_id = ?
      ORDER BY position_in_string ASC
    `).bind(zoneId).all()
    
    if (!modules.results || modules.results.length === 0) {
      return c.json({ 
        success: true, 
        message: 'Aucun module à géolocaliser',
        updated: 0
      })
    }
    
    // Calculer les coordonnées de chaque module
    // Bounds format: [[swLat, swLng], [neLat, neLng]]
    const swLat = bounds[0][0]
    const swLng = bounds[0][1]
    const neLat = bounds[1][0]
    const neLng = bounds[1][1]
    
    // Calculer le centre de la zone (pour mise à jour plant si nécessaire)
    const centerLat = (swLat + neLat) / 2
    const centerLng = (swLng + neLng) / 2
    
    const moduleCount = modules.results.length
    let updated = 0
    
    // Distribuer les modules linéairement dans le rectangle
    // On les aligne horizontalement pour un string
    for (let i = 0; i < moduleCount; i++) {
      const m = modules.results[i] as any
      const ratio = moduleCount > 1 ? i / (moduleCount - 1) : 0.5
      
      // Interpolation linéaire entre SW et NE
      const lat = swLat + (neLat - swLat) * ratio
      const lng = swLng + (neLng - swLng) * ratio
      
      await env.DB.prepare(`
        UPDATE pv_modules
        SET latitude = ?, longitude = ?, updated_at = datetime('now')
        WHERE id = ?
      `).bind(lat, lng, m.id).run()
      
      updated++
    }
    
    // Mettre à jour les coordonnées de la zone
    await env.DB.prepare(`
      UPDATE pv_zones
      SET latitude = ?, longitude = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(centerLat, centerLng, zoneId).run()
    
    // Mettre à jour les coordonnées de la centrale si pas encore définies
    if (!zone.plant_lat || !zone.plant_lng) {
      await env.DB.prepare(`
        UPDATE pv_plants
        SET latitude = ?, longitude = ?, updated_at = datetime('now')
        WHERE id = ? AND (latitude IS NULL OR longitude IS NULL)
      `).bind(centerLat, centerLng, plantId).run()
    }
    
    return c.json({
      success: true,
      message: `${updated} modules géolocalisés`,
      updated,
      zone_center: { lat: centerLat, lng: centerLng },
      bounds: { sw: [swLat, swLng], ne: [neLat, neLng] }
    })
    
  } catch (error: any) {
    console.error('Erreur calcul GPS:', error)
    return c.json({ 
      error: 'Erreur calcul GPS',
      details: error.message 
    }, 500)
  }
})

// POST /api/pv/plants/:plantId/calculate-all-gps - Calculer GPS de toutes les zones
plantsRouter.post('/:plantId/calculate-all-gps', async (c: Context) => {
  const { env } = c
  const plantId = c.req.param('plantId')
  
  try {
    // Récupérer toutes les zones avec roof_polygon défini
    const zones = await env.DB.prepare(`
      SELECT id, zone_name, roof_polygon
      FROM pv_zones
      WHERE plant_id = ? AND roof_polygon IS NOT NULL
    `).bind(plantId).all()
    
    if (!zones.results || zones.results.length === 0) {
      return c.json({ 
        success: true, 
        message: 'Aucune zone positionnée',
        zones_processed: 0,
        total_modules: 0
      })
    }
    
    let totalModules = 0
    let zonesProcessed = 0
    let plantCenterLat = 0
    let plantCenterLng = 0
    
    for (const zone of zones.results as any[]) {
      try {
        const bounds = JSON.parse(zone.roof_polygon)
        const swLat = bounds[0][0]
        const swLng = bounds[0][1]
        const neLat = bounds[1][0]
        const neLng = bounds[1][1]
        
        const centerLat = (swLat + neLat) / 2
        const centerLng = (swLng + neLng) / 2
        
        plantCenterLat += centerLat
        plantCenterLng += centerLng
        
        // Récupérer et géolocaliser les modules
        const modules = await env.DB.prepare(`
          SELECT id, position_in_string FROM pv_modules WHERE zone_id = ?
          ORDER BY position_in_string ASC
        `).bind(zone.id).all()
        
        if (modules.results && modules.results.length > 0) {
          const moduleCount = modules.results.length
          
          for (let i = 0; i < moduleCount; i++) {
            const m = modules.results[i] as any
            const ratio = moduleCount > 1 ? i / (moduleCount - 1) : 0.5
            const lat = swLat + (neLat - swLat) * ratio
            const lng = swLng + (neLng - swLng) * ratio
            
            await env.DB.prepare(`
              UPDATE pv_modules SET latitude = ?, longitude = ?, updated_at = datetime('now')
              WHERE id = ?
            `).bind(lat, lng, m.id).run()
            
            totalModules++
          }
        }
        
        // Mettre à jour zone center
        await env.DB.prepare(`
          UPDATE pv_zones SET latitude = ?, longitude = ?, updated_at = datetime('now')
          WHERE id = ?
        `).bind(centerLat, centerLng, zone.id).run()
        
        zonesProcessed++
      } catch (e) {
        console.warn(`Zone ${zone.id} GPS calc error:`, e)
      }
    }
    
    // Mettre à jour centrale avec le centre moyen de toutes les zones
    if (zonesProcessed > 0) {
      plantCenterLat /= zonesProcessed
      plantCenterLng /= zonesProcessed
      
      await env.DB.prepare(`
        UPDATE pv_plants SET latitude = ?, longitude = ?, updated_at = datetime('now')
        WHERE id = ?
      `).bind(plantCenterLat, plantCenterLng, plantId).run()
    }
    
    return c.json({
      success: true,
      message: `${totalModules} modules géolocalisés dans ${zonesProcessed} zones`,
      zones_processed: zonesProcessed,
      total_modules: totalModules,
      plant_center: zonesProcessed > 0 ? { lat: plantCenterLat, lng: plantCenterLng } : null
    })
    
  } catch (error: any) {
    console.error('Erreur calcul GPS global:', error)
    return c.json({ 
      error: 'Erreur calcul GPS',
      details: error.message 
    }, 500)
  }
})

// GET /api/pv/plants/:plantId/gps-modules - Export modules avec coordonnées GPS
plantsRouter.get('/:plantId/gps-modules', async (c: Context) => {
  const { env } = c
  const plantId = c.req.param('plantId')
  
  try {
    const modules = await env.DB.prepare(`
      SELECT 
        m.id,
        m.module_identifier,
        m.latitude,
        m.longitude,
        m.power_wp,
        m.module_status,
        z.zone_name as string_name,
        z.id as zone_id
      FROM pv_modules m
      JOIN pv_zones z ON m.zone_id = z.id
      WHERE z.plant_id = ? AND m.latitude IS NOT NULL
      ORDER BY z.zone_name, m.position_in_string
    `).bind(plantId).all()
    
    // Construire GeoJSON FeatureCollection
    const geojson = {
      type: 'FeatureCollection',
      features: (modules.results || []).map((m: any) => ({
        type: 'Feature',
        properties: {
          id: m.id,
          module_identifier: m.module_identifier,
          power_wp: m.power_wp,
          status: m.module_status,
          string_name: m.string_name
        },
        geometry: {
          type: 'Point',
          coordinates: [m.longitude, m.latitude]
        }
      }))
    }
    
    return c.json({
      success: true,
      modules: modules.results || [],
      geojson,
      total: (modules.results || []).length,
      geolocated: (modules.results || []).filter((m: any) => m.latitude && m.longitude).length
    })
    
  } catch (error: any) {
    console.error('Erreur export GPS modules:', error)
    return c.json({ 
      error: 'Erreur export GPS',
      details: error.message 
    }, 500)
  }
})

export default plantsRouter
