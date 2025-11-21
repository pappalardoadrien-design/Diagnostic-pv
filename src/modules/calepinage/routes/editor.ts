import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
}

const editorRouter = new Hono<{ Bindings: Bindings }>()

// ============================================================================
// GET /api/calepinage/editor/:projectId - Éditeur visuel complet
// ============================================================================
editorRouter.get('/:projectId', async (c) => {
  const { DB } = c.env
  const { projectId } = c.req.param()
  const moduleType = c.req.query('module_type') || 'el'
  
  // Récupérer les modules depuis le module source (EL par exemple)
  let modules: any[] = []
  
  try {
    if (moduleType === 'el') {
      const { results } = await DB.prepare(`
        SELECT module_identifier, string_number, position_in_string, defect_type
        FROM el_modules
        WHERE audit_token = ?
        ORDER BY string_number, position_in_string
      `).bind(projectId).all()
      
      modules = results.map((m: any) => ({
        identifier: m.module_identifier,
        stringNumber: m.string_number,
        position: m.position_in_string,
        status: m.defect_type === 'none' || m.defect_type === 'pending' ? 'ok' : 'defect'
      }))
    }
    
    // Charger layout existant si disponible
    const existingLayout = await DB.prepare(`
      SELECT * FROM calepinage_layouts WHERE project_id = ? LIMIT 1
    `).bind(projectId).first()
    
    let savedLayout = null
    if (existingLayout) {
      savedLayout = {
        viewBox: JSON.parse(existingLayout.view_box_json as string),
        modules: JSON.parse(existingLayout.modules_json as string),
        arrows: JSON.parse(existingLayout.arrows_json as string || '[]'),
        zones: JSON.parse(existingLayout.zones_json as string || '[]')
      }
    }
    
    return c.html(renderEditor(projectId, moduleType, modules, savedLayout))
  } catch (error: any) {
    console.error('Erreur chargement éditeur:', error)
    return c.html(`<h1>Erreur: ${error.message}</h1>`, 500)
  }
})

function renderEditor(projectId: string, moduleType: string, modules: any[], savedLayout: any) {
  const modulesJson = JSON.stringify(modules)
  const savedLayoutJson = savedLayout ? JSON.stringify(savedLayout) : 'null'
  
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Éditeur de Calepinage - ${projectId}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #f3f4f6;
      overflow: hidden;
    }
    
    .editor-container {
      display: flex;
      height: 100vh;
    }
    
    /* SIDEBAR */
    .sidebar {
      width: 300px;
      background: white;
      border-right: 1px solid #e5e7eb;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    }
    
    .sidebar-header {
      padding: 20px;
      border-bottom: 1px solid #e5e7eb;
      background: linear-gradient(135deg, #059669 0%, #10b981 100%);
      color: white;
    }
    
    .sidebar-header h1 {
      font-size: 18px;
      margin-bottom: 5px;
    }
    
    .sidebar-header p {
      font-size: 12px;
      opacity: 0.9;
    }
    
    .tool-section {
      padding: 20px;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .tool-section h3 {
      font-size: 14px;
      margin-bottom: 15px;
      color: #374151;
    }
    
    .tool-buttons {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    
    .tool-btn {
      padding: 12px;
      border: 2px solid #e5e7eb;
      background: white;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      text-align: center;
      transition: all 0.2s;
    }
    
    .tool-btn:hover {
      border-color: #10b981;
      background: #f0fdf4;
    }
    
    .tool-btn.active {
      border-color: #10b981;
      background: #d1fae5;
      font-weight: 600;
    }
    
    .tool-btn i {
      display: block;
      font-size: 20px;
      margin-bottom: 5px;
    }
    
    .modules-list {
      flex: 1;
      overflow-y: auto;
    }
    
    .string-group {
      margin-bottom: 10px;
    }
    
    .string-header {
      background: #f9fafb;
      padding: 10px 20px;
      font-weight: 600;
      font-size: 13px;
      color: #374151;
      border-top: 1px solid #e5e7eb;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .module-item {
      padding: 8px 20px;
      cursor: move;
      font-size: 12px;
      color: #6b7280;
      transition: background 0.2s;
      user-select: none;
    }
    
    .module-item:hover {
      background: #f9fafb;
    }
    
    .module-item.dragging {
      opacity: 0.5;
    }
    
    /* CANVAS */
    .canvas-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: #f9fafb;
    }
    
    .toolbar {
      background: white;
      border-bottom: 1px solid #e5e7eb;
      padding: 15px 20px;
      display: flex;
      gap: 15px;
      align-items: center;
    }
    
    .toolbar-btn {
      padding: 8px 16px;
      border: 1px solid #e5e7eb;
      background: white;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      transition: all 0.2s;
    }
    
    .toolbar-btn:hover {
      background: #f9fafb;
      border-color: #10b981;
    }
    
    .toolbar-btn.primary {
      background: #10b981;
      color: white;
      border-color: #10b981;
    }
    
    .toolbar-btn.primary:hover {
      background: #059669;
    }
    
    .zoom-controls {
      margin-left: auto;
      display: flex;
      gap: 10px;
      align-items: center;
    }
    
    .canvas-wrapper {
      flex: 1;
      overflow: auto;
      position: relative;
      background: 
        repeating-linear-gradient(0deg, #e5e7eb 0, #e5e7eb 1px, transparent 1px, transparent 20px),
        repeating-linear-gradient(90deg, #e5e7eb 0, #e5e7eb 1px, transparent 1px, transparent 20px);
      background-size: 20px 20px;
    }
    
    #canvas {
      position: relative;
      width: 2400px;
      height: 1200px;
      background: white;
      margin: 40px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      cursor: crosshair;
    }
    
    #canvas.mode-select {
      cursor: default;
    }
    
    #canvas.mode-move {
      cursor: move;
    }
    
    /* MODULE ON CANVAS */
    .canvas-module {
      position: absolute;
      width: 60px;
      height: 35px;
      background: #d4f4dd;
      border: 2px solid #4ade80;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: bold;
      cursor: move;
      user-select: none;
      transition: box-shadow 0.2s;
    }
    
    .canvas-module:hover {
      box-shadow: 0 0 8px rgba(16,185,129,0.5);
      z-index: 10;
    }
    
    .canvas-module.selected {
      box-shadow: 0 0 12px rgba(16,185,129,0.8);
      border-width: 3px;
      z-index: 11;
    }
    
    .canvas-module.defect {
      background: #fecaca;
      border-color: #f87171;
    }
    
    /* ARROW */
    .canvas-arrow {
      position: absolute;
      pointer-events: none;
    }
    
    .canvas-arrow line {
      stroke: #dc2626;
      stroke-width: 4;
    }
    
    .canvas-arrow text {
      fill: #dc2626;
      font-size: 12px;
      font-weight: bold;
    }
    
    /* ZONE */
    .canvas-zone {
      position: absolute;
      border: 3px dashed #dc2626;
      border-radius: 8px;
      pointer-events: none;
      background: rgba(220, 38, 38, 0.05);
    }
    
    .canvas-zone.selected {
      border-style: solid;
      background: rgba(220, 38, 38, 0.1);
      pointer-events: all;
      cursor: move;
    }
    
    /* STATUS BAR */
    .status-bar {
      background: white;
      border-top: 1px solid #e5e7eb;
      padding: 10px 20px;
      font-size: 12px;
      color: #6b7280;
      display: flex;
      justify-content: space-between;
    }
    
    .status-item {
      display: flex;
      gap: 20px;
    }
    
    /* LOADING */
    .loading {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      display: none;
      z-index: 1000;
    }
    
    .loading.show {
      display: block;
    }
  </style>
</head>
<body>
  <div class="editor-container">
    <!-- SIDEBAR -->
    <div class="sidebar">
      <div class="sidebar-header">
        <h1>🗺️ Éditeur de Calepinage</h1>
        <p>${projectId}</p>
      </div>
      
      <div class="tool-section">
        <h3>Outils</h3>
        <div class="tool-buttons">
          <button class="tool-btn active" data-mode="select" title="Sélectionner">
            <span>👆</span>
            <div>Sélection</div>
          </button>
          <button class="tool-btn" data-mode="move" title="Déplacer">
            <span>✋</span>
            <div>Déplacer</div>
          </button>
          <button class="tool-btn" data-mode="arrow" title="Flèche">
            <span>➡️</span>
            <div>Flèche</div>
          </button>
          <button class="tool-btn" data-mode="zone" title="Zone">
            <span>🔲</span>
            <div>Zone</div>
          </button>
        </div>
      </div>
      
      <div class="tool-section">
        <h3>Modules (drag & drop sur le canvas)</h3>
      </div>
      
      <div class="modules-list" id="modulesList">
        <!-- Généré dynamiquement -->
      </div>
    </div>
    
    <!-- CANVAS -->
    <div class="canvas-container">
      <div class="toolbar">
        <button class="toolbar-btn primary" id="saveBtn">💾 Sauvegarder</button>
        <button class="toolbar-btn" id="loadBtn">📂 Charger</button>
        <button class="toolbar-btn" id="exportBtn">📤 Export JSON</button>
        <button class="toolbar-btn" id="clearBtn">🗑️ Tout effacer</button>
        
        <div class="zoom-controls">
          <button class="toolbar-btn" id="zoomOutBtn">-</button>
          <span id="zoomLevel">100%</span>
          <button class="toolbar-btn" id="zoomInBtn">+</button>
          <button class="toolbar-btn" id="resetViewBtn">🎯 Reset</button>
        </div>
      </div>
      
      <div class="canvas-wrapper">
        <div id="canvas" class="mode-select">
          <!-- Canvas dynamique -->
        </div>
      </div>
      
      <div class="status-bar">
        <div class="status-item">
          <span>Mode: <strong id="statusMode">Sélection</strong></span>
          <span>Modules: <strong id="statusModules">0</strong></span>
          <span>Flèches: <strong id="statusArrows">0</strong></span>
          <span>Zones: <strong id="statusZones">0</strong></span>
        </div>
        <div class="status-item">
          <span id="statusMessage">Prêt</span>
        </div>
      </div>
    </div>
  </div>
  
  <div class="loading" id="loading">
    <div>⏳ Sauvegarde en cours...</div>
  </div>
  
  <script>
    const PROJECT_ID = '${projectId}'
    const MODULE_TYPE = '${moduleType}'
    const MODULES_DATA = ${modulesJson}
    const SAVED_LAYOUT = ${savedLayoutJson}
    
    let editorState = {
      mode: 'select',
      zoom: 1.0,
      modules: [],
      arrows: [],
      zones: [],
      selectedItem: null,
      dragStartPos: null,
      arrowStartPos: null,
      zoneStartPos: null
    }
    
    // Initialize modules list
    function initModulesList() {
      const container = document.getElementById('modulesList')
      const stringGroups = {}
      
      MODULES_DATA.forEach(m => {
        if (!stringGroups[m.stringNumber]) {
          stringGroups[m.stringNumber] = []
        }
        stringGroups[m.stringNumber].push(m)
      })
      
      Object.keys(stringGroups).sort((a, b) => parseInt(a) - parseInt(b)).forEach(stringNum => {
        const group = document.createElement('div')
        group.className = 'string-group'
        
        const header = document.createElement('div')
        header.className = 'string-header'
        header.textContent = \`String \${stringNum} (\${stringGroups[stringNum].length} modules)\`
        group.appendChild(header)
        
        stringGroups[stringNum].forEach(m => {
          const item = document.createElement('div')
          item.className = 'module-item'
          item.textContent = m.identifier
          item.draggable = true
          item.dataset.identifier = m.identifier
          item.dataset.status = m.status
          
          item.addEventListener('dragstart', handleModuleDragStart)
          item.addEventListener('dragend', handleModuleDragEnd)
          
          group.appendChild(item)
        })
        
        container.appendChild(group)
      })
    }
    
    // Load saved layout if exists
    if (SAVED_LAYOUT) {
      editorState.modules = SAVED_LAYOUT.modules || []
      editorState.arrows = SAVED_LAYOUT.arrows || []
      editorState.zones = SAVED_LAYOUT.zones || []
      renderCanvas()
    }
    
    // Tool buttons
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = btn.dataset.mode
        setMode(mode)
      })
    })
    
    function setMode(mode) {
      editorState.mode = mode
      document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'))
      document.querySelector(\`[data-mode="\${mode}"]\`).classList.add('active')
      document.getElementById('canvas').className = \`mode-\${mode}\`
      document.getElementById('statusMode').textContent = {
        'select': 'Sélection',
        'move': 'Déplacement',
        'arrow': 'Flèche',
        'zone': 'Zone'
      }[mode]
    }
    
    // Drag and drop from sidebar
    function handleModuleDragStart(e) {
      e.dataTransfer.effectAllowed = 'copy'
      e.dataTransfer.setData('text/plain', e.target.dataset.identifier)
      e.target.classList.add('dragging')
    }
    
    function handleModuleDragEnd(e) {
      e.target.classList.remove('dragging')
    }
    
    // Canvas drop
    const canvas = document.getElementById('canvas')
    canvas.addEventListener('dragover', (e) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
    })
    
    canvas.addEventListener('drop', (e) => {
      e.preventDefault()
      const identifier = e.dataTransfer.getData('text/plain')
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      
      // Check if module already exists
      if (editorState.modules.find(m => m.identifier === identifier)) {
        showMessage('Module déjà sur le canvas', 'warning')
        return
      }
      
      const moduleData = MODULES_DATA.find(m => m.identifier === identifier)
      
      editorState.modules.push({
        identifier,
        x: Math.round(x / 20) * 20,  // Snap to grid
        y: Math.round(y / 20) * 20,
        width: 60,
        height: 35,
        status: moduleData.status
      })
      
      renderCanvas()
      updateStats()
      showMessage(\`Module \${identifier} ajouté\`)
    })
    
    // Render canvas
    function renderCanvas() {
      canvas.innerHTML = ''
      
      // Render zones (behind)
      editorState.zones.forEach((zone, idx) => {
        const el = document.createElement('div')
        el.className = 'canvas-zone'
        el.style.left = zone.x + 'px'
        el.style.top = zone.y + 'px'
        el.style.width = zone.width + 'px'
        el.style.height = zone.height + 'px'
        el.dataset.index = idx
        canvas.appendChild(el)
      })
      
      // Render modules
      editorState.modules.forEach((module, idx) => {
        const el = document.createElement('div')
        el.className = 'canvas-module'
        if (module.status === 'defect') el.classList.add('defect')
        el.style.left = module.x + 'px'
        el.style.top = module.y + 'px'
        el.style.width = module.width + 'px'
        el.style.height = module.height + 'px'
        el.textContent = module.identifier
        el.dataset.index = idx
        
        el.addEventListener('mousedown', handleModuleMouseDown)
        
        canvas.appendChild(el)
      })
      
      // Render arrows (SVG)
      editorState.arrows.forEach((arrow, idx) => {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
        svg.setAttribute('class', 'canvas-arrow')
        svg.setAttribute('style', \`position: absolute; left: 0; top: 0; width: 100%; height: 100%; pointer-events: none;\`)
        
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker')
        marker.setAttribute('id', \`arrow-\${idx}\`)
        marker.setAttribute('markerWidth', '12')
        marker.setAttribute('markerHeight', '12')
        marker.setAttribute('refX', '10')
        marker.setAttribute('refY', '6')
        marker.setAttribute('orient', 'auto')
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        path.setAttribute('d', 'M2,2 L2,10 L10,6 z')
        path.setAttribute('fill', '#dc2626')
        
        marker.appendChild(path)
        defs.appendChild(marker)
        svg.appendChild(defs)
        
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
        line.setAttribute('x1', arrow.startX)
        line.setAttribute('y1', arrow.startY)
        line.setAttribute('x2', arrow.endX)
        line.setAttribute('y2', arrow.endY)
        line.setAttribute('marker-end', \`url(#arrow-\${idx})\`)
        svg.appendChild(line)
        
        if (arrow.label) {
          const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
          text.setAttribute('x', (arrow.startX + arrow.endX) / 2)
          text.setAttribute('y', (arrow.startY + arrow.endY) / 2 - 10)
          text.setAttribute('text-anchor', 'middle')
          text.textContent = arrow.label
          svg.appendChild(text)
        }
        
        canvas.appendChild(svg)
      })
    }
    
    function handleModuleMouseDown(e) {
      if (editorState.mode === 'move') {
        e.preventDefault()
        const idx = parseInt(e.target.dataset.index)
        editorState.selectedItem = { type: 'module', index: idx }
        editorState.dragStartPos = { x: e.clientX, y: e.clientY }
        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
      }
    }
    
    function handleMouseMove(e) {
      if (editorState.dragStartPos && editorState.selectedItem.type === 'module') {
        const dx = e.clientX - editorState.dragStartPos.x
        const dy = e.clientY - editorState.dragStartPos.y
        const module = editorState.modules[editorState.selectedItem.index]
        module.x += dx
        module.y += dy
        editorState.dragStartPos = { x: e.clientX, y: e.clientY }
        renderCanvas()
      }
    }
    
    function handleMouseUp(e) {
      editorState.dragStartPos = null
      editorState.selectedItem = null
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    // Canvas click handlers for drawing tools
    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect()
      const x = Math.round((e.clientX - rect.left) / 20) * 20
      const y = Math.round((e.clientY - rect.top) / 20) * 20
      
      if (editorState.mode === 'arrow') {
        handleArrowClick(x, y)
      }
    })
    
    canvas.addEventListener('mousedown', (e) => {
      if (editorState.mode === 'zone') {
        const rect = canvas.getBoundingClientRect()
        const x = Math.round((e.clientX - rect.left) / 20) * 20
        const y = Math.round((e.clientY - rect.top) / 20) * 20
        editorState.zoneStartPos = { x, y }
        document.addEventListener('mousemove', handleZoneMouseMove)
        document.addEventListener('mouseup', handleZoneMouseUp)
      }
    })
    
    function handleArrowClick(x, y) {
      if (!editorState.arrowStartPos) {
        // Premier clic: définir le point de départ
        editorState.arrowStartPos = { x, y }
        showMessage('Cliquez sur le point d\'arrivée de la flèche', 'info')
        
        // Ajouter un indicateur visuel temporaire
        const indicator = document.createElement('div')
        indicator.id = 'arrow-start-indicator'
        indicator.style.cssText = \`
          position: absolute;
          left: \${x - 5}px;
          top: \${y - 5}px;
          width: 10px;
          height: 10px;
          background: #dc2626;
          border-radius: 50%;
          border: 2px solid white;
          z-index: 1000;
        \`
        canvas.appendChild(indicator)
      } else {
        // Deuxième clic: créer la flèche
        const arrow = {
          id: 'arrow-' + Date.now(),
          stringNumber: editorState.arrows.length + 1,
          startX: editorState.arrowStartPos.x,
          startY: editorState.arrowStartPos.y,
          endX: x,
          endY: y,
          color: '#dc2626',
          width: 4,
          label: \`S\${editorState.arrows.length + 1}\`
        }
        
        editorState.arrows.push(arrow)
        
        // Supprimer l'indicateur
        const indicator = document.getElementById('arrow-start-indicator')
        if (indicator) indicator.remove()
        
        editorState.arrowStartPos = null
        renderCanvas()
        updateStats()
        showMessage(\`Flèche créée\`, 'success')
      }
    }
    
    let zonePreview = null
    
    function handleZoneMouseMove(e) {
      if (!editorState.zoneStartPos) return
      
      const rect = canvas.getBoundingClientRect()
      const currentX = e.clientX - rect.left
      const currentY = e.clientY - rect.top
      
      const x = Math.min(editorState.zoneStartPos.x, currentX)
      const y = Math.min(editorState.zoneStartPos.y, currentY)
      const width = Math.abs(currentX - editorState.zoneStartPos.x)
      const height = Math.abs(currentY - editorState.zoneStartPos.y)
      
      // Afficher un aperçu
      if (!zonePreview) {
        zonePreview = document.createElement('div')
        zonePreview.id = 'zone-preview'
        zonePreview.style.cssText = \`
          position: absolute;
          border: 3px dashed #dc2626;
          background: rgba(220, 38, 38, 0.1);
          pointer-events: none;
          z-index: 500;
        \`
        canvas.appendChild(zonePreview)
      }
      
      zonePreview.style.left = x + 'px'
      zonePreview.style.top = y + 'px'
      zonePreview.style.width = width + 'px'
      zonePreview.style.height = height + 'px'
    }
    
    function handleZoneMouseUp(e) {
      if (!editorState.zoneStartPos) return
      
      const rect = canvas.getBoundingClientRect()
      const endX = e.clientX - rect.left
      const endY = e.clientY - rect.top
      
      const x = Math.round(Math.min(editorState.zoneStartPos.x, endX) / 20) * 20
      const y = Math.round(Math.min(editorState.zoneStartPos.y, endY) / 20) * 20
      const width = Math.round(Math.abs(endX - editorState.zoneStartPos.x) / 20) * 20
      const height = Math.round(Math.abs(endY - editorState.zoneStartPos.y) / 20) * 20
      
      if (width > 40 && height > 40) {  // Minimum size
        const zone = {
          id: 'zone-' + Date.now(),
          name: \`Zone \${editorState.zones.length + 1}\`,
          x,
          y,
          width,
          height,
          borderColor: '#dc2626',
          borderWidth: 3,
          borderStyle: 'solid',
          backgroundColor: 'rgba(220, 38, 38, 0.05)'
        }
        
        editorState.zones.push(zone)
        updateStats()
        showMessage(\`Zone créée\`, 'success')
      } else {
        showMessage('Zone trop petite (minimum 40x40px)', 'warning')
      }
      
      // Nettoyer
      if (zonePreview) {
        zonePreview.remove()
        zonePreview = null
      }
      editorState.zoneStartPos = null
      document.removeEventListener('mousemove', handleZoneMouseMove)
      document.removeEventListener('mouseup', handleZoneMouseUp)
      
      renderCanvas()
    }
    
    // Keyboard shortcuts for delete
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Delete' && editorState.selectedItem) {
        if (editorState.selectedItem.type === 'module') {
          editorState.modules.splice(editorState.selectedItem.index, 1)
          showMessage('Module supprimé')
        }
        editorState.selectedItem = null
        renderCanvas()
        updateStats()
      }
      
      // Cancel arrow/zone drawing with Escape
      if (e.key === 'Escape') {
        if (editorState.arrowStartPos) {
          const indicator = document.getElementById('arrow-start-indicator')
          if (indicator) indicator.remove()
          editorState.arrowStartPos = null
          showMessage('Dessin de flèche annulé')
        }
        if (zonePreview) {
          zonePreview.remove()
          zonePreview = null
          editorState.zoneStartPos = null
          document.removeEventListener('mousemove', handleZoneMouseMove)
          document.removeEventListener('mouseup', handleZoneMouseUp)
          showMessage('Dessin de zone annulé')
        }
      }
    })
    
    // Save button
    document.getElementById('saveBtn').addEventListener('click', async () => {
      document.getElementById('loading').classList.add('show')
      
      const layout = {
        projectId: PROJECT_ID,
        moduleType: MODULE_TYPE,
        layoutName: \`\${PROJECT_ID} - Configuration\`,
        layout: {
          viewBox: { width: 2400, height: 1200, gridSize: 20 },
          modules: editorState.modules,
          arrows: editorState.arrows,
          zones: editorState.zones
        }
      }
      
      try {
        const response = await fetch('/api/calepinage/layouts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(layout)
        })
        
        const result = await response.json()
        
        if (result.success) {
          showMessage('✅ Layout sauvegardé avec succès', 'success')
        } else {
          showMessage('❌ Erreur: ' + result.error, 'error')
        }
      } catch (error) {
        showMessage('❌ Erreur réseau: ' + error.message, 'error')
      } finally {
        document.getElementById('loading').classList.remove('show')
      }
    })
    
    // Export JSON
    document.getElementById('exportBtn').addEventListener('click', () => {
      const data = {
        modules: editorState.modules,
        arrows: editorState.arrows,
        zones: editorState.zones
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = \`calepinage-\${PROJECT_ID}.json\`
      a.click()
      showMessage('📥 Exporté en JSON')
    })
    
    // Clear all
    document.getElementById('clearBtn').addEventListener('click', () => {
      if (confirm('Effacer tous les éléments du canvas ?')) {
        editorState.modules = []
        editorState.arrows = []
        editorState.zones = []
        renderCanvas()
        updateStats()
        showMessage('🗑️ Canvas effacé')
      }
    })
    
    function updateStats() {
      document.getElementById('statusModules').textContent = editorState.modules.length
      document.getElementById('statusArrows').textContent = editorState.arrows.length
      document.getElementById('statusZones').textContent = editorState.zones.length
    }
    
    function showMessage(msg, type = 'info') {
      document.getElementById('statusMessage').textContent = msg
      setTimeout(() => {
        document.getElementById('statusMessage').textContent = 'Prêt'
      }, 3000)
    }
    
    // Initialize
    initModulesList()
    updateStats()
  </script>
</body>
</html>
  `
}

export default editorRouter
