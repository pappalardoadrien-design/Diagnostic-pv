// ============================================================================
// MODULE INTERCONNECT - Liaison entre modules du Diagnostic Hub
// ============================================================================
// Gère les liens entre Module EL, PV Cartography, et autres modules
// Permet navigation cohérente entre audits/centrales/zones

import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
  KV: KVNamespace
  R2: R2Bucket
}

const interconnectModule = new Hono<{ Bindings: Bindings }>()

// ============================================================================
// POST /link-audit-plant - Lier audit EL à centrale PV
// ============================================================================
interconnectModule.post('/link-audit-plant', async (c) => {
  const { env } = c
  const { auditToken, plantId, createPlant } = await c.req.json()
  
  if (!auditToken) {
    return c.json({ error: 'auditToken requis' }, 400)
  }
  
  try {
    // 1. Récupérer audit EL
    const audit = await env.DB.prepare(`
      SELECT id, intervention_id, project_name, client_name, location, total_modules
      FROM el_audits 
      WHERE audit_token = ?
    `).bind(auditToken).first()
    
    if (!audit) {
      return c.json({ error: 'Audit non trouvé' }, 404)
    }
    
    let finalPlantId = plantId
    
    // 2. Si pas de plantId fourni, créer centrale automatiquement
    if (!finalPlantId && createPlant) {
      const plantResult = await env.DB.prepare(`
        INSERT INTO pv_plants (plant_name, address, city, module_count, notes)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        audit.project_name,
        audit.location || 'À définir',
        audit.client_name || '',
        audit.total_modules || 0,
        `Centrale créée automatiquement depuis audit EL ${audit.audit_token}`
      ).run()
      
      finalPlantId = plantResult.meta.last_row_id
    }
    
    if (!finalPlantId) {
      return c.json({ error: 'plantId ou createPlant requis' }, 400)
    }
    
    // 3. Créer lien intervention → centrale
    if (audit.intervention_id) {
      await env.DB.prepare(`
        INSERT OR IGNORE INTO intervention_plants (intervention_id, plant_id, is_primary)
        VALUES (?, ?, 1)
      `).bind(audit.intervention_id, finalPlantId).run()
    }
    
    return c.json({
      success: true,
      auditId: audit.id,
      plantId: finalPlantId,
      message: 'Lien créé avec succès'
    })
    
  } catch (error: any) {
    return c.json({ 
      error: 'Erreur création lien', 
      details: error?.message 
    }, 500)
  }
})

// ============================================================================
// GET /audit/:token/plant - Obtenir centrale PV liée à audit EL
// ============================================================================
interconnectModule.get('/audit/:token/plant', async (c) => {
  const { env } = c
  const token = c.req.param('token')
  
  try {
    const result = await env.DB.prepare(`
      SELECT 
        p.id AS plant_id,
        p.plant_name,
        p.address || ', ' || p.city AS location,
        p.total_power_kwp,
        p.module_count AS total_modules,
        p.latitude,
        p.longitude
      FROM el_audits ea
      JOIN intervention_plants ip ON ea.intervention_id = ip.intervention_id
      JOIN pv_plants p ON ip.plant_id = p.id
      WHERE ea.audit_token = ?
      AND ip.is_primary = 1
      LIMIT 1
    `).bind(token).first()
    
    if (!result) {
      return c.json({ error: 'Aucune centrale liée', linked: false }, 404)
    }
    
    return c.json({ 
      linked: true,
      plant: result 
    })
    
  } catch (error: any) {
    return c.json({ 
      error: 'Erreur récupération lien', 
      details: error?.message 
    }, 500)
  }
})

// ============================================================================
// GET /plant/:plantId/audits - Obtenir tous audits EL d'une centrale
// ============================================================================
interconnectModule.get('/plant/:plantId/audits', async (c) => {
  const { env } = c
  const plantId = parseInt(c.req.param('plantId'))
  
  try {
    const audits = await env.DB.prepare(`
      SELECT 
        ea.id,
        ea.audit_token,
        ea.project_name,
        ea.client_name,
        ea.total_modules,
        ea.completion_rate,
        ea.status,
        ea.created_at
      FROM el_audits ea
      JOIN intervention_plants ip ON ea.intervention_id = ip.intervention_id
      WHERE ip.plant_id = ?
      ORDER BY ea.created_at DESC
    `).bind(plantId).all()
    
    return c.json({
      plantId,
      audits: audits.results
    })
    
  } catch (error: any) {
    return c.json({ 
      error: 'Erreur récupération audits', 
      details: error?.message 
    }, 500)
  }
})

// ============================================================================
// POST /link-audit-zone - Lier audit EL à zone PV spécifique
// ============================================================================
interconnectModule.post('/link-audit-zone', async (c) => {
  const { env } = c
  const { auditToken, zoneId } = await c.req.json()
  
  if (!auditToken || !zoneId) {
    return c.json({ error: 'auditToken et zoneId requis' }, 400)
  }
  
  try {
    // Récupérer audit
    const audit = await env.DB.prepare(`
      SELECT id FROM el_audits WHERE audit_token = ?
    `).bind(auditToken).first()
    
    if (!audit) {
      return c.json({ error: 'Audit non trouvé' }, 404)
    }
    
    // Récupérer zone
    const zone = await env.DB.prepare(`
      SELECT id, zone_name FROM pv_zones WHERE id = ?
    `).bind(zoneId).first()
    
    if (!zone) {
      return c.json({ error: 'Zone non trouvée' }, 404)
    }
    
    // Créer lien
    await env.DB.prepare(`
      INSERT OR REPLACE INTO el_audit_zones (el_audit_id, audit_token, zone_id, zone_name)
      VALUES (?, ?, ?, ?)
    `).bind(audit.id, auditToken, zoneId, zone.zone_name).run()
    
    return c.json({
      success: true,
      auditId: audit.id,
      zoneId,
      zoneName: zone.zone_name
    })
    
  } catch (error: any) {
    return c.json({ 
      error: 'Erreur création lien zone', 
      details: error?.message 
    }, 500)
  }
})

// ============================================================================
// GET /audit/:token/zones - Obtenir zones PV liées à audit EL
// ============================================================================
interconnectModule.get('/audit/:token/zones', async (c) => {
  const { env } = c
  const token = c.req.param('token')
  
  try {
    const zones = await env.DB.prepare(`
      SELECT 
        z.id AS zone_id,
        z.zone_name,
        z.plant_id,
        z.module_count,
        z.layout_type,
        p.plant_name
      FROM el_audit_zones eaz
      JOIN pv_zones z ON eaz.zone_id = z.id
      LEFT JOIN pv_plants p ON z.plant_id = p.id
      WHERE eaz.audit_token = ?
    `).bind(token).all()
    
    return c.json({
      auditToken: token,
      zones: zones.results
    })
    
  } catch (error: any) {
    return c.json({ 
      error: 'Erreur récupération zones', 
      details: error?.message 
    }, 500)
  }
})

export default interconnectModule
