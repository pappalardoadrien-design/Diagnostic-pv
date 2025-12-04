// ============================================================================
// MODULE ISOLATION - API ROUTES
// ============================================================================
// Routes API pour tests d'isolement électrique PV
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
  AC: 0.5,    // NF C 15-100
  Earth: 100  // Terre (Ω, pas MΩ)
}

// ============================================================================
// ROUTE 1: GET /api/isolation/tests/:auditToken
// Liste tous les tests d'isolement pour un audit
// ============================================================================
app.get('/tests/:auditToken', async (c) => {
  const { DB } = c.env
  const auditToken = c.req.param('auditToken')

  try {
    // Récupérer tous les tests
    const tests = await DB.prepare(`
      SELECT * FROM isolation_tests
      WHERE audit_token = ?
      ORDER BY test_date DESC, created_at DESC
    `).bind(auditToken).all()

    // Statistiques conformité
    const stats = await DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN pass = 1 THEN 1 ELSE 0 END) as passed,
        SUM(CASE WHEN pass = 0 THEN 1 ELSE 0 END) as failed,
        AVG(resistance) as avg_resistance,
        MIN(resistance) as min_resistance
      FROM isolation_tests
      WHERE audit_token = ?
    `).bind(auditToken).first()

    return c.json({
      success: true,
      tests: tests.results || [],
      stats: stats || { total: 0, passed: 0, failed: 0, avg_resistance: 0, min_resistance: 0 }
    })

  } catch (error: any) {
    console.error('Erreur liste tests isolement:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ============================================================================
// ROUTE 2: POST /api/isolation/tests/:auditToken
// Ajouter un nouveau test d'isolement
// ============================================================================
app.post('/tests/:auditToken', async (c) => {
  const { DB } = c.env
  const auditToken = c.req.param('auditToken')

  try {
    const body = await c.req.json()
    const {
      test_type = 'DC',
      test_date,
      voltage,
      resistance,
      temperature,
      humidity,
      notes
    } = body

    // Vérifier que l'audit existe
    const audit = await DB.prepare(`
      SELECT id FROM audits WHERE audit_token = ?
    `).bind(auditToken).first()

    if (!audit) {
      return c.json({ success: false, error: 'Audit introuvable' }, 404)
    }

    // Déterminer seuil et conformité
    const threshold = ISOLATION_THRESHOLDS[test_type as keyof typeof ISOLATION_THRESHOLDS] || ISOLATION_THRESHOLDS.DC
    const pass = resistance >= threshold ? 1 : 0

    // Insérer le test
    const result = await DB.prepare(`
      INSERT INTO isolation_tests (
        audit_token,
        test_type,
        test_date,
        voltage,
        resistance,
        pass,
        threshold,
        temperature,
        humidity,
        notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      auditToken,
      test_type,
      test_date || new Date().toISOString().split('T')[0],
      voltage,
      resistance,
      pass,
      threshold,
      temperature,
      humidity,
      notes
    ).run()

    return c.json({
      success: true,
      message: 'Test d\'isolement ajouté',
      test_id: result.meta.last_row_id,
      pass: pass === 1,
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
    const {
      test_type,
      test_date,
      voltage,
      resistance,
      temperature,
      humidity,
      notes
    } = body

    // Recalculer conformité si résistance modifiée
    let pass = undefined
    let threshold = undefined
    if (resistance !== undefined && test_type) {
      threshold = ISOLATION_THRESHOLDS[test_type as keyof typeof ISOLATION_THRESHOLDS] || ISOLATION_THRESHOLDS.DC
      pass = resistance >= threshold ? 1 : 0
    }

    // Mettre à jour le test
    await DB.prepare(`
      UPDATE isolation_tests
      SET
        test_type = COALESCE(?, test_type),
        test_date = COALESCE(?, test_date),
        voltage = COALESCE(?, voltage),
        resistance = COALESCE(?, resistance),
        pass = COALESCE(?, pass),
        threshold = COALESCE(?, threshold),
        temperature = COALESCE(?, temperature),
        humidity = COALESCE(?, humidity),
        notes = COALESCE(?, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND audit_token = ?
    `).bind(
      test_type,
      test_date,
      voltage,
      resistance,
      pass,
      threshold,
      temperature,
      humidity,
      notes,
      testId,
      auditToken
    ).run()

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
  const auditToken = c.req.param('auditToken')
  const testId = c.req.param('id')

  try {
    await DB.prepare(`
      DELETE FROM isolation_tests
      WHERE id = ? AND audit_token = ?
    `).bind(testId, auditToken).run()

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

    // Créer tests par défaut (un par type)
    const defaultTests = [
      {
        type: 'DC',
        voltage: 1000,
        notes: 'Test isolement DC côté onduleur (IEC 62446-1)'
      },
      {
        type: 'AC',
        voltage: 500,
        notes: 'Test isolement AC sortie onduleur (NF C 15-100)'
      },
      {
        type: 'Earth',
        voltage: 0,
        notes: 'Test continuité terre/masse (UTE C 15-712-1)'
      }
    ]

    let created = 0
    for (const test of defaultTests) {
      const threshold = ISOLATION_THRESHOLDS[test.type as keyof typeof ISOLATION_THRESHOLDS]
      
      const result = await DB.prepare(`
        INSERT INTO isolation_tests (
          audit_token,
          test_type,
          voltage,
          resistance,
          pass,
          threshold,
          notes
        ) VALUES (?, ?, ?, NULL, 0, ?, ?)
      `).bind(
        auditToken,
        test.type,
        test.voltage,
        threshold,
        test.notes
      ).run()

      if (result.success) created++
    }

    return c.json({
      success: true,
      message: 'Tests d\'isolement initialisés',
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
      WHERE audit_token = ?
      ORDER BY test_type, test_date
    `).bind(auditToken).all()

    // Statistiques
    const stats = await DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN pass = 1 THEN 1 ELSE 0 END) as passed,
        SUM(CASE WHEN pass = 0 THEN 1 ELSE 0 END) as failed
      FROM isolation_tests
      WHERE audit_token = ?
    `).bind(auditToken).first()

    // Générer rapport HTML
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Rapport Tests Isolement</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { color: #8B5CF6; }
          .test { border: 1px solid #ccc; padding: 15px; margin: 10px 0; }
          .pass { background: #d1fae5; }
          .fail { background: #fee2e2; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
          th { background: #f3f4f6; }
        </style>
      </head>
      <body>
        <h1>Rapport Tests d'Isolement Électrique</h1>
        <p><strong>Audit Token:</strong> ${auditToken}</p>
        <p><strong>Installation:</strong> ${config.total_modules} modules (${config.string_count} strings)</p>
        
        <h2>Résumé Conformité</h2>
        <p><strong>Total tests:</strong> ${stats?.total || 0}</p>
        <p><strong>Conformes:</strong> ${stats?.passed || 0}</p>
        <p><strong>Non conformes:</strong> ${stats?.failed || 0}</p>
        
        <h2>Détails Tests</h2>
        <table>
          <tr>
            <th>Type</th>
            <th>Date</th>
            <th>Tension (V)</th>
            <th>Résistance (MΩ)</th>
            <th>Seuil (MΩ)</th>
            <th>Conformité</th>
          </tr>
          ${(tests.results || []).map((test: any) => `
            <tr class="${test.pass ? 'pass' : 'fail'}">
              <td>${test.test_type}</td>
              <td>${test.test_date}</td>
              <td>${test.voltage || '-'}</td>
              <td>${test.resistance !== null ? test.resistance.toFixed(2) : 'Non mesuré'}</td>
              <td>${test.threshold}</td>
              <td>${test.pass ? '✅ CONFORME' : '❌ NON CONFORME'}</td>
            </tr>
          `).join('')}
        </table>
        
        <h3>Normes Appliquées</h3>
        <ul>
          <li><strong>IEC 62446-1:</strong> Isolement DC ≥ 1 MΩ</li>
          <li><strong>NF C 15-100:</strong> Isolement AC ≥ 0.5 MΩ</li>
          <li><strong>UTE C 15-712-1:</strong> Continuité terre ≤ 100 Ω</li>
        </ul>
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
