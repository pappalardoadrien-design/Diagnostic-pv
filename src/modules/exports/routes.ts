// ============================================================================
// MODULE EXPORTS - EXPORT EXCEL/CSV DONNÉES AUDIT
// ============================================================================
// Export complet données audit : EL, I-V, VISUAL, ISOLATION
// Format CSV (compatible Excel) + headers personnalisés
// ============================================================================

import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
}

const exports = new Hono<{ Bindings: Bindings }>()

// ============================================================================
// GET /api/exports/csv/:audit_token - Export CSV complet audit
// ============================================================================
exports.get('/csv/:audit_token', async (c) => {
  try {
    const auditToken = c.req.param('audit_token')

    // 1. Récupérer audit
    const audit = await c.env.DB.prepare(`
      SELECT * FROM el_audits WHERE audit_token = ?
    `).bind(auditToken).first()

    if (!audit) {
      return c.json({ success: false, error: 'Audit non trouvé' }, 404)
    }

    // 2. Récupérer modules EL
    const elModules = await c.env.DB.prepare(`
      SELECT 
        string_number, module_number, defect_type, defect_location, 
        defect_description, bypass_diode_status, created_at
      FROM el_modules
      WHERE audit_token = ?
      ORDER BY string_number, module_number
    `).bind(auditToken).all()

    // 3. Récupérer mesures I-V
    const ivMeasurements = await c.env.DB.prepare(`
      SELECT 
        string_number, module_number, measurement_type,
        isc, voc, pmax, pmax_stc_corrected, deviation_from_datasheet,
        rs, rsh, fill_factor, created_at
      FROM iv_measurements
      WHERE audit_token = ?
      ORDER BY string_number, module_number, measurement_type
    `).bind(auditToken).all()

    // 4. Récupérer inspections visuelles
    const visualInspections = await c.env.DB.prepare(`
      SELECT 
        inspection_type, string_number, module_number,
        defect_found, defect_type, severity_level,
        location_description, created_at
      FROM visual_inspections
      WHERE audit_token = ?
      ORDER BY id
    `).bind(auditToken).all()

    // 5. Récupérer tests isolement
    const isolationTests = await c.env.DB.prepare(`
      SELECT 
        test_date, test_type, dc_positive_to_earth,
        dc_negative_to_earth, ac_to_earth, is_conform,
        threshold_mohm, notes, created_at
      FROM isolation_tests
      WHERE audit_el_token = ?
      ORDER BY test_date
    `).bind(auditToken).all()

    // 6. Générer CSV
    let csv = ''

    // Section Audit
    csv += '# DIAGNOSTIC PHOTOVOLTAÏQUE - EXPORT DONNÉES\n'
    csv += `# Projet: ${audit.project_name || 'N/A'}\n`
    csv += `# Client: ${audit.client_name || 'N/A'}\n`
    csv += `# Token: ${audit.audit_token}\n`
    csv += `# Date export: ${new Date().toISOString()}\n`
    csv += `# Conforme: IEC 62446-1, IEC 62446-3, NF C 15-100\n\n`

    // Section Modules EL
    csv += '## MODULES ÉLECTROLUMINESCENCE\n'
    csv += 'String,Module,Défaut,Localisation,Description,Diode Bypass,Date\n'
    elModules.results?.forEach((m: any) => {
      csv += `${m.string_number},${m.module_number},"${m.defect_type || ''}","${m.defect_location || ''}","${m.defect_description || ''}","${m.bypass_diode_status || ''}","${m.created_at || ''}"\n`
    })
    csv += '\n'

    // Section Mesures I-V
    csv += '## MESURES COURBES I-V\n'
    csv += 'String,Module,Type,Isc (A),Voc (V),Pmax (W),Pmax STC (W),Déviation (%),Rs (Ω),Rsh (Ω),FF,Date\n'
    ivMeasurements.results?.forEach((m: any) => {
      csv += `${m.string_number},${m.module_number},"${m.measurement_type || ''}",${m.isc || ''},${m.voc || ''},${m.pmax || ''},${m.pmax_stc_corrected || ''},${m.deviation_from_datasheet || ''},${m.rs || ''},${m.rsh || ''},${m.fill_factor || ''},"${m.created_at || ''}"\n`
    })
    csv += '\n'

    // Section Inspections Visuelles
    csv += '## INSPECTIONS VISUELLES\n'
    csv += 'Type Inspection,String,Module,Défaut Trouvé,Type Défaut,Sévérité,Localisation,Date\n'
    visualInspections.results?.forEach((v: any) => {
      csv += `"${v.inspection_type || ''}",${v.string_number || ''},${v.module_number || ''},"${v.defect_found ? 'Oui' : 'Non'}","${v.defect_type || ''}","${v.severity_level || ''}","${v.location_description || ''}","${v.created_at || ''}"\n`
    })
    csv += '\n'

    // Section Tests Isolement
    csv += '## TESTS ISOLEMENT\n'
    csv += 'Date,Type,DC+ Terre (MΩ),DC- Terre (MΩ),AC Terre (MΩ),Conforme,Seuil (MΩ),Notes,Date Création\n'
    isolationTests.results?.forEach((t: any) => {
      csv += `"${t.test_date || ''}","${t.test_type || ''}",${t.dc_positive_to_earth || ''},${t.dc_negative_to_earth || ''},${t.ac_to_earth || ''},"${t.is_conform ? 'Oui' : 'Non'}",${t.threshold_mohm || ''},"${t.notes || ''}","${t.created_at || ''}"\n`
    })

    // 7. Retourner CSV
    const filename = `diagnostic-pv-${audit.project_name?.replace(/\s+/g, '-') || 'audit'}-${auditToken.substring(0, 8)}.csv`

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    })

  } catch (error: any) {
    console.error('Erreur export CSV:', error)
    return c.json({
      success: false,
      error: 'Erreur génération export CSV',
      details: error.message
    }, 500)
  }
})

// ============================================================================
// GET /api/exports/json/:audit_token - Export JSON complet audit
// ============================================================================
exports.get('/json/:audit_token', async (c) => {
  try {
    const auditToken = c.req.param('audit_token')

    // 1. Récupérer toutes les données
    const audit = await c.env.DB.prepare(`
      SELECT * FROM el_audits WHERE audit_token = ?
    `).bind(auditToken).first()

    if (!audit) {
      return c.json({ success: false, error: 'Audit non trouvé' }, 404)
    }

    const config = await c.env.DB.prepare(`
      SELECT * FROM shared_configurations WHERE audit_token = ?
    `).bind(auditToken).first()

    const elModules = await c.env.DB.prepare(`
      SELECT * FROM el_modules WHERE audit_token = ? ORDER BY string_number, module_number
    `).bind(auditToken).all()

    const ivMeasurements = await c.env.DB.prepare(`
      SELECT * FROM iv_measurements WHERE audit_token = ? ORDER BY string_number, module_number
    `).bind(auditToken).all()

    const visualInspections = await c.env.DB.prepare(`
      SELECT * FROM visual_inspections WHERE audit_token = ? ORDER BY id
    `).bind(auditToken).all()

    const isolationTests = await c.env.DB.prepare(`
      SELECT * FROM isolation_tests WHERE audit_el_token = ? ORDER BY test_date
    `).bind(auditToken).all()

    const pvZones = await c.env.DB.prepare(`
      SELECT * FROM pv_zones WHERE audit_token = ? ORDER BY zone_number
    `).bind(auditToken).all()

    // 2. Construire JSON structuré
    const exportData = {
      metadata: {
        export_date: new Date().toISOString(),
        export_format: 'json',
        version: '1.0',
        conformity: ['IEC 62446-1', 'IEC 62446-3', 'NF C 15-100']
      },
      audit: audit,
      configuration: config,
      modules: {
        el: elModules.results,
        iv: ivMeasurements.results,
        visual: visualInspections.results,
        isolation: isolationTests.results
      },
      zones: pvZones.results,
      statistics: {
        total_modules: elModules.results?.length || 0,
        total_iv_measurements: ivMeasurements.results?.length || 0,
        total_visual_inspections: visualInspections.results?.length || 0,
        total_isolation_tests: isolationTests.results?.length || 0
      }
    }

    const filename = `diagnostic-pv-${audit.project_name?.replace(/\s+/g, '-') || 'audit'}-${auditToken.substring(0, 8)}.json`

    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    })

  } catch (error: any) {
    console.error('Erreur export JSON:', error)
    return c.json({
      success: false,
      error: 'Erreur génération export JSON',
      details: error.message
    }, 500)
  }
})

// ============================================================================
// GET /api/exports/summary/:audit_token - Export résumé léger
// ============================================================================
exports.get('/summary/:audit_token', async (c) => {
  try {
    const auditToken = c.req.param('audit_token')

    // Stats uniquement
    const audit = await c.env.DB.prepare(`
      SELECT project_name, client_name, audit_token, created_at FROM el_audits WHERE audit_token = ?
    `).bind(auditToken).first()

    if (!audit) {
      return c.json({ success: false, error: 'Audit non trouvé' }, 404)
    }

    const stats = await c.env.DB.batch([
      c.env.DB.prepare('SELECT COUNT(*) as count FROM el_modules WHERE audit_token = ?').bind(auditToken),
      c.env.DB.prepare('SELECT COUNT(*) as count FROM el_modules WHERE audit_token = ? AND defect_type != "NONE"').bind(auditToken),
      c.env.DB.prepare('SELECT COUNT(*) as count FROM iv_measurements WHERE audit_token = ?').bind(auditToken),
      c.env.DB.prepare('SELECT AVG(pmax) as avg FROM iv_measurements WHERE audit_token = ? AND measurement_type = "reference"').bind(auditToken),
      c.env.DB.prepare('SELECT COUNT(*) as count FROM visual_inspections WHERE audit_token = ?').bind(auditToken),
      c.env.DB.prepare('SELECT COUNT(*) as count FROM isolation_tests WHERE audit_el_token = ?').bind(auditToken)
    ])

    const summary = {
      audit: audit,
      statistics: {
        modules_total: stats[0].results[0]?.count || 0,
        modules_defective: stats[1].results[0]?.count || 0,
        iv_measurements: stats[2].results[0]?.count || 0,
        iv_pmax_avg: (stats[3].results[0]?.avg || 0).toFixed(1) + ' W',
        visual_inspections: stats[4].results[0]?.count || 0,
        isolation_tests: stats[5].results[0]?.count || 0
      },
      conformity_rate: {
        el: ((1 - (stats[1].results[0]?.count || 0) / (stats[0].results[0]?.count || 1)) * 100).toFixed(1) + '%'
      }
    }

    return c.json({
      success: true,
      data: summary
    })

  } catch (error: any) {
    console.error('Erreur export summary:', error)
    return c.json({
      success: false,
      error: 'Erreur génération summary',
      details: error.message
    }, 500)
  }
})

export default exports
