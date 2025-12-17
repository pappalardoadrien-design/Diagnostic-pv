/**
 * Aggregator - Logique agrégation données multi-modules
 * Collecte données EL, IV, Visuels, Isolation, Thermique
 */

import type { D1Database } from '@cloudflare/workers-types';
import type {
  UnifiedReportData,
  ELModuleData,
  IVModuleData,
  VisualModuleData,
  IsolationModuleData,
  ThermalModuleData,
  GenerateUnifiedReportRequest
} from './types/index.js';
import {
  generateReportToken,
  calculateOverallConformity,
  requiresUrgentAction
} from './types/index.js';

/**
 * Agrège toutes les données modules pour rapport unifié
 */
export async function aggregateUnifiedReportData(
  DB: D1Database,
  request: GenerateUnifiedReportRequest
): Promise<UnifiedReportData> {
  
  const reportToken = generateReportToken();
  const includeModules = request.includeModules || ['el', 'iv', 'visual', 'isolation', 'thermal'];
  
  // Agrégation parallèle
  const [elData, ivData, visualData, isolationData, thermalData] = await Promise.all([
    includeModules.includes('el') ? aggregateELModule(DB, request) : createEmptyELData(),
    includeModules.includes('iv') ? aggregateIVModule(DB, request) : createEmptyIVData(),
    includeModules.includes('visual') ? aggregateVisualModule(DB, request) : createEmptyVisualData(),
    includeModules.includes('isolation') ? aggregateIsolationModule(DB, request) : createEmptyIsolationData(),
    includeModules.includes('thermal') ? aggregateThermalModule(DB, request) : createEmptyThermalData()
  ]);
  
  // Récupération des données OFFICIELLES du CRM (Source de vérité)
  let officialClientName = null;
  let officialProjectName = null;
  let officialLocation = null;

  if (request.plantId) {
    try {
      const crmData = await DB.prepare(`
        SELECT c.company_name, p.name as project_name, p.address_city, p.site_address
        FROM projects p
        JOIN crm_clients c ON p.client_id = c.id
        WHERE p.id = ?
      `).bind(request.plantId).first();

      if (crmData) {
        officialClientName = crmData.company_name;
        officialProjectName = crmData.project_name;
        officialLocation = crmData.site_address ? `${crmData.site_address}, ${crmData.address_city || ''}` : crmData.address_city;
      }
    } catch (e) {
      console.warn('Impossible de récupérer les données CRM pour le rapport', e);
    }
  }

  // Calcul synthèse globale
  const totalModules = elData.hasData ? elData.totalModules : 0;
  const criticalCount = (elData.criticalDefects?.length || 0) + (visualData.criticalDefectsCount || 0);
  const majorCount = visualData.defects?.filter(d => d.severity === 'major').length || 0;
  const minorCount = visualData.defects?.filter(d => d.severity === 'minor').length || 0;
  
  const report: UnifiedReportData = {
    reportToken,
    plantId: request.plantId || null,
    // Priorité aux données CRM, sinon fallback sur les données d'audit
    plantName: officialProjectName || elData.projectName || visualData.projectName || 'Centrale PV',
    clientName: officialClientName || elData.clientName || visualData.projectName || 'Client',
    location: officialLocation || elData.location || 'Localisation inconnue',
    generatedAt: new Date().toISOString(),
    generatedBy: request.generatedBy || null,
    
    elModule: elData,
    ivModule: ivData,
    visualModule: visualData,
    isolationModule: isolationData,
    thermalModule: thermalData,
    
    summary: {
      totalModulesAudited: totalModules,
      overallConformityRate: 0, // Calculé après
      criticalIssuesCount: criticalCount,
      majorIssuesCount: majorCount,
      minorIssuesCount: minorCount,
      urgentActionsRequired: false // Calculé après
    },
    
    recommendations: [] // Généré après
  };
  
  // Calculs finaux
  report.summary.overallConformityRate = calculateOverallConformity(report);
  report.summary.urgentActionsRequired = requiresUrgentAction(report);
  report.recommendations = generateRecommendations(report);
  
  return report;
}

// ============================================================================
// MODULE EL - ÉLECTROLUMINESCENCE
// ============================================================================

async function aggregateELModule(
  DB: D1Database,
  request: GenerateUnifiedReportRequest
): Promise<ELModuleData> {
  
  if (!request.auditElToken && !request.plantId) {
    return createEmptyELData();
  }
  
  try {
    // Récupérer audit EL
    let audit;
    if (request.auditElToken) {
      audit = await DB.prepare(`
        SELECT * FROM el_audits WHERE audit_token = ?
      `).bind(request.auditElToken).first();
    } else {
      // Dernier audit pour cette centrale via table de liaison
      audit = await DB.prepare(`
        SELECT ea.* 
        FROM el_audits ea
        JOIN pv_cartography_audit_links pcal ON ea.audit_token = pcal.el_audit_token
        WHERE pcal.pv_plant_id = ? 
        ORDER BY ea.created_at DESC 
        LIMIT 1
      `).bind(request.plantId).first();
    }
    
    if (!audit) return createEmptyELData();
    
    // Stats modules
    const stats = await DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN defect_type = 'ok' OR defect_type IS NULL THEN 1 ELSE 0 END) as ok,
        SUM(CASE WHEN defect_type = 'inequality' THEN 1 ELSE 0 END) as inequality,
        SUM(CASE WHEN defect_type = 'microcracks' THEN 1 ELSE 0 END) as microcracks,
        SUM(CASE WHEN defect_type = 'dead' THEN 1 ELSE 0 END) as dead,
        SUM(CASE WHEN defect_type = 'string_open' THEN 1 ELSE 0 END) as string_open,
        SUM(CASE WHEN defect_type = 'not_connected' THEN 1 ELSE 0 END) as not_connected
      FROM el_modules WHERE audit_token = ?
    `).bind(audit.audit_token).first();
    
    // Défauts critiques (dead + string_open)
    const criticalDefects = await DB.prepare(`
      SELECT module_identifier, defect_type, comment 
      FROM el_modules 
      WHERE audit_token = ? AND (defect_type = 'dead' OR defect_type = 'string_open')
      ORDER BY string_number, position_in_string
      LIMIT 20
    `).bind(audit.audit_token).all();
    
    const totalModules = stats?.total || 0;
    const okModules = stats?.ok || 0;
    const conformityRate = totalModules > 0 ? Math.round((okModules / totalModules) * 10000) / 100 : 0;
    
    return {
      hasData: true,
      auditToken: audit.audit_token,
      projectName: audit.project_name || 'Projet',
      clientName: audit.client_name || 'Client',
      location: audit.location || 'Localisation',
      auditDate: audit.audit_date || audit.created_at,
      totalModules,
      stats: {
        ok: stats?.ok || 0,
        inequality: stats?.inequality || 0,
        microcracks: stats?.microcracks || 0,
        dead: stats?.dead || 0,
        string_open: stats?.string_open || 0,
        not_connected: stats?.not_connected || 0
      },
      conformityRate,
      criticalDefects: criticalDefects.results.map((d: any) => ({
        moduleId: d.module_id,
        status: d.status,
        comment: d.comment
      }))
    };
    
  } catch (error) {
    console.error('Erreur agrégation EL:', error);
    return createEmptyELData();
  }
}

function createEmptyELData(): ELModuleData {
  return {
    hasData: false,
    auditToken: '',
    projectName: '',
    clientName: '',
    location: '',
    auditDate: '',
    totalModules: 0,
    stats: { ok: 0, inequality: 0, microcracks: 0, dead: 0, string_open: 0, not_connected: 0 },
    conformityRate: 0,
    criticalDefects: []
  };
}

// ============================================================================
// MODULE IV - COURBES I-V
// ============================================================================

async function aggregateIVModule(
  DB: D1Database,
  request: GenerateUnifiedReportRequest
): Promise<IVModuleData> {
  
  try {
    // Déterminer audit_token pour récupérer courbes IV
    let auditToken = request.auditElToken;
    
    if (!auditToken && request.plantId) {
      // Trouver audit EL via table de liaison
      const audit = await DB.prepare(`
        SELECT ea.audit_token 
        FROM el_audits ea
        JOIN pv_cartography_audit_links pcal ON ea.audit_token = pcal.el_audit_token
        WHERE pcal.pv_plant_id = ? 
        ORDER BY ea.created_at DESC 
        LIMIT 1
      `).bind(request.plantId).first();
      
      if (audit) {
        auditToken = (audit as any).audit_token;
      }
    }
    
    if (!auditToken) {
      return createEmptyIVData();
    }
    
    // Récupérer courbes I-V via audit_token
    const curves = await DB.prepare(`
      SELECT * FROM iv_curves 
      WHERE audit_token = ? 
      ORDER BY created_at DESC 
      LIMIT 500
    `).bind(auditToken).all();
    
    if (!curves.results || curves.results.length === 0) {
      return createEmptyIVData();
    }
    
    // Calcul statistiques
    let sumFF = 0, sumRds = 0, sumUf = 0, validCount = 0, outOfTolerance = 0;
    
    const curvesData = curves.results.map((c: any) => {
      const ff = c.fill_factor || 0;
      const rds = c.series_resistance || 0;
      const uf = c.operating_voltage || 0;
      const isValid = c.is_valid !== 0;
      
      if (isValid) {
        sumFF += ff;
        sumRds += rds;
        sumUf += uf;
        validCount++;
      } else {
        outOfTolerance++;
      }
      
      return {
        stringNumber: c.string_number || 0,
        moduleNumber: c.module_number || 0,
        ff,
        rds,
        uf,
        isValid
      };
    });
    
    return {
      hasData: true,
      totalCurves: curves.results.length,
      avgFF: validCount > 0 ? Math.round((sumFF / validCount) * 100) / 100 : 0,
      avgRds: validCount > 0 ? Math.round((sumRds / validCount) * 100) / 100 : 0,
      avgUf: validCount > 0 ? Math.round((sumUf / validCount) * 100) / 100 : 0,
      outOfToleranceCount: outOfTolerance,
      curves: curvesData.slice(0, 50) // Top 50
    };
    
  } catch (error) {
    console.error('Erreur agrégation IV:', error);
    return createEmptyIVData();
  }
}

function createEmptyIVData(): IVModuleData {
  return {
    hasData: false,
    totalCurves: 0,
    avgFF: 0,
    avgRds: 0,
    avgUf: 0,
    outOfToleranceCount: 0,
    curves: []
  };
}

// ============================================================================
// MODULE VISUELS - CONTRÔLES IEC 62446-1
// ============================================================================

async function aggregateVisualModule(
  DB: D1Database,
  request: GenerateUnifiedReportRequest
): Promise<VisualModuleData> {
  
  try {
    // Récupérer inspection visuelle
    let inspection;
    if (request.inspectionToken) {
      inspection = await DB.prepare(`
        SELECT * FROM visual_inspections WHERE inspection_token = ?
      `).bind(request.inspectionToken).first();
    } else if (request.plantId) {
      inspection = await DB.prepare(`
        SELECT * FROM visual_inspections WHERE plant_id = ? ORDER BY created_at DESC LIMIT 1
      `).bind(request.plantId).first();
    }
    
    if (!inspection) return createEmptyVisualData();
    
    // Stats checklist
    const checklistStats = await DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'checked' THEN 1 ELSE 0 END) as checked,
        SUM(CASE WHEN conformity = 'conform' THEN 1 ELSE 0 END) as conform,
        SUM(CASE WHEN conformity = 'non_conform' THEN 1 ELSE 0 END) as non_conform
      FROM visual_inspection_items WHERE inspection_token = ?
    `).bind(inspection.inspection_token).first();
    
    // Défauts
    const defects = await DB.prepare(`
      SELECT id, defect_location, equipment_type, defect_type, severity, description, recommended_action
      FROM visual_defects 
      WHERE inspection_token = ?
      ORDER BY 
        CASE severity 
          WHEN 'critical' THEN 1 
          WHEN 'major' THEN 2 
          WHEN 'minor' THEN 3 
          ELSE 4 
        END,
        id
      LIMIT 50
    `).bind(inspection.inspection_token).all();
    
    const totalItems = checklistStats?.total || 0;
    const conformItems = checklistStats?.conform || 0;
    const conformityRate = totalItems > 0 ? Math.round((conformItems / totalItems) * 10000) / 100 : 0;
    
    const criticalCount = defects.results.filter((d: any) => d.severity === 'critical').length;
    
    return {
      hasData: true,
      inspectionToken: inspection.inspection_token,
      projectName: inspection.project_name || 'Projet',
      inspectionDate: inspection.inspection_date || inspection.created_at,
      checklist: {
        totalItems,
        checkedItems: checklistStats?.checked || 0,
        conformItems,
        nonConformItems: checklistStats?.non_conform || 0,
        conformityRate
      },
      defects: defects.results.map((d: any) => ({
        id: d.id,
        location: d.defect_location,
        equipmentType: d.equipment_type,
        defectType: d.defect_type,
        severity: d.severity,
        description: d.description,
        recommendedAction: d.recommended_action
      })),
      criticalDefectsCount: criticalCount
    };
    
  } catch (error) {
    console.error('Erreur agrégation Visuels:', error);
    return createEmptyVisualData();
  }
}

function createEmptyVisualData(): VisualModuleData {
  return {
    hasData: false,
    inspectionToken: '',
    projectName: '',
    inspectionDate: '',
    checklist: {
      totalItems: 0,
      checkedItems: 0,
      conformItems: 0,
      nonConformItems: 0,
      conformityRate: 0
    },
    defects: [],
    criticalDefectsCount: 0
  };
}

// ============================================================================
// MODULE ISOLATION - TESTS DC/AC
// ============================================================================

async function aggregateIsolationModule(
  DB: D1Database,
  request: GenerateUnifiedReportRequest
): Promise<IsolationModuleData> {
  
  try {
    // Stats globales
    let query = 'SELECT COUNT(*) as total, SUM(is_conform) as conform FROM isolation_tests';
    const params: any[] = [];
    
    if (request.plantId) {
      query += ' WHERE plant_id = ?';
      params.push(request.plantId);
    }
    
    const stats = await DB.prepare(query).bind(...params).first();
    
    if (!stats || stats.total === 0) {
      return createEmptyIsolationData();
    }
    
    // Dernier test
    let latestQuery = 'SELECT * FROM isolation_tests';
    if (request.plantId) {
      latestQuery += ' WHERE plant_id = ?';
    }
    latestQuery += ' ORDER BY test_date DESC, created_at DESC LIMIT 1';
    
    const latestTest = await DB.prepare(latestQuery).bind(...params).first();
    
    // Moyennes mesures
    let avgQuery = `
      SELECT 
        AVG(dc_positive_to_earth) as avg_dc_pos,
        AVG(dc_negative_to_earth) as avg_dc_neg,
        AVG(dc_positive_to_negative) as avg_dc_pos_neg,
        AVG(ac_to_earth) as avg_ac
      FROM isolation_tests
    `;
    if (request.plantId) {
      avgQuery += ' WHERE plant_id = ?';
    }
    
    const avgMeasurements = await DB.prepare(avgQuery).bind(...params).first();
    
    const totalTests = stats.total || 0;
    const conformTests = stats.conform || 0;
    const conformityRate = totalTests > 0 ? Math.round((conformTests / totalTests) * 10000) / 100 : 0;
    
    return {
      hasData: true,
      totalTests,
      conformTests,
      nonConformTests: totalTests - conformTests,
      conformityRate,
      latestTest: latestTest ? {
        testToken: latestTest.test_token,
        testDate: latestTest.test_date,
        dcPositiveToEarth: latestTest.dc_positive_to_earth,
        dcNegativeToEarth: latestTest.dc_negative_to_earth,
        dcPositiveToNegative: latestTest.dc_positive_to_negative,
        acToEarth: latestTest.ac_to_earth,
        isConform: Boolean(latestTest.is_conform)
      } : null,
      avgMeasurements: {
        dcPosEarth: Math.round((avgMeasurements?.avg_dc_pos || 0) * 100) / 100,
        dcNegEarth: Math.round((avgMeasurements?.avg_dc_neg || 0) * 100) / 100,
        dcPosNeg: Math.round((avgMeasurements?.avg_dc_pos_neg || 0) * 100) / 100,
        acEarth: Math.round((avgMeasurements?.avg_ac || 0) * 100) / 100
      }
    };
    
  } catch (error) {
    console.error('Erreur agrégation Isolation:', error);
    return createEmptyIsolationData();
  }
}

function createEmptyIsolationData(): IsolationModuleData {
  return {
    hasData: false,
    totalTests: 0,
    conformTests: 0,
    nonConformTests: 0,
    conformityRate: 0,
    latestTest: null,
    avgMeasurements: {
      dcPosEarth: 0,
      dcNegEarth: 0,
      dcPosNeg: 0,
      acEarth: 0
    }
  };
}

// ============================================================================
// MODULE THERMIQUE - THERMOGRAPHIE IR
// ============================================================================

async function aggregateThermalModule(
  DB: D1Database,
  request: GenerateUnifiedReportRequest
): Promise<ThermalModuleData> {
  
  try {
    // 1. Déterminer audit_token
    let auditToken = request.auditElToken;

    if (!auditToken && request.plantId) {
      // Tenter de retrouver le dernier audit EL lié à cette centrale
      const audit = await DB.prepare(`
        SELECT ea.audit_token 
        FROM el_audits ea
        JOIN pv_cartography_audit_links pcal ON ea.audit_token = pcal.el_audit_token
        WHERE pcal.pv_plant_id = ? 
        ORDER BY ea.created_at DESC 
        LIMIT 1
      `).bind(request.plantId).first();
      
      if (audit) {
        auditToken = (audit as any).audit_token;
      }
    }

    if (!auditToken) {
      return createEmptyThermalData();
    }

    // 2. Récupérer mesures thermiques (via Jointure Interventions ou directement audit_token)
    // On privilégie la jointure standard utilisée dans le module thermique
    const measurements = await DB.prepare(`
      SELECT tm.*
      FROM thermal_measurements tm
      JOIN interventions i ON tm.intervention_id = i.id
      JOIN audits a ON a.intervention_id = i.id
      WHERE a.audit_token = ?
    `).bind(auditToken).all();

    if (!measurements.results || measurements.results.length === 0) {
      // Fallback: Essayer via audit_token direct (si migration effectuée)
      const directMeasurements = await DB.prepare(`
        SELECT * FROM thermal_measurements WHERE audit_token = ?
      `).bind(auditToken).all();

      if (!directMeasurements.results || directMeasurements.results.length === 0) {
        return createEmptyThermalData();
      }
      measurements.results = directMeasurements.results;
    }

    // 3. Calculs statistiques
    const results = measurements.results as any[];
    const totalMeasurements = results.length;
    
    // Compter défauts
    const criticalHotspots = results.filter(m => m.defect_type === 'hotspot' && m.severity_level >= 4).length;
    const allHotspots = results.filter(m => m.defect_type === 'hotspot').length;
    const bypassDiodes = results.filter(m => m.defect_type === 'bypass_diode').length;
    
    // Trouver T° Max absolue et Delta T Max
    const maxTemp = Math.max(...results.map(m => m.temperature_max || 0));
    const maxDeltaT = Math.max(...results.map(m => m.delta_t_max || 0));

    // Générer résumé textuel
    let summary = `${totalMeasurements} mesure(s) thermique(s). `;
    if (criticalHotspots > 0) {
      summary += `ATTENTION: ${criticalHotspots} hotspot(s) critique(s) détecté(s) (Sévérité ≥ 4). `;
    } else if (allHotspots > 0) {
      summary += `${allHotspots} hotspot(s) détecté(s). `;
    } else {
      summary += "Aucune anomalie thermique majeure. ";
    }
    summary += `Delta T Max: ${maxDeltaT.toFixed(1)}°C.`;

    return {
      hasData: true,
      reportUrl: null, // Pas de PDF externe pour l'instant
      hotSpotsCount: allHotspots + bypassDiodes,
      summary: summary
    };

  } catch (error) {
    console.error('Erreur agrégation Thermique:', error);
    return createEmptyThermalData();
  }
}

function createEmptyThermalData(): ThermalModuleData {
  return {
    hasData: false,
    reportUrl: null,
    hotSpotsCount: null,
    summary: null
  };
}

// ============================================================================
// RECOMMANDATIONS
// ============================================================================

function generateRecommendations(report: UnifiedReportData) {
  const recommendations: UnifiedReportData['recommendations'] = [];
  
  // Recommandations EL
  if (report.elModule.hasData && report.elModule.stats.dead > 0) {
    recommendations.push({
      priority: 'urgent',
      category: 'safety',
      title: `Remplacement ${report.elModule.stats.dead} module(s) HS`,
      description: `${report.elModule.stats.dead} module(s) identifié(s) comme hors service (dead) lors de l'audit EL. Risque de perte de production et arc électrique.`,
      estimatedImpact: `~${report.elModule.stats.dead * 400}kWh/an`,
      deadline: '2 semaines'
    });
  }
  
  // Recommandations Visuels
  if (report.visualModule.hasData && report.visualModule.criticalDefectsCount > 0) {
    recommendations.push({
      priority: 'urgent',
      category: 'safety',
      title: `Correction ${report.visualModule.criticalDefectsCount} défaut(s) critique(s)`,
      description: `${report.visualModule.criticalDefectsCount} défaut(s) critique(s) identifié(s) lors du contrôle visuel IEC 62446-1. Intervention immédiate requise.`,
      estimatedImpact: null,
      deadline: '1 semaine'
    });
  }
  
  // Recommandations Isolation
  if (report.isolationModule.hasData && report.isolationModule.nonConformTests > 0) {
    recommendations.push({
      priority: 'high',
      category: 'safety',
      title: `Amélioration isolation électrique`,
      description: `${report.isolationModule.nonConformTests} test(s) d'isolation non conforme(s). Vérifier câblage et boîtes de jonction.`,
      estimatedImpact: null,
      deadline: '1 mois'
    });
  }
  
  // Recommandation générale maintenance
  if (report.summary.overallConformityRate < 80) {
    recommendations.push({
      priority: 'high',
      category: 'maintenance',
      title: 'Plan de maintenance préventive',
      description: `Conformité globale ${report.summary.overallConformityRate}% < 80%. Mise en place d'un plan de maintenance préventive recommandée.`,
      estimatedImpact: null,
      deadline: '3 mois'
    });
  }
  
  return recommendations;
}
