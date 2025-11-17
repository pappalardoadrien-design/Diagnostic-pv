/**
 * Rate Limiter Module
 * Protection contre attaques brute-force sur /login
 * 
 * Configuration: 10 tentatives max par IP sur 10 minutes
 * Réinitialisation automatique après succès
 */

// Structure de tracking par IP
interface RateLimitRecord {
  count: number;           // Nombre de tentatives
  resetAt: number;         // Timestamp de réinitialisation (ms)
  firstAttempt: number;    // Premier échec (pour logging)
}

// Map en mémoire (Workers = single-threaded, pas de race conditions)
const loginAttempts = new Map<string, RateLimitRecord>();

// Configuration
const MAX_ATTEMPTS = 10;           // 10 tentatives max
const WINDOW_MS = 10 * 60 * 1000;  // 10 minutes

// Liste blanche IPs (admin, bureau DiagPV, etc.)
const WHITELIST_IPS: string[] = [
  // Ajouter IPs de confiance ici si nécessaire
  // '123.456.789.0',  // Bureau DiagPV
];

/**
 * Vérifie si une IP a dépassé la limite de tentatives
 * 
 * @param ip - Adresse IP du client
 * @returns true si autorisé, false si bloqué
 */
export function checkRateLimit(ip: string): boolean {
  // IP null ou localhost = autoriser (dev)
  if (!ip || ip === 'unknown' || ip === '127.0.0.1' || ip === '::1') {
    return true;
  }

  // Liste blanche = bypass
  if (WHITELIST_IPS.includes(ip)) {
    return true;
  }

  const now = Date.now();
  const record = loginAttempts.get(ip);

  // Première tentative OU window expirée = réinitialiser
  if (!record || now > record.resetAt) {
    loginAttempts.set(ip, {
      count: 1,
      resetAt: now + WINDOW_MS,
      firstAttempt: now
    });
    return true;
  }

  // Limite atteinte = bloquer
  if (record.count >= MAX_ATTEMPTS) {
    console.warn(`[RATE LIMIT] IP bloquée: ${ip} (${record.count} tentatives depuis ${new Date(record.firstAttempt).toISOString()})`);
    return false;
  }

  // Incrémenter compteur
  record.count++;
  return true;
}

/**
 * Réinitialise le compteur pour une IP (après login réussi)
 * 
 * @param ip - Adresse IP du client
 */
export function resetRateLimit(ip: string): void {
  if (!ip || ip === 'unknown') return;
  
  const record = loginAttempts.get(ip);
  if (record) {
    console.log(`[RATE LIMIT] Reset IP ${ip} après succès (avait ${record.count} tentatives)`);
  }
  
  loginAttempts.delete(ip);
}

/**
 * Obtient le statut rate limit pour une IP
 * Utile pour afficher message utilisateur avec temps restant
 * 
 * @param ip - Adresse IP du client
 * @returns Statut rate limit
 */
export function getRateLimitStatus(ip: string): {
  isBlocked: boolean;
  attemptsRemaining: number;
  resetInSeconds: number;
  totalAttempts: number;
} {
  if (!ip || WHITELIST_IPS.includes(ip)) {
    return {
      isBlocked: false,
      attemptsRemaining: MAX_ATTEMPTS,
      resetInSeconds: 0,
      totalAttempts: 0
    };
  }

  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record || now > record.resetAt) {
    return {
      isBlocked: false,
      attemptsRemaining: MAX_ATTEMPTS,
      resetInSeconds: 0,
      totalAttempts: 0
    };
  }

  const resetInSeconds = Math.ceil((record.resetAt - now) / 1000);
  const attemptsRemaining = Math.max(0, MAX_ATTEMPTS - record.count);
  const isBlocked = record.count >= MAX_ATTEMPTS;

  return {
    isBlocked,
    attemptsRemaining,
    resetInSeconds,
    totalAttempts: record.count
  };
}

/**
 * Cleanup périodique (optionnel)
 * Supprime les entrées expirées pour éviter fuite mémoire
 * À appeler périodiquement (ex: toutes les heures)
 */
export function cleanupExpiredRecords(): number {
  const now = Date.now();
  let cleaned = 0;

  for (const [ip, record] of loginAttempts.entries()) {
    if (now > record.resetAt) {
      loginAttempts.delete(ip);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`[RATE LIMIT] Cleanup: ${cleaned} entrées expirées supprimées`);
  }

  return cleaned;
}

/**
 * Obtient statistiques globales (monitoring)
 */
export function getGlobalStats(): {
  totalTrackedIPs: number;
  blockedIPs: number;
  totalAttempts: number;
} {
  const now = Date.now();
  let totalAttempts = 0;
  let blockedIPs = 0;

  for (const record of loginAttempts.values()) {
    if (now <= record.resetAt) {
      totalAttempts += record.count;
      if (record.count >= MAX_ATTEMPTS) {
        blockedIPs++;
      }
    }
  }

  return {
    totalTrackedIPs: loginAttempts.size,
    blockedIPs,
    totalAttempts
  };
}
