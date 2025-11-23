import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
  R2: R2Bucket;
};

const consolidatedFullRoutes = new Hono<{ Bindings: Bindings }>();

// ============================================================================
// HELPER: Fetch image as base64 with size limit
// ============================================================================
async function fetchImageAsBase64(R2: R2Bucket, r2Key: string, maxSizeBytes: number = 300000): Promise<string | null> {
  try {
    const object = await R2.get(r2Key);
    if (!object) return null;

    const arrayBuffer = await object.arrayBuffer();
    
    // Check size limit
    if (arrayBuffer.byteLength > maxSizeBytes) {
      console.warn(`Image ${r2Key} too large (${arrayBuffer.byteLength} bytes), skipping`);
      return null;
    }

    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const mimeType = object.httpMetadata?.contentType || 'image/jpeg';
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error(`Error fetching image ${r2Key}:`, error);
    return null;
  }
}

// ============================================================================
// HELPER: Calculate statistics
// ============================================================================
function calculateStats(data: any[], field: string): { avg: number; min: number; max: number; std: number } {
  if (!data || data.length === 0) {
    return { avg: 0, min: 0, max: 0, std: 0 };
  }

  const values = data.map(d => parseFloat(d[field]) || 0).filter(v => v > 0);
  if (values.length === 0) {
    return { avg: 0, min: 0, max: 0, std: 0 };
  }

  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  const variance = values.map(v => Math.pow(v - avg, 2));
  const std = Math.sqrt(variance.reduce((a, b) => a + b, 0) / variance.length);

  return { avg, min, max, std };
}

// ============================================================================
// GET /api/reports/consolidated-full/:audit_token - RAPPORT MULTI-MODULES COMPLET
// ============================================================================
consolidatedFullRoutes.get('/:audit_token', async (c) => {
  try {
    const { DB, R2 } = c.env;
    const auditToken = c.req.param('audit_token');

    // Récupérer audit master
    const audit = await DB.prepare(`
      SELECT * FROM audits WHERE audit_token = ?
    `).bind(auditToken).first();

    if (!audit) {
      return c.json({ error: 'Audit introuvable' }, 404);
    }

    const modulesEnabled = JSON.parse(audit.modules_enabled as string || '[]');
    
    const reportData: any = {
      audit,
      modules: {}
    };

    // ========================================================================
    // MODULE EL - ÉLECTROLUMINESCENCE
    // ========================================================================
    if (modulesEnabled.includes('EL')) {
      const elAudit = await DB.prepare(`
        SELECT el.* FROM audits a
        LEFT JOIN el_audits el ON a.audit_token = el.audit_token
        WHERE a.audit_token = ?
      `).bind(auditToken).first();

      const { results: elModules } = await DB.prepare(`
        SELECT * FROM el_modules 
        WHERE audit_token = ?
        ORDER BY string_number ASC, position_in_string ASC
      `).bind(auditToken).all();

      // Statistiques par string
      const byString: Record<number, any[]> = {};
      const bySeverity = { none: 0, minor: 0, moderate: 0, severe: 0, critical: 0 };
      const byDefectType: Record<string, number> = {};

      elModules.forEach((m: any) => {
        // Group by string
        const stringNum = m.string_number || 0;
        if (!byString[stringNum]) byString[stringNum] = [];
        byString[stringNum].push(m);

        // Count by severity
        const sev = m.severity_level || 0;
        if (sev === 0) bySeverity.none++;
        else if (sev === 1) bySeverity.minor++;
        else if (sev === 2) bySeverity.moderate++;
        else if (sev === 3) bySeverity.severe++;
        else if (sev === 4) bySeverity.critical++;

        // Count by defect type
        const defectType = m.defect_type || 'none';
        byDefectType[defectType] = (byDefectType[defectType] || 0) + 1;
      });

      const totalModules = elModules.length;
      const defectModules = totalModules - (byDefectType.none || 0);
      const defectRate = totalModules > 0 ? ((defectModules / totalModules) * 100).toFixed(1) : '0';

      // Photos critiques (max 10, 300KB each)
      const { results: photos } = await DB.prepare(`
        SELECT p.*, m.string_number, m.position_in_string, m.defect_type
        FROM el_photos p
        LEFT JOIN el_modules m ON p.el_module_id = m.id
        WHERE p.audit_token = ? AND p.severity_level >= 3
        ORDER BY p.severity_level DESC
        LIMIT 10
      `).bind(auditToken).all();

      const criticalPhotos = await Promise.all(
        photos.slice(0, 10).map(async (photo: any) => {
          const base64Image = await fetchImageAsBase64(R2, photo.r2_key, 300000);
          return { ...photo, base64Image };
        })
      );

      reportData.modules.EL = {
        audit: elAudit,
        modules: elModules,
        byString,
        bySeverity,
        byDefectType,
        stats: {
          total: totalModules,
          defects: defectModules,
          defectRate: parseFloat(defectRate),
          critical: bySeverity.critical,
          severe: bySeverity.severe
        },
        criticalPhotos: criticalPhotos.filter(p => p.base64Image)
      };
    }

    // ========================================================================
    // MODULE IV - COURBES I-V
    // ========================================================================
    if (modulesEnabled.includes('IV')) {
      const { results: measurements } = await DB.prepare(`
        SELECT * FROM iv_measurements 
        WHERE audit_token = ?
        ORDER BY string_number ASC, module_number ASC, measurement_type ASC
      `).bind(auditToken).all();

      // Séparer référence et sombres
      const reference = measurements.filter((m: any) => m.measurement_type === 'reference');
      const dark = measurements.filter((m: any) => m.measurement_type === 'dark');

      // Statistiques référence
      const statsVoc = calculateStats(reference, 'voc');
      const statsIsc = calculateStats(reference, 'isc');
      const statsPmax = calculateStats(reference, 'pmax');
      const statsFf = calculateStats(reference, 'fill_factor');

      // Calcul déviations
      const deviations = reference.map((m: any) => {
        const pmax = m.pmax || 0;
        const deviation = statsPmax.avg > 0 ? Math.abs((pmax - statsPmax.avg) / statsPmax.avg) * 100 : 0;
        return { ...m, deviation };
      });

      const avgDeviation = deviations.length > 0 
        ? deviations.reduce((sum: number, m: any) => sum + m.deviation, 0) / deviations.length 
        : 0;

      // Mesures par string
      const byString: Record<string, any[]> = {};
      reference.forEach((m: any) => {
        const key = `String ${m.string_number}`;
        if (!byString[key]) byString[key] = [];
        byString[key].push(m);
      });

      reportData.modules.IV = {
        measurements,
        reference,
        dark,
        byString,
        stats: {
          count: reference.length,
          voc: statsVoc,
          isc: statsIsc,
          pmax: statsPmax,
          ff: statsFf,
          avgDeviation: avgDeviation.toFixed(2)
        }
      };
    }

    // ========================================================================
    // MODULE VISUAL - INSPECTIONS VISUELLES
    // ========================================================================
    if (modulesEnabled.includes('VISUAL')) {
      const { results: inspections } = await DB.prepare(`
        SELECT * FROM visual_inspections 
        WHERE audit_token = ?
        ORDER BY created_at DESC
      `).bind(auditToken).all();

      const stats = {
        total: inspections.length,
        defects: inspections.filter((i: any) => i.defect_found === 1).length,
        critical: inspections.filter((i: any) => i.severity_level >= 4).length,
        high: inspections.filter((i: any) => i.severity_level === 3).length,
        medium: inspections.filter((i: any) => i.severity_level === 2).length,
        low: inspections.filter((i: any) => i.severity_level === 1).length
      };

      reportData.modules.VISUAL = {
        inspections,
        stats
      };
    }

    // ========================================================================
    // MODULE ISOLATION - TESTS D'ISOLEMENT
    // ========================================================================
    if (modulesEnabled.includes('ISOLATION')) {
      const { results: tests } = await DB.prepare(`
        SELECT * FROM isolation_tests 
        WHERE audit_token = ?
        ORDER BY created_at DESC
      `).bind(auditToken).all();

      const passed = tests.filter((t: any) => t.test_result === 'pass').length;
      const failed = tests.filter((t: any) => t.test_result !== 'pass').length;

      const resistances = tests.map((t: any) => parseFloat(t.resistance_value) || 0).filter(r => r > 0);
      const avgResistance = resistances.length > 0 
        ? (resistances.reduce((a, b) => a + b, 0) / resistances.length).toFixed(2) 
        : '0';

      reportData.modules.ISOLATION = {
        tests,
        stats: {
          total: tests.length,
          passed,
          failed,
          avgResistance: parseFloat(avgResistance),
          conformityRate: tests.length > 0 ? ((passed / tests.length) * 100).toFixed(1) : '100'
        }
      };
    }

    // Générer HTML
    const html = generateConsolidatedFullHTML(reportData);

    return c.html(html);

  } catch (error: any) {
    console.error('Erreur génération rapport consolidé complet:', error);
    return c.json({ 
      error: 'Erreur lors de la génération du rapport',
      details: error.message 
    }, 500);
  }
});

// ============================================================================
// GÉNÉRATION HTML - RAPPORT CONSOLIDÉ COMPLET
// ============================================================================
function generateConsolidatedFullHTML(data: any): string {
  const audit = data.audit;
  const reportNumber = `RC-${audit.id.toString().padStart(6, '0')}`;
  const currentDate = new Date().toLocaleDateString('fr-FR');
  const auditDate = new Date(audit.audit_date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const modulesEnabled = JSON.parse(audit.modules_enabled as string || '[]');

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport Consolidé ${reportNumber}</title>
    <style>
        @page {
            size: A4;
            margin: 15mm;
        }

        @media print {
            body { margin: 0; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            .no-print { display: none !important; }
            .page-break { page-break-after: always; }
            .page-break-avoid { page-break-inside: avoid; }
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            font-size: 10pt;
            line-height: 1.5;
            color: #333;
            background: white;
        }
        
        .container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 10mm;
            background: white;
        }
        
        /* EN-TÊTE */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 4px solid #2d5016;
        }
        
        .logo-text {
            font-size: 24pt;
            font-weight: bold;
            color: #2d5016;
            margin-bottom: 5px;
        }
        
        .company-info {
            font-size: 8pt;
            color: #666;
            line-height: 1.6;
        }
        
        .report-number {
            font-size: 20pt;
            font-weight: bold;
            color: #2d5016;
            text-align: right;
        }
        
        .report-date {
            font-size: 10pt;
            color: #666;
            text-align: right;
        }
        
        /* TITRE */
        .doc-title {
            text-align: center;
            font-size: 18pt;
            font-weight: bold;
            color: #2d5016;
            margin: 20px 0;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .project-name {
            text-align: center;
            font-size: 14pt;
            color: #666;
            margin-bottom: 20px;
        }
        
        /* SECTION */
        .section {
            margin-bottom: 25px;
            page-break-inside: avoid;
        }
        
        .section-title {
            font-size: 13pt;
            font-weight: bold;
            color: #2d5016;
            margin-bottom: 12px;
            padding: 10px 15px;
            background: linear-gradient(to right, #2d5016, #4a7025);
            color: white;
            border-radius: 5px;
        }
        
        /* INFO GRID */
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 15px;
        }
        
        .info-item {
            padding: 10px;
            background: #f9f9f9;
            border-left: 3px solid #2d5016;
            border-radius: 3px;
        }
        
        .info-label {
            font-size: 8pt;
            color: #666;
            text-transform: uppercase;
            font-weight: bold;
            margin-bottom: 3px;
        }
        
        .info-value {
            font-size: 11pt;
            color: #333;
            font-weight: bold;
        }
        
        /* STATS GRID */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin: 15px 0;
        }
        
        .stat-card {
            text-align: center;
            padding: 15px;
            background: white;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
        }
        
        .stat-card.critical { border-color: #d32f2f; background: #ffebee; }
        .stat-card.warning { border-color: #f57c00; background: #fff3e0; }
        .stat-card.success { border-color: #388e3c; background: #e8f5e9; }
        
        .stat-value {
            font-size: 24pt;
            font-weight: bold;
            color: #2d5016;
        }
        
        .stat-label {
            font-size: 8pt;
            color: #666;
            text-transform: uppercase;
            margin-top: 5px;
        }
        
        /* CARTOGRAPHIE EL */
        .string-map {
            margin: 15px 0;
            page-break-inside: avoid;
        }
        
        .string-header {
            font-weight: bold;
            font-size: 10pt;
            color: #2d5016;
            margin-bottom: 8px;
            padding: 5px 10px;
            background: #f0f4f0;
            border-left: 4px solid #2d5016;
        }
        
        .modules-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(35px, 1fr));
            gap: 3px;
            margin-bottom: 10px;
        }
        
        .module-cell {
            width: 35px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 8pt;
            font-weight: bold;
            border-radius: 3px;
            border: 1px solid #ddd;
        }
        
        .module-ok { background: #4caf50; color: white; }
        .module-minor { background: #2196f3; color: white; }
        .module-moderate { background: #ffc107; color: black; }
        .module-severe { background: #ff9800; color: white; }
        .module-critical { background: #f44336; color: white; }
        
        /* PHOTOS GRID */
        .photos-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin: 15px 0;
        }
        
        .photo-card {
            border: 2px solid #e0e0e0;
            border-radius: 5px;
            overflow: hidden;
            page-break-inside: avoid;
        }
        
        .photo-card img {
            width: 100%;
            height: auto;
            display: block;
        }
        
        .photo-info {
            padding: 8px;
            background: #f9f9f9;
            font-size: 8pt;
        }
        
        .severity-badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 7pt;
            font-weight: bold;
            margin-right: 5px;
        }
        
        .severity-critical { background: #f44336; color: white; }
        .severity-severe { background: #ff9800; color: white; }
        
        /* TABLEAU */
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
            font-size: 9pt;
        }
        
        th {
            background: #2d5016;
            color: white;
            padding: 8px;
            text-align: left;
            font-size: 9pt;
        }
        
        td {
            padding: 6px 8px;
            border-bottom: 1px solid #e0e0e0;
        }
        
        tr:nth-child(even) {
            background: #f9f9f9;
        }
        
        /* RECOMMANDATIONS */
        .reco-box {
            margin: 10px 0;
            padding: 12px;
            border-left: 4px solid;
            border-radius: 5px;
            page-break-inside: avoid;
        }
        
        .reco-box.critical {
            border-color: #f44336;
            background: #ffebee;
        }
        
        .reco-box.warning {
            border-color: #ff9800;
            background: #fff3e0;
        }
        
        .reco-box.info {
            border-color: #2196f3;
            background: #e3f2fd;
        }
        
        .reco-title {
            font-weight: bold;
            font-size: 11pt;
            margin-bottom: 8px;
        }
        
        .reco-box ul {
            margin-left: 20px;
        }
        
        .reco-box li {
            margin: 5px 0;
        }
        
        /* EXECUTIVE SUMMARY */
        .executive-summary {
            background: #fff9e6;
            border: 2px solid #ffd700;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
            page-break-inside: avoid;
        }
        
        .summary-title {
            font-size: 13pt;
            font-weight: bold;
            color: #2d5016;
            margin-bottom: 10px;
        }
        
        /* FOOTER */
        .footer {
            margin-top: 40px;
            padding-top: 15px;
            border-top: 2px solid #e0e0e0;
            text-align: center;
            font-size: 7pt;
            color: #999;
        }
        
        /* BUTTONS */
        .actions {
            position: fixed;
            top: 20px;
            right: 20px;
            display: flex;
            gap: 10px;
            z-index: 1000;
        }
        
        .btn {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            font-size: 11pt;
            background: #2d5016;
            color: white;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
        
        .btn:hover { opacity: 0.8; }
    </style>
</head>
<body>
    <!-- Boutons d'action -->
    <div class="actions no-print">
        <button class="btn" onclick="window.print()">🖨️ Imprimer / PDF</button>
    </div>

    <div class="container">
        <!-- EN-TÊTE -->
        <div class="header">
            <div>
                <div class="logo-text">DIAGNOSTIC PV</div>
                <div class="company-info">
                    Expertise Photovoltaïque Indépendante<br>
                    3 rue d'Apollo, 31240 L'Union<br>
                    Tél : 05.81.10.16.59 | contact@diagpv.fr<br>
                    RCS Toulouse 792 972 309
                </div>
            </div>
            <div>
                <div class="report-number">${reportNumber}</div>
                <div class="report-date">${currentDate}</div>
            </div>
        </div>

        <!-- TITRE -->
        <div class="doc-title">RAPPORT D'AUDIT TECHNIQUE CONSOLIDÉ</div>
        <div class="project-name">${audit.project_name || 'Non renseigné'}</div>

        <!-- INFORMATIONS GÉNÉRALES -->
        <div class="section">
            <div class="section-title">1. INFORMATIONS GÉNÉRALES</div>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Client</div>
                    <div class="info-value">${audit.client_name || 'Non renseigné'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Localisation</div>
                    <div class="info-value">${audit.location || 'Non renseigné'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Date audit</div>
                    <div class="info-value">${auditDate}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Modules audités</div>
                    <div class="info-value">${modulesEnabled.join(', ')}</div>
                </div>
            </div>
        </div>

        ${generateModuleSectionsHTML(data)}

        <!-- RÉSUMÉ EXÉCUTIF -->
        ${generateExecutiveSummaryHTML(data)}

        <!-- FOOTER -->
        <div class="footer">
            Diagnostic Photovoltaïque - Expertise Indépendante depuis 2012<br>
            Ce rapport est confidentiel et destiné exclusivement à ${audit.client_name}<br>
            Document généré le ${currentDate} - Référence ${reportNumber}
        </div>
    </div>

    <script>
        if (window.location.search.includes('autoprint=true')) {
            window.onload = () => window.print();
        }
    </script>
</body>
</html>
  `;
}

// ============================================================================
// GÉNÉRATION SECTIONS MODULES
// ============================================================================
function generateModuleSectionsHTML(data: any): string {
  let html = '';
  let sectionNumber = 2;

  // MODULE EL
  if (data.modules.EL) {
    const { stats, byString, byDefectType, bySeverity, criticalPhotos } = data.modules.EL;
    
    html += `
      <div class="section page-break">
        <div class="section-title">${sectionNumber}. MODULE ÉLECTROLUMINESCENCE (EL)</div>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${stats.total}</div>
            <div class="stat-label">Modules analysés</div>
          </div>
          <div class="stat-card ${stats.defects === 0 ? 'success' : 'warning'}">
            <div class="stat-value">${stats.defects}</div>
            <div class="stat-label">Modules défectueux</div>
          </div>
          <div class="stat-card ${stats.critical > 0 ? 'critical' : 'success'}">
            <div class="stat-value">${stats.defectRate}%</div>
            <div class="stat-label">Taux de défauts</div>
          </div>
          <div class="stat-card ${stats.critical > 0 ? 'critical' : 'success'}">
            <div class="stat-value">${stats.critical}</div>
            <div class="stat-label">Défauts critiques</div>
          </div>
        </div>

        <h3 style="color: #2d5016; font-size: 11pt; margin: 15px 0 10px 0;">Répartition par type de défaut</h3>
        <table>
          <tr>
            <th>Type de défaut</th>
            <th>Nombre</th>
            <th>Pourcentage</th>
          </tr>
          ${Object.entries(byDefectType).map(([type, count]: [string, any]) => `
            <tr>
              <td>${type === 'none' ? 'Aucun défaut' : type}</td>
              <td>${count}</td>
              <td>${stats.total > 0 ? ((count / stats.total) * 100).toFixed(1) : '0'}%</td>
            </tr>
          `).join('')}
        </table>

        <h3 style="color: #2d5016; font-size: 11pt; margin: 15px 0 10px 0;">Cartographie par string</h3>
        ${Object.entries(byString).map(([stringNum, modules]: [string, any]) => `
          <div class="string-map">
            <div class="string-header">String ${stringNum} (${modules.length} modules)</div>
            <div class="modules-grid">
              ${modules.map((m: any) => {
                const sev = m.severity_level || 0;
                let className = 'module-ok';
                if (sev === 1) className = 'module-minor';
                else if (sev === 2) className = 'module-moderate';
                else if (sev === 3) className = 'module-severe';
                else if (sev === 4) className = 'module-critical';
                return `<div class="module-cell ${className}">${m.position_in_string}</div>`;
              }).join('')}
            </div>
          </div>
        `).join('')}

        ${criticalPhotos.length > 0 ? `
          <h3 style="color: #2d5016; font-size: 11pt; margin: 15px 0 10px 0;">Photos critiques (Top ${criticalPhotos.length})</h3>
          <div class="photos-grid">
            ${criticalPhotos.map((photo: any) => `
              <div class="photo-card">
                ${photo.base64Image ? `<img src="${photo.base64Image}" alt="Photo critique">` : ''}
                <div class="photo-info">
                  <span class="severity-badge severity-${photo.severity_level >= 4 ? 'critical' : 'severe'}">
                    Sév. ${photo.severity_level}/4
                  </span>
                  String ${photo.string_number} - Pos. ${photo.position_in_string}<br>
                  ${photo.defect_type || 'Défaut non spécifié'}
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${generateELRecommendations(stats, bySeverity)}
      </div>
    `;
    sectionNumber++;
  }

  // MODULE IV
  if (data.modules.IV) {
    const { stats, byString } = data.modules.IV;
    
    html += `
      <div class="section page-break">
        <div class="section-title">${sectionNumber}. MODULE COURBES I-V</div>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${stats.count}</div>
            <div class="stat-label">Mesures réalisées</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.voc.avg.toFixed(2)} V</div>
            <div class="stat-label">Voc moyen</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.isc.avg.toFixed(2)} A</div>
            <div class="stat-label">Isc moyen</div>
          </div>
          <div class="stat-card ${stats.ff.avg < 0.70 ? 'critical' : stats.ff.avg < 0.75 ? 'warning' : 'success'}">
            <div class="stat-value">${(stats.ff.avg * 100).toFixed(1)}%</div>
            <div class="stat-label">Fill Factor moyen</div>
          </div>
        </div>

        <h3 style="color: #2d5016; font-size: 11pt; margin: 15px 0 10px 0;">Statistiques de performance</h3>
        <table>
          <tr>
            <th>Paramètre</th>
            <th>Moyenne</th>
            <th>Min</th>
            <th>Max</th>
            <th>Écart-type</th>
          </tr>
          <tr>
            <td>Voc (V)</td>
            <td>${stats.voc.avg.toFixed(2)}</td>
            <td>${stats.voc.min.toFixed(2)}</td>
            <td>${stats.voc.max.toFixed(2)}</td>
            <td>${stats.voc.std.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Isc (A)</td>
            <td>${stats.isc.avg.toFixed(2)}</td>
            <td>${stats.isc.min.toFixed(2)}</td>
            <td>${stats.isc.max.toFixed(2)}</td>
            <td>${stats.isc.std.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Pmax (W)</td>
            <td>${stats.pmax.avg.toFixed(2)}</td>
            <td>${stats.pmax.min.toFixed(2)}</td>
            <td>${stats.pmax.max.toFixed(2)}</td>
            <td>${stats.pmax.std.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Fill Factor</td>
            <td>${(stats.ff.avg * 100).toFixed(1)}%</td>
            <td>${(stats.ff.min * 100).toFixed(1)}%</td>
            <td>${(stats.ff.max * 100).toFixed(1)}%</td>
            <td>${(stats.ff.std * 100).toFixed(1)}%</td>
          </tr>
        </table>

        <h3 style="color: #2d5016; font-size: 11pt; margin: 15px 0 10px 0;">Performance par string</h3>
        ${Object.entries(byString).map(([stringName, measurements]: [string, any]) => {
          const avgPmax = measurements.reduce((sum: number, m: any) => sum + (m.pmax || 0), 0) / measurements.length;
          const avgFf = measurements.reduce((sum: number, m: any) => sum + (m.fill_factor || 0), 0) / measurements.length;
          return `
            <div style="margin: 10px 0; padding: 10px; background: #f9f9f9; border-left: 3px solid #2d5016;">
              <strong>${stringName}</strong> (${measurements.length} mesures)<br>
              Pmax moyen: ${avgPmax.toFixed(2)} W | FF moyen: ${(avgFf * 100).toFixed(1)}%
            </div>
          `;
        }).join('')}

        ${generateIVRecommendations(stats)}
      </div>
    `;
    sectionNumber++;
  }

  // MODULE VISUAL
  if (data.modules.VISUAL) {
    const { stats, inspections } = data.modules.VISUAL;
    
    html += `
      <div class="section page-break">
        <div class="section-title">${sectionNumber}. MODULE INSPECTIONS VISUELLES</div>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${stats.total}</div>
            <div class="stat-label">Inspections</div>
          </div>
          <div class="stat-card ${stats.defects > 0 ? 'warning' : 'success'}">
            <div class="stat-value">${stats.defects}</div>
            <div class="stat-label">Défauts trouvés</div>
          </div>
          <div class="stat-card ${stats.critical > 0 ? 'critical' : 'success'}">
            <div class="stat-value">${stats.critical}</div>
            <div class="stat-label">Défauts critiques</div>
          </div>
          <div class="stat-card ${stats.high > 0 ? 'warning' : 'success'}">
            <div class="stat-value">${stats.high}</div>
            <div class="stat-label">Défauts importants</div>
          </div>
        </div>

        ${inspections.length > 0 ? `
        <h3 style="color: #2d5016; font-size: 11pt; margin: 15px 0 10px 0;">Défauts identifiés</h3>
        <table>
          <tr>
            <th>Date</th>
            <th>Type inspection</th>
            <th>Sévérité</th>
            <th>Observations</th>
          </tr>
          ${inspections.filter((i: any) => i.defect_found === 1).slice(0, 15).map((i: any) => `
            <tr>
              <td>${new Date(i.created_at).toLocaleDateString('fr-FR')}</td>
              <td>${i.inspection_type || 'Non spécifié'}</td>
              <td>
                <span class="severity-badge severity-${i.severity_level >= 4 ? 'critical' : 'severe'}">
                  ${i.severity_level || 0}/5
                </span>
              </td>
              <td>${i.notes ? i.notes.substring(0, 60) + (i.notes.length > 60 ? '...' : '') : '-'}</td>
            </tr>
          `).join('')}
        </table>
        ` : '<p style="color: #666; font-style: italic;">Aucun défaut visuel détecté</p>'}

        ${generateVisualRecommendations(stats)}
      </div>
    `;
    sectionNumber++;
  }

  // MODULE ISOLATION
  if (data.modules.ISOLATION) {
    const { stats, tests } = data.modules.ISOLATION;
    
    html += `
      <div class="section page-break">
        <div class="section-title">${sectionNumber}. MODULE TESTS D'ISOLATION</div>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${stats.total}</div>
            <div class="stat-label">Tests réalisés</div>
          </div>
          <div class="stat-card ${stats.failed === 0 ? 'success' : 'critical'}">
            <div class="stat-value">${stats.conformityRate}%</div>
            <div class="stat-label">Taux de conformité</div>
          </div>
          <div class="stat-card success">
            <div class="stat-value">${stats.passed}</div>
            <div class="stat-label">Tests conformes</div>
          </div>
          <div class="stat-card ${stats.failed > 0 ? 'critical' : 'success'}">
            <div class="stat-value">${stats.failed}</div>
            <div class="stat-label">Tests non conformes</div>
          </div>
        </div>

        ${tests.length > 0 ? `
        <h3 style="color: #2d5016; font-size: 11pt; margin: 15px 0 10px 0;">Résultats des tests</h3>
        <table>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Tension (V)</th>
            <th>Résistance (MΩ)</th>
            <th>Seuil (MΩ)</th>
            <th>Résultat</th>
          </tr>
          ${tests.slice(0, 15).map((t: any) => `
            <tr>
              <td>${new Date(t.created_at).toLocaleDateString('fr-FR')}</td>
              <td>${t.test_type || 'Non spécifié'}</td>
              <td>${t.test_voltage || 'N/A'}</td>
              <td>${t.resistance_value ? t.resistance_value.toFixed(2) : 'N/A'}</td>
              <td>${t.pass_threshold ? t.pass_threshold.toFixed(2) : 'N/A'}</td>
              <td>
                <span class="severity-badge ${t.test_result === 'pass' ? 'success' : 'severity-critical'}">
                  ${t.test_result === 'pass' ? 'CONFORME' : 'NON CONFORME'}
                </span>
              </td>
            </tr>
          `).join('')}
        </table>
        ` : '<p style="color: #666; font-style: italic;">Aucun test d\'isolation réalisé</p>'}

        ${generateIsolationRecommendations(stats)}
      </div>
    `;
    sectionNumber++;
  }

  return html;
}

// ============================================================================
// RECOMMANDATIONS PAR MODULE
// ============================================================================
function generateELRecommendations(stats: any, bySeverity: any): string {
  let html = '';

  if (bySeverity.critical > 0) {
    html += `
      <div class="reco-box critical">
        <div class="reco-title">⚠️ INTERVENTION URGENTE REQUISE</div>
        <ul>
          <li><strong>${bySeverity.critical} module(s) en défaut critique</strong> détecté(s)</li>
          <li>Remplacement immédiat des modules défaillants</li>
          <li>Thermographie IR complémentaire recommandée</li>
          <li>Risque d'arc électrique et de propagation</li>
        </ul>
      </div>
    `;
  }

  if (bySeverity.severe > 0) {
    html += `
      <div class="reco-box warning">
        <div class="reco-title">⚡ SURVEILLANCE RENFORCÉE</div>
        <ul>
          <li>${bySeverity.severe} module(s) avec défauts sévères</li>
          <li>Planifier intervention sous 3 mois</li>
          <li>Monitoring de production recommandé</li>
        </ul>
      </div>
    `;
  }

  if (stats.defectRate > 15) {
    html += `
      <div class="reco-box warning">
        <div class="reco-title">📊 TAUX DE DÉFAUTS ÉLEVÉ</div>
        <ul>
          <li>Taux de défauts: ${stats.defectRate}% (seuil critique: 15%)</li>
          <li>Audit approfondi de l'installation recommandé</li>
          <li>Vérifier historique de maintenance et garanties constructeur</li>
        </ul>
      </div>
    `;
  }

  if (html === '') {
    html = `
      <div class="reco-box info">
        <div class="reco-title">✅ INSTALLATION CONFORME</div>
        <ul>
          <li>Aucun défaut critique détecté</li>
          <li>Poursuivre la maintenance préventive annuelle</li>
          <li>Prochain contrôle EL recommandé dans 2 ans</li>
        </ul>
      </div>
    `;
  }

  return html;
}

function generateIVRecommendations(stats: any): string {
  let html = '';

  if (stats.ff.avg < 0.70) {
    html += `
      <div class="reco-box critical">
        <div class="reco-title">⚠️ FILL FACTOR CRITIQUE</div>
        <ul>
          <li>FF moyen: ${(stats.ff.avg * 100).toFixed(1)}% (seuil minimal: 70%)</li>
          <li>Vérifier connexions et câblages</li>
          <li>Contrôler diodes bypass</li>
          <li>Rechercher mismatch entre modules</li>
          <li>Pertes de production estimées: >20%</li>
        </ul>
      </div>
    `;
  } else if (stats.ff.avg < 0.75) {
    html += `
      <div class="reco-box warning">
        <div class="reco-title">⚡ PERFORMANCES SOUS-OPTIMALES</div>
        <ul>
          <li>FF moyen: ${(stats.ff.avg * 100).toFixed(1)}% (objectif: ≥75%)</li>
          <li>Optimisation possible de l'installation</li>
          <li>Vérifier résistances série et parallèle</li>
          <li>Pertes de production estimées: 10-20%</li>
        </ul>
      </div>
    `;
  }

  if (parseFloat(stats.avgDeviation) > 10) {
    html += `
      <div class="reco-box warning">
        <div class="reco-title">📊 DISPERSION ÉLEVÉE</div>
        <ul>
          <li>Écart moyen entre modules: ${stats.avgDeviation}% (seuil: <10%)</li>
          <li>Mismatch détecté - impact sur performances</li>
          <li>Vérifier homogénéité des strings</li>
        </ul>
      </div>
    `;
  }

  if (html === '') {
    html = `
      <div class="reco-box info">
        <div class="reco-title">✅ PERFORMANCES CONFORMES</div>
        <ul>
          <li>Fill Factor moyen: ${(stats.ff.avg * 100).toFixed(1)}% (excellent)</li>
          <li>Dispersion: ${stats.avgDeviation}% (acceptable)</li>
          <li>Installation performante selon standards IEC 60891</li>
        </ul>
      </div>
    `;
  }

  return html;
}

function generateVisualRecommendations(stats: any): string {
  let html = '';

  if (stats.critical > 0) {
    html += `
      <div class="reco-box critical">
        <div class="reco-title">⚠️ DÉFAUTS CRITIQUES DE SÉCURITÉ</div>
        <ul>
          <li>${stats.critical} défaut(s) critique(s) détecté(s)</li>
          <li>Intervention immédiate requise</li>
          <li>Risque électrique et/ou incendie</li>
          <li>Mise en conformité NF C 15-100 obligatoire</li>
        </ul>
      </div>
    `;
  }

  if (stats.high > 0) {
    html += `
      <div class="reco-box warning">
        <div class="reco-title">⚡ DÉFAUTS IMPORTANTS</div>
        <ul>
          <li>${stats.high} défaut(s) important(s) identifié(s)</li>
          <li>Correction recommandée sous 6 mois</li>
          <li>Surveillance de l'évolution nécessaire</li>
        </ul>
      </div>
    `;
  }

  if (html === '') {
    html = `
      <div class="reco-box info">
        <div class="reco-title">✅ INSTALLATION CONFORME</div>
        <ul>
          <li>Aucun défaut visuel majeur</li>
          <li>Installation conforme NF C 15-100</li>
          <li>Contrôle visuel annuel recommandé</li>
        </ul>
      </div>
    `;
  }

  return html;
}

function generateIsolationRecommendations(stats: any): string {
  let html = '';

  if (stats.failed > 0) {
    html += `
      <div class="reco-box critical">
        <div class="reco-title">⚠️ DÉFAUTS D'ISOLATION CRITIQUES</div>
        <ul>
          <li>${stats.failed} test(s) non conforme(s)</li>
          <li>Intervention électrique urgente requise</li>
          <li>Risque d'électrocution</li>
          <li>Installation non conforme NF C 15-100</li>
          <li>Rechercher défaut d'isolation et corriger</li>
        </ul>
      </div>
    `;
  }

  if (stats.avgResistance < 50 && stats.avgResistance >= 1) {
    html += `
      <div class="reco-box warning">
        <div class="reco-title">⚡ RÉSISTANCE LIMITE</div>
        <ul>
          <li>Résistance moyenne: ${stats.avgResistance.toFixed(2)} MΩ</li>
          <li>Conforme (>1 MΩ) mais sous seuil recommandé (≥50 MΩ)</li>
          <li>Surveillance renforcée nécessaire</li>
          <li>Vérifier évolution dans le temps</li>
        </ul>
      </div>
    `;
  }

  if (html === '') {
    html = `
      <div class="reco-box info">
        <div class="reco-title">✅ ISOLATION CONFORME</div>
        <ul>
          <li>Tous les tests conformes NF C 15-100</li>
          <li>Résistance moyenne: ${stats.avgResistance.toFixed(2)} MΩ (excellent)</li>
          <li>Prochain contrôle dans 1 an</li>
        </ul>
      </div>
    `;
  }

  return html;
}

// ============================================================================
// RÉSUMÉ EXÉCUTIF
// ============================================================================
function generateExecutiveSummaryHTML(data: any): string {
  const criticalIssues: string[] = [];
  const warnings: string[] = [];
  const positives: string[] = [];

  // Analyse EL
  if (data.modules.EL) {
    const { stats, bySeverity } = data.modules.EL;
    if (bySeverity.critical > 0) {
      criticalIssues.push(`${bySeverity.critical} module(s) EL en défaut critique`);
    }
    if (stats.defectRate > 15) {
      warnings.push(`Taux de défauts EL élevé: ${stats.defectRate}%`);
    }
    if (bySeverity.critical === 0 && stats.defectRate < 5) {
      positives.push('Modules EL en excellent état');
    }
  }

  // Analyse IV
  if (data.modules.IV) {
    const { stats } = data.modules.IV;
    if (stats.ff.avg < 0.70) {
      criticalIssues.push(`Fill Factor critique: ${(stats.ff.avg * 100).toFixed(1)}%`);
    } else if (stats.ff.avg < 0.75) {
      warnings.push(`Fill Factor sous-optimal: ${(stats.ff.avg * 100).toFixed(1)}%`);
    } else {
      positives.push(`Performances électriques conformes (FF: ${(stats.ff.avg * 100).toFixed(1)}%)`);
    }
  }

  // Analyse VISUAL
  if (data.modules.VISUAL) {
    const { stats } = data.modules.VISUAL;
    if (stats.critical > 0) {
      criticalIssues.push(`${stats.critical} défaut(s) visuel(s) critique(s)`);
    }
    if (stats.high > 0) {
      warnings.push(`${stats.high} défaut(s) visuel(s) important(s)`);
    }
    if (stats.critical === 0 && stats.high === 0) {
      positives.push('Installation visuellement conforme NF C 15-100');
    }
  }

  // Analyse ISOLATION
  if (data.modules.ISOLATION) {
    const { stats } = data.modules.ISOLATION;
    if (stats.failed > 0) {
      criticalIssues.push(`${stats.failed} test(s) d'isolation non conforme(s)`);
    }
    if (stats.avgResistance < 50 && stats.avgResistance >= 1) {
      warnings.push(`Résistance d'isolation limite: ${stats.avgResistance.toFixed(2)} MΩ`);
    }
    if (stats.failed === 0 && stats.avgResistance >= 50) {
      positives.push(`Isolation excellente: ${stats.avgResistance.toFixed(2)} MΩ`);
    }
  }

  return `
    <div class="executive-summary">
      <div class="summary-title">📋 RÉSUMÉ EXÉCUTIF</div>
      
      ${criticalIssues.length > 0 ? `
        <div class="reco-box critical" style="margin: 10px 0;">
          <div class="reco-title">⚠️ POINTS CRITIQUES (${criticalIssues.length})</div>
          <ul>
            ${criticalIssues.map(issue => `<li>${issue}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      
      ${warnings.length > 0 ? `
        <div class="reco-box warning" style="margin: 10px 0;">
          <div class="reco-title">⚡ POINTS D'ATTENTION (${warnings.length})</div>
          <ul>
            ${warnings.map(warning => `<li>${warning}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      
      ${positives.length > 0 ? `
        <div class="reco-box info" style="margin: 10px 0;">
          <div class="reco-title">✅ POINTS POSITIFS (${positives.length})</div>
          <ul>
            ${positives.map(positive => `<li>${positive}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      <p style="margin-top: 15px; padding: 12px; background: white; border-left: 4px solid #2d5016; font-size: 10pt;">
        <strong>Recommandation globale DiagPV :</strong><br>
        ${getGlobalRecommendation(criticalIssues, warnings, positives)}
      </p>
    </div>
  `;
}

function getGlobalRecommendation(critical: string[], warnings: string[], positives: string[]): string {
  if (critical.length > 0) {
    return `Installation nécessitant une <strong>intervention corrective urgente</strong>. 
            ${critical.length} anomalie(s) critique(s) détectée(s) présentant des risques de sécurité et/ou de perte de production significative. 
            Nous recommandons une action immédiate sur les points critiques identifiés avant toute remise en service.`;
  } else if (warnings.length > 0) {
    return `Installation globalement satisfaisante avec ${warnings.length} point(s) d'attention nécessitant surveillance et intervention planifiée. 
            Un suivi régulier est recommandé pour éviter la dégradation des performances. Intervention recommandée sous 6 mois.`;
  } else {
    return `Installation en <strong>bon état général</strong>. Aucune anomalie critique détectée. 
            Les ${positives.length} point(s) contrôlé(s) sont conformes aux normes en vigueur (IEC 62446-1, NF C 15-100). 
            Maintenance préventive recommandée selon le planning habituel pour garantir la durabilité de l'installation.`;
  }
}

export default consolidatedFullRoutes;
