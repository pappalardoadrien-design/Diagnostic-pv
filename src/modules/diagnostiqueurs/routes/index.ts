import { Hono } from 'hono'
import { cache, cacheInvalidator } from '../../../middleware/cache'

type Bindings = {
  DB: D1Database
  KV: KVNamespace
}

const diagnostiqueursRoutes = new Hono<{ Bindings: Bindings }>()

// ============================================================================
// LISTE DIAGNOSTIQUEURS (FILTRES + PAGINATION)
// ============================================================================
// GET /api/diagnostiqueurs?statut=labellise&zone=31&page=1&limit=20
diagnostiqueursRoutes.get('/',
  cache({ ttl: 1800, namespace: 'diagnostiqueurs:' }),
  async (c) => {
    try {
      const { DB } = c.env
      const statut = c.req.query('statut') // candidat, en_evaluation, labellise, suspendu, refuse
      const zone = c.req.query('zone') // code postal
      const disponible = c.req.query('disponible') // true/false
      const search = c.req.query('search') // nom/prenom/email
      const page = parseInt(c.req.query('page') || '1')
      const limit = parseInt(c.req.query('limit') || '20')
      const offset = (page - 1) * limit

      let whereClause = 'WHERE 1=1'
      const params: any[] = []

      if (statut) {
        whereClause += ' AND statut_label = ?'
        params.push(statut)
      }

      if (zone) {
        whereClause += ' AND (zones_intervention LIKE ? OR code_postal LIKE ?)'
        params.push(`%${zone}%`, `${zone}%`)
      }

      if (disponible !== undefined) {
        whereClause += ' AND disponible = ?'
        params.push(disponible === 'true' ? 1 : 0)
      }

      if (search) {
        whereClause += ' AND (nom LIKE ? OR prenom LIKE ? OR email LIKE ?)'
        const searchPattern = `%${search}%`
        params.push(searchPattern, searchPattern, searchPattern)
      }

      // Count total
      const { results: countResult } = await DB.prepare(`
        SELECT COUNT(*) as total FROM diagnostiqueurs ${whereClause}
      `).bind(...params).all()
      const total = (countResult?.[0] as any)?.total || 0

      // Get paginated results
      const { results } = await DB.prepare(`
        SELECT 
          id, nom, prenom, email, telephone,
          entreprise, siret, ville, code_postal,
          statut_label, date_labellisation, numero_label,
          annees_experience, nombre_audits_realises,
          note_moyenne, taux_conformite_moyen, delai_moyen_rapport,
          zones_intervention, disponible, capacite_audits_mois,
          created_at, updated_at
        FROM diagnostiqueurs
        ${whereClause}
        ORDER BY 
          CASE statut_label
            WHEN 'labellise' THEN 1
            WHEN 'en_evaluation' THEN 2
            WHEN 'candidat' THEN 3
            WHEN 'suspendu' THEN 4
            WHEN 'refuse' THEN 5
          END,
          note_moyenne DESC,
          created_at DESC
        LIMIT ? OFFSET ?
      `).bind(...params, limit, offset).all()

      return c.json({
        success: true,
        diagnostiqueurs: results || [],
        pagination: {
          page,
          limit,
          total,
          total_pages: Math.ceil(total / limit)
        }
      })

    } catch (error: any) {
      console.error('Error fetching diagnostiqueurs:', error)
      return c.json({ error: error.message }, 500)
    }
  })

// ============================================================================
// DÉTAILS DIAGNOSTIQUEUR
// ============================================================================
// GET /api/diagnostiqueurs/:id
diagnostiqueursRoutes.get('/:id',
  cache({ ttl: 900, namespace: 'diagnostiqueurs:detail:' }),
  async (c) => {
    try {
      const { DB } = c.env
      const id = c.req.param('id')

      const { results } = await DB.prepare(`
        SELECT * FROM diagnostiqueurs WHERE id = ?
      `).bind(id).all()

      if (!results || results.length === 0) {
        return c.json({ error: 'Diagnostiqueur introuvable' }, 404)
      }

      const diagnostiqueur = results[0]

      // Get missions history
      const { results: missions } = await DB.prepare(`
        SELECT 
          i.id,
          i.audit_date,
          i.status,
          p.name as project_name,
          p.site_address
        FROM interventions i
        LEFT JOIN projects p ON i.project_id = p.id
        WHERE i.technician_id = ?
        ORDER BY i.audit_date DESC
        LIMIT 10
      `).bind(id).all()

      return c.json({
        success: true,
        diagnostiqueur,
        missions: missions || []
      })

    } catch (error: any) {
      console.error('Error fetching diagnostiqueur detail:', error)
      return c.json({ error: error.message }, 500)
    }
  })

// ============================================================================
// CRÉER DIAGNOSTIQUEUR (CANDIDATURE)
// ============================================================================
// POST /api/diagnostiqueurs
diagnostiqueursRoutes.post('/',
  cacheInvalidator('diagnostiqueurs:'),
  async (c) => {
    try {
      const { DB } = c.env
      const data = await c.req.json()

      const {
        nom, prenom, email, telephone,
        entreprise, siret, adresse, code_postal, ville,
        certifications, formations,
        annees_experience, specialites, zones_intervention,
        capacite_audits_mois, notes_internes
      } = data

      if (!nom || !prenom || !email) {
        return c.json({ error: 'Champs requis: nom, prenom, email' }, 400)
      }

      const result = await DB.prepare(`
        INSERT INTO diagnostiqueurs (
          nom, prenom, email, telephone,
          entreprise, siret, adresse, code_postal, ville,
          statut_label, date_candidature,
          certifications, formations,
          annees_experience, specialites, zones_intervention,
          capacite_audits_mois, notes_internes,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'candidat', datetime('now'), ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        nom, prenom, email, telephone,
        entreprise, siret, adresse, code_postal, ville,
        certifications, formations,
        annees_experience || 0, specialites, zones_intervention,
        capacite_audits_mois || 0, notes_internes
      ).run()

      return c.json({
        success: true,
        id: result.meta.last_row_id,
        message: 'Candidature enregistrée avec succès'
      }, 201)

    } catch (error: any) {
      console.error('Error creating diagnostiqueur:', error)
      return c.json({ error: error.message }, 500)
    }
  })

// ============================================================================
// METTRE À JOUR DIAGNOSTIQUEUR
// ============================================================================
// PUT /api/diagnostiqueurs/:id
diagnostiqueursRoutes.put('/:id',
  cacheInvalidator('diagnostiqueurs:'),
  async (c) => {
    try {
      const { DB } = c.env
      const id = c.req.param('id')
      const data = await c.req.json()

      const updates: string[] = []
      const values: any[] = []

      // Dynamically build UPDATE statement
      const allowedFields = [
        'nom', 'prenom', 'email', 'telephone',
        'entreprise', 'siret', 'adresse', 'code_postal', 'ville',
        'statut_label', 'certifications', 'formations',
        'annees_experience', 'nombre_audits_realises', 'specialites',
        'note_moyenne', 'taux_conformite_moyen', 'delai_moyen_rapport',
        'zones_intervention', 'disponible', 'capacite_audits_mois',
        'notes_internes'
      ]

      for (const field of allowedFields) {
        if (data[field] !== undefined) {
          updates.push(`${field} = ?`)
          values.push(data[field])
        }
      }

      if (updates.length === 0) {
        return c.json({ error: 'Aucune donnée à mettre à jour' }, 400)
      }

      updates.push('updated_at = datetime(\'now\')')
      values.push(id)

      await DB.prepare(`
        UPDATE diagnostiqueurs 
        SET ${updates.join(', ')}
        WHERE id = ?
      `).bind(...values).run()

      return c.json({
        success: true,
        message: 'Diagnostiqueur mis à jour'
      })

    } catch (error: any) {
      console.error('Error updating diagnostiqueur:', error)
      return c.json({ error: error.message }, 500)
    }
  })

// ============================================================================
// LABELLISER DIAGNOSTIQUEUR
// ============================================================================
// POST /api/diagnostiqueurs/:id/labelliser
diagnostiqueursRoutes.post('/:id/labelliser',
  cacheInvalidator('diagnostiqueurs:'),
  async (c) => {
    try {
      const { DB } = c.env
      const id = c.req.param('id')

      // Generate label number: DIAGPV-YYYY-NNNN
      const year = new Date().getFullYear()
      const { results: countResult } = await DB.prepare(`
        SELECT COUNT(*) as count FROM diagnostiqueurs WHERE statut_label = 'labellise'
      `).all()
      const count = ((countResult?.[0] as any)?.count || 0) + 1
      const numeroLabel = `DIAGPV-${year}-${String(count).padStart(4, '0')}`

      // Label expiration: 2 years
      const expirationDate = new Date()
      expirationDate.setFullYear(expirationDate.getFullYear() + 2)

      await DB.prepare(`
        UPDATE diagnostiqueurs
        SET 
          statut_label = 'labellise',
          date_labellisation = datetime('now'),
          date_expiration_label = ?,
          numero_label = ?,
          updated_at = datetime('now')
        WHERE id = ?
      `).bind(expirationDate.toISOString(), numeroLabel, id).run()

      return c.json({
        success: true,
        numero_label: numeroLabel,
        date_expiration: expirationDate.toISOString(),
        message: 'Diagnostiqueur labellisé avec succès'
      })

    } catch (error: any) {
      console.error('Error labellizing diagnostiqueur:', error)
      return c.json({ error: error.message }, 500)
    }
  })

// ============================================================================
// SUPPRIMER DIAGNOSTIQUEUR
// ============================================================================
// DELETE /api/diagnostiqueurs/:id
diagnostiqueursRoutes.delete('/:id',
  cacheInvalidator('diagnostiqueurs:'),
  async (c) => {
    try {
      const { DB } = c.env
      const id = c.req.param('id')

      await DB.prepare(`DELETE FROM diagnostiqueurs WHERE id = ?`).bind(id).run()

      return c.json({
        success: true,
        message: 'Diagnostiqueur supprimé'
      })

    } catch (error: any) {
      console.error('Error deleting diagnostiqueur:', error)
      return c.json({ error: error.message }, 500)
    }
  })

// ============================================================================
// STATISTIQUES GLOBALES
// ============================================================================
// GET /api/diagnostiqueurs/stats/global
diagnostiqueursRoutes.get('/stats/global',
  cache({ ttl: 3600, namespace: 'diagnostiqueurs:stats:' }),
  async (c) => {
    try {
      const { DB } = c.env

      const { results } = await DB.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN statut_label = 'candidat' THEN 1 ELSE 0 END) as candidats,
          SUM(CASE WHEN statut_label = 'en_evaluation' THEN 1 ELSE 0 END) as en_evaluation,
          SUM(CASE WHEN statut_label = 'labellise' THEN 1 ELSE 0 END) as labellises,
          SUM(CASE WHEN statut_label = 'suspendu' THEN 1 ELSE 0 END) as suspendus,
          SUM(CASE WHEN statut_label = 'refuse' THEN 1 ELSE 0 END) as refuses,
          SUM(CASE WHEN disponible = 1 THEN 1 ELSE 0 END) as disponibles,
          AVG(note_moyenne) as note_moyenne_reseau,
          AVG(taux_conformite_moyen) as taux_conformite_reseau,
          SUM(nombre_audits_realises) as total_audits_realises
        FROM diagnostiqueurs
      `).all()

      return c.json({
        success: true,
        stats: results?.[0] || {}
      })

    } catch (error: any) {
      console.error('Error fetching diagnostiqueurs stats:', error)
      return c.json({ error: error.message }, 500)
    }
  })

export default diagnostiqueursRoutes
