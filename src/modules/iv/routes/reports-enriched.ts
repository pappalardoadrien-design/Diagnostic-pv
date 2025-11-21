import { Hono } from 'hono'
import type { D1Database } from '@cloudflare/workers-types'

type Bindings = {
  DB: D1Database
  R2: R2Bucket
}

const ivEnrichedReportsRoutes = new Hono<{ Bindings: Bindings }>()

// ============================================================================
// HELPERS: Statistics & Analysis
// ============================================================================

interface ModuleData {
  module_identifier: string
  string_number: number
  position_in_string: number
  
  // EL data
  el_defect_type?: string
  el_severity?: number
  
  // IV Reference data
  iv_voc?: number
  iv_isc?: number
  iv_pmax?: number
  iv_ff?: number
  iv_rs?: number
  iv_rsh?: number
  
  // PVserv data (courbes sombres + diodes)
  pvserv_ff?: number
  pvserv_rds?: number
  pvserv_uf?: number
  pvserv_type?: string // 'bright' ou 'dark'
  pvserv_curve?: string // JSON courbe
  
  // Isolation data
  isolation_result?: string
  isolation_resistance?: number
}

interface StringAnalysis {
  string_number: number
  modules: ModuleData[]
  stats: {
    count: number
    avg_voc: number
    avg_isc: number
    avg_pmax: number
    avg_ff: number
    avg_rds: number
    std_pmax: number
    deviation_max: number
  }
  defects: {
    el_defects: number
    diodes_hs: number // Uf < 500mV
    high_rds: number // Rds > 5Ω
    cell_breaks: number
    isolation_fails: number
  }
  curve_consistency: {
    overlapping: boolean // Courbes se superposent bien
    outliers: string[] // module_identifiers des valeurs aberrantes
  }
}

function calculateStringAnalysis(modules: ModuleData[]): StringAnalysis {
  const stringNumber = modules[0]?.string_number || 0
  
  // Filter valid data
  const vocs = modules.map(m => m.iv_voc).filter((v): v is number => v != null && v > 0)
  const iscs = modules.map(m => m.iv_isc).filter((v): v is number => v != null && v > 0)
  const pmaxs = modules.map(m => m.iv_pmax).filter((v): v is number => v != null && v > 0)
  const ffs = modules.map(m => m.iv_ff).filter((v): v is number => v != null && v > 0)
  const rdss = modules.map(m => m.pvserv_rds).filter((v): v is number => v != null && v > 0)
  
  const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
  const std = (arr: number[], mean: number) => {
    if (arr.length === 0) return 0
    const variance = arr.map(x => Math.pow(x - mean, 2))
    return Math.sqrt(avg(variance))
  }
  
  const avg_pmax = avg(pmaxs)
  const std_pmax = std(pmaxs, avg_pmax)
  
  // Detect defects
  const el_defects = modules.filter(m => m.el_defect_type && m.el_defect_type !== 'none').length
  const diodes_hs = modules.filter(m => m.pvserv_uf != null && m.pvserv_uf < 500).length
  const high_rds = modules.filter(m => m.pvserv_rds != null && m.pvserv_rds > 5).length
  const isolation_fails = modules.filter(m => m.isolation_result === 'fail').length
  
  // Detect outliers (deviation > 15% from mean)
  const outliers: string[] = []
  modules.forEach(m => {
    if (m.iv_pmax && avg_pmax > 0) {
      const deviation = Math.abs((m.iv_pmax - avg_pmax) / avg_pmax) * 100
      if (deviation > 15) {
        outliers.push(m.module_identifier)
      }
    }
  })
  
  // Check curve consistency (std < 5% of mean = good overlap)
  const overlapping = std_pmax < (avg_pmax * 0.05)
  
  return {
    string_number: stringNumber,
    modules,
    stats: {
      count: modules.length,
      avg_voc: avg(vocs),
      avg_isc: avg(iscs),
      avg_pmax,
      avg_ff: avg(ffs),
      avg_rds: avg(rdss),
      std_pmax,
      deviation_max: pmaxs.length > 0 ? Math.max(...pmaxs.map(p => Math.abs((p - avg_pmax) / avg_pmax) * 100)) : 0
    },
    defects: {
      el_defects,
      diodes_hs,
      high_rds,
      cell_breaks: 0, // TODO: parse from pvserv
      isolation_fails
    },
    curve_consistency: {
      overlapping,
      outliers
    }
  }
}

// ============================================================================
// GET /api/iv/reports-enriched/full/:audit_token
// Rapport IV enrichi avec corrélation multi-modules + graphiques
// ============================================================================
ivEnrichedReportsRoutes.get('/full/:audit_token', async (c) => {
  try {
    const { DB } = c.env
    const auditToken = c.req.param('audit_token')
    
    // Get audit info
    const audit = await DB.prepare(`
      SELECT * FROM audits WHERE audit_token = ?
    `).bind(auditToken).first()
    
    if (!audit) {
      return c.json({ error: 'Audit introuvable' }, 404)
    }
    
    // Get unified module data (EL + IV + PVserv + Isolation)
    const { results: modulesData } = await DB.prepare(`
      SELECT 
        em.module_identifier,
        em.string_number,
        em.position_in_string,
        em.defect_type as el_defect_type,
        em.severity_level as el_severity,
        iv_ref.voc as iv_voc,
        iv_ref.isc as iv_isc,
        iv_ref.pmax as iv_pmax,
        iv_ref.fill_factor as iv_ff,
        iv_ref.rs as iv_rs,
        iv_ref.rsh as iv_rsh,
        iv_ref.iv_curve_data as iv_curve_data,
        iv_dark.rs as iv_dark_rs,
        iv_dark.rsh as iv_dark_rsh,
        iv_dark.iv_curve_data as iv_dark_curve_data,
        pv.ff as pvserv_ff,
        pv.rds as pvserv_rds,
        pv.uf as pvserv_uf,
        pv.measurement_type as pvserv_type,
        pv.iv_curve_data as pvserv_curve
      FROM el_modules em
      LEFT JOIN iv_measurements iv_ref ON em.module_identifier = iv_ref.module_identifier 
        AND iv_ref.measurement_type = 'reference'
      LEFT JOIN iv_measurements iv_dark ON em.module_identifier = iv_dark.module_identifier 
        AND iv_dark.measurement_type = 'dark'
      LEFT JOIN pvserv_measurements pv ON em.module_identifier = pv.module_identifier
      WHERE em.audit_token = ?
      ORDER BY em.string_number, em.position_in_string
    `).bind(auditToken).all()
    
    if (!modulesData || modulesData.length === 0) {
      return c.html(generateNoDataHTML(audit))
    }
    
    // Group by string
    const byString: Record<number, ModuleData[]> = {}
    modulesData.forEach((m: any) => {
      const stringNum = m.string_number || 0
      if (!byString[stringNum]) byString[stringNum] = []
      byString[stringNum].push(m as ModuleData)
    })
    
    // Analyze each string
    const stringAnalyses: StringAnalysis[] = Object.values(byString).map(calculateStringAnalysis)
    
    // Global statistics
    const totalModules = modulesData.length
    const totalDefects = stringAnalyses.reduce((sum, s) => sum + s.defects.el_defects, 0)
    const totalDiodesHS = stringAnalyses.reduce((sum, s) => sum + s.defects.diodes_hs, 0)
    const totalHighRds = stringAnalyses.reduce((sum, s) => sum + s.defects.high_rds, 0)
    const totalIsolationFails = stringAnalyses.reduce((sum, s) => sum + s.defects.isolation_fails, 0)
    
    const globalStats = {
      totalModules,
      totalDefects,
      totalDiodesHS,
      totalHighRds,
      totalIsolationFails,
      defectRate: totalModules > 0 ? ((totalDefects / totalModules) * 100).toFixed(1) : '0'
    }
    
    // Generate HTML report
    const html = generateEnrichedReportHTML(audit, stringAnalyses, globalStats)
    
    return c.html(html)
    
  } catch (error: any) {
    console.error('Error generating enriched IV report:', error)
    return c.json({ 
      error: 'Erreur génération rapport',
      details: error.message 
    }, 500)
  }
})

// ============================================================================
// HTML GENERATION
// ============================================================================

function generateNoDataHTML(audit: any): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Aucune donnée - ${audit.project_name}</title>
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
    <h1>⚠️ Aucune donnée disponible</h1>
    <p><strong>Projet :</strong> ${audit.project_name || 'Non renseigné'}</p>
    <p><strong>Token :</strong> ${audit.audit_token}</p>
    <p>Aucun module avec données EL/IV/PVserv trouvé pour cet audit.</p>
  </div>
</body>
</html>
  `
}

function generateEnrichedReportHTML(audit: any, stringAnalyses: StringAnalysis[], globalStats: any): string {
  const reportNumber = `IV-ENR-${audit.id.toString().padStart(6, '0')}`
  const currentDate = new Date().toLocaleDateString('fr-FR')
  const auditDate = new Date(audit.audit_date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport IV Enrichi - ${audit.project_name}</title>
  <style>
    @page {
      size: A4;
      margin: 15mm;
    }

    @media print {
      body { margin: 0; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .no-print { display: none !important; }
      .page-break { page-break-after: always; }
      .page-break-avoid { page-break-inside: avoid; }
    }
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Arial', 'Helvetica', sans-serif;
      font-size: 10pt;
      line-height: 1.5;
      color: #333;
      background: white;
    }
    
    .container {
      max-width: 210mm;
      margin: 0 auto;
      padding: 10mm;
      background: white;
    }
    
    /* HEADER */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 25px;
      padding-bottom: 15px;
      border-bottom: 4px solid #1e40af;
    }
    
    .logo-text {
      font-size: 24pt;
      font-weight: bold;
      color: #1e40af;
      margin-bottom: 5px;
    }
    
    .company-info {
      font-size: 8pt;
      color: #666;
      line-height: 1.6;
    }
    
    .report-number {
      font-size: 20pt;
      font-weight: bold;
      color: #1e40af;
      text-align: right;
    }
    
    .report-date {
      font-size: 10pt;
      color: #666;
      text-align: right;
    }
    
    /* TITLE */
    .doc-title {
      text-align: center;
      font-size: 18pt;
      font-weight: bold;
      color: #1e40af;
      margin: 20px 0;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .project-name {
      text-align: center;
      font-size: 14pt;
      color: #666;
      margin-bottom: 20px;
    }
    
    /* STATS GRID */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 12px;
      margin: 20px 0;
    }
    
    .stat-card {
      text-align: center;
      padding: 15px;
      background: white;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
    }
    
    .stat-card.critical { border-color: #dc2626; background: #fef2f2; }
    .stat-card.warning { border-color: #f59e0b; background: #fffbeb; }
    .stat-card.success { border-color: #10b981; background: #f0fdf4; }
    
    .stat-value {
      font-size: 24pt;
      font-weight: bold;
      color: #1e40af;
    }
    
    .stat-label {
      font-size: 8pt;
      color: #666;
      text-transform: uppercase;
      margin-top: 5px;
    }
    
    /* STRING SECTION */
    .string-section {
      margin: 30px 0;
      page-break-inside: avoid;
    }
    
    .string-header {
      background: linear-gradient(to right, #1e40af, #3b82f6);
      color: white;
      padding: 12px 20px;
      font-size: 14pt;
      font-weight: bold;
      border-radius: 8px 8px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .string-content {
      border: 2px solid #1e40af;
      border-top: none;
      padding: 20px;
      border-radius: 0 0 8px 8px;
      background: #f9fafb;
    }
    
    /* MODULE GRID */
    .modules-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
      gap: 8px;
      margin: 15px 0;
    }
    
    .module-cell {
      position: relative;
      width: 50px;
      height: 40px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-size: 8pt;
      font-weight: bold;
      border-radius: 5px;
      border: 2px solid;
      cursor: pointer;
      transition: transform 0.2s;
    }
    
    .module-cell:hover {
      transform: scale(1.1);
      z-index: 10;
    }
    
    /* Multi-défaut coloring */
    .module-ok { 
      background: linear-gradient(135deg, #10b981, #34d399); 
      border-color: #059669; 
      color: white; 
    }
    .module-el-defect { 
      background: linear-gradient(135deg, #fbbf24, #fcd34d); 
      border-color: #f59e0b; 
      color: #78350f; 
    }
    .module-diode-hs { 
      background: linear-gradient(135deg, #ef4444, #f87171); 
      border-color: #dc2626; 
      color: white; 
    }
    .module-high-rds { 
      background: linear-gradient(135deg, #f97316, #fb923c); 
      border-color: #ea580c; 
      color: white; 
    }
    .module-multi-defect { 
      background: linear-gradient(135deg, #dc2626, #7c2d12); 
      border-color: #991b1b; 
      color: white; 
    }
    .module-outlier {
      background: linear-gradient(135deg, #a855f7, #c084fc);
      border-color: #9333ea;
      color: white;
    }
    
    .module-indicator {
      font-size: 6pt;
      margin-top: 2px;
    }
    
    /* COURBES CHART */
    .chart-container {
      margin: 20px 0;
      padding: 20px;
      background: white;
      border-radius: 8px;
      border: 2px solid #e0e0e0;
    }
    
    .chart-title {
      font-size: 12pt;
      font-weight: bold;
      color: #1e40af;
      margin-bottom: 15px;
    }
    
    canvas {
      max-width: 100%;
      height: auto !important;
    }
    
    /* TABLE */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 9pt;
    }
    
    th {
      background: #1e40af;
      color: white;
      padding: 8px;
      text-align: left;
      font-size: 9pt;
    }
    
    td {
      padding: 6px 8px;
      border-bottom: 1px solid #e0e0e0;
    }
    
    tr:nth-child(even) {
      background: #f9fafb;
    }
    
    /* ALERT BOXES */
    .alert-box {
      margin: 15px 0;
      padding: 15px;
      border-left: 4px solid;
      border-radius: 5px;
      page-break-inside: avoid;
    }
    
    .alert-box.critical {
      border-color: #dc2626;
      background: #fef2f2;
    }
    
    .alert-box.warning {
      border-color: #f59e0b;
      background: #fffbeb;
    }
    
    .alert-box.info {
      border-color: #3b82f6;
      background: #eff6ff;
    }
    
    .alert-title {
      font-weight: bold;
      font-size: 11pt;
      margin-bottom: 8px;
    }
    
    .alert-box ul {
      margin-left: 20px;
      margin-top: 8px;
    }
    
    .alert-box li {
      margin: 5px 0;
    }
    
    /* FOOTER */
    .footer {
      margin-top: 40px;
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
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-weight: bold;
      cursor: pointer;
      font-size: 11pt;
      background: #1e40af;
      color: white;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    }
    
    .btn:hover { opacity: 0.8; }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
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
      <div>
        <div class="report-number">${reportNumber}</div>
        <div class="report-date">${currentDate}</div>
      </div>
    </div>

    <!-- Title -->
    <div class="doc-title">RAPPORT I-V ENRICHI<br><span style="font-size: 12pt;">Corrélation Multi-Modules + Analyse Diodes</span></div>
    <div class="project-name">${audit.project_name || 'Non renseigné'}</div>

    <!-- Global Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${globalStats.totalModules}</div>
        <div class="stat-label">Modules analysés</div>
      </div>
      <div class="stat-card ${globalStats.totalDefects > 0 ? 'warning' : 'success'}">
        <div class="stat-value">${globalStats.totalDefects}</div>
        <div class="stat-label">Défauts EL</div>
      </div>
      <div class="stat-card ${globalStats.totalDiodesHS > 0 ? 'critical' : 'success'}">
        <div class="stat-value">${globalStats.totalDiodesHS}</div>
        <div class="stat-label">Diodes HS</div>
      </div>
      <div class="stat-card ${globalStats.totalHighRds > 0 ? 'warning' : 'success'}">
        <div class="stat-value">${globalStats.totalHighRds}</div>
        <div class="stat-label">Rds élevées</div>
      </div>
      <div class="stat-card ${globalStats.totalIsolationFails > 0 ? 'critical' : 'success'}">
        <div class="stat-value">${globalStats.totalIsolationFails}</div>
        <div class="stat-label">Isolation NOK</div>
      </div>
    </div>

    ${generateStringsHTML(stringAnalyses)}

    <!-- Footer -->
    <div class="footer">
      Diagnostic Photovoltaïque - Expertise Indépendante depuis 2012<br>
      Ce rapport est confidentiel et destiné exclusivement à ${audit.client_name || 'Client'}<br>
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

function generateStringsHTML(stringAnalyses: StringAnalysis[]): string {
  return stringAnalyses.map(stringAnalysis => {
    const { string_number, modules, stats, defects, curve_consistency } = stringAnalysis
    
    // Determine string health status
    let stringStatus = 'success'
    let stringStatusText = 'Excellent'
    if (defects.diodes_hs > 0 || defects.isolation_fails > 0) {
      stringStatus = 'critical'
      stringStatusText = 'CRITIQUE'
    } else if (defects.el_defects > 3 || defects.high_rds > 2 || !curve_consistency.overlapping) {
      stringStatus = 'warning'
      stringStatusText = 'Attention'
    }
    
    return `
    <div class="string-section page-break-avoid">
      <div class="string-header">
        <span>📊 STRING ${string_number} - ${modules.length} modules</span>
        <span class="stat-card ${stringStatus}" style="display: inline-block; padding: 5px 15px; margin: 0; font-size: 10pt;">
          ${stringStatusText}
        </span>
      </div>
      <div class="string-content">
        
        <!-- String Statistics -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px;">
          <div style="padding: 10px; background: white; border-radius: 5px; border: 1px solid #e0e0e0;">
            <div style="font-size: 8pt; color: #666;">Voc moyen</div>
            <div style="font-size: 14pt; font-weight: bold; color: #1e40af;">${stats.avg_voc.toFixed(2)} V</div>
          </div>
          <div style="padding: 10px; background: white; border-radius: 5px; border: 1px solid #e0e0e0;">
            <div style="font-size: 8pt; color: #666;">Pmax moyen</div>
            <div style="font-size: 14pt; font-weight: bold; color: #1e40af;">${stats.avg_pmax.toFixed(2)} W</div>
          </div>
          <div style="padding: 10px; background: white; border-radius: 5px; border: 1px solid #e0e0e0;">
            <div style="font-size: 8pt; color: #666;">FF moyen</div>
            <div style="font-size: 14pt; font-weight: bold; color: #1e40af;">${(stats.avg_ff * 100).toFixed(1)}%</div>
          </div>
          <div style="padding: 10px; background: white; border-radius: 5px; border: 1px solid #e0e0e0;">
            <div style="font-size: 8pt; color: #666;">Rds moyen</div>
            <div style="font-size: 14pt; font-weight: bold; color: ${stats.avg_rds > 5 ? '#dc2626' : '#1e40af'};">${stats.avg_rds.toFixed(2)} Ω</div>
          </div>
        </div>

        <!-- Module Grid Visualization -->
        <div style="margin: 20px 0;">
          <div style="font-weight: bold; font-size: 11pt; color: #1e40af; margin-bottom: 10px;">
            Cartographie modules (corrélation EL + IV + Diodes + Isolation)
          </div>
          <div class="modules-grid">
            ${modules.map(m => {
              const defectCount = 
                (m.el_defect_type && m.el_defect_type !== 'none' ? 1 : 0) +
                (m.pvserv_uf != null && m.pvserv_uf < 500 ? 1 : 0) +
                (m.pvserv_rds != null && m.pvserv_rds > 5 ? 1 : 0) +
                (m.isolation_result === 'fail' ? 1 : 0)
              
              const isOutlier = curve_consistency.outliers.includes(m.module_identifier)
              
              let className = 'module-ok'
              if (defectCount >= 2) className = 'module-multi-defect'
              else if (m.pvserv_uf != null && m.pvserv_uf < 500) className = 'module-diode-hs'
              else if (m.pvserv_rds != null && m.pvserv_rds > 5) className = 'module-high-rds'
              else if (m.el_defect_type && m.el_defect_type !== 'none') className = 'module-el-defect'
              else if (isOutlier) className = 'module-outlier'
              
              const tooltipData = [
                `Pos: ${m.position_in_string}`,
                m.el_defect_type && m.el_defect_type !== 'none' ? `EL: ${m.el_defect_type}` : null,
                m.pvserv_uf != null && m.pvserv_uf < 500 ? `Diode HS` : null,
                m.pvserv_rds != null && m.pvserv_rds > 5 ? `Rds: ${m.pvserv_rds.toFixed(1)}Ω` : null,
                m.isolation_result === 'fail' ? `ISO NOK` : null
              ].filter(Boolean).join(' | ')
              
              return `
                <div class="module-cell ${className}" title="${tooltipData}">
                  <div style="font-size: 10pt;">${m.position_in_string}</div>
                  <div class="module-indicator">${defectCount > 0 ? '⚠' : '✓'}</div>
                </div>
              `
            }).join('')}
          </div>
          
          <!-- Legend -->
          <div style="margin-top: 15px; display: flex; gap: 15px; flex-wrap: wrap; font-size: 8pt;">
            <div><span class="module-cell module-ok" style="display: inline-block; width: 20px; height: 15px; margin-right: 5px;"></span> OK</div>
            <div><span class="module-cell module-el-defect" style="display: inline-block; width: 20px; height: 15px; margin-right: 5px;"></span> Défaut EL</div>
            <div><span class="module-cell module-diode-hs" style="display: inline-block; width: 20px; height: 15px; margin-right: 5px;"></span> Diode HS</div>
            <div><span class="module-cell module-high-rds" style="display: inline-block; width: 20px; height: 15px; margin-right: 5px;"></span> Rds élevée</div>
            <div><span class="module-cell module-multi-defect" style="display: inline-block; width: 20px; height: 15px; margin-right: 5px;"></span> Multi-défauts</div>
            <div><span class="module-cell module-outlier" style="display: inline-block; width: 20px; height: 15px; margin-right: 5px;"></span> Valeur aberrante</div>
          </div>
        </div>

        ${generateStringAlertsHTML(stringAnalysis)}

        <!-- I-V Curves Visualization -->
        ${generateCurvesChartHTML(modules, string_number)}

        <!-- Detailed Modules Table -->
        ${generateModulesTableHTML(modules)}
        
      </div>
    </div>
    `
  }).join('')
}

function generateStringAlertsHTML(stringAnalysis: StringAnalysis): string {
  const { stats, defects, curve_consistency } = stringAnalysis
  let html = ''
  
  // Critical alerts
  if (defects.diodes_hs > 0) {
    html += `
      <div class="alert-box critical">
        <div class="alert-title">⚠️ DIODES BYPASS HS DÉTECTÉES</div>
        <ul>
          <li><strong>${defects.diodes_hs} diode(s)</strong> hors service (Uf < 500 mV)</li>
          <li>Risque de points chauds et dégradation accélérée</li>
          <li>Remplacement modules recommandé</li>
        </ul>
      </div>
    `
  }
  
  if (defects.isolation_fails > 0) {
    html += `
      <div class="alert-box critical">
        <div class="alert-title">⚡ DÉFAUTS D'ISOLATION</div>
        <ul>
          <li><strong>${defects.isolation_fails} module(s)</strong> non conforme(s)</li>
          <li>Risque électrique - Intervention urgente</li>
        </ul>
      </div>
    `
  }
  
  // Warning alerts
  if (defects.high_rds > 0) {
    html += `
      <div class="alert-box warning">
        <div class="alert-title">⚡ RÉSISTANCES SÉRIES ÉLEVÉES</div>
        <ul>
          <li><strong>${defects.high_rds} module(s)</strong> avec Rds > 5 Ω</li>
          <li>Pertes ohmiques importantes - Vérifier connexions</li>
          <li>Impact sur performances string</li>
        </ul>
      </div>
    `
  }
  
  if (!curve_consistency.overlapping) {
    html += `
      <div class="alert-box warning">
        <div class="alert-title">📊 COURBES NON SUPERPOSÉES</div>
        <ul>
          <li>Écart-type Pmax: ${stats.std_pmax.toFixed(2)} W (seuil: < ${(stats.avg_pmax * 0.05).toFixed(2)} W)</li>
          <li>Déviation max: ${stats.deviation_max.toFixed(1)}%</li>
          <li>Mismatch détecté - Homogénéité insuffisante</li>
          ${curve_consistency.outliers.length > 0 ? `
            <li>Modules aberrants: ${curve_consistency.outliers.join(', ')}</li>
          ` : ''}
        </ul>
      </div>
    `
  }
  
  // Info alerts
  if (html === '') {
    html = `
      <div class="alert-box info">
        <div class="alert-title">✅ STRING CONFORME</div>
        <ul>
          <li>Aucun défaut critique détecté</li>
          <li>Courbes bien superposées (écart-type: ${stats.std_pmax.toFixed(2)} W)</li>
          <li>Diodes bypass fonctionnelles</li>
          <li>Résistances séries acceptables (Rds moy: ${stats.avg_rds.toFixed(2)} Ω)</li>
        </ul>
      </div>
    `
  }
  
  return html
}

function generateCurvesChartHTML(modules: ModuleData[], stringNumber: number): string {
  // Parse curve data from modules
  const modulesWithCurves = modules.filter(m => {
    // Check if module has IV reference curve or PVserv curve
    return (m as any).iv_curve_data || m.pvserv_curve
  })
  
  if (modulesWithCurves.length === 0) {
    return `
      <div class="chart-container">
        <div class="chart-title">📈 Courbes I-V</div>
        <p style="color: #666; font-style: italic; text-align: center; padding: 20px;">
          Aucune donnée de courbes disponible pour ce string
        </p>
      </div>
    `
  }
  
  // Prepare datasets for Chart.js
  const datasets: any[] = []
  
  modulesWithCurves.forEach((m: any) => {
    const isOutlier = m.iv_pmax != null && modules.length > 0
    const hasDefects = (
      (m.pvserv_uf != null && m.pvserv_uf < 500) || 
      (m.pvserv_rds != null && m.pvserv_rds > 5)
    )
    
    // Parse IV reference curve (bright)
    if (m.iv_curve_data) {
      try {
        const curveData = typeof m.iv_curve_data === 'string' 
          ? JSON.parse(m.iv_curve_data) 
          : m.iv_curve_data
        
        if (Array.isArray(curveData) && curveData.length > 0) {
          const dataPoints = curveData.map((pt: any) => ({
            x: pt.voltage || pt.U || pt.V || 0,
            y: pt.current || pt.I || pt.A || 0
          }))
          
          // Determine color based on defects
          let borderColor = '#3b82f6' // Blue default
          let borderWidth = 2
          
          if (m.pvserv_uf != null && m.pvserv_uf < 500) {
            borderColor = '#dc2626' // Red for diode HS
            borderWidth = 3
          } else if (m.pvserv_rds != null && m.pvserv_rds > 5) {
            borderColor = '#f59e0b' // Orange for high Rds
            borderWidth = 3
          } else if (m.el_defect_type && m.el_defect_type !== 'none') {
            borderColor = '#fbbf24' // Yellow for EL defect
          }
          
          datasets.push({
            label: `${m.module_identifier} (Référence)`,
            data: dataPoints,
            borderColor: borderColor,
            backgroundColor: 'transparent',
            borderWidth: borderWidth,
            pointRadius: 0,
            tension: 0.1
          })
        }
      } catch (e) {
        console.error(`Error parsing IV curve for ${m.module_identifier}:`, e)
      }
    }
    
    // Parse PVserv curve (dark curves / diode test)
    if (m.pvserv_curve) {
      try {
        const curveData = typeof m.pvserv_curve === 'string' 
          ? JSON.parse(m.pvserv_curve) 
          : m.pvserv_curve
        
        if (Array.isArray(curveData) && curveData.length > 0) {
          const dataPoints = curveData.map((pt: any) => ({
            x: pt.voltage || pt.U || pt.V || 0,
            y: pt.current || pt.I || pt.A || 0
          }))
          
          // Dark curves in different style
          let borderColor = '#10b981' // Green for dark curves
          let borderDash = [5, 5] // Dashed line
          
          if (m.pvserv_uf != null && m.pvserv_uf < 500) {
            borderColor = '#dc2626' // Red if diode HS
          }
          
          datasets.push({
            label: `${m.module_identifier} (Sombre)`,
            data: dataPoints,
            borderColor: borderColor,
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: borderDash,
            pointRadius: 0,
            tension: 0.1
          })
        }
      } catch (e) {
        console.error(`Error parsing PVserv curve for ${m.module_identifier}:`, e)
      }
    }
  })
  
  if (datasets.length === 0) {
    return `
      <div class="chart-container">
        <div class="chart-title">📈 Courbes I-V</div>
        <p style="color: #666; font-style: italic; text-align: center; padding: 20px;">
          Erreur de parsing des données de courbes
        </p>
      </div>
    `
  }
  
  const chartId = `chart-string-${stringNumber}`
  
  // Prepare chart configuration
  const chartConfig = {
    type: 'line',
    data: {
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 2,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        title: {
          display: true,
          text: `Courbes I-V - String ${stringNumber}`,
          font: { size: 14, weight: 'bold' },
          color: '#1e40af'
        },
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            boxWidth: 12,
            padding: 10,
            font: { size: 9 }
          }
        },
        tooltip: {
          enabled: true,
          callbacks: {
            label: function(context: any) {
              return `${context.dataset.label}: V=${context.parsed.x.toFixed(2)}V, I=${context.parsed.y.toFixed(2)}A`
            }
          }
        }
      },
      scales: {
        x: {
          type: 'linear',
          title: {
            display: true,
            text: 'Tension (V)',
            font: { size: 11, weight: 'bold' },
            color: '#1e40af'
          },
          grid: { color: 'rgba(0, 0, 0, 0.05)' }
        },
        y: {
          type: 'linear',
          title: {
            display: true,
            text: 'Courant (A)',
            font: { size: 11, weight: 'bold' },
            color: '#1e40af'
          },
          grid: { color: 'rgba(0, 0, 0, 0.05)' }
        }
      }
    }
  }
  
  return `
    <div class="chart-container">
      <div class="chart-title">📈 Courbes I-V - Superposition des modules</div>
      <canvas id="${chartId}" style="max-height: 400px;"></canvas>
      
      <div style="margin-top: 15px; padding: 10px; background: #f9fafb; border-radius: 5px; font-size: 8pt;">
        <strong>Légende couleurs :</strong>
        <div style="display: flex; gap: 15px; flex-wrap: wrap; margin-top: 5px;">
          <div><span style="display: inline-block; width: 20px; height: 3px; background: #3b82f6; margin-right: 5px; vertical-align: middle;"></span> Référence normale</div>
          <div><span style="display: inline-block; width: 20px; height: 3px; background: #10b981; margin-right: 5px; vertical-align: middle; border-top: 2px dashed #10b981;"></span> Courbe sombre</div>
          <div><span style="display: inline-block; width: 20px; height: 3px; background: #dc2626; margin-right: 5px; vertical-align: middle;"></span> Diode HS (Uf < 500mV)</div>
          <div><span style="display: inline-block; width: 20px; height: 3px; background: #f59e0b; margin-right: 5px; vertical-align: middle;"></span> Rds élevée (>5Ω)</div>
          <div><span style="display: inline-block; width: 20px; height: 3px; background: #fbbf24; margin-right: 5px; vertical-align: middle;"></span> Défaut EL</div>
        </div>
      </div>
    </div>
    
    <script>
      (function() {
        const ctx = document.getElementById('${chartId}');
        if (ctx) {
          const config = ${JSON.stringify(chartConfig)};
          new Chart(ctx, config);
        }
      })();
    </script>
  `
}

function generateModulesTableHTML(modules: ModuleData[]): string {
  // Only show modules with measurements
  const modulesWithData = modules.filter(m => 
    m.iv_pmax != null || m.pvserv_ff != null || m.el_defect_type
  )
  
  if (modulesWithData.length === 0) {
    return '<p style="color: #666; font-style: italic; margin: 15px 0;">Aucune donnée détaillée disponible</p>'
  }
  
  return `
    <table style="margin-top: 20px;">
      <tr>
        <th>Module</th>
        <th>Voc (V)</th>
        <th>Isc (A)</th>
        <th>Pmax (W)</th>
        <th>FF (%)</th>
        <th>Rds (Ω)</th>
        <th>Uf (mV)</th>
        <th>Défaut EL</th>
        <th>ISO</th>
      </tr>
      ${modulesWithData.map(m => `
        <tr>
          <td><strong>${m.module_identifier}</strong></td>
          <td>${m.iv_voc ? m.iv_voc.toFixed(2) : '-'}</td>
          <td>${m.iv_isc ? m.iv_isc.toFixed(2) : '-'}</td>
          <td>${m.iv_pmax ? m.iv_pmax.toFixed(2) : '-'}</td>
          <td style="color: ${m.iv_ff && m.iv_ff < 0.70 ? '#dc2626' : '#333'};">
            ${m.iv_ff ? (m.iv_ff * 100).toFixed(1) : '-'}
          </td>
          <td style="color: ${m.pvserv_rds && m.pvserv_rds > 5 ? '#dc2626' : '#333'};">
            ${m.pvserv_rds ? m.pvserv_rds.toFixed(2) : '-'}
          </td>
          <td style="color: ${m.pvserv_uf && m.pvserv_uf < 500 ? '#dc2626' : '#333'}; font-weight: ${m.pvserv_uf && m.pvserv_uf < 500 ? 'bold' : 'normal'};">
            ${m.pvserv_uf != null ? m.pvserv_uf : '-'}
          </td>
          <td style="color: ${m.el_defect_type && m.el_defect_type !== 'none' ? '#f59e0b' : '#10b981'};">
            ${m.el_defect_type || '-'}
          </td>
          <td style="color: ${m.isolation_result === 'fail' ? '#dc2626' : '#10b981'};">
            ${m.isolation_result === 'pass' ? 'OK' : m.isolation_result === 'fail' ? 'NOK' : '-'}
          </td>
        </tr>
      `).join('')}
    </table>
  `
}

export default ivEnrichedReportsRoutes
