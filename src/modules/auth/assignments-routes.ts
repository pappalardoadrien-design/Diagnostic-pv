import { Hono } from 'hono'
import type { Context } from 'hono'

type Bindings = {
  DB: D1Database
  KV: KVNamespace
}

const app = new Hono<{ Bindings: Bindings }>()

// ============================================================================
// GET /api/auth/admin/assignments - LISTE DES ASSIGNATIONS
// ============================================================================
// Filtres disponibles:
// - user_id: Filtrer par utilisateur assigné
// - audit_token: Filtrer par audit spécifique
// - status: Filtrer par statut (active, revoked, expired)
// - search: Recherche par nom utilisateur ou projet
app.get('/', async (c: Context) => {
  const { env } = c

  try {
    // Récupération des filtres query string
    const userId = c.req.query('user_id')
    const auditToken = c.req.query('audit_token')
    const status = c.req.query('status')
    const search = c.req.query('search')

    let sql = `
      SELECT 
        aa.id,
        aa.user_id,
        aa.audit_token,
        aa.can_view,
        aa.can_edit,
        aa.can_delete,
        aa.allowed_modules,
        aa.assigned_by,
        aa.assigned_at,
        aa.expires_at,
        aa.status,
        aa.notes,
        au.email,
        au.full_name,
        au.company,
        au.role,
        ea.project_name,
        ea.client_name,
        ea.location,
        ea.created_at as audit_date,
        ea.status as audit_status
      FROM audit_assignments aa
      LEFT JOIN auth_users au ON aa.user_id = au.id
      LEFT JOIN el_audits ea ON aa.audit_token = ea.audit_token
      WHERE 1=1
    `

    const params: any[] = []

    // Filtres conditionnels
    if (userId) {
      sql += ' AND aa.user_id = ?'
      params.push(userId)
    }

    if (auditToken) {
      sql += ' AND aa.audit_token = ?'
      params.push(auditToken)
    }

    if (status) {
      sql += ' AND aa.status = ?'
      params.push(status)
    }

    // Recherche textuelle
    if (search) {
      sql += ' AND (au.full_name LIKE ? OR au.email LIKE ? OR ea.project_name LIKE ?)'
      const searchPattern = `%${search}%`
      params.push(searchPattern, searchPattern, searchPattern)
    }

    sql += ' ORDER BY aa.assigned_at DESC'

    const stmt = env.DB.prepare(sql)
    const result = await stmt.bind(...params).all()

    return c.json({
      success: true,
      assignments: result.results,
      total: result.results.length
    })

  } catch (error: any) {
    console.error('Erreur liste assignations:', error)
    return c.json({
      success: false,
      error: error.message || 'Erreur récupération assignations'
    }, 500)
  }
})

// ============================================================================
// GET /api/auth/admin/assignments/:id - DÉTAILS ASSIGNATION
// ============================================================================
app.get('/:id', async (c: Context) => {
  const { env } = c
  const assignmentId = c.req.param('id')

  try {
    const assignment = await env.DB.prepare(`
      SELECT 
        aa.id,
        aa.user_id,
        aa.audit_token,
        aa.can_view,
        aa.can_edit,
        aa.can_delete,
        aa.allowed_modules,
        aa.assigned_by,
        aa.assigned_at,
        aa.expires_at,
        aa.status,
        aa.notes,
        au.email,
        au.full_name,
        au.company,
        au.role,
        assigned_by_user.email as assigned_by_email,
        assigned_by_user.full_name as assigned_by_name,
        ea.project_name,
        ea.client_name,
        ea.location,
        ea.created_at as audit_date,
        ea.status as audit_status,
        ea.total_modules,
        ea.string_count
      FROM audit_assignments aa
      LEFT JOIN auth_users au ON aa.user_id = au.id
      LEFT JOIN auth_users assigned_by_user ON aa.assigned_by = assigned_by_user.id
      LEFT JOIN el_audits ea ON aa.audit_token = ea.audit_token
      WHERE aa.id = ?
    `).bind(assignmentId).first()

    if (!assignment) {
      return c.json({
        success: false,
        error: 'Assignation non trouvée'
      }, 404)
    }

    // Récupérer aussi l'historique d'activité pour cette assignation
    const activity = await env.DB.prepare(`
      SELECT *
      FROM activity_logs
      WHERE entity_type = 'assignment'
      AND entity_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `).bind(assignmentId).all()

    return c.json({
      success: true,
      assignment,
      activity_logs: activity.results
    })

  } catch (error: any) {
    console.error('Erreur détails assignation:', error)
    return c.json({
      success: false,
      error: error.message || 'Erreur récupération assignation'
    }, 500)
  }
})

// ============================================================================
// POST /api/auth/admin/assignments - CRÉER ASSIGNATION
// ============================================================================
// Body JSON:
// {
//   "user_id": 5,
//   "audit_token": "abc123",
//   "can_view": true,
//   "can_edit": false,
//   "can_delete": false,
//   "allowed_modules": ["el", "iv"], // Optionnel, null = tous modules
//   "assigned_by": 1, // ID de l'admin qui assigne
//   "expires_at": "2024-12-31 23:59:59", // Optionnel
//   "notes": "Sous-traitant audit EL" // Optionnel
// }
app.post('/', async (c: Context) => {
  const { env } = c

  try {
    const body = await c.req.json()
    const { 
      user_id, 
      audit_token, 
      can_view = true, 
      can_edit = false, 
      can_delete = false,
      allowed_modules = null,
      assigned_by,
      expires_at = null,
      notes = null
    } = body

    // Validation des champs obligatoires
    if (!user_id || !audit_token || !assigned_by) {
      return c.json({
        success: false,
        error: 'Champs obligatoires manquants: user_id, audit_token, assigned_by'
      }, 400)
    }

    // Vérifier que l'utilisateur existe
    const user = await env.DB.prepare(
      'SELECT id, email, full_name FROM auth_users WHERE id = ? AND is_active = 1'
    ).bind(user_id).first()

    if (!user) {
      return c.json({
        success: false,
        error: 'Utilisateur non trouvé ou inactif'
      }, 404)
    }

    // Vérifier que l'audit existe (si table el_audits disponible)
    const audit = await env.DB.prepare(
      'SELECT token, project_name FROM el_audits WHERE token = ?'
    ).bind(audit_token).first()

    if (!audit) {
      return c.json({
        success: false,
        error: 'Audit non trouvé'
      }, 404)
    }

    // Vérifier qu'il n'existe pas déjà une assignation active pour ce couple user/audit
    const existing = await env.DB.prepare(
      'SELECT id FROM audit_assignments WHERE user_id = ? AND audit_token = ? AND status = ?'
    ).bind(user_id, audit_token, 'active').first()

    if (existing) {
      return c.json({
        success: false,
        error: 'Cet utilisateur est déjà assigné à cet audit'
      }, 409)
    }

    // Convertir allowed_modules en JSON string si array
    const allowedModulesJson = allowed_modules ? JSON.stringify(allowed_modules) : null

    // Créer l'assignation
    const result = await env.DB.prepare(`
      INSERT INTO audit_assignments (
        user_id,
        audit_token,
        can_view,
        can_edit,
        can_delete,
        allowed_modules,
        assigned_by,
        assigned_at,
        status,
        expires_at,
        notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), 'active', ?, ?)
    `).bind(
      user_id,
      audit_token,
      can_view ? 1 : 0,
      can_edit ? 1 : 0,
      can_delete ? 1 : 0,
      allowedModulesJson,
      assigned_by,
      expires_at,
      notes
    ).run()

    const assignmentId = result.meta.last_row_id

    // Logger l'activité
    await env.DB.prepare(`
      INSERT INTO activity_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        details
      ) VALUES (?, 'assignment_created', 'assignment', ?, ?)
    `).bind(
      assigned_by,
      assignmentId,
      JSON.stringify({
        assigned_user_id: user_id,
        assigned_user_email: user.email,
        audit_token,
        audit_name: audit.project_name,
        permissions: { can_view, can_edit, can_delete }
      })
    ).run()

    return c.json({
      success: true,
      assignment_id: assignmentId,
      message: `Assignation créée pour ${user.full_name} sur l'audit ${audit.project_name}`
    }, 201)

  } catch (error: any) {
    console.error('Erreur création assignation:', error)
    return c.json({
      success: false,
      error: error.message || 'Erreur création assignation'
    }, 500)
  }
})

// ============================================================================
// PUT /api/auth/admin/assignments/:id - MODIFIER ASSIGNATION
// ============================================================================
// Body JSON:
// {
//   "can_view": true, // Optionnel
//   "can_edit": true, // Optionnel
//   "can_delete": false, // Optionnel
//   "allowed_modules": ["el"], // Optionnel
//   "expires_at": "2025-01-31 23:59:59", // Optionnel
//   "status": "active", // Optionnel (active, revoked, expired)
//   "notes": "Accès étendu" // Optionnel
// }
app.put('/:id', async (c: Context) => {
  const { env } = c
  const assignmentId = c.req.param('id')

  try {
    const body = await c.req.json()
    const { can_view, can_edit, can_delete, allowed_modules, expires_at, status, notes } = body

    // Vérifier que l'assignation existe
    const existing = await env.DB.prepare(
      'SELECT * FROM audit_assignments WHERE id = ?'
    ).bind(assignmentId).first()

    if (!existing) {
      return c.json({
        success: false,
        error: 'Assignation non trouvée'
      }, 404)
    }

    // Construire la requête UPDATE dynamiquement
    const updates: string[] = []
    const params: any[] = []

    if (can_view !== undefined) {
      updates.push('can_view = ?')
      params.push(can_view ? 1 : 0)
    }

    if (can_edit !== undefined) {
      updates.push('can_edit = ?')
      params.push(can_edit ? 1 : 0)
    }

    if (can_delete !== undefined) {
      updates.push('can_delete = ?')
      params.push(can_delete ? 1 : 0)
    }

    if (allowed_modules !== undefined) {
      updates.push('allowed_modules = ?')
      params.push(allowed_modules ? JSON.stringify(allowed_modules) : null)
    }

    if (expires_at !== undefined) {
      updates.push('expires_at = ?')
      params.push(expires_at)
    }

    if (status !== undefined) {
      const validStatuses = ['active', 'revoked', 'expired']
      if (!validStatuses.includes(status)) {
        return c.json({
          success: false,
          error: `Status invalide. Valeurs acceptées: ${validStatuses.join(', ')}`
        }, 400)
      }
      updates.push('status = ?')
      params.push(status)
    }

    if (notes !== undefined) {
      updates.push('notes = ?')
      params.push(notes)
    }

    if (updates.length === 0) {
      return c.json({
        success: false,
        error: 'Aucun champ à modifier'
      }, 400)
    }

    // Ajouter l'ID pour le WHERE
    params.push(assignmentId)

    await env.DB.prepare(`
      UPDATE audit_assignments
      SET ${updates.join(', ')}
      WHERE id = ?
    `).bind(...params).run()

    // Logger l'activité
    await env.DB.prepare(`
      INSERT INTO activity_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        details
      ) VALUES (?, 'assignment_updated', 'assignment', ?, ?)
    `).bind(
      existing.assigned_by,
      assignmentId,
      JSON.stringify({
        changes: { can_view, can_edit, can_delete, allowed_modules, expires_at, status, notes }
      })
    ).run()

    return c.json({
      success: true,
      message: 'Assignation mise à jour avec succès'
    })

  } catch (error: any) {
    console.error('Erreur modification assignation:', error)
    return c.json({
      success: false,
      error: error.message || 'Erreur modification assignation'
    }, 500)
  }
})

// ============================================================================
// DELETE /api/auth/admin/assignments/:id - RÉVOQUER ASSIGNATION
// ============================================================================
// Soft delete: status = 'revoked'
app.delete('/:id', async (c: Context) => {
  const { env } = c
  const assignmentId = c.req.param('id')

  try {
    // Vérifier que l'assignation existe
    const existing = await env.DB.prepare(
      'SELECT * FROM audit_assignments WHERE id = ?'
    ).bind(assignmentId).first()

    if (!existing) {
      return c.json({
        success: false,
        error: 'Assignation non trouvée'
      }, 404)
    }

    // Soft delete: status = revoked
    await env.DB.prepare(
      'UPDATE audit_assignments SET status = ? WHERE id = ?'
    ).bind('revoked', assignmentId).run()

    // Logger l'activité
    await env.DB.prepare(`
      INSERT INTO activity_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        details
      ) VALUES (?, 'assignment_revoked', 'assignment', ?, ?)
    `).bind(
      existing.assigned_by,
      assignmentId,
      JSON.stringify({
        user_id: existing.user_id,
        audit_token: existing.audit_token
      })
    ).run()

    return c.json({
      success: true,
      message: 'Assignation révoquée avec succès'
    })

  } catch (error: any) {
    console.error('Erreur révocation assignation:', error)
    return c.json({
      success: false,
      error: error.message || 'Erreur révocation assignation'
    }, 500)
  }
})

// ============================================================================
// GET /api/auth/admin/assignments/user/:userId/audits
// ============================================================================
// Liste les audits assignés à un utilisateur spécifique
app.get('/user/:userId/audits', async (c: Context) => {
  const { env } = c
  const userId = c.req.param('userId')

  try {
    const assignments = await env.DB.prepare(`
      SELECT 
        aa.id,
        aa.audit_token,
        aa.can_view,
        aa.can_edit,
        aa.can_delete,
        aa.allowed_modules,
        aa.assigned_at,
        aa.expires_at,
        aa.status,
        ea.project_name,
        ea.client_name,
        ea.location,
        ea.created_at as audit_date,
        ea.status as audit_status,
        ea.total_modules
      FROM audit_assignments aa
      LEFT JOIN el_audits ea ON aa.audit_token = ea.audit_token
      WHERE aa.user_id = ?
      AND aa.status = 'active'
      ORDER BY aa.assigned_at DESC
    `).bind(userId).all()

    return c.json({
      success: true,
      audits: assignments.results
    })

  } catch (error: any) {
    console.error('Erreur audits utilisateur:', error)
    return c.json({
      success: false,
      error: error.message || 'Erreur récupération audits'
    }, 500)
  }
})

// ============================================================================
// GET /api/auth/admin/assignments/audit/:token/users
// ============================================================================
// Liste les utilisateurs assignés à un audit spécifique
app.get('/audit/:token/users', async (c: Context) => {
  const { env } = c
  const auditToken = c.req.param('token')

  try {
    const assignments = await env.DB.prepare(`
      SELECT 
        aa.id,
        aa.user_id,
        aa.can_view,
        aa.can_edit,
        aa.can_delete,
        aa.allowed_modules,
        aa.assigned_at,
        aa.expires_at,
        aa.status,
        au.email,
        au.full_name,
        au.company,
        au.role
      FROM audit_assignments aa
      LEFT JOIN auth_users au ON aa.user_id = au.id
      WHERE aa.audit_token = ?
      AND aa.status = 'active'
      ORDER BY aa.assigned_at DESC
    `).bind(auditToken).all()

    return c.json({
      success: true,
      users: assignments.results
    })

  } catch (error: any) {
    console.error('Erreur utilisateurs audit:', error)
    return c.json({
      success: false,
      error: error.message || 'Erreur récupération utilisateurs'
    }, 500)
  }
})

export default app
