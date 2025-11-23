import { Hono } from 'hono'
import type { D1Database, R2Bucket } from '@cloudflare/workers-types'

type Bindings = {
  DB: D1Database
  R2: R2Bucket
}

const elReportsRoutes = new Hono<{ Bindings: Bindings }>()

// ============================================================================
// HELPER: Fetch R2 image and convert to base64
// ============================================================================
async function fetchImageAsBase64(R2: R2Bucket, r2Key: string): Promise<string> {
  try {
    const object = await R2.get(r2Key)
    if (!object) return ''
    
    const arrayBuffer = await object.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    
    // Convert to base64
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    const base64 = btoa(binary)
    
    // Detect mime type from metadata or default to jpeg
    const mimeType = object.httpMetadata?.contentType || 'image/jpeg'
    
    return `data:${mimeType};base64,${base64}`
  } catch (error) {
    console.error('Error fetching image:', error)
    return ''
  }
}

// ============================================================================
// GENERATE EL PHOTOS REPORT PDF
// ============================================================================
// GET /api/el/reports/photos/:audit_token
elReportsRoutes.get('/photos/:audit_token', async (c) => {
  try {
    const { DB, R2 } = c.env
    const auditToken = c.req.param('audit_token')
    
    // Get audit info (unified from audits + el_audits)
    const { results: audits } = await DB.prepare(`
      SELECT 
        a.*,
        el.*,
        a.id as audit_id,
        el.id as el_audit_id
      FROM audits a
      LEFT JOIN el_audits el ON a.audit_token = el.audit_token
      WHERE a.audit_token = ?
    `).bind(auditToken).all()
    
    if (!audits || audits.length === 0) {
      return c.json({ error: 'Audit introuvable' }, 404)
    }
    
    const audit = audits[0] as any
    
    // Get photos with module info
    const { results: photos } = await DB.prepare(`
      SELECT 
        p.*,
        m.string_number,
        m.position_in_string,
        m.defect_type as module_defect_type
      FROM el_photos p
      LEFT JOIN el_modules m ON p.el_module_id = m.id
      WHERE p.audit_token = ?
      ORDER BY p.severity_level DESC, m.string_number ASC, m.position_in_string ASC
    `).bind(auditToken).all()
    
    if (!photos || photos.length === 0) {
      return c.html(`
        <!DOCTYPE html>
        <html>
        <head><title>Aucune photo</title></head>
        <body style="font-family: Arial; padding: 40px; text-align: center;">
          <h1>⚠️ Aucune photo disponible</h1>
          <p>Audit: ${audit.project_name}</p>
          <p>Token: ${auditToken}</p>
        </body>
        </html>
      `)
    }
    
    // Get stats
    const { results: stats } = await DB.prepare(`
      SELECT * FROM v_el_photos_stats WHERE audit_token = ?
    `).bind(auditToken).all()
    
    const photoStats = stats && stats.length > 0 ? stats[0] as any : {
      total_photos: photos.length,
      modules_with_photos: 0,
      defect_photos: 0,
      critical_photos: 0
    }
    
    // Fetch all images as base64 (limit to prevent timeout)
    const maxPhotos = 50 // Limit for performance
    const photosToProcess = (photos as any[]).slice(0, maxPhotos)
    
    const photosWithImages = await Promise.all(
      photosToProcess.map(async (photo: any) => {
        const base64Image = await fetchImageAsBase64(R2, photo.r2_key)
        return { ...photo, base64Image }
      })
    )
    
    // Generate HTML report
    const defectLabels: Record<string, string> = {
      'microcracks': 'Microfissures',
      'hotspot': 'Point chaud',
      'pid': 'PID',
      'bypass_diode': 'Diode bypass',
      'snail_trail': 'Snail trail',
      'delamination': 'Délamination'
    }
    
    const severityLabels: Record<number, string> = {
      0: 'Aucun',
      1: 'Mineur',
      2: 'Modéré',
      3: 'Sévère',
      4: 'Critique'
    }
    
    const severityColors: Record<number, string> = {
      0: '#9CA3AF',
      1: '#3B82F6',
      2: '#F59E0B',
      3: '#F97316',
      4: '#DC2626'
    }
    
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
  <title>Rapport Photos EL - ${audit.project_name}</title>
  <style>
    @page {
      margin: 2cm;
      size: A4;
    }
    body {
      font-family: 'Arial', sans-serif;
      font-size: 10pt;
      line-height: 1.4;
      color: #1F2937;
      margin: 0;
      padding: 0;
    }
    .cover-page {
      page-break-after: always;
      text-align: center;
      padding: 100px 40px;
    }
    .logo {
      font-size: 32pt;
      font-weight: bold;
      color: #059669;
      margin-bottom: 20px;
    }
    .title {
      font-size: 24pt;
      font-weight: bold;
      color: #1F2937;
      margin: 40px 0 20px 0;
    }
    .subtitle {
      font-size: 14pt;
      color: #6B7280;
      margin-bottom: 60px;
    }
    .info-box {
      background: #F3F4F6;
      padding: 20px;
      border-radius: 8px;
      text-align: left;
      max-width: 500px;
      margin: 0 auto;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #D1D5DB;
    }
    .info-label {
      font-weight: bold;
      color: #4B5563;
    }
    .stats-page {
      page-break-after: always;
      padding: 20px;
    }
    h1 {
      font-size: 18pt;
      color: #059669;
      border-bottom: 3px solid #059669;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    h2 {
      font-size: 14pt;
      color: #1F2937;
      margin: 20px 0 10px 0;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin: 20px 0;
    }
    .stat-card {
      background: #F9FAFB;
      border: 2px solid #E5E7EB;
      border-radius: 8px;
      padding: 15px;
      text-align: center;
    }
    .stat-value {
      font-size: 24pt;
      font-weight: bold;
      color: #059669;
      margin-bottom: 5px;
    }
    .stat-label {
      font-size: 9pt;
      color: #6B7280;
      text-transform: uppercase;
    }
    .photos-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      page-break-inside: avoid;
      margin-bottom: 30px;
    }
    .photo-card {
      border: 2px solid #E5E7EB;
      border-radius: 8px;
      overflow: hidden;
      page-break-inside: avoid;
    }
    .photo-image {
      width: 100%;
      height: 200px;
      object-fit: cover;
      background: #F3F4F6;
    }
    .photo-info {
      padding: 10px;
      background: #F9FAFB;
    }
    .photo-module {
      font-weight: bold;
      font-size: 11pt;
      color: #1F2937;
      margin-bottom: 5px;
    }
    .photo-defect {
      font-size: 9pt;
      color: #4B5563;
      margin-bottom: 5px;
    }
    .photo-severity {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 8pt;
      font-weight: bold;
      color: white;
    }
    .photo-description {
      font-size: 8pt;
      color: #6B7280;
      margin-top: 5px;
      font-style: italic;
    }
    .footer {
      position: fixed;
      bottom: 1cm;
      left: 2cm;
      right: 2cm;
      text-align: center;
      font-size: 8pt;
      color: #9CA3AF;
      border-top: 1px solid #E5E7EB;
      padding-top: 5px;
    }
    @media print {
      .photos-grid {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>

  <!-- PAGE DE GARDE -->
  <div class="cover-page">
    <div class="logo">🔬 DiagPV</div>
    <div class="title">Rapport Photos Électroluminescence</div>
    <div class="subtitle">Analyse Défauts Modules Photovoltaïques</div>
    
    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Centrale</span>
        <span>${audit.project_name}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Localisation</span>
        <span>${audit.site_location || 'N/A'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Token Audit</span>
        <span style="font-family: monospace; font-size: 8pt;">${auditToken}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Date Rapport</span>
        <span>${dateStr}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Photos Analysées</span>
        <span>${photoStats.total_photos}</span>
      </div>
    </div>
  </div>

  <!-- PAGE STATISTIQUES -->
  <div class="stats-page">
    <h1>📊 Synthèse Globale</h1>
    
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${photoStats.total_photos}</div>
        <div class="stat-label">Photos Totales</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${photoStats.modules_with_photos}</div>
        <div class="stat-label">Modules Documentés</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${photoStats.defect_photos}</div>
        <div class="stat-label">Photos Défauts</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color: #DC2626;">${photoStats.critical_photos}</div>
        <div class="stat-label">Défauts Critiques</div>
      </div>
    </div>
    
    <h2>🎯 Répartition Défauts</h2>
    <p style="color: #6B7280; font-size: 9pt;">
      Ce rapport documente ${photoStats.total_photos} photographies électroluminescentes 
      couvrant ${photoStats.modules_with_photos} modules photovoltaïques. 
      Les défauts sont classés par niveau de sévérité (0=Aucun à 4=Critique).
    </p>
  </div>

  <!-- PAGES PHOTOS -->
  ${(() => {
    let pagesHtml = ''
    for (let i = 0; i < photosWithImages.length; i += 4) {
      const pagePhotos = photosWithImages.slice(i, i + 4)
      pagesHtml += `
        <div style="${i > 0 ? 'page-break-before: always;' : ''} padding: 20px;">
          <h1>📸 Photos Défauts (${i + 1}-${Math.min(i + 4, photosWithImages.length)} / ${photosWithImages.length})</h1>
          <div class="photos-grid">
            ${pagePhotos.map((photo: any) => {
              const defect = photo.defect_category ? defectLabels[photo.defect_category] || photo.defect_category : 'Non spécifié'
              const severity = severityLabels[photo.severity_level] || 'N/A'
              const severityColor = severityColors[photo.severity_level] || '#9CA3AF'
              
              return `
                <div class="photo-card">
                  ${photo.base64Image ? 
                    `<img src="${photo.base64Image}" alt="Module ${photo.module_identifier}" class="photo-image">` : 
                    `<div class="photo-image" style="display: flex; align-items: center; justify-content: center; color: #9CA3AF;">Image indisponible</div>`
                  }
                  <div class="photo-info">
                    <div class="photo-module">Module ${photo.module_identifier}</div>
                    ${photo.string_number ? `<div class="photo-defect">String ${photo.string_number}, Position ${photo.position_in_string}</div>` : ''}
                    <div class="photo-defect">🔍 ${defect}</div>
                    <div>
                      <span class="photo-severity" style="background-color: ${severityColor};">
                        ${severity}
                      </span>
                    </div>
                    ${photo.description ? `<div class="photo-description">${photo.description}</div>` : ''}
                  </div>
                </div>
              `
            }).join('')}
          </div>
        </div>
      `
    }
    return pagesHtml
  })()}

  <div class="footer">
    Diagnostic Photovoltaïque • 3 rue d'Apollo, 31240 L'Union • 05.81.10.16.59 • contact@diagpv.fr • RCS 792972309
  </div>

</body>
</html>
    `
    
    return c.html(html, 200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="Rapport_EL_Photos_${audit.project_name.replace(/\s+/g, '_')}_${auditToken.substring(0, 8)}.html"`
    })
    
  } catch (error: any) {
    console.error('Error generating photos report:', error)
    return c.json({ error: error.message || 'Failed to generate report' }, 500)
  }
})

export default elReportsRoutes
