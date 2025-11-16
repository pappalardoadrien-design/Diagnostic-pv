/**
 * Module Auth - Routes API
 * Phase 6: Multi-utilisateurs & Permissions
 * 
 * Endpoints:
 * - POST /api/auth/login
 * - POST /api/auth/logout
 * - GET /api/auth/me
 * - POST /api/auth/change-password
 */

import { Hono } from 'hono';
import { 
  hashPassword, 
  verifyPassword, 
  generateSessionToken, 
  getSessionExpiry,
  sanitizeUser,
  getClientIP,
  getUserAgent,
  isStrongPassword
} from './utils';
import type { 
  Bindings, 
  LoginRequest, 
  LoginResponse,
  ChangePasswordRequest,
  User,
  Session
} from './types';

const authRoutes = new Hono<{ Bindings: Bindings }>();

// ============================================================
// POST /api/auth/login
// Authentification utilisateur
// ============================================================
authRoutes.post('/login', async (c) => {
  try {
    const { DB, KV } = c.env;
    const body = await c.req.json<LoginRequest>();
    const { email, password, remember_me = false } = body;

    // Validation
    if (!email || !password) {
      return c.json<LoginResponse>({ 
        success: false, 
        message: 'Email et mot de passe requis' 
      }, 400);
    }

    // Récupérer utilisateur
    const stmt = DB.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1');
    const result = await stmt.bind(email).first();

    if (!result) {
      return c.json<LoginResponse>({ 
        success: false, 
        message: 'Email ou mot de passe incorrect' 
      }, 401);
    }

    const user = result as any;

    // Vérifier mot de passe
    const passwordValid = await verifyPassword(password, user.password_hash);
    if (!passwordValid) {
      return c.json<LoginResponse>({ 
        success: false, 
        message: 'Email ou mot de passe incorrect' 
      }, 401);
    }

    // Générer session
    const sessionToken = generateSessionToken();
    const expiresAt = getSessionExpiry(remember_me);
    const ipAddress = getClientIP(c.req.raw);
    const userAgent = getUserAgent(c.req.raw);

    // Sauvegarder session en DB
    const insertStmt = DB.prepare(`
      INSERT INTO sessions (user_id, session_token, expires_at, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?)
    `);
    await insertStmt.bind(
      user.id,
      sessionToken,
      expiresAt.toISOString(),
      ipAddress,
      userAgent
    ).run();

    // Sauvegarder session en KV pour fast lookup
    await KV.put(
      `session:${sessionToken}`,
      JSON.stringify({ user_id: user.id, expires_at: expiresAt.toISOString() }),
      { expiration: Math.floor(expiresAt.getTime() / 1000) }
    );

    // Update last_login_at
    await DB.prepare('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?')
      .bind(user.id)
      .run();

    // Log activity
    await DB.prepare(`
      INSERT INTO activity_logs (user_id, action, ip_address, user_agent, details)
      VALUES (?, 'login', ?, ?, ?)
    `).bind(
      user.id,
      ipAddress,
      userAgent,
      JSON.stringify({ remember_me })
    ).run();

    // Réponse
    return c.json<LoginResponse>({
      success: true,
      message: 'Connexion réussie',
      session_token: sessionToken,
      user: sanitizeUser(user),
      must_change_password: user.must_change_password === 1,
    });

  } catch (error: any) {
    console.error('Login error:', error);
    return c.json<LoginResponse>({ 
      success: false, 
      message: 'Erreur serveur lors de la connexion' 
    }, 500);
  }
});

// ============================================================
// POST /api/auth/logout
// Déconnexion utilisateur
// ============================================================
authRoutes.post('/logout', async (c) => {
  try {
    const { DB, KV } = c.env;
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ success: false, message: 'Token manquant' }, 401);
    }

    const sessionToken = authHeader.substring(7);

    // Récupérer session
    const sessionData = await KV.get(`session:${sessionToken}`);
    if (!sessionData) {
      return c.json({ success: false, message: 'Session invalide' }, 401);
    }

    const session = JSON.parse(sessionData);

    // Supprimer session de KV
    await KV.delete(`session:${sessionToken}`);

    // Supprimer session de DB
    await DB.prepare('DELETE FROM sessions WHERE session_token = ?')
      .bind(sessionToken)
      .run();

    // Log activity
    const ipAddress = getClientIP(c.req.raw);
    const userAgent = getUserAgent(c.req.raw);
    
    await DB.prepare(`
      INSERT INTO activity_logs (user_id, action, ip_address, user_agent)
      VALUES (?, 'logout', ?, ?)
    `).bind(session.user_id, ipAddress, userAgent).run();

    return c.json({ success: true, message: 'Déconnexion réussie' });

  } catch (error: any) {
    console.error('Logout error:', error);
    return c.json({ success: false, message: 'Erreur serveur' }, 500);
  }
});

// ============================================================
// GET /api/auth/me
// Récupérer infos utilisateur connecté
// ============================================================
authRoutes.get('/me', async (c) => {
  try {
    const { DB, KV } = c.env;
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ success: false, message: 'Token manquant' }, 401);
    }

    const sessionToken = authHeader.substring(7);

    // Vérifier session en KV
    const sessionData = await KV.get(`session:${sessionToken}`);
    if (!sessionData) {
      return c.json({ success: false, message: 'Session expirée' }, 401);
    }

    const session = JSON.parse(sessionData);

    // Récupérer utilisateur
    const user = await DB.prepare('SELECT * FROM users WHERE id = ? AND is_active = 1')
      .bind(session.user_id)
      .first();

    if (!user) {
      return c.json({ success: false, message: 'Utilisateur introuvable' }, 404);
    }

    return c.json({
      success: true,
      user: sanitizeUser(user),
    });

  } catch (error: any) {
    console.error('Auth/me error:', error);
    return c.json({ success: false, message: 'Erreur serveur' }, 500);
  }
});

// ============================================================
// POST /api/auth/change-password
// Changer mot de passe
// ============================================================
authRoutes.post('/change-password', async (c) => {
  try {
    const { DB, KV } = c.env;
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ success: false, message: 'Token manquant' }, 401);
    }

    const sessionToken = authHeader.substring(7);

    // Vérifier session
    const sessionData = await KV.get(`session:${sessionToken}`);
    if (!sessionData) {
      return c.json({ success: false, message: 'Session expirée' }, 401);
    }

    const session = JSON.parse(sessionData);
    const body = await c.req.json<ChangePasswordRequest>();
    const { old_password, new_password } = body;

    // Validation
    if (!old_password || !new_password) {
      return c.json({ 
        success: false, 
        message: 'Ancien et nouveau mot de passe requis' 
      }, 400);
    }

    // Vérifier force nouveau mot de passe
    const passwordCheck = isStrongPassword(new_password);
    if (!passwordCheck.valid) {
      return c.json({ 
        success: false, 
        message: passwordCheck.message 
      }, 400);
    }

    // Récupérer utilisateur
    const user = await DB.prepare('SELECT * FROM users WHERE id = ?')
      .bind(session.user_id)
      .first() as any;

    if (!user) {
      return c.json({ success: false, message: 'Utilisateur introuvable' }, 404);
    }

    // Vérifier ancien mot de passe
    const oldPasswordValid = await verifyPassword(old_password, user.password_hash);
    if (!oldPasswordValid) {
      return c.json({ 
        success: false, 
        message: 'Ancien mot de passe incorrect' 
      }, 401);
    }

    // Hash nouveau mot de passe
    const newPasswordHash = await hashPassword(new_password);

    // Update en DB
    await DB.prepare(`
      UPDATE users 
      SET password_hash = ?, must_change_password = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(newPasswordHash, user.id).run();

    // Log activity
    const ipAddress = getClientIP(c.req.raw);
    const userAgent = getUserAgent(c.req.raw);
    
    await DB.prepare(`
      INSERT INTO activity_logs (user_id, action, resource_type, ip_address, user_agent)
      VALUES (?, 'change_password', 'user', ?, ?)
    `).bind(user.id, ipAddress, userAgent).run();

    return c.json({ 
      success: true, 
      message: 'Mot de passe modifié avec succès' 
    });

  } catch (error: any) {
    console.error('Change password error:', error);
    return c.json({ success: false, message: 'Erreur serveur' }, 500);
  }
});

export default authRoutes;
