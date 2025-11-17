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
    const { inspection_type, observations, photos } = await c.req.json();

    const result = await DB.prepare(`
      INSERT INTO visual_inspections (
        audit_token, inspection_type, observations, photos, 
        inspection_date, created_at
      ) VALUES (?, ?, ?, ?, date('now'), datetime('now'))
    `).bind(
      token, inspection_type || 'general',
      observations || null,
      photos ? JSON.stringify(photos) : null
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
