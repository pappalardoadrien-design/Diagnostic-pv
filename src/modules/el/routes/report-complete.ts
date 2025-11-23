import { Hono } from 'hono'
import type { D1Database, R2Bucket } from '@cloudflare/workers-types'

type Bindings = {
  DB: D1Database
  R2: R2Bucket
}

const elCompleteReportRoutes = new Hono<{ Bindings: Bindings }>()

// ============================================================================
// HELPER: Fetch R2 image and convert to base64 (limit size for performance)
// ============================================================================
async function fetchImageAsBase64(R2: R2Bucket, r2Key: string, maxSize: number = 500000): Promise<string> {
  try {
    const object = await R2.get(r2Key)
    if (!object) return ''
    
    const arrayBuffer = await object.arrayBuffer()
    
    // Skip if too large
    if (arrayBuffer.byteLength > maxSize) {
      console.log(`Image ${r2Key} too large (${arrayBuffer.byteLength} bytes), skipping`)
      return ''
    }
    
    const bytes = new Uint8Array(arrayBuffer)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    const base64 = btoa(binary)
    const mimeType = object.httpMetadata?.contentType || 'image/jpeg'
    
    return `data:${mimeType};base64,${base64}`
  } catch (error) {
    console.error('Error fetching image:', error)
    return ''
  }
}

// ============================================================================
// GENERATE COMPLETE EL AUDIT REPORT
// ============================================================================
// GET /api/el/reports/complete/:audit_token
elCompleteReportRoutes.get('/complete/:audit_token', async (c) => {
  try {
    const { DB, R2 } = c.env
    const auditToken = c.req.param('audit_token')
    
    // Get audit info (unified from audits + el_audits)
    const audit = await DB.prepare(`
      SELECT 
        a.*,
        el.*,
        a.id as audit_id,
        el.id as el_audit_id
      FROM audits a
      LEFT JOIN el_audits el ON a.audit_token = el.audit_token
      WHERE a.audit_token = ?
    `).bind(auditToken).first()
    
    if (!audit) {
      return c.json({ error: 'Audit EL introuvable' }, 404)
    }
    
    // Get all modules
    const { results: modules } = await DB.prepare(`
      SELECT * FROM el_modules 
      WHERE audit_token = ?
      ORDER BY string_number ASC, position_in_string ASC
    `).bind(auditToken).all()
    
    if (!modules || modules.length === 0) {
      return c.html(`
        <!DOCTYPE html>
        <html>
        <head><title>Aucun module</title></head>
        <body style="font-family: Arial; padding: 40px; text-align: center;">
          <h1>⚠️ Aucun module trouvé</h1>
          <p>Audit: ${(audit as any).project_name}</p>
          <p>Token: ${auditToken}</p>
        </body>
        </html>
      `)
    }
    
    // Calculate statistics
    const totalModules = modules.length
    const modulesByDefect: Record<string, any[]> = {
      none: [],
      microcracks: [],
      hotspot: [],
      pid: [],
      bypass_diode: [],
      snail_trail: [],
      delamination: [],
      other: []
    }
    
    const bySeverity = {
      none: 0,
      minor: 0,
      moderate: 0,
      severe: 0,
      critical: 0
    }
    
    const byString: Record<number, any[]> = {}
    
    ;(modules as any[]).forEach(m => {
      // Group by defect
      const defectType = m.defect_type || 'none'
      if (!modulesByDefect[defectType]) modulesByDefect[defectType] = []
      modulesByDefect[defectType].push(m)
      
      // Group by severity
      const severity = m.severity_level || 0
      if (severity === 0) bySeverity.none++
      else if (severity === 1) bySeverity.minor++
      else if (severity === 2) bySeverity.moderate++
      else if (severity === 3) bySeverity.severe++
      else if (severity === 4) bySeverity.critical++
      
      // Group by string
      const stringNum = m.string_number || 0
      if (!byString[stringNum]) byString[stringNum] = []
      byString[stringNum].push(m)
    })
    
    const defectModules = totalModules - (modulesByDefect.none?.length || 0)
    const defectRate = ((defectModules / totalModules) * 100).toFixed(1)
    const criticalRate = ((bySeverity.critical / totalModules) * 100).toFixed(1)
    
    // Get photos (limit to critical defects only for report)
    const { results: photos } = await DB.prepare(`
      SELECT p.*, m.string_number, m.position_in_string, m.defect_type
      FROM el_photos p
      LEFT JOIN el_modules m ON p.el_module_id = m.id
      WHERE p.audit_token = ? AND p.severity_level >= 3
      ORDER BY p.severity_level DESC
      LIMIT 10
    `).bind(auditToken).all()
    
    // Fetch critical photos as base64 (max 10)
    const criticalPhotos = await Promise.all(
      ((photos as any[]) || []).slice(0, 10).map(async (photo: any) => {
        const base64Image = await fetchImageAsBase64(R2, photo.r2_key, 300000) // 300KB max
        return { ...photo, base64Image }
      })
    )
    
    const now = new Date()
    const dateStr = now.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    })
    
    const defectLabels: Record<string, string> = {
      none: 'Aucun défaut',
      microcracks: 'Microfissures',
      hotspot: 'Point chaud',
      pid: 'PID (Degradation)',
      bypass_diode: 'Diode bypass HS',
      snail_trail: 'Snail trail',
      delamination: 'Délamination',
      other: 'Autre'
    }
    
    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Rapport EL Complet - ${(audit as any).project_name}</title>
  <style>
    @page {
      margin: 2cm;
      size: A4;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #1f2937;
    }
    
    .page-break {
      page-break-after: always;
    }
    
    /* COVER PAGE */
    .cover {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 100vh;
      background: linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%);
      color: white;
      padding: 60px;
      text-align: center;
    }
    
    .cover-header {
      margin-bottom: 100px;
    }
    
    .cover-logo {
      font-size: 48pt;
      font-weight: 900;
      letter-spacing: -2px;
      margin-bottom: 20px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }
    
    .cover-subtitle {
      font-size: 18pt;
      opacity: 0.9;
      font-weight: 300;
    }
    
    .cover-main {
      margin: 80px 0;
    }
    
    .cover-title {
      font-size: 42pt;
      font-weight: 700;
      margin-bottom: 30px;
      line-height: 1.2;
    }
    
    .cover-info {
      background: rgba(255,255,255,0.15);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 40px;
      margin: 40px auto;
      max-width: 600px;
      text-align: left;
    }
    
    .cover-info-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid rgba(255,255,255,0.2);
    }
    
    .cover-info-row:last-child {
      border-bottom: none;
    }
    
    .cover-info-label {
      font-weight: 600;
      opacity: 0.8;
    }
    
    .cover-footer {
      margin-top: 100px;
      opacity: 0.8;
      font-size: 10pt;
    }
    
    /* CONTENT PAGES */
    .header {
      background: linear-gradient(135deg, #059669 0%, #10b981 100%);
      color: white;
      padding: 30px;
      border-radius: 12px;
      margin-bottom: 30px;
    }
    
    .header h1 {
      font-size: 24pt;
      font-weight: 700;
      margin-bottom: 10px;
    }
    
    .section {
      margin: 30px 0;
      page-break-inside: avoid;
    }
    
    .section-title {
      background: #f3f4f6;
      color: #1f2937;
      padding: 15px 20px;
      border-left: 5px solid #10b981;
      font-size: 16pt;
      font-weight: 700;
      margin-bottom: 20px;
      border-radius: 0 8px 8px 0;
    }
    
    /* STATS CARDS */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin: 20px 0;
    }
    
    .stat-card {
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    
    .stat-card.highlight {
      border-color: #10b981;
      background: #d1fae5;
    }
    
    .stat-card.alert {
      border-color: #ef4444;
      background: #fee2e2;
    }
    
    .stat-label {
      font-size: 9pt;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
      font-weight: 600;
    }
    
    .stat-value {
      font-size: 24pt;
      font-weight: 700;
      color: #1f2937;
    }
    
    .stat-unit {
      font-size: 10pt;
      color: #6b7280;
      margin-left: 5px;
    }
    
    /* DEFECTS TABLE */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 9pt;
      background: white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    thead {
      background: linear-gradient(135deg, #059669 0%, #10b981 100%);
      color: white;
    }
    
    th {
      padding: 12px 8px;
      text-align: left;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 8pt;
      letter-spacing: 0.5px;
    }
    
    td {
      padding: 10px 8px;
      border-bottom: 1px solid #e5e7eb;
    }
    
    tbody tr:hover {
      background: #f9fafb;
    }
    
    tbody tr:nth-child(even) {
      background: #f3f4f6;
    }
    
    .severity-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 8pt;
      font-weight: 600;
      text-transform: uppercase;
    }
    
    .sev-0 { background: #e5e7eb; color: #6b7280; }
    .sev-1 { background: #dbeafe; color: #1e40af; }
    .sev-2 { background: #fef3c7; color: #92400e; }
    .sev-3 { background: #fed7aa; color: #9a3412; }
    .sev-4 { background: #fee2e2; color: #991b1b; }
    
    /* CARTOGRAPHY */
    .cartography {
      background: #f9fafb;
      padding: 20px;
      border-radius: 12px;
      margin: 20px 0;
    }
    
    .string-map {
      margin: 20px 0;
      padding: 15px;
      background: white;
      border-radius: 8px;
      border-left: 4px solid #10b981;
    }
    
    .string-header {
      font-weight: 700;
      font-size: 12pt;
      margin-bottom: 10px;
      color: #1f2937;
    }
    
    .modules-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, 35px);
      gap: 4px;
      margin-top: 10px;
    }
    
    .module-cell {
      width: 35px;
      height: 28px;
      border: 2px solid #d1d5db;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 7pt;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .module-cell:hover {
      transform: scale(1.1);
      z-index: 10;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }
    
    .module-ok {
      background: #d1fae5;
      border-color: #10b981;
      color: #065f46;
    }
    
    .module-minor {
      background: #dbeafe;
      border-color: #3b82f6;
      color: #1e40af;
    }
    
    .module-moderate {
      background: #fef3c7;
      border-color: #f59e0b;
      color: #92400e;
    }
    
    .module-severe {
      background: #fed7aa;
      border-color: #f97316;
      color: #9a3412;
    }
    
    .module-critical {
      background: #fee2e2;
      border-color: #ef4444;
      color: #991b1b;
    }
    
    /* PHOTOS */
    .photos-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin: 20px 0;
    }
    
    .photo-item {
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .photo-item img {
      width: 100%;
      height: 200px;
      object-fit: cover;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .photo-info {
      padding: 15px;
    }
    
    .photo-title {
      font-weight: 700;
      font-size: 10pt;
      color: #1f2937;
      margin-bottom: 5px;
    }
    
    .photo-desc {
      font-size: 9pt;
      color: #6b7280;
    }
    
    /* RECOMMENDATIONS */
    .reco-box {
      background: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin: 20px 0;
    }
    
    .reco-box.critical {
      border-left: 6px solid #ef4444;
      background: #fef2f2;
    }
    
    .reco-box.warning {
      border-left: 6px solid #f59e0b;
      background: #fffbeb;
    }
    
    .reco-box.info {
      border-left: 6px solid #3b82f6;
      background: #eff6ff;
    }
    
    .reco-title {
      font-weight: 700;
      font-size: 12pt;
      margin-bottom: 10px;
    }
    
    .reco-list {
      margin-left: 20px;
      line-height: 1.8;
    }
    
    /* FOOTER */
    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      font-size: 9pt;
      color: #6b7280;
      text-align: center;
    }
    
    .footer-logo {
      font-weight: 700;
      color: #10b981;
      margin-bottom: 10px;
    }
    
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>

<!-- COVER PAGE -->
<div class="cover">
  <div class="cover-header">
    <div class="cover-logo">DIAGNOSTIC PV</div>
    <div class="cover-subtitle">Expertise Électroluminescence depuis 2012</div>
  </div>
  
  <div class="cover-main">
    <div class="cover-title">
      RAPPORT<br>
      AUDIT ÉLECTROLUMINESCENCE
    </div>
    
    <div class="cover-info">
      <div class="cover-info-row">
        <span class="cover-info-label">Projet</span>
        <span class="cover-info-value">${(audit as any).project_name || 'Non renseigné'}</span>
      </div>
      <div class="cover-info-row">
        <span class="cover-info-label">Modules analysés</span>
        <span class="cover-info-value">${totalModules}</span>
      </div>
      <div class="cover-info-row">
        <span class="cover-info-label">Strings</span>
        <span class="cover-info-value">${Object.keys(byString).length}</span>
      </div>
      <div class="cover-info-row">
        <span class="cover-info-label">Taux défauts</span>
        <span class="cover-info-value">${defectRate}%</span>
      </div>
      <div class="cover-info-row">
        <span class="cover-info-label">Critiques</span>
        <span class="cover-info-value">${bySeverity.critical}</span>
      </div>
      <div class="cover-info-row">
        <span class="cover-info-label">Date audit</span>
        <span class="cover-info-value">${dateStr}</span>
      </div>
    </div>
  </div>
  
  <div class="cover-footer">
    <p><strong>Diagnostic Photovoltaïque</strong></p>
    <p>3 rue d'Apollo, 31240 L'Union</p>
    <p>05.81.10.16.59 • contact@diagpv.fr</p>
    <p>www.diagnosticphotovoltaique.fr</p>
    <p style="margin-top: 20px; font-size: 8pt;">RCS 792972309 • Conforme IEC 62446-1, IEC 62446-3, IEC TS 63049</p>
  </div>
</div>

<div class="page-break"></div>

<!-- SYNTHESIS PAGE -->
<div class="header">
  <h1>📊 Synthèse Audit Électroluminescence</h1>
  <p style="margin-top: 10px; opacity: 0.9;">Inspection nocturne complète - Détection défauts invisibles</p>
</div>

<div class="section">
  <div class="section-title">🔍 Vue d'Ensemble</div>
  
  <div class="stats-grid">
    <div class="stat-card highlight">
      <div class="stat-label">Total Modules</div>
      <div class="stat-value">${totalModules}</div>
    </div>
    
    <div class="stat-card ${parseFloat(defectRate) > 15 ? 'alert' : ''}">
      <div class="stat-label">Modules Défauts</div>
      <div class="stat-value">${defectModules}<span class="stat-unit">(${defectRate}%)</span></div>
    </div>
    
    <div class="stat-card ${bySeverity.critical > 0 ? 'alert' : ''}">
      <div class="stat-label">Critiques</div>
      <div class="stat-value">${bySeverity.critical}<span class="stat-unit">(${criticalRate}%)</span></div>
    </div>
    
    <div class="stat-card">
      <div class="stat-label">Sains</div>
      <div class="stat-value">${modulesByDefect.none?.length || 0}</div>
    </div>
  </div>
  
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-label">Sévères</div>
      <div class="stat-value">${bySeverity.severe}</div>
    </div>
    
    <div class="stat-card">
      <div class="stat-label">Modérés</div>
      <div class="stat-value">${bySeverity.moderate}</div>
    </div>
    
    <div class="stat-card">
      <div class="stat-label">Mineurs</div>
      <div class="stat-value">${bySeverity.minor}</div>
    </div>
    
    <div class="stat-card">
      <div class="stat-label">Strings</div>
      <div class="stat-value">${Object.keys(byString).length}</div>
    </div>
  </div>
</div>

<!-- DEFECTS BREAKDOWN -->
<div class="section">
  <div class="section-title">⚠️ Répartition des Défauts</div>
  
  <table>
    <thead>
      <tr>
        <th>Type de Défaut</th>
        <th>Nombre</th>
        <th>Pourcentage</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
      ${Object.entries(modulesByDefect).filter(([type, mods]) => type !== 'none' && mods.length > 0).map(([type, mods]) => `
        <tr>
          <td><strong>${defectLabels[type] || type}</strong></td>
          <td>${mods.length}</td>
          <td>${((mods.length / totalModules) * 100).toFixed(1)}%</td>
          <td style="font-size: 8pt; color: #6b7280;">
            ${type === 'microcracks' ? 'Fissures cellules (invisible œil nu)' :
              type === 'hotspot' ? 'Point chaud détecté (risque incendie)' :
              type === 'pid' ? 'Dégradation induite potentiel' :
              type === 'bypass_diode' ? 'Diode bypass défaillante' :
              type === 'snail_trail' ? 'Traces escargot (corrosion)' :
              type === 'delamination' ? 'Décollement couches' : 'Autre défaut'}
          </td>
        </tr>
      `).join('')}
      ${Object.entries(modulesByDefect).filter(([type, mods]) => type !== 'none' && mods.length > 0).length === 0 ? `
        <tr>
          <td colspan="4" style="text-align: center; color: #10b981; font-weight: 600;">
            ✅ Aucun défaut détecté - Installation saine
          </td>
        </tr>
      ` : ''}
    </tbody>
  </table>
</div>

<div class="page-break"></div>

<!-- CARTOGRAPHY -->
<div class="section">
  <div class="section-title">🗺️ Cartographie Centrale</div>
  
  <div class="cartography">
    ${Object.entries(byString).map(([stringNum, stringModules]) => {
      const stringDefects = stringModules.filter((m: any) => (m.defect_type || 'none') !== 'none').length
      const stringCritical = stringModules.filter((m: any) => (m.severity_level || 0) >= 3).length
      
      return `
      <div class="string-map">
        <div class="string-header">
          String ${stringNum} 
          <span style="font-weight: 400; font-size: 10pt; color: #6b7280;">
            (${stringModules.length} modules • ${stringDefects} défauts${stringCritical > 0 ? ` • ${stringCritical} critiques` : ''})
          </span>
        </div>
        
        <div class="modules-grid">
          ${stringModules.map((m: any) => {
            const sev = m.severity_level || 0
            let className = 'module-ok'
            if (sev === 1) className = 'module-minor'
            else if (sev === 2) className = 'module-moderate'
            else if (sev === 3) className = 'module-severe'
            else if (sev === 4) className = 'module-critical'
            
            return `
              <div class="module-cell ${className}" title="Module ${m.module_identifier} - ${defectLabels[m.defect_type || 'none']}">
                ${m.position_in_string || '?'}
              </div>
            `
          }).join('')}
        </div>
      </div>
      `
    }).join('')}
  </div>
</div>

${criticalPhotos.filter((p: any) => p.base64Image).length > 0 ? `
<div class="page-break"></div>

<!-- CRITICAL PHOTOS -->
<div class="section">
  <div class="section-title">📸 Photos Défauts Critiques (Top 10)</div>
  
  <div class="photos-grid">
    ${criticalPhotos.filter((p: any) => p.base64Image).map((photo: any) => `
      <div class="photo-item">
        <img src="${photo.base64Image}" alt="Défaut ${photo.defect_category}">
        <div class="photo-info">
          <div class="photo-title">
            String ${photo.string_number} - Module ${photo.position_in_string}
          </div>
          <div class="photo-desc">
            ${defectLabels[photo.defect_category] || photo.defect_category}
            <span class="severity-badge sev-${photo.severity_level || 0}">
              Sév. ${photo.severity_level || 0}
            </span>
          </div>
          ${photo.description ? `<div style="margin-top: 8px; font-size: 8pt; color: #4b5563;">${photo.description}</div>` : ''}
        </div>
      </div>
    `).join('')}
  </div>
</div>
` : ''}

<!-- PLAN DE CALEPINAGE -->
<div class="section">
  <div class="section-title">🗺️ Plan de Calepinage - Disposition Physique Réelle</div>
  <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #1e40af;">
    <p style="margin-bottom: 15px; color: #374151; font-size: 10pt; line-height: 1.6;">
      Le plan de calepinage présente la <strong>disposition physique réelle</strong> des modules sur la toiture avec :
    </p>
    <ul style="margin-left: 20px; margin-bottom: 15px; color: #4b5563; font-size: 9pt; line-height: 1.8;">
      <li>🗺️ <strong>Layout physique</strong> exact selon disposition sur toit</li>
      <li>✅ <strong>Couleurs dynamiques</strong> selon état EL de chaque module</li>
      <li>➡️ <strong>Flèches de câblage</strong> indiquant connexions entre strings</li>
      <li>🔲 <strong>Zones de câblage</strong> (rectangles rouges) pour groupes de strings</li>
      <li>📍 <strong>Numérotation précise</strong> S{string}-{position}</li>
      <li>🖨️ <strong>Export PDF A3</strong> optimisé pour impression</li>
    </ul>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px;">
      <div style="text-align: center;">
        <a href="/api/calepinage/editor/${auditToken}?module_type=el" 
           target="_blank" 
           style="display: inline-block; background: #10b981; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 10pt; box-shadow: 0 2px 8px rgba(16,185,129,0.3);">
          ✏️ Éditeur de Plan
        </a>
        <div style="margin-top: 8px; font-size: 8pt; color: #6b7280;">
          Créer / Modifier le plan de calepinage
        </div>
      </div>
      <div style="text-align: center;">
        <a href="/api/calepinage/viewer/${auditToken}?module_type=el" 
           target="_blank" 
           style="display: inline-block; background: #dc2626; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 10pt; box-shadow: 0 2px 8px rgba(220,38,38,0.3);">
          🗺️ Voir le Plan (SVG)
        </a>
        <div style="margin-top: 8px; font-size: 8pt; color: #6b7280;">
          Afficher le plan configuré
        </div>
      </div>
    </div>
    <div style="margin-top: 15px; text-align: center; font-size: 8pt; color: #6b7280;">
      💡 Nouveau : Créez votre plan visuellement avec drag-and-drop, puis exportez en SVG/PDF
    </div>
  </div>
</div>

<!-- RECOMMENDATIONS -->
<div class="section">
  <div class="section-title">💡 Recommandations & Actions Correctives</div>
  
  ${bySeverity.critical > 0 ? `
  <div class="reco-box critical">
    <div class="reco-title" style="color: #991b1b;">⚠️ URGENT : ${bySeverity.critical} module(s) critique(s) détecté(s)</div>
    <p style="margin: 10px 0; color: #7f1d1d;">
      Risque immédiat pour la production et la sécurité de l'installation.
    </p>
    <ul class="reco-list">
      <li><strong>Intervention immédiate requise</strong> - Isolation électrique si nécessaire</li>
      <li>Remplacement modules défaillants (${bySeverity.critical} unités)</li>
      <li>Vérification protection string (fusibles, diodes)</li>
      <li>Thermographie IR complémentaire (points chauds)</li>
    </ul>
  </div>
  ` : ''}
  
  ${bySeverity.severe > 0 || bySeverity.moderate > 0 ? `
  <div class="reco-box warning">
    <div class="reco-title" style="color: #92400e;">⚠ Attention : ${bySeverity.severe + bySeverity.moderate} défaut(s) modéré(s) à sévère(s)</div>
    <p style="margin: 10px 0; color: #78350f;">
      Dégradation progressive en cours - Surveillance recommandée.
    </p>
    <ul class="reco-list">
      <li>Planifier remplacement modules dégradés (${bySeverity.severe + bySeverity.moderate} unités)</li>
      <li>Audit électroluminescence annuel de suivi</li>
      <li>Courbes I-V comparatives (détection PID/LID)</li>
      <li>Vérification étanchéité (si délamination/snail trails)</li>
    </ul>
  </div>
  ` : ''}
  
  ${parseFloat(defectRate) > 15 ? `
  <div class="reco-box warning">
    <div class="reco-title" style="color: #92400e;">📉 Taux de défauts élevé (${defectRate}%)</div>
    <p style="margin: 10px 0; color: #78350f;">
      Le pourcentage de modules défectueux dépasse le seuil acceptable de 15%.
    </p>
    <ul class="reco-list">
      <li>Analyse cause racine (défaut fabrication, installation, vieillissement prématuré)</li>
      <li>Vérification garantie constructeur</li>
      <li>Étude impact production (pertes kWh/an)</li>
      <li>Plan remplacement groupé si défaut systémique</li>
    </ul>
  </div>
  ` : ''}
  
  <div class="reco-box info">
    <div class="reco-title" style="color: #1e40af;">📋 Actions de Suivi Recommandées</div>
    <ul class="reco-list">
      <li><strong>Audit annuel EL</strong> - Suivi évolution défauts</li>
      <li><strong>Courbes I-V</strong> - Performances électriques modules</li>
      <li><strong>Thermographie IR</strong> - Points chauds et déséquilibres</li>
      <li><strong>Tests isolement</strong> - Sécurité électrique installation</li>
      <li><strong>Monitoring production</strong> - Détection pertes rendement</li>
      <li><strong>Maintenance préventive</strong> - Nettoyage, serrage connexions</li>
    </ul>
  </div>
  
  ${modulesByDefect.none?.length === totalModules ? `
  <div class="reco-box info" style="border-left-color: #10b981; background: #d1fae5;">
    <div class="reco-title" style="color: #065f46;">✅ Installation Saine</div>
    <p style="margin: 10px 0; color: #047857;">
      Aucun défaut détecté lors de cet audit électroluminescence. Installation en excellent état.
    </p>
    <ul class="reco-list">
      <li>Maintenir surveillance annuelle</li>
      <li>Continuer maintenance préventive</li>
      <li>Prochain audit EL recommandé dans 12-24 mois</li>
    </ul>
  </div>
  ` : ''}
</div>

<!-- FOOTER -->
<div class="footer">
  <div class="footer-logo">DIAGNOSTIC PHOTOVOLTAÏQUE</div>
  <div class="footer-contact">3 rue d'Apollo, 31240 L'Union</div>
  <div class="footer-contact">☎ 05.81.10.16.59 • ✉ contact@diagpv.fr • 🌐 www.diagnosticphotovoltaique.fr</div>
  <div style="margin-top: 15px; font-size: 8pt; color: #9ca3af;">
    RCS 792972309 • Expertise conforme IEC 62446-1, IEC 62446-3, IEC TS 63049, DIN EN 62446-3
  </div>
  <div style="margin-top: 10px; font-size: 8pt; color: #d1d5db;">
    Document généré le ${dateStr} • Token: ${auditToken.substring(0, 16)}...
  </div>
</div>

</body>
</html>
    `
    
    return c.html(html, 200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="Rapport_EL_Complet_${auditToken.substring(0, 12)}.html"`
    })
    
  } catch (error: any) {
    console.error('Error generating complete EL report:', error)
    return c.json({ error: error.message }, 500)
  }
})

export default elCompleteReportRoutes
