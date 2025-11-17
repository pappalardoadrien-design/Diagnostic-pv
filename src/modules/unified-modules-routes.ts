/**
 * Module Unified Modules - Routes API
 * 
 * Routes pour accéder aux données complètes des modules PV
 * Combine EL + I-V + PVserv + Courbes sombres
 * 
 * Endpoints:
 * - GET /api/modules/:identifier - Données complètes d'un module
 * - GET /api/modules/audit/:token - Tous modules d'un audit avec données complètes
 * - GET /api/modules/performance/summary - Résumé performance tous modules
 */

import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
  KV: KVNamespace;
  R2: R2Bucket;
};

const unifiedModulesRoutes = new Hono<{ Bindings: Bindings }>();

// ============================================================================
// GET /api/modules/:identifier - Données complètes d'un module spécifique
// ============================================================================
unifiedModulesRoutes.get('/:identifier', async (c) => {
  try {
    const { DB } = c.env;
    const moduleIdentifier = c.req.param('identifier');

    // Récupérer depuis la vue unifiée v_module_complete
    const module = await DB.prepare(`
      SELECT * FROM v_module_complete 
      WHERE module_identifier = ?
    `).bind(moduleIdentifier).first();

    if (!module) {
      return c.json({ 
        success: false, 
        error: 'Module non trouvé' 
      }, 404);
    }

    return c.json({
      success: true,
      module: {
        // Identifiants
        identifier: module.module_identifier,
        string_number: module.string_number,
        position_in_string: module.position_in_string,
        
        // Métadonnées audit
        audit_token: module.audit_token,
        project_name: module.project_name,
        client_name: module.client_name,
        location: module.location,
        
        // Données EL (Électroluminescence)
        el: {
          defect_type: module.el_defect_type,
          severity: module.el_severity,
          comment: module.el_comment,
          image_url: module.el_image_url,
          created_at: module.el_created_at
        },
        
        // Données I-V Référence (Lumière)
        iv_reference: module.iv_ref_isc ? {
          isc: module.iv_ref_isc,
          voc: module.iv_ref_voc,
          pmax: module.iv_ref_pmax,
          impp: module.iv_ref_impp,
          vmpp: module.iv_ref_vmpp,
          fill_factor: module.iv_ref_ff,
          rs: module.iv_ref_rs,
          rsh: module.iv_ref_rsh,
          curve_data: module.iv_ref_curve ? JSON.parse(module.iv_ref_curve) : null,
          pmax_stc: module.iv_ref_pmax_stc,
          deviation: module.iv_ref_deviation,
          created_at: module.iv_ref_created_at
        } : null,
        
        // Données I-V Sombre (Dark Curve)
        iv_dark: module.iv_dark_rs ? {
          rs: module.iv_dark_rs,
          rsh: module.iv_dark_rsh,
          curve_data: module.iv_dark_curve ? JSON.parse(module.iv_dark_curve) : null,
          created_at: module.iv_dark_created_at
        } : null,
        
        // Données PVserv
        pvserv: module.pvserv_ff ? {
          fill_factor: module.pvserv_ff,
          rds: module.pvserv_rds,
          uf: module.pvserv_uf,
          curve_data: module.pvserv_curve ? JSON.parse(module.pvserv_curve) : null,
          created_at: module.pvserv_created_at
        } : null
      }
    });

  } catch (error: any) {
    console.error('GET /modules/:identifier error:', error);
    return c.json({ success: false, error: 'Erreur serveur' }, 500);
  }
});

// ============================================================================
// GET /api/modules/audit/:token - Tous modules d'un audit avec données complètes
// ============================================================================
unifiedModulesRoutes.get('/audit/:token', async (c) => {
  try {
    const { DB } = c.env;
    const auditToken = c.req.param('token');

    const result = await DB.prepare(`
      SELECT * FROM v_module_complete 
      WHERE audit_token = ?
      ORDER BY string_number, position_in_string
    `).bind(auditToken).all();

    const modules = result.results.map((m: any) => ({
      identifier: m.module_identifier,
      string_number: m.string_number,
      position_in_string: m.position_in_string,
      
      // Données EL
      el_defect_type: m.el_defect_type,
      el_severity: m.el_severity,
      
      // Données I-V (résumé)
      has_iv_reference: !!m.iv_ref_isc,
      has_iv_dark: !!m.iv_dark_rs,
      has_pvserv: !!m.pvserv_ff,
      
      // Performance
      pmax: m.iv_ref_pmax,
      deviation: m.iv_ref_deviation
    }));

    return c.json({
      success: true,
      audit_token: auditToken,
      total_modules: modules.length,
      modules
    });

  } catch (error: any) {
    console.error('GET /modules/audit/:token error:', error);
    return c.json({ success: false, error: 'Erreur serveur' }, 500);
  }
});

// ============================================================================
// GET /api/modules/performance/summary - Résumé performance tous modules
// Utilise v_module_performance_summary pour analyse globale
// ============================================================================
unifiedModulesRoutes.get('/performance/summary', async (c) => {
  try {
    const { DB } = c.env;
    const { audit_token } = c.req.query();

    let query = 'SELECT * FROM v_module_performance_summary';
    const params: any[] = [];

    if (audit_token) {
      // Besoin de joiner avec v_module_complete pour filtrer par audit_token
      query = `
        SELECT vps.* 
        FROM v_module_performance_summary vps
        JOIN v_module_complete vmc ON vps.module_identifier = vmc.module_identifier
        WHERE vmc.audit_token = ?
      `;
      params.push(audit_token);
    }

    query += ' ORDER BY global_health_score ASC';

    const stmt = DB.prepare(query);
    const result = params.length > 0 
      ? await stmt.bind(...params).all()
      : await stmt.all();

    // Statistiques globales
    const modules = result.results;
    const stats = {
      total_modules: modules.length,
      critical: modules.filter((m: any) => m.global_health_score !== null && m.global_health_score < 30).length,
      degraded: modules.filter((m: any) => m.global_health_score !== null && m.global_health_score >= 30 && m.global_health_score < 70).length,
      ok: modules.filter((m: any) => m.global_health_score !== null && m.global_health_score >= 70).length,
      not_measured: modules.filter((m: any) => m.global_health_score === null).length
    };

    return c.json({
      success: true,
      stats,
      modules
    });

  } catch (error: any) {
    console.error('GET /modules/performance/summary error:', error);
    return c.json({ success: false, error: 'Erreur serveur' }, 500);
  }
});

export default unifiedModulesRoutes;
