import { Hono } from 'hono'

const api = new Hono<{ Bindings: { DB: D1Database } }>()

// GET /api/unified/topology/:zoneId
api.get('/topology/:zoneId', async (c) => {
  const zoneId = c.req.param('zoneId')
  const { DB } = c.env

  try {
    // Récupération Topologie + Données Audit (JOIN)
    // C'est ici que la magie opère : on lie la position physique aux résultats d'audit
    const query = `
      SELECT 
        t.*,
        dr.status_el,
        dr.status_iv,
        dr.status_visual,
        dr.status_thermal,
        dr.final_diagnosis,
        dr.severity_score,
        ma.r2_url as el_image_url
      FROM plant_topology t
      LEFT JOIN diagnosis_results dr ON t.id = dr.topology_id
      LEFT JOIN media_assets ma ON t.id = ma.topology_id AND ma.asset_type = 'el_image'
      WHERE t.zone_id = ?
    `
    
    const modules = await DB.prepare(query).bind(zoneId).all()

    return c.json({ success: true, modules: modules.results })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// POST /api/unified/topology/:zoneId/sync-from-el
// Synchronise depuis el_modules vers plant_topology
api.post('/topology/:zoneId/sync-from-el', async (c) => {
  const zoneId = c.req.param('zoneId')
  const { DB } = c.env

  try {
    // 1. Récupérer l'audit_token lié à la zone via plant_topology -> projects -> audits?
    // Ou via pv_zones directement si lié
    // Simplification: On suppose que le client envoie l'audit_token ou on le trouve via pv_zones
    
    // On cherche l'audit_token via pv_zones (ajouté dans migration 0050)
    const zone = await DB.prepare('SELECT audit_token, plant_id as project_id FROM pv_zones WHERE id = ?').bind(zoneId).first()
    
    if (!zone || !zone.audit_token) {
      return c.json({ success: false, error: 'Zone non liée à un audit EL' }, 400)
    }

    // 2. Récupérer les modules EL
    const { results: elModules } = await DB.prepare(`
      SELECT * FROM el_modules WHERE audit_token = ?
    `).bind(zone.audit_token).all()

    // 3. Insérer/Mettre à jour dans plant_topology
    // On utilise module_identifier comme clé unique par project_id
    const stmtTopology = DB.prepare(`
      INSERT INTO plant_topology (
        project_id, zone_id, module_identifier, 
        string_number, position_in_string,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(project_id, module_identifier) DO UPDATE SET
        string_number = excluded.string_number,
        position_in_string = excluded.position_in_string,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, module_identifier
    `)

    // 4. Insérer/Mettre à jour dans diagnosis_results (Statut EL)
    const stmtDiagnosis = DB.prepare(`
      INSERT INTO diagnosis_results (
        topology_id, audit_token, status_el,
        updated_at
      ) VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(topology_id) DO UPDATE SET
        status_el = excluded.status_el,
        updated_at = CURRENT_TIMESTAMP
    `)

    const batch = []
    
    // Pour chaque module EL
    for (const m of elModules) {
       // A. Topology
       const topoResult = await stmtTopology.bind(
         zone.project_id, zoneId, m.module_identifier,
         m.string_number, m.position_in_string
       ).first()
       
       if (topoResult && topoResult.id) {
         // B. Diagnosis (si on a un ID de topology)
         // Mapping simple des défauts EL vers status_el
         // 'microcracks' -> 'warning', 'dead_cell' -> 'critical', etc.
         // On garde le defect_type brut pour l'instant dans status_el
         batch.push(stmtDiagnosis.bind(
           topoResult.id, zone.audit_token, m.defect_type
         ))
       }
    }

    if (batch.length > 0) {
      await DB.batch(batch)
    }

    return c.json({ success: true, synced_count: elModules.length })
  } catch (error: any) {
    console.error(error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// POST /api/unified/topology/:zoneId/sync-full
// Synchronise TOUS les modules (EL + IV + Visual + Thermal) vers le Digital Twin
api.post('/topology/:zoneId/sync-full', async (c) => {
  const zoneId = c.req.param('zoneId')
  const { DB } = c.env

  try {
    // 1. Récupérer l'audit_token et le project_id
    const zone = await DB.prepare('SELECT audit_token, plant_id as project_id FROM pv_zones WHERE id = ?').bind(zoneId).first()
    
    if (!zone || !zone.audit_token) {
      return c.json({ success: false, error: 'Zone non liée à un audit (Token manquant)' }, 400)
    }

    const auditToken = zone.audit_token
    const projectId = zone.project_id

    // 2. Préparer les statements pour plant_topology (Insertion/MAJ structure)
    // On assume que EL est la source de vérité pour la structure, mais IV peut aussi définir des modules
    const stmtTopology = DB.prepare(`
      INSERT INTO plant_topology (
        project_id, zone_id, module_identifier, 
        string_number, position_in_string,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(project_id, module_identifier) DO UPDATE SET
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, module_identifier
    `)

    // 3. Préparer les statements pour diagnosis_results (Insertion/MAJ statuts)
    const stmtDiagnosis = DB.prepare(`
      INSERT INTO diagnosis_results (topology_id, audit_token, updated_at) 
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(topology_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
    `)
    
    const stmtUpdateStatus = (column: string) => DB.prepare(`
        UPDATE diagnosis_results SET ${column} = ?, updated_at = CURRENT_TIMESTAMP WHERE topology_id = ?
    `)

    let totalSynced = 0
    let logs = []

    // --- PHASE A: SYNC EL (Source principale structure) ---
    const { results: elModules } = await DB.prepare('SELECT * FROM el_modules WHERE audit_token = ?').bind(auditToken).all()
    
    for (const m of elModules) {
        // 1. Upsert Topology
        const topo = await stmtTopology.bind(projectId, zoneId, m.module_identifier, m.string_number, m.position_in_string).first()
        if(topo && topo.id) {
            // 2. Ensure Diagnosis row exists
            await stmtDiagnosis.bind(topo.id, auditToken).run()
            // 3. Update EL Status
            await stmtUpdateStatus('status_el').bind(m.defect_type, topo.id).run()
            totalSynced++
        }
    }
    logs.push(`EL: ${elModules.length} modules traités`)


    // --- PHASE B: SYNC VISUAL ---
    // On ne crée pas de nouveaux modules topology depuis le visuel (supposé être fait sur existant)
    // Mais on met à jour les statuts
    const { results: visualInspections } = await DB.prepare(`
        SELECT * FROM visual_inspections 
        WHERE audit_token = ? AND string_number IS NOT NULL AND module_number IS NOT NULL
    `).bind(auditToken).all()

    for (const v of visualInspections) {
        const identifier = `S${v.string_number}-${v.module_number}` // Convention simple
        // Trouver ID topology
        const topo = await DB.prepare('SELECT id FROM plant_topology WHERE project_id = ? AND module_identifier = ?')
            .bind(projectId, identifier).first()
            
        if (topo && topo.id) {
             await stmtDiagnosis.bind(topo.id, auditToken).run()
             const status = v.defect_found ? (v.defect_type || 'defect') : 'ok'
             await stmtUpdateStatus('status_visual').bind(status, topo.id).run()
        }
    }
    logs.push(`Visual: ${visualInspections.length} inspections traitées`)


    // --- PHASE C: SYNC IV ---
    const { results: ivMeasurements } = await DB.prepare(`
        SELECT * FROM iv_measurements 
        WHERE audit_token = ? AND measurement_type = 'reference'
    `).bind(auditToken).all()

    for (const iv of ivMeasurements) {
        // Si module_identifier existe dans IV, l'utiliser, sinon construire
        const identifier = iv.module_identifier || `S${iv.string_number}-${iv.module_number}`
        
        const topo = await DB.prepare('SELECT id FROM plant_topology WHERE project_id = ? AND module_identifier = ?')
            .bind(projectId, identifier).first()

        if (topo && topo.id) {
            await stmtDiagnosis.bind(topo.id, auditToken).run()
            // Logique simple: si Pmax < X% -> warning. Ici on met juste 'measured' ou 'low_power' pour l'exemple
            // On pourrait comparer iv.pmax vs théorique
            const status = 'measured' 
            await stmtUpdateStatus('status_iv').bind(status, topo.id).run()
        }
    }
    logs.push(`IV: ${ivMeasurements.length} mesures traitées`)


    // --- PHASE D: SYNC THERMAL ---
    const { results: thermalMeasurements } = await DB.prepare(`
        SELECT * FROM thermal_measurements 
        WHERE defect_type != 'ok' -- On s'intéresse surtout aux défauts pour le status
        -- Note: il faudrait joindre avec audits/interventions pour avoir le bon token si pas direct
        -- Ici on assume que thermal_measurements a accès via intervention, mais on simplifie
        -- TODO: Ajouter audit_token à thermal_measurements pour simplifier ou faire JOIN complexe
    `).all() 
    
    // Simplification: On ne traite Thermal que si on peut lier (TODO)
    logs.push(`Thermal: En attente (structure DB à confirmer)`)


    return c.json({ 
        success: true, 
        message: 'Synchronisation globale terminée',
        logs,
        total_synced_topology: totalSynced
    })

  } catch (error: any) {
    console.error(error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// POST /api/unified/topology/:zoneId/save
api.post('/topology/:zoneId/save', async (c) => {
  const zoneId = c.req.param('zoneId')
  const { DB } = c.env
  const { modules } = await c.req.json()

  try {
    const stmt = DB.prepare(`
      UPDATE plant_topology 
      SET 
        geo_lat = ?1, 
        geo_lon = ?2, 
        geo_rotation = ?3,
        schematic_x = ?4, 
        schematic_y = ?5, 
        schematic_rotation = ?6,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?7 AND zone_id = ?8
    `)

    const batch = modules.map((m: any) => stmt.bind(
      m.geo_lat, m.geo_lon, m.geo_rotation,
      m.schematic_x, m.schematic_y, m.schematic_rotation,
      m.id, zoneId
    ))

    await DB.batch(batch)

    return c.json({ success: true, updated_count: modules.length })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

export const apiRoutes = api
