/**
 * Module Acquisition/Cession Centrales PV - Routes API
 * Commissions 2-5% sur transactions, suivi complet du deal flow
 * Préfixe: /api/acquisitions
 * 
 * Endpoints:
 * GET    /deals              - Liste deals (filtres: phase, type, client)
 * POST   /deals              - Créer deal
 * GET    /deals/:id          - Détail deal
 * PUT    /deals/:id          - Modifier deal
 * PUT    /deals/:id/phase    - Changer phase
 * DELETE /deals/:id          - Supprimer
 * GET    /kpis               - KPIs acquisition/cession
 */

import { Hono } from 'hono';

type Bindings = { DB: D1Database; KV: KVNamespace; R2: R2Bucket };

const acquisitionRoutes = new Hono<{ Bindings: Bindings }>();

async function ensureAcquisitionTables(DB: D1Database): Promise<void> {
  try {
    await DB.prepare('SELECT 1 FROM acquisition_deals LIMIT 0').run();
  } catch {
    await DB.prepare(`CREATE TABLE IF NOT EXISTS acquisition_deals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reference TEXT UNIQUE,
      deal_type TEXT NOT NULL DEFAULT 'acquisition' CHECK(deal_type IN ('acquisition','cession','transfert')),
      -- Phases: sourcing → due_diligence → negociation → closing → post_closing → cloture
      phase TEXT NOT NULL DEFAULT 'sourcing' CHECK(phase IN ('sourcing','due_diligence','negociation','closing','post_closing','cloture','abandonne')),
      status TEXT DEFAULT 'en_cours' CHECK(status IN ('en_cours','en_attente','conclu','abandonne')),
      title TEXT NOT NULL,
      description TEXT,
      -- Vendeur
      seller_id INTEGER,
      seller_name TEXT,
      seller_contact TEXT,
      -- Acheteur
      buyer_id INTEGER,
      buyer_name TEXT,
      buyer_contact TEXT,
      -- Centrale
      plant_name TEXT,
      plant_location TEXT,
      plant_power_kwp REAL,
      plant_age_years INTEGER,
      plant_technology TEXT,
      tarif_rachat TEXT,
      production_annuelle_kwh REAL,
      -- Financier
      asking_price REAL DEFAULT 0,
      final_price REAL,
      commission_rate REAL DEFAULT 3.0,
      commission_amount REAL DEFAULT 0,
      -- Due Diligence
      dd_technical INTEGER DEFAULT 0,
      dd_legal INTEGER DEFAULT 0,
      dd_financial INTEGER DEFAULT 0,
      dd_environmental INTEGER DEFAULT 0,
      dd_notes TEXT,
      -- Planning
      estimated_closing_date DATE,
      actual_closing_date DATE,
      -- Suivi
      assigned_to TEXT DEFAULT 'Adrien PAPPALARDO',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (seller_id) REFERENCES crm_clients(id) ON DELETE SET NULL,
      FOREIGN KEY (buyer_id) REFERENCES crm_clients(id) ON DELETE SET NULL
    )`).run();

    try {
      await DB.prepare('CREATE INDEX IF NOT EXISTS idx_acq_phase ON acquisition_deals(phase)').run();
      await DB.prepare('CREATE INDEX IF NOT EXISTS idx_acq_type ON acquisition_deals(deal_type)').run();
    } catch {}
  }
}

// ============================================================================
// DEALS CRUD
// ============================================================================

acquisitionRoutes.get('/deals', async (c) => {
  try {
    const { DB } = c.env;
    await ensureAcquisitionTables(DB);
    const { phase, deal_type, status } = c.req.query();
    
    let query = `SELECT d.*, 
      s.company_name as seller_company, b.company_name as buyer_company
      FROM acquisition_deals d 
      LEFT JOIN crm_clients s ON d.seller_id = s.id
      LEFT JOIN crm_clients b ON d.buyer_id = b.id
      WHERE 1=1`;
    const params: any[] = [];
    
    if (phase) { query += ` AND d.phase = ?`; params.push(phase); }
    if (deal_type) { query += ` AND d.deal_type = ?`; params.push(deal_type); }
    if (status) { query += ` AND d.status = ?`; params.push(status); }
    
    query += ` ORDER BY d.updated_at DESC`;
    const result = await DB.prepare(query).bind(...params).all();
    return c.json({ success: true, deals: result.results || [] });
  } catch (error: any) {
    return c.json({ success: true, deals: [] });
  }
});

acquisitionRoutes.post('/deals', async (c) => {
  try {
    const { DB } = c.env;
    await ensureAcquisitionTables(DB);
    const body = await c.req.json();
    
    if (!body.title) return c.json({ error: 'title requis' }, 400);
    
    const ref = `ACQ-${Date.now().toString(36).toUpperCase()}`;
    const commissionAmount = (body.asking_price || 0) * ((body.commission_rate || 3) / 100);
    
    const result = await DB.prepare(`
      INSERT INTO acquisition_deals (reference, deal_type, title, description, seller_id, seller_name, seller_contact, buyer_id, buyer_name, buyer_contact, plant_name, plant_location, plant_power_kwp, plant_age_years, plant_technology, tarif_rachat, production_annuelle_kwh, asking_price, commission_rate, commission_amount, estimated_closing_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      ref, body.deal_type || 'acquisition', body.title, body.description || null,
      body.seller_id || null, body.seller_name || null, body.seller_contact || null,
      body.buyer_id || null, body.buyer_name || null, body.buyer_contact || null,
      body.plant_name || null, body.plant_location || null, body.plant_power_kwp || null,
      body.plant_age_years || null, body.plant_technology || null, body.tarif_rachat || null,
      body.production_annuelle_kwh || null, body.asking_price || 0,
      body.commission_rate || 3.0, commissionAmount, body.estimated_closing_date || null, body.notes || null
    ).run();
    
    return c.json({ success: true, id: result.meta.last_row_id, reference: ref, commission: commissionAmount }, 201);
  } catch (error: any) {
    return c.json({ error: 'Erreur création', details: error.message }, 500);
  }
});

acquisitionRoutes.get('/deals/:id', async (c) => {
  try {
    const { DB } = c.env;
    await ensureAcquisitionTables(DB);
    const id = c.req.param('id');
    
    const deal = await DB.prepare(`
      SELECT d.*, s.company_name as seller_company, b.company_name as buyer_company
      FROM acquisition_deals d
      LEFT JOIN crm_clients s ON d.seller_id = s.id
      LEFT JOIN crm_clients b ON d.buyer_id = b.id
      WHERE d.id = ?
    `).bind(id).first();
    
    if (!deal) return c.json({ error: 'Deal introuvable' }, 404);
    return c.json({ success: true, deal });
  } catch (error: any) {
    return c.json({ error: 'Erreur', details: error.message }, 500);
  }
});

acquisitionRoutes.put('/deals/:id', async (c) => {
  try {
    const { DB } = c.env;
    const id = c.req.param('id');
    const body = await c.req.json();
    
    const fields: string[] = [];
    const values: any[] = [];
    const allowed = ['title','description','deal_type','phase','status','seller_id','seller_name','seller_contact','buyer_id','buyer_name','buyer_contact','plant_name','plant_location','plant_power_kwp','plant_age_years','plant_technology','tarif_rachat','production_annuelle_kwh','asking_price','final_price','commission_rate','commission_amount','dd_technical','dd_legal','dd_financial','dd_environmental','dd_notes','estimated_closing_date','actual_closing_date','assigned_to','notes'];
    
    for (const key of allowed) {
      if (body[key] !== undefined) { fields.push(`${key} = ?`); values.push(body[key]); }
    }
    
    // Recalculer commission si prix ou taux modifié
    if (body.asking_price !== undefined || body.commission_rate !== undefined || body.final_price !== undefined) {
      const current = await DB.prepare('SELECT asking_price, final_price, commission_rate FROM acquisition_deals WHERE id = ?').bind(id).first() as any;
      const price = body.final_price ?? body.asking_price ?? current?.final_price ?? current?.asking_price ?? 0;
      const rate = body.commission_rate ?? current?.commission_rate ?? 3;
      fields.push('commission_amount = ?');
      values.push(price * (rate / 100));
    }
    
    if (fields.length === 0) return c.json({ error: 'Aucun champ' }, 400);
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    await DB.prepare(`UPDATE acquisition_deals SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
    return c.json({ success: true, message: 'Deal mis à jour' });
  } catch (error: any) {
    return c.json({ error: 'Erreur', details: error.message }, 500);
  }
});

acquisitionRoutes.put('/deals/:id/phase', async (c) => {
  try {
    const { DB } = c.env;
    const id = c.req.param('id');
    const { phase } = await c.req.json();
    
    const valid = ['sourcing','due_diligence','negociation','closing','post_closing','cloture','abandonne'];
    if (!phase || !valid.includes(phase)) return c.json({ error: `Phase invalide: ${valid.join(', ')}` }, 400);
    
    const updates = ['phase = ?', 'updated_at = CURRENT_TIMESTAMP'];
    const params: any[] = [phase];
    
    if (phase === 'cloture') { updates.push("status = 'conclu'"); }
    if (phase === 'abandonne') { updates.push("status = 'abandonne'"); }
    
    params.push(id);
    await DB.prepare(`UPDATE acquisition_deals SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();
    return c.json({ success: true, message: `Phase: ${phase}` });
  } catch (error: any) {
    return c.json({ error: 'Erreur', details: error.message }, 500);
  }
});

acquisitionRoutes.delete('/deals/:id', async (c) => {
  try {
    const { DB } = c.env;
    await DB.prepare('DELETE FROM acquisition_deals WHERE id = ?').bind(c.req.param('id')).run();
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: 'Erreur', details: error.message }, 500);
  }
});

// ============================================================================
// KPIs
// ============================================================================

acquisitionRoutes.get('/kpis', async (c) => {
  try {
    const { DB } = c.env;
    await ensureAcquisitionTables(DB);
    
    const total = await DB.prepare('SELECT COUNT(*) as count, COALESCE(SUM(asking_price),0) as volume, COALESCE(SUM(commission_amount),0) as commissions FROM acquisition_deals').first() as any;
    const active = await DB.prepare("SELECT COUNT(*) as count, COALESCE(SUM(asking_price),0) as volume, COALESCE(SUM(commission_amount),0) as commissions FROM acquisition_deals WHERE status = 'en_cours'").first() as any;
    const conclu = await DB.prepare("SELECT COUNT(*) as count, COALESCE(SUM(COALESCE(final_price,asking_price)),0) as volume, COALESCE(SUM(commission_amount),0) as commissions FROM acquisition_deals WHERE status = 'conclu'").first() as any;
    const byPhase = await DB.prepare('SELECT phase, deal_type, COUNT(*) as count, COALESCE(SUM(asking_price),0) as volume FROM acquisition_deals GROUP BY phase, deal_type').all();
    
    return c.json({
      success: true,
      kpis: {
        total_deals: total?.count || 0,
        total_volume: total?.volume || 0,
        total_commissions: total?.commissions || 0,
        active_count: active?.count || 0,
        active_volume: active?.volume || 0,
        active_commissions: active?.commissions || 0,
        closed_count: conclu?.count || 0,
        closed_volume: conclu?.volume || 0,
        closed_commissions: conclu?.commissions || 0
      },
      by_phase: byPhase.results || []
    });
  } catch (error: any) {
    return c.json({ success: true, kpis: {}, by_phase: [] });
  }
});

export default acquisitionRoutes;
