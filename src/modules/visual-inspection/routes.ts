// Routes API Module Visual Inspection - Controles Visuels IEC 62446-1

import { Hono } from 'hono';
import type { Bindings } from '../../types';
import { IEC_62446_CHECKLIST } from './checklist-iec';
import type {
  VisualInspectionDBRecord,
  VisualInspectionItemDBRecord,
  CreateInspectionRequest,
  UpdateItemRequest,
  CreateDefectRequest
} from './types';

const visualRoutes = new Hono<{ Bindings: Bindings }>();

/**
 * POST /api/visual/inspection/create
 * Créer nouvelle inspection visuelle avec checklist IEC complète
 */
visualRoutes.post('/inspection/create', async (c) => {
  try {
    const body: CreateInspectionRequest = await c.req.json();
    const { DB } = c.env;
    
    // Génération token unique
    const token = `VIS-${Date.now()}-${Math.random().toString(36).substring(7)}`.toUpperCase();
    
    // Créer inspection principale
    const inspectionResult = await DB.prepare(`
      INSERT INTO visual_inspections (
        inspection_token, project_name, client_name, location, inspection_date,
        inspector_name, system_power_kwp, module_count, inverter_count, installation_year
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      token,
      body.projectName,
      body.clientName,
      body.location,
      body.inspectionDate,
      body.inspectorName || null,
      body.systemPowerKwp || null,
      body.moduleCount || null,
      body.inverterCount || null,
      body.installationYear || null
    ).run();
    
    const inspectionId = inspectionResult.meta.last_row_id as number;
    
    // Générer tous les items de checklist IEC
    const items = IEC_62446_CHECKLIST.map(item => 
      DB.prepare(`
        INSERT INTO visual_inspection_items (
          inspection_id, inspection_token, category, subcategory,
          item_code, item_description, severity
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        inspectionId,
        token,
        item.category,
        item.subcategory,
        item.code,
        item.description,
        item.criticalityLevel
      )
    );
    
    await DB.batch(items);
    
    return c.json({
      success: true,
      inspection: {
        id: inspectionId,
        inspectionToken: token,
        ...body
      },
      itemsGenerated: IEC_62446_CHECKLIST.length
    });
    
  } catch (error) {
    console.error('Error creating visual inspection:', error);
    return c.json({ error: 'Erreur création inspection' }, 500);
  }
});

/**
 * GET /api/visual/inspection/:token
 * Récupérer inspection complète avec items et défauts
 */
visualRoutes.get('/inspection/:token', async (c) => {
  try {
    const token = c.req.param('token');
    const { DB } = c.env;
    
    // Récupérer inspection
    const inspection = await DB.prepare(`
      SELECT * FROM visual_inspections WHERE inspection_token = ?
    `).bind(token).first<VisualInspectionDBRecord>();
    
    if (!inspection) {
      return c.json({ error: 'Inspection non trouvée' }, 404);
    }
    
    // Récupérer items checklist
    const items = await DB.prepare(`
      SELECT * FROM visual_inspection_items 
      WHERE inspection_token = ? 
      ORDER BY category, item_code ASC
    `).bind(token).all<VisualInspectionItemDBRecord>();
    
    // Récupérer défauts identifiés
    const defects = await DB.prepare(`
      SELECT * FROM visual_defects 
      WHERE inspection_token = ? 
      ORDER BY severity DESC, detected_at DESC
    `).bind(token).all();
    
    // Statistiques
    const stats = {
      totalItems: items.results?.length || 0,
      checkedItems: items.results?.filter(i => i.status === 'checked').length || 0,
      nonConformItems: items.results?.filter(i => i.conformity === 'non_conform').length || 0,
      criticalDefects: defects.results?.filter(d => d.severity === 'critical').length || 0
    };
    
    return c.json({
      inspection,
      items: items.results || [],
      defects: defects.results || [],
      stats
    });
    
  } catch (error) {
    console.error('Error getting visual inspection:', error);
    return c.json({ error: 'Erreur récupération inspection' }, 500);
  }
});

/**
 * PUT /api/visual/inspection/:token/item/:itemId
 * Mettre à jour un item de checklist
 */
visualRoutes.put('/inspection/:token/item/:itemId', async (c) => {
  try {
    const { token, itemId } = c.req.params;
    const body: UpdateItemRequest = await c.req.json();
    const { DB } = c.env;
    
    const updates: string[] = [];
    const params: any[] = [];
    
    if (body.status) {
      updates.push('status = ?');
      params.push(body.status);
    }
    if (body.conformity) {
      updates.push('conformity = ?');
      params.push(body.conformity);
    }
    if (body.observation !== undefined) {
      updates.push('observation = ?');
      params.push(body.observation || null);
    }
    if (body.recommendation !== undefined) {
      updates.push('recommendation = ?');
      params.push(body.recommendation || null);
    }
    if (body.checkedBy) {
      updates.push('checked_by = ?, checked_at = CURRENT_TIMESTAMP');
      params.push(body.checkedBy);
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(itemId, token);
    
    await DB.prepare(`
      UPDATE visual_inspection_items 
      SET ${updates.join(', ')} 
      WHERE id = ? AND inspection_token = ?
    `).bind(...params).run();
    
    const updated = await DB.prepare(`
      SELECT * FROM visual_inspection_items WHERE id = ? AND inspection_token = ?
    `).bind(itemId, token).first<VisualInspectionItemDBRecord>();
    
    return c.json({ success: true, item: updated });
    
  } catch (error) {
    console.error('Error updating item:', error);
    return c.json({ error: 'Erreur mise à jour item' }, 500);
  }
});

/**
 * POST /api/visual/inspection/:token/defect
 * Créer un nouveau défaut
 */
visualRoutes.post('/inspection/:token/defect', async (c) => {
  try {
    const token = c.req.param('token');
    const body: CreateDefectRequest = await c.req.json();
    const { DB } = c.env;
    
    // Récupérer inspection_id
    const inspection = await DB.prepare(`
      SELECT id FROM visual_inspections WHERE inspection_token = ?
    `).bind(token).first<{ id: number }>();
    
    if (!inspection) {
      return c.json({ error: 'Inspection non trouvée' }, 404);
    }
    
    const result = await DB.prepare(`
      INSERT INTO visual_defects (
        inspection_id, inspection_token, item_id, defect_location,
        module_identifier, string_number, equipment_type, defect_type,
        defect_category, severity, urgency, description, potential_impact,
        recommended_action, norm_reference, norm_violation, detected_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      inspection.id,
      token,
      body.itemId || null,
      body.defectLocation,
      body.moduleIdentifier || null,
      body.stringNumber || null,
      body.equipmentType,
      body.defectType,
      body.defectCategory,
      body.severity,
      body.urgency,
      body.description,
      body.potentialImpact || null,
      body.recommendedAction || null,
      body.normReference || null,
      body.normViolation ? 1 : 0,
      body.detectedBy || null
    ).run();
    
    const defectId = result.meta.last_row_id as number;
    
    // Mettre à jour compteur défauts critiques
    if (body.severity === 'critical') {
      await DB.prepare(`
        UPDATE visual_inspections 
        SET critical_issues_count = critical_issues_count + 1 
        WHERE inspection_token = ?
      `).bind(token).run();
    }
    
    return c.json({
      success: true,
      defect: { id: defectId, ...body, inspectionToken: token }
    });
    
  } catch (error) {
    console.error('Error creating defect:', error);
    return c.json({ error: 'Erreur création défaut' }, 500);
  }
});

/**
 * GET /api/visual/checklist
 * Obtenir checklist IEC 62446-1 standardisée
 */
visualRoutes.get('/checklist', async (c) => {
  const category = c.req.query('category') as 'MECHANICAL' | 'ELECTRICAL' | 'DOCUMENTATION' | 'SAFETY' | undefined;
  
  const items = category 
    ? IEC_62446_CHECKLIST.filter(item => item.category === category)
    : IEC_62446_CHECKLIST;
  
  return c.json({
    items,
    stats: {
      total: items.length,
      byCategory: {
        MECHANICAL: IEC_62446_CHECKLIST.filter(i => i.category === 'MECHANICAL').length,
        ELECTRICAL: IEC_62446_CHECKLIST.filter(i => i.category === 'ELECTRICAL').length,
        DOCUMENTATION: IEC_62446_CHECKLIST.filter(i => i.category === 'DOCUMENTATION').length,
        SAFETY: IEC_62446_CHECKLIST.filter(i => i.category === 'SAFETY').length
      }
    }
  });
});

/**
 * GET /api/visual/inspections
 * Liste toutes les inspections
 */
visualRoutes.get('/inspections', async (c) => {
  try {
    const { DB } = c.env;
    
    const inspections = await DB.prepare(`
      SELECT * FROM visual_inspections 
      ORDER BY inspection_date DESC, created_at DESC 
      LIMIT 100
    `).all<VisualInspectionDBRecord>();
    
    return c.json({
      inspections: inspections.results || [],
      count: inspections.results?.length || 0
    });
    
  } catch (error) {
    console.error('Error listing inspections:', error);
    return c.json({ error: 'Erreur récupération liste' }, 500);
  }
});

export default visualRoutes;
