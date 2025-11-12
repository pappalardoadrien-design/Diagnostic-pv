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
      const curveId = await insertIVCurve(DB, curve);
      
      if (curveId) {
        // Inserer points mesure
        await insertIVMeasurements(DB, curveId, curve.measurements);
        
        insertedCurves.push({
          id: curveId,
          stringNumber: curve.stringNumber,
          curveType: curve.curveType,
          fillFactor: curve.fillFactor,
          calculated: curve.calculated,
          anomalies: curve.anomalies
        });
      }
    }
    
    return c.json({
      success: true,
      fileType: parsed.fileType,
      curvesCount: parsed.curves.length,
      curves: insertedCurves
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
 * Inserer courbe I-V en DB
 */
async function insertIVCurve(DB: D1Database, curve: IVCurveData): Promise<number | null> {
  try {
    const result = await DB.prepare(`
      INSERT INTO iv_curves (
        string_number, curve_type, device_name, serial_number,
        fill_factor, rds, uf_diodes, ur,
        isc, voc, pmax, vmpp, impp, rs, rsh,
        status, anomaly_detected, anomaly_type,
        source_filename, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
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
      curve.anomalies?.types.join(', ') || null,
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
