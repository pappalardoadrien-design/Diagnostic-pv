// Fonctions pour récupérer les données de chaque module

import type { 
  ELModuleData, 
  VisualModuleData, 
  IVModuleData, 
  IsolationModuleData, 
  ThermalModuleData,
  ModuleAvailability,
  ModuleCode
} from './types.js';

// Fetch EL (Électroluminescence) data
export async function fetchELData(DB: D1Database, plantId: number): Promise<ELModuleData | null> {
  // Trouver le dernier audit EL pour cette centrale
  const auditLink = await DB.prepare(`
    SELECT el.audit_token, el.total_modules, el.ok_count, el.defects_count, el.audit_date
    FROM el_audits el
    JOIN pv_cartography_audit_links pcal ON el.audit_token = pcal.el_audit_token
    WHERE pcal.plant_id = ?
    ORDER BY el.audit_date DESC
    LIMIT 1
  `).bind(plantId).first<any>();

  if (!auditLink) return null;

  // Récupérer les statistiques de défauts
  const defectStats = await DB.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN defect_type = 'Inégalités' THEN 1 ELSE 0 END) as inequalities,
      SUM(CASE WHEN defect_type = 'Microfissures' THEN 1 ELSE 0 END) as microcracks,
      SUM(CASE WHEN defect_type = 'HS' THEN 1 ELSE 0 END) as hs,
      SUM(CASE WHEN defect_type = 'String Ouvert' THEN 1 ELSE 0 END) as string_open,
      SUM(CASE WHEN defect_type = 'Non Raccordé' THEN 1 ELSE 0 END) as not_connected
    FROM el_module_measurements
    WHERE audit_token = ? AND defect_type != 'OK'
  `).bind(auditLink.audit_token).first<any>();

  const conformityRate = auditLink.total_modules > 0 
    ? (auditLink.ok_count / auditLink.total_modules) * 100 
    : 0;

  return {
    audit_token: auditLink.audit_token,
    total_modules: auditLink.total_modules,
    ok_count: auditLink.ok_count,
    defects_count: auditLink.defects_count,
    conformity_rate: Math.round(conformityRate * 100) / 100,
    defect_stats: {
      inequalities: defectStats?.inequalities || 0,
      microcracks: defectStats?.microcracks || 0,
      hs: defectStats?.hs || 0,
      string_open: defectStats?.string_open || 0,
      not_connected: defectStats?.not_connected || 0
    }
  };
}

// Fetch Visual (Inspection Visuelle) data
export async function fetchVisualData(DB: D1Database, plantId: number): Promise<VisualModuleData | null> {
  // Trouver la dernière inspection pour cette centrale
  const inspection = await DB.prepare(`
    SELECT inspection_token, total_items, conform_count, non_conform_count, inspection_date
    FROM visual_inspections
    WHERE plant_id = ?
    ORDER BY inspection_date DESC
    LIMIT 1
  `).bind(plantId).first<any>();

  if (!inspection) return null;

  // Récupérer les problèmes critiques
  const criticalIssues = await DB.prepare(`
    SELECT category, item, status, remarks
    FROM visual_checklist_items
    WHERE inspection_token = ? AND status = 'Non-Conforme'
    LIMIT 10
  `).bind(inspection.inspection_token).all<any>();

  const conformityRate = inspection.total_items > 0
    ? (inspection.conform_count / inspection.total_items) * 100
    : 0;

  return {
    inspection_token: inspection.inspection_token,
    total_items: inspection.total_items,
    conform_count: inspection.conform_count,
    non_conform_count: inspection.non_conform_count,
    conformity_rate: Math.round(conformityRate * 100) / 100,
    critical_issues: criticalIssues.results || []
  };
}

// Fetch IV Curves data
export async function fetchIVData(DB: D1Database, plantId: number): Promise<IVModuleData | null> {
  // Trouver le dernier audit_token lié à cette centrale
  const auditLink = await DB.prepare(`
    SELECT DISTINCT iv.audit_token
    FROM iv_curves iv
    WHERE iv.audit_token IN (
      SELECT el.audit_token 
      FROM el_audits el
      JOIN pv_cartography_audit_links pcal ON el.audit_token = pcal.el_audit_token
      WHERE pcal.plant_id = ?
    )
    ORDER BY iv.created_at DESC
    LIMIT 1
  `).bind(plantId).first<any>();

  if (!auditLink) return null;

  // Récupérer les courbes
  const curves = await DB.prepare(`
    SELECT module_position, string_number, ff, rds, voc, isc, pmax
    FROM iv_curves
    WHERE audit_token = ?
    ORDER BY string_number, module_position
  `).bind(auditLink.audit_token).all<any>();

  if (!curves.results || curves.results.length === 0) return null;

  // Calculer statistiques
  const totalCurves = curves.results.length;
  const avgFF = curves.results.reduce((sum, c) => sum + (c.ff || 0), 0) / totalCurves;
  const avgRds = curves.results.reduce((sum, c) => sum + (c.rds || 0), 0) / totalCurves;
  const outOfToleranceCount = curves.results.filter(c => c.ff < 0.70 || c.rds > 1.2).length;

  const conformityRate = ((totalCurves - outOfToleranceCount) / totalCurves) * 100;

  return {
    total_curves: totalCurves,
    avg_ff: Math.round(avgFF * 1000) / 1000,
    avg_rds: Math.round(avgRds * 1000) / 1000,
    out_of_tolerance_count: outOfToleranceCount,
    conformity_rate: Math.round(conformityRate * 100) / 100,
    curves: curves.results
  };
}

// Fetch Isolation data
export async function fetchIsolationData(DB: D1Database, plantId: number): Promise<IsolationModuleData | null> {
  const tests = await DB.prepare(`
    SELECT 
      test_date,
      dc_positive_to_earth,
      dc_negative_to_earth,
      CASE 
        WHEN dc_positive_to_earth >= 1.0 AND dc_negative_to_earth >= 1.0 THEN 'Conforme'
        ELSE 'Non-Conforme'
      END as conformity
    FROM isolation_tests
    WHERE plant_id = ?
    ORDER BY test_date DESC
  `).bind(plantId).all<any>();

  if (!tests.results || tests.results.length === 0) return null;

  const totalTests = tests.results.length;
  const conformCount = tests.results.filter(t => t.conformity === 'Conforme').length;
  const nonConformCount = totalTests - conformCount;
  const conformityRate = (conformCount / totalTests) * 100;

  const avgDCPos = tests.results.reduce((sum, t) => sum + (t.dc_positive_to_earth || 0), 0) / totalTests;
  const avgDCNeg = tests.results.reduce((sum, t) => sum + (t.dc_negative_to_earth || 0), 0) / totalTests;

  return {
    total_tests: totalTests,
    conform_count: conformCount,
    non_conform_count: nonConformCount,
    conformity_rate: Math.round(conformityRate * 100) / 100,
    avg_dc_positive_to_earth: Math.round(avgDCPos * 100) / 100,
    avg_dc_negative_to_earth: Math.round(avgDCNeg * 100) / 100,
    latest_test_date: tests.results[0].test_date
  };
}

// Fetch Thermal data
export async function fetchThermalData(DB: D1Database, plantId: number): Promise<ThermalModuleData | null> {
  // Trouver le dernier audit thermique
  const audit = await DB.prepare(`
    SELECT 
      ta.audit_token,
      ta.total_modules_analyzed,
      ta.hotspot_modules_count,
      ta.bypass_diode_failures_count,
      ta.audit_date
    FROM thermal_audits ta
    WHERE ta.plant_id = ?
    ORDER BY ta.audit_date DESC
    LIMIT 1
  `).bind(plantId).first<any>();

  if (!audit) return null;

  // Statistiques thermiques
  const thermalStats = await DB.prepare(`
    SELECT 
      AVG(max_temperature) as avg_temp,
      MAX(max_temperature) as max_temp,
      MAX(delta_t) as delta_temp
    FROM thermal_module_measurements
    WHERE audit_token = ?
  `).bind(audit.audit_token).first<any>();

  const totalModules = audit.total_modules_analyzed || 0;
  const issuesCount = (audit.hotspot_modules_count || 0) + (audit.bypass_diode_failures_count || 0);
  const conformityRate = totalModules > 0 
    ? ((totalModules - issuesCount) / totalModules) * 100 
    : 0;

  return {
    audit_token: audit.audit_token,
    total_modules: totalModules,
    hotspot_count: audit.hotspot_modules_count || 0,
    bypass_diode_count: audit.bypass_diode_failures_count || 0,
    conformity_rate: Math.round(conformityRate * 100) / 100,
    thermal_stats: {
      avg_temp: Math.round((thermalStats?.avg_temp || 0) * 10) / 10,
      max_temp: Math.round((thermalStats?.max_temp || 0) * 10) / 10,
      delta_temp: Math.round((thermalStats?.delta_temp || 0) * 10) / 10
    }
  };
}

// Check data availability for all modules
export async function checkModuleAvailability(
  DB: D1Database, 
  plantId: number, 
  modules: ModuleCode[]
): Promise<ModuleAvailability[]> {
  const availability: ModuleAvailability[] = [];

  for (const moduleCode of modules) {
    let data = null;
    
    try {
      switch (moduleCode) {
        case 'el':
          data = await fetchELData(DB, plantId);
          availability.push({
            module_code: moduleCode,
            available: data !== null,
            count: data?.total_modules || 0,
            message: data ? `${data.total_modules} modules analysés` : 'Aucun audit EL trouvé'
          });
          break;

        case 'visual':
          data = await fetchVisualData(DB, plantId);
          availability.push({
            module_code: moduleCode,
            available: data !== null,
            count: data?.total_items || 0,
            message: data ? `${data.total_items} points de contrôle` : 'Aucune inspection visuelle trouvée'
          });
          break;

        case 'iv_curves':
          data = await fetchIVData(DB, plantId);
          availability.push({
            module_code: moduleCode,
            available: data !== null,
            count: data?.total_curves || 0,
            message: data ? `${data.total_curves} courbes I-V` : 'Aucune courbe I-V trouvée'
          });
          break;

        case 'isolation':
          data = await fetchIsolationData(DB, plantId);
          availability.push({
            module_code: moduleCode,
            available: data !== null,
            count: data?.total_tests || 0,
            latest_date: data?.latest_test_date,
            message: data ? `${data.total_tests} tests d'isolement` : `Aucun test d'isolement trouvé`
          });
          break;

        case 'thermal':
          data = await fetchThermalData(DB, plantId);
          availability.push({
            module_code: moduleCode,
            available: data !== null,
            count: data?.total_modules || 0,
            message: data ? `${data.total_modules} modules thermographiés` : 'Aucun audit thermique trouvé'
          });
          break;

        default:
          availability.push({
            module_code: moduleCode,
            available: false,
            count: 0,
            message: `Module ${moduleCode} non reconnu`
          });
      }
    } catch (error) {
      availability.push({
        module_code: moduleCode,
        available: false,
        count: 0,
        message: `Erreur lors de la vérification: ${error}`
      });
    }
  }

  return availability;
}
