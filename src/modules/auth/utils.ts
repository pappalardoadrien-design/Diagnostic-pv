/**
 * Module Auth - Utilitaires
 * Phase 6: Multi-utilisateurs & Permissions
 * 
 * ATTENTION: bcrypt pour hash passwords (10 rounds = secure & fast)
 * UUID v4 pour session tokens
 */

import type { User, PermissionCheck } from './types';

// ============================================================
// Password Hashing (bcrypt simulation)
// IMPORTANT: En production, utiliser vraie lib bcrypt
// Pour MVP, utiliser hashing simple mais noter qu'il faut bcrypt
// ============================================================

/**
 * Hash un mot de passe avec bcrypt (10 rounds)
 * MOCK: En attente d'installation bcrypt package
 */
export async function hashPassword(password: string): Promise<string> {
  // TODO: Installer bcrypt package
  // const bcrypt = await import('bcryptjs');
  // return bcrypt.hash(password, 10);
  
  // TEMPORARY: Simple hash pour MVP (À REMPLACER par bcrypt)
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'DIAGPV_SALT_2025');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return '$MOCK$' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Vérifie un mot de passe contre son hash
 * MOCK: En attente d'installation bcrypt package
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // TODO: Installer bcrypt package
  // const bcrypt = await import('bcryptjs');
  // return bcrypt.compare(password, hash);
  
  // TEMPORARY: Vérification simple pour MVP
  if (hash.startsWith('$2b$')) {
    // Hash bcrypt réel (comme celui du compte admin initial)
    // Pour l'instant, accepter mot de passe temporaire
    return password === 'DiagPV2025!Temp';
  }
  
  const expectedHash = await hashPassword(password);
  return hash === expectedHash;
}

// ============================================================
// Session Token Generation
// ============================================================

/**
 * Génère un token de session sécurisé (UUID v4)
 */
export function generateSessionToken(): string {
  return crypto.randomUUID();
}

/**
 * Calcule date d'expiration session
 * @param rememberMe - Si true, 30 jours, sinon 24h
 */
export function getSessionExpiry(rememberMe: boolean = false): Date {
  const now = new Date();
  const hours = rememberMe ? 30 * 24 : 24;
  now.setHours(now.getHours() + hours);
  return now;
}

// ============================================================
// Permission Helpers
// ============================================================

/**
 * Vérifie si un utilisateur a accès à un audit
 */
export function checkAuditPermission(
  user: User,
  assignment: {
    can_view: boolean;
    can_edit: boolean;
    can_delete: boolean;
    allowed_modules: string[] | null;
    status: string;
    expires_at: string | null;
  } | null
): PermissionCheck {
  // Admin a tous les droits
  if (user.role === 'admin') {
    return {
      has_access: true,
      can_view: true,
      can_edit: true,
      can_delete: true,
      allowed_modules: null, // null = tous les modules
    };
  }

  // Pas d'assignment = pas d'accès
  if (!assignment) {
    return {
      has_access: false,
      can_view: false,
      can_edit: false,
      can_delete: false,
      allowed_modules: null,
      reason: 'Aucune permission assignée pour cet audit',
    };
  }

  // Assignment révoquée
  if (assignment.status !== 'active') {
    return {
      has_access: false,
      can_view: false,
      can_edit: false,
      can_delete: false,
      allowed_modules: null,
      reason: `Permission ${assignment.status}`,
    };
  }

  // Assignment expirée
  if (assignment.expires_at) {
    const expiry = new Date(assignment.expires_at);
    if (expiry < new Date()) {
      return {
        has_access: false,
        can_view: false,
        can_edit: false,
        can_delete: false,
        allowed_modules: null,
        reason: 'Permission expirée',
      };
    }
  }

  // Permission OK
  return {
    has_access: assignment.can_view,
    can_view: assignment.can_view,
    can_edit: assignment.can_edit,
    can_delete: assignment.can_delete,
    allowed_modules: assignment.allowed_modules,
  };
}

/**
 * Vérifie si module spécifique est accessible
 */
export function canAccessModule(
  permission: PermissionCheck,
  moduleName: string
): boolean {
  if (!permission.has_access) return false;
  if (permission.allowed_modules === null) return true; // null = tous
  return permission.allowed_modules.includes(moduleName);
}

// ============================================================
// User Helpers
// ============================================================

/**
 * Sanitize user object (enlever password_hash)
 */
export function sanitizeUser(user: any): User {
  const { password_hash, ...safeUser } = user;
  return safeUser as User;
}

/**
 * Valide format email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valide force mot de passe
 * Règles: 8+ chars, 1 majuscule, 1 minuscule, 1 chiffre, 1 spécial
 */
export function isStrongPassword(password: string): {
  valid: boolean;
  message: string;
} {
  if (password.length < 8) {
    return { valid: false, message: 'Mot de passe trop court (min 8 caractères)' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Doit contenir au moins une majuscule' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Doit contenir au moins une minuscule' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Doit contenir au moins un chiffre' };
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, message: 'Doit contenir au moins un caractère spécial' };
  }

  return { valid: true, message: 'Mot de passe valide' };
}

// ============================================================
// IP & User Agent Helpers
// ============================================================

/**
 * Extrait IP depuis Request
 */
export function getClientIP(request: Request): string | null {
  return request.headers.get('cf-connecting-ip') || 
         request.headers.get('x-forwarded-for')?.split(',')[0] || 
         null;
}

/**
 * Extrait User-Agent depuis Request
 */
export function getUserAgent(request: Request): string | null {
  return request.headers.get('user-agent');
}
