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
    
    // Stockage persistant en DB (Phase 4B)
    const modulesIncluded: string[] = [];
    if (reportData.elModule.hasData) modulesIncluded.push('el');
    if (reportData.ivModule.hasData) modulesIncluded.push('iv');
    if (reportData.visualModule.hasData) modulesIncluded.push('visual');
    if (reportData.isolationModule.hasData) modulesIncluded.push('isolation');
    if (reportData.thermalModule.hasData) modulesIncluded.push('thermal');
    
    await DB.prepare(`
      INSERT INTO unified_reports (
        report_token, plant_id, audit_el_token, inspection_token,
        report_title, client_name, audit_date, auditor_name,
        overall_conformity_rate, critical_issues_count, major_issues_count, minor_issues_count,
        modules_included, html_content, generated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      reportData.reportToken,
      request.plantId || null,
      reportData.elModule.hasData ? reportData.elModule.auditToken : null,
      reportData.visualModule.hasData ? reportData.visualModule.inspectionToken : null,
      request.reportTitle || 'Rapport Audit PV',
      reportData.clientName,
      request.auditDate || new Date().toISOString().split('T')[0],
      request.auditorName || null,
      reportData.summary.overallConformityRate,
      reportData.summary.criticalIssuesCount,
      reportData.summary.majorIssuesCount,
      reportData.summary.minorIssuesCount,
      JSON.stringify(modulesIncluded),
      htmlContent,
      request.auditorName || null
    ).run();
    
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
// GET /api/report/unified/data/:auditToken - Données brutes pour rendu dynamique
// ============================================================================
unifiedReportRoutes.get('/data/:auditToken', async (c) => {
  const { DB } = c.env;
  const auditToken = c.req.param('auditToken');
  
  try {
    // On utilise l'agrégateur existant pour récupérer toutes les données liées à ce token
    // L'agrégateur est intelligent : il trouve le projet, le client, et tous les modules (EL, IV, etc.)
    const reportData = await aggregateUnifiedReportData(DB, { auditElToken: auditToken });
    
    return c.json({
      success: true,
      reportData
    });
    
  } catch (error) {
    console.error('Erreur récupération données dynamiques:', error);
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
        SELECT COUNT(*) as count, ea.project_name 
        FROM el_audits ea
        JOIN pv_cartography_audit_links pcal ON ea.audit_token = pcal.el_audit_token
        WHERE pcal.pv_plant_id = ? 
        GROUP BY ea.project_name
      `).bind(plantId).first();
      
      if (elAudits) {
        elCount = (elAudits as any).count || 0;
        plantName = (elAudits as any).project_name;
      }
    }
    
    // Module IV
    if (plantId || auditElToken) {
      let ivCurves;
      if (auditElToken) {
        ivCurves = await DB.prepare(`
          SELECT COUNT(*) as count FROM iv_curves WHERE audit_token = ?
        `).bind(auditElToken).first();
      } else {
        // Via el_audits linkage
        ivCurves = await DB.prepare(`
          SELECT COUNT(*) as count 
          FROM iv_curves ic
          JOIN el_audits ea ON ic.audit_token = ea.audit_token
          JOIN pv_cartography_audit_links pcal ON ea.audit_token = pcal.el_audit_token
          WHERE pcal.pv_plant_id = ?
        `).bind(plantId).first();
      }
      ivCount = (ivCurves as any)?.count || 0;
    }
    
    // Module Visuels - Maintenant lié via plant_id
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
    
    // Module Thermique
    if (auditElToken) {
      // Via audit token
      const thermalMeasurements = await DB.prepare(`
        SELECT COUNT(*) as count 
        FROM thermal_measurements tm
        JOIN interventions i ON tm.intervention_id = i.id
        JOIN audits a ON a.intervention_id = i.id
        WHERE a.audit_token = ?
      `).bind(auditElToken).first();
      
      thermalCount = (thermalMeasurements as any)?.count || 0;
      
      // Fallback si count 0 (migration audit_token direct)
      if (thermalCount === 0) {
        const directThermal = await DB.prepare(`
          SELECT COUNT(*) as count FROM thermal_measurements WHERE audit_token = ?
        `).bind(auditElToken).first();
        if ((directThermal as any)?.count > 0) {
          thermalCount = (directThermal as any).count;
        }
      }
      
    } else if (plantId) {
      // Via plantId -> EL Audits -> Interventions
      const thermalMeasurements = await DB.prepare(`
        SELECT COUNT(*) as count 
        FROM thermal_measurements tm
        JOIN interventions i ON tm.intervention_id = i.id
        JOIN audits a ON a.intervention_id = i.id
        JOIN el_audits ea ON ea.audit_token = a.audit_token
        JOIN pv_cartography_audit_links pcal ON ea.audit_token = pcal.el_audit_token
        WHERE pcal.pv_plant_id = ?
      `).bind(plantId).first();
      
      thermalCount = (thermalMeasurements as any)?.count || 0;
    }
    
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
// GET /api/report/unified/:token - Récupérer rapport par token
// ============================================================================
unifiedReportRoutes.get('/:token', async (c) => {
  const { DB } = c.env;
  const token = c.req.param('token');
  
  try {
    const report = await DB.prepare(`
      SELECT * FROM unified_reports WHERE report_token = ?
    `).bind(token).first();
    
    if (!report) {
      return c.json({
        success: false,
        error: 'Rapport non trouvé'
      }, 404);
    }
    
    return c.json({
      success: true,
      report: {
        reportToken: (report as any).report_token,
        plantId: (report as any).plant_id,
        auditElToken: (report as any).audit_el_token,
        inspectionToken: (report as any).inspection_token,
        reportTitle: (report as any).report_title,
        clientName: (report as any).client_name,
        auditDate: (report as any).audit_date,
        auditorName: (report as any).auditor_name,
        overallConformityRate: (report as any).overall_conformity_rate,
        criticalIssuesCount: (report as any).critical_issues_count,
        majorIssuesCount: (report as any).major_issues_count,
        minorIssuesCount: (report as any).minor_issues_count,
        modulesIncluded: JSON.parse((report as any).modules_included),
        htmlContent: (report as any).html_content,
        createdAt: (report as any).created_at,
        generatedBy: (report as any).generated_by,
        reportVersion: (report as any).report_version
      }
    });
    
  } catch (error) {
    console.error('Erreur récupération rapport:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, 500);
  }
});

// ============================================================================
// GET /api/report/unified/plant/:plantId - Lister rapports d'une centrale
// ============================================================================
unifiedReportRoutes.get('/plant/:plantId', async (c) => {
  const { DB } = c.env;
  const plantId = parseInt(c.req.param('plantId'));
  
  if (isNaN(plantId)) {
    return c.json({
      success: false,
      error: 'plantId invalide'
    }, 400);
  }
  
  try {
    const reports = await DB.prepare(`
      SELECT 
        id, report_token, report_title, client_name, audit_date,
        overall_conformity_rate, critical_issues_count, major_issues_count, minor_issues_count,
        modules_included, created_at, auditor_name
      FROM unified_reports 
      WHERE plant_id = ?
      ORDER BY created_at DESC
    `).bind(plantId).all();
    
    return c.json({
      success: true,
      plantId,
      reports: (reports.results || []).map((r: any) => ({
        id: r.id,
        reportToken: r.report_token,
        reportTitle: r.report_title,
        clientName: r.client_name,
        auditDate: r.audit_date,
        overallConformityRate: r.overall_conformity_rate,
        criticalIssuesCount: r.critical_issues_count,
        majorIssuesCount: r.major_issues_count,
        minorIssuesCount: r.minor_issues_count,
        modulesIncluded: JSON.parse(r.modules_included),
        createdAt: r.created_at,
        auditorName: r.auditor_name
      }))
    });
    
  } catch (error) {
    console.error('Erreur liste rapports centrale:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, 500);
  }
});
