// ============================================================================
// RAPPORT CONSOLIDÉ MULTI-MODULES
// ============================================================================
// Génération rapport PDF unifié : EL + PV Carto + I-V + VISUAL + ISOLATION
// Format professionnel DiagPV conforme normes IEC 62446-1
// ============================================================================

import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
  R2: R2Bucket
}

const report = new Hono<{ Bindings: Bindings }>()

// ============================================================================
// GET /api/reports/multi-module/:audit_token - Rapport consolidé HTML
// ============================================================================
report.get('/multi-module/:audit_token', async (c) => {
  try {
    const auditToken = c.req.param('audit_token')

    // 1. Récupérer audit EL
    const audit = await c.env.DB.prepare(`
      SELECT * FROM el_audits WHERE audit_token = ?
    `).bind(auditToken).first()

    if (!audit) {
      return c.json({ success: false, error: 'Audit non trouvé' }, 404)
    }

    // 2. Récupérer configuration partagée
    const config = await c.env.DB.prepare(`
      SELECT * FROM shared_configurations WHERE audit_token = ?
    `).bind(auditToken).first()

    // 3. Récupérer modules EL
    const elModules = await c.env.DB.prepare(`
      SELECT * FROM el_modules WHERE audit_token = ? ORDER BY string_number, module_number
    `).bind(auditToken).all()

    // 4. Récupérer zones PV
    const pvZones = await c.env.DB.prepare(`
      SELECT * FROM pv_zones WHERE audit_token = ? ORDER BY zone_number
    `).bind(auditToken).all()

    // 5. Récupérer mesures I-V
    const ivMeasurements = await c.env.DB.prepare(`
      SELECT * FROM iv_measurements WHERE audit_token = ? ORDER BY string_number, module_number
    `).bind(auditToken).all()

    // 6. Récupérer inspections visuelles
    const visualInspections = await c.env.DB.prepare(`
      SELECT * FROM visual_inspections WHERE audit_token = ? ORDER BY id
    `).bind(auditToken).all()

    // 7. Récupérer tests isolement
    const isolationTests = await c.env.DB.prepare(`
      SELECT * FROM isolation_tests WHERE audit_el_token = ? ORDER BY test_date
    `).bind(auditToken).all()

    // 8. Calculer statistiques
    const stats = await calculateStats(c.env.DB, auditToken)

    // 9. Générer HTML rapport
    const html = generateReportHTML({
      audit,
      config,
      elModules: elModules.results,
      pvZones: pvZones.results,
      ivMeasurements: ivMeasurements.results,
      visualInspections: visualInspections.results,
      isolationTests: isolationTests.results,
      stats
    })

    return c.html(html)

  } catch (error: any) {
    console.error('Erreur génération rapport:', error)
    return c.json({
      success: false,
      error: 'Erreur génération rapport',
      details: error.message
    }, 500)
  }
})

// ============================================================================
// CALCUL STATISTIQUES
// ============================================================================
async function calculateStats(db: D1Database, auditToken: string) {
  // Stats EL
  const elStats = await db.prepare(`
    SELECT 
      COUNT(*) as total_modules,
      SUM(CASE WHEN defect_type != 'NONE' THEN 1 ELSE 0 END) as defective_modules,
      SUM(CASE WHEN severity = 'CRITICAL' THEN 1 ELSE 0 END) as critical_modules
    FROM el_modules WHERE audit_token = ?
  `).bind(auditToken).first()

  // Stats I-V
  const ivStats = await db.prepare(`
    SELECT 
      COUNT(*) as total_measurements,
      AVG(pmax_measured) as avg_pmax,
      AVG(ABS(deviation_percent)) as avg_deviation
    FROM iv_measurements 
    WHERE audit_token = ? AND measurement_type = 'reference'
  `).bind(auditToken).first()

  // Stats VISUAL
  const visualStats = await db.prepare(`
    SELECT 
      COUNT(*) as total_inspections,
      SUM(CASE WHEN defect_found = 1 THEN 1 ELSE 0 END) as defects_found
    FROM visual_inspections WHERE audit_token = ?
  `).bind(auditToken).first()

  // Stats ISOLATION
  const isolationStats = await db.prepare(`
    SELECT 
      COUNT(*) as total_tests,
      SUM(CASE WHEN is_conform = 1 THEN 1 ELSE 0 END) as conform_tests
    FROM isolation_tests WHERE audit_el_token = ?
  `).bind(auditToken).first()

  return {
    el: elStats,
    iv: ivStats,
    visual: visualStats,
    isolation: isolationStats
  }
}

// ============================================================================
// GÉNÉRATION HTML RAPPORT
// ============================================================================
function generateReportHTML(data: any) {
  const { audit, config, elModules, pvZones, ivMeasurements, visualInspections, isolationTests, stats } = data

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <title>Rapport Multi-Modules - ${audit.project_name || 'Audit'}</title>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            @page { size: A4; margin: 2cm; }
            @media print {
                .no-print { display: none !important; }
            }
            body { 
                font-family: 'Segoe UI', Arial, sans-serif; 
                font-size: 11pt; 
                line-height: 1.4;
                color: #000;
            }
            .header { 
                text-align: center; 
                border-bottom: 3px solid #FF6B35; 
                padding-bottom: 20px; 
                margin-bottom: 30px; 
            }
            .header h1 { 
                color: #FF6B35; 
                font-size: 24pt; 
                margin: 0; 
            }
            .header p { 
                color: #666; 
                margin: 5px 0; 
            }
            .section { 
                margin-bottom: 30px; 
                page-break-inside: avoid; 
            }
            .section-title { 
                background: #FF6B35; 
                color: white; 
                padding: 10px 15px; 
                font-size: 14pt; 
                font-weight: bold; 
                margin-bottom: 15px; 
            }
            .info-grid { 
                display: grid; 
                grid-template-columns: 1fr 1fr; 
                gap: 10px; 
                margin-bottom: 20px; 
            }
            .info-item { 
                padding: 8px; 
                border-left: 3px solid #FF6B35; 
                background: #f5f5f5; 
            }
            .info-label { 
                font-weight: bold; 
                color: #333; 
            }
            .stats-grid { 
                display: grid; 
                grid-template-columns: repeat(4, 1fr); 
                gap: 15px; 
                margin-bottom: 20px; 
            }
            .stat-card { 
                text-align: center; 
                padding: 15px; 
                border-radius: 8px; 
                background: linear-gradient(135deg, #FF6B35, #F7931E); 
                color: white; 
            }
            .stat-number { 
                font-size: 28pt; 
                font-weight: bold; 
                margin: 0; 
            }
            .stat-label { 
                font-size: 9pt; 
                margin: 5px 0 0; 
            }
            table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-bottom: 20px; 
            }
            th { 
                background: #333; 
                color: white; 
                padding: 10px; 
                text-align: left; 
                font-size: 10pt; 
            }
            td { 
                padding: 8px; 
                border-bottom: 1px solid #ddd; 
                font-size: 9pt; 
            }
            tr:nth-child(even) { 
                background: #f9f9f9; 
            }
            .badge { 
                padding: 4px 8px; 
                border-radius: 4px; 
                font-size: 8pt; 
                font-weight: bold; 
            }
            .badge-ok { background: #28a745; color: white; }
            .badge-warning { background: #ffc107; color: black; }
            .badge-danger { background: #dc3545; color: white; }
            .footer { 
                text-align: center; 
                border-top: 2px solid #ccc; 
                padding-top: 15px; 
                margin-top: 40px; 
                font-size: 9pt; 
                color: #666; 
            }
            .page-break { page-break-before: always; }
        </style>
    </head>
    <body>
        <!-- BOUTONS ACTIONS (no-print) -->
        <div class="no-print" style="position: fixed; top: 20px; right: 20px; z-index: 1000;">
            <button onclick="window.print()" 
                    style="background: #FF6B35; color: white; padding: 12px 24px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.3); margin-right: 10px;">
                <i class="fas fa-print"></i> IMPRIMER PDF
            </button>
            <button onclick="window.close()" 
                    style="background: #333; color: white; padding: 12px 24px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
                <i class="fas fa-times"></i> FERMER
            </button>
        </div>

        <!-- EN-TÊTE -->
        <div class="header">
            <h1>RAPPORT D'AUDIT PHOTOVOLTAÏQUE</h1>
            <p><strong>${audit.project_name || 'Projet'}</strong></p>
            <p>Token: ${audit.audit_token} | Date: ${new Date().toLocaleDateString('fr-FR')}</p>
            <p>Conforme IEC 62446-1, IEC 62446-3, NF C 15-100</p>
        </div>

        <!-- INFORMATIONS GÉNÉRALES -->
        <div class="section">
            <div class="section-title">📋 INFORMATIONS GÉNÉRALES</div>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Projet</div>
                    <div>${audit.project_name || 'N/A'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Client</div>
                    <div>${audit.client_name || 'N/A'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Localisation</div>
                    <div>${audit.location || 'N/A'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Date audit</div>
                    <div>${audit.audit_date || 'N/A'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Configuration</div>
                    <div>${config?.string_count || 0} strings × ${config?.modules_per_string || 0} modules = ${(config?.string_count || 0) * (config?.modules_per_string || 0)} modules</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Puissance installée</div>
                    <div>${((config?.string_count || 0) * (config?.modules_per_string || 0) * 400 / 1000).toFixed(1)} kWc (estimé)</div>
                </div>
            </div>
        </div>

        <!-- STATISTIQUES GLOBALES -->
        <div class="section">
            <div class="section-title">📊 SYNTHÈSE MULTI-MODULES</div>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number">${stats.el?.total_modules || 0}</div>
                    <div class="stat-label">Modules EL Analysés</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.iv?.total_measurements || 0}</div>
                    <div class="stat-label">Mesures I-V</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.visual?.total_inspections || 0}</div>
                    <div class="stat-label">Inspections Visuelles</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.isolation?.total_tests || 0}</div>
                    <div class="stat-label">Tests Isolement</div>
                </div>
            </div>
        </div>

        <!-- MODULE ÉLECTROLUMINESCENCE -->
        <div class="section">
            <div class="section-title">⚡ MODULE ÉLECTROLUMINESCENCE (IEC 62446-3)</div>
            <p><strong>Défauts détectés :</strong> ${stats.el?.defective_modules || 0} / ${stats.el?.total_modules || 0} modules (${((stats.el?.defective_modules || 0) / (stats.el?.total_modules || 1) * 100).toFixed(1)}%)</p>
            <p><strong>Défauts critiques :</strong> ${stats.el?.critical_modules || 0}</p>
            
            <table>
                <thead>
                    <tr>
                        <th>Module</th>
                        <th>Défaut</th>
                        <th>Sévérité</th>
                        <th>Localisation</th>
                        <th>Statut</th>
                    </tr>
                </thead>
                <tbody>
                    ${elModules.slice(0, 50).map((m: any) => `
                        <tr>
                            <td>S${m.string_number}-${m.module_number}</td>
                            <td>${m.defect_type || 'NONE'}</td>
                            <td>${m.severity || 'N/A'}</td>
                            <td>${m.defect_location || '-'}</td>
                            <td>
                                <span class="badge ${m.defect_type === 'NONE' ? 'badge-ok' : m.severity === 'CRITICAL' ? 'badge-danger' : 'badge-warning'}">
                                    ${m.defect_type === 'NONE' ? '✅ OK' : m.severity === 'CRITICAL' ? '❌ CRITIQUE' : '⚠️ ALERTE'}
                                </span>
                            </td>
                        </tr>
                    `).join('')}
                    ${elModules.length > 50 ? `<tr><td colspan="5"><em>... ${elModules.length - 50} modules supplémentaires (voir annexe)</em></td></tr>` : ''}
                </tbody>
            </table>
        </div>

        <div class="page-break"></div>

        <!-- MODULE I-V -->
        <div class="section">
            <div class="section-title">📈 MODULE COURBES I-V (IEC 60904-1)</div>
            <p><strong>Pmax moyen :</strong> ${(stats.iv?.avg_pmax || 0).toFixed(1)} W</p>
            <p><strong>Déviation moyenne :</strong> ${(stats.iv?.avg_deviation || 0).toFixed(1)}%</p>
            
            <table>
                <thead>
                    <tr>
                        <th>Module</th>
                        <th>Pmax (W)</th>
                        <th>Pmax STC (W)</th>
                        <th>Déviation</th>
                        <th>Rs (Ω)</th>
                        <th>Statut</th>
                    </tr>
                </thead>
                <tbody>
                    ${ivMeasurements.filter((m: any) => m.measurement_type === 'reference').slice(0, 50).map((m: any) => {
                        const dark = ivMeasurements.find((d: any) => 
                            d.measurement_type === 'dark' && 
                            d.string_number === m.string_number && 
                            d.module_number === m.module_number
                        )
                        return `
                        <tr>
                            <td>S${m.string_number}-${m.module_number}</td>
                            <td>${m.pmax_measured?.toFixed(1) || '-'}</td>
                            <td>${m.pmax_stc?.toFixed(1) || '-'}</td>
                            <td>${m.deviation_percent?.toFixed(1) || '-'}%</td>
                            <td>${dark?.rs?.toFixed(3) || '-'}</td>
                            <td>
                                <span class="badge ${Math.abs(m.deviation_percent || 0) <= 5 ? 'badge-ok' : Math.abs(m.deviation_percent || 0) <= 10 ? 'badge-warning' : 'badge-danger'}">
                                    ${Math.abs(m.deviation_percent || 0) <= 5 ? '✅ CONFORME' : Math.abs(m.deviation_percent || 0) <= 10 ? '⚠️ DÉGRADÉ' : '❌ HORS NORME'}
                                </span>
                            </td>
                        </tr>
                    `}).join('')}
                    ${ivMeasurements.filter((m: any) => m.measurement_type === 'reference').length > 50 ? `<tr><td colspan="6"><em>... ${ivMeasurements.filter((m: any) => m.measurement_type === 'reference').length - 50} mesures supplémentaires</em></td></tr>` : ''}
                </tbody>
            </table>
        </div>

        <!-- MODULE VISUAL -->
        <div class="section">
            <div class="section-title">👁️ MODULE INSPECTIONS VISUELLES (IEC 62446-1)</div>
            <p><strong>Défauts détectés :</strong> ${stats.visual?.defects_found || 0} / ${stats.visual?.total_inspections || 0} inspections</p>
            
            <table>
                <thead>
                    <tr>
                        <th>Type inspection</th>
                        <th>Défaut trouvé</th>
                        <th>Type défaut</th>
                        <th>Sévérité</th>
                        <th>Localisation</th>
                    </tr>
                </thead>
                <tbody>
                    ${visualInspections.slice(0, 30).map((v: any) => `
                        <tr>
                            <td>${v.inspection_type || 'N/A'}</td>
                            <td>${v.defect_found ? '✅ Oui' : '❌ Non'}</td>
                            <td>${v.defect_type || '-'}</td>
                            <td>${v.severity_level || '-'}</td>
                            <td>${v.location_description || 'S' + v.string_number + '-' + v.module_number}</td>
                        </tr>
                    `).join('')}
                    ${visualInspections.length > 30 ? `<tr><td colspan="5"><em>... ${visualInspections.length - 30} inspections supplémentaires</em></td></tr>` : ''}
                </tbody>
            </table>
        </div>

        <div class="page-break"></div>

        <!-- MODULE ISOLATION -->
        <div class="section">
            <div class="section-title">🔌 MODULE TESTS ISOLEMENT (IEC 60364-6)</div>
            <p><strong>Tests conformes :</strong> ${stats.isolation?.conform_tests || 0} / ${stats.isolation?.total_tests || 0}</p>
            
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Type test</th>
                        <th>DC+ → Terre (MΩ)</th>
                        <th>DC- → Terre (MΩ)</th>
                        <th>AC → Terre (MΩ)</th>
                        <th>Seuil</th>
                        <th>Statut</th>
                    </tr>
                </thead>
                <tbody>
                    ${isolationTests.map((t: any) => `
                        <tr>
                            <td>${t.test_date || 'N/A'}</td>
                            <td>${t.test_type || 'N/A'}</td>
                            <td>${t.dc_positive_to_earth?.toFixed(2) || '-'}</td>
                            <td>${t.dc_negative_to_earth?.toFixed(2) || '-'}</td>
                            <td>${t.ac_to_earth?.toFixed(2) || '-'}</td>
                            <td>${t.threshold_mohm?.toFixed(1) || '1.0'} MΩ</td>
                            <td>
                                <span class="badge ${t.is_conform ? 'badge-ok' : 'badge-danger'}">
                                    ${t.is_conform ? '✅ CONFORME' : '❌ NON-CONFORME'}
                                </span>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <!-- CONCLUSION -->
        <div class="section">
            <div class="section-title">✅ CONCLUSION & RECOMMANDATIONS</div>
            <p><strong>État général de l'installation :</strong></p>
            <ul>
                <li><strong>EL :</strong> ${stats.el?.total_modules || 0} modules analysés, ${stats.el?.defective_modules || 0} défauts détectés (${((stats.el?.defective_modules || 0) / (stats.el?.total_modules || 1) * 100).toFixed(1)}%)</li>
                <li><strong>I-V :</strong> Performance moyenne : ${(100 - (stats.iv?.avg_deviation || 0)).toFixed(1)}% (déviation ${(stats.iv?.avg_deviation || 0).toFixed(1)}%)</li>
                <li><strong>VISUAL :</strong> ${stats.visual?.defects_found || 0} défauts visuels identifiés sur ${stats.visual?.total_inspections || 0} inspections</li>
                <li><strong>ISOLATION :</strong> ${stats.isolation?.conform_tests || 0}/${stats.isolation?.total_tests || 0} tests conformes (${((stats.isolation?.conform_tests || 0) / (stats.isolation?.total_tests || 1) * 100).toFixed(0)}%)</li>
            </ul>
            
            <p><strong>Préconisations prioritaires :</strong></p>
            <ol>
                <li>Remplacer les modules avec défauts critiques EL (${stats.el?.critical_modules || 0} modules)</li>
                <li>Surveiller modules avec déviation I-V > 10% (actions correctives recommandées)</li>
                <li>Corriger non-conformités isolation identifiées (risque sécurité électrique)</li>
                <li>Effectuer maintenance préventive selon défauts visuels détectés</li>
            </ol>
        </div>

        <!-- FOOTER -->
        <div class="footer">
            <p><strong>Diagnostic Photovoltaïque</strong> | 3 rue d'Apollo, 31240 L'Union | 05.81.10.16.59</p>
            <p>contact@diagpv.fr | www.diagnosticphotovoltaique.fr | RCS 792972309</p>
            <p>Rapport généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
            <p><em>Conforme aux normes IEC 62446-1, IEC 62446-3, IEC 60904-1, IEC 60364-6, NF C 15-100</em></p>
        </div>
    </body>
    </html>
  `
}

export default report
