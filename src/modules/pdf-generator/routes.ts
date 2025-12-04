/**
 * PDF GENERATOR ROUTES
 * 
 * API routes pour génération PDF professionnels
 * 
 * Routes:
 * - POST /api/pdf/generate/:type/:audit_token
 * - GET  /api/pdf/status/:filename
 * - GET  /api/pdf/download/:filename
 */

import { Hono } from 'hono';
import { generatePDF } from './pdf-engine';
import type { PDFGenerationOptions } from './pdf-engine';

const pdfRoutes = new Hono<{ Bindings: CloudflareBindings }>();

/**
 * POST /api/pdf/generate/:type/:audit_token
 * 
 * Génère un PDF pour un audit
 * 
 * Types supportés:
 * - el: Audit électroluminescence
 * - iv: Courbes I-V
 * - thermique: Thermographie IR
 * - visual: Inspection visuelle
 * - isolation: Tests isolement
 * - multi-modules: Rapport consolidé (tous modules)
 */
pdfRoutes.post('/generate/:type/:audit_token', async (c) => {
  try {
    const { env } = c;
    const { type, audit_token } = c.req.param();
    
    // Valider type
    const validTypes = ['el', 'iv', 'thermique', 'visual', 'isolation', 'multi-modules'];
    if (!validTypes.includes(type)) {
      return c.json({ 
        success: false, 
        error: `Type invalide. Valeurs acceptées: ${validTypes.join(', ')}` 
      }, 400);
    }
    
    // Récupérer données audit depuis D1
    const auditData = await fetchAuditData(env.DB, type, audit_token);
    if (!auditData) {
      return c.json({ 
        success: false, 
        error: 'Audit introuvable' 
      }, 404);
    }
    
    // Préparer options génération
    const options: PDFGenerationOptions = {
      template: type,
      data: auditData,
      filename: `audit_${audit_token}_${type}_${Date.now()}.pdf`,
      format: 'A4',
      landscape: false,
      margin: {
        top: 15,
        right: 15,
        bottom: 15,
        left: 15
      }
    };
    
    // Générer PDF
    const result = await generatePDF(c, options);
    
    if (!result.success) {
      return c.json({ 
        success: false, 
        error: result.error 
      }, 500);
    }
    
    // Enregistrer métadonnées dans D1 (historique)
    await env.DB.prepare(`
      INSERT INTO pdf_reports (
        audit_token, 
        report_type, 
        filename, 
        r2_key, 
        file_size, 
        created_at
      ) VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      audit_token,
      type,
      result.filename,
      `reports/${result.filename}`,
      result.size
    ).run();
    
    return c.json({
      success: true,
      message: 'PDF généré avec succès',
      pdf: {
        url: result.url,
        filename: result.filename,
        size: result.size,
        type: type,
        audit_token: audit_token
      }
    });
    
  } catch (error: any) {
    console.error('❌ Erreur route génération PDF:', error);
    return c.json({ 
      success: false, 
      error: error.message || 'Erreur serveur' 
    }, 500);
  }
});

/**
 * GET /api/pdf/list/:audit_token
 * 
 * Liste tous les PDF générés pour un audit
 */
pdfRoutes.get('/list/:audit_token', async (c) => {
  try {
    const { env } = c;
    const { audit_token } = c.req.param();
    
    const result = await env.DB.prepare(`
      SELECT 
        report_type,
        filename,
        r2_key,
        file_size,
        created_at
      FROM pdf_reports
      WHERE audit_token = ?
      ORDER BY created_at DESC
    `).bind(audit_token).all();
    
    return c.json({
      success: true,
      audit_token: audit_token,
      reports: result.results || [],
      count: result.results?.length || 0
    });
    
  } catch (error: any) {
    console.error('❌ Erreur liste PDF:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

/**
 * GET /api/pdf/download/:filename
 * 
 * Télécharge un PDF depuis R2
 */
pdfRoutes.get('/download/:filename', async (c) => {
  try {
    const { env } = c;
    const { filename } = c.req.param();
    
    // Récupérer depuis R2
    const r2Key = `reports/${filename}`;
    const object = await env.R2.get(r2Key);
    
    if (!object) {
      return c.json({ 
        success: false, 
        error: 'PDF introuvable' 
      }, 404);
    }
    
    // Retourner fichier PDF
    return new Response(object.body, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(object.size)
      }
    });
    
  } catch (error: any) {
    console.error('❌ Erreur téléchargement PDF:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

/**
 * Récupère données audit depuis D1 selon le type
 */
async function fetchAuditData(
  db: D1Database, 
  type: string, 
  audit_token: string
): Promise<Record<string, any> | null> {
  try {
    
    // Données communes audit
    const auditResult = await db.prepare(`
      SELECT 
        a.*,
        c.name as client_name,
        c.email as client_email,
        sc.site_name,
        sc.site_address,
        sc.site_city,
        sc.site_postal_code
      FROM el_audits a
      LEFT JOIN crm_clients c ON a.client_id = c.id
      LEFT JOIN shared_configurations sc ON a.config_id = sc.id
      WHERE a.audit_token = ?
    `).bind(audit_token).first();
    
    if (!auditResult) return null;
    
    const baseData = {
      ...auditResult,
      created_at: auditResult.created_at || new Date().toISOString()
    };
    
    // Données spécifiques selon type
    switch (type) {
      case 'el': {
        // Modules EL
        const modules = await db.prepare(`
          SELECT * FROM el_modules 
          WHERE audit_id = ?
          ORDER BY string_number, position_in_string
        `).bind(auditResult.id).all();
        
        return {
          ...baseData,
          modules: modules.results || [],
          stats: {
            total_modules: modules.results?.length || 0,
            defective_modules: modules.results?.filter((m: any) => m.defect_type !== 'ok').length || 0,
            conformity_rate: calculateConformityRate(modules.results || [])
          }
        };
      }
      
      case 'iv': {
        // Mesures I-V
        const measurements = await db.prepare(`
          SELECT * FROM iv_measurements
          WHERE audit_token = ?
          ORDER BY string_number, module_number
        `).bind(audit_token).all();
        
        return {
          ...baseData,
          measurements: measurements.results || [],
          stats: {
            total_measurements: measurements.results?.length || 0,
            avg_pmax: calculateAvgPmax(measurements.results || []),
            avg_deviation: calculateAvgDeviation(measurements.results || [])
          }
        };
      }
      
      case 'visual': {
        // Inspections visuelles
        const inspections = await db.prepare(`
          SELECT * FROM visual_inspections
          WHERE audit_token = ?
        `).bind(audit_token).all();
        
        return {
          ...baseData,
          inspections: inspections.results || [],
          stats: {
            total_inspections: inspections.results?.length || 0,
            defects_found: inspections.results?.filter((i: any) => i.defect_type !== 'none').length || 0
          }
        };
      }
      
      case 'isolation': {
        // Tests isolement
        const tests = await db.prepare(`
          SELECT * FROM isolation_tests
          WHERE audit_token = ?
        `).bind(audit_token).all();
        
        return {
          ...baseData,
          tests: tests.results || [],
          stats: {
            total_tests: tests.results?.length || 0,
            conform_tests: tests.results?.filter((t: any) => t.is_conform).length || 0
          }
        };
      }
      
      case 'multi-modules': {
        // Toutes données consolidées
        const [modules, measurements, inspections, tests] = await Promise.all([
          db.prepare('SELECT * FROM el_modules WHERE audit_id = ?').bind(auditResult.id).all(),
          db.prepare('SELECT * FROM iv_measurements WHERE audit_token = ?').bind(audit_token).all(),
          db.prepare('SELECT * FROM visual_inspections WHERE audit_token = ?').bind(audit_token).all(),
          db.prepare('SELECT * FROM isolation_tests WHERE audit_token = ?').bind(audit_token).all()
        ]);
        
        return {
          ...baseData,
          modules: modules.results || [],
          measurements: measurements.results || [],
          inspections: inspections.results || [],
          tests: tests.results || [],
          stats: {
            el: {
              total_modules: modules.results?.length || 0,
              defective_modules: modules.results?.filter((m: any) => m.defect_type !== 'ok').length || 0
            },
            iv: {
              total_measurements: measurements.results?.length || 0,
              avg_pmax: calculateAvgPmax(measurements.results || [])
            },
            visual: {
              total_inspections: inspections.results?.length || 0,
              defects_found: inspections.results?.filter((i: any) => i.defect_type !== 'none').length || 0
            },
            isolation: {
              total_tests: tests.results?.length || 0,
              conform_tests: tests.results?.filter((t: any) => t.is_conform).length || 0
            }
          }
        };
      }
      
      default:
        return baseData;
    }
    
  } catch (error) {
    console.error(`❌ Erreur fetch audit data (${type}):`, error);
    return null;
  }
}

/**
 * Calcul taux conformité modules EL
 */
function calculateConformityRate(modules: any[]): number {
  if (modules.length === 0) return 1.0;
  const okCount = modules.filter(m => m.defect_type === 'ok').length;
  return okCount / modules.length;
}

/**
 * Calcul Pmax moyen
 */
function calculateAvgPmax(measurements: any[]): number {
  if (measurements.length === 0) return 0;
  const sum = measurements.reduce((acc, m) => acc + (m.pmax || 0), 0);
  return sum / measurements.length;
}

/**
 * Calcul déviation moyenne
 */
function calculateAvgDeviation(measurements: any[]): number {
  if (measurements.length === 0) return 0;
  const sum = measurements.reduce((acc, m) => acc + Math.abs(m.deviation_from_datasheet || 0), 0);
  return sum / measurements.length;
}

export default pdfRoutes;
