import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
  KV: KVNamespace
  R2: R2Bucket
}

const inverters = new Hono<{ Bindings: Bindings }>()

// ============================================================================
// INVERTERS (ONDULEURS) - CRUD COMPLET
// ============================================================================

// GET /api/pv/plants/:plantId/zones/:zoneId/inverters
// Lister tous les onduleurs d'une zone
inverters.get('/:plantId/zones/:zoneId/inverters', async (c) => {
  const { env } = c
  const { plantId, zoneId } = c.req.param()

  try {
    // Récupérer onduleurs avec statistiques
    const query = await env.DB.prepare(`
      SELECT 
        i.*,
        COUNT(DISTINCT sa.string_number) as assigned_strings,
        COUNT(m.id) as module_count,
        SUM(m.power_wp) / 1000.0 as total_power_kwp,
        ROUND(SUM(m.power_wp) / 1000.0 / i.rated_power_kw * 100, 1) as load_percent
      FROM pv_inverters i
      LEFT JOIN pv_string_assignments sa ON i.id = sa.inverter_id
      LEFT JOIN pv_modules m ON sa.string_number = m.string_number AND m.zone_id = i.zone_id
      WHERE i.zone_id = ?
      GROUP BY i.id
      ORDER BY i.inverter_name
    `).bind(zoneId).all()

    return c.json({
      success: true,
      inverters: query.results
    })
  } catch (error: any) {
    console.error('Erreur récupération onduleurs:', error)
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// GET /api/pv/plants/:plantId/zones/:zoneId/inverters/:inverterId
// Récupérer un onduleur spécifique avec détails strings
inverters.get('/:plantId/zones/:zoneId/inverters/:inverterId', async (c) => {
  const { env } = c
  const { inverterId, zoneId } = c.req.param()

  try {
    // Récupérer onduleur
    const inverter = await env.DB.prepare(`
      SELECT * FROM pv_inverters WHERE id = ? AND zone_id = ?
    `).bind(inverterId, zoneId).first()

    if (!inverter) {
      return c.json({ success: false, error: 'Onduleur non trouvé' }, 404)
    }

    // Récupérer strings attribués
    const strings = await env.DB.prepare(`
      SELECT 
        sa.*,
        COUNT(m.id) as module_count,
        SUM(m.power_wp) / 1000.0 as power_kwp
      FROM pv_string_assignments sa
      LEFT JOIN pv_modules m ON sa.string_number = m.string_number
      WHERE sa.inverter_id = ?
      GROUP BY sa.id
      ORDER BY sa.string_number
    `).bind(inverterId).all()

    return c.json({
      success: true,
      inverter,
      strings: strings.results
    })
  } catch (error: any) {
    console.error('Erreur récupération onduleur:', error)
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// POST /api/pv/plants/:plantId/zones/:zoneId/inverters
// Créer un nouvel onduleur
inverters.post('/:plantId/zones/:zoneId/inverters', async (c) => {
  const { env } = c
  const { zoneId } = c.req.param()
  const body = await c.req.json()

  try {
    const result = await env.DB.prepare(`
      INSERT INTO pv_inverters (
        zone_id,
        inverter_name,
        inverter_model,
        inverter_brand,
        rated_power_kw,
        mppt_count,
        efficiency_percent,
        status,
        serial_number,
        notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      zoneId,
      body.inverter_name,
      body.inverter_model || null,
      body.inverter_brand || null,
      body.rated_power_kw,
      body.mppt_count || 4,
      body.efficiency_percent || 98.0,
      body.status || 'active',
      body.serial_number || null,
      body.notes || null
    ).run()

    return c.json({
      success: true,
      inverter: {
        id: result.meta.last_row_id,
        ...body
      }
    })
  } catch (error: any) {
    console.error('Erreur création onduleur:', error)
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// PUT /api/pv/plants/:plantId/zones/:zoneId/inverters/:inverterId
// Mettre à jour un onduleur
inverters.put('/:plantId/zones/:zoneId/inverters/:inverterId', async (c) => {
  const { env } = c
  const { inverterId, zoneId } = c.req.param()
  const body = await c.req.json()

  try {
    await env.DB.prepare(`
      UPDATE pv_inverters 
      SET 
        inverter_name = ?,
        inverter_model = ?,
        inverter_brand = ?,
        rated_power_kw = ?,
        mppt_count = ?,
        efficiency_percent = ?,
        status = ?,
        serial_number = ?,
        notes = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND zone_id = ?
    `).bind(
      body.inverter_name,
      body.inverter_model || null,
      body.inverter_brand || null,
      body.rated_power_kw,
      body.mppt_count || 4,
      body.efficiency_percent || 98.0,
      body.status || 'active',
      body.serial_number || null,
      body.notes || null,
      inverterId,
      zoneId
    ).run()

    return c.json({
      success: true,
      inverter: { id: inverterId, ...body }
    })
  } catch (error: any) {
    console.error('Erreur mise à jour onduleur:', error)
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// DELETE /api/pv/plants/:plantId/zones/:zoneId/inverters/:inverterId
// Supprimer un onduleur
inverters.delete('/:plantId/zones/:zoneId/inverters/:inverterId', async (c) => {
  const { env } = c
  const { inverterId, zoneId } = c.req.param()

  try {
    // Vérifier si onduleur a des strings attribués
    const assignments = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM pv_string_assignments WHERE inverter_id = ?
    `).bind(inverterId).first()

    if (assignments && assignments.count > 0) {
      return c.json({
        success: false,
        error: `Impossible de supprimer: ${assignments.count} string(s) attribué(s). Supprimez d'abord les attributions.`
      }, 400)
    }

    await env.DB.prepare(`
      DELETE FROM pv_inverters WHERE id = ? AND zone_id = ?
    `).bind(inverterId, zoneId).run()

    return c.json({ success: true })
  } catch (error: any) {
    console.error('Erreur suppression onduleur:', error)
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// ============================================================================
// STRING ASSIGNMENTS - Attribution Strings → Onduleurs
// ============================================================================

// POST /api/pv/plants/:plantId/zones/:zoneId/inverters/:inverterId/assign-string
// Attribuer un string à un onduleur
inverters.post('/:plantId/zones/:zoneId/inverters/:inverterId/assign-string', async (c) => {
  const { env } = c
  const { inverterId } = c.req.param()
  const body = await c.req.json()

  try {
    // Vérifier si string déjà attribué
    const existing = await env.DB.prepare(`
      SELECT * FROM pv_string_assignments 
      WHERE inverter_id = ? AND string_number = ?
    `).bind(inverterId, body.string_number).first()

    if (existing) {
      return c.json({
        success: false,
        error: `String ${body.string_number} déjà attribué à cet onduleur`
      }, 400)
    }

    const result = await env.DB.prepare(`
      INSERT INTO pv_string_assignments (
        inverter_id,
        string_number,
        mppt_input,
        notes
      ) VALUES (?, ?, ?, ?)
    `).bind(
      inverterId,
      body.string_number,
      body.mppt_input || null,
      body.notes || null
    ).run()

    return c.json({
      success: true,
      assignment: {
        id: result.meta.last_row_id,
        ...body
      }
    })
  } catch (error: any) {
    console.error('Erreur attribution string:', error)
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// DELETE /api/pv/plants/:plantId/zones/:zoneId/inverters/:inverterId/assign-string/:stringNumber
// Retirer attribution d'un string
inverters.delete('/:plantId/zones/:zoneId/inverters/:inverterId/assign-string/:stringNumber', async (c) => {
  const { env } = c
  const { inverterId, stringNumber } = c.req.param()

  try {
    await env.DB.prepare(`
      DELETE FROM pv_string_assignments 
      WHERE inverter_id = ? AND string_number = ?
    `).bind(inverterId, stringNumber).run()

    return c.json({ success: true })
  } catch (error: any) {
    console.error('Erreur retrait attribution string:', error)
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// ============================================================================
// VALIDATION - Validation configuration électrique
// ============================================================================

// GET /api/pv/plants/:plantId/zones/:zoneId/electrical-validation
// Valider configuration électrique de la zone
inverters.get('/:plantId/zones/:zoneId/electrical-validation', async (c) => {
  const { env } = c
  const { zoneId } = c.req.param()

  try {
    // Récupérer config zone
    const zone = await env.DB.prepare(`
      SELECT * FROM pv_zones WHERE id = ?
    `).bind(zoneId).first()

    if (!zone) {
      return c.json({ success: false, error: 'Zone non trouvée' }, 404)
    }

    // Compter strings attribués
    const assignedStrings = await env.DB.prepare(`
      SELECT COUNT(DISTINCT sa.string_number) as count
      FROM pv_string_assignments sa
      JOIN pv_inverters i ON sa.inverter_id = i.id
      WHERE i.zone_id = ?
    `).bind(zoneId).first()

    // Compter modules par string
    const stringModules = await env.DB.prepare(`
      SELECT 
        string_number,
        COUNT(*) as module_count
      FROM pv_modules
      WHERE zone_id = ?
      GROUP BY string_number
      ORDER BY string_number
    `).bind(zoneId).all()

    // Calculer puissance totale onduleurs
    const invertersPower = await env.DB.prepare(`
      SELECT 
        SUM(rated_power_kw) as total_kw,
        COUNT(*) as inverter_count
      FROM pv_inverters
      WHERE zone_id = ?
    `).bind(zoneId).first()

    // Calculer puissance modules
    const modulesPower = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total_modules,
        SUM(power_wp) / 1000.0 as total_kwp
      FROM pv_modules
      WHERE zone_id = ?
    `).bind(zoneId).first()

    // Générer warnings
    const warnings = []
    const errors = []

    // Vérifier strings non attribués
    const unassignedCount = (zone.string_count as number) - (assignedStrings?.count || 0)
    if (unassignedCount > 0) {
      warnings.push(`${unassignedCount} string(s) non attribué(s) à un onduleur`)
    }

    // Vérifier strings vides
    const emptyStrings = stringModules.results.filter((s: any) => s.module_count === 0)
    if (emptyStrings.length > 0) {
      warnings.push(`${emptyStrings.length} string(s) vide(s): ${emptyStrings.map((s: any) => s.string_number).join(', ')}`)
    }

    // Vérifier surdimensionnement
    const totalInverterKw = invertersPower?.total_kw || 0
    const totalModuleKwp = modulesPower?.total_kwp || 0
    if (totalModuleKwp > totalInverterKw * 1.2) {
      errors.push(`Surdimensionnement: ${totalModuleKwp.toFixed(1)}kWp modules > ${(totalInverterKw * 1.2).toFixed(1)}kW onduleurs (max 120%)`)
    }

    // Vérifier sous-dimensionnement
    if (totalModuleKwp < totalInverterKw * 0.7 && totalModuleKwp > 0) {
      warnings.push(`Sous-dimensionnement: ${totalModuleKwp.toFixed(1)}kWp modules < ${(totalInverterKw * 0.7).toFixed(1)}kW onduleurs (min 70%)`)
    }

    // Vérifier onduleurs manquants
    if (!invertersPower || invertersPower.inverter_count === 0) {
      errors.push('Aucun onduleur configuré pour cette zone')
    }

    return c.json({
      success: true,
      validation: {
        zone_name: zone.zone_name,
        expected_strings: zone.string_count,
        assigned_strings: assignedStrings?.count || 0,
        unassigned_strings: unassignedCount,
        inverter_count: invertersPower?.inverter_count || 0,
        total_inverter_power_kw: totalInverterKw,
        total_module_power_kwp: totalModuleKwp,
        load_ratio_percent: totalInverterKw > 0 ? Math.round(totalModuleKwp / totalInverterKw * 100) : 0,
        warnings,
        errors,
        is_valid: errors.length === 0
      }
    })
  } catch (error: any) {
    console.error('Erreur validation électrique:', error)
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

export default inverters
