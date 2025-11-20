/**
 * GIRASOLE - Générateur Rapport PDF TOITURE
 * Norme: DTU 40.35 (Couverture par éléments métalliques en feuilles et longues feuilles en zinc)
 * Format: HTML print-friendly pour conversion PDF
 */

interface ReportDataToiture {
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

export function generateReportToiture(data: ReportDataToiture): string {
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
    'STRUCTURE': 'Structure Porteuse',
    'EVACUATION': 'Évacuation des Eaux Pluviales',
    'SECURITE': 'Sécurité d\'Accès et Lignes de Vie'
  }

  const conformityLabels: Record<string, string> = {
    'conforme': 'Conforme',
    'non_conforme': 'Non Conforme',
    'sans_objet': 'Sans Objet',
    'non_verifie': 'Non Vérifié'
  }

  const conformityColors: Record<string, string> = {
    'conforme': '#10b981',
    'non_conforme': '#ef4444',
    'sans_objet': '#94a3b8',
    'non_verifie': '#f59e0b'
  }

  const criticalityLabels: Record<string, string> = {
    'critical': 'Critique',
    'major': 'Majeur',
    'minor': 'Mineur',
    'info': 'Information'
  }

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport Conformité Toiture - ${project.name}</title>
    <style>
        @page {
            size: A4;
            margin: 15mm;
        }
        
        @media print {
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            .no-print {
                display: none !important;
            }
            .page-break {
                page-break-before: always;
            }
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background: white;
        }

        .container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 20px;
        }

        /* Header DiagPV */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 20px;
            border-bottom: 3px solid #16a34a;
            margin-bottom: 30px;
        }

        .header-logo {
            flex: 1;
        }

        .header-logo h1 {
            color: #16a34a;
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 5px;
        }

        .header-logo p {
            color: #64748b;
            font-size: 12px;
        }

        .header-contact {
            text-align: right;
            font-size: 11px;
            color: #64748b;
        }

        .header-contact strong {
            color: #1f2937;
            display: block;
            margin-bottom: 2px;
        }

        /* Title Section */
        .report-title {
            background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
            color: white;
            padding: 25px;
            border-radius: 8px;
            margin-bottom: 30px;
            text-align: center;
        }

        .report-title h2 {
            font-size: 24px;
            margin-bottom: 10px;
        }

        .report-title .subtitle {
            font-size: 16px;
            opacity: 0.95;
            font-weight: 500;
        }

        .report-title .ref {
            font-size: 13px;
            opacity: 0.85;
            margin-top: 8px;
        }

        /* Project Info Box */
        .info-box {
            background: #f8fafc;
            border-left: 4px solid #16a34a;
            padding: 20px;
            margin-bottom: 30px;
            border-radius: 4px;
        }

        .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
        }

        .info-item label {
            display: block;
            font-weight: 600;
            color: #64748b;
            font-size: 11px;
            text-transform: uppercase;
            margin-bottom: 4px;
        }

        .info-item span {
            display: block;
            color: #1f2937;
            font-size: 14px;
            font-weight: 500;
        }

        /* Stats Cards */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 30px;
        }

        .stat-card {
            background: white;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
        }

        .stat-card.conforme {
            border-color: #10b981;
            background: #f0fdf4;
        }

        .stat-card.non-conforme {
            border-color: #ef4444;
            background: #fef2f2;
        }

        .stat-card .stat-value {
            font-size: 32px;
            font-weight: 700;
            line-height: 1;
            margin-bottom: 5px;
        }

        .stat-card.conforme .stat-value {
            color: #16a34a;
        }

        .stat-card.non-conforme .stat-value {
            color: #dc2626;
        }

        .stat-card .stat-label {
            font-size: 12px;
            color: #64748b;
            font-weight: 500;
        }

        /* Category Sections */
        .category-section {
            margin-bottom: 35px;
        }

        .category-header {
            background: #1e293b;
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            margin-bottom: 15px;
            font-size: 16px;
            font-weight: 600;
        }

        /* Checklist Table */
        .checklist-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 12px;
        }

        .checklist-table thead {
            background: #f1f5f9;
        }

        .checklist-table th {
            text-align: left;
            padding: 10px;
            font-weight: 600;
            color: #475569;
            border-bottom: 2px solid #cbd5e1;
        }

        .checklist-table td {
            padding: 12px 10px;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: top;
        }

        .checklist-table tr:hover {
            background: #f8fafc;
        }

        .item-code {
            font-weight: 700;
            color: #1e293b;
            font-size: 11px;
        }

        .item-description {
            color: #334155;
            margin-bottom: 4px;
            font-size: 13px;
        }

        .item-norm {
            color: #64748b;
            font-size: 10px;
            font-style: italic;
        }

        .criticality-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 3px;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
        }

        .criticality-badge.critical {
            background: #fee2e2;
            color: #991b1b;
        }

        .criticality-badge.major {
            background: #fed7aa;
            color: #9a3412;
        }

        .criticality-badge.minor {
            background: #fef3c7;
            color: #854d0e;
        }

        .conformity-status {
            display: inline-flex;
            align-items: center;
            padding: 6px 12px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 11px;
            white-space: nowrap;
        }

        .conformity-status.conforme {
            background: #dcfce7;
            color: #166534;
        }

        .conformity-status.non_conforme {
            background: #fee2e2;
            color: #991b1b;
        }

        .conformity-status.sans_objet {
            background: #f1f5f9;
            color: #475569;
        }

        .conformity-status.non_verifie {
            background: #fef3c7;
            color: #854d0e;
        }

        .observation-box {
            background: #fef3c7;
            border-left: 3px solid #f59e0b;
            padding: 10px;
            margin-top: 8px;
            font-size: 11px;
            color: #78350f;
            border-radius: 3px;
        }

        .observation-box strong {
            display: block;
            margin-bottom: 4px;
            color: #92400e;
        }

        /* Footer / Signature */
        .footer {
            margin-top: 50px;
            padding-top: 30px;
            border-top: 2px solid #e5e7eb;
        }

        .signature-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 30px;
            margin-bottom: 30px;
        }

        .signature-box {
            text-align: center;
        }

        .signature-box .title {
            font-weight: 600;
            margin-bottom: 10px;
            color: #64748b;
            font-size: 12px;
            text-transform: uppercase;
        }

        .signature-box .name {
            font-weight: 700;
            color: #1f2937;
            font-size: 14px;
            margin-top: 40px;
        }

        .signature-box .function {
            color: #64748b;
            font-size: 12px;
        }

        .disclaimer {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 15px;
            border-radius: 6px;
            font-size: 10px;
            color: #64748b;
            line-height: 1.5;
        }

        /* Print button */
        .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #16a34a;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 1000;
        }

        .print-button:hover {
            background: #15803d;
        }
    </style>
</head>
<body>
    <button class="print-button no-print" onclick="window.print()">
        📄 Imprimer / Sauvegarder PDF
    </button>

    <div class="container">
        <!-- Header DiagPV -->
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

        <!-- Report Title -->
        <div class="report-title">
            <h2>RAPPORT D'AUDIT DE CONFORMITÉ TOITURE</h2>
            <div class="subtitle">Installation Photovoltaïque - Norme DTU 40.35</div>
            <div class="ref">Référence: ${inspection.token}</div>
        </div>

        <!-- Project Info -->
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
                    <label>Puissance Installée</label>
                    <span>${project.installation_power} kWc</span>
                </div>
                <div class="info-item">
                    <label>Date de l'Audit</label>
                    <span>${date}</span>
                </div>
                <div class="info-item">
                    <label>Type d'Audit</label>
                    <span>Conformité Toiture (DTU 40.35)</span>
                </div>
            </div>
        </div>

        <!-- Statistics -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${stats.total}</div>
                <div class="stat-label">Points de Contrôle</div>
            </div>
            <div class="stat-card conforme">
                <div class="stat-value">${stats.conformes}</div>
                <div class="stat-label">Conformes</div>
            </div>
            <div class="stat-card non-conforme">
                <div class="stat-value">${stats.non_conformes}</div>
                <div class="stat-label">Non Conformes</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.taux_conformite}%</div>
                <div class="stat-label">Taux de Conformité</div>
            </div>
        </div>

        <!-- Checklist by Category -->
        ${Object.entries(categories).map(([categoryKey, categoryItems]) => `
            <div class="category-section ${categoryItems.length > 8 ? 'page-break' : ''}">
                <div class="category-header">
                    ${categoryNames[categoryKey] || categoryKey}
                </div>
                <table class="checklist-table">
                    <thead>
                        <tr>
                            <th style="width: 8%">Code</th>
                            <th style="width: 42%">Point de Contrôle</th>
                            <th style="width: 12%">Criticité</th>
                            <th style="width: 15%">Méthode</th>
                            <th style="width: 13%">Résultat</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${categoryItems.map(item => `
                            <tr>
                                <td>
                                    <div class="item-code">${item.code}</div>
                                </td>
                                <td>
                                    <div class="item-description">${item.description}</div>
                                    <div class="item-norm">${item.normReference}</div>
                                    ${item.observation && item.conformity === 'non_conforme' ? `
                                        <div class="observation-box">
                                            <strong>⚠️ Observation:</strong>
                                            ${item.observation}
                                        </div>
                                    ` : ''}
                                </td>
                                <td>
                                    <span class="criticality-badge ${item.criticalityLevel}">
                                        ${criticalityLabels[item.criticalityLevel]}
                                    </span>
                                </td>
                                <td style="font-size: 11px; color: #64748b;">
                                    ${item.checkMethod}
                                </td>
                                <td>
                                    <span class="conformity-status ${item.conformity}">
                                        ${conformityLabels[item.conformity] || item.conformity}
                                    </span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `).join('')}

        <!-- Footer & Signatures -->
        <div class="footer page-break">
            <div class="signature-grid">
                <div class="signature-box">
                    <div class="title">Auditeur DiagPV</div>
                    <div style="height: 60px; border-bottom: 1px solid #cbd5e1;"></div>
                    <div class="name">Fabien CORRERA</div>
                    <div class="function">Expert Photovoltaïque Indépendant</div>
                </div>
                <div class="signature-box">
                    <div class="title">Client / Exploitant</div>
                    <div style="height: 60px; border-bottom: 1px solid #cbd5e1;"></div>
                    <div class="name">_______________________</div>
                    <div class="function">Signature et Cachet</div>
                </div>
            </div>

            <div class="disclaimer">
                <strong>Mentions légales :</strong><br>
                Ce rapport d'audit a été réalisé conformément aux normes NF C 15-100 et UTE C 15-712-1. 
                Les observations et recommandations sont basées sur les constatations visuelles et les mesures 
                effectuées lors de l'intervention. Diagnostic Photovoltaïque décline toute responsabilité en 
                cas de modification de l'installation après l'audit. Ce document est confidentiel et destiné 
                uniquement au client mentionné. RCS 792972309.
            </div>
        </div>
    </div>
</body>
</html>
  `.trim()
}
