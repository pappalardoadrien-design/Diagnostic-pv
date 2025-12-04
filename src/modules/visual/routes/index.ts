// ============================================================================
// MODULE VISUAL - API ROUTES (Production Schema Compatible)
// ============================================================================
// Routes API pour inspections visuelles PV
// Schéma production: 28 colonnes incluant Girasole, GPS, checklists
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
        SUM(CASE WHEN defect_found = 1 THEN 1 ELSE 0 END) as defects_found,
        SUM(CASE WHEN severity_level >= 3 THEN 1 ELSE 0 END) as critical_count,
        SUM(CASE WHEN corrective_action_required = 1 THEN 1 ELSE 0 END) as actions_required
      FROM visual_inspections
      WHERE audit_token = ?
    `).bind(auditToken).first()

    return c.json({
      success: true,
      inspections: inspections.results || [],
      stats: stats || { total: 0, defects_found: 0, critical_count: 0, actions_required: 0 }
    })

  } catch (error: any) {
    console.error('Erreur liste inspections visuelles:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ============================================================================
// ROUTE 2: POST /api/visual/inspections/:auditToken
// Ajouter une nouvelle inspection visuelle (schéma production)
// ============================================================================
app.post('/inspections/:auditToken', async (c) => {
  const { DB } = c.env
  const auditToken = c.req.param('auditToken')

  try {
    const body = await c.req.json()
    const {
      inspection_type = 'general',
      string_number = null,
      module_number = null,
      location_description = '',
      defect_found = 0,
      defect_type = null,
      severity_level = 0,
      photo_url = null,
      gps_latitude = null,
      gps_longitude = null,
      corrective_action_required = 0,
      corrective_action_description = null,
      notes = '',
      inspection_date = null,
      conformite = null,
      audit_category = 'general',
      checklist_section = null,
      item_order = 0,
      checklist_type = 'IEC_62446'
    } = body

    // Vérifier que l'audit existe et récupérer audit_id
    const audit = await DB.prepare(`
      SELECT id, intervention_id FROM audits WHERE audit_token = ?
    `).bind(auditToken).first()

    if (!audit) {
      return c.json({ success: false, error: 'Audit introuvable' }, 404)
    }

    // Insérer l'inspection (schéma production complet)
    const result = await DB.prepare(`
      INSERT INTO visual_inspections (
        intervention_id,
        audit_token,
        audit_id,
        inspection_type,
        string_number,
        module_number,
        location_description,
        defect_found,
        defect_type,
        severity_level,
        photo_url,
        gps_latitude,
        gps_longitude,
        corrective_action_required,
        corrective_action_description,
        notes,
        inspection_date,
        conformite,
        audit_category,
        checklist_section,
        item_order,
        checklist_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      audit.intervention_id,
      auditToken,
      audit.id,
      inspection_type,
      string_number,
      module_number,
      location_description,
      defect_found,
      defect_type,
      severity_level,
      photo_url,
      gps_latitude,
      gps_longitude,
      corrective_action_required,
      corrective_action_description,
      notes,
      inspection_date || new Date().toISOString().split('T')[0],
      conformite,
      audit_category,
      checklist_section,
      item_order,
      checklist_type
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

    // Construction dynamique UPDATE avec COALESCE
    const updates: string[] = []
    const bindings: any[] = []

    // Champs updatables
    const fields = [
      'inspection_type', 'string_number', 'module_number', 'location_description',
      'defect_found', 'defect_type', 'severity_level', 'photo_url',
      'gps_latitude', 'gps_longitude', 'corrective_action_required',
      'corrective_action_description', 'notes', 'inspection_date',
      'conformite', 'audit_category', 'checklist_section', 'item_order'
    ]

    fields.forEach(field => {
      if (body[field] !== undefined) {
        updates.push(`${field} = ?`)
        bindings.push(body[field])
      }
    })

    if (updates.length === 0) {
      return c.json({ success: false, error: 'Aucun champ à mettre à jour' }, 400)
    }

    bindings.push(inspectionId, auditToken)

    await DB.prepare(`
      UPDATE visual_inspections
      SET ${updates.join(', ')}
      WHERE id = ? AND audit_token = ?
    `).bind(...bindings).run()

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

    // Lire audit pour obtenir intervention_id et audit_id
    const audit = await DB.prepare(`
      SELECT id, intervention_id FROM audits
      WHERE audit_token = ?
    `).bind(auditToken).first()

    // Créer checklist visuelle NF C 15-100 / IEC 62446-1
    const checklists = [
      {
        type: 'structural',
        section: 'Structure & Fixations',
        category: 'mechanical',
        location: 'Ensemble installation',
        notes: 'Contrôle fixations modules, état rails, vis de serrage, structures porteuses',
        order: 1
      },
      {
        type: 'electrical',
        section: 'Câblage & Connexions',
        category: 'electrical',
        location: 'Boîtes jonction, MC4, chemins câbles',
        notes: 'Vérifier étanchéité MC4, serrage connexions, état câbles DC/AC, boîtes jonction',
        order: 2
      },
      {
        type: 'mechanical',
        section: 'État Modules PV',
        category: 'mechanical',
        location: 'Modules photovoltaïques',
        notes: 'Contrôle verre (fissures, impacts), cadre (déformation, corrosion), joint (décollement)',
        order: 3
      },
      {
        type: 'safety',
        section: 'Sécurité & Signalisation',
        category: 'electrical',
        location: 'Onduleurs, protections, signalétique',
        notes: 'Vérifier DC disconnect, signalisation réglementaire, accès pompiers, AGCP',
        order: 4
      },
      {
        type: 'environment',
        section: 'Environnement',
        category: 'general',
        location: 'Site installation',
        notes: 'Propreté modules, ombrage, végétation, accès maintenance, état toiture',
        order: 5
      }
    ]

    let created = 0
    for (const checklist of checklists) {
      const result = await DB.prepare(`
        INSERT INTO visual_inspections (
          intervention_id,
          audit_token,
          audit_id,
          inspection_type,
          location_description,
          defect_found,
          notes,
          audit_category,
          checklist_section,
          item_order,
          checklist_type
        ) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, 'IEC_62446')
      `).bind(
        audit?.intervention_id || null,
        auditToken,
        audit?.id || null,
        checklist.type,
        checklist.location,
        checklist.notes,
        checklist.category,
        checklist.section,
        checklist.order
      ).run()

      if (result.success) created++
    }

    return c.json({
      success: true,
      message: 'Checklist visuelle initialisée (NF C 15-100 / IEC 62446-1)',
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

    // Récupérer inspections groupées par catégorie
    const inspections = await DB.prepare(`
      SELECT 
        audit_category,
        checklist_section,
        inspection_type,
        location_description,
        defect_found,
        defect_type,
        severity_level,
        notes,
        conformite,
        corrective_action_required,
        corrective_action_description,
        inspection_date
      FROM visual_inspections
      WHERE audit_token = ?
      ORDER BY item_order, checklist_section
    `).bind(auditToken).all()

    // Stats globales
    const stats = await DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(defect_found) as defects,
        SUM(CASE WHEN severity_level >= 3 THEN 1 ELSE 0 END) as critical,
        SUM(corrective_action_required) as actions
      FROM visual_inspections
      WHERE audit_token = ?
    `).bind(auditToken).first()

    // Générer rapport HTML professionnel
    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <title>Rapport Inspection Visuelle - DiagPV</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
          h1 { color: #14B8A6; border-bottom: 3px solid #14B8A6; padding-bottom: 10px; }
          h2 { color: #0EA5E9; margin-top: 30px; }
          .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
          .stats { display: flex; gap: 20px; margin: 20px 0; }
          .stat-box { flex: 1; padding: 15px; border-radius: 8px; text-align: center; }
          .stat-ok { background: #d1fae5; border: 2px solid #10b981; }
          .stat-warning { background: #fef3c7; border: 2px solid #f59e0b; }
          .stat-critical { background: #fee2e2; border: 2px solid #ef4444; }
          .inspection { border: 1px solid #e5e7eb; padding: 15px; margin: 15px 0; border-radius: 8px; }
          .inspection.defect { background: #fef2f2; border-color: #fca5a5; }
          .section-title { font-weight: bold; color: #0EA5E9; margin-top: 20px; }
          .defect-badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; }
          .severity-1 { background: #dbeafe; color: #1e40af; }
          .severity-2 { background: #fef3c7; color: #92400e; }
          .severity-3 { background: #fed7aa; color: #9a3412; }
          .severity-4 { background: #fecaca; color: #991b1b; }
          footer { margin-top: 50px; padding-top: 20px; border-top: 2px solid #e5e7eb; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📋 Rapport Inspection Visuelle - Contrôle Conformité</h1>
          <p><strong>Audit Token:</strong> ${auditToken}</p>
          <p><strong>Installation:</strong> ${config.total_modules} modules (${config.string_count} strings × ${config.modules_per_string} modules/string)</p>
          <p><strong>Date rapport:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
          <p><strong>Normes:</strong> NF C 15-100, IEC 62446-1, UTE C 15-712-1</p>
        </div>

        <div class="stats">
          <div class="stat-box stat-ok">
            <h3>${stats?.total || 0}</h3>
            <p>Points contrôlés</p>
          </div>
          <div class="stat-box stat-warning">
            <h3>${stats?.defects || 0}</h3>
            <p>Défauts trouvés</p>
          </div>
          <div class="stat-box stat-critical">
            <h3>${stats?.critical || 0}</h3>
            <p>Critiques</p>
          </div>
          <div class="stat-box stat-warning">
            <h3>${stats?.actions || 0}</h3>
            <p>Actions requises</p>
          </div>
        </div>

        <h2>Détail Contrôles par Section</h2>
        ${(inspections.results || []).map((insp: any) => `
          <div class="inspection ${insp.defect_found ? 'defect' : ''}">
            <div class="section-title">${insp.checklist_section || insp.inspection_type.toUpperCase()}</div>
            <p><strong>Zone:</strong> ${insp.location_description}</p>
            <p><strong>Notes:</strong> ${insp.notes || 'Aucune observation'}</p>
            
            ${insp.defect_found ? `
              <p><strong>⚠️ Défaut détecté:</strong> ${insp.defect_type || 'Non spécifié'}</p>
              <p><strong>Sévérité:</strong> 
                <span class="defect-badge severity-${insp.severity_level || 1}">
                  Niveau ${insp.severity_level || 1}/4
                </span>
              </p>
            ` : '<p style="color: green;">✅ Conforme</p>'}
            
            ${insp.corrective_action_required ? `
              <p><strong>🔧 Action corrective requise:</strong> ${insp.corrective_action_description || 'À définir'}</p>
            ` : ''}
            
            <p style="font-size: 12px; color: #6b7280;"><strong>Date:</strong> ${insp.inspection_date}</p>
          </div>
        `).join('')}

        <footer>
          <p><strong>Diagnostic Photovoltaïque</strong> - Expertise indépendante depuis 2012</p>
          <p>3 rue d'Apollo, 31240 L'Union | 05.81.10.16.59 | contact@diagpv.fr | RCS 792972309</p>
          <p>Ce rapport a été généré automatiquement par DiagPV Hub. Toute reproduction interdite sans autorisation.</p>
        </footer>
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
