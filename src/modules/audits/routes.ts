// ============================================================================
// ROUTES API - AUDITS MULTI-MODULES
// ============================================================================
// Gestion centralisée des audits avec sélection de modules
// Architecture : 1 audit → N modules (EL, I-V, Visuels, Isolation)
// ============================================================================

import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
  KV: KVNamespace
}

const auditsRouter = new Hono<{ Bindings: Bindings }>()

// ============================================================================
// GET /api/audits?project_id=X
// Lister audits (filtrable par projet/client/intervention)
// ============================================================================
auditsRouter.get('/', async (c) => {
  const { env } = c
  const projectId = c.req.query('project_id')
  const clientId = c.req.query('client_id')
  const interventionId = c.req.query('intervention_id')
  
  try {
    let query = `
      SELECT 
        a.*,
        COUNT(DISTINCT em.id) as el_modules_count,
        p.name as project_name_full,
        cl.company_name as client_name_full
      FROM audits a
      LEFT JOIN el_modules em ON em.audit_token = a.audit_token
      LEFT JOIN projects p ON p.id = a.project_id
      LEFT JOIN crm_clients cl ON cl.id = a.client_id
    `
    
    const conditions = []
    const params = []
    
    if (projectId) {
      conditions.push('a.project_id = ?')
      params.push(parseInt(projectId))
    }
    if (clientId) {
      conditions.push('a.client_id = ?')
      params.push(parseInt(clientId))
    }
    if (interventionId) {
      conditions.push('a.intervention_id = ?')
      params.push(parseInt(interventionId))
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
// Créer un audit simple (pour dashboard GIRASOLE)
// ============================================================================
auditsRouter.post('/', async (c) => {
  const { env } = c
  const requestData = await c.req.json()
  
  const {
    audit_token,
    client_id,
    project_id,
    intervention_id,
    project_name,
    client_name,
    location,
    status = 'pending',
    modules_enabled = '["VISUAL"]'
  } = requestData
  
  try {
    // Validation
    if (!audit_token || !project_name) {
      return c.json({ error: 'audit_token et project_name requis' }, 400)
    }
    
    // Créer audit simple
    const auditInsert = await env.DB.prepare(`
      INSERT INTO audits (
        audit_token, intervention_id, client_id, project_id,
        project_name, client_name, location,
        modules_enabled, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      audit_token,
      intervention_id || null,
      client_id || null,
      project_id || null,
      project_name,
      client_name || 'Client sans nom',
      location || '',
      typeof modules_enabled === 'string' ? modules_enabled : JSON.stringify(modules_enabled),
      status
    ).run()
    
    const auditId = auditInsert.meta.last_row_id
    
    return c.json({
      success: true,
      audit_id: auditId,
      audit_token: audit_token,
      project_name,
      client_name,
      location,
      status
    })
    
  } catch (error: any) {
    console.error('Erreur création audit simple:', error)
    return c.json({ 
      error: 'Erreur lors de la création de l\'audit',
      details: error.message 
    }, 500)
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
    intervention_id,     // Option A: depuis intervention
    project_name,        // Option B: saisie manuelle
    client_name,
    location,
    configuration,
    modules              // Array: ["EL", "IV", "VISUAL", "ISOLATION"]
  } = requestData
  
  try {
    // Validation
    const modulesEnabled = modules || ['EL']
    if (!Array.isArray(modulesEnabled) || modulesEnabled.length === 0) {
      return c.json({ error: 'Au moins un module doit être sélectionné' }, 400)
    }
    
    // Génération token unique
    const auditToken = crypto.randomUUID()
    
    let finalProjectName = project_name
    let finalClientName = client_name
    let finalLocation = location
    let finalClientId: number | null = null
    let finalProjectId: number | null = null
    let configJson: string | null = null
    
    // OPTION A : Création depuis intervention (hérite config PV)
    if (intervention_id) {
      let intervention;
      try {
        // Tentative 1: Avec toutes les colonnes (si migration appliquée)
        intervention = await env.DB.prepare(`
          SELECT 
            i.id, i.intervention_date, i.intervention_type,
            i.project_id, i.client_id,
            p.name as project_name, p.module_count, p.total_power_kwp,
            p.address_street, p.address_postal_code, p.address_city,
            p.inverter_count, p.inverter_brand, p.junction_box_count,
            p.strings_configuration, p.technical_notes,
            p.notes,
            c.company_name as client_name
          FROM interventions i
          LEFT JOIN projects p ON i.project_id = p.id
          LEFT JOIN crm_clients c ON i.client_id = c.id
          WHERE i.id = ?
        `).bind(intervention_id).first()
      } catch (e) {
        // Tentative 2: Mode compatibilité (colonnes manquantes)
        console.warn('Intervention query failed (schema mismatch), retrying simple query');
        intervention = await env.DB.prepare(`
          SELECT 
            i.id, i.intervention_date, i.intervention_type,
            i.project_id, i.client_id,
            p.name as project_name, p.module_count, p.total_power_kwp,
            p.address_street, p.address_postal_code, p.address_city,
            p.notes,
            c.company_name as client_name
          FROM interventions i
          LEFT JOIN projects p ON i.project_id = p.id
          LEFT JOIN crm_clients c ON i.client_id = c.id
          WHERE i.id = ?
        `).bind(intervention_id).first()
      }
      
      if (!intervention) {
        return c.json({ error: 'Intervention non trouvée' }, 404)
      }
      
      finalProjectName = intervention.project_name || 'Projet sans nom'
      finalClientName = intervention.client_name || 'Client sans nom'
      finalLocation = [
        intervention.address_street,
        intervention.address_postal_code,
        intervention.address_city
      ].filter(Boolean).join(', ') || 'Localisation non renseignée'
      
      finalClientId = intervention.client_id
      finalProjectId = intervention.project_id
      configJson = intervention.strings_configuration
      
      // Récupération depuis les notes si nécessaire (Mode Compatibilité)
      if (!configJson && intervention.notes && intervention.notes.includes('[MIGRATION_PENDING_DATA]')) {
        try {
            const parts = intervention.notes.split('[MIGRATION_PENDING_DATA]');
            if (parts.length > 1) {
                const jsonPart = parts[1].trim();
                const parsed = JSON.parse(jsonPart);
                configJson = parsed.strings_configuration;
                console.log('Configuration récupérée depuis les notes (Compatibility Mode)');
            }
        } catch(e) { console.error('Erreur parsing configuration depuis notes', e); }
      }
    }
    // OPTION B : Saisie manuelle
    else {
      if (!project_name || !client_name) {
        return c.json({ 
          error: 'project_name et client_name requis pour saisie manuelle' 
        }, 400)
      }
      
      if (configuration) {
        configJson = JSON.stringify(configuration)
      }
    }
    
    // Créer audit master
    const auditInsert = await env.DB.prepare(`
      INSERT INTO audits (
        audit_token, intervention_id, client_id, project_id,
        project_name, client_name, location,
        modules_enabled, configuration_json,
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'en_cours', datetime('now'), datetime('now'))
    `).bind(
      auditToken,
      intervention_id || null,
      finalClientId,
      finalProjectId,
      finalProjectName,
      finalClientName,
      finalLocation,
      JSON.stringify(modulesEnabled),
      configJson
    ).run()
    
    const auditId = auditInsert.meta.last_row_id
    
    // Résultat à retourner
    const result: any = {
      success: true,
      audit_id: auditId,
      audit_token: auditToken,
      project_name: finalProjectName,
      client_name: finalClientName,
      location: finalLocation,
      modules_enabled: modulesEnabled,
      modules: {}
    }
    
    // ========================================================================
    // MODULE EL : Créer el_audits + el_modules
    // ========================================================================
    if (modulesEnabled.includes('EL')) {
      let totalModules = 0
      let stringCount = 0
      let modulesPerString = 0
      
      // Parser configuration
      if (configJson) {
        try {
          const config = JSON.parse(configJson)
          if (config.mode === 'advanced' && config.strings) {
            totalModules = config.strings.reduce((sum: number, s: any) => 
              sum + (s.moduleCount || 0), 0)
            stringCount = config.strings.length
          } else if (config.mode === 'simple') {
            stringCount = config.stringCount || 0
            modulesPerString = config.modulesPerString || 0
            totalModules = stringCount * modulesPerString
          }
        } catch (e) {
          console.error('Error parsing config:', e)
        }
      }
      
      // Créer el_audits
      await env.DB.prepare(`
        INSERT INTO el_audits (
          audit_id, audit_token, intervention_id,
          project_name, client_name, location,
          string_count, modules_per_string, total_modules,
          configuration_json, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'created', datetime('now'), datetime('now'))
      `).bind(
        auditId, auditToken, intervention_id || null,
        finalProjectName, finalClientName, finalLocation,
        stringCount, modulesPerString, totalModules,
        configJson
      ).run()
      
      // Générer el_modules si config disponible
      if (configJson) {
        const config = JSON.parse(configJson)
        
        if (config.mode === 'advanced' && config.strings) {
          // Mode avancé
          for (const stringConfig of config.strings) {
            if (stringConfig.moduleCount > 0) {
              const stringNumber = stringConfig.mpptNumber || stringConfig.id
              
              for (let modulePos = 1; modulePos <= stringConfig.moduleCount; modulePos++) {
                const moduleIdentifier = `S${stringNumber}-${modulePos}`
                
                await env.DB.prepare(`
                  INSERT INTO el_modules (
                    el_audit_id, audit_token, module_identifier,
                    string_number, position_in_string,
                    defect_type, severity_level,
                    physical_row, physical_col,
                    created_at, updated_at
                  )
                  SELECT id, ?, ?, ?, ?, 'pending', 0, ?, ?, datetime('now'), datetime('now')
                  FROM el_audits WHERE audit_token = ?
                `).bind(
                  auditToken,
                  moduleIdentifier,
                  stringNumber,
                  modulePos,
                  stringConfig.physicalRow || stringNumber,
                  (stringConfig.physicalCol || 0) + modulePos - 1,
                  auditToken
                ).run()
              }
            }
          }
        } else if (config.mode === 'simple') {
          // Mode simple
          for (let s = 1; s <= stringCount; s++) {
            for (let m = 1; m <= modulesPerString; m++) {
              const moduleIdentifier = `S${s}-${m}`
              
              await env.DB.prepare(`
                INSERT INTO el_modules (
                  el_audit_id, audit_token, module_identifier,
                  string_number, position_in_string,
                  defect_type, severity_level,
                  physical_row, physical_col,
                  created_at, updated_at
                )
                SELECT id, ?, ?, ?, ?, 'pending', 0, ?, ?, datetime('now'), datetime('now')
                FROM el_audits WHERE audit_token = ?
              `).bind(
                auditToken,
                moduleIdentifier,
                s, m,
                s, m - 1,
                auditToken
              ).run()
            }
          }
        }
      }
      
      result.modules.el = {
        enabled: true,
        url: `/audit/${auditToken}`,
        modules_count: totalModules
      }
      
      // ========================================================================
      // AUTO-CREATE SHARED_CONFIGURATIONS (Hook automatique)
      // ========================================================================
      try {
        await env.DB.prepare(`
          INSERT INTO shared_configurations (
            audit_id, audit_token,
            string_count, modules_per_string, total_modules,
            advanced_config, is_advanced_mode,
            validation_status, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', 'system_auto_create')
        `).bind(
          auditId,
          auditToken,
          stringCount || null,
          modulesPerString || null,
          totalModules,
          configJson,
          configJson ? 1 : 0
        ).run()
        
        console.log(`✅ shared_configurations créée automatiquement pour audit ${auditToken}`)
      } catch (sharedConfigError) {
        console.warn('⚠️ Impossible de créer shared_configurations:', sharedConfigError)
        // Non-bloquant, on continue
      }
    }
    
    // ========================================================================
    // MODULE I-V : Marquer comme activé (données ajoutées via import CSV)
    // ========================================================================
    if (modulesEnabled.includes('IV')) {
      result.modules.iv = {
        enabled: true,
        url: `/audit/${auditToken}/iv`,
        import_url: `/api/iv/measurements/${auditToken}`
      }
    }
    
    // ========================================================================
    // MODULE VISUELS : Marquer comme activé
    // ========================================================================
    if (modulesEnabled.includes('VISUAL')) {
      result.modules.visual = {
        enabled: true,
        url: `/audit/${auditToken}/visual`,
        api_url: `/api/visual/inspections/${auditToken}`
      }
    }
    
    // ========================================================================
    // MODULE ISOLATION : Marquer comme activé
    // ========================================================================
    if (modulesEnabled.includes('ISOLATION')) {
      result.modules.isolation = {
        enabled: true,
        url: `/audit/${auditToken}/isolation`,
        api_url: `/api/isolation/tests/${auditToken}`
      }
    }
    
    return c.json(result)
    
  } catch (error: any) {
    console.error('Erreur création audit multi-modules:', error)
    return c.json({ 
      error: 'Erreur lors de la création de l\'audit',
      details: error.message 
    }, 500)
  }
})

// ============================================================================
// GET /api/audits/list
// Liste tous les audits avec leurs modules
// ============================================================================
auditsRouter.get('/list', async (c) => {
  const { env } = c
  
  try {
    const audits = await env.DB.prepare(`
      SELECT 
        a.*,
        c.company_name as client_company,
        i.intervention_date
      FROM audits a
      LEFT JOIN crm_clients c ON a.client_id = c.id
      LEFT JOIN interventions i ON a.intervention_id = i.id
      ORDER BY a.created_at DESC
      LIMIT 100
    `).all()
    
    return c.json({ 
      success: true, 
      audits: audits.results,
      count: audits.results.length
    })
  } catch (error: any) {
    return c.json({ 
      error: 'Erreur récupération audits',
      details: error.message 
    }, 500)
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
      SELECT * FROM audits WHERE audit_token = ?
    `).bind(token).first()
    
    if (!audit) {
      return c.json({ error: 'Audit non trouvé' }, 404)
    }
    
    // Récupérer stats par module
    const modulesEnabled = JSON.parse(audit.modules_enabled as string)
    const modulesStats: any = {}
    
    if (modulesEnabled.includes('EL')) {
      const elStats = await env.DB.prepare(`
        SELECT COUNT(*) as total,
               SUM(CASE WHEN defect_type != 'pending' AND defect_type != 'ok' THEN 1 ELSE 0 END) as defects
        FROM el_modules
        WHERE audit_token = ?
      `).bind(token).first()
      
      modulesStats.el = elStats
    }
    
    if (modulesEnabled.includes('IV')) {
      const ivStats = await env.DB.prepare(`
        SELECT COUNT(*) as total
        FROM iv_measurements
        WHERE audit_token = ?
      `).bind(token).first()
      
      modulesStats.iv = ivStats
    }
    
    if (modulesEnabled.includes('VISUAL')) {
      const visualStats = await env.DB.prepare(`
        SELECT COUNT(*) as total,
               SUM(defect_found) as defects
        FROM visual_inspections
        WHERE audit_token = ?
      `).bind(token).first()
      
      modulesStats.visual = visualStats
    }
    
    if (modulesEnabled.includes('ISOLATION')) {
      const isolationStats = await env.DB.prepare(`
        SELECT COUNT(*) as total
        FROM isolation_tests
        WHERE audit_token = ?
      `).bind(token).first()
      
      modulesStats.isolation = isolationStats
    }
    
    return c.json({
      success: true,
      audit,
      modules_stats: modulesStats
    })
  } catch (error: any) {
    return c.json({ 
      error: 'Erreur récupération audit',
      details: error.message 
    }, 500)
  }
})

// ============================================================================
// POST /api/audits/:token/synthesis - Enregistrer la synthèse de l'expert
// ============================================================================
auditsRouter.post('/:token/synthesis', async (c) => {
  const { env } = c
  const token = c.req.param('token')
  const { expert_synthesis, recommendations } = await c.req.json()

  try {
    // Vérifier si audit existe
    const audit = await env.DB.prepare('SELECT id FROM audits WHERE audit_token = ?').bind(token).first()
    if (!audit) return c.json({ error: 'Audit non trouvé' }, 404)

    // Update
    await env.DB.prepare(`
      UPDATE audits SET 
        expert_synthesis = ?,
        recommendations = ?,
        updated_at = datetime('now')
      WHERE audit_token = ?
    `).bind(expert_synthesis, recommendations, token).run()

    return c.json({ success: true, message: 'Synthèse enregistrée' })
  } catch (error: any) {
    console.error('Erreur sauvegarde synthèse:', error)
    return c.json({ error: 'Erreur sauvegarde synthèse', details: error.message }, 500)
  }
})

export default auditsRouter
