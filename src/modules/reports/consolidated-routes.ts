import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
};

const consolidatedReportsRoutes = new Hono<{ Bindings: Bindings }>();

// ============================================================================
// GET /api/reports/consolidated/:audit_token - Générer rapport consolidé
// ============================================================================
consolidatedReportsRoutes.get('/:audit_token', async (c) => {
  try {
    const { DB } = c.env;
    const auditToken = c.req.param('audit_token');

    // Récupérer audit master
    const audit = await DB.prepare(`
      SELECT * FROM audits WHERE audit_token = ?
    `).bind(auditToken).first();

    if (!audit) {
      return c.json({ error: 'Audit introuvable' }, 404);
    }

    const modulesEnabled = JSON.parse(audit.modules_enabled as string);

    // Récupérer données de chaque module activé
    const reportData: any = {
      audit,
      modules: {}
    };

    // Module EL
    if (modulesEnabled.includes('EL')) {
      const elAudit = await DB.prepare(`
        SELECT el.* FROM audits a
        LEFT JOIN el_audits el ON a.audit_token = el.audit_token
        WHERE a.audit_token = ?
      `).bind(auditToken).first();

      const elModules = await DB.prepare(`
        SELECT * FROM el_modules WHERE audit_token = ?
        ORDER BY string_number, position_in_string
      `).bind(auditToken).all();

      // Statistiques EL
      const elStats = await DB.prepare(`
        SELECT 
          COUNT(*) as total_modules,
          SUM(CASE WHEN defect_type = 'none' THEN 1 ELSE 0 END) as modules_ok,
          SUM(CASE WHEN defect_type != 'none' THEN 1 ELSE 0 END) as modules_defective,
          SUM(CASE WHEN severity_level >= 3 THEN 1 ELSE 0 END) as modules_critical,
          ROUND(AVG(CASE WHEN severity_level > 0 THEN severity_level END), 2) as avg_severity
        FROM el_modules
        WHERE audit_token = ?
      `).bind(auditToken).first();

      reportData.modules.EL = {
        audit: elAudit,
        modules: elModules.results || [],
        stats: elStats
      };
    }

    // Module I-V
    if (modulesEnabled.includes('IV')) {
      const ivMeasurements = await DB.prepare(`
        SELECT * FROM iv_measurements 
        WHERE audit_token = ?
        ORDER BY created_at DESC
      `).bind(auditToken).all();

      // Statistiques I-V
      const ivStats = await DB.prepare(`
        SELECT 
          COUNT(*) as total_measurements,
          ROUND(AVG(isc), 2) as avg_isc,
          ROUND(AVG(voc), 2) as avg_voc,
          ROUND(AVG(pmax), 2) as avg_pmax,
          ROUND(AVG(fill_factor), 2) as avg_ff,
          MIN(pmax) as min_pmax,
          MAX(pmax) as max_pmax
        FROM iv_measurements
        WHERE audit_token = ?
      `).bind(auditToken).first();

      reportData.modules.IV = {
        measurements: ivMeasurements.results || [],
        stats: ivStats
      };
    }

    // Module VISUAL
    if (modulesEnabled.includes('VISUAL')) {
      const visualInspections = await DB.prepare(`
        SELECT * FROM visual_inspections 
        WHERE audit_token = ?
        ORDER BY created_at DESC
      `).bind(auditToken).all();

      // Statistiques Visual
      const visualStats = await DB.prepare(`
        SELECT 
          COUNT(*) as total_inspections,
          COUNT(CASE WHEN defect_found = 1 THEN 1 END) as total_defects,
          COUNT(CASE WHEN severity_level >= 4 THEN 1 END) as critical_defects,
          COUNT(CASE WHEN severity_level = 3 THEN 1 END) as high_defects,
          COUNT(CASE WHEN severity_level = 2 THEN 1 END) as medium_defects,
          COUNT(CASE WHEN severity_level = 1 THEN 1 END) as low_defects
        FROM visual_inspections
        WHERE audit_token = ?
      `).bind(auditToken).first();

      reportData.modules.VISUAL = {
        inspections: visualInspections.results || [],
        stats: visualStats
      };
    }

    // Module ISOLATION
    if (modulesEnabled.includes('ISOLATION')) {
      const isolationTests = await DB.prepare(`
        SELECT * FROM isolation_tests 
        WHERE audit_token = ?
        ORDER BY created_at DESC
      `).bind(auditToken).all();

      // Statistiques Isolation
      const isolationStats = await DB.prepare(`
        SELECT 
          COUNT(*) as total_tests,
          COUNT(CASE WHEN test_result = 'pass' THEN 1 END) as passed,
          COUNT(CASE WHEN test_result != 'pass' THEN 1 END) as failed,
          ROUND(AVG(resistance_value), 2) as avg_resistance,
          MIN(resistance_value) as min_resistance,
          MAX(resistance_value) as max_resistance
        FROM isolation_tests
        WHERE audit_token = ?
      `).bind(auditToken).first();

      reportData.modules.ISOLATION = {
        tests: isolationTests.results || [],
        stats: isolationStats
      };
    }

    // Générer HTML
    const html = generateConsolidatedReportHTML(reportData);

    return c.html(html);

  } catch (error: any) {
    console.error('Erreur génération rapport consolidé:', error);
    return c.json({ 
      error: 'Erreur lors de la génération du rapport consolidé',
      details: error.message 
    }, 500);
  }
});

// ============================================================================
// Fonction génération HTML Rapport Consolidé
// ============================================================================
function generateConsolidatedReportHTML(data: any): string {
  const audit = data.audit;
  const modules = data.modules;
  
  const reportNumber = `RP-${audit.id.toString().padStart(6, '0')}`;
  const currentDate = new Date().toLocaleDateString('fr-FR');
  const auditDate = new Date(audit.audit_date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Configuration installation
  const config = JSON.parse(audit.configuration_json || '{}');

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport Consolidé ${reportNumber}</title>
    <style>
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
            .page-break { page-break-after: always; }
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Arial', sans-serif;
            font-size: 10pt;
            line-height: 1.5;
            color: #333;
            background: white;
        }
        
        .container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 15mm;
            background: white;
        }
        
        /* En-tête */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #2d5016;
        }
        
        .logo-text {
            font-size: 22pt;
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
            font-size: 18pt;
            font-weight: bold;
            color: #2d5016;
            text-align: right;
        }
        
        /* Titre */
        .doc-title {
            text-align: center;
            font-size: 16pt;
            font-weight: bold;
            color: #2d5016;
            margin: 25px 0;
            text-transform: uppercase;
        }
        
        /* Sections */
        .section {
            margin-bottom: 20px;
        }
        
        .section-title {
            font-size: 12pt;
            font-weight: bold;
            color: #2d5016;
            margin-bottom: 10px;
            padding: 8px 12px;
            background: #f0f4f0;
            border-left: 4px solid #2d5016;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 15px;
        }
        
        .info-item {
            padding: 8px;
            background: #f9f9f9;
            border-left: 2px solid #2d5016;
        }
        
        .info-label {
            font-size: 8pt;
            color: #666;
            text-transform: uppercase;
            font-weight: bold;
            margin-bottom: 3px;
        }
        
        .info-value {
            font-size: 10pt;
            color: #333;
            font-weight: bold;
        }
        
        /* Statistiques */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin: 15px 0;
        }
        
        .stat-card {
            text-align: center;
            padding: 12px;
            background: #f9f9f9;
            border: 2px solid #e0e0e0;
            border-radius: 5px;
        }
        
        .stat-value {
            font-size: 20pt;
            font-weight: bold;
            color: #2d5016;
        }
        
        .stat-label {
            font-size: 8pt;
            color: #666;
            text-transform: uppercase;
            margin-top: 5px;
        }
        
        /* Tableaux */
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
        
        /* Résumé exécutif */
        .executive-summary {
            background: #fff9e6;
            border: 2px solid #ffd700;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
        }
        
        .summary-title {
            font-size: 12pt;
            font-weight: bold;
            color: #2d5016;
            margin-bottom: 10px;
        }
        
        /* Badges sévérité */
        .severity-critical { background: #ff4444; color: white; padding: 3px 8px; border-radius: 3px; font-size: 8pt; }
        .severity-high { background: #ff9800; color: white; padding: 3px 8px; border-radius: 3px; font-size: 8pt; }
        .severity-medium { background: #ffc107; color: black; padding: 3px 8px; border-radius: 3px; font-size: 8pt; }
        .severity-low { background: #4caf50; color: white; padding: 3px 8px; border-radius: 3px; font-size: 8pt; }
        
        /* Footer */
        .footer {
            margin-top: 40px;
            padding-top: 15px;
            border-top: 2px solid #e0e0e0;
            text-align: center;
            font-size: 7pt;
            color: #999;
        }
        
        /* Boutons */
        .actions {
            position: fixed;
            top: 20px;
            right: 20px;
            display: flex;
            gap: 10px;
            z-index: 1000;
        }
        
        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            font-weight: bold;
            cursor: pointer;
            font-size: 11pt;
            background: #2d5016;
            color: white;
        }
        
        .btn:hover { opacity: 0.8; }
    </style>
</head>
<body>
    <!-- Boutons d'action -->
    <div class="actions no-print">
        <button class="btn" onclick="window.print()">
            🖨️ Imprimer / PDF
        </button>
    </div>

    <div class="container">
        <!-- En-tête -->
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
            <div class="report-number">
                ${reportNumber}<br>
                <span style="font-size: 10pt; color: #666;">${currentDate}</span>
            </div>
        </div>

        <!-- Titre -->
        <div class="doc-title">
            RAPPORT D'AUDIT CONSOLIDÉ<br>
            <span style="font-size: 12pt; color: #666;">${audit.project_name}</span>
        </div>

        <!-- Informations générales -->
        <div class="section">
            <div class="section-title">1. INFORMATIONS GÉNÉRALES</div>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Client</div>
                    <div class="info-value">${audit.client_name}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Projet</div>
                    <div class="info-value">${audit.project_name}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Site</div>
                    <div class="info-value">${audit.location || 'Non renseigné'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Date audit</div>
                    <div class="info-value">${auditDate}</div>
                </div>
            </div>

            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Modules audités</div>
                    <div class="info-value">${JSON.parse(audit.modules_enabled).join(', ')}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Token audit</div>
                    <div class="info-value" style="font-size: 8pt;">${audit.audit_token}</div>
                </div>
            </div>
        </div>

        ${generateModuleSections(modules)}

        <!-- Résumé exécutif -->
        <div class="executive-summary">
            <div class="summary-title">📋 RÉSUMÉ EXÉCUTIF</div>
            ${generateExecutiveSummary(modules)}
        </div>

        <!-- Footer -->
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
// Génération sections par module
// ============================================================================
function generateModuleSections(modules: any): string {
  let html = '';
  let sectionNumber = 2;

  // Module EL
  if (modules.EL) {
    const { stats, modules: elModules } = modules.EL;
    html += `
      <div class="section page-break">
        <div class="section-title">${sectionNumber}. MODULE ÉLECTROLUMINESCENCE (EL)</div>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${stats.total_modules || 0}</div>
            <div class="stat-label">Modules analysés</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color: #4caf50;">${stats.modules_ok || 0}</div>
            <div class="stat-label">Sans défaut</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color: #ff9800;">${stats.modules_defective || 0}</div>
            <div class="stat-label">Avec défauts</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color: #ff4444;">${stats.modules_critical || 0}</div>
            <div class="stat-label">Critiques</div>
          </div>
        </div>

        ${elModules.length > 0 ? `
        <p style="margin: 10px 0;"><strong>Synthèse défauts détectés :</strong></p>
        <table>
          <tr>
            <th>String</th>
            <th>Position</th>
            <th>Type défaut</th>
            <th>Sévérité</th>
            <th>Commentaire</th>
          </tr>
          ${elModules.filter((m: any) => m.defect_type !== 'none').slice(0, 10).map((m: any) => `
            <tr>
              <td>String ${m.string_number}</td>
              <td>#${m.position_in_string}</td>
              <td>${m.defect_type}</td>
              <td><span class="severity-${getSeverityClass(m.severity_level)}">${m.severity_level}/5</span></td>
              <td>${m.comments || '-'}</td>
            </tr>
          `).join('')}
        </table>
        ${elModules.filter((m: any) => m.defect_type !== 'none').length > 10 ? `
          <p style="margin-top: 5px; font-size: 8pt; color: #666;">
            + ${elModules.filter((m: any) => m.defect_type !== 'none').length - 10} autres défauts (voir annexe détaillée)
          </p>
        ` : ''}
        ` : '<p style="color: #666; font-style: italic;">Aucune donnée EL disponible</p>'}
      </div>
    `;
    sectionNumber++;
  }

  // Module I-V
  if (modules.IV) {
    const { stats, measurements } = modules.IV;
    html += `
      <div class="section page-break">
        <div class="section-title">${sectionNumber}. MODULE COURBES I-V</div>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${stats.total_measurements || 0}</div>
            <div class="stat-label">Mesures réalisées</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.avg_isc || 'N/A'} A</div>
            <div class="stat-label">Isc moyen</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.avg_voc || 'N/A'} V</div>
            <div class="stat-label">Voc moyen</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.avg_pmax || 'N/A'} W</div>
            <div class="stat-label">Pmax moyen</div>
          </div>
        </div>

        ${measurements.length > 0 ? `
        <table>
          <tr>
            <th>String</th>
            <th>Isc (A)</th>
            <th>Voc (V)</th>
            <th>Pmax (W)</th>
            <th>FF (%)</th>
            <th>Date</th>
          </tr>
          ${measurements.slice(0, 10).map((m: any) => `
            <tr>
              <td>String ${m.string_id || m.module_id || 'N/A'}</td>
              <td>${m.isc ? m.isc.toFixed(2) : 'N/A'}</td>
              <td>${m.voc ? m.voc.toFixed(2) : 'N/A'}</td>
              <td>${m.pmax ? m.pmax.toFixed(2) : 'N/A'}</td>
              <td>${m.fill_factor ? m.fill_factor.toFixed(1) : 'N/A'}</td>
              <td>${new Date(m.created_at).toLocaleDateString('fr-FR')}</td>
            </tr>
          `).join('')}
        </table>
        ` : '<p style="color: #666; font-style: italic;">Aucune donnée I-V disponible</p>'}
      </div>
    `;
    sectionNumber++;
  }

  // Module VISUAL
  if (modules.VISUAL) {
    const { stats, inspections } = modules.VISUAL;
    html += `
      <div class="section page-break">
        <div class="section-title">${sectionNumber}. MODULE INSPECTIONS VISUELLES</div>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${stats.total_inspections || 0}</div>
            <div class="stat-label">Inspections</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.total_defects || 0}</div>
            <div class="stat-label">Défauts trouvés</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color: #ff4444;">${stats.critical_defects || 0}</div>
            <div class="stat-label">Critiques</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color: #ff9800;">${stats.high_defects || 0}</div>
            <div class="stat-label">Importants</div>
          </div>
        </div>

        ${inspections.length > 0 ? `
        <table>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Défauts</th>
            <th>Sévérité</th>
            <th>Observations</th>
          </tr>
          ${inspections.slice(0, 10).map((i: any) => `
            <tr>
              <td>${new Date(i.created_at).toLocaleDateString('fr-FR')}</td>
              <td>${i.inspection_type}</td>
              <td>${i.defect_found ? 'Oui' : 'Non'}</td>
              <td><span class="severity-${getSeverityClass(i.severity_level)}">${i.severity_level || 0}/5</span></td>
              <td>${i.notes ? i.notes.substring(0, 50) + '...' : '-'}</td>
            </tr>
          `).join('')}
        </table>
        ` : '<p style="color: #666; font-style: italic;">Aucune donnée visuelle disponible</p>'}
      </div>
    `;
    sectionNumber++;
  }

  // Module ISOLATION
  if (modules.ISOLATION) {
    const { stats, tests } = modules.ISOLATION;
    html += `
      <div class="section page-break">
        <div class="section-title">${sectionNumber}. MODULE TESTS D'ISOLATION</div>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${stats.total_tests || 0}</div>
            <div class="stat-label">Tests réalisés</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color: #4caf50;">${stats.passed || 0}</div>
            <div class="stat-label">Conformes</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color: #ff4444;">${stats.failed || 0}</div>
            <div class="stat-label">Non conformes</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.avg_resistance || 'N/A'} MΩ</div>
            <div class="stat-label">Résistance moy.</div>
          </div>
        </div>

        ${tests.length > 0 ? `
        <table>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Tension (V)</th>
            <th>Résistance (MΩ)</th>
            <th>Seuil (MΩ)</th>
            <th>Résultat</th>
          </tr>
          ${tests.slice(0, 10).map((t: any) => `
            <tr>
              <td>${new Date(t.created_at).toLocaleDateString('fr-FR')}</td>
              <td>${t.test_type}</td>
              <td>${t.test_voltage || 'N/A'}</td>
              <td>${t.resistance_value ? t.resistance_value.toFixed(2) : 'N/A'}</td>
              <td>${t.pass_threshold ? t.pass_threshold.toFixed(2) : 'N/A'}</td>
              <td><span class="severity-${t.test_result === 'pass' ? 'low' : 'critical'}">${t.test_result === 'pass' ? 'OK' : 'NOK'}</span></td>
            </tr>
          `).join('')}
        </table>
        ` : '<p style="color: #666; font-style: italic;">Aucune donnée isolation disponible</p>'}
      </div>
    `;
    sectionNumber++;
  }

  return html;
}

// ============================================================================
// Génération résumé exécutif
// ============================================================================
function generateExecutiveSummary(modules: any): string {
  let summary = '<ul style="margin-left: 20px; line-height: 2;">';

  if (modules.EL && modules.EL.stats) {
    const { stats } = modules.EL;
    const defectRate = stats.total_modules > 0 
      ? ((stats.modules_defective / stats.total_modules) * 100).toFixed(1)
      : '0';
    
    summary += `<li><strong>Électroluminescence :</strong> ${stats.total_modules} modules analysés, 
                ${stats.modules_defective} défauts détectés (${defectRate}%), 
                dont ${stats.modules_critical} critiques nécessitant intervention urgente.</li>`;
  }

  if (modules.IV && modules.IV.stats) {
    const { stats } = modules.IV;
    summary += `<li><strong>Courbes I-V :</strong> ${stats.total_measurements} mesures effectuées, 
                Pmax moyen ${stats.avg_pmax || 'N/A'} W, 
                performance conforme aux attentes du constructeur.</li>`;
  }

  if (modules.VISUAL && modules.VISUAL.stats) {
    const { stats } = modules.VISUAL;
    summary += `<li><strong>Inspections visuelles :</strong> ${stats.total_defects} défauts identifiés, 
                dont ${stats.critical_defects} critiques (risques sécurité/incendie).</li>`;
  }

  if (modules.ISOLATION && modules.ISOLATION.stats) {
    const { stats } = modules.ISOLATION;
    const conformityRate = stats.total_tests > 0
      ? ((stats.passed / stats.total_tests) * 100).toFixed(1)
      : '100';
    
    summary += `<li><strong>Tests isolation :</strong> ${stats.total_tests} tests réalisés, 
                ${stats.passed} conformes NF C 15-100 (${conformityRate}%), 
                résistance moyenne ${stats.avg_resistance || 'N/A'} MΩ.</li>`;
  }

  summary += '</ul>';
  
  summary += `
    <p style="margin-top: 15px; padding: 10px; background: white; border-left: 4px solid #2d5016;">
      <strong>Recommandation DiagPV :</strong> 
      ${getGlobalRecommendation(modules)}
    </p>
  `;

  return summary;
}

// ============================================================================
// Recommandation globale
// ============================================================================
function getGlobalRecommendation(modules: any): string {
  let criticalIssues = 0;
  
  if (modules.EL?.stats?.modules_critical) criticalIssues += modules.EL.stats.modules_critical;
  if (modules.VISUAL?.stats?.critical_defects) criticalIssues += modules.VISUAL.stats.critical_defects;
  if (modules.ISOLATION?.stats?.failed) criticalIssues += modules.ISOLATION.stats.failed;

  if (criticalIssues > 5) {
    return `Installation nécessitant une intervention corrective urgente. 
            ${criticalIssues} anomalies critiques détectées présentant des risques de sécurité et/ou de perte de production significative. 
            Nous recommandons une action immédiate sur les points critiques identifiés.`;
  } else if (criticalIssues > 0) {
    return `Installation globalement satisfaisante avec ${criticalIssues} point(s) d'attention nécessitant surveillance et intervention planifiée. 
            Un suivi régulier est recommandé pour éviter la dégradation des performances.`;
  } else {
    return `Installation en bon état général. Aucune anomalie critique détectée. 
            Maintenance préventive recommandée selon le planning habituel pour garantir la durabilité de l'installation.`;
  }
}

// ============================================================================
// Helper sévérité
// ============================================================================
function getSeverityClass(level: number): string {
  if (level >= 4) return 'critical';
  if (level >= 3) return 'high';
  if (level >= 2) return 'medium';
  return 'low';
}

export default consolidatedReportsRoutes;
