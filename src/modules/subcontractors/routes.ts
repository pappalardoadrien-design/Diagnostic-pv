import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
};

const subcontractorsRoutes = new Hono<{ Bindings: Bindings }>();

// ============================================================================
// GET /api/subcontractors - Liste tous les sous-traitants
// ============================================================================
subcontractorsRoutes.get('/', async (c) => {
  try {
    const { DB } = c.env;
    
    // Filtres optionnels
    const status = c.req.query('status');
    const specialty = c.req.query('specialty');
    const min_rating = c.req.query('min_rating');

    let query = `SELECT * FROM subcontractors WHERE 1=1`;
    const params: any[] = [];

    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }

    if (specialty) {
      query += ` AND specialties LIKE ?`;
      params.push(`%${specialty}%`);
    }

    if (min_rating) {
      query += ` AND rating >= ?`;
      params.push(parseFloat(min_rating));
    }

    query += ` ORDER BY rating DESC, company_name ASC`;

    const { results } = await DB.prepare(query).bind(...params).all();

    return c.json({
      success: true,
      subcontractors: results || [],
      total: results?.length || 0
    });

  } catch (error: any) {
    console.error('Erreur GET /subcontractors:', error);
    return c.json({ 
      error: 'Erreur lors de la récupération des sous-traitants',
      details: error.message 
    }, 500);
  }
});

// ============================================================================
// GET /api/subcontractors/stats - Statistiques globales
// ============================================================================
subcontractorsRoutes.get('/stats', async (c) => {
  try {
    const { DB } = c.env;

    const stats = await DB.prepare(`
      SELECT 
        COUNT(*) as total_subcontractors,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive,
        ROUND(AVG(rating), 2) as avg_rating,
        SUM(total_missions) as total_missions_all
      FROM subcontractors
    `).first();

    const topPerformers = await DB.prepare(`
      SELECT company_name, rating, total_missions
      FROM subcontractors
      WHERE status = 'active'
      ORDER BY rating DESC, total_missions DESC
      LIMIT 5
    `).all();

    return c.json({
      success: true,
      stats: stats || {},
      top_performers: topPerformers.results || []
    });

  } catch (error: any) {
    return c.json({ 
      error: 'Erreur lors de la récupération des statistiques',
      details: error.message 
    }, 500);
  }
});

// ============================================================================
// GET /api/subcontractors/:id - Détails sous-traitant
// ============================================================================
subcontractorsRoutes.get('/:id', async (c) => {
  try {
    const { DB } = c.env;
    const id = parseInt(c.req.param('id'));

    const subcontractor = await DB.prepare(`
      SELECT * FROM subcontractors WHERE id = ?
    `).bind(id).first();

    if (!subcontractor) {
      return c.json({ error: 'Sous-traitant introuvable' }, 404);
    }

    // Missions récentes
    const missions = await DB.prepare(`
      SELECT 
        sm.*,
        i.intervention_type,
        i.intervention_date,
        p.name as project_name
      FROM subcontractor_missions sm
      LEFT JOIN interventions i ON sm.intervention_id = i.id
      LEFT JOIN projects p ON i.project_id = p.id
      WHERE sm.subcontractor_id = ?
      ORDER BY sm.mission_date DESC
      LIMIT 10
    `).bind(id).all();

    return c.json({
      success: true,
      subcontractor,
      recent_missions: missions.results || []
    });

  } catch (error: any) {
    return c.json({ 
      error: 'Erreur lors de la récupération du sous-traitant',
      details: error.message 
    }, 500);
  }
});

// ============================================================================
// POST /api/subcontractors - Créer sous-traitant
// ============================================================================
subcontractorsRoutes.post('/', async (c) => {
  try {
    const { DB } = c.env;
    const data = await c.req.json();

    // Validation
    if (!data.company_name || !data.contact_name || !data.contact_email || !data.specialties) {
      return c.json({ 
        error: 'Champs requis: company_name, contact_name, contact_email, specialties' 
      }, 400);
    }

    // Convertir specialties en JSON si array
    const specialtiesJson = Array.isArray(data.specialties) 
      ? JSON.stringify(data.specialties) 
      : data.specialties;

    const result = await DB.prepare(`
      INSERT INTO subcontractors (
        company_name, siret, contact_name, contact_email, contact_phone,
        address, postal_code, city, country,
        specialties, certifications, equipment,
        hourly_rate, daily_rate, travel_cost_per_km,
        max_concurrent_missions, availability_zone, languages,
        contract_type, contract_start_date, insurance_valid_until,
        notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.company_name,
      data.siret || null,
      data.contact_name,
      data.contact_email,
      data.contact_phone || null,
      data.address || null,
      data.postal_code || null,
      data.city || null,
      data.country || 'France',
      specialtiesJson,
      data.certifications ? JSON.stringify(data.certifications) : null,
      data.equipment ? JSON.stringify(data.equipment) : null,
      data.hourly_rate || null,
      data.daily_rate || null,
      data.travel_cost_per_km || 0.50,
      data.max_concurrent_missions || 1,
      data.availability_zone || null,
      data.languages ? JSON.stringify(data.languages) : null,
      data.contract_type || 'freelance',
      data.contract_start_date || null,
      data.insurance_valid_until || null,
      data.notes || null,
      data.status || 'active'
    ).run();

    return c.json({
      success: true,
      id: result.meta.last_row_id,
      message: 'Sous-traitant créé avec succès'
    }, 201);

  } catch (error: any) {
    return c.json({ 
      error: 'Erreur lors de la création du sous-traitant',
      details: error.message 
    }, 500);
  }
});

// ============================================================================
// PUT /api/subcontractors/:id - Modifier sous-traitant
// ============================================================================
subcontractorsRoutes.put('/:id', async (c) => {
  try {
    const { DB } = c.env;
    const id = parseInt(c.req.param('id'));
    const data = await c.req.json();

    // Vérifier existence
    const existing = await DB.prepare('SELECT id FROM subcontractors WHERE id = ?')
      .bind(id).first();

    if (!existing) {
      return c.json({ error: 'Sous-traitant introuvable' }, 404);
    }

    // Construire query update dynamique
    const fields: string[] = [];
    const values: any[] = [];

    if (data.company_name !== undefined) {
      fields.push('company_name = ?');
      values.push(data.company_name);
    }
    if (data.contact_name !== undefined) {
      fields.push('contact_name = ?');
      values.push(data.contact_name);
    }
    if (data.contact_email !== undefined) {
      fields.push('contact_email = ?');
      values.push(data.contact_email);
    }
    if (data.contact_phone !== undefined) {
      fields.push('contact_phone = ?');
      values.push(data.contact_phone);
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
    }
    if (data.rating !== undefined) {
      fields.push('rating = ?');
      values.push(data.rating);
    }
    if (data.hourly_rate !== undefined) {
      fields.push('hourly_rate = ?');
      values.push(data.hourly_rate);
    }
    if (data.daily_rate !== undefined) {
      fields.push('daily_rate = ?');
      values.push(data.daily_rate);
    }
    if (data.notes !== undefined) {
      fields.push('notes = ?');
      values.push(data.notes);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await DB.prepare(`
      UPDATE subcontractors 
      SET ${fields.join(', ')}
      WHERE id = ?
    `).bind(...values).run();

    return c.json({
      success: true,
      message: 'Sous-traitant mis à jour avec succès'
    });

  } catch (error: any) {
    return c.json({ 
      error: 'Erreur lors de la mise à jour du sous-traitant',
      details: error.message 
    }, 500);
  }
});

// ============================================================================
// DELETE /api/subcontractors/:id - Supprimer sous-traitant
// ============================================================================
subcontractorsRoutes.delete('/:id', async (c) => {
  try {
    const { DB } = c.env;
    const id = parseInt(c.req.param('id'));

    // Vérifier existence
    const existing = await DB.prepare('SELECT id FROM subcontractors WHERE id = ?')
      .bind(id).first();

    if (!existing) {
      return c.json({ error: 'Sous-traitant introuvable' }, 404);
    }

    await DB.prepare('DELETE FROM subcontractors WHERE id = ?').bind(id).run();

    return c.json({
      success: true,
      message: 'Sous-traitant supprimé avec succès'
    });

  } catch (error: any) {
    return c.json({ 
      error: 'Erreur lors de la suppression du sous-traitant',
      details: error.message 
    }, 500);
  }
});

// ============================================================================
// GET /api/subcontractors/available/:date - Sous-traitants disponibles
// ============================================================================
subcontractorsRoutes.get('/available/:date', async (c) => {
  try {
    const { DB } = c.env;
    const date = c.req.param('date');
    const specialty = c.req.query('specialty');

    let query = `
      SELECT s.*
      FROM subcontractors s
      WHERE s.status = 'active'
      AND s.id NOT IN (
        SELECT subcontractor_id 
        FROM subcontractor_missions 
        WHERE mission_date = ? 
        AND status IN ('planned', 'in_progress')
      )
    `;

    const params: any[] = [date];

    if (specialty) {
      query += ` AND s.specialties LIKE ?`;
      params.push(`%${specialty}%`);
    }

    query += ` ORDER BY s.rating DESC`;

    const { results } = await DB.prepare(query).bind(...params).all();

    return c.json({
      success: true,
      available: results || [],
      date,
      specialty: specialty || 'all'
    });

  } catch (error: any) {
    return c.json({ 
      error: 'Erreur lors de la recherche de sous-traitants disponibles',
      details: error.message 
    }, 500);
  }
});

export default subcontractorsRoutes;
