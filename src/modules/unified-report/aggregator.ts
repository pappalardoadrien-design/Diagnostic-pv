/**
 * Aggregator - Logique agrégation données multi-modules
 * Collecte données EL, IV, Visuels, Isolation, Thermique, Photos, Notes, Audit Qualité, Diodes
 */

import type { D1Database } from '@cloudflare/workers-types';
import type {
  UnifiedReportData,
  ELModuleData,
  IVModuleData,
  VisualModuleData,
  IsolationModuleData,
  ThermalModuleData,
  PhotosModuleData,
  AuditQualiteModuleData,
  DiodeTestModuleData,
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
  const includeModules = request.includeModules || ['el', 'iv', 'visual', 'isolation', 'thermal', 'photos', 'audit_qualite', 'diodes', 'pvserv_dark'];
  
  // Agrégation parallèle
  const [elData, ivData, visualData, isolationData, thermalData, photosData, fieldNotes, auditQualiteData, diodeTestData, pvservDarkData] = await Promise.all([
    includeModules.includes('el') ? aggregateELModule(DB, request) : createEmptyELData(),
    includeModules.includes('iv') ? aggregateIVModule(DB, request) : createEmptyIVData(),
    includeModules.includes('visual') ? aggregateVisualModule(DB, request) : createEmptyVisualData(),
    includeModules.includes('isolation') ? aggregateIsolationModule(DB, request) : createEmptyIsolationData(),
    includeModules.includes('thermal') ? aggregateThermalModule(DB, request) : createEmptyThermalData(),
    includeModules.includes('photos') ? aggregatePhotosModule(DB, request) : createEmptyPhotosData(),
    getAuditNotes(DB, request),
    includeModules.includes('audit_qualite') ? aggregateAuditQualiteModule(DB, request) : createEmptyAuditQualiteData(),
    includeModules.includes('diodes') ? aggregateDiodeTestModule(DB, request) : createEmptyDiodeTestData(),
    includeModules.includes('pvserv_dark') ? aggregatePVServDarkModule(DB, request) : createEmptyPVServDarkData()
  ]);
  
  // Calcul synthèse globale
  const totalModules = elData.hasData ? elData.totalModules : 0;
  const criticalCount = (elData.criticalDefects?.length || 0) + (visualData.criticalDefectsCount || 0) + (auditQualiteData.criticalItems?.length || 0) + (diodeTestData.criticalDefects?.length || 0) + (pvservDarkData.criticalCount || 0);
  const majorCount = (visualData.defects?.filter(d => d.severity === 'major').length || 0) + (auditQualiteData.nbNonConformites || 0);
  const minorCount = (visualData.defects?.filter(d => d.severity === 'minor').length || 0) + (auditQualiteData.nbObservations || 0);
  
  const report: UnifiedReportData = {
    reportToken,
    plantId: request.plantId || null,
    // Priorité aux données CRM, sinon fallback sur les données d'audit
    plantName: elData.projectName || visualData.projectName || 'Centrale PV',
    clientName: elData.clientName || visualData.projectName || 'Client',
    location: elData.location || 'Localisation inconnue',
    generatedAt: new Date().toISOString(),
    generatedBy: request.generatedBy || null,
    
    elModule: elData,
    ivModule: ivData,
    visualModule: visualData,
    isolationModule: isolationData,
    thermalModule: thermalData,
    auditQualiteModule: auditQualiteData,
    diodeTestModule: diodeTestData,
    pvservDarkModule: pvservDarkData,

    modules: {
        photos: {
            enabled: photosData.hasData,
            count: photosData.totalPhotos,
            data: photosData
        }
    },
    
    fieldNotes, // Notes vocales/textuelles
    
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

  // Récupération des données OFFICIELLES du CRM (Source de vérité)
  if (request.plantId) {
    try {
      const crmData = await DB.prepare(`
        SELECT c.company_name, p.name as project_name, p.address_city, p.site_address
        FROM projects p
        JOIN crm_clients c ON p.client_id = c.id
        WHERE p.id = ?
      `).bind(request.plantId).first();

      if (crmData) {
        // Override avec les données officielles si disponibles
        report.clientName = crmData.company_name as string || report.clientName;
        report.plantName = crmData.project_name as string || report.plantName;
        const address = crmData.site_address ? `${crmData.site_address}, ${crmData.address_city || ''}` : crmData.address_city;
        report.location = address as string || report.location;
      }
    } catch (e) {
      console.warn('Impossible de récupérer les données CRM pour le rapport', e);
    }
  }
  
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
      // Essayer aussi via plant_id directement sur el_audits
      if (request.plantId) {
        const audit = await DB.prepare(`
          SELECT audit_token FROM el_audits WHERE plant_id = ? ORDER BY created_at DESC LIMIT 1
        `).bind(request.plantId).first();
        if (audit) {
          auditToken = (audit as any).audit_token;
        }
      }
    }

    if (!auditToken) {
      return createEmptyThermalData();
    }

    // 2. Récupérer mesures thermiques
    // Chemin principal: el_audits.intervention_id → interventions → thermal_measurements
    let measurements = await DB.prepare(`
      SELECT tm.*
      FROM thermal_measurements tm
      JOIN interventions i ON tm.intervention_id = i.id
      JOIN el_audits ea ON ea.intervention_id = i.id
      WHERE ea.audit_token = ?
    `).bind(auditToken).all();

    if (!measurements.results || measurements.results.length === 0) {
      // Fallback 1: via pv_cartography_audit_links → projects → interventions
      measurements = await DB.prepare(`
        SELECT tm.* FROM thermal_measurements tm
        WHERE tm.intervention_id IN (
          SELECT i.id FROM interventions i 
          JOIN projects p ON i.project_id = p.id
          JOIN pv_cartography_audit_links pcal ON pcal.pv_plant_id = p.id
          WHERE pcal.el_audit_token = ?
        )
      `).bind(auditToken).all();
    }

    if (!measurements.results || measurements.results.length === 0) {
      // Fallback 2: via plantId → projects → interventions (quand el_audits.intervention_id est NULL)
      if (request.plantId) {
        measurements = await DB.prepare(`
          SELECT tm.* FROM thermal_measurements tm
          WHERE tm.intervention_id IN (
            SELECT i.id FROM interventions i WHERE i.project_id IN (
              SELECT p.id FROM projects p WHERE p.id = ?
            )
          )
        `).bind(request.plantId).all();
      }
    }

    if (!measurements.results || measurements.results.length === 0) {
      return createEmptyThermalData();
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
// MODULE PHOTOS - GALERIE & PREUVES
// ============================================================================

async function aggregatePhotosModule(
  DB: D1Database,
  request: GenerateUnifiedReportRequest
): Promise<PhotosModuleData> {
  
  try {
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
      return createEmptyPhotosData();
    }

    const photos = await DB.prepare(`
      SELECT photo_url, manual_comment, manual_tag 
      FROM el_photos 
      WHERE audit_token = ?
    `).bind(auditToken).all();

    if (!photos.results || photos.results.length === 0) {
        return createEmptyPhotosData();
    }

    return {
        hasData: true,
        totalPhotos: photos.results.length,
        photos: photos.results.map((p: any) => ({
            url: p.photo_url,
            description: p.manual_comment || '',
            tag: p.manual_tag || 'Autre'
        }))
    };

  } catch (error) {
    console.error('Erreur agrégation Photos:', error);
    return createEmptyPhotosData();
  }
}

function createEmptyPhotosData(): PhotosModuleData {
  return {
    hasData: false,
    totalPhotos: 0,
    photos: []
  };
}

// ============================================================================
// RÉCUPÉRATION NOTES DE TERRAIN
// ============================================================================

async function getAuditNotes(
  DB: D1Database,
  request: GenerateUnifiedReportRequest
): Promise<UnifiedReportData['fieldNotes']> {
  if (!request.auditElToken && !request.plantId) return [];
  
  try {
    let auditToken = request.auditElToken;
    
    // Si pas de token direct, on cherche le dernier audit de la centrale
    if (!auditToken && request.plantId) {
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

    if (!auditToken) return [];

    const notes = await DB.prepare(`
      SELECT id, content, technician_id, created_at 
      FROM el_audit_notes 
      WHERE audit_token = ? 
      ORDER BY created_at ASC
    `).bind(auditToken).all();
    
    return notes.results.map((n: any) => ({
      id: n.id,
      content: n.content,
      technicianId: n.technician_id,
      createdAt: n.created_at
    }));
  } catch (e) {
    console.warn('Erreur récupération notes:', e);
    return [];
  }
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
  
  // Recommandations Audit Qualité
  if (report.auditQualiteModule.hasData && report.auditQualiteModule.criticalItems.length > 0) {
    recommendations.push({
      priority: 'urgent',
      category: 'safety',
      title: `${report.auditQualiteModule.criticalItems.length} non-conformité(s) critique(s) NF C 15-100`,
      description: `${report.auditQualiteModule.criticalItems.map(i => i.code).join(', ')} - Points critiques identifiés lors du contrôle qualité terrain. Intervention corrective immédiate requise.`,
      estimatedImpact: null,
      deadline: '1 semaine'
    });
  }
  
  // Recommandations Diodes
  if (report.diodeTestModule.hasData && report.diodeTestModule.diodesDefective > 0) {
    recommendations.push({
      priority: report.diodeTestModule.criticalDefects.length > 0 ? 'urgent' : 'high',
      category: 'safety',
      title: `Remplacement ${report.diodeTestModule.diodesDefective} diode(s) bypass défectueuse(s)`,
      description: `${report.diodeTestModule.diodesDefective} diode(s) bypass identifiée(s) comme défectueuse(s). Risque de hotspot, arc électrique et incendie.`,
      estimatedImpact: `~${report.diodeTestModule.diodesDefective * 200}kWh/an`,
      deadline: '2 semaines'
    });
  }
  
  // Recommandations PVServ Dark (Courbes Sombres)
  if (report.pvservDarkModule.hasData && report.pvservDarkModule.anomalyCount > 0) {
    const anomalyDetails = report.pvservDarkModule.anomalies
      .map(a => `${a.curveType} Nr.${a.measurementNumber}: ${a.message}`)
      .join('; ');
    recommendations.push({
      priority: report.pvservDarkModule.criticalCount > 0 ? 'urgent' : 'high',
      category: 'performance',
      title: `${report.pvservDarkModule.anomalyCount} anomalie(s) sur courbes sombres PVServ`,
      description: `Analyse de ${report.pvservDarkModule.stringCount} strings et ${report.pvservDarkModule.diodeCount} diodes bypass: ${anomalyDetails}`,
      estimatedImpact: null,
      deadline: report.pvservDarkModule.criticalCount > 0 ? '2 semaines' : '1 mois'
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

// ============================================================================
// MODULE AUDIT QUALITÉ TERRAIN (NF C 15-100 / DTU 40.35)
// ============================================================================

async function aggregateAuditQualiteModule(
  DB: D1Database,
  request: GenerateUnifiedReportRequest
): Promise<AuditQualiteModuleData> {
  
  try {
    // Trouver mission via missionQualiteId ou plantId (= project_id)
    let mission;
    if (request.missionQualiteId) {
      mission = await DB.prepare(`
        SELECT omq.*, p.name as project_name, t.nom as technicien_nom, t.prenom as technicien_prenom
        FROM ordres_mission_qualite omq
        LEFT JOIN projects p ON omq.project_id = p.id
        LEFT JOIN techniciens t ON omq.technicien_id = t.id
        WHERE omq.id = ?
      `).bind(request.missionQualiteId).first();
    } else if (request.plantId) {
      // Dernière mission pour ce projet
      mission = await DB.prepare(`
        SELECT omq.*, p.name as project_name, t.nom as technicien_nom, t.prenom as technicien_prenom
        FROM ordres_mission_qualite omq
        LEFT JOIN projects p ON omq.project_id = p.id
        LEFT JOIN techniciens t ON omq.technicien_id = t.id
        WHERE omq.project_id = ?
        ORDER BY omq.created_at DESC LIMIT 1
      `).bind(request.plantId).first();
    }
    
    if (!mission) return createEmptyAuditQualiteData();
    
    const missionId = (mission as any).id;
    
    // Stats SOL
    const solStats = await DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN conformite = 'conforme' THEN 1 ELSE 0 END) as conformes,
        SUM(CASE WHEN conformite = 'non_conforme' THEN 1 ELSE 0 END) as non_conformes,
        SUM(CASE WHEN conformite = 'observation' THEN 1 ELSE 0 END) as observations
      FROM aq_checklist_items WHERE mission_id = ?
    `).bind(missionId).first();
    
    // Stats TOITURE
    const toitureStats = await DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN conformite = 'conforme' THEN 1 ELSE 0 END) as conformes,
        SUM(CASE WHEN conformite = 'non_conforme' THEN 1 ELSE 0 END) as non_conformes,
        SUM(CASE WHEN conformite = 'observation' THEN 1 ELSE 0 END) as observations
      FROM aq_checklist_items_toiture WHERE mission_id = ?
    `).bind(missionId).first();
    
    // Items critiques non-conformes
    const criticalSol = await DB.prepare(`
      SELECT code_item, libelle, categorie, severite, norme_reference
      FROM aq_checklist_items 
      WHERE mission_id = ? AND conformite = 'non_conforme' AND severite = 'critique'
      ORDER BY ordre_affichage
    `).bind(missionId).all();
    
    const criticalToiture = await DB.prepare(`
      SELECT code_item, libelle, categorie, severite, norme_reference
      FROM aq_checklist_items_toiture
      WHERE mission_id = ? AND conformite = 'non_conforme' AND severite = 'critique'
      ORDER BY ordre_affichage
    `).bind(missionId).all();
    
    // Commentaires finaux
    const commentaire = await DB.prepare(`
      SELECT conclusion_generale, recommandations FROM aq_commentaires_finaux WHERE mission_id = ?
    `).bind(missionId).first();
    
    const solTotal = (solStats?.total as number) || 0;
    const solConformes = (solStats?.conformes as number) || 0;
    const solNc = (solStats?.non_conformes as number) || 0;
    const solObs = (solStats?.observations as number) || 0;
    
    const toitureTotal = (toitureStats?.total as number) || 0;
    const toitureConformes = (toitureStats?.conformes as number) || 0;
    const toitureNc = (toitureStats?.non_conformes as number) || 0;
    const toitureObs = (toitureStats?.observations as number) || 0;
    
    const totalAll = solTotal + toitureTotal;
    const conformesAll = solConformes + toitureConformes;
    const scoreGlobal = totalAll > 0 ? Math.round((conformesAll / totalAll) * 10000) / 100 : 0;
    
    const techName = (mission as any).technicien_prenom && (mission as any).technicien_nom
      ? `${(mission as any).technicien_prenom} ${(mission as any).technicien_nom}`
      : null;
    
    const criticalItems = [
      ...criticalSol.results.map((i: any) => ({ code: i.code_item, libelle: i.libelle, categorie: i.categorie, severite: i.severite, norme: i.norme_reference, type: 'sol' as const })),
      ...criticalToiture.results.map((i: any) => ({ code: i.code_item, libelle: i.libelle, categorie: i.categorie, severite: i.severite, norme: i.norme_reference, type: 'toiture' as const }))
    ];
    
    return {
      hasData: solTotal > 0 || toitureTotal > 0,
      missionId,
      reference: (mission as any).reference || '',
      typeAudit: (mission as any).type_audit || 'SOL',
      missionDate: (mission as any).date_planifiee || (mission as any).created_at,
      technicianName: techName,
      solChecklist: {
        totalItems: solTotal,
        conformes: solConformes,
        nonConformes: solNc,
        observations: solObs,
        conformityRate: solTotal > 0 ? Math.round((solConformes / solTotal) * 10000) / 100 : 0
      },
      toitureChecklist: {
        totalItems: toitureTotal,
        conformes: toitureConformes,
        nonConformes: toitureNc,
        observations: toitureObs,
        conformityRate: toitureTotal > 0 ? Math.round((toitureConformes / toitureTotal) * 10000) / 100 : 0
      },
      scoreGlobal,
      nbNonConformites: solNc + toitureNc,
      nbObservations: solObs + toitureObs,
      criticalItems,
      conclusion: (commentaire as any)?.conclusion_generale || null,
      recommendations: (commentaire as any)?.recommandations || null
    };
    
  } catch (error) {
    console.error('Erreur agrégation Audit Qualité:', error);
    return createEmptyAuditQualiteData();
  }
}

function createEmptyAuditQualiteData(): AuditQualiteModuleData {
  return {
    hasData: false,
    missionId: null,
    reference: '',
    typeAudit: '',
    missionDate: '',
    technicianName: null,
    solChecklist: { totalItems: 0, conformes: 0, nonConformes: 0, observations: 0, conformityRate: 0 },
    toitureChecklist: { totalItems: 0, conformes: 0, nonConformes: 0, observations: 0, conformityRate: 0 },
    scoreGlobal: 0,
    nbNonConformites: 0,
    nbObservations: 0,
    criticalItems: [],
    conclusion: null,
    recommendations: null
  };
}

// ============================================================================
// MODULE TEST DIODES BYPASS
// ============================================================================

async function aggregateDiodeTestModule(
  DB: D1Database,
  request: GenerateUnifiedReportRequest
): Promise<DiodeTestModuleData> {
  
  try {
    let session;
    if (request.diodeSessionToken) {
      session = await DB.prepare(`
        SELECT * FROM diode_test_sessions WHERE session_token = ?
      `).bind(request.diodeSessionToken).first();
    } else if (request.auditElToken) {
      session = await DB.prepare(`
        SELECT * FROM diode_test_sessions WHERE audit_token = ? ORDER BY created_at DESC LIMIT 1
      `).bind(request.auditElToken).first();
    } else if (request.plantId) {
      session = await DB.prepare(`
        SELECT * FROM diode_test_sessions WHERE (plant_id = ? OR project_id = ?) ORDER BY created_at DESC LIMIT 1
      `).bind(request.plantId, request.plantId).first();
    }
    
    if (!session) return createEmptyDiodeTestData();
    
    const sessionId = (session as any).id;
    
    // Stats
    const stats = await DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'ok' THEN 1 ELSE 0 END) as ok,
        SUM(CASE WHEN status = 'defective' THEN 1 ELSE 0 END) as defective,
        SUM(CASE WHEN status = 'suspect' THEN 1 ELSE 0 END) as suspect,
        MAX(temperature_diode) as max_temp,
        MAX(delta_t) as max_delta_t
      FROM diode_test_results WHERE session_id = ?
    `).bind(sessionId).first();
    
    // Défauts critiques
    const criticalDefects = await DB.prepare(`
      SELECT module_identifier, diode_position, defect_type, severity, temperature_diode, delta_t, observation
      FROM diode_test_results 
      WHERE session_id = ? AND (status = 'defective' AND severity IN ('critical', 'major'))
      ORDER BY severity, module_identifier LIMIT 20
    `).bind(sessionId).all();
    
    const total = (stats?.total as number) || 0;
    const ok = (stats?.ok as number) || 0;
    const defective = (stats?.defective as number) || 0;
    const suspect = (stats?.suspect as number) || 0;
    const conformityRate = total > 0 ? Math.round((ok / total) * 10000) / 100 : 0;
    
    return {
      hasData: total > 0,
      sessionToken: (session as any).session_token,
      method: (session as any).method || 'thermal',
      testDate: (session as any).test_date || (session as any).created_at,
      technicianName: (session as any).technician_name || null,
      totalDiodesTested: total,
      diodesOk: ok,
      diodesDefective: defective,
      diodesSuspect: suspect,
      conformityRate,
      criticalDefects: criticalDefects.results.map((d: any) => ({
        moduleIdentifier: d.module_identifier || '?',
        diodePosition: d.diode_position || 'D?',
        defectType: d.defect_type || 'unknown',
        severity: d.severity,
        temperatureDiode: d.temperature_diode,
        deltaT: d.delta_t,
        observation: d.observation
      })),
      maxTemperature: (stats?.max_temp as number) || null,
      maxDeltaT: (stats?.max_delta_t as number) || null
    };
    
  } catch (error) {
    console.error('Erreur agrégation Diodes:', error);
    return createEmptyDiodeTestData();
  }
}

function createEmptyDiodeTestData(): DiodeTestModuleData {
  return {
    hasData: false,
    sessionToken: '',
    method: '',
    testDate: '',
    technicianName: null,
    totalDiodesTested: 0,
    diodesOk: 0,
    diodesDefective: 0,
    diodesSuspect: 0,
    conformityRate: 0,
    criticalDefects: [],
    maxTemperature: null,
    maxDeltaT: null
  };
}

// ============================================================================
// MODULE PVSERV DARK IV (COURBES SOMBRES)
// ============================================================================

async function aggregatePVServDarkModule(
  DB: D1Database,
  request: GenerateUnifiedReportRequest
): Promise<PVServDarkModuleData> {
  
  try {
    let session;
    
    // Priorité 1 : Token de session PVServ direct
    if (request.pvservSessionToken) {
      session = await DB.prepare(`
        SELECT * FROM pvserv_import_sessions WHERE session_token = ?
      `).bind(request.pvservSessionToken).first();
    }
    // Priorité 2 : Via audit_token (liaison EL)
    else if (request.auditElToken) {
      session = await DB.prepare(`
        SELECT * FROM pvserv_import_sessions WHERE audit_token = ? ORDER BY created_at DESC LIMIT 1
      `).bind(request.auditElToken).first();
    }
    // Priorité 3 : Via plantId (= project_id)
    else if (request.plantId) {
      session = await DB.prepare(`
        SELECT * FROM pvserv_import_sessions WHERE project_id = ? ORDER BY created_at DESC LIMIT 1
      `).bind(request.plantId).first();
    }
    
    if (!session) return createEmptyPVServDarkData();
    
    const s = session as any;
    
    // Récupérer les anomalies détaillées
    const anomalies = await DB.prepare(`
      SELECT measurement_number, curve_type, fill_factor, rds, uf,
             anomaly_type, anomaly_severity, anomaly_message
      FROM pvserv_dark_curves 
      WHERE session_id = ? AND anomaly_detected = 1
      ORDER BY anomaly_severity DESC, curve_type, measurement_number
    `).bind(s.id).all();
    
    // Stats FF min/max strings
    const stringStats = await DB.prepare(`
      SELECT MIN(fill_factor) as min_ff, MAX(fill_factor) as max_ff
      FROM pvserv_dark_curves WHERE session_id = ? AND curve_type = 'string'
    `).bind(s.id).first();
    
    // Stats FF min/max diodes
    const diodeStats = await DB.prepare(`
      SELECT MIN(fill_factor) as min_ff, MAX(fill_factor) as max_ff
      FROM pvserv_dark_curves WHERE session_id = ? AND curve_type = 'diode'
    `).bind(s.id).first();
    
    return {
      hasData: true,
      sessionToken: s.session_token,
      sourceFilename: s.source_filename || '',
      deviceName: s.device_name || null,
      serialNumber: s.serial_number || null,
      technicianName: s.technician_name || null,
      importDate: s.created_at,
      // Strings
      stringCount: s.string_count || 0,
      avgFF_strings: s.avg_ff_strings || 0,
      avgRds_strings: s.avg_rds_strings || 0,
      avgUf_strings: s.avg_uf_strings || 0,
      minFF_strings: (stringStats as any)?.min_ff || 0,
      maxFF_strings: (stringStats as any)?.max_ff || 0,
      // Diodes
      diodeCount: s.diode_count || 0,
      avgFF_diodes: s.avg_ff_diodes || 0,
      avgRds_diodes: s.avg_rds_diodes || 0,
      avgUf_diodes: s.avg_uf_diodes || 0,
      minFF_diodes: (diodeStats as any)?.min_ff || 0,
      maxFF_diodes: (diodeStats as any)?.max_ff || 0,
      // Anomalies
      anomalyCount: s.anomaly_count || 0,
      criticalCount: s.critical_count || 0,
      warningCount: s.warning_count || 0,
      anomalies: (anomalies.results || []).map((a: any) => ({
        measurementNumber: a.measurement_number,
        curveType: a.curve_type,
        anomalyType: a.anomaly_type || 'unknown',
        severity: a.anomaly_severity || 'warning',
        message: a.anomaly_message || 'Anomalie détectée',
        fillFactor: a.fill_factor,
        rds: a.rds,
      }))
    };
    
  } catch (error) {
    console.error('Erreur agrégation PVServ Dark:', error);
    return createEmptyPVServDarkData();
  }
}

function createEmptyPVServDarkData(): PVServDarkModuleData {
  return {
    hasData: false,
    sessionToken: '',
    sourceFilename: '',
    deviceName: null,
    serialNumber: null,
    technicianName: null,
    importDate: '',
    stringCount: 0,
    avgFF_strings: 0,
    avgRds_strings: 0,
    avgUf_strings: 0,
    minFF_strings: 0,
    maxFF_strings: 0,
    diodeCount: 0,
    avgFF_diodes: 0,
    avgRds_diodes: 0,
    avgUf_diodes: 0,
    minFF_diodes: 0,
    maxFF_diodes: 0,
    anomalyCount: 0,
    criticalCount: 0,
    warningCount: 0,
    anomalies: []
  };
}
