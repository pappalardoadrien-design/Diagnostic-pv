/**
 * GIRASOLE MODULE - API Routes
 * 
 * Mission: 52 centrales PV (39 SOL + 13 DOUBLE)
 * Checklists: CONFORMITE (NF C 15-100) + TOITURE (DTU 40.35)
 * 
 * Endpoints:
 * - GET /stats - Statistiques centrales
 * - GET /projects - Liste centrales paginée
 * - GET /project/:id - Détails centrale
 * - POST /inspection/create - Créer inspection + items checklist
 * - GET /inspection/:token - Récupérer inspection
 * - PUT /inspection/:token/item/:itemCode - Mettre à jour item
 * - GET /inspection/:token/report - Générer rapport PDF
 * - POST /inspection/:token/photos - Upload photos
 * - GET /export/annexe2 - Export CSV ANNEXE 2
 */

import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
}

// =============================================================================
// REPORT DATA TYPES
// =============================================================================
interface ReportData {
  project: {
    id: number
    name: string
    id_referent: string
    site_address: string
    installation_power: number
  }
  inspection: {
    token: string
    checklist_type: string
    created_at: string
  }
  items: Array<{
    code: string
    category: string
    subcategory: string
    description: string
    normReference: string
    criticalityLevel: string
    checkMethod: string
    conformity: string
    observation: string
  }>
  stats: {
    total: number
    conformes: number
    non_conformes: number
    sans_objet: number
    non_verifies: number
    taux_conformite: number
  }
}

// =============================================================================
// INLINE REPORT GENERATOR - CONFORMITE
// =============================================================================
function generateReportConformiteInline(data: ReportData): string {
  const {project, inspection, items, stats} = data
  const date = new Date().toLocaleDateString('fr-FR', { 
    year: 'numeric', month: 'long', day: 'numeric' 
  })

  // Group items by category
  const categories = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, typeof items>)

  const categoryNames: Record<string, string> = {
    'PROTECTIONS': 'Protections Électriques',
    'MISE_A_TERRE': 'Mise à la Terre',
    'CABLAGE': 'Câblage et Cheminements',
    'EQUIPEMENTS': 'Équipements',
    'SIGNALISATION': 'Signalisation et Documentation'
  }

  const conformityLabels: Record<string, string> = {
    'conforme': 'Conforme',
    'non_conforme': 'Non Conforme',
    'sans_objet': 'Sans Objet',
    'non_verifie': 'Non Vérifié'
  }

  // Generate items HTML by category
  let itemsHtml = ''
  Object.keys(categoryNames).forEach(catKey => {
    const catItems = categories[catKey] || []
    if (catItems.length === 0) return

    itemsHtml += `
      <div class="category-section">
        <div class="category-header">${categoryNames[catKey]}</div>
        <table class="checklist-table">
          <thead>
            <tr>
              <th style="width: 10%;">Code</th>
              <th style="width: 45%;">Point de Contrôle</th>
              <th style="width: 12%;">Niveau</th>
              <th style="width: 18%;">Statut</th>
            </tr>
          </thead>
          <tbody>
    `

    catItems.forEach(item => {
      const statusClass = item.conformity || 'non_verifie'
      const hasObservation = item.observation && item.observation.trim() !== ''

      itemsHtml += `
        <tr>
          <td><div class="item-code">${item.code}</div></td>
          <td>
            <div class="item-description">${item.description}</div>
            <div class="item-norm">${item.normReference}</div>
            ${hasObservation ? `
              <div class="observation-box">
                <strong>⚠️ Observation :</strong>
                ${item.observation}
              </div>
            ` : ''}
          </td>
          <td>
            <span class="criticality-badge ${item.criticalityLevel}">
              ${item.criticalityLevel === 'critical' ? 'Critique' : 
                item.criticalityLevel === 'major' ? 'Majeur' : 
                item.criticalityLevel === 'minor' ? 'Mineur' : 'Info'}
            </span>
          </td>
          <td>
            <span class="conformity-status ${statusClass}">
              ${conformityLabels[statusClass] || 'Non Vérifié'}
            </span>
          </td>
        </tr>
      `
    })

    itemsHtml += `
          </tbody>
        </table>
      </div>
    `
  })

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Rapport Conformité GIRASOLE - ${project.name}</title>
    <style>
        @page { size: A4; margin: 15mm; }
        @media print { 
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', sans-serif; line-height: 1.6; color: #1f2937; background: white; }
        .container { max-width: 210mm; margin: 0 auto; padding: 20px; }
        .header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 20px; border-bottom: 3px solid #16a34a; margin-bottom: 30px; }
        .header-logo h1 { color: #16a34a; font-size: 28px; font-weight: 700; margin-bottom: 5px; }
        .header-logo p { color: #64748b; font-size: 12px; }
        .header-contact { text-align: right; font-size: 11px; color: #64748b; }
        .header-contact strong { color: #1f2937; display: block; margin-bottom: 2px; }
        .report-title { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 25px; border-radius: 8px; margin-bottom: 30px; text-align: center; }
        .report-title h2 { font-size: 24px; margin-bottom: 10px; }
        .report-title .subtitle { font-size: 16px; opacity: 0.95; font-weight: 500; }
        .info-box { background: #f8fafc; border-left: 4px solid #16a34a; padding: 20px; margin-bottom: 30px; border-radius: 4px; }
        .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
        .info-item label { display: block; font-weight: 600; color: #64748b; font-size: 11px; text-transform: uppercase; margin-bottom: 4px; }
        .info-item span { display: block; color: #1f2937; font-size: 14px; font-weight: 500; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
        .stat-card { background: white; border: 2px solid #e5e7eb; border-radius: 8px; padding: 15px; text-align: center; }
        .stat-card.conforme { border-color: #10b981; background: #f0fdf4; }
        .stat-card.non-conforme { border-color: #ef4444; background: #fef2f2; }
        .stat-card .stat-value { font-size: 32px; font-weight: 700; line-height: 1; margin-bottom: 5px; }
        .stat-card.conforme .stat-value { color: #16a34a; }
        .stat-card.non-conforme .stat-value { color: #dc2626; }
        .stat-card .stat-label { font-size: 12px; color: #64748b; font-weight: 500; }
        .category-section { margin-bottom: 35px; }
        .category-header { background: #1e293b; color: white; padding: 12px 20px; border-radius: 6px; margin-bottom: 15px; font-size: 16px; font-weight: 600; }
        .checklist-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
        .checklist-table thead { background: #f1f5f9; }
        .checklist-table th { text-align: left; padding: 10px; font-weight: 600; color: #475569; border-bottom: 2px solid #cbd5e1; }
        .checklist-table td { padding: 12px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
        .checklist-table tr:hover { background: #f8fafc; }
        .item-code { font-weight: 700; color: #1e293b; font-size: 11px; }
        .item-description { color: #334155; margin-bottom: 4px; font-size: 13px; }
        .item-norm { color: #64748b; font-size: 10px; font-style: italic; }
        .criticality-badge { display: inline-block; padding: 3px 8px; border-radius: 3px; font-size: 10px; font-weight: 600; text-transform: uppercase; }
        .criticality-badge.critical { background: #fee2e2; color: #991b1b; }
        .criticality-badge.major { background: #fed7aa; color: #9a3412; }
        .criticality-badge.minor { background: #fef3c7; color: #854d0e; }
        .conformity-status { display: inline-flex; align-items: center; padding: 6px 12px; border-radius: 20px; font-weight: 600; font-size: 11px; white-space: nowrap; }
        .conformity-status.conforme { background: #dcfce7; color: #166534; }
        .conformity-status.non_conforme { background: #fee2e2; color: #991b1b; }
        .conformity-status.sans_objet { background: #f1f5f9; color: #475569; }
        .conformity-status.non_verifie { background: #fef3c7; color: #854d0e; }
        .observation-box { background: #fef3c7; border-left: 3px solid #f59e0b; padding: 10px; margin-top: 8px; font-size: 11px; color: #78350f; border-radius: 3px; }
        .observation-box strong { display: block; margin-bottom: 4px; color: #92400e; }
        .footer { margin-top: 50px; padding-top: 30px; border-top: 2px solid #e5e7eb; }
        .signature-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 30px; margin-bottom: 30px; }
        .signature-box { text-align: center; }
        .signature-box .title { font-weight: 600; margin-bottom: 10px; color: #64748b; font-size: 12px; text-transform: uppercase; }
        .signature-box .name { font-weight: 700; color: #1f2937; font-size: 14px; margin-top: 40px; }
        .signature-box .function { color: #64748b; font-size: 12px; }
        .disclaimer { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 6px; font-size: 10px; color: #64748b; line-height: 1.5; }
        .print-button { position: fixed; top: 20px; right: 20px; background: #16a34a; color: white; border: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.1); z-index: 1000; }
        .print-button:hover { background: #15803d; }
    </style>
</head>
<body>
    <button class="print-button no-print" onclick="window.print()">📄 Imprimer / PDF</button>
    
    <div class="container">
        <div class="header">
            <div class="header-logo">
                <h1>🔋 DiagPV</h1>
                <p>Expertise Photovoltaïque Indépendante depuis 2012</p>
            </div>
            <div class="header-contact">
                <strong>Diagnostic Photovoltaïque</strong>
                3 rue d'Apollo, 31240 L'Union<br>
                Tél: 05.81.10.16.59<br>
                contact@diagpv.fr<br>
                RCS 792972309
            </div>
        </div>

        <div class="report-title">
            <h2>🔌 RAPPORT D'AUDIT DE CONFORMITÉ ÉLECTRIQUE</h2>
            <div class="subtitle">Installation Photovoltaïque - Norme NF C 15-100</div>
            <div class="ref">Réf: ${inspection.token} | ${date}</div>
        </div>

        <div class="info-box">
            <div class="info-grid">
                <div class="info-item">
                    <label>Centrale</label>
                    <span>${project.name}</span>
                </div>
                <div class="info-item">
                    <label>ID Référent</label>
                    <span>${project.id_referent}</span>
                </div>
                <div class="info-item">
                    <label>Adresse</label>
                    <span>${project.site_address}</span>
                </div>
                <div class="info-item">
                    <label>Puissance</label>
                    <span>${project.installation_power} kWc</span>
                </div>
            </div>
        </div>

        <div class="stats-grid">
            <div class="stat-card conforme">
                <div class="stat-value">${stats.conformes}</div>
                <div class="stat-label">Conformes</div>
            </div>
            <div class="stat-card non-conforme">
                <div class="stat-value">${stats.non_conformes}</div>
                <div class="stat-label">Non Conformes</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.sans_objet}</div>
                <div class="stat-label">Sans Objet</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" style="color: #16a34a;">${stats.taux_conformite}%</div>
                <div class="stat-label">Taux Conformité</div>
            </div>
        </div>

        ${itemsHtml}

        <div class="footer">
            <div class="signature-grid">
                <div class="signature-box">
                    <div class="title">Auditeur DiagPV</div>
                    <div style="height: 60px;"></div>
                    <div class="name">Fabien CORRERA</div>
                    <div class="function">Expert Photovoltaïque</div>
                </div>
                <div class="signature-box">
                    <div class="title">Client</div>
                    <div style="height: 60px;"></div>
                    <div class="name">_____________________</div>
                    <div class="function">Signature & Cachet</div>
                </div>
            </div>
            
            <div class="disclaimer">
                <strong>Disclaimer :</strong> Ce rapport présente l'état de l'installation photovoltaïque au moment de l'audit. 
                DiagPV SAS (RCS 792972309) est un organisme d'expertise indépendant. Les recommandations formulées 
                n'engagent pas la responsabilité de DiagPV quant aux décisions prises par le client ou ses partenaires.
            </div>
        </div>
    </div>
</body>
</html>
  `
}

// =============================================================================
// INLINE REPORT GENERATOR - TOITURE
// =============================================================================
function generateReportToitureInline(data: ReportData): string {
  const {project, inspection, items, stats} = data
  const date = new Date().toLocaleDateString('fr-FR', { 
    year: 'numeric', month: 'long', day: 'numeric' 
  })

  // Group items by category
  const categories = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, typeof items>)

  const categoryNames: Record<string, string> = {
    'ETANCHEITE': 'Étanchéité',
    'FIXATIONS': 'Fixations et Ancrages',
    'STRUCTURE': 'Structure et Charpente',
    'EVACUATION': 'Évacuation Eaux Pluviales',
    'SECURITE': 'Sécurité Accès Toiture'
  }

  const conformityLabels: Record<string, string> = {
    'conforme': 'Conforme',
    'non_conforme': 'Non Conforme',
    'sans_objet': 'Sans Objet',
    'non_verifie': 'Non Vérifié'
  }

  // Generate items HTML by category
  let itemsHtml = ''
  Object.keys(categoryNames).forEach(catKey => {
    const catItems = categories[catKey] || []
    if (catItems.length === 0) return

    itemsHtml += `
      <div class="category-section">
        <div class="category-header">${categoryNames[catKey]}</div>
        <table class="checklist-table">
          <thead>
            <tr>
              <th style="width: 10%;">Code</th>
              <th style="width: 45%;">Point de Contrôle</th>
              <th style="width: 12%;">Niveau</th>
              <th style="width: 18%;">Statut</th>
            </tr>
          </thead>
          <tbody>
    `

    catItems.forEach(item => {
      const statusClass = item.conformity || 'non_verifie'
      const hasObservation = item.observation && item.observation.trim() !== ''

      itemsHtml += `
        <tr>
          <td><div class="item-code">${item.code}</div></td>
          <td>
            <div class="item-description">${item.description}</div>
            <div class="item-norm">${item.normReference}</div>
            ${hasObservation ? `
              <div class="observation-box">
                <strong>⚠️ Observation :</strong>
                ${item.observation}
              </div>
            ` : ''}
          </td>
          <td>
            <span class="criticality-badge ${item.criticalityLevel}">
              ${item.criticalityLevel === 'critical' ? 'Critique' : 
                item.criticalityLevel === 'major' ? 'Majeur' : 
                item.criticalityLevel === 'minor' ? 'Mineur' : 'Info'}
            </span>
          </td>
          <td>
            <span class="conformity-status ${statusClass}">
              ${conformityLabels[statusClass] || 'Non Vérifié'}
            </span>
          </td>
        </tr>
      `
    })

    itemsHtml += `
          </tbody>
        </table>
      </div>
    `
  })

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Rapport Toiture GIRASOLE - ${project.name}</title>
    <style>
        @page { size: A4; margin: 15mm; }
        @media print { 
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', sans-serif; line-height: 1.6; color: #1f2937; background: white; }
        .container { max-width: 210mm; margin: 0 auto; padding: 20px; }
        .header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 20px; border-bottom: 3px solid #16a34a; margin-bottom: 30px; }
        .header-logo h1 { color: #16a34a; font-size: 28px; font-weight: 700; margin-bottom: 5px; }
        .header-logo p { color: #64748b; font-size: 12px; }
        .header-contact { text-align: right; font-size: 11px; color: #64748b; }
        .header-contact strong { color: #1f2937; display: block; margin-bottom: 2px; }
        .report-title { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 25px; border-radius: 8px; margin-bottom: 30px; text-align: center; }
        .report-title h2 { font-size: 24px; margin-bottom: 10px; }
        .report-title .subtitle { font-size: 16px; opacity: 0.95; font-weight: 500; }
        .info-box { background: #f8fafc; border-left: 4px solid #16a34a; padding: 20px; margin-bottom: 30px; border-radius: 4px; }
        .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
        .info-item label { display: block; font-weight: 600; color: #64748b; font-size: 11px; text-transform: uppercase; margin-bottom: 4px; }
        .info-item span { display: block; color: #1f2937; font-size: 14px; font-weight: 500; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
        .stat-card { background: white; border: 2px solid #e5e7eb; border-radius: 8px; padding: 15px; text-align: center; }
        .stat-card.conforme { border-color: #10b981; background: #f0fdf4; }
        .stat-card.non-conforme { border-color: #ef4444; background: #fef2f2; }
        .stat-card .stat-value { font-size: 32px; font-weight: 700; line-height: 1; margin-bottom: 5px; }
        .stat-card.conforme .stat-value { color: #16a34a; }
        .stat-card.non-conforme .stat-value { color: #dc2626; }
        .stat-card .stat-label { font-size: 12px; color: #64748b; font-weight: 500; }
        .category-section { margin-bottom: 35px; }
        .category-header { background: #1e293b; color: white; padding: 12px 20px; border-radius: 6px; margin-bottom: 15px; font-size: 16px; font-weight: 600; }
        .checklist-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
        .checklist-table thead { background: #f1f5f9; }
        .checklist-table th { text-align: left; padding: 10px; font-weight: 600; color: #475569; border-bottom: 2px solid #cbd5e1; }
        .checklist-table td { padding: 12px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
        .checklist-table tr:hover { background: #f8fafc; }
        .item-code { font-weight: 700; color: #1e293b; font-size: 11px; }
        .item-description { color: #334155; margin-bottom: 4px; font-size: 13px; }
        .item-norm { color: #64748b; font-size: 10px; font-style: italic; }
        .criticality-badge { display: inline-block; padding: 3px 8px; border-radius: 3px; font-size: 10px; font-weight: 600; text-transform: uppercase; }
        .criticality-badge.critical { background: #fee2e2; color: #991b1b; }
        .criticality-badge.major { background: #fed7aa; color: #9a3412; }
        .criticality-badge.minor { background: #fef3c7; color: #854d0e; }
        .conformity-status { display: inline-flex; align-items: center; padding: 6px 12px; border-radius: 20px; font-weight: 600; font-size: 11px; white-space: nowrap; }
        .conformity-status.conforme { background: #dcfce7; color: #166534; }
        .conformity-status.non_conforme { background: #fee2e2; color: #991b1b; }
        .conformity-status.sans_objet { background: #f1f5f9; color: #475569; }
        .conformity-status.non_verifie { background: #fef3c7; color: #854d0e; }
        .observation-box { background: #fef3c7; border-left: 3px solid #f59e0b; padding: 10px; margin-top: 8px; font-size: 11px; color: #78350f; border-radius: 3px; }
        .observation-box strong { display: block; margin-bottom: 4px; color: #92400e; }
        .footer { margin-top: 50px; padding-top: 30px; border-top: 2px solid #e5e7eb; }
        .signature-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 30px; margin-bottom: 30px; }
        .signature-box { text-align: center; }
        .signature-box .title { font-weight: 600; margin-bottom: 10px; color: #64748b; font-size: 12px; text-transform: uppercase; }
        .signature-box .name { font-weight: 700; color: #1f2937; font-size: 14px; margin-top: 40px; }
        .signature-box .function { color: #64748b; font-size: 12px; }
        .disclaimer { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 6px; font-size: 10px; color: #64748b; line-height: 1.5; }
        .print-button { position: fixed; top: 20px; right: 20px; background: #16a34a; color: white; border: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.1); z-index: 1000; }
        .print-button:hover { background: #15803d; }
    </style>
</head>
<body>
    <button class="print-button no-print" onclick="window.print()">📄 Imprimer / PDF</button>
    
    <div class="container">
        <div class="header">
            <div class="header-logo">
                <h1>🔋 DiagPV</h1>
                <p>Expertise Photovoltaïque Indépendante depuis 2012</p>
            </div>
            <div class="header-contact">
                <strong>Diagnostic Photovoltaïque</strong>
                3 rue d'Apollo, 31240 L'Union<br>
                Tél: 05.81.10.16.59<br>
                contact@diagpv.fr<br>
                RCS 792972309
            </div>
        </div>

        <div class="report-title">
            <h2>🏠 RAPPORT D'AUDIT DE CONFORMITÉ TOITURE</h2>
            <div class="subtitle">Installation Photovoltaïque - Norme DTU 40.35</div>
            <div class="ref">Réf: ${inspection.token} | ${date}</div>
        </div>

        <div class="info-box">
            <div class="info-grid">
                <div class="info-item">
                    <label>Centrale</label>
                    <span>${project.name}</span>
                </div>
                <div class="info-item">
                    <label>ID Référent</label>
                    <span>${project.id_referent}</span>
                </div>
                <div class="info-item">
                    <label>Adresse</label>
                    <span>${project.site_address}</span>
                </div>
                <div class="info-item">
                    <label>Puissance</label>
                    <span>${project.installation_power} kWc</span>
                </div>
            </div>
        </div>

        <div class="stats-grid">
            <div class="stat-card conforme">
                <div class="stat-value">${stats.conformes}</div>
                <div class="stat-label">Conformes</div>
            </div>
            <div class="stat-card non-conforme">
                <div class="stat-value">${stats.non_conformes}</div>
                <div class="stat-label">Non Conformes</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.sans_objet}</div>
                <div class="stat-label">Sans Objet</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" style="color: #16a34a;">${stats.taux_conformite}%</div>
                <div class="stat-label">Taux Conformité</div>
            </div>
        </div>

        ${itemsHtml}

        <div class="footer">
            <div class="signature-grid">
                <div class="signature-box">
                    <div class="title">Auditeur DiagPV</div>
                    <div style="height: 60px;"></div>
                    <div class="name">Fabien CORRERA</div>
                    <div class="function">Expert Photovoltaïque</div>
                </div>
                <div class="signature-box">
                    <div class="title">Client</div>
                    <div style="height: 60px;"></div>
                    <div class="name">_____________________</div>
                    <div class="function">Signature & Cachet</div>
                </div>
            </div>
            
            <div class="disclaimer">
                <strong>Disclaimer :</strong> Ce rapport présente l'état de l'installation photovoltaïque au moment de l'audit. 
                DiagPV SAS (RCS 792972309) est un organisme d'expertise indépendant. Les recommandations formulées 
                n'engagent pas la responsabilité de DiagPV quant aux décisions prises par le client ou ses partenaires.
            </div>
        </div>
    </div>
</body>
</html>
  `
}

const girasoleRoutes = new Hono<{ Bindings: Bindings }>()

console.log('🚀 GIRASOLE MODULE ROUTES LOADED - INLINE GENERATORS')
console.log('🔥 /inspection/:token/report endpoint REGISTERED')

// =============================================================================
// 1. STATISTIQUES DASHBOARD
// =============================================================================
girasoleRoutes.get('/stats', async (c) => {
  const { DB } = c.env

  try {
    // Count total, SOL, DOUBLE, completed, pending
    const stats = await DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN audit_types LIKE '%TOITURE%' THEN 1 ELSE 0 END) as double,
        SUM(CASE WHEN audit_types NOT LIKE '%TOITURE%' THEN 1 ELSE 0 END) as sol,
        0 as completed,
        COUNT(*) as pending
      FROM projects 
      WHERE is_girasole = 1
    `).first()

    return c.json(stats || { total: 0, sol: 0, double: 0, completed: 0, pending: 0 })
  } catch (error) {
    console.error('Error fetching GIRASOLE stats:', error)
    return c.json({ error: 'Failed to fetch stats' }, 500)
  }
})

// =============================================================================
// 2. LISTE DES CENTRALES (PAGINÉE)
// =============================================================================
girasoleRoutes.get('/projects', async (c) => {
  const { DB } = c.env
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '52')
  const filter = c.req.query('filter') || 'all' // all, sol, double
  const search = c.req.query('search') || ''

  try {
    let whereClause = 'WHERE is_girasole = 1'
    
    if (filter === 'sol') {
      whereClause += ` AND audit_types NOT LIKE '%TOITURE%'`
    } else if (filter === 'double') {
      whereClause += ` AND audit_types LIKE '%TOITURE%'`
    }

    if (search) {
      whereClause += ` AND (name LIKE ? OR site_address LIKE ? OR id_referent LIKE ?)`
    }

    const offset = (page - 1) * limit

    const query = search 
      ? DB.prepare(`
          SELECT * FROM projects 
          ${whereClause}
          ORDER BY id_referent ASC
          LIMIT ? OFFSET ?
        `).bind(`%${search}%`, `%${search}%`, `%${search}%`, limit, offset)
      : DB.prepare(`
          SELECT * FROM projects 
          ${whereClause}
          ORDER BY id_referent ASC
          LIMIT ? OFFSET ?
        `).bind(limit, offset)

    const { results } = await query.all()

    return c.json({ 
      projects: results,
      page,
      limit,
      total: results?.length || 0
    })
  } catch (error) {
    console.error('Error fetching GIRASOLE projects:', error)
    return c.json({ error: 'Failed to fetch projects' }, 500)
  }
})

// =============================================================================
// 3. DÉTAILS D'UNE CENTRALE
// =============================================================================
girasoleRoutes.get('/project/:id', async (c) => {
  const { DB } = c.env
  const projectId = parseInt(c.req.param('id'))

  try {
    const project = await DB.prepare(`
      SELECT * FROM projects 
      WHERE id = ? AND is_girasole = 1
    `).bind(projectId).first()

    if (!project) {
      return c.json({ error: 'Project not found' }, 404)
    }

    return c.json({ project })
  } catch (error) {
    console.error('Error fetching project:', error)
    return c.json({ error: 'Failed to fetch project' }, 500)
  }
})

// =============================================================================
// 4. CRÉER INSPECTION + GÉNÉRER CHECKLIST ITEMS
// =============================================================================
girasoleRoutes.post('/inspection/create', async (c) => {
  const { DB } = c.env
  const { project_id, checklist_type } = await c.req.json()

  if (!project_id || !checklist_type) {
    return c.json({ error: 'project_id and checklist_type required' }, 400)
  }

  if (!['CONFORMITE', 'TOITURE'].includes(checklist_type)) {
    return c.json({ error: 'checklist_type must be CONFORMITE or TOITURE' }, 400)
  }

  try {
    // Check if inspection already exists
    const existing = await DB.prepare(`
      SELECT audit_token, COUNT(*) as items_count
      FROM visual_inspections
      WHERE project_id = ? AND checklist_type = ?
      GROUP BY audit_token
      LIMIT 1
    `).bind(project_id, checklist_type).first()

    if (existing) {
      return c.json({
        inspection: {
          token: existing.audit_token,
          exists: true,
          items_count: existing.items_count
        }
      })
    }

    // Generate new token
    const token = `GIRASOLE-${checklist_type}-${project_id}-${Date.now()}`

    // Generate checklist items based on type
    const items = checklist_type === 'CONFORMITE' 
      ? CHECKLIST_CONFORMITE_ITEMS
      : CHECKLIST_TOITURE_ITEMS

    // Insert all items
    const insertPromises = items.map((item, index) => {
      return DB.prepare(`
        INSERT INTO visual_inspections (
          project_id, checklist_type, audit_token,
          inspection_type, notes, item_order, audit_category, checklist_section
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        project_id,
        checklist_type,
        token,
        item.code,
        JSON.stringify({
          description: item.description,
          category: item.category,
          subcategory: item.subcategory,
          normReference: item.normReference,
          criticalityLevel: item.criticalityLevel,
          checkMethod: item.checkMethod
        }),
        index,
        item.category,
        item.subcategory
      ).run()
    })

    await Promise.all(insertPromises)

    return c.json({
      inspection: {
        token,
        items_count: items.length,
        checklist_type
      }
    })
  } catch (error) {
    console.error('Error creating inspection:', error)
    return c.json({ error: 'Failed to create inspection' }, 500)
  }
})

// =============================================================================
// 5. RÉCUPÉRER INSPECTION
// =============================================================================
girasoleRoutes.get('/inspection/:token', async (c) => {
  const { DB } = c.env
  const token = c.req.param('token')

  try {
    const { results } = await DB.prepare(`
      SELECT * FROM visual_inspections
      WHERE audit_token = ?
      ORDER BY item_order ASC
    `).bind(token).all()

    if (!results || results.length === 0) {
      return c.json({ error: 'Inspection not found' }, 404)
    }

    return c.json({ 
      inspection: {
        token,
        checklist_type: results[0].checklist_type,
        project_id: results[0].project_id,
        items: results.map(item => ({
          id: item.id,
          code: item.inspection_type,
          conformity: item.conformite,
          observation: item.notes ? JSON.parse(item.notes) : null,
          metadata: item.notes ? JSON.parse(item.notes) : {}
        }))
      }
    })
  } catch (error) {
    console.error('Error fetching inspection:', error)
    return c.json({ error: 'Failed to fetch inspection' }, 500)
  }
})

// =============================================================================
// 6. METTRE À JOUR UN ITEM DE CHECKLIST
// =============================================================================
girasoleRoutes.put('/inspection/:token/item/:itemCode', async (c) => {
  const { DB } = c.env
  const token = c.req.param('token')
  const itemCode = c.req.param('itemCode')
  const { conformity, observation } = await c.req.json()

  if (!['conforme', 'non_conforme', 'sans_objet', 'non_verifie'].includes(conformity)) {
    return c.json({ error: 'Invalid conformity value' }, 400)
  }

  try {
    await DB.prepare(`
      UPDATE visual_inspections
      SET conformite = ?, notes = ?
      WHERE audit_token = ? AND inspection_type = ?
    `).bind(conformity, observation || '', token, itemCode).run()

    return c.json({ success: true })
  } catch (error) {
    console.error('Error updating item:', error)
    return c.json({ error: 'Failed to update item' }, 500)
  }
})

// =============================================================================
// 7. GÉNÉRER RAPPORT PDF
// =============================================================================
girasoleRoutes.get('/inspection/:token/report', async (c) => {
  console.log('🔥🔥🔥 GIRASOLE REPORT ENDPOINT CALLED 🔥🔥🔥')
  const { DB } = c.env
  const token = c.req.param('token')
  console.log('Token:', token)

  try {
    // Get inspection with items
    const { results: items } = await DB.prepare(`
      SELECT * FROM visual_inspections
      WHERE audit_token = ?
      ORDER BY item_order ASC
    `).bind(token).all()

    if (!items || items.length === 0) {
      return c.html('<h1>Inspection non trouvée</h1>', 404)
    }

    const checklistType = items[0].checklist_type
    const projectId = items[0].project_id

    // Get project details
    const project = await DB.prepare(`
      SELECT * FROM projects WHERE id = ?
    `).bind(projectId).first()

    if (!project) {
      return c.html('<h1>Projet non trouvé</h1>', 404)
    }

    // Parse items with metadata
    const parsedItems = items.map((item: any) => {
      let metadata = {}
      try {
        metadata = item.notes ? JSON.parse(item.notes) : {}
      } catch (e) {
        console.error('Failed to parse notes:', e)
      }

      return {
        code: item.inspection_type,
        category: item.audit_category || metadata.category || '',
        subcategory: item.checklist_section || metadata.subcategory || '',
        description: metadata.description || '',
        normReference: metadata.normReference || '',
        criticalityLevel: metadata.criticalityLevel || 'minor',
        checkMethod: metadata.checkMethod || '',
        conformity: item.conformite || 'non_verifie',
        observation: metadata.observation || ''
      }
    })

    // Calculate stats
    const stats = {
      total: items.length,
      conformes: items.filter((i: any) => i.conformite === 'conforme').length,
      non_conformes: items.filter((i: any) => i.conformite === 'non_conforme').length,
      sans_objet: items.filter((i: any) => i.conformite === 'sans_objet').length,
      non_verifies: items.filter((i: any) => !i.conformite || i.conformite === 'non_verifie').length,
      taux_conformite: 0
    }

    const total = stats.conformes + stats.non_conformes
    stats.taux_conformite = total > 0 ? Math.round((stats.conformes / total) * 100) : 0

    // Generate report based on checklist type
    if (checklistType === 'CONFORMITE') {
      console.log('✅ GENERATING CONFORMITE REPORT - INLINE VERSION')
      const html = generateReportConformiteInline({
        project: {
          id: project.id,
          name: project.name,
          id_referent: project.id_referent || '',
          site_address: project.site_address || '',
          installation_power: project.installation_power || 0
        },
        inspection: {
          token,
          checklist_type: checklistType,
          created_at: items[0].created_at
        },
        items: parsedItems,
        stats
      })
      return c.html(html)
    } else if (checklistType === 'TOITURE') {
      console.log('✅ GENERATING TOITURE REPORT - INLINE VERSION')
      const html = generateReportToitureInline({
        project: {
          id: project.id,
          name: project.name,
          id_referent: project.id_referent || '',
          site_address: project.site_address || '',
          installation_power: project.installation_power || 0
        },
        inspection: {
          token,
          checklist_type: checklistType,
          created_at: items[0].created_at
        },
        items: parsedItems,
        stats
      })
      return c.html(html)
    } else {
      return c.html('<h1>Type de checklist non supporté</h1>', 400)
    }
  } catch (error) {
    console.error('Error generating report:', error)
    return c.html(`<h1>Erreur génération rapport</h1><p>${error}</p>`, 500)
  }
})

// =============================================================================
// 7B. GÉNÉRER RAPPORT PDF - TEST ROUTE
// =============================================================================
girasoleRoutes.get('/report-test/:token', async (c) => {
  return c.html(`
    <html>
      <body>
        <h1 style="color: red;">TEST ROUTE WORKS!</h1>
        <p>Token: ${c.req.param('token')}</p>
      </body>
    </html>
  `)
})

// =============================================================================
// 8. EXPORT ANNEXE 2 CSV
// =============================================================================
girasoleRoutes.get('/export/annexe2', async (c) => {
  const { DB } = c.env

  try {
    // Fetch all GIRASOLE projects
    const { results: projects } = await DB.prepare(`
      SELECT 
        id, name, id_referent, site_address,
        installation_power, audit_types
      FROM projects
      WHERE is_girasole = 1
      ORDER BY id_referent ASC
    `).all()

    if (!projects || projects.length === 0) {
      return c.json({ error: 'No GIRASOLE projects found' }, 404)
    }

    // For each project, get inspection stats
    const projectsWithStats = await Promise.all(
      projects.map(async (p) => {
        const { results: inspections } = await DB.prepare(`
          SELECT 
            audit_token,
            conformite
          FROM visual_inspections
          WHERE project_id = ?
        `).bind(p.id).all()

        const tokens = new Set((inspections || []).map((i: any) => i.audit_token).filter(Boolean))
        const conformes = (inspections || []).filter((i: any) => i.conformite === 'conforme').length
        const non_conformes = (inspections || []).filter((i: any) => i.conformite === 'non_conforme').length

        return {
          ...p,
          inspections_count: tokens.size,
          conformes,
          non_conformes
        }
      })
    )

    // Generate CSV
    const headers = [
      'ID Référent',
      'Nom Centrale',
      'Adresse',
      'Puissance (kWc)',
      'Type Audit',
      'Statut',
      'Inspections',
      'Conformes',
      'Non Conformes',
      'Taux Conformité (%)',
      'Date Dernière Visite',
      'Commentaires',
      'URL Rapport'
    ]

    const rows = projectsWithStats.map(p => {
      const auditTypes = JSON.parse(p.audit_types || '[]')
      const totalItems = p.conformes + p.non_conformes
      const tauxConformite = totalItems > 0 ? ((p.conformes / totalItems) * 100).toFixed(1) : '0'
      const statut = p.inspections_count > 0 ? 'En cours' : 'À planifier'

      return [
        p.id_referent || '',
        p.name || '',
        p.site_address || '',
        p.installation_power || '',
        auditTypes.join(' + '),
        statut,
        p.inspections_count || 0,
        p.conformes || 0,
        p.non_conformes || 0,
        tauxConformite,
        '', // Date dernière visite
        '', // Commentaires
        '' // URL rapport
      ].map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    }) || []

    const csv = [headers.join(','), ...rows].join('\n')

    return c.text(csv, 200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="ANNEXE_2_GIRASOLE_52_centrales.csv"'
    })
  } catch (error) {
    console.error('Error exporting ANNEXE 2:', error)
    return c.json({ error: 'Failed to export ANNEXE 2' }, 500)
  }
})

// =============================================================================
// CHECKLIST ITEMS DEFINITIONS
// =============================================================================

interface ChecklistItem {
  code: string
  category: string
  subcategory: string
  description: string
  normReference: string
  criticalityLevel: 'critical' | 'major' | 'minor' | 'info'
  checkMethod: string
}

const CHECKLIST_CONFORMITE_ITEMS: ChecklistItem[] = [
  // PROTECTIONS (5 items)
  {
    code: 'CONF-01',
    category: 'PROTECTIONS',
    subcategory: 'Protection différentielle',
    description: 'Vérifier présence et fonctionnement du dispositif différentiel 30mA',
    normReference: 'NF C 15-100 Section 531.2',
    criticalityLevel: 'critical',
    checkMethod: 'Test du bouton test + mesure déclenchement'
  },
  {
    code: 'CONF-02',
    category: 'PROTECTIONS',
    subcategory: 'Protection surintensité',
    description: 'Vérifier calibre et type des disjoncteurs/fusibles',
    normReference: 'NF C 15-100 Section 533',
    criticalityLevel: 'critical',
    checkMethod: 'Contrôle visuel + vérification schéma unifilaire'
  },
  {
    code: 'CONF-03',
    category: 'PROTECTIONS',
    subcategory: 'Sectionneur DC',
    description: 'Présence et accessibilité du sectionneur côté DC',
    normReference: 'NF C 15-100 Section 712.537.2.1.6',
    criticalityLevel: 'major',
    checkMethod: 'Contrôle visuel + manoeuvre'
  },
  {
    code: 'CONF-04',
    category: 'PROTECTIONS',
    subcategory: 'Protection foudre',
    description: 'Présence parafoudre DC et AC (si requis)',
    normReference: 'NF C 15-100 Section 443',
    criticalityLevel: 'major',
    checkMethod: 'Contrôle visuel + état voyants'
  },
  {
    code: 'CONF-05',
    category: 'PROTECTIONS',
    subcategory: 'Dispositif coupure urgence',
    description: 'Accessibilité et signalisation du dispositif de coupure d\'urgence',
    normReference: 'NF C 15-100 Section 712.537.2.1.6',
    criticalityLevel: 'critical',
    checkMethod: 'Contrôle visuel + accessibilité'
  },

  // MISE À LA TERRE (3 items)
  {
    code: 'CONF-06',
    category: 'MISE_A_TERRE',
    subcategory: 'Liaison équipotentielle',
    description: 'Vérifier continuité liaison équipotentielle structures métalliques',
    normReference: 'NF C 15-100 Section 712.411.3.1.2',
    criticalityLevel: 'critical',
    checkMethod: 'Mesure continuité électrique < 0.1 Ω'
  },
  {
    code: 'CONF-07',
    category: 'MISE_A_TERRE',
    subcategory: 'Prise de terre',
    description: 'Mesure résistance de terre',
    normReference: 'NF C 15-100 Section 542.2',
    criticalityLevel: 'critical',
    checkMethod: 'Mesure tellurique (< 100 Ω recommandé)'
  },
  {
    code: 'CONF-08',
    category: 'MISE_A_TERRE',
    subcategory: 'Conducteurs de protection',
    description: 'Section et couleur des conducteurs de protection (PE)',
    normReference: 'NF C 15-100 Section 543',
    criticalityLevel: 'major',
    checkMethod: 'Contrôle visuel + mesure section'
  },

  // CÂBLAGE (5 items)
  {
    code: 'CONF-09',
    category: 'CABLAGE',
    subcategory: 'Câbles DC',
    description: 'Type, section et protection des câbles DC',
    normReference: 'NF C 15-100 Section 521',
    criticalityLevel: 'major',
    checkMethod: 'Contrôle visuel + vérification marquage'
  },
  {
    code: 'CONF-10',
    category: 'CABLAGE',
    subcategory: 'Câbles AC',
    description: 'Type, section et protection des câbles AC',
    normReference: 'NF C 15-100 Section 521',
    criticalityLevel: 'major',
    checkMethod: 'Contrôle visuel + vérification schéma'
  },
  {
    code: 'CONF-11',
    category: 'CABLAGE',
    subcategory: 'Cheminement câbles',
    description: 'Protection mécanique et séparation DC/AC',
    normReference: 'NF C 15-100 Section 528',
    criticalityLevel: 'major',
    checkMethod: 'Contrôle visuel parcours complet'
  },
  {
    code: 'CONF-12',
    category: 'CABLAGE',
    subcategory: 'Connecteurs',
    description: 'Conformité et serrage connecteurs MC4/H4',
    normReference: 'IEC 62852',
    criticalityLevel: 'major',
    checkMethod: 'Contrôle visuel + test traction'
  },
  {
    code: 'CONF-13',
    category: 'CABLAGE',
    subcategory: 'Étanchéité',
    description: 'Étanchéité traversées de paroi et presse-étoupes',
    normReference: 'NF C 15-100 Section 522',
    criticalityLevel: 'minor',
    checkMethod: 'Contrôle visuel + test manuel'
  },

  // ÉQUIPEMENTS (4 items)
  {
    code: 'CONF-14',
    category: 'EQUIPEMENTS',
    subcategory: 'Onduleur',
    description: 'Installation et ventilation onduleur',
    normReference: 'Notice fabricant',
    criticalityLevel: 'major',
    checkMethod: 'Contrôle visuel + espaces dégagement'
  },
  {
    code: 'CONF-15',
    category: 'EQUIPEMENTS',
    subcategory: 'Coffrets électriques',
    description: 'Conformité et indice de protection coffrets (IP)',
    normReference: 'NF C 15-100 Section 512.2',
    criticalityLevel: 'major',
    checkMethod: 'Vérification marquage + état général'
  },
  {
    code: 'CONF-16',
    category: 'EQUIPEMENTS',
    subcategory: 'Compteur production',
    description: 'Installation et raccordement compteur',
    normReference: 'C13-200 Enedis',
    criticalityLevel: 'minor',
    checkMethod: 'Contrôle visuel + fonctionnement'
  },
  {
    code: 'CONF-17',
    category: 'EQUIPEMENTS',
    subcategory: 'Boîtes de jonction',
    description: 'Étanchéité et serrage boîtes de jonction strings',
    normReference: 'IEC 60529',
    criticalityLevel: 'major',
    checkMethod: 'Contrôle visuel + IP65 minimum'
  },

  // SIGNALISATION (3 items)
  {
    code: 'CONF-18',
    category: 'SIGNALISATION',
    subcategory: 'Étiquetage',
    description: 'Présence étiquettes réglementaires (DC, tension, consignes)',
    normReference: 'UTE C 15-712-1 Section 10.3',
    criticalityLevel: 'minor',
    checkMethod: 'Contrôle visuel exhaustif'
  },
  {
    code: 'CONF-19',
    category: 'SIGNALISATION',
    subcategory: 'Schémas',
    description: 'Disponibilité schéma unifilaire et plan implantation',
    normReference: 'NF C 15-100 Section 514.5',
    criticalityLevel: 'minor',
    checkMethod: 'Vérification présence documents'
  },
  {
    code: 'CONF-20',
    category: 'SIGNALISATION',
    subcategory: 'Consignes sécurité',
    description: 'Affichage consignes exploitation et intervention',
    normReference: 'UTE C 15-712-1',
    criticalityLevel: 'minor',
    checkMethod: 'Contrôle visuel + lisibilité'
  }
]

const CHECKLIST_TOITURE_ITEMS: ChecklistItem[] = [
  // ÉTANCHÉITÉ (4 items)
  {
    code: 'TOIT-01',
    category: 'ETANCHEITE',
    subcategory: 'Membrane',
    description: 'État général de la membrane d\'étanchéité',
    normReference: 'DTU 40.35 Section 5.1',
    criticalityLevel: 'critical',
    checkMethod: 'Inspection visuelle complète'
  },
  {
    code: 'TOIT-02',
    category: 'ETANCHEITE',
    subcategory: 'Traversées',
    description: 'Étanchéité traversées de toiture (câbles, fixations)',
    normReference: 'DTU 40.35 Section 5.3',
    criticalityLevel: 'critical',
    checkMethod: 'Contrôle visuel + test manuel'
  },
  {
    code: 'TOIT-03',
    category: 'ETANCHEITE',
    subcategory: 'Relevés',
    description: 'Conformité hauteur et état des relevés d\'étanchéité',
    normReference: 'DTU 40.35 Section 5.2',
    criticalityLevel: 'major',
    checkMethod: 'Mesure hauteur (≥15cm) + contrôle visuel'
  },
  {
    code: 'TOIT-04',
    category: 'ETANCHEITE',
    subcategory: 'Joints',
    description: 'État joints et soudures membrane',
    normReference: 'DTU 40.35 Section 6',
    criticalityLevel: 'critical',
    checkMethod: 'Contrôle visuel + test traction légère'
  },

  // FIXATIONS (3 items)
  {
    code: 'TOIT-05',
    category: 'FIXATIONS',
    subcategory: 'Système fixation',
    description: 'Conformité système de fixation (lest ou ancré)',
    normReference: 'DTU 40.35 Section 7',
    criticalityLevel: 'critical',
    checkMethod: 'Vérification calcul charges + Avis Technique'
  },
  {
    code: 'TOIT-06',
    category: 'FIXATIONS',
    subcategory: 'Ancrages',
    description: 'État et serrage des ancrages en toiture',
    normReference: 'DTU 43.1',
    criticalityLevel: 'major',
    checkMethod: 'Test serrage + contrôle visuel corrosion'
  },
  {
    code: 'TOIT-07',
    category: 'FIXATIONS',
    subcategory: 'Protection anticorrosion',
    description: 'Protection anticorrosion fixations métalliques',
    normReference: 'NF EN 1090',
    criticalityLevel: 'major',
    checkMethod: 'Contrôle visuel (galvanisation, peinture)'
  },

  // STRUCTURE (3 items)
  {
    code: 'TOIT-08',
    category: 'STRUCTURE',
    subcategory: 'Charpente',
    description: 'Absence de déformation/fléchissement charpente',
    normReference: 'DTU 31.2 ou 32.1',
    criticalityLevel: 'critical',
    checkMethod: 'Contrôle visuel + mesure nivellement si doute'
  },
  {
    code: 'TOIT-09',
    category: 'STRUCTURE',
    subcategory: 'Surcharges',
    description: 'Respect charges admissibles toiture',
    normReference: 'Eurocode 1 - NF EN 1991',
    criticalityLevel: 'critical',
    checkMethod: 'Vérification note de calcul structure'
  },
  {
    code: 'TOIT-10',
    category: 'STRUCTURE',
    subcategory: 'Espacement supports',
    description: 'Respect espacement règlementaire entre supports',
    normReference: 'Avis Technique système',
    criticalityLevel: 'major',
    checkMethod: 'Mesure entraxes + comparaison AT'
  },

  // ÉVACUATION (3 items)
  {
    code: 'TOIT-11',
    category: 'EVACUATION',
    subcategory: 'Pente toiture',
    description: 'Pente suffisante pour évacuation eaux pluviales',
    normReference: 'DTU 40.35 Section 4',
    criticalityLevel: 'major',
    checkMethod: 'Mesure pente (≥3% recommandé)'
  },
  {
    code: 'TOIT-12',
    category: 'EVACUATION',
    subcategory: 'Évacuations EP',
    description: 'État et accessibilité évacuations eaux pluviales',
    normReference: 'DTU 60.11',
    criticalityLevel: 'major',
    checkMethod: 'Contrôle visuel + test écoulement'
  },
  {
    code: 'TOIT-13',
    category: 'EVACUATION',
    subcategory: 'Stagnation eau',
    description: 'Absence de zones de stagnation d\'eau',
    normReference: 'DTU 40.35',
    criticalityLevel: 'major',
    checkMethod: 'Contrôle visuel après pluie'
  },

  // SÉCURITÉ (2 items)
  {
    code: 'TOIT-14',
    category: 'SECURITE',
    subcategory: 'Accès toiture',
    description: 'Sécurisation accès toiture (garde-corps, échelles)',
    normReference: 'Code du Travail R4224-1',
    criticalityLevel: 'critical',
    checkMethod: 'Contrôle visuel + conformité équipements'
  },
  {
    code: 'TOIT-15',
    category: 'SECURITE',
    subcategory: 'Lignes de vie',
    description: 'Présence et état lignes de vie / points d\'ancrage EPI',
    normReference: 'NF EN 795',
    criticalityLevel: 'critical',
    checkMethod: 'Contrôle visuel + vérification certificats'
  }
]

export default girasoleRoutes
