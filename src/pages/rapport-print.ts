/**
 * PAGE RAPPORT PDF - OPTIMISÉE IMPRESSION
 * 
 * Format A4, identité DiagPV, conforme IEC 62446-1
 * Utilise window.print() pour génération PDF navigateur
 */

import { Context } from 'hono';

export async function getRapportPrintPage(c: Context<{ Bindings: CloudflareBindings }>) {
  const { env } = c;
  const { audit_token } = c.req.param();
  
  // Récupérer données audit complet
  const audit = await env.DB.prepare(`
    SELECT 
      a.*,
      c.name as client_name,
      c.email as client_email,
      c.phone as client_phone,
      sc.site_name,
      sc.site_address,
      sc.site_city,
      sc.site_postal_code,
      sc.installer_name,
      sc.installation_date
    FROM el_audits a
    LEFT JOIN crm_clients c ON a.client_id = c.id
    LEFT JOIN shared_configurations sc ON a.config_id = sc.id
    WHERE a.audit_token = ?
  `).bind(audit_token).first();
  
  if (!audit) {
    return c.html('<h1>Audit introuvable</h1>', 404);
  }
  
  // Récupérer modules EL
  const { results: elModules } = await env.DB.prepare(`
    SELECT * FROM el_modules 
    WHERE audit_token = ?
    ORDER BY string_number, position_in_string
  `).bind(audit_token).all();
  
  // Récupérer mesures I-V
  const { results: ivMeasurements } = await env.DB.prepare(`
    SELECT * FROM iv_measurements 
    WHERE audit_token = ?
    ORDER BY string_number, module_number
  `).bind(audit_token).all();
  
  // Récupérer inspections visuelles
  const { results: visualInspections } = await env.DB.prepare(`
    SELECT * FROM visual_inspections 
    WHERE audit_token = ?
  `).bind(audit_token).all();
  
  // Récupérer tests isolation
  const { results: isolationTests } = await env.DB.prepare(`
    SELECT * FROM isolation_tests 
    WHERE audit_token = ?
  `).bind(audit_token).all();
  
  // Calculer statistiques
  const totalModules = elModules?.length || 0;
  const defectiveModules = elModules?.filter((m: any) => m.defect_type !== 'ok').length || 0;
  const conformityRate = totalModules > 0 ? ((totalModules - defectiveModules) / totalModules * 100).toFixed(1) : '0';
  
  const avgPmax = ivMeasurements && ivMeasurements.length > 0
    ? (ivMeasurements.reduce((sum: number, m: any) => sum + (m.pmax || 0), 0) / ivMeasurements.length).toFixed(2)
    : '0';
  
  const visualDefects = visualInspections?.filter((i: any) => i.defect_type !== 'none').length || 0;
  const isolationConform = isolationTests?.filter((t: any) => t.is_conform).length || 0;
  
  return c.html(`
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport Audit DiagPV - ${audit_token}</title>
  
  <style>
    /* ========================================
       STYLES GÉNÉRAUX
       ======================================== */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #333;
      background: white;
    }
    
    .container {
      max-width: 210mm; /* A4 width */
      margin: 0 auto;
      padding: 20px;
    }
    
    /* ========================================
       EN-TÊTE DiagPV
       ======================================== */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 4px solid #4CAF50;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    .logo {
      font-size: 28pt;
      font-weight: bold;
      color: #4CAF50;
      letter-spacing: 2px;
    }
    
    .contact {
      text-align: right;
      font-size: 9pt;
      color: #666;
      line-height: 1.4;
    }
    
    .contact strong {
      font-size: 10pt;
      color: #333;
      display: block;
      margin-bottom: 5px;
    }
    
    /* ========================================
       TITRES
       ======================================== */
    h1 {
      color: #4CAF50;
      font-size: 20pt;
      margin: 30px 0 20px 0;
      border-bottom: 2px solid #4CAF50;
      padding-bottom: 10px;
    }
    
    h2 {
      color: #333;
      font-size: 14pt;
      margin: 25px 0 15px 0;
      padding-left: 10px;
      border-left: 4px solid #4CAF50;
    }
    
    h3 {
      color: #666;
      font-size: 12pt;
      margin: 15px 0 10px 0;
    }
    
    /* ========================================
       TABLEAUX
       ======================================== */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 10pt;
    }
    
    th, td {
      border: 1px solid #ddd;
      padding: 10px;
      text-align: left;
    }
    
    th {
      background-color: #4CAF50;
      color: white;
      font-weight: bold;
    }
    
    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    
    /* ========================================
       STATISTIQUES (KPI BOXES)
       ======================================== */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin: 20px 0;
    }
    
    .stat-box {
      background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #4CAF50;
      text-align: center;
    }
    
    .stat-value {
      font-size: 24pt;
      font-weight: bold;
      color: #4CAF50;
      display: block;
    }
    
    .stat-label {
      font-size: 9pt;
      color: #666;
      margin-top: 5px;
    }
    
    /* ========================================
       BADGES DÉFAUTS
       ======================================== */
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 9pt;
      font-weight: bold;
      text-transform: uppercase;
    }
    
    .badge-ok { background: #4CAF50; color: white; }
    .badge-minor { background: #FFC107; color: #333; }
    .badge-moderate { background: #FF9800; color: white; }
    .badge-severe { background: #F44336; color: white; }
    .badge-critical { background: #B71C1C; color: white; }
    
    /* ========================================
       PIED DE PAGE
       ======================================== */
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #ddd;
      font-size: 8pt;
      color: #666;
      text-align: center;
      line-height: 1.4;
    }
    
    .footer strong {
      color: #333;
      font-size: 9pt;
    }
    
    /* ========================================
       BOUTON IMPRESSION (caché à l'impression)
       ======================================== */
    .print-button {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      border: none;
      padding: 15px 30px;
      font-size: 14pt;
      font-weight: bold;
      border-radius: 8px;
      cursor: pointer;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      z-index: 1000;
    }
    
    .print-button:hover {
      background: #45a049;
    }
    
    /* ========================================
       MEDIA PRINT - OPTIMISATION IMPRESSION
       ======================================== */
    @media print {
      /* Cacher bouton impression */
      .print-button {
        display: none !important;
      }
      
      /* Format A4 */
      @page {
        size: A4 portrait;
        margin: 15mm;
      }
      
      body {
        font-size: 10pt;
      }
      
      .container {
        max-width: 100%;
        padding: 0;
      }
      
      /* Éviter coupures de page */
      h1, h2, h3 {
        page-break-after: avoid;
      }
      
      table {
        page-break-inside: avoid;
      }
      
      tr {
        page-break-inside: avoid;
      }
      
      .stats-grid {
        page-break-inside: avoid;
      }
      
      /* Forcer nouvelle page pour sections principales */
      .page-break {
        page-break-before: always;
      }
      
      /* Optimiser couleurs pour impression */
      .stat-box {
        background: #f5f5f5 !important;
      }
      
      /* Améliorer contrastes */
      th {
        background-color: #333 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <!-- Bouton impression (caché à l'impression) -->
  <button class="print-button" onclick="window.print()">
    📄 Télécharger PDF
  </button>

  <div class="container">
    <!-- ============================================
         EN-TÊTE DiagPV
         ============================================ -->
    <div class="header">
      <div class="logo">DiagPV</div>
      <div class="contact">
        <strong>Diagnostic Photovoltaïque</strong>
        Expertise indépendante depuis 2012<br>
        3 rue d'Apollo, 31240 L'Union<br>
        📞 05.81.10.16.59 | ✉️ contact@diagpv.fr<br>
        RCS Toulouse 792 972 309
      </div>
    </div>

    <!-- ============================================
         PAGE 1 : INFORMATIONS GÉNÉRALES
         ============================================ -->
    <h1>Rapport d'Audit Photovoltaïque Multi-Modules</h1>
    
    <table>
      <tr>
        <th>Référence Audit</th>
        <td><strong>${audit_token}</strong></td>
      </tr>
      <tr>
        <th>Date d'audit</th>
        <td>${new Date(audit.created_at).toLocaleDateString('fr-FR', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</td>
      </tr>
      <tr>
        <th>Client</th>
        <td>${audit.client_name || 'N/A'}</td>
      </tr>
      <tr>
        <th>Site</th>
        <td>${audit.site_name || 'N/A'}</td>
      </tr>
      <tr>
        <th>Adresse</th>
        <td>${audit.site_address || 'N/A'}, ${audit.site_postal_code || ''} ${audit.site_city || ''}</td>
      </tr>
      <tr>
        <th>Installateur</th>
        <td>${audit.installer_name || 'N/A'}</td>
      </tr>
      <tr>
        <th>Date installation</th>
        <td>${audit.installation_date ? new Date(audit.installation_date).toLocaleDateString('fr-FR') : 'N/A'}</td>
      </tr>
    </table>

    <h2>📊 Synthèse Globale</h2>
    
    <div class="stats-grid">
      <div class="stat-box">
        <span class="stat-value">${totalModules}</span>
        <div class="stat-label">Modules analysés</div>
      </div>
      
      <div class="stat-box">
        <span class="stat-value">${conformityRate}%</span>
        <div class="stat-label">Taux conformité</div>
      </div>
      
      <div class="stat-box">
        <span class="stat-value">${defectiveModules}</span>
        <div class="stat-label">Défauts détectés</div>
      </div>
      
      <div class="stat-box">
        <span class="stat-value">${ivMeasurements?.length || 0}</span>
        <div class="stat-label">Mesures I-V</div>
      </div>
    </div>

    <!-- ============================================
         PAGE 2 : MODULE ÉLECTROLUMINESCENCE
         ============================================ -->
    <div class="page-break"></div>
    <h1>Module 1 : Électroluminescence (EL)</h1>
    
    <h2>Conformité : IEC 62446-3</h2>
    
    <h3>Modules par sévérité</h3>
    <table>
      <thead>
        <tr>
          <th>String</th>
          <th>Position</th>
          <th>Type défaut</th>
          <th>Sévérité</th>
          <th>Remarques</th>
        </tr>
      </thead>
      <tbody>
        ${elModules?.slice(0, 50).map((m: any) => `
          <tr>
            <td>String ${m.string_number}</td>
            <td>Module ${m.position_in_string}</td>
            <td>${m.defect_type === 'ok' ? 'Aucun' : m.defect_type}</td>
            <td>
              <span class="badge badge-${m.severity || 'ok'}">
                ${m.severity || 'OK'}
              </span>
            </td>
            <td>${m.notes || '-'}</td>
          </tr>
        `).join('') || '<tr><td colspan="5">Aucune donnée EL disponible</td></tr>'}
      </tbody>
    </table>
    
    ${elModules && elModules.length > 50 ? `
      <p><em>⚠️ Liste tronquée (50 premiers modules sur ${elModules.length}). Rapport complet disponible en ligne.</em></p>
    ` : ''}

    <!-- ============================================
         PAGE 3 : MODULE I-V (COURBES)
         ============================================ -->
    <div class="page-break"></div>
    <h1>Module 2 : Courbes Intensité-Tension (I-V)</h1>
    
    <h2>Conformité : IEC 60904-1</h2>
    
    <div class="stats-grid">
      <div class="stat-box">
        <span class="stat-value">${avgPmax}</span>
        <div class="stat-label">Pmax moyen (W)</div>
      </div>
      
      <div class="stat-box">
        <span class="stat-value">${ivMeasurements?.length || 0}</span>
        <div class="stat-label">Mesures totales</div>
      </div>
      
      <div class="stat-box">
        <span class="stat-value">STC</span>
        <div class="stat-label">Conditions test</div>
      </div>
      
      <div class="stat-box">
        <span class="stat-value">±5%</span>
        <div class="stat-label">Tolérance</div>
      </div>
    </div>
    
    <h3>Mesures I-V par string</h3>
    <table>
      <thead>
        <tr>
          <th>String</th>
          <th>Module</th>
          <th>Isc (A)</th>
          <th>Voc (V)</th>
          <th>Pmax (W)</th>
          <th>FF (%)</th>
          <th>Déviation (%)</th>
        </tr>
      </thead>
      <tbody>
        ${ivMeasurements?.slice(0, 30).map((m: any) => `
          <tr>
            <td>${m.string_number}</td>
            <td>${m.module_number}</td>
            <td>${m.isc?.toFixed(2) || 'N/A'}</td>
            <td>${m.voc?.toFixed(2) || 'N/A'}</td>
            <td>${m.pmax?.toFixed(2) || 'N/A'}</td>
            <td>${m.fill_factor?.toFixed(1) || 'N/A'}</td>
            <td style="color: ${Math.abs(m.deviation_from_datasheet || 0) > 5 ? '#F44336' : '#4CAF50'}">
              ${m.deviation_from_datasheet?.toFixed(1) || 'N/A'}%
            </td>
          </tr>
        `).join('') || '<tr><td colspan="7">Aucune donnée I-V disponible</td></tr>'}
      </tbody>
    </table>

    <!-- ============================================
         PAGE 4 : MODULES VISUAL + ISOLATION
         ============================================ -->
    <div class="page-break"></div>
    <h1>Module 3 : Inspection Visuelle</h1>
    
    <h2>Conformité : IEC 61215</h2>
    
    <table>
      <thead>
        <tr>
          <th>Zone</th>
          <th>Type défaut</th>
          <th>Sévérité</th>
          <th>Remarques</th>
        </tr>
      </thead>
      <tbody>
        ${visualInspections?.slice(0, 20).map((i: any) => `
          <tr>
            <td>${i.zone_name || 'N/A'}</td>
            <td>${i.defect_type === 'none' ? 'Aucun' : i.defect_type}</td>
            <td>
              <span class="badge badge-${i.severity || 'ok'}">
                ${i.severity || 'OK'}
              </span>
            </td>
            <td>${i.notes || '-'}</td>
          </tr>
        `).join('') || '<tr><td colspan="4">Aucune inspection visuelle disponible</td></tr>'}
      </tbody>
    </table>
    
    <h1 style="margin-top: 40px;">Module 4 : Tests Isolement</h1>
    
    <h2>Conformité : NF C 15-100</h2>
    
    <table>
      <thead>
        <tr>
          <th>Zone testée</th>
          <th>Type test</th>
          <th>Valeur (MΩ)</th>
          <th>Conforme</th>
          <th>Remarques</th>
        </tr>
      </thead>
      <tbody>
        ${isolationTests?.map((t: any) => `
          <tr>
            <td>${t.test_zone || 'N/A'}</td>
            <td>${t.test_type || 'N/A'}</td>
            <td>${t.resistance_value?.toFixed(2) || 'N/A'}</td>
            <td>
              <span class="badge badge-${t.is_conform ? 'ok' : 'severe'}">
                ${t.is_conform ? 'OUI' : 'NON'}
              </span>
            </td>
            <td>${t.notes || '-'}</td>
          </tr>
        `).join('') || '<tr><td colspan="5">Aucun test isolation disponible</td></tr>'}
      </tbody>
    </table>

    <!-- ============================================
         PIED DE PAGE - MENTIONS LÉGALES
         ============================================ -->
    <div class="footer">
      <strong>Diagnostic Photovoltaïque</strong> | Expertise indépendante depuis 2012<br>
      3 rue d'Apollo, 31240 L'Union | RCS Toulouse 792 972 309<br>
      📞 05.81.10.16.59 | ✉️ contact@diagpv.fr | 🌐 www.diagnosticphotovoltaique.fr<br>
      <br>
      <em>Document confidentiel | Conforme IEC 62446-1 | Généré le ${new Date().toLocaleDateString('fr-FR')}</em>
    </div>
  </div>

  <script>
    // Auto-déclencher impression (optionnel, décommenter si souhaité)
    // window.onload = function() {
    //   setTimeout(() => window.print(), 500);
    // };
  </script>
</body>
</html>
  `);
}
