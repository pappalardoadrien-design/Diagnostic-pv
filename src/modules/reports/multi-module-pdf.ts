import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
};

const multiModulePdfRoutes = new Hono<{ Bindings: Bindings }>();

// ============================================================================
// GET /api/reports/multi-module/:audit_token - Rapport consolidé PDF
// ============================================================================
multiModulePdfRoutes.get('/:audit_token', async (c) => {
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

    const modulesEnabled = JSON.parse(audit.modules_enabled as string || '[]');
    
    // Récupérer données de chaque module activé
    const reportData: any = {
      audit,
      modules: {},
      stats: {}
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
        ORDER BY id
      `).bind(auditToken).all();

      reportData.modules.el = {
        audit: elAudit,
        modules: elModules.results || [],
        stats: {
          total: elModules.results?.length || 0,
          ok: elModules.results?.filter((m: any) => m.defect_type === 'none').length || 0,
          defects: elModules.results?.filter((m: any) => m.defect_type !== 'none').length || 0,
          critical: elModules.results?.filter((m: any) => m.severity_level >= 3).length || 0
        }
      };
    }

    // Module I-V
    if (modulesEnabled.includes('IV')) {
      const ivMeasurements = await DB.prepare(`
        SELECT * FROM iv_measurements WHERE audit_token = ?
        ORDER BY id DESC
      `).bind(auditToken).all();

      reportData.modules.iv = {
        measurements: ivMeasurements.results || [],
        stats: {
          total: ivMeasurements.results?.length || 0,
          avg_voc: calculateAverage(ivMeasurements.results, 'voc'),
          avg_isc: calculateAverage(ivMeasurements.results, 'isc'),
          avg_ff: calculateAverage(ivMeasurements.results, 'fill_factor')
        }
      };
    }

    // Module VISUAL
    if (modulesEnabled.includes('VISUAL')) {
      const visualInspections = await DB.prepare(`
        SELECT * FROM visual_inspections WHERE audit_token = ?
        ORDER BY id DESC
      `).bind(auditToken).all();

      reportData.modules.visual = {
        inspections: visualInspections.results || [],
        stats: {
          total: visualInspections.results?.length || 0,
          defects_found: visualInspections.results?.reduce((sum: number, i: any) => sum + (i.defects_found || 0), 0) || 0,
          critical: visualInspections.results?.filter((i: any) => i.severity === 'critical').length || 0
        }
      };
    }

    // Module ISOLATION
    if (modulesEnabled.includes('ISOLATION')) {
      const isolationTests = await DB.prepare(`
        SELECT * FROM isolation_tests WHERE audit_token = ?
        ORDER BY id DESC
      `).bind(auditToken).all();

      reportData.modules.isolation = {
        tests: isolationTests.results || [],
        stats: {
          total: isolationTests.results?.length || 0,
          passed: isolationTests.results?.filter((t: any) => t.pass_threshold && t.resistance >= t.pass_threshold).length || 0,
          failed: isolationTests.results?.filter((t: any) => t.pass_threshold && t.resistance < t.pass_threshold).length || 0
        }
      };
    }

    // Générer HTML
    const html = generateMultiModulePDF(reportData);

    return c.html(html);

  } catch (error: any) {
    console.error('Erreur génération rapport multi-module:', error);
    return c.json({ 
      error: 'Erreur lors de la génération du rapport',
      details: error.message 
    }, 500);
  }
});

// ============================================================================
// Fonction helper calcul moyenne
// ============================================================================
function calculateAverage(data: any[] | undefined, field: string): number {
  if (!data || data.length === 0) return 0;
  const values = data.filter(d => d[field] != null).map(d => parseFloat(d[field]));
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// ============================================================================
// Génération HTML rapport multi-modules
// ============================================================================
function generateMultiModulePDF(data: any): string {
  const reportDate = new Date().toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const reportNumber = `RM-${data.audit.id.toString().padStart(6, '0')}`;

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport Multi-Modules ${reportNumber}</title>
    <style>
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
            .page-break { page-break-after: always; }
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Arial', sans-serif;
            font-size: 11pt;
            line-height: 1.6;
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
            border-bottom: 4px solid #2d5016;
        }
        
        .logo-text {
            font-size: 28pt;
            font-weight: bold;
            color: #2d5016;
            margin-bottom: 5px;
        }
        
        .logo-subtitle {
            font-size: 11pt;
            color: #666;
            margin-bottom: 10px;
        }
        
        .company-info {
            font-size: 9pt;
            color: #666;
            line-height: 1.8;
        }
        
        .report-info {
            text-align: right;
        }
        
        .report-number {
            font-size: 22pt;
            font-weight: bold;
            color: #2d5016;
            margin-bottom: 5px;
        }
        
        .report-date {
            font-size: 10pt;
            color: #666;
        }
        
        /* Titre */
        .doc-title {
            text-align: center;
            font-size: 20pt;
            font-weight: bold;
            color: #2d5016;
            margin: 30px 0;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        
        /* Informations projet */
        .project-info {
            background: #f5f5f5;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            border-left: 5px solid #2d5016;
        }
        
        .project-info h2 {
            color: #2d5016;
            font-size: 16pt;
            margin-bottom: 15px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        
        .info-item {
            margin-bottom: 10px;
        }
        
        .info-label {
            font-size: 9pt;
            color: #666;
            text-transform: uppercase;
            font-weight: bold;
        }
        
        .info-value {
            font-size: 12pt;
            color: #333;
            font-weight: bold;
        }
        
        /* Synthèse */
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin: 30px 0;
        }
        
        .summary-card {
            background: #fff;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
        }
        
        .summary-card.critical {
            border-color: #d32f2f;
            background: #ffebee;
        }
        
        .summary-card.warning {
            border-color: #f57c00;
            background: #fff3e0;
        }
        
        .summary-card.success {
            border-color: #388e3c;
            background: #e8f5e9;
        }
        
        .summary-number {
            font-size: 32pt;
            font-weight: bold;
            color: #2d5016;
        }
        
        .summary-label {
            font-size: 10pt;
            color: #666;
            text-transform: uppercase;
            margin-top: 5px;
        }
        
        /* Sections modules */
        .module-section {
            margin: 40px 0;
            page-break-inside: avoid;
        }
        
        .module-header {
            background: #2d5016;
            color: white;
            padding: 15px 20px;
            font-size: 16pt;
            font-weight: bold;
            border-radius: 8px 8px 0 0;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .module-icon {
            font-size: 24pt;
        }
        
        .module-content {
            border: 2px solid #2d5016;
            border-top: none;
            padding: 20px;
            border-radius: 0 0 8px 8px;
        }
        
        .stats-row {
            display: flex;
            gap: 20px;
            margin: 20px 0;
            flex-wrap: wrap;
        }
        
        .stat-item {
            flex: 1;
            min-width: 150px;
            padding: 15px;
            background: #f9f9f9;
            border-radius: 5px;
            border-left: 4px solid #2d5016;
        }
        
        .stat-value {
            font-size: 24pt;
            font-weight: bold;
            color: #2d5016;
        }
        
        .stat-label {
            font-size: 9pt;
            color: #666;
            text-transform: uppercase;
        }
        
        /* Tables */
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        
        th {
            background: #2d5016;
            color: white;
            padding: 10px;
            text-align: left;
            font-size: 10pt;
        }
        
        td {
            padding: 8px 10px;
            border-bottom: 1px solid #e0e0e0;
            font-size: 10pt;
        }
        
        tr:nth-child(even) {
            background: #f9f9f9;
        }
        
        /* Recommandations */
        .recommendations {
            background: #fff9e6;
            border: 2px solid #ffd700;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
        }
        
        .recommendations h3 {
            color: #f57c00;
            margin-bottom: 15px;
            font-size: 14pt;
        }
        
        .recommendation-item {
            margin: 10px 0;
            padding-left: 25px;
            position: relative;
        }
        
        .recommendation-item:before {
            content: "⚠";
            position: absolute;
            left: 0;
            color: #f57c00;
            font-size: 14pt;
        }
        
        /* Footer */
        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #e0e0e0;
            text-align: center;
            font-size: 8pt;
            color: #999;
        }
        
        /* Boutons action */
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
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
        
        .btn-print {
            background: #2d5016;
            color: white;
        }
        
        .btn-download {
            background: #666;
            color: white;
        }
        
        .btn:hover {
            opacity: 0.8;
        }
    </style>
</head>
<body>
    <!-- Boutons d'action -->
    <div class="actions no-print">
        <button class="btn btn-print" onclick="window.print()">
            🖨️ Imprimer
        </button>
        <button class="btn btn-download" onclick="window.print()">
            📥 Télécharger PDF
        </button>
    </div>

    <div class="container">
        <!-- En-tête -->
        <div class="header">
            <div>
                <div class="logo-text">DIAGNOSTIC PV</div>
                <div class="logo-subtitle">Expertise Photovoltaïque Indépendante</div>
                <div class="company-info">
                    3 rue d'Apollo, 31240 L'Union<br>
                    Tél : 05.81.10.16.59<br>
                    Email : contact@diagpv.fr<br>
                    RCS Toulouse 792 972 309
                </div>
            </div>
            <div class="report-info">
                <div class="report-number">${reportNumber}</div>
                <div class="report-date">${reportDate}</div>
            </div>
        </div>

        <!-- Titre -->
        <div class="doc-title">RAPPORT D'AUDIT TECHNIQUE MULTI-MODULES</div>

        <!-- Informations projet -->
        <div class="project-info">
            <h2>📋 INFORMATIONS PROJET</h2>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Projet</div>
                    <div class="info-value">${data.audit.project_name || 'Non renseigné'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Client</div>
                    <div class="info-value">${data.audit.client_name || 'Non renseigné'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Localisation</div>
                    <div class="info-value">${data.audit.location || 'Non renseigné'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Modules activés</div>
                    <div class="info-value">${JSON.parse(data.audit.modules_enabled).join(', ')}</div>
                </div>
            </div>
        </div>

        <!-- Synthèse globale -->
        <h2 style="color: #2d5016; font-size: 16pt; margin-bottom: 20px;">📊 SYNTHÈSE GLOBALE</h2>
        <div class="summary-grid">
            ${generateSummaryCards(data)}
        </div>

        ${generateModuleSections(data)}

        <!-- Recommandations -->
        ${generateRecommendations(data)}

        <!-- Footer -->
        <div class="footer">
            Diagnostic Photovoltaïque - SAS au capital de 5 000€ - RCS Toulouse 792 972 309<br>
            3 rue d'Apollo, 31240 L'Union - contact@diagpv.fr - www.diagnosticphotovoltaique.fr<br>
            <br>
            Ce rapport est confidentiel et destiné exclusivement à ${data.audit.client_name}.<br>
            Toute reproduction ou diffusion sans autorisation est interdite.
        </div>
    </div>

    <script>
        // Auto-print si paramètre URL
        if (window.location.search.includes('autoprint=true')) {
            window.onload = () => window.print();
        }
    </script>
</body>
</html>
  `;
}

// ============================================================================
// Génération cartes synthèse
// ============================================================================
function generateSummaryCards(data: any): string {
  let cards = '';

  // Carte EL
  if (data.modules.el) {
    const defectRate = data.modules.el.stats.total > 0 
      ? ((data.modules.el.stats.defects / data.modules.el.stats.total) * 100).toFixed(1)
      : 0;
    
    const cardClass = data.modules.el.stats.critical > 0 ? 'critical' : 
                      data.modules.el.stats.defects > 0 ? 'warning' : 'success';
    
    cards += `
      <div class="summary-card ${cardClass}">
        <div class="summary-number">${data.modules.el.stats.defects}</div>
        <div class="summary-label">Modules défectueux</div>
        <div style="font-size: 10pt; color: #666; margin-top: 5px;">
          ${data.modules.el.stats.total} modules analysés (${defectRate}%)
        </div>
      </div>
    `;
  }

  // Carte I-V
  if (data.modules.iv) {
    const avgFf = data.modules.iv.stats.avg_ff || 0;
    const cardClass = avgFf < 0.70 ? 'critical' : avgFf < 0.75 ? 'warning' : 'success';
    
    cards += `
      <div class="summary-card ${cardClass}">
        <div class="summary-number">${avgFf.toFixed(2)}</div>
        <div class="summary-label">Fill Factor Moyen</div>
        <div style="font-size: 10pt; color: #666; margin-top: 5px;">
          ${data.modules.iv.stats.total} mesures I-V
        </div>
      </div>
    `;
  }

  // Carte Visual
  if (data.modules.visual) {
    const cardClass = data.modules.visual.stats.critical > 0 ? 'critical' : 
                      data.modules.visual.stats.defects_found > 0 ? 'warning' : 'success';
    
    cards += `
      <div class="summary-card ${cardClass}">
        <div class="summary-number">${data.modules.visual.stats.defects_found}</div>
        <div class="summary-label">Défauts Visuels</div>
        <div style="font-size: 10pt; color: #666; margin-top: 5px;">
          ${data.modules.visual.stats.total} inspections
        </div>
      </div>
    `;
  }

  // Carte Isolation
  if (data.modules.isolation) {
    const passRate = data.modules.isolation.stats.total > 0
      ? ((data.modules.isolation.stats.passed / data.modules.isolation.stats.total) * 100).toFixed(0)
      : 100;
    
    const cardClass = data.modules.isolation.stats.failed > 0 ? 'critical' : 'success';
    
    cards += `
      <div class="summary-card ${cardClass}">
        <div class="summary-number">${passRate}%</div>
        <div class="summary-label">Tests Conformes</div>
        <div style="font-size: 10pt; color: #666; margin-top: 5px;">
          ${data.modules.isolation.stats.passed}/${data.modules.isolation.stats.total} tests
        </div>
      </div>
    `;
  }

  return cards;
}

// ============================================================================
// Génération sections modules
// ============================================================================
function generateModuleSections(data: any): string {
  let sections = '';

  // Section EL
  if (data.modules.el) {
    sections += `
      <div class="module-section">
        <div class="module-header">
          <span class="module-icon">🌙</span>
          MODULE ÉLECTROLUMINESCENCE (EL)
        </div>
        <div class="module-content">
          <div class="stats-row">
            <div class="stat-item">
              <div class="stat-value">${data.modules.el.stats.total}</div>
              <div class="stat-label">Modules Analysés</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${data.modules.el.stats.ok}</div>
              <div class="stat-label">Modules OK</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${data.modules.el.stats.defects}</div>
              <div class="stat-label">Défauts Détectés</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${data.modules.el.stats.critical}</div>
              <div class="stat-label">Défauts Critiques</div>
            </div>
          </div>
          <p style="margin-top: 15px; color: #666;">
            L'analyse par électroluminescence a permis de détecter les microfissures, 
            cellules mortes et défauts de soudure non visibles à l'œil nu. 
            ${data.modules.el.stats.critical > 0 ? '<strong style="color: #d32f2f;">Attention : défauts critiques détectés nécessitant une intervention rapide.</strong>' : ''}
          </p>
        </div>
      </div>
    `;
  }

  // Section I-V
  if (data.modules.iv) {
    sections += `
      <div class="module-section">
        <div class="module-header">
          <span class="module-icon">📈</span>
          MODULE COURBES I-V
        </div>
        <div class="module-content">
          <div class="stats-row">
            <div class="stat-item">
              <div class="stat-value">${data.modules.iv.stats.avg_voc.toFixed(2)} V</div>
              <div class="stat-label">Voc Moyen</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${data.modules.iv.stats.avg_isc.toFixed(2)} A</div>
              <div class="stat-label">Isc Moyen</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${data.modules.iv.stats.avg_ff.toFixed(2)}</div>
              <div class="stat-label">Fill Factor Moyen</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${data.modules.iv.stats.total}</div>
              <div class="stat-label">Mesures Réalisées</div>
            </div>
          </div>
          <p style="margin-top: 15px; color: #666;">
            Les mesures I-V permettent d'évaluer les performances électriques réelles des strings. 
            Fill Factor optimal : ≥ 0.75. 
            ${data.modules.iv.stats.avg_ff < 0.70 ? '<strong style="color: #d32f2f;">Attention : Fill Factor faible indiquant des pertes importantes.</strong>' : ''}
          </p>
        </div>
      </div>
    `;
  }

  // Section Visual
  if (data.modules.visual) {
    sections += `
      <div class="module-section">
        <div class="module-header">
          <span class="module-icon">👁️</span>
          MODULE INSPECTIONS VISUELLES
        </div>
        <div class="module-content">
          <div class="stats-row">
            <div class="stat-item">
              <div class="stat-value">${data.modules.visual.stats.total}</div>
              <div class="stat-label">Inspections</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${data.modules.visual.stats.defects_found}</div>
              <div class="stat-label">Défauts Trouvés</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${data.modules.visual.stats.critical}</div>
              <div class="stat-label">Défauts Critiques</div>
            </div>
          </div>
          <p style="margin-top: 15px; color: #666;">
            Inspection visuelle des modules, structures, câblages et équipements selon NF C 15-100.
            ${data.modules.visual.stats.critical > 0 ? '<strong style="color: #d32f2f;">Attention : défauts critiques impactant la sécurité.</strong>' : ''}
          </p>
        </div>
      </div>
    `;
  }

  // Section Isolation
  if (data.modules.isolation) {
    sections += `
      <div class="module-section">
        <div class="module-header">
          <span class="module-icon">⚡</span>
          MODULE TESTS D'ISOLATION
        </div>
        <div class="module-content">
          <div class="stats-row">
            <div class="stat-item">
              <div class="stat-value">${data.modules.isolation.stats.total}</div>
              <div class="stat-label">Tests Réalisés</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${data.modules.isolation.stats.passed}</div>
              <div class="stat-label">Tests Conformes</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${data.modules.isolation.stats.failed}</div>
              <div class="stat-label">Tests Non Conformes</div>
            </div>
          </div>
          <p style="margin-top: 15px; color: #666;">
            Tests d'isolation selon NF C 15-100 : seuil minimum 1 MΩ, recommandé ≥ 50 MΩ.
            ${data.modules.isolation.stats.failed > 0 ? '<strong style="color: #d32f2f;">Attention : défauts d\'isolation détectés représentant un risque électrique.</strong>' : ''}
          </p>
        </div>
      </div>
    `;
  }

  return sections;
}

// ============================================================================
// Génération recommandations
// ============================================================================
function generateRecommendations(data: any): string {
  const recommendations: string[] = [];

  // Recommandations EL
  if (data.modules.el && data.modules.el.stats.critical > 0) {
    recommendations.push(`Remplacer immédiatement les ${data.modules.el.stats.critical} modules en défaut critique (risque d'arc électrique)`);
  }
  if (data.modules.el && data.modules.el.stats.defects > 10) {
    recommendations.push(`Planifier le remplacement progressif des modules dégradés (${data.modules.el.stats.defects} modules concernés)`);
  }

  // Recommandations I-V
  if (data.modules.iv && data.modules.iv.stats.avg_ff < 0.70) {
    recommendations.push('Fill Factor très faible : vérifier les connexions, diodes bypass et mismatch entre modules');
  }

  // Recommandations Visual
  if (data.modules.visual && data.modules.visual.stats.critical > 0) {
    recommendations.push('Corriger en urgence les défauts visuels critiques (structures, câblages, boîtes de jonction)');
  }

  // Recommandations Isolation
  if (data.modules.isolation && data.modules.isolation.stats.failed > 0) {
    recommendations.push('Défauts d\'isolation détectés : intervention électrique urgente requise (risque d\'électrocution)');
  }

  // Recommandations générales
  if (recommendations.length === 0) {
    recommendations.push('Installation en bon état général, poursuivre la maintenance préventive annuelle');
  }

  return `
    <div class="recommendations">
      <h3>⚠️ RECOMMANDATIONS PRIORITAIRES</h3>
      ${recommendations.map((r, i) => `
        <div class="recommendation-item">
          <strong>Action ${i + 1} :</strong> ${r}
        </div>
      `).join('')}
    </div>
  `;
}

export default multiModulePdfRoutes;
