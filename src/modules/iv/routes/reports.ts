import { Hono } from 'hono'
import type { D1Database } from '@cloudflare/workers-types'

type Bindings = {
  DB: D1Database
}

const ivReportsRoutes = new Hono<{ Bindings: Bindings }>()

// ============================================================================
// HELPER: Calculate statistics
// ============================================================================
function calculateStats(measurements: any[]) {
  if (!measurements || measurements.length === 0) {
    return {
      count: 0,
      avg_voc: 0,
      avg_isc: 0,
      avg_pmax: 0,
      avg_ff: 0,
      min_pmax: 0,
      max_pmax: 0,
      std_pmax: 0,
      avg_deviation: 0
    }
  }

  const count = measurements.length
  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0)
  const avg = (arr: number[]) => sum(arr) / arr.length

  const vocs = measurements.map(m => m.voc || 0).filter(v => v > 0)
  const iscs = measurements.map(m => m.isc || 0).filter(v => v > 0)
  const pmaxs = measurements.map(m => m.pmax || 0).filter(v => v > 0)
  const ffs = measurements.map(m => m.fill_factor || 0).filter(v => v > 0)
  const devs = measurements.map(m => m.deviation_from_datasheet || 0)

  const avg_pmax = avg(pmaxs)
  const variance = pmaxs.map(p => Math.pow(p - avg_pmax, 2))
  const std_pmax = Math.sqrt(avg(variance))

  return {
    count,
    avg_voc: avg(vocs),
    avg_isc: avg(iscs),
    avg_pmax,
    avg_ff: avg(ffs),
    min_pmax: Math.min(...pmaxs),
    max_pmax: Math.max(...pmaxs),
    std_pmax,
    avg_deviation: avg(devs)
  }
}

// ============================================================================
// GENERATE IV REPORT PDF
// ============================================================================
// GET /api/iv/report/:audit_token
ivReportsRoutes.get('/report/:audit_token', async (c) => {
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
    
    // Get all IV measurements
    const { results: measurements } = await DB.prepare(`
      SELECT * FROM iv_measurements 
      WHERE audit_token = ?
      ORDER BY string_number ASC, module_number ASC, measurement_type ASC
    `).bind(auditToken).all()
    
    if (!measurements || measurements.length === 0) {
      return c.html(`
        <!DOCTYPE html>
        <html>
        <head><title>Aucune mesure I-V</title></head>
        <body style="font-family: Arial; padding: 40px; text-align: center;">
          <h1>⚠️ Aucune mesure I-V disponible</h1>
          <p>Audit: ${audit.project_name || 'Sans nom'}</p>
          <p>Token: ${auditToken}</p>
        </body>
        </html>
      `)
    }
    
    // Group by type
    const reference = (measurements as any[]).filter(m => m.measurement_type === 'reference')
    const dark = (measurements as any[]).filter(m => m.measurement_type === 'dark')
    
    // Calculate stats
    const statsReference = calculateStats(reference)
    const statsDark = calculateStats(dark)
    
    // Group by string
    const byString: Record<string, any[]> = {}
    ;(measurements as any[]).forEach(m => {
      const key = `String ${m.string_number || 'N/A'}`
      if (!byString[key]) byString[key] = []
      byString[key].push(m)
    })
    
    const now = new Date()
    const dateStr = now.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    })
    
    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Rapport Courbes I-V - Audit</title>
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
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%);
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
    
    .cover-info-value {
      font-weight: 400;
    }
    
    .cover-footer {
      margin-top: 100px;
      opacity: 0.8;
      font-size: 10pt;
    }
    
    /* CONTENT PAGES */
    .header {
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
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
    
    .header-info {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-top: 20px;
      font-size: 10pt;
    }
    
    .header-info-item {
      background: rgba(255,255,255,0.15);
      padding: 10px 15px;
      border-radius: 8px;
    }
    
    .section {
      margin: 30px 0;
      page-break-inside: avoid;
    }
    
    .section-title {
      background: #f3f4f6;
      color: #1f2937;
      padding: 15px 20px;
      border-left: 5px solid #3b82f6;
      font-size: 16pt;
      font-weight: 700;
      margin-bottom: 20px;
      border-radius: 0 8px 8px 0;
    }
    
    /* STATS CARDS */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
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
      border-color: #3b82f6;
      background: #eff6ff;
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
    
    .stat-subtitle {
      font-size: 9pt;
      color: #9ca3af;
      margin-top: 5px;
    }
    
    /* TABLES */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 9pt;
      background: white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    thead {
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
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
    
    .type-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 8pt;
      font-weight: 600;
      text-transform: uppercase;
    }
    
    .type-reference {
      background: #dbeafe;
      color: #1e40af;
    }
    
    .type-dark {
      background: #f3f4f6;
      color: #374151;
    }
    
    /* PERFORMANCE INDICATORS */
    .performance-indicator {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 8pt;
      font-weight: 600;
    }
    
    .perf-good {
      background: #d1fae5;
      color: #065f46;
    }
    
    .perf-warning {
      background: #fef3c7;
      color: #92400e;
    }
    
    .perf-bad {
      background: #fee2e2;
      color: #991b1b;
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
      color: #3b82f6;
      margin-bottom: 10px;
    }
    
    .footer-contact {
      margin: 5px 0;
    }
    
    /* PRINT STYLES */
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>

<!-- COVER PAGE -->
<div class="cover">
  <div class="cover-header">
    <div class="cover-logo">DIAGNOSTIC PV</div>
    <div class="cover-subtitle">Expertise Indépendante depuis 2012</div>
  </div>
  
  <div class="cover-main">
    <div class="cover-title">
      RAPPORT<br>
      COURBES I-V
    </div>
    
    <div class="cover-info">
      <div class="cover-info-row">
        <span class="cover-info-label">Projet</span>
        <span class="cover-info-value">Non renseigné</span>
      </div>
      <div class="cover-info-row">
        <span class="cover-info-label">Client</span>
        <span class="cover-info-value">Non renseigné</span>
      </div>
      <div class="cover-info-row">
        <span class="cover-info-label">Localisation</span>
        <span class="cover-info-value">Non renseigné</span>
      </div>
      <div class="cover-info-row">
        <span class="cover-info-label">Puissance</span>
        <span class="cover-info-value">N/A kWc</span>
      </div>
      <div class="cover-info-row">
        <span class="cover-info-label">Date audit</span>
        <span class="cover-info-value">${dateStr}</span>
      </div>
      <div class="cover-info-row">
        <span class="cover-info-label">Token audit</span>
        <span class="cover-info-value">${auditToken.substring(0, 12)}...</span>
      </div>
    </div>
  </div>
  
  <div class="cover-footer">
    <p><strong>Diagnostic Photovoltaïque</strong></p>
    <p>3 rue d'Apollo, 31240 L'Union</p>
    <p>05.81.10.16.59 • contact@diagpv.fr</p>
    <p>www.diagnosticphotovoltaique.fr</p>
    <p style="margin-top: 20px; font-size: 8pt;">RCS 792972309 • Expertise indépendante conforme IEC 62446-1, IEC 60904-1, IEC 60891</p>
  </div>
</div>

<div class="page-break"></div>

<!-- SYNTHESIS PAGE -->
<div class="header">
  <h1>📊 Synthèse Mesures Courbes I-V - Audit ${auditToken.substring(0, 8)}</h1>
  <div class="header-info">
    <div class="header-info-item">
      <strong>Total mesures:</strong> ${measurements.length}
    </div>
    <div class="header-info-item">
      <strong>Mesures référence:</strong> ${statsReference.count}
    </div>
    <div class="header-info-item">
      <strong>Mesures sombres:</strong> ${statsDark.count}
    </div>
    <div class="header-info-item">
      <strong>Strings analysés:</strong> ${Object.keys(byString).length}
    </div>
  </div>
</div>

<!-- STATS REFERENCE -->
<div class="section">
  <div class="section-title">⚡ Mesures Référence (Éclairement)</div>
  
  <div class="stats-grid">
    <div class="stat-card highlight">
      <div class="stat-label">Voc Moyen</div>
      <div class="stat-value">${statsReference.avg_voc.toFixed(2)}<span class="stat-unit">V</span></div>
      <div class="stat-subtitle">${statsReference.count} mesures</div>
    </div>
    
    <div class="stat-card highlight">
      <div class="stat-label">Isc Moyen</div>
      <div class="stat-value">${statsReference.avg_isc.toFixed(2)}<span class="stat-unit">A</span></div>
      <div class="stat-subtitle">Courant court-circuit</div>
    </div>
    
    <div class="stat-card highlight">
      <div class="stat-label">Pmax Moyen</div>
      <div class="stat-value">${statsReference.avg_pmax.toFixed(1)}<span class="stat-unit">W</span></div>
      <div class="stat-subtitle">Puissance maximale</div>
    </div>
    
    <div class="stat-card">
      <div class="stat-label">FF Moyen</div>
      <div class="stat-value">${(statsReference.avg_ff * 100).toFixed(1)}<span class="stat-unit">%</span></div>
      <div class="stat-subtitle">Fill Factor</div>
    </div>
    
    <div class="stat-card">
      <div class="stat-label">Écart-type Pmax</div>
      <div class="stat-value">${statsReference.std_pmax.toFixed(1)}<span class="stat-unit">W</span></div>
      <div class="stat-subtitle">Dispersion</div>
    </div>
    
    <div class="stat-card">
      <div class="stat-label">Déviation Datasheet</div>
      <div class="stat-value">${statsReference.avg_deviation.toFixed(1)}<span class="stat-unit">%</span></div>
      <div class="stat-subtitle">Moyenne</div>
    </div>
  </div>
</div>

<!-- STATS DARK -->
${statsDark.count > 0 ? `
<div class="section">
  <div class="section-title">🌙 Mesures Sombres (Obscurité)</div>
  
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-label">Voc Moyen</div>
      <div class="stat-value">${statsDark.avg_voc.toFixed(2)}<span class="stat-unit">V</span></div>
      <div class="stat-subtitle">${statsDark.count} mesures</div>
    </div>
    
    <div class="stat-card">
      <div class="stat-label">Isc Moyen</div>
      <div class="stat-value">${statsDark.avg_isc.toFixed(2)}<span class="stat-unit">A</span></div>
      <div class="stat-subtitle">Courant résiduel</div>
    </div>
    
    <div class="stat-card">
      <div class="stat-label">FF Moyen</div>
      <div class="stat-value">${(statsDark.avg_ff * 100).toFixed(1)}<span class="stat-unit">%</span></div>
      <div class="stat-subtitle">Fill Factor</div>
    </div>
  </div>
</div>
` : ''}

<div class="page-break"></div>

<!-- DETAILED MEASUREMENTS TABLE -->
<div class="section">
  <div class="section-title">📋 Tableau Détaillé des Mesures</div>
  
  <table>
    <thead>
      <tr>
        <th>String</th>
        <th>Module</th>
        <th>Type</th>
        <th>Voc (V)</th>
        <th>Isc (A)</th>
        <th>Pmax (W)</th>
        <th>Vmpp (V)</th>
        <th>Impp (A)</th>
        <th>FF (%)</th>
        <th>Dév. (%)</th>
        <th>Performance</th>
      </tr>
    </thead>
    <tbody>
      ${(measurements as any[]).map(m => {
        const deviation = m.deviation_from_datasheet || 0
        let perfClass = 'perf-good'
        if (Math.abs(deviation) > 10) perfClass = 'perf-bad'
        else if (Math.abs(deviation) > 5) perfClass = 'perf-warning'
        
        return `
        <tr>
          <td><strong>${m.string_number || 'N/A'}</strong></td>
          <td>${m.module_number || 'N/A'}</td>
          <td><span class="type-badge type-${m.measurement_type}">${m.measurement_type === 'reference' ? 'Réf' : 'Sombre'}</span></td>
          <td>${(m.voc || 0).toFixed(2)}</td>
          <td>${(m.isc || 0).toFixed(2)}</td>
          <td><strong>${(m.pmax || 0).toFixed(1)}</strong></td>
          <td>${(m.vmpp || 0).toFixed(2)}</td>
          <td>${(m.impp || 0).toFixed(2)}</td>
          <td>${((m.fill_factor || 0) * 100).toFixed(1)}</td>
          <td><span class="performance-indicator ${perfClass}">${deviation.toFixed(1)}</span></td>
          <td>
            ${Math.abs(deviation) <= 5 ? '<span class="performance-indicator perf-good">✓ Bon</span>' :
              Math.abs(deviation) <= 10 ? '<span class="performance-indicator perf-warning">⚠ Attention</span>' :
              '<span class="performance-indicator perf-bad">✗ Dégradé</span>'}
          </td>
        </tr>
        `
      }).join('')}
    </tbody>
  </table>
</div>

<!-- ANALYSIS BY STRING -->
${Object.keys(byString).length > 0 ? `
<div class="page-break"></div>
<div class="section">
  <div class="section-title">🔌 Analyse par String</div>
  
  ${Object.entries(byString).map(([stringName, stringMeasurements]) => {
    const stringStats = calculateStats(stringMeasurements)
    return `
    <div style="margin: 30px 0; padding: 20px; background: #f9fafb; border-left: 4px solid #3b82f6; border-radius: 8px;">
      <h3 style="margin-bottom: 15px; color: #1f2937;">${stringName}</h3>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Mesures</div>
          <div class="stat-value">${stringStats.count}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Pmax Moyen</div>
          <div class="stat-value">${stringStats.avg_pmax.toFixed(1)}<span class="stat-unit">W</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Écart-type</div>
          <div class="stat-value">${stringStats.std_pmax.toFixed(1)}<span class="stat-unit">W</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-label">FF Moyen</div>
          <div class="stat-value">${(stringStats.avg_ff * 100).toFixed(1)}<span class="stat-unit">%</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Min Pmax</div>
          <div class="stat-value">${stringStats.min_pmax.toFixed(1)}<span class="stat-unit">W</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Max Pmax</div>
          <div class="stat-value">${stringStats.max_pmax.toFixed(1)}<span class="stat-unit">W</span></div>
        </div>
      </div>
    </div>
    `
  }).join('')}
</div>
` : ''}

<!-- RECOMMENDATIONS -->
<div class="section">
  <div class="section-title">💡 Recommandations & Actions</div>
  
  <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    ${statsReference.avg_deviation < -10 ? `
    <div style="padding: 15px; background: #fee2e2; border-left: 4px solid #dc2626; margin-bottom: 15px; border-radius: 4px;">
      <strong style="color: #991b1b;">⚠️ ALERTE : Dégradation significative détectée</strong>
      <p style="margin-top: 10px; color: #7f1d1d;">Déviation moyenne de ${statsReference.avg_deviation.toFixed(1)}% par rapport aux spécifications constructeur. Investigation approfondie recommandée (PID, LID, défauts cellules).</p>
    </div>
    ` : statsReference.avg_deviation < -5 ? `
    <div style="padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b; margin-bottom: 15px; border-radius: 4px;">
      <strong style="color: #92400e;">⚠ Attention : Performance réduite</strong>
      <p style="margin-top: 10px; color: #78350f;">Déviation moyenne de ${statsReference.avg_deviation.toFixed(1)}%. Surveillance recommandée.</p>
    </div>
    ` : `
    <div style="padding: 15px; background: #d1fae5; border-left: 4px solid #10b981; margin-bottom: 15px; border-radius: 4px;">
      <strong style="color: #065f46;">✓ Performance conforme</strong>
      <p style="margin-top: 10px; color: #047857;">Les modules présentent des performances conformes aux spécifications (déviation moyenne: ${statsReference.avg_deviation.toFixed(1)}%).</p>
    </div>
    `}
    
    ${statsReference.std_pmax > 15 ? `
    <div style="padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b; margin-bottom: 15px; border-radius: 4px;">
      <strong style="color: #92400e;">⚠ Dispersion élevée des performances</strong>
      <p style="margin-top: 10px; color: #78350f;">Écart-type de ${statsReference.std_pmax.toFixed(1)}W indique une forte hétérogénéité. Vérifier le mismatch et l'homogénéité des strings.</p>
    </div>
    ` : ''}
    
    ${statsReference.avg_ff < 0.70 ? `
    <div style="padding: 15px; background: #fee2e2; border-left: 4px solid #dc2626; margin-bottom: 15px; border-radius: 4px;">
      <strong style="color: #991b1b;">⚠️ Fill Factor faible</strong>
      <p style="margin-top: 10px; color: #7f1d1d;">FF moyen de ${(statsReference.avg_ff * 100).toFixed(1)}% (seuil optimal >72%). Possible résistance série élevée ou défauts diodes.</p>
    </div>
    ` : ''}
    
    <h4 style="margin: 20px 0 15px 0; color: #1f2937;">Actions recommandées :</h4>
    <ul style="margin-left: 20px; line-height: 1.8; color: #4b5563;">
      <li>Audit électroluminescence (EL) pour détection défauts invisibles</li>
      <li>Thermographie IR pour identification points chauds</li>
      <li>Contrôle visuel approfondi (délamination, corrosion, snail trails)</li>
      <li>Test isolement et mesure résistance masse</li>
      <li>Analyse comparée avec historique (si disponible)</li>
      <li>Vérification MPPTs et protections string</li>
    </ul>
  </div>
</div>

<!-- FOOTER -->
<div class="footer">
  <div class="footer-logo">DIAGNOSTIC PHOTOVOLTAÏQUE</div>
  <div class="footer-contact">3 rue d'Apollo, 31240 L'Union</div>
  <div class="footer-contact">☎ 05.81.10.16.59 • ✉ contact@diagpv.fr • 🌐 www.diagnosticphotovoltaique.fr</div>
  <div style="margin-top: 15px; font-size: 8pt; color: #9ca3af;">
    RCS 792972309 • Expertise indépendante conforme IEC 62446-1, IEC 60904-1, IEC 60891, NF C 15-100
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
      'Content-Disposition': `inline; filename="Rapport_IV_${auditToken.substring(0, 12)}.html"`
    })
    
  } catch (error: any) {
    console.error('Error generating IV report:', error)
    return c.json({ error: error.message }, 500)
  }
})

export default ivReportsRoutes
