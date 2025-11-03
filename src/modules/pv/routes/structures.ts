// ============================================================================
// MODULE PV - ROUTES STRUCTURES
// ============================================================================
// Gestion structures physiques (bâtiments, ombrières, champs)
// Workflow: Modélisation AVANT placement modules

import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
  KV: KVNamespace
  R2: R2Bucket
}

const structuresRouter = new Hono<{ Bindings: Bindings }>()

// ============================================================================
// GET /api/pv/plants/:plantId/zones/:zoneId/structures - Liste structures
// ============================================================================
structuresRouter.get('/', async (c) => {
  const { env } = c
  const plantId = parseInt(c.req.param('plantId') || '0')
  const zoneId = parseInt(c.req.param('zoneId') || '0')

  try {
    const structures = await env.DB.prepare(`
      SELECT * FROM pv_structures
      WHERE zone_id = ?
      ORDER BY structure_order, created_at
    `).bind(zoneId).all()

    return c.json({
      success: true,
      structures: structures.results || []
    })
  } catch (error: any) {
    console.error('Erreur chargement structures:', error)
    return c.json({ error: 'Erreur chargement structures', details: error.message }, 500)
  }
})

// ============================================================================
// POST /api/pv/plants/:plantId/zones/:zoneId/structures - Créer structure
// ============================================================================
structuresRouter.post('/', async (c) => {
  const { env } = c
  const plantId = parseInt(c.req.param('plantId') || '0')
  const zoneId = parseInt(c.req.param('zoneId') || '0')

  try {
    const body = await c.req.json()
    const {
      structure_type,
      structure_name,
      geometry,
      area_sqm,
      fill_color,
      stroke_color,
      opacity,
      notes
    } = body

    // Validation
    if (!structure_type || !structure_name || !geometry) {
      return c.json({ error: 'Champs requis: structure_type, structure_name, geometry' }, 400)
    }

    const validTypes = ['building', 'carport', 'ground', 'technical', 'other']
    if (!validTypes.includes(structure_type)) {
      return c.json({ error: 'structure_type invalide. Valeurs: ' + validTypes.join(', ') }, 400)
    }

    // Obtenir dernier order
    const lastOrder = await env.DB.prepare(`
      SELECT MAX(structure_order) as max_order
      FROM pv_structures
      WHERE zone_id = ?
    `).bind(zoneId).first()

    const nextOrder = (lastOrder?.max_order || 0) + 1

    // Insérer
    const result = await env.DB.prepare(`
      INSERT INTO pv_structures (
        zone_id,
        structure_type,
        structure_name,
        structure_order,
        geometry,
        area_sqm,
        fill_color,
        stroke_color,
        opacity,
        notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      zoneId,
      structure_type,
      structure_name,
      nextOrder,
      typeof geometry === 'string' ? geometry : JSON.stringify(geometry),
      area_sqm || 0,
      fill_color || (structure_type === 'building' ? '#d1d5db' : structure_type === 'carport' ? '#fbbf24' : '#86efac'),
      stroke_color || '#6b7280',
      opacity !== undefined ? opacity : 0.3,
      notes || null
    ).run()

    return c.json({
      success: true,
      structure_id: result.meta.last_row_id
    })
  } catch (error: any) {
    console.error('Erreur création structure:', error)
    return c.json({ error: 'Erreur création structure', details: error.message }, 500)
  }
})

// ============================================================================
// PUT /api/pv/plants/:plantId/zones/:zoneId/structures/:structureId - Modifier
// ============================================================================
structuresRouter.put('/:structureId', async (c) => {
  const { env } = c
  const plantId = parseInt(c.req.param('plantId') || '0')
  const zoneId = parseInt(c.req.param('zoneId') || '0')
  const structureId = parseInt(c.req.param('structureId') || '0')

  try {
    const body = await c.req.json()
    const {
      structure_type,
      structure_name,
      geometry,
      area_sqm,
      fill_color,
      stroke_color,
      opacity,
      notes
    } = body

    // Construire UPDATE dynamique
    const updates: string[] = []
    const params: any[] = []

    if (structure_type !== undefined) {
      updates.push('structure_type = ?')
      params.push(structure_type)
    }
    if (structure_name !== undefined) {
      updates.push('structure_name = ?')
      params.push(structure_name)
    }
    if (geometry !== undefined) {
      updates.push('geometry = ?')
      params.push(typeof geometry === 'string' ? geometry : JSON.stringify(geometry))
    }
    if (area_sqm !== undefined) {
      updates.push('area_sqm = ?')
      params.push(area_sqm)
    }
    if (fill_color !== undefined) {
      updates.push('fill_color = ?')
      params.push(fill_color)
    }
    if (stroke_color !== undefined) {
      updates.push('stroke_color = ?')
      params.push(stroke_color)
    }
    if (opacity !== undefined) {
      updates.push('opacity = ?')
      params.push(opacity)
    }
    if (notes !== undefined) {
      updates.push('notes = ?')
      params.push(notes)
    }

    if (updates.length === 0) {
      return c.json({ error: 'Aucun champ à mettre à jour' }, 400)
    }

    params.push(structureId, zoneId)

    await env.DB.prepare(`
      UPDATE pv_structures
      SET ${updates.join(', ')}
      WHERE id = ? AND zone_id = ?
    `).bind(...params).run()

    return c.json({ success: true })
  } catch (error: any) {
    console.error('Erreur modification structure:', error)
    return c.json({ error: 'Erreur modification structure', details: error.message }, 500)
  }
})

// ============================================================================
// DELETE /api/pv/plants/:plantId/zones/:zoneId/structures/:structureId
// ============================================================================
structuresRouter.delete('/:structureId', async (c) => {
  const { env } = c
  const plantId = parseInt(c.req.param('plantId') || '0')
  const zoneId = parseInt(c.req.param('zoneId') || '0')
  const structureId = parseInt(c.req.param('structureId') || '0')

  try {
    await env.DB.prepare(`
      DELETE FROM pv_structures
      WHERE id = ? AND zone_id = ?
    `).bind(structureId, zoneId).run()

    return c.json({ success: true })
  } catch (error: any) {
    console.error('Erreur suppression structure:', error)
    return c.json({ error: 'Erreur suppression structure', details: error.message }, 500)
  }
})

export default structuresRouter
