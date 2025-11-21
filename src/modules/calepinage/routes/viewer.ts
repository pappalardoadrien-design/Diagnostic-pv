import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
}

const viewerRouter = new Hono<{ Bindings: Bindings }>()

// ============================================================================
// GET /api/calepinage/viewer/:projectId - Vue lecture seule (SVG)
// ============================================================================
viewerRouter.get('/:projectId', async (c) => {
  const { DB } = c.env
  const { projectId } = c.req.param()
  const moduleType = c.req.query('module_type') || 'el'
  
  try {
    // Charger le layout depuis D1
    const layout = await DB.prepare(`
      SELECT * FROM calepinage_layouts WHERE project_id = ? LIMIT 1
    `).bind(projectId).first()
    
    if (!layout) {
      return c.html(`
        <html>
          <body style="font-family: sans-serif; padding: 40px; text-align: center;">
            <h2>⚠️ Aucun plan de calepinage configuré</h2>
            <p>Veuillez d'abord créer un plan dans l'éditeur.</p>
            <a href="/api/calepinage/editor/${projectId}?module_type=${moduleType}" 
               style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 8px;">
              ✏️ Créer le plan
            </a>
          </body>
        </html>
      `, 404)
    }
    
    // Parser les données JSON
    const viewBox = JSON.parse(layout.view_box_json as string)
    const modules = JSON.parse(layout.modules_json as string)
    const arrows = JSON.parse(layout.arrows_json as string || '[]')
    const zones = JSON.parse(layout.zones_json as string || '[]')
    
    // Récupérer les états des modules depuis le module source
    let moduleStates: { [key: string]: any } = {}
    
    if (moduleType === 'el') {
      const { results } = await DB.prepare(`
        SELECT module_identifier, defect_type, severity_level
        FROM el_modules
        WHERE audit_token = ?
      `).bind(projectId).all()
      
      results.forEach((m: any) => {
        moduleStates[m.module_identifier] = {
          status: (!m.defect_type || m.defect_type === 'pending' || m.defect_type === 'none') ? 'ok' : 'defect',
          defectType: m.defect_type,
          severity: m.severity_level
        }
      })
    } else if (moduleType === 'iv') {
      // TODO: Support I-V curves
      const { results } = await DB.prepare(`
        SELECT module_identifier, status
        FROM iv_curves
        WHERE audit_token = ?
      `).bind(projectId).all()
      
      results.forEach((m: any) => {
        moduleStates[m.module_identifier] = {
          status: m.status || 'pending'
        }
      })
    }
    
    // Générer SVG
    const svg = generateSVG(viewBox, modules, arrows, zones, moduleStates)
    
    c.header('Content-Type', 'image/svg+xml')
    return c.body(svg)
    
  } catch (error: any) {
    console.error('Erreur génération viewer:', error)
    return c.html(`<h1>Erreur: ${error.message}</h1>`, 500)
  }
})

function generateSVG(
  viewBox: { width: number; height: number },
  modules: any[],
  arrows: any[],
  zones: any[],
  moduleStates: { [key: string]: any }
) {
  const { width, height } = viewBox
  
  // Calculer les couleurs basées sur les états
  function getModuleColor(identifier: string): string {
    const state = moduleStates[identifier]
    if (!state) return '#d1d5db' // Gris par défaut
    
    if (state.status === 'ok') return '#10b981' // Vert
    if (state.defectType === 'microfissures') return '#fb923c' // Orange
    if (state.defectType === 'impact_cellulaire') return '#f472b6' // Rose
    if (state.defectType === 'pid') return '#dc2626' // Rouge
    if (state.defectType === 'diode_hs') return '#7c3aed' // Violet
    
    return '#ef4444' // Rouge pour autres défauts
  }
  
  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <marker id="arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
      <path d="M2,2 L2,10 L10,6 z" fill="#dc2626"/>
    </marker>
    <style>
      .module-rect { stroke: #1f2937; stroke-width: 2; }
      .module-text { fill: white; font-family: Arial, sans-serif; font-size: 12px; font-weight: bold; text-anchor: middle; }
      .zone-rect { fill: rgba(220, 38, 38, 0.05); stroke: #dc2626; stroke-width: 3; }
      .zone-text { fill: #dc2626; font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; }
      .arrow-line { stroke: #dc2626; stroke-width: 4; marker-end: url(#arrow); }
      .arrow-label { fill: #dc2626; font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; text-anchor: middle; }
    </style>
  </defs>
  
  <!-- Fond blanc -->
  <rect x="0" y="0" width="${width}" height="${height}" fill="white"/>
  
  <!-- Grille de référence (légère) -->
  <defs>
    <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
      <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#e5e7eb" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#grid)" opacity="0.5"/>
  
  <!-- Zones (en arrière-plan) -->
`
  
  zones.forEach(zone => {
    svg += `  <rect class="zone-rect" x="${zone.x}" y="${zone.y}" width="${zone.width}" height="${zone.height}"/>\n`
    if (zone.name) {
      svg += `  <text class="zone-text" x="${zone.x + zone.width / 2}" y="${zone.y - 10}">${zone.name}</text>\n`
    }
  })
  
  svg += `\n  <!-- Modules -->\n`
  
  modules.forEach(module => {
    const color = getModuleColor(module.identifier)
    const textColor = color === '#d1d5db' ? '#374151' : 'white'
    
    svg += `  <g>
    <rect class="module-rect" x="${module.x}" y="${module.y}" width="${module.width}" height="${module.height}" fill="${color}"/>
    <text class="module-text" x="${module.x + module.width / 2}" y="${module.y + module.height / 2 + 4}" fill="${textColor}">${module.identifier}</text>
  </g>\n`
  })
  
  svg += `\n  <!-- Flèches de câblage -->\n`
  
  arrows.forEach(arrow => {
    svg += `  <line class="arrow-line" x1="${arrow.startX}" y1="${arrow.startY}" x2="${arrow.endX}" y2="${arrow.endY}"/>\n`
    if (arrow.label) {
      const midX = (arrow.startX + arrow.endX) / 2
      const midY = (arrow.startY + arrow.endY) / 2 - 10
      svg += `  <text class="arrow-label" x="${midX}" y="${midY}">${arrow.label}</text>\n`
    }
  })
  
  svg += `\n  <!-- Légende des couleurs -->\n`
  svg += `  <g transform="translate(20, ${height - 100})">
    <text class="zone-text" x="0" y="0">Légende:</text>
    <rect x="0" y="10" width="30" height="20" fill="#10b981"/>
    <text x="35" y="25" font-size="12">OK</text>
    
    <rect x="80" y="10" width="30" height="20" fill="#fb923c"/>
    <text x="115" y="25" font-size="12">Microfissures</text>
    
    <rect x="220" y="10" width="30" height="20" fill="#f472b6"/>
    <text x="255" y="25" font-size="12">Impact cellulaire</text>
    
    <rect x="380" y="10" width="30" height="20" fill="#dc2626"/>
    <text x="415" y="25" font-size="12">PID</text>
    
    <rect x="480" y="10" width="30" height="20" fill="#d1d5db"/>
    <text x="515" y="25" font-size="12">Non configuré</text>
  </g>
  
</svg>`
  
  return svg
}

export default viewerRouter
