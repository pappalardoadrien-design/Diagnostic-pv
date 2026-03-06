/**
 * CRM Pipeline Routes - Gestion des opportunités commerciales
 * Préfixe: /api/crm/pipeline
 * 
 * Endpoints:
 * --- Opportunités ---
 * GET    /opportunities                - Liste opportunités (filtres: stage, type, client_id)
 * POST   /opportunities                - Créer opportunité
 * GET    /opportunities/:id            - Détail opportunité
 * PUT    /opportunities/:id            - Modifier opportunité
 * PUT    /opportunities/:id/stage      - Déplacer dans le pipeline
 * DELETE /opportunities/:id            - Supprimer opportunité
 * --- Pipeline KPIs ---
 * GET    /kpis                         - KPIs pipeline (CA prévisionnel, conversion, etc.)
 * GET    /kanban                       - Données formatées pour vue Kanban
 * --- Activités ---
 * GET    /activities                   - Liste activités récentes
 * POST   /activities                   - Créer activité
 */

import { Hono } from 'hono';

type Bindings = { DB: D1Database; KV: KVNamespace; R2: R2Bucket };

const pipelineRoutes = new Hono<{ Bindings: Bindings }>();

// Helper auto-init tables si manquantes
async function ensurePipelineTables(DB: D1Database): Promise<void> {
  try {
    await DB.prepare('SELECT 1 FROM crm_opportunities LIMIT 0').run();
  } catch {
    await DB.prepare(`CREATE TABLE IF NOT EXISTS crm_opportunities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      stage TEXT NOT NULL DEFAULT 'prospect' CHECK(stage IN ('prospect','qualification','proposition','negociation','signe','perdu')),
      amount REAL DEFAULT 0,
      probability INTEGER DEFAULT 10,
      expected_close_date DATE,
      actual_close_date DATE,
      opportunity_type TEXT DEFAULT 'diagnostic',
      source TEXT,
      source_category TEXT,
      assigned_to TEXT,
      next_action TEXT,
      next_action_date DATE,
      lost_reason TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES crm_clients(id) ON DELETE CASCADE
    )`).run();
    
    await DB.prepare(`CREATE TABLE IF NOT EXISTS crm_activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      opportunity_id INTEGER,
      client_id INTEGER NOT NULL,
      activity_type TEXT NOT NULL DEFAULT 'note',
      subject TEXT NOT NULL,
      description TEXT,
      activity_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      duration_minutes INTEGER,
      outcome TEXT,
      next_step TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (opportunity_id) REFERENCES crm_opportunities(id) ON DELETE SET NULL,
      FOREIGN KEY (client_id) REFERENCES crm_clients(id) ON DELETE CASCADE
    )`).run();

    try {
      await DB.prepare(`CREATE INDEX IF NOT EXISTS idx_opp_stage ON crm_opportunities(stage)`).run();
      await DB.prepare(`CREATE INDEX IF NOT EXISTS idx_opp_type ON crm_opportunities(opportunity_type)`).run();
      await DB.prepare(`CREATE INDEX IF NOT EXISTS idx_act_date ON crm_activities(activity_date)`).run();
    } catch {}
  }
}

// ============================================================================
// OPPORTUNITÉS CRUD
// ============================================================================

// GET /opportunities - Liste avec filtres
pipelineRoutes.get('/opportunities', async (c) => {
  try {
    const { DB } = c.env;
    await ensurePipelineTables(DB);
    const { stage, opportunity_type, client_id, source_category, limit: l, offset: o } = c.req.query();
    
    let query = `SELECT o.*, c.company_name as client_name 
      FROM crm_opportunities o 
      LEFT JOIN crm_clients c ON o.client_id = c.id 
      WHERE 1=1`;
    const params: any[] = [];
    
    if (stage) { query += ` AND o.stage = ?`; params.push(stage); }
    if (opportunity_type) { query += ` AND o.opportunity_type = ?`; params.push(opportunity_type); }
    if (client_id) { query += ` AND o.client_id = ?`; params.push(client_id); }
    if (source_category) { query += ` AND o.source_category = ?`; params.push(source_category); }
    
    query += ` ORDER BY o.updated_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(l || '50'), parseInt(o || '0'));
    
    const result = await DB.prepare(query).bind(...params).all();
    
    return c.json({ success: true, opportunities: result.results || [], total: (result.results || []).length });
  } catch (error: any) {
    return c.json({ error: 'Erreur liste opportunités', details: error.message }, 500);
  }
});

// POST /opportunities - Créer
pipelineRoutes.post('/opportunities', async (c) => {
  try {
    const { DB } = c.env;
    await ensurePipelineTables(DB);
    const body = await c.req.json();
    
    const { client_id, title, description, stage, amount, probability, expected_close_date, opportunity_type, source, source_category, assigned_to, next_action, next_action_date, notes } = body;
    
    if (!client_id || !title) return c.json({ error: 'client_id et title requis' }, 400);
    
    const result = await DB.prepare(`
      INSERT INTO crm_opportunities (client_id, title, description, stage, amount, probability, expected_close_date, opportunity_type, source, source_category, assigned_to, next_action, next_action_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      client_id, title, description || null, stage || 'prospect',
      amount || 0, probability || 10, expected_close_date || null,
      opportunity_type || 'diagnostic', source || null, source_category || null,
      assigned_to || 'Adrien PAPPALARDO', next_action || null, next_action_date || null, notes || null
    ).run();
    
    return c.json({ success: true, id: result.meta.last_row_id, message: 'Opportunité créée' }, 201);
  } catch (error: any) {
    return c.json({ error: 'Erreur création', details: error.message }, 500);
  }
});

// GET /opportunities/:id - Détail
pipelineRoutes.get('/opportunities/:id', async (c) => {
  try {
    const { DB } = c.env;
    await ensurePipelineTables(DB);
    const id = c.req.param('id');
    
    const opp = await DB.prepare(`
      SELECT o.*, c.company_name as client_name, c.main_contact_name, c.main_contact_email, c.main_contact_phone
      FROM crm_opportunities o
      LEFT JOIN crm_clients c ON o.client_id = c.id
      WHERE o.id = ?
    `).bind(id).first();
    
    if (!opp) return c.json({ error: 'Opportunité introuvable' }, 404);
    
    // Activités liées
    const activities = await DB.prepare(
      'SELECT * FROM crm_activities WHERE opportunity_id = ? ORDER BY activity_date DESC LIMIT 20'
    ).bind(id).all();
    
    return c.json({ success: true, opportunity: opp, activities: activities.results || [] });
  } catch (error: any) {
    return c.json({ error: 'Erreur détail', details: error.message }, 500);
  }
});

// PUT /opportunities/:id - Modifier
pipelineRoutes.put('/opportunities/:id', async (c) => {
  try {
    const { DB } = c.env;
    await ensurePipelineTables(DB);
    const id = c.req.param('id');
    const body = await c.req.json();
    
    const fields: string[] = [];
    const values: any[] = [];
    
    const allowed = ['title','description','stage','amount','probability','expected_close_date','actual_close_date','opportunity_type','source','source_category','assigned_to','next_action','next_action_date','lost_reason','notes'];
    for (const key of allowed) {
      if (body[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(body[key]);
      }
    }
    
    if (fields.length === 0) return c.json({ error: 'Aucun champ à modifier' }, 400);
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    
    await DB.prepare(`UPDATE crm_opportunities SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
    
    return c.json({ success: true, message: 'Opportunité mise à jour' });
  } catch (error: any) {
    return c.json({ error: 'Erreur modification', details: error.message }, 500);
  }
});

// PUT /opportunities/:id/stage - Déplacer dans le pipeline (Kanban drag)
pipelineRoutes.put('/opportunities/:id/stage', async (c) => {
  try {
    const { DB } = c.env;
    await ensurePipelineTables(DB);
    const id = c.req.param('id');
    const { stage, lost_reason } = await c.req.json();
    
    const validStages = ['prospect','qualification','proposition','negociation','signe','perdu'];
    if (!stage || !validStages.includes(stage)) {
      return c.json({ error: `Stage invalide. Valeurs: ${validStages.join(', ')}` }, 400);
    }
    
    const updates: string[] = ['stage = ?', 'updated_at = CURRENT_TIMESTAMP'];
    const params: any[] = [stage];
    
    // Si signé, on met actual_close_date
    if (stage === 'signe') {
      updates.push('actual_close_date = ?', 'probability = 100');
      params.push(new Date().toISOString().split('T')[0]);
    }
    // Si perdu, on met le motif
    if (stage === 'perdu') {
      updates.push('lost_reason = ?', 'probability = 0');
      params.push(lost_reason || null);
    }
    
    // Ajuster probabilité par stage
    const stageProbability: Record<string, number> = {
      prospect: 10, qualification: 25, proposition: 50, negociation: 75, signe: 100, perdu: 0
    };
    if (stage !== 'signe' && stage !== 'perdu') {
      updates.push('probability = ?');
      params.push(stageProbability[stage]);
    }
    
    params.push(id);
    await DB.prepare(`UPDATE crm_opportunities SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();
    
    // Log activité automatique
    try {
      const opp = await DB.prepare('SELECT client_id, title FROM crm_opportunities WHERE id = ?').bind(id).first() as any;
      if (opp) {
        await DB.prepare(`INSERT INTO crm_activities (opportunity_id, client_id, activity_type, subject, description) VALUES (?, ?, 'note', ?, ?)`).bind(
          id, opp.client_id, `Pipeline: ${stage}`, `Opportunité "${opp.title}" déplacée vers ${stage}`
        ).run();
      }
    } catch {}
    
    return c.json({ success: true, message: `Déplacé vers ${stage}` });
  } catch (error: any) {
    return c.json({ error: 'Erreur déplacement', details: error.message }, 500);
  }
});

// DELETE /opportunities/:id
pipelineRoutes.delete('/opportunities/:id', async (c) => {
  try {
    const { DB } = c.env;
    const id = c.req.param('id');
    await DB.prepare('DELETE FROM crm_opportunities WHERE id = ?').bind(id).run();
    return c.json({ success: true, message: 'Opportunité supprimée' });
  } catch (error: any) {
    return c.json({ error: 'Erreur suppression', details: error.message }, 500);
  }
});

// ============================================================================
// PIPELINE KPIs
// ============================================================================

pipelineRoutes.get('/kpis', async (c) => {
  try {
    const { DB } = c.env;
    await ensurePipelineTables(DB);
    
    const safeQuery = async (sql: string) => {
      try { return await DB.prepare(sql).first(); } catch { return null; }
    };
    
    // KPIs par stage
    const stages = await DB.prepare(`
      SELECT stage, COUNT(*) as count, COALESCE(SUM(amount),0) as total_amount, ROUND(AVG(probability),0) as avg_probability
      FROM crm_opportunities GROUP BY stage
    `).all();
    
    // CA pipeline pondéré
    const weighted = await safeQuery(
      `SELECT COALESCE(SUM(amount * probability / 100.0), 0) as weighted_ca FROM crm_opportunities WHERE stage NOT IN ('signe','perdu')`
    ) as any;
    
    // CA signé
    const signed = await safeQuery(
      `SELECT COALESCE(SUM(amount),0) as signed_ca, COUNT(*) as signed_count FROM crm_opportunities WHERE stage = 'signe'`
    ) as any;
    
    // CA perdu
    const lost = await safeQuery(
      `SELECT COALESCE(SUM(amount),0) as lost_ca, COUNT(*) as lost_count FROM crm_opportunities WHERE stage = 'perdu'`
    ) as any;
    
    // Total actif
    const active = await safeQuery(
      `SELECT COUNT(*) as count, COALESCE(SUM(amount),0) as total FROM crm_opportunities WHERE stage NOT IN ('signe','perdu')`
    ) as any;
    
    // Par type d'opportunité
    const byType = await DB.prepare(`
      SELECT opportunity_type, COUNT(*) as count, COALESCE(SUM(amount),0) as total_amount
      FROM crm_opportunities WHERE stage NOT IN ('perdu')
      GROUP BY opportunity_type
    `).all();
    
    // Par source
    const bySource = await DB.prepare(`
      SELECT source_category, COUNT(*) as count, COALESCE(SUM(amount),0) as total_amount
      FROM crm_opportunities WHERE source_category IS NOT NULL
      GROUP BY source_category
    `).all();
    
    // Activités récentes (7j)
    const recentActivities = await safeQuery(
      `SELECT COUNT(*) as count FROM crm_activities WHERE activity_date >= datetime('now','-7 days')`
    ) as any;
    
    // Prochaines actions
    const nextActions = await DB.prepare(`
      SELECT o.id, o.title, o.next_action, o.next_action_date, c.company_name
      FROM crm_opportunities o
      LEFT JOIN crm_clients c ON o.client_id = c.id
      WHERE o.next_action IS NOT NULL AND o.stage NOT IN ('signe','perdu')
      ORDER BY o.next_action_date ASC NULLS LAST
      LIMIT 10
    `).all();
    
    // Taux de conversion
    const totalOpps = (active?.count || 0) + (signed?.signed_count || 0) + (lost?.lost_count || 0);
    const conversionRate = totalOpps > 0 ? Math.round(((signed?.signed_count || 0) / totalOpps) * 100) : 0;
    
    return c.json({
      success: true,
      kpis: {
        pipeline_weighted_ca: weighted?.weighted_ca || 0,
        signed_ca: signed?.signed_ca || 0,
        signed_count: signed?.signed_count || 0,
        lost_ca: lost?.lost_ca || 0,
        lost_count: lost?.lost_count || 0,
        active_count: active?.count || 0,
        active_total: active?.total || 0,
        conversion_rate: conversionRate,
        activities_7d: recentActivities?.count || 0
      },
      stages: stages.results || [],
      by_type: byType.results || [],
      by_source: bySource.results || [],
      next_actions: nextActions.results || []
    });
  } catch (error: any) {
    return c.json({ success: true, kpis: {}, stages: [], by_type: [], by_source: [], next_actions: [] });
  }
});

// GET /kanban - Données formatées Kanban
pipelineRoutes.get('/kanban', async (c) => {
  try {
    const { DB } = c.env;
    await ensurePipelineTables(DB);
    
    const allOpps = await DB.prepare(`
      SELECT o.*, c.company_name as client_name
      FROM crm_opportunities o
      LEFT JOIN crm_clients c ON o.client_id = c.id
      ORDER BY o.updated_at DESC
    `).all();
    
    const stageConfig = [
      { key: 'prospect', label: 'Prospect', color: '#6b7280', icon: '🎯' },
      { key: 'qualification', label: 'Qualification', color: '#3b82f6', icon: '🔍' },
      { key: 'proposition', label: 'Proposition', color: '#f59e0b', icon: '📄' },
      { key: 'negociation', label: 'Négociation', color: '#8b5cf6', icon: '🤝' },
      { key: 'signe', label: 'Signé', color: '#10b981', icon: '✅' },
      { key: 'perdu', label: 'Perdu', color: '#ef4444', icon: '❌' }
    ];
    
    const columns = stageConfig.map(s => ({
      ...s,
      opportunities: ((allOpps.results || []) as any[]).filter((o: any) => o.stage === s.key),
      count: ((allOpps.results || []) as any[]).filter((o: any) => o.stage === s.key).length,
      total_amount: ((allOpps.results || []) as any[]).filter((o: any) => o.stage === s.key).reduce((sum: number, o: any) => sum + (o.amount || 0), 0)
    }));
    
    return c.json({ success: true, columns });
  } catch (error: any) {
    return c.json({ success: true, columns: [] });
  }
});

// ============================================================================
// ACTIVITÉS
// ============================================================================

pipelineRoutes.get('/activities', async (c) => {
  try {
    const { DB } = c.env;
    await ensurePipelineTables(DB);
    const { client_id, opportunity_id, limit: l } = c.req.query();
    
    let query = `SELECT a.*, c.company_name as client_name, o.title as opportunity_title
      FROM crm_activities a
      LEFT JOIN crm_clients c ON a.client_id = c.id
      LEFT JOIN crm_opportunities o ON a.opportunity_id = o.id
      WHERE 1=1`;
    const params: any[] = [];
    
    if (client_id) { query += ` AND a.client_id = ?`; params.push(client_id); }
    if (opportunity_id) { query += ` AND a.opportunity_id = ?`; params.push(opportunity_id); }
    
    query += ` ORDER BY a.activity_date DESC LIMIT ?`;
    params.push(parseInt(l || '50'));
    
    const result = await DB.prepare(query).bind(...params).all();
    return c.json({ success: true, activities: result.results || [] });
  } catch (error: any) {
    return c.json({ success: true, activities: [] });
  }
});

pipelineRoutes.post('/activities', async (c) => {
  try {
    const { DB } = c.env;
    await ensurePipelineTables(DB);
    const body = await c.req.json();
    
    const { client_id, opportunity_id, activity_type, subject, description, duration_minutes, outcome, next_step } = body;
    
    if (!client_id || !subject) return c.json({ error: 'client_id et subject requis' }, 400);
    
    const result = await DB.prepare(`
      INSERT INTO crm_activities (client_id, opportunity_id, activity_type, subject, description, duration_minutes, outcome, next_step, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Adrien PAPPALARDO')
    `).bind(client_id, opportunity_id || null, activity_type || 'note', subject, description || null, duration_minutes || null, outcome || null, next_step || null).run();
    
    return c.json({ success: true, id: result.meta.last_row_id, message: 'Activité enregistrée' }, 201);
  } catch (error: any) {
    return c.json({ error: 'Erreur création activité', details: error.message }, 500);
  }
});

export default pipelineRoutes;
