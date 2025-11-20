import { Hono } from 'hono'
import type { D1Database } from '@cloudflare/workers-types'
import { cache, cacheInvalidator } from '../../middleware/cache'

type Bindings = {
  DB: D1Database
  KV: KVNamespace
}

const labelsCentralesRoutes = new Hono<{ Bindings: Bindings }>()

// ============================================================================
// HELPER: CALCULER NIVEAU LABEL SELON CRITÈRES
// ============================================================================
function calculerNiveauLabel(taux_conformite: number, defauts_critiques: number, defauts_majeurs: number): string {
  if (taux_conformite >= 95 && defauts_critiques === 0) {
    return 'platine'
  } else if (taux_conformite >= 90) {
    return 'or'
  } else if (taux_conformite >= 80) {
    return 'argent'
  } else if (taux_conformite >= 70) {
    return 'bronze'
  } else {
    throw new Error('Taux de conformité insuffisant pour délivrer un label (<70%)')
  }
}

// ============================================================================
// STATS GLOBALES LABELS CENTRALES
// ============================================================================
labelsCentralesRoutes.get('/stats', cache({ ttl: 1800, namespace: 'labels:centrales:stats:' }), async (c) => {
  const { DB } = c.env

  try {
    const stats = await DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN statut = 'actif' THEN 1 ELSE 0 END) as actifs,
        SUM(CASE WHEN statut = 'expire' THEN 1 ELSE 0 END) as expires,
        
        SUM(CASE WHEN niveau = 'bronze' THEN 1 ELSE 0 END) as bronze,
        SUM(CASE WHEN niveau = 'argent' THEN 1 ELSE 0 END) as argent,
        SUM(CASE WHEN niveau = 'or' THEN 1 ELSE 0 END) as niveau_or,
        SUM(CASE WHEN niveau = 'platine' THEN 1 ELSE 0 END) as platine,
        
        AVG(taux_conformite) as taux_conformite_moyen,
        AVG(score_global) as score_global_moyen,
        SUM(puissance_installee_kwc) as puissance_totale_labellisee,
        
        SUM(CASE WHEN julianday(date_expiration) - julianday('now') <= 60 AND statut = 'actif' THEN 1 ELSE 0 END) as expire_60j
      FROM labels_centrales
    `).first()

    return c.json({ success: true, stats })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ============================================================================
// LISTE LABELS CENTRALES (avec filtres)
// ============================================================================
labelsCentralesRoutes.get('/', cache({ ttl: 600, namespace: 'labels:centrales:' }), async (c) => {
  const { DB } = c.env
  
  const statut = c.req.query('statut') || ''
  const niveau = c.req.query('niveau') || ''
  const search = c.req.query('search') || ''
  const public_only = c.req.query('public') === 'true'
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '20')
  const offset = (page - 1) * limit

  try {
    let whereClauses = []
    let params: any[] = []

    if (statut) {
      whereClauses.push('lc.statut = ?')
      params.push(statut)
    }

    if (niveau) {
      whereClauses.push('lc.niveau = ?')
      params.push(niveau)
    }

    if (public_only) {
      whereClauses.push('lc.public = 1')
    }

    if (search) {
      whereClauses.push('(p.name LIKE ? OR lc.numero_label LIKE ? OR c.name LIKE ?)')
      const searchPattern = `%${search}%`
      params.push(searchPattern, searchPattern, searchPattern)
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

    const { results } = await DB.prepare(`
      SELECT 
        lc.*,
        p.name as centrale_nom, p.address as centrale_adresse, p.city as centrale_ville,
        p.postal_code as centrale_cp, p.capacity_kwc,
        c.name as client_nom,
        julianday(lc.date_expiration) - julianday('now') as jours_avant_expiration
      FROM labels_centrales lc
      INNER JOIN projects p ON lc.project_id = p.id
      LEFT JOIN clients c ON p.client_id = c.id
      ${whereSQL}
      ORDER BY lc.niveau DESC, lc.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(...params, limit, offset).all()

    const { total } = await DB.prepare(`
      SELECT COUNT(*) as total
      FROM labels_centrales lc
      INNER JOIN projects p ON lc.project_id = p.id
      LEFT JOIN clients c ON p.client_id = c.id
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
// DÉTAIL LABEL CENTRALE
// ============================================================================
labelsCentralesRoutes.get('/:id', cache({ ttl: 600, namespace: 'labels:centrales:' }), async (c) => {
  const { DB } = c.env
  const id = parseInt(c.req.param('id'))

  try {
    const label = await DB.prepare(`
      SELECT 
        lc.*,
        p.name as centrale_nom, p.address as centrale_adresse, p.city as centrale_ville,
        p.postal_code as centrale_cp, p.capacity_kwc,
        c.name as client_nom, c.email as client_email,
        julianday(lc.date_expiration) - julianday('now') as jours_avant_expiration
      FROM labels_centrales lc
      INNER JOIN projects p ON lc.project_id = p.id
      LEFT JOIN clients c ON p.client_id = c.id
      WHERE lc.id = ?
    `).bind(id).first()

    if (!label) {
      return c.json({ success: false, error: 'Label non trouvé' }, 404)
    }

    // Historique
    const { results: historique } = await DB.prepare(`
      SELECT * FROM labels_historique
      WHERE type_label = 'centrale' AND label_id = ?
      ORDER BY created_at DESC
    `).bind(id).all()

    // Audits associés
    const audits = []
    if (label.audit_conformite_id) {
      const audit = await DB.prepare('SELECT * FROM audits WHERE id = ?').bind(label.audit_conformite_id).first()
      if (audit) audits.push({ type: 'CONFORMITE', ...audit })
    }
    if (label.audit_el_id) {
      const audit = await DB.prepare('SELECT * FROM audits WHERE id = ?').bind(label.audit_el_id).first()
      if (audit) audits.push({ type: 'EL', ...audit })
    }
    if (label.audit_iv_id) {
      const audit = await DB.prepare('SELECT * FROM audits WHERE id = ?').bind(label.audit_iv_id).first()
      if (audit) audits.push({ type: 'IV', ...audit })
    }

    return c.json({
      success: true,
      label,
      historique,
      audits
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ============================================================================
// VÉRIFICATION PUBLIQUE LABEL (sans auth)
// ============================================================================
labelsCentralesRoutes.get('/verify/:numero_label', async (c) => {
  const { DB } = c.env
  const numero_label = c.req.param('numero_label')

  try {
    const label = await DB.prepare(`
      SELECT 
        lc.numero_label, lc.niveau, lc.statut, lc.taux_conformite, lc.score_global,
        lc.date_delivrance, lc.date_expiration,
        p.name as centrale_nom, p.city as centrale_ville, p.capacity_kwc,
        c.name as client_nom
      FROM labels_centrales lc
      INNER JOIN projects p ON lc.project_id = p.id
      LEFT JOIN clients c ON p.client_id = c.id
      WHERE lc.numero_label = ? AND lc.public = 1
    `).bind(numero_label).first()

    if (!label) {
      return c.json({ success: false, error: 'Label non trouvé ou non public' }, 404)
    }

    return c.json({
      success: true,
      label,
      authentique: label.statut === 'actif'
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ============================================================================
// DÉLIVRER NOUVEAU LABEL CENTRALE
// ============================================================================
labelsCentralesRoutes.post('/', cacheInvalidator('labels:centrales:'), async (c) => {
  const { DB } = c.env
  const body = await c.req.json()

  const {
    project_id,
    taux_conformite,
    nombre_defauts_critiques,
    nombre_defauts_majeurs,
    nombre_defauts_mineurs,
    score_global,
    audit_conformite_id,
    audit_el_id,
    audit_iv_id,
    puissance_installee_kwc,
    diagnostiqueur_principal_id,
    delivre_par,
    public: isPublic
  } = body

  if (!project_id || taux_conformite === undefined || score_global === undefined) {
    return c.json({ success: false, error: 'Champs requis manquants' }, 400)
  }

  try {
    // Calculer niveau
    const niveau = calculerNiveauLabel(taux_conformite, nombre_defauts_critiques || 0, nombre_defauts_majeurs || 0)

    // Générer numéro
    const year = new Date().getFullYear()
    const { count } = await DB.prepare(`
      SELECT COUNT(*) as count FROM labels_centrales
      WHERE numero_label LIKE ?
    `).bind(`DIAGPV-PV-${year}-%`).first() as { count: number }

    const numero_label = `DIAGPV-PV-${year}-${String(count + 1).padStart(4, '0')}`

    // Dates
    const date_delivrance = new Date().toISOString().split('T')[0]
    const date_expiration = new Date()
    date_expiration.setFullYear(date_expiration.getFullYear() + 2)
    const date_expiration_str = date_expiration.toISOString().split('T')[0]

    // Compter audits
    let nombre_audits = 0
    if (audit_conformite_id) nombre_audits++
    if (audit_el_id) nombre_audits++
    if (audit_iv_id) nombre_audits++

    // URL vérification
    const url_verification = `https://diagnostic-hub.pages.dev/labels/verify/${numero_label}`

    // Insérer
    const result = await DB.prepare(`
      INSERT INTO labels_centrales (
        project_id, numero_label, niveau, taux_conformite, 
        nombre_defauts_critiques, nombre_defauts_majeurs, nombre_defauts_mineurs, score_global,
        audit_conformite_id, audit_el_id, audit_iv_id, nombre_audits_realises,
        puissance_installee_kwc, date_delivrance, date_expiration, 
        diagnostiqueur_principal_id, delivre_par, public, url_verification, statut
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'actif')
    `).bind(
      project_id, numero_label, niveau, taux_conformite,
      nombre_defauts_critiques || 0, nombre_defauts_majeurs || 0, nombre_defauts_mineurs || 0, score_global,
      audit_conformite_id, audit_el_id, audit_iv_id, nombre_audits,
      puissance_installee_kwc, date_delivrance, date_expiration_str,
      diagnostiqueur_principal_id, delivre_par, isPublic ? 1 : 0, url_verification
    ).run()

    // Historique
    await DB.prepare(`
      INSERT INTO labels_historique (type_label, label_id, action, nouveau_statut, nouveau_niveau, raison, effectue_par)
      VALUES ('centrale', ?, 'delivrance', 'actif', ?, 'Délivrance après audits DiagPV', ?)
    `).bind(result.meta.last_row_id, niveau, delivre_par).run()

    return c.json({
      success: true,
      label_id: result.meta.last_row_id,
      numero_label,
      niveau,
      url_verification,
      message: `Label ${numero_label} (${niveau}) délivré avec succès`
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ============================================================================
// RENOUVELER LABEL CENTRALE
// ============================================================================
labelsCentralesRoutes.post('/:id/renouveler', cacheInvalidator('labels:centrales:'), async (c) => {
  const { DB } = c.env
  const id = parseInt(c.req.param('id'))
  const body = await c.req.json()

  const {
    taux_conformite,
    nombre_defauts_critiques,
    nombre_defauts_majeurs,
    raison,
    effectue_par
  } = body

  try {
    const label = await DB.prepare('SELECT * FROM labels_centrales WHERE id = ?').bind(id).first()
    if (!label) {
      return c.json({ success: false, error: 'Label non trouvé' }, 404)
    }

    // Recalculer niveau si nouveaux critères fournis
    let nouveau_niveau = label.niveau
    if (taux_conformite !== undefined) {
      nouveau_niveau = calculerNiveauLabel(taux_conformite, nombre_defauts_critiques || 0, nombre_defauts_majeurs || 0)
    }

    // Nouvelle expiration
    const nouvelle_expiration = new Date()
    nouvelle_expiration.setFullYear(nouvelle_expiration.getFullYear() + 2)
    const nouvelle_expiration_str = nouvelle_expiration.toISOString().split('T')[0]

    // Update
    await DB.prepare(`
      UPDATE labels_centrales
      SET niveau = ?, taux_conformite = COALESCE(?, taux_conformite), 
          date_expiration = ?, statut = 'actif', updated_at = datetime('now')
      WHERE id = ?
    `).bind(nouveau_niveau, taux_conformite, nouvelle_expiration_str, id).run()

    // Historique
    await DB.prepare(`
      INSERT INTO labels_historique (
        type_label, label_id, action, ancien_statut, nouveau_statut,
        ancienne_expiration, nouvelle_expiration, ancien_niveau, nouveau_niveau, raison, effectue_par
      ) VALUES ('centrale', ?, 'renouvellement', ?, 'actif', ?, ?, ?, ?, ?, ?)
    `).bind(id, label.statut, label.date_expiration, nouvelle_expiration_str, label.niveau, nouveau_niveau, raison, effectue_par).run()

    return c.json({ success: true, message: 'Label renouvelé', nouveau_niveau })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ============================================================================
// RÉVOQUER LABEL CENTRALE
// ============================================================================
labelsCentralesRoutes.post('/:id/revoquer', cacheInvalidator('labels:centrales:'), async (c) => {
  const { DB } = c.env
  const id = parseInt(c.req.param('id'))
  const body = await c.req.json()

  const { raison, effectue_par } = body

  if (!raison) {
    return c.json({ success: false, error: 'Raison requise' }, 400)
  }

  try {
    const label = await DB.prepare('SELECT * FROM labels_centrales WHERE id = ?').bind(id).first()
    if (!label) {
      return c.json({ success: false, error: 'Label non trouvé' }, 404)
    }

    await DB.prepare(`
      UPDATE labels_centrales
      SET statut = 'revoque', raison_suspension = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(raison, id).run()

    // Historique
    await DB.prepare(`
      INSERT INTO labels_historique (type_label, label_id, action, ancien_statut, nouveau_statut, raison, effectue_par)
      VALUES ('centrale', ?, 'revocation', ?, 'revoque', ?, ?)
    `).bind(id, label.statut, raison, effectue_par).run()

    return c.json({ success: true, message: 'Label révoqué' })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

export default labelsCentralesRoutes
