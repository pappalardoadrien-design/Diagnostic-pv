// ============================================================================
// MODULE ANALYTICS - DASHBOARD MÉTRIQUES TEMPS RÉEL
// ============================================================================
// KPIs globaux DiagPV Hub : audits, modules, défauts, performances
// Dashboard temps réel avec statistiques agrégées
// ============================================================================

import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
}

const analytics = new Hono<{ Bindings: Bindings }>()

// ============================================================================
// GET /api/analytics/global - KPIs globaux plateforme
// ============================================================================
analytics.get('/global', async (c) => {
  try {
    // 1. Stats audits EL
    const auditsStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_audits,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_audits,
        COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) as inprogress_audits,
        MAX(created_at) as last_audit_date
      FROM el_audits
    `).first()

    // 2. Stats modules EL
    const modulesStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_modules,
        COUNT(CASE WHEN defect_type != 'NONE' THEN 1 END) as defective_modules
      FROM el_modules
    `).first()

    // 3. Stats I-V
    const ivStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_measurements,
        AVG(pmax_measured) as avg_pmax,
        AVG(ABS(deviation_percent)) as avg_deviation,
        COUNT(CASE WHEN ABS(deviation_percent) > 10 THEN 1 END) as high_deviation_count
      FROM iv_measurements 
      WHERE measurement_type = 'reference'
    `).first()

    // 4. Stats VISUAL
    const visualStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_inspections,
        COUNT(CASE WHEN defect_found = 1 THEN 1 END) as defects_found,
        COUNT(DISTINCT audit_token) as audits_with_visual
      FROM visual_inspections
    `).first()

    // 5. Stats ISOLATION
    const isolationStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_tests,
        COUNT(CASE WHEN is_conform = 1 THEN 1 END) as conform_tests,
        COUNT(CASE WHEN is_conform = 0 THEN 1 END) as nonconform_tests
      FROM isolation_tests
    `).first()

    // 6. Stats Photos
    const photosStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_photos,
        SUM(photo_size) as total_size,
        COUNT(DISTINCT audit_token) as audits_with_photos
      FROM photos
      WHERE r2_key IS NOT NULL
    `).first()

    // 7. Top défauts EL
    const topDefects = await c.env.DB.prepare(`
      SELECT 
        defect_type,
        COUNT(*) as count
      FROM el_modules
      WHERE defect_type != 'NONE'
      GROUP BY defect_type
      ORDER BY count DESC
      LIMIT 5
    `).all()

    // 8. Tendance audits par mois (6 derniers mois)
    const auditsTrend = await c.env.DB.prepare(`
      SELECT 
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as count
      FROM el_audits
      WHERE created_at >= datetime('now', '-6 months')
      GROUP BY month
      ORDER BY month DESC
    `).all()

    // 9. Performance moyenne par string (top 10)
    const stringPerformance = await c.env.DB.prepare(`
      SELECT 
        string_number,
        COUNT(*) as modules_count,
        AVG(pmax_measured) as avg_pmax,
        AVG(ABS(deviation_percent)) as avg_deviation
      FROM iv_measurements
      WHERE measurement_type = 'reference'
      GROUP BY string_number
      ORDER BY avg_pmax DESC
      LIMIT 10
    `).all()

    // 10. Taux de conformité global
    const conformityRate = {
      el: modulesStats && modulesStats.defective_modules !== null && modulesStats.total_modules 
        ? ((1 - (modulesStats.defective_modules as number) / (modulesStats.total_modules as number)) * 100).toFixed(1)
        : '0',
      iv: ivStats && ivStats.high_deviation_count !== null && ivStats.total_measurements
        ? ((1 - (ivStats.high_deviation_count as number) / (ivStats.total_measurements as number)) * 100).toFixed(1)
        : '0',
      isolation: isolationStats && isolationStats.conform_tests !== null && isolationStats.total_tests
        ? (((isolationStats.conform_tests as number) / (isolationStats.total_tests as number)) * 100).toFixed(1)
        : '0'
    }

    return c.json({
      success: true,
      data: {
        audits: auditsStats,
        modules: modulesStats,
        iv: ivStats,
        visual: visualStats,
        isolation: isolationStats,
        photos: photosStats,
        top_defects: topDefects.results,
        audits_trend: auditsTrend.results,
        string_performance: stringPerformance.results,
        conformity_rate: conformityRate
      },
      generated_at: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Erreur analytics global:', error)
    return c.json({
      success: false,
      error: 'Erreur chargement analytics',
      details: error.message
    }, 500)
  }
})

// ============================================================================
// GET /api/analytics/audit/:token - Analytics audit spécifique
// ============================================================================
analytics.get('/audit/:token', async (c) => {
  try {
    const auditToken = c.req.param('token')

    // 1. Info audit
    const audit = await c.env.DB.prepare(`
      SELECT * FROM el_audits WHERE audit_token = ?
    `).bind(auditToken).first()

    if (!audit) {
      return c.json({ success: false, error: 'Audit non trouvé' }, 404)
    }

    // 2. Stats modules EL
    const elStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN defect_type != 'NONE' THEN 1 END) as defective,
        defect_type,
        COUNT(*) as defect_count
      FROM el_modules
      WHERE audit_token = ?
      GROUP BY defect_type
    `).bind(auditToken).all()

    // 3. Stats I-V
    const ivStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total,
        AVG(pmax_measured) as avg_pmax,
        MIN(pmax_measured) as min_pmax,
        MAX(pmax_measured) as max_pmax,
        AVG(ABS(deviation_percent)) as avg_deviation,
        COUNT(CASE WHEN ABS(deviation_percent) > 10 THEN 1 END) as high_deviation
      FROM iv_measurements
      WHERE audit_token = ? AND measurement_type = 'reference'
    `).bind(auditToken).first()

    // 4. Stats VISUAL
    const visualStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN defect_found = 1 THEN 1 END) as defects,
        defect_type,
        COUNT(*) as count
      FROM visual_inspections
      WHERE audit_token = ?
      GROUP BY defect_type
    `).bind(auditToken).all()

    // 5. Stats ISOLATION
    const isolationStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN is_conform = 1 THEN 1 END) as conform,
        AVG(dc_positive_to_earth) as avg_dc_positive,
        AVG(dc_negative_to_earth) as avg_dc_negative,
        AVG(ac_to_earth) as avg_ac
      FROM isolation_tests
      WHERE audit_el_token = ?
    `).bind(auditToken).first()

    // 6. Distribution défauts par string
    const defectsByString = await c.env.DB.prepare(`
      SELECT 
        string_number,
        COUNT(*) as total_modules,
        COUNT(CASE WHEN defect_type != 'NONE' THEN 1 END) as defective_modules
      FROM el_modules
      WHERE audit_token = ?
      GROUP BY string_number
      ORDER BY string_number
    `).bind(auditToken).all()

    // 7. Performance I-V par string
    const ivByString = await c.env.DB.prepare(`
      SELECT 
        string_number,
        COUNT(*) as modules_count,
        AVG(pmax_measured) as avg_pmax,
        AVG(ABS(deviation_percent)) as avg_deviation
      FROM iv_measurements
      WHERE audit_token = ? AND measurement_type = 'reference'
      GROUP BY string_number
      ORDER BY string_number
    `).bind(auditToken).all()

    return c.json({
      success: true,
      data: {
        audit: audit,
        el: elStats.results,
        iv: ivStats,
        visual: visualStats.results,
        isolation: isolationStats,
        defects_by_string: defectsByString.results,
        iv_by_string: ivByString.results
      },
      generated_at: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Erreur analytics audit:', error)
    return c.json({
      success: false,
      error: 'Erreur chargement analytics audit',
      details: error.message
    }, 500)
  }
})

// ============================================================================
// GET /api/analytics/realtime - Métriques temps réel (cache 30s)
// ============================================================================
analytics.get('/realtime', async (c) => {
  try {
    // Compteurs temps réel
    const realtimeData = await c.env.DB.batch([
      c.env.DB.prepare('SELECT COUNT(*) as count FROM el_audits WHERE created_at >= datetime("now", "-1 hour")'),
      c.env.DB.prepare('SELECT COUNT(*) as count FROM el_modules WHERE created_at >= datetime("now", "-1 hour")'),
      c.env.DB.prepare('SELECT COUNT(*) as count FROM iv_measurements WHERE created_at >= datetime("now", "-1 hour")'),
      c.env.DB.prepare('SELECT COUNT(*) as count FROM visual_inspections WHERE created_at >= datetime("now", "-1 hour")'),
      c.env.DB.prepare('SELECT COUNT(*) as count FROM photos WHERE created_at >= datetime("now", "-1 hour")')
    ])

    return c.json({
      success: true,
      data: {
        last_hour: {
          audits: realtimeData[0].results[0]?.count || 0,
          modules: realtimeData[1].results[0]?.count || 0,
          iv_measurements: realtimeData[2].results[0]?.count || 0,
          visual_inspections: realtimeData[3].results[0]?.count || 0,
          photos: realtimeData[4].results[0]?.count || 0
        },
        timestamp: new Date().toISOString()
      }
    })

  } catch (error: any) {
    console.error('Erreur analytics realtime:', error)
    return c.json({
      success: false,
      error: 'Erreur chargement analytics realtime',
      details: error.message
    }, 500)
  }
})

export default analytics
