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
        notes, inspection_date, created_at,
        conformite, prescriptions_girasole, bonnes_pratiques,
        audit_category, checklist_section, item_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, date('now'), datetime('now'), ?, ?, ?, ?, ?, ?)
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
  const token = c.req.param('token');
  
  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Rapport Inspections Visuelles</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #ea580c; }
    </style>
</head>
<body>
    <h1>🔍 RAPPORT INSPECTIONS VISUELLES</h1>
    <p>Token: ${token}</p>
    <p>Module en cours de développement - Phase 2B</p>
</body>
</html>
  `;
  
  return c.html(html);
});

export default visualRoutes;
