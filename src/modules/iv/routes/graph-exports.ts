// ============================================================================
// MODULE I-V - EXPORT GRAPHIQUES
// ============================================================================
// Export CSV et génération PDF des courbes I-V

import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
  KV: KVNamespace;
};

const ivGraphExportsRoutes = new Hono<{ Bindings: Bindings }>();

// ============================================================================
// GET /api/iv/graph-exports/csv/:token - Export CSV des mesures I-V
// ============================================================================
ivGraphExportsRoutes.get('/csv/:token', async (c) => {
  try {
    const { DB } = c.env;
    const token = c.req.param('token');

    // Récupérer toutes les mesures
    const { results: measurements } = await DB.prepare(`
      SELECT 
        module_identifier,
        string_number,
        module_number,
        measurement_type,
        isc,
        voc,
        pmax,
        impp,
        vmpp,
        fill_factor,
        rs,
        rsh,
        irradiance,
        temperature_module,
        temperature_ambient,
        created_at,
        iv_curve_data
      FROM iv_measurements
      WHERE audit_token = ?
      ORDER BY string_number, module_number, measurement_type
    `).bind(token).all();

    if (!measurements || measurements.length === 0) {
      return c.text('Aucune mesure disponible', 404);
    }

    // Générer CSV
    const headers = [
      'Module',
      'String',
      'Module_Num',
      'Type',
      'Isc_A',
      'Voc_V',
      'Pmax_W',
      'Impp_A',
      'Vmpp_V',
      'FF',
      'Rs_Ohm',
      'Rsh_Ohm',
      'Irradiance_W_m2',
      'Temp_Module_C',
      'Temp_Ambient_C',
      'Date',
      'Courbe_Points'
    ];

    const rows = measurements.map((m: any) => {
      let curvePoints = 0;
      if (m.iv_curve_data) {
        try {
          const curveData = JSON.parse(m.iv_curve_data);
          curvePoints = Array.isArray(curveData) ? curveData.length : 0;
        } catch (e) {
          curvePoints = 0;
        }
      }

      return [
        m.module_identifier || `S${m.string_number}-${m.module_number}`,
        m.string_number,
        m.module_number,
        m.measurement_type,
        m.isc?.toFixed(3) || '',
        m.voc?.toFixed(3) || '',
        m.pmax?.toFixed(2) || '',
        m.impp?.toFixed(3) || '',
        m.vmpp?.toFixed(3) || '',
        m.fill_factor?.toFixed(4) || '',
        m.rs?.toFixed(3) || '',
        m.rsh?.toFixed(0) || '',
        m.irradiance?.toFixed(1) || '',
        m.temperature_module?.toFixed(1) || '',
        m.temperature_ambient?.toFixed(1) || '',
        m.created_at || '',
        curvePoints
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');

    // Retourner CSV avec headers pour téléchargement
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="iv_measurements_${token}_${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error: any) {
    console.error('Erreur export CSV:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur export CSV: ' + error.message 
    }, 500);
  }
});

// ============================================================================
// GET /api/iv/graph-exports/pdf/:token - Générer PDF graphiques I-V
// ============================================================================
ivGraphExportsRoutes.get('/pdf/:token', async (c) => {
  try {
    const { DB } = c.env;
    const token = c.req.param('token');

    // Récupérer audit info
    const audit = await DB.prepare(`
      SELECT 
        a.site_name,
        a.site_address,
        a.created_at,
        sc.total_modules,
        sc.string_count
      FROM audits a
      LEFT JOIN shared_configurations sc ON sc.audit_token = a.audit_token
      WHERE a.audit_token = ?
    `).bind(token).first();

    if (!audit) {
      return c.json({ error: 'Audit non trouvé' }, 404);
    }

    const auditData = audit as any;

    // Récupérer mesures
    const { results: measurements } = await DB.prepare(`
      SELECT * FROM iv_measurements
      WHERE audit_token = ?
      ORDER BY string_number, module_number, measurement_type
    `).bind(token).all();

    if (!measurements || measurements.length === 0) {
      return c.json({ error: 'Aucune mesure disponible' }, 404);
    }

    const refMeasures = measurements.filter((m: any) => m.measurement_type === 'reference');
    const darkMeasures = measurements.filter((m: any) => m.measurement_type === 'dark');

    // Générer HTML rapport PDF
    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Rapport Graphiques I-V - ${auditData.site_name}</title>
    <style>
        @page { margin: 2cm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            color: #333;
            line-height: 1.6;
        }
        .header {
            background: linear-gradient(135deg, #1a1a1a 0%, #4a4a4a 100%);
            color: white;
            padding: 30px;
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            font-size: 32px;
            margin-bottom: 10px;
            font-weight: bold;
        }
        .header p {
            font-size: 16px;
            opacity: 0.9;
        }
        .section {
            margin-bottom: 40px;
            page-break-inside: avoid;
        }
        .section-title {
            background: #f97316;
            color: white;
            padding: 15px 20px;
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 20px;
            border-radius: 5px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 30px;
        }
        .stat-box {
            background: #f3f4f6;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            border: 2px solid #e5e7eb;
        }
        .stat-value {
            font-size: 28px;
            font-weight: bold;
            color: #f97316;
            margin-bottom: 5px;
        }
        .stat-label {
            font-size: 14px;
            color: #666;
        }
        .table-container {
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
        }
        th {
            background: #374151;
            color: white;
            padding: 12px 8px;
            text-align: left;
            font-weight: bold;
        }
        td {
            padding: 10px 8px;
            border-bottom: 1px solid #e5e7eb;
        }
        tr:nth-child(even) {
            background: #f9fafb;
        }
        .module-id {
            font-weight: bold;
            color: #f97316;
        }
        .good-value {
            color: #10b981;
            font-weight: bold;
        }
        .bad-value {
            color: #ef4444;
            font-weight: bold;
        }
        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #f97316;
        }
    </style>
</head>
<body>
    <!-- En-tête -->
    <div class="header">
        <div class="logo">⚡ DIAGNOSTIC PHOTOVOLTAÏQUE</div>
        <h1>RAPPORT GRAPHIQUES COURBES I-V</h1>
        <p>${auditData.site_name} - ${auditData.site_address || ''}</p>
        <p>Audit Token: ${token} | Date: ${new Date().toLocaleDateString('fr-FR')}</p>
    </div>

    <!-- Statistiques globales -->
    <div class="section">
        <div class="section-title">📊 STATISTIQUES GLOBALES</div>
        <div class="stats-grid">
            <div class="stat-box">
                <div class="stat-value">${auditData.total_modules || 0}</div>
                <div class="stat-label">Modules Total</div>
            </div>
            <div class="stat-box">
                <div class="stat-value">${refMeasures.length}</div>
                <div class="stat-label">Courbes Référence</div>
            </div>
            <div class="stat-box">
                <div class="stat-value">${darkMeasures.length}</div>
                <div class="stat-label">Courbes Sombres</div>
            </div>
            <div class="stat-box">
                <div class="stat-value">${auditData.string_count || 0}</div>
                <div class="stat-label">Strings</div>
            </div>
        </div>
    </div>

    <!-- Mesures Référence -->
    <div class="section">
        <div class="section-title">☀️ COURBES RÉFÉRENCE (Conditions STC)</div>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Module</th>
                        <th>String</th>
                        <th>Isc (A)</th>
                        <th>Voc (V)</th>
                        <th>Pmax (W)</th>
                        <th>Impp (A)</th>
                        <th>Vmpp (V)</th>
                        <th>FF</th>
                        <th>Irradiance</th>
                        <th>Temp. (°C)</th>
                    </tr>
                </thead>
                <tbody>
                    ${refMeasures.map((m: any) => {
                      const ff = m.fill_factor || 0;
                      const ffClass = ff >= 0.75 ? 'good-value' : ff < 0.65 ? 'bad-value' : '';
                      
                      return `
                        <tr>
                            <td class="module-id">${m.module_identifier || `S${m.string_number}-${m.module_number}`}</td>
                            <td>${m.string_number}</td>
                            <td>${m.isc?.toFixed(2) || '-'}</td>
                            <td>${m.voc?.toFixed(2) || '-'}</td>
                            <td>${m.pmax?.toFixed(1) || '-'}</td>
                            <td>${m.impp?.toFixed(2) || '-'}</td>
                            <td>${m.vmpp?.toFixed(2) || '-'}</td>
                            <td class="${ffClass}">${ff.toFixed(3)}</td>
                            <td>${m.irradiance ? m.irradiance.toFixed(0) + ' W/m²' : '-'}</td>
                            <td>${m.temperature_module?.toFixed(1) || '-'}</td>
                        </tr>
                      `;
                    }).join('')}
                    ${refMeasures.length === 0 ? '<tr><td colspan="10" style="text-align:center;">Aucune mesure référence disponible</td></tr>' : ''}
                </tbody>
            </table>
        </div>
    </div>

    <!-- Mesures Sombres -->
    <div class="section">
        <div class="section-title">🌙 COURBES SOMBRES (Résistances)</div>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Module</th>
                        <th>String</th>
                        <th>Rs (Ω)</th>
                        <th>Rsh (Ω)</th>
                        <th>Qualité</th>
                        <th>Temp. (°C)</th>
                        <th>Date Mesure</th>
                    </tr>
                </thead>
                <tbody>
                    ${darkMeasures.map((m: any) => {
                      const rsh = m.rsh || 0;
                      const qualityClass = rsh >= 1000 ? 'good-value' : rsh < 500 ? 'bad-value' : '';
                      const quality = rsh >= 1000 ? 'Excellent' : rsh >= 500 ? 'Correct' : 'Faible';
                      
                      return `
                        <tr>
                            <td class="module-id">${m.module_identifier || `S${m.string_number}-${m.module_number}`}</td>
                            <td>${m.string_number}</td>
                            <td>${m.rs?.toFixed(2) || '-'}</td>
                            <td class="${qualityClass}">${rsh.toFixed(0)}</td>
                            <td class="${qualityClass}">${quality}</td>
                            <td>${m.temperature_module?.toFixed(1) || '-'}</td>
                            <td>${m.created_at ? new Date(m.created_at).toLocaleDateString('fr-FR') : '-'}</td>
                        </tr>
                      `;
                    }).join('')}
                    ${darkMeasures.length === 0 ? '<tr><td colspan="7" style="text-align:center;">Aucune mesure sombre disponible</td></tr>' : ''}
                </tbody>
            </table>
        </div>
    </div>

    <!-- Analyse & Recommandations -->
    <div class="section">
        <div class="section-title">🔍 ANALYSE & RECOMMANDATIONS</div>
        <div style="background: #f9fafb; padding: 20px; border-radius: 10px; border: 2px solid #e5e7eb;">
            <h3 style="margin-bottom: 15px; color: #374151;">Critères d'évaluation IEC 62446-1 :</h3>
            <ul style="list-style: none; padding-left: 0; line-height: 2;">
                <li>✅ <strong>Fill Factor (FF) ≥ 0.75</strong> : Performance optimale</li>
                <li>⚠️ <strong>FF entre 0.65 - 0.75</strong> : Performance correcte, surveillance recommandée</li>
                <li>❌ <strong>FF < 0.65</strong> : Dégradation significative, intervention nécessaire</li>
                <li>✅ <strong>Rsh ≥ 1000 Ω</strong> : Isolation excellente</li>
                <li>⚠️ <strong>Rsh entre 500 - 1000 Ω</strong> : Isolation correcte</li>
                <li>❌ <strong>Rsh < 500 Ω</strong> : Risque de défauts (PID, microfissures)</li>
            </ul>
        </div>
    </div>

    <!-- Footer -->
    <div class="footer">
        <p><strong>Diagnostic Photovoltaïque</strong> - Expertise Indépendante depuis 2012</p>
        <p>3 rue d'Apollo, 31240 L'Union | 05.81.10.16.59 | contact@diagpv.fr</p>
        <p>RCS 792972309 | Rapport généré le ${new Date().toLocaleString('fr-FR')}</p>
    </div>
</body>
</html>
    `;

    // Retourner HTML pour conversion PDF (navigateur ou service externe)
    return c.html(html);

  } catch (error: any) {
    console.error('Erreur génération PDF graphiques:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur génération PDF: ' + error.message 
    }, 500);
  }
});

export default ivGraphExportsRoutes;
