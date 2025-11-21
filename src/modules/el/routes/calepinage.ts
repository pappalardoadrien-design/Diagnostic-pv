import { Hono } from 'hono'
import type { D1Database } from '@cloudflare/workers-types'

type Bindings = {
  DB: D1Database
  R2: R2Bucket
}

const calepinageRoutes = new Hono<{ Bindings: Bindings }>()

// ============================================================================
// GET /api/el/calepinage/:audit_token
// Plan de calepinage conforme au câblage réel de la centrale
// ============================================================================
calepinageRoutes.get('/:audit_token', async (c) => {
  try {
    const { DB } = c.env
    const auditToken = c.req.param('audit_token')
    
    // Get audit info
    const audit = await DB.prepare(`
      SELECT a.*, ea.id as el_audit_id
      FROM audits a
      LEFT JOIN el_audits ea ON a.audit_token = ea.audit_token
      WHERE a.audit_token = ?
    `).bind(auditToken).first()
    
    if (!audit) {
      return c.json({ error: 'Audit introuvable' }, 404)
    }
    
    // Get all EL modules with defects
    const { results: modules } = await DB.prepare(`
      SELECT 
        module_identifier,
        string_number,
        position_in_string,
        defect_type,
        severity_level,
        comment
      FROM el_modules
      WHERE audit_token = ?
      ORDER BY string_number, position_in_string
    `).bind(auditToken).all()
    
    if (!modules || modules.length === 0) {
      return c.html(generateEmptyCalepinageHTML(audit))
    }
    
    // Group modules by string
    const modulesByString: Record<number, any[]> = {}
    modules.forEach((m: any) => {
      if (!modulesByString[m.string_number]) {
        modulesByString[m.string_number] = []
      }
      modulesByString[m.string_number].push(m)
    })
    
    // Generate HTML with wiring layout
    const html = generateCalepinageHTML(audit, modulesByString, modules.length)
    
    return c.html(html)
    
  } catch (error: any) {
    console.error('Error generating calepinage:', error)
    return c.json({ 
      error: 'Erreur génération plan de calepinage',
      details: error.message 
    }, 500)
  }
})

// ============================================================================
// HTML GENERATION
// ============================================================================

function generateEmptyCalepinageHTML(audit: any): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Plan de Calepinage - ${audit.project_name}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 40px;
      text-align: center;
      background: #f5f5f5;
    }
    .warning-box {
      max-width: 600px;
      margin: 100px auto;
      padding: 40px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    h1 { color: #ff9800; font-size: 24pt; margin-bottom: 20px; }
    p { color: #666; font-size: 12pt; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="warning-box">
    <h1>⚠️ Aucun module disponible</h1>
    <p><strong>Projet :</strong> ${audit.project_name || 'Non renseigné'}</p>
    <p><strong>Token :</strong> ${audit.audit_token}</p>
    <p>Aucun module EL trouvé pour générer le plan de calepinage.</p>
  </div>
</body>
</html>
  `
}

function generateCalepinageHTML(audit: any, modulesByString: Record<number, any[]>, totalModules: number): string {
  const reportNumber = `CALEPINAGE-${audit.id?.toString().padStart(6, '0') || '000000'}`
  const currentDate = new Date().toLocaleDateString('fr-FR')
  
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Plan de Calepinage - ${audit.project_name}</title>
  <style>
    @page {
      size: A3 landscape;
      margin: 10mm;
    }

    @media print {
      body { margin: 0; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .no-print { display: none !important; }
      .page-break { page-break-after: always; }
    }
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Arial', 'Helvetica', sans-serif;
      font-size: 9pt;
      line-height: 1.4;
      color: #333;
      background: white;
      padding: 10px;
    }
    
    .container {
      max-width: 420mm;
      margin: 0 auto;
      background: white;
    }
    
    /* HEADER */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 3px solid #1e40af;
    }
    
    .logo-text {
      font-size: 18pt;
      font-weight: bold;
      color: #1e40af;
    }
    
    .company-info {
      font-size: 7pt;
      color: #666;
      line-height: 1.4;
    }
    
    .report-info {
      text-align: right;
    }
    
    .report-number {
      font-size: 16pt;
      font-weight: bold;
      color: #1e40af;
    }
    
    .report-date {
      font-size: 9pt;
      color: #666;
    }
    
    /* TITLE */
    .doc-title {
      text-align: center;
      font-size: 16pt;
      font-weight: bold;
      color: #1e40af;
      margin: 15px 0;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .project-name {
      text-align: center;
      font-size: 12pt;
      color: #666;
      margin-bottom: 15px;
    }
    
    /* STATS */
    .stats-bar {
      display: flex;
      justify-content: center;
      gap: 30px;
      margin: 20px 0;
      padding: 15px;
      background: #f9fafb;
      border-radius: 8px;
    }
    
    .stat-item {
      text-align: center;
    }
    
    .stat-value {
      font-size: 20pt;
      font-weight: bold;
      color: #1e40af;
    }
    
    .stat-label {
      font-size: 8pt;
      color: #666;
      text-transform: uppercase;
    }
    
    /* STRING LAYOUT */
    .string-row {
      margin: 8px 0;
      display: flex;
      align-items: center;
      gap: 8px;
      page-break-inside: avoid;
    }
    
    .string-label {
      width: 60px;
      text-align: right;
      font-weight: bold;
      font-size: 10pt;
      color: #1e40af;
      flex-shrink: 0;
    }
    
    .start-arrow {
      width: 25px;
      height: 25px;
      flex-shrink: 0;
    }
    
    .start-arrow svg {
      width: 100%;
      height: 100%;
    }
    
    .modules-container {
      display: flex;
      gap: 3px;
      flex: 1;
      align-items: center;
    }
    
    .module-box {
      position: relative;
      width: 28px;
      height: 40px;
      border: 2px solid #666;
      background: white;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-size: 7pt;
      flex-shrink: 0;
    }
    
    .module-box.has-defect {
      background: #fff3cd;
      border-color: #f59e0b;
    }
    
    .module-box.severity-3,
    .module-box.severity-4 {
      background: #fee2e2;
      border-color: #dc2626;
    }
    
    .module-number {
      font-size: 6pt;
      color: #666;
    }
    
    .defect-marker {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 20px;
      height: 20px;
      color: #3b82f6;
      font-weight: bold;
      font-size: 18pt;
      line-height: 1;
      pointer-events: none;
    }
    
    .end-arrow {
      width: 25px;
      height: 25px;
      flex-shrink: 0;
    }
    
    .end-arrow svg {
      width: 100%;
      height: 100%;
    }
    
    /* LEGEND */
    .legend {
      margin: 20px 0;
      padding: 15px;
      background: #f9fafb;
      border-radius: 8px;
      display: flex;
      gap: 30px;
      justify-content: center;
      align-items: center;
      flex-wrap: wrap;
    }
    
    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .legend-box {
      width: 28px;
      height: 40px;
      border: 2px solid #666;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .legend-box.defect {
      background: #fff3cd;
      border-color: #f59e0b;
    }
    
    .legend-box.critical {
      background: #fee2e2;
      border-color: #dc2626;
    }
    
    .legend-label {
      font-size: 9pt;
      color: #333;
    }
    
    /* FOOTER */
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 2px solid #e0e0e0;
      text-align: center;
      font-size: 7pt;
      color: #999;
    }
    
    /* BUTTONS */
    .actions {
      position: fixed;
      top: 20px;
      right: 20px;
      display: flex;
      gap: 10px;
      z-index: 1000;
    }
    
    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      font-weight: bold;
      cursor: pointer;
      font-size: 10pt;
      background: #1e40af;
      color: white;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    }
    
    .btn:hover { opacity: 0.8; }
  </style>
</head>
<body>
  <!-- Action buttons -->
  <div class="actions no-print">
    <button class="btn" onclick="window.print()">🖨️ Imprimer / PDF</button>
  </div>

  <div class="container">
    <!-- Header -->
    <div class="header">
      <div>
        <div class="logo-text">DIAGNOSTIC PV</div>
        <div class="company-info">
          Expertise Photovoltaïque Indépendante<br>
          3 rue d'Apollo, 31240 L'Union<br>
          Tél : 05.81.10.16.59 | contact@diagpv.fr<br>
          RCS Toulouse 792 972 309
        </div>
      </div>
      <div class="report-info">
        <div class="report-number">${reportNumber}</div>
        <div class="report-date">${currentDate}</div>
      </div>
    </div>

    <!-- Title -->
    <div class="doc-title">PLAN DE CALEPINAGE - CÂBLAGE ÉLECTRIQUE</div>
    <div class="project-name">${audit.project_name || 'Non renseigné'}</div>

    <!-- Stats -->
    <div class="stats-bar">
      <div class="stat-item">
        <div class="stat-value">${Object.keys(modulesByString).length}</div>
        <div class="stat-label">Strings</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${totalModules}</div>
        <div class="stat-label">Modules totaux</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${countDefects(modulesByString)}</div>
        <div class="stat-label">Défauts détectés</div>
      </div>
    </div>

    <!-- String Layout -->
    ${generateStringRows(modulesByString)}

    <!-- Legend -->
    <div class="legend">
      <div class="legend-item">
        <div class="legend-box"></div>
        <span class="legend-label">Module OK</span>
      </div>
      <div class="legend-item">
        <div class="legend-box defect">
          <span style="color: #3b82f6; font-size: 14pt; font-weight: bold;">✕</span>
        </div>
        <span class="legend-label">Défaut mineur/modéré</span>
      </div>
      <div class="legend-item">
        <div class="legend-box critical">
          <span style="color: #3b82f6; font-size: 14pt; font-weight: bold;">✕</span>
        </div>
        <span class="legend-label">Défaut sévère/critique</span>
      </div>
      <div class="legend-item">
        <svg width="30" height="20" style="vertical-align: middle;">
          <defs>
            <marker id="arrowhead-legend" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
              <polygon points="0 0, 10 3, 0 6" fill="#1e40af" />
            </marker>
          </defs>
          <line x1="0" y1="10" x2="25" y2="10" stroke="#1e40af" stroke-width="2" marker-end="url(#arrowhead-legend)" />
        </svg>
        <span class="legend-label">Sens du câblage électrique</span>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      Diagnostic Photovoltaïque - Expertise Indépendante depuis 2012<br>
      Ce document est confidentiel et destiné exclusivement à ${audit.client_name || 'Client'}<br>
      Document généré le ${currentDate} - Référence ${reportNumber}
    </div>
  </div>

  <script>
    // Auto-print if requested
    if (window.location.search.includes('autoprint=true')) {
      window.onload = () => window.print();
    }
  </script>
</body>
</html>
  `
}

function generateStringRows(modulesByString: Record<number, any[]>): string {
  const stringNumbers = Object.keys(modulesByString).map(Number).sort((a, b) => a - b)
  
  return stringNumbers.map(stringNum => {
    const modules = modulesByString[stringNum]
    const moduleCount = modules.length
    
    return `
    <div class="string-row">
      <div class="string-label">S${stringNum}</div>
      
      <!-- Start arrow -->
      <div class="start-arrow">
        <svg viewBox="0 0 25 25">
          <defs>
            <marker id="arrowhead-start-${stringNum}" markerWidth="10" markerHeight="10" refX="0" refY="3" orient="auto">
              <polygon points="10 0, 0 3, 10 6" fill="#1e40af" />
            </marker>
          </defs>
          <circle cx="12.5" cy="12.5" r="8" fill="none" stroke="#1e40af" stroke-width="2"/>
          <line x1="8" y1="12.5" x2="17" y2="12.5" stroke="#1e40af" stroke-width="2" marker-start="url(#arrowhead-start-${stringNum})" />
        </svg>
      </div>
      
      <!-- Modules -->
      <div class="modules-container">
        ${modules.map(m => {
          const hasDefect = m.defect_type && m.defect_type !== 'none' && m.defect_type !== 'pending'
          const severityLevel = m.severity_level || 0
          
          let className = 'module-box'
          if (hasDefect) {
            className += ' has-defect'
            if (severityLevel >= 3) {
              className += ` severity-${severityLevel}`
            }
          }
          
          return `
            <div class="${className}" title="${m.module_identifier}${hasDefect ? ' - ' + m.defect_type : ''}">
              <div class="module-number">${m.position_in_string}</div>
              ${hasDefect ? '<div class="defect-marker">✕</div>' : ''}
            </div>
          `
        }).join('')}
      </div>
      
      <!-- End arrow -->
      <div class="end-arrow">
        <svg viewBox="0 0 25 25">
          <defs>
            <marker id="arrowhead-end-${stringNum}" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
              <polygon points="0 0, 10 3, 0 6" fill="#1e40af" />
            </marker>
          </defs>
          <circle cx="12.5" cy="12.5" r="8" fill="none" stroke="#1e40af" stroke-width="2"/>
          <line x1="5" y1="12.5" x2="20" y2="12.5" stroke="#1e40af" stroke-width="2" marker-end="url(#arrowhead-end-${stringNum})" />
        </svg>
      </div>
    </div>
    `
  }).join('')
}

function countDefects(modulesByString: Record<number, any[]>): number {
  let count = 0
  Object.values(modulesByString).forEach(modules => {
    modules.forEach(m => {
      if (m.defect_type && m.defect_type !== 'none' && m.defect_type !== 'pending') {
        count++
      }
    })
  })
  return count
}

export default calepinageRoutes
