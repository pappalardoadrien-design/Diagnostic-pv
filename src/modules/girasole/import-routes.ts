// ============================================================================
// GIRASOLE - API IMPORT CSV
// Création automatique : Client + 52 Sites + 52 Interventions + 52 Audits
// ============================================================================

import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
};

const girasoleImportRoutes = new Hono<{ Bindings: Bindings }>();

// ============================================================================
// POST /api/girasole/import-csv
// Import CSV pour créer automatiquement toute la mission GIRASOLE
// ============================================================================
girasoleImportRoutes.post('/import-csv', async (c) => {
  try {
    const { DB } = c.env;
    const body = await c.req.json();
    const { csv_content, client_name = 'GIRASOLE Energies' } = body;

    if (!csv_content) {
      return c.json({ error: 'csv_content required' }, 400);
    }

    // Parse CSV
    const lines = csv_content.trim().split('\n');
    const headers = lines[0].split(',').map((h: string) => h.trim());
    
    if (lines.length < 2) {
      return c.json({ error: 'CSV must have at least 1 data row' }, 400);
    }

    // Validate headers
    const requiredHeaders = ['nom_centrale', 'type', 'ville', 'puissance_kwc'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      return c.json({ 
        error: `Missing required headers: ${missingHeaders.join(', ')}`,
        required: requiredHeaders,
        found: headers
      }, 400);
    }

    // ========================================================================
    // STEP 1: Create or get GIRASOLE client
    // ========================================================================
    let client = await DB.prepare(`
      SELECT * FROM crm_clients 
      WHERE LOWER(company_name) LIKE ?
    `).bind(`%${client_name.toLowerCase()}%`).first();

    if (!client) {
      const clientResult = await DB.prepare(`
        INSERT INTO crm_clients (
          company_name, client_type, siret, email, phone,
          address, city, postal_code, country, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        client_name,
        'client',
        'SIRET_GIRASOLE', // À compléter
        'contact@girasole-energies.fr',
        '0000000000',
        'Adresse GIRASOLE',
        'Paris',
        '75000',
        'France'
      ).run();

      client = { id: clientResult.meta.last_row_id };
    }

    const clientId = client.id;

    // ========================================================================
    // STEP 2: Parse CSV and create projects + interventions + audits
    // ========================================================================
    const results = {
      client_id: clientId,
      client_name,
      projects_created: 0,
      interventions_created: 0,
      audits_created: 0,
      errors: [],
      details: []
    };

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const values = line.split(',').map((v: string) => v.trim());
        const row: any = {};
        headers.forEach((header: string, idx: number) => {
          row[header] = values[idx] || null;
        });

        // Create project (site PV)
        const projectResult = await DB.prepare(`
          INSERT INTO projects (
            client_id, project_name, site_type, installed_power, total_modules,
            city, postal_code, gps_latitude, gps_longitude,
            project_status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `).bind(
          clientId,
          row.nom_centrale,
          row.type || 'SOL',
          parseFloat(row.puissance_kwc) || 0,
          parseInt(row.nombre_modules) || 0,
          row.ville,
          row.code_postal,
          parseFloat(row.latitude) || null,
          parseFloat(row.longitude) || null,
          'active'
        ).run();

        const projectId = projectResult.meta.last_row_id;
        results.projects_created++;

        // Create intervention
        const interventionResult = await DB.prepare(`
          INSERT INTO interventions (
            client_id, project_id, intervention_type,
            scheduled_date, duration_hours, status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
        `).bind(
          clientId,
          projectId,
          'audit_qualite',
          row.date_intervention || '2025-01-15',
          4, // 4 heures par défaut
          'scheduled'
        ).run();

        const interventionId = interventionResult.meta.last_row_id;
        results.interventions_created++;

        // Create audit with token
        const auditToken = `GIRASOLE-${row.type}-${projectId}-${Date.now()}`;
        
        await DB.prepare(`
          INSERT INTO audits (
            audit_token, client_id, project_id, intervention_id,
            audit_type, audit_status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
        `).bind(
          auditToken,
          clientId,
          projectId,
          interventionId,
          row.type === 'TOITURE' ? 'visual_toiture' : 'visual_conformite',
          'pending'
        ).run();

        results.audits_created++;

        results.details.push({
          project_id: projectId,
          intervention_id: interventionId,
          audit_token: auditToken,
          centrale: row.nom_centrale,
          type: row.type
        });

      } catch (error: any) {
        results.errors.push({
          line: i + 1,
          error: error.message,
          data: line
        });
      }
    }

    return c.json({
      success: true,
      message: `Import completed: ${results.projects_created} sites, ${results.interventions_created} interventions, ${results.audits_created} audits`,
      ...results
    });

  } catch (error: any) {
    console.error('Import CSV error:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// ============================================================================
// GET /api/girasole/template
// Download CSV template
// ============================================================================
girasoleImportRoutes.get('/template', async (c) => {
  const template = `nom_centrale,type,ville,code_postal,puissance_kwc,nombre_modules,latitude,longitude,date_intervention
Centrale Solaire Narbonne 1,SOL,Narbonne,11100,250,680,43.1839,3.0033,2025-01-15
Centrale Solaire Narbonne 2,SOL,Narbonne,11100,300,820,43.1850,3.0050,2025-01-16
Centrale Toiture Montpellier 1,TOITURE,Montpellier,34000,150,420,43.6108,3.8767,2025-01-20`;

  return new Response(template, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="girasole_import_template.csv"'
    }
  });
});

// ============================================================================
// POST /api/girasole/batch-create-audits
// Créer audits manquants pour sites existants
// ============================================================================
girasoleImportRoutes.post('/batch-create-audits', async (c) => {
  try {
    const { DB } = c.env;
    const { client_id } = await c.req.json();

    if (!client_id) {
      return c.json({ error: 'client_id required' }, 400);
    }

    // Get all projects without audits
    const projects = await DB.prepare(`
      SELECT p.* 
      FROM projects p
      LEFT JOIN audits a ON p.id = a.project_id
      WHERE p.client_id = ? AND a.audit_token IS NULL
    `).bind(client_id).all();

    let auditsCreated = 0;

    for (const project of projects.results || []) {
      // Check if intervention exists
      let intervention = await DB.prepare(`
        SELECT * FROM interventions WHERE project_id = ?
      `).bind(project.id).first();

      // Create intervention if not exists
      if (!intervention) {
        const interventionResult = await DB.prepare(`
          INSERT INTO interventions (
            client_id, project_id, intervention_type,
            scheduled_date, duration_hours, status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
        `).bind(
          client_id,
          project.id,
          'audit_qualite',
          '2025-01-15',
          4,
          'scheduled'
        ).run();

        intervention = { id: interventionResult.meta.last_row_id };
      }

      // Create audit
      const auditToken = `GIRASOLE-${project.site_type || 'SOL'}-${project.id}-${Date.now()}`;
      
      await DB.prepare(`
        INSERT INTO audits (
          audit_token, client_id, project_id, intervention_id,
          audit_type, audit_status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        auditToken,
        client_id,
        project.id,
        intervention.id,
        project.site_type === 'TOITURE' ? 'visual_toiture' : 'visual_conformite',
        'pending'
      ).run();

      auditsCreated++;
    }

    return c.json({
      success: true,
      audits_created: auditsCreated,
      message: `Created ${auditsCreated} audits for existing projects`
    });

  } catch (error: any) {
    console.error('Batch create audits error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default girasoleImportRoutes;
