// ============================================================================
// MODULE ISOLATION - API ROUTES (Production Schema Compatible)
// ============================================================================
// Routes API pour tests d'isolement électrique PV
// Schéma production: 26 colonnes avec mesures DC/AC détaillées
// Intégration avec shared_configurations
// Normes: IEC 62446-1, NF C 15-100, UTE C 15-712-1
// ============================================================================

import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

// Seuils normatifs isolement (MΩ)
const ISOLATION_THRESHOLDS = {
  DC: 1.0,    // IEC 62446-1: Min 1 MΩ (tension système < 1000V)
  AC: 0.5     // NF C 15-100
}

// ============================================================================
// ROUTE 1: GET /api/isolation/tests/:auditToken
// Liste tous les tests d'isolement pour un audit
// ============================================================================
app.get('/tests/:auditToken', async (c) => {
  const { DB } = c.env
  const auditToken = c.req.param('auditToken')

  try {
    // Récupérer tous les tests (audit_token OU audit_el_token)
    const tests = await DB.prepare(`
      SELECT * FROM isolation_tests
      WHERE audit_token = ? OR audit_el_token = ?
      ORDER BY test_date DESC, created_at DESC
    `).bind(auditToken, auditToken).all()

    // Statistiques conformité
    const stats = await DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_conform = 1 THEN 1 ELSE 0 END) as passed,
        SUM(CASE WHEN is_conform = 0 THEN 1 ELSE 0 END) as failed,
        AVG(dc_positive_to_earth) as avg_dc_pos,
        AVG(dc_negative_to_earth) as avg_dc_neg,
        AVG(ac_to_earth) as avg_ac
      FROM isolation_tests
      WHERE audit_token = ? OR audit_el_token = ?
    `).bind(auditToken, auditToken).first()

    return c.json({
      success: true,
      tests: tests.results || [],
      stats: stats || { total: 0, passed: 0, failed: 0, avg_dc_pos: 0, avg_dc_neg: 0, avg_ac: 0 }
    })

  } catch (error: any) {
    console.error('Erreur liste tests isolement:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ============================================================================
// ROUTE 2: POST /api/isolation/tests/:auditToken
// Ajouter un nouveau test d'isolement (schéma production)
// ============================================================================
app.post('/tests/:auditToken', async (c) => {
  const { DB } = c.env
  const auditToken = c.req.param('auditToken')

  try {
    const body = await c.req.json()
    const {
      test_type = 'DC',
      test_date = null,
      operator_name = null,
      equipment_used = null,
      dc_positive_to_earth = null,
      dc_negative_to_earth = null,
      dc_positive_to_negative = null,
      ac_to_earth = null,
      temperature_celsius = null,
      humidity_percent = null,
      weather_conditions = null,
      notes = null,
      non_conformity_details = null,
      corrective_actions = null
    } = body

    // Vérifier que l'audit existe
    const audit = await DB.prepare(`
      SELECT id FROM audits WHERE audit_token = ?
    `).bind(auditToken).first()

    if (!audit) {
      return c.json({ success: false, error: 'Audit introuvable' }, 404)
    }

    // Déterminer conformité selon normes IEC 62446-1 et NF C 15-100
    let is_conform = 1
    const threshold = ISOLATION_THRESHOLDS.DC

    if (test_type === 'DC') {
      // IEC 62446-1: ≥ 1 MΩ pour DC
      if ((dc_positive_to_earth !== null && dc_positive_to_earth < threshold) ||
          (dc_negative_to_earth !== null && dc_negative_to_earth < threshold)) {
        is_conform = 0
      }
    } else if (test_type === 'AC') {
      // NF C 15-100: ≥ 0.5 MΩ pour AC
      if (ac_to_earth !== null && ac_to_earth < ISOLATION_THRESHOLDS.AC) {
        is_conform = 0
      }
    }

    // Générer test_token unique
    const testToken = `test_${Date.now()}_${Math.random().toString(36).substring(7)}`

    // Insérer le test
    const result = await DB.prepare(`
      INSERT INTO isolation_tests (
        test_token,
        audit_el_token,
        audit_token,
        audit_id,
        test_type,
        test_date,
        operator_name,
        equipment_used,
        dc_positive_to_earth,
        dc_negative_to_earth,
        dc_positive_to_negative,
        ac_to_earth,
        temperature_celsius,
        humidity_percent,
        weather_conditions,
        is_conform,
        threshold_mohm,
        notes,
        non_conformity_details,
        corrective_actions
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      testToken,
      auditToken,  // audit_el_token
      auditToken,  // audit_token
      audit.id,
      test_type,
      test_date || new Date().toISOString().split('T')[0],
      operator_name,
      equipment_used,
      dc_positive_to_earth,
      dc_negative_to_earth,
      dc_positive_to_negative,
      ac_to_earth,
      temperature_celsius,
      humidity_percent,
      weather_conditions,
      is_conform,
      threshold,
      notes,
      non_conformity_details,
      corrective_actions
    ).run()

    return c.json({
      success: true,
      message: 'Test d\'isolement ajouté',
      test_id: result.meta.last_row_id,
      test_token: testToken,
      is_conform: is_conform === 1,
      threshold
    })

  } catch (error: any) {
    console.error('Erreur ajout test isolement:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ============================================================================
// ROUTE 3: PUT /api/isolation/tests/:auditToken/:id
// Mettre à jour un test d'isolement
// ============================================================================
app.put('/tests/:auditToken/:id', async (c) => {
  const { DB } = c.env
  const auditToken = c.req.param('auditToken')
  const testId = c.req.param('id')

  try {
    const body = await c.req.json()

    // Construction dynamique UPDATE
    const updates: string[] = []
    const bindings: any[] = []

    const fields = [
      'test_type', 'test_date', 'operator_name', 'equipment_used',
      'dc_positive_to_earth', 'dc_negative_to_earth', 'dc_positive_to_negative',
      'ac_to_earth', 'temperature_celsius', 'humidity_percent',
      'weather_conditions', 'notes', 'non_conformity_details', 'corrective_actions'
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

    // Recalculer conformité si mesures modifiées
    if (body.dc_positive_to_earth !== undefined || body.dc_negative_to_earth !== undefined || body.ac_to_earth !== undefined) {
      updates.push('is_conform = ?')
      
      let is_conform = 1
      if ((body.dc_positive_to_earth && body.dc_positive_to_earth < ISOLATION_THRESHOLDS.DC) ||
          (body.dc_negative_to_earth && body.dc_negative_to_earth < ISOLATION_THRESHOLDS.DC) ||
          (body.ac_to_earth && body.ac_to_earth < ISOLATION_THRESHOLDS.AC)) {
        is_conform = 0
      }
      bindings.push(is_conform)
    }

    bindings.push(testId)

    await DB.prepare(`
      UPDATE isolation_tests
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(...bindings).run()

    return c.json({
      success: true,
      message: 'Test d\'isolement mis à jour'
    })

  } catch (error: any) {
    console.error('Erreur mise à jour test:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ============================================================================
// ROUTE 4: DELETE /api/isolation/tests/:auditToken/:id
// Supprimer un test d'isolement
// ============================================================================
app.delete('/tests/:auditToken/:id', async (c) => {
  const { DB } = c.env
  const testId = c.req.param('id')

  try {
    await DB.prepare(`
      DELETE FROM isolation_tests
      WHERE id = ?
    `).bind(testId).run()

    return c.json({
      success: true,
      message: 'Test d\'isolement supprimé'
    })

  } catch (error: any) {
    console.error('Erreur suppression test:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ============================================================================
// ROUTE 5: POST /api/isolation/initialize/:auditToken
// Initialiser tests isolement depuis shared_configurations
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

    // Lire audit
    const audit = await DB.prepare(`
      SELECT id FROM audits WHERE audit_token = ?
    `).bind(auditToken).first()

    // Créer tests par défaut (DC + AC)
    const defaultTests = [
      {
        type: 'DC',
        name: 'Test Isolement DC (Positif/Terre)',
        notes: 'Test isolement DC+ vers terre selon IEC 62446-1 (≥ 1 MΩ)',
        equipment: 'Multimètre isolement 1000V DC'
      },
      {
        type: 'DC',
        name: 'Test Isolement DC (Négatif/Terre)',
        notes: 'Test isolement DC- vers terre selon IEC 62446-1 (≥ 1 MΩ)',
        equipment: 'Multimètre isolement 1000V DC'
      },
      {
        type: 'AC',
        name: 'Test Isolement AC (Sortie/Terre)',
        notes: 'Test isolement sortie onduleur selon NF C 15-100 (≥ 0.5 MΩ)',
        equipment: 'Multimètre isolement 500V AC'
      }
    ]

    let created = 0
    for (const test of defaultTests) {
      const testToken = `test_${Date.now()}_${Math.random().toString(36).substring(7)}`
      
      const result = await DB.prepare(`
        INSERT INTO isolation_tests (
          test_token,
          audit_el_token,
          audit_token,
          audit_id,
          test_type,
          test_date,
          equipment_used,
          is_conform,
          threshold_mohm,
          notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
      `).bind(
        testToken,
        auditToken,
        auditToken,
        audit?.id || null,
        test.type,
        new Date().toISOString().split('T')[0],
        test.equipment,
        test.type === 'DC' ? ISOLATION_THRESHOLDS.DC : ISOLATION_THRESHOLDS.AC,
        test.notes
      ).run()

      if (result.success) created++
    }

    return c.json({
      success: true,
      message: 'Tests d\'isolement initialisés (IEC 62446-1 / NF C 15-100)',
      tests_created: created,
      config_used: {
        string_count: config.string_count,
        total_modules: config.total_modules
      }
    })

  } catch (error: any) {
    console.error('Erreur initialisation tests:', error)
    return c.json({ 
      success: false, 
      error: `Erreur initialisation: ${error.message}` 
    }, 500)
  }
})

// ============================================================================
// ROUTE 6: GET /api/isolation/report/:auditToken
// Générer rapport HTML tests isolement
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

    // Récupérer tests
    const tests = await DB.prepare(`
      SELECT * FROM isolation_tests
      WHERE audit_token = ? OR audit_el_token = ?
      ORDER BY test_type, test_date
    `).bind(auditToken, auditToken).all()

    // Statistiques
    const stats = await DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_conform = 1 THEN 1 ELSE 0 END) as passed,
        SUM(CASE WHEN is_conform = 0 THEN 1 ELSE 0 END) as failed
      FROM isolation_tests
      WHERE audit_token = ? OR audit_el_token = ?
    `).bind(auditToken, auditToken).first()

    // Générer rapport HTML professionnel
    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <title>Rapport Tests Isolement - DiagPV</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
          h1 { color: #8B5CF6; border-bottom: 3px solid #8B5CF6; padding-bottom: 10px; }
          h2 { color: #0EA5E9; margin-top: 30px; }
          .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
          .stats { display: flex; gap: 20px; margin: 20px 0; }
          .stat-box { flex: 1; padding: 15px; border-radius: 8px; text-align: center; }
          .stat-ok { background: #d1fae5; border: 2px solid #10b981; }
          .stat-critical { background: #fee2e2; border: 2px solid #ef4444; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; }
          th { background: #f3f4f6; font-weight: bold; color: #374151; }
          tr.pass { background: #f0fdf4; }
          tr.fail { background: #fef2f2; }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: bold; }
          .badge-ok { background: #10b981; color: white; }
          .badge-fail { background: #ef4444; color: white; }
          footer { margin-top: 50px; padding-top: 20px; border-top: 2px solid #e5e7eb; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>⚡ Rapport Tests d'Isolement Électrique</h1>
          <p><strong>Audit Token:</strong> ${auditToken}</p>
          <p><strong>Installation:</strong> ${config.total_modules} modules (${config.string_count} strings × ${config.modules_per_string} modules/string)</p>
          <p><strong>Date rapport:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
          <p><strong>Normes:</strong> IEC 62446-1 (DC ≥ 1 MΩ), NF C 15-100 (AC ≥ 0.5 MΩ), UTE C 15-712-1</p>
        </div>

        <div class="stats">
          <div class="stat-box stat-ok">
            <h3>${stats?.total || 0}</h3>
            <p>Tests Réalisés</p>
          </div>
          <div class="stat-box stat-ok">
            <h3>${stats?.passed || 0}</h3>
            <p>Conformes</p>
          </div>
          <div class="stat-box stat-critical">
            <h3>${stats?.failed || 0}</h3>
            <p>Non Conformes</p>
          </div>
        </div>

        <h2>Détails Tests par Type</h2>
        <table>
          <tr>
            <th>Type</th>
            <th>Date</th>
            <th>DC+ / Terre (MΩ)</th>
            <th>DC- / Terre (MΩ)</th>
            <th>AC / Terre (MΩ)</th>
            <th>Seuil (MΩ)</th>
            <th>Conformité</th>
          </tr>
          ${(tests.results || []).map((test: any) => {
            const dcPos = test.dc_positive_to_earth !== null ? test.dc_positive_to_earth.toFixed(2) : '-'
            const dcNeg = test.dc_negative_to_earth !== null ? test.dc_negative_to_earth.toFixed(2) : '-'
            const ac = test.ac_to_earth !== null ? test.ac_to_earth.toFixed(2) : '-'
            
            return `
            <tr class="${test.is_conform ? 'pass' : 'fail'}">
              <td><strong>${test.test_type}</strong></td>
              <td>${test.test_date}</td>
              <td>${dcPos}</td>
              <td>${dcNeg}</td>
              <td>${ac}</td>
              <td>${test.threshold_mohm}</td>
              <td>
                <span class="badge ${test.is_conform ? 'badge-ok' : 'badge-fail'}">
                  ${test.is_conform ? '✅ CONFORME' : '❌ NON CONFORME'}
                </span>
              </td>
            </tr>
            ${test.notes ? `<tr><td colspan="7" style="background:#f9fafb; font-size:12px;"><strong>Notes:</strong> ${test.notes}</td></tr>` : ''}
            ${test.non_conformity_details ? `<tr><td colspan="7" style="background:#fef2f2; font-size:12px;"><strong>⚠️ Non-conformité:</strong> ${test.non_conformity_details}</td></tr>` : ''}
          `}).join('')}
        </table>

        <h3>Normes & Seuils Appliqués</h3>
        <table>
          <tr>
            <th>Norme</th>
            <th>Test</th>
            <th>Seuil Minimum</th>
            <th>Tension Test</th>
          </tr>
          <tr>
            <td><strong>IEC 62446-1</strong></td>
            <td>Isolement DC (+ et - vers terre)</td>
            <td>≥ 1 MΩ</td>
            <td>1000 V DC</td>
          </tr>
          <tr>
            <td><strong>NF C 15-100</strong></td>
            <td>Isolement AC (sortie onduleur)</td>
            <td>≥ 0.5 MΩ</td>
            <td>500 V AC</td>
          </tr>
          <tr>
            <td><strong>UTE C 15-712-1</strong></td>
            <td>Continuité terre/masse</td>
            <td>≤ 100 Ω</td>
            <td>N/A</td>
          </tr>
        </table>

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
