import { Hono } from 'hono'
import type { PhysicalLayout, LayoutWithModuleStates } from '../types/calepinage'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

// Configuration JALIBAT selon le schéma fourni
const JALIBAT_LAYOUT: PhysicalLayout = {
  projectId: 'JALIBAT-2025-001',
  layoutName: 'JALIBAT - Configuration Toiture Réelle',
  
  viewBox: {
    width: 2400,
    height: 1200,
    gridSize: 20
  },
  
  // Configuration du câblage par string
  wiring: [
    { stringNumber: 1, direction: 'left-to-right', moduleCount: 26 },
    { stringNumber: 2, direction: 'left-to-right', moduleCount: 24 },
    { stringNumber: 3, direction: 'right-to-left', moduleCount: 24 },
    { stringNumber: 4, direction: 'left-to-right', moduleCount: 24 },
    { stringNumber: 5, direction: 'left-to-right', moduleCount: 24 },
    { stringNumber: 6, direction: 'right-to-left', moduleCount: 24 },
    { stringNumber: 7, direction: 'left-to-right', moduleCount: 24 },
    { stringNumber: 8, direction: 'right-to-left', moduleCount: 24 },
    { stringNumber: 9, direction: 'left-to-right', moduleCount: 24 },
    { stringNumber: 10, direction: 'right-to-left', moduleCount: 24 }
  ],
  
  // Positions physiques des modules selon le schéma
  modules: generateJalibatModulePositions(),
  
  // Câbles entre strings (flèches rouges)
  cables: [
    { from: 'S1-26', to: 'S2-1', arrowType: 'end', color: '#dc2626' },
    { from: 'S2-24', to: 'S3-24', arrowType: 'end', color: '#dc2626' },
    { from: 'S3-1', to: 'S4-1', arrowType: 'end', color: '#dc2626' },
    { from: 'S4-24', to: 'S5-1', arrowType: 'end', color: '#dc2626' },
    { from: 'S5-24', to: 'S6-24', arrowType: 'end', color: '#dc2626' },
    { from: 'S6-1', to: 'S7-1', arrowType: 'end', color: '#dc2626' },
    { from: 'S7-24', to: 'S8-24', arrowType: 'end', color: '#dc2626' },
    { from: 'S8-1', to: 'S9-1', arrowType: 'end', color: '#dc2626' },
    { from: 'S9-24', to: 'S10-24', arrowType: 'end', color: '#dc2626' }
  ],
  
  // Zones de câblage (rectangles rouges)
  zones: [
    { name: 'Zone 1', strings: [1], borderColor: '#dc2626', borderWidth: 3 },
    { name: 'Zone 2', strings: [2, 3, 4], borderColor: '#dc2626', borderWidth: 3 },
    { name: 'Zone 3', strings: [5, 6], borderColor: '#dc2626', borderWidth: 3 },
    { name: 'Zone 4', strings: [7, 8], borderColor: '#dc2626', borderWidth: 3 },
    { name: 'Zone 5', strings: [9, 10], borderColor: '#dc2626', borderWidth: 3 }
  ]
}

// Génère les positions des modules selon le layout JALIBAT
function generateJalibatModulePositions(): PhysicalLayout['modules'] {
  const positions: PhysicalLayout['modules'] = []
  const moduleWidth = 60
  const moduleHeight = 35
  const spacing = 5
  
  // String 1 (haut, isolée) - 26 modules
  for (let i = 1; i <= 26; i++) {
    positions.push({
      identifier: `S1-${i}`,
      x: 300 + (i - 1) * (moduleWidth + spacing),
      y: 50,
      width: moduleWidth,
      height: moduleHeight
    })
  }
  
  // Strings 2-3-4 (gauche, bloc de 3) - 24 modules chacune
  for (let s = 2; s <= 4; s++) {
    const yOffset = 200 + (s - 2) * (moduleHeight + spacing + 50)
    for (let i = 1; i <= 24; i++) {
      const direction = s === 3 ? 'rtl' : 'ltr'
      const xPos = direction === 'ltr' 
        ? 50 + (i - 1) * (moduleWidth + spacing)
        : 50 + (24 - i) * (moduleWidth + spacing)
      
      positions.push({
        identifier: `S${s}-${i}`,
        x: xPos,
        y: yOffset,
        width: moduleWidth,
        height: moduleHeight
      })
    }
  }
  
  // Strings 5-6 (droite haut) - 24 modules chacune
  for (let s = 5; s <= 6; s++) {
    const yOffset = 200 + (s - 5) * (moduleHeight + spacing + 10)
    for (let i = 1; i <= 24; i++) {
      const direction = s === 6 ? 'rtl' : 'ltr'
      const xPos = direction === 'ltr'
        ? 900 + (i - 1) * (moduleWidth + spacing)
        : 900 + (24 - i) * (moduleWidth + spacing)
      
      positions.push({
        identifier: `S${s}-${i}`,
        x: xPos,
        y: yOffset,
        width: moduleWidth,
        height: moduleHeight
      })
    }
  }
  
  // Strings 7-8 (droite milieu) - 24 modules chacune
  for (let s = 7; s <= 8; s++) {
    const yOffset = 400 + (s - 7) * (moduleHeight + spacing + 10)
    for (let i = 1; i <= 24; i++) {
      const direction = s === 8 ? 'rtl' : 'ltr'
      const xPos = direction === 'ltr'
        ? 900 + (i - 1) * (moduleWidth + spacing)
        : 900 + (24 - i) * (moduleWidth + spacing)
      
      positions.push({
        identifier: `S${s}-${i}`,
        x: xPos,
        y: yOffset,
        width: moduleWidth,
        height: moduleHeight
      })
    }
  }
  
  // Strings 9-10 (droite bas) - 24 modules chacune
  for (let s = 9; s <= 10; s++) {
    const yOffset = 600 + (s - 9) * (moduleHeight + spacing + 10)
    for (let i = 1; i <= 24; i++) {
      const direction = s === 10 ? 'rtl' : 'ltr'
      const xPos = direction === 'ltr'
        ? 900 + (i - 1) * (moduleWidth + spacing)
        : 900 + (24 - i) * (moduleWidth + spacing)
      
      positions.push({
        identifier: `S${s}-${i}`,
        x: xPos,
        y: yOffset,
        width: moduleWidth,
        height: moduleHeight
      })
    }
  }
  
  return positions
}

// Récupère les états des modules depuis l'audit EL
async function getModuleStates(db: D1Database, auditToken: string) {
  const modules = await db.prepare(`
    SELECT 
      module_identifier,
      defect_type,
      severity_level
    FROM el_modules
    WHERE audit_token = ?
    ORDER BY string_number, position_in_string
  `).bind(auditToken).all()
  
  return modules.results.map((m: any) => ({
    identifier: m.module_identifier,
    status: (!m.defect_type || m.defect_type === 'pending' || m.defect_type === 'none') ? 'ok' : 'defect',
    defectType: m.defect_type,
    severity: m.severity_level
  }))
}

// Route principale : Rendu du plan physique
app.get('/:auditToken', async (c) => {
  const { auditToken } = c.req.param()
  const { DB } = c.env
  
  try {
    // Récupérer les infos de l'audit
    const audit = await DB.prepare(`
      SELECT * FROM el_audits WHERE audit_token = ?
    `).bind(auditToken).first()
    
    if (!audit) {
      return c.html('<h1>Audit non trouvé</h1>', 404)
    }
    
    // Récupérer les états des modules
    const moduleStates = await getModuleStates(DB, auditToken)
    
    // Construire le layout avec états
    const layoutWithStates: LayoutWithModuleStates = {
      ...JALIBAT_LAYOUT,
      moduleStates
    }
    
    return c.html(renderPhysicalPlan(layoutWithStates, audit, auditToken))
    
  } catch (error: any) {
    console.error('Erreur calepinage physical:', error)
    return c.html(`<h1>Erreur: ${error.message}</h1>`, 500)
  }
})

// Rendu HTML/SVG du plan physique
function renderPhysicalPlan(layout: LayoutWithModuleStates, audit: any, auditToken: string) {
  const { viewBox, modules, cables, zones, moduleStates } = layout
  
  // Créer un map des états des modules pour accès rapide
  const stateMap = new Map(
    moduleStates.map(s => [s.identifier, s])
  )
  
  // Générer les rectangles des zones
  const zonesSvg = zones?.map(zone => {
    const stringModules = modules.filter(m => {
      const stringNum = parseInt(m.identifier.split('-')[0].substring(1))
      return zone.strings.includes(stringNum)
    })
    
    if (stringModules.length === 0) return ''
    
    const minX = Math.min(...stringModules.map(m => m.x))
    const maxX = Math.max(...stringModules.map(m => m.x + (m.width || 60)))
    const minY = Math.min(...stringModules.map(m => m.y))
    const maxY = Math.max(...stringModules.map(m => m.y + (m.height || 35)))
    
    const padding = 10
    
    return `
      <rect
        x="${minX - padding}"
        y="${minY - padding}"
        width="${maxX - minX + padding * 2}"
        height="${maxY - minY + padding * 2}"
        fill="${zone.backgroundColor || 'transparent'}"
        stroke="${zone.borderColor || '#dc2626'}"
        stroke-width="${zone.borderWidth || 3}"
        stroke-dasharray="10,5"
        rx="8"
      />
      <text
        x="${minX}"
        y="${minY - padding - 5}"
        fill="${zone.borderColor || '#dc2626'}"
        font-size="14"
        font-weight="bold"
      >${zone.name || 'Zone'}</text>
    `
  }).join('') || ''
  
  // Générer les modules
  const modulesSvg = modules.map(m => {
    const state = stateMap.get(m.identifier)
    
    let fillColor = '#d4f4dd'  // Vert = OK
    let strokeColor = '#4ade80'
    
    if (state?.status === 'defect') {
      if (state.defectType === 'microfissures') {
        fillColor = '#fed7aa'  // Orange
        strokeColor = '#fb923c'
      } else if (state.defectType === 'impact_cellulaire') {
        fillColor = '#fecaca'  // Rose
        strokeColor = '#f87171'
      } else {
        fillColor = '#fef3c7'  // Jaune
        strokeColor = '#fbbf24'
      }
    }
    
    const width = m.width || 60
    const height = m.height || 35
    
    return `
      <g>
        <rect
          x="${m.x}"
          y="${m.y}"
          width="${width}"
          height="${height}"
          fill="${fillColor}"
          stroke="${strokeColor}"
          stroke-width="2"
          rx="4"
        />
        <text
          x="${m.x + width / 2}"
          y="${m.y + height / 2}"
          text-anchor="middle"
          dominant-baseline="middle"
          font-size="10"
          font-weight="bold"
          fill="#1f2937"
        >${m.identifier}</text>
      </g>
    `
  }).join('')
  
  // Générer les câbles avec flèches
  const cablesSvg = cables.map((cable, idx) => {
    const fromModule = modules.find(m => m.identifier === cable.from)
    const toModule = modules.find(m => m.identifier === cable.to)
    
    if (!fromModule || !toModule) return ''
    
    const fromX = fromModule.x + (fromModule.width || 60) / 2
    const fromY = fromModule.y + (fromModule.height || 35) / 2
    const toX = toModule.x + (toModule.width || 60) / 2
    const toY = toModule.y + (toModule.height || 35) / 2
    
    const markerId = `arrow-${idx}`
    
    return `
      <defs>
        <marker
          id="${markerId}"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill="${cable.color || '#dc2626'}" />
        </marker>
      </defs>
      <line
        x1="${fromX}"
        y1="${fromY}"
        x2="${toX}"
        y2="${toY}"
        stroke="${cable.color || '#dc2626'}"
        stroke-width="3"
        marker-end="url(#${markerId})"
        opacity="0.8"
      />
    `
  }).join('')
  
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Plan de Calepinage - ${audit.project_name}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #f3f4f6;
      padding: 20px;
    }
    
    .header {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .header h1 {
      color: #1f2937;
      margin-bottom: 10px;
    }
    
    .header-info {
      display: flex;
      gap: 30px;
      color: #6b7280;
      font-size: 14px;
    }
    
    .plan-container {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      overflow: auto;
    }
    
    svg {
      width: 100%;
      height: auto;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
    }
    
    .legend {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-top: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .legend h3 {
      margin-bottom: 15px;
      color: #1f2937;
    }
    
    .legend-items {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
    }
    
    .legend-item {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .legend-box {
      width: 30px;
      height: 20px;
      border-radius: 4px;
      border: 2px solid;
    }
    
    .actions {
      margin-top: 20px;
      display: flex;
      gap: 15px;
    }
    
    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
      display: inline-block;
      transition: all 0.2s;
    }
    
    .btn-primary {
      background: #3b82f6;
      color: white;
    }
    
    .btn-primary:hover {
      background: #2563eb;
    }
    
    .btn-secondary {
      background: #6b7280;
      color: white;
    }
    
    .btn-secondary:hover {
      background: #4b5563;
    }
    
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .actions {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🗺️ Plan de Calepinage - Disposition Physique Réelle</h1>
    <div class="header-info">
      <div><strong>Projet:</strong> ${audit.project_name}</div>
      <div><strong>Client:</strong> ${audit.client_name}</div>
      <div><strong>Localisation:</strong> ${audit.location}</div>
      <div><strong>Total modules:</strong> ${audit.total_modules}</div>
    </div>
  </div>
  
  <div class="plan-container">
    <svg viewBox="0 0 ${viewBox?.width || 2400} ${viewBox?.height || 1200}" xmlns="http://www.w3.org/2000/svg">
      <!-- Zones de câblage (rectangles rouges) -->
      ${zonesSvg}
      
      <!-- Modules avec états EL -->
      ${modulesSvg}
      
      <!-- Câbles avec flèches -->
      ${cablesSvg}
    </svg>
  </div>
  
  <div class="legend">
    <h3>Légende</h3>
    <div class="legend-items">
      <div class="legend-item">
        <div class="legend-box" style="background: #d4f4dd; border-color: #4ade80;"></div>
        <span>Module OK</span>
      </div>
      <div class="legend-item">
        <div class="legend-box" style="background: #fed7aa; border-color: #fb923c;"></div>
        <span>Microfissures</span>
      </div>
      <div class="legend-item">
        <div class="legend-box" style="background: #fecaca; border-color: #f87171;"></div>
        <span>Impact cellulaire</span>
      </div>
      <div class="legend-item">
        <div class="legend-box" style="background: #fef3c7; border-color: #fbbf24;"></div>
        <span>Autre défaut</span>
      </div>
      <div class="legend-item">
        <div style="width: 40px; height: 3px; background: #dc2626; position: relative;">
          <div style="position: absolute; right: -5px; top: -3px; width: 0; height: 0; border-left: 8px solid #dc2626; border-top: 5px solid transparent; border-bottom: 5px solid transparent;"></div>
        </div>
        <span>Câblage entre strings</span>
      </div>
      <div class="legend-item">
        <div style="width: 30px; height: 20px; border: 3px dashed #dc2626; border-radius: 4px;"></div>
        <span>Zone de câblage</span>
      </div>
    </div>
  </div>
  
  <div class="actions">
    <a href="/api/el/report-complete/${auditToken}" class="btn btn-primary">📄 Retour au rapport complet</a>
    <button onclick="window.print()" class="btn btn-secondary">🖨️ Imprimer</button>
    <a href="/api/el/calepinage-editor/${auditToken}" class="btn btn-secondary">✏️ Modifier le layout</a>
  </div>
</body>
</html>
  `
}

export default app
