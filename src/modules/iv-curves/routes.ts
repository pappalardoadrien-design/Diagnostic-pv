// Routes API Module IV - Courbes I-V

import { Hono } from 'hono';
import type { Bindings } from '../../types';
import { parsePVServFile } from './parsers';
import type { IVCurveData, IVCurveDBRecord, IVMeasurementDBRecord } from './types';

const ivRoutes = new Hono<{ Bindings: Bindings }>();

/**
 * POST /api/iv-curves/upload
 * Upload et parse fichier PVServ (TXT ou Excel)
 */
ivRoutes.post('/upload', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const auditToken = formData.get('audit_token') as string || null;
    const elAuditId = formData.get('el_audit_id') as string || null;
    
    if (!file) {
      return c.json({ error: 'Aucun fichier fourni' }, 400);
    }
    
    // Parse fichier
    const parsed = await parsePVServFile(file, file.name);
    
    if (parsed.parseErrors && parsed.parseErrors.length > 0) {
      return c.json({ 
        error: 'Erreur parsing', 
        details: parsed.parseErrors 
      }, 400);
    }
    
    // Insertion DB
    const insertedCurves = [];
    const { DB } = c.env;
    
    for (const curve of parsed.curves) {
      // Ajouter audit_token et el_audit_id à la courbe
      const curveWithAudit = {
        ...curve,
        auditToken: auditToken,
        elAuditId: elAuditId ? parseInt(elAuditId) : null
      };
      
      const curveId = await insertIVCurve(DB, curveWithAudit);
      
      if (curveId) {
        // Inserer points mesure
        await insertIVMeasurements(DB, curveId, curve.measurements);
        
        insertedCurves.push({
          id: curveId,
          stringNumber: curve.stringNumber,
          curveType: curve.curveType,
          fillFactor: curve.fillFactor,
          calculated: curve.calculated,
          anomalies: curve.anomalies,
          auditToken: auditToken
        });
      }
    }
    
    return c.json({
      success: true,
      fileType: parsed.fileType,
      curvesCount: parsed.curves.length,
      curves: insertedCurves,
      linkedToAudit: auditToken ? true : false,
      auditToken: auditToken
    });
    
  } catch (error) {
    console.error('Erreur upload IV curves:', error);
    return c.json({ 
      error: 'Erreur serveur', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

/**
 * GET /api/iv-curves/:id
 * Recuperer une courbe I-V avec ses points
 */
ivRoutes.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const { DB } = c.env;
    
    // Recuperer courbe
    const curve = await DB.prepare(`
      SELECT * FROM iv_curves WHERE id = ?
    `).bind(id).first<IVCurveDBRecord>();
    
    if (!curve) {
      return c.json({ error: 'Courbe non trouvee' }, 404);
    }
    
    // Recuperer points mesure
    const measurements = await DB.prepare(`
      SELECT * FROM iv_measurements 
      WHERE iv_curve_id = ? 
      ORDER BY measurement_order ASC
    `).bind(id).all<IVMeasurementDBRecord>();
    
    return c.json({
      ...curve,
      measurements: measurements.results || []
    });
    
  } catch (error) {
    console.error('Erreur get IV curve:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

/**
 * GET /api/iv-curves/by-string/:stringNumber
 * Recuperer courbes par numero de string
 */
ivRoutes.get('/by-string/:stringNumber', async (c) => {
  try {
    const stringNumber = parseInt(c.req.param('stringNumber'));
    const { DB } = c.env;
    
    const curves = await DB.prepare(`
      SELECT * FROM iv_curves 
      WHERE string_number = ? 
      ORDER BY measurement_date DESC
    `).bind(stringNumber).all<IVCurveDBRecord>();
    
    return c.json({
      stringNumber,
      curves: curves.results || []
    });
    
  } catch (error) {
    console.error('Erreur get IV curves by string:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

/**
 * GET /api/iv-curves
 * Liste toutes les courbes (avec filtres optionnels)
 */
ivRoutes.get('/', async (c) => {
  try {
    const { DB } = c.env;
    const auditToken = c.req.query('audit_token');
    const status = c.req.query('status');
    
    let query = 'SELECT * FROM iv_curves WHERE 1=1';
    const params: any[] = [];
    
    if (auditToken) {
      query += ' AND audit_token = ?';
      params.push(auditToken);
    }
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC LIMIT 100';
    
    const stmt = DB.prepare(query);
    const curves = await stmt.bind(...params).all<IVCurveDBRecord>();
    
    return c.json({
      curves: curves.results || [],
      count: curves.results?.length || 0
    });
    
  } catch (error) {
    console.error('Erreur list IV curves:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

/**
 * GET /api/iv-curves/string/:stringNumber/el-modules
 * Recuperer modules EL associes a un string
 */
ivRoutes.get('/string/:stringNumber/el-modules', async (c) => {
  try {
    const stringNumber = parseInt(c.req.param('stringNumber'));
    const { DB } = c.env;
    
    // Recuperer modules EL du string
    // Note: table el_modules utilise severity_level (INTEGER), pas severity (TEXT)
    const modules = await DB.prepare(`
      SELECT 
        id, module_identifier, string_number, position_in_string,
        defect_type, severity_level, comment, image_url,
        physical_row, physical_col
      FROM el_modules 
      WHERE string_number = ?
      ORDER BY position_in_string ASC
    `).bind(stringNumber).all();
    
    // Mapper severity_level vers severity texte
    const modulesWithSeverity = modules.results?.map(m => ({
      ...m,
      severity: m.severity_level === 3 ? 'critical' : 
                m.severity_level === 2 ? 'warning' : 'ok'
    })) || [];
    
    // Compter defauts par severite
    const defectsSummary = {
      total: modulesWithSeverity.length,
      critical: modulesWithSeverity.filter(m => m.severity === 'critical').length,
      warning: modulesWithSeverity.filter(m => m.severity === 'warning').length,
      ok: modulesWithSeverity.filter(m => m.severity === 'ok').length
    };
    
    return c.json({
      stringNumber,
      modules: modulesWithSeverity,
      summary: defectsSummary
    });
    
  } catch (error) {
    console.error('Erreur get EL modules by string:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

/**
 * GET /api/iv-curves/string/:stringNumber/summary
 * Vue unifiee : Courbes IV + Modules EL d'un string
 */
ivRoutes.get('/string/:stringNumber/summary', async (c) => {
  try {
    const stringNumber = parseInt(c.req.param('stringNumber'));
    const { DB } = c.env;
    
    // 1. Recuperer courbes IV du string
    const ivCurves = await DB.prepare(`
      SELECT * FROM iv_curves 
      WHERE string_number = ? 
      ORDER BY measurement_date DESC
    `).bind(stringNumber).all();
    
    // 2. Recuperer modules EL du string
    const elModules = await DB.prepare(`
      SELECT * FROM el_modules 
      WHERE string_number = ?
      ORDER BY position_in_string ASC
    `).bind(stringNumber).all();
    
    // 3. Calculer moyennes IV
    const avgFF = ivCurves.results?.reduce((sum, c) => sum + (c.fill_factor || 0), 0) / (ivCurves.results?.length || 1);
    const avgIsc = ivCurves.results?.reduce((sum, c) => sum + (c.isc || 0), 0) / (ivCurves.results?.length || 1);
    const avgVoc = ivCurves.results?.reduce((sum, c) => sum + (c.voc || 0), 0) / (ivCurves.results?.length || 1);
    const avgPmax = ivCurves.results?.reduce((sum, c) => sum + (c.pmax || 0), 0) / (ivCurves.results?.length || 1);
    
    // 4. Compter defauts EL (utilise severity_level INTEGER)
    const defectsSummary = {
      total: elModules.results?.length || 0,
      critical: elModules.results?.filter(m => m.severity_level === 3).length || 0,
      warning: elModules.results?.filter(m => m.severity_level === 2).length || 0,
      ok: elModules.results?.filter(m => m.severity_level === 0 || m.severity_level === 1).length || 0
    };
    
    return c.json({
      stringNumber,
      ivCurves: {
        count: ivCurves.results?.length || 0,
        curves: ivCurves.results || [],
        averages: {
          fillFactor: avgFF,
          isc: avgIsc,
          voc: avgVoc,
          pmax: avgPmax
        }
      },
      elModules: {
        count: elModules.results?.length || 0,
        modules: elModules.results || [],
        defects: defectsSummary
      }
    });
    
  } catch (error) {
    console.error('Erreur get string summary:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

/**
 * GET /api/iv-curves/dashboard/overview
 * Dashboard unifié : Vue d'ensemble de tous les strings avec IV + EL
 */
ivRoutes.get('/dashboard/overview', async (c) => {
  try {
    const { DB } = c.env;
    
    // 1. Récupérer tous les strings distincts avec courbes IV
    const strings = await DB.prepare(`
      SELECT DISTINCT string_number 
      FROM iv_curves 
      ORDER BY string_number ASC
    `).all();
    
    if (!strings.results || strings.results.length === 0) {
      return c.json({
        strings: [],
        totalStrings: 0,
        message: 'Aucun string trouvé avec courbes IV'
      });
    }
    
    // 2. Pour chaque string, récupérer données IV + EL
    const stringsData = [];
    
    for (const stringRow of strings.results) {
      const stringNumber = stringRow.string_number;
      
      // Courbes IV du string
      const ivCurves = await DB.prepare(`
        SELECT * FROM iv_curves 
        WHERE string_number = ? 
        ORDER BY measurement_date DESC
      `).bind(stringNumber).all();
      
      // Modules EL du string
      const elModules = await DB.prepare(`
        SELECT * FROM el_modules 
        WHERE string_number = ?
        ORDER BY position_in_string ASC
      `).bind(stringNumber).all();
      
      // Calculer statistiques IV
      const curvesCount = ivCurves.results?.length || 0;
      const avgFF = curvesCount > 0 
        ? ivCurves.results.reduce((sum, c) => sum + (c.fill_factor || 0), 0) / curvesCount 
        : 0;
      const avgIsc = curvesCount > 0 
        ? ivCurves.results.reduce((sum, c) => sum + (c.isc || 0), 0) / curvesCount 
        : 0;
      const avgVoc = curvesCount > 0 
        ? ivCurves.results.reduce((sum, c) => sum + (c.voc || 0), 0) / curvesCount 
        : 0;
      const avgPmax = curvesCount > 0 
        ? ivCurves.results.reduce((sum, c) => sum + (c.pmax || 0), 0) / curvesCount 
        : 0;
      
      // Compter anomalies IV
      const ivAnomalies = {
        total: curvesCount,
        critical: ivCurves.results?.filter(c => c.status === 'critical').length || 0,
        warning: ivCurves.results?.filter(c => c.status === 'warning').length || 0,
        ok: ivCurves.results?.filter(c => c.status === 'ok' || c.status === 'pending').length || 0
      };
      
      // Compter défauts EL
      const modulesCount = elModules.results?.length || 0;
      const elDefects = {
        total: modulesCount,
        critical: elModules.results?.filter(m => m.severity_level === 3).length || 0,
        warning: elModules.results?.filter(m => m.severity_level === 2).length || 0,
        ok: elModules.results?.filter(m => m.severity_level === 0 || m.severity_level === 1).length || 0
      };
      
      // Déterminer santé globale du string
      let healthStatus = 'ok';
      if (ivAnomalies.critical > 0 || elDefects.critical > 0) {
        healthStatus = 'critical';
      } else if (ivAnomalies.warning > 0 || elDefects.warning > 0) {
        healthStatus = 'warning';
      }
      
      stringsData.push({
        stringNumber,
        ivData: {
          curvesCount,
          averages: {
            fillFactor: avgFF,
            isc: avgIsc,
            voc: avgVoc,
            pmax: avgPmax
          },
          anomalies: ivAnomalies
        },
        elData: {
          modulesCount,
          defects: elDefects
        },
        healthStatus
      });
    }
    
    // 3. Statistiques globales
    const totalIVCurves = stringsData.reduce((sum, s) => sum + s.ivData.curvesCount, 0);
    const totalELModules = stringsData.reduce((sum, s) => sum + s.elData.modulesCount, 0);
    const totalIVAnomaliesCritical = stringsData.reduce((sum, s) => sum + s.ivData.anomalies.critical, 0);
    const totalELDefectsCritical = stringsData.reduce((sum, s) => sum + s.elData.defects.critical, 0);
    
    return c.json({
      totalStrings: stringsData.length,
      strings: stringsData,
      globalStats: {
        totalIVCurves,
        totalELModules,
        totalIVAnomaliesCritical,
        totalELDefectsCritical,
        stringsWithIssues: stringsData.filter(s => s.healthStatus !== 'ok').length
      }
    });
    
  } catch (error) {
    console.error('Erreur get dashboard overview:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

/**
 * GET /api/iv-curves/by-audit/:auditToken
 * Récupérer toutes les courbes I-V d'un audit EL
 */
ivRoutes.get('/by-audit/:auditToken', async (c) => {
  try {
    const auditToken = c.req.param('auditToken');
    const { DB } = c.env;
    
    // Récupérer courbes IV liées à l'audit
    const curves = await DB.prepare(`
      SELECT * FROM iv_curves 
      WHERE audit_token = ? 
      ORDER BY string_number ASC, measurement_date DESC
    `).bind(auditToken).all();
    
    if (!curves.results || curves.results.length === 0) {
      return c.json({
        auditToken,
        curves: [],
        count: 0,
        message: 'Aucune courbe I-V trouvée pour cet audit'
      });
    }
    
    // Calculer statistiques par string
    const stringStats: Record<number, any> = {};
    
    for (const curve of curves.results as any[]) {
      const sn = curve.string_number;
      if (!stringStats[sn]) {
        stringStats[sn] = {
          stringNumber: sn,
          curvesCount: 0,
          avgFF: 0,
          avgVoc: 0,
          avgIsc: 0,
          avgPmax: 0,
          anomalies: { critical: 0, warning: 0 }
        };
      }
      
      stringStats[sn].curvesCount++;
      stringStats[sn].avgFF += curve.fill_factor || 0;
      stringStats[sn].avgVoc += curve.voc || 0;
      stringStats[sn].avgIsc += curve.isc || 0;
      stringStats[sn].avgPmax += curve.pmax || 0;
      
      if (curve.anomaly_detected) {
        if (curve.status === 'critical') {
          stringStats[sn].anomalies.critical++;
        } else {
          stringStats[sn].anomalies.warning++;
        }
      }
    }
    
    // Calculer moyennes
    Object.values(stringStats).forEach((s: any) => {
      if (s.curvesCount > 0) {
        s.avgFF = Math.round((s.avgFF / s.curvesCount) * 100) / 100;
        s.avgVoc = Math.round((s.avgVoc / s.curvesCount) * 100) / 100;
        s.avgIsc = Math.round((s.avgIsc / s.curvesCount) * 100) / 100;
        s.avgPmax = Math.round((s.avgPmax / s.curvesCount) * 100) / 100;
      }
    });
    
    return c.json({
      auditToken,
      curves: curves.results,
      count: curves.results.length,
      byString: Object.values(stringStats),
      summary: {
        totalCurves: curves.results.length,
        stringsWithData: Object.keys(stringStats).length,
        totalAnomalies: Object.values(stringStats).reduce((sum: number, s: any) => 
          sum + s.anomalies.critical + s.anomalies.warning, 0)
      }
    });
    
  } catch (error) {
    console.error('Erreur get IV curves by audit:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

/**
 * GET /api/iv-curves/audit/:auditToken/cross-report
 * Rapport croisé EL + IV pour un audit
 * Combine données électroluminescence et courbes I-V par string
 */
ivRoutes.get('/audit/:auditToken/cross-report', async (c) => {
  try {
    const auditToken = c.req.param('auditToken');
    const { DB } = c.env;
    
    // 1. Récupérer infos audit EL
    const audit = await DB.prepare(`
      SELECT * FROM el_audits WHERE audit_token = ?
    `).bind(auditToken).first();
    
    if (!audit) {
      return c.json({ error: 'Audit non trouvé' }, 404);
    }
    
    // 2. Récupérer modules EL groupés par string
    const elModules = await DB.prepare(`
      SELECT 
        string_number,
        COUNT(*) as module_count,
        SUM(CASE WHEN defect_type = 'none' OR defect_type = 'pending' THEN 0 ELSE 1 END) as defects_count,
        SUM(CASE WHEN defect_type = 'dead_module' THEN 1 ELSE 0 END) as dead_count,
        SUM(CASE WHEN defect_type = 'microcrack' THEN 1 ELSE 0 END) as microcrack_count,
        SUM(CASE WHEN defect_type = 'luminescence_inequality' THEN 1 ELSE 0 END) as inequality_count,
        SUM(CASE WHEN defect_type = 'bypass_diode_failure' THEN 1 ELSE 0 END) as bypass_count
      FROM el_modules 
      WHERE audit_token = ?
      GROUP BY string_number
      ORDER BY string_number ASC
    `).bind(auditToken).all();
    
    // 3. Récupérer courbes IV groupées par string
    const ivCurves = await DB.prepare(`
      SELECT 
        string_number,
        COUNT(*) as curves_count,
        AVG(fill_factor) as avg_fill_factor,
        AVG(voc) as avg_voc,
        AVG(isc) as avg_isc,
        AVG(pmax) as avg_pmax,
        SUM(CASE WHEN anomaly_detected = 1 THEN 1 ELSE 0 END) as anomalies_count,
        AVG(uf_diodes) as avg_uf_diodes,
        AVG(rds) as avg_rds
      FROM iv_curves 
      WHERE audit_token = ?
      GROUP BY string_number
      ORDER BY string_number ASC
    `).bind(auditToken).all();
    
    // 4. Fusionner données EL et IV par string
    const elByString: Record<number, any> = {};
    const ivByString: Record<number, any> = {};
    
    for (const el of (elModules.results || []) as any[]) {
      elByString[el.string_number] = el;
    }
    
    for (const iv of (ivCurves.results || []) as any[]) {
      ivByString[iv.string_number] = iv;
    }
    
    // 5. Créer rapport croisé par string
    const allStrings = new Set([
      ...Object.keys(elByString).map(Number),
      ...Object.keys(ivByString).map(Number)
    ]);
    
    const crossReport = Array.from(allStrings).sort((a, b) => a - b).map(stringNumber => {
      const el = elByString[stringNumber] || {};
      const iv = ivByString[stringNumber] || {};
      
      // Déterminer statut global du string
      let status: 'ok' | 'warning' | 'critical' = 'ok';
      let issues: string[] = [];
      
      // Vérifier défauts EL
      if (el.dead_count > 0) {
        status = 'critical';
        issues.push(`${el.dead_count} module(s) HS`);
      }
      if (el.microcrack_count > 0) {
        if (status !== 'critical') status = 'warning';
        issues.push(`${el.microcrack_count} microfissure(s)`);
      }
      if (el.bypass_count > 0) {
        status = 'critical';
        issues.push(`${el.bypass_count} diode(s) bypass défaillante(s)`);
      }
      
      // Vérifier anomalies IV
      if (iv.anomalies_count > 0) {
        if (status !== 'critical') status = 'warning';
        issues.push(`${iv.anomalies_count} anomalie(s) courbe I-V`);
      }
      
      // Vérifier Fill Factor faible (< 0.70 = warning, < 0.60 = critical)
      if (iv.avg_fill_factor && iv.avg_fill_factor < 0.60) {
        status = 'critical';
        issues.push(`Fill Factor bas: ${(iv.avg_fill_factor * 100).toFixed(1)}%`);
      } else if (iv.avg_fill_factor && iv.avg_fill_factor < 0.70) {
        if (status !== 'critical') status = 'warning';
        issues.push(`Fill Factor dégradé: ${(iv.avg_fill_factor * 100).toFixed(1)}%`);
      }
      
      // Vérifier tension diodes (Uf élevé = problème)
      if (iv.avg_uf_diodes && iv.avg_uf_diodes > 2) {
        if (status !== 'critical') status = 'warning';
        issues.push(`Tension diodes élevée: ${iv.avg_uf_diodes?.toFixed(2)}V`);
      }
      
      return {
        stringNumber,
        el: {
          moduleCount: el.module_count || 0,
          defectsCount: el.defects_count || 0,
          deadCount: el.dead_count || 0,
          microcrackCount: el.microcrack_count || 0,
          inequalityCount: el.inequality_count || 0,
          bypassCount: el.bypass_count || 0
        },
        iv: {
          curvesCount: iv.curves_count || 0,
          avgFillFactor: iv.avg_fill_factor ? Math.round(iv.avg_fill_factor * 100) / 100 : null,
          avgVoc: iv.avg_voc ? Math.round(iv.avg_voc * 100) / 100 : null,
          avgIsc: iv.avg_isc ? Math.round(iv.avg_isc * 100) / 100 : null,
          avgPmax: iv.avg_pmax ? Math.round(iv.avg_pmax * 100) / 100 : null,
          avgUfDiodes: iv.avg_uf_diodes ? Math.round(iv.avg_uf_diodes * 100) / 100 : null,
          avgRds: iv.avg_rds ? Math.round(iv.avg_rds * 100) / 100 : null,
          anomaliesCount: iv.anomalies_count || 0
        },
        status,
        issues
      };
    });
    
    // 6. Calculer statistiques globales
    const totalModules = crossReport.reduce((sum, s) => sum + s.el.moduleCount, 0);
    const totalDefects = crossReport.reduce((sum, s) => sum + s.el.defectsCount, 0);
    const totalCurves = crossReport.reduce((sum, s) => sum + s.iv.curvesCount, 0);
    const criticalStrings = crossReport.filter(s => s.status === 'critical').length;
    const warningStrings = crossReport.filter(s => s.status === 'warning').length;
    
    return c.json({
      success: true,
      auditToken,
      audit: {
        projectName: (audit as any).project_name,
        clientName: (audit as any).client_name,
        location: (audit as any).location,
        createdAt: (audit as any).created_at
      },
      crossReport,
      summary: {
        totalStrings: crossReport.length,
        totalModulesEL: totalModules,
        totalDefectsEL: totalDefects,
        totalCurvesIV: totalCurves,
        stringsWithIssues: criticalStrings + warningStrings,
        criticalStrings,
        warningStrings,
        okStrings: crossReport.length - criticalStrings - warningStrings,
        conformityRate: totalModules > 0 
          ? Math.round(((totalModules - totalDefects) / totalModules) * 100) 
          : 100
      }
    });
    
  } catch (error) {
    console.error('Erreur cross-report:', error);
    return c.json({ error: 'Erreur serveur', details: (error as any).message }, 500);
  }
});

/**
 * DELETE /api/iv-curves/:id
 * Supprimer une courbe I-V et ses mesures
 */
ivRoutes.delete('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const { DB } = c.env;
    
    // Supprimer mesures
    await DB.prepare('DELETE FROM iv_measurements WHERE iv_curve_id = ?').bind(id).run();
    
    // Supprimer courbe
    const result = await DB.prepare('DELETE FROM iv_curves WHERE id = ?').bind(id).run();
    
    if (result.meta.changes === 0) {
      return c.json({ error: 'Courbe non trouvee' }, 404);
    }
    
    return c.json({ success: true, deleted: id });
    
  } catch (error) {
    console.error('Erreur delete IV curve:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Inserer courbe I-V en DB avec liaison audit optionnelle
 */
async function insertIVCurve(DB: D1Database, curve: IVCurveData & { auditToken?: string | null, elAuditId?: number | null }): Promise<number | null> {
  try {
    const result = await DB.prepare(`
      INSERT INTO iv_curves (
        el_audit_id, audit_token,
        string_number, curve_type, device_name, serial_number,
        fill_factor, rds, uf_diodes, ur,
        isc, voc, pmax, vmpp, impp, rs, rsh,
        status, anomaly_detected, anomaly_type,
        source_filename, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      curve.elAuditId || null,
      curve.auditToken || null,
      curve.stringNumber,
      curve.curveType,
      curve.deviceName || null,
      curve.serialNumber || null,
      curve.fillFactor || null,
      curve.rds || null,
      curve.ufDiodes || null,
      curve.ur || null,
      curve.calculated?.isc || null,
      curve.calculated?.voc || null,
      curve.calculated?.pmax || null,
      curve.calculated?.vmpp || null,
      curve.calculated?.impp || null,
      curve.calculated?.rs || null,
      curve.calculated?.rsh || null,
      curve.anomalies?.severity || 'pending',
      curve.anomalies?.detected ? 1 : 0,
      curve.anomalies?.types?.join(', ') || null,
      curve.sourceFilename || null,
      curve.notes || null
    ).run();
    
    return result.meta.last_row_id as number;
    
  } catch (error) {
    console.error('Erreur insert IV curve:', error);
    return null;
  }
}

/**
 * Inserer points mesure en DB
 */
async function insertIVMeasurements(
  DB: D1Database, 
  curveId: number, 
  measurements: IVCurveData['measurements']
): Promise<void> {
  try {
    const stmt = DB.prepare(`
      INSERT INTO iv_measurements (
        iv_curve_id, voltage, current, power, measurement_order
      ) VALUES (?, ?, ?, ?, ?)
    `);
    
    const batch = measurements.map((m, index) => 
      stmt.bind(
        curveId,
        m.voltage,
        m.current,
        m.power || (m.voltage * m.current),
        index + 1
      )
    );
    
    await DB.batch(batch);
    
  } catch (error) {
    console.error('Erreur insert IV measurements:', error);
  }
}

export default ivRoutes;
