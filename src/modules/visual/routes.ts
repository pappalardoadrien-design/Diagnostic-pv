// ============================================================================
// MODULE INSPECTIONS VISUELLES - ROUTES API
// ============================================================================

import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
};

const visualRoutes = new Hono<{ Bindings: Bindings }>();

// GET /api/visual/inspections/:token - Liste inspections visuelles
visualRoutes.get('/inspections/:token', async (c) => {
  try {
    const { DB } = c.env;
    const token = c.req.param('token');

    const { results } = await DB.prepare(`
      SELECT * FROM visual_inspections 
      WHERE audit_token = ?
      ORDER BY inspection_date DESC
    `).bind(token).all();

    return c.json({
      success: true,
      inspections: results || [],
      total: results?.length || 0
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// POST /api/visual/inspections/:token - Créer inspection visuelle
visualRoutes.post('/inspections/:token', async (c) => {
  try {
    const { DB } = c.env;
    const token = c.req.param('token');
    const { 
      inspection_type, 
      string_number,
      module_number,
      location_description,
      defect_found,
      defect_type,
      severity_level,
      notes,
      photo_url,
      gps_latitude,
      gps_longitude,
      corrective_action_required,
      corrective_action_description,
      // 🆕 GIRASOLE fields
      conformite,
      prescriptions_girasole,
      bonnes_pratiques,
      audit_category,
      checklist_section,
      item_order
    } = await c.req.json();

    // Récupérer intervention_id depuis audit master
    const audit = await DB.prepare(`
      SELECT intervention_id FROM audits WHERE audit_token = ?
    `).bind(token).first<{ intervention_id: number | null }>();

    const result = await DB.prepare(`
      INSERT INTO visual_inspections (
        audit_token, intervention_id, inspection_type,
        string_number, module_number, location_description,
        defect_found, defect_type, severity_level,
        photo_url, gps_latitude, gps_longitude,
        corrective_action_required, corrective_action_description,
        notes,
        conformite, prescriptions_girasole, bonnes_pratiques,
        audit_category, checklist_section, item_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      token,
      audit?.intervention_id || null,
      inspection_type || 'general',
      string_number || null,
      module_number || null,
      location_description || null,
      defect_found ? 1 : 0,
      defect_type || null,
      severity_level || null,
      photo_url || null,
      gps_latitude || null,
      gps_longitude || null,
      corrective_action_required ? 1 : 0,
      corrective_action_description || null,
      notes || null,
      // 🆕 GIRASOLE fields
      conformite || null,
      prescriptions_girasole || null,
      bonnes_pratiques || null,
      audit_category || null,
      checklist_section || null,
      item_order || null
    ).run();

    return c.json({
      success: true,
      inspection_id: result.meta.last_row_id,
      message: 'Inspection créée avec succès'
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// GET /api/visual/report/:token - Rapport PDF inspections visuelles
visualRoutes.get('/report/:token', async (c) => {
  try {
    const { DB } = c.env;
    const token = c.req.param('token');

    // Get audit info
    const audit = await DB.prepare(`
      SELECT * FROM audits WHERE audit_token = ?
    `).bind(token).first();

    if (!audit) {
      return c.html('<h1>Audit non trouvé</h1>');
    }

    // Get project info
    const project = await DB.prepare(`
      SELECT * FROM projects WHERE id = ?
    `).bind(audit.project_id).first();

    // Get client info
    const client = await DB.prepare(`
      SELECT * FROM crm_clients WHERE id = ?
    `).bind(audit.client_id).first();

    // Get all inspections
    const { results: inspections } = await DB.prepare(`
      SELECT * FROM visual_inspections 
      WHERE audit_token = ?
      ORDER BY item_order ASC
    `).bind(token).all();

    // Calculate stats
    const totalPoints = inspections?.length || 0;
    const conformes = inspections?.filter((i: any) => i.conformite === 'conforme').length || 0;
    const nonConformes = inspections?.filter((i: any) => i.conformite === 'non_conforme').length || 0;
    const so = inspections?.filter((i: any) => i.conformite === 'so').length || 0;
    const tauxConformite = totalPoints > 0 ? Math.round((conformes / totalPoints) * 100) : 0;

    // Group by section
    const sections: any = {};
    inspections?.forEach((inspection: any) => {
      const section = inspection.checklist_section || 'Autres';
      if (!sections[section]) {
        sections[section] = [];
      }
      sections[section].push(inspection);
    });

    // Get photos
    const { results: photos } = await DB.prepare(`
      SELECT * FROM photos WHERE audit_token = ?
    `).bind(token).all();

    const photosNC = photos?.filter((p: any) => {
      const inspection = inspections?.find((i: any) => 
        i.photo_url && i.photo_url.includes(String(p.id))
      );
      return inspection?.conformite === 'non_conforme';
    }) || [];

    // Determine type
    const auditType = project?.notes?.includes('Type: TOITURE') ? 'TOITURE' : 'SOL';
    const auditTypeLabel = auditType === 'TOITURE' 
      ? 'Audit Conformité DTU 40.35 + ETN' 
      : 'Audit Conformité NF C 15-100 + UTE C 15-712';

    // Generate HTML report
    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport Audit ${project?.name || 'Centrale'}</title>
    <style>
        @page { margin: 2cm; }
        body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 20px;
        }
        .header {
            border-bottom: 4px solid #16a34a;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #16a34a;
            margin: 0 0 10px 0;
            font-size: 28px;
        }
        .header .subtitle {
            color: #666;
            font-size: 16px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }
        .info-box {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #16a34a;
        }
        .info-box h3 {
            margin: 0 0 10px 0;
            color: #16a34a;
            font-size: 14px;
            text-transform: uppercase;
        }
        .info-box p {
            margin: 5px 0;
            font-size: 14px;
        }
        .stats {
            background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
            color: white;
            padding: 25px;
            border-radius: 12px;
            margin-bottom: 30px;
        }
        .stats h2 {
            margin: 0 0 20px 0;
            font-size: 20px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
        }
        .stat-box {
            background: rgba(255,255,255,0.2);
            padding: 15px;
            border-radius: 8px;
            text-align: center;
        }
        .stat-value {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .stat-label {
            font-size: 12px;
            opacity: 0.9;
        }
        .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        .section h3 {
            background: #16a34a;
            color: white;
            padding: 12px 15px;
            margin: 0 0 15px 0;
            border-radius: 6px;
            font-size: 16px;
        }
        .inspection-item {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 15px;
            margin-bottom: 10px;
        }
        .inspection-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        .inspection-label {
            font-weight: 600;
            color: #374151;
        }
        .badge {
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
        }
        .badge-conforme {
            background: #d1fae5;
            color: #065f46;
        }
        .badge-nc {
            background: #fee2e2;
            color: #991b1b;
        }
        .badge-so {
            background: #e5e7eb;
            color: #374151;
        }
        .inspection-notes {
            color: #6b7280;
            font-size: 14px;
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid #f3f4f6;
        }
        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #16a34a;
        }
        @media print {
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">🔋 DiagPV</div>
        <h1>Rapport Audit Visuel GIRASOLE</h1>
        <div class="subtitle">${auditTypeLabel}</div>
    </div>

    <div class="info-grid">
        <div class="info-box">
            <h3>Client</h3>
            <p><strong>${client?.company_name || 'N/A'}</strong></p>
            <p>${client?.address || ''} ${client?.postal_code || ''} ${client?.city || ''}</p>
            <p>📧 ${client?.main_contact_email || ''}</p>
        </div>
        <div class="info-box">
            <h3>Centrale</h3>
            <p><strong>${project?.name || 'N/A'}</strong></p>
            <p>📍 ${project?.site_address || ''}</p>
            <p>⚡ ${project?.installation_power || 0} kWc - ${project?.total_modules || 0} modules</p>
        </div>
    </div>

    <div class="stats">
        <h2>📊 Résultats Conformité</h2>
        <div class="stats-grid">
            <div class="stat-box">
                <div class="stat-value">${totalPoints}</div>
                <div class="stat-label">Points Contrôlés</div>
            </div>
            <div class="stat-box">
                <div class="stat-value">${conformes}</div>
                <div class="stat-label">Conformes</div>
            </div>
            <div class="stat-box">
                <div class="stat-value">${nonConformes}</div>
                <div class="stat-label">Non-Conformes</div>
            </div>
            <div class="stat-box">
                <div class="stat-value">${tauxConformite}%</div>
                <div class="stat-label">Taux Conformité</div>
            </div>
        </div>
    </div>

    ${Object.entries(sections).map(([sectionName, items]: [string, any]) => `
    <div class="section">
        <h3>${sectionName}</h3>
        ${items.map((item: any) => `
        <div class="inspection-item">
            <div class="inspection-header">
                <div class="inspection-label">${item.location_description || 'N/A'}</div>
                <span class="badge badge-${item.conformite === 'conforme' ? 'conforme' : item.conformite === 'non_conforme' ? 'nc' : 'so'}">
                    ${item.conformite === 'conforme' ? '✓ Conforme' : item.conformite === 'non_conforme' ? '✗ Non Conforme' : 'S.O.'}
                </span>
            </div>
            ${item.notes ? `<div class="inspection-notes">📝 ${item.notes}</div>` : ''}
            ${item.photo_url && item.photo_url !== 'null' ? `<div class="inspection-notes">📸 ${JSON.parse(item.photo_url).length} photo(s)</div>` : ''}
        </div>
        `).join('')}
    </div>
    `).join('')}

    ${nonConformes > 0 ? `
    <div class="section">
        <h3>⚠️ Synthèse Non-Conformités</h3>
        ${inspections?.filter((i: any) => i.conformite === 'non_conforme').map((item: any) => `
        <div class="inspection-item">
            <div class="inspection-header">
                <div class="inspection-label">${item.checklist_section} - ${item.location_description}</div>
            </div>
            ${item.notes ? `<div class="inspection-notes">📝 ${item.notes}</div>` : ''}
        </div>
        `).join('')}
    </div>
    ` : ''}

    <div class="footer">
        <p><strong>Diagnostic Photovoltaïque</strong> - Expertise indépendante depuis 2012</p>
        <p>3 rue d'Apollo, 31240 L'Union | ☎ 05.81.10.16.59 | 📧 contact@diagpv.fr</p>
        <p>RCS 792972309</p>
        <p>Rapport généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
        <p style="margin-top: 15px; font-size: 10px; color: #9ca3af;">
            Audit Token: ${token}
        </p>
    </div>
</body>
</html>
    `;

    return c.html(html);

  } catch (error: any) {
    console.error('Report generation error:', error);
    return c.html(`<h1>Erreur génération rapport</h1><p>${error.message}</p>`);
  }
});

export default visualRoutes;
