/**
 * Module Repowering - Routes API
 * Gestion des missions de repowering PV (20-50k€/mission)
 * Préfixe: /api/repowering
 * 
 * Endpoints:
 * GET    /missions           - Liste missions repowering
 * POST   /missions           - Créer mission
 * GET    /missions/:id       - Détail mission
 * PUT    /missions/:id       - Modifier mission
 * PUT    /missions/:id/phase - Changer phase
 * DELETE /missions/:id       - Supprimer
 * GET    /kpis               - KPIs repowering
 * POST   /missions/:id/devis - Générer devis
 */

import { Hono } from 'hono';

type Bindings = { DB: D1Database; KV: KVNamespace; R2: R2Bucket };

const repoweringRoutes = new Hono<{ Bindings: Bindings }>();

async function ensureRepoweringTables(DB: D1Database): Promise<void> {
  try {
    await DB.prepare('SELECT 1 FROM repowering_missions LIMIT 0').run();
  } catch {
    await DB.prepare(`CREATE TABLE IF NOT EXISTS repowering_missions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reference TEXT UNIQUE,
      client_id INTEGER,
      plant_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      -- Phases: diagnostic → etude → devis → validation → travaux → reception → cloture
      phase TEXT NOT NULL DEFAULT 'diagnostic' CHECK(phase IN ('diagnostic','etude','devis','validation','travaux','reception','cloture')),
      status TEXT DEFAULT 'en_cours' CHECK(status IN ('en_cours','en_attente','termine','annule')),
      -- Centrale existante
      plant_name TEXT,
      plant_location TEXT,
      plant_power_kwp REAL,
      plant_age_years INTEGER,
      module_type TEXT,
      module_count INTEGER,
      inverter_type TEXT,
      -- Diagnostic
      degradation_rate REAL,
      estimated_gain_kwh REAL,
      estimated_gain_percent REAL,
      defects_identified TEXT,
      -- Financier
      estimated_cost REAL DEFAULT 0,
      devis_amount REAL,
      devis_date DATE,
      devis_status TEXT DEFAULT 'brouillon' CHECK(devis_status IN ('brouillon','envoye','accepte','refuse')),
      roi_years REAL,
      -- Travaux
      scope_of_work TEXT,
      materials_list TEXT,
      planned_start_date DATE,
      planned_end_date DATE,
      actual_start_date DATE,
      actual_end_date DATE,
      -- Suivi
      assigned_to TEXT DEFAULT 'Adrien PAPPALARDO',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES crm_clients(id) ON DELETE SET NULL
    )`).run();

    await DB.prepare(`CREATE TABLE IF NOT EXISTS repowering_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mission_id INTEGER NOT NULL,
      category TEXT NOT NULL DEFAULT 'module' CHECK(category IN ('module','onduleur','cablage','structure','monitoring','autre')),
      description TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      unit_price REAL DEFAULT 0,
      total_price REAL DEFAULT 0,
      supplier TEXT,
      reference TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (mission_id) REFERENCES repowering_missions(id) ON DELETE CASCADE
    )`).run();

    try {
      await DB.prepare('CREATE INDEX IF NOT EXISTS idx_rep_client ON repowering_missions(client_id)').run();
      await DB.prepare('CREATE INDEX IF NOT EXISTS idx_rep_phase ON repowering_missions(phase)').run();
    } catch {}
  }
}

// ============================================================================
// MISSIONS CRUD
// ============================================================================

repoweringRoutes.get('/missions', async (c) => {
  try {
    const { DB } = c.env;
    await ensureRepoweringTables(DB);
    const { phase, status, client_id } = c.req.query();
    
    let query = `SELECT m.*, c.company_name as client_name FROM repowering_missions m LEFT JOIN crm_clients c ON m.client_id = c.id WHERE 1=1`;
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

repoweringRoutes.post('/missions', async (c) => {
  try {
    const { DB } = c.env;
    await ensureRepoweringTables(DB);
    const body = await c.req.json();
    
    if (!body.title) return c.json({ error: 'title requis' }, 400);
    
    const ref = `REP-${Date.now().toString(36).toUpperCase()}`;
    
    const result = await DB.prepare(`
      INSERT INTO repowering_missions (reference, client_id, plant_id, title, description, plant_name, plant_location, plant_power_kwp, plant_age_years, module_type, module_count, inverter_type, estimated_cost, scope_of_work, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      ref, body.client_id || null, body.plant_id || null, body.title, body.description || null,
      body.plant_name || null, body.plant_location || null, body.plant_power_kwp || null,
      body.plant_age_years || null, body.module_type || null, body.module_count || null,
      body.inverter_type || null, body.estimated_cost || 0, body.scope_of_work || null, body.notes || null
    ).run();
    
    return c.json({ success: true, id: result.meta.last_row_id, reference: ref }, 201);
  } catch (error: any) {
    return c.json({ error: 'Erreur création', details: error.message }, 500);
  }
});

repoweringRoutes.get('/missions/:id', async (c) => {
  try {
    const { DB } = c.env;
    await ensureRepoweringTables(DB);
    const id = c.req.param('id');
    
    const mission = await DB.prepare(`
      SELECT m.*, c.company_name as client_name, c.main_contact_name, c.main_contact_email
      FROM repowering_missions m LEFT JOIN crm_clients c ON m.client_id = c.id WHERE m.id = ?
    `).bind(id).first();
    
    if (!mission) return c.json({ error: 'Mission introuvable' }, 404);
    
    const items = await DB.prepare('SELECT * FROM repowering_items WHERE mission_id = ? ORDER BY category, id').bind(id).all();
    
    return c.json({ success: true, mission, items: items.results || [] });
  } catch (error: any) {
    return c.json({ error: 'Erreur', details: error.message }, 500);
  }
});

repoweringRoutes.put('/missions/:id', async (c) => {
  try {
    const { DB } = c.env;
    const id = c.req.param('id');
    const body = await c.req.json();
    
    const fields: string[] = [];
    const values: any[] = [];
    const allowed = ['title','description','phase','status','plant_name','plant_location','plant_power_kwp','plant_age_years','module_type','module_count','inverter_type','degradation_rate','estimated_gain_kwh','estimated_gain_percent','defects_identified','estimated_cost','devis_amount','devis_date','devis_status','roi_years','scope_of_work','materials_list','planned_start_date','planned_end_date','actual_start_date','actual_end_date','assigned_to','notes','client_id'];
    
    for (const key of allowed) {
      if (body[key] !== undefined) { fields.push(`${key} = ?`); values.push(body[key]); }
    }
    if (fields.length === 0) return c.json({ error: 'Aucun champ' }, 400);
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    await DB.prepare(`UPDATE repowering_missions SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
    return c.json({ success: true, message: 'Mission mise à jour' });
  } catch (error: any) {
    return c.json({ error: 'Erreur', details: error.message }, 500);
  }
});

repoweringRoutes.put('/missions/:id/phase', async (c) => {
  try {
    const { DB } = c.env;
    const id = c.req.param('id');
    const { phase } = await c.req.json();
    
    const valid = ['diagnostic','etude','devis','validation','travaux','reception','cloture'];
    if (!phase || !valid.includes(phase)) return c.json({ error: `Phase invalide: ${valid.join(', ')}` }, 400);
    
    await DB.prepare('UPDATE repowering_missions SET phase = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(phase, id).run();
    return c.json({ success: true, message: `Phase: ${phase}` });
  } catch (error: any) {
    return c.json({ error: 'Erreur', details: error.message }, 500);
  }
});

repoweringRoutes.delete('/missions/:id', async (c) => {
  try {
    const { DB } = c.env;
    const id = c.req.param('id');
    await DB.prepare('DELETE FROM repowering_items WHERE mission_id = ?').bind(id).run();
    await DB.prepare('DELETE FROM repowering_missions WHERE id = ?').bind(id).run();
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: 'Erreur', details: error.message }, 500);
  }
});

// ============================================================================
// DEVIS / ITEMS
// ============================================================================

repoweringRoutes.post('/missions/:id/items', async (c) => {
  try {
    const { DB } = c.env;
    await ensureRepoweringTables(DB);
    const missionId = c.req.param('id');
    const body = await c.req.json();
    
    if (!body.description) return c.json({ error: 'description requis' }, 400);
    
    const totalPrice = (body.quantity || 1) * (body.unit_price || 0);
    
    const result = await DB.prepare(`
      INSERT INTO repowering_items (mission_id, category, description, quantity, unit_price, total_price, supplier, reference, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(missionId, body.category || 'autre', body.description, body.quantity || 1, body.unit_price || 0, totalPrice, body.supplier || null, body.reference || null, body.notes || null).run();
    
    // Recalculer montant total devis
    const total = await DB.prepare('SELECT COALESCE(SUM(total_price),0) as total FROM repowering_items WHERE mission_id = ?').bind(missionId).first() as any;
    await DB.prepare('UPDATE repowering_missions SET devis_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(total?.total || 0, missionId).run();
    
    return c.json({ success: true, id: result.meta.last_row_id, devis_total: total?.total || 0 }, 201);
  } catch (error: any) {
    return c.json({ error: 'Erreur', details: error.message }, 500);
  }
});

repoweringRoutes.delete('/items/:id', async (c) => {
  try {
    const { DB } = c.env;
    const id = c.req.param('id');
    const item = await DB.prepare('SELECT mission_id FROM repowering_items WHERE id = ?').bind(id).first() as any;
    await DB.prepare('DELETE FROM repowering_items WHERE id = ?').bind(id).run();
    
    if (item?.mission_id) {
      const total = await DB.prepare('SELECT COALESCE(SUM(total_price),0) as total FROM repowering_items WHERE mission_id = ?').bind(item.mission_id).first() as any;
      await DB.prepare('UPDATE repowering_missions SET devis_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(total?.total || 0, item.mission_id).run();
    }
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: 'Erreur', details: error.message }, 500);
  }
});

// ============================================================================
// KPIs
// ============================================================================

repoweringRoutes.get('/kpis', async (c) => {
  try {
    const { DB } = c.env;
    await ensureRepoweringTables(DB);
    
    const total = await DB.prepare('SELECT COUNT(*) as count, COALESCE(SUM(devis_amount),0) as ca FROM repowering_missions').first() as any;
    const byPhase = await DB.prepare('SELECT phase, COUNT(*) as count, COALESCE(SUM(devis_amount),0) as ca FROM repowering_missions GROUP BY phase').all();
    const active = await DB.prepare("SELECT COUNT(*) as count, COALESCE(SUM(devis_amount),0) as ca FROM repowering_missions WHERE status = 'en_cours'").first() as any;
    const termine = await DB.prepare("SELECT COUNT(*) as count, COALESCE(SUM(devis_amount),0) as ca FROM repowering_missions WHERE status = 'termine'").first() as any;
    
    return c.json({
      success: true,
      kpis: {
        total_missions: total?.count || 0,
        total_ca: total?.ca || 0,
        active_count: active?.count || 0,
        active_ca: active?.ca || 0,
        completed_count: termine?.count || 0,
        completed_ca: termine?.ca || 0
      },
      by_phase: byPhase.results || []
    });
  } catch (error: any) {
    return c.json({ success: true, kpis: {}, by_phase: [] });
  }
});

export default repoweringRoutes;
