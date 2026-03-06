/**
 * Module Formations PV - Routes API
 * Tracking sessions, organismes Qualiopi, CA formations
 * Préfixe: /api/formations
 * 
 * Endpoints:
 * GET    /sessions           - Liste sessions formation
 * POST   /sessions           - Créer session
 * GET    /sessions/:id       - Détail session
 * PUT    /sessions/:id       - Modifier session
 * DELETE /sessions/:id       - Supprimer
 * POST   /sessions/:id/participants - Ajouter participant
 * GET    /organismes         - Liste organismes partenaires
 * POST   /organismes         - Ajouter organisme
 * GET    /kpis               - KPIs formations
 */

import { Hono } from 'hono';

type Bindings = { DB: D1Database; KV: KVNamespace; R2: R2Bucket };

const formationRoutes = new Hono<{ Bindings: Bindings }>();

async function ensureFormationTables(DB: D1Database): Promise<void> {
  try {
    await DB.prepare('SELECT 1 FROM formation_sessions LIMIT 0').run();
  } catch {
    await DB.prepare(`CREATE TABLE IF NOT EXISTS formation_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reference TEXT UNIQUE,
      title TEXT NOT NULL,
      description TEXT,
      -- Type
      formation_type TEXT DEFAULT 'inter' CHECK(formation_type IN ('inter','intra','e_learning','terrain','webinaire')),
      theme TEXT DEFAULT 'diagnostic' CHECK(theme IN ('diagnostic','thermographie','el_nocturne','iv_curves','maintenance','repowering','reglementation','securite','autre')),
      level TEXT DEFAULT 'debutant' CHECK(level IN ('debutant','intermediaire','avance','expert')),
      -- Organisme
      organisme_id INTEGER,
      organisme_name TEXT,
      qualiopi_certified INTEGER DEFAULT 0,
      certification_number TEXT,
      -- Planning
      start_date DATE,
      end_date DATE,
      duration_hours REAL DEFAULT 7,
      duration_days REAL DEFAULT 1,
      location TEXT,
      max_participants INTEGER DEFAULT 12,
      -- Financier
      price_per_participant REAL DEFAULT 0,
      total_revenue REAL DEFAULT 0,
      organisme_share REAL DEFAULT 0,
      diagpv_revenue REAL DEFAULT 0,
      -- Statut
      status TEXT DEFAULT 'planifie' CHECK(status IN ('planifie','confirme','en_cours','termine','annule')),
      -- Formateur
      trainer TEXT DEFAULT 'Adrien PAPPALARDO',
      -- Contenu
      program_outline TEXT,
      materials TEXT,
      evaluation_method TEXT,
      -- Suivi
      satisfaction_score REAL,
      completion_rate REAL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`).run();

    await DB.prepare(`CREATE TABLE IF NOT EXISTS formation_participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      client_id INTEGER,
      participant_name TEXT NOT NULL,
      company TEXT,
      email TEXT,
      phone TEXT,
      status TEXT DEFAULT 'inscrit' CHECK(status IN ('inscrit','confirme','present','absent','annule')),
      payment_status TEXT DEFAULT 'en_attente' CHECK(payment_status IN ('en_attente','facture','paye','rembourse')),
      amount_paid REAL DEFAULT 0,
      certificate_issued INTEGER DEFAULT 0,
      evaluation_score REAL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES formation_sessions(id) ON DELETE CASCADE,
      FOREIGN KEY (client_id) REFERENCES crm_clients(id) ON DELETE SET NULL
    )`).run();

    await DB.prepare(`CREATE TABLE IF NOT EXISTS formation_organismes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'organisme' CHECK(type IN ('organisme','opco','entreprise','independant')),
      qualiopi_certified INTEGER DEFAULT 0,
      qualiopi_number TEXT,
      contact_name TEXT,
      contact_email TEXT,
      contact_phone TEXT,
      address TEXT,
      commission_rate REAL DEFAULT 30,
      partnership_status TEXT DEFAULT 'actif' CHECK(partnership_status IN ('prospect','actif','inactif','termine')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`).run();

    try {
      await DB.prepare('CREATE INDEX IF NOT EXISTS idx_fs_status ON formation_sessions(status)').run();
      await DB.prepare('CREATE INDEX IF NOT EXISTS idx_fp_session ON formation_participants(session_id)').run();
    } catch {}
  }
}

// ============================================================================
// SESSIONS
// ============================================================================

formationRoutes.get('/sessions', async (c) => {
  try {
    const { DB } = c.env;
    await ensureFormationTables(DB);
    const { status, theme, formation_type } = c.req.query();
    
    let query = `SELECT s.*, 
      (SELECT COUNT(*) FROM formation_participants p WHERE p.session_id = s.id) as participant_count,
      (SELECT COUNT(*) FROM formation_participants p WHERE p.session_id = s.id AND p.status = 'present') as present_count
      FROM formation_sessions s WHERE 1=1`;
    const params: any[] = [];
    
    if (status) { query += ` AND s.status = ?`; params.push(status); }
    if (theme) { query += ` AND s.theme = ?`; params.push(theme); }
    if (formation_type) { query += ` AND s.formation_type = ?`; params.push(formation_type); }
    
    query += ` ORDER BY s.start_date DESC NULLS LAST, s.created_at DESC`;
    const result = await DB.prepare(query).bind(...params).all();
    return c.json({ success: true, sessions: result.results || [] });
  } catch (error: any) {
    return c.json({ success: true, sessions: [] });
  }
});

formationRoutes.post('/sessions', async (c) => {
  try {
    const { DB } = c.env;
    await ensureFormationTables(DB);
    const body = await c.req.json();
    
    if (!body.title) return c.json({ error: 'title requis' }, 400);
    
    const ref = `FORM-${Date.now().toString(36).toUpperCase()}`;
    
    const result = await DB.prepare(`
      INSERT INTO formation_sessions (reference, title, description, formation_type, theme, level, organisme_id, organisme_name, qualiopi_certified, certification_number, start_date, end_date, duration_hours, duration_days, location, max_participants, price_per_participant, trainer, program_outline, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      ref, body.title, body.description || null, body.formation_type || 'inter',
      body.theme || 'diagnostic', body.level || 'intermediaire',
      body.organisme_id || null, body.organisme_name || null,
      body.qualiopi_certified ? 1 : 0, body.certification_number || null,
      body.start_date || null, body.end_date || null,
      body.duration_hours || 7, body.duration_days || 1,
      body.location || null, body.max_participants || 12,
      body.price_per_participant || 0, body.trainer || 'Adrien PAPPALARDO',
      body.program_outline || null, body.notes || null
    ).run();
    
    return c.json({ success: true, id: result.meta.last_row_id, reference: ref }, 201);
  } catch (error: any) {
    return c.json({ error: 'Erreur', details: error.message }, 500);
  }
});

formationRoutes.get('/sessions/:id', async (c) => {
  try {
    const { DB } = c.env;
    await ensureFormationTables(DB);
    const id = c.req.param('id');
    
    const session = await DB.prepare('SELECT * FROM formation_sessions WHERE id = ?').bind(id).first();
    if (!session) return c.json({ error: 'Session introuvable' }, 404);
    
    const participants = await DB.prepare('SELECT * FROM formation_participants WHERE session_id = ? ORDER BY participant_name').bind(id).all();
    
    return c.json({ success: true, session, participants: participants.results || [] });
  } catch (error: any) {
    return c.json({ error: 'Erreur', details: error.message }, 500);
  }
});

formationRoutes.put('/sessions/:id', async (c) => {
  try {
    const { DB } = c.env;
    const id = c.req.param('id');
    const body = await c.req.json();
    
    const fields: string[] = [];
    const values: any[] = [];
    const allowed = ['title','description','formation_type','theme','level','organisme_id','organisme_name','qualiopi_certified','start_date','end_date','duration_hours','duration_days','location','max_participants','price_per_participant','total_revenue','organisme_share','diagpv_revenue','status','trainer','program_outline','materials','evaluation_method','satisfaction_score','completion_rate','notes'];
    
    for (const key of allowed) {
      if (body[key] !== undefined) { fields.push(`${key} = ?`); values.push(body[key]); }
    }
    if (fields.length === 0) return c.json({ error: 'Aucun champ' }, 400);
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    await DB.prepare(`UPDATE formation_sessions SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
    
    // Auto-calcul revenus
    try {
      const sess = await DB.prepare('SELECT price_per_participant, organisme_share FROM formation_sessions WHERE id = ?').bind(id).first() as any;
      const pCount = await DB.prepare("SELECT COUNT(*) as c FROM formation_participants WHERE session_id = ? AND status IN ('confirme','present')").bind(id).first() as any;
      if (sess && pCount) {
        const revenue = (sess.price_per_participant || 0) * (pCount.c || 0);
        const share = revenue * ((sess.organisme_share || 0) / 100);
        await DB.prepare('UPDATE formation_sessions SET total_revenue = ?, diagpv_revenue = ? WHERE id = ?').bind(revenue, revenue - share, id).run();
      }
    } catch {}
    
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: 'Erreur', details: error.message }, 500);
  }
});

formationRoutes.delete('/sessions/:id', async (c) => {
  try {
    const { DB } = c.env;
    const id = c.req.param('id');
    await DB.prepare('DELETE FROM formation_participants WHERE session_id = ?').bind(id).run();
    await DB.prepare('DELETE FROM formation_sessions WHERE id = ?').bind(id).run();
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: 'Erreur', details: error.message }, 500);
  }
});

// ============================================================================
// PARTICIPANTS
// ============================================================================

formationRoutes.post('/sessions/:id/participants', async (c) => {
  try {
    const { DB } = c.env;
    await ensureFormationTables(DB);
    const sessionId = c.req.param('id');
    const body = await c.req.json();
    
    if (!body.participant_name) return c.json({ error: 'participant_name requis' }, 400);
    
    const result = await DB.prepare(`
      INSERT INTO formation_participants (session_id, client_id, participant_name, company, email, phone, amount_paid, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(sessionId, body.client_id || null, body.participant_name, body.company || null, body.email || null, body.phone || null, body.amount_paid || 0, body.notes || null).run();
    
    return c.json({ success: true, id: result.meta.last_row_id }, 201);
  } catch (error: any) {
    return c.json({ error: 'Erreur', details: error.message }, 500);
  }
});

formationRoutes.put('/participants/:id', async (c) => {
  try {
    const { DB } = c.env;
    const id = c.req.param('id');
    const body = await c.req.json();
    
    const fields: string[] = [];
    const values: any[] = [];
    const allowed = ['participant_name','company','email','phone','status','payment_status','amount_paid','certificate_issued','evaluation_score','notes'];
    
    for (const key of allowed) {
      if (body[key] !== undefined) { fields.push(`${key} = ?`); values.push(body[key]); }
    }
    if (fields.length === 0) return c.json({ error: 'Aucun champ' }, 400);
    
    values.push(id);
    await DB.prepare(`UPDATE formation_participants SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: 'Erreur', details: error.message }, 500);
  }
});

// ============================================================================
// ORGANISMES
// ============================================================================

formationRoutes.get('/organismes', async (c) => {
  try {
    const { DB } = c.env;
    await ensureFormationTables(DB);
    const result = await DB.prepare('SELECT * FROM formation_organismes ORDER BY name').all();
    return c.json({ success: true, organismes: result.results || [] });
  } catch (error: any) {
    return c.json({ success: true, organismes: [] });
  }
});

formationRoutes.post('/organismes', async (c) => {
  try {
    const { DB } = c.env;
    await ensureFormationTables(DB);
    const body = await c.req.json();
    
    if (!body.name) return c.json({ error: 'name requis' }, 400);
    
    const result = await DB.prepare(`
      INSERT INTO formation_organismes (name, type, qualiopi_certified, qualiopi_number, contact_name, contact_email, contact_phone, address, commission_rate, partnership_status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(body.name, body.type || 'organisme', body.qualiopi_certified ? 1 : 0, body.qualiopi_number || null, body.contact_name || null, body.contact_email || null, body.contact_phone || null, body.address || null, body.commission_rate || 30, body.partnership_status || 'prospect', body.notes || null).run();
    
    return c.json({ success: true, id: result.meta.last_row_id }, 201);
  } catch (error: any) {
    return c.json({ error: 'Erreur', details: error.message }, 500);
  }
});

// ============================================================================
// KPIs
// ============================================================================

formationRoutes.get('/kpis', async (c) => {
  try {
    const { DB } = c.env;
    await ensureFormationTables(DB);
    
    const total = await DB.prepare('SELECT COUNT(*) as count, COALESCE(SUM(total_revenue),0) as revenue, COALESCE(SUM(diagpv_revenue),0) as diagpv_revenue FROM formation_sessions').first() as any;
    const active = await DB.prepare("SELECT COUNT(*) as count FROM formation_sessions WHERE status IN ('planifie','confirme','en_cours')").first() as any;
    const done = await DB.prepare("SELECT COUNT(*) as count, COALESCE(SUM(total_revenue),0) as revenue, COALESCE(AVG(satisfaction_score),0) as avg_satisfaction FROM formation_sessions WHERE status = 'termine'").first() as any;
    const totalParticipants = await DB.prepare('SELECT COUNT(*) as count FROM formation_participants').first() as any;
    const byTheme = await DB.prepare('SELECT theme, COUNT(*) as count, COALESCE(SUM(total_revenue),0) as revenue FROM formation_sessions GROUP BY theme').all();
    const organismes = await DB.prepare("SELECT COUNT(*) as count FROM formation_organismes WHERE partnership_status = 'actif'").first() as any;
    const qualiopi = await DB.prepare("SELECT COUNT(*) as count FROM formation_organismes WHERE qualiopi_certified = 1").first() as any;
    
    return c.json({
      success: true,
      kpis: {
        total_sessions: total?.count || 0,
        total_revenue: total?.revenue || 0,
        diagpv_revenue: total?.diagpv_revenue || 0,
        active_sessions: active?.count || 0,
        completed_sessions: done?.count || 0,
        completed_revenue: done?.revenue || 0,
        avg_satisfaction: done?.avg_satisfaction || 0,
        total_participants: totalParticipants?.count || 0,
        active_organismes: organismes?.count || 0,
        qualiopi_organismes: qualiopi?.count || 0
      },
      by_theme: byTheme.results || []
    });
  } catch (error: any) {
    return c.json({ success: true, kpis: {}, by_theme: [] });
  }
});

export default formationRoutes;
