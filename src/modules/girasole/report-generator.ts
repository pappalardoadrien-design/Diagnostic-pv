/**
 * Générateur de rapports PDF GIRASOLE
 * Templates : CONFORMITE (NF C 15-100) et TOITURE (DTU 40.35)
 */

interface ReportData {
  inspection: any;
  project: any;
  items: any[];
  checklistType: 'CONFORMITE' | 'TOITURE';
}

/**
 * Générer HTML du rapport (prêt pour impression/PDF)
 */
export function generateReportHTML(data: ReportData): string {
  const { inspection, project, items, checklistType } = data;
  
  const title = checklistType === 'CONFORMITE' 
    ? 'Rapport de Conformité NF C 15-100'
    : 'Rapport de Contrôle Toiture DTU 40.35';
  
  const norm = checklistType === 'CONFORMITE'
    ? 'NF C 15-100 + Guide UTE C 15-712-1'
    : 'DTU 40.35 (Couverture en plaques nervurées)';

  // Statistiques
  const total = items.length;
  const checked = items.filter(i => i.status === 'checked').length;
  const conforme = items.filter(i => i.conformity === 'conforme').length;
  const nonConforme = items.filter(i => i.conformity === 'non_conforme').length;
  const sansObjet = items.filter(i => i.conformity === 'sans_objet').length;

  // Grouper par catégorie
  const categories: { [key: string]: any[] } = {};
  items.forEach(item => {
    if (!categories[item.category]) {
      categories[item.category] = [];
    }
    categories[item.category].push(item);
  });

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>${title} - ${project.name}</title>
    <style>
        @page {
            size: A4;
            margin: 15mm;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 210mm;
            margin: 0 auto;
            padding: 20px;
            background: white;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 4px solid #10b981;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }

        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #10b981;
        }

        .company-info {
            text-align: right;
            font-size: 12px;
            color: #666;
        }

        h1 {
            color: #10b981;
            font-size: 24px;
            margin: 0 0 10px 0;
        }

        h2 {
            color: #059669;
            font-size: 18px;
            margin: 30px 0 15px 0;
            padding-bottom: 8px;
            border-bottom: 2px solid #d1fae5;
        }

        h3 {
            color: #047857;
            font-size: 14px;
            margin: 20px 0 10px 0;
            text-transform: uppercase;
            font-weight: 600;
        }

        .info-box {
            background: #f0fdf4;
            border-left: 4px solid #10b981;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }

        .info-row {
            display: flex;
            margin-bottom: 8px;
        }

        .info-label {
            font-weight: 600;
            width: 200px;
            color: #047857;
        }

        .info-value {
            flex: 1;
            color: #333;
        }

        .stats {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin: 30px 0;
        }

        .stat-card {
            background: white;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
        }

        .stat-value {
            font-size: 32px;
            font-weight: bold;
            color: #10b981;
            margin: 10px 0;
        }

        .stat-label {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            font-weight: 600;
        }

        .checklist-section {
            margin: 30px 0;
            page-break-inside: avoid;
        }

        .category-header {
            background: #047857;
            color: white;
            padding: 12px 15px;
            font-size: 16px;
            font-weight: bold;
            border-radius: 6px 6px 0 0;
        }

        .checklist-table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border: 1px solid #d1d5db;
            border-radius: 0 0 6px 6px;
            overflow: hidden;
        }

        .checklist-table th {
            background: #f3f4f6;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            font-size: 13px;
            color: #374151;
            border-bottom: 2px solid #d1d5db;
        }

        .checklist-table td {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 12px;
        }

        .checklist-table tr:last-child td {
            border-bottom: none;
        }

        .item-code {
            font-weight: bold;
            color: #047857;
            font-size: 14px;
        }

        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
        }

        .badge-conforme {
            background: #d1fae5;
            color: #065f46;
        }

        .badge-non-conforme {
            background: #fee2e2;
            color: #991b1b;
        }

        .badge-sans-objet {
            background: #e5e7eb;
            color: #374151;
        }

        .badge-non-verifie {
            background: #fef3c7;
            color: #92400e;
        }

        .badge-critical {
            background: #fee2e2;
            color: #991b1b;
        }

        .badge-major {
            background: #fed7aa;
            color: #9a3412;
        }

        .badge-minor {
            background: #fef3c7;
            color: #92400e;
        }

        .observation {
            background: #fef3c7;
            border-left: 3px solid #f59e0b;
            padding: 10px;
            margin-top: 8px;
            font-size: 11px;
            color: #78350f;
        }

        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            font-size: 11px;
            color: #6b7280;
        }

        .signature-box {
            margin-top: 40px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
        }

        .signature {
            text-align: center;
            padding: 20px;
            border: 2px dashed #d1d5db;
            border-radius: 8px;
        }

        @media print {
            body {
                padding: 0;
            }
            
            .no-print {
                display: none;
            }
            
            .page-break {
                page-break-before: always;
            }
        }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="header">
        <div>
            <div class="logo">⚡ Diagnostic Photovoltaïque</div>
            <div style="color: #6b7280; font-size: 14px; margin-top: 5px;">Expertise indépendante depuis 2012</div>
        </div>
        <div class="company-info">
            <strong>Diagnostic Photovoltaïque</strong><br>
            3 rue d'Apollo, 31240 L'Union<br>
            📞 05.81.10.16.59<br>
            📧 contact@diagpv.fr<br>
            RCS 792972309
        </div>
    </div>

    <!-- Titre principal -->
    <h1>${title}</h1>
    <div style="color: #6b7280; font-size: 14px; margin-bottom: 30px;">
        Référence normative : ${norm}
    </div>

    <!-- Informations installation -->
    <div class="info-box">
        <h2 style="margin-top: 0; border: none;">📋 Informations Installation</h2>
        <div class="info-row">
            <div class="info-label">Centrale :</div>
            <div class="info-value">${project.name}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Adresse :</div>
            <div class="info-value">${project.site_address || 'N/A'}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Puissance installée :</div>
            <div class="info-value">${project.installation_power ? project.installation_power + ' kWc' : 'N/A'}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Date inspection :</div>
            <div class="info-value">${new Date(inspection.inspection_date).toLocaleDateString('fr-FR')}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Inspecteur :</div>
            <div class="info-value">${inspection.inspector_name || 'Technicien DiagPV'}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Token inspection :</div>
            <div class="info-value" style="font-family: monospace; font-size: 11px;">${inspection.inspection_token}</div>
        </div>
    </div>

    <!-- Statistiques -->
    <h2>📊 Synthèse de Contrôle</h2>
    <div class="stats">
        <div class="stat-card">
            <div class="stat-label">Total Items</div>
            <div class="stat-value">${total}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">✅ Conformes</div>
            <div class="stat-value" style="color: #10b981;">${conforme}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">❌ Non Conformes</div>
            <div class="stat-value" style="color: #ef4444;">${nonConforme}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">⊘ Sans Objet</div>
            <div class="stat-value" style="color: #6b7280;">${sansObjet}</div>
        </div>
    </div>

    <!-- Détail par catégorie -->
    <h2>🔍 Détail des Contrôles</h2>
    ${Object.keys(categories).map(category => `
        <div class="checklist-section">
            <div class="category-header">${category}</div>
            <table class="checklist-table">
                <thead>
                    <tr>
                        <th style="width: 80px;">Code</th>
                        <th>Description</th>
                        <th style="width: 100px;">Criticité</th>
                        <th style="width: 120px;">Conformité</th>
                    </tr>
                </thead>
                <tbody>
                    ${categories[category].map(item => `
                        <tr>
                            <td><span class="item-code">${item.item_code}</span></td>
                            <td>
                                <strong>${item.item_description}</strong>
                                ${item.observation ? `<div class="observation">⚠️ <strong>Observation :</strong> ${item.observation}</div>` : ''}
                            </td>
                            <td>
                                <span class="badge badge-${item.severity}">
                                    ${item.severity === 'critical' ? 'Critique' : item.severity === 'major' ? 'Majeur' : item.severity === 'minor' ? 'Mineur' : 'Info'}
                                </span>
                            </td>
                            <td>
                                <span class="badge badge-${item.conformity || 'non_verifie'}">
                                    ${item.conformity === 'conforme' ? '✓ Conforme' : 
                                      item.conformity === 'non_conforme' ? '✗ Non conforme' : 
                                      item.conformity === 'sans_objet' ? '⊘ Sans objet' : '? Non vérifié'}
                                </span>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `).join('')}

    <!-- Signatures -->
    <div class="signature-box">
        <div class="signature">
            <strong>Inspecteur DiagPV</strong><br>
            <div style="height: 60px;"></div>
            Signature & Cachet
        </div>
        <div class="signature">
            <strong>Représentant Client</strong><br>
            <div style="height: 60px;"></div>
            Signature
        </div>
    </div>

    <!-- Footer -->
    <div class="footer">
        <p><strong>Diagnostic Photovoltaïque</strong> - Expertise indépendante en installations photovoltaïques</p>
        <p>Ce rapport est confidentiel et destiné exclusivement au client mentionné ci-dessus.</p>
        <p>Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
    </div>

    <!-- Boutons impression (masqués à l'impression) -->
    <div class="no-print" style="position: fixed; bottom: 20px; right: 20px; display: flex; gap: 10px;">
        <button onclick="window.print()" style="background: #10b981; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 14px;">
            🖨️ Imprimer / PDF
        </button>
        <button onclick="window.close()" style="background: #6b7280; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 14px;">
            ✖️ Fermer
        </button>
    </div>
</body>
</html>
  `;
}
