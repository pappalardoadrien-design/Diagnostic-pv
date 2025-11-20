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
        c.name as client_name
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
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
        c.name as client_name,
        c.contact_email,
        c.contact_phone
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
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
    
    // Inspections créées
    const inspectionsResult = await DB.prepare(`
      SELECT COUNT(DISTINCT vi.id) as count
      FROM visual_inspections vi
      JOIN projects p ON vi.project_name = p.name
      WHERE p.is_girasole = 1
    `).first<{ count: number }>();
    
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
        completed: inspectionsResult?.count || 0,
        pending: (totalResult?.count || 0) - (inspectionsResult?.count || 0)
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

export default girasoleRoutes;
