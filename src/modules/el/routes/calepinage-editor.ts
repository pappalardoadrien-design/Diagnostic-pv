import { Hono } from 'hono'

const calepinageEditorRoutes = new Hono()

/**
 * GET /api/el/calepinage-editor/:audit_token
 * Éditeur interactif de plan de câblage
 */
calepinageEditorRoutes.get('/:audit_token', async (c) => {
  const { audit_token } = c.req.param()
  const { DB } = c.env as { DB: D1Database }

  try {
    // Get audit info
    const audit = await DB.prepare(`
      SELECT * FROM el_audits WHERE audit_token = ?
    `).bind(audit_token).first()

    if (!audit) {
      return c.html('<h1>Audit non trouvé</h1>')
    }

    // Get all modules
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
      return c.html('<h1>Aucun module trouvé</h1>')
    }

    // Group modules by string
    const modulesByString: Record<number, any[]> = {}
    modules.results.forEach((m: any) => {
      if (!modulesByString[m.string_number]) {
        modulesByString[m.string_number] = []
      }
      modulesByString[m.string_number].push(m)
    })

    return c.html(generateEditorHTML(audit, modulesByString, audit_token))

  } catch (error: any) {
    console.error('Error loading editor:', error)
    return c.html(`<h1>Erreur: ${error.message}</h1>`)
  }
})

/**
 * POST /api/el/calepinage-editor/:audit_token/save
 * Sauvegarder la configuration de câblage
 */
calepinageEditorRoutes.post('/:audit_token/save', async (c) => {
  try {
    const { audit_token } = c.req.param()
    const config = await c.req.json()
    
    // TODO: Sauvegarder la config dans D1
    // Pour l'instant, on retourne juste le TypeScript à copier-coller
    
    return c.json({ 
      success: true,
      typescript: generateConfigTypeScript(audit_token, config)
    })
    
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})

function generateConfigTypeScript(auditToken: string, config: any): string {
  return `
// Configuration à copier dans calepinage-grid.ts -> WIRING_CONFIGS

'${auditToken}': {
  wiring: [
    ${config.wiring.map((d: string) => `'${d}'`).join(',\n    ')}
  ],
  arrows: [
    ${config.arrows.map((a: any) => 
      `{ fromString: ${a.fromString}, toString: ${a.toString}, position: '${a.position}' }`
    ).join(',\n    ')}
  ]
}
  `.trim()
}

function generateEditorHTML(audit: any, modulesByString: Record<number, any[]>, auditToken: string): string {
  const stringNumbers = Object.keys(modulesByString).map(Number).sort((a, b) => a - b)
  
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Éditeur Plan Câblage - ${audit.project_name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: Arial, sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    
    .container {
      max-width: 1400px;
      margin: 0 auto;
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    
    h1 {
      color: #1e40af;
      margin-bottom: 10px;
    }
    
    .project-name {
      color: #666;
      font-size: 14pt;
      margin-bottom: 20px;
    }
    
    .toolbar {
      display: flex;
      gap: 15px;
      margin-bottom: 30px;
      padding: 20px;
      background: #f9fafb;
      border-radius: 8px;
      border-left: 4px solid #1e40af;
    }
    
    .toolbar button {
      padding: 12px 24px;
      background: #1e40af;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: bold;
      font-size: 11pt;
    }
    
    .toolbar button:hover {
      background: #1e3a8a;
    }
    
    .toolbar button.secondary {
      background: #6b7280;
    }
    
    .toolbar button.secondary:hover {
      background: #4b5563;
    }
    
    .mode-selector {
      display: flex;
      gap: 10px;
      align-items: center;
    }
    
    .mode-btn {
      padding: 8px 16px;
      background: white;
      border: 2px solid #d1d5db;
      border-radius: 6px;
      cursor: pointer;
      font-size: 10pt;
    }
    
    .mode-btn.active {
      background: #1e40af;
      color: white;
      border-color: #1e40af;
    }
    
    .grid-container {
      position: relative;
      margin: 30px 0;
      padding-left: 60px;
    }
    
    .grid-row {
      display: flex;
      gap: 2px;
      margin-bottom: 15px;
      position: relative;
    }
    
    .row-label {
      position: absolute;
      left: -55px;
      top: 50%;
      transform: translateY(-50%);
      font-weight: bold;
      color: #1e40af;
      font-size: 11pt;
    }
    
    .direction-toggle {
      position: absolute;
      left: -35px;
      top: 50%;
      transform: translateY(-50%);
      cursor: pointer;
      font-size: 16pt;
      user-select: none;
    }
    
    .modules-row {
      display: flex;
      gap: 2px;
    }
    
    .module-cell {
      width: 32px;
      height: 45px;
      border: 2px solid #666;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 7pt;
      cursor: pointer;
      position: relative;
      transition: all 0.2s;
    }
    
    .module-cell:hover {
      transform: scale(1.1);
      z-index: 10;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }
    
    .module-cell.ok { background: #d4f4dd; border-color: #4ade80; }
    .module-cell.inegalite { background: #fef3c7; border-color: #fbbf24; }
    .module-cell.microfissures { background: #fed7aa; border-color: #fb923c; }
    .module-cell.impact_cellulaire { background: #fecaca; border-color: #f87171; }
    .module-cell.string_ouvert { background: #bfdbfe; border-color: #60a5fa; }
    .module-cell.non_raccorde { background: #e5e7eb; border-color: #9ca3af; }
    
    .module-cell.arrow-start::after {
      content: '↓';
      position: absolute;
      bottom: -25px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 20pt;
      color: #dc2626;
      font-weight: bold;
    }
    
    .arrow-spacer {
      height: 30px;
      position: relative;
    }
    
    .config-output {
      margin-top: 30px;
      padding: 20px;
      background: #1e293b;
      color: #e2e8f0;
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      font-size: 10pt;
      line-height: 1.6;
      max-height: 400px;
      overflow-y: auto;
      display: none;
    }
    
    .config-output.show {
      display: block;
    }
    
    .legend {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      margin-top: 30px;
      padding: 20px;
      background: #f9fafb;
      border-radius: 8px;
    }
    
    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 9pt;
    }
    
    .legend-box {
      width: 30px;
      height: 40px;
      border: 2px solid #666;
    }
    
    .instructions {
      margin-top: 20px;
      padding: 20px;
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      border-radius: 8px;
    }
    
    .instructions h3 {
      color: #92400e;
      margin-bottom: 10px;
    }
    
    .instructions ul {
      margin-left: 20px;
      color: #78350f;
      line-height: 1.8;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔧 Éditeur Plan de Câblage</h1>
    <div class="project-name">${audit.project_name || 'Non renseigné'} - ${auditToken}</div>
    
    <!-- Toolbar -->
    <div class="toolbar">
      <div class="mode-selector">
        <strong>Mode:</strong>
        <button class="mode-btn active" onclick="setMode('direction')">Direction</button>
        <button class="mode-btn" onclick="setMode('arrow')">Flèches</button>
      </div>
      <button onclick="generateConfig()">📋 Générer Config</button>
      <button class="secondary" onclick="resetConfig()">🔄 Réinitialiser</button>
      <button class="secondary" onclick="window.open('/api/el/calepinage-grid/${auditToken}', '_blank')">👁️ Aperçu</button>
    </div>
    
    <!-- Instructions -->
    <div class="instructions">
      <h3>📖 Instructions</h3>
      <ul>
        <li><strong>Mode Direction</strong> : Cliquez sur le label de string (S1, S2...) pour changer la direction (→ ou ←)</li>
        <li><strong>Mode Flèches</strong> : Cliquez sur un module pour ajouter/supprimer une flèche de connexion vers la string suivante</li>
        <li>Après modifications, cliquez sur "Générer Config" pour obtenir le code TypeScript</li>
        <li>Copiez le code généré dans <code>calepinage-grid.ts</code> → <code>WIRING_CONFIGS</code></li>
      </ul>
    </div>
    
    <!-- Grid -->
    <div class="grid-container">
      ${generateEditableGrid(modulesByString, stringNumbers)}
    </div>
    
    <!-- Legend -->
    <div class="legend">
      <div class="legend-item">
        <div class="legend-box" style="background: #d4f4dd; border-color: #4ade80;"></div>
        <span>✅ OK</span>
      </div>
      <div class="legend-item">
        <div class="legend-box" style="background: #fed7aa; border-color: #fb923c;"></div>
        <span>🔶 Microfissures</span>
      </div>
      <div class="legend-item">
        <div class="legend-box" style="background: #fecaca; border-color: #f87171;"></div>
        <span>🚨 Impact Cellulaire</span>
      </div>
    </div>
    
    <!-- Config Output -->
    <div class="config-output" id="configOutput"></div>
  </div>
  
  <script>
    // État de l'éditeur
    let mode = 'direction'
    let config = {
      wiring: ${JSON.stringify(stringNumbers.map((_, i) => i % 2 === 0 ? 'left-to-right' : 'right-to-left'))},
      arrows: []
    }
    
    function setMode(newMode) {
      mode = newMode
      document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'))
      event.target.classList.add('active')
    }
    
    function toggleDirection(stringIndex) {
      if (mode !== 'direction') return
      config.wiring[stringIndex] = config.wiring[stringIndex] === 'left-to-right' ? 'right-to-left' : 'left-to-right'
      updateDirectionIcons()
    }
    
    function toggleArrow(stringNum, moduleIdx) {
      if (mode !== 'arrow') return
      
      const exists = config.arrows.findIndex(a => 
        a.fromString === stringNum && a.modulePosition === moduleIdx
      )
      
      if (exists >= 0) {
        config.arrows.splice(exists, 1)
      } else {
        const toString = stringNum + 1
        if (toString <= ${stringNumbers.length}) {
          config.arrows.push({
            fromString: stringNum,
            toString: toString,
            position: 'end', // Will be calculated based on actual click position
            modulePosition: moduleIdx
          })
        }
      }
      
      updateArrows()
    }
    
    function updateDirectionIcons() {
      config.wiring.forEach((dir, idx) => {
        const icon = document.querySelector(\`.direction-toggle[data-string="\${idx}"]\`)
        if (icon) {
          icon.textContent = dir === 'left-to-right' ? '→' : '←'
        }
      })
    }
    
    function updateArrows() {
      // Remove all arrow classes
      document.querySelectorAll('.module-cell').forEach(cell => {
        cell.classList.remove('arrow-start')
      })
      
      // Add arrow classes
      config.arrows.forEach(arrow => {
        const cell = document.querySelector(\`.module-cell[data-string="\${arrow.fromString}"][data-position="\${arrow.modulePosition}"]\`)
        if (cell) {
          cell.classList.add('arrow-start')
        }
      })
    }
    
    function generateConfig() {
      const output = \`// Configuration ${auditToken}
// À copier dans: src/modules/el/routes/calepinage-grid.ts → WIRING_CONFIGS

'${auditToken}': {
  wiring: [
    \${config.wiring.map(d => \`'\${d}'\`).join(',\\n    ')}
  ],
  arrows: [
    \${config.arrows.map(a => 
      \`{ fromString: \${a.fromString}, toString: \${a.toString}, position: 'end' }\`
    ).join(',\\n    ')}
  ]
}\`
      
      const outputDiv = document.getElementById('configOutput')
      outputDiv.innerHTML = '<pre>' + output + '</pre><button onclick="copyConfig()" style="margin-top: 15px; padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer;">📋 Copier</button>'
      outputDiv.classList.add('show')
      outputDiv.scrollIntoView({ behavior: 'smooth' })
    }
    
    function copyConfig() {
      const text = document.querySelector('#configOutput pre').textContent
      navigator.clipboard.writeText(text).then(() => {
        alert('✅ Configuration copiée dans le presse-papier !')
      })
    }
    
    function resetConfig() {
      if (confirm('Réinitialiser la configuration ?')) {
        config = {
          wiring: ${JSON.stringify(stringNumbers.map((_, i) => i % 2 === 0 ? 'left-to-right' : 'right-to-left'))},
          arrows: []
        }
        updateDirectionIcons()
        updateArrows()
        document.getElementById('configOutput').classList.remove('show')
      }
    }
    
    // Initialize
    updateDirectionIcons()
  </script>
</body>
</html>
  `
}

function generateEditableGrid(modulesByString: Record<number, any[]>, stringNumbers: number[]): string {
  return stringNumbers.map((stringNum, stringIndex) => {
    const modules = modulesByString[stringNum]
    
    return `
    <div class="grid-row">
      <div class="row-label">S${stringNum}</div>
      <div class="direction-toggle" data-string="${stringIndex}" onclick="toggleDirection(${stringIndex})">→</div>
      <div class="modules-row">
        ${modules.map((m, idx) => {
          const defectType = m.defect_type || 'none'
          const hasDefect = defectType !== 'none' && defectType !== 'pending'
          const cssClass = hasDefect ? defectType : 'ok'
          
          return `
          <div class="module-cell ${cssClass}" 
               data-string="${stringNum}" 
               data-position="${idx}"
               onclick="toggleArrow(${stringNum}, ${idx})"
               title="${m.module_identifier}">
            ${m.position_in_string}
          </div>
          `
        }).join('')}
      </div>
    </div>
    `
  }).join('')
}

export default calepinageEditorRoutes
