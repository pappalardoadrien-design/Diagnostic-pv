import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

// ============================================================================
// GET /api/pv/available-el-audits
// Lister tous les audits EL disponibles pour import
// ============================================================================
app.get('/available-el-audits', async (c) => {
  try {
    const { DB } = c.env
    
    // Récupérer tous les audits EL avec leurs stats
    const audits = await DB.prepare(`
      SELECT 
        a.id,
        a.audit_token,
        a.project_name,
        a.client_name,
        a.location,
        a.string_count,
        a.modules_per_string,
        a.total_modules,
        a.configuration_json,
        a.status,
        a.completion_rate,
        a.created_at,
        a.updated_at,
        -- Compter modules avec défauts
        (SELECT COUNT(*) FROM el_modules WHERE el_audit_id = a.id AND defect_type NOT IN ('ok', 'pending')) as modules_with_defects,
        -- Vérifier si déjà lié à une zone
        (SELECT COUNT(*) FROM pv_cartography_audit_links WHERE el_audit_id = a.id) as is_linked
      FROM el_audits a
      ORDER BY a.created_at DESC
    `).all()
    
    if (!audits.results) {
      return c.json({ success: true, audits: [] })
    }
    
    return c.json({ 
      success: true, 
      audits: audits.results,
      total: audits.results.length
    })
    
  } catch (error: any) {
    console.error('Erreur récupération audits EL:', error)
    return c.json({ error: 'Erreur serveur', details: error.message }, 500)
  }
})

// ============================================================================
// POST /api/pv/plants/:plantId/zones/:zoneId/link-el-audit
// Lier un audit EL à une zone PV (Canvas V2)
// ============================================================================
app.post('/plants/:plantId/zones/:zoneId/link-el-audit', async (c) => {
  const { plantId, zoneId } = c.req.param()
  const { el_audit_token } = await c.req.json()
  
  if (!el_audit_token) {
    return c.json({ error: 'el_audit_token requis' }, 400)
  }
  
  try {
    const { DB } = c.env
    
    // Vérifier que la zone existe
    const zone = await DB.prepare('SELECT * FROM pv_zones WHERE id = ? AND plant_id = ?')
      .bind(zoneId, plantId)
      .first()
    
    if (!zone) {
      return c.json({ error: 'Zone PV introuvable' }, 404)
    }
    
    // Vérifier que l'audit EL existe
    const audit = await DB.prepare('SELECT * FROM el_audits WHERE audit_token = ?')
      .bind(el_audit_token)
      .first()
    
    if (!audit) {
      return c.json({ error: 'Audit EL introuvable' }, 404)
    }
    
    // Vérifier si une liaison existe déjà pour cette zone
    const existingLink = await DB.prepare('SELECT * FROM pv_cartography_audit_links WHERE pv_zone_id = ?')
      .bind(zoneId)
      .first()
    
    if (existingLink) {
      return c.json({ error: 'Zone déjà liée à un audit EL', existing_link: existingLink }, 409)
    }
    
    // Créer la liaison
    const result = await DB.prepare(`
      INSERT INTO pv_cartography_audit_links (
        pv_zone_id,
        pv_plant_id,
        el_audit_id,
        el_audit_token,
        link_type,
        sync_direction,
        sync_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      zoneId,
      plantId,
      audit.id,
      el_audit_token,
      'manual',
      'el_to_pv',
      'linked'
    ).run()
    
    return c.json({
      success: true,
      link_id: result.meta.last_row_id,
      message: 'Liaison créée avec succès',
      zone_name: zone.zone_name,
      audit_project: audit.project_name,
      audit_client: audit.client_name,
      total_modules: audit.total_modules
    })
    
  } catch (error: any) {
    console.error('Erreur liaison audit EL:', error)
    return c.json({ error: 'Erreur serveur', details: error.message }, 500)
  }
})

// ============================================================================
// GET /api/pv/plants/:plantId/zones/:zoneId/el-link
// Récupérer la liaison EL d'une zone
// ============================================================================
app.get('/plants/:plantId/zones/:zoneId/el-link', async (c) => {
  const { plantId, zoneId } = c.req.param()
  
  try {
    const { DB } = c.env
    
    const link = await DB.prepare(`
      SELECT 
        l.*,
        a.project_name,
        a.client_name,
        a.total_modules,
        a.completion_rate,
        a.status as audit_status
      FROM pv_cartography_audit_links l
      LEFT JOIN el_audits a ON l.el_audit_id = a.id
      WHERE l.pv_zone_id = ? AND l.pv_plant_id = ?
    `).bind(zoneId, plantId).first()
    
    if (!link) {
      return c.json({ linked: false, link: null })
    }
    
    return c.json({ linked: true, link })
    
  } catch (error: any) {
    console.error('Erreur récupération liaison:', error)
    return c.json({ error: 'Erreur serveur', details: error.message }, 500)
  }
})

// ============================================================================
// DELETE /api/pv/plants/:plantId/zones/:zoneId/el-link
// Supprimer la liaison EL d'une zone
// ============================================================================
app.delete('/plants/:plantId/zones/:zoneId/el-link', async (c) => {
  const { plantId, zoneId } = c.req.param()
  
  try {
    const { DB } = c.env
    
    const result = await DB.prepare('DELETE FROM pv_cartography_audit_links WHERE pv_zone_id = ? AND pv_plant_id = ?')
      .bind(zoneId, plantId)
      .run()
    
    if (result.meta.changes === 0) {
      return c.json({ error: 'Aucune liaison à supprimer' }, 404)
    }
    
    return c.json({ success: true, message: 'Liaison supprimée' })
    
  } catch (error: any) {
    console.error('Erreur suppression liaison:', error)
    return c.json({ error: 'Erreur serveur', details: error.message }, 500)
  }
})

// ============================================================================
// POST /api/pv/plants/:plantId/zones/:zoneId/sync-from-el
// Synchroniser statuts modules depuis audit EL vers zone PV
// ============================================================================
app.post('/plants/:plantId/zones/:zoneId/sync-from-el', async (c) => {
  const { plantId, zoneId } = c.req.param()
  
  try {
    const { DB } = c.env
    
    // Récupérer liaison
    const link = await DB.prepare('SELECT * FROM pv_cartography_audit_links WHERE pv_zone_id = ? AND pv_plant_id = ?')
      .bind(zoneId, plantId)
      .first()
    
    if (!link) {
      return c.json({ error: 'Aucune liaison trouvée. Créez d\'abord une liaison avec un audit EL.' }, 404)
    }
    
    // Récupérer modules EL
    const elModules = await DB.prepare('SELECT * FROM el_modules WHERE el_audit_id = ?')
      .bind(link.el_audit_id)
      .all()
    
    if (!elModules.results || elModules.results.length === 0) {
      return c.json({ error: 'Aucun module EL trouvé dans l\'audit' }, 404)
    }
    
    // Récupérer modules PV
    const pvModules = await DB.prepare('SELECT * FROM pv_modules WHERE zone_id = ?')
      .bind(zoneId)
      .all()
    
    if (!pvModules.results || pvModules.results.length === 0) {
      return c.json({ error: 'Aucun module PV trouvé dans la zone. Créez d\'abord des modules dans Canvas V2.' }, 404)
    }
    
    // Mapping statuts EL → PV
    const statusMapping: Record<string, string> = {
      'ok': 'ok',
      'pending': 'pending',
      'inequality': 'inequality',
      'microcracks': 'microcracks',
      'dead': 'dead',
      'string_open': 'string_open',
      'not_connected': 'not_connected'
    }
    
    // Synchroniser par matching string + position
    let syncCount = 0
    let defectCount = 0
    
    for (const elMod of elModules.results) {
      // Trouver module PV correspondant (même string + position)
      const pvMod = pvModules.results.find((pm: any) => 
        pm.string_number === elMod.string_number && 
        pm.position_in_string === elMod.position_in_string
      )
      
      if (pvMod) {
        const newStatus = statusMapping[elMod.defect_type] || 'pending'
        
        // Update module PV
        await DB.prepare(`
          UPDATE pv_modules 
          SET module_status = ?,
              el_defect_type = ?,
              el_severity_level = ?,
              el_notes = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(
          newStatus,
          elMod.defect_type,
          elMod.severity_level || 0,
          elMod.comment || null,
          pvMod.id
        ).run()
        
        syncCount++
        if (newStatus !== 'ok' && newStatus !== 'pending') {
          defectCount++
        }
      }
    }
    
    // Update stats liaison
    await DB.prepare(`
      UPDATE pv_cartography_audit_links
      SET sync_status = 'synced',
          last_sync_at = CURRENT_TIMESTAMP,
          total_modules_synced = ?,
          modules_with_defects = ?
      WHERE id = ?
    `).bind(syncCount, defectCount, link.id).run()
    
    return c.json({
      success: true,
      message: 'Synchronisation terminée',
      stats: {
        total_el_modules: elModules.results.length,
        total_pv_modules: pvModules.results.length,
        synced: syncCount,
        with_defects: defectCount,
        not_matched: elModules.results.length - syncCount
      }
    })
    
  } catch (error: any) {
    console.error('Erreur synchronisation:', error)
    return c.json({ error: 'Erreur serveur', details: error.message }, 500)
  }
})

// ============================================================================
// GET /api/pv/el-audit/:auditToken/quick-map
// Workflow rapide: Créer centrale + zone et rediriger vers Canvas V2
// ============================================================================
app.get('/el-audit/:auditToken/quick-map', async (c) => {
  const auditToken = c.req.param('auditToken')
  
  try {
    const { DB } = c.env
    
    // 1. Récupérer l'audit EL
    const audit = await DB.prepare('SELECT * FROM el_audits WHERE audit_token = ?')
      .bind(auditToken)
      .first()
    
    if (!audit) {
      return c.json({ error: 'Audit EL introuvable' }, 404)
    }
    
    // 2. Vérifier si une centrale existe déjà pour cet audit
    const existingLink = await DB.prepare(`
      SELECT l.*, z.id as zone_id, p.id as plant_id
      FROM pv_cartography_audit_links l
      LEFT JOIN pv_zones z ON l.pv_zone_id = z.id
      LEFT JOIN pv_plants p ON l.pv_plant_id = p.id
      WHERE l.el_audit_token = ?
      LIMIT 1
    `).bind(auditToken).first()
    
    if (existingLink && existingLink.plant_id && existingLink.zone_id) {
      // Rediriger vers l'éditeur existant
      return c.redirect(`/pv/plant/${existingLink.plant_id}/zone/${existingLink.zone_id}/editor/v2`)
    }
    
    // 3. Créer nouvelle centrale PV
    const plantName = `${audit.project_name} - Cartographie`
    const plantResult = await DB.prepare(`
      INSERT INTO pv_plants (plant_name, address, notes, total_power_kwp)
      VALUES (?, ?, ?, ?)
    `).bind(
      plantName,
      audit.location || 'Localisation non définie',
      `Centrale créée automatiquement depuis audit EL ${auditToken}`,
      0 // Will be calculated later
    ).run()
    
    const plantId = plantResult.meta.last_row_id
    
    // 4. Créer zone principale
    const zoneName = `Zone 1 - ${audit.string_count}×${audit.modules_per_string}`
    const zoneResult = await DB.prepare(`
      INSERT INTO pv_zones (
        plant_id, zone_name, zone_type, azimuth, tilt, notes
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      plantId,
      zoneName,
      'ground',
      180, // South by default
      30,  // Default tilt
      `Zone créée pour audit ${auditToken} - ${audit.total_modules} modules`
    ).run()
    
    const zoneId = zoneResult.meta.last_row_id
    
    // 5. Créer les modules PV depuis l'audit EL
    const elModules = await DB.prepare(`
      SELECT id, string_number, position_in_string, defect_type, severity_level, comment
      FROM el_modules
      WHERE el_audit_id = ?
      ORDER BY string_number, position_in_string
    `).bind(audit.id).all()
    
    if (elModules.results && elModules.results.length > 0) {
      for (const elMod of elModules.results) {
        const moduleId = `S${elMod.string_number}M${elMod.position_in_string}`
        
        await DB.prepare(`
          INSERT INTO pv_modules (
            zone_id, module_identifier, string_number, position_in_string,
            pos_x_meters, pos_y_meters, rotation,
            el_audit_id, el_audit_token, el_module_id,
            el_defect_type, el_severity_level, el_notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          zoneId,
          moduleId,
          elMod.string_number,
          elMod.position_in_string,
          0, // pos_x - will be positioned manually in Canvas V2
          0, // pos_y
          0, // rotation
          audit.id,
          auditToken,
          elMod.id,
          elMod.defect_type || 'pending',
          elMod.severity_level || 0,
          elMod.comment
        ).run()
      }
      
      console.log(`✅ ${elModules.results.length} modules créés automatiquement`)
    }
    
    // 6. Créer la liaison
    await DB.prepare(`
      INSERT INTO pv_cartography_audit_links (
        pv_zone_id,
        pv_plant_id,
        el_audit_id,
        el_audit_token,
        link_type,
        sync_direction,
        sync_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      zoneId,
      plantId,
      audit.id,
      auditToken,
      'auto',
      'el_to_pv',
      'linked'
    ).run()
    
    // 7. Rediriger vers l'éditeur Canvas V2
    return c.redirect(`/pv/plant/${plantId}/zone/${zoneId}/editor/v2`)
    
  } catch (error: any) {
    console.error('Erreur quick-map:', error)
    return c.json({ 
      error: 'Erreur création cartographie rapide', 
      details: error.message 
    }, 500)
  }
})

export default app
