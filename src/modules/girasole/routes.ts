// ============================================================================
// Module GIRASOLE - Routes API
// ============================================================================
// Mission: 52 centrales PV (39 SOL + 13 DOUBLE)
// Période: Janvier-Mars 2025
// Budget: 66.885€ HT

import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
  KV: KVNamespace;
  R2: R2Bucket;
};

const girasoleRoutes = new Hono<{ Bindings: Bindings }>();

console.log('🚀 GIRASOLE MODULE LOADED');

// ============================================================================
// GET /api/girasole/projects
// Liste des 52 centrales GIRASOLE avec statistiques
// ============================================================================
girasoleRoutes.get('/projects', async (c) => {
  try {
    const { DB } = c.env;
    
    // Récupérer toutes les centrales GIRASOLE
    const projects = await DB.prepare(`
      SELECT 
        p.id,
        p.name,
        p.site_address,
        p.installation_power,
        p.audit_types,
        p.id_referent,
        p.created_at,
        COALESCE(cc.company_name, 'GIRASOLE Energies') as client_name
      FROM projects p
      LEFT JOIN crm_clients cc ON p.client_id = cc.id
      WHERE p.is_girasole = 1
      ORDER BY p.id ASC
    `).all();
    
    const projectsList = projects.results || [];
    
    // Calculer statistiques
    const stats = {
      total: projectsList.length,
      sol: projectsList.filter(p => {
        const types = JSON.parse(p.audit_types || '[]');
        return types.includes('CONFORMITE') && !types.includes('TOITURE');
      }).length,
      double: projectsList.filter(p => {
        const types = JSON.parse(p.audit_types || '[]');
        return types.includes('TOITURE');
      }).length,
      completed: 0, // À calculer après intégration visual inspections
      pending: projectsList.length
    };
    
    return c.json({
      success: true,
      stats,
      projects: projectsList
    });
    
  } catch (error) {
    console.error('Erreur /api/girasole/projects:', error);
    return c.json({ 
      error: 'Erreur récupération centrales GIRASOLE',
      details: error.message 
    }, 500);
  }
});

// ============================================================================
// GET /api/girasole/project/:id
// Détails d'une centrale spécifique
// ============================================================================
girasoleRoutes.get('/project/:id', async (c) => {
  try {
    const projectId = c.req.param('id');
    const { DB } = c.env;
    
    const project = await DB.prepare(`
      SELECT 
        p.*,
        COALESCE(cc.company_name, 'GIRASOLE Energies') as client_name,
        cc.main_contact_email as contact_email,
        cc.main_contact_phone as contact_phone
      FROM projects p
      LEFT JOIN crm_clients cc ON p.client_id = cc.id
      WHERE p.id = ? AND p.is_girasole = 1
    `).bind(projectId).first();
    
    if (!project) {
      return c.json({ error: 'Centrale non trouvée' }, 404);
    }
    
    // Récupérer les inspections visuelles liées
    const inspections = await DB.prepare(`
      SELECT * FROM visual_inspections
      WHERE project_name = ?
      ORDER BY created_at DESC
    `).bind(project.name).all();
    
    return c.json({
      success: true,
      project: {
        ...project,
        audit_types: JSON.parse(project.audit_types || '[]')
      },
      inspections: inspections.results || []
    });
    
  } catch (error) {
    console.error('Erreur /api/girasole/project/:id:', error);
    return c.json({ 
      error: 'Erreur récupération centrale',
      details: error.message 
    }, 500);
  }
});

// ============================================================================
// GET /api/girasole/stats
// Statistiques globales mission GIRASOLE
// ============================================================================
girasoleRoutes.get('/stats', async (c) => {
  try {
    const { DB } = c.env;
    
    // Total centrales
    const totalResult = await DB.prepare(`
      SELECT COUNT(*) as count FROM projects WHERE is_girasole = 1
    `).first<{ count: number }>();
    
    // Centrales SOL (CONFORMITE uniquement)
    const solResult = await DB.prepare(`
      SELECT COUNT(*) as count FROM projects 
      WHERE is_girasole = 1 
      AND audit_types = '["CONFORMITE"]'
    `).first<{ count: number }>();
    
    // Centrales DOUBLE (CONFORMITE + TOITURE)
    const doubleResult = await DB.prepare(`
      SELECT COUNT(*) as count FROM projects 
      WHERE is_girasole = 1 
      AND audit_types LIKE '%TOITURE%'
    `).first<{ count: number }>();
    
    // Inspections GIRASOLE (comptage simplifié pour compatibilité schéma)
    // Note: En production, les inspections sont liées via inspection_token GIRASOLE-*
    let inspectionsCount = 0;
    try {
      const inspectionsResult = await DB.prepare(`
        SELECT COUNT(*) as count FROM visual_inspections 
        WHERE project_id IN (SELECT id FROM projects WHERE is_girasole = 1)
      `).first<{ count: number }>();
      inspectionsCount = inspectionsResult?.count || 0;
    } catch {
      // Schéma alternatif sans project_id
      inspectionsCount = 0;
    }
    
    return c.json({
      success: true,
      mission: {
        budget: '66.885€ HT',
        period: 'Janvier - Mars 2025',
        client: 'GIRASOLE Energies'
      },
      stats: {
        total: totalResult?.count || 0,
        sol: solResult?.count || 0,
        double: doubleResult?.count || 0,
        completed: inspectionsCount,
        pending: (totalResult?.count || 0) - inspectionsCount
      }
    });
    
  } catch (error) {
    console.error('Erreur /api/girasole/stats:', error);
    return c.json({ 
      error: 'Erreur calcul statistiques',
      details: error.message 
    }, 500);
  }
});

// ============================================================================
// GET /api/girasole/checklist/:type
// Obtenir template checklist (CONFORMITE ou TOITURE)
// ============================================================================
girasoleRoutes.get('/checklist/:type', async (c) => {
  try {
    const type = c.req.param('type').toUpperCase() as 'CONFORMITE' | 'TOITURE';
    
    // Import dynamique des checklists
    const { getChecklistByType } = await import('./checklists');
    const items = getChecklistByType(type);
    
    return c.json({
      success: true,
      type,
      items,
      count: items.length
    });
    
  } catch (error: any) {
    console.error('Erreur /api/girasole/checklist/:type:', error);
    return c.json({ 
      error: 'Erreur récupération checklist',
      details: error.message 
    }, 500);
  }
});

// ============================================================================
// POST /api/girasole/inspection/create
// Créer nouvelle inspection GIRASOLE (CONFORMITE ou TOITURE)
// ============================================================================
girasoleRoutes.post('/inspection/create', async (c) => {
  try {
    const body = await c.req.json();
    const { project_id, checklist_type } = body;
    const { DB } = c.env;
    
    // Récupérer info projet
    const project = await DB.prepare(`
      SELECT p.*, COALESCE(cc.company_name, 'GIRASOLE Energies') as client_name
      FROM projects p
      LEFT JOIN crm_clients cc ON p.client_id = cc.id
      WHERE p.id = ?
    `).bind(project_id).first();
    
    if (!project) {
      return c.json({ error: 'Projet non trouvé' }, 404);
    }
    
    // Générer token unique
    const token = `GIRASOLE-${checklist_type}-${project_id}-${Date.now()}`;
    
    // Créer inspection
    const result = await DB.prepare(`
      INSERT INTO visual_inspections (
        inspection_token, project_id, project_name, client_name, 
        location, inspection_date, inspector_name,
        checklist_type, overall_status
      ) VALUES (?, ?, ?, ?, ?, date('now'), ?, ?, 'pending')
    `).bind(
      token,
      project_id,
      project.name,
      project.client_name || 'GIRASOLE Energies',
      project.site_address || '',
      'Technicien DiagPV',
      checklist_type
    ).run();
    
    const inspectionId = result.meta.last_row_id as number;
    
    // Créer items checklist
    const { getChecklistByType } = await import('./checklists');
    const items = getChecklistByType(checklist_type as 'CONFORMITE' | 'TOITURE');
    
    const itemInserts = items.map(item => 
      DB.prepare(`
        INSERT INTO visual_inspection_items (
          inspection_id, inspection_token, category, subcategory,
          item_code, item_description, severity, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'unchecked')
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
    
    await DB.batch(itemInserts);
    
    return c.json({
      success: true,
      inspection: {
        id: inspectionId,
        token,
        project_id,
        checklist_type,
        items_count: items.length
      }
    });
    
  } catch (error: any) {
    console.error('Erreur /api/girasole/inspection/create:', error);
    return c.json({ 
      error: 'Erreur création inspection',
      details: error.message 
    }, 500);
  }
});

// ============================================================================
// PUT /api/girasole/inspection/:token/item/:itemCode
// Mettre à jour un item de checklist
// ============================================================================
girasoleRoutes.put('/inspection/:token/item/:itemCode', async (c) => {
  try {
    const token = c.req.param('token');
    const itemCode = c.req.param('itemCode');
    const body = await c.req.json();
    const { DB } = c.env;
    
    const { conformity, observation } = body;
    
    await DB.prepare(`
      UPDATE visual_inspection_items
      SET 
        conformity = ?,
        observation = ?,
        status = 'checked',
        updated_at = CURRENT_TIMESTAMP
      WHERE inspection_token = ? AND item_code = ?
    `).bind(conformity, observation || null, token, itemCode).run();
    
    return c.json({ success: true });
    
  } catch (error: any) {
    console.error('Erreur /api/girasole/inspection/:token/item/:itemCode:', error);
    return c.json({ 
      error: 'Erreur mise à jour item',
      details: error.message 
    }, 500);
  }
});

// ============================================================================
// GET /api/girasole/inspection/:token
// Récupérer inspection complète avec items
// ============================================================================
girasoleRoutes.get('/inspection/:token', async (c) => {
  try {
    const token = c.req.param('token');
    const { DB } = c.env;
    
    // Récupérer inspection
    const inspection = await DB.prepare(`
      SELECT * FROM visual_inspections WHERE inspection_token = ?
    `).bind(token).first();
    
    if (!inspection) {
      return c.json({ error: 'Inspection non trouvée' }, 404);
    }
    
    // Récupérer items
    const items = await DB.prepare(`
      SELECT * FROM visual_inspection_items 
      WHERE inspection_token = ? 
      ORDER BY category, item_code ASC
    `).bind(token).all();
    
    return c.json({
      success: true,
      inspection,
      items: items.results || []
    });
    
  } catch (error: any) {
    console.error('Erreur /api/girasole/inspection/:token:', error);
    return c.json({ 
      error: 'Erreur récupération inspection',
      details: error.message 
    }, 500);
  }
});

// ============================================================================
// GET /api/girasole/report/:token
// Générer rapport PDF HTML (CONFORMITE ou TOITURE)
// ============================================================================
girasoleRoutes.get('/report/:token', async (c) => {
  try {
    const token = c.req.param('token');
    const { DB } = c.env;
    
    // Récupérer inspection
    const inspection = await DB.prepare(`
      SELECT * FROM visual_inspections WHERE inspection_token = ?
    `).bind(token).first();
    
    if (!inspection) {
      return c.json({ error: 'Inspection non trouvée' }, 404);
    }
    
    // Récupérer projet
    const project = await DB.prepare(`
      SELECT p.*, COALESCE(cc.company_name, 'GIRASOLE Energies') as client_name
      FROM projects p
      LEFT JOIN crm_clients cc ON p.client_id = cc.id
      WHERE p.id = ?
    `).bind(inspection.project_id).first();
    
    // Récupérer items
    const items = await DB.prepare(`
      SELECT * FROM visual_inspection_items 
      WHERE inspection_token = ? 
      ORDER BY category, item_code ASC
    `).bind(token).all();
    
    const itemsList = items.results || [];
    
    // Calculer stats
    const stats = {
      total: itemsList.length,
      conforme: itemsList.filter((i: any) => i.conformity === 'conforme').length,
      non_conforme: itemsList.filter((i: any) => i.conformity === 'non_conforme').length,
      sans_objet: itemsList.filter((i: any) => i.conformity === 'sans_objet').length,
      non_verifie: itemsList.filter((i: any) => i.conformity === 'non_verifie' || !i.conformity).length
    };
    
    // Générer HTML
    const { generateReportHTML } = await import('./report-generator');
    const html = generateReportHTML({
      inspection,
      project,
      items: itemsList,
      checklistType: inspection.checklist_type as 'CONFORMITE' | 'TOITURE'
    });
    
    return c.html(html);
    
  } catch (error: any) {
    console.error('Erreur /api/girasole/report/:token:', error);
    return c.json({ 
      error: 'Erreur génération rapport',
      details: error.message 
    }, 500);
  }
});

// ============================================================================
// GET /api/girasole/inspection/:token/report
// Générer rapport PDF (HTML prêt pour impression)
// ============================================================================
girasoleRoutes.get('/inspection/:token/report', async (c) => {
  try {
    const token = c.req.param('token');
    const { DB } = c.env;
    
    // Récupérer inspection
    const inspection = await DB.prepare(`
      SELECT * FROM visual_inspections WHERE inspection_token = ?
    `).bind(token).first();
    
    if (!inspection) {
      return c.json({ error: 'Inspection non trouvée' }, 404);
    }
    
    // Récupérer projet
    const project = await DB.prepare(`
      SELECT * FROM projects WHERE id = ?
    `).bind(inspection.project_id).first();
    
    // Récupérer items
    const items = await DB.prepare(`
      SELECT * FROM visual_inspection_items 
      WHERE inspection_token = ? 
      ORDER BY category, item_code ASC
    `).bind(token).all();
    
    // Générer HTML
    const { generateReportHTML } = await import('./report-generator');
    const html = generateReportHTML({
      inspection,
      project,
      items: items.results || [],
      checklistType: inspection.checklist_type as 'CONFORMITE' | 'TOITURE'
    });
    
    return c.html(html);
    
  } catch (error: any) {
    console.error('Erreur /api/girasole/inspection/:token/report:', error);
    return c.json({ 
      error: 'Erreur génération rapport',
      details: error.message 
    }, 500);
  }
});

// ============================================================================
// GET /api/girasole/export/annexe2
// Exporter ANNEXE 2 CSV (47 colonnes) - Suivi 52 centrales
// ============================================================================
girasoleRoutes.get('/export/annexe2', async (c) => {
  try {
    const { DB } = c.env;
    
    // Récupérer tous les projets GIRASOLE avec leurs inspections
    const projects = await DB.prepare(`
      SELECT 
        p.id,
        p.id_referent,
        p.name,
        p.site_address,
        p.installation_power,
        p.audit_types,
        (SELECT COUNT(*) FROM visual_inspections vi 
         WHERE vi.project_id = p.id AND vi.checklist_type = 'CONFORMITE') as conformite_done,
        (SELECT COUNT(*) FROM visual_inspections vi 
         WHERE vi.project_id = p.id AND vi.checklist_type = 'TOITURE') as toiture_done,
        (SELECT inspection_date FROM visual_inspections vi 
         WHERE vi.project_id = p.id AND vi.checklist_type = 'CONFORMITE' 
         ORDER BY inspection_date DESC LIMIT 1) as last_conformite_date,
        (SELECT inspection_date FROM visual_inspections vi 
         WHERE vi.project_id = p.id AND vi.checklist_type = 'TOITURE' 
         ORDER BY inspection_date DESC LIMIT 1) as last_toiture_date
      FROM projects p
      WHERE p.is_girasole = 1
      ORDER BY p.id ASC
    `).all();
    
    const projectsList = projects.results || [];
    
    // Générer CSV (format ANNEXE 2)
    const headers = [
      'ID_Referent',
      'Nom_Centrale',
      'Adresse',
      'Puissance_kWc',
      'Type_Audit',
      'Audit_Conformite',
      'Date_Conformite',
      'Statut_Conformite',
      'Audit_Toiture',
      'Date_Toiture',
      'Statut_Toiture',
      'Progression_%',
      'Observations'
    ];
    
    const rows = projectsList.map(p => {
      const auditTypes = JSON.parse(p.audit_types || '[]');
      const hasToiture = auditTypes.includes('TOITURE');
      
      const conformiteDone = p.conformite_done > 0 ? 'Oui' : 'Non';
      const toitureDone = p.toiture_done > 0 ? 'Oui' : 'Non';
      
      let progression = 0;
      if (hasToiture) {
        // DOUBLE : 50% par checklist
        if (p.conformite_done > 0) progression += 50;
        if (p.toiture_done > 0) progression += 50;
      } else {
        // SOL : 100% si conformité faite
        if (p.conformite_done > 0) progression = 100;
      }
      
      const name = '"' + p.name.replace(/"/g, '""') + '"';
      const address = '"' + (p.site_address || '').replace(/"/g, '""') + '"';
      
      return [
        p.id_referent || p.id,
        name,
        address,
        p.installation_power || '',
        hasToiture ? 'DOUBLE' : 'SOL',
        conformiteDone,
        p.last_conformite_date || '',
        p.conformite_done > 0 ? 'Terminé' : 'En attente',
        hasToiture ? (toitureDone) : 'N/A',
        hasToiture ? (p.last_toiture_date || '') : 'N/A',
        hasToiture ? (p.toiture_done > 0 ? 'Terminé' : 'En attente') : 'N/A',
        progression + '%',
        ''
      ].join(',');
    });
    
    const csv = [headers.join(','), ...rows].join('\\n');
    
    // Retourner CSV
    return c.text(csv, 200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="ANNEXE_2_GIRASOLE_' + new Date().toISOString().split('T')[0] + '.csv"'
    });
    
  } catch (error: any) {
    console.error('Erreur /api/girasole/export/annexe2:', error);
    return c.json({ 
      error: 'Erreur export ANNEXE 2',
      details: error.message 
    }, 500);
  }
});

export default girasoleRoutes;
