// ============================================================================
// MODULE VISUAL - API ROUTES
// ============================================================================
// Routes API pour inspections visuelles PV
// Intégration avec shared_configurations
// ============================================================================

import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

// ============================================================================
// ROUTE 1: GET /api/visual/inspections/:auditToken
// Liste toutes les inspections visuelles pour un audit
// ============================================================================
app.get('/inspections/:auditToken', async (c) => {
  const { DB } = c.env
  const auditToken = c.req.param('auditToken')

  try {
    // Récupérer toutes les inspections visuelles
    const inspections = await DB.prepare(`
      SELECT * FROM visual_inspections
      WHERE audit_token = ?
      ORDER BY inspection_date DESC, created_at DESC
    `).bind(auditToken).all()

    // Statistiques
    const stats = await DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(defects_found) as total_defects,
        SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical_count
      FROM visual_inspections
      WHERE audit_token = ?
    `).bind(auditToken).first()

    return c.json({
      success: true,
      inspections: inspections.results || [],
      stats: stats || { total: 0, total_defects: 0, critical_count: 0 }
    })

  } catch (error: any) {
    console.error('Erreur liste inspections visuelles:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ============================================================================
// ROUTE 2: POST /api/visual/inspections/:auditToken
// Ajouter une nouvelle inspection visuelle
// ============================================================================
app.post('/inspections/:auditToken', async (c) => {
  const { DB } = c.env
  const auditToken = c.req.param('auditToken')

  try {
    const body = await c.req.json()
    const {
      inspection_type = 'general',
      inspection_date,
      observations,
      photos,
      defects_found = 0,
      severity = 'low'
    } = body

    // Vérifier que l'audit existe
    const audit = await DB.prepare(`
      SELECT id FROM audits WHERE audit_token = ?
    `).bind(auditToken).first()

    if (!audit) {
      return c.json({ success: false, error: 'Audit introuvable' }, 404)
    }

    // Insérer l'inspection
    const result = await DB.prepare(`
      INSERT INTO visual_inspections (
        audit_token,
        inspection_type,
        inspection_date,
        observations,
        photos,
        defects_found,
        severity
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      auditToken,
      inspection_type,
      inspection_date || new Date().toISOString().split('T')[0],
      observations,
      JSON.stringify(photos || []),
      defects_found,
      severity
    ).run()

    return c.json({
      success: true,
      message: 'Inspection visuelle ajoutée',
      inspection_id: result.meta.last_row_id
    })

  } catch (error: any) {
    console.error('Erreur ajout inspection visuelle:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ============================================================================
// ROUTE 3: PUT /api/visual/inspections/:auditToken/:id
// Mettre à jour une inspection visuelle
// ============================================================================
app.put('/inspections/:auditToken/:id', async (c) => {
  const { DB } = c.env
  const auditToken = c.req.param('auditToken')
  const inspectionId = c.req.param('id')

  try {
    const body = await c.req.json()
    const {
      inspection_type,
      inspection_date,
      observations,
      photos,
      defects_found,
      severity
    } = body

    // Mettre à jour l'inspection
    await DB.prepare(`
      UPDATE visual_inspections
      SET
        inspection_type = COALESCE(?, inspection_type),
        inspection_date = COALESCE(?, inspection_date),
        observations = COALESCE(?, observations),
        photos = COALESCE(?, photos),
        defects_found = COALESCE(?, defects_found),
        severity = COALESCE(?, severity),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND audit_token = ?
    `).bind(
      inspection_type,
      inspection_date,
      observations,
      photos ? JSON.stringify(photos) : null,
      defects_found,
      severity,
      inspectionId,
      auditToken
    ).run()

    return c.json({
      success: true,
      message: 'Inspection visuelle mise à jour'
    })

  } catch (error: any) {
    console.error('Erreur mise à jour inspection:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ============================================================================
// ROUTE 4: DELETE /api/visual/inspections/:auditToken/:id
// Supprimer une inspection visuelle
// ============================================================================
app.delete('/inspections/:auditToken/:id', async (c) => {
  const { DB } = c.env
  const auditToken = c.req.param('auditToken')
  const inspectionId = c.req.param('id')

  try {
    await DB.prepare(`
      DELETE FROM visual_inspections
      WHERE id = ? AND audit_token = ?
    `).bind(inspectionId, auditToken).run()

    return c.json({
      success: true,
      message: 'Inspection visuelle supprimée'
    })

  } catch (error: any) {
    console.error('Erreur suppression inspection:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ============================================================================
// ROUTE 5: POST /api/visual/initialize/:auditToken
// Initialiser checklist visuelle depuis shared_configurations
// ============================================================================
app.post('/initialize/:auditToken', async (c) => {
  const { DB } = c.env
  const auditToken = c.req.param('auditToken')

  try {
    // Lire configuration partagée
    const config = await DB.prepare(`
      SELECT * FROM shared_configurations
      WHERE audit_token = ?
    `).bind(auditToken).first()

    if (!config) {
      return c.json({ 
        success: false, 
        error: 'Configuration partagée introuvable' 
      }, 404)
    }

    // Lire audit pour obtenir intervention_id si nécessaire
    const audit = await DB.prepare(`
      SELECT id, intervention_id FROM audits
      WHERE audit_token = ?
    `).bind(auditToken).first()

    // Créer checklist visuelle par défaut (schéma production)
    const checklists = [
      {
        type: 'structural',
        location: 'Structure & Fixations',
        notes: 'Vérifier fixations modules, rails, vis, état structures'
      },
      {
        type: 'electrical',
        location: 'Câblage & Connexions',
        notes: 'Vérifier MC4, boîtes jonction, chemins câbles, onduleurs'
      },
      {
        type: 'mechanical',
        location: 'Modules PV',
        notes: 'Vérifier verre, cadre, joint, délamination, corrosion'
      },
      {
        type: 'general',
        location: 'Environnement',
        notes: 'Vérifier propreté, ombrage, végétation, accès'
      }
    ]

    let created = 0
    for (const checklist of checklists) {
      const result = await DB.prepare(`
        INSERT INTO visual_inspections (
          audit_token,
          audit_id,
          inspection_type,
          location_description,
          defect_found,
          notes
        ) VALUES (?, ?, ?, ?, 0, ?)
      `).bind(
        auditToken,
        audit?.id || null,
        checklist.type,
        checklist.location,
        checklist.notes
      ).run()

      if (result.success) created++
    }

    return c.json({
      success: true,
      message: 'Checklist visuelle initialisée',
      checklists_created: created,
      config_used: {
        string_count: config.string_count,
        total_modules: config.total_modules
      }
    })

  } catch (error: any) {
    console.error('Erreur initialisation checklist:', error)
    return c.json({ 
      success: false, 
      error: `Erreur initialisation: ${error.message}` 
    }, 500)
  }
})

// ============================================================================
// ROUTE 6: GET /api/visual/report/:auditToken
// Générer rapport HTML inspections visuelles
// ============================================================================
app.get('/report/:auditToken', async (c) => {
  const { DB } = c.env
  const auditToken = c.req.param('auditToken')

  try {
    // Récupérer configuration
    const config = await DB.prepare(`
      SELECT * FROM shared_configurations
      WHERE audit_token = ?
    `).bind(auditToken).first()

    if (!config) {
      return c.json({ success: false, error: 'Configuration introuvable' }, 404)
    }

    // Récupérer inspections
    const inspections = await DB.prepare(`
      SELECT * FROM visual_inspections
      WHERE audit_token = ?
      ORDER BY inspection_type, created_at
    `).bind(auditToken).all()

    // Générer rapport HTML simple
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Rapport Inspections Visuelles</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { color: #0EA5E9; }
          .inspection { border: 1px solid #ccc; padding: 15px; margin: 10px 0; }
          .severity-critical { background: #fee; }
          .severity-high { background: #ffd; }
        </style>
      </head>
      <body>
        <h1>Rapport Inspections Visuelles</h1>
        <p><strong>Audit Token:</strong> ${auditToken}</p>
        <p><strong>Modules:</strong> ${config.total_modules} (${config.string_count} strings)</p>
        <hr>
        ${(inspections.results || []).map((insp: any) => `
          <div class="inspection severity-${insp.severity}">
            <h3>${insp.inspection_type.toUpperCase()}</h3>
            <p><strong>Date:</strong> ${insp.inspection_date}</p>
            <p><strong>Observations:</strong> ${insp.observations || 'Aucune'}</p>
            <p><strong>Défauts:</strong> ${insp.defects_found}</p>
            <p><strong>Sévérité:</strong> ${insp.severity}</p>
          </div>
        `).join('')}
      </body>
      </html>
    `

    return c.html(html)

  } catch (error: any) {
    console.error('Erreur génération rapport:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

export default app
