/**
 * Routes API pour génération de rapports flexibles
 */

import { Hono } from 'hono';
import { generateCustomReportHTML } from './template.js';
import { 
  fetchELData, 
  fetchVisualData, 
  fetchIVData, 
  fetchIsolationData, 
  fetchThermalData,
  checkModuleAvailability
} from './data-fetchers.js';
import type { 
  CustomReportRequest, 
  CustomReportResponse,
  ConformityWeights,
  ModuleCode,
  CustomReportData,
  ReportTemplate
} from './types.js';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

/**
 * GET /templates - Liste tous les templates disponibles
 */
app.get('/templates', async (c) => {
  const { DB } = c.env;
  
  try {
    const templates = await DB.prepare(`
      SELECT * FROM report_templates
      WHERE is_active = 1
      ORDER BY 
        CASE template_code
          WHEN 'commissioning' THEN 1
          WHEN 'diagnostic_complet' THEN 2
          WHEN 'post_sinistre' THEN 3
          WHEN 'performance' THEN 4
          WHEN 'audit_minimal' THEN 5
          WHEN 'custom' THEN 6
          ELSE 99
        END
    `).all<ReportTemplate>();

    return c.json({
      success: true,
      templates: templates.results || []
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur lors de la récupération des templates' 
    }, 500);
  }
});

/**
 * POST /check-availability - Vérifie disponibilité des données pour modules sélectionnés
 */
app.post('/check-availability', async (c) => {
  const { DB } = c.env;
  
  try {
    const { plant_id, modules_selected } = await c.req.json<{
      plant_id: number;
      modules_selected: ModuleCode[];
    }>();

    if (!plant_id || !modules_selected || modules_selected.length === 0) {
      return c.json({ 
        success: false, 
        error: 'plant_id et modules_selected sont requis' 
      }, 400);
    }

    // Récupérer infos centrale
    const plant = await DB.prepare(`
      SELECT name FROM pv_plants WHERE id = ?
    `).bind(plant_id).first<any>();

    if (!plant) {
      return c.json({ 
        success: false, 
        error: 'Centrale non trouvée' 
      }, 404);
    }

    // Vérifier disponibilité des données
    const availability = await checkModuleAvailability(DB, plant_id, modules_selected);
    
    // Déterminer si on peut générer le rapport
    const readyToGenerate = availability.every(m => m.available);

    return c.json({
      success: true,
      plant_id,
      plant_name: plant.name,
      modules: availability,
      ready_to_generate: readyToGenerate
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur lors de la vérification des données' 
    }, 500);
  }
});

/**
 * POST /generate - Génère un rapport flexible selon template sélectionné
 */
app.post('/generate', async (c) => {
  const { DB } = c.env;
  
  try {
    const request = await c.req.json<CustomReportRequest>();
    
    // Validation
    if (!request.template_code || !request.plant_id || !request.modules_selected || request.modules_selected.length === 0) {
      return c.json({ 
        success: false, 
        error: 'template_code, plant_id et modules_selected sont requis' 
      }, 400);
    }

    // Récupérer template
    const template = await DB.prepare(`
      SELECT * FROM report_templates WHERE template_code = ? AND is_active = 1
    `).bind(request.template_code).first<ReportTemplate>();

    if (!template) {
      return c.json({ 
        success: false, 
        error: 'Template non trouvé ou inactif' 
      }, 404);
    }

    // Parser les configurations du template
    const modulesRequired: string[] = JSON.parse(template.modules_required);
    const modulesOptional: string[] = JSON.parse(template.modules_optional || '[]');
    let conformityWeights: ConformityWeights = JSON.parse(template.conformity_weights || '{}');

    // Vérifier que les modules requis sont présents
    const missingModules = modulesRequired.filter(m => !request.modules_selected.includes(m as ModuleCode));
    if (missingModules.length > 0) {
      return c.json({ 
        success: false, 
        error: `Modules requis manquants pour ce template: ${missingModules.join(', ')}` 
      }, 400);
    }

    // Si template custom, utiliser les poids personnalisés
    if (request.template_code === 'custom' && request.custom_weights) {
      conformityWeights = request.custom_weights;
    }

    // Récupérer infos centrale
    const plant = await DB.prepare(`
      SELECT name FROM pv_plants WHERE id = ?
    `).bind(request.plant_id).first<any>();

    if (!plant) {
      return c.json({ 
        success: false, 
        error: 'Centrale non trouvée' 
      }, 404);
    }

    // Récupérer données pour chaque module sélectionné
    const modulesData: CustomReportData['modules_data'] = {};
    const moduleConformities: { [key: string]: number } = {};

    for (const moduleName of request.modules_selected) {
      try {
        switch (moduleName) {
          case 'el':
            const elData = await fetchELData(DB, request.plant_id);
            if (elData) {
              modulesData.el = elData;
              moduleConformities.el = elData.conformity_rate;
            }
            break;

          case 'visual':
            const visualData = await fetchVisualData(DB, request.plant_id);
            if (visualData) {
              modulesData.visual = visualData;
              moduleConformities.visual = visualData.conformity_rate;
            }
            break;

          case 'iv_curves':
            const ivData = await fetchIVData(DB, request.plant_id);
            if (ivData) {
              modulesData.iv_curves = ivData;
              moduleConformities.iv_curves = ivData.conformity_rate;
            }
            break;

          case 'isolation':
            const isolationData = await fetchIsolationData(DB, request.plant_id);
            if (isolationData) {
              modulesData.isolation = isolationData;
              moduleConformities.isolation = isolationData.conformity_rate;
            }
            break;

          case 'thermal':
            const thermalData = await fetchThermalData(DB, request.plant_id);
            if (thermalData) {
              modulesData.thermal = thermalData;
              moduleConformities.thermal = thermalData.conformity_rate;
            }
            break;
        }
      } catch (error) {
        console.error(`Error fetching ${moduleName} data:`, error);
      }
    }

    // Vérifier que nous avons au moins un module avec des données
    if (Object.keys(modulesData).length === 0) {
      return c.json({ 
        success: false, 
        error: 'Aucune donnée trouvée pour les modules sélectionnés' 
      }, 404);
    }

    // Calculer conformité globale pondérée
    let totalConformity = 0;
    let totalWeight = 0;
    
    for (const [moduleCode, conformity] of Object.entries(moduleConformities)) {
      const weight = conformityWeights[moduleCode] || 0;
      totalConformity += conformity * weight;
      totalWeight += weight;
    }

    const overallConformity = totalWeight > 0 ? totalConformity / totalWeight : 0;

    // Calculer statistiques des problèmes
    let criticalCount = 0;
    let majorCount = 0;
    let minorCount = 0;

    // EL
    if (modulesData.el) {
      criticalCount += modulesData.el.defect_stats.hs;
      majorCount += modulesData.el.defect_stats.microcracks;
      minorCount += modulesData.el.defect_stats.inequalities;
    }

    // Visual
    if (modulesData.visual) {
      criticalCount += modulesData.visual.critical_issues.length;
    }

    // IV
    if (modulesData.iv_curves) {
      majorCount += modulesData.iv_curves.out_of_tolerance_count;
    }

    // Isolation
    if (modulesData.isolation) {
      criticalCount += modulesData.isolation.non_conform_count;
    }

    // Thermal
    if (modulesData.thermal) {
      criticalCount += modulesData.thermal.hotspot_count;
      majorCount += modulesData.thermal.bypass_diode_count;
    }

    // Construire objet données complètes
    const reportData: CustomReportData = {
      template,
      plant_name: plant.name,
      report_title: request.report_title,
      client_name: request.client_name,
      audit_date: request.audit_date,
      auditor_name: request.auditor_name || 'Non spécifié',
      overall_conformity_rate: Math.round(overallConformity * 100) / 100,
      critical_issues_count: criticalCount,
      major_issues_count: majorCount,
      minor_issues_count: minorCount,
      modules_data: modulesData,
      conformity_weights: conformityWeights,
      generated_at: new Date().toISOString(),
      generated_by: request.auditor_name || 'Système'
    };

    // Générer HTML
    const html = generateCustomReportHTML(reportData);

    // Sauvegarder en DB
    const reportToken = `CUSTOM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    await DB.prepare(`
      INSERT INTO unified_reports (
        report_token,
        plant_id,
        report_title,
        client_name,
        audit_date,
        auditor_name,
        overall_conformity_rate,
        critical_issues_count,
        major_issues_count,
        minor_issues_count,
        modules_included,
        html_content,
        generated_by,
        template_used,
        custom_weights
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      reportToken,
      request.plant_id,
      request.report_title,
      request.client_name,
      request.audit_date,
      request.auditor_name || null,
      reportData.overall_conformity_rate,
      criticalCount,
      majorCount,
      minorCount,
      JSON.stringify(request.modules_selected),
      html,
      request.auditor_name || 'Système',
      request.template_code,
      request.custom_weights ? JSON.stringify(request.custom_weights) : null
    ).run();

    const response: CustomReportResponse = {
      success: true,
      report_token: reportToken,
      overall_conformity_rate: reportData.overall_conformity_rate,
      modules_included: request.modules_selected
    };

    return c.json(response, 201);

  } catch (error) {
    console.error('Error generating custom report:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur lors de la génération du rapport' 
    }, 500);
  }
});

export default app;
