import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

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

export default app
