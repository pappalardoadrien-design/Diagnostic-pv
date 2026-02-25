/**
 * Module PVServ Dark IV - Routes API
 * Import fichier .txt PVServ → Courbes sombres + Tests diodes
 * 
 * Préfixe: /api/pvserv
 * 
 * Endpoints:
 * POST   /upload                         - Upload et parse fichier .txt PVServ
 * GET    /sessions                       - Liste sessions d'import
 * GET    /sessions/:token                - Détail session + stats + anomalies
 * GET    /sessions/:token/strings        - Courbes strings avec points
 * GET    /sessions/:token/diodes         - Courbes diodes avec points
 * GET    /sessions/:token/curves/:id     - Détail d'une courbe avec points
 * GET    /sessions/:token/chart-data     - Données formatées pour Chart.js
 * DELETE /sessions/:token                - Supprimer session et données
 */

import { Hono } from 'hono';
import { parsePVServDarkIV, isValidPVServDarkFile } from './parsers/pvserv-dark-parser';
import type { PVServBlock, PVServParseResult } from './parsers/pvserv-dark-parser';

type Bindings = { DB: D1Database; KV: KVNamespace; R2: R2Bucket };

const pvservDarkRoutes = new Hono<{ Bindings: Bindings }>();

function generateSessionToken(): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PVS-${ts}-${rand}`;
}

// Couleurs pour Chart.js (cohérentes avec le style DiagPV)
const CHART_COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
  '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1',
  '#84cc16', '#e11d48', '#0ea5e9', '#a855f7', '#10b981',
  '#d946ef', '#0891b2', '#65a30d', '#dc2626', '#7c3aed'
];

// ============================================================================
// POST /upload - Upload et parse fichier .txt PVServ
// ============================================================================
pvservDarkRoutes.post('/upload', async (c) => {
  try {
    const { DB } = c.env;
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('project_id') as string || null;
    const auditToken = formData.get('audit_token') as string || null;
    const technicianName = formData.get('technician_name') as string || null;
    
    if (!file) return c.json({ error: 'Aucun fichier fourni' }, 400);
    
    // Lire le contenu
    const content = await file.text();
    
    // Valider le format
    if (!isValidPVServDarkFile(content)) {
      return c.json({ 
        error: 'Format de fichier invalide',
        details: 'Le fichier ne contient pas les marqueurs PVServ attendus (FF, Uf, Rds, U/I)' 
      }, 400);
    }
    
    // Parser le fichier
    const parsed = parsePVServDarkIV(content, file.name);
    
    if (parsed.stats.totalBlocks === 0) {
      return c.json({ error: 'Aucune mesure trouvée dans le fichier' }, 400);
    }
    
    // Créer la session d'import
    const sessionToken = generateSessionToken();
    const sessionResult = await DB.prepare(`
      INSERT INTO pvserv_import_sessions (
        session_token, project_id, audit_token, source_filename,
        device_name, serial_number,
        total_blocks, string_count, diode_count,
        avg_ff_strings, avg_rds_strings, avg_uf_strings,
        avg_ff_diodes, avg_rds_diodes, avg_uf_diodes,
        anomaly_count, critical_count, warning_count,
        technician_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      sessionToken, projectId ? parseInt(projectId) : null, auditToken,
      file.name, parsed.deviceName, parsed.serialNumber,
      parsed.stats.totalBlocks, parsed.stats.stringCount, parsed.stats.diodeCount,
      parsed.stats.avgFF_strings, parsed.stats.avgRds_strings, parsed.stats.avgUf_strings,
      parsed.stats.avgFF_diodes, parsed.stats.avgRds_diodes, parsed.stats.avgUf_diodes,
      parsed.stats.anomalies.length,
      parsed.stats.anomalies.filter(a => a.severity === 'critical').length,
      parsed.stats.anomalies.filter(a => a.severity === 'warning').length,
      technicianName
    ).run();
    
    const sessionId = sessionResult.meta.last_row_id;
    
    // Insérer toutes les courbes + leurs points de mesure
    const allCurves = [...parsed.stringCurves, ...parsed.diodeCurves];
    
    for (const block of allCurves) {
      // Trouver anomalie pour cette courbe
      const blockAnomaly = parsed.stats.anomalies.find(
        a => a.measurementNumber === block.measurementNumber && a.type === block.type
      );
      
      const curveResult = await DB.prepare(`
        INSERT INTO pvserv_dark_curves (
          session_id, measurement_number, curve_type, curve_mode,
          fill_factor, rds, uf, v_max, i_max,
          anomaly_detected, anomaly_type, anomaly_severity, anomaly_message
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        sessionId, block.measurementNumber, block.type, block.curveMode,
        block.fillFactor, block.rds, block.uf, block.vMax, block.iMax,
        blockAnomaly ? 1 : 0,
        blockAnomaly?.anomalyType || null,
        blockAnomaly?.severity || 'ok',
        blockAnomaly?.message || null
      ).run();
      
      const curveId = curveResult.meta.last_row_id;
      
      // Insérer les points de mesure par batch
      if (block.points.length > 0) {
        const insertStmt = DB.prepare(`
          INSERT INTO pvserv_dark_measurements (curve_id, point_order, voltage, current, power)
          VALUES (?, ?, ?, ?, ?)
        `);
        
        const batch = block.points.map((pt, idx) =>
          insertStmt.bind(curveId, idx + 1, pt.voltage, pt.current, pt.voltage * pt.current)
        );
        
        await DB.batch(batch);
      }
    }
    
    return c.json({
      success: true,
      session: {
        token: sessionToken,
        id: sessionId,
        filename: file.name,
      },
      stats: parsed.stats,
      anomalies: parsed.stats.anomalies,
      warnings: parsed.warnings,
    });
    
  } catch (error: any) {
    console.error('Erreur upload PVServ:', error);
    return c.json({ error: 'Erreur serveur', details: error.message }, 500);
  }
});

// ============================================================================
// GET /sessions - Liste des sessions d'import
// ============================================================================
pvservDarkRoutes.get('/sessions', async (c) => {
  try {
    const { DB } = c.env;
    const { project_id, audit_token } = c.req.query();
    
    let query = 'SELECT * FROM pvserv_import_sessions WHERE 1=1';
    const params: any[] = [];
    
    if (project_id) { query += ' AND project_id = ?'; params.push(project_id); }
    if (audit_token) { query += ' AND audit_token = ?'; params.push(audit_token); }
    
    query += ' ORDER BY created_at DESC LIMIT 50';
    
    const result = params.length > 0
      ? await DB.prepare(query).bind(...params).all()
      : await DB.prepare(query).all();
    
    return c.json({ success: true, sessions: result.results });
  } catch (error: any) {
    return c.json({ error: 'Erreur liste sessions', details: error.message }, 500);
  }
});

// ============================================================================
// GET /sessions/:token - Détail session avec stats
// ============================================================================
pvservDarkRoutes.get('/sessions/:token', async (c) => {
  try {
    const { DB } = c.env;
    const token = c.req.param('token');
    
    const session = await DB.prepare('SELECT * FROM pvserv_import_sessions WHERE session_token = ?').bind(token).first();
    if (!session) return c.json({ error: 'Session introuvable' }, 404);
    
    // Courbes avec anomalies
    const anomalies = await DB.prepare(`
      SELECT measurement_number, curve_type, fill_factor, rds, uf, 
             anomaly_type, anomaly_severity, anomaly_message
      FROM pvserv_dark_curves 
      WHERE session_id = ? AND anomaly_detected = 1
      ORDER BY anomaly_severity DESC, curve_type, measurement_number
    `).bind(session.id).all();
    
    return c.json({ success: true, session, anomalies: anomalies.results });
  } catch (error: any) {
    return c.json({ error: 'Erreur détail session', details: error.message }, 500);
  }
});

// ============================================================================
// GET /sessions/:token/strings - Courbes strings avec points
// ============================================================================
pvservDarkRoutes.get('/sessions/:token/strings', async (c) => {
  try {
    const { DB } = c.env;
    const token = c.req.param('token');
    
    const session = await DB.prepare('SELECT id FROM pvserv_import_sessions WHERE session_token = ?').bind(token).first();
    if (!session) return c.json({ error: 'Session introuvable' }, 404);
    
    const curves = await DB.prepare(`
      SELECT * FROM pvserv_dark_curves 
      WHERE session_id = ? AND curve_type = 'string'
      ORDER BY measurement_number ASC
    `).bind(session.id).all();
    
    // Pour chaque courbe, récupérer les points
    const curvesWithPoints = [];
    for (const curve of (curves.results || []) as any[]) {
      const points = await DB.prepare(`
        SELECT point_order, voltage, current, power
        FROM pvserv_dark_measurements
        WHERE curve_id = ?
        ORDER BY point_order ASC
      `).bind(curve.id).all();
      
      curvesWithPoints.push({ ...curve, points: points.results });
    }
    
    return c.json({ success: true, curves: curvesWithPoints });
  } catch (error: any) {
    return c.json({ error: 'Erreur courbes strings', details: error.message }, 500);
  }
});

// ============================================================================
// GET /sessions/:token/diodes - Courbes diodes avec points
// ============================================================================
pvservDarkRoutes.get('/sessions/:token/diodes', async (c) => {
  try {
    const { DB } = c.env;
    const token = c.req.param('token');
    
    const session = await DB.prepare('SELECT id FROM pvserv_import_sessions WHERE session_token = ?').bind(token).first();
    if (!session) return c.json({ error: 'Session introuvable' }, 404);
    
    const curves = await DB.prepare(`
      SELECT * FROM pvserv_dark_curves 
      WHERE session_id = ? AND curve_type = 'diode'
      ORDER BY measurement_number ASC
    `).bind(session.id).all();
    
    const curvesWithPoints = [];
    for (const curve of (curves.results || []) as any[]) {
      const points = await DB.prepare(`
        SELECT point_order, voltage, current, power
        FROM pvserv_dark_measurements
        WHERE curve_id = ?
        ORDER BY point_order ASC
      `).bind(curve.id).all();
      
      curvesWithPoints.push({ ...curve, points: points.results });
    }
    
    return c.json({ success: true, curves: curvesWithPoints });
  } catch (error: any) {
    return c.json({ error: 'Erreur courbes diodes', details: error.message }, 500);
  }
});

// ============================================================================
// GET /sessions/:token/curves/:id - Détail d'une courbe avec points
// ============================================================================
pvservDarkRoutes.get('/sessions/:token/curves/:id', async (c) => {
  try {
    const { DB } = c.env;
    const curveId = c.req.param('id');
    
    const curve = await DB.prepare('SELECT * FROM pvserv_dark_curves WHERE id = ?').bind(curveId).first();
    if (!curve) return c.json({ error: 'Courbe introuvable' }, 404);
    
    const points = await DB.prepare(`
      SELECT point_order, voltage, current, power
      FROM pvserv_dark_measurements WHERE curve_id = ?
      ORDER BY point_order ASC
    `).bind(curveId).all();
    
    return c.json({ success: true, curve, points: points.results });
  } catch (error: any) {
    return c.json({ error: 'Erreur détail courbe', details: error.message }, 500);
  }
});

// ============================================================================
// GET /sessions/:token/chart-data - Données formatées pour Chart.js
// ============================================================================
pvservDarkRoutes.get('/sessions/:token/chart-data', async (c) => {
  try {
    const { DB } = c.env;
    const token = c.req.param('token');
    const curveType = c.req.query('type') || 'all'; // 'string', 'diode', 'all'
    
    const session = await DB.prepare('SELECT * FROM pvserv_import_sessions WHERE session_token = ?').bind(token).first();
    if (!session) return c.json({ error: 'Session introuvable' }, 404);
    
    let typeFilter = '';
    if (curveType === 'string') typeFilter = "AND curve_type = 'string'";
    else if (curveType === 'diode') typeFilter = "AND curve_type = 'diode'";
    
    const curves = await DB.prepare(`
      SELECT * FROM pvserv_dark_curves 
      WHERE session_id = ? ${typeFilter}
      ORDER BY curve_type, measurement_number ASC
    `).bind(session.id).all();
    
    // Construire données Chart.js
    const stringDatasets: any[] = [];
    const diodeDatasets: any[] = [];
    
    let colorIdx = 0;
    for (const curve of (curves.results || []) as any[]) {
      const points = await DB.prepare(`
        SELECT voltage, current FROM pvserv_dark_measurements
        WHERE curve_id = ? ORDER BY point_order ASC
      `).bind(curve.id).all();
      
      const color = CHART_COLORS[colorIdx % CHART_COLORS.length];
      const isAnomaly = curve.anomaly_detected === 1;
      
      const dataset = {
        label: `Nr. ${curve.measurement_number} (FF=${curve.fill_factor.toFixed(3)}, Rds=${curve.rds.toFixed(1)}Ω)`,
        data: (points.results || []).map((p: any) => ({ x: p.voltage, y: p.current })),
        borderColor: isAnomaly ? '#ef4444' : color,
        backgroundColor: 'transparent',
        borderWidth: isAnomaly ? 3 : 2,
        borderDash: isAnomaly ? [5, 3] : [],
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: isAnomaly ? '#ef4444' : color,
        tension: 0.3,
        fill: false,
        // Métadonnées
        meta: {
          id: curve.id,
          measurementNumber: curve.measurement_number,
          ff: curve.fill_factor,
          rds: curve.rds,
          uf: curve.uf,
          anomaly: isAnomaly,
          anomalyMessage: curve.anomaly_message,
        }
      };
      
      if (curve.curve_type === 'string') {
        stringDatasets.push(dataset);
      } else {
        diodeDatasets.push(dataset);
      }
      
      colorIdx++;
    }
    
    // Tableau comparatif des paramètres
    const stringComparison = (curves.results || [])
      .filter((c: any) => c.curve_type === 'string')
      .map((c: any) => ({
        nr: c.measurement_number,
        ff: c.fill_factor,
        rds: c.rds,
        uf: c.uf,
        vMax: c.v_max,
        iMax: c.i_max,
        anomaly: c.anomaly_detected === 1,
        severity: c.anomaly_severity,
      }));
    
    const diodeComparison = (curves.results || [])
      .filter((c: any) => c.curve_type === 'diode')
      .map((c: any) => ({
        nr: c.measurement_number,
        ff: c.fill_factor,
        rds: c.rds,
        uf: c.uf,
        vMax: c.v_max,
        iMax: c.i_max,
        anomaly: c.anomaly_detected === 1,
        severity: c.anomaly_severity,
      }));
    
    return c.json({
      success: true,
      session: {
        token: (session as any).session_token,
        filename: (session as any).source_filename,
        deviceName: (session as any).device_name,
        serialNumber: (session as any).serial_number,
        stringCount: (session as any).string_count,
        diodeCount: (session as any).diode_count,
      },
      charts: {
        strings: {
          datasets: stringDatasets,
          axisLabels: { x: 'Tension (V)', y: 'Courant (A)' },
          title: 'Courbes Sombres - Strings',
        },
        diodes: {
          datasets: diodeDatasets,
          axisLabels: { x: 'Tension (V)', y: 'Courant (A)' },
          title: 'Courbes Sombres - Diodes Bypass',
        },
      },
      comparison: {
        strings: stringComparison,
        diodes: diodeComparison,
      },
    });
  } catch (error: any) {
    return c.json({ error: 'Erreur chart data', details: error.message }, 500);
  }
});

// ============================================================================
// DELETE /sessions/:token - Supprimer session et toutes les données
// ============================================================================
pvservDarkRoutes.delete('/sessions/:token', async (c) => {
  try {
    const { DB } = c.env;
    const token = c.req.param('token');
    
    const session = await DB.prepare('SELECT id FROM pvserv_import_sessions WHERE session_token = ?').bind(token).first();
    if (!session) return c.json({ error: 'Session introuvable' }, 404);
    
    // Supprimer en cascade : points → courbes → session
    const curveIds = await DB.prepare('SELECT id FROM pvserv_dark_curves WHERE session_id = ?').bind(session.id).all();
    
    for (const curve of (curveIds.results || []) as any[]) {
      await DB.prepare('DELETE FROM pvserv_dark_measurements WHERE curve_id = ?').bind(curve.id).run();
    }
    await DB.prepare('DELETE FROM pvserv_dark_curves WHERE session_id = ?').bind(session.id).run();
    await DB.prepare('DELETE FROM pvserv_import_sessions WHERE id = ?').bind(session.id).run();
    
    return c.json({ success: true, deleted: token });
  } catch (error: any) {
    return c.json({ error: 'Erreur suppression', details: error.message }, 500);
  }
});

export default pvservDarkRoutes;
