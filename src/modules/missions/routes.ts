import { Hono } from 'hono'
import { cache, cacheInvalidator } from '../../middleware/cache'

type Bindings = {
  DB: D1Database
  KV: KVNamespace
}

const missionsRoutes = new Hono<{ Bindings: Bindings }>()

// ============================================================================
// HELPER: Algorithme Matching Diagnostiqueurs
// ============================================================================
interface MatchingCriteria {
  code_postal: string
  type_audit: string
  competences_requises?: string[]
  date_souhaitee?: string
}

interface DiagnostiqueurScore {
  diagnostiqueur_id: number
  score: number
  distance_km: number
  nom: string
  prenom: string
  email: string
  telephone: string
  note_moyenne: number
  disponible: boolean
}

async function matchDiagnostiqueurs(
  DB: D1Database,
  criteria: MatchingCriteria,
  limit: number = 5
): Promise<DiagnostiqueurScore[]> {
  
  // Get all labellisés + disponibles
  const { results: diagnostiqueurs } = await DB.prepare(`
    SELECT 
      id, nom, prenom, email, telephone,
      zones_intervention, specialites,
      note_moyenne, taux_conformite_moyen,
      nombre_audits_realises,
      disponible, capacite_audits_mois
    FROM diagnostiqueurs
    WHERE statut_label = 'labellise' AND disponible = 1
  `).all()
  
  if (!diagnostiqueurs || diagnostiqueurs.length === 0) {
    return []
  }
  
  const cpPrefix = criteria.code_postal.substring(0, 2) // Département
  
  const scored: DiagnostiqueurScore[] = []
  
  for (const diag of diagnostiqueurs as any[]) {
    let score = 0
    let distance_km = 999
    
    // 1. ZONE GÉOGRAPHIQUE (40 points max)
    try {
      const zones = diag.zones_intervention ? JSON.parse(diag.zones_intervention) : []
      if (Array.isArray(zones)) {
        // Exact match code postal
        if (zones.includes(criteria.code_postal)) {
          score += 40
          distance_km = 0
        }
        // Département match
        else if (zones.some((z: string) => z.startsWith(cpPrefix))) {
          score += 30
          distance_km = 50
        }
        // Région proche (départements limitrophes - simplified)
        else {
          score += 10
          distance_km = 150
        }
      }
    } catch (e) {
      console.error('Error parsing zones:', e)
    }
    
    // 2. COMPÉTENCES / SPÉCIALITÉS (30 points max)
    if (criteria.competences_requises && criteria.competences_requises.length > 0) {
      try {
        const specialites = diag.specialites ? JSON.parse(diag.specialites) : []
        if (Array.isArray(specialites)) {
          const matchCount = criteria.competences_requises.filter(
            (c: string) => specialites.includes(c)
          ).length
          score += (matchCount / criteria.competences_requises.length) * 30
        }
      } catch (e) {
        console.error('Error parsing specialites:', e)
      }
    } else {
      score += 15 // Bonus si pas de compétences spécifiques requises
    }
    
    // 3. PERFORMANCE HISTORIQUE (20 points max)
    const noteMoyenne = diag.note_moyenne || 0
    score += (noteMoyenne / 5) * 20
    
    // 4. EXPÉRIENCE (10 points max)
    const nombreAudits = diag.nombre_audits_realises || 0
    if (nombreAudits > 100) score += 10
    else if (nombreAudits > 50) score += 7
    else if (nombreAudits > 20) score += 5
    else if (nombreAudits > 5) score += 3
    
    scored.push({
      diagnostiqueur_id: diag.id,
      score: Math.round(score),
      distance_km,
      nom: diag.nom,
      prenom: diag.prenom,
      email: diag.email,
      telephone: diag.telephone,
      note_moyenne: diag.note_moyenne || 0,
      disponible: diag.disponible
    })
  }
  
  // Sort by score DESC
  scored.sort((a, b) => b.score - a.score)
  
  return scored.slice(0, limit)
}

// ============================================================================
// CRÉER MISSION
// ============================================================================
// POST /api/missions
missionsRoutes.post('/',
  cacheInvalidator('missions:'),
  async (c) => {
    try {
      const { DB } = c.env
      const data = await c.req.json()
      
      const {
        project_id, titre, description, type_audit, priorite,
        site_address, code_postal, ville,
        date_souhaitee, date_limite, duree_estimee_heures,
        competences_requises, budget_prevu, notes_internes
      } = data
      
      if (!project_id || !titre || !type_audit || !site_address || !code_postal) {
        return c.json({ error: 'Champs requis: project_id, titre, type_audit, site_address, code_postal' }, 400)
      }
      
      const result = await DB.prepare(`
        INSERT INTO missions (
          project_id, titre, description, type_audit, priorite,
          site_address, code_postal, ville,
          date_souhaitee, date_limite, duree_estimee_heures,
          competences_requises, budget_prevu, notes_internes,
          statut, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'en_attente', datetime('now'))
      `).bind(
        project_id, titre, description, type_audit, priorite || 'normale',
        site_address, code_postal, ville,
        date_souhaitee, date_limite, duree_estimee_heures || 4,
        competences_requises ? JSON.stringify(competences_requises) : null,
        budget_prevu, notes_internes
      ).run()
      
      const missionId = result.meta.last_row_id
      
      // Log historique
      await DB.prepare(`
        INSERT INTO missions_historique (mission_id, statut_nouveau, created_at)
        VALUES (?, 'en_attente', datetime('now'))
      `).bind(missionId).run()
      
      return c.json({
        success: true,
        mission_id: missionId,
        message: 'Mission créée avec succès'
      }, 201)
      
    } catch (error: any) {
      console.error('Error creating mission:', error)
      return c.json({ error: error.message }, 500)
    }
  })

// ============================================================================
// PROPOSER MISSION AUX DIAGNOSTIQUEURS (MATCHING AUTO)
// ============================================================================
// POST /api/missions/:id/proposer
missionsRoutes.post('/:id/proposer',
  cacheInvalidator('missions:'),
  async (c) => {
    try {
      const { DB } = c.env
      const missionId = c.req.param('id')
      const { nombre_propositions = 3 } = await c.req.json()
      
      // Get mission details
      const { results: missions } = await DB.prepare(`
        SELECT * FROM missions WHERE id = ?
      `).bind(missionId).all()
      
      if (!missions || missions.length === 0) {
        return c.json({ error: 'Mission introuvable' }, 404)
      }
      
      const mission = missions[0] as any
      
      // Run matching algorithm
      const competences = mission.competences_requises ? JSON.parse(mission.competences_requises) : []
      const matches = await matchDiagnostiqueurs(DB, {
        code_postal: mission.code_postal,
        type_audit: mission.type_audit,
        competences_requises: competences,
        date_souhaitee: mission.date_souhaitee
      }, nombre_propositions)
      
      if (matches.length === 0) {
        return c.json({ 
          success: false,
          message: 'Aucun diagnostiqueur disponible trouvé'
        })
      }
      
      // Create propositions
      const propositions = []
      for (const match of matches) {
        const result = await DB.prepare(`
          INSERT INTO missions_propositions (
            mission_id, diagnostiqueur_id,
            score_matching, distance_km,
            statut, date_proposition, created_at
          ) VALUES (?, ?, ?, ?, 'proposee', datetime('now'), datetime('now'))
        `).bind(
          missionId,
          match.diagnostiqueur_id,
          match.score,
          match.distance_km
        ).run()
        
        propositions.push({
          proposition_id: result.meta.last_row_id,
          diagnostiqueur: match,
          score: match.score,
          distance_km: match.distance_km
        })
      }
      
      // Update mission status
      await DB.prepare(`
        UPDATE missions 
        SET statut = 'proposee', updated_at = datetime('now')
        WHERE id = ?
      `).bind(missionId).run()
      
      // Log historique
      await DB.prepare(`
        INSERT INTO missions_historique (mission_id, statut_precedent, statut_nouveau, created_at)
        VALUES (?, 'en_attente', 'proposee', datetime('now'))
      `).bind(missionId).run()
      
      return c.json({
        success: true,
        mission_id: missionId,
        propositions_count: propositions.length,
        propositions
      })
      
    } catch (error: any) {
      console.error('Error proposing mission:', error)
      return c.json({ error: error.message }, 500)
    }
  })

// ============================================================================
// ACCEPTER MISSION (PAR DIAGNOSTIQUEUR)
// ============================================================================
// POST /api/missions/propositions/:proposition_id/accepter
missionsRoutes.post('/propositions/:proposition_id/accepter',
  cacheInvalidator('missions:'),
  async (c) => {
    try {
      const { DB } = c.env
      const propositionId = c.req.param('proposition_id')
      
      // Get proposition details
      const { results: propositions } = await DB.prepare(`
        SELECT * FROM missions_propositions WHERE id = ?
      `).bind(propositionId).all()
      
      if (!propositions || propositions.length === 0) {
        return c.json({ error: 'Proposition introuvable' }, 404)
      }
      
      const proposition = propositions[0] as any
      
      // Check if mission still available
      const { results: missions } = await DB.prepare(`
        SELECT * FROM missions WHERE id = ?
      `).bind(proposition.mission_id).all()
      
      if (!missions || missions.length === 0) {
        return c.json({ error: 'Mission introuvable' }, 404)
      }
      
      const mission = missions[0] as any
      
      if (mission.statut !== 'proposee') {
        return c.json({ 
          error: 'Mission déjà affectée ou annulée',
          statut: mission.statut
        }, 400)
      }
      
      // Accept proposition
      await DB.prepare(`
        UPDATE missions_propositions
        SET statut = 'acceptee', date_reponse = datetime('now')
        WHERE id = ?
      `).bind(propositionId).run()
      
      // Refuse other propositions
      await DB.prepare(`
        UPDATE missions_propositions
        SET statut = 'expiree'
        WHERE mission_id = ? AND id != ?
      `).bind(proposition.mission_id, propositionId).run()
      
      // Affecter mission
      await DB.prepare(`
        UPDATE missions
        SET 
          statut = 'affectee',
          diagnostiqueur_affecte_id = ?,
          date_affectation = datetime('now'),
          date_acceptation = datetime('now'),
          updated_at = datetime('now')
        WHERE id = ?
      `).bind(proposition.diagnostiqueur_id, proposition.mission_id).run()
      
      // Log historique
      await DB.prepare(`
        INSERT INTO missions_historique (mission_id, statut_precedent, statut_nouveau, commentaire, created_at)
        VALUES (?, 'proposee', 'affectee', 'Acceptée par diagnostiqueur', datetime('now'))
      `).bind(proposition.mission_id).run()
      
      return c.json({
        success: true,
        message: 'Mission acceptée et affectée',
        mission_id: proposition.mission_id
      })
      
    } catch (error: any) {
      console.error('Error accepting mission:', error)
      return c.json({ error: error.message }, 500)
    }
  })

// ============================================================================
// LISTE MISSIONS (FILTRES)
// ============================================================================
// GET /api/missions?statut=en_attente&diagnostiqueur_id=5
missionsRoutes.get('/',
  cache({ ttl: 900, namespace: 'missions:' }),
  async (c) => {
    try {
      const { DB } = c.env
      const statut = c.req.query('statut')
      const diagnostiqueurId = c.req.query('diagnostiqueur_id')
      const page = parseInt(c.req.query('page') || '1')
      const limit = parseInt(c.req.query('limit') || '20')
      const offset = (page - 1) * limit
      
      let whereClause = 'WHERE 1=1'
      const params: any[] = []
      
      if (statut) {
        whereClause += ' AND statut = ?'
        params.push(statut)
      }
      
      if (diagnostiqueurId) {
        whereClause += ' AND diagnostiqueur_affecte_id = ?'
        params.push(diagnostiqueurId)
      }
      
      const { results: countResult } = await DB.prepare(`
        SELECT COUNT(*) as total FROM missions ${whereClause}
      `).bind(...params).all()
      const total = (countResult?.[0] as any)?.total || 0
      
      const { results } = await DB.prepare(`
        SELECT * FROM v_missions_actives
        ${whereClause}
        LIMIT ? OFFSET ?
      `).bind(...params, limit, offset).all()
      
      return c.json({
        success: true,
        missions: results || [],
        pagination: {
          page,
          limit,
          total,
          total_pages: Math.ceil(total / limit)
        }
      })
      
    } catch (error: any) {
      console.error('Error fetching missions:', error)
      return c.json({ error: error.message }, 500)
    }
  })

// ============================================================================
// DÉTAILS MISSION
// ============================================================================
// GET /api/missions/:id
missionsRoutes.get('/:id',
  cache({ ttl: 600, namespace: 'missions:detail:' }),
  async (c) => {
    try {
      const { DB } = c.env
      const id = c.req.param('id')
      
      const { results: missions } = await DB.prepare(`
        SELECT * FROM v_missions_actives WHERE id = ?
      `).bind(id).all()
      
      if (!missions || missions.length === 0) {
        return c.json({ error: 'Mission introuvable' }, 404)
      }
      
      // Get propositions
      const { results: propositions } = await DB.prepare(`
        SELECT 
          mp.*,
          d.nom, d.prenom, d.email, d.telephone, d.note_moyenne
        FROM missions_propositions mp
        LEFT JOIN diagnostiqueurs d ON mp.diagnostiqueur_id = d.id
        WHERE mp.mission_id = ?
        ORDER BY mp.score_matching DESC
      `).bind(id).all()
      
      // Get historique
      const { results: historique } = await DB.prepare(`
        SELECT * FROM missions_historique
        WHERE mission_id = ?
        ORDER BY created_at DESC
      `).bind(id).all()
      
      return c.json({
        success: true,
        mission: missions[0],
        propositions: propositions || [],
        historique: historique || []
      })
      
    } catch (error: any) {
      console.error('Error fetching mission detail:', error)
      return c.json({ error: error.message }, 500)
    }
  })

// ============================================================================
// STATS MISSIONS
// ============================================================================
// GET /api/missions/stats/global
missionsRoutes.get('/stats/global',
  cache({ ttl: 1800, namespace: 'missions:stats:' }),
  async (c) => {
    try {
      const { DB } = c.env
      
      const { results } = await DB.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN statut = 'en_attente' THEN 1 ELSE 0 END) as en_attente,
          SUM(CASE WHEN statut = 'proposee' THEN 1 ELSE 0 END) as proposee,
          SUM(CASE WHEN statut = 'affectee' THEN 1 ELSE 0 END) as affectee,
          SUM(CASE WHEN statut = 'en_cours' THEN 1 ELSE 0 END) as en_cours,
          SUM(CASE WHEN statut = 'terminee' THEN 1 ELSE 0 END) as terminee,
          SUM(CASE WHEN statut = 'validee' THEN 1 ELSE 0 END) as validee,
          AVG(duree_estimee_heures) as duree_moyenne,
          SUM(budget_prevu) as budget_total
        FROM missions
      `).all()
      
      return c.json({
        success: true,
        stats: results?.[0] || {}
      })
      
    } catch (error: any) {
      console.error('Error fetching missions stats:', error)
      return c.json({ error: error.message }, 500)
    }
  })

export default missionsRoutes
