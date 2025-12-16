/**
 * Module Auth - Admin Routes
 * Gestion utilisateurs (CRUD) - Réservé aux admins
 */

import { Hono } from 'hono';
import { hashPassword, sanitizeUser, getClientIP, getUserAgent, isValidEmail, isStrongPassword } from './utils';
import type { Bindings, User, CreateUserInput } from './types';

const adminRoutes = new Hono<{ Bindings: Bindings }>();

// ============================================================
// GET /api/auth/admin/users
// Liste tous les utilisateurs
// ============================================================
adminRoutes.get('/users', async (c) => {
  try {
    const { DB } = c.env;
    
    // Get filters from query params
    const role = c.req.query('role');
    const status = c.req.query('status'); // active / inactive
    const search = c.req.query('search');
    
    let query = 'SELECT * FROM auth_users WHERE 1=1';
    const params: any[] = [];
    
    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }
    
    if (status === 'active') {
      query += ' AND is_active = 1';
    } else if (status === 'inactive') {
      query += ' AND is_active = 0';
    }
    
    if (search) {
      query += ' AND (email LIKE ? OR full_name LIKE ? OR company LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const stmt = DB.prepare(query);
    const result = await stmt.bind(...params).all();
    
    const users = result.results.map(u => sanitizeUser(u));
    
    return c.json({
      success: true,
      users,
      total: users.length
    });
    
  } catch (error: any) {
    console.error('List users error:', error);
    return c.json({ success: false, message: 'Erreur récupération utilisateurs' }, 500);
  }
});

// ============================================================
// GET /api/auth/admin/users/:id
// Détails d'un utilisateur
// ============================================================
adminRoutes.get('/users/:id', async (c) => {
  try {
    const { DB } = c.env;
    const userId = c.req.param('id');
    
    const user = await DB.prepare('SELECT * FROM auth_users WHERE id = ?')
      .bind(userId)
      .first();
    
    if (!user) {
      return c.json({ success: false, message: 'Utilisateur introuvable' }, 404);
    }
    
    // Get activity logs
    const logs = await DB.prepare(`
      SELECT * FROM activity_logs 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 50
    `).bind(userId).all();
    
    return c.json({
      success: true,
      user: sanitizeUser(user),
      recent_activity: logs.results
    });
    
  } catch (error: any) {
    console.error('Get user error:', error);
    return c.json({ success: false, message: 'Erreur récupération utilisateur' }, 500);
  }
});

// ============================================================
// POST /api/auth/admin/users
// Créer un nouvel utilisateur
// ============================================================
adminRoutes.post('/users', async (c) => {
  try {
    const { DB, KV } = c.env;
    const body = await c.req.json<CreateUserInput>();
    
    const { email, password, full_name, company, role, must_change_password = true } = body;
    
    // Validation
    if (!email || !password || !full_name || !role) {
      return c.json({ 
        success: false, 
        message: 'Champs requis: email, password, full_name, role' 
      }, 400);
    }
    
    if (!isValidEmail(email)) {
      return c.json({ 
        success: false, 
        message: 'Email invalide' 
      }, 400);
    }
    
    const passwordCheck = isStrongPassword(password);
    if (!passwordCheck.valid) {
      return c.json({ 
        success: false, 
        message: `Mot de passe faible: ${passwordCheck.message}` 
      }, 400);
    }
    
    if (!['admin', 'subcontractor', 'client', 'auditor'].includes(role)) {
      return c.json({ 
        success: false, 
        message: 'Rôle invalide' 
      }, 400);
    }
    
    // Check if email already exists
    const existing = await DB.prepare('SELECT id FROM auth_users WHERE email = ?')
      .bind(email)
      .first();
    
    if (existing) {
      return c.json({ 
        success: false, 
        message: 'Email déjà utilisé' 
      }, 400);
    }
    
    // Hash password
    const passwordHash = await hashPassword(password);
    
    // Insert user
    const result = await DB.prepare(`
      INSERT INTO auth_users (email, password_hash, full_name, company, role, must_change_password)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      email,
      passwordHash,
      full_name,
      company || null,
      role,
      must_change_password ? 1 : 0
    ).run();
    
    const newUserId = result.meta.last_row_id;
    
    // Get created user
    const newUser = await DB.prepare('SELECT * FROM auth_users WHERE id = ?')
      .bind(newUserId)
      .first();
    
    // Log activity
    const ipAddress = getClientIP(c.req.raw);
    const userAgent = getUserAgent(c.req.raw);
    
    await DB.prepare(`
      INSERT INTO activity_logs (user_id, action, resource_type, resource_id, ip_address, user_agent, details)
      VALUES (?, 'create_user', 'user', ?, ?, ?, ?)
    `).bind(
      newUserId,
      String(newUserId),
      ipAddress,
      userAgent,
      JSON.stringify({ email, role, created_by: 'admin' })
    ).run();
    
    return c.json({
      success: true,
      message: 'Utilisateur créé avec succès',
      user: sanitizeUser(newUser)
    }, 201);
    
  } catch (error: any) {
    console.error('Create user error:', error);
    return c.json({ success: false, message: 'Erreur création utilisateur' }, 500);
  }
});

// ============================================================
// PUT /api/auth/admin/users/:id
// Modifier un utilisateur
// ============================================================
adminRoutes.put('/users/:id', async (c) => {
  try {
    const { DB } = c.env;
    const userId = c.req.param('id');
    const body = await c.req.json();
    
    const { email, full_name, company, role, is_active } = body;
    
    // Check user exists
    const existing = await DB.prepare('SELECT * FROM auth_users WHERE id = ?')
      .bind(userId)
      .first();
    
    if (!existing) {
      return c.json({ success: false, message: 'Utilisateur introuvable' }, 404);
    }
    
    // Build update query
    const updates: string[] = [];
    const params: any[] = [];
    
    if (email !== undefined) {
      if (!isValidEmail(email)) {
        return c.json({ success: false, message: 'Email invalide' }, 400);
      }
      updates.push('email = ?');
      params.push(email);
    }
    
    if (full_name !== undefined) {
      updates.push('full_name = ?');
      params.push(full_name);
    }
    
    if (company !== undefined) {
      updates.push('company = ?');
      params.push(company);
    }
    
    if (role !== undefined) {
      if (!['admin', 'subcontractor', 'client', 'auditor'].includes(role)) {
        return c.json({ success: false, message: 'Rôle invalide' }, 400);
      }
      updates.push('role = ?');
      params.push(role);
    }
    
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active ? 1 : 0);
    }
    
    if (updates.length === 0) {
      return c.json({ success: false, message: 'Aucune modification à effectuer' }, 400);
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(userId);
    
    const query = `UPDATE auth_users SET ${updates.join(', ')} WHERE id = ?`;
    await DB.prepare(query).bind(...params).run();
    
    // Get updated user
    const updatedUser = await DB.prepare('SELECT * FROM auth_users WHERE id = ?')
      .bind(userId)
      .first();
    
    // Log activity
    const ipAddress = getClientIP(c.req.raw);
    const userAgent = getUserAgent(c.req.raw);
    
    await DB.prepare(`
      INSERT INTO activity_logs (user_id, action, resource_type, resource_id, ip_address, user_agent, details)
      VALUES (?, 'update_user', 'user', ?, ?, ?, ?)
    `).bind(
      userId,
      userId,
      ipAddress,
      userAgent,
      JSON.stringify({ changes: body })
    ).run();
    
    return c.json({
      success: true,
      message: 'Utilisateur modifié avec succès',
      user: sanitizeUser(updatedUser)
    });
    
  } catch (error: any) {
    console.error('Update user error:', error);
    return c.json({ success: false, message: 'Erreur modification utilisateur' }, 500);
  }
});

// ============================================================
// DELETE /api/auth/admin/users/:id
// Désactiver un utilisateur (soft delete)
// ============================================================
adminRoutes.delete('/users/:id', async (c) => {
  try {
    const { DB, KV } = c.env;
    const userId = c.req.param('id');
    
    // Check user exists
    const existing = await DB.prepare('SELECT * FROM auth_users WHERE id = ?')
      .bind(userId)
      .first();
    
    if (!existing) {
      return c.json({ success: false, message: 'Utilisateur introuvable' }, 404);
    }
    
    // Soft delete (is_active = 0)
    await DB.prepare('UPDATE auth_users SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .bind(userId)
      .run();
    
    // Invalidate all sessions for this user
    const sessions = await DB.prepare('SELECT session_token FROM sessions WHERE user_id = ?')
      .bind(userId)
      .all();
    
    for (const session of sessions.results) {
      const token = (session as any).session_token;
      await KV.delete(`session:${token}`);
    }
    
    await DB.prepare('DELETE FROM sessions WHERE user_id = ?')
      .bind(userId)
      .run();
    
    // Log activity
    const ipAddress = getClientIP(c.req.raw);
    const userAgent = getUserAgent(c.req.raw);
    
    await DB.prepare(`
      INSERT INTO activity_logs (user_id, action, resource_type, resource_id, ip_address, user_agent, details)
      VALUES (?, 'delete_user', 'user', ?, ?, ?, ?)
    `).bind(
      userId,
      userId,
      ipAddress,
      userAgent,
      JSON.stringify({ deactivated: true })
    ).run();
    
    return c.json({
      success: true,
      message: 'Utilisateur désactivé avec succès'
    });
    
  } catch (error: any) {
    console.error('Delete user error:', error);
    return c.json({ success: false, message: 'Erreur désactivation utilisateur' }, 500);
  }
});

// ============================================================
// GET /api/auth/admin/stats
// Statistiques utilisateurs
// ============================================================
adminRoutes.get('/stats', async (c) => {
  try {
    const { DB } = c.env;
    
    // Count by role
    const roleStats = await DB.prepare(`
      SELECT 
        role,
        COUNT(*) as count,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_count
      FROM auth_users
      GROUP BY role
    `).all();
    
    // Total users
    const totalUsers = await DB.prepare('SELECT COUNT(*) as total FROM auth_users').first();
    const activeUsers = await DB.prepare('SELECT COUNT(*) as total FROM auth_users WHERE is_active = 1').first();
    
    // Recent activity
    const recentActivity = await DB.prepare(`
      SELECT COUNT(*) as count
      FROM activity_logs
      WHERE created_at >= datetime('now', '-7 days')
    `).first();
    
    return c.json({
      success: true,
      stats: {
        total_users: (totalUsers as any)?.total || 0,
        active_users: (activeUsers as any)?.total || 0,
        by_role: roleStats.results,
        recent_activity_7d: (recentActivity as any)?.count || 0
      }
    });
    
  } catch (error: any) {
    console.error('Stats error:', error);
    return c.json({ success: false, message: 'Erreur récupération statistiques' }, 500);
  }
});

export default adminRoutes;
