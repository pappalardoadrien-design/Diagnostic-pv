import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

// Helper: Convert object to CSV row
function objectToCsvRow(obj: any, headers: string[]): string {
  return headers.map(header => {
    let value = obj[header]
    if (value === null || value === undefined) return ''
    if (typeof value === 'object') value = JSON.stringify(value)
    value = String(value).replace(/"/g, '""')
    return `"${value}"`
  }).join(',')
}

// Helper: Generate CSV from data
function generateCsv(data: any[], headers: string[]): string {
  if (data.length === 0) return headers.join(',') + '\n'
  
  let csv = headers.join(',') + '\n'
  data.forEach(row => {
    csv += objectToCsvRow(row, headers) + '\n'
  })
  return csv
}

// Export all audit data as CSV
app.get('/:auditToken', async (c) => {
  const { auditToken } = c.req.param()
  const { DB } = c.env

  try {
    // Get audit info
    const audit = await DB.prepare(`
      SELECT * FROM audits WHERE audit_token = ?
    `).bind(auditToken).first()

    if (!audit) {
      return c.json({ error: 'Audit not found' }, 404)
    }

    // Parse enabled modules
    const modules = JSON.parse(audit.modules_enabled || '[]')
    
    // Collect all CSV data
    const csvFiles: { [key: string]: string } = {}

    // 1. AUDIT GENERAL INFO
    csvFiles['audit_info'] = generateCsv([audit], [
      'audit_token', 'project_name', 'client_name', 'location', 
      'audit_date', 'technician', 'modules_enabled', 'status'
    ])

    // 2. MODULE EL
    if (modules.includes('EL')) {
      const elModules = await DB.prepare(`
        SELECT * FROM el_modules WHERE audit_token = ? ORDER BY id
      `).bind(auditToken).all()

      const elHeaders = [
        'id', 'module_id', 'position', 'defect_type', 'severity_level',
        'cell_defects', 'interconnect_issues', 'inactive_zones', 
        'description', 'photo_path', 'power_loss_estimate'
      ]
      csvFiles['el_modules'] = generateCsv(elModules.results || [], elHeaders)
    }

    // 3. MODULE I-V
    if (modules.includes('IV')) {
      const ivMeasurements = await DB.prepare(`
        SELECT * FROM iv_measurements WHERE audit_token = ? ORDER BY id DESC
      `).bind(auditToken).all()

      const ivHeaders = [
        'id', 'string_number', 'voc', 'isc', 'vmp', 'imp', 'pmp',
        'fill_factor', 'efficiency', 'temperature', 'irradiance',
        'curve_data', 'notes'
      ]
      csvFiles['iv_measurements'] = generateCsv(ivMeasurements.results || [], ivHeaders)
    }

    // 4. MODULE VISUAL
    if (modules.includes('VISUAL')) {
      const visualInspections = await DB.prepare(`
        SELECT * FROM visual_inspections WHERE audit_token = ? ORDER BY id DESC
      `).bind(auditToken).all()

      const visualHeaders = [
        'id', 'inspection_type', 'component', 'severity',
        'description', 'recommendation', 'photo_path', 'location'
      ]
      csvFiles['visual_inspections'] = generateCsv(visualInspections.results || [], visualHeaders)
    }

    // 5. MODULE ISOLATION
    if (modules.includes('ISOLATION')) {
      const isolationTests = await DB.prepare(`
        SELECT * FROM isolation_tests WHERE audit_token = ? ORDER BY id DESC
      `).bind(auditToken).all()

      const isolationHeaders = [
        'id', 'test_type', 'positive_resistance', 'negative_resistance',
        'earth_resistance', 'voltage', 'temperature', 'humidity',
        'result', 'notes'
      ]
      csvFiles['isolation_tests'] = generateCsv(isolationTests.results || [], isolationHeaders)
    }

    // Generate ZIP file content (multi-file CSV export)
    // For now, we'll concatenate all CSVs with separators
    let fullCsv = `DIAGNOSTIC PV - EXPORT COMPLET\n`
    fullCsv += `Audit: ${audit.project_name}\n`
    fullCsv += `Token: ${auditToken}\n`
    fullCsv += `Date: ${new Date().toISOString()}\n`
    fullCsv += `\n==========================================================\n\n`

    Object.entries(csvFiles).forEach(([name, content]) => {
      fullCsv += `\n\n===== ${name.toUpperCase()} =====\n\n`
      fullCsv += content
    })

    // Return CSV file
    return new Response(fullCsv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="audit_${auditToken}_export.csv"`
      }
    })

  } catch (error: any) {
    console.error('Export CSV error:', error)
    return c.json({ error: error.message }, 500)
  }
})

// Export individual module data
app.get('/:auditToken/:module', async (c) => {
  const { auditToken, module } = c.req.param()
  const { DB } = c.env

  try {
    let data: any[] = []
    let headers: string[] = []
    let filename = `audit_${auditToken}_${module.toLowerCase()}.csv`

    switch (module.toUpperCase()) {
      case 'EL':
        const elResult = await DB.prepare(`
          SELECT * FROM el_modules WHERE audit_token = ? ORDER BY id
        `).bind(auditToken).all()
        data = elResult.results || []
        headers = [
          'id', 'module_id', 'position', 'defect_type', 'severity_level',
          'cell_defects', 'interconnect_issues', 'inactive_zones', 
          'description', 'photo_path', 'power_loss_estimate'
        ]
        break

      case 'IV':
        const ivResult = await DB.prepare(`
          SELECT * FROM iv_measurements WHERE audit_token = ? ORDER BY id DESC
        `).bind(auditToken).all()
        data = ivResult.results || []
        headers = [
          'id', 'string_number', 'voc', 'isc', 'vmp', 'imp', 'pmp',
          'fill_factor', 'efficiency', 'temperature', 'irradiance',
          'curve_data', 'notes'
        ]
        break

      case 'VISUAL':
        const visualResult = await DB.prepare(`
          SELECT * FROM visual_inspections WHERE audit_token = ? ORDER BY id DESC
        `).bind(auditToken).all()
        data = visualResult.results || []
        headers = [
          'id', 'inspection_type', 'component', 'severity',
          'description', 'recommendation', 'photo_path', 'location'
        ]
        break

      case 'ISOLATION':
        const isolationResult = await DB.prepare(`
          SELECT * FROM isolation_tests WHERE audit_token = ? ORDER BY id DESC
        `).bind(auditToken).all()
        data = isolationResult.results || []
        headers = [
          'id', 'test_type', 'positive_resistance', 'negative_resistance',
          'earth_resistance', 'voltage', 'temperature', 'humidity',
          'result', 'notes'
        ]
        break

      default:
        return c.json({ error: 'Module unknown' }, 400)
    }

    const csv = generateCsv(data, headers)

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })

  } catch (error: any) {
    console.error('Export CSV error:', error)
    return c.json({ error: error.message }, 500)
  }
})

export default app
