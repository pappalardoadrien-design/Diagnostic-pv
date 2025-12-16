/**
 * Module Auth - Middleware Protection Routes
 * Phase 6: Multi-utilisateurs & Permissions
 * 
 * IMPORTANT: AUTH_ENABLED = false par défaut
 * Mode opt-in pour activation progressive
 */

import { Context, Next } from 'hono';
import type { Bindings, User } from './types';
import { sanitizeUser } from './utils';

// ============================================================
// CONFIGURATION GLOBALE
// ============================================================

/**
 * CRITIQUE: Activation du système auth
 * 
 * false = Middleware désactivé, tout fonctionne comme avant
 * true  = Middleware actif, auth requise
 * 
 * Changez à true pour activer auth après tests
 */
export const AUTH_ENABLED = false;

// ============================================================
// Middleware: Require Authentication
// ============================================================

/**
 * Middleware d'authentification
 * Vérifie qu'un utilisateur est connecté
 */
export async function requireAuth(c: Context<{ Bindings: Bindings }>, next: Next) {
  // Si auth désactivé, skip complètement
  if (!AUTH_ENABLED) {
    return next();
  }

  try {
    const { DB, KV } = c.env;
    const authHeader = c.req.header('Authorization');

    // Vérifier header Authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ 
        success: false, 
        message: 'Authentification requise',
        auth_enabled: true 
      }, 401);
    }

    const sessionToken = authHeader.substring(7);

    // Vérifier session en KV (fast lookup)
    const sessionData = await KV.get(`session:${sessionToken}`);
    if (!sessionData) {
      return c.json({ 
        success: false, 
        message: 'Session expirée',
        auth_enabled: true 
      }, 401);
    }

    const session = JSON.parse(sessionData);

    // Vérifier expiration
    const expiresAt = new Date(session.expires_at);
    if (expiresAt < new Date()) {
      await KV.delete(`session:${sessionToken}`);
      return c.json({ 
        success: false, 
        message: 'Session expirée',
        auth_enabled: true 
      }, 401);
    }

    // Récupérer utilisateur depuis DB
    const user = await DB.prepare('SELECT * FROM auth_users WHERE id = ? AND is_active = 1')
      .bind(session.user_id)
      .first();

    if (!user) {
      return c.json({ 
        success: false, 
        message: 'Utilisateur introuvable ou inactif',
        auth_enabled: true 
      }, 401);
    }

    // Attacher utilisateur au contexte
    c.set('user', sanitizeUser(user));

    return next();

  } catch (error: any) {
    console.error('Auth middleware error:', error);
    return c.json({ 
      success: false, 
      message: 'Erreur authentification',
      auth_enabled: true 
    }, 500);
  }
}

// ============================================================
// Middleware: Require Role
// ============================================================

/**
 * Middleware vérification rôle
 * Vérifie que l'utilisateur a un rôle spécifique
 */
export function requireRole(...allowedRoles: string[]) {
  return async (c: Context<{ Bindings: Bindings }>, next: Next) => {
    // Si auth désactivé, skip
    if (!AUTH_ENABLED) {
      return next();
    }

    const user = c.get('user') as User | undefined;

    if (!user) {
      return c.json({ 
        success: false, 
        message: 'Authentification requise',
        auth_enabled: true 
      }, 401);
    }

    if (!allowedRoles.includes(user.role)) {
      return c.json({ 
        success: false, 
        message: 'Accès interdit - Rôle insuffisant',
        required_roles: allowedRoles,
        auth_enabled: true 
      }, 403);
    }

    return next();
  };
}

// ============================================================
// Middleware: Require Audit Access
// ============================================================

/**
 * Middleware vérification accès audit
 * Vérifie que l'utilisateur a accès à un audit spécifique
 */
export async function requireAuditAccess(
  c: Context<{ Bindings: Bindings }>, 
  next: Next
) {
  // Si auth désactivé, skip
  if (!AUTH_ENABLED) {
    return next();
  }

  try {
    const { DB } = c.env;
    const user = c.get('user') as User | undefined;
    const auditToken = c.req.param('token');

    if (!user) {
      return c.json({ 
        success: false, 
        message: 'Authentification requise',
        auth_enabled: true 
      }, 401);
    }

    if (!auditToken) {
      return c.json({ 
        success: false, 
        message: 'Token audit manquant',
        auth_enabled: true 
      }, 400);
    }

    // Admin a tous les droits
    if (user.role === 'admin') {
      return next();
    }

    // Vérifier assignment
    const assignment = await DB.prepare(`
      SELECT * FROM audit_assignments
      WHERE audit_token = ? AND user_id = ? AND status = 'active'
    `).bind(auditToken, user.id).first();

    if (!assignment) {
      return c.json({ 
        success: false, 
        message: 'Accès interdit à cet audit',
        auth_enabled: true 
      }, 403);
    }

    // Vérifier expiration
    const assignmentData = assignment as any;
    if (assignmentData.expires_at) {
      const expiresAt = new Date(assignmentData.expires_at);
      if (expiresAt < new Date()) {
        return c.json({ 
          success: false, 
          message: 'Permission expirée pour cet audit',
          auth_enabled: true 
        }, 403);
      }
    }

    // Vérifier can_view
    if (!assignmentData.can_view) {
      return c.json({ 
        success: false, 
        message: 'Permission de lecture manquante',
        auth_enabled: true 
      }, 403);
    }

    // Attacher assignment au contexte
    c.set('audit_assignment', assignmentData);

    return next();

  } catch (error: any) {
    console.error('Audit access middleware error:', error);
    return c.json({ 
      success: false, 
      message: 'Erreur vérification accès',
      auth_enabled: true 
    }, 500);
  }
}

// ============================================================
// Helper: Get Current User
// ============================================================

/**
 * Récupère l'utilisateur courant depuis le contexte
 * Retourne null si pas authentifié ou auth désactivé
 */
export function getCurrentUser(c: Context): User | null {
  if (!AUTH_ENABLED) {
    return null;
  }
  return c.get('user') as User | null;
}
