/**
 * Routes API - Module Rapport Unifié
 * Endpoints génération rapport multi-modules
 */

import { Hono } from 'hono';
import type { D1Database } from '@cloudflare/workers-types';
import { aggregateUnifiedReportData } from './aggregator.js';
import { generateReportHTML } from './template.js';
import type {
  GenerateUnifiedReportRequest,
  GenerateUnifiedReportResponse,
  PreviewAvailableDataResponse
} from './types/index.js';

type Bindings = {
  DB: D1Database;
};

export const unifiedReportRoutes = new Hono<{ Bindings: Bindings }>();

// ============================================================================
// POST /api/report/unified/generate - Générer rapport unifié
// ============================================================================
unifiedReportRoutes.post('/generate', async (c) => {
  const { DB } = c.env;
  
  try {
    const request: GenerateUnifiedReportRequest = await c.req.json();
    
    // Validation
    if (!request.plantId && !request.auditElToken && !request.inspectionToken) {
      return c.json({
        success: false,
        error: 'Au moins un identifiant requis (plantId, auditElToken, ou inspectionToken)'
      }, 400);
    }
    
    // Agrégation données
    const reportData = await aggregateUnifiedReportData(DB, request);
    
    // Vérifier qu'il y a au moins un module avec données
    const hasAnyData = reportData.elModule.hasData || 
                       reportData.ivModule.hasData || 
                       reportData.visualModule.hasData || 
                       reportData.isolationModule.hasData || 
                       reportData.thermalModule.hasData;
    
    if (!hasAnyData) {
      return c.json({
        success: false,
        error: 'Aucune donnée disponible pour générer le rapport'
      }, 404);
    }
    
    // Génération HTML
    const htmlContent = generateReportHTML(reportData);
    
    // TODO: Stocker rapport en DB pour récupération ultérieure
    // await DB.prepare(`INSERT INTO unified_reports ...`).run();
    
    const response: GenerateUnifiedReportResponse = {
      success: true,
      reportToken: reportData.reportToken,
      reportData,
      htmlContent
    };
    
    return c.json(response, 201);
    
  } catch (error) {
    console.error('Erreur génération rapport unifié:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, 500);
  }
});

// ============================================================================
// GET /api/report/unified/preview - Aperçu données disponibles
// ============================================================================
unifiedReportRoutes.get('/preview', async (c) => {
  const { DB } = c.env;
  
  try {
    const plantId = c.req.query('plantId') ? parseInt(c.req.query('plantId')!) : undefined;
    const auditElToken = c.req.query('auditElToken');
    
    if (!plantId && !auditElToken) {
      return c.json({
        success: false,
        error: 'plantId ou auditElToken requis'
      }, 400);
    }
    
    // Compter données disponibles par module
    let elCount = 0, ivCount = 0, visualCount = 0, isolationCount = 0, thermalCount = 0;
    let plantName = null;
    
    // Module EL
    if (auditElToken) {
      const elAudit = await DB.prepare(`
        SELECT project_name FROM el_audits WHERE audit_token = ?
      `).bind(auditElToken).first();
      
      if (elAudit) {
        elCount = 1;
        plantName = (elAudit as any).project_name;
      }
    } else if (plantId) {
      const elAudits = await DB.prepare(`
        SELECT COUNT(*) as count, project_name FROM el_audits WHERE plant_id = ? GROUP BY project_name
      `).bind(plantId).first();
      
      if (elAudits) {
        elCount = (elAudits as any).count || 0;
        plantName = (elAudits as any).project_name;
      }
    }
    
    // Module IV
    if (plantId || auditElToken) {
      const ivQuery = auditElToken 
        ? 'SELECT COUNT(*) as count FROM iv_curves WHERE audit_token = ?'
        : 'SELECT COUNT(*) as count FROM iv_curves WHERE plant_id = ?';
      
      const ivCurves = await DB.prepare(ivQuery).bind(auditElToken || plantId).first();
      ivCount = (ivCurves as any)?.count || 0;
    }
    
    // Module Visuels
    if (plantId) {
      const visualInspections = await DB.prepare(`
        SELECT COUNT(*) as count FROM visual_inspections WHERE plant_id = ?
      `).bind(plantId).first();
      visualCount = (visualInspections as any)?.count || 0;
    }
    
    // Module Isolation
    if (plantId) {
      const isolationTests = await DB.prepare(`
        SELECT COUNT(*) as count FROM isolation_tests WHERE plant_id = ?
      `).bind(plantId).first();
      isolationCount = (isolationTests as any)?.count || 0;
    }
    
    // Module Thermique (TODO)
    thermalCount = 0;
    
    const response: PreviewAvailableDataResponse = {
      success: true,
      plantId: plantId || null,
      plantName,
      availableModules: {
        el: elCount > 0,
        iv: ivCount > 0,
        visual: visualCount > 0,
        isolation: isolationCount > 0,
        thermal: thermalCount > 0
      },
      dataSummary: {
        elAuditsCount: elCount,
        ivCurvesCount: ivCount,
        visualInspectionsCount: visualCount,
        isolationTestsCount: isolationCount,
        thermalReportsCount: thermalCount
      }
    };
    
    return c.json(response);
    
  } catch (error) {
    console.error('Erreur preview données:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, 500);
  }
});

// ============================================================================
// GET /api/report/unified/:token - Récupérer rapport par token (TODO)
// ============================================================================
unifiedReportRoutes.get('/:token', async (c) => {
  const token = c.req.param('token');
  
  // TODO: Implémenter récupération depuis DB
  return c.json({
    success: false,
    error: 'Récupération rapport non implémentée - TODO stockage DB'
  }, 501);
});
