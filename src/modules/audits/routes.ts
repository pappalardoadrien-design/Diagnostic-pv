// ============================================================================
// ROUTES API - AUDITS MULTI-MODULES
// ============================================================================
// Gestion centralisée des audits via el_audits (table principale)
// ============================================================================

import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
  KV: KVNamespace
}

const auditsRouter = new Hono<{ Bindings: Bindings }>()

// ============================================================================
// GET /api/audits?project_id=X
// Lister audits (filtrable par projet/plant)
// ============================================================================
auditsRouter.get('/', async (c) => {
  const { env } = c
  const projectId = c.req.query('project_id')
  const plantId = c.req.query('plant_id')
  
  try {
    let query = `
      SELECT 
        a.*,
        COUNT(DISTINCT em.id) as el_modules_count,
        p.name as project_name_full,
        cl.company_name as client_name_full
      FROM el_audits a
      LEFT JOIN el_modules em ON em.audit_token = a.audit_token
      LEFT JOIN pv_cartography_audit_links pcal ON pcal.el_audit_token = a.audit_token
      LEFT JOIN projects p ON p.id = pcal.pv_plant_id
      LEFT JOIN crm_clients cl ON cl.id = p.client_id
    `
    
    const conditions: string[] = []
    const params: any[] = []
    
    if (projectId) {
      conditions.push('pcal.pv_plant_id = ?')
      params.push(parseInt(projectId))
    }
    if (plantId) {
      conditions.push('a.plant_id = ?')
      params.push(parseInt(plantId))
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ')
    }
    
    query += ' GROUP BY a.id ORDER BY a.created_at DESC'
    
    const statement = env.DB.prepare(query).bind(...params)
    const { results } = await statement.all()
    
    return c.json({
      success: true,
      audits: results,
      count: results.length
    })
  } catch (error: any) {
    console.error('Erreur liste audits:', error)
    return c.json({ error: error.message }, 500)
  }
})

// ============================================================================
// POST /api/audits
// Créer un audit (crée dans el_audits)
// ============================================================================
auditsRouter.post('/', async (c) => {
  const { env } = c
  const requestData = await c.req.json()
  
  const {
    audit_token,
    intervention_id,
    project_name,
    client_name,
    location,
    plant_id,
    string_count,
    modules_per_string,
    total_modules,
    configuration_json,
    status = 'created'
  } = requestData
  
  try {
    if (!project_name) {
      return c.json({ error: 'project_name requis' }, 400)
    }
    
    const token = audit_token || `EL-${Date.now()}-${Math.random().toString(36).substring(7)}`.toUpperCase()
    
    const auditInsert = await env.DB.prepare(`
      INSERT INTO el_audits (
        audit_token, intervention_id, project_name, client_name, location,
        plant_id, string_count, modules_per_string, total_modules,
        configuration_json, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      token,
      intervention_id || null,
      project_name,
      client_name || '',
      location || '',
      plant_id || null,
      string_count || 0,
      modules_per_string || 0,
      total_modules || 0,
      configuration_json || null,
      status
    ).run()
    
    return c.json({
      success: true,
      audit_id: auditInsert.meta.last_row_id,
      audit_token: token,
      project_name,
      client_name,
      location,
      status
    })
    
  } catch (error: any) {
    console.error('Erreur création audit:', error)
    return c.json({ error: 'Erreur création audit', details: error.message }, 500)
  }
})

// ============================================================================
// POST /api/audits/create-multi-modules
// Créer un audit multi-modules depuis intervention OU saisie manuelle
// ============================================================================
auditsRouter.post('/create-multi-modules', async (c) => {
  const { env } = c
  const requestData = await c.req.json()
  
  const {
    intervention_id,
    project_name,
    client_name,
    location,
    configuration,
    modules,
    plant_id
  } = requestData
  
  try {
    const modulesEnabled = modules || ['EL']
    if (!Array.isArray(modulesEnabled) || modulesEnabled.length === 0) {
      return c.json({ error: 'Au moins un module doit être sélectionné' }, 400)
    }
    
    const auditToken = `EL-${Date.now()}-${Math.random().toString(36).substring(7)}`.toUpperCase()
    
    let finalProjectName = project_name
    let finalClientName = client_name
    let finalLocation = location
    let configJson: string | null = null
    let finalPlantId = plant_id || null
    
    // OPTION A : Création depuis intervention
    if (intervention_id) {
      const intervention = await env.DB.prepare(`
        SELECT 
          i.id, i.intervention_date, i.intervention_type,
          i.project_id,
          p.name as project_name, p.module_count, p.total_power_kwp,
          p.site_address, p.notes,
          cl.company_name as client_name
        FROM interventions i
        LEFT JOIN projects p ON i.project_id = p.id
        LEFT JOIN crm_clients cl ON cl.id = p.client_id
        WHERE i.id = ?
      `).bind(intervention_id).first()
      
      if (!intervention) {
        return c.json({ error: 'Intervention non trouvée' }, 404)
      }
      
      finalProjectName = (intervention as any).project_name || 'Projet sans nom'
      finalClientName = (intervention as any).client_name || 'Client sans nom'
      finalLocation = (intervention as any).site_address || 'Localisation non renseignée'
    }
    // OPTION B : Saisie manuelle
    else {
      if (!project_name || !client_name) {
        return c.json({ error: 'project_name et client_name requis' }, 400)
      }
      if (configuration) {
        configJson = JSON.stringify(configuration)
      }
    }
    
    // Parsing config pour dimensionnement
    let totalModules = 0, stringCount = 0, modulesPerString = 0
    if (configJson) {
      try {
        const config = JSON.parse(configJson)
        if (config.mode === 'advanced' && config.strings) {
          totalModules = config.strings.reduce((sum: number, s: any) => sum + (s.moduleCount || 0), 0)
          stringCount = config.strings.length
        } else if (config.mode === 'simple') {
          stringCount = config.stringCount || 0
          modulesPerString = config.modulesPerString || 0
          totalModules = stringCount * modulesPerString
        }
      } catch (e) { console.error('Error parsing config:', e) }
    }
    
    // Créer el_audits
    const auditInsert = await env.DB.prepare(`
      INSERT INTO el_audits (
        audit_token, intervention_id, project_name, client_name, location,
        plant_id, string_count, modules_per_string, total_modules,
        configuration_json, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'created', datetime('now'), datetime('now'))
    `).bind(
      auditToken, intervention_id || null,
      finalProjectName, finalClientName, finalLocation,
      finalPlantId, stringCount, modulesPerString, totalModules, configJson
    ).run()
    
    const auditId = auditInsert.meta.last_row_id
    
    // Générer el_modules si EL activé + config dispo
    if (modulesEnabled.includes('EL') && configJson) {
      const config = JSON.parse(configJson)
      if (config.mode === 'simple') {
        for (let s = 1; s <= stringCount; s++) {
          for (let m = 1; m <= modulesPerString; m++) {
            await env.DB.prepare(`
              INSERT INTO el_modules (el_audit_id, audit_token, module_identifier, string_number, position_in_string, defect_type, severity_level, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, 'pending', 0, datetime('now'), datetime('now'))
            `).bind(auditId, auditToken, `S${s}-${m}`, s, m).run()
          }
        }
      }
    }
    
    return c.json({
      success: true,
      audit_id: auditId,
      audit_token: auditToken,
      project_name: finalProjectName,
      client_name: finalClientName,
      location: finalLocation,
      modules_enabled: modulesEnabled,
      modules: {
        el: modulesEnabled.includes('EL') ? { enabled: true, url: `/audit/${auditToken}` } : undefined,
        iv: modulesEnabled.includes('IV') ? { enabled: true, url: `/iv-curves?audit_token=${auditToken}` } : undefined,
        visual: modulesEnabled.includes('VISUAL') ? { enabled: true, url: `/visual?audit_token=${auditToken}` } : undefined,
        isolation: modulesEnabled.includes('ISOLATION') ? { enabled: true, url: `/isolation?audit_token=${auditToken}` } : undefined,
        photos: { enabled: true, url: `/audit/${auditToken}/photos` }
      }
    })
    
  } catch (error: any) {
    console.error('Erreur création audit multi-modules:', error)
    return c.json({ error: 'Erreur création audit', details: error.message }, 500)
  }
})

// ============================================================================
// GET /api/audits/list
// Liste tous les audits avec détails
// ============================================================================
auditsRouter.get('/list', async (c) => {
  const { env } = c
  
  try {
    const audits = await env.DB.prepare(`
      SELECT 
        a.*,
        cl.company_name as client_company
      FROM el_audits a
      LEFT JOIN pv_cartography_audit_links pcal ON pcal.el_audit_token = a.audit_token
      LEFT JOIN projects p ON p.id = pcal.pv_plant_id
      LEFT JOIN crm_clients cl ON cl.id = p.client_id
      ORDER BY a.created_at DESC
      LIMIT 100
    `).all()
    
    return c.json({ 
      success: true, 
      audits: audits.results,
      count: audits.results.length
    })
  } catch (error: any) {
    return c.json({ error: 'Erreur récupération audits', details: error.message }, 500)
  }
})

// ============================================================================
// GET /api/audits/:token
// Détails d'un audit avec tous ses modules
// ============================================================================
auditsRouter.get('/:token', async (c) => {
  const { env } = c
  const token = c.req.param('token')
  
  try {
    const audit = await env.DB.prepare(`
      SELECT * FROM el_audits WHERE audit_token = ?
    `).bind(token).first()
    
    if (!audit) {
      return c.json({ error: 'Audit non trouvé' }, 404)
    }
    
    // Stats par module
    const modulesStats: any = {}
    
    const elStats = await env.DB.prepare(`
      SELECT COUNT(*) as total,
             SUM(CASE WHEN defect_type NOT IN ('pending', 'ok') THEN 1 ELSE 0 END) as defects
      FROM el_modules WHERE audit_token = ?
    `).bind(token).first()
    modulesStats.el = elStats
    
    const ivStats = await env.DB.prepare(`
      SELECT COUNT(*) as total FROM iv_curves WHERE audit_token = ?
    `).bind(token).first()
    modulesStats.iv = ivStats
    
    const isolationStats = await env.DB.prepare(`
      SELECT COUNT(*) as total FROM isolation_tests WHERE audit_el_token = ?
    `).bind(token).first()
    modulesStats.isolation = isolationStats
    
    return c.json({
      success: true,
      audit,
      modules_stats: modulesStats
    })
  } catch (error: any) {
    return c.json({ error: 'Erreur récupération audit', details: error.message }, 500)
  }
})

// ============================================================================
// POST /api/audits/:token/synthesis
// ============================================================================
auditsRouter.post('/:token/synthesis', async (c) => {
  const { env } = c
  const token = c.req.param('token')
  const { expert_synthesis, recommendations } = await c.req.json()

  try {
    const audit = await env.DB.prepare('SELECT id FROM el_audits WHERE audit_token = ?').bind(token).first()
    if (!audit) return c.json({ error: 'Audit non trouvé' }, 404)

    // Store synthesis in el_audit_notes as a workaround (el_audits doesn't have synthesis columns)
    await env.DB.prepare(`
      INSERT INTO el_audit_notes (el_audit_id, audit_token, note_type, content, created_at)
      VALUES (?, ?, 'synthesis', ?, datetime('now'))
    `).bind((audit as any).id, token, JSON.stringify({ expert_synthesis, recommendations })).run()

    return c.json({ success: true, message: 'Synthèse enregistrée' })
  } catch (error: any) {
    console.error('Erreur sauvegarde synthèse:', error)
    return c.json({ error: 'Erreur sauvegarde synthèse', details: error.message }, 500)
  }
})

export default auditsRouter
