import { Hono } from 'hono'

const calepinageGridRoutes = new Hono()

/**
 * GET /api/el/calepinage-grid/:audit_token
 * Plan de calepinage - Vue GRILLE conforme au plan de toiture
 */
calepinageGridRoutes.get('/:audit_token', async (c) => {
  const { audit_token } = c.req.param()
  const { DB } = c.env as { DB: D1Database }

  try {
    // Get audit info
    const audit = await DB.prepare(`
      SELECT * FROM el_audits WHERE audit_token = ?
    `).bind(audit_token).first()

    if (!audit) {
      return c.html(generateErrorHTML('Audit non trouvé', audit_token))
    }

    // Get all modules grouped by string
    const modules = await DB.prepare(`
      SELECT 
        string_number,
        position_in_string,
        module_identifier,
        defect_type,
        severity_level
      FROM el_modules
      WHERE el_audit_id = ?
      ORDER BY string_number ASC, position_in_string ASC
    `).bind(audit.id).all()

    if (!modules.results || modules.results.length === 0) {
      return c.html(generateNoModulesHTML(audit))
    }

    // Group modules by string
    const modulesByString: Record<number, any[]> = {}
    modules.results.forEach((m: any) => {
      if (!modulesByString[m.string_number]) {
        modulesByString[m.string_number] = []
      }
      modulesByString[m.string_number].push(m)
    })

    return c.html(generateGridCalepinageHTML(audit, modulesByString))

  } catch (error: any) {
    console.error('Error generating grid calepinage:', error)
    return c.html(generateErrorHTML('Erreur serveur', audit_token, error.message))
  }
})

function generateErrorHTML(title: string, token: string, details?: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Erreur - Calepinage</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; background: #f5f5f5; }
    .error-box { background: white; padding: 30px; border-radius: 8px; max-width: 600px; margin: 0 auto; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    h1 { color: #dc2626; }
    p { color: #666; font-size: 12pt; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="error-box">
    <h1>⚠️ ${title}</h1>
    <p><strong>Token :</strong> ${token}</p>
    ${details ? `<p><strong>Détails :</strong> ${details}</p>` : ''}
  </div>
</body>
</html>
  `
}

function generateNoModulesHTML(audit: any): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Calepinage - Aucun module</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; background: #f5f5f5; }
    .warning-box { background: white; padding: 30px; border-radius: 8px; max-width: 600px; margin: 0 auto; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    h1 { color: #f59e0b; }
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

function generateGridCalepinageHTML(audit: any, modulesByString: Record<number, any[]>): string {
  const reportNumber = `CALEPINAGE-${audit.id?.toString().padStart(6, '0') || '000000'}`
  const currentDate = new Date().toLocaleDateString('fr-FR')
  const stringNumbers = Object.keys(modulesByString).map(Number).sort((a, b) => a - b)
  
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
    }
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Arial', 'Helvetica', sans-serif;
      font-size: 9pt;
      color: #333;
      background: white;
      padding: 10px;
    }
    
    .container {
      max-width: 420mm;
      margin: 0 auto;
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
    }
    
    .project-name {
      text-align: center;
      font-size: 12pt;
      color: #666;
      margin-bottom: 10px;
    }
    
    .orientation {
      text-align: center;
      font-size: 10pt;
      font-weight: bold;
      color: #999;
      margin-bottom: 15px;
    }
    
    /* GRID LAYOUT */
    .grid-container {
      position: relative;
      margin: 20px auto;
      max-width: 100%;
      padding-left: 50px;
      padding-right: 50px;
    }
    
    .grid-row {
      display: flex;
      gap: 2px;
      margin-bottom: 15px;
      position: relative;
      align-items: center;
    }
    
    .row-label {
      position: absolute;
      left: -50px;
      top: 50%;
      transform: translateY(-50%);
      font-weight: bold;
      font-size: 9pt;
      color: #1e40af;
    }
    
    .connection-icon {
      width: 24px;
      height: 24px;
      border: 2px solid #1e40af;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8pt;
      color: #1e40af;
      font-weight: bold;
      flex-shrink: 0;
      background: white;
    }
    
    .connection-icon.start {
      margin-right: 8px;
    }
    
    .connection-icon.end {
      margin-left: 8px;
    }
    
    .modules-wrapper {
      display: flex;
      gap: 2px;
      flex: 1;
    }
    
    .string-spacer {
      display: flex;
      justify-content: center;
      align-items: center;
      position: relative;
      height: 40px;
      margin-bottom: 15px;
    }
    
    .vertical-arrow {
      display: flex;
      flex-direction: column;
      align-items: center;
      color: #dc2626;
    }
    
    .vertical-arrow svg {
      width: 20px;
      height: 30px;
    }
    
    .module-cell {
      position: relative;
      width: 28px;
      height: 40px;
      border: 1.5px solid #666;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-size: 6pt;
      flex-shrink: 0;
    }
    
    /* Module colors */
    .module-cell.ok {
      background: #d4f4dd;
      border-color: #4ade80;
    }
    
    .module-cell.inegalite {
      background: #fef3c7;
      border-color: #fbbf24;
    }
    
    .module-cell.microfissures {
      background: #fed7aa;
      border-color: #fb923c;
    }
    
    .module-cell.impact_cellulaire {
      background: #fecaca;
      border-color: #f87171;
    }
    
    .module-cell.string_ouvert {
      background: #bfdbfe;
      border-color: #60a5fa;
    }
    
    .module-cell.non_raccorde {
      background: #e5e7eb;
      border-color: #9ca3af;
    }
    
    .module-cell.vide {
      background: #e9d5ff;
      border-color: #c084fc;
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
      color: #3b82f6;
      font-weight: bold;
      font-size: 16pt;
      pointer-events: none;
    }
    
    /* WIRING ARROWS */
    .wiring-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 10;
    }
    
    .wire-arrow {
      position: absolute;
      stroke: #dc2626;
      stroke-width: 2;
      fill: none;
    }
    
    .wire-start, .wire-end {
      position: absolute;
      width: 20px;
      height: 20px;
    }
    
    .connection-cross {
      position: absolute;
      color: #3b82f6;
      font-size: 20pt;
      font-weight: bold;
      transform: translate(-50%, -50%);
    }
    
    /* LEGEND */
    .legend {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      margin: 20px 0;
      padding: 15px;
      background: #f9fafb;
      border-radius: 8px;
      justify-content: center;
    }
    
    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .legend-box {
      width: 30px;
      height: 40px;
      border: 2px solid #666;
      flex-shrink: 0;
    }
    
    .legend-label {
      font-size: 9pt;
      color: #333;
    }
    
    /* FOOTER */
    .footer {
      margin-top: 20px;
      padding-top: 10px;
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
    <div class="orientation">⬆️ Nord</div>

    <!-- Grid Layout -->
    <div class="grid-container">
      ${generateGridRows(modulesByString, stringNumbers)}
    </div>
    
    <div class="orientation">⬇️ Sud</div>

    <!-- Legend -->
    <div class="legend">
      <div class="legend-item">
        <div class="legend-box" style="background: #d4f4dd; border-color: #4ade80;"></div>
        <span class="legend-label">✅ OK</span>
      </div>
      <div class="legend-item">
        <div class="legend-box" style="background: #fef3c7; border-color: #fbbf24;"></div>
        <span class="legend-label">⚠️ Inégalité</span>
      </div>
      <div class="legend-item">
        <div class="legend-box" style="background: #fed7aa; border-color: #fb923c;"></div>
        <span class="legend-label">🔶 Microfissures</span>
      </div>
      <div class="legend-item">
        <div class="legend-box" style="background: #fecaca; border-color: #f87171;"></div>
        <span class="legend-label">🚨 Impact Cellulaire</span>
      </div>
      <div class="legend-item">
        <div class="legend-box" style="background: #bfdbfe; border-color: #60a5fa;"></div>
        <span class="legend-label">🔌 String ouvert</span>
      </div>
      <div class="legend-item">
        <div class="legend-box" style="background: #e5e7eb; border-color: #9ca3af;"></div>
        <span class="legend-label">⚫ Non raccordé</span>
      </div>
      <div class="legend-item">
        <svg width="80" height="30" style="vertical-align: middle;">
          <defs>
            <marker id="arrowhead-legend" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
              <polygon points="0 0, 10 3, 0 6" fill="#dc2626" />
            </marker>
          </defs>
          <line x1="5" y1="15" x2="75" y2="15" stroke="#dc2626" stroke-width="2" marker-end="url(#arrowhead-legend)" />
        </svg>
        <span class="legend-label">➡️ Câblage</span>
      </div>
      <div class="legend-item">
        <span style="color: #3b82f6; font-size: 20pt; font-weight: bold;">✗</span>
        <span class="legend-label">Connexion inter-string</span>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      Diagnostic Photovoltaïque - Expertise Indépendante depuis 2012<br>
      Ce document est confidentiel - ${audit.client_name || 'Client'}<br>
      Document généré le ${currentDate} - Référence ${reportNumber}
    </div>
  </div>

  <script>
    if (window.location.search.includes('autoprint=true')) {
      window.onload = () => window.print();
    }
  </script>
</body>
</html>
  `
}

function generateGridRows(modulesByString: Record<number, any[]>, stringNumbers: number[]): string {
  let html = ''
  
  stringNumbers.forEach((stringNum, stringIndex) => {
    const modules = modulesByString[stringNum]
    const isReversed = stringNum % 2 === 0  // Even strings go right-to-left
    const isLastString = stringIndex === stringNumbers.length - 1
    
    // Reverse module order for even strings (serpentine wiring)
    const displayModules = isReversed ? [...modules].reverse() : modules
    
    // Calculate indent for serpentine alignment
    const moduleWidth = 30 // 28px + 2px gap
    const maxModules = Math.max(...stringNumbers.map(n => modulesByString[n].length))
    const currentModules = modules.length
    const indent = isReversed ? 0 : (maxModules - currentModules) * moduleWidth
    
    html += `
    <div class="grid-row" style="padding-left: ${indent}px;">
      <div class="row-label">S${stringNum}</div>
      
      <!-- Start connection icon -->
      <div class="connection-icon start">⊙</div>
      
      <!-- Modules -->
      <div class="modules-wrapper">
        ${displayModules.map((m, idx) => {
          const defectType = m.defect_type || 'none'
          const hasDefect = defectType !== 'none' && defectType !== 'pending'
          const cssClass = hasDefect ? defectType : 'ok'
          
          return `
          <div class="module-cell ${cssClass}" title="${m.module_identifier}${hasDefect ? ' - ' + defectType : ' - OK'}">
            <div class="module-number">${m.position_in_string}</div>
            ${hasDefect ? '<div class="defect-marker">✕</div>' : ''}
          </div>
          `
        }).join('')}
      </div>
      
      <!-- End connection icon -->
      <div class="connection-icon end">⊙</div>
    </div>
    `
    
    // Add vertical arrow between strings (except after last string)
    if (!isLastString) {
      // Arrow position: left for odd strings ending on right, right for even strings ending on left
      const arrowAlign = isReversed ? 'flex-start' : 'flex-end'
      const arrowIndent = isReversed ? indent : indent + (maxModules * moduleWidth)
      
      html += `
      <div class="string-spacer" style="padding-left: ${arrowIndent}px; justify-content: ${arrowAlign};">
        <div class="vertical-arrow">
          <svg viewBox="0 0 20 30">
            <defs>
              <marker id="arrowhead-down-${stringNum}" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
                <polygon points="0 0, 8 4, 0 8" fill="#dc2626" />
              </marker>
            </defs>
            <line x1="10" y1="2" x2="10" y2="28" stroke="#dc2626" stroke-width="2" marker-end="url(#arrowhead-down-${stringNum})" />
          </svg>
        </div>
      </div>
      `
    }
  })
  
  return html
}

export default calepinageGridRoutes
