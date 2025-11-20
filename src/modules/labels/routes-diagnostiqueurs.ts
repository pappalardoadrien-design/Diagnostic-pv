import { Hono } from 'hono'
import type { D1Database } from '@cloudflare/workers-types'
import { cache, cacheInvalidator } from '../../middleware/cache'

type Bindings = {
  DB: D1Database
  KV: KVNamespace
}

const labelsDiagnostiqueursRoutes = new Hono<{ Bindings: Bindings }>()

// ============================================================================
// STATS GLOBALES LABELS DIAGNOSTIQUEURS
// ============================================================================
labelsDiagnostiqueursRoutes.get('/stats', cache({ ttl: 1800, namespace: 'labels:diag:stats:' }), async (c) => {
  const { DB } = c.env

  try {
    const stats = await DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN statut = 'actif' THEN 1 ELSE 0 END) as actifs,
        SUM(CASE WHEN statut = 'suspendu' THEN 1 ELSE 0 END) as suspendus,
        SUM(CASE WHEN statut = 'expire' THEN 1 ELSE 0 END) as expires,
        SUM(CASE WHEN statut = 'revoque' THEN 1 ELSE 0 END) as revoques,
        
        SUM(CASE WHEN niveau = 'junior' THEN 1 ELSE 0 END) as junior,
        SUM(CASE WHEN niveau = 'confirme' THEN 1 ELSE 0 END) as confirme,
        SUM(CASE WHEN niveau = 'expert' THEN 1 ELSE 0 END) as expert,
        SUM(CASE WHEN niveau = 'formateur' THEN 1 ELSE 0 END) as formateur,
        
        SUM(CASE WHEN julianday(date_expiration) - julianday('now') <= 30 AND statut = 'actif' THEN 1 ELSE 0 END) as expire_30j,
        AVG(note_evaluation_globale) as note_moyenne
      FROM labels_diagnostiqueurs
    `).first()

    return c.json({ success: true, stats })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ============================================================================
// LISTE LABELS DIAGNOSTIQUEURS (avec filtres et pagination)
// ============================================================================
labelsDiagnostiqueursRoutes.get('/', cache({ ttl: 600, namespace: 'labels:diag:' }), async (c) => {
  const { DB } = c.env
  
  // Query params
  const statut = c.req.query('statut') || ''
  const niveau = c.req.query('niveau') || ''
  const search = c.req.query('search') || ''
  const expire_bientot = c.req.query('expire_bientot') === 'true'
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '20')
  const offset = (page - 1) * limit

  try {
    let whereClauses = []
    let params: any[] = []

    if (statut) {
      whereClauses.push('ld.statut = ?')
      params.push(statut)
    }

    if (niveau) {
      whereClauses.push('ld.niveau = ?')
      params.push(niveau)
    }

    if (search) {
      whereClauses.push('(d.nom LIKE ? OR d.prenom LIKE ? OR d.email LIKE ? OR ld.numero_label LIKE ?)')
      const searchPattern = `%${search}%`
      params.push(searchPattern, searchPattern, searchPattern, searchPattern)
    }

    if (expire_bientot) {
      whereClauses.push("julianday(ld.date_expiration) - julianday('now') <= 30 AND ld.statut = 'actif'")
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

    const { results } = await DB.prepare(`
      SELECT 
        ld.*,
        d.nom, d.prenom, d.email, d.telephone, d.specialites, 
        d.zones_intervention, d.nombre_audits_realises, d.note_moyenne,
        julianday(ld.date_expiration) - julianday('now') as jours_avant_expiration
      FROM labels_diagnostiqueurs ld
      INNER JOIN diagnostiqueurs d ON ld.diagnostiqueur_id = d.id
      ${whereSQL}
      ORDER BY ld.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(...params, limit, offset).all()

    const { total } = await DB.prepare(`
      SELECT COUNT(*) as total
      FROM labels_diagnostiqueurs ld
      INNER JOIN diagnostiqueurs d ON ld.diagnostiqueur_id = d.id
      ${whereSQL}
    `).bind(...params).first() as { total: number }

    return c.json({
      success: true,
      labels: results,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ============================================================================
// DÉTAIL LABEL DIAGNOSTIQUEUR
// ============================================================================
labelsDiagnostiqueursRoutes.get('/:id', cache({ ttl: 600, namespace: 'labels:diag:' }), async (c) => {
  const { DB } = c.env
  const id = parseInt(c.req.param('id'))

  try {
    const label = await DB.prepare(`
      SELECT 
        ld.*,
        d.nom, d.prenom, d.email, d.telephone, d.specialites, 
        d.zones_intervention, d.nombre_audits_realises, d.note_moyenne,
        julianday(ld.date_expiration) - julianday('now') as jours_avant_expiration
      FROM labels_diagnostiqueurs ld
      INNER JOIN diagnostiqueurs d ON ld.diagnostiqueur_id = d.id
      WHERE ld.id = ?
    `).bind(id).first()

    if (!label) {
      return c.json({ success: false, error: 'Label non trouvé' }, 404)
    }

    // Historique
    const { results: historique } = await DB.prepare(`
      SELECT * FROM labels_historique
      WHERE type_label = 'diagnostiqueur' AND label_id = ?
      ORDER BY created_at DESC
    `).bind(id).all()

    // Formations continues
    const { results: formations } = await DB.prepare(`
      SELECT * FROM labels_formations_continues
      WHERE label_diagnostiqueur_id = ?
      ORDER BY date_formation DESC
    `).bind(id).all()

    return c.json({
      success: true,
      label,
      historique,
      formations
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ============================================================================
// DÉLIVRER NOUVEAU LABEL DIAGNOSTIQUEUR
// ============================================================================
labelsDiagnostiqueursRoutes.post('/', cacheInvalidator('labels:diag:'), async (c) => {
  const { DB } = c.env
  const body = await c.req.json()

  const {
    diagnostiqueur_id,
    niveau,
    specialites_certifiees,
    afpa_formation_completee,
    afpa_date_formation,
    afpa_certificat_numero,
    evaluation_theorique_score,
    evaluation_pratique_score,
    evaluation_terrain_score,
    delivre_par
  } = body

  if (!diagnostiqueur_id || !niveau || !specialites_certifiees) {
    return c.json({ success: false, error: 'Champs requis manquants' }, 400)
  }

  try {
    // Générer numéro de label
    const year = new Date().getFullYear()
    const { count } = await DB.prepare(`
      SELECT COUNT(*) as count FROM labels_diagnostiqueurs
      WHERE numero_label LIKE ?
    `).bind(`DIAGPV-DIAG-${year}-%`).first() as { count: number }

    const numero_label = `DIAGPV-DIAG-${year}-${String(count + 1).padStart(4, '0')}`

    // Calculer note globale
    const note_evaluation_globale = (
      (evaluation_theorique_score || 0) + 
      (evaluation_pratique_score || 0) + 
      (evaluation_terrain_score || 0)
    ) / 3

    // Dates
    const date_delivrance = new Date().toISOString().split('T')[0]
    const date_expiration = new Date()
    date_expiration.setFullYear(date_expiration.getFullYear() + 2)
    const date_expiration_str = date_expiration.toISOString().split('T')[0]

    // Insérer
    const result = await DB.prepare(`
      INSERT INTO labels_diagnostiqueurs (
        diagnostiqueur_id, numero_label, niveau, specialites_certifiees,
        afpa_formation_completee, afpa_date_formation, afpa_certificat_numero,
        evaluation_theorique_score, evaluation_pratique_score, evaluation_terrain_score,
        note_evaluation_globale, date_delivrance, date_expiration, delivre_par, statut
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'actif')
    `).bind(
      diagnostiqueur_id, numero_label, niveau, JSON.stringify(specialites_certifiees),
      afpa_formation_completee ? 1 : 0, afpa_date_formation, afpa_certificat_numero,
      evaluation_theorique_score, evaluation_pratique_score, evaluation_terrain_score,
      note_evaluation_globale, date_delivrance, date_expiration_str, delivre_par
    ).run()

    // Historique
    await DB.prepare(`
      INSERT INTO labels_historique (type_label, label_id, action, nouveau_statut, nouveau_niveau, raison, effectue_par)
      VALUES ('diagnostiqueur', ?, 'delivrance', 'actif', ?, 'Délivrance initiale après formation AFPA et évaluation DiagPV', ?)
    `).bind(result.meta.last_row_id, niveau, delivre_par).run()

    // Mettre à jour diagnostiqueur
    await DB.prepare(`
      UPDATE diagnostiqueurs
      SET statut_label = 'labellise', date_labellisation = ?, numero_label = ?
      WHERE id = ?
    `).bind(date_delivrance, numero_label, diagnostiqueur_id).run()

    return c.json({
      success: true,
      label_id: result.meta.last_row_id,
      numero_label,
      message: `Label ${numero_label} délivré avec succès`
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ============================================================================
// RENOUVELER LABEL DIAGNOSTIQUEUR
// ============================================================================
labelsDiagnostiqueursRoutes.post('/:id/renouveler', cacheInvalidator('labels:diag:'), async (c) => {
  const { DB } = c.env
  const id = parseInt(c.req.param('id'))
  const body = await c.req.json()

  const {
    nouveau_niveau,
    nouvelle_duree_annees,
    raison,
    effectue_par
  } = body

  try {
    const label = await DB.prepare('SELECT * FROM labels_diagnostiqueurs WHERE id = ?').bind(id).first()
    if (!label) {
      return c.json({ success: false, error: 'Label non trouvé' }, 404)
    }

    // Nouvelle expiration
    const nouvelle_expiration = new Date()
    nouvelle_expiration.setFullYear(nouvelle_expiration.getFullYear() + (nouvelle_duree_annees || 2))
    const nouvelle_expiration_str = nouvelle_expiration.toISOString().split('T')[0]

    // Update
    await DB.prepare(`
      UPDATE labels_diagnostiqueurs
      SET niveau = ?, date_expiration = ?, statut = 'actif', updated_at = datetime('now')
      WHERE id = ?
    `).bind(nouveau_niveau || label.niveau, nouvelle_expiration_str, id).run()

    // Historique
    await DB.prepare(`
      INSERT INTO labels_historique (
        type_label, label_id, action, ancien_statut, nouveau_statut,
        ancienne_expiration, nouvelle_expiration, ancien_niveau, nouveau_niveau, raison, effectue_par
      ) VALUES ('diagnostiqueur', ?, 'renouvellement', ?, 'actif', ?, ?, ?, ?, ?, ?)
    `).bind(id, label.statut, label.date_expiration, nouvelle_expiration_str, label.niveau, nouveau_niveau || label.niveau, raison, effectue_par).run()

    return c.json({ success: true, message: 'Label renouvelé avec succès' })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ============================================================================
// SUSPENDRE LABEL DIAGNOSTIQUEUR
// ============================================================================
labelsDiagnostiqueursRoutes.post('/:id/suspendre', cacheInvalidator('labels:diag:'), async (c) => {
  const { DB } = c.env
  const id = parseInt(c.req.param('id'))
  const body = await c.req.json()

  const { raison, effectue_par } = body

  if (!raison) {
    return c.json({ success: false, error: 'Raison requise' }, 400)
  }

  try {
    const label = await DB.prepare('SELECT * FROM labels_diagnostiqueurs WHERE id = ?').bind(id).first()
    if (!label) {
      return c.json({ success: false, error: 'Label non trouvé' }, 404)
    }

    await DB.prepare(`
      UPDATE labels_diagnostiqueurs
      SET statut = 'suspendu', raison_suspension = ?, date_suspension = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `).bind(raison, id).run()

    // Historique
    await DB.prepare(`
      INSERT INTO labels_historique (type_label, label_id, action, ancien_statut, nouveau_statut, raison, effectue_par)
      VALUES ('diagnostiqueur', ?, 'suspension', ?, 'suspendu', ?, ?)
    `).bind(id, label.statut, raison, effectue_par).run()

    return c.json({ success: true, message: 'Label suspendu' })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ============================================================================
// RÉVOQUER LABEL DIAGNOSTIQUEUR
// ============================================================================
labelsDiagnostiqueursRoutes.post('/:id/revoquer', cacheInvalidator('labels:diag:'), async (c) => {
  const { DB } = c.env
  const id = parseInt(c.req.param('id'))
  const body = await c.req.json()

  const { raison, effectue_par } = body

  if (!raison) {
    return c.json({ success: false, error: 'Raison requise' }, 400)
  }

  try {
    const label = await DB.prepare('SELECT * FROM labels_diagnostiqueurs WHERE id = ?').bind(id).first()
    if (!label) {
      return c.json({ success: false, error: 'Label non trouvé' }, 404)
    }

    await DB.prepare(`
      UPDATE labels_diagnostiqueurs
      SET statut = 'revoque', raison_suspension = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(raison, id).run()

    // Historique
    await DB.prepare(`
      INSERT INTO labels_historique (type_label, label_id, action, ancien_statut, nouveau_statut, raison, effectue_par)
      VALUES ('diagnostiqueur', ?, 'revocation', ?, 'revoque', ?, ?)
    `).bind(id, label.statut, raison, effectue_par).run()

    // Mettre à jour diagnostiqueur
    await DB.prepare(`
      UPDATE diagnostiqueurs
      SET statut_label = 'revoque'
      WHERE numero_label = ?
    `).bind(label.numero_label).run()

    return c.json({ success: true, message: 'Label révoqué' })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

export default labelsDiagnostiqueursRoutes
