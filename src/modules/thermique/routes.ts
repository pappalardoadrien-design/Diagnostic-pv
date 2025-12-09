/**
 * MODULE THERMOGRAPHIE - ROUTES API
 * 
 * Thermographie infrarouge (drone/sol) pour détection défauts thermiques
 * Conforme DIN EN 62446-3
 */

import { Hono } from 'hono';

type Bindings = {
  DB: D1Database
  KV: KVNamespace
  R2: R2Bucket
}

const thermiqueRoutes = new Hono<{ Bindings: Bindings }>();

/**
 * POST /api/thermique/measurement/create
 * Créer une nouvelle mesure thermique
 */
thermiqueRoutes.post('/measurement/create', async (c) => {
  try {
    const { env } = c;
    const data = await c.req.json();
    
    const {
      audit_token,
      intervention_id,
      measurement_method = 'drone', // 'drone' | 'sol'
      temperature_max,
      temperature_min,
      temperature_avg,
      delta_t_max,
      string_number,
      module_number,
      gps_latitude,
      gps_longitude,
      thermal_image_url, // URL R2
      thermal_map_url,
      visible_image_url,
      defect_type, // 'hotspot', 'bypass_diode', 'shading', 'disconnection', 'ok'
      severity_level, // 1-5
      notes
    } = data;
    
    // Validation
    if (!audit_token || !intervention_id) {
      return c.json({ 
        success: false, 
        error: 'audit_token et intervention_id requis' 
      }, 400);
    }
    
    // Insérer mesure thermique
    const result = await env.DB.prepare(`
      INSERT INTO thermal_measurements (
        intervention_id,
        measurement_method,
        temperature_max,
        temperature_min,
        temperature_avg,
        delta_t_max,
        string_number,
        module_number,
        gps_latitude,
        gps_longitude,
        thermal_image_url,
        thermal_map_url,
        visible_image_url,
        defect_type,
        severity_level,
        notes,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      intervention_id,
      measurement_method,
      temperature_max || null,
      temperature_min || null,
      temperature_avg || null,
      delta_t_max || null,
      string_number || null,
      module_number || null,
      gps_latitude || null,
      gps_longitude || null,
      thermal_image_url || null,
      thermal_map_url || null,
      visible_image_url || null,
      defect_type || 'ok',
      severity_level || 1,
      notes || null
    ).run();
    
    return c.json({
      success: true,
      message: 'Mesure thermique créée',
      measurement_id: result.meta.last_row_id
    });
    
  } catch (error: any) {
    console.error('❌ Erreur création mesure thermique:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

/**
 * GET /api/thermique/measurements/:audit_token
 * Récupérer toutes les mesures thermiques d'un audit
 */
thermiqueRoutes.get('/measurements/:audit_token', async (c) => {
  try {
    const { env } = c;
    const { audit_token } = c.req.param();
    
    // Récupérer mesures via audit_token
    const result = await env.DB.prepare(`
      SELECT 
        tm.*,
        i.intervention_date
      FROM thermal_measurements tm
      JOIN interventions i ON tm.intervention_id = i.id
      JOIN audits a ON a.intervention_id = i.id
      WHERE a.audit_token = ?
      ORDER BY tm.string_number, tm.module_number, tm.created_at DESC
    `).bind(audit_token).all();
    
    return c.json({
      success: true,
      audit_token: audit_token,
      measurements: result.results || [],
      count: result.results?.length || 0
    });
    
  } catch (error: any) {
    console.error('❌ Erreur récupération mesures thermiques:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

/**
 * GET /api/thermique/hotspots/:audit_token
 * Récupérer uniquement les défauts thermiques critiques
 */
thermiqueRoutes.get('/hotspots/:audit_token', async (c) => {
  try {
    const { env } = c;
    const { audit_token } = c.req.param();
    
    // Filtrer défauts critiques (severity >= 3)
    const result = await env.DB.prepare(`
      SELECT 
        tm.*,
        i.intervention_date
      FROM thermal_measurements tm
      JOIN interventions i ON tm.intervention_id = i.id
      JOIN audits a ON a.intervention_id = i.id
      WHERE a.audit_token = ?
        AND tm.defect_type != 'ok'
        AND tm.severity_level >= 3
      ORDER BY tm.severity_level DESC, tm.delta_t_max DESC
    `).bind(audit_token).all();
    
    return c.json({
      success: true,
      audit_token: audit_token,
      hotspots: result.results || [],
      count: result.results?.length || 0
    });
    
  } catch (error: any) {
    console.error('❌ Erreur récupération hotspots:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

/**
 * POST /api/thermique/analyze
 * Analyser image thermique et détecter défauts automatiquement
 */
thermiqueRoutes.post('/analyze', async (c) => {
  try {
    const data = await c.req.json();
    const {
      thermal_image_url,
      temperature_threshold = 10, // ΔT seuil défaut (°C)
    } = data;
    
    // TODO: Intégration future avec IA analyse image
    // Pour l'instant, retourne analyse basique
    
    // Logique simplifiée détection
    const analysis = {
      has_defects: false,
      defects_detected: [],
      recommendation: 'Aucun défaut détecté'
    };
    
    // Simulation détection (à remplacer par vraie IA)
    // Dans la vraie implémentation :
    // - Charger image depuis R2
    // - Analyser pixels avec OpenCV ou TensorFlow
    // - Détecter zones température anormale
    // - Classifier défauts
    
    return c.json({
      success: true,
      message: 'Analyse thermique en cours (fonctionnalité en développement)',
      analysis: analysis,
      note: 'Pour analyses avancées, utiliser Picsellia IA (Phase 11)'
    });
    
  } catch (error: any) {
    console.error('❌ Erreur analyse thermique:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

/**
 * GET /api/thermique/stats/:audit_token
 * Statistiques thermiques audit
 */
thermiqueRoutes.get('/stats/:audit_token', async (c) => {
  try {
    const { env } = c;
    const { audit_token } = c.req.param();
    
    const stats = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total_measurements,
        AVG(temperature_max) as avg_temp_max,
        MAX(temperature_max) as max_temp_max,
        AVG(delta_t_max) as avg_delta_t,
        MAX(delta_t_max) as max_delta_t,
        SUM(CASE WHEN defect_type = 'hotspot' THEN 1 ELSE 0 END) as hotspots_count,
        SUM(CASE WHEN defect_type = 'bypass_diode' THEN 1 ELSE 0 END) as diode_defects,
        SUM(CASE WHEN defect_type = 'shading' THEN 1 ELSE 0 END) as shading_count,
        SUM(CASE WHEN defect_type = 'disconnection' THEN 1 ELSE 0 END) as disconnection_count,
        SUM(CASE WHEN defect_type = 'ok' THEN 1 ELSE 0 END) as ok_count,
        SUM(CASE WHEN severity_level >= 4 THEN 1 ELSE 0 END) as critical_defects
      FROM thermal_measurements tm
      JOIN interventions i ON tm.intervention_id = i.id
      JOIN audits a ON a.intervention_id = i.id
      WHERE a.audit_token = ?
    `).bind(audit_token).first();
    
    return c.json({
      success: true,
      audit_token: audit_token,
      stats: stats || {}
    });
    
  } catch (error: any) {
    console.error('❌ Erreur stats thermiques:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

/**
 * DELETE /api/thermique/measurement/:id
 * Supprimer une mesure thermique
 */
thermiqueRoutes.delete('/measurement/:id', async (c) => {
  try {
    const { env } = c;
    const { id } = c.req.param();
    
    await env.DB.prepare(`
      DELETE FROM thermal_measurements WHERE id = ?
    `).bind(id).run();
    
    return c.json({
      success: true,
      message: 'Mesure thermique supprimée'
    });
    
  } catch (error: any) {
    console.error('❌ Erreur suppression mesure thermique:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

export default thermiqueRoutes;
