// ============================================================================
// MODULE TESTS ISOLEMENT - ROUTES API
// ============================================================================

import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
};

const isolationRoutes = new Hono<{ Bindings: Bindings }>();

// GET /api/isolation/tests/:token - Liste tests d'isolement
isolationRoutes.get('/tests/:token', async (c) => {
  try {
    const { DB } = c.env;
    const token = c.req.param('token');

    const { results } = await DB.prepare(`
      SELECT * FROM isolation_tests 
      WHERE audit_token = ?
      ORDER BY test_date DESC
    `).bind(token).all();

    return c.json({
      success: true,
      tests: results || [],
      total: results?.length || 0
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// POST /api/isolation/tests/:token - Créer test d'isolement
isolationRoutes.post('/tests/:token', async (c) => {
  try {
    const { DB } = c.env;
    const token = c.req.param('token');
    const { test_type, voltage, resistance, pass } = await c.req.json();

    const result = await DB.prepare(`
      INSERT INTO isolation_tests (
        audit_token, test_type, voltage, resistance, pass,
        test_date, created_at
      ) VALUES (?, ?, ?, ?, ?, date('now'), datetime('now'))
    `).bind(
      token, test_type || 'DC',
      voltage || null,
      resistance || null,
      pass ? 1 : 0
    ).run();

    return c.json({
      success: true,
      test_id: result.meta.last_row_id,
      message: 'Test d\'isolement créé avec succès'
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// GET /api/isolation/report/:token - Rapport PDF tests d'isolement
isolationRoutes.get('/report/:token', async (c) => {
  const token = c.req.param('token');
  
  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Rapport Tests d'Isolement</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #ea580c; }
    </style>
</head>
<body>
    <h1>⚡ RAPPORT TESTS D'ISOLEMENT</h1>
    <p>Token: ${token}</p>
    <p>Module en cours de développement - Phase 2C</p>
</body>
</html>
  `;
  
  return c.html(html);
});

export default isolationRoutes;
