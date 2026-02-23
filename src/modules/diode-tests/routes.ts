/**
 * Module Test Diodes Bypass - Routes API
 * Tests de diodes bypass par thermographie et/ou courbe I-V
 * 
 * Préfixe: /api/diode-tests
 * 
 * Endpoints:
 * GET    /sessions                       - Liste sessions de test
 * POST   /sessions                       - Créer session
 * GET    /sessions/:token                - Détail session + stats
 * PUT    /sessions/:token                - Modifier session
 * PUT    /sessions/:token/complete       - Marquer session terminée
 * GET    /sessions/:token/results        - Résultats par diode
 * POST   /sessions/:token/results        - Ajouter résultat diode
 * PUT    /results/:id                    - Modifier résultat
 * DELETE /results/:id                    - Supprimer résultat
 * GET    /stats                          - Stats globales
 */

import { Hono } from 'hono';

type Bindings = { DB: D1Database; KV: KVNamespace; R2: R2Bucket };

const diodeTestRoutes = new Hono<{ Bindings: Bindings }>();

function generateDiodeToken(): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `DIO-${ts}-${rand}`;
}

// ============================================================================
// SESSIONS
// ============================================================================

// GET /sessions - Liste sessions
diodeTestRoutes.get('/sessions', async (c) => {
  try {
    const { DB } = c.env;
    const { plant_id, audit_token, status } = c.req.query();
    
    let query = `SELECT * FROM diode_test_sessions WHERE 1=1`;
    const params: any[] = [];
    
    if (plant_id) { query += ` AND (plant_id = ? OR project_id = ?)`; params.push(plant_id, plant_id); }
    if (audit_token) { query += ` AND audit_token = ?`; params.push(audit_token); }
    if (status) { query += ` AND status = ?`; params.push(status); }
    
    query += ` ORDER BY created_at DESC LIMIT 100`;
    
    const result = params.length > 0 
      ? await DB.prepare(query).bind(...params).all()
      : await DB.prepare(query).all();
    
    return c.json({ success: true, sessions: result.results });
  } catch (error: any) {
    return c.json({ error: 'Erreur liste sessions', details: error.message }, 500);
  }
});

// POST /sessions - Créer session
diodeTestRoutes.post('/sessions', async (c) => {
  try {
    const { DB } = c.env;
    const body = await c.req.json();
    
    const { audit_token, plant_id, project_id, technician_name, test_date, method, equipment, ambient_temperature, irradiance, notes } = body;
    
    const finalPlantId = plant_id || project_id;
    if (!finalPlantId && !audit_token) return c.json({ error: 'plant_id ou audit_token requis' }, 400);
    
    const sessionToken = generateDiodeToken();
    
    const result = await DB.prepare(`
      INSERT INTO diode_test_sessions 
        (session_token, audit_token, plant_id, project_id, technician_name, test_date, method, equipment, ambient_temperature, irradiance, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      sessionToken, audit_token || null, finalPlantId || null, finalPlantId || null,
      technician_name || null, test_date || new Date().toISOString().split('T')[0],
      method || 'thermal', equipment || null,
      ambient_temperature || null, irradiance || null, notes || null
    ).run();
    
    return c.json({ 
      success: true, 
      session: { id: result.meta.last_row_id, session_token: sessionToken }
    }, 201);
  } catch (error: any) {
    return c.json({ error: 'Erreur création session', details: error.message }, 500);
  }
});

// GET /sessions/:token - Détail session
diodeTestRoutes.get('/sessions/:token', async (c) => {
  try {
    const { DB } = c.env;
    const token = c.req.param('token');
    
    const session = await DB.prepare('SELECT * FROM diode_test_sessions WHERE session_token = ?').bind(token).first();
    if (!session) return c.json({ error: 'Session introuvable' }, 404);
    
    // Stats par statut
    const stats = await DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'ok' THEN 1 ELSE 0 END) as ok,
        SUM(CASE WHEN status = 'defective' THEN 1 ELSE 0 END) as defective,
        SUM(CASE WHEN status = 'suspect' THEN 1 ELSE 0 END) as suspect,
        SUM(CASE WHEN status = 'not_tested' THEN 1 ELSE 0 END) as not_tested,
        SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical,
        SUM(CASE WHEN severity = 'major' THEN 1 ELSE 0 END) as major,
        MAX(temperature_diode) as max_temp,
        MAX(delta_t) as max_delta_t
      FROM diode_test_results WHERE session_id = ?
    `).bind(session.id).first();
    
    return c.json({ success: true, session, stats });
  } catch (error: any) {
    return c.json({ error: 'Erreur détail session', details: error.message }, 500);
  }
});

// PUT /sessions/:token - Modifier session
diodeTestRoutes.put('/sessions/:token', async (c) => {
  try {
    const { DB } = c.env;
    const token = c.req.param('token');
    const body = await c.req.json();
    
    const fields: string[] = [];
    const values: any[] = [];
    
    for (const key of ['technician_name', 'test_date', 'method', 'equipment', 'ambient_temperature', 'irradiance', 'notes', 'status']) {
      if (body[key] !== undefined) { fields.push(`${key} = ?`); values.push(body[key]); }
    }
    
    if (!fields.length) return c.json({ error: 'Aucun champ' }, 400);
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(token);
    
    await DB.prepare(`UPDATE diode_test_sessions SET ${fields.join(', ')} WHERE session_token = ?`).bind(...values).run();
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: 'Erreur modification', details: error.message }, 500);
  }
});

// PUT /sessions/:token/complete - Marquer session terminée avec calcul stats
diodeTestRoutes.put('/sessions/:token/complete', async (c) => {
  try {
    const { DB } = c.env;
    const token = c.req.param('token');
    
    const session = await DB.prepare('SELECT id FROM diode_test_sessions WHERE session_token = ?').bind(token).first();
    if (!session) return c.json({ error: 'Session introuvable' }, 404);
    
    // Calculer stats
    const stats = await DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'ok' THEN 1 ELSE 0 END) as ok,
        SUM(CASE WHEN status = 'defective' THEN 1 ELSE 0 END) as defective,
        SUM(CASE WHEN status = 'suspect' THEN 1 ELSE 0 END) as suspect
      FROM diode_test_results WHERE session_id = ?
    `).bind(session.id).first();
    
    const total = (stats?.total as number) || 0;
    const ok = (stats?.ok as number) || 0;
    const defective = (stats?.defective as number) || 0;
    const suspect = (stats?.suspect as number) || 0;
    const conformityRate = total > 0 ? Math.round((ok / total) * 10000) / 100 : 0;
    
    await DB.prepare(`
      UPDATE diode_test_sessions SET 
        status = 'completed', 
        total_diodes_tested = ?, diodes_ok = ?, diodes_defective = ?, diodes_suspect = ?,
        conformity_rate = ?, updated_at = CURRENT_TIMESTAMP
      WHERE session_token = ?
    `).bind(total, ok, defective, suspect, conformityRate, token).run();
    
    return c.json({ success: true, stats: { total, ok, defective, suspect, conformityRate } });
  } catch (error: any) {
    return c.json({ error: 'Erreur completion', details: error.message }, 500);
  }
});

// ============================================================================
// RÉSULTATS PAR DIODE
// ============================================================================

// GET /sessions/:token/results - Liste résultats
diodeTestRoutes.get('/sessions/:token/results', async (c) => {
  try {
    const { DB } = c.env;
    const token = c.req.param('token');
    
    const session = await DB.prepare('SELECT id FROM diode_test_sessions WHERE session_token = ?').bind(token).first();
    if (!session) return c.json({ error: 'Session introuvable' }, 404);
    
    const results = await DB.prepare(`
      SELECT * FROM diode_test_results 
      WHERE session_id = ? 
      ORDER BY string_number, module_number, diode_position
    `).bind(session.id).all();
    
    return c.json({ success: true, results: results.results });
  } catch (error: any) {
    return c.json({ error: 'Erreur résultats', details: error.message }, 500);
  }
});

// POST /sessions/:token/results - Ajouter résultat
diodeTestRoutes.post('/sessions/:token/results', async (c) => {
  try {
    const { DB } = c.env;
    const token = c.req.param('token');
    
    const session = await DB.prepare('SELECT id FROM diode_test_sessions WHERE session_token = ?').bind(token).first();
    if (!session) return c.json({ error: 'Session introuvable' }, 404);
    
    const body = await c.req.json();
    const { string_number, module_number, module_identifier, diode_position, temperature_diode, delta_t, thermal_image_url, forward_voltage, reverse_current, status, defect_type, severity, observation, photo_url, recommendation } = body;
    
    const result = await DB.prepare(`
      INSERT INTO diode_test_results 
        (session_id, string_number, module_number, module_identifier, diode_position,
         temperature_diode, delta_t, thermal_image_url, forward_voltage, reverse_current,
         status, defect_type, severity, observation, photo_url, recommendation)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      session.id, string_number || null, module_number || null, module_identifier || null, diode_position || 'D1',
      temperature_diode || null, delta_t || null, thermal_image_url || null,
      forward_voltage || null, reverse_current || null,
      status || 'ok', defect_type || null, severity || 'minor',
      observation || null, photo_url || null, recommendation || null
    ).run();
    
    return c.json({ success: true, id: result.meta.last_row_id }, 201);
  } catch (error: any) {
    return c.json({ error: 'Erreur ajout résultat', details: error.message }, 500);
  }
});

// PUT /results/:id - Modifier résultat
diodeTestRoutes.put('/results/:id', async (c) => {
  try {
    const { DB } = c.env;
    const id = c.req.param('id');
    const body = await c.req.json();
    
    const fields: string[] = [];
    const values: any[] = [];
    
    for (const key of ['string_number', 'module_number', 'module_identifier', 'diode_position', 'temperature_diode', 'delta_t', 'thermal_image_url', 'forward_voltage', 'reverse_current', 'status', 'defect_type', 'severity', 'observation', 'photo_url', 'recommendation']) {
      if (body[key] !== undefined) { fields.push(`${key} = ?`); values.push(body[key]); }
    }
    
    if (!fields.length) return c.json({ error: 'Aucun champ' }, 400);
    values.push(id);
    
    await DB.prepare(`UPDATE diode_test_results SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: 'Erreur modification', details: error.message }, 500);
  }
});

// DELETE /results/:id
diodeTestRoutes.delete('/results/:id', async (c) => {
  try {
    const { DB } = c.env;
    await DB.prepare('DELETE FROM diode_test_results WHERE id = ?').bind(c.req.param('id')).run();
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: 'Erreur suppression', details: error.message }, 500);
  }
});

// ============================================================================
// STATS
// ============================================================================

diodeTestRoutes.get('/stats', async (c) => {
  try {
    const { DB } = c.env;
    const { plant_id } = c.req.query();
    
    let query = `SELECT COUNT(*) as total_sessions, 
      SUM(total_diodes_tested) as total_diodes,
      SUM(diodes_ok) as total_ok, SUM(diodes_defective) as total_defective,
      SUM(diodes_suspect) as total_suspect,
      ROUND(AVG(conformity_rate), 1) as avg_conformity
      FROM diode_test_sessions WHERE status = 'completed'`;
    const params: any[] = [];
    
    if (plant_id) { query += ' AND (plant_id = ? OR project_id = ?)'; params.push(plant_id, plant_id); }
    
    const stats = params.length > 0 
      ? await DB.prepare(query).bind(...params).first()
      : await DB.prepare(query).first();
    
    return c.json({ success: true, stats });
  } catch (error: any) {
    return c.json({ error: 'Erreur stats', details: error.message }, 500);
  }
});

export default diodeTestRoutes;
