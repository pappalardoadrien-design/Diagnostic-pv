/**
 * Module AMO (Assistance à Maîtrise d'Ouvrage) - Routes API
 * Suivi des missions AMO PV (10-30k€/mission)
 * Préfixe: /api/amo
 * 
 * Endpoints:
 * GET    /missions           - Liste missions AMO
 * POST   /missions           - Créer mission
 * GET    /missions/:id       - Détail mission
 * PUT    /missions/:id       - Modifier mission
 * PUT    /missions/:id/phase - Changer phase
 * DELETE /missions/:id       - Supprimer
 * POST   /missions/:id/jalons - Ajouter jalon
 * GET    /kpis               - KPIs AMO
 */

import { Hono } from 'hono';

type Bindings = { DB: D1Database; KV: KVNamespace; R2: R2Bucket };

const amoRoutes = new Hono<{ Bindings: Bindings }>();

async function ensureAMOTables(DB: D1Database): Promise<void> {
  try {
    await DB.prepare('SELECT 1 FROM amo_missions LIMIT 0').run();
  } catch {
    await DB.prepare(`CREATE TABLE IF NOT EXISTS amo_missions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reference TEXT UNIQUE,
      client_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      -- Phases: cadrage → consultation → selection → suivi_travaux → reception → garantie → cloture
      phase TEXT NOT NULL DEFAULT 'cadrage' CHECK(phase IN ('cadrage','consultation','selection','suivi_travaux','reception','garantie','cloture')),
      status TEXT DEFAULT 'en_cours' CHECK(status IN ('en_cours','en_attente','termine','annule')),
      -- Projet
      project_type TEXT DEFAULT 'neuf' CHECK(project_type IN ('neuf','renovation','extension','repowering')),
      plant_name TEXT,
      plant_location TEXT,
      target_power_kwp REAL,
      -- Périmètre AMO
      mission_scope TEXT,
      deliverables TEXT,
      -- Financier
      contract_amount REAL DEFAULT 0,
      invoiced_amount REAL DEFAULT 0,
      payment_terms TEXT,
      -- Planning
      start_date DATE,
      end_date DATE,
      actual_end_date DATE,
      -- Suivi
      progress_percent INTEGER DEFAULT 0 CHECK(progress_percent >= 0 AND progress_percent <= 100),
      assigned_to TEXT DEFAULT 'Adrien PAPPALARDO',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES crm_clients(id) ON DELETE SET NULL
    )`).run();

    await DB.prepare(`CREATE TABLE IF NOT EXISTS amo_milestones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mission_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      milestone_type TEXT DEFAULT 'livrable' CHECK(milestone_type IN ('livrable','reunion','decision','paiement','validation','autre')),
      due_date DATE,
      completed_date DATE,
      status TEXT DEFAULT 'a_faire' CHECK(status IN ('a_faire','en_cours','termine','annule')),
      amount REAL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (mission_id) REFERENCES amo_missions(id) ON DELETE CASCADE
    )`).run();

    await DB.prepare(`CREATE TABLE IF NOT EXISTS amo_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mission_id INTEGER NOT NULL,
      doc_type TEXT NOT NULL DEFAULT 'rapport' CHECK(doc_type IN ('rapport','cctp','offre','pv_reunion','cr_visite','attestation','facture','autre')),
      title TEXT NOT NULL,
      description TEXT,
      file_url TEXT,
      version INTEGER DEFAULT 1,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (mission_id) REFERENCES amo_missions(id) ON DELETE CASCADE
    )`).run();

    try {
      await DB.prepare('CREATE INDEX IF NOT EXISTS idx_amo_client ON amo_missions(client_id)').run();
      await DB.prepare('CREATE INDEX IF NOT EXISTS idx_amo_phase ON amo_missions(phase)').run();
      await DB.prepare('CREATE INDEX IF NOT EXISTS idx_amo_ms_mission ON amo_milestones(mission_id)').run();
    } catch {}
  }
}

// ============================================================================
// MISSIONS CRUD
// ============================================================================

amoRoutes.get('/missions', async (c) => {
  try {
    const { DB } = c.env;
    await ensureAMOTables(DB);
    const { phase, status, client_id } = c.req.query();
    
    let query = `SELECT m.*, c.company_name as client_name,
      (SELECT COUNT(*) FROM amo_milestones ms WHERE ms.mission_id = m.id) as total_milestones,
      (SELECT COUNT(*) FROM amo_milestones ms WHERE ms.mission_id = m.id AND ms.status = 'termine') as completed_milestones
      FROM amo_missions m LEFT JOIN crm_clients c ON m.client_id = c.id WHERE 1=1`;
    const params: any[] = [];
    
    if (phase) { query += ` AND m.phase = ?`; params.push(phase); }
    if (status) { query += ` AND m.status = ?`; params.push(status); }
    if (client_id) { query += ` AND m.client_id = ?`; params.push(client_id); }
    
    query += ` ORDER BY m.updated_at DESC`;
    const result = await DB.prepare(query).bind(...params).all();
    return c.json({ success: true, missions: result.results || [] });
  } catch (error: any) {
    return c.json({ success: true, missions: [] });
  }
});

amoRoutes.post('/missions', async (c) => {
  try {
    const { DB } = c.env;
    await ensureAMOTables(DB);
    const body = await c.req.json();
    
    if (!body.title) return c.json({ error: 'title requis' }, 400);
    
    const ref = `AMO-${Date.now().toString(36).toUpperCase()}`;
    
    const result = await DB.prepare(`
      INSERT INTO amo_missions (reference, client_id, title, description, project_type, plant_name, plant_location, target_power_kwp, mission_scope, deliverables, contract_amount, payment_terms, start_date, end_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      ref, body.client_id || null, body.title, body.description || null,
      body.project_type || 'neuf', body.plant_name || null, body.plant_location || null,
      body.target_power_kwp || null, body.mission_scope || null, body.deliverables || null,
      body.contract_amount || 0, body.payment_terms || null,
      body.start_date || null, body.end_date || null, body.notes || null
    ).run();
    
    return c.json({ success: true, id: result.meta.last_row_id, reference: ref }, 201);
  } catch (error: any) {
    return c.json({ error: 'Erreur création', details: error.message }, 500);
  }
});

amoRoutes.get('/missions/:id', async (c) => {
  try {
    const { DB } = c.env;
    await ensureAMOTables(DB);
    const id = c.req.param('id');
    
    const mission = await DB.prepare(`
      SELECT m.*, c.company_name as client_name, c.main_contact_name, c.main_contact_email
      FROM amo_missions m LEFT JOIN crm_clients c ON m.client_id = c.id WHERE m.id = ?
    `).bind(id).first();
    
    if (!mission) return c.json({ error: 'Mission AMO introuvable' }, 404);
    
    const milestones = await DB.prepare('SELECT * FROM amo_milestones WHERE mission_id = ? ORDER BY due_date ASC NULLS LAST, id').bind(id).all();
    const documents = await DB.prepare('SELECT * FROM amo_documents WHERE mission_id = ? ORDER BY created_at DESC').bind(id).all();
    
    return c.json({ success: true, mission, milestones: milestones.results || [], documents: documents.results || [] });
  } catch (error: any) {
    return c.json({ error: 'Erreur', details: error.message }, 500);
  }
});

amoRoutes.put('/missions/:id', async (c) => {
  try {
    const { DB } = c.env;
    const id = c.req.param('id');
    const body = await c.req.json();
    
    const fields: string[] = [];
    const values: any[] = [];
    const allowed = ['title','description','phase','status','project_type','plant_name','plant_location','target_power_kwp','mission_scope','deliverables','contract_amount','invoiced_amount','payment_terms','start_date','end_date','actual_end_date','progress_percent','assigned_to','notes','client_id'];
    
    for (const key of allowed) {
      if (body[key] !== undefined) { fields.push(`${key} = ?`); values.push(body[key]); }
    }
    if (fields.length === 0) return c.json({ error: 'Aucun champ' }, 400);
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    await DB.prepare(`UPDATE amo_missions SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
    return c.json({ success: true, message: 'Mission AMO mise à jour' });
  } catch (error: any) {
    return c.json({ error: 'Erreur', details: error.message }, 500);
  }
});

amoRoutes.put('/missions/:id/phase', async (c) => {
  try {
    const { DB } = c.env;
    const id = c.req.param('id');
    const { phase } = await c.req.json();
    
    const valid = ['cadrage','consultation','selection','suivi_travaux','reception','garantie','cloture'];
    if (!phase || !valid.includes(phase)) return c.json({ error: `Phase invalide: ${valid.join(', ')}` }, 400);
    
    // Auto-progression
    const phaseProgress: Record<string, number> = {
      cadrage: 10, consultation: 25, selection: 40, suivi_travaux: 60, reception: 80, garantie: 90, cloture: 100
    };
    
    await DB.prepare('UPDATE amo_missions SET phase = ?, progress_percent = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .bind(phase, phaseProgress[phase] || 0, id).run();
    return c.json({ success: true, message: `Phase: ${phase}` });
  } catch (error: any) {
    return c.json({ error: 'Erreur', details: error.message }, 500);
  }
});

amoRoutes.delete('/missions/:id', async (c) => {
  try {
    const { DB } = c.env;
    const id = c.req.param('id');
    await DB.prepare('DELETE FROM amo_milestones WHERE mission_id = ?').bind(id).run();
    await DB.prepare('DELETE FROM amo_documents WHERE mission_id = ?').bind(id).run();
    await DB.prepare('DELETE FROM amo_missions WHERE id = ?').bind(id).run();
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: 'Erreur', details: error.message }, 500);
  }
});

// ============================================================================
// JALONS
// ============================================================================

amoRoutes.post('/missions/:id/milestones', async (c) => {
  try {
    const { DB } = c.env;
    await ensureAMOTables(DB);
    const missionId = c.req.param('id');
    const body = await c.req.json();
    
    if (!body.title) return c.json({ error: 'title requis' }, 400);
    
    const result = await DB.prepare(`
      INSERT INTO amo_milestones (mission_id, title, description, milestone_type, due_date, amount, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(missionId, body.title, body.description || null, body.milestone_type || 'livrable', body.due_date || null, body.amount || null, body.notes || null).run();
    
    return c.json({ success: true, id: result.meta.last_row_id }, 201);
  } catch (error: any) {
    return c.json({ error: 'Erreur', details: error.message }, 500);
  }
});

amoRoutes.put('/milestones/:id', async (c) => {
  try {
    const { DB } = c.env;
    const id = c.req.param('id');
    const body = await c.req.json();
    
    const fields: string[] = [];
    const values: any[] = [];
    const allowed = ['title','description','milestone_type','due_date','completed_date','status','amount','notes'];
    
    for (const key of allowed) {
      if (body[key] !== undefined) { fields.push(`${key} = ?`); values.push(body[key]); }
    }
    if (fields.length === 0) return c.json({ error: 'Aucun champ' }, 400);
    
    values.push(id);
    await DB.prepare(`UPDATE amo_milestones SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
    
    // Auto-update progress
    try {
      const ms = await DB.prepare('SELECT mission_id FROM amo_milestones WHERE id = ?').bind(id).first() as any;
      if (ms?.mission_id) {
        const stats = await DB.prepare(`
          SELECT COUNT(*) as total, SUM(CASE WHEN status = 'termine' THEN 1 ELSE 0 END) as done
          FROM amo_milestones WHERE mission_id = ?
        `).bind(ms.mission_id).first() as any;
        const progress = stats?.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
        await DB.prepare('UPDATE amo_missions SET progress_percent = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(progress, ms.mission_id).run();
      }
    } catch {}
    
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: 'Erreur', details: error.message }, 500);
  }
});

// ============================================================================
// KPIs
// ============================================================================

amoRoutes.get('/kpis', async (c) => {
  try {
    const { DB } = c.env;
    await ensureAMOTables(DB);
    
    const total = await DB.prepare('SELECT COUNT(*) as count, COALESCE(SUM(contract_amount),0) as ca, COALESCE(SUM(invoiced_amount),0) as invoiced FROM amo_missions').first() as any;
    const active = await DB.prepare("SELECT COUNT(*) as count, COALESCE(SUM(contract_amount),0) as ca FROM amo_missions WHERE status = 'en_cours'").first() as any;
    const byPhase = await DB.prepare('SELECT phase, COUNT(*) as count, COALESCE(SUM(contract_amount),0) as ca FROM amo_missions GROUP BY phase').all();
    const upcomingMilestones = await DB.prepare(`
      SELECT ms.*, m.title as mission_title, m.reference
      FROM amo_milestones ms
      JOIN amo_missions m ON ms.mission_id = m.id
      WHERE ms.status != 'termine' AND ms.status != 'annule'
      ORDER BY ms.due_date ASC NULLS LAST
      LIMIT 10
    `).all();
    
    return c.json({
      success: true,
      kpis: {
        total_missions: total?.count || 0,
        total_ca: total?.ca || 0,
        invoiced: total?.invoiced || 0,
        active_count: active?.count || 0,
        active_ca: active?.ca || 0,
        remaining_to_invoice: (total?.ca || 0) - (total?.invoiced || 0)
      },
      by_phase: byPhase.results || [],
      upcoming_milestones: upcomingMilestones.results || []
    });
  } catch (error: any) {
    return c.json({ success: true, kpis: {}, by_phase: [], upcoming_milestones: [] });
  }
});

export default amoRoutes;
