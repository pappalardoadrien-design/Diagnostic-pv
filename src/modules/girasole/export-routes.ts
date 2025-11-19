// ============================================================================
// GIRASOLE - EXPORT EXCEL ANNEXE 2
// Format 47 colonnes selon cahier des charges GIRASOLE
// ============================================================================

import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
};

const girasoleExportRoutes = new Hono<{ Bindings: Bindings }>();

// ============================================================================
// GET /api/girasole/export-annexe2/:clientId
// Export Excel ANNEXE 2 pour toutes les centrales d'un client
// ============================================================================
girasoleExportRoutes.get('/export-annexe2/:clientId', async (c) => {
  try {
    const { DB } = c.env;
    const clientId = c.req.param('clientId');

    // Get client
    const client = await DB.prepare(`
      SELECT * FROM crm_clients WHERE id = ?
    `).bind(clientId).first();

    if (!client) {
      return c.json({ error: 'Client not found' }, 404);
    }

    // Get all projects for this client
    const { results: projects } = await DB.prepare(`
      SELECT * FROM projects WHERE client_id = ?
    `).bind(clientId).all();

    if (!projects || projects.length === 0) {
      return c.json({ error: 'No projects found for this client' }, 404);
    }

    // Build CSV with 47 columns
    const headers = [
      'ID_Centrale',
      'Nom_Centrale',
      'Type_Installation', // SOL / TOITURE
      'Adresse',
      'Code_Postal',
      'Ville',
      'Latitude',
      'Longitude',
      'Puissance_kWc',
      'Nombre_Modules',
      'Date_Intervention',
      'Statut_Audit', // pending / completed
      'Progression_Pct',
      
      // Conformité globale
      'Conformite_Globale', // CONFORME / NON_CONFORME / PARTIELLE
      'Nb_Total_Points_Controle',
      'Nb_Points_Conformes',
      'Nb_Points_Non_Conformes',
      'Nb_Points_SO',
      'Taux_Conformite_Pct',
      
      // Sections principales
      'Conformite_Identification',
      'Conformite_Autocontrole',
      'Conformite_Protection_AC',
      'Conformite_Cablage_DC',
      'Conformite_Equipements',
      'Conformite_Mise_Terre',
      'Conformite_Parafoudre',
      'Conformite_Protection_Surtension',
      'Conformite_Etiquetage',
      'Conformite_Documentation',
      'Conformite_Securite_Incendie',
      'Conformite_Environnement',
      
      // Photos
      'Nb_Photos_Total',
      'Nb_Photos_NC', // Photos non-conformités
      
      // Non-conformités prioritaires
      'NC_Critiques',
      'NC_Majeures',
      'NC_Mineures',
      
      // Prescriptions
      'Prescriptions_Obligatoires',
      'Prescriptions_Recommandees',
      'Bonnes_Pratiques_Suggerees',
      
      // Technicien
      'Technicien_Nom',
      'Date_Realisation',
      'Duree_Intervention_H',
      
      // Rapport
      'Rapport_PDF_URL',
      'Rapport_PDF_Genere', // OUI / NON
      'Date_Generation_Rapport',
      
      // Facturation
      'Prix_Unitaire_HT',
      'Statut_Facturation' // A_FACTURER / FACTURE / PAYE
    ];

    const rows = [];

    // Process each project
    for (const project of projects) {
      // Get audit
      const audit = await DB.prepare(`
        SELECT * FROM audits WHERE project_id = ?
      `).bind(project.id).first();

      if (!audit) {
        // Project without audit yet
        rows.push([
          project.id,
          project.name,
          project.notes?.includes('Type: TOITURE') ? 'TOITURE' : 'SOL',
          project.site_address || '',
          '',
          project.site_address?.split(' ')[0] || '',
          project.latitude || '',
          project.longitude || '',
          project.installation_power || 0,
          project.total_modules || 0,
          '',
          'NON_DEMARRE',
          0,
          'N/A',
          0, 0, 0, 0, 0,
          '', '', '', '', '', '', '', '', '', '', '', '',
          0, 0,
          '', '', '',
          '', '', '',
          '', '', 0,
          '', 'NON', '',
          0, 'A_FACTURER'
        ]);
        continue;
      }

      // Get inspections for this audit
      const { results: inspections } = await DB.prepare(`
        SELECT * FROM visual_inspections WHERE audit_token = ?
      `).bind(audit.audit_token).all();

      // Calculate stats
      const totalPoints = inspections?.length || 0;
      const conformes = inspections?.filter((i: any) => i.conformite === 'conforme').length || 0;
      const nonConformes = inspections?.filter((i: any) => i.conformite === 'non_conforme').length || 0;
      const so = inspections?.filter((i: any) => i.conformite === 'so').length || 0;
      const tauxConformite = totalPoints > 0 ? Math.round((conformes / totalPoints) * 100) : 0;
      const progression = totalPoints > 0 ? Math.round(((conformes + nonConformes + so) / totalPoints) * 100) : 0;

      // Determine global conformity
      let conformiteGlobale = 'N/A';
      if (totalPoints > 0) {
        if (nonConformes === 0) conformiteGlobale = 'CONFORME';
        else if (nonConformes > totalPoints * 0.2) conformiteGlobale = 'NON_CONFORME';
        else conformiteGlobale = 'PARTIELLE';
      }

      // Get photos count
      const { results: photos } = await DB.prepare(`
        SELECT COUNT(*) as count FROM photos WHERE audit_token = ?
      `).bind(audit.audit_token).all();
      const nbPhotos = photos?.[0]?.count || 0;

      // Categorize NC by severity (based on section)
      const ncCritiques = inspections?.filter((i: any) => 
        i.conformite === 'non_conforme' && 
        (i.checklist_section?.includes('Protection') || i.checklist_section?.includes('Sécurité'))
      ).length || 0;
      
      const ncMajeures = inspections?.filter((i: any) => 
        i.conformite === 'non_conforme' && 
        (i.checklist_section?.includes('Câblage') || i.checklist_section?.includes('Equipements'))
      ).length || 0;
      
      const ncMineures = nonConformes - ncCritiques - ncMajeures;

      // Get intervention
      const intervention = await DB.prepare(`
        SELECT * FROM interventions WHERE project_id = ?
      `).bind(project.id).first();

      // Build row
      rows.push([
        project.id,
        project.name,
        project.notes?.includes('Type: TOITURE') ? 'TOITURE' : 'SOL',
        project.site_address || '',
        '',
        project.site_address?.split(' ')[0] || '',
        project.latitude || '',
        project.longitude || '',
        project.installation_power || 0,
        project.total_modules || 0,
        intervention?.intervention_date || '',
        audit.status === 'completed' ? 'COMPLETE' : totalPoints > 0 ? 'EN_COURS' : 'NON_DEMARRE',
        progression,
        conformiteGlobale,
        totalPoints,
        conformes,
        nonConformes,
        so,
        tauxConformite,
        // Sections (à calculer par section si besoin)
        '', '', '', '', '', '', '', '', '', '', '', '',
        nbPhotos,
        inspections?.filter((i: any) => i.conformite === 'non_conforme' && i.photo_url).length || 0,
        ncCritiques,
        ncMajeures,
        ncMineures,
        inspections?.filter((i: any) => i.prescriptions_girasole).length || 0,
        '', '',
        intervention?.technician_id || '',
        intervention?.intervention_date || '',
        intervention?.duration_hours || 4,
        `/api/visual/report/${audit.audit_token}`,
        totalPoints > 0 ? 'OUI' : 'NON',
        '',
        0, // Prix à définir
        'A_FACTURER'
      ]);
    }

    // Build CSV
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        const str = String(cell || '');
        // Escape commas and quotes
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(','))
    ].join('\n');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="GIRASOLE_ANNEXE2_${client.company_name}_${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error: any) {
    console.error('Export ANNEXE 2 error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// GET /api/girasole/export-annexe2-single/:auditToken
// Export ANNEXE 2 pour une seule centrale
// ============================================================================
girasoleExportRoutes.get('/export-annexe2-single/:auditToken', async (c) => {
  try {
    const { DB } = c.env;
    const auditToken = c.req.param('auditToken');

    // Redirect to batch export with single audit
    // (reuse same logic but filter by audit_token)
    
    return c.json({ 
      message: 'Use /export-annexe2/:clientId for full export',
      alternative: `/api/visual/report/${auditToken}` 
    });

  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

export default girasoleExportRoutes;
