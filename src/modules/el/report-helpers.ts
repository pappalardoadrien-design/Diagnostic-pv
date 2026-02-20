/**
 * EL Report Helpers - Fonctions generation rapport audit EL
 * Extrait de index.tsx le 2026-02-20 (refactoring)
 * generatePhysicalModulesGrid + getStatusLabel
 */

export function generatePhysicalModulesGrid(modules: any[]) {
  if (!modules || modules.length === 0) {
    return '<p>Aucun module trouvé</p>'
  }

  // Tri des modules par position physique
  const sortedModules = modules.sort((a, b) => {
    // Tri par rangée (row) d'abord, puis par colonne (col)
    if (a.physical_row !== b.physical_row) {
      return (a.physical_row || 0) - (b.physical_row || 0)
    }
    return (a.physical_col || 0) - (b.physical_col || 0)
  })

  // Déterminer dimensions de la grille
  const maxRow = Math.max(...sortedModules.map(m => m.physical_row || 0))
  const maxCol = Math.max(...sortedModules.map(m => m.physical_col || 0))
  const minRow = Math.min(...sortedModules.map(m => m.physical_row || 0))
  const minCol = Math.min(...sortedModules.map(m => m.physical_col || 0))

  // Créer une grille vide (String 1 en HAUT = index 0)
  const grid = []
  for (let row = minRow; row <= maxRow; row++) { // Row 1  index 0 (TOP), Row 10  index 9 (BOTTOM)
    const gridRow = []
    for (let col = minCol; col <= maxCol; col++) {
      gridRow.push(null)
    }
    grid.push(gridRow)
  }

  // Placer les modules dans la grille
  sortedModules.forEach(module => {
    const row = module.physical_row || 0
    const col = module.physical_col || 0
    const gridRowIndex = row - minRow  // Row 1  index 0 (TOP), Row 10  index 9 (BOTTOM)
    const gridColIndex = col - minCol
    
    if (grid[gridRowIndex] && grid[gridRowIndex][gridColIndex] !== undefined) {
      grid[gridRowIndex][gridColIndex] = module
    }
  })

  // Génération HTML de la grille
  let html = `
    <div class="physical-modules-grid" style="
      display: grid; 
      grid-template-columns: repeat(${maxCol - minCol + 1}, 32px);
      gap: 3px;
      padding: 20px;
      background: #f8fafc;
      border-radius: 10px;
      border: 2px dashed #cbd5e1;
      justify-content: center;
      max-width: fit-content;
      margin: 0 auto;
    ">
  `

  grid.forEach((row, rowIndex) => {
    row.forEach((module, colIndex) => {
      if (module) {
        html += `
          <div class="module ${module.status}" title="${module.module_id} (Rang ${module.physical_row}, Col ${module.physical_col})">
            ${module.module_id.includes('-') ? module.module_id.split('-')[1] : module.module_id.substring(1)}
          </div>
        `
      } else {
        // Cellule vide pour maintenir l'alignement
        html += `<div class="module-empty" style="width: 30px; height: 24px;"></div>`
      }
    })
  })

  html += '</div>'
  
  // Ajouter une vue par string aussi pour référence
  html += '<div style="margin-top: 30px;">'
  html += '<h4 style="color: #374151; margin-bottom: 15px;">DOCS Vue par String (référence)</h4>'
  
  // Grouper par string
  const modulesByString = {}
  sortedModules.forEach(module => {
    const stringNum = module.string_number
    if (!modulesByString[stringNum]) {
      modulesByString[stringNum] = []
    }
    modulesByString[stringNum].push(module)
  })

  Object.keys(modulesByString).sort((a, b) => parseInt(a) - parseInt(b)).forEach(stringNum => {
    const stringModules = modulesByString[stringNum].sort((a, b) => a.position_in_string - b.position_in_string)
    
    html += `
      <div style="margin-bottom: 15px;">
        <div style="font-weight: 600; margin-bottom: 5px; color: #1f2937;">
          String ${stringNum} (${stringModules.length} modules)
        </div>
        <div style="display: flex; gap: 3px; flex-wrap: wrap;">
    `
    
    stringModules.forEach(module => {
      html += `
        <div class="module ${module.status}" style="width: 28px; height: 20px; font-size: 8px;" 
             title="${module.module_id}">
          ${module.position_in_string}
        </div>
      `
    })
    
    html += '</div></div>'
  })
  
  html += '</div>'
  
  return html
}

// Fonction génération HTML rapport
async function generateReportHTML(audit: any, modules: any[], stats: any, measurements: any[] = []) {
  const date = new Date().toLocaleDateString('fr-FR')
  const okPercentage = ((stats.ok / stats.total) * 100).toFixed(1)
  const inequalityPercentage = ((stats.inequality / stats.total) * 100).toFixed(1)
  const microcracksPercentage = ((stats.microcracks / stats.total) * 100).toFixed(1)
  const deadPercentage = ((stats.dead / stats.total) * 100).toFixed(1)
  const stringOpenPercentage = ((stats.string_open / stats.total) * 100).toFixed(1)
  const notConnectedPercentage = ((stats.not_connected / stats.total) * 100).toFixed(1)

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <title>Rapport Audit EL - ${audit.project_name}</title>
        <style>
            /* === DESIGN PROFESSIONNEL DIAGPV === */
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            
            body { 
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
                margin: 0; 
                padding: 20px;
                color: #1f2937; 
                background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                line-height: 1.6;
            }
            
            .header { 
                background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
                color: white;
                text-align: center; 
                padding: 40px;
                border-radius: 16px;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                margin-bottom: 30px;
                position: relative;
                overflow: hidden;
            }
            
            .header::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="0.5" fill="%23ffffff" opacity="0.03"/></pattern></defs><rect width="100%" height="100%" fill="url(%23grain)"/></svg>');
                pointer-events: none;
            }
            
            .header h1 {
                font-size: 2.5rem;
                font-weight: 700;
                margin: 0 0 10px 0;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
                letter-spacing: -0.5px;
            }
            
            .header p {
                font-size: 1.1rem;
                opacity: 0.9;
                margin: 5px 0;
                font-weight: 400;
            }
            
            .header h2 {
                color: #f59e0b;
                font-size: 1.5rem;
                font-weight: 600;
                margin: 20px 0 30px 0;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            .client-info {
                background: rgba(255,255,255,0.1);
                backdrop-filter: blur(10px);
                border-radius: 12px;
                padding: 25px;
                text-align: left;
                margin-top: 25px;
                border: 1px solid rgba(255,255,255,0.2);
            }
            
            .client-info p {
                margin: 8px 0;
                display: flex;
                align-items: center;
                font-size: 0.95rem;
            }
            
            .client-info strong {
                min-width: 140px;
                color: #f59e0b;
                font-weight: 600;
            }
            
            .section { 
                background: white;
                margin: 25px 0;
                page-break-inside: avoid;
                border-radius: 12px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                overflow: hidden;
                border: 1px solid #e5e7eb;
            }
            
            .section h3 {
                background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                color: white;
                margin: 0;
                padding: 20px 25px;
                font-size: 1.25rem;
             page-break-inside: avoid;
                border-radius: 12px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                overflow: hidden;
                border: 1px solid #e5e7eb;
            }
            
            .section h3 {
                background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                color: white;
                margin: 0;
                padding: 20px 25px;
                font-size: 1.25rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
            }
            
            .section-content {
                padding: 25px;
            }
            
            .stats { 
                display: grid; 
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); 
                gap: 15px;
                margin: 20px 0;
            }
            
            .stat-card {
                background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                border-radius: 10px;
                padding: 20px;
                border-left: 4px solid;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                transition: transform 0.2s ease;
            }
            
            .stat-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            }
            
            .stat-ok { border-left-color: #22c55e; }
            .stat-inequality { border-left-color: #eab308; }
            .stat-microcracks { border-left-color: #f97316; }
            .stat-dead { border-left-color: #ef4444; }
            .stat-string_open { border-left-color: #3b82f6; }
            .stat-not_connected { border-left-color: #6b7280; }
            
            .total-summary {
                background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
                color: white;
                padding: 20px;
                border-radius: 10px;
                text-align: center;
                font-size: 1.1rem;
                font-weight: 600;
                margin: 20px 0;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            
            .module-grid { 
                display: grid; 
                grid-template-columns: repeat(auto-fill, 32px); 
                gap: 3px;
                padding: 20px;
                background: #f8fafc;
                border-radius: 10px;
                border: 2px dashed #cbd5e1;
            }
            
            .module { 
                width: 30px; 
                height: 24px; 
                border-radius: 4px;
                text-align: center; 
                font-size: 9px; 
                color: white; 
                font-weight: 600;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                transition: transform 0.1s ease;
            }
            
            .module:hover {
                transform: scale(1.1);
                z-index: 10;
                position: relative;
            }
            
            .ok { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%) !important; }
            .inequality { background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%) !important; }
            .microcracks { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%) !important; }
            .dead { 
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important; 
                animation: pulse-danger 2s infinite;
            }
            .string_open { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important; }
            .not_connected { background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%) !important; }
            .pending { 
                background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%) !important; 
                color: #4b5563 !important;
                border: 1px dashed #9ca3af;
            }
            
            @keyframes pulse-danger {
                0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
                50% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
            }
            
            .legend {
                display: flex;
                flex-wrap: wrap;
                gap: 15px;
                margin: 20px 0;
                padding: 20px;
                background: white;
                border-radius: 10px;
                border: 1px solid #e5e7eb;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            }
            
            .legend-item {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 0.9rem;
                font-weight: 500;
                color: #4b5563;
            }
            
            .legend-color {
                width: 20px;
                height: 16px;
                border-radius: 3px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.2);
            }
            
            table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
                font-size: 0.9rem;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                border-radius: 8px;
                overflow: hidden;
            }
            
            table th {
                background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
                color: white;
                padding: 15px 12px;
                text-align: left;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                font-size: 0.8rem;
            }
            
            table td {
                padding: 12px;
                border-bottom: 1px solid #e5e7eb;
                background: white;
            }
            
            table tr:nth-child(even) td {
                background: #f8fafc;
            }
            
            table tr:hover td {
                background: #e0f2fe;
            }
            
            .signature-section {
                background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                border: 2px solid #cbd5e1;
                border-radius: 12px;
                padding: 25px;
                text-align: center;
                margin-top: 30px;
            }
            
            .instructions-box {
                background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                border: 2px solid #f59e0b;
                border-radius: 12px;
                padding: 20px;
                margin: 25px 0;
                box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            }
            
            .instructions-box h4 {
                color: #92400e;
                margin: 0 0 15px 0;
                font-size: 1.1rem;
                font-weight: 600;
            }
            
            .instructions-box p {
                color: #92400e;
                margin: 8px 0;
                font-size: 0.9rem;
            }
            
            /* Styles spécifiques pour impression */
            @media print {
                body { 
                    margin: 15px; 
                    font-size: 12px;
                    -webkit-print-color-adjust: exact !important;
                    color-adjust: exact !important;
                }
                .module { 
                    -webkit-print-color-adjust: exact !important;
                    color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
                .ok { background-color: #22c55e !important; -webkit-print-color-adjust: exact !important; }
                .inequality { background-color: #eab308 !important; -webkit-print-color-adjust: exact !important; }
                .microcracks { background-color: #f97316 !important; -webkit-print-color-adjust: exact !important; }
                .dead { background-color: #ef4444 !important; -webkit-print-color-adjust: exact !important; }
                .string_open { background-color: #3b82f6 !important; -webkit-print-color-adjust: exact !important; }
                .not_connected { background-color: #6b7280 !important; -webkit-print-color-adjust: exact !important; }
                .pending { background-color: #e5e7eb !important; -webkit-print-color-adjust: exact !important; }
                
                /* Forcer les couleurs même en mode économie d'encre */
                * { 
                    -webkit-print-color-adjust: exact !important;
                    color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
            }
            
            /* Styles pour PDF */
            @page {
                size: A4;
                margin: 1cm;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Batiment DIAGNOSTIC PHOTOVOLTAÏQUE</h1>
            <p>www.diagnosticphotovoltaique.fr</p>
            <h2>ELEC AUDIT ÉLECTROLUMINESCENCE ELEC</h2>
            
            <div class="client-info">
                <p><strong>Client :</strong> ${audit.client_name}</p>
                <p><strong>Installation :</strong> ${audit.location}</p>
                <p><strong>Date intervention :</strong> ${date}</p>
                <p><strong>Configuration :</strong> ${audit.total_modules} modules photovoltaïques, ${audit.string_count} strings</p>
                <p><strong>Méthode :</strong> Électroluminescence nocturne</p>
                <p><strong>Normes :</strong> IEC 62446-1, IEC 61215</p>
            </div>
        </div>
        
        <div class="section">
            <h3>STATS RÉSULTATS AUDIT ÉLECTROLUMINESCENCE</h3>
            <div class="section-content">
                <div class="stats">
                    <div class="stat-card stat-ok">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="font-size: 2rem;">OK</div>
                            <div>
                                <div style="font-weight: 600; font-size: 1.1rem;">Modules OK</div>
                                <div style="font-size: 1.5rem; font-weight: 700; color: #22c55e;">${stats.ok} (${okPercentage}%)</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="stat-card stat-inequality">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="font-size: 2rem;">Inegalite</div>
                            <div>
                                <div style="font-weight: 600; font-size: 1.1rem;">Inégalité cellules</div>
                                <div style="font-size: 1.5rem; font-weight: 700; color: #eab308;">${stats.inequality} (${inequalityPercentage}%)</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="stat-card stat-microcracks">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="font-size: 2rem;">Fissures</div>
                            <div>
                                <div style="font-weight: 600; font-size: 1.1rem;">Microfissures</div>
                                <div style="font-size: 1.5rem; font-weight: 700; color: #f97316;">${stats.microcracks} (${microcracksPercentage}%)</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="stat-card stat-dead">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="font-size: 2rem;">HS</div>
                            <div>
                                <div style="font-weight: 600; font-size: 1.1rem;">Modules HS</div>
                                <div style="font-size: 1.5rem; font-weight: 700; color: #ef4444;">${stats.dead} (${deadPercentage}%)</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="stat-card stat-string_open">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="font-size: 2rem;">String</div>
                            <div>
                                <div style="font-weight: 600; font-size: 1.1rem;">Strings ouverts</div>
                                <div style="font-size: 1.5rem; font-weight: 700; color: #3b82f6;">${stats.string_open} (${stringOpenPercentage}%)</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="stat-card stat-not_connected">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="font-size: 2rem;">Non-connecte</div>
                            <div>
                                <div style="font-weight: 600; font-size: 1.1rem;">Non raccordés</div>
                                <div style="font-size: 1.5rem; font-weight: 700; color: #6b7280;">${stats.not_connected} (${notConnectedPercentage}%)</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="total-summary">
                    ELEC TOTAL MODULES AUDITÉS : ${stats.total} ELEC
                </div>
            </div>
        </div>
        
        <div class="section">
            <h3>CARTE CARTOGRAPHIE MODULES</h3>
            <div class="section-content">
                
                <!-- Légende des couleurs -->
                <div class="legend">
                    <div class="legend-item">
                        <div class="legend-color ok"></div>
                        <span>OK</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color inequality"></div>
                        <span>Inégalité</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color microcracks"></div>
                        <span>Microfissures</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color dead"></div>
                        <span>HS</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color string_open"></div>
                        <span>String ouvert</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color not_connected"></div>
                        <span>Non raccordé</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color pending"></div>
                        <span>En attente</span>
                    </div>
                </div>
                
                ${generatePhysicalModulesGrid(modules)}
                
            </div>
        </div>
        
        <div class="section">
            <h3>ATTENTION MODULES NON-CONFORMES</h3>
            <div class="section-content">
                <table>
                    <tr>
                        <th>N° Module</th>
                        <th>String</th>
                        <th>État</th>
                        <th>Commentaire</th>
                    </tr>
                ${modules
                  .filter(m => m.status !== 'ok' && m.status !== 'pending')
                  .map(module => `
                    <tr>
                        <td>${module.module_id}</td>
                        <td>S${module.string_number}</td>
                        <td>${getStatusLabel(module.status)}</td>
                        <td>${module.comment || '-'}</td>
                    </tr>
                  `).join('')}
                </table>
            </div>
        </div>
        
        ${measurements.length > 0 ? `
        <div class="section">
            <h3>ELEC MESURES ÉLECTRIQUES PVSERV</h3>
            <div class="section-content">
                <div class="stats">
                    <div class="stat-card">
                        <div style="text-align: center;">
                            <div style="font-size: 2rem; margin-bottom: 5px;">STATS</div>
                            <div style="font-weight: 600;">Total mesures</div>
                            <div style="font-size: 1.5rem; font-weight: 700; color: #3b82f6;">${measurements.length}</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div style="text-align: center;">
                            <div style="font-size: 2rem; margin-bottom: 5px;">ELEC</div>
                            <div style="font-weight: 600;">FF moyen</div>
                            <div style="font-size: 1.5rem; font-weight: 700; color: #22c55e;">${(measurements.reduce((sum, m) => sum + parseFloat(m.ff || 0), 0) / measurements.length).toFixed(3)}</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div style="text-align: center;">
                            <div style="font-size: 2rem; margin-bottom: 5px;">CONNECT</div>
                            <div style="font-weight: 600;">Rds moyen</div>
                            <div style="font-size: 1.5rem; font-weight: 700; color: #f59e0b;">${(measurements.reduce((sum, m) => sum + parseFloat(m.rds || 0), 0) / measurements.length).toFixed(2)} Ω</div>
                        </div>
                    </div>
                </div>
                
                <table>
                    <tr>
                        <th>Module</th>
                        <th>Type</th>
                        <th>FF</th>
                        <th>Rds (Ω)</th>
                        <th>Uf (V)</th>
                        <th>Points IV</th>
                    </tr>
                ${measurements.slice(0, 50).map(m => { // Limite 50 pour PDF
                  const ivData = JSON.parse(m.iv_curve_data || '{"count": 0}')
                  return `
                    <tr>
                        <td>M${m.module_number?.toString().padStart(3, '0')}</td>
                        <td>${m.measurement_type}</td>
                        <td>${parseFloat(m.ff || 0).toFixed(3)}</td>
                        <td>${parseFloat(m.rds || 0).toFixed(2)}</td>
                        <td>${m.uf || 0}</td>
                        <td>${ivData.count || 0}</td>
                    </tr>
                  `
                }).join('')}
                ${measurements.length > 50 ? `
                <tr>
                    <td colspan="6" style="text-align: center; font-style: italic; color: #6b7280;">
                        ... ${measurements.length - 50} mesures supplémentaires disponibles dans l'export complet
                    </td>
                </tr>
                ` : ''}
                </table>
                
                <div style="margin-top: 15px; padding: 15px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #3b82f6;">
                    <p style="margin: 0; font-size: 0.9rem; color: #4b5563;"><strong>Note:</strong> Données PVserv brutes sans interprétation. FF = Fill Factor, Rds = Résistance série, Uf = Tension.</p>
                </div>
            </div>
        </div>
        ` : ''}

        <div class="signature-section">
            <h3 style="color: #1e293b; margin: 0 0 15px 0; font-size: 1.25rem;"> SIGNATURE NUMÉRIQUE</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; text-align: left; font-size: 0.9rem; color: #4b5563;">
                <div><strong>Génération :</strong> Automatique DiagPV Audit</div>
                <div><strong>Date :</strong> ${date}</div>
                <div><strong>Token :</strong> ${audit.token}</div>
                ${measurements.length > 0 ? `<div><strong>Mesures PVserv :</strong> ${measurements.length} intégrées</div>` : ''}
            </div>
        </div>
        
        <div class="instructions-box">
            <h4>DOCS INSTRUCTIONS IMPRESSION COULEURS</h4>
            <p><strong>Pour imprimer les couleurs des modules :</strong></p>
            <div style="margin-left: 15px; line-height: 1.6;">
                <p>• <strong>Chrome/Edge :</strong> Ctrl+P  Plus de paramètres  ✅ Graphiques d'arrière-plan</p>
                <p>• <strong>Firefox :</strong> Ctrl+P  Plus de paramètres  ✅ Imprimer les arrière-plans</p>
                <p>• <strong>Safari :</strong> Cmd+P  Safari  ✅ Imprimer les arrière-plans</p>
            </div>
        </div>
        
    </body>
    <script>
        // Optimisation automatique pour impression des couleurs
        document.addEventListener('DOMContentLoaded', function() {
            // Optimisation couleurs rapport activée
            
            // Force l'affichage des couleurs pour tous les modules
            const modules = document.querySelectorAll('.module');
            modules.forEach(module => {
                // Propriétés CSS pour forcer l'impression couleurs
                module.style.webkitPrintColorAdjust = 'exact';
                module.style.colorAdjust = 'exact';
                module.style.printColorAdjust = 'exact';
            });
            
            // Optimisation avant impression
            window.addEventListener('beforeprint', function() {
                // Impression détectée - force des couleurs
                
                // Force chaque couleur individuellement
                document.querySelectorAll('.module.ok').forEach(el => {
                    el.style.setProperty('background-color', '#22c55e', 'important');
                });
                document.querySelectorAll('.module.inequality').forEach(el => {
                    el.style.setProperty('background-color', '#eab308', 'important');
                });
                document.querySelectorAll('.module.microcracks').forEach(el => {
                    el.style.setProperty('background-color', '#f97316', 'important');
                });
                document.querySelectorAll('.module.dead').forEach(el => {
                    el.style.setProperty('background-color', '#ef4444', 'important');
                });
                document.querySelectorAll('.module.string_open').forEach(el => {
                    el.style.setProperty('background-color', '#3b82f6', 'important');
                });
                document.querySelectorAll('.module.not_connected').forEach(el => {
                    el.style.setProperty('background-color', '#6b7280', 'important');
                });
            });
        });
    </script>
    </html>
  `
}

export function getStatusLabel(status: string): string {
  const labels: { [key: string]: string } = {
    'ok': 'OK OK',
    'inequality': 'Inegalite Inégalité',
    'microcracks': 'Fissures Microfissures',
    'dead': 'HS Impact Cellulaire',
    'string_open': 'String String ouvert',
    'not_connected': 'Non-connecte Non raccordé'
  }
  return labels[status] || status
}
