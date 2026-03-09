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
    // Méthode 1: Via intervention_plants (ancien workflow)
    let result = await env.DB.prepare(`
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
    
    // Méthode 2: Via pv_cartography_audit_links (liaison PV zones → audit EL)
    if (!result) {
      try {
        result = await env.DB.prepare(`
          SELECT DISTINCT
            p.id AS plant_id,
            p.plant_name,
            p.address || ', ' || p.city AS location,
            p.total_power_kwp,
            (SELECT COUNT(*) FROM pv_modules pm JOIN pv_zones pz ON pm.zone_id = pz.id WHERE pz.plant_id = p.id) AS total_modules,
            p.latitude,
            p.longitude
          FROM pv_cartography_audit_links pcal
          JOIN pv_plants p ON pcal.pv_plant_id = p.id
          WHERE pcal.el_audit_token = ?
          LIMIT 1
        `).bind(token).first()
      } catch (e) {
        console.warn('pv_cartography_audit_links query failed:', e)
      }
    }
    
    // Méthode 3: Via el_audit_plants (ancien workflow)
    if (!result) {
      try {
        result = await env.DB.prepare(`
          SELECT 
            p.id AS plant_id,
            p.plant_name,
            p.address || ', ' || p.city AS location,
            p.total_power_kwp,
            p.module_count AS total_modules,
            p.latitude,
            p.longitude
          FROM el_audit_plants eap
          JOIN pv_plants p ON eap.plant_id = p.id
          WHERE eap.audit_token = ?
          LIMIT 1
        `).bind(token).first()
      } catch (e) {
        // Table el_audit_plants n'existe pas encore - ignorer
        console.warn('el_audit_plants table not found, skipping')
      }
    }
    
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

// ============================================================================
// POST /auto-link - Auto-liaison intelligente audits ↔ plants
// Match par client_name, project_name, et mise à jour plant_id + pv_cartography_audit_links
// ============================================================================
interconnectModule.post('/auto-link', async (c) => {
  const { env } = c;
  const results: { linked: any[]; already_linked: any[]; no_match: any[]; errors: string[] } = {
    linked: [], already_linked: [], no_match: [], errors: []
  };

  try {
    // 1. Récupérer tous les audits EL
    const audits = await env.DB.prepare(`
      SELECT id, audit_token, project_name, client_name, plant_id, created_at 
      FROM el_audits ORDER BY created_at DESC
    `).all();

    // 2. Récupérer toutes les centrales PV avec client info
    const plants = await env.DB.prepare(`
      SELECT p.id as plant_id, p.plant_name, p.client_id, c.company_name as client_name
      FROM pv_plants p
      LEFT JOIN crm_clients c ON p.client_id = c.id
    `).all();

    // 3. Récupérer les zones de chaque plant
    const zones = await env.DB.prepare(`
      SELECT id as zone_id, plant_id FROM pv_zones
    `).all();

    const zonesByPlant: Record<number, number[]> = {};
    for (const z of (zones.results || [])) {
      const pid = (z as any).plant_id;
      if (!zonesByPlant[pid]) zonesByPlant[pid] = [];
      zonesByPlant[pid].push((z as any).zone_id);
    }

    // 4. Pour chaque audit, essayer de trouver une correspondance
    for (const audit of (audits.results || [])) {
      const a = audit as any;
      
      // Déjà lié ?
      if (a.plant_id) {
        results.already_linked.push({ audit_id: a.id, audit_token: a.audit_token, project_name: a.project_name, plant_id: a.plant_id });
        continue;
      }

      // Chercher correspondance par client_name
      let bestMatch: any = null;
      let matchType = '';

      for (const plant of (plants.results || [])) {
        const p = plant as any;
        const auditClient = (a.client_name || '').toLowerCase().trim();
        const auditProject = (a.project_name || '').toLowerCase().trim();
        const plantName = (p.plant_name || '').toLowerCase().trim();
        const plantClient = (p.client_name || '').toLowerCase().trim();

        // Match exact client_name
        if (auditClient && plantClient && auditClient === plantClient) {
          // Si plusieurs plants pour même client, matcher par nom projet contenant nom plant
          if (auditProject.includes(plantName.split(' ')[0]) || plantName.includes(auditProject.split(' ')[0])) {
            bestMatch = p;
            matchType = 'client+name';
            break;
          }
          if (!bestMatch) { bestMatch = p; matchType = 'client'; }
        }

        // Match par nom de plant contenu dans project_name
        if (!bestMatch && auditProject && plantName) {
          const plantWords = plantName.split(/[\s\-\(\)]+/).filter((w: string) => w.length > 2);
          const matchCount = plantWords.filter((w: string) => auditProject.includes(w)).length;
          if (matchCount >= 2 || (plantWords.length === 1 && matchCount === 1)) {
            bestMatch = p;
            matchType = 'name_fuzzy';
          }
        }
      }

      if (bestMatch) {
        try {
          // Mettre à jour plant_id sur el_audits
          await env.DB.prepare(`UPDATE el_audits SET plant_id = ? WHERE id = ?`).bind(bestMatch.plant_id, a.id).run();

          // Créer lien dans pv_cartography_audit_links (pour la première zone)
          const plantZones = zonesByPlant[bestMatch.plant_id] || [];
          if (plantZones.length > 0) {
            try {
              await env.DB.prepare(`
                INSERT OR IGNORE INTO pv_cartography_audit_links (pv_plant_id, pv_zone_id, el_audit_id, el_audit_token, link_type)
                VALUES (?, ?, ?, ?, 'auto')
              `).bind(bestMatch.plant_id, plantZones[0], a.id, a.audit_token).run();
            } catch (e) { /* link may already exist */ }
          }

          results.linked.push({
            audit_id: a.id, audit_token: a.audit_token, project_name: a.project_name,
            plant_id: bestMatch.plant_id, plant_name: bestMatch.plant_name, match_type: matchType
          });
        } catch (e: any) {
          results.errors.push(`Audit ${a.id}: ${e.message}`);
        }
      } else {
        results.no_match.push({ audit_id: a.id, audit_token: a.audit_token, project_name: a.project_name, client_name: a.client_name });
      }
    }

    return c.json({
      success: true,
      summary: {
        total_audits: (audits.results || []).length,
        linked: results.linked.length,
        already_linked: results.already_linked.length,
        no_match: results.no_match.length,
        errors: results.errors.length
      },
      details: results
    });

  } catch (error: any) {
    return c.json({ error: 'Erreur auto-link', details: error.message }, 500);
  }
});

// ============================================================================
// GET /status - Rapport d'interconnexion globale
// ============================================================================
interconnectModule.get('/status', async (c) => {
  const { env } = c;
  try {
    const audits = await env.DB.prepare(`SELECT COUNT(*) as total, SUM(CASE WHEN plant_id IS NOT NULL THEN 1 ELSE 0 END) as linked FROM el_audits`).first<any>();
    const links = await env.DB.prepare(`SELECT COUNT(*) as total FROM pv_cartography_audit_links`).first<any>();
    const plants = await env.DB.prepare(`SELECT COUNT(*) as total FROM pv_plants`).first<any>();
    const clients = await env.DB.prepare(`SELECT COUNT(*) as total FROM crm_clients`).first<any>();
    
    return c.json({
      success: true,
      interconnection: {
        el_audits: { total: audits?.total || 0, linked_to_plant: audits?.linked || 0, unlinked: (audits?.total || 0) - (audits?.linked || 0) },
        pv_cartography_links: links?.total || 0,
        pv_plants: plants?.total || 0,
        crm_clients: clients?.total || 0
      }
    });
  } catch (error: any) {
    return c.json({ error: 'Erreur status', details: error.message }, 500);
  }
});

export default interconnectModule
