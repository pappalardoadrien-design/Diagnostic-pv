import { Hono } from 'hono';
import type { 
  Intervention, 
  InterventionWithDetails,
  CreateInterventionRequest,
  UpdateInterventionRequest,
  AssignTechnicianRequest,
  InterventionFilters,
  InterventionListResponse,
  InterventionDetailResponse,
  CreateInterventionResponse,
  AssignTechnicianResponse,
  DashboardResponse,
  CalendarResponse,
  ConflictsResponse,
  AvailableTechniciansResponse,
  PlanningDashboardStats,
  CalendarEvent,
  InterventionConflict,
  AvailableTechnician
} from './types';

type Bindings = {
  DB: D1Database;
};

const planningRoutes = new Hono<{ Bindings: Bindings }>();

// ============================================================================
// GET /api/planning/interventions - Liste interventions avec filtres
// ============================================================================
planningRoutes.get('/interventions', async (c) => {
  try {
    const { DB } = c.env;
    
    // Récupération filtres query params
    const project_id = c.req.query('project_id');
    const technician_id = c.req.query('technician_id');
    const intervention_type = c.req.query('intervention_type');
    const status = c.req.query('status');
    const date_from = c.req.query('date_from');
    const date_to = c.req.query('date_to');
    const unassigned_only = c.req.query('unassigned_only') === 'true';

    // Construction query avec filtres
    let query = `
      SELECT 
        i.*,
        p.name as project_name,
        p.site_address as project_location,
        cl.company_name as client_name,
        u.email as technician_email
      FROM interventions i
      LEFT JOIN projects p ON p.id = i.project_id
      LEFT JOIN crm_clients cl ON cl.id = p.client_id
      LEFT JOIN auth_users u ON u.id = i.technician_id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (project_id) {
      query += ` AND i.project_id = ?`;
      params.push(parseInt(project_id));
    }

    if (technician_id) {
      query += ` AND i.technician_id = ?`;
      params.push(parseInt(technician_id));
    }

    if (intervention_type) {
      query += ` AND i.intervention_type = ?`;
      params.push(intervention_type);
    }

    if (status) {
      query += ` AND i.status = ?`;
      params.push(status);
    }

    if (date_from) {
      query += ` AND i.intervention_date >= ?`;
      params.push(date_from);
    }

    if (date_to) {
      query += ` AND i.intervention_date <= ?`;
      params.push(date_to);
    }

    if (unassigned_only) {
      query += ` AND i.technician_id IS NULL`;
    }

    query += ` ORDER BY i.intervention_date ASC, i.created_at DESC`;

    const stmt = DB.prepare(query).bind(...params);
    const { results } = await stmt.all<InterventionWithDetails>();

    const filters_applied: InterventionFilters = {
      ...(project_id && { project_id: parseInt(project_id) }),
      ...(technician_id && { technician_id: parseInt(technician_id) }),
      ...(intervention_type && { intervention_type: intervention_type as any }),
      ...(status && { status: status as any }),
      ...(date_from && { date_from }),
      ...(date_to && { date_to }),
      ...(unassigned_only && { unassigned_only })
    };

    const response: InterventionListResponse = {
      success: true,
      interventions: results || [],
      total: results?.length || 0,
      filters_applied
    };

    return c.json(response);

  } catch (error) {
    console.error('Erreur GET /interventions:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur lors de la récupération des interventions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// ============================================================================
// GET /api/planning/interventions/:id - Détails intervention
// ============================================================================
planningRoutes.get('/interventions/:id', async (c) => {
  try {
    const { DB } = c.env;
    const id = parseInt(c.req.param('id'));

    const query = `
      SELECT 
        i.*,
        p.name as project_name,
        p.site_address as project_location,
        cl.company_name as client_name,
        u.email as technician_email
      FROM interventions i
      LEFT JOIN projects p ON p.id = i.project_id
      LEFT JOIN crm_clients cl ON cl.id = p.client_id
      LEFT JOIN auth_users u ON u.id = i.technician_id
      WHERE i.id = ?
    `;

    const { results } = await DB.prepare(query).bind(id).all<InterventionWithDetails>();

    if (!results || results.length === 0) {
      return c.json({ 
        success: false, 
        error: 'Intervention introuvable' 
      }, 404);
    }

    const response: InterventionDetailResponse = {
      success: true,
      intervention: results[0]
    };

    return c.json(response);

  } catch (error) {
    console.error('Erreur GET /interventions/:id:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur lors de la récupération de l\'intervention' 
    }, 500);
  }
});

// ============================================================================
// POST /api/planning/interventions - Créer intervention
// ============================================================================
planningRoutes.post('/interventions', async (c) => {
  try {
    const { DB } = c.env;
    const body = await c.req.json<CreateInterventionRequest>();

    // Validation
    if (!body.project_id || !body.intervention_type || !body.intervention_date) {
      return c.json({ 
        success: false, 
        error: 'Champs requis: project_id, intervention_type, intervention_date' 
      }, 400);
    }

    // Vérifier que le projet existe
    const projectCheck = await DB.prepare('SELECT id FROM projects WHERE id = ?')
      .bind(body.project_id)
      .first();

    if (!projectCheck) {
      return c.json({ 
        success: false, 
        error: 'Projet introuvable' 
      }, 404);
    }

    // Insertion
    const query = `
      INSERT INTO interventions (
        project_id,
        intervention_type,
        notes,
        intervention_date,
        duration_hours,
        status,
        notes
      ) VALUES (?, ?, ?, ?, ?, 'scheduled', ?)
    `;

    const result = await DB.prepare(query).bind(
      body.project_id,
      body.intervention_type,
      body.notes || null,
      body.intervention_date,
      body.duration_hours || null,
      body.notes || null
    ).run();

    if (!result.success) {
      throw new Error('Échec insertion intervention');
    }

    // Récupération intervention créée
    const { results } = await DB.prepare('SELECT * FROM interventions WHERE id = ?')
      .bind(result.meta.last_row_id)
      .all<Intervention>();

    const response: CreateInterventionResponse = {
      success: true,
      intervention: results![0],
      message: 'Intervention créée avec succès'
    };

    return c.json(response, 201);

  } catch (error) {
    console.error('Erreur POST /interventions:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur lors de la création de l\'intervention' 
    }, 500);
  }
});

// ============================================================================
// PUT /api/planning/interventions/:id - Modifier intervention
// ============================================================================
planningRoutes.put('/interventions/:id', async (c) => {
  try {
    const { DB } = c.env;
    const id = parseInt(c.req.param('id'));
    const body = await c.req.json<UpdateInterventionRequest>();

    // Vérifier existence
    const existing = await DB.prepare('SELECT id FROM interventions WHERE id = ?')
      .bind(id)
      .first();

    if (!existing) {
      return c.json({ 
        success: false, 
        error: 'Intervention introuvable' 
      }, 404);
    }

    // Construction update dynamique
    const updates: string[] = [];
    const params: any[] = [];

    if (body.intervention_type !== undefined) {
      updates.push('intervention_type = ?');
      params.push(body.intervention_type);
    }
    if (body.notes !== undefined) {
      updates.push('notes = ?');
      params.push(body.notes);
    }
    if (body.intervention_date !== undefined) {
      updates.push('intervention_date = ?');
      params.push(body.intervention_date);
    }
    if (body.duration_hours !== undefined) {
      updates.push('duration_hours = ?');
      params.push(body.duration_hours);
    }
    if (body.status !== undefined) {
      updates.push('status = ?');
      params.push(body.status);
    }
    if (body.notes !== undefined) {
      updates.push('notes = ?');
      params.push(body.notes);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');

    if (updates.length === 1) { // Seulement updated_at
      return c.json({ 
        success: false, 
        error: 'Aucune modification fournie' 
      }, 400);
    }

    params.push(id); // WHERE id = ?

    const query = `UPDATE interventions SET ${updates.join(', ')} WHERE id = ?`;
    await DB.prepare(query).bind(...params).run();

    // Récupération intervention modifiée avec détails
    const queryDetail = `
      SELECT 
        i.*,
        p.name as project_name,
        p.site_address as project_location,
        cl.company_name as client_name,
        u.email as technician_email
      FROM interventions i
      LEFT JOIN projects p ON p.id = i.project_id
      LEFT JOIN crm_clients cl ON cl.id = p.client_id
      LEFT JOIN auth_users u ON u.id = i.technician_id
      WHERE i.id = ?
    `;

    const { results } = await DB.prepare(queryDetail).bind(id).all<InterventionWithDetails>();

    const response: InterventionDetailResponse = {
      success: true,
      intervention: results![0]
    };

    return c.json(response);

  } catch (error) {
    console.error('Erreur PUT /interventions/:id:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur lors de la modification de l\'intervention' 
    }, 500);
  }
});

// ============================================================================
// DELETE /api/planning/interventions/:id - Supprimer intervention
// ============================================================================
planningRoutes.delete('/interventions/:id', async (c) => {
  try {
    const { DB } = c.env;
    const id = parseInt(c.req.param('id'));

    // Vérifier existence
    const existing = await DB.prepare('SELECT id, status FROM interventions WHERE id = ?')
      .bind(id)
      .first<{ id: number; status: string }>();

    if (!existing) {
      return c.json({ 
        success: false, 
        error: 'Intervention introuvable' 
      }, 404);
    }

    // Empêcher suppression si intervention en cours ou terminée
    if (existing.status === 'in_progress' || existing.status === 'completed') {
      return c.json({ 
        success: false, 
        error: 'Impossible de supprimer une intervention en cours ou terminée. Utilisez le statut "cancelled".' 
      }, 400);
    }

    await DB.prepare('DELETE FROM interventions WHERE id = ?').bind(id).run();

    return c.json({ 
      success: true, 
      message: 'Intervention supprimée avec succès' 
    });

  } catch (error) {
    console.error('Erreur DELETE /interventions/:id:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur lors de la suppression de l\'intervention' 
    }, 500);
  }
});

// ============================================================================
// POST /api/planning/assign - Assigner technicien à intervention
// ============================================================================
planningRoutes.post('/assign', async (c) => {
  try {
    const { DB } = c.env;
    const body = await c.req.json<AssignTechnicianRequest>();

    if (!body.intervention_id || !body.technician_id) {
      return c.json({ 
        success: false, 
        error: 'Champs requis: intervention_id, technician_id' 
      }, 400);
    }

    // Vérifier intervention existe
    const intervention = await DB.prepare('SELECT * FROM interventions WHERE id = ?')
      .bind(body.intervention_id)
      .first<Intervention>();

    if (!intervention) {
      return c.json({ 
        success: false, 
        error: 'Intervention introuvable' 
      }, 404);
    }

    // Vérifier technicien existe et role = subcontractor
    const technician = await DB.prepare('SELECT id, email, role FROM auth_users WHERE id = ? AND role = ?')
      .bind(body.technician_id, 'subcontractor')
      .first();

    if (!technician) {
      return c.json({ 
        success: false, 
        error: 'Technicien introuvable ou rôle invalide (doit être subcontractor)' 
      }, 404);
    }

    // Détection conflits (même technicien, même date)
    const conflictQuery = `
      SELECT id, intervention_type, intervention_date, duration_hours
      FROM interventions
      WHERE technician_id = ?
        AND intervention_date = ?
        AND id != ?
        AND status IN ('scheduled', 'in_progress')
    `;

    const { results: conflicts } = await DB.prepare(conflictQuery)
      .bind(body.technician_id, intervention.intervention_date, body.intervention_id)
      .all();

    // Assignation (même s'il y a conflit, on affiche juste un warning)
    await DB.prepare('UPDATE interventions SET technician_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .bind(body.technician_id, body.intervention_id)
      .run();

    // Récupération intervention avec détails
    const queryDetail = `
      SELECT 
        i.*,
        p.name as project_name,
        p.site_address as project_location,
        cl.company_name as client_name,
        u.email as technician_email
      FROM interventions i
      LEFT JOIN projects p ON p.id = i.project_id
      LEFT JOIN crm_clients cl ON cl.id = p.client_id
      LEFT JOIN auth_users u ON u.id = i.technician_id
      WHERE i.id = ?
    `;

    const { results } = await DB.prepare(queryDetail)
      .bind(body.intervention_id)
      .all<InterventionWithDetails>();

    const response: AssignTechnicianResponse = {
      success: true,
      intervention: results![0],
      message: conflicts && conflicts.length > 0 
        ? `Technicien assigné avec ${conflicts.length} conflit(s) détecté(s)` 
        : 'Technicien assigné avec succès',
      ...(conflicts && conflicts.length > 0 && {
        conflicts: {
          intervention_id: body.intervention_id,
          technician_id: body.technician_id,
          intervention_date: intervention.intervention_date,
          conflict_type: 'same_date',
          conflicting_interventions: conflicts as any
        }
      })
    };

    return c.json(response);

  } catch (error) {
    console.error('Erreur POST /assign:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur lors de l\'assignation du technicien' 
    }, 500);
  }
});

// ============================================================================
// GET /api/planning/technicians/available - Techniciens disponibles
// ============================================================================
planningRoutes.get('/technicians/available', async (c) => {
  try {
    const { DB } = c.env;
    const date = c.req.query('date'); // YYYY-MM-DD

    if (!date) {
      return c.json({ 
        success: false, 
        error: 'Paramètre requis: date (format YYYY-MM-DD)' 
      }, 400);
    }

    // Tous les techniciens (role = subcontractor)
    const { results: allTechnicians } = await DB.prepare(`
      SELECT id, email, role, created_at
      FROM auth_users
      WHERE role = 'subcontractor'
      ORDER BY email ASC
    `).all();

    if (!allTechnicians || allTechnicians.length === 0) {
      const response: AvailableTechniciansResponse = {
        success: true,
        technicians: [],
        date
      };
      return c.json(response);
    }

    // Pour chaque technicien, compter conflits à cette date
    const techniciansWithAvailability: AvailableTechnician[] = await Promise.all(
      allTechnicians.map(async (tech: any) => {
        const { results: conflicts } = await DB.prepare(`
          SELECT COUNT(*) as count
          FROM interventions
          WHERE technician_id = ?
            AND intervention_date = ?
            AND status IN ('scheduled', 'in_progress')
        `).bind(tech.id, date).all();

        const conflictsCount = conflicts?.[0]?.count || 0;

        return {
          id: tech.id,
          email: tech.email,
          role: tech.role,
          created_at: tech.created_at,
          is_available: conflictsCount === 0,
          conflicts_count: conflictsCount
        };
      })
    );

    const response: AvailableTechniciansResponse = {
      success: true,
      technicians: techniciansWithAvailability,
      date
    };

    return c.json(response);

  } catch (error) {
    console.error('Erreur GET /technicians/available:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur lors de la récupération des techniciens disponibles' 
    }, 500);
  }
});

// ============================================================================
// GET /api/planning/dashboard - Stats dashboard
// ============================================================================
planningRoutes.get('/dashboard', async (c) => {
  try {
    const { DB } = c.env;

    // Stats globales
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
        SUM(CASE WHEN technician_id IS NULL THEN 1 ELSE 0 END) as unassigned
      FROM interventions
    `;

    const globalStats = await DB.prepare(statsQuery).first<any>();

    // Interventions 7 prochains jours
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const upcomingQuery = `
      SELECT COUNT(*) as count
      FROM interventions
      WHERE intervention_date >= ? AND intervention_date <= ?
        AND status IN ('scheduled', 'in_progress')
    `;

    const upcomingStats = await DB.prepare(upcomingQuery).bind(today, nextWeek).first<any>();

    // Stats par type
    const byTypeQuery = `
      SELECT intervention_type, COUNT(*) as count
      FROM interventions
      GROUP BY intervention_type
    `;

    const { results: byTypeResults } = await DB.prepare(byTypeQuery).all<any>();

    const by_type: any = {
      el_audit: 0,
      iv_test: 0,
      thermography: 0,
      visual_inspection: 0,
      isolation_test: 0,
      post_incident: 0,
      commissioning: 0,
      maintenance: 0
    };

    byTypeResults?.forEach((row: any) => {
      by_type[row.intervention_type] = row.count;
    });

    const stats: PlanningDashboardStats = {
      total_interventions: globalStats?.total || 0,
      scheduled: globalStats?.scheduled || 0,
      in_progress: globalStats?.in_progress || 0,
      completed: globalStats?.completed || 0,
      cancelled: globalStats?.cancelled || 0,
      unassigned: globalStats?.unassigned || 0,
      upcoming_7_days: upcomingStats?.count || 0,
      by_type
    };

    const response: DashboardResponse = {
      success: true,
      stats
    };

    return c.json(response);

  } catch (error) {
    console.error('Erreur GET /dashboard:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur lors de la récupération des statistiques' 
    }, 500);
  }
});

// ============================================================================
// GET /api/planning/calendar - Vue calendrier (mois)
// ============================================================================
planningRoutes.get('/calendar', async (c) => {
  try {
    const { DB } = c.env;
    const month = c.req.query('month'); // Format: YYYY-MM

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return c.json({ 
        success: false, 
        error: 'Paramètre requis: month (format YYYY-MM)' 
      }, 400);
    }

    const query = `
      SELECT 
        i.id,
        i.intervention_type,
        i.intervention_date,
        i.duration_hours,
        i.status,
        i.notes,
        p.name as project_name,
        u.email as technician_email
      FROM interventions i
      LEFT JOIN projects p ON p.id = i.project_id
      LEFT JOIN auth_users u ON u.id = i.technician_id
      WHERE strftime('%Y-%m', i.intervention_date) = ?
      ORDER BY i.intervention_date ASC
    `;

    const { results } = await DB.prepare(query).bind(month).all<any>();

    const events: CalendarEvent[] = (results || []).map((row: any) => {
      const start = `${row.intervention_date}T08:00:00`; // Défaut 8h
      const durationHours = row.duration_hours || 4; // Défaut 4h
      const endDate = new Date(start);
      endDate.setHours(endDate.getHours() + durationHours);
      const end = endDate.toISOString();

      return {
        id: row.id,
        title: `${row.project_name || 'Projet'} - ${row.intervention_type}`,
        start,
        end,
        type: row.intervention_type,
        status: row.status,
        technician_name: row.technician_email,
        project_name: row.project_name || 'Projet',
        notes: row.notes
      };
    });

    const response: CalendarResponse = {
      success: true,
      events,
      month
    };

    return c.json(response);

  } catch (error) {
    console.error('Erreur GET /calendar:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur lors de la récupération du calendrier' 
    }, 500);
  }
});

// ============================================================================
// GET /api/planning/conflicts - Détecter tous les conflits
// ============================================================================
planningRoutes.get('/conflicts', async (c) => {
  try {
    const { DB } = c.env;

    // Trouver tous les techniciens avec plusieurs interventions le même jour
    const query = `
      SELECT 
        i1.id as intervention_id,
        i1.technician_id,
        i1.intervention_date,
        i1.intervention_type,
        i1.duration_hours
      FROM interventions i1
      WHERE i1.technician_id IS NOT NULL
        AND i1.status IN ('scheduled', 'in_progress')
        AND EXISTS (
          SELECT 1 FROM interventions i2
          WHERE i2.technician_id = i1.technician_id
            AND i2.intervention_date = i1.intervention_date
            AND i2.id != i1.id
            AND i2.status IN ('scheduled', 'in_progress')
        )
      ORDER BY i1.intervention_date ASC, i1.technician_id ASC
    `;

    const { results } = await DB.prepare(query).all<any>();

    // Grouper par technicien + date
    const conflictsMap = new Map<string, InterventionConflict>();

    for (const row of results || []) {
      const key = `${row.technician_id}-${row.intervention_date}`;
      
      if (!conflictsMap.has(key)) {
        // Récupérer toutes les interventions conflictuelles
        const { results: conflictingResults } = await DB.prepare(`
          SELECT id, intervention_type, intervention_date, duration_hours
          FROM interventions
          WHERE technician_id = ?
            AND intervention_date = ?
            AND status IN ('scheduled', 'in_progress')
          ORDER BY id ASC
        `).bind(row.technician_id, row.intervention_date).all();

        conflictsMap.set(key, {
          intervention_id: row.intervention_id,
          technician_id: row.technician_id,
          intervention_date: row.intervention_date,
          conflict_type: 'same_date',
          conflicting_interventions: conflictingResults as any || []
        });
      }
    }

    const conflicts = Array.from(conflictsMap.values());

    const response: ConflictsResponse = {
      success: true,
      conflicts
    };

    return c.json(response);

  } catch (error) {
    console.error('Erreur GET /conflicts:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur lors de la détection des conflits' 
    }, 500);
  }
});

// ============================================================================
// GET /api/planning/interventions/:id/ordre-mission - Générer PDF Ordre de Mission
// ============================================================================
planningRoutes.get('/interventions/:id/ordre-mission', async (c) => {
  try {
    const { DB } = c.env;
    const id = parseInt(c.req.param('id'));

    // Récupérer intervention complète avec toutes les données
    const intervention = await DB.prepare(`
      SELECT 
        i.*,
        p.project_name,
        p.total_power_kwp,
        p.module_count,
        p.module_type,
        p.inverter_type,
        p.installation_date,
        p.address_street,
        p.address_postal_code,
        p.address_city,
        p.gps_latitude,
        p.gps_longitude,
        p.inverter_count,
        p.inverter_brand,
        p.junction_box_count,
        p.strings_configuration,
        p.technical_notes,
        cc.company_name as client_name,
        cc.siret,
        cc.email as client_email,
        cc.phone as client_phone,
        cc.address_street as client_street,
        cc.address_postal_code as client_postal,
        cc.address_city as client_city,
        cc.main_contact_name,
        cc.main_contact_email,
        cc.main_contact_phone,
        u.email as technician_email
      FROM interventions i
      LEFT JOIN projects p ON i.project_id = p.id
      LEFT JOIN crm_clients cc ON i.client_id = cc.id
      LEFT JOIN auth_users u ON u.id = i.technician_id
      WHERE i.id = ?
    `).bind(id).first();

    if (!intervention) {
      return c.json({ 
        success: false, 
        error: 'Intervention introuvable' 
      }, 404);
    }

    // Générer HTML PDF
    const interventionTypeLabel = {
      'el': 'Électroluminescence (EL)',
      'iv': 'Courbes I-V',
      'visual': 'Inspection Visuelle',
      'isolation': 'Tests d\'Isolement',
      'thermography': 'Thermographie',
      'commissioning': 'Commissioning',
      'post_incident': 'Expertise Post-Sinistre'
    }[intervention.intervention_type as string] || intervention.intervention_type;

    const statusLabel = {
      'scheduled': 'Planifiée',
      'in_progress': 'En cours',
      'completed': 'Terminée',
      'cancelled': 'Annulée'
    }[intervention.status as string] || intervention.status;

    // Parser strings configuration si disponible
    let stringsConfigHTML = '';
    if (intervention.strings_configuration) {
      try {
        const config = JSON.parse(intervention.strings_configuration as string);
        if (config.mode === 'advanced' && config.strings) {
          stringsConfigHTML = `
            <h3 style="color: #ea580c; margin-top: 20px;">Configuration Strings (MPPT)</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <thead>
                <tr style="background: #f3f4f6;">
                  <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">MPPT/String #</th>
                  <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Nombre de Modules</th>
                </tr>
              </thead>
              <tbody>
                ${config.strings.map((s: any) => `
                  <tr>
                    <td style="border: 1px solid #d1d5db; padding: 8px;">String ${s.mpptNumber || s.id}</td>
                    <td style="border: 1px solid #d1d5db; padding: 8px;">${s.moduleCount} modules</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `;
        }
      } catch (e) {
        console.warn('Erreur parsing strings_configuration:', e);
      }
    }

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ordre de Mission #${intervention.id}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #1f2937;
            background: white;
            padding: 40px;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #ea580c;
        }
        .logo-section h1 {
            color: #ea580c;
            font-size: 28px;
            margin-bottom: 5px;
        }
        .logo-section p {
            color: #6b7280;
            font-size: 14px;
        }
        .doc-info {
            text-align: right;
        }
        .doc-info h2 {
            color: #1f2937;
            font-size: 24px;
            margin-bottom: 10px;
        }
        .doc-info p {
            color: #6b7280;
            font-size: 14px;
        }
        .section {
            margin-bottom: 30px;
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #ea580c;
        }
        .section h3 {
            color: #ea580c;
            font-size: 18px;
            margin-bottom: 15px;
            text-transform: uppercase;
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
        }
        .info-item {
            display: flex;
            flex-direction: column;
        }
        .info-label {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
        }
        .info-value {
            font-size: 15px;
            color: #1f2937;
            font-weight: 600;
        }
        .mission-badge {
            display: inline-block;
            background: #fef3c7;
            color: #92400e;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 15px;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
        }
        .status-scheduled { background: #dbeafe; color: #1e40af; }
        .status-in_progress { background: #fef3c7; color: #92400e; }
        .status-completed { background: #d1fae5; color: #065f46; }
        .status-cancelled { background: #fee2e2; color: #991b1b; }
        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
        }
        .signature-section {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 40px;
            margin-top: 60px;
        }
        .signature-box {
            text-align: center;
        }
        .signature-line {
            border-top: 2px solid #1f2937;
            width: 200px;
            margin: 60px auto 10px;
        }
        @media print {
            body { padding: 20px; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="no-print" style="margin-bottom: 20px;">
        <button onclick="window.print()" style="background: #ea580c; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; margin-right: 10px;">
            📄 Imprimer / Enregistrer PDF
        </button>
        <button onclick="window.close()" style="background: #666; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
            ✕ Fermer
        </button>
    </div>

    <div class="header">
        <div class="logo-section">
            <h1>🔋 DiagPV</h1>
            <p>Diagnostic Photovoltaïque Expert</p>
            <p style="margin-top: 10px;">
                3 rue d'Apollo, 31240 L'Union<br>
                📧 contact@diagpv.fr | ☎ 05.81.10.16.59<br>
                RCS 792972309
            </p>
        </div>
        <div class="doc-info">
            <h2>ORDRE DE MISSION</h2>
            <p><strong>#${intervention.id}</strong></p>
            <p>Émis le ${new Date().toLocaleDateString('fr-FR')}</p>
            <p>à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
    </div>

    <div class="mission-badge">
        ⚡ ${interventionTypeLabel}
    </div>
    <span class="status-badge status-${intervention.status}">
        ${statusLabel}
    </span>

    <!-- Informations Client -->
    <div class="section">
        <h3>👤 Informations Client</h3>
        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">Raison Sociale</span>
                <span class="info-value">${intervention.client_name || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">SIRET</span>
                <span class="info-value">${intervention.siret || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Email</span>
                <span class="info-value">${intervention.client_email || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Téléphone</span>
                <span class="info-value">${intervention.client_phone || 'N/A'}</span>
            </div>
            <div class="info-item" style="grid-column: 1 / -1;">
                <span class="info-label">Adresse</span>
                <span class="info-value">${[intervention.client_street, intervention.client_postal, intervention.client_city].filter(Boolean).join(', ') || 'N/A'}</span>
            </div>
            ${intervention.main_contact_name ? `
            <div class="info-item">
                <span class="info-label">Contact Principal</span>
                <span class="info-value">${intervention.main_contact_name}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Contact Email</span>
                <span class="info-value">${intervention.main_contact_email || 'N/A'}</span>
            </div>
            ` : ''}
        </div>
    </div>

    <!-- Informations Site PV -->
    <div class="section">
        <h3>🏭 Informations Site Photovoltaïque</h3>
        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">Nom du Site</span>
                <span class="info-value">${intervention.project_name || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Puissance Installée</span>
                <span class="info-value">${intervention.total_power_kwp ? intervention.total_power_kwp + ' kWp' : 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Nombre de Modules</span>
                <span class="info-value">${intervention.module_count || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Type de Module</span>
                <span class="info-value">${intervention.module_type || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Type d'Onduleur</span>
                <span class="info-value">${intervention.inverter_type || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Date d'Installation</span>
                <span class="info-value">${intervention.installation_date ? new Date(intervention.installation_date as string).toLocaleDateString('fr-FR') : 'N/A'}</span>
            </div>
            <div class="info-item" style="grid-column: 1 / -1;">
                <span class="info-label">Adresse du Site</span>
                <span class="info-value">${[intervention.address_street, intervention.address_postal_code, intervention.address_city].filter(Boolean).join(', ') || 'N/A'}</span>
            </div>
            ${intervention.gps_latitude && intervention.gps_longitude ? `
            <div class="info-item">
                <span class="info-label">Coordonnées GPS</span>
                <span class="info-value">${intervention.gps_latitude}, ${intervention.gps_longitude}</span>
            </div>
            ` : ''}
            ${intervention.inverter_count ? `
            <div class="info-item">
                <span class="info-label">Nombre d'Onduleurs</span>
                <span class="info-value">${intervention.inverter_count}</span>
            </div>
            ` : ''}
            ${intervention.inverter_brand ? `
            <div class="info-item">
                <span class="info-label">Marque/Modèle Onduleur</span>
                <span class="info-value">${intervention.inverter_brand}</span>
            </div>
            ` : ''}
            ${intervention.junction_box_count ? `
            <div class="info-item">
                <span class="info-label">Boîtes de Jonction</span>
                <span class="info-value">${intervention.junction_box_count}</span>
            </div>
            ` : ''}
        </div>
        ${stringsConfigHTML}
        ${intervention.technical_notes ? `
        <div style="margin-top: 15px;">
            <span class="info-label">Notes Techniques</span>
            <p style="margin-top: 5px; padding: 10px; background: white; border-radius: 4px;">${intervention.technical_notes}</p>
        </div>
        ` : ''}
    </div>

    <!-- Détails Intervention -->
    <div class="section">
        <h3>📋 Détails de l'Intervention</h3>
        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">Type d'Intervention</span>
                <span class="info-value">${interventionTypeLabel}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Date Prévue</span>
                <span class="info-value">${intervention.intervention_date ? new Date(intervention.intervention_date as string).toLocaleDateString('fr-FR') : 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Durée Estimée</span>
                <span class="info-value">${intervention.duration_hours ? intervention.duration_hours + ' heures' : 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Technicien Assigné</span>
                <span class="info-value">${intervention.technician_email || 'Non assigné'}</span>
            </div>
            ${intervention.description ? `
            <div class="info-item" style="grid-column: 1 / -1;">
                <span class="info-label">Description</span>
                <p style="margin-top: 5px; padding: 10px; background: white; border-radius: 4px;">${intervention.description}</p>
            </div>
            ` : ''}
            ${intervention.notes ? `
            <div class="info-item" style="grid-column: 1 / -1;">
                <span class="info-label">Notes</span>
                <p style="margin-top: 5px; padding: 10px; background: white; border-radius: 4px;">${intervention.notes}</p>
            </div>
            ` : ''}
        </div>
    </div>

    <!-- Signatures -->
    <div class="signature-section">
        <div class="signature-box">
            <p style="font-weight: bold; margin-bottom: 5px;">Signature Client</p>
            <p style="font-size: 12px; color: #6b7280;">Lu et approuvé</p>
            <div class="signature-line"></div>
            <p style="font-size: 12px;">Date et signature</p>
        </div>
        <div class="signature-box">
            <p style="font-weight: bold; margin-bottom: 5px;">Signature Technicien</p>
            <p style="font-size: 12px; color: #6b7280;">Prise en charge</p>
            <div class="signature-line"></div>
            <p style="font-size: 12px;">Date et signature</p>
        </div>
    </div>

    <div class="footer">
        <p><strong>Diagnostic Photovoltaïque - DiagPV</strong></p>
        <p>Expertise indépendante depuis 2012 | Plus de 500 interventions</p>
        <p>Ce document a été généré automatiquement le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
    </div>
</body>
</html>
    `;

    return c.html(html);

  } catch (error: any) {
    console.error('Erreur génération ordre de mission:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur lors de la génération de l\'ordre de mission',
      details: error.message 
    }, 500);
  }
});

export default planningRoutes;
